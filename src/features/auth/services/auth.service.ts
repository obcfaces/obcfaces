import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized auth service to avoid code duplication
 * All auth operations should go through these functions
 */

export async function startGoogleOAuth(redirect = `${window.location.origin}/auth`) {
  return supabase.auth.signInWithOAuth({ 
    provider: 'google', 
    options: { 
      redirectTo: redirect,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    } 
  });
}

export async function exchangeIfCodeInUrl() {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  if (!code) return null;
  
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session ?? null;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function upsertProfileIdempotent(userId: string, extra?: Record<string, any>) {
  // Never include email - profiles table doesn't have email column
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, ...(extra ?? {}) }, 
      { onConflict: 'id', ignoreDuplicates: true }
    );
  
  if (error) {
    console.warn('Profile upsert warning:', error.message);
  }
  
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
