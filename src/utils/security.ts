// Security utilities and rate limiting

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (userId?: string) => string;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(config: RateLimitConfig, userId?: string): boolean {
    const key = config.keyGenerator ? config.keyGenerator(userId) : userId || 'anonymous';
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this key
    let requestTimes = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    // Check if under limit
    if (requestTimes.length >= config.maxRequests) {
      return false;
    }

    // Add current request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);
    
    return true;
  }

  getRemainingRequests(config: RateLimitConfig, userId?: string): number {
    const key = config.keyGenerator ? config.keyGenerator(userId) : userId || 'anonymous';
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let requestTimes = this.requests.get(key) || [];
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    return Math.max(0, config.maxRequests - requestTimes.length);
  }

  getTimeUntilReset(config: RateLimitConfig, userId?: string): number {
    const key = config.keyGenerator ? config.keyGenerator(userId) : userId || 'anonymous';
    const requestTimes = this.requests.get(key) || [];
    
    if (requestTimes.length === 0) return 0;
    
    const oldestRequest = Math.min(...requestTimes);
    const resetTime = oldestRequest + config.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }
}

// Input sanitization
export const sanitizer = {
  // HTML sanitization
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // SQL injection prevention (basic)
  sql: (input: string): string => {
    return input.replace(/['"\\;]/g, '');
  },

  // XSS prevention for URLs
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  // File name sanitization
  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9.-_]/g, '')
      .substring(0, 255);
  },

  // Remove potentially dangerous characters
  strict: (input: string): string => {
    return input.replace(/[<>\"'%;()&+]/g, '');
  }
};

// Content Security Policy helpers
export const csp = {
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },

  createPolicy: (nonce: string) => ({
    'default-src': "'self'",
    'script-src': `'self' 'nonce-${nonce}' https://*.supabase.co`,
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'img-src': "'self' data: https://*.supabase.co https://images.unsplash.com",
    'font-src': "'self' https://fonts.gstatic.com",
    'connect-src': "'self' https://*.supabase.co wss://*.supabase.co",
    'media-src': "'self' https://*.supabase.co",
    'frame-ancestors': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'"
  })
};

// Security validation
export const validator = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Пароль должен содержать минимум 8 символов');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Пароль должен содержать заглавную букву');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Пароль должен содержать строчную букву');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Пароль должен содержать цифру');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Пароль должен содержать специальный символ');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  phoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  uuid: (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  },

  fileSize: (size: number, maxSizeMB: number = 10): boolean => {
    return size <= maxSizeMB * 1024 * 1024;
  },

  fileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  }
};

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Common rate limit configurations
export const rateLimits = {
  // API requests
  api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  
  // Authentication attempts
  auth: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
  
  // File uploads
  upload: { maxRequests: 10, windowMs: 60000 }, // 10 uploads per minute
  
  // Comments/posts
  content: { maxRequests: 20, windowMs: 60000 }, // 20 posts per minute
  
  // Voting/rating
  voting: { maxRequests: 50, windowMs: 60000 }, // 50 votes per minute
  
  // Search requests
  search: { maxRequests: 30, windowMs: 60000 } // 30 searches per minute
};

// Security headers helper
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Session security
export class SessionManager {
  private static readonly SESSION_KEY = 'app_session';
  private static readonly MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes

  static updateActivity(): void {
    localStorage.setItem('last_activity', Date.now().toString());
  }

  static isSessionExpired(): boolean {
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) return true;

    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return timeSinceActivity > this.MAX_IDLE_TIME;
  }

  static clearExpiredSession(): void {
    if (this.isSessionExpired()) {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem('last_activity');
      // Redirect to login if needed
      window.location.href = '/auth';
    }
  }

  static startActivityMonitoring(): void {
    // Update activity on user interactions
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, this.updateActivity, { passive: true });
    });

    // Check session expiry periodically
    setInterval(() => {
      this.clearExpiredSession();
    }, 60000); // Check every minute
  }
}

// CSRF protection
export const csrfProtection = {
  generateToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },

  setToken: (token: string): void => {
    document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', token);
  },

  getToken: (): string | null => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
  }
};