import express from 'express';
import { JobPostingVerificationService } from '../services/jobPostingVerificationService';
import { CompanyVerificationService } from '../services/companyVerificationService';
import { InMemoryVerificationCache } from '../services/verificationCache';
import { StatisticsService } from '../services/statisticsService';
import { CompanyVerificationRequest } from '../types/verification';

const router = express.Router();

// Initialize caches
const verificationCache = new InMemoryVerificationCache();
const statsCache = new InMemoryStatsCache();

// Initialize services
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
const jobVerificationService = new JobPostingVerificationService(
  companyVerificationService,
  verificationCache
);
const statisticsService = new StatisticsService(statsCache);

// Verify a job posting
router.post('/verify/job', async (req, res) => {
  try {
    const jobPosting = req.body;
    
    // Basic validation
    if (!jobPosting.title || !jobPosting.company || !jobPosting.description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'company', 'description']
      });
    }

    const result = await jobVerificationService.verifyJobPosting(jobPosting);
    
    // Record statistics
    await statisticsService.recordVerification(
      result.isVerified,
      result.confidence,
      result.flags
    );

    res.json(result);
  } catch (error) {
    console.error('Job verification failed:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify job posting'
    });
  }
});

// Verify a company
router.post('/verify-company', validateApiKey, rateLimiter, async (req, res) => {
  try {
    const { name, registrationNumber, jurisdiction, address } = req.body;

    if (!name || !registrationNumber) {
      return res.status(400).json({
        error: 'Missing required fields: name and registrationNumber are required',
        code: 'INVALID_REQUEST'
      });
    }

    const result = await companyVerificationService.verifyCompany({
      name,
      registrationNumber,
      jurisdiction: jurisdiction || 'UNKNOWN',
      status: 'unknown',
      location: address || 'Unknown',
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

// Get verification statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await statisticsService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve verification statistics'
    });
  }
});

// Get detailed verification statistics
router.get('/stats/detailed', async (req, res) => {
  try {
    const detailedStats = await statisticsService.getDetailedStats();
    res.json(detailedStats);
  } catch (error) {
    console.error('Failed to get detailed statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve detailed verification statistics'
    });
  }
});

export default router; 