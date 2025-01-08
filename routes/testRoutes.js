const express = require('express');
const MockDataService = require('../services/MockDataService');
const MonitoringService = require('../services/MonitoringService');

const router = express.Router();

// Get test companies
router.get('/companies', async (req, res) => {
  try {
    res.json(MockDataService.companies);
  } catch (err) {
    MonitoringService.logError(err, { endpoint: '/test/companies' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test company verification
router.post('/verify', async (req, res) => {
  try {
    const { registrationNumber } = req.body;
    
    if (!registrationNumber) {
      return res.status(400).json({ 
        error: 'Registration number is required' 
      });
    }

    const result = await MockDataService.verifyCompany({ registrationNumber });
    res.json(result);
  } catch (err) {
    MonitoringService.logError(err, { 
      endpoint: '/test/verify',
      data: req.body 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get verification history
router.get('/history/:companyId', async (req, res) => {
  try {
    const history = await MockDataService.getCompanyVerificationHistory(req.params.companyId);
    
    if (!history.length) {
      return res.status(404).json({ error: 'No history found' });
    }
    
    res.json(history);
  } catch (err) {
    MonitoringService.logError(err, { 
      endpoint: '/test/history',
      companyId: req.params.companyId 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 