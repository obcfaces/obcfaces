/**
 * Извлекает данные участника из различных форматов
 */
export const extractParticipantData = (participant: any) => {
  const appData = participant.application_data || {};
  
  return {
    firstName: appData.first_name || appData.firstName || '',
    lastName: appData.last_name || appData.lastName || '',
    photo1: appData.photo_1_url || appData.photo1_url || appData.photo1Url || appData.photoUrl1 || '',
    photo2: appData.photo_2_url || appData.photo2_url || appData.photo2Url || appData.photoUrl2 || '',
    city: appData.city || 'Unknown',
    country: appData.country || 'Unknown',
    state: appData.state || '',
    birthYear: appData.birth_year || null,
    phone: appData.phone || appData.cached_phone || null,
    facebookUrl: appData.facebook_url || appData.cached_facebook_url || null,
  };
};

/**
 * Получает дату последнего изменения статуса из истории
 */
export const getLatestStatusChangeDate = (participant: any): Date | null => {
  const statusHistory = participant.status_history;
  
  if (!statusHistory || typeof statusHistory !== 'object') {
    return participant.submitted_at ? new Date(participant.submitted_at) : null;
  }
  
  const dates: Date[] = [];
  
  Object.entries(statusHistory).forEach(([key, data]: [string, any]) => {
    if (key === 'changed_at' || key === 'changed_by' || key === 'change_reason') return;
    if (!data || typeof data !== 'object') return;
    
    const dateStr = data.changed_at || data.timestamp;
    if (dateStr) {
      dates.push(new Date(dateStr));
    }
  });
  
  if (dates.length > 0) {
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }
  
  return participant.submitted_at ? new Date(participant.submitted_at) : null;
};

/**
 * Вычисляет возраст по году рождения
 */
export const calculateAge = (birthYear: number | null): number => {
  if (!birthYear) return 25; // default
  return new Date().getFullYear() - birthYear;
};

/**
 * Проверяет является ли участник победителем
 */
export const isWinner = (participant: any): boolean => {
  return participant.final_rank === 1;
};
