export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface LinkedInPageDetails {
  id: string;
  name: string;
  vanityName: string;
  description?: string;
  websiteUrl?: string;
  industry?: string;
  specialties?: string[];
  locations?: Array<{
    country: string;
    city?: string;
    postalCode?: string;
  }>;
}

export interface LinkedInMemberDetails {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  profilePicture?: {
    displayImage: string;
  };
  emailAddress?: string;
  positions?: Array<{
    title: string;
    company: {
      name: string;
      id?: string;
    };
    startDate?: {
      month: number;
      year: number;
    };
    endDate?: {
      month: number;
      year: number;
    };
    isCurrent: boolean;
  }>;
}

export interface LinkedInJobDetails {
  id: string;
  title: string;
  description: string;
  company: {
    id: string;
    name: string;
  };
  location: {
    country: string;
    city?: string;
  };
  postedDate: string;
  applicationUrl?: string;
  employmentType?: string;
  experienceLevel?: string;
  industries?: string[];
  skills?: string[];
}

export interface LinkedInVerificationResult<T> {
  isValid: boolean;
  isAuthentic: boolean;
  details: T;
  metadata?: {
    verifiedAt: string;
    source: string;
    confidence: number;
  };
} 