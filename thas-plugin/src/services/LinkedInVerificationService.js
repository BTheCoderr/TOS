const axios = require('axios');
const Cache = require('../utils/cache');
const MonitoringService = require('./MonitoringService');

class LinkedInVerificationService {
  constructor() {
    this.cache = Cache;
    this.MINIMUM_THRESHOLD = 70;
    this.CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
    this.apiClient = axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      }
    });
  }

  static getInstance() {
    if (!LinkedInVerificationService.instance) {
      LinkedInVerificationService.instance = new LinkedInVerificationService();
    }
    return LinkedInVerificationService.instance;
  }

  async verifyCompany(companyData) {
    try {
      const startTime = process.hrtime();

      // Check cache first
      const cacheKey = `linkedin:${companyData.linkedInId}`;
      const cachedResult = await this.cache.get(cacheKey);
      if (cachedResult) {
        return this.enrichVerificationData(JSON.parse(cachedResult));
      }

      // Fetch company data
      const [companyProfile, employeeCount, posts] = await Promise.all([
        this.getCompanyProfile(companyData.linkedInId),
        this.getEmployeeCount(companyData.linkedInId),
        this.getRecentPosts(companyData.linkedInId)
      ]);

      // Calculate scores
      const presenceScore = this.calculatePresenceScore({
        profileCompleteness: this.evaluateProfileCompleteness(companyProfile),
        employeeCount,
        postFrequency: this.analyzePostFrequency(posts)
      });

      const verificationResult = {
        verified: presenceScore > this.MINIMUM_THRESHOLD,
        confidence: presenceScore,
        lastUpdated: new Date(),
        metadata: {
          employeeCount,
          foundedYear: companyProfile.foundedYear,
          industry: companyProfile.industry,
          locations: companyProfile.locations,
          specialties: companyProfile.specialties
        }
      };

      // Cache the result
      await this.cache.set(
        cacheKey,
        JSON.stringify(verificationResult),
        'EX',
        this.CACHE_TTL
      );

      // Record metrics
      const duration = process.hrtime(startTime);
      MonitoringService.recordVerificationAttempt(
        duration[0] + duration[1] / 1e9,
        verificationResult.verified ? 'Verified' : 'Failed'
      );

      return this.enrichVerificationData(verificationResult);
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedInVerification',
        companyData
      });
      throw error;
    }
  }

  evaluateProfileCompleteness(profile) {
    const requiredFields = [
      'name',
      'industry',
      'foundedYear',
      'locations',
      'specialties',
      'description'
    ];
    
    const completedFields = requiredFields.filter(field => 
      profile[field] && 
      (typeof profile[field] === 'string' ? profile[field].trim() !== '' : true)
    );

    return (completedFields.length / requiredFields.length) * 100;
  }

  analyzePostFrequency(posts) {
    if (!posts || posts.length === 0) return 0;

    const now = new Date();
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
    
    const recentPosts = posts.filter(post => 
      new Date(post.created) >= sixMonthsAgo
    );

    // Score based on post frequency (max score for 24+ posts in 6 months)
    return Math.min((recentPosts.length / 24) * 100, 100);
  }

  calculatePresenceScore({ profileCompleteness, employeeCount, postFrequency }) {
    // Weighted scoring
    const weights = {
      profileCompleteness: 0.4,
      employeeCount: 0.4,
      postFrequency: 0.2
    };

    const employeeCountScore = Math.min((employeeCount / 50) * 100, 100);

    return (
      profileCompleteness * weights.profileCompleteness +
      employeeCountScore * weights.employeeCount +
      postFrequency * weights.postFrequency
    );
  }

  identifyRiskFactors(result) {
    const risks = [];

    if (result.metadata.employeeCount < 10) {
      risks.push({
        type: 'LOW_EMPLOYEE_COUNT',
        severity: 'medium',
        description: 'Company has very few employees on LinkedIn'
      });
    }

    if (!result.metadata.foundedYear) {
      risks.push({
        type: 'MISSING_FOUNDED_YEAR',
        severity: 'low',
        description: 'Company founding year not provided'
      });
    }

    if (result.confidence < 80) {
      risks.push({
        type: 'LOW_CONFIDENCE',
        severity: 'high',
        description: 'Overall verification confidence is below recommended threshold'
      });
    }

    return risks;
  }

  generateConfidenceExplanation(result) {
    const factors = [];

    if (result.metadata.employeeCount > 50) {
      factors.push('Established employee presence on LinkedIn');
    }

    if (result.metadata.foundedYear) {
      const age = new Date().getFullYear() - result.metadata.foundedYear;
      if (age > 2) {
        factors.push(`Company has been operating for ${age} years`);
      }
    }

    if (result.confidence > 80) {
      factors.push('Strong overall LinkedIn presence');
    }

    return {
      overallConfidence: result.confidence,
      positiveFactors: factors,
      riskFactors: this.identifyRiskFactors(result)
    };
  }

  enrichVerificationData(result) {
    return {
      ...result,
      riskFactors: this.identifyRiskFactors(result),
      confidenceExplanation: this.generateConfidenceExplanation(result)
    };
  }

  async getCompanyProfile(linkedInId) {
    try {
      const response = await this.apiClient.get(`/organizations/${linkedInId}`, {
        params: {
          fields: 'id,name,description,foundedYear,industries,specialties,locations,staffCount,vanityName'
        }
      });

      return {
        name: response.data.name,
        description: response.data.description,
        foundedYear: response.data.foundedYear,
        industry: response.data.industries?.[0]?.name,
        locations: response.data.locations?.map(loc => ({
          country: loc.country,
          city: loc.city,
          region: loc.region
        })),
        specialties: response.data.specialties,
        vanityName: response.data.vanityName
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn API',
        method: 'getCompanyProfile',
        linkedInId
      });
      throw error;
    }
  }

  async getEmployeeCount(linkedInId) {
    try {
      const response = await this.apiClient.get(`/organizations/${linkedInId}/staffCount`);
      return response.data.staffCount;
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn API',
        method: 'getEmployeeCount',
        linkedInId
      });
      return 0;
    }
  }

  async getRecentPosts(linkedInId) {
    try {
      const response = await this.apiClient.get(`/organizations/${linkedInId}/updates`, {
        params: {
          q: 'authors',
          authors: [`urn:li:organization:${linkedInId}`],
          count: 50,
          start: 0
        }
      });

      return response.data.elements.map(post => ({
        created: post.created.time,
        message: post.message?.text,
        engagement: {
          likes: post.socialDetail?.numLikes || 0,
          comments: post.socialDetail?.numComments || 0,
          shares: post.socialDetail?.numShares || 0
        }
      }));
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn API',
        method: 'getRecentPosts',
        linkedInId
      });
      return [];
    }
  }

  async validateJobPoster(memberId) {
    try {
      const response = await this.apiClient.get(`/people/${memberId}`, {
        params: {
          fields: 'id,firstName,lastName,positions'
        }
      });

      const currentPosition = response.data.positions?.elements?.[0];
      
      return {
        isValid: !!currentPosition,
        currentRole: currentPosition ? {
          title: currentPosition.title,
          companyName: currentPosition.companyName,
          startDate: currentPosition.startDate
        } : null
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn API',
        method: 'validateJobPoster',
        memberId
      });
      return { isValid: false };
    }
  }

  async performComprehensiveVerification(companyData) {
    try {
      const [
        profile,
        employeeCount,
        posts,
        pageStats
      ] = await Promise.all([
        this.getCompanyProfile(companyData.linkedInId),
        this.getEmployeeCount(companyData.linkedInId),
        this.getRecentPosts(companyData.linkedInId),
        this.getPageStats(companyData.linkedInId)
      ]);

      const verificationScore = this.calculateVerificationScore({
        profile,
        employeeCount,
        posts,
        pageStats
      });

      return {
        score: verificationScore,
        details: {
          profile,
          employeeCount,
          activity: {
            postCount: posts.length,
            engagement: this.calculateEngagement(posts)
          },
          pageStats
        }
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn API',
        method: 'performComprehensiveVerification',
        companyData
      });
      throw error;
    }
  }

  async getPageStats(linkedInId) {
    try {
      const response = await this.apiClient.get(`/organizations/${linkedInId}/statistics`);
      return {
        followerCount: response.data.followerCount,
        employeeCount: response.data.employeeCount,
        updateCount: response.data.updateCount,
        engagementRate: response.data.engagementRate
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn API',
        method: 'getPageStats',
        linkedInId
      });
      return null;
    }
  }

  calculateEngagement(posts) {
    if (!posts.length) return 0;

    const totalEngagement = posts.reduce((sum, post) => {
      const engagement = post.engagement;
      return sum + engagement.likes + engagement.comments + engagement.shares;
    }, 0);

    return totalEngagement / posts.length;
  }

  calculateVerificationScore({ profile, employeeCount, posts, pageStats }) {
    const weights = {
      profileCompleteness: 0.3,
      employeePresence: 0.3,
      activity: 0.2,
      engagement: 0.2
    };

    const scores = {
      profileCompleteness: this.evaluateProfileCompleteness(profile),
      employeePresence: Math.min((employeeCount / 50) * 100, 100),
      activity: this.analyzePostFrequency(posts),
      engagement: pageStats ? Math.min((pageStats.engagementRate / 0.05) * 100, 100) : 0
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key] * weight);
    }, 0);
  }
}

module.exports = LinkedInVerificationService; 