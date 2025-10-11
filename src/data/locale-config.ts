/**
 * Locale Configuration
 * Maps countries and languages with timezone support
 */

import countriesLanguagesData from './countries-languages.json';
import { CountryLanguageConfig, LocaleConfig, generateLocaleConfigs } from '@/types/locale';

// Timezone mapping for major countries
const TIMEZONE_MAP: Record<string, string> = {
  'PH': 'Asia/Manila',
  'US': 'America/New_York',
  'RU': 'Europe/Moscow',
  'GB': 'Europe/London',
  'DE': 'Europe/Berlin',
  'FR': 'Europe/Paris',
  'ES': 'Europe/Madrid',
  'IT': 'Europe/Rome',
  'KZ': 'Asia/Almaty',
  'UA': 'Europe/Kiev',
  'CN': 'Asia/Shanghai',
  'JP': 'Asia/Tokyo',
  'IN': 'Asia/Kolkata',
  'BR': 'America/Sao_Paulo',
  'MX': 'America/Mexico_City',
  'CA': 'America/Toronto',
  'AU': 'Australia/Sydney',
  'NZ': 'Pacific/Auckland',
  'ZA': 'Africa/Johannesburg',
  'EG': 'Africa/Cairo',
  'NG': 'Africa/Lagos',
  'AR': 'America/Argentina/Buenos_Aires',
  'CL': 'America/Santiago',
  'CO': 'America/Bogota',
  'PE': 'America/Lima',
  'TR': 'Europe/Istanbul',
  'SA': 'Asia/Riyadh',
  'AE': 'Asia/Dubai',
  'IL': 'Asia/Jerusalem',
  'PL': 'Europe/Warsaw',
  'NL': 'Europe/Amsterdam',
  'BE': 'Europe/Brussels',
  'SE': 'Europe/Stockholm',
  'NO': 'Europe/Oslo',
  'FI': 'Europe/Helsinki',
  'DK': 'Europe/Copenhagen',
  'CH': 'Europe/Zurich',
  'AT': 'Europe/Vienna',
  'GR': 'Europe/Athens',
  'PT': 'Europe/Lisbon',
  'IE': 'Europe/Dublin',
  'CZ': 'Europe/Prague',
  'HU': 'Europe/Budapest',
  'RO': 'Europe/Bucharest',
  'BG': 'Europe/Sofia',
  'HR': 'Europe/Zagreb',
  'RS': 'Europe/Belgrade',
  'SK': 'Europe/Bratislava',
  'SI': 'Europe/Ljubljana',
  'LT': 'Europe/Vilnius',
  'LV': 'Europe/Riga',
  'EE': 'Europe/Tallinn',
  'BY': 'Europe/Minsk',
  'KR': 'Asia/Seoul',
  'TH': 'Asia/Bangkok',
  'VN': 'Asia/Ho_Chi_Minh',
  'ID': 'Asia/Jakarta',
  'MY': 'Asia/Kuala_Lumpur',
  'SG': 'Asia/Singapore',
  'HK': 'Asia/Hong_Kong',
  'TW': 'Asia/Taipei',
  'PK': 'Asia/Karachi',
  'BD': 'Asia/Dhaka',
  'LK': 'Asia/Colombo',
  'NP': 'Asia/Kathmandu',
  'MM': 'Asia/Yangon',
  'KH': 'Asia/Phnom_Penh',
  'LA': 'Asia/Vientiane',
  'MN': 'Asia/Ulaanbaatar',
  'KG': 'Asia/Bishkek',
  'TJ': 'Asia/Dushanbe',
  'TM': 'Asia/Ashgabat',
  'UZ': 'Asia/Tashkent',
  'AM': 'Asia/Yerevan',
  'AZ': 'Asia/Baku',
  'GE': 'Asia/Tbilisi',
  'IR': 'Asia/Tehran',
  'IQ': 'Asia/Baghdad',
  'SY': 'Asia/Damascus',
  'JO': 'Asia/Amman',
  'LB': 'Asia/Beirut',
  'KW': 'Asia/Kuwait',
  'BH': 'Asia/Bahrain',
  'QA': 'Asia/Qatar',
  'OM': 'Asia/Muscat',
  'YE': 'Asia/Aden',
  'KE': 'Africa/Nairobi',
  'TZ': 'Africa/Dar_es_Salaam',
  'UG': 'Africa/Kampala',
  'ET': 'Africa/Addis_Ababa',
  'GH': 'Africa/Accra',
  'CI': 'Africa/Abidjan',
  'SN': 'Africa/Dakar',
  'MA': 'Africa/Casablanca',
  'DZ': 'Africa/Algiers',
  'TN': 'Africa/Tunis',
  'LY': 'Africa/Tripoli',
  'SD': 'Africa/Khartoum',
  'ZW': 'Africa/Harare',
  'ZM': 'Africa/Lusaka',
  'MW': 'Africa/Blantyre',
  'MZ': 'Africa/Maputo',
  'AO': 'Africa/Luanda',
  'NA': 'Africa/Windhoek',
  'BW': 'Africa/Gaborone',
  'SZ': 'Africa/Mbabane',
  'LS': 'Africa/Maseru',
};

// Capital cities mapping
const CAPITAL_MAP: Record<string, string> = {
  'PH': 'Manila',
  'US': 'Washington',
  'RU': 'Moscow',
  'GB': 'London',
  'DE': 'Berlin',
  'FR': 'Paris',
  'ES': 'Madrid',
  'IT': 'Rome',
  'KZ': 'Astana',
  'UA': 'Kyiv',
  'CN': 'Beijing',
  'JP': 'Tokyo',
  'IN': 'New Delhi',
  'BR': 'Brasília',
  'MX': 'Mexico City',
  'CA': 'Ottawa',
  'AU': 'Canberra',
  // Add more as needed
};

// Type assertion for imported JSON
const countriesData = countriesLanguagesData as CountryLanguageConfig[];

// Generate all locale configurations
export const ALL_LOCALES = generateLocaleConfigs(countriesData, TIMEZONE_MAP).map(locale => ({
  ...locale,
  capital: CAPITAL_MAP[locale.countryCode],
}));

// Get unique countries
export const ALL_COUNTRIES = Array.from(
  new Map(
    countriesData.map(country => [
      country.code.toUpperCase(),
      {
        code: country.code.toUpperCase(),
        name: country.country,
        flag: country.flag,
        timezone: TIMEZONE_MAP[country.code.toUpperCase()],
        capital: CAPITAL_MAP[country.code.toUpperCase()],
      }
    ])
  ).values()
);

// Get unique languages
export const ALL_LANGUAGES = Array.from(
  new Map(
    countriesData.flatMap(country => 
      country.languages.map(lang => [
        lang.code.toLowerCase(),
        {
          code: lang.code.toLowerCase(),
          name: lang.name,
        }
      ])
    )
  ).values()
);

// Priority locales (most commonly used)
export const PRIORITY_LOCALES = [
  'en-ph', // English - Philippines
  'ru-kz', // Russian - Kazakhstan
  'en-us', // English - United States
  'ru-ru', // Russian - Russia
  'es-es', // Spanish - Spain
  'es-mx', // Spanish - Mexico
  'fr-fr', // French - France
  'de-de', // German - Germany
  'it-it', // Italian - Italy
  'pt-br', // Portuguese - Brazil
  'zh-cn', // Chinese - China
  'ja-jp', // Japanese - Japan
  'ko-kr', // Korean - South Korea
  'ar-sa', // Arabic - Saudi Arabia
  'en-gb', // English - United Kingdom
  'en-au', // English - Australia
  'en-ca', // English - Canada
];

/**
 * Get locale config by locale string
 */
export function getLocaleConfig(locale: string): LocaleConfig | undefined {
  return ALL_LOCALES.find(l => l.locale === locale.toLowerCase());
}

/**
 * Get all locales for a specific country
 */
export function getLocalesForCountry(countryCode: string): LocaleConfig[] {
  return ALL_LOCALES.filter(l => l.countryCode === countryCode.toUpperCase());
}

/**
 * Get all locales for a specific language
 */
export function getLocalesForLanguage(languageCode: string): LocaleConfig[] {
  return ALL_LOCALES.filter(l => l.languageCode === languageCode.toLowerCase());
}

/**
 * Search locales by country or language name
 */
export function searchLocales(query: string): LocaleConfig[] {
  const lowerQuery = query.toLowerCase();
  return ALL_LOCALES.filter(
    l =>
      l.countryName.toLowerCase().includes(lowerQuery) ||
      l.languageName.toLowerCase().includes(lowerQuery) ||
      l.locale.includes(lowerQuery)
  );
}
