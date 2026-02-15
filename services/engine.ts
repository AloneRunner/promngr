
import {
    Match,
    Team,
    Player,
    MatchEvent,
    MatchEventType,
    Position,
    SimulationState,
    TacticType,
    GameState,
    PlayerAttributes,
    Sponsor,
    Message,
    MessageType,
    LeagueHistoryEntry,
    TeamTactic,
    LineupStatus,
    CoachArchetype,
    AssistantAdvice,
    BoardObjective,
    TeamStaff,
    TransferOffer,
    JobOffer,
    SuperCup,
    EuropeanCup,
    EuropeanCupMatch,
    GlobalCup,
    GlobalCupMatch,
    GlobalCupGroup,
    GlobalCupGroupTeam
} from '../types';

import { LEAGUE_PRESETS, DERBY_RIVALS } from '../src/data/teams';
import { REAL_PLAYERS, NAMES_DB } from '../src/data/players';
import { TICKET_PRICE, LEAGUE_TICKET_PRICES, LEAGUE_ATTENDANCE_RATES } from '../src/data/config';
import { TEAM_TACTICAL_PROFILES } from '../src/data/tactics';
import { MatchEngine, TICKS_PER_MINUTE, calculateEffectiveRating, calculateBaseOverall } from './MatchEngine';
import { AIService } from './AI';

// Economic Power Scaling relative to Turkish Super Lig (Base 1.0)
// These are BASE values - can increase with European success!
// Economic Power Scaling relative to Turkish Super Lig (Base 1.0)
// These are BASE values - can increase with European success!
const BASE_LEAGUE_ECON_MULTIPLIERS: Record<string, number> = {
    'tr': 1.0,
    'en': 3.5,  // Premier League
    'es': 2.5,  // La Liga
    'de': 2.2,  // Bundesliga
    'it': 2.0,  // Serie A
    'fr': 1.6,  // Ligue 1
    'pt': 1.5,  // Primeira Liga - Porto/Benfica prestige
    'nl': 1.8,  // Eredivisie - Ajax/PSV tradition
    'be': 1.4,  // Belgian Pro League
    'ch': 1.4,  // Swiss Super League
    'gr': 1.1,  // Greek Super League
    'pl': 1.3,  // Ekstraklasa (Poland)
    'cz': 1.2,  // Fortuna Liga (Czech)
    'ro': 1.1,  // Romania SuperLiga
    'hr': 1.2,  // Croatia HNL - Dinamo Zagreb strong
    'rs': 1.1,  // Serbia SuperLiga
    'ru': 1.3,  // Russian Premier - St. Petersburg/Moscow
    'sco': 1.2, // Scotland - Glasgow derbi
    'at': 1.2,  // Austria Bundesliga
    'ar': 1.2,  // Argentine Primera
    'br': 1.3,  // Brazilian Série A
    'us': 1.8,  // MLS (High wealth)
    'mx': 1.4,  // Liga MX
    'sa': 2.5,  // Saudi Pro League (oil money)
    'jp': 1.3,  // J-League
    'kr': 1.1,  // K-League
    'au': 1.1,  // A-League
    'ng': 0.8,  // Nigeria NPFL
    'id': 0.9,  // Indonesia Liga 1
    'eg': 0.9,  // Egypt
    'za': 0.8,  // South Africa
    'ma': 0.8,  // Morocco
    'tn': 0.7,  // Tunisia
    'co': 0.9,  // Colombia
    'cl': 0.8,  // Chile
    'uy': 0.8,  // Uruguay
    'cr': 0.6,  // Costa Rica
    'car': 0.5, // Caribbean
    'in': 0.6,  // India
    'py': 0.7,  // Paraguay
    'ec': 0.8,  // Ecuador
    'cn': 1.4,  // Chinese Super League
    'ke': 0.6,  // Kenya Premier League
    'sn': 0.6,  // Senegal Premier League
    'dz': 0.7,  // Ligue 1 Algeria
    'gh': 0.7,  // Ghana Premier League
    'ci': 0.7,  // Ivory Coast Premier
    'my': 0.7,  // Malaysia Liga Super
    'default': 1.0
};

// 5-Year League Coefficient History (Realistic Data 2024/25 Basis)
// Score represents the TOTAL Contribution (Sum) for game balance
// Format: [Y-4, Y-3, Y-2, Y-1, Current]
export let LEAGUE_COEFFICIENTS: Record<string, number[]> = {
    // ========== TIER 1: ELITE LEAGUES (5-Year avg: 55-75 pts/year) ==========
    'en': [68, 72, 65, 71, 64],    // 340.0 - England (4 CL + 4 EL teams, dominant)
    'es': [62, 58, 55, 60, 52],    // 287.0 - Spain (3 CL spots, Real/Barca/Atleti)
    'it': [55, 60, 58, 54, 48],    // 275.0 - Italy (4 CL, strong resurgence)
    'de': [52, 56, 50, 54, 48],    // 260.0 - Germany (4 CL, Bayern dominance)
    'fr': [45, 48, 42, 46, 40],    // 221.0 - France (3 CL, PSG carrying)

    // ========== TIER 2: STRONG LEAGUES (5-Year avg: 30-50 pts/year) ==========
    'pt': [38, 42, 35, 40, 32],    // 187.0 - Portugal (2 CL, Benfica/Porto)
    'nl': [35, 38, 32, 36, 30],    // 171.0 - Netherlands (1-2 CL, Ajax)
    'br': [42, 45, 40, 43, 38],    // 208.0 - Brazil (continental dominance)
    'ar': [35, 38, 32, 36, 30],    // 171.0 - Argentina (Libertadores regulars)
    'ru': [28, 32, 25, 30, 22],    // 137.0 - Russia (Zenit, sanctions effect)
    'be': [25, 28, 22, 26, 20],    // 121.0 - Belgium (Club Brugge, Anderlecht)
    'sco': [22, 26, 20, 24, 18],   // 110.0 - Scotland (Celtic/Rangers)
    'at': [20, 24, 18, 22, 16],    // 100.0 - Austria (Salzburg strong)
    'tr': [28, 32, 26, 30, 24],    // 140.0 - Turkey (Galatasaray, Fenerbahçe)
    'gr': [18, 22, 16, 20, 14],    // 90.0 - Greece (Olympiacos)
    'ch': [18, 22, 16, 20, 14],    // 90.0 - Switzerland (YB, Basel)
    'hr': [15, 18, 12, 16, 10],    // 71.0 - Croatia (Dinamo Zagreb)
    'cz': [14, 17, 12, 15, 10],    // 68.0 - Czech (Sparta/Slavia)
    'pl': [12, 15, 10, 13, 8],     // 58.0 - Poland (Legia)
    'ro': [10, 13, 8, 11, 6],      // 48.0 - Romania (FCSB/CFR)
    'rs': [12, 15, 10, 13, 8],     // 58.0 - Serbia (Red Star)

    // ========== TIER 3: REGIONAL POWERS (5-Year avg: 15-30 pts/year) ==========
    'mx': [22, 25, 20, 23, 18],    // 108.0 - Mexico (CONCACAF CL)
    'us': [18, 22, 16, 20, 14],    // 90.0 - USA (MLS growing)
    'cn': [15, 18, 12, 16, 10],    // 71.0 - China (ACL occasional)
    'jp': [18, 22, 16, 20, 14],    // 90.0 - Japan (ACL strong)
    'kr': [16, 20, 14, 18, 12],    // 80.0 - Korea (ACL presence)
    'sa': [20, 24, 18, 22, 16],    // 100.0 - Saudi (new investment + ACL)
    'au': [12, 15, 10, 13, 8],     // 58.0 - Australia (ACL spots)
    'eg': [18, 22, 16, 20, 14],    // 90.0 - Egypt (CAF CL - Al Ahly)
    'ma': [14, 17, 12, 15, 10],    // 68.0 - Morocco (CAF presence)
    'za': [12, 15, 10, 13, 8],     // 58.0 - South Africa (CAF CL)
    'ng': [10, 13, 8, 11, 6],      // 48.0 - Nigeria (local focus)
    'dz': [12, 15, 10, 13, 8],     // 58.0 - Algeria (CAF)
    'tn': [14, 17, 12, 15, 10],    // 68.0 - Tunisia (Esperance)

    // ========== TIER 4: DEVELOPING LEAGUES (5-Year avg: 8-18 pts/year) ==========
    'co': [14, 17, 12, 15, 10],    // 68.0 - Colombia (Libertadores)
    'cl': [12, 15, 10, 13, 8],     // 58.0 - Chile (U. Catolica, Colo-Colo)
    'uy': [10, 13, 8, 11, 6],      // 48.0 - Uruguay (Nacional, Peñarol)
    'ec': [10, 13, 8, 11, 6],      // 48.0 - Ecuador (LDU Quito)
    'py': [8, 11, 6, 9, 5],        // 39.0 - Paraguay (Olimpia)
    'cr': [8, 11, 6, 9, 5],        // 39.0 - Costa Rica (Saprissa)
    'car': [6, 9, 5, 7, 4],        // 31.0 - Caribbean (CONCACAF)
    'in': [6, 9, 5, 7, 4],         // 31.0 - India (ISL growing)
    'id': [8, 11, 6, 9, 5],        // 39.0 - Indonesia (local passion)
    'my': [6, 9, 5, 7, 4],         // 31.0 - Malaysia
    'gh': [8, 11, 6, 9, 5],        // 39.0 - Ghana (CAF)
    'sn': [8, 11, 6, 9, 5],        // 39.0 - Senegal (CAF)
    'ci': [8, 11, 6, 9, 5],        // 39.0 - Ivory Coast (CAF)
    'ke': [6, 9, 5, 7, 4],         // 31.0 - Kenya

    'default': [8, 10, 6, 9, 5]    // 38.0 - New leagues baseline
};

// Dynamic league multiplier storage (increases with European success)
// Format: { leagueId: bonusMultiplier } - starts at 0, can grow up to +1.0
export let LEAGUE_EUROPEAN_BONUS: Record<string, number> = {
    'tr': 0, 'en': 0, 'es': 0, 'de': 0, 'it': 0, 'fr': 0, 'ar': 0, 'br': 0,
    'us': 0, 'mx': 0, 'sa': 0, 'eg': 0, 'jp': 0, 'kr': 0, 'au': 0, 'za': 0,
    'ma': 0, 'car': 0, 'co': 0, 'cl': 0, 'uy': 0, 'tn': 0, 'cr': 0, 'in': 0,
    'ng': 0, 'id': 0, 'pt': 0, 'nl': 0, 'be': 0, 'ch': 0, 'gr': 0, 'pl': 0,
    'cz': 0, 'ro': 0, 'hr': 0, 'rs': 0, 'ru': 0, 'sco': 0, 'at': 0, 'py': 0,
    'ec': 0, 'dz': 0, 'gh': 0, 'ci': 0, 'ke': 0, 'sn': 0, 'my': 0, 'cn': 0
};

// Get current league multiplier (base + European bonus)
// Get current league multiplier (base + European bonus)
export const getLeagueMultiplier = (leagueId: string): number => {
    const base = BASE_LEAGUE_ECON_MULTIPLIERS[leagueId] || BASE_LEAGUE_ECON_MULTIPLIERS['default'];
    const bonus = LEAGUE_EUROPEAN_BONUS[leagueId] || 0;
    return base + bonus;
};

// Award European success bonus to league
export const awardEuropeanBonus = (leagueId: string, achievement: 'group_win' | 'knockout' | 'semifinal' | 'final' | 'winner') => {
    const bonusAmounts: Record<string, number> = {
        'group_win': 0.02,    // +0.02 for group stage win
        'knockout': 0.05,     // +0.05 for reaching knockouts
        'semifinal': 0.10,    // +0.10 for reaching semifinals
        'final': 0.15,        // +0.15 for reaching final
        'winner': 0.25        // +0.25 for winning!
    };
    const bonus = bonusAmounts[achievement] || 0;
    LEAGUE_EUROPEAN_BONUS[leagueId] = Math.min(1.0, (LEAGUE_EUROPEAN_BONUS[leagueId] || 0) + bonus);
};

// Get league bonus for display
export const getLeagueBonus = (leagueId: string): number => LEAGUE_EUROPEAN_BONUS[leagueId] || 0;

// Calculate coefficient-based multiplier for TV rights and ticket prices
// This allows leagues that improve in European competitions to earn more income
// Base reference: England (~340 points) = 1.0 multiplier, others scale proportionally
const BASE_COEFFICIENT_VALUES: Record<string, number> = {
    // TIER 1: Elite (based on new LEAGUE_COEFFICIENTS totals)
    'en': 340, 'es': 287, 'it': 275, 'de': 260, 'fr': 221,
    // TIER 2: Strong
    'pt': 187, 'nl': 171, 'br': 208, 'ar': 171, 'ru': 137, 'be': 121, 'sco': 110,
    'at': 100, 'tr': 140, 'gr': 90, 'ch': 90, 'hr': 71, 'cz': 68, 'pl': 58, 'ro': 48, 'rs': 58,
    // TIER 3: Regional Powers
    'mx': 108, 'us': 90, 'cn': 71, 'jp': 90, 'kr': 80, 'sa': 100, 'au': 58,
    'eg': 90, 'ma': 68, 'za': 58, 'ng': 48, 'dz': 58, 'tn': 68,
    // TIER 4: Developing
    'co': 68, 'cl': 58, 'uy': 48, 'ec': 48, 'py': 39, 'cr': 39, 'car': 31,
    'in': 31, 'id': 39, 'my': 31, 'gh': 39, 'sn': 39, 'ci': 39, 'ke': 31,
    'default': 38
};

export const getCoefficientMultiplier = (leagueId: string): number => {
    const history = LEAGUE_COEFFICIENTS[leagueId] || LEAGUE_COEFFICIENTS['default'];
    const currentTotal = history.reduce((a, b) => a + b, 0);
    const baseValue = BASE_COEFFICIENT_VALUES[leagueId] || BASE_COEFFICIENT_VALUES['default'];

    // Calculate growth/decline from baseline
    // If coefficient doubles, multiplier increases by 50%
    // If coefficient halves, multiplier decreases by 25%
    const ratio = currentTotal / baseValue;

    // Apply smooth scaling: ratio 1.0 = 1.0x, ratio 2.0 = 1.5x, ratio 0.5 = 0.75x
    // Formula: 0.5 + 0.5 * ratio (clamped between 0.3 and 8.0)
    // FULLY DYNAMIC: Kenya 30 sezon dominant → 8x (€5 → €40), İngiltere zayıflarsa 0.3x (€55 → €16)
    // Cap yüksek ama absürt değerlere gitmesin diye 8x max
    const multiplier = Math.min(8.0, Math.max(0.3, 0.5 + 0.5 * ratio));

    return multiplier;
};

// ========== LEAGUE REPUTATION SYSTEM ==========
// Base reputation values for each league (transfer attractiveness)
// DYNAMIC: Can change based on long-term performance
export let BASE_LEAGUE_REPUTATION: Record<string, number> = {
    'en': 92,  // Premier League
    'es': 88,  // La Liga
    'it': 85,  // Serie A
    'de': 84,  // Bundesliga
    'fr': 78,  // Ligue 1
    'pt': 72,  // Primeira Liga - Porto/Benfica prestige
    'nl': 80,  // Eredivisie - Ajax tradition
    'be': 65,  // Belgian Pro League
    'at': 62,  // Austria Bundesliga
    'tr': 62,  // Süper Lig
    'ru': 65,  // Russian Premier (despite sanctions)
    'pl': 58,  // Ekstraklasa (Poland)
    'gr': 60,  // Greek Super League
    'ch': 68,  // Swiss Super League
    'cz': 55,  // Fortuna Liga (Czech)
    'ro': 52,  // Romania SuperLiga
    'hr': 58,  // Croatia HNL - Dinamo Zagreb strong
    'rs': 52,  // Serbia SuperLiga
    'sco': 70, // Scotland - Celtic/Rangers prestige
    'br': 58,  // Série A (Brasil)
    'ar': 68,  // Argentine Primera (historically strong)
    'mx': 55,  // Liga MX
    'sa': 50,  // Saudi Pro League
    'us': 52,  // MLS
    'jp': 62,  // J-League
    'kr': 58,  // K-League
    'au': 55,  // A-League
    'ma': 46,  // Botola Pro
    'eg': 48,  // Egyptian Premier League
    'za': 52,  // South Africa PSL
    'co': 48,  // Colombia
    'cl': 45,  // Chile
    'uy': 47,  // Uruguay
    'py': 38,  // Paraguay
    'ec': 40,  // Ecuador Liga Pro
    'cr': 38,  // Costa Rica
    'tn': 44,  // Tunisia
    'dz': 45,  // Ligue 1 Algeria
    'ci': 42,  // Ivory Coast Premier
    'gh': 45,  // Ghana Premier League
    'ke': 38,  // Kenya Premier League
    'sn': 40,  // Senegal Premier League
    'my': 42,  // Malaysia Liga Super
    'in': 35,  // ISL
    'car': 35, // Caribbean Super League
    'cn': 50,  // Chinese Super League
    'default': 40
};

// Dynamic league reputation bonus (increases with European success)
export let LEAGUE_REPUTATION_BONUS: Record<string, number> = {
    'tr': 0, 'en': 0, 'es': 0, 'de': 0, 'it': 0, 'fr': 0, 'ar': 0, 'br': 0,
    'us': 0, 'mx': 0, 'sa': 0, 'eg': 0, 'jp': 0, 'kr': 0, 'au': 0, 'za': 0,
    'ma': 0, 'car': 0, 'co': 0, 'cl': 0, 'uy': 0, 'tn': 0, 'cr': 0, 'in': 0,
    'pt': 0, 'nl': 0, 'be': 0, 'ch': 0, 'gr': 0, 'pl': 0, 'cz': 0, 'ro': 0,
    'hr': 0, 'rs': 0, 'ru': 0, 'sco': 0, 'at': 0, 'py': 0, 'ec': 0, 'dz': 0,
    'gh': 0, 'ci': 0, 'ke': 0, 'sn': 0, 'my': 0, 'cn': 0
};

// Initialize engine with saved state
export const initializeEngine = (savedState: Partial<GameState>) => {
    if (savedState.leagueReputationBonuses) {
        LEAGUE_REPUTATION_BONUS = { ...savedState.leagueReputationBonuses };
    }
    if (savedState.baseLeagueReputations) {
        BASE_LEAGUE_REPUTATION = { ...savedState.baseLeagueReputations };
    }
    if (savedState.leagueReputationBonuses) {
        LEAGUE_REPUTATION_BONUS = { ...savedState.leagueReputationBonuses };
    }
    if (savedState.baseLeagueReputations) {
        BASE_LEAGUE_REPUTATION = { ...savedState.baseLeagueReputations };
    }
    if (savedState.leagueEuropeanBonuses) {
        LEAGUE_EUROPEAN_BONUS = { ...savedState.leagueEuropeanBonuses };
    }
    if (savedState.leagueCoefficients) {
        LEAGUE_COEFFICIENTS = { ...savedState.leagueCoefficients };
    }
};

// Get current engine state for saving
export const getEngineState = () => {
    return {
        leagueReputationBonuses: { ...LEAGUE_REPUTATION_BONUS },
        baseLeagueReputations: { ...BASE_LEAGUE_REPUTATION },
        leagueEuropeanBonuses: { ...LEAGUE_EUROPEAN_BONUS },
        leagueCoefficients: { ...LEAGUE_COEFFICIENTS }
    };
};

// Get current league reputation (Sum of 5-year coefficients)
export const getLeagueReputation = (leagueId: string): number => {
    // New Calculation: Sum of last 5 years
    const coefficients = LEAGUE_COEFFICIENTS[leagueId] || LEAGUE_COEFFICIENTS['default'];
    return coefficients.reduce((sum, val) => sum + val, 0);
};

// Get detailed coefficients for UI
export const getLeagueCoefficients = (leagueId: string): number[] => {
    return LEAGUE_COEFFICIENTS[leagueId] || LEAGUE_COEFFICIENTS['default'];
};

// 3-LAYER REPUTATION FORMULA
// Calculates club reputation based on:
// 1. League Tier (30%)
// 2. Domestic Dominance (20%) - approx positions
// 3. European Success (50%) - approx achievements
export const calculateClubReputation = (team: Team, leagueRep: number, domesticScore: number, europeScore: number): number => {
    // domesticScore: 0.1 (Relegation) to 1.0 (Champion)
    // europeScore: 0.0 (None) to 1.0 (CL Winner)

    const weightL = 0.30; // League Prestige
    const weightD = 0.20; // Domestic Dominance
    const weightE = 0.50; // European Success (The multiplier!)

    const finalRep = (leagueRep * weightL) + (domesticScore * 100 * weightD) + (europeScore * 100 * weightE);
    return Math.floor(finalRep);
};

// Update league base reputation based on seasonal performance (Bell Curve)

// Award league reputation for European achievements
export const awardLeagueReputationBonus = (leagueId: string, achievement: 'group_stage' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final' | 'winner', isCL: boolean = true) => {
    // CL achievements give more reputation than EL
    const clMultiplier = isCL ? 1.0 : 0.5;

    // UNDERDOG BOOSTER: Weak leagues get 1.5x reputation for same achievement
    const baseRep = BASE_LEAGUE_REPUTATION[leagueId] || 50;
    const underdogMultiplier = baseRep < 70 ? 1.5 : 1.0;

    // REBALANCED: Increased coefficients for meaningful progression
    const bonusAmounts: Record<string, number> = {
        'group_stage': 2,       // +2 for making group stage (was +1)
        'round_of_16': 4,       // +4 for round of 16 (was +2)
        'quarter_final': 6,     // +6 for quarter finals (was +3)
        'semi_final': 10,       // +10 for semi finals (was +5)
        'final': 15,            // +15 for reaching final (was +8)
        'winner': 25            // +25 for winning! (was +15)
    };

    const bonus = (bonusAmounts[achievement] || 0) * clMultiplier * underdogMultiplier;
    // REBALANCED: Cap maintained at 100 - limit handled by decay
    LEAGUE_REPUTATION_BONUS[leagueId] = Math.min(100, (LEAGUE_REPUTATION_BONUS[leagueId] || 0) + bonus);

    // NEW SYSTEM: Update the "current year" coefficient (stored in valid index or accumulation logic)
    // For now, we instantly boost the newest year's coefficient
    const coeffs = LEAGUE_COEFFICIENTS[leagueId] || [...LEAGUE_COEFFICIENTS['default']];
    // Add bonus converted to coefficient points (e.g., divided by number of teams factor ~5)
    // Rough conversion: 1 Reputation Point ~ 0.2 Coefficient Points
    const coeffBonus = (bonus * 0.2);
    coeffs[4] = Math.min(30, coeffs[4] + coeffBonus); // Cap single year at 30.0
    LEAGUE_COEFFICIENTS[leagueId] = coeffs;
};

// Calculate player's willingness to transfer to a team
// Returns 0-100 (higher = more willing)
// REBALANCED: Added wage factor, reduced league impact, softened quality penalties
export const calculateTransferWillingness = (
    player: { overall: number; age: number; potential: number; morale?: number; wage?: number },
    fromTeamRep: number,
    toTeamRep: number,
    fromLeagueId: string,
    toLeagueId: string,
    offeredWage?: number // NEW: Optional wage offer parameter
): number => {
    let willingness = 50; // Base 50%

    // Check if same league transfer (easier!)
    const isSameLeague = fromLeagueId === toLeagueId;

    // 1. League Prestige Difference (REDUCED: max ±12% instead of ±25%)
    const fromLeagueRep = getLeagueReputation(fromLeagueId);
    const toLeagueRep = getLeagueReputation(toLeagueId);
    const leagueDiff = toLeagueRep - fromLeagueRep;
    willingness += leagueDiff * 0.24; // +/-12 max effect (was 0.5 = ±25)

    // 2. Same League Bonus (+15) - Players are more willing to move within same league
    if (isSameLeague) {
        willingness += 15;
    }

    // 3. Club Reputation Difference (Adjusted for 3-Layer System)
    const repDiff = (toTeamRep - fromTeamRep) / 75; // Each 75 rep = +1%
    willingness += repDiff;

    // 4. MoneyFit (Wage Multiplier Effect) - "Cash is King" implementation
    if (offeredWage && player.wage) {
        // Base wage assumed to be current wage or market value derived
        const currentWage = player.wage || 1000;
        const wageMultiplier = offeredWage / currentWage;

        // Unified Wage Impact (Exact User Request)
        if (wageMultiplier >= 2.0) {
            willingness += 50; // MAX EFFECT (+50 Pts)
        } else if (wageMultiplier >= 1.5) {
            willingness += 25; // Significant boost (+25 Pts)
        } else if (wageMultiplier < 0.9) {
            willingness -= 25; // Lowball penalty
        }

    }

    // 5. Age Factor & "Retirement League" Appeal
    if (player.age > 29) {
        // Base desperation to sign a contract increases with age
        willingness += (player.age - 29) * 5; // 30->+5, 32->+15, 34->+25

        // SPECIAL: Old players don't care about League Prestige drops (Retirement Home Logic)
        // If moving to a LOWER reputation league (leagueDiff < 0)
        if (leagueDiff < 0) {
            const ignoreFactor = Math.min(1.0, (player.age - 29) * 0.25);
            // Age 30: Ignores 25% of the penalty
            // Age 31: Ignores 50%
            // Age 32: Ignores 75%
            // Age 33+: Ignores 100% of the league penalty!

            // "Refund" the penalty calculated in Step 1
            // (Note: leagueDiff is negative, so leagueDiff * 0.24 is negative. We subtracted it impliedly in Step 1.
            // Wait, Step 1 was: willingness += leagueDiff * 0.24. So willingness went DOWN.
            // To refund, we SUBTRACT that negative amount (add ABS).
            // Actually simpler: willingness -= (leagueDiff * 0.24) * ignoreFactor;
            willingness -= (leagueDiff * 0.24) * ignoreFactor;
        }
    } else if (player.age < 24 && player.potential > 85) {
        // High potential young players are picky
        willingness -= isSameLeague ? 5 : 10;
    }

    // 6. Player Quality
    if (player.overall >= 88) {
        willingness -= isSameLeague ? 7 : 15;
    } else if (player.overall >= 84) {
        willingness -= isSameLeague ? 5 : 10;
    } else if (player.overall >= 80) {
        willingness -= isSameLeague ? 2 : 5;
    }

    // 7. Morale Factor (INCREASED impact)
    if ((player.morale || 75) < 40) {
        willingness += 25; // Very unhappy = desperate to leave
    } else if ((player.morale || 75) < 55) {
        willingness += 15; // Unhappy
    }

    return Math.max(5, Math.min(95, willingness));
};

// ========== REALISTIC ATTENDANCE SYSTEM ==========
// Fan base is based on reputation, stadium capacity is just a LIMIT
// This prevents unrealistic scenarios like small teams filling 100K stadiums
export const calculateMatchAttendance = (
    homeTeam: Team,
    awayTeam: Team,
    options: {
        isDerby?: boolean;
        isEuropeanMatch?: boolean;
        isChampionsLeague?: boolean;
        isChampionshipDecider?: boolean;
    } = {}
): number => {
    const { isDerby = false, isEuropeanMatch = false, isChampionsLeague = false, isChampionshipDecider = false } = options;

    // STADIUM CAPACITY
    const stadiumCapacity = homeTeam.facilities?.stadiumCapacity ||
        (5000 + (homeTeam.facilities?.stadiumLevel || 1) * 6000);

    // ========== SELL-OUT CONDITIONS ==========
    // These special matches ALWAYS fill the stadium to 100%!

    // 1. Country's TOP teams visiting (rep 8000+) = SOLD OUT
    // Example: Beşiktaş, Fenerbahçe, Galatasaray visiting Göztepe
    const isTopTeamVisiting = awayTeam.reputation >= 8000;

    // 2. Elite Cup = SOLD OUT (Global elite match!)
    // 3. Derby = SOLD OUT (Derbi her zaman dolu!)
    // 4. Both teams are big clubs playing each other = SOLD OUT (Biletler karaborsaya düşer!)
    const isBigClashMatch = homeTeam.reputation >= 7500 && awayTeam.reputation >= 7500;

    if (isDerby || isChampionsLeague || isTopTeamVisiting || isBigClashMatch) {
        // SOLD OUT! Full stadium with tiny variance (98-100%)
        const soldOutVariance = 0.98 + (Math.random() * 0.02);
        return Math.floor(stadiumCapacity * soldOutVariance);
    }

    // ========== NORMAL ATTENDANCE CALCULATION ==========

    // 1. Base fan base from reputation (rep 5000 = 25K fans, rep 10000 = 70K fans)
    const repFactor = Math.max(0, homeTeam.reputation - 5000) / 5000;
    const baseFanBase = 15000 + (repFactor * repFactor * 60000);

    // 2. League fan multiplier
    const leagueFanMultiplier: Record<string, number> = {
        'tr': 0.75, 'en': 1.15, 'es': 0.90, 'it': 0.85, 'de': 1.10, 'fr': 0.80, 'default': 0.80
    };
    const leagueMult = leagueFanMultiplier[homeTeam.leagueId] || leagueFanMultiplier['default'];

    // 3. Form bonus (good form = more fans)
    const recentWins = homeTeam.recentForm?.filter(r => r === 'W').length || 0;
    const formBonus = 1 + (recentWins * 0.04);

    // 4. Opponent attraction (medium-big teams draw more fans)
    const opponentBonus = awayTeam.reputation > 7000 ? 1.30 :
        awayTeam.reputation > 6000 ? 1.15 : 1.0;

    // 5. Challenge Cup bonus (not as big as Elite Cup but still special)
    const europaBonus = isEuropeanMatch ? 1.40 : 1.0;

    // 6. Championship race bonus
    const championshipBonus = isChampionshipDecider ? 1.25 : 1.0;

    // Calculate potential attendance
    const potentialAttendance = Math.floor(
        baseFanBase * leagueMult * formBonus * opponentBonus * europaBonus * championshipBonus
    );

    // Final attendance (capped by stadium capacity)
    const actualAttendance = Math.min(potentialAttendance, stadiumCapacity);

    // Add small random variance (±3%)
    const variance = 1 + (Math.random() * 0.06 - 0.03);

    return Math.floor(actualAttendance * variance);
};

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Takım oyuncularına benzersiz forma numarası ata
const assignTeamJerseyNumbers = (teamPlayers: Player[]) => {
    const usedNumbers = new Set<number>();

    // Pozisyonlara göre sırala: GK, DEF, MID, FWD - ve overall'a göre
    const sorted = [...teamPlayers].sort((a, b) => {
        const posOrder: Record<string, number> = { 'GK': 0, 'DEF': 1, 'MID': 2, 'FWD': 3 };
        const orderDiff = (posOrder[a.position] || 4) - (posOrder[b.position] || 4);
        if (orderDiff !== 0) return orderDiff;
        return b.overall - a.overall; // En iyi oyuncu önce
    });

    // Popüler numaralar pozisyona göre
    const preferredNumbers: Record<string, number[]> = {
        'GK': [1, 12, 13, 25],
        'DEF': [2, 3, 4, 5, 6, 15, 23, 24],
        'MID': [6, 7, 8, 10, 14, 16, 17, 18, 20, 22],
        'FWD': [7, 9, 10, 11, 19, 21]
    };

    sorted.forEach(player => {
        // Önce tercih edilen numaralardan dene
        const preferred = preferredNumbers[player.position] || [];
        let assigned = false;

        for (const num of preferred) {
            if (!usedNumbers.has(num)) {
                player.jerseyNumber = num;
                usedNumbers.add(num);
                assigned = true;
                break;
            }
        }

        // Tercih edilen numara yoksa, boş olan ilk numarayı bul
        if (!assigned) {
            for (let num = 2; num <= 99; num++) {
                if (!usedNumbers.has(num)) {
                    player.jerseyNumber = num;
                    usedNumbers.add(num);
                    break;
                }
            }
        }
    });
};

const getName = (nationality: string) => {
    // @ts-ignore
    const db = NAMES_DB[nationality] || NAMES_DB['World'];
    return {
        first: getRandomItem(db.first as string[]),
        last: getRandomItem(db.last as string[])
    };
};

const generateAttributes = (position: Position, age: number, potential: number): PlayerAttributes => {
    const base = potential * 0.6;
    const varAmount = 12;
    const val = (bonus: number = 0) => Math.min(99, Math.max(20, Math.floor(base + bonus + (Math.random() * varAmount - varAmount / 2))));

    const archetypeRoll = Math.random();

    if (position === Position.GK) {
        return {
            finishing: val(-40), passing: val(-20), tackling: val(-30), dribbling: val(-30), goalkeeping: val(35),
            speed: val(-20), stamina: val(-10), strength: val(10),
            positioning: val(25), aggression: val(-10), composure: val(10), vision: val(-20), leadership: val(5), decisions: val(15)
        };
    } else if (position === Position.DEF) {
        if (archetypeRoll > 0.5) {
            return {
                finishing: val(-30), passing: val(-10), tackling: val(35), dribbling: val(-20), goalkeeping: val(-50),
                speed: val(-5), stamina: val(15), strength: val(30),
                positioning: val(25), aggression: val(25), composure: val(5), vision: val(-10), leadership: val(10), decisions: val(15)
            };
        } else {
            return {
                finishing: val(-25), passing: val(15), tackling: val(25), dribbling: val(5), goalkeeping: val(-50),
                speed: val(5), stamina: val(15), strength: val(15),
                positioning: val(20), aggression: val(10), composure: val(15), vision: val(10), leadership: val(5), decisions: val(20)
            };
        }
    } else if (position === Position.MID) {
        if (archetypeRoll > 0.66) {
            return {
                finishing: val(10), passing: val(35), tackling: val(-15), dribbling: val(25), goalkeeping: val(-50),
                speed: val(5), stamina: val(5), strength: val(-15),
                positioning: val(5), aggression: val(-15), composure: val(20), vision: val(35), leadership: val(5), decisions: val(20)
            };
        } else if (archetypeRoll > 0.33) {
            return {
                finishing: val(5), passing: val(15), tackling: val(15), dribbling: val(10), goalkeeping: val(-50),
                speed: val(15), stamina: val(35), strength: val(10),
                positioning: val(20), aggression: val(15), composure: val(10), vision: val(10), leadership: val(10), decisions: val(15)
            };
        } else {
            return {
                finishing: val(-15), passing: val(5), tackling: val(30), dribbling: val(-5), goalkeeping: val(-50),
                speed: val(0), stamina: val(25), strength: val(25),
                positioning: val(15), aggression: val(30), composure: val(10), vision: val(-5), leadership: val(10), decisions: val(10)
            };
        }
    } else {
        if (archetypeRoll > 0.6) {
            return {
                finishing: val(15), passing: val(10), tackling: val(-30), dribbling: val(30), goalkeeping: val(-50),
                speed: val(35), stamina: val(15), strength: val(-10),
                positioning: val(15), aggression: val(5), composure: val(10), vision: val(5), leadership: val(0), decisions: val(10)
            };
        } else if (archetypeRoll > 0.2) {
            return {
                finishing: val(35), passing: val(5), tackling: val(-30), dribbling: val(5), goalkeeping: val(-50),
                speed: val(0), stamina: val(10), strength: val(35),
                positioning: val(30), aggression: val(10), composure: val(25), vision: val(5), leadership: val(5), decisions: val(15)
            };
        } else {
            return {
                finishing: val(25), passing: val(20), tackling: val(-20), dribbling: val(20), goalkeeping: val(-50),
                speed: val(10), stamina: val(10), strength: val(5),
                positioning: val(25), aggression: val(5), composure: val(20), vision: val(20), leadership: val(10), decisions: val(15)
            };
        }
    }
};

const mapTurkishPosition = (pos: string | Position): Position => {
    const s = pos as string;
    if (['KL', 'GK'].includes(s)) return Position.GK;
    if (['STP', 'SĞB', 'SLB', 'SW', 'DEF', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(s)) return Position.DEF;
    if (['MDO', 'MO', 'MOO', 'MID', 'CDM', 'CM', 'CAM', 'RM', 'LM'].includes(s)) return Position.MID;
    return Position.FWD;
};

const generatePlayer = (teamId: string, position: Position, nationality: string, ageRange: [number, number], potentialRange: [number, number], realData?: any, leagueId?: string): Player => {
    let age = getRandomInt(ageRange[0], ageRange[1]);
    let potential = getRandomInt(potentialRange[0], potentialRange[1]);
    let first, last;

    if (realData) {
        age = realData.yas || realData.age;
        const baseOvr = realData.reyting || realData.ovr;
        potential = Math.max(baseOvr, 95 - (age - 20));

        const fullName = realData.ad || (realData.firstName + " " + realData.lastName);
        const nameParts = fullName.split(' ');
        if (nameParts.length > 1) {
            last = nameParts.pop();
            first = nameParts.join(' ');
        } else {
            first = fullName;
            last = "";
        }

        if (realData.mevki && typeof realData.mevki === 'string') {
            position = mapTurkishPosition(realData.mevki);
        } else if (realData.position) {
            position = realData.position;
        }
    } else {
        const nameData = getName(nationality);
        first = nameData.first;
        last = nameData.last;
    }

    let attributes;
    let details = {};

    if (realData && realData.ana_ozellikler) {
        const m = realData.ana_ozellikler;
        const d = realData.detaylar || {};
        details = { ...m, ...d };

        attributes = {
            speed: m.hiz,
            finishing: d.bitiricilik || m.sut,
            passing: m.pas,
            dribbling: m.dribbling,
            tackling: m.defans,
            strength: m.fizik,
            stamina: d.dayaniklilik || 70,
            goalkeeping: position === Position.GK ? (m.refleks || 80) : 10,
            positioning: d.pozisyon || 70,
            aggression: d.agresiflik || 60,
            composure: d.sogukkanlilik || 70,
            vision: d.gorus || m.pas,
            leadership: 75,
            decisions: d.reaksiyon || 75
        };

        if (position === Position.GK) {
            attributes.goalkeeping = realData.reyting || 80;
            attributes.tackling = 15;
            attributes.finishing = 15;
        }

    } else if (realData && realData.stats) {
        const s = realData.stats;
        attributes = {
            finishing: s.sho, passing: s.pas, tackling: s.def, dribbling: s.dri, goalkeeping: position === Position.GK ? 85 : 10,
            speed: s.pac, stamina: s.phy - 10, strength: s.phy,
            positioning: s.sho - 5, aggression: s.def, composure: s.pas, vision: s.pas, leadership: 75, decisions: 75
        };
        if (position === Position.GK) {
            attributes.goalkeeping = realData.reyting || 80;
            attributes.tackling = 20;
            attributes.finishing = 20;
        }
    } else {
        attributes = generateAttributes(position, age, potential);
    }

    const tempPlayerForCalc = {
        position,
        attributes,
        overall: 0,
        morale: 80
    } as Player;

    // Use BASE overall calculator (pure attribute-based, no anchor)
    const calculatedOverall = calculateBaseOverall(tempPlayerForCalc, position);

    // Calculate Wage Scaling based on League Economic Power
    // This prevents small leagues from paying Premier League wages
    const leagueMult = leagueId ? getLeagueMultiplier(leagueId) : 1.0;
    const baseWage = Math.floor((Math.pow(1.13, calculatedOverall - 50) * 100000) * 0.005);
    const scaledWage = Math.floor(baseWage * (0.8 + (leagueMult * 0.2)));

    // Ensure realistic minimum wages
    const finalWage = Math.max(250, scaledWage);

    return {
        id: uuid(),
        firstName: first,
        lastName: last,
        age,
        nationality: realData ? realData.uyruk || realData.nationality : nationality,
        position,
        attributes,
        hiddenAttributes: {
            consistency: realData ? 15 : getRandomInt(10, 20),
            importantMatches: realData ? 15 : getRandomInt(10, 20),
            injuryProneness: realData ? 5 : getRandomInt(1, 10)
        },
        visual: {
            skinColor: getRandomItem(['#f8d9c6', '#eac0a3', '#c68642', '#8d5524', '#523420']),
            hairColor: getRandomItem(['#000000', '#4a3222', '#d4af37', '#808080']),
            hairStyle: getRandomInt(1, 5),
            accessory: Math.random() < 0.2
        },
        stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, averageRating: 0 },
        overall: calculatedOverall,
        potential,
        // VALUE: Game-balanced exponential formula
        // Target: 60 OVR ~€400K, 70 OVR ~€1.5M, 80 OVR ~€5M, 90 OVR ~€15M, 94 OVR ~€25M
        // This matches a €35M starting budget where top players are expensive but achievable
        value: Math.floor((Math.pow(1.13, calculatedOverall - 50) * 100000) * (1 + (potential - calculatedOverall) / 25) * (1 - Math.max(0, age - 26) * 0.025)),
        // WAGE: Scaled by League Economy
        wage: finalWage,
        salary: finalWage * 52, // Yearly salary
        contractYears: realData ? 3 : getRandomInt(1, 5),
        morale: 80,
        condition: 100,
        form: 6,
        teamId,
        isTransferListed: false,
        weeksInjured: 0,
        matchSuspension: 0,
        lineup: 'RESERVE',
        lineupIndex: 99,
        jerseyNumber: realData ? (realData.forma_no || realData.jerseyNumber) : undefined,
        playStyles: realData ? (realData.oyun_tarzlari || []) : [],
        details: details
    };
};

export const autoPickLineup = (
    players: Player[],
    preferredFormation?: TacticType,
    archetype?: CoachArchetype,
    customPositions?: Record<string, { x: number, y: number }>,
    currentStarters?: Player[],
    maxStarters: number = 11 // Default to full team
): { formation: TacticType } => {
    const formation = preferredFormation || TacticType.T_442;

    // Calculate effective score for sorting: overall + form bonus + condition bonus - penalties
    const getEffectiveScore = (p: Player, forRole?: Position): number => {
        // Injured or suspended players get very low score
        if (p.weeksInjured > 0) return -1000;
        if (p.matchSuspension > 0) return -500;

        let score = p.overall;
        // Form bonus: form is 1-10, normalize to -5 to +5 bonus
        score += (p.form - 6) * 2;

        // Condition Impact (HEAVILY WEIGHTED NOW)
        // If condition is low, score should drop drastically to prefer rotation
        if (p.condition < 60) score -= 30; // Heavy penalty for yellow fatigue
        if (p.condition < 40) score -= 50; // Critical penalty
        score += (p.condition - 50) * 0.2;

        // Morale bonus
        score += (p.morale - 50) * 0.05;

        // ========== DETAILED OOP PENALTY MATRIX ==========
        // Only affects match performance, NOT permanent player stats!
        // Penalty based on how far the position is from natural position
        if (forRole && p.position === forRole) {
            score += 5; // Natural position bonus
        } else if (forRole && p.position !== forRole) {
            // OOP Penalty Matrix
            const oopPenalty: Record<string, Record<string, number>> = {
                'GK': { 'GK': 0, 'DEF': -25, 'MID': -35, 'FWD': -40 },
                'DEF': { 'GK': -50, 'DEF': 0, 'MID': -10, 'FWD': -20 },
                'MID': { 'GK': -50, 'DEF': -8, 'MID': 0, 'FWD': -8 },
                'FWD': { 'GK': -50, 'DEF': -25, 'MID': -10, 'FWD': 0 }
            };

            const playerPos = p.position as string;
            const targetPos = forRole as string;
            const penalty = oopPenalty[playerPos]?.[targetPos] ?? -15;

            score += penalty;
        }

        return score;
    };

    // Determine role from X position on pitch (0-100 scale)
    const getRoleFromPitchX = (x: number): Position => {
        if (x < 12) return Position.GK;
        if (x < 40) return Position.DEF;
        if (x < 70) return Position.MID;
        return Position.FWD;
    };

    // Get formation structure
    const structure: Record<string, number> = {
        [TacticType.T_442]: { DEF: 4, MID: 4, FWD: 2 },
        [TacticType.T_433]: { DEF: 4, MID: 3, FWD: 3 },
        [TacticType.T_352]: { DEF: 3, MID: 5, FWD: 2 },
        [TacticType.T_541]: { DEF: 5, MID: 4, FWD: 1 },
        [TacticType.T_451]: { DEF: 4, MID: 5, FWD: 1 },
        [TacticType.T_4231]: { DEF: 4, MID: 5, FWD: 1 },
        [TacticType.T_343]: { DEF: 3, MID: 4, FWD: 3 },
        [TacticType.T_4141]: { DEF: 4, MID: 5, FWD: 1 },
        [TacticType.T_532]: { DEF: 5, MID: 3, FWD: 2 },
        [TacticType.T_41212]: { DEF: 4, MID: 4, FWD: 2 },
        [TacticType.T_4321]: { DEF: 4, MID: 5, FWD: 1 },
    }[formation] as any || { DEF: 4, MID: 4, FWD: 2 };

    // Build list of 11 slot requirements (what position each slot needs)
    const slotRequirements: Position[] = [];

    // Check if we have custom positions with current starters
    if (customPositions && currentStarters && currentStarters.length === 11) {
        let gkCount = 0;
        // Use custom positions to determine what role each slot needs
        currentStarters.forEach(starter => {
            const customPos = customPositions[starter.id];
            let role = starter.position as Position;

            if (customPos) {
                role = getRoleFromPitchX(customPos.x); // <12 is GK
            }

            // Prevent multiple GKs
            if (role === Position.GK) {
                if (gkCount > 0) role = Position.DEF; // Force to DEF if already have a GK assumption
                else gkCount++;
            }

            slotRequirements.push(role);
        });

        // Ensure at least one GK if none found (fallback)
        if (gkCount === 0 && slotRequirements.length > 0) {
            slotRequirements[0] = Position.GK;
        }
    } else {
        // Use formation structure to build slot requirements
        slotRequirements.push(Position.GK);
        for (let i = 0; i < structure.DEF; i++) slotRequirements.push(Position.DEF);
        for (let i = 0; i < structure.MID; i++) slotRequirements.push(Position.MID);
        for (let i = 0; i < structure.FWD; i++) slotRequirements.push(Position.FWD);
    }

    // CRITICAL FIX: RED CARD LIMIT (SMART SLOT REMOVAL)
    // If we can only play with X players (e.g. 10 due to red card), we must remove slots.
    // Instead of blindly removing FWDs (pop from end), we should remove the slot 
    // corresponding to the missing player's position (Deficit Calculation).
    if (slotRequirements.length > maxStarters) {
        const removeCount = slotRequirements.length - maxStarters;

        // 1. Calculate Availability & Deficits
        const available = players.filter(p => (p.weeksInjured || 0) === 0 && (p.matchSuspension || 0) === 0);

        // Helper to normalize position for counting
        const getPos = (p: Player): Position => {
            const posStr = p.position as string;
            if (['KL', 'GK'].includes(posStr)) return Position.GK;
            if (['STP', 'SĞB', 'SLB', 'SW', 'DEF', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(posStr)) return Position.DEF;
            if (['MDO', 'MO', 'MOO', 'MID', 'CDM', 'CM', 'CAM', 'RM', 'LM'].includes(posStr)) return Position.MID;
            return Position.FWD;
        };

        const availableCounts = {
            [Position.GK]: available.filter(p => getPos(p) === Position.GK).length,
            [Position.DEF]: available.filter(p => getPos(p) === Position.DEF).length,
            [Position.MID]: available.filter(p => getPos(p) === Position.MID).length,
            [Position.FWD]: available.filter(p => getPos(p) === Position.FWD).length,
        };

        // Count what the formation WANTS
        const currentCounts = {
            [Position.GK]: slotRequirements.filter(r => r === Position.GK).length,
            [Position.DEF]: slotRequirements.filter(r => r === Position.DEF).length,
            [Position.MID]: slotRequirements.filter(r => r === Position.MID).length,
            [Position.FWD]: slotRequirements.filter(r => r === Position.FWD).length,
        };

        // Deficit = Needed - Have (Positive value means we are missing players for this role)
        const deficits = {
            [Position.GK]: Math.max(0, currentCounts[Position.GK] - availableCounts[Position.GK]),
            [Position.DEF]: Math.max(0, currentCounts[Position.DEF] - availableCounts[Position.DEF]),
            [Position.MID]: Math.max(0, currentCounts[Position.MID] - availableCounts[Position.MID]),
            [Position.FWD]: Math.max(0, currentCounts[Position.FWD] - availableCounts[Position.FWD]),
        };

        for (let i = 0; i < removeCount; i++) {
            let targetPos = Position.FWD; // Default sacrifice
            let foundDeficit = false;

            // Priority 1: Remove slot where we have a DEFICIT (Missing player)
            // Order doesn't matter much if deficit exists, but let's check FWD->MID->DEF->GK
            const checkOrder = [Position.FWD, Position.MID, Position.DEF, Position.GK];

            for (const pos of checkOrder) {
                if (deficits[pos] > 0) {
                    targetPos = pos;
                    foundDeficit = true;
                    // Decrease deficit since we are removing the requirement
                    deficits[pos]--;
                    break;
                }
            }

            // Priority 2: If no deficit (e.g. simple 10-man tactic adjustment), sacrifice from back to front
            if (!foundDeficit) {
                if (currentCounts[Position.FWD] > 0) targetPos = Position.FWD;
                else if (currentCounts[Position.MID] > 0) targetPos = Position.MID;
                else if (currentCounts[Position.DEF] > 0) targetPos = Position.DEF;
            }

            // Remove the LAST instance of this position requirement
            const idx = slotRequirements.lastIndexOf(targetPos);
            if (idx !== -1) {
                slotRequirements.splice(idx, 1);
                currentCounts[targetPos]--;
            } else {
                // Fallback (should rarely happen)
                slotRequirements.pop();
            }
        }
    }

    // Debug log removed for production

    // Reset all players first
    players.forEach(p => {
        p.lineup = 'RESERVE';
        p.lineupIndex = 99;
    });

    // Filter available players (not injured/suspended)
    const available = players.filter(p => p.weeksInjured === 0 && p.matchSuspension === 0);
    const used = new Set<string>();

    // For each slot, find best matching player
    slotRequirements.forEach((requiredRole, slotIdx) => {
        // Find best available player for this role
        let candidates = available
            .filter(p => !used.has(p.id))
            .map(p => ({ player: p, score: getEffectiveScore(p, requiredRole) }))
            .sort((a, b) => {
                // Prioritize matching position first
                const aMatch = a.player.position === requiredRole ? 1 : 0;
                const bMatch = b.player.position === requiredRole ? 1 : 0;
                if (aMatch !== bMatch) return bMatch - aMatch;
                // Then by score
                return b.score - a.score;
            });

        if (candidates.length > 0) {
            const best = candidates[0].player;
            best.lineup = 'STARTING';
            best.lineupIndex = slotIdx;
            used.add(best.id);
        }
    });

    // Fill bench (9 players)
    let benchIdx = 11;
    const benchCandidates = available
        .filter(p => !used.has(p.id))
        .sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a));

    for (let i = 0; i < 9 && i < benchCandidates.length; i++) {
        benchCandidates[i].lineup = 'BENCH';
        benchCandidates[i].lineupIndex = benchIdx++;
        used.add(benchCandidates[i].id);
    }

    return { formation };
};

export const generateSponsors = (): Sponsor[] => {
    // Strategic sponsor selection:
    // - High weekly / Low bonus = Safe choice (guaranteed income)
    // - Low weekly / High bonus = Risky choice (rewards winning teams)
    // Fictional sponsor names to avoid trademark issues
    return [
        { id: uuid(), name: "SkyJet Airways", description: "Global Airline - Premium", weeklyIncome: 300000, winBonus: 50000, duration: 1 },
        { id: uuid(), name: "GulfStar Airlines", description: "Premium Airline", weeklyIncome: 250000, winBonus: 150000, duration: 1 },
        { id: uuid(), name: "Beatify", description: "Music Streaming", weeklyIncome: 180000, winBonus: 350000, duration: 1 },
        { id: uuid(), name: "CloudLink", description: "Tech Solutions", weeklyIncome: 100000, winBonus: 600000, duration: 1 },
        { id: uuid(), name: "VoltEnergy", description: "Energy Drink", weeklyIncome: 30000, winBonus: 1000000, duration: 1 },
    ];
};

const generateObjectives = (reputation: number): BoardObjective[] => {
    const objectives: BoardObjective[] = [];
    if (reputation > 7500) {
        objectives.push({ id: uuid(), description: "Win the League Title", type: 'LEAGUE_POS', targetValue: 1, isMandatory: true, status: 'PENDING' });
    } else if (reputation > 6500) {
        objectives.push({ id: uuid(), description: "Finish in Top 4", type: 'LEAGUE_POS', targetValue: 4, isMandatory: true, status: 'PENDING' });
    } else if (reputation > 5500) {
        objectives.push({ id: uuid(), description: "Finish Mid-Table (Top 10)", type: 'LEAGUE_POS', targetValue: 10, isMandatory: true, status: 'PENDING' });
    } else {
        objectives.push({ id: uuid(), description: "Avoid Relegation", type: 'LEAGUE_POS', targetValue: 16, isMandatory: true, status: 'PENDING' });
    }
    const rand = Math.random();
    if (rand > 0.5) {
        objectives.push({ id: uuid(), description: "Develop 2 Youth Players", type: 'DEVELOPMENT', targetValue: 2, currentValue: 0, isMandatory: false, status: 'PENDING' });
    } else {
        objectives.push({ id: uuid(), description: "Keep Wages under budget", type: 'FINANCIAL', isMandatory: false, status: 'PENDING' });
    }
    return objectives;
}

export const analyzeClubHealth = (team: Team, players: Player[]): AssistantAdvice[] => {
    const advice: AssistantAdvice[] = [];
    const starters = players.filter(p => p.lineup === 'STARTING');
    if (starters.length < 11) advice.push({ type: 'CRITICAL', message: "Starting XI has fewer than 11 players." });
    const gk = starters.find(p => p.position === Position.GK);
    if (!gk) advice.push({ type: 'CRITICAL', message: "No Goalkeeper in Starting XI." });
    const injured = starters.filter(p => p.weeksInjured > 0);
    if (injured.length > 0) advice.push({ type: 'CRITICAL', message: `${injured.length} injured player(s) in lineup.` });

    // Check for suspended players
    const suspended = starters.filter(p => p.matchSuspension > 0);
    if (suspended.length > 0) advice.push({ type: 'CRITICAL', message: `${suspended.length} suspended player(s) in lineup.` });
    const lowCond = starters.filter(p => p.condition < 50);
    if (lowCond.length > 0) advice.push({ type: 'WARNING', message: `${lowCond.length} player(s) have critically low stamina.` });
    return advice;
};

// Cup Weeks: 6, 10, 14, 18, 22 (Groups), 28, 31, 34, 37 (Knockouts), 39 (Super Cup)
// League fixtures SKIP these weeks so cups and leagues don't clash
export const CUP_WEEKS = [6, 10, 14, 18, 22, 28, 31, 34, 37, 39];

export const generateSeasonSchedule = (teams: Team[], singleRound: boolean = false): Match[] => {
    const matches: Match[] = [];
    const teamIds = teams.map(t => t.id);
    if (teamIds.length % 2 !== 0) teamIds.push('BYE');
    const numTeams = teamIds.length;
    const numRounds = numTeams - 1;
    const half = numTeams / 2;
    const teamList = [...teamIds];

    // Helper function to get actual week number, SKIPPING cup weeks
    const getLeagueWeek = (roundIndex: number): number => {
        let week = roundIndex + 1;
        // Count how many cup weeks we need to skip
        for (const cupWeek of CUP_WEEKS) {
            if (week >= cupWeek) week++;
        }
        return week;
    };

    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < half; i++) {
            const home = teamList[i];
            const away = teamList[numTeams - 1 - i];
            if (home !== 'BYE' && away !== 'BYE') {
                const actualHome = (round % 2 === 0) ? home : away;
                const actualAway = (round % 2 === 0) ? away : home;

                // First leg - use adjusted week that skips cup weeks
                const firstLegWeek = getLeagueWeek(round);
                matches.push({
                    id: uuid(), week: firstLegWeek, homeTeamId: actualHome, awayTeamId: actualAway,
                    homeScore: 0, awayScore: 0, events: [], isPlayed: false,
                    date: Date.now() + (firstLegWeek * 7 * 24 * 60 * 60 * 1000), attendance: 0,
                    currentMinute: 0, weather: 'Sunny', timeOfDay: 'Day',
                    stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 }
                });

                // Second leg (only if double-round) - also skip cup weeks
                if (!singleRound) {
                    const secondLegWeek = getLeagueWeek(round + numRounds);
                    matches.push({
                        id: uuid(), week: secondLegWeek, homeTeamId: actualAway, awayTeamId: actualHome,
                        homeScore: 0, awayScore: 0, events: [], isPlayed: false,
                        date: Date.now() + (secondLegWeek * 7 * 24 * 60 * 60 * 1000), attendance: 0,
                        currentMinute: 0, weather: 'Sunny', timeOfDay: 'Night',
                        stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 }
                    });
                }
            }
        }
        const last = teamList.pop();
        if (last) teamList.splice(1, 0, last);
    }
    return matches.sort((a, b) => a.week - b.week);
};

export const generateWorld = (leagueId: string): GameState => {
    // Generate ALL Leagues
    const teams: Team[] = [];
    const players: Player[] = [];
    const allMatches: Match[] = [];

    LEAGUE_PRESETS.forEach(preset => {
        const leagueTeams: Team[] = [];

        (preset.realTeams || []).forEach(rt => {
            const teamId = uuid();
            const teamPlayers: Player[] = [];
            const realStars = REAL_PLAYERS.filter(p => (p.takim === rt.name) || ((p as any).team === rt.name));

            // DEDUP: Remove duplicates by name (ad) - some data files have duplicate entries
            const seenNames = new Set<string>();
            const uniqueStars = realStars.filter(star => {
                const name = star.ad || star.name || `${star.firstName} ${star.lastName}`;
                if (seenNames.has(name)) return false;
                seenNames.add(name);
                return true;
            });

            uniqueStars.forEach(star => {
                let pos = Position.MID;
                if (star.mevki) pos = mapTurkishPosition(star.mevki);
                else if (star.position) pos = star.position;
                const p = generatePlayer(teamId, pos, star.uyruk || star.nationality, [star.yas || star.age, star.yas || star.age], [star.reyting || star.ovr, star.reyting || star.ovr], star, preset.id);
                teamPlayers.push(p); players.push(p);
            });

            // Determine specific tactic from profile or dynamic best-fit
            let specificTactic: TeamTactic;
            if (TEAM_TACTICAL_PROFILES[rt.name]) {
                specificTactic = JSON.parse(JSON.stringify(TEAM_TACTICAL_PROFILES[rt.name]));
                // BALANCING: Prevent AI from starting match with 'Aggressive' to avoid early red card RNG
                // They can switch to it dynamically later if losing (MatchEngine logic)
                if (specificTactic.aggression === 'Aggressive') {
                    specificTactic.aggression = 'Normal';
                }
            } else {
                // Default generic tactic if no profile found
                specificTactic = { formation: TacticType.T_442, style: 'Balanced', aggression: 'Normal', tempo: 'Normal', width: 'Balanced', defensiveLine: 'Balanced', passingStyle: 'Mixed', marking: 'Zonal' };
            }

            // Adjust required players based on formation
            const formStruct = {
                [TacticType.T_442]: { [Position.GK]: 2, [Position.DEF]: 7, [Position.MID]: 7, [Position.FWD]: 5 },
                [TacticType.T_433]: { [Position.GK]: 2, [Position.DEF]: 7, [Position.MID]: 6, [Position.FWD]: 6 },
                [TacticType.T_532]: { [Position.GK]: 2, [Position.DEF]: 8, [Position.MID]: 6, [Position.FWD]: 5 },
                [TacticType.T_4231]: { [Position.GK]: 2, [Position.DEF]: 7, [Position.MID]: 8, [Position.FWD]: 4 },
                [TacticType.T_352]: { [Position.GK]: 2, [Position.DEF]: 6, [Position.MID]: 8, [Position.FWD]: 5 },
            }[specificTactic.formation] || { [Position.GK]: 2, [Position.DEF]: 7, [Position.MID]: 7, [Position.FWD]: 5 };

            for (const [pos, count] of Object.entries(formStruct)) {
                const existingCount = teamPlayers.filter(p => p.position === pos).length;
                const needed = Math.max(0, (count as number) - existingCount);
                for (let i = 0; i < needed; i++) {
                    const nat = Math.random() > preset.foreignPlayerChance ? preset.playerNationality : 'World';
                    const baseOvr = Math.floor(rt.reputation / 115);
                    const p = generatePlayer(teamId, pos as Position, nat, [18, 34], [baseOvr, baseOvr + 8], undefined, preset.id);
                    teamPlayers.push(p); players.push(p);
                }
            }

            const coachType = getRandomItem(Object.values(CoachArchetype));
            const baseStaffLevel = Math.max(1, Math.floor(rt.reputation / 2500)); // LOWERED: was /1500, now /2500

            // Use realistic stadium capacity from preset, or calculate based on reputation
            const baseStadiumCapacity = (rt as any).stadiumCapacity || Math.floor(rt.reputation * 4); // Fallback to smaller calculation

            const team: Team = {
                id: teamId, name: rt.name, city: rt.city, primaryColor: rt.primaryColor, secondaryColor: rt.secondaryColor,
                reputation: rt.reputation, budget: rt.budget,
                boardConfidence: 70, // NEW: Starts at 70%
                leagueId: preset.id, // Assign correct league ID
                facilities: { stadiumCapacity: baseStadiumCapacity, stadiumLevel: Math.floor(rt.reputation / 100), trainingLevel: Math.floor(rt.reputation / 150), academyLevel: Math.floor(rt.reputation / 150) },
                staff: { headCoachLevel: baseStaffLevel, physioLevel: baseStaffLevel, scoutLevel: baseStaffLevel },
                objectives: [],
                tactic: specificTactic,
                coachArchetype: coachType as CoachArchetype, trainingFocus: 'BALANCED', trainingIntensity: 'NORMAL',
                youthCandidates: [],
                recentForm: [],
                stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
                wages: 0
            };

            // Objectives are only needed for the user's team, but we can generate basic ones for all
            team.objectives = generateObjectives(rt.reputation);

            // =====================================================
            // STADIUM LEVEL SYSTEM - Fair for all teams worldwide
            // Level 1 = 5,000 seats, Level 25 = 150,000 seats
            // Each level = +6,000 seats
            // Starting level calculated from real stadium capacity
            // =====================================================
            const MIN_STADIUM = 5000;
            const MAX_STADIUM = 150000;
            const CAPACITY_PER_LEVEL = 6000; // FIXED: Exact 6000 per level to match upgrade logic

            // Calculate starting stadium level based on real capacity
            const realCapacity = team.facilities.stadiumCapacity;
            const calculatedLevel = Math.round((realCapacity - MIN_STADIUM) / CAPACITY_PER_LEVEL) + 1;
            const stadiumStartLevel = Math.max(1, Math.min(25, calculatedLevel));

            // CRITICAL FIX: Sync Capacity with the calculated Level immediately
            // This prevents the mismatch (e.g. Level 7 but 41k capacity)
            team.facilities.stadiumLevel = stadiumStartLevel;
            team.facilities.stadiumCapacity = MIN_STADIUM + (stadiumStartLevel - 1) * CAPACITY_PER_LEVEL;

            // Training & Academy based on reputation tier
            const tier = team.reputation > 8500 ? 3 : team.reputation > 7500 ? 2 : 1;
            const trainingBaseLevel = tier === 3 ? 5 : tier === 2 ? 3 : 1;

            team.facilities = {
                stadiumCapacity: realCapacity, // Keep original for reference
                stadiumLevel: stadiumStartLevel, // Calculated from real capacity
                trainingLevel: Math.min(25, trainingBaseLevel + getRandomInt(0, 2)),
                academyLevel: Math.min(25, trainingBaseLevel + getRandomInt(0, 2))
            };

            // Auto pick lineup adhering to the specific formation
            const { formation } = autoPickLineup(teamPlayers, specificTactic.formation, coachType as CoachArchetype);
            team.tactic.formation = formation;

            // Forma numaralarını ata
            assignTeamJerseyNumbers(teamPlayers);

            leagueTeams.push(team);
            teams.push(team);
        })

            ;

        // Generate Fixtures for this league
        const isSingleRound = (preset as any).matchFormat === 'single-round';
        const leagueMatches = generateSeasonSchedule(leagueTeams, isSingleRound);
        // Correcting league ID match assignment might be tricky if match doesn't have leagueId, 
        // but simulation checks team.leagueId so it's fine.
        allMatches.push(...leagueMatches);
    });

    for (let i = 0; i < 50; i++) { // Increased free agents
        const p = generatePlayer('FREE_AGENT', getRandomItem(Object.values(Position)), 'World', [18, 35], [60, 95]);
        // Free agent'lara rastgele numara ata (takıma katılınca değişecek)
        p.jerseyNumber = getRandomInt(2, 50);
        players.push(p);
    }

    // Determine User Team (Default to first team of selected league if not specified)
    // The UI handles selection, but for initial state:
    const userLeagueTeams = teams.filter(t => t.leagueId === leagueId);
    const userTeamId = userLeagueTeams.length > 0 ? userLeagueTeams[0].id : teams[0].id; // Fallback

    // ========== MANAGER RATING SYSTEM ==========
    // Initial rating based on chosen team's reputation
    const userTeam = teams.find(t => t.id === userTeamId);
    const teamRep = userTeam?.reputation || 5000;
    let initialManagerRating: number;
    if (teamRep >= 9000) initialManagerRating = 75; // Elite clubs (Real Madrid, Man City, Bayern)
    else if (teamRep >= 8000) initialManagerRating = 65; // Top clubs (BJK, GS, Dortmund)
    else if (teamRep >= 7000) initialManagerRating = 55; // Good clubs (Midtable EPL, top Turkish)
    else if (teamRep >= 5500) initialManagerRating = 45; // Mid-tier clubs
    else initialManagerRating = 35; // Small clubs - starting from bottom

    // Manager salary based on team reputation (weekly)
    const managerSalary = Math.floor(teamRep * 8); // e.g., 8000 rep = €64K/week

    // 5-YEAR MOCK HISTORY INITIALIZATION (Sallamasyon Veri)
    // Create logical starting history for all leagues
    const initialHistory: Record<string, number[]> = {};
    Object.keys(BASE_LEAGUE_REPUTATION).forEach(lid => {
        if (lid === 'default') return;
        const base = BASE_LEAGUE_REPUTATION[lid] || 50;
        // Stronger leagues start with higher history points (e.g. 90 rep -> ~18 pts/year)
        const avgPoints = (base - 40) / 2.5;

        initialHistory[lid] = [
            Math.max(0, avgPoints + getRandomInt(-2, 2)),
            Math.max(0, avgPoints + getRandomInt(-2, 2)),
            Math.max(0, avgPoints + getRandomInt(-2, 2)),
            Math.max(0, avgPoints + getRandomInt(-2, 2)),
            Math.max(0, avgPoints + getRandomInt(-2, 2))
        ];
    });

    return {
        currentWeek: 1, currentSeason: 2024, userTeamId, leagueId, teams, players, matches: allMatches,
        isSimulating: false, messages: [{ id: uuid(), week: 1, type: MessageType.BOARD, subject: 'Welcome', body: 'The board expects strong results.', isRead: false, date: new Date().toISOString() }],
        transferMarket: players.filter(p => p.teamId === 'FREE_AGENT'),
        history: [],
        leagueCoefficientHistory: initialHistory, // Seeded History
        pendingOffers: [],
        managerRating: initialManagerRating,
        managerSalary,
        managerCareerHistory: [],
        managerTrophies: {
            leagueTitles: 0,
            championsLeagueTitles: 0,
            uefaCupTitles: 0,
            superCupTitles: 0
        },
        jobOffers: [],
        // Persist initial state
        leagueReputationBonuses: { ...LEAGUE_REPUTATION_BONUS },
        baseLeagueReputations: { ...BASE_LEAGUE_REPUTATION },
        leagueEuropeanBonuses: { ...LEAGUE_EUROPEAN_BONUS }
    };
};


let activeEngine: MatchEngine | null = null;
export const getActiveEngine = () => activeEngine;

export const initializeMatch = (match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[], userTeamId?: string) => {
    activeEngine = new MatchEngine(match, homeTeam, awayTeam, homePlayers, awayPlayers, userTeamId);
    return activeEngine.step().liveData.simulation;
}

export const simulateTick = (match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[], userTeamId?: string) => {
    if (!activeEngine || (activeEngine as any).match.id !== match.id) {
        activeEngine = new MatchEngine(match, homeTeam, awayTeam, homePlayers, awayPlayers, userTeamId);
    } else {
        // FIX: Ensure tactics are synced if UI updated them *after* engine initialization
        if (JSON.stringify(activeEngine.homeTeam.tactic) !== JSON.stringify(homeTeam.tactic)) {
            activeEngine.updateTactic(homeTeam.id, homeTeam.tactic);
        }
        if (JSON.stringify(activeEngine.awayTeam.tactic) !== JSON.stringify(awayTeam.tactic)) {
            activeEngine.updateTactic(awayTeam.id, awayTeam.tactic);
        }
    }
    const result = activeEngine.step();
    return {
        minuteIncrement: result.minuteIncrement,
        event: result.event,
        trace: result.trace,
        ballHolderId: result.liveData.ballHolderId,
        pitchZone: result.liveData.pitchZone,
        actionText: result.liveData.lastActionText,
        simulation: result.liveData.simulation,
        stats: result.stats,
        additionalEvents: result.additionalEvents
    };
}

export const performSubstitution = (matchId: string, playerIn: Player, playerOutId: string) => {
    if (activeEngine) activeEngine.substitutePlayer(playerIn, playerOutId);
}

export const updateMatchTactic = (matchId: string, teamId: string, tactic: TeamTactic) => {
    if (activeEngine) activeEngine.updateTactic(teamId, tactic);
}

export const syncEngineLineups = (homePlayers: Player[], awayPlayers: Player[]) => {
    if (activeEngine) activeEngine.syncLineups(homePlayers, awayPlayers);
}

export const getLivePlayerStamina = (playerId: string): number | undefined => {
    if (activeEngine) return activeEngine.getPlayerStamina(playerId);
    return undefined;
}

// Returns the set of player IDs who have been substituted OUT during the current match
// These players CANNOT return to the pitch (football rule!)
export const getSubstitutedOutPlayerIds = (): Set<string> => {
    if (activeEngine) return (activeEngine as any).substitutedOutPlayerIds || new Set();
    return new Set();
}

export const simulateFullMatch = (match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[]): Match => {
    // ⚽ ADIL SİMÜLASYON - Kullanıcı takımına torpil YOK!
    // Sonuçlar SADECE takımın gerçek gücüne göre belirlenir:
    // - Real Madrid (82-91 OVR) > Karagümrük (54-74 OVR) = RM favorit
    // - Galatasaray (70-82 OVR) vs Fenerbahçe (70-82 OVR) = Dengeli maç

    // 1. TACTICAL ADVANTAGE (Rock Paper Scissors)
    const tacticsRockPaperScissors: Record<string, string> = {
        'Possession': 'HighPress',
        'Counter': 'Possession',
        'LongBall': 'HighPress',
        'HighPress': 'Counter'
    };

    // === TARAFTAR DESTEĞİ & EV SAHİBİ AVANTAJI ===
    // Reputation (itibar) yüksek takımların daha coşkulu taraftarları var
    const homeReputation = homeTeam.reputation || 5000;
    const fanBoost = Math.min(0.03, (homeReputation / 150000)); // Max +3% bonus (reduced from 6%, divisor 100k->150k)

    // Temel ev sahibi avantajı + taraftar desteği
    let homeAdvantage = 1.08 + fanBoost; // 1.08 + 0.00-0.03 = 1.08-1.11

    // === ŞANS FAKTÖRÜ ===
    // Her maçta %5-15 arası rastgele varyasyon (underdog upset olabilir!)
    const luckFactor = 0.85 + (Math.random() * 0.30); // 0.85 - 1.15 arası
    const homeLuck = luckFactor;
    const awayLuck = 2 - luckFactor; // Birinin şansı yüksekse diğerinin düşük

    // Tactical Check
    if (tacticsRockPaperScissors[homeTeam.tactic.style] === awayTeam.tactic.style) homeAdvantage += 0.05;
    if (tacticsRockPaperScissors[awayTeam.tactic.style] === homeTeam.tactic.style) homeAdvantage -= 0.05;

    // 2. POWER CALCULATION - IMPROVED: Uses total team overall + OOP penalties
    const getTeamPower = (players: Player[]): { attack: number, defense: number, overall: number } => {
        const starters = players.filter(p => p.lineup === 'STARTING');
        if (starters.length === 0) {
            // Fallback: use top 11 by overall
            const sorted = [...players].sort((a, b) => b.overall - a.overall);
            starters.push(...sorted.slice(0, 11));
        }

        // OOP Penalty Matrix (percentage reduction)
        const oopPenaltyPct: Record<string, Record<string, number>> = {
            'GK': { 'GK': 0, 'DEF': 0.30, 'MID': 0.40, 'FWD': 0.50 },
            'DEF': { 'GK': 0.60, 'DEF': 0, 'MID': 0.12, 'FWD': 0.25 },
            'MID': { 'GK': 0.60, 'DEF': 0.10, 'MID': 0, 'FWD': 0.10 },
            'FWD': { 'GK': 0.60, 'DEF': 0.30, 'MID': 0.12, 'FWD': 0 }
        };

        let attack = 0, defense = 0, overall = 0;
        starters.forEach(p => {
            const naturalPos = mapTurkishPosition(p.position);
            // TODO: Detect assigned position from formation/custom positions
            // For now, use natural position (no OOP in auto-sim)
            const playingPos = naturalPos;

            // Calculate OOP penalty
            const penalty = oopPenaltyPct[p.position as string]?.[playingPos as string] ?? 0;
            const effectiveRating = p.overall * (1 - penalty);

            overall += effectiveRating;

            if (naturalPos === Position.FWD) {
                attack += effectiveRating * 1.2;
                defense += effectiveRating * 0.2;
            } else if (naturalPos === Position.MID) {
                attack += effectiveRating * 0.7;
                defense += effectiveRating * 0.6;
            } else if (naturalPos === Position.DEF) {
                attack += effectiveRating * 0.2;
                defense += effectiveRating * 1.1;
            } else if (naturalPos === Position.GK) {
                defense += effectiveRating * 1.5;
            }
        });

        return { attack, defense, overall: overall / Math.max(1, starters.length) };
    };

    const homePower = getTeamPower(homePlayers);
    const awayPower = getTeamPower(awayPlayers);

    // PRESERVE existing score and events if match already started
    const startMinute = match.currentMinute || 0;
    const existingEvents = [...(match.events || [])];

    if (startMinute === 0) {
        match.homeScore = 0;
        match.awayScore = 0;
        match.events = [];
    } else {
        match.events = existingEvents;
    }

    const pickScorer = (players: Player[]): Player | undefined => {
        const candidates = players.filter(p => p.lineup === 'STARTING' || p.lineup === 'BENCH');
        if (candidates.length === 0) return undefined;
        // Weighted random selection for scorer
        const weighted = [];
        for (const p of candidates) {
            let weight = 1;
            const pos = mapTurkishPosition(p.position);
            if (pos === Position.FWD) weight = 15;
            else if (pos === Position.MID) weight = 5;
            else if (pos === Position.DEF) weight = 1;

            // Finishing bonus
            weight += Math.floor((p.attributes.finishing || 50) / 8);
            for (let i = 0; i < weight; i++) weighted.push(p);
        }
        return weighted[Math.floor(Math.random() * weighted.length)];
    };

    // 3. IMPROVED SIMULATION LOOP
    // Calculate power ratio - this heavily favors stronger teams
    const powerRatio = homePower.overall / Math.max(40, awayPower.overall);
    const awayRatio = awayPower.overall / Math.max(40, homePower.overall);

    for (let min = Math.floor(startMinute / 10) * 10; min < 90; min += 10) {
        if (min < startMinute) continue;

        // Less random momentum - stronger teams are more consistent
        const homeConsistency = Math.min(1.0, homePower.overall / 80); // 80+ OVR = max consistency
        const awayConsistency = Math.min(1.0, awayPower.overall / 80);

        const homeMomentum = 0.9 + (Math.random() * 0.2 * (1 - homeConsistency)) + (homeConsistency * 0.1);
        const awayMomentum = 0.9 + (Math.random() * 0.2 * (1 - awayConsistency)) + (awayConsistency * 0.1);

        // Attack vs Defense calculation - includes LUCK FACTOR & HOME ADVANTAGE
        const hAttackStrength = homePower.attack * homeAdvantage * homeMomentum * homeLuck;
        const aAttackStrength = awayPower.attack * awayMomentum * awayLuck;

        const hDefenseStrength = homePower.defense * homeAdvantage;
        const aDefenseStrength = awayPower.defense;

        // Goal probability - scales with power ratio
        // AGGRESSIVE DOMINANCE: Much stronger teams should score more and weaker teams much less
        // This reduces draws significantly
        const hRatio = hAttackStrength / Math.max(100, aDefenseStrength);
        const aRatio = aAttackStrength / Math.max(100, hDefenseStrength);

        const powerDiff = Math.abs(homePower.overall - awayPower.overall);
        // BALANCED DOMINANCE: Less aggressive exponent for fairer matches
        // Reduced from 1.6 to 1.2 and divisor from 40 to 55 for softer power curves
        // Example: 15 powerDiff now gives 1.13x instead of 1.20x multiplier
        const homeDominance = homePower.overall > awayPower.overall
            ? 1 + Math.pow(powerDiff / 55, 1.2) // Softer curve (was powerDiff/40, exp 1.6)
            : 1 / (1 + Math.pow(powerDiff / 55, 1.2));
        const awayDominance = awayPower.overall > homePower.overall
            ? 1 + Math.pow(powerDiff / 55, 1.2)
            : 1 / (1 + Math.pow(powerDiff / 55, 1.2));

        // Higher base chance but more variance - creates decisive results
        // Buffed base probability slightly (0.18 -> 0.20)
        const hGoalProb = Math.min(0.55, Math.max(0.02, Math.pow(hRatio, 2.0) * 0.20 * homeDominance));
        const aGoalProb = Math.min(0.50, Math.max(0.01, Math.pow(aRatio, 2.0) * 0.16 * awayDominance));

        const rollHome = Math.random();
        const rollAway = Math.random();

        // Separate rolls for each team (both can score in same period)
        if (rollHome < hGoalProb) {
            match.homeScore++;
            const scorer = pickScorer(homePlayers);
            match.events.push({ minute: min + getRandomInt(1, 9), type: MatchEventType.GOAL, teamId: homeTeam.id, playerId: scorer?.id, description: `Gol! (${scorer ? scorer.lastName : homeTeam.name})` });
        }
        if (rollAway < aGoalProb) {
            match.awayScore++;
            const scorer = pickScorer(awayPlayers);
            match.events.push({ minute: min + getRandomInt(1, 9), type: MatchEventType.GOAL, teamId: awayTeam.id, playerId: scorer?.id, description: `Gol! (${scorer ? scorer.lastName : awayTeam.name})` });
        }
    }

    match.isPlayed = true;
    match.events.push({ minute: 90, type: MatchEventType.FULL_TIME, description: 'Full Time' });
    return match;
}

export const simulateLeagueRound = (gameState: GameState, currentWeek: number): GameState => {
    // ========== SQUAD REGENERATION (Exploit Prevention) ==========
    // Minimum 16 players per team, position requirements enforced
    // Generated players are LOW QUALITY youth academy rejects (not exploitable)
    const MIN_SQUAD_SIZE = 16;
    const MIN_GK = 2;
    const MIN_DEF = 5;
    const MIN_MID = 5;
    const MIN_FWD = 4;

    let allPlayers = [...gameState.players];

    gameState.teams.forEach(team => {
        // Check ALL teams including user's team when they switch back
        const teamPlayers = allPlayers.filter(p => p.teamId === team.id);

        if (teamPlayers.length < MIN_SQUAD_SIZE) {
            // Count positions needed
            const gkCount = teamPlayers.filter(p => p.position === 'GK').length;
            const defCount = teamPlayers.filter(p => p.position === 'DEF').length;
            const midCount = teamPlayers.filter(p => p.position === 'MID').length;
            const fwdCount = teamPlayers.filter(p => p.position === 'FWD').length;

            const neededPositions: Position[] = [];
            if (gkCount < MIN_GK) for (let i = gkCount; i < MIN_GK; i++) neededPositions.push(Position.GK);
            if (defCount < MIN_DEF) for (let i = defCount; i < MIN_DEF; i++) neededPositions.push(Position.DEF);
            if (midCount < MIN_MID) for (let i = midCount; i < MIN_MID; i++) neededPositions.push(Position.MID);
            if (fwdCount < MIN_FWD) for (let i = fwdCount; i < MIN_FWD; i++) neededPositions.push(Position.FWD);

            // Generate LOW QUALITY youth academy rejects (exploit prevention)
            // These players are 50-60 overall, not worth selling!
            const nationalities = ['tr', 'br', 'de', 'fr', 'es', 'ar'];

            neededPositions.forEach(pos => {
                const newPlayer = generatePlayer(
                    team.id,
                    pos,
                    nationalities[Math.floor(Math.random() * nationalities.length)],
                    [17, 21], // Very young
                    [45, 55]  // LOW potential = LOW overall (not exploitable)
                );
                newPlayer.lineup = 'RESERVE';
                newPlayer.wage = 500; // Minimum wage
                newPlayer.value = 5000; // Almost worthless
                allPlayers.push(newPlayer);
            });
        }
    });

    // Update players array with regenerated players
    gameState = { ...gameState, players: allPlayers };

    // FIX: Simulate ALL matches for the current week across ALL leagues
    const matchesToSimulate = gameState.matches.filter(m => m.week === currentWeek && !m.isPlayed);

    // 🔥 PERFORMANS OPTİMİZASYONU (Mantık Değişikliği Değil, Hızlandırma)
    // Her maç için binlerce oyuncuyu tekrar tekrar filtrelemek yerine,
    // başta bir kez takımlara göre grupluyoruz. Bu işlem süresini ciddi düşürür.
    const playersByTeam = new Map<string, Player[]>();
    gameState.players.forEach(p => {
        if (!playersByTeam.has(p.teamId)) playersByTeam.set(p.teamId, []);
        playersByTeam.get(p.teamId)?.push(p);
    });

    matchesToSimulate.forEach(m => {
        const home = gameState.teams.find(t => t.id === m.homeTeamId);
        const away = gameState.teams.find(t => t.id === m.awayTeamId);
        if (home && away) {
            const homePlayers = playersByTeam.get(home.id) || [];
            const awayPlayers = playersByTeam.get(away.id) || [];

            // ========== DYNAMIC AI TACTICS ==========
            // AI analyzes opponent and adjusts tactics accordingly
            const homeStrength = homePlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(1, homePlayers.length);
            const awayStrength = awayPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(1, awayPlayers.length);

            // Adjust AI tactics based on opponent (skip if user team - they set their own)
            if (home.id !== gameState.userTeamId) {
                const strengthDiff = homeStrength - awayStrength;
                const isOnGoodForm = home.recentForm.filter(r => r === 'W').length >= 3;

                // HOME TEAM AI TACTIC LOGIC
                if (strengthDiff > 5) {
                    // Much stronger - attack aggressively
                    home.tactic.mentality = 'ATTACKING';
                    if (Math.random() < 0.3) home.tactic.formation = TacticType.T_433;
                } else if (strengthDiff < -5) {
                    // Much weaker - defend and counter
                    home.tactic.mentality = 'DEFENSIVE';
                    if (Math.random() < 0.3) home.tactic.formation = TacticType.T_541;
                } else {
                    // Evenly matched - home advantage, slight attack
                    home.tactic.mentality = isOnGoodForm ? 'ATTACKING' : 'BALANCED';
                }
            }

            if (away.id !== gameState.userTeamId) {
                const strengthDiff = awayStrength - homeStrength;
                const isOnGoodForm = away.recentForm.filter(r => r === 'W').length >= 3;

                // AWAY TEAM AI TACTIC LOGIC (more cautious away from home)
                if (strengthDiff > 8) {
                    // Much stronger even away - controlled attack
                    away.tactic.mentality = 'BALANCED';
                } else if (strengthDiff < -3) {
                    // Weaker away - park the bus
                    away.tactic.mentality = 'DEFENSIVE';
                    if (Math.random() < 0.4) away.tactic.formation = TacticType.T_532;
                } else {
                    // Evenly matched away - careful approach
                    away.tactic.mentality = isOnGoodForm ? 'BALANCED' : 'DEFENSIVE';
                }
            }

            // AI teams auto-pick their best available lineup before each match
            autoPickLineup(homePlayers, home.tactic.formation);
            autoPickLineup(awayPlayers, away.tactic.formation);

            // ADIL SİMÜLASYON - Sadece takım gücüne göre (torpil yok!)
            // ⚡ KRİTİK NOKTA: SENİN ORİJİNAL MOTORUN ÇALIŞIYOR
            simulateFullMatch(m, home, away, homePlayers, awayPlayers);

            const hScore = m.homeScore; const aScore = m.awayScore;
            const ptsHome = hScore > aScore ? 3 : hScore === aScore ? 1 : 0;
            const ptsAway = aScore > hScore ? 3 : hScore === aScore ? 1 : 0;
            const resultHome = hScore > aScore ? 'W' : hScore === aScore ? 'D' : 'L';
            const resultAway = aScore > hScore ? 'W' : aScore === hScore ? 'D' : 'L';

            home.stats.played++; home.stats.won += ptsHome === 3 ? 1 : 0; home.stats.drawn += ptsHome === 1 ? 1 : 0; home.stats.lost += ptsHome === 0 ? 1 : 0;
            home.stats.gf += hScore; home.stats.ga += aScore; home.stats.points += ptsHome; home.recentForm = [...home.recentForm, resultHome].slice(-5);

            away.stats.played++; away.stats.won += ptsAway === 3 ? 1 : 0; away.stats.drawn += ptsAway === 1 ? 1 : 0; away.stats.lost += ptsAway === 0 ? 1 : 0;
            away.stats.gf += aScore; away.stats.ga += hScore; away.stats.points += ptsAway; away.recentForm = [...away.recentForm, resultAway].slice(-5);

            // EUROPEAN CUP PRIZE MONEY (For User) - ADDED FIX
            const isEuropeanMatch = (gameState.europeanCup && (
                gameState.europeanCup.groups?.some(g => g.matches.some(em => em.id === m.id)) ||
                gameState.europeanCup.knockoutMatches?.some(em => em.id === m.id)
            ));

            if (isEuropeanMatch) {
                if (home.id === gameState.userTeamId) {
                    if (ptsHome === 3) home.budget += 500000;
                    if (ptsHome === 1) home.budget += 150000;
                } else if (away.id === gameState.userTeamId) {
                    if (ptsAway === 3) away.budget += 500000;

                    if (ptsAway === 1) away.budget += 150000;
                }
            }

            // SPONSOR WIN BONUS - Pay user team if they won
            const isUserHome = home.id === gameState.userTeamId;
            const isUserAway = away.id === gameState.userTeamId;
            if (isUserHome && hScore > aScore && home.sponsor?.winBonus) {
                home.budget += home.sponsor.winBonus;
            } else if (isUserAway && aScore > hScore && away.sponsor?.winBonus) {
                away.budget += away.sponsor.winBonus;
            }

            // Update Player Stats (Goals + ASSISTS)
            m.events.forEach(e => {
                if (e.type === MatchEventType.GOAL && e.playerId) {
                    // OPTIMIZATION: Search in local squad lists instead of global gameState.players
                    // This reduces complexity from O(total_players) to O(22) per goal
                    const scorer = homePlayers.find(p => p.id === e.playerId) || awayPlayers.find(p => p.id === e.playerId);

                    if (scorer) {
                        if (!scorer.stats) scorer.stats = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, averageRating: 0 };
                        scorer.stats.goals++;

                        // === ASSIST TRACKING ===
                        // Pick a random teammate (starting or bench) who could have assisted
                        // OPTIMIZATION: Use local squad list
                        const isHomeScorer = homePlayers.some(p => p.id === scorer.id);
                        const squad = isHomeScorer ? homePlayers : awayPlayers;

                        const teammates = squad.filter(p =>
                            p.id !== scorer.id &&
                            (p.lineup === 'STARTING' || p.lineup === 'BENCH')
                        );

                        if (teammates.length > 0) {
                            // Weight by position (midfielders and forwards more likely to assist)
                            const weightedTeammates: Player[] = [];
                            teammates.forEach(tm => {
                                const pos = mapTurkishPosition(tm.position);
                                let weight = 1;
                                if (pos === Position.FWD) weight = 4;
                                else if (pos === Position.MID) weight = 6;
                                else if (pos === Position.DEF) weight = 2;
                                // Passing bonus
                                weight += Math.floor((tm.attributes.passing || 50) / 20);
                                for (let i = 0; i < weight; i++) weightedTeammates.push(tm);
                            });

                            const assister = weightedTeammates[Math.floor(Math.random() * weightedTeammates.length)];
                            if (assister) {
                                if (!assister.stats) assister.stats = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, averageRating: 0 };
                                assister.stats.assists++;
                                // Store assist info in the event for rating calculation
                                (e as any).assisterId = assister.id;
                            }
                        }
                    }
                }
            });

            // Update Player Ratings & Appearances (For BOTH teams)
            const updatePlayerRatings = (players: Player[], teamId: string, isHome: boolean) => {
                const teamWon = isHome ? hScore > aScore : aScore > hScore;
                const teamDrew = hScore === aScore;
                const keptCleanSheet = isHome ? aScore === 0 : hScore === 0;
                const saves = isHome ? (m.stats?.homeSaves || 0) : (m.stats?.awaySaves || 0);

                // === MORAL FIX: Mark ALL players who played this week ===
                // This includes starters AND anyone who came on as a sub
                // (Subs already have lineup='STARTING' after substitution)
                players.filter(p => p.lineup === 'STARTING' || p.lineup === 'BENCH').forEach(p => {
                    // If they started OR were subbed in (events show SUB with their id)
                    const wasStarter = p.lineup === 'STARTING';
                    const wasSubbedIn = m.events.some(e => e.type === MatchEventType.SUB && e.playerId === p.id);

                    if (wasStarter || wasSubbedIn) {
                        p.playedThisWeek = true;
                    }
                });

                players.filter(p => p.lineup === 'STARTING').forEach(p => {
                    const oldApps = p.stats?.appearances || 0;
                    const newApps = oldApps + 1;

                    // Calculate Rating
                    let rating = 6.0 + (p.overall / 40) + (Math.random() * 1.5 - 0.5);
                    if (teamWon) rating += 0.5;
                    else if (teamDrew) rating += 0.1;
                    else rating -= 0.3;

                    // Clean Sheet Bonus (GK & DEF)
                    if (keptCleanSheet && (p.position === 'GK' || p.position === 'DEF')) rating += 0.8;

                    // GK Saves Bonus
                    if (p.position === 'GK') rating += (saves * 0.2);

                    // Goals Bonus
                    const goals = m.events.filter(e => e.type === MatchEventType.GOAL && e.playerId === p.id).length;
                    rating += (goals * 1.0);

                    // Assists Bonus
                    const assists = m.events.filter(e => e.type === MatchEventType.GOAL && (e as any).assisterId === p.id).length;
                    rating += (assists * 0.7);

                    // Yellow/Red Card Penalty
                    const yellowCards = m.events.filter(e => e.type === MatchEventType.CARD_YELLOW && e.playerId === p.id).length;
                    const redCards = m.events.filter(e => e.type === MatchEventType.CARD_RED && e.playerId === p.id).length;
                    rating -= (yellowCards * 0.3);
                    rating -= (redCards * 2.0);

                    // Cap
                    rating = Math.max(3.0, Math.min(10.0, rating));

                    // Update Stats
                    if (!p.stats) p.stats = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, averageRating: 0 };
                    p.stats.goals += goals;
                    p.stats.assists += assists;
                    p.stats.yellowCards += yellowCards;
                    p.stats.redCards += redCards;

                    // Update Average Rating
                    const oldAvg = p.stats.averageRating || 6.0;
                    const newAvg = ((oldAvg * oldApps) + rating) / newApps;

                    p.stats.appearances = newApps;
                    p.stats.averageRating = parseFloat(newAvg.toFixed(2));

                    // CARD SUSPENSIONS (NEW)
                    // Red Card = 1 match ban
                    if (redCards > 0) {
                        p.matchSuspension = (p.matchSuspension || 0) + 1;
                    }

                    // Yellow Card Accumulation (5 yellows = 1 match ban - FIFA standard)
                    if (yellowCards > 0) {
                        // Track season yellow cards separately
                        const seasonYellows = (p.stats.yellowCards || 0);
                        // Every 5th yellow card = suspension (FIFA rules)
                        if (seasonYellows % 5 === 0 && seasonYellows > 0) {
                            p.matchSuspension = (p.matchSuspension || 0) + 1;
                        }
                    }

                    // Form Update
                    p.form = Math.min(10, Math.max(1, p.form + (rating > 7.0 ? 1 : rating < 5.5 ? -1 : 0)));
                });
            };

            updatePlayerRatings(homePlayers, home.id, true);
            updatePlayerRatings(awayPlayers, away.id, false);

            // REPUTATION SYSTEM - ELO-STYLE: Symmetric risk/reward + GIANT KILLER BONUS
            const updateReputation = (team: Team, opponent: Team, won: boolean, drew: boolean) => {
                const teamRep = team.reputation;
                const opponentRep = opponent.reputation;

                // 1. Determine K-Factor (Volatility)
                // Domestic: 16 (Standard)
                // International: 24 (High Stakes - Champions League etc.)
                const isInternational = team.leagueId !== opponent.leagueId;
                const baseK = isInternational ? 24 : 16;

                // 2. Expected Outcome (ELO Formula)
                // 1500 scaling factor - bigger = less impact from rep difference
                const expectedOutcome = 1 / (1 + Math.pow(10, (opponentRep - teamRep) / 1500));

                // 3. Actual Result
                const actualResult = won ? 1 : drew ? 0.5 : 0;

                // 4. GIANT KILLER BONUS (The "Underdog" Logic)
                // If I am from a "weaker" league and I beat a team from a "stronger" league
                // This is checking LEAGUE strength, not just Team strength
                let giantKillerMultiplier = 1.0;

                if (won && isInternational) {
                    const myLeagueRep = getLeagueReputation(team.leagueId);
                    const oppLeagueRep = getLeagueReputation(opponent.leagueId);
                    const leagueDiff = oppLeagueRep - myLeagueRep;

                    // Only bonus if beating a team from a PRESTIGIOUS league
                    // Example: TR (60) beats EN (90) -> Diff 30
                    if (leagueDiff > 0) {
                        // Formula: 1 + (Diff / 12)
                        // Diff 30 (EN-TR) -> 1 + 2.5 = 3.5x Multiplier! (Huge Reward)
                        // Diff 12 (FR-TR) -> 1 + 1.0 = 2.0x Multiplier
                        giantKillerMultiplier = 1.0 + (leagueDiff / 12);
                    }
                }

                // ELO change formula: K * (Actual - Expected) * multiplier
                let change = Math.round(baseK * (actualResult - expectedOutcome) * 1.5 * giantKillerMultiplier);

                // Cap maximum loss at -20 to prevent death spiral
                if (change < -20) change = -20;

                // UNCAP WINS! If you take down a giant, you deserve +100 points.
                // But let's set a sanity limit of +150 just in case.
                if (change > 150) change = 150;

                // Minimum change for wins/losses (no 0-point matches)
                if (won && change < 2) change = 2;
                if (!won && !drew && change > -2) change = -2;

                const newReputation = Math.max(1000, Math.min(10000, teamRep + change));

                // Record history (only for user team to save memory)
                if (team.id === gameState.userTeamId && change !== 0) {
                    const resultText = won ? 'G' : drew ? 'B' : 'M';
                    // Add fire icon specifically for giant killings
                    const magicIcon = giantKillerMultiplier > 1.5 ? ' 🔥' : '';
                    const reason = `${opponent.name} (${resultText})${magicIcon}`;

                    const history = team.reputationHistory || [];
                    history.push({ week: gameState.currentWeek, change, reason, newValue: newReputation });
                    // Keep only last 20 entries
                    team.reputationHistory = history.slice(-20);
                }

                team.reputation = newReputation;
            };

            updateReputation(home, away, hScore > aScore, hScore === aScore);
            updateReputation(away, home, aScore > hScore, hScore === aScore);

            // === BOARD CONFIDENCE SYSTEM ===
            // Only update for user team (AI teams don't need this)
            const updateBoardConfidence = (team: Team, opponent: Team, won: boolean, drew: boolean, goalsFor: number, goalsAgainst: number) => {
                if (team.id !== gameState.userTeamId) return; // Only for user team

                const opponentRep = opponent.reputation;
                const repDiff = opponentRep - team.reputation;
                let change = 0;

                // Check Context (Derby, Cup, etc.)
                const rivals = DERBY_RIVALS[team.name] || [];
                const isDerby = rivals.includes(opponent.name);

                // European Match Check
                const isEuropeanMatch = (gameState.europeanCup && (
                    gameState.europeanCup.groups?.some(g => g.matches.some(em => em.id === m.id)) ||
                    gameState.europeanCup.knockoutMatches?.some(em => em.id === m.id)
                ));

                // Multipliers
                let importanceMultiplier = 1.0;
                if (isDerby) importanceMultiplier = 2.0; // Derbies count double!
                if (isEuropeanMatch) importanceMultiplier = 1.5; // European glory matters

                if (won) {
                    // Win = Board is happy
                    if (repDiff > 500) change = 8;        // Beat much stronger team = +8 (was +6)
                    else if (repDiff > 0) change = 6;     // Beat stronger team = +6 (was +4)
                    else change = 4;                       // Beat weaker/equal = +4 (was +2)

                    // Dominant win bonus
                    if (goalsFor - goalsAgainst >= 3) change += 2;
                } else if (drew) {
                    // Draw
                    if (repDiff > 500) change = 1;        // Draw against much stronger = +1
                    else if (repDiff < -500) change = -2; // Draw against much weaker = -2
                    else change = -1;                      // Normal draw = -1
                } else {
                    // Loss = Board is unhappy
                    if (repDiff < -500) change = -5;      // Lost to much weaker = -5 (was -8)
                    else if (repDiff < 0) change = -4;    // Lost to weaker = -4 (was -5)
                    else change = -2;                      // Lost to stronger/equal = -2 (was -3)

                    // Heavy loss penalty
                    if (goalsAgainst - goalsFor >= 3) change -= 1; // (was -2)
                }

                // Apply Multiplier
                change = Math.round(change * importanceMultiplier);

                // Consecutive losses streak check
                const recentLosses = (team.recentForm || []).slice(-3).filter(r => r === 'L').length;
                if (recentLosses >= 3) change -= 2; // Extra -2 for 3+ consecutive losses (was -3)

                // BUG FIX: Handle 0 correctly (don't fallback to 70 if it's 0)
                // If it's undefined, start at 70. If it's valid (even 0), usage it.
                const currentConfidence = team.boardConfidence !== undefined ? team.boardConfidence : 70;
                const newConfidence = Math.max(0, Math.min(100, currentConfidence + change));

                team.boardConfidence = newConfidence;

                // FIRING LOGIC
                // STRICT CHECK: IF CONFIDENCE DROPS BELOW 1, YOU ARE FIRED immediately
                console.log(`[Board Confidence] ${team.name}: ${currentConfidence} → ${newConfidence} (change: ${change})`);

                if (newConfidence <= 0) {
                    console.warn(`[FIRING] ${team.name} manager FIRED! Confidence: ${newConfidence}`);
                    // Force firing immediately
                    gameState.isGameOver = true;
                    gameState.gameOverReason = 'FIRED';
                } else if (newConfidence <= 5) {
                    console.warn(`[WARNING] ${team.name} manager in danger zone! Confidence: ${newConfidence}%`);
                    // Warning zone - near firing
                    // (Logic handled in UI optionally, but we ensure it doesn't fire at >0)
                }

                // Record history
                if (change !== 0) {
                    const resultText = won ? 'Galibiyet' : drew ? 'Beraberlik' : 'Mağlubiyet';
                    const score = `${goalsFor}-${goalsAgainst}`;
                    let reason = `${opponent.name} ${resultText} (${score})`;

                    if (isDerby) reason += ' 🔥 (Derbi)';
                    if (isEuropeanMatch) reason += ' 🇪🇺 (Avrupa)';

                    const history = team.confidenceHistory || [];
                    history.push({ week: gameState.currentWeek, change, reason, newValue: newConfidence });
                    // Keep only last 20 entries
                    team.confidenceHistory = history.slice(-20);
                }

                team.boardConfidence = newConfidence;
            };

            updateBoardConfidence(home, away, hScore > aScore, hScore === aScore, hScore, aScore);
            updateBoardConfidence(away, home, aScore > hScore, hScore === aScore, aScore, hScore);
        }
    });
    // SIMULATE GLOBAL CUP MATCHES FOR THIS WEEK (If any)
    if (gameState.europeanCup && gameState.europeanCup.isActive) {
        const { updatedCup, updatedTeams } = simulateAIGlobalCupMatches(
            gameState.europeanCup,
            gameState.teams,
            gameState.players,
            gameState.userTeamId,
            gameState.currentWeek
        );
        gameState.europeanCup = updatedCup;
        gameState.teams = updatedTeams;
    }

    // SIMULATE EUROPA LEAGUE MATCHES FOR THIS WEEK (If any) - FIX: Was missing!
    if (gameState.europaLeague && gameState.europaLeague.isActive) {
        const { updatedCup, updatedTeams } = simulateAIGlobalCupMatches(
            gameState.europaLeague,
            gameState.teams,
            gameState.players,
            gameState.userTeamId,
            gameState.currentWeek,
            0.4 // EUROPA LEAGUE MULTIPLIER (40% of CL Money)
        );
        gameState.europaLeague = updatedCup;
        gameState.teams = updatedTeams;
    }

    return { ...gameState };
}

export const handlePlayerInteraction = (player: Player, type: 'PRAISE' | 'CRITICIZE' | 'MOTIVATE', intensity: 'LOW' | 'HIGH'): { success: boolean, message: string, moraleChange: number } => {
    let success = false; let change = 0;
    const isProfessional = (player.attributes.leadership || 0) > 75;
    const isAmbitious = (player.attributes.aggression || 0) > 75;
    if (type === 'PRAISE') {
        if (player.form > 7 || player.morale < 60) { success = true; change = intensity === 'HIGH' ? 10 : 5; }
        else { if (intensity === 'HIGH' && isProfessional) { success = false; change = -2; } else { success = true; change = 3; } }
    } else if (type === 'CRITICIZE') {
        if (player.form < 6) { if (isAmbitious || isProfessional) { success = true; change = 5; } else { success = false; change = -10; } }
        else { success = false; change = -15; }
    } else if (type === 'MOTIVATE') { if (player.morale < 50) { success = true; change = 15; } else { success = true; change = 2; } }
    return { success, message: success ? "The player responded positively." : "The player seemed annoyed.", moraleChange: change };
}

export const processWeeklyEvents = (gameState: GameState, t: any) => {
    const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
    const intensity = userTeam?.trainingIntensity || 'NORMAL';
    const physioLevel = userTeam?.staff?.physioLevel || 1;
    const headCoachLevel = userTeam?.staff?.headCoachLevel || 1;

    // === RESET playedThisWeek FLAG FOR ALL PLAYERS ===
    // This flag is set during match simulation when a player plays
    // Reset at start of week so it can be tracked for next week
    gameState.players.forEach(p => {
        p.playedThisWeek = false;
    });

    // Enhanced physio effect on recovery
    const physioBonus = physioLevel * 3; // Reduced from 4 to 3 per level
    let recoveryBase = 25 + physioBonus; // NORMAL: 25 (was 30) - slower recovery
    if (intensity === 'LIGHT') recoveryBase = 40 + physioBonus; // LIGHT: 40 (was 45)
    if (intensity === 'HEAVY') recoveryBase = 5 + physioBonus;  // HEAVY: 5 (was 15) - BİG DISADVANTAGE!

    // Injury risk calculation based on intensity and physio
    const baseInjuryRisk = intensity === 'HEAVY' ? 0.08 : intensity === 'NORMAL' ? 0.02 : 0.005;
    const injuryRiskReduction = physioLevel * 0.008; // Each physio level reduces injury risk by 0.8%
    const finalInjuryRisk = Math.max(0.005, baseInjuryRisk - injuryRiskReduction);

    const newMessages: Message[] = [];
    const report: string[] = [];

    // Localized training intensity name
    const intensityLabel = intensity === 'LIGHT' ? t.intensityLight : intensity === 'HEAVY' ? t.intensityHeavy : t.intensityNormal;
    if (userTeam) {
        report.push(t.trainingIntensityReport.replace('{intensity}', intensityLabel).replace('{recovery}', recoveryBase.toString()));
    }

    // UPDATE ALL PLAYERS GLOBALLY
    let updatedPlayers = gameState.players.map(p => {
        const isUserPlayer = p.teamId === gameState.userTeamId;
        const playerTeam = gameState.teams.find(t => t.id === p.teamId);

        let rec = recoveryBase;
        if (!isUserPlayer) {
            // AI Condition Recovery now depends on facilities (Adil Oyun)
            // Base 25 + (Level * 1.5). Level 1 = 26.5, Level 10 = 40, Level 20 = 55.
            const aiTrainingLevel = playerTeam?.facilities?.trainingLevel || 1;
            rec = 25 + (aiTrainingLevel * 1.5);
        }
        let newMorale = p.morale;
        let newWeeksInjured = Math.max(0, p.weeksInjured - 1);

        // INJURY SYSTEM for user players during training
        if (isUserPlayer && p.weeksInjured === 0) {
            const injuryProneness = p.hiddenAttributes?.injuryProneness || 10;
            const personalRisk = finalInjuryRisk * (1 + (injuryProneness - 10) * 0.05);

            if (Math.random() < personalRisk) {
                const severityRoll = Math.random();
                if (severityRoll < 0.6) {
                    newWeeksInjured = 1 + Math.floor(Math.random() * 2); // 1-2 weeks (minor)
                } else if (severityRoll < 0.9) {
                    newWeeksInjured = 3 + Math.floor(Math.random() * 3); // 3-5 weeks (moderate)
                } else {
                    newWeeksInjured = 6 + Math.floor(Math.random() * 6); // 6-11 weeks (severe)
                }

                // Physio reduces injury duration
                newWeeksInjured = Math.max(1, newWeeksInjured - Math.floor(physioLevel / 3));

                newMessages.push({
                    id: uuid(),
                    week: gameState.currentWeek,
                    type: MessageType.INJURY,
                    subject: t.injurySubject.replace('{name}', p.lastName),
                    body: t.injuryBody.replace('{name}', `${p.firstName} ${p.lastName}`).replace('{weeks}', newWeeksInjured.toString()),
                    isRead: false,
                    date: new Date().toISOString()
                });
            }
        }

        if (isUserPlayer) {
            let moraleReason = '';

            // === MORAL FIX: Check if player PLAYED this week (not just lineup status) ===
            // A player who started and got subbed out should get CREDIT for playing!
            if (p.playedThisWeek) {
                // Player played this week (started or came on as sub) - morale boost!
                newMorale = Math.min(100, newMorale + 2);
                moraleReason = t.moralePlayed;
            } else if (p.lineup === 'STARTING') {
                // Lineup says starting but didn't play? (Edge case - shouldn't happen normally)
                newMorale = Math.min(100, newMorale + 2);
                moraleReason = t.moraleStarting;
            } else if (p.lineup === 'BENCH') {
                // On bench and didn't play - neutral (they're ready to play)
                moraleReason = t.moraleBench;
                // newMorale stays same
            } else {
                // RESERVE - Kadro dışı AND didn't play this week
                if (p.overall > 75) {
                    newMorale = Math.max(0, newMorale - 3);
                    moraleReason = t.moraleReserveStar;
                    if (newMorale < 40 && Math.random() > 0.8) {
                        newMessages.push({
                            id: uuid(),
                            week: gameState.currentWeek,
                            type: MessageType.INFO,
                            subject: t.unhappyPlayer,
                            body: t.unhappyPlayerDesc.replace('{name}', p.lastName),
                            isRead: false,
                            date: new Date().toISOString()
                        });
                    }
                } else if (p.overall > 65) {
                    // Orta seviye oyuncular hafif moral düşüşü
                    newMorale = Math.max(0, newMorale - 1);
                    moraleReason = t.moraleReserve;
                } else {
                    // 65 altı oyuncular stabil (genç/düşük seviye)
                    moraleReason = t.moraleReserveStable;
                }
            }

            // === MORAL HISTORY TRACKING ===
            const moraleChange = newMorale - p.morale;
            if (moraleChange !== 0) {
                if (!p.moraleHistory) p.moraleHistory = [];
                p.moraleHistory.push({
                    week: gameState.currentWeek,
                    change: moraleChange,
                    reason: moraleReason
                });
                // Keep only last 10 entries
                if (p.moraleHistory.length > 10) {
                    p.moraleHistory = p.moraleHistory.slice(-10);
                }
            }
        }

        // DEVELOPMENT LOGIC (Global) with Training Focus
        let newOverall = p.overall;
        let newAttributes = { ...p.attributes };

        // Young players develop based on exact age brackets (User Request)
        if (p.age < 28 && p.overall < p.potential) {
            let developmentChance = 0.01; // Base

            // 1. Age Factor (Exact User Math)
            if (p.age < 21) developmentChance = 0.05; // 5% (Very Fast)
            else if (p.age < 24) developmentChance = 0.03; // 3% (Normal)
            else if (p.age < 28) developmentChance = 0.01; // 1% (Slow)

            let trainingBoost: (keyof typeof newAttributes)[] = [];

            if (isUserPlayer && userTeam) {
                const headCoachLevel = userTeam.staff?.headCoachLevel || 1;
                const trainingLevel = userTeam.facilities?.trainingLevel || 1;

                // 2. Facility Effect: +0.5% per Training Level, +0.8% per Coach Level
                // Convert percentage to probability (0.5% = 0.005)
                const facilityBonus = (trainingLevel * 0.005) + (headCoachLevel * 0.008);
                developmentChance += facilityBonus;

                // Training Focus affects which attributes improve
                const focus = userTeam.trainingFocus || 'BALANCED';
                if (focus === 'ATTACK') {
                    trainingBoost = ['finishing', 'dribbling', 'positioning'];
                } else if (focus === 'DEFENSE') {
                    trainingBoost = ['tackling', 'positioning', 'strength'];
                } else if (focus === 'PHYSICAL') {
                    trainingBoost = ['speed', 'stamina', 'strength'];
                } else if (focus === 'TECHNICAL') {
                    trainingBoost = ['passing', 'dribbling', 'vision'];
                } else if (focus === 'POSITION_BASED') {
                    // Each player trains based on their position
                    if (p.position === 'FWD') {
                        trainingBoost = ['finishing', 'dribbling', 'speed'];
                    } else if (p.position === 'MID') {
                        trainingBoost = ['passing', 'vision', 'stamina'];
                    } else if (p.position === 'DEF') {
                        trainingBoost = ['tackling', 'positioning', 'strength'];
                    } else if (p.position === 'GK') {
                        trainingBoost = ['goalkeeping', 'composure', 'strength'];
                    }
                }
            } else if (playerTeam) {
                const trainingLevel = playerTeam.facilities?.trainingLevel || 1;
                developmentChance = 0.03 + (trainingLevel * 0.008);
            }

            if (Math.random() < developmentChance) {
                newOverall = Math.min(p.potential, p.overall + 1);

                // Apply focused attribute boost for user players
                let boostedAttr = '';
                if (isUserPlayer && trainingBoost.length > 0 && Math.random() < 0.5) {
                    const attrToBoost = trainingBoost[Math.floor(Math.random() * trainingBoost.length)];
                    newAttributes[attrToBoost] = Math.min(99, (newAttributes[attrToBoost] || 50) + 1);
                    // Localized attribute names
                    const attrNames: Record<string, string> = {
                        finishing: t.attrFinishing, dribbling: t.attrDribbling, positioning: t.attrPositioning,
                        tackling: t.attrTackling, strength: t.attrStrength, speed: t.attrSpeed,
                        stamina: t.attrStamina, passing: t.attrPassing, vision: t.attrVision,
                        goalkeeping: t.attrGoalkeeping, composure: t.attrComposure, leadership: t.attrLeadership, decisions: t.attrDecisions
                    };
                    boostedAttr = attrNames[attrToBoost] || attrToBoost;
                }

                if (isUserPlayer && newOverall > p.overall) {
                    const focusLabel = userTeam?.trainingFocus !== 'BALANCED' ? ` (${userTeam?.trainingFocus})` : '';
                    if (boostedAttr) {
                        report.push(`⬆️ ${p.firstName} ${p.lastName}: ${boostedAttr} +1${focusLabel}`);
                    } else {
                        report.push(`⬆️ ${p.firstName} ${p.lastName}: ${t.reportGeneralDev}${focusLabel}`);
                    }
                }
            }
        }

        // DECLINE LOGIC (Global) - Older players might lose stats
        if (p.age > 32) {
            if (Math.random() < 0.05) { // 5% chance per week
                newOverall = Math.max(40, p.overall - 1);
            }
        }

        return {
            ...p,
            attributes: newAttributes,
            overall: newOverall,
            // Updated value formula with 1.12 multiplier
            value: (Math.pow(1.12, newOverall - 40) * 15000) * (1 + (p.potential - newOverall) / 15),
            condition: Math.min(100, p.condition + rec),
            weeksInjured: newWeeksInjured,
            matchSuspension: Math.max(0, (p.matchSuspension || 0) > 0 ? p.matchSuspension - 1 : 0), // Decrement suspension
            morale: newMorale
        }
    });

    // Finance logic from previous version incorporated for localization
    if (userTeam) {
        const teamPlayers = updatedPlayers.filter(p => p.teamId === userTeam.id);
        const totalSalaries = teamPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
        const weeklyWages = totalSalaries / 52;

        userTeam.wages = Math.round(weeklyWages); // Update team stat

        // League Multiplier (includes European success bonus!)
        const leagueMult = getLeagueMultiplier(userTeam.leagueId || 'tr');

        // BALANCED: Facility costs scale with level exponentially
        // Using 1.3 exponent (reduced from 1.6) for more sustainable progression
        const maintenanceDiscount = ['tr', 'fr'].includes(userTeam.leagueId) ? 0.7 : 1.0; // 30% discount for smaller leagues
        const stadiumMaint = Math.pow(userTeam.facilities.stadiumLevel, 1.3) * 2000 * maintenanceDiscount;
        const trainingMaint = Math.pow(userTeam.facilities.trainingLevel, 1.3) * 1500 * maintenanceDiscount;
        const academyMaint = Math.pow(userTeam.facilities.academyLevel, 1.3) * 1200 * maintenanceDiscount;
        const maintenance = (stadiumMaint + trainingMaint + academyMaint) * (0.8 + (leagueMult * 0.2));

        // Staff costs also scale with level
        const staffCosts = (
            Math.pow(userTeam.staff.headCoachLevel, 1.3) * 5000 +
            Math.pow(userTeam.staff.scoutLevel, 1.3) * 3000 +
            Math.pow(userTeam.staff.physioLevel, 1.3) * 4000
        ) * (0.8 + (leagueMult * 0.2));

        // Find current week's match to check if it's a derby
        const currentMatch = gameState.matches.find(m =>
            m.week === gameState.currentWeek &&
            (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id)
        );
        const isHomeWeek = currentMatch?.homeTeamId === userTeam.id;

        // Check if this is a derby match (100% attendance!)
        let isDerby = false;
        let opponentReputation = 0;
        if (currentMatch) {
            const opponentId = isHomeWeek ? currentMatch.awayTeamId : currentMatch.homeTeamId;
            const opponent = gameState.teams.find(t => t.id === opponentId);
            if (opponent) {
                const rivals = DERBY_RIVALS[userTeam.name] || [];
                isDerby = rivals.includes(opponent.name);
                opponentReputation = opponent.reputation;
            }
        }

        // =====================================================
        // DYNAMIC ATTENDANCE SYSTEM - Realistic crowd behavior
        // =====================================================

        // Get league-specific ticket price (Turkey €18, England €55, etc.)
        // DYNAMIC: Ticket prices scale with league coefficient (successful leagues = higher demand)
        const baseTicketPrice = LEAGUE_TICKET_PRICES[userTeam.leagueId] || LEAGUE_TICKET_PRICES['default'];
        const coeffMultiplier = getCoefficientMultiplier(userTeam.leagueId);
        const leagueTicketPrice = Math.floor(baseTicketPrice * coeffMultiplier);

        // Get league-specific attendance rates
        const attendanceRates = LEAGUE_ATTENDANCE_RATES[userTeam.leagueId] || LEAGUE_ATTENDANCE_RATES['default'];

        // Calculate base attendance from reputation
        const repFactor = Math.min(1, (userTeam.reputation - 5000) / 5000); // 0-1 scale
        let baseAttendance = attendanceRates.min + (attendanceRates.max - attendanceRates.min) * repFactor;
        const randomVariance = (Math.random() * 0.10) - 0.05; // ±5% variance

        // ========== ATTENDANCE BONUSES ==========

        // 1. DERBY BONUS: 100% attendance for derbies!
        let attendanceBonus = 0;
        let bonusReason = '';

        if (isDerby) {
            attendanceBonus = 1.0 - baseAttendance; // Fill to 100%
            bonusReason = 'derby';
        } else {
            // 2. BIG TEAM BONUS: When playing against a more reputable opponent
            // Example: Göztepe vs Beşiktaş - tribunes fill up!
            const reputationDiff = opponentReputation - userTeam.reputation;
            if (reputationDiff > 500) { // Lower threshold (was 1000)
                // Opponent is significantly more prestigious
                const bigTeamBonus = Math.min(0.40, reputationDiff / 5000); // Up to +40% (was +25%, divided by 10000)
                attendanceBonus = Math.max(attendanceBonus, bigTeamBonus);
                bonusReason = 'big_team';
            }

            // 2b. TOP LEAGUE TEAM BONUS: Playing against league leaders
            if (currentMatch) {
                const opponentId = isHomeWeek ? currentMatch.awayTeamId : currentMatch.homeTeamId;
                const opponent = gameState.teams.find(t => t.id === opponentId);
                if (opponent) {
                    const leagueTeams = gameState.teams
                        .filter(t => t.leagueId === opponent.leagueId)
                        .sort((a, b) => b.stats.points - a.stats.points);
                    const opponentPos = leagueTeams.findIndex(t => t.id === opponent.id) + 1;

                    // League leader coming to town = +25% attendance
                    if (opponentPos === 1) {
                        attendanceBonus = Math.max(attendanceBonus, 0.25);
                        if (!bonusReason) bonusReason = 'league_leader';
                    }
                    // Top 3 opponent = +15% attendance
                    else if (opponentPos <= 3) {
                        attendanceBonus = Math.max(attendanceBonus, 0.15);
                        if (!bonusReason) bonusReason = 'top_team';
                    }
                }
            }

            // 3. CHAMPIONSHIP RACE BONUS: Late season matches with tight standings
            if (gameState.currentWeek >= 28) { // Last 10 weeks
                const leagueTeams = gameState.teams
                    .filter(t => t.leagueId === userTeam.leagueId)
                    .sort((a, b) => b.stats.points - a.stats.points);
                const userPos = leagueTeams.findIndex(t => t.id === userTeam.id) + 1;
                const leadingTeam = leagueTeams[0];
                const pointsGap = leadingTeam ? leadingTeam.stats.points - userTeam.stats.points : 999;

                // Title race bonus: Top 3 with close gap
                if (userPos <= 3 && pointsGap <= 6) {
                    attendanceBonus = Math.max(attendanceBonus, 0.20); // +20%
                    bonusReason = 'title_race';
                }
                // Relegation battle bonus
                else if (userPos >= leagueTeams.length - 3) {
                    attendanceBonus = Math.max(attendanceBonus, 0.15); // +15%
                    bonusReason = 'survival_battle';
                }
            }

            // 4. SEASON FINALE BONUS: Last 3 weeks
            if (gameState.currentWeek >= 35) {
                attendanceBonus = Math.max(attendanceBonus, 0.15); // +15%
                if (!bonusReason) bonusReason = 'season_finale';
            }
        }

        // Calculate final attendance (capped at 100%)
        const attendance = Math.min(1.0, baseAttendance + attendanceBonus + randomVariance);

        // =====================================================
        // STADIUM CAPACITY FROM LEVEL - Same formula worldwide
        // Level 1 = 5,000 | Level 25 = 150,000
        // Each level = +6,000 seats
        // =====================================================
        const STADIUM_MIN = 5000;
        const STADIUM_CAPACITY_PER_LEVEL = 6000; // ~6,042 rounded
        const effectiveCapacity = STADIUM_MIN + (userTeam.facilities.stadiumLevel - 1) * STADIUM_CAPACITY_PER_LEVEL;

        // Ticket income: Only when home, with realistic prices and attendance
        // +30% INCOME BOOST
        const ticketIncome = isHomeWeek
            ? Math.floor(effectiveCapacity * leagueTicketPrice * attendance * 1.3)
            : 0;

        // Merchandise: Scaled down significantly, based on reputation (+30% BOOST)
        const starPlayerBonus = teamPlayers.filter(p => p.overall > 85).length * 5000;
        const merchandise = Math.floor(((userTeam.reputation * 2) + starPlayerBonus) * (0.7 + (leagueMult * 0.3)) * 1.3);

        // TV Rights - REALISTIC: Based on real data
        // Turkey: ~€200k/week for big clubs, England: ~€2M/week for big clubs
        const leaguePosition = gameState.teams
            .filter(t => t.leagueId === userTeam.leagueId)
            .sort((a, b) => b.stats.points - a.stats.points)
            .findIndex(t => t.id === userTeam.id) + 1;

        // Base TV rights by league (weekly) - BALANCED for fair progression
        // DYNAMIC: TV rights also scale with league coefficient (global viewership follows success)
        const baseTvRightsValues: Record<string, number> = {
            'tr': 320000,   // Turkey: €320k (increased for better sustainability)
            'en': 850000,   // England: €850k (reduced from 1.2M to narrow gap)
            'es': 600000,   // Spain: €600k
            'it': 500000,   // Italy: €500k
            'de': 550000,   // Germany: €550k
            'fr': 400000,   // France: €400k
            'ar': 150000,   // Argentina: €150k
            'br': 200000,   // Brazil: €200k
            'default': 200000
        };
        const tvBaseValue = baseTvRightsValues[userTeam.leagueId] || baseTvRightsValues['default'];
        // Apply coefficient multiplier to TV rights (more successful league = more global viewers)
        const tvBase = Math.floor(tvBaseValue * coeffMultiplier);

        // Position bonus: Top teams get more TV money (merit-based distribution) (+30% BOOST)
        const positionMultiplier = Math.max(0.5, 1.5 - ((leaguePosition - 1) * 0.05)); // 1.5x for 1st, down to 0.5x for last
        const repMultiplier = 0.8 + ((userTeam.reputation - 5000) / 10000) * 0.4; // 0.8x to 1.2x based on rep
        const tvRights = Math.floor(tvBase * positionMultiplier * repMultiplier * 1.3);

        // Sponsor income (or default smaller amount if no sponsor) (+30% BOOST)
        // DYNAMIC: Scale sponsor income with coefficient multiplier (successful leagues = better deals)
        const sponsorIncome = userTeam.sponsor
            ? Math.floor(userTeam.sponsor.weeklyIncome * 1.3 * coeffMultiplier)
            : Math.floor(50000 * Math.sqrt(leagueMult) * 1.3 * coeffMultiplier);

        const weeklyIncome = ticketIncome + merchandise + tvRights + sponsorIncome;
        const weeklyExpenses = weeklyWages + maintenance + staffCosts;

        userTeam.budget += (weeklyIncome - weeklyExpenses);

        // Preserve existing history across weeks
        const existingUserFinancialHistory = userTeam.financials?.history ? [...userTeam.financials.history] : [];
        const existingUserSeasonTotals = userTeam.financials?.seasonTotals ? { ...userTeam.financials.seasonTotals } : undefined;
        userTeam.financials = {
            lastWeekIncome: { tickets: ticketIncome, sponsor: sponsorIncome, merchandise, tvRights, transfers: 0, winBonus: 0 },
            lastWeekExpenses: { wages: weeklyWages, maintenance, academy: academyMaint, transfers: 0 },
            seasonTotals: existingUserSeasonTotals,
            history: existingUserFinancialHistory
        };

        const balance = weeklyIncome - weeklyExpenses;

        // Finansal geçmiş kaydı ekle

        const budgetBefore = userTeam.budget - (weeklyIncome - weeklyExpenses);
        const financialRecord: any = {
            week: gameState.currentWeek,
            season: gameState.currentSeason,
            income: {
                tickets: ticketIncome,
                sponsor: sponsorIncome,
                merchandise,
                tvRights,
                transfers: 0,
                winBonus: 0,
                total: weeklyIncome
            },
            expenses: {
                wages: weeklyWages,
                maintenance,
                academy: academyMaint,
                transfers: 0,
                total: weeklyExpenses
            },
            balance,
            budgetBefore,
            budgetAfter: userTeam.budget
        };

        if (!userTeam.financials.history) userTeam.financials.history = [];
        // Upsert: if a cup prize created a record for this week, merge into it.
        const existingIdx = userTeam.financials.history.findIndex(r => r.week === gameState.currentWeek && r.season === gameState.currentSeason);
        if (existingIdx >= 0) {
            const existing = userTeam.financials.history[existingIdx] as any;
            existing.income.tickets = (existing.income.tickets || 0) + financialRecord.income.tickets;
            existing.income.sponsor = (existing.income.sponsor || 0) + financialRecord.income.sponsor;
            existing.income.merchandise = (existing.income.merchandise || 0) + financialRecord.income.merchandise;
            existing.income.tvRights = (existing.income.tvRights || 0) + financialRecord.income.tvRights;
            existing.income.transfers = (existing.income.transfers || 0) + financialRecord.income.transfers;
            existing.income.winBonus = (existing.income.winBonus || 0) + financialRecord.income.winBonus;

            existing.expenses.wages = (existing.expenses.wages || 0) + financialRecord.expenses.wages;
            existing.expenses.maintenance = (existing.expenses.maintenance || 0) + financialRecord.expenses.maintenance;
            existing.expenses.academy = (existing.expenses.academy || 0) + financialRecord.expenses.academy;
            existing.expenses.transfers = (existing.expenses.transfers || 0) + financialRecord.expenses.transfers;

            const incomeTotal = (existing.income.tickets || 0) + (existing.income.sponsor || 0) + (existing.income.merchandise || 0) + (existing.income.tvRights || 0) + (existing.income.transfers || 0) + (existing.income.winBonus || 0) + (existing.income.seasonEnd || 0) + (existing.income.cupPrize || 0);
            const expenseTotal = (existing.expenses.wages || 0) + (existing.expenses.maintenance || 0) + (existing.expenses.academy || 0) + (existing.expenses.transfers || 0) + (existing.expenses.facilityUpgrade || 0) + (existing.expenses.staffUpgrade || 0);
            existing.income.total = incomeTotal;
            existing.expenses.total = expenseTotal;
            existing.balance = incomeTotal - expenseTotal;
            existing.budgetBefore = Math.min(existing.budgetBefore ?? budgetBefore, budgetBefore);
            existing.budgetAfter = userTeam.budget;
        } else {
            userTeam.financials.history.push(financialRecord);
        }
        // Son 10 kaydı tut
        if (userTeam.financials.history.length > 10) {
            userTeam.financials.history = userTeam.financials.history.slice(-10);
        }

        userTeam.financials.lastWeekIncome = { tickets: ticketIncome, sponsor: sponsorIncome, merchandise, tvRights, transfers: 0, winBonus: 0 };
        userTeam.financials.lastWeekExpenses = { wages: weeklyWages, maintenance, academy: academyMaint, transfers: 0 };

        newMessages.push({
            id: uuid(),
            week: gameState.currentWeek,
            type: MessageType.INFO,
            subject: t.financeReport,
            body: `${balance >= 0 ? t.financeReportProfit.replace('{amount}', balance.toLocaleString()) : t.financeReportLoss.replace('{amount}', Math.abs(balance).toLocaleString())} ${t.currentBalance.replace('{amount}', userTeam.budget.toLocaleString())}`,
            isRead: false,
            date: new Date().toISOString()
        });

        // === STADIUM CONSTRUCTION PROGRESS ===
        if (userTeam.facilities.stadiumConstructionWeeks && userTeam.facilities.stadiumConstructionWeeks > 0) {
            userTeam.facilities.stadiumConstructionWeeks -= 1;

            if (userTeam.facilities.stadiumConstructionWeeks <= 0) {
                // CONSTRUCTION COMPLETE!
                userTeam.facilities.stadiumConstructionWeeks = 0;
                userTeam.facilities.stadiumLevel += 1;
                userTeam.facilities.stadiumCapacity += 6000;

                newMessages.push({
                    id: uuid(),
                    week: gameState.currentWeek,
                    type: MessageType.INFO,
                    subject: '🏟️ Stadium Expansion Complete!',
                    body: `The construction work is finished! Your stadium has been upgraded to Level ${userTeam.facilities.stadiumLevel}. Capacity increased by 6,000 seats.`,
                    isRead: false,
                    date: new Date().toISOString()
                });
            }
        }

        // === TRAINING GROUND CONSTRUCTION PROGRESS ===
        if (userTeam.facilities.trainingConstructionWeeks && userTeam.facilities.trainingConstructionWeeks > 0) {
            userTeam.facilities.trainingConstructionWeeks -= 1;

            if (userTeam.facilities.trainingConstructionWeeks <= 0) {
                userTeam.facilities.trainingConstructionWeeks = 0;
                userTeam.facilities.trainingLevel += 1;

                newMessages.push({
                    id: uuid(),
                    week: gameState.currentWeek,
                    type: MessageType.INFO,
                    subject: '🏋️ Training Ground Upgrade Complete!',
                    body: `Construction finished! Your training facilities are now Level ${userTeam.facilities.trainingLevel}. Player development will improve.`,
                    isRead: false,
                    date: new Date().toISOString()
                });
            }
        }

        // === YOUTH ACADEMY CONSTRUCTION PROGRESS ===
        if (userTeam.facilities.academyConstructionWeeks && userTeam.facilities.academyConstructionWeeks > 0) {
            userTeam.facilities.academyConstructionWeeks -= 1;

            if (userTeam.facilities.academyConstructionWeeks <= 0) {
                userTeam.facilities.academyConstructionWeeks = 0;
                userTeam.facilities.academyLevel += 1;

                newMessages.push({
                    id: uuid(),
                    week: gameState.currentWeek,
                    type: MessageType.INFO,
                    subject: '🎓 Youth Academy Upgrade Complete!',
                    body: `Construction finished! Your youth academy is now Level ${userTeam.facilities.academyLevel}. Better youth prospects will be recruited.`,
                    isRead: false,
                    date: new Date().toISOString()
                });
            }
        }
    }

    // STAFF EFFECT: scoutLevel affects youth candidate generation
    // NERF: Reduced rates - max ~6% per week instead of ~13.5%
    let updatedTeams = gameState.teams;
    if (userTeam) {
        const scoutLevel = userTeam.staff?.scoutLevel || 1;
        const academyLevel = userTeam.facilities?.academyLevel || 1;
        // BALANCE: ~15% chance at max levels (approx 7-8 players per season)
        // Base 1% + 5% (Scout) + 8% (Academy) = ~14% max
        const youthChance = 0.01 + (scoutLevel * 0.005) + (academyLevel * 0.0035);

        if (Math.random() < youthChance && (userTeam.youthCandidates?.length || 0) < 5) {
            // Generate a youth player
            const positions: Position[] = [Position.GK, Position.DEF, Position.DEF, Position.MID, Position.MID, Position.FWD];
            const pos = positions[Math.floor(Math.random() * positions.length)];

            // BALANCE: Overall scales with Academy (Tiered)
            // Lvl 1: 40-55 (Avg 47)
            // Lvl 25: 55-70 (Avg 62) -> Usable reserves with room to grow
            const baseOverall = 40 + Math.floor(Math.random() * 15) + Math.floor(academyLevel * 0.6);

            // BALANCE: Potential depends on Scout+Academy but capped
            // Base: OVR + 10..25 (Random)
            // Bonus: (Scout * 1.0) + (Academy * 0.4) -> Max +20
            // Max Theory: 70 + 25 + 20 = 115 (Clamped to 90)
            const potentialBonus = (scoutLevel * 1.0) + (academyLevel * 0.4);
            const rawPotential = baseOverall + 10 + Math.floor(Math.random() * 15) + potentialBonus;

            // USER REQUEST: STRICT CAP at 90 (No 94-99 "God Mode" players)
            // "En fazla 85-90 arası bulsun"
            let potential = Math.min(90, rawPotential);

            // Ensure potential isn't lower than overall
            potential = Math.max(potential, baseOverall);

            // === FIX: League-based nationality ===
            const nationalityPools: Record<string, string[]> = {
                'tr': ['Turkey', 'Turkey', 'Turkey', 'Turkey', 'Turkey', 'Turkey', 'Turkey', 'Germany', 'Brazil', 'France'], // 70% Turkish
                'eng': ['England', 'England', 'England', 'England', 'England', 'France', 'Brazil', 'Germany', 'Spain', 'Nigeria'], // 50% English
                'esp': ['Spain', 'Spain', 'Spain', 'Spain', 'Spain', 'Argentina', 'Brazil', 'France', 'Colombia', 'Portugal'] // 50% Spanish
            };
            const pool = nationalityPools[gameState.leagueId] || nationalityPools['tr'];
            const youthNationality = pool[Math.floor(Math.random() * pool.length)];

            const youthPlayer = generatePlayer(userTeam.id, pos, youthNationality, [16, 17], [potential, potential]);

            // === FIX: Academy players are CHEAP (your own youth) ===
            youthPlayer.value = 50000; // €50K - academy product, not transfer market
            youthPlayer.salary = 25000; // €25K/year - youth wage
            updatedTeams = gameState.teams.map(t => {
                if (t.id === userTeam.id) {
                    return { ...t, youthCandidates: [...(t.youthCandidates || []), youthPlayer] };
                }
                return t;
            });

            newMessages.push({
                id: uuid(),
                week: gameState.currentWeek,
                type: MessageType.INFO,
                subject: t.youthProspectSubject,
                body: t.youthProspectBody.replace('{name}', `${youthPlayer.firstName} ${youthPlayer.lastName}`).replace('{position}', pos).replace('{age}', youthPlayer.age.toString()).replace('{overall}', baseOverall.toString()).replace('{potential}', potential.toString()),
                isRead: false,
                date: new Date().toISOString()
            });
        }
    }

    // ========== AI TEAM DEVELOPMENT SYSTEM (GLOBAL) ==========
    // AI teams passively upgrade facilities, develop players, and produce youth
    updatedTeams = updatedTeams.map(team => {
        if (team.id === gameState.userTeamId) return team; // Skip user team

        // === AI TEAM WEEKLY FINANCES ===
        // Calculate weekly expenses for AI teams (wages, maintenance, staff)
        const teamPlayers = updatedPlayers.filter(p => p.teamId === team.id);
        const totalSalaries = teamPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
        const weeklyWages = totalSalaries / 52;

        const leagueMult = getLeagueMultiplier(team.leagueId || 'tr');

        // Facility maintenance costs
        const maintenanceDiscount = ['tr', 'fr'].includes(team.leagueId) ? 0.7 : 1.0;
        const stadiumMaint = Math.pow(team.facilities.stadiumLevel, 1.3) * 2000 * maintenanceDiscount;
        const trainingMaint = Math.pow(team.facilities.trainingLevel, 1.3) * 1500 * maintenanceDiscount;
        const academyMaint = Math.pow(team.facilities.academyLevel, 1.3) * 1200 * maintenanceDiscount;
        const maintenance = (stadiumMaint + trainingMaint + academyMaint) * (0.8 + (leagueMult * 0.2));

        // Staff costs
        const staffCosts = (
            Math.pow(team.staff.headCoachLevel, 1.3) * 5000 +
            Math.pow(team.staff.scoutLevel, 1.3) * 3000 +
            Math.pow(team.staff.physioLevel, 1.3) * 4000
        ) * (0.8 + (leagueMult * 0.2));

        // Estimate weekly income for AI (simplified - based on reputation and league)
        const leaguePosition = gameState.teams
            .filter(t => t.leagueId === team.leagueId)
            .sort((a, b) => b.stats.points - a.stats.points)
            .findIndex(t => t.id === team.id) + 1;

        const baseTvRightsValues: Record<string, number> = {
            'tr': 320000, 'en': 850000, 'es': 600000, 'it': 500000,
            'de': 550000, 'fr': 400000, 'ar': 150000, 'br': 200000,
            'default': 200000
        };
        const tvBase = baseTvRightsValues[team.leagueId] || baseTvRightsValues['default'];
        const positionMultiplier = Math.max(0.5, 1.5 - ((leaguePosition - 1) * 0.05));
        const repMultiplier = 0.8 + ((team.reputation - 5000) / 10000) * 0.4;
        const tvRights = Math.floor(tvBase * positionMultiplier * repMultiplier * 1.3);

        // Merchandise and sponsor income
        const starPlayerBonus = teamPlayers.filter(p => p.overall > 85).length * 5000;
        const merchandise = Math.floor(((team.reputation * 2) + starPlayerBonus) * (0.7 + (leagueMult * 0.3)) * 1.3);
        // DYNAMIC: AI teams also benefit from league coefficient scaling for sponsors
        const teamCoeffMult = getCoefficientMultiplier(team.leagueId || 'default');
        const sponsorIncome = team.sponsor
            ? Math.floor(team.sponsor.weeklyIncome * 1.3 * teamCoeffMult)
            : Math.floor(50000 * Math.sqrt(leagueMult) * 1.3 * teamCoeffMult);

        // Ticket income (simplified - AI teams don't track home/away like user)
        const STADIUM_MIN = 5000;
        const STADIUM_CAPACITY_PER_LEVEL = 6000;
        const effectiveCapacity = STADIUM_MIN + (team.facilities.stadiumLevel - 1) * STADIUM_CAPACITY_PER_LEVEL;
        const baseTicketPrice = LEAGUE_TICKET_PRICES[team.leagueId] || LEAGUE_TICKET_PRICES['default'];
        // DYNAMIC: AI teams also get dynamic ticket prices based on league success
        const dynamicTicketPrice = Math.floor(baseTicketPrice * teamCoeffMult);
        const avgAttendance = 0.60 + (team.reputation - 5000) / 15000; // 60-93% based on reputation
        const ticketIncome = Math.floor(effectiveCapacity * dynamicTicketPrice * Math.max(0.4, Math.min(0.93, avgAttendance)) * 1.3 * 0.5); // Half of weeks are home

        const weeklyIncome = ticketIncome + merchandise + tvRights + sponsorIncome;
        const weeklyExpenses = weeklyWages + maintenance + staffCosts;

        // Update AI team budget
        const budgetBefore = team.budget;
        team.budget += (weeklyIncome - weeklyExpenses);

        // AI takımları için de finansal kayıt tut
        if (!team.financials) {
            team.financials = {
                lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 },
                lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 },
                history: []
            };
        }

        const financialRecord: any = {
            week: gameState.currentWeek,
            season: gameState.currentSeason,
            income: {
                tickets: ticketIncome,
                sponsor: sponsorIncome,
                merchandise,
                tvRights,
                transfers: 0,
                winBonus: 0,
                total: weeklyIncome
            },
            expenses: {
                wages: weeklyWages,
                maintenance,
                academy: academyMaint,
                transfers: 0,
                total: weeklyExpenses
            },
            balance: weeklyIncome - weeklyExpenses,
            budgetBefore,
            budgetAfter: team.budget
        };

        if (!team.financials.history) team.financials.history = [];
        team.financials.history.push(financialRecord);
        // Son 10 kaydı tut
        if (team.financials.history.length > 10) {
            team.financials.history = team.financials.history.slice(-10);
        }

        // AI Facility Upgrades (SMART: checks ongoing maintenance costs before upgrading)
        const upgradeChance = 0.015 + (team.reputation / 15000); // Reduced: 1.5% base + smaller reputation bonus

        // SMART CHECK: Only upgrade if budget positive AND weekly income > expenses with 30% buffer
        const canAffordMaintenance = weeklyIncome > (weeklyExpenses * 1.3);
        const hasEnoughBudget = team.budget > 8000000; // Increased threshold from 5M to 8M

        if (Math.random() < upgradeChance && hasEnoughBudget && canAffordMaintenance && team.budget > 0) {
            const facilityTypes = ['stadium', 'training', 'academy'];
            const targetFacility = facilityTypes[Math.floor(Math.random() * facilityTypes.length)];

            let cost = 0;
            const newFacilities = { ...team.facilities };

            // Also check if upgrading this facility would still be affordable
            const projectedMaint = (facility: string) => {
                const stadLvl = facility === 'stadium' ? team.facilities.stadiumLevel + 1 : team.facilities.stadiumLevel;
                const trainLvl = facility === 'training' ? team.facilities.trainingLevel + 1 : team.facilities.trainingLevel;
                const acadLvl = facility === 'academy' ? team.facilities.academyLevel + 1 : team.facilities.academyLevel;
                return (Math.pow(stadLvl, 1.8) * 4000 + Math.pow(trainLvl, 1.8) * 3500 + Math.pow(acadLvl, 1.8) * 3000) * (0.8 + (leagueMult * 0.2));
            };

            if (targetFacility === 'stadium' && newFacilities.stadiumLevel < 15) { // Max 15 for AI
                cost = 3000000;
                const futureMaint = projectedMaint('stadium');
                if (team.budget > cost && weeklyIncome > (weeklyWages + futureMaint * 1.2)) {
                    newFacilities.stadiumLevel += 1;
                    newFacilities.stadiumCapacity += 2000;
                }
            } else if (targetFacility === 'training' && newFacilities.trainingLevel < 18) { // Max 18 for AI
                cost = 2000000;
                const futureMaint = projectedMaint('training');
                if (team.budget > cost && weeklyIncome > (weeklyWages + futureMaint * 1.2)) {
                    newFacilities.trainingLevel += 1;
                }
            } else if (targetFacility === 'academy' && newFacilities.academyLevel < 15) { // Max 15 for AI
                cost = 1500000;
                const futureMaint = projectedMaint('academy');
                if (team.budget > cost && weeklyIncome > (weeklyWages + futureMaint * 1.2)) {
                    newFacilities.academyLevel += 1;
                }
            }

            if (cost > 0 && team.budget > cost) {
                return { ...team, facilities: newFacilities, budget: team.budget - cost };
            }
        }

        return team;
    });

    // AI Youth Production (based on academy level)
    updatedTeams = updatedTeams.map(team => {
        if (team.id === gameState.userTeamId) return team;

        const academyLevel = team.facilities?.academyLevel || 1;
        const youthChance = 0.01 + (academyLevel * 0.005); // 1% base + 0.5% per level

        // AI teams can integrate youth directly into squad (simplified)
        if (Math.random() < youthChance) {
            const teamPlayers = updatedPlayers.filter(p => p.teamId === team.id);

            // Only if team has less than 25 players
            if (teamPlayers.length < 25) {
                const positions: Position[] = [Position.GK, Position.DEF, Position.MID, Position.FWD];
                const pos = positions[Math.floor(Math.random() * positions.length)];
                const baseOverall = 50 + Math.floor(Math.random() * 10) + academyLevel;
                const potential = Math.min(95, baseOverall + 15 + Math.floor(Math.random() * 15));

                const youthPlayer = generatePlayer(team.id, pos, 'Europe', [17, 19], [potential, potential], undefined, team.leagueId);
                youthPlayer.overall = baseOverall;
                youthPlayer.lineup = 'RESERVE';
                youthPlayer.lineupIndex = 99;

                // Recalculate salary for youth specifically if needed, but generatePlayer now handles it well.
                // We'll trust generatePlayer's scaled wage, but ensure it's not too high for a youth player
                // Youth players usually get ~15% of value, but scaled wage is safer.
                // Let's rely on the new generatePlayer wage.

                updatedPlayers.push(youthPlayer);

                // NEWS: Notify user about their OWN youth promotions only (not AI teams)
                if (team.id === gameState.userTeamId) {
                    newMessages.push({
                        id: uuid(),
                        week: gameState.currentWeek,
                        type: MessageType.INFO,
                        subject: t.aiYouthPromotionSubject?.replace('{team}', team.name) || `🌟 ${team.name} Youth Promotion`,
                        body: t.aiYouthPromotionBody?.replace('{team}', team.name).replace('{name}', `${youthPlayer.firstName} ${youthPlayer.lastName}`).replace('{position}', pos).replace('{age}', youthPlayer.age.toString()) ||
                            `${team.name} promoted ${youthPlayer.firstName} ${youthPlayer.lastName} (${pos}, ${youthPlayer.age}) from their academy.`,
                        isRead: false,
                        date: new Date().toISOString()
                    });
                }
            }
        }

        // ========== AI TEAMS FULL ECONOMY (Income & Expenses) ==========
        if (team.id !== gameState.userTeamId) {
            const teamPlayers = updatedPlayers.filter(p => p.teamId === team.id);
            const weeklyWages = teamPlayers.reduce((sum, p) => sum + (p.salary || 0), 0) / 52;
            team.wages = Math.round(weeklyWages);

            // Calculate AI income (simplified but realistic)
            const leagueMult = getLeagueMultiplier(team.leagueId || 'tr');
            // SOLIDARITY MECHANISM: TV Base is now dynamic based on league success/reputation
            const tvBase = 200000 * leagueMult;
            const repMultiplier = 0.8 + ((team.reputation - 5000) / 10000) * 0.4;
            const aiTvRights = Math.floor(tvBase * repMultiplier);
            const aiMerchandise = Math.floor(team.reputation * 2 * (0.7 + leagueMult * 0.3));
            const aiSponsor = Math.floor(50000 * Math.sqrt(leagueMult));

            // Calculate maintenance costs (same formula as user)
            const stadiumMaint = Math.pow(team.facilities.stadiumLevel, 1.8) * 4000;
            const trainingMaint = Math.pow(team.facilities.trainingLevel, 1.8) * 3500;
            const academyMaint = Math.pow(team.facilities.academyLevel, 1.8) * 3000;
            const maintenance = (stadiumMaint + trainingMaint + academyMaint) * (0.8 + (leagueMult * 0.2));

            const weeklyIncome = aiTvRights + aiMerchandise + aiSponsor;
            const weeklyExpenses = weeklyWages + maintenance;

            team.budget += (weeklyIncome - weeklyExpenses);

            // ========== BANKRUPTCY PROTECTION ==========
            if (team.budget < -5000000) { // -5M limit
                // Force sell lowest rated non-starting player
                const aiPlayersToSell = updatedPlayers
                    .filter(p => p.teamId === team.id && p.lineup !== 'STARTING')
                    .sort((a, b) => a.overall - b.overall);


                // Only sell if team has more than 15 players
                if (aiPlayersToSell.length > 5 && teamPlayers.length > 15) {
                    const playerToSell = aiPlayersToSell[0];
                    playerToSell.teamId = 'FREE_AGENT';
                    playerToSell.lineup = 'RESERVE';
                    team.budget += playerToSell.value * 0.5; // Emergency sale at 50% value
                }

                // Emergency funds injection if still deeply negative
                if (team.budget < -3000000) {
                    team.budget = Math.min(team.budget + 2000000, 0); // Inject €2M emergency funds (owner bail-out)
                }
            }
        }

        return team;
    });

    // ========== FFP LUXURY TAX SYSTEM ==========
    // Teams with budget > 100M pay 10% weekly tax on excess
    // Tax is distributed equally to all teams in the same league (solidarity fund)
    const LUXURY_TAX_THRESHOLD = 100_000_000; // €100M
    const LUXURY_TAX_RATE = 0.10 / 52; // 10% annual, paid weekly

    // Track FFP amounts per team for financial reporting
    const ffpTaxPaid: Record<string, number> = {};
    const ffpSolidarityReceived: Record<string, number> = {};

    // Group teams by league
    const leagueTeamMap: Record<string, Team[]> = {};
    updatedTeams.forEach(t => {
        const lid = t.leagueId || 'tr';
        if (!leagueTeamMap[lid]) leagueTeamMap[lid] = [];
        leagueTeamMap[lid].push(t);
    });

    // Process each league's solidarity fund
    Object.keys(leagueTeamMap).forEach(leagueId => {
        const leagueTeams = leagueTeamMap[leagueId];
        let solidarityFund = 0;

        // Collect taxes from rich teams
        leagueTeams.forEach(team => {
            if (team.budget > LUXURY_TAX_THRESHOLD) {
                const excess = team.budget - LUXURY_TAX_THRESHOLD;
                const tax = Math.floor(excess * LUXURY_TAX_RATE);
                team.budget -= tax;
                solidarityFund += tax;
                ffpTaxPaid[team.id] = tax; // Track for finance UI
            }
        });

        // Distribute fund equally to all teams in the league
        if (solidarityFund > 0) {
            const perTeamShare = Math.floor(solidarityFund / leagueTeams.length);
            leagueTeams.forEach(team => {
                team.budget += perTeamShare;
                ffpSolidarityReceived[team.id] = perTeamShare; // Track for finance UI
            });
        }
    });

    // Update user team's financials with FFP data
    const userTeamFromUpdated = updatedTeams.find(t => t.id === gameState.userTeamId);
    if (userTeamFromUpdated && userTeamFromUpdated.financials) {
        userTeamFromUpdated.financials.lastWeekIncome.ffpSolidarity = ffpSolidarityReceived[userTeamFromUpdated.id] || 0;
        userTeamFromUpdated.financials.lastWeekExpenses.ffpTax = ffpTaxPaid[userTeamFromUpdated.id] || 0;
    }


    // AI Transfer Offers for User's Listed Players
    const newOffers: TransferOffer[] = [];
    const transferredPlayerIds = new Set<string>(); // FIX: Prevent infinite transfer loops
    const userListedPlayers = updatedPlayers.filter(p => p.teamId === gameState.userTeamId && p.isTransferListed);

    userListedPlayers.forEach(player => {
        // Each listed player has a chance to receive an offer
        if (Math.random() < 0.4) { // 40% chance per week
            // Find AI teams with enough budget AND interest (Realism Update)
            const interestedTeams = gameState.teams.filter(team => {
                if (team.id === gameState.userTeamId) return false;
                if (team.budget < player.value * 0.7) return false;

                // Realism Check 1: Is the player good enough for this team?
                // Approximation: Team Reputation (0-10000) maps roughly to Player OVR needed
                // e.g. Rep 8000 (Top Tier) needs OVR 80+
                // e.g. Rep 5000 (Mid Tier) needs OVR 50+
                const minOvrNeeded = Math.max(50, (team.reputation / 100) - 10);
                const isGoodEnough = player.overall >= minOvrNeeded;

                // Realism Check 2: Is he a young talent? (Wonderkid exception)
                const isWonderkid = player.age < 22 && player.potential > 80;

                // Team must either need his quality OR he's a future prospect
                // Plus a random factor to simulate specific positional need/whim
                return (isGoodEnough || isWonderkid) && Math.random() < 0.3;
            });

            if (interestedTeams.length > 0) {
                const buyingTeam = interestedTeams[Math.floor(Math.random() * interestedTeams.length)];
                // IMPROVED: AI offers 100% to 150% of value (Fairer offers)
                const offerMultiplier = 1.0 + Math.random() * 0.5;
                const offerAmount = Math.floor(player.value * offerMultiplier);

                const offer: TransferOffer = {
                    id: uuid(),
                    playerId: player.id,
                    playerName: `${player.firstName} ${player.lastName}`,
                    fromTeamId: gameState.userTeamId,
                    fromTeamName: userTeam?.name || 'Your Team',
                    toTeamId: buyingTeam.id,
                    offerAmount,
                    status: 'PENDING',
                    weekCreated: gameState.currentWeek
                };

                newOffers.push(offer);

                // Create message for user
                newMessages.push({
                    id: uuid(),
                    week: gameState.currentWeek,
                    type: MessageType.TRANSFER_OFFER,
                    subject: t.transferOfferSubject.replace('{team}', buyingTeam.name).replace('{name}', player.lastName),
                    body: t.transferOfferBody.replace('{team}', buyingTeam.name).replace('{amount}', (offerAmount / 1000000).toFixed(1)).replace('{name}', `${player.firstName} ${player.lastName}`),
                    isRead: false,
                    date: new Date().toISOString(),
                    data: { offerId: offer.id }
                });
            }
        }
    });

    // ========== SMART AI TRANSFER SYSTEM ==========
    // AI teams now: 1) Identify squad weaknesses, 2) Scout appropriate players, 3) Make intelligent offers

    const allAiTeams = gameState.teams.filter(t => t.id !== gameState.userTeamId);

    // THROTTLING: Only process ~15% of teams per week to save CPU (Scaling Fix)
    // BUT: Always process teams that are in "Crisis" (low squad size)
    const activeAiTeams = allAiTeams.filter(t => {
        // Find squad size from updatedPlayers list
        const squadSize = updatedPlayers.filter(p => p.teamId === t.id).length;

        // Crisis check: Always active if squad is too small
        if (squadSize < 18) return true;

        // Random selection for others (Rolling Window simulation)
        return Math.random() < 0.15;
    });

    // console.log(`[AI Market] Active buyers this week: ${activeAiTeams.length}/${allAiTeams.length}`);

    activeAiTeams.forEach(aiTeam => {
        // Skip if budget too low for transfers
        if (aiTeam.budget < 2000000) return;

        // TRANSFER WINDOW CHECK
        // Summer Window: Weeks 1-8
        // Winter Window: Weeks 20-24
        const isTransferWindow = (gameState.currentWeek <= 8) || (gameState.currentWeek >= 20 && gameState.currentWeek <= 24);

        if (!isTransferWindow) return; // Stop all AI transfer activity outside windows

        const teamPlayers = updatedPlayers.filter(p => p.teamId === aiTeam.id);

        // ========== 1. ADVANCED SQUAD ANALYSIS (AI BRAIN) ==========
        // Calculate average squad quality to set a baseline standard
        const avgOverall = teamPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(1, teamPlayers.length);

        // Use the new AI Service to identify needs based on tactic and quality
        // This considers formation slots, depth, and starter quality
        const squadNeeds = AIService.analyzeSquadNeeds(aiTeam, teamPlayers, avgOverall);

        // ========== 2. SMART AI BUYING (Utility-Based) ==========
        // Only buy if we have a pressing need (Urgency > 50) and budget
        if (squadNeeds.length > 0 && squadNeeds[0].urgency > 50 && Math.random() < 0.35 && aiTeam.budget > 2000000) {
            const topNeed = squadNeeds[0]; // Most urgent need

            // Look for players who fit this specific role
            const availablePlayers = updatedPlayers.filter(p =>
                p.position === topNeed.position &&
                p.teamId !== aiTeam.id &&
                p.teamId !== gameState.userTeamId && // Don't poach from user automatically
                !transferredPlayerIds.has(p.id) && // FIX: Exclude recent transfers
                (gameState.currentWeek - (p.lastTransferWeek || -99) >= 10) && // FIX: 10 week cooldown
                p.overall >= topNeed.targetRating - 3 && // Must be close to target standard
                p.overall <= topNeed.targetRating + 10 && // Not too good (realistic)
                p.value < aiTeam.budget * 0.8 // Affordable
            );

            if (availablePlayers.length > 0) {
                // SCORE PLAYERS BASED ON ROLE FIT (Not just Overall!)
                const scoredTargets = availablePlayers.map(p => ({
                    player: p,
                    utilityScore: AIService.calculatePlayerUtility(p, topNeed.role, aiTeam.tactic)
                }));

                // Sort by Utility Score (Best fit for the role)
                const sortedTargets = scoredTargets.sort((a, b) => b.utilityScore - a.utilityScore);

                // Top target is the best FIT, not necessarily highest OVR
                const targetPlayer = sortedTargets[0].player;
                const sellingTeam = gameState.teams.find(t => t.id === targetPlayer.teamId);

                if (sellingTeam && targetPlayer.value < aiTeam.budget) {
                    // === REJECTION LOGIC ===
                    // Selling team may reject the offer based on player importance
                    const sellingTeamPlayers = updatedPlayers.filter(p => p.teamId === sellingTeam.id);
                    const isStarter = targetPlayer.lineup === 'STARTING';
                    const isStarPlayer = targetPlayer.overall >= 85;
                    const positionPlayersCount = sellingTeamPlayers.filter(p => p.position === targetPlayer.position).length;
                    const wouldLeaveShort = positionPlayersCount <= 2;

                    // Rejection chance based on factors
                    let rejectChance = 0;
                    if (isStarter) rejectChance += 0.4; // 40% more likely to reject starter sale
                    if (isStarPlayer) rejectChance += 0.3; // 30% more for star players
                    if (wouldLeaveShort) rejectChance += 0.5; // 50% if would leave position short
                    if (!targetPlayer.isTransferListed) rejectChance += 0.3; // 30% if not listed

                    // Player willingness (AI version - simplified)
                    const repDiff = aiTeam.reputation - sellingTeam.reputation;
                    if (repDiff < -500) rejectChance += 0.3; // Player doesn't want to go to weaker team

                    // Roll the dice
                    if (Math.random() < rejectChance) {
                        // Transfer rejected - skip this one
                        // No message needed for AI-AI rejected transfers
                    } else {
                        const offerMultiplier = 0.9 + Math.random() * 0.3; // 90-120% of value
                        const transferFee = Math.floor(targetPlayer.value * offerMultiplier);

                        // Execute transfer
                        targetPlayer.teamId = aiTeam.id;
                        targetPlayer.lineup = 'RESERVE';
                        targetPlayer.lineupIndex = 99;
                        targetPlayer.lastTransferWeek = gameState.currentWeek; // FIX: Set transfer week
                        transferredPlayerIds.add(targetPlayer.id); // FIX: Mark as transferred

                        // Update budgets
                        updatedTeams = updatedTeams.map(t => {
                            if (t.id === sellingTeam.id) return { ...t, budget: t.budget + transferFee };
                            if (t.id === aiTeam.id) return { ...t, budget: t.budget - transferFee };
                            return t;
                        });

                        newMessages.push({
                            id: uuid(),
                            week: gameState.currentWeek,
                            type: MessageType.INFO,
                            subject: t.transferNewsSubject,
                            body: t.transferSignedBody.replace('{team}', aiTeam.name).replace('{position}', targetPlayer.position).replace('{name}', `${targetPlayer.firstName} ${targetPlayer.lastName}`).replace('{fromTeam}', sellingTeam.name).replace('{amount}', (transferFee / 1000000).toFixed(1)),
                            isRead: false,
                            date: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // ========== 3. AI REQUESTING PLAYERS FROM USER (Position-Based) ==========
        // AI teams can make offers for user's non-listed players IF they need that position
        // IMPROVED: More frequent (15% vs 8%), lower rep threshold (6500 vs 7500)
        if (aiTeam.reputation > 6500 && aiTeam.budget > 10000000 && Math.random() < 0.15) {
            // First check what positions AI team needs using our new AI Brain
            // Filter for needs with reasonable urgency (Top priority or secondary needs)
            const aiNeededPositions = squadNeeds
                .filter(n => n.urgency > 40)
                .map(n => n.position);

            // Only proceed if AI has positional needs
            if (aiNeededPositions.length > 0) {
                const userPlayers = updatedPlayers.filter(p =>
                    p.teamId === gameState.userTeamId &&
                    !p.isTransferListed &&
                    (gameState.currentWeek - (p.lastTransferWeek || -99) >= 10) && // FIX: Cooldown
                    aiNeededPositions.includes(p.position) && // MUST match needed position
                    p.overall >= 75 && // Target good players
                    p.overall <= avgOverall + 8 && // But realistic for their level
                    p.value < aiTeam.budget * 0.7
                );

                if (userPlayers.length > 0) {
                    // Prefer players in most needed position
                    const targetPlayer = userPlayers[Math.floor(Math.random() * userPlayers.length)];
                    const offerMultiplier = 1.2 + Math.random() * 0.5; // 120-170% of value (premium offer)
                    const offerAmount = Math.floor(targetPlayer.value * offerMultiplier);

                    // Create a proper offer that user can accept/reject
                    const offer = {
                        id: uuid(),
                        playerId: targetPlayer.id,
                        playerName: `${targetPlayer.firstName} ${targetPlayer.lastName}`,
                        fromTeamId: gameState.userTeamId,
                        fromTeamName: gameState.teams.find(t => t.id === gameState.userTeamId)?.name || 'Your Team',
                        toTeamId: aiTeam.id,
                        offerAmount,
                        status: 'PENDING' as const,
                        weekCreated: gameState.currentWeek
                    };

                    newOffers.push(offer);

                    newMessages.push({
                        id: uuid(),
                        week: gameState.currentWeek,
                        type: MessageType.TRANSFER_OFFER,
                        subject: t.transferOfferSubject.replace('{team}', aiTeam.name).replace('{name}', targetPlayer.lastName),
                        body: t.transferOfferBody.replace('{team}', aiTeam.name).replace('{amount}', (offerAmount / 1000000).toFixed(1)).replace('{name}', `${targetPlayer.firstName} ${targetPlayer.lastName}`),
                        isRead: false,
                        date: new Date().toISOString(),
                        data: { offerId: offer.id }
                    });
                }
            }
        }

        // ========== 3. TACTICAL EVOLUTION (AI COACH) ==========
        // Every 4 weeks, evaluate if the tactic fits the players
        if (gameState.currentWeek % 4 === 0) {
            const squad = updatedPlayers.filter(p => p.teamId === aiTeam.id);
            const fit = AIService.evaluateTacticalFit(aiTeam, squad);

            // If fit is poor (negative score) and coach is adaptable (simplified randomness for now)
            if (fit.fitScore < -20 && Math.random() < 0.6) {
                const newFormation = AIService.suggestBestTacticForSquad(squad);
                if (newFormation !== aiTeam.tactic.formation) {
                    aiTeam.tactic.formation = newFormation;

                    // Simple style adjustment based on formation
                    // 5ATB -> Counter, 3ATB -> Attacking, etc.
                    if (newFormation.includes('5-')) aiTeam.tactic.style = 'Counter';
                    else if (newFormation.includes('4-3-3')) aiTeam.tactic.style = 'HighPress';

                    // Add message for user if it's a major rival
                    if (aiTeam.reputation > 7000) {
                        newMessages.push({
                            id: uuid(),
                            week: gameState.currentWeek,
                            type: MessageType.INFO,
                            subject: 'Tactical Shift',
                            body: `${aiTeam.name} manager has switched to a ${newFormation} formation to better suit the squad.`,
                            isRead: false,
                            date: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // ========== 4. SMART SELLING - Performance-based ==========
        // Sell underperforming players or those with low value relative to wages
        if (teamPlayers.length > 18 && Math.random() < 0.1) {
            const sellCandidates = teamPlayers.filter(p =>
                p.lineup !== 'STARTING' &&
                (gameState.currentWeek - (p.lastTransferWeek || -99) >= 10) && // FIX: Dont sell new players
                (p.overall < avgOverall - 8 || // Below team average
                    (p.age > 30 && p.overall < 72) || // Aging and declining
                    p.morale < 40) // Unhappy players
            ).sort((a, b) => a.overall - b.overall);

            if (sellCandidates.length > 0) {
                const playerToSell = sellCandidates[0];

                // Find interested buyers
                const interestedBuyers = allAiTeams.filter(t =>
                    t.id !== aiTeam.id &&
                    t.budget > playerToSell.value * 0.7 &&
                    t.reputation < aiTeam.reputation // Usually sell to smaller clubs
                );

                if (interestedBuyers.length > 0) {
                    const buyer = interestedBuyers[Math.floor(Math.random() * interestedBuyers.length)];
                    const transferFee = Math.floor(playerToSell.value * (0.85 + Math.random() * 0.2));

                    playerToSell.teamId = buyer.id;
                    playerToSell.lineup = 'RESERVE';
                    playerToSell.lineupIndex = 99;
                    playerToSell.lastTransferWeek = gameState.currentWeek;

                    updatedTeams = updatedTeams.map(t => {
                        if (t.id === aiTeam.id) return { ...t, budget: t.budget + transferFee };
                        if (t.id === buyer.id) return { ...t, budget: t.budget - transferFee };
                        return t;
                    });

                    newMessages.push({
                        id: uuid(),
                        week: gameState.currentWeek,
                        type: MessageType.INFO,
                        subject: t.transferNewsSubject,
                        body: t.transferSignedBody.replace('{team}', buyer.name).replace('{name}', `${playerToSell.firstName} ${playerToSell.lastName}`).replace('{fromTeam}', aiTeam.name).replace('{amount}', (transferFee / 1000000).toFixed(1)).replace('{position}', playerToSell.position),
                        isRead: false,
                        date: new Date().toISOString()
                    });
                }
            }
        }

        // ========== 5. SMART CONTRACT RENEWAL ==========
        // AI teams renew contracts of important players before they expire
        teamPlayers.forEach(player => {
            if (player.contractYears <= 1 && player.overall >= avgOverall) {
                // Important player with expiring contract - renew!
                const renewalCost = Math.floor(player.value * 0.05); // 5% of value as bonus
                if (aiTeam.budget > renewalCost * 3) { // Only if can comfortably afford
                    player.contractYears += 2 + Math.floor(Math.random() * 2); // 2-3 year extension
                    // Deduct small signing bonus
                    updatedTeams = updatedTeams.map(t =>
                        t.id === aiTeam.id ? { ...t, budget: t.budget - renewalCost } : t
                    );
                }
            }
        });

        // ========== 6. AI TRANSFER LISTING ==========
        // AI teams put players on the market for users to buy
        const squadSize = teamPlayers.length;

        // A) Squad bloat - list surplus players
        if (squadSize > 22 && Math.random() < 0.25) {
            const surplus = squadSize - 20;
            const listCandidates = teamPlayers
                .filter(p => p.lineup !== 'STARTING' && !p.isTransferListed)
                .sort((a, b) => a.overall - b.overall);

            // List the weakest surplus players
            listCandidates.slice(0, Math.min(surplus, 2)).forEach(p => {
                p.isTransferListed = true;
            });
        }

        // B) High wage / low value players
        teamPlayers.forEach(p => {
            if (!p.isTransferListed && p.lineup !== 'STARTING') {
                const wageValueRatio = (p.salary || 0) / (p.value || 1);
                // High wage relative to value = list for sale
                if (wageValueRatio > 0.25 && Math.random() < 0.15) {
                    p.isTransferListed = true;
                }
            }
        });

        // C) Aging and declining players
        teamPlayers.forEach(p => {
            if (!p.isTransferListed && p.age > 31 && p.overall < 72) {
                if (Math.random() < 0.20) {
                    p.isTransferListed = true;
                }
            }
        });

        // D) Unhappy players
        teamPlayers.forEach(p => {
            if (!p.isTransferListed && (p.morale || 75) < 35) {
                if (Math.random() < 0.30) {
                    p.isTransferListed = true;
                }
            }
        });
    });

    // GARBAGE COLLECTION (User Request):
    // Delete Free Agents who are "Dead Weight" (prevent save bloat)
    // Run this check periodically (e.g., every 4 weeks)
    if (gameState.currentWeek % 4 === 0) {
        const initialCount = updatedPlayers.length;

        // Criteria for deletion:
        // 1. Unemployed (FREE_AGENT)
        // 2. Age > 24 (Not young talent)
        // 3. Overall < 70 (Not useful for any league)
        // OR
        // 1. Unemployed
        // 2. Age > 32 (Retired de-facto)
        updatedPlayers = updatedPlayers.filter(p => {
            if (p.teamId !== 'FREE_AGENT') return true; // Keep employed players

            const isDeadWeight = (p.age > 24 && p.overall < 70) || (p.age > 32);
            return !isDeadWeight;
        });

        const deletedCount = initialCount - updatedPlayers.length;
        if (deletedCount > 0) {
            console.log(`[Garbage Collector] Removed ${deletedCount} useless free agents to save memory.`);
        }
    }

    return {
        updatedTeams,
        updatedPlayers,
        updatedMarket: gameState.transferMarket,
        report,
        transferNews: [],
        offers: newMessages,
        newPendingOffers: newOffers
    };
}

// ========== SUPER CUP (CL Winner vs UEFA Cup Winner) ==========
// ========== SUPER CUP (CL Winner vs UEFA Cup Winner) ==========
// Returns the last scheduled week among league fixtures (dynamic season length support).
export const getLastLeagueWeek = (matches: Match[]): number => {
    if (!matches || matches.length === 0) return 38;
    const leagueMatches = matches.filter(m => {
        if (m.isFriendly) return false;
        // Prefer explicit typing
        if (m.type) return m.type === 'LEAGUE';
        // Heuristic fallback: league fixtures generally have no competition metadata
        if (m.competitionId || m.competitionName) return false;
        return true;
    });
    if (leagueMatches.length === 0) return 38;
    return Math.max(38, ...leagueMatches.map(m => m.week || 0));
};

// Super Cup is ALWAYS week 39 (fixed calendar slot)
export const SUPER_CUP_WEEK = 39;

// === AI TACTICS SELECTION ===
export const autoPickTactics = (team: Team, opponent?: Team) => {
    // 1. Determine Mentality based on relative strength
    // Use reputation as proxy for overall strength (1000-10000 range)
    const myRating = team.reputation || 4000;
    const oppRating = opponent?.reputation || 4000;
    const strengthDiff = (myRating - oppRating) / 100; // Normalize to approx -50 to 50 range

    let mentality: 'Attacking' | 'Balanced' | 'Defensive' = 'Balanced';
    if (strengthDiff > 10) mentality = 'Attacking';
    else if (strengthDiff < -10) mentality = 'Defensive';

    // 2. Determine Style based on players or randomness
    // If team has no specific style preference, pick one suitable for mentality
    let style = team.tactic.style || 'Balanced';
    if (style === 'Balanced' || Math.random() < 0.3) {
        if (mentality === 'Attacking') {
            style = Math.random() < 0.6 ? 'Wing Play' : 'Tiki Taka';
        } else if (mentality === 'Defensive') {
            style = Math.random() < 0.7 ? 'Park the Bus' : 'Counter Attack';
        } else {
            const styles = ['Wing Play', 'Tiki Taka', 'Counter Attack', 'Balanced'];
            style = styles[Math.floor(Math.random() * styles.length)] as any;
        }
    }

    // 3. Set Aggression
    // Default to Normal, but vary based on match importance or team history?
    // User requested "Normal" buff, so AI using Normal is good.
    // Occasionally use Aggressive for weaker teams trying to compensate?
    let aggression: 'Safe' | 'Normal' | 'Aggressive' | 'Reckless' = 'Normal';
    if (Math.random() < 0.2) aggression = 'Aggressive';
    if (strengthDiff < -15 && Math.random() < 0.3) aggression = 'Reckless'; // Desperate
    if (strengthDiff > 15 && Math.random() < 0.3) aggression = 'Safe'; // Comfortable

    // 4. Apply to Team Tactic
    // We update the team object directly for this match context
    team.tactic = {
        ...team.tactic,
        mentality,
        style: style as any,
        aggression,
        // Width defaults based on style
        width: style === 'Wing Play' ? 'Wide' : (style === 'Tiki Taka' ? 'Narrow' : 'Normal'),
        // Defensive Line
        defensiveLine: mentality === 'Attacking' ? 'High' : (mentality === 'Defensive' ? 'Deep' : 'Normal')
    };

    return team;
};

export const generateSuperCup = (gameState: GameState): SuperCup | undefined => {
    const clWinner = gameState.europeanCup?.winnerId;
    const elWinner = gameState.europaLeague?.winnerId;

    console.log(`[Super Cup] Generating: CL Winner: ${clWinner}, EL Winner: ${elWinner}, Sezon: ${gameState.currentSeason}, Hafta: ${gameState.currentWeek}`);

    if (!clWinner || !elWinner) {
        console.warn(`[Super Cup] Cannot generate - missing winners. CL: ${clWinner}, EL: ${elWinner}`);
        return undefined;
    }

    const superCupWeek = SUPER_CUP_WEEK; // Always week 39

    const superCup: SuperCup = {
        season: gameState.currentSeason,
        championsLeagueWinnerId: clWinner,
        uefaCupWinnerId: elWinner,
        match: {
            id: uuid(),
            stage: 'FINAL',
            homeTeamId: clWinner,
            awayTeamId: elWinner,
            homeScore: 0,
            awayScore: 0,
            isPlayed: false,
            week: superCupWeek
        },
        winnerId: undefined,
        isComplete: false
    };

    console.log(`[Super Cup] Generated: ${gameState.teams.find(t => t.id === clWinner)?.name} vs ${gameState.teams.find(t => t.id === elWinner)?.name}`);
    return superCup;
};

export const checkAndScheduleSuperCup = (gameState: GameState): GameState => {
    // 0. CLEANUP PHANTOM SUPER CUPS (Legacy Save Fix)
    // If Super Cup exists but Champions League winner is not determined yet, it's invalid (from previous save logic).
    if (gameState.superCup && !gameState.superCup.isComplete) {
        const clWinner = gameState.europeanCup?.winnerId;
        const elWinner = gameState.europaLeague?.winnerId;
        if (!clWinner || !elWinner) {
            console.log("[Super Cup] Clearing invalid Super Cup (No winners yet)");
            return { ...gameState, superCup: undefined };
        }
    }

    // Super Cup is always week 39 - only start checking from week 38
    if (gameState.currentWeek < SUPER_CUP_WEEK - 1) return gameState;

    // Schedule as soon as winners exist (week is set dynamically to lastLeagueWeek+1)
    if (gameState.superCup) return gameState; // Already scheduled

    const superCup = generateSuperCup(gameState);
    if (!superCup) return gameState;

    // Log for debugging
    console.log(`[Super Cup] Scheduled for Week ${superCup.match?.week} (Dynamic)`);

    return { ...gameState, superCup };
};

export const processSeasonEnd = (gameState: GameState) => {
    // === MEMORY OPTIMIZATION ===
    // Clear old history to prevent save file bloat
    console.log("[Maintenance] Running memory cleanup...");

    // 1. Limit Team History (Last 5 seasons)
    gameState.teams.forEach(team => {
        if (team.reputationHistory && team.reputationHistory.length > 5) {
            team.reputationHistory = team.reputationHistory.slice(-5);
        }
        if (team.confidenceHistory && team.confidenceHistory.length > 90) { // Keep ~2 seasons of weekly data
            team.confidenceHistory = team.confidenceHistory.slice(-90);
        }
    });

    // 2. Limit Match History (Last 3 seasons for matches to save space)
    if (gameState.matches.length > 2000) {
        const currentSeason = gameState.currentSeason;
        gameState.matches = gameState.matches.filter(m => m.season >= currentSeason - 2);
    }

    // === AI FACILITY UPGRADES ===
    // AI teams invest in their facilities based on budget
    gameState.teams.forEach(team => {
        if (team.id === gameState.userTeamId) return; // Skip user team

        // Base cost logic from ClubManagement
        const getCost = (level: number) => Math.floor(500000 * (level + 1) * (1 + (level + 1) * 0.05));

        // Check Academy (Priority 1)
        if (team.facilities.academyLevel < 20 && Math.random() < 0.7) {
            // HARDER: Base 600k
            const cost = Math.floor(600000 * (team.facilities.academyLevel + 1) * (1 + (team.facilities.academyLevel + 1) * 0.1));
            if (team.budget > cost * 2.5) { // Needs 2.5x budget to be safe
                team.budget -= cost;
                team.facilities.academyLevel += 1;
                console.log(`[AI Upgrade] ${team.name} upgraded Academy to Level ${team.facilities.academyLevel}`);
            }
        }

        // Check Training (Priority 2)
        if (team.facilities.trainingLevel < 20 && Math.random() < 0.6) {
            const cost = getCost(team.facilities.trainingLevel);
            if (team.budget > cost * 2.5) {
                team.budget -= cost;
                team.facilities.trainingLevel += 1;
                console.log(`[AI Upgrade] ${team.name} upgraded Training to Level ${team.facilities.trainingLevel}`);
            }
        }

        // Check Stadium (Priority 3)
        if (team.facilities.stadiumLevel < 15 && Math.random() < 0.4) {
            const cost = getCost(team.facilities.stadiumLevel);
            if (team.budget > cost * 3) {
                team.budget -= cost;
                team.facilities.stadiumLevel += 1;
                console.log(`[AI Upgrade] ${team.name} upgraded Stadium to Level ${team.facilities.stadiumLevel}`);
            }
        }
    });

    // === DYNAMIC LEAGUE REPUTATION SYSTEM (NEW) ===
    // 0. Initialize registries from GameState or Constants
    if (gameState.baseLeagueReputations) {
        Object.assign(BASE_LEAGUE_REPUTATION, gameState.baseLeagueReputations);
    }
    if (gameState.leagueReputationBonuses) {
        Object.assign(LEAGUE_REPUTATION_BONUS, gameState.leagueReputationBonuses);
    }
    if (gameState.leagueEuropeanBonuses) {
        Object.assign(LEAGUE_EUROPEAN_BONUS, gameState.leagueEuropeanBonuses);
    }

    // ========== MARKET INFLATION SYSTEM ==========
    // Track total economy growth and apply inflation to player values
    // This prevents late-game "everyone is rich but players are cheap" scenario
    const INITIAL_TOTAL_BUDGETS = 2_000_000_000; // €2B baseline (approx sum of all teams' starting budgets)
    const totalLeagueBudgets = gameState.teams.reduce((sum, t) => sum + Math.max(0, t.budget), 0);
    const inflationMultiplier = Math.max(1.0, Math.min(2.0, totalLeagueBudgets / INITIAL_TOTAL_BUDGETS));

    console.log(`[Season End] Market Inflation: Total Budgets €${(totalLeagueBudgets / 1000000).toFixed(0)}M, Multiplier: ${inflationMultiplier.toFixed(2)}x`);

    // 1. Calculate Seasonal Performance (Continental Points)
    // === BALANCED COEFFICIENT SYSTEM (User Requested) ===
    // Win = 3, Draw = 1, Penalties = +1
    // Round Bonuses: R16=+2, QF=+2, SF=+3, Final=+3, Winner=+5
    const leagueSeasonalPoints: Record<string, number> = {};
    const leagueTeamCounts: Record<string, Set<string>> = {}; // Track unique teams per league

    const processMatchPoints = (m: EuropeanCupMatch | Match, isSuperCup: boolean = false, multiplier: number = 1.0) => {
        if (!m.isPlayed) return;

        // Find teams
        const home = gameState.teams.find(t => t.id === m.homeTeamId);
        const away = gameState.teams.find(t => t.id === m.awayTeamId);
        if (!home || !away) return;

        console.log(`[COEFF DEBUG] Match: ${home.name} vs ${away.name} | Stage: ${(m as any).stage} | isPlayed: ${m.isPlayed}`);

        let homePts = 0;
        let awayPts = 0;

        // 90min Result (Standard 3/1/0)
        if (m.homeScore > m.awayScore) homePts += 3;
        else if (m.homeScore < m.awayScore) awayPts += 3;
        else { homePts += 1; awayPts += 1; }

        // Penalties (Small Bonus)
        if ((m as any).penalties) {
            const p = (m as any).penalties;
            if (p.homeScore > p.awayScore) homePts += 1;
            else awayPts += 1;
        }

        // Round Progression Bonuses (Significant)
        const stage = (m as any).stage || (m as any).round;
        if (stage) {
            const winnerId = (m as any).winnerId;
            const isHomeWinner = winnerId === home.id;
            const isAwayWinner = winnerId === away.id;

            let bonus = 0;
            if (stage === 'ROUND_16') {
                // Bonus for REACHING Round of 16 (Qualifying from groups)
                bonus = 2;
                // Both teams get this bonus for qualifying
                homePts += 2;
                awayPts += 2;
            }
            else if (stage === 'QUARTER') bonus = 2;
            else if (stage === 'SEMI') bonus = 3;
            else if (stage === 'FINAL') {
                bonus = 3;
                // Cup Winner Bonus
                if (isHomeWinner) homePts += 5;
                if (isAwayWinner) awayPts += 5;
            }

            if (isHomeWinner) homePts += bonus;
            if (isAwayWinner) awayPts += bonus;
        }

        // Super Cup Bonus (+2 for winner)
        if (isSuperCup) {
            const winnerId = (m as any).winnerId;
            if (winnerId === home.id) homePts += 2;
            else if (winnerId === away.id) awayPts += 2;
        }

        // Apply Multiplier (New Logic: Elite=1.0, Challenge=1.0)
        homePts = homePts * multiplier;
        awayPts = awayPts * multiplier;

        // Add to league totals (SUM ONLY - No Average)
        leagueSeasonalPoints[home.leagueId] = (leagueSeasonalPoints[home.leagueId] || 0) + homePts;
        leagueSeasonalPoints[away.leagueId] = (leagueSeasonalPoints[away.leagueId] || 0) + awayPts;

        console.log(`[COEFF DEBUG] ${home.name} earned ${homePts} pts → ${home.leagueId} total: ${leagueSeasonalPoints[home.leagueId]}`);
        console.log(`[COEFF DEBUG] ${away.name} earned ${awayPts} pts → ${away.leagueId} total: ${leagueSeasonalPoints[away.leagueId]}`);

        // Track unique teams per league
        if (!leagueTeamCounts[home.leagueId]) leagueTeamCounts[home.leagueId] = new Set();
        if (!leagueTeamCounts[away.leagueId]) leagueTeamCounts[away.leagueId] = new Set();
        leagueTeamCounts[home.leagueId].add(home.id);
        leagueTeamCounts[away.leagueId].add(away.id);
    };

    // Process ALL Matches
    // UPDATED: Use proper groups/knockout iteration for Global Cup
    if (gameState.europeanCup) {
        if (gameState.europeanCup.groups) {
            gameState.europeanCup.groups.forEach(g => g.matches.forEach(m => processMatchPoints(m, false, 1.0)));
        }
        if (gameState.europeanCup.knockoutMatches) {
            gameState.europeanCup.knockoutMatches.forEach(m => processMatchPoints(m, false, 1.0));
        }
        // Fallback for legacy .matches
        if ((gameState.europeanCup as any).matches) {
            (gameState.europeanCup as any).matches.forEach((m: any) => processMatchPoints(m, false, 1.0));
        }
    }

    // Europa League (Challenge Cup) - Multiplier 1.0 (Same as Elite)
    if (gameState.europaLeague) {
        if (gameState.europaLeague.groups) { // Check groups first (New system)
            gameState.europaLeague.groups.forEach(g => g.matches.forEach(m => processMatchPoints(m, false, 1.0)));
        }
        if (gameState.europaLeague.knockoutMatches) {
            gameState.europaLeague.knockoutMatches.forEach(m => processMatchPoints(m, false, 1.0));
        }
        // Fallback for legacy
        if ((gameState.europaLeague as any).matches) {
            (gameState.europaLeague as any).matches.forEach((m: any) => processMatchPoints(m, false, 1.0));
        }
    }

    // Super Cup (Week 39) - Multiplier 1.0 (Points are small/fixed anyway)
    if (gameState.superCup && gameState.superCup.match) processMatchPoints(gameState.superCup.match, true, 1.0);

    // === 5-YEAR HISTORY UPDATE ===
    // Update global state - SUM ONLY (User Request: No Division)
    // FIX: Use ALL league IDs from gameState, not just BASE_LEAGUE_REPUTATION
    const leagueIdsForHistory = [...new Set(gameState.teams.map(t => t.leagueId))].filter(lid => lid && lid !== 'default');

    leagueIdsForHistory.forEach(lid => {
        // Init if empty
        if (!LEAGUE_COEFFICIENTS[lid]) LEAGUE_COEFFICIENTS[lid] = [5.0, 5.0, 5.0, 5.0, 5.0];

        // Calculate season coefficient (PURE SUM - No Division)
        const totalPoints = leagueSeasonalPoints[lid] || 0;

        // === DYNAMIC BASE REPUTATION (2-WAY SYSTEM) ===
        // Ligler hem yükselir hem düşer - İngiltere kötüyse düşer, Kenya iyiyse yükselir!
        // Çin otomobil örneği: BYD 10 yılda Avrupa'yı zorluyor, aynı mantık!
        const currentCoeffTotal = LEAGUE_COEFFICIENTS[lid].reduce((a, b) => a + b, 0);
        const baseCoeff = BASE_COEFFICIENT_VALUES[lid] || BASE_COEFFICIENT_VALUES['default'];
        const currentBaseRep = BASE_LEAGUE_REPUTATION[lid] || BASE_LEAGUE_REPUTATION['default'];

        // Her 3 sezonda bir base reputation ayarla (hem yukarı hem aşağı)
        if (gameState.currentSeason % 3 === 0) {
            // DOMINANT LEAGUE (3x+ coefficient): +2 base reputation (SINIRSIZ! - Max 98)
            if (currentCoeffTotal > baseCoeff * 3) {
                const newBaseRep = Math.min(98, currentBaseRep + 2);
                BASE_LEAGUE_REPUTATION[lid] = newBaseRep;
                console.log(`[BASE REP ↑] ${lid}: ${currentBaseRep} → ${newBaseRep} (Dominant league!)`);
            }
            // WEAK LEAGUE (<0.5x coefficient): -2 base reputation (Min 35)
            // İngiltere 20 sezon kötüyse düşer!
            else if (currentCoeffTotal < baseCoeff * 0.5 && currentBaseRep > 35) {
                const newBaseRep = Math.max(35, currentBaseRep - 2);
                BASE_LEAGUE_REPUTATION[lid] = newBaseRep;
                console.log(`[BASE REP ↓] ${lid}: ${currentBaseRep} → ${newBaseRep} (Weak league - declining!)`);
            }
        }

        // DIRECT SUM: Each league's total points from all participating teams
        const seasonCoeff = Number((totalPoints).toFixed(1));

        console.log(`[COEFF DEBUG] ${lid} → Season Points: ${totalPoints} | History Before: ${LEAGUE_COEFFICIENTS[lid]}`);

        // Push NEW season points
        LEAGUE_COEFFICIENTS[lid].push(seasonCoeff);

        // Maintain 5-Year Window (Shift oldest)
        if (LEAGUE_COEFFICIENTS[lid].length > 5) {
            LEAGUE_COEFFICIENTS[lid].shift();
        }
    });

    // UPDATE REPUTATION DIRECTLY (Pure Meritocracy)
    leagueIdsForHistory.forEach(lid => {
        const history = LEAGUE_COEFFICIENTS[lid] || [];
        const totalScore = history.reduce((a, b) => a + b, 0);

        // Direct assignment. If England gets 105 points, Rep is 105.
        // We update the base reputation map which drives the game
        BASE_LEAGUE_REPUTATION[lid] = totalScore;
        LEAGUE_REPUTATION_BONUS[lid] = 0; // Reset bonuses, pure 5-year coefficient now.

        // Update Economic Multiplier
        // EN/PL is usually ~100-110 points. TR is ~35-40.
        // Map 40pts -> 1.0x, 100pts -> 3.5x
        const baseEcon = (BASE_LEAGUE_ECON_MULTIPLIERS as any)[lid] || 1.0;
        const calculatedMult = 1.0 + Math.max(0, (totalScore - 40) * 0.04); // +0.04 per point over 40
        const newBonus = Math.max(0, calculatedMult - baseEcon);

        LEAGUE_EUROPEAN_BONUS[lid] = Number(newBonus.toFixed(2));
    });

    console.log('[Coef Update] Season Coefficients:', leagueSeasonalPoints);
    console.log('[Coef Update] New Reputations:', BASE_LEAGUE_REPUTATION);

    // PERSIST TO GAME STATE
    gameState.baseLeagueReputations = { ...BASE_LEAGUE_REPUTATION };
    gameState.leagueReputationBonuses = { ...LEAGUE_REPUTATION_BONUS };
    gameState.leagueEuropeanBonuses = { ...LEAGUE_EUROPEAN_BONUS };
    gameState.leagueCoefficients = { ...LEAGUE_COEFFICIENTS };

    console.log('[Reputation] New Base Reps (Persisted):', gameState.baseLeagueReputations);
    console.log('[Reputation] New Econ Bonuses (Persisted):', gameState.leagueEuropeanBonuses);


    // 1. Calculate Standings & Awards
    const sensitiveSortedTeams = [...gameState.teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });

    // Get unique league IDs
    const leagueIds = [...new Set(gameState.teams.map(t => t.leagueId))];
    const leagueNames: Record<string, string> = {
        // Europe
        'tr': '🇹🇷 Süper Lig',
        'en': '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League',
        'es': '🇪🇸 La Liga',
        'it': '🇮🇹 Serie A',
        'de': '🇩🇪 Bundesliga',
        'fr': '🇫🇷 Ligue 1',
        'pt': '🇵🇹 Liga Portugal',
        'nl': '🇳🇱 Eredivisie',
        'be': '🇧🇪 Pro League',
        'gr': '🇬🇷 Super League',
        'ru': '🇷🇺 Premier League',
        'pl': '🇵🇱 Ekstraklasa',
        'cz': '🇨🇿 First League',
        'ro': '🇷🇴 Liga I',
        'hr': '🇭🇷 HNL',
        'rs': '🇷🇸 SuperLiga',
        'ch': '🇨🇭 Super League',
        'at': '🇦🇹 Bundesliga',
        'sco': '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Premiership',

        // Americas
        'ar': '🇦🇷 Liga Profesional',
        'br': '🇧🇷 Série A',
        'mx': '🇲🇽 Liga MX',
        'us': '🇺🇸 MLS',
        'cl': '🇨🇱 Primera División',
        'uy': '🇺🇾 Primera División',
        'co': '🇨🇴 Categoría Primera A',
        'py': '🇵🇾 División Profesional',
        'ec': '🇪🇨 Serie A',
        'cr': '🇨🇷 Primera División',
        'car': '🏴‍☠️ Caribbean League',

        // Asia
        'cn': '🇨🇳 Chinese Super League',
        'jp': '🇯🇵 J1 League',
        'kr': '🇰🇷 K League 1',
        'sa': '🇸🇦 Saudi Pro League',
        'in': '🇮🇳 Indian Super League',
        'my': '🇲🇾 Super League',
        'id': '🇮🇩 Liga 1',

        // Africa
        'eg': '🇪🇬 Egyptian Premier League',
        'ma': '🇲🇦 Botola Pro',
        'za': '🇿🇦 Premier Division',
        'ng': '🇳🇬 NPFL',
        'dz': '🇩🇿 Ligue 1',
        'gh': '🇬🇭 Premier League',
        'ci': '🇨🇮 Ligue 1',
        'ke': '🇰🇪 Premier League',
        'sn': '🇸🇳 Ligue 1',
        'tn': '🇹🇳 Ligue 1',

        // Oceania
        'au': '🇦🇺 A-League'
    };

    // Create history entry for EACH league
    const historyEntries: LeagueHistoryEntry[] = leagueIds.map(leagueId => {
        const leagueTeams = gameState.teams.filter(t => t.leagueId === leagueId);
        const sortedLeague = [...leagueTeams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });

        const winner = sortedLeague[0];
        const runnerUp = sortedLeague[1];

        // Find Top Scorer & Assister for this league only
        const leaguePlayerIds = new Set(leagueTeams.map(t => t.id));
        const leaguePlayers = gameState.players.filter(p => leaguePlayerIds.has(p.teamId));

        let topScorer = { name: 'N/A', count: 0 };
        let topAssister = { name: 'N/A', count: 0 };
        let bestRated = { name: 'N/A', rating: 0 };

        leaguePlayers.forEach(p => {
            if (p.stats && p.stats.goals > topScorer.count) {
                topScorer = { name: `${p.firstName} ${p.lastName}`, count: p.stats.goals };
            }
            if (p.stats && p.stats.assists > topAssister.count) {
                topAssister = { name: `${p.firstName} ${p.lastName}`, count: p.stats.assists };
            }
            if (p.stats && (p.stats.averageRating || 0) > bestRated.rating && (p.stats.appearances || 0) >= 5) {
                bestRated = { name: `${p.firstName} ${p.lastName}`, rating: p.stats.averageRating || 0 };
            }
        });

        const entry: LeagueHistoryEntry = {
            season: gameState.currentSeason,
            leagueId: leagueId,
            leagueName: leagueNames[leagueId] || leagueId.toUpperCase(),
            championId: winner?.id || '',
            championName: winner?.name || 'N/A',
            championColor: winner?.primaryColor || '#888',
            runnerUpName: runnerUp?.name || 'N/A',
            topScorer: `${topScorer.name} (${topScorer.count})`,
            topAssister: `${topAssister.name} (${topAssister.count})`,
            bestRatedPlayer: bestRated.rating > 0 ? `${bestRated.name} (${bestRated.rating.toFixed(2)})` : undefined
        };

        return entry;
    });

    // === ADD GLOBAL/INTERNATIONAL CUPS ENTRY ===
    if (gameState.europeanCup?.winnerId || gameState.europaLeague?.winnerId) {
        const clWinner = gameState.teams.find(t => t.id === gameState.europeanCup?.winnerId);
        const elWinner = gameState.teams.find(t => t.id === gameState.europaLeague?.winnerId);
        const scWinner = gameState.teams.find(t => t.id === gameState.superCup?.winnerId);

        // Find runner up for CL (Intercontinental Elite)
        let clRunnerUpName = 'N/A';
        // USE KNOCKOUT MATCHES FOR FINAL
        if (gameState.europeanCup?.knockoutMatches) {
            const final = gameState.europeanCup.knockoutMatches.find(m => m.stage === 'FINAL');
            if (final && final.winnerId) {
                const runnerUpId = final.homeTeamId === final.winnerId ? final.awayTeamId : final.homeTeamId;
                const runnerUp = gameState.teams.find(t => t.id === runnerUpId);
                if (runnerUp) clRunnerUpName = runnerUp.name;
            }
        }

        historyEntries.push({
            season: gameState.currentSeason,
            leagueId: 'global',
            leagueName: '🌍 Intercontinental',
            championId: clWinner?.id || '',
            championName: clWinner?.name || 'N/A',
            championColor: clWinner?.primaryColor || '#333',
            runnerUpName: clRunnerUpName,
            topScorer: '-',
            topAssister: '-',
            championsLeagueWinner: clWinner?.name,
            europaLeagueWinner: elWinner?.name,
            superCupWinner: scWinner?.name
        });
    }

    // 2. Economy: Prize Money Distribution (BALANCED - reduced from previous)
    // League prize money scales with league economy multiplier
    const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
    const leagueMult = getLeagueMultiplier(userTeam?.leagueId || 'tr');

    // Base prizes for Turkish league, scaled for others
    // Base prizes for Turkish league, scaled for others
    // REVISED: 10M Base for Champion (requests ~10M TR, ~35M EN)
    const basePrizes = [10000000, 6000000, 4000000, 2000000]; // Top 4
    const prizeDistribution = basePrizes.map(p => Math.floor(p * leagueMult));

    let updatedTeams = sensitiveSortedTeams.map((t, _globalIndex) => {
        // Calculate LEAGUE-specific position for this team
        const leagueTeamsSorted = sensitiveSortedTeams.filter(team => team.leagueId === t.leagueId);
        const leaguePosition = leagueTeamsSorted.findIndex(team => team.id === t.id);
        const leagueSize = leagueTeamsSorted.length;

        // Use league-specific multiplier for prizes
        const teamLeagueMult = getLeagueMultiplier(t.leagueId);

        let prize = Math.floor(500000 * teamLeagueMult); // Base participation prize
        if (leaguePosition < 4) prize = Math.floor(basePrizes[leaguePosition] * teamLeagueMult);
        else if (leaguePosition < 6) prize = Math.floor(2000000 * teamLeagueMult); // Challenge Cup spots

        // SPONSOR CHAMPIONSHIP BONUSES - Only for user team with sponsor
        let sponsorBonus = 0;
        if (t.id === gameState.userTeamId && t.sponsor) {
            if (leaguePosition === 0 && t.sponsor.bonus1st) {
                sponsorBonus = t.sponsor.bonus1st; // 1st place bonus
            } else if (leaguePosition === 1 && t.sponsor.bonus2nd) {
                sponsorBonus = t.sponsor.bonus2nd; // 2nd place bonus
            } else if (leaguePosition === 2 && t.sponsor.bonus3rd) {
                sponsorBonus = t.sponsor.bonus3rd; // 3rd place bonus
            }
        }

        // === 3-LAYER CLUB REPUTATION UPDATE (Scaled) ===
        const L = getLeagueReputation(t.leagueId);

        // Layer 2: Domestic Dominance (0-100)
        // Champion = 100, 2nd = 93...
        const D = leaguePosition !== -1 ? Math.max(10, 100 - (leaguePosition * 5)) : 50;

        // Layer 3: Europe Success (Rolling 5-Year Sum)
        const leaguePointsHistory = LEAGUE_COEFFICIENTS[t.leagueId] || [];
        const leagueTotalPoints = leaguePointsHistory.reduce((a, b) => a + b, 0);

        // BOOST: Treat European Points as highly valuable
        // If League Total is 40, E is 50. If 100, E is 100.
        // We boost the impact of league coefficients to match the 0-100 scale better
        const E = Math.min(120, leagueTotalPoints * 1.25);

        // 3-Layer Formula: Rebalanced to value Performance (D) and Europe (E) more than Base League (L)
        // This allows a Turkish team (L=40) to reach higher reputation via D(100) and E(50+)
        // Old: 40% L, 40% D, 20% E -> 16 + 40 + 8 = 64 (6400 Rep)
        // New: 25% L, 50% D, 25% E -> 10 + 50 + 12.5 = 72.5 (7250 Rep)
        const newRepScore = (L * 0.25) + (D * 0.50) + (E * 0.25);

        // Scale to 0-10000 
        let targetRep = Math.floor(newRepScore * 100);

        // LEGACY FLOOR: If existing rep is much higher than target (e.g. Besiktas 4800 vs Target 4500),
        // we shouldn't punish them strictly for "playing in a weak league".
        // Instead, we use a softer target that respects their current status.
        if (t.reputation > targetRep) {
            targetRep = Math.floor((t.reputation + targetRep) / 2); // Meet halfway
        }

        // Damping: Move 15% towards target (Slower change)
        let dampedRep = Math.floor(t.reputation * 0.85 + targetRep * 0.15);

        // CHAMPION PROTECTION: If you win the league, your reputation should NOT drop
        // European representatives deserve significant reputation boosts
        if (leaguePosition === 0) {
            // Champion: Guarantee minimum +500 reputation
            const guaranteedMin = t.reputation + 500;
            dampedRep = Math.max(guaranteedMin, dampedRep);
        }
        // 2ND PLACE PROTECTION (Champions League spot)
        else if (leaguePosition === 1) {
            const guaranteedMin = t.reputation + 400;
            dampedRep = Math.max(guaranteedMin, dampedRep);
        }
        // 3RD PLACE BONUS (Europa League spot)
        else if (leaguePosition === 2) {
            const guaranteedMin = t.reputation + 200;
            dampedRep = Math.max(guaranteedMin, dampedRep);
        }
        // 4TH PLACE BONUS (Europa League spot)
        else if (leaguePosition === 3) {
            const guaranteedMin = t.reputation + 100;
            dampedRep = Math.max(guaranteedMin, dampedRep);
        }

        const newReputation = Math.max(1000, Math.min(10000, dampedRep)); // Sınır yok

        // Sezon sonu ödülü finansal kayda ekle
        if (t.financials?.history && t.financials.history.length > 0) {
            const lastRecord = t.financials.history[t.financials.history.length - 1];
            if (lastRecord.week === gameState.currentWeek) {
                lastRecord.income.seasonEnd = prize + sponsorBonus;
                lastRecord.income.total += prize + sponsorBonus;
                lastRecord.balance += prize + sponsorBonus;
                lastRecord.budgetAfter = t.budget + prize + sponsorBonus;
            }
        }

        return {
            ...t,
            budget: t.budget + prize + sponsorBonus,
            reputation: newReputation,
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }, // Reset Stats
            recentForm: [],
            sponsor: undefined, // Reset sponsor for new season
            financials: t.financials ? { ...t.financials, seasonTotals: { transferIncomeThisSeason: 0, transferExpensesThisSeason: 0 } } : undefined, // Reset season transfer totals
            lastSeasonPosition: leaguePosition // Yeni sezon kupalarında kullanılacak lig pozisyonu
        };
    });

    // 3. Player Lifecycle (Aging, Progression, Contracts, Retirement)
    const retiredPlayerNames: string[] = [];
    const promotedPlayerNames: string[] = []; // Regens

    let updatedPlayers = gameState.players.map(p => {
        const age = p.age + 1;
        let overall = p.overall;
        let potential = p.potential;

        // Progression Logic
        if (age < 24) {
            // Young player growth
            const growthChance = 0.8;
            if (Math.random() < growthChance && overall < potential) {
                overall += getRandomInt(1, 4); // Significant growth
            }
        } else if (age > 30) {
            // Old player decline
            const declineChance = 0.3 + ((age - 30) * 0.1);
            if (Math.random() < declineChance) {
                overall -= getRandomInt(1, 3);
            }
        }

        overall = Math.min(99, Math.max(40, overall));

        // Contract Management
        let contractYears = (p.contractYears || 1) - 1;
        let teamId = p.teamId;
        let newContractSigned = false; // Track if we need to update salary

        if (contractYears <= 0) {
            if (p.teamId === gameState.userTeamId) {
                // User's players with expired contracts - good ones go to bigger clubs!
                if (overall >= 75) {
                    // Good player leaves - find a better team
                    const betterTeams = gameState.teams.filter(t =>
                        t.id !== gameState.userTeamId &&
                        t.reputation > (gameState.teams.find(ut => ut.id === gameState.userTeamId)?.reputation || 0)
                    ).sort((a, b) => b.reputation - a.reputation);

                    if (betterTeams.length > 0) {
                        // Join a top team (with some randomness)
                        const targetTeam = betterTeams[Math.floor(Math.random() * Math.min(3, betterTeams.length))];
                        teamId = targetTeam.id;
                        contractYears = 3; // Signs 3-year deal
                        newContractSigned = true; // NEW CONTRACT = NEW SALARY
                    } else {
                        teamId = 'FREE_AGENT';
                    }
                } else {
                    teamId = 'FREE_AGENT';
                }
            } else {
                // AI Logic: Renew key players, release others
                if (overall > 72) {
                    contractYears = getRandomInt(1, 3); // Auto renew
                    newContractSigned = true; // NEW CONTRACT = NEW SALARY
                } else {
                    teamId = 'FREE_AGENT';
                }
            }
        }

        // Value update based on new overall/age - use same formula as initial generation
        // This ensures consistency across seasons (MUST match generatePlayer formula with overall-60)
        // MARKET INFLATION: Scale value by inflation multiplier (1.0-2.0x based on total economy)
        const baseValue = Math.floor((Math.pow(1.13, overall - 60) * 100000) * (1 - Math.max(0, age - 26) * 0.025));
        const newValue = Math.floor(baseValue * inflationMultiplier);

        // CONTRACT-LOCKED SALARY: Salary only updates on NEW CONTRACT, not value changes!
        // This allows signing young talents at low wages and watching them grow

        let finalSalary = p.salary;

        if (newContractSigned) {
            // Retrieve team to get league multiplier
            const team = gameState.teams.find(t => t.id === teamId);
            const leagueMult = getLeagueMultiplier(team?.leagueId || 'en'); // Default to high wages if unknown (safety)

            // Re-calculate effective overall for accurate wage base (just in case)
            // Use existing value formula base, but for wage
            // WAGE FORMULA: Base Wage * (0.8 + (LeagueMult * 0.2))
            const baseWage = Math.floor((Math.pow(1.13, overall - 50) * 100000) * 0.005);
            const scaledWage = Math.floor(baseWage * (0.8 + (leagueMult * 0.2)));
            // Ensure realistic minimum wages
            const finalWage = Math.max(250, scaledWage);

            finalSalary = finalWage * 52;
        }

        return {
            ...p,
            age,
            overall,
            potential: Math.max(overall, potential), // Potential shouldn't drop below current? Or maybe it should. Keep it simple.
            value: Math.max(500000, newValue),
            salary: finalSalary, // Contract-locked salary (only updates on new contract)
            contractYears,
            teamId,
            stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, averageRating: 0 }, // Reset season stats
            weeksInjured: 0,
            matchSuspension: 0,
            condition: 100,
            morale: 75 // Reset morale
        };
    });

    // Handle Retirements (NO SAME-TEAM REGEN - Use Global Pool Instead)
    const finalPlayers: Player[] = [];

    updatedPlayers.forEach(p => {
        let shouldRetire = false;
        // Retirement check only for non-free-agents to simulate career end, free agents might just disappear
        if (p.age >= 39) shouldRetire = true;
        else if (p.age >= 34 && Math.random() < 0.25) shouldRetire = true;

        if (shouldRetire) {
            retiredPlayerNames.push(`${p.firstName} ${p.lastName}`);
            // NO REGEN - Player just retires! Global Pool will provide new talents.
        } else {
            // Keep player
            finalPlayers.push(p);
        }
    });

    // ========== GLOBAL YOUTH POOL SYSTEM ==========
    // Instead of same-team regens, generate a global pool of youth talents from around the world
    // Teams get picks based on scoutLevel + academyLevel (better infrastructure = better prospects)
    const YOUTH_POOL_SIZE = 80; // ~3-4 per team average
    const YOUTH_NATIONALITIES = [
        'Brazil', 'Argentina', 'France', 'Germany', 'Spain', 'Portugal', 'Netherlands',
        'Belgium', 'England', 'Italy', 'Nigeria', 'Senegal', 'Morocco', 'Egypt', 'Ghana',
        'Japan', 'South Korea', 'Australia', 'Mexico', 'Colombia', 'Uruguay', 'Chile',
        'Turkey', 'Croatia', 'Serbia', 'Poland', 'Czech', 'Austria', 'Switzerland', 'USA'
    ];
    const YOUTH_POSITIONS: Position[] = [Position.GK, Position.DEF, Position.MID, Position.FWD];

    // Generate global youth pool
    const globalYouthPool: Player[] = [];
    for (let i = 0; i < YOUTH_POOL_SIZE; i++) {
        const nationality = YOUTH_NATIONALITIES[Math.floor(Math.random() * YOUTH_NATIONALITIES.length)];
        const position = YOUTH_POSITIONS[Math.floor(Math.random() * YOUTH_POSITIONS.length)];
        const basePotential = 60 + Math.floor(Math.random() * 35); // 60-94 potential

        const youth = generatePlayer(
            'YOUTH_POOL', // Temporary team ID
            position,
            nationality,
            [16, 19],
            [basePotential, Math.min(99, basePotential + 5)]
        );
        youth.overall = getRandomInt(50, 65);
        youth.value = youth.overall * 100000;
        youth.salary = youth.value * 0.12; // Low youth salary
        youth.lineup = 'RESERVE';
        youth.lineupIndex = 99;

        globalYouthPool.push(youth);
    }

    // Sort pool by potential (best talents first)
    globalYouthPool.sort((a, b) => b.potential - a.potential);

    // Calculate team picking power (scoutLevel + academyLevel + random factor)
    const teamPickingPower: { teamId: string; power: number }[] = updatedTeams.map(t => ({
        teamId: t.id,
        power: (t.staff?.scoutLevel || 1) * 2 + (t.facilities?.academyLevel || 1) * 1.5 + Math.random() * 5
    }));

    // Sort by picking power (best scouts pick first)
    teamPickingPower.sort((a, b) => b.power - a.power);

    // Distribute youth players to teams
    let youthIndex = 0;
    teamPickingPower.forEach(({ teamId, power }) => {
        // Each team gets 1-4 picks based on power (roughly academyLevel/5 + 1)
        const team = updatedTeams.find(t => t.id === teamId);
        const academyLevel = team?.facilities?.academyLevel || 1;
        const picksAllowed = Math.max(1, Math.min(4, Math.floor(academyLevel / 4) + 1));

        for (let pick = 0; pick < picksAllowed && youthIndex < globalYouthPool.length; pick++) {
            const youth = globalYouthPool[youthIndex];
            youth.teamId = teamId;
            finalPlayers.push(youth);
            promotedPlayerNames.push(`${youth.firstName} ${youth.lastName} (${youth.nationality})`);
            youthIndex++;
        }
    });

    console.log(`[Season End] Global Youth Pool: ${YOUTH_POOL_SIZE} generated, ${youthIndex} distributed to teams`);


    // 4. FIX: Generate fixtures PER LEAGUE, not all teams mixed!
    const fixtureLeagueIds = [...new Set(updatedTeams.map(t => t.leagueId))];
    const allNewMatches: Match[] = [];
    fixtureLeagueIds.forEach(leagueId => {
        const leagueTeams = updatedTeams.filter(t => t.leagueId === leagueId);
        // BUGFIX: Get singleRound setting from LEAGUE_PRESETS for each league
        const leaguePreset = LEAGUE_PRESETS.find(lp => lp.id === leagueId);
        // 'matchFormat' is available on 'ar' and 'br' leagues in constants.ts
        // Explicitly cast to any because standard type might not show it yet if types.ts isn't updated
        const isSingleRound = (leaguePreset as any)?.matchFormat === 'single-round';

        console.log(`[Season End] Generating schedule for league ${leagueId}. Teams: ${leagueTeams.length}, SingleRound: ${isSingleRound}`);

        const leagueMatches = generateSeasonSchedule(leagueTeams, isSingleRound);
        allNewMatches.push(...leagueMatches);
    });

    // ========== MANAGER RATING SYSTEM - REBALANCED ==========
    // Calculate user's position in their league
    const userLeagueTeams = sensitiveSortedTeams.filter(t => t.leagueId === gameState.leagueId);
    const userPosition = userLeagueTeams.findIndex(t => t.id === gameState.userTeamId) + 1;
    const totalTeams = userLeagueTeams.length;

    // Calculate EXPECTED position based on squad strength (average overall)
    const userPlayers = gameState.players.filter(p => p.teamId === gameState.userTeamId);
    const userAvgOverall = userPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(userPlayers.length, 1);

    // Rank all teams by squad strength to get expected position
    const teamStrengths = userLeagueTeams.map(t => {
        const teamPlayers = gameState.players.filter(p => p.teamId === t.id);
        const avgOverall = teamPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(teamPlayers.length, 1);
        return { teamId: t.id, strength: avgOverall };
    }).sort((a, b) => b.strength - a.strength);

    const expectedPosition = teamStrengths.findIndex(t => t.teamId === gameState.userTeamId) + 1;
    const performanceDelta = expectedPosition - userPosition; // Positive = overperformed

    let managerRating = gameState.managerRating || 50;
    let ratingChange = 0;
    let ratingChangeMessage = '';

    // Base rating change from league position (MORE GRANULAR)
    if (userPosition === 1) {
        ratingChange += 10;
        ratingChangeMessage = '🏆 Şampiyonluk! (+10 rating)';
    } else if (userPosition === 2) {
        ratingChange += 6;
        ratingChangeMessage = '🥈 İkinci oldu (+6 rating)';
    } else if (userPosition <= 4) {
        ratingChange += 4;
        ratingChangeMessage = '🥉 Top 4 (+4 rating)';
    } else if (userPosition <= 8) {
        ratingChange += 2;
        ratingChangeMessage = '⬆️ Üst sıra (+2 rating)';
    } else if (userPosition <= totalTeams / 2) {
        ratingChange += 0; // Mid-table = neutral
        ratingChangeMessage = '➡️ Orta sıra (0 rating)';
    } else if (userPosition > totalTeams - 3) {
        // Relegation zone (SOFTENED: was -15)
        ratingChange -= 8;
        ratingChangeMessage = '⬇️ Küme düşme tehlikesi! (-8 rating)';
    } else {
        // Below average (SOFTENED: was -5)
        ratingChange -= 3;
        ratingChangeMessage = '📉 Beklentilerin altında (-3 rating)';
    }

    // OVERPERFORMANCE BONUS: Reward managers who exceed expectations
    if (performanceDelta > 0) {
        const overperformBonus = Math.min(10, Math.round(performanceDelta * 1.5));
        ratingChange += overperformBonus;
        ratingChangeMessage += `\n⭐ Beklentilerin üstünde! (+${overperformBonus} bonus)`;
    } else if (performanceDelta < -3) {
        // Only penalize significant underperformance
        const underperformPenalty = Math.max(-8, Math.round(performanceDelta * 1.0));
        ratingChange += underperformPenalty;
        ratingChangeMessage += `\n📉 Beklentilerin çok altında (${underperformPenalty} ceza)`;
    }

    // European cup bonuses
    if (gameState.europeanCup?.winnerId === gameState.userTeamId) {
        ratingChange += 20;
        ratingChangeMessage += '\n🏆 Şampiyonlar Ligi şampiyonu! (+20 rating)';
    } else if (gameState.europaLeague?.winnerId === gameState.userTeamId) {
        ratingChange += 12;
        ratingChangeMessage += '\n🏆 Challenge Cup şampiyonu! (+12 rating)';
    }

    managerRating = Math.max(10, Math.min(100, managerRating + ratingChange));

    // Determine trophy wins this season
    const wonLeague = userPosition === 1;
    const wonCL = gameState.europeanCup?.winnerId === gameState.userTeamId;
    const wonUEFA = gameState.europaLeague?.winnerId === gameState.userTeamId;
    const wonSuperCup = gameState.superCup?.winnerId === gameState.userTeamId;

    // Update career history with trophy info
    const careerHistoryEntry = {
        season: gameState.currentSeason,
        teamName: userTeam?.name || 'Unknown',
        position: userPosition,
        rating: managerRating,
        leagueChampion: wonLeague,
        championsLeagueWinner: wonCL,
        uefaCupWinner: wonUEFA,
        superCupWinner: wonSuperCup
    };
    const updatedCareerHistory = [...(gameState.managerCareerHistory || []), careerHistoryEntry];

    // Update trophy counts
    const currentTrophies = gameState.managerTrophies || {
        leagueTitles: 0, championsLeagueTitles: 0, uefaCupTitles: 0, superCupTitles: 0
    };
    const updatedTrophies = {
        leagueTitles: currentTrophies.leagueTitles + (wonLeague ? 1 : 0),
        championsLeagueTitles: currentTrophies.championsLeagueTitles + (wonCL ? 1 : 0),
        uefaCupTitles: currentTrophies.uefaCupTitles + (wonUEFA ? 1 : 0),
        superCupTitles: currentTrophies.superCupTitles + (wonSuperCup ? 1 : 0)
    };


    // ========== JOB OFFERS GENERATION ==========
    // Generate job offers based on manager rating and available positions
    const leagueNamesForOffers: Record<string, string> = {
        'tr': 'Süper Lig', 'en': 'Premier League', 'es': 'La Liga',
        'it': 'Serie A', 'de': 'Bundesliga', 'fr': 'Ligue 1'
    };

    const newJobOffers: JobOffer[] = [];

    // Generate offers from teams that might want you
    const allLeagueTeams = updatedTeams.filter(t => t.id !== gameState.userTeamId);

    allLeagueTeams.forEach(team => {
        // Calculate team's "required manager rating" based on reputation - REBALANCED: Lower thresholds
        let requiredRating: number;
        if (team.reputation >= 9500) requiredRating = 75; // Elite (was 85)
        else if (team.reputation >= 9000) requiredRating = 68; // Top clubs (was 80)
        else if (team.reputation >= 8500) requiredRating = 58; // Strong clubs (was 70)
        else if (team.reputation >= 8000) requiredRating = 48; // Good clubs (was 60)
        else if (team.reputation >= 7000) requiredRating = 38; // Mid-tier (was 50)
        else if (team.reputation >= 5500) requiredRating = 28; // Lower-mid (was 40)
        else requiredRating = 15; // Small clubs (was 25)

        // Calculate offer chance - REBALANCED: Base 35% (was 15%)
        let offerChance = 0.35;

        // Performance bonus: increase chance if manager overperformed
        if (performanceDelta > 0) {
            offerChance += Math.min(0.15, performanceDelta * 0.03); // Up to +15%
        }
        // Recent championship bonus
        if (userPosition <= 3) {
            offerChance += 0.10; // Top 3 finish = more interest
        }

        // Only make offer if manager meets requirement AND passes chance roll
        if (managerRating >= requiredRating && Math.random() < offerChance) {
            const weeklySalary = Math.floor(team.reputation * 1.5 + managerRating * 500);

            newJobOffers.push({
                id: uuid(),
                teamId: team.id,
                teamName: team.name,
                leagueId: team.leagueId,
                leagueName: leagueNamesForOffers[team.leagueId] || team.leagueId.toUpperCase(),
                reputation: team.reputation,
                salary: weeklySalary,
                requiredRating,
                expiresWeek: 4 // Expires after 4 weeks into new season
            });
        }
    });

    // Sort by reputation (best offers first)
    newJobOffers.sort((a, b) => b.reputation - a.reputation);

    // Limit to top 6 offers (was 5)
    const limitedOffers = newJobOffers.slice(0, 6);

    // --- SUPER CUP GENERATION ---
    // --- SUPER CUP GENERATION ---
    // DISABLED LEGACY LOGIC: Super Cup is now scheduled at the END of the season (Week 39+), not Week 1 of next season.
    // The winners of Season X play at end of Season X.
    let superCupMatch: any = undefined; // Use 'any' to satisfy type if needed, or update GameState type if strictly typed


    // 5. Update Game State
    const newState = {
        ...gameState,
        currentSeason: gameState.currentSeason + 1,
        currentWeek: 1,
        history: [...gameState.history, ...historyEntries],
        teams: updatedTeams,
        players: finalPlayers,
        matches: allNewMatches,
        europeanCup: generateGlobalCup({ ...gameState, teams: updatedTeams, currentSeason: gameState.currentSeason + 1 } as GameState, 0),
        europaLeague: generateGlobalCup({ ...gameState, teams: updatedTeams, currentSeason: gameState.currentSeason + 1 } as GameState, 1),
        superCup: superCupMatch,
        managerRating,
        managerCareerHistory: updatedCareerHistory,
        managerTrophies: updatedTrophies,
        jobOffers: limitedOffers,

        messages: [{
            id: uuid(),
            week: 1,
            type: MessageType.BOARD,
            subject: `Season ${gameState.currentSeason + 1} Begins!`,
            body: `Yeni sezon başladı. ${ratingChangeMessage}\nMenajer Rating: ${managerRating}/100\n${limitedOffers.length > 0 ? `📩 ${limitedOffers.length} yeni iş teklifi geldi!` : ''}`,
            isRead: false,
            date: new Date().toISOString()
        }, ...gameState.messages],

        // PERSIST GLOBAL BONUSES AND BASE REPUTATIONS
        leagueReputationBonuses: { ...LEAGUE_REPUTATION_BONUS },
        baseLeagueReputations: { ...BASE_LEAGUE_REPUTATION },
        leagueEuropeanBonuses: { ...LEAGUE_EUROPEAN_BONUS },
        leagueCoefficientHistory: { ...gameState.leagueCoefficientHistory } // EXPLICIT PERSISTENCE
    };

    // === SAVE FILE HEALTH CHECK (User Request) ===
    // 1. Trim History Arrays (Memory Optimization)
    // Keep only last 10 seasons (years) of history, not just last 10 entries.
    // Each season adds one entry per league (e.g. 48 leagues => 48 entries/season).
    if (newState.history.length > 0) {
        const seasons = Array.from(
            new Set(
                newState.history
                    .map(h => h.season)
                    .filter((s): s is number => typeof s === 'number' && Number.isFinite(s))
            )
        ).sort((a, b) => a - b);

        const allowedSeasons = new Set(seasons.slice(-10));
        if (allowedSeasons.size > 0) {
            newState.history = newState.history.filter(h => allowedSeasons.has(h.season));
        }
    }

    // 2. Trim Player History (Detailed logs)
    // Keep only last 5 morale entries per player to save JSON space
    newState.players.forEach(p => {
        if (p.moraleHistory && p.moraleHistory.length > 5) {
            p.moraleHistory = p.moraleHistory.slice(-5);
        }
    });

    return { newState, retired: retiredPlayerNames, promoted: promotedPlayerNames };
}

// ========== LIG KUPASI SYSTEM (Domestic Cup) ==========
// import { EuropeanCup, EuropeanCupMatch } from '../types'; (Removed)

export const generateLeagueCup = (gameState: GameState): GlobalCup => {
    // Use top 16 teams by reputation for knockout cup
    const sortedTeams = [...gameState.teams].sort((a, b) => b.reputation - a.reputation);
    const qualifiedTeamIds = sortedTeams.slice(0, Math.min(16, sortedTeams.length)).map(t => t.id);

    // Shuffle for randomized draw
    const shuffled = [...qualifiedTeamIds].sort(() => Math.random() - 0.5);

    // Determine round based on team count
    const teamCount = shuffled.length;
    let stage: 'ROUND_16' | 'QUARTER' | 'SEMI' | 'FINAL' = 'QUARTER';
    if (teamCount >= 16) stage = 'ROUND_16';
    else if (teamCount >= 8) stage = 'QUARTER';
    else if (teamCount >= 4) stage = 'SEMI';
    else stage = 'FINAL';

    // Generate first round matches
    const firstRoundMatches: GlobalCupMatch[] = [];
    const matchCount = Math.floor(teamCount / 2);

    for (let i = 0; i < matchCount; i++) {
        firstRoundMatches.push({
            id: uuid(),
            stage: stage,
            homeTeamId: shuffled[i * 2],
            awayTeamId: shuffled[i * 2 + 1],
            homeScore: 0,
            awayScore: 0,
            isPlayed: false
        });
    }

    return {
        season: gameState.currentSeason,
        isActive: true,
        qualifiedTeamIds,
        groups: [], // Domestic cup has no groups
        knockoutMatches: firstRoundMatches,
        currentStage: stage
    };
};

// ========== GLOBAL CUP (WORLD CHAMPIONSHIP) ==========
// 48 Teams (Top 2 from ALL 24 leagues)
// 8 Groups of 6 Teams
// Top 2 advance to Round of 16

export const generateGlobalCup = (gameState: GameState, tier: number = 0): GlobalCup => {
    const qualifiedTeams: Team[] = [];
    const groups: GlobalCupGroup[] = [];

    // Group definitions matching the Regions in teams.ts
    const groupRegions = ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D', 'GROUP_E', 'GROUP_F', 'GROUP_G', 'GROUP_H'];
    const groupDisplayNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    groupRegions.forEach((regionId, index) => {
        const groupName = groupDisplayNames[index];
        const groupTeams: string[] = [];

        // Find all 6 leagues assigned to this Region/Group
        const regionLeagues = LEAGUE_PRESETS.filter(l => l.region === regionId);

        console.log(`[Global Cup] Forming Group ${groupName} (Region: ${regionId}) - Leagues found: ${regionLeagues.length}`);

        regionLeagues.forEach(league => {
            // Get teams from this league
            const leagueTeams = gameState.teams.filter(t => t.leagueId === league.id);
            if (leagueTeams.length === 0) return;

            // Sort by points to find top teams
            // BUGFIX: Sezon sonu puanlar sıfırlanıyor, bu yüzden lastSeasonPosition'ı kullan
            const sorted = [...leagueTeams].sort((a, b) => {
                // Önce lastSeasonPosition'ı kontrol et (eğer varsa)
                const aPos = a.lastSeasonPosition ?? Infinity; // Pozisyon yoksa sona koy
                const bPos = b.lastSeasonPosition ?? Infinity;

                if (aPos !== bPos) return aPos - bPos; // Pozisyona göre sırala (0=şampiyon)

                // Pozisyon yoksa reputation'a fallback et (geriye uyumluluk)
                return b.reputation - a.reputation;
            });

            // Select based on Tier (0 = Champion, 1 = Runner-Up)
            if (sorted.length > tier) {
                const selectedTeam = sorted[tier];
                if (!groupTeams.includes(selectedTeam.id) && !qualifiedTeams.some(t => t.id === selectedTeam.id)) {
                    groupTeams.push(selectedTeam.id);
                    qualifiedTeams.push(selectedTeam);
                    console.log(`[Cup Tier ${tier}] Added ${selectedTeam.name} (${league.id}) to Group ${groupName} (LastSeasonPos: ${selectedTeam.lastSeasonPosition ?? 'N/A'})`);
                }
            }
        });

        // EĞER GRUPTA 6 TAKIM TAMAMLANAMADIYSA (Hata önleyici)
        if (groupTeams.length < 6) {
            console.warn(`[Global Cup] Group ${groupName} incomplete. Found: ${groupTeams.length}. Fixing...`);
            // Eksik yer boş kalsın, simülasyon bunu "BAY" geçecek şekilde ayarlıdır veya
            // ileride buraya rastgele takım atayabilirsin.
            // Şimdilik sadece uygulamanın çökmesini engelliyoruz.
        }

        // Initialize Standings
        const standings: GlobalCupGroupTeam[] = groupTeams.map(tid => ({
            teamId: tid,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            points: 0
        }));

        // Generate Group Matches (Single Round Robin - 5 matches per team)
        // Cup Weeks: 6, 10, 14, 18, 22
        const matches: GlobalCupMatch[] = [];
        const groupWeeks = [6, 10, 14, 18, 22];

        // Pairing logic (designed for 6 teams)
        // If < 6 teams, this might have undefined errors, but we assume strict 48-league structure
        if (groupTeams.length === 6) {
            const pairings = [
                [[0, 5], [1, 4], [2, 3]],
                [[5, 2], [3, 1], [4, 0]],
                [[5, 4], [0, 3], [1, 2]],
                [[1, 5], [2, 0], [3, 4]],
                [[5, 3], [4, 2], [0, 1]]
            ];

            pairings.forEach((roundPairs, roundIndex) => {
                roundPairs.forEach(pair => {
                    matches.push({
                        id: uuid(),
                        stage: 'GROUP',
                        groupName: groupName,
                        homeTeamId: groupTeams[pair[0]],
                        awayTeamId: groupTeams[pair[1]],
                        homeScore: 0,
                        awayScore: 0,
                        isPlayed: false,
                        events: [], // Initialize events array
                        stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
                        week: groupWeeks[roundIndex]
                    });
                });
            });
        } else {
            console.warn(`[Global Cup] Group ${groupName} has ${groupTeams.length} teams instead of 6! Skipping match generation.`);
        }

        groups.push({
            id: uuid(),
            name: groupName,
            teams: groupTeams,
            standings,
            matches
        });
    });

    return {
        season: gameState.currentSeason,
        isActive: true,
        qualifiedTeamIds: qualifiedTeams.map(t => t.id),
        groups,
        knockoutMatches: [], // Empty initially
        currentStage: 'GROUP', // Start at GROUP stage
        winnerId: undefined,
        _generatedForeignTeams: []
    };
};

// Simulate a Global Cup match (Group or Knockout)
export const simulateGlobalCupMatch = (
    cup: GlobalCup,
    matchId: string,
    homeTeam: Team,
    awayTeam: Team,
    homePlayers: Player[],
    awayPlayers: Player[],
    prizeMultiplier: number = 1.0
): { updatedCup: GlobalCup, updatedHomeTeam: Team, updatedAwayTeam: Team } => {
    // Find match in Groups OR Knockouts
    let match: GlobalCupMatch | undefined;
    let group: GlobalCupGroup | undefined;

    // Check Groups first
    if (cup.groups) {
        for (const g of cup.groups) {
            match = g.matches.find(m => m.id === matchId);
            if (match) {
                group = g;
                break;
            }
        }
    }

    // Check Knockouts if not in groups
    if (!match) {
        match = cup.knockoutMatches.find(m => m.id === matchId);
    }

    if (!match || match.isPlayed) return { updatedCup: cup, updatedHomeTeam: homeTeam, updatedAwayTeam: awayTeam };

    // Simulate Match
    const tempMatch: Match = {
        id: match.id,
        week: match.week || 99,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: 0,
        awayScore: 0,
        events: [],
        isPlayed: false,
        date: Date.now(),
        attendance: 0,
        currentMinute: 0,
        weather: 'Clear',
        timeOfDay: 'Evening',
        stats: undefined
    };

    const result = simulateFullMatch(tempMatch, homeTeam, awayTeam, homePlayers, awayPlayers);

    match.homeScore = result.homeScore;
    match.awayScore = result.awayScore;
    match.events = result.events;
    match.isPlayed = true;
    console.log('[DEBUG ENGINE] Match Simulated. Score:', match.homeScore, '-', match.awayScore);

    // Handle Group Stage Point Updates
    if (match.stage === 'GROUP' && group) {
        console.log('[DEBUG ENGINE] Updating Group Standings for Group:', group.name);

        // Update Standings helper
        const updateTeamStats = (teamId: string, scored: number, conceded: number) => {
            const stats = group!.standings.find(s => s.teamId === teamId);
            if (stats) {
                console.log('[DEBUG ENGINE] Updating stats for team:', teamId, 'Old Played:', stats.played);
                stats.played++;
                stats.gf += scored;
                stats.ga += conceded;
                if (scored > conceded) {
                    stats.won++;
                    stats.points += 3;
                    awardEuropeanBonus(getLeagueIdOfTeam(teamId, homeTeam, awayTeam), 'group_win');
                } else if (scored === conceded) {
                    stats.drawn++;
                    stats.points += 1;
                } else {
                    stats.lost++;
                }
                console.log('[DEBUG ENGINE] New Played:', stats.played, 'Points:', stats.points);
            } else {
                console.warn('[DEBUG ENGINE] Team stats NOT found in group standings for:', teamId);
            }
        };

        updateTeamStats(match.homeTeamId, match.homeScore, match.awayScore);
        updateTeamStats(match.awayTeamId, match.awayScore, match.homeScore);

        // Sort Standings (Points -> GD -> GF)
        group.standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = a.gf - a.ga;
            const gdB = b.gf - b.ga;
            if (gdA !== gdB) return gdB - gdA; // Descending GD
            return b.gf - a.gf;
        });
    }
    // Handle Knockout Extra Time / Pens (Simple implementation for now)
    if (match.stage !== 'GROUP' && match.stage) {
        let homeScore = match.homeScore;
        let awayScore = match.awayScore;

        // Extra Time if draw
        if (homeScore === awayScore) {
            // Simple random extra time goal logic (reduced probability)
            const homeStrength = homePlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(homePlayers.length, 1);
            const awayStrength = awayPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(awayPlayers.length, 1);
            const homeWinChance = (homeStrength + 3) / (homeStrength + 3 + awayStrength);

            if (Math.random() < 0.4) { // 40% chance of goal in ET
                if (Math.random() < homeWinChance) homeScore++; else awayScore++;
            }

            match.extraTime = { homeScore: homeScore - match.homeScore, awayScore: awayScore - match.awayScore };
            match.homeScore = homeScore;
            match.awayScore = awayScore;
        }

        // Penalties if still draw
        if (homeScore === awayScore) {
            // Simple penalty logic 
            const homePens = Math.floor(Math.random() * 5) + 3; // 3-7 score
            const awayPens = Math.floor(Math.random() * 5) + 3;
            // Force winner
            const finalHome = homePens === awayPens ? homePens + 1 : homePens;
            match.penalties = { homeScore: finalHome, awayScore: awayPens };
            match.winnerId = finalHome > awayPens ? match.homeTeamId : match.awayTeamId;
        } else {
            match.winnerId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
        }

        // Award coefficient bonus for advancing (simplified: win in knockout)
        if (match.winnerId) {
            const winner = match.winnerId === homeTeam.id ? homeTeam : awayTeam;
            awardEuropeanBonus(winner.leagueId, 'knockout');
        }
    }

    // Check for advancement
    const nextCup = advanceGlobalCupStage(cup);

    // === REPUTATION & BUDGET REWARDS ===
    const rewards = calculateCupRewards(cup, match.id, homeTeam, awayTeam, match.homeScore, match.awayScore, match.winnerId, prizeMultiplier);

    return { updatedCup: nextCup, updatedHomeTeam: rewards.updatedHomeTeam, updatedAwayTeam: rewards.updatedAwayTeam };
};

// Helper: Calculate Cup Rewards (Reputation & Budget)
// UPDATED: Now returns detailed breakdown for history logs
export const calculateCupRewards = (
    cup: GlobalCup,
    matchId: string,
    homeTeam: Team,
    awayTeam: Team,
    homeScore: number,
    awayScore: number,
    winnerId?: string,
    prizeMultiplier: number = 1.0
): {
    updatedHomeTeam: Team,
    updatedAwayTeam: Team,
    rewardDetails: {
        home: { repChange: number, budgetChange: number, description: string },
        away: { repChange: number, budgetChange: number, description: string }
    }
} => {
    // Locate match to determine stage
    let match: any;
    if (cup.groups) {
        for (const g of cup.groups) {
            match = g.matches.find(m => m.id === matchId);
            if (match) break;
        }
    }
    if (!match && cup.knockoutMatches) {
        match = cup.knockoutMatches.find(m => m.id === matchId);
    }

    const stage = match?.stage || 'GROUP'; // Default

    // 1. Determine Winner
    const homeWon = homeScore > awayScore;
    const awayWon = awayScore > homeScore;
    const isDraw = homeScore === awayScore;

    // 2. Clone teams to update
    const updatedHomeTeam = { ...homeTeam };
    const updatedAwayTeam = { ...awayTeam };

    // 3. Reputation Updates (Dynamic Formula x3 - User Request)
    // Max Loss: 45. Max Gain: ~60. Base Win: 30.
    const calculateDynamicChange = (myRep: number, oppRep: number, result: 'WIN' | 'LOSS' | 'DRAW'): number => {
        const diff = oppRep - myRep; // Positive if opponent is stronger

        if (result === 'WIN') {
            // Base 25 + (Diff / 100). 
            // If beating stronger (+1000 diff) -> 25 + 10 = 35.
            // If beating weaker (-1000 diff) -> 25 - 10 = 15.
            const change = 25 + (diff / 100);
            return Math.min(60, Math.max(10, Math.floor(change))) + (stage !== 'GROUP' ? 5 : 0); // Bonus for knockouts
        } else if (result === 'LOSS') {
            // Base -15.
            // If losing to stronger (+1000 diff) -> -15 + 10 = -5 (Less penalty).
            // If losing to weaker (-1000 diff) -> -15 - 10 = -25 (More penalty).
            const change = -20 + (diff / 100);
            // Cap loss at -45 (User Request)
            return Math.max(-45, Math.min(-5, Math.floor(change)));
        } else {
            // Draw
            // If stronger team draws -> Small penalty.
            // If weaker team draws -> Small gain.
            const change = (diff / 200); // +5 for drawing vs +1000 rep team
            return Math.min(15, Math.max(-10, Math.floor(change)));
        }
    };

    const homeRepChange = calculateDynamicChange(homeTeam.reputation, awayTeam.reputation, homeWon ? 'WIN' : (awayWon ? 'LOSS' : 'DRAW'));
    const awayRepChange = calculateDynamicChange(awayTeam.reputation, homeTeam.reputation, awayWon ? 'WIN' : (homeWon ? 'LOSS' : 'DRAW'));

    // Apply reputation update
    updatedHomeTeam.reputation = Math.min(10000, Math.max(1000, updatedHomeTeam.reputation + homeRepChange));
    updatedAwayTeam.reputation = Math.min(10000, Math.max(1000, updatedAwayTeam.reputation + awayRepChange));

    // 4. Financial Rewards
    const isFinal = stage === 'FINAL';
    const getCapacity = (team: Team) => 5000 + (team.facilities.stadiumLevel - 1) * 6000;

    // Ticket Price (Dynamic based on stage)
    let ticketPrice = 50;
    if (stage === 'ROUND_16') ticketPrice = 60;
    else if (stage === 'QUARTER') ticketPrice = 75;
    else if (stage === 'SEMI') ticketPrice = 100;
    else if (stage === 'FINAL') ticketPrice = 150;

    const homeCapacity = getCapacity(homeTeam);
    const attPct = Math.min(1.0, 0.7 + (homeTeam.reputation / 20000) + (awayTeam.reputation / 20000) + (stage === 'FINAL' ? 0.3 : 0));
    const attendanceCount = Math.floor(homeCapacity * attPct);
    const totalGateReceipts = Math.floor(attendanceCount * ticketPrice);

    // Prize Money (Accumulates)
    let homePrize = 0;
    let awayPrize = 0;

    if (stage === 'GROUP') {
        if (homeWon) homePrize += (2800000 * prizeMultiplier);
        else if (awayWon) awayPrize += (2800000 * prizeMultiplier);
        else { homePrize += (900000 * prizeMultiplier); awayPrize += (900000 * prizeMultiplier); }
    }

    // Knockout Prizes (Qualification Bonus - added to WINNER)
    if (stage !== 'GROUP' && winnerId) {
        let progressPrize = 0;
        if (stage === 'ROUND_16') progressPrize = 9600000 * prizeMultiplier;
        else if (stage === 'QUARTER') progressPrize = 10600000 * prizeMultiplier;
        else if (stage === 'SEMI') progressPrize = 12500000 * prizeMultiplier;
        else if (stage === 'FINAL') progressPrize = 20000000 * prizeMultiplier; // Winner Bonus

        if (winnerId === homeTeam.id) homePrize += progressPrize;
        else awayPrize += progressPrize;
    }

    // Apply Finances
    const gateMoneyHome = isFinal ? (totalGateReceipts / 2) : totalGateReceipts;
    const gateMoneyAway = isFinal ? (totalGateReceipts / 2) : 0;

    const homeDelta = gateMoneyHome + homePrize;
    const awayDelta = gateMoneyAway + awayPrize;

    const homeBudgetBeforeReward = updatedHomeTeam.budget;
    const awayBudgetBeforeReward = updatedAwayTeam.budget;

    updatedHomeTeam.budget += homeDelta;
    updatedAwayTeam.budget += awayDelta;

    // Kupa gelirlerini finansal kayda (aynı hafta/season) ekle; history'yi ASLA sıfırlama.
    const recordWeek = match?.week ?? 99;
    const recordSeason = (cup as any)?.season ?? -1;

    const upsertCupIncome = (team: Team, budgetBefore: number, budgetAfter: number, gate: number, prize: number) => {
        if (!team.financials) {
            team.financials = {
                lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 },
                lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 },
                history: []
            };
        }
        if (!team.financials.history) team.financials.history = [];

        const history = team.financials.history as any[];
        const idx = history.findIndex(r => r.week === recordWeek && r.season === recordSeason);

        const ensureRecord = (): any => ({
            week: recordWeek,
            season: recordSeason,
            income: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0, cupPrize: 0, total: 0 },
            expenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0, total: 0 },
            balance: 0,
            budgetBefore,
            budgetAfter
        });

        const rec = idx >= 0 ? history[idx] : ensureRecord();
        rec.income.tickets = (rec.income.tickets || 0) + gate;
        rec.income.cupPrize = (rec.income.cupPrize || 0) + prize;

        const incomeTotal = (rec.income.tickets || 0) + (rec.income.sponsor || 0) + (rec.income.merchandise || 0) + (rec.income.tvRights || 0) + (rec.income.transfers || 0) + (rec.income.winBonus || 0) + (rec.income.seasonEnd || 0) + (rec.income.cupPrize || 0);
        const expenseTotal = (rec.expenses.wages || 0) + (rec.expenses.maintenance || 0) + (rec.expenses.academy || 0) + (rec.expenses.transfers || 0) + (rec.expenses.facilityUpgrade || 0) + (rec.expenses.staffUpgrade || 0);
        rec.income.total = incomeTotal;
        rec.expenses.total = expenseTotal;
        rec.balance = incomeTotal - expenseTotal;
        rec.budgetBefore = Math.min(rec.budgetBefore ?? budgetBefore, budgetBefore);
        rec.budgetAfter = budgetAfter;

        if (idx < 0) history.push(rec);
        if (history.length > 10) team.financials.history = history.slice(-10);
    };

    upsertCupIncome(updatedHomeTeam, homeBudgetBeforeReward, updatedHomeTeam.budget, gateMoneyHome, homePrize);
    upsertCupIncome(updatedAwayTeam, awayBudgetBeforeReward, updatedAwayTeam.budget, gateMoneyAway, awayPrize);

    return {
        updatedHomeTeam,
        updatedAwayTeam,
        rewardDetails: {
            home: {
                repChange: homeRepChange,
                budgetChange: (gateMoneyHome + homePrize),
                description: `${stage === 'GROUP' ? 'Group Match' : stage} vs ${awayTeam.name}`
            },
            away: {
                repChange: awayRepChange,
                budgetChange: (gateMoneyAway + awayPrize),
                description: `${stage === 'GROUP' ? 'Group Match' : stage} vs ${homeTeam.name}`
            }
        }
    };
};

// Helper: Get League ID
const getLeagueIdOfTeam = (teamId: string, teamA: Team, teamB: Team): string => {
    if (teamA.id === teamId) return teamA.leagueId;
    return teamB.leagueId;
}

// Backwards compatible aliases
export const simulateEuropeanCupMatch = simulateGlobalCupMatch;
export const generateEuropeanCup = generateGlobalCup;


// Helper: Advance to next stage (Group -> Round 16 -> Quarter -> Semi -> Final)
export const advanceGlobalCupStage = (cup: GlobalCup): GlobalCup => {
    // Check if current stage is complete
    let stageMatches: GlobalCupMatch[] = [];
    if (cup.currentStage === 'GROUP') {
        // Check if all group matches are played
        const allGroupMatches = cup.groups.flatMap(g => g.matches);
        if (!allGroupMatches.every(m => m.isPlayed)) return cup;

        // Advance to Round of 16
        // Top 2 from each of 8 groups = 16 teams
        const qualifiedTeams: string[] = [];
        cup.groups.forEach(g => {
            // Already sorted by points in simulation
            qualifiedTeams.push(g.standings[0].teamId);
            qualifiedTeams.push(g.standings[1].teamId);
        });

        // Create Round 16 Matches
        // Pairing: Group Winner vs Runner-up from another group
        // Simplified: A1 vs B2, B1 vs A2, etc.
        const knockouts: GlobalCupMatch[] = [];

        // A1 vs B2, B1 vs A2
        knockouts.push(createKnockoutMatch(cup.groups[0].standings[0].teamId, cup.groups[1].standings[1].teamId, 'ROUND_16'));
        knockouts.push(createKnockoutMatch(cup.groups[1].standings[0].teamId, cup.groups[0].standings[1].teamId, 'ROUND_16'));

        // C1 vs D2, D1 vs C2
        knockouts.push(createKnockoutMatch(cup.groups[2].standings[0].teamId, cup.groups[3].standings[1].teamId, 'ROUND_16'));
        knockouts.push(createKnockoutMatch(cup.groups[3].standings[0].teamId, cup.groups[2].standings[1].teamId, 'ROUND_16'));

        // E1 vs F2, F1 vs E2
        knockouts.push(createKnockoutMatch(cup.groups[4].standings[0].teamId, cup.groups[5].standings[1].teamId, 'ROUND_16'));
        knockouts.push(createKnockoutMatch(cup.groups[5].standings[0].teamId, cup.groups[4].standings[1].teamId, 'ROUND_16'));

        // G1 vs H2, H1 vs G2
        knockouts.push(createKnockoutMatch(cup.groups[6].standings[0].teamId, cup.groups[7].standings[1].teamId, 'ROUND_16'));
        knockouts.push(createKnockoutMatch(cup.groups[7].standings[0].teamId, cup.groups[6].standings[1].teamId, 'ROUND_16'));

        return {
            ...cup,
            currentStage: 'ROUND_16',
            knockoutMatches: knockouts
        };

    } else {
        // Knockout Stages
        stageMatches = cup.knockoutMatches.filter(m => m.stage === cup.currentStage);
        if (!stageMatches.every(m => m.isPlayed)) return cup;

        const winners = stageMatches.map(m => m.winnerId!);
        const nextMatches: GlobalCupMatch[] = [];
        let nextStage: 'QUARTER' | 'SEMI' | 'FINAL' | 'COMPLETE' = 'COMPLETE';

        if (cup.currentStage === 'ROUND_16') {
            nextStage = 'QUARTER';
            for (let i = 0; i < winners.length; i += 2) {
                nextMatches.push(createKnockoutMatch(winners[i], winners[i + 1], 'QUARTER'));
            }
        } else if (cup.currentStage === 'QUARTER') {
            nextStage = 'SEMI';
            nextMatches.push(createKnockoutMatch(winners[0], winners[1], 'SEMI'));
            nextMatches.push(createKnockoutMatch(winners[2], winners[3], 'SEMI'));
        } else if (cup.currentStage === 'SEMI') {
            nextStage = 'FINAL';
            nextMatches.push(createKnockoutMatch(winners[0], winners[1], 'FINAL'));
        } else if (cup.currentStage === 'FINAL') {
            nextStage = 'COMPLETE';
            return { ...cup, currentStage: 'COMPLETE', winnerId: winners[0] };
        }

        return {
            ...cup,
            currentStage: nextStage,
            knockoutMatches: [...cup.knockoutMatches, ...nextMatches]
        };
    }
}

const createKnockoutMatch = (homeId: string, awayId: string, stage: 'ROUND_16' | 'QUARTER' | 'SEMI' | 'FINAL'): GlobalCupMatch => {
    // Schedule weeks
    const schedule: Record<string, number> = {
        'ROUND_16': 28,
        'QUARTER': 31,
        'SEMI': 34,
        'FINAL': 37
    };

    return {
        id: uuid(),
        stage,
        homeTeamId: homeId,
        awayTeamId: awayId,
        homeScore: 0,
        awayScore: 0,
        isPlayed: false,
        events: [],
        stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
        week: schedule[stage]
    };
};




export const simulateAIGlobalCupMatches = (
    cup: GlobalCup,
    teams: Team[],
    players: Player[],
    userTeamId: string,
    currentWeek: number,
    prizeMultiplier: number = 1.0 // DEFAULT: Full Champions League Money
): { updatedCup: GlobalCup, updatedTeams: Team[] } => {

    // Check if any matches need to be played this week
    let matchesToPlay: GlobalCupMatch[] = [];

    if (cup.currentStage === 'GROUP' && cup.groups) {
        cup.groups.forEach(g => {
            g.matches.forEach(m => {
                // Play if match is this week OR overdue (catch-up)
                // Assuming group matches are scheduled clearly
                if (m.week && m.week <= currentWeek && !m.isPlayed && m.homeTeamId !== userTeamId && m.awayTeamId !== userTeamId) {
                    matchesToPlay.push(m);
                }
            });
        });
    } else {
        const schedule: Record<string, number> = {
            'ROUND_16': 28,
            'QUARTER': 31,
            'SEMI': 34,
            'FINAL': 37
        };
        const scheduledWeek = schedule[cup.currentStage];
        if (scheduledWeek && currentWeek >= scheduledWeek) {
            matchesToPlay = cup.knockoutMatches.filter(m => !m.isPlayed && m.homeTeamId !== userTeamId && m.awayTeamId !== userTeamId);
        }
    }

    if (matchesToPlay.length === 0) return { updatedCup: cup, updatedTeams: teams };

    let updatedCup = { ...cup };
    let updatedTeams = [...teams];

    matchesToPlay.forEach(match => {
        const homeTeam = teams.find(t => t.id === match.homeTeamId);
        const awayTeam = teams.find(t => t.id === match.awayTeamId);
        if (!homeTeam || !awayTeam) return;

        const homePlayers = players.filter(p => p.teamId === match.homeTeamId);
        const awayPlayers = players.filter(p => p.teamId === match.awayTeamId);

        // Calculate Attendance for Cup Match (Use existing helper if available, or simplified logic)
        // High stakes matches have high attendance
        const attendancePct = Math.min(1.0, 0.7 + (homeTeam.reputation / 20000) + (awayTeam.reputation / 20000) + (Math.random() * 0.2));
        // Bonus for late stages
        const stageBonus = match.stage === 'SEMI' || match.stage === 'FINAL' ? 0.2 : match.stage === 'QUARTER' ? 0.1 : 0;
        const finalAttendancePct = Math.min(1.0, attendancePct + stageBonus);

        const tempMatch: Match = {
            id: match.id,
            week: match.week || 99,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeScore: 0,
            awayScore: 0,
            events: [],
            isPlayed: false,
            date: Date.now(),
            attendance: finalAttendancePct, // Pass attendance to simulation
            currentMinute: 0,
            weather: 'Clear',
            timeOfDay: 'Evening',
            stats: undefined
        };

        const result = simulateFullMatch(tempMatch, homeTeam, awayTeam, homePlayers, awayPlayers);

        // === KNOCKOUT MATCHES: Handle Extra Time & Penalties for AI vs AI matches ===
        let finalHomeScore = result.homeScore;
        let finalAwayScore = result.awayScore;
        let matchWinnerId: string | undefined;
        let extraTimeResult: { homeScore: number, awayScore: number } | undefined;
        let penaltyResult: { homeScore: number, awayScore: number } | undefined;

        // Only handle extra time/penalties for knockout stages
        if (match.stage !== 'GROUP') {
            if (finalHomeScore === finalAwayScore) {
                // Extra Time - 40% chance of goal in ET
                const homeStrength = homePlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(homePlayers.length, 1);
                const awayStrength = awayPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(awayPlayers.length, 1);
                const homeWinChance = (homeStrength + 3) / (homeStrength + 3 + awayStrength);

                if (Math.random() < 0.4) {
                    if (Math.random() < homeWinChance) finalHomeScore++; else finalAwayScore++;
                }
                extraTimeResult = { homeScore: finalHomeScore - result.homeScore, awayScore: finalAwayScore - result.awayScore };
            }

            // Penalties if still draw after ET
            if (finalHomeScore === finalAwayScore) {
                const homePens = Math.floor(Math.random() * 5) + 3; // 3-7
                const awayPens = Math.floor(Math.random() * 5) + 3;
                // Force a winner
                const finalHomePens = homePens === awayPens ? homePens + 1 : homePens;
                penaltyResult = { homeScore: finalHomePens, awayScore: awayPens };
                matchWinnerId = finalHomePens > awayPens ? match.homeTeamId : match.awayTeamId;
            } else {
                matchWinnerId = finalHomeScore > finalAwayScore ? match.homeTeamId : match.awayTeamId;
            }
        } else {
            // Group stage: no winner needed (draws are allowed)
            if (finalHomeScore > finalAwayScore) matchWinnerId = match.homeTeamId;
            else if (finalAwayScore > finalHomeScore) matchWinnerId = match.awayTeamId;
        }

        updatedCup = {
            ...updatedCup,
            groups: updatedCup.groups?.map(g => ({
                ...g,
                matches: g.matches.map(m => m.id === match.id ? { ...m, isPlayed: true, homeScore: result.homeScore, awayScore: result.awayScore, events: result.events } : m),
                standings: g.standings // Updated below
            })),
            knockoutMatches: updatedCup.knockoutMatches?.map(m => m.id === match.id ? {
                ...m,
                isPlayed: true,
                homeScore: finalHomeScore,
                awayScore: finalAwayScore,
                events: result.events,
                winnerId: matchWinnerId,
                extraTime: extraTimeResult,
                penalties: penaltyResult
            } : m) || []
        };
        // Re-sync match object with result for local logic
        match.homeScore = finalHomeScore;
        match.awayScore = finalAwayScore;
        match.isPlayed = true;
        match.winnerId = matchWinnerId;

        if (updatedCup.groups && match.stage === 'GROUP') {
            // Groups require manual standing update as simulateFullMatch doesn't touch cup state
            const group = updatedCup.groups.find(g => g.matches.some(m => m.id === match.id));
            if (group) {
                const updateTeamStats = (teamId: string, scored: number, conceded: number) => {
                    const stats = group.standings.find(s => s.teamId === teamId);
                    if (stats) {
                        stats.played++;
                        stats.gf += scored;
                        stats.ga += conceded;
                        if (scored > conceded) { stats.won++; stats.points += 3; }
                        else if (scored === conceded) { stats.drawn++; stats.points += 1; }
                        else { stats.lost++; }
                    }
                };
                updateTeamStats(match.homeTeamId, match.homeScore, match.awayScore);
                updateTeamStats(match.awayTeamId, match.awayScore, match.homeScore);

                // Sort
                group.standings.sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga));
            }
        }


        // === GLOBAL CUP REPUTATION UPDATE FOR AI TEAMS ===
        // Find the played match
        let playedMatch: GlobalCupMatch | undefined;
        if (updatedCup.groups) {
            for (const g of updatedCup.groups) {
                const m = g.matches.find(x => x.id === match.id);
                if (m) { playedMatch = m; break; }
            }
        }
        if (!playedMatch && updatedCup.knockoutMatches) {
            playedMatch = updatedCup.knockoutMatches.find(x => x.id === match.id);
        }

        if (playedMatch && playedMatch.isPlayed) {
            const homeWon = playedMatch.homeScore > playedMatch.awayScore;
            const awayWon = playedMatch.awayScore > playedMatch.homeScore;
            const isDraw = playedMatch.homeScore === playedMatch.awayScore;

            // Home team reputation change
            if (homeWon) {
                const repDiff = awayTeam.reputation - homeTeam.reputation;
                let repBonus = 20 + Math.max(0, Math.floor(repDiff / 200));
                repBonus = Math.min(40, repBonus);

                if (playedMatch.stage === 'QUARTER') repBonus += 10;
                else if (playedMatch.stage === 'SEMI') repBonus += 20;
                if (playedMatch.stage === 'QUARTER') repBonus += 10;
                else if (playedMatch.stage === 'SEMI') repBonus += 20;
                else if (playedMatch.stage === 'FINAL') repBonus += 50;

                updatedTeams = updatedTeams.map(t =>
                    t.id === homeTeam.id
                        ? { ...t, reputation: Math.min(10000, t.reputation + repBonus) }
                        : t
                );

                // === COEFFICIENT UPDATE ===
                awardEuropeanBonus(homeTeam.leagueId, playedMatch.stage === 'GROUP' ? 'group_win' : 'knockout');

            } else if (!isDraw) {
                // Home team lost
                const repPenalty = Math.min(15, Math.floor((homeTeam.reputation - awayTeam.reputation) / 300));
                updatedTeams = updatedTeams.map(t =>
                    t.id === homeTeam.id
                        ? { ...t, reputation: Math.max(1000, t.reputation - Math.max(5, repPenalty)) }
                        : t
                );
            } else {
                // Draw
                // awardEuropeanBonus(homeTeam.leagueId, 'draw'); // Not supported yet
            }

            // Away team reputation change
            if (awayWon) {
                const repDiff = homeTeam.reputation - awayTeam.reputation;
                let repBonus = 20 + Math.max(0, Math.floor(repDiff / 200));
                repBonus = Math.min(40, repBonus);

                if (playedMatch.stage === 'QUARTER') repBonus += 10;
                else if (playedMatch.stage === 'SEMI') repBonus += 20;
                else if (playedMatch.stage === 'FINAL') repBonus += 50;

                updatedTeams = updatedTeams.map(t =>
                    t.id === awayTeam.id
                        ? { ...t, reputation: Math.min(10000, t.reputation + repBonus) }
                        : t
                );

                // === COEFFICIENT UPDATE ===
                awardEuropeanBonus(awayTeam.leagueId, playedMatch.stage === 'GROUP' ? 'group_win' : 'knockout');

            } else if (!isDraw) {
                // Away team lost
                const repPenalty = Math.min(15, Math.floor((awayTeam.reputation - homeTeam.reputation) / 300));
                updatedTeams = updatedTeams.map(t =>
                    t.id === awayTeam.id
                        ? { ...t, reputation: Math.max(1000, t.reputation - Math.max(5, repPenalty)) }
                        : t
                );
            } else {
                // Draw (Already handled home draw, now away)
                // awardEuropeanBonus(awayTeam.leagueId, 'draw'); // Not supported
            }
        }


        // === FINANCIAL REWARDS (CASH PRIZE & TICKETS) ===
        // 1. Ticket Revenue
        // Champions League Ticket Price: ~€60 avg (Higher than league)
        // Final: Neutral venue (Shared 50/50)
        // Others: Home team takes 100%

        const isFinal = match.stage === 'FINAL';
        // Base Stadium Capacity (Level 1=5000, +6000 per level)
        const getCapacity = (team: Team) => 5000 + (team.facilities.stadiumLevel - 1) * 6000;

        // Ticket Price based on Stage
        let ticketPrice = 50; // Group
        if (match.stage === 'ROUND_16') ticketPrice = 60;
        else if (match.stage === 'QUARTER') ticketPrice = 75;
        else if (match.stage === 'SEMI') ticketPrice = 100;
        else if (match.stage === 'FINAL') ticketPrice = 150; // Expensive final tickets!

        const homeCapacity = getCapacity(homeTeam);
        // Using the calculated attendancePct from earlier (re-calculating simply here as local var is lost in loop scope unless passed)
        const attPct = Math.min(1.0, 0.7 + (homeTeam.reputation / 20000) + (awayTeam.reputation / 20000) + (match.stage === 'FINAL' ? 0.3 : 0));
        const attendanceCount = Math.floor(homeCapacity * attPct);

        const totalGateReceipts = Math.floor(attendanceCount * ticketPrice);

        // 2. Prize Money (Performance Based)
        // Group Win: 2.8M, Draw: 900k
        // Round Progression Bonuses calculated at END of stage usually, but we can give instant win rewards here

        let homePrize = 0;
        let awayPrize = 0;

        // Match Performance Prizes (Group Stage)
        if (match.stage === 'GROUP') {
            if (match.homeScore > match.awayScore) homePrize += (2800000 * prizeMultiplier); // Win
            else if (match.awayScore > match.homeScore) awayPrize += (2800000 * prizeMultiplier); // Win
            else {
                homePrize += (900000 * prizeMultiplier); // Draw
                awayPrize += (900000 * prizeMultiplier);
            }
        }

        // Progression Prizes (Knockout Wins/Advancement)
        // Awarded effectively on 'Winning' the knockout tie (simplified: winning the match for single-leg)
        if (match.stage !== 'GROUP' && match.winnerId) {
            // Prize for QUALIFYING to the NEXT round (awarded now)
            // R16 Winners -> Get QF Prize (10.6M)
            // QF Winners -> Get SF Prize (12.5M)
            // SF Winners -> Get Final Prize (15.5M)
            // Final Winner -> Get Cup Bonus (4.5M) + Champion Title

            let progressPrize = 0;
            if (match.stage === 'ROUND_16') progressPrize = 10600000 * prizeMultiplier;
            else if (match.stage === 'QUARTER') progressPrize = 12500000 * prizeMultiplier;
            else if (match.stage === 'SEMI') progressPrize = 15500000 * prizeMultiplier;
            else if (match.stage === 'FINAL') progressPrize = 4500000 * prizeMultiplier; // Winner Bonus

            if (match.winnerId === homeTeam.id) homePrize += progressPrize;
            else awayPrize += progressPrize;
        }

        // Apply Finances to Teams
        updatedTeams = updatedTeams.map(t => {
            if (t.id === homeTeam.id) {
                const gateMoney = isFinal ? (totalGateReceipts / 2) : totalGateReceipts;
                return { ...t, budget: t.budget + gateMoney + homePrize };
            }
            if (t.id === awayTeam.id) {
                const gateMoney = isFinal ? (totalGateReceipts / 2) : 0; // Away team gets nothing unless final
                return { ...t, budget: t.budget + gateMoney + awayPrize };
            }
            return t;
        });

        // NOTIFICATION FOR USER (If involved)
        if (homeTeam.id === userTeamId || awayTeam.id === userTeamId) {
            const userIsHome = homeTeam.id === userTeamId;
            const myPrize = userIsHome ? homePrize : awayPrize;
            const myGate = userIsHome ? (isFinal ? totalGateReceipts / 2 : totalGateReceipts) : (isFinal ? totalGateReceipts / 2 : 0);

            if (myPrize > 0 || myGate > 0) {
                // We rely on updatedTeams generic budget update, but maybe show a toast or log?
                // Existing finance report will catch 'lastWeekIncome' but this is direct budget injection
                // Ideally we update financials.lastWeekIncome too?
                // For now, let's trust the budget update.
            }
        }
    });

    // Check for advancement
    updatedCup = advanceGlobalCupStage(updatedCup);

    return { updatedCup, updatedTeams };
};

// Backwards compatibility
export const simulateAIEuropeanCupMatches = simulateAIGlobalCupMatches;




// ========== UEFA CUP / EUROPA LEAGUE (TIER 2) ==========
// 3rd and 4th place teams from each of 8 leagues (16 teams total)
// Europa League deprecated in favor of Global Cup expansion

// ========== SHARED MATCH RATING LOGIC ==========

export const calculateMatchRatings = (
    match: Match,
    homeTeam: Team,
    awayTeam: Team,
    homePlayers: Player[],
    awayPlayers: Player[]
): { updatedHomePlayers: Player[], updatedAwayPlayers: Player[] } => {

    // Helper to calculate rating for a single player
    const calculatePlayerRating = (p: Player, isHome: boolean, teamScore: number, oppScore: number, teamWon: boolean, teamLost: boolean, isDraw: boolean, cleanSheet: boolean, teamSaves: number) => {
        // Base rating
        let rating = 6.0 + (p.overall / 40) + (Math.random() * 1.5 - 0.5);

        // Result bonus/penalty
        if (teamWon) rating += 0.5;
        else if (isDraw) rating += 0.1;
        else rating -= 0.3;

        // Clean sheet bonus (GK/DEF)
        if (cleanSheet && (p.position === 'GK' || p.position === 'DEF')) {
            rating += 0.8;
        }

        // GK Saves bonus
        if (p.position === 'GK') {
            rating += (teamSaves * 0.2);
        }

        // Goals bonus
        const goals = match.events.filter((e: MatchEvent) => e.type === MatchEventType.GOAL && e.playerId === p.id).length;
        rating += (goals * 1.0);

        // Check for Substitutions - if played less than 15 mins, maybe impact is lower? 
        // For now, simple standard rating.

        // Clamp
        return Math.max(3.0, Math.min(10.0, rating));
    };

    const homeWon = match.homeScore > match.awayScore;
    const awayWon = match.awayScore > match.homeScore;
    const isDraw = match.homeScore === match.awayScore;
    const homeCleanSheet = match.awayScore === 0;
    const awayCleanSheet = match.homeScore === 0;

    // Identify players who were substituted OUT (they played but are now potentially BENCH)
    const substitutedOutIds = new Set<string>();
    match.events.forEach(e => {
        if (e.type === MatchEventType.SUB && e.playerOutId) {
            substitutedOutIds.add(e.playerOutId);
        }
    });

    const updatePlayerStats = (p: Player, isHome: boolean) => {
        // Only rate players who have a lineup status of STARTING or BENCH (if they played?)
        // The original code only rated STARTING players in some places, but updatedPlayers in simulation includes all.
        // We need to know who played.
        // If p.lineup is STARTING, they played.
        // If p.lineup is BENCH, did they sub in? 
        // We can check appearances increment logic or just check if they are in the match events as sub-in?
        // Or cleaner: The calling code (hook) usually updates appearances.
        // Let's assume passed players are the full squad.

        // Replicating original logic: Only Starters get detailed ratings? 
        // Original code in handleMatchSync line 1069: if (p.lineup === 'STARTING' || p.lineup === 'BENCH')
        // But then line 1076: if (p.lineup === 'STARTING') { ... calculation ... }
        // Rate players who:
        // 1. Are currently STARTING (played full match or subbed IN)
        // 2. Were subbed OUT (played part of the match)
        const played = p.lineup === 'STARTING' || substitutedOutIds.has(p.id);

        if (!played) return p;

        // Live stamina check is done in the hook via engine.getLivePlayerStamina. 
        // We don't have engine instance here easily unless passed. 
        // The hook does: updatedPlayers[idx] = { ...updatedPlayers[idx], condition: ... } BEFORE rating.
        // So we assume condition is already updated in the player object passed here?
        // No, the hook updates condition THEN calculates rating.
        // We will just do the stats update here. Condition update remains in hook or we pass it?
        // Let's stick to stats.

        const oldApps = p.stats.appearances || 0;
        const newApps = oldApps + 1;

        const rating = calculatePlayerRating(
            p,
            isHome,
            isHome ? match.homeScore : match.awayScore,
            isHome ? match.awayScore : match.homeScore,
            isHome ? homeWon : awayWon,
            isHome ? awayWon : homeWon,
            isDraw,
            isHome ? homeCleanSheet : awayCleanSheet,
            isHome ? (match.stats.homeSaves || 0) : (match.stats.awaySaves || 0)
        );

        const oldAvg = p.stats.averageRating || 6.0;
        const newAvg = ((oldAvg * oldApps) + rating) / newApps;

        // Form Update
        const formChange = rating > 7.0 ? 1 : rating < 5.5 ? -1 : 0;
        const newForm = Math.min(10, Math.max(1, p.form + formChange));

        return {
            ...p,
            stats: {
                ...p.stats,
                appearances: newApps,
                averageRating: parseFloat(newAvg.toFixed(2))
            },
            form: newForm
        };
    };

    return {
        updatedHomePlayers: homePlayers.map(p => updatePlayerStats(p, true)),
        updatedAwayPlayers: awayPlayers.map(p => updatePlayerStats(p, false))
    };
};

// === MATCH SITUATION ANALYSIS ===
export const analyzeMatchSituation = (
    matchStatus: { minute: number; score: { home: number; away: number }; isHome: boolean },
    currentTactic: TeamTactic
): AssistantAdvice[] => {
    const advice: AssistantAdvice[] = [];
    const { minute, score, isHome } = matchStatus;
    const myScore = isHome ? score.home : score.away;
    const oppScore = isHome ? score.away : score.home;
    const goalDiff = myScore - oppScore;

    // 1. Late Game - Losing
    if (minute > 70 && goalDiff < 0) {
        if (currentTactic.aggression !== 'Aggressive') {
            advice.push({ type: 'CRITICAL', message: 'Zaman daralıyor! Daha agresif oynamalıyız!' });
        }
        if (currentTactic.defensiveLine !== 'High') {
            advice.push({ type: 'WARNING', message: 'Savunma hattını ileri çıkarmalıyız.' });
        }
    }

    // 2. Late Game - Winning Narrowly
    if (minute > 75 && goalDiff === 1) {
        if (currentTactic.style !== 'ParkTheBus' && currentTactic.tempo !== 'Slow') {
            advice.push({ type: 'WARNING', message: 'Skoru korumaya odaklanmalıyız. Oyunu yavaşlatın.' });
        }
    }

    // 3. Winning Comfortably
    if (minute > 60 && goalDiff >= 3) {
        advice.push({ type: 'INFO', message: 'Maç bizim kontrolümüzde. Yorulan oyuncuları dinlendirmeyi düşün.' });
    }

    // 4. Early Goal Conceded
    if (minute < 20 && goalDiff < 0) {
        advice.push({ type: 'INFO', message: 'Henüz erken, paniğe gerek yok. Planımıza sadık kalalım.' });
    }

    return advice;
};

// === HELPER FOR USEMATCHSIMULATION ===
// Allows retrieving the FINAL state of players (stats, condition, cards) after a match
export const getFinalMatchStats = () => {
    if (!activeEngine) return null;
    return {
        homePlayers: activeEngine.homePlayers,
        awayPlayers: activeEngine.awayPlayers
    };
};


