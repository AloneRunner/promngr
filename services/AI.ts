import {
  Team,
  Player,
  Position,
  TeamTactic,
  TacticType,
  PlayerAttributes,
  CoachArchetype,
} from "../types";

// === ROLE DEFINITIONS & WEIGHTS ===
// Defines what attributes matter for specific tactical roles
type AttributeWeights = Partial<Record<keyof PlayerAttributes, number>>;

interface RoleDefinition {
  name: string;
  description: string;
  weights: AttributeWeights;
}

type AttackApproach = "PATIENT" | "BALANCED" | "VERTICAL" | "FLUID";
type DefenseApproach = "LOW_BLOCK" | "MID_BLOCK" | "FRONT_FOOT" | "HUNT";

const inferAttackApproach = (tactic: TeamTactic): AttackApproach => {
  const instructions = tactic.instructions || [];
  if (instructions.includes("RoamFromPosition")) return "FLUID";
  if (
    tactic.style === "Counter" ||
    tactic.passingStyle === "Direct" ||
    tactic.passingStyle === "LongBall"
  ) {
    return "VERTICAL";
  }
  if (
    tactic.style === "Possession" ||
    tactic.passingStyle === "Short" ||
    tactic.tempo === "Slow"
  ) {
    return "PATIENT";
  }
  return "BALANCED";
};

const inferDefenseApproach = (tactic: TeamTactic): DefenseApproach => {
  const press = tactic.pressingIntensity || "Balanced";
  const line = tactic.defensiveLine || "Balanced";

  if (press === "Gegenpress" || (press === "HighPress" && line === "High")) {
    return "HUNT";
  }
  if (press === "HighPress") return "FRONT_FOOT";
  if (press === "StandOff" || line === "Deep") return "LOW_BLOCK";
  return "MID_BLOCK";
};

const ROLE_DEFINITIONS: Record<Position, Record<string, RoleDefinition>> = {
  [Position.GK]: {
    STANDARD: {
      name: "Standard GK",
      description: "Reliable shot stopper.",
      weights: {
        goalkeeping: 2.0,
        positioning: 1.0,
        composure: 0.5,
        decisions: 0.5,
      },
    },
    SWEEPER: {
      name: "Sweeper Keeper",
      description: "Good with feet, defends high line.",
      weights: { goalkeeping: 1.5, passing: 1.0, speed: 0.8, vision: 0.5 },
    },
  },
  [Position.DEF]: {
    STOPPER: {
      name: "Stopper",
      description: "No nonsense defender.",
      weights: {
        tackling: 1.5,
        strength: 1.5,
        positioning: 1.0,
        aggression: 0.8,
      },
    },
    BALL_PLAYING: {
      name: "Ball Playing Defender",
      description: "Comfortable on the ball.",
      weights: { tackling: 1.2, passing: 1.2, composure: 1.0, vision: 0.8 },
    },
    FULLBACK_ATTACK: {
      name: "Attacking Fullback",
      description: "Runs up and down the flank.",
      weights: { speed: 1.5, stamina: 1.5, passing: 1.0, dribbling: 0.8 },
    },
  },
  [Position.MID]: {
    BALL_WINNER: {
      name: "Ball Winner",
      description: "Destroys attacks.",
      weights: { tackling: 1.5, aggression: 1.2, strength: 1.2, stamina: 1.2 },
    },
    PLAYMAKER: {
      name: "Playmaker",
      description: "Dictates tempo.",
      weights: { passing: 1.8, vision: 1.5, composure: 1.2, decisions: 1.0 },
    },
    BOX_TO_BOX: {
      name: "Box to Box",
      description: "Does everything.",
      weights: {
        stamina: 2.0,
        speed: 1.0,
        passing: 1.0,
        tackling: 1.0,
        finishing: 0.8,
      },
    },
    WINGER: {
      name: "Classic Winger",
      description: "Hugs the line and crosses.",
      weights: { speed: 1.5, dribbling: 1.2, passing: 1.2, stamina: 1.0 },
    },
  },
  [Position.FWD]: {
    TARGET_MAN: {
      name: "Target Man",
      description: "Aerial threat and hold up play.",
      weights: {
        strength: 1.5,
        positioning: 1.2,
        finishing: 1.0,
        decisions: 0.8,
      },
    },
    POACHER: {
      name: "Poacher",
      description: "Finishes inside the box.",
      weights: { finishing: 2.0, positioning: 1.5, composure: 1.2, speed: 0.8 },
    },
    FALSE_NINE: {
      name: "False Nine",
      description: "Drops deep to create.",
      weights: { passing: 1.5, dribbling: 1.2, vision: 1.2, finishing: 1.0 },
    },
    INSIDE_FORWARD: {
      name: "Inside Forward",
      description: "Cuts inside to shoot.",
      weights: { speed: 1.5, dribbling: 1.5, finishing: 1.2, stamina: 0.8 },
    },
  },
};

// === SQUAD ANALYSIS SERVICE ===

export interface PositionalNeed {
  position: Position;
  role: string; // Specific role needed (e.g., "POACHER")
  urgency: number; // 0-100 (100 = Critical)
  targetRating: number; // Minimum OVR needed
  reason: string;
}

export class AIService {
  // --- 1. SQUAD GAP ANALYSIS ---
  // Scans a team and identifies weak spots based on tactic
  public static analyzeSquadNeeds(
    team: Team,
    roster: Player[],
    leagueAverageRating: number,
  ): PositionalNeed[] {
    const needs: PositionalNeed[] = [];

    // Filter active players (exclude loaned out or reserve trash)
    const squad = roster.filter((p) => !p.isTransferListed);
    const ambitionBaseline = Math.max(
      leagueAverageRating,
      Math.round(team.reputation / 120),
    );

    // Define required slots per formation (simplified)
    const formationSlots = this.getFormationSlots(team.tactic.formation);

    // Group players by Position and Grade them
    const depthChart = {
      [Position.GK]: squad
        .filter((p) => p.position === Position.GK)
        .sort((a, b) => b.overall - a.overall),
      [Position.DEF]: squad
        .filter((p) => p.position === Position.DEF)
        .sort((a, b) => b.overall - a.overall),
      [Position.MID]: squad
        .filter((p) => p.position === Position.MID)
        .sort((a, b) => b.overall - a.overall),
      [Position.FWD]: squad
        .filter((p) => p.position === Position.FWD)
        .sort((a, b) => b.overall - a.overall),
    };

    // Check Goalkeeper — cap at 3 GKs total (trim releases above 3)
    const bestGK = depthChart[Position.GK][0];
    // Surplus only if we have 3+ GKs AND the best one is actually decent
    const gkSurplus = depthChart[Position.GK].length >= 3 && bestGK && bestGK.overall >= ambitionBaseline - 5;
    if (!gkSurplus && (!bestGK || bestGK.overall < ambitionBaseline - 5)) {
      // Target: realistic step-up from current GK, capped at ambitionBaseline+2
      // Prevents chasing only 85+ OVR GKs when squad is ORT 70
      const realisticGKTarget = bestGK
        ? Math.min(ambitionBaseline + 2, Math.max(bestGK.overall + 8, ambitionBaseline - 5))
        : ambitionBaseline;
      needs.push({
        position: Position.GK,
        role: "STANDARD",
        urgency: bestGK ? (ambitionBaseline - bestGK.overall) * 10 : 100,
        targetRating: realisticGKTarget,
        reason: "No reliable goalkeeper",
      });
    }

    // Squad-wide average for positional gap analysis
    const squadAvgOvr = squad.length > 0
      ? squad.reduce((s, p) => s + p.overall, 0) / squad.length
      : ambitionBaseline;

    // Check Outfield Positions
    // Example: Tactic needs 4 DEFs. Do we have 4 *good* DEFs?
    // POSITION QUOTA: cap needs per position to prevent MID hoarding
    const MAX_NEEDS_PER_POS = 2;
    const needsPerPos: Record<string, number> = { DEF: 0, MID: 0, FWD: 0 };

    (["DEF", "MID", "FWD"] as Position[]).forEach((pos) => {
      const requiredCount = formationSlots[pos] || 0;
      const availablePlayers = depthChart[pos];

      // SURPLUS GUARD: if team has 3+ more than required, skip all checks for this position
      const surplus = availablePlayers.length - requiredCount;
      if (surplus >= 3) return;

      // Per-position average — used to detect lagging positions
      const posAvg = availablePlayers.length > 0
        ? availablePlayers.reduce((s, p) => s + p.overall, 0) / availablePlayers.length
        : 0;

      // Check Starters Quality (only worst starter, not all — cap noise)
      let worstStarterIdx = -1;
      let worstStarterOvr = 999;
      for (let i = 0; i < requiredCount; i++) {
        const player = availablePlayers[i];
        if (!player) {
          // Critical: Missing a starter!
          if (needsPerPos[pos] < MAX_NEEDS_PER_POS) {
            needs.push({
              position: pos,
              role: this.recommendRole(pos, team.tactic),
              urgency: 95,
              targetRating: ambitionBaseline,
              reason: `Missing starter for ${pos}`,
            });
            needsPerPos[pos]++;
          }
        } else if (player.overall < worstStarterOvr) {
          worstStarterOvr = player.overall;
          worstStarterIdx = i;
        }
      }

      // Only flag the single worst starter (not all weak starters — that caused MID spam)
      if (worstStarterIdx >= 0 && worstStarterOvr < ambitionBaseline - 4 && needsPerPos[pos] < MAX_NEEDS_PER_POS) {
        // Realistic target: step-up from worst starter, not always ambitionBaseline+3
        // Prevents ORT-70 teams chasing only 86+ OVR players (unreachable market)
        const realisticTarget = Math.min(ambitionBaseline + 3, Math.max(worstStarterOvr + 8, ambitionBaseline - 5));
        needs.push({
          position: pos,
          role: this.recommendRole(pos, team.tactic),
          urgency: (ambitionBaseline - worstStarterOvr) * 8 + 30,
          targetRating: realisticTarget,
          reason: `Weak starter at ${pos} (${worstStarterOvr})`,
        });
        needsPerPos[pos]++;
      }

      // Check Depth (We need at least 2 decent subs per line for bench coverage)
      if (availablePlayers.length < requiredCount + 2 && needsPerPos[pos] < MAX_NEEDS_PER_POS) {
        needs.push({
          position: pos,
          role: this.recommendRole(pos, team.tactic),
          urgency: availablePlayers.length < requiredCount + 1 ? 60 : 42, // 42 > default threshold(40); 60 if only 1 sub
          targetRating: ambitionBaseline - 5,
          reason: `Lack of depth at ${pos}`,
        });
        needsPerPos[pos]++;
      }

      // Positional gap: this position's average is notably below the squad average
      if (posAvg > 0 && needsPerPos[pos] < MAX_NEEDS_PER_POS) {
        const gap = squadAvgOvr - posAvg;
        if (gap >= 4) {
          needs.push({
            position: pos,
            role: this.recommendRole(pos, team.tactic),
            urgency: Math.min(88, Math.round(gap * 7 + 15)),
            targetRating: Math.round(posAvg + gap * 0.7),
            reason: `Position gap: ${pos} avg ${Math.round(posAvg)} vs squad ${Math.round(squadAvgOvr)}`,
          });
          needsPerPos[pos]++;
        }
      }
    });

    // WONDERKID NEED: Proactive youth investment (low urgency, runs when no acute gaps)
    // Ensures AI teams also build for the future like a human manager would
    const hasAcuteGap = needs.some(n => n.urgency >= 60);
    if (!hasAcuteGap) {
      // Find the positional slot that benefits most from a young rotation player
      const positions: Position[] = [Position.DEF, Position.MID, Position.FWD];
      const leastCoveredPos = positions.reduce((worst, pos) => {
        const count = depthChart[pos].length;
        const needed = formationSlots[pos] || 0;
        const coverage = count / Math.max(1, needed);
        const worstCoverage = depthChart[worst].length / Math.max(1, formationSlots[worst] || 1);
        return coverage < worstCoverage ? pos : worst;
      }, Position.MID);

      needs.push({
        position: leastCoveredPos,
        role: this.recommendRole(leastCoveredPos, team.tactic),
        urgency: 35,
        targetRating: Math.max(60, ambitionBaseline - 12),
        reason: `Wonderkid investment: future depth at ${leastCoveredPos}`,
      });
    }

    return needs.sort((a, b) => b.urgency - a.urgency);
  }

  // --- 2. PLAYER UTILITY SCORING ---
  // Calculates how good a player is for a SPECIFIC role
  public static calculatePlayerUtility(
    player: Player,
    roleName: string,
    tactic: TeamTactic,
  ): number {
    // Find Role Definition
    const posRoles = ROLE_DEFINITIONS[player.position as Position];
    // Default to first role if not found or mismatch
    const roleDef =
      posRoles && posRoles[roleName]
        ? posRoles[roleName]
        : Object.values(posRoles || {})[0];

    if (!roleDef) return player.overall; // Fallback

    let weightedSum = 0;
    let totalWeight = 0;

    // Calculate Weighted Attribute Score
    Object.entries(roleDef.weights).forEach(([attr, weight]) => {
      const val = (player.attributes as any)[attr] || 50;
      weightedSum += val * weight!;
      totalWeight += weight!;
    });

    // Normalize to 0-100 scale
    const technicalScore = weightedSum / totalWeight;

    // --- CONTEXTUAL BONUSES ---

    // Age Factor (Developers prefer young, Win-Now prefer prime)
    let ageBonus = 0;
    if (player.age < 24) ageBonus += 2; // Potential value
    if (player.age > 33) ageBonus -= 5; // Decline risk

    // Tactic Fit Bonus
    // Example: High Press tactic prefers High Stamina/Aggression regardless of role
    let tacticBonus = 0;
    if (tactic.style === "HighPress") {
      if (player.attributes.stamina > 80) tacticBonus += 3;
      if (player.attributes.aggression > 80) tacticBonus += 2;
    }
    if (tactic.passingStyle === "Short") {
      if (player.attributes.passing > 80) tacticBonus += 3;
    }

    return technicalScore + ageBonus + tacticBonus;
  }

  // --- HELPERS ---

  public static getFormationSlotCounts(
    formation: TacticType,
  ): Record<Position, number> {
    return this.getFormationSlots(formation);
  }

  private static getFormationSlots(
    formation: TacticType,
  ): Record<Position, number> {
    // Simplified breakdown. Could parse string "4-4-2" but explicit map is safer.
    const map: Record<TacticType, Record<Position, number>> = {
      [TacticType.T_442]: {
        [Position.GK]: 1,
        [Position.DEF]: 4,
        [Position.MID]: 4,
        [Position.FWD]: 2,
      },
      [TacticType.T_433]: {
        [Position.GK]: 1,
        [Position.DEF]: 4,
        [Position.MID]: 3,
        [Position.FWD]: 3,
      },
      [TacticType.T_352]: {
        [Position.GK]: 1,
        [Position.DEF]: 3,
        [Position.MID]: 5,
        [Position.FWD]: 2,
      },
      [TacticType.T_541]: {
        [Position.GK]: 1,
        [Position.DEF]: 5,
        [Position.MID]: 4,
        [Position.FWD]: 1,
      },
      [TacticType.T_451]: {
        [Position.GK]: 1,
        [Position.DEF]: 4,
        [Position.MID]: 5,
        [Position.FWD]: 1,
      },
      [TacticType.T_4231]: {
        [Position.GK]: 1,
        [Position.DEF]: 4,
        [Position.MID]: 5,
        [Position.FWD]: 1,
      },
      [TacticType.T_343]: {
        [Position.GK]: 1,
        [Position.DEF]: 3,
        [Position.MID]: 4,
        [Position.FWD]: 3,
      },
      [TacticType.T_4141]: {
        [Position.GK]: 1,
        [Position.DEF]: 4,
        [Position.MID]: 5,
        [Position.FWD]: 1,
      },
      [TacticType.T_532]: {
        [Position.GK]: 1,
        [Position.DEF]: 5,
        [Position.MID]: 3,
        [Position.FWD]: 2,
      },
      [TacticType.T_41212]: {
        [Position.GK]: 1,
        [Position.DEF]: 4,
        [Position.MID]: 4,
        [Position.FWD]: 2,
      },
      [TacticType.T_4321]: {
        [Position.GK]: 1,
        [Position.DEF]: 4,
        [Position.MID]: 5,
        [Position.FWD]: 1,
      },
    };
    return map[formation] || map[TacticType.T_442];
  }

  private static recommendRole(pos: Position, tactic: TeamTactic): string {
    // Logic to recommend a role based on Tactic Style
    if (pos === Position.FWD) {
      if (tactic.style === "Counter") return "POACHER"; // Fast break
      if (tactic.passingStyle === "Direct") return "TARGET_MAN"; // Long ball target
      return "FALSE_NINE"; // Default/Possession
    }
    if (pos === Position.MID) {
      if (tactic.style === "HighPress") return "BOX_TO_BOX"; // Engine
      if (tactic.width === "Wide") return "WINGER";
      return "PLAYMAKER";
    }
    if (pos === Position.DEF) {
      if (tactic.passingStyle === "Short") return "BALL_PLAYING";
      return "STOPPER";
    }
  }

  // --- 3. TACTICAL EVOLUTION (MANAGER IDENTITY) ---
  // Checks if the current squad fits the current tactic
  public static evaluateTacticalFit(
    team: Team,
    roster: Player[],
  ): { fitScore: number; suggestedTactic?: TacticType } {
    const squad = roster
      .filter((p) => !p.isTransferListed)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 16); // Top 16 players

    let fitScore = 0;
    const currentTactic = team.tactic;

    // 1. Check Technical Fit for Style
    if (currentTactic.style === "HighPress") {
      const avgStamina =
        squad.reduce((sum, p) => sum + p.attributes.stamina, 0) / squad.length;
      fitScore += avgStamina - 60; // Penalty if avg < 60
    } else if (currentTactic.style === "Possession") {
      const avgPassing =
        squad.reduce((sum, p) => sum + p.attributes.passing, 0) / squad.length;
      fitScore += avgPassing - 60;
    } else if (currentTactic.style === "Counter") {
      const avgSpeed =
        squad.reduce((sum, p) => sum + p.attributes.speed, 0) / squad.length;
      fitScore += avgSpeed - 70; // Needs speed
    }

    // 2. Check Formation Fit (Do we have players for the slots?)
    const slots = this.getFormationSlots(currentTactic.formation);
    let formationPenalty = 0;

    (["DEF", "MID", "FWD"] as Position[]).forEach((pos) => {
      const needed = slots[pos];
      const have = squad.filter((p) => p.position === pos).length;
      if (have < needed) formationPenalty += 20 * (needed - have);
    });

    fitScore -= formationPenalty;

    return { fitScore };
  }

  // Suggests the best formation based on roster strengths
  public static suggestBestTacticForSquad(roster: Player[]): TacticType {
    const squad = roster.filter((p) => !p.isTransferListed);
    const counts = {
      GK: squad.filter((p) => p.position === Position.GK).length,
      DEF: squad.filter((p) => p.position === Position.DEF).length,
      MID: squad.filter((p) => p.position === Position.MID).length,
      FWD: squad.filter((p) => p.position === Position.FWD).length,
    };

    const topPlayers = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 18);
    const avg = (players: Player[], selector: (p: Player) => number, fallback = 50) => {
      if (players.length === 0) return fallback;
      return players.reduce((sum, player) => sum + selector(player), 0) / players.length;
    };

    const mids = topPlayers.filter((p) => p.position === Position.MID);
    const fwds = topPlayers.filter((p) => p.position === Position.FWD);
    const defs = topPlayers.filter((p) => p.position === Position.DEF);

    const midfieldCraft = avg(mids, (p) => ((p.attributes.passing || 50) + (p.attributes.vision || 50) + (p.attributes.decisions || 50)) / 3);
    const forwardMobility = avg(fwds, (p) => ((p.attributes.speed || 50) + (p.attributes.dribbling || 50) + (p.attributes.finishing || 50)) / 3);
    const defensiveMobility = avg(defs, (p) => ((p.attributes.positioning || 50) + (p.attributes.speed || 50) + (p.attributes.tackling || 50)) / 3);
    const squadPace = avg(topPlayers, (p) => ((p.attributes.speed || 50) + (p.attributes.stamina || 50)) / 2);

    const formationCandidates: TacticType[] = [
      TacticType.T_442,
      TacticType.T_433,
      TacticType.T_352,
      TacticType.T_541,
      TacticType.T_451,
      TacticType.T_4231,
      TacticType.T_343,
      TacticType.T_4141,
      TacticType.T_532,
      TacticType.T_41212,
      TacticType.T_4321,
    ];

    const scored = formationCandidates.map((formation) => {
      const slots = this.getFormationSlots(formation);
      const deficitPenalty = Math.max(0, slots[Position.DEF] - counts.DEF) * 18
        + Math.max(0, slots[Position.MID] - counts.MID) * 18
        + Math.max(0, slots[Position.FWD] - counts.FWD) * 18;

      const surplusBonus = Math.max(0, counts.DEF - slots[Position.DEF]) * 2
        + Math.max(0, counts.MID - slots[Position.MID]) * 2
        + Math.max(0, counts.FWD - slots[Position.FWD]) * 2;

      let shapeBonus = 0;
      if (formation === TacticType.T_433) {
        shapeBonus += counts.FWD >= 3 ? 12 : -8;
        shapeBonus += squadPace > 70 ? 8 : 0;
        shapeBonus += forwardMobility > 72 ? 8 : 0;
      }
      if (formation === TacticType.T_4231) {
        shapeBonus += counts.MID >= 5 ? 12 : -6;
        shapeBonus += midfieldCraft > 70 ? 10 : 0;
      }
      if (formation === TacticType.T_4321) {
        shapeBonus += counts.MID >= 5 ? 10 : -8;
        shapeBonus += midfieldCraft > 73 ? 12 : 0;
        shapeBonus += counts.FWD >= 3 ? 4 : 0;
      }
      if (formation === TacticType.T_41212) {
        shapeBonus += counts.FWD >= 2 ? 10 : -10;
        shapeBonus += counts.MID >= 4 ? 8 : -6;
        shapeBonus += midfieldCraft > 69 ? 8 : 0;
        shapeBonus += forwardMobility > 69 ? 5 : 0;
      }
      if (formation === TacticType.T_352) {
        shapeBonus += counts.DEF >= 3 ? 4 : -14;
        shapeBonus += counts.MID >= 5 ? 10 : -10;
        shapeBonus += counts.FWD >= 2 ? 8 : -8;
      }
      if (formation === TacticType.T_532 || formation === TacticType.T_541) {
        shapeBonus += counts.DEF >= 5 ? 14 : -12;
        shapeBonus += defensiveMobility > 69 ? 8 : 0;
        shapeBonus += counts.FWD <= 2 ? 4 : 0;
      }
      if (formation === TacticType.T_4141 || formation === TacticType.T_451) {
        shapeBonus += counts.MID >= 5 ? 10 : -6;
        shapeBonus += midfieldCraft > 68 ? 6 : 0;
      }
      if (formation === TacticType.T_343) {
        shapeBonus += counts.DEF >= 3 ? 4 : -14;
        shapeBonus += counts.FWD >= 3 ? 12 : -10;
        shapeBonus += squadPace > 72 ? 8 : 0;
      }
      if (formation === TacticType.T_442) {
        shapeBonus += counts.DEF >= 4 ? 4 : -8;
        shapeBonus += counts.MID >= 4 ? 4 : -8;
        shapeBonus += counts.FWD >= 2 ? 6 : -8;
      }

      return {
        formation,
        score: shapeBonus + surplusBonus - deficitPenalty,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const bestScore = scored[0]?.score ?? 0;
    const viable = scored.filter((entry) => entry.score >= bestScore - 6);

    return viable[Math.floor(Math.random() * viable.length)]?.formation || TacticType.T_442;
  }

  // --- 4. OPPONENT ANALYSIS (COUNTER-TACTICS) ---
  // Analyzes opponent and adjusts tactic if necessary (The "Rock-Paper-Scissors" Logic)
  public static analyzeOpponent(
    myTeam: Team,
    opponentTactic: TeamTactic,
    opponentReputation: number,
  ): TeamTactic {
    // 1. IDENTITY CHECK (Reputation)
    // If we are much stronger, we dictate the game. We don't adapt.
    const repDiff = myTeam.reputation - opponentReputation;
    if (repDiff > 500) {
      return myTeam.tactic; // We are dominant, play our game.
    }

    // If we are much weaker, we MUST adapt to survive.
    // If evenly matched, we try to get an edge.

    const newTactic = { ...myTeam.tactic };
    let adapted = false;
    const opponentAttack = inferAttackApproach(opponentTactic);
    const opponentDefense = inferDefenseApproach(opponentTactic);

    // 2. ROCK-PAPER-SCISSORS LOGIC

    // SCENARIO A: Opponent plays POSSESSION (Tiki-Taka)
    // Counter: HIGH PRESS (Force mistakes)
    if (opponentAttack === "PATIENT") {
      // If we are not already pressing, strictly increase it
      if (newTactic.pressingIntensity !== "Gegenpress") {
        newTactic.pressingIntensity = "HighPress";
        newTactic.aggression = "Aggressive"; // Physicality disrupts rhythm
        newTactic.defensiveLine = "Balanced";
        adapted = true;
      }
    }

    // SCENARIO B: Opponent plays HIGH PRESS (Gegenpress)
    // Counter: DIRECT / LONG BALL (Bypass midfield pressure)
    else if (opponentDefense === "HUNT") {
      newTactic.style = "Counter";
      newTactic.passingStyle = "Direct"; // Don't play short into pressure
      newTactic.tempo = "Fast";
      newTactic.defensiveLine = "Deep";
      adapted = true;
    }

    // SCENARIO C: Opponent plays PARK THE BUS (Defensive)
    // Counter: WIDTH + PATIENCE (Stretch them, then find the cut-back)
    else if (opponentDefense === "LOW_BLOCK") {
      newTactic.style = "Attacking";
      newTactic.width = "Wide"; // Stretch the bus

      // Deep blocks should be opened with width and movement, not forced low-quality shots.
      const instructions = (newTactic.instructions || []).filter(
        (i) => i !== "ShootOnSight",
      );
      if (!instructions.includes("WorkBallIntoBox")) {
        instructions.push("WorkBallIntoBox");
      }
      newTactic.instructions = instructions;
      adapted = true;
    }

    // SCENARIO D: Opponent plays WIDE (Wings)
    // Counter: NARROW (Pack the box)
    else if (opponentTactic.width === "Wide" || opponentAttack === "FLUID") {
      newTactic.width = "Narrow"; // Force them outside, protect the middle
      newTactic.defensiveLine = "Deep"; // Don't get beaten by pace on wings
      adapted = true;
    }

    return adapted ? newTactic : myTeam.tactic;
  }
}
