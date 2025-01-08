const mongoose = require('mongoose');
const MonitoringService = require('./MonitoringService');

class FeedbackCollector {
  constructor() {
    this.metrics = MonitoringService;
  }

  static getInstance() {
    if (!FeedbackCollector.instance) {
      FeedbackCollector.instance = new FeedbackCollector();
    }
    return FeedbackCollector.instance;
  }

  async collectVerificationFeedback(verificationResult, jobPosting) {
    try {
      // Track verification performance metrics
      await this.metrics.recordVerificationAttempt(
        verificationResult.processingTime,
        verificationResult.verified ? 'Verified' : 'Failed'
      );

      // Store feedback data
      await this.storeFeedbackData({
        timestamp: new Date(),
        jobPostingId: jobPosting.id,
        verificationResult,
        systemMetrics: await this.getSystemMetrics()
      });

      return {
        success: true,
        feedbackId: jobPosting.id,
        timestamp: new Date()
      };
    } catch (error) {
      this.metrics.logError(error, {
        service: 'FeedbackCollector',
        jobPosting,
        verificationResult
      });
      throw error;
    }
  }

  async storeFeedbackData(feedbackData) {
    const FeedbackModel = mongoose.model('Feedback', {
      timestamp: Date,
      jobPostingId: String,
      verificationResult: Object,
      userFeedback: {
        rating: Number,
        comments: String,
        disagreeWithVerification: Boolean,
        reasonForDisagreement: String
      },
      systemMetrics: {
        processingTime: Number,
        confidenceScore: Number,
        verificationSource: String,
        apiLatency: Number
      }
    });

    const feedback = new FeedbackModel(feedbackData);
    await feedback.save();
  }

  async getSystemMetrics() {
    return {
      apiLatency: await this.metrics.getAverageApiLatency(),
      successRate: await this.metrics.getVerificationSuccessRate(),
      activeUsers: await this.metrics.getActiveUserCount(),
      systemLoad: await this.metrics.getSystemLoad()
    };
  }

  async analyzeAggregatedFeedback(timeframe = '24h') {
    try {
      const feedbackData = await this.getFeedbackInTimeframe(timeframe);
      
      const analysis = {
        totalVerifications: feedbackData.length,
        successRate: this.calculateSuccessRate(feedbackData),
        averageConfidence: this.calculateAverageConfidence(feedbackData),
        commonIssues: this.identifyCommonIssues(feedbackData),
        userSentiment: await this.analyzeFeedbackSentiment(feedbackData),
        recommendations: []
      };

      // Generate recommendations based on analysis
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;
    } catch (error) {
      this.metrics.logError(error, {
        service: 'FeedbackAnalysis',
        timeframe
      });
      throw error;
    }
  }

  calculateSuccessRate(feedbackData) {
    const successful = feedbackData.filter(f => 
      f.verificationResult.verified && !f.userFeedback?.disagreeWithVerification
    );
    return (successful.length / feedbackData.length) * 100;
  }

  calculateAverageConfidence(feedbackData) {
    const total = feedbackData.reduce((sum, f) => 
      sum + f.verificationResult.confidence, 0
    );
    return total / feedbackData.length;
  }

  identifyCommonIssues(feedbackData) {
    const issues = feedbackData
      .filter(f => f.userFeedback?.disagreeWithVerification)
      .map(f => f.userFeedback.reasonForDisagreement)
      .reduce((acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(issues)
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: (count / feedbackData.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  async analyzeFeedbackSentiment(feedbackData) {
    // Implement sentiment analysis on user comments
    // This could be enhanced with a proper NLP service
    const comments = feedbackData
      .filter(f => f.userFeedback?.comments)
      .map(f => f.userFeedback.comments);

    return {
      totalComments: comments.length,
      averageRating: this.calculateAverageRating(feedbackData),
      sentimentBreakdown: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    };
  }

  calculateAverageRating(feedbackData) {
    const ratings = feedbackData
      .filter(f => f.userFeedback?.rating)
      .map(f => f.userFeedback.rating);
    
    return ratings.length ? 
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 
      0;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.successRate < 90) {
      recommendations.push({
        type: 'IMPROVE_ACCURACY',
        priority: 'high',
        description: 'Verification success rate is below target. Consider adjusting verification thresholds.'
      });
    }

    if (analysis.averageConfidence < 80) {
      recommendations.push({
        type: 'INCREASE_CONFIDENCE',
        priority: 'medium',
        description: 'Average confidence score is low. Consider gathering additional verification signals.'
      });
    }

    if (analysis.commonIssues.length > 0) {
      recommendations.push({
        type: 'ADDRESS_COMMON_ISSUES',
        priority: 'high',
        description: `Focus on addressing top issues: ${analysis.commonIssues.slice(0, 3).map(i => i.issue).join(', ')}`
      });
    }

    return recommendations;
  }

  async getFeedbackInTimeframe(timeframe) {
    const FeedbackModel = mongoose.model('Feedback');
    const timeframeMs = this.parseTimeframe(timeframe);
    
    return FeedbackModel.find({
      timestamp: {
        $gte: new Date(Date.now() - timeframeMs)
      }
    }).sort({ timestamp: -1 });
  }

  parseTimeframe(timeframe) {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }
}

module.exports = FeedbackCollector; 