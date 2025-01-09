import * as Sentry from '@sentry/react';
import { trackError } from '../analytics';
import {
  initializeSentry,
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  setExtraContext,
  setTags,
  startTransaction,
  monitorAPICall,
} from '../errorMonitoring';

// Mock Sentry
jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setExtra: jest.fn(),
  setTag: jest.fn(),
  startTransaction: jest.fn(() => ({
    setStatus: jest.fn(),
    finish: jest.fn(),
  })),
}));

// Mock analytics
jest.mock('../analytics', () => ({
  trackError: jest.fn(),
}));

describe('Error Monitoring', () => {
  const originalEnv = process.env;
  const mockSentryDsn = 'https://mock-dsn@sentry.io/123';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    process.env.REACT_APP_SENTRY_DSN = mockSentryDsn;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initializeSentry', () => {
    it('initializes Sentry with correct config in production', () => {
      initializeSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: mockSentryDsn,
          enabled: true,
          tracesSampleRate: 0.1,
        })
      );
    });

    it('does not initialize Sentry without DSN', () => {
      process.env.REACT_APP_SENTRY_DSN = '';
      initializeSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('configures different sampling rate in development', () => {
      process.env.NODE_ENV = 'development';
      initializeSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0,
        })
      );
    });
  });

  describe('captureError', () => {
    const mockError = new Error('Test error');
    const mockContext = { additional: 'info' };

    it('captures exception in production', () => {
      captureError(mockError, mockContext);

      expect(Sentry.captureException).toHaveBeenCalledWith(mockError, {
        extra: mockContext,
      });
      expect(trackError).toHaveBeenCalledWith(mockError);
    });

    it('does not send to Sentry in development', () => {
      process.env.NODE_ENV = 'development';
      captureError(mockError, mockContext);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(trackError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('captureMessage', () => {
    it('captures message with correct severity', () => {
      captureMessage('Test message', 'error');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'error');
    });

    it('uses info level by default', () => {
      captureMessage('Test message');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });
  });

  describe('user context', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('sets user context', () => {
      setUserContext(mockUser);
      expect(Sentry.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('clears user context', () => {
      clearUserContext();
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('context and tags', () => {
    it('sets extra context', () => {
      const context = { key: 'value' };
      setExtraContext(context);
      expect(Sentry.setExtra).toHaveBeenCalledWith('context', context);
    });

    it('sets tags', () => {
      const tags = { version: '1.0.0' };
      setTags(tags);
      expect(Sentry.setTag).toHaveBeenCalledWith('version', '1.0.0');
    });
  });

  describe('performance monitoring', () => {
    it('starts transaction', () => {
      startTransaction('test', 'http');
      expect(Sentry.startTransaction).toHaveBeenCalledWith({
        name: 'test',
        op: 'http',
      });
    });

    describe('monitorAPICall', () => {
      it('monitors successful API calls', async () => {
        const mockPromise = Promise.resolve('success');
        const result = await monitorAPICall(mockPromise, 'test-api');

        expect(result).toBe('success');
        expect(Sentry.startTransaction).toHaveBeenCalled();
      });

      it('handles and tracks API errors', async () => {
        const mockError = new Error('API Error');
        const mockPromise = Promise.reject(mockError);

        await expect(monitorAPICall(mockPromise, 'test-api')).rejects.toThrow('API Error');
        expect(Sentry.startTransaction).toHaveBeenCalled();
        expect(trackError).toHaveBeenCalledWith(mockError);
      });
    });
  });
}); 