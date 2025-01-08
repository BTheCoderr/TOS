const axios = require('axios');
const MonitoringService = require('./MonitoringService');
const CompanyVerificationService = require('./CompanyVerificationService');

class BetaTestingService {
  static jobBoardPartners = {
    indeed: {
      name: 'Indeed',
      baseUrl: 'https://apis.indeed.com/v2',
      apiKey: process.env.INDEED_API_KEY
    },
    glassdoor: {
      name: 'Glassdoor',
      baseUrl: 'https://api.glassdoor.com/v1',
      apiKey: process.env.GLASSDOOR_API_KEY
    }
  };

  static async verifyCompanyForPartner(partnerName, companyData) {
    try {
      const partner = this.jobBoardPartners[partnerName.toLowerCase()];
      if (!partner) {
        throw new Error(`Unknown partner: ${partnerName}`);
      }

      // Start verification process
      const startTime = process.hrtime();
      const verificationResult = await CompanyVerificationService.verifyCompany(companyData);

      // Record partner-specific metrics
      const duration = process.hrtime(startTime);
      this.recordPartnerMetrics(partner.name, duration, verificationResult);

      // Enrich verification result with partner-specific data
      const enrichedResult = await this.enrichVerificationData(partner, companyData, verificationResult);

      return enrichedResult;
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'BetaTesting',
        partner: partnerName,
        companyData
      });
      throw error;
    }
  }

  static async enrichVerificationData(partner, companyData, verificationResult) {
    try {
      // Get partner-specific company data
      const partnerData = await this.getPartnerCompanyData(partner, companyData);
      
      return {
        ...verificationResult,
        partnerData: {
          source: partner.name,
          data: partnerData,
          timestamp: new Date()
        }
      };
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'DataEnrichment',
        partner: partner.name,
        companyData
      });
      return verificationResult;
    }
  }

  static async getPartnerCompanyData(partner, companyData) {
    const apiClient = axios.create({
      baseURL: partner.baseUrl,
      headers: {
        'Authorization': `Bearer ${partner.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    switch (partner.name.toLowerCase()) {
      case 'indeed':
        return this.getIndeedCompanyData(apiClient, companyData);
      case 'glassdoor':
        return this.getGlassdoorCompanyData(apiClient, companyData);
      default:
        return null;
    }
  }

  static async getIndeedCompanyData(apiClient, companyData) {
    try {
      const response = await apiClient.get('/company/search', {
        params: {
          q: companyData.companyName,
          limit: 1
        }
      });
      return response.data;
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'Indeed API',
        companyName: companyData.companyName
      });
      return null;
    }
  }

  static async getGlassdoorCompanyData(apiClient, companyData) {
    try {
      const response = await apiClient.get('/employer/info', {
        params: {
          q: companyData.companyName
        }
      });
      return response.data;
    } catch (error) {
      MonitoringService.logError(error, {
        service: 'Glassdoor API',
        companyName: companyData.companyName
      });
      return null;
    }
  }

  static recordPartnerMetrics(partnerName, duration, result) {
    const durationSeconds = duration[0] + duration[1] / 1e9;
    
    MonitoringService.recordVerificationAttempt(durationSeconds, result.status);
    MonitoringService.recordApiRequest(
      `/partner/${partnerName.toLowerCase()}/verify`,
      'POST',
      result.status === 'Verified' ? 200 : 400
    );

    // Log the verification event with partner context
    MonitoringService.logVerificationEvent({
      partnerName,
      ...result
    }, result);
  }
}

module.exports = BetaTestingService; 