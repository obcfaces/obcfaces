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
 * React hook for rate limiting
 */
export const useRateLimit = (config: RateLimitConfig) => {
  const check = async () => {
    return await checkRateLimit(config);
  };

  return { check };
};