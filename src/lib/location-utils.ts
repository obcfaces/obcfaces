// Removed heavy country-state-city import to fix mobile loading issues

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
  'MNL': [ // Metro Manila (NCR)
    'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Marikina', 'Parañaque',
    'Las Piñas', 'Muntinlupa', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela',
    'Pasay', 'San Juan', 'Mandaluyong'
  ],
  'LAG': [ // Laguna
    'Santa Rosa', 'Biñan', 'San Pedro', 'Cabuyao', 'Calamba', 'Los Baños',
    'Bay', 'Calauan', 'Alaminos', 'San Pablo', 'Sta. Cruz', 'Pagsanjan',
    'Lumban', 'Kalayaan', 'Cavinti', 'Famy', 'Siniloan', 'Mabitac',
    'Santa Maria', 'Majayjay', 'Liliw', 'Nagcarlan', 'Rizal', 'Pila'
  ],
  'BUL': [ // Bulacan
    'Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue',
    'Balagtas', 'Guiguinto', 'Pandi', 'Plaridel', 'Pulilan', 'Calumpit',
    'Hagonoy', 'Paombong', 'Bulakan', 'Obando', 'Santa Maria', 'Norzagaray',
    'San Miguel', 'San Ildefonso', 'San Rafael', 'Angat', 'Bustos', 'Baliuag'
  ],
  'CAV': [ // Cavite
    'Bacoor', 'Imus', 'Dasmariñas', 'General Trias', 'Trece Martires',
    'Kawit', 'Noveleta', 'Rosario', 'Tanza', 'Naic', 'Silang',
    'Carmona', 'General Emilio Aguinaldo', 'Alfonso', 'Tagaytay', 'Mendez',
    'Indang', 'Maragondon', 'Magallanes', 'Amadeo', 'Ternate'
  ],
  'RIZ': [ // Rizal
    'Antipolo', 'Cainta', 'Taytay', 'Angono', 'Binangonan', 'Teresa',
    'Morong', 'Baras', 'Tanay', 'Pililla', 'Jala-Jala', 'Pakil',
    'Cardona', 'Rodriguez', 'San Mateo'
  ],
  'BTG': [ // Batangas
    'Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Calaca', 'Lemery',
    'Taal', 'Balayan', 'Nasugbu', 'Laurel', 'Agoncillo', 'Alitagtag',
    'Balete', 'Cuenca', 'Ibaan', 'Lobo', 'Mabini', 'Malvar', 'Mataasnakahoy',
    'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis', 'San Nicolas',
    'San Pascual', 'Santa Teresita', 'Talisay', 'Taysan', 'Tingloy', 'Tuy'
  ],
  'PAM': [ // Pampanga
    'San Fernando', 'Angeles', 'Mabalacat', 'Apalit', 'Arayat', 'Bacolor',
    'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Macabebe', 'Magalang',
    'Masantol', 'Mexico', 'Porac', 'Sasmuan', 'Santa Ana', 'Santa Rita',
    'Santo Tomas', 'Minalin'
  ],
  'TAR': [ // Tarlac
    'Tarlac City', 'Concepcion', 'Capas', 'Bamban', 'Camiling', 'Gerona',
    'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos',
    'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Victoria',
    'Anao'
  ],
  'ZAM': [ // Zambales
    'Olongapo', 'Subic', 'Castillejos', 'San Marcelino', 'San Antonio',
    'San Felipe', 'San Narciso', 'Botolan', 'Cabangan', 'Candelaria',
    'Iba', 'Masinloc', 'Palauig', 'Santa Cruz'
  ],
  'BAT': [ // Bataan
    'Balanga', 'Mariveles', 'Bagac', 'Hermosa', 'Limay', 'Morong',
    'Orani', 'Orion', 'Pilar', 'Samal', 'Abucay', 'Dinalupihan'
  ],
  'NUE': [ // Nueva Ecija
    'Cabanatuan', 'Gapan', 'San Jose', 'Palayan', 'Muñoz', 'Aliaga',
    'Bongabon', 'Cabiao', 'Carranglan', 'Cuyapo', 'Gabaldon', 'General Mamerto Natividad',
    'General Tinio', 'Guimba', 'Jaen', 'Laur', 'Licab', 'Llanera',
    'Lupao', 'Nampicuan', 'Pantabangan', 'Peñaranda', 'Quezon', 'Rizal',
    'San Antonio', 'San Isidro', 'San Leonardo', 'Santa Rosa', 'Santo Domingo',
    'Talavera', 'Talugtug', 'Zaragoza'
  ],
  'DAV': [ // Davao del Sur
    'Davao City', 'Digos', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay',
    'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'
  ],
  'ILO': [ // Iloilo
    'Iloilo City', 'Passi', 'Ajuy', 'Alimodian', 'Anilao', 'Badiangan',
    'Balasan', 'Banate', 'Barotac Nuevo', 'Barotac Viejo', 'Batad',
    'Bingawan', 'Bocari', 'Bugasong', 'Cabatuan', 'Calinog', 'Carles',
    'Concepcion', 'Dingle', 'Duenas', 'Dumangas', 'Estancia', 'Guimbal',
    'Igbaras', 'Janiuay', 'Lambunao', 'Leganes', 'Lemery', 'Leon',
    'Maasin', 'Miagao', 'Mina', 'New Lucena', 'Oton', 'Pavia',
    'Pototan', 'San Dionisio', 'San Enrique', 'San Joaquin', 'San Miguel',
    'San Rafael', 'Santa Barbara', 'Sara', 'Tigbauan', 'Tubungan', 'Zarraga'
  ],
  'BOH': [ // Bohol
    'Tagbilaran', 'Tubigon', 'Calape', 'Loon', 'Maribojoc', 'Antequera',
    'Baclayon', 'Alburquerque', 'Loboc', 'Sikatuna', 'Carmen', 'Garcia Hernandez',
    'Valencia', 'Dimiao', 'Lila', 'Loay', 'Panglao', 'Dauis', 'Cortes',
    'Corella', 'Balilihan', 'Catigbian', 'Batuan', 'Sevilla', 'Bilar',
    'Chocolate Hills', 'Sagbayan', 'Sierra Bullones', 'Pilar', 'Dagohoy',
    'Danao', 'Trinidad', 'Talibon', 'Bien Unido', 'Ubay', 'San Miguel',
    'San Isidro', 'Alicia', 'Mabini', 'Candijay', 'Anda', 'Guindulman',
    'Duero', 'Jagna', 'Clarin', 'Inabanga', 'Buenavista', 'Getafe', 'President Carlos P. Garcia'
  ],
  'NEG': [ // Negros Occidental
    'Bacolod', 'Talisay', 'Silay', 'Cadiz', 'Sagay', 'Escalante', 'Manapla',
    'Victorias', 'Toboso', 'Calatrava', 'Pulupandan', 'Valladolid', 'San Enrique',
    'Pontevedra', 'Hinigaran', 'La Carlota', 'Bago', 'Murcia', 'Don Salvador Benedicto',
    'La Castellana', 'Moises Padilla', 'Isabela', 'Binalbagan', 'Himamaylan',
    'Kabankalan', 'Ilog', 'Cauayan', 'Candoni', 'Hinoba-an', 'Salvador Benedicto'
  ],
  'AKL': [ // Aklan
    'Kalibo', 'Ibajay', 'Nabas', 'Malay', 'Buruanga', 'Caticlan', 'Boracay',
    'Makato', 'Numancia', 'Lezo', 'Madalag', 'Libacao', 'Jamindan',
    'Tapaz', 'New Washington', 'Batan', 'Altavas', 'Banga'
  ],
  'CAP': [ // Capiz
    'Roxas City', 'Panay', 'Panitan', 'Pontevedra', 'President Roxas', 'Pilar',
    'Sigma', 'Sapian', 'Jamindan', 'Tapaz', 'Dumalag', 'Dumarao', 'Dao',
    'Cuartero', 'Mambusao', 'Ivisan'
  ],
  'ANT': [ // Antique
    'San Jose', 'Sibalom', 'Hamtic', 'Tobias Fornier', 'Anini-y', 'Patnongon',
    'Bugasong', 'Valderrama', 'Barbaza', 'Laua-an', 'Culasi', 'Sebaste',
    'Pandan', 'Libertad', 'Caluya', 'San Remigio', 'Belison', 'Tibiao'
  ],
  'AGN': [ // Agusan del Norte
    'Butuan', 'Buenavista', 'Carmen', 'Jabonga', 'Kitcharao', 'Las Nieves',
    'Magallanes', 'Nasipit', 'Remedios T. Romualdez', 'Santiago', 'Tubay',
    'Cabadbaran'
  ],
  'AGS': [ // Agusan del Sur
    'Bayugan', 'Bunawan', 'Esperanza', 'La Paz', 'Loreto', 'Prosperidad',
    'Rosario', 'San Francisco', 'San Luis', 'Santa Josefa', 'Sibagat',
    'Talacogon', 'Trento', 'Veruela'
  ]
} as Record<string, string[]>;

export function getCitiesForLocation(countryCode: string | null, stateCode: string | null) {
  console.log('getCitiesForLocation called with:', { countryCode, stateCode });
  
  if (!countryCode || !stateCode) {
    console.log('Missing countryCode or stateCode');
    return [];
  }
  
  try {
    // Use comprehensive Philippines city database
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