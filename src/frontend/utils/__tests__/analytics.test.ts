import ReactGA from 'react-ga4';
import {
  trackPageView,
  trackEvent,
  trackVerification,
  trackLogin,
  trackError,
  trackTiming,
  setUserProperties,
  setCustomDimension,
  trackPurchase,
  trackSessionDuration,
  resetSessionTime,
  trackFeatureUsage,
  trackAPICall,
} from '../analytics';

// Mock ReactGA
jest.mock('react-ga4', () => ({
  initialize: jest.fn(),
  send: jest.fn(),
  event: jest.fn(),
  timing: jest.fn(),
  set: jest.fn(),
}));

describe('Analytics', () => {
  const originalEnv = process.env;
  const mockTrackingId = 'G-XXXXXXX';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    process.env.REACT_APP_GA_TRACKING_ID = mockTrackingId;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  describe('trackPageView', () => {
    it('sends page view event', () => {
      trackPageView('/test-page');
      expect(ReactGA.send).toHaveBeenCalledWith({
        hitType: 'pageview',
        page: '/test-page',
      });
    });

    it('does not send event without tracking ID', () => {
      process.env.REACT_APP_GA_TRACKING_ID = '';
      trackPageView('/test-page');
      expect(ReactGA.send).not.toHaveBeenCalled();
    });
  });

  describe('trackEvent', () => {
    it('sends event with all parameters', () => {
      trackEvent({
        category: 'Test',
        action: 'Click',
        label: 'Button',
        value: 1,
        nonInteraction: true,
      });

      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Test',
        action: 'Click',
        label: 'Button',
        value: 1,
        nonInteraction: true,
      });
    });

    it('sends event with required parameters only', () => {
      trackEvent({
        category: 'Test',
        action: 'Click',
      });

      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Test',
        action: 'Click',
        nonInteraction: false,
      });
    });
  });

  describe('trackVerification', () => {
    it('tracks verified company', () => {
      trackVerification('company-123', 'verified', 85);
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Verification',
        action: 'Company Verified',
        label: 'company-123',
        value: 85,
      });
    });

    it('tracks flagged company', () => {
      trackVerification('company-123', 'flagged', 45);
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Verification',
        action: 'Company Flagged',
        label: 'company-123',
        value: 45,
      });
    });
  });

  describe('trackLogin', () => {
    it('tracks email login', () => {
      trackLogin('email');
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Authentication',
        action: 'Login',
        label: 'email',
      });
    });

    it('tracks LinkedIn login', () => {
      trackLogin('linkedin');
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Authentication',
        action: 'Login',
        label: 'linkedin',
      });
    });
  });

  describe('trackError', () => {
    it('tracks error with stack trace', () => {
      const error = new Error('Test error');
      const stack = 'Error stack trace';
      trackError(error, stack);

      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Error',
        action: 'Error',
        label: `Test error\n${stack}`,
        nonInteraction: true,
      });
    });

    it('tracks error without stack trace', () => {
      const error = new Error('Test error');
      trackError(error);

      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Error',
        action: 'Error',
        label: 'Test error',
        nonInteraction: true,
      });
    });
  });

  describe('trackTiming', () => {
    it('tracks timing event', () => {
      trackTiming('API', 'request', 100, 'GET /users');
      expect(ReactGA.timing).toHaveBeenCalledWith({
        category: 'API',
        variable: 'request',
        value: 100,
        label: 'GET /users',
      });
    });
  });

  describe('user properties', () => {
    it('sets user properties', () => {
      const properties = { userId: '123', role: 'admin' };
      setUserProperties(properties);
      expect(ReactGA.set).toHaveBeenCalledWith(properties);
    });

    it('sets custom dimension', () => {
      setCustomDimension(1, 'test-value');
      expect(ReactGA.set).toHaveBeenCalledWith({ dimension1: 'test-value' });
    });
  });

  describe('trackPurchase', () => {
    it('tracks purchase with default currency', () => {
      trackPurchase('order-123', 99.99);
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Ecommerce',
        action: 'Purchase',
        label: 'order-123',
        value: 9999,
        currency: 'USD',
      });
    });

    it('tracks purchase with custom currency', () => {
      trackPurchase('order-123', 99.99, 'EUR');
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Ecommerce',
        action: 'Purchase',
        label: 'order-123',
        value: 9999,
        currency: 'EUR',
      });
    });
  });

  describe('session tracking', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('tracks session duration', () => {
      resetSessionTime();
      jest.advanceTimersByTime(5000); // 5 seconds
      trackSessionDuration();

      expect(ReactGA.timing).toHaveBeenCalledWith({
        category: 'Session',
        variable: 'Duration',
        value: 5000,
      });
    });

    it('resets session time', () => {
      resetSessionTime();
      jest.advanceTimersByTime(5000);
      resetSessionTime();
      jest.advanceTimersByTime(2000);
      trackSessionDuration();

      expect(ReactGA.timing).toHaveBeenCalledWith({
        category: 'Session',
        variable: 'Duration',
        value: 2000,
      });
    });
  });

  describe('feature tracking', () => {
    it('tracks feature usage without metadata', () => {
      trackFeatureUsage('test-feature');
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Feature',
        action: 'Use',
        label: 'test-feature',
      });
    });

    it('tracks feature usage with metadata', () => {
      trackFeatureUsage('test-feature', { value: 123 });
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'Feature',
        action: 'Use',
        label: 'test-feature',
        value: 123,
      });
    });
  });

  describe('API tracking', () => {
    it('tracks successful API call', () => {
      trackAPICall('/api/test', 100, true);
      expect(ReactGA.timing).toHaveBeenCalledWith({
        category: 'API',
        variable: '/api/test',
        value: 100,
      });
      expect(ReactGA.event).not.toHaveBeenCalled();
    });

    it('tracks failed API call', () => {
      trackAPICall('/api/test', 100, false);
      expect(ReactGA.timing).toHaveBeenCalledWith({
        category: 'API',
        variable: '/api/test',
        value: 100,
      });
      expect(ReactGA.event).toHaveBeenCalledWith({
        category: 'API',
        action: 'Error',
        label: '/api/test',
        nonInteraction: true,
      });
    });
  });
}); 