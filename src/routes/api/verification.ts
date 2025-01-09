import express from 'express';
import { InMemoryVerificationCache } from '../../services/cache';
import { InMemoryStatsCache } from '../../services/cache/InMemoryStatsCache';
import { CompanyVerificationService } from '../../services/companyVerificationService';
import { JobPostingVerificationService, FlaggedJobsResponse, JobStatusUpdate } from '../../services/jobPostingVerificationService';
import { DuplicateDetectionService } from '../../services/duplicateDetectionService';
import { validateApiKey } from '../../middleware/auth';
import { rateLimiter } from '../../middleware/rateLimiter';
import { logger } from '../../utils/logger';
import { ApiConfig } from '../../types/api';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

const router = express.Router();

// Initialize caches
const verificationCache = new InMemoryVerificationCache();
const statsCache = new InMemoryStatsCache();

// Initialize services with config
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
const jobVerificationService = new JobPostingVerificationService(companyVerificationService, verificationCache);
const duplicateDetectionService = new DuplicateDetectionService();

// Verify company endpoint
router.post('/verify-company', validateApiKey, rateLimiter, async (req, res) => {
  try {
    const { name, registrationNumber, location, address } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name',
        code: 'INVALID_REQUEST'
      });
    }

    const result = await companyVerificationService.verifyCompany({
      name,
      registrationNumber,
      location,
      address
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Company verification error:', error);
    res.status(500).json({
      error: 'Company verification failed',
      code: 'VERIFICATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate job posting endpoint
router.post('/validate-job', validateApiKey, rateLimiter, async (req, res) => {
  try {
    const jobPosting = req.body;
    
    // Validate required fields
    const requiredFields = ['title', 'company', 'description', 'location'];
    const missingFields = requiredFields.filter(field => !jobPosting[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missingFields,
        code: 'INVALID_REQUEST'
      });
    }

    // Check for duplicates first
    const duplicateCheck = await duplicateDetectionService.checkDuplicate(jobPosting);
    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        error: 'Duplicate job posting detected',
        code: 'DUPLICATE_POSTING',
        details: duplicateCheck
      });
    }

    // Verify the job posting
    const result = await jobVerificationService.verifyJobPosting(jobPosting);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Job validation error:', error);
    res.status(500).json({
      error: 'Job validation failed',
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get flagged jobs endpoint
router.get('/flagged-jobs', validateApiKey, async (req, res) => {
  try {
    const { page = '1', limit = '10', severity } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    const response: FlaggedJobsResponse = await jobVerificationService.getFlaggedJobs(
      pageNum,
      limitNum,
      {
        severity: severity as string
      }
    );

    res.json({
      success: true,
      data: {
        jobs: response.jobs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: response.total,
          pages: Math.ceil(response.total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching flagged jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch flagged jobs',
      code: 'FLAGGED_JOBS_ERROR'
    });
  }
});

// Update job posting status endpoint
router.put('/jobs/:jobId/status', validateApiKey, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, resolution, notes } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING_REVIEW'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        code: 'INVALID_STATUS',
        validStatuses: ['APPROVED', 'REJECTED', 'PENDING_REVIEW']
      });
    }

    const updateData: JobStatusUpdate = {
      status: status as 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW',
      resolution,
      notes,
      updatedBy: req.user?.id,
      updatedAt: new Date()
    };

    const result = await jobVerificationService.updateJobStatus(jobId, updateData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error updating job status:', error);
    res.status(500).json({
      error: 'Failed to update job status',
      code: 'UPDATE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch verification endpoint
router.post('/verify-jobs/batch', validateApiKey, rateLimiter, async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!Array.isArray(jobs)) {
      return res.status(400).json({
        error: 'Invalid request format',
        code: 'INVALID_REQUEST',
        message: 'Expected array of jobs'
      });
    }

    if (jobs.length > 100) {
      return res.status(400).json({
        error: 'Batch size too large',
        code: 'BATCH_TOO_LARGE',
        message: 'Maximum 100 jobs per batch'
      });
    }

    const results = await Promise.allSettled(
      jobs.map(job => jobVerificationService.verifyJobPosting(job))
    );

    const processedResults = results.map((result, index) => ({
      jobIndex: index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));

    res.json({
      success: true,
      data: processedResults,
      summary: {
        total: jobs.length,
        successful: processedResults.filter(r => r.success).length,
        failed: processedResults.filter(r => !r.success).length
      }
    });
  } catch (error) {
    logger.error('Batch verification error:', error);
    res.status(500).json({
      error: 'Batch verification failed',
      code: 'BATCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verification statistics endpoint
router.get('/stats', validateApiKey, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await jobVerificationService.getVerificationStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching verification stats:', error);
    res.status(500).json({
      error: 'Failed to fetch verification stats',
      code: 'STATS_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 