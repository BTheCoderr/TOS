const promClient = require('prom-client');
const winston = require('winston');

// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'thas_' });

// Custom metrics
const verificationDuration = new promClient.Histogram({
  name: 'thas_company_verification_duration_seconds',
  help: 'Duration of company verification process',
  labelNames: ['status']
});

const verificationResults = new promClient.Counter({
  name: 'thas_company_verification_results_total',
  help: 'Total number of verification results',
  labelNames: ['status']
});

const apiRequests = new promClient.Counter({
  name: 'thas_api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['endpoint', 'method', 'status']
});

// Initialize Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class MonitoringService {
  static get metrics() {
    return promClient;
  }

  static get logger() {
    return logger;
  }

  static recordVerificationAttempt(duration, status) {
    verificationDuration.labels(status).observe(duration);
    verificationResults.labels(status).inc();
  }

  static recordApiRequest(endpoint, method, status) {
    apiRequests.labels(endpoint, method, status).inc();
  }

  static async getMetrics() {
    return promClient.register.metrics();
  }

  static logVerificationEvent(companyData, result) {
    logger.info('Company verification completed', {
      companyName: companyData.companyName,
      registrationNumber: companyData.registrationNumber,
      status: result.status,
      trustScore: result.trustScore
    });
  }

  static logError(error, context = {}) {
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      ...context
    });
  }
}

module.exports = MonitoringService; 