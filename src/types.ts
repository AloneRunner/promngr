export enum Position { GK = 'GK', DEF = 'DEF', MID = 'MID', FWD = 'FWD' }

export enum MatchEventType {
    GOAL = 'GOAL', CARD_YELLOW = 'CARD_YELLOW', CARD_RED = 'CARD_RED',
    SUB = 'SUB', INJURY = 'INJURY', FULL_TIME = 'FULL_TIME',
    HALF_TIME = 'HALF_TIME', PENALTY = 'PENALTY', CORNER = 'CORNER',
    KICKOFF = 'KICKOFF', GOAL_KICK = 'GOAL_KICK', FOUL = 'FOUL', FREE_KICK = 'FREE_KICK', THROW_IN = 'THROW_IN', INFO = 'INFO',
    OFFSIDE = 'OFFSIDE'
}

export enum MessageType { INFO = 'INFO', INJURY = 'INJURY', TRANSFER_OFFER = 'TRANSFER_OFFER', BOARD = 'BOARD', TRAINING = 'TRAINING', CONTRACT_RENEWAL = 'CONTRACT_RENEWAL' }
export type LineupStatus = 'STARTING' | 'BENCH' | 'RESERVE';
export enum CoachArchetype { TACTICIAN = 'TACTICIAN', MOTIVATOR = 'MOTIVATOR', DEVELOPER = 'DEVELOPER' }
export enum ManagerArchetype { TACTICIAN = 'TACTICIAN', MOTIVATOR = 'MOTIVATOR', NEGOTIATOR = 'NEGOTIATOR', SCOUT = 'SCOUT' }
export type TrainingFocus = 'BALANCED' | 'ATTACK' | 'DEFENSE' | 'PHYSICAL' | 'TECHNICAL' | 'POSITION_BASED';
export type TrainingIntensity = 'LIGHT' | 'NORMAL' | 'HEAVY';

export interface ManagerBonusProfile {
    homeNationConfidenceBonus: number;
    transferNegotiationBonus: number;
    scoutingKnowledgeBonus: number;
}

export interface ManagerCareerStats {
    matchesManaged: number;
    wins: number;
    draws: number;
    losses: number;
    trophiesWon: number;
}

export interface ManagerTalentTree {
    leadership: number;
    negotiation: number;
    development: number;
    scouting: number;
}

export interface ManagerPersonalStaff {
    scoutAdvisor: number;
    developmentCoach: number;
    contractLawyer: number;
}

export type ManagerObjectiveType = 'LEAGUE_POSITION' | 'BOARD_CONFIDENCE' | 'CLUB_BUDGET';
export type ManagerObjectiveStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface ManagerObjective {
    id: string;
    season: number;
    type: ManagerObjectiveType;
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    rewardBalance: number;
    rewardXp: number;
    rewardReputation: number;
    status: ManagerObjectiveStatus;
}

export type ManagerTalentKey = keyof ManagerTalentTree;
export type ManagerCourseKey = 'PRO_LICENSE' | 'LEADERSHIP_SEMINAR' | 'NEGOTIATION_SUMMIT' | 'SCOUTING_TOUR' | 'DEVELOPMENT_WORKSHOP';
export type ManagerStaffRoleKey = keyof ManagerPersonalStaff;

export interface ManagerProfileData {
    firstName: string;
    lastName: string;
    displayName: string;
    nationality: string;
    archetype: ManagerArchetype;
    level: number;
    xp: number;
    xpToNextLevel: number;
    reputation: number;
    skillPoints: number;
    createdAt: string;
    currentTeamId?: string;
    bonuses: ManagerBonusProfile;
    careerStats: ManagerCareerStats;
    talents: ManagerTalentTree;
    personalStaff: ManagerPersonalStaff;
    objectives: ManagerObjective[];
    personalBalance: number;
    lifetimeEarnings: number;
    lifetimeSpent: number;
    unlockedAchievements: string[];
    playGamesSyncedAchievements: string[];
    engineMatchesPlayed?: Record<string, number>;
    purchasedCourses?: ManagerCourseKey[];
    cleanSheetStreak?: number;
    awayWinStreak?: number;
    consecutiveLeagueTitles?: number;
}

export interface ManagerCreationData {
    firstName: string;
    lastName: string;
    nationality: string;
    archetype: ManagerArchetype;
}

export enum TeamMentality {
    PARK_THE_BUS = 'ParkTheBus',
    DEFENSIVE = 'Defensive',
    BALANCED = 'Balanced',
    ATTACKING = 'Attacking',
    ALL_OUT_ATTACK = 'Ultra-Attacking'
}

// Taktik Tipleri
export enum TacticType {
    T_442 = '4-4-2', T_433 = '4-3-3', T_352 = '3-5-2', T_541 = '5-4-1',
    T_451 = '4-5-1', T_4231 = '4-2-3-1', T_343 = '3-4-3', T_4141 = '4-1-4-1',
    T_532 = '5-3-2', T_41212 = '4-1-2-1-2', T_4321 = '4-3-2-1'
}

export type PressingIntensity = 'StandOff' | 'Balanced' | 'HighPress' | 'Gegenpress';

export interface PlayerAttributes {
    finishing: number; passing: number; tackling: number; dribbling: number; goalkeeping: number;
    speed: number; stamina: number; strength: number; positioning: number; aggression: number;
    composure: number; vision: number; leadership: number; decisions: number;
}

export interface Player {
    id: string; firstName: string; lastName: string; age: number; nationality: string; position: Position;
    attributes: PlayerAttributes; hiddenAttributes: { consistency: number; importantMatches: number; injuryProneness: number; };
    visual?: any; stats: any; overall: number; potential: number; value: number; wage: number; salary: number;
    contractYears: number; morale: number; condition: number; form: number; teamId: string;
    isTransferListed: boolean; isNotForSale?: boolean; weeksInjured: number; matchSuspension: number; lineup: LineupStatus;
    lineupIndex: number; jerseyNumber?: number; playStyles: string[]; details?: any;
    moraleHistory?: { week: number; change: number; reason: string }[];
    playedThisWeek?: boolean; lastTransferWeek?: number; lastTransferSeason?: number; personality?: any;
    careerHistory?: any[]; freeAgentSince?: number;
}

export interface TeamTactic {
    formation: TacticType; style: string; aggression: string; tempo: string; width: string;
    defensiveLine: string; passingStyle: string; marking: string;
    pressingIntensity?: PressingIntensity; // YENİ: Pres Yoğunluğu
    instructions?: string[]; // YENİ: Takım Talimatları (WorkBallIntoBox, ShootOnSight, vb)
    customPositions?: Record<string, { x: number, y: number }>;
    mentality?: string;
    attackPlan?: 'AUTO' | 'WIDE_CROSS' | 'CUTBACK' | 'THIRD_MAN' | 'DIRECT_CHANNEL';
    slotInstructions?: Record<number, string>; // YENİ: Oyuncu bazlı talimat (lineupIndex → instruction)
    finalThird?: 'EARLY_SHOT' | 'PATIENT' | 'BALANCED'; // Son üçte şut felsefesi
    attackApproach?: 'VERTICAL' | 'FLUID' | 'PATIENT' | 'BALANCED'; // Hücum geçiş stili
}

export interface AITacticMemorySnapshot {
    mentality?: string;
    style: string;
    tempo: string;
    width: string;
    defensiveLine: string;
    passingStyle: string;
    pressingIntensity?: PressingIntensity;
    attackPlan?: 'AUTO' | 'WIDE_CROSS' | 'CUTBACK' | 'THIRD_MAN' | 'DIRECT_CHANNEL';
    formation?: string;
    defenseApproach?: string;
    attackApproach?: string;
    finalThird?: string;
}

export interface AITacticMemoryEntry {
    key: string;
    tactic: AITacticMemorySnapshot;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    offsides: number;
    cumulativeScore: number;
    weightedScore: number;
    lastUsedWeek?: number;
    lastUsedSeason?: number;
}

export interface AITacticMemory {
    entries: Record<string, AITacticMemoryEntry>;
    preferredKey?: string;
    lastUpdatedWeek?: number;
    lastUpdatedSeason?: number;
}


export interface Financials {
    lastWeekIncome: { tickets: number; sponsor: number; merchandise: number; tvRights: number; transfers: number; winBonus: number; ffpSolidarity?: number; };
    lastWeekExpenses: { wages: number; maintenance: number; academy: number; transfers: number; ffpTax?: number; };
    seasonTotals?: { transferIncomeThisSeason: number; transferExpensesThisSeason: number; }; // Track season-long transfer balance
    history?: FinancialRecord[]; // Son 10 haftanın kayıtları
}

export interface FinancialRecord {
    week: number;
    season: number;
    income: {
        tickets: number;
        sponsor: number;
        merchandise: number;
        tvRights: number;
        transfers: number;
        winBonus: number;
        seasonEnd?: number; // Sezon sonu ödülleri
        cupPrize?: number; // Kupa ödülleri
        total: number;
    };
    expenses: {
        wages: number;
        maintenance: number;
        academy: number;
        transfers: number;
        facilityUpgrade?: number;
        staffUpgrade?: number;
        total: number;
    };
    balance: number; // Gelir - Gider
    budgetBefore: number;
    budgetAfter: number;
}

export interface Team {
    id: string; name: string; shortName?: string; city: string; primaryColor: string; secondaryColor: string;
    reputation: number; budget: number; boardConfidence: number; leagueId: string; wages: number;
    facilities: { stadiumCapacity: number; stadiumLevel: number; trainingLevel: number; academyLevel: number; stadiumConstructionWeeks?: number; trainingConstructionWeeks?: number; academyConstructionWeeks?: number; };
    staff: { headCoachLevel: number; scoutLevel: number; physioLevel: number; };
    objectives: any[]; tactic: TeamTactic; coachArchetype: CoachArchetype;
    trainingFocus: TrainingFocus; trainingIntensity: TrainingIntensity;
    youthCandidates: Player[]; recentForm: string[]; stats: any; sponsor?: any; financials?: Financials;
    reputationHistory?: any[]; confidenceHistory?: any[];
    lastSeasonPosition?: number; // Önceki sezon lig pozisyonu (0-indexed: 0=şampiyon, 1=ikinci, vb.)
    aiTacticMemory?: AITacticMemory;
}

export interface Match {
    id: string; week: number; homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number;
    events: MatchEvent[]; isPlayed: boolean; isFriendly?: boolean; date: number; attendance: number;
    currentMinute: number; weather: string; timeOfDay: string; stats: any; liveData?: any;
    // YENİ: ID çakışmasını önlemek için
    type?: 'LEAGUE' | 'CUP' | 'FRIENDLY' | 'SUPER_CUP';
    competitionId?: string;
    competitionName?: string;
    season?: number;
    winnerId?: string;
}

export interface GlobalCup {
    season: number; isActive: boolean; qualifiedTeamIds: string[];
    groups?: any[]; knockoutMatches?: any[]; currentStage: string; winnerId?: string;
    _generatedForeignTeams?: any[];
}

// Geriye uyumluluk aliasları
export type EuropeanCup = GlobalCup;
export type EuropeanCupMatch = any;
export type GlobalCupMatch = any;
export type SuperCup = any;
export type SimulationState = any;

export interface PerformanceSettings {
    showAnimations: boolean;          // Maç animasyonları göster/gizle
    detailedStats: boolean;            // Detaylı istatistikler göster/gizle
    backgroundSimulation: boolean;     // Hafta simülasyonu arka planda çalışsın (loading ekranı)
    autoSave: 'ALWAYS' | 'WEEKLY' | 'MONTHLY'; // Otomatik kayıt sıklığı
    aiTransferActivity: 'LOW' | 'NORMAL' | 'HIGH'; // AI takımların transfer piyasası aktivitesi
    goalReplay?: boolean;              // Gol sonrası yavaş çekim tekrar
}

export interface GameState {
    currentWeek: number; currentSeason: number; userTeamId: string; leagueId: string;
    teams: Team[]; players: Player[]; matches: Match[]; isSimulating: boolean;
    messages: any[]; isGameOver?: boolean; gameOverReason?: string; isUnemployed?: boolean;
    transferMarket: Player[]; history: any[]; pendingOffers: any[];
    europeanCup?: GlobalCup; europaLeague?: GlobalCup; superCup?: any;
    managerProfile?: ManagerProfileData;
    managerRating?: number; managerSalary?: number; managerCareerHistory?: any[]; managerTrophies?: any;
    jobOffers?: any[]; tacticalHistory?: any[];
    leagueReputationBonuses?: any; baseLeagueReputations?: any; leagueEuropeanBonuses?: any; leagueCoefficients?: any; leagueCoefficientHistory?: any;
    performanceSettings?: PerformanceSettings; // YENI: Performans ayarları
    isWeekSimulating?: boolean;        // YENI: Background simulation durumu
    simulationProgress?: number;       // YENI: Simülasyon ilerlemesi (0-100)
    marketInflationMultiplier?: number; // Smooth market inflation (kademeli, haftalık güncellenir)
    transferTaxPot?: number; // Global transfer tax pool — distributed at season end
}

export type Translation = any;
export type AssistantAdvice = { type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; };
export type GameProfile = { id: string; name: string; createdAt: number; lastPlayedAt: number; gameState: GameState | null; thumbnailData?: any; };

export interface PlayerVisual {
    avatarUrl?: string;
    faceId?: string;
    skinTone?: string;
    hairStyle?: string;
    kitColor?: string;
}

export interface ProfileManagerState {
    profiles: GameProfile[];
    activeProfileId: string | null;
}

// Missing Interfaces added for compatibility
export interface MatchEvent {
    minute: number; type: MatchEventType; description: string; teamId?: string; playerId?: string;
    playerOutId?: string;
}
export interface Message {
    id: string; week: number; type: MessageType; subject: string; body: string; isRead: boolean; date: string; data?: any; sender?: string;
}
export interface Sponsor {
    id: string; name: string; description: string; weeklyIncome: number; winBonus: number; duration: number;
    bonus1st?: number; bonus2nd?: number; bonus3rd?: number;
}
export interface BoardObjective {
    id: string; description: string; type: 'LEAGUE_POS' | 'CUP' | 'FINANCIAL' | 'DEVELOPMENT';
    targetValue?: number; currentValue?: number; status: 'PENDING' | 'COMPLETED' | 'FAILED'; isMandatory: boolean;
}
export interface TeamStaff {
    headCoachLevel: number; scoutLevel: number; physioLevel: number;
}
export interface TransferOffer {
    id: string; playerId: string; playerName: string; fromTeamId: string; fromTeamName: string; toTeamId: string;
    offerAmount: number; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'; weekCreated: number;
}
export type JobOfferPressure = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type JobOfferSalaryLevel = 'MODEST' | 'FAIR' | 'STRONG' | 'ELITE';
export interface JobOffer {
    id: string; teamId: string; teamName: string; leagueId: string; leagueName: string; reputation: number;
    salary: number; requiredRating: number; expiresWeek: number; isAccepted?: boolean;
    objective: string; pressure: JobOfferPressure; salaryLevel: JobOfferSalaryLevel; offerScore: number;
}
export interface LeagueHistoryEntry {
    season: number; leagueId: string; leagueName: string; championId: string; championName: string; championColor: string;
    runnerUpName: string; topScorer: string; topAssister: string; bestRatedPlayer?: string;
    championsLeagueWinner?: string; europaLeagueWinner?: string; superCupWinner?: string;
}
export interface GlobalCupGroup {
    id: string; name: string; teams: string[]; standings: GlobalCupGroupTeam[]; matches: GlobalCupMatch[];
}
export interface GlobalCupGroupTeam {
    teamId: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number;
}
export interface TacticalChange {
    minute: number; previousFormation: string; previousStyle: string; newFormation: string; newStyle: string;
    scoreAtTime: { home: number; away: number };
}
export interface PlayerPersonality {
    riskTaking: number; discipline: number; pressureHandling: number;
}

export interface LeaguePreset {
    id: string;
    name: string;
    country: string;
    foreignPlayerChance: number;
    playerNationality: string;
    matchFormat: string;
    region?: string; // NEW: Global Cup Group/Region ID
    logo?: string;   // NEW: League Logo
    flag?: string;   // NEW: Country Flag Emoji
    realTeams: {
        name: string;
        city: string;
        primaryColor: string;
        secondaryColor: string;
        reputation: number;
        budget: number;
        stadiumCapacity: number;
    }[];
}


export interface TacticalMatchRecord {
    matchId: string;
    season: number;
    week: number;
    opponentId: string;
    isUserHome: boolean;
    homeTactic: TeamTactic;
    awayTactic: TeamTactic;
    homeGoals: number;
    awayGoals: number;
    userWon: boolean;
    matchDate: number;
    userFinalTactic?: TeamTactic;
}
