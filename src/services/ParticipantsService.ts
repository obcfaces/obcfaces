import { supabase } from '@/integrations/supabase/client';

export interface ParticipantFilters {
  weekOffset?: number;
  status?: string;
  country?: string;
  gender?: string;
  isActive?: boolean;
  showDeleted?: boolean;
  limit?: number;
  orderBy?: { column: string; ascending: boolean };
}

export class ParticipantsService {
  /**
   * Получить всех участников с лимитом для админ-таблицы
   */
  static async getAllParticipants(filters: ParticipantFilters = {}) {
    const { limit = 1000, orderBy = { column: 'created_at', ascending: false } } = filters;

    let query = supabase
      .from('weekly_contest_participants')
      .select('*')
      .order(orderBy.column, { ascending: orderBy.ascending })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Получить участников конкурса с фильтрами
   */
  static async getParticipants(filters: ParticipantFilters = {}) {
    const { weekOffset = 0, status, country, gender, isActive, showDeleted, limit, orderBy } = filters;

    // Если есть limit, используем прямой запрос
    if (limit) {
      return this.getAllParticipants(filters);
    }

    let query = supabase
      .rpc('get_weekly_contest_participants_admin', { weeks_offset: weekOffset });

    const { data, error } = await query;

    if (error) throw error;

    let filtered = data || [];

    // Применяем фильтры на клиенте
    if (status && status !== 'all') {
      filtered = filtered.filter((p: any) => p.admin_status === status);
    }

    if (country && country !== 'all') {
      filtered = filtered.filter((p: any) => p.country === country);
    }

    if (gender && gender !== 'all') {
      filtered = filtered.filter((p: any) => p.gender === gender);
    }

    if (isActive !== undefined) {
      filtered = filtered.filter((p: any) => p.is_active === isActive);
    }

    if (!showDeleted) {
      filtered = filtered.filter((p: any) => !p.deleted_at);
    }

    return filtered;
  }

  /**
   * Обновить статус участника
   */
  static async updateStatus(participantId: string, newStatus: string, userId: string) {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({
        admin_status: newStatus as any,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (error) throw error;
  }

  /**
   * Обновить данные участника
   */
  static async updateParticipant(participantId: string, updates: any, userId: string) {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({
        ...updates,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (error) throw error;
  }

  /**
   * Мягкое удаление участника
   */
  static async deleteParticipant(participantId: string) {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', participantId);

    if (error) throw error;
  }

  /**
   * Восстановить удаленного участника
   */
  static async restoreParticipant(participantId: string) {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({ deleted_at: null })
      .eq('id', participantId);

    if (error) throw error;
  }

  /**
   * Получить участника по ID
   */
  static async getParticipantById(participantId: string) {
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Получить всех участников пользователя
   */
  static async getParticipantsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Получить статистику по рейтингам участника
   */
  static async getParticipantStats(participantId: string) {
    const { data, error } = await supabase
      .rpc('get_participant_rating_stats', { participant_id_param: participantId });

    if (error) throw error;
    return data;
  }

  /**
   * Получить уникальные страны из участников
   */
  static async getUniqueCountries() {
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('application_data')
      .not('deleted_at', 'is', null);

    if (error) throw error;

    const countries = new Set<string>();
    data?.forEach((p: any) => {
      const country = p.application_data?.country;
      if (country) countries.add(country);
    });

    return Array.from(countries).sort();
  }
}
