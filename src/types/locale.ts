/**
 * Locale and Country Types
 * Support for ISO 639-1 (language) + ISO 3166-1 (country) format
 */

export interface Language {
  name: string;
  code: string; // ISO 639-1
}

export interface CountryLanguageConfig {
  country: string;
  code: string; // ISO 3166-1 alpha-2
  flag: string;
  languages: Language[];
}

export interface LocaleConfig {
  locale: string; // Format: language-country (e.g., en-ph, ru-kz)
  languageCode: string; // ISO 639-1
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;
  languageName: string;
  flag: string;
  timezone?: string;
  capital?: string;
}

/**
 * Generate locale configs from countries data
 */
export function generateLocaleConfigs(
  countriesData: CountryLanguageConfig[],
  timezoneMap?: Record<string, string>
): LocaleConfig[] {
  const locales: LocaleConfig[] = [];

  countriesData.forEach((country) => {
    country.languages.forEach((language) => {
      const locale = `${language.code}-${country.code.toLowerCase()}`;
      
      locales.push({
        locale,
        languageCode: language.code,
        countryCode: country.code.toUpperCase(),
        countryName: country.country,
        languageName: language.name,
        flag: country.flag,
        timezone: timezoneMap?.[country.code.toUpperCase()],
        capital: undefined, // Can be added if needed
      });
    });
  });

  return locales;
}

/**
 * Get locale by language and country code
 */
export function getLocale(languageCode: string, countryCode: string): string {
  return `${languageCode.toLowerCase()}-${countryCode.toLowerCase()}`;
}

/**
 * Parse locale string into components
 */
export function parseLocale(locale: string): { languageCode: string; countryCode: string } | null {
  const parts = locale.split('-');
  if (parts.length !== 2) return null;
  
  return {
    languageCode: parts[0].toLowerCase(),
    countryCode: parts[1].toUpperCase(),
  };
}
