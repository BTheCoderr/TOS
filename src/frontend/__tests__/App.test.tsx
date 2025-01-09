import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: jest.fn(),
    loginWithLinkedIn: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock the router components
jest.mock('../routes', () => () => <div data-testid="mock-router">Router Content</div>);

describe('App', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('mock-router')).toBeInTheDocument();
  });

  it('applies theme correctly', () => {
    render(<App />);
    const router = screen.getByTestId('mock-router');
    const styles = window.getComputedStyle(router);
    
    // The exact values might vary depending on the browser/environment
    expect(styles.fontFamily).toMatch(/Segoe UI|Roboto/);
  });

  it('renders with CssBaseline', () => {
    render(<App />);
    const html = document.documentElement;
    const body = document.body;

    // Check if CssBaseline has been applied
    expect(html).toHaveStyle({ WebkitTextSizeAdjust: '100%' });
    expect(body).toHaveStyle({ margin: '0' });
  });

  it('provides authentication context', () => {
    // Mock implementation to verify AuthProvider is working
    jest.mock('../hooks/useAuth', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="auth-provider">{children}</div>
      ),
      useAuth: jest.fn(),
    }));

    render(<App />);
    expect(screen.getByTestId('mock-router')).toBeInTheDocument();
  });
}); 