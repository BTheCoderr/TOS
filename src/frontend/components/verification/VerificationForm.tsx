import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VerificationBadge, { VerificationStatus } from './VerificationBadge';

interface VerificationFormProps {
  onVerify: (pageId: string, jobId: string) => Promise<any>;
}

const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 600,
  margin: '0 auto',
}));

const FormField = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const ResultContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

const VerificationForm: React.FC<VerificationFormProps> = ({ onVerify }) => {
  const [pageId, setPageId] = useState('');
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const verificationResult = await onVerify(pageId, jobId);
      setResult(verificationResult);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = (): VerificationStatus => {
    if (!result) return 'PENDING';
    if (result.verified) return 'VERIFIED';
    if (result.details?.failureReason) return 'FLAGGED';
    return 'FAILED';
  };

  return (
    <FormContainer elevation={2}>
      <Typography variant="h5" gutterBottom>
        Verify Job Posting
      </Typography>

      <form onSubmit={handleSubmit}>
        <FormField>
          <TextField
            fullWidth
            label="Company Page ID"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            disabled={loading}
            required
            helperText="Enter the LinkedIn company page ID"
          />
        </FormField>

        <FormField>
          <TextField
            fullWidth
            label="Job Posting ID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            disabled={loading}
            required
            helperText="Enter the LinkedIn job posting ID"
          />
        </FormField>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !pageId || !jobId}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>

        {error && (
          <Box mt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {result && (
          <ResultContainer>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Verification Result</Typography>
              <VerificationBadge
                status={getVerificationStatus()}
                score={result.trustScore}
                showScore={true}
              />
            </Box>

            {result.details && (
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Details
                </Typography>
                <Typography variant="body2">
                  {result.details.job?.title} at {result.details.job?.company}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Posted: {new Date(result.details.job?.postedDate).toLocaleDateString()}
                </Typography>
                {result.details.failureReason && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {result.details.failureReason}
                  </Alert>
                )}
              </Box>
            )}
          </ResultContainer>
        )}
      </form>
    </FormContainer>
  );
};

export default VerificationForm; 