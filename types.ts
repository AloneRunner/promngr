
export enum Position { GK = 'GK', DEF = 'DEF', MID = 'MID', FWD = 'FWD' }
export enum TacticType {
    T_442 = '4-4-2',
    T_433 = '4-3-3',
    T_352 = '3-5-2',
    T_541 = '5-4-1',
    T_451 = '4-5-1',
    T_4231 = '4-2-3-1',
    T_343 = '3-4-3',
    T_4141 = '4-1-4-1',
    T_532 = '5-3-2',
    T_41212 = '4-1-2-1-2 (Diamond)',
    T_4321 = '4-3-2-1 (Xmas Tree)'
}
export enum MatchEventType { GOAL = 'GOAL', CARD_YELLOW = 'CARD_YELLOW', CARD_RED = 'CARD_RED', SUB = 'SUB', INJURY = 'INJURY', FULL_TIME = 'FULL_TIME', HALF_TIME = 'HALF_TIME' }
export enum MessageType { INFO = 'INFO', INJURY = 'INJURY', TRANSFER_OFFER = 'TRANSFER_OFFER', BOARD = 'BOARD', TRAINING = 'TRAINING' }
export type LineupStatus = 'STARTING' | 'BENCH' | 'RESERVE';
export enum CoachArchetype { TACTICIAN = 'TACTICIAN', MOTIVATOR = 'MOTIVATOR', DEVELOPER = 'DEVELOPER' }
export type TrainingFocus = 'BALANCED' | 'ATTACK' | 'DEFENSE' | 'PHYSICAL' | 'TECHNICAL';
export type TrainingIntensity = 'LIGHT' | 'NORMAL' | 'HEAVY';

export enum TeamMentality {
    PARK_THE_BUS = 'PARK_THE_BUS',
    DEFENSIVE = 'DEFENSIVE',
    BALANCED = 'BALANCED',
    ATTACKING = 'ATTACKING',
    ALL_OUT_ATTACK = 'ALL_OUT_ATTACK'
}

export interface PlayerAttributes {
    finishing: number; passing: number; tackling: number; dribbling: number; goalkeeping: number;
    speed: number; stamina: number; strength: number; positioning: number; aggression: number;
    composure: number; vision: number; leadership: number; decisions: number;
}

export interface PlayerVisual {
    skinColor: string; hairColor: string; hairStyle: number; accessory: boolean;
}

export interface PlayerStats {
    goals: number; assists: number; yellowCards: number; redCards: number; appearances: number;
    averageRating: number; // NEW: Track average match rating (0-10)
}

export interface PlayerPersonality {
    riskTaking: number; // 0-1
    discipline: number; // 0-1
    pressureHandling: number; // 0-1
}

export interface Player {
    id: string; firstName: string; lastName: string; age: number; nationality: string; position: Position;
    attributes: PlayerAttributes; hiddenAttributes: { consistency: number; importantMatches: number; injuryProneness: number; };
    visual: PlayerVisual; stats: PlayerStats; overall: number; potential: number; value: number; wage: number; salary: number; // yearly salary in euros
    contractYears: number; morale: number; condition: number; form: number; teamId: string;
    isTransferListed: boolean; weeksInjured: number; matchSuspension: number; lineup: LineupStatus;
    lineupIndex: number; // NEW: Explicit ordering in lineup views
    jerseyNumber?: number;
    playStyles: string[]; details: any; careerHistory?: any[];
    // Runtime generated properties
    personality?: PlayerPersonality;
}

export interface TeamTactic {
    formation: TacticType; style: string; aggression: string; tempo: string; width: string;
    defensiveLine: string; passingStyle: string; marking: string; customPositions?: Record<string, { x: number, y: number }>;
}

export interface TeamFacilities {
    stadiumCapacity: number; stadiumLevel: number; trainingLevel: number; academyLevel: number;
}

export interface TeamStaff {
    headCoachLevel: number; // Influences match simulation & tactics
    scoutLevel: number;     // Influences youth intake & transfer details
    physioLevel: number;    // Influences injury recovery & stamina
}

export interface BoardObjective {
    id: string;
    description: string;
    type: 'LEAGUE_POS' | 'CUP' | 'FINANCIAL' | 'DEVELOPMENT';
    targetValue?: number;
    currentValue?: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    isMandatory: boolean;
}

export interface Sponsor {
    id: string; name: string; description: string; weeklyIncome: number; winBonus: number; duration: number;
}

export interface TeamStats {
    played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number;
}

export interface Team {
    id: string; name: string; city: string; primaryColor: string; secondaryColor: string;
    reputation: number; budget: number;
    leagueId: string; // NEW: To separate teams by league
    wages: number; // Total weekly wage bill
    facilities: TeamFacilities;
    staff: TeamStaff; // NEW
    objectives: BoardObjective[]; // NEW
    tactic: TeamTactic;
    coachArchetype: CoachArchetype; trainingFocus: TrainingFocus; trainingIntensity: TrainingIntensity;
    youthCandidates: Player[]; recentForm: string[]; stats: TeamStats; sponsor?: Sponsor;
    financials?: {
        lastWeekIncome: { tickets: number; sponsor: number; merchandise: number; tvRights: number; transfers: number; };
        lastWeekExpenses: { wages: number; maintenance: number; academy: number; transfers: number; };
    };
}

export interface MatchEvent {
    minute: number; type: MatchEventType; description: string; teamId?: string; playerId?: string;
}

export interface MatchStats {
    homePossession: number; awayPossession: number; homeShots: number; awayShots: number;
    homeOnTarget: number; awayOnTarget: number; homeXG: number; awayXG: number;
    homeSaves?: number; awaySaves?: number; // NEW: Goalkeeper saves
}

export interface SimulationState {
    ball: {
        x: number; y: number; z: number; // Z-axis for height
        vx: number; vy: number; vz: number;
        curve?: number; // Magnus effect (spin)
        ownerId: string | null;
    };
    players: Record<string, {
        x: number; y: number;
        z?: number; // Height (Jump)
        facing: number; // Facing angle in radians
        vx?: number; // X Velocity
        vy?: number; // Y Velocity
        stamina?: number; // Current Stamina
        state?: 'IDLE' | 'RUN' | 'SPRINT' | 'KICK' | 'TACKLE'; // For animation states
    }>;
    homeMentality?: TeamMentality;
    awayMentality?: TeamMentality;
}

export interface LiveMatchData {
    ballHolderId: string | null; pitchZone: number; lastActionText: string; simulation: SimulationState;
}

export interface Match {
    id: string; week: number; homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number;
    events: MatchEvent[]; isPlayed: boolean; isFriendly?: boolean; date: number; attendance: number;
    currentMinute: number; weather: string; timeOfDay: string; stats: MatchStats; liveData?: LiveMatchData;
}

export interface Message {
    id: string; week: number; type: MessageType; subject: string; body: string; isRead: boolean; date: string; data?: any;
}

export interface TransferOffer {
    id: string;
    playerId: string;
    playerName: string;
    fromTeamId: string;
    fromTeamName: string;
    toTeamId: string;
    offerAmount: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
    weekCreated: number;
}

export interface LeagueHistoryEntry {
    season: number; championId: string; championName: string; championColor: string;
    runnerUpName: string; topScorer: string; topAssister: string;
}

export interface EuropeanCupMatch {
    id: string;
    round: 'ROUND_16' | 'QUARTER' | 'SEMI' | 'FINAL';
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    isPlayed: boolean;
    winnerId?: string;
}

export interface EuropeanCup {
    season: number;
    isActive: boolean;
    qualifiedTeamIds: string[];
    matches: EuropeanCupMatch[];
    currentRound: 'ROUND_16' | 'QUARTER' | 'SEMI' | 'FINAL' | 'COMPLETE';
    winnerId?: string;
    _generatedForeignTeams?: any[]; // Temporary storage for foreign teams generated during cup creation
}

export interface GameState {
    currentWeek: number; currentSeason: number; userTeamId: string; leagueId: string;
    teams: Team[]; players: Player[]; matches: Match[]; isSimulating: boolean;
    messages: Message[]; transferMarket: Player[]; history: LeagueHistoryEntry[];
    pendingOffers: TransferOffer[];
    europeanCup?: EuropeanCup;
    europaLeague?: EuropeanCup; // NEW: UEFA Europa League support
}

export interface AssistantAdvice {
    type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string;
}

export interface ValidationResult {
    isValid: boolean; errors: string[];
}

export interface Translation {
    [key: string]: string;
}

export interface GameProfile {
    id: string;
    name: string;
    createdAt: number;
    lastPlayedAt: number;
    gameState: GameState | null;
    thumbnailData?: {
        teamName: string;
        leagueName: string;
        currentWeek: number;
        currentSeason: number;
        teamColor: string;
        budget: number;
        leaguePosition: number;
    };
}

export interface ProfileManagerState {
    profiles: GameProfile[];
    activeProfileId: string | null;
}
