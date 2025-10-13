import { translateDateRange } from './dateTranslations';

// Helper function to get week range dates with translations
export const getWeekRange = (weeksOffset: number = 0, locale: string = 'en'): string => {
  let dateRange = '';
  
  // Get the date range in English first
  switch (weeksOffset) {
    case 0:
      dateRange = "06 Oct - 12 Oct 2025";
      break;
    case -1:
      dateRange = "29 Sep - 05 Oct 2025";
      break;
    case -2:
      dateRange = "22 Sep - 28 Sep 2025";
      break;
    case -3:
      dateRange = "15 Sep - 21 Sep 2025";
      break;
    case -4:
      dateRange = "08 Sep - 14 Sep 2025";
      break;
    case -5:
      dateRange = "01 Sep - 07 Sep 2025";
      break;
    case 1:
      dateRange = "13 Oct - 19 Oct 2025";
      break;
    case 2:
      dateRange = "20 Oct - 26 Oct 2025";
      break;
    default:
      dateRange = "06 Oct - 12 Oct 2025";
  }
  
  // Extract language code from locale (e.g., 'es-ph' -> 'es', 'en' -> 'en')
  const langCode = locale.includes('-') ? locale.split('-')[0] : locale;
  
  // Translate month abbreviations based on language code
  return translateDateRange(dateRange, langCode);
};

export const getNextWeekRange = (locale: string = 'en'): string => {
  const dateRange = "06 Oct - 12 Oct 2025";
  // Extract language code from locale (e.g., 'es-ph' -> 'es')
  const langCode = locale.includes('-') ? locale.split('-')[0] : locale;
  return translateDateRange(dateRange, langCode);
};
