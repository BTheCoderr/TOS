import { Controller, Post, Get, Body, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { VerificationService } from '../services/VerificationService';
import { FeedbackService } from '../services/FeedbackService';
import { MetricsCollector } from '../services/MetricsCollector';
import {
  BetaTestingResult,
  BetaFeedback,
  BetaMetricsFilters,
  BetaTestingMetrics,
  BetaFeature
} from '../types/beta';
import { JobPosting } from '../types/jobPosting';
import {
  JobPostingDto,
  BetaFeedbackDto,
  BetaMetricsFiltersDto,
  VerificationResultDto
} from '../dto/beta.dto';

interface FeaturePerformance {
  timing: number;
  accuracy: number;
  issues: string[];
}

@ApiTags('Beta Testing')
@Controller('beta')
@UsePipes(new ValidationPipe({ transform: true }))
export class BetaTestingController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly feedbackService: FeedbackService,
    private readonly metricsCollector: MetricsCollector
  ) {}

  @Post('test')
  @ApiOperation({ summary: 'Run beta test for a job posting' })
  @ApiResponse({ status: 201, type: VerificationResultDto })
  async runBetaTest(
    @Body() jobPosting: JobPostingDto
  ): Promise<BetaTestingResult> {
    // Parse feature flags for this test
    const featureFlags = this.parseFeatureFlags(jobPosting);

    // Record test metrics
    await this.metricsCollector.recordBetaTest({
      jobPostingId: jobPosting.id,
      features: featureFlags
    });

    // Run verification with beta features
    const verificationResult = await this.verificationService.verifyWithFeatures(
      jobPosting as JobPosting,
      featureFlags
    );

    // Analyze feature performance
    const featurePerformance = await this.analyzeFeaturePerformance(verificationResult);
    const suggestions = await this.generateSuggestions(featurePerformance);

    return {
      success: verificationResult.success,
      testId: `beta-${Date.now()}`,
      timestamp: new Date(),
      metrics: {
        verificationTime: verificationResult.timing,
        confidenceScore: verificationResult.confidence,
        featureFlags
      },
      feedback: {
        issues: verificationResult.issues || [],
        suggestions
      }
    };
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback for beta test' })
  @ApiResponse({ status: 201 })
  async submitFeedback(
    @Body() feedback: BetaFeedbackDto
  ): Promise<void> {
    await this.feedbackService.storeFeedback(feedback as BetaFeedback);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get beta testing metrics' })
  @ApiResponse({ status: 200, type: BetaTestingMetrics })
  async getMetrics(
    @Query() filters: BetaMetricsFiltersDto
  ): Promise<BetaTestingMetrics> {
    return await this.metricsCollector.getBetaTestingMetrics(filters as BetaMetricsFilters);
  }

  @Get('features')
  @ApiOperation({ summary: 'Get available beta features' })
  @ApiResponse({ status: 200, type: [BetaFeature] })
  async getFeatures(): Promise<BetaFeature[]> {
    return await this.feedbackService.getAvailableFeatures();
  }

  private parseFeatureFlags(jobPosting: JobPostingDto): string[] {
    const flags: string[] = [];
    
    // Add enhanced verification for high-value jobs
    if (jobPosting.salary?.max && jobPosting.salary.max > 100000) {
      flags.push('ENHANCED_VERIFICATION');
    }

    // Add ML-based analysis for tech jobs
    if (jobPosting.requirements.some(req => 
      req.toLowerCase().includes('software') || 
      req.toLowerCase().includes('developer')
    )) {
      flags.push('ML_ANALYSIS');
    }

    return flags;
  }

  private async analyzeFeaturePerformance(verificationResult: any): Promise<FeaturePerformance> {
    return {
      timing: verificationResult.timing,
      accuracy: verificationResult.confidence,
      issues: verificationResult.issues || []
    };
  }

  private async generateSuggestions(performance: FeaturePerformance): Promise<string[]> {
    const suggestions: string[] = [];

    if (performance.timing > 2000) {
      suggestions.push('Consider optimizing verification process for better performance');
    }

    if (performance.accuracy < 0.8) {
      suggestions.push('Additional verification sources might improve accuracy');
    }

    return suggestions;
  }
} 