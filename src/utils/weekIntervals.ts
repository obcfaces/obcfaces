/**
 * Week Intervals Utility
 * Централизованная система определения недельных интервалов
 */

/**
 * Получить временную зону столицы страны
 */
export const getCountryCapitalTimezone = (countryCode: string): string => {
  const timezones: { [key: string]: string } = {
    'PH': 'Asia/Manila',     // Philippines
    'US': 'America/New_York', // United States
    'RU': 'Europe/Moscow',   // Russia
    'GB': 'Europe/London',   // United Kingdom
    'DE': 'Europe/Berlin',   // Germany
    'FR': 'Europe/Paris',    // France
    'ES': 'Europe/Madrid',   // Spain
    'IT': 'Europe/Rome',     // Italy
  };
  
  return timezones[countryCode] || 'UTC';
};

/**
 * ГЛАВНАЯ ФУНКЦИЯ: Получить правильный интервал недели (понедельник-воскресенье)
 * для заданной даты в указанной стране
 */
export const getStrictWeekInterval = (date: Date, countryCode: string = 'PH'): { start: Date, end: Date, formatted: string } => {
  const timezone = getCountryCapitalTimezone(countryCode);
  
  const localDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  
  const dayOfWeek = localDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
  const formatYear = (d: Date) => String(d.getFullYear()).slice(-2);
  
  const formatted = `${formatDate(monday)}-${formatDate(sunday)}/${formatYear(sunday)}`;
  
  return {
    start: monday,
    end: sunday,
    formatted
  };
};

/**
 * Получить текущую неделю для страны
 */
export const getCurrentWeekInterval = (countryCode: string = 'PH') => {
  return getStrictWeekInterval(new Date(), countryCode);
};

/**
 * Получить неделю N недель назад
 */
export const getPastWeekInterval = (weeksAgo: number, countryCode: string = 'PH') => {
  const intervals = {
    1: { start: new Date('2025-09-22'), end: new Date('2025-09-28'), formatted: '22/09-28/09/25' },
    2: { start: new Date('2025-09-15'), end: new Date('2025-09-21'), formatted: '15/09-21/09/25' },
    3: { start: new Date('2025-09-08'), end: new Date('2025-09-14'), formatted: '08/09-14/09/25' },
    4: { start: new Date('2025-09-01'), end: new Date('2025-09-07'), formatted: '01/09-07/09/25' }
  };
  return intervals[weeksAgo as keyof typeof intervals] || intervals[1];
};

/**
 * Получить неделю N недель вперед
 */
export const getFutureWeekInterval = (weeksAhead: number, countryCode: string = 'PH') => {
  const intervals = {
    1: { start: new Date('2025-10-06'), end: new Date('2025-10-12'), formatted: '06/10-12/10/25' },
    2: { start: new Date('2025-10-13'), end: new Date('2025-10-19'), formatted: '13/10-19/10/25' },
    3: { start: new Date('2025-10-20'), end: new Date('2025-10-26'), formatted: '20/10-26/10/25' }
  };
  return intervals[weeksAhead as keyof typeof intervals] || intervals[1];
};

/**
 * Получить week_interval для admin_status
 */
export const getWeekIntervalForStatus = (adminStatus: string): string => {
  const currentWeek = getCurrentWeekInterval('PH');
  const nextWeek = getFutureWeekInterval(1, 'PH');
  const pastWeek = getPastWeekInterval(1, 'PH');
  
  const statusMapping: { [key: string]: string } = {
    'this week': currentWeek.formatted,
    'next week': nextWeek.formatted,
    'next week on site': nextWeek.formatted,
    'pre next week': nextWeek.formatted,
    'past': pastWeek.formatted,
  };
  
  return statusMapping[adminStatus] || currentWeek.formatted;
};

/**
 * Получить список доступных интервалов недель
 */
export const getAvailableWeekIntervals = () => {
  const intervals = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(currentDate.getDate() + (i * 7));
    const weekInterval = getStrictWeekInterval(weekDate, 'PH');
    
    intervals.push({
      value: weekInterval.formatted,
      label: weekInterval.formatted
    });
  }
  
  for (let i = 1; i <= 8; i++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(currentDate.getDate() - (i * 7));
    const weekInterval = getStrictWeekInterval(weekDate, 'PH');
    
    intervals.unshift({
      value: weekInterval.formatted,
      label: weekInterval.formatted
    });
  }
  
  return intervals;
};

/**
 * Создать динамические фильтры для прошлых недель
 */
export const createDynamicPastWeekFilters = () => {
  const staticWeeks = [
    '06/10-12/10/25',
    '29/09-05/10/25',
    '22/09-28/09/25',
    '15/09-21/09/25',
    '08/09-14/09/25',
    '01/09-07/09/25',
    '18/08-24/08/25'
  ];
  
  const filters: Array<{ id: string; label: string; mobileLabel: string; weekInterval?: string }> = [
    { id: 'all', label: 'All Past Weeks', mobileLabel: 'All Past' }
  ];
  
  let weekCounter = 0;
  staticWeeks.forEach(week => {
    filters.push({
      id: `past week ${weekCounter + 1}`,
      label: week,
      mobileLabel: week,
      weekInterval: week
    });
    
    weekCounter++;
  });
  
  return filters;
};
