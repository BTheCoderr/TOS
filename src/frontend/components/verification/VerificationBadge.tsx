import React from 'react';
import { styled } from '@mui/material/styles';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'FAILED' | 'FLAGGED';

interface BadgeProps {
  status: VerificationStatus;
  score?: number;
  showScore?: boolean;
}

const BadgeContainer = styled('div')<{ status: VerificationStatus }>(({ theme, status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: '16px',
  fontSize: '0.875rem',
  fontWeight: 500,
  gap: '8px',
  backgroundColor: {
    VERIFIED: theme.palette.success.light,
    PENDING: theme.palette.warning.light,
    FAILED: theme.palette.error.light,
    FLAGGED: theme.palette.error.light
  }[status],
  color: {
    VERIFIED: theme.palette.success.contrastText,
    PENDING: theme.palette.warning.contrastText,
    FAILED: theme.palette.error.contrastText,
    FLAGGED: theme.palette.error.contrastText
  }[status],
}));

const Score = styled('span')(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  padding: '2px 6px',
  borderRadius: '12px',
  fontSize: '0.75rem',
}));

const Icon = styled('span')<{ status: VerificationStatus }>(({ status }) => ({
  display: 'inline-block',
  width: '16px',
  height: '16px',
  '&::before': {
    content: {
      VERIFIED: '"✓"',
      PENDING: '"⌛"',
      FAILED: '"✕"',
      FLAGGED: '"⚠"'
    }[status]
  }
}));

const VerificationBadge: React.FC<BadgeProps> = ({ status, score, showScore = false }) => {
  const getStatusText = (status: VerificationStatus): string => {
    return {
      VERIFIED: 'Verified',
      PENDING: 'Pending',
      FAILED: 'Failed',
      FLAGGED: 'Flagged'
    }[status];
  };

  return (
    <BadgeContainer status={status}>
      <Icon status={status} />
      {getStatusText(status)}
      {showScore && score !== undefined && (
        <Score>{Math.round(score)}%</Score>
      )}
    </BadgeContainer>
  );
};

export default VerificationBadge; 