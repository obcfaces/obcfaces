import { supabase } from '@/integrations/supabase/client';

export interface ProfileFilters {
  isApproved?: boolean | null;
  country?: string;
  gender?: string;
  isContestParticipant?: boolean;
}

export class ProfilesService {
  /**
   * Получить все профили (только для админов)
   */
  static async getAllProfiles() {
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

    // Подсчет дубликатов IP
    const ipCounts = new Map<string, number>();
    fingerprints?.forEach(fp => {
      if (fp.ip_address) {
        const ipStr = String(fp.ip_address);
        ipCounts.set(ipStr, (ipCounts.get(ipStr) || 0) + 1);
      }
    });

    // Объединение данных
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

    return combined;
  }

  /**
   * Обновить профиль
   */
  static async updateProfile(profileId: string, updates: any) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);

    if (error) throw error;
  }

  /**
   * Утвердить/отклонить профиль
   */
  static async moderateProfile(
    profileId: string,
    isApproved: boolean,
    moderatorId: string,
    notes?: string
  ) {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_approved: isApproved,
        moderated_by: moderatorId,
        moderated_at: new Date().toISOString(),
        moderation_notes: notes
      })
      .eq('id', profileId);

    if (error) throw error;
  }

  /**
   * Получить профиль по ID
   */
  static async getProfileById(profileId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Получить статистику по доменам email
   */
  static async getEmailDomainStats() {
    const { data, error } = await supabase.rpc('get_email_domain_stats');
    if (error) throw error;
    return data || [];
  }
}
