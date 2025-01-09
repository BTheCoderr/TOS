import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoginForm from '../LoginForm';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LoginForm', () => {
  const mockEmailLogin = jest.fn();
  const mockLinkedInLogin = jest.fn();
  const defaultProps = {
    onEmailLogin: mockEmailLogin,
    onLinkedInLogin: mockLinkedInLogin,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with all elements', () => {
    renderWithTheme(<LoginForm {...defaultProps} />);
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with linkedin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('handles email login submission', async () => {
    renderWithTheme(<LoginForm {...defaultProps} />);
    
    const email = 'test@example.com';
    const password = 'password123';

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: email },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: password },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockEmailLogin).toHaveBeenCalledWith(email, password);
  });

  test('handles LinkedIn login click', async () => {
    renderWithTheme(<LoginForm {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/continue with linkedin/i));

    expect(mockLinkedInLogin).toHaveBeenCalled();
  });

  test('shows loading state during email login', async () => {
    mockEmailLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithTheme(<LoginForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  test('shows loading state during LinkedIn login', async () => {
    mockLinkedInLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithTheme(<LoginForm {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/continue with linkedin/i));

    expect(screen.getByRole('button', { name: /continue with linkedin/i })).toBeDisabled();
  });

  test('displays error message on email login failure', async () => {
    const errorMessage = 'Invalid credentials';
    mockEmailLogin.mockRejectedValueOnce(new Error(errorMessage));

    renderWithTheme(<LoginForm {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('displays error message on LinkedIn login failure', async () => {
    const errorMessage = 'LinkedIn authentication failed';
    mockLinkedInLogin.mockRejectedValueOnce(new Error(errorMessage));

    renderWithTheme(<LoginForm {...defaultProps} />);
    
    fireEvent.click(screen.getByText(/continue with linkedin/i));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('validates required fields', () => {
    renderWithTheme(<LoginForm {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByLabelText(/email address/i)).toBeInvalid();
    expect(screen.getByLabelText(/password/i)).toBeInvalid();
  });
}); 