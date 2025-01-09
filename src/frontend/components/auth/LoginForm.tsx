import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

interface LoginFormProps {
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onLinkedInLogin: () => Promise<void>;
}

const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 400,
  margin: '0 auto',
  marginTop: theme.spacing(8),
}));

const FormField = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const OrDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(3, 0),
  '& hr': {
    flexGrow: 1,
  },
  '& span': {
    margin: theme.spacing(0, 2),
    color: theme.palette.text.secondary,
  },
}));

const LinkedInButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#0077B5',
  color: 'white',
  '&:hover': {
    backgroundColor: '#006097',
  },
}));

const LoginForm: React.FC<LoginFormProps> = ({ onEmailLogin, onLinkedInLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onEmailLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await onLinkedInLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with LinkedIn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer elevation={2}>
      <Typography variant="h5" gutterBottom align="center">
        Sign In
      </Typography>

      <LinkedInButton
        fullWidth
        variant="contained"
        startIcon={<LinkedInIcon />}
        onClick={handleLinkedInLogin}
        disabled={loading}
      >
        Continue with LinkedIn
      </LinkedInButton>

      <OrDivider>
        <Divider flexItem />
        <span>or</span>
        <Divider flexItem />
      </OrDivider>

      <form onSubmit={handleEmailLogin}>
        <FormField>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
          />
        </FormField>

        <FormField>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            autoComplete="current-password"
          />
        </FormField>

        {error && (
          <FormField>
            <Alert severity="error">{error}</Alert>
          </FormField>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </FormContainer>
  );
};

export default LoginForm; 