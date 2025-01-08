import { JobPosting } from './jobPosting';

export interface BetaTestingResult {
  success: boolean;
  testId: string;
  timestamp: Date;
  metrics: {
    verificationTime: number;
    confidenceScore: number;
    featureFlags: string[];
  };
  feedback?: {
    issues: string[];
    suggestions: string[];
  };
}

export interface BetaFeedback {
  testId: string;
  userId: string;
  rating: number;
  comments: string;
  issues?: string[];
  featureRequests?: string[];
  timestamp: Date;
}

export interface BetaMetricsFilters {
  startDate?: Date;
  endDate?: Date;
  features?: string[];
  userGroups?: string[];
  testTypes?: string[];
}

export interface BetaTestingMetrics {
  totalTests: number;
  successRate: number;
  averageConfidence: number;
  featureUsage: {
    [key: string]: {
      uses: number;
      successRate: number;
      averageLatency: number;
    };
  };
  userFeedback: {
    averageRating: number;
    commonIssues: Array<{
      issue: string;
      count: number;
    }>;
    suggestions: Array<{
      suggestion: string;
      votes: number;
    }>;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    p95ResponseTime: number;
  };
}

export interface BetaFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  userGroups: string[];
  metrics: {
    usage: number;
    successRate: number;
    performance: {
      averageLatency: number;
      errorRate: number;
    };
  };
} 