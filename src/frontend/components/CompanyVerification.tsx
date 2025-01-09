import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';

const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

const FormField = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

interface CompanyVerificationProps {
  onVerify: (companyId: string) => Promise<any>;
}

const CompanyVerification: React.FC<CompanyVerificationProps> = ({ onVerify }) => {
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const verificationResult = await onVerify(companyId);
      setResult(verificationResult);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <Typography variant="h5" gutterBottom>
        Verify Company
      </Typography>

      <form onSubmit={handleSubmit}>
        <FormField>
          <TextField
            fullWidth
            label="Company ID"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            disabled={loading}
            required
            helperText="Enter the LinkedIn company ID"
          />
        </FormField>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !companyId}
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
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Verification Result
            </Typography>
            
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Company Details
              </Typography>
              <Typography variant="body2">
                Name: {result.details?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Status: {result.details?.status}
              </Typography>
              {result.details?.industry && (
                <Typography variant="body2" color="textSecondary">
                  Industry: {result.details.industry}
                </Typography>
              )}
              {result.metadata?.confidence && (
                <Typography variant="body2" color="textSecondary">
                  Confidence Score: {result.metadata.confidence}%
                </Typography>
              )}
              {!result.isVerified && result.details?.failureReason && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {result.details.failureReason}
                </Alert>
              )}
            </Box>
          </Box>
        )}
      </form>
    </FormContainer>
  );
};

export default CompanyVerification; 