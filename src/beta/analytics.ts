import { Event, EventFilter, Metrics, AnalyticsReport } from '../types/analytics';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

class BetaAnalytics {
  private events: Event[] = [];

  async trackEvent(type: string, userId: string, data: Record<string, any> = {}) {
    const event: Event = {
      id: uuidv4(),
      type,
      eventType: type,  // Setting eventType same as type for backward compatibility
      userId,
      timestamp: Date.now(),
      data
    };

    this.events.push(event);
    logger.info(`Event tracked: ${type}`, { userId, data });
  }

  getEvents(filter?: EventFilter): Event[] {
    let filteredEvents = this.events;

    if (filter) {
      filteredEvents = this.events.filter(event => {
        if (filter.eventType && event.eventType !== filter.eventType) return false;
        if (filter.userId && event.userId !== filter.userId) return false;
        if (filter.startTime && event.timestamp < filter.startTime) return false;
        if (filter.endTime && event.timestamp > filter.endTime) return false;
        return true;
      });
    }

    return filteredEvents;
  }

  getMetrics(): Metrics {
    const eventTypes: Record<string, number> = {};
    let totalResponseTime = 0;
    let apiCalls = 0;
    let errors = 0;

    this.events.forEach(event => {
      // Count event types
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;

      // Calculate API metrics
      if (event.type === 'api:call') {
        totalResponseTime += event.data.responseTime || 0;
        apiCalls++;
      }

      if (event.type === 'api:error') {
        errors++;
      }
    });

    return {
      totalEvents: this.events.length,
      eventTypes,
      averageResponseTime: apiCalls > 0 ? totalResponseTime / apiCalls : 0,
      errorRate: apiCalls > 0 ? errors / apiCalls : 0
    };
  }

  generateReport(startTime: number = Date.now() - 24 * 60 * 60 * 1000): AnalyticsReport {
    const endTime = Date.now();
    const relevantEvents = this.getEvents({
      startTime,
      endTime
    });

    const eventTypes: Record<string, number> = {};
    let totalResponseTime = 0;
    let apiCalls = 0;
    let errors = 0;

    relevantEvents.forEach(event => {
      // Count event types
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;

      // Calculate API metrics
      if (event.type === 'api:call') {
        totalResponseTime += event.data.responseTime || 0;
        apiCalls++;
      }

      if (event.type === 'api:error') {
        errors++;
      }
    });

    // Calculate user activity
    const userEvents: Record<string, number> = {};
    relevantEvents.forEach(event => {
      userEvents[event.userId] = (userEvents[event.userId] || 0) + 1;
    });

    const topUsers = Object.entries(userEvents)
      .map(([userId, count]) => ({ userId, eventCount: count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    const metrics: Metrics = {
      totalEvents: relevantEvents.length,
      eventTypes,
      averageResponseTime: apiCalls > 0 ? totalResponseTime / apiCalls : 0,
      errorRate: apiCalls > 0 ? errors / apiCalls : 0
    };

    return {
      timeRange: {
        start: startTime,
        end: endTime
      },
      metrics,
      events: relevantEvents,
      eventCounts: eventTypes,
      topUsers
    };
  }

  clearEvents() {
    this.events = [];
  }
}

export default BetaAnalytics; 