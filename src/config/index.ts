import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function validateEnvVariables() {
  const required = [
    'OPENCORPORATES_API_KEY',
    'NODE_ENV'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate on startup
validateEnvVariables();

export const config = {
  opencorporates: {
    apiKey: process.env.OPENCORPORATES_API_KEY!,
    baseUrl: process.env.API_BASE_URL || 'https://api.opencorporates.com/v0.4',
  },
  env: process.env.NODE_ENV!,
  port: parseInt(process.env.PORT || '3000', 10),
} as const; 