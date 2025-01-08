import BetaAnalytics from '../analytics';

describe('BetaAnalytics', () => {
  let analytics: BetaAnalytics;

  beforeEach(() => {
    analytics = new BetaAnalytics();
  });

  describe('Event Tracking', () => {
    it('should track events correctly', () => {
      const eventData = { responseTime: 100 };
      analytics.trackEvent('api:call', 'user1', eventData);

      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        eventType: 'api:call',
        userId: 'user1',
        data: eventData
      });
    });

    it('should filter events by type', () => {
      analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      analytics.trackEvent('trustScore:generated', 'user1', { score: 0.8 });

      const apiEvents = analytics.getEvents({ eventType: 'api:call' });
      expect(apiEvents).toHaveLength(1);
      expect(apiEvents[0].eventType).toBe('api:call');
    });

    it('should filter events by user', () => {
      analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      analytics.trackEvent('api:call', 'user2', { responseTime: 150 });

      const user1Events = analytics.getEvents({ userId: 'user1' });
      expect(user1Events).toHaveLength(1);
      expect(user1Events[0].userId).toBe('user1');
    });

    it('should filter events by time range', () => {
      const now = Date.now();
      analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      
      const futureTime = now + 1000;
      const pastTime = now - 1000;
      
      const periodEvents = analytics.getEvents({
        startTime: pastTime,
        endTime: futureTime
      });
      
      expect(periodEvents).toHaveLength(1);
    });
  });

  describe('Metrics Tracking', () => {
    it('should update trust scores count', () => {
      analytics.trackEvent('trustScore:generated', 'user1', { score: 0.8 });
      
      const metrics = analytics.getMetrics();
      expect(metrics.trustScoresGenerated).toBe(1);
    });

    it('should update flagged posts count', () => {
      analytics.trackEvent('post:flagged', 'user1', { postId: '123' });
      
      const metrics = analytics.getMetrics();
      expect(metrics.flaggedPosts).toBe(1);
    });

    it('should calculate average response time', () => {
      analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      analytics.trackEvent('api:call', 'user1', { responseTime: 200 });
      
      const metrics = analytics.getMetrics();
      expect(metrics.averageResponseTime).toBe(150);
    });

    it('should calculate error rate', () => {
      analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      analytics.trackEvent('api:error', 'user1', { error: 'Test error' });
      
      const metrics = analytics.getMetrics();
      expect(metrics.errorRate).toBe(0.5); // 1 error out of 2 calls
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive report', () => {
      const startTime = Date.now() - 1000;
      const endTime = Date.now() + 1000;

      analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      analytics.trackEvent('trustScore:generated', 'user1', { score: 0.8 });
      analytics.trackEvent('api:error', 'user2', { error: 'Test error' });

      const report = analytics.generateReport(startTime, endTime);

      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('eventCounts');
      expect(report).toHaveProperty('topUsers');
      expect(report).toHaveProperty('errorAnalysis');

      expect(report.eventCounts['api:call']).toBe(1);
      expect(report.eventCounts['api:error']).toBe(1);
      expect(report.eventCounts['trustScore:generated']).toBe(1);
    });

    it('should identify top users', () => {
      analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      analytics.trackEvent('api:call', 'user1', { responseTime: 200 });
      analytics.trackEvent('api:call', 'user2', { responseTime: 150 });

      const report = analytics.generateReport(Date.now() - 1000, Date.now() + 1000);
      const topUsers = report.topUsers;

      expect(topUsers[0][0]).toBe('user1');
      expect(topUsers[0][1]).toBe(2); // user1 has 2 events
    });
  });
}); 