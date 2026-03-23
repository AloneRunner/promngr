import {
  Match,
  Team,
  Player,
  MatchEvent,
  MatchEventType,
  Position,
  SimulationState,
  TacticType,
  TeamTactic,
  TeamMentality,
  PlayerPersonality,
  LineupStatus,
} from "../types";
import { adaptTacticForEngine } from "./tacticAdapter";

// === MISSING INTERFACE DEFINITION ===
interface PlayerState {
  targetX: number;
  targetY: number;
  isPressing: boolean;
  actionLock: number;
  sprintDistance?: number;
  runDistance?: number;
  currentStamina: number;
  incomingSignal?: Signal | null;
  outgoingSignal?: Signal | null;
  matchRating?: number;
  stats?: any;
  hasBall?: boolean;
  shotType?: string; // 'NORMAL', 'VOLLEY', 'BICYCLE', 'HEADER', 'CHIP', etc.
  offBallRunTarget?: { x: number; y: number; expiresAt: number };
  isCollided?: boolean;
  momentum: number;
  decisionTimer: number;
  possessionCooldown: number;
  supportRunUntil?: number;
  tacticalDecision?: string;
  decisionExpiry?: number;
  lastAction?: "PASS" | "SHOOT" | "DRIBBLE" | "TACKLE" | "NONE";
  lastActionTick?: number;
}

// --- UTILS ---
const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
const distSq = (x1: number, y1: number, x2: number, y2: number) =>
  (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));
const lerp = (start: number, end: number, t: number) =>
  start * (1 - t) + end * t;

// === KAPSAMLİ YORGUNLUK ETKİSİ SİSTEMİ ===
// Her stat için ayrı ayrı yorgunluk etkisi hesaplar
// Kaleciler için daha hafif, saha oyuncuları için daha ağır cezalar

interface FatigueModifiers {
  // Fiziksel
  speed: number;
  strength: number;
  stamina: number;
  aggression: number;
  // Teknik
  finishing: number;
  passing: number;
  dribbling: number;
  tackling: number;
  goalkeeping: number;
  // Zihinsel
  positioning: number;
  composure: number;
  decisions: number;
  vision: number;
  leadership: number;
}

// Saha oyuncuları için yorgunluk modifikatörleri
const getFieldPlayerFatigueModifiers = (stamina: number): FatigueModifiers => {
  if (stamina >= 80) {
    // 80-100: Dinç - tam performans
    return {
      speed: 1.0,
      strength: 1.0,
      stamina: 1.0,
      aggression: 1.0,
      finishing: 1.0,
      passing: 1.0,
      dribbling: 1.0,
      tackling: 1.0,
      goalkeeping: 1.0,
      positioning: 1.0,
      composure: 1.0,
      decisions: 1.0,
      vision: 1.0,
      leadership: 1.0,
    };
  } else if (stamina >= 60) {
    // 60-80: Hafif yorgun
    return {
      speed: 0.95,
      strength: 0.98,
      stamina: 0.95,
      aggression: 0.97,
      finishing: 0.94,
      passing: 0.95,
      dribbling: 0.93,
      tackling: 0.94,
      goalkeeping: 0.97,
      positioning: 0.93,
      composure: 0.92,
      decisions: 0.9,
      vision: 0.93,
      leadership: 0.95,
    };
  } else if (stamina >= 40) {
    // 40-60: Orta yorgun - belirgin düşüş
    return {
      speed: 0.80,
      strength: 0.88,
      stamina: 0.82,
      aggression: 0.84,
      finishing: 0.75,
      passing: 0.78,
      dribbling: 0.72,
      tackling: 0.78,
      goalkeeping: 0.88,
      positioning: 0.74,
      composure: 0.68,
      decisions: 0.65,
      vision: 0.76,
      leadership: 0.82,
    };
  } else if (stamina >= 20) {
    // 20-40: Çok yorgun - ÇOK AĞIR CEZALAR
    return {
      speed: 0.42,
      strength: 0.60,
      stamina: 0.55,
      aggression: 0.55,
      finishing: 0.35,
      passing: 0.38,
      dribbling: 0.33,
      tackling: 0.42,
      goalkeeping: 0.72,
      positioning: 0.35,
      composure: 0.28,
      decisions: 0.28,
      vision: 0.40,
      leadership: 0.50,
    };
  } else {
    // 0-20: Bitik - sahada kalması güç! (Extreme Debuffs)
    return {
      speed: 0.22,
      strength: 0.38,
      stamina: 0.35,
      aggression: 0.30,
      finishing: 0.12,
      passing: 0.18,
      dribbling: 0.12,
      tackling: 0.22,
      goalkeeping: 0.55,
      positioning: 0.18,
      composure: 0.12,
      decisions: 0.12,
      vision: 0.20,
      leadership: 0.30,
    };
  }
};

// Kaleciler için özel yorgunluk modifikatörleri (daha hafif etkiler)
const getGoalkeeperFatigueModifiers = (stamina: number): FatigueModifiers => {
  if (stamina >= 70) {
    // 70-100: Dinç
    return {
      speed: 1.0,
      strength: 1.0,
      stamina: 1.0,
      aggression: 1.0,
      finishing: 1.0,
      passing: 1.0,
      dribbling: 1.0,
      tackling: 1.0,
      goalkeeping: 1.0,
      positioning: 1.0,
      composure: 1.0,
      decisions: 1.0,
      vision: 1.0,
      leadership: 1.0,
    };
  } else if (stamina >= 50) {
    // 50-70: Hafif yorgun
    return {
      speed: 0.95,
      strength: 0.98,
      stamina: 0.95,
      aggression: 0.98,
      finishing: 1.0,
      passing: 0.98,
      dribbling: 0.98,
      tackling: 0.98,
      goalkeeping: 0.97,
      positioning: 0.96,
      composure: 0.95,
      decisions: 0.95,
      vision: 0.97,
      leadership: 0.98,
    };
  } else if (stamina >= 30) {
    // 30-50: Orta yorgun
    return {
      speed: 0.9,
      strength: 0.95,
      stamina: 0.88,
      aggression: 0.92,
      finishing: 1.0,
      passing: 0.95,
      dribbling: 0.95,
      tackling: 0.92,
      goalkeeping: 0.93,
      positioning: 0.9,
      composure: 0.88,
      decisions: 0.88,
      vision: 0.92,
      leadership: 0.95,
    };
  } else if (stamina >= 10) {
    // 10-30: Çok yorgun
    return {
      speed: 0.85,
      strength: 0.9,
      stamina: 0.8,
      aggression: 0.85,
      finishing: 1.0,
      passing: 0.9,
      dribbling: 0.9,
      tackling: 0.85,
      goalkeeping: 0.85,
      positioning: 0.82,
      composure: 0.8,
      decisions: 0.8,
      vision: 0.85,
      leadership: 0.9,
    };
  } else {
    // 0-10: Bitik
    return {
      speed: 0.75,
      strength: 0.85,
      stamina: 0.7,
      aggression: 0.75,
      finishing: 1.0,
      passing: 0.85,
      dribbling: 0.85,
      tackling: 0.78,
      goalkeeping: 0.75,
      positioning: 0.7,
      composure: 0.65,
      decisions: 0.65,
      vision: 0.75,
      leadership: 0.85,
    };
  }
};

// Oyuncu için tüm yorgunluk modifikatörlerini al
const getAllFatigueModifiers = (
  stamina: number,
  isGoalkeeper: boolean,
): FatigueModifiers => {
  return isGoalkeeper
    ? getGoalkeeperFatigueModifiers(stamina)
    : getFieldPlayerFatigueModifiers(stamina);
};

// === BASİTLEŞTİRİLMİŞ YORGUNLUK FONKSİYONU (geriye uyumluluk için) ===
// type: 'physical' (hız, ivme), 'technical' (pas, şut, dribling), 'mental' (karar, pozisyon)
const getFatigueModifier = (
  stamina: number,
  type: "physical" | "technical" | "mental",
): number => {
  const mods = getFieldPlayerFatigueModifiers(stamina);
  if (type === "physical") return mods.speed;
  if (type === "technical") return mods.passing;
  return mods.decisions; // mental
};

// === YORGUNLUKLU STAT HESAPLAMA ===
// Bir oyuncunun yorgunluk dahil gerçek stat değerini hesaplar
const getEffectiveStat = (
  player: Player,
  statName: keyof FatigueModifiers,
  currentStamina: number,
): number => {
  const isGK = player.position === Position.GK;
  const mods = getAllFatigueModifiers(currentStamina, isGK);
  const baseStat = (player.attributes as any)[statName] || 50;
  return baseStat * mods[statName];
};

// === STAT FLOOR SCALING ===
// Zayıf statları yukarı çekerken güçlü statları aynen bırakır
// Örnek: 50 -> 65, 60 -> 70, 70 -> 77, 80 -> 85, 90 -> 92, 100 -> 100
// Bu sayede zayıf kaleci/defans daha az ezilir, güçlüler aynı kalır
const applyStatFloor = (stat: number, floor: number = 40): number => {
  // stat < floor ise floor'a çekilir
  // stat > floor ise kademeli olarak yukarı kaydırılır
  // stat = 100 ise aynen kalır
  if (stat >= 100) return 100;
  if (stat <= floor) return floor + 5; // Minimum taban

  // floor ile 100 arasını sıkıştır
  // Formül: stat + (100 - stat) * compressionFactor
  // compressionFactor = (stat düştükçe artar)
  const range = 100 - floor;
  const normalizedStat = (stat - floor) / range; // 0 to 1

  // Logaritmik sıkıştırma: düşük statlar daha fazla yükselir
  const compression = 0.25 * (1 - normalizedStat); // 0.25 at floor, 0 at 100
  const boost = (100 - stat) * compression;

  return Math.min(100, stat + boost);
};

// --- CONSTANTS ---
export const TICKS_PER_MINUTE = 60; // ~3 seconds per minute at 1x speed (50ms per tick)
const DEBUG_MATCH = true; // Enable match analysis logging

// === GERÇEK FUTBOL SAHASI BOYUTLARI (metre cinsinden) ===
const PITCH_LENGTH = 105; // X ekseni: 0-105 metre
const PITCH_WIDTH = 68; // Y ekseni: 0-68 metre
const PITCH_CENTER_X = 52.5; // Orta saha X
const PITCH_CENTER_Y = 34; // Orta saha Y

// Gerçek hızlar (metre/saniye, 1 tick = 1 saniye oyun süresi)
// Sprint hızı: ~30 km/h = 8.3 m/s, Top hızı: ~120 km/h = 33 m/s
// Ama oyunda 60 tick = 1 dakika, yani ölçeklendirme gerekli
// Eski 100 birim sisteminde 1.10 hız = 60 tick'te 66 birim = yaklaşık yarı saha
// Yeni sistemde aynı oranı koruyalım: 1.10 * (105/100) ≈ 1.15
const MAX_PLAYER_SPEED = 1.15; // metre/tick (ölçeklendirilmiş)
const MAX_BALL_SPEED = 4.4; // metre/tick (ölçeklendirilmiş)
const BALL_FRICTION = 0.96;
const BALL_AIR_DRAG = 0.98;
const GRAVITY = 0.2;
const BALL_BOUNCE = 0.55;
const PLAYER_ACCELERATION = 0.28; // 0.12 → 0.28: off-ball koşularda 2x daha hızlı ivmelenme
const PLAYER_TURN_SPEED = 0.25;

// AI Ranges (metre cinsinden - gerçek mesafeler)
const SHOOT_RANGE = 32; // 30 → 32m (ceza sahası dışından şut)
const PASS_RANGE_VISION = 52; // 50 → 52m
const TACKLE_RANGE_BASE = 2.8; // 4.2 → 3.5 → 2.8m (Daha az uzaktan tackle)
const PRESSING_RANGE = 18; // 20 → 18m (dengeli pressing)

// Kale Boyutları (gerçek: 7.32m genişlik, merkez Y=34)
// Kale: Y = 34 ± 3.66 = 30.34 - 37.66
const GOAL_Y_TOP = 30.34;
const GOAL_Y_BOTTOM = 37.66;
const GOAL_Y_CENTER = 34.0;

// Ceza sahası boyutları (gerçek)
const PENALTY_BOX_DEPTH = 16.5; // Kale çizgisinden 16.5m
const PENALTY_BOX_WIDTH = 40.32; // 40.32m genişlik (Y: 13.84 - 54.16)
const SIX_YARD_BOX_DEPTH = 5.5; // 6 yard box = 5.5m
const PENALTY_SPOT = 11; // Penaltı noktası = 11m

// --- FM-STYLE RATING CALCULATOR ---
// Uses ALL 14 attributes with position-specific weights (like Football Manager)
// No attribute is ignored - each contributes with appropriate weight for the position

// Helper: Get attribute values with defaults
const getAttrValues = (attr: any) => ({
  fin: attr.finishing || 50,
  pas: attr.passing || 50,
  dri: attr.dribbling || 50,
  tac: attr.tackling || 50,
  gk: attr.goalkeeping || 10,
  spd: attr.speed || 50,
  sta: attr.stamina || 50,
  str: attr.strength || 50,
  dec: attr.decisions || 50,
  pos: attr.positioning || 50,
  vis: attr.vision || 50,
  com: attr.composure || 50,
  lea: attr.leadership || 50,
  agg: attr.aggression || 50,
});

// Helper: Calculate position-weighted attribute score
const calcPositionScore = (
  a: ReturnType<typeof getAttrValues>,
  position: Position,
): number => {
  if (position === Position.GK) {
    return (
      a.gk * 0.4 +
      a.pos * 0.12 +
      a.com * 0.1 +
      a.dec * 0.08 +
      a.str * 0.06 +
      a.spd * 0.05 +
      a.lea * 0.04 +
      a.pas * 0.04 +
      a.vis * 0.03 +
      a.sta * 0.03 +
      a.agg * 0.02 +
      a.fin * 0.01 +
      a.dri * 0.01 +
      a.tac * 0.01
    );
  } else if (position === Position.DEF) {
    return (
      a.tac * 0.18 +
      a.pos * 0.14 +
      a.str * 0.12 +
      a.spd * 0.1 +
      a.com * 0.08 +
      a.dec * 0.08 +
      a.agg * 0.07 +
      a.sta * 0.06 +
      a.pas * 0.05 +
      a.lea * 0.04 +
      a.vis * 0.03 +
      a.dri * 0.02 +
      a.fin * 0.02 +
      a.gk * 0.01
    );
  } else if (position === Position.MID) {
    return (
      a.pas * 0.15 +
      a.vis * 0.13 +
      a.sta * 0.1 +
      a.dri * 0.1 +
      a.dec * 0.09 +
      a.com * 0.08 +
      a.spd * 0.07 +
      a.pos * 0.06 +
      a.tac * 0.06 +
      a.fin * 0.05 +
      a.str * 0.04 +
      a.lea * 0.03 +
      a.agg * 0.03 +
      a.gk * 0.01
    );
  } else {
    // FWD
    return (
      a.fin * 0.2 +
      a.spd * 0.14 +
      a.dri * 0.12 +
      a.pos * 0.1 +
      a.com * 0.1 +
      a.dec * 0.06 +
      a.str * 0.06 +
      a.vis * 0.05 +
      a.pas * 0.05 +
      a.sta * 0.04 +
      a.agg * 0.04 +
      a.tac * 0.02 +
      a.lea * 0.01 +
      a.gk * 0.01
    );
  }
};

// === BASE OVERALL CALCULATOR (for player creation) ===
// Pure attribute-based, no anchor. Used when creating players from data.
export const calculateBaseOverall = (
  player: Player,
  position: Position,
): number => {
  if (!player || !player.attributes) return 60;
  const a = getAttrValues(player.attributes);
  const score = calcPositionScore(a, position);
  return Math.max(1, Math.floor(score));
};

// === EFFECTIVE RATING CALCULATOR (for display/UI) ===
// Uses base overall as anchor + position fit bonus + condition/morale penalties
export const calculateEffectiveRating = (
  player: Player,
  assignedPosition: Position,
  currentCondition: number = 100,
): number => {
  if (!player || !player.attributes) return 60;
  const a = getAttrValues(player.attributes);
  const attrScore = calcPositionScore(a, assignedPosition);

  // If player has no overall yet (creation time), return pure attribute score
  if (!player.overall || player.overall === 0) {
    return Math.max(1, Math.floor(attrScore));
  }

  // === ANCHOR TO BASE OVERALL ===
  const baseOvr = player.overall;
  const simpleAvg =
    (a.fin +
      a.pas +
      a.dri +
      a.tac +
      a.spd +
      a.sta +
      a.str +
      a.dec +
      a.pos +
      a.vis +
      a.com +
      a.lea +
      a.agg) /
    13;
  const positionFit = attrScore - simpleAvg;
  const fitBonus = Math.max(-8, Math.min(8, positionFit));
  let score = baseOvr + fitBonus;

  // POSITION PENALTY (only when playing out of position)
  if (player.position !== assignedPosition) {
    if (player.position === Position.GK || assignedPosition === Position.GK)
      score *= 0.3;
    else if (
      (player.position === Position.DEF && assignedPosition === Position.FWD) ||
      (player.position === Position.FWD && assignedPosition === Position.DEF)
    )
      score *= 0.7;
    else score *= 0.9;
  }

  // MORALE IMPACT (subtle: only negative below 40)
  if (player.morale < 40) {
    score -= Math.floor((40 - player.morale) / 10);
  }

  // CONDITION/FATIGUE IMPACT
  if (currentCondition < 30) {
    score -= Math.floor((30 - currentCondition) / 5);
  } else if (currentCondition < 60) {
    score -= Math.floor((60 - currentCondition) / 15);
  }

  return Math.max(1, Math.floor(score));
};

export interface RatingImpact {
  reason: "POSITION" | "MORALE" | "CONDITION" | "FIT";
  value: number;
}

export const getRatingImpacts = (
  player: Player,
  assignedPosition: Position,
  currentCondition: number = 100,
): RatingImpact[] => {
  if (!player || !player.attributes || !player.overall) return [];

  const impacts: RatingImpact[] = [];
  const a = getAttrValues(player.attributes);
  const attrScore = calcPositionScore(a, assignedPosition);

  // Fit Impact
  const simpleAvg =
    (a.fin +
      a.pas +
      a.dri +
      a.tac +
      a.spd +
      a.sta +
      a.str +
      a.dec +
      a.pos +
      a.vis +
      a.com +
      a.lea +
      a.agg) /
    13;
  const positionFit = attrScore - simpleAvg;
  const fitBonus = Math.max(-8, Math.min(8, positionFit));
  if (Math.abs(fitBonus) >= 1) {
    impacts.push({ reason: "FIT", value: Math.floor(fitBonus) });
  }

  // Position Penalty
  let scoreAfterFit = player.overall + fitBonus;
  let scoreAfterPosition = scoreAfterFit;
  if (player.position !== assignedPosition) {
    if (player.position === Position.GK || assignedPosition === Position.GK)
      scoreAfterPosition *= 0.3;
    else if (
      (player.position === Position.DEF && assignedPosition === Position.FWD) ||
      (player.position === Position.FWD && assignedPosition === Position.DEF)
    )
      scoreAfterPosition *= 0.7;
    else scoreAfterPosition *= 0.9;

    const penalty = Math.floor(scoreAfterPosition - scoreAfterFit);
    if (penalty !== 0) {
      impacts.push({ reason: "POSITION", value: penalty });
    }
  }

  // Morale Impact
  if (player.morale < 40) {
    const moralePenalty = -Math.floor((40 - player.morale) / 10);
    if (moralePenalty !== 0) impacts.push({ reason: "MORALE", value: moralePenalty });
  }

  // Condition Impact
  if (currentCondition < 30) {
    const condPenalty = -Math.floor((30 - currentCondition) / 5);
    if (condPenalty !== 0) impacts.push({ reason: "CONDITION", value: condPenalty });
  } else if (currentCondition < 60) {
    const condPenalty = -Math.floor((60 - currentCondition) / 15);
    if (condPenalty !== 0) impacts.push({ reason: "CONDITION", value: condPenalty });
  }

  return impacts;
};

export const getRoleFromX = (x: number): Position => {
  if (x < 12) return Position.GK;
  if (x < 38) return Position.DEF;
  if (x < 72) return Position.MID;
  return Position.FWD;
};

export const getFormationStructure = (formation: TacticType) => {
  switch (formation) {
    case TacticType.T_442:
      return { DEF: 4, MID: 4, FWD: 2 };
    case TacticType.T_433:
      return { DEF: 4, MID: 3, FWD: 3 };
    case TacticType.T_352:
      return { DEF: 3, MID: 5, FWD: 2 };
    case TacticType.T_541:
      return { DEF: 5, MID: 4, FWD: 1 };
    case TacticType.T_451:
      return { DEF: 4, MID: 5, FWD: 1 };
    case TacticType.T_4231:
      return { DEF: 4, MID: 5, FWD: 1 };
    case TacticType.T_343:
      return { DEF: 3, MID: 4, FWD: 3 };
    case TacticType.T_4141:
      return { DEF: 4, MID: 5, FWD: 1 };
    case TacticType.T_532:
      return { DEF: 5, MID: 3, FWD: 2 };
    case TacticType.T_41212:
      return { DEF: 4, MID: 4, FWD: 2 };
    case TacticType.T_4321:
      return { DEF: 4, MID: 5, FWD: 1 };
    default:
      return { DEF: 4, MID: 4, FWD: 2 };
  }
};

const normalizePos = (p: Player): Position => {
  if (!p) return Position.MID;
  const raw = p.position as string;
  if (raw === "KL" || raw === "GK") return Position.GK;
  if (["STP", "SĞB", "SLB", "DEF", "CB", "LB", "RB", "SW"].includes(raw))
    return Position.DEF;
  if (["MDO", "MO", "MOO", "MID", "CDM", "CM", "CAM", "LM", "RM"].includes(raw))
    return Position.MID;
  return Position.FWD;
};

// === FORMASYON POZISYONLARI (105x68 motor koordinatları) ===
// Motor koordinatları: X=0-105 (sol-sağ), Y=0-68 (üst-alt)
// Ev sahibi sol kaleye yakın başlar, deplasman sağ kaleye
export const getBaseFormationOffset = (
  formation: TacticType,
  role: Position,
  index: number,
  totalInRole: number,
): { x: number; y: number } => {
  // Y ekseninde oyuncuları yay (0-68 arası, merkez 34)
  const spreadY = (idx: number, tot: number, spanPercent: number) => {
    if (tot <= 1) return PITCH_WIDTH / 2; // 34
    const span = (spanPercent / 100) * PITCH_WIDTH;
    return PITCH_WIDTH / 2 - span / 2 + (span / (tot - 1)) * idx;
  };

  // X pozisyonunu 0-100'den 0-105'e çevir
  const xPos = (pct: number) => (pct / 100) * PITCH_LENGTH;

  // Kaleci: Kale çizgisine yakın, ortada
  if (role === Position.GK) return { x: xPos(5), y: PITCH_WIDTH / 2 };

  if (role === Position.DEF) {
    // 3'lü defans: kompakt merkez savunma
    if (formation.startsWith("3"))
      return { x: xPos(22), y: spreadY(index, totalInRole, 48) };
    // 5'li defans: daha kompakt
    if (formation.startsWith("5"))
      return { x: xPos(18), y: spreadY(index, totalInRole, 64) };
    // Standart 4'lü defans
    if (index === 0) return { x: xPos(22), y: spreadY(0, 4, 70) }; // LB
    if (index === 1) return { x: xPos(22), y: spreadY(1, 4, 70) }; // CB
    if (index === 2) return { x: xPos(22), y: spreadY(2, 4, 70) }; // CB
    if (index === 3) return { x: xPos(22), y: spreadY(3, 4, 70) }; // RB
    return { x: xPos(22), y: spreadY(index, totalInRole, 70) };
  }

  if (role === Position.MID) {
    if (formation === TacticType.T_433 || formation === TacticType.T_532) {
      return { x: xPos(50), y: spreadY(index, totalInRole, 70) };
    }
    if (formation === TacticType.T_442) {
      return { x: xPos(50), y: spreadY(index, totalInRole, 82) };
    }
    if (formation === TacticType.T_4231) {
      if (index < 2)
        return {
          x: xPos(42),
          y: index === 0 ? spreadY(0, 2, 44) : spreadY(1, 2, 44),
        }; // CDM'ler
      if (index === 2) return { x: xPos(65), y: spreadY(0, 3, 70) }; // LAM
      if (index === 3) return { x: xPos(65), y: PITCH_WIDTH / 2 }; // CAM (merkez)
      if (index === 4) return { x: xPos(65), y: spreadY(2, 3, 70) }; // RAM
    }
    if (formation === TacticType.T_4141) {
      if (index === 0) return { x: xPos(40), y: PITCH_WIDTH / 2 }; // CDM (merkez)
      return { x: xPos(62), y: spreadY(index - 1, 4, 82) }; // 4 orta saha
    }
    if (formation === TacticType.T_41212) {
      if (index === 0) return { x: xPos(40), y: PITCH_WIDTH / 2 }; // CDM
      if (index === 1) return { x: xPos(55), y: spreadY(0, 2, 60) }; // LM
      if (index === 2) return { x: xPos(55), y: spreadY(1, 2, 60) }; // RM
      if (index === 3) return { x: xPos(70), y: PITCH_WIDTH / 2 }; // CAM
    }
    if (formation === TacticType.T_352) {
      if (index < 2) return { x: xPos(45), y: spreadY(index, 2, 50) }; // 2 DM
      return { x: xPos(60), y: spreadY(index - 2, 3, 82) }; // 3 AM
    }
    if (formation === TacticType.T_4321) {
      if (index < 3) return { x: xPos(48), y: spreadY(index, 3, 70) }; // 3 CM
      return {
        x: xPos(68),
        y: index === 3 ? spreadY(0, 2, 44) : spreadY(1, 2, 44),
      }; // 2 AM
    }
    return { x: xPos(55), y: spreadY(index, totalInRole, 80) };
  }

  if (role === Position.FWD) {
    // === FIX: FORVETLERİ GERİ ÇEK (Daha Derin Başlangıç) ===
    // 88/86 -> 80/78 (Böylece koşu mesafesi artar, ofsayta düşmezler)
    if (formation === TacticType.T_433 || formation === TacticType.T_343) {
      if (index === 1) return { x: xPos(80), y: PITCH_WIDTH / 2 }; // ST (merkez) - 88->80
      return {
        x: xPos(78),
        y: index === 0 ? spreadY(0, 2, 80) : spreadY(1, 2, 80),
      }; // Kanatlar - 82->78
    }
    if (totalInRole === 1) return { x: xPos(80), y: PITCH_WIDTH / 2 }; // Tek forvet - 88->80
    if (totalInRole === 2)
      return {
        x: xPos(78),
        y: index === 0 ? spreadY(0, 2, 44) : spreadY(1, 2, 44),
      }; // 2 forvet - 86->78
    return { x: xPos(78), y: spreadY(index, totalInRole, 60) };
  }

  return { x: PITCH_CENTER_X, y: PITCH_CENTER_Y }; // Varsayılan: orta saha merkezi
};

// UI koordinatlarını (0-100) motor koordinatlarına (0-105, 0-68) çevir
// NOT: Artık getBaseFormationOffset direkt motor koordinatları döndürüyor
// Bu fonksiyon sadece dışarıdan gelen UI koordinatları için kullanılır
const scaleToMotor = (x: number, y: number): { x: number; y: number } => {
  return {
    x: (x / 100) * PITCH_LENGTH,
    y: (y / 100) * PITCH_WIDTH,
  };
};

type SetPieceMode =
  | "KICKOFF"
  | "GOAL_KICK_HOME"
  | "GOAL_KICK_AWAY"
  | "CORNER_HOME_TOP"
  | "CORNER_HOME_BOTTOM"
  | "CORNER_AWAY_TOP"
  | "CORNER_AWAY_BOTTOM"
  | "FREE_KICK_HOME"
  | "FREE_KICK_AWAY"
  | "PENALTY_HOME"
  | "PENALTY_AWAY"
  | "THROW_IN_HOME"
  | "THROW_IN_AWAY";

interface Signal {
  type: "CALL" | "POINT" | "HOLD" | "INCOMING_PASS";
  targetId?: string;
  expiryTick: number;
}

export class MatchEngine {
  public match: Match;
  public homeTeam: Team;
  public awayTeam: Team;
  public homePlayers: Player[];
  public awayPlayers: Player[];
  private allPlayers: Player[] = [];

  private sim: SimulationState;
  private traceLog: string[] = [];
  private playerRoles: Record<string, Position> = {};
  private baseOffsets: Record<string, { x: number; y: number }> = {};

  // Helper for cover shadow calculation
  private distToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const l2 = distSq(x1, y1, x2, y2);
    if (l2 === 0) return dist(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }

  private homeMentality: TeamMentality = TeamMentality.BALANCED;
  private awayMentality: TeamMentality = TeamMentality.BALANCED;

  private possessionTicks = { home: 0, away: 0 };

  private playerStates: Record<string, PlayerState> = {};

  // === DEBUG MODE ===
  private DEBUG_MODE: boolean = true; // SET TO FALSE TO DISABLE LOGGING
  private DEBUG_INTERVAL: number = 60; // Her 60 tick'te bir log (1 saniye) - detaylı analiz için
  private debugTickCounter: number = 0; // Global tick sayacı - sıfırlanmaz

  private tickCount: number = 0;
  private internalMinute: number = 0;
  private currentLooseBallChaserId: string | null = null;
  private lastTouchTeamId: string | null = null;
  private lastShooterId: string | null = null;
  private lastPossessingTeamId: string | null = null;

  // Substitution tracking
  private homeSubsMade: number = 0;
  private awaySubsMade: number = 0;
  private readonly MAX_SUBS: number = 5; // Modern rules allow 5 subs
  private lastAISubCheck: number = 0;
  private userTeamId: string | null = null; // User's team won't get AI subs

  // IMPORTANT: Once a player is substituted OUT, they CANNOT return (Football Rule!)
  private substitutedOutPlayerIds: Set<string> = new Set();

  // === GLOBAL PRESSING CONTROLLER ===
  // Her tick başında merkezi olarak kimlerin pres yapacağını belirle
  // Bu Set'ler sadece "yetkili" oyuncuları tutar - sürü zihniyetini engeller
  private homePresserIds: Set<string> = new Set();
  private awayPresserIds: Set<string> = new Set();

  // Pending events to be returned in step()
  private pendingEvents: MatchEvent[] = [];

  // Set piece positions - stored when foul/throw-in occurs
  private foulPosition: { x: number; y: number } | null = null;
  private throwInPosition: { x: number; y: number } | null = null;

  // Ball stuck detection - if ball speed < 0.1 for 180 ticks (~3 seconds), trigger out-of-play
  private ballStuckTicks: number = 0;
  private lastBallX: number = PITCH_CENTER_X; // 52.5
  private lastBallY: number = PITCH_CENTER_Y; // 34

  // === PERFORMANCE: Cached player lists to avoid repeated .filter() calls ===
  // These are invalidated on substitutions and refreshed at tick start
  private _cachedStarters: Player[] = [];
  private _cachedHomeStarters: Player[] = [];
  private _cachedAwayStarters: Player[] = [];
  private _starterCacheValid: boolean = false;
  private _statsLogged: boolean = false;
  // === OFSAYT: Defans hatları (her tick güncellenir, actionPass'ta kullanılır) ===
  private _homeDefLine: number = 50;
  private _awayDefLine: number = 55;

  // === ENGINE IDENTIFIER ===
  public engineVersion: string = "Ana Motor";

  // === PLAYER INSTRUCTION HELPER ===
  // Returns the individual instruction for a player based on their lineup slot
  private getPlayerInstruction(p: Player): string {
    const isHome = this.homePlayers.includes(p);
    const team = isHome ? this.homeTeam : this.awayTeam;
    if (!team.tactic.slotInstructions) return 'Default';
    return team.tactic.slotInstructions[p.lineupIndex ?? 0] ?? 'Default';
  }

  constructor(
    match: Match,
    homeTeam: Team,
    awayTeam: Team,
    homePlayers: Player[],
    awayPlayers: Player[],
    userTeamId?: string,
  ) {
    this.match = match;
    // Ensure stats object exists
    if (!this.match.stats) {
      this.match.stats = {
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
      };
    }
    // === AGRESİFLİK ÇARPANI (RESTORED to Original) ===
    const aggressionMultipliers = {
      Safe: 0.85,
      Normal: 1.0,
      Aggressive: 1.25,
      Reckless: 1.45,
    };
    this.homeTeam = {
      ...homeTeam,
      tactic: adaptTacticForEngine(homeTeam.tactic, "standard"),
    };
    this.awayTeam = {
      ...awayTeam,
      tactic: adaptTacticForEngine(awayTeam.tactic, "standard"),
    };
    // Keep all players (STARTING + BENCH) so substitutions can work
    this.homePlayers = homePlayers.filter(
      (p) => p.lineup === "STARTING" || p.lineup === "BENCH",
    );
    this.awayPlayers = awayPlayers.filter(
      (p) => p.lineup === "STARTING" || p.lineup === "BENCH",
    );
    this.allPlayers = [...this.homePlayers, ...this.awayPlayers];
    this.userTeamId = userTeamId || null;

    this.internalMinute = match.currentMinute;

    // === 11-PLAYER LIMIT SAFEGUARD ===
    // Ensure strictly max 11 starters per team to prevent '12 players' bug
    const filterRestToBench = (players: Player[]) => {
      let startersCount = 0;
      return players.map((p) => {
        if (p.lineup === "STARTING") {
          startersCount++;
          if (startersCount > 11) {
            console.warn(
              `⚠️ SAFEGUARD: Player ${p.lastName} forced to BENCH (Max 11 starters exceeded)`,
            );
            return { ...p, lineup: "BENCH" as LineupStatus, lineupIndex: 99 };
          }
        }
        return p;
      });
    };

    this.homePlayers = filterRestToBench(this.homePlayers);
    this.awayPlayers = filterRestToBench(this.awayPlayers);
    // Update allPlayers reference with sanitized lists
    this.allPlayers = [...this.homePlayers, ...this.awayPlayers];

    // Only initialize STARTING players on the pitch
    this.initializeTactics(
      this.homePlayers.filter((p) => p.lineup === "STARTING"),
      this.homeTeam.tactic,
    );
    this.initializeTactics(
      this.awayPlayers.filter((p) => p.lineup === "STARTING"),
      this.awayTeam.tactic,
    );

    [...this.homePlayers, ...this.awayPlayers].forEach((p) => {
      if (!p.personality) {
        p.personality = {
          riskTaking:
            (p.attributes.aggression / 100) * 0.6 + Math.random() * 0.4,
          discipline: p.attributes.decisions / 100,
          pressureHandling: p.attributes.composure / 100,
        };
      }

      if (!this.playerStates[p.id]) {
        // Initialize stamina from player condition
        this.playerStates[p.id] = {
          currentStamina: p.condition !== undefined ? p.condition : 100,
          decisionTimer: Math.random() * 5,
          possessionCooldown: 0,
          actionLock: 0,
          targetX: 50,
          targetY: 50,
          momentum: 0,
          isPressing: false,
          // === MESAFE BAZLI YORGUNLUK TAKİBİ ===
          sprintDistance: 0, // Toplam sprint mesafesi (birim)
          runDistance: 0, // Toplam koşu mesafesi (birim)
        };
      }
    });

    if (
      match.liveData?.simulation &&
      Object.keys(match.liveData.simulation.players).length > 0
    ) {
      this.sim = JSON.parse(JSON.stringify(match.liveData.simulation));
      if (this.sim.ball.z === undefined) {
        this.sim.ball.z = 0;
        this.sim.ball.vz = 0;
      }
    } else {
      this.sim = {
        ball: {
          x: 50,
          y: 50,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          curve: 0,
          ownerId: null,
          targetId: null,
        },
        players: {},
        homeMentality: TeamMentality.BALANCED,
        awayMentality: TeamMentality.BALANCED,
      };
      this.resetPositions("KICKOFF");
    }

    // Only add STARTING players to the pitch simulation
    [...this.homePlayers, ...this.awayPlayers]
      .filter((p) => p.lineup === "STARTING")
      .forEach((p) => {
        if (!this.sim.players[p.id]) {
          const base = this.baseOffsets[p.id] || { x: 50, y: 50 };
          this.sim.players[p.id] = {
            x: base.x,
            y: base.y,
            facing: 0,
            vx: 0,
            vy: 0,
            state: "IDLE",
          };
        }
      });

    // === MAÇ BAŞLANGIÇ DEBUG LOGU ===
    if (DEBUG_MATCH) {
      const homeStarters = this.homePlayers.filter(
        (p) => p.lineup === "STARTING",
      );
      const awayStarters = this.awayPlayers.filter(
        (p) => p.lineup === "STARTING",
      );
      const homeAvg = Math.round(
        homeStarters.reduce((sum, p) => sum + p.overall, 0) /
        homeStarters.length,
      );
      const awayAvg = Math.round(
        awayStarters.reduce((sum, p) => sum + p.overall, 0) /
        awayStarters.length,
      );

      // Pozisyonlara göre ortalama güç hesapla
      const calcPositionAvg = (players: Player[], pos: Position) => {
        const posList = players.filter((p) => this.playerRoles[p.id] === pos);
        return posList.length > 0
          ? Math.round(
            posList.reduce((sum, p) => sum + p.overall, 0) / posList.length,
          )
          : 0;
      };

      const homeGK = calcPositionAvg(homeStarters, Position.GK);
      const homeDEF = calcPositionAvg(homeStarters, Position.DEF);
      const homeMID = calcPositionAvg(homeStarters, Position.MID);
      const homeFWD = calcPositionAvg(homeStarters, Position.FWD);

      const awayGK = calcPositionAvg(awayStarters, Position.GK);
      const awayDEF = calcPositionAvg(awayStarters, Position.DEF);
      const awayMID = calcPositionAvg(awayStarters, Position.MID);
      const awayFWD = calcPositionAvg(awayStarters, Position.FWD);

      console.log(`\n${"═".repeat(80)}`);
      console.log(
        `🏟️  MAÇ BAŞLIYOR: ${homeTeam.name} (${homeAvg}) vs ${awayTeam.name} (${awayAvg})`,
      );
      console.log(`${"═".repeat(80)}\n`);

      const logTeamTactic = (
        team: Team,
        avg: number,
        side: "HOME" | "AWAY",
        gk: number,
        def: number,
        mid: number,
        fwd: number,
      ) => {
        console.log(`📋 ${side}: ${team.name}`);
        console.log(
          `   Genel Güç: ${avg} | Kadro Detay: KP ${gk}, DF ${def}, OC ${mid}, FW ${fwd}`,
        );
        console.log(
          `   Formasyon: ${team.tactic.formation} | Stil: ${team.tactic.style}`,
        );
        console.log(`   Mentalite: ${team.tactic.mentality || "BALANCED"}`);
        console.log(
          `   Detaylar: Saldırganlık=${team.tactic.aggression}, Tempo=${team.tactic.tempo}, Genişlik=${team.tactic.width}`,
        );
        console.log(
          `   Savunma: Hat=${team.tactic.defensiveLine}, Markaj=${team.tactic.marking}`,
        );
        console.log(`   Paslaşma: ${team.tactic.passingStyle}`);
        console.log();
      };

      logTeamTactic(
        homeTeam,
        homeAvg,
        "HOME",
        homeGK,
        homeDEF,
        homeMID,
        homeFWD,
      );
      logTeamTactic(
        awayTeam,
        awayAvg,
        "AWAY",
        awayGK,
        awayDEF,
        awayMID,
        awayFWD,
      );
      console.log(`${"═".repeat(80)}\n`);
    }
  }

  public logCurrentTactics() {
    if (!this.homeTeam || !this.awayTeam) return;
    if (!DEBUG_MATCH) return;

    console.log(`\n📋 CURRENT TACTICAL STATE (Minute ${this.internalMinute})`);

    const log = (team: Team, side: "HOME" | "AWAY") => {
      console.log(`\n== ${side}: ${team.name} ==`);
      console.log(
        `Style: ${team.tactic.style} | Mentality: ${team.tactic.mentality || "BALANCED"}`,
      );
      console.log(`Formation: ${team.tactic.formation}`);
      console.log(
        `Pass: ${team.tactic.passingStyle} | Tempo: ${team.tactic.tempo} | Width: ${team.tactic.width}`,
      );
      console.log(
        `Def: ${team.tactic.defensiveLine} | Mark: ${team.tactic.marking} | Press: ${team.tactic.aggression}`,
      );
    };

    log(this.homeTeam, "HOME");
    log(this.awayTeam, "AWAY");
    console.log("----------------------------------------\n");
  }

  public logMatchAnalysis() {
    console.log(`\n📊 FULL MATCH ANALYSIS REPORT (90')`);
    console.log(`----------------------------------------`);
    console.log(
      `${this.homeTeam.name} ${this.match.homeScore} - ${this.match.awayScore} ${this.awayTeam.name}`,
    );

    // Possession
    const totalTicks = this.possessionTicks.home + this.possessionTicks.away;
    const homePoss =
      totalTicks > 0
        ? Math.round((this.possessionTicks.home / totalTicks) * 100)
        : 50;
    const awayPoss = 100 - homePoss;
    console.log(`Possession: ${homePoss}% - ${awayPoss}%`);

    // Shots & xG
    console.log(
      `Shots: ${this.match.stats.homeShots} (${this.match.stats.homeOnTarget}) - ${this.match.stats.awayShots} (${this.match.stats.awayOnTarget})`,
    );
    console.log(
      `xG: ${this.match.stats.homeXG.toFixed(2)} - ${this.match.stats.awayXG.toFixed(2)}`,
    );

    // Tactical Summary
    console.log(`\n== TACTICAL MATCHUP ==`);
    console.log(
      `HOME (${this.homeTeam.tactic.style}): Formation ${this.homeTeam.tactic.formation}, Mentality ${this.homeTeam.tactic.mentality || "N/A"}`,
    );
    console.log(
      `AWAY (${this.awayTeam.tactic.style}): Formation ${this.awayTeam.tactic.formation}, Mentality ${this.awayTeam.tactic.mentality || "N/A"}`,
    );

    // Analysis
    console.log(`\n== AI INSIGHTS ==`);
    if (Math.abs(homePoss - 50) > 10) {
      const dominant = homePoss > 50 ? "HOME" : "AWAY";
      console.log(
        `- ${dominant} team dominated possession. Check if opponent is 'ParkTheBus' or pressing ineffective.`,
      );
    }
    if (this.match.stats.homeShots > 15 || this.match.stats.awayShots > 15) {
      console.log(
        `- High shot count detected. Check 'Shot Spam' tuning if conversion rate is low.`,
      );
    }

    console.log(`----------------------------------------\n`);
  }

  private initializeTactics(players: Player[], tactic: TeamTactic) {
    const adaptedTactic = adaptTacticForEngine(tactic, "standard");
    const formationStruct = getFormationStructure(adaptedTactic.formation);
    const getRoleFromLineupIndex = (
      lineupIndex: number | undefined,
      fallback: Position,
    ): Position => {
      if (lineupIndex === undefined || lineupIndex === null) return fallback;
      if (lineupIndex >= 99 || lineupIndex < 0) return fallback;

      if (lineupIndex === 0) return Position.GK;
      const defStart = 1;
      const defEnd = defStart + formationStruct.DEF - 1;
      const midEnd = defEnd + formationStruct.MID;
      const fwdEnd = midEnd + formationStruct.FWD;

      if (lineupIndex >= defStart && lineupIndex <= defEnd) return Position.DEF;
      if (lineupIndex > defEnd && lineupIndex <= midEnd) return Position.MID;
      if (lineupIndex > midEnd && lineupIndex <= fwdEnd) return Position.FWD;
      return fallback;
    };
    const grouped: Record<string, Player[]> = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
    };
    players.forEach((p) => {
      let role = normalizePos(p);
      if (adaptedTactic.customPositions && adaptedTactic.customPositions[p.id]) {
        // customPositions UI koordinatlarında (0-100), role hesaplaması için kullan
        role = getRoleFromX(adaptedTactic.customPositions[p.id].x);
      } else {
        role = getRoleFromLineupIndex(p.lineupIndex, role);
      }
      this.playerRoles[p.id] = role;
      grouped[role].push(p);
    });

    Object.entries(grouped).forEach(([role, plList]) => {
      // AI FIX: Sort players to ensure positional correctness (Left -> Right)
      // This ensures Index 0 is Left, Index 1 Center, Index 2 Right for 3-man lines
      if (
        role === Position.FWD ||
        role === Position.MID ||
        role === Position.DEF
      ) {
        plList.sort((a, b) => {
          const aIdx = a.lineupIndex ?? 999;
          const bIdx = b.lineupIndex ?? 999;
          if (aIdx !== bIdx) return aIdx - bIdx;

          const scorePos = (p: string) => {
            const pos = p.toUpperCase();
            if (["SLB", "LB", "SLO", "LM", "LW", "LF"].includes(pos)) return 1;
            if (
              [
                "STP",
                "CB",
                "MDO",
                "CDM",
                "MO",
                "CM",
                "CAM",
                "SNT",
                "ST",
                "CF",
              ].includes(pos)
            )
              return 2;
            if (["SĞB", "RB", "SĞO", "RM", "RW", "RF"].includes(pos)) return 3;
            return 2;
          };
          return scorePos(a.position) - scorePos(b.position);
        });
      }

      plList.forEach((p, idx) => {
        if (adaptedTactic.customPositions && adaptedTactic.customPositions[p.id]) {
          // customPositions UI koordinatlarında (0-100) kaydediliyor
          // Motor koordinatlarına (105x68) çevir
          const customUI = adaptedTactic.customPositions[p.id];
          this.baseOffsets[p.id] = {
            x: (customUI.x / 100) * PITCH_LENGTH,
            y: (customUI.y / 100) * PITCH_WIDTH,
          };
        } else {
          // getBaseFormationOffset zaten motor koordinatları (105x68) döndürüyor
          this.baseOffsets[p.id] = getBaseFormationOffset(
            adaptedTactic.formation,
            role as Position,
            idx,
            plList.length,
          );
        }
      });
    });
  }

  private getPlayer(id: string) {
    return [...this.homePlayers, ...this.awayPlayers].find((p) => p.id === id);
  }

  public getPlayerStamina(id: string): number | undefined {
    return this.playerStates[id]?.currentStamina;
  }

  // --- COMMUNICATION SYSTEM ---
  private emitTeamSignal(
    from: Player,
    type: "CALL" | "POINT" | "HOLD" | "INCOMING_PASS",
    targetId?: string,
    radius: number = 45,
    durationTicks: number = 6,
  ) {
    try {
      const role = this.playerRoles[from.id] || normalizePos(from);
      // Defenders/GKs shouldn't spam CALL/POINT signals
      if ((role === Position.DEF || role === Position.GK) && type !== "HOLD")
        return;

      const teammates =
        from.teamId === this.homeTeam.id ? this.homePlayers : this.awayPlayers;
      const expiry = this.tickCount + durationTicks;
      const simFrom = this.sim.players[from.id];
      if (!simFrom) return;

      if (this.playerStates[from.id]) {
        this.playerStates[from.id].outgoingSignal = {
          type,
          targetId,
          expiryTick: expiry,
        };
      }

      teammates.forEach((tm) => {
        if (tm.id === from.id) return;
        if (!this.sim.players[tm.id]) return;
        if (
          dist(
            simFrom.x,
            simFrom.y,
            this.sim.players[tm.id].x,
            this.sim.players[tm.id].y,
          ) > radius
        )
          return;

        if (this.playerStates[tm.id]) {
          this.playerStates[tm.id].incomingSignal = {
            type,
            targetId: from.id,
            expiryTick: expiry,
          };
        }
      });
    } catch (e) { }
  }

  private clearExpiredSignals() {
    Object.keys(this.playerStates).forEach((id) => {
      const state = this.playerStates[id];
      if (
        state.incomingSignal &&
        state.incomingSignal.expiryTick <= this.tickCount
      )
        state.incomingSignal = null;
      if (
        state.outgoingSignal &&
        state.outgoingSignal.expiryTick <= this.tickCount
      )
        state.outgoingSignal = null;
    });
  }

  // Oyuncuların otomatik konuşması
  // 3. Oyuncuların otomatik konuşmasını sağlayan yapay zeka (Her tick çalışmalı)
  private updatePlayerSignals() {
    // Herkes her an konuşmaz, biraz rastgelelik lazım
    this.allPlayers.forEach((p) => {
      const state = this.playerStates[p.id];
      if (!state) return;

      // Eğer top bendeyse konuşmam (genelde), top bende değilse konuşurum
      if (p.id !== this.sim.ball.ownerId && this.sim.players[p.id]) {
        const simP = this.sim.players[p.id];

        // Eğer depar atıyorsam ve önüm boşsa: "Önüme At!" (POINT)
        if (simP.state === "SPRINT" && Math.random() < 0.05) {
          this.emitTeamSignal(p, "POINT");
        }
        // Eğer duruyorsam/yürüyorsam ve boştaysam: "Ayağıma At!" (CALL)
        else if (simP.state !== "SPRINT" && Math.random() < 0.02) {
          this.emitTeamSignal(p, "CALL");
        }
      }
    });
  }

  private clearSignalsForTeam(teamId: string | null) {
    if (!teamId) return;
    [...this.homePlayers, ...this.awayPlayers].forEach((p) => {
      if (p.teamId !== teamId) return;
      const state = this.playerStates[p.id];
      if (!state) return;
      state.incomingSignal = null;
      state.outgoingSignal = null;
    });
  }

  public updateTactic(teamId: string, newTactic: TeamTactic) {
    const isHome = this.homeTeam.id === teamId;
    const list = isHome ? this.homePlayers : this.awayPlayers;
    const team = isHome ? this.homeTeam : this.awayTeam;
    const adaptedTactic = adaptTacticForEngine(newTactic, "standard");

    if (isHome) this.homeTeam.tactic = adaptedTactic;
    else this.awayTeam.tactic = adaptedTactic;
    this.initializeTactics(
      list.filter((p) => p.lineup === "STARTING"),
      adaptedTactic,
    );

    // === PERFORMANCE: Invalidate starter cache after tactic change ===
    this._starterCacheValid = false;

    // === TAKTIK DEĞIŞIMI LOG ===
    if (DEBUG_MATCH) {
      console.log(
        `\n🔄 TACTIC CHANGE (Minute ${this.internalMinute}): ${team.name}`,
      );
      console.log(
        `New Formation: ${adaptedTactic.formation} | Style: ${adaptedTactic.style}`,
      );
      console.log(
        `Aggression: ${adaptedTactic.aggression} | Tempo: ${adaptedTactic.tempo}`,
      );
      console.log(
        `Defensive Line: ${adaptedTactic.defensiveLine} | Passing: ${adaptedTactic.passingStyle}`,
      );
      console.log(`Mentality: ${newTactic.mentality || "BALANCED"}`);
      console.log("----------------------------------------\n");
    }
  }

  public substitutePlayer(
    playerIn: Player,
    playerOutId: string,
    isAI: boolean = false,
  ): boolean {
    const isHome = this.homeTeam.id === playerIn.teamId;
    const list = isHome ? this.homePlayers : this.awayPlayers;

    // Find BOTH players in the list
    const outIdx = list.findIndex((p) => p.id === playerOutId);
    const inIdx = list.findIndex((p) => p.id === playerIn.id);

    // Check sub limit - only enforced for user substitutions, not AI
    const subsMade = isHome ? this.homeSubsMade : this.awaySubsMade;
    if (!isAI && subsMade >= this.MAX_SUBS) {
      this.traceLog.push(
        `DEĞİŞİKLİK REDDEDİLDİ: ${isHome ? "Ev sahibi" : "Deplasman"} maksimum değişiklik hakkını kullandı.`,
      );
      return false;
    }

    // FOOTBALL RULE: A player who has been substituted OUT cannot return to the pitch!
    if (this.substitutedOutPlayerIds.has(playerIn.id)) {
      this.traceLog.push(
        `DEĞİŞİKLİK REDDEDİLDİ: ${playerIn.lastName} zaten oyundan çıkarıldı ve tekrar giremez!`,
      );
      return false;
    }

    if (outIdx !== -1 && inIdx !== -1) {
      // Mark the outgoing player as substituted out - they can NEVER return this match
      this.substitutedOutPlayerIds.add(playerOutId);

      // --- 1. UPDATE SIMULATION DATA ---
      const oldPos = this.sim.players[playerOutId];

      // === KRİTİK FIX: TOP SAHİBİ GÜNCELLEME ===
      // Eğer çıkan oyuncu topa sahipse, topu yeni oyuncuya transfer et
      // Bu olmazsa oyun donuyor! (ball.ownerId silinmiş oyuncuyu gösterir)
      if (this.sim.ball.ownerId === playerOutId) {
        console.log(`⚠️ TOP SAHİBİ DEĞİŞİYOR: ${playerOutId} → ${playerIn.id}`);
        this.sim.ball.ownerId = playerIn.id;
      }

      // Remove outgoing player from simulation
      if (oldPos) delete this.sim.players[playerOutId];

      // Add incoming player to simulation
      // CRITICAL FIX: Reset velocity to ZERO! Otherwise inherits old player's speed -> "light speed bug"
      const base = this.baseOffsets[playerIn.id] || {
        x: PITCH_CENTER_X,
        y: PITCH_CENTER_Y,
      };
      this.sim.players[playerIn.id] = {
        x: oldPos ? oldPos.x : base.x,
        y: oldPos ? oldPos.y : base.y,
        facing: oldPos ? oldPos.facing : 0,
        vx: 0, // RESET VELOCITY - Prevents "light speed" bug!
        vy: 0,
        state: "IDLE",
      };

      // Initialize personality if missing
      if (!playerIn.personality) {
        playerIn.personality = {
          riskTaking:
            (playerIn.attributes.aggression / 100) * 0.6 + Math.random() * 0.4,
          discipline: playerIn.attributes.decisions / 100,
          pressureHandling: playerIn.attributes.composure / 100,
        };
      }

      // Initialize player state
      this.playerStates[playerIn.id] = {
        currentStamina:
          playerIn.condition !== undefined ? playerIn.condition : 100,
        decisionTimer: 0,
        possessionCooldown: 0,
        actionLock: 0,
        targetX: base.x,
        targetY: base.y,
        momentum: 0,
        isPressing: false,
      };

      // === MORAL BOOST FOR SUBSTITUTES ===
      // Oyuna giren yedekler moral kazanır (11'de değildiler ama şimdi oyunculukları!)
      playerIn.morale = Math.min(100, (playerIn.morale || 50) + 8);

      // --- 2. CRITICAL: SWAP ARRAY POSITIONS (Fixes duplicate reference bug!) ---
      // Get references to both player objects
      const playerOutObj = list[outIdx];
      const playerInObj = list[inIdx];

      // Update lineup statuses
      playerOutObj.lineup = "BENCH";
      playerInObj.lineup = "STARTING";
      playerInObj.lineupIndex = playerOutObj.lineupIndex; // Preserve slot index

      // SWAP positions in array - this prevents the "duplicate reference" bug!
      list[outIdx] = playerInObj; // Incoming player to starting spot
      list[inIdx] = playerOutObj; // Outgoing player to bench spot

      this.allPlayers = [...this.homePlayers, ...this.awayPlayers];

      // --- AI: Recalculate slot instruction for incoming player ---
      // The incoming player may have very different stats to the outgoing one,
      // so inheriting the old slot instruction blindly would be wrong.
      if (isAI) {
        const team = isHome ? this.homeTeam : this.awayTeam;
        if (!team.tactic.slotInstructions) team.tactic.slotInstructions = {};
        const slotIdx = playerInObj.lineupIndex;
        const pos = playerInObj.position;
        const a = playerInObj.attributes;
        let newInstruction = 'Default';

        if (pos === Position.DEF) {
          if (team.tactic.mentality === 'Defensive' || a.speed < 60) newInstruction = 'StayBack';
          else if (a.positioning > 75 && a.tackling > 70) newInstruction = 'HoldPosition';
          else if (a.speed > 75 && a.dribbling > 65) newInstruction = 'JoinAttack';
        } else if (pos === Position.MID) {
          if (a.tackling > 75 && a.finishing < 60) newInstruction = 'DefendMore';
          else if (a.finishing > 80) newInstruction = 'ShootOnSight';
          else if (a.vision > 80 && team.tactic.mentality === 'Attacking') newInstruction = 'AttackMore';
          else if (a.stamina > 80 && a.aggression > 75) newInstruction = 'PressHigher';
          else if (a.vision > 80 && a.dribbling > 75) newInstruction = 'RoamFromPosition';
          else if (a.tackling > 70 && a.passing > 70) newInstruction = 'HoldPosition';
        } else if (pos === Position.FWD) {
          if (a.passing > 75 && a.vision > 75) newInstruction = 'DropDeep';
          else if (a.stamina > 80 && a.aggression > 75) newInstruction = 'PressHigher';
          else if (a.finishing < 65 && a.stamina > 75) newInstruction = 'DefendMore';
          else if (a.finishing > 85) newInstruction = 'ShootOnSight';
        }

        if (newInstruction !== 'Default') {
          team.tactic.slotInstructions[slotIdx] = newInstruction;
        } else {
          delete team.tactic.slotInstructions[slotIdx];
        }
      }

      // --- 3. REINITIALIZE TACTICS ---
      this.initializeTactics(
        list.filter((p) => p.lineup === "STARTING"),
        isHome ? this.homeTeam.tactic : this.awayTeam.tactic,
      );

      // Increment sub counter
      if (isHome) this.homeSubsMade++;
      else this.awaySubsMade++;

      // Create SUB event for notification
      const team = isHome ? this.homeTeam : this.awayTeam;
      this.pendingEvents.push({
        minute: this.internalMinute,
        type: MatchEventType.SUB,
        description: `🔄 ${playerOutObj.lastName} ⬇️ ${playerIn.lastName} ⬆️`,
        teamId: team.id,
        playerId: playerIn.id,
        playerOutId: playerOutObj.id, // Added for accurate ratings engine tracking
      });

      this.traceLog.push(
        `OYUNCU DEĞİŞİKLİĞİ: ${playerIn.lastName} oyunda. (${isHome ? this.homeSubsMade : this.awaySubsMade}/${this.MAX_SUBS})`,
      );
    }

    // === PERFORMANCE: Invalidate starter cache after substitution ===
    this._starterCacheValid = false;
  }

  // AI-driven substitutions for non-user teams
  // Called at fixed minutes (35, 55, 65, 80) — loops to make multiple subs per window
  private processAISubstitutions(isHome: boolean) {
    const team = isHome ? this.homeTeam : this.awayTeam;
    const players = isHome ? this.homePlayers : this.awayPlayers;

    // Batch substitution loop — keep subbing while there are tired players and bench available
    const MAX_SUBS_PER_WINDOW = 3; // Max 3 subs per window to be realistic
    let subsThisWindow = 0;

    while (subsThisWindow < MAX_SUBS_PER_WINDOW) {
      const starters = players.filter((p) => p.lineup === "STARTING");
      // IMPORTANT: Filter out players who were already substituted out - they can't return!
      const bench = players.filter(
        (p) => p.lineup === "BENCH" && !this.substitutedOutPlayerIds.has(p.id),
      );

      if (bench.length === 0) break;

      // Find player with worst stamina/performance
      let worstPlayer: Player | null = null;
      let worstScore = Infinity;

      for (const p of starters) {
        if (normalizePos(p) === Position.GK) continue; // Don't sub GK unless injured

        const state = this.playerStates[p.id];
        if (!state) continue;

        // Score based on stamina and position match
        let score = state.currentStamina;

        // === POZİSYONA GÖRE DEĞİŞİKLİK ÖNCELİĞİ ===
        // Orta sahalar daha çabuk yorulduğu için öncelikli değiştirilmeli
        const role = this.playerRoles[p.id];
        if (role === Position.MID && state.currentStamina < 70) {
          score -= 20; // Orta saha yorgunsa daha acil
        }

        // If very tired, prioritize subbing greatly
        if (state.currentStamina < 55) {
          score -= 40;
        } else if (state.currentStamina < 65) {
          score -= 25;
        }

        if (score < worstScore) {
          worstScore = score;
          worstPlayer = p;
        }
      }

      // AI sub thresholds based on match minute
      let subThreshold = 70;
      if (this.internalMinute >= 80) {
        subThreshold = 85; // Son 10: taze oyuncu çok önemli
      } else if (this.internalMinute >= 65) {
        subThreshold = 78;
      } else if (this.internalMinute >= 55) {
        subThreshold = 74;
      } else if (this.internalMinute >= 35) {
        subThreshold = 68; // İlk değişiklik penceresi, sadece çok yorgunlar
      }

      if (!worstPlayer || worstScore > subThreshold) break;

      // Find best bench replacement for the position
      const neededPos = normalizePos(worstPlayer);
      let bestSub: Player | null = null;
      let bestSubScore = -Infinity;

      for (const sub of bench) {
        const subState = this.playerStates[sub.id];
        const stamina = subState ? subState.currentStamina : sub.condition || 100;

        // CRITICAL FIX: NEVER SUB A GK FOR A FIELD PLAYER OR VICE VERSA
        const subIsGK = normalizePos(sub) === Position.GK;
        const neededIsGK = neededPos === Position.GK;

        if (subIsGK !== neededIsGK) continue;

        // Prefer same position
        const posMatch = normalizePos(sub) === neededPos ? 10 : 0;
        const score = sub.overall + posMatch + stamina / 10;

        if (score > bestSubScore) {
          bestSubScore = score;
          bestSub = sub;
        }
      }

      if (!bestSub) break;

      this.substitutePlayer(bestSub, worstPlayer.id, true);
      this.traceLog.push(
        `AI DEĞİŞİKLİK: ${team.name} - ${worstPlayer.lastName} çıktı, ${bestSub.lastName} girdi (yorgunluk: ${Math.round(worstScore)}%)`,
      );
      subsThisWindow++;
    }
  }

  // AI Tactic Change based on match situation
  private processAITacticChange(isHome: boolean) {
    const team = isHome ? this.homeTeam : this.awayTeam;

    // Skip if this is the user's team
    if (team.id === this.userTeamId) return;

    const scoreDiff = isHome
      ? this.match.homeScore - this.match.awayScore
      : this.match.awayScore - this.match.homeScore;

    const currentMentality = isHome
      ? this.sim.homeMentality
      : this.sim.awayMentality;

    let newMentality = currentMentality;
    let newAggression = team.tactic.aggression;
    let newPassingStyle = team.tactic.passingStyle;
    let newTempo = team.tactic.tempo;
    let newWidth = team.tactic.width;

    let tacticChanged = false;

    // --- YAPAY ZEKA AKILLI TAKTİK DEĞİŞİMİ SİSTEMİ ---
    if (this.internalMinute >= 75) {
      if (scoreDiff <= -2) {
        // İki Farkla Yenik (Panic Mode - Çılgın Hücum)
        newMentality = TeamMentality.ALL_OUT_ATTACK;
        newAggression = "Aggressive";
        newPassingStyle = "LongBall"; // Doldur boşalt
        newTempo = "Fast";
        newWidth = "Wide"; // Kanatlara in
      } else if (scoreDiff === -1) {
        // Tek Farkla Yenik (Gol Lazım)
        newMentality = TeamMentality.ALL_OUT_ATTACK; // Baski
        newAggression = "Aggressive";
        newPassingStyle = "Direct";
        newTempo = "Fast";
        newWidth = "Wide";
      } else if (scoreDiff >= 2) {
        // İki Farkla Önde (Rahatla, Skoru Koru)
        newMentality = TeamMentality.DEFENSIVE;
        newAggression = "Cautious";
        newPassingStyle = "Short"; // Pas yap süreyi erit
        newTempo = "Slow";
        newWidth = "Narrow"; // Merkezi kapat
      } else if (scoreDiff === 1) {
        // Tek Farkla Önde (Kapanan Takım - Otobüs Çek!)
        newMentality = TeamMentality.DEFENSIVE;
        newAggression = "Normal";
        newPassingStyle = "Mixed";
        newTempo = "Slow";
        newWidth = "Narrow";
      } else if (scoreDiff === 0) {
        // Maç Berabere, Dakika 75+ (Risk alma zamanı mı, kapanma zamanı mı? Puan iyi diyelim)
        newMentality = TeamMentality.BALANCED;
      }
    } else if (this.internalMinute >= 45) {
      // İkini Yarı (Makul Kararlar)
      if (scoreDiff <= -1) {
        // Yenik
        newMentality = TeamMentality.ATTACKING;
        newAggression = Math.random() < 0.5 ? "Aggressive" : "Normal";
        newTempo = "Fast";
        newPassingStyle = "Mixed"; // Çok panikleme
        newWidth = "Balanced";
      } else if (scoreDiff >= 2) {
        // Fark açıldı
        newMentality = TeamMentality.DEFENSIVE;
        newAggression = "Normal";
        newPassingStyle = "Short"; // Paslaşarak süreyi ye
        newTempo = "Balanced";
      } else if (scoreDiff === 1) {
        // Öndeyiz
        newMentality = TeamMentality.BALANCED;
      }
    } else if (this.internalMinute >= 25) {
      // İlk Yarı Sonları
      if (scoreDiff <= -2) {
        newMentality = TeamMentality.ATTACKING; // Şok skorda cevap ver
        newPassingStyle = "Mixed";
        newTempo = "Fast";
      } else if (scoreDiff >= 2) {
        newMentality = TeamMentality.BALANCED; // Öndeyken yavaşla
        newTempo = "Balanced";
      }
    }

    // Değişiklik oldu mu?
    if (team.tactic.aggression !== newAggression) { team.tactic.aggression = newAggression; tacticChanged = true; }
    if (team.tactic.passingStyle !== newPassingStyle) { team.tactic.passingStyle = newPassingStyle; tacticChanged = true; }
    if (team.tactic.tempo !== newTempo) { team.tactic.tempo = newTempo; tacticChanged = true; }
    if (team.tactic.width !== newWidth) { team.tactic.width = newWidth; tacticChanged = true; }

    if (newMentality !== currentMentality || tacticChanged) {
      if (newMentality !== currentMentality) {
        if (isHome) {
          this.sim.homeMentality = newMentality;
          this.homeTeam.tactic.mentality = newMentality as string;
        } else {
          this.sim.awayMentality = newMentality;
          this.awayTeam.tactic.mentality = newMentality as string;
        }
      }

      const mentalityTR: Record<string, string> = {
        Defensive: "Defansif",
        Balanced: "Dengeli",
        Attacking: "Hücum",
        "Ultra-Attacking": "Topyekün Hücum",
      };

      this.pendingEvents.push({
        minute: this.internalMinute,
        type: MatchEventType.SUB,
        description: `📋 Yeni Taktik: ${mentalityTR[newMentality]} | Mod: ${newAggression}`,
        teamId: team.id,
      });

      this.traceLog.push(
        `🧠 AI YENİ TAKTİK (${team.name}): Skor ${scoreDiff > 0 ? "+" : ""}${scoreDiff} -> ${mentalityTR[newMentality]}, Pas: ${newPassingStyle}, Tempo: ${newTempo}, Agresiflik: ${newAggression}, Genişlik: ${newWidth}`,
      );
    }
  }

  public syncLineups(homePlayers: Player[], awayPlayers: Player[]) {
    // 1. Update lists (keep Bench for subs)
    this.homePlayers = homePlayers.filter(
      (p) => p.lineup === "STARTING" || p.lineup === "BENCH",
    );
    this.awayPlayers = awayPlayers.filter(
      (p) => p.lineup === "STARTING" || p.lineup === "BENCH",
    );
    this.allPlayers = [...this.homePlayers, ...this.awayPlayers];

    // === PERFORMANCE: Invalidate starter cache ===
    this._starterCacheValid = false;

    // 2. Get current simulation state for existing players (to preserve positions)
    const existingSimPlayers = { ...this.sim.players };
    const existingPlayerStates = { ...this.playerStates };

    // 3. Re-initialize tactics/offsets for NEW players only
    const homeStarters = this.homePlayers.filter(
      (p) => p.lineup === "STARTING",
    );
    const awayStarters = this.awayPlayers.filter(
      (p) => p.lineup === "STARTING",
    );

    // Initialize tactics (this sets baseOffsets)
    this.initializeTactics(homeStarters, this.homeTeam.tactic);
    this.initializeTactics(awayStarters, this.awayTeam.tactic);

    // 4. Sync Simulation State
    const allStarting = [...homeStarters, ...awayStarters];
    const newIds = new Set(allStarting.map((p) => p.id));

    // Remove players no longer starting
    Object.keys(this.sim.players).forEach((id) => {
      if (!newIds.has(id)) {
        // === KRİTİK FIX: TOP SAHİBİ KONTROLÜ ===
        // Eğer silinen oyuncu topa sahipse, topu bırak (sahipsiz yap)
        if (this.sim.ball.ownerId === id) {
          console.log(
            `⚠️ syncLineups: Top sahibi ${id} siliniyor - top sahipsiz yapıldı`,
          );
          this.sim.ball.ownerId = null;
        }
        delete this.sim.players[id];
        // Only delete playerState if player is completely gone (red card, etc.)
        // Bench players must keep their state so stamina stays visible in UI
        const isStillInTeam = this.allPlayers.some((p) => p.id === id);
        if (!isStillInTeam) {
          delete this.playerStates[id];
        }
      }
    });

    // Add/Update players
    allStarting.forEach((p) => {
      // baseOffsets artık direkt motor koordinatlarında (105x68)
      const base = this.baseOffsets[p.id] || {
        x: PITCH_CENTER_X,
        y: PITCH_CENTER_Y,
      };
      const isHome = p.teamId === this.homeTeam.id;
      const existingSim = existingSimPlayers[p.id];

      if (!this.sim.players[p.id]) {
        // Don't re-add players who were already substituted out this match
        // (stale gameState data can pass them as STARTING after AI subs → 12-player bug)
        if (this.substitutedOutPlayerIds.has(p.id)) {
          p.lineup = "BENCH";
          return;
        }
        // NEW player entering pitch (substitution already handled by substitutePlayer)
        this.sim.players[p.id] = {
          x: existingSim
            ? existingSim.x
            : isHome
              ? base.x
              : PITCH_LENGTH - base.x,
          y: existingSim
            ? existingSim.y
            : isHome
              ? base.y
              : PITCH_WIDTH - base.y,
          facing: existingSim ? existingSim.facing : 0,
          vx: 0, // Reset velocity to prevent glitches
          vy: 0,
          state: "IDLE",
        };
      }

      // Init/restore state if missing
      if (!this.playerStates[p.id]) {
        const existingState = existingPlayerStates[p.id];
        this.playerStates[p.id] = existingState || {
          currentStamina: p.condition || 100,
          decisionTimer: Math.random() * 5,
          possessionCooldown: 0,
          actionLock: 0,
          targetX: base.x,
          targetY: base.y,
          momentum: 0,
          isPressing: false,
        };
      }
    });

    this.traceLog.push("KADRO GÜNCELLENDİ: Auto-Fix uygulandı.");
  }

  private resetPositions(mode: SetPieceMode, concedingTeamId?: string) {
    this.sim.ball = {
      x: PITCH_CENTER_X,
      y: PITCH_CENTER_Y,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      curve: 0,
      ownerId: null,
    };
    this.currentLooseBallChaserId = null;
    this.lastTouchTeamId = null;

    // Only reset positions for STARTING players (BENCH players aren't on the pitch)
    [...this.homePlayers, ...this.awayPlayers]
      .filter((p) => p.lineup === "STARTING")
      .forEach((p) => {
        const isHome = p.teamId === this.homeTeam.id;
        // baseOffsets artık direkt motor koordinatlarında (105x68)
        const base = this.baseOffsets[p.id];
        if (!base) return; // Skip if no base offset defined

        let startX = isHome ? base.x : PITCH_LENGTH - base.x;
        let startY = isHome ? base.y : PITCH_WIDTH - base.y;

        if (mode === "KICKOFF") {
          if (isHome) startX = Math.min(startX, PITCH_CENTER_X - 1);
          else startX = Math.max(startX, PITCH_CENTER_X + 1);
        } else if (mode.includes("GOAL_KICK")) {
          const isHomeKick = mode === "GOAL_KICK_HOME";
          const kickingTeam = isHomeKick === isHome;
          const role = this.playerRoles[p.id];

          if (kickingTeam) {
            if (role === Position.GK) {
              startX = isHome ? 5 : PITCH_LENGTH - 5;
              startY = PITCH_CENTER_Y;
            } else if (role === Position.DEF) {
              startX = isHome ? 13 : PITCH_LENGTH - 13;
              // startY override removed to prevent clustering
            } else if (role === Position.MID) {
              startX = isHome ? 39 : PITCH_LENGTH - 39;
            } else if (role === Position.FWD) {
              startX = isHome ? 66 : PITCH_LENGTH - 66;
            }
          } else {
            if (role === Position.FWD) {
              startX = isHome ? 83 : PITCH_LENGTH - 83;
            } else if (role === Position.DEF) {
              startX = isHome ? 49 : PITCH_LENGTH - 49;
            }
          }
        } else if (mode.includes("CORNER")) {
          const isHomeCorner = mode.startsWith("CORNER_HOME");
          const isTop = mode.includes("TOP");
          const attacking = isHomeCorner === isHome;
          const role = this.playerRoles[p.id];

          if (attacking) {
            if (role === Position.GK) {
              startX = isHome ? 10 : PITCH_LENGTH - 10;
            } else if (role === Position.DEF) {
              if (p.attributes.strength > 75) {
                startX = isHome ? PITCH_LENGTH - 8 : 8;
                startY = PITCH_CENTER_Y + (Math.random() * 14 - 7);
              } else {
                startX = isHome ? 66 : PITCH_LENGTH - 66;
              }
            } else {
              startX = isHome ? PITCH_LENGTH - 6 : 6;
              startY = PITCH_CENTER_Y + (Math.random() * 20 - 10);
            }
          } else {
            if (role === Position.GK) {
              startX = isHome ? 2 : PITCH_LENGTH - 2;
              startY = PITCH_CENTER_Y;
            } else {
              startX = isHome ? 6 : PITCH_LENGTH - 6;
              startY = PITCH_CENTER_Y + (Math.random() * 20 - 10);
            }
          }
        }

        this.sim.players[p.id] = {
          x: startX,
          y: startY,
          facing: isHome ? 0 : Math.PI,
          vx: 0,
          vy: 0,
          state: "IDLE",
        };

        if (this.playerStates[p.id]) {
          this.playerStates[p.id].possessionCooldown = 0;
          this.playerStates[p.id].actionLock = 0;
          this.playerStates[p.id].targetX = startX;
          this.playerStates[p.id].targetY = startY;
          this.playerStates[p.id].isPressing = false;
        }
      });

    if (mode === "KICKOFF") {
      let kickoffTeamPlayers =
        Math.random() > 0.5
          ? this.homePlayers.filter((p) => p.lineup === "STARTING")
          : this.awayPlayers.filter((p) => p.lineup === "STARTING");
      if (concedingTeamId) {
        kickoffTeamPlayers =
          concedingTeamId === this.homeTeam.id
            ? this.homePlayers.filter((p) => p.lineup === "STARTING")
            : this.awayPlayers.filter((p) => p.lineup === "STARTING");
      }

      const kickers = kickoffTeamPlayers
        .filter(
          (p) =>
            this.playerRoles[p.id] === Position.FWD ||
            this.playerRoles[p.id] === Position.MID,
        )
        .slice(0, 2);
      if (kickers.length < 2 && kickoffTeamPlayers.length > 0)
        kickers.push(kickoffTeamPlayers[0]);

      const k1 = kickers[0];
      const k2 = kickers[1];
      const isHomeKick = k1.teamId === this.homeTeam.id;

      this.sim.players[k1.id].x = PITCH_CENTER_X;
      this.sim.players[k1.id].y = PITCH_CENTER_Y;
      this.sim.ball.ownerId = k1.id;
      this.sim.players[k1.id].facing = isHomeKick ? 0 : Math.PI;

      this.sim.players[k2.id].x = PITCH_CENTER_X + (isHomeKick ? -0.5 : 0.5);
      this.sim.players[k2.id].y = PITCH_CENTER_Y + 3;
      this.sim.players[k2.id].facing = isHomeKick ? 0 : Math.PI;

      const enemyPlayers = (
        isHomeKick ? this.awayPlayers : this.homePlayers
      ).filter((p) => p.lineup === "STARTING");
      enemyPlayers.forEach((ep) => {
        if (
          this.sim.players[ep.id] &&
          dist(
            PITCH_CENTER_X,
            PITCH_CENTER_Y,
            this.sim.players[ep.id].x,
            this.sim.players[ep.id].y,
          ) < 10
        ) {
          this.sim.players[ep.id].x = isHomeKick ? 65 : 40;
        }
      });
    } else if (mode.includes("GOAL_KICK")) {
      const isHome = mode === "GOAL_KICK_HOME";
      const team = (isHome ? this.homePlayers : this.awayPlayers).filter(
        (p) => p.lineup === "STARTING",
      );
      const gk = team.find((p) => this.playerRoles[p.id] === Position.GK);
      if (gk && this.sim.players[gk.id]) {
        this.sim.players[gk.id].x = isHome ? 5 : 100;
        this.sim.players[gk.id].y = PITCH_CENTER_Y;
        this.sim.ball.ownerId = gk.id;
        this.sim.ball.x = isHome ? 5 : 100;
        this.sim.ball.y = PITCH_CENTER_Y;
      }
    } else if (mode.includes("CORNER")) {
      const isHome = mode.startsWith("CORNER_HOME");
      const isTop = mode.includes("TOP");
      const team = (isHome ? this.homePlayers : this.awayPlayers).filter(
        (p) => p.lineup === "STARTING",
      );
      const takerPool = team.filter((p) => this.playerRoles[p.id] !== Position.GK);
      const taker = (takerPool.length > 0 ? takerPool : team).sort(
        (a, b) =>
          b.attributes.passing +
          b.attributes.vision -
          (a.attributes.passing + a.attributes.vision),
      )[0];

      const cX = isHome ? PITCH_LENGTH : 0;
      const cY = isTop ? 0 : PITCH_WIDTH;

      if (taker && this.sim.players[taker.id]) {
        this.sim.players[taker.id].x = cX;
        this.sim.players[taker.id].y = cY;
        this.sim.ball.ownerId = taker.id;
        this.sim.ball.x = cX;
        this.sim.ball.y = cY;
        this.sim.players[taker.id].facing = Math.atan2(
          PITCH_CENTER_Y - cY,
          (isHome ? 95 : 10) - cX,
        );
        this.playerStates[taker.id].actionLock = 5;
      }
    } else if (mode.includes("FREE_KICK")) {
      // Free kick - ball placed where foul occurred (stored in foulPosition)
      const isHome = mode === "FREE_KICK_HOME";
      const team = (isHome ? this.homePlayers : this.awayPlayers).filter(
        (p) => p.lineup === "STARTING",
      );
      // Best finisher / free kick specialist takes the free kick
      const taker = team.sort((a, b) => {
        const scoreA = a.attributes.finishing + (a.playStyles?.includes("Ölü Top Uzmanı") ? 35 : 0) + (a.playStyles?.includes("Plase Şut") ? 15 : 0) + (a.playStyles?.includes("Roket") ? 10 : 0);
        const scoreB = b.attributes.finishing + (b.playStyles?.includes("Ölü Top Uzmanı") ? 35 : 0) + (b.playStyles?.includes("Plase Şut") ? 15 : 0) + (b.playStyles?.includes("Roket") ? 10 : 0);
        return scoreB - scoreA;
      })[0];

      // Use stored foul position or default to midfield
      const fkX = this.foulPosition?.x ?? PITCH_CENTER_X;
      const fkY = this.foulPosition?.y ?? PITCH_CENTER_Y;

      if (taker && this.sim.players[taker.id]) {
        this.sim.players[taker.id].x = fkX;
        this.sim.players[taker.id].y = fkY;
        this.sim.ball.ownerId = taker.id;
        this.sim.ball.x = fkX;
        this.sim.ball.y = fkY;
        this.sim.players[taker.id].facing = isHome ? 0 : Math.PI;
        this.playerStates[taker.id].actionLock = 5;
      }

      // === SERBEST VURUŞ BARAJI ===
      // FIFA kuralı: Baraj en az 9.15m (10 yard) uzaklıkta olmalı
      // Baraj top ile kale arasında, kaleye dik açıyla dizilmeli
      const enemyTeam = (isHome ? this.awayPlayers : this.homePlayers).filter(
        (p) => p.lineup === "STARTING",
      );
      const goalX = isHome ? PITCH_LENGTH : 0; // Hedef kale
      const goalY = GOAL_Y_CENTER;

      // Top-Kale vektörü
      const toGoalX = goalX - fkX;
      const toGoalY = goalY - fkY;
      const toGoalDist = Math.sqrt(toGoalX * toGoalX + toGoalY * toGoalY);

      // Baraj pozisyonu: Top ile kale arasında, 9.15m uzaklıkta
      const WALL_DISTANCE = 9.15; // FIFA kuralı
      const wallCenterX = fkX + (toGoalX / toGoalDist) * WALL_DISTANCE;
      const wallCenterY = fkY + (toGoalY / toGoalDist) * WALL_DISTANCE;

      // Baraja dik vektör (oyuncuları yan yana dizmek için)
      const perpX = -toGoalY / toGoalDist;
      const perpY = toGoalX / toGoalDist;

      // Kaç kişilik baraj? Uzak ve dar açıdaki frikiklerde duvar kurma.
      const distToGoal = toGoalDist;
      const isWallWorthyDistance = distToGoal < 33;
      const isWallWorthyAngle = Math.abs(fkY - goalY) < 17;
      let wallSize = 0;
      if (isWallWorthyDistance && isWallWorthyAngle) {
        if (distToGoal < 22) wallSize = 5;
        else if (distToGoal < 28) wallSize = 4;
        else wallSize = 3;
      }

      // Savunma oyuncularını seç (kaleci hariç)
      const wallCandidates = enemyTeam
        .filter((ep) => this.playerRoles[ep.id] !== Position.GK)
        .sort((a, b) => {
          // Önce defans oyuncuları, sonra orta saha
          const roleA = this.playerRoles[a.id] === Position.DEF ? 0 : 1;
          const roleB = this.playerRoles[b.id] === Position.DEF ? 0 : 1;
          return roleA - roleB;
        })
        .slice(0, wallSize);

      // Barajı diz (yan yana, 0.8m aralıkla)
      const PLAYER_SPACING = 0.8; // Omuz omuza
      wallCandidates.forEach((ep, idx) => {
        if (!this.sim.players[ep.id]) return;
        const offset = (idx - (wallCandidates.length - 1) / 2) * PLAYER_SPACING;
        this.sim.players[ep.id].x = wallCenterX + perpX * offset;
        this.sim.players[ep.id].y = wallCenterY + perpY * offset;
        this.sim.players[ep.id].vx = 0;
        this.sim.players[ep.id].vy = 0;
        // Topa bak
        this.sim.players[ep.id].facing = Math.atan2(
          fkY - this.sim.players[ep.id].y,
          fkX - this.sim.players[ep.id].x,
        );
      });

      // Diğer savunma oyuncularını da uzaklaştır (barajda olmayanlar)
      enemyTeam.forEach((ep) => {
        if (wallCandidates.includes(ep)) return; // Barajdakiler zaten yerleşti
        if (!this.sim.players[ep.id]) return;
        const d = dist(
          fkX,
          fkY,
          this.sim.players[ep.id].x,
          this.sim.players[ep.id].y,
        );
        if (d < WALL_DISTANCE) {
          // Radyal olarak uzaklaştır
          const dx = this.sim.players[ep.id].x - fkX;
          const dy = this.sim.players[ep.id].y - fkY;
          const currentDist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
          this.sim.players[ep.id].x =
            fkX + (dx / currentDist) * (WALL_DISTANCE + 2);
          this.sim.players[ep.id].y =
            fkY + (dy / currentDist) * (WALL_DISTANCE + 2);
        }
      });
    } else if (mode.includes("THROW_IN")) {
      // Throw in - ball placed where it went out
      const isHome = mode === "THROW_IN_HOME";
      const team = (isHome ? this.homePlayers : this.awayPlayers).filter(
        (p) => p.lineup === "STARTING",
      );
      // Closest non-GK player to throw position takes it
      const throwY = this.throwInPosition?.y ?? PITCH_CENTER_Y;
      const throwX =
        this.throwInPosition?.x ?? (throwY < PITCH_CENTER_Y ? 0 : PITCH_LENGTH);

      const taker = team
        .filter((p) => this.playerRoles[p.id] !== Position.GK)
        .sort((a, b) => {
          const distA = this.sim.players[a.id]
            ? dist(
              throwX,
              throwY,
              this.sim.players[a.id].x,
              this.sim.players[a.id].y,
            )
            : 999;
          const distB = this.sim.players[b.id]
            ? dist(
              throwX,
              throwY,
              this.sim.players[b.id].x,
              this.sim.players[b.id].y,
            )
            : 999;
          return distA - distB;
        })[0];

      if (taker && this.sim.players[taker.id]) {
        this.sim.players[taker.id].x = throwX;
        this.sim.players[taker.id].y = throwY;
        this.sim.ball.ownerId = taker.id;
        this.sim.ball.x = throwX;
        this.sim.ball.y = throwY;
        this.sim.players[taker.id].facing =
          throwX < PITCH_CENTER_X ? 0 : Math.PI;
        this.playerStates[taker.id].actionLock = 3;
      }
    }
  }

  private updateTeamMentality() {
    // Artık maçın skoruna göre kendi kafasına göre Mentalite değiştirmiyor!
    // Sadece kullanıcının (veya AI'nin) seçtiği Karar Tarzı'nı (Mentality) uyguluyor.
    const mapMentality = (m?: string): TeamMentality => {
      if (m === "Attacking" || m === "Riskli") return TeamMentality.ATTACKING;
      if (m === "Defensive" || m === "Temkinli") return TeamMentality.DEFENSIVE;
      return TeamMentality.BALANCED;
    };

    this.homeMentality = mapMentality(this.homeTeam.tactic.mentality);
    this.awayMentality = mapMentality(this.awayTeam.tactic.mentality);
    this.sim.homeMentality = this.homeMentality;
    this.sim.awayMentality = this.awayMentality;
  }

  public logMatchStats() {
    if (this._statsLogged) return;
    this._statsLogged = true;
    if (!DEBUG_MATCH) return;

    const h = this.homeTeam;
    const a = this.awayTeam;
    const s = this.match.stats;

    // === TAKIMLARIN TAKTIK VE ORTALAMA GÜÇÜ ===
    const homeAvgStr = (
      this.homePlayers.reduce(
        (sum, p) => sum + (p.attributes?.strength || 50),
        0,
      ) / this.homePlayers.length
    ).toFixed(1);
    const awayAvgStr = (
      this.awayPlayers.reduce(
        (sum, p) => sum + (p.attributes?.strength || 50),
        0,
      ) / this.awayPlayers.length
    ).toFixed(1);

    const homeAvgPace = (
      this.homePlayers.reduce(
        (sum, p) => sum + (p.attributes?.speed || 50),
        0,
      ) / this.homePlayers.length
    ).toFixed(1);
    const awayAvgPace = (
      this.awayPlayers.reduce(
        (sum, p) => sum + (p.attributes?.speed || 50),
        0,
      ) / this.awayPlayers.length
    ).toFixed(1);

    const homeTactic = this.homeTeam.tactic;
    const awayTactic = this.awayTeam.tactic;

    console.log(`\n${"═".repeat(80)}`);
    console.log(
      `⚽ MAÇ ANALIZ RAPORU: ${h.name} ${this.match.homeScore} - ${this.match.awayScore} ${a.name}`,
    );
    console.log(`${"═".repeat(80)}\n`);

    // Takım Genel Bilgiler
    console.log(`📋 TAKIMLAR:`);
    console.log(
      `  ${h.name.padEnd(30)} | Taktik: ${homeTactic.style.padEnd(12)} | Ort. Güç: ${homeAvgStr} | Ort. Hız: ${homeAvgPace}`,
    );
    console.log(
      `  ${a.name.padEnd(30)} | Taktik: ${awayTactic.style.padEnd(12)} | Ort. Güç: ${awayAvgStr} | Ort. Hız: ${awayAvgPace}`,
    );
    console.log();

    // Sahiplik ve Temel İstatistikler
    const homePoss = s.homePossession || 50;
    const awayPoss = s.awayPossession || 50;
    console.log(`📊 TEMEL İSTATİSTİKLER:`);
    console.log(
      `  Topa Sahiplik:     ${homePoss}%`.padEnd(35) + `| ${awayPoss}%`,
    );
    console.log(
      `  Şut Sayısı:        ${s.homeShots}`.padEnd(35) + `| ${s.awayShots}`,
    );
    console.log(
      `  İsabetli Şut:      ${s.homeOnTarget}`.padEnd(35) +
      `| ${s.awayOnTarget}`,
    );
    console.log(
      `  Şut Doğruluğu:     %${s.homeShots > 0 ? ((s.homeOnTarget / s.homeShots) * 100).toFixed(1) : 0}`.padEnd(
        35,
      ) +
      `| %${s.awayShots > 0 ? ((s.awayOnTarget / s.awayShots) * 100).toFixed(1) : 0}`,
    );
    console.log();

    // xG ve Beklentiler
    const homeXG = (s.homeXG || 0).toFixed(2);
    const awayXG = (s.awayXG || 0).toFixed(2);
    console.log(`🎯 BEKLENTİ VE VERIMLILIK:`);
    console.log(`  Expected Goals:    ${homeXG}`.padEnd(35) + `| ${awayXG}`);
    console.log(
      `  Kaleci Kurtarış:   ${s.homeSaves || 0}`.padEnd(35) +
      `| ${s.awaySaves || 0}`,
    );
    const homeGoalEff =
      s.homeShots > 0
        ? ((this.match.homeScore / s.homeShots) * 100).toFixed(1)
        : 0;
    const awayGoalEff =
      s.awayShots > 0
        ? ((this.match.awayScore / s.awayShots) * 100).toFixed(1)
        : 0;
    console.log(
      `  Gol Verimliliği:   %${homeGoalEff}`.padEnd(35) + `| %${awayGoalEff}`,
    );
    console.log();

    // Detaylı Taktik Bilgisi
    console.log(`🎲 TAKTIK AYARLARI:`);
    console.log(
      `  ${h.name.substring(0, 20).padEnd(25)} ${a.name.substring(0, 20).padEnd(25)}`,
    );
    console.log(
      `  Stili: ${homeTactic.style.padEnd(18)} | Stili: ${awayTactic.style.padEnd(18)}`,
    );
    console.log(
      `  Saldırganlık: ${homeTactic.aggression.padEnd(12)} | Saldırganlık: ${awayTactic.aggression.padEnd(12)}`,
    );
    console.log(
      `  Tempo: ${homeTactic.tempo.padEnd(16)} | Tempo: ${awayTactic.tempo.padEnd(16)}`,
    );
    console.log(
      `  Savunma Hattı: ${homeTactic.defensiveLine.padEnd(9)} | Savunma Hattı: ${awayTactic.defensiveLine.padEnd(9)}`,
    );
    console.log(
      `  Pas Stili: ${homeTactic.passingStyle.padEnd(13)} | Pas Stili: ${awayTactic.passingStyle.padEnd(13)}`,
    );
    console.log();

    console.log(`${"═".repeat(80)}\n`);
  }

  public logHalfTimeStats() {
    if (!DEBUG_MATCH) return;

    const h = this.homeTeam;
    const a = this.awayTeam;
    const s = this.match.stats;

    console.log(`\n${"═".repeat(80)}`);
    console.log(
      `⏸️  İLK YARI SONU: ${h.name} ${this.match.homeScore} - ${this.match.awayScore} ${a.name}`,
    );
    console.log(`${"═".repeat(80)}\n`);

    // Sahiplik
    const homePoss = s.homePossession || 50;
    const awayPoss = s.awayPossession || 50;
    console.log(`📊 İLK YARI İSTATİSTİKLER:`);
    console.log(
      `  Topa Sahiplik:     ${homePoss}%`.padEnd(35) + `| ${awayPoss}%`,
    );
    console.log(
      `  Şut:               ${s.homeShots} (${s.homeOnTarget} isabetli)`.padEnd(
        35,
      ) + `| ${s.awayShots} (${s.awayOnTarget} isabetli)`,
    );
    console.log(
      `  Kaleci Kurtarış:   ${s.homeSaves || 0}`.padEnd(35) +
      `| ${s.awaySaves || 0}`,
    );
    console.log(
      `  Expected Goals:    ${(s.homeXG || 0).toFixed(2)}`.padEnd(35) +
      `| ${(s.awayXG || 0).toFixed(2)}`,
    );
    console.log();

    console.log(`${"═".repeat(80)}\n`);
  }

  public step() {
    this.traceLog = [];
    this.tickCount++;
    this.debugTickCounter++; // Global tick sayacı
    let event: MatchEvent | null = null;

    // === DEBUG LOGGING - Her DEBUG_INTERVAL tick'te bir ===
    if (this.DEBUG_MODE && this.debugTickCounter % this.DEBUG_INTERVAL === 0) {
      this.logDebugSnapshot();
    }

    if (this.tickCount >= TICKS_PER_MINUTE) {
      this.internalMinute++;
      this.tickCount = 0;
      this.updateTeamMentality();

      // === DEBUG: Her 15 dakikada bir oyun durumunu logla ===
      if (
        DEBUG_MATCH &&
        (this.internalMinute % 15 === 0 ||
          this.internalMinute === 45 ||
          this.internalMinute === 90)
      ) {
        const ballSpeed = Math.sqrt(
          this.sim.ball.vx ** 2 + this.sim.ball.vy ** 2,
        );
        console.log(
          `⏱️ ${this.internalMinute}' | Top: (${this.sim.ball.x.toFixed(0)},${this.sim.ball.y.toFixed(0)}) hız:${ballSpeed.toFixed(2)} | Sahip: ${this.sim.ball.ownerId ? this.getPlayer(this.sim.ball.ownerId)?.lastName || "YOK" : "Sahipsiz"}`,
        );

        // İlk Yarı Raporu
        if (this.internalMinute === 45) {
          this.logHalfTimeStats();
        }

        // Maç Sonu Raporu
        if (this.internalMinute >= 90) {
          this.logMatchStats();
        }
      }

      // AI substitution at fixed minutes (35, 55, 65, 80) with batch subs
      if ([35, 55, 65, 80].includes(this.internalMinute)) {
        // Only process AI subs for teams that are NOT user-controlled
        if (this.userTeamId !== this.homeTeam.id) {
          this.processAISubstitutions(true);
        }
        if (this.userTeamId !== this.awayTeam.id) {
          this.processAISubstitutions(false);
        }
      }

      // AI TACTIC CHANGE - Check at 30', 60', 75'
      if ([30, 60, 75].includes(this.internalMinute)) {
        this.processAITacticChange(true);
        this.processAITacticChange(false);
      }

      // === SECOND HALF KICKOFF ===
      // Trigger kickoff immediately when we transition TO minute 46 (right after 45)
      if (this.internalMinute === 46 && this.tickCount === 0) {
        // Only do this once - when we first hit 46
        this.resetPositions("KICKOFF");
        this.pendingEvents.push({
          minute: this.internalMinute,
          type: MatchEventType.KICKOFF,
          description: "2nd Half",
          teamId: this.awayTeam.id,
        });
      }
    }

    this.updateBallPhysics();

    // === VISUAL STATE CLEANUP ===
    Object.keys(this.sim.players).forEach((id) => {
      const simP = this.sim.players[id] as any;
      const state = this.playerStates[id] as any;

      // Reset collision flag every tick (it's re-calculated in resolveCollisions)
      // But resolveCollisions runs every 2 ticks, so we might want to keep it?
      // Actually, let's just clear it. If it flickers, we can increase persistence.
      if (this.tickCount % 2 === 0) simP.isCollided = false;

      // Clear shot type if expired
      if (
        simP.shotType &&
        state.shotTypeExpiry &&
        this.tickCount > state.shotTypeExpiry
      ) {
        simP.shotType = undefined;
        state.shotTypeExpiry = undefined;
      }
    });

    // === GLOBAL PRESSING CONTROLLER (Merkezi Pres Dağıtıcı) ===
    // Her tick başında kimlerin pres yapacağını MERKEZI olarak belirle
    // Bu sayede 5-6 kişi birden topa saldırmaz!
    this.homePresserIds.clear();
    this.awayPresserIds.clear();

    const ballOwnerForPressing = this.sim.ball.ownerId
      ? this.getPlayer(this.sim.ball.ownerId)
      : null;

    if (ballOwnerForPressing) {
      const defendingTeamId =
        ballOwnerForPressing.teamId === this.homeTeam.id
          ? this.awayTeam.id
          : this.homeTeam.id;
      const isDefendingHome = defendingTeamId === this.homeTeam.id;
      const defendingPlayers = (
        isDefendingHome ? this._cachedHomeStarters : this._cachedAwayStarters
      ).filter(
        (p) => this.sim.players[p.id] && this.playerRoles[p.id] !== Position.GK,
      );

      const ballX = this.sim.ball.x;
      const ballY = this.sim.ball.y;
      const myGoalX = isDefendingHome ? 0 : PITCH_LENGTH;

      // === ZONAL HANDOVER (Bölgesel Devir Teslim) - İKİ GEMİNİ'NİN ÖNERİSİ ===
      // Sadece mesafeye bakmak YETMİYOR! Topun arkasında kalan (çalımlanmış) oyuncular
      // mesafesi kısa olsa bile "ana presçi" olmamalı. Yetki önündeki taze oyuncuya geçmeli!
      const sortedDefenders = defendingPlayers
        .map((p) => {
          const pos = this.sim.players[p.id];
          const d = dist(pos.x, pos.y, ballX, ballY);
          const stamina = this.playerStates[p.id]?.currentStamina || 100;

          // === KRİTİK: ÇALIMLANMIŞ OYUNCU TESPİTİ ===
          // Top oyuncuyu geçmiş mi? (Kaleye oyuncudan daha yakın mı?)
          // Home takım: Kale x=0, yani top < oyuncu.x ise oyuncu geçilmiş
          // Away takım: Kale x=105, yani top > oyuncu.x ise oyuncu geçilmiş
          // 2.5 metre tolerans - sırt sırta mücadele için (GÜNCELLENDİ!)
          const isBeaten = isDefendingHome
            ? ballX < pos.x - 2.5
            : ballX > pos.x + 2.5;

          return { id: p.id, dist: d, stamina, isBeaten, x: pos.x };
        })
        // === KATILI FILTRE: Yorgunluk + Geçilmiş Oyuncu ===
        // 1. %30 altı: Pres yapma hakkı YOK
        // 2. Geçilmiş (isBeaten) VE mesafe > 3m: Elendi!
        //    (İstisna: Topa < 3m yakınsa recover yapabilir)
        .filter((p) => {
          if (p.stamina <= 30) return false; // Yorgun eleniyor
          if (p.isBeaten && p.dist > 3.0) return false; // Geçilmiş + uzakta = eleniyor!
          return true;
        })
        // === ZONAL HANDOVER SIRALAMA ===
        // Önce topun önündekilere (isBeaten: false) öncelik ver, sonra mesafeye bak
        // Bu sayede orta saha geçildiğinde yetki otomatik defansa devredilir!
        .sort((a, b) => {
          // Öncelik 1: Çalımlanmamış oyuncular öne
          if (a.isBeaten !== b.isBeaten) return a.isBeaten ? 1 : -1;
          // Öncelik 2: Mesafeye göre sırala
          return a.dist - b.dist;
        });

      // Taktiksel Pres Kapasitesi
      const defenderTactic = isDefendingHome
        ? this.homeTeam.tactic
        : this.awayTeam.tactic;
      // === DEFENSE APPROACH (DIRECT READ) ===
      const defenseApproach = (defenderTactic as any).defenseApproach ||
        (defenderTactic.pressingIntensity === 'Gegenpress' ? 'HUNT' :
         defenderTactic.pressingIntensity === 'HighPress' ? 'FRONT_FOOT' :
         defenderTactic.defensiveLine === 'High' ? 'FRONT_FOOT' :
         defenderTactic.defensiveLine === 'Deep' ? 'LOW_BLOCK' : 'MID_BLOCK');

      let maxPressers = 2; // Varsayılan: 2 kişi (MID_BLOCK)

      if (defenseApproach === 'LOW_BLOCK') {
        maxPressers = 1; // Alan savunması — kimse çıkmaz
      } else if (defenseApproach === 'MID_BLOCK') {
        maxPressers = 2; // Standart orta blok
      } else if (defenseApproach === 'FRONT_FOOT') {
        maxPressers = 3; // Agresif ileri baskı
      } else if (defenseApproach === 'HUNT') {
        maxPressers = 4; // Topa şok baskı!
      }

      // Tehlike bölgesi: Ceza sahası yakınında +1 presçi
      const distToGoal = Math.abs(ballX - myGoalX);
      const isBallInDangerZone = distToGoal < 30; // Ceza sahası civarı
      if (isBallInDangerZone) maxPressers += 1;

      // === KONTRA ATAK KONTROLÜ ===
      // Eğer topun önünde hiç oyuncu kalmadıysa (herkes geçildi), kovalayanlara izin ver!
      const unbeatenCount = sortedDefenders.filter((p) => !p.isBeaten).length;
      const useBeatenPlayers = unbeatenCount < maxPressers; // Yeterli "taze" oyuncu yoksa

      // Seçilen oyunculara "Pres Yetkisi" ver
      let pressersAdded = 0;
      for (const defender of sortedDefenders) {
        if (pressersAdded >= maxPressers) break;

        // Eğer yeterli taze oyuncu varsa, çalımlanmış oyuncuları atla
        if (defender.isBeaten && !useBeatenPlayers) continue;

        if (isDefendingHome) {
          this.homePresserIds.add(defender.id);
        } else {
          this.awayPresserIds.add(defender.id);
        }
        pressersAdded++;
      }
    }

    // === BALL STUCK DETECTION & RESET ===
    const ballSpeed = Math.sqrt(this.sim.ball.vx ** 2 + this.sim.ball.vy ** 2);
    const ballMoved =
      Math.sqrt(
        (this.sim.ball.x - this.lastBallX) ** 2 +
        (this.sim.ball.y - this.lastBallY) ** 2,
      ) > 0.5;

    if (ballSpeed < 0.1 && !ballMoved && this.sim.ball.ownerId === null) {
      this.ballStuckTicks++;

      // If ball stuck for 3+ seconds (180 ticks), reset it
      if (this.ballStuckTicks >= 180) {
        console.warn(
          `⚠️ BALL STUCK FOR 3 SECONDS at (${this.sim.ball.x.toFixed(1)}, ${this.sim.ball.y.toFixed(1)}). RESETTING.`,
        );

        // Determine which team throws in
        const isGoalBox =
          (this.sim.ball.x < 15 || this.sim.ball.x > 85) &&
          this.sim.ball.y > 35 &&
          this.sim.ball.y < 65;
        const isNearHome = this.sim.ball.x < 50;

        // Goal kick if in goal box, throw-in otherwise
        if (isGoalBox) {
          const throwTeam = isNearHome ? this.homeTeam.id : this.awayTeam.id;
          this.resetPositions(isNearHome ? "GOAL_KICK_HOME" : "GOAL_KICK_AWAY");
        } else {
          const throwTeam = isNearHome ? this.awayTeam.id : this.homeTeam.id;
          this.throwInPosition = { x: this.sim.ball.x, y: this.sim.ball.y };
          this.resetPositions(isNearHome ? "THROW_IN_AWAY" : "THROW_IN_HOME");
        }

        this.ballStuckTicks = 0;
        this.pendingEvents.push({
          minute: this.internalMinute,
          type: MatchEventType.THROW_IN,
          description: "⚠️ Ball Reset (Stuck Detection)",
        });
      }
    } else {
      this.ballStuckTicks = 0; // Reset counter if ball moves
    }

    this.lastBallX = this.sim.ball.x;
    this.lastBallY = this.sim.ball.y;

    const ballOwner = this.sim.ball.ownerId
      ? this.getPlayer(this.sim.ball.ownerId)
      : null;
    const owningTeamId = ballOwner ? ballOwner.teamId : null;

    // Clear stale signals when possession changes or ball is loose
    if (owningTeamId !== this.lastPossessingTeamId) {
      this.clearSignalsForTeam(this.lastPossessingTeamId);
      if (!owningTeamId) {
        this.clearSignalsForTeam(this.homeTeam.id);
        this.clearSignalsForTeam(this.awayTeam.id);
      }
      this.lastPossessingTeamId = owningTeamId;
    }

    // Possession Tracking
    if (owningTeamId) {
      if (owningTeamId === this.homeTeam.id) this.possessionTicks.home++;
      else this.possessionTicks.away++;

      const total = this.possessionTicks.home + this.possessionTicks.away;
      if (total > 0) {
        this.match.stats.homePossession = Math.round(
          (this.possessionTicks.home / total) * 100,
        );
        this.match.stats.awayPossession = 100 - this.match.stats.homePossession;
      }
    }

    if (ballOwner) {
      this.lastTouchTeamId = ballOwner.teamId;
    }

    const homeDefLine = this.calculateDefensiveLine(true);
    const awayDefLine = this.calculateDefensiveLine(false);
    // === OFSAYT: defLine'ları instance olarak sakla (actionPass'ta kullanılacak) ===
    this._homeDefLine = homeDefLine;
    this._awayDefLine = awayDefLine;

    // === PERFORMANCE: Use cached starter lists instead of repeated .filter() calls ===
    // Cache is rebuilt when invalidated (after substitutions) or on first tick
    if (!this._starterCacheValid) {
      this._cachedStarters = this.allPlayers.filter(
        (p) => p.lineup === "STARTING",
      );
      this._cachedHomeStarters = this.homePlayers.filter(
        (p) => p.lineup === "STARTING",
      );
      this._cachedAwayStarters = this.awayPlayers.filter(
        (p) => p.lineup === "STARTING",
      );
      this._starterCacheValid = true;
    }
    const allPlayers = this._cachedStarters;

    if (!ballOwner) {
      let bestChaserId: string | null = null;
      let minScore = 9999;

      allPlayers.forEach((p) => {
        if (!this.sim.players[p.id]) return;
        const state = this.playerStates[p.id];
        if (state.possessionCooldown > 0) return;

        // Tired players react slower to loose balls
        let staminaPenalty = 0;
        if (state.currentStamina < 40) staminaPenalty = 5.0;

        // PERFORMANCE: Use distSq for comparison (avoid sqrt)
        const dSq = distSq(
          this.sim.players[p.id].x,
          this.sim.players[p.id].y,
          this.sim.ball.x,
          this.sim.ball.y,
        );
        const d = Math.sqrt(dSq); // Only sqrt when we need actual distance for calculation
        let effectiveDist = d + staminaPenalty;
        if (p.id === this.currentLooseBallChaserId) effectiveDist -= 3.0;

        // Pass receiver priority: intended receiver gets big advantage so they
        // run TOWARD the ball rather than away from it (ucuncumotor port)
        const isPassTarget = (this.sim.ball as any).targetId === p.id;
        const hasReceiveIntent =
          this.playerStates[p.id]?.incomingSignal?.type === "INCOMING_PASS" &&
          (this.playerStates[p.id]?.incomingSignal?.expiryTick ?? 0) > this.tickCount;
        if (isPassTarget) {
          effectiveDist -= hasReceiveIntent ? 14.0 : 10.0;
        }

        if (effectiveDist < minScore) {
          minScore = effectiveDist;
          bestChaserId = p.id;
        }
      });
      this.currentLooseBallChaserId = bestChaserId;
    } else {
      this.currentLooseBallChaserId = null;
    }

    allPlayers.forEach((p) => {
      // SKIP RED CARDED PLAYERS (not in starting lineup)
      if (p.lineup !== "STARTING") return;

      // SAFETY: Auto-initialize player if missing from simulation (fixes freeze bug)
      if (!this.sim.players[p.id]) {
        const isHome = p.teamId === this.homeTeam.id;
        // baseOffsets artık direkt motor koordinatlarında (105x68)
        const base = this.baseOffsets[p.id] || {
          x: PITCH_CENTER_X,
          y: PITCH_CENTER_Y,
        };
        this.sim.players[p.id] = {
          x: isHome ? base.x : PITCH_LENGTH - base.x,
          y: isHome ? base.y : PITCH_WIDTH - base.y,
          facing: 0,
          vx: 0,
          vy: 0,
          state: "IDLE",
        };
      }
      if (!this.playerStates[p.id]) {
        const base = this.baseOffsets[p.id] || {
          x: PITCH_CENTER_X,
          y: PITCH_CENTER_Y,
        };
        // TEMPO INIT: Random start to desync players
        this.playerStates[p.id] = {
          currentStamina: p.condition || 100,
          decisionTimer: Math.random() * 20,
          possessionCooldown: 0,
          actionLock: 0,
          targetX: base.x,
          targetY: base.y,
          momentum: 0,
          isPressing: false,
        };
      }

      const isHome = p.teamId === this.homeTeam.id;
      const hasBall = p.id === this.sim.ball.ownerId;
      const state = this.playerStates[p.id];
      const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;

      if (state.possessionCooldown > 0) state.possessionCooldown--;
      if (state.actionLock > 0) state.actionLock--;

      if (state.actionLock > 0 && !hasBall) {
        const simP = this.sim.players[p.id];
        simP.vx *= 0.85;
        simP.vy *= 0.85;
        simP.x += simP.vx;
        simP.y += simP.vy;

        // Gravity even when locked
        if (simP.z && simP.z > 0) {
          simP.z -= 0.2;
          if (simP.z < 0) simP.z = 0;
        }
        return;
      }

      // Gravity for Jump (Player Z-axis physics)
      if (this.sim.players[p.id].z && this.sim.players[p.id].z! > 0) {
        this.sim.players[p.id].z! -= 0.2;
        if (this.sim.players[p.id].z! < 0) this.sim.players[p.id].z = 0;
      }

      if (hasBall) {
        this.updateBallCarrierAI(
          p,
          isHome,
          isHome ? awayDefLine : homeDefLine,
          isHome ? 100 : 0,
        );
        this.sim.players[p.id].state = "RUN";
        state.isPressing = false;

        // Trigger off-ball runs every ~60 ticks
        if (this.tickCount % 60 === 0) {
          this.triggerOffBallRuns(p.id, isHome);
        }
      } else {
        // Check if it's a set piece and player should hold position
        const isSetPiece =
          this.sim.mode === "KICKOFF" ||
          this.sim.mode?.includes("GOAL_KICK") ||
          this.sim.mode?.includes("CORNER") ||
          this.sim.mode?.includes("FREE_KICK") ||
          this.sim.mode?.includes("PENALTY") ||
          this.sim.mode?.includes("THROW_IN");
        if (isSetPiece && this.sim.ball.ownerId) {
          // If ball owner is on my team, hold position or move to base offset
          const ballOwnerTeam = this.getPlayer(this.sim.ball.ownerId)?.teamId;
          if (ballOwnerTeam === p.teamId) {
            const base = this.baseOffsets[p.id];
            if (base) {
              const targetX =
                p.teamId === this.homeTeam.id ? base.x : PITCH_LENGTH - base.x;
              const targetY =
                p.teamId === this.homeTeam.id ? base.y : PITCH_WIDTH - base.y;
              this.applySteeringBehavior(
                p,
                targetX,
                targetY,
                MAX_PLAYER_SPEED * 0.5,
              );
              this.sim.players[p.id].state = "IDLE";
            }
            return;
          } else {
            // RAKİP TAKIM: Set piecelerde top sahibine (kicker) doğru koşma. Olduğun yerde kal.
            this.sim.players[p.id].vx = 0;
            this.sim.players[p.id].vy = 0;
            this.sim.players[p.id].state = "IDLE";
            return;
          }
        }

        if (!ballOwner && p.id === this.currentLooseBallChaserId) {
          // === AKILLI SAHIPSİZ TOP KOVALAMASI (v2) ===
          const ballSpeed = Math.sqrt(
            this.sim.ball.vx ** 2 + this.sim.ball.vy ** 2,
          );
          const distToBall = dist(
            this.sim.players[p.id].x,
            this.sim.players[p.id].y,
            this.sim.ball.x,
            this.sim.ball.y,
          );

          const lookAhead =
            ballSpeed > 2.0
              ? Math.min(8, distToBall / ballSpeed)
              : ballSpeed > 1.0
                ? 4
                : 2;
          let interceptX = this.sim.ball.x + this.sim.ball.vx * lookAhead;
          const interceptY = this.sim.ball.y + this.sim.ball.vy * lookAhead;

          // === OFSAYT KONTROLÜ: Forvet sahipsiz topa koşarken ofsayda girmesin! ===
          if (this.playerRoles[p.id] === Position.FWD) {
            const fwdDefLine = isHome ? awayDefLine : homeDefLine;
            if (isHome) {
              interceptX = Math.min(interceptX, fwdDefLine - 2.0);
            } else {
              interceptX = Math.max(interceptX, fwdDefLine + 2.0);
            }
          }

          this.applySteeringBehavior(
            p,
            interceptX,
            interceptY,
            MAX_PLAYER_SPEED,
          );
          this.sim.players[p.id].state = "SPRINT";
          state.isPressing = true;
        } else if (this.playerRoles[p.id] === Position.GK) {
          this.updateGoalkeeperAI(p, isHome);
        } else {
          const effectivePossession = owningTeamId || this.lastTouchTeamId;
          this.updateOffBallAI(
            p,
            isHome,
            effectivePossession === p.teamId,
            owningTeamId !== null,
            isHome ? awayDefLine : homeDefLine,
            isHome ? 100 : 0,
          );
        }
      }
    });

    this.resolveCollisions();

    // === G MOTORU: PROAKTİF SİNYAL SİSTEMİ ===
    // Oyuncular her an çevrelerini tarar ve uygunsa sinyal verir
    this.updatePlayerSignals();
    this.clearExpiredSignals();

    event = this.checkGameEvents();

    // DEBUG: Log event from checkGameEvents
    if (DEBUG_MATCH && event) {
      console.log(
        `🔴 EVENT RETURNED: type=${event.type}, desc=${event.description}`,
      );
    }

    // Collect all pending events (subs, etc.) and clear
    const allEvents = [...this.pendingEvents];
    if (event) allEvents.push(event);
    this.pendingEvents = [];

    // === PRIORITY FIX: GOAL events must be returned first! ===
    // Sort so GOAL comes first, then FOUL/CARD, then others
    allEvents.sort((a, b) => {
      const priority = (e: MatchEvent) => {
        if (e.type === MatchEventType.GOAL) return 0;
        if (e.type === MatchEventType.CARD_RED) return 1;
        if (e.type === MatchEventType.CARD_YELLOW) return 2;
        if (e.type === MatchEventType.FOUL) return 3;
        if (e.type === MatchEventType.FREE_KICK) return 4;
        if (e.type === MatchEventType.CORNER) return 5;
        if (e.type === MatchEventType.KICKOFF) return 10; // Low priority
        return 6;
      };
      return priority(a) - priority(b);
    });

    // DEBUG: Sadece önemli olayları logla (GOAL, CARD)
    // Removed console.log for production performance

    // === PERFORMANCE CRITICAL FIX ===
    // REMOVED: JSON.parse(JSON.stringify(this.sim)) - was killing mobile performance!
    // The deep clone was executing 60-83 times per second (depending on speed setting)
    // causing massive GC pressure and CPU thrashing.
    //
    // NEW: Inject stamina directly into sim.players. This is safe because:
    // 1. UI only READS simulation data, never modifies it
    // 2. Stamina values are recalculated every tick anyway
    // 3. This eliminates ~95% of per-tick memory allocation
    Object.keys(this.playerStates).forEach((id) => {
      if (this.sim.players[id]) {
        (this.sim.players[id] as any).stamina =
          this.playerStates[id].currentStamina;
        (this.sim.players[id] as any).outgoingSignal =
          this.playerStates[id].outgoingSignal;
      }
    });

    return {
      minuteIncrement: this.tickCount === 0,
      event: allEvents.length > 0 ? allEvents[0] : null, // Primary event (GOAL now takes priority!)
      additionalEvents: allEvents.length > 1 ? allEvents.slice(1) : [], // Other events (subs, kickoff)
      trace: this.traceLog,
      liveData: {
        ballHolderId: this.sim.ball.ownerId,
        pitchZone: this.sim.ball.x,
        lastActionText: this.getActionText(owningTeamId),
        simulation: this.sim, // Direct reference - no cloning!
      },
      stats: { ...this.match.stats },
    };
  }

  private calculateDefensiveLine(isHome: boolean): number {
    const teamPlayers = isHome ? this.homePlayers : this.awayPlayers;
    // === OFSAYT HATTI FIX: KALECİ HARİÇ! ===
    // Gerçek futbolda ofsayt, son 2 SAHA oyuncusuna (kaleci hariç) göre belirlenir.
    // Eski kod kaleci dahil ediyordu → hat yanlış hesaplanıyordu.
    const outfieldPositionsX = teamPlayers
      .filter(
        (p) => this.sim.players[p.id] && this.playerRoles[p.id] !== Position.GK,
      )
      .map((p) => this.sim.players[p.id].x);

    if (outfieldPositionsX.length < 2) {
      return isHome ? 10 : 90;
    }

    if (isHome) {
      outfieldPositionsX.sort((a, b) => a - b);
      // İlk değer = en geri saha oyuncusu (genelde stoper)
      // İkinci değer = ikinci en geri saha oyuncusu → OFSAYT HATTI
      return outfieldPositionsX[1];
    } else {
      outfieldPositionsX.sort((a, b) => b - a);
      return outfieldPositionsX[1];
    }
  }

  private updateBallPhysics() {
    if (this.sim.ball.ownerId) return;

    const b = this.sim.ball;
    const friction = b.z > 0.5 ? BALL_AIR_DRAG : BALL_FRICTION;

    if (b.curve && Math.abs(b.curve) > 0.01 && b.z > 0) {
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      // KAVİS GÜCÜ ARTIRILDI (0.005 -> 0.012) - Roberto Carlos Etkisi
      const curveForce = b.curve * speed * 0.012;
      const angle = Math.atan2(b.vy, b.vx);
      b.vx += Math.cos(angle + Math.PI / 2) * curveForce;
      b.vy += Math.sin(angle + Math.PI / 2) * curveForce;
      // SÖNÜMLENME AZALTILDI (0.95 -> 0.985) - Kavis sonuna kadar devam etsin
      b.curve *= 0.985;
    }

    b.vx *= friction;
    b.vy *= friction;
    b.x += b.vx;
    b.y += b.vy;

    if (b.z > 0 || b.vz > 0) {
      b.vz -= GRAVITY;
      b.z += b.vz;
      if (b.z < 0) {
        // === GELİŞTİRİLMİŞ TOP ZIPLAYIŞI ===
        b.z = 0;
        b.vz = -b.vz * BALL_BOUNCE; // Sabit zıplama katsayısı kullan

        // Çok düşük zıplama varsa durdur
        if (Math.abs(b.vz) < 0.3) b.vz = 0;

        // Yere değince sürtünme
        b.vx *= 0.85;
        b.vy *= 0.85;
      }
    }

    if (b.z === 0 && Math.abs(b.vx) < 0.02 && Math.abs(b.vy) < 0.02) {
      b.vx = 0;
      b.vy = 0;
    }
    b.y = clamp(b.y, 0.5, PITCH_WIDTH - 0.5);

    // ========== GOALKEEPER SAVE MECHANIC (PANTHER MODE v2) ==========
    const ballSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const isShotOnGoal = ballSpeed > 1.2; // Biraz daha yavaş topları da şut saysın

    if (isShotOnGoal) {
      // Check if ball is heading towards a goal
      const headingToLeftGoal = b.vx < -0.5 && b.x < 26; // Ceza sahası + birkaç metre
      const headingToRightGoal = b.vx > 0.5 && b.x > 79; // 105-26 = 79

      if (headingToLeftGoal || headingToRightGoal) {
        const defendingTeam = headingToLeftGoal
          ? this.homePlayers
          : this.awayPlayers;
        const gk = defendingTeam.find(
          (p) => this.playerRoles[p.id] === Position.GK,
        );

        if (gk && this.sim.players[gk.id]) {
          const gkPos = this.sim.players[gk.id];
          const distToGK = dist(b.x, b.y, gkPos.x, gkPos.y);

          // === KALECİ YORGUNLUK SİSTEMİ ===
          const gkState = this.playerStates[gk.id];
          const gkFatigueMods = getAllFatigueModifiers(
            gkState?.currentStamina || 100,
            true,
          );

          // Kaleci statlarını "Floor" ile yukarı çekiyoruz (Kumbara olmasınlar diye)
          // Floor: 55 → 50 (eski txt versiyonu — orta kaleciler biraz daha zayıf)
          const effectiveGKing =
            applyStatFloor(gk.attributes.goalkeeping, 50) *
            gkFatigueMods.goalkeeping;
          const effectiveReflexes =
            applyStatFloor(gk.attributes.goalkeeping, 50) * 0.74 +
            applyStatFloor(gk.attributes.composure, 45) * 0.26;
          const effectivePositioning =
            applyStatFloor(gk.attributes.positioning, 45) *
            gkFatigueMods.positioning;

          // === ERİŞİM MESAFESİ (REACH - REBALANCE) ===
          // BUG FIX: `distToGK` topun anlık mesafesiydi → lastShooterId kullanıyoruz
          let shotDistance = distToGK;
          if (this.lastShooterId && this.sim.players[this.lastShooterId]) {
            const shooterPos = this.sim.players[this.lastShooterId];
            shotDistance = dist(shooterPos.x, shooterPos.y, gkPos.x, gkPos.y);
          }

          const isCloseRange = shotDistance < 14;

          let gkReachBase = 3.8; // 4.0 → 3.8 (daha gerçekçi)
          if (isCloseRange) gkReachBase = 2.8; // 3.0 → 2.8

          // === 1v1 NERF: Kaleci direkt karşı karşıya geldiğinde ===
          let is1v1Shot = false;
          if (isCloseRange) {
            const ballOwnerBefore = this.lastTouchTeamId;
            const isAttackOnThisGoal = headingToLeftGoal
              ? ballOwnerBefore !== this.homeTeam.id
              : ballOwnerBefore !== this.awayTeam.id;
            if (isAttackOnThisGoal) {
              is1v1Shot = true;
              gkReachBase -= 1.0; // 0.8 → 1.0
            }
          }

          // Kaleci hızı erişimi artırır
          const speedBonus = (gk.attributes.speed || 50) / 100;

          // Refleks Hesaplaması: Top hızına yetişebilir mi?
          const speedFactor = ballSpeed * 1.3; // 1.2 → 1.3
          const reactionDeficit = Math.max(
            0,
            speedFactor - effectiveReflexes / 7.5, // 7 → 7.5
          );
          const reflexPenalty = reactionDeficit * 0.38; // 0.3 → 0.38

          const gkReach = Math.max(
            2.35, // 2.5 → 2.35
            gkReachBase + effectiveGKing / 68 - reflexPenalty + speedBonus * 0.9, // /60→/68, *0.9
          );

          // Top kalecinin erişim alanındaysa ve çok yüksek değilse (aşırtma hariç)
          if (distToGK < gkReach && b.z < 3.0) {
            // === KURTARIŞ ŞANSI HESABI (v7 - REBALANCE) ===
            // baseSaveChance +15 çok güçlüydü → +7, stat katsayısı 0.78 → 0.62
            const speedPenalty = ballSpeed * (isCloseRange ? 11.5 : 9.5);
            const heightBonus = b.z > 0 ? -12 : 0;
            const distanceBonus = (gkReach - distToGK) * 5; // 6 → 5

            const positioningBonus = (effectivePositioning - 50) / 7; // /6 → /7

            // BASE CHANCE: Temel kurtarış şansı
            let baseSaveChance = 7; // 15 → 7

            // === 1v1 NERF ===
            if (is1v1Shot) {
              baseSaveChance -= 24; // 20 → 24

              // Elit kaleciler 1v1'de tamamen çaresiz kalmasın
              const eliteKeeperIndex =
                effectiveGKing + effectiveReflexes + effectivePositioning;
              if (eliteKeeperIndex > 240) baseSaveChance += 6;
              else if (eliteKeeperIndex > 210) baseSaveChance += 3;
            }

            // PlayStyles (Özel Yetenekler) Etkisi
            if (gk.playStyles?.includes("Kedi Refleks")) {
              baseSaveChance += 8; // 12 → 8
            }
            if (gk.playStyles?.includes("Kedi Refleks") && isCloseRange) {
              baseSaveChance += 8; // 15 → 8
            }

            // Stat katsayısı: 0.78 → 0.62
            let saveChance =
              baseSaveChance +
              effectiveGKing * 0.62 +
              distanceBonus +
              heightBonus +
              positioningBonus -
              speedPenalty;

            // === CLAMP: Sınırsız yükselemez ===
            saveChance = Math.max(
              is1v1Shot ? 4 : 8,
              Math.min(isCloseRange ? 74 : 82, saveChance),
            );

            // Şans faktörü (Zar atıyoruz)
            const saveRoll = Math.random() * 100;

            if (saveRoll < saveChance) {
              // === KURTARIŞ BAŞARILI! ===

              // Topu tutacak mı yoksa çelecek mi?
              const catchRoll = Math.random();
              const catchThreshold = 0.4 * gkFatigueMods.composure; // %40 şansla tutar (nerf: daha çok sektirme)

              if (catchRoll < catchThreshold && ballSpeed < 3.5) {
                // YAPIŞTIRDI (Catch)
                this.sim.ball.ownerId = gk.id;
                this.sim.ball.vx = 0;
                this.sim.ball.vy = 0;
                this.sim.ball.vz = 0;
                this.sim.ball.z = 0;
                this.lastTouchTeamId = gk.teamId;
                this.traceLog.push(`🧤 ${gk.lastName} topu kontrolüne aldı!`);
              } else {
                // ÇELDİ (Parry/Deflect)
                // Topu rastgele ama kaleden uzağa sektir
                const deflectAngle =
                  Math.atan2(b.vy, b.vx) + (Math.random() > 0.5 ? 1.5 : -1.5); // 90 derece yana
                let deflectPower = ballSpeed * (0.3 + Math.random() * 0.2); // NERF: Daha az sekme
                // PENALTI FIX: Kurtarışta top karşı kaleye gitmesin!
                deflectPower = Math.min(deflectPower, 1.5); // Maksimum 1.5 birim hız

                b.vx = Math.cos(deflectAngle) * deflectPower;
                b.vy = Math.sin(deflectAngle) * deflectPower;
                b.vz = 1.0 + Math.random() * 0.5; // Daha az havaya (1.5-2.5 → 1.0-1.5)

                this.playerStates[gk.id].possessionCooldown = 10; // Çabuk toparlan
                this.lastTouchTeamId = gk.teamId;
                this.traceLog.push(`🧤 ${gk.lastName} son anda çeldi!`);
              }

              // İstatistik Güncelle
              if (headingToLeftGoal)
                this.match.stats.homeSaves =
                  (this.match.stats.homeSaves || 0) + 1;
              else
                this.match.stats.awaySaves =
                  (this.match.stats.awaySaves || 0) + 1;

              return; // Gol iptal, döngüden çık
            }
          }
        }
      }
    }
    // ========== END GOALKEEPER SAVE MECHANIC ==========

    // Hava topları için yakalama - yükseklik ve mesafe sınırlandı
    const maxPickupHeight = 4.0; // 15 → 4 (oyuncu zıplama yüksekliği)
    if (b.z < maxPickupHeight) {
      let closestP: Player | null = null;

      // Yakalama mesafesi hesaplama
      const ballSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      // Yavaş toplar daha kolay yakalanır (daha geniş mesafe)
      const speedBonus = Math.max(0, (2.0 - ballSpeed) * 0.5); // Yavaş top → +1.0 mesafe
      const basePickupDist = b.z < 0.5 ? 3.0 : 2.5; // Yerdeki top için daha geniş
      const heightPenalty = b.z * 0.3; // Yükseldikçe yakalama zorlaşır
      let minD = Math.max(1.2, basePickupDist + speedBonus - heightPenalty);

      // === HAVA TOPU MÜCADELESİ (Korner/Orta) ===
      // Eğer top havada ve birden fazla oyuncu yakınsa, düello yap!
      const nearbyPlayers: {
        player: Player;
        dist: number;
        jumpPower: number;
      }[] = [];

      [...this.homePlayers, ...this.awayPlayers].forEach((p) => {
        if (
          !this.playerStates[p.id] ||
          this.playerStates[p.id].possessionCooldown > 0 ||
          !this.sim.players[p.id]
        )
          return;
        if (p.lineup !== "STARTING") return;

        const pPos = this.sim.players[p.id];
        const d = dist(pPos.x, pPos.y, b.x, b.y);

        // Hava topuna koşma davranışı - top havada ve yakınsa topa koş!
        if (b.z > 1.0 && d < 12 && d > 3) {
          // Topun düşeceği yere koş
          const landingX = b.x + b.vx * 5;
          const landingY = b.y + b.vy * 5;

          // Sadece kendi bölgesine yakınsa koş (herkes koşmasın)
          const isInMyZone =
            Math.abs(pPos.x - landingX) < 20 &&
            Math.abs(pPos.y - landingY) < 20;

          if (isInMyZone) {
            const state = this.playerStates[p.id];
            state.targetX = landingX;
            state.targetY = landingY;
          }
        }

        if (d < minD + 2) {
          // Biraz daha geniş alanda rakip kontrolü
          // Kafa gücü hesapla (BUFF: STRENGTH IMPACT INCREASED)
          // Old: Strength * 0.4 -> New: Strength * 0.7 + Positioning * 0.4
          let jumpPower =
            (p.attributes.strength || 50) * 0.7 +
            (p.attributes.positioning || 50) * 0.4;

          // Hava Hakimi yeteneği
          if (p.playStyles?.includes("Hava Hakimi")) {
            jumpPower += 40;
          }
          if (p.playStyles?.includes("Hava Hakimi")) {
            jumpPower += 25;
          }

          nearbyPlayers.push({ player: p, dist: d, jumpPower });
        }

        if (d < minD) {
          minD = d;
          closestP = p;
        }
      });

      // Eğer 2+ oyuncu varsa ve top yeterince yüksekte, kafa düellosu!
      if (nearbyPlayers.length >= 2 && b.z > 1.5) {
        // En yüksek jump power'a sahip oyuncu kazanır (mesafe de etkili)
        nearbyPlayers.sort((a, b2) => {
          const scoreA = a.jumpPower - a.dist * 8;
          const scoreB = b2.jumpPower - b2.dist * 8;
          return scoreB - scoreA;
        });

        const winner = nearbyPlayers[0];
        const loser = nearbyPlayers[1];

        // Düello animasyonu - her iki oyuncu da zıpla
        if (this.sim.players[winner.player.id]) {
          this.sim.players[winner.player.id].z = Math.min(b.z, 2.5);
        }
        if (this.sim.players[loser.player.id]) {
          this.sim.players[loser.player.id].z = Math.min(b.z * 0.8, 2.0);
        }

        // Kazanan topu alır
        if (winner.dist < minD + 1) {
          closestP = winner.player;
        }
      }

      if (closestP) {
        const p = closestP as Player;
        const ballSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        let technique = p.attributes.dribbling || 50;

        // === YETENEK ETKİSİ: İLK DOKUNUŞ ===
        // "İlk Dokunuş" yeteneği: Zor pasları %30 daha kolay kontrol
        if (p.playStyles?.includes("İlk Dokunuş")) {
          technique += 25;
        }

        // === YETENEK ETKİSİ: TEKNİK ===
        // "İlk Dokunuş" yeteneği: Genel top kontrolü %15 artar
        if (p.playStyles?.includes("İlk Dokunuş")) {
          technique += 15;
        }

        // Hava topları için strength etkisi - güçlü oyuncular daha iyi kafa vuruyor
        let strengthBonus = b.z > 1 ? (p.attributes.strength || 50) * 0.3 : 0;

        // === YETENEK ETKİSİ: HAVA HAKİMİ ===
        // "Hava Hakimi" yeteneği: Kafa vuruşları ve hava toplarında %40 bonus
        if (b.z > 0.5 && p.playStyles?.includes("Hava Hakimi")) {
          strengthBonus += 35;
        }

        // === YETENEK ETKİSİ: HASSAS KAFA VURUŞU ===
        // "Hava Hakimi" yeteneği: Hava toplarında isabet %25 bonus
        if (b.z > 0.5 && p.playStyles?.includes("Hava Hakimi")) {
          strengthBonus += 20;
        }

        const heightDifficulty = b.z > 1 ? 25 : 0;
        // === TOP ALMA ZORLUĞU (AĞIRLAŞTIRILDI) ===
        let difficulty = ballSpeed * 12 + heightDifficulty;
        // Şut gibi çok sert topları kontrol etmek imkansıza yakın olmalı
        if (ballSpeed > 2.5) {
          difficulty = ballSpeed * 35 + heightDifficulty;
        }

        // Strength hava topu kontrolünü etkiler
        if (Math.random() * 110 + technique + strengthBonus > difficulty) {
          // === OFSAYT KONTROLÜ: TOP ALMA ANINDA ===
          // Pas veya şut sonrası sahipsiz topa değen oyuncu ofsaytta mı?
          const pPos = this.sim.players[p.id];
          const isPlayerHome = p.teamId === this.homeTeam.id;
          const wasOwnTeamTouch = this.lastTouchTeamId === p.teamId;
          const playerRole = this.playerRoles[p.id];
          let offsideCaught = false;

          // Sadece kendi takımdan gelen top + ileri oyuncular kontrol edilsin
          // (Rakip topunu çalan oyuncu ofsayt olmaz!)
          if (
            wasOwnTeamTouch &&
            playerRole !== Position.GK &&
            playerRole !== Position.DEF &&
            pPos
          ) {
            const defLine = isPlayerHome
              ? this._awayDefLine
              : this._homeDefLine;
            if (defLine !== undefined) {
              const isOffside = isPlayerHome
                ? pPos.x > defLine + 1.5 // 1.5m tolerans
                : pPos.x < defLine - 1.5;

              if (isOffside) {
                // OFSAYT! Top alma iptal
                this.sim.ball.ownerId = null;
                this.sim.ball.vx = 0;
                this.sim.ball.vy = 0;
                this.sim.ball.vz = 0;
                this.sim.ball.x = pPos.x;
                this.sim.ball.y = pPos.y;
                this.traceLog.push(
                  `🚩 OFSAYT! ${p.lastName} sahipsiz topu ofsayt pozisyonda aldı!`,
                );
                this.pendingEvents.push({
                  minute: this.internalMinute,
                  type: MatchEventType.OFFSIDE,
                  description: `🚩 ${p.lastName} offside! Free kick.`,
                  teamId: p.teamId,
                  playerId: p.id,
                });
                // Rakip takıma ver
                const enemyTeamPlayers = isPlayerHome
                  ? this.awayPlayers
                  : this.homePlayers;
                const nearestEnemy = enemyTeamPlayers
                  .filter(
                    (ep) =>
                      ep.lineup === "STARTING" &&
                      this.playerRoles[ep.id] === Position.DEF,
                  )
                  .sort(
                    (a2, b2) =>
                      dist(
                        this.sim.players[a2.id]?.x || 0,
                        this.sim.players[a2.id]?.y || 0,
                        pPos.x,
                        pPos.y,
                      ) -
                      dist(
                        this.sim.players[b2.id]?.x || 0,
                        this.sim.players[b2.id]?.y || 0,
                        pPos.x,
                        pPos.y,
                      ),
                  )[0];
                if (nearestEnemy) {
                  this.sim.ball.ownerId = nearestEnemy.id;
                }
                this.playerStates[p.id].possessionCooldown = 20;
                offsideCaught = true;
              }
            }
          }

          if (!offsideCaught) {
            this.sim.ball.ownerId = p.id;
            (this.sim.ball as any).targetId = null; // Hedef artık ulaştı, temizle
            this.sim.ball.vx = 0;
            this.sim.ball.vy = 0;
            this.sim.ball.z = 0;
            this.sim.ball.curve = 0;
            this.lastTouchTeamId = p.teamId;

            // Visual Jump Effect
            if (b.z > 0.5) {
              this.sim.players[p.id].z = Math.min(b.z, 2.0); // Jump to ball height
            }
          }
        } else {
          b.vx *= 0.6;
          b.vy *= 0.6;
          this.playerStates[p.id].possessionCooldown = 8;
          this.lastTouchTeamId = p.teamId;
        }
      }
    }
  }

  private updateGoalkeeperAI(p: Player, isHome: boolean) {
    if (!this.sim.players[p.id]) return;
    const simP = this.sim.players[p.id];
    const goalX = isHome ? 0 : PITCH_LENGTH;
    const goalY = PITCH_CENTER_Y;
    const ballX = this.sim.ball.x;
    const ballY = this.sim.ball.y;
    const distToBall = dist(simP.x, simP.y, ballX, ballY);
    const isBallLoose = this.sim.ball.ownerId === null;
    const ballCarrierId = this.sim.ball.ownerId;

    // === 1V1 DURUMU TESPİTİ ===
    // Top taşıyan rakip kaleye yakın ve tek başınaysa
    let is1v1Situation = false;
    if (ballCarrierId) {
      const carrier = this.getPlayer(ballCarrierId);
      if (carrier && carrier.teamId !== p.teamId) {
        const carrierPos = this.sim.players[ballCarrierId];
        if (carrierPos) {
          const carrierDistToGoal = isHome
            ? carrierPos.x
            : PITCH_LENGTH - carrierPos.x;
          // Kaleciye çok yaklaştıysa ve savunmacı yoksa çık
          if (carrierDistToGoal < 21) {
            // Arada savunmacı var mı kontrol et
            const myTeam = isHome ? this.homePlayers : this.awayPlayers;
            const defendersInPath = myTeam.filter((def) => {
              if (def.id === p.id) return false; // Kaleci hariç
              const defPos = this.sim.players[def.id];
              if (!defPos) return false;
              // Savunmacı top taşıyan ile kale arasında mı?
              const defDistToGoal = isHome ? defPos.x : PITCH_LENGTH - defPos.x;
              return (
                defDistToGoal < carrierDistToGoal &&
                dist(defPos.x, defPos.y, carrierPos.x, carrierPos.y) < 10
              );
            });

            is1v1Situation = defendersInPath.length === 0;
          }
        }
      }
    }

    // === ORTA/CROSS TESPİTİ ===
    // Top kanattan geliyor ve ceza sahasına doğru mu?
    const isCrossIncoming =
      !isBallLoose &&
      (ballY < 17 || ballY > 51) && // Kanat (68m genişlikte)
      ((isHome && ballX < 37) || (!isHome && ballX > 68)) && // Ceza sahası yakını
      Math.abs(this.sim.ball.vy) > 0.5; // Top içeri doğru hareket ediyor

    // === SAHİPSİZ TOP - ÇIKIŞ ===
    if (
      isBallLoose &&
      distToBall < 25 &&
      ((isHome && ballX < 32) || (!isHome && ballX > 73))
    ) {
      const ballSpeed = Math.sqrt(
        this.sim.ball.vx ** 2 + this.sim.ball.vy ** 2,
      );
      if (ballSpeed > 0.5 || distToBall < 10) {
        this.applySteeringBehavior(
          p,
          ballX + this.sim.ball.vx * 2,
          ballY + this.sim.ball.vy * 2,
          MAX_PLAYER_SPEED,
        );
        simP.state = "SPRINT";
        return;
      }
    }

    // === 1V1 POZİSYON ALMA ===
    if (is1v1Situation && ballCarrierId) {
      const carrierPos = this.sim.players[ballCarrierId];
      if (carrierPos) {
        // Kaleci hücumcuya doğru çıksın, açıyı kapatsın
        const rushDist = Math.min(8.5, distToBall * 0.28);
        const angleToCarrier = Math.atan2(
          carrierPos.y - simP.y,
          carrierPos.x - simP.x,
        );

        let targetX = simP.x + Math.cos(angleToCarrier) * rushDist;
        let targetY = simP.y + Math.sin(angleToCarrier) * rushDist * 0.65;

        // Çizgiden fazla uzaklaşma
        targetX = isHome
          ? clamp(targetX, 0, 10.5)
          : clamp(targetX, PITCH_LENGTH - 10.5, PITCH_LENGTH);
        targetY = clamp(targetY, GOAL_Y_TOP - 3.5, GOAL_Y_BOTTOM + 3.5);

        // "Ortaya Çıkan" yeteneği: Daha agresif çıkış
        if (p.playStyles?.includes("Ortaya Çıkan")) {
          targetX = isHome
            ? clamp(targetX, 0, 14)
            : clamp(targetX, PITCH_LENGTH - 14, PITCH_LENGTH);
        }

        this.applySteeringBehavior(
          p,
          targetX,
          targetY,
          MAX_PLAYER_SPEED * 0.85,
        );
        simP.facing = angleToCarrier;
        simP.state = "RUN";
        return;
      }
    }

    // === ORTA POZİSYONU ===
    if (isCrossIncoming && this.sim.ball.z > 0.5) {
      // Topun düşeceği yere doğru hareket et
      const predictedY = ballY + this.sim.ball.vy * 5;
      const predictedX = ballX + this.sim.ball.vx * 5;

      // Sadece ceza sahası içinde hareket et
      const maxOutX = isHome ? 8 : PITCH_LENGTH - 8;
      let targetX = isHome
        ? Math.min(predictedX, maxOutX)
        : Math.max(predictedX - 2, PITCH_LENGTH - 12);
      let targetY = clamp(predictedY, GOAL_Y_TOP - 2, GOAL_Y_BOTTOM + 2); // Kale genişliği civarında kal

      // "Ortaya Çıkan" yeteneği: Cross'lara daha iyi müdahale
      if (p.playStyles?.includes("Ortaya Çıkan")) {
        targetX = isHome
          ? Math.min(predictedX + 2, 12)
          : Math.max(predictedX - 2, PITCH_LENGTH - 12);
      }

      this.applySteeringBehavior(p, targetX, targetY, MAX_PLAYER_SPEED * 0.8);
      simP.state = "RUN";
      return;
    }

    // === NORMAL POZİSYON ALMA ===
    const angleToBall = Math.atan2(ballY - goalY, ballX - goalX);
    let idealDistFromLine = 2;
    if (distToBall < 30 && distToBall > 10) idealDistFromLine = 5;
    if (distToBall <= 10) idealDistFromLine = 3;

    let targetX = goalX + Math.cos(angleToBall) * idealDistFromLine;
    let targetY = goalY + Math.sin(angleToBall) * idealDistFromLine;

    let clampedX = isHome
      ? clamp(targetX, 0, PENALTY_BOX_DEPTH)
      : clamp(targetX, PITCH_LENGTH - PENALTY_BOX_DEPTH, PITCH_LENGTH);

    this.applySteeringBehavior(p, clampedX, targetY, MAX_PLAYER_SPEED * 0.7);
    simP.facing = angleToBall;
    simP.state = "IDLE";
  }

  // === G MOTORU: GÖRÜŞ AÇISI HESAPLAMA (GÜNCELLENMİŞ) ===
  private calculateShotOpening(
    x: number,
    y: number,
    targetX: number,
    isHome: boolean,
  ): number {
    const dx = targetX - x;
    const dy = PITCH_CENTER_Y - y;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    // Hedefe giden vektör
    const angleToTarget = Math.atan2(dy, dx);

    // Tarama konisi (45 derece)
    const coneWidth = Math.PI / 4;

    let blockage = 0;
    const enemies = isHome ? this.awayPlayers : this.homePlayers;

    // Önümdeki rakiplere bak
    for (const e of enemies) {
      const ePos = this.sim.players[e.id];
      if (!ePos) continue;

      const d = dist(x, y, ePos.x, ePos.y);
      if (d > 25) continue; // Çok uzaktakiler önemli değil

      const angleToE = Math.atan2(ePos.y - y, ePos.x - x);
      const angleDiff = Math.abs(angleToE - angleToTarget);

      // Eğer rakip hedef açımın içindeyse
      if (angleDiff < coneWidth / 2) {
        // Yakınlık cezası: Ne kadar yakınsa o kadar bloklar
        const proximityPenalty = 1.0 - d / 25; // 0m=1.0, 25m=0.0
        blockage += proximityPenalty;
      }
    }

    // Açıklık skoru (0 ile 1 arası)
    return Math.max(0, 1.0 - blockage);
  }

  private updateBallCarrierAI(
    p: Player,
    isHome: boolean,
    offsideLineX: number,
    goalX: number,
  ) {
    if (!this.sim.players[p.id]) return;
    const simP = this.sim.players[p.id];
    const state = this.playerStates[p.id];
    const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;

    // === MERKEZİ YORGUNLUK ETKİSİ ===
    const technicalMod = getFatigueModifier(state.currentStamina, "technical");
    const mentalMod = getFatigueModifier(state.currentStamina, "mental");

    const dribbleSkill = (p.attributes.dribbling || 50) * technicalMod;
    let closeControl = 1.0 + (100 - dribbleSkill) / 100;
    // Yorgunluk top kontrolünü zorlaştırır
    closeControl *= 2 - technicalMod; // technicalMod 1.0 → 1.0x, 0.6 → 1.4x zorluk

    this.sim.ball.x = simP.x + Math.cos(simP.facing) * closeControl;
    this.sim.ball.y = simP.y + Math.sin(simP.facing) * closeControl;

    // === PENALTY KICK EXECUTION ===
    // Force shoot if in penalty mode
    if (this.sim.mode === "PENALTY_HOME" || this.sim.mode === "PENALTY_AWAY") {
      state.decisionTimer++;
      // Wait 1 second (20 ticks) before shooting
      if (state.decisionTimer > 20) {
        this.actionShoot(p, isHome);
        this.sim.mode = undefined; // Reset mode to normal play (allows rebounds etc)

        // === PENALTI SONRASI: Tüm oyuncuları serbest bırak! ===
        // Aksi halde D-arc'ta donup kalıyorlar
        const allPlayersArr = [...this.homePlayers, ...this.awayPlayers];
        for (const pp of allPlayersArr) {
          if (pp.lineup === "STARTING" && this.playerStates[pp.id]) {
            this.playerStates[pp.id].actionLock = 0;
          }
        }
      }
      return;
    }

    // --- GOALKEEPER AI (Clearance) ---
    if (this.playerRoles[p.id] === Position.GK) {
      const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
      // GK prefers safe ground passing if available (high score)
      if (bestPass && bestPass.score > 20) {
        this.actionPass(
          p,
          bestPass.player,
          bestPass.type,
          bestPass.targetX,
          bestPass.targetY,
        );
      } else {
        // Clear the ball
        this.sim.ball.ownerId = null;
        this.sim.mode = undefined; // YENİ: Set piece sonrası oyun normale döner
        const clearAngle = isHome ? 0 : Math.PI;
        const power = 3.5 + Math.random();
        this.sim.ball.vx = Math.cos(clearAngle) * power;
        this.sim.ball.vy = Math.sin(clearAngle) * power;
        this.sim.ball.vz = 2.5;
        this.playerStates[p.id].possessionCooldown = 25;
      }
      return;
    }

    // --- SET PIECE EXCLUSIVE AI RULES ---

    // 1. FREE KICK AI (Taktiklere bağlı kalmayan ayrılmış şut kuralı)
    const isRealFreeKickMode =
      this.sim.mode === "FREE_KICK_HOME" ||
      this.sim.mode === "FREE_KICK_AWAY";

    if (isRealFreeKickMode) {
      const distToGoal = dist(simP.x, simP.y, goalX, PITCH_CENTER_Y);
      const finishingSkill = p.attributes.finishing || 50;
      let fkShootSkill = finishingSkill;
      if (p.playStyles?.includes("Ölü Top Uzmanı")) fkShootSkill += 25;
      if (p.playStyles?.includes("Plase Şut")) fkShootSkill += 15;

      let shouldShoot = false;
      if (distToGoal < 24) shouldShoot = true; // Yakın mesafe affetmez
      else if (distToGoal < 32 && fkShootSkill > 65) shouldShoot = true; // Orta mesafe şutörler
      else if (distToGoal < 40 && fkShootSkill > 85) shouldShoot = true; // Roberto Carlos bölgesi

      // %10 İhtimalle takımın yeteneksiz forveti de olsa dener
      if (!shouldShoot && distToGoal < 30 && Math.random() < 0.1) shouldShoot = true;

      // Şut çekecekse diğer bütün taktik emirleri yok sayarak direkt eylemi tetikle
      if (shouldShoot) {
        this.actionShoot(p, isHome);
        this.sim.mode = undefined; // Set Piece biter

        if (this.playerStates[p.id]) {
          this.playerStates[p.id].decisionTimer = -10;
          this.playerStates[p.id].possessionCooldown = 45;
        }
        return; // DÖNGÜDEN ÇIK, PAS YA DA DRİBBLİNG DÜŞÜNME!
      }
      // Vurmayacak kadar uzaksa normal seyrine devam eder ve pas arar (aşağıdaki logic)
    }

    // 2. CORNER KICK AI
    // Köşe vuruşu pozisyonu: Saha köşeleri (0,0), (0,68), (105,0), (105,68)
    const isCorner =
      (isHome ? simP.x > PITCH_LENGTH - 5 : simP.x < 5) &&
      (simP.y < 5 || simP.y > PITCH_WIDTH - 5);

    if (isCorner) {
      // OLİMPİKO GOL İHTİMALİ (Tarihi Rüya - Kornerden Gol Denemesi)
      const hasDeadBall = p.playStyles?.includes("Ölü Top Uzmanı");
      const olympicoChance = hasDeadBall ? 0.04 : 0.0; // Sadece korner spesiyalistleri dener
      if (Math.random() < olympicoChance) {
        this.traceLog.push(`🌟 İNANILMAZ! ${p.lastName} KORNERDEN DİREKT KALEYE VURUYOR! (Olimpiko)`);
        this.actionShoot(p, isHome);
        this.sim.mode = undefined; // Motor normale döner
        if (this.playerStates[p.id]) {
          this.playerStates[p.id].decisionTimer = -10;
          this.playerStates[p.id].possessionCooldown = 45;
        }
        return;
      }

      let bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);

      if (!bestPass) {
        const teammates = isHome ? this.homePlayers : this.awayPlayers;
        const target =
          teammates.find(
            (tm) =>
              tm.id !== p.id &&
              this.sim.players[tm.id] &&
              this.playerRoles[tm.id] === Position.FWD,
          ) ||
          teammates.find((tm) => tm.id !== p.id && this.sim.players[tm.id]);
        if (target) {
          bestPass = {
            player: target,
            score: 50,
            type: "AERIAL",
            targetX: this.sim.players[target.id].x,
            targetY: this.sim.players[target.id].y,
          };
        }
      }

      if (bestPass) {
        // Corners are usually Aerial unless short option is insanely great (cutback etc)
        const type =
          bestPass.score > 250 && bestPass.type === "GROUND"
            ? "GROUND"
            : "AERIAL";
        this.actionPass(
          p,
          bestPass.player,
          type,
          bestPass.targetX,
          bestPass.targetY,
        );
        this.traceLog.push(`${p.lastName} korneri kullandı.`);
        return;
      }
    }

    // --- GENERAL DECISION MAKING ---
    const obstacles = this.detectObstacles(p, simP.x, simP.y);
    const pressure = obstacles.length;
    let isHoldingUp = false;

    // Hold up play if strong and under pressure, but no pass
    // STRENGTH IMPACT - Strong players shield the ball better
    const strengthBonus = Math.max(0, (p.attributes.strength - 50) / 50); // 0-1 scale
    if (
      p.attributes.strength > 65 &&
      pressure > 0 &&
      state.currentStamina > 30
    ) {
      const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
      // Strong players can hold longer (extra timer reduction)
      const holdDuration = 15 + strengthBonus * 10; // 15-25 ticks based on strength
      if (
        (!bestPass || bestPass.score < 20) &&
        state.decisionTimer < holdDuration
      ) {
        simP.vx *= 0.75 + strengthBonus * 0.1; // Strong players slow down less
        simP.vy *= 0.75 + strengthBonus * 0.1;
        state.decisionTimer -= 0.5;
        isHoldingUp = true;

        // HOLD signal - Tell teammates "I'm holding, find space!"
        if (Math.random() < 0.02) {
          this.emitTeamSignal(p, "HOLD");
        }
      }
    }

    let decisionSpeed = 8 - (p.attributes.decisions || 50) / 25;
    if (tactic.tempo === "Fast")
      decisionSpeed *= 0.6; // Faster decisions (0.7→0.6)
    else if (tactic.tempo === "Slow") decisionSpeed *= 1.5; // Slower decisions (1.4→1.5)

    // === YILDIZ OYUNCU BONUSU ===
    // OVR 85+ oyuncular: Daha hızlı ve daha iyi kararlar
    // Bu sayede City gibi takımlar "kilitlenmez"
    const playerOVR = p.overall || 70;
    if (playerOVR >= 85) {
      decisionSpeed *= 0.75; // %25 daha hızlı karar
    } else if (playerOVR >= 80) {
      decisionSpeed *= 0.9; // %10 daha hızlı karar
    }

    // NERF: Increase possession cooldown after shooting to prevent instant follow-up actions
    if (state.possessionCooldown > 0) state.possessionCooldown--;

    // === MERKEZİ YORGUNLUK ETKİSİ - ZİHİNSEL ===
    // Yorgun oyuncular daha yavaş karar verir
    decisionSpeed *= 2 - mentalMod; // mentalMod 1.0 → 1.0x, 0.6 → 1.4x yavaş

    // === SABIR SİSTEMİ: Yakın destek koşuyorken bekle ===
    // Kaleye uzak, net şut yok ama takım arkadaşı hızla yaklaşıyorsa — aceleden karar verme
    {
      const distToGoalNow = dist(
        simP.x,
        simP.y,
        isHome ? PITCH_LENGTH : 0,
        PITCH_CENTER_Y,
      );
      if (distToGoalNow > 28) {
        const myTeam = isHome ? this.homePlayers : this.awayPlayers;
        for (const tm of myTeam) {
          if (tm.id === p.id) continue;
          const tmPos = this.sim.players[tm.id];
          if (!tmPos) continue;
          const d = dist(simP.x, simP.y, tmPos.x, tmPos.y);
          // Takım arkadaşı bana doğru hızla koşuyor (8-22m arasında) → bekle
          const approachVx = isHome ? tmPos.vx : -tmPos.vx;
          if (approachVx > 0.5 && d > 8 && d < 22) {
            decisionSpeed *= 1.8; // %80 daha fazla bekle
            break;
          }
        }
      }
    }

    state.decisionTimer++;

    if (state.decisionTimer > decisionSpeed) {
      state.decisionTimer = 0;

      const distToGoal = dist(simP.x, simP.y, goalX, PITCH_CENTER_Y);

      // 1. EVALUATE SHOOTING
      // ... (existing shooting logic)

      // === ISOLATED HOLD UP (IZOLE OYUNCU SAKLAMA) ===
      // Calculate openness early for decision
      const shotOpennessForHold = this.calculateShotOpening(
        simP.x,
        simP.y,
        goalX,
        isHome,
      );
      const hasClearPath = shotOpennessForHold > 0.4;

      // Eğer destek yoksa ve kaleye uzaksa, bekle ve sinyal ver
      // distToGoal is already calculated above (line 2799)
      if (distToGoal > 35 && !hasClearPath) {
        // Kaleye yakın değilse
        // En yakın takım arkadaşı ne kadar uzakta?
        let nearestTeammateDist = 999;
        const myTeammates = isHome ? this.homePlayers : this.awayPlayers;

        myTeammates.forEach((tm) => {
          if (tm.id !== p.id && this.sim.players[tm.id]) {
            const d = dist(
              simP.x,
              simP.y,
              this.sim.players[tm.id].x,
              this.sim.players[tm.id].y,
            );
            if (d < nearestTeammateDist) nearestTeammateDist = d;
          }
        });

        // Eğer en yakın arkadaşım 30m uzaktaysa -> HOLD UP PLAY
        if (nearestTeammateDist > 30) {
          this.emitTeamSignal(p, "HOLD");
          // Yavaşla ve sakla (Steering behavior will handle slowdown if logic exists, otherwise just signal)
          // Target: Geri veya yana (Safety)
          // const safetyX = isHome ? simP.x - 5 : simP.x + 5;
          // const safetyY = simP.y > PITCH_CENTER_Y ? PITCH_WIDTH - 2 : 2;
        }
      }
      let shootScore = 0;
      const shotOpenness = this.calculateShotOpening(
        simP.x,
        simP.y,
        goalX,
        isHome,
      );
      const isStationary = Math.abs(simP.vx) < 0.1 && Math.abs(simP.vy) < 0.1;

      // === SMART FREE KICK LOGIC (GELİŞTİRİLMİŞ) ===
      // Serbest vuruş tespiti: GERÇEK free kick modu VEYA durağan pozisyon
      const isRealFreeKick =
        this.sim.mode === "FREE_KICK_HOME" ||
        this.sim.mode === "FREE_KICK_AWAY";
      const isFreeKickSituation =
        (isRealFreeKick || (isStationary && pressure === 0)) && distToGoal < 35;

      if (isFreeKickSituation) {
        // === BARAJ HESABI ===
        // Rakip oyuncuların serbest vuruş noktası ile kale arasında duvarı var mı?
        const enemies = isHome ? this.awayPlayers : this.homePlayers;
        let wallBlockers = 0;
        let wallQuality = 0; // Baraj kalitesi (boyları, pozisyonları)

        const shotAngleToGoal = Math.atan2(
          PITCH_CENTER_Y - simP.y,
          goalX - simP.x,
        );

        enemies.forEach((e) => {
          if (!this.sim.players[e.id]) return;
          const ePos = this.sim.players[e.id];

          // Oyuncu top ile kale arasında mı?
          const isInPath = isHome
            ? ePos.x > simP.x && ePos.x < goalX
            : ePos.x < simP.x && ePos.x > goalX;

          if (!isInPath) return;

          // Şut açısına ne kadar yakın?
          const angleToEnemy = Math.atan2(ePos.y - simP.y, ePos.x - simP.x);
          const angleDiff = Math.abs(shotAngleToGoal - angleToEnemy);

          // Açı farkı 0.3 radyan (~17 derece) içindeyse barajda
          if (angleDiff < 0.3) {
            wallBlockers++;
            // Uzun oyuncular daha iyi engelliyor
            wallQuality += (e.attributes.strength || 50) / 100;
          }
        });

        // Serbest vuruş kararı
        const finishingSkill = p.attributes.finishing || 50;
        const hasDeadBall = p.playStyles?.includes("Ölü Top Uzmanı");
        const hasCurve = p.playStyles?.includes("Plase Şut");

        // Şut yeteneği hesabı
        let fkShootSkill = finishingSkill;
        if (hasDeadBall) fkShootSkill += 25;
        if (hasCurve) fkShootSkill += 15;

        // Baraj etkisi: Her bloker şansı düşürür
        // Baraj cezası azaltıldı (%30)
        const wallPenalty = wallBlockers * 10 + wallQuality * 7;

        // === GERÇEK SERBEST VURUŞ BONUSU ===
        // Eğer gerçek free kick modundaysak (FREE_KICK_HOME/AWAY), 
        // PAS YAPMAK YASAK! Her zaman şut at!
        const realFkBonus = isRealFreeKick ? 5000 : 0; // Pası tamamen yok eder

        // === SERBEST VURUŞ KARARI ===
        // Yakın mesafe (<22m): İyi şutçular direkt vurur
        // Eşikler düşürüldü: 60 -> 50
        if (distToGoal < 22 && fkShootSkill > 50) {
          const netScore =
            400 + realFkBonus - wallPenalty + (fkShootSkill - 50) * 3;
          if (netScore > 180) {
            shootScore += netScore;
            if (wallBlockers > 0) {
              this.traceLog.push(
                `${p.lastName} frikik kullanıyor... ${wallBlockers} kişilik barajın üstünden!`,
              );
            } else {
              this.traceLog.push(
                `${p.lastName} frikik kullanıyor... Direkt Kaleye!`,
              );
            }
          } else {
            // Baraj çok güçlü, ama gerçek frikikse yine de dene
            if (isRealFreeKick) shootScore += 5000;
            else shootScore -= 50;
          }
        }
        // Orta mesafe (22-30m): Sadece uzman oyuncular
        // Eşikler düşürüldü: 70 -> 60
        else if (distToGoal < 30 && fkShootSkill > 60) {
          const netScore =
            300 + realFkBonus - wallPenalty + (fkShootSkill - 60) * 5;
          if (netScore > 120 && wallBlockers < 5) {
            shootScore += netScore;
            this.traceLog.push(`${p.lastName} uzak mesafeden frikik deniyor!`);
          } else {
            if (isRealFreeKick)
              shootScore += 5000; // Uzak ama yine de mecbur vur
            else shootScore -= 100;
          }
        }
        // Uzak mesafe (30-35m): Çok nadir, sadece efsaneler
        else if (distToGoal < 35 && fkShootSkill > 80 && wallBlockers < 4) {
          shootScore += 200 + realFkBonus;
          this.traceLog.push(
            `${p.lastName} çok uzaktan frikik deniyor! (${Math.round(distToGoal)}m)`,
          );
        }
        // Aksi halde: Uzak veya kötü şutçu
        else {
          if (isRealFreeKick && distToGoal < 35) {
            // GERÇEK FRİKİK: Mesafe uygunsa MECBUREN VUR!
            shootScore += 5000;
            this.traceLog.push(
              `${p.lastName} frikik kullanıyor! (Zorla şut - ${Math.round(distToGoal)}m)`,
            );
          } else if (isRealFreeKick) {
            // 35m+ ise pas yapabilir (çok uzak)
            shootScore += 200;
          } else {
            shootScore -= 200;
          }
        }
      }
      // === NORMAL PLAY LOGIC ===
      else if (distToGoal < SHOOT_RANGE) {
        // BASE: Closer = Better
        // NERF: 120 -> 90 base score to significantly reduce random long shots
        shootScore = 90 - distToGoal * 2.5;

        // === FINISHING-BASED DISTANCE PENALTY ===
        // Low finishing players should prefer VERY close shots
        const finishingFactor = Math.max(
          0.6,
          2.0 - p.attributes.finishing / 50,
        );
        const distancePenalty = distToGoal * finishingFactor * 1.5; // Increased penalty multiplier

        // Low finishers get EXTRA penalty for long range (>20m)
        if (distToGoal > 20 && p.attributes.finishing < 75) {
          shootScore -= (distToGoal - 20) * 5;
        }

        // Apply finishing factor penalty
        shootScore -= distancePenalty;

        // Openness is critical
        if (shotOpenness > 0.8)
          shootScore += 300; // Wide open!
        else if (shotOpenness > 0.5) shootScore += 100;
        else if (shotOpenness > 0.3) shootScore += 30;
        else shootScore -= 80;

        // FINISHING IMPACT
        shootScore += p.attributes.finishing * 1.2 - 30;

        // FORWARD BONUS
        if (this.playerRoles[p.id] === Position.FWD) {
          shootScore += 50;
        }

        // Angle penalty - AZALTILDI (köşeden de şut çekilebilmeli)
        const angle = Math.abs(
          Math.atan2(PITCH_CENTER_Y - simP.y, goalX - simP.x),
        );
        if (angle > 1.2)
          shootScore -= 80; // Çok kötü açı (>70 derece)
        else if (angle > 0.9) shootScore -= 40; // Orta açı (52-70 derece)

        // === DEATH ZONE (KILLER INSTINCT) ===
        // 10m within central goal area -> FORCE SHOT unless impossible
        const isDeathZone =
          distToGoal < 10 && Math.abs(simP.y - PITCH_CENTER_Y) < 10;
        if (isDeathZone && shotOpenness > 0.2) {
          shootScore += 500; // NERFED: 1000 -> 500 (Less "Shoot on Sight")
        }

        // === PENALTY BOX SHOT BONUS ===
        // Ceza sahası içinde (< 16m) ve önü boşsa, şut çek!
        // Köşeden bile olsa, boş kaleye şut atılmalı
        const isPenaltyBox = distToGoal < 16;
        if (isPenaltyBox && shotOpenness > 0.6) {
          shootScore += 200; // Ceza sahasında açık pozisyon
        }
        // 6 yard box (< 6m) - neredeyse her zaman şut
        if (distToGoal < 6 && shotOpenness > 0.1) {
          shootScore += 500;
        }

        // Tactic: Shoot On Sight
        if (distToGoal < 25 && p.playStyles?.includes("Uzaktan Şutör"))
          shootScore += 40;
      }

      // 2. EVALUATE PASSING
      let passScore = 0;
      const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
      if (bestPass) {
        passScore = bestPass.score;
        // Bonus if "Playmaker" class
        if (this.playerRoles[p.id] === Position.MID) passScore += 10;

        // "Better Teammate" Rule: If I have low chance (<40%) but teammate has great chance, PASS
        if (shootScore < 50 && bestPass.score > 150) {
          passScore += 100; // Prioritize the assist
        }

        // === BENCİL OLMAYAN FORVETLER (UNSELFISH STRIKERS - HYBRID) ===
        // Eğer arkadaşım bomboşsa (%90 gol), ben zorlamayayım
        // "Bencil" özelliği yoksa pası düşünür
        const isSelfish = p.playStyles?.includes("Bencil");

        // HYBRID TWEAK: Şut skoru düşük olmasa bile, pas çok iyiyse at!
        // Eski: shootScore < 100 -> Yeni: shootScore < 150 (Daha cömert)
        if (!isSelfish && bestPass.score > 250) {
          passScore += 1000; // DEHŞET BİR PAS FIRSATI (Cut-back veya boş kaleye al-da-at). Şutu ezgeç!
          this.traceLog.push(`🤝 ${p.lastName} al da at dedi!`);
        } else if (!isSelfish && bestPass.score > 200 && shootScore < 250) {
          passScore += 200; // Kesin gol pası var, onu at!
        }

        // Çok dar açıdan şut yerine orta/pas (Bitiriciliği düşükse)
        const shotAngle = Math.abs(
          Math.atan2(PITCH_CENTER_Y - simP.y, goalX - simP.x),
        );
        if (
          shotAngle > 0.8 &&
          p.attributes.finishing < 70 &&
          bestPass.score > 100
        ) {
          passScore += 80;
          shootScore -= 50;
        }
      }

      // 3. EVALUATE DRIBBLING
      // 3. EVALUATE DRIBBLING
      let dribbleScore = 10; // Base düşürüldü (30 -> 10)

      // Check space ahead
      const forwardAngle = isHome ? 0 : Math.PI;
      const checkDist = 10;
      const checkX = simP.x + Math.cos(forwardAngle) * checkDist;
      const checkY = simP.y + Math.sin(forwardAngle) * checkDist;
      const spaceObstacles = this.detectObstacles(p, checkX, checkY);

      // Boş alan bonusu azaltıldı
      if (spaceObstacles.length === 0)
        dribbleScore += 30; // 50 -> 30
      else dribbleScore -= spaceObstacles.length * 30; // Engel cezası arttı

      // IMPROVED DRIBBLING IMPACT
      if (p.attributes.dribbling > 60) {
        dribbleScore += (p.attributes.dribbling - 60) * 1.8;
      }
      // Smart Dribbling: High dribbler in open space -> Drive!
      if (p.attributes.dribbling > 80 && spaceObstacles.length === 0) {
        dribbleScore += 40;
      }

      // === MATCHUP ANALİZİ (RAKİBİ TARTMA) ===
      // pressure ve spaceObstacles yukarıda hesaplandı (detectObstacles ile)
      if (pressure > 0 && spaceObstacles.length > 0) {
        // En yakındaki engeli (savunmacıyı) bul
        const nearestDefender = spaceObstacles[0];

        if (nearestDefender) {
          // --- 1. HIZ FARKI (Speed Mismatch) ---
          // Eğer ben rakibimden çok hızlıysam, topu dürtüp geçerim (Kick and Rush)
          const mySpeed = p.attributes.speed || 50;
          const defSpeed = nearestDefender.attributes.speed || 50;

          if (mySpeed > defSpeed + 10) {
            // Ciddi hız farkı var, çalım atmayı çok iste!
            dribbleScore += 40;
            // Eğer boş alan da varsa bu skor uçar
            if (spaceObstacles.length === 1) dribbleScore += 30; // Önümde sadece o varsa
          }

          // --- 2. YETENEK FARKI (Skill Mismatch) ---
          // Benim driblingim vs Rakibin Top Kapması + Gücü
          const mySkill = p.attributes.dribbling || 50;
          // Savunmacı skoru: Tackling %70 + Strength %30
          const defSkill =
            (nearestDefender.attributes.tackling || 50) * 0.7 +
            (nearestDefender.attributes.strength || 50) * 0.3;

          const mismatch = mySkill - defSkill;

          if (mismatch > 15) {
            // Rakip savunmada çok zayıf, üzerine git!
            dribbleScore += 35;
          } else if (mismatch < -10) {
            // Rakip duvar gibi (örn: Van Dijk), çalım deneme, pas ver!
            dribbleScore -= 50;
          }

          // --- 3. SARI KART KORKUSU (Basitleştirilmiş) ---
          // (Şimdilik pendingEvents kullanılamadığı için burayı es geçiyoruz veya
          // basitçe agresifliğine bakabiliriz ama şimdilik kapalı kalsın)
        }
      } else if (pressure > 0) {
        // Eski mantık fallback (DetectObstacles menzili dışındaki genel baskı için)
        dribbleScore -= pressure * 15;
      }

      // POSITION-AWARE BEHAVIOR
      // Hücum bölgesi: Sahanın son 1/3'ü (0-35m veya 70-105m)
      const isInAttackingThird = isHome
        ? simP.x > PITCH_LENGTH * 0.7
        : simP.x < PITCH_LENGTH * 0.3;
      const isInShootingZone = distToGoal < 30;

      if (isInAttackingThird || isInShootingZone) {
        dribbleScore += 35;
        if (isInShootingZone) {
          shootScore += 30;
        }
        if (state.possessionCooldown > 8) {
          passScore -= 40; // Don't just pass back immediately
        }
      }

      // FORWARD AGGRESSION
      if (this.playerRoles[p.id] === Position.FWD && distToGoal < 35) {
        dribbleScore += 25;
      }

      // SELFISHNESS / TEAMWORK
      if (p.playStyles?.includes("Bencil")) {
        passScore -= 40;
        shootScore += 30;
        dribbleScore += 30;
        // Guarantee Goal threshold logic handled by scores
      }

      // === TACTIC EFFECTS ===
      // PAS STİLİ ETKİLERİ
      if (tactic.passingStyle === "Mixed") {
        shootScore += 15;
        dribbleScore -= 10;
        passScore -= 10;
      } else if (tactic.passingStyle === "Direct") {
        shootScore += 40;
        dribbleScore += 50;
        passScore -= 25;
      } else if (tactic.passingStyle === "Short") {
        shootScore -= 30;
        dribbleScore -= 120;
        passScore += 50;
      } else if (tactic.passingStyle === "LongBall") {
        if (isInAttackingThird) {
          shootScore += 25;
          dribbleScore += 10;
        } else {
          shootScore += 5;
          dribbleScore -= 20;
          passScore += 40;
        }
      }

      // OYUN STİLİ ETKİLERİ
      if (tactic.style === "Counter") {
        if (isInAttackingThird) {
          shootScore += 80;
          dribbleScore += 50;
        }
        if (distToGoal < 16) shootScore += 60;
        if (spaceObstacles.length === 0) dribbleScore += 40;
      } else if (tactic.style === "Attacking") {
        shootScore += 60;
        dribbleScore += 50;
        if (this.playerRoles[p.id] === Position.DEF) dribbleScore += 10;
      } else if (tactic.style === "Defensive") {
        shootScore -= 60;
        dribbleScore -= 50;
        passScore += 60;
        if (this.playerRoles[p.id] === Position.DEF) dribbleScore -= 100;
      } else if (tactic.style === "Possession") {
        passScore += 55;
        shootScore -= 20;
        dribbleScore -= 20;
        if (p.attributes.dribbling > 85 && pressure <= 1) dribbleScore += 35;
      }

      // === MENTALITY ETKİSİ (YENİ) ===
      const mentality = tactic.mentality || "Balanced";
      if (mentality === "Attacking") {
        shootScore += 25;
        dribbleScore += 20;
        passScore -= 10;
      } else if (mentality === "Defensive") {
        shootScore -= 20;
        dribbleScore -= 15;
        passScore += 25;
      }

      // === FINAL THIRD TACTIC (ŞUT FELSEFESİ) ===
      const finalThird = tactic.finalThird || "BALANCED";
      if (finalThird === "EARLY_SHOT") {
        // Erken şut: Uzaktan da çek, mesafe eşiğini ~22→32m'ye genişlet
        shootScore += 70;
        if (distToGoal > 22 && distToGoal <= 32 && !isFreeKickSituation) {
          // Bu mesafe normalde SHOOT_RANGE içinde ama düşük puan alıyordu — zorla artır
          const earlyBonus = 90 - distToGoal * 2.5;
          shootScore = Math.max(shootScore, earlyBonus + 70);
        }
      } else if (finalThird === "PATIENT") {
        // Sabırlı inşa: Şutu ertele, pas tercihi
        shootScore -= 45;
        passScore += 40;
      }
      // BALANCED: değişiklik yok

      // === ATTACK APPROACH (HÜCUM GEÇİŞ STİLİ) ===
      const attackApproach = tactic.attackApproach || "BALANCED";
      if (attackApproach === "VERTICAL") {
        // Dikey futbol: İleri pas + derin koşu
        passScore += 30; // Genel pas puanı (direct thrust)
        // Through ball'lar findBestPassOption içinde zaten değerlendiriliyor;
        // burada shootScore'u hafif artırarak hızlı bitiş de teşvik edelim
        shootScore += 10;
      } else if (attackApproach === "FLUID") {
        // Akışkan: Oyuncular arası hareket, geniş pas seçenekleri
        passScore += 25;
        dribbleScore += 20; // Pozisyon değişimi / hareket simülasyonu
      } else if (attackApproach === "PATIENT") {
        // Sabırlı inşa: Kısa pas zinciri, derinlik kazanma
        passScore += 55;
        shootScore -= 20;
      }
      // BALANCED: değişiklik yok

      // === POZİSYON GÜVENLİĞİ (SAFETY FIRST) ===
      // Stoperler ve Kaleci son adamken ASLA çalım denememeli (Büyük Risk)
      if (
        this.playerRoles[p.id] === Position.DEF ||
        this.playerRoles[p.id] === Position.GK
      ) {
        const isLastMan = isHome ? simP.x < 35 : simP.x > PITCH_LENGTH - 35;
        if (isLastMan && pressure > 0) {
          // Baskı yiyen son adam çalım atamaz!
          dribbleScore = -9999;
          passScore += 200; // HEMEN PAS AT!
        }
      }

      // === MATCH-UP ANALİZİ (AKILLI ÇALIM KARARI) ===
      // Oyuncu körü körüne çalım atmaz. Karşısındaki adamı süzer.
      const nearestDefender = this.findNearestOpponent(p, simP.x, simP.y);
      if (nearestDefender && nearestDefender.dist < 5) {
        const opp = nearestDefender.player;

        // 1. ZAYIF HALKA KONTROLÜ
        const oppTackle = opp.attributes.tackling || 50;
        const oppStrength = opp.attributes.strength || 50;
        const myDribble = p.attributes.dribbling || 50;

        // Rakip benden çok kötüyse (%20 fark), üzerine git
        if (myDribble > oppTackle * 1.2) {
          dribbleScore += 30; // "Bunu geçerim" özgüveni
        }

        // 2. ELİT STOPER KORKUSU (VAN DIJK ETKİSİ)
        if (oppTackle > 85 && oppStrength > 80) {
          dribbleScore -= 40; // "Bu adam duvar, bulaşma"
          passScore += 20; // Pas ver
        }

        // 3. HIZ FARKI (SPEED MISMATCH)
        const mySpeed = p.attributes.speed || 50;
        const oppSpeed = opp.attributes.speed || 50;
        if (mySpeed > oppSpeed + 15) {
          dribbleScore += 25; // "Vurup geçerim"
        }

        // 4. SARI KARTLI RAKİP (AKIL OYUNLARI)
        // Eğer rakibin sarı kartı varsa, üzerine oynamak mantıklıdır (Faul yapamaz)
        const hasYellow = this.match.events.some(
          (e) => e.type === MatchEventType.CARD_YELLOW && e.playerId === opp.id,
        );
        if (hasYellow) {
          dribbleScore += 20; // Üzerine git, korkak oynayacaktır
        }
      }
      // === TEMPO ETKİSİ (ORGANİK HIZ) ===
      // Tempo artık animasyon hızı değil, "DÜŞÜNME SÜRESİ"dir.
      if (tactic.tempo === "Fast") {
        // Hızlı: Top gelir gelmez kararı ver (0 bekleme)
        state.decisionTimer = Math.max(0, state.decisionTimer - 2); // 5 çok hızlı panik yaptırıyordu
        passScore += 15; // Hızlı oynamak sadece şut demek değildir, hızlı pas demek!
      } else if (tactic.tempo === "Slow") {
        // Yavaş: Topu ayağında tut, etrafına bak (40 tick bekle)
        if (state.decisionTimer < 30) {
          // Henüz yeterince düşünmediyse pas/şut atma, bekle
          passScore -= 30; // 50 yerine 30 saniye yavaşlatma daha dengeli
          shootScore -= 50;
        }
        passScore += 20; // Sabırlı pası ödüllendir
      }

      // === TALİMATLAR (INSTRUCTIONS - ORGANİK BONUSLAR) ===
      const instructions = tactic.instructions || [];

      // 1. Paslaşarak Gir (WorkBallIntoBox)
      // Player-level ShootOnSight overrides team WorkBallIntoBox for that specific player
      const playerInstrForShoot = this.getPlayerInstruction(p);
      if (instructions.includes("WorkBallIntoBox") && playerInstrForShoot !== 'ShootOnSight') {
        // Ceza sahası dışından şuta AĞIR CEZA (-50) - AMACINA GÖRE GÜNCELLENDİ
        if (distToGoal > 20) {
          // Sadece iyi şutör değillerse ceza sahası dışından yasakla
          const isGreatShooter =
            p.attributes.finishing > 80 || (p.attributes as any).longShots > 80;
          if (!isGreatShooter) {
            shootScore -= 50;
          } else {
            shootScore -= 10; // İyi şutöre hafif caydırıcılık
          }
        }
        // Final Third bölgesinde pas yapmaya ÖDÜL (+20)
        if (isInAttackingThird) {
          passScore += 20;
        }
      }

      // 2. Gördüğün Yerden Vur (ShootOnSight)
      if (instructions.includes("ShootOnSight")) {
        // ShootOnSight — agresif: 38m'ye kadar menzil, +60 ekstra şut skoru
        const isGoodShooter =
          p.attributes.finishing > 70 || (p.attributes as any).longShots > 70;
        const viewDist = isGoodShooter ? 38 : 30; // Extended range

        if (distToGoal < viewDist) {
          shootScore += 60; // Much more aggressive shoot boost

          // Önü boşsa ekstra teşvik
          if (shotOpenness > 0.45) shootScore += 20;
        }
      }

      // 3. Serbest Dolaş (RoamFromPosition)
      if (instructions.includes("RoamFromPosition")) {
        // Orta sahalar "Gezgin" olur, sürpriz koşular ve çalımlar
        if (
          this.playerRoles[p.id] === Position.MID ||
          this.playerRoles[p.id] === Position.FWD
        ) {
          dribbleScore += 15; // 30 -> 15 (Adam eksiltmeyi cesaretlendir ama abartmadan)
          // passScore'dan eksi ceza kaldırıldı. Serbest dolaşmak bencil olmak değildir.
        }
        // Mevki değiştirme izni updateOffBallAI'da işlenir
      }

      // Width Logic - Kanat bölgesi (0-17m ve 51-68m)
      const isOnWing = simP.y < 17 || simP.y > PITCH_WIDTH - 17;
      if (tactic.width === "Wide" && isOnWing) {
        dribbleScore += 20;
        if (isInAttackingThird) passScore += 15;
      } else if (tactic.width === "Narrow" && !isOnWing) {
        passScore += 15;
        dribbleScore += 10;
      }

      // === ANTI-BACKPASS LOGIC (KORKAK OYUNU ENGELLEME) ===
      // Eğer önüm boşsa ve baskı yoksa, geriye pas atmayı cezalandır!
      const isBackPass =
        bestPass &&
        (isHome ? bestPass.targetX < simP.x : bestPass.targetX > simP.x);
      // Cut-back pozisyonu: Byline'da ve kanalda olan taşıyıcı geriye cut-back atıyor
      const isCarrierBylineWide =
        (isHome
          ? simP.x > PITCH_LENGTH * 0.76
          : simP.x < PITCH_LENGTH * 0.24) &&
        (simP.y < 17 || simP.y > PITCH_WIDTH - 17);

      // Önümde engel yoksa
      if (spaceObstacles.length === 0) {
        // 1. Dribbling'i daha da teşvik et
        dribbleScore += 60;

        // 2. Eğer en iyi pas seçeneği geriyeyse, puanını düşür (cut-back muaf!)
        if (isBackPass && pressure === 0 && !isCarrierBylineWide) {
          // Baskı yokken geri dönmek korkaklıktır!
          passScore -= 150;
        }
      }

      // REHBER SİNC: Direct Passing - Geri pas yasak (-50)
      if (tactic.passingStyle === "Direct" && isBackPass) {
        passScore -= 50;
      }

      // REHBER SİNC: Defensive Style - Geri pas ödül (+60)
      // Defansif takımlar topu geride tutup süreyi eritmek ister
      if (tactic.style === "Defensive" && isBackPass) {
        passScore += 60;
      }

      // "Dribbler" (Top Süren) özelliği olanlar boşluğu asla affetmez
      if (p.attributes.dribbling > 75 && spaceObstacles.length === 0) {
        dribbleScore += 40;
      }

      // === TAKIMCIʼNIN POZİSYON KALİTESİ KONTROLÜ ===
      // Takım arkadaşı çok daha iyi pozisyondaysa, bencil şut yerine pas ver
      if (bestPass && shootScore > 0) {
        const tmSimPos = this.sim.players[bestPass.player.id];
        if (tmSimPos) {
          const tmOpenness = this.calculateShotOpening(
            tmSimPos.x,
            tmSimPos.y,
            goalX,
            isHome,
          );
          if (
            tmOpenness > shotOpenness * 1.35 &&
            tmOpenness > 0.65 &&
            bestPass.score > 100
          ) {
            shootScore -= 120;
            passScore += 50;
          }
        }
      }

      // --- EXECUTE DECISION ---
      let decision = "DRIBBLE";

      // 1v1 DETECTION
      const is1v1 = distToGoal < 18 && shotOpenness > 0.4;

      // FORWARD SPECULATIVE SHOT (sadece ceza sahası içinden)
      const isForward = this.playerRoles[p.id] === Position.FWD;
      const isMidfielder = this.playerRoles[p.id] === Position.MID;
      const speculativeShot =
        isForward &&
        distToGoal < 20 &&
        shotOpenness > 0.4 &&
        Math.random() < 0.15;

      // MIDFIELDER LONG SHOT: Sadece özel özelliği olan oyuncular uzaktan şut çeker
      const hasLongShot = p.playStyles?.includes("Uzaktan Şutör");
      const longShotAttr =
        (p.attributes as any).longShots || p.attributes.finishing || 50;
      const enemyGoalkeeper = (isHome ? this.awayPlayers : this.homePlayers).find(
        (opponent) => this.playerRoles[opponent.id] === Position.GK,
      );
      const enemyGoalkeeperPos = enemyGoalkeeper
        ? this.sim.players[enemyGoalkeeper.id]
        : null;
      const gkDistanceFromGoalLine = enemyGoalkeeperPos
        ? isHome
          ? PITCH_LENGTH - enemyGoalkeeperPos.x
          : enemyGoalkeeperPos.x
        : 0;
      const openGoalWindow =
        !!enemyGoalkeeperPos &&
        gkDistanceFromGoalLine > 7.5 &&
        distToGoal < 22 &&
        shotOpenness > 0.2;
      const longShotChance =
        isMidfielder &&
          hasLongShot &&
          distToGoal < 30 &&
          distToGoal > 20 &&
          shotOpenness > 0.45
          ? 0.1 + (longShotAttr - 60) / 400
          : 0;
      const midfielderLongShot = Math.random() < longShotChance;

      // === DECISION HIERARCHY (DİNAMİK EŞİK SİSTEMİ v4 - DAHA FAZLA ŞUT) ===
      // FORVET BONUSU: Forvetler daha düşük eşikle şut çeker
      const isAttacker = this.playerRoles[p.id] === Position.FWD;
      const attackerBonus = isAttacker ? 0.6 : 1.0; // Forvetler %40 daha düşük eşik (0.7 → 0.6)

      // --- [ŞUT EŞİKLERİ YÜKSELTİLDİ - DAHA KALİTELİ ŞUTLAR] ---
      let shootThreshold: number;
      if (distToGoal < 12) {
        shootThreshold = 180 * attackerBonus; // Yakın mesafe bile seçici olsun
      } else if (distToGoal < 20) {
        shootThreshold = 350 * attackerBonus;
      } else if (distToGoal < 30) {
        shootThreshold = 600 * attackerBonus; // Uzaktan vurmak zorlaştı
      } else {
        shootThreshold = 999; // 30 metreden mucize bekleme, pas ver!
      }

      // === PLAYER INSTRUCTION: SHOOT/PASS MODIFIER ===
      const playerInstruction = this.getPlayerInstruction(p);
      if (playerInstruction === 'ShootOnSight' && distToGoal < 38) {
        shootScore += 310;  // Massive shoot boost (+60 added on top of existing 250)
        shootThreshold = Math.max(50, shootThreshold - 200); // Much lower threshold to shoot
      } else if (playerInstruction === 'AttackMore' && distToGoal < 28) {
        shootScore += 80;
        shootThreshold = Math.max(80, shootThreshold - 80);
      } else if (playerInstruction === 'DefendMore') {
        shootScore -= 100; // Less likely to shoot
        passScore += 80;   // More likely to pass safely
      }

      // [KRİTİK]: "Al da At" Kuralı - Arkadaşın çok daha boşsa bencillik yapma
      if (bestPass && bestPass.score > 150) {
        const tmPos = this.sim.players[bestPass.player.id];
        const myOpenness = this.calculateShotOpening(
          simP.x,
          simP.y,
          goalX,
          isHome,
        );
        const tmOpenness = this.calculateShotOpening(
          tmPos.x,
          tmPos.y,
          goalX,
          isHome,
        );

        if (tmOpenness > myOpenness + 0.3) {
          shootScore -= 300; // Arkadaşın açısı %30 daha iyiyse pası zorla
          passScore += 200;
        }
      }

      // 1v1 durumunda eşiği düşür
      if (is1v1) shootThreshold = Math.min(shootThreshold, 80); // 60 -> 80

      if (openGoalWindow) {
        shootScore += distToGoal < 14 ? 320 : 180;
        passScore -= 60;
        dribbleScore -= distToGoal < 14 ? 90 : 40;
        shootThreshold = Math.min(shootThreshold, distToGoal < 14 ? 45 : 72);
      }

      // === KILLER INSTINCT (1v1 BİTİRİCİLİK - TEK VURUŞ) v2 ===
      // Forvet, ceza sahasında, 1v1 ve kaleyi görüyorsa normalde HİÇ DÜŞÜNMEZ!
      // AMA: Yanında boş kaleye atacak arkadaşı varsa (2v0, 2v1) pas verebilir.
      if (is1v1 && isAttacker && distToGoal < 16) {
        // Eğer çok net bir pas opsiyonu varsa (Al da at)
        // bestPass > 200 genelde "boş kale" veya "çok net pozisyon" demek
        if (bestPass && bestPass.score > 200) {
          // Pas opsiyonunu KORU, şutu da KORU. Karar hiyerarşisi en iyisini seçsin.
          // Sadece bekleme süresini sıfırla ki hemen karar versin.
          state.decisionTimer = 0;
          // Şut puanını biraz artır ama pası ezme
          shootScore += 50;
        } else {
          // İyi pas yoksa -> BENCİL OL VE VUR!
          shootScore += 200;
          dribbleScore = -100;
          passScore = -100;
          state.decisionTimer = 0;
        }
      }

      // Karar hiyerarşisi
      if (shootScore > shootThreshold) decision = "SHOOT";
      else if (speculativeShot && distToGoal < 20)
        decision = "SHOOT"; // 22 → 20
      else if (midfielderLongShot) decision = "SHOOT";
      else if (bestPass && bestPass.type === "THROUGH" && bestPass.score > 200)
        decision = "PASS"; // 180 → 200
      else if (passScore > dribbleScore + 70)
        decision = "PASS"; // 40 → 70 (daha az pas)
      else if (dribbleScore > 0) decision = "DRIBBLE";
      else decision = "PASS";

      if (!is1v1 && Math.random() < 0.1) decision = "DRIBBLE";

      if (decision === "SHOOT") {
        this.actionShoot(p, isHome);
        state.decisionTimer = -10; // Daha uzun bekleme
        state.possessionCooldown = 45; // NERFED: 15 -> 45 ticks cooldown

        // Reset sprint status
        simP.state = "RUN";
        return;
      } else if (decision === "PASS" && bestPass) {
        this.actionPass(
          p,
          bestPass.player,
          bestPass.type,
          bestPass.targetX,
          bestPass.targetY,
        );
        return;
      }
    }

    // --- DRIBBLE EXECUTION ---
    let targetX = goalX;
    let targetY = PITCH_CENTER_Y;

    // CORNER / GOAL LINE AVOIDANCE
    const distToGoalX = Math.abs(simP.x - goalX);
    const isNearEndLine = isHome ? simP.x > PITCH_LENGTH - 11 : simP.x < 11;
    const isNearSideLine = simP.y < 4 || simP.y > PITCH_WIDTH - 4;

    if (isNearEndLine) {
      targetX = goalX;
      targetY = lerp(simP.y, PITCH_CENTER_Y, 0.9);
      this.sim.players[p.id].vx *= 0.7;
      this.sim.players[p.id].vy *= 0.7;
    } else if (isNearSideLine) {
      targetY = PITCH_CENTER_Y;
      targetX = goalX;
    } else {
      const nearestEnemy = this.findNearestEnemyInCone(p, isHome);
      if (nearestEnemy) {
        const enemyY = this.sim.players[nearestEnemy.id].y;
        let deviation = simP.y > enemyY ? 12 : -12; // Base deviation increased (10->12)

        // === CUT INSIDE LOGIC (INVERTED WINGER / ROBBEN ROLE) ===
        // Kanat oyuncusu teknikse merkeze kırmak ister
        const isOnWing = simP.y < 15 || simP.y > PITCH_WIDTH - 15;
        const isTechnique = p.attributes.dribbling > 70;

        if (isOnWing && isTechnique) {
          // Merkeze doğru bias ekle
          const centerBias = simP.y < PITCH_CENTER_Y ? 10 : -10;
          // Eğer deviation bizi dışarı atıyorsa, merkeze dönmeye zorla
          if (
            (simP.y < PITCH_CENTER_Y && deviation < 0) ||
            (simP.y > PITCH_CENTER_Y && deviation > 0)
          ) {
            deviation = centerBias;
          }
        }

        if (simP.y < 5 && deviation < 0) deviation = 15;
        if (simP.y > PITCH_WIDTH - 5 && deviation > 0) deviation = -15;

        targetY = simP.y + deviation;
        // DIAGONAL RUN: Sadece yana değil, hafif ileri de git ki ivme kaybetme
        targetX = isHome ? simP.x + 8 : simP.x - 8;
      } else {
        targetX = goalX;
        // DIAGONAL DRIBBLE BIAS: Merkeze yönelme isteği
        if (Math.abs(simP.y - PITCH_CENTER_Y) > 18) {
          // Cutting inside gradually (0.15 -> 0.25 aggression)
          targetY = lerp(simP.y, PITCH_CENTER_Y, 0.25);
        } else {
          targetY = simP.y;
        }
      }
    }

    // DRIBBLE HIZ NERF v2: Top sürerken daha yavaş
    this.applySteeringBehavior(p, targetX, targetY, MAX_PLAYER_SPEED * 0.85);
  }

  private findBestPassOption(
    p: Player,
    isHome: boolean,
    offsideLineX: number,
    goalX: number,
  ): {
    player: Player;
    score: number;
    type: "GROUND" | "THROUGH" | "AERIAL";
    targetX: number;
    targetY: number;
  } | null {
    let bestTarget: Player | null = null;
    let maxScore = -9999;
    let bestType: "GROUND" | "THROUGH" | "AERIAL" = "GROUND";
    let bestTx = 0;
    let bestTy = 0;

    const teammates = isHome ? this.homePlayers : this.awayPlayers;
    const simP = this.sim.players[p.id];
    const myGoalX = isHome ? 0 : PITCH_LENGTH;
    const distToMyGoal = dist(simP.x, simP.y, myGoalX, PITCH_CENTER_Y);
    const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;

    // Don't pass from very close to own goal line if possible (Clearance preferred in outer logic)
    if (distToMyGoal < 7 && this.playerRoles[p.id] !== Position.GK) return null;

    teammates.forEach((tm) => {
      if (tm.id === p.id) return;
      if (!this.sim.players[tm.id]) return;
      const simTm = this.sim.players[tm.id];

      // === GLOBAL SKILL BUFF (PHASE 14) ===
      const GLOBAL_BUFF = 1.0;

      const d = dist(simP.x, simP.y, simTm.x, simTm.y);
      const visionStat = (p.attributes.vision || 50) * GLOBAL_BUFF; // Vision stat

      // === SMART PASSING: VISION CHECK ===
      // Vision 50: Standart (35m)
      // Vision 80: Geniş (65m)
      // Vision 95: Kartal Gözü (Tüm Saha)
      let effectiveRange = PASS_RANGE_VISION;
      if (p.playStyles?.includes("Maestro")) effectiveRange += 25;

      if (visionStat > 94)
        effectiveRange = 200; // Tüm sahayi görür
      else if (visionStat > 84)
        effectiveRange += 35; // Neredeyse tüm saha
      else if (visionStat > 74) effectiveRange += 15;

      if (d > effectiveRange) return;

      // Base Score: Closer to enemy goal is better
      const distToGoal = dist(simTm.x, simTm.y, goalX, PITCH_CENTER_Y);
      let score = 126 - distToGoal; // 120 -> 126 (ölçeklendi)

      // === PAS DAĞITIMI: Kanat forvetleri ve çeşitlilik ===
      // Merkez forvet her zaman kaleye en yakın -> hep en yüksek skor alıyor
      // Bu düzeltme kanat forvetlerini de cazip hale getiriyor
      const tmRole = this.playerRoles[tm.id];
      if (tmRole === Position.FWD) {
        // Kanat forvetlerine açılma bonusu (merkez dışındaki forvetler)
        const isOnWing = simTm.y < 25 || simTm.y > PITCH_WIDTH - 25;
        if (isOnWing) {
          score += 15; // Kanat açık -> iyi seçenek!
        }
        // Çeşitlilik: Hep aynı adama pas atmak yerine rastlantı
        score += Math.random() * 12 - 6; // ±6 puan rastgelelik
      }

      // === OYUNU GENİŞLETME (SPREAD PLAY) ===
      // Daha akıllı kanat kullanımı (Özellikle 4-3-3 için)
      const amICentral = Math.abs(simP.y - PITCH_CENTER_Y) < 15;
      const isTeammateWide = Math.abs(simTm.y - PITCH_CENTER_Y) > 20;

      if (amICentral && isTeammateWide) {
        score += 40; // Kanata pası teşvik et
      }

      // Forward Progress: Pozitifse ileri, negatifse geri pas (Moved Up for LongBall Logic)
      const forwardProgress = isHome ? simTm.x - simP.x : simP.x - simTm.x;

      // === SİNYAL OKUMA SİSTEMİ (G MOTORU) ===
      const tmState = this.playerStates[tm.id]; // Variable declaration fixed
      if (tmState?.incomingSignal?.type === "CALL") {
        score += 50; // Bağıran oyuncuya pas atma isteği ciddi artar
      }
      if (tmState?.outgoingSignal?.type === "POINT") {
        // Eğer oyuncu ileriye koşuyorsa ve ileriye doğru pas veriyorsak bonus
        if (forwardProgress > 10) score += 40;
      }

      // === G MOTORU: SAVUNMA YOĞUNLUĞU KONTROLÜ (Interception Risk) ===
      let proximityRisk = 0;
      const opponents = isHome ? this.awayPlayers : this.homePlayers;

      opponents.forEach((e) => {
        if (!this.sim.players[e.id]) return;
        const simE = this.sim.players[e.id];

        // Pas yolu üzerinde mi?
        const distToLine = this.distToSegment(
          simE.x,
          simE.y,
          simP.x,
          simP.y,
          simTm.x,
          simTm.y,
        );

        if (distToLine < 2.5) {
          // Eğer rakip pas yoluna 2.5m yakınsa
          proximityRisk += 150; // Pasın geçme ihtimalini bitir
        }
      });
      score -= proximityRisk;

      // === GLOBAL OFSAYT KONTROLÜ (TÜM PAS TÜRLERİ İÇİN) ===
      if (forwardProgress > 0) {
        const isReceiverOffside = isHome
          ? simTm.x > offsideLineX + 0.5
          : simTm.x < offsideLineX - 0.5;

        // Pasör kendi yarı sahasında mı?
        const isPasserInOwnHalf = isHome
          ? simP.x < PITCH_CENTER_X
          : simP.x > PITCH_CENTER_X;

        if (isReceiverOffside && !isPasserInOwnHalf) {
          return; // Ofsayt - iptal
        }
      }

      // === LONG BALL LOGIC ===
      const isInAttackingThird = isHome
        ? simP.x > PITCH_LENGTH * 0.66
        : simP.x < PITCH_LENGTH * 0.33;

      if (tactic && tactic.passingStyle === "LongBall") {
        if (d > 35) {
          if (forwardProgress > 5) {
            score += 50; // İleri uzun pasa büyük ödül
          } else if (forwardProgress < -5) {
            score -= 500; // Geriye uzun top KESİNLİKLE yasak
          }
        }
        if (d < 20) score -= 30; // Kisa pas sevmez
      }

      // === CONSISTENCY FIX: SHORT PASSING LIMIT ===
      if (tactic.passingStyle === "Short" && d > 30) {
        score -= 150; // Kısa pas taktiğinde 30m+ pas yasak!
      }

      // === SMART PASSING: MARKAVJ VE BASKI ANALİZİ ===
      // "Smart Passing" (User Request): Boş adamı bul, markajlı adama atma
      let receiverPressure = 0;
      let closestEnemyToReceiver = 999;

      opponents.forEach((e) => {
        if (!this.sim.players[e.id]) return;
        const simE = this.sim.players[e.id];
        const enemyDistToReceiver = dist(simE.x, simE.y, simTm.x, simTm.y);

        if (enemyDistToReceiver < closestEnemyToReceiver) {
          closestEnemyToReceiver = enemyDistToReceiver;
        }

        // 3m içinde rakip = ciddi baskı
        if (enemyDistToReceiver < 3) receiverPressure += 100;
        // 5m içinde rakip = orta baskı
        else if (enemyDistToReceiver < 5) receiverPressure += 50;
        // 7m içinde rakip = hafif baskı
        else if (enemyDistToReceiver < 7) receiverPressure += 20;
      });

      // === SMART BONUS: OPEN MAN ===
      if (receiverPressure === 0) {
        // Tamamen boş adam!
        score += 50;
        if (visionStat > 80) score += 30; // İyi görüşü olan bunu ödüllendirir
        this.traceLog.push(`👀 ${p.lastName} boş adamı gördü!`);
      } else {
        // === SMART AVOIDANCE: DECISIONS ===
        // Karar verme yeteneği yüksek oyuncular, markajdaki adamı tercih etmez
        const decisionFactor = (p.attributes.decisions || 50) / 100; // 0.5 - 0.99
        // Düşük decision (0.5) -> Pressure 100 ise -50 puan (az takar)
        // Yüksek decision (0.9) -> Pressure 100 ise -90 puan (çok takar/risk almaz)
        score -= receiverPressure * decisionFactor;
      }

      // === CRITICAL FIX: PAS YOLU (LANE) KONTROLÜ ===
      // Sadece alıcının yanına bakmak yetmez, pasın GİDECEĞİ YOL temiz mi?
      // Özellikle geriye paslarda araya giren rakipler çok tehlikeli
      let interceptionRisk = 0;
      const px = simP.x,
        py = simP.y;
      const tx = simTm.x,
        ty = simTm.y;
      const passDist = d;

      opponents.forEach((e) => {
        if (!this.sim.players[e.id]) return;
        const ex = this.sim.players[e.id].x;
        const ey = this.sim.players[e.id].y;

        // Noktanın doğruya uzaklığı formülü (Line Segment Distance)
        // P(x,y) noktasının AB doğru parçasına en yakın uzaklığı
        const l2 = passDist * passDist;
        if (l2 === 0) return;

        // t = projection factor
        let t = ((ex - px) * (tx - px) + (ey - py) * (ty - py)) / l2;
        t = Math.max(0, Math.min(1, t)); // Segment dışına taşmayı engelle

        const projectionX = px + t * (tx - px);
        const projectionY = py + t * (ty - py);

        const distToLine = dist(ex, ey, projectionX, projectionY);

        // Eğer rakip pas yoluna çok yakınsa (1.5m) ve pasör/alıcıya çok yakın değilse
        // (Pasörün dibindeki adam interception değil baskıdır, onu ayrı sayıyoruz)
        const distToPasser = dist(ex, ey, px, py);
        const distToReceiver = dist(ex, ey, tx, ty);

        if (distToLine < 1.5 && distToPasser > 2 && distToReceiver > 2) {
          // BLOKE EDİLDİ! Pas yolu kapalı
          interceptionRisk += 500;
        } else if (distToLine < 3.0 && distToPasser > 2 && distToReceiver > 2) {
          // Riskli alan
          interceptionRisk += 40;
        }
      });

      // Geriye paslarda interception riski AFFEDİLMEZ
      if (interceptionRisk > 0 && forwardProgress < 0) {
        score -= 500; // Asla geriye riskli pas atma
      } else if (interceptionRisk >= 500) {
        // İleri paslarda AERIAL (Havadan) veya THROUGH (Ara Pas) ile aşılabilir mi?
        // Eğer "Maestro" yeteneği varsa havadan denesin
        if (p.playStyles?.includes("Maestro")) {
          score -= 50; // Havadan denerim, çok düşürme
          bestType = "AERIAL";
        } else {
          score -= 300; // Yerden pas kapalı
        }
      } else if (interceptionRisk > 0) {
        score -= interceptionRisk;
      }

      // Alıcının çok yakınında rakip varsa, pas riskli
      if (receiverPressure >= 100) {
        score -= 120; // 300→120: Çok riskli ama imkansız değil
      } else if (receiverPressure >= 50) {
        score -= 50; // 100→50: Orta riskli pas
      } else if (receiverPressure >= 20) {
        score -= 15; // 30→15: Hafif riskli pas
      }

      // === ALICI HAZIRLIK KONTROLÜ ===
      // Takım arkadaşının yüzü pas yönüne dönük mü?
      const angleToReceiver = Math.atan2(simTm.y - simP.y, simTm.x - simP.x);
      const receiverFacing = simTm.facing || 0;
      let facingDiff = Math.abs(angleToReceiver - receiverFacing);
      if (facingDiff > Math.PI) facingDiff = 2 * Math.PI - facingDiff;

      // Arkası tamamen dönükse pas skoru düşer
      const isBackTurned = facingDiff > Math.PI * 0.7;
      if (isBackTurned) {
        score -= 30; // Arkası dönük - pas riskli
        // Ama "İlk Dokunuş" yeteneği varsa ceza azalır
        if (tm.playStyles?.includes("İlk Dokunuş")) {
          score += 15; // İlk dokunuş yeteneği telafi eder
        }
      }

      // Sprint halindeyken top almak zor
      const tmSpeed = Math.sqrt((simTm.vx || 0) ** 2 + (simTm.vy || 0) ** 2);
      if (tmSpeed > MAX_PLAYER_SPEED * 0.8) {
        score -= 15; // Tam sprint - kontrol zorlaşır
        // "İlk Dokunuş" yeteneği telafi
        if (tm.playStyles?.includes("İlk Dokunuş")) {
          score += 10;
        }
      }

      // Forward Progress Bonus - AI CONSENSUS: Dikine pas ödülü artırıldı
      // (forwardProgress calculated above)

      // Dinamik forward bias: Gerideyken daha agresif
      let forwardBias = 4.5; // 3.0→4.5
      const scoreDiff = isHome
        ? this.match.homeScore - this.match.awayScore
        : this.match.awayScore - this.match.homeScore;
      if (scoreDiff < 0) forwardBias += 1.5; // Gerideyken daha dikine
      if (tactic.style === "Possession" && distToGoal < 40) forwardBias += 1.5; // Son 1/3'te dikine

      if (forwardProgress > 0) score += forwardProgress * forwardBias;

      // === SİNYAL OKUMA SİSTEMİ (G MOTORU ENTEGRASYONU) ===

      // Eğer takım arkadaşım "Bana at!" (CALL) diyorsa skoru artır
      if (tmState?.incomingSignal?.type === "CALL") {
        score += 50; // Öncelik ver
      }

      // Eğer "Önüme at" (POINT) diyorsa ve pas ileri gidiyorsa skoru artır
      if (tmState?.outgoingSignal?.type === "POINT") {
        if (forwardProgress > 10) score += 40; // Koşu yoluna at (G Motoru verisi: +40)
      }

      // === WALL PASS / VER-KAÇ BONUSU ===
      // Takım arkadaşım pası verdi ve koşuya başladıysa (supportRunUntil aktifse)
      // Ona geri pas atmak futbolun en etkili silahıdır.
      if (
        tmState?.supportRunUntil &&
        tmState.supportRunUntil > this.tickCount
      ) {
        // Pas çok geriye gitmiyorsa (hafif yan/geri olabilir)
        if (forwardProgress > -10) {
          score += 130; // VER-KAÇ TAMAMLAMA BONUSU (öncelikli)
          if (forwardProgress > 5) score += 50; // İleri koşan arkadaşa öne at
          if (forwardProgress > 15) score += 50; // Savunma arkasına derin top
        }
      }

      // === AL DA AT PASI (SWEAT GOAL) ===
      // 3-Forvetli sistemlerde kaleciyle 2v1 kalındığında bencilce şut çekme, arkadaşına at
      const inCockpit = isHome ? simP.x > PITCH_LENGTH - 16 : simP.x < 16; // Ceza sahası
      if (inCockpit) {
        const tmDistToGoal = dist(simTm.x, simTm.y, goalX, PITCH_CENTER_Y);
        // Arkadaşım kaleye yakın ve boşsa devasa bonus
        if (
          tmDistToGoal < 14 &&
          receiverPressure === 0 &&
          interceptionRisk === 0
        ) {
          score += 550; // Şut çekmek yerine boş adama pas at
          bestType = "GROUND";
        }
      }

      // ANTI-COWARD LOGIC (REFINED) KAAN
      // Geriye pas atarken korkaklık cezası - AMA taktiksel geri paslara izin ver
      // Cut-back: Byline'dan merkeze geri pas = saldırı fırsatı, ceza verme!
      // --- [GÜNCELLENMİŞ CUT-BACK VE DİKİNE PAS MANTIĞI] ---
      const isByline = isHome ? simP.x > 90 : simP.x < 15;
      const isTargetInBox = isHome ? simTm.x > 82 : simTm.x < 23;
      const isTargetCentral = Math.abs(simTm.y - 34) < 15;

      if (forwardProgress < 0) {
        if (isByline && isTargetInBox && isTargetCentral) {
          score += 850; // DEVASAL BONUS: Bu bir geri pas değil, cut-back!
          bestType = "GROUND"; // Cut-back'ler her zaman yerden olur
          this.traceLog.push(`🎯 ${p.lastName} geriye kesti, net pozisyon!`);
        } else {
          // TACTICAL ANTI-BACKPASS (USER REQUEST)
          // "Possession" veya "Defensive" takımlar geri pası sever (Score artışı veya az ceza)
          // "Attacking" veya "Direct" takımlar geri pası sevmez (Score düşüşü)

          if (tactic.style === "Possession") {
            score += 40; // Geri dönüp topu tutmak mantıklı
          } else if (
            tactic.style === "Defensive" ||
            tactic.style === "ParkTheBus"
          ) {
            score += 60; // Güvenli oyna, geri dön
          } else if (
            tactic.style === "Attacking" ||
            tactic.style === "HighPress" ||
            tactic.passingStyle === "Direct"
          ) {
            score -= 50; // YASAK KALKTI: -250 topla oynayanı delirtiyordu. Sadece -50 ceza.
          } else if (tactic.style === "Counter") {
            score -= 30; // Kontrada geri pas tempoyu öldürür ama tamamen imkansız değildir
          } else {
            score -= 20; // Varsayılan hafif ceza
          }
        }
      } else {
        // İleri pas ödülü
        score += forwardProgress * 5.0; // İlerlemeyi daha çok ödüllendir
        if (tactic.style === "Counter") score *= 1.3;
      }

      // VISION IMPACT ON PASS DECISION - High vision sees better options!
      // Vision 50 = +0, Vision 70 = +20, Vision 85 = +35, Vision 100 = +50
      if (visionStat > 50) {
        score += (visionStat - 50) * 1.0; // DOUBLED: Vision bonus to all passes
        // Extra bonus for long forward passes (vision helps see them)
        if (forwardProgress > 20 && d > 25) {
          score += (visionStat - 50) * 0.6; // DOUBLED: Extra for long through balls
        }
      }

      // === YETENEK: YARATICI ===
      // "Maestro" yeteneği olan pasörler riskli pasları daha iyi görür
      if (p.playStyles?.includes("Maestro")) {
        if (forwardProgress > 15) score += 20;
      }

      // --- CROSSING LOGIC (KANAT ORTASI - ENHANCED) ---
      // Deep: Son 25m (X ekseni), Wide: Kanat (Y<17 veya Y>51)
      const isDeep = isHome
        ? simP.x > PITCH_LENGTH * 0.76
        : simP.x < PITCH_LENGTH * 0.24;
      const isWide = simP.y < 17 || simP.y > PITCH_WIDTH - 17;

      // === FORCE AERIAL CROSS FROM WINGS ===
      // Kanattan ceza sahasına pas = MUTLAKA HAVADAN olmalı (gerçek futbol!)
      let forcedAerialCross = false;

      // Taktiksel "Wing Play" varsa orta açma isteği artar
      const isWingPlay =
        tactic.style === "WingPlay" ||
        (tactic.instructions &&
          tactic.instructions.includes("HitEarlyCrosses"));

      if ((isDeep && isWide) || (isWingPlay && isWide && isInAttackingThird)) {
        // If I am in Crossing Zone, prioritize players in the box!
        const isTargetCentral = Math.abs(simTm.y - PITCH_CENTER_Y) < 18; // Geniş merkez bölge (14 → 18)
        const isTargetDeep = isHome ? simTm.x > 80 : simTm.x < 25; // 84/21 → 80/25

        if (isTargetCentral && isTargetDeep) {
          score += isWingPlay ? 800 : 500; // WingPlay ise kesin orta aç

          // CUTBACK (GERİYE ÇIKARMA) KONTROLÜ
          // Pasör hedeften daha ilerideyse (kale çizgisine inmişse) ve pas geriye doğruysa
          const isCutback = isHome ? simP.x > simTm.x : simP.x < simTm.x;

          if (isCutback) {
            // Cutback fırsatı! Yerden sert pas (Ground) daha etkili olabilir.
            // Zorunlu hava topunu iptal et, bırak puanlama karar versin (Ground genelde daha isabetlidir)
            forcedAerialCross = false;
            score += 300; // Cutback ekstra bonus
          } else {
            forcedAerialCross = true; // Klasik orta (Havadan)
          }

          // Hedef oyuncu uzun boyluysa veya iyi kafa vuruyorsa bonus
          if (
            tm.attributes.strength > 70 ||
            tm.playStyles?.includes("Hava Hakimi")
          ) {
            score += 200;
          }
        }
      }

      // --- 1. ANALYZE PASS TYPES ---

      // A. GROUND PASS (AYAĞA)
      const groundTime = d / 2.5;
      const safeGroundTime = Math.min(groundTime, 3.0);
      const groundTx = simTm.x + (simTm.vx || 0) * safeGroundTime;
      const groundTy = simTm.y + (simTm.vy || 0) * safeGroundTime;

      // BOUNDS CHECK 1: Ground Pass (Pass to empty space fix)
      // Motor koordinatları: X=0-105, Y=0-68
      if (
        groundTy < 2 ||
        groundTy > PITCH_WIDTH - 2 ||
        groundTx < 1 ||
        groundTx > PITCH_LENGTH - 1
      )
        return;

      // B. THROUGH BALL (KOŞU YOLUNA - REFINED PHASE 13)
      // Eski: Sabit 15 tick (Çok ezbere)
      // Yeni: Hıza göre dinamik mesafe (Lead Distance)

      const runDirX = simTm.vx || 0;
      const runDirY = simTm.vy || 0;
      const runSpeed = Math.sqrt(runDirX * runDirX + runDirY * runDirY);
      const isMakingRun = runSpeed > 1.5;

      let throughTx = simTm.x;
      let throughTy = simTm.y;

      if (isMakingRun) {
        const leadFactor = 5 + runSpeed * 20;
        throughTx += runDirX * leadFactor;
        throughTy += runDirY * leadFactor;
      } else {
        throughTx += (simTm.vx || 0) * 5;
        throughTy += (simTm.vy || 0) * 5;
      }

      // BOUNDS CHECK 2: Through Ball (Strict)
      // Kanaat ortalarinda topun cikmasini engelle
      // Saha 68m genisliginde. 2m pay birak.
      // Motor koordinatları: Y=0-68
      if (throughTy < 3 || throughTy > PITCH_WIDTH - 3) {
        // If aiming out of bounds, penalize heavily
        score -= 200;
      }
      if (throughTx < 0 || throughTx > PITCH_LENGTH)
        throughTx = clamp(throughTx, 1, PITCH_LENGTH - 1);

      // C. AERIAL PASS (HAVADAN) used as fallback or Cross

      // --- 2. CALCULATE INTERCEPTION RISK FOR GROUND ---
      // enemies zaten yukarıda tanımlandı (alıcı baskısı kontrolünde)
      let groundRisk = 0;

      opponents.forEach((e) => {
        if (!this.sim.players[e.id]) return;
        const simE = this.sim.players[e.id];

        const dx = groundTx - simP.x;
        const dy = groundTy - simP.y;
        const l2 = dx * dx + dy * dy;
        if (l2 == 0) return;

        let t = ((simE.x - simP.x) * dx + (simE.y - simP.y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = simP.x + t * dx;
        const py = simP.y + t * dy;

        // PAS KESİM RİSKİ: Daha gerçekçi mesafe
        // USER REQUEST: Elit seviye için 1.2m'ye kadar düşürülmeli
        // ESKİ: 2.0m (pressing 2.8m)
        // YENİ: 1.2m (Normal), 2.0m (Pressing)
        let riskDist = 1.25;

        // Vizyonu çok yüksek oyuncular (De Bruyne) çok dar koridorları görür
        if (p.attributes.vision > 90) riskDist = 0.9;
        else if (p.attributes.vision > 80) riskDist = 1.1;

        // Pressing yapan oyuncular daha geniş alan kapatır
        if (this.playerStates[e.id]?.isPressing) riskDist += 0.8;

        if (dist(simE.x, simE.y, px, py) < riskDist) {
          groundRisk += 100; // Blocked!
        }
      });

      // --- 3. EVALUATE OPTIONS ---

      // === PAS STİLİ: ORGANİK SKORLAMA (v6 - POCKET FM 2.0) ===
      // Artık yasaklama yok, sadece PUANLAMA var.
      // Amaç: Kısa pas taktiği seçilse bile, %90 gol olacak uzun pası atabilmek.

      // 1. KISA PAS (SHORT / TIKI-TAKA)
      // Felsefe: Topu kaybetme. Yakına oyna.
      if (tactic.passingStyle === "Short") {
        if (d < 15)
          score += 25; // Kısa pas (0-15m) BÜYÜK ÖDÜL
        else if (d < 25)
          score += 10; // Orta mesafe (15-25m) KÜÇÜK ÖDÜL
        else if (d > 35) score -= 25; // Uzun pas (35m+) CEZA (ama yasak değil)

        // Geri pas kontrolü: Kısa pasta geri dönmek sorun değil (Güvenlik)
        if (forwardProgress < -5) score += 10;
      }

      // 2. DİREKT (DIRECT / KLOPP)
      // Felsefe: Dikine git. Geriye bakma.
      else if (tactic.passingStyle === "Direct") {
        if (forwardProgress > 10) score += 30; // İleri oynamak BÜYÜK ÖDÜL

        // Geri pas yasak değil, ama SEVİLMEZ
        if (forwardProgress < -2) score -= 50; // Geri pas CİDDİ CEZA

        // Risk alma iştahı: Uzun mesafeye daha toleranslı
        if (d > 20 && d < 45) score += 15;
      }

      // 3. UZUN TOP (LONG BALL / ROUTE ONE)
      // Felsefe: Orta sahayı atla. Forveti bul.
      else if (tactic.passingStyle === "LongBall") {
        // Sadece Forvetlere (FWD) atılan pasları ödüllendir
        if (tmRole === Position.FWD) {
          score += 40; // Forveti gördün mü? AT!
        }

        // Kısa pas sevmez (vakit kaybı)
        if (d < 20) score -= 20;

        // Mesafe bonusu
        if (d > 35) score += 25;
      }

      // 4. KARIŞIK (MIXED / BALANCED)
      // Felsefe: En mantıklısını seç.
      else if (tactic.passingStyle === "Mixed") {
        if (d > 10 && d < 35) score += 10; // İdeal futbol mesafesi
        if (forwardProgress > 5) score += 10; // Hafif ileri bias
      }

      let currentBestScore = -9999;
      let currentType: "GROUND" | "THROUGH" | "AERIAL" = "GROUND";
      let finalTx = groundTx;
      let finalTy = groundTy;

      // OPTION 1: GROUND PASS
      let groundScore = score;

      // === PAS STİLİ: TİP BONUSU KALDIRILDI (v5) ===
      // Mesafe zaten doğru tipi zorluyor:
      // - Kısa pas → doğal olarak GROUND (risk düşük)
      // - Uzun pas → doğal olarak AERIAL (üzerinden geçmesi gerek)
      // Artık ekstra tip bonusu YOK, sadece mesafe kontrol ediyor

      // === KRİTİK FIX: PAS YOLUNDA RAKİP VARSA, BU PASI YAPMA! ===
      const isGroundBlocked = groundRisk > 0;

      if (isGroundBlocked) {
        groundScore = -9999; // Bu pas seçeneği iptal!
      }

      // === CHIP PASS (LÖB PAS) ===
      // Arada rakip var ve mesafe uygunsa, havadan aşırt
      let useChipPass = false;
      if (isGroundBlocked && d < 25 && d > 5) {
        // Kısa/orta mesafe, arada rakip var - chip pass mantıklı
        useChipPass = true;
      }

      if (groundScore > currentBestScore && !isGroundBlocked) {
        currentBestScore = groundScore;
        currentType = "GROUND";
        finalTx = groundTx;
        finalTy = groundTy;
      }

      // OPTION 2: THROUGH BALL
      if (isMakingRun && forwardProgress > 5) {
        const boundsCheck =
          throughTx > 1 &&
          throughTx < PITCH_LENGTH - 1 &&
          throughTy > 2 &&
          throughTy < PITCH_WIDTH - 2;
        const offsideCheck = isHome
          ? throughTx < offsideLineX
          : throughTx < offsideLineX;

        if (boundsCheck && offsideCheck) {
          let throughRisk = 0;
          opponents.forEach((e) => {
            const simE = this.sim.players[e.id];
            if (!simE) return; // Fix crash
            const dx = throughTx - simP.x;
            const dy = throughTy - simP.y;
            const l2 = dx * dx + dy * dy;
            if (l2 === 0) return;
            const t = ((simE.x - simP.x) * dx + (simE.y - simP.y) * dy) / l2;
            const px = simP.x + t * dx;
            const py = simP.y + t * dy;
            // Through ball için biraz daha toleranslı (2.0m) - koşan oyuncuya pas
            if (dist(simE.x, simE.y, px, py) < 2.0 && t > 0.15 && t < 0.85)
              throughRisk += 100;
          });

          // === KRİTİK FIX: THROUGH BALL DA BLOKLANIRSA İPTAL ===
          // Phase 13: Ara paslarda risk toleransı daha yüksek olmalı
          // Çünkü top boşluğa atılıyor, ayağa değil.
          let throughRiskTolerated = throughRisk;

          // Eğer pası atan "Maestro" ise veya "Uzun Top" ustasıysa riski azalt
          if (
            p.playStyles?.includes("Maestro") ||
            p.playStyles?.includes("Maestro")
          ) {
            throughRiskTolerated *= 0.5; // Riski yarıya indir
          }

          const isThroughBlocked = throughRiskTolerated > 50; // 0 yerine 50 tolerans

          let throughScore = score + 40;
          if (isThroughBlocked) {
            throughScore = -9999;
          } else {
            // Risk varsa (ama 50'nin altındaysa) puanı biraz kır
            throughScore -= throughRiskTolerated;

            // === G MOTORU: LINE BREAKER BONUSU (PHASE 11) ===
            // === G MOTORU: LINE BREAKER BONUSU (PHASE 11) ===
            // Eğer oyuncu koşu yapıyorsa (isMakingRun) veya elini kaldırdıysa (POINT)
            // Pas puanını ARŞA ÇIKAR!
            const isSignaling = tmState?.outgoingSignal?.type === "POINT";
            const isAggressiveForward =
              tmRole === Position.FWD && (isMakingRun || isSignaling);

            if (isAggressiveForward) {
              throughScore += 75; // 40 + 75 = 115 (Devasa Bonus)
              if (isSignaling) throughScore += 25; // "Buraya at" diyorsa daha da artır

              // Vizyonu düşük oyuncular bile bu bariz koşuyu görür
              if (p.attributes.vision > 60) throughScore += 20;
            }

            if (p.attributes.vision > 70) throughScore += 20;
            // POSSESSION STYLE: Killer Pass Bonus!
            if (
              tactic.style === "Possession" &&
              dist(throughTx, throughTy, goalX, PITCH_CENTER_Y) < 32
            ) {
              throughScore += 30;
            }
          }

          if (throughScore > currentBestScore && !isThroughBlocked) {
            currentBestScore = throughScore;
            currentType = "THROUGH";
            finalTx = throughTx;
            finalTy = throughTy;
          }
        }
      }

      // OPTION 3: AERIAL / CROSS / CHIP PASS
      // === ENHANCED: Kanattan orta her zaman AERIAL olmalı ===
      // VEYA: Kısa mesafe chip pass (löb)
      if (
        forcedAerialCross ||
        (isDeep && isWide) ||
        (groundRisk > 50 && d > 8 && d < 45) ||
        useChipPass
      ) {
        let aerialScore = score - 25; // AERIAL doğal ceza (15 → 25)

        if (forcedAerialCross)
          aerialScore += 100; // 300 → 100 (hala güçlü ama dominant değil)
        else if (isDeep && isWide) aerialScore += 70; // 100 → 70

        // === PAS STİLİ ETKİSİ (v3 - ÇOK ÖNEMLİ) ===
        // Her pas stili AERIAL tercihini farklı ayarlar
        // Short: Kısa pas oynamak istiyor → AERIAL'ı cezalandır!
        // Mixed: Nötr
        // Direct: Direkt futbol → AERIAL'ı biraz sev
        // LongBall: Uzun top → AERIAL'ı çok sev
        // v5: Mesafe zaten uzun AERIAL'ı cezalandırıyor, sadece hafif tip etkisi
        // v6: KISA aşırtma paslara (Chip) izin ver, ama uzun hava toplarını cezalandır
        if (tactic.passingStyle === "Short") {
          if (useChipPass && d < 20)
            aerialScore -= 10; // Yakın mesafe aşırtma serbest (Şık pas)
          else aerialScore -= 40; // Uzun şişirme yasak
        } else if (tactic.passingStyle === "Mixed") aerialScore += 5;
        else if (tactic.passingStyle === "Direct") aerialScore += 20;
        else if (tactic.passingStyle === "LongBall") aerialScore += 35;

        // === CHIP PASS BONUS (düzeltildi) ===
        if (useChipPass) {
          aerialScore += 60; // 120 → 60 (hala tercih ediliyor ama dominant değil)
          if (p.attributes.passing > 70) aerialScore += 15; // 30 → 15
          if (p.attributes.vision > 75) aerialScore += 10; // 20 → 10
        }

        // === SMART CHIP PASS (AKILLI AŞIRTMA - v2) ===
        // Eğer yer pası defans tarafından kesiliyorsa (isGroundBlocked),
        // Ve oyuncu yetenekliyse (Vizyon > 75), şık bir aşırtma yap!
        if (d > 8 && d < 25 && isGroundBlocked) {
          // Bloklanmış yer pası durumunda Chip Pass'i ciddi şekilde ödüllendir
          if (p.attributes.vision > 75 || p.playStyles?.includes("Maestro")) {
            aerialScore += 150; // Kesin tercih sebebi yap!
            // "Maestro" trait'i varsa neredeyse her zaman aşırtır
          } else if (p.attributes.passing > 70) {
            aerialScore += 80; // İyi pasörler de aşırtabilir
          } else {
            aerialScore += 30; // Standart aşırtma denemesi
          }
        }

        // === OFSAYT KONTROLÜ (AERIAL İÇİN EK GÜVENLİK) ===
        // Global ofsayt kontrolü zaten yukarıda yapılıyor.
        // Bu ek kontrol, havadan paslarda topun düşeceği yerin de
        // ofsayt çizgisinin gerisinde olmasını sağlar (ekstra güvenlik).
        const targetSimP = this.sim.players[tm.id];
        if (targetSimP) {
          const isTargetOffside = isHome
            ? targetSimP.x > offsideLineX + 0.5
            : targetSimP.x < offsideLineX - 0.5;
          if (isTargetOffside && forwardProgress > 0) {
            aerialScore = -9999; // OFSAYT! Bu pas seçeneğini iptal
          }
        }

        if (aerialScore > currentBestScore) {
          currentBestScore = aerialScore;
          currentType = "AERIAL";
          const aerialLeadTicks = 15;
          finalTx = clamp(
            simTm.x + (simTm.vx || 0) * aerialLeadTicks,
            1,
            PITCH_LENGTH - 1,
          );
          finalTy = clamp(
            simTm.y + (simTm.vy || 0) * aerialLeadTicks,
            1,
            PITCH_WIDTH - 1,
          );
        }
      }

      // Not: Eski "FORCED CROSS OVERRIDE" kaldırıldı
      // Artık forcedAerialCross bonus veriyor ama zorlamıyor

      // === OFF-BALL RUN PASS BONUS ===
      // Koşu yapan takım arkadaşına pas atmak için güçlü bonus
      const candidateSimP = this.sim.players[tm.id] as any;
      if (
        candidateSimP?.offBallRunTarget &&
        candidateSimP.offBallRunTarget.expiresAt > this.tickCount
      ) {
        currentBestScore += 35; // Koşan adama pas bonusu
      }

      // --- FINAL ADJUSTMENTS ---
      if (currentBestScore > maxScore) {
        maxScore = currentBestScore;
        bestTarget = tm;
        bestType = currentType;
        bestTx = finalTx;
        bestTy = finalTy;
      }
    });

    if (maxScore < 20) return null;

    // Debug log kaldirildi - gercek pas aninda loglanacak (updateBallCarrierAI'da)

    return {
      player: bestTarget!,
      score: maxScore,
      type: bestType,
      targetX: bestTx,
      targetY: bestTy,
    };
  }

  private detectObstacles(p: Player, x: number, y: number): Player[] {
    const obstacles: Player[] = [];
    const searchDist = 6;
    this.allPlayers
      .filter((other) => other.lineup === "STARTING")
      .forEach((other) => {
        if (other.id === p.id || other.teamId === p.teamId) return;
        const otherPos = this.sim.players[other.id];
        if (!otherPos) return;
        const d = dist(x, y, otherPos.x, otherPos.y);
        if (d < searchDist) obstacles.push(other);
      });
    return obstacles;
  }

  private findNearestOpponent(
    p: Player,
    x: number,
    y: number,
  ): { player: Player; dist: number } | null {
    let nearest: Player | null = null;
    let minDist = 999;

    for (const other of this.allPlayers) {
      if (
        other.id === p.id ||
        other.teamId === p.teamId ||
        other.lineup !== "STARTING"
      )
        continue;

      const otherPos = this.sim.players[other.id];
      if (!otherPos) continue;

      const d = dist(x, y, otherPos.x, otherPos.y);
      if (d < minDist) {
        minDist = d;
        nearest = other;
      }
    }

    return nearest ? { player: nearest, dist: minDist } : null;
  }

  private findNearestEnemyInCone(p: Player, isHome: boolean): Player | null {
    let nearest: Player | null = null;
    let minD = 10;
    const simP = this.sim.players[p.id];
    const forwardAngle = isHome ? 0 : Math.PI;
    this.allPlayers
      .filter((other) => other.lineup === "STARTING")
      .forEach((other) => {
        // === FIX: EXCESSIVE FOULS ===
        // If game is in a set piece mode, STOP pressing!
        // This prevents defenders from rushing the kicker during free kicks
        if (this.sim.mode !== "PLAYING" && this.sim.mode !== "KICKOFF") return;

        if (other.teamId === p.teamId) return;
        const otherPos = this.sim.players[other.id];
        if (!otherPos) return;
        const d = dist(simP.x, simP.y, otherPos.x, otherPos.y);
        if (d < minD) {
          const angleTo = Math.atan2(otherPos.y - simP.y, otherPos.x - simP.x);
          let diff = Math.abs(forwardAngle - angleTo);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff < Math.PI / 3.5) {
            minD = d;
            nearest = other;
          }
        }
      });
    return nearest;
  }

  // === G MOTORU: AKILLI GERİ DÖNÜŞ (SMART RECOVERY) ===
  // Defans oyuncusu çalım yerse topu kovalamaz, kale önüne koşarak açıyı kapatır.
  private applyDefensiveRecoveryLogic(
    p: Player,
    state: PlayerState,
    isHome: boolean,
  ): boolean {
    // Oyuncu oyunda mı kontrolü
    const simP = this.sim.players[p.id];
    if (!simP) return false;

    const b = this.sim.ball;
    const ballSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

    // Bu mantık sadece top hızlıysa ve rakip hücum ediyorsa devreye girer
    // Ev sahibi için rakip sağa saldırır (vx > 0.5), Deplasman için sola (vx < -0.5)
    const isAttacking = isHome ? b.vx < -0.5 : b.vx > 0.5;

    // Top hızlı ve tehlikeli geliyorsa (Kontra atak vb.)
    if (ballSpeed > 1.2 && isAttacking) {
      // Topun 1.5 saniye sonraki tahmini konumu (Intercept Point)
      const interceptX = b.x + b.vx * 45; // 30 tick = 1 sn
      const interceptY = b.y + b.vy * 45;

      // Eğer top benim savunma bölgeme geliyorsa (Kendi yarı saham)
      const isDangerous = isHome ? interceptX < 50 : interceptX > 55;

      if (isDangerous) {
        // Kilit Nokta: Topa değil, topun GİDECEĞİ yere koş (Smart Cut)
        const distToIntercept = dist(simP.x, simP.y, interceptX, interceptY);

        // Eğer topun gideceği yere 40 metreden yakınsam (yetişme şansım varsa)
        if (distToIntercept < 40) {
          // Hedef: Top ile Kale arasına girmek
          state.targetX = interceptX;
          state.targetY = interceptY;

          // SPRINT! Can havliyle koş
          this.applySteeringBehavior(
            p,
            interceptX,
            interceptY,
            MAX_PLAYER_SPEED * 1.05,
          );
          simP.state = "SPRINT";

          // Başarılı oldu, bu tur için başka karar verme
          return true;
        }
      }
    }
    return false;
  }

  private updateOffBallAI(
    p: Player,
    isHome: boolean,
    teamHasBall: boolean,
    ballInPlay: boolean,
    offsideLineX: number,
    goalX: number,
  ) {
    if (!this.sim.players[p.id]) return;

    const simP = this.sim.players[p.id];
    const role = this.playerRoles[p.id];
    const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;
    const ballX = this.sim.ball.x;
    const ballY = this.sim.ball.y;
    const myGoalX = isHome ? 0 : PITCH_LENGTH; // Moved here for scope visibility

    // === 1. MUTLAK ÖNCELİK: TOP BANA GELİYOR (G MOTORU RUHU) ===
    // Eğer top bana geliyorsa, her şeyi bırak topa sprint at!
    if ((this.sim.ball as any).targetId === p.id && !this.sim.ball.ownerId) {
      // TOPU KARŞILAMA (MEET THE BALL) - PHYSICS BASED PREDICTION
      // Topun şu anki konumuna değil, ENERJİ KAYBETTİĞİ noktaya koş (Drop Zone)
      const b = this.sim.ball;
      const distToBall = dist(simP.x, simP.y, b.x, b.y);

      let targetX = b.x;
      let targetY = b.y;

      // Hava Topu Mantığı (Gravity Prediction)
      if (b.z > 0.5) {
        // Top havada! Nereye düşecek?
        // H = H0 + Vz*t - 0.5*g*t^2
        // Z = 0 olduğu zamanı bul (Quadratic Formula)
        const g = 0.2; // GRAVITY constant
        const vz = b.vz;
        const z = b.z;

        // t = (-vz - sqrt(vz^2 - 4(-0.5g)z)) / -g
        // t = (vz + sqrt(vz^2 + 2gz)) / g
        const term = Math.sqrt(vz * vz + 2 * g * z);
        const timeToLand = (vz + term) / g;

        // Landing Point Calculation with Air Drag
        // Drag reduces speed by factor (0.98^t)
        // Approx distance = v * (1 - drag^t) / (1 - drag)
        // Basitleştirilmiş: v * t * 0.8 (Drag etkisi)
        const AIR_DRAG_ESTIMATE = 0.98;
        const dragFactor =
          (1 - Math.pow(AIR_DRAG_ESTIMATE, timeToLand)) /
          (1 - AIR_DRAG_ESTIMATE);

        targetX = b.x + b.vx * dragFactor;
        targetY = b.y + b.vy * dragFactor;

        // Eğer top çok yüksekse (z > 3), oyuncu tam düşeceği yere gidip beklemeli
        // Eğer alçalıyorsa (vz < 0), topa doğru hamle yapabilir
        if (distToBall > 5 && timeToLand > 10) {
          // Henüz düşmesine vakit var, sakince oraya git
          targetX = lerp(simP.x, targetX, 0.8);
          targetY = lerp(simP.y, targetY, 0.8);
        }
      } else if (distToBall > 5) {
        // Yerden gidiyor, önleyici koşu
        targetX = lerp(simP.x, b.x + b.vx * 10, 0.5);
        targetY = lerp(simP.y, b.y + b.vy * 10, 0.5);
      }

      this.applySteeringBehavior(p, targetX, targetY, MAX_PLAYER_SPEED);
      simP.state = "SPRINT";
      simP.facing = Math.atan2(targetY - simP.y, targetX - simP.x);
      return;
    }

    // === SMART SIGNAL RESPONSE: HOLD ===
    // Takım arkadaşım "HOLD" (Bekle/Yardım Et) diyorsa, ona doğru koş!
    // Sadece yakınlardaysam (50m) ve ofansif pozisyondaysam
    if (teamHasBall) {
      const teammates = isHome ? this.homePlayers : this.awayPlayers;
      for (const tm of teammates) {
        if (tm.id === p.id) continue;
        // HOLD sinyali var mı?
        const tmState = this.playerStates[tm.id];
        if (tmState?.outgoingSignal?.type === "HOLD") {
          const d = dist(
            simP.x,
            simP.y,
            this.sim.players[tm.id].x,
            this.sim.players[tm.id].y,
          );
          if (d < 50 && d > 10) {
            // Çok yakın değilsem
            // Ona doğru destek koşusu
            this.applySteeringBehavior(
              p,
              this.sim.players[tm.id].x,
              this.sim.players[tm.id].y,
              MAX_PLAYER_SPEED * 0.9,
            );
            simP.state = "SPRINT";
            return; // Başka bir şey yapma, yardıma git!
          }
        }
      }
    }

    // ============================================================
    // === G MOTORU: DEFANSİF ZEKA ÇAĞRISI (SMART RECOVERY) ===
    // ============================================================
    // Eğer defans veya orta saha oyuncusuysam ve takım kontra yiyorsa, akıllı koşu yap
    if (role === Position.DEF || (role === Position.MID && !teamHasBall)) {
      // Fonksiyonu çağır, eğer "Evet, koşuyorum" derse (true dönerse), işlemi bitir.
      // FIX: MID oyuncuları HÜCUMDA recovery'e çekilmesin! Sadece savunmada çağrılsın.
      const recoveryActive = this.applyDefensiveRecoveryLogic(
        p,
        this.playerStates[p.id],
        isHome,
      );
      if (recoveryActive) return;
    }
    // ============================================================
    let speedMod = MAX_PLAYER_SPEED * 0.6;
    let targetX, targetY;
    // baseOffsets artık direkt motor koordinatlarında (105x68)
    const base = this.baseOffsets[p.id];

    // FIX: Substitution Crash - baseOffsets might not be ready
    if (!base) return;

    const baseY = isHome ? base.y : PITCH_WIDTH - base.y;
    const baseX = isHome ? base.x : PITCH_LENGTH - base.x;

    // Kanat Oyuncuları (LWM, RWM, LW, RW) için özel ayar
    const isWinger = role === Position.MID && (base.y < 20 || base.y > 48);

    // === PRIORITY 1: OFSAYT RECOVERY (MUTLAK ÖNCELİK) ===
    // Takım topu kaybetmiş olsa da defansın arkasında kalan oyuncu (Ofsayttaki adam) hızla geri dönmeli!
    if (role === Position.FWD || isWinger) {
      const offsideBuffer = teamHasBall ? 0.2 : 1.0; // Top rakipteyken biraz esneme payı
      const isOnside = isHome
        ? simP.x < offsideLineX - offsideBuffer
        : simP.x > offsideLineX + offsideBuffer;

      // Eğer oyuncu ofsayttaysa veya takım atak yerken defansın çok ötesinde çaresiz kaldıysa:
      if (!isOnside) {
        this.playerStates[p.id].isPressing = false;
        // Hedef: Çizginin 4m gerisi (G Motoru Standardı)
        const recoveryX = isHome ? offsideLineX - 4.0 : offsideLineX + 4.0;
        // Y ekseninde kendi pozisyonunu koru ama hafifçe merkeze kay (çarpışma önlemek için)
        const recoveryY = lerp(simP.y, baseY, 0.2);

        const recoverySpeed = MAX_PLAYER_SPEED * 1.15; // PANIC SPEED (%115)
        simP.state = "SPRINT";
        simP.facing = Math.atan2(
          baseY - simP.y,
          (isHome ? 0 : PITCH_LENGTH) - simP.x,
        ); // Arkaya bak

        this.applySteeringBehavior(p, recoveryX, recoveryY, recoverySpeed);
        return; // MUTLAK RETURN - Başka kod çalışamaz!
      }
    }

    // === SÜRÜ MENTALİTESİ ENGELLEYİCİ ===
    // Takım arkadaşları ile minimum mesafe kontrolü
    const teammates = isHome
      ? this._cachedHomeStarters
      : this._cachedAwayStarters;
    const MIN_TEAMMATE_DISTANCE = 8; // Minimum 8 birim uzaklık

    // Yakındaki takım arkadaşlarını bul
    let nearbyTeammates: {
      id: string;
      x: number;
      y: number;
      role: Position;
    }[] = [];
    teammates.forEach((tm) => {
      if (tm.id === p.id) return;
      const tmPos = this.sim.players[tm.id];
      if (!tmPos) return;
      const d = dist(simP.x, simP.y, tmPos.x, tmPos.y);
      if (d < MIN_TEAMMATE_DISTANCE * 2) {
        nearbyTeammates.push({
          id: tm.id,
          x: tmPos.x,
          y: tmPos.y,
          role: this.playerRoles[tm.id],
        });
      }
    });

    // Aynı rolde yakın oyuncu var mı? (örn: 2 forvet yan yana)
    const sameRoleNearby = nearbyTeammates.filter((tm) => tm.role === role);
    const tooCloseTeammates = nearbyTeammates.filter(
      (tm) => dist(simP.x, simP.y, tm.x, tm.y) < MIN_TEAMMATE_DISTANCE,
    );

    // === UNIVERSAL INITIALIZATION (MOVED UP) ===
    // baseOffsets artık direkt motor koordinatlarında (105x68)
    const baseTargetX = isHome ? base.x : PITCH_LENGTH - base.x;
    const baseTargetY = isHome ? base.y : PITCH_WIDTH - base.y;
    targetX = baseTargetX;
    targetY = baseTargetY;
    speedMod = MAX_PLAYER_SPEED * 0.65;

    // Custom pozisyon varsa daha sıkı takip et
    const tactic_local = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;
    const hasCustomPos =
      tactic_local.customPositions && tactic_local.customPositions[p.id];

    // --- [GÜNCELLEME: ESNEK POZİSYON LİMİTLERİ] ---
    // 4 ve 6 olan değerler orta sahaları hapsediyor.
    // Hücumda bu sınırları otomatik genişletiyoruz.
    let maxDriftX = teamHasBall ? 35 : hasCustomPos ? 8 : 12;
    let maxDriftY = teamHasBall ? 15 : hasCustomPos ? 6 : 10;

    // === PLAYER INSTRUCTION: Read instruction early, enforce AFTER lineH ===
    const offBallInstruction = this.getPlayerInstruction(p);

    // Pre-lineH: Only apply HoldPosition drift limits (rest enforced post-lineH)
    if (offBallInstruction === 'HoldPosition') {
      maxDriftX = Math.min(maxDriftX, 6);
      maxDriftY = Math.min(maxDriftY, 5);
    }

    // PHASE 10: Run Flags (Top Level Scope)
    let isMakingRun = false;
    let bypassDriftLimit = false;

    // Note: Previous 'MID Roam' block removed to prevent double-counting drift modifiers.
    // We will handle all drift logic in one place below.

    // === GENİŞLİK (WIDTH) - ORGANİK POZİSYON ALMA ===
    let widthOffset = 1.0;

    // Kanat Oyuncuları (LWM, RWM, LW, RW) için özel ayar (YUKARI TAŞINDI)

    // FIX: BOX INSTINCT (CEZA SAHASI İÇİNDE GENİŞLİK YUMUŞATILMIŞ GEÇİŞ)
    // JİTTER ÖNLEYİCİ: Oyuncu ceza sahasına yaklaştıkça genişlik taktiğinden kademeli olarak merkeze odaklanmaya geçer.
    let boxBlend = 0; // 0 = Full Width (Outside box), 1 = Full Center Box Focus
    const distToEndLine = isHome ? PITCH_LENGTH - simP.x : simP.x;
    if (distToEndLine < 30) {
      boxBlend = Math.max(0, Math.min(1, (30 - distToEndLine) / 15)); // 30m'den 15m'ye transition (smooth slide)
    }

    const wingerWideY = targetY < PITCH_CENTER_Y ? 5 : PITCH_WIDTH - 5;
    const wingerNarrowY = targetY < PITCH_CENTER_Y ? 20 : PITCH_WIDTH - 20;
    const boxTargetY = targetY < PITCH_CENTER_Y ? GOAL_Y_TOP : GOAL_Y_BOTTOM;

    if (tactic.width === "Wide") {
      widthOffset = lerp(1.3, 0.8, boxBlend);
      if (isWinger) targetY = lerp(wingerWideY, boxTargetY, boxBlend);
    } else if (tactic.width === "Narrow") {
      widthOffset = lerp(0.7, 0.9, boxBlend);
      if (isWinger) targetY = lerp(wingerNarrowY, boxTargetY, boxBlend);
    } else {
      // Balanced
      widthOffset = lerp(1.0, 0.8, boxBlend);
      if (isWinger) targetY = lerp(targetY, boxTargetY, boxBlend);
    }

    // Defans oyuncuları genişlikten daha az etkilenir (Disiplin)
    if (role === Position.DEF) widthOffset = 1.0 + (widthOffset - 1.0) * 0.5;

    // Normal oyuncular için orantılı genişleme
    if (!isWinger) {
      targetY = PITCH_CENTER_Y + (targetY - PITCH_CENTER_Y) * widthOffset;
    }

    if (teamHasBall) {
      // --- OF-BALL MOVEMENT (HÜCUM STİLİNE GÖRE) ---
      this.playerStates[p.id].isPressing = false;

      // 1. Maintain Formation Structure (Temel Pozisyon) & DYNAMIC SUPPORT
      let lineH = isHome ? Math.min(95, ballX - 15) : Math.max(10, ballX + 15);

      // DYNAMIC SUPPORT: DEFENDER STEP UP
      // Top bizdeyken defans hattı orta sahaya kadar çıkabilir (Kademeli Oyun)
      if (role === Position.DEF) {
        const ballInOppHalf = isHome
          ? ballX > PITCH_CENTER_X
          : ballX < PITCH_CENTER_X;

        if (ballInOppHalf) {
          // Top rakip yarı sahadaysa, defans arkadan destek verir
          // Taktiksel hatta göre itilme miktarı (Deep: daha geriden, High: daha önden)
          const pushOffset =
            tactic.defensiveLine === "High"
              ? -15
              : tactic.defensiveLine === "Deep"
                ? -35
                : -25;
          lineH = isHome
            ? Math.min(55, ballX + pushOffset)
            : Math.max(50, ballX - pushOffset);
        } else {
          // Top kendi yarı sahamızda
          if (tactic.defensiveLine === "High") {
            lineH = isHome ? Math.min(80, ballX - 5) : Math.max(20, ballX + 5);
          } else if (tactic.defensiveLine === "Deep") {
            lineH = isHome
              ? Math.max(10, ballX - 35)
              : Math.min(95, ballX + 35);
          } else {
            // Normal Hat
            lineH = isHome
              ? Math.min(80, ballX - 15)
              : Math.max(20, ballX + 15);
          }
        }
      } else {
        // Forvetler ve Ortasahalar formasyon bazlı lineH kullanır (Defensive line onlara o kadar etki etmez)
        // İstisna: Takım olarak çok gerideysek (`Deep` ise ve top kendi yarısahalarındaysa) biraz da onlar geriye gelir
        if (tactic.defensiveLine === "Deep") {
          lineH = isHome ? Math.min(85, ballX - 5) : Math.max(20, ballX + 5);
        }
      }

      // === KADEMELİ ORTA SAHA (ORGANİK HÜCUM - REFINED v2) ===
      // CDM / CM / CAM mevkisine göre farklı derinlikte konumlanır
      // FIX: Offsets reduced significantly to fix "stuck in midfield" issue
      if (role === Position.MID) {
        const midAttackPhase = isHome ? ballX > 40 : ballX < 65;
        if (midAttackPhase) {
          // Oyuncunun taktik mevkisi yüzdesi (CDM ~38%, CM ~50%, CAM ~62%)
          const myBasePercent = isHome
            ? (base.x / PITCH_LENGTH) * 100
            : ((PITCH_LENGTH - base.x) / PITCH_LENGTH) * 100;

          let midOffset: number;
          if (myBasePercent <= 45) {
            midOffset = 15; // CDM: 22 -> 15m (Daha yakın destek)
          } else if (myBasePercent <= 55) {
            midOffset = 8; // CM: 12 -> 8m (Ceza yayına yaklaş)
          } else {
            midOffset = -2; // CAM: 2 -> -2 (Topun önüne geç, forveti besle)
          }

          const midPushH = isHome
            ? clamp(ballX - midOffset, PITCH_CENTER_X - 5, 95) // CenterX -> CenterX-5 (Allow crossing line)
            : clamp(ballX + midOffset, 10, PITCH_CENTER_X + 5);
          lineH = isHome
            ? Math.max(lineH, midPushH)
            : Math.min(lineH, midPushH);
        }
      }

      targetX = isHome ? Math.max(targetX, lineH) : Math.min(targetX, lineH);

      // 2. Support Runs (DESTEK KOŞULARI - STİL MANTIĞI)
      const ballCarrierId = this.sim.ball.ownerId;
      const distToBall = dist(simP.x, simP.y, ballX, ballY);

      // === MIDFIELD POCKET FINDER (BOŞLUK ARAMA) ===
      // Orta sahalar rakip hatlar arasına girmeli
      if (role === Position.MID && distToBall < 40 && distToBall > 10) {
        // Etrafımdaki düşman yoğunluğuna bak
        const myObstacles = this.detectObstacles(p, simP.x, simP.y);
        if (myObstacles.length > 0) {
          // Dolu alandayım -> Boşluğa kay!
          // Rastgele yakın bir nokta seç ve kontrol et
          const angle = Math.random() * Math.PI * 2;
          const testX = simP.x + Math.cos(angle) * 8;
          const testY = simP.y + Math.sin(angle) * 8;
          const testObstacles = this.detectObstacles(p, testX, testY);

          if (testObstacles.length === 0) {
            // Orası boş! Oraya git
            targetX = lerp(targetX, testX, 0.5);
            targetY = lerp(targetY, testY, 0.5);
          }
        }
      }

      // === ORTA SAHA & KANAT DESTEK KOŞUSU ===
      // Takım arkadaşı topla ileri gidince MID/kanat beklemez, ileri çıkar.
      // GUARD: DefendMore/HoldPosition/StayBack oyuncuları destek koşusu YAPMAZ!
      if (role === Position.MID && ballCarrierId && ballCarrierId !== p.id
        && offBallInstruction !== 'DefendMore' && offBallInstruction !== 'HoldPosition' && offBallInstruction !== 'StayBack') {
        const carrier = this.getPlayer(ballCarrierId);
        const carrierPos = this.sim.players[ballCarrierId];
        if (carrier && carrierPos && carrier.teamId === p.teamId) {
          const distToCarrier = dist(
            simP.x,
            simP.y,
            carrierPos.x,
            carrierPos.y,
          );
          // Taşıyıcı benden en az 5m önde mi?
          const isBehindCarrier = isHome
            ? simP.x < carrierPos.x - 5
            : simP.x > carrierPos.x + 5;
          // Hücum fazı: top kendi son üçte birinin dışında
          const isForwardPhase = isHome ? ballX > 35 : ballX < 70;

          if (
            isBehindCarrier &&
            isForwardPhase &&
            distToCarrier > 6 &&
            distToCarrier < 35
          ) {
            if (isWinger) {
              // KANAT: Orta atmak için kanattan ileri çık
              const wingSide = simP.y < PITCH_CENTER_Y ? "left" : "right";
              const advWingX = isHome
                ? Math.min(carrierPos.x + 18, PITCH_LENGTH - 6)
                : Math.max(carrierPos.x - 18, 6);
              const bylineY = wingSide === "left" ? 4 : PITCH_WIDTH - 4;

              targetX = advWingX;
              targetY = lerp(targetY, bylineY, 0.45);
              speedMod = MAX_PLAYER_SPEED; // Tam sprint
              simP.state = "SPRINT";
            } else {
              // MERKEZ OM: Taşıyıcının önüne geç (8m -> 15m)
              const advX = isHome
                ? Math.min(carrierPos.x + 15, offsideLineX - 2)
                : Math.max(carrierPos.x - 15, offsideLineX + 2);
              const yDir = simP.y < PITCH_CENTER_Y ? -1 : 1;
              const supY = carrierPos.y + 10 * yDir;

              targetX = advX;
              targetY = lerp(targetY, supY, 0.3);
              speedMod = MAX_PLAYER_SPEED * 0.9;
              simP.state = "RUN";
            }
            bypassDriftLimit = true;
            isMakingRun = true; // Sonraki blokların override etmesini engelle
          }
        }
      }

      if (distToBall < 50 && role !== Position.GK) {
        // === G MOTORU: VER-KAÇ DOSYASI (ONE-TWO DESTEK KOŞUSU) ===
        if (
          this.playerStates[p.id]?.supportRunUntil &&
          this.playerStates[p.id].supportRunUntil! > this.tickCount
        ) {
          // Oyuncu pas atmış ve ileri koşu emri almış (Ver-kaç koşusu yapıyor)
          const attackDir = isHome ? 1 : -1;
          targetX += 18 * attackDir; // Hızla ileri fısa

          // Boşluğa doğru koş (Kanatsa kanata, forvetse merkeze)
          if (isWinger) {
            targetY = simP.y < PITCH_CENTER_Y ? 6 : PITCH_WIDTH - 6;
          } else if (role === Position.FWD) {
            targetY = lerp(targetY, PITCH_CENTER_Y, 0.4); // Kaleye doğru
          }

          speedMod = MAX_PLAYER_SPEED * 1.05; // Depar
          simP.state = "SPRINT";
          bypassDriftLimit = true;
          isMakingRun = true;
          this.emitTeamSignal(p, "POINT"); // "Önüme at!"
        }

        // === STİL: POSSESSION (Topa Yaklaş / Come Short) ===
        if (tactic.style === "Possession") {
          // Herkes topa bir adım yaklaşır (Pas opsiyonu ol)
          const supportDist = 12; // Çok yakın
          if (distToBall > supportDist) {
            // Topa doğru vektör
            targetX = lerp(targetX, ballX, 0.15);
            targetY = lerp(targetY, ballY, 0.15);
          }
        }

        // === STİL: COUNTER (Boşluğa Kaç / Run Behind) ===
        else if (tactic.style === "Counter") {
          // Forvetler ve Kanatlar hızlıca savunma arkasına sarkmaya çalışır
          if (role === Position.FWD || isWinger) {
            const oppGoalX_local = isHome ? PITCH_LENGTH : 0;
            const distToOppGoal = Math.abs(simP.x - oppGoalX_local);
            // Ceza sahası içindeyken daha fazla fırlayıp ofsayta düşmesin
            if (distToOppGoal > 15) {
              const attackDir = isHome ? 1 : -1;
              targetX += 8 * attackDir; // 15'ten 8'e düşürüldü. Kopukluk önlendi.
              speedMod = MAX_PLAYER_SPEED * 0.95;
              if (Math.random() < 0.03) this.emitTeamSignal(p, "POINT"); // Spam engeli
            }
          }
        }

        // === STİL: ATTACKING (Bekler İleri) ===
        else if (tactic.style === "Attacking") {
          // Bekler (DEF ve kenardakiler) bindirme yapar (Overlap)
          const isFullBack =
            role === Position.DEF && Math.abs(simP.y - PITCH_CENTER_Y) > 20;
          if (isFullBack) {
            const oppGoalX_local = isHome ? PITCH_LENGTH : 0;
            const distToOppGoal = Math.abs(simP.x - oppGoalX_local);
            // Sonsuza dek bindirmeyi engelle: Çok ilerdelerse veya yorgunlarsa dön
            if (
              distToOppGoal > 30 &&
              (this.playerStates[p.id]?.currentStamina || 100) > 30
            ) {
              const attackDir = isHome ? 1 : -1;
              targetX += 12 * attackDir; // 20'den 12'ye düşürüldü, risk azaldı
            }
          }
        }

        // Kanat ve derinlik tespiti (cut-back ve çapraz koşu için)
        const isBallWide = ballY < 20 || ballY > 48;
        const isBallDeep = isHome ? ballX > 62 : ballX < 43; // 70 -> 62: daha erken box girişi
        // Not: FWD cut-back receiver koşusu LINE BREAKER bloğunda (aşağıda) işleniyor

        // === MIDFIELD REBOUND SUPPORT (DÖNEN TOP TAKİBİ) ===
        // Top rakip ceza sahasına yakınsa, orta sahalar ceza yayı (D-Zone) civarında pusuya yatsın
        const oppGoalX_local = isHome ? PITCH_LENGTH : 0;

        if (
          role === Position.MID &&
          isBallDeep &&
          Math.abs(ballX - oppGoalX_local) < 35 &&
          !isMakingRun
        ) {
          if (isBallWide && !isWinger) {
            // === CUT-BACK DESTEK: Kanat topunda orta saha ceza noktasına koşar ===
            const penaltySpotX = isHome ? PITCH_LENGTH - 11 : 11;
            const cutbackOffsetY = (p.lineupIndex || 0) % 2 === 0 ? -9 : 9;
            targetX = penaltySpotX; // FIX: lerp(simP.x,...) Zeno paradoksu! Direkt hedef ver.
            targetY = lerp(targetY, PITCH_CENTER_Y + cutbackOffsetY, 0.4);
            speedMod = MAX_PLAYER_SPEED * 0.9;
            simP.state = "RUN";
            bypassDriftLimit = true;
            isMakingRun = true;
          } else {
            // D-Zone: Ceza yayında top bekle (orta top için)
            const edgeOfBoxX = isHome ? PITCH_LENGTH - 19 : 19; // 80→86m (ceza sahası çizgisine yakın)
            targetX = edgeOfBoxX; // FIX: lerp(simP.x,...) Zeno paradoksu! Direkt hedef ver.
            targetY = lerp(PITCH_CENTER_Y, ballY, 0.3);
            speedMod = MAX_PLAYER_SPEED * 0.8; // 0.7→0.8 (daha istekli gelsinler)
            simP.state = "RUN";
          }
        }

        // === ROAM FROM POSITION: HÜCUMDA YARATICI ALAN DEĞİŞİMİ ===
        // Serbest Dolaş talimatı artık herkesi forvet yapıp ofsayta itmiyor, sadece "Half Space"lere sızdırıyor.
        const roamInstr =
          tactic.instructions &&
          tactic.instructions.includes("RoamFromPosition");
        if (
          roamInstr &&
          (role === Position.MID || role === Position.FWD) &&
          !isMakingRun
        ) {
          const isAttackingThird = isHome ? ballX > 60 : ballX < 45;
          if (isAttackingThird && distToBall < 50) {
            const staminaOk =
              (this.playerStates[p.id]?.currentStamina || 100) > 40;
            const roamProb = staminaOk
              ? 0.05 + p.attributes.positioning / 1500
              : 0.01;

            if (simP.state !== "SPRINT" && Math.random() < roamProb) {
              // Sadece Y ekseninde ufak kaymalar (Channel drift) - Kendi kulvarının 10m yakınına esner
              const driftDir = Math.random() > 0.5 ? 10 : -10;
              targetY = clamp(base.y + driftDir, 10, PITCH_WIDTH - 10);

              // X ekseninde çok az ekstra ileri kayma
              const attackDir = isHome ? 1 : -1;
              targetX = clamp(base.x + 5 * attackDir, 10, 95);

              speedMod = MAX_PLAYER_SPEED * 0.85; // Normal koşu, deli gibi depar değil
              simP.state = "RUN";
              // bypassDriftLimit İPTAL EDİLDİ: Formasyon zinciri kırılmaz, sahanın ortasında toplanmazlar
              isMakingRun = true;
            }
          }
        }

        // === ROAM FROM POSITION: GERÇEK ROAMING (offBallRunTarget sistemi) ===
        // Her 90 tick'te rastgele bir hedef ata, 60 tick boyunca geçerli
        if (offBallInstruction === 'RoamFromPosition' && p.id !== this.sim.ball.ownerId) {
          const existingRun = (simP as any).offBallRunTarget;
          const hasActiveRun = existingRun && existingRun.expiresAt > this.tickCount;
          if (!hasActiveRun && this.tickCount % 90 === Math.abs(p.id.charCodeAt(0) % 90)) {
            const attackDir = isHome ? 1 : -1;
            const roamOffsetX = (Math.random() - 0.5) * 16; // ±8m X
            const roamOffsetY = (Math.random() - 0.5) * 30; // ±15m Y
            const roamX = clamp(base.x + roamOffsetX * attackDir, 8, PITCH_LENGTH - 8);
            const roamY = clamp(base.y + roamOffsetY, 4, PITCH_WIDTH - 4);
            (simP as any).offBallRunTarget = {
              x: roamX,
              y: roamY,
              expiresAt: this.tickCount + 60,
            };
          }
        }

        // === FORVET & SALDIRGAN ORTA SAHA YAPAY ZEKASI ===
        // Sadece 'Attacking' stil değil: top hücum bölgesinde (>42m) ise tüm MID'ler koşabilir
        const isMidAttacking =
          role === Position.MID &&
          teamHasBall &&
          (isHome ? ballX > 42 : ballX < 63);
        if (role === Position.FWD || isMidAttacking) {
          // =========================================================================================
          // === G MOTORU: LINE BREAKER (SAVUNMA ARKASINA SIZMA) - ÖNCELİKLİ HÜCUM MODU (PHASE 11) ===
          // =========================================================================================
          // Bu blok, forvetlerin ve saldırgan orta sahaların "formasyon koruma" derdini yok eder.
          if (role === Position.FWD || isMidAttacking) {
            const ballCarrier = this.getPlayer(this.sim.ball.ownerId || "");

            // 1. Top bizde mi ve topu taşıyan başkası mı?
            if (teamHasBall && ballCarrier && ballCarrier.id !== p.id) {
              const carrierPos = this.sim.players[ballCarrier.id];
              const distToCarrier = dist(
                simP.x,
                simP.y,
                carrierPos.x,
                carrierPos.y,
              );

              // 2. Top rakip yarı sahada mı? (Hücum başladı mı?)
              const isAttackingPhase = isHome ? ballX > 45 : ballX < 60;

              // 3. Önümde boşluk var mı? (Ofsayt çizgisine kadar)
              const distToOffsideLine = Math.abs(simP.x - offsideLineX);

              // ŞARTLAR SAĞLANIYORSA KOŞU BAŞLAT!
              if (isAttackingPhase && distToCarrier < 40) {
                // Topa 40m mesafedeysem ve hücumdaysak

                // === CUT-BACK ALICISI (GERİYE ÇIKARMA KOŞUSU) ===
                // Top kanalda ve çok derinse (byline bölgesi) → Ceza noktasına koş!
                // Kanattan gelen topun "geri çekme" pasını karşıla
                const isBallNearByline = isBallWide && isBallDeep;
                if (isBallNearByline) {
                  // Ceza noktası: kale çizgisinden 11m içeride
                  const penaltySpotX = isHome ? PITCH_LENGTH - 11 : 11;
                  // İki forvet ayrı koridora dağılsın: sol half-space ve sağ half-space
                  const cutbackOffsetY =
                    (p.lineupIndex || 0) % 2 === 0 ? -9 : 9;
                  targetX = penaltySpotX;
                  targetY = lerp(
                    targetY,
                    PITCH_CENTER_Y + cutbackOffsetY,
                    0.55,
                  );
                  speedMod = MAX_PLAYER_SPEED * 1.1;
                  simP.state = "SPRINT";
                  bypassDriftLimit = true;
                  isMakingRun = true;
                  this.applySteeringBehavior(p, targetX, targetY, speedMod);
                  return;
                }

                // === G MOTORU: AGGRESSIVE OVERLAP (PHASE 12) ===
                // Eğer top taşıyanın GERİSİNDEYSEM veya YANINDAYSAM (X ekseni)
                // Durma! Top taşıyanı GEÇ ve öne koş!
                const isBehindOrLevel = isHome
                  ? simP.x <= carrierPos.x + 5
                  : simP.x >= carrierPos.x - 5;

                if (isBehindOrLevel) {
                  // HEDEF: Top taşıyanın 15-20m önüne geç
                  const overlapDist = 20;
                  let targetX_Overlap = isHome
                    ? carrierPos.x + overlapDist
                    : carrierPos.x - overlapDist;

                  // Ofsayt çizgisiyle sınırla
                  targetX_Overlap = isHome
                    ? Math.min(targetX_Overlap, offsideLineX - 0.5)
                    : Math.max(targetX_Overlap, offsideLineX + 0.5);
                  targetX = targetX_Overlap;

                  // Y Ekseni: Topun olduğu koridordan biraz açıl
                  // FIX (Phase 13): Çok fazla açılma! (Half-Space Koşusu)
                  // Top merkezdeyse -> 10m yana kay (Winger gibi çizgiye basma)
                  if (Math.abs(carrierPos.y - PITCH_CENTER_Y) < 15) {
                    const splitDir = simP.y < PITCH_CENTER_Y ? -1 : 1;
                    targetY = PITCH_CENTER_Y + 12 * splitDir;
                  } else {
                    targetY = carrierPos.y < PITCH_CENTER_Y ? 48 : 20;
                  }

                  speedMod = MAX_PLAYER_SPEED * 1.15;
                  simP.state = "SPRINT";
                  bypassDriftLimit = true;
                  isMakingRun = true;

                  if (this.tickCount % 20 === 0)
                    this.emitTeamSignal(p, "POINT");
                }

                // === AKILLI KOŞU SİSTEMİ (INCOMING_PASS SİNYALİ İLE) ===
                // Forvet artık körlemesine depar atmaz!
                // Sadece pasçıdan "Top sana geliyor!" sinyali aldığında FULL SPRINT yapar.
                // Yoksa ofsayt çizgisinde akıllıca pozisyon alır.
                const myState = this.playerStates[p.id];
                const hasIncomingPass = myState?.incomingSignal?.type === "INCOMING_PASS" &&
                  myState.incomingSignal.expiryTick > this.tickCount;

                // a) INCOMING_PASS sinyali var → DELİ GİBİ DEPAR!
                if (hasIncomingPass) {
                  const projectedBallX = clamp(
                    ballX + (this.sim.ball.vx || 0) * 15,
                    2,
                    PITCH_LENGTH - 2,
                  );
                  targetX = projectedBallX;

                  // Y Ekseni: Boş koridora koş
                  const ballChannel =
                    ballY < 23 ? "LEFT" : ballY > 45 ? "RIGHT" : "CENTER";

                  if (ballChannel === "CENTER") {
                    targetY = isHome ? baseTargetY : PITCH_WIDTH - baseTargetY;
                  } else {
                    targetY = ballY < 34 ? 45 : 23;
                  }

                  speedMod = MAX_PLAYER_SPEED * 1.15; // %15 Ekstra Hız (Depar)
                  simP.state = "SPRINT";
                  bypassDriftLimit = true;
                  isMakingRun = true;

                  if (Math.random() < 0.15) this.emitTeamSignal(p, "POINT");
                }

                // b) Sinyal YOK → Ofsayt çizgisinde AKILLI BEKLEYİŞ
                // Depar ATMA! Pozisyon al ve hazır ol. Top kaptırılırsa anında dönebilirsin.
                else if (distToOffsideLine > 2.5 && !hasIncomingPass) {
                  // Çizgiye doğru YAVAŞÇA yaklaş (sprint değil, jog)
                  targetX = isHome ? offsideLineX - 2.0 : offsideLineX + 2.0;

                  // Y ekseni: Kendi kanalını koru
                  const ballChannel =
                    ballY < 23 ? "LEFT" : ballY > 45 ? "RIGHT" : "CENTER";
                  if (ballChannel === "CENTER") {
                    targetY = isHome ? baseTargetY : PITCH_WIDTH - baseTargetY;
                  } else {
                    targetY = ballY < 34 ? 45 : 23;
                  }

                  speedMod = MAX_PLAYER_SPEED * 0.75; // Koşu temposu, depar DEĞİL
                  simP.state = "RUN";
                  bypassDriftLimit = true;
                  isMakingRun = true;
                }

                // c) Çizgideyim → Dans et (Markajdan kurtulma)
                else {
                  targetX = isHome ? offsideLineX - 1.5 : offsideLineX + 1.5;
                  targetY = simP.y + Math.sin(this.tickCount * 0.1) * 2.0;

                  speedMod = MAX_PLAYER_SPEED * 0.5; // Hazır kıta bekle
                  bypassDriftLimit = true;
                }

                // Bu mantık çalıştıysa aşağıdakileri ez
                this.applySteeringBehavior(p, targetX, targetY, speedMod);
                return;
              }
            }
          }

          // 1. KANAL AYRIMI (CHANNEL SEPARATION)
          // Forvetlerin birbirine girmesini önlemek için KESİN kanal tercihi
          // Her forvetin kendine ait bir "tercihli koridoru" vardır
          const myIndex = p.lineupIndex || 0;

          // Sol Forvet (Tek index): 22 (Sol İç Koridor - Half Space)
          // Sağ Forvet (Çift index): 46 (Sağ İç Koridor - Half Space)
          // Merkez tek forvet: 34 (Center)
          // Not: 4-3-3 kanat forvetleri zaten 'isWinger' ile yönetiliyor, bu merkez forvetler için
          let preferredChannelY = 34;

          // Takımdaki toplam forvet sayısını hesapla
          const myTeamPlayers = isHome ? this.homePlayers : this.awayPlayers;
          const totalForwards = myTeamPlayers.filter(
            (pl) => this.playerRoles[pl.id] === Position.FWD,
          ).length;

          if (totalForwards >= 2) {
            // Çift forvet (veya daha fazla):
            // Tek numaralı indexler (1, 3, 5...) -> Sol (24)
            // Çift numaralı indexler (0, 2, 4...) -> Sağ (44)
            preferredChannelY = myIndex % 2 !== 0 ? 24 : 44;
          } else {
            preferredChannelY = 34;
          }

          // === CHANNEL MAGNETISM (KANAL MIKNATISI) ===
          // Base targetY üzerine kanal tercihini uygula
          // FIX: Eğer oyuncu zaten bir koşu yapıyorsa (ATTACKING RUN), kanal mıknatısı iptal edilir!
          // Validated: isMakingRun defined at top level

          // === MESAFE KONTROLÜ (COMPACT TRIANGLE - HYBRID) ===
          // G Motoru: Forvetler birbirine daha yakın oynar (8-15m)
          // Eski: 20m uzaklaş -> Yeni: 10m (Compact)
          if (sameRoleNearby.length > 0) {
            const partner = sameRoleNearby[0];
            const distToPartner = dist(simP.x, simP.y, partner.x, partner.y);

            if (distToPartner < 10) {
              // 20m -> 10m (Daha sıkı üçgenler)
              // Çok yakınız! Ayrıl!
              // Ben tercihli kanalımda mıyım?
              const amIInMyChannel = Math.abs(simP.y - preferredChannelY) < 5;
              const isPartnerInMyChannel =
                Math.abs(partner.y - preferredChannelY) < 5;

              if (amIInMyChannel && !isPartnerInMyChannel) {
                // Ben doğrum yerdeyim, o yanlış yerde -> Ben yerimi koru
                targetY = preferredChannelY;
              } else if (!amIInMyChannel && isPartnerInMyChannel) {
                // O doğru yerde, ben yanlış yerdeyim -> Ben kaç
                // Nereye kaç? Diğer tarafa
                targetY = preferredChannelY === 24 ? 38 : 30; // Merkeze doğru kaçma
              } else {
                // İkimiz de yanlış/doğru yerdeysek -> Ben kendi kanalıma git
                targetY = lerp(targetY, preferredChannelY, 0.5);
              }
            }
          }

          // === ATTACKING RUNS (FORVET KOŞULARI - REFINED) ===
          // Takım arkadaşım topla kaleye gidiyorsa, ben de koşu yapmalıyım!
          // Paralel Koşu veya Arka Direk
          if (ballCarrierId && ballCarrierId !== p.id) {
            const carrier = this.getPlayer(ballCarrierId);
            const carrierPos = this.sim.players[ballCarrierId];

            if (carrier && carrierPos) {
              const carrierDistToGoal = Math.abs(
                carrierPos.x - (isHome ? PITCH_LENGTH : 0),
              );
              // Arkadaşım hücumdaysa (<60m - ARTIRILDI, artık orta sahadan başlıyor)
              if (carrierDistToGoal < 60) {
                // Ben topun gerisinde miyim ilerisinde miyim?
                const isAhead = isHome
                  ? simP.x > carrierPos.x
                  : simP.x < carrierPos.x;
                const isNearCarrier =
                  dist(simP.x, simP.y, carrierPos.x, carrierPos.y) < 30; // 30m içindeysem

                if (isAhead && isNearCarrier) {
                  // === PHASE 9: DIAGONAL POST RUNS (ÇAPRAZ KOŞU) ===
                  // Eskiden: "Çapraz koşu yok, kendi tarafında kal"
                  // Şimdi: "Topun olduğu yerin TERSİNDEKİ direğe (Arka Direk) koş!"

                  const ballOnLeft = carrierPos.y < PITCH_CENTER_Y;
                  const ballOnRight = carrierPos.y >= PITCH_CENTER_Y;

                  // Varsayılan Hedef: Arka Direk (Far Post)
                  // Top soldaysa -> Sağ direğe koş (GOAL_Y_BOTTOM)
                  // Top sağdaysa -> Sol direğe koş (GOAL_Y_TOP)
                  let idealY = ballOnLeft ? GOAL_Y_BOTTOM : GOAL_Y_TOP;

                  // Eğer top MERKEZDEYSE (25-43 arası)?
                  // O zaman forvetler çapraz yaparak açılır (Split)
                  const ballCentral = carrierPos.y > 25 && carrierPos.y < 43;
                  if (ballCentral) {
                    // Ben soldaysam -> Sol direğe
                    // Ben sağdaysam -> Sağ direğe
                    // (Çarpışmayı önlemek için)
                    idealY =
                      simP.y < PITCH_CENTER_Y ? GOAL_Y_TOP : GOAL_Y_BOTTOM;
                  } else {
                    // Top kanattaysa -> KALE AĞZINA GİR (Near Post / Far Post Mix)
                    // Biraz rastgelelik ekle ki hepsi arka direğe yığılmasın
                    // %30 ihtimalle Ön Direk (Near Post) koşusu
                    const runToNearPost =
                      (p.id.charCodeAt(0) + this.tickCount) % 10 < 3; // Deterministic Random
                    if (runToNearPost) {
                      idealY = ballOnLeft ? GOAL_Y_TOP : GOAL_Y_BOTTOM;
                    }
                  }

                  targetY = idealY;

                  // HEDEF X: ALTIPASIN İÇİ (Kale Ağzı)
                  // Penaltı noktası değil, direkt kale çizgisine (Goal Line) yakın!
                  // 2m çizgiden, yani "Tap-in" mesafesi.
                  targetX = isHome ? PITCH_LENGTH - 2 : 2;

                  // FIX: DEPAR (Full Sprint + Burst)
                  speedMod = MAX_PLAYER_SPEED * 1.1; // %110 Hız
                  this.emitTeamSignal(p, "POINT");
                  isMakingRun = true;
                  bypassDriftLimit = true; // PHASE 10: Sınırları zorla!

                  // Debug Log (Nadir)
                  if (this.debugTickCounter % 600 === 0) {
                    // this.traceLog.push(`${p.lastName} ${idealY === GOAL_Y_TOP ? 'Sol' : 'Sağ'} direğe çapraz koşu yapıyor!`);
                  }
                } else if (!isAhead && isNearCarrier) {
                  // Gerideyim -> Paralel destek koşusu (Onun hizasına gel)
                  targetX = carrierPos.x;
                  // Y ekseninde arayı aç (Pas açısı yarat)
                  const yDir = simP.y < PITCH_CENTER_Y ? -1 : 1;
                  targetY = carrierPos.y + 15 * yDir;
                  isMakingRun = true;
                  bypassDriftLimit = true; // Paralel koşu için de limit yok
                }
              }
            }
          }

          // FIX: KANAL MIKNATISI SADECE KOŞU YOKSA ÇALIŞIR
          if (!isMakingRun) {
            // %30 oranında kanala çek (Taktiksel genişliği tamamen ezmemek için)
            targetY = lerp(targetY, preferredChannelY, 0.3);
          }

          // === 3. ONE-TWO (VER-KAÇ) & PASS-MOVE ===
          // Pas veren oyuncu durmaz, boşa kaçar!
          // KRİTİK FİX: Top kaptırıldıysa koşuyu İPTAL ET!
          const state = this.playerStates[p.id];
          if (state && state.lastAction === "PASS" && state.lastActionTick) {
            const ticksSincePass = this.tickCount - state.lastActionTick;

            // === OFSAYT KORUMA: Top bizde değilse koşuyu iptal et! ===
            if (!teamHasBall) {
              state.lastAction = "NONE";
              state.lastActionTick = undefined;
              // Top kaybedildi, koşu bitti. Ofsayt recovery devreye girsin.
            }
            // TOP BİZDE: Koş! (Ofsayt çizgisi sınırı targetX cap ile korunuyor)
            else if (ticksSincePass < 180) {
              // 150 -> 180 tick (3 saniye - agresif ama kontrollü)
              const attackDir = isHome ? 1 : -1;

              // Defans arkasına sızma (30m hedef)
              targetX = simP.x + 30 * attackDir;

              // Ofsayt çizgisini 2m'den fazla geçme (defans çizgisinin BİRAZ arkası OK)
              // Bu sayede oyuncu defansın arkasına sarkabilir ama çok ileri gitmez
              targetX = isHome
                ? Math.min(targetX, offsideLineX + 2.0)
                : Math.max(targetX, offsideLineX - 2.0);

              speedMod = MAX_PLAYER_SPEED * 1.20; // İyi depar hızı
              simP.state = "SPRINT";
              isMakingRun = true;
              bypassDriftLimit = true;

              if (ticksSincePass % 40 === 0) this.emitTeamSignal(p, "POINT");
            } else {
              // Süre doldu, normal moda dön
              state.lastAction = "NONE";
            }
          }

          // === 4. SUPPORT BURST (KANAT DESTEĞİ) ===
          const isInFinalThird = isHome ? ballX > 70 : ballX < 35;
          const amIBallOwner = this.sim.ball.ownerId === p.id;

          // Top merkezdeyken kanatlar içeri girmeli (Ters kanat koşusu)
          if (isInFinalThird && !amIBallOwner && !isMakingRun) {
            // Topun yeri: Merkezde mi? (Y: 25-43 arası)
            const isBallCentral = ballY > 25 && ballY < 43;

            // Ben kanatta mıyım? (Y < 15 veya Y > 53)
            const amIWide = simP.y < 15 || simP.y > 53;

            if (isBallCentral && amIWide) {
              // İçeri kat et! (Half-space'e doğru)
              const targetChannel = simP.y < 34 ? 20 : 48;
              targetY = lerp(targetY, targetChannel, 0.4); // %40 oranında içeri kay
              targetX = isHome ? ballX + 2 : ballX - 2; // Top hizasında kal

              // "Support Burst" etiketi
              speedMod = MAX_PLAYER_SPEED * 0.95;
              bypassDriftLimit = true; // PHASE 10: Destek koşusu engellenmesin
            }
          }

          // === 5. SMART PASS REQUEST (AKILLI SİNYAL) ===
          // Gol pozisyonundaysam veya bomboşsam top iste!
          if (isInFinalThird && !amIBallOwner) {
            // Mesafem kaleye yakın mı? (25m)
            const distToGoal = Math.abs(simP.x - (isHome ? PITCH_LENGTH : 0));

            // Önüm açık mı? (Şut açısı)
            // Basit kontrol: Önümde (3m mesafede) rakip var mı?
            const nearestOpponent = isHome
              ? this.awayPlayers
              : this.homePlayers;
            let isMarked = false;
            for (const opp of nearestOpponent) {
              const oppPos = this.sim.players[opp.id];
              if (oppPos && dist(simP.x, simP.y, oppPos.x, oppPos.y) < 2.5) {
                isMarked = true;
                break;
              }
            }

            if (distToGoal < 25 && !isMarked) {
              // MÜKEMMEL POZİSYON! İSTE!
              // Çok sık sinyal atma (her 60 tick - 1 sn)
              const signalKey = p.id + "_lastSignal";
              const lastSignalTime = (state as any)[signalKey] || 0;

              if (this.tickCount - lastSignalTime > 60) {
                this.emitTeamSignal(p, "CALL"); // El kaldır
                (state as any)[signalKey] = this.tickCount;
              }
            }
          }

          if (isInFinalThird && !amIBallOwner && !isMakingRun) {
            // Top bende değil ve hücumdayız

            // A) KOMBİNASYON OYUNU (Ver-Kaç için yaklaş)
            // Çok yakınsam (15m) ve top sıkıştıysa
            if (distToBall < 15 && distToBall > 5) {
              // Hafifçe yaklaş ama dibine girme (Üçgen kur)
              // Topun Y'sine gitme, kendi kanalında kalarak X'te yaklaş
              targetX = lerp(targetX, ballX, 0.3);
              // Y ekseninde kendi kanalını koru! (Dibdibe girmemek için)
              targetY = lerp(targetY, preferredChannelY, 0.6);
            }

            // B) SHOW FEET (Top İsteme) - Half-Space Koşusu
            // Topa dümdüz koşmak yerine, boş alana (half-space) koşarak top iste
            const showFeet =
              (p.attributes.vision > 60 || p.playStyles?.includes("Maestro")) &&
              Math.random() < 0.04;

            if (showFeet) {
              // Top tarafındaki Half-Space'e koş
              const ballSideChannel = ballY < 34 ? 24 : 44;

              // Eğer o kanal dolu değilse oraya koş
              let isChannelBlocked = false;
              for (const tm of sameRoleNearby) {
                if (Math.abs(tm.y - ballSideChannel) < 5)
                  isChannelBlocked = true;
              }

              if (!isChannelBlocked) {
                targetX = isHome ? ballX + 2 : ballX - 2; // Top hizası
                targetY = ballSideChannel;
                speedMod = MAX_PLAYER_SPEED * 0.9;
                this.emitTeamSignal(p, "CALL"); // "Pas at!"
              }
            }
          }
        }

        // === SHADOW STRIKER (ORTA SAHA SIZMASI) ===
        // Forvetler kanata açıldıysa veya boşluk varsa orta saha içeri dalar
        if (
          role === Position.MID &&
          isBallDeep &&
          Math.abs(ballY - PITCH_CENTER_Y) > 15
        ) {
          // Eğer "Gizli Forvet" ise veya ofansif bir rolü varsa
          const isShadowStriker =
            p.playStyles?.includes("Gizli Forvet") ||
            tactic.style === "Attacking" ||
            tactic.mentality === "Attacking";

          if (isShadowStriker && Math.random() < 0.06) {
            // 3%→6% (daha sık sızma koşusu)
            // Penaltı noktasına sürpriz koşu
            targetX = isHome ? PITCH_LENGTH - 12 : 12;
            targetY = PITCH_CENTER_Y;
            speedMod = MAX_PLAYER_SPEED * 0.95;
            simP.state = "SPRINT";
          }
        }
      }

      if (simP.state !== "SPRINT") simP.state = "RUN";

      // === G MOTORU: YARATICI ÖZGÜRLÜK (CREATIVE FREEDOM) ===
      // Sadece gerçekten yetenekli oyuncular veya "Serbest Dolaş" emri alanlar
      const isCreative =
        p.attributes.vision > 85 || p.playStyles?.includes("Gizli Forvet");
      const hasRoamInstruction =
        tactic.instructions && tactic.instructions.includes("RoamFromPosition");

      if (hasRoamInstruction && offBallInstruction !== 'HoldPosition') {
        // Instruction: Significant boost, but not broken
        // HoldPosition player instruction takes priority over team RoamFromPosition
        // Base 6m -> 15m
        maxDriftX = 15;
        maxDriftY = 12;
      } else if (isCreative) {
        // Natural Flair: Slight boost
        // Base 6m -> 10m
        maxDriftX = 10;
        maxDriftY = 8;
      }

      // HÜCUM FAZINDA MID/DEF SINIRLARINI GENİŞLET
      // Top rakip sahada iken oyuncular öne çıkabilmeli
      if (teamHasBall) {
        // Eşik PITCH_CENTER_X'ten (52.5m) 40m'ye düşürüldü:
        // orta sahalar daha erken öne çıkmaya başlasın
        const isAttackingHalf = isHome ? ballX > 40 : ballX < 65;
        if (isAttackingHalf) {
          if (role === Position.MID && !isMakingRun && offBallInstruction !== 'HoldPosition') {
            // Kademeli sistem lineH'de doğru hedefi zaten belirledi (CDM/CM/CAM farklı konumlanır)
            // targetX'i EZME — sadece drift limitini kaldır ve hızı artır
            bypassDriftLimit = true;
            speedMod = MAX_PLAYER_SPEED * 0.85;
            simP.state = "RUN";
          }
          if (role === Position.DEF) maxDriftX = Math.max(maxDriftX, 18);
        }
      }

      // DEFENDERS STAY DISCIPLINED in defense, can step up in attack
      if (role === Position.DEF) {
        const defAttacking =
          teamHasBall &&
          (isHome ? ballX > PITCH_CENTER_X : ballX < PITCH_CENTER_X);
        if (!defAttacking) {
          maxDriftX = Math.min(maxDriftX, 4); // Savunmada dar kal
        } else {
          maxDriftX = Math.min(maxDriftX, 18); // Hücumda öne çık
        }
        maxDriftY = Math.min(maxDriftY, 3); // Kanal disiplinini koru
      }

      if (isCreative || hasRoamInstruction) {
        // Sadece merkeze hafif eğilim, aşırı random kaymalar (jitter) engellendi.
        // maxDriftX zaten onlara hareket özgürlüğünü veriyor
        if ((role as any) === Position.FWD)
          targetY = lerp(targetY, PITCH_CENTER_Y, 0.05);
      }

      // === AŞIRI KAYMA ENGELİ (HÜCUM) ===
      // Oyuncular base pozisyonlarından çok uzaklaşmasın
      // PHASE 10: Eğer bypassDriftLimit açıksa, bu engeli yoksay!
      // --- [DÜZELTME: FORMASYON ZİNCİRİ GEVŞETİLDİ] ---
      if (!bypassDriftLimit) {
        const driftX = targetX - baseTargetX;
        const driftY = targetY - baseTargetY;

        // Orta sahalar hücumdayken drift limitine takılmasın (HoldPosition hariç)
        let effectiveMaxDriftX = maxDriftX;
        if (role === Position.MID && teamHasBall && offBallInstruction !== 'HoldPosition') effectiveMaxDriftX = 55; // 45 -> 55 (Allow box entry)

        if (Math.abs(driftX) > effectiveMaxDriftX) {
          targetX = baseTargetX + Math.sign(driftX) * effectiveMaxDriftX;
        }
        if (Math.abs(driftY) > maxDriftY) {
          targetY = baseTargetY + Math.sign(driftY) * maxDriftY;
        }
      }

      // Fullback Overlap Logic - sadece çok ileri gitmişse
      if (role === Position.DEF) {
        const isWide = simP.y < 17 || simP.y > PITCH_WIDTH - 17;
        const isBallAdvanced = isHome
          ? ballX > PITCH_CENTER_X + 5
          : ballX < PITCH_CENTER_X - 5;
        if (isWide && isBallAdvanced) {
          // Overlap run - ama sınırlı
          const overlapDist = Math.min(15, maxDriftX);
          targetX += isHome ? overlapDist : -overlapDist;
          targetY = lerp(
            targetY,
            simP.y < PITCH_CENTER_Y ? 5 : PITCH_WIDTH - 5,
            0.25,
          );
          speedMod = MAX_PLAYER_SPEED * 0.85;
        }
      }

      // === PLAYER INSTRUCTION: ABSOLUTE ENFORCEMENT (POST-ALL ATTACKING PATTERNS) ===
      // This MUST run at the very end of the teamHasBall block to override all runs/overlaps
      if (offBallInstruction === 'StayBack') {
        // DEF: Never push past midfield, clamp aggressively
        if (isHome) { targetX = Math.min(targetX, PITCH_CENTER_X - 5); }
        else { targetX = Math.max(targetX, PITCH_CENTER_X + 5); }
        maxDriftX = Math.min(maxDriftX, 8);
        bypassDriftLimit = false; // Never break formation for Support Runs
      } else if (offBallInstruction === 'DefendMore') {
        // MID: Stay behind ball, max 10m past center
        const maxForward = isHome ? Math.min(ballX - 10, PITCH_CENTER_X + 10) : Math.max(ballX + 10, PITCH_CENTER_X - 10);
        if (isHome) { targetX = Math.min(targetX, maxForward); }
        else { targetX = Math.max(targetX, maxForward); }
        bypassDriftLimit = false;
      } else if (offBallInstruction === 'JoinAttack') {
        // DEF: Push forward like a wing-back
        const atkPush = isHome ? ballX - 15 : ballX + 15;
        if (isHome) { targetX = Math.max(targetX, Math.min(atkPush, PITCH_LENGTH - 20)); }
        else { targetX = Math.min(targetX, Math.max(atkPush, 20)); }
        maxDriftX = Math.max(maxDriftX, 30);
      } else if (offBallInstruction === 'AttackMore') {
        // MID: Push forward more aggressively
        const atkBoost = 12;
        targetX = isHome ? targetX + atkBoost : targetX - atkBoost;
        maxDriftX = Math.max(maxDriftX, 25);
      } else if (offBallInstruction === 'DropDeep') {
        // FWD: Drop to midfield depth
        const maxFwd = isHome ? Math.min(ballX - 5, PITCH_CENTER_X + 15) : Math.max(ballX + 5, PITCH_CENTER_X - 15);
        if (isHome) { targetX = Math.min(targetX, maxFwd); }
        else { targetX = Math.max(targetX, maxFwd); }
        bypassDriftLimit = false;
      } else if (offBallInstruction === 'HoldPosition') {
        // MID: Enforce strict positional discipline — clamp directly after all bypass logic
        const driftX = targetX - baseTargetX;
        const driftY = targetY - baseTargetY;
        if (Math.abs(driftX) > 6) targetX = baseTargetX + Math.sign(driftX) * 6;
        if (Math.abs(driftY) > 5) targetY = baseTargetY + Math.sign(driftY) * 5;
      }

      if (simP.state !== "SPRINT") simP.state = "RUN"; // FIX: SPRINT override edilmesini engelle!
    } else {
      if (role === Position.FWD) {
        // Defensive Shape - IMPROVED FORWARD DEFENSIVE SUPPORT
        this.playerStates[p.id].isPressing = false;

        // Check if ball is in our own half (More aggressive tracking)
        // User Request: "Forwards should position themselves a bit further back"
        // Old: ballX < 35 (Deep) -> New: ballX < 55 (Just past midfield)
        const isBallInOwnHalf = isHome ? ballX < 55 : ballX > 50;
        const distToBallFromForward = dist(simP.x, simP.y, ballX, ballY);

        if (isBallInOwnHalf) {
          // TACTICAL DEPTH CLAMP (GELİŞTİRİLMİŞ FORVET DEFANSI)
          // Forvetler top rakipteyken ne kadar geriye gelecek?
          // Pressing Intensity: High/Gegenpress -> İLDE KAL (Kontra/Pres için)
          // StandOff (Otobüs) -> GERİ GEL (Defans yap)

          let minForwardDepthX = 45; // Default: Orta saha civarı (Home)
          let maxForwardDepthX = PITCH_LENGTH - 45; // Default (Away)

          if (
            tactic.pressingIntensity === "Gegenpress" ||
            tactic.pressingIntensity === "HighPress"
          ) {
            // Pres yapan takım forveti geriye çekmez, ileride basar!
            minForwardDepthX = 55; // Home: 55m (Orta sahanın ilerisinde kal)
            maxForwardDepthX = PITCH_LENGTH - 55; // Away
          } else if (tactic.pressingIntensity === "StandOff") {
            // Otobüs çeken takım forveti de defansa çağırır
            minForwardDepthX = 30; // Home: 30m (Defansın önüne gel)
            maxForwardDepthX = PITCH_LENGTH - 30; // Away
          }

          // Calculate ideal defensive position relative to ball
          let targetBackX = isHome ? ballX + 20 : ballX - 20;

          // CLAMP WITH TACTIC LIMITS
          if (isHome) {
            targetBackX = Math.max(targetBackX, minForwardDepthX);
          } else {
            targetBackX = Math.min(targetBackX, maxForwardDepthX);
          }

          // Ayrıca "Serbest Dolaş" (Roam) varsa biraz daha serbest bırak
          if (!tactic.instructions?.includes("RoamFromPosition")) {
            // Sabit kal
          }

          targetX = targetBackX;

          // === FORVET KANAL SIFIRLAMASI (DEFENSIVE PHASE CHANNEL RESET) ===
          // Hücumda çapraz koşu yapan forvetler, top rakipteyken kendi şeridine döner.
          // preferredChannelY: saldırı fazıyla AYNI mantık (lineupIndex bazlı)
          const myBaseY = this.baseOffsets[p.id]?.y || simP.y;
          const myTeamFwdList = isHome ? this.homePlayers : this.awayPlayers;
          const totalFwdCount = myTeamFwdList.filter(
            (pl) => this.playerRoles[pl.id] === Position.FWD,
          ).length;
          const myFwdIndex = p.lineupIndex || 0;
          let preferredChannelYDef = 34; // Tek forvet: merkez
          if (totalFwdCount >= 2) {
            // Tek index (1,3...) -> Sol şerit (24), Çift index (0,2...) -> Sağ şerit (44)
            preferredChannelYDef = myFwdIndex % 2 !== 0 ? 24 : 44;
          }

          // Preferred channel'a güçlü çek (%90), topa %10 yaklaş (kompaktlık)
          targetY = lerp(preferredChannelYDef, ballY, 0.1);

          // Eğer kanat forvetse (Base Y < 20 veya > 48), kenarda kalmaya zorla
          if (myBaseY < 20)
            targetY = Math.min(targetY, 20); // Sol açık solda kalsın
          else if (myBaseY > 48) targetY = Math.max(targetY, 48); // Sağ açık sağda kalsın

          // Hız ayarı: Yanlış şeritteyse hızlı dön, yoksa normal bekle
          const distFromChannel = Math.abs(simP.y - preferredChannelYDef);
          speedMod =
            distFromChannel > 12
              ? MAX_PLAYER_SPEED * 1.0
              : MAX_PLAYER_SPEED * 0.85;
          simP.state = distFromChannel > 12 ? "SPRINT" : "RUN";
        } else if (distToBallFromForward < 25 && !ballInPlay) {
          // Ball is loose and nearby - chase it!
          targetX = ballX;
          targetY = ballY;
          speedMod = MAX_PLAYER_SPEED * 0.9;
          simP.state = "RUN";
        } else {
          // Normal defensive position (Forward waiting for counter)
          // Keep them a bit deeper than before to avoid isolation
          // Old: offsideLineX +/- 2.0 -> New: Connected to play
          targetX = isHome ? offsideLineX - 5.0 : offsideLineX + 5.0;
          targetY = lerp(simP.y, baseTargetY, 0.25);
          speedMod = MAX_PLAYER_SPEED * 0.7;
          simP.state = "RUN";

          // === LINK-UP PLAY (BAĞLANTI OYUNU) ===
          // Takım topa sahipken forvetler bazen orta sahaya yardıma gelmeli
          // Özellikle oyun kurarken (top defanstaysa ve ileride kimse yoksa)
          if (teamHasBall) {
            const distToBall = dist(simP.x, simP.y, ballX, ballY);

            // Top orta sahada veya gerideyse (Build-up Phase)
            const isBuildUp = isHome ? ballX < 60 : ballX > 45;

            // Ben toptan uzaksam ve "İleride Bekleyen" değilsem
            const isPoacher = p.playStyles?.includes("İleride Bekleyen");
            const isDeepLying =
              p.playStyles?.includes("İleride Bekleyen") ||
              p.playStyles?.includes("Gizli Forvet");

            if (isBuildUp && distToBall > 30 && !isPoacher) {
              // Bağlantı şansı: False 9 ise yüksek, değilse düşük
              const linkUpChance = isDeepLying ? 0.15 : 0.03;

              // Rastgele veya taktiksel olarak gel
              if (
                Math.random() < linkUpChance ||
                tactic.style === "Possession"
              ) {
                // Topa doğru yaklaş (orta saha çizgisine kadar)
                targetX = lerp(targetX, ballX, 0.4);
                targetY = lerp(targetY, ballY, 0.3);
                speedMod = MAX_PLAYER_SPEED * 0.8;

                // Görsel olarak top iste
                if (Math.random() < 0.1) this.emitTeamSignal(p, "CALL");
              }
            }
          }
        }
      } else {
        // --- DEFENSIVE SHAPE (IMPROVED - GOAL-SIDE POSITIONING) ---
        const ballCarrierId = this.sim.ball.ownerId;
        const distToBall = dist(simP.x, simP.y, ballX, ballY);

        // === MARKING SYSTEM (ADAM ADAMA vs ALAN) ===
        const markingType = tactic.marking || "Zonal";
        const opponents = isHome ? this.awayPlayers : this.homePlayers;

        if (markingType === "Man" || markingType === "ManMark") {
          // ADAM ADAMA MARKİNG: En tehlikeli rakibi bul, ~1m yakınına git
          // Kriter: Benim bölgeme (15m yarıçap) giren tehlikeli rakip

          let bestThreat: (typeof opponents)[0] | null = null;
          let bestThreatScore = -1;

          opponents.forEach((op) => {
            if (!this.sim.players[op.id]) return;
            if (op.lineup !== "STARTING") return;
            const opPos = this.sim.players[op.id];
            const distToMe = dist(simP.x, simP.y, opPos.x, opPos.y);
            if (distToMe > 15) return;

            const distToBall = dist(opPos.x, opPos.y, ballX, ballY);
            const distOpToMyGoal = dist(opPos.x, opPos.y, myGoalX, PITCH_CENTER_Y);
            const threatScore =
              (15 - distToMe) * 2 +
              (op.overall || 70) * 0.3 -
              distOpToMyGoal * 0.2 -
              distToBall * 0.1;

            if (threatScore > bestThreatScore) {
              bestThreatScore = threatScore;
              bestThreat = op;
            }
          });

          if (bestThreat && this.sim.players[(bestThreat as any).id]) {
            const threatPos = this.sim.players[(bestThreat as any).id];
            // Rakip ile kale arasına gir (Goal-side) — ~1m yakın hedefleme
            targetX = lerp(threatPos.x, myGoalX, 0.1);
            targetY = threatPos.y;
            speedMod = MAX_PLAYER_SPEED * 0.85;
          }
        }

        // Eğer Man marking hedef bulamadıysa veya Zonal ise normal pozisyon

        // === PAS OKUMA & KESİŞİM SİSTEMİ (YENİ) ===
        // Top serbest (pas uçuşta) ve hızlı hareket ediyorsa, araya gir!
        // Goal-side positioning BOZULMAZ: Bu sadece ownerId=null durumunda çalışır
        if (!ballCarrierId) {
          const ballVx = this.sim.ball.vx || 0;
          const ballVy = this.sim.ball.vy || 0;
          const ballSpd = Math.sqrt(ballVx * ballVx + ballVy * ballVy);

          // Sadece hızlı hareket eden toplar için (pas/şut), yavaş toplar zaten pickup ile alınır
          if (ballSpd > 0.8) {
            // Topun 8-15 tick sonra olacağı yeri hesapla
            const interceptTicks = Math.min(
              15,
              distToBall / (MAX_PLAYER_SPEED * 0.9),
            );
            const friction = this.sim.ball.z > 0.5 ? 0.995 : 0.985;

            let predBallX = ballX;
            let predBallY = ballY;
            let tmpVx = ballVx;
            let tmpVy = ballVy;
            for (let t = 0; t < interceptTicks; t++) {
              predBallX += tmpVx;
              predBallY += tmpVy;
              tmpVx *= friction;
              tmpVy *= friction;
            }

            // Topun yolu benim bölgemden geçiyor mu?
            const distToPath = this.distToSegment(
              simP.x,
              simP.y,
              ballX,
              ballY,
              predBallX,
              predBallY,
            );
            const distToIntercept = dist(simP.x, simP.y, predBallX, predBallY);

            // Top benim bölgemden geçiyor (15m içinde) VE yetişebilirim
            // Ama önemli: Kale tarafına doğru koş, topun arkasından tren gibi gitme!
            if (distToPath < 15 && distToIntercept < 20) {
              // Kesişim noktasını hesapla - topun geçeceği en yakın nokta
              // Ama kale ile top arasındaki çizgide kal (goal-side korunsun)
              let interceptX = predBallX;
              let interceptY = predBallY;

              // GOAL-SIDE KORUMASI: Kesişim noktası benim goal-side'ımda mı?
              const isInterceptGoalSide = isHome
                ? interceptX < simP.x + 3 // Sol kaleye yakınsam, intercept sola doğru olmalı
                : interceptX > simP.x - 3; // Sağ kaleye yakınsam, intercept sağa doğru olmalı

              if (isInterceptGoalSide) {
                // Kalenin önünde kal ama topun yoluna gir
                targetX = interceptX;
                targetY = interceptY;
                // PREDICTION FIX: Daha agresif koş (Topa yetiş!)
                speedMod = MAX_PLAYER_SPEED * 1.05; // %5 ekstra gayret (Sprint)
                simP.state = "SPRINT";

                // Saha sınırları
                targetX = clamp(targetX, 1, PITCH_LENGTH - 1);
                targetY = clamp(targetY, 2, PITCH_WIDTH - 2);

                this.applySteeringBehavior(p, targetX, targetY, speedMod);
                return; // Intercept mantığı devreye girdi
              }
            }
          }
        }

        // === GENİŞLETİLMİŞ TEHLİKE BÖLGESİ ===
        // Sadece ceza sahası değil, orta sahada da aktif ol!
        const distBallToMyGoal = Math.abs(ballX - myGoalX);

        const isDangerZone = distBallToMyGoal < 52; // Yarı saha (105/2)
        const isCriticalZone = distBallToMyGoal < 32; // Kritik bölge (ceza sahası yakını)

        // 1. Calculate ideal position based on formation
        // === CUSTOM POSITION KORUNMASI (SAVUNMA) ===
        let idealX = isHome ? base.x : PITCH_LENGTH - base.x;
        let idealY = isHome ? base.y : PITCH_WIDTH - base.y;

        // FIX: Orta sahaların defans hattına gömülmesini engelle (6-7 kişilik defans oluşmaması için)
        // Midfielders should stay in front of the penalty box (approx 25% of pitch)
        // FIX v2: Allowed deeper tracking (18% ~ 19m) to support defense better
        if (role === Position.MID) {
          const minMidX = PITCH_LENGTH * 0.18; // ~25m -> 19m (Box edge support)
          const maxMidX = PITCH_LENGTH * 0.82; // ~80m -> 86m
          if (isHome && idealX < minMidX) idealX = minMidX;
          if (!isHome && idealX > maxMidX) idealX = maxMidX;

          // === DISCIPLINED MIDFIELD DEFENSE ===
          // If opponent has ball in our half, ignore Free Roam/Drift
          const isDefendingDeep = isHome ? ballX < 50 : ballX > 55;
          if (isDefendingDeep && !teamHasBall) {
            idealY = isHome ? base.y : PITCH_WIDTH - base.y; // Reset to base Y
            // Slight shift to ball side only
            idealY = lerp(idealY, ballY, 0.2);
          }
        }

        // Custom pozisyon varsa Y ekseninde daha sadık kal
        const hasCustomDefPos =
          tactic.customPositions && tactic.customPositions[p.id];

        // Apply width setting - COMPLETELY IGNORED for defenders to keep defensive shape compact
        // Defenders stay in formation positions (prevents touchline-hugging)
        let widthOffset =
          tactic.width === "Wide"
            ? 1.25
            : tactic.width === "Narrow"
              ? 0.75
              : 1.0;
        if (role === Position.DEF) {
          // Defenders: ALWAYS use 1.0 - ignore width setting when defending!
          // This keeps the 4-back or 5-back line compact and goal-protecting
          widthOffset = 1.0;
        }
        idealY = PITCH_CENTER_Y + (idealY - PITCH_CENTER_Y) * widthOffset;

        // Shift with ball Y position (cover shadow) - DENGELI kayma
        // Top çok uzaktaysa kayma, yakınsa kayabilir
        const distToBallForShadow = dist(simP.x, simP.y, ballX, ballY);
        const ballIsClose = distToBallForShadow < 35;

        // Custom pozisyon varsa daha az kay, top uzaksa hiç kayma
        let shadowStrength = hasCustomDefPos ? 0.1 : 0.18;
        if (!ballIsClose) shadowStrength *= 0.3; // Uzak toplar için minimal kayma

        // Maksimum kayma mesafesi - pozisyonundan 15 metreden fazla uzaklaşma
        const maxShift = 15;
        const proposedY = lerp(idealY, ballY, shadowStrength);
        const shiftAmount = Math.abs(
          proposedY - (isHome ? base.y : PITCH_WIDTH - base.y),
        );

        // 3. COVERING LOGIC (KADEME ANLAYIŞI) - YENİ!
        // Partnerim baskıdaysa, onun boşluğunu kapat
        if (role === Position.DEF) {
          let coveringShift = 0;
          const teammates = isHome
            ? this._cachedHomeStarters
            : this._cachedAwayStarters;

          // Yakındaki diğer defans oyuncularına bak
          teammates.forEach((tm) => {
            if (tm.id === p.id) return;
            if (this.playerRoles[tm.id] !== Position.DEF) return; // Sadece defans partnerleri

            const tmState = this.playerStates[tm.id];
            if (!tmState || !this.sim.players[tm.id]) return; // Guard: oyuncu state yoksa atla
            const tmBase = isHome
              ? this.baseOffsets[tm.id]
              : {
                x: PITCH_LENGTH - this.baseOffsets[tm.id].x,
                y: PITCH_WIDTH - this.baseOffsets[tm.id].y,
              };

            // Partner baskıda mı veya pozisyonunu çok mu kaybetti?
            // (Baskıdaysa veya 15m'den fazla açıldıysa)
            const isOut =
              tmState.isPressing ||
              dist(
                this.sim.players[tm.id].x,
                this.sim.players[tm.id].y,
                tmBase.x,
                tmBase.y,
              ) > 15;

            if (isOut) {
              // Partner benden hangi yönde? (Y ekseni)
              const yDiff = tmBase.y - idealY; // Pozitifse o aşağıda, negatifse yukarıda

              // Eğer partner benden uzaktaysa (aramızda mesafe varsa) ve o pozisyonu terk ettiyse
              // Ben ona doğru kaymalıyım.
              // Çok yakınsam (stoper-stoper) daha çok, uzaksa (bek-stoper) daha az.
              if (Math.abs(yDiff) < 20) {
                coveringShift += yDiff * 0.4; // %40 oranında kapat
              }
            }
          });

          // Proposed Y'ye covering ekle
          idealY += coveringShift;
        } else {
          idealY = proposedY;
        }

        // 2. Calculate defensive line limit — driven by defenseApproach
        const teamDefApproach = (tactic as any).defenseApproach ||
          (tactic.pressingIntensity === 'Gegenpress' ? 'HUNT' :
           tactic.pressingIntensity === 'HighPress' ? 'FRONT_FOOT' :
           tactic.defensiveLine === 'High' ? 'FRONT_FOOT' :
           tactic.defensiveLine === 'Deep' ? 'LOW_BLOCK' : 'MID_BLOCK');
        let defLineX =
          teamDefApproach === 'LOW_BLOCK'   ? (isHome ? 20 : 85) :
          teamDefApproach === 'FRONT_FOOT'  ? (isHome ? 40 : 65) :
          teamDefApproach === 'HUNT'        ? (isHome ? 50 : 55) :
          /* MID_BLOCK default */              (isHome ? 30 : 75);

        // === YENİ: PRESÇI ÇIKINCA DEFANS KOMPAKT KALMA ===
        // Bir defans arkadaşı prese çıkınca, kalan defanslar geri çekilir
        // Bu, kanattan gelen rakibin defansın arkasında beleş kalmasını engeller
        if (role === Position.DEF && !this.playerStates[p.id].isPressing) {
          const myTeamDefs = (
            isHome ? this.homePlayers : this.awayPlayers
          ).filter(
            (tm) => this.playerRoles[tm.id] === Position.DEF && tm.id !== p.id,
          );
          const anyPartnerPressing = myTeamDefs.some(
            (tm) => this.playerStates[tm.id]?.isPressing,
          );

          if (anyPartnerPressing) {
            // Partner prese çıkmış → diğerleri 6m geri çekil!
            defLineX = isHome
              ? Math.max(defLineX - 6, 14)
              : Math.min(defLineX + 6, 91);
          }
        }

        // === OFFSIDE TRAP ===
        // HUNT/FRONT_FOOT: Defender in line pushes up when attacker is near the line
        if ((teamDefApproach === 'HUNT' || teamDefApproach === 'FRONT_FOOT') &&
            role === Position.DEF && !teamHasBall) {
          const opponents = isHome ? this.awayPlayers : this.homePlayers;
          const myTeamDefsForLine = (isHome ? this.homePlayers : this.awayPlayers)
            .filter(dp => this.playerRoles[dp.id] === Position.DEF && this.sim.players[dp.id]);
          const currentDefLineX = myTeamDefsForLine.length > 0
            ? (isHome
                ? Math.max(...myTeamDefsForLine.map(dp => this.sim.players[dp.id]?.x ?? 0))
                : Math.min(...myTeamDefsForLine.map(dp => this.sim.players[dp.id]?.x ?? PITCH_LENGTH)))
            : defLineX;

          const attackersNearLine = opponents.filter(op => {
            const opPos = this.sim.players[op.id];
            if (!opPos || this.playerRoles[op.id] === Position.GK) return false;
            const distToLine = isHome ? (currentDefLineX - opPos.x) : (opPos.x - currentDefLineX);
            return distToLine < 6 && distToLine > -2;
          });

          if (attackersNearLine.length > 0 && teamDefApproach === 'HUNT') {
            // Push ALL defenders up 3m to catch attackers offside
            if (isHome) targetX = Math.max(targetX, simP.x + 3);
            else targetX = Math.min(targetX, simP.x - 3);
          }
        }

        // 3. CRITICAL: GOAL-SIDE POSITIONING
        // Check if ball is BEHIND my ideal position (line is broken!)
        const isBallBehindMe = isHome ? ballX < idealX : ballX > idealX;

        // === YENİ: UZAK DEFANSIN TEHLİKEYE KOŞMASI ===
        // Gemini'nin tespiti: "Uzaktaki defans tehlikeye koşmuyor, yerine gidiyor"
        // Çözüm: Forvet kaleye doğru koşuyorsa, TÜM defansçılar kaleye dönmeli
        let isTeamUnderThreat = false;
        let threatDirection: "left" | "right" | "center" | null = null;

        if (ballCarrierId && role === Position.DEF) {
          const carrier = this.getPlayer(ballCarrierId);
          const carrierPos = this.sim.players[ballCarrierId];

          if (carrier && carrierPos && carrier.teamId !== p.teamId) {
            const carrierVx = carrierPos.vx || 0;
            const isCarrierRunningToGoal = isHome
              ? carrierVx < -0.5
              : carrierVx > 0.5;
            const carrierDistToGoal = Math.abs(carrierPos.x - myGoalX);

            // Forvet kaleye doğru koşuyor VE tehlikeli mesafede
            if (isCarrierRunningToGoal && carrierDistToGoal < 45) {
              isTeamUnderThreat = true;

              // Tehdit hangi yönden?
              if (carrierPos.y < 24) threatDirection = "left";
              else if (carrierPos.y > 44) threatDirection = "right";
              else threatDirection = "center";

              // === UZAK DEFANSIN RECOVERY RUN'I (v2 - DAHA HIZLI KAPANMA) ===
              // Ben forvetin bulunduğu tarafta değilsem bile, kaleye dön!
              const myDistToCarrier = dist(
                simP.x,
                simP.y,
                carrierPos.x,
                carrierPos.y,
              );

              // BUFF: 20m -> 15m (daha erken tepki)
              if (myDistToCarrier > 15) {
                // Ben uzaktayım - kaleye dön, forvetin peşinden koşma
                // Ama yerime de gitme! Kale ile forvet arasına gir!

                // Forvetin gideceği yeri tahmin et
                const predictTime = 10;
                const futureCarrierX = carrierPos.x + carrierVx * predictTime;

                // Kale ile forvet arasında bir noktaya git
                const coverX = (myGoalX + futureCarrierX) / 2;

                // Y ekseninde: Forvetin geldiği tarafa doğru kay
                let coverY = idealY;
                if (threatDirection === "left" && simP.y > 34) {
                  coverY = lerp(idealY, 24, 0.5); // 0.4 -> 0.5 (daha agresif)
                } else if (threatDirection === "right" && simP.y < 34) {
                  coverY = lerp(idealY, 44, 0.5); // 0.4 -> 0.5
                } else if (threatDirection === "center") {
                  // Merkez tehdit - pozisyonunu koru ama geriye gel
                  coverY = idealY;
                }

                // Hedef: Kaleye yaklaş ama forvetin pas yolunu kes
                targetX = isHome
                  ? Math.max(coverX, 8)
                  : Math.min(coverX, PITCH_LENGTH - 8);
                targetY = coverY;

                // BUFF: Daha hızlı koş! 0.85 -> 0.92
                speedMod = MAX_PLAYER_SPEED * 0.92;
                simP.state = "SPRINT";
              }
            }
          }
        }

        // === KALE ÖNÜ ACİL DURUM ===
        // Top kale önünde (< 12m) ise TÜM savunmacılar oraya koşmalı!
        const isGoalBoxEmergency = isHome
          ? ballX < 12
          : ballX > PITCH_LENGTH - 12;
        const isInMyPenaltyBox = isHome
          ? ballX < 20
          : ballX > PITCH_LENGTH - 20;

        if (isGoalBoxEmergency && role === Position.DEF) {
          // ACİL DURUM! Kale önüne koş!
          // Topun olduğu yere git, ama kaleyi koru
          targetX = isHome
            ? Math.max(2, ballX - 3)
            : Math.min(PITCH_LENGTH - 2, ballX + 3);
          targetY = lerp(simP.y, ballY, 0.8); // Topa doğru kay

          // Kale çizgisini koru - Kale genisliği: 30.34-37.66, biraz genişlet
          targetY = clamp(targetY, 20, 48); // Motor: kale etrafı 20-48m

          speedMod = MAX_PLAYER_SPEED;
          simP.state = "SPRINT";
          this.playerStates[p.id].isPressing = true;

          // Topa çok yakınsan müdahale et!
          if (distToBall < TACKLE_RANGE_BASE + 3 && ballCarrierId) {
            const pState2 = this.playerStates[p.id];
            if (pState2 && pState2.actionLock <= 0) {
              this.actionTackle(p, this.getPlayer(ballCarrierId)!);
              pState2.actionLock = 25; // 0.4 saniye cooldown
            }
          }
        } else if (
          isInMyPenaltyBox &&
          (role === Position.DEF || role === Position.MID)
        ) {
          // Ceza sahası içi - daha az agresif ama hala acil
          const ballDistToGoal = Math.abs(ballX - myGoalX);

          // Kale ile top arasına gir
          targetX = isHome
            ? Math.max(5, ballX - 5)
            : Math.min(PITCH_LENGTH - 5, ballX + 5);
          targetY = lerp(simP.y, ballY, 0.5);
          targetY = clamp(targetY, 17, 51); // Motor: geniş savunma hattı

          speedMod = MAX_PLAYER_SPEED * 0.95;
          simP.state = "SPRINT";

          // Müdahale mesafesi
          if (distToBall < TACKLE_RANGE_BASE + 2 && ballCarrierId) {
            this.actionTackle(p, this.getPlayer(ballCarrierId)!);
          }
        } else if (isBallBehindMe) {
          // === AKILLI RECOVERY RUN ===
          // Topun arkasından koşma! Topun GİDECEĞİ yere koş!

          // Top hızını hesapla - nereye gidiyor?
          const ballVelX = this.sim.ball.vx || 0;
          const ballVelY = this.sim.ball.vy || 0;
          const ballSpeed = Math.sqrt(
            ballVelX * ballVelX + ballVelY * ballVelY,
          );

          // Topun 10-15 tick sonra olacağı yer (interception noktası)
          const interceptTime = ballSpeed > 0.5 ? 12 : 5;
          const futureBallX = ballX + ballVelX * interceptTime;
          const futureBallY = ballY + ballVelY * interceptTime;

          // Kale ile top arasına gir, ama topun gideceği yere
          targetX = futureBallX + (isHome ? -4 : 4);

          // Y ekseninde de topun gideceği yere koş
          targetY = lerp(simP.y, futureBallY, 0.7);

          // Eğer top hızlı hareket ediyorsa, daha agresif kes
          if (ballSpeed > 1.0) {
            targetY = futureBallY; // Direkt topun gideceği yere
          }

          // Sprint to recover!
          speedMod = MAX_PLAYER_SPEED;
          simP.state = "SPRINT";
          this.playerStates[p.id].isPressing = false; // Not pressing, recovering
        } else {
          // Ball is in front - maintain position but be ready

          // === G MOTORU: İÇERİ KAPANMA (TUCK IN) ===
          if (role === Position.DEF) {
            const isBallCentral = Math.abs(ballY - 34) < 15;
            const isEnemyAttacking = isHome ? ballX < 40 : ballX > 65;

            if (isBallCentral && isEnemyAttacking) {
              // Rakip merkezden geliyorsa, kanat bekleri merkeze yaklaşır (Kale önünü kapatır)
              targetY = lerp(targetY, 34, 0.4);
              targetX = lerp(targetX, myGoalX, 0.15); // Kaleye doğru hafif geri çekil
            }
          }

          // === GELİŞTİRİLMİŞ COVER SHADOW (PAS YOLU KAPATMA) ===
          // Savunmacı, top taşıyan ile tehlikeli hücumcu arasındaki pas yolunu kapatmalı
          if (
            ballCarrierId &&
            (role === Position.DEF || role === Position.MID)
          ) {
            const ballCarrier = this.getPlayer(ballCarrierId);
            if (ballCarrier && ballCarrier.teamId !== p.teamId) {
              // Rakip top taşıyorsa, tehlikeli pas yollarını kapat
              const enemyTeam = isHome ? this.awayPlayers : this.homePlayers;
              const dangerousAttackers = enemyTeam.filter((e) => {
                if (!this.sim.players[e.id]) return false;
                const ePos = this.sim.players[e.id];
                // Kaleye yakın ve pas alabilecek pozisyondaki hücumcular
                const isNearGoal = isHome ? ePos.x < 40 : ePos.x > 60;
                return isNearGoal;
              });

              let closestThreat: Player | null = null;
              let minThreatDist = 999;

              dangerousAttackers.forEach((threat) => {
                const threatPos = this.sim.players[threat.id];
                const distToThreat = dist(
                  simP.x,
                  simP.y,
                  threatPos.x,
                  threatPos.y,
                );
                if (distToThreat < minThreatDist && distToThreat < 20) {
                  minThreatDist = distToThreat;
                  closestThreat = threat;
                }
              });

              if (closestThreat && this.sim.players[closestThreat.id]) {
                const threatPos = this.sim.players[closestThreat.id];
                // Pas yolunun ortasına pozisyon al
                const coverX = (ballX + threatPos.x) / 2;
                const coverY = (ballY + threatPos.y) / 2;

                // Eğer pas yolu kendi bölgemde ve yakınımdaysa, oraya git
                const isCoverInMyZone =
                  Math.abs(coverX - idealX) < 15 &&
                  Math.abs(coverY - idealY) < 20;
                if (isCoverInMyZone) {
                  targetX = lerp(targetX, coverX, 0.4);
                  targetY = lerp(targetY, coverY, 0.4);

                  // "Top Kesici" yeteneği: Pas yolu okuma bonusu
                  if (p.playStyles?.includes("Top Kesici")) {
                    targetX = lerp(targetX, coverX, 0.2); // Daha agresif kapatma
                    targetY = lerp(targetY, coverY, 0.2);
                  }
                }
              }

              // === GLOBAL PRESSING CONTROLLER (Merkezi Pres Sistemi) ===
              // Artık her oyuncu kendi kafasına göre karar vermiyor!
              // step() başında belirlenen "yetkili" oyuncular listesini kullan

              const myPresserSet = isHome
                ? this.homePresserIds
                : this.awayPresserIds;
              const hasGlobalAuthority = myPresserSet.has(p.id);

              // === EMERGENCY INITIATIVE (Acil Durum İnisiyatifi) ===
              // Senin korkunu gideren mantık: "Yetkisiz ama dibimde top var!"
              // Merkezi yetkisi olmasa bile, top çok yakın ve tehlikeli bölgedeyse müdahale et!
              const EMERGENCY_DISTANCE = 8; // 8 metreden yakınsa acil durum
              const isBallInMyFrontYard = distToBall < EMERGENCY_DISTANCE;
              const isEmergencyZone = isHome
                ? ballX < 35
                : ballX > PITCH_LENGTH - 35; // Kendi yarı saham

              // === FORVET TAKİBİ (Local Initiative) ===
              // Eğer bir forvet bana doğru geliyorsa, ona KAPAN!
              let closestThreatToMe: Player | null = null;
              let minThreatToMeDist = 999;
              let isPenaltyBoxDanger = false;

              if (role === Position.DEF && ballCarrierId) {
                const ballCarrier = this.getPlayer(ballCarrierId);
                if (ballCarrier && ballCarrier.teamId !== p.teamId) {
                  const carrierPos = this.sim.players[ballCarrierId];
                  if (carrierPos) {
                    const distToCarrier = dist(
                      simP.x,
                      simP.y,
                      carrierPos.x,
                      carrierPos.y,
                    );
                    const isCarrierInMyZone =
                      Math.abs(carrierPos.y - simP.y) < 20;

                    // CEZA SAHASI KONTROLÜ
                    isPenaltyBoxDanger = isHome
                      ? carrierPos.x < 25 &&
                      Math.abs(carrierPos.y - simP.y) < 25
                      : carrierPos.x > PITCH_LENGTH - 25 &&
                      Math.abs(carrierPos.y - simP.y) < 25;

                    const carrierVx = carrierPos.vx || 0;
                    const carrierVy = carrierPos.vy || 0;
                    const isRunningToGoal = isHome
                      ? carrierVx < -0.3
                      : carrierVx > 0.3;

                    if (
                      distToCarrier < 25 &&
                      (isCarrierInMyZone || isPenaltyBoxDanger)
                    ) {
                      closestThreatToMe = ballCarrier;
                      minThreatToMeDist = distToCarrier;

                      // Forvetin GİDECEĞİ yere git
                      const interceptTime = Math.max(5, distToCarrier / 2);
                      const futureCarrierX =
                        carrierPos.x + carrierVx * interceptTime;
                      const futureCarrierY =
                        carrierPos.y + carrierVy * interceptTime;

                      targetX = lerp(myGoalX, futureCarrierX, 0.85);
                      targetY = lerp(simP.y, futureCarrierY, 0.6);

                      if (distToCarrier < 15 && isRunningToGoal) {
                        targetX = futureCarrierX + (isHome ? -2 : 2);
                        targetY = futureCarrierY;
                        speedMod = MAX_PLAYER_SPEED;
                        simP.state = "SPRINT";
                      } else if (distToCarrier < 20) {
                        speedMod = MAX_PLAYER_SPEED * 0.9;
                        simP.state = "RUN";
                      }
                    }
                  }
                }
              }

              // === NIHAI PRES KARARI ===
              // 3 yoldan biriyle pres yapabilirsin:
              // 1. Merkezi Yetki (Global Authority) - step() başında seçildin
              // 2. Acil Durum (Emergency Initiative) - top çok yakın + tehlikeli bölge
              // 3. Forvet Takibi (closestThreatToMe) - defansçı için forvet kapanması
              let shouldPress =
                hasGlobalAuthority ||
                (isBallInMyFrontYard && isEmergencyZone) ||
                (closestThreatToMe !== null && isPenaltyBoxDanger);

              if (shouldPress) {
                this.playerStates[p.id].isPressing = true;

                // === TARGET OFFSETTING (GEMİNİ'NİN ÖNERİSİ) ===
                // İki presçinin aynı noktaya koşup çarpışmasını engelle!
                // Hangi sırada pres yapıyorum?
                const myTeam = isHome ? this.homeTeam : this.awayTeam;
                const isHomeTeam = isHome;
                const myDefenders = isHomeTeam
                  ? this.homePlayers.filter(
                    (dp) => this.playerRoles[dp.id] === Position.DEF,
                  )
                  : this.awayPlayers.filter(
                    (dp) => this.playerRoles[dp.id] === Position.DEF,
                  );

                let myRank = 0;
                if (hasGlobalAuthority) {
                  const myPresserSet = isHome
                    ? this.homePresserIds
                    : this.awayPresserIds;
                  const presserArray = Array.from(myPresserSet);
                  myRank = presserArray.indexOf(p.id) + 1; // 1-indexed
                }

                // Forvet takibi varsa ona git, yoksa topa git
                if (!closestThreatToMe) {
                  let interceptX = ballX + this.sim.ball.vx * 3;
                  let interceptY = ballY + this.sim.ball.vy * 3;

                  // === AKILLI HEDEF AYRIMI (OFFSET) ===
                  // 1. Presçi: Direkt topa basar (Aggressive Press)
                  // 2. Presçi: Top ile kale arasına girer (Supporting Layer/Jockey)
                  if (myRank === 2) {
                    const goalX = isHome ? 0 : PITCH_LENGTH;
                    // Hedefi top ile kale arasına kaydır (lerp)
                    // - X'i %25 kaleye doğru çek
                    // - Y'yi %15 merkeze doğru çek
                    interceptX = lerp(interceptX, goalX, 0.25);
                    interceptY = lerp(interceptY, PITCH_CENTER_Y, 0.15);
                  }

                  targetX = interceptX;
                  targetY = interceptY;
                }
                speedMod = MAX_PLAYER_SPEED;
                simP.state = "SPRINT";

                // Tackle mesafesi
                let tackleDist = TACKLE_RANGE_BASE;
                if (isPenaltyBoxDanger) {
                  tackleDist = 7.5; // Ceza sahasında daha geniş aralık
                }

                // === WinBall INSTRUCTION: Earlier tackle + faster recovery ===
                const tackleInstruction = this.getPlayerInstruction(p);
                let winBallRiskMod = 1.0;
                if (tackleInstruction === 'WinBall') {
                  tackleDist += 0.3; // Tackle from slightly further
                  winBallRiskMod = 0.85; // -15% risk factor (more careful, not reckless)
                }

                if (distToBall < tackleDist && ballCarrierId) {
                  // === TACKLE COOLDOWN CHECK ===
                  // Aynı oyuncu sürekli tackle yapamasın!
                  const pState = this.playerStates[p.id];
                  if (pState && pState.actionLock <= 0) {
                    this.actionTackle(p, this.getPlayer(ballCarrierId)!);
                    const baseLock = 25;
                    // WinBall: recover 20% faster after tackle
                    pState.actionLock = tackleInstruction === 'WinBall'
                      ? Math.round(baseLock * 0.80)
                      : baseLock;
                    if (tackleInstruction === 'WinBall') {
                      // Store risk mod for actionTackle to apply
                      (this.playerStates[p.id] as any)._winBallRiskMod = winBallRiskMod;
                    }
                  }
                }
              } else {
                // === YETKİSİZ OYUNCU - RECOVERY RUN & CROWDING FIX ===
                // Merkezi sistemden yetki almadın ve acil durum da yok
                // Top çok yakınsa (< 12m): HEMEN SAVUNMA HATTINA GERİ KOŞ!
                // Uzaksa: Bir sorun yok, ideal pozisyon koru
                this.playerStates[p.id].isPressing = false;

                if (distToBall < 12) {
                  // === RECOVERY RUN: Topa çok yakınız ama yetkili değiliz ===
                  // Kaledeki ideal pozisyona doğru geri koş

                  // Şu anki X'i ideal X ile interpolate et (0.5 = %50)
                  // Sonra kaleye doğru %20 daha çek
                  let recoveryX = lerp(simP.x, idealX, 0.5);
                  recoveryX = isHome
                    ? Math.max(recoveryX, 0)
                    : Math.min(recoveryX, PITCH_LENGTH);
                  recoveryX = lerp(recoveryX, myGoalX, 0.2);

                  targetX = recoveryX;
                  targetY = idealY;

                  speedMod = MAX_PLAYER_SPEED * 0.85; // Hızlı ama sprint değil
                  simP.state = "RUN";

                  // Topu izle (jockey position)
                  simP.facing = Math.atan2(ballY - simP.y, ballX - simP.x);
                } else {
                  // Uzakta isen, sadece defans hattını koru
                  // Jockey position - face the ball when within 15m
                  if (distToBall < 15) {
                    simP.facing = Math.atan2(ballY - simP.y, ballX - simP.x);
                  }

                  // Stay on defensive line - pas yollarını kapat
                  targetX = isHome
                    ? Math.max(idealX, defLineX)
                    : Math.min(idealX, defLineX);
                  targetY = idealY;
                  speedMod = MAX_PLAYER_SPEED * 0.65;
                  simP.state = "RUN";
                }
              }
            }
          }

          // === GK RETREAT LOGIC (Engine 4) ===
          if (role === Position.GK) {
            const startLine = isHome ? 0 : PITCH_LENGTH;
            const distToLine = Math.abs(ballX - startLine);
            const isDanger = distToLine < 35; // 35m danger zone

            if (isDanger) {
              // RETREAT! Kaleye geri dön
              targetX = isHome ? 2.0 : PITCH_LENGTH - 2.0;
              targetY = PITCH_CENTER_Y;
              speedMod = MAX_PLAYER_SPEED * 0.85;

              // === 1v1 RUSH OUT (SWEEPER KEEPER PRO) ===
              // Kale önünde tehlike varsa ve top başkasındaysa, açıyı daralt!
              // "Karşı karşıya" pozisyonu
              if (distToLine < 20 && this.sim.ball.ownerId) {
                const ballOwner = this.getPlayer(this.sim.ball.ownerId);
                // Rakip forvet topla geliyorsa
                if (
                  ballOwner &&
                  ballOwner.teamId !== p.teamId &&
                  this.playerRoles[ballOwner.id] === Position.FWD
                ) {
                  // Topa doğru %60 hamle yap (Tam gitme, açıyı kapat)
                  const rushX = lerp(simP.x, ballX, 0.6);
                  const rushY = lerp(simP.y, ballY, 0.6);
                  targetX = rushX;
                  targetY = rushY;
                  speedMod = MAX_PLAYER_SPEED; // Full Sprint
                }
              }
            } else {
              // SWEEPER KEEPER
              // Top bizdeyse veya tehlike yoksa, defans arkasına açıl
              const sweepDist = teamHasBall ? 20 : 12;
              targetX = isHome ? sweepDist : PITCH_LENGTH - sweepDist;
              // Topun olduğu kanada hafif kay
              targetY = 34 + (ballY - 34) * 0.15;
            }
          }

          // === INSTRUCTION: ROAM FROM POSITION (SAVUNMADA MARKTAN KURTULMA) ===
          // Jitter'a (titremeye) sebep olduğu için rastgele konum kaydırması tamamen kaldırıldı.
          // Zaten 'maxDriftX' onlara yeterli hareket alanı veriyor.

          // === PLAYER INSTRUCTION: ABSOLUTE ENFORCEMENT (DEFENSIVE PHASE) ===
          if (offBallInstruction === 'PressHigher') {
            // Push higher up the pitch to press, ignoring deep defensive lines
            const minPush = isHome ? ballX + 5 : ballX - 5;
            if (isHome) { targetX = Math.max(targetX, minPush); }
            else { targetX = Math.min(targetX, minPush); }
            this.playerStates[p.id].isPressing = true;

            // === PRESSHIGHER TEAMMATE SUPPORT ===
            // When actively pressing (within 8m of ball), push nearby teammates toward ball
            if (distToBall < 8) {
              const myTeammates = isHome ? this.homePlayers : this.awayPlayers;
              myTeammates.forEach((tm) => {
                if (tm.id === p.id || !this.sim.players[tm.id]) return;
                const tmPos = this.sim.players[tm.id];
                const tmDistToBall = dist(tmPos.x, tmPos.y, ballX, ballY);
                if (tmDistToBall < 15 && this.sim.ball.ownerId !== tm.id) {
                  // Push teammate's targetX +8m toward ball
                  const push = isHome ? Math.max(tmPos.x, ballX - 8) : Math.min(tmPos.x, ballX + 8);
                  // Store as a hint via a lightweight flag (non-breaking: just adjust if already calculated)
                  // We directly push their current position target — use playerStates as a temp signal
                  (this.playerStates[tm.id] as any)._pressHigherHintX = push;
                }
              });
            }
          } else if (offBallInstruction === 'StayBack') {
            // DEF: Never push past midfield, clamp aggressively
            if (isHome) { targetX = Math.min(targetX, PITCH_CENTER_X - 5); }
            else { targetX = Math.max(targetX, PITCH_CENTER_X + 5); }
          } else if (offBallInstruction === 'DefendMore') {
            // MID: Stay behind ball, max 10m past center
            const maxForward = isHome ? Math.min(ballX - 10, PITCH_CENTER_X + 10) : Math.max(ballX + 10, PITCH_CENTER_X - 10);
            if (isHome) { targetX = Math.min(targetX, maxForward); }
            else { targetX = Math.max(targetX, maxForward); }
          }

          // === PRESSHIGHER HINT: Apply teammate push from PressHigher support ===
          const pressHintX = (this.playerStates[p.id] as any)._pressHigherHintX;
          if (pressHintX !== undefined && !teamHasBall && role !== Position.GK) {
            if (isHome) targetX = Math.max(targetX, pressHintX);
            else targetX = Math.min(targetX, pressHintX);
            (this.playerStates[p.id] as any)._pressHigherHintX = undefined;
          }

          // === PRESS TRAP: Cut passing lanes when teammates press ===
          const myTeamForTrap = isHome ? this.homePlayers : this.awayPlayers;
          const pressingTeammates = myTeamForTrap.filter(tp =>
            tp.id !== p.id && this.playerStates[tp.id]?.isPressing
          );
          if (pressingTeammates.length >= 1 && role === Position.MID && !teamHasBall) {
            if (distToBall < 12) {
              // Move toward ball to cut passing options
              const pushX = isHome ? Math.max(targetX, ballX - 8) : Math.min(targetX, ballX + 8);
              targetX = pushX;
            }
          }

          targetY = clamp(targetY, 2, PITCH_WIDTH - 2);
          targetX = clamp(targetX, 0, PITCH_LENGTH);
        }
      }
      // === G MOTORU: AKILLI SİNYAL SİSTEMİ (SMART SIGNALING) ===
      // Sadece rastgele değil, gerçekten boşta olan istesin!
      const openness = this.calculateShotOpening(
        simP.x,
        simP.y,
        isHome ? PITCH_LENGTH : 0,
        isHome,
      );
      const amIOpen = openness > 0.6; // Önüm açıksa (bunu 0.5'ten 0.6'ya çektim)

      const enemyGoalX = isHome ? PITCH_LENGTH : 0;
      const distToEnemyGoal = Math.abs(simP.x - enemyGoalX);
      const isInGoodPosition =
        distToEnemyGoal < 30 || (distToEnemyGoal < 45 && role === Position.FWD);

      // POINT: Koşu yoluna iste (Sprint atıyorsam ve önüm boşsa)
      if (simP.state === "SPRINT" && amIOpen && Math.random() < 0.08) {
        this.emitTeamSignal(p, "POINT");
      }

      // CALL: Ayağıma iste (Duruyorsam, tehlikeli bölgedeysem ve boşsam)
      else if (
        simP.state !== "SPRINT" &&
        isInGoodPosition &&
        amIOpen &&
        Math.random() < 0.05
      ) {
        this.emitTeamSignal(p, "CALL");
      }

      // HOLD: Takım arkadaşım zorda ise "Sakin ol" de
      else if (teamHasBall && this.sim.ball.ownerId) {
        // Top taşıyan baskıdaysa
        const carrier = this.sim.players[this.sim.ball.ownerId];
        if (carrier) {
          // Basit bir mesafe kontrolü (baskı hesabı karmaşık, random yeterli)
          if (
            Math.random() < 0.02 &&
            (role === Position.MID || role === Position.DEF)
          ) {
            this.emitTeamSignal(p, "HOLD");
          }
        }
      }
    }
    // İleri koşu yapıyorken geri momentumu iptal et (inertia gecikmesini kır)
    if (isMakingRun && bypassDriftLimit) {
      const forwardDir = isHome ? 1 : -1;
      if (simP.vx * forwardDir < 0) {
        simP.vx = 0; // Geriye giden momentum → anında sıfırla
      }
    }

    // === OFF-BALL RUN OVERRIDE (Koordineli Koşu Hedefi) ===
    const offBallRun = (simP as any).offBallRunTarget;
    if (offBallRun && offBallRun.expiresAt > this.tickCount && p.id !== this.sim.ball.ownerId) {
      targetX = offBallRun.x;
      targetY = offBallRun.y;
      // Clear if reached
      if (dist(simP.x, simP.y, offBallRun.x, offBallRun.y) < 3) {
        (simP as any).offBallRunTarget = undefined;
      }
    }

    this.applySteeringBehavior(p, targetX, targetY, speedMod);
  }

  // === OFF-BALL RUN COORDINATION (Koordineli Ofansif Koşu Sistemi) ===
  private triggerOffBallRuns(ballCarrierId: string, isHome: boolean): void {
    const carrier = isHome
      ? this.homePlayers.find((p) => p.id === ballCarrierId)
      : this.awayPlayers.find((p) => p.id === ballCarrierId);
    if (!carrier) return;
    const team = isHome ? this.homeTeam : this.awayTeam;
    const attackPlan = team.tactic.attackPlan || 'AUTO';
    const teammates = (isHome ? this.homePlayers : this.awayPlayers).filter(
      (p) => p.id !== ballCarrierId && p.lineup === 'STARTING' && this.sim.players[p.id],
    );
    const carrierPos = this.sim.players[ballCarrierId];
    if (!carrierPos) return;

    // Only trigger when in attacking half
    const inAttackingHalf = isHome ? carrierPos.x > 52 : carrierPos.x < 53;
    if (!inAttackingHalf) return;

    // Limit: max 2 runners at a time
    const activeRunners = teammates.filter((p) => {
      const sp = this.sim.players[p.id] as any;
      return sp?.offBallRunTarget && sp.offBallRunTarget.expiresAt > this.tickCount;
    });
    if (activeRunners.length >= 2) return;

    const goalX = isHome ? PITCH_LENGTH : 0;

    switch (attackPlan) {
      case 'DIRECT_CHANNEL': {
        const striker = teammates.find((p) => this.playerRoles[p.id] === Position.FWD);
        if (striker && this.sim.players[striker.id]) {
          const runX = isHome
            ? Math.min(goalX - 8, carrierPos.x + 20)
            : Math.max(goalX + 8, carrierPos.x - 20);
          const runY = GOAL_Y_CENTER + (Math.random() > 0.5 ? 6 : -6);
          (this.sim.players[striker.id] as any).offBallRunTarget = {
            x: runX,
            y: runY,
            expiresAt: this.tickCount + 120,
          };
          this.traceLog.push(`🏃 ${striker.lastName} kanal koşusu yapıyor!`);
        }
        break;
      }
      case 'THIRD_MAN': {
        const mid = teammates.find(
          (p) =>
            this.playerRoles[p.id] === Position.MID &&
            !(this.sim.players[p.id] as any).offBallRunTarget,
        );
        if (mid && this.sim.players[mid.id]) {
          const runX = isHome ? goalX - 12 : goalX + 12;
          const runY = GOAL_Y_CENTER + (Math.random() - 0.5) * 10;
          (this.sim.players[mid.id] as any).offBallRunTarget = {
            x: runX,
            y: runY,
            expiresAt: this.tickCount + 100,
          };
          this.traceLog.push(`🏃 ${mid.lastName} üçüncü adam koşusu!`);
        }
        break;
      }
      case 'WIDE_CROSS': {
        const winger = teammates.find((p) => {
          const simP = this.sim.players[p.id];
          return simP && (simP.y < 20 || simP.y > 48);
        });
        if (winger && this.sim.players[winger.id]) {
          const wingerPos = this.sim.players[winger.id];
          const runX = isHome
            ? Math.min(goalX - 3, wingerPos.x + 15)
            : Math.max(goalX + 3, wingerPos.x - 15);
          (this.sim.players[winger.id] as any).offBallRunTarget = {
            x: runX,
            y: wingerPos.y,
            expiresAt: this.tickCount + 90,
          };
          this.traceLog.push(`🏃 ${winger.lastName} kanat orta koşusu!`);
        }
        break;
      }
      case 'CUTBACK': {
        const attacker = teammates.find((p) => {
          const role = this.playerRoles[p.id];
          return role === Position.FWD || role === Position.MID;
        });
        if (attacker && this.sim.players[attacker.id]) {
          const runX = isHome ? goalX - 6 : goalX + 6;
          const runY = isHome ? GOAL_Y_CENTER + 4 : GOAL_Y_CENTER - 4;
          (this.sim.players[attacker.id] as any).offBallRunTarget = {
            x: runX,
            y: runY,
            expiresAt: this.tickCount + 80,
          };
          this.traceLog.push(`🏃 ${attacker.lastName} geri çıkar pozisyonu!`);
        }
        break;
      }
      default:
        break;
    }
  }

  private isPartnerPressing(p: Player): boolean {
    const myTeamPlayers =
      p.teamId === this.homeTeam.id ? this.homePlayers : this.awayPlayers;
    return myTeamPlayers.some(
      (tm) =>
        tm.id !== p.id &&
        this.playerRoles[tm.id] === Position.DEF &&
        this.playerStates[tm.id]?.isPressing,
    );
  }

  private isClosestTeammateToBall(p: Player): boolean {
    const myTeamPlayers =
      p.teamId === this.homeTeam.id ? this.homePlayers : this.awayPlayers;
    if (!this.sim.players[p.id]) return false;

    const myDist = dist(
      this.sim.players[p.id].x,
      this.sim.players[p.id].y,
      this.sim.ball.x,
      this.sim.ball.y,
    );
    const myGoalX = p.teamId === this.homeTeam.id ? 0 : PITCH_LENGTH;
    const distToGoal = Math.abs(this.sim.ball.x - myGoalX);

    let closerCount = 0;

    for (const tm of myTeamPlayers) {
      if (tm.id === p.id) continue;
      if (tm.lineup !== "STARTING") continue;
      if (!this.sim.players[tm.id]) continue;

      const tmX = this.sim.players[tm.id].x;
      const tmY = this.sim.players[tm.id].y;
      const ballX = this.sim.ball.x;
      const ballY = this.sim.ball.y;

      // Geçilmiş oyuncu kontrolü - topun arkasındaki oyuncuyu sayma
      const isTmBeaten =
        p.teamId === this.homeTeam.id ? tmX > ballX + 2 : tmX < ballX - 2;
      if (isTmBeaten) continue;

      let tmEffectiveDist = dist(tmX, tmY, ballX, ballY);

      // Zaten baskı yapan oyuncu varsa, ona öncelik ver
      if (this.playerStates[tm.id]?.isPressing) {
        tmEffectiveDist *= 0.7;
      }

      if (tmEffectiveDist < myDist) {
        closerCount++;
      }
    }

    // En yakın veya en yakın 2 kişiden biriysen true
    if (closerCount === 0) return true;

    // Tehlikeli bölgedeyse 2 kişi baskı yapabilir
    if (distToGoal < 35 && closerCount < 2) return true;

    return false;
  }

  private applySteeringBehavior(
    p: Player,
    tx: number,
    ty: number,
    maxSpeed: number,
  ) {
    const simP = this.sim.players[p.id];
    if (!simP) return; // Player was removed (red card)
    const state = this.playerStates[p.id];

    const dx = tx - simP.x;
    const dy = ty - simP.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    let desiredVx = 0,
      desiredVy = 0;
    if (distToTarget > 0.5) {
      const speed = distToTarget < 5 ? maxSpeed * (distToTarget / 5) : maxSpeed;
      desiredVx = (dx / distToTarget) * speed;
      desiredVy = (dy / distToTarget) * speed;
    }

    // === SEPARATION FORCE GÜÇLENDIRMESI (GEMİNİ ÖNERİSİ) ===
    // Ayrışma yarıçapı: 2.0 -> 3.5 (Daha geniş kişisel alan)
    // Push strength: 0.5 -> 2.5 (5 kat güçlü itme)
    const separateRadius = 3.5;
    let sepVx = 0,
      sepVy = 0;
    this.allPlayers.forEach((other) => {
      if (other.id !== p.id && this.sim.players[other.id]) {
        const otherPos = this.sim.players[other.id];
        const d = dist(simP.x, simP.y, otherPos.x, otherPos.y);
        if (d < separateRadius && d > 0) {
          const pushStr = (separateRadius - d) / d;
          // 0.5 -> 2.5 (5 katına çıktı!)
          sepVx += (simP.x - otherPos.x) * pushStr * 2.5;
          sepVy += (simP.y - otherPos.y) * pushStr * 2.5;
        }
      }
    });

    const finalVx = desiredVx + sepVx;
    const finalVy = desiredVy + sepVy;

    const agility = (p.attributes.dribbling + p.attributes.speed * 0.5) / 150;
    const inertia = PLAYER_ACCELERATION * agility;

    simP.vx = lerp(simP.vx, finalVx, inertia);
    simP.vy = lerp(simP.vy, finalVy, inertia);

    const currentSpeed = Math.sqrt(simP.vx * simP.vx + simP.vy * simP.vy);

    // === MERKEZİ YORGUNLUK ETKİSİ - HIZ ===
    const physicalMod = getFatigueModifier(state.currentStamina, "physical");
    let staminaFactor = physicalMod;

    // 25% altında sprint atamaz - sadece jog yapabilir
    if (state.currentStamina < 25) {
      staminaFactor = Math.min(staminaFactor, 0.55); // Max %55 hız
    }
    // 10% altında yürümek bile zor
    if (state.currentStamina < 10) {
      staminaFactor = Math.min(staminaFactor, 0.4); // Max %40 hız
    }

    let speedPenalty = 1.0;
    if (p.id === this.sim.ball.ownerId) {
      const driSkill = p.attributes.dribbling || 50;
      // NERF v2: Top sürerken daha yavaş ol (savunmacılar yetişsin)
      // Eski: 0.80 + dri/100 * 0.15 = 0.80-0.95 arası
      // Yeni: 0.72 + dri/100 * 0.13 = 0.72-0.85 arası
      speedPenalty = 0.72 + (driSkill / 100) * 0.13;
    }

    // MEANINGFUL SPEED FORMULA - Stats should matter!
    // Formula: 0.75 + speed/250
    let speedBonus = 0.75 + p.attributes.speed / 250;

    // === YETENEK ETKİLERİ: HIZ ===
    // "Seri" yeteneği: Sprint hızı %8 bonus
    if (p.playStyles?.includes("Seri")) {
      speedBonus *= 1.08;
    }
    // "Seri" yeteneği: İvmelenme bonusu (inertia'da uygulanır, burada küçük hız bonusu)
    if (p.playStyles?.includes("Seri")) {
      speedBonus *= 1.04;
    }

    // Cap at 1.20x to prevent light-speed bug (raised from 1.15 for abilities)
    speedBonus = Math.min(speedBonus, 1.2);
    const physicalLimit =
      Math.min(maxSpeed, MAX_PLAYER_SPEED) *
      speedBonus *
      staminaFactor *
      speedPenalty;

    if (currentSpeed > 0.8) {
      const movementAngle = Math.atan2(simP.vy, simP.vx);
      const angleDiff = Math.abs(movementAngle - simP.facing);
      if (angleDiff > 1.5) {
        simP.vx *= 0.8;
        simP.vy *= 0.8;
      }
    }

    if (currentSpeed > physicalLimit) {
      simP.vx = (simP.vx / currentSpeed) * physicalLimit;
      simP.vy = (simP.vy / currentSpeed) * physicalLimit;
    }

    // STRICT HARD CAP - No player can EVER exceed MAX_PLAYER_SPEED
    // This is the absolute final safety check
    const ABSOLUTE_MAX = MAX_PLAYER_SPEED;
    const newSpeed = Math.sqrt(simP.vx * simP.vx + simP.vy * simP.vy);
    if (newSpeed > ABSOLUTE_MAX) {
      simP.vx = (simP.vx / newSpeed) * ABSOLUTE_MAX;
      simP.vy = (simP.vy / newSpeed) * ABSOLUTE_MAX;
    }

    simP.x = clamp(simP.x + simP.vx, 0, PITCH_LENGTH);
    simP.y = clamp(simP.y + simP.vy, 0, PITCH_WIDTH);

    // --- FACING LOGIC ---
    // If moving fast, face movement direction.
    // If slow/idle, FACE THE BALL to look at play.
    let targetAngle = simP.facing;

    if (currentSpeed > 0.3) {
      targetAngle = Math.atan2(simP.vy, simP.vx);
    } else {
      // Look at ball
      targetAngle = Math.atan2(
        this.sim.ball.y - simP.y,
        this.sim.ball.x - simP.x,
      );
    }

    let angleDiff = targetAngle - simP.facing;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    simP.facing += angleDiff * PLAYER_TURN_SPEED;

    // --- MESAFE BAZLI YORGUNLUK SİSTEMİ ---
    // Gerçek futbol verilerine göre:
    // - Bir futbolcu 8-12 tam saha sprinti sonrası ciddi yorulur
    // - Jog ile 20-30 tam saha sonrası yorulur
    // - Saha = 105 metre (PITCH_LENGTH)

    const isSprinting = currentSpeed > MAX_PLAYER_SPEED * 0.75;
    const isRunning = currentSpeed > MAX_PLAYER_SPEED * 0.3;
    const isWalking = currentSpeed > MAX_PLAYER_SPEED * 0.1;

    // Her tick'te kat edilen mesafeyi hesapla ve kaydet
    // ARTIRILDI: Mesafe çarpanları yükseltildi (daha hızlı yorulma)
    const distanceThisTick = currentSpeed; // birim/tick

    if (isSprinting) {
      // Sprint mesafesi 1.3x çarpanla kaydedilir (daha yorucu)
      state.sprintDistance =
        (state.sprintDistance || 0) + distanceThisTick * 1.3;
    } else if (isRunning) {
      // Koşu mesafesi 1.15x çarpanla kaydedilir
      state.runDistance = (state.runDistance || 0) + distanceThisTick * 1.15;
    }
    // Yürüyüş ve durma mesafe olarak sayılmaz (yorgunluk yaratmaz)

    // === YORGUNLUK PUANI HESABI ===
    // Formül: (sprint mesafesi × 2.5) + (koşu mesafesi × 0.7)
    // ARTIRILDI: Çarpanlar yükseltildi
    const FIELD_LENGTH = PITCH_LENGTH; // metre
    const sprintFields = (state.sprintDistance || 0) / FIELD_LENGTH;
    const runFields = (state.runDistance || 0) / FIELD_LENGTH;
    const isGK = this.playerRoles[p.id] === Position.GK; // Check if player is GK

    // Stamina cost base (GK runs far less than field players)
    const sprintCost = isGK ? sprintFields * 0.25 : sprintFields;
    const runCost = isGK ? runFields * 0.1 : runFields;

    // ~%30 az yorgunluk (eski: 2.0/0.55 → yeni: 1.4/0.39)
    const fatigueScore = sprintCost * 1.4 + runCost * 0.39;

    // === STAMINA ATTRIBUTE ETKİSİ ===
    // Yüksek dayanıklılık = yorgunluk eşiği yükselir
    // 50 stamina = 12 eşik, 80 stamina = 15 eşik, 99 stamina = 17 eşik
    const staminaAttr = p.attributes?.stamina || 60;
    let fatigueThreshold = 7 + staminaAttr / 10;

    // === YETENEK ETKİSİ: AMANSIZ ===
    if (p.playStyles?.includes("Amansız")) {
      fatigueThreshold *= 1.35; // %35 daha fazla dayanır
    }

    // === STAMINA HESABI ===
    // fatigueScore 0 → %100 stamina
    // fatigueScore = threshold → %50 stamina (ciddi yorgunluk)
    // fatigueScore = threshold * 2 → %0 stamina (bitkin)
    const fatigueRatio = fatigueScore / fatigueThreshold;
    let newStamina = 100 - fatigueRatio * 50;

    // Durma/yürüyüş ile HAFIF dinlenme (ama mesafe sıfırlanmaz!)
    if (!isSprinting && !isRunning) {
      // Dinlenirken çok yavaş toparlanma - AZALTILDI
      const recoveryRate = 0.005 + staminaAttr / 12000; // 0.005-0.013 arası
      newStamina = Math.min(100, newStamina + recoveryRate);

      // Ayrıca sprint/run distance çok yavaş azalır (laktik asit atılması)
      if (state.sprintDistance > 0) {
        state.sprintDistance = Math.max(0, state.sprintDistance - 0.015);
      }
      if (state.runDistance > 0) {
        state.runDistance = Math.max(0, state.runDistance - 0.025);
      }
    }

    state.currentStamina = Math.max(0, Math.min(100, newStamina));

    // SYNC TO PUBLIC STATE for UI
    simP.stamina = state.currentStamina;
  }

  private resolveCollisions() {
    // === PERFORMANCE: Skip collision detection every other tick ===
    // Collision resolution is O(n²) but doesn't need to run every tick
    // Players don't move fast enough for 1-tick gaps to matter
    if (this.tickCount % 2 !== 0) return;

    const players =
      this._cachedStarters.length > 0 ? this._cachedStarters : this.allPlayers;
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = this.sim.players[players[i].id];
        const p2 = this.sim.players[players[j].id];
        if (!p1 || !p2) continue;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        // === PHANTOM FOUL FIX ===
        // Temas mesafesi düşürüldü: 1.0 -> 0.6
        // Artık oyuncular birbirine gerçekten değmeden "çarpışma" sayılmayacak.
        const minD = 0.6; // Was 1.0 (Too wide)

        if (d < minD && d > 0.01) {
          const overlap = minD - d;
          const nx = dx / d;
          const ny = dy / d;
          p1.x += nx * overlap * 0.5;
          p1.y += ny * overlap * 0.5;
          p2.x -= nx * overlap * 0.5;
          p2.y -= ny * overlap * 0.5;

          const p1HasBall = players[i].id === this.sim.ball.ownerId;
          const p2HasBall = players[j].id === this.sim.ball.ownerId;

          if (p1HasBall) {
            // === DRIBBLING SKILL GAP (p1) ===
            const GLOBAL_BUFF = 1.0;

            const p1State = this.playerStates[players[i].id];
            const p2State = this.playerStates[players[j].id];
            const p1Dri =
              players[i].attributes.dribbling *
              GLOBAL_BUFF *
              (p1State?.currentStamina > 30 ? 1 : 0.8);
            const p2Tac =
              players[j].attributes.tackling *
              (p2State?.currentStamina > 30 ? 1 : 0.8);
            const diff = p1Dri - p2Tac;

            if (
              (p1Dri > 80 && diff > 10) ||
              players[i].playStyles?.includes("Top Cambazı")
            ) {
              p1.vx *= 0.75;
              p1.vy *= 0.75; // Less slowdown
              if (p1State) p1State.actionLock = 4; // Faster recovery
              if (p2State) p2State.actionLock = 12; // Defender stunned
            } else {
              p1.vx *= 0.5;
              p1.vy *= 0.5;
              if (p1State) p1State.actionLock = 8;
              this.lastTouchTeamId = players[j].teamId;
            }
          } else {
            p1.vx *= 0.9;
            p1.vy *= 0.9;
          }

          // === VISUALS: COLLISION CUE ===
          // Add "struggle" effect
          (p1 as any).isCollided = true;
          (p2 as any).isCollided = true;

          if (p2HasBall) {
            // === DRIBBLING SKILL GAP (p2) ===
            const p2State = this.playerStates[players[j].id];
            const p1State = this.playerStates[players[i].id];
            const p2Dri =
              players[j].attributes.dribbling *
              (p2State?.currentStamina > 30 ? 1 : 0.8);
            const p1Tac =
              players[i].attributes.tackling *
              (p1State?.currentStamina > 30 ? 1 : 0.8);
            const diff = p2Dri - p1Tac;

            if (
              (p2Dri > 80 && diff > 10) ||
              players[j].playStyles?.includes("Top Cambazı")
            ) {
              p2.vx *= 0.75;
              p2.vy *= 0.75;
              if (p2State) p2State.actionLock = 4;
              if (p1State) p1State.actionLock = 12;
            } else {
              p2.vx *= 0.5;
              p2.vy *= 0.5;
              if (p2State) p2State.actionLock = 8;
              this.lastTouchTeamId = players[i].teamId;
            }
          } else {
            p2.vx *= 0.9;
            p2.vy *= 0.9;
          }
        }
      }
    }
  }

  private checkGameEvents(): MatchEvent | null {
    const b = this.sim.ball;
    const outLeft = b.x < 0;
    const outRight = b.x > PITCH_LENGTH;
    const outTop = b.y < 0;
    const outBottom = b.y > PITCH_WIDTH;

    // === THROW-IN: Ball out on sides ===
    if (outTop || outBottom) {
      // Determine which team gets throw-in (opposite of last touch)
      const lastTouchWasHome = this.lastTouchTeamId === this.homeTeam.id;
      const throwingTeamIsHome = !lastTouchWasHome;

      // Throw-in position - MUST be inside field to prevent infinite loop!
      const throwX = clamp(b.x, 5, PITCH_LENGTH - 5); // Keep within reasonable X range
      const throwY = outTop ? 2 : PITCH_WIDTH - 2; // Place ball INSIDE the field, not on edge!

      // Find closest non-GK player to throw position from throwing team
      const throwingTeamPlayers = (
        throwingTeamIsHome ? this.homePlayers : this.awayPlayers
      ).filter(
        (p) =>
          p.lineup === "STARTING" && this.playerRoles[p.id] !== Position.GK,
      );

      const thrower = throwingTeamPlayers.sort((a, b) => {
        const distA = this.sim.players[a.id]
          ? dist(
            throwX,
            throwY,
            this.sim.players[a.id].x,
            this.sim.players[a.id].y,
          )
          : 999;
        const distB = this.sim.players[b.id]
          ? dist(
            throwX,
            throwY,
            this.sim.players[b.id].x,
            this.sim.players[b.id].y,
          )
          : 999;
        return distA - distB;
      })[0];

      if (thrower && this.sim.players[thrower.id]) {
        // Only move the thrower - DON'T reset everyone's positions!
        this.sim.players[thrower.id].x = throwX;
        this.sim.players[thrower.id].y = throwY;
        this.sim.players[thrower.id].vx = 0;
        this.sim.players[thrower.id].vy = 0;
        this.sim.ball.ownerId = thrower.id;
        this.sim.ball.x = throwX;
        this.sim.ball.y = throwY;
        this.sim.ball.vx = 0;
        this.sim.ball.vy = 0;
        this.sim.ball.vz = 0;
        if (this.playerStates[thrower.id]) {
          this.playerStates[thrower.id].actionLock = 3;
        }
      }

      const throwingTeam = throwingTeamIsHome ? this.homeTeam : this.awayTeam;
      return {
        minute: this.internalMinute,
        type: MatchEventType.THROW_IN,
        description: `Throw-in: ${throwingTeam.name}`,
        teamId: throwingTeam.id,
      };
    }

    // === GOAL or OUT on goal line ===
    if (outLeft || outRight) {
      if (b.y > GOAL_Y_TOP && b.y < GOAL_Y_BOTTOM && b.z < 2.44) {
        // GOAL!
        if (outLeft) {
          const scorerId = this.lastShooterId;
          const scorer = scorerId ? this.getPlayer(scorerId) : null;
          this.lastShooterId = null;
          this.resetPositions("KICKOFF", this.homeTeam.id);
          // Queue KICKOFF event after GOAL
          this.pendingEvents.push({
            minute: this.internalMinute,
            type: MatchEventType.KICKOFF,
            description: "Kickoff",
            teamId: this.homeTeam.id,
          });
          this.match.awayScore++; // Update internal score state
          return {
            minute: this.internalMinute,
            type: MatchEventType.GOAL,
            description: `Goal! ${scorer ? scorer.lastName : this.awayTeam.name}`,
            teamId: this.awayTeam.id,
            playerId: scorerId || undefined,
          };
        }
        if (outRight) {
          const scorerId = this.lastShooterId;
          const scorer = scorerId ? this.getPlayer(scorerId) : null;
          this.lastShooterId = null;
          this.resetPositions("KICKOFF", this.awayTeam.id);
          // Queue KICKOFF event after GOAL
          this.pendingEvents.push({
            minute: this.internalMinute,
            type: MatchEventType.KICKOFF,
            description: "Kickoff",
            teamId: this.awayTeam.id,
          });
          this.match.homeScore++; // Update internal score state
          return {
            minute: this.internalMinute,
            type: MatchEventType.GOAL,
            description: `Goal! ${scorer ? scorer.lastName : this.homeTeam.name}`,
            teamId: this.homeTeam.id,
            playerId: scorerId || undefined,
          };
        }
      } else {
        // Corner or Goal Kick
        const isHomeGoalSide = outLeft;
        const lastTouchWasHome = this.lastTouchTeamId === this.homeTeam.id;

        if (isHomeGoalSide) {
          // Ball out on HOME (left) goal side
          if (lastTouchWasHome && this.lastTouchTeamId) {
            // Last touch by HOME team = CORNER for AWAY team
            const isTop = b.y < PITCH_CENTER_Y;
            this.resetPositions(
              isTop ? "CORNER_AWAY_TOP" : "CORNER_AWAY_BOTTOM",
            );
            return {
              minute: this.internalMinute,
              type: MatchEventType.CORNER,
              description: `Corner: ${this.awayTeam.name}`,
              teamId: this.awayTeam.id,
            };
          } else {
            // Last touch by AWAY team OR unknown = GOAL KICK for HOME team
            const gk = this.homePlayers.find(
              (p) =>
                this.playerRoles[p.id] === Position.GK &&
                p.lineup === "STARTING",
            );
            if (gk && this.sim.players[gk.id]) {
              this.sim.players[gk.id].x = 5;
              this.sim.players[gk.id].y = PITCH_CENTER_Y;
              this.sim.ball.ownerId = gk.id;
              this.sim.ball.x = 5;
              this.sim.ball.y = PITCH_CENTER_Y;
              this.sim.ball.vx = 0;
              this.sim.ball.vy = 0;
              this.sim.ball.vz = 0;
              this.sim.ball.z = 0;
              if (this.playerStates[gk.id]) {
                this.playerStates[gk.id].actionLock = 5;
              }
            }
          }
        } else {
          // Ball out on AWAY (right) goal side
          if (!lastTouchWasHome && this.lastTouchTeamId) {
            // Last touch by AWAY team = CORNER for HOME team
            const isTop = b.y < PITCH_CENTER_Y;
            this.resetPositions(
              isTop ? "CORNER_HOME_TOP" : "CORNER_HOME_BOTTOM",
            );
            return {
              minute: this.internalMinute,
              type: MatchEventType.CORNER,
              description: `Corner: ${this.homeTeam.name}`,
              teamId: this.homeTeam.id,
            };
          } else {
            // Last touch by HOME team OR unknown = GOAL KICK for AWAY team
            const gk = this.awayPlayers.find(
              (p) =>
                this.playerRoles[p.id] === Position.GK &&
                p.lineup === "STARTING",
            );
            if (gk && this.sim.players[gk.id]) {
              this.sim.players[gk.id].x = PITCH_LENGTH - 5;
              this.sim.players[gk.id].y = PITCH_CENTER_Y;
              this.sim.ball.ownerId = gk.id;
              this.sim.ball.x = PITCH_LENGTH - 5;
              this.sim.ball.y = PITCH_CENTER_Y;
              this.sim.ball.vx = 0;
              this.sim.ball.vy = 0;
              this.sim.ball.vz = 0;
              this.sim.ball.z = 0;
              if (this.playerStates[gk.id]) {
                this.playerStates[gk.id].actionLock = 5;
              }
            }
          }
        }
        return null;
      }
    }
    return null;
  }

  private getActionText(teamId: string | null): string {
    if (!teamId) return "Loose Ball";
    const teamName =
      teamId === this.homeTeam.id ? this.homeTeam.name : this.awayTeam.name;
    if (this.sim.ball.x > 37 && this.sim.ball.x < 68)
      return `${teamName} Building Up`;
    if (this.sim.ball.x < 32)
      return teamId === this.homeTeam.id
        ? `${teamName} Defending Deep`
        : `${teamName} Pressing`;
    if (this.sim.ball.x > 73)
      return teamId === this.homeTeam.id
        ? `${teamName} Attacking`
        : `${teamName} Defending Deep`;
    return `${teamName} In Possession`;
  }

  private actionPass(
    carrier: Player,
    target: Player,
    type: "GROUND" | "THROUGH" | "AERIAL",
    targetOverrideX?: number,
    targetOverrideY?: number,
  ) {
    const cPos = this.sim.players[carrier.id];
    const tPos = this.sim.players[target.id];
    const state = this.playerStates[carrier.id];

    // === ONE-TWO SETUP ===
    if (state) {
      state.lastAction = "PASS";
      state.lastActionTick = this.tickCount;
    }

    // === OFSAYT KONTROLÜ ===
    // Pas hedefi ofsayt pozisyondaysa pası iptal et!
    // GK pasları ve geri paslar ofsayt olmaz
    const isHome = carrier.teamId === this.homeTeam.id;
    const offsideLineX = isHome ? this._awayDefLine : this._homeDefLine;
    if (offsideLineX !== undefined && target.position !== Position.GK) {
      const targetIsAhead = isHome
        ? tPos.x > offsideLineX + 1.0 // 1m tolerans
        : tPos.x < offsideLineX - 1.0;
      const carrierIsAhead = isHome
        ? cPos.x > offsideLineX
        : cPos.x < offsideLineX;
      // Ofsayt: hedef defans hattının ötesinde VE pasör hattın gerisinde (ileri pas)
      const isForwardPass = isHome ? tPos.x > cPos.x : tPos.x < cPos.x;
      if (targetIsAhead && !carrierIsAhead && isForwardPass) {
        // OFSAYT! Pası iptal et, serbest vuruş ver
        this.sim.ball.ownerId = null;
        this.sim.ball.vx = 0;
        this.sim.ball.vy = 0;
        this.sim.ball.vz = 0;
        // Topu ofsayt noktasına koy
        this.sim.ball.x = tPos.x;
        this.sim.ball.y = tPos.y;
        this.traceLog.push(
          `🚩 OFSAYT! ${target.lastName} ofsayt pozisyonda — serbest vuruş!`,
        );
        // Event oluştur
        this.pendingEvents.push({
          minute: this.internalMinute,
          type: MatchEventType.OFFSIDE,
          description: `🚩 ${target.lastName} offside! Free kick.`,
          teamId: carrier.teamId,
          playerId: target.id,
        });
        // Rakip takıma serbest vuruş ver
        const enemyTeamPlayers = isHome ? this.awayPlayers : this.homePlayers;
        const nearestEnemy = enemyTeamPlayers
          .filter(
            (ep) =>
              ep.lineup === "STARTING" &&
              this.playerRoles[ep.id] === Position.DEF,
          )
          .sort(
            (a, b) =>
              dist(
                this.sim.players[a.id].x,
                this.sim.players[a.id].y,
                tPos.x,
                tPos.y,
              ) -
              dist(
                this.sim.players[b.id].x,
                this.sim.players[b.id].y,
                tPos.x,
                tPos.y,
              ),
          )[0];
        if (nearestEnemy) {
          this.sim.ball.ownerId = nearestEnemy.id;
        }
        this.playerStates[carrier.id].actionLock = 15;
        return; // Pası iptal et
      }
    }

    // === YORGUNLUK DAHİL GERÇEK STATLAR ===
    const isGK = carrier.position === Position.GK;
    const fatigueMods = getAllFatigueModifiers(state.currentStamina, isGK);

    const pasStat = carrier.attributes.passing * fatigueMods.passing;
    const vision = carrier.attributes.vision * fatigueMods.vision;
    const composure = carrier.attributes.composure * fatigueMods.composure;
    const decisions = carrier.attributes.decisions * fatigueMods.decisions;

    let tx = targetOverrideX !== undefined ? targetOverrideX : tPos.x;
    let ty = targetOverrideY !== undefined ? targetOverrideY : tPos.y;

    // === YENİ: AKILLI PAS HEDEFLEMESİ (v2) ===
    // Topun varış süresini hesapla ve alıcının o sürede nerede olacağını öngör
    if (targetOverrideX === undefined) {
      // Mesafeye göre pas hızını tahmin et
      const initialDist = dist(cPos.x, cPos.y, tPos.x, tPos.y);

      // Tahmini pas hızı (mesafeye bağlı)
      // AERIAL: Fizik bazlı hesap — lob yüksekliği ve air drag'a göre
      // GROUND: 0.75x MAX_BALL_SPEED (~90 km/h)
      let estimatedPassSpeed: number;
      if (type === "AERIAL") {
        // Fizik bazlı: lobHeight → airTime → gereken yatay hız
        let estLobH =
          initialDist < 12
            ? Math.min(1.5, 0.4 + initialDist * 0.07)
            : initialDist < 30
              ? Math.min(2.2, 0.7 + initialDist * 0.035)
              : Math.min(3.0, 0.9 + initialDist * 0.03);
        const estAirTime = (2 * estLobH) / GRAVITY;
        const estDragSum =
          (1 - Math.pow(BALL_AIR_DRAG, estAirTime)) / (1 - BALL_AIR_DRAG);
        estimatedPassSpeed = estDragSum > 0.1 ? initialDist / estDragSum : 1.0;
      } else {
        estimatedPassSpeed = Math.min(
          MAX_BALL_SPEED * 0.75,
          1.5 + initialDist * 0.04,
        );
      }

      // Topun varış süresi (tick cinsinden)
      const travelTime =
        estimatedPassSpeed > 0.1 ? initialDist / estimatedPassSpeed : 5;

      // Alıcının hızı
      const receiverSpeed = Math.sqrt(
        (tPos.vx || 0) ** 2 + (tPos.vy || 0) ** 2,
      );

      if (type === "THROUGH") {
        // THROUGH BALL: Alıcının koşacağı yere hedefle
        // Vision etkisi: Yüksek vision = daha iyi öngörü
        const visionFactor = Math.min(1.5, vision / 60);

        // Alıcının gelecek pozisyonu = şimdiki pozisyon + hız × süre
        const leadFactor = travelTime * visionFactor;
        tx = tPos.x + (tPos.vx || 0) * leadFactor;
        ty = tPos.y + (tPos.vy || 0) * leadFactor;
      } else {
        // GROUND/NORMAL PAS: Hafif lead, ama çok değil
        // Alıcı hareket ediyorsa biraz önüne at
        if (receiverSpeed > 0.3) {
          const leadFactor = Math.min(travelTime * 0.6, 8); // Max 8 tick lead
          tx = tPos.x + (tPos.vx || 0) * leadFactor;
          ty = tPos.y + (tPos.vy || 0) * leadFactor;
        } else {
          // Alıcı duruyor - direkt ona at
          tx = tPos.x;
          ty = tPos.y;
        }
      }
    }

    // === PAS HATA PAYI (ERROR MARGIN) - YENİ! ===
    const teamTactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;

    // 1. Baz Hata (Yetenek ve Yorgunluk Etkili)
    // Pas 100 -> 0.2m sapma, Pas 50 -> 1.5m sapma
    let targetErrorBase = Math.max(0.2, (100 - pasStat) / 33.3);

    // 2. Stil Çarpanı (Risk Faktörü)
    let styleMod = 1.0;
    if (teamTactic.passingStyle === "Short")
      styleMod = 0.5; // Çok isabetli
    else if (teamTactic.passingStyle === "Mixed")
      styleMod = 1.0; // Normal
    else if (teamTactic.passingStyle === "Direct")
      styleMod = 1.4; // Biraz riskli
    else if (teamTactic.passingStyle === "LongBall") styleMod = 2.0; // Çok riskli

    // 3. Mesafe Çarpanı (Uzaklaştıkça sapma artar)
    // Kısa paslarda hata az, uzun paslarda logaritmik artar
    const passDistCalc = dist(cPos.x, cPos.y, tx, ty);
    const distMod = Math.max(1.0, passDistCalc / 25.0);

    // 4. Nihai Hata
    const targetErrorTotal = targetErrorBase * styleMod * distMod;

    const dx = tx - cPos.x;
    const dy = ty - cPos.y;
    const angle = Math.atan2(dy, dx);
    const distToT = Math.sqrt(dx * dx + dy * dy);

    // === PAS HATASI (BALANCED v3) ===
    // ESKİ v2: 0.04 base + 0.008 multiplier = çok fazla hata, paslar kesiliyordu
    // YENİ v3: 0.02 base + 0.006 multiplier = daha dengeli
    // pas 80 için: 0.02 + (20 * 0.006) = 0.14 radyan (~8 derece)
    const baseError = 0.02; // Azaltıldı: 0.04 → 0.02
    let errorMargin = baseError + (100 - pasStat) * 0.006; // Azaltıldı: 0.008 → 0.006

    // Composure: Baskı altında pas kalitesi
    errorMargin *= 1 + (1 - composure / 100) * 0.3; // 0.4→0.3 (eski değer)

    // Decisions: Kötü karar = yanlış yere pas
    errorMargin *= 1 + (1 - decisions / 100) * 0.2; // 0.3→0.2 (eski değer)

    // MESAFE BAZLI HATA: Uzun paslar daha hatalı
    if (distToT > 30) errorMargin *= 1.15; // 25→30, 1.2→1.15
    if (distToT > 40) errorMargin *= 1.1; // 35→40, 1.15→1.10

    // === YETENEK ETKİSİ: KESKİN PAS ===
    // "Keskin Pas" yeteneği: Through ball isabeti %25 artar
    if (type === "THROUGH" && carrier.playStyles?.includes("Keskin Pas")) {
      errorMargin *= 0.75;
    }

    // === YETENEK ETKİSİ: UZUN TOPLA PAS ===
    // "Maestro" yeteneği: Havadan pas isabeti %30 artar
    if (type === "AERIAL" && carrier.playStyles?.includes("Maestro")) {
      errorMargin *= 0.7;
    }

    errorMargin *= 1 + Math.min(0.25, targetErrorTotal * 0.2);

    const finalAngle = angle + (Math.random() * errorMargin - errorMargin / 2);

    // FIXED AERIAL PASS POWER - Was overshooting targets!
    // Strength etkisi: Yorgun oyuncu uzun pas atamaz
    let power: number;
    const strengthMod = fatigueMods.strength;
    if (type === "AERIAL") {
      // === FİZİK BAZLI AERIAL PAS (v3 - DOĞRU HESAP) ===
      // Sorun: Eski formül air drag ve gravity'yi hesaba katmıyordu
      // Top 50m'ye atılmak istenirken 71m gidiyordu (%40 overshoot!)
      // Çözüm: Topun havada kalma süresini hesapla, sonra gereken yatay hızı bul

      // 1. LOB YÜKSEKLİĞİ (vz) — mesafeye göre ark yüksekliği
      let lobHeight: number;
      if (distToT < 12) {
        // Chip pass: Alçak, zarif ark
        lobHeight = Math.min(1.5, 0.4 + distToT * 0.07) * strengthMod;
      } else if (distToT < 30) {
        // Normal orta: Orta yükseklik
        lobHeight = Math.min(2.2, 0.7 + distToT * 0.035) * strengthMod;
      } else {
        // Uzun top: Yüksek ark
        lobHeight = Math.min(3.0, 0.9 + distToT * 0.03) * strengthMod;
      }

      // 2. HAVADA KALMA SÜRESİ — yerçekimi ile hesap (tick cinsinden)
      // vz her tick GRAVITY (0.20) kadar azalır
      // Zirve süresi = lobHeight / GRAVITY
      // Toplam uçuş = 2 * zirve (yukarı + aşağı)
      const airTime = (2 * lobHeight) / GRAVITY;

      // 3. GEREKEN YATAY HIZ — air drag dahil
      // Her tick: vx *= BALL_AIR_DRAG (0.98)
      // Toplam mesafe = vx0 * (1 - drag^airTime) / (1 - drag)
      // => vx0 = distToT * (1 - drag) / (1 - drag^airTime)
      const drag = BALL_AIR_DRAG;
      const dragSum = (1 - Math.pow(drag, airTime)) / (1 - drag);

      // Güvenlik: dragSum 0 olmasın
      if (dragSum > 0.1) {
        // FIXED: Power calculation now accounts for drag applied BEFORE movement (v3.1)
        // Physics engine: vx *= drag; x += vx;
        // So first tick moves (power * drag), not power.
        power = (distToT / dragSum / drag) * strengthMod;
      } else {
        power = distToT * 0.05 * strengthMod; // Fallback
      }

      // Clamp: Çok yüksek güç olmasın
      power = Math.min(MAX_BALL_SPEED * 0.65, power);
      // Minimum: Çok düşük güç de olmasın
      power = Math.max(0.5, power);

      // === LOB'U UYGULA ===
      this.sim.ball.vz = lobHeight;
      this.sim.ball.curve = 0;

      // Trace log
      if (distToT < 12) {
        this.traceLog.push(`${carrier.lastName} zarif bir aşırtma pas attı!`);
      } else if (distToT < 30) {
        this.traceLog.push(`${carrier.lastName} havadan pas attı!`);
      } else {
        this.traceLog.push(
          `${carrier.lastName} uzun bir havadan pas gönderdi!`,
        );
      }
    } else {
      power =
        Math.min(MAX_BALL_SPEED * 0.75, 1.5 + distToT * 0.04) * strengthMod;
    }

    this.sim.ball.ownerId = null;
    this.sim.mode = undefined; // YENİ: Set piece sonrası oyun normale döner
    // === RECEIVER AWARENESS ===
    // Topa hedef atıyoruz ki alıcı topun kendisine geldiğini anlasın
    (this.sim.ball as any).targetId = target.id;

    // === INCOMING_PASS SİNYALİ (OFSAYT KORUMA SİSTEMİ) ===
    // Hedef oyuncuya "Top sana geliyor, ŞİMDİ koş!" sinyali gönder.
    // Bu sinyal olmadan forvetler agresif depar atmaz (ofsayta düşmeyi önler)
    if (this.playerStates[target.id]) {
      this.playerStates[target.id].incomingSignal = {
        type: "INCOMING_PASS",
        targetId: carrier.id,
        expiryTick: this.tickCount + 120, // ~2 saniye boyunca geçerli
      };
    }
    this.sim.ball.x = cPos.x + Math.cos(finalAngle) * 1.5;
    this.sim.ball.y = cPos.y + Math.sin(finalAngle) * 1.5;
    this.sim.ball.vx = Math.cos(finalAngle) * power;
    this.sim.ball.vy = Math.sin(finalAngle) * power;

    if (type !== "AERIAL") {
      // Ground/Through pass: z ekseni yok
      this.sim.ball.vz = 0;
      this.sim.ball.curve = 0;
    }
    // AERIAL tipi için vz ve curve yukarıda zaten set edildi

    this.playerStates[carrier.id].possessionCooldown = 12;
    // SPEED GLITCH FIX: Passer Lockout
    // Prevent passer from immediately chasing their own ball
    // PHASE 10: Reduced from 8 to 2 for instant reaction (Aggressive One-Two)
    this.playerStates[carrier.id].actionLock = 2;

    this.sim.players[carrier.id].state = "KICK";

    this.lastTouchTeamId = carrier.teamId;

    // === G MOTORU: VER-KAÇ (PASS & MOVE) ===
    // Pası atan oyuncu (GK hariç) pası attıktan sonra durmasın, ileri koşsun!
    const isAttackingRole =
      this.playerRoles[carrier.id] !== Position.DEF &&
      this.playerRoles[carrier.id] !== Position.GK;
    const tacticName =
      carrier.teamId === this.homeTeam.id
        ? this.homeTeam.tactic.style
        : this.awayTeam.tactic.style;
    const isDefensiveTactic =
      tacticName === "Defensive" || tacticName === "ParkTheBus";

    // Eğer defansif oynamıyorsak ve oyuncu hücumcuysa, pası at ve koş!
    if (isAttackingRole && !isDefensiveTactic) {
      // Hızlı bir depar (Ver-Kaç) - 1.5 - 2 saniye (90-120 ticks)
      const runDuration = 90 + Math.floor(Math.random() * 30);
      this.playerStates[carrier.id].supportRunUntil =
        this.tickCount + runDuration;

      // Ver-Kaç yaparken elini kaldırıp "önüme at" desin (POINT)
      // Olasılık arttırıldı: %40 -> %70
      if (Math.random() < 0.7) {
        this.emitTeamSignal(carrier, "POINT", target.id);
      }
    }

    const typeText =
      type === "THROUGH"
        ? "Ara pası"
        : type === "AERIAL"
          ? "Havadan pas"
          : "Pas";
    this.traceLog.push(`${carrier.lastName} ${typeText} denedi.`);
  }

  private actionShoot(p: Player, isHome: boolean) {
    const pos = this.sim.players[p.id];
    const goalX = isHome ? PITCH_LENGTH : 0;
    const goalY = PITCH_CENTER_Y;
    const state = this.playerStates[p.id];

    // === YORGUNLUK DAHİL GERÇEK STATLAR ===
    const isGK = p.position === Position.GK;
    const fatigueMods = getAllFatigueModifiers(state.currentStamina, isGK);

    // === GLOBAL SKILL BUFF (PHASE 14 - HYBRID ENGINE) ===
    const GLOBAL_BUFF = 1.2; // G Motoru Akışkanlık Bonusu

    const fin = p.attributes.finishing * fatigueMods.finishing * GLOBAL_BUFF;
    const pwr = p.attributes.strength * fatigueMods.strength * GLOBAL_BUFF;

    // Composure ve Decisions da bufflanıyor (soğukkanlılık artsın)
    const composure = p.attributes.composure * fatigueMods.composure * 1.1;
    const decisions = p.attributes.decisions * fatigueMods.decisions * 1.1;

    // === xG HESABI (BUFF v2: Bitiricilerin Etkisi Artirildi) ===
    const distToGoal = dist(pos.x, pos.y, goalX, PITCH_CENTER_Y);
    const baseXG = Math.max(0.02, 0.6 - distToGoal / 65);
    // Hileli bitiricilik bonusu
    const finishingMod = 0.5 + (fin / 100) * 0.9;
    const xGValue = baseXG * finishingMod;

    // Stat Update
    if (isHome) {
      this.match.stats.homeShots++;
      this.match.stats.homeXG += xGValue;
    } else {
      this.match.stats.awayShots++;
      this.match.stats.awayXG += xGValue;
    }

    const enemyPlayers = isHome ? this.awayPlayers : this.homePlayers;
    const gk = enemyPlayers.find(
      (ep) => this.playerRoles[ep.id] === Position.GK,
    );
    let targetY = goalY;

    // Composure etkisi
    const confidence = ((fin - 50) / 50) * (composure / 100);
    const cornerBias = Math.max(0.45, confidence);
    let finalCornerBias = cornerBias;

    if (gk && this.sim.players[gk.id]) {
      const gkY = this.sim.players[gk.id].y;
      if (gkY > PITCH_CENTER_Y)
        targetY = lerp(PITCH_CENTER_Y, GOAL_Y_TOP + 1, cornerBias);
      else targetY = lerp(PITCH_CENTER_Y, GOAL_Y_BOTTOM - 1, cornerBias);
    } else {
      targetY = PITCH_CENTER_Y;
    }

    let dy = targetY - pos.y;
    const dx = goalX - pos.x;
    let angle = Math.atan2(dy, dx);

    let accuracyPenalty = 0;
    const currentSpeed = Math.sqrt(
      this.sim.players[p.id].vx ** 2 + this.sim.players[p.id].vy ** 2,
    );

    // === MOTOR 2.1: ŞUT İSABETİ MIKRO-BUFF ===
    if (currentSpeed > MAX_PLAYER_SPEED * 0.5) accuracyPenalty += 0.05;
    if (currentSpeed > MAX_PLAYER_SPEED * 0.9) accuracyPenalty += 0.1;

    // === 1v1 FORVET KÖŞE BONUSU ===
    const is1v1Situation =
      distToGoal < 18 &&
      this.calculateShotOpening(pos.x, pos.y, goalX, isHome) > 0.4;
    const isForwardShooter = this.playerRoles[p.id] === Position.FWD;

    if (is1v1Situation && isForwardShooter) {
      finalCornerBias = Math.min(0.95, cornerBias + 0.15 + composure / 300);
      accuracyPenalty -= 0.15; // 0.08 -> 0.15 (Daha keskin bitiricilik)
    } else if (is1v1Situation) {
      finalCornerBias = Math.min(0.9, cornerBias + 0.1); // 0.08 -> 0.10
    }

    // accuracyPenalty limit
    accuracyPenalty = Math.max(0, accuracyPenalty);

    if (gk && this.sim.players[gk.id]) {
      const gkY = this.sim.players[gk.id].y;
      if (gkY > PITCH_CENTER_Y)
        targetY = lerp(PITCH_CENTER_Y, GOAL_Y_TOP + 1, finalCornerBias);
      else targetY = lerp(PITCH_CENTER_Y, GOAL_Y_BOTTOM - 1, finalCornerBias);
      dy = targetY - pos.y;
      angle = Math.atan2(dy, dx);
    }

    // === SPECIAL SHOT TYPES ===
    let shotType = "NORMAL";
    let traceText = `${p.lastName} şut çekti!`;
    const ballZ = this.sim.ball.z || 0;

    // 0. FREE KICK DETECTION
    const isStationary =
      Math.abs(this.sim.players[p.id].vx) < 0.1 &&
      Math.abs(this.sim.players[p.id].vy) < 0.1;
    const nearbyEnemies = enemyPlayers.filter((e) => {
      const ePos = this.sim.players[e.id];
      return ePos && dist(ePos.x, ePos.y, pos.x, pos.y) < 8;
    });
    const isFreeKickShot =
      isStationary &&
      nearbyEnemies.length === 0 &&
      distToGoal > 18 &&
      distToGoal < 35;

    if (isFreeKickShot) {
      shotType = "FREE_KICK";
      const hasCurve = p.playStyles?.includes("Plase Şut");
      const hasDeadBall = p.playStyles?.includes("Ölü Top Uzmanı");

      if (hasDeadBall || hasCurve) {
        traceText = `🎯 ${p.lastName} frikik şutu! (Kıvrımlı)`;
        accuracyPenalty -= 0.1;
      } else {
        traceText = `⚽ ${p.lastName} frikik şutu!`;
      }
    }
    // 1. VOLLEY / BICYCLE KICK
    else if (ballZ > 0.6) {
      if (ballZ > 1.4 && p.playStyles?.includes("Aşırtma")) {
        shotType = "BICYCLE";
        traceText = `🚲 ${p.lastName} RÖVEŞATA DENEDİ!`;
        accuracyPenalty += 0.3;
      } else {
        shotType = "VOLLEY";
        traceText = `🚀 ${p.lastName} gelişine vurdu!`;
        accuracyPenalty += 0.15;
      }
      if (this.sim.players[p.id]) {
        (this.sim.players[p.id] as any).shotType = shotType;
        if (this.playerStates[p.id]) {
          (this.playerStates[p.id] as any).shotTypeExpiry = this.tickCount + 45;
        }
      }
    }

    // 2. CHIP SHOT (AŞIRTMA) - 1v1 ONLY
    if (shotType === "NORMAL" && distToGoal < 22) {
      const gkPos = gk ? this.sim.players[gk.id] : null;
      if (gkPos) {
        const distGKToGoal = isHome ? gkPos.x : 100 - gkPos.x;
        // Kaleci kalesinden uzaktaysa (>8m) şut çekme bonusu
        if (distGKToGoal > 8) {
          const hasChipTrait = p.playStyles?.includes("Aşırtma");
          if (
            hasChipTrait ||
            (p.attributes.dribbling > 85 && Math.random() < 0.3)
          ) {
            shotType = "CHIP";
            traceText = `✨ ${p.lastName} kalecinin üstünden aşırtıyor!`;
          }
        }
      }
    }

    // === ACCURACY & SPREAD (BUFFED v2) ===
    let baseSpread: number;
    // İsabet oranları %20-30 iyileştirildi
    if (fin >= 95)
      baseSpread = 0.03 + (100 - fin) * 0.003; // 0.04 -> 0.03
    else if (fin >= 85)
      baseSpread = 0.06 + (95 - fin) * 0.004; // 0.08 -> 0.06
    else if (fin >= 70)
      baseSpread = 0.1 + (85 - fin) * 0.005; // 0.14 -> 0.10
    else if (fin >= 50)
      baseSpread = 0.18 + (70 - fin) * 0.007; // 0.23 -> 0.18
    else baseSpread = 0.3 + (50 - fin) * 0.01; // 0.38 -> 0.30

    let spread = baseSpread + accuracyPenalty;

    // Pressure Effect
    let pressureMod = 1.0;
    const defendingPlayers = isHome ? this.awayPlayers : this.homePlayers;
    const nearbyDefenders = defendingPlayers.filter((e) => {
      const ePos = this.sim.players[e.id];
      return ePos && dist(ePos.x, ePos.y, pos.x, pos.y) < 4.0;
    });

    if (nearbyDefenders.length > 0) {
      const pressureResist = p.personality?.pressureHandling || 0.5;
      const impact = 1.0 - pressureResist * 0.6;
      pressureMod += nearbyDefenders.length * 0.3 * impact;
    }
    spread *= pressureMod;

    // Distance Penalty
    if (distToGoal > 25) {
      const extraDist = distToGoal - 25;
      spread *= 1.0 + extraDist * 0.035;
    }

    // Fatigue Decision Impact
    spread *= 1 + (1 - fatigueMods.decisions) * 0.4;

    // Shot Speed
    let shotSpeed = 2.8 + pwr / 70;
    shotSpeed *= fatigueMods.speed;

    // === ÖLÜMCÜL BÖLGE BONUSU (Death Zone: <15m) ===
    if (distToGoal < 15) {
      shotSpeed *= 1.2;
      spread *= 0.7;
      // CLINICAL FINISHER
      if (fin > 85) {
        spread *= 0.5; // Extra precision
        traceText += " (NET FIRSAT!)";
      }
    }

    // Playstyle Effects
    if (p.playStyles?.includes("Plase Şut")) {
      spread *= 0.75;
      shotSpeed *= 0.9;
    }
    if (p.playStyles?.includes("Roket")) {
      shotSpeed *= 1.25;
      spread *= 1.15;
    }
    if (shotType === "BICYCLE") {
      shotSpeed *= 1.1;
      spread *= 1.5;
    }
    if (shotType === "CHIP") {
      shotSpeed *= 0.6;
      spread *= 0.8;
    }

    let tempFkVZ = 0;
    // === SERBEST VURUŞ BUFF (OVERHAULED) ===
    if (shotType === "FREE_KICK") {
      const hasDeadBall = p.playStyles?.includes("Ölü Top Uzmanı");
      const hasCurve = p.playStyles?.includes("Plase Şut");
      if (hasDeadBall) spread *= 0.5;    // Ölü Top Uzmanı çok isabetli
      else if (hasCurve) spread *= 0.6;  // Plase Şut isabetli
      else spread *= 0.75;              // Normal şutör

      // === KUSURSUZ FİZİK HESABI ===
      // Barajı geçip kaleyi bulmasını garantileyen hız ve yörünge hesabı
      let targetHeight = 1.3;
      if (hasDeadBall) targetHeight = 0.8 + Math.random() * 0.5;
      else if (hasCurve) targetHeight = 1.0 + Math.random() * 0.6;
      else targetHeight = 1.3 + Math.random() * 0.7;

      const r = 9.15 / distToGoal;
      const safeR = Math.min(0.85, r);
      let hWall = 2.65 + (Math.random() * 0.2); // Baraj yüksekliği

      let numerator = hWall - targetHeight * safeR;
      if (numerator < 0.1) numerator = 0.1;
      const denominator = 0.5 * GRAVITY * safeR * (1 - safeR);
      const tGoalSq = numerator / denominator;

      let fkOptimizedTime = Math.sqrt(tGoalSq);
      let optimalShotSpeed = distToGoal / fkOptimizedTime;

      // Güç limitleri (Hız limitine takılırsa parabola bozulur, ama mecbur)
      if (optimalShotSpeed < 1.4) optimalShotSpeed = 1.4;
      if (optimalShotSpeed > 4.2) optimalShotSpeed = 4.2;

      shotSpeed = optimalShotSpeed;

      // VZ hesabı
      const actualTime = distToGoal / shotSpeed;
      tempFkVZ = (targetHeight + 0.5 * GRAVITY * actualTime * actualTime) / actualTime;
    }

    // === PENALTY ===
    const isPenaltyShot =
      this.sim.mode === "PENALTY_HOME" || this.sim.mode === "PENALTY_AWAY";
    if (isPenaltyShot) {
      spread *= 0.35;
      accuracyPenalty = 0;
      shotSpeed = 4.5 + (pwr / 100) * 2.0; // Şut hızı artırıldı
      // Randomize corner: 50/50 left or right, with inward variance
      const penRand = Math.random();
      if (penRand < 0.10) {
        // 10% bad penalty: near center
        targetY = GOAL_Y_CENTER + (Math.random() * 3.0 - 1.5);
      } else if (Math.random() > 0.5) {
        targetY = GOAL_Y_TOP + Math.random() * 2.0; // left post, inward offset
      } else {
        targetY = GOAL_Y_BOTTOM - Math.random() * 2.0; // right post, inward offset
      }
      dy = targetY - pos.y;
      angle = Math.atan2(dy, dx);
      // GK dives independently to a random side
      if (gk && this.sim.players[gk.id]) {
        this.sim.players[gk.id].vy = (Math.random() > 0.5 ? 1 : -1) * 2.5;
      }
    }

    // FINAL ANGLE CALCULATION
    const shotAngle = angle + (Math.random() * spread - spread / 2);

    // Hedefteki sapma oranını sakla, OnTarget güncellemesi fizik hesabından sonra (wall bloğundan sonra) yapılacak

    // === BARAJ BLOKLAMA (MOTOR 2.1) ===
    const enemies = (isHome ? this.awayPlayers : this.homePlayers).filter(
      (e) => e.lineup === "STARTING",
    );
    let wallBlocked = false;

    if (shotType === "FREE_KICK") {
      for (const e of enemies) {
        const ePos = this.sim.players[e.id];
        if (!ePos || this.playerRoles[e.id] === Position.GK) continue;
        const d = dist(pos.x, pos.y, ePos.x, ePos.y);

        if (d >= 7 && d <= 13) {
          // Baraj mesafesi
          const angleToE = Math.atan2(ePos.y - pos.y, ePos.x - pos.x);
          if (Math.abs(angleToE - shotAngle) < 0.25) {
            const timeToWall = d / shotSpeed;
            // === BARAJ YÜKSEKLIK HESABI (FİZİK MOTORUYLA UYUMLU) ===
            const ballHeightAtWall =
              tempFkVZ * timeToWall - 0.5 * GRAVITY * timeToWall * timeToWall;
            const wallJumpHeight =
              1.8 + ((e.attributes.strength || 50) / 100) * 0.4;

            if (ballHeightAtWall < wallJumpHeight) {
              if (Math.random() < 0.5) {
                // %50 Block Chance
                this.traceLog.push(`🧱 ${e.lastName} barajda engelledi!`);
                this.sim.ball.ownerId = null;
                this.sim.mode = undefined; // YENİ: Set piece sonrası oyun normale döner
                this.sim.ball.vx = (Math.random() - 0.5) * 1.5;
                this.sim.ball.vy = (Math.random() - 0.5) * 1.5;
                this.sim.ball.vz = 0.5;
                this.playerStates[p.id].possessionCooldown = 20;
                this.lastTouchTeamId = e.teamId;
                wallBlocked = true;
                break;
              }
            } else {
              // this.traceLog.push(`Top barajın üstünden geçti!`);
            }
          }
        }
      }
      if (wallBlocked) return;
    } else {
      // Normal shot blocking
      for (const e of enemies) {
        const ePos = this.sim.players[e.id];
        if (!ePos || this.playerRoles[e.id] === Position.GK) continue;
        if (dist(pos.x, pos.y, ePos.x, ePos.y) < 3) {
          const angleToE = Math.atan2(ePos.y - pos.y, ePos.x - pos.x);
          if (Math.abs(angleToE - shotAngle) < 0.4) {
            let blockChance = 0.4 + (e.playStyles?.includes("Engel") ? 0.3 : 0);
            if (Math.random() < blockChance) {
              this.traceLog.push(`${e.lastName} şutu blokladı!`);
              this.sim.ball.ownerId = null;
              this.sim.mode = undefined; // YENİ: Set piece sonrası oyun normale döner
              this.sim.ball.vx = (Math.random() - 0.5) * 2;
              this.sim.ball.vy = (Math.random() - 0.5) * 2;
              this.playerStates[p.id].possessionCooldown = 20;
              this.lastTouchTeamId = e.teamId;
              return;
            }
          }
        }
      }
    }

    // EXECUTE SHOT PHYSICS
    this.sim.ball.ownerId = null;
    this.sim.mode = undefined; // YENİ: Set piece sonrası oyun normale döner
    this.sim.ball.vx = Math.cos(shotAngle) * shotSpeed;
    this.sim.ball.vy = Math.sin(shotAngle) * shotSpeed;

    // VZ Config
    if (shotType === "CHIP") {
      this.sim.ball.vz = 3.5 + Math.random() * 1.5; // High
    } else if (shotType === "FREE_KICK") {
      this.sim.ball.vz = tempFkVZ;
    } else if (distToGoal > 25) {
      this.sim.ball.vz = 0.5 + Math.random();
    } else {
      this.sim.ball.vz = 0.2 + Math.random() * 0.7;
    }

    // Stats Update (On Target) - VZ de hesaba katılarak kaleyi tutup tutmadığına bakılır
    const finalYAtGoal = pos.y + (goalX - pos.x) * Math.tan(shotAngle);
    const timeToGoal = distToGoal / shotSpeed;
    const zAtGoal =
      this.sim.ball.vz * timeToGoal - 0.5 * GRAVITY * timeToGoal * timeToGoal;

    // zAtGoal 2.50'den küçükse gol olur (direğin altı). Eğer zAtGoal çok yüksekse üstten auta çıkmıştır, kaleyi tutmaz.
    const isOnTarget =
      finalYAtGoal > GOAL_Y_TOP &&
      finalYAtGoal < GOAL_Y_BOTTOM &&
      zAtGoal < 2.5 &&
      zAtGoal > 0;
    if (isOnTarget) {
      if (isHome) this.match.stats.homeOnTarget++;
      else this.match.stats.awayOnTarget++;
    }

    // Curve Config
    if (shotType === "FREE_KICK") {
      // === SERBEST VURUŞ KAVİSİ (OVERHAULED v2) ===
      // Problem: Eski kavis (0.7-1.4) çok zayıftı, top düz gidiyordu.
      // Çözüm: Falso gücünü 2-3x artır. Roberto Carlos / Juninho efekti.
      const hasDeadBall = p.playStyles?.includes("Ölü Top Uzmanı");
      const hasCurve = p.playStyles?.includes("Plase Şut");
      const yDiff = pos.y - PITCH_CENTER_Y;
      // Yön: Topun geldiği yöne göre otomatik falso
      const curveDir = yDiff > 0 ? -1 : 1;
      // Güç: Ölü Top Uzmanı > Plase Şut > Normal
      let curveStrength = 1.2; // Normal şutör (eski: 0.7)
      if (hasDeadBall) curveStrength = 3.0; // DELİ KAVİS (Roberto Carlos)
      else if (hasCurve) curveStrength = 2.2; // İyi kavis (Juninho)
      this.sim.ball.curve = curveDir * curveStrength;
    } else if (p.playStyles?.includes("Plase Şut") || Math.random() > 0.75) {
      const yDiff = pos.y - PITCH_CENTER_Y;
      this.sim.ball.curve = yDiff > 0 ? -0.8 : 0.8;
    } else {
      this.sim.ball.curve = 0;
    }

    this.playerStates[p.id].possessionCooldown = 15;
    this.sim.players[p.id].state = "KICK";
    this.lastTouchTeamId = p.teamId;
    this.lastShooterId = p.id;
    this.traceLog.push(traceText);
  }

  private handleRedCardTactics(teamId: string, lostPosition: Position) {
    // Only for AI (user manages their own red cards)
    if (teamId === this.userTeamId) return;

    const isHome = teamId === this.homeTeam.id;
    const subsMade = isHome ? this.homeSubsMade : this.awaySubsMade;

    // If no subs left, we can't do much
    if (subsMade >= this.MAX_SUBS) return;

    // If we lost a DEFENDER or GOALKEEPER, we MUST fill that gap to prevent easy goals
    if (lostPosition === Position.DEF || lostPosition === Position.GK) {
      const bench = (isHome ? this.homePlayers : this.awayPlayers).filter(
        (p) => p.lineup === "BENCH" && !this.substitutedOutPlayerIds.has(p.id),
      );

      // Find a replacement on bench (same position preferred)
      const replacement = bench.find((p) => {
        const role = normalizePos(p);
        return role === lostPosition; // Find a new DEF/GK
      });

      if (replacement) {
        // We need to sacrifice someone.
        // Sacrifice the worst performing FWD or MID
        const starters = (isHome ? this.homePlayers : this.awayPlayers).filter(
          (p) => p.lineup === "STARTING" && this.sim.players[p.id],
        ); // Must be on pitch

        // Prioritize sacrificing FWD, then MID
        let sacrifice: Player | undefined = starters
          .filter((p) => this.playerRoles[p.id] === Position.FWD)
          .sort(
            (a, b) =>
              (this.playerStates[a.id]?.currentStamina || 0) -
              (this.playerStates[b.id]?.currentStamina || 0),
          )[0];

        if (!sacrifice) {
          sacrifice = starters
            .filter((p) => this.playerRoles[p.id] === Position.MID)
            .sort(
              (a, b) =>
                (this.playerStates[a.id]?.currentStamina || 0) -
                (this.playerStates[b.id]?.currentStamina || 0),
            )[0];
        }

        if (sacrifice) {
          // Correct signature: playerIn (Object), playerOutId (String), isAI (Boolean)
          this.substitutePlayer(replacement, sacrifice.id, true);
          this.traceLog.push(
            `AI TAKTİK: Kırmızı kart sonrası ${sacrifice.lastName} çıktı, ${replacement.lastName} girdi.`,
          );
        }
      }
    }
  }

  private actionTackle(defender: Player, attacker: Player) {
    if (!attacker) return;

    const defState = this.playerStates[defender.id];
    const attState = this.playerStates[attacker.id];
    // CRASH FIX: Guard clause for missing state
    if (!defState || !attState) return;

    const tactic =
      defender.teamId === this.homeTeam.id
        ? this.homeTeam.tactic
        : this.awayTeam.tactic;

    const defIsGK = defender.position === Position.GK;
    const defFatigueMods = getAllFatigueModifiers(
      defState.currentStamina,
      defIsGK,
    );

    // BUFF: General Defense Quality +10% (was +5%)
    // HYBRID: Defansif Global Buff (1.10 -> 1.20 yapmıyoruz, defans zaten güçlü)
    let effectiveDef =
      applyStatFloor(defender.attributes.tackling, 45) *
      defFatigueMods.tackling *
      1.1;
    const defStrength =
      applyStatFloor(defender.attributes.strength, 40) *
      defFatigueMods.strength;
    // Aggression is raw, others are floor-scaled
    const defAggression =
      defender.attributes.aggression * defFatigueMods.aggression;
    const defDecisions =
      applyStatFloor(defender.attributes.decisions, 40) *
      defFatigueMods.decisions;
    const defPositioning =
      applyStatFloor(defender.attributes.positioning, 45) *
      defFatigueMods.positioning;

    // Composite Defense Score
    effectiveDef =
      effectiveDef * 0.7 + defStrength * 0.2 + defPositioning * 0.1;

    // Fatigue Impact (Tweaked: 0.6 -> 0.75)
    if (defState.currentStamina < 50) effectiveDef *= 0.75;

    // Savunma Yetenekleri
    if (defender.playStyles?.includes("Top Kesici")) effectiveDef *= 1.3;
    if (defender.playStyles?.includes("Kaya")) effectiveDef *= 1.25;
    if (defender.playStyles?.includes("Güçlü")) effectiveDef *= 1.15;
    if (defender.playStyles?.includes("Engel")) effectiveDef *= 1.1;

    // Hücumcu Statları
    const attIsGK = attacker.position === Position.GK;
    const attFatigueMods = getAllFatigueModifiers(
      attState.currentStamina,
      attIsGK,
    );

    // BUFF: General Dribbling Quality +5%
    let effectiveDri =
      attacker.attributes.dribbling * attFatigueMods.dribbling * 1.05;
    const attStrength = attacker.attributes.strength * attFatigueMods.strength;
    const attComposure =
      attacker.attributes.composure * attFatigueMods.composure;
    const attSpeed = attacker.attributes.speed * attFatigueMods.speed;

    effectiveDri =
      effectiveDri * 0.6 +
      attComposure * 0.2 +
      attStrength * 0.1 +
      attSpeed * 0.1;

    // Hücum Yetenekleri
    if (attacker.playStyles?.includes("Maestro")) effectiveDri *= 1.25;
    if (attacker.playStyles?.includes("İlk Dokunuş")) effectiveDri *= 1.1;
    if (attacker.playStyles?.includes("Baskıya Dayanıklı"))
      effectiveDri *= 1.12;

    // === YILDIZ OYUNCU BONUSU (DRIBBLING) v2 ===
    // USER REQUEST: Yetenekli oyuncular daha rahat çalım atsın
    const attackerOVR = attacker.overall || 70;
    const dribbleStat = attacker.attributes.dribbling || 50;

    if (attackerOVR >= 88 || dribbleStat >= 88) {
      effectiveDri *= 1.35; // %35 HUGE bonus for elite dribblers (Messi/Neymar mode)
    } else if (attackerOVR >= 82 || dribbleStat >= 80) {
      effectiveDri *= 1.2; // %20 bonus for good dribblers
    } else if (dribbleStat >= 75) {
      effectiveDri *= 1.1; // %10 bonus
    }

    let riskFactor = 1.0;
    if (tactic.aggression === "Aggressive") {
      effectiveDef *= 1.25;
      riskFactor = 2.2;
    } else if (tactic.aggression === "Reckless") {
      // KASAP MODU (BUFFED v2): Çok sert ama çok pahalı!
      effectiveDef *= 1.45; // %45 DEFANS BONUSU (Neredeyse geçilmez)
      riskFactor = 4.5; // %350 daha fazla faul riski (eski: 3.5)
      // KASAP BEDELİ: Her sert müdahale savunmacıyı yorar
      if (this.playerStates[defender.id]) {
        this.playerStates[defender.id].currentStamina = Math.max(
          15,
          (this.playerStates[defender.id].currentStamina || 100) - 1.5,
        ); // Her müdahalede -1.5 stamina
      }
    } else if (tactic.aggression === "Safe") {
      effectiveDef *= 0.85;
      riskFactor = 0.6;
    }

    // === PANIC FAUL (MOTOR 2.1) ===
    // Kaleye 25m kala, gerideysen veya agresifsen "Ne pahasına olursa olsun durdur" modu
    // Bu mod, rakibi durdurma şansını artırır (effectiveDef UP) ama FAUL/KART riskini uçurur (riskFactor UP)
    const myGoalX = defender.teamId === this.homeTeam.id ? 0 : PITCH_LENGTH;
    // Attacker positions might be undefined in rare generic object cases, safe access handled
    const attX = (attacker as any).x || this.sim.players[attacker.id]?.x || 0;
    const attY = (attacker as any).y || this.sim.players[attacker.id]?.y || 0;
    const distToMyGoal = dist(attX, attY, myGoalX, 34);

    // Ceza sahası içerisindeyse (Y = 17 - 51, X < 16.5) panik faul riskini minimize et (penaltı olmaması için)
    const inPenaltyBox = distToMyGoal < 16.5 && attY > 17 && attY < 51;

    if (distToMyGoal < 25 && tactic.aggression !== "Safe") {
      const isLosing =
        defender.teamId === this.homeTeam.id
          ? this.match.homeScore < this.match.awayScore
          : this.match.awayScore < this.match.homeScore;

      // Kaybetme korkusu veya doğuştan agresiflik
      if (
        isLosing ||
        tactic.aggression === "Reckless" ||
        (defender.attributes.aggression || 50) > 85
      ) {
        // === CEZA SAHASI KORUMASI (v2) ===
        // Ceza sahası içinde savunmacılar AYAKTA KALMAYA ÇALIŞIR!
        // Gerçek futbolda eğitimli defanslar box içinde sürüşmez, pozisyon alır.
        if (inPenaltyBox && tactic.aggression !== "Reckless") {
          // Ceza sahasında risk AZALIR (çünkü penaltı verme korkusu)
          // riskFactor'e ekleme YAPMA! Hatta defansif bonusu da verme.
          // Sadece pozisyon alınmasına izin ver.
        } else if (inPenaltyBox && tactic.aggression === "Reckless") {
          // Kasap modda bile ceza sahasında HAFIF risk
          riskFactor += 0.5;
          effectiveDef *= 1.15;
        } else {
          // Ceza sahası DIŞINDA: Tam panik modu!
          riskFactor += 2.5;
          effectiveDef *= 1.4; // %40 durdurma bonusu
        }

        // Log only sometimes to avoid spam
        if (Math.random() < 0.2 && !inPenaltyBox) {
          this.traceLog.push(
            `‼ ${defender.lastName} kritik müdahale (Panic Faul) riskini aldı!`,
          );
        }
      }
    }

    // TACTICAL BUFF: "Park The Bus" Defense is unbreakable
    if (tactic.style === "ParkTheBus") effectiveDef *= 1.3;
    // TACTICAL BUFF: "High Press" Defense is messy but aggressive
    if (tactic.style === "HighPress") effectiveDef *= 1.1;

    const decisionPenalty = Math.max(0.7, defDecisions / 100);
    // === TACKLE BALANCE v8: NEUTRAL BIAS (RESTORED) ===
    // Engine 4 Standard: 0.45 / 0.45
    // Removed global 0.98 nerf
    const rollD = effectiveDef * (Math.random() + 0.45) * decisionPenalty;
    const rollA = effectiveDri * (Math.random() + 0.45);

    if (rollD > rollA) {
      // Başarılı Müdahale
      if (Math.random() < 0.4) {
        // Top boşta kalır
        this.sim.ball.ownerId = null;
        this.sim.ball.vx = (Math.random() - 0.5) * 2;
        this.sim.ball.vy = (Math.random() - 0.5) * 2;

        // Safe access via local vars wouldn't work for write, must use array
        this.playerStates[attacker.id].possessionCooldown = 20;
        this.playerStates[defender.id].possessionCooldown = 10;

        this.traceLog.push(`${defender.lastName} müdahale etti, top boşta!`);
        this.lastTouchTeamId = defender.teamId;
        // Topu kazanır
        this.sim.ball.ownerId = defender.id;
        this.playerStates[attacker.id].possessionCooldown = 30;
        this.playerStates[attacker.id].actionLock = 25;
        this.sim.players[defender.id].state = "TACKLE";
        this.traceLog.push(`${defender.lastName} topu kaptı!`);
        this.lastTouchTeamId = defender.teamId;
      }
    } else {
      // Müdahale Başarısız - Çalım Yedi veya FAUL!

      // === FOUL DETECTION (BALANCED v4 - AZ FAUL) ===
      // Gerçek futbolda maç başına ortalama 10-12 faul olur (toplam iki takım)
      // Takım başına 5-6 faul normal
      // BALANCED: Safe: %5, Normal: %10, Aggressive: %22, Reckless: %35
      let foulChance = riskFactor * 0.065; // 0.16 → 0.10 → 0.065

      // === PANIC FOUL (LAST MAN) - CEZA SAHASI KORUMALI ===
      let isPanicFoul = false;

      const isDefenderHome = defender.teamId === this.homeTeam.id;
      const attackerSim = this.sim.players[attacker.id];
      if (defender.position === Position.DEF && attackerSim) {
        const distToGoal = isDefenderHome
          ? attackerSim.x
          : PITCH_LENGTH - attackerSim.x;
        // CEZA SAHASI İÇİNDE PANİK FAUL YAPMA! Penaltı olur!
        if (
          distToGoal < 25 &&
          distToGoal > 16.5 && // Ceza sahası DİŞINDA olmalı (16.5m)
          Math.random() < 0.04 && // 5% -> 4%
          tactic.aggression !== "Safe"
        ) {
          foulChance += 0.10; // 0.20 -> 0.15 -> 0.10
          isPanicFoul = true;
        }
      }

      // === CEZA SAHASI İÇİ FAUL AZALTMA ===
      // Gerçek futbolda savunmacılar ceza sahasında ayakta kalmaya çalışır
      if (inPenaltyBox && tactic.aggression !== "Reckless") {
        foulChance *= 0.4; // Ceza sahasında faul şansı %60 azalır!
      }

      const isFoul = Math.random() < foulChance;

      if (isFoul) {
        // FAUL! Serbest vuruş verilir
        const defPos = this.sim.players[defender.id];
        const attPos = this.sim.players[attacker.id];

        // === KASAP MODU (BUTCHER) - YILDIRMA ETKİSİ ===
        if (tactic.aggression === "Reckless") {
          // Rakibi döverek oyundan düşür
          attacker.attributes.composure = Math.max(
            20,
            attacker.attributes.composure - 8,
          ); // Soğukkanlılığı boz

          // Morale is often not in base interface, safe access
          if ((attacker as any).morale !== undefined) {
            (attacker as any).morale = Math.max(
              20,
              (attacker as any).morale - 10,
            );
          }

          this.traceLog.push(
            `🤕 ${defender.lastName} sert girdi! ${attacker.lastName} sindirildi.`,
          );
        }

        // Store foul position for free kick
        this.foulPosition = { x: attPos?.x ?? 50, y: attPos?.y ?? 50 };

        // Panic Foul = Almost certanly a card
        if (isPanicFoul) {
          this.traceLog.push(
            `🟥 ${defender.lastName} son adam olarak indirdi! (Profesyonel Faul)`,
          );
        }

        // Determine which team gets the free kick (or penalty)
        const attackingTeamIsHome = attacker.teamId === this.homeTeam.id;
        const defenderTeamIsHome = defender.teamId === this.homeTeam.id;

        // === PENALTY CHECK ===
        // Check if foul is in the penalty area of the DEFENDING team
        // Penalty Box Y range (centered): 34 ± 20.16 = 13.84 to 54.16
        const isInsideBoxY =
          this.foulPosition.y > 34 - 20.16 && this.foulPosition.y < 34 + 20.16;
        let isPenalty = false;

        if (isInsideBoxY) {
          if (defenderTeamIsHome) {
            // Home defends Left (0-16.5)
            if (this.foulPosition.x < 16.5) isPenalty = true;
          } else {
            // Away defends Right (88.5-105)
            if (this.foulPosition.x > 105 - 16.5) isPenalty = true;
          }
        }

        // Card chance: based on aggression and how bad the foul is
        const cardRoll = Math.random();
        // BALANCED CARD RATES v5 (USER REQUEST - DRASTICALLY REDUCED RED CARDS):
        // Red cards ruin the game fun. Made them much rarer.

        let yellowChance = 0.14; // Default yellow stays similar
        let redChance = 0.001; // 0.1% base red chance (was 0.5%)

        // Penalty içindeki faul (DOGSO - KASAP MODU İÇİN AĞIR CEZA)
        if (isPenalty) {
          yellowChance += 0.15;
          redChance += 0.04; // Ceza sahasında faul = kırmızı riski yükseldi
          if (tactic.aggression === "Reckless") {
            redChance += 0.10; // KASAP + PENALTY = %18 kırmızı şansı!
          }
        }

        if (tactic.aggression === "Aggressive") {
          yellowChance = 0.2;
          redChance = 0.005; // 0.5%
        } else if (tactic.aggression === "Reckless") {
          yellowChance = 0.55; // %55 sarı kart riski (eski: 40%)
          redChance = 0.08; // %8 kırmızı kart riski (eski: 3%) - KASABIN BEDELİ!
        } else if (tactic.aggression === "Safe") {
          yellowChance = 0.05;
          redChance = 0.0005; // 0.05% almost zero
        }

        let cardEvent: MatchEvent | null = null;

        // BUGFIX: Define player names early so they're accessible in all branches
        const defenderName =
          defender.lastName ||
          defender.firstName ||
          `#${defender.id.slice(0, 5)}`;

        // Check for Second Yellow Card
        const hasYellow =
          this.match.events.some(
            (e) =>
              e.type === MatchEventType.CARD_YELLOW &&
              e.playerId === defender.id,
          ) ||
          this.pendingEvents.some(
            (e) =>
              e.type === MatchEventType.CARD_YELLOW &&
              e.playerId === defender.id,
          );

        if (cardRoll < redChance || (cardRoll < yellowChance && hasYellow)) {
          // RED CARD! (Direct or Second Yellow)
          const isSecondYellow = cardRoll >= redChance;

          cardEvent = {
            minute: this.internalMinute,
            type: MatchEventType.CARD_RED,
            description: isSecondYellow
              ? `Red Card! (Double Yellow) ${defenderName}`
              : `Red Card! ${defenderName}`,
            teamId: defender.teamId,
            playerId: defender.id,
          };

          // UI INDICATOR FIX: Mark as suspended immediately
          // Set to 2 because processWeeklyUpdate decrements BEFORE next match
          // 2 → 1 (after current week) → still banned for next match → 0 (after that)
          defender.matchSuspension = 2;

          // Remove player from pitch completely
          defender.lineup = "RESERVE";

          // CRITICAL FIX: Also remove from simulation to prevent ghost player!
          delete this.sim.players[defender.id];
          delete this.playerStates[defender.id];
          delete this.baseOffsets[defender.id];
          delete this.playerRoles[defender.id];
          this._starterCacheValid = false;

          this.traceLog.push(
            isSecondYellow
              ? `🟥 ${defenderName} ÇİFT SARIDAN KIRMIZI!`
              : `🟥 ${defenderName} KIRMIZI KART!`,
          );

          // AI TACTICAL RESPONSE: Sacrifice Attacker for Defender if needed
          this.handleRedCardTactics(defender.teamId, normalizePos(defender));
        } else if (cardRoll < yellowChance) {
          // YELLOW CARD
          // Reuse defenderName from earlier (already defined above)
          cardEvent = {
            minute: this.internalMinute,
            type: MatchEventType.CARD_YELLOW,
            description: `Yellow Card: ${defenderName}`,
            teamId: defender.teamId,
            playerId: defender.id,
          };
          this.traceLog.push(`🟨 ${defenderName} SARI KART!`);
        }

        // Queue events
        // BUGFIX: Use fallback for attacker name too
        const attackerName =
          attacker.lastName ||
          attacker.firstName ||
          `#${attacker.id.slice(0, 5)}`;
        const foulEvent: MatchEvent = {
          minute: this.internalMinute,
          type: MatchEventType.FOUL,
          description: `Foul: ${defenderName} → ${attackerName}`,
          teamId: defender.teamId,
          playerId: defender.id,
        };
        this.pendingEvents.push(foulEvent);

        if (cardEvent) {
          this.pendingEvents.push(cardEvent);
        }

        const attackingTeam = attackingTeamIsHome
          ? this.homeTeam
          : this.awayTeam;

        // === PENALTY OR FREE KICK SETUP ===
        if (isPenalty) {
          // PENALTY KICK
          this.pendingEvents.push({
            minute: this.internalMinute,
            type: MatchEventType.PENALTY,
            description: `PENALTY: ${attackingTeam.name}`,
            teamId: attackingTeam.id,
          });
          this.traceLog.push(
            `‼️ PENALTI! ${defenderName}, ${attackerName}'i ceza sahasında düşürdü!`,
          );

          const penaltyX = attackingTeamIsHome ? 105 - 11 : 11;
          const penaltyY = 34;
          this.placeBallForSetPiece(
            attackingTeam,
            penaltyX,
            penaltyY,
            false,
            attackingTeamIsHome ? "PENALTY_HOME" : "PENALTY_AWAY",
          );
        } else {
          // FREE KICK
          const fkX = this.foulPosition?.x ?? 50;
          const fkY = this.foulPosition?.y ?? 50;

          this.placeBallForSetPiece(
            attackingTeam,
            fkX,
            fkY,
            true,
            attackingTeamIsHome ? "FREE_KICK_HOME" : "FREE_KICK_AWAY",
          );

          this.pendingEvents.push({
            minute: this.internalMinute,
            type: MatchEventType.FREE_KICK,
            description: `Free Kick: ${attackingTeam.name}`,
            teamId: attackingTeam.id,
          });

          this.traceLog.push(
            `⚠️ FAUL! ${defender.lastName} - Serbest vuruş ${attackingTeam.name}`,
          );
        }
      } else {
        // Normal çalım - faul yok
        const recoveryTime = 25 * riskFactor * (2 - defFatigueMods.speed);
        this.playerStates[defender.id].actionLock = recoveryTime;

        // Hız kaybı
        this.sim.players[defender.id].vx *= 0.2 / riskFactor;
        this.sim.players[defender.id].vy *= 0.2 / riskFactor;

        this.traceLog.push(`${attacker.lastName} rakibini geçti!`);
      }
    }
  }

  // New Helper for Set Pieces
  private placeBallForSetPiece(
    attackingTeam: Team,
    x: number,
    y: number,
    buildWall: boolean,
    mode: SetPieceMode,
  ) {
    // Set match mode
    this.sim.mode = mode;

    // Find best taker
    const attackingTeamPlayers = (
      attackingTeam.id === this.homeTeam.id
        ? this.homePlayers
        : this.awayPlayers
    ).filter(
      (p) => p.lineup === "STARTING" && this.playerRoles[p.id] !== Position.GK,
    );

    let taker;
    if (mode.includes("PENALTY")) {
      taker = attackingTeamPlayers.sort((a, b) => {
        const scoreA = a.attributes.finishing + (a.playStyles?.includes("Penaltı Canavarı") ? 40 : 0);
        const scoreB = b.attributes.finishing + (b.playStyles?.includes("Penaltı Canavarı") ? 40 : 0);
        return scoreB - scoreA;
      })[0];
    } else if (mode.includes("FREE_KICK")) {
      taker = attackingTeamPlayers.sort((a, b) => {
        const scoreA = a.attributes.finishing + (a.playStyles?.includes("Ölü Top Uzmanı") ? 35 : 0) + (a.playStyles?.includes("Plase Şut") ? 15 : 0) + (a.playStyles?.includes("Roket") ? 10 : 0);
        const scoreB = b.attributes.finishing + (b.playStyles?.includes("Ölü Top Uzmanı") ? 35 : 0) + (b.playStyles?.includes("Plase Şut") ? 15 : 0) + (b.playStyles?.includes("Roket") ? 10 : 0);
        return scoreB - scoreA;
      })[0];
    } else {
      taker = attackingTeamPlayers.sort((a, b) =>
        b.attributes.passing + b.attributes.vision - (a.attributes.passing + a.attributes.vision)
      )[0];
    }

    if (taker && this.sim.players[taker.id]) {
      // Move taker to position
      this.sim.players[taker.id].x = x;
      this.sim.players[taker.id].y = y;
      this.sim.players[taker.id].vx = 0;
      this.sim.players[taker.id].vy = 0;
      this.sim.ball.ownerId = taker.id;
      this.sim.ball.x = x;
      this.sim.ball.y = y;
      this.sim.ball.vx = 0;
      this.sim.ball.vy = 0;
      this.sim.ball.vz = 0;
      if (this.playerStates[taker.id]) {
        this.playerStates[taker.id].actionLock = 30; // 5→30: Penaltı kullanana kadar rakip çalamaz!
      }
    }

    // === PENALTY: Clear all players from penalty area ===
    if (!buildWall && (mode === "PENALTY_HOME" || mode === "PENALTY_AWAY")) {
      const isPenaltyHome = mode === "PENALTY_HOME";
      // Penalty is at goal side: Home attacks right (goalX=105), Away attacks left (goalX=0)
      const penaltyGoalX = isPenaltyHome ? PITCH_LENGTH : 0;

      // Position defending GK on the goal line
      const defendingPlayers = isPenaltyHome
        ? this.awayPlayers
        : this.homePlayers;
      const gk = defendingPlayers.find(
        (p) =>
          this.playerRoles[p.id] === Position.GK && p.lineup === "STARTING",
      );
      if (gk && this.sim.players[gk.id]) {
        this.sim.players[gk.id].x = isPenaltyHome ? PITCH_LENGTH - 1 : 1;
        this.sim.players[gk.id].y = PITCH_CENTER_Y;
        this.sim.players[gk.id].vx = 0;
        this.sim.players[gk.id].vy = 0;
        if (this.playerStates[gk.id]) {
          this.playerStates[gk.id].actionLock = 10;
        }
      }

      // Penalty box dimensions:
      // X: 0 to 16.5 (left) or 88.5 to 105 (right)
      // Y: ~13.84 to ~54.16 (34 ± 20.16)
      const boxMinY = PITCH_CENTER_Y - 22;
      const boxMaxY = PITCH_CENTER_Y + 22;
      const boxXLimit = 16.5;

      // Push ALL players (both teams) outside the penalty area except taker and GK
      // === PENALTY D ARC: Oyuncular penaltı noktasından 9.15m uzakta olmalı ===
      const penaltySpotX = isPenaltyHome
        ? PITCH_LENGTH - PENALTY_SPOT
        : PENALTY_SPOT;
      const allPlayers = [...this.homePlayers, ...this.awayPlayers].filter(
        (p) => p.lineup === "STARTING" && this.sim.players[p.id],
      );

      let pushIndex = 0; // Oyuncuları düzenli dağıtmak için
      for (const p of allPlayers) {
        // Skip the taker
        if (taker && p.id === taker.id) continue;
        // Skip defending GK
        if (gk && p.id === gk.id) continue;

        const simP = this.sim.players[p.id];
        if (!simP) continue;

        // Penaltı noktasına mesafe - D arc kontrolü (9.15m)
        const distToPenaltySpot = Math.sqrt(
          (simP.x - penaltySpotX) ** 2 + (simP.y - PITCH_CENTER_Y) ** 2,
        );

        let isInsideBox = false;
        if (isPenaltyHome) {
          isInsideBox =
            simP.x > PITCH_LENGTH - boxXLimit &&
            simP.y > boxMinY &&
            simP.y < boxMaxY;
        } else {
          isInsideBox =
            simP.x < boxXLimit && simP.y > boxMinY && simP.y < boxMaxY;
        }

        // Penaltı noktasına 9.15m'den yakın olan veya ceza sahasında olan herkesi it
        if (isInsideBox || distToPenaltySpot < 9.15) {
          // Oyuncuları ceza sahasının DIŞINA, D çizgisinin arkasına yerleştir
          if (isPenaltyHome) {
            simP.x = PITCH_LENGTH - boxXLimit - 5; // 5m dışarı (3m→5m)
          } else {
            simP.x = boxXLimit + 5;
          }
          // Oyuncuları yarım daire (D) boyunca düzenli dağıt
          const spreadAngle =
            -0.8 + (pushIndex / Math.max(1, allPlayers.length - 2)) * 1.6;
          simP.y = PITCH_CENTER_Y + Math.sin(spreadAngle) * 18;
          simP.y = clamp(simP.y, boxMinY, boxMaxY);
          simP.vx = 0;
          simP.vy = 0;
          pushIndex++;
          if (this.playerStates[p.id]) {
            this.playerStates[p.id].actionLock = 120; // 2 saniye tut (15→120)
          }
        }
      }
    }

    if (buildWall) {
      // === WALL FORMATION ===
      // Position 3-4 defenders in a wall between ball and goal
      const enemyTeam = (
        attackingTeam.id === this.homeTeam.id
          ? this.awayPlayers
          : this.homePlayers
      ).filter(
        (p) =>
          p.lineup === "STARTING" && this.playerRoles[p.id] !== Position.GK,
      );

      // Determine which goal the free kick is aimed at
      const targetGoalX = attackingTeam.id === this.homeTeam.id ? 100 : 0; // Attacking towards this goal
      const wallDistance = 10; // 9.15m scaled

      // === GK POSITIONING ===
      // Ensure GK is on the line
      const enemyPlayersArr =
        attackingTeam.id === this.homeTeam.id
          ? this.awayPlayers
          : this.homePlayers;
      const gk = enemyPlayersArr.find(
        (p) => this.playerRoles[p.id] === Position.GK,
      );
      if (gk && this.sim.players[gk.id]) {
        this.sim.players[gk.id].x = targetGoalX > 50 ? 100 : 5; // On the line (slightly off 0/105)
        this.sim.players[gk.id].y = 34; // Center
        this.sim.players[gk.id].vx = 0;
        this.sim.players[gk.id].vy = 0;
      }

      // Calculate wall position (between ball and goal)
      const angleToGoal = Math.atan2(34 - y, targetGoalX - x); // Target center Y=34
      const wallCenterX = x + Math.cos(angleToGoal) * wallDistance;
      const wallCenterY = y + Math.sin(angleToGoal) * wallDistance;

      // Select 3-4 closest defenders for wall
      const wallSize = x > 20 && x < 80 ? 4 : 3; // Bigger wall for dangerous positions
      const wallPlayers = enemyTeam
        .filter((p) => this.sim.players[p.id] && (!gk || p.id !== gk.id)) // Exclude GK from wall
        .sort((a, b) => {
          const distA = dist(
            x,
            y,
            this.sim.players[a.id].x,
            this.sim.players[a.id].y,
          );
          const distB = dist(
            x,
            y,
            this.sim.players[b.id].x,
            this.sim.players[b.id].y,
          );
          return distA - distB;
        })
        .slice(0, wallSize);

      // Position wall players
      const perpAngle = angleToGoal + Math.PI / 2;
      const wallSpacing = 2.5;

      wallPlayers.forEach((wp, idx) => {
        const simWp = this.sim.players[wp.id];
        if (simWp) {
          const offset = (idx - (wallPlayers.length - 1) / 2) * wallSpacing;
          simWp.x = wallCenterX + Math.cos(perpAngle) * offset;
          simWp.y = wallCenterY + Math.sin(perpAngle) * offset;
          simWp.vx = 0;
          simWp.vy = 0;
          simWp.facing = Math.atan2(y - simWp.y, x - simWp.x);
          if (this.playerStates[wp.id]) {
            this.playerStates[wp.id].actionLock = 8;
          }
        }
      });

      // Push other nearby opponents back
      const wallPlayerIds = new Set(wallPlayers.map((p) => p.id));
      enemyTeam.forEach((ep) => {
        if (wallPlayerIds.has(ep.id)) return;
        const simEp = this.sim.players[ep.id];
        if (simEp && dist(x, y, simEp.x, simEp.y) < 12) {
          const dx = simEp.x - x;
          const dy = simEp.y - y;
          const d = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
          simEp.x = x + (dx / d) * 14;
          simEp.y = y + (dy / d) * 14;
          simEp.vx = 0;
          simEp.vy = 0;
        }
      });
    }
  }

  // === CANLI MAÇ LOG SİSTEMİ ===
  // Maçı saniye saniye izlemek için detaylı yorumcu stili log
  private logDebugSnapshot(): void {
    const ballX = this.sim.ball.x;
    const ballY = this.sim.ball.y;
    const ballOwner = this.sim.ball.ownerId
      ? this.getPlayer(this.sim.ball.ownerId)
      : null;
    const owningTeamId = ballOwner?.teamId || null;

    // Tüm oyuncular
    const allStarters = [...this.homePlayers, ...this.awayPlayers].filter(
      (p) => p.lineup === "STARTING",
    );
    const homePlayers = allStarters.filter(
      (p) => p.teamId === this.homeTeam.id,
    );
    const awayPlayers = allStarters.filter(
      (p) => p.teamId === this.awayTeam.id,
    );

    // Bölge analizi
    const getZone = (x: number): string => {
      if (x < 25) return "DEF";
      if (x < 40) return "DEF-MID";
      if (x < 65) return "MID";
      if (x < 80) return "ATK-MID";
      return "ATK";
    };

    const getYZone = (y: number): string => {
      if (y < 20) return "SOL";
      if (y < 48) return "ORTA";
      return "SAĞ";
    };

    // === DEVELOPMENT MODE DISABLED ===
    // Detaylı debug logları devre dışı bırakıldı. Daha sonra ihtiyaç olursa:
    // - Defans analizi
    // - Pressing koordinasyonu
    // - Formation tracking
    // için bu fonksiyon açılabilir.

    // Şimdilik boş kalmıyor, ileride development mode flag'i eklenebilir
    if (false) {
      // SET TO TRUE FOR DEBUG
      // DEBUG LOGS HERE
    }
  }
  // === G MOTORU: GÖRÜŞ AÇISI HESAPLAMA ===
  // Bir oyuncunun belirli bir hedefe (genelde kale veya koşu yolu) ne kadar rahat ulaşabileceğini hesaplar.
  // 0.0 = Tamamen kapalı (önünde adam var)
  // 1.0 = Tamamen açık (dümdüz boşluk)
}
