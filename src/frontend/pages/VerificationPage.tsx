import React from 'react';
import { Container, Paper } from '@mui/material';
import CompanyVerification from '../components/CompanyVerification';

const VerificationPage: React.FC = () => {
  const handleVerify = async (companyId: string) => {
    try {
      const response = await fetch('/api/verify/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });
      
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <CompanyVerification onVerify={handleVerify} />
      </Paper>
    </Container>
  );
};

export default VerificationPage; 