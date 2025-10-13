export const getMonthAbbreviation = (month: string, locale: string): string => {
  const monthMap: Record<string, Record<string, string>> = {
    'Jan': { es: 'Ene', ru: 'Янв', en: 'Jan', fr: 'Jan', de: 'Jan', it: 'Gen', pt: 'Jan', zh: '1月' },
    'Feb': { es: 'Feb', ru: 'Фев', en: 'Feb', fr: 'Fév', de: 'Feb', it: 'Feb', pt: 'Fev', zh: '2月' },
    'Mar': { es: 'Mar', ru: 'Мар', en: 'Mar', fr: 'Mar', de: 'Mär', it: 'Mar', pt: 'Mar', zh: '3月' },
    'Apr': { es: 'Abr', ru: 'Апр', en: 'Apr', fr: 'Avr', de: 'Apr', it: 'Apr', pt: 'Abr', zh: '4月' },
    'May': { es: 'May', ru: 'Май', en: 'May', fr: 'Mai', de: 'Mai', it: 'Mag', pt: 'Mai', zh: '5月' },
    'Jun': { es: 'Jun', ru: 'Июн', en: 'Jun', fr: 'Juin', de: 'Jun', it: 'Giu', pt: 'Jun', zh: '6月' },
    'Jul': { es: 'Jul', ru: 'Июл', en: 'Jul', fr: 'Juil', de: 'Jul', it: 'Lug', pt: 'Jul', zh: '7月' },
    'Aug': { es: 'Ago', ru: 'Авг', en: 'Aug', fr: 'Août', de: 'Aug', it: 'Ago', pt: 'Ago', zh: '8月' },
    'Sep': { es: 'Sep', ru: 'Сен', en: 'Sep', fr: 'Sep', de: 'Sep', it: 'Set', pt: 'Set', zh: '9月' },
    'Oct': { es: 'Oct', ru: 'Окт', en: 'Oct', fr: 'Oct', de: 'Okt', it: 'Ott', pt: 'Out', zh: '10月' },
    'Nov': { es: 'Nov', ru: 'Ноя', en: 'Nov', fr: 'Nov', de: 'Nov', it: 'Nov', pt: 'Nov', zh: '11月' },
    'Dec': { es: 'Dic', ru: 'Дек', en: 'Dec', fr: 'Déc', de: 'Dez', it: 'Dic', pt: 'Dez', zh: '12月' },
  };

  // Extract language code from locale (e.g., 'es-ph' -> 'es')
  const langCode = locale.split('-')[0] || 'en';
  return monthMap[month]?.[langCode] || month;
};

export const translateDateRange = (dateRange: string, locale: string): string => {
  // Parse format like "29 Sep - 05 Oct 2025"
  const parts = dateRange.split(' - ');
  if (parts.length !== 2) return dateRange;

  const [start, end] = parts;
  const startParts = start.split(' '); // ["29", "Sep"]
  const endParts = end.split(' ');     // ["05", "Oct", "2025"]

  if (startParts.length < 2 || endParts.length < 3) return dateRange;

  const startDay = startParts[0];
  const startMonth = getMonthAbbreviation(startParts[1], locale);
  const endDay = endParts[0];
  const endMonth = getMonthAbbreviation(endParts[1], locale);
  const year = endParts[2];

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
};

export const translateCountry = (country: string, t: (key: string) => string): string => {
  const countryKey = `country.${country}`;
  const translated = t(countryKey);
  return translated !== countryKey ? translated : country;
};

export const formatAgeWeightHeight = (age: number, weight: number, height: number, locale: string): string => {
  // Extract language code from locale (e.g., 'es-ph' -> 'es')
  const langCode = locale.split('-')[0] || 'en';
  
  // Map language codes to year abbreviations
  const yearUnitMap: Record<string, string> = {
    'es': 'a',   // años
    'ru': 'л',   // лет
    'en': 'yo',  // years old
    'fr': 'ans',
    'de': 'J',   // Jahre
    'it': 'a',   // anni
    'pt': 'a',   // anos
    'zh': '岁'
  };
  
  const yearUnit = yearUnitMap[langCode] || 'yo';
  return `${age} ${yearUnit} · ${weight} kg · ${height} cm`;
};
