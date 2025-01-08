const express = require('express');
const CompanyVerificationService = require('../services/CompanyVerificationService');
const BetaTestingService = require('../services/BetaTestingService');
const MonitoringService = require('../services/MonitoringService');
const Company = require('../models/Company');

const router = express.Router();

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await MonitoringService.getMetrics();
    res.set('Content-Type', MonitoringService.metrics.register.contentType);
    res.end(metrics);
  } catch (err) {
    MonitoringService.logError(err, { endpoint: '/metrics' });
    res.status(500).json({ error: 'Error fetching metrics' });
  }
});

// Verify a company
router.post('/verify', async (req, res) => {
  const startTime = process.hrtime();
  
  try {
    const { companyName, registrationNumber } = req.body;
    
    if (!companyName || !registrationNumber) {
      MonitoringService.recordApiRequest('/verify', 'POST', 400);
      return res.status(400).json({ 
        error: 'Company name and registration number are required' 
      });
    }

    const result = await CompanyVerificationService.verifyCompany(req.body);
    
    // Record metrics
    const duration = process.hrtime(startTime);
    MonitoringService.recordVerificationAttempt(duration[0] + duration[1] / 1e9, result.status);
    MonitoringService.recordApiRequest('/verify', 'POST', 200);
    MonitoringService.logVerificationEvent(req.body, result);

    res.status(200).json(result);
  } catch (err) {
    MonitoringService.logError(err, { 
      endpoint: '/verify',
      companyData: req.body 
    });
    MonitoringService.recordApiRequest('/verify', 'POST', 500);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get verification status
router.get('/:registrationNumber', async (req, res) => {
  try {
    const company = await Company.findOne({ 
      registrationNumber: req.params.registrationNumber 
    });
    
    if (!company) {
      MonitoringService.recordApiRequest('/:registrationNumber', 'GET', 404);
      return res.status(404).json({ error: 'Company not found' });
    }
    
    MonitoringService.recordApiRequest('/:registrationNumber', 'GET', 200);
    res.status(200).json(company);
  } catch (err) {
    MonitoringService.logError(err, { 
      endpoint: '/:registrationNumber',
      registrationNumber: req.params.registrationNumber 
    });
    MonitoringService.recordApiRequest('/:registrationNumber', 'GET', 500);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Beta testing routes
router.post('/partner/:partnerName/verify', async (req, res) => {
  const startTime = process.hrtime();
  
  try {
    const { partnerName } = req.params;
    const { companyName, registrationNumber } = req.body;
    
    if (!companyName || !registrationNumber) {
      MonitoringService.recordApiRequest(`/partner/${partnerName}/verify`, 'POST', 400);
      return res.status(400).json({ 
        error: 'Company name and registration number are required' 
      });
    }

    const result = await BetaTestingService.verifyCompanyForPartner(
      partnerName,
      req.body
    );
    
    // Record metrics
    const duration = process.hrtime(startTime);
    MonitoringService.recordVerificationAttempt(duration[0] + duration[1] / 1e9, result.status);
    MonitoringService.recordApiRequest(`/partner/${partnerName}/verify`, 'POST', 200);

    res.status(200).json(result);
  } catch (err) {
    MonitoringService.logError(err, { 
      endpoint: '/partner/verify',
      partner: req.params.partnerName,
      companyData: req.body 
    });
    MonitoringService.recordApiRequest(`/partner/${req.params.partnerName}/verify`, 'POST', 500);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get partner verification history
router.get('/partner/:partnerName/verifications', async (req, res) => {
  try {
    const { partnerName } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      'verificationData.partnerData.source': partnerName
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const verifications = await Company.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    MonitoringService.recordApiRequest(`/partner/${partnerName}/verifications`, 'GET', 200);
    res.status(200).json(verifications);
  } catch (err) {
    MonitoringService.logError(err, { 
      endpoint: '/partner/verifications',
      partner: req.params.partnerName
    });
    MonitoringService.recordApiRequest(`/partner/${req.params.partnerName}/verifications`, 'GET', 500);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 