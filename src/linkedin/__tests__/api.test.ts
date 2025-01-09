import LinkedInAPI from '../api';
import { LinkedInConfig } from '../../types/linkedin';

describe('LinkedInAPI', () => {
  let api: LinkedInAPI;
  
  beforeEach(() => {
    const config: LinkedInConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
      scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social']
    };
    api = new LinkedInAPI(config);
  });

  describe('authenticateJobPoster', () => {
    it('should return invalid result for non-existent member', async () => {
      const result = await api.authenticateJobPoster('invalid-id');
      expect(result.isValid).toBe(false);
      expect(result.isAuthentic).toBe(false);
      expect(result.details).toBeDefined();
      expect(result.metadata?.verifiedAt).toBeDefined();
    });
  });

  describe('crossReferenceJobPosting', () => {
    it('should return invalid result for non-existent job', async () => {
      const result = await api.crossReferenceJobPosting('company-id', 'invalid-job-id');
      expect(result.isValid).toBe(false);
      expect(result.isAuthentic).toBe(false);
      expect(result.details).toBeDefined();
      expect(result.metadata?.verifiedAt).toBeDefined();
    });
  });
}); 