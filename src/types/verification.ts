export interface CompanyVerificationResult {
  isVerified: boolean;
  confidence: number;
  companyDetails: {
    name: string;
    registrationNumber: string;
    jurisdiction: string;
    incorporationDate: string;
    status: string;
    address: string;
  };
  verificationSource: string;
  lastVerified: Date;
  warnings: string[];
  scores: {
    nameMatchScore: number;
    addressVerificationScore: number;
    activityScore: number;
    registrationScore: number;
    ageScore: number;
  };
  verificationDetails: {
    addressVerified: boolean;
    registrationVerified: boolean;
    hasActiveStatus: boolean;
    hasFilingHistory: boolean;
    hasVerifiedOfficers: boolean;
  };
}

export interface CompanyVerificationRequest {
  name: string;
  registrationNumber?: string;
  jurisdiction?: string;
  address?: string;
}

export interface VerificationCache {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface OpenCorporatesCompany {
  name: string;
  company_number: string;
  jurisdiction_code: string;
  incorporation_date: string;
  current_status: string;
  registered_address_in_full: string;
  company_type: string;
  registry_url: string;
  officers: Array<{
    name: string;
    position: string;
    start_date: string;
  }>;
  filings: Array<{
    date: string;
    type: string;
    description: string;
  }>;
}

export interface OpenCorporatesResponse {
  results: {
    companies: Array<{
      company: OpenCorporatesCompany;
    }>;
  };
}

export interface VerificationWeights {
  nameMatch: number;
  addressVerification: number;
  activityStatus: number;
  registration: number;
  age: number;
}

export interface CompanyDetails {
  name: string;
  registrationNumber: string;
  status: 'active' | 'inactive' | 'unknown';
  jurisdiction: string;
  incorporationDate?: string;
  address?: string;
  location?: string;
  industry?: string;
  city?: string;
}

export interface VerificationMetadata {
  verifiedAt: string;
  source: string;
  confidence: number;
}

export interface VerificationResult {
  isVerified: boolean;
  details: CompanyDetails;
  metadata: VerificationMetadata;
  matched?: boolean;
}

export interface VerificationFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: any;
}

export interface ApiConfig {
  apiKey?: string;
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  salary?: {
    min: number;
    max: number;
  };
  skills?: string[];
  experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR';
  // ... other fields
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarJobId?: string;
  similarity?: number;
}

export interface CompanyVerificationResponse {
  success: boolean;
  data: VerificationResult;
  timestamp: string;
}

export interface VerificationError {
  error: string;
  code: string;
  message: string;
} 