export const getMonthAbbreviation = (month: string, locale: string): string => {
  const monthMap: Record<string, Record<string, string>> = {
    'Jan': { es: 'Ene', ru: 'Янв', en: 'Jan' },
    'Feb': { es: 'Feb', ru: 'Фев', en: 'Feb' },
    'Mar': { es: 'Mar', ru: 'Мар', en: 'Mar' },
    'Apr': { es: 'Abr', ru: 'Апр', en: 'Apr' },
    'May': { es: 'May', ru: 'Май', en: 'May' },
    'Jun': { es: 'Jun', ru: 'Июн', en: 'Jun' },
    'Jul': { es: 'Jul', ru: 'Июл', en: 'Jul' },
    'Aug': { es: 'Ago', ru: 'Авг', en: 'Aug' },
    'Sep': { es: 'Sep', ru: 'Сен', en: 'Sep' },
    'Oct': { es: 'Oct', ru: 'Окт', en: 'Oct' },
    'Nov': { es: 'Nov', ru: 'Ноя', en: 'Nov' },
    'Dec': { es: 'Dic', ru: 'Дек', en: 'Dec' },
  };

  return monthMap[month]?.[locale] || month;
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
  // Spanish uses "a" for years (años), "kg" and "cm" are the same
  const yearUnit = locale === 'es' ? 'a' : 'yo';
  return `${age} ${yearUnit} · ${weight} kg · ${height} cm`;
};
