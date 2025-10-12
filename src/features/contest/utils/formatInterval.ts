import { translationService } from '@/services/translationService';

/**
 * Month abbreviations for translation
 */
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a week interval string from DD/MM-DD/MM/YY to readable format
 * @param interval - String in format "15/09-21/09/25"
 * @param targetLanguage - Target language code for month translation
 * @returns Formatted string like "15 Sep - 21 Sep 2025"
 */
export const formatInterval = async (interval: string, targetLanguage: string = 'en'): Promise<string> => {
  try {
    const parts = interval.split('-');
    if (parts.length !== 2) return interval;
    
    const startParts = parts[0].split('/');
    const endParts = parts[1].split('/');
    
    if (startParts.length !== 2 || endParts.length !== 3) return interval;
    
    const startDay = startParts[0];
    const startMonthIndex = parseInt(startParts[1]) - 1;
    const endDay = endParts[0];
    const endMonthIndex = parseInt(endParts[1]) - 1;
    const year = `20${endParts[2]}`;
    
    const startMonth = MONTH_NAMES[startMonthIndex];
    const endMonth = MONTH_NAMES[endMonthIndex];
    
    // Translate months if not English
    if (targetLanguage !== 'en') {
      const [translatedStartMonth, translatedEndMonth] = await Promise.all([
        translationService.translateText(startMonth, targetLanguage),
        translationService.translateText(endMonth, targetLanguage)
      ]);
      return `${startDay} ${translatedStartMonth} - ${endDay} ${translatedEndMonth} ${year}`;
    }
    
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  } catch (error) {
    return interval;
  }
};

/**
 * Synchronous version of formatInterval (no translation)
 */
export const formatIntervalSync = (interval: string): string => {
  try {
    const parts = interval.split('-');
    if (parts.length !== 2) return interval;
    
    const startParts = parts[0].split('/');
    const endParts = parts[1].split('/');
    
    if (startParts.length !== 2 || endParts.length !== 3) return interval;
    
    const startDay = startParts[0];
    const startMonth = MONTH_NAMES[parseInt(startParts[1]) - 1];
    const endDay = endParts[0];
    const endMonth = MONTH_NAMES[parseInt(endParts[1]) - 1];
    const year = `20${endParts[2]}`;
    
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  } catch (error) {
    return interval;
  }
};
