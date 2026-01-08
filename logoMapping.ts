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

    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League - TODO: Add when logos are ready
    // 🇪🇸 La Liga - TODO: Add when logos are ready
    // 🇩🇪 Bundesliga - TODO: Add when logos are ready
    // 🇮🇹 Serie A - TODO: Add when logos are ready
    // 🇫🇷 Ligue 1 - TODO: Add when logos are ready
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
