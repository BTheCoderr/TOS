import BetaAnalytics from '../analytics';
import { Event, Metrics } from '../../types/analytics';

describe('BetaAnalytics', () => {
  let analytics: BetaAnalytics;

  beforeEach(() => {
    analytics = new BetaAnalytics();
  });

  describe('trackEvent', () => {
    it('should track events correctly', async () => {
      await analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      const events = analytics.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('api:call');
      expect(events[0].userId).toBe('user1');
    });

    it('should filter events by type', async () => {
      await analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      await analytics.trackEvent('api:error', 'user1', { error: 'test error' });
      
      const apiEvents = analytics.getEvents({ eventType: 'api:call' });
      expect(apiEvents.length).toBe(1);
      expect(apiEvents[0].type).toBe('api:call');
    });
  });

  describe('getMetrics', () => {
    it('should calculate API metrics correctly', async () => {
      await analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      const metrics = analytics.getMetrics();
      
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventTypes['api:call']).toBe(1);
      expect(metrics.averageResponseTime).toBe(100);
      expect(metrics.errorRate).toBe(0);
    });

    it('should calculate error rate correctly', async () => {
      await analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      await analytics.trackEvent('api:error', 'user1', { error: 'test error' });
      
      const metrics = analytics.getMetrics();
      expect(metrics.errorRate).toBe(1);
    });
  });

  describe('generateReport', () => {
    it('should generate report for time range', async () => {
      const now = Date.now();
      await analytics.trackEvent('api:call', 'user1', { responseTime: 100 });
      await analytics.trackEvent('api:call', 'user1', { responseTime: 200 });
      await analytics.trackEvent('api:call', 'user2', { responseTime: 150 });
      
      const report = analytics.generateReport(now - 1000);
      
      expect(report.events.length).toBe(3);
      expect(report.metrics.totalEvents).toBe(3);
      expect(report.metrics.averageResponseTime).toBe(150);
      
      const { topUsers } = report;
      expect(topUsers[0].userId).toBe('user1');
      expect(topUsers[0].eventCount).toBe(2);
    });
  });
}); 