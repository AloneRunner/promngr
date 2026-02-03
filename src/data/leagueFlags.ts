// League ID to Country Flag and Name mapping
export const LEAGUE_FLAGS: Record<string, { flag: string; name: string; code: string }> = {
    // Europe
    'en': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England', code: 'ENG' },
    'es': { flag: '🇪🇸', name: 'Spain', code: 'ESP' },
    'it': { flag: '🇮🇹', name: 'Italy', code: 'ITA' },
    'de': { flag: '🇩🇪', name: 'Germany', code: 'GER' },
    'fr': { flag: '🇫🇷', name: 'France', code: 'FRA' },
    'pt': { flag: '🇵🇹', name: 'Portugal', code: 'POR' },
    'nl': { flag: '🇳🇱', name: 'Netherlands', code: 'NED' },
    'be': { flag: '🇧🇪', name: 'Belgium', code: 'BEL' },
    'tr': { flag: '🇹🇷', name: 'Turkey', code: 'TUR' },
    'gr': { flag: '🇬🇷', name: 'Greece', code: 'GRE' },
    'ru': { flag: '🇷🇺', name: 'Russia', code: 'RUS' },
    'pl': { flag: '🇵🇱', name: 'Poland', code: 'POL' },
    'cz': { flag: '🇨🇿', name: 'Czech Rep.', code: 'CZE' },
    'ro': { flag: '🇷🇴', name: 'Romania', code: 'ROU' },
    'hr': { flag: '🇭🇷', name: 'Croatia', code: 'CRO' },
    'rs': { flag: '🇷🇸', name: 'Serbia', code: 'SRB' },
    'ch': { flag: '🇨🇭', name: 'Switzerland', code: 'SUI' },
    'at': { flag: '🇦🇹', name: 'Austria', code: 'AUT' },
    'sco': { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Scotland', code: 'SCO' },
    
    // Americas
    'br': { flag: '🇧🇷', name: 'Brazil', code: 'BRA' },
    'ar': { flag: '🇦🇷', name: 'Argentina', code: 'ARG' },
    'mx': { flag: '🇲🇽', name: 'Mexico', code: 'MEX' },
    'us': { flag: '🇺🇸', name: 'USA', code: 'USA' },
    'cl': { flag: '🇨🇱', name: 'Chile', code: 'CHI' },
    'uy': { flag: '🇺🇾', name: 'Uruguay', code: 'URU' },
    'co': { flag: '🇨🇴', name: 'Colombia', code: 'COL' },
    'py': { flag: '🇵🇾', name: 'Paraguay', code: 'PAR' },
    'ec': { flag: '🇪🇨', name: 'Ecuador', code: 'ECU' },
    'cr': { flag: '🇨🇷', name: 'Costa Rica', code: 'CRC' },
    'car': { flag: '🏴‍☠️', name: 'Caribbean', code: 'CAR' },
    
    // Asia
    'cn': { flag: '🇨🇳', name: 'China', code: 'CHN' },
    'jp': { flag: '🇯🇵', name: 'Japan', code: 'JPN' },
    'kr': { flag: '🇰🇷', name: 'South Korea', code: 'KOR' },
    'sa': { flag: '🇸🇦', name: 'Saudi Arabia', code: 'KSA' },
    'in': { flag: '🇮🇳', name: 'India', code: 'IND' },
    'my': { flag: '🇲🇾', name: 'Malaysia', code: 'MAS' },
    'id': { flag: '🇮🇩', name: 'Indonesia', code: 'IDN' },
    
    // Africa
    'eg': { flag: '🇪🇬', name: 'Egypt', code: 'EGY' },
    'ma': { flag: '🇲🇦', name: 'Morocco', code: 'MAR' },
    'za': { flag: '🇿🇦', name: 'South Africa', code: 'RSA' },
    'ng': { flag: '🇳🇬', name: 'Nigeria', code: 'NGA' },
    'dz': { flag: '🇩🇿', name: 'Algeria', code: 'ALG' },
    'gh': { flag: '🇬🇭', name: 'Ghana', code: 'GHA' },
    'ci': { flag: '🇨🇮', name: 'Ivory Coast', code: 'CIV' },
    'ke': { flag: '🇰🇪', name: 'Kenya', code: 'KEN' },
    'sn': { flag: '🇸🇳', name: 'Senegal', code: 'SEN' },
    'tn': { flag: '🇹🇳', name: 'Tunisia', code: 'TUN' },
    
    // Oceania
    'au': { flag: '🇦🇺', name: 'Australia', code: 'AUS' },
    
    // Default
    'default': { flag: '🌍', name: 'International', code: 'INT' }
};

// Helper function to get league flag
export const getLeagueFlag = (leagueId: string): string => {
    return LEAGUE_FLAGS[leagueId]?.flag || LEAGUE_FLAGS['default'].flag;
};

// Helper function to get league code
export const getLeagueCode = (leagueId: string): string => {
    return LEAGUE_FLAGS[leagueId]?.code || LEAGUE_FLAGS['default'].code;
};

// Helper function to get league name
export const getLeagueName = (leagueId: string): string => {
    return LEAGUE_FLAGS[leagueId]?.name || LEAGUE_FLAGS['default'].name;
};
