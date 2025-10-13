import { REJECTION_REASONS } from '../components/RejectReasonModal';

/**
 * Admin Helper Functions
 * Вспомогательные функции для админ-панели
 */

/**
 * Проверить, является ли причина отклонения дубликатом предопределенных причин
 */
export const isReasonDuplicate = (rejectionReason: string, reasonTypes: string[]) => {
  if (!rejectionReason || !reasonTypes || reasonTypes.length === 0) return false;
  
  const predefinedReasons = reasonTypes
    .filter(type => type && REJECTION_REASONS[type as keyof typeof REJECTION_REASONS])
    .map(type => REJECTION_REASONS[type as keyof typeof REJECTION_REASONS]);
    
  const normalizedRejectionReason = rejectionReason.toLowerCase().replace(/[;,]\s*/g, '|');
  const normalizedPredefined = predefinedReasons.map(r => r.toLowerCase()).join('|');
  
  return normalizedRejectionReason === normalizedPredefined || 
         predefinedReasons.every(reason => rejectionReason.includes(reason));
};

/**
 * Форматировать данные пользователя для отображения
 */
export const formatUserData = (data: any) => {
  if (!data) return {};
  
  return {
    firstName: data.first_name || data.firstName || '',
    lastName: data.last_name || data.lastName || '',
    age: data.age || null,
    city: data.city || '',
    country: data.country || '',
    photo1Url: data.photo_1_url || data.photo1_url || '',
    photo2Url: data.photo_2_url || data.photo2_url || '',
  };
};

/**
 * Получить цвет бейджа для статуса
 */
export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'pending': 'outline',
    'rejected': 'destructive',
    'pre next week': 'secondary',
    'this week': 'default',
    'next week': 'secondary',
    'past': 'outline',
  };
  
  return statusColors[status] || 'outline';
};

/**
 * Получить текст для статуса
 */
export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    'pending': 'Pending',
    'rejected': 'Rejected',
    'pre next week': 'Pre Next Week',
    'this week': 'This Week',
    'next week': 'Next Week',
    'past': 'Past',
  };
  
  return statusTexts[status] || status;
};

/**
 * Форматировать IP адрес
 */
export const formatIpAddress = (ip: string | null | undefined): string => {
  if (!ip) return 'N/A';
  return String(ip);
};

/**
 * Получить initials из имени
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || 'U';
};
