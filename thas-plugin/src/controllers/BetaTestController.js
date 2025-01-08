const FeedbackCollector = require('../services/FeedbackCollector');
const MonitoringService = require('../services/MonitoringService');

class BetaTestController {
  constructor() {
    this.feedbackCollector = FeedbackCollector.getInstance();
    this.metrics = MonitoringService;
  }

  async submitVerificationFeedback(req, res) {
    try {
      const { verificationResult, jobPosting, feedback } = req.body;

      if (!verificationResult || !jobPosting) {
        return res.status(400).json({
          error: 'Missing required data'
        });
      }

      const result = await this.feedbackCollector.collectVerificationFeedback(
        verificationResult,
        jobPosting,
        feedback
      );

      res.status(200).json(result);
    } catch (error) {
      this.metrics.logError(error, {
        controller: 'BetaTest',
        action: 'submitVerificationFeedback',
        data: req.body
      });
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }

  async getBetaMetrics(req, res) {
    try {
      const { timeframe } = req.query;
      const analysis = await this.feedbackCollector.analyzeAggregatedFeedback(timeframe);
      
      res.status(200).json({
        timeframe,
        metrics: {
          verificationMetrics: {
            total: analysis.totalVerifications,
            successRate: analysis.successRate,
            averageConfidence: analysis.averageConfidence
          },
          userFeedback: {
            sentiment: analysis.userSentiment,
            commonIssues: analysis.commonIssues.slice(0, 5)
          },
          systemHealth: {
            apiLatency: await this.metrics.getAverageApiLatency(),
            errorRate: await this.metrics.getErrorRate(),
            uptime: await this.metrics.getUptime()
          },
          recommendations: analysis.recommendations
        }
      });
    } catch (error) {
      this.metrics.logError(error, {
        controller: 'BetaTest',
        action: 'getBetaMetrics',
        query: req.query
      });
      res.status(500).json({ error: 'Failed to retrieve beta metrics' });
    }
  }

  async reportIssue(req, res) {
    try {
      const { type, description, context } = req.body;

      if (!type || !description) {
        return res.status(400).json({
          error: 'Issue type and description are required'
        });
      }

      // Log the issue
      this.metrics.logError(new Error(description), {
        service: 'BetaTesting',
        issueType: type,
        context
      });

      // Store in feedback system
      await this.feedbackCollector.storeFeedbackData({
        timestamp: new Date(),
        type: 'ISSUE_REPORT',
        data: {
          type,
          description,
          context
        }
      });

      res.status(200).json({
        message: 'Issue reported successfully',
        issueId: Date.now().toString()
      });
    } catch (error) {
      this.metrics.logError(error, {
        controller: 'BetaTest',
        action: 'reportIssue',
        data: req.body
      });
      res.status(500).json({ error: 'Failed to report issue' });
    }
  }

  async getPartnerMetrics(req, res) {
    try {
      const { partnerId, timeframe } = req.query;

      const metrics = await this.feedbackCollector.analyzePartnerMetrics(partnerId, timeframe);
      
      res.status(200).json({
        partnerId,
        timeframe,
        metrics: {
          usage: {
            totalVerifications: metrics.totalVerifications,
            uniqueCompanies: metrics.uniqueCompanies,
            averageResponseTime: metrics.averageResponseTime
          },
          performance: {
            successRate: metrics.successRate,
            falsePositives: metrics.falsePositives,
            falseNegatives: metrics.falseNegatives
          },
          feedback: {
            userSatisfaction: metrics.userSatisfaction,
            reportedIssues: metrics.reportedIssues
          }
        }
      });
    } catch (error) {
      this.metrics.logError(error, {
        controller: 'BetaTest',
        action: 'getPartnerMetrics',
        query: req.query
      });
      res.status(500).json({ error: 'Failed to retrieve partner metrics' });
    }
  }
}

module.exports = new BetaTestController(); 