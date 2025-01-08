import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  LINKEDIN_CLIENT_ID: string;
  LINKEDIN_CLIENT_SECRET: string;
  LINKEDIN_REDIRECT_URI: string;
  PORT: number;
  NODE_ENV: string;
}

// Validate required environment variables
const requiredEnvVars = [
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'LINKEDIN_REDIRECT_URI'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config: Config = {
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID!,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET!,
  LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI!,
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development'
}; 