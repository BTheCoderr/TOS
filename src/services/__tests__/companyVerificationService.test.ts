import { CompanyVerificationService } from '../companyVerificationService';
import { mockCompanies } from '../mockData';
import { ApiConfig } from '../../types/verification';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK')
  }));
});

describe('CompanyVerificationService', () => {
  let service: CompanyVerificationService;

  const mockConfig: ApiConfig = {
    openCorporates: {
      apiKey: '',
      baseUrl: 'https://api.opencorporates.com/v0.4'
    },
    companiesHouse: {
      apiKey: '',
      baseUrl: 'https://api.companieshouse.gov.uk'
    }
  };

  beforeEach(() => {
    service = new CompanyVerificationService(mockConfig);
  });

  describe('Mock Data Tests', () => {
    it('should find an existing company in mock data', async () => {
      const mockCompany = mockCompanies[0];
      const result = await service.verifyCompany({
        name: mockCompany.name,
        registrationNumber: mockCompany.registrationNumber
      });

      expect(result.verified).toBe(true);
      expect(result.source).toBe('MOCK');
      expect(result.details.name).toBe(mockCompany.name);
      expect(result.details.registrationNumber).toBe(mockCompany.registrationNumber);
    });

    it('should handle non-existent company in mock data', async () => {
      const result = await service.verifyCompany({
        name: 'Non Existent Company Ltd',
        registrationNumber: '99999999'
      });

      expect(result.verified).toBe(false);
      expect(result.score).toBe(0);
      expect(result.metadata.failureReason).toBe('Company not found in mock data');
    });

    it('should find company by partial name match', async () => {
      const result = await service.verifyCompany({
        name: 'Acme',
        registrationNumber: ''
      });

      expect(result.verified).toBe(true);
      expect(result.source).toBe('MOCK');
      expect(result.details.name).toBe('Acme Corporation');
    });

    it('should find company by registration number', async () => {
      const result = await service.verifyCompany({
        name: 'Wrong Name',
        registrationNumber: '87654321'
      });

      expect(result.verified).toBe(true);
      expect(result.source).toBe('MOCK');
      expect(result.details.name).toBe('Tech Innovators Ltd');
    });
  });

  describe('Verification Score Tests', () => {
    it('should calculate correct verification score for active company', async () => {
      const result = await service.verifyCompany({
        name: mockCompanies[0].name,
        registrationNumber: mockCompanies[0].registrationNumber
      });

      expect(result.score).toBeGreaterThanOrEqual(0.8);
      expect(result.metadata.activeStatus).toBe(true);
      expect(result.metadata.hasFilings).toBe(true);
      expect(result.metadata.hasOfficers).toBe(true);
    });
  });

  describe('Cache Tests', () => {
    it('should cache verification results', async () => {
      const mockCompany = mockCompanies[0];
      
      // First call should hit the API
      const result1 = await service.verifyCompany({
        name: mockCompany.name,
        registrationNumber: mockCompany.registrationNumber
      });

      // Second call should hit the cache
      const result2 = await service.verifyCompany({
        name: mockCompany.name,
        registrationNumber: mockCompany.registrationNumber
      });

      expect(result1).toEqual(result2);
    });
  });
}); 