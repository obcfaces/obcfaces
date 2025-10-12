import { translationService } from '@/services/translationService';

/**
 * Country code to name mapping
 */
export const COUNTRY_NAMES: Record<string, string> = {
  PH: 'Philippines',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  JP: 'Japan',
  CN: 'China',
  BR: 'Brazil',
  MX: 'Mexico',
  RU: 'Russia',
  // Add more as needed
};

/**
 * Translate country name
 */
export const translateCountry = async (countryCode: string, targetLanguage: string): Promise<string> => {
  if (targetLanguage === 'en') {
    return COUNTRY_NAMES[countryCode] || countryCode;
  }
  
  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  return await translationService.translateText(countryName, targetLanguage);
};

/**
 * Translate gender
 */
export const translateGender = async (gender: string, targetLanguage: string): Promise<string> => {
  if (targetLanguage === 'en') {
    return gender;
  }
  
  const genderMap: Record<string, string> = {
    'male': 'Male',
    'female': 'Female'
  };
  
  const displayGender = genderMap[gender.toLowerCase()] || gender;
  return await translationService.translateText(displayGender, targetLanguage);
};
