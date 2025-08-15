import { City } from 'country-state-city';

export function getCitiesForLocation(countryCode: string | null, stateCode: string | null) {
  if (!countryCode || !stateCode) return [];
  
  try {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    return cities.map(city => city.name);
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}
