import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const handleLinkedInLogin = () => {
    login('linkedin', '/auth/linkedin/callback');
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to TrustOS
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sign in with LinkedIn to verify your company
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={handleLinkedInLogin}
        >
          Sign in with LinkedIn
        </Button>
      </Paper>
    </Box>
  );
};

export default LoginPage; 