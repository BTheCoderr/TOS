import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import { trackPageView } from '../utils/analytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}

interface DashboardMetrics {
  totalVerifications: number;
  verifiedCount: number;
  flaggedCount: number;
  averageScore: number;
  recentVerifications: Array<{
    id: string;
    company: string;
    status: 'verified' | 'flagged';
    score: number;
    timestamp: string;
  }>;
}

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const TrendIndicator = styled(Typography)<{ trend: number }>(({ theme, trend }) => ({
  color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  '&::before': {
    content: '""',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderBottom: trend >= 0 ? `4px solid ${theme.palette.success.main}` : 'none',
    borderTop: trend < 0 ? `4px solid ${theme.palette.error.main}` : 'none',
  },
}));

const StatCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, color }) => (
  <MetricCard>
    <CardContent>
      <IconWrapper sx={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </IconWrapper>
      <Typography variant="h4" component="div" gutterBottom>
        {value}
      </Typography>
      <Typography color="textSecondary" variant="subtitle2">
        {title}
      </Typography>
      {trend !== undefined && (
        <TrendIndicator variant="body2" trend={trend}>
          {Math.abs(trend)}% vs last week
        </TrendIndicator>
      )}
    </CardContent>
  </MetricCard>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackPageView('/dashboard');
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics/dashboard', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard metrics');
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user?.name || user?.email}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Verifications"
            value={metrics.totalVerifications}
            icon={<TimelineIcon />}
            trend={12}
            color="#0077B5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Verified Companies"
            value={metrics.verifiedCount}
            icon={<VerifiedIcon />}
            trend={8}
            color="#00A0DC"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Flagged Companies"
            value={metrics.flaggedCount}
            icon={<WarningIcon />}
            trend={-5}
            color="#FF4D4F"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Trust Score"
            value={`${metrics.averageScore}%`}
            icon={<SpeedIcon />}
            trend={3}
            color="#52C41A"
          />
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Recent Verifications
        </Typography>
        <Grid container spacing={2}>
          {metrics.recentVerifications.map((verification) => (
            <Grid item xs={12} key={verification.id}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle1">{verification.company}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(verification.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Trust Score
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={verification.score}
                        sx={{ width: 100, height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    {verification.status === 'verified' ? (
                      <VerifiedIcon color="success" />
                    ) : (
                      <WarningIcon color="error" />
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage; 