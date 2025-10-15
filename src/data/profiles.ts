import { supabase } from './supabaseClient';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Get profiles by user IDs
 */
export async function getProfilesByIds(userIds: string[]): Promise<ProfileRow[]> {
  if (!userIds || userIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);
  
  if (error) throw error;
  return data || [];
}

/**
 * Get single profile by ID
 */
export async function getProfileById(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}
