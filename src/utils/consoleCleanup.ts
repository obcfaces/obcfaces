/**
 * Production-safe console wrapper
 * Removes console.log in production, keeps errors
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  }
};

// Remove all console.logs in production
if (!isDev) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}
