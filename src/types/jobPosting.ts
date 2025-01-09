export interface JobPosting {
  id?: string;
  title: string;
  description: string;
  company: {
    name: string;
    linkedInId?: string;
    website?: string;
    industry?: string;
  };
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[];
  benefits?: string[];
  skills?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  postedDate: Date;
  expiryDate?: Date;
  experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR' | 'EXECUTIVE';
}

export interface JobValidationRules {
  minTitleLength: number;
  maxTitleLength: number;
  minDescriptionLength: number;
  maxDescriptionLength: number;
  requiredFields: string[];
  bannedPhrases: string[];
  suspiciousPhrases: string[];
  spamScoreThreshold: number;
  qualityScoreThreshold: number;
  minimumRequirements: number;
  restrictedDomains: string[];
  locationFormat: RegExp;
  minBenefitsRequired: number;
  maxSkillsAllowed: number;
  minSkillsRequired: number;
  requireContactInfo: boolean;
  industrySpecificRules: Record<string, {
    minTechnicalSkills?: number;
    requiredCertifications?: boolean;
    requireLicensing?: boolean;
    requireCompliance?: boolean;
    requireQualifications?: boolean;
  }>;
}

export interface JobVerificationResult {
  jobId: string;
  title: string;
  company: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  metadata: {
    verifiedAt: string;
    confidence: number;
    source?: string;
  };
  verificationDetails?: {
    score: number;
    checks: Array<{
      name: string;
      passed: boolean;
      details?: string;
    }>;
  };
  flags?: Array<JobPostingFlag>;
  recommendations?: string[];
  validationErrors: string[];
}

export interface JobPostingFlag {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  details?: Record<string, any>;
  suggestedActions?: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  matchedPostings: Array<{
    id: string;
    title: string;
    company: string;
    postedDate: Date;
    similarity: number;
  }>;
}

export interface VerificationCache {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
} 