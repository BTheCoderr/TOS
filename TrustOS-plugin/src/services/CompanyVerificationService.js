const axios = require('axios');
const cache = require('../utils/cache');
const Company = require('../models/Company');
const VerificationHistory = require('../models/VerificationHistory');
const LinkedInService = require('./LinkedInService');
const MonitoringService = require('./MonitoringService');

class CompanyVerificationService {
  static async verifyCompany(companyData) {
    const { companyName, registrationNumber } = companyData;

    // Check cache
    const cacheKey = `company:${registrationNumber}`;
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Hierarchical verification
    const verificationResult = await this.hierarchicalVerification(companyData);
    
    // Save to database and cache
    const company = await Company.findOneAndUpdate(
      { registrationNumber },
      {
        ...verificationResult,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Record verification history
    await this.recordVerificationHistory(company._id, verificationResult);

    // Cache the result
    await cache.set(cacheKey, JSON.stringify(verificationResult));
    
    return verificationResult;
  }

  static async hierarchicalVerification(companyData) {
    // Primary verification sources
    const primaryResults = await this.primaryVerificationSources(companyData);
    
    // Secondary verification (if primary passes threshold)
    let secondaryResults = null;
    if (primaryResults.score >= 40) {
      secondaryResults = await this.secondaryVerificationSources(companyData);
    }

    // Calculate final trust score
    const trustScore = this.calculateCompositeTrustScore(primaryResults, secondaryResults);

    return {
      companyName: companyData.companyName,
      registrationNumber: companyData.registrationNumber,
      status: trustScore >= 80 ? 'Verified' : 'Pending',
      trustScore,
      verificationDetails: {
        primary: primaryResults,
        secondary: secondaryResults
      }
    };
  }

  static async primaryVerificationSources(companyData) {
    const results = {
      sources: [],
      score: 0
    };

    // OpenCorporates verification
    const openCorpResult = await this.checkOpenCorporates(companyData);
    if (openCorpResult?.results?.length > 0) {
      results.sources.push({
        name: 'OpenCorporates',
        status: 'Success',
        data: openCorpResult
      });
      results.score += 40;
    }

    // Government registry verification (placeholder)
    const govRegistryResult = await this.checkGovernmentRegistry(companyData);
    if (govRegistryResult) {
      results.sources.push({
        name: 'Government Registry',
        status: 'Success',
        data: govRegistryResult
      });
      results.score += 20;
    }

    return results;
  }

  static async secondaryVerificationSources(companyData) {
    const results = {
      sources: [],
      score: 0
    };

    // LinkedIn verification
    try {
      const linkedInService = LinkedInService.getInstance();
      const linkedInResult = await linkedInService.verifyCompany(companyData);
      
      if (linkedInResult) {
        results.sources.push({
          name: 'LinkedIn',
          status: 'Success',
          data: linkedInResult,
          score: linkedInResult.matchScore
        });
        results.score += Math.min(30, linkedInResult.matchScore / 3); // Max 30 points from LinkedIn
      }
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn Verification',
        companyData
      });
    }

    // D&B verification (placeholder)
    const dnbResult = await this.checkDnB(companyData);
    if (dnbResult) {
      results.sources.push({
        name: 'D&B',
        status: 'Success',
        data: dnbResult
      });
      results.score += 20;
    }

    return results;
  }

  static calculateCompositeTrustScore(primary, secondary) {
    let score = primary.score;
    
    if (secondary) {
      score += secondary.score;
    }

    return Math.min(score, 100);
  }

  static async recordVerificationHistory(companyId, verificationResult) {
    const history = new VerificationHistory({
      companyId,
      verificationStatus: verificationResult.status,
      source: 'Hierarchical Verification',
      trustScore: verificationResult.trustScore,
      verificationData: verificationResult.verificationDetails
    });

    await history.save();
  }

  static async checkOpenCorporates(companyData) {
    try {
      const response = await axios.get(
        `${process.env.OPENCORPORATES_API_URL}/companies/search`,
        {
          params: {
            q: companyData.companyName,
            company_number: companyData.registrationNumber,
          },
          headers: {
            'Authorization': `Bearer ${process.env.OPENCORPORATES_API_KEY}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('OpenCorporates API error:', error);
      return null;
    }
  }

  static async checkGovernmentRegistry(companyData) {
    // Placeholder for government registry integration
    return null;
  }

  static async checkDnB(companyData) {
    // Placeholder for D&B API integration
    return null;
  }
}

module.exports = CompanyVerificationService; 