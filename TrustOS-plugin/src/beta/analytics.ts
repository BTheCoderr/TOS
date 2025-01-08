import { EventEmitter } from 'events';

interface AnalyticsEvent {
  eventType: string;
  timestamp: number;
  userId: string;
  data: any;
}

interface MetricsData {
  trustScoresGenerated: number;
  flaggedPosts: number;
  apiCallsCount: number;
  averageResponseTime: number;
  errorRate: number;
}

class BetaAnalytics extends EventEmitter {
  private events: AnalyticsEvent[] = [];
  private metrics: MetricsData = {
    trustScoresGenerated: 0,
    flaggedPosts: 0,
    apiCallsCount: 0,
    averageResponseTime: 0,
    errorRate: 0
  };

  constructor() {
    super();
    this.setupEventListeners();
  }

  // Event tracking
  trackEvent(eventType: string, userId: string, data: any) {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      userId,
      data
    };

    this.events.push(event);
    this.emit('newEvent', event);
    this.updateMetrics(event);
  }

  // Metrics tracking
  private updateMetrics(event: AnalyticsEvent) {
    switch (event.eventType) {
      case 'trustScore:generated':
        this.metrics.trustScoresGenerated++;
        break;
      case 'post:flagged':
        this.metrics.flaggedPosts++;
        break;
      case 'api:call':
        this.metrics.apiCallsCount++;
        this.updateResponseTime(event.data.responseTime);
        break;
      case 'api:error':
        this.updateErrorRate();
        break;
    }
  }

  // Specific metric updates
  private updateResponseTime(newTime: number) {
    const currentTotal = this.metrics.averageResponseTime * (this.metrics.apiCallsCount - 1);
    this.metrics.averageResponseTime = (currentTotal + newTime) / this.metrics.apiCallsCount;
  }

  private updateErrorRate() {
    const errorCount = this.events.filter(e => e.eventType === 'api:error').length;
    this.metrics.errorRate = errorCount / this.metrics.apiCallsCount;
  }

  // Analytics retrieval
  getMetrics(): MetricsData {
    return { ...this.metrics };
  }

  getEvents(filters?: { 
    eventType?: string, 
    userId?: string, 
    startTime?: number, 
    endTime?: number 
  }): AnalyticsEvent[] {
    let filteredEvents = [...this.events];

    if (filters) {
      if (filters.eventType) {
        filteredEvents = filteredEvents.filter(e => e.eventType === filters.eventType);
      }
      if (filters.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
      }
      if (filters.startTime) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startTime);
      }
      if (filters.endTime) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endTime);
      }
    }

    return filteredEvents;
  }

  // Event listeners
  private setupEventListeners() {
    this.on('newEvent', (event: AnalyticsEvent) => {
      console.log(`New event tracked: ${event.eventType} for user ${event.userId}`);
    });
  }

  // Generate reports
  generateReport(startTime: number, endTime: number) {
    const periodEvents = this.getEvents({ startTime, endTime });
    
    return {
      period: {
        start: new Date(startTime),
        end: new Date(endTime)
      },
      metrics: this.getMetrics(),
      eventCounts: this.getEventCounts(periodEvents),
      topUsers: this.getTopUsers(periodEvents),
      errorAnalysis: this.getErrorAnalysis(periodEvents)
    };
  }

  private getEventCounts(events: AnalyticsEvent[]) {
    return events.reduce((counts, event) => {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private getTopUsers(events: AnalyticsEvent[]) {
    const userCounts = events.reduce((counts, event) => {
      counts[event.userId] = (counts[event.userId] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }

  private getErrorAnalysis(events: AnalyticsEvent[]) {
    const errors = events.filter(e => e.eventType === 'api:error');
    return {
      totalErrors: errors.length,
      errorTypes: this.getEventCounts(errors)
    };
  }
}

export default BetaAnalytics; 