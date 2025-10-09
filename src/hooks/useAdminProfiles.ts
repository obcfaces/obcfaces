import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  auth_provider?: string;
  facebook_data?: any;
  last_sign_in_at?: string;
  created_at: string;
  email_confirmed_at?: string;
  email_verified_by?: string;
  email_verified_by_email?: string;
  is_approved?: boolean | null;
  moderation_notes?: string;
  moderated_by?: string;
  moderated_at?: string;
  bio?: string;
  avatar_url?: string;
  age?: number;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: string | null;
  city?: string;
  state?: string;
  country?: string;
  isDuplicateIP?: boolean;
  gender?: string;
  marital_status?: string;
  has_children?: boolean;
  weight_kg?: number;
  height_cm?: number;
  photo_1_url?: string;
  photo_2_url?: string;
  raw_user_meta_data?: {
    form_fill_time_seconds?: number;
    [key: string]: any;
  };
  fingerprint_id?: string;
  provider_data?: {
    provider_id?: string;
    [key: string]: any;
  };
}

export const useAdminProfiles = () => {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_all_profiles_admin');

      if (profilesError) throw profilesError;

      const { data: authData, error: authError } = await supabase
        .rpc('get_user_auth_data_admin');

      if (authError) throw authError;

      const { data: fingerprints } = await supabase
        .from('user_device_fingerprints')
        .select('user_id, ip_address, fingerprint_id');

      const { data: loginLogs } = await supabase
        .from('user_login_logs')
        .select('user_id, user_agent, ip_address')
        .order('created_at', { ascending: false });

      const ipCounts = new Map<string, number>();
      fingerprints?.forEach(fp => {
        if (fp.ip_address) {
          const ipStr = String(fp.ip_address);
          ipCounts.set(ipStr, (ipCounts.get(ipStr) || 0) + 1);
        }
      });

      const combined = profilesData?.map(profile => {
        const auth = authData?.find(a => a.user_id === profile.id);
        const fingerprint = fingerprints?.find(fp => fp.user_id === profile.id);
        const loginLog = loginLogs?.find(log => log.user_id === profile.id);
        const ipAddress = fingerprint?.ip_address || loginLog?.ip_address;
        const ipStr = ipAddress ? String(ipAddress) : null;
        
        return {
          ...profile,
          email: auth?.email,
          auth_provider: auth?.auth_provider || 'email',
          facebook_data: auth?.facebook_data,
          last_sign_in_at: auth?.last_sign_in_at,
          email_confirmed_at: auth?.email_confirmed_at,
          raw_user_meta_data: auth?.user_metadata,
          ip_address: ipStr,
          fingerprint_id: fingerprint?.fingerprint_id,
          user_agent: loginLog?.user_agent ? String(loginLog.user_agent) : undefined,
          isDuplicateIP: ipStr ? (ipCounts.get(ipStr) || 0) > 1 : false
        };
      }) || [];

      setProfiles(combined as ProfileData[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profiles, loading, fetchProfiles };
};
