// Logo Mapping - Centralized logo path constants for teams and leagues

// League Logos - mapped by league ID
export const LEAGUE_LOGOS: Record<string, string> = {
    'tr': '/assets/logos/leagues/tr.jpg',
    'en': '/assets/logos/leagues/en.jpg',
    'es': '/assets/logos/leagues/es.jpg',
    'de': '/assets/logos/leagues/de.jpg',
    'it': '/assets/logos/leagues/it.jpg',
    'fr': '/assets/logos/leagues/fr.jpg',
    'ucl': '/assets/logos/leagues/ucl.jpg',
    'ar': '/assets/logos/leagues/liga-profesional.jpg',
    'br': '/assets/logos/leagues/serie-a.png',
    'in': '/assets/logos/leagues/india_logo.jpg',
    'cr': '/assets/logos/leagues/costarica_logo.jpg',
    'tn': '/assets/logos/leagues/tunisia_logo.jpg',
};

// Team Logos - mapped by team name (as used in LEAGUE_PRESETS)
export const TEAM_LOGOS: Record<string, string> = {
    // 🇹🇷 Süper Lig
    'Galata Lions': '/assets/logos/teams/tr/galata-lions.jpg',
    'Istanbul Yellows': '/assets/logos/teams/tr/istanbul-yellows.jpg',
    'Istanbul Eagles': '/assets/logos/teams/tr/besikta-eagles.jpg',
    'Trabzon Storm': '/assets/logos/teams/tr/trabzon-storm.jpg',
    'Basak City': '/assets/logos/teams/tr/basak-city.jpg',
    'Samsun Red': '/assets/logos/teams/tr/samsun-red.jpg',
    'Konya Green': '/assets/logos/teams/tr/konya-green.jpg',
    'Kasimpasa Navy': '/assets/logos/teams/tr/kasimpasa-navy.jpg',
    'Rize Tea': '/assets/logos/teams/tr/rize-tea.jpg',
    'Antep Falcons': '/assets/logos/teams/tr/antep-falcons.jpg',
    'Antalya Scorpions': '/assets/logos/teams/tr/antalya-scorpions.jpg',
    'Kayseri Stars': '/assets/logos/teams/tr/kayseri-stars.jpg',
    'Alanya Sun': '/assets/logos/teams/tr/alanya-sun.jpg',
    'Izmir Goz': '/assets/logos/teams/tr/izmir-goz.jpg',
    'Eyup Violet': '/assets/logos/teams/tr/eyup-violet.jpg',
    'Karagumruk Black': '/assets/logos/teams/tr/karagumruk-black.jpg',
    'Kocaeli Gulf': '/assets/logos/teams/tr/kocaeli-gulf.jpg',
    'Ankara Youth': '/assets/logos/teams/tr/ankara-youth.jpg',

    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League
    'Manchester Devils': '/assets/logos/teams/en/manchester-devils.jpg',
    'Manchester Skyblues': '/assets/logos/teams/en/manchester-skyblues.jpg',
    'Merseyside Reds': '/assets/logos/teams/en/merseyside-reds.jpg',
    'Merseyside Blues': '/assets/logos/teams/en/merseyside-blues.jpg',
    'London Blue Lions': '/assets/logos/teams/en/london-blue-lions.jpg',
    'London Cannons': '/assets/logos/teams/en/london-cannons.jpg',
    'Brighton Seagulls': '/assets/logos/teams/en/brighton-seagulls.jpg',
    'North London Whites': '/assets/logos/teams/en/north-london-whites.jpg',
    'Tyneside Magpies': '/assets/logos/teams/en/tyneside-magpies.jpg',
    'Birmingham Villans': '/assets/logos/teams/en/birmingham-villans.jpg',
    'East London Hammers': '/assets/logos/teams/en/east-london-hammers.jpg',
    'West Midlands Wolves': '/assets/logos/teams/en/west-midlands-wolves.jpg',
    'West London Whites': '/assets/logos/teams/en/west-london-whites.jpg',
    'Crystal Glaziers': '/assets/logos/teams/en/crystal-glaziers.jpg',
    'West London Bees': '/assets/logos/teams/en/west-london-bees.jpg',
    'Forest Archers': '/assets/logos/teams/en/forest-archers.jpg',
    'South Coast Cherries': '/assets/logos/teams/en/south-coast-cherries.jpg',
    'Wearside Black Cats': '/assets/logos/teams/en/wearside-black-cats.jpg',
    'Yorkshire Whites': '/assets/logos/teams/en/yorkshire-whites.jpg',
    'Lancashire Clarets': '/assets/logos/teams/en/lancashire-clarets.jpg',
    // 🇪🇸 La Liga
    'Madrid Blancos': '/assets/logos/teams/es/madrid-blancos.jpg',
    'Catalonia Blau': '/assets/logos/teams/es/catalonia-blau.jpg',
    'Madrid Indios': '/assets/logos/teams/es/madrid-indios.jpg',
    'Nervion Red-Whites': '/assets/logos/teams/es/nervion-red-whites.jpg',
    'Valencia Bats': '/assets/logos/teams/es/valencia-bats.jpg',
    'Mallorca Islanders': '/assets/logos/teams/es/mallorca-islanders.jpg',
    'Girona Reds': '/assets/logos/teams/es/girona-reds.jpg',
    'Vallecano Lightning': '/assets/logos/teams/es/vallecano-lightning.jpg',
    'Vitoria Foxes': '/assets/logos/teams/es/vitoria-foxes.jpg',
    'San Sebastian Blue': '/assets/logos/teams/es/san-sebastian-blue.jpg',
    'Bilbao Lions': '/assets/logos/teams/es/bilbao-lions.jpg',
    'Seville GreenWhites': '/assets/logos/teams/es/seville-greenwhites.jpg',
    'Yellow Submarines': '/assets/logos/teams/es/yellow-submarines.jpg',
    'Vigo Sky Blues': '/assets/logos/teams/es/vigo-sky-blues.jpg',
    'Pamplona Bulls': '/assets/logos/teams/es/pamplona-bulls.jpg',
    'South Madrid Blues': '/assets/logos/teams/es/south-madrid-blues.jpg',
    'Espanyol Parrots': '/assets/logos/teams/es/espanyol-parrots.jpg',
    'Challengers United': '/assets/logos/teams/es/challengers-united.jpg',
    'Canary Yellows': '/assets/logos/teams/es/canary-yellows.jpg',
    'Castilla Violet': '/assets/logos/teams/es/castilla-violet.jpg',
    // 🇩🇪 Bundesliga - TODO: Add when logos are ready
    'Inter Lombardia': '/assets/logos/teams/it/inter-lombardia.jpg',
    'Milano Devils': '/assets/logos/teams/it/milano-devils.jpg',
    'Piemonte Zebras': '/assets/logos/teams/it/piemonte-zebras.jpg',
    'Napoli Blues': '/assets/logos/teams/it/napoli-blues.jpg',
    'Roma Gladiators': '/assets/logos/teams/it/roma-gladiators.jpg',
    'Latium Eagles': '/assets/logos/teams/it/latium-eagles.jpg',
    'Bergamo United': '/assets/logos/teams/it/bergamo-united.jpg',
    'Florence Viola': '/assets/logos/teams/it/florence-viola.jpg',
    'Bologna Redblues': '/assets/logos/teams/it/bologna-redblues.jpg',
    'Torino Bulls': '/assets/logos/teams/it/torino-bulls.jpg',
    'Sassuolo Greenblacks': '/assets/logos/teams/it/sassuolo-greenblacks.jpg',
    'Udine Friuli': '/assets/logos/teams/it/udine-friuli.jpg',
    'Genoa Griffins': '/assets/logos/teams/it/genoa-griffins.jpg',
    'Lecce Wolves': '/assets/logos/teams/it/lecce-wolves.jpg',
    'Verona Mastiffs': '/assets/logos/teams/it/verona-mastiffs.jpg',
    'Parma Crusaders': '/assets/logos/teams/it/parma-crusaders.png',
    'Cagliari Islanders': '/assets/logos/teams/it/cagliari-islanders.jpg',
    'Monza Speed': '/assets/logos/teams/it/monza-speed.jpg',
    'Venice Gondoliers': '/assets/logos/teams/it/venice-gondoliers.jpg',
    'Como Lakers': '/assets/logos/teams/it/como-lakers.jpg',
    'Paris Red-Blue': '/assets/logos/teams/fr/paris-red-blue.jpg',
    'Marseille Blue': '/assets/logos/teams/fr/marseille-blue.jpg',
    'Lyon Kids': '/assets/logos/teams/fr/lyon-kids.jpg',
    'Principality Red': '/assets/logos/teams/fr/principality-red.jpg',
    'Lille Dogs': '/assets/logos/teams/fr/lille-dogs.jpg',
    'Brittany Red': '/assets/logos/teams/fr/brittany-red.jpg',
    'Riviera Eagles': '/assets/logos/teams/fr/riviera-eagles.jpg',
    'Lens Gold': '/assets/logos/teams/fr/lens-gold.jpg',
    'Paris Blue': '/assets/logos/teams/fr/paris-blue.jpg',
    'Nantes Yellows': '/assets/logos/teams/fr/nantes-yellows.jpg',
    'Alsace Blue': '/assets/logos/teams/fr/alsace-blue.jpg',
    'AJ Burgundy': '/assets/logos/teams/fr/aj-burgundy.jpg',
    'Toulouse Violets': '/assets/logos/teams/fr/toulouse-violets.jpg',
    'Reims Royals': '/assets/logos/teams/fr/reims-royals.jpg',
    'Montpellier Orange': '/assets/logos/teams/fr/montpellier-orange.jpg',
    'Brest Pirates': '/assets/logos/teams/fr/brest-pirates.jpg',
    'Saint-Green': '/assets/logos/teams/fr/saint-green.jpg',
    'Angers Black-Whites': '/assets/logos/teams/fr/angers-black-whites.jpg',
    // 🇩🇪 Bundesliga
    'Munich Red': '/assets/logos/teams/de/munich-red.jpg',
    'Westphalia Yellows': '/assets/logos/teams/de/westphalia-yellows.jpg',
    'Leverkusen Red': '/assets/logos/teams/de/leverkusen-red.jpg',
    'Leipzig Bulls': '/assets/logos/teams/de/leipzig-bulls.jpg',
    'Stuttgart White-Reds': '/assets/logos/teams/de/stuttgart-white-reds.jpg',
    'Wolfsburg Green': '/assets/logos/teams/de/wolfsburg-green.jpg',
    'Freiburg Forest': '/assets/logos/teams/de/freiburg-forest.png',
    'Hoffen Blue': '/assets/logos/teams/de/hoffen-blue.jpg',
    'Berlin Iron': '/assets/logos/teams/de/berlin-iron.png',
    'Augsburg Falcons': '/assets/logos/teams/de/augsburg-falcons.jpg',
    'Cathedral City': '/assets/logos/teams/de/cathedral-city.jpg',
    'Frankfurt Eagles': '/assets/logos/teams/de/frankfurt-eagles.jpg',
    'Gladbach Foals': '/assets/logos/teams/de/gladbach-foals.jpg',
    'Bremen River': '/assets/logos/teams/de/bremen-river.jpg',
    'Mainz Carnival': '/assets/logos/teams/de/mainz-carnival.jpg',
    'Hamburg Pirates': '/assets/logos/teams/de/hamburg-pirates.jpg',
    'Heidenheim Red-Blue': '/assets/logos/teams/de/heidenheim-red-blue.jpg',
    'Bochum Blue': '/assets/logos/teams/de/bochum-blue.jpg',
    // 🇦🇷 Argentina (Liga Profesional)
    'Buenos Aires Millionaires': '/assets/logos/teams/ar/buenos-aires-millionaires.jpg',
    'La Boca Xeneizes': '/assets/logos/teams/ar/la-boca-xeneizes.jpg',
    'Avellaneda Racers': '/assets/logos/teams/ar/avellaneda-racers.jpg',
    'Avellaneda Devils': '/assets/logos/teams/ar/avellaneda-devils.jpg',
    'Boedo Saints': '/assets/logos/teams/ar/boedo-saints.jpg',
    'La Plata Lions': '/assets/logos/teams/ar/la-plata-lions.jpg',
    'Velez Fort': '/assets/logos/teams/ar/velez-fort.jpg',
    'Rosario Canallas': '/assets/logos/teams/ar/rosario-canallas.jpg',
    'Rosario Lepers': '/assets/logos/teams/ar/rosario-lepers.jpg',
    'Cordoba Tall': '/assets/logos/teams/ar/cordoba-tall.jpg',
    'Paternal Bugs': '/assets/logos/teams/ar/paternal-bugs.jpg',
    'Lanus Granate': '/assets/logos/teams/ar/lanus-granate.jpg',
    'Buenos Aires Storm': '/assets/logos/teams/ar/buenos-aires-storm.jpg',
    'Varela Hawks': '/assets/logos/teams/ar/varela-hawks.jpg',
    'La Plata Wolves': '/assets/logos/teams/ar/la-plata-wolves.jpg',
    'Banfield Drills': '/assets/logos/teams/ar/banfield-drills.jpg',
    'Cordoba Pirates': '/assets/logos/teams/ar/cordoba-pirates.jpg',
    'Santa Fe Union': '/assets/logos/teams/ar/santa-fe-union.jpg',
    'Mendoza Wines': '/assets/logos/teams/ar/mendoza-wines.jpg',
    'Barracas Truckers': '/assets/logos/teams/ar/barracas-truckers.jpg',
    'Junin Warriors': '/assets/logos/teams/ar/junin-warriors.jpg',
    'Mar del Plata Sharks': '/assets/logos/teams/ar/mar-del-plata-sharks.jpg',
    'Mendoza Blues': '/assets/logos/teams/ar/mendoza-blues.jpg',
    'Riestra Energizers': '/assets/logos/teams/ar/riestra-energizers.jpg',
    'Saavedra Squids': '/assets/logos/teams/ar/saavedra-squids.jpg',
    'Santiago Railways': '/assets/logos/teams/ar/santiago-railways.jpg',
    'Tucuman Giants': '/assets/logos/teams/ar/tucuman-giants.jpg',
    'Citadel Saints': '/assets/logos/teams/ar/citadel-saints.jpg',
    'Cordoba Glory': '/assets/logos/teams/ar/cordoba-glory.jpg',
    'Victoria Tigers': '/assets/logos/teams/ar/victoria-tigers.jpg',

    // 🇹🇳 Tunisia (Ligue 1 Pro)
    'Zarzis Olive': '/assets/logos/teams/tn/zarzis-olive.jpg',
    'Sfax Zebra': '/assets/logos/teams/tn/sfax-zebra.jpg',
    'Tunis Gold': '/assets/logos/teams/tn/tunis-gold.jpg',
    'Bardo Green': '/assets/logos/teams/tn/bardo-green.jpg',
    'Kairouan Historic': '/assets/logos/teams/tn/kairouan-historic.jpg',
    'Gabes Oasis': '/assets/logos/teams/tn/gabes-oasis.jpg',
    'Sousse Stars': '/assets/logos/teams/tn/sousse-stars.jpg',
    'Soliman Future': '/assets/logos/teams/tn/soliman-future.jpg',
    'Omrane Build': '/assets/logos/teams/tn/omrane-build.jpg',
    'Beja Storks': '/assets/logos/teams/tn/beja-storks.jpg',
    'Marsa Beach': '/assets/logos/teams/tn/marsa-beach.jpg',
    'Metlaoui Mines': '/assets/logos/teams/tn/metlaoui-mines.jpg',
    'Ben Guerdane Riders': '/assets/logos/teams/tn/ben-guerdane-riders.jpg',
    'Tunis Red-Whites': '/assets/logos/teams/tn/tunis-red-whites.jpg',
    'Bizerte Sharks': '/assets/logos/teams/tn/bizerte-sharks.jpg',
    'Monastir Blue': '/assets/logos/teams/tn/monastir-blue.jpg',

    // 🇨🇷 Costa Rica (Primera División)
    'San Jose Purple': '/assets/logos/teams/cr/san-jose-purple.jpg',
    'Alajuela Lions': '/assets/logos/teams/cr/alajuela-lions.jpg',
    'Heredia Red-Yellow': '/assets/logos/teams/cr/heredia-red-yellow.jpg',
    'Cartago Blues': '/assets/logos/teams/cr/cartago-blues.jpg',
    'San Isidro Warriors': '/assets/logos/teams/cr/san-isidro-warriors.jpg',
    'San Carlos Bulls': '/assets/logos/teams/cr/san-carlos-bulls.jpg',
    'Puntarenas Sharks': '/assets/logos/teams/cr/puntarenas-sharks.jpg',
    'Guadalupe Blue': '/assets/logos/teams/cr/guadalupe-blue.jpg',
    'Sporting Jose': '/assets/logos/teams/cr/sporting-jose.jpg',

    // 🇮🇳 India (Indian Super League)
    'Varanasi Holy': '/assets/logos/teams/in/varanasi-holy.jpg',
    'Goa Gaurs': '/assets/logos/teams/in/goa-gaurs.jpg',
    'Odisha Juggernauts': '/assets/logos/teams/in/odisha-juggernauts.jpg',
    'Kolkata Mariners': '/assets/logos/teams/in/kolkata-mariners.jpg',
    'Delhi Capital': '/assets/logos/teams/in/delhi-capital.jpg',
    'Bangalore Blues': '/assets/logos/teams/in/bangalore-blues.jpg',
    'East Bengal Torch': '/assets/logos/teams/in/east-bengal-torch.jpg',
    'Highland United': '/assets/logos/teams/in/highland-united.jpg',
    'Steel City Red': '/assets/logos/teams/in/steel-city-red.jpg',
    'Chennai Titans': '/assets/logos/teams/in/chennai-titans.jpg',
    'Kolkata Black-White': '/assets/logos/teams/in/kolkata-black-white.jpg',
    'Kerala Tuskers': '/assets/logos/teams/in/kerala-tuskers.jpg',
    'Mumbai Islanders': '/assets/logos/teams/in/mumbai-islanders.jpg',
    'Punjab Lions': '/assets/logos/teams/in/punjab-lions.jpg',

    // 🇺🇾 Uruguay (Campeonato Uruguayo)
    'Montevideo Tricolor': '/assets/logos/teams/uy/montevideo-tricolor.jpg',
    'Montevideo Coal': '/assets/logos/teams/uy/montevideo-coal.jpg',
    'Belvedere Blue': '/assets/logos/teams/uy/belvedere-blue.jpg',
    'Parque Violet': '/assets/logos/teams/uy/parque-violet.jpg',

    // 🇨🇱 Chile (Campeonato Nacional)
    'Santiago Chiefs': '/assets/logos/teams/cl/santiago-chiefs.jpg',
    'Santiago Scholars': '/assets/logos/teams/cl/santiago-scholars.jpg',
    'Santiago Crusaders': '/assets/logos/teams/cl/santiago-crusaders.jpg',
    'Desert Miners': '/assets/logos/teams/cl/desert-miners.jpg',

    // --- Brazil Série A ---
    'São Paulo Palms': '/assets/logos/teams/br/sao-paulo-palms.jpg',
    'Rio Flames': '/assets/logos/teams/br/rio-flames.jpg',
    'Belo Horizonte Cruisers': '/assets/logos/teams/br/belo-horizonte-cruisers.jpg',
    'Rio Sailors': '/assets/logos/teams/br/rio-sailors.jpg',
    'Salvador Bay': '/assets/logos/teams/br/salvador-bay.jpg',
    'Rio Star': '/assets/logos/teams/br/rio-star.jpg',
    'São Paulo Warriors': '/assets/logos/teams/br/sao-paulo-warriors.jpg',
    'Santos Beach': '/assets/logos/teams/br/santos-beach.jpg',
    'Rio Waves': '/assets/logos/teams/br/rio-waves.jpg',
    'Porto Alegre Blues': '/assets/logos/teams/br/porto-alegre-blues.jpg',

    'Salvador Victory': '/assets/logos/teams/br/salvador-victory.jpg',
    'Curitiba Greens': '/assets/logos/teams/br/curitiba-greens.jpg',
    'Chapecó Eagles': '/assets/logos/teams/br/chapeco-eagles.jpg',
    'Mirassol Suns': '/assets/logos/teams/br/mirassol-suns.jpg',
    'Belém Lions': '/assets/logos/teams/br/belem-lions.jpg',
    'Belo Horizonte Miners': '/assets/logos/teams/br/belo-horizonte-miners.jpg',
    'São Paulo Tigers': '/assets/logos/teams/br/sao-paulo-tigers.jpg',
    'Bragança Bulls': '/assets/logos/teams/br/braganca-bulls.jpg',
    'Porto Alegre Reds': '/assets/logos/teams/br/porto-alegre-reds.jpg',
    'Curitiba Storm': '/assets/logos/teams/br/curitiba-storm.jpg',

    // 🇺🇸 North American League (USA)
    'Atlanta Stripes': '/assets/logos/teams/us/atlanta-stripes.jpg',
    'Toronto Reds': '/assets/logos/teams/us/toronto-reds.jpg',
    'Seattle Emeralds': '/assets/logos/teams/us/seattle-emeralds.jpg',
    'Galaxy Stars': '/assets/logos/teams/us/galaxy-stars.jpg',
    'New York Energy': '/assets/logos/teams/us/new-york-energy.jpg',
    'Los Angeles Gold': '/assets/logos/teams/us/los-angeles-gold.jpg',
    'Miami Vice': '/assets/logos/teams/us/miami-vice.jpg',

    // 🇦🇺 A-League Men (Australia)
    'Sydney FC': '/assets/logos/teams/au/sydney-fc.jpg',
    'Melbourne Victory': '/assets/logos/teams/au/melbourne-victory.jpg',
    'Melbourne City': '/assets/logos/teams/au/melbourne-city.jpg',
    'Central Coast Mariners': '/assets/logos/teams/au/central-coast-mariners.jpg',
    'Western Sydney': '/assets/logos/teams/au/western-sydney.jpg',
    'Brisbane Roar': '/assets/logos/teams/au/brisbane-roar.jpg',

    // 🇲🇦 Botola Pro (Morocco)
    'Casablanca Reds': '/assets/logos/teams/ma/casablanca-reds.jpg',
    'AS FAR': '/assets/logos/teams/ma/as-far.jpg',
    'Casablanca Eagles': '/assets/logos/teams/ma/casablanca-eagles.jpg',

    // 🇯🇲 Caribbean Super League
    'Trinbago Riders FC': '/assets/logos/teams/cb/trinbago-riders-fc.jpg',
    'Cibao Orange FC': '/assets/logos/teams/cb/cibao-orange-fc.jpg',
    'Kingston Bay United': '/assets/logos/teams/cb/kingston-bay-united.jpg',

    // 🇿🇦 Premier Soccer League (South Africa)
    'Soweto Chiefs': '/assets/logos/teams/za/soweto-chiefs.jpg',
    'Pretoria Brazilians': '/assets/logos/teams/za/pretoria-brazilians.jpg',
    'Soweto Pirates': '/assets/logos/teams/za/soweto-pirates.jpg',
    'Cape Town City': '/assets/logos/teams/za/cape-town-city.jpg',

    // 🇰🇷 K League 1 (South Korea)
    'Ulsan Tigers': '/assets/logos/teams/kr/ulsan-tigers.jpg',
    'Jeonju Motors': '/assets/logos/teams/kr/jeonju-motors.jpg',
    'Seoul City': '/assets/logos/teams/kr/seoul-city.jpg',

    // 🇯🇵 J1 League (Japan)
    'Kawasaki Frontale': '/assets/logos/teams/jp/kawasaki-frontale.jpg',
    'Vissel Kobe': '/assets/logos/teams/jp/vissel-kobe.jpg',
    'Kashima Antlers': '/assets/logos/teams/jp/kashima-antlers.jpg',
    'Yokohama F. Marinos': '/assets/logos/teams/jp/yokohama-f-marinos.jpg',
    'Gamba Osaka': '/assets/logos/teams/jp/gamba-osaka.jpg',

    // 🇨🇴 Liga BetPlay (Colombia)
    'Medellin Green': '/assets/logos/teams/co/medellin-green.jpg',
    'Barranquilla Sharks': '/assets/logos/teams/co/barranquilla-sharks.jpg',
    'Bogota Cardinals': '/assets/logos/teams/co/bogota-cardinals.jpg',
    'Bogota Blues': '/assets/logos/teams/co/bogota-blues.jpg',
    'Cali Devils': '/assets/logos/teams/co/cali-devils.jpg',

    // 🇪🇬 Egyptian Premier League (Egypt)
    'Cairo Red Devils': '/assets/logos/teams/eg/cairo-red-devils.jpg',
    'Cairo Knights': '/assets/logos/teams/eg/cairo-knights.jpg',
    'Pyramids FC': '/assets/logos/teams/eg/pyramids-fc.jpg',

    // 🇸🇦 Saudi Pro League (Saudi Arabia)
    'Riyadh Blue Waves': '/assets/logos/teams/sa/riyadh-blue-waves.jpg',
    'Jeddah Tigers': '/assets/logos/teams/sa/jeddah-tigers.jpg',
    'Jeddah Green': '/assets/logos/teams/sa/jeddah-green.jpg',
    'Riyadh Knights': '/assets/logos/teams/sa/riyadh-knights.jpg',
};

// Default fallback logo for teams without custom logos
const DEFAULT_TEAM_LOGO = '/assets/icon-shield-neon.jpg';
const DEFAULT_LEAGUE_LOGO = '/assets/icon-league.jpg';

/**
 * Get team logo path by team name
 */
export const getTeamLogo = (teamName: string): string => {
    return TEAM_LOGOS[teamName] || DEFAULT_TEAM_LOGO;
};

/**
 * Get league logo path by league ID
 */
export const getLeagueLogo = (leagueId: string): string => {
    return LEAGUE_LOGOS[leagueId] || DEFAULT_LEAGUE_LOGO;
};

/**
 * Check if a team has a custom logo
 */
export const hasTeamLogo = (teamName: string): boolean => {
    return teamName in TEAM_LOGOS;
};
