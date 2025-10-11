import { supabase } from '@/integrations/supabase/client';

interface RateLimitConfig {
  endpoint: string;
  maxRequests?: number;
  windowMinutes?: number;
}

interface RateLimitResponse {
  allowed: boolean;
  error?: string;
  remaining?: number;
  resetAt?: string;
  retryAfter?: number;
}

/**
 * Check rate limit before making a request
 */
export const checkRateLimit = async (
  config: RateLimitConfig
): Promise<RateLimitResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: config,
    });

    if (error) {
      console.error('Rate limiter error:', error);
      // Allow request on error to avoid blocking legitimate users
      return { allowed: true };
    }

    return data as RateLimitResponse;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow request on error
    return { allowed: true };
  }
};

/**
 * Higher-order function to wrap API calls with rate limiting
 */
export const withRateLimit = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: RateLimitConfig
): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const rateLimitResult = await checkRateLimit(config);

    if (!rateLimitResult.allowed) {
      throw new Error(
        rateLimitResult.error || 'Rate limit exceeded. Please try again later.'
      );
    }

    return fn(...args);
  }) as T;
};

/**
 * Predefined rate limit configurations for different operations
 */
export const rateLimitConfigs = {
  // Authentication operations - strict limits
  login: { endpoint: 'auth/login', maxRequests: 5, windowMinutes: 1 },
  signup: { endpoint: 'auth/signup', maxRequests: 3, windowMinutes: 1 },
  passwordReset: { endpoint: 'auth/password-reset', maxRequests: 3, windowMinutes: 5 },
  
  // Voting operations - moderate limits
  vote: { endpoint: 'vote', maxRequests: 10, windowMinutes: 1 },
  rating: { endpoint: 'rating', maxRequests: 15, windowMinutes: 1 },
  
  // File operations - strict limits
  fileUpload: { endpoint: 'upload', maxRequests: 5, windowMinutes: 1 },
  imageUpload: { endpoint: 'upload/image', maxRequests: 10, windowMinutes: 1 },
  
  // Read operations - generous limits
  read: { endpoint: 'read', maxRequests: 60, windowMinutes: 1 },
  search: { endpoint: 'search', maxRequests: 30, windowMinutes: 1 },
  
  // Social operations
  like: { endpoint: 'like', maxRequests: 20, windowMinutes: 1 },
  comment: { endpoint: 'comment', maxRequests: 10, windowMinutes: 1 },
  message: { endpoint: 'message', maxRequests: 30, windowMinutes: 1 },
  
  // Application submission
  contestApplication: { endpoint: 'contest/apply', maxRequests: 2, windowMinutes: 5 },
} as const;

/**
 * React hook for rate limiting
 */
export const useRateLimit = (config: RateLimitConfig) => {
  const check = async () => {
    return await checkRateLimit(config);
  };

  return { check };
};