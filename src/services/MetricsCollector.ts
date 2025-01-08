class MetricsCollector {
  private readonly storage: MetricsStorage;
  private readonly analytics: AnalyticsService;

  async recordJobPostingMetrics(posting: JobPosting, result: VerificationResult): Promise<void> {
    const metrics: PostingMetrics = {
      timestamp: new Date(),
      companyId: posting.companyId,
      verificationScore: result.score,
      verificationDuration: result.metadata.duration,
      
      // New detailed metrics
      categoryAnalysis: {
        industry: posting.industry,
        seniority: posting.seniority,
        requiredSkills: posting.requirements.length,
        salaryTransparency: Boolean(posting.salary),
        locationSpecificity: this.calculateLocationScore(posting.location)
      },
      
      contentQuality: {
        descriptionLength: posting.description.length,
        keywordDensity: this.analyzeKeywordDensity(posting.description),
        readabilityScore: this.calculateReadability(posting.description),
        technicalTerms: this.extractTechnicalTerms(posting.description)
      },
      
      verificationFactors: {
        linkedInScore: result.externalScores?.linkedin || 0,
        fraudDetectionScore: result.fraudRisk,
        companyVerificationLevel: result.companyVerification?.level
      }
    };

    await Promise.all([
      this.storage.saveMetrics(metrics),
      this.analytics.trackVerification(metrics),
      this.updateAggregateStats(metrics)
    ]);
  }

  async generateAnalyticsReport(timeframe: TimeRange): Promise<AnalyticsReport> {
    const metrics = await this.storage.getMetricsInRange(timeframe);
    
    return {
      summary: this.calculateSummaryStats(metrics),
      trends: this.analyzeTrends(metrics),
      recommendations: this.generateRecommendations(metrics),
      industryComparison: await this.compareToIndustryBenchmarks(metrics)
    };
  }
} 