import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Convert country codes to full names
export function getCountryDisplayName(countryValue: string): string {
  const countryMappings: Record<string, string> = {
    'PH': 'Philippines',
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'JP': 'Japan',
    'KR': 'South Korea',
    'CN': 'China',
    'IN': 'India',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'SG': 'Singapore',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'ES': 'Spain',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'RU': 'Russia'
  };
  
  // Return full name if it's a code, otherwise return as is
  return countryMappings[countryValue] || countryValue;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
