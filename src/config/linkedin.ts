import dotenv from 'dotenv';

dotenv.config();

export const linkedInConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
  scope: [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social',
    'r_organization_social',
    'rw_organization_admin',
    'w_organization_social'
  ].join(' ')
}; 