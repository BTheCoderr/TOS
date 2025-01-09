import { JobPostingFlag } from '../types/jobPosting';
import { VerificationStats, DetailedStats, StatsCache } from '../types/statistics';
import { logger } from '../utils/logger';

export class StatisticsService {
  private readonly cache: StatsCache;
  private readonly STATS_KEY = 'verification:stats';
  private stats: VerificationStats;

  constructor(cache: StatsCache) {
    this.cache = cache;
    this.stats = {
      totalVerifications: 0,
      verifiedJobs: 0,
      flaggedJobs: 0,
      averageConfidence: 0,
      commonFlags: [],
      lastUpdated: new Date().toISOString()
    };
    this.loadStats();
  }

  private async loadStats() {
    try {
      const cachedStats = await this.cache.get(this.STATS_KEY);
      if (cachedStats) {
        this.stats = JSON.parse(cachedStats) as VerificationStats;
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Keep using default stats if loading fails
    }
  }

  private async saveStats() {
    try {
      await this.cache.set(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }

  async recordVerification(
    verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED',
    confidence: number,
    flags: JobPostingFlag[] = []
  ): Promise<void> {
    try {
      const stats = await this.getStats();
      
      // Update verification counts
      stats.totalVerifications++;
      if (verificationStatus === 'VERIFIED') {
        stats.verifiedJobs++;
      }
      if (flags.length > 0) {
        stats.flaggedJobs++;
      }

      // Update confidence average
      stats.averageConfidence = (
        (stats.averageConfidence * (stats.totalVerifications - 1) + confidence) / 
        stats.totalVerifications
      );

      // Update common flags
      flags.forEach(flag => {
        const existingFlag = stats.commonFlags.find(f => f.type === flag.type);
        if (existingFlag) {
          existingFlag.count++;
        } else {
          stats.commonFlags.push({ type: flag.type, count: 1 });
        }
      });

      stats.lastUpdated = new Date().toISOString();

      // Save updated stats
      await this.cache.set('verification_stats', JSON.stringify(stats));
    } catch (error) {
      logger.error('Error recording verification stats:', error);
    }
  }

  async getStats(): Promise<VerificationStats> {
    return this.stats;
  }

  async getDetailedStats(): Promise<DetailedStats> {
    return {
      ...this.stats,
      verificationRate: this.stats.verifiedJobs / this.stats.totalVerifications || 0,
      flagRate: this.stats.flaggedJobs / this.stats.totalVerifications || 0,
      flagDistribution: this.calculateFlagDistribution(),
      timeStats: {
        lastUpdated: new Date(this.stats.lastUpdated),
        averageVerificationsPerDay: this.calculateDailyAverage()
      }
    };
  }

  private calculateFlagDistribution(): Record<string, number> {
    const totalFlags = this.stats.commonFlags.reduce((sum, flag) => sum + flag.count, 0);
    return Object.fromEntries(
      this.stats.commonFlags.map(flag => [
        flag.type,
        totalFlags > 0 ? flag.count / totalFlags : 0
      ])
    );
  }

  private calculateDailyAverage(): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceStart = (
      Date.now() - new Date(this.stats.lastUpdated).getTime()
    ) / msPerDay;
    
    return daysSinceStart > 0
      ? this.stats.totalVerifications / daysSinceStart
      : this.stats.totalVerifications;
  }
} 