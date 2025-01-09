import React from 'react';
import './VerificationBadge.css';

interface VerificationBadgeProps {
  score: number;
  isVerified: boolean;
  details?: {
    companyData?: {
      name: string;
      status: string;
      jurisdiction: string;
    };
    linkedInMatch?: boolean;
    statusActive?: boolean;
    ageScore?: number;
    errors?: string[];
  };
  onClick?: () => void;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ score, isVerified, details, onClick }) => {
  const getBadgeColor = () => {
    if (!isVerified) return 'red';
    if (score >= 0.9) return 'green';
    if (score >= 0.7) return 'yellow';
    return 'red';
  };

  const getScoreText = () => {
    const percentage = Math.round(score * 100);
    return `Trust Score: ${percentage}%`;
  };

  return (
    <div className={`verification-badge ${getBadgeColor()}`} onClick={onClick}>
      <div className="badge-header">
        <span className="badge-icon">
          {isVerified ? '✓' : '!'}
        </span>
        <span className="badge-text">
          {isVerified ? 'Verified Company' : 'Verification Failed'}
        </span>
      </div>
      <div className="badge-score">
        {getScoreText()}
      </div>
      {details && (
        <div className="badge-details">
          {details.companyData && (
            <>
              <div className="detail-item">
                <strong>Name:</strong> {details.companyData.name}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {details.companyData.status}
              </div>
              <div className="detail-item">
                <strong>Jurisdiction:</strong> {details.companyData.jurisdiction}
              </div>
            </>
          )}
          {details.errors && details.errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerificationBadge; 