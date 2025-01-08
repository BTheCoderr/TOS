import axios, { AxiosError } from 'axios';

interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface LinkedInPageData {
  id: string;
  name: string;
  vanityName: string;
  description: string;
  followersCount: number;
  lastActivityTimestamp: number;
}

interface LinkedInMemberData {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  emailAddress: string;
  publicProfileUrl: string;
}

interface LinkedInJobData {
  id: string;
  title: string;
  companyId: string;
  location: string;
  postedAt: number;
  active: boolean;
}

class LinkedInAPI {
  private config: LinkedInConfig;
  private accessToken: string | null = null;
  private readonly baseUrl = 'https://api.linkedin.com/v2';

  constructor(config: LinkedInConfig) {
    this.config = config;
  }

  // Community Management API Methods
  async validatePageActivity(pageId: string): Promise<{ isValid: boolean; details: LinkedInPageData }> {
    try {
      const response = await this.makeRequest('GET', `/organizations/${pageId}`);
      const pageData = response.data as LinkedInPageData;
      
      // Validate page activity based on criteria
      const isValid = this.validatePageCriteria(pageData);
      
      return {
        isValid,
        details: pageData
      };
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  async getPagePosts(pageId: string, limit = 10): Promise<any[]> {
    try {
      const response = await this.makeRequest('GET', `/organizations/${pageId}/posts?count=${limit}`);
      return response.data.elements;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  // Member Data Portability API Methods
  async authenticateJobPoster(memberId: string): Promise<{ isAuthentic: boolean; details: LinkedInMemberData }> {
    try {
      const response = await this.makeRequest('GET', `/people/${memberId}`);
      const memberData = response.data as LinkedInMemberData;
      
      // Validate member authenticity
      const isAuthentic = this.validateMemberCriteria(memberData);
      
      return {
        isAuthentic,
        details: memberData
      };
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  async getMemberEmploymentHistory(memberId: string): Promise<any[]> {
    try {
      const response = await this.makeRequest('GET', `/people/${memberId}/positions`);
      return response.data.elements;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  // Pages Data Portability API Methods
  async crossReferenceJobPosting(pageId: string, jobId: string): Promise<{ isValid: boolean; details: LinkedInJobData }> {
    try {
      const [jobResponse, pageResponse] = await Promise.all([
        this.makeRequest('GET', `/jobs/${jobId}`),
        this.makeRequest('GET', `/organizations/${pageId}`)
      ]);

      const jobData = jobResponse.data as LinkedInJobData;
      const pageData = pageResponse.data as LinkedInPageData;

      // Validate job posting
      const isValid = this.validateJobPosting(jobData, pageData);

      return {
        isValid,
        details: jobData
      };
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  // Private helper methods
  private validatePageCriteria(pageData: LinkedInPageData): boolean {
    const MIN_FOLLOWERS = 100;
    const MAX_INACTIVITY_DAYS = 30;
    
    const daysSinceLastActivity = (Date.now() - pageData.lastActivityTimestamp) / (1000 * 60 * 60 * 24);
    
    return pageData.followersCount >= MIN_FOLLOWERS && daysSinceLastActivity <= MAX_INACTIVITY_DAYS;
  }

  private validateMemberCriteria(memberData: LinkedInMemberData): boolean {
    return !!(
      memberData.firstName &&
      memberData.lastName &&
      memberData.publicProfileUrl &&
      memberData.emailAddress
    );
  }

  private validateJobPosting(jobData: LinkedInJobData, pageData: LinkedInPageData): boolean {
    return jobData.active && jobData.companyId === pageData.id;
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    return axios({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      data,
    });
  }

  private async authenticate() {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });
      
      this.accessToken = response.data.access_token;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  private handleApiError(error: AxiosError) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        this.accessToken = null; // Reset token for re-authentication
      }
      throw new Error(`LinkedIn API Error: ${status} - ${error.response.data}`);
    }
    throw error;
  }
}

export default LinkedInAPI; 