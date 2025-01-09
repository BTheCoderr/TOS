import { CompanyDetails, VerificationResult } from '../types';

export function findMockCompany(company: CompanyDetails): VerificationResult {
  return {
    trustScore: 0.95,
    verificationStatus: 'VERIFIED',
    details: {
      companyName: "Mock Company",
      registrationNumber: company.registrationNumber,
      status: "active" as const,
      foundingDate: "2020-01-01",
      locations: ["Mock Address"]
    },
    metadata: {
      verifiedAt: new Date().toISOString(),
      source: "MOCK",
      confidence: 0.95
    }
  };
} 