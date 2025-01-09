import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './hooks/useAuth';
import AppRouter from './routes';
import { initErrorMonitoring, setUserContext } from './utils/errorMonitoring';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0077B5', // LinkedIn blue
    },
    secondary: {
      main: '#00A0DC',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const App: React.FC = () => {
  React.useEffect(() => {
    initErrorMonitoring();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 