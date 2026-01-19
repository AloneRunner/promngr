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
};

// Team Logos - mapped by team name (as used in LEAGUE_PRESETS)
export const TEAM_LOGOS: Record<string, string> = {
    // 🇹🇷 Süper Lig
    'Galata Lions': '/assets/logos/teams/tr/galata-lions.jpg',
    'Istanbul Yellows': '/assets/logos/teams/tr/istanbul-yellows.jpg',
    'Besikta Eagles': '/assets/logos/teams/tr/besikta-eagles.jpg',
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
    'Izmir Göz': '/assets/logos/teams/tr/izmir-goz.jpg',
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
