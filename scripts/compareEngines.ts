import { MatchEngine as StandardEngine } from "../services/MatchEngine.ts";
import { MatchEngine as ArcadeEngine } from "../services/ikincimotor.ts";
import { MatchEngine as ProEngine } from "../services/ucuncumotor.ts";
import {
  CoachArchetype,
  LineupStatus,
  Match,
  Player,
  Position,
  TacticType,
  Team,
  TeamTactic,
} from "../src/types.ts";

const baseTactic: TeamTactic = {
  formation: TacticType.T_433,
  style: "Possession",
  aggression: "Normal",
  tempo: "Fast",
  width: "Wide",
  defensiveLine: "High",
  passingStyle: "Mixed",
  marking: "Zonal",
  mentality: "Balanced",
  pressingIntensity: "Balanced",
  attackPlan: "WIDE_CROSS",
};

const buildPlayer = (
  id: string,
  teamId: string,
  position: Position,
  lineupIndex: number,
  firstName: string,
  lastName: string,
  speed: number,
  passing: number,
  vision: number,
  dribbling: number,
  finishing: number,
): Player => ({
  id,
  firstName,
  lastName,
  age: 25,
  nationality: "TR",
  position,
  attributes: {
    finishing,
    passing,
    tackling: position === Position.DEF ? 76 : 55,
    dribbling,
    goalkeeping: position === Position.GK ? 80 : 8,
    speed,
    stamina: 78,
    strength: position === Position.DEF || position === Position.GK ? 74 : 66,
    positioning: position === Position.DEF || position === Position.GK ? 78 : 68,
    aggression: 67,
    composure: 72,
    vision,
    leadership: position === Position.GK ? 74 : 58,
    decisions: 73,
  },
  hiddenAttributes: {
    consistency: 70,
    importantMatches: 68,
    injuryProneness: 18,
  },
  stats: {},
  overall: 73,
  potential: 76,
  value: 1000000,
  wage: 10000,
  salary: 10000,
  contractYears: 3,
  morale: 78,
  condition: 96,
  form: 7,
  teamId,
  isTransferListed: false,
  weeksInjured: 0,
  matchSuspension: 0,
  lineup: "STARTING" as LineupStatus,
  lineupIndex,
  playStyles:
    position === Position.FWD
      ? ["Keskin Pas"]
      : position === Position.MID
        ? ["Maestro"]
        : position === Position.GK
          ? ["Ortaya Çıkan"]
          : [],
});

const buildPlayers = (teamId: string, label: string): Player[] => [
  buildPlayer(`${teamId}-gk`, teamId, Position.GK, 0, label, "Keeper", 58, 62, 66, 25, 8),
  buildPlayer(`${teamId}-d1`, teamId, Position.DEF, 1, label, "Def1", 68, 63, 60, 52, 28),
  buildPlayer(`${teamId}-d2`, teamId, Position.DEF, 2, label, "Def2", 70, 65, 62, 50, 30),
  buildPlayer(`${teamId}-d3`, teamId, Position.DEF, 3, label, "Def3", 72, 64, 59, 51, 26),
  buildPlayer(`${teamId}-d4`, teamId, Position.DEF, 4, label, "Def4", 69, 66, 61, 53, 29),
  buildPlayer(`${teamId}-m1`, teamId, Position.MID, 5, label, "Mid1", 74, 76, 80, 74, 42),
  buildPlayer(`${teamId}-m2`, teamId, Position.MID, 6, label, "Mid2", 73, 75, 78, 72, 39),
  buildPlayer(`${teamId}-m3`, teamId, Position.MID, 7, label, "Mid3", 72, 74, 77, 70, 36),
  buildPlayer(`${teamId}-f1`, teamId, Position.FWD, 8, label, "Wing1", 82, 73, 72, 79, 74),
  buildPlayer(`${teamId}-f2`, teamId, Position.FWD, 9, label, "Striker", 80, 70, 70, 75, 80),
  buildPlayer(`${teamId}-f3`, teamId, Position.FWD, 10, label, "Wing2", 83, 72, 71, 80, 73),
];

const buildTeam = (id: string, name: string, tactic: TeamTactic): Team => ({
  id,
  name,
  city: name,
  primaryColor: "#112244",
  secondaryColor: "#ddeeff",
  reputation: 70,
  budget: 10000000,
  boardConfidence: 70,
  leagueId: "test",
  wages: 500000,
  facilities: {
    stadiumCapacity: 18000,
    stadiumLevel: 2,
    trainingLevel: 2,
    academyLevel: 2,
  },
  staff: {
    headCoachLevel: 3,
    scoutLevel: 2,
    physioLevel: 2,
  },
  objectives: [],
  tactic,
  coachArchetype: CoachArchetype.TACTICIAN,
  trainingFocus: "BALANCED",
  trainingIntensity: "NORMAL",
  youthCandidates: [],
  recentForm: [],
  stats: {},
});

const buildMatch = (): Match => ({
  id: `cmp-${Date.now()}`,
  week: 1,
  homeTeamId: "home",
  awayTeamId: "away",
  homeScore: 0,
  awayScore: 0,
  events: [],
  isPlayed: false,
  date: Date.now(),
  attendance: 12000,
  currentMinute: 0,
  weather: "Clear",
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
    homeSaves: 0,
    awaySaves: 0,
  },
});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const runEngine = (label: string, EngineClass: new (...args: any[]) => any) => {
  const match = buildMatch();
  const homeTeam = buildTeam("home", "Home FC", clone(baseTactic));
  const awayTeam = buildTeam("away", "Away FC", clone(baseTactic));
  const homePlayers = buildPlayers(homeTeam.id, "Home");
  const awayPlayers = buildPlayers(awayTeam.id, "Away");
  const engine = new EngineClass(match, homeTeam, awayTeam, homePlayers, awayPlayers);

  for (let i = 0; i < 900; i++) {
    engine.step();
  }

  return {
    label,
    minute: engine.internalMinute,
    score: `${engine.match.homeScore}-${engine.match.awayScore}`,
    possession: `${engine.match.stats.homePossession}-${engine.match.stats.awayPossession}`,
    shots: `${engine.match.stats.homeShots}-${engine.match.stats.awayShots}`,
    onTarget: `${engine.match.stats.homeOnTarget}-${engine.match.stats.awayOnTarget}`,
    xg: `${engine.match.stats.homeXG.toFixed(2)}-${engine.match.stats.awayXG.toFixed(2)}`,
    instructions: engine.homeTeam.tactic.instructions || [],
    passingStyle: engine.homeTeam.tactic.passingStyle,
    attackPlan: engine.homeTeam.tactic.attackPlan,
  };
};

const results = [
  runEngine("standard", StandardEngine),
  runEngine("arcade", ArcadeEngine),
  runEngine("pro", ProEngine),
];

console.table(results);