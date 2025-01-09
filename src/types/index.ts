export interface ApiConfig {
  openCorporates: {
    apiKey: string;
    baseUrl: string;
  };
  companiesHouse: {
    apiKey: string;
    baseUrl: string;
  };
}

export interface CompanyDetails {
  name: string;
  registrationNumber: string;
  location: string;
  address?: string;
  industry?: string;
}

export interface VerificationResult {
  trustScore: number;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  details: {
    companyName: string;
    registrationNumber: string;
    status: 'active' | 'inactive' | 'unknown';
    foundingDate?: string;
    employeeCount?: number;
    industry?: string;
    locations?: string[];
  };
  metadata: {
    verifiedAt: string;
    source: string;
    confidence: number;
    hasFilings?: boolean;
  };
} 