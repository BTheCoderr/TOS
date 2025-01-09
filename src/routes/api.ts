import express from 'express';
import { JobPostingVerificationService } from '../services/jobPostingVerificationService';
import { CompanyVerificationService } from '../services/companyVerificationService';
import { VerificationCache } from '../types/verification';
import { JobPosting, JobVerificationResult, JobPostingFlag } from '../types/jobPosting';
import { ApiConfig } from '../types/api';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  }
});

// In-memory store for job verification status (would use Redis in production)
const jobStatusStore = new Map<string, {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  result?: JobVerificationResult;
  error?: string;
  timestamp: Date;
}>();

class InMemoryVerificationCache implements VerificationCache {
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
  }

  async get(key: string): Promise<any | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl * 1000);
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

// Initialize services
const cache = new InMemoryVerificationCache();
const config: ApiConfig = {
  openCorporates: {
    apiKey: process.env.OPENCORPORATES_API_KEY || '',
    baseUrl: process.env.OPENCORPORATES_BASE_URL || 'https://api.opencorporates.com/v0.4'
  },
  companiesHouse: {
    apiKey: process.env.COMPANIES_HOUSE_API_KEY || '',
    baseUrl: process.env.COMPANIES_HOUSE_BASE_URL || 'https://api.company-information.service.gov.uk'
  }
};

const companyVerificationService = new CompanyVerificationService(config);
const jobVerificationService = new JobPostingVerificationService(companyVerificationService, cache);

// Middleware to validate API key
const validateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({
      error: 'Invalid or missing API key',
      code: 'INVALID_API_KEY'
    });
  }
  next();
};

// Submit job for verification
router.post('/submit-job', apiLimiter, validateApiKey, async (req, res) => {
  try {
    const jobPosting: JobPosting = req.body;
    const jobId = uuidv4();

    // Validate required fields
    const validationError = validateJobPosting(jobPosting);
    if (validationError) {
      return res.status(400).json({
        error: 'Invalid job posting data',
        details: validationError,
        code: 'INVALID_JOB_DATA'
      });
    }

    // Store initial status
    jobStatusStore.set(jobId, {
      status: 'PENDING',
      timestamp: new Date()
    });

    // Process verification asynchronously
    processJobVerification(jobId, jobPosting);

    res.status(202).json({
      jobId,
      status: 'PENDING',
      message: 'Job verification request accepted',
      statusEndpoint: `/api/job-status/${jobId}`
    });
  } catch (error) {
    console.error('Error submitting job:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Check job verification status
router.get('/job-status/:jobId', validateApiKey, (req, res) => {
  const { jobId } = req.params;
  const status = jobStatusStore.get(jobId);

  if (!status) {
    return res.status(404).json({
      error: 'Job not found',
      code: 'JOB_NOT_FOUND'
    });
  }

  // Clean up old completed jobs
  cleanupOldJobs();

  res.json({
    jobId,
    ...status,
    timestamp: status.timestamp.toISOString()
  });
});

// Get verification badge
router.get('/badge/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const status = jobStatusStore.get(jobId);

  if (!status || status.status !== 'COMPLETED') {
    return res.status(404).json({
      error: 'Verification not found or pending',
      code: 'VERIFICATION_NOT_FOUND'
    });
  }

  const result = status.result!;
  const badgeData = {
    verificationStatus: result.verificationStatus,
    confidence: result.metadata.confidence,
    verificationDate: status.timestamp,
    companyName: result.company || 'Unknown Company',
    badgeUrl: getBadgeUrl(result)
  };

  res.json(badgeData);
});

// Get detailed verification metrics
router.get('/metrics/:jobId', validateApiKey, async (req, res) => {
  const { jobId } = req.params;
  const status = jobStatusStore.get(jobId);

  if (!status || status.status !== 'COMPLETED') {
    return res.status(404).json({
      error: 'Metrics not found or verification pending',
      code: 'METRICS_NOT_FOUND'
    });
  }

  const result = status.result!;
  res.json({
    verificationDetails: result.verificationDetails,
    flags: result.flags,
    recommendations: result.recommendations,
    timestamp: status.timestamp
  });
});

// Bulk job verification
router.post('/submit-jobs/bulk', apiLimiter, validateApiKey, async (req, res) => {
  try {
    const jobPostings: JobPosting[] = req.body.jobs;
    if (!Array.isArray(jobPostings) || jobPostings.length === 0) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: 'Expected non-empty array of job postings',
        code: 'INVALID_REQUEST'
      });
    }

    if (jobPostings.length > 100) {
      return res.status(400).json({
        error: 'Too many jobs',
        details: 'Maximum 100 jobs per bulk request',
        code: 'BATCH_TOO_LARGE'
      });
    }

    const jobIds = await Promise.all(
      jobPostings.map(async (posting) => {
        const jobId = uuidv4();
        const validationError = validateJobPosting(posting);
        
        if (validationError) {
          return {
            jobId,
            status: 'FAILED',
            error: validationError
          };
        }

        jobStatusStore.set(jobId, {
          status: 'PENDING',
          timestamp: new Date()
        });

        // Process verification asynchronously
        processJobVerification(jobId, posting);

        return {
          jobId,
          status: 'PENDING',
          statusEndpoint: `/api/job-status/${jobId}`
        };
      })
    );

    res.status(202).json({
      message: 'Bulk verification request accepted',
      jobs: jobIds
    });
  } catch (error) {
    console.error('Error submitting bulk jobs:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Get bulk status
router.post('/job-status/bulk', validateApiKey, async (req, res) => {
  try {
    const { jobIds } = req.body;
    if (!Array.isArray(jobIds)) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: 'Expected array of job IDs',
        code: 'INVALID_REQUEST'
      });
    }

    const statuses = jobIds.map(jobId => {
      const status = jobStatusStore.get(jobId);
      return status ? {
        jobId,
        ...status,
        timestamp: status.timestamp.toISOString()
      } : {
        jobId,
        status: 'NOT_FOUND'
      };
    });

    res.json({ statuses });
  } catch (error) {
    console.error('Error fetching bulk status:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Webhook registration
router.post('/webhooks/register', validateApiKey, async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        error: 'Invalid webhook configuration',
        details: 'URL and events array required',
        code: 'INVALID_WEBHOOK'
      });
    }

    // Store webhook configuration (mock implementation)
    const webhookId = uuidv4();
    webhookStore.set(webhookId, {
      url,
      events,
      secret,
      createdAt: new Date()
    });

    res.json({
      webhookId,
      message: 'Webhook registered successfully'
    });
  } catch (error) {
    console.error('Error registering webhook:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Get verification statistics
router.get('/stats', validateApiKey, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const groupBy = (req.query.groupBy as string) || 'day';
    const stats = await getVerificationStats(startDate as string, endDate as string, groupBy);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch verification stats',
      code: 'STATS_ERROR'
    });
  }
});

// Retry failed verification
router.post('/job-status/:jobId/retry', validateApiKey, async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = jobStatusStore.get(jobId);

    if (!status) {
      return res.status(404).json({
        error: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    if (status.status !== 'FAILED') {
      return res.status(400).json({
        error: 'Can only retry failed jobs',
        code: 'INVALID_RETRY'
      });
    }

    // Reset status and retry verification
    jobStatusStore.set(jobId, {
      status: 'PENDING',
      timestamp: new Date()
    });

    // Process verification asynchronously
    processJobVerification(jobId, req.body);

    res.json({
      jobId,
      status: 'PENDING',
      message: 'Verification retry initiated',
      statusEndpoint: `/api/job-status/${jobId}`
    });
  } catch (error) {
    console.error('Error retrying verification:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Update job posting
router.put('/jobs/:jobId', validateApiKey, async (req, res) => {
  try {
    const { jobId } = req.params;
    const updatedPosting: JobPosting = req.body;

    const status = jobStatusStore.get(jobId);
    if (!status) {
      return res.status(404).json({
        error: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    const validationError = validateJobPosting(updatedPosting);
    if (validationError) {
      return res.status(400).json({
        error: 'Invalid job posting data',
        details: validationError,
        code: 'INVALID_JOB_DATA'
      });
    }

    // Reset status and reverify
    jobStatusStore.set(jobId, {
      status: 'PENDING',
      timestamp: new Date()
    });

    // Process verification asynchronously
    processJobVerification(jobId, updatedPosting);

    res.json({
      jobId,
      status: 'PENDING',
      message: 'Job updated and reverification initiated',
      statusEndpoint: `/api/job-status/${jobId}`
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Mock webhook store
const webhookStore = new Map<string, {
  url: string;
  events: string[];
  secret?: string;
  createdAt: Date;
}>();

// Helper function for stats
async function getVerificationStats(startDate: any, endDate: any, groupBy: string) {
  // Mock implementation
  return {
    totalJobs: 1000,
    verifiedJobs: 850,
    flaggedJobs: 150,
    averageConfidence: 85.5,
    timeDistribution: {
      '2024-01': {
        total: 100,
        verified: 85,
        flagged: 15
      }
      // ... more time periods
    },
    flagTypes: {
      'SPAM': 50,
      'SCAM': 30,
      'SUSPICIOUS_COMPANY': 40,
      'LOW_QUALITY': 30
    }
  };
}

// Helper functions
async function processJobVerification(jobId: string, jobPosting: JobPosting) {
  try {
    const result = await jobVerificationService.verifyJobPosting(jobPosting);
    jobStatusStore.set(jobId, {
      status: 'COMPLETED',
      result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    jobStatusStore.set(jobId, {
      status: 'FAILED',
      error: 'Verification process failed',
      timestamp: new Date()
    });
  }
}

function validateJobPosting(jobPosting: JobPosting): string | null {
  const requiredFields = [
    'title',
    'description',
    'company',
    'location'
  ] as const;

  const missingFields = requiredFields.filter(field => !jobPosting[field as keyof JobPosting]);
  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }

  return null;
}

function isValidApiKey(apiKey: string | string[]): boolean {
  // Mock implementation - would validate against stored API keys
  return typeof apiKey === 'string' && apiKey.length > 0;
}

function getBadgeUrl(result: JobVerificationResult): string {
  // Mock implementation - would generate or return badge image URL
  const baseUrl = process.env.BADGE_BASE_URL || 'https://api.trustos.com/badges';
  const type = result.verificationStatus === 'VERIFIED' ? 'verified' : 'flagged';
  return `${baseUrl}/${type}.svg`;
}

function cleanupOldJobs() {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();

  for (const [jobId, status] of jobStatusStore.entries()) {
    if (now - status.timestamp.getTime() > maxAge) {
      jobStatusStore.delete(jobId);
    }
  }
}

export default router; 