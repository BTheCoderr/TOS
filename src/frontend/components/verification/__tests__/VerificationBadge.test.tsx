import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import VerificationBadge, { VerificationStatus } from '../VerificationBadge';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('VerificationBadge', () => {
  const statuses: VerificationStatus[] = ['VERIFIED', 'PENDING', 'FAILED', 'FLAGGED'];
  
  test.each(statuses)('renders %s status correctly', (status) => {
    renderWithTheme(<VerificationBadge status={status} />);
    
    const expectedText = {
      VERIFIED: 'Verified',
      PENDING: 'Pending',
      FAILED: 'Failed',
      FLAGGED: 'Flagged'
    }[status];
    
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  test('displays score when showScore is true', () => {
    const score = 85;
    renderWithTheme(
      <VerificationBadge status="VERIFIED" score={score} showScore={true} />
    );
    
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('does not display score when showScore is false', () => {
    const score = 85;
    renderWithTheme(
      <VerificationBadge status="VERIFIED" score={score} showScore={false} />
    );
    
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
  });

  test('does not display score when score is undefined', () => {
    renderWithTheme(
      <VerificationBadge status="VERIFIED" showScore={true} />
    );
    
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  test('displays correct icon for each status', () => {
    const { rerender } = renderWithTheme(<VerificationBadge status="VERIFIED" />);
    expect(screen.getByText('✓')).toBeInTheDocument();

    rerender(<VerificationBadge status="PENDING" />);
    expect(screen.getByText('⌛')).toBeInTheDocument();

    rerender(<VerificationBadge status="FAILED" />);
    expect(screen.getByText('✕')).toBeInTheDocument();

    rerender(<VerificationBadge status="FLAGGED" />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });
}); 