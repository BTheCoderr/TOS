export interface Event {
  id: string;
  type: string;
  eventType: string;
  userId: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface EventFilter {
  eventType?: string;
  userId?: string;
  startTime?: number;
  endTime?: number;
}

export interface Metrics {
  totalEvents: number;
  eventTypes: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
}

export interface AnalyticsReport {
  timeRange: {
    start: number;
    end: number;
  };
  metrics: Metrics;
  events: Event[];
  eventCounts: Record<string, number>;
  topUsers: Array<{
    userId: string;
    eventCount: number;
  }>;
}

export interface JobPostingMetrics {
  totalPosts: number;
  verifiedPosts: number;
  flaggedPosts: number;
  averageConfidence: number;
  flagDistribution: Record<string, number>;
  industryDistribution: Record<string, number>;
  salaryRanges: Record<string, {
    min: number;
    max: number;
    average: number;
    count: number;
  }>;
  topSkills: Array<{
    name: string;
    count: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  }>;
} 