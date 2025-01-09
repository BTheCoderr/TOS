// Temporarily disabled Sentry integration
// Will be properly configured once we have API keys and correct setup
// import * as Sentry from '@sentry/react';
// import type { Event, EventHint } from '@sentry/types';

export const initErrorMonitoring = () => {
  // Temporarily using console logging
  console.log('Error monitoring initialized in', process.env.NODE_ENV, 'mode');
};

export const trackError = async (error: Error, context?: Record<string, unknown>) => {
  // Temporarily log to console
  console.error('Error occurred:', error, context);
};

export const setUserContext = (userId: string, email?: string) => {
  // Temporarily log to console
  console.log('User context set:', { userId, email });
}; 