import { Redis } from 'ioredis';
import axios from 'axios';
import { logger } from '../utils/logger';
import { rateLimiter } from '../utils/rateLimiter';
import { ApiConfig, CompanyDetails, VerificationResult } from '../types';
import { findMockCompany } from '../utils/mockData';

export class CompanyVerificationService {
  private redis!: Redis;
  private config: ApiConfig;
  private readonly CACHE_TTL = 24 * 60 * 60;
  private readonly MAX_REQUESTS = 100;
  private readonly RATE_LIMIT_WINDOW = 60000;
  private useFallbackCache = false;
  private useMockData = false;

  constructor(config: ApiConfig) {
    this.config = config;
    this.useMockData = !config.openCorporates?.apiKey;
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      this.redis = new Redis(redisUrl, {
        enableOfflineQueue: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.useFallbackCache = true;
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.useFallbackCache = false;
      });

      await new Promise<void>((resolve, reject) => {
        this.redis.once('ready', () => {
          logger.info('Redis is ready');
          resolve();
        });
        this.redis.once('error', reject);
      });

      logger.info('Redis initialization successful');
    } catch (error) {
      logger.error('Redis initialization failed:', error);
      this.useFallbackCache = true;
    }
  }

  async verifyCompany(company: CompanyDetails): Promise<VerificationResult> {
    try {
      const rateLimitKey = `ratelimit:${company.registrationNumber}`;
      const canProceed = await rateLimiter.checkLimit(
        rateLimitKey,
        this.MAX_REQUESTS,
        this.RATE_LIMIT_WINDOW
      );

      if (!canProceed) {
        throw new Error('Rate limit exceeded');
      }

      const cacheKey = this.generateCacheKey(company);
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.info(`Cache hit for company ${company.name}`);
        return cachedResult;
      }

      const result = await this.fetchCompanyData(company);
      await this.cacheResult(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Company verification failed:', error);
      throw error;
    }
  }

  private async getFromCache(key: string): Promise<VerificationResult | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Redis get error:', error);
      return null;
    }
  }

  private async cacheResult(key: string, result: VerificationResult): Promise<void> {
    try {
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      logger.warn('Redis set error:', error);
    }
  }

  private async fetchCompanyData(company: CompanyDetails): Promise<VerificationResult> {
    try {
      if (this.useMockData) {
        logger.info('Using mock data for company:', company.name);
        const mockResult = findMockCompany(company);
        if (mockResult) {
          return mockResult;
        }
        return this.createFailedVerification(company, 'Company not found in mock data');
      }

      if (this.config.openCorporates?.apiKey) {
        try {
          const ocResult = await this.fetchFromOpenCorporates(company);
          if (ocResult.matched) {
            logger.info('Company found in OpenCorporates:', company.name);
            return this.processApiResponse(ocResult, company, 'OPENCORPORATES');
          }
        } catch (error) {
          logger.error('OpenCorporates API error:', error);
          throw error;
        }
      }

      if (this.config.companiesHouse?.apiKey) {
        try {
          const chResult = await this.fetchFromCompaniesHouse(company);
          if (chResult.matched) {
            logger.info('Company found in Companies House:', company.name);
            return this.processApiResponse(chResult, company, 'COMPANIES_HOUSE');
          }
        } catch (error) {
          logger.error('Companies House API error:', error);
          throw error;
        }
      }

      logger.warn('No matching company found:', company.name);
      return this.createFailedVerification(company, 'No matching company found');
    } catch (error) {
      throw error;
    }
  }

  private async fetchFromOpenCorporates(company: CompanyDetails) {
    try {
      const response = await axios.get(
        `${this.config.openCorporates.baseUrl}/companies/search`,
        {
          params: {
            q: company.name,
            api_token: this.config.openCorporates.apiKey
          }
        }
      );

      return {
        matched: true,
        data: {
          name: response.data.name,
          registrationNumber: response.data.registration_number,
          status: response.data.status?.toLowerCase() || 'unknown',
          industry: response.data.industry,
          location: this.formatAddress(response.data.registered_office_address)
        }
      };
    } catch (err) {
      const error = err as Error;
      logger.error(`OpenCorporates API error: ${error.message}`);
      throw error;
    }
  }

  private async fetchFromCompaniesHouse(company: CompanyDetails) {
    if (!company.registrationNumber) {
      return { matched: false };
    }

    const url = `${this.config.companiesHouse.baseUrl}/company/${company.registrationNumber}`;
    
    try {
      const response = await axios.get(url, {
        auth: {
          username: this.config.companiesHouse.apiKey,
          password: ''
        },
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });

      return {
        matched: true,
        data: {
          name: response.data.company_name,
          registrationNumber: response.data.company_number,
          status: response.data.company_status,
          foundingDate: response.data.date_of_creation,
          location: this.formatAddress(response.data.registered_office_address)
        }
      };
    } catch (error) {
      logger.error('Companies House API error:', error);
      throw error;
    }
  }

  private findBestMatch(company: CompanyDetails, results: any[]): any {
    return results.find(result => {
      const nameMatch = this.calculateNameSimilarity(
        company.name,
        result.company.name
      );
      return nameMatch > 0.8;
    });
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    return n1 === n2 ? 1 : 0;
  }

  private formatAddress(address: any): string {
    if (!address) return '';
    return [
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.postal_code
    ].filter(Boolean).join(', ');
  }

  private processApiResponse(apiResult: any, company: CompanyDetails, source: string): VerificationResult {
    const status = apiResult.data.status.toLowerCase();
    return {
      trustScore: 0.95,
      verificationStatus: 'VERIFIED',
      details: {
        companyName: apiResult.data.name,
        registrationNumber: apiResult.data.registrationNumber,
        status: status as 'active' | 'inactive' | 'unknown',
        foundingDate: apiResult.data.foundingDate,
        industry: apiResult.data.industry,
        locations: apiResult.data.location ? [apiResult.data.location] : undefined
      },
      metadata: {
        verifiedAt: new Date().toISOString(),
        source,
        confidence: 0.95
      }
    };
  }

  private createFailedVerification(company: CompanyDetails, reason: string): VerificationResult {
    return {
      trustScore: 0,
      verificationStatus: 'FAILED',
      details: {
        companyName: company.name,
        registrationNumber: company.registrationNumber,
        status: 'unknown',
        locations: company.location ? [company.location] : undefined
      },
      metadata: {
        verifiedAt: new Date().toISOString(),
        source: 'SYSTEM',
        confidence: 0
      }
    };
  }

  private generateCacheKey(company: CompanyDetails): string {
    return `company:${company.registrationNumber || company.name.toLowerCase()}:${company.location || 'unknown'}`;
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      logger.error('Redis cleanup error:', error);
    }
  }
} 