# TrustOS Integration Guide for Job Boards

## Overview

TrustOS provides a comprehensive job posting verification system that helps job boards ensure the quality and legitimacy of their listings. This guide explains how to integrate TrustOS into your job board platform.

## Quick Start

### 1. Add the TrustOS Widget

Add the following script tag to your HTML:

```html
<script src="https://cdn.trustos.com/widget.js"></script>
```

Initialize the widget:

```javascript
const trustos = new TrustOS({
  apiKey: 'your_api_key_here',
  theme: 'light' // or 'dark'
});

// Initialize verification badge for a job posting
trustos.initialize('job_id_here', 'container_element_id');
```

### 2. API Integration

#### Submit a Job for Verification

```javascript
const response = await fetch('https://api.trustos.com/api/submit-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your_api_key_here'
  },
  body: JSON.stringify({
    title: 'Software Engineer',
    company: {
      name: 'Example Corp',
      website: 'https://example.com'
    },
    description: 'Job description here...',
    location: 'San Francisco, CA',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID',
    salary: {
      min: 100000,
      max: 150000,
      currency: 'USD',
      period: 'YEARLY'
    }
  })
});

const result = await response.json();
// Store the jobId for status checks
const { jobId } = result;
```

#### Check Verification Status

```javascript
const response = await fetch(`https://api.trustos.com/api/job-status/${jobId}`, {
  headers: {
    'x-api-key': 'your_api_key_here'
  }
});

const status = await response.json();
```

## API Reference

### Endpoints

#### POST /api/submit-job
Submit a job posting for verification.

**Request Headers:**
- `Content-Type: application/json`
- `x-api-key: your_api_key`

**Request Body:**
```json
{
  "title": "string",
  "company": {
    "name": "string",
    "website": "string",
    "linkedInId": "string (optional)"
  },
  "description": "string",
  "location": "string",
  "employmentType": "FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP",
  "experienceLevel": "ENTRY | MID | SENIOR | EXECUTIVE",
  "salary": {
    "min": number,
    "max": number,
    "currency": "string",
    "period": "HOURLY | MONTHLY | YEARLY"
  },
  "requirements": ["string"],
  "benefits": ["string"],
  "contactInfo": {
    "email": "string",
    "phone": "string",
    "website": "string"
  },
  "workplaceType": "ONSITE | REMOTE | HYBRID",
  "skills": ["string"]
}
```

**Response:**
```json
{
  "jobId": "string",
  "status": "PENDING",
  "message": "string",
  "statusEndpoint": "string"
}
```

#### GET /api/job-status/:jobId
Check the status of a job verification request.

**Request Headers:**
- `x-api-key: your_api_key`

**Response:**
```json
{
  "jobId": "string",
  "status": "PENDING | COMPLETED | FAILED",
  "result": {
    "isVerified": boolean,
    "confidence": number,
    "flags": [
      {
        "type": "string",
        "severity": "HIGH | MEDIUM | LOW",
        "description": "string"
      }
    ],
    "recommendations": ["string"]
  },
  "timestamp": "string"
}
```

### Widget Customization

The TrustOS widget can be customized using the configuration options:

```javascript
const trustos = new TrustOS({
  apiKey: 'your_api_key_here',
  baseUrl: 'https://api.trustos.com', // Optional: override API base URL
  theme: 'light', // or 'dark'
  badgePosition: 'top-right' // top-left, top-right, bottom-left, bottom-right
});
```

### CSS Customization

The widget uses BEM-style class names that can be customized:

```css
.trustos-badge { /* Badge container */ }
.trustos-badge-content { /* Badge content */ }
.trustos-badge-content.verified { /* Verified badge */ }
.trustos-badge-content.flagged { /* Flagged badge */ }
.trustos-popup { /* Popup container */ }
/* ... etc ... */
```

## Best Practices

1. **Error Handling**
   - Always handle API errors gracefully
   - Provide user-friendly error messages
   - Implement retry logic for failed requests

2. **Performance**
   - Cache verification results
   - Load the widget asynchronously
   - Implement lazy loading for job listings

3. **Security**
   - Never expose your API key in client-side code
   - Implement rate limiting on your server
   - Validate all user inputs

4. **User Experience**
   - Show loading states during verification
   - Provide clear feedback for flagged posts
   - Make verification status clearly visible

## Example Implementation

Here's a complete example of integrating TrustOS into a job board:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Job Board</title>
  <script src="https://cdn.trustos.com/widget.js"></script>
</head>
<body>
  <div class="job-listing">
    <h2>Software Engineer</h2>
    <div id="verification-badge"></div>
    <!-- Job details here -->
  </div>

  <script>
    // Initialize TrustOS
    const trustos = new TrustOS({
      apiKey: 'your_api_key_here',
      theme: 'light'
    });

    // Submit job for verification
    async function submitJob(jobData) {
      try {
        const response = await fetch('https://api.trustos.com/api/submit-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'your_api_key_here'
          },
          body: JSON.stringify(jobData)
        });

        const { jobId } = await response.json();
        
        // Initialize verification badge
        trustos.initialize(jobId, 'verification-badge');
      } catch (error) {
        console.error('Failed to submit job:', error);
      }
    }

    // Example usage
    submitJob({
      title: 'Software Engineer',
      company: {
        name: 'Example Corp',
        website: 'https://example.com'
      },
      description: 'We are looking for...',
      location: 'San Francisco, CA',
      employmentType: 'FULL_TIME',
      experienceLevel: 'MID'
    });
  </script>
</body>
</html>
```

## Support

For additional support or questions:
- Email: support@trustos.com
- Documentation: https://docs.trustos.com
- API Status: https://status.trustos.com 