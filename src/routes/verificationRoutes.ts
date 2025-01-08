import { Router, Request, Response } from 'express';
import TrustVerificationService from '../services/trustVerificationService';

const router = Router();
const verificationService = new TrustVerificationService();

// Verify a job posting
router.post('/verify/job', async (req: Request, res: Response) => {
  try {
    const { pageId, jobId } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!pageId || !jobId) {
      return res.status(400).json({
        error: 'Missing required parameters: pageId and jobId are required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'User ID is required in x-user-id header'
      });
    }

    const result = await verificationService.verifyJobPosting(pageId, jobId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Verification failed',
      details: error.message
    });
  }
});

// Verify a job poster
router.post('/verify/member', async (req: Request, res: Response) => {
  try {
    const { memberId } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!memberId) {
      return res.status(400).json({
        error: 'Missing required parameter: memberId'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'User ID is required in x-user-id header'
      });
    }

    const result = await verificationService.verifyJobPoster(memberId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Verification failed',
      details: error.message
    });
  }
});

// Get analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required parameters: startTime and endTime'
      });
    }

    const report = verificationService.getAnalytics(
      parseInt(startTime as string),
      parseInt(endTime as string)
    );

    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate analytics report',
      details: error.message
    });
  }
});

export default router; 