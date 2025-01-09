# TrustOS Integration Examples

## Basic Integration Examples

### 1. Simple Badge Integration

```html
<div class="job-listing">
  <h2>Software Engineer</h2>
  <div id="verification-badge"></div>
</div>

<script>
  const trustos = new TrustOS({
    apiKey: 'your_api_key_here'
  });
  trustos.initialize('job_id_here', 'verification-badge');
</script>
```

### 2. Custom Themed Badge

```javascript
const trustos = new TrustOS({
  apiKey: 'your_api_key_here',
  theme: 'custom',
  customTheme: {
    badgeColors: {
      verified: {
        background: '#f0f7ff',
        text: '#0066cc',
        border: '#99ccff'
      },
      flagged: {
        background: '#fff0f0',
        text: '#cc0000',
        border: '#ffcccc'
      }
    }
  },
  badgeStyle: 'detailed'
});
```

### 3. Internationalization

```javascript
const trustos = new TrustOS({
  apiKey: 'your_api_key_here',
  i18n: {
    verifiedText: 'Empresa Verificada',
    flaggedText: 'Publicación Marcada',
    confidenceLabel: 'Nivel de Confianza',
    verificationDateLabel: 'Fecha de Verificación',
    flagsLabel: 'Advertencias',
    recommendationsLabel: 'Recomendaciones',
    closeText: 'Cerrar'
  }
});
```

## Advanced Integration Examples

### 1. Bulk Job Verification

```javascript
async function verifyBulkJobs(jobs) {
  try {
    const response = await fetch('https://api.trustos.com/api/submit-jobs/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your_api_key_here'
      },
      body: JSON.stringify({ jobs })
    });

    const result = await response.json();
    
    // Initialize badges for all jobs
    result.jobs.forEach(job => {
      if (job.status === 'PENDING') {
        trustos.initialize(job.jobId, `badge-${job.jobId}`);
      }
    });

    // Monitor status
    const statusResponse = await fetch('https://api.trustos.com/api/job-status/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your_api_key_here'
      },
      body: JSON.stringify({
        jobIds: result.jobs.map(job => job.jobId)
      })
    });

    const statuses = await statusResponse.json();
    console.log('Verification statuses:', statuses);
  } catch (error) {
    console.error('Bulk verification failed:', error);
  }
}

// Example usage
const jobs = [
  {
    title: 'Software Engineer',
    company: { name: 'Tech Corp', website: 'https://techcorp.com' },
    description: '...',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID'
  },
  // ... more jobs
];

verifyBulkJobs(jobs);
```

### 2. Webhook Integration

```javascript
// Register webhook
async function setupWebhook() {
  const response = await fetch('https://api.trustos.com/api/webhooks/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your_api_key_here'
    },
    body: JSON.stringify({
      url: 'https://your-domain.com/webhook',
      events: ['verification.completed', 'verification.failed'],
      secret: 'your_webhook_secret'
    })
  });

  const { webhookId } = await response.json();
  console.log('Webhook registered:', webhookId);
}

// Handle webhook events (server-side)
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-trustos-signature'];
  if (!verifyWebhookSignature(signature, req.body, 'your_webhook_secret')) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  switch (event.type) {
    case 'verification.completed':
      handleVerificationCompleted(event.data);
      break;
    case 'verification.failed':
      handleVerificationFailed(event.data);
      break;
  }

  res.status(200).send('OK');
});
```

### 3. Custom Badge Templates

```javascript
const trustos = new TrustOS({
  apiKey: 'your_api_key_here',
  customBadgeTemplate: (badge) => `
    <div class="custom-badge ${badge.isVerified ? 'verified' : 'flagged'}">
      <div class="badge-icon">
        ${badge.isVerified ? '✓' : '⚠'}
      </div>
      <div class="badge-content">
        <div class="badge-title">
          ${badge.isVerified ? 'Verified Company' : 'Flagged Post'}
        </div>
        <div class="badge-score">
          Trust Score: ${badge.confidence}%
        </div>
      </div>
    </div>
  `,
  customMetricsTemplate: (metrics) => `
    <div class="custom-metrics">
      <h3>Verification Details</h3>
      <div class="metrics-grid">
        ${Object.entries(metrics.verificationDetails).map(([key, value]) => `
          <div class="metric-item">
            <label>${key}</label>
            <span>${value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
});
```

### 4. Real-time Updates

```javascript
const trustos = new TrustOS({
  apiKey: 'your_api_key_here',
  refreshInterval: 30000, // Check every 30 seconds
  onVerificationUpdate: (result) => {
    console.log('Verification updated:', result);
    updateJobListingUI(result);
  },
  onError: (error) => {
    console.error('Verification error:', error);
    showErrorNotification(error);
  }
});

function updateJobListingUI(result) {
  const listing = document.querySelector(`#job-${result.jobId}`);
  if (listing) {
    listing.classList.toggle('verified', result.isVerified);
    listing.classList.toggle('flagged', !result.isVerified);
    // Update other UI elements...
  }
}

function showErrorNotification(error) {
  // Show error notification to user
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = `Verification error: ${error.message}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}
```

## Testing Examples

### 1. Mock Data Testing

```javascript
// Mock job posting data
const mockJobs = [
  {
    title: 'Software Engineer',
    company: {
      name: 'Valid Corp',
      website: 'https://validcorp.com'
    },
    description: 'Detailed job description...',
    location: 'San Francisco, CA',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID',
    salary: {
      min: 100000,
      max: 150000,
      currency: 'USD',
      period: 'YEARLY'
    }
  },
  {
    // Missing required fields
    title: 'Developer',
    company: {
      name: 'Invalid Corp'
    }
  },
  {
    // Suspicious content
    title: 'MAKE MONEY FAST!!!',
    company: {
      name: 'Get Rich Quick LLC',
      website: 'http://suspicious-site.com'
    },
    description: 'Work from home opportunity! No experience needed!',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    experienceLevel: 'ENTRY'
  }
];

// Test verification with mock data
async function testVerification() {
  for (const job of mockJobs) {
    try {
      const response = await fetch('https://api.trustos.com/api/submit-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your_api_key_here'
        },
        body: JSON.stringify(job)
      });

      const result = await response.json();
      console.log('Test result for job:', job.title);
      console.log('Verification result:', result);
    } catch (error) {
      console.error('Test failed for job:', job.title, error);
    }
  }
}
```

### 2. Error Handling Examples

```javascript
async function robustJobVerification(job) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch('https://api.trustos.com/api/submit-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your_api_key_here'
        },
        body: JSON.stringify(job)
      });

      if (!response.ok) {
        const error = await response.json();
        switch (error.code) {
          case 'INVALID_JOB_DATA':
            console.error('Invalid job data:', error.details);
            return null;
          case 'INVALID_API_KEY':
            throw new Error('API key is invalid');
          default:
            if (retryCount < maxRetries - 1) {
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            throw new Error(`API error: ${error.message}`);
        }
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (retryCount === maxRetries - 1) {
        throw error;
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
}

// Usage with error handling
try {
  const result = await robustJobVerification(job);
  if (result) {
    trustos.initialize(result.jobId, 'verification-badge');
  } else {
    showValidationError('Job data is invalid');
  }
} catch (error) {
  handleVerificationError(error);
}
```

## Styling Examples

### 1. Custom CSS Styling

```css
/* Custom badge styles */
.trustos-badge {
  /* Override default styles */
}

.trustos-badge-content.verified {
  /* Custom verified badge styles */
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border: 1px solid #81c784;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.trustos-badge-content.flagged {
  /* Custom flagged badge styles */
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border: 1px solid #e57373;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Custom popup styles */
.trustos-popup {
  /* Override default popup styles */
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Responsive styles */
@media (max-width: 768px) {
  .trustos-popup {
    width: 95%;
    max-width: none;
  }

  .trustos-badge-detailed {
    min-width: 150px;
  }
}
```

These examples demonstrate various integration scenarios and customization options available with the TrustOS plugin. For more specific use cases or detailed implementation guidance, please refer to the API documentation or contact our support team. 