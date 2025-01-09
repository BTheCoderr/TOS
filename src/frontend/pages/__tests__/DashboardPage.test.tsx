import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DashboardPage from '../DashboardPage';
import { useAuth } from '../../hooks/useAuth';
import { trackPageView } from '../../utils/analytics';

// Mock the auth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock analytics
jest.mock('../../utils/analytics', () => ({
  trackPageView: jest.fn(),
}));

const mockMetrics = {
  totalVerifications: 100,
  verifiedCount: 80,
  flaggedCount: 20,
  averageScore: 85,
  recentVerifications: [
    {
      id: '1',
      company: 'Test Company 1',
      status: 'verified' as const,
      score: 90,
      timestamp: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      company: 'Test Company 2',
      status: 'flagged' as const,
      score: 45,
      timestamp: '2023-01-02T00:00:00Z',
    },
  ],
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMetrics),
      })
    ) as jest.Mock;

    // Mock auth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });
  });

  it('tracks page view on mount', () => {
    renderWithTheme(<DashboardPage />);
    expect(trackPageView).toHaveBeenCalledWith('/dashboard');
  });

  it('displays loading state initially', () => {
    renderWithTheme(<DashboardPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch dashboard metrics';
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      })
    ) as jest.Mock;

    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays dashboard metrics when loaded', async () => {
    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      // Check for metric cards
      expect(screen.getByText('Total Verifications')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      
      expect(screen.getByText('Verified Companies')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      
      expect(screen.getByText('Flagged Companies')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      
      expect(screen.getByText('Average Trust Score')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('displays recent verifications', async () => {
    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      // Check for recent verifications section
      expect(screen.getByText('Recent Verifications')).toBeInTheDocument();
      
      // Check for individual verification items
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('Test Company 2')).toBeInTheDocument();
    });
  });

  it('displays welcome message with user name', async () => {
    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test User/)).toBeInTheDocument();
    });
  });

  it('displays welcome message with email when name is not available', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' },
    });

    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, test@example.com/)).toBeInTheDocument();
    });
  });

  it('shows correct status icons for verifications', async () => {
    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      const verifiedIcons = screen.getAllByTestId('VerifiedUserIcon');
      const warningIcons = screen.getAllByTestId('WarningIcon');
      
      expect(verifiedIcons).toHaveLength(1); // One verified company
      expect(warningIcons).toHaveLength(1); // One flagged company
    });
  });

  it('formats dates correctly in recent verifications', async () => {
    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      const formattedDate = new Date('2023-01-01T00:00:00Z').toLocaleString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', async () => {
    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      const trends = screen.getAllByText(/% vs last week/);
      expect(trends).toHaveLength(4); // One for each metric card
    });
  });

  it('handles empty recent verifications gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ...mockMetrics,
          recentVerifications: [],
        }),
      })
    ) as jest.Mock;

    renderWithTheme(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText('Test Company 1')).not.toBeInTheDocument();
    });
  });
}); 