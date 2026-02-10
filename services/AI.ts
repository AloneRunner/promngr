
import {
    Team,
    Player,
    Position,
    TeamTactic,
    TacticType,
    PlayerAttributes,
    CoachArchetype
} from '../types';

// === ROLE DEFINITIONS & WEIGHTS ===
// Defines what attributes matter for specific tactical roles
type AttributeWeights = Partial<Record<keyof PlayerAttributes, number>>;

interface RoleDefinition {
    name: string;
    description: string;
    weights: AttributeWeights;
}

const ROLE_DEFINITIONS: Record<Position, Record<string, RoleDefinition>> = {
    [Position.GK]: {
        'STANDARD': {
            name: 'Standard GK',
            description: 'Reliable shot stopper.',
            weights: { goalkeeping: 2.0, positioning: 1.0, composure: 0.5, decisions: 0.5 }
        },
        'SWEEPER': {
            name: 'Sweeper Keeper',
            description: 'Good with feet, defends high line.',
            weights: { goalkeeping: 1.5, passing: 1.0, speed: 0.8, vision: 0.5 }
        }
    },
    [Position.DEF]: {
        'STOPPER': {
            name: 'Stopper',
            description: 'No nonsense defender.',
            weights: { tackling: 1.5, strength: 1.5, positioning: 1.0, aggression: 0.8 }
        },
        'BALL_PLAYING': {
            name: 'Ball Playing Defender',
            description: 'Comfortable on the ball.',
            weights: { tackling: 1.2, passing: 1.2, composure: 1.0, vision: 0.8 }
        },
        'FULLBACK_ATTACK': {
            name: 'Attacking Fullback',
            description: 'Runs up and down the flank.',
            weights: { speed: 1.5, stamina: 1.5, passing: 1.0, dribbling: 0.8 }
        }
    },
    [Position.MID]: {
        'BALL_WINNER': {
            name: 'Ball Winner',
            description: 'Destroys attacks.',
            weights: { tackling: 1.5, aggression: 1.2, strength: 1.2, stamina: 1.2 }
        },
        'PLAYMAKER': {
            name: 'Playmaker',
            description: 'Dictates tempo.',
            weights: { passing: 1.8, vision: 1.5, composure: 1.2, decisions: 1.0 }
        },
        'BOX_TO_BOX': {
            name: 'Box to Box',
            description: 'Does everything.',
            weights: { stamina: 2.0, speed: 1.0, passing: 1.0, tackling: 1.0, finishing: 0.8 }
        },
        'WINGER': {
            name: 'Classic Winger',
            description: 'Hugs the line and crosses.',
            weights: { speed: 1.5, dribbling: 1.2, passing: 1.2, stamina: 1.0 }
        }
    },
    [Position.FWD]: {
        'TARGET_MAN': {
            name: 'Target Man',
            description: 'Aerial threat and hold up play.',
            weights: { strength: 1.5, positioning: 1.2, finishing: 1.0, decisions: 0.8 }
        },
        'POACHER': {
            name: 'Poacher',
            description: 'Finishes inside the box.',
            weights: { finishing: 2.0, positioning: 1.5, composure: 1.2, speed: 0.8 }
        },
        'FALSE_NINE': {
            name: 'False Nine',
            description: 'Drops deep to create.',
            weights: { passing: 1.5, dribbling: 1.2, vision: 1.2, finishing: 1.0 }
        },
        'INSIDE_FORWARD': {
            name: 'Inside Forward',
            description: 'Cuts inside to shoot.',
            weights: { speed: 1.5, dribbling: 1.5, finishing: 1.2, stamina: 0.8 }
        }
    }
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
    public static analyzeSquadNeeds(team: Team, roster: Player[], leagueAverageRating: number): PositionalNeed[] {
        const needs: PositionalNeed[] = [];

        // Filter active players (exclude loaned out or reserve trash)
        const squad = roster.filter(p => !p.isTransferListed);

        // Define required slots per formation (simplified)
        const formationSlots = this.getFormationSlots(team.tactic.formation);

        // Group players by Position and Grade them
        const depthChart = {
            [Position.GK]: squad.filter(p => p.position === Position.GK).sort((a, b) => b.overall - a.overall),
            [Position.DEF]: squad.filter(p => p.position === Position.DEF).sort((a, b) => b.overall - a.overall),
            [Position.MID]: squad.filter(p => p.position === Position.MID).sort((a, b) => b.overall - a.overall),
            [Position.FWD]: squad.filter(p => p.position === Position.FWD).sort((a, b) => b.overall - a.overall)
        };

        // Check Goalkeeper
        const bestGK = depthChart[Position.GK][0];
        if (!bestGK || bestGK.overall < leagueAverageRating - 5) {
            needs.push({
                position: Position.GK,
                role: 'STANDARD',
                urgency: bestGK ? (leagueAverageRating - bestGK.overall) * 10 : 100,
                targetRating: leagueAverageRating + 2,
                reason: 'No reliable goalkeeper'
            });
        }

        // Check Outfield Positions
        // Example: Tactic needs 4 DEFs. Do we have 4 *good* DEFs?
        (['DEF', 'MID', 'FWD'] as Position[]).forEach(pos => {
            const requiredCount = formationSlots[pos] || 0;
            const availablePlayers = depthChart[pos];

            // Check Starters Quality
            for (let i = 0; i < requiredCount; i++) {
                const player = availablePlayers[i];
                if (!player) {
                    // Critical: Missing a starter!
                    needs.push({
                        position: pos,
                        role: this.recommendRole(pos, team.tactic),
                        urgency: 95,
                        targetRating: leagueAverageRating,
                        reason: `Missing starter for ${pos}`
                    });
                } else if (player.overall < leagueAverageRating - 4) {
                    // Weak Spot
                    needs.push({
                        position: pos,
                        role: this.recommendRole(pos, team.tactic),
                        urgency: (leagueAverageRating - player.overall) * 8 + 30, // 30-70 range usually
                        targetRating: leagueAverageRating + 3,
                        reason: `Weak starter at ${pos} (${player.overall})`
                    });
                }
            }

            // Check Depth (We need at least 1 decent sub per line)
            if (availablePlayers.length < requiredCount + 1) {
                needs.push({
                    position: pos,
                    role: this.recommendRole(pos, team.tactic),
                    urgency: 40,
                    targetRating: leagueAverageRating - 5,
                    reason: `Lack of depth at ${pos}`
                });
            }
        });

        return needs.sort((a, b) => b.urgency - a.urgency);
    }

    // --- 2. PLAYER UTILITY SCORING ---
    // Calculates how good a player is for a SPECIFIC role
    public static calculatePlayerUtility(player: Player, roleName: string, tactic: TeamTactic): number {
        // Find Role Definition
        const posRoles = ROLE_DEFINITIONS[player.position as Position];
        // Default to first role if not found or mismatch
        const roleDef = (posRoles && posRoles[roleName])
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
        if (tactic.style === 'HighPress') {
            if (player.attributes.stamina > 80) tacticBonus += 3;
            if (player.attributes.aggression > 80) tacticBonus += 2;
        }
        if (tactic.passingStyle === 'Short') {
            if (player.attributes.passing > 80) tacticBonus += 3;
        }

        return technicalScore + ageBonus + tacticBonus;
    }

    // --- HELPERS ---

    private static getFormationSlots(formation: TacticType): Record<Position, number> {
        // Simplified breakdown. Could parse string "4-4-2" but explicit map is safer.
        const map: Record<TacticType, Record<Position, number>> = {
            [TacticType.T_442]: { [Position.GK]: 1, [Position.DEF]: 4, [Position.MID]: 4, [Position.FWD]: 2 },
            [TacticType.T_433]: { [Position.GK]: 1, [Position.DEF]: 4, [Position.MID]: 3, [Position.FWD]: 3 },
            [TacticType.T_352]: { [Position.GK]: 1, [Position.DEF]: 3, [Position.MID]: 5, [Position.FWD]: 2 },
            [TacticType.T_541]: { [Position.GK]: 1, [Position.DEF]: 5, [Position.MID]: 4, [Position.FWD]: 1 },
            [TacticType.T_451]: { [Position.GK]: 1, [Position.DEF]: 4, [Position.MID]: 5, [Position.FWD]: 1 },
            [TacticType.T_4231]: { [Position.GK]: 1, [Position.DEF]: 4, [Position.MID]: 5, [Position.FWD]: 1 },
            [TacticType.T_343]: { [Position.GK]: 1, [Position.DEF]: 3, [Position.MID]: 4, [Position.FWD]: 3 },
            [TacticType.T_4141]: { [Position.GK]: 1, [Position.DEF]: 4, [Position.MID]: 5, [Position.FWD]: 1 },
            [TacticType.T_532]: { [Position.GK]: 1, [Position.DEF]: 5, [Position.MID]: 3, [Position.FWD]: 2 },
            [TacticType.T_41212]: { [Position.GK]: 1, [Position.DEF]: 4, [Position.MID]: 4, [Position.FWD]: 2 },
            [TacticType.T_4321]: { [Position.GK]: 1, [Position.DEF]: 4, [Position.MID]: 5, [Position.FWD]: 1 },
        };
        return map[formation] || map[TacticType.T_442];
    }

    private static recommendRole(pos: Position, tactic: TeamTactic): string {
        // Logic to recommend a role based on Tactic Style
        if (pos === Position.FWD) {
            if (tactic.style === 'Counter') return 'POACHER'; // Fast break
            if (tactic.passingStyle === 'Direct') return 'TARGET_MAN'; // Long ball target
            return 'FALSE_NINE'; // Default/Possession
        }
        if (pos === Position.MID) {
            if (tactic.style === 'HighPress') return 'BOX_TO_BOX'; // Engine
            if (tactic.width === 'Wide') return 'WINGER';
            return 'PLAYMAKER';
        }
        if (pos === Position.DEF) {
            if (tactic.passingStyle === 'Short') return 'BALL_PLAYING';
            return 'STOPPER';
        }
    }

    // --- 3. TACTICAL EVOLUTION (MANAGER IDENTITY) ---
    // Checks if the current squad fits the current tactic
    public static evaluateTacticalFit(team: Team, roster: Player[]): { fitScore: number, suggestedTactic?: TacticType } {
        const squad = roster.filter(p => !p.isTransferListed).sort((a, b) => b.overall - a.overall).slice(0, 16); // Top 16 players

        let fitScore = 0;
        const currentTactic = team.tactic;

        // 1. Check Technical Fit for Style
        if (currentTactic.style === 'HighPress') {
            const avgStamina = squad.reduce((sum, p) => sum + p.attributes.stamina, 0) / squad.length;
            fitScore += (avgStamina - 60); // Penalty if avg < 60
        } else if (currentTactic.style === 'Possession') {
            const avgPassing = squad.reduce((sum, p) => sum + p.attributes.passing, 0) / squad.length;
            fitScore += (avgPassing - 60);
        } else if (currentTactic.style === 'Counter') {
            const avgSpeed = squad.reduce((sum, p) => sum + p.attributes.speed, 0) / squad.length;
            fitScore += (avgSpeed - 70); // Needs speed
        }

        // 2. Check Formation Fit (Do we have players for the slots?)
        const slots = this.getFormationSlots(currentTactic.formation);
        let formationPenalty = 0;

        (['DEF', 'MID', 'FWD'] as Position[]).forEach(pos => {
            const needed = slots[pos];
            const have = squad.filter(p => p.position === pos).length;
            if (have < needed) formationPenalty += 20 * (needed - have);
        });

        fitScore -= formationPenalty;

        return { fitScore: Math.max(0, fitScore) };
    }

    // Suggests the best formation based on roster strengths
    public static suggestBestTacticForSquad(roster: Player[]): TacticType {
        const squad = roster.filter(p => !p.isTransferListed);
        const counts = {
            GK: squad.filter(p => p.position === Position.GK).length,
            DEF: squad.filter(p => p.position === Position.DEF).length,
            MID: squad.filter(p => p.position === Position.MID).length,
            FWD: squad.filter(p => p.position === Position.FWD).length
        };

        // Simple heuristic: Where is the depth?
        if (counts.FWD >= 3 && counts.MID >= 3) return TacticType.T_433;
        if (counts.FWD === 2 && counts.MID >= 5) return TacticType.T_352;
        if (counts.MID >= 5 && counts.FWD === 1) return TacticType.T_4231;
        if (counts.DEF >= 5) return TacticType.T_541;

        return TacticType.T_442; // Default
    }

    // --- 4. OPPONENT ANALYSIS (COUNTER-TACTICS) ---
    // Analyzes opponent and adjusts tactic if necessary (The "Rock-Paper-Scissors" Logic)
    public static analyzeOpponent(
        myTeam: Team,
        opponentTactic: TeamTactic,
        opponentReputation: number
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

        // 2. ROCK-PAPER-SCISSORS LOGIC

        // SCENARIO A: Opponent plays POSSESSION (Tiki-Taka)
        // Counter: HIGH PRESS (Force mistakes)
        if (opponentTactic.style === 'Possession' || opponentTactic.passingStyle === 'Short') {
            // If we are not already pressing, strictly increase it
            if (newTactic.pressingIntensity !== 'Gegenpress') {
                newTactic.pressingIntensity = 'HighPress';
                newTactic.aggression = 'Aggressive'; // Physicality disrupts rhythm
                adapted = true;
            }
        }

        // SCENARIO B: Opponent plays HIGH PRESS (Gegenpress)
        // Counter: DIRECT / LONG BALL (Bypass midfield pressure)
        else if (opponentTactic.style === 'HighPress' || opponentTactic.pressingIntensity === 'Gegenpress') {
            newTactic.style = 'Counter';
            newTactic.passingStyle = 'Direct'; // Don't play short into pressure
            newTactic.tempo = 'Fast';
            adapted = true;
        }

        // SCENARIO C: Opponent plays PARK THE BUS (Defensive)
        // Counter: WIDTH + SHOOT ON SIGHT (Stretch them and test GK)
        else if (opponentTactic.style === 'Defensive' || opponentTactic.defensiveLine === 'Deep') {
            newTactic.style = 'Attacking';
            newTactic.width = 'Wide'; // Stretch the bus

            // Add "Shoot On Sight" instruction if not present
            const instructions = newTactic.instructions || [];
            if (!instructions.includes('ShootOnSight')) {
                newTactic.instructions = [...instructions, 'ShootOnSight'];
            }
            adapted = true;
        }

        // SCENARIO D: Opponent plays WIDE (Wings)
        // Counter: NARROW (Pack the box)
        else if (opponentTactic.width === 'Wide') {
            newTactic.width = 'Narrow'; // Force them outside, protect the middle
            newTactic.defensiveLine = 'Deep'; // Don't get beaten by pace on wings
            adapted = true;
        }

        return adapted ? newTactic : myTeam.tactic;
    }
}
