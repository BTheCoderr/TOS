import { Injectable } from '@nestjs/common';
import { JobPosting } from '../types/jobPosting';
import { LinkedInVerificationService } from './LinkedInVerificationService';
import { MonitoringService } from './MonitoringService';

@Injectable()
export class VerificationService {
  constructor(
    private readonly linkedInService: LinkedInVerificationService,
    private readonly monitoringService: MonitoringService
  ) {}

  async verifyWithFeatures(jobPosting: JobPosting, features: string[]) {
    const startTime = Date.now();
    try {
      const verificationResult = await this.performVerification(jobPosting, features);
      
      // Record metrics
      const timing = Date.now() - startTime;
      await this.monitoringService.recordVerificationAttempt(
        timing,
        verificationResult.success ? 'Success' : 'Failed'
      );

      return {
        ...verificationResult,
        timing
      };
    } catch (error) {
      this.monitoringService.logError(error, {
        service: 'VerificationService',
        jobPosting,
        features
      });
      throw error;
    }
  }

  private async performVerification(jobPosting: JobPosting, features: string[]) {
    const verificationTasks = [
      this.linkedInService.verifyCompany({
        linkedInId: jobPosting.company.linkedInId,
        name: jobPosting.company.name
      })
    ];

    // Add enhanced verification if enabled
    if (features.includes('ENHANCED_VERIFICATION')) {
      verificationTasks.push(
        this.linkedInService.performComprehensiveVerification({
          linkedInId: jobPosting.company.linkedInId,
          name: jobPosting.company.name
        })
      );
    }

    // Add ML analysis if enabled
    if (features.includes('ML_ANALYSIS')) {
      verificationTasks.push(
        this.performMLAnalysis(jobPosting)
      );
    }

    const results = await Promise.all(verificationTasks);
    
    return this.aggregateResults(results);
  }

  private async performMLAnalysis(jobPosting: JobPosting) {
    // Implement ML-based analysis
    return {
      confidence: 0.85,
      issues: [],
      suggestions: ['Consider adding more specific job requirements']
    };
  }

  private aggregateResults(results: any[]) {
    const confidence = results.reduce((sum, result) => 
      sum + (result.confidence || result.score || 0), 0
    ) / results.length;

    const issues = results.reduce((allIssues, result) => 
      allIssues.concat(result.issues || []), []
    );

    return {
      success: confidence >= 0.7,
      confidence,
      issues: [...new Set(issues)],
      results
    };
  }
} 