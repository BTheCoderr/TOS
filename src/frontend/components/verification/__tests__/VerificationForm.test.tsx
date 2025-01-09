import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import VerificationForm from '../VerificationForm';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('VerificationForm', () => {
  const mockOnVerify = jest.fn();
  const defaultProps = {
    onVerify: mockOnVerify,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form fields correctly', () => {
    renderWithTheme(<VerificationForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/company page id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job posting id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  test('submit button is disabled when fields are empty', () => {
    renderWithTheme(<VerificationForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /verify/i });
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when all fields are filled', () => {
    renderWithTheme(<VerificationForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/company page id/i), {
      target: { value: 'company123' },
    });
    fireEvent.change(screen.getByLabelText(/job posting id/i), {
      target: { value: 'job123' },
    });

    const submitButton = screen.getByRole('button', { name: /verify/i });
    expect(submitButton).not.toBeDisabled();
  });

  test('calls onVerify with correct parameters on submit', async () => {
    const mockResult = {
      verified: true,
      trustScore: 85,
      details: {
        job: {
          title: 'Software Engineer',
          company: 'TechCorp',
          postedDate: '2024-01-09T00:00:00.000Z',
        },
      },
    };
    mockOnVerify.mockResolvedValueOnce(mockResult);

    renderWithTheme(<VerificationForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/company page id/i), {
      target: { value: 'company123' },
    });
    fireEvent.change(screen.getByLabelText(/job posting id/i), {
      target: { value: 'job123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    expect(mockOnVerify).toHaveBeenCalledWith('company123', 'job123');
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText(/techcorp/i)).toBeInTheDocument();
    });
  });

  test('displays error message when verification fails', async () => {
    const errorMessage = 'Verification failed';
    mockOnVerify.mockRejectedValueOnce(new Error(errorMessage));

    renderWithTheme(<VerificationForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/company page id/i), {
      target: { value: 'company123' },
    });
    fireEvent.change(screen.getByLabelText(/job posting id/i), {
      target: { value: 'job123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows loading state during verification', async () => {
    mockOnVerify.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithTheme(<VerificationForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/company page id/i), {
      target: { value: 'company123' },
    });
    fireEvent.change(screen.getByLabelText(/job posting id/i), {
      target: { value: 'job123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    expect(screen.getByText(/verifying/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled();
  });

  test('displays verification badge with correct status', async () => {
    const mockResult = {
      verified: true,
      trustScore: 85,
      details: {
        job: {
          title: 'Software Engineer',
          company: 'TechCorp',
          postedDate: '2024-01-09T00:00:00.000Z',
        },
      },
    };
    mockOnVerify.mockResolvedValueOnce(mockResult);

    renderWithTheme(<VerificationForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/company page id/i), {
      target: { value: 'company123' },
    });
    fireEvent.change(screen.getByLabelText(/job posting id/i), {
      target: { value: 'job123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });
}); 