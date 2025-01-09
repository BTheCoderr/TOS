import express from 'express';
import rateLimit from 'express-rate-limit';
import { TrustVerificationService } from '../services/trustVerificationService';
import { logger } from '../utils/logger';

const router = express.Router();
const verificationService = new TrustVerificationService();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // default 1 minute
  max: parseInt(process.env.MAX_REQUESTS_PER_WINDOW || '30'), // default 30 requests per window
  message: 'Too many requests from this IP, please try again later.'
});

router.use(limiter);

// Middleware to validate request parameters
const validateParams = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { pageId, jobId, memberId } = req.params;
  if (!pageId && !jobId && !memberId) {
    return res.status(400).json({
      error: 'Missing required parameters'
    });
  }
  next();
};

// Verify a job posting
router.post('/verify/job/:pageId/:jobId', validateParams, async (req, res) => {
  try {
    const { pageId, jobId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const result = await verificationService.verifyJobPosting(pageId, jobId, userId);
    res.json(result);
  } catch (error: any) {
    logger.error('Job verification error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred during job verification'
    });
  }
});

// Verify a job poster
router.post('/verify/member/:memberId', validateParams, async (req, res) => {
  try {
    const { memberId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const result = await verificationService.verifyJobPoster(memberId, userId);
    res.json(result);
  } catch (error: any) {
    logger.error('Member verification error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred during member verification'
    });
  }
});

// Get employment history
router.get('/member/:memberId/history', validateParams, async (req, res) => {
  try {
    const { memberId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const result = await verificationService.verifyJobPoster(memberId, userId);
    res.json(result);
  } catch (error: any) {
    logger.error('Employment history error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred while fetching employment history'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router; 