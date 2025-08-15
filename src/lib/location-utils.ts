import { City, State } from 'country-state-city';

// Comprehensive city database for Philippines provinces
const PHILIPPINES_CITIES = {
  'CEB': [ // Cebu
    'Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City', 'Toledo City',
    'Danao City', 'Carcar City', 'Naga City', 'Bogo City', 'Minglanilla',
    'Consolacion', 'Liloan', 'Compostela', 'Cordova', 'Bantayan', 'Madridejos',
    'Santa Fe', 'Daanbantayan', 'Medellin', 'Badian', 'Moalboal', 'Alcantara',
    'Ronda', 'Dumanjug', 'Barili', 'Aloguinsan', 'Pinamungajan', 'Tabogon',
    'Sogod', 'Catmon', 'Carmen', 'San Fernando', 'Sibonga', 'Argao',
    'Dalaguete', 'Alcoy', 'Boljoon', 'Oslob', 'Santander', 'Samboan',
    'Ginatilan', 'Malabuyoc', 'Alegria', 'Tuburan', 'Asturias', 'Balamban'
  ],
  'MNL': [ // Metro Manila
    'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Marikina', 'Parañaque',
    'Las Piñas', 'Muntinlupa', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela',
    'Pasay', 'San Juan', 'Mandaluyong'
  ],
  'LAG': [ // Laguna
    'Santa Rosa', 'Biñan', 'San Pedro', 'Cabuyao', 'Calamba', 'Los Baños',
    'Bay', 'Calauan', 'Alaminos', 'San Pablo', 'Sta. Cruz', 'Pagsanjan'
  ],
  'BUL': [ // Bulacan
    'Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue',
    'Balagtas', 'Guiguinto', 'Pandi', 'Plaridel', 'Pulilan', 'Calumpit'
  ],
  'CAV': [ // Cavite
    'Bacoor', 'Imus', 'Dasmariñas', 'General Trias', 'Trece Martires',
    'Kawit', 'Noveleta', 'Rosario', 'Tanza', 'Naic', 'Silang'
  ],
  'RIZ': [ // Rizal
    'Antipolo', 'Cainta', 'Taytay', 'Angono', 'Binangonan', 'Teresa',
    'Morong', 'Baras', 'Tanay', 'Pililla', 'Jala-Jala', 'Pakil'
  ]
} as Record<string, string[]>;

export function getCitiesForLocation(countryCode: string | null, stateCode: string | null) {
  console.log('getCitiesForLocation called with:', { countryCode, stateCode });
  
  if (!countryCode || !stateCode) {
    console.log('Missing countryCode or stateCode');
    return [];
  }
  
  try {
    // First try the country-state-city library
    const cscCities = City.getCitiesOfState(countryCode, stateCode);
    console.log('CSC Cities found:', cscCities.length, cscCities.slice(0, 5));
    
    if (cscCities.length > 0) {
      return cscCities.map(city => city.name);
    }
    
    // Fallback for Philippines with comprehensive city database
    if (countryCode === 'PH' && PHILIPPINES_CITIES[stateCode]) {
      const cities = PHILIPPINES_CITIES[stateCode];
      console.log(`Using comprehensive database for ${stateCode}:`, cities.length, 'cities');
      return cities;
    }
    
    console.log('No cities found for:', { countryCode, stateCode });
    return [];
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}
