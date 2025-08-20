// Comprehensive city database for multiple countries

const PHILIPPINES_CITIES = {
  // Luzon Regions
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
  'QUE': [ // Quezon
    'Lucena', 'Tayabas', 'Sariaya', 'Candelaria', 'Tiaong', 'San Antonio',
    'Dolores', 'Pagbilao', 'Atimonan', 'Padre Burgos', 'Agdangan', 'Unisan',
    'Plaridel', 'Gumaca', 'Lopez', 'Calauag', 'Guinayangan', 'Tagkawayan',
    'Buenavista', 'San Narciso', 'Mulanay', 'San Andres', 'San Francisco'
  ],
  'BUL': [ // Bulacan
    'Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue',
    'Balagtas', 'Guiguinto', 'Pandi', 'Plaridel', 'Pulilan', 'Calumpit',
    'Hagonoy', 'Paombong', 'Bulakan', 'Obando', 'Santa Maria', 'Norzagaray',
    'San Miguel', 'San Ildefonso', 'San Rafael', 'Angat', 'Bustos', 'Baliuag'
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
    'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Victoria', 'Anao'
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
  'BATAAN': [ // Bataan (alternative code)
    'Balanga', 'Mariveles', 'Bagac', 'Hermosa', 'Limay', 'Morong',
    'Orani', 'Orion', 'Pilar', 'Samal', 'Abucay', 'Dinalupihan'
  ],
  'III': [ // Bataan (Region III code)
    'Balanga', 'Mariveles', 'Bagac', 'Hermosa', 'Limay', 'Morong',
    'Orani', 'Orion', 'Pilar', 'Samal', 'Abucay', 'Dinalupihan'
  ],
  'BTA': [ // Bataan (alternative abbreviation)
    'Balanga', 'Mariveles', 'Bagac', 'Hermosa', 'Limay', 'Morong',
    'Orani', 'Orion', 'Pilar', 'Samal', 'Abucay', 'Dinalupihan'
  ],
  'BAN': [ // Bataan (actual state code used by library)
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
  'AUR': [ // Aurora
    'Baler', 'Casiguran', 'Dilasag', 'Dinalungan', 'Dingalan', 'Dipaculao',
    'Maria Aurora', 'San Luis'
  ],
  'APA': [ // Apayao
    'Kabugao', 'Calanasan', 'Conner', 'Flora', 'Luna', 'Pudtol', 'Santa Marcela'
  ],
  'ABR': [ // Abra
    'Bangued', 'Boliney', 'Bucay', 'Bucloc', 'Daguioman', 'Danglas', 'Dolores',
    'La Paz', 'Lacub', 'Lagangilang', 'Lagayan', 'Langiden', 'Licuan-Baay',
    'Luba', 'Malibcong', 'Manabo', 'Peñarrubia', 'Pidigan', 'Pilar',
    'Sallapadan', 'San Isidro', 'San Juan', 'San Quintin', 'Tayum', 'Tineg',
    'Tubo', 'Villaviciosa'
  ],
  'KAL': [ // Kalinga
    'Tabuk', 'Balbalan', 'Lubuagan', 'Pasil', 'Pinukpuk', 'Rizal', 'Tanudan', 'Tinglayan'
  ],
  'MOU': [ // Mountain Province
    'Bontoc', 'Barlig', 'Bauko', 'Besao', 'Natonin', 'Paracelis', 'Sabangan',
    'Sadanga', 'Sagada', 'Tadian'
  ],
  'IFU': [ // Ifugao
    'Lagawe', 'Aguinaldo', 'Alfonso Lista', 'Asipulo', 'Banaue', 'Hingyon',
    'Hungduan', 'Kiangan', 'Lamut', 'Mayoyao', 'Tinoc'
  ],
  'BEN': [ // Benguet
    'La Trinidad', 'Baguio', 'Atok', 'Bakun', 'Bokod', 'Buguias', 'Itogon',
    'Kabayan', 'Kapangan', 'Kibungan', 'Mankayan', 'Sablan', 'Tuba', 'Tublay'
  ],
  'PAN': [ // Pangasinan
    'Lingayen', 'Alaminos', 'Dagupan', 'San Carlos', 'Urdaneta', 'Agno',
    'Aguilar', 'Alcala', 'Anda', 'Asingan', 'Balungao', 'Bani',
    'Basista', 'Bautista', 'Bayambang', 'Binalonan', 'Binmaley',
    'Bolinao', 'Bugallon', 'Burgos', 'Calasiao', 'Dasol', 'Infanta',
    'Labrador', 'Laoac', 'Malasiqui', 'Manaoag', 'Mangaldan',
    'Mangatarem', 'Mapandan', 'Natividad', 'Pozorrubio', 'Rosales',
    'San Fabian', 'San Jacinto', 'San Manuel', 'San Nicolas',
    'San Quintin', 'Santa Barbara', 'Santa Maria', 'Santo Tomas',
    'Sison', 'Sual', 'Tayug', 'Umingan', 'Urbiztondo', 'Villasis'
  ],
  'ILS': [ // Ilocos Sur
    'Vigan', 'Candon', 'Alilem', 'Banayoyo', 'Bantay', 'Burgos',
    'Cabugao', 'Caoayan', 'Cervantes', 'Galimuyod', 'Gregorio del Pilar',
    'Lidlidda', 'Magsingal', 'Nagbukel', 'Narvacan', 'Quirino',
    'Salcedo', 'San Emilio', 'San Esteban', 'San Ildefonso',
    'San Juan', 'San Vicente', 'Santa', 'Santa Catalina',
    'Santa Cruz', 'Santa Lucia', 'Santa Maria', 'Santiago',
    'Santo Domingo', 'Sigay', 'Sinait', 'Sugpon', 'Suyo', 'Tagudin'
  ],
  'ILN': [ // Ilocos Norte
    'Laoag', 'Batac', 'Adams', 'Bacarra', 'Badoc', 'Bangui', 'Banna',
    'Burgos', 'Carasi', 'Currimao', 'Dingras', 'Dumalneg', 'Marcos',
    'Nueva Era', 'Pagudpud', 'Paoay', 'Pasuquin', 'Piddig', 'Pinili',
    'San Nicolas', 'Sarrat', 'Solsona', 'Vintar'
  ],
  'LUN': [ // La Union
    'San Fernando', 'Agoo', 'Aringay', 'Bacnotan', 'Bagulin', 'Balaoan',
    'Bangar', 'Bauang', 'Burgos', 'Caba', 'Luna', 'Naguilian',
    'Pugo', 'Rosario', 'San Gabriel', 'San Juan', 'Santo Tomas',
    'Santol', 'Sudipen', 'Tubao'
  ],

  // Bicol Region
  'ALB': [ // Albay
    'Legazpi', 'Ligao', 'Tabaco', 'Tiwi', 'Malinao', 'Bacacay', 'Camalig',
    'Daraga', 'Guinobatan', 'Jovellar', 'Libon', 'Malilipot', 'Manito',
    'Oas', 'Pio Duran', 'Polangui', 'Rapu-Rapu', 'Santo Domingo'
  ],
  'CAN': [ // Camarines Norte
    'Daet', 'Jose Panganiban', 'Labo', 'Mercedes', 'Paracale', 'San Lorenzo Ruiz',
    'San Vicente', 'Santa Elena', 'Talisay', 'Vinzons', 'Basud', 'Capalonga'
  ],
  'CAS': [ // Camarines Sur
    'Naga', 'Iriga', 'Pili', 'Magarao', 'Canaman', 'Camaligan', 'Gainza',
    'Milaor', 'Minalabac', 'Pamplona', 'Pasacao', 'San Fernando', 'Sipocot',
    'Libmanan', 'Cabusao', 'Del Gallego', 'Ragay', 'Lupi', 'Garchitorena',
    'Presentacion', 'Caramoan', 'Goa', 'Lagonoy', 'Sagñay', 'San Jose',
    'Tigaon', 'Tinambac', 'Siruma', 'Bato', 'Baao', 'Bula', 'Nabua',
    'Balatan', 'Bombon', 'Buhi', 'Ocampo'
  ],
  'CAT': [ // Catanduanes
    'Virac', 'Bato', 'Bagamanoc', 'Baras', 'Caramoran', 'Gigmoto',
    'Pandan', 'Panganiban', 'San Andres', 'San Miguel', 'Viga'
  ],
  'MAS': [ // Masbate
    'Masbate City', 'Aroroy', 'Baleno', 'Balud', 'Batuan', 'Cataingan',
    'Cawayan', 'Claveria', 'Dimasalang', 'Esperanza', 'Mandaon', 'Milagros',
    'Mobo', 'Monreal', 'Palanas', 'Pio V. Corpuz', 'Placer', 'San Fernando',
    'San Jacinto', 'San Pascual', 'Uson'
  ],
  'SOR': [ // Sorsogon
    'Sorsogon City', 'Bacon', 'Barcelona', 'Bulan', 'Bulusan', 'Casiguran',
    'Castilla', 'Donsol', 'Gubat', 'Irosin', 'Juban', 'Magallanes',
    'Matnog', 'Pilar', 'Prieto Diaz', 'Santa Magdalena'
  ],

  // MIMAROPA Region
  'MAR': [ // Marinduque
    'Boac', 'Buenavista', 'Gasan', 'Mogpog', 'Santa Cruz', 'Torrijos'
  ],
  'OCC': [ // Occidental Mindoro
    'Mamburao', 'Abra de Ilog', 'Calintaan', 'Looc', 'Lubang', 'Magsaysay',
    'Paluan', 'Rizal', 'Sablayan', 'San Jose', 'Santa Cruz'
  ],
  'ORI': [ // Oriental Mindoro
    'Calapan', 'Baco', 'Bansud', 'Bongabong', 'Bulalacao', 'Gloria',
    'Mansalay', 'Naujan', 'Pinamalayan', 'Pola', 'Puerto Galera',
    'Roxas', 'San Teodoro', 'Socorro', 'Victoria'
  ],
  'PAL': [ // Palawan
    'Puerto Princesa', 'Aborlan', 'Agutaya', 'Araceli', 'Balabac', 'Bataraza',
    'Brooke\'s Point', 'Busuanga', 'Cagayancillo', 'Coron', 'Culion',
    'Cuyo', 'Dumaran', 'El Nido', 'Linapacan', 'Magsaysay', 'Narra',
    'Quezon', 'Rizal', 'Roxas', 'San Vicente', 'Sofronio Española',
    'Taytay', 'Kalayaan'
  ],
  'ROM': [ // Romblon
    'Romblon', 'Alcantara', 'Banton', 'Cajidiocan', 'Calatrava', 'Concepcion',
    'Corcuera', 'Ferrol', 'Looc', 'Magdiwang', 'Odiongan', 'San Agustin',
    'San Andres', 'San Fernando', 'San Jose', 'Santa Fe', 'Santa Maria'
  ],

  // Visayas Regions
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
  'BOH': [ // Bohol
    'Tagbilaran', 'Tubigon', 'Calape', 'Loon', 'Maribojoc', 'Antequera',
    'Baclayon', 'Alburquerque', 'Loboc', 'Sikatuna', 'Carmen', 'Garcia Hernandez',
    'Valencia', 'Dimiao', 'Lila', 'Loay', 'Panglao', 'Dauis', 'Cortes',
    'Corella', 'Balilihan', 'Catigbian', 'Batuan', 'Sevilla', 'Bilar',
    'Sagbayan', 'Sierra Bullones', 'Pilar', 'Dagohoy', 'Danao', 'Trinidad',
    'Talibon', 'Bien Unido', 'Ubay', 'San Miguel', 'San Isidro', 'Alicia',
    'Mabini', 'Candijay', 'Anda', 'Guindulman', 'Duero', 'Jagna',
    'Clarin', 'Inabanga', 'Buenavista', 'Getafe', 'President Carlos P. Garcia'
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
  'NEG': [ // Negros Occidental
    'Bacolod', 'Talisay', 'Silay', 'Cadiz', 'Sagay', 'Escalante', 'Manapla',
    'Victorias', 'Toboso', 'Calatrava', 'Pulupandan', 'Valladolid', 'San Enrique',
    'Pontevedra', 'Hinigaran', 'La Carlota', 'Bago', 'Murcia', 'Don Salvador Benedicto',
    'La Castellana', 'Moises Padilla', 'Isabela', 'Binalbagan', 'Himamaylan',
    'Kabankalan', 'Ilog', 'Cauayan', 'Candoni', 'Hinoba-an'
  ],
  'NER': [ // Negros Oriental
    'Dumaguete', 'Bais', 'Bayawan', 'Canlaon', 'Guihulngan', 'Tanjay',
    'Amlan', 'Ayungon', 'Bacong', 'Basay', 'Bindoy', 'Dauin',
    'Jimalalud', 'La Libertad', 'Mabinay', 'Manjuyod', 'Pamplona',
    'San Jose', 'Santa Catalina', 'Siaton', 'Sibulan', 'Tayasan',
    'Valencia', 'Vallehermoso', 'Zamboanguita'
  ],
  'AKL': [ // Aklan
    'Kalibo', 'Ibajay', 'Nabas', 'Malay', 'Buruanga', 'Makato', 'Numancia',
    'Lezo', 'Madalag', 'Libacao', 'Jamindan', 'Tapaz', 'New Washington',
    'Batan', 'Altavas', 'Banga'
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
  'GUI': [ // Guimaras
    'Jordan', 'Buenavista', 'Nueva Valencia', 'San Lorenzo', 'Sibunag'
  ],
  'LEY': [ // Leyte
    'Tacloban', 'Ormoc', 'Baybay', 'Maasin', 'Abuyog', 'Alangalang', 'Albuera',
    'Babatngon', 'Barugo', 'Bato', 'Calubian', 'Capoocan', 'Carigara',
    'Dagami', 'Dulag', 'Hilongos', 'Hindang', 'Inopacan', 'Isabel',
    'Jaro', 'Javier', 'Julita', 'Kananga', 'La Paz', 'Leyte', 'MacArthur',
    'Mahaplag', 'Matag-ob', 'Matalom', 'Mayorga', 'Merida', 'Ormoc',
    'Palo', 'Palompon', 'Pastrana', 'San Isidro', 'San Miguel', 'Santa Fe',
    'Tabango', 'Tabontabon', 'Tanauan', 'Tolosa', 'Tunga', 'Villaba'
  ],
  'EAS': [ // Eastern Samar
    'Borongan', 'Arteche', 'Balangiga', 'Balangkayan', 'Can-avid', 'Dolores',
    'General MacArthur', 'Giporlos', 'Guiuan', 'Hernani', 'Jipapad',
    'Lawaan', 'Llorente', 'Maslog', 'Maydolong', 'Mercedes', 'Oras',
    'Quinapondan', 'Salcedo', 'San Julian', 'San Policarpo', 'Sulat', 'Taft'
  ],
  'NSA': [ // Northern Samar
    'Catarman', 'Allen', 'Biri', 'Bobon', 'Capul', 'Catubig', 'Gamay',
    'Laoang', 'Lapinig', 'Las Navas', 'Lavezares', 'Mapanas', 'Mondragon',
    'Palapag', 'Pambujan', 'Rosario', 'San Antonio', 'San Isidro',
    'San Jose', 'San Roque', 'San Vicente', 'Silvino Lobos', 'Victoria'
  ],
  'SAM': [ // Samar (Western Samar)
    'Catbalogan', 'Calbayog', 'Basey', 'Calbiga', 'Daram', 'Gandara',
    'Hinabangan', 'Jiabong', 'Marabut', 'Matuguinao', 'Motiong', 'Pinabacdao',
    'San Jorge', 'San Jose de Buan', 'San Sebastian', 'Santa Margarita',
    'Santa Rita', 'Santo Niño', 'Tagapul-an', 'Talalora', 'Tarangnan',
    'Villareal', 'Zumarraga', 'Almagro', 'Pagsanghan'
  ],
  'BIL': [ // Biliran
    'Naval', 'Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba',
    'Kawayan', 'Maripipi'
  ],
  'DIN': [ // Dinagat Islands
    'San Jose', 'Basilisa', 'Cagdianao', 'Libjo', 'Loreto', 'Tubajon'
  ],

  // Mindanao Regions
  'DAV': [ // Davao del Sur
    'Davao City', 'Digos', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay',
    'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'
  ],
  'NDV': [ // Davao del Norte
    'Tagum', 'Panabo', 'Samal', 'Asuncion', 'Braulio E. Dujali', 'Carmen',
    'Kapalong', 'New Corella', 'San Isidro', 'Santo Tomas', 'Talaingod'
  ],
  'DVO': [ // Davao Oriental
    'Mati', 'Baganga', 'Banaybanay', 'Boston', 'Caraga', 'Cateel', 'Governor Generoso',
    'Lupon', 'Manay', 'San Isidro', 'Tarragona'
  ],
  'COM': [ // Davao de Oro (Compostela Valley)
    'Nabunturan', 'Pantukan', 'Compostela', 'Laak', 'Mabini', 'Maco',
    'Maragusan', 'Mawab', 'Monkayo', 'Montevista', 'New Bataan'
  ],
  'DAO': [ // Davao Occidental
    'Malita', 'Don Marcelino', 'Jose Abad Santos', 'Santa Maria', 'Sarangani'
  ],
  'SCO': [ // South Cotabato
    'Koronadal', 'General Santos', 'Banga', 'Lake Sebu', 'Norala', 'Polomolok',
    'Santo Niño', 'Surallah', 'T\'Boli', 'Tampakan', 'Tantangan', 'Tupi'
  ],
  'SAR': [ // Sarangani
    'Alabel', 'Glan', 'Kiamba', 'Maasim', 'Maitum', 'Malapatan', 'Malungon'
  ],
  'COT': [ // Cotabato (North Cotabato)
    'Kidapawan', 'Alamada', 'Aleosan', 'Antipas', 'Arakan', 'Banisilan',
    'Carmen', 'Kabacan', 'Libungan', 'M\'lang', 'Magpet', 'Makilala',
    'Matalam', 'Midsayap', 'Pigcawayan', 'Pikit', 'President Roxas',
    'Tulunan'
  ],
  'SUK': [ // Sultan Kudarat
    'Isulan', 'Bagumbayan', 'Columbio', 'Esperanza', 'Kalamansig', 'Lebak',
    'Lutayan', 'Lambayong', 'Palimbang', 'President Quirino', 'Sen. Ninoy Aquino', 'Tacurong'
  ],
  'AGN': [ // Agusan del Norte
    'Butuan', 'Buenavista', 'Carmen', 'Jabonga', 'Kitcharao', 'Las Nieves',
    'Magallanes', 'Nasipit', 'Remedios T. Romualdez', 'Santiago', 'Tubay', 'Cabadbaran'
  ],
  'AGS': [ // Agusan del Sur
    'Bayugan', 'Bunawan', 'Esperanza', 'La Paz', 'Loreto', 'Prosperidad',
    'Rosario', 'San Francisco', 'San Luis', 'Santa Josefa', 'Sibagat',
    'Talacogon', 'Trento', 'Veruela'
  ],
  'ZAN': [ // Zamboanga del Norte
    'Dipolog', 'Dapitan', 'Roxas', 'Sindangan', 'Sergio Osmeña Sr.', 'Katipunan',
    'Manukan', 'Jose Dalman', 'Tampilisan', 'Godod', 'Bacungan', 'Baliguian',
    'Gutalac', 'Kalawit', 'La Libertad', 'Labason', 'Leon B. Postigo',
    'Liloy', 'Mutia', 'Piñan', 'Polanco', 'Pres. Manuel A. Roxas',
    'Rizal', 'Salug', 'Siayan', 'Sibuco', 'Sibutad', 'Siocon'
  ],
  'ZAS': [ // Zamboanga del Sur
    'Pagadian', 'Zamboanga City', 'Aurora', 'Bayog', 'Dimataling', 'Dinas',
    'Dumalinao', 'Dumingag', 'Guipos', 'Josefina', 'Kumalarang', 'Labangan',
    'Lakewood', 'Lapuyan', 'Mahayag', 'Margosatubig', 'Midsalip', 'Molave',
    'Pitogo', 'Ramon Magsaysay', 'San Miguel', 'San Pablo', 'Sominot',
    'Tabina', 'Tambulig', 'Tigbao', 'Tukuran', 'Vincenzo A. Sagun'
  ],
  'ZSI': [ // Zamboanga Sibugay
    'Ipil', 'Alicia', 'Buug', 'Diplahan', 'Imelda', 'Kabasalan', 'Mabuhay',
    'Malangas', 'Naga', 'Olutanga', 'Payao', 'Roseller Lim', 'Siay',
    'Talusan', 'Titay', 'Tungawan'
  ],
  'LNN': [ // Lanao del Norte
    'Iligan', 'Tubod', 'Bacolod', 'Baloi', 'Baroy', 'Kapatagan', 'Kauswagan',
    'Kolambugan', 'Lala', 'Linamon', 'Magsaysay', 'Maigo', 'Matungao',
    'Munai', 'Nunungan', 'Pantao Ragat', 'Pantar', 'Poona Piagapo',
    'President Manuel A. Roxas', 'Salvador', 'Sapad', 'Sultan Naga Dimaporo',
    'Tagoloan', 'Tangcal'
  ],
  'LAN': [ // Lanao del Sur
    'Marawi', 'Balabagan', 'Balindong', 'Bayang', 'Binidayan', 'Buadiposo-Buntong',
    'Bubong', 'Butig', 'Ganassi', 'Kapai', 'Lumba-Bayabao', 'Lumbaca-Unayan',
    'Lumbatan', 'Lumbayanague', 'Madalum', 'Madamba', 'Maguing', 'Malabang',
    'Marantao', 'Marogong', 'Masiu', 'Mulondo', 'Pagayawan', 'Piagapo',
    'Picong', 'Poona Bayabao', 'Pualas', 'Saguiaran', 'Sultan Dumalondong',
    'Tagoloan II', 'Tamparan', 'Taraka', 'Tubaran', 'Tugaya', 'Wao'
  ],
  'MSC': [ // Misamis Occidental
    'Oroquieta', 'Ozamiz', 'Tangub', 'Aloran', 'Baliangao', 'Bonifacio',
    'Calamba', 'Clarin', 'Concepcion', 'Don Victoriano Chiongbian',
    'Jimenez', 'Lopez Jaena', 'Panaon', 'Plaridel', 'Sapang Dalaga',
    'Sinacaban', 'Tudela'
  ],
  'MSR': [ // Misamis Oriental
    'Cagayan de Oro', 'Gingoog', 'Alubijid', 'Balingasag', 'Balingoan',
    'Binuangan', 'Claveria', 'El Salvador', 'Gitagum', 'Initao', 'Jasaan',
    'Kinoguitan', 'Lagonglong', 'Laguindingan', 'Libertad', 'Lugait',
    'Magsaysay', 'Manticao', 'Medina', 'Naawan', 'Opol', 'Salay',
    'Sugbongcogon', 'Tagoloan', 'Talisayan', 'Villanueva'
  ],
  'BUK': [ // Bukidnon
    'Malaybalay', 'Valencia', 'Cabanglasan', 'Damulog', 'Dangcagan', 'Don Carlos',
    'Impasug-ong', 'Kadingilan', 'Kalilangan', 'Kibawe', 'Kitaotao', 'Lantapan',
    'Libona', 'Malitbog', 'Manolo Fortich', 'Maramag', 'Pangantucan', 'Quezon',
    'San Fernando', 'Sumilao', 'Talakag'
  ],
  'CAM': [ // Camiguin
    'Mambajao', 'Catarman', 'Guinsiliban', 'Mahinog', 'Sagay'
  ],

  // ARMM
  'MSA': [ // Maguindanao
    'Cotabato City', 'Ampatuan', 'Barira', 'Buldon', 'Datu Abdullah Sangki',
    'Datu Anggal Midtimbang', 'Datu Blah T. Sinsuat', 'Datu Hoffer Ampatuan',
    'Datu Montawal', 'Datu Odin Sinsuat', 'Datu Paglas', 'Datu Piang',
    'Datu Salibo', 'Datu Saudi-Ampatuan', 'Datu Unsay', 'General Salipada K. Pendatun',
    'Guindulungan', 'Kabuntalan', 'Mamasapano', 'Mangudadatu', 'Matanog',
    'Northern Kabuntalan', 'Pagalungan', 'Paglat', 'Pandag', 'Parang',
    'Rajah Buayan', 'Shariff Aguak', 'Shariff Saydona Mustapha', 'South Upi',
    'Sultan Mastura', 'Sultan sa Barongis', 'Sultan Sumagka', 'Talayan',
    'Talitay', 'Upi'
  ],
  'BAS': [ // Basilan
    'Isabela City', 'Lamitan', 'Akbar', 'Al-Barka', 'Hadji Mohammad Ajul',
    'Hadji Muhtamad', 'Lantawan', 'Maluso', 'Sumisip', 'Tabuan-Lasa',
    'Tipo-Tipo', 'Tuburan', 'Ungkaya Pukan'
  ],
  'SLU': [ // Sulu
    'Jolo', 'Banguingui', 'Hadji Panglima Tahil', 'Indanan', 'Kalingalan Caluang',
    'Lugus', 'Luuk', 'Maimbung', 'Old Panamao', 'Omar', 'Pandami', 'Panglima Estino',
    'Pangutaran', 'Parang', 'Pata', 'Patikul', 'Siasi', 'Talipao', 'Tapul'
  ],
  'TAW': [ // Tawi-Tawi
    'Bongao', 'Languyan', 'Mapun', 'Panglima Sugala', 'Sapa-Sapa', 'Sibutu',
    'Simunul', 'Sitangkai', 'South Ubian', 'Tandubas', 'Turtle Islands'
  ],
  'ARMM': [ // Autonomous Region in Muslim Mindanao (Combined)
    'Cotabato City', 'Marawi', 'Jolo', 'Bongao', 'Isabela City', 'Lamitan',
    'Digos', 'General Santos', 'Koronadal', 'Tacurong', 'Kidapawan',
    'Akbar', 'Al-Barka', 'Hadji Mohammad Ajul', 'Maluso', 'Sumisip', 'Tipo-Tipo',
    'Balabagan', 'Malabang', 'Wao', 'Tubaran', 'Picong', 'Ganassi',
    'Ampatuan', 'Parang', 'Sultan Kudarat', 'Shariff Aguak', 'Datu Odin Sinsuat',
    'Indanan', 'Siasi', 'Patikul', 'Luuk', 'Pangutaran',
    'Languyan', 'Simunul', 'Sitangkai', 'Turtle Islands', 'South Ubian'
  ],

  // Additional Philippines provinces for complete coverage
  'QUI': [ // Quirino
    'Cabarroguis', 'Aglipay', 'Diffun', 'Maddela', 'Nagtipunan', 'Saguday'
  ],
  'ISA': [ // Isabela
    'Ilagan', 'Cauayan', 'Santiago', 'Tuguegarao', 'Roxas', 'Cabagan', 'Cabatuan',
    'Cordon', 'Dinapigue', 'Echague', 'Gamu', 'Jones', 'Luna', 'Maconacon',
    'Mallig', 'Naguilian', 'Palanan', 'Quezon', 'Quirino', 'Ramon', 'Reina Mercedes',
    'San Agustin', 'San Guillermo', 'San Isidro', 'San Manuel', 'San Mariano',
    'San Mateo', 'San Pablo', 'Santa Maria', 'Santo Tomas', 'Tumauini'
  ],
  'CAG': [ // Cagayan
    'Tuguegarao', 'Aparri', 'Alcala', 'Allacapan', 'Amulung', 'Anguil', 'Baggao',
    'Ballesteros', 'Buguey', 'Calayan', 'Camalaniugan', 'Claveria', 'Enrile',
    'Gattaran', 'Gonzaga', 'Iguig', 'Lal-lo', 'Lasam', 'Pamplona', 'Peñablanca',
    'Piat', 'Rizal', 'Sanchez-Mira', 'Santa Ana', 'Santa Praxedes', 'Santa Teresita',
    'Santo Niño', 'Solana', 'Tuao'
  ],
  'NVZ': [ // Nueva Vizcaya
    'Bayombong', 'Solano', 'Ambaguio', 'Aritao', 'Bagabag', 'Bambang', 'Diadi',
    'Dupax del Norte', 'Dupax del Sur', 'Kasibu', 'Kayapa', 'Quezon', 'Santa Fe',
    'Villaverde'
  ],
  'BTN': [ // Batanes
    'Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'
  ],

  // === ALTERNATIVE CODES FOR ALL MAJOR PHILIPPINES PROVINCES ===
  // Luzon Alternative Codes
  'MANILA': ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Marikina', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela', 'Pasay', 'San Juan', 'Mandaluyong'],
  'NCR': ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Marikina', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela', 'Pasay', 'San Juan', 'Mandaluyong'],
  'METRO_MANILA': ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Marikina', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela', 'Pasay', 'San Juan', 'Mandaluyong'],

  'LAGUNA': ['Santa Rosa', 'Biñan', 'San Pedro', 'Cabuyao', 'Calamba', 'Los Baños', 'Bay', 'Calauan', 'Alaminos', 'San Pablo', 'Sta. Cruz', 'Pagsanjan', 'Lumban', 'Kalayaan', 'Cavinti', 'Famy', 'Siniloan', 'Mabitac', 'Santa Maria', 'Majayjay', 'Liliw', 'Nagcarlan', 'Rizal', 'Pila'],
  'LGN': ['Santa Rosa', 'Biñan', 'San Pedro', 'Cabuyao', 'Calamba', 'Los Baños', 'Bay', 'Calauan', 'Alaminos', 'San Pablo', 'Sta. Cruz', 'Pagsanjan', 'Lumban', 'Kalayaan', 'Cavinti', 'Famy', 'Siniloan', 'Mabitac', 'Santa Maria', 'Majayjay', 'Liliw', 'Nagcarlan', 'Rizal', 'Pila'],

  'CAVITE': ['Bacoor', 'Imus', 'Dasmariñas', 'General Trias', 'Trece Martires', 'Kawit', 'Noveleta', 'Rosario', 'Tanza', 'Naic', 'Silang', 'Carmona', 'General Emilio Aguinaldo', 'Alfonso', 'Tagaytay', 'Mendez', 'Indang', 'Maragondon', 'Magallanes', 'Amadeo', 'Ternate'],
  'CVT': ['Bacoor', 'Imus', 'Dasmariñas', 'General Trias', 'Trece Martires', 'Kawit', 'Noveleta', 'Rosario', 'Tanza', 'Naic', 'Silang', 'Carmona', 'General Emilio Aguinaldo', 'Alfonso', 'Tagaytay', 'Mendez', 'Indang', 'Maragondon', 'Magallanes', 'Amadeo', 'Ternate'],

  'RIZAL': ['Antipolo', 'Cainta', 'Taytay', 'Angono', 'Binangonan', 'Teresa', 'Morong', 'Baras', 'Tanay', 'Pililla', 'Jala-Jala', 'Pakil', 'Cardona', 'Rodriguez', 'San Mateo'],
  'RZL': ['Antipolo', 'Cainta', 'Taytay', 'Angono', 'Binangonan', 'Teresa', 'Morong', 'Baras', 'Tanay', 'Pililla', 'Jala-Jala', 'Pakil', 'Cardona', 'Rodriguez', 'San Mateo'],

  'BATANGAS': ['Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Calaca', 'Lemery', 'Taal', 'Balayan', 'Nasugbu', 'Laurel', 'Agoncillo', 'Alitagtag', 'Balete', 'Cuenca', 'Ibaan', 'Lobo', 'Mabini', 'Malvar', 'Mataasnakahoy', 'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis', 'San Nicolas', 'San Pascual', 'Santa Teresita', 'Talisay', 'Taysan', 'Tingloy', 'Tuy'],
  'BTN_BATANGAS': ['Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Calaca', 'Lemery', 'Taal', 'Balayan', 'Nasugbu', 'Laurel', 'Agoncillo', 'Alitagtag', 'Balete', 'Cuenca', 'Ibaan', 'Lobo', 'Mabini', 'Malvar', 'Mataasnakahoy', 'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis', 'San Nicolas', 'San Pascual', 'Santa Teresita', 'Talisay', 'Taysan', 'Tingloy', 'Tuy'],

  'QUEZON': ['Lucena', 'Tayabas', 'Sariaya', 'Candelaria', 'Tiaong', 'San Antonio', 'Dolores', 'Pagbilao', 'Atimonan', 'Padre Burgos', 'Agdangan', 'Unisan', 'Plaridel', 'Gumaca', 'Lopez', 'Calauag', 'Guinayangan', 'Tagkawayan', 'Buenavista', 'San Narciso', 'Mulanay', 'San Andres', 'San Francisco'],
  'QZN': ['Lucena', 'Tayabas', 'Sariaya', 'Candelaria', 'Tiaong', 'San Antonio', 'Dolores', 'Pagbilao', 'Atimonan', 'Padre Burgos', 'Agdangan', 'Unisan', 'Plaridel', 'Gumaca', 'Lopez', 'Calauag', 'Guinayangan', 'Tagkawayan', 'Buenavista', 'San Narciso', 'Mulanay', 'San Andres', 'San Francisco'],

  'BULACAN': ['Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue', 'Balagtas', 'Guiguinto', 'Pandi', 'Plaridel', 'Pulilan', 'Calumpit', 'Hagonoy', 'Paombong', 'Bulakan', 'Obando', 'Santa Maria', 'Norzagaray', 'San Miguel', 'San Ildefonso', 'San Rafael', 'Angat', 'Bustos', 'Baliuag'],
  'BLC': ['Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue', 'Balagtas', 'Guiguinto', 'Pandi', 'Plaridel', 'Pulilan', 'Calumpit', 'Hagonoy', 'Paombong', 'Bulakan', 'Obando', 'Santa Maria', 'Norzagaray', 'San Miguel', 'San Ildefonso', 'San Rafael', 'Angat', 'Bustos', 'Baliuag'],

  'PAMPANGA': ['San Fernando', 'Angeles', 'Mabalacat', 'Apalit', 'Arayat', 'Bacolor', 'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Macabebe', 'Magalang', 'Masantol', 'Mexico', 'Porac', 'Sasmuan', 'Santa Ana', 'Santa Rita', 'Santo Tomas', 'Minalin'],
  'PAM_ALT': ['San Fernando', 'Angeles', 'Mabalacat', 'Apalit', 'Arayat', 'Bacolor', 'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Macabebe', 'Magalang', 'Masantol', 'Mexico', 'Porac', 'Sasmuan', 'Santa Ana', 'Santa Rita', 'Santo Tomas', 'Minalin'],

  'TARLAC': ['Tarlac City', 'Concepcion', 'Capas', 'Bamban', 'Camiling', 'Gerona', 'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos', 'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Victoria', 'Anao'],
  'TAR_ALT': ['Tarlac City', 'Concepcion', 'Capas', 'Bamban', 'Camiling', 'Gerona', 'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos', 'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Victoria', 'Anao'],

  'ZAMBALES': ['Olongapo', 'Subic', 'Castillejos', 'San Marcelino', 'San Antonio', 'San Felipe', 'San Narciso', 'Botolan', 'Cabangan', 'Candelaria', 'Iba', 'Masinloc', 'Palauig', 'Santa Cruz'],
  'ZMB': ['Olongapo', 'Subic', 'Castillejos', 'San Marcelino', 'San Antonio', 'San Felipe', 'San Narciso', 'Botolan', 'Cabangan', 'Candelaria', 'Iba', 'Masinloc', 'Palauig', 'Santa Cruz'],

  // Visayas Alternative Codes
  'CEBU': ['Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City', 'Toledo City', 'Danao City', 'Carcar City', 'Naga City', 'Bogo City', 'Minglanilla', 'Consolacion', 'Liloan', 'Compostela', 'Cordova', 'Bantayan', 'Madridejos', 'Santa Fe', 'Daanbantayan', 'Medellin', 'Badian', 'Moalboal', 'Alcantara', 'Ronda', 'Dumanjug', 'Barili', 'Aloguinsan', 'Pinamungajan', 'Tabogon', 'Sogod', 'Catmon', 'Carmen', 'San Fernando', 'Sibonga', 'Argao', 'Dalaguete', 'Alcoy', 'Boljoon', 'Oslob', 'Santander', 'Samboan', 'Ginatilan', 'Malabuyoc', 'Alegria', 'Tuburan', 'Asturias', 'Balamban'],
  'CEB_ALT': ['Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City', 'Toledo City', 'Danao City', 'Carcar City', 'Naga City', 'Bogo City', 'Minglanilla', 'Consolacion', 'Liloan', 'Compostela', 'Cordova', 'Bantayan', 'Madridejos', 'Santa Fe', 'Daanbantayan', 'Medellin', 'Badian', 'Moalboal', 'Alcantara', 'Ronda', 'Dumanjug', 'Barili', 'Aloguinsan', 'Pinamungajan', 'Tabogon', 'Sogod', 'Catmon', 'Carmen', 'San Fernando', 'Sibonga', 'Argao', 'Dalaguete', 'Alcoy', 'Boljoon', 'Oslob', 'Santander', 'Samboan', 'Ginatilan', 'Malabuyoc', 'Alegria', 'Tuburan', 'Asturias', 'Balamban'],

  'BOHOL': ['Tagbilaran', 'Tubigon', 'Calape', 'Loon', 'Maribojoc', 'Antequera', 'Baclayon', 'Alburquerque', 'Loboc', 'Sikatuna', 'Carmen', 'Garcia Hernandez', 'Valencia', 'Dimiao', 'Lila', 'Loay', 'Panglao', 'Dauis', 'Cortes', 'Corella', 'Balilihan', 'Catigbian', 'Batuan', 'Sevilla', 'Bilar', 'Sagbayan', 'Sierra Bullones', 'Pilar', 'Dagohoy', 'Danao', 'Trinidad', 'Talibon', 'Bien Unido', 'Ubay', 'San Miguel', 'San Isidro', 'Alicia', 'Mabini', 'Candijay', 'Anda', 'Guindulman', 'Duero', 'Jagna', 'Clarin', 'Inabanga', 'Buenavista', 'Getafe', 'President Carlos P. Garcia'],
  'BOH_ALT': ['Tagbilaran', 'Tubigon', 'Calape', 'Loon', 'Maribojoc', 'Antequera', 'Baclayon', 'Alburquerque', 'Loboc', 'Sikatuna', 'Carmen', 'Garcia Hernandez', 'Valencia', 'Dimiao', 'Lila', 'Loay', 'Panglao', 'Dauis', 'Cortes', 'Corella', 'Balilihan', 'Catigbian', 'Batuan', 'Sevilla', 'Bilar', 'Sagbayan', 'Sierra Bullones', 'Pilar', 'Dagohoy', 'Danao', 'Trinidad', 'Talibon', 'Bien Unido', 'Ubay', 'San Miguel', 'San Isidro', 'Alicia', 'Mabini', 'Candijay', 'Anda', 'Guindulman', 'Duero', 'Jagna', 'Clarin', 'Inabanga', 'Buenavista', 'Getafe', 'President Carlos P. Garcia'],

  'ILOILO': ['Iloilo City', 'Passi', 'Ajuy', 'Alimodian', 'Anilao', 'Badiangan', 'Balasan', 'Banate', 'Barotac Nuevo', 'Barotac Viejo', 'Batad', 'Bingawan', 'Bocari', 'Bugasong', 'Cabatuan', 'Calinog', 'Carles', 'Concepcion', 'Dingle', 'Duenas', 'Dumangas', 'Estancia', 'Guimbal', 'Igbaras', 'Janiuay', 'Lambunao', 'Leganes', 'Lemery', 'Leon', 'Maasin', 'Miagao', 'Mina', 'New Lucena', 'Oton', 'Pavia', 'Pototan', 'San Dionisio', 'San Enrique', 'San Joaquin', 'San Miguel', 'San Rafael', 'Santa Barbara', 'Sara', 'Tigbauan', 'Tubungan', 'Zarraga'],
  'ILO_ALT': ['Iloilo City', 'Passi', 'Ajuy', 'Alimodian', 'Anilao', 'Badiangan', 'Balasan', 'Banate', 'Barotac Nuevo', 'Barotac Viejo', 'Batad', 'Bingawan', 'Bocari', 'Bugasong', 'Cabatuan', 'Calinog', 'Carles', 'Concepcion', 'Dingle', 'Duenas', 'Dumangas', 'Estancia', 'Guimbal', 'Igbaras', 'Janiuay', 'Lambunao', 'Leganes', 'Lemery', 'Leon', 'Maasin', 'Miagao', 'Mina', 'New Lucena', 'Oton', 'Pavia', 'Pototan', 'San Dionisio', 'San Enrique', 'San Joaquin', 'San Miguel', 'San Rafael', 'Santa Barbara', 'Sara', 'Tigbauan', 'Tubungan', 'Zarraga'],

  // Mindanao Alternative Codes  
  'DAVAO': ['Davao City', 'Digos', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay', 'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'],
  'DAV_ALT': ['Davao City', 'Digos', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay', 'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'],

  'PALAWAN': ['Puerto Princesa', 'Aborlan', 'Agutaya', 'Araceli', 'Balabac', 'Bataraza', 'Brooke\'s Point', 'Busuanga', 'Cagayancillo', 'Coron', 'Culion', 'Cuyo', 'Dumaran', 'El Nido', 'Linapacan', 'Magsaysay', 'Narra', 'Quezon', 'Rizal', 'Roxas', 'San Vicente', 'Sofronio Española', 'Taytay', 'Kalayaan'],
  'PLW': ['Puerto Princesa', 'Aborlan', 'Agutaya', 'Araceli', 'Balabac', 'Bataraza', 'Brooke\'s Point', 'Busuanga', 'Cagayancillo', 'Coron', 'Culion', 'Cuyo', 'Dumaran', 'El Nido', 'Linapacan', 'Magsaysay', 'Narra', 'Quezon', 'Rizal', 'Roxas', 'San Vicente', 'Sofronio Española', 'Taytay', 'Kalayaan']
} as Record<string, string[]>;

// Major cities for other countries
const OTHER_COUNTRIES_CITIES: Record<string, Record<string, string[]>> = {
  'US': {
    'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland', 'Fresno', 'Long Beach', 'Anaheim'],
    'NY': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon'],
    'TX': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'],
    'FL': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale'],
    'IL': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin'],
    'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster'],
    'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton'],
    'GA': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Macon'],
    'NC': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington'],
    'MI': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor', 'Flint', 'Dearborn'],
    'WA': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton'],
    'AZ': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe'],
    'MA': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'New Bedford', 'Brockton', 'Quincy'],
    'TN': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Jackson', 'Johnson City'],
    'IN': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers', 'Bloomington', 'Hammond']
  },
  'CA': {
    'ON': ['Toronto', 'Ottawa', 'Hamilton', 'London', 'Kitchener', 'Windsor', 'Mississauga', 'Brampton'],
    'QC': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Levis'],
    'BC': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Kelowna', 'Saanich'],
    'AB': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie'],
    'MB': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler', 'Selkirk', 'Morden'],
    'SK': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton', 'North Battleford', 'Estevan'],
    'NB': ['Saint John', 'Moncton', 'Fredericton', 'Dieppe', 'Riverview', 'Edmundston', 'Miramichi', 'Bathurst'],
    'NS': ['Halifax', 'Cape Breton', 'Kings', 'Truro', 'New Glasgow', 'Glace Bay', 'Sydney', 'Kentville'],
    'PE': ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Montague', 'Kensington', 'Souris', 'Alberton'],
    'NL': ['St. John\'s', 'Mount Pearl', 'Corner Brook', 'Conception Bay South', 'Paradise', 'Grand Falls-Windsor']
  },
  'CN': {
    'BJ': ['Beijing', 'Chaoyang', 'Haidian', 'Fengtai', 'Shijingshan', 'Dongcheng', 'Xicheng', 'Fangshan'],
    'SH': ['Shanghai', 'Pudong', 'Huangpu', 'Xuhui', 'Changning', 'Jing\'an', 'Putuo', 'Hongkou'],
    'GD': ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan', 'Zhuhai', 'Jiangmen', 'Huizhou'],
    'JS': ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou', 'Xuzhou', 'Nantong', 'Lianyungang', 'Huai\'an'],
    'ZJ': ['Hangzhou', 'Ningbo', 'Wenzhou', 'Jiaxing', 'Huzhou', 'Shaoxing', 'Jinhua', 'Quzhou']
  },
  'GB': {
    'ENG': ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle'],
    'SCT': ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Paisley'],
    'WLS': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Neath', 'Bridgend'],
    'NIR': ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon', 'Castlereagh', 'Ballymena']
  },
  'AU': {
    'NSW': ['Sydney', 'Newcastle', 'Wollongong', 'Maitland', 'Wagga Wagga', 'Albury', 'Port Macquarie', 'Tamworth'],
    'VIC': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Frankston', 'Latrobe', 'Shepparton', 'Warrnambool'],
    'QLD': ['Brisbane', 'Gold Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Mackay', 'Rockhampton', 'Bundaberg'],
    'WA': ['Perth', 'Fremantle', 'Rockingham', 'Mandurah', 'Bunbury', 'Kalgoorlie', 'Geraldton', 'Albany'],
    'SA': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Lincoln', 'Port Pirie', 'Victor Harbor', 'Gawler'],
    'TAS': ['Hobart', 'Launceston', 'Devonport', 'Burnie', 'Ulverstone', 'Kingston', 'Glenorchy', 'Clarence']
  },
  'DE': {
    'BY': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth', 'Erlangen'],
    'NW': ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld'],
    'BW': ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg', 'Ulm', 'Heilbronn', 'Pforzheim'],
    'NI': ['Hanover', 'Braunschweig', 'Oldenburg', 'Osnabrück', 'Wolfsburg', 'Göttingen', 'Salzgitter', 'Hildesheim']
  },
  'FR': {
    'IDF': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Versailles', 'Montreuil', 'Créteil', 'Nanterre'],
    'PAC': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Antibes', 'Cannes', 'Avignon', 'Grasse'],
    'ARA': ['Lyon', 'Saint-Étienne', 'Grenoble', 'Villeurbanne', 'Clermont-Ferrand', 'Valence', 'Chambéry', 'Annecy'],
    'OCC': ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Narbonne', 'Carcassonne', 'Alès']
  }
};

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
      console.log(`Using comprehensive database for PH-${stateCode}:`, cities.length, 'cities');
      return cities;
    }
    
    // Use other countries database
    if (OTHER_COUNTRIES_CITIES[countryCode]?.[stateCode]) {
      const cities = OTHER_COUNTRIES_CITIES[countryCode][stateCode];
      console.log(`Using database for ${countryCode}-${stateCode}:`, cities.length, 'cities');
      return cities;
    }
    
    console.log('No cities found for:', { countryCode, stateCode });
    return [];
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}