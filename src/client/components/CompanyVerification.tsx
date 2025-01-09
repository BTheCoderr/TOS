import React, { useState } from 'react';
import { Grid, TextField, Button, Alert, Typography } from '@mui/material';
import { CompanyDetails, VerificationResult } from '../../types';

interface FormData {
  name: string;
  registrationNumber: string;
  location: string;
}

const CompanyVerification: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    registrationNumber: '',
    location: ''
  });

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Company Verification
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Company Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !formData.name}
            >
              {loading ? 'Verifying...' : 'Verify Company'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity={result.verificationStatus === 'VERIFIED' ? "success" : "warning"}>
                {result.verificationStatus === 'VERIFIED' ? "Company Verified" : "Verification Failed"}
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Source:</strong> {result.metadata.source}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {result.details.status}
              </Typography>
              <Typography variant="body1">
                <strong>Confidence:</strong> {(result.metadata.confidence * 100).toFixed(1)}%
              </Typography>
              {result.details.foundingDate && (
                <Typography variant="body1">
                  <strong>Founded:</strong> {result.details.foundingDate}
                </Typography>
              )}
              {result.details.locations && result.details.locations.length > 0 && (
                <Typography variant="body1">
                  <strong>Location:</strong> {result.details.locations[0]}
                </Typography>
              )}
            </Grid>
          </Grid>
        </div>
      )}
    </div>
  );
};

export default CompanyVerification; 