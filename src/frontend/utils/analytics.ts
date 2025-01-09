import ReactGA from 'react-ga4';

// Initialize GA with your tracking ID
const TRACKING_ID = process.env.REACT_APP_GA_TRACKING_ID;

if (TRACKING_ID) {
  ReactGA.initialize(TRACKING_ID);
}

interface EventParams {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
}

export const trackPageView = (path: string) => {
  if (TRACKING_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const trackEvent = ({
  category,
  action,
  label,
  value,
  nonInteraction = false,
}: EventParams) => {
  if (TRACKING_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
      nonInteraction,
    });
  }
};

// Custom events for our application
export const trackVerification = (companyId: string, status: 'verified' | 'flagged', score: number) => {
  trackEvent({
    category: 'Verification',
    action: status === 'verified' ? 'Company Verified' : 'Company Flagged',
    label: companyId,
    value: Math.round(score),
  });
};

export const trackLogin = (method: 'email' | 'linkedin') => {
  trackEvent({
    category: 'Authentication',
    action: 'Login',
    label: method,
  });
};

export const trackError = (error: Error, componentStack?: string) => {
  trackEvent({
    category: 'Error',
    action: error.name,
    label: `${error.message}${componentStack ? `\n${componentStack}` : ''}`,
    nonInteraction: true,
  });
};

// Performance tracking
export const trackTiming = (category: string, variable: string, value: number, label?: string) => {
  if (TRACKING_ID) {
    ReactGA.event({
      category,
      action: 'timing',
      label: label || variable,
      value
    });
  }
};

// User properties
export const setUserProperties = (properties: { [key: string]: any }) => {
  if (TRACKING_ID) {
    ReactGA.set(properties);
  }
};

// Custom dimensions
export const setCustomDimension = (dimensionIndex: number, value: string) => {
  if (TRACKING_ID) {
    ReactGA.set({ [`dimension${dimensionIndex}`]: value });
  }
};

// Ecommerce tracking (if needed)
export const trackPurchase = (transactionId: string, revenue: number, currency: string = 'USD') => {
  if (TRACKING_ID) {
    ReactGA.event({
      category: 'Ecommerce',
      action: 'Purchase',
      label: transactionId,
      value: Math.round(revenue * 100) // Convert to cents
    });
  }
};

// Session tracking
let sessionStartTime = Date.now();

export const trackSessionDuration = () => {
  const duration = Date.now() - sessionStartTime;
  trackTiming('Session', 'Duration', duration);
};

// Reset session time on new session
export const resetSessionTime = () => {
  sessionStartTime = Date.now();
};

// Track feature usage
export const trackFeatureUsage = (featureName: string, metadata?: { [key: string]: any }) => {
  trackEvent({
    category: 'Feature',
    action: 'Use',
    label: featureName,
    ...metadata,
  });
};

// Track API performance
export const trackAPICall = (endpoint: string, duration: number, success: boolean) => {
  trackTiming('API', endpoint, duration);
  if (!success) {
    trackEvent({
      category: 'API',
      action: 'Error',
      label: endpoint,
      nonInteraction: true,
    });
  }
};

// Debug mode for development
if (process.env.NODE_ENV === 'development') {
  window.analytics = {
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
  };
} 