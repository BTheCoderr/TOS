import axios, { AxiosInstance } from 'axios';
import { LinkedInConfig, LinkedInPageDetails, LinkedInMemberDetails, LinkedInJobDetails, LinkedInVerificationResult } from '../types/linkedin';

class LinkedInAPI {
  private config: LinkedInConfig;
  private accessToken: string | null = null;
  private client: AxiosInstance;
  private static readonly BASE_URL = 'https://api.linkedin.com/v2';

  constructor(config: LinkedInConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: LinkedInAPI.BASE_URL,
      timeout: 10000
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          const { status, data } = error.response;
          switch (status) {
            case 401:
              throw new Error('LinkedIn API authentication failed. Please check your credentials.');
            case 403:
              throw new Error('Access forbidden. Please check your API permissions.');
            case 429:
              throw new Error('Rate limit exceeded. Please try again later.');
            default:
              throw new Error(data.message || 'An error occurred while calling LinkedIn API');
          }
        }
        throw error;
      }
    );
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      });
      this.accessToken = response.data.access_token;
    } catch (error) {
      console.error('LinkedIn authentication failed:', error);
      throw new Error('Failed to authenticate with LinkedIn');
    }
  }

  async validatePageActivity(pageId: string): Promise<LinkedInVerificationResult<LinkedInPageDetails>> {
    await this.ensureAuthenticated();
    
    try {
      // Get organization details
      const orgResponse = await this.client.get(`/organizations/${pageId}`);
      
      // Get follower statistics
      const followersResponse = await this.client.get(`/organizations/${pageId}/followingStatistics`);
      
      // Get recent updates
      const updatesResponse = await this.client.get(`/organizations/${pageId}/updates`, {
        params: {
          start: 0,
          count: 10,
          timeOffset: 2592000 // 30 days in seconds
        }
      });

      const { name, vanityName, description } = orgResponse.data;
      const { followerCount } = followersResponse.data.elements[0];
      const recentPosts = updatesResponse.data.elements;

      const isValid = followerCount > 100 && recentPosts.length > 0;

      return {
        isValid,
        isAuthentic: isValid,
        details: {
          id: pageId,
          name,
          vanityName,
          description,
          websiteUrl: orgResponse.data.websiteUrl,
          industry: orgResponse.data.industry,
          specialties: orgResponse.data.specialties,
          locations: orgResponse.data.locations?.map((loc: any) => ({
            country: loc.country,
            city: loc.city,
            postalCode: loc.postalCode
          }))
        }
      };
    } catch (error) {
      console.error('Page validation error:', error);
      throw error;
    }
  }

  async authenticateJobPoster(memberId: string): Promise<LinkedInVerificationResult<LinkedInMemberDetails>> {
    await this.ensureAuthenticated();
    
    try {
      // Get member profile
      const profileResponse = await this.client.get(`/people/${memberId}`, {
        params: {
          projection: '(id,firstName,lastName,profilePicture,headline,email,positions)'
        }
      });

      const { firstName, lastName, headline, profilePicture, email, positions } = profileResponse.data;
      const currentPosition = positions.values[0];
      
      const isAuthentic = email && currentPosition;

      return {
        isValid: isAuthentic,
        isAuthentic,
        details: {
          id: memberId,
          firstName,
          lastName,
          headline,
          profilePicture,
          emailAddress: email,
          positions: positions.values.map((pos: any) => ({
            title: pos.title,
            company: {
              name: pos.company.name,
              id: pos.company.id
            },
            startDate: pos.startDate,
            endDate: pos.endDate,
            isCurrent: !pos.endDate
          }))
        }
      };
    } catch (error) {
      console.error('Member authentication error:', error);
      throw error;
    }
  }

  async crossReferenceJobPosting(pageId: string, jobId: string): Promise<LinkedInVerificationResult<LinkedInJobDetails>> {
    await this.ensureAuthenticated();
    
    try {
      // Get job posting details
      const jobResponse = await this.client.get(`/jobs/${jobId}`);
      
      const {
        title,
        companyDetails,
        locationDetails,
        postingTimestamp,
        listedAt,
        applicationStatus,
        description,
        employmentType,
        experienceLevel,
        industries,
        skills
      } = jobResponse.data;

      const isValid = applicationStatus === 'ACTIVE' && 
                     companyDetails.company.id === pageId &&
                     (Date.now() - postingTimestamp) < 90 * 24 * 60 * 60 * 1000; // 90 days

      return {
        isValid,
        isAuthentic: isValid,
        details: {
          id: jobId,
          title,
          description,
          company: {
            id: companyDetails.company.id,
            name: companyDetails.company.name
          },
          location: {
            country: locationDetails.country,
            city: locationDetails.city
          },
          postedDate: new Date(listedAt).toISOString(),
          employmentType,
          experienceLevel,
          industries,
          skills
        }
      };
    } catch (error) {
      console.error('Job posting validation error:', error);
      throw error;
    }
  }

  async getMemberEmploymentHistory(memberId: string): Promise<any[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.get(`/people/${memberId}`, {
        params: {
          projection: '(positions)'
        }
      });

      return response.data.positions.values.map((position: any) => ({
        company: position.company.name,
        title: position.title,
        startDate: `${position.startDate.year}-${String(position.startDate.month).padStart(2, '0')}`,
        endDate: position.endDate 
          ? `${position.endDate.year}-${String(position.endDate.month).padStart(2, '0')}`
          : null
      }));
    } catch (error) {
      console.error('Employment history error:', error);
      throw error;
    }
  }
}

export default LinkedInAPI; 