import { Injectable } from '@nestjs/common';
import { BetaFeedback, BetaFeature } from '../types/beta';
import { MonitoringService } from './MonitoringService';
import { FeedbackCollector } from './FeedbackCollector';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackCollector: FeedbackCollector,
    private readonly monitoringService: MonitoringService
  ) {}

  async storeFeedback(feedback: BetaFeedback): Promise<void> {
    try {
      await this.feedbackCollector.storeFeedbackData({
        timestamp: feedback.timestamp,
        type: 'BETA_FEEDBACK',
        data: feedback
      });

      // Record metrics
      await this.monitoringService.recordFeedbackSubmission({
        testId: feedback.testId,
        rating: feedback.rating,
        hasIssues: feedback.issues && feedback.issues.length > 0
      });
    } catch (error) {
      this.monitoringService.logError(error, {
        service: 'FeedbackService',
        method: 'storeFeedback',
        feedback
      });
      throw error;
    }
  }

  async getAvailableFeatures(): Promise<BetaFeature[]> {
    try {
      return [
        {
          id: 'ENHANCED_VERIFICATION',
          name: 'Enhanced Company Verification',
          description: 'Additional verification steps for high-value job postings',
          enabled: true,
          userGroups: ['premium', 'enterprise'],
          metrics: {
            usage: 45,
            successRate: 0.92,
            performance: {
              averageLatency: 1200,
              errorRate: 0.02
            }
          }
        },
        {
          id: 'ML_ANALYSIS',
          name: 'ML-Based Job Analysis',
          description: 'Machine learning analysis of job requirements and company profile',
          enabled: true,
          userGroups: ['beta_testers', 'enterprise'],
          metrics: {
            usage: 28,
            successRate: 0.85,
            performance: {
              averageLatency: 800,
              errorRate: 0.05
            }
          }
        }
      ];
    } catch (error) {
      this.monitoringService.logError(error, {
        service: 'FeedbackService',
        method: 'getAvailableFeatures'
      });
      throw error;
    }
  }

  async analyzeFeedbackTrends(timeframe: string = '7d') {
    try {
      const analysis = await this.feedbackCollector.analyzeAggregatedFeedback(timeframe);
      
      // Enrich analysis with feature-specific insights
      const features = await this.getAvailableFeatures();
      const featureInsights = features.map(feature => ({
        featureId: feature.id,
        metrics: feature.metrics,
        feedback: analysis.commonIssues.filter(issue => 
          issue.issue.toLowerCase().includes(feature.name.toLowerCase())
        )
      }));

      return {
        ...analysis,
        featureInsights,
        recommendations: this.generateFeatureRecommendations(featureInsights)
      };
    } catch (error) {
      this.monitoringService.logError(error, {
        service: 'FeedbackService',
        method: 'analyzeFeedbackTrends',
        timeframe
      });
      throw error;
    }
  }

  private generateFeatureRecommendations(featureInsights: any[]) {
    return featureInsights
      .filter(insight => {
        const hasIssues = insight.feedback.length > 0;
        const lowSuccessRate = insight.metrics.successRate < 0.8;
        const highLatency = insight.metrics.performance.averageLatency > 2000;
        
        return hasIssues || lowSuccessRate || highLatency;
      })
      .map(insight => ({
        featureId: insight.featureId,
        recommendations: this.getFeatureRecommendations(insight)
      }));
  }

  private getFeatureRecommendations(insight: any) {
    const recommendations = [];

    if (insight.metrics.successRate < 0.8) {
      recommendations.push(
        'Consider adjusting verification thresholds or adding additional data sources'
      );
    }

    if (insight.metrics.performance.averageLatency > 2000) {
      recommendations.push(
        'Optimize API calls and implement better caching strategies'
      );
    }

    if (insight.feedback.length > 0) {
      recommendations.push(
        `Address user feedback: ${insight.feedback[0].issue}`
      );
    }

    return recommendations;
  }
} 