export interface VerificationStats {
  totalVerifications: number;
  verifiedJobs: number;
  flaggedJobs: number;
  averageConfidence: number;
  commonFlags: Array<{
    type: string;
    count: number;
  }>;
  lastUpdated: string;
}

export interface DetailedStats extends VerificationStats {
  verificationRate: number;
  flagRate: number;
  flagDistribution: Record<string, number>;
  timeStats: {
    lastUpdated: Date;
    averageVerificationsPerDay: number;
  };
}

export interface StatsCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
} 