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
  GlobalCupGroupTeam,
  ManagerArchetype,
  ManagerCourseKey,
  ManagerCreationData,
  ManagerObjective,
  ManagerStaffRoleKey,
  ManagerTalentKey,
  ManagerProfileData,
  AITacticMemory,
  AITacticMemoryEntry,
  AITacticMemorySnapshot,
} from "../types";
import { REAL_PLAYERS, NAMES_DB } from "../src/data/players";
import {
  MANAGER_ACHIEVEMENTS,
  ManagerAchievementId,
} from "../src/data/managerAchievements";
import { pruneMessages, prunePendingOffers } from "../src/utils/stateLimits";

const normalizeTacticForSync = (tactic: TeamTactic): TeamTactic => {
  const instructions = tactic.instructions?.filter(Boolean) || [];
  const customPositions = tactic.customPositions
    ? Object.entries(tactic.customPositions).reduce((acc, [playerId, pos]) => {
        if (!pos) return acc;
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return acc;
        acc[playerId] = { x: pos.x, y: pos.y };
        return acc;
      }, {} as Record<string, { x: number; y: number }>)
    : undefined;
  const slotInstructions = tactic.slotInstructions
    ? Object.entries(tactic.slotInstructions).reduce((acc, [slot, instruction]) => {
        if (!instruction) return acc;
        acc[slot as unknown as number] = instruction;
        return acc;
      }, {} as Record<number, string>)
    : undefined;

  return {
    ...tactic,
    instructions: instructions.length > 0 ? instructions : undefined,
    customPositions:
      customPositions && Object.keys(customPositions).length > 0
        ? customPositions
        : undefined,
    slotInstructions:
      slotInstructions && Object.keys(slotInstructions).length > 0
        ? slotInstructions
        : undefined,
  };
};

const areTacticsEquivalent = (left: TeamTactic, right: TeamTactic): boolean =>
  JSON.stringify(normalizeTacticForSync(left)) ===
  JSON.stringify(normalizeTacticForSync(right));

const createAITacticMemorySnapshot = (tactic: TeamTactic): AITacticMemorySnapshot => ({
  mentality: tactic.mentality,
  style: tactic.style,
  tempo: tactic.tempo,
  width: tactic.width,
  defensiveLine: tactic.defensiveLine,
  passingStyle: tactic.passingStyle,
  pressingIntensity: tactic.pressingIntensity,
  attackPlan: tactic.attackPlan || "AUTO",
  formation: tactic.formation,
  defenseApproach: (tactic as any).defenseApproach,
  attackApproach: (tactic as any).attackApproach,
  finalThird: (tactic as any).finalThird,
});

const createAITacticMemoryKey = (tactic: TeamTactic): string =>
  JSON.stringify(createAITacticMemorySnapshot(tactic));

const scoreAITacticMemoryEntry = (entry: AITacticMemoryEntry, currentWeek?: number, currentSeason?: number): number => {
  if (entry.played <= 0) return -999;
  const points = entry.wins * 3 + entry.draws;
  const avgPoints = points / entry.played;
  const goalDiff = (entry.goalsFor - entry.goalsAgainst) / entry.played;
  const offsideRate = entry.offsides / entry.played;
  const baseScore = avgPoints * 1.9 + goalDiff * 0.45 - offsideRate * 0.85 + entry.cumulativeScore / entry.played;
  // Zaman ağırlığı: son 5 hafta içindeyse +0.5 bonus, 15 haftadan eskiyse -0.4 ceza
  let recencyBonus = 0;
  if (currentWeek !== undefined && entry.lastUsedWeek !== undefined) {
    const weeksSince = currentWeek - entry.lastUsedWeek;
    if (weeksSince <= 5) recencyBonus = 0.5;
    else if (weeksSince <= 10) recencyBonus = 0.2;
    else if (weeksSince >= 15) recencyBonus = -0.4;
  }
  return baseScore + recencyBonus;
};

const applyAITacticMemoryPreference = (team: Team, tactic: TeamTactic): TeamTactic => {
  const memory = team.aiTacticMemory;
  if (!memory?.entries) return tactic;

  const currentWeek = memory.lastUpdatedWeek;
  const currentKey = createAITacticMemoryKey(tactic);
  const currentEntry = memory.entries[currentKey];
  const reliableEntries = Object.values(memory.entries).filter((entry) => entry.played >= 2);
  const bestEntry = reliableEntries.sort((left, right) => scoreAITacticMemoryEntry(right, currentWeek) - scoreAITacticMemoryEntry(left, currentWeek))[0];

  let nextTactic: TeamTactic = { ...tactic };
  const currentScore = currentEntry ? scoreAITacticMemoryEntry(currentEntry, currentWeek) : -999;
  const currentOffsideRate = currentEntry ? currentEntry.offsides / Math.max(1, currentEntry.played) : 0;

  if (bestEntry && bestEntry.key !== currentKey && scoreAITacticMemoryEntry(bestEntry, currentWeek) > currentScore + 0.6) {
    nextTactic = {
      ...nextTactic,
      mentality: bestEntry.tactic.mentality || nextTactic.mentality,
      style: bestEntry.tactic.style,
      tempo: bestEntry.tactic.tempo,
      width: bestEntry.tactic.width,
      defensiveLine: bestEntry.tactic.defensiveLine,
      passingStyle: bestEntry.tactic.passingStyle,
      pressingIntensity: bestEntry.tactic.pressingIntensity || nextTactic.pressingIntensity,
      attackPlan: bestEntry.tactic.attackPlan || nextTactic.attackPlan,
      ...(bestEntry.tactic.formation ? { formation: bestEntry.tactic.formation as any } : {}),
      ...(bestEntry.tactic.defenseApproach ? { defenseApproach: bestEntry.tactic.defenseApproach as any } : {}),
      ...(bestEntry.tactic.attackApproach ? { attackApproach: bestEntry.tactic.attackApproach as any } : {}),
      ...(bestEntry.tactic.finalThird ? { finalThird: bestEntry.tactic.finalThird as any } : {}),
    };
  }

  if (currentOffsideRate >= 1.5) {
    nextTactic = {
      ...nextTactic,
      passingStyle:
        nextTactic.passingStyle === "LongBall"
          ? "Direct"
          : nextTactic.passingStyle === "Direct"
            ? "Mixed"
            : nextTactic.passingStyle,
      tempo: nextTactic.tempo === "Fast" ? "Normal" : nextTactic.tempo,
      width: nextTactic.width === "Narrow" ? "Balanced" : nextTactic.width,
      attackPlan:
        nextTactic.attackPlan === "DIRECT_CHANNEL" || !nextTactic.attackPlan
          ? "THIRD_MAN"
          : nextTactic.attackPlan,
    };
  }

  return nextTactic;
};

export const recordAITacticMatchOutcome = (
  team: Team,
  opponent: Team,
  match: Match,
  isHome: boolean,
  currentWeek?: number,
  currentSeason?: number,
): Team => {
  const tactic = team.tactic;
  const key = createAITacticMemoryKey(tactic);
  const memory: AITacticMemory = {
    entries: { ...(team.aiTacticMemory?.entries || {}) },
    preferredKey: team.aiTacticMemory?.preferredKey,
    lastUpdatedWeek: currentWeek,
    lastUpdatedSeason: currentSeason,
  };

  const goalsFor = isHome ? match.homeScore : match.awayScore;
  const goalsAgainst = isHome ? match.awayScore : match.homeScore;
  const won = goalsFor > goalsAgainst;
  const drew = goalsFor === goalsAgainst;
  const offsides = (match.events || []).filter(
    (event) => event.type === MatchEventType.OFFSIDE && event.teamId === team.id,
  ).length;
  const opponentStrength = (opponent.reputation || 0) - (team.reputation || 0);
  const upsetBonus = won ? Math.max(0, opponentStrength / 1200) : 0;
  const performanceScore =
    (won ? 2.2 : drew ? 0.8 : -1.1) +
    (goalsFor - goalsAgainst) * 0.35 -
    Math.max(0, offsides - 1) * 0.55 +
    upsetBonus;

  const existingEntry = memory.entries[key];
  const updatedEntry: AITacticMemoryEntry = {
    key,
    tactic: createAITacticMemorySnapshot(tactic),
    played: (existingEntry?.played || 0) + 1,
    wins: (existingEntry?.wins || 0) + (won ? 1 : 0),
    draws: (existingEntry?.draws || 0) + (drew ? 1 : 0),
    losses: (existingEntry?.losses || 0) + (!won && !drew ? 1 : 0),
    goalsFor: (existingEntry?.goalsFor || 0) + goalsFor,
    goalsAgainst: (existingEntry?.goalsAgainst || 0) + goalsAgainst,
    offsides: (existingEntry?.offsides || 0) + offsides,
    cumulativeScore: (existingEntry?.cumulativeScore || 0) + performanceScore,
    // weightedScore: son maçlara daha fazla ağırlık verir (decay 0.85x per match)
    weightedScore: (existingEntry?.weightedScore || 0) * 0.85 + performanceScore,
    lastUsedWeek: currentWeek,
    lastUsedSeason: currentSeason,
  };

  memory.entries[key] = updatedEntry;

  const preferredEntry = Object.values(memory.entries)
    .filter((entry) => entry.played >= 2)
    .sort((left, right) => scoreAITacticMemoryEntry(right) - scoreAITacticMemoryEntry(left))[0];

  memory.preferredKey = preferredEntry?.key || updatedEntry.key;

  return {
    ...team,
    aiTacticMemory: memory,
  };
};
import {
  TICKET_PRICE,
  LEAGUE_TICKET_PRICES,
  LEAGUE_ATTENDANCE_RATES,
} from "../src/data/config";
import { LEAGUE_PRESETS, DERBY_RIVALS } from "../src/data/teams";
import { TEAM_TACTICAL_PROFILES } from "../src/data/tactics";
import {
  TICKS_PER_MINUTE,
  calculateEffectiveRating,
  calculateBaseOverall,
} from "./MatchEngine";
import engines from "./engines";

// Current engine choice (registry holds persisted value)
export const getEngineChoice = () => engines.getEngineChoice();
export const setEngineChoice = (k: "classic" | "ikinc" | "ucuncu") => {
  engines.setEngineChoice(k);
  // Reset active engine so next simulate/initialize will create with new engine
  activeEngine = null as any;
};
import { AIService } from "./AI";

// Helper for Empty Weeks & Season End Financial Protection
export function teamHasRemainingMatches(gameState: GameState, teamId: string): boolean {
  if (!gameState || !gameState.matches) return false;

  // 1. Check Domestic Matches (League & Cup) - look for unplayed match involving this team
  if (gameState.matches.some(m => !m.isPlayed && (m.homeTeamId === teamId || m.awayTeamId === teamId))) return true;

  // 2. Check European Matches
  if (gameState.europeanCup) {
    const eu = gameState.europeanCup as any;
    if (eu.groups?.some((g: any) => g.matches?.some((m: any) => !m.isPlayed && (m.homeTeamId === teamId || m.awayTeamId === teamId)))) return true;
    if (eu.knockoutMatches?.some((m: any) => !m.isPlayed && (m.homeTeamId === teamId || m.awayTeamId === teamId))) return true;
  }
  if (gameState.europaLeague) {
    const el = gameState.europaLeague as any;
    if (el.groups?.some((g: any) => g.matches?.some((m: any) => !m.isPlayed && (m.homeTeamId === teamId || m.awayTeamId === teamId)))) return true;
    if (el.knockoutMatches?.some((m: any) => !m.isPlayed && (m.homeTeamId === teamId || m.awayTeamId === teamId))) return true;
  }
  if ((gameState as any).conferenceLeague) {
    const eclf = (gameState as any).conferenceLeague as any;
    if (eclf.groups?.some((g: any) => g.matches?.some((m: any) => !m.isPlayed && (m.homeTeamId === teamId || m.awayTeamId === teamId)))) return true;
    if (eclf.knockoutMatches?.some((m: any) => !m.isPlayed && (m.homeTeamId === teamId || m.awayTeamId === teamId))) return true;
  }

  return false;
}

// Economic Power Scaling relative to Turkish Super Lig (Base 1.0)
// These are BASE values - can increase with European success!
// Economic Power Scaling relative to Turkish Super Lig (Base 1.0)
// These are BASE values - can increase with European success!
const BASE_LEAGUE_ECON_MULTIPLIERS: Record<string, number> = {
  tr: 1.0,
  en: 3.5, // Premier League
  es: 2.5, // La Liga
  de: 2.2, // Bundesliga
  it: 2.0, // Serie A
  fr: 1.6, // Ligue 1
  pt: 1.5, // Primeira Liga - Porto/Benfica prestige
  nl: 1.8, // Eredivisie - Ajax/PSV tradition
  be: 1.4, // Belgian Pro League
  ch: 1.4, // Swiss Super League
  gr: 1.1, // Greek Super League
  pl: 1.3, // Ekstraklasa (Poland)
  cz: 1.2, // Fortuna Liga (Czech)
  ro: 1.1, // Romania SuperLiga
  hr: 1.2, // Croatia HNL - Dinamo Zagreb strong
  rs: 1.1, // Serbia SuperLiga
  ru: 1.3, // Russian Premier - St. Petersburg/Moscow
  sco: 1.2, // Scotland - Glasgow derbi
  at: 1.2, // Austria Bundesliga
  ar: 1.2, // Argentine Primera
  br: 1.3, // Brazilian Série A
  us: 1.8, // MLS (High wealth)
  mx: 1.4, // Liga MX
  sa: 2.5, // Saudi Pro League (oil money)
  jp: 1.3, // J-League
  kr: 1.1, // K-League
  au: 1.1, // A-League
  ng: 0.8, // Nigeria NPFL
  id: 0.9, // Indonesia Liga 1
  eg: 0.9, // Egypt
  za: 0.8, // South Africa
  ma: 0.8, // Morocco
  tn: 0.7, // Tunisia
  co: 0.9, // Colombia
  cl: 0.8, // Chile
  uy: 0.8, // Uruguay
  cr: 0.6, // Costa Rica
  car: 0.5, // Caribbean
  in: 0.6, // India
  py: 0.7, // Paraguay
  ec: 0.8, // Ecuador
  cn: 1.4, // Chinese Super League
  ke: 0.6, // Kenya Premier League
  sn: 0.6, // Senegal Premier League
  dz: 0.7, // Ligue 1 Algeria
  gh: 0.7, // Ghana Premier League
  ci: 0.7, // Ivory Coast Premier
  my: 0.7, // Malaysia Liga Super
  default: 1.0,
};

// 5-Year League Coefficient History (Realistic Data 2024/25 Basis)
// Score represents the TOTAL Contribution (Sum) for game balance
// Format: [Y-4, Y-3, Y-2, Y-1, Current]
export let LEAGUE_COEFFICIENTS: Record<string, number[]> = {
  // ========== TIER 1: ELITE LEAGUES (5-Year avg: 55-75 pts/year) ==========
  en: [68, 72, 65, 71, 64], // 340.0 - England (4 CL + 4 EL teams, dominant)
  es: [62, 58, 55, 60, 52], // 287.0 - Spain (3 CL spots, Real/Barca/Atleti)
  it: [55, 60, 58, 54, 48], // 275.0 - Italy (4 CL, strong resurgence)
  de: [52, 56, 50, 54, 48], // 260.0 - Germany (4 CL, Bayern dominance)
  fr: [45, 48, 42, 46, 40], // 221.0 - France (3 CL, PSG carrying)

  // ========== TIER 2: STRONG LEAGUES (5-Year avg: 30-50 pts/year) ==========
  pt: [38, 42, 35, 40, 32], // 187.0 - Portugal (2 CL, Benfica/Porto)
  nl: [35, 38, 32, 36, 30], // 171.0 - Netherlands (1-2 CL, Ajax)
  br: [42, 45, 40, 43, 38], // 208.0 - Brazil (continental dominance)
  ar: [35, 38, 32, 36, 30], // 171.0 - Argentina (Libertadores regulars)
  ru: [28, 32, 25, 30, 22], // 137.0 - Russia (Zenit, sanctions effect)
  be: [25, 28, 22, 26, 20], // 121.0 - Belgium (Club Brugge, Anderlecht)
  sco: [22, 26, 20, 24, 18], // 110.0 - Scotland (Celtic/Rangers)
  at: [20, 24, 18, 22, 16], // 100.0 - Austria (Salzburg strong)
  tr: [28, 32, 26, 30, 24], // 140.0 - Turkey (Galatasaray, Fenerbahçe)
  gr: [18, 22, 16, 20, 14], // 90.0 - Greece (Olympiacos)
  ch: [18, 22, 16, 20, 14], // 90.0 - Switzerland (YB, Basel)
  hr: [15, 18, 12, 16, 10], // 71.0 - Croatia (Dinamo Zagreb)
  cz: [14, 17, 12, 15, 10], // 68.0 - Czech (Sparta/Slavia)
  pl: [12, 15, 10, 13, 8], // 58.0 - Poland (Legia)
  ro: [10, 13, 8, 11, 6], // 48.0 - Romania (FCSB/CFR)
  rs: [12, 15, 10, 13, 8], // 58.0 - Serbia (Red Star)

  // ========== TIER 3: REGIONAL POWERS (5-Year avg: 15-30 pts/year) ==========
  mx: [22, 25, 20, 23, 18], // 108.0 - Mexico (CONCACAF CL)
  us: [18, 22, 16, 20, 14], // 90.0 - USA (MLS growing)
  cn: [15, 18, 12, 16, 10], // 71.0 - China (ACL occasional)
  jp: [18, 22, 16, 20, 14], // 90.0 - Japan (ACL strong)
  kr: [16, 20, 14, 18, 12], // 80.0 - Korea (ACL presence)
  sa: [20, 24, 18, 22, 16], // 100.0 - Saudi (new investment + ACL)
  au: [12, 15, 10, 13, 8], // 58.0 - Australia (ACL spots)
  eg: [18, 22, 16, 20, 14], // 90.0 - Egypt (CAF CL - Al Ahly)
  ma: [14, 17, 12, 15, 10], // 68.0 - Morocco (CAF presence)
  za: [12, 15, 10, 13, 8], // 58.0 - South Africa (CAF CL)
  ng: [10, 13, 8, 11, 6], // 48.0 - Nigeria (local focus)
  dz: [12, 15, 10, 13, 8], // 58.0 - Algeria (CAF)
  tn: [14, 17, 12, 15, 10], // 68.0 - Tunisia (Esperance)

  // ========== TIER 4: DEVELOPING LEAGUES (5-Year avg: 8-18 pts/year) ==========
  co: [14, 17, 12, 15, 10], // 68.0 - Colombia (Libertadores)
  cl: [12, 15, 10, 13, 8], // 58.0 - Chile (U. Catolica, Colo-Colo)
  uy: [10, 13, 8, 11, 6], // 48.0 - Uruguay (Nacional, Peñarol)
  ec: [10, 13, 8, 11, 6], // 48.0 - Ecuador (LDU Quito)
  py: [8, 11, 6, 9, 5], // 39.0 - Paraguay (Olimpia)
  cr: [8, 11, 6, 9, 5], // 39.0 - Costa Rica (Saprissa)
  car: [6, 9, 5, 7, 4], // 31.0 - Caribbean (CONCACAF)
  in: [6, 9, 5, 7, 4], // 31.0 - India (ISL growing)
  id: [8, 11, 6, 9, 5], // 39.0 - Indonesia (local passion)
  my: [6, 9, 5, 7, 4], // 31.0 - Malaysia
  gh: [8, 11, 6, 9, 5], // 39.0 - Ghana (CAF)
  sn: [8, 11, 6, 9, 5], // 39.0 - Senegal (CAF)
  ci: [8, 11, 6, 9, 5], // 39.0 - Ivory Coast (CAF)
  ke: [6, 9, 5, 7, 4], // 31.0 - Kenya

  default: [8, 10, 6, 9, 5], // 38.0 - New leagues baseline
};

// Dynamic league multiplier storage (increases with European success)
// Format: { leagueId: bonusMultiplier } - starts at 0, can grow up to +1.0
export let LEAGUE_EUROPEAN_BONUS: Record<string, number> = {
  tr: 0,
  en: 0,
  es: 0,
  de: 0,
  it: 0,
  fr: 0,
  ar: 0,
  br: 0,
  us: 0,
  mx: 0,
  sa: 0,
  eg: 0,
  jp: 0,
  kr: 0,
  au: 0,
  za: 0,
  ma: 0,
  car: 0,
  co: 0,
  cl: 0,
  uy: 0,
  tn: 0,
  cr: 0,
  in: 0,
  ng: 0,
  id: 0,
  pt: 0,
  nl: 0,
  be: 0,
  ch: 0,
  gr: 0,
  pl: 0,
  cz: 0,
  ro: 0,
  hr: 0,
  rs: 0,
  ru: 0,
  sco: 0,
  at: 0,
  py: 0,
  ec: 0,
  dz: 0,
  gh: 0,
  ci: 0,
  ke: 0,
  sn: 0,
  my: 0,
  cn: 0,
};

// Get current league multiplier (base + European bonus)
// Get current league multiplier (base + European bonus)
export const getLeagueMultiplier = (leagueId: string): number => {
  const base =
    BASE_LEAGUE_ECON_MULTIPLIERS[leagueId] ||
    BASE_LEAGUE_ECON_MULTIPLIERS["default"];
  // Use ?? (not ||) so negative bonuses work when a league's rank drops
  const bonus = LEAGUE_EUROPEAN_BONUS[leagueId] ?? 0;
  return Math.max(0.3, base + bonus); // floor at 0.3x (survival minimum)
};

// Award European success bonus to league
export const awardEuropeanBonus = (
  leagueId: string,
  achievement: "group_win" | "knockout" | "semifinal" | "final" | "winner",
) => {
  const bonusAmounts: Record<string, number> = {
    group_win: 0.02, // +0.02 for group stage win
    knockout: 0.05, // +0.05 for reaching knockouts
    semifinal: 0.1, // +0.10 for reaching semifinals
    final: 0.15, // +0.15 for reaching final
    winner: 0.25, // +0.25 for winning!
  };
  const bonus = bonusAmounts[achievement] || 0;
  LEAGUE_EUROPEAN_BONUS[leagueId] = Math.min(
    1.0,
    (LEAGUE_EUROPEAN_BONUS[leagueId] || 0) + bonus,
  );
};

// Get league bonus for display
export const getLeagueBonus = (leagueId: string): number =>
  LEAGUE_EUROPEAN_BONUS[leagueId] || 0;

// Calculate coefficient-based multiplier for TV rights and ticket prices
// This allows leagues that improve in European competitions to earn more income
// Base reference: England (~340 points) = 1.0 multiplier, others scale proportionally
const BASE_COEFFICIENT_VALUES: Record<string, number> = {
  // TIER 1: Elite (based on new LEAGUE_COEFFICIENTS totals)
  en: 340,
  es: 287,
  it: 275,
  de: 260,
  fr: 221,
  // TIER 2: Strong
  pt: 187,
  nl: 171,
  br: 208,
  ar: 171,
  ru: 137,
  be: 121,
  sco: 110,
  at: 100,
  tr: 140,
  gr: 90,
  ch: 90,
  hr: 71,
  cz: 68,
  pl: 58,
  ro: 48,
  rs: 58,
  // TIER 3: Regional Powers
  mx: 108,
  us: 90,
  cn: 71,
  jp: 90,
  kr: 80,
  sa: 100,
  au: 58,
  eg: 90,
  ma: 68,
  za: 58,
  ng: 48,
  dz: 58,
  tn: 68,
  // TIER 4: Developing
  co: 68,
  cl: 58,
  uy: 48,
  ec: 48,
  py: 39,
  cr: 39,
  car: 31,
  in: 31,
  id: 39,
  my: 31,
  gh: 39,
  sn: 39,
  ci: 39,
  ke: 31,
  default: 38,
};

export const getCoefficientMultiplier = (leagueId: string): number => {
  const history =
    LEAGUE_COEFFICIENTS[leagueId] || LEAGUE_COEFFICIENTS["default"];
  const currentTotal = history.reduce((a, b) => a + b, 0);
  const baseValue =
    BASE_COEFFICIENT_VALUES[leagueId] || BASE_COEFFICIENT_VALUES["default"];

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
  en: 92, // Premier League
  es: 88, // La Liga
  it: 85, // Serie A
  de: 84, // Bundesliga
  fr: 78, // Ligue 1
  pt: 72, // Primeira Liga - Porto/Benfica prestige
  nl: 80, // Eredivisie - Ajax tradition
  be: 65, // Belgian Pro League
  at: 62, // Austria Bundesliga
  tr: 62, // Süper Lig
  ru: 65, // Russian Premier (despite sanctions)
  pl: 58, // Ekstraklasa (Poland)
  gr: 60, // Greek Super League
  ch: 68, // Swiss Super League
  cz: 55, // Fortuna Liga (Czech)
  ro: 52, // Romania SuperLiga
  hr: 58, // Croatia HNL - Dinamo Zagreb strong
  rs: 52, // Serbia SuperLiga
  sco: 70, // Scotland - Celtic/Rangers prestige
  br: 58, // Série A (Brasil)
  ar: 68, // Argentine Primera (historically strong)
  mx: 55, // Liga MX
  sa: 50, // Saudi Pro League
  us: 52, // MLS
  jp: 62, // J-League
  kr: 58, // K-League
  au: 55, // A-League
  ma: 46, // Botola Pro
  eg: 48, // Egyptian Premier League
  za: 52, // South Africa PSL
  co: 48, // Colombia
  cl: 45, // Chile
  uy: 47, // Uruguay
  py: 38, // Paraguay
  ec: 40, // Ecuador Liga Pro
  cr: 38, // Costa Rica
  tn: 44, // Tunisia
  dz: 45, // Ligue 1 Algeria
  ci: 42, // Ivory Coast Premier
  gh: 45, // Ghana Premier League
  ke: 38, // Kenya Premier League
  sn: 40, // Senegal Premier League
  my: 42, // Malaysia Liga Super
  in: 35, // ISL
  car: 35, // Caribbean Super League
  cn: 50, // Chinese Super League
  default: 40,
};

// Dynamic league reputation bonus (increases with European success)
export let LEAGUE_REPUTATION_BONUS: Record<string, number> = {
  tr: 0,
  en: 0,
  es: 0,
  de: 0,
  it: 0,
  fr: 0,
  ar: 0,
  br: 0,
  us: 0,
  mx: 0,
  sa: 0,
  eg: 0,
  jp: 0,
  kr: 0,
  au: 0,
  za: 0,
  ma: 0,
  car: 0,
  co: 0,
  cl: 0,
  uy: 0,
  tn: 0,
  cr: 0,
  in: 0,
  pt: 0,
  nl: 0,
  be: 0,
  ch: 0,
  gr: 0,
  pl: 0,
  cz: 0,
  ro: 0,
  hr: 0,
  rs: 0,
  ru: 0,
  sco: 0,
  at: 0,
  py: 0,
  ec: 0,
  dz: 0,
  gh: 0,
  ci: 0,
  ke: 0,
  sn: 0,
  my: 0,
  cn: 0,
};

// Initialize engine with saved state
export const initializeEngine = (savedState: Partial<GameState>) => {
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
    leagueCoefficients: { ...LEAGUE_COEFFICIENTS },
  };
};

// Get current league reputation (Sum of 5-year coefficients)
export const getLeagueReputation = (leagueId: string): number => {
  // New Calculation: Sum of last 5 years
  const coefficients =
    LEAGUE_COEFFICIENTS[leagueId] || LEAGUE_COEFFICIENTS["default"];
  return coefficients.reduce((sum, val) => sum + val, 0);
};

// Get detailed coefficients for UI
export const getLeagueCoefficients = (leagueId: string): number[] => {
  return LEAGUE_COEFFICIENTS[leagueId] || LEAGUE_COEFFICIENTS["default"];
};

// 3-LAYER REPUTATION FORMULA
// Calculates club reputation based on:
// 1. League Tier (30%)
// 2. Domestic Dominance (20%) - approx positions
// 3. European Success (50%) - approx achievements
export const calculateClubReputation = (
  team: Team,
  leagueRep: number,
  domesticScore: number,
  europeScore: number,
): number => {
  // domesticScore: 0.1 (Relegation) to 1.0 (Champion)
  // europeScore: 0.0 (None) to 1.0 (CL Winner)

  const weightL = 0.3; // League Prestige
  const weightD = 0.2; // Domestic Dominance
  const weightE = 0.5; // European Success (The multiplier!)

  const finalRep =
    leagueRep * weightL +
    domesticScore * 100 * weightD +
    europeScore * 100 * weightE;
  return Math.floor(finalRep);
};

// Update league base reputation based on seasonal performance (Bell Curve)

// Award league reputation for European achievements
export const awardLeagueReputationBonus = (
  leagueId: string,
  achievement:
    | "group_stage"
    | "round_of_16"
    | "quarter_final"
    | "semi_final"
    | "final"
    | "winner",
  isCL: boolean = true,
) => {
  // CL achievements give more reputation than EL
  const clMultiplier = isCL ? 1.0 : 0.5;

  // UNDERDOG BOOSTER: Weak leagues get 1.5x reputation for same achievement
  const baseRep = BASE_LEAGUE_REPUTATION[leagueId] || 50;
  const underdogMultiplier = baseRep < 70 ? 1.5 : 1.0;

  // REBALANCED: Increased coefficients for meaningful progression
  const bonusAmounts: Record<string, number> = {
    group_stage: 2, // +2 for making group stage (was +1)
    round_of_16: 4, // +4 for round of 16 (was +2)
    quarter_final: 6, // +6 for quarter finals (was +3)
    semi_final: 10, // +10 for semi finals (was +5)
    final: 15, // +15 for reaching final (was +8)
    winner: 25, // +25 for winning! (was +15)
  };

  const bonus =
    (bonusAmounts[achievement] || 0) * clMultiplier * underdogMultiplier;
  // REBALANCED: Cap maintained at 100 - limit handled by decay
  LEAGUE_REPUTATION_BONUS[leagueId] = Math.min(
    100,
    (LEAGUE_REPUTATION_BONUS[leagueId] || 0) + bonus,
  );

  // NEW SYSTEM: Update the "current year" coefficient (stored in valid index or accumulation logic)
  // For now, we instantly boost the newest year's coefficient
  const coeffs = LEAGUE_COEFFICIENTS[leagueId] || [
    ...LEAGUE_COEFFICIENTS["default"],
  ];
  // Add bonus converted to coefficient points (e.g., divided by number of teams factor ~5)
  // Rough conversion: 1 Reputation Point ~ 0.2 Coefficient Points
  const coeffBonus = bonus * 0.2;
  coeffs[4] = Math.min(30, coeffs[4] + coeffBonus); // Cap single year at 30.0
  LEAGUE_COEFFICIENTS[leagueId] = coeffs;
};

// Calculate player's willingness to transfer to a team
// Returns 0-100 (higher = more willing)
// REBALANCED: Added wage factor, reduced league impact, softened quality penalties
export const calculateTransferWillingness = (
  player: {
    overall: number;
    age: number;
    potential: number;
    morale?: number;
    wage?: number;
  },
  fromTeamRep: number,
  toTeamRep: number,
  fromLeagueId: string,
  toLeagueId: string,
  offeredWage?: number, // NEW: Optional wage offer parameter
  managerProfile?: ManagerProfileData,
): number => {
  let willingness = 50; // Base 50%
  const managerEffects = getManagerGameplayEffects(managerProfile);

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
  // Base rep difference effect
  const repDiff = (toTeamRep - fromTeamRep) / 75; // Each 75 rep = +1%
  willingness += repDiff;

  // 4. MoneyFit (Wage Multiplier Effect) - "Cash is King" implementation
  if (offeredWage && player.wage) {
    // Base wage assumed to be current wage or market value derived
    const currentWage = player.wage || 1000;
    const wageMultiplier = offeredWage / currentWage;

    // Unified Wage Impact (Exact User Request)
    if (wageMultiplier >= 2.0) {
      // If going to a significantly worse team, money is less convincing
      if (repDiff < -15) {
        willingness += 25; // Less effective if prestige drop is huge
      } else {
        willingness += 50; // MAX EFFECT (+50 Pts)
      }
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
      willingness -= leagueDiff * 0.24 * ignoreFactor;
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

  // 8. HARD REPUTATION CHECK (Prevent exploiting money for top players)
  // If player is good (> 82 OVR) and not old (< 32), they won't join a tiny club just for cash
  if (player.overall >= 82 && player.age < 32) {
    if (toTeamRep < 6500) {
      willingness -= 80; // Huge penalty for going to a very small club
    } else if (toTeamRep < 7000 && player.overall >= 85) {
      willingness -= 70; // Star players refuse to go to average clubs
    } else if (toTeamRep < 7500 && player.overall >= 88) {
      willingness -= 60; // Superstars refuse to go to good but not elite clubs
    }
  }

  willingness += managerEffects.transferWillingnessBonus;

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
  } = {},
): number => {
  const {
    isDerby = false,
    isEuropeanMatch = false,
    isChampionsLeague = false,
    isChampionshipDecider = false,
  } = options;

  // STADIUM CAPACITY
  const stadiumCapacity =
    homeTeam.facilities?.stadiumCapacity ||
    7500 + (homeTeam.facilities?.stadiumLevel - 1 || 0) * 12500;

  // ========== SELL-OUT CONDITIONS ==========
  // These special matches ALWAYS fill the stadium to 100%!

  // 1. Country's TOP teams visiting (rep 8000+) = SOLD OUT
  // Example: Beşiktaş, Fenerbahçe, Galatasaray visiting Göztepe
  const isTopTeamVisiting = awayTeam.reputation >= 8000;

  // 2. Elite Cup = SOLD OUT (Global elite match!)
  // 3. Derby = SOLD OUT (Derbi her zaman dolu!)
  // 4. Both teams are big clubs playing each other = SOLD OUT (Biletler karaborsaya düşer!)
  const isBigClashMatch =
    homeTeam.reputation >= 7500 && awayTeam.reputation >= 7500;

  if (isDerby || isChampionsLeague || isTopTeamVisiting || isBigClashMatch) {
    // SOLD OUT! Full stadium with tiny variance (98-100%)
    const soldOutVariance = 0.98 + Math.random() * 0.02;
    return Math.floor(stadiumCapacity * soldOutVariance);
  }

  // ========== NORMAL ATTENDANCE CALCULATION ==========

  // 1. Base fan base from reputation (rep 5000 = 25K fans, rep 10000 = 70K fans)
  const repFactor = Math.max(0, homeTeam.reputation - 5000) / 5000;
  const baseFanBase = 15000 + repFactor * repFactor * 60000;

  // 2. League fan multiplier
  const leagueFanMultiplier: Record<string, number> = {
    tr: 0.75,
    en: 1.15,
    es: 0.9,
    it: 0.85,
    de: 1.1,
    fr: 0.8,
    default: 0.8,
  };
  const leagueMult =
    leagueFanMultiplier[homeTeam.leagueId] || leagueFanMultiplier["default"];

  // 3. Form bonus (good form = more fans)
  const recentWins = homeTeam.recentForm?.filter((r) => r === "W").length || 0;
  const formBonus = 1 + recentWins * 0.04;

  // 4. Opponent attraction (medium-big teams draw more fans)
  const opponentBonus =
    awayTeam.reputation > 7000 ? 1.3 : awayTeam.reputation > 6000 ? 1.15 : 1.0;

  // 5. Challenge Cup bonus (not as big as Elite Cup but still special)
  const europaBonus = isEuropeanMatch ? 1.4 : 1.0;

  // 6. Championship race bonus
  const championshipBonus = isChampionshipDecider ? 1.25 : 1.0;

  // Calculate potential attendance
  const potentialAttendance = Math.floor(
    baseFanBase *
    leagueMult *
    formBonus *
    opponentBonus *
    europaBonus *
    championshipBonus,
  );

  // Final attendance (capped by stadium capacity)
  const actualAttendance = Math.min(potentialAttendance, stadiumCapacity);

  // Add small random variance (±3%)
  const variance = 1 + (Math.random() * 0.06 - 0.03);

  return Math.floor(actualAttendance * variance);
};

const uuid = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const USER_MANAGER_STARTING_REPUTATION = 28;
export const MAX_PLAYER_OVERALL = 96;
export const MAX_PLAYER_POTENTIAL = 94;

export const getInitialUserManagerRating = (): number => USER_MANAGER_STARTING_REPUTATION;

export const getInitialManagerRatingForTeamReputation = (teamRep: number): number => {
  if (teamRep >= 9000) return 75;
  if (teamRep >= 8000) return 65;
  if (teamRep >= 7000) return 55;
  if (teamRep >= 5500) return 45;
  return 35;
};

export const getInitialManagerSalaryForTeamReputation = (teamRep: number): number =>
  Math.floor(teamRep * 11);

const getManagerMarketSalaryForTeam = (
  teamReputation: number,
  managerRating: number,
): number => {
  const clubBase = getInitialManagerSalaryForTeamReputation(teamReputation);
  const managerPremium = Math.max(0, managerRating - 35) * 850;
  return Math.floor(clubBase + managerPremium);
};

const getLeagueCountryName = (leagueId?: string): string => {
  const preset = LEAGUE_PRESETS.find((league) => league.id === leagueId);
  return preset?.country || LEAGUE_TO_COUNTRY[leagueId || ""] || "England";
};

const getManagerBonuses = (
  nationality: string,
  team?: Team,
) => {
  const isHomeNationFit = nationality === getLeagueCountryName(team?.leagueId);
  return {
    homeNationConfidenceBonus: isHomeNationFit ? 5 : 0,
    transferNegotiationBonus: isHomeNationFit ? 0.05 : 0,
    scoutingKnowledgeBonus: isHomeNationFit ? 0.1 : 0,
  };
};

const createEmptyManagerTalents = () => ({
  leadership: 0,
  negotiation: 0,
  development: 0,
  scouting: 0,
});

const createEmptyManagerPersonalStaff = () => ({
  scoutAdvisor: 0,
  developmentCoach: 0,
  contractLawyer: 0,
});

export const getManagerPersonalStaffWeeklyCost = (managerProfile?: ManagerProfileData): number => {
  const personalStaff = {
    ...createEmptyManagerPersonalStaff(),
    ...(managerProfile?.personalStaff || {}),
  };

  return (
    personalStaff.scoutAdvisor * 8000 +
    personalStaff.developmentCoach * 12000 +
    personalStaff.contractLawyer * 16000
  );
};

const sortTeamsByStandings = (teams: Team[]) =>
  [...teams].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    const goalDiffA = a.stats.gf - a.stats.ga;
    const goalDiffB = b.stats.gf - b.stats.ga;
    if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
    return b.stats.gf - a.stats.gf;
  });

const createManagerObjectivesForTeam = (
  team: Team,
  season: number,
  leagueSize: number = 18,
): ManagerObjective[] => {
  const leagueTarget =
    team.reputation >= 9000 ? 3 :
    team.reputation >= 8000 ? 4 :
    team.reputation >= 7000 ? 6 :
    team.reputation >= 6000 ? Math.ceil(leagueSize / 2) :
    Math.max(leagueSize - 3, 12);
  const leagueTitle =
    leagueTarget <= 4 ? 'Secure continental qualification' :
    leagueTarget <= Math.ceil(leagueSize / 2) ? 'Finish in the top half' :
    'Avoid the relegation battle';
  const confidenceTarget =
    team.reputation >= 8500 ? 74 :
    team.reputation >= 7000 ? 68 : 62;
  const budgetTarget = Math.max(0, Math.round((team.budget || 0) * (team.reputation >= 7500 ? 0.04 : 0.02)));

  return [
    {
      id: uuid(),
      season,
      type: 'LEAGUE_POSITION',
      title: leagueTitle,
      description: `Finish the league in position ${leagueTarget} or better.`,
      targetValue: leagueTarget,
      currentValue: leagueSize,
      rewardBalance: team.reputation >= 8000 ? 300000 : 180000,
      rewardXp: team.reputation >= 8000 ? 220 : 140,
      rewardReputation: team.reputation >= 8000 ? 3 : 2,
      status: 'PENDING',
    },
    {
      id: uuid(),
      season,
      type: 'BOARD_CONFIDENCE',
      title: 'Keep the board on your side',
      description: `Finish the season with board confidence at ${confidenceTarget} or above.`,
      targetValue: confidenceTarget,
      currentValue: team.boardConfidence ?? 70,
      rewardBalance: 120000,
      rewardXp: 90,
      rewardReputation: 1,
      status: 'PENDING',
    },
    {
      id: uuid(),
      season,
      type: 'CLUB_BUDGET',
      title: 'Protect the club finances',
      description: `Finish the season with at least €${budgetTarget.toLocaleString()} remaining in the club budget.`,
      targetValue: budgetTarget,
      currentValue: Math.max(0, Math.round(team.budget || 0)),
      rewardBalance: team.reputation >= 8000 ? 160000 : 110000,
      rewardXp: 110,
      rewardReputation: 1,
      status: 'PENDING',
    },
  ];
};

const syncManagerObjectivesForState = (
  gameState: GameState,
  managerProfile?: ManagerProfileData,
): ManagerProfileData | undefined => {
  if (!managerProfile) return managerProfile;

  const currentTeamId = managerProfile.currentTeamId || gameState.userTeamId;
  const team = gameState.teams.find((entry) => entry.id === currentTeamId);
  if (!team) return managerProfile;

  const leagueTeams = sortTeamsByStandings(gameState.teams.filter((entry) => entry.leagueId === team.leagueId));
  const currentPosition = Math.max(1, leagueTeams.findIndex((entry) => entry.id === team.id) + 1);
  const boardConfidence = team.boardConfidence ?? 70;
  const currentBudget = Math.max(0, Math.round(team.budget || 0));

  return {
    ...managerProfile,
    objectives: (managerProfile.objectives || []).map((objective) => {
      const currentValue = objective.type === 'LEAGUE_POSITION'
        ? currentPosition
        : objective.type === 'BOARD_CONFIDENCE'
          ? boardConfidence
          : currentBudget;

      return {
        ...objective,
        currentValue,
      };
    }),
  };
};

const resolveManagerSeasonObjectives = (
  gameState: GameState,
): { updatedProfile?: ManagerProfileData; summaryLines: string[] } => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const profile = hydratedState.managerProfile;
  if (!profile) return { updatedProfile: profile, summaryLines: [] };

  const syncedProfile = syncManagerObjectivesForState(hydratedState, profile) || profile;
  const resolvedObjectives = (syncedProfile.objectives || []).map((objective) => {
    const completed = objective.type === 'LEAGUE_POSITION'
      ? objective.currentValue <= objective.targetValue
      : objective.currentValue >= objective.targetValue;
    const status: ManagerObjective['status'] = completed ? 'COMPLETED' : 'FAILED';
    return {
      ...objective,
      status,
    };
  });

  const rewards = resolvedObjectives
    .filter((objective) => objective.status === 'COMPLETED')
    .reduce((acc, objective) => ({
      balance: acc.balance + objective.rewardBalance,
      xp: acc.xp + objective.rewardXp,
      reputation: acc.reputation + objective.rewardReputation,
    }), { balance: 0, xp: 0, reputation: 0 });

  let rewardedProfile: ManagerProfileData = {
    ...syncedProfile,
    objectives: resolvedObjectives,
    personalBalance: syncedProfile.personalBalance + rewards.balance,
    xp: syncedProfile.xp + rewards.xp,
    reputation: Math.max(10, Math.min(100, syncedProfile.reputation + rewards.reputation)),
  };

  rewardedProfile = levelUpManagerProfile(rewardedProfile).nextProfile;
  const summaryLines = resolvedObjectives.map((objective) =>
    `${objective.status === 'COMPLETED' ? '✓' : '✗'} ${objective.title}`,
  );

  return { updatedProfile: rewardedProfile, summaryLines };
};

export const assignManagerObjectivesForCurrentTeam = (
  gameState: GameState,
  teamId?: string,
): GameState => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const targetTeamId = teamId || hydratedState.userTeamId;
  const team = hydratedState.teams.find((entry) => entry.id === targetTeamId);
  if (!team || !hydratedState.managerProfile) return hydratedState;

  const leagueSize = hydratedState.teams.filter((entry) => entry.leagueId === team.leagueId).length || 18;

  return {
    ...hydratedState,
    managerProfile: {
      ...hydratedState.managerProfile,
      currentTeamId: targetTeamId,
      objectives: createManagerObjectivesForTeam(team, hydratedState.currentSeason, leagueSize),
    },
  };
};

export const createManagerProfile = (
  data: ManagerCreationData,
  team?: Team,
  fallbackRating?: number,
  fallbackSalary?: number,
): ManagerProfileData => {
  const teamRep = team?.reputation || 5000;
  const reputation = fallbackRating ?? getInitialUserManagerRating();
  const bonuses = getManagerBonuses(data.nationality, team);
  const initialObjectives = team
    ? createManagerObjectivesForTeam(team, 2024)
    : [];

  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    displayName: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
    nationality: data.nationality,
    archetype: data.archetype,
    level: 1,
    xp: 0,
    xpToNextLevel: 500,
    reputation,
    skillPoints: 0,
    createdAt: new Date().toISOString(),
    currentTeamId: team?.id,
    bonuses,
    careerStats: {
      matchesManaged: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      trophiesWon: 0,
    },
    talents: createEmptyManagerTalents(),
    personalStaff: createEmptyManagerPersonalStaff(),
    objectives: initialObjectives,
    personalBalance: 0,
    lifetimeEarnings: 0,
    lifetimeSpent: 0,
    unlockedAchievements: [],
    playGamesSyncedAchievements: [],
  };
};

export const ensureGameStateManagerProfile = (gameState: GameState): GameState => {
  const currentUserTeam = gameState.teams.find((team) => team.id === gameState.userTeamId) || gameState.teams[0];
  const currentLeagueSize = gameState.teams.filter((team) => team.leagueId === (currentUserTeam?.leagueId || gameState.leagueId)).length || 18;
  if (gameState.managerProfile) {
    return {
      ...gameState,
      managerProfile: {
        ...gameState.managerProfile,
        talents: {
          ...createEmptyManagerTalents(),
          ...(gameState.managerProfile.talents || {}),
        },
        personalStaff: {
          ...createEmptyManagerPersonalStaff(),
          ...(gameState.managerProfile.personalStaff || {}),
        },
        objectives: gameState.managerProfile.objectives || createManagerObjectivesForTeam(currentUserTeam, gameState.currentSeason, currentLeagueSize),
        personalBalance: gameState.managerProfile.personalBalance || 0,
        lifetimeEarnings: gameState.managerProfile.lifetimeEarnings || 0,
        lifetimeSpent: gameState.managerProfile.lifetimeSpent || 0,
        unlockedAchievements: gameState.managerProfile.unlockedAchievements || [],
        playGamesSyncedAchievements:
          gameState.managerProfile.playGamesSyncedAchievements || [],
      },
    };
  }

  const userTeam = currentUserTeam;
  const fallbackNationality = getLeagueCountryName(userTeam?.leagueId || gameState.leagueId);
  const managerProfile = createManagerProfile(
    {
      firstName: "Alex",
      lastName: "Manager",
      nationality: fallbackNationality,
      archetype: ManagerArchetype.TACTICIAN,
    },
    userTeam,
    gameState.managerRating,
    gameState.managerSalary,
  );

  return {
    ...gameState,
    managerProfile,
    managerRating: gameState.managerRating ?? managerProfile.reputation,
    managerSalary:
      gameState.managerSalary ??
      getInitialManagerSalaryForTeamReputation(userTeam?.reputation || 5000),
  };
};

const getManagerXpTarget = (level: number): number =>
  Math.max(500, Math.round(500 + (level - 1) * 175));

export const getManagerGameplayEffects = (managerProfile?: ManagerProfileData) => {
  const archetype = managerProfile?.archetype;
  const bonuses = managerProfile?.bonuses;
  const talents = {
    ...createEmptyManagerTalents(),
    ...(managerProfile?.talents || {}),
  };
  const personalStaff = {
    ...createEmptyManagerPersonalStaff(),
    ...(managerProfile?.personalStaff || {}),
  };
  const level = managerProfile?.level || 1;
  const levelProgress = Math.max(0, level - 1);
  const passiveBoardGainBonus = Math.min(0.18, levelProgress * 0.012);
  const passiveBoardLossReduction = Math.min(0.16, levelProgress * 0.01);
  const passiveTransferBonus = Math.min(9, levelProgress * 0.75);
  const passiveYouthDiscoveryBonus = Math.min(0.015, levelProgress * 0.001);
  const passiveYouthPotentialBonus = Math.min(4, levelProgress * 0.25);
  const passiveDevelopmentBonus = Math.min(0.020, levelProgress * 0.0013);
  const passiveXpMultiplier = Math.min(0.2, levelProgress * 0.01);
  const passiveReputationBonus = Math.min(2, Math.floor(level / 4));
  const passiveSalaryNegotiationBonus = Math.min(0.16, levelProgress * 0.012);
  const talentBoardGainBonus = talents.leadership * 0.05;
  const talentBoardLossReduction = talents.leadership * 0.04;
  const talentTransferBonus = talents.negotiation * 3;
  const talentSalaryNegotiationBonus = talents.negotiation * 0.03;
  const talentDevelopmentBonus = talents.development * 0.012;
  const talentXpMultiplier = talents.development * 0.015;
  const talentYouthDiscoveryBonus = talents.scouting * 0.004;
  const talentYouthPotentialBonus = talents.scouting * 1.2;
  const staffScoutingDiscoveryBonus = personalStaff.scoutAdvisor * 0.0045;
  const staffScoutingPotentialBonus = personalStaff.scoutAdvisor * 1.5;
  const staffDevelopmentBonus = personalStaff.developmentCoach * 0.014;
  const staffXpBonus = personalStaff.developmentCoach * 0.01;
  const staffTransferBonus = personalStaff.contractLawyer * 2.5;
  const staffSalaryNegotiationBonus = personalStaff.contractLawyer * 0.04;
  const weeklyStaffCost = getManagerPersonalStaffWeeklyCost(managerProfile);

  return {
    level,
    skillPoints: managerProfile?.skillPoints || 0,
    talents,
    personalStaff,
    boardConfidenceStartBonus: bonuses?.homeNationConfidenceBonus || 0,
    boardConfidenceGainMultiplier:
      (archetype === ManagerArchetype.MOTIVATOR ? 1.2 : 1.0) + passiveBoardGainBonus + talentBoardGainBonus,
    boardConfidenceLossMultiplier:
      Math.max(0.55, (archetype === ManagerArchetype.MOTIVATOR ? 0.8 : 1.0) - passiveBoardLossReduction - talentBoardLossReduction),
    transferWillingnessBonus:
      (bonuses?.transferNegotiationBonus || 0) * 100 +
      (archetype === ManagerArchetype.NEGOTIATOR ? 12 : 0) +
      passiveTransferBonus +
      talentTransferBonus +
      staffTransferBonus,
    youthDiscoveryBonus:
      (bonuses?.scoutingKnowledgeBonus || 0) * 0.05 +
      (archetype === ManagerArchetype.SCOUT ? 0.015 : 0) +
      passiveYouthDiscoveryBonus +
      talentYouthDiscoveryBonus +
      staffScoutingDiscoveryBonus,
    youthPotentialBonus:
      (bonuses?.scoutingKnowledgeBonus || 0) * 8 +
      (archetype === ManagerArchetype.SCOUT ? 2 : 0) +
      passiveYouthPotentialBonus +
      talentYouthPotentialBonus +
      staffScoutingPotentialBonus,
    playerDevelopmentBonus:
      (archetype === ManagerArchetype.TACTICIAN
        ? 0.02
        : archetype === ManagerArchetype.MOTIVATOR
          ? 0.015
          : 0) + passiveDevelopmentBonus + talentDevelopmentBonus + staffDevelopmentBonus,
    matchXpMultiplier:
      (archetype === ManagerArchetype.TACTICIAN ? 1.12 : 1.0) + passiveXpMultiplier + talentXpMultiplier + staffXpBonus,
    matchReputationBonus:
      (archetype === ManagerArchetype.TACTICIAN ? 1 : 0) + passiveReputationBonus,
    salaryNegotiationBonus: passiveSalaryNegotiationBonus + talentSalaryNegotiationBonus + staffSalaryNegotiationBonus,
    weeklyStaffCost,
  };
};

export const getManagerTalentLevelCap = (level: number): number =>
  Math.max(1, Math.min(6, Math.ceil(level / 2)));

export const getManagerStaffLevelCap = (level: number): number =>
  Math.max(1, Math.min(4, 1 + Math.floor(Math.max(0, level - 1) / 3)));

export const spendManagerSkillPoint = (
  gameState: GameState,
  talentKey: ManagerTalentKey,
): GameState => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const profile = hydratedState.managerProfile;
  if (!profile || profile.skillPoints <= 0) return hydratedState;
  const currentLevel = profile.talents?.[talentKey] || 0;
  const levelCap = getManagerTalentLevelCap(profile.level);

  if (currentLevel >= 5 || currentLevel >= levelCap) return hydratedState;

  const nextTalents = {
    ...createEmptyManagerTalents(),
    ...(profile.talents || {}),
    [talentKey]: currentLevel + 1,
  };

  return {
    ...hydratedState,
    managerProfile: {
      ...profile,
      skillPoints: profile.skillPoints - 1,
      talents: nextTalents,
    },
    messages: [
      {
        id: uuid(),
        week: hydratedState.currentWeek,
        type: MessageType.BOARD,
        subject: "Manager Talent Upgraded",
        body: `${profile.displayName} ${talentKey} yetenegine 1 puan verdi.`,
        isRead: false,
        date: new Date().toISOString(),
      },
      ...hydratedState.messages,
    ],
  };
};

export const purchaseManagerCourse = (
  gameState: GameState,
  courseKey: ManagerCourseKey,
): GameState => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const profile = hydratedState.managerProfile;
  if (!profile) return hydratedState;

  const courseMap: Record<ManagerCourseKey, {
    cost: number;
    minLevel: number;
    title: string;
    apply: (profile: ManagerProfileData) => ManagerProfileData | null;
    body: string;
  }> = {
    PRO_LICENSE: {
      cost: 350000,
      minLevel: 2,
      title: 'Pro License Completed',
      body: 'Uluslararasi lisans programi tamamlandi. +1 skill point ve bonus XP kazandin.',
      apply: (currentProfile) => {
        if ((currentProfile.purchasedCourses || []).includes('PRO_LICENSE')) return null;
        const leveled = levelUpManagerProfile({
          ...currentProfile,
          xp: currentProfile.xp + 280,
          skillPoints: currentProfile.skillPoints + 1,
        }).nextProfile;
        return leveled;
      },
    },
    LEADERSHIP_SEMINAR: {
      cost: 150000,
      minLevel: 2,
      title: 'Leadership Seminar',
      body: 'Liderlik semineri takima ve yonetime etki gucunu artirdi.',
      apply: (currentProfile) => {
        const cap = getManagerTalentLevelCap(currentProfile.level);
        if ((currentProfile.talents.leadership || 0) >= cap) return null;
        return {
          ...currentProfile,
          talents: { ...currentProfile.talents, leadership: currentProfile.talents.leadership + 1 },
        };
      },
    },
    NEGOTIATION_SUMMIT: {
      cost: 180000,
      minLevel: 3,
      title: 'Negotiation Summit',
      body: 'Pazarlik zirvesi transfer ve maas gorusmelerinde avantaj sagladi.',
      apply: (currentProfile) => {
        const cap = getManagerTalentLevelCap(currentProfile.level);
        if ((currentProfile.talents.negotiation || 0) >= cap) return null;
        return {
          ...currentProfile,
          talents: { ...currentProfile.talents, negotiation: currentProfile.talents.negotiation + 1 },
        };
      },
    },
    SCOUTING_TOUR: {
      cost: 180000,
      minLevel: 3,
      title: 'Scouting Tour',
      body: 'Scouting gezisi yeni pazar bilgisi ve genc oyuncu okumasini gelistirdi.',
      apply: (currentProfile) => {
        const cap = getManagerTalentLevelCap(currentProfile.level);
        if ((currentProfile.talents.scouting || 0) >= cap) return null;
        return {
          ...currentProfile,
          talents: { ...currentProfile.talents, scouting: currentProfile.talents.scouting + 1 },
        };
      },
    },
    DEVELOPMENT_WORKSHOP: {
      cost: 180000,
      minLevel: 3,
      title: 'Development Workshop',
      body: 'Gelisim atolyeleri oyuncu gelisimi ve antreman verimini artirdi.',
      apply: (currentProfile) => {
        const cap = getManagerTalentLevelCap(currentProfile.level);
        if ((currentProfile.talents.development || 0) >= cap) return null;
        return {
          ...currentProfile,
          talents: { ...currentProfile.talents, development: currentProfile.talents.development + 1 },
        };
      },
    },
  };

  const course = courseMap[courseKey];
  if (!course || profile.level < course.minLevel || profile.personalBalance < course.cost) {
    return hydratedState;
  }

  const appliedProfile = course.apply(profile);
  if (!appliedProfile) return hydratedState;

  return {
    ...hydratedState,
    managerProfile: {
      ...appliedProfile,
      personalBalance: profile.personalBalance - course.cost,
      lifetimeSpent: (profile.lifetimeSpent || 0) + course.cost,
      purchasedCourses: [...(profile.purchasedCourses || []), courseKey],
    },
    messages: [
      {
        id: uuid(),
        week: hydratedState.currentWeek,
        type: MessageType.BOARD,
        subject: course.title,
        body: `${course.body} Harcama: €${course.cost.toLocaleString()}.`,
        isRead: false,
        date: new Date().toISOString(),
      },
      ...hydratedState.messages,
    ],
  };
};

export const upgradeManagerPersonalStaff = (
  gameState: GameState,
  roleKey: ManagerStaffRoleKey,
): GameState => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const profile = hydratedState.managerProfile;
  if (!profile) return hydratedState;

  const currentStaff = {
    ...createEmptyManagerPersonalStaff(),
    ...(profile.personalStaff || {}),
  };
  const currentLevel = currentStaff[roleKey] || 0;
  const cap = getManagerStaffLevelCap(profile.level);
  if (currentLevel >= 4 || currentLevel >= cap) return hydratedState;

  const baseCostMap: Record<ManagerStaffRoleKey, number> = {
    scoutAdvisor: 120000,
    developmentCoach: 140000,
    contractLawyer: 160000,
  };
  const roleTitleMap: Record<ManagerStaffRoleKey, string> = {
    scoutAdvisor: 'Scout Advisor',
    developmentCoach: 'Development Coach',
    contractLawyer: 'Contract Lawyer',
  };
  const nextLevel = currentLevel + 1;
  const cost = baseCostMap[roleKey] * nextLevel;
  if (profile.personalBalance < cost) return hydratedState;

  return {
    ...hydratedState,
    managerProfile: {
      ...profile,
      personalBalance: profile.personalBalance - cost,
      lifetimeSpent: (profile.lifetimeSpent || 0) + cost,
      personalStaff: {
        ...currentStaff,
        [roleKey]: nextLevel,
      },
    },
    messages: [
      {
        id: uuid(),
        week: hydratedState.currentWeek,
        type: MessageType.BOARD,
        subject: `${roleTitleMap[roleKey]} Upgraded`,
        body: `${roleTitleMap[roleKey]} artik Seviye ${nextLevel}. Harcama: €${cost.toLocaleString()}.`,
        isRead: false,
        date: new Date().toISOString(),
      },
      ...hydratedState.messages,
    ],
  };
};

export const resetManagerTalents = (
  gameState: GameState,
  resetCost: number = 250000,
): GameState => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const profile = hydratedState.managerProfile;
  if (!profile) return hydratedState;

  const spentPoints = Object.values(profile.talents || createEmptyManagerTalents()).reduce(
    (sum, value) => sum + value,
    0,
  );

  if (spentPoints <= 0 || profile.personalBalance < resetCost) return hydratedState;

  return {
    ...hydratedState,
    managerProfile: {
      ...profile,
      skillPoints: profile.skillPoints + spentPoints,
      talents: createEmptyManagerTalents(),
      personalBalance: profile.personalBalance - resetCost,
      lifetimeSpent: (profile.lifetimeSpent || 0) + resetCost,
    },
    messages: [
      {
        id: uuid(),
        week: hydratedState.currentWeek,
        type: MessageType.BOARD,
        subject: "Manager Talent Reset",
        body: `${profile.displayName} talent dagilimini sifirladi. ${spentPoints} puan geri alindi, ucret: €${resetCost.toLocaleString()}.`,
        isRead: false,
        date: new Date().toISOString(),
      },
      ...hydratedState.messages,
    ],
  };
};

const getManagerSalaryReview = (
  currentSalary: number,
  teamReputation: number,
  managerRating: number,
  performanceDelta: number,
  userPosition: number,
  totalTeams: number,
) => {
  const baselineSalary = getManagerMarketSalaryForTeam(teamReputation, managerRating);
  let multiplier = 1;

  if (userPosition === 1) multiplier += 0.14;
  else if (userPosition <= 4) multiplier += 0.08;
  else if (userPosition <= Math.ceil(totalTeams / 2)) multiplier += 0.02;
  else if (userPosition > totalTeams - 3) multiplier -= 0.08;
  else multiplier -= 0.03;

  if (performanceDelta > 0) {
    multiplier += Math.min(0.12, performanceDelta * 0.02);
  } else if (performanceDelta < 0) {
    multiplier += Math.max(-0.1, performanceDelta * 0.015);
  }

  const targetSalary = Math.floor(Math.max(baselineSalary, currentSalary) * multiplier);
  const minSalary = Math.floor(currentSalary * 0.9);
  const maxSalary = Math.floor(currentSalary * 1.22);
  const nextSalary = Math.max(20000, Math.min(maxSalary, Math.max(minSalary, targetSalary)));
  const delta = nextSalary - currentSalary;

  let message = 'Salary unchanged';
  if (delta > 0) {
    message = `Board approved a wage rise to €${nextSalary.toLocaleString()}/wk`;
  } else if (delta < 0) {
    message = `Board reduced your wage to €${nextSalary.toLocaleString()}/wk after review`;
  }

  return { nextSalary, delta, message };
};

const unlockManagerAchievement = (
  gameState: GameState,
  profile: ManagerProfileData,
  achievementId: ManagerAchievementId,
): { profile: ManagerProfileData; messages: Message[] } => {
  const unlockedAchievements = profile.unlockedAchievements || [];
  if (unlockedAchievements.includes(achievementId)) {
    return {
      profile,
      messages: gameState.messages,
    };
  }

  const achievement = MANAGER_ACHIEVEMENTS[achievementId];

  return {
    profile: {
      ...profile,
      unlockedAchievements: [...unlockedAchievements, achievementId],
      playGamesSyncedAchievements: profile.playGamesSyncedAchievements || [],
    },
    messages: [
      {
        id: uuid(),
        week: gameState.currentWeek,
        type: MessageType.INFO,
        subject: `Achievement Unlocked: ${achievement.title}`,
        body: achievement.description,
        isRead: false,
        date: new Date().toISOString(),
      },
      ...gameState.messages,
    ],
  };
};

const levelUpManagerProfile = (managerProfile: ManagerProfileData) => {
  let nextProfile = { ...managerProfile };
  let levelsGained = 0;

  while (nextProfile.xp >= nextProfile.xpToNextLevel) {
    nextProfile = {
      ...nextProfile,
      xp: nextProfile.xp - nextProfile.xpToNextLevel,
      level: nextProfile.level + 1,
      skillPoints: nextProfile.skillPoints + 1,
      xpToNextLevel: getManagerXpTarget(nextProfile.level + 1),
    };
    levelsGained++;
  }

  return { nextProfile, levelsGained };
};

export const applyManagerProfileMatchProgression = (
  gameState: GameState,
  input: {
    teamId: string;
    opponent: Team;
    goalsFor: number;
    goalsAgainst: number;
    isDerby?: boolean;
    isCupMatch?: boolean;
    isEuropeanMatch?: boolean;
    isHome?: boolean;
    engineUsed?: "classic" | "ikinc" | "ucuncu";
    comebackWin?: boolean;
    isSimulated?: boolean; // true = weekly sim (not played live), achievements skipped
  },
): GameState => {
  if (input.teamId !== gameState.userTeamId) return gameState;

  const hydratedState = ensureGameStateManagerProfile(gameState);
  const userTeam = hydratedState.teams.find((team) => team.id === input.teamId);
  if (!userTeam) return hydratedState;

  const won = input.goalsFor > input.goalsAgainst;
  const drew = input.goalsFor === input.goalsAgainst;
  const repDiff = (input.opponent.reputation || userTeam.reputation) - userTeam.reputation;

  let xpGain = 0;
  if (won) xpGain += 70;
  else if (drew) xpGain += 35;
  else xpGain += 18;

  const managerEffects = getManagerGameplayEffects(hydratedState.managerProfile);

  if (repDiff > 0) xpGain += Math.min(36, Math.round(repDiff / 180));
  if (input.goalsFor - input.goalsAgainst >= 2) xpGain += 10;
  if (input.goalsAgainst === 0) xpGain += 8;
  if (input.isDerby) xpGain += 14;
  if (input.isEuropeanMatch) xpGain += 18;
  else if (input.isCupMatch) xpGain += 10;
  xpGain = Math.round(xpGain * managerEffects.matchXpMultiplier);

  const expectedResult = 1 / (1 + Math.pow(10, ((input.opponent.reputation || userTeam.reputation) - userTeam.reputation) / 1800));
  const actualResult = won ? 1 : drew ? 0.5 : 0;
  let reputationDelta = Math.round((actualResult - expectedResult) * 10);

  if (won && reputationDelta < 1) reputationDelta = 1;
  if (!won && !drew && reputationDelta > -1) reputationDelta = -1;
  if (input.isDerby) reputationDelta += won ? 1 : drew ? 0 : -1;
  if (input.isEuropeanMatch) reputationDelta += won ? 1 : 0;
  if (won) reputationDelta += managerEffects.matchReputationBonus;
  reputationDelta = Math.max(-4, Math.min(5, reputationDelta));

  const engineUsed = input.engineUsed || getEngineChoice();
  const currentEngineMatches = hydratedState.managerProfile!.engineMatchesPlayed || {};
  // Simulated matches don't count toward engine-pref achievements
  const newEngineMatchCount = input.isSimulated
    ? (currentEngineMatches[engineUsed] || 0)
    : (currentEngineMatches[engineUsed] || 0) + 1;

  const updatedProfileBase: ManagerProfileData = {
    ...hydratedState.managerProfile!,
    xp: hydratedState.managerProfile!.xp + xpGain,
    reputation: Math.max(10, Math.min(100, hydratedState.managerProfile!.reputation + reputationDelta)),
    currentTeamId: input.teamId,
    careerStats: input.isSimulated
      ? hydratedState.managerProfile!.careerStats // Simulated: don't count in career stats
      : {
          ...hydratedState.managerProfile!.careerStats,
          matchesManaged: hydratedState.managerProfile!.careerStats.matchesManaged + 1,
          wins: hydratedState.managerProfile!.careerStats.wins + (won ? 1 : 0),
          draws: hydratedState.managerProfile!.careerStats.draws + (drew ? 1 : 0),
          losses: hydratedState.managerProfile!.careerStats.losses + (!won && !drew ? 1 : 0),
        },
    engineMatchesPlayed: {
      ...currentEngineMatches,
      [engineUsed]: newEngineMatchCount,
    },
  };

  const { nextProfile, levelsGained } = levelUpManagerProfile(updatedProfileBase);
  const newMessages = levelsGained > 0
    ? [
        {
          id: uuid(),
          week: hydratedState.currentWeek,
          type: MessageType.BOARD,
          subject: `Manager Level Up!`,
          body: `${nextProfile.displayName} level ${nextProfile.level} oldu. +${levelsGained} skill point kazandin.`,
          isRead: false,
          date: new Date().toISOString(),
        },
        ...hydratedState.messages,
      ]
    : hydratedState.messages;

  let finalProfile = nextProfile;
  let finalMessages = newMessages;

  // Simulated matches don't unlock any achievements
  if (!input.isSimulated && won && !(finalProfile.unlockedAchievements || []).includes('FIRST_OFFICIAL_WIN')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'FIRST_OFFICIAL_WIN',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  // Check Engine Preference Achievements (only for live matches)
  if (!input.isSimulated && engineUsed === 'classic' && newEngineMatchCount === 10 && !(finalProfile.unlockedAchievements || []).includes('ENGINE_PREF_CLASSIC')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'ENGINE_PREF_CLASSIC',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }
  if (!input.isSimulated && engineUsed === 'ikinc' && newEngineMatchCount === 10 && !(finalProfile.unlockedAchievements || []).includes('ENGINE_PREF_ARCADE')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'ENGINE_PREF_ARCADE',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }
  if (!input.isSimulated && engineUsed === 'ucuncu' && newEngineMatchCount === 10 && !(finalProfile.unlockedAchievements || []).includes('ENGINE_PREF_PRO')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'ENGINE_PREF_PRO',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  // ========== NEW ACHIEVEMENT CHECKS (live matches only) ==========
  if (!input.isSimulated) {
    // GOAL_MACHINE: Score 7+ goals in a single match
    if (input.goalsFor >= 7 && !(finalProfile.unlockedAchievements || []).includes('GOAL_MACHINE')) {
      const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'GOAL_MACHINE');
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }

    // DAVID_GOLIATH: Beat a team with 30%+ higher reputation
    if (won && userTeam) {
      const opponentRep = input.opponent.reputation || 5000;
      const userRep = userTeam.reputation || 5000;
      if (opponentRep >= userRep * 1.3 && !(finalProfile.unlockedAchievements || []).includes('DAVID_GOLIATH')) {
        const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'DAVID_GOLIATH');
        finalProfile = achievementUnlock.profile;
        finalMessages = achievementUnlock.messages;
      }
    }

    // COMEBACK_KING: Win after trailing past the 70th minute
    if (won && input.comebackWin && !(finalProfile.unlockedAchievements || []).includes('COMEBACK_KING')) {
      const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'COMEBACK_KING');
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }

    // MONEY_TALKS: Have 100M+ in the budget
    if (userTeam && userTeam.budget >= 100_000_000 && !(finalProfile.unlockedAchievements || []).includes('MONEY_TALKS')) {
      const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'MONEY_TALKS');
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }

    // FIRST_MATCH: Play any live match
    if (!(finalProfile.unlockedAchievements || []).includes('FIRST_MATCH')) {
      const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'FIRST_MATCH');
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }

    // CONTINENTAL_DEBUT: Play first European match
    if (input.isEuropeanMatch && !(finalProfile.unlockedAchievements || []).includes('CONTINENTAL_DEBUT')) {
      const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'CONTINENTAL_DEBUT');
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }

    // LEVEL_10: Reach manager level 10
    if (finalProfile.level >= 10 && !(finalProfile.unlockedAchievements || []).includes('LEVEL_10')) {
      const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'LEVEL_10');
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }
  }

  // CLEAN_SHEET_STREAK & AWAY_MACHINE: track streaks but only unlock achievement for live matches
  const prevCleanSheetStreak = finalProfile.cleanSheetStreak || 0;
  const newCleanSheetStreak = input.goalsAgainst === 0 ? prevCleanSheetStreak + 1 : 0;
  finalProfile = { ...finalProfile, cleanSheetStreak: newCleanSheetStreak };
  if (!input.isSimulated && newCleanSheetStreak >= 5 && !(finalProfile.unlockedAchievements || []).includes('CLEAN_SHEET_STREAK')) {
    const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'CLEAN_SHEET_STREAK');
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  const isAway = input.isHome === false;
  const prevAwayWinStreak = finalProfile.awayWinStreak || 0;
  const newAwayWinStreak = isAway ? (won ? prevAwayWinStreak + 1 : 0) : prevAwayWinStreak;
  finalProfile = { ...finalProfile, awayWinStreak: newAwayWinStreak };
  if (!input.isSimulated && newAwayWinStreak >= 5 && !(finalProfile.unlockedAchievements || []).includes('AWAY_MACHINE')) {
    const achievementUnlock = unlockManagerAchievement({ ...hydratedState, messages: finalMessages }, finalProfile, 'AWAY_MACHINE');
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  return {
    ...hydratedState,
    managerProfile: finalProfile,
    managerRating: finalProfile.reputation,
    messages: finalMessages,
  };
};

export const applyManagerProfileSeasonProgression = (
  gameState: GameState,
  input: {
    finalRating: number;
    userPosition: number;
    totalTeams: number;
    performanceDelta: number;
    wonLeague: boolean;
    wonChampionsLeague: boolean;
    wonEuropaLeague: boolean;
    wonSuperCup: boolean;
  },
): GameState => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const trophyCount = [
    input.wonLeague,
    input.wonChampionsLeague,
    input.wonEuropaLeague,
    input.wonSuperCup,
  ].filter(Boolean).length;

  let xpGain = 80;
  if (input.userPosition === 1) xpGain += 200;
  else if (input.userPosition <= 4) xpGain += 110;
  else if (input.userPosition <= Math.ceil(input.totalTeams / 2)) xpGain += 50;
  else xpGain += 15;

  if (input.performanceDelta > 0) {
    xpGain += Math.min(140, input.performanceDelta * 25);
  }
  if (input.wonLeague) xpGain += 100;
  if (input.wonChampionsLeague) xpGain += 220;
  if (input.wonEuropaLeague) xpGain += 140;
  if (input.wonSuperCup) xpGain += 70;

  const updatedProfileBase: ManagerProfileData = {
    ...hydratedState.managerProfile!,
    xp: hydratedState.managerProfile!.xp + xpGain,
    reputation: Math.max(10, Math.min(100, input.finalRating)),
    currentTeamId: hydratedState.userTeamId,
    careerStats: {
      ...hydratedState.managerProfile!.careerStats,
      trophiesWon:
        hydratedState.managerProfile!.careerStats.trophiesWon + trophyCount,
    },
  };

  const { nextProfile, levelsGained } = levelUpManagerProfile(updatedProfileBase);
  let finalProfile = nextProfile;
  const newMessages = levelsGained > 0
    ? [
        {
          id: uuid(),
          week: 1,
          type: MessageType.BOARD,
          subject: `Season Progress`,
          body: `${nextProfile.displayName} sezon sonunda level ${nextProfile.level} oldu. Kariyer XP +${xpGain}.`,
          isRead: false,
          date: new Date().toISOString(),
        },
        ...hydratedState.messages,
      ]
    : hydratedState.messages;
  let finalMessages = newMessages;

  // ========== SEASON-END ACHIEVEMENT CHECKS ==========

  // LEAGUE_CHAMPION: Win the league
  if (input.wonLeague && !(finalProfile.unlockedAchievements || []).includes('LEAGUE_CHAMPION')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'LEAGUE_CHAMPION',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  // CUP_WINNER: Win any continental cup
  if ((input.wonChampionsLeague || input.wonEuropaLeague || input.wonSuperCup) && !(finalProfile.unlockedAchievements || []).includes('CUP_WINNER')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'CUP_WINNER',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  // GLOBE_TROTTER: Managed in 3+ different countries
  if (!(finalProfile.unlockedAchievements || []).includes('GLOBE_TROTTER')) {
    const careerHistory = hydratedState.managerCareerHistory || [];
    const uniqueCountries = new Set<string>();
    careerHistory.forEach((entry: any) => {
      if (entry.leagueId) {
        // Extract country from leagueId (e.g., 'turkey_super_lig' → 'turkey')
        const country = entry.leagueId.split('_')[0];
        uniqueCountries.add(country);
      }
    });
    // Also add the current team's league
    const currentTeam = hydratedState.teams.find(t => t.id === hydratedState.userTeamId);
    if (currentTeam?.leagueId) {
      uniqueCountries.add(currentTeam.leagueId.split('_')[0]);
    }
    if (uniqueCountries.size >= 3) {
      const achievementUnlock = unlockManagerAchievement(
        { ...hydratedState, messages: finalMessages },
        finalProfile,
        'GLOBE_TROTTER',
      );
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }
  }

  // YOUTH_DIAMOND: Any player on user's team that came from youth academy has 80+ OVR
  if (!(finalProfile.unlockedAchievements || []).includes('YOUTH_DIAMOND')) {
    const userPlayers = hydratedState.players.filter(p => p.teamId === hydratedState.userTeamId);
    const youthStar = userPlayers.find(p => (p as any).isYouthProduct && p.overall >= 80);
    if (youthStar) {
      const achievementUnlock = unlockManagerAchievement(
        { ...hydratedState, messages: finalMessages },
        finalProfile,
        'YOUTH_DIAMOND',
      );
      finalProfile = achievementUnlock.profile;
      finalMessages = achievementUnlock.messages;
    }
  }

  // DOUBLE_WINNER: Win league + any continental cup in same season
  if (
    input.wonLeague &&
    (input.wonChampionsLeague || input.wonEuropaLeague) &&
    !(finalProfile.unlockedAchievements || []).includes('DOUBLE_WINNER')
  ) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'DOUBLE_WINNER',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  // BACK_TO_BACK_CHAMPION + DYNASTY: Consecutive league titles
  const prevConsecutiveTitles = finalProfile.consecutiveLeagueTitles || 0;
  const newConsecutiveTitles = input.wonLeague ? prevConsecutiveTitles + 1 : 0;
  finalProfile = { ...finalProfile, consecutiveLeagueTitles: newConsecutiveTitles };

  if (newConsecutiveTitles >= 2 && !(finalProfile.unlockedAchievements || []).includes('BACK_TO_BACK_CHAMPION')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'BACK_TO_BACK_CHAMPION',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  if (newConsecutiveTitles >= 3 && !(finalProfile.unlockedAchievements || []).includes('DYNASTY')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'DYNASTY',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  // LEVEL_10 recheck at season end (in case level jumped past 10)
  if (finalProfile.level >= 10 && !(finalProfile.unlockedAchievements || []).includes('LEVEL_10')) {
    const achievementUnlock = unlockManagerAchievement(
      { ...hydratedState, messages: finalMessages },
      finalProfile,
      'LEVEL_10',
    );
    finalProfile = achievementUnlock.profile;
    finalMessages = achievementUnlock.messages;
  }

  return {
    ...hydratedState,
    managerProfile: finalProfile,
    managerRating: finalProfile.reputation,
    messages: finalMessages,
  };
};

const generateEmergencyJobOffers = (
  gameState: GameState,
  firedTeamId?: string,
): JobOffer[] => {
  const managerRating = gameState.managerProfile?.reputation || gameState.managerRating || 35;
  const allLeagueTeams = gameState.teams.filter((team) => team.id !== firedTeamId);

  const offers = allLeagueTeams
    .filter((team) => {
      const requiredRating = getRequiredManagerRatingForJobOffer(team.reputation);
      return managerRating + 8 >= requiredRating;
    })
    .sort((a, b) => a.reputation - b.reputation)
    .slice(0, 6)
    .map((team) => buildJobOffer(team, managerRating, 8, {
      unemploymentBoost: true,
      recentPerformanceDelta: 0,
      userPosition: undefined,
      currentSalary: gameState.managerSalary,
      managerProfile: gameState.managerProfile,
    }));

  return offers.sort((a, b) => b.offerScore - a.offerScore);
};

const getLeagueNameForJobOffer = (leagueId: string): string =>
  LEAGUE_PRESETS.find((league) => league.id === leagueId)?.name || leagueId.toUpperCase();

export const getRequiredManagerRatingForJobOffer = (teamReputation: number): number => {
  if (teamReputation >= 9500) return 75;
  if (teamReputation >= 9000) return 68;
  if (teamReputation >= 8500) return 58;
  if (teamReputation >= 8000) return 48;
  if (teamReputation >= 7000) return 38;
  if (teamReputation >= 5500) return 28;
  return 15;
};

export const canSelectStartingTeam = (
  teamReputation: number,
  managerRating: number = getInitialUserManagerRating(),
): boolean => getRequiredManagerRatingForJobOffer(teamReputation) <= managerRating;

const getJobOfferPressure = (teamReputation: number): JobOffer['pressure'] => {
  if (teamReputation >= 9200) return 'EXTREME';
  if (teamReputation >= 8200) return 'HIGH';
  if (teamReputation >= 6800) return 'MEDIUM';
  return 'LOW';
};

const getJobOfferObjective = (team: Team): string => {
  if (team.reputation >= 9200) return 'Win the league and go deep in Europe';
  if (team.reputation >= 8500) return 'Secure Champions League football';
  if (team.reputation >= 7600) return 'Push for European qualification';
  if (team.reputation >= 6200) return 'Finish in the top half';
  return 'Avoid relegation and stabilize the club';
};

const getJobOfferSalaryLevel = (
  salary: number,
  baselineSalary: number,
): JobOffer['salaryLevel'] => {
  if (salary >= baselineSalary * 1.16) return 'ELITE';
  if (salary >= baselineSalary * 1.06) return 'STRONG';
  if (salary >= baselineSalary * 0.94) return 'FAIR';
  return 'MODEST';
};

const buildJobOffer = (
  team: Team,
  managerRating: number,
  expiresWeek: number,
  options?: {
    unemploymentBoost?: boolean;
    recentPerformanceDelta?: number;
    userPosition?: number;
    currentSalary?: number;
    currentTeamReputation?: number;
    managerProfile?: ManagerProfileData;
  },
): JobOffer => {
  const managerEffects = getManagerGameplayEffects(options?.managerProfile);
  const baselineSalary = getManagerMarketSalaryForTeam(team.reputation, managerRating);
  const performanceBonus = Math.max(0, options?.recentPerformanceDelta || 0) * 7500;
  const unemploymentBonus = options?.unemploymentBoost ? 25000 : 0;
  const ambitionMultiplier =
    team.reputation >= 9200 ? 1.12 :
    team.reputation >= 8200 ? 1.08 :
    team.reputation >= 7000 ? 1.03 : 0.97;
  const salaryDemandMultiplier = 1 + managerEffects.salaryNegotiationBonus;
  const isStepUpMove =
    options?.currentTeamReputation !== undefined &&
    team.reputation > options.currentTeamReputation + 250;
  const currentSalaryFloor = options?.currentSalary
    ? Math.floor(options.currentSalary * (isStepUpMove ? 1.08 : 0.92))
    : 0;
  const salary = Math.max(
    currentSalaryFloor,
    Math.floor((baselineSalary + performanceBonus + unemploymentBonus) * ambitionMultiplier * salaryDemandMultiplier),
  );
  const requiredRating = getRequiredManagerRatingForJobOffer(team.reputation);
  const objective = getJobOfferObjective(team);
  const pressure = getJobOfferPressure(team.reputation);
  const salaryLevel = getJobOfferSalaryLevel(salary, baselineSalary);
  const positionBonus = options?.userPosition ? Math.max(0, 8 - options.userPosition) * 3 : 0;
  const pressurePenalty = pressure === 'EXTREME' ? 10 : pressure === 'HIGH' ? 5 : 0;
  const salaryLevelBonus =
    salaryLevel === 'ELITE' ? 12 :
    salaryLevel === 'STRONG' ? 7 :
    salaryLevel === 'FAIR' ? 3 : 0;
  const offerScore = team.reputation / 120 + salary / 20000 + salaryLevelBonus + positionBonus - pressurePenalty;

  return {
    id: uuid(),
    teamId: team.id,
    teamName: team.name,
    leagueId: team.leagueId,
    leagueName: getLeagueNameForJobOffer(team.leagueId),
    reputation: team.reputation,
    salary,
    requiredRating,
    expiresWeek,
    objective,
    pressure,
    salaryLevel,
    offerScore,
  };
};

export const transitionManagerToUnemployed = (
  gameState: GameState,
  firedTeamId: string,
): GameState => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const firedTeam = hydratedState.teams.find((team) => team.id === firedTeamId);
  const emergencyOffers = generateEmergencyJobOffers(hydratedState, firedTeamId);

  return {
    ...hydratedState,
    isGameOver: false,
    gameOverReason: undefined,
    isUnemployed: true,
    pendingOffers: [],
    jobOffers: emergencyOffers,
    managerProfile: hydratedState.managerProfile
      ? {
          ...hydratedState.managerProfile,
          currentTeamId: undefined,
        }
      : hydratedState.managerProfile,
    messages: [
      {
        id: uuid(),
        week: hydratedState.currentWeek,
        type: MessageType.BOARD,
        subject: `Kovuldunuz`,
        body: firedTeam
          ? `${firedTeam.name} yönetimi sizinle yollarini ayirdi. Artik issiz menajersiniz ve yeni teklif bekliyorsunuz.`
          : `Yonetim sizinle yollarini ayirdi. Artik issiz menajersiniz ve yeni teklif bekliyorsunuz.`,
        isRead: false,
        date: new Date().toISOString(),
      },
      ...(emergencyOffers.length > 0
        ? [{
            id: uuid(),
            week: hydratedState.currentWeek,
            type: MessageType.BOARD,
            subject: `Yeni Is Teklifleri`,
            body: `${emergencyOffers.length} kulup sizinle gorusmek istiyor. Kariyer devam ediyor.`,
            isRead: false,
            date: new Date().toISOString(),
          }]
        : []),
      ...hydratedState.messages,
    ],
  };
};

const LEAGUE_TO_COUNTRY: Record<string, string> = {
  en: "England", es: "Spain", it: "Italy", de: "Germany", fr: "France",
  tr: "Turkey", pt: "Portugal", nl: "Netherlands", br: "Brazil", ar: "Argentina",
  us: "USA", mx: "Mexico", jp: "Japan", sa: "Saudi Arabia", kr: "South Korea",
  cn: "China", au: "Australia", eg: "Egypt", za: "South Africa", ma: "Morocco",
  ng: "Nigeria", dz: "Algeria", tn: "Tunisia", co: "Colombia", cl: "Chile",
  uy: "Uruguay", ec: "Ecuador", py: "Paraguay", cr: "Costa Rica", in: "India",
  id: "Indonesia", my: "Malaysia", gh: "Ghana", sn: "Senegal", ci: "Ivory Coast",
  ke: "Kenya", sco: "Scotland", be: "Belgium", ru: "Russia", ch: "Switzerland",
  gr: "Greece", pl: "Poland", cz: "Czech Republic", ro: "Romania", hr: "Croatia",
  rs: "Serbia", at: "Austria",
};

const getYouthNationalityPool = (leagueId: string): string[] => {
  const mainNat = LEAGUE_TO_COUNTRY[leagueId] || "England";
  const nationalityPools: Record<string, string[]> = {
    tr: ["Turkey", "Turkey", "Turkey", "Turkey", "Turkey", "Germany", "France", "Brazil"],
    en: ["England", "England", "England", "England", "France", "Brazil", "Spain", "Germany", "Nigeria"],
    es: ["Spain", "Spain", "Spain", "Spain", "Argentina", "Brazil", "Portugal", "France", "Colombia"],
    it: ["Italy", "Italy", "Italy", "Italy", "Argentina", "Brazil", "France", "Albania"],
    de: ["Germany", "Germany", "Germany", "Germany", "Turkey", "France", "Netherlands", "Nigeria"],
    fr: ["France", "France", "France", "France", "Algeria", "Morocco", "Senegal", "Ivory Coast"],
    pt: ["Portugal", "Portugal", "Portugal", "Brazil", "Brazil", "Angola", "Spain", "France"],
    nl: ["Netherlands", "Netherlands", "Netherlands", "Belgium", "Suriname", "Morocco", "Ghana"],
    br: ["Brazil", "Brazil", "Brazil", "Brazil", "Argentina", "Uruguay", "Colombia"],
    ar: ["Argentina", "Argentina", "Argentina", "Argentina", "Uruguay", "Chile", "Paraguay"],
    default: [mainNat, mainNat, mainNat, mainNat, mainNat, "Brazil", "France", "Argentina", "Spain", "Nigeria"],
  };

  return nationalityPools[leagueId] || nationalityPools.default;
};

// Takım oyuncularına benzersiz forma numarası ata
const assignTeamJerseyNumbers = (teamPlayers: Player[]) => {
  const usedNumbers = new Set<number>();

  // Pozisyonlara göre sırala: GK, DEF, MID, FWD - ve overall'a göre
  const sorted = [...teamPlayers].sort((a, b) => {
    const posOrder: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
    const orderDiff = (posOrder[a.position] || 4) - (posOrder[b.position] || 4);
    if (orderDiff !== 0) return orderDiff;
    return b.overall - a.overall; // En iyi oyuncu önce
  });

  // Popüler numaralar pozisyona göre
  const preferredNumbers: Record<string, number[]> = {
    GK: [1, 12, 13, 25],
    DEF: [2, 3, 4, 5, 6, 15, 23, 24],
    MID: [6, 7, 8, 10, 14, 16, 17, 18, 20, 22],
    FWD: [7, 9, 10, 11, 19, 21],
  };

  sorted.forEach((player) => {
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
  const db = NAMES_DB[nationality] || NAMES_DB["World"];
  return {
    first: getRandomItem(db.first as string[]),
    last: getRandomItem(db.last as string[]),
  };
};

const generateAttributes = (
  position: Position,
  age: number,
  potential: number,
): PlayerAttributes => {
  const base = potential * 0.6;
  const varAmount = 12;
  const val = (bonus: number = 0) =>
    Math.min(
      99,
      Math.max(
        20,
        Math.floor(base + bonus + (Math.random() * varAmount - varAmount / 2)),
      ),
    );

  const archetypeRoll = Math.random();

  if (position === Position.GK) {
    return {
      finishing: val(-40),
      passing: val(-20),
      tackling: val(-30),
      dribbling: val(-30),
      goalkeeping: val(35),
      speed: val(-20),
      stamina: val(-10),
      strength: val(10),
      positioning: val(25),
      aggression: val(-10),
      composure: val(10),
      vision: val(-20),
      leadership: val(5),
      decisions: val(15),
    };
  } else if (position === Position.DEF) {
    if (archetypeRoll > 0.5) {
      return {
        finishing: val(-30),
        passing: val(-10),
        tackling: val(35),
        dribbling: val(-20),
        goalkeeping: val(-50),
        speed: val(-5),
        stamina: val(15),
        strength: val(30),
        positioning: val(25),
        aggression: val(25),
        composure: val(5),
        vision: val(-10),
        leadership: val(10),
        decisions: val(15),
      };
    } else {
      return {
        finishing: val(-25),
        passing: val(15),
        tackling: val(25),
        dribbling: val(5),
        goalkeeping: val(-50),
        speed: val(5),
        stamina: val(15),
        strength: val(15),
        positioning: val(20),
        aggression: val(10),
        composure: val(15),
        vision: val(10),
        leadership: val(5),
        decisions: val(20),
      };
    }
  } else if (position === Position.MID) {
    if (archetypeRoll > 0.66) {
      return {
        finishing: val(10),
        passing: val(35),
        tackling: val(-15),
        dribbling: val(25),
        goalkeeping: val(-50),
        speed: val(5),
        stamina: val(5),
        strength: val(-15),
        positioning: val(5),
        aggression: val(-15),
        composure: val(20),
        vision: val(35),
        leadership: val(5),
        decisions: val(20),
      };
    } else if (archetypeRoll > 0.33) {
      return {
        finishing: val(5),
        passing: val(15),
        tackling: val(15),
        dribbling: val(10),
        goalkeeping: val(-50),
        speed: val(15),
        stamina: val(35),
        strength: val(10),
        positioning: val(20),
        aggression: val(15),
        composure: val(10),
        vision: val(10),
        leadership: val(10),
        decisions: val(15),
      };
    } else {
      return {
        finishing: val(-15),
        passing: val(5),
        tackling: val(30),
        dribbling: val(-5),
        goalkeeping: val(-50),
        speed: val(0),
        stamina: val(25),
        strength: val(25),
        positioning: val(15),
        aggression: val(30),
        composure: val(10),
        vision: val(-5),
        leadership: val(10),
        decisions: val(10),
      };
    }
  } else {
    if (archetypeRoll > 0.6) {
      return {
        finishing: val(15),
        passing: val(10),
        tackling: val(-30),
        dribbling: val(30),
        goalkeeping: val(-50),
        speed: val(35),
        stamina: val(15),
        strength: val(-10),
        positioning: val(15),
        aggression: val(5),
        composure: val(10),
        vision: val(5),
        leadership: val(0),
        decisions: val(10),
      };
    } else if (archetypeRoll > 0.2) {
      return {
        finishing: val(35),
        passing: val(5),
        tackling: val(-30),
        dribbling: val(5),
        goalkeeping: val(-50),
        speed: val(0),
        stamina: val(10),
        strength: val(35),
        positioning: val(30),
        aggression: val(10),
        composure: val(25),
        vision: val(5),
        leadership: val(5),
        decisions: val(15),
      };
    } else {
      return {
        finishing: val(25),
        passing: val(20),
        tackling: val(-20),
        dribbling: val(20),
        goalkeeping: val(-50),
        speed: val(10),
        stamina: val(10),
        strength: val(5),
        positioning: val(25),
        aggression: val(5),
        composure: val(20),
        vision: val(20),
        leadership: val(10),
        decisions: val(15),
      };
    }
  }
};

const mapTurkishPosition = (pos: string | Position): Position => {
  const s = pos as string;
  if (["KL", "GK"].includes(s)) return Position.GK;
  if (
    ["STP", "SĞB", "SLB", "SW", "DEF", "CB", "RB", "LB", "RWB", "LWB"].includes(
      s,
    )
  )
    return Position.DEF;
  if (["MDO", "MO", "MOO", "MID", "CDM", "CM", "CAM", "RM", "LM"].includes(s))
    return Position.MID;
  return Position.FWD;
};

const generatePlayer = (
  teamId: string,
  position: Position,
  nationality: string,
  ageRange: [number, number],
  potentialRange: [number, number],
  realData?: any,
  leagueId?: string,
): Player => {
  let age = getRandomInt(ageRange[0], ageRange[1]);
  let potential = getRandomInt(potentialRange[0], potentialRange[1]);
  let first, last;

  if (realData) {
    age = realData.yas || realData.age;
    const baseOvr = realData.reyting || realData.ovr;
    potential = Math.max(baseOvr, Math.min(MAX_PLAYER_POTENTIAL, 95 - (age - 20)));

    const fullName =
      realData.ad || realData.firstName + " " + realData.lastName;
    const nameParts = fullName.split(" ");
    if (nameParts.length > 1) {
      last = nameParts.pop();
      first = nameParts.join(" ");
    } else {
      first = fullName;
      last = "";
    }

    if (realData.mevki && typeof realData.mevki === "string") {
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
      goalkeeping: position === Position.GK ? m.refleks || 80 : 10,
      positioning: d.pozisyon || 70,
      aggression: d.agresiflik || 60,
      composure: d.sogukkanlilik || 70,
      vision: d.gorus || m.pas,
      leadership: 75,
      decisions: d.reaksiyon || 75,
    };

    if (position === Position.GK) {
      attributes.goalkeeping = realData.reyting || 80;
      attributes.tackling = 15;
      attributes.finishing = 15;
    }
  } else if (realData && realData.stats) {
    const s = realData.stats;
    attributes = {
      finishing: s.sho,
      passing: s.pas,
      tackling: s.def,
      dribbling: s.dri,
      goalkeeping: position === Position.GK ? 85 : 10,
      speed: s.pac,
      stamina: s.phy - 10,
      strength: s.phy,
      positioning: s.sho - 5,
      aggression: s.def,
      composure: s.pas,
      vision: s.pas,
      leadership: 75,
      decisions: 75,
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
    morale: 80,
  } as Player;

  // Use BASE overall calculator (pure attribute-based, no anchor)
  const calculatedOverall = Math.min(MAX_PLAYER_OVERALL, calculateBaseOverall(tempPlayerForCalc, position));
  potential = Math.max(calculatedOverall, Math.min(MAX_PLAYER_POTENTIAL, potential));

  // Calculate Wage Scaling based on League Economic Power
  // This prevents small leagues from paying Premier League wages
  const leagueMult = leagueId ? getLeagueMultiplier(leagueId) : 1.0;
  // SUPERSTAR PREMIUM: 88+ OVR players demand exponentially higher wages
  // This limits squad depth at elite levels (you can't have 8x 90+ OVR on one team affordably)
  const superstarWageMult = calculatedOverall >= 88
    ? Math.pow(1.22, calculatedOverall - 87)  // 88→1.22x, 90→1.48x, 92→1.81x, 94→2.21x
    : 1.0;
  const baseWage = Math.floor(
    Math.pow(1.13, calculatedOverall - 50) * 100000 * 0.005 * superstarWageMult,
  );
  const scaledWage = Math.floor(baseWage * (0.8 + leagueMult * 0.2));

  // Ensure realistic minimum wages
  const finalWage = Math.max(250, scaledWage);

  return {
    id: uuid(),
    firstName: first,
    lastName: last,
    age,
    nationality: realData
      ? realData.uyruk || realData.nationality
      : nationality,
    position,
    attributes,
    hiddenAttributes: {
      consistency: realData ? 15 : getRandomInt(10, 20),
      importantMatches: realData ? 15 : getRandomInt(10, 20),
      injuryProneness: realData ? 5 : getRandomInt(1, 10),
    },
    visual: {
      skinColor: getRandomItem([
        "#f8d9c6",
        "#eac0a3",
        "#c68642",
        "#8d5524",
        "#523420",
      ]),
      hairColor: getRandomItem(["#000000", "#4a3222", "#d4af37", "#808080"]),
      hairStyle: getRandomInt(1, 5),
      accessory: Math.random() < 0.2,
    },
    stats: {
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      appearances: 0,
      averageRating: 0,
    },
    overall: calculatedOverall,
    potential,
    // VALUE: Realistic exponential formula with youth premium
    // 1.18^(OVR-60): 60 OVR ~€100K, 70 OVR ~€520K, 80 OVR ~€2.7M, 85 OVR ~€6.5M, 91 OVR ~€18M
    // Youth premium: +3% per year under 25 (max +30% at age 15)
    // Age decline: -2.5% per year over 26
    value: Math.floor(
      Math.pow(1.18, calculatedOverall - 60) *
      100000 *
      (1 + (potential - calculatedOverall) / 25) *
      (1 + Math.max(0, 25 - age) * 0.03) *
      (1 - Math.max(0, age - 26) * 0.025),
    ),
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
    lineup: "RESERVE",
    lineupIndex: 99,
    jerseyNumber: realData
      ? realData.forma_no || realData.jerseyNumber
      : undefined,
    playStyles: realData ? realData.oyun_tarzlari || [] : [],
    details: details,
  };
};

export const assignAIPlayerInstructions = (tactic: TeamTactic, players: Player[]) => {
  if (!tactic.slotInstructions) tactic.slotInstructions = {};

  const startingPlayers = players.filter(p => p.lineup === 'STARTING');

  startingPlayers.forEach(p => {
    let instruction = 'Default';
    const pos = p.position;

    const a = p.attributes;
    if (pos === Position.DEF) {
      if (tactic.mentality === 'Defensive' || a.speed < 60) instruction = 'StayBack';
      else if (a.positioning > 75 && a.tackling > 70) instruction = 'HoldPosition';
      else if (a.speed > 75 && a.dribbling > 65) instruction = 'JoinAttack';
    } else if (pos === Position.MID) {
      if (a.tackling > 75 && a.finishing < 60) instruction = 'DefendMore';
      else if (a.finishing > 80) instruction = 'ShootOnSight';
      else if (a.vision > 80 && tactic.mentality === 'Attacking') instruction = 'AttackMore';
      else if (a.stamina > 80 && a.aggression > 75) instruction = 'PressHigher';
      else if (a.vision > 80 && a.dribbling > 75) instruction = 'RoamFromPosition';
      else if (a.tackling > 70 && a.passing > 70) instruction = 'HoldPosition';
    } else if (pos === Position.FWD) {
      if (a.passing > 75 && a.vision > 75) instruction = 'DropDeep';
      else if (a.stamina > 80 && a.aggression > 75) instruction = 'PressHigher';
      else if (a.finishing < 65 && a.stamina > 75) instruction = 'DefendMore';
      else if (a.finishing > 85) instruction = 'ShootOnSight';
    }

    if (instruction !== 'Default') {
      tactic.slotInstructions![p.lineupIndex] = instruction;
    } else {
      delete tactic.slotInstructions![p.lineupIndex];
    }
  });
};

export const autoPickLineup = (
  players: Player[],
  preferredFormation?: TacticType,
  archetype?: CoachArchetype,
  customPositions?: Record<string, { x: number; y: number }>,
  currentStarters?: Player[],
  maxStarters: number = 11, // Default to full team
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
        GK: { GK: 0, DEF: -25, MID: -35, FWD: -40 },
        DEF: { GK: -50, DEF: 0, MID: -10, FWD: -20 },
        MID: { GK: -50, DEF: -8, MID: 0, FWD: -8 },
        FWD: { GK: -50, DEF: -25, MID: -10, FWD: 0 },
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
  const structure: Record<string, number> = ({
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
  }[formation] as any) || { DEF: 4, MID: 4, FWD: 2 };

  // Build list of 11 slot requirements (what position each slot needs)
  const slotRequirements: Position[] = [];

  // Check if we have custom positions with current starters
  if (customPositions && currentStarters && currentStarters.length === 11) {
    let gkCount = 0;
    // Use custom positions to determine what role each slot needs
    currentStarters.forEach((starter) => {
      const customPos = customPositions[starter.id];
      let role = starter.position as Position;

      if (customPos) {
        role = getRoleFromPitchX(customPos.x); // <12 is GK
      }

      // Prevent multiple GKs
      if (role === Position.GK) {
        if (gkCount > 0)
          role = Position.DEF; // Force to DEF if already have a GK assumption
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
    const available = players.filter(
      (p) => (p.weeksInjured || 0) === 0 && (p.matchSuspension || 0) === 0,
    );

    // Helper to normalize position for counting
    const getPos = (p: Player): Position => {
      const posStr = p.position as string;
      if (["KL", "GK"].includes(posStr)) return Position.GK;
      if (
        [
          "STP",
          "SĞB",
          "SLB",
          "SW",
          "DEF",
          "CB",
          "RB",
          "LB",
          "RWB",
          "LWB",
        ].includes(posStr)
      )
        return Position.DEF;
      if (
        ["MDO", "MO", "MOO", "MID", "CDM", "CM", "CAM", "RM", "LM"].includes(
          posStr,
        )
      )
        return Position.MID;
      return Position.FWD;
    };

    const availableCounts = {
      [Position.GK]: available.filter((p) => getPos(p) === Position.GK).length,
      [Position.DEF]: available.filter((p) => getPos(p) === Position.DEF)
        .length,
      [Position.MID]: available.filter((p) => getPos(p) === Position.MID)
        .length,
      [Position.FWD]: available.filter((p) => getPos(p) === Position.FWD)
        .length,
    };

    // Count what the formation WANTS
    const currentCounts = {
      [Position.GK]: slotRequirements.filter((r) => r === Position.GK).length,
      [Position.DEF]: slotRequirements.filter((r) => r === Position.DEF).length,
      [Position.MID]: slotRequirements.filter((r) => r === Position.MID).length,
      [Position.FWD]: slotRequirements.filter((r) => r === Position.FWD).length,
    };

    // Deficit = Needed - Have (Positive value means we are missing players for this role)
    const deficits = {
      [Position.GK]: Math.max(
        0,
        currentCounts[Position.GK] - availableCounts[Position.GK],
      ),
      [Position.DEF]: Math.max(
        0,
        currentCounts[Position.DEF] - availableCounts[Position.DEF],
      ),
      [Position.MID]: Math.max(
        0,
        currentCounts[Position.MID] - availableCounts[Position.MID],
      ),
      [Position.FWD]: Math.max(
        0,
        currentCounts[Position.FWD] - availableCounts[Position.FWD],
      ),
    };

    for (let i = 0; i < removeCount; i++) {
      let targetPos = Position.FWD; // Default sacrifice
      let foundDeficit = false;

      // Priority 1: Remove slot where we have a DEFICIT (Missing player)
      // Order doesn't matter much if deficit exists, but let's check FWD->MID->DEF->GK
      const checkOrder = [
        Position.FWD,
        Position.MID,
        Position.DEF,
        Position.GK,
      ];

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
  players.forEach((p) => {
    p.lineup = "RESERVE";
    p.lineupIndex = 99;
  });

  // Filter available players (not injured/suspended)
  const available = players.filter(
    (p) => p.weeksInjured === 0 && p.matchSuspension === 0,
  );
  const used = new Set<string>();

  // For each slot, find best matching player
  slotRequirements.forEach((requiredRole, slotIdx) => {
    // Find best available player for this role
    let candidates = available
      .filter((p) => !used.has(p.id))
      .map((p) => ({ player: p, score: getEffectiveScore(p, requiredRole) }))
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
      best.lineup = "STARTING";
      best.lineupIndex = slotIdx;
      used.add(best.id);
    }
  });

  // Fill bench (9 players)
  let benchIdx = 11;
  const benchCandidates = available
    .filter((p) => !used.has(p.id))
    .sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a));

  for (let i = 0; i < 9 && i < benchCandidates.length; i++) {
    benchCandidates[i].lineup = "BENCH";
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
    {
      id: uuid(),
      name: "SkyJet Airways",
      description: "Global Airline - Premium",
      weeklyIncome: 300000,
      winBonus: 50000,
      duration: 1,
    },
    {
      id: uuid(),
      name: "GulfStar Airlines",
      description: "Premium Airline",
      weeklyIncome: 250000,
      winBonus: 150000,
      duration: 1,
    },
    {
      id: uuid(),
      name: "Beatify",
      description: "Music Streaming",
      weeklyIncome: 180000,
      winBonus: 350000,
      duration: 1,
    },
    {
      id: uuid(),
      name: "CloudLink",
      description: "Tech Solutions",
      weeklyIncome: 100000,
      winBonus: 600000,
      duration: 1,
    },
    {
      id: uuid(),
      name: "VoltEnergy",
      description: "Energy Drink",
      weeklyIncome: 30000,
      winBonus: 1000000,
      duration: 1,
    },
  ];
};

const generateObjectives = (reputation: number): BoardObjective[] => {
  const objectives: BoardObjective[] = [];
  if (reputation > 7500) {
    objectives.push({
      id: uuid(),
      description: "Win the League Title",
      type: "LEAGUE_POS",
      targetValue: 1,
      isMandatory: true,
      status: "PENDING",
    });
  } else if (reputation > 6500) {
    objectives.push({
      id: uuid(),
      description: "Finish in Top 4",
      type: "LEAGUE_POS",
      targetValue: 4,
      isMandatory: true,
      status: "PENDING",
    });
  } else if (reputation > 5500) {
    objectives.push({
      id: uuid(),
      description: "Finish Mid-Table (Top 10)",
      type: "LEAGUE_POS",
      targetValue: 10,
      isMandatory: true,
      status: "PENDING",
    });
  } else {
    objectives.push({
      id: uuid(),
      description: "Avoid Relegation",
      type: "LEAGUE_POS",
      targetValue: 16,
      isMandatory: true,
      status: "PENDING",
    });
  }
  const rand = Math.random();
  if (rand > 0.5) {
    objectives.push({
      id: uuid(),
      description: "Develop 2 Youth Players",
      type: "DEVELOPMENT",
      targetValue: 2,
      currentValue: 0,
      isMandatory: false,
      status: "PENDING",
    });
  } else {
    objectives.push({
      id: uuid(),
      description: "Keep Wages under budget",
      type: "FINANCIAL",
      isMandatory: false,
      status: "PENDING",
    });
  }
  return objectives;
};

export const analyzeClubHealth = (
  team: Team,
  players: Player[],
): AssistantAdvice[] => {
  const advice: AssistantAdvice[] = [];
  const starters = players.filter((p) => p.lineup === "STARTING");
  if (starters.length < 11)
    advice.push({
      type: "CRITICAL",
      message: "Starting XI has fewer than 11 players.",
    });
  const gk = starters.find((p) => p.position === Position.GK);
  if (!gk)
    advice.push({ type: "CRITICAL", message: "No Goalkeeper in Starting XI." });
  const injured = starters.filter((p) => p.weeksInjured > 0);
  if (injured.length > 0)
    advice.push({
      type: "CRITICAL",
      message: `${injured.length} injured player(s) in lineup.`,
    });

  // Check for suspended players
  const suspended = starters.filter((p) => p.matchSuspension > 0);
  if (suspended.length > 0)
    advice.push({
      type: "CRITICAL",
      message: `${suspended.length} suspended player(s) in lineup.`,
    });
  const lowCond = starters.filter((p) => p.condition < 50);
  if (lowCond.length > 0)
    advice.push({
      type: "WARNING",
      message: `${lowCond.length} player(s) have critically low stamina.`,
    });
  return advice;
};

// Cup Weeks: 6, 10, 14, 18, 22 (Groups), 28, 31, 34, 37 (Knockouts), 39 (Super Cup)
// League fixtures SKIP these weeks so cups and leagues don't clash
export const CUP_WEEKS = [6, 10, 14, 18, 22, 28, 31, 34, 37, 39];

export const generateSeasonSchedule = (
  teams: Team[],
  singleRound: boolean = false,
): Match[] => {
  const matches: Match[] = [];
  const teamIds = teams.map((t) => t.id);
  if (teamIds.length % 2 !== 0) teamIds.push("BYE");
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
      if (home !== "BYE" && away !== "BYE") {
        const actualHome = round % 2 === 0 ? home : away;
        const actualAway = round % 2 === 0 ? away : home;

        // First leg - use adjusted week that skips cup weeks
        const firstLegWeek = getLeagueWeek(round);
        matches.push({
          id: uuid(),
          week: firstLegWeek,
          homeTeamId: actualHome,
          awayTeamId: actualAway,
          homeScore: 0,
          awayScore: 0,
          events: [],
          isPlayed: false,
          date: Date.now() + firstLegWeek * 7 * 24 * 60 * 60 * 1000,
          attendance: 0,
          currentMinute: 0,
          weather: "Sunny",
          timeOfDay: "Day",
          stats: {
            homePossession: 50,
            awayPossession: 50,
            homeShots: 0,
            awayShots: 0,
            homeOnTarget: 0,
            awayOnTarget: 0,
            homeXG: 0,
            awayXG: 0,
          },
        });

        // Second leg (only if double-round) - also skip cup weeks
        if (!singleRound) {
          const secondLegWeek = getLeagueWeek(round + numRounds);
          matches.push({
            id: uuid(),
            week: secondLegWeek,
            homeTeamId: actualAway,
            awayTeamId: actualHome,
            homeScore: 0,
            awayScore: 0,
            events: [],
            isPlayed: false,
            date: Date.now() + secondLegWeek * 7 * 24 * 60 * 60 * 1000,
            attendance: 0,
            currentMinute: 0,
            weather: "Sunny",
            timeOfDay: "Night",
            stats: {
              homePossession: 50,
              awayPossession: 50,
              homeShots: 0,
              awayShots: 0,
              homeOnTarget: 0,
              awayOnTarget: 0,
              homeXG: 0,
              awayXG: 0,
            },
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

  LEAGUE_PRESETS.forEach((preset) => {
    const leagueTeams: Team[] = [];

    (preset.realTeams || []).forEach((rt) => {
      const teamId = uuid();
      const teamPlayers: Player[] = [];
      const realStars = REAL_PLAYERS.filter(
        (p) => p.takim === rt.name || (p as any).team === rt.name,
      );

      // DEDUP: Remove duplicates by name (ad) - some data files have duplicate entries
      const seenNames = new Set<string>();
      const uniqueStars = realStars.filter((star) => {
        const name =
          star.ad || star.name || `${star.firstName} ${star.lastName}`;
        if (seenNames.has(name)) return false;
        seenNames.add(name);
        return true;
      });

      uniqueStars.forEach((star) => {
        let pos = Position.MID;
        if (star.mevki) pos = mapTurkishPosition(star.mevki);
        else if (star.position) pos = star.position;
        const p = generatePlayer(
          teamId,
          pos,
          star.uyruk || star.nationality,
          [star.yas || star.age, star.yas || star.age],
          [star.reyting || star.ovr, star.reyting || star.ovr],
          star,
          preset.id,
        );
        teamPlayers.push(p);
        players.push(p);
      });

      // Determine specific tactic from profile or dynamic best-fit
      let specificTactic: TeamTactic;
      if (TEAM_TACTICAL_PROFILES[rt.name]) {
        specificTactic = JSON.parse(
          JSON.stringify(TEAM_TACTICAL_PROFILES[rt.name]),
        );
        // BALANCING: Prevent AI from starting match with 'Aggressive' to avoid early red card RNG
        // They can switch to it dynamically later if losing (MatchEngine logic)
        if (specificTactic.aggression === "Aggressive") {
          specificTactic.aggression = "Normal";
        }
      } else {
        const suggestedFormation = AIService.suggestBestTacticForSquad(
            teamPlayers,
        );
        // Default generic tactic if no profile found
        specificTactic = {
          formation: suggestedFormation,
          style: "Balanced",
          aggression: "Normal",
          tempo: "Normal",
          width: "Balanced",
          defensiveLine: "Balanced",
          passingStyle: "Mixed",
          marking: "Zonal",
        };
      }

      // Adjust required players based on formation
      const formStruct = {
        [TacticType.T_442]: {
          [Position.GK]: 2,
          [Position.DEF]: 7,
          [Position.MID]: 7,
          [Position.FWD]: 5,
        },
        [TacticType.T_433]: {
          [Position.GK]: 2,
          [Position.DEF]: 7,
          [Position.MID]: 6,
          [Position.FWD]: 6,
        },
        [TacticType.T_532]: {
          [Position.GK]: 2,
          [Position.DEF]: 8,
          [Position.MID]: 6,
          [Position.FWD]: 5,
        },
        [TacticType.T_4231]: {
          [Position.GK]: 2,
          [Position.DEF]: 7,
          [Position.MID]: 8,
          [Position.FWD]: 4,
        },
        [TacticType.T_352]: {
          [Position.GK]: 2,
          [Position.DEF]: 6,
          [Position.MID]: 8,
          [Position.FWD]: 5,
        },
      }[specificTactic.formation] || {
        [Position.GK]: 2,
        [Position.DEF]: 7,
        [Position.MID]: 7,
        [Position.FWD]: 5,
      };

      for (const [pos, count] of Object.entries(formStruct)) {
        const existingCount = teamPlayers.filter(
          (p) => p.position === pos,
        ).length;
        const needed = Math.max(0, (count as number) - existingCount);
        for (let i = 0; i < needed; i++) {
          const nat =
            Math.random() > preset.foreignPlayerChance
              ? preset.playerNationality
              : "World";
          const baseOvr = Math.floor(rt.reputation / 115);
          const p = generatePlayer(
            teamId,
            pos as Position,
            nat,
            [18, 34],
            [baseOvr, baseOvr + 8],
            undefined,
            preset.id,
          );
          teamPlayers.push(p);
          players.push(p);
        }
      }

      const coachType = getRandomItem(Object.values(CoachArchetype));
      // Staff max level 7: Top teams (9000+ rep) start at 6, mid teams 3-5
      const baseStaffLevel = Math.max(1, Math.min(7, Math.floor(rt.reputation / 1500)));

      // Use realistic stadium capacity from preset, or calculate based on reputation
      const baseStadiumCapacity =
        (rt as any).stadiumCapacity || Math.floor(rt.reputation * 4); // Fallback to smaller calculation

      const team: Team = {
        id: teamId,
        name: rt.name,
        city: rt.city,
        primaryColor: rt.primaryColor,
        secondaryColor: rt.secondaryColor,
        reputation: rt.reputation,
        budget: rt.budget,
        boardConfidence: 70, // NEW: Starts at 70%
        leagueId: preset.id, // Assign correct league ID
        facilities: {
          stadiumCapacity: baseStadiumCapacity,
          stadiumLevel: 1, // Will be completely overwritten below
          trainingLevel: 1, // Will be completely overwritten below
          academyLevel: 1, // Will be completely overwritten below
        },
        staff: {
          headCoachLevel: baseStaffLevel,
          physioLevel: baseStaffLevel,
          scoutLevel: baseStaffLevel,
        },
        objectives: [],
        tactic: specificTactic,
        coachArchetype: coachType as CoachArchetype,
        trainingFocus: "BALANCED",
        trainingIntensity: "NORMAL",
        youthCandidates: [],
        recentForm: [],
        stats: {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          points: 0,
        },
        wages: 0,
      };

      // Objectives are only needed for the user's team, but we can generate basic ones for all
      team.objectives = generateObjectives(rt.reputation);

      // =====================================================
      // STADIUM LEVEL SYSTEM - Fair for all teams worldwide
      // Level 1 = 7,500 seats, Level 10 = 120,000 seats (world's largest)
      // Each level = +12,500 seats
      // Starting level calculated from real stadium capacity
      // =====================================================
      const MIN_STADIUM = 7500;
      const MAX_STADIUM = 120000;
      const CAPACITY_PER_LEVEL = 12500;

      // Calculate starting stadium level based on real capacity (Max 10)
      const realCapacity = team.facilities.stadiumCapacity;
      const calculatedLevel =
        Math.round((realCapacity - MIN_STADIUM) / CAPACITY_PER_LEVEL) + 1;
      const stadiumStartLevel = Math.max(1, Math.min(10, calculatedLevel));

      // CRITICAL FIX: Sync Capacity with the calculated Level immediately
      team.facilities.stadiumLevel = stadiumStartLevel;
      team.facilities.stadiumCapacity =
        MIN_STADIUM + (stadiumStartLevel - 1) * CAPACITY_PER_LEVEL;

      // Training & Academy based on reputation tier (Max 7)
      let trainingBaseLevel = 1;
      if (team.reputation >= 9000) trainingBaseLevel = 6;
      else if (team.reputation >= 8000) trainingBaseLevel = 5;
      else if (team.reputation >= 7000) trainingBaseLevel = 4;
      else if (team.reputation >= 6000) trainingBaseLevel = 3;
      else if (team.reputation >= 5000) trainingBaseLevel = 2;

      team.facilities = {
        stadiumCapacity: team.facilities.stadiumCapacity,
        stadiumLevel: stadiumStartLevel,
        trainingLevel: Math.min(8, trainingBaseLevel + getRandomInt(0, 1)),
        academyLevel: Math.min(8, trainingBaseLevel + getRandomInt(0, 1)),
      };

      // Auto pick lineup adhering to the specific formation
      const { formation } = autoPickLineup(
        teamPlayers,
        specificTactic.formation,
        coachType as CoachArchetype,
      );
      team.tactic.formation = formation;

      // Forma numaralarını ata
      assignTeamJerseyNumbers(teamPlayers);

      leagueTeams.push(team);
      teams.push(team);
    });

    // Generate Fixtures for this league
    const isSingleRound = (preset as any).matchFormat === "single-round";
    const leagueMatches = generateSeasonSchedule(leagueTeams, isSingleRound);
    // Correcting league ID match assignment might be tricky if match doesn't have leagueId,
    // but simulation checks team.leagueId so it's fine.
    allMatches.push(...leagueMatches);
  });

  for (let i = 0; i < 50; i++) {
    // Increased free agents
    const p = generatePlayer(
      "FREE_AGENT",
      getRandomItem(Object.values(Position)),
      "World",
      [18, 35],
      [60, 95],
    );
    // Free agent'lara rastgele numara ata (takıma katılınca değişecek)
    p.jerseyNumber = getRandomInt(2, 50);
    players.push(p);
  }

  // Determine User Team (Default to first team of selected league if not specified)
  // The UI handles selection, but for initial state:
  const userLeagueTeams = teams.filter((t) => t.leagueId === leagueId);
  const userTeamId =
    userLeagueTeams.length > 0 ? userLeagueTeams[0].id : teams[0].id; // Fallback

  // ========== MANAGER RATING SYSTEM ==========
  // Initial rating based on chosen team's reputation
  const userTeam = teams.find((t) => t.id === userTeamId);
  const teamRep = userTeam?.reputation || 5000;
  const initialManagerRating = getInitialUserManagerRating();

  // Manager salary based on team reputation (weekly)
  const managerSalary = getInitialManagerSalaryForTeamReputation(teamRep);

  // 5-YEAR MOCK HISTORY INITIALIZATION (Sallamasyon Veri)
  // Create logical starting history for all leagues
  const initialHistory: Record<string, number[]> = {};
  Object.keys(BASE_LEAGUE_REPUTATION).forEach((lid) => {
    if (lid === "default") return;
    const base = BASE_LEAGUE_REPUTATION[lid] || 50;
    // Stronger leagues start with higher history points (e.g. 90 rep -> ~18 pts/year)
    const avgPoints = (base - 40) / 2.5;

    initialHistory[lid] = [
      Math.max(0, avgPoints + getRandomInt(-2, 2)),
      Math.max(0, avgPoints + getRandomInt(-2, 2)),
      Math.max(0, avgPoints + getRandomInt(-2, 2)),
      Math.max(0, avgPoints + getRandomInt(-2, 2)),
      Math.max(0, avgPoints + getRandomInt(-2, 2)),
    ];
  });

  return {
    currentWeek: 1,
    currentSeason: 2024,
    userTeamId,
    leagueId,
    teams,
    players,
    matches: allMatches,
    isSimulating: false,
    messages: [
      {
        id: uuid(),
        week: 1,
        type: MessageType.BOARD,
        subject: "Welcome",
        body: "The board expects strong results.",
        isRead: false,
        date: new Date().toISOString(),
      },
    ],
    transferMarket: players.filter((p) => p.teamId === "FREE_AGENT"),
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
      superCupTitles: 0,
    },
    jobOffers: [],
    // Persist initial state
    leagueReputationBonuses: { ...LEAGUE_REPUTATION_BONUS },
    baseLeagueReputations: { ...BASE_LEAGUE_REPUTATION },
    leagueEuropeanBonuses: { ...LEAGUE_EUROPEAN_BONUS },
  };
};

let activeEngine: any = null;
export const getActiveEngine = () => activeEngine as any;

export const initializeMatch = (
  match: Match,
  homeTeam: Team,
  awayTeam: Team,
  homePlayers: Player[],
  awayPlayers: Player[],
  userTeamId?: string,
) => {
  const choice = engines.getEngineChoice();
  activeEngine = engines.createEngineInstance(
    choice,
    match,
    homeTeam,
    awayTeam,
    homePlayers,
    awayPlayers,
    userTeamId,
  );
  return activeEngine.step().liveData.simulation;
};

// Cache last seen tactic references to avoid expensive JSON.stringify on every tick
let _lastHomeTacticRef: TeamTactic | null = null;
let _lastAwayTacticRef: TeamTactic | null = null;

export const simulateTick = (
  match: Match,
  homeTeam: Team,
  awayTeam: Team,
  homePlayers: Player[],
  awayPlayers: Player[],
  userTeamId?: string,
) => {
  if (!activeEngine || (activeEngine as any).match.id !== match.id) {
    const choice = engines.getEngineChoice();
    activeEngine = engines.createEngineInstance(
      choice,
      match,
      homeTeam,
      awayTeam,
      homePlayers,
      awayPlayers,
      userTeamId,
    );
    _lastHomeTacticRef = homeTeam.tactic;
    _lastAwayTacticRef = awayTeam.tactic;
  } else {
    // FIX: Ensure tactics are synced if UI updated them *after* engine initialization
    // Only do the expensive areTacticsEquivalent check when tactic reference changes
    if (homeTeam.tactic !== _lastHomeTacticRef) {
      _lastHomeTacticRef = homeTeam.tactic;
      if (!areTacticsEquivalent(activeEngine.homeTeam.tactic, homeTeam.tactic)) {
        activeEngine.updateTactic(homeTeam.id, homeTeam.tactic);
      }
    }
    if (awayTeam.tactic !== _lastAwayTacticRef) {
      _lastAwayTacticRef = awayTeam.tactic;
      if (!areTacticsEquivalent(activeEngine.awayTeam.tactic, awayTeam.tactic)) {
        activeEngine.updateTactic(awayTeam.id, awayTeam.tactic);
      }
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
    additionalEvents: result.additionalEvents,
  };
};

export const performSubstitution = (
  matchId: string,
  playerIn: Player,
  playerOutId: string,
) => {
  if (activeEngine) return activeEngine.substitutePlayer(playerIn, playerOutId);
  return false;
};

export const updateMatchTactic = (
  matchId: string,
  teamId: string,
  tactic: TeamTactic,
) => {
  if (activeEngine) activeEngine.updateTactic(teamId, tactic);
};

export const syncEngineLineups = (
  homePlayers: Player[],
  awayPlayers: Player[],
) => {
  if (activeEngine) activeEngine.syncLineups(homePlayers, awayPlayers);
};

export const getLivePlayerStamina = (playerId: string): number | undefined => {
  if (activeEngine) return activeEngine.getPlayerStamina(playerId);
  return undefined;
};

// Returns the set of player IDs who have been substituted OUT during the current match
// These players CANNOT return to the pitch (football rule!)
export const getSubstitutedOutPlayerIds = (): Set<string> => {
  if (activeEngine)
    return (activeEngine as any).substitutedOutPlayerIds || new Set();
  return new Set();
};

export const getSubsMade = (teamId: string): number => {
  if (activeEngine) return activeEngine.getSubsMade(teamId);
  return 0;
};

export const getMaxSubs = (): number => {
  if (activeEngine) return activeEngine.getMaxSubs();
  return 5;
};

export const simulateFullMatch = (
  match: Match,
  homeTeam: Team,
  awayTeam: Team,
  homePlayers: Player[],
  awayPlayers: Player[],
): Match => {
  // ⚽ ADIL SİMÜLASYON - Kullanıcı takımına torpil YOK!
  // Sonuçlar SADECE takımın gerçek gücüne göre belirlenir:
  // - Real Madrid (82-91 OVR) > Karagümrük (54-74 OVR) = RM favorit
  // - Galatasaray (70-82 OVR) vs Fenerbahçe (70-82 OVR) = Dengeli maç

  // 1. TACTICAL ADVANTAGE (Rock Paper Scissors)
  const tacticsRockPaperScissors: Record<string, string> = {
    Possession: "HighPress",
    Counter: "Possession",
    LongBall: "HighPress",
    HighPress: "Counter",
  };

  // === TARAFTAR DESTEĞİ & EV SAHİBİ AVANTAJI ===
  // Reputation (itibar) yüksek takımların daha coşkulu taraftarları var
  const homeReputation = homeTeam.reputation || 5000;
  const fanBoost = Math.min(0.03, homeReputation / 150000); // Max +3% bonus (reduced from 6%, divisor 100k->150k)

  // Temel ev sahibi avantajı + taraftar desteği
  let homeAdvantage = 1.08 + fanBoost; // 1.08 + 0.00-0.03 = 1.08-1.11

  // === ŞANS FAKTÖRÜ ===
  // Arka plan simülasyonlarında şans faktörü azaltıldı (Güçlü takımlar daha istikrarlı şampiyon olsun)
  const luckFactor = 0.95 + Math.random() * 0.1; // 0.95 - 1.05 arası
  const homeLuck = luckFactor;
  const awayLuck = 2 - luckFactor; // Birinin şansı yüksekse diğerinin düşük

  // Tactical Check
  if (tacticsRockPaperScissors[homeTeam.tactic.style] === awayTeam.tactic.style)
    homeAdvantage += 0.05;
  if (tacticsRockPaperScissors[awayTeam.tactic.style] === homeTeam.tactic.style)
    homeAdvantage -= 0.05;

  // 2. POWER CALCULATION - IMPROVED: Uses total team overall + OOP penalties
  const getTeamPower = (
    players: Player[],
  ): { attack: number; defense: number; overall: number } => {
    const starters = players.filter((p) => p.lineup === "STARTING");
    if (starters.length === 0) {
      // Fallback: use top 11 by overall
      const sorted = [...players].sort((a, b) => b.overall - a.overall);
      starters.push(...sorted.slice(0, 11));
    }

    // OOP Penalty Matrix (percentage reduction)
    const oopPenaltyPct: Record<string, Record<string, number>> = {
      GK: { GK: 0, DEF: 0.3, MID: 0.4, FWD: 0.5 },
      DEF: { GK: 0.6, DEF: 0, MID: 0.12, FWD: 0.25 },
      MID: { GK: 0.6, DEF: 0.1, MID: 0, FWD: 0.1 },
      FWD: { GK: 0.6, DEF: 0.3, MID: 0.12, FWD: 0 },
    };

    let attack = 0,
      defense = 0,
      overall = 0;
    starters.forEach((p) => {
      const naturalPos = mapTurkishPosition(p.position);
      // TODO: Detect assigned position from formation/custom positions
      // For now, use natural position (no OOP in auto-sim)
      const playingPos = naturalPos;

      // Calculate OOP penalty
      const penalty =
        oopPenaltyPct[p.position as string]?.[playingPos as string] ?? 0;
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
    const candidates = players.filter(
      (p) => p.lineup === "STARTING",
    );
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

    const homeMomentum =
      0.9 + Math.random() * 0.2 * (1 - homeConsistency) + homeConsistency * 0.1;
    const awayMomentum =
      0.9 + Math.random() * 0.2 * (1 - awayConsistency) + awayConsistency * 0.1;

    // Attack vs Defense calculation - includes LUCK FACTOR & HOME ADVANTAGE
    const hAttackStrength =
      homePower.attack * homeAdvantage * homeMomentum * homeLuck;
    const aAttackStrength = awayPower.attack * awayMomentum * awayLuck;

    const hDefenseStrength = homePower.defense * homeAdvantage;
    const aDefenseStrength = awayPower.defense;

    // Goal probability - scales with power ratio
    // AGGRESSIVE DOMINANCE: Much stronger teams should score more and weaker teams much less
    // This reduces draws significantly
    const hRatio = hAttackStrength / Math.max(100, aDefenseStrength);
    const aRatio = aAttackStrength / Math.max(100, hDefenseStrength);

    const powerDiff = Math.abs(homePower.overall - awayPower.overall);
    // BALANCED DOMINANCE: Güçlü takımların üstünlüğü daha garanti hale getirildi
    // Zayıf takımın kazanma/puan alma şansı (upset ihtimali) kısıldı
    const homeDominance =
      homePower.overall > awayPower.overall
        ? 1 + Math.pow(powerDiff / 45, 1.3) // Biraz daha keskin güç avantajı
        : 1 / (1 + Math.pow(powerDiff / 45, 1.3));
    const awayDominance =
      awayPower.overall > homePower.overall
        ? 1 + Math.pow(powerDiff / 45, 1.3)
        : 1 / (1 + Math.pow(powerDiff / 45, 1.3));

    // Higher base chance but variance heavily leans to stronger team
    const hGoalProb = Math.min(
      0.60,
      Math.max(0.01, Math.pow(hRatio, 2.0) * 0.22 * homeDominance),
    );
    const aGoalProb = Math.min(
      0.55,
      Math.max(0.01, Math.pow(aRatio, 2.0) * 0.18 * awayDominance),
    );

    const rollHome = Math.random();
    const rollAway = Math.random();

    // Separate rolls for each team (both can score in same period)
    if (rollHome < hGoalProb) {
      match.homeScore++;
      const scorer = pickScorer(homePlayers);
      match.events.push({
        minute: min + getRandomInt(1, 9),
        type: MatchEventType.GOAL,
        teamId: homeTeam.id,
        playerId: scorer?.id,
        description: `Gol! (${scorer ? scorer.lastName : homeTeam.name})`,
      });
    }
    if (rollAway < aGoalProb) {
      match.awayScore++;
      const scorer = pickScorer(awayPlayers);
      match.events.push({
        minute: min + getRandomInt(1, 9),
        type: MatchEventType.GOAL,
        teamId: awayTeam.id,
        playerId: scorer?.id,
        description: `Gol! (${scorer ? scorer.lastName : awayTeam.name})`,
      });
    }
  }

  match.isPlayed = true;
  match.events.push({
    minute: 90,
    type: MatchEventType.FULL_TIME,
    description: "Full Time",
  });
  return match;
};

export const simulateLeagueRound = (
  gameState: GameState,
  currentWeek: number,
): GameState => {
  // ========== SQUAD REGENERATION (Exploit Prevention) ==========
  // Minimum 16 players per team, position requirements enforced
  // Generated players are LOW QUALITY youth academy rejects (not exploitable)
  const MIN_SQUAD_SIZE = 20;
  const MIN_GK = 2;
  const MIN_DEF = 6;
  const MIN_MID = 6;
  const MIN_FWD = 4;

  let allPlayers = [...gameState.players];
  const emergencyFreeAgentsByPosition = new Map<Position, Player[]>(
    ([Position.GK, Position.DEF, Position.MID, Position.FWD] as Position[]).map(
      (pos) => [
        pos,
        allPlayers
          .filter((p) => p.teamId === "FREE_AGENT" && p.position === pos)
          .sort((a, b) => {
            const ageScoreA = Math.max(0, 30 - a.age);
            const ageScoreB = Math.max(0, 30 - b.age);
            const prospectScoreA = a.overall + Math.max(0, a.potential - a.overall) * 0.35 + ageScoreA * 0.4;
            const prospectScoreB = b.overall + Math.max(0, b.potential - b.overall) * 0.35 + ageScoreB * 0.4;
            return prospectScoreB - prospectScoreA;
          }),
      ],
    ),
  );

  const takeEmergencyFreeAgent = (team: Team, position: Position): Player | null => {
    const pool = emergencyFreeAgentsByPosition.get(position) || [];
    if (pool.length === 0) return null;

    const targetOverall = Math.max(52, Math.min(74, Math.round(team.reputation / 140)));
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    pool.forEach((candidate, index) => {
      const fitPenalty = Math.abs(candidate.overall - targetOverall) * 1.6;
      const agePenalty = Math.max(0, candidate.age - 30) * 0.7;
      const potentialBonus = Math.max(0, candidate.potential - candidate.overall) * 0.3;
      const score = candidate.overall + potentialBonus - fitPenalty - agePenalty;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [selected] = pool.splice(bestIndex, 1);
    if (!selected) return null;

    selected.teamId = team.id;
    selected.contractYears = Math.max(1, selected.contractYears || 1);
    selected.isTransferListed = false;
    selected.lineup = "RESERVE";
    selected.lineupIndex = 99;

    return selected;
  };

  gameState.teams.forEach((team) => {
    // Check ALL teams including user's team when they switch back
    const teamPlayers = allPlayers.filter((p) => p.teamId === team.id);

    if (teamPlayers.length < MIN_SQUAD_SIZE) {
      // Count positions needed
      const gkCount = teamPlayers.filter((p) => p.position === "GK").length;
      const defCount = teamPlayers.filter((p) => p.position === "DEF").length;
      const midCount = teamPlayers.filter((p) => p.position === "MID").length;
      const fwdCount = teamPlayers.filter((p) => p.position === "FWD").length;

      const neededPositions: Position[] = [];
      if (gkCount < MIN_GK)
        for (let i = gkCount; i < MIN_GK; i++)
          neededPositions.push(Position.GK);
      if (defCount < MIN_DEF)
        for (let i = defCount; i < MIN_DEF; i++)
          neededPositions.push(Position.DEF);
      if (midCount < MIN_MID)
        for (let i = midCount; i < MIN_MID; i++)
          neededPositions.push(Position.MID);
      if (fwdCount < MIN_FWD)
        for (let i = fwdCount; i < MIN_FWD; i++)
          neededPositions.push(Position.FWD);

      // Generate LOW QUALITY youth academy rejects (exploit prevention)
      // Prefer existing free agents first; only generate new players as a last resort.
      const nationalities = ["tr", "br", "de", "fr", "es", "ar"];

      neededPositions.forEach((pos) => {
        const recycledFreeAgent = takeEmergencyFreeAgent(team, pos);
        if (recycledFreeAgent) {
          return;
        }

        const fallbackPotentialFloor = Math.max(
          54,
          Math.min(68, Math.round(team.reputation / 145)),
        );
        const fallbackPotentialCeiling = Math.min(76, fallbackPotentialFloor + 6);
        const newPlayer = generatePlayer(
          team.id,
          pos,
          nationalities[Math.floor(Math.random() * nationalities.length)],
          [18, 23],
          [fallbackPotentialFloor, fallbackPotentialCeiling],
          undefined,
          team.leagueId,
        );
        newPlayer.lineup = "RESERVE";
        newPlayer.lineupIndex = 99;
        newPlayer.contractYears = 1;
        newPlayer.value = Math.min(newPlayer.value, 900000);
        allPlayers.push(newPlayer);
      });
    }
  });

  // Update players array with regenerated players
  gameState = { ...gameState, players: allPlayers };

  // FIX: Simulate ALL matches for the current week across ALL leagues
  const matchesToSimulate = gameState.matches.filter(
    (m) => m.week === currentWeek && !m.isPlayed,
  );

  // 🔥 PERFORMANS OPTİMİZASYONU (Mantık Değişikliği Değil, Hızlandırma)
  // Her maç için binlerce oyuncuyu tekrar tekrar filtrelemek yerine,
  // başta bir kez takımlara göre grupluyoruz. Bu işlem süresini ciddi düşürür.
  const playersByTeam = new Map<string, Player[]>();
  gameState.players.forEach((p) => {
    if (!playersByTeam.has(p.teamId)) playersByTeam.set(p.teamId, []);
    playersByTeam.get(p.teamId)?.push(p);
  });

  matchesToSimulate.forEach((m) => {
    const home = gameState.teams.find((t) => t.id === m.homeTeamId);
    const away = gameState.teams.find((t) => t.id === m.awayTeamId);
    if (home && away) {
      const homePlayers = playersByTeam.get(home.id) || [];
      const awayPlayers = playersByTeam.get(away.id) || [];

      // AI teams auto-pick their best available lineup before each match
      autoPickLineup(homePlayers, home.tactic.formation);
      autoPickLineup(awayPlayers, away.tactic.formation);

      // ========== DYNAMIC AI TACTICS ==========
      // Use the same squad-profile + opponent-aware tactic layer for batch sims too.
      if (home.id !== gameState.userTeamId) {
        autoPickTactics(home, away, homePlayers);
      }
      if (away.id !== gameState.userTeamId) {
        autoPickTactics(away, home, awayPlayers);
      }

      // ADIL SİMÜLASYON - Sadece takım gücüne göre (torpil yok!)
      // ⚡ KRİTİK NOKTA: SENİN ORİJİNAL MOTORUN ÇALIŞIYOR
      simulateFullMatch(m, home, away, homePlayers, awayPlayers);

      if (home.id !== gameState.userTeamId) {
        const updatedHome = recordAITacticMatchOutcome(
          home,
          away,
          m,
          true,
          currentWeek,
          gameState.currentSeason,
        );
        Object.assign(home, updatedHome);
      }
      if (away.id !== gameState.userTeamId) {
        const updatedAway = recordAITacticMatchOutcome(
          away,
          home,
          m,
          false,
          currentWeek,
          gameState.currentSeason,
        );
        Object.assign(away, updatedAway);
      }

      const hScore = m.homeScore;
      const aScore = m.awayScore;
      const ptsHome = hScore > aScore ? 3 : hScore === aScore ? 1 : 0;
      const ptsAway = aScore > hScore ? 3 : hScore === aScore ? 1 : 0;
      const resultHome = hScore > aScore ? "W" : hScore === aScore ? "D" : "L";
      const resultAway = aScore > hScore ? "W" : aScore === hScore ? "D" : "L";

      home.stats.played++;
      home.stats.won += ptsHome === 3 ? 1 : 0;
      home.stats.drawn += ptsHome === 1 ? 1 : 0;
      home.stats.lost += ptsHome === 0 ? 1 : 0;
      home.stats.gf += hScore;
      home.stats.ga += aScore;
      home.stats.points += ptsHome;
      home.recentForm = [...home.recentForm, resultHome].slice(-5);

      away.stats.played++;
      away.stats.won += ptsAway === 3 ? 1 : 0;
      away.stats.drawn += ptsAway === 1 ? 1 : 0;
      away.stats.lost += ptsAway === 0 ? 1 : 0;
      away.stats.gf += aScore;
      away.stats.ga += hScore;
      away.stats.points += ptsAway;
      away.recentForm = [...away.recentForm, resultAway].slice(-5);

      // EUROPEAN CUP PRIZE MONEY (For User) - ADDED FIX
      const isEuropeanMatch =
        gameState.europeanCup &&
        (gameState.europeanCup.groups?.some((g) =>
          g.matches.some((em) => em.id === m.id),
        ) ||
          gameState.europeanCup.knockoutMatches?.some((em) => em.id === m.id));

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
      m.events.forEach((e) => {
        if (e.type === MatchEventType.GOAL && e.playerId) {
          // OPTIMIZATION: Search in local squad lists instead of global gameState.players
          // This reduces complexity from O(total_players) to O(22) per goal
          const scorer =
            homePlayers.find((p) => p.id === e.playerId) ||
            awayPlayers.find((p) => p.id === e.playerId);

          if (scorer) {
            if (!scorer.stats)
              scorer.stats = {
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                appearances: 0,
                averageRating: 0,
              };
            scorer.stats.goals++;

            // === ASSIST TRACKING ===
            // Pick a random teammate (starting or bench) who could have assisted
            // OPTIMIZATION: Use local squad list
            const isHomeScorer = homePlayers.some((p) => p.id === scorer.id);
            const squad = isHomeScorer ? homePlayers : awayPlayers;

            const teammates = squad.filter(
              (p) =>
                p.id !== scorer.id &&
                (p.lineup === "STARTING" || p.lineup === "BENCH"),
            );

            if (teammates.length > 0) {
              // Weight by position (midfielders and forwards more likely to assist)
              const weightedTeammates: Player[] = [];
              teammates.forEach((tm) => {
                const pos = mapTurkishPosition(tm.position);
                let weight = 1;
                if (pos === Position.FWD) weight = 4;
                else if (pos === Position.MID) weight = 6;
                else if (pos === Position.DEF) weight = 2;
                // Passing bonus
                weight += Math.floor((tm.attributes.passing || 50) / 20);
                for (let i = 0; i < weight; i++) weightedTeammates.push(tm);
              });

              const assister =
                weightedTeammates[
                Math.floor(Math.random() * weightedTeammates.length)
                ];
              if (assister) {
                if (!assister.stats)
                  assister.stats = {
                    goals: 0,
                    assists: 0,
                    yellowCards: 0,
                    redCards: 0,
                    appearances: 0,
                    averageRating: 0,
                  };
                assister.stats.assists++;
                // Store assist info in the event for rating calculation
                (e as any).assisterId = assister.id;
              }
            }
          }
        }
      });

      // Update Player Ratings & Appearances (For BOTH teams)
      const updatePlayerRatings = (
        players: Player[],
        teamId: string,
        isHome: boolean,
      ) => {
        const teamWon = isHome ? hScore > aScore : aScore > hScore;
        const teamDrew = hScore === aScore;
        const keptCleanSheet = isHome ? aScore === 0 : hScore === 0;
        const saves = isHome
          ? m.stats?.homeSaves || 0
          : m.stats?.awaySaves || 0;

        // === MORAL FIX: Mark ALL players who played this week ===
        // This includes starters AND anyone who came on as a sub
        // (Subs already have lineup='STARTING' after substitution)
        players
          .filter((p) => p.lineup === "STARTING" || p.lineup === "BENCH")
          .forEach((p) => {
            // If they started OR were subbed in (events show SUB with their id)
            const wasStarter = p.lineup === "STARTING";
            const wasSubbedIn = m.events.some(
              (e) => e.type === MatchEventType.SUB && e.playerId === p.id,
            );

            if (wasStarter || wasSubbedIn) {
              p.playedThisWeek = true;
            }
          });

        players
          .filter((p) => p.lineup === "STARTING")
          .forEach((p) => {
            const oldApps = p.stats?.appearances || 0;
            const newApps = oldApps + 1;

            // Calculate Rating
            let rating = 6.0 + p.overall / 40 + (Math.random() * 1.5 - 0.5);
            if (teamWon) rating += 0.5;
            else if (teamDrew) rating += 0.1;
            else rating -= 0.3;

            // Clean Sheet Bonus (GK & DEF)
            if (keptCleanSheet && (p.position === "GK" || p.position === "DEF"))
              rating += 0.8;

            // GK Saves Bonus
            if (p.position === "GK") rating += saves * 0.2;

            // Goals Bonus
            const goals = m.events.filter(
              (e) => e.type === MatchEventType.GOAL && e.playerId === p.id,
            ).length;
            rating += goals * 1.0;

            // Assists Bonus
            const assists = m.events.filter(
              (e) =>
                e.type === MatchEventType.GOAL &&
                (e as any).assisterId === p.id,
            ).length;
            rating += assists * 0.7;

            // Yellow/Red Card Penalty
            const yellowCards = m.events.filter(
              (e) =>
                e.type === MatchEventType.CARD_YELLOW && e.playerId === p.id,
            ).length;
            const redCards = m.events.filter(
              (e) => e.type === MatchEventType.CARD_RED && e.playerId === p.id,
            ).length;
            rating -= yellowCards * 0.3;
            rating -= redCards * 2.0;

            // Cap
            rating = Math.max(3.0, Math.min(10.0, rating));

            // Update Stats
            if (!p.stats)
              p.stats = {
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                appearances: 0,
                averageRating: 0,
              };
            // goals and assists already updated in m.events.forEach above - do NOT add again
            p.stats.yellowCards += yellowCards;
            p.stats.redCards += redCards;

            // Update Average Rating
            const oldAvg = p.stats.averageRating || 6.0;
            const newAvg = (oldAvg * oldApps + rating) / newApps;

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
              const seasonYellows = p.stats.yellowCards || 0;
              // Every 5th yellow card = suspension (FIFA rules)
              if (seasonYellows % 5 === 0 && seasonYellows > 0) {
                p.matchSuspension = (p.matchSuspension || 0) + 1;
              }
            }

            // Form Update
            p.form = Math.min(
              10,
              Math.max(1, p.form + (rating > 7.0 ? 1 : rating < 5.5 ? -1 : 0)),
            );
          });
      };

      updatePlayerRatings(homePlayers, home.id, true);
      updatePlayerRatings(awayPlayers, away.id, false);

      // REPUTATION SYSTEM - ELO-STYLE: Symmetric risk/reward + GIANT KILLER BONUS
      const updateReputation = (
        team: Team,
        opponent: Team,
        won: boolean,
        drew: boolean,
      ) => {
        const teamRep = team.reputation;
        const opponentRep = opponent.reputation;

        // 1. Determine K-Factor (Volatility)
        // Domestic: 16 (Standard)
        // International: 24 (High Stakes - Champions League etc.)
        const isInternational = team.leagueId !== opponent.leagueId;
        const baseK = isInternational ? 24 : 16;

        // 2. Expected Outcome (ELO Formula)
        // 1500 scaling factor - bigger = less impact from rep difference
        const expectedOutcome =
          1 / (1 + Math.pow(10, (opponentRep - teamRep) / 1500));

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
            giantKillerMultiplier = 1.0 + leagueDiff / 12;
          }
        }

        // ELO change formula: K * (Actual - Expected) * multiplier
        let change = Math.round(
          baseK *
          (actualResult - expectedOutcome) *
          1.5 *
          giantKillerMultiplier,
        );

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
          const resultText = won ? "G" : drew ? "B" : "M";
          // Add fire icon specifically for giant killings
          const magicIcon = giantKillerMultiplier > 1.5 ? " 🔥" : "";
          const reason = `${opponent.name} (${resultText})${magicIcon}`;

          const history = team.reputationHistory || [];
          history.push({
            week: gameState.currentWeek,
            change,
            reason,
            newValue: newReputation,
          });
          // Keep only last 20 entries
          team.reputationHistory = history.slice(-20);
        }

        team.reputation = newReputation;
      };

      updateReputation(home, away, hScore > aScore, hScore === aScore);
      updateReputation(away, home, aScore > hScore, hScore === aScore);

      // === BOARD CONFIDENCE SYSTEM ===
      // Only update for user team (AI teams don't need this)
      const updateBoardConfidence = (
        team: Team,
        opponent: Team,
        won: boolean,
        drew: boolean,
        goalsFor: number,
        goalsAgainst: number,
      ) => {
        if (team.id !== gameState.userTeamId) return; // Only for user team
        const managerEffects = getManagerGameplayEffects(gameState.managerProfile);

        const opponentRep = opponent.reputation;
        const repDiff = opponentRep - team.reputation;
        let change = 0;

        // Check Context (Derby, Cup, etc.)
        const rivals = DERBY_RIVALS[team.name] || [];
        const isDerby = rivals.includes(opponent.name);

        // European Match Check
        const isEuropeanMatch =
          gameState.europeanCup &&
          (gameState.europeanCup.groups?.some((g) =>
            g.matches.some((em) => em.id === m.id),
          ) ||
            gameState.europeanCup.knockoutMatches?.some(
              (em) => em.id === m.id,
            ));

        // Multipliers
        let importanceMultiplier = 1.0;
        if (isDerby) importanceMultiplier = 2.0; // Derbies count double!
        if (isEuropeanMatch) importanceMultiplier = 1.5; // European glory matters

        if (won) {
          // Win = Board is happy
          if (repDiff > 500)
            change = 8; // Beat much stronger team = +8 (was +6)
          else if (repDiff > 0)
            change = 6; // Beat stronger team = +6 (was +4)
          else change = 4; // Beat weaker/equal = +4 (was +2)

          // Dominant win bonus
          if (goalsFor - goalsAgainst >= 3) change += 2;
        } else if (drew) {
          // Draw
          if (repDiff > 500)
            change = 1; // Draw against much stronger = +1
          else if (repDiff < -500)
            change = -2; // Draw against much weaker = -2
          else change = -1; // Normal draw = -1
        } else {
          // Loss = Board is unhappy
          if (repDiff < -500)
            change = -5; // Lost to much weaker = -5 (was -8)
          else if (repDiff < 0)
            change = -4; // Lost to weaker = -4 (was -5)
          else change = -2; // Lost to stronger/equal = -2 (was -3)

          // Heavy loss penalty
          if (goalsAgainst - goalsFor >= 3) change -= 1; // (was -2)
        }

        // Apply Multiplier
        change = Math.round(change * importanceMultiplier);
        if (change > 0) {
          change = Math.round(change * managerEffects.boardConfidenceGainMultiplier);
        } else if (change < 0) {
          change = Math.round(change * managerEffects.boardConfidenceLossMultiplier);
        }

        // Consecutive losses streak check
        const recentLosses = (team.recentForm || [])
          .slice(-3)
          .filter((r) => r === "L").length;
        if (recentLosses >= 3) change -= 2; // Extra -2 for 3+ consecutive losses (was -3)

        // BUG FIX: Handle 0 correctly (don't fallback to 70 if it's 0)
        // If it's undefined, start at 70. If it's valid (even 0), usage it.
        const currentConfidence =
          team.boardConfidence !== undefined
            ? team.boardConfidence
            : 70 + managerEffects.boardConfidenceStartBonus;
        const newConfidence = Math.max(
          1,
          Math.min(100, currentConfidence + change),
        );

        team.boardConfidence = newConfidence;

        // FIRING LOGIC
        // STRICT CHECK: IF CONFIDENCE DROPS BELOW 1, YOU ARE FIRED immediately
        if (newConfidence <= 1) {
          Object.assign(gameState, transitionManagerToUnemployed(gameState, team.id));
          return;
        }

        if (newConfidence <= 5) {
          console.warn(
            `[WARNING] ${team.name} manager in danger zone! Confidence: ${newConfidence}%`,
          );
        }

        // Record history
        if (change !== 0) {
          const resultText = won
            ? "Galibiyet"
            : drew
              ? "Beraberlik"
              : "Mağlubiyet";
          const score = `${goalsFor}-${goalsAgainst}`;
          let reason = `${opponent.name} ${resultText} (${score})`;

          if (isDerby) reason += " 🔥 (Derbi)";
          if (isEuropeanMatch) reason += " 🇪🇺 (Avrupa)";

          const history = team.confidenceHistory || [];
          history.push({
            week: gameState.currentWeek,
            change,
            reason,
            newValue: newConfidence,
          });
          // Keep only last 20 entries
          team.confidenceHistory = history.slice(-20);
        }

        team.boardConfidence = newConfidence;
      };

      updateBoardConfidence(
        home,
        away,
        hScore > aScore,
        hScore === aScore,
        hScore,
        aScore,
      );
      updateBoardConfidence(
        away,
        home,
        aScore > hScore,
        hScore === aScore,
        aScore,
        hScore,
      );

      if (home.id === gameState.userTeamId || away.id === gameState.userTeamId) {
        const userIsHome = home.id === gameState.userTeamId;
        const managerTeam = userIsHome ? home : away;
        const opponentTeam = userIsHome ? away : home;
        const rivals = DERBY_RIVALS[managerTeam.name] || [];

        gameState = applyManagerProfileMatchProgression(gameState, {
          teamId: gameState.userTeamId,
          opponent: opponentTeam,
          goalsFor: userIsHome ? hScore : aScore,
          goalsAgainst: userIsHome ? aScore : hScore,
          isDerby: rivals.includes(opponentTeam.name),
          isCupMatch: false,
          isEuropeanMatch,
          isHome: userIsHome,
          engineUsed: getEngineChoice(),
          isSimulated: true, // weekly sim — achievements skipped, only XP/rep
        });
      }
    }
  });
  // SIMULATE GLOBAL CUP MATCHES FOR THIS WEEK (If any)
  if (gameState.europeanCup && gameState.europeanCup.isActive) {
    const { updatedCup, updatedTeams } = simulateAIGlobalCupMatches(
      gameState.europeanCup,
      gameState.teams,
      gameState.players,
      gameState.userTeamId,
      gameState.currentWeek,
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
      0.4, // EUROPA LEAGUE MULTIPLIER (40% of CL Money)
    );
    gameState.europaLeague = updatedCup;
    gameState.teams = updatedTeams;
  }

  return { ...gameState };
};

export const handlePlayerInteraction = (
  player: Player,
  type: "PRAISE" | "CRITICIZE" | "MOTIVATE",
  intensity: "LOW" | "HIGH",
): { success: boolean; message: string; moraleChange: number } => {
  let success = false;
  let change = 0;
  const isProfessional = (player.attributes.leadership || 0) > 75;
  const isAmbitious = (player.attributes.aggression || 0) > 75;
  if (type === "PRAISE") {
    if (player.form > 7 || player.morale < 60) {
      success = true;
      change = intensity === "HIGH" ? 10 : 5;
    } else {
      if (intensity === "HIGH" && isProfessional) {
        success = false;
        change = -2;
      } else {
        success = true;
        change = 3;
      }
    }
  } else if (type === "CRITICIZE") {
    if (player.form < 6) {
      if (isAmbitious || isProfessional) {
        success = true;
        change = 5;
      } else {
        success = false;
        change = -10;
      }
    } else {
      success = false;
      change = -15;
    }
  } else if (type === "MOTIVATE") {
    if (player.morale < 50) {
      success = true;
      change = 15;
    } else {
      success = true;
      change = 2;
    }
  }
  return {
    success,
    message: success
      ? "The player responded positively."
      : "The player seemed annoyed.",
    moraleChange: change,
  };
};

export const processWeeklyEvents = (gameState: GameState, t: any, aiTransferActivity: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL') => {
  const hydratedState = ensureGameStateManagerProfile(gameState);
  const teamsById = new Map(gameState.teams.map((team) => [team.id, team]));
  const playersByTeam = new Map<string, Player[]>();
  gameState.players.forEach((player) => {
    if (!playersByTeam.has(player.teamId)) playersByTeam.set(player.teamId, []);
    playersByTeam.get(player.teamId)!.push(player);
  });

  let updatedManagerProfile = hydratedState.managerProfile;
  const managerSalary = hydratedState.managerSalary || 0;
  const weeklyStaffCost = getManagerPersonalStaffWeeklyCost(updatedManagerProfile);
  if (updatedManagerProfile && !hydratedState.isUnemployed && managerSalary > 0) {
    updatedManagerProfile = {
      ...updatedManagerProfile,
      personalBalance: updatedManagerProfile.personalBalance + managerSalary,
      lifetimeEarnings: updatedManagerProfile.lifetimeEarnings + managerSalary,
    };
  }
  if (updatedManagerProfile && !hydratedState.isUnemployed && weeklyStaffCost > 0) {
    const affordableCost = Math.min(updatedManagerProfile.personalBalance, weeklyStaffCost);
    updatedManagerProfile = {
      ...updatedManagerProfile,
      personalBalance: Math.max(0, updatedManagerProfile.personalBalance - affordableCost),
      lifetimeSpent: (updatedManagerProfile.lifetimeSpent || 0) + affordableCost,
    };
  }
  updatedManagerProfile = syncManagerObjectivesForState(
    { ...hydratedState, teams: gameState.teams },
    updatedManagerProfile,
  );

  const leagueTables = new Map<string, Team[]>();
  gameState.teams.forEach((team) => {
    const leagueId = team.leagueId || "tr";
    if (!leagueTables.has(leagueId)) leagueTables.set(leagueId, []);
    leagueTables.get(leagueId)!.push(team);
  });
  leagueTables.forEach((teams) => {
    teams.sort((a, b) => b.stats.points - a.stats.points);
  });

  const leaguePositionByTeamId = new Map<string, number>();
  leagueTables.forEach((teams) => {
    teams.forEach((team, index) => {
      leaguePositionByTeamId.set(team.id, index + 1);
    });
  });

  const remainingMatchTeams = new Set<string>();
  gameState.matches.forEach((match) => {
    if (!match.isPlayed) {
      remainingMatchTeams.add(match.homeTeamId);
      remainingMatchTeams.add(match.awayTeamId);
    }
  });
  const markCupTeamsWithMatches = (competition: any) => {
    if (!competition) return;
    competition.groups?.forEach((group: any) => {
      group.matches?.forEach((match: any) => {
        if (!match.isPlayed) {
          remainingMatchTeams.add(match.homeTeamId);
          remainingMatchTeams.add(match.awayTeamId);
        }
      });
    });
    competition.knockoutMatches?.forEach((match: any) => {
      if (!match.isPlayed) {
        remainingMatchTeams.add(match.homeTeamId);
        remainingMatchTeams.add(match.awayTeamId);
      }
    });
  };
  markCupTeamsWithMatches(gameState.europeanCup as any);
  markCupTeamsWithMatches(gameState.europaLeague as any);
  markCupTeamsWithMatches((gameState as any).conferenceLeague);

  const leagueMultiplierCache = new Map<string, number>();
  const coefficientMultiplierCache = new Map<string, number>();
  const getCachedLeagueMultiplier = (leagueId?: string) => {
    const key = leagueId || "tr";
    if (!leagueMultiplierCache.has(key)) {
      leagueMultiplierCache.set(key, getLeagueMultiplier(key));
    }
    return leagueMultiplierCache.get(key)!;
  };
  const getCachedCoefficientMultiplier = (leagueId?: string) => {
    const key = leagueId || "default";
    if (!coefficientMultiplierCache.has(key)) {
      coefficientMultiplierCache.set(key, getCoefficientMultiplier(key));
    }
    return coefficientMultiplierCache.get(key)!;
  };

  // === STADIUM CAPACITY MIGRATION (v2: 120k max system) ===
  // Old formula: 5000 + (level-1)*6000 → level 10 = 59k
  // New formula: 7500 + (level-1)*12500 → level 10 = 120k
  // If a team's capacity is below the new formula minimum, recalculate it
  gameState.teams.forEach((team) => {
    const level = team.facilities?.stadiumLevel || 1;
    const expectedMinCapacity = 7500 + (level - 1) * 12500;
    if ((team.facilities?.stadiumCapacity || 0) < expectedMinCapacity * 0.75) {
      // Old formula detected — migrate to new formula
      team.facilities.stadiumCapacity = expectedMinCapacity;
    }
    // Also cap facility/staff levels that exceed new maximums
    if (team.facilities?.trainingLevel > 8) team.facilities.trainingLevel = 8;
    if (team.facilities?.academyLevel > 8) team.facilities.academyLevel = 8;
    if (team.staff?.headCoachLevel > 8) team.staff.headCoachLevel = 8;
    if (team.staff?.scoutLevel > 8) team.staff.scoutLevel = 8;
    if (team.staff?.physioLevel > 8) team.staff.physioLevel = 8;
  });

  const userTeam = gameState.teams.find((t) => t.id === gameState.userTeamId);
  const intensity = userTeam?.trainingIntensity || "NORMAL";
  const physioLevel = userTeam?.staff?.physioLevel || 1;
  const headCoachLevel = userTeam?.staff?.headCoachLevel || 1;

  // === RESET playedThisWeek FLAG FOR ALL PLAYERS ===
  // This flag is set during match simulation when a player plays
  // Reset at start of week so it can be tracked for next week
  gameState.players.forEach((p) => {
    p.playedThisWeek = false;
  });

  // Enhanced physio effect on recovery
  const physioBonus = physioLevel * 3; // Reduced from 4 to 3 per level
  let recoveryBase = 25 + physioBonus; // NORMAL: 25 (was 30) - slower recovery
  if (intensity === "LIGHT") recoveryBase = 40 + physioBonus; // LIGHT: 40 (was 45)
  if (intensity === "HEAVY") recoveryBase = 5 + physioBonus; // HEAVY: 5 (was 15) - BİG DISADVANTAGE!

  // Injury risk calculation based on intensity and physio
  const baseInjuryRisk =
    intensity === "HEAVY" ? 0.08 : intensity === "NORMAL" ? 0.02 : 0.005;
  const injuryRiskReduction = physioLevel * 0.008; // Each physio level reduces injury risk by 0.8%
  const finalInjuryRisk = Math.max(0.005, baseInjuryRisk - injuryRiskReduction);

  const newMessages: Message[] = [];
  const report: string[] = [];

  // Localized training intensity name
  const intensityLabel =
    intensity === "LIGHT"
      ? t.intensityLight
      : intensity === "HEAVY"
        ? t.intensityHeavy
        : t.intensityNormal;
  if (userTeam) {
    report.push(
      t.trainingIntensityReport
        .replace("{intensity}", intensityLabel)
        .replace("{recovery}", recoveryBase.toString()),
    );
  }

  // ========== SMOOTH MARKET INFLATION (WEEKLY) ==========
  // Target multiplier = sqrt(totalBudgets / baseline) — square root dampens runaway inflation.
  // Linear ratio caused 2.92x after 4 seasons; sqrt gives ~1.71x at same point.
  // Current multiplier moves at most 5% toward target each week → gradual drift.
  const INITIAL_TOTAL_BUDGETS = 28_000_000_000; // ~800 teams × €35M avg starting budget
  const totalLeagueBudgets = gameState.teams.reduce((sum, t) => sum + Math.max(0, t.budget), 0);
  const targetInflation = Math.min(4.0, Math.max(0.5, Math.sqrt(totalLeagueBudgets / INITIAL_TOTAL_BUDGETS)));
  const prevInflation = gameState.marketInflationMultiplier ?? targetInflation;
  // Move at most 5% of the gap per week (smooth drift)
  const weeklyInflationMultiplier = prevInflation + (targetInflation - prevInflation) * 0.05;

  // UPDATE ALL PLAYERS GLOBALLY
  let updatedPlayers = gameState.players.map((p) => {
    const isUserPlayer = p.teamId === gameState.userTeamId;
    const playerTeam = teamsById.get(p.teamId);

    let rec = recoveryBase;
    if (!isUserPlayer) {
      // AI Condition Recovery now depends on facilities (Adil Oyun)
      // Base 25 + (Level * 1.5). Level 1 = 26.5, Level 10 = 40, Level 20 = 55.
      const aiTrainingLevel = playerTeam?.facilities?.trainingLevel || 1;
      rec = 25 + aiTrainingLevel * 1.5;
    }
    let newMorale = p.morale;
    let newWeeksInjured = Math.max(0, p.weeksInjured - 1);

    // INJURY SYSTEM for user players during training
    if (isUserPlayer && p.weeksInjured === 0) {
      const injuryProneness = p.hiddenAttributes?.injuryProneness || 10;
      const personalRisk =
        finalInjuryRisk * (1 + (injuryProneness - 10) * 0.05);

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
        newWeeksInjured = Math.max(
          1,
          newWeeksInjured - Math.floor(physioLevel / 3),
        );

        newMessages.push({
          id: uuid(),
          week: gameState.currentWeek,
          type: MessageType.INJURY,
          subject: t.injurySubject.replace("{name}", p.lastName),
          body: t.injuryBody
            .replace("{name}", `${p.firstName} ${p.lastName}`)
            .replace("{weeks}", newWeeksInjured.toString()),
          isRead: false,
          date: new Date().toISOString(),
        });
      }
    }

    if (isUserPlayer) {
      let moraleReason = "";

      // === MORAL FIX: Check if player PLAYED this week (not just lineup status) ===
      // A player who started and got subbed out should get CREDIT for playing!
      if (p.playedThisWeek) {
        // Player played this week (started or came on as sub) - morale boost!
        newMorale = Math.min(100, newMorale + 2);
        moraleReason = t.moralePlayed;
      } else if (p.lineup === "STARTING") {
        // Lineup says starting but didn't play? (Edge case - shouldn't happen normally)
        newMorale = Math.min(100, newMorale + 2);
        moraleReason = t.moraleStarting;
      } else if (p.lineup === "BENCH") {
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
              body: t.unhappyPlayerDesc.replace("{name}", p.lastName),
              isRead: false,
              date: new Date().toISOString(),
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
          reason: moraleReason,
        });
        // Keep only last 10 entries
        if (p.moraleHistory.length > 10) {
          p.moraleHistory = p.moraleHistory.slice(-10);
        }
      }
    }

    // DEVELOPMENT LOGIC (Global) with Training Focus
    let newOverall = Math.min(MAX_PLAYER_OVERALL, p.overall);
    let newAttributes = { ...p.attributes };
    const cappedPotential = Math.max(newOverall, Math.min(MAX_PLAYER_POTENTIAL, p.potential));

    // Young players develop based on exact age brackets (User Request)
    if (p.age < 28 && newOverall < cappedPotential) {
      let developmentChance = 0.01; // Base

      // 1. Age Factor (Exact User Math)
      if (p.age < 21)
        developmentChance = 0.035; // 3.5% (was 5%)
      else if (p.age < 24)
        developmentChance = 0.02; // 2% (was 3%)
      else if (p.age < 28) developmentChance = 0.005; // 0.5% (was 1%)

      // LATE-GAME BALANCE: Exponential difficulty for high overall (Hard cap for 90+)
      if (p.overall >= 90) developmentChance *= 0.01; // 99% reduction (almost impossible to cross naturally)
      else if (p.overall >= 87) developmentChance *= 0.1;  // 90% reduction
      else if (p.overall >= 84) developmentChance *= 0.3;  // 70% reduction
      else if (p.overall >= 80) developmentChance *= 0.6;  // 40% reduction

      let trainingBoost: (keyof typeof newAttributes)[] = [];

      if (isUserPlayer && userTeam) {
        const headCoachLevel = userTeam.staff?.headCoachLevel || 1;
        const trainingLevel = userTeam.facilities?.trainingLevel || 1;

        // 2. Facility Effect: Max level is now 10 (formerly 25)
        // Adjusting multipliers so max facility still gives a decent but balanced boost
        const facilityBonus = trainingLevel * 0.003 + headCoachLevel * 0.005;
        developmentChance += facilityBonus;

        // Training Focus affects which attributes improve
        const focus = userTeam.trainingFocus || "BALANCED";
        if (focus === "ATTACK") {
          trainingBoost = ["finishing", "dribbling", "positioning"];
        } else if (focus === "DEFENSE") {
          trainingBoost = ["tackling", "positioning", "strength"];
        } else if (focus === "PHYSICAL") {
          trainingBoost = ["speed", "stamina", "strength"];
        } else if (focus === "TECHNICAL") {
          trainingBoost = ["passing", "dribbling", "vision"];
        } else if (focus === "POSITION_BASED") {
          // Each player trains based on their position
          if (p.position === "FWD") {
            trainingBoost = ["finishing", "dribbling", "speed"];
          } else if (p.position === "MID") {
            trainingBoost = ["passing", "vision", "stamina"];
          } else if (p.position === "DEF") {
            trainingBoost = ["tackling", "positioning", "strength"];
          } else if (p.position === "GK") {
            trainingBoost = ["goalkeeping", "composure", "strength"];
          }
        }
      } else if (playerTeam) {
        const trainingLevel = playerTeam.facilities?.trainingLevel || 1;
        // 3. Facility Effect for AI (Max level 10)
        const facilityBonus = trainingLevel * 0.004;
        developmentChance += facilityBonus;
      }

      if (Math.random() < developmentChance) {
        newOverall = Math.min(MAX_PLAYER_OVERALL, cappedPotential, p.overall + 1);

        // Apply focused attribute boost for user players
        let boostedAttr = "";
        if (isUserPlayer && trainingBoost.length > 0 && Math.random() < 0.5) {
          const attrToBoost =
            trainingBoost[Math.floor(Math.random() * trainingBoost.length)];
          newAttributes[attrToBoost] = Math.min(
            99,
            (newAttributes[attrToBoost] || 50) + 1,
          );
          // Localized attribute names
          const attrNames: Record<string, string> = {
            finishing: t.attrFinishing,
            dribbling: t.attrDribbling,
            positioning: t.attrPositioning,
            tackling: t.attrTackling,
            strength: t.attrStrength,
            speed: t.attrSpeed,
            stamina: t.attrStamina,
            passing: t.attrPassing,
            vision: t.attrVision,
            goalkeeping: t.attrGoalkeeping,
            composure: t.attrComposure,
            leadership: t.attrLeadership,
            decisions: t.attrDecisions,
          };
          boostedAttr = attrNames[attrToBoost] || attrToBoost;
        }

        if (isUserPlayer && newOverall > p.overall) {
          const focusLabel =
            userTeam?.trainingFocus !== "BALANCED"
              ? ` (${userTeam?.trainingFocus})`
              : "";
          if (boostedAttr) {
            report.push(
              `⬆️ ${p.firstName} ${p.lastName}: ${boostedAttr} +1${focusLabel}`,
            );
          } else {
            report.push(
              `⬆️ ${p.firstName} ${p.lastName}: ${t.reportGeneralDev}${focusLabel}`,
            );
          }
        }
      }
    }

    // DECLINE LOGIC (Global) - Older players might lose stats
    if (p.age > 32) {
      if (Math.random() < 0.05) {
        // 5% chance per week
        newOverall = Math.max(40, p.overall - 1);
      }
    }

    return {
      ...p,
      attributes: newAttributes,
      overall: newOverall,
      potential: cappedPotential,
      // VALUE: Two-path update to prevent first-week jump.
      // OVR changed → full recalculation with current multiplier.
      // OVR same    → only apply the inflation delta (ratio adjustment),
      //               preserving whatever value was set at game-init or season-end.
      value: newOverall !== p.overall
        ? Math.floor(
            Math.pow(1.18, newOverall - 60) *
            100000 *
            (1 + (cappedPotential - newOverall) / 25) *
            (1 + Math.max(0, 25 - p.age) * 0.03) *
            (1 - Math.max(0, p.age - 26) * 0.025) *
            weeklyInflationMultiplier
          )
        : Math.floor(p.value * (weeklyInflationMultiplier / prevInflation)),
      condition: Math.min(100, p.condition + rec),
      weeksInjured: newWeeksInjured,
      matchSuspension: Math.max(
        0,
        (p.matchSuspension || 0) > 0 ? p.matchSuspension - 1 : 0,
      ), // Decrement suspension
      morale: newMorale,
    };
  });

  const buildPlayersByTeamIndex = (players: Player[]) => {
    const index = new Map<string, Player[]>();
    players.forEach((player) => {
      const bucket = index.get(player.teamId);
      if (bucket) bucket.push(player);
      else index.set(player.teamId, [player]);
    });
    return index;
  };

  let currentPlayersByTeam = buildPlayersByTeamIndex(updatedPlayers);
  const getIndexedTeamPlayers = (teamId: string) =>
    currentPlayersByTeam.get(teamId) || [];
  const trackPlayerTeamChange = (player: Player, nextTeamId: string) => {
    const previousTeamId = player.teamId;
    if (previousTeamId === nextTeamId) return;

    const previousBucket = currentPlayersByTeam.get(previousTeamId);
    if (previousBucket) {
      const playerIndex = previousBucket.findIndex(
        (candidate) => candidate.id === player.id,
      );
      if (playerIndex >= 0) previousBucket.splice(playerIndex, 1);
    }

    player.teamId = nextTeamId;
    if (!currentPlayersByTeam.has(nextTeamId)) {
      currentPlayersByTeam.set(nextTeamId, []);
    }
    currentPlayersByTeam.get(nextTeamId)!.push(player);
  };
  const adjustTeamBudget = (teamId: string, delta: number) => {
    const targetTeam = updatedTeams.find((team) => team.id === teamId);
    if (targetTeam) targetTeam.budget += delta;
  };

  // Finance logic from previous version incorporated for localization
  if (userTeam) {
    const teamPlayers = playersByTeam.get(userTeam.id) || [];
    const totalSalaries = teamPlayers.reduce(
      (sum, p) => sum + (p.salary || 0),
      0,
    );
    const weeklyWages = totalSalaries / 52;

    userTeam.wages = Math.round(weeklyWages); // Update team stat

    // League Multiplier (includes European success bonus!)
    const leagueMult = getCachedLeagueMultiplier(userTeam.leagueId || "tr");

    // BALANCED: Facility costs scale with level exponentially
    // Using 2.0 exponent since max level was reduced to 10 (costs reduced ~40% for sustainability)
    const maintenanceDiscount = ["tr", "fr"].includes(userTeam.leagueId)
      ? 0.7
      : 1.0; // 30% discount for smaller leagues
    const stadiumMaint =
      Math.pow(userTeam.facilities.stadiumLevel, 2.0) *
      1200 *
      maintenanceDiscount;
    const trainingMaint =
      Math.pow(userTeam.facilities.trainingLevel, 2.0) *
      900 *
      maintenanceDiscount;
    const academyMaint =
      Math.pow(userTeam.facilities.academyLevel, 2.0) *
      720 *
      maintenanceDiscount;
    const maintenance =
      (stadiumMaint + trainingMaint + academyMaint) * (0.8 + leagueMult * 0.2);

    // Staff costs also scale with level (exponent 2.0 for max level 10)
    const staffCosts =
      (Math.pow(userTeam.staff.headCoachLevel, 2.0) * 3200 +
        Math.pow(userTeam.staff.scoutLevel, 2.0) * 1900 +
        Math.pow(userTeam.staff.physioLevel, 2.0) * 2600) *
      (0.8 + leagueMult * 0.2);

    // Find current week's match to check if it's a derby
    const currentMatch = gameState.matches.find(
      (m) =>
        m.week === gameState.currentWeek &&
        (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id),
    );
    const isHomeWeek = currentMatch?.homeTeamId === userTeam.id;

    // Check if this is a derby match (100% attendance!)
    let isDerby = false;
    let opponentReputation = 0;
    if (currentMatch) {
      const opponentId = isHomeWeek
        ? currentMatch.awayTeamId
        : currentMatch.homeTeamId;
      const opponent = gameState.teams.find((t) => t.id === opponentId);
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
    const baseTicketPrice =
      LEAGUE_TICKET_PRICES[userTeam.leagueId] ||
      LEAGUE_TICKET_PRICES["default"];
    const coeffMultiplier = getCachedCoefficientMultiplier(userTeam.leagueId);
    const leagueTicketPrice = Math.floor(baseTicketPrice * coeffMultiplier);

    // Get league-specific attendance rates
    const attendanceRates =
      LEAGUE_ATTENDANCE_RATES[userTeam.leagueId] ||
      LEAGUE_ATTENDANCE_RATES["default"];

    // Calculate base attendance from reputation
    const repFactor = Math.min(1, (userTeam.reputation - 5000) / 5000); // 0-1 scale
    let baseAttendance =
      attendanceRates.min +
      (attendanceRates.max - attendanceRates.min) * repFactor;
    const randomVariance = Math.random() * 0.1 - 0.05; // ±5% variance

    // ========== ATTENDANCE BONUSES ==========

    // 1. DERBY BONUS: 100% attendance for derbies!
    let attendanceBonus = 0;
    let bonusReason = "";

    if (isDerby) {
      attendanceBonus = 1.0 - baseAttendance; // Fill to 100%
      bonusReason = "derby";
    } else {
      // 2. BIG TEAM BONUS: When playing against a more reputable opponent
      // Example: Göztepe vs Beşiktaş - tribunes fill up!
      const reputationDiff = opponentReputation - userTeam.reputation;
      if (reputationDiff > 500) {
        // Lower threshold (was 1000)
        // Opponent is significantly more prestigious
        const bigTeamBonus = Math.min(0.4, reputationDiff / 5000); // Up to +40% (was +25%, divided by 10000)
        attendanceBonus = Math.max(attendanceBonus, bigTeamBonus);
        bonusReason = "big_team";
      }

      // 2b. TOP LEAGUE TEAM BONUS: Playing against league leaders
      if (currentMatch) {
        const opponentId = isHomeWeek
          ? currentMatch.awayTeamId
          : currentMatch.homeTeamId;
        const opponent = gameState.teams.find((t) => t.id === opponentId);
        if (opponent) {
          const leagueTeams = gameState.teams
            .filter((t) => t.leagueId === opponent.leagueId)
            .sort((a, b) => b.stats.points - a.stats.points);
          const opponentPos =
            leagueTeams.findIndex((t) => t.id === opponent.id) + 1;

          // League leader coming to town = +25% attendance
          if (opponentPos === 1) {
            attendanceBonus = Math.max(attendanceBonus, 0.25);
            if (!bonusReason) bonusReason = "league_leader";
          }
          // Top 3 opponent = +15% attendance
          else if (opponentPos <= 3) {
            attendanceBonus = Math.max(attendanceBonus, 0.15);
            if (!bonusReason) bonusReason = "top_team";
          }
        }
      }

      // 3. CHAMPIONSHIP RACE BONUS: Late season matches with tight standings
      if (gameState.currentWeek >= 28) {
        // Last 10 weeks
        const leagueTeams = gameState.teams
          .filter((t) => t.leagueId === userTeam.leagueId)
          .sort((a, b) => b.stats.points - a.stats.points);
        const userPos = leagueTeams.findIndex((t) => t.id === userTeam.id) + 1;
        const leadingTeam = leagueTeams[0];
        const pointsGap = leadingTeam
          ? leadingTeam.stats.points - userTeam.stats.points
          : 999;

        // Title race bonus: Top 3 with close gap
        if (userPos <= 3 && pointsGap <= 6) {
          attendanceBonus = Math.max(attendanceBonus, 0.2); // +20%
          bonusReason = "title_race";
        }
        // Relegation battle bonus
        else if (userPos >= leagueTeams.length - 3) {
          attendanceBonus = Math.max(attendanceBonus, 0.15); // +15%
          bonusReason = "survival_battle";
        }
      }

      // 4. SEASON FINALE BONUS: Last 3 weeks
      if (gameState.currentWeek >= 35) {
        attendanceBonus = Math.max(attendanceBonus, 0.15); // +15%
        if (!bonusReason) bonusReason = "season_finale";
      }
    }

    // Calculate final attendance (capped at 100%)
    const attendance = Math.min(
      1.0,
      baseAttendance + attendanceBonus + randomVariance,
    );

    // =====================================================
    // STADIUM CAPACITY FROM LEVEL - Same formula worldwide
    // Level 1 = 7,500 | Level 10 = 120,000
    // Each level = +12,500 seats
    // =====================================================
    const STADIUM_MIN = 7500;
    const STADIUM_CAPACITY_PER_LEVEL = 12500;
    const effectiveCapacity =
      STADIUM_MIN +
      (userTeam.facilities.stadiumLevel - 1) * STADIUM_CAPACITY_PER_LEVEL;

    // Ticket income: Only when home, with realistic prices and attendance
    // +30% INCOME BOOST
    const ticketIncome = isHomeWeek
      ? Math.floor(effectiveCapacity * leagueTicketPrice * attendance * 1.3)
      : 0;

    // Merchandise: Scaled down significantly, based on reputation (+30% BOOST)
    const starPlayerBonus =
      teamPlayers.filter((p) => p.overall > 85).length * 5000;
    const merchandise = Math.floor(
      (userTeam.reputation * 2 + starPlayerBonus) *
      (0.7 + leagueMult * 0.3) *
      1.3,
    );

    // TV Rights - REALISTIC: Based on real data
    // Turkey: ~€200k/week for big clubs, England: ~€2M/week for big clubs
    const leaguePosition = leaguePositionByTeamId.get(userTeam.id) || 1;

    // Base TV rights by league (weekly) - BALANCED for fair progression
    // DYNAMIC: TV rights also scale with league coefficient (global viewership follows success)
    // Each league has a realistic base reflecting current market size.
    // The coeffMultiplier then dynamically scales this up/down based on European/global performance.
    const baseTvRightsValues: Record<string, number> = {
      // TIER 1: Elite European markets
      en: 850000,  // England: €850k — world's richest broadcast deal
      es: 600000,  // Spain: €600k
      de: 550000,  // Germany: €550k
      it: 500000,  // Italy: €500k
      fr: 400000,  // France: €400k
      // TIER 2: Strong European / traditional powers
      pt: 350000,  // Portugal: €350k — Porto/Benfica history
      nl: 350000,  // Netherlands: €350k — Ajax heritage
      ru: 320000,  // Russia: €320k
      tr: 320000,  // Turkey: €320k
      sco: 250000, // Scotland: €250k — Celtic/Rangers prestige
      be: 240000,  // Belgium: €240k
      at: 180000,  // Austria: €180k
      gr: 180000,  // Greece: €180k
      ch: 200000,  // Switzerland: €200k
      pl: 200000,  // Poland: €200k
      cz: 160000,  // Czech Republic: €160k
      ro: 140000,  // Romania: €140k
      hr: 150000,  // Croatia: €150k
      rs: 140000,  // Serbia: €140k
      // TIER 3: Global markets
      br: 200000,  // Brazil: €200k
      ar: 150000,  // Argentina: €150k
      mx: 200000,  // Mexico: €200k
      sa: 220000,  // Saudi Arabia: €220k — recent investment boom
      us: 200000,  // USA/MLS: €200k
      jp: 180000,  // Japan: €180k
      kr: 150000,  // South Korea: €150k
      cn: 200000,  // China: €200k — large domestic market
      au: 120000,  // Australia: €120k
      // TIER 4: Developing markets
      co: 100000,  // Colombia: €100k
      cl: 100000,  // Chile: €100k
      uy: 80000,   // Uruguay: €80k
      ec: 80000,   // Ecuador: €80k
      py: 70000,   // Paraguay: €70k
      cr: 70000,   // Costa Rica: €70k
      eg: 70000,   // Egypt: €70k
      ma: 80000,   // Morocco: €80k
      za: 80000,   // South Africa: €80k
      ng: 60000,   // Nigeria: €60k
      dz: 60000,   // Algeria: €60k
      tn: 65000,   // Tunisia: €65k
      gh: 55000,   // Ghana: €55k
      sn: 55000,   // Senegal: €55k
      ci: 55000,   // Ivory Coast: €55k
      ke: 50000,   // Kenya: €50k
      car: 50000,  // Caribbean: €50k
      in: 90000,   // India: €90k — large population potential
      id: 80000,   // Indonesia: €80k
      my: 70000,   // Malaysia: €70k
      default: 80000,
    };
    const tvBaseValue =
      baseTvRightsValues[userTeam.leagueId] || baseTvRightsValues["default"];
    // Apply coefficient multiplier to TV rights (more successful league = more global viewers)
    const tvBase = Math.floor(tvBaseValue * coeffMultiplier);

    // Position bonus: Top teams get more TV money (merit-based distribution) (+30% BOOST)
    const positionMultiplier = Math.max(0.5, 1.5 - (leaguePosition - 1) * 0.05); // 1.5x for 1st, down to 0.5x for last
    const repMultiplier = 0.8 + ((userTeam.reputation - 5000) / 10000) * 0.4; // 0.8x to 1.2x based on rep
    const tvRights = Math.floor(
      tvBase * positionMultiplier * repMultiplier * 1.3,
    );

    // Sponsor income (or default smaller amount if no sponsor) (+30% BOOST)
    // DYNAMIC: Scale sponsor income with coefficient multiplier (successful leagues = better deals)
    const sponsorIncome = userTeam.sponsor
      ? Math.floor(userTeam.sponsor.weeklyIncome * 1.3 * coeffMultiplier)
      : Math.floor(50000 * Math.sqrt(leagueMult) * 1.3 * coeffMultiplier);

    // GLOBAL PRESTIGE BONUS: Top clubs in economically weak leagues earn extra
    // from global TV deals and merchandise (think Fenerbahçe, Boca Juniors, Santos).
    // Only kicks in for clubs with reputation > 7000 in low ticket-price leagues.
    const smallLeagues = ["tr", "ar", "br", "mx", "jp", "kr", "sa", "co", "cl", "uy", "ma", "za", "eg", "car", "au"];
    let prestigeBonus = 0;
    if (smallLeagues.includes(userTeam.leagueId) && userTeam.reputation > 7000) {
      // Scales from €0 at rep 7000 up to ~€120K/week at rep 10000
      prestigeBonus = Math.floor(((userTeam.reputation - 7000) / 3000) * 120000);
    }

    // --- EMPTY WEEKS / SEASON END FINANCIAL PROTECTION ---
    // If a team has no more matches in the entire season, stop draining their budget
    // This prevents clubs in smaller leagues from going bankrupt during empty weeks
    const hasMatchesLeft = remainingMatchTeams.has(userTeam.id);
    let finalWeeklyWages = weeklyWages;
    let finalMaintenance = maintenance;
    let finalStaffCosts = staffCosts;

    if (!hasMatchesLeft) {
      // Off-season mode: Wages are suspended or covered by season-end sponsors, maintenance is zeroed,
      // staff takes a break. We do not deduct weekly costs to prevent arbitrary ruin.
      finalWeeklyWages = 0;
      finalMaintenance = 0;
      finalStaffCosts = 0;
    }

    const weeklyIncome = ticketIncome + merchandise + tvRights + sponsorIncome + prestigeBonus;
    const weeklyExpenses = finalWeeklyWages + finalMaintenance + finalStaffCosts;

    userTeam.budget += weeklyIncome - weeklyExpenses;

    // Preserve existing history across weeks
    const existingUserFinancialHistory = userTeam.financials?.history
      ? [...userTeam.financials.history]
      : [];
    const existingUserSeasonTotals = userTeam.financials?.seasonTotals
      ? { ...userTeam.financials.seasonTotals }
      : undefined;
    userTeam.financials = {
      lastWeekIncome: {
        tickets: ticketIncome,
        sponsor: sponsorIncome,
        merchandise,
        tvRights: tvRights + prestigeBonus, // prestige bonus shown as global TV income
        transfers: 0,
        winBonus: 0,
      },
      lastWeekExpenses: {
        wages: finalWeeklyWages,
        maintenance: finalMaintenance,
        academy: academyMaint,
        transfers: 0,
      },
      seasonTotals: existingUserSeasonTotals,
      history: existingUserFinancialHistory,
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
        tvRights: tvRights + prestigeBonus, // prestige bonus shown as global TV income
        transfers: 0,
        winBonus: 0,
        total: weeklyIncome,
      },
      expenses: {
        wages: finalWeeklyWages,
        maintenance: finalMaintenance,
        academy: academyMaint,
        transfers: 0,
        total: weeklyExpenses,
      },
      balance,
      budgetBefore,
      budgetAfter: userTeam.budget,
    };

    if (!userTeam.financials.history) userTeam.financials.history = [];
    // Upsert: if a cup prize created a record for this week, merge into it.
    const existingIdx = userTeam.financials.history.findIndex(
      (r) =>
        r.week === gameState.currentWeek &&
        r.season === gameState.currentSeason,
    );
    if (existingIdx >= 0) {
      const existing = userTeam.financials.history[existingIdx] as any;
      existing.income.tickets =
        (existing.income.tickets || 0) + financialRecord.income.tickets;
      existing.income.sponsor =
        (existing.income.sponsor || 0) + financialRecord.income.sponsor;
      existing.income.merchandise =
        (existing.income.merchandise || 0) + financialRecord.income.merchandise;
      existing.income.tvRights =
        (existing.income.tvRights || 0) + financialRecord.income.tvRights;
      existing.income.transfers =
        (existing.income.transfers || 0) + financialRecord.income.transfers;
      existing.income.winBonus =
        (existing.income.winBonus || 0) + financialRecord.income.winBonus;

      existing.expenses.wages =
        (existing.expenses.wages || 0) + financialRecord.expenses.wages;
      existing.expenses.maintenance =
        (existing.expenses.maintenance || 0) +
        financialRecord.expenses.maintenance;
      existing.expenses.academy =
        (existing.expenses.academy || 0) + financialRecord.expenses.academy;
      existing.expenses.transfers =
        (existing.expenses.transfers || 0) + financialRecord.expenses.transfers;

      const incomeTotal =
        (existing.income.tickets || 0) +
        (existing.income.sponsor || 0) +
        (existing.income.merchandise || 0) +
        (existing.income.tvRights || 0) +
        (existing.income.transfers || 0) +
        (existing.income.winBonus || 0) +
        (existing.income.seasonEnd || 0) +
        (existing.income.cupPrize || 0);
      const expenseTotal =
        (existing.expenses.wages || 0) +
        (existing.expenses.maintenance || 0) +
        (existing.expenses.academy || 0) +
        (existing.expenses.transfers || 0) +
        (existing.expenses.facilityUpgrade || 0) +
        (existing.expenses.staffUpgrade || 0);
      existing.income.total = incomeTotal;
      existing.expenses.total = expenseTotal;
      existing.balance = incomeTotal - expenseTotal;
      existing.budgetBefore = existing.budgetBefore ?? budgetBefore;
      existing.budgetAfter = userTeam.budget;
    } else {
      userTeam.financials.history.push(financialRecord);
    }
    // Son 10 kaydı tut
    if (userTeam.financials.history.length > 10) {
      userTeam.financials.history = userTeam.financials.history.slice(-10);
    }

    userTeam.financials.lastWeekIncome = {
      tickets: ticketIncome,
      sponsor: sponsorIncome,
      merchandise,
      tvRights: tvRights + prestigeBonus,
      transfers: 0,
      winBonus: 0,
    };
    userTeam.financials.lastWeekExpenses = {
      wages: finalWeeklyWages,
      maintenance: finalMaintenance,
      academy: academyMaint,
      transfers: 0,
    };

    newMessages.push({
      id: uuid(),
      week: gameState.currentWeek,
      type: MessageType.INFO,
      subject: t.financeReport,
      body: `${balance >= 0 ? t.financeReportProfit.replace("{amount}", balance.toLocaleString()) : t.financeReportLoss.replace("{amount}", Math.abs(balance).toLocaleString())} ${t.currentBalance.replace("{amount}", userTeam.budget.toLocaleString())}`,
      isRead: false,
      date: new Date().toISOString(),
    });

    // === STADIUM CONSTRUCTION PROGRESS ===
    if (
      userTeam.facilities.stadiumConstructionWeeks &&
      userTeam.facilities.stadiumConstructionWeeks > 0
    ) {
      userTeam.facilities.stadiumConstructionWeeks -= 1;

      if (userTeam.facilities.stadiumConstructionWeeks <= 0) {
        // CONSTRUCTION COMPLETE! (with max level guard)
        userTeam.facilities.stadiumConstructionWeeks = 0;
        if (userTeam.facilities.stadiumLevel < 10) {
          userTeam.facilities.stadiumLevel += 1;
          userTeam.facilities.stadiumCapacity += 12500;
        }

        newMessages.push({
          id: uuid(),
          week: gameState.currentWeek,
          type: MessageType.INFO,
          subject: "🏟️ Stadium Expansion Complete!",
          body: `The construction work is finished! Your stadium has been upgraded to Level ${userTeam.facilities.stadiumLevel}. Capacity increased by 8,000 seats.`,
          isRead: false,
          date: new Date().toISOString(),
        });
      }
    }

    // === TRAINING GROUND CONSTRUCTION PROGRESS ===
    if (
      userTeam.facilities.trainingConstructionWeeks &&
      userTeam.facilities.trainingConstructionWeeks > 0
    ) {
      userTeam.facilities.trainingConstructionWeeks -= 1;

      if (userTeam.facilities.trainingConstructionWeeks <= 0) {
        userTeam.facilities.trainingConstructionWeeks = 0;
        if (userTeam.facilities.trainingLevel < 8) {
          userTeam.facilities.trainingLevel += 1;
        }

        newMessages.push({
          id: uuid(),
          week: gameState.currentWeek,
          type: MessageType.INFO,
          subject: "🏋️ Training Ground Upgrade Complete!",
          body: `Construction finished! Your training facilities are now Level ${userTeam.facilities.trainingLevel}. Player development will improve.`,
          isRead: false,
          date: new Date().toISOString(),
        });
      }
    }

    // === YOUTH ACADEMY CONSTRUCTION PROGRESS ===
    if (
      userTeam.facilities.academyConstructionWeeks &&
      userTeam.facilities.academyConstructionWeeks > 0
    ) {
      userTeam.facilities.academyConstructionWeeks -= 1;

      if (userTeam.facilities.academyConstructionWeeks <= 0) {
        userTeam.facilities.academyConstructionWeeks = 0;
        if (userTeam.facilities.academyLevel < 8) {
          userTeam.facilities.academyLevel += 1;
        }

        newMessages.push({
          id: uuid(),
          week: gameState.currentWeek,
          type: MessageType.INFO,
          subject: "🎓 Youth Academy Upgrade Complete!",
          body: `Construction finished! Your youth academy is now Level ${userTeam.facilities.academyLevel}. Better youth prospects will be recruited.`,
          isRead: false,
          date: new Date().toISOString(),
        });
      }
    }
  }

  // STAFF EFFECT: scoutLevel affects youth candidate generation
  // NERF: Reduced rates - max ~6% per week instead of ~13.5%
  let updatedTeams = gameState.teams;
  if (userTeam) {
    const managerEffects = getManagerGameplayEffects(gameState.managerProfile);
    const scoutLevel = userTeam.staff?.scoutLevel || 1;
    const academyLevel = userTeam.facilities?.academyLevel || 1;
    // BALANCE: ~14% chance at max levels (approx 7-8 players per season)
    // Base 1% + 5% (Scout level 10) + 8% (Academy level 10) = ~14% max
    const youthChance =
      0.01 + scoutLevel * 0.005 + academyLevel * 0.008 + managerEffects.youthDiscoveryBonus;

    if (
      Math.random() < youthChance &&
      (userTeam.youthCandidates?.length || 0) < 5
    ) {
      // Generate a youth player
      const positions: Position[] = [
        Position.GK,
        Position.DEF,
        Position.DEF,
        Position.MID,
        Position.MID,
        Position.FWD,
      ];
      const pos = positions[Math.floor(Math.random() * positions.length)];

      // BALANCE: Overall scales with Academy (Tiered max 10)
      // Lvl 1:  40-55 (Avg 47) — raw youngster
      // Lvl 5:  47-62 (Avg 54) — decent prospect
      // Lvl 10: 55-70 (Avg 62) — reliable reserve with room to grow
      let baseOverall =
        40 + Math.floor(Math.random() * 15) + Math.floor(academyLevel * 1.5);

      // WONDERKID SYSTEM: Rare chance of exceptional talent from elite academies.
      // Academy 8: 6% chance — elite wonderkid (65-74 OVR, potential cap 93)
      // Academy 7: 4% chance — true wonderkid (62-70 OVR, potential cap 91)
      // Academy 5+: 7% chance — elevated prospect (58-66 OVR, potential cap 86)
      let wonderkidTier = 0; // 0=normal, 1=elevated, 2=wonderkid, 3=elite wonderkid
      if (academyLevel >= 8 && Math.random() < 0.06) {
        baseOverall = 65 + Math.floor(Math.random() * 10); // 65-74
        wonderkidTier = 3;
      } else if (academyLevel >= 7 && Math.random() < 0.04) {
        baseOverall = 62 + Math.floor(Math.random() * 9); // 62-70
        wonderkidTier = 2;
      } else if (academyLevel >= 5 && Math.random() < 0.07) {
        baseOverall = 58 + Math.floor(Math.random() * 9); // 58-66
        wonderkidTier = 1;
      }

      // Potential depends on Scout+Academy — max scout 8 + academy 8 = +11.2 bonus
      const potentialBonus =
        scoutLevel * 0.8 + academyLevel * 0.3 + managerEffects.youthPotentialBonus;
      const rawPotential =
        baseOverall + 8 + Math.floor(Math.random() * 12) + potentialBonus;

      // Potential cap per tier
      const potentialCap = wonderkidTier === 3 ? 93 : wonderkidTier === 2 ? 91 : wonderkidTier === 1 ? 86 : 82;
      let potential = Math.min(potentialCap, rawPotential);

      // Ensure potential isn't lower than overall
      potential = Math.max(potential, baseOverall);

      const pool = getYouthNationalityPool(userTeam.leagueId || gameState.leagueId || "en");
      const youthNationality = pool[Math.floor(Math.random() * pool.length)];

      const youthPlayer = generatePlayer(
        userTeam.id,
        pos,
        youthNationality,
        [16, 17],
        [potential, potential],
      );

      // === FIX: Academy players are CHEAP (your own youth) ===
      // Wonderkids are worth more but still affordable on youth contracts
      if (wonderkidTier === 2) {
        youthPlayer.value = 500000;  // €500K - genuine talent spotted early
        youthPlayer.salary = 75000;  // €75K/year - elevated youth wage
      } else if (wonderkidTier === 1) {
        youthPlayer.value = 150000;  // €150K - elevated prospect
        youthPlayer.salary = 40000;  // €40K/year
      } else {
        youthPlayer.value = 50000;   // €50K - standard academy product
        youthPlayer.salary = 25000;  // €25K/year - youth wage
      }
      updatedTeams = gameState.teams.map((t) => {
        if (t.id === userTeam.id) {
          return {
            ...t,
            youthCandidates: [...(t.youthCandidates || []), youthPlayer],
          };
        }
        return t;
      });

      const wonderkidPrefix = wonderkidTier === 2
        ? "⭐ WONDERKID! "
        : wonderkidTier === 1
          ? "🌟 Hot Prospect! "
          : "";
      newMessages.push({
        id: uuid(),
        week: gameState.currentWeek,
        type: MessageType.INFO,
        subject: wonderkidPrefix + t.youthProspectSubject,
        body: t.youthProspectBody
          .replace("{name}", `${youthPlayer.firstName} ${youthPlayer.lastName}`)
          .replace("{position}", pos)
          .replace("{age}", youthPlayer.age.toString())
          .replace("{overall}", baseOverall.toString())
          .replace("{potential}", potential.toString()),
        isRead: false,
        date: new Date().toISOString(),
      });
    }
  }

  // ========== CL / EUROPA LEAGUE TEAM SET (for weekly income bonus) ==========
  // Teams actively participating in European competitions get a weekly income bonus
  // that reflects match-day revenue and prize distributions during the season.
  const europeanTeamIds = new Set<string>();
  if (gameState.europeanCup?.isActive) {
    (gameState.europeanCup.groups as any[] | undefined)?.forEach((g: any) =>
      g.teams?.forEach((t: any) => europeanTeamIds.add(t.id ?? t))
    );
    (gameState.europeanCup.knockoutMatches as any[] | undefined)?.forEach((m: any) => {
      if (m.homeTeamId) europeanTeamIds.add(m.homeTeamId);
      if (m.awayTeamId) europeanTeamIds.add(m.awayTeamId);
    });
  }
  if ((gameState as any).europaLeague?.isActive) {
    ((gameState as any).europaLeague.groups as any[] | undefined)?.forEach((g: any) =>
      g.teams?.forEach((t: any) => europeanTeamIds.add(t.id ?? t))
    );
    ((gameState as any).europaLeague.knockoutMatches as any[] | undefined)?.forEach((m: any) => {
      if (m.homeTeamId) europeanTeamIds.add(m.homeTeamId);
      if (m.awayTeamId) europeanTeamIds.add(m.awayTeamId);
    });
  }

  // ========== AI TEAM DEVELOPMENT SYSTEM (GLOBAL) ==========
  // AI teams passively upgrade facilities, develop players, and produce youth
  updatedTeams = updatedTeams.map((team) => {
    if (team.id === gameState.userTeamId) return team; // Skip user team

    // === AI TEAM WEEKLY FINANCES ===
    // Calculate weekly expenses for AI teams (wages, maintenance, staff)
    const teamPlayers = playersByTeam.get(team.id) || [];
    const totalSalaries = teamPlayers.reduce(
      (sum, p) => sum + (p.salary || 0),
      0,
    );
    const weeklyWages = totalSalaries / 52;

    const leagueMult = getCachedLeagueMultiplier(team.leagueId || "tr");

    // Facility maintenance costs
    const maintenanceDiscount = ["tr", "fr"].includes(team.leagueId)
      ? 0.7
      : 1.0;
    const stadiumMaint =
      Math.pow(team.facilities.stadiumLevel, 1.3) * 1200 * maintenanceDiscount;
    const trainingMaint =
      Math.pow(team.facilities.trainingLevel, 1.3) * 900 * maintenanceDiscount;
    const academyMaint =
      Math.pow(team.facilities.academyLevel, 1.3) * 720 * maintenanceDiscount;
    const maintenance =
      (stadiumMaint + trainingMaint + academyMaint) * (0.8 + leagueMult * 0.2);

    // Staff costs
    const staffCosts =
      (Math.pow(team.staff.headCoachLevel, 1.3) * 3200 +
        Math.pow(team.staff.scoutLevel, 1.3) * 1900 +
        Math.pow(team.staff.physioLevel, 1.3) * 2600) *
      (0.8 + leagueMult * 0.2);

    // Estimate weekly income for AI (simplified - based on reputation and league)
    const leaguePosition = leaguePositionByTeamId.get(team.id) || 1;

    const baseTvRightsValues: Record<string, number> = {
      en: 850000, es: 600000, de: 550000, it: 500000, fr: 400000,
      pt: 350000, nl: 350000, ru: 320000, tr: 320000,
      sco: 250000, be: 240000, ch: 200000, pl: 200000, at: 180000, gr: 180000,
      cz: 160000, hr: 150000, ro: 140000, rs: 140000,
      sa: 220000, cn: 200000, us: 200000, mx: 200000, br: 200000,
      jp: 180000, ar: 150000, kr: 150000, au: 120000,
      co: 100000, cl: 100000, uy: 80000, ec: 80000, py: 70000, cr: 70000,
      ma: 80000, za: 80000, eg: 70000, dz: 60000, tn: 65000,
      ng: 60000, gh: 55000, sn: 55000, ci: 55000, ke: 50000,
      in: 90000, id: 80000, my: 70000, car: 50000,
      default: 80000,
    };
    const tvBase =
      baseTvRightsValues[team.leagueId] || baseTvRightsValues["default"];
    const positionMultiplier = Math.max(0.5, 1.5 - (leaguePosition - 1) * 0.05);
    const repMultiplier = 0.8 + ((team.reputation - 5000) / 10000) * 0.4;
    // Budget-scaled income boost: small clubs need the full 1.3x to survive,
    // rich clubs get diminishing returns to prevent endless accumulation.
    // leagueMult / teamCoeffMult still handle league-tier differences.
    const incomeBoost =
      team.budget < 80_000_000  ? 1.30 :  // Poor clubs: full boost
      team.budget < 250_000_000 ? 1.15 :  // Mid clubs: reduced
                                   1.00;   // Rich clubs: no artificial boost

    const tvRights = Math.floor(
      tvBase * positionMultiplier * repMultiplier * incomeBoost,
    );

    // Merchandise and sponsor income
    const starPlayerBonus =
      teamPlayers.filter((p) => p.overall > 85).length * 5000;
    const merchandise = Math.floor(
      (team.reputation * 2 + starPlayerBonus) * (0.7 + leagueMult * 0.3) * incomeBoost,
    );
    // DYNAMIC: AI teams also benefit from league coefficient scaling for sponsors
    const teamCoeffMult = getCachedCoefficientMultiplier(team.leagueId || "default");
    const sponsorIncome = team.sponsor
      ? Math.floor(team.sponsor.weeklyIncome * teamCoeffMult * incomeBoost)
      : Math.floor(50000 * Math.sqrt(leagueMult) * teamCoeffMult * incomeBoost);

    // Ticket income (simplified - AI teams don't track home/away like user)
    const STADIUM_MIN = 7500;
    const STADIUM_CAPACITY_PER_LEVEL = 12500;
    const effectiveCapacity =
      STADIUM_MIN +
      (team.facilities.stadiumLevel - 1) * STADIUM_CAPACITY_PER_LEVEL;
    const baseTicketPrice =
      LEAGUE_TICKET_PRICES[team.leagueId] || LEAGUE_TICKET_PRICES["default"];
    // DYNAMIC: AI teams also get dynamic ticket prices based on league success
    const dynamicTicketPrice = Math.floor(baseTicketPrice * teamCoeffMult);
    const avgAttendance = 0.6 + (team.reputation - 5000) / 15000; // 60-93% based on reputation
    const ticketIncome = Math.floor(
      effectiveCapacity *
      dynamicTicketPrice *
      Math.max(0.4, Math.min(0.93, avgAttendance)) *
      incomeBoost *
      0.5,
    ); // Half of weeks are home

    const hasMatchesLeft = remainingMatchTeams.has(team.id);
    let finalWeeklyWagesAI = weeklyWages;
    let finalMaintenanceAI = maintenance;
    let finalStaffCostsAI = staffCosts;

    if (!hasMatchesLeft) {
      finalWeeklyWagesAI = 0;
      finalMaintenanceAI = 0;
      finalStaffCostsAI = 0;
    }

    // European competition weekly income bonus:
    // CL teams earn ~€800k/week (scaled by league coefficient) during active competition.
    // This reflects match-day revenue + UEFA prize distributions spread across the season.
    const europeanBonus = europeanTeamIds.has(team.id)
      ? Math.floor(800_000 * Math.sqrt(leagueMult))
      : 0;

    // Off-season: AI income is fully paused (no matches = no revenue streams active).
    // Expenses are already zeroed above. This prevents budget accumulation during empty weeks.
    const weeklyIncome = hasMatchesLeft
      ? ticketIncome + merchandise + tvRights + sponsorIncome + europeanBonus
      : 0;
    const weeklyExpenses = finalWeeklyWagesAI + finalMaintenanceAI + finalStaffCostsAI;

    // Update AI team budget
    const budgetBefore = team.budget;
    team.budget += weeklyIncome - weeklyExpenses;

    // ========== BANKRUPTCY PROTECTION ==========
    if (team.budget < -2000000) { // Tightened limit to -2M to recover faster
      // Force sell lowest rated non-starting player
      const aiPlayersToSell = updatedPlayers
        .filter((p) => p.teamId === team.id && p.lineup !== "STARTING")
        .sort((a, b) => a.overall - b.overall);

      // Only sell if team has more than 15 players
      if (aiPlayersToSell.length > 5 && teamPlayers.length > 15) {
        const playerToSell = aiPlayersToSell[0];
        playerToSell.teamId = "FREE_AGENT";
        playerToSell.lineup = "RESERVE";
        team.budget += playerToSell.value * 0.5; // Emergency sale at 50% value

        // playerToSell is moved to RESERVE
      }

      // Emergency funds injection if still deeply negative
      if (team.budget < -1000000) {
        team.budget = Math.min(team.budget + 2000000, 0); // Inject €2M emergency funds (owner bail-out)
      }
    }

    // ========== GK SURPLUS TRIM ==========
    // Release excess players per position to prevent bench bloat
    // AI gets 40% of value back. Limits: GK≤3, DEF≤7, MID≤7, FWD≤5
    const posLimits: { pos: Position; max: number }[] = [
      { pos: Position.GK, max: 3 },
      { pos: Position.DEF, max: 7 },
      { pos: Position.MID, max: 7 },
      { pos: Position.FWD, max: 5 },
    ];
    for (const { pos, max } of posLimits) {
      const posPlayers = updatedPlayers
        .filter((p) => p.teamId === team.id && p.position === pos)
        .sort((a, b) => b.overall - a.overall);
      if (posPlayers.length > max) {
        for (let pi = max; pi < posPlayers.length; pi++) {
          const excess = posPlayers[pi];
          team.budget += Math.floor(excess.value * 0.4);
          excess.teamId = "FREE_AGENT";
          excess.lineup = "RESERVE";
        }
      }
    }

    // AI takımları için de finansal kayıt tut
    if (!team.financials) {
      team.financials = {
        lastWeekIncome: {
          tickets: 0,
          sponsor: 0,
          merchandise: 0,
          tvRights: 0,
          transfers: 0,
          winBonus: 0,
        },
        lastWeekExpenses: {
          wages: 0,
          maintenance: 0,
          academy: 0,
          transfers: 0,
        },
        history: [],
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
        total: weeklyIncome,
      },
      expenses: {
        wages: finalWeeklyWagesAI,
        maintenance: finalMaintenanceAI,
        academy: academyMaint,
        transfers: 0,
        total: weeklyExpenses,
      },
      balance: weeklyIncome - weeklyExpenses,
      budgetBefore,
      budgetAfter: team.budget,
    };

    if (!team.financials.history) team.financials.history = [];
    team.financials.history.push(financialRecord);
    // Son 10 kaydı tut
    if (team.financials.history.length > 10) {
      team.financials.history = team.financials.history.slice(-10);
    }

    // AI Facility Upgrades (SMART: checks ongoing maintenance costs before upgrading)
    const upgradeChance = 0.03 + team.reputation / 10000; // Increased: 3% base + larger reputation bonus

    // SMART CHECK: Only upgrade if budget positive AND weekly income > expenses with 20% buffer
    const canAffordMaintenance = weeklyIncome > weeklyExpenses * 1.2;
    const hasEnoughBudget = team.budget > 5000000; // Decreased threshold to 5M

    if (
      Math.random() < upgradeChance &&
      hasEnoughBudget &&
      canAffordMaintenance &&
      team.budget > 0
    ) {
      const facilityTypes = ["stadium", "training", "academy"];
      const targetFacility =
        facilityTypes[Math.floor(Math.random() * facilityTypes.length)];

      let cost = 0;
      const newFacilities = { ...team.facilities };

      // Also check if upgrading this facility would still be affordable
      const projectedMaint = (facility: string) => {
        const stadLvl =
          facility === "stadium"
            ? team.facilities.stadiumLevel + 1
            : team.facilities.stadiumLevel;
        const trainLvl =
          facility === "training"
            ? team.facilities.trainingLevel + 1
            : team.facilities.trainingLevel;
        const acadLvl =
          facility === "academy"
            ? team.facilities.academyLevel + 1
            : team.facilities.academyLevel;
        return (
          (Math.pow(stadLvl, 1.8) * 4000 +
            Math.pow(trainLvl, 1.8) * 3500 +
            Math.pow(acadLvl, 1.8) * 3000) *
          (0.8 + leagueMult * 0.2)
        );
      };

      if (targetFacility === "stadium" && newFacilities.stadiumLevel < 10) {
        // Max 10 for AI stadium (stadium doesn't affect player development)
        cost = 3000000;
        const futureMaint = projectedMaint("stadium");
        // Keep 60% of cash safe, spend max 40% on facilities
        const maxFacilityBudget = team.budget * 0.4;
        if (
          maxFacilityBudget > cost &&
          weeklyIncome > (weeklyWages + futureMaint) * 1.2 // Require 20% profit margin over expenses
        ) {
          newFacilities.stadiumLevel += 1;
          newFacilities.stadiumCapacity += 12500;
        }
      } else if (
        targetFacility === "training" &&
        newFacilities.trainingLevel < 8
      ) {
        // Max 8 for AI
        cost = 2000000;
        const futureMaint = projectedMaint("training");
        const maxFacilityBudget = team.budget * 0.4;
        if (
          maxFacilityBudget > cost &&
          weeklyIncome > (weeklyWages + futureMaint) * 1.2
        ) {
          newFacilities.trainingLevel += 1;
        }
      } else if (
        targetFacility === "academy" &&
        newFacilities.academyLevel < 8
      ) {
        // AI academy max 8
        cost = 1500000;
        const futureMaint = projectedMaint("academy");
        const maxFacilityBudget = team.budget * 0.4;
        if (
          maxFacilityBudget > cost &&
          weeklyIncome > (weeklyWages + futureMaint) * 1.2
        ) {
          newFacilities.academyLevel += 1;
        }
      }

      if (cost > 0 && team.budget > cost) {
        return {
          ...team,
          facilities: newFacilities,
          budget: team.budget - cost,
        };
      }
    }

    return team;
  });

  // AI Youth Production (based on academy level)
  updatedTeams = updatedTeams.map((team) => {
    if (team.id === gameState.userTeamId) return team;

    const academyLevel = team.facilities?.academyLevel || 1;
    const youthChance = 0.01 + academyLevel * 0.005; // 1% base + 0.5% per level

    // AI teams can integrate youth directly into squad (simplified)
    if (Math.random() < youthChance) {
      const teamPlayers = getIndexedTeamPlayers(team.id);

      // Only if team has less than 25 players
      if (teamPlayers.length < 25) {
        const positions: Position[] = [
          Position.GK,
          Position.DEF,
          Position.MID,
          Position.FWD,
        ];
        const pos = positions[Math.floor(Math.random() * positions.length)];
        const baseOverall = Math.floor(45 + Math.random() * 12 + (academyLevel / 2)); // 45-64 base

        // RARE POTENTIAL (Only 3% chance of being a 90+ Wonderkid, mostly 70-85)
        let potentialBuff = 12 + Math.floor(Math.random() * 15); // Average 12-26 gap
        if (Math.random() < 0.03 && academyLevel >= 12) {
          potentialBuff += Math.floor(Math.random() * 8) + 5; // 3% chance of being elite IF top academy
        }

        const potential = Math.min(
          85, // Hard cap max generation potential to prevent elite youth inflation
          baseOverall + potentialBuff,
        );

        const youthPool = getYouthNationalityPool(team.leagueId || "en");
        const youthPlayer = generatePlayer(
          team.id,
          pos,
          getRandomItem(youthPool),
          [17, 19],
          [potential, potential],
          undefined,
          team.leagueId,
        );
        youthPlayer.overall = baseOverall;
        youthPlayer.lineup = "RESERVE";
        youthPlayer.lineupIndex = 99;

        // Recalculate salary for youth specifically if needed, but generatePlayer now handles it well.
        // We'll trust generatePlayer's scaled wage, but ensure it's not too high for a youth player
        // Youth players usually get ~15% of value, but scaled wage is safer.
        // Let's rely on the new generatePlayer wage.

        updatedPlayers.push(youthPlayer);
        if (!currentPlayersByTeam.has(team.id)) currentPlayersByTeam.set(team.id, []);
        currentPlayersByTeam.get(team.id)!.push(youthPlayer);

        // NEWS: Notify user about their OWN youth promotions only (not AI teams)
        if (team.id === gameState.userTeamId) {
          newMessages.push({
            id: uuid(),
            week: gameState.currentWeek,
            type: MessageType.INFO,
            subject:
              t.aiYouthPromotionSubject?.replace("{team}", team.name) ||
              `🌟 ${team.name} Youth Promotion`,
            body:
              t.aiYouthPromotionBody
                ?.replace("{team}", team.name)
                .replace(
                  "{name}",
                  `${youthPlayer.firstName} ${youthPlayer.lastName}`,
                )
                .replace("{position}", pos)
                .replace("{age}", youthPlayer.age.toString()) ||
              `${team.name} promoted ${youthPlayer.firstName} ${youthPlayer.lastName} (${pos}, ${youthPlayer.age}) from their academy.`,
            isRead: false,
            date: new Date().toISOString(),
          });
        }
      }
    }

    return team;
  });

  // ========== FFP LUXURY TAX SYSTEM (Progressive Brackets) ==========
  // Progressive wealth tax: richer clubs pay proportionally more.
  // 50% of collected tax is DESTROYED (economic sink), 50% redistributed to league.
  // Brackets (annual rate, applied weekly):
  //   €100M – €300M : 10%
  //   €300M – €600M : 35%
  //   €600M – €1B   : 60%
  //   €1B+           : 120%  → hard cap on billionaire clubs
  const LUXURY_TAX_BRACKETS = [
    { low: 100_000_000,   high: 300_000_000,  rate: 0.10 / 52 },
    { low: 300_000_000,   high: 600_000_000,  rate: 0.35 / 52 },
    { low: 600_000_000,   high: 1_000_000_000, rate: 0.60 / 52 },
    { low: 1_000_000_000, high: Infinity,      rate: 1.20 / 52 },
  ];

  // Track FFP amounts per team for financial reporting
  const ffpTaxPaid: Record<string, number> = {};
  const ffpSolidarityReceived: Record<string, number> = {};

  // Group teams by league
  const leagueTeamMap: Record<string, Team[]> = {};
  updatedTeams.forEach((t) => {
    const lid = t.leagueId || "tr";
    if (!leagueTeamMap[lid]) leagueTeamMap[lid] = [];
    leagueTeamMap[lid].push(t);
  });

  // Process each league's solidarity fund
  Object.keys(leagueTeamMap).forEach((leagueId) => {
    const leagueTeams = leagueTeamMap[leagueId];
    let solidarityFund = 0;

    // Collect progressive taxes from rich teams
    leagueTeams.forEach((team) => {
      let tax = 0;
      for (const bracket of LUXURY_TAX_BRACKETS) {
        if (team.budget > bracket.low) {
          const taxableInBracket = Math.min(team.budget, bracket.high === Infinity ? team.budget : bracket.high) - bracket.low;
          tax += Math.floor(taxableInBracket * bracket.rate);
        }
      }
      if (tax > 0) {
        team.budget -= tax;
        solidarityFund += tax;
        ffpTaxPaid[team.id] = tax; // Track for finance UI
      }
    });

    // 50% destroyed (economic sink), 50% redistributed to all teams in league
    if (solidarityFund > 0) {
      const toRedistribute = Math.floor(solidarityFund * 0.50);
      const perTeamShare = Math.floor(toRedistribute / leagueTeams.length);
      leagueTeams.forEach((team) => {
        team.budget += perTeamShare;
        ffpSolidarityReceived[team.id] = perTeamShare;
      });
      // Other 50% is simply not returned → economic drain
    }
  });

  // Update user team's financials with FFP data
  const userTeamFromUpdated = updatedTeams.find(
    (t) => t.id === gameState.userTeamId,
  );
  if (userTeamFromUpdated && userTeamFromUpdated.financials) {
    const userFFPTax = ffpTaxPaid[userTeamFromUpdated.id] || 0;
    const userFFPSolidarity = ffpSolidarityReceived[userTeamFromUpdated.id] || 0;
    userTeamFromUpdated.financials.lastWeekIncome.ffpSolidarity = userFFPSolidarity;
    userTeamFromUpdated.financials.lastWeekExpenses.ffpTax = userFFPTax;

    // Also update the history ledger record for this week so the ledger reflects FFP
    if (userTeamFromUpdated.financials.history) {
      const rec = userTeamFromUpdated.financials.history.find(
        (r: any) => r.week === gameState.currentWeek && r.season === gameState.currentSeason
      ) as any;
      if (rec) {
        rec.income.ffpSolidarity = (rec.income.ffpSolidarity || 0) + userFFPSolidarity;
        rec.expenses.ffpTax = (rec.expenses.ffpTax || 0) + userFFPTax;
        rec.income.total = (rec.income.total || 0) + userFFPSolidarity;
        rec.expenses.total = (rec.expenses.total || 0) + userFFPTax;
        rec.balance = rec.income.total - rec.expenses.total;
        rec.budgetAfter = userTeamFromUpdated.budget;
      }
    }
  }

  // AI Transfer Offers for User's Listed Players
  const newOffers: TransferOffer[] = [];
  const transferredPlayerIds = new Set<string>(); // FIX: Prevent infinite transfer loops
  const userListedPlayers = updatedPlayers.filter(
    (p) => p.teamId === gameState.userTeamId && p.isTransferListed,
  );

  userListedPlayers.forEach((player) => {
    // Each listed player has a chance to receive an offer
    if (Math.random() < 0.4) {
      // 40% chance per week
      // Find AI teams with enough budget AND interest (Realism Update)
      const interestedTeams = gameState.teams.filter((team) => {
        if (team.id === gameState.userTeamId) return false;
        // Realism Check 0: Has enough budget (keep 3M buffer, spend max 60%)
        if (team.budget < 3000000 || team.budget * 0.6 < player.value) return false;

        // Realism Check 1: Is the player good enough for this team?
        // AMBITION UPDATE: Teams now measure exactly what they need based on their actual squad strength, not a generic low rep formula.
        // This stops weak/mid teams from buying the user's 45 OVR youth players just because their "reputation minimum" was 40.
        const teamPlayersList = getIndexedTeamPlayers(team.id);
        const avgOverall = teamPlayersList.reduce((sum, p) => sum + p.overall, 0) / Math.max(1, teamPlayersList.length);
        const minOvrNeeded = Math.max(55, avgOverall - 4);
        const isGoodEnough = player.overall >= minOvrNeeded;

        // Realism Check 2: Is he a young talent? (Wonderkid exception)
        const isWonderkid = player.age <= 22 && player.potential > 80;

        // Team must either need his quality OR he's a future prospect
        // Chance to bid on user's listed players increased from 30% to 50%
        return (isGoodEnough || isWonderkid) && Math.random() < 0.5;
      });

      if (interestedTeams.length > 0) {
        const buyingTeam =
          interestedTeams[Math.floor(Math.random() * interestedTeams.length)];
        // Base offer: 115%-165% of market value (never lowball a listed player)
        let offerMultiplier = 1.15 + Math.random() * 0.5;
        // Reputation premium: bigger clubs pay more for prestige acquisition
        if (buyingTeam.reputation > (userTeam?.reputation || 5000) + 1500) {
          offerMultiplier += 0.2; // Top club premium
        }
        const offerAmount = Math.floor(player.value * offerMultiplier);

        const offer: TransferOffer = {
          id: uuid(),
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          fromTeamId: gameState.userTeamId,
          fromTeamName: userTeam?.name || "Your Team",
          toTeamId: buyingTeam.id,
          offerAmount,
          status: "PENDING",
          weekCreated: gameState.currentWeek,
        };

        newOffers.push(offer);

        // Create message for user
        newMessages.push({
          id: uuid(),
          week: gameState.currentWeek,
          type: MessageType.TRANSFER_OFFER,
          subject: t.transferOfferSubject
            .replace("{team}", buyingTeam.name)
            .replace("{name}", player.lastName),
          body: t.transferOfferBody
            .replace("{team}", buyingTeam.name)
            .replace("{amount}", (offerAmount / 1000000).toFixed(1))
            .replace("{name}", `${player.firstName} ${player.lastName}`),
          isRead: false,
          date: new Date().toISOString(),
          data: { offerId: offer.id },
        });
      }
    }
  });

  // ========== SMART AI TRANSFER SYSTEM ==========
  // AI teams now: 1) Identify squad weaknesses, 2) Scout appropriate players, 3) Make intelligent offers

  const allAiTeams = gameState.teams.filter(
    (t) => t.id !== gameState.userTeamId,
  );

  const playersByPosition = new Map<Position, Player[]>();
  updatedPlayers.forEach((player) => {
    if (!playersByPosition.has(player.position)) {
      playersByPosition.set(player.position, []);
    }
    playersByPosition.get(player.position)!.push(player);
  });

  let weeklyTransferCount = 0;
  let weeklyTransferSpent = 0;
  let weeklyUserLeagueTransferCount = 0;
  const GLOBAL_WEEKLY_TRANSFER_CAP = 150; // Mobile performance cap

  // PER-PLAYER WEEKLY REJECTION TRACKING
  // Prevents multi-offer exploit: if 20 teams bid on same star,
  // only 1 rejection roll happens — rest auto-reject
  const rejectedThisWeek = new Set<string>();

  // THROTTLING: Process X% of teams per week based on aiTransferActivity setting
  // Crisis teams (low squad size) are always processed regardless of setting
  const aiThrottleRate = aiTransferActivity === 'HIGH' ? 0.65 : aiTransferActivity === 'LOW' ? 0.20 : 0.35;
  const activeAiTeams = allAiTeams.filter((t) => {
    const squadSize = getIndexedTeamPlayers(t.id).length;
    if (squadSize < 18) return true; // Crisis: always active
    return Math.random() < aiThrottleRate;
  });

  // Track how many offers each user player has received this week — cap to prevent spam
  const playerOffersThisWeek = new Map<string, number>();
  const MAX_OFFERS_PER_PLAYER = 2;

  // Pre-build targetable user players list ONCE (outside AI team loop) for performance.
  // isNotForSale players are completely invisible to all AI teams — not scanned, not offered.
  const targetableUserPlayers = updatedPlayers.filter(
    (p) =>
      p.teamId === gameState.userTeamId &&
      !p.isTransferListed &&
      !p.isNotForSale &&
      p.overall >= 72,
  );

  // console.log(`[AI Market] Active buyers this week: ${activeAiTeams.length}/${allAiTeams.length}`);

  activeAiTeams.forEach((aiTeam) => {
    // Skip if budget too low for transfers
    if (aiTeam.budget < 4000000) return;

    // TRANSFER WINDOW CHECK
    // Summer Window: Weeks 1-8
    // Winter Window: Weeks 20-28
    const isTransferWindow =
      gameState.currentWeek <= 8 ||
      (gameState.currentWeek >= 20 && gameState.currentWeek <= 28);

    if (!isTransferWindow) return; // Stop all AI transfer activity outside windows

    const teamPlayers = getIndexedTeamPlayers(aiTeam.id);

    // ========== 1. ADVANCED SQUAD ANALYSIS (AI BRAIN) ==========
    // Calculate average squad quality to set a baseline standard
    const avgOverall =
      teamPlayers.reduce((sum, p) => sum + p.overall, 0) /
      Math.max(1, teamPlayers.length);

    // Use the new AI Service to identify needs based on tactic and quality
    // This considers formation slots, depth, and starter quality
    const squadNeeds = AIService.analyzeSquadNeeds(
      aiTeam,
      teamPlayers,
      avgOverall,
    );

    // ========== 2. SMART AI BUYING (Utility-Based) ==========
    // WAGE SUSTAINABILITY: pre-compute current weekly wage bill for gate check
    const currentWeeklyWageBill = teamPlayers.reduce((sum, p) => sum + (p.salary || 0), 0) / 52;
    // Conservative income estimate: reputation * 90 (scales with club size)
    const estimatedWeeklyIncome = Math.max(50000, aiTeam.reputation * 90);

    // Dynamic buying aggressiveness based on squad size
    const currentSquadSize = teamPlayers.length;
    let buyUrgencyThreshold = 40;
    let buyChance = 0.70;
    if (currentSquadSize < 20) { buyUrgencyThreshold = 20; buyChance = 0.90; } // URGENT: thin squad
    else if (currentSquadSize < 22) { buyUrgencyThreshold = 30; buyChance = 0.80; }
    // Wealthier teams buy more aggressively — prevents budget accumulation over seasons
    // FFP awareness: teams with >750M are in the brutal tax bracket (120%/week) — must spend fast
    const isFfpDangerZone = aiTeam.budget > 750_000_000;
    let maxBuysThisWeek = 1;
    if (isFfpDangerZone)                    { maxBuysThisWeek = 3; buyChance = 0.99; buyUrgencyThreshold = 5; }
    else if (aiTeam.budget > 500_000_000)  { maxBuysThisWeek = 3; buyChance = 0.97; buyUrgencyThreshold = 12; }
    else if (aiTeam.budget > 200_000_000)  { maxBuysThisWeek = 2; buyChance = 0.92; buyUrgencyThreshold = 18; }
    else if (aiTeam.budget > 50_000_000)   { maxBuysThisWeek = 2; buyChance = 0.82; }
    else if (aiTeam.budget > 20_000_000 && avgOverall < (aiTeam.reputation / 120)) { maxBuysThisWeek = 2; }
    let buysThisWeek = 0;

    // Inject upgrade opportunities for rich teams — scales aggressiveness with budget
    // FFP danger zone teams always inject (even if some needs already exist)
    const injectThreshold = isFfpDangerZone ? 200_000_000 : 200_000_000;
    const hasEnoughNeeds = squadNeeds.filter(n => n.urgency > buyUrgencyThreshold).length >= 3;
    if (aiTeam.budget > injectThreshold && (!hasEnoughNeeds || isFfpDangerZone)) {
      const positions: Position[] = [Position.DEF, Position.MID, Position.FWD];
      positions.forEach(pos => {
        const starters = teamPlayers
          .filter(p => p.position === pos && p.lineup === "STARTING")
          .sort((a, b) => a.overall - b.overall);
        // FFP danger zone: upgrade ALL starters below a high bar, not just the worst
        const upgradeTarget = isFfpDangerZone ? avgOverall + 8 : avgOverall + 3;
        starters.forEach((worstStarter, idx) => {
          if (worstStarter.overall < upgradeTarget && idx < (isFfpDangerZone ? 3 : 1)) {
            squadNeeds.push({
              position: pos,
              role: "STANDARD",
              urgency: isFfpDangerZone ? 60 : 25,
              targetRating: isFfpDangerZone ? Math.max(worstStarter.overall + 6, avgOverall + 5) : worstStarter.overall + 4,
              reason: isFfpDangerZone
                ? `FFP spending: upgrade ${pos} ${worstStarter.overall}→ elite`
                : `Proactive upgrade: replace ${pos} ${worstStarter.overall} OVR`,
            });
          }
        });
      });
    }

    while (
      buysThisWeek < maxBuysThisWeek &&
      weeklyTransferCount < GLOBAL_WEEKLY_TRANSFER_CAP && // Global cap

      squadNeeds.length > buysThisWeek &&
      squadNeeds[buysThisWeek].urgency > buyUrgencyThreshold &&
      Math.random() < buyChance &&
      aiTeam.budget > 2000000
    ) {
      const topNeed = squadNeeds[buysThisWeek]; // Current priority need

      // Look for players who fit this specific role
      // BUYER QUALITY GATE: Prevent weak teams from buying world-class players
      const isEliteBuyer = aiTeam.reputation >= 8200 || aiTeam.budget >= 150_000_000;
      const isMegaRichBuyer = aiTeam.reputation >= 9000 || aiTeam.budget >= 250_000_000;
      // NOTE: effectiveBudget is calculated below after potentialSaleValue is known
      const desperateUpgrade = topNeed.urgency >= buyUrgencyThreshold + 15;

      // ASSET-AWARE BUDGET: Include potential sale value of weakest same-position player.
      // AI knows it can sell someone to fund the purchase — mirrors real transfer market logic.
      const currentTeamPlayersForBudget = getIndexedTeamPlayers(aiTeam.id);
      const sellableSamePos = currentTeamPlayersForBudget
        .filter(p => p.position === topNeed.position && p.lineup !== "STARTING" && !transferredPlayerIds.has(p.id))
        .sort((a, b) => a.overall - b.overall);
      const potentialSaleValue = sellableSamePos.length > 0
        ? Math.floor(sellableSamePos[0].value * 0.8) // 80% of value — conservative estimate
        : 0;
      const effectiveBudget = aiTeam.budget + potentialSaleValue;

      const isWonderkidSearch = topNeed.reason.includes('Wonderkid');
      const availablePlayers = (playersByPosition.get(topNeed.position) || []).filter(
        (p) => {
          if (p.teamId === aiTeam.id || p.teamId === gameState.userTeamId) return false;
          if (transferredPlayerIds.has(p.id) || rejectedThisWeek.has(p.id)) return false;
          // Only block re-transfers within the SAME season (cross-season lastTransferWeek causes permanent blocks)
          if (p.lastTransferSeason === gameState.currentSeason && gameState.currentWeek - (p.lastTransferWeek || -99) < 15) return false;

          const marketAccessible = p.isTransferListed || (p.contractYears ?? 99) <= 1 || p.teamId === 'FREE_AGENT';
          const premiumAccessible = isEliteBuyer && desperateUpgrade && p.overall >= topNeed.targetRating && p.value < effectiveBudget * 0.75;
          // MEGA RICH RULE: Must be calculated BEFORE the marketAccessible gate so it can bypass it
          const isMegaRichTarget = isMegaRichBuyer && ((p.age <= 23 && p.overall >= 80) || p.overall >= 85);
          // WONDERKID RULE: young players (age<=22, high potential) are always valid targets
          const isWonderkidTarget = isWonderkidSearch && p.age <= 23 && (p.potential - p.overall) >= 4;

          // Mega rich / wonderkid targets bypass marketAccessible restriction (real football: any player can be bid on)
          if (!marketAccessible && !premiumAccessible && !isMegaRichTarget && !isWonderkidTarget) return false;
          if (p.overall < topNeed.targetRating - 2 && !isMegaRichTarget && !isWonderkidTarget) return false;

          if (!(aiTeam.reputation > 8500 || effectiveBudget > 150_000_000 || p.overall <= avgOverall + 15 || premiumAccessible || isWonderkidTarget)) return false;
          // Protect clubs from bankrupting themselves — use effectiveBudget (includes sale proceeds)
          const safeBudgetLimit = isMegaRichTarget ? 0.90 : (premiumAccessible ? 0.75 : (isWonderkidTarget ? 0.25 : 0.60));
          if (p.value >= effectiveBudget * safeBudgetLimit) return false;

          return true;
        },
      );

      if (availablePlayers.length > 0) {
        // SCORE PLAYERS BASED ON ROLE FIT AND OVERALL
        const isWonderkidNeed = topNeed.reason.includes('Wonderkid');
        const scoredTargets = availablePlayers.map((p) => {
          let utilityScore = AIService.calculatePlayerUtility(p, topNeed.role, aiTeam.tactic);
          // Mega rich clubs explicitly bias highly towards purely high-overall/high-potential players over strict "utility"
          if (isMegaRichBuyer && p.overall >= 80) {
              utilityScore += p.overall * 2;
              if (p.age <= 23) utilityScore += p.potential * 1.5;
          }
          // Wonderkid need: strongly prefer young players with high potential gap
          // SCOUT NOISE: AI doesn't see exact potential — scout level determines accuracy
          if (isWonderkidNeed) {
            const scoutLevel = aiTeam.staff?.scoutLevel || 1;
            // Scout 1 = up to ±14 OVR error, Scout 7 = up to ±2 OVR error
            const noiseRange = Math.max(1, (8 - scoutLevel) * 2);
            // Deterministic per (player, team) pair — no random flicker each frame
            const hash = (p.id.charCodeAt(0) * 31 + (aiTeam.id.charCodeAt(0) || 0) * 7) % (noiseRange * 2 + 1);
            const perceivedPotential = Math.max(p.overall, Math.min(99, p.potential + hash - noiseRange));
            const potentialGap = Math.max(0, perceivedPotential - p.overall);
            const youthBonus = Math.max(0, 23 - p.age) * 4;
            utilityScore += potentialGap * 3 + youthBonus;
            if (p.age > 24) utilityScore -= 30; // Heavily penalize non-youth
          }
          return { player: p, utilityScore };
        });

        // Sort by Utility Score (Best fit for the role)
        const sortedTargets = scoredTargets.sort((a, b) => b.utilityScore - a.utilityScore);

        // Top target is the best FIT, not necessarily highest OVR
        const targetPlayer = sortedTargets[0].player;
        const sellingTeam = teamsById.get(targetPlayer.teamId);

        // WAGE SUSTAINABILITY GATE: don't buy if combined wages would exceed 85% of estimated income
        // Exception: urgent needs (urgency >= 70) bypass this gate
        const newPlayerWeeklyWage = (targetPlayer.salary || 0) / 52;
        const projectedWagePct = (currentWeeklyWageBill + newPlayerWeeklyWage) / Math.max(1, estimatedWeeklyIncome);
        const isUrgentNeed = topNeed.urgency >= 70;
        // Rich teams (€80M+ budget) bypass wage gate — their real income is much higher
        // than our estimate (reputation * 90), so the gate was wrongly blocking them.
        const isRich = aiTeam.budget > 80_000_000;
        if (!isUrgentNeed && !isRich && projectedWagePct > 0.85) {
          buysThisWeek++; // count as attempted so loop moves on, don't actually buy
          continue;
        }

        // Max offer shouldn't exceed transfer budget limit (include 7% transfer tax)
        if (sellingTeam && targetPlayer.value * 1.07 < aiTeam.budget * 0.9) {
          // === REJECTION LOGIC FIX ===
          // Selling team may reject the offer based on player importance, but we make sure transfers CAN happen
          const sellingTeamPlayers = playersByTeam.get(sellingTeam.id) || [];
          const isStarter = targetPlayer.lineup === "STARTING";
          const positionPlayersCount = sellingTeamPlayers.filter(
            (p) => p.position === targetPlayer.position,
          ).length;
          const wouldLeaveShort = positionPlayersCount <= 3;

          const marketAccessible = targetPlayer.isTransferListed || (targetPlayer.contractYears ?? 99) <= 1 || targetPlayer.teamId === 'FREE_AGENT';
          const premiumRaid = !marketAccessible && isEliteBuyer && desperateUpgrade;

          let rejectChance = 0.1; // Base 10%
          if (isStarter) rejectChance += 0.25; // Starter
          if (wouldLeaveShort) rejectChance += 0.3; // Depth issue
          if (!targetPlayer.isTransferListed) rejectChance += 0.2; // Not listed
          if (premiumRaid) rejectChance += 0.15; // Protected player raid

          // Player willingness
          const repDiff = aiTeam.reputation - sellingTeam.reputation;
          if (repDiff < -1000) rejectChance += 0.4; // Huge step down
          else if (repDiff > 1000) rejectChance -= 0.3; // Huge step up, player forces move

          // ★ STAR PLAYER PROTECTION — properly scaled by financial power ★
          // offerRatio = buyer budget / player value (higher = richer relative to the price)
          const offerRatio = aiTeam.budget / Math.max(1, targetPlayer.value);
          const sortedByOvr = [...sellingTeamPlayers].sort((a, b) => b.overall - a.overall);
          const isTop3 = sortedByOvr.slice(0, 3).some(p => p.id === targetPlayer.id);
          const isTop5 = sortedByOvr.slice(0, 5).some(p => p.id === targetPlayer.id);

          if (targetPlayer.overall >= 90) {
            // 90+ OVR: very hard, but rich clubs throwing massive money can break through
            let base90 = offerRatio > 50 ? 0.50 : offerRatio > 30 ? 0.62 : offerRatio > 15 ? 0.78 : 0.92;
            if (targetPlayer.isTransferListed) base90 -= 0.25;
            if ((targetPlayer.morale || 70) < 35) base90 -= 0.15;
            rejectChance = Math.max(0.22, base90);
          } else if (targetPlayer.overall >= 85 && isTop3) {
            // Top-3 star at their club — reluctant to sell but money talks
            const richDiscount = offerRatio > 50 ? 0.45 : offerRatio > 20 ? 0.30 : offerRatio > 10 ? 0.15 : 0;
            rejectChance = Math.max(0.35, 0.95 - richDiscount);
          } else if (targetPlayer.overall >= 85 && isTop5) {
            // Good player but not the main star — more willing to move for a big fee
            const richDiscount = offerRatio > 50 ? 0.50 : offerRatio > 20 ? 0.35 : offerRatio > 10 ? 0.18 : 0;
            rejectChance = Math.max(0.20, 0.85 - richDiscount);
          } else if (targetPlayer.overall >= 80 && isTop5) {
            // Solid player, selling club can replace — money talks louder here
            const richDiscount = offerRatio > 50 ? 0.55 : offerRatio > 20 ? 0.38 : offerRatio > 10 ? 0.22 : 0;
            rejectChance = Math.max(0.08, 0.78 - richDiscount);
          } else {
            // Non-star: offerRatio adjustments apply normally
            if (offerRatio > 50) rejectChance -= 0.50;
            else if (offerRatio > 20) rejectChance -= 0.35;
            else if (offerRatio > 10) rejectChance -= 0.20;
            // Wonderkid protection
            if (targetPlayer.age <= 22 && targetPlayer.overall >= 75) rejectChance += 0.25;
            if (targetPlayer.overall >= 80) rejectChance += 0.20;
            rejectChance = Math.min(0.90, Math.max(0.05, rejectChance));
          }

          // Roll the dice
          if (Math.random() < rejectChance) {
            // Transfer rejected - mark player so no other team bids this week
            rejectedThisWeek.add(targetPlayer.id);
          } else {
            // Offer structure: AI now offers closer to / slightly over market value
            let offerMultiplier = premiumRaid
              ? 1.20 + Math.random() * 0.55
              : 0.95 + Math.random() * 0.45;
            if (marketAccessible && !targetPlayer.isTransferListed && (targetPlayer.contractYears ?? 99) > 1) {
              offerMultiplier += 0.08;
            }
            const transferFee = Math.floor(
              targetPlayer.value * offerMultiplier,
            );

            // Execute transfer
            trackPlayerTeamChange(targetPlayer, aiTeam.id);
            targetPlayer.lineup = "RESERVE";
            targetPlayer.lineupIndex = 99;
            targetPlayer.lastTransferWeek = gameState.currentWeek; // FIX: Set transfer week
            targetPlayer.lastTransferSeason = gameState.currentSeason; // FIX: Track season to prevent cross-season block
            targetPlayer.freeAgentSince = undefined; // Clear free agent timer on re-hire
            transferredPlayerIds.add(targetPlayer.id); // FIX: Mark as transferred

            // Buyer pays 10% tax, seller pays 6% tax (realistic market friction)
            const buyerTax = Math.floor(transferFee * 0.10);
            const sellerTax = Math.floor(transferFee * 0.06);
            adjustTeamBudget(sellingTeam.id, transferFee - sellerTax);
            adjustTeamBudget(aiTeam.id, -(transferFee + buyerTax));
            gameState.transferTaxPot = (gameState.transferTaxPot || 0) + buyerTax + sellerTax;

            weeklyTransferCount++;
            weeklyTransferSpent += transferFee;
            buysThisWeek++;


            // Show news ONLY for user's league transfers
            const userLeagueId = userTeam?.leagueId;
            const isRelevantLeague = aiTeam.leagueId === userLeagueId || sellingTeam.leagueId === userLeagueId;

            if (isRelevantLeague) {
              weeklyUserLeagueTransferCount++;
              newMessages.push({
                id: uuid(),
                week: gameState.currentWeek,
                type: MessageType.INFO,
                subject: t.transferNewsSubject || "Transfer News",
                body: t.transferSignedBody
                  ? t.transferSignedBody
                    .replace("{team}", aiTeam.name)
                    .replace("{position}", targetPlayer.position)
                    .replace(
                      "{name}",
                      `${targetPlayer.firstName} ${targetPlayer.lastName}`,
                    )
                    .replace("{fromTeam}", sellingTeam.name)
                    .replace("{amount}", (transferFee / 1000000).toFixed(1))
                  : `${targetPlayer.firstName} ${targetPlayer.lastName} transferred from ${sellingTeam.name} to ${aiTeam.name} for €${(transferFee / 1000000).toFixed(1)}M.`,
                isRead: false,
                date: new Date().toISOString(),
              });
            }

            // ★ BUY-THEN-SELL SWAP: After buying, offload only genuine surplus depth ★
            const currentTeamPlayers = getIndexedTeamPlayers(aiTeam.id);
            const samePosAll = currentTeamPlayers.filter(p => p.position === targetPlayer.position);
            const posAvgOvr = samePosAll.length > 0
              ? samePosAll.reduce((s, p) => s + p.overall, 0) / samePosAll.length
              : 70;
            const formationSlots = AIService.getFormationSlotCounts(aiTeam.tactic.formation);
            const isEliteClub =
              aiTeam.reputation >= 8500 ||
              aiTeam.budget >= 250_000_000 ||
              avgOverall >= 80;
            const reserveBuffer = isEliteClub ? 3 : 2;
            // Fully relative: floor tracks squad average so high-OVR squads still list surplus
            const swapListingFloor = Math.round(avgOverall - (isEliteClub ? 5 : 4));

            // Only consider selling if we now have genuine depth surplus at this position
            const formationPosCount = formationSlots[targetPlayer.position] ?? 1;
            const hasDepthSurplus = samePosAll.length > formationPosCount + reserveBuffer;

            if (hasDepthSurplus) {
              const samePosNonStarters = samePosAll
                .filter(p => p.id !== targetPlayer.id && p.lineup !== "STARTING" && !p.isTransferListed)
                .sort((a, b) => a.overall - b.overall);

              if (samePosNonStarters.length > 0) {
                const worstAtPos = samePosNonStarters[0];
                // Sell if: (a) notably worse than new signing, AND (b) below this position's own average
                const shouldOffload = worstAtPos.overall < targetPlayer.overall - 4
                  && worstAtPos.overall < posAvgOvr - 3
                  && worstAtPos.overall <= swapListingFloor;

                if (shouldOffload) {
                  // Try immediate AI-to-AI sale first
                  const swapBuyers = allAiTeams.filter(st =>
                    st.id !== aiTeam.id &&
                    st.budget > worstAtPos.value * 0.5 &&
                    st.reputation <= aiTeam.reputation + 500
                  );

                  if (swapBuyers.length > 0) {
                    const swapBuyer = swapBuyers[Math.floor(Math.random() * swapBuyers.length)];
                    const swapFee = Math.floor(worstAtPos.value * (0.7 + Math.random() * 0.3));

                    trackPlayerTeamChange(worstAtPos, swapBuyer.id);
                    worstAtPos.lineup = "RESERVE";
                    worstAtPos.lineupIndex = 99;
                    worstAtPos.lastTransferWeek = gameState.currentWeek;
                    transferredPlayerIds.add(worstAtPos.id);

                    adjustTeamBudget(aiTeam.id, swapFee);
                    adjustTeamBudget(swapBuyer.id, -swapFee);
                    weeklyTransferCount++;
                    weeklyTransferSpent += swapFee;

                  } else {
                    // No immediate buyer — just list the player so the market can handle it
                    worstAtPos.isTransferListed = true;
                  }
                }
              }
            }
          }
        }
      }
    } // end while (buysThisWeek)

    // ========== 3. AI REQUESTING PLAYERS FROM USER (Position-Based) ==========
    // AI teams can make offers for user's non-listed players IF they need that position
    // Reduced to 8% chance per team to prevent spam (was 30%)
    if (
      aiTeam.reputation > 6000 &&
      aiTeam.budget > 10000000 &&
      Math.random() < 0.08
    ) {
      // First check what positions AI team needs using our new AI Brain
      // Filter for needs with reasonable urgency (Top priority or secondary needs)
      const aiNeededPositions = squadNeeds
        .filter((n) => n.urgency > 40)
        .map((n) => n.position);

      // Only proceed if AI has positional needs
      if (aiNeededPositions.length > 0) {
        const userPlayers = targetableUserPlayers.filter(
          (p) =>
            gameState.currentWeek - (p.lastTransferWeek || -99) >= 15 && // ANTI-LOOP
            aiNeededPositions.includes(p.position) && // MUST match needed position
            p.value < aiTeam.budget * 0.6 &&
            (playerOffersThisWeek.get(p.id) || 0) < MAX_OFFERS_PER_PLAYER, // Cap offers per player
        );

        if (userPlayers.length > 0) {
          // Prefer players in most needed position
          const targetPlayer =
            userPlayers[Math.floor(Math.random() * userPlayers.length)];
          // Smart AI targets specific players — they know the value, offer accordingly
          // 135%-200%: these are targeted approaches, not random bids
          let offerMultiplier = 1.35 + Math.random() * 0.65;
          // Extra premium if AI team is significantly bigger than user
          if (aiTeam.reputation > (userTeam?.reputation || 5000) + 2000) {
            offerMultiplier += 0.25; // Big club buying from smaller — should feel generous
          }
          const offerAmount = Math.floor(targetPlayer.value * offerMultiplier);

          // Create a proper offer that user can accept/reject
          const offer = {
            id: uuid(),
            playerId: targetPlayer.id,
            playerName: `${targetPlayer.firstName} ${targetPlayer.lastName}`,
            fromTeamId: gameState.userTeamId,
            fromTeamName: userTeam?.name || "Your Team",
            toTeamId: aiTeam.id,
            offerAmount,
            status: "PENDING" as const,
            weekCreated: gameState.currentWeek,
          };

          newOffers.push(offer);
          // Track offers per player this week to prevent spam
          playerOffersThisWeek.set(targetPlayer.id, (playerOffersThisWeek.get(targetPlayer.id) || 0) + 1);

          newMessages.push({
            id: uuid(),
            week: gameState.currentWeek,
            type: MessageType.TRANSFER_OFFER,
            subject: t.transferOfferSubject
              .replace("{team}", aiTeam.name)
              .replace("{name}", targetPlayer.lastName),
            body: t.transferOfferBody
              .replace("{team}", aiTeam.name)
              .replace("{amount}", (offerAmount / 1000000).toFixed(1))
              .replace(
                "{name}",
                `${targetPlayer.firstName} ${targetPlayer.lastName}`,
              ),
            isRead: false,
            date: new Date().toISOString(),
            data: { offerId: offer.id },
          });
        }
      }
    }

    // ========== 3. TACTICAL EVOLUTION (AI COACH) ==========
    // Every 4 weeks, evaluate if the tactic fits the players
    if (gameState.currentWeek % 4 === 0) {
      const squad = getIndexedTeamPlayers(aiTeam.id);
      const fit = AIService.evaluateTacticalFit(aiTeam, squad);

      // If fit is poor (negative score) and coach is adaptable (simplified randomness for now)
      if (fit.fitScore < -20 && Math.random() < 0.6) {
        const newFormation = AIService.suggestBestTacticForSquad(squad);
        if (newFormation !== aiTeam.tactic.formation) {
          aiTeam.tactic.formation = newFormation;

          // Simple style adjustment based on formation
          // Keep formation identity aligned so teams don't collapse back into the same two styles.
          if (newFormation.includes("5-")) aiTeam.tactic.style = "Counter";
          else if (newFormation === TacticType.T_433 || newFormation === TacticType.T_343)
            aiTeam.tactic.style = "HighPress";
          else if (newFormation === TacticType.T_4231 || newFormation === TacticType.T_4321)
            aiTeam.tactic.style = "Possession";
          else if (newFormation === TacticType.T_41212)
            aiTeam.tactic.style = "Attacking";
          else if (newFormation === TacticType.T_451 || newFormation === TacticType.T_4141)
            aiTeam.tactic.style = "Defensive";
          else aiTeam.tactic.style = "Balanced";

          // Tactical shifts are internal AI decisions — not shown to user (noise)
        }
      }
    }

    // ========== 4. SMART SELLING - Performance-based (TIGHTENED) ==========
    // Only sell from BLOATED squads, and only truly weak players
    // Star players (70+ OVR) are NEVER sold through this path
    if (teamPlayers.length > 25 && Math.random() < 0.05) {
      const sellCandidates = teamPlayers
        .filter(
          (p) =>
            p.lineup !== "STARTING" &&
            p.overall < 70 && // HARD FLOOR: Never auto-sell 70+ OVR players
            gameState.currentWeek - (p.lastTransferWeek || -99) >= 10 &&
            (p.overall < avgOverall - 15 || // FAR below team average (was -8)
              (p.age > 32 && p.overall < 65) || // Very old AND very weak
              p.morale < 30), // Extremely unhappy
        )
        .sort((a, b) => a.overall - b.overall);

      if (sellCandidates.length > 0) {
        const playerToSell = sellCandidates[0];

        // Find interested buyers
        const interestedBuyers = allAiTeams.filter(
          (t) =>
            t.id !== aiTeam.id &&
            t.budget > playerToSell.value * 0.7 &&
            t.reputation < aiTeam.reputation, // Usually sell to smaller clubs
        );

        if (interestedBuyers.length > 0) {
          const buyer =
            interestedBuyers[
            Math.floor(Math.random() * interestedBuyers.length)
            ];
          const transferFee = Math.floor(
            playerToSell.value * (0.85 + Math.random() * 0.2),
          );

          trackPlayerTeamChange(playerToSell, buyer.id);
          playerToSell.lineup = "RESERVE";
          playerToSell.lineupIndex = 99;
          playerToSell.lastTransferWeek = gameState.currentWeek;

          // Buyer pays 10% tax, seller (AI) pays 6% tax
          const sellBuyerTax = Math.floor(transferFee * 0.10);
          const sellSellerTax = Math.floor(transferFee * 0.06);
          adjustTeamBudget(aiTeam.id, transferFee - sellSellerTax);
          adjustTeamBudget(buyer.id, -(transferFee + sellBuyerTax));
          gameState.transferTaxPot = (gameState.transferTaxPot || 0) + sellBuyerTax + sellSellerTax;

          // Show message if: (a) user's league involved (all transfers), OR (b) player is 80+ OVR worldwide
          const userLeagueIdSell = userTeam?.leagueId;
          const isSellRelevantLeague = aiTeam.leagueId === userLeagueIdSell || buyer.leagueId === userLeagueIdSell;
          const isSellWorldwideNotable = playerToSell.overall >= 80;
          const isSellRelevant = isSellRelevantLeague || isSellWorldwideNotable;

          if (isSellRelevant) {
            newMessages.push({
              id: uuid(),
              week: gameState.currentWeek,
              type: MessageType.INFO,
              subject: t.transferNewsSubject,
              body: t.transferSignedBody
                .replace("{team}", buyer.name)
                .replace(
                  "{name}",
                  `${playerToSell.firstName} ${playerToSell.lastName}`,
                )
                .replace("{fromTeam}", aiTeam.name)
                .replace("{amount}", (transferFee / 1000000).toFixed(1))
                .replace("{position}", playerToSell.position),
              isRead: false,
              date: new Date().toISOString(),
            });
          }
        }
      }
    }

    // ========== 5. SMART CONTRACT RENEWAL ==========
    // AI teams renew contracts of important players before they expire
    teamPlayers.forEach((player) => {
      if (player.contractYears <= 1 && player.overall >= avgOverall - 5) {
        // Important player with expiring contract - renew! (also renew players slightly below avg to prevent squad holes)
        if (aiTeam.budget > 0) {
          player.contractYears += 2 + Math.floor(Math.random() * 2); // 2-3 year extension
        }
      }
    });

    // ========== 6. AI TRANSFER LISTING & CONTRACT TERMINATION ==========
    // AI teams should only list genuine surplus / distressed assets.
    // Rich clubs must keep a strong second unit instead of flooding the market with stars.
    const squadSize = teamPlayers.length;
    const formationSlots = AIService.getFormationSlotCounts(aiTeam.tactic.formation);
    const weeklyWageBill = teamPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
    const budgetRunwayWeeks = weeklyWageBill > 0 ? aiTeam.budget / weeklyWageBill : 999;
    const eliteClub =
      aiTeam.reputation >= 8500 ||
      aiTeam.budget >= 250_000_000 ||
      avgOverall >= 80;
    const strongClub =
      eliteClub ||
      aiTeam.reputation >= 7800 ||
      aiTeam.budget >= 120_000_000 ||
      avgOverall >= 77;
    const financialPressure =
      aiTeam.budget < 0 ||
      budgetRunwayWeeks < (eliteClub ? 18 : 12);
    const reserveDepthBuffer = eliteClub ? 3 : 2;
    const coreProtectionCount = Math.min(
      squadSize,
      eliteClub ? 22 : strongClub ? 20 : 18,
    );
    // Fully relative: no hard floor so high-OVR squads still list their weakest players
    const minimumListableOverall = Math.round(avgOverall - (eliteClub ? 5 : strongClub ? 4 : 4));
    const positionCounts = {
      [Position.GK]: teamPlayers.filter((p) => p.position === Position.GK).length,
      [Position.DEF]: teamPlayers.filter((p) => p.position === Position.DEF).length,
      [Position.MID]: teamPlayers.filter((p) => p.position === Position.MID).length,
      [Position.FWD]: teamPlayers.filter((p) => p.position === Position.FWD).length,
    };

    // Protect the core squad by OVR.
    const squadSortedByOvr = [...teamPlayers].sort((a, b) => b.overall - a.overall);
    const protectedFromListing = new Set(
      squadSortedByOvr.slice(0, coreProtectionCount).map((p) => p.id),
    );
    const hasPositionalSurplus = (player: Player) =>
      positionCounts[player.position] > (formationSlots[player.position] || 1) + reserveDepthBuffer;
    const canListDepthPlayer = (player: Player) =>
      player.lineup !== "STARTING" &&
      !protectedFromListing.has(player.id) &&
      player.overall <= minimumListableOverall &&
      hasPositionalSurplus(player);

    // === STEP 0: WEEKLY DELIST - Remove transfer listing from players who no longer qualify ===
    // Only delist if promoted to protected core or became a starter — keep market moving
    teamPlayers.forEach((p) => {
      if (p.isTransferListed) {
        const shouldDelist =
          protectedFromListing.has(p.id) ||
          p.lineup === "STARTING";
        if (shouldDelist) {
          p.isTransferListed = false;
        }
      }
    });

    // A) Squad bloat - list surplus players or terminate contracts
    const shouldForceSquadTrim = squadSize >= (eliteClub ? 28 : 26);
    if (shouldForceSquadTrim) {
      const listCandidates = teamPlayers
        .filter((p) => canListDepthPlayer(p) && !p.isTransferListed)
        .sort((a, b) => a.overall - b.overall);

      if (listCandidates.length > 0) {
        const terminationCount = financialPressure
          ? Math.min(listCandidates.length, squadSize >= 34 ? 2 : 1)
          : 0;
        listCandidates.slice(0, terminationCount).forEach((toTerminate) => {
          trackPlayerTeamChange(toTerminate, "FREE_AGENT");
          toTerminate.lineup = "RESERVE";
          toTerminate.isTransferListed = false;
          adjustTeamBudget(aiTeam.id, -(toTerminate.value * 0.1));
        });

        // List only 1-2 extra surplus after terminations
        listCandidates
          .slice(terminationCount, terminationCount + 2)
          .forEach((candidate) => {
            candidate.isTransferListed = true;
          });
      }
    } else if (squadSize > 23 && Math.random() < 0.35) {
      // Mild surplus (23-27 players) — list 1 weakest player
      const listCandidates = teamPlayers
        .filter((p) => canListDepthPlayer(p) && !p.isTransferListed)
        .sort((a, b) => a.overall - b.overall);
      if (listCandidates.length > 0) {
        listCandidates[0].isTransferListed = true;
      }
    }

    // C) Proactive quality listing — list weak surplus players even without squad bloat
    // This enables "upgrade ladder": sell weak rotation player to fund a better one
    // Runs every 3 weeks to avoid market flooding
    if (gameState.currentWeek % 3 === 0) {
      (["DEF", "MID", "FWD", "GK"] as Position[]).forEach((pos) => {
        const posPlayers = teamPlayers.filter(p => p.position === pos).sort((a, b) => b.overall - a.overall);
        const posRequired = (formationSlots[pos] || 1) + 1; // starters + 1 backup
        const posSurplus = posPlayers.length > posRequired;
        if (!posSurplus) return;

        const posAvg = posPlayers.reduce((s, p) => s + p.overall, 0) / posPlayers.length;
        // Find weakest non-starter who is notably below position average
        const upgradeCandidate = posPlayers
          .filter(p => p.lineup !== "STARTING" && !p.isTransferListed && canListDepthPlayer(p))
          .find(p => p.overall < posAvg - 5);

        if (upgradeCandidate) {
          upgradeCandidate.isTransferListed = true;
        }
      });
    }

    // B) Crippling contracts - Force terminate only truly bankrupting players
    if (financialPressure) {
      teamPlayers.forEach((p) => {
        const cripplingWage = p.salary > aiTeam.budget * 0.4 && p.salary > 10_000_000;
        if (cripplingWage) {
          if (p.overall < 90 || aiTeam.budget < 0) {
            trackPlayerTeamChange(p, "FREE_AGENT");
            p.lineup = "RESERVE";
            p.isTransferListed = false;
            adjustTeamBudget(aiTeam.id, -(p.value * 0.05));
          }
        }
      });
    }

    // C) Aging players — list if old and not a starter, no surplus required
    if (Math.random() < 0.2) {
      const agingCandidate = teamPlayers.find((p) =>
        !p.isTransferListed &&
        !protectedFromListing.has(p.id) &&
        p.age > 32 &&
        p.overall <= minimumListableOverall &&
        p.lineup !== "STARTING"
      );
      if (agingCandidate) {
        agingCandidate.isTransferListed = true;
      }
    }

    // D) Unhappy players — list if morale is extremely low
    if (Math.random() < 0.2) {
      const unhappyCandidate = teamPlayers.find((p) =>
        !p.isTransferListed &&
        !protectedFromListing.has(p.id) &&
        p.lineup !== "STARTING" &&
        (p.morale || 75) < 25
      );
      if (unhappyCandidate) {
        unhappyCandidate.isTransferListed = true;
      }
    }

    // E) Value cycling — list a non-core reserve with meaningful market value
    if (Math.random() < 0.2) {
      const valueCycleCandidate = teamPlayers
        .filter((p) =>
          !p.isTransferListed &&
          !protectedFromListing.has(p.id) &&
          p.lineup !== "STARTING" &&
          p.value >= 4_000_000
        )
        .sort((a, b) => b.value - a.value)[0]; // list most valuable unprotected reserve
      if (valueCycleCandidate) {
        valueCycleCandidate.isTransferListed = true;
      }
    }
  });

  // ========== WEEKLY TRANSFER SUMMARY ==========
  // REMOVED: Global weekly summary was noise (showed all 48 leagues)
  // Individual transfer news is already filtered to user's league above

  // GARBAGE COLLECTION (User Request):
  // Delete Free Agents who are "Dead Weight" (prevent save bloat)
  // Run this check periodically (e.g., every 4 weeks)
  if (gameState.currentWeek % 4 === 0) {
    const initialCount = updatedPlayers.length;
    const currentSeason = gameState.currentSeason;

    // Mark newly unemployed players with their free agent season
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.teamId === "FREE_AGENT" && p.freeAgentSince === undefined) {
        return { ...p, freeAgentSince: currentSeason };
      }
      return p;
    });

    // Criteria for deletion:
    // 1. Age > 24 + OVR < 70 (not useful)
    // 2. Age > 32 (retired de-facto)
    // 3. Free agent for 2+ seasons (time-based cleanup)
    updatedPlayers = updatedPlayers.filter((p) => {
      if (p.teamId !== "FREE_AGENT") return true; // Keep employed players

      const seasonsAsFreeAgent = p.freeAgentSince !== undefined ? currentSeason - p.freeAgentSince : 0;
      const isDeadWeight = (p.age > 24 && p.overall < 70) || p.age > 32 || seasonsAsFreeAgent >= 2;
      return !isDeadWeight;
    });

    const freeAgents = updatedPlayers.filter((p) => p.teamId === "FREE_AGENT");
    const MAX_FREE_AGENTS = 180;
    if (freeAgents.length > MAX_FREE_AGENTS) {
      const keepFreeAgentIds = new Set(
        [...freeAgents]
          .sort((a, b) => {
            const desirabilityA = a.overall + Math.max(0, a.potential - a.overall) + (24 - Math.min(24, a.age));
            const desirabilityB = b.overall + Math.max(0, b.potential - b.overall) + (24 - Math.min(24, b.age));
            return desirabilityB - desirabilityA;
          })
          .slice(0, MAX_FREE_AGENTS)
          .map((p) => p.id),
      );

      updatedPlayers = updatedPlayers.filter(
        (p) => p.teamId !== "FREE_AGENT" || keepFreeAgentIds.has(p.id),
      );
    }

    const deletedCount = initialCount - updatedPlayers.length;
    if (deletedCount > 0) {
    }
  }

  // ========== WEEKLY TRANSFER SUMMARY MESSAGE ==========
  if (weeklyTransferCount > 0) {
    const otherLeagueCount = weeklyTransferCount - weeklyUserLeagueTransferCount;
    const summaryBody = otherLeagueCount > 0
      ? `Bu hafta dünya genelinde ${weeklyTransferCount} transfer gerçekleşti (toplam €${(weeklyTransferSpent / 1000000).toFixed(0)}M). Diğer ligler: ${otherLeagueCount} transfer.`
      : `Bu hafta ${weeklyTransferCount} transfer gerçekleşti (toplam €${(weeklyTransferSpent / 1000000).toFixed(0)}M).`;
    newMessages.push({
      id: uuid(),
      week: gameState.currentWeek,
      type: MessageType.INFO,
      subject: "Haftalık Transfer Özeti",
      body: summaryBody,
      isRead: true, // auto-read — not actionable
      date: new Date().toISOString(),
    });
  }

  if (updatedManagerProfile && !hydratedState.isUnemployed && managerSalary > 0) {
    newMessages.push({
      id: uuid(),
      week: gameState.currentWeek,
      type: MessageType.INFO,
      subject: "Manager Salary Paid",
      body: (t.managerSalaryPaidBody || 'Haftalik maas odemeniz yatirildi: €{salary}. Kisisel bakiye: €{balance}').replace('{salary}', managerSalary.toLocaleString()).replace('{balance}', updatedManagerProfile.personalBalance.toLocaleString()),
      isRead: false,
      date: new Date().toISOString(),
    });
  }

  return {
    updatedTeams,
    updatedPlayers,
    updatedMarket: gameState.transferMarket,
    updatedManagerProfile,
    report,
    transferNews: [],
    offers: newMessages,
    newPendingOffers: newOffers,
    marketInflationMultiplier: weeklyInflationMultiplier,
  };
};

// ========== SUPER CUP (CL Winner vs UEFA Cup Winner) ==========
// ========== SUPER CUP (CL Winner vs UEFA Cup Winner) ==========
// Returns the last scheduled week among league fixtures (dynamic season length support).
export const getLastLeagueWeek = (matches: Match[]): number => {
  if (!matches || matches.length === 0) return 38;
  const leagueMatches = matches.filter((m) => {
    if (m.isFriendly) return false;
    // Prefer explicit typing
    if (m.type) return m.type === "LEAGUE";
    // Heuristic fallback: league fixtures generally have no competition metadata
    if (m.competitionId || m.competitionName) return false;
    return true;
  });
  if (leagueMatches.length === 0) return 38;
  return Math.max(38, ...leagueMatches.map((m) => m.week || 0));
};

// Super Cup is ALWAYS week 39 (fixed calendar slot)
export const SUPER_CUP_WEEK = 39;

// === AI TACTICS SELECTION ===
export const autoPickTactics = (team: Team, opponent?: Team, players: Player[] = []) => {
  // 1. Determine Mentality based on relative strength
  // Use reputation as proxy for overall strength (1000-10000 range)
  const myRating = team.reputation || 4000;
  const oppRating = opponent?.reputation || 4000;
  const strengthDiff = (myRating - oppRating) / 100; // Normalize to approx -50 to 50 range
  const squad = players.filter((p) => p.teamId === team.id && p.lineup === 'STARTING');
  const average = (selector: (p: Player) => number, fallback = 50) => {
    if (squad.length === 0) return fallback;
    return squad.reduce((sum, player) => sum + selector(player), 0) / squad.length;
  };
  const pace = average((p) => ((p.attributes.speed || 50) + (p.attributes.stamina || 50)) / 2);
  const craft = average((p) => ((p.attributes.vision || 50) + (p.attributes.passing || 50) + (p.attributes.dribbling || 50)) / 3);
  const solidity = average((p) => ((p.attributes.positioning || 50) + (p.attributes.tackling || 50) + (p.attributes.strength || 50)) / 3);
  const finishing = average((p) => p.attributes.finishing || 50);
  const wideThreat = average((p) => ((p.attributes.speed || 50) + (p.attributes.dribbling || 50)) / 2);
  const formation = team.tactic.formation || TacticType.T_442;
  const formationText = String(formation);

  let mentality: "Attacking" | "Balanced" | "Defensive" = "Balanced";
  if (strengthDiff > 10) mentality = "Attacking";
  else if (strengthDiff < -10) mentality = "Defensive";

  // 2. Determine Style using the same high-level ideas as the new tactic UI.
  let style: "Attacking" | "Possession" | "Counter" | "Balanced" | "Defensive" = "Balanced";
  if (formationText.includes('5-')) {
    style = pace > 70 ? 'Counter' : 'Defensive';
  } else if (formation === TacticType.T_433 || formation === TacticType.T_343) {
    style = pace > 72 ? 'Attacking' : craft > 72 ? 'Possession' : 'Balanced';
  } else if (formation === TacticType.T_4231 || formation === TacticType.T_4321) {
    style = craft > 71 ? 'Possession' : 'Balanced';
  } else if (formation === TacticType.T_541 || formation === TacticType.T_451 || formation === TacticType.T_4141) {
    style = mentality === 'Attacking' ? 'Counter' : 'Defensive';
  } else if (mentality === 'Attacking') {
    style = pace > 70 ? 'Attacking' : 'Possession';
  } else if (mentality === 'Defensive') {
    style = solidity > 68 ? 'Defensive' : 'Counter';
  } else {
    style = craft > 72 ? 'Possession' : pace > 71 ? 'Counter' : 'Balanced';
  }

  if (strengthDiff > 14 && style === 'Defensive') style = 'Counter';
  if (strengthDiff < -14 && style === 'Attacking') style = 'Balanced';

  // 3. Set Aggression
  // Default to Normal, but vary based on match importance or team history?
  // User requested "Normal" buff, so AI using Normal is good.
  // Occasionally use Aggressive for weaker teams trying to compensate?
  let aggression: "Safe" | "Normal" | "Aggressive" | "Reckless" = "Normal";
  if (Math.random() < 0.2) aggression = "Aggressive";
  if (strengthDiff < -15 && Math.random() < 0.3) aggression = "Reckless"; // Desperate
  if (strengthDiff > 15 && Math.random() < 0.3) aggression = "Safe"; // Comfortable

  let passingStyle: TeamTactic['passingStyle'] = 'Mixed';
  let tempo: TeamTactic['tempo'] = 'Normal';
  let width: TeamTactic['width'] = 'Balanced';
  let defensiveLine: TeamTactic['defensiveLine'] = 'Balanced';
  let pressingIntensity: TeamTactic['pressingIntensity'] = 'Balanced';
  const instructions: string[] = [];

  if (style === 'Possession') {
    passingStyle = 'Short';
    tempo = pace > 72 ? 'Normal' : 'Slow';
    width = wideThreat > 74 ? 'Balanced' : 'Narrow';
    defensiveLine = mentality === 'Defensive' ? 'Balanced' : 'Balanced';
    pressingIntensity = pace > 71 ? 'Balanced' : 'StandOff';
    instructions.push('WorkBallIntoBox');
    if (craft > 74 && (formation === TacticType.T_433 || formation === TacticType.T_4231 || formation === TacticType.T_4321)) {
      instructions.push('RoamFromPosition');
    }
  } else if (style === 'Counter') {
    passingStyle = 'Direct';
    tempo = 'Fast';
    width = wideThreat > 69 ? 'Wide' : 'Balanced';
    defensiveLine = mentality === 'Attacking' ? 'Balanced' : 'Deep';
    pressingIntensity = pace > 73 && mentality !== 'Defensive' ? 'HighPress' : 'StandOff';
  } else if (style === 'Attacking') {
    passingStyle = craft > 70 ? 'Mixed' : 'Direct';
    tempo = 'Fast';
    width = wideThreat > 70 ? 'Wide' : 'Balanced';
    defensiveLine = pace > 70 ? 'High' : 'Balanced';
    pressingIntensity = pace > 71 ? 'HighPress' : 'Balanced';
    if (finishing > 76 && craft < 70) instructions.push('ShootOnSight');
    if (craft > 73) instructions.push('RoamFromPosition');
  } else if (style === 'Defensive') {
    passingStyle = pace > 68 ? 'Direct' : 'Mixed';
    tempo = 'Normal';
    width = formationText.includes('5-') ? 'Narrow' : 'Balanced';
    defensiveLine = 'Deep';
    pressingIntensity = 'StandOff';
  } else {
    passingStyle = craft > 70 ? 'Mixed' : 'Direct';
    tempo = pace > 71 ? 'Fast' : 'Normal';
    width = wideThreat > 72 ? 'Wide' : 'Balanced';
    defensiveLine = mentality === 'Defensive' ? 'Deep' : 'Balanced';
    pressingIntensity = pace > 74 && solidity > 67 ? 'HighPress' : 'Balanced';
    if (finishing > 78 && craft < 69) instructions.push('ShootOnSight');
  }

  if (mentality === 'Attacking' && pressingIntensity === 'HighPress' && pace > 76 && solidity > 70) {
    pressingIntensity = 'Gegenpress';
  }

  const dedupedInstructions = Array.from(new Set(instructions));

  // 4. Apply to Team Tactic
  // We update the team object directly for this match context
  team.tactic = {
    ...team.tactic,
    mentality,
    style: style as any,
    aggression,
    width,
    defensiveLine,
    passingStyle,
    tempo,
    pressingIntensity,
    marking: 'Zonal',
    instructions: dedupedInstructions,
  };

  team.tactic = applyAITacticMemoryPreference(team, team.tactic);

  if (players.length > 0) {
    assignAIPlayerInstructions(team.tactic, players);
  }

  return team;
};

export const generateSuperCup = (
  gameState: GameState,
): SuperCup | undefined => {
  const clWinner = gameState.europeanCup?.winnerId;
  const elWinner = gameState.europaLeague?.winnerId;

  if (!clWinner || !elWinner) {
    console.warn(
      `[Super Cup] Cannot generate - missing winners. CL: ${clWinner}, EL: ${elWinner}`,
    );
    return undefined;
  }

  const superCupWeek = SUPER_CUP_WEEK; // Always week 39

  const superCup: SuperCup = {
    season: gameState.currentSeason,
    championsLeagueWinnerId: clWinner,
    uefaCupWinnerId: elWinner,
    match: {
      id: uuid(),
      stage: "FINAL",
      homeTeamId: clWinner,
      awayTeamId: elWinner,
      homeScore: 0,
      awayScore: 0,
      isPlayed: false,
      week: superCupWeek,
    },
    winnerId: undefined,
    isComplete: false,
  };

  return superCup;
};

export const checkAndScheduleSuperCup = (gameState: GameState): GameState => {
  // 0. CLEANUP PHANTOM SUPER CUPS (Legacy Save Fix)
  // If Super Cup exists but Champions League winner is not determined yet, it's invalid (from previous save logic).
  if (gameState.superCup && !gameState.superCup.isComplete) {
    const clWinner = gameState.europeanCup?.winnerId;
    const elWinner = gameState.europaLeague?.winnerId;
    if (!clWinner || !elWinner) {
      return { ...gameState, superCup: undefined };
    }
  }

  // Super Cup is always week 39 - only start checking from week 38
  if (gameState.currentWeek < SUPER_CUP_WEEK - 1) return gameState;

  // Schedule as soon as winners exist (week is set dynamically to lastLeagueWeek+1)
  if (gameState.superCup) return gameState; // Already scheduled

  const superCup = generateSuperCup(gameState);
  if (!superCup) return gameState;

  return { ...gameState, superCup };
};

export const processSeasonEnd = (gameState: GameState, t: any = {}) => {
  // === MEMORY OPTIMIZATION ===
  // Clear old history to prevent save file bloat

  // 1. Limit Team History (Last 5 seasons)
  gameState.teams.forEach((team) => {
    if (team.reputationHistory && team.reputationHistory.length > 5) {
      team.reputationHistory = team.reputationHistory.slice(-5);
    }
    if (team.confidenceHistory && team.confidenceHistory.length > 90) {
      // Keep ~2 seasons of weekly data
      team.confidenceHistory = team.confidenceHistory.slice(-90);
    }
  });

  // 2. Limit Match History (Last 3 seasons for matches to save space)
  if (gameState.matches.length > 2000) {
    const currentSeason = gameState.currentSeason;
    gameState.matches = gameState.matches.filter(
      (m) => m.season >= currentSeason - 2,
    );
  }

  // === AI FACILITY UPGRADES ===
  // AI teams invest in their facilities based on budget
  gameState.teams.forEach((team) => {
    if (team.id === gameState.userTeamId) return; // Skip user team

    // Base cost logic from ClubManagement
    const getCost = (level: number) =>
      Math.floor(500000 * (level + 1) * (1 + (level + 1) * 0.05));

    // Rich teams upgrade more aggressively — otherwise budget piles up indefinitely
    const isRich = team.budget > 200_000_000;
    const upgradeChanceBoost = isRich ? 0.2 : 0;

    // Check Academy (Priority 1) — max level 8
    if (team.facilities.academyLevel < 8 && Math.random() < 0.7 + upgradeChanceBoost) {
      const cost = Math.floor(
        600000 *
        (team.facilities.academyLevel + 1) *
        (1 + (team.facilities.academyLevel + 1) * 0.1),
      );
      const budgetMultiplier = isRich ? 1.5 : 2.5;
      if (team.budget > cost * budgetMultiplier) {
        team.budget -= cost;
        team.facilities.academyLevel += 1;
      }
    }

    // Check Training (Priority 2) — max level 8
    if (team.facilities.trainingLevel < 8 && Math.random() < 0.6 + upgradeChanceBoost) {
      const cost = getCost(team.facilities.trainingLevel);
      const budgetMultiplier = isRich ? 1.5 : 2.5;
      if (team.budget > cost * budgetMultiplier) {
        team.budget -= cost;
        team.facilities.trainingLevel += 1;
      }
    }

    // Check Stadium (Priority 3) — max level 10
    if (team.facilities.stadiumLevel < 10 && Math.random() < 0.4 + upgradeChanceBoost) {
      const cost = getCost(team.facilities.stadiumLevel);
      const budgetMultiplier = isRich ? 2 : 3;
      if (team.budget > cost * budgetMultiplier) {
        team.budget -= cost;
        team.facilities.stadiumLevel += 1;
        team.facilities.stadiumCapacity += 12500;
      }
    }

    // Check Staff (Priority 4) — max level 8, cheaper than facilities
    // Run 2 attempts per season so staff levels up at similar pace to facilities
    if (!team.staff) team.staff = { headCoachLevel: 1, scoutLevel: 1, physioLevel: 1 };
    const staffCost = (level: number) => Math.floor(100000 * Math.pow(1.5, level));
    const staffBudgetMult = isRich ? 1.5 : 2.5;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (team.staff.headCoachLevel < 8 && Math.random() < 0.6 + upgradeChanceBoost) {
        const cost = staffCost(team.staff.headCoachLevel);
        if (team.budget > cost * staffBudgetMult) {
          team.budget -= cost;
          team.staff.headCoachLevel += 1;
        }
      }
      if (team.staff.scoutLevel < 8 && Math.random() < 0.7 + upgradeChanceBoost) {
        const cost = staffCost(team.staff.scoutLevel);
        if (team.budget > cost * staffBudgetMult) {
          team.budget -= cost;
          team.staff.scoutLevel += 1;
        }
      }
      if (team.staff.physioLevel < 8 && Math.random() < 0.5 + upgradeChanceBoost) {
        const cost = staffCost(team.staff.physioLevel);
        if (team.budget > cost * staffBudgetMult) {
          team.budget -= cost;
          team.staff.physioLevel += 1;
        }
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

  // ========== MARKET INFLATION SYSTEM (REAL ECONOMY) ==========
  // Pure supply-demand: inflation tracks total money across ALL leagues
  // More money in the economy → higher player values (inflation)
  // Less money in the economy → lower player values (deflation)
  // This creates a living, breathing transfer market that mirrors real-world economics
  const INITIAL_TOTAL_BUDGETS = 28_000_000_000; // ~800 teams × €35M avg starting budget // €2B baseline at season 1
  const totalLeagueBudgets = gameState.teams.reduce(
    (sum, t) => sum + Math.max(0, t.budget),
    0,
  );
  // sqrt ratio: floor 0.5x, cap 4x — mirrors weekly formula to stay in sync
  const inflationMultiplier = Math.min(4.0, Math.max(0.5, Math.sqrt(totalLeagueBudgets / INITIAL_TOTAL_BUDGETS)));

  console.log(
    `[Season End] Market Inflation: Total Budgets €${(totalLeagueBudgets / 1000000).toFixed(0)}M, Multiplier: ${inflationMultiplier.toFixed(2)}x`,
  );

  // 1. Calculate Seasonal Performance (Continental Points)
  // === BALANCED COEFFICIENT SYSTEM (User Requested) ===
  // Win = 3, Draw = 1, Penalties = +1
  // Round Bonuses: R16=+2, QF=+2, SF=+3, Final=+3, Winner=+5
  const leagueSeasonalPoints: Record<string, number> = {};
  const leagueTeamCounts: Record<string, Set<string>> = {}; // Track unique teams per league

  const processMatchPoints = (
    m: EuropeanCupMatch | Match,
    isSuperCup: boolean = false,
    multiplier: number = 1.0,
  ) => {
    if (!m.isPlayed) return;

    // Find teams
    const home = gameState.teams.find((t) => t.id === m.homeTeamId);
    const away = gameState.teams.find((t) => t.id === m.awayTeamId);
    if (!home || !away) return;

    // [COEFF DEBUG] log removed

    let homePts = 0;
    let awayPts = 0;

    // 90min Result (Standard 3/1/0)
    if (m.homeScore > m.awayScore) homePts += 3;
    else if (m.homeScore < m.awayScore) awayPts += 3;
    else {
      homePts += 1;
      awayPts += 1;
    }

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
      if (stage === "ROUND_16") {
        // Bonus for REACHING Round of 16 (Qualifying from groups)
        bonus = 2;
        // Both teams get this bonus for qualifying
        homePts += 2;
        awayPts += 2;
      } else if (stage === "QUARTER") bonus = 2;
      else if (stage === "SEMI") bonus = 3;
      else if (stage === "FINAL") {
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
    leagueSeasonalPoints[home.leagueId] =
      (leagueSeasonalPoints[home.leagueId] || 0) + homePts;
    leagueSeasonalPoints[away.leagueId] =
      (leagueSeasonalPoints[away.leagueId] || 0) + awayPts;

    // [COEFF DEBUG] point logs removed

    // Track unique teams per league
    if (!leagueTeamCounts[home.leagueId])
      leagueTeamCounts[home.leagueId] = new Set();
    if (!leagueTeamCounts[away.leagueId])
      leagueTeamCounts[away.leagueId] = new Set();
    leagueTeamCounts[home.leagueId].add(home.id);
    leagueTeamCounts[away.leagueId].add(away.id);
  };

  // Process ALL Matches
  // UPDATED: Use proper groups/knockout iteration for Global Cup
  if (gameState.europeanCup) {
    if (gameState.europeanCup.groups) {
      gameState.europeanCup.groups.forEach((g) =>
        g.matches.forEach((m) => processMatchPoints(m, false, 1.0)),
      );
    }
    if (gameState.europeanCup.knockoutMatches) {
      gameState.europeanCup.knockoutMatches.forEach((m) =>
        processMatchPoints(m, false, 1.0),
      );
    }
    // Fallback for legacy .matches
    if ((gameState.europeanCup as any).matches) {
      (gameState.europeanCup as any).matches.forEach((m: any) =>
        processMatchPoints(m, false, 1.0),
      );
    }
  }

  // Europa League (Challenge Cup) - Multiplier 1.0 (Same as Elite)
  if (gameState.europaLeague) {
    if (gameState.europaLeague.groups) {
      // Check groups first (New system)
      gameState.europaLeague.groups.forEach((g) =>
        g.matches.forEach((m) => processMatchPoints(m, false, 1.0)),
      );
    }
    if (gameState.europaLeague.knockoutMatches) {
      gameState.europaLeague.knockoutMatches.forEach((m) =>
        processMatchPoints(m, false, 1.0),
      );
    }
    // Fallback for legacy
    if ((gameState.europaLeague as any).matches) {
      (gameState.europaLeague as any).matches.forEach((m: any) =>
        processMatchPoints(m, false, 1.0),
      );
    }
  }

  // Super Cup (Week 39) - Multiplier 1.0 (Points are small/fixed anyway)
  if (gameState.superCup && gameState.superCup.match)
    processMatchPoints(gameState.superCup.match, true, 1.0);

  // === 5-YEAR HISTORY UPDATE ===
  // Update global state - SUM ONLY (User Request: No Division)
  // FIX: Use ALL league IDs from gameState, not just BASE_LEAGUE_REPUTATION
  const leagueIdsForHistory = [
    ...new Set(gameState.teams.map((t) => t.leagueId)),
  ].filter((lid) => lid && lid !== "default");

  leagueIdsForHistory.forEach((lid) => {
    // Init if empty
    if (!LEAGUE_COEFFICIENTS[lid])
      LEAGUE_COEFFICIENTS[lid] = [5.0, 5.0, 5.0, 5.0, 5.0];

    // Calculate season coefficient (PURE SUM - No Division)
    const totalPoints = leagueSeasonalPoints[lid] || 0;

    // === DYNAMIC BASE REPUTATION (2-WAY SYSTEM) ===
    // Ligler hem yükselir hem düşer - İngiltere kötüyse düşer, Kenya iyiyse yükselir!
    // Çin otomobil örneği: BYD 10 yılda Avrupa'yı zorluyor, aynı mantık!
    const currentCoeffTotal = LEAGUE_COEFFICIENTS[lid].reduce(
      (a, b) => a + b,
      0,
    );
    const baseCoeff =
      BASE_COEFFICIENT_VALUES[lid] || BASE_COEFFICIENT_VALUES["default"];
    const currentBaseRep =
      BASE_LEAGUE_REPUTATION[lid] || BASE_LEAGUE_REPUTATION["default"];

    // Her 3 sezonda bir base reputation ayarla (hem yukarı hem aşağı)
    if (gameState.currentSeason % 3 === 0) {
      // DOMINANT LEAGUE (3x+ coefficient): +2 base reputation (SINIRSIZ! - Max 98)
      if (currentCoeffTotal > baseCoeff * 3) {
        const newBaseRep = Math.min(98, currentBaseRep + 2);
        BASE_LEAGUE_REPUTATION[lid] = newBaseRep;
      }
      // WEAK LEAGUE (<0.5x coefficient): -2 base reputation (Min 35)
      // İngiltere 20 sezon kötüyse düşer!
      else if (currentCoeffTotal < baseCoeff * 0.5 && currentBaseRep > 35) {
        const newBaseRep = Math.max(35, currentBaseRep - 2);
        BASE_LEAGUE_REPUTATION[lid] = newBaseRep;
      }
    }

    // DIRECT SUM: Each league's total points from all participating teams
    const seasonCoeff = Number(totalPoints.toFixed(1));

    // [COEFF DEBUG] season points log removed

    // Push NEW season points
    LEAGUE_COEFFICIENTS[lid].push(seasonCoeff);

    // Maintain 5-Year Window (Shift oldest)
    if (LEAGUE_COEFFICIENTS[lid].length > 5) {
      LEAGUE_COEFFICIENTS[lid].shift();
    }
  });

  // UPDATE REPUTATION DIRECTLY (Pure Meritocracy)
  leagueIdsForHistory.forEach((lid) => {
    const history = LEAGUE_COEFFICIENTS[lid] || [];
    const totalScore = history.reduce((a, b) => a + b, 0);

    // Direct assignment. If England gets 105 points, Rep is 105.
    // We update the base reputation map which drives the game
    BASE_LEAGUE_REPUTATION[lid] = totalScore;
    LEAGUE_REPUTATION_BONUS[lid] = 0; // Reset bonuses, pure 5-year coefficient now.

  });

  // ========== DYNAMIC LEAGUE INCOME RANKING ==========
  // All leagues ranked by their 5-year European coefficient sum.
  // Rank 1 always earns the highest multiplier (3.5x), regardless of which league it is.
  // If Turkey reaches rank 1, they earn what England used to earn. England at rank 11 earns what Turkey used to.
  // Smooth transition: move 25% toward target per season to avoid income shocks.
  {
    const allLeagueIds = [...new Set(gameState.teams.map(t => t.leagueId).filter(Boolean))] as string[];

    // Score each league by its 5-year coefficient sum
    const leagueScores = allLeagueIds.map(lid => {
      const history = LEAGUE_COEFFICIENTS[lid] || [];
      const score = history.slice(-5).reduce((s, v) => s + v, 0);
      return { lid, score };
    });

    // Sort best → worst
    leagueScores.sort((a, b) => b.score - a.score);

    // Rank-based target multiplier: rank 1 = 3.5x, -0.25 per rank, floor 0.5x
    const MAX_MULT = 3.5;
    const STEP = 0.25;
    const MIN_MULT = 0.5;

    leagueScores.forEach(({ lid }, idx) => {
      const rank = idx + 1;
      const targetMult = Math.max(MIN_MULT, MAX_MULT - (rank - 1) * STEP);
      const baseEcon = (BASE_LEAGUE_ECON_MULTIPLIERS as any)[lid] || 1.0;
      const targetBonus = targetMult - baseEcon; // can be negative (league declined)

      const currentBonus = LEAGUE_EUROPEAN_BONUS[lid] ?? 0;
      // Smooth 25% transition per season
      const newBonus = currentBonus + (targetBonus - currentBonus) * 0.25;
      LEAGUE_EUROPEAN_BONUS[lid] = Number(newBonus.toFixed(3));
    });

    const top3 = leagueScores.slice(0, 3).map(l => `${l.lid}(${l.score.toFixed(0)}pts)`).join(', ');
    // [LeagueRanking] log removed
  }

  // [SquadWatch] — top teams' squad quality for balance monitoring
  {
    const getSquadAvgOvr = (teamId: string) => {
      const sq = gameState.players.filter((p) => p.teamId === teamId);
      return sq.length === 0 ? 0 : sq.reduce((s, p) => s + p.overall, 0) / sq.length;
    };
    const topTeams = [...gameState.teams]
      .sort((a, b) => getSquadAvgOvr(b.id) - getSquadAvgOvr(a.id))
      .slice(0, 12);
    topTeams.forEach((team) => {
      const squad = gameState.players.filter((p) => p.teamId === team.id);
      if (squad.length === 0) return;
      const byPos: Record<string, number[]> = { GK: [], DEF: [], MID: [], FWD: [] };
      squad.forEach((p) => {
        const key = p.position === "GK" ? "GK" : p.position === "DEF" ? "DEF" : p.position === "MID" ? "MID" : "FWD";
        byPos[key].push(p.overall);
      });
      const fmt = (arr: number[]) =>
        arr.length === 0 ? "-" : `${arr.length}(${Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)})`;
      const avgOvr = Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length);
      const budgetM = Math.round((team.budget || 0) / 1_000_000);
    });
  }

  // [Coef Update] logs removed (too verbose)

  // PERSIST TO GAME STATE
  gameState.baseLeagueReputations = { ...BASE_LEAGUE_REPUTATION };
  gameState.leagueReputationBonuses = { ...LEAGUE_REPUTATION_BONUS };
  gameState.leagueEuropeanBonuses = { ...LEAGUE_EUROPEAN_BONUS };
  gameState.leagueCoefficients = { ...LEAGUE_COEFFICIENTS };


  // 1. Calculate Standings & Awards
  const sensitiveSortedTeams = [...gameState.teams].sort((a, b) => {
    if (b.stats.points !== a.stats.points)
      return b.stats.points - a.stats.points;
    return b.stats.gf - b.stats.ga - (a.stats.gf - a.stats.ga);
  });

  // Get unique league IDs
  const leagueIds = [...new Set(gameState.teams.map((t) => t.leagueId))];
  const leagueNames: Record<string, string> = {
    // Europe
    tr: "🇹🇷 Süper Lig",
    en: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League",
    es: "🇪🇸 La Liga",
    it: "🇮🇹 Serie A",
    de: "🇩🇪 Bundesliga",
    fr: "🇫🇷 Ligue 1",
    pt: "🇵🇹 Liga Portugal",
    nl: "🇳🇱 Eredivisie",
    be: "🇧🇪 Pro League",
    gr: "🇬🇷 Super League",
    ru: "🇷🇺 Premier League",
    pl: "🇵🇱 Ekstraklasa",
    cz: "🇨🇿 First League",
    ro: "🇷🇴 Liga I",
    hr: "🇭🇷 HNL",
    rs: "🇷🇸 SuperLiga",
    ch: "🇨🇭 Super League",
    at: "🇦🇹 Bundesliga",
    sco: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Premiership",

    // Americas
    ar: "🇦🇷 Liga Profesional",
    br: "🇧🇷 Série A",
    mx: "🇲🇽 Liga MX",
    us: "🇺🇸 MLS",
    cl: "🇨🇱 Primera División",
    uy: "🇺🇾 Primera División",
    co: "🇨🇴 Categoría Primera A",
    py: "🇵🇾 División Profesional",
    ec: "🇪🇨 Serie A",
    cr: "🇨🇷 Primera División",
    car: "🏴‍☠️ Caribbean League",

    // Asia
    cn: "🇨🇳 Chinese Super League",
    jp: "🇯🇵 J1 League",
    kr: "🇰🇷 K League 1",
    sa: "🇸🇦 Saudi Pro League",
    in: "🇮🇳 Indian Super League",
    my: "🇲🇾 Super League",
    id: "🇮🇩 Liga 1",

    // Africa
    eg: "🇪🇬 Egyptian Premier League",
    ma: "🇲🇦 Botola Pro",
    za: "🇿🇦 Premier Division",
    ng: "🇳🇬 NPFL",
    dz: "🇩🇿 Ligue 1",
    gh: "🇬🇭 Premier League",
    ci: "🇨🇮 Ligue 1",
    ke: "🇰🇪 Premier League",
    sn: "🇸🇳 Ligue 1",
    tn: "🇹🇳 Ligue 1",

    // Oceania
    au: "🇦🇺 A-League",
  };

  // Create history entry for EACH league
  const historyEntries: LeagueHistoryEntry[] = leagueIds.map((leagueId) => {
    const leagueTeams = gameState.teams.filter((t) => t.leagueId === leagueId);
    const sortedLeague = [...leagueTeams].sort((a, b) => {
      if (b.stats.points !== a.stats.points)
        return b.stats.points - a.stats.points;
      return b.stats.gf - b.stats.ga - (a.stats.gf - a.stats.ga);
    });

    const winner = sortedLeague[0];
    const runnerUp = sortedLeague[1];

    // Find Top Scorer & Assister for this league only
    const leaguePlayerIds = new Set(leagueTeams.map((t) => t.id));
    const leaguePlayers = gameState.players.filter((p) =>
      leaguePlayerIds.has(p.teamId),
    );

    let topScorer = { name: "N/A", count: 0 };
    let topAssister = { name: "N/A", count: 0 };
    let bestRated = { name: "N/A", rating: 0 };

    leaguePlayers.forEach((p) => {
      if (p.stats && p.stats.goals > topScorer.count) {
        topScorer = {
          name: `${p.firstName} ${p.lastName}`,
          count: p.stats.goals,
        };
      }
      if (p.stats && p.stats.assists > topAssister.count) {
        topAssister = {
          name: `${p.firstName} ${p.lastName}`,
          count: p.stats.assists,
        };
      }
      if (
        p.stats &&
        (p.stats.averageRating || 0) > bestRated.rating &&
        (p.stats.appearances || 0) >= 5
      ) {
        bestRated = {
          name: `${p.firstName} ${p.lastName}`,
          rating: p.stats.averageRating || 0,
        };
      }
    });

    const entry: LeagueHistoryEntry = {
      season: gameState.currentSeason,
      leagueId: leagueId,
      leagueName: leagueNames[leagueId] || leagueId.toUpperCase(),
      championId: winner?.id || "",
      championName: winner?.name || "N/A",
      championColor: winner?.primaryColor || "#888",
      runnerUpName: runnerUp?.name || "N/A",
      topScorer: `${topScorer.name} (${topScorer.count})`,
      topAssister: `${topAssister.name} (${topAssister.count})`,
      bestRatedPlayer:
        bestRated.rating > 0
          ? `${bestRated.name} (${bestRated.rating.toFixed(2)})`
          : undefined,
    };

    return entry;
  });

  // === ADD GLOBAL/INTERNATIONAL CUPS ENTRY ===
  if (gameState.europeanCup?.winnerId || gameState.europaLeague?.winnerId) {
    const clWinner = gameState.teams.find(
      (t) => t.id === gameState.europeanCup?.winnerId,
    );
    const elWinner = gameState.teams.find(
      (t) => t.id === gameState.europaLeague?.winnerId,
    );
    const scWinner = gameState.teams.find(
      (t) => t.id === gameState.superCup?.winnerId,
    );

    // Find runner up for CL (Intercontinental Elite)
    let clRunnerUpName = "N/A";
    // USE KNOCKOUT MATCHES FOR FINAL
    if (gameState.europeanCup?.knockoutMatches) {
      const final = gameState.europeanCup.knockoutMatches.find(
        (m) => m.stage === "FINAL",
      );
      if (final && final.winnerId) {
        const runnerUpId =
          final.homeTeamId === final.winnerId
            ? final.awayTeamId
            : final.homeTeamId;
        const runnerUp = gameState.teams.find((t) => t.id === runnerUpId);
        if (runnerUp) clRunnerUpName = runnerUp.name;
      }
    }

    historyEntries.push({
      season: gameState.currentSeason,
      leagueId: "global",
      leagueName: "🌍 Intercontinental",
      championId: clWinner?.id || "",
      championName: clWinner?.name || "N/A",
      championColor: clWinner?.primaryColor || "#333",
      runnerUpName: clRunnerUpName,
      topScorer: "-",
      topAssister: "-",
      championsLeagueWinner: clWinner?.name,
      europaLeagueWinner: elWinner?.name,
      superCupWinner: scWinner?.name,
    });
  }

  // 2. Economy: Prize Money Distribution (BALANCED - reduced from previous)
  // League prize money scales with league economy multiplier
  const userTeam = gameState.teams.find((t) => t.id === gameState.userTeamId);
  const leagueMult = getLeagueMultiplier(userTeam?.leagueId || "tr");

  // Base prizes for Turkish league, scaled for others
  // REDUCED: TR champion ~€5M (was €10M), EN champion ~€17.5M (was €35M)
  const basePrizes = [5000000, 3000000, 2000000, 1000000]; // Top 4
  const prizeDistribution = basePrizes.map((p) => Math.floor(p * leagueMult));

  let updatedTeams = sensitiveSortedTeams.map((t, _globalIndex) => {
    // Calculate LEAGUE-specific position for this team
    const leagueTeamsSorted = sensitiveSortedTeams.filter(
      (team) => team.leagueId === t.leagueId,
    );
    const leaguePosition = leagueTeamsSorted.findIndex(
      (team) => team.id === t.id,
    );
    const leagueSize = leagueTeamsSorted.length;

    // Use league-specific multiplier for prizes
    const teamLeagueMult = getLeagueMultiplier(t.leagueId);

    let prize = Math.floor(300000 * teamLeagueMult); // Base participation prize (was 500k)
    if (leaguePosition < 4)
      prize = Math.floor(basePrizes[leaguePosition] * teamLeagueMult);
    else if (leaguePosition < 6) prize = Math.floor(1000000 * teamLeagueMult); // Challenge Cup spots (was 2M)

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
    const D =
      leaguePosition !== -1 ? Math.max(10, 100 - leaguePosition * 5) : 50;

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
    const newRepScore = L * 0.25 + D * 0.5 + E * 0.25;

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
      financials: t.financials
        ? {
          ...t.financials,
          seasonTotals: {
            transferIncomeThisSeason: 0,
            transferExpensesThisSeason: 0,
          },
        }
        : undefined, // Reset season transfer totals
      lastSeasonPosition: leaguePosition, // Yeni sezon kupalarında kullanılacak lig pozisyonu
    };
  });

  // 3. Player Lifecycle (Aging, Progression, Contracts, Retirement)
  const retiredPlayerNames: string[] = [];
  const promotedPlayerNames: string[] = []; // Regens
  const contractRenewalDemands: Array<{ playerId: string; playerName: string; demandedSalary: number; position: string; overall: number; hasAlternatives: boolean; isLoyal: boolean }> = [];

  let updatedPlayers = gameState.players.map((p) => {
    const age = p.age + 1;
    let overall = p.overall;
    let potential = p.potential;

    // Get Team Facilities & Staff to influence progression speed
    const playerTeam = updatedTeams.find(t => t.id === p.teamId) || gameState.teams.find(t => t.id === p.teamId);
    const trainingLevel = playerTeam?.facilities?.trainingLevel || 1;
    const headCoachLevel = playerTeam?.staff?.headCoachLevel || 1;
    const managerEffects = p.teamId === gameState.userTeamId
      ? getManagerGameplayEffects(gameState.managerProfile)
      : (() => {
          const base = getManagerGameplayEffects(undefined);
          // AI teams get a small fixed development bonus (balances user manager advantage)
          const aiTeamObj = gameState.teams.find(t => t.id === p.teamId);
          const aiRepBonus = aiTeamObj ? Math.min(0.010, aiTeamObj.reputation / 50000) : 0.005;
          return { ...base, playerDevelopmentBonus: 0.010 + aiRepBonus };
        })();

    // Progressive Difficulty for High OVR (Anti-Inflation — sertleştirildi)
    let inflationPenalty = 0;
    if (overall >= 90) {
      inflationPenalty = 0.80; // -80%: 90+ oyuncu neredeyse gelişemiyor
    } else if (overall >= 87) {
      inflationPenalty = 0.65; // -65%
    } else if (overall >= 85) {
      inflationPenalty = 0.50; // -50%
    } else if (overall >= 82) {
      inflationPenalty = 0.35; // -35%
    } else if (overall >= 80) {
      inflationPenalty = 0.22; // -22%
    }

    // Facility Bonus: Max Level 7 (Training + Coach) gives up to +17.5% flat extra growth chance
    const developmentBonus = (trainingLevel * 0.015) + (headCoachLevel * 0.010);

    // Final bonus applies, but inflation penalty fights against it
    const effectiveBonus = developmentBonus + managerEffects.playerDevelopmentBonus - inflationPenalty;

    // Progression Logic (Realistic Growth/Decline)
    const gapToPotential = potential - overall;

    if (age <= 21 && gapToPotential > 0) {
      // Wonderkids & very young players (fastest growth)
      const growthChance = 0.50 + effectiveBonus; // Base 50%
      if (Math.random() < growthChance) {
        // Max +2 per season to prevent stat explosions
        const gain = overall >= 85 ? 1 : getRandomInt(1, 2);
        overall += gain;
      }
    } else if (age <= 24 && gapToPotential > 0) {
      // Young players developing
      const growthChance = 0.35 + effectiveBonus; // Base 35%
      if (Math.random() < growthChance) {
        const gain = overall >= 85 ? 1 : getRandomInt(1, 2);
        overall += gain;
      }
    } else if (age > 31) { // Extended peak years to 31 before decline
      // Old player decline (Starts at 32 mostly)
      const declineChance = 0.4 + (age - 32) * 0.15; // 40% chance at 32, 55% at 33, etc.
      if (Math.random() < declineChance) {
        const loss = overall >= 85 ? getRandomInt(1, 2) : getRandomInt(1, 2); // Max -2 per season
        overall -= loss;
      }
    }

    overall = Math.min(99, Math.max(40, overall));

    // Contract Management
    let contractYears = (p.contractYears || 1) - 1;
    let teamId = p.teamId;
    let newContractSigned = false; // Track if we need to update salary

    if (contractYears <= 0) {
      if (p.teamId === gameState.userTeamId) {
        // Check if we already sent an unread renewal demand — player waited, now leaving
        const alreadyDemanded = gameState.messages.some(
          (m) => m.type === MessageType.CONTRACT_RENEWAL && (m.data as any)?.playerId === p.id && !m.isRead
        );

        if (alreadyDemanded) {
          // Player waited, user ignored — they leave
          if (overall >= 75) {
            const betterTeams = gameState.teams
              .filter(
                (t) =>
                  t.id !== gameState.userTeamId &&
                  t.reputation >
                  (gameState.teams.find((ut) => ut.id === gameState.userTeamId)
                    ?.reputation || 0),
              )
              .sort((a, b) => b.reputation - a.reputation);
            if (betterTeams.length > 0) {
              const targetTeam = betterTeams[Math.floor(Math.random() * Math.min(3, betterTeams.length))];
              teamId = targetTeam.id;
              contractYears = 3;
              newContractSigned = true;
            } else {
              teamId = "FREE_AGENT";
            }
          } else {
            teamId = "FREE_AGENT";
          }
        } else {
          // First expiry — calculate demanded salary and send renewal demand
          const userTeamLeague = gameState.teams.find((t) => t.id === gameState.userTeamId)?.leagueId || "en";
          const leagueMult = getLeagueMultiplier(userTeamLeague);
          const baseWage = Math.floor(Math.pow(1.13, overall - 50) * 100000 * 0.005);
          const scaledWage = Math.floor(baseWage * (0.8 + leagueMult * 0.2));

          // Leverage premium: good players who have better-club options demand more
          // OVR 85+: elite, many suitors → +50% premium
          // OVR 80-84: quality player, likely alternatives → +30% premium
          // OVR 75-79: solid player, some alternatives → +15% premium
          // OVR <75: limited options → market rate
          const userTeamRep = gameState.teams.find((t) => t.id === gameState.userTeamId)?.reputation || 0;
          const hasBetterOptions = gameState.teams.some(
            (t) => t.id !== gameState.userTeamId && t.reputation > userTeamRep
          );
          let leverageMult = 1.0;
          if (hasBetterOptions) {
            if (overall >= 85) leverageMult = 1.50;
            else if (overall >= 80) leverageMult = 1.30;
            else if (overall >= 75) leverageMult = 1.15;
          }

          // Loyalty (morale) modifier: happy players give a discount, unhappy demand extra
          const morale = p.morale || 70;
          let loyaltyMult = 1.0;
          if (morale >= 85) loyaltyMult = 0.82;       // Çok mutlu → %18 indirim (seni seviyor)
          else if (morale >= 72) loyaltyMult = 0.92;  // Mutlu → %8 indirim
          else if (morale < 50) loyaltyMult = 1.15;   // Mutsuz → %15 zam (bıkmış, kazanmak istiyor)
          else if (morale < 62) loyaltyMult = 1.07;   // Biraz mutsuz → %7 zam

          const demandedWage = Math.max(250, Math.floor(scaledWage * leverageMult * loyaltyMult));
          contractRenewalDemands.push({
            playerId: p.id,
            playerName: `${p.firstName} ${p.lastName}`,
            demandedSalary: demandedWage * 52,
            position: p.position,
            overall,
            hasAlternatives: hasBetterOptions && overall >= 75,
            isLoyal: morale >= 72,
          });
          contractYears = 1; // Grace period — awaiting user's decision
        }
      } else {
        // AI Logic: Renew key players, release others
        const aiCurrentTeam = updatedTeams.find((t) => t.id === p.teamId) || gameState.teams.find((t) => t.id === p.teamId);
        const aiSquad = gameState.players.filter((pl) => pl.teamId === p.teamId);
        const squadAverage = aiSquad.reduce((sum, pl) => sum + pl.overall, 0) / Math.max(1, aiSquad.length);
        const isStarter = p.lineup === 'STARTING';
        const keepThreshold = Math.max(68, Math.floor(squadAverage - (aiCurrentTeam && aiCurrentTeam.reputation > 8000 ? 3 : 5)));

        if (overall >= keepThreshold || isStarter) {
          contractYears = getRandomInt(1, 3); // Auto renew real contributors
          newContractSigned = true; // NEW CONTRACT = NEW SALARY
        } else if (overall >= Math.max(62, keepThreshold - 4)) {
          contractYears = 1; // Fringe players become market-accessible next window
        } else {
          teamId = "FREE_AGENT";
        }
      }
    }

    // Value update based on new overall/age - consistent with weekly formula
    const baseValue = Math.floor(
      Math.pow(1.18, overall - 60) *
      100000 *
      (1 + (p.potential - overall) / 25) *   // potential factor — same as weekly update
      (1 + Math.max(0, 25 - age) * 0.03) *
      (1 - Math.max(0, age - 26) * 0.025),
    );
    const newValue = Math.floor(baseValue * inflationMultiplier);

    // CONTRACT-LOCKED SALARY: Salary only updates on NEW CONTRACT, not value changes!
    // This allows signing young talents at low wages and watching them grow

    let finalSalary = p.salary;

    if (newContractSigned) {
      // Retrieve team to get league multiplier
      const team = gameState.teams.find((t) => t.id === teamId);
      const leagueMult = getLeagueMultiplier(team?.leagueId || "en"); // Default to high wages if unknown (safety)

      // Re-calculate effective overall for accurate wage base (just in case)
      // Use existing value formula base, but for wage
      // WAGE FORMULA: Base Wage * (0.8 + (LeagueMult * 0.2)) + superstar premium for 88+ OVR
      const renewSuperstarMult = overall >= 88 ? Math.pow(1.22, overall - 87) : 1.0;
      const baseWage = Math.floor(
        Math.pow(1.13, overall - 50) * 100000 * 0.005 * renewSuperstarMult,
      );
      const scaledWage = Math.floor(baseWage * (0.8 + leagueMult * 0.2));
      // Ensure realistic minimum wages
      const finalWage = Math.max(250, scaledWage);

      finalSalary = finalWage * 52;
    }

    // WAGE PRESSURE: Players feel underpaid relative to their current overall.
    // This prevents indefinitely exploiting cheap contracts as players grow.
    // New contract = fresh deal at market rate → player is happy.
    // Old locked contract = player compares wage to market and may feel underpaid.
    const marketWage = Math.floor(Math.pow(1.13, overall - 50) * 100000 * 0.005);
    const marketSalary = Math.max(1, marketWage * 52);
    const wageRatio = (finalSalary || 0) / marketSalary;
    let seasonStartMorale: number;
    if (newContractSigned) {
      seasonStartMorale = 80; // Fresh deal → happy
    } else if (wageRatio < 0.35) {
      seasonStartMorale = 52; // Very underpaid (e.g. 85 OVR on 65 OVR wages) → unhappy
    } else if (wageRatio < 0.55) {
      seasonStartMorale = 63; // Moderately underpaid → a bit discontented
    } else {
      seasonStartMorale = 75; // Fairly paid → neutral
    }

    return {
      ...p,
      age,
      overall: Math.min(MAX_PLAYER_OVERALL, overall),
      potential: Math.max(Math.min(MAX_PLAYER_OVERALL, overall), Math.min(MAX_PLAYER_POTENTIAL, potential)),
      value: Math.max(500000, newValue),
      salary: finalSalary, // Contract-locked salary (only updates on new contract)
      contractYears,
      teamId,
      // FIXED: Don't mass-list all 1-year contract players! That was causing 75% of squads to be listed.
      // Only keep existing listing status. Weekly AI logic handles listing decisions properly.
      isTransferListed: teamId === 'FREE_AGENT' ? false : p.isTransferListed,
      stats: {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        appearances: 0,
        averageRating: 0,
      }, // Reset season stats
      weeksInjured: 0,
      matchSuspension: 0,
      condition: 100,
      morale: seasonStartMorale, // Wage-aware morale reset
    };
  });

  // Handle Retirements (NO SAME-TEAM REGEN - Use Global Pool Instead)
  const finalPlayers: Player[] = [];
  const eliteRegens: Player[] = []; // Store regens of retiring stars

  updatedPlayers.forEach((p) => {
    let shouldRetire = false;
    // Retirement check early for older players
    if (p.age >= 38) shouldRetire = true; // 38 is the maximum age
    else if (p.age >= 34 && Math.random() < 0.40) shouldRetire = true; // High chance of retiring if older than 34

    if (shouldRetire) {
      retiredPlayerNames.push(`${p.firstName} ${p.lastName}`);

      // 🌟 REGEN SYSTEM: High quality players spawn a Wonderkid in the global pool
      if (p.overall >= 80) {
        // Regen has the same nationality and position, but random name
        // Potential is scaled to the retiring player's OVR — capped lower to prevent inflation
        const regenPotential = Math.min(84, Math.max(76, p.overall - 8));
        const regen = generatePlayer(
          "YOUTH_POOL",
          p.position,
          p.nationality,
          [16, 17],
          [regenPotential, regenPotential]
        );
        regen.overall = 52 + Math.floor(Math.random() * 10); // 52-61
        regen.value = regen.overall * 100000;
        regen.salary = Math.max(250, regen.value * 0.1);
        regen.lineup = "RESERVE";
        regen.lineupIndex = 99;

        eliteRegens.push(regen);
      }
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
    "Brazil",
    "Argentina",
    "France",
    "Germany",
    "Spain",
    "Portugal",
    "Netherlands",
    "Belgium",
    "England",
    "Italy",
    "Nigeria",
    "Senegal",
    "Morocco",
    "Egypt",
    "Ghana",
    "Japan",
    "South Korea",
    "Australia",
    "Mexico",
    "Colombia",
    "Uruguay",
    "Chile",
    "Turkey",
    "Croatia",
    "Serbia",
    "Poland",
    "Czech",
    "Austria",
    "Switzerland",
    "USA",
  ];
  const YOUTH_POSITIONS: Position[] = [
    Position.GK,
    Position.DEF,
    Position.MID,
    Position.FWD,
  ];

  // Generate global youth pool
  const globalYouthPool: Player[] = [];
  for (let i = 0; i < YOUTH_POOL_SIZE; i++) {
    const nationality =
      YOUTH_NATIONALITIES[
      Math.floor(Math.random() * YOUTH_NATIONALITIES.length)
      ];
    const position =
      YOUTH_POSITIONS[Math.floor(Math.random() * YOUTH_POSITIONS.length)];
    const basePotential = 60 + Math.floor(Math.random() * 29); // 60-88 potential

    const youth = generatePlayer(
      "YOUTH_POOL", // Temporary team ID
      position,
      nationality,
      [16, 19],
      [basePotential, Math.min(90, basePotential + 4)],
    );
    youth.overall = getRandomInt(50, 65);
    youth.value = Math.floor(Math.pow(1.18, youth.overall - 60) * 100000 * (1 + Math.max(0, 25 - youth.age) * 0.03) * inflationMultiplier);
    youth.salary = Math.floor(Math.pow(1.13, youth.overall - 50) * 100000 * 0.005) * 52; // Consistent wage formula
    youth.lineup = "RESERVE";
    youth.lineupIndex = 99;

    globalYouthPool.push(youth);
  }

  // Add the Elite Regens to the global pool!
  if (eliteRegens.length > 0) {
    globalYouthPool.push(...eliteRegens);
  }

  // Sort pool by potential (best talents first)
  globalYouthPool.sort((a, b) => b.potential - a.potential);

  // Calculate team picking power (scoutLevel + academyLevel + random factor)
  const teamPickingPower: { teamId: string; power: number }[] =
    updatedTeams.map((t) => ({
      teamId: t.id,
      power:
        (t.staff?.scoutLevel || 1) * 3 + // Scout is very important for spotting talent early on
        (t.facilities?.academyLevel || 1) * 2 + // Academy helps attract players to the youth squad
        Math.random() * 8, // Adds some randomness, smaller teams might secure a good youth prospect occasionally 
    }));

  // Sort by picking power (best scouts pick first)
  teamPickingPower.sort((a, b) => b.power - a.power);

  // Distribute youth players to teams
  let youthIndex = 0;
  teamPickingPower.forEach(({ teamId, power }) => {
    // Each team gets 1-4 picks based on power (roughly academyLevel/5 + 1)
    const team = updatedTeams.find((t) => t.id === teamId);
    const academyLevel = team?.facilities?.academyLevel || 1;
    const picksAllowed = Math.max(
      1,
      Math.min(4, Math.floor(academyLevel / 4) + 1),
    );

    for (
      let pick = 0;
      pick < picksAllowed && youthIndex < globalYouthPool.length;
      pick++
    ) {
      const youth = globalYouthPool[youthIndex];
      // Important to assign team ID so it reflects correctly
      youth.teamId = teamId;
      finalPlayers.push(youth);
      promotedPlayerNames.push(
        `${youth.firstName} ${youth.lastName} (${youth.nationality})`,
      );
      youthIndex++;
    }
  });

  // 4. FIX: Generate fixtures PER LEAGUE, not all teams mixed!
  const fixtureLeagueIds = [...new Set(updatedTeams.map((t) => t.leagueId))];
  const allNewMatches: Match[] = [];
  fixtureLeagueIds.forEach((leagueId) => {
    const leagueTeams = updatedTeams.filter((t) => t.leagueId === leagueId);
    // BUGFIX: Get singleRound setting from LEAGUE_PRESETS for each league
    const leaguePreset = LEAGUE_PRESETS.find((lp) => lp.id === leagueId);
    // 'matchFormat' is available on 'ar' and 'br' leagues in constants.ts
    // Explicitly cast to any because standard type might not show it yet if types.ts isn't updated
    const isSingleRound = (leaguePreset as any)?.matchFormat === "single-round";

    const leagueMatches = generateSeasonSchedule(leagueTeams, isSingleRound);
    allNewMatches.push(...leagueMatches);
  });

  // ========== MANAGER RATING SYSTEM - REBALANCED ==========
  // Calculate user's position in their league
  // Use user's team's leagueId directly — gameState.leagueId can be stale after mid-season job changes
  const userTeamForRating = gameState.teams.find((t) => t.id === gameState.userTeamId);
  const userLeagueTeams = sensitiveSortedTeams.filter(
    (t) => t.leagueId === (userTeamForRating?.leagueId || gameState.leagueId),
  );
  const userPosition =
    userLeagueTeams.findIndex((t) => t.id === gameState.userTeamId) + 1;
  const totalTeams = userLeagueTeams.length;

  // Calculate EXPECTED position based on squad strength (average overall)
  const userPlayers = gameState.players.filter(
    (p) => p.teamId === gameState.userTeamId,
  );
  const userAvgOverall =
    userPlayers.reduce((sum, p) => sum + p.overall, 0) /
    Math.max(userPlayers.length, 1);

  // Rank all teams by squad strength to get expected position
  const teamStrengths = userLeagueTeams
    .map((t) => {
      const teamPlayers = gameState.players.filter((p) => p.teamId === t.id);
      const avgOverall =
        teamPlayers.reduce((sum, p) => sum + p.overall, 0) /
        Math.max(teamPlayers.length, 1);
      return { teamId: t.id, strength: avgOverall };
    })
    .sort((a, b) => b.strength - a.strength);

  const expectedPosition =
    teamStrengths.findIndex((t) => t.teamId === gameState.userTeamId) + 1;
  const performanceDelta = expectedPosition - userPosition; // Positive = overperformed

  let managerRating = gameState.managerRating || 50;
  let ratingChange = 0;
  let ratingChangeMessage = "";

  // Base rating change from league position (MORE GRANULAR)
  if (userPosition === 1) {
    ratingChange += 10;
    ratingChangeMessage = "🏆 Şampiyonluk! (+10 rating)";
  } else if (userPosition === 2) {
    ratingChange += 6;
    ratingChangeMessage = "🥈 İkinci oldu (+6 rating)";
  } else if (userPosition <= 4) {
    ratingChange += 4;
    ratingChangeMessage = "🥉 Top 4 (+4 rating)";
  } else if (userPosition <= 8) {
    ratingChange += 2;
    ratingChangeMessage = "⬆️ Üst sıra (+2 rating)";
  } else if (userPosition <= totalTeams / 2) {
    ratingChange += 0; // Mid-table = neutral
    ratingChangeMessage = "➡️ Orta sıra (0 rating)";
  } else if (userPosition > totalTeams - 3) {
    // Relegation zone (SOFTENED: was -15)
    ratingChange -= 8;
    ratingChangeMessage = "⬇️ Küme düşme tehlikesi! (-8 rating)";
  } else {
    // Below average (SOFTENED: was -5)
    ratingChange -= 3;
    ratingChangeMessage = "📉 Beklentilerin altında (-3 rating)";
  }

  // OVERPERFORMANCE BONUS: Reward managers who exceed expectations
  if (performanceDelta > 0) {
    const overperformBonus = Math.min(10, Math.round(performanceDelta * 1.5));
    ratingChange += overperformBonus;
    ratingChangeMessage += `\n⭐ Beklentilerin üstünde! (+${overperformBonus} bonus)`;
  } else if (performanceDelta < -3) {
    // Only penalize significant underperformance
    const underperformPenalty = Math.max(
      -8,
      Math.round(performanceDelta * 1.0),
    );
    ratingChange += underperformPenalty;
    ratingChangeMessage += `\n📉 Beklentilerin çok altında (${underperformPenalty} ceza)`;
  }

  // European cup bonuses
  if (gameState.europeanCup?.winnerId === gameState.userTeamId) {
    ratingChange += 20;
    ratingChangeMessage += "\n🏆 Şampiyonlar Ligi şampiyonu! (+20 rating)";
  } else if (gameState.europaLeague?.winnerId === gameState.userTeamId) {
    ratingChange += 12;
    ratingChangeMessage += "\n🏆 Challenge Cup şampiyonu! (+12 rating)";
  }

  managerRating = Math.max(10, Math.min(100, managerRating + ratingChange));

  // Determine trophy wins this season
  const wonLeague = userPosition === 1;
  const wonCL = gameState.europeanCup?.winnerId === gameState.userTeamId;
  const wonUEFA = gameState.europaLeague?.winnerId === gameState.userTeamId;
  const wonSuperCup = gameState.superCup?.winnerId === gameState.userTeamId;

  // === SEASON-END BOARD CONFIDENCE TROPHY BONUS ===
  // Winning trophies should massively boost board confidence (prevent %50 drop despite domination)
  if (userTeam) {
    let trophyConfBonus = 0;
    if (wonLeague) trophyConfBonus += 22;
    if (wonCL) trophyConfBonus += 18;
    if (wonUEFA) trophyConfBonus += 12;
    if (wonSuperCup) trophyConfBonus += 8;
    if (!wonLeague && userPosition === 2) trophyConfBonus += 8;
    else if (!wonLeague && userPosition === 3) trophyConfBonus += 4;
    // No trophies and poor finish = penalty
    if (!wonLeague && !wonCL && !wonUEFA && !wonSuperCup && userPosition > Math.ceil(totalTeams / 2)) {
      trophyConfBonus -= 8;
    }
    if (trophyConfBonus !== 0) {
      updatedTeams = updatedTeams.map(t =>
        t.id === gameState.userTeamId
          ? { ...t, boardConfidence: Math.max(1, Math.min(100, (t.boardConfidence ?? 70) + trophyConfBonus)) }
          : t
      );
    }
  }

  // Update career history with trophy info
  const careerHistoryEntry = {
    season: gameState.currentSeason,
    teamName: userTeam?.name || "Unknown",
    position: userPosition,
    rating: managerRating,
    leagueChampion: wonLeague,
    championsLeagueWinner: wonCL,
    uefaCupWinner: wonUEFA,
    superCupWinner: wonSuperCup,
  };
  const updatedCareerHistory = [
    ...(gameState.managerCareerHistory || []),
    careerHistoryEntry,
  ];

  // Update trophy counts
  const currentTrophies = gameState.managerTrophies || {
    leagueTitles: 0,
    championsLeagueTitles: 0,
    uefaCupTitles: 0,
    superCupTitles: 0,
  };
  const updatedTrophies = {
    leagueTitles: currentTrophies.leagueTitles + (wonLeague ? 1 : 0),
    championsLeagueTitles:
      currentTrophies.championsLeagueTitles + (wonCL ? 1 : 0),
    uefaCupTitles: currentTrophies.uefaCupTitles + (wonUEFA ? 1 : 0),
    superCupTitles: currentTrophies.superCupTitles + (wonSuperCup ? 1 : 0),
  };

  // ========== JOB OFFERS GENERATION ==========
  // Generate job offers based on manager rating and available positions
  const newJobOffers: JobOffer[] = [];

  // Generate offers from teams that might want you
  const allLeagueTeams = updatedTeams.filter(
    (t) => t.id !== gameState.userTeamId,
  );

  allLeagueTeams.forEach((team) => {
    const requiredRating = getRequiredManagerRatingForJobOffer(team.reputation);

    // Calculate offer chance - REBALANCED: Base 35% (was 15%)
    let offerChance = 0.35;

    // Performance bonus: increase chance if manager overperformed
    if (performanceDelta > 0) {
      offerChance += Math.min(0.15, performanceDelta * 0.03); // Up to +15%
    }
    // Recent championship bonus
    if (userPosition <= 3) {
      offerChance += 0.1; // Top 3 finish = more interest
    }

    // Only make offer if manager meets requirement AND passes chance roll
    if (managerRating >= requiredRating && Math.random() < offerChance) {
      newJobOffers.push(
        buildJobOffer(team, managerRating, 4, {
          recentPerformanceDelta: performanceDelta,
          userPosition,
          currentSalary: gameState.managerSalary,
          currentTeamReputation: userLeagueTeams.find((t) => t.id === gameState.userTeamId)?.reputation,
          managerProfile: gameState.managerProfile,
        }),
      );
    }
  });

  newJobOffers.sort((a, b) => b.offerScore - a.offerScore);

  // Limit to top 6 offers (was 5)
  const limitedOffers = newJobOffers.slice(0, 6);
  const salaryReview = getManagerSalaryReview(
    gameState.managerSalary || getInitialManagerSalaryForTeamReputation(userLeagueTeams.find((t) => t.id === gameState.userTeamId)?.reputation || 5000),
    userLeagueTeams.find((t) => t.id === gameState.userTeamId)?.reputation || 5000,
    managerRating,
    performanceDelta,
    userPosition,
    totalTeams,
  );

  // --- SUPER CUP GENERATION ---
  // --- SUPER CUP GENERATION ---
  // DISABLED LEGACY LOGIC: Super Cup is now scheduled at the END of the season (Week 39+), not Week 1 of next season.
  // The winners of Season X play at end of Season X.
  let superCupMatch: any = undefined; // Use 'any' to satisfy type if needed, or update GameState type if strictly typed

  // 5. Transfer Tax Pot Distribution (30% to all teams equally, 70% destroyed)
  const taxPot = gameState.transferTaxPot || 0;
  const taxDistributionMessage = (() => {
    if (taxPot <= 0) {
      return null;
    }
    const toDistribute = Math.floor(taxPot * 0.10); // 10% back to teams, 90% destroyed
    const toDestroy = taxPot - toDistribute;
    const perTeam = updatedTeams.length > 0 ? Math.floor(toDistribute / updatedTeams.length) : 0;
    if (perTeam > 0) {
      updatedTeams = updatedTeams.map(t => ({ ...t, budget: t.budget + perTeam }));
    }
    return {
      id: uuid(),
      week: 1,
      type: MessageType.BOARD,
      subject: t.transferTaxSubject || '💰 Transfer Vergi Fonu — Sezon Sonu Raporu',
      body: [
        t.transferTaxBody1?.replace('{total}', `€${(taxPot/1e6).toFixed(1)}M`) ||
          `Bu sezon transfer vergisinden toplam €${(taxPot/1e6).toFixed(1)}M birikim sağlandı.`,
        t.transferTaxBody2?.replace('{dist}', `€${(toDistribute/1e6).toFixed(1)}M`).replace('{perTeam}', `€${(perTeam/1e6).toFixed(2)}M`) ||
          `%30'u (€${(toDistribute/1e6).toFixed(1)}M) tüm kulüplere eşit dağıtıldı: kulüp başına €${(perTeam/1e6).toFixed(2)}M.`,
        t.transferTaxBody3?.replace('{destroyed}', `€${(toDestroy/1e6).toFixed(1)}M`) ||
          `Kalan €${(toDestroy/1e6).toFixed(1)}M ekonomiden çekildi (enflasyon önlemi).`,
      ].join('\n'),
      isRead: false,
      date: new Date().toISOString(),
    };
  })();

  // 6. Update Game State
  const newState = {
    ...gameState,
    currentSeason: gameState.currentSeason + 1,
    transferTaxPot: 0, // Reset pot for new season
    currentWeek: 1,
    history: [...gameState.history, ...historyEntries],
    teams: updatedTeams,
    players: finalPlayers,
    matches: allNewMatches,
    europeanCup: generateGlobalCup(
      {
        ...gameState,
        teams: updatedTeams,
        currentSeason: gameState.currentSeason + 1,
      } as GameState,
      0,
    ),
    europaLeague: generateGlobalCup(
      {
        ...gameState,
        teams: updatedTeams,
        currentSeason: gameState.currentSeason + 1,
      } as GameState,
      1,
    ),
    superCup: superCupMatch,
    managerRating,
    managerSalary: salaryReview.nextSalary,
    managerCareerHistory: updatedCareerHistory,
    managerTrophies: updatedTrophies,
    jobOffers: limitedOffers,
    marketInflationMultiplier: inflationMultiplier, // Sync so week 1 of new season starts from here

    messages: [
      {
        id: uuid(),
        week: 1,
        type: MessageType.BOARD,
        subject: `Season ${gameState.currentSeason + 1} Begins!`,
        body: `${t.seasonStartIntro || 'Yeni sezon başladı.'} ${ratingChangeMessage}\n${t.managerRatingLabel || 'Menajer Rating'}: ${managerRating}/100\n${salaryReview.message}\n${limitedOffers.length > 0 ? `📩 ${limitedOffers.length} ${t.newJobOffersLine || 'yeni iş teklifi geldi!'}` : ""}`,
        isRead: false,
        date: new Date().toISOString(),
      },
      // Contract renewal demands from players whose contracts just expired
      ...contractRenewalDemands.map((demand) => ({
        id: uuid(),
        week: 1,
        type: MessageType.CONTRACT_RENEWAL,
        subject: (t.contractDemandSubject || '{name} yeni sözleşme talep ediyor').replace('{name}', demand.playerName),
        body: (() => {
          const wage = Math.round(demand.demandedSalary / 52).toLocaleString();
          const base = { '{name}': demand.playerName, '{ovr}': String(demand.overall), '{pos}': demand.position, '{wage}': wage };
          const fill = (tpl: string) => Object.entries(base).reduce((s, [k, v]) => s.replace(k, v), tpl);
          if (demand.hasAlternatives && !demand.isLoyal)
            return fill(t.contractDemandBodyAlt || '{name} (OVR {ovr} | {pos}) sözleşmesi bitti. Başka kulüplerden teklif aldığını belirtiyor — haftada €{wage} istiyor. Kabul etmezsen ayrılır.');
          if (demand.hasAlternatives && demand.isLoyal)
            return fill(t.contractDemandBodyBothAlt || '{name} (OVR {ovr} | {pos}) sözleşmesi bitti. Başka teklifleri olmasına rağmen burada kalmak istediğini söylüyor — haftada €{wage} ile anlaşabiliriz diyor. Kabul etmezsen gider.');
          if (demand.isLoyal)
            return fill(t.contractDemandBodyLoyal || '{name} (OVR {ovr} | {pos}) sözleşmesi bitti. Kulübe bağlılığını belirterek makul bir teklifle uzatmak istediğini söylüyor — haftada €{wage} yeterli olur diyor.');
          return fill(t.contractDemandBodyBasic || '{name} (OVR {ovr} | {pos}) sözleşmesi bitti. Haftada €{wage} maaş talep ediyor. Kabul etmezsen kulübü terk eder.');
        })(),
        isRead: false,
        date: new Date().toISOString(),
        data: {
          playerId: demand.playerId,
          playerName: demand.playerName,
          demandedSalary: demand.demandedSalary,
        },
      })),
      ...(taxDistributionMessage ? [taxDistributionMessage] : []),
      ...gameState.messages,
    ],

    // PERSIST GLOBAL BONUSES AND BASE REPUTATIONS
    leagueReputationBonuses: { ...LEAGUE_REPUTATION_BONUS },
    baseLeagueReputations: { ...BASE_LEAGUE_REPUTATION },
    leagueEuropeanBonuses: { ...LEAGUE_EUROPEAN_BONUS },
    leagueCoefficientHistory: { ...gameState.leagueCoefficientHistory }, // EXPLICIT PERSISTENCE
  };

  const progressedState = applyManagerProfileSeasonProgression(newState, {
    finalRating: managerRating,
    userPosition,
    totalTeams,
    performanceDelta,
    wonLeague,
    wonChampionsLeague: !!wonCL,
    wonEuropaLeague: !!wonUEFA,
    wonSuperCup: !!wonSuperCup,
  });

  const objectiveResolution = resolveManagerSeasonObjectives(progressedState);
  let postObjectiveState: GameState = objectiveResolution.updatedProfile
    ? {
        ...progressedState,
        managerProfile: objectiveResolution.updatedProfile,
        managerRating: objectiveResolution.updatedProfile.reputation,
      }
    : progressedState;

  postObjectiveState = assignManagerObjectivesForCurrentTeam(
    {
      ...postObjectiveState,
      currentSeason: gameState.currentSeason + 1,
    },
    postObjectiveState.userTeamId,
  );

  if (objectiveResolution.summaryLines.length > 0) {
    postObjectiveState = {
      ...postObjectiveState,
      messages: [
        {
          id: uuid(),
          week: 1,
          type: MessageType.BOARD,
          subject: 'Season Objectives Review',
          body: `${objectiveResolution.summaryLines.join('\n')}`,
          isRead: false,
          date: new Date().toISOString(),
        },
        ...postObjectiveState.messages,
      ],
    };
  }

  // === SAVE FILE HEALTH CHECK (User Request) ===
  // 1. Trim History Arrays (Memory Optimization)
  // Keep only last 10 seasons (years) of history, not just last 10 entries.
  // Each season adds one entry per league (e.g. 48 leagues => 48 entries/season).
  if (postObjectiveState.history.length > 0) {
    const seasons = Array.from(
      new Set(
        postObjectiveState.history
          .map((h) => h.season)
          .filter(
            (s): s is number => typeof s === "number" && Number.isFinite(s),
          ),
      ),
    ).sort((a, b) => a - b);

    const allowedSeasons = new Set(seasons.slice(-10));
    if (allowedSeasons.size > 0) {
      postObjectiveState.history = postObjectiveState.history.filter((h) =>
        allowedSeasons.has(h.season),
      );
    }
  }

  // 2. Trim Player History (Detailed logs)
  // Keep only last 5 morale entries per player to save JSON space
  postObjectiveState.players.forEach((p) => {
    if (p.moraleHistory && p.moraleHistory.length > 5) {
      p.moraleHistory = p.moraleHistory.slice(-5);
    }
  });

  // 3. Trim inbox and transfer state for long careers
  postObjectiveState.messages = pruneMessages(postObjectiveState.messages || []);
  postObjectiveState.pendingOffers = prunePendingOffers(
    postObjectiveState.pendingOffers || [],
  );
  if ((postObjectiveState.jobOffers || []).length > 8) {
    postObjectiveState.jobOffers = [...(postObjectiveState.jobOffers || [])].slice(0, 8);
  }

  return {
    newState: postObjectiveState,
    retired: retiredPlayerNames,
    promoted: promotedPlayerNames,
  };
};

// ========== LIG KUPASI SYSTEM (Domestic Cup) ==========
// import { EuropeanCup, EuropeanCupMatch } from '../types'; (Removed)

export const generateLeagueCup = (gameState: GameState): GlobalCup => {
  // Use top 16 teams by reputation for knockout cup
  const sortedTeams = [...gameState.teams].sort(
    (a, b) => b.reputation - a.reputation,
  );
  const qualifiedTeamIds = sortedTeams
    .slice(0, Math.min(16, sortedTeams.length))
    .map((t) => t.id);

  // Shuffle for randomized draw
  const shuffled = [...qualifiedTeamIds].sort(() => Math.random() - 0.5);

  // Determine round based on team count
  const teamCount = shuffled.length;
  let stage: "ROUND_16" | "QUARTER" | "SEMI" | "FINAL" = "QUARTER";
  if (teamCount >= 16) stage = "ROUND_16";
  else if (teamCount >= 8) stage = "QUARTER";
  else if (teamCount >= 4) stage = "SEMI";
  else stage = "FINAL";

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
      isPlayed: false,
    });
  }

  return {
    season: gameState.currentSeason,
    isActive: true,
    qualifiedTeamIds,
    groups: [], // Domestic cup has no groups
    knockoutMatches: firstRoundMatches,
    currentStage: stage,
  };
};

// ========== GLOBAL CUP (WORLD CHAMPIONSHIP) ==========
// 48 Teams (Top 2 from ALL 24 leagues)
// 8 Groups of 6 Teams
// Top 2 advance to Round of 16

export const generateGlobalCup = (
  gameState: GameState,
  tier: number = 0,
): GlobalCup => {
  const qualifiedTeams: Team[] = [];
  const groups: GlobalCupGroup[] = [];

  // Group definitions matching the Regions in teams.ts
  const groupRegions = [
    "GROUP_A",
    "GROUP_B",
    "GROUP_C",
    "GROUP_D",
    "GROUP_E",
    "GROUP_F",
    "GROUP_G",
    "GROUP_H",
  ];
  const groupDisplayNames = ["A", "B", "C", "D", "E", "F", "G", "H"];

  groupRegions.forEach((regionId, index) => {
    const groupName = groupDisplayNames[index];
    const groupTeams: string[] = [];

    // Find all 6 leagues assigned to this Region/Group
    const regionLeagues = LEAGUE_PRESETS.filter((l) => l.region === regionId);

    regionLeagues.forEach((league) => {
      // Get teams from this league
      const leagueTeams = gameState.teams.filter(
        (t) => t.leagueId === league.id,
      );
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
        if (
          !groupTeams.includes(selectedTeam.id) &&
          !qualifiedTeams.some((t) => t.id === selectedTeam.id)
        ) {
          groupTeams.push(selectedTeam.id);
          qualifiedTeams.push(selectedTeam);
        }
      }
    });

    // EĞER GRUPTA 6 TAKIM TAMAMLANAMADIYSA (Hata önleyici)
    if (groupTeams.length < 6) {
      console.warn(
        `[Global Cup] Group ${groupName} incomplete. Found: ${groupTeams.length}. Fixing...`,
      );
      // Eksik yer boş kalsın, simülasyon bunu "BAY" geçecek şekilde ayarlıdır veya
      // ileride buraya rastgele takım atayabilirsin.
      // Şimdilik sadece uygulamanın çökmesini engelliyoruz.
    }

    // Initialize Standings
    const standings: GlobalCupGroupTeam[] = groupTeams.map((tid) => ({
      teamId: tid,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    }));

    // Generate Group Matches (Single Round Robin - 5 matches per team)
    // Cup Weeks: 6, 10, 14, 18, 22
    const matches: GlobalCupMatch[] = [];
    const groupWeeks = [6, 10, 14, 18, 22];

    // Pairing logic (designed for 6 teams)
    // If < 6 teams, this might have undefined errors, but we assume strict 48-league structure
    if (groupTeams.length === 6) {
      const pairings = [
        [
          [0, 5],
          [1, 4],
          [2, 3],
        ],
        [
          [5, 2],
          [3, 1],
          [4, 0],
        ],
        [
          [5, 4],
          [0, 3],
          [1, 2],
        ],
        [
          [1, 5],
          [2, 0],
          [3, 4],
        ],
        [
          [5, 3],
          [4, 2],
          [0, 1],
        ],
      ];

      pairings.forEach((roundPairs, roundIndex) => {
        roundPairs.forEach((pair) => {
          matches.push({
            id: uuid(),
            stage: "GROUP",
            groupName: groupName,
            homeTeamId: groupTeams[pair[0]],
            awayTeamId: groupTeams[pair[1]],
            homeScore: 0,
            awayScore: 0,
            isPlayed: false,
            events: [], // Initialize events array
            stats: {
              homePossession: 50,
              awayPossession: 50,
              homeShots: 0,
              awayShots: 0,
              homeOnTarget: 0,
              awayOnTarget: 0,
              homeXG: 0,
              awayXG: 0,
            },
            week: groupWeeks[roundIndex],
          });
        });
      });
    } else {
      console.warn(
        `[Global Cup] Group ${groupName} has ${groupTeams.length} teams instead of 6! Skipping match generation.`,
      );
    }

    groups.push({
      id: uuid(),
      name: groupName,
      teams: groupTeams,
      standings,
      matches,
    });
  });

  return {
    season: gameState.currentSeason,
    isActive: true,
    qualifiedTeamIds: qualifiedTeams.map((t) => t.id),
    groups,
    knockoutMatches: [], // Empty initially
    currentStage: "GROUP", // Start at GROUP stage
    winnerId: undefined,
    _generatedForeignTeams: [],
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
  prizeMultiplier: number = 1.0,
): { updatedCup: GlobalCup; updatedHomeTeam: Team; updatedAwayTeam: Team } => {
  // Find match in Groups OR Knockouts
  let match: GlobalCupMatch | undefined;
  let group: GlobalCupGroup | undefined;

  // Check Groups first
  if (cup.groups) {
    for (const g of cup.groups) {
      match = g.matches.find((m) => m.id === matchId);
      if (match) {
        group = g;
        break;
      }
    }
  }

  // Check Knockouts if not in groups
  if (!match) {
    match = cup.knockoutMatches.find((m) => m.id === matchId);
  }

  if (!match || match.isPlayed)
    return {
      updatedCup: cup,
      updatedHomeTeam: homeTeam,
      updatedAwayTeam: awayTeam,
    };

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
    weather: "Clear",
    timeOfDay: "Evening",
    stats: undefined,
  };

  const result = simulateFullMatch(
    tempMatch,
    homeTeam,
    awayTeam,
    homePlayers,
    awayPlayers,
  );

  match.homeScore = result.homeScore;
  match.awayScore = result.awayScore;
  match.events = result.events;
  match.isPlayed = true;
  if (match.stage === "GROUP") {
    Object.assign(
      homeTeam,
      recordAITacticMatchOutcome(
        homeTeam,
        awayTeam,
        match,
        true,
        match.week,
        cup.season,
      ),
    );
    Object.assign(
      awayTeam,
      recordAITacticMatchOutcome(
        awayTeam,
        homeTeam,
        match,
        false,
        match.week,
        cup.season,
      ),
    );
  }
  // Handle Group Stage Point Updates
  if (match.stage === "GROUP" && group) {

    // Update Standings helper
    const updateTeamStats = (
      teamId: string,
      scored: number,
      conceded: number,
    ) => {
      const stats = group!.standings.find((s) => s.teamId === teamId);
      if (stats) {
        stats.played++;
        stats.gf += scored;
        stats.ga += conceded;
        if (scored > conceded) {
          stats.won++;
          stats.points += 3;
          awardEuropeanBonus(
            getLeagueIdOfTeam(teamId, homeTeam, awayTeam),
            "group_win",
          );
        } else if (scored === conceded) {
          stats.drawn++;
          stats.points += 1;
        } else {
          stats.lost++;
        }
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
  if (match.stage !== "GROUP" && match.stage) {
    let homeScore = match.homeScore;
    let awayScore = match.awayScore;

    // Extra Time if draw
    if (homeScore === awayScore) {
      // Simple random extra time goal logic (reduced probability)
      const homeStrength =
        homePlayers.reduce((sum, p) => sum + p.overall, 0) /
        Math.max(homePlayers.length, 1);
      const awayStrength =
        awayPlayers.reduce((sum, p) => sum + p.overall, 0) /
        Math.max(awayPlayers.length, 1);
      const homeWinChance =
        (homeStrength + 3) / (homeStrength + 3 + awayStrength);

      if (Math.random() < 0.4) {
        // 40% chance of goal in ET
        if (Math.random() < homeWinChance) homeScore++;
        else awayScore++;
      }

      match.extraTime = {
        homeScore: homeScore - match.homeScore,
        awayScore: awayScore - match.awayScore,
      };
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
      match.winnerId =
        finalHome > awayPens ? match.homeTeamId : match.awayTeamId;
    } else {
      match.winnerId =
        match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    }

    // Award coefficient bonus for advancing (simplified: win in knockout)
    if (match.winnerId) {
      const winner = match.winnerId === homeTeam.id ? homeTeam : awayTeam;
      awardEuropeanBonus(winner.leagueId, "knockout");
    }
  }

  // Check for advancement
  const nextCup = advanceGlobalCupStage(cup);

  // === REPUTATION & BUDGET REWARDS ===
  const rewards = calculateCupRewards(
    cup,
    match.id,
    homeTeam,
    awayTeam,
    match.homeScore,
    match.awayScore,
    match.winnerId,
    prizeMultiplier,
  );

  return {
    updatedCup: nextCup,
    updatedHomeTeam: rewards.updatedHomeTeam,
    updatedAwayTeam: rewards.updatedAwayTeam,
  };
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
  prizeMultiplier: number = 1.0,
): {
  updatedHomeTeam: Team;
  updatedAwayTeam: Team;
  rewardDetails: {
    home: { repChange: number; budgetChange: number; description: string };
    away: { repChange: number; budgetChange: number; description: string };
  };
} => {
  // Locate match to determine stage
  let match: any;
  if (cup.groups) {
    for (const g of cup.groups) {
      match = g.matches.find((m) => m.id === matchId);
      if (match) break;
    }
  }
  if (!match && cup.knockoutMatches) {
    match = cup.knockoutMatches.find((m) => m.id === matchId);
  }

  const stage = match?.stage || "GROUP"; // Default

  // 1. Determine Winner
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const isDraw = homeScore === awayScore;

  // 2. Clone teams to update
  const updatedHomeTeam = { ...homeTeam };
  const updatedAwayTeam = { ...awayTeam };

  // 3. Reputation Updates (Dynamic Formula x3 - User Request)
  // Max Loss: 45. Max Gain: ~60. Base Win: 30.
  const calculateDynamicChange = (
    myRep: number,
    oppRep: number,
    result: "WIN" | "LOSS" | "DRAW",
  ): number => {
    const diff = oppRep - myRep; // Positive if opponent is stronger

    if (result === "WIN") {
      // Base 25 + (Diff / 100).
      // If beating stronger (+1000 diff) -> 25 + 10 = 35.
      // If beating weaker (-1000 diff) -> 25 - 10 = 15.
      const change = 25 + diff / 100;
      return (
        Math.min(60, Math.max(10, Math.floor(change))) +
        (stage !== "GROUP" ? 5 : 0)
      ); // Bonus for knockouts
    } else if (result === "LOSS") {
      // Base -15.
      // If losing to stronger (+1000 diff) -> -15 + 10 = -5 (Less penalty).
      // If losing to weaker (-1000 diff) -> -15 - 10 = -25 (More penalty).
      const change = -20 + diff / 100;
      // Cap loss at -45 (User Request)
      return Math.max(-45, Math.min(-5, Math.floor(change)));
    } else {
      // Draw
      // If stronger team draws -> Small penalty.
      // If weaker team draws -> Small gain.
      const change = diff / 200; // +5 for drawing vs +1000 rep team
      return Math.min(15, Math.max(-10, Math.floor(change)));
    }
  };

  const homeRepChange = calculateDynamicChange(
    homeTeam.reputation,
    awayTeam.reputation,
    homeWon ? "WIN" : awayWon ? "LOSS" : "DRAW",
  );
  const awayRepChange = calculateDynamicChange(
    awayTeam.reputation,
    homeTeam.reputation,
    awayWon ? "WIN" : homeWon ? "LOSS" : "DRAW",
  );

  // Apply reputation update
  updatedHomeTeam.reputation = Math.min(
    10000,
    Math.max(1000, updatedHomeTeam.reputation + homeRepChange),
  );
  updatedAwayTeam.reputation = Math.min(
    10000,
    Math.max(1000, updatedAwayTeam.reputation + awayRepChange),
  );

  // 4. Financial Rewards
  const isFinal = stage === "FINAL";
  const getCapacity = (team: Team) =>
    5000 + (team.facilities.stadiumLevel - 1) * 6000;

  // Ticket Price (Dynamic based on stage)
  let ticketPrice = 50;
  if (stage === "ROUND_16") ticketPrice = 60;
  else if (stage === "QUARTER") ticketPrice = 75;
  else if (stage === "SEMI") ticketPrice = 100;
  else if (stage === "FINAL") ticketPrice = 150;

  const homeCapacity = getCapacity(homeTeam);
  const attPct = Math.min(
    1.0,
    0.7 +
    homeTeam.reputation / 20000 +
    awayTeam.reputation / 20000 +
    (stage === "FINAL" ? 0.3 : 0),
  );
  const attendanceCount = Math.floor(homeCapacity * attPct);
  const totalGateReceipts = Math.floor(attendanceCount * ticketPrice);

  // Prize Money (Accumulates)
  let homePrize = 0;
  let awayPrize = 0;

  if (stage === "GROUP") {
    if (homeWon) homePrize += 1200000 * prizeMultiplier;
    else if (awayWon) awayPrize += 1200000 * prizeMultiplier;
    else {
      homePrize += 400000 * prizeMultiplier;
      awayPrize += 400000 * prizeMultiplier;
    }
  }

  // Knockout Prizes (Qualification Bonus - added to WINNER)
  // REDUCED ~50%: Total CL winner prize ~€35M (was ~€70M)
  if (stage !== "GROUP" && winnerId) {
    let progressPrize = 0;
    if (stage === "ROUND_16") progressPrize = 4500000 * prizeMultiplier;
    else if (stage === "QUARTER") progressPrize = 5500000 * prizeMultiplier;
    else if (stage === "SEMI") progressPrize = 6500000 * prizeMultiplier;
    else if (stage === "FINAL") progressPrize = 10000000 * prizeMultiplier; // Winner Bonus

    if (winnerId === homeTeam.id) homePrize += progressPrize;
    else awayPrize += progressPrize;
  }

  // Apply Finances
  const gateMoneyHome = isFinal ? totalGateReceipts / 2 : totalGateReceipts;
  const gateMoneyAway = isFinal ? totalGateReceipts / 2 : 0;

  const homeDelta = gateMoneyHome + homePrize;
  const awayDelta = gateMoneyAway + awayPrize;

  const homeBudgetBeforeReward = updatedHomeTeam.budget;
  const awayBudgetBeforeReward = updatedAwayTeam.budget;

  updatedHomeTeam.budget += homeDelta;
  updatedAwayTeam.budget += awayDelta;

  // Kupa gelirlerini finansal kayda (aynı hafta/season) ekle; history'yi ASLA sıfırlama.
  const recordWeek = match?.week ?? 99;
  const recordSeason = (cup as any)?.season ?? -1;

  const upsertCupIncome = (
    team: Team,
    budgetBefore: number,
    budgetAfter: number,
    gate: number,
    prize: number,
  ) => {
    if (!team.financials) {
      team.financials = {
        lastWeekIncome: {
          tickets: 0,
          sponsor: 0,
          merchandise: 0,
          tvRights: 0,
          transfers: 0,
          winBonus: 0,
        },
        lastWeekExpenses: {
          wages: 0,
          maintenance: 0,
          academy: 0,
          transfers: 0,
        },
        history: [],
      };
    }
    if (!team.financials.history) team.financials.history = [];

    const history = team.financials.history as any[];
    const idx = history.findIndex(
      (r) => r.week === recordWeek && r.season === recordSeason,
    );

    const ensureRecord = (): any => ({
      week: recordWeek,
      season: recordSeason,
      income: {
        tickets: 0,
        sponsor: 0,
        merchandise: 0,
        tvRights: 0,
        transfers: 0,
        winBonus: 0,
        cupPrize: 0,
        total: 0,
      },
      expenses: {
        wages: 0,
        maintenance: 0,
        academy: 0,
        transfers: 0,
        total: 0,
      },
      balance: 0,
      budgetBefore,
      budgetAfter,
    });

    const rec = idx >= 0 ? history[idx] : ensureRecord();
    rec.income.tickets = (rec.income.tickets || 0) + gate;
    rec.income.cupPrize = (rec.income.cupPrize || 0) + prize;

    const incomeTotal =
      (rec.income.tickets || 0) +
      (rec.income.sponsor || 0) +
      (rec.income.merchandise || 0) +
      (rec.income.tvRights || 0) +
      (rec.income.transfers || 0) +
      (rec.income.winBonus || 0) +
      (rec.income.seasonEnd || 0) +
      (rec.income.cupPrize || 0);
    const expenseTotal =
      (rec.expenses.wages || 0) +
      (rec.expenses.maintenance || 0) +
      (rec.expenses.academy || 0) +
      (rec.expenses.transfers || 0) +
      (rec.expenses.facilityUpgrade || 0) +
      (rec.expenses.staffUpgrade || 0);
    rec.income.total = incomeTotal;
    rec.expenses.total = expenseTotal;
    rec.balance = incomeTotal - expenseTotal;
    rec.budgetBefore = Math.min(rec.budgetBefore ?? budgetBefore, budgetBefore);
    rec.budgetAfter = budgetAfter;

    if (idx < 0) history.push(rec);
    if (history.length > 10) team.financials.history = history.slice(-10);
  };

  upsertCupIncome(
    updatedHomeTeam,
    homeBudgetBeforeReward,
    updatedHomeTeam.budget,
    gateMoneyHome,
    homePrize,
  );
  upsertCupIncome(
    updatedAwayTeam,
    awayBudgetBeforeReward,
    updatedAwayTeam.budget,
    gateMoneyAway,
    awayPrize,
  );

  return {
    updatedHomeTeam,
    updatedAwayTeam,
    rewardDetails: {
      home: {
        repChange: homeRepChange,
        budgetChange: gateMoneyHome + homePrize,
        description: `${stage === "GROUP" ? "Group Match" : stage} vs ${awayTeam.name}`,
      },
      away: {
        repChange: awayRepChange,
        budgetChange: gateMoneyAway + awayPrize,
        description: `${stage === "GROUP" ? "Group Match" : stage} vs ${homeTeam.name}`,
      },
    },
  };
};

// Helper: Get League ID
const getLeagueIdOfTeam = (
  teamId: string,
  teamA: Team,
  teamB: Team,
): string => {
  if (teamA.id === teamId) return teamA.leagueId;
  return teamB.leagueId;
};

// Backwards compatible aliases
export const simulateEuropeanCupMatch = simulateGlobalCupMatch;
export const generateEuropeanCup = generateGlobalCup;

// Helper: Advance to next stage (Group -> Round 16 -> Quarter -> Semi -> Final)
export const advanceGlobalCupStage = (cup: GlobalCup): GlobalCup => {
  // Check if current stage is complete
  let stageMatches: GlobalCupMatch[] = [];
  if (cup.currentStage === "GROUP") {
    // Check if all group matches are played
    const allGroupMatches = cup.groups.flatMap((g) => g.matches);
    if (!allGroupMatches.every((m) => m.isPlayed)) return cup;

    // Advance to Round of 16
    // Top 2 from each of 8 groups = 16 teams
    const qualifiedTeams: string[] = [];
    cup.groups.forEach((g) => {
      // Already sorted by points in simulation
      qualifiedTeams.push(g.standings[0].teamId);
      qualifiedTeams.push(g.standings[1].teamId);
    });

    // Create Round 16 Matches
    // Pairing: Group Winner vs Runner-up from another group
    // Simplified: A1 vs B2, B1 vs A2, etc.
    const knockouts: GlobalCupMatch[] = [];

    // A1 vs B2, B1 vs A2
    knockouts.push(
      createKnockoutMatch(
        cup.groups[0].standings[0].teamId,
        cup.groups[1].standings[1].teamId,
        "ROUND_16",
      ),
    );
    knockouts.push(
      createKnockoutMatch(
        cup.groups[1].standings[0].teamId,
        cup.groups[0].standings[1].teamId,
        "ROUND_16",
      ),
    );

    // C1 vs D2, D1 vs C2
    knockouts.push(
      createKnockoutMatch(
        cup.groups[2].standings[0].teamId,
        cup.groups[3].standings[1].teamId,
        "ROUND_16",
      ),
    );
    knockouts.push(
      createKnockoutMatch(
        cup.groups[3].standings[0].teamId,
        cup.groups[2].standings[1].teamId,
        "ROUND_16",
      ),
    );

    // E1 vs F2, F1 vs E2
    knockouts.push(
      createKnockoutMatch(
        cup.groups[4].standings[0].teamId,
        cup.groups[5].standings[1].teamId,
        "ROUND_16",
      ),
    );
    knockouts.push(
      createKnockoutMatch(
        cup.groups[5].standings[0].teamId,
        cup.groups[4].standings[1].teamId,
        "ROUND_16",
      ),
    );

    // G1 vs H2, H1 vs G2
    knockouts.push(
      createKnockoutMatch(
        cup.groups[6].standings[0].teamId,
        cup.groups[7].standings[1].teamId,
        "ROUND_16",
      ),
    );
    knockouts.push(
      createKnockoutMatch(
        cup.groups[7].standings[0].teamId,
        cup.groups[6].standings[1].teamId,
        "ROUND_16",
      ),
    );

    return {
      ...cup,
      currentStage: "ROUND_16",
      knockoutMatches: knockouts,
    };
  } else {
    // Knockout Stages
    stageMatches = cup.knockoutMatches.filter(
      (m) => m.stage === cup.currentStage,
    );
    if (!stageMatches.every((m) => m.isPlayed)) return cup;

    const winners = stageMatches.map((m) => m.winnerId!);
    const nextMatches: GlobalCupMatch[] = [];
    let nextStage: "QUARTER" | "SEMI" | "FINAL" | "COMPLETE" = "COMPLETE";

    if (cup.currentStage === "ROUND_16") {
      nextStage = "QUARTER";
      for (let i = 0; i < winners.length; i += 2) {
        nextMatches.push(
          createKnockoutMatch(winners[i], winners[i + 1], "QUARTER"),
        );
      }
    } else if (cup.currentStage === "QUARTER") {
      nextStage = "SEMI";
      nextMatches.push(createKnockoutMatch(winners[0], winners[1], "SEMI"));
      nextMatches.push(createKnockoutMatch(winners[2], winners[3], "SEMI"));
    } else if (cup.currentStage === "SEMI") {
      nextStage = "FINAL";
      nextMatches.push(createKnockoutMatch(winners[0], winners[1], "FINAL"));
    } else if (cup.currentStage === "FINAL") {
      nextStage = "COMPLETE";
      return { ...cup, currentStage: "COMPLETE", winnerId: winners[0] };
    }

    return {
      ...cup,
      currentStage: nextStage,
      knockoutMatches: [...cup.knockoutMatches, ...nextMatches],
    };
  }
};

const createKnockoutMatch = (
  homeId: string,
  awayId: string,
  stage: "ROUND_16" | "QUARTER" | "SEMI" | "FINAL",
): GlobalCupMatch => {
  // Schedule weeks
  const schedule: Record<string, number> = {
    ROUND_16: 28,
    QUARTER: 31,
    SEMI: 34,
    FINAL: 37,
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
    stats: {
      homePossession: 50,
      awayPossession: 50,
      homeShots: 0,
      awayShots: 0,
      homeOnTarget: 0,
      awayOnTarget: 0,
      homeXG: 0,
      awayXG: 0,
    },
    week: schedule[stage],
  };
};

export const simulateAIGlobalCupMatches = (
  cup: GlobalCup,
  teams: Team[],
  players: Player[],
  userTeamId: string,
  currentWeek: number,
  prizeMultiplier: number = 1.0, // DEFAULT: Full Champions League Money
): { updatedCup: GlobalCup; updatedTeams: Team[] } => {
  // Check if any matches need to be played this week
  let matchesToPlay: GlobalCupMatch[] = [];

  if (cup.currentStage === "GROUP" && cup.groups) {
    cup.groups.forEach((g) => {
      g.matches.forEach((m) => {
        // Play if match is this week OR overdue (catch-up)
        // Assuming group matches are scheduled clearly
        if (
          m.week &&
          m.week <= currentWeek &&
          !m.isPlayed &&
          m.homeTeamId !== userTeamId &&
          m.awayTeamId !== userTeamId
        ) {
          matchesToPlay.push(m);
        }
      });
    });
  } else {
    const schedule: Record<string, number> = {
      ROUND_16: 28,
      QUARTER: 31,
      SEMI: 34,
      FINAL: 37,
    };
    const scheduledWeek = schedule[cup.currentStage];
    if (scheduledWeek && currentWeek >= scheduledWeek) {
      matchesToPlay = cup.knockoutMatches.filter(
        (m) =>
          !m.isPlayed &&
          m.homeTeamId !== userTeamId &&
          m.awayTeamId !== userTeamId,
      );
    }
  }

  if (matchesToPlay.length === 0)
    return { updatedCup: cup, updatedTeams: teams };

  let updatedCup = { ...cup };
  let updatedTeams = [...teams];

  matchesToPlay.forEach((match) => {
    const homeTeam = teams.find((t) => t.id === match.homeTeamId);
    const awayTeam = teams.find((t) => t.id === match.awayTeamId);
    if (!homeTeam || !awayTeam) return;

    const homePlayers = players.filter((p) => p.teamId === match.homeTeamId);
    const awayPlayers = players.filter((p) => p.teamId === match.awayTeamId);

    // Calculate Attendance for Cup Match (Use existing helper if available, or simplified logic)
    // High stakes matches have high attendance
    const attendancePct = Math.min(
      1.0,
      0.7 +
      homeTeam.reputation / 20000 +
      awayTeam.reputation / 20000 +
      Math.random() * 0.2,
    );
    // Bonus for late stages
    const stageBonus =
      match.stage === "SEMI" || match.stage === "FINAL"
        ? 0.2
        : match.stage === "QUARTER"
          ? 0.1
          : 0;
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
      weather: "Clear",
      timeOfDay: "Evening",
      stats: undefined,
    };

    const result = simulateFullMatch(
      tempMatch,
      homeTeam,
      awayTeam,
      homePlayers,
      awayPlayers,
    );

    // === KNOCKOUT MATCHES: Handle Extra Time & Penalties for AI vs AI matches ===
    let finalHomeScore = result.homeScore;
    let finalAwayScore = result.awayScore;
    let matchWinnerId: string | undefined;
    let extraTimeResult: { homeScore: number; awayScore: number } | undefined;
    let penaltyResult: { homeScore: number; awayScore: number } | undefined;

    // Only handle extra time/penalties for knockout stages
    if (match.stage !== "GROUP") {
      if (finalHomeScore === finalAwayScore) {
        // Extra Time - 40% chance of goal in ET
        const homeStrength =
          homePlayers.reduce((sum, p) => sum + p.overall, 0) /
          Math.max(homePlayers.length, 1);
        const awayStrength =
          awayPlayers.reduce((sum, p) => sum + p.overall, 0) /
          Math.max(awayPlayers.length, 1);
        const homeWinChance =
          (homeStrength + 3) / (homeStrength + 3 + awayStrength);

        if (Math.random() < 0.4) {
          if (Math.random() < homeWinChance) finalHomeScore++;
          else finalAwayScore++;
        }
        extraTimeResult = {
          homeScore: finalHomeScore - result.homeScore,
          awayScore: finalAwayScore - result.awayScore,
        };
      }

      // Penalties if still draw after ET
      if (finalHomeScore === finalAwayScore) {
        const homePens = Math.floor(Math.random() * 5) + 3; // 3-7
        const awayPens = Math.floor(Math.random() * 5) + 3;
        // Force a winner
        const finalHomePens = homePens === awayPens ? homePens + 1 : homePens;
        penaltyResult = { homeScore: finalHomePens, awayScore: awayPens };
        matchWinnerId =
          finalHomePens > awayPens ? match.homeTeamId : match.awayTeamId;
      } else {
        matchWinnerId =
          finalHomeScore > finalAwayScore ? match.homeTeamId : match.awayTeamId;
      }
    } else {
      // Group stage: no winner needed (draws are allowed)
      if (finalHomeScore > finalAwayScore) matchWinnerId = match.homeTeamId;
      else if (finalAwayScore > finalHomeScore)
        matchWinnerId = match.awayTeamId;
    }

    updatedCup = {
      ...updatedCup,
      groups: updatedCup.groups?.map((g) => ({
        ...g,
        matches: g.matches.map((m) =>
          m.id === match.id
            ? {
              ...m,
              isPlayed: true,
              homeScore: result.homeScore,
              awayScore: result.awayScore,
              events: result.events,
            }
            : m,
        ),
        standings: g.standings, // Updated below
      })),
      knockoutMatches:
        updatedCup.knockoutMatches?.map((m) =>
          m.id === match.id
            ? {
              ...m,
              isPlayed: true,
              homeScore: finalHomeScore,
              awayScore: finalAwayScore,
              events: result.events,
              winnerId: matchWinnerId,
              extraTime: extraTimeResult,
              penalties: penaltyResult,
            }
            : m,
        ) || [],
    };
    // Re-sync match object with result for local logic
    match.homeScore = finalHomeScore;
    match.awayScore = finalAwayScore;
    match.isPlayed = true;
    match.winnerId = matchWinnerId;

    if (homeTeam.id !== userTeamId) {
      Object.assign(homeTeam, recordAITacticMatchOutcome(
        homeTeam,
        awayTeam,
        match,
        true,
        match.week,
        updatedCup.season,
      ));
    }
    if (awayTeam.id !== userTeamId) {
      Object.assign(awayTeam, recordAITacticMatchOutcome(
        awayTeam,
        homeTeam,
        match,
        false,
        match.week,
        updatedCup.season,
      ));
    }

    if (updatedCup.groups && match.stage === "GROUP") {
      // Groups require manual standing update as simulateFullMatch doesn't touch cup state
      const group = updatedCup.groups.find((g) =>
        g.matches.some((m) => m.id === match.id),
      );
      if (group) {
        const updateTeamStats = (
          teamId: string,
          scored: number,
          conceded: number,
        ) => {
          const stats = group.standings.find((s) => s.teamId === teamId);
          if (stats) {
            stats.played++;
            stats.gf += scored;
            stats.ga += conceded;
            if (scored > conceded) {
              stats.won++;
              stats.points += 3;
            } else if (scored === conceded) {
              stats.drawn++;
              stats.points += 1;
            } else {
              stats.lost++;
            }
          }
        };
        updateTeamStats(match.homeTeamId, match.homeScore, match.awayScore);
        updateTeamStats(match.awayTeamId, match.awayScore, match.homeScore);

        // Sort
        group.standings.sort(
          (a, b) => b.points - a.points || b.gf - b.ga - (a.gf - a.ga),
        );
      }
    }

    // === GLOBAL CUP REPUTATION UPDATE FOR AI TEAMS ===
    // Find the played match
    let playedMatch: GlobalCupMatch | undefined;
    if (updatedCup.groups) {
      for (const g of updatedCup.groups) {
        const m = g.matches.find((x) => x.id === match.id);
        if (m) {
          playedMatch = m;
          break;
        }
      }
    }
    if (!playedMatch && updatedCup.knockoutMatches) {
      playedMatch = updatedCup.knockoutMatches.find((x) => x.id === match.id);
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

        if (playedMatch.stage === "QUARTER") repBonus += 10;
        else if (playedMatch.stage === "SEMI") repBonus += 20;
        if (playedMatch.stage === "QUARTER") repBonus += 10;
        else if (playedMatch.stage === "SEMI") repBonus += 20;
        else if (playedMatch.stage === "FINAL") repBonus += 50;

        updatedTeams = updatedTeams.map((t) =>
          t.id === homeTeam.id
            ? { ...t, reputation: Math.min(10000, t.reputation + repBonus) }
            : t,
        );

        // === COEFFICIENT UPDATE ===
        awardEuropeanBonus(
          homeTeam.leagueId,
          playedMatch.stage === "GROUP" ? "group_win" : "knockout",
        );
      } else if (!isDraw) {
        // Home team lost
        const repPenalty = Math.min(
          15,
          Math.floor((homeTeam.reputation - awayTeam.reputation) / 300),
        );
        updatedTeams = updatedTeams.map((t) =>
          t.id === homeTeam.id
            ? {
              ...t,
              reputation: Math.max(
                1000,
                t.reputation - Math.max(5, repPenalty),
              ),
            }
            : t,
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

        if (playedMatch.stage === "QUARTER") repBonus += 10;
        else if (playedMatch.stage === "SEMI") repBonus += 20;
        else if (playedMatch.stage === "FINAL") repBonus += 50;

        updatedTeams = updatedTeams.map((t) =>
          t.id === awayTeam.id
            ? { ...t, reputation: Math.min(10000, t.reputation + repBonus) }
            : t,
        );

        // === COEFFICIENT UPDATE ===
        awardEuropeanBonus(
          awayTeam.leagueId,
          playedMatch.stage === "GROUP" ? "group_win" : "knockout",
        );
      } else if (!isDraw) {
        // Away team lost
        const repPenalty = Math.min(
          15,
          Math.floor((awayTeam.reputation - homeTeam.reputation) / 300),
        );
        updatedTeams = updatedTeams.map((t) =>
          t.id === awayTeam.id
            ? {
              ...t,
              reputation: Math.max(
                1000,
                t.reputation - Math.max(5, repPenalty),
              ),
            }
            : t,
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

    const isFinal = match.stage === "FINAL";
    // Base Stadium Capacity (Level 1=5000, +8000 per level)
    const getCapacity = (team: Team) =>
      5000 + (team.facilities.stadiumLevel - 1) * 8000;

    // Ticket Price based on Stage
    let ticketPrice = 50; // Group
    if (match.stage === "ROUND_16") ticketPrice = 60;
    else if (match.stage === "QUARTER") ticketPrice = 75;
    else if (match.stage === "SEMI") ticketPrice = 100;
    else if (match.stage === "FINAL") ticketPrice = 150; // Expensive final tickets!

    const homeCapacity = getCapacity(homeTeam);
    // Using the calculated attendancePct from earlier (re-calculating simply here as local var is lost in loop scope unless passed)
    const attPct = Math.min(
      1.0,
      0.7 +
      homeTeam.reputation / 20000 +
      awayTeam.reputation / 20000 +
      (match.stage === "FINAL" ? 0.3 : 0),
    );
    const attendanceCount = Math.floor(homeCapacity * attPct);

    const totalGateReceipts = Math.floor(attendanceCount * ticketPrice);

    // 2. Prize Money (Performance Based)
    // Group Win: 2.8M, Draw: 900k
    // Round Progression Bonuses calculated at END of stage usually, but we can give instant win rewards here

    let homePrize = 0;
    let awayPrize = 0;

    // Match Performance Prizes (Group Stage) — REDUCED ~57%
    if (match.stage === "GROUP") {
      if (match.homeScore > match.awayScore)
        homePrize += 1200000 * prizeMultiplier; // Win
      else if (match.awayScore > match.homeScore)
        awayPrize += 1200000 * prizeMultiplier; // Win
      else {
        homePrize += 400000 * prizeMultiplier; // Draw
        awayPrize += 400000 * prizeMultiplier;
      }
    }

    // Progression Prizes (Knockout Wins/Advancement) — REDUCED ~55%
    // Total CL winner knockout prize: ~€27M (was ~€43M in AI sim)
    if (match.stage !== "GROUP" && match.winnerId) {
      let progressPrize = 0;
      if (match.stage === "ROUND_16")
        progressPrize = 4500000 * prizeMultiplier;
      else if (match.stage === "QUARTER")
        progressPrize = 5500000 * prizeMultiplier;
      else if (match.stage === "SEMI")
        progressPrize = 6500000 * prizeMultiplier;
      else if (match.stage === "FINAL")
        progressPrize = 10000000 * prizeMultiplier; // Winner Bonus

      if (match.winnerId === homeTeam.id) homePrize += progressPrize;
      else awayPrize += progressPrize;
    }

    // Apply Finances to Teams
    updatedTeams = updatedTeams.map((t) => {
      if (t.id === homeTeam.id) {
        const gateMoney = isFinal ? totalGateReceipts / 2 : totalGateReceipts;
        return { ...t, budget: t.budget + gateMoney + homePrize };
      }
      if (t.id === awayTeam.id) {
        const gateMoney = isFinal ? totalGateReceipts / 2 : 0; // Away team gets nothing unless final
        return { ...t, budget: t.budget + gateMoney + awayPrize };
      }
      return t;
    });

    // NOTIFICATION FOR USER (If involved)
    if (homeTeam.id === userTeamId || awayTeam.id === userTeamId) {
      const userIsHome = homeTeam.id === userTeamId;
      const myPrize = userIsHome ? homePrize : awayPrize;
      const myGate = userIsHome
        ? isFinal
          ? totalGateReceipts / 2
          : totalGateReceipts
        : isFinal
          ? totalGateReceipts / 2
          : 0;

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
  awayPlayers: Player[],
): { updatedHomePlayers: Player[]; updatedAwayPlayers: Player[] } => {
  // Helper to calculate rating for a single player
  const calculatePlayerRating = (
    p: Player,
    isHome: boolean,
    teamScore: number,
    oppScore: number,
    teamWon: boolean,
    teamLost: boolean,
    isDraw: boolean,
    cleanSheet: boolean,
    teamSaves: number,
  ) => {
    // Base rating
    let rating = 6.0 + p.overall / 40 + (Math.random() * 1.5 - 0.5);

    // Result bonus/penalty
    if (teamWon) rating += 0.5;
    else if (isDraw) rating += 0.1;
    else rating -= 0.3;

    // Clean sheet bonus (GK/DEF)
    if (cleanSheet && (p.position === "GK" || p.position === "DEF")) {
      rating += 0.8;
    }

    // GK Saves bonus
    if (p.position === "GK") {
      rating += teamSaves * 0.2;
    }

    // Goals bonus
    const goals = match.events.filter(
      (e: MatchEvent) => e.type === MatchEventType.GOAL && e.playerId === p.id,
    ).length;
    rating += goals * 1.0;

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
  match.events.forEach((e) => {
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
    const played = p.lineup === "STARTING" || substitutedOutIds.has(p.id);

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
      isHome ? match.stats.homeSaves || 0 : match.stats.awaySaves || 0,
    );

    const oldAvg = p.stats.averageRating || 6.0;
    const newAvg = (oldAvg * oldApps + rating) / newApps;

    // Form Update
    const formChange = rating > 7.0 ? 1 : rating < 5.5 ? -1 : 0;
    const newForm = Math.min(10, Math.max(1, p.form + formChange));

    return {
      ...p,
      stats: {
        ...p.stats,
        appearances: newApps,
        averageRating: parseFloat(newAvg.toFixed(2)),
      },
      form: newForm,
    };
  };

  return {
    updatedHomePlayers: homePlayers.map((p) => updatePlayerStats(p, true)),
    updatedAwayPlayers: awayPlayers.map((p) => updatePlayerStats(p, false)),
  };
};

// === MATCH SITUATION ANALYSIS ===
export const analyzeMatchSituation = (
  matchStatus: {
    minute: number;
    score: { home: number; away: number };
    isHome: boolean;
  },
  currentTactic: TeamTactic,
): AssistantAdvice[] => {
  const advice: AssistantAdvice[] = [];
  const { minute, score, isHome } = matchStatus;
  const myScore = isHome ? score.home : score.away;
  const oppScore = isHome ? score.away : score.home;
  const goalDiff = myScore - oppScore;

  // 1. Late Game - Losing
  if (minute > 70 && goalDiff < 0) {
    if (currentTactic.aggression !== "Aggressive") {
      advice.push({
        type: "CRITICAL",
        message: "Zaman daralıyor! Daha agresif oynamalıyız!",
      });
    }
    if (currentTactic.defensiveLine !== "High") {
      advice.push({
        type: "WARNING",
        message: "Savunma hattını ileri çıkarmalıyız.",
      });
    }
  }

  // 2. Late Game - Winning Narrowly
  if (minute > 75 && goalDiff === 1) {
    if (
      currentTactic.style !== "ParkTheBus" &&
      currentTactic.tempo !== "Slow"
    ) {
      advice.push({
        type: "WARNING",
        message: "Skoru korumaya odaklanmalıyız. Oyunu yavaşlatın.",
      });
    }
  }

  // 3. Winning Comfortably
  if (minute > 60 && goalDiff >= 3) {
    advice.push({
      type: "INFO",
      message:
        "Maç bizim kontrolümüzde. Yorulan oyuncuları dinlendirmeyi düşün.",
    });
  }

  // 4. Early Goal Conceded
  if (minute < 20 && goalDiff < 0) {
    advice.push({
      type: "INFO",
      message: "Henüz erken, paniğe gerek yok. Planımıza sadık kalalım.",
    });
  }

  return advice;
};

// === HELPER FOR USEMATCHSIMULATION ===
// Allows retrieving the FINAL state of players (stats, condition, cards) after a match
export const getFinalMatchStats = () => {
  if (!activeEngine) return null;
  return {
    homePlayers: activeEngine.homePlayers,
    awayPlayers: activeEngine.awayPlayers,
  };
};
