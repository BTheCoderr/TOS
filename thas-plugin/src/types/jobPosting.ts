export interface JobPosting {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    linkedInId?: string;
    verificationStatus: 'Verified' | 'Pending' | 'Failed';
  };
  description: string;
  requirements: string[];
  location: {
    city: string;
    country: string;
    remote?: boolean;
  };
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  postedBy: {
    userId: string;
    role: string;
    verified: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'REJECTED';
  verificationDetails?: {
    score: number;
    lastVerified: Date;
    verificationSource: string[];
    issues?: string[];
  };
} 