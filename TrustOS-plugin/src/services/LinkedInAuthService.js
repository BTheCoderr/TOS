const axios = require('axios');
const MonitoringService = require('./MonitoringService');

class LinkedInAuthService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    this.scope = 'r_organization_social r_organization_admin r_organization';
  }

  static getInstance() {
    if (!LinkedInAuthService.instance) {
      LinkedInAuthService.instance = new LinkedInAuthService();
    }
    return LinkedInAuthService.instance;
  }

  getAuthorizationUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: this.generateState()
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async getAccessToken(authorizationCode) {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code: authorizationCode,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn Auth',
        action: 'getAccessToken'
      });
      throw new Error('Failed to get LinkedIn access token');
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn Auth',
        action: 'refreshAccessToken'
      });
      throw new Error('Failed to refresh LinkedIn access token');
    }
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }

  async validateState(state, savedState) {
    return state === savedState;
  }
}

module.exports = LinkedInAuthService; 