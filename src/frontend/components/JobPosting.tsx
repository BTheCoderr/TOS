import React, { useState, useEffect } from 'react';
import VerificationBadge from './VerificationBadge';
import './JobPosting.css';

interface JobPostingProps {
  jobId: string;
  pageId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  postedDate: string;
}

const JobPosting: React.FC<JobPostingProps> = ({
  jobId,
  pageId,
  title,
  company,
  location,
  description,
  postedDate
}) => {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const response = await fetch(`/api/verify/job`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'frontend-user' // In production, use actual user ID
          },
          body: JSON.stringify({ jobId, pageId })
        });
        
        const data = await response.json();
        setVerificationData(data);
      } catch (error) {
        console.error('Failed to verify job posting:', error);
        setVerificationData({
          verified: false,
          trustScore: 0,
          details: {
            errors: ['Failed to verify job posting']
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [jobId, pageId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="job-posting">
      <div className="job-header">
        <div className="job-title-section">
          <h2 className="job-title">{title}</h2>
          <div className="job-meta">
            <span className="company">{company}</span>
            <span className="location">{location}</span>
            <span className="posted-date">Posted {formatDate(postedDate)}</span>
          </div>
        </div>
        <div className="verification-section">
          {loading ? (
            <div className="loading">Verifying...</div>
          ) : (
            <VerificationBadge
              score={verificationData.trustScore}
              isVerified={verificationData.verified}
              details={verificationData.details}
            />
          )}
        </div>
      </div>
      <div className="job-description">
        {description}
      </div>
      <div className="job-actions">
        <button className="apply-button">Apply Now</button>
        <button className="save-button">Save Job</button>
      </div>
    </div>
  );
};

export default JobPosting; 