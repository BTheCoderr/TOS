import React, { useState, useEffect } from 'react';
import {
  JobVerificationResult,
  JobPosting,
  JobPostingFlag
} from '../../types/jobPosting';
import { Box, Typography, Grid, Paper, Alert } from '@mui/material';

interface DashboardMetrics {
  totalVerifications: number;
  verifiedCount: number;
  flaggedCount: number;
  averageScore: number;
  topSkills: Array<{ name: string; count: number }>;
  flagDistribution: Record<string, number>;
  recentVerifications: JobVerificationResult[];
}

const VerificationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!metrics) {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Verification Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Verifications</Typography>
            <Typography variant="h4">{metrics.totalVerifications}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Verified Jobs</Typography>
            <Typography variant="h4">{metrics.verifiedCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Flagged Jobs</Typography>
            <Typography variant="h4">{metrics.flaggedCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Average Score</Typography>
            <Typography variant="h4">{metrics.averageScore.toFixed(1)}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Flag Distribution
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {Object.entries(metrics.flagDistribution).map(([flag, count]) => (
                <Box key={flag} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2">{flag}</Typography>
                  <Typography variant="h6">{count}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Skills
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {metrics.topSkills.map((skill) => (
                <Box key={skill.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{skill.name}</Typography>
                  <Typography>{skill.count}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Verifications
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {metrics.recentVerifications.map((job) => (
            <Paper
              key={job.jobId}
              sx={{ p: 2, cursor: 'pointer' }}
              onClick={() => setSelectedJob(job)}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">{job.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {job.company}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    Status: {job.verificationStatus === 'VERIFIED' ? 'Verified' : 'Flagged'}
                  </Typography>
                  <Typography variant="body2">
                    Score: {(job.metadata.confidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    Verified at: {new Date(job.metadata.verifiedAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default VerificationDashboard; 