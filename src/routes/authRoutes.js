const express = require('express');
const LinkedInAuthService = require('../services/LinkedInAuthService');
const MonitoringService = require('../services/MonitoringService');

const router = express.Router();

// Initialize LinkedIn auth
router.get('/linkedin/init', (req, res) => {
  try {
    const authService = LinkedInAuthService.getInstance();
    const authUrl = authService.getAuthorizationUrl();
    
    // Store state in session for validation
    req.session.linkedInState = authUrl.state;
    
    res.redirect(authUrl);
  } catch (error) {
    MonitoringService.logError(error, {
      service: 'LinkedIn Auth',
      endpoint: '/linkedin/init'
    });
    res.status(500).json({ error: 'Failed to initialize LinkedIn authentication' });
  }
});

// LinkedIn OAuth callback
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const authService = LinkedInAuthService.getInstance();

    // Validate state to prevent CSRF
    if (!await authService.validateState(state, req.session.linkedInState)) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for access token
    const { accessToken, expiresIn } = await authService.getAccessToken(code);

    // Store token securely (you might want to encrypt this)
    req.session.linkedInToken = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000
    };

    res.redirect('/auth/linkedin/success');
  } catch (error) {
    MonitoringService.logError(error, {
      service: 'LinkedIn Auth',
      endpoint: '/linkedin/callback'
    });
    res.redirect('/auth/linkedin/error');
  }
});

// Success page
router.get('/linkedin/success', (req, res) => {
  res.json({
    status: 'success',
    message: 'LinkedIn authentication successful'
  });
});

// Error page
router.get('/linkedin/error', (req, res) => {
  res.status(400).json({
    status: 'error',
    message: 'LinkedIn authentication failed'
  });
});

module.exports = router; 