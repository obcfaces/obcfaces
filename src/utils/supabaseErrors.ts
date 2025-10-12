import { toast } from "@/hooks/use-toast";
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Centralized error handling for Supabase operations
 * Provides user-friendly error messages
 */

export function toastSupabaseError(
  error: unknown, 
  fallback: string = 'Something went wrong. Please try again.'
) {
  let message = fallback;
  
  // Handle Supabase PostgrestError
  if (error && typeof error === 'object' && 'message' in error) {
    const pgError = error as PostgrestError;
    
    // Map common error codes to user-friendly messages
    switch (pgError.code) {
      case '23505': // unique_violation
        message = 'This record already exists.';
        break;
      case '23503': // foreign_key_violation
        message = 'Related record not found.';
        break;
      case '23502': // not_null_violation
        message = 'Required field is missing.';
        break;
      case '42501': // insufficient_privilege
        message = 'You do not have permission to perform this action.';
        break;
      case 'PGRST301': // JWT expired
        message = 'Session expired. Please log in again.';
        break;
      default:
        message = pgError.message || fallback;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }
  
  // Show toast notification
  toast({
    title: "Error",
    description: message,
    variant: "destructive"
  });
  
  // Log for debugging (but don't log sensitive data)
  console.error('Supabase error:', { code: (error as any)?.code, message });
}

/**
 * Check if error is a specific Supabase error code
 */
export function isSupabaseError(error: unknown, code: string): boolean {
  return error && typeof error === 'object' && 'code' in error && (error as any).code === code;
}

/**
 * Get user-friendly message for common auth errors
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'Authentication error';
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address first';
  }
  if (message.includes('user already registered')) {
    return 'An account with this email already exists';
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters';
  }
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address';
  }
  if (message.includes('rate limit')) {
    return 'Too many attempts. Please try again later';
  }
  
  return error.message || 'Authentication error';
}
