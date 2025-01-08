import axios from 'axios';
import LinkedInAPI from '../api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LinkedInAPI', () => {
  let api: LinkedInAPI;
  
  beforeEach(() => {
    api = new LinkedInAPI({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback'
    });
    
    // Mock successful authentication
    mockedAxios.post.mockResolvedValue({
      data: { access_token: 'test-token' }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePageActivity', () => {
    it('should validate active page with sufficient followers', async () => {
      const mockPageData = {
        id: 'test-page',
        name: 'Test Company',
        vanityName: 'testcompany',
        description: 'Test Description',
        followersCount: 500,
        lastActivityTimestamp: Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days ago
      };

      mockedAxios.mockResolvedValueOnce({ data: mockPageData });

      const result = await api.validatePageActivity('test-page');
      
      expect(result.isValid).toBe(true);
      expect(result.details).toEqual(mockPageData);
    });

    it('should invalidate inactive page', async () => {
      const mockPageData = {
        id: 'test-page',
        name: 'Test Company',
        vanityName: 'testcompany',
        description: 'Test Description',
        followersCount: 500,
        lastActivityTimestamp: Date.now() - (60 * 24 * 60 * 60 * 1000) // 60 days ago
      };

      mockedAxios.mockResolvedValueOnce({ data: mockPageData });

      const result = await api.validatePageActivity('test-page');
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('authenticateJobPoster', () => {
    it('should authenticate valid member', async () => {
      const mockMemberData = {
        id: 'test-member',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/pic.jpg',
        emailAddress: 'john@example.com',
        publicProfileUrl: 'https://linkedin.com/in/johndoe'
      };

      mockedAxios.mockResolvedValueOnce({ data: mockMemberData });

      const result = await api.authenticateJobPoster('test-member');
      
      expect(result.isAuthentic).toBe(true);
      expect(result.details).toEqual(mockMemberData);
    });

    it('should not authenticate incomplete profile', async () => {
      const mockMemberData = {
        id: 'test-member',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/pic.jpg',
        // Missing email and public profile
      };

      mockedAxios.mockResolvedValueOnce({ data: mockMemberData });

      const result = await api.authenticateJobPoster('test-member');
      
      expect(result.isAuthentic).toBe(false);
    });
  });

  describe('crossReferenceJobPosting', () => {
    it('should validate matching job and page', async () => {
      const mockJobData = {
        id: 'test-job',
        title: 'Software Engineer',
        companyId: 'test-page',
        location: 'San Francisco, CA',
        postedAt: Date.now(),
        active: true
      };

      const mockPageData = {
        id: 'test-page',
        name: 'Test Company',
        vanityName: 'testcompany',
        description: 'Test Description',
        followersCount: 500,
        lastActivityTimestamp: Date.now()
      };

      mockedAxios.mockResolvedValueOnce({ data: mockJobData });
      mockedAxios.mockResolvedValueOnce({ data: mockPageData });

      const result = await api.crossReferenceJobPosting('test-page', 'test-job');
      
      expect(result.isValid).toBe(true);
      expect(result.details).toEqual(mockJobData);
    });

    it('should invalidate inactive job', async () => {
      const mockJobData = {
        id: 'test-job',
        title: 'Software Engineer',
        companyId: 'test-page',
        location: 'San Francisco, CA',
        postedAt: Date.now(),
        active: false
      };

      const mockPageData = {
        id: 'test-page',
        name: 'Test Company',
        vanityName: 'testcompany',
        description: 'Test Description',
        followersCount: 500,
        lastActivityTimestamp: Date.now()
      };

      mockedAxios.mockResolvedValueOnce({ data: mockJobData });
      mockedAxios.mockResolvedValueOnce({ data: mockPageData });

      const result = await api.crossReferenceJobPosting('test-page', 'test-job');
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: 'Invalid credentials'
        }
      });

      await expect(api.validatePageActivity('test-page')).rejects.toThrow('LinkedIn API Error: 401');
    });

    it('should handle rate limiting', async () => {
      mockedAxios.mockRejectedValueOnce({
        response: {
          status: 429,
          data: 'Rate limit exceeded'
        }
      });

      await expect(api.validatePageActivity('test-page')).rejects.toThrow('LinkedIn API Error: 429');
    });
  });
}); 