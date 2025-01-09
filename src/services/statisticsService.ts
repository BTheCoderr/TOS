import { JobPostingFlag } from '../types/jobPosting';
import { VerificationStats, DetailedStats, StatsCache } from '../types/statistics';

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

  async recordVerification(isVerified: boolean, confidence: number, flags: JobPostingFlag[]) {
    this.stats.totalVerifications++;
    
    if (isVerified) {
      this.stats.verifiedJobs++;
    }
    
    if (flags.length > 0) {
      this.stats.flaggedJobs++;
    }

    // Update average confidence
    this.stats.averageConfidence = (
      (this.stats.averageConfidence * (this.stats.totalVerifications - 1) + confidence) /
      this.stats.totalVerifications
    );

    // Update flag counts
    flags.forEach(flag => {
      const existingFlag = this.stats.commonFlags.find(f => f.type === flag.type);
      if (existingFlag) {
        existingFlag.count++;
      } else {
        this.stats.commonFlags.push({ type: flag.type, count: 1 });
      }
    });

    // Sort flags by count
    this.stats.commonFlags.sort((a, b) => b.count - a.count);

    this.stats.lastUpdated = new Date().toISOString();
    await this.saveStats();
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