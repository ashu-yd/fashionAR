// utils/logger.ts
// Centralized logging utility that only logs in development mode

const isDev = import.meta.env.DEV;

export const logger = {
  // Regular log - only in development
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  // Error log - shows generic message in production
  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(message, error);
    } else {
      console.error(message); // Only show generic message in production
    }
  },

  // Warning log - only in development
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  // Info log - only in development
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  // Debug log - only in development
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  // Always log (use sparingly, only for critical user-facing errors)
  always: (...args: any[]) => {
    console.log(...args);
  }
};

// Export isDev for conditional rendering
export { isDev };