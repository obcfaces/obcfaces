import { City } from 'country-state-city';

export function getCitiesForLocation(countryCode: string | null, stateCode: string | null) {
  console.log('getCitiesForLocation called with:', { countryCode, stateCode });
  
  if (!countryCode || !stateCode) {
    console.log('Missing countryCode or stateCode');
    return [];
  }
  
  try {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    console.log('Cities found:', cities.length, cities.slice(0, 5));
    return cities.map(city => city.name);
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}
