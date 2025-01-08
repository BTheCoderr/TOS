const axios = require('axios');
const MonitoringService = require('./MonitoringService');

class LinkedInService {
  constructor() {
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
    if (!LinkedInService.instance) {
      LinkedInService.instance = new LinkedInService();
    }
    return LinkedInService.instance;
  }

  async verifyCompany(companyData) {
    try {
      // Search for company by name
      const searchResponse = await this.apiClient.get('/organizations', {
        params: {
          q: 'search',
          keywords: companyData.companyName
        }
      });

      if (!searchResponse.data.elements || searchResponse.data.elements.length === 0) {
        return null;
      }

      // Get the first matching company
      const company = searchResponse.data.elements[0];
      
      // Get detailed company information
      const detailedInfo = await this.apiClient.get(`/organizations/${company.id}`, {
        params: {
          fields: 'id,name,description,website,industry,locations,staffCount,specialties,founded'
        }
      });

      return {
        linkedInId: detailedInfo.data.id,
        name: detailedInfo.data.name,
        description: detailedInfo.data.description,
        website: detailedInfo.data.website,
        industry: detailedInfo.data.industry,
        locations: detailedInfo.data.locations,
        employeeCount: detailedInfo.data.staffCount,
        specialties: detailedInfo.data.specialties,
        foundedYear: detailedInfo.data.founded,
        matchScore: this.calculateMatchScore(companyData, detailedInfo.data)
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'LinkedIn',
        companyName: companyData.companyName
      });
      return null;
    }
  }

  calculateMatchScore(inputData, linkedInData) {
    let score = 0;
    const maxScore = 100;

    // Name similarity check (basic for now, could be enhanced with fuzzy matching)
    if (linkedInData.name.toLowerCase().includes(inputData.companyName.toLowerCase()) ||
        inputData.companyName.toLowerCase().includes(linkedInData.name.toLowerCase())) {
      score += 40;
    }

    // Company maturity check
    if (linkedInData.founded) {
      score += 20;
    }

    // Size verification
    if (linkedInData.staffCount > 0) {
      score += 20;
    }

    // Location and additional info check
    if (linkedInData.locations && linkedInData.locations.length > 0) {
      score += 10;
    }

    if (linkedInData.website) {
      score += 10;
    }

    return Math.min(score, maxScore);
  }
}

module.exports = LinkedInService; 