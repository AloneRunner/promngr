
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
    PlayerPersonality
} from '../types';

// --- UTILS ---
const dist = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
const distSq = (x1: number, y1: number, x2: number, y2: number) => (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

// --- CONSTANTS ---
export const TICKS_PER_MINUTE = 60; // ~3 seconds per minute at 1x speed (50ms per tick)

const MAX_PLAYER_SPEED = 1.2;  // 1.0 → 1.2 (biraz hızlandı, ~37 km/h)
const MAX_BALL_SPEED = 4.0;    // 3.5 → 4.0 (daha dinamik şutlar/paslar)
const BALL_FRICTION = 0.96;
const BALL_AIR_DRAG = 0.98;
const GRAVITY = 0.20;          // 0.18 → 0.20 (daha gerçekçi düşüş, havadan paslar çok uzun kalmıyordu)
const BALL_BOUNCE = 0.55;      // Top zıplama katsayısı (yeni)
const PLAYER_ACCELERATION = 0.12; // 0.15 → 0.12 (daha yumuşak ivme)
const PLAYER_TURN_SPEED = 0.25;

// AI Ranges
const SHOOT_RANGE = 30;  // 25 → 30 uzak şut artırıldı (daha fazla şut için)
const PASS_RANGE_VISION = 50;
const TACKLE_RANGE_BASE = 4.5;  // 3.0 → 4.5 Aggressive Defense!
const PRESSING_RANGE = 30; // 20 → 30 Earlier Pressing!

// Goal Dimensions - Genişletildi (gol tespiti için)
const GOAL_Y_TOP = 44.0;    // 46.3 → 44 (daha geniş)
const GOAL_Y_BOTTOM = 56.0; // 53.7 → 56 (daha geniş)
const GOAL_Y_CENTER = 50.0;

// --- RATING CALCULATOR ---
export const calculateEffectiveRating = (player: Player, assignedPosition: Position, currentCondition: number = 100): number => {
    if (!player || !player.attributes) return 60;
    const attr = player.attributes;
    let score = 0;

    if (assignedPosition === Position.GK) {
        score = (attr.goalkeeping * 0.85) + (attr.decisions * 0.05) + (attr.positioning * 0.05) + (attr.strength * 0.05);
    } else if (assignedPosition === Position.DEF) {
        score = (attr.tackling * 0.40) + (attr.strength * 0.20) + (attr.positioning * 0.15) + (attr.speed * 0.15) + (attr.passing * 0.10);
    } else if (assignedPosition === Position.MID) {
        score = (attr.passing * 0.30) + (attr.vision * 0.20) + (attr.dribbling * 0.15) + (attr.stamina * 0.15) + (attr.tackling * 0.10) + (attr.finishing * 0.10);
    } else if (assignedPosition === Position.FWD) {
        score = (attr.finishing * 0.40) + (attr.speed * 0.25) + (attr.dribbling * 0.15) + (attr.positioning * 0.10) + (attr.strength * 0.10);
    }

    // POSITION PENALTY
    if (player.position !== assignedPosition) {
        if (player.position === Position.GK || assignedPosition === Position.GK) score *= 0.1;
        else if ((player.position === Position.DEF && assignedPosition === Position.FWD) || (player.position === Position.FWD && assignedPosition === Position.DEF)) score *= 0.6;
        else score *= 0.90;
    }

    // MORALE IMPACT
    let moraleMod = 1.0;
    if (player.morale < 50) {
        moraleMod = 0.9 + (player.morale / 50) * 0.1;
    } else {
        moraleMod = 1.0 + ((player.morale - 50) / 50) * 0.05;
    }



    // STAMINA IMPACT (FATIGUE)
    // Relaxed curve: Players stay effective longer.
    let fatigueMod = 1.0;
    if (currentCondition < 30) {
        // Critical fatigue only below 30%
        fatigueMod = Math.max(0.5, currentCondition / 60);
    } else if (currentCondition < 60) {
        // Minor drop between 30-60%
        fatigueMod = 0.85 + ((currentCondition - 30) / 30) * 0.15;
    }

    return Math.floor(score * moraleMod * fatigueMod);
};

export const getRoleFromX = (x: number): Position => {
    if (x < 12) return Position.GK;
    if (x < 38) return Position.DEF;
    if (x < 72) return Position.MID;
    return Position.FWD;
};

export const getFormationStructure = (formation: TacticType) => {
    switch (formation) {
        case TacticType.T_442: return { DEF: 4, MID: 4, FWD: 2 };
        case TacticType.T_433: return { DEF: 4, MID: 3, FWD: 3 };
        case TacticType.T_352: return { DEF: 3, MID: 5, FWD: 2 };
        case TacticType.T_541: return { DEF: 5, MID: 4, FWD: 1 };
        case TacticType.T_451: return { DEF: 4, MID: 5, FWD: 1 };
        case TacticType.T_4231: return { DEF: 4, MID: 5, FWD: 1 };
        case TacticType.T_343: return { DEF: 3, MID: 4, FWD: 3 };
        case TacticType.T_4141: return { DEF: 4, MID: 5, FWD: 1 };
        case TacticType.T_532: return { DEF: 5, MID: 3, FWD: 2 };
        case TacticType.T_41212: return { DEF: 4, MID: 4, FWD: 2 };
        case TacticType.T_4321: return { DEF: 4, MID: 5, FWD: 1 };
        default: return { DEF: 4, MID: 4, FWD: 2 };
    }
};

const normalizePos = (p: Player): Position => {
    if (!p) return Position.MID;
    const raw = p.position as string;
    if (raw === 'KL' || raw === 'GK') return Position.GK;
    if (['STP', 'SĞB', 'SLB', 'DEF', 'CB', 'LB', 'RB', 'SW'].includes(raw)) return Position.DEF;
    if (['MDO', 'MO', 'MOO', 'MID', 'CDM', 'CM', 'CAM', 'LM', 'RM'].includes(raw)) return Position.MID;
    return Position.FWD;
};

export const getBaseFormationOffset = (formation: TacticType, role: Position, index: number, totalInRole: number): { x: number, y: number } => {
    const spreadY = (idx: number, tot: number, span: number) => {
        if (tot <= 1) return 50;
        return 50 - (span / 2) + (span / (tot - 1)) * idx;
    };

    if (role === Position.GK) return { x: 5, y: 50 };

    if (role === Position.DEF) {
        if (formation.startsWith('3')) return { x: 22, y: spreadY(index, totalInRole, 60) };
        if (formation.startsWith('5')) return { x: 18, y: spreadY(index, totalInRole, 85) };
        // Standard 4
        if (index === 0) return { x: 22, y: 15 }; // LB
        if (index === 1) return { x: 22, y: 40 }; // CB
        if (index === 2) return { x: 22, y: 60 }; // CB
        if (index === 3) return { x: 22, y: 85 }; // RB
        return { x: 22, y: spreadY(index, totalInRole, 80) };
    }

    if (role === Position.MID) {
        if (formation === TacticType.T_433 || formation === TacticType.T_532) {
            return { x: 50, y: spreadY(index, totalInRole, 70) };
        }
        if (formation === TacticType.T_442) {
            return { x: 50, y: spreadY(index, totalInRole, 85) };
        }
        if (formation === TacticType.T_4231) {
            if (index < 2) return { x: 42, y: index === 0 ? 35 : 65 }; // CDM
            if (index === 2) return { x: 65, y: 20 }; // LAM
            if (index === 3) return { x: 65, y: 50 }; // CAM
            if (index === 4) return { x: 65, y: 80 }; // RAM
        }
        if (formation === TacticType.T_4141) {
            if (index === 0) return { x: 40, y: 50 }; // CDM
            return { x: 62, y: spreadY(index - 1, 4, 85) }; // 4 Mid
        }
        if (formation === TacticType.T_41212) {
            if (index === 0) return { x: 40, y: 50 }; // CDM
            if (index === 1) return { x: 55, y: 25 }; // LM
            if (index === 2) return { x: 55, y: 75 }; // RM
            if (index === 3) return { x: 70, y: 50 }; // CAM
        }
        if (formation === TacticType.T_352) {
            if (index < 2) return { x: 45, y: 30 + (index * 40) }; // 2 DMs
            return { x: 60, y: spreadY(index - 2, 3, 85) }; // 3 AMs
        }
        if (formation === TacticType.T_4321) {
            if (index < 3) return { x: 48, y: spreadY(index, 3, 70) }; // 3 CMs
            return { x: 68, y: index === 3 ? 35 : 65 }; // 2 AMs
        }
        return { x: 55, y: spreadY(index, totalInRole, 80) };
    }

    if (role === Position.FWD) {
        if (formation === TacticType.T_433 || formation === TacticType.T_343) {
            if (index === 1) return { x: 88, y: 50 };
            return { x: 82, y: index === 0 ? 15 : 85 };
        }
        if (totalInRole === 1) return { x: 88, y: 50 };
        if (totalInRole === 2) return { x: 86, y: index === 0 ? 35 : 65 };
        return { x: 82, y: spreadY(index, totalInRole, 60) };
    }

    return { x: 50, y: 50 };
};

type SetPieceMode = 'KICKOFF' | 'GOAL_KICK_HOME' | 'GOAL_KICK_AWAY' | 'CORNER_HOME_TOP' | 'CORNER_HOME_BOTTOM' | 'CORNER_AWAY_TOP' | 'CORNER_AWAY_BOTTOM';

interface Signal {
    type: 'CALL' | 'POINT' | 'HOLD';
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
    private baseOffsets: Record<string, { x: number, y: number }> = {};

    // Helper for cover shadow calculation
    private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const l2 = distSq(x1, y1, x2, y2);
        if (l2 === 0) return dist(px, py, x1, y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }

    private homeMentality: TeamMentality = TeamMentality.BALANCED;
    private awayMentality: TeamMentality = TeamMentality.BALANCED;

    // Track ticks for possession calculation
    private possessionTicks = { home: 0, away: 0 };

    private playerStates: Record<string, {
        currentStamina: number,
        decisionTimer: number,
        possessionCooldown: number,
        actionLock: number,
        targetX: number,
        targetY: number,
        momentum: number,
        isPressing: boolean,
        incomingSignal?: Signal | null,
        outgoingSignal?: Signal | null
    }> = {};

    private tickCount: number = 0;
    private internalMinute: number = 0;
    private currentLooseBallChaserId: string | null = null;
    private lastTouchTeamId: string | null = null;
    private lastShooterId: string | null = null;

    // Substitution tracking
    private homeSubsMade: number = 0;
    private awaySubsMade: number = 0;
    private readonly MAX_SUBS: number = 5; // Modern rules allow 5 subs
    private lastAISubCheck: number = 0;
    private userTeamId: string | null = null; // User's team won't get AI subs
    
    // IMPORTANT: Once a player is substituted OUT, they CANNOT return (Football Rule!)
    private substitutedOutPlayerIds: Set<string> = new Set();
    
    // Pending events to be returned in step()
    private pendingEvents: MatchEvent[] = [];

    constructor(match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[], userTeamId?: string) {
        this.match = match;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        // Keep all players (STARTING + BENCH) so substitutions can work
        this.homePlayers = homePlayers.filter(p => p.lineup === 'STARTING' || p.lineup === 'BENCH');
        this.awayPlayers = awayPlayers.filter(p => p.lineup === 'STARTING' || p.lineup === 'BENCH');
        this.allPlayers = [...this.homePlayers, ...this.awayPlayers];
        this.userTeamId = userTeamId || null;

        this.internalMinute = match.currentMinute;

        // Only initialize STARTING players on the pitch
        this.initializeTactics(this.homePlayers.filter(p => p.lineup === 'STARTING'), this.homeTeam.tactic);
        this.initializeTactics(this.awayPlayers.filter(p => p.lineup === 'STARTING'), this.awayTeam.tactic);

        [...this.homePlayers, ...this.awayPlayers].forEach(p => {
            if (!p.personality) {
                p.personality = {
                    riskTaking: (p.attributes.aggression / 100) * 0.6 + Math.random() * 0.4,
                    discipline: (p.attributes.decisions / 100),
                    pressureHandling: (p.attributes.composure / 100)
                };
            }

            if (!this.playerStates[p.id]) {
                // Initialize stamina from player condition
                this.playerStates[p.id] = {
                    currentStamina: (p.condition !== undefined ? p.condition : 100),
                    decisionTimer: Math.random() * 5,
                    possessionCooldown: 0,
                    actionLock: 0,
                    targetX: 50, targetY: 50,
                    momentum: 0,
                    isPressing: false
                };
            }
        });

        if (match.liveData?.simulation && Object.keys(match.liveData.simulation.players).length > 0) {
            this.sim = JSON.parse(JSON.stringify(match.liveData.simulation));
            if (this.sim.ball.z === undefined) { this.sim.ball.z = 0; this.sim.ball.vz = 0; }
        } else {
            this.sim = {
                ball: { x: 50, y: 50, z: 0, vx: 0, vy: 0, vz: 0, curve: 0, ownerId: null },
                players: {},
                homeMentality: TeamMentality.BALANCED,
                awayMentality: TeamMentality.BALANCED
            };
            this.resetPositions('KICKOFF');
        }

        // Only add STARTING players to the pitch simulation
        [...this.homePlayers, ...this.awayPlayers]
            .filter(p => p.lineup === 'STARTING')
            .forEach(p => {
                if (!this.sim.players[p.id]) {
                    const base = this.baseOffsets[p.id] || { x: 50, y: 50 };
                    this.sim.players[p.id] = { x: base.x, y: base.y, facing: 0, vx: 0, vy: 0, state: 'IDLE' };
                }
            });
    }

    private initializeTactics(players: Player[], tactic: TeamTactic) {
        const grouped: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
        players.forEach(p => {
            let role = normalizePos(p);
            if (tactic.customPositions && tactic.customPositions[p.id]) {
                role = getRoleFromX(tactic.customPositions[p.id].x);
            }
            this.playerRoles[p.id] = role;
            grouped[role].push(p);
        });

        Object.entries(grouped).forEach(([role, plList]) => {
            // AI FIX: Sort players to ensure positional correctness (Left -> Right)
            // This ensures Index 0 is Left, Index 1 Center, Index 2 Right for 3-man lines
            if (role === Position.FWD || role === Position.MID || role === Position.DEF) {
                plList.sort((a, b) => {
                    const scorePos = (p: string) => {
                        const pos = p.toUpperCase();
                        if (['SLB', 'LB', 'SLO', 'LM', 'LW', 'LF'].includes(pos)) return 1;
                        if (['STP', 'CB', 'MDO', 'CDM', 'MO', 'CM', 'CAM', 'SNT', 'ST', 'CF'].includes(pos)) return 2;
                        if (['SĞB', 'RB', 'SĞO', 'RM', 'RW', 'RF'].includes(pos)) return 3;
                        return 2;
                    };
                    return scorePos(a.position) - scorePos(b.position);
                });
            }

            plList.forEach((p, idx) => {
                if (tactic.customPositions && tactic.customPositions[p.id]) {
                    this.baseOffsets[p.id] = tactic.customPositions[p.id];
                } else {
                    this.baseOffsets[p.id] = getBaseFormationOffset(tactic.formation, role as Position, idx, plList.length);
                }
            });
        });
    }

    private getPlayer(id: string) { return [...this.homePlayers, ...this.awayPlayers].find(p => p.id === id); }

    public getPlayerStamina(id: string): number | undefined {
        return this.playerStates[id]?.currentStamina;
    }

    // --- COMMUNICATION SYSTEM ---
    private emitTeamSignal(from: Player, type: 'CALL' | 'POINT' | 'HOLD', targetId?: string, radius: number = 45, durationTicks: number = 10) {
        try {
            const teammates = from.teamId === this.homeTeam.id ? this.homePlayers : this.awayPlayers;
            const expiry = this.tickCount + durationTicks;
            const simFrom = this.sim.players[from.id];

            if (this.playerStates[from.id]) {
                this.playerStates[from.id].outgoingSignal = { type, targetId, expiryTick: expiry };
            }

            teammates.forEach(tm => {
                if (tm.id === from.id) return;
                if (!this.sim.players[tm.id]) return;
                if (dist(simFrom.x, simFrom.y, this.sim.players[tm.id].x, this.sim.players[tm.id].y) > radius) return;

                if (this.playerStates[tm.id]) {
                    this.playerStates[tm.id].incomingSignal = { type, targetId: from.id, expiryTick: expiry };
                }
            });
        } catch (e) { }
    }

    private clearExpiredSignals() {
        Object.keys(this.playerStates).forEach(id => {
            const state = this.playerStates[id];
            if (state.incomingSignal && state.incomingSignal.expiryTick < this.tickCount) state.incomingSignal = null;
            if (state.outgoingSignal && state.outgoingSignal.expiryTick < this.tickCount) state.outgoingSignal = null;
        });
    }

    public updateTactic(teamId: string, newTactic: TeamTactic) {
        const isHome = this.homeTeam.id === teamId;
        const list = isHome ? this.homePlayers : this.awayPlayers;
        if (isHome) this.homeTeam.tactic = newTactic;
        else this.awayTeam.tactic = newTactic;
        this.initializeTactics(list.filter(p => p.lineup === 'STARTING'), newTactic);
    }

    public substitutePlayer(playerIn: Player, playerOutId: string, isAI: boolean = false) {
        const isHome = this.homeTeam.id === playerIn.teamId;
        const list = isHome ? this.homePlayers : this.awayPlayers;

        // Find BOTH players in the list
        const outIdx = list.findIndex(p => p.id === playerOutId);
        const inIdx = list.findIndex(p => p.id === playerIn.id);

        // Check sub limit
        const subsMade = isHome ? this.homeSubsMade : this.awaySubsMade;
        if (subsMade >= this.MAX_SUBS) {
            this.traceLog.push(`DEĞİŞİKLİK REDDEDİLDİ: ${isHome ? 'Ev sahibi' : 'Deplasman'} maksimum değişiklik hakkını kullandı.`);
            return;
        }
        
        // FOOTBALL RULE: A player who has been substituted OUT cannot return to the pitch!
        if (this.substitutedOutPlayerIds.has(playerIn.id)) {
            this.traceLog.push(`DEĞİŞİKLİK REDDEDİLDİ: ${playerIn.lastName} zaten oyundan çıkarıldı ve tekrar giremez!`);
            return;
        }

        if (outIdx !== -1 && inIdx !== -1) {
            // Mark the outgoing player as substituted out - they can NEVER return this match
            this.substitutedOutPlayerIds.add(playerOutId);
            
            // --- 1. UPDATE SIMULATION DATA ---
            const oldPos = this.sim.players[playerOutId];

            // Remove outgoing player from simulation
            if (oldPos) delete this.sim.players[playerOutId];

            // Add incoming player to simulation
            // CRITICAL FIX: Reset velocity to ZERO! Otherwise inherits old player's speed -> "light speed bug"
            const base = this.baseOffsets[playerIn.id] || { x: 50, y: 50 };
            this.sim.players[playerIn.id] = {
                x: oldPos ? oldPos.x : base.x,
                y: oldPos ? oldPos.y : base.y,
                facing: oldPos ? oldPos.facing : 0,
                vx: 0, // RESET VELOCITY - Prevents "light speed" bug!
                vy: 0,
                state: 'IDLE'
            };

            // Initialize personality if missing
            if (!playerIn.personality) {
                playerIn.personality = {
                    riskTaking: (playerIn.attributes.aggression / 100) * 0.6 + Math.random() * 0.4,
                    discipline: (playerIn.attributes.decisions / 100),
                    pressureHandling: (playerIn.attributes.composure / 100)
                };
            }

            // Initialize player state
            this.playerStates[playerIn.id] = {
                currentStamina: (playerIn.condition !== undefined ? playerIn.condition : 100),
                decisionTimer: 0, possessionCooldown: 0, actionLock: 0,
                targetX: base.x, targetY: base.y, momentum: 0, isPressing: false
            };

            // --- 2. CRITICAL: SWAP ARRAY POSITIONS (Fixes duplicate reference bug!) ---
            // Get references to both player objects
            const playerOutObj = list[outIdx];
            const playerInObj = list[inIdx];

            // Update lineup statuses
            playerOutObj.lineup = 'BENCH';
            playerInObj.lineup = 'STARTING';
            playerInObj.lineupIndex = playerOutObj.lineupIndex; // Preserve slot index

            // SWAP positions in array - this prevents the "duplicate reference" bug!
            list[outIdx] = playerInObj;  // Incoming player to starting spot
            list[inIdx] = playerOutObj;  // Outgoing player to bench spot

            this.allPlayers = [...this.homePlayers, ...this.awayPlayers];

            // --- 3. REINITIALIZE TACTICS ---
            this.initializeTactics(list.filter(p => p.lineup === 'STARTING'), isHome ? this.homeTeam.tactic : this.awayTeam.tactic);

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
                playerId: playerIn.id
            });

            this.traceLog.push(`OYUNCU DEĞİŞİKLİĞİ: ${playerIn.lastName} oyunda. (${isHome ? this.homeSubsMade : this.awaySubsMade}/${this.MAX_SUBS})`);
        }
    }

    // AI-driven substitutions for non-user teams
    private processAISubstitutions(isHome: boolean) {
        const team = isHome ? this.homeTeam : this.awayTeam;
        const players = isHome ? this.homePlayers : this.awayPlayers;
        const subsMade = isHome ? this.homeSubsMade : this.awaySubsMade;

        if (subsMade >= this.MAX_SUBS) return;
        if (this.internalMinute < 40) return; // Only consider subs after 40th minute (erkene alındı)

        const starters = players.filter(p => p.lineup === 'STARTING');
        // IMPORTANT: Filter out players who were already substituted out - they can't return!
        const bench = players.filter(p => p.lineup === 'BENCH' && !this.substitutedOutPlayerIds.has(p.id));

        if (bench.length === 0) return;

        // Find player with worst stamina/performance
        let worstPlayer: Player | null = null;
        let worstScore = Infinity;

        for (const p of starters) {
            if (normalizePos(p) === Position.GK) continue; // Don't sub GK unless injured

            const state = this.playerStates[p.id];
            if (!state) continue;

            // Score based on stamina and position match
            let score = state.currentStamina;

            // If very tired (below 50%), prioritize subbing greatly
            if (state.currentStamina < 50) {
                score -= 30;
            }

            if (score < worstScore) {
                worstScore = score;
                worstPlayer = p;
            }
        }

        // Only sub if the player is getting tired
        // Threshold 60 - AI değişiklik için daha agresif (artırıldı: 55 -> 60)
        if (!worstPlayer || worstScore > 60) return;

        // Find best bench replacement for the position
        const neededPos = normalizePos(worstPlayer);
        let bestSub: Player | null = null;
        let bestSubScore = -Infinity;

        for (const sub of bench) {
            const subState = this.playerStates[sub.id];
            const stamina = subState ? subState.currentStamina : (sub.condition || 100);

            // CRITICAL FIX: NEVER SUB A GK FOR A FIELD PLAYER OR VICE VERSA
            const subIsGK = normalizePos(sub) === Position.GK;
            const neededIsGK = neededPos === Position.GK; // This theoretically won't happen for subs as we filtered GK out of 'starters' loop, but for safety.

            if (subIsGK !== neededIsGK) continue;

            // Prefer same position
            const posMatch = normalizePos(sub) === neededPos ? 10 : 0;
            const score = sub.overall + posMatch + (stamina / 10);

            if (score > bestSubScore) {
                bestSubScore = score;
                bestSub = sub;
            }
        }

        if (bestSub) {
            // Update lineup statuses
            worstPlayer.lineup = 'BENCH';
            bestSub.lineup = 'STARTING';
            bestSub.lineupIndex = worstPlayer.lineupIndex;

            this.substitutePlayer(bestSub, worstPlayer.id, true);
            this.traceLog.push(`AI DEĞİŞİKLİK: ${team.name} - ${worstPlayer.lastName} çıktı, ${bestSub.lastName} girdi (yorgunluk: ${Math.round(worstScore)}%)`);
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
        
        const currentMentality = team.tactic.mentality;
        let newMentality = currentMentality;
        let tacticChanged = false;

        // Decision Logic based on score and minute
        if (this.internalMinute >= 70) {
            // Late game adjustments
            if (scoreDiff <= -2) {
                // Losing by 2+ → Ultra Attacking
                newMentality = 'Ultra-Attacking';
            } else if (scoreDiff === -1) {
                // Losing by 1 → Attacking
                newMentality = 'Attacking';
            } else if (scoreDiff >= 2) {
                // Winning by 2+ → Defensive
                newMentality = 'Defensive';
            } else if (scoreDiff === 1) {
                // Winning by 1 → Balanced (protect lead but don't park bus)
                newMentality = 'Balanced';
            }
        } else if (this.internalMinute >= 55) {
            // Mid-late game
            if (scoreDiff <= -2) {
                newMentality = 'Attacking';
            } else if (scoreDiff >= 2) {
                newMentality = 'Balanced'; // Comfortable lead
            }
        } else if (this.internalMinute >= 30) {
            // First half adjustments (more conservative)
            if (scoreDiff <= -2) {
                newMentality = 'Attacking';
            }
        }

        // Only change if different from current
        if (newMentality !== currentMentality) {
            team.tactic.mentality = newMentality;
            tacticChanged = true;

            // Create event for notification
            const mentalityTR: Record<string, string> = {
                'Defensive': 'Defansif',
                'Balanced': 'Dengeli',
                'Attacking': 'Hücum',
                'Ultra-Attacking': 'Topyekün Hücum'
            };

            this.pendingEvents.push({
                minute: this.internalMinute,
                type: MatchEventType.SUB, // Reuse SUB type for tactic (could create new type)
                description: `📋 Taktik: ${mentalityTR[newMentality] || newMentality}`,
                teamId: team.id
            });

            this.traceLog.push(`AI TAKTİK: ${team.name} - ${mentalityTR[newMentality]} moduna geçti (skor: ${scoreDiff > 0 ? '+' : ''}${scoreDiff})`);
        }
    }

    public syncLineups(homePlayers: Player[], awayPlayers: Player[]) {
        // 1. Update lists (keep Bench for subs)
        this.homePlayers = homePlayers.filter(p => p.lineup === 'STARTING' || p.lineup === 'BENCH');
        this.awayPlayers = awayPlayers.filter(p => p.lineup === 'STARTING' || p.lineup === 'BENCH');
        this.allPlayers = [...this.homePlayers, ...this.awayPlayers];

        // 2. Re-initialize tactics/offsets
        this.initializeTactics(this.homePlayers.filter(p => p.lineup === 'STARTING'), this.homeTeam.tactic);
        this.initializeTactics(this.awayPlayers.filter(p => p.lineup === 'STARTING'), this.awayTeam.tactic);

        // 3. Sync Simulation State
        const allStarting = [...this.homePlayers, ...this.awayPlayers].filter(p => p.lineup === 'STARTING');
        const newIds = new Set(allStarting.map(p => p.id));

        // Remove players no longer starting
        Object.keys(this.sim.players).forEach(id => {
            if (!newIds.has(id)) {
                delete this.sim.players[id];
            }
        });

        // Add/Update players
        allStarting.forEach(p => {
            const base = this.baseOffsets[p.id] || { x: 50, y: 50 };
            const isHome = p.teamId === this.homeTeam.id;

            if (!this.sim.players[p.id]) {
                // New player entering pitch
                this.sim.players[p.id] = {
                    x: isHome ? base.x : 100 - base.x,
                    y: isHome ? base.y : 100 - base.y,
                    facing: 0, vx: 0, vy: 0, state: 'IDLE'
                };

                // Init state if missing
                if (!this.playerStates[p.id]) {
                    this.playerStates[p.id] = {
                        currentStamina: p.condition || 100,
                        decisionTimer: Math.random() * 5, possessionCooldown: 0, actionLock: 0,
                        targetX: base.x, targetY: base.y, momentum: 0, isPressing: false
                    };
                }
            }
        });

        this.traceLog.push("KADRO GÜNCELLENDİ: Auto-Fix uygulandı.");
    }

    private resetPositions(mode: SetPieceMode, concedingTeamId?: string) {
        this.sim.ball = { x: 50, y: 50, z: 0, vx: 0, vy: 0, vz: 0, curve: 0, ownerId: null };
        this.currentLooseBallChaserId = null;
        this.lastTouchTeamId = null;

        // Only reset positions for STARTING players (BENCH players aren't on the pitch)
        [...this.homePlayers, ...this.awayPlayers]
            .filter(p => p.lineup === 'STARTING')
            .forEach(p => {
                const isHome = p.teamId === this.homeTeam.id;
                const base = this.baseOffsets[p.id];
                if (!base) return; // Skip if no base offset defined

                let startX = isHome ? base.x : 100 - base.x;
                let startY = isHome ? base.y : 100 - base.y;

                if (mode === 'KICKOFF') {
                    if (isHome) startX = Math.min(startX, 49);
                    else startX = Math.max(startX, 51);
                }
                else if (mode.includes('GOAL_KICK')) {
                    const isHomeKick = mode === 'GOAL_KICK_HOME';
                    const kickingTeam = isHomeKick === isHome;
                    const role = this.playerRoles[p.id];

                    if (kickingTeam) {
                        if (role === Position.GK) { startX = isHome ? 5 : 95; startY = 50; }
                        else if (role === Position.DEF) {
                            startX = isHome ? 12 : 88;
                            startY = startY > 50 ? 80 : 20;
                        }
                        else if (role === Position.MID) { startX = isHome ? 35 : 65; }
                        else if (role === Position.FWD) { startX = isHome ? 60 : 40; }
                    } else {
                        if (role === Position.FWD) { startX = isHome ? 75 : 25; }
                        else if (role === Position.DEF) { startX = isHome ? 45 : 55; }
                    }
                }
                else if (mode.includes('CORNER')) {
                    const isHomeCorner = mode.startsWith('CORNER_HOME');
                    const isTop = mode.includes('TOP');
                    const attacking = isHomeCorner === isHome;
                    const role = this.playerRoles[p.id];

                    if (attacking) {
                        if (role === Position.GK) { startX = isHome ? 10 : 90; }
                        else if (role === Position.DEF) {
                            if (p.attributes.strength > 75) {
                                startX = isHome ? 92 : 8;
                                startY = 50 + (Math.random() * 20 - 10);
                            } else {
                                startX = isHome ? 60 : 40;
                            }
                        }
                        else {
                            startX = isHome ? 94 : 6;
                            startY = 50 + (Math.random() * 30 - 15);
                        }
                    } else {
                        if (role === Position.GK) { startX = isHome ? 2 : 98; startY = 50; }
                        else {
                            startX = isHome ? 6 : 94;
                            startY = 50 + (Math.random() * 30 - 15);
                        }
                    }
                }

                this.sim.players[p.id] = {
                    x: startX,
                    y: startY,
                    facing: isHome ? 0 : Math.PI,
                    vx: 0, vy: 0, state: 'IDLE'
                };

                if (this.playerStates[p.id]) {
                    this.playerStates[p.id].possessionCooldown = 0;
                    this.playerStates[p.id].actionLock = 0;
                    this.playerStates[p.id].targetX = startX;
                    this.playerStates[p.id].targetY = startY;
                    this.playerStates[p.id].isPressing = false;
                }
            });

        if (mode === 'KICKOFF') {
            let kickoffTeamPlayers = Math.random() > 0.5
                ? this.homePlayers.filter(p => p.lineup === 'STARTING')
                : this.awayPlayers.filter(p => p.lineup === 'STARTING');
            if (concedingTeamId) {
                kickoffTeamPlayers = concedingTeamId === this.homeTeam.id
                    ? this.homePlayers.filter(p => p.lineup === 'STARTING')
                    : this.awayPlayers.filter(p => p.lineup === 'STARTING');
            }

            const kickers = kickoffTeamPlayers.filter(p => this.playerRoles[p.id] === Position.FWD || this.playerRoles[p.id] === Position.MID).slice(0, 2);
            if (kickers.length < 2 && kickoffTeamPlayers.length > 0) kickers.push(kickoffTeamPlayers[0]);

            const k1 = kickers[0];
            const k2 = kickers[1];
            const isHomeKick = k1.teamId === this.homeTeam.id;

            this.sim.players[k1.id].x = 50;
            this.sim.players[k1.id].y = 50;
            this.sim.ball.ownerId = k1.id;
            this.sim.players[k1.id].facing = isHomeKick ? 0 : Math.PI;

            this.sim.players[k2.id].x = 50 + (isHomeKick ? -0.5 : 0.5);
            this.sim.players[k2.id].y = 53;
            this.sim.players[k2.id].facing = isHomeKick ? 0 : Math.PI;

            const enemyPlayers = (isHomeKick ? this.awayPlayers : this.homePlayers).filter(p => p.lineup === 'STARTING');
            enemyPlayers.forEach(ep => {
                if (this.sim.players[ep.id] && dist(50, 50, this.sim.players[ep.id].x, this.sim.players[ep.id].y) < 10) {
                    this.sim.players[ep.id].x = isHomeKick ? 62 : 38;
                }
            });

        } else if (mode.includes('GOAL_KICK')) {
            const isHome = mode === 'GOAL_KICK_HOME';
            const team = (isHome ? this.homePlayers : this.awayPlayers).filter(p => p.lineup === 'STARTING');
            const gk = team.find(p => this.playerRoles[p.id] === Position.GK);
            if (gk && this.sim.players[gk.id]) {
                this.sim.players[gk.id].x = isHome ? 5 : 95;
                this.sim.players[gk.id].y = 50;
                this.sim.ball.ownerId = gk.id;
                this.sim.ball.x = isHome ? 5 : 95;
                this.sim.ball.y = 50;
            }
        } else if (mode.includes('CORNER')) {
            const isHome = mode.startsWith('CORNER_HOME');
            const isTop = mode.includes('TOP');
            const team = (isHome ? this.homePlayers : this.awayPlayers).filter(p => p.lineup === 'STARTING');
            const taker = team.sort((a, b) => (b.attributes.passing + b.attributes.vision) - (a.attributes.passing + a.attributes.vision))[0];

            const cX = isHome ? 100 : 0;
            const cY = isTop ? 0 : 100;

            if (taker && this.sim.players[taker.id]) {
                this.sim.players[taker.id].x = cX;
                this.sim.players[taker.id].y = cY;
                this.sim.ball.ownerId = taker.id;
                this.sim.ball.x = cX;
                this.sim.ball.y = cY;
                this.sim.players[taker.id].facing = Math.atan2(50 - cY, (isHome ? 90 : 10) - cX);
                this.playerStates[taker.id].actionLock = 5;
            }
        }
    }

    private updateTeamMentality() {
        const time = this.internalMinute;
        const diff = this.match.homeScore - this.match.awayScore;

        const update = (teamDiff: number): TeamMentality => {
            if (time > 80 && teamDiff > 0) return TeamMentality.PARK_THE_BUS;
            if (time > 75 && teamDiff < 0) return TeamMentality.ALL_OUT_ATTACK;
            if (teamDiff > 1) return TeamMentality.DEFENSIVE;
            if (teamDiff < -1) return TeamMentality.ATTACKING;
            return TeamMentality.BALANCED;
        };

        this.homeMentality = update(diff);
        this.awayMentality = update(-diff);
        this.sim.homeMentality = this.homeMentality;
        this.sim.awayMentality = this.awayMentality;
    }

    public step() {
        this.traceLog = [];
        this.tickCount++;
        let event: MatchEvent | null = null;

        if (this.tickCount >= TICKS_PER_MINUTE) {
            this.internalMinute++;
            this.tickCount = 0;
            this.updateTeamMentality();

            // AI substitution check every 5 minutes for non-user teams
            if (this.internalMinute >= 40 && this.internalMinute % 5 === 0) {
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
        }

        this.clearExpiredSignals();
        this.updateBallPhysics();

        const ballOwner = this.sim.ball.ownerId ? this.getPlayer(this.sim.ball.ownerId) : null;
        const owningTeamId = ballOwner ? ballOwner.teamId : null;

        // Possession Tracking
        if (owningTeamId) {
            if (owningTeamId === this.homeTeam.id) this.possessionTicks.home++;
            else this.possessionTicks.away++;

            const total = this.possessionTicks.home + this.possessionTicks.away;
            if (total > 0) {
                this.match.stats.homePossession = Math.round((this.possessionTicks.home / total) * 100);
                this.match.stats.awayPossession = 100 - this.match.stats.homePossession;
            }
        }

        if (ballOwner) {
            this.lastTouchTeamId = ballOwner.teamId;
        }

        const homeDefLine = this.calculateDefensiveLine(true);
        const awayDefLine = this.calculateDefensiveLine(false);

        // SAFETY: Only process STARTING players who are actually on the pitch
        const allPlayers = this.allPlayers.filter(p => p.lineup === 'STARTING');

        if (!ballOwner) {
            let bestChaserId: string | null = null;
            let minScore = 9999;

            allPlayers.forEach(p => {
                if (!this.sim.players[p.id]) return;
                const state = this.playerStates[p.id];
                if (state.possessionCooldown > 0) return;

                // Tired players react slower to loose balls
                let staminaPenalty = 0;
                if (state.currentStamina < 40) staminaPenalty = 5.0;

                const d = dist(this.sim.players[p.id].x, this.sim.players[p.id].y, this.sim.ball.x, this.sim.ball.y);
                let effectiveDist = d + staminaPenalty;
                if (p.id === this.currentLooseBallChaserId) effectiveDist -= 3.0;

                if (effectiveDist < minScore) {
                    minScore = effectiveDist;
                    bestChaserId = p.id;
                }
            });
            this.currentLooseBallChaserId = bestChaserId;
        } else {
            this.currentLooseBallChaserId = null;
        }

        allPlayers.forEach(p => {
            // SAFETY: Auto-initialize player if missing from simulation (fixes freeze bug)
            if (!this.sim.players[p.id]) {
                const isHome = p.teamId === this.homeTeam.id;
                const base = this.baseOffsets[p.id] || { x: 50, y: 50 };
                this.sim.players[p.id] = {
                    x: isHome ? base.x : 100 - base.x,
                    y: isHome ? base.y : 100 - base.y,
                    facing: 0, vx: 0, vy: 0, state: 'IDLE'
                };
            }
            if (!this.playerStates[p.id]) {
                const base = this.baseOffsets[p.id] || { x: 50, y: 50 };
                this.playerStates[p.id] = {
                    currentStamina: p.condition || 100,
                    decisionTimer: Math.random() * 5, possessionCooldown: 0, actionLock: 0,
                    targetX: base.x, targetY: base.y, momentum: 0, isPressing: false
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
                this.updateBallCarrierAI(p, isHome, isHome ? awayDefLine : homeDefLine, isHome ? 100 : 0);
                this.sim.players[p.id].state = 'RUN';
                state.isPressing = false;
            } else {
                if (!ballOwner && p.id === this.currentLooseBallChaserId) {
                    const interceptX = this.sim.ball.x + (this.sim.ball.vx * 2);
                    const interceptY = this.sim.ball.y + (this.sim.ball.vy * 2);
                    this.applySteeringBehavior(p, interceptX, interceptY, MAX_PLAYER_SPEED); // Removed 1.15x - was causing light speed bug!
                    this.sim.players[p.id].state = 'SPRINT';
                    state.isPressing = true;
                }
                else if (this.playerRoles[p.id] === Position.GK) {
                    this.updateGoalkeeperAI(p, isHome);
                } else {
                    this.updateOffBallAI(p, isHome, owningTeamId === p.teamId, owningTeamId !== null, isHome ? awayDefLine : homeDefLine, isHome ? 100 : 0);
                }
            }
        });

        this.resolveCollisions();
        event = this.checkGameEvents();

        // Collect all pending events (subs, etc.) and clear
        const allEvents = [...this.pendingEvents];
        if (event) allEvents.push(event);
        this.pendingEvents = [];

        // Export Stamina State for UI
        const simulationStateWithStamina = JSON.parse(JSON.stringify(this.sim));
        Object.keys(this.playerStates).forEach(id => {
            if (simulationStateWithStamina.players[id]) {
                simulationStateWithStamina.players[id].stamina = this.playerStates[id].currentStamina;
            }
        });

        return {
            minuteIncrement: this.tickCount === 0,
            event: allEvents.length > 0 ? allEvents[0] : null, // Primary event (goal takes priority)
            additionalEvents: allEvents.length > 1 ? allEvents.slice(1) : [], // Other events (subs)
            trace: this.traceLog,
            liveData: {
                ballHolderId: this.sim.ball.ownerId,
                pitchZone: this.sim.ball.x,
                lastActionText: this.getActionText(owningTeamId),
                simulation: simulationStateWithStamina
            },
            stats: { ...this.match.stats }
        };
    }

    private calculateDefensiveLine(isHome: boolean): number {
        const teamPlayers = isHome ? this.homePlayers : this.awayPlayers;
        const playerPositionsX = teamPlayers
            .filter(p => this.sim.players[p.id])
            .map(p => this.sim.players[p.id].x);

        if (playerPositionsX.length < 2) {
            return isHome ? 10 : 90;
        }

        if (isHome) {
            playerPositionsX.sort((a, b) => a - b);
            return playerPositionsX[1];
        } else {
            playerPositionsX.sort((a, b) => b - a);
            return playerPositionsX[1];
        }
    }

    private updateBallPhysics() {
        if (this.sim.ball.ownerId) return;

        const b = this.sim.ball;
        const friction = (b.z > 0.5) ? BALL_AIR_DRAG : BALL_FRICTION;

        if (b.curve && Math.abs(b.curve) > 0.01 && b.z > 0) {
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            const curveForce = b.curve * speed * 0.005;
            const angle = Math.atan2(b.vy, b.vx);
            b.vx += Math.cos(angle + Math.PI / 2) * curveForce;
            b.vy += Math.sin(angle + Math.PI / 2) * curveForce;
            b.curve *= 0.95;
        }

        b.vx *= friction; b.vy *= friction;
        b.x += b.vx; b.y += b.vy;

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

        if (b.z === 0 && Math.abs(b.vx) < 0.02 && Math.abs(b.vy) < 0.02) { b.vx = 0; b.vy = 0; }
        b.y = clamp(b.y, 0.5, 99.5);

        // ========== GOALKEEPER SAVE MECHANIC ==========
        const ballSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const isShotOnGoal = ballSpeed > 1.5; // Ball moving fast enough to be a shot

        if (isShotOnGoal) {
            // Check if ball is heading towards a goal
            const headingToLeftGoal = b.vx < -0.5 && b.x < 20;
            const headingToRightGoal = b.vx > 0.5 && b.x > 80;

            if (headingToLeftGoal || headingToRightGoal) {
                const defendingTeam = headingToLeftGoal ? this.homePlayers : this.awayPlayers;
                const gk = defendingTeam.find(p => this.playerRoles[p.id] === Position.GK);

                if (gk && this.sim.players[gk.id]) {
                    const gkPos = this.sim.players[gk.id];
                    const distToGK = dist(b.x, b.y, gkPos.x, gkPos.y);

                    // GK can attempt save if ball is within reach
                    // Erişim mesafesi düşürüldü: 4-6 → 2.5-4 birim
                    // TWEAK: Close range nerf - if shot is very close (< 6m), reach is reduced
                    const isCloseRange = distToGK < 6;
                    let gkReachBase = 2.5;
                    if (isCloseRange) gkReachBase = 1.8; // Nerf at close range

                    // --- REALISTIC REFLEXES ---
                    // Reach is affected by Ball Speed vs Goalkeeper Reflexes.
                    // High speed shots reduce effective reach unless GK has high reflexes.
                    const reflexes = (gk.attributes.goalkeeping * 0.7) + (gk.attributes.composure * 0.3);
                    const speedFactor = ballSpeed * 2.5; // E.g., speed 3.0 -> 7.5 difficulty

                    // Reflex capability: Can they react in time?
                    // If speedFactor > reflexes/10, reach is penalized.
                    const reactionDeficit = Math.max(0, speedFactor - (reflexes / 12));
                    const reflexPenalty = reactionDeficit * 0.8; // Penalty to reach

                    const gkReach = Math.max(0.5, gkReachBase + (gk.attributes.goalkeeping / 90) - reflexPenalty);

                    if (distToGK < gkReach && b.z < 2.5) { // Ball is reachable height
                        const gkSkill = gk.attributes.goalkeeping || 50;
                        const gkState = this.playerStates[gk.id];

                        // Save difficulty based on shot speed and distance
                        // TWEAK: Higher penalty for speed at close range
                        const speedPenalty = ballSpeed * (isCloseRange ? 14 : 10);
                        const heightBonus = b.z > 0 ? -10 : 0; // Harder to save high shots
                        const distanceBonus = (gkReach - distToGK) * 5; // Easier if closer (but base reach is lower)

                        // Fatigue affects saves
                        const staminaFactor = gkState?.currentStamina ? (gkState.currentStamina / 100) : 1;

                        // Kurtarış şansı dengelendi (daha düşük)
                        const saveChance = (gkSkill * staminaFactor * 0.65) + distanceBonus + heightBonus - speedPenalty;
                        const saveRoll = Math.random() * 100;

                        if (saveRoll < saveChance) {
                            // SAVE!
                            const catchRoll = Math.random();
                            if (catchRoll < 0.4 && ballSpeed < 3.0) {
                                // Catch the ball
                                this.sim.ball.ownerId = gk.id;
                                this.sim.ball.vx = 0;
                                this.sim.ball.vy = 0;
                                this.sim.ball.vz = 0;
                                this.sim.ball.z = 0;
                                this.lastTouchTeamId = gk.teamId;
                                this.traceLog.push(`${gk.lastName} topu tuttu!`);
                            } else {
                                // Parry/deflect
                                const deflectAngle = Math.atan2(b.vy, b.vx) + (Math.random() - 0.5) * Math.PI;
                                const deflectPower = ballSpeed * 0.4;
                                b.vx = Math.cos(deflectAngle) * deflectPower;
                                b.vy = Math.sin(deflectAngle) * deflectPower;
                                b.vz = Math.random() * 0.5;
                                this.playerStates[gk.id].possessionCooldown = 15;
                                this.lastTouchTeamId = gk.teamId;
                                this.traceLog.push(`${gk.lastName} kurtardı!`);
                            }

                            // Update stats
                            if (headingToLeftGoal) {
                                this.match.stats.homeSaves = (this.match.stats.homeSaves || 0) + 1;
                            } else {
                                this.match.stats.awaySaves = (this.match.stats.awaySaves || 0) + 1;
                            }
                            return; // Exit early, save made
                        }
                    }
                }
            }
        }
        // ========== END GOALKEEPER SAVE MECHANIC ==========

        // Hava topları için yakalama - yükseklik ve mesafe sınırlandı
        const maxPickupHeight = 4.0;  // 15 → 4 (oyuncu zıplama yüksekliği)
        if (b.z < maxPickupHeight) {
            let closestP: Player | null = null;

            // Yakalama mesafesi hesaplama
            const ballSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            // Yavaş toplar daha kolay yakalanır (daha geniş mesafe)
            const speedBonus = Math.max(0, (2.0 - ballSpeed) * 0.5); // Yavaş top → +1.0 mesafe
            const basePickupDist = b.z < 0.5 ? 3.0 : 2.5;  // Yerdeki top için daha geniş
            const heightPenalty = b.z * 0.3;  // Yükseldikçe yakalama zorlaşır
            let minD = Math.max(1.2, basePickupDist + speedBonus - heightPenalty);
            
            // === HAVA TOPU MÜCADELESİ (Korner/Orta) ===
            // Eğer top havada ve birden fazla oyuncu yakınsa, düello yap!
            const nearbyPlayers: {player: Player, dist: number, jumpPower: number}[] = [];
            
            [...this.homePlayers, ...this.awayPlayers].forEach(p => {
                if (!this.playerStates[p.id] || this.playerStates[p.id].possessionCooldown > 0 || !this.sim.players[p.id]) return;
                if (p.lineup !== 'STARTING') return;
                
                const pPos = this.sim.players[p.id];
                const d = dist(pPos.x, pPos.y, b.x, b.y);
                
                // Hava topuna koşma davranışı - top havada ve yakınsa topa koş!
                if (b.z > 1.0 && d < 12 && d > 3) {
                    // Topun düşeceği yere koş
                    const landingX = b.x + b.vx * 5;
                    const landingY = b.y + b.vy * 5;
                    
                    // Sadece kendi bölgesine yakınsa koş (herkes koşmasın)
                    const isInMyZone = Math.abs(pPos.x - landingX) < 20 && Math.abs(pPos.y - landingY) < 20;
                    
                    if (isInMyZone) {
                        const state = this.playerStates[p.id];
                        state.targetX = landingX;
                        state.targetY = landingY;
                    }
                }
                
                if (d < minD + 2) { // Biraz daha geniş alanda rakip kontrolü
                    // Kafa gücü hesapla
                    let jumpPower = (p.attributes.strength || 50) * 0.4 + (p.attributes.positioning || 50) * 0.3;
                    
                    // Hava Hakimi yeteneği
                    if (p.playStyles?.includes("Hava Hakimi") || p.playStyles?.includes("Hava Hakimi+")) {
                        jumpPower += 40;
                    }
                    if (p.playStyles?.includes("Hassas Kafa Vuruşu") || p.playStyles?.includes("Hassas Kafa Vuruşu+")) {
                        jumpPower += 25;
                    }
                    
                    nearbyPlayers.push({player: p, dist: d, jumpPower});
                }
                
                if (d < minD) { minD = d; closestP = p; }
            });
            
            // Eğer 2+ oyuncu varsa ve top yeterince yüksekte, kafa düellosu!
            if (nearbyPlayers.length >= 2 && b.z > 1.5) {
                // En yüksek jump power'a sahip oyuncu kazanır (mesafe de etkili)
                nearbyPlayers.sort((a, b2) => {
                    const scoreA = a.jumpPower - (a.dist * 8);
                    const scoreB = b2.jumpPower - (b2.dist * 8);
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
                if (p.playStyles?.includes("İlk Dokunuş") || p.playStyles?.includes("İlk Dokunuş+")) {
                    technique += 25;
                }
                
                // === YETENEK ETKİSİ: TEKNİK ===
                // "Teknik" yeteneği: Genel top kontrolü %15 artar
                if (p.playStyles?.includes("Teknik") || p.playStyles?.includes("Teknik+")) {
                    technique += 15;
                }
                
                // Hava topları için strength etkisi - güçlü oyuncular daha iyi kafa vuruyor
                let strengthBonus = b.z > 1 ? (p.attributes.strength || 50) * 0.3 : 0;
                
                // === YETENEK ETKİSİ: HAVA HAKİMİ ===
                // "Hava Hakimi" yeteneği: Kafa vuruşları ve hava toplarında %40 bonus
                if (b.z > 0.5 && (p.playStyles?.includes("Hava Hakimi") || p.playStyles?.includes("Hava Hakimi+"))) {
                    strengthBonus += 35;
                }
                
                // === YETENEK ETKİSİ: HASSAS KAFA VURUŞU ===
                // "Hassas Kafa Vuruşu" yeteneği: Hava toplarında isabet %25 bonus
                if (b.z > 0.5 && (p.playStyles?.includes("Hassas Kafa Vuruşu") || p.playStyles?.includes("Hassas Kafa Vuruşu+"))) {
                    strengthBonus += 20;
                }
                
                const heightDifficulty = b.z > 1 ? 25 : 0;
                const difficulty = ballSpeed * 12 + heightDifficulty;

                // Strength hava topu kontrolünü etkiler
                if (Math.random() * 110 + technique + strengthBonus > difficulty) {
                    this.sim.ball.ownerId = p.id;
                    this.sim.ball.vx = 0; this.sim.ball.vy = 0; this.sim.ball.z = 0; this.sim.ball.curve = 0;
                    this.lastTouchTeamId = p.teamId;

                    // Visual Jump Effect
                    if (b.z > 0.5) {
                        this.sim.players[p.id].z = Math.min(b.z, 2.0); // Jump to ball height
                    }
                } else {
                    b.vx *= 0.6; b.vy *= 0.6;
                    this.playerStates[p.id].possessionCooldown = 8;
                    this.lastTouchTeamId = p.teamId;
                }
            }
        }
    }

    private updateGoalkeeperAI(p: Player, isHome: boolean) {
        if (!this.sim.players[p.id]) return;
        const simP = this.sim.players[p.id];
        const goalX = isHome ? 0 : 100;
        const goalY = 50;
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
                    const carrierDistToGoal = isHome ? carrierPos.x : (100 - carrierPos.x);
                    // Kaleciye 25 birimden yakın ve savunmacı yok
                    if (carrierDistToGoal < 25) {
                        // Arada savunmacı var mı kontrol et
                        const myTeam = isHome ? this.homePlayers : this.awayPlayers;
                        const defendersInPath = myTeam.filter(def => {
                            if (def.id === p.id) return false; // Kaleci hariç
                            const defPos = this.sim.players[def.id];
                            if (!defPos) return false;
                            // Savunmacı top taşıyan ile kale arasında mı?
                            const defDistToGoal = isHome ? defPos.x : (100 - defPos.x);
                            return defDistToGoal < carrierDistToGoal && dist(defPos.x, defPos.y, carrierPos.x, carrierPos.y) < 10;
                        });
                        
                        is1v1Situation = defendersInPath.length === 0;
                    }
                }
            }
        }
        
        // === ORTA/CROSS TESPİTİ ===
        // Top kanattan geliyor ve ceza sahasına doğru mu?
        const isCrossIncoming = !isBallLoose && 
            (ballY < 25 || ballY > 75) && // Kanat
            ((isHome && ballX < 35) || (!isHome && ballX > 65)) && // Ceza sahası yakını
            Math.abs(this.sim.ball.vy) > 0.5; // Top içeri doğru hareket ediyor

        // === SAHİPSİZ TOP - ÇIKIŞ ===
        if (isBallLoose && distToBall < 25 && ((isHome && ballX < 30) || (!isHome && ballX > 70))) {
            const ballSpeed = Math.sqrt(this.sim.ball.vx ** 2 + this.sim.ball.vy ** 2);
            if (ballSpeed > 0.5 || distToBall < 10) {
                this.applySteeringBehavior(p, ballX + this.sim.ball.vx * 2, ballY + this.sim.ball.vy * 2, MAX_PLAYER_SPEED);
                simP.state = 'SPRINT';
                return;
            }
        }
        
        // === 1V1 POZİSYON ALMA ===
        if (is1v1Situation && ballCarrierId) {
            const carrierPos = this.sim.players[ballCarrierId];
            if (carrierPos) {
                // Kaleci hücumcuya doğru çıksın, açıyı kapatsın
                const rushDist = Math.min(12, distToBall * 0.4); // Maksimum 12 birim çık
                const angleToCarrier = Math.atan2(carrierPos.y - simP.y, carrierPos.x - simP.x);
                
                let targetX = simP.x + Math.cos(angleToCarrier) * rushDist * 0.3;
                let targetY = simP.y + Math.sin(angleToCarrier) * rushDist * 0.3;
                
                // Çizgiden fazla uzaklaşma
                targetX = isHome ? clamp(targetX, 0, 18) : clamp(targetX, 82, 100);
                
                // "Ortaya Çıkan" yeteneği: Daha agresif çıkış
                if (p.playStyles?.includes("Ortaya Çıkan") || p.playStyles?.includes("Ortaya Çıkan+")) {
                    targetX = isHome ? clamp(targetX, 0, 22) : clamp(targetX, 78, 100);
                }
                
                this.applySteeringBehavior(p, targetX, targetY, MAX_PLAYER_SPEED * 0.85);
                simP.facing = angleToCarrier;
                simP.state = 'RUN';
                return;
            }
        }
        
        // === ORTA POZİSYONU ===
        if (isCrossIncoming && this.sim.ball.z > 0.5) {
            // Topun düşeceği yere doğru hareket et
            const predictedY = ballY + this.sim.ball.vy * 5;
            const predictedX = ballX + this.sim.ball.vx * 5;
            
            // Sadece ceza sahası içinde hareket et
            const maxOutX = isHome ? 8 : 92;
            let targetX = isHome ? Math.min(predictedX, maxOutX) : Math.max(predictedX, maxOutX);
            let targetY = clamp(predictedY, 40, 60); // Kale genişliği içinde kal
            
            // "Uzağa Fırlatma" yeteneği: Cross'lara daha iyi müdahale
            if (p.playStyles?.includes("Uzağa Fırlatma") || p.playStyles?.includes("Uzağa Fırlatma+")) {
                targetX = isHome ? Math.min(predictedX + 2, 12) : Math.max(predictedX - 2, 88);
            }
            
            this.applySteeringBehavior(p, targetX, targetY, MAX_PLAYER_SPEED * 0.8);
            simP.state = 'RUN';
            return;
        }

        // === NORMAL POZİSYON ALMA ===
        const angleToBall = Math.atan2(ballY - goalY, ballX - goalX);
        let idealDistFromLine = 2;
        if (distToBall < 30 && distToBall > 10) idealDistFromLine = 5;
        if (distToBall <= 10) idealDistFromLine = 3;

        const targetX = goalX + (Math.cos(angleToBall) * idealDistFromLine);
        const targetY = goalY + (Math.sin(angleToBall) * idealDistFromLine);
        let clampedX = isHome ? clamp(targetX, 0, 16) : clamp(targetX, 84, 100);

        this.applySteeringBehavior(p, clampedX, targetY, MAX_PLAYER_SPEED * 0.7);
        simP.facing = angleToBall;
        simP.state = 'IDLE';
    }

    private calculateShotOpening(shooterX: number, shooterY: number, goalX: number, isHome: boolean): number {
        const targets = [GOAL_Y_TOP + 1, GOAL_Y_CENTER, GOAL_Y_BOTTOM - 1];
        let clearPaths = 0;
        const enemies = isHome ? this.awayPlayers : this.homePlayers;

        targets.forEach(targetY => {
            let blocked = false;
            for (const e of enemies) {
                if (!this.sim.players[e.id]) continue;
                const ePos = this.sim.players[e.id];

                const dx = goalX - shooterX;
                const dy = targetY - shooterY;
                const lenSq = dx * dx + dy * dy;

                const ex = ePos.x - shooterX;
                const ey = ePos.y - shooterY;

                const dot = (ex * dx + ey * dy) / lenSq;

                if (dot > 0 && dot < 1) {
                    const closestX = shooterX + dot * dx;
                    const closestY = shooterY + dot * dy;
                    const distToLine = dist(ePos.x, ePos.y, closestX, closestY);

                    if (distToLine < 2.0) {
                        blocked = true;
                        break;
                    }
                }
            }
            if (!blocked) clearPaths++;
        });

        return clearPaths / targets.length;
    }

    private updateBallCarrierAI(p: Player, isHome: boolean, offsideLineX: number, goalX: number) {
        if (!this.sim.players[p.id]) return;
        const simP = this.sim.players[p.id];
        const state = this.playerStates[p.id];
        const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;

        const fatigueFactor = Math.max(0.3, state.currentStamina / 100);
        const dribbleSkill = p.attributes.dribbling || 50;
        let closeControl = 1.0 + ((100 - dribbleSkill) / 100);
        if (state.currentStamina < 50) closeControl *= 1.6;

        this.sim.ball.x = simP.x + (Math.cos(simP.facing) * closeControl);
        this.sim.ball.y = simP.y + (Math.sin(simP.facing) * closeControl);

        // --- GOALKEEPER AI (Clearance) ---
        if (this.playerRoles[p.id] === Position.GK) {
            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            // GK prefers safe ground passing if available (high score)
            if (bestPass && bestPass.score > 20) {
                this.actionPass(p, bestPass.player, bestPass.type, bestPass.targetX, bestPass.targetY);
            } else {
                // Clear the ball
                this.sim.ball.ownerId = null;
                const clearAngle = isHome ? 0 : Math.PI;
                const power = 3.5 + Math.random();
                this.sim.ball.vx = Math.cos(clearAngle) * power;
                this.sim.ball.vy = Math.sin(clearAngle) * power;
                this.sim.ball.vz = 2.5;
                this.playerStates[p.id].possessionCooldown = 25;
            }
            return;
        }

        // --- CORNER KICK AI ---
        const isCorner = (isHome ? simP.x > 95 : simP.x < 5) && (simP.y < 5 || simP.y > 95);
        if (isCorner) {
            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            if (bestPass) {
                // Corners are usually Aerial unless short option is great
                const type = bestPass.score > 80 ? 'GROUND' : 'AERIAL';
                this.actionPass(p, bestPass.player, type, bestPass.targetX, bestPass.targetY);
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
        if (p.attributes.strength > 65 && pressure > 0 && state.currentStamina > 30) {
            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            // Strong players can hold longer (extra timer reduction)
            const holdDuration = 15 + (strengthBonus * 10); // 15-25 ticks based on strength
            if ((!bestPass || bestPass.score < 20) && state.decisionTimer < holdDuration) {
                simP.vx *= (0.75 + strengthBonus * 0.1); // Strong players slow down less
                simP.vy *= (0.75 + strengthBonus * 0.1);
                state.decisionTimer -= 0.5;
                isHoldingUp = true;

                // HOLD signal - Tell teammates "I'm holding, find space!"
                if (Math.random() < 0.15) {
                    this.emitTeamSignal(p, 'HOLD');
                }
            }
        }

        let decisionSpeed = 8 - ((p.attributes.decisions || 50) / 25);
        if (tactic.tempo === 'Fast') decisionSpeed *= 0.7; // Faster decisions
        else if (tactic.tempo === 'Slow') decisionSpeed *= 1.4; // Slower decisions

        if (state.currentStamina < 50) decisionSpeed *= 1.8; // Hafifletildi: 2.5 -> 1.8

        state.decisionTimer++;

        if (state.decisionTimer > decisionSpeed) {
            state.decisionTimer = 0;

            const distToGoal = dist(simP.x, simP.y, goalX, 50);

            // 1. EVALUATE SHOOTING
            let shootScore = 0;
            const shotOpenness = this.calculateShotOpening(simP.x, simP.y, goalX, isHome);

            if (distToGoal < SHOOT_RANGE) {
                shootScore = 120 - (distToGoal * 2); // Closer = Better

                // Openness is critical for clean version
                if (shotOpenness > 0.8) shootScore += 300; // Wide open!
                else if (shotOpenness > 0.5) shootScore += 100;
                else if (shotOpenness > 0.3) shootScore += 30; // Semi-blocked but try (NEW)
                else shootScore -= 80; // Heavily blocked (was -100)

                // FINISHING IMPACT - High finishers are more confident shooting!
                // Finishing 50 = +30, 70 = +54, 85 = +72, 100 = +90
                shootScore += (p.attributes.finishing * 1.2) - 30;

                // FORWARD BONUS - Forwards should shoot more!
                if (this.playerRoles[p.id] === Position.FWD) {
                    shootScore += 50; // Significant forward bonus
                }

                // Angle penalty
                const angle = Math.abs(Math.atan2(50 - simP.y, goalX - simP.x));
                if (angle > 1.0) shootScore -= 120; // Bad angle (was -150)

                if (p.attributes.decisions < 10) shootScore += 20; // Bad decision maker shoots more randomly

                // Tactic: Shoot On Sight
                if (distToGoal < 25 && p.playStyles?.includes("Uzaktan Şut")) shootScore += 40;
            }

            // 2. EVALUATE PASSING
            let passScore = 0;
            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            if (bestPass) {
                passScore = bestPass.score;
                // Bonus if "Playmaker" class
                if (this.playerRoles[p.id] === Position.MID) passScore += 10;
            }

            // 3. EVALUATE DRIBBLING
            let dribbleScore = 30; // Base bias

            // Check space ahead
            const forwardAngle = isHome ? 0 : Math.PI;
            const checkDist = 10;
            const checkX = simP.x + Math.cos(forwardAngle) * checkDist;
            const checkY = simP.y + Math.sin(forwardAngle) * checkDist;
            const spaceObstacles = this.detectObstacles(p, checkX, checkY);

            if (spaceObstacles.length === 0) dribbleScore += 50; // Open space!
            else dribbleScore -= (spaceObstacles.length * 25); // Reduced penalty (was 30)

            // IMPROVED DRIBBLING IMPACT - Linear scaling from 60+
            // 60 dribble = +0, 70 = +15, 80 = +30, 85 = +37.5, 100 = +60
            if (p.attributes.dribbling > 60) {
                dribbleScore += ((p.attributes.dribbling - 60) * 1.5);
            }
            if (pressure > 0) dribbleScore -= (pressure * 15);

            // POSITION-AWARE BEHAVIOR - Act based on WHERE you are, not WHAT you are!
            // If any player is in the attacking third, act like a forward
            const isInAttackingThird = isHome ? (simP.x > 70) : (simP.x < 30);
            const isInShootingZone = distToGoal < 30;

            if (isInAttackingThird || isInShootingZone) {
                // I'm high up the pitch - be aggressive like a forward!
                dribbleScore += 35; // Don't just pass back!
                if (isInShootingZone) {
                    shootScore += 30; // Try to shoot if close
                }

                // Don't immediately pass back after receiving
                if (state.possessionCooldown > 8) {
                    passScore -= 40; // Just got the ball - hold it!
                }
            }

            // FORWARD AGGRESSION - Forwards dribble into box more!
            if (this.playerRoles[p.id] === Position.FWD && distToGoal < 35) {
                dribbleScore += 25; // Extra dribble aggression near goal
            }

            // SINGLE FORWARD FIX - If I'm the only forward, hold ball more!
            if (this.playerRoles[p.id] === Position.FWD) {
                const teamForwards = (isHome ? this.homePlayers : this.awayPlayers)
                    .filter(tp => this.playerRoles[tp.id] === Position.FWD && tp.lineup === 'STARTING');

                if (teamForwards.length === 1) {
                    dribbleScore += 40;
                    passScore -= 25;
                    if (state.possessionCooldown > 8) {
                        passScore -= 30;
                    }
                }
            }

            if (p.playStyles.includes("Bencil")) {
                passScore -= 30;
                shootScore += 20;
                dribbleScore += 20;
            }

            // --- EXECUTE DECISION ---
            // Hierarchy:
            // 1. Clear Goal Chance (Shoot) - PRIORITY!
            // 2. 1v1 with Keeper (Shoot)
            // 3. Great Through Ball (Pass)
            // 4. Dribble to Space
            // 5. Safe Pass

            let decision = 'DRIBBLE';

            // 1v1 DETECTION - If close and open, ALWAYS shoot!
            const is1v1 = distToGoal < 18 && shotOpenness > 0.4; // More lenient 1v1 detection

            // FORWARD SPECULATIVE SHOT - Forwards try their luck more!
            const isForward = this.playerRoles[p.id] === Position.FWD;
            const isMidfielder = this.playerRoles[p.id] === Position.MID;
            const speculativeShot = isForward && distToGoal < 25 && shotOpenness > 0.3 && Math.random() < 0.25; // 25% chance
            
            // === ORTA SAHA UZAK ŞUT ===
            // Orta sahalar da uzaktan şut atabilir! Özellikle "Uzaktan Şut" yeteneği varsa
            const hasLongShot = p.playStyles?.includes("Uzaktan Şut") || p.playStyles?.includes("Uzaktan Şut+");
            const longShotAttr = p.attributes.longShots || 50;
            // Uzaktan şut şansı: Long shot attr + açıklık + mesafe
            const longShotChance = isMidfielder && distToGoal < 35 && distToGoal > 18 && shotOpenness > 0.35
                ? (0.08 + (longShotAttr - 50) / 500 + (hasLongShot ? 0.15 : 0)) // Base 8% + skill bonus
                : 0;
            const midfielderLongShot = Math.random() < longShotChance;

            if (shootScore > 200 || is1v1) decision = 'SHOOT'; // Lowered from 280 for more shots
            else if (shootScore > 120 && distToGoal < 25) decision = 'SHOOT'; // Lowered from 150, expanded range
            else if (speculativeShot) decision = 'SHOOT'; // Speculative forward shot!
            else if (midfielderLongShot) decision = 'SHOOT'; // Orta saha uzak şutu!
            else if (bestPass && bestPass.type === 'THROUGH' && bestPass.score > 180) decision = 'PASS';
            else if (passScore > dribbleScore + 40) decision = 'PASS';
            else if (dribbleScore > 0) decision = 'DRIBBLE';
            else decision = 'PASS'; // Fallback

            // Random variation for realism (but not if 1v1!)
            if (!is1v1 && Math.random() < 0.1) decision = 'DRIBBLE';

            // Ball carrier POINT signal - Tell teammate to run into space!
            if (decision === 'PASS' && bestPass && bestPass.type === 'THROUGH') {
                // Signal the target to keep running!
                if (Math.random() < 0.3) {
                    this.emitTeamSignal(p, 'POINT', bestPass.player.id);
                }
            }

            if (decision === 'SHOOT') {
                this.actionShoot(p, isHome);
                return;
            } else if (decision === 'PASS' && bestPass) {
                this.actionPass(p, bestPass.player, bestPass.type, bestPass.targetX, bestPass.targetY);
                return;
            }
        }

        // --- DRIBBLE EXECUTION ---
        let targetX = goalX;
        let targetY = 50;

        // CORNER / GOAL LINE AVOIDANCE (Aut Çizgisi Koruması)
        // If near end of pitch, steer back in!
        const distToGoalX = Math.abs(simP.x - goalX);
        const isNearEndLine = isHome ? (simP.x > 94) : (simP.x < 6); // Stricter (92->94) to allow getting deep
        const isNearSideLine = simP.y < 4 || simP.y > 96;

        if (isNearEndLine) {
            // CROSSING ZONE MECHANIC: If deep, try to find angle for cross
            targetX = goalX;
            targetY = lerp(simP.y, 50, 0.9); // Turn HARD to center
            this.sim.players[p.id].vx *= 0.7; // Slow down to turn
            this.sim.players[p.id].vy *= 0.7;
        } else if (isNearSideLine) {
            targetY = 50;
            targetX = goalX;
        } else {
            // Normal evasion logic
            const nearestEnemy = this.findNearestEnemyInCone(p, isHome);
            if (nearestEnemy) {
                const enemyY = this.sim.players[nearestEnemy.id].y;
                let deviation = (simP.y > enemyY) ? 15 : -15;
                if (simP.y < 10 && deviation < 0) deviation = 20;
                if (simP.y > 90 && deviation > 0) deviation = -20;
                targetY = simP.y + deviation;
                targetX = isHome ? simP.x + 10 : simP.x - 10;
            } else {
                targetX = goalX;
                if (Math.abs(simP.y - 50) > 30) targetY = lerp(simP.y, 50, 0.15);
                else targetY = simP.y;
            }
        }

        this.applySteeringBehavior(p, targetX, targetY, MAX_PLAYER_SPEED * 0.95);
    }

    private findBestPassOption(p: Player, isHome: boolean, offsideLineX: number, goalX: number): { player: Player, score: number, type: 'GROUND' | 'THROUGH' | 'AERIAL', targetX: number, targetY: number } | null {
        let bestTarget: Player | null = null;
        let maxScore = -9999;
        let bestType: 'GROUND' | 'THROUGH' | 'AERIAL' = 'GROUND';
        let bestTx = 0;
        let bestTy = 0;

        const teammates = isHome ? this.homePlayers : this.awayPlayers;
        const simP = this.sim.players[p.id];
        const distToMyGoal = dist(simP.x, simP.y, goalX, 50);
        const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;

        // Don't pass from very close to own goal line if possible (Clearance preferred in outer logic)
        if (distToMyGoal < 7 && this.playerRoles[p.id] !== Position.GK) return null;

        teammates.forEach(tm => {
            if (tm.id === p.id) return;
            if (!this.sim.players[tm.id]) return;
            const simTm = this.sim.players[tm.id];

            const d = dist(simP.x, simP.y, simTm.x, simTm.y);
            const visionStat = p.attributes.vision || 50;
            const visionBonus = p.playStyles?.includes("Uzun Topla Pas") ? 25 : 0;

            if (d > PASS_RANGE_VISION + visionBonus) return;

            // Base Score: Closer to enemy goal is better
            const distToGoal = dist(simTm.x, simTm.y, goalX, 50);
            let score = (120 - distToGoal);
            
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
                if (tm.playStyles?.includes("İlk Dokunuş") || tm.playStyles?.includes("İlk Dokunuş+")) {
                    score += 15; // İlk dokunuş yeteneği telafi eder
                }
            }
            
            // Sprint halindeyken top almak zor
            const tmSpeed = Math.sqrt((simTm.vx || 0) ** 2 + (simTm.vy || 0) ** 2);
            if (tmSpeed > MAX_PLAYER_SPEED * 0.8) {
                score -= 15; // Tam sprint - kontrol zorlaşır
                // "İlk Dokunuş" yeteneği telafi
                if (tm.playStyles?.includes("İlk Dokunuş") || tm.playStyles?.includes("İlk Dokunuş+")) {
                    score += 10;
                }
            }

            // Forward Progress Bonus - INCREASED for more vertical play
            const forwardProgress = isHome ? (simTm.x - simP.x) : (simP.x - simTm.x);
            if (forwardProgress > 0) score += (forwardProgress * 3.0);

            // VISION IMPACT ON PASS DECISION - High vision sees better options!
            // Vision 50 = +0, Vision 70 = +20, Vision 85 = +35, Vision 100 = +50
            if (visionStat > 50) {
                score += ((visionStat - 50) * 1.0); // DOUBLED: Vision bonus to all passes
                // Extra bonus for long forward passes (vision helps see them)
                if (forwardProgress > 20 && d > 25) {
                    score += ((visionStat - 50) * 0.6); // DOUBLED: Extra for long through balls
                }
            }
            
            // === YETENEK: YARATICI ===
            // "Yaratıcı" yeteneği olan pasörler riskli pasları daha iyi görür
            if (p.playStyles?.includes("Yaratıcı") || p.playStyles?.includes("Yaratıcı+")) {
                if (forwardProgress > 15) score += 20;
            }

            // --- SIGNAL SYSTEM INTEGRATION ---
            // If teammate is calling for the ball, prioritize them!
            const tmState = this.playerStates[tm.id];
            if (tmState?.incomingSignal?.type === 'CALL') {
                score += 50; // Significant bonus for calling teammate
            }
            // POINT signal means they want a through/aerial pass to space
            if (tmState?.outgoingSignal?.type === 'POINT') {
                if (forwardProgress > 10) score += 40; // They're pointing to space ahead
            }

            // --- CROSSING LOGIC (KANAT ORTASI) ---
            const isDeep = isHome ? simP.x > 75 : simP.x < 25;
            const isWide = simP.y < 25 || simP.y > 75;

            if (isDeep && isWide) {
                // If I am in Crossing Zone, prioritize players in the box!
                const isTargetCentral = Math.abs(simTm.y - 50) < 20;
                const isTargetDeep = isHome ? simTm.x > 80 : simTm.x < 20;

                if (isTargetCentral && isTargetDeep) {
                    score += 500; // MASSIVE BONUS FOR CROSS TARGET
                }
            }

            // --- 1. ANALYZE PASS TYPES ---

            // A. GROUND PASS (AYAĞA)
            const groundTime = d / 2.5;
            const groundTx = simTm.x + (simTm.vx || 0) * groundTime;
            const groundTy = simTm.y + (simTm.vy || 0) * groundTime;

            // BOUNDS CHECK 1: Ground Pass (Pass to empty space fix)
            if (groundTy < 3 || groundTy > 97 || groundTx < 1 || groundTx > 99) return;

            // B. THROUGH BALL (KOŞU YOLUNA)
            const throughTime = d / 2.0;
            const runDirX = simTm.vx || 0;
            const runDirY = simTm.vy || 0;
            const runSpeed = Math.sqrt(runDirX * runDirX + runDirY * runDirY);

            const isMakingRun = runSpeed > 0.5;
            let throughTx = simTm.x + runDirX * 15;
            let throughTy = simTm.y + runDirY * 15;

            // BOUNDS CHECK 2: Through Ball (Strict)
            if (throughTy < 4 || throughTy > 96) {
                // If aiming out of bounds, penalize heavily
                score -= 200;
            }
            if (throughTx < 0 || throughTx > 100) throughTx = clamp(throughTx, 1, 99);

            // C. AERIAL PASS (HAVADAN) used as fallback or Cross

            // --- 2. CALCULATE INTERCEPTION RISK FOR GROUND ---
            const enemies = isHome ? this.awayPlayers : this.homePlayers;
            let groundRisk = 0;

            enemies.forEach(e => {
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

                if (dist(simE.x, simE.y, px, py) < 2.5) { // Reduced from 3.5 for more realistic passing
                    groundRisk += 100; // Blocked!
                }
            });

            // --- 3. EVALUATE OPTIONS ---

            let currentBestScore = -9999;
            let currentType: 'GROUND' | 'THROUGH' | 'AERIAL' = 'GROUND';
            let finalTx = groundTx;
            let finalTy = groundTy;

            // OPTION 1: GROUND PASS
            let groundScore = score;
            if (groundRisk > 50) groundScore -= 200;

            if (tactic.passingStyle === 'Short') {
                if (d < 15) groundScore += 30;
                else groundScore -= (d - 15);
            }

            if (groundScore > currentBestScore) {
                currentBestScore = groundScore;
                currentType = 'GROUND';
                finalTx = groundTx;
                finalTy = groundTy;
            }

            // OPTION 2: THROUGH BALL
            if (isMakingRun && forwardProgress > 5) {
                const boundsCheck = throughTx > 1 && throughTx < 99 && throughTy > 2 && throughTy < 98;
                const offsideCheck = isHome ? (throughTx < offsideLineX) : (throughTx > offsideLineX);

                if (boundsCheck && offsideCheck) {
                    let throughRisk = 0;
                    enemies.forEach(e => {
                        const simE = this.sim.players[e.id];
                        if (!simE) return; // Fix crash
                        const dx = throughTx - simP.x; const dy = throughTy - simP.y;
                        const l2 = dx * dx + dy * dy;
                        if (l2 === 0) return;
                        const t = ((simE.x - simP.x) * dx + (simE.y - simP.y) * dy) / l2;
                        const px = simP.x + t * dx; const py = simP.y + t * dy;
                        if (dist(simE.x, simE.y, px, py) < 3.0 && t > 0.1 && t < 0.9) throughRisk += 80;
                    });

                    let throughScore = score + 40;
                    if (throughRisk > 50) throughScore -= 200;
                    if (p.attributes.vision > 70) throughScore += 20;

                    if (throughScore > currentBestScore) {
                        currentBestScore = throughScore;
                        currentType = 'THROUGH';
                        finalTx = throughTx;
                        finalTy = throughTy;
                    }
                }
            }

            // OPTION 3: AERIAL / CROSS
            // If Crossing Zone (Deep & Wide), Aerial is often BEST if Ground is risky
            if ((isDeep && isWide) || (groundRisk > 50 && d > 12 && d < 45)) {
                let aerialScore = score - 30; // Native penalty

                if (isDeep && isWide) aerialScore += 100; // CROSSING BONUS
                if (tactic.passingStyle === 'Direct') aerialScore += 20;

                if (aerialScore > currentBestScore) {
                    currentBestScore = aerialScore;
                    currentType = 'AERIAL';
                    finalTx = groundTx;
                    finalTy = groundTy;
                }
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

        return {
            player: bestTarget!,
            score: maxScore,
            type: bestType,
            targetX: bestTx,
            targetY: bestTy
        };
    }

    private detectObstacles(p: Player, x: number, y: number): Player[] {
        const obstacles: Player[] = [];
        const searchDist = 6;
        this.allPlayers
            .filter(other => other.lineup === 'STARTING')
            .forEach(other => {
                if (other.id === p.id || other.teamId === p.teamId) return;
                const otherPos = this.sim.players[other.id];
                if (!otherPos) return;
                const d = dist(x, y, otherPos.x, otherPos.y);
                if (d < searchDist) obstacles.push(other);
            });
        return obstacles;
    }

    private findNearestEnemyInCone(p: Player, isHome: boolean): Player | null {
        let nearest: Player | null = null;
        let minD = 10;
        const simP = this.sim.players[p.id];
        const forwardAngle = isHome ? 0 : Math.PI;
        this.allPlayers
            .filter(other => other.lineup === 'STARTING')
            .forEach(other => {
                if (other.teamId === p.teamId) return;
                const otherPos = this.sim.players[other.id];
                if (!otherPos) return;
                const d = dist(simP.x, simP.y, otherPos.x, otherPos.y);
                if (d < minD) {
                    const angleTo = Math.atan2(otherPos.y - simP.y, otherPos.x - simP.x);
                    let diff = Math.abs(forwardAngle - angleTo);
                    if (diff > Math.PI) diff = (2 * Math.PI) - diff;
                    if (diff < Math.PI / 3.5) { minD = d; nearest = other; }
                }
            });
        return nearest;
    }

    private updateOffBallAI(p: Player, isHome: boolean, teamHasBall: boolean, ballInPlay: boolean, offsideLineX: number, goalX: number) {
        if (!this.sim.players[p.id]) return;

        const simP = this.sim.players[p.id];
        const role = this.playerRoles[p.id];
        const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;
        const ballX = this.sim.ball.x;
        const ballY = this.sim.ball.y;
        let speedMod = MAX_PLAYER_SPEED * 0.6;
        let targetX, targetY;
        const base = this.baseOffsets[p.id];

        // FIX: Substitution Crash - baseOffsets might not be ready
        if (!base) return;

        const baseY = isHome ? base.y : 100 - base.y;
        const baseX = isHome ? base.x : 100 - base.x;

        if (role === Position.FWD) {
            const offsideBuffer = 1.0;
            const isOnside = isHome ? (simP.x < offsideLineX - offsideBuffer) : (simP.x > offsideLineX + offsideBuffer);

            if (!isOnside) {
                // Return to onsite
                this.playerStates[p.id].isPressing = false;
                targetX = isHome ? offsideLineX - 2.5 : offsideLineX + 2.5;
                targetY = lerp(simP.y, baseY, 0.2); // Drift to formation Y
                speedMod = MAX_PLAYER_SPEED * 0.85;
                simP.state = 'RUN';
            } else if (teamHasBall) {
                // --- ATTACKING PATTERNS (Hücum Setleri) ---
                const ballCarrierId = this.sim.ball.ownerId;
                const isBehindBall = isHome ? (simP.x < ballX) : (simP.x > ballX);
                const distToBall = dist(simP.x, simP.y, ballX, ballY);

                if (isBehindBall) {
                    // Ball is ahead -> Support or Run
                    // Determine Run Type based on Ball Position
                    const isBallWide = ballY < 25 || ballY > 75;
                    const isBallDeep = isHome ? ballX > 65 : ballX < 35;

                    if (isBallWide && isBallDeep) {
                        // --- CROSSING SCENARIO (Orta Pozisyonu) ---
                        // Forwards should split: Near Post vs Far Post
                        const myIndex = p.lineupIndex || 0; // 0 or 1 usually for 2 strikers
                        const isNearPostRunner = (myIndex % 2 === 0);

                        // Logic: If I am closer to near post relative to my partner, I take near post
                        const nearPostY = ballY < 50 ? 53 : 47; // Corner of box ish
                        const farPostY = ballY < 50 ? 60 : 40;  // Further out

                        let runY = isNearPostRunner ? (ballY < 50 ? 40 : 60) : (ballY < 50 ? 65 : 35);

                        // Overwrite based on actual position logic if needed, but static assignment is cleaner for 'Clean Version'
                        // Center Forward Logic:
                        targetX = isHome ? 95 : 5; // Goal mouth
                        targetY = runY;
                        speedMod = MAX_PLAYER_SPEED * 0.95;
                        simP.state = 'SPRINT';

                        // POINT signal - Indicate "cross it here!"
                        const pointChance = 0.08 + (p.attributes.positioning / 500);
                        if (Math.random() < pointChance) {
                            this.emitTeamSignal(p, 'POINT'); // Point to crossing zone
                        }
                    } else {
                        // --- CENTRAL BUILD UP ---
                        // Make runs into channels (between defenders)
                        // POSITIONING IMPACT - High positioning = smarter runs
                        const positioningBonus = (p.attributes.positioning || 50) / 100; // 0.5 - 1.0
                        const channelY = simP.y < 50 ? (35 - positioningBonus * 10) : (65 + positioningBonus * 10);
                        // Better positioning = more aggressive line breaking
                        const runDepth = 5 + (positioningBonus * 5); // 5-10 based on positioning
                        targetX = isHome ? offsideLineX + runDepth : offsideLineX - runDepth;
                        targetY = channelY;
                        speedMod = MAX_PLAYER_SPEED * (0.85 + positioningBonus * 0.1); // 0.85-0.95
                        simP.state = 'RUN';

                        // IMPROVED SIGNAL FREQUENCY - Based on vision & leadership
                        const signalChance = 0.03 + (p.attributes.vision / 400) + (p.attributes.leadership / 800);
                        if (Math.random() < signalChance) {
                            this.emitTeamSignal(p, 'CALL');
                        }
                    }
                } else {
                    // Ahead of ball -> Hold line or Show feet
                    const showFeet = distToBall < 30 && (p.attributes.vision > 60);

                    if (showFeet && Math.random() > 0.7) {
                        // Drop deep to receive
                        targetX = isHome ? ballX + 10 : ballX - 10;
                        targetY = lerp(simP.y, ballY, 0.4);
                        speedMod = MAX_PLAYER_SPEED * 0.8;
                    } else {
                        // Stay on shoulder of defender
                        targetX = isHome ? offsideLineX - offsideBuffer : offsideLineX + offsideBuffer;
                        targetY = baseY;
                    }
                    simP.state = 'RUN';
                }

                // Loose Ball / Through Ball Chase overrides everything
                const ballVel = Math.sqrt((this.sim.ball.vx || 0) ** 2 + (this.sim.ball.vy || 0) ** 2);
                const ballMovingToGoal = isHome ? (this.sim.ball.vx > 0.8) : (this.sim.ball.vx < -0.8);

                // If ball is fast and moving to goal, CHASE IT
                if (ballVel > 1.2 && ballMovingToGoal) {
                    targetX = this.sim.ball.x + (this.sim.ball.vx * 15);
                    targetY = this.sim.ball.y + (this.sim.ball.vy * 15);
                    speedMod = MAX_PLAYER_SPEED * 1.05;
                    simP.state = 'SPRINT';
                }
            } else {
                // Defensive Shape - IMPROVED FORWARD DEFENSIVE SUPPORT
                this.playerStates[p.id].isPressing = false;

                // Check if ball is deep in our own half
                const isBallDeepInOwnHalf = isHome ? (ballX < 35) : (ballX > 65);
                const distToBallFromForward = dist(simP.x, simP.y, ballX, ballY);

                if (isBallDeepInOwnHalf) {
                    // Drop back to help! Don't be lazy at the halfway line
                    targetX = isHome ? Math.max(40, ballX + 15) : Math.min(60, ballX - 15);
                    targetY = lerp(simP.y, ballY, 0.3); // Drift towards ball's Y
                    speedMod = MAX_PLAYER_SPEED * 0.75; // Jog back, not idle
                    simP.state = 'RUN';
                } else if (distToBallFromForward < 25 && !ballInPlay) {
                    // Ball is loose and nearby - chase it!
                    targetX = ballX;
                    targetY = ballY;
                    speedMod = MAX_PLAYER_SPEED * 0.9;
                    simP.state = 'RUN';
                } else {
                    // Normal defensive position
                    targetX = isHome ? offsideLineX - 2.0 : offsideLineX + 2.0;
                    targetY = lerp(simP.y, baseY, 0.08);
                    speedMod = MAX_PLAYER_SPEED * 0.5;
                    simP.state = 'IDLE';
                }
            }
        } else {
            // DEF / MID / GK (Field Player logic mostly)
            // === CUSTOM POSITION TUTARLILIĞI ===
            // Base offset kullanıcının belirlediği pozisyonu temsil ediyor
            const baseTargetX = isHome ? base.x : (100 - base.x);
            const baseTargetY = isHome ? base.y : (100 - base.y);
            targetX = baseTargetX;
            targetY = baseTargetY;
            
            // Custom pozisyon varsa daha sıkı takip et
            const tactic_local = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;
            const hasCustomPos = tactic_local.customPositions && tactic_local.customPositions[p.id];
            
            // Maksimum kayma mesafesi - aşırı gezinmeyi engelle
            const maxDriftX = hasCustomPos ? 12 : 18;
            const maxDriftY = hasCustomPos ? 10 : 15;

            const widthOffset = tactic.width === 'Wide' ? 1.25 : tactic.width === 'Narrow' ? 0.75 : 1.0;
            targetY = 50 + (targetY - 50) * widthOffset;

            if (teamHasBall) {
                // --- OFFENSIVE SHAPE & SUPPORT PLAY ---
                this.playerStates[p.id].isPressing = false;

                // 1. Maintain Formation Structure
                /* ... Mentality and Line Logic simplified ... */
                const mentality = isHome ? this.homeMentality : this.awayMentality;
                let lineH = isHome ? Math.min(60, ballX - 20) : Math.max(40, ballX + 20);

                if (tactic.defensiveLine === 'High') lineH = isHome ? Math.min(80, ballX - 15) : Math.max(20, ballX + 15);
                else if (tactic.defensiveLine === 'Deep') lineH = isHome ? Math.min(45, ballX - 25) : Math.max(55, ballX + 25);

                targetX = isHome ? Math.max(targetX, lineH) : Math.min(targetX, lineH);

                // 2. Support Drift (Boşa Çıkma)
                const ballCarrierId = this.sim.ball.ownerId;
                const distToBall = dist(simP.x, simP.y, ballX, ballY);

                // Only support if reasonably close (involved in play)
                if (distToBall < 35 && role !== Position.GK) {
                    // Check if I am blocked (Cover Shadow)
                    let isCovered = false;
                    const enemies = isHome ? this.awayPlayers : this.homePlayers;
                    for (const e of enemies) {
                        const simE = this.sim.players[e.id];
                        if (!simE) continue;
                        // Simple line check
                        const dToLine = this.distToSegment(simE.x, simE.y, ballX, ballY, simP.x, simP.y);
                        if (dToLine < 3.0) { isCovered = true; break; }
                    }

                    // HOLD SIGNAL RESPONSE - When ball carrier is holding, actively find space!
                    const myState = this.playerStates[p.id];
                    const carrierIsHolding = myState?.incomingSignal?.type === 'HOLD';

                    if (isCovered || Math.random() < 0.05 || carrierIsHolding) {
                        // DRIFT TO OPEN SPACE (Üçgen Kurma)
                        // Try to find a spot 5-10m away that is NOT covered
                        // Simple heuristic: Move perpendicular to ball-me vector
                        const angleToBall = Math.atan2(ballY - simP.y, ballX - simP.x);
                        // Shift 30 degrees left or right (alternate based on player index)
                        const playerHash = p.id.charCodeAt(0) + (p.id.charCodeAt(p.id.length - 1) || 0);
                        const shiftDir = (playerHash % 2 === 0) ? 0.5 : -0.5;
                        const supportAngle = angleToBall + shiftDir;

                        // More aggressive drift if carrier is holding
                        const supportDist = carrierIsHolding ? 10 : 6; // Azaltıldı: 12/8 -> 10/6
                        targetX += Math.cos(supportAngle) * supportDist;
                        targetY += Math.sin(supportAngle) * supportDist;

                        speedMod = carrierIsHolding ? MAX_PLAYER_SPEED * 0.9 : MAX_PLAYER_SPEED * 0.8;
                    }

                    // IMPROVED SIGNAL FREQUENCY - Based on vision & leadership
                    // Open players with high vision/leadership call for ball more often
                    const signalChance = 0.03 + (p.attributes.vision / 500) + (p.attributes.leadership / 600);
                    if (!isCovered && distToBall < 25 && Math.random() < signalChance) {
                        this.emitTeamSignal(p, 'CALL');
                    }
                } else {
                    // Drifting with play generally - SINIRLI KAYMA
                    const xShift = (ballX - 50) * 0.4; // Azaltıldı: 0.6 -> 0.4
                    targetX += xShift;
                }
                
                // === AŞIRI KAYMA ENGELİ (HÜCUM) ===
                // Oyuncular base pozisyonlarından çok uzaklaşmasın
                const driftX = targetX - baseTargetX;
                const driftY = targetY - baseTargetY;
                if (Math.abs(driftX) > maxDriftX) {
                    targetX = baseTargetX + Math.sign(driftX) * maxDriftX;
                }
                if (Math.abs(driftY) > maxDriftY) {
                    targetY = baseTargetY + Math.sign(driftY) * maxDriftY;
                }

                // Fullback Overlap Logic - sadece çok ileri gitmişse
                if (role === Position.DEF) {
                    const isWide = simP.y < 25 || simP.y > 75;
                    const isBallAdvanced = isHome ? ballX > 55 : ballX < 45; // Daha ileri olmalı
                    if (isWide && isBallAdvanced) {
                        // Overlap run - ama sınırlı
                        const overlapDist = Math.min(15, maxDriftX); // Azaltıldı: 20 -> 15
                        targetX += (isHome ? overlapDist : -overlapDist);
                        targetY = lerp(targetY, (simP.y < 50 ? 8 : 92), 0.25); // Azaltıldı
                        speedMod = MAX_PLAYER_SPEED * 0.85;
                    }
                }

                simP.state = 'RUN';

            } else {
                // --- DEFENSIVE SHAPE (IMPROVED - GOAL-SIDE POSITIONING) ---
                const ballCarrierId = this.sim.ball.ownerId;
                const distToBall = dist(simP.x, simP.y, ballX, ballY);
                const myGoalX = isHome ? 0 : 100;
                
                // === GENİŞLETİLMİŞ TEHLİKE BÖLGESİ ===
                // Sadece ceza sahası değil, orta sahada da aktif ol!
                const distToMyGoal = Math.abs(ballX - myGoalX);
                const isDangerZone = distToMyGoal < 50; // Genişletildi: 40 -> 50 (yarı saha)
                const isCriticalZone = distToMyGoal < 30; // Kritik bölge (ceza sahası yakını)

                // 1. Calculate ideal position based on formation
                // === CUSTOM POSITION KORUNMASI (SAVUNMA) ===
                let idealX = isHome ? base.x : (100 - base.x);
                let idealY = isHome ? base.y : (100 - base.y);
                
                // Custom pozisyon varsa Y ekseninde daha sadık kal
                const hasCustomDefPos = tactic.customPositions && tactic.customPositions[p.id];

                // Apply width setting
                const widthOffset = tactic.width === 'Wide' ? 1.25 : tactic.width === 'Narrow' ? 0.75 : 1.0;
                idealY = 50 + (idealY - 50) * widthOffset;

                // Shift with ball Y position (cover shadow) - DENGELI kayma
                // Top çok uzaktaysa kayma, yakınsa kayabilir
                const distToBallForShadow = dist(simP.x, simP.y, ballX, ballY);
                const ballIsClose = distToBallForShadow < 35;
                
                // Custom pozisyon varsa daha az kay, top uzaksa hiç kayma
                let shadowStrength = hasCustomDefPos ? 0.10 : 0.18;
                if (!ballIsClose) shadowStrength *= 0.3; // Uzak toplar için minimal kayma
                
                // Maksimum kayma mesafesi - pozisyonundan 15 birimden fazla uzaklaşma
                const maxShift = 15;
                const proposedY = lerp(idealY, ballY, shadowStrength);
                const shiftAmount = Math.abs(proposedY - (isHome ? base.y : 100 - base.y));
                
                if (shiftAmount > maxShift) {
                    // Çok fazla kayma - sınırla
                    idealY = (isHome ? base.y : 100 - base.y) + Math.sign(proposedY - (isHome ? base.y : 100 - base.y)) * maxShift;
                } else {
                    idealY = proposedY;
                }

                // 2. Calculate defensive line limit
                let defLineX = isHome ? 25 : 75;
                if (tactic.defensiveLine === 'High') defLineX = isHome ? 35 : 65;
                if (tactic.defensiveLine === 'Deep') defLineX = isHome ? 15 : 85;

                // 3. CRITICAL: GOAL-SIDE POSITIONING
                // Check if ball is BEHIND my ideal position (line is broken!)
                const isBallBehindMe = isHome ? (ballX < idealX) : (ballX > idealX);

                if (isBallBehindMe) {
                    // === AKILLI RECOVERY RUN ===
                    // Topun arkasından koşma! Topun GİDECEĞİ yere koş!
                    
                    // Top hızını hesapla - nereye gidiyor?
                    const ballVelX = this.sim.ball.vx || 0;
                    const ballVelY = this.sim.ball.vy || 0;
                    const ballSpeed = Math.sqrt(ballVelX * ballVelX + ballVelY * ballVelY);
                    
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
                    simP.state = 'SPRINT';
                    this.playerStates[p.id].isPressing = false; // Not pressing, recovering

                } else {
                    // Ball is in front - maintain position but be ready

                    // --- TUCK IN LOGIC (Fullbacks closing in) ---
                    if (role === Position.DEF) {
                        const isWide = Math.abs(targetY - 50) > 20;
                        const isBallCentral = Math.abs(ballY - 50) < 25;

                        if (isWide && isBallCentral && isDangerZone) {
                            // Danger! Tuck in to protect goal
                            targetY = lerp(targetY, 50, 0.6);
                            targetX = lerp(targetX, myGoalX, 0.15);
                        }
                    }
                    
                    // === GELİŞTİRİLMİŞ COVER SHADOW (PAS YOLU KAPATMA) ===
                    // Savunmacı, top taşıyan ile tehlikeli hücumcu arasındaki pas yolunu kapatmalı
                    if (ballCarrierId && (role === Position.DEF || role === Position.MID)) {
                        const ballCarrier = this.getPlayer(ballCarrierId);
                        if (ballCarrier && ballCarrier.teamId !== p.teamId) {
                            // Rakip top taşıyorsa, tehlikeli pas yollarını kapat
                            const enemyTeam = isHome ? this.awayPlayers : this.homePlayers;
                            const dangerousAttackers = enemyTeam.filter(e => {
                                if (!this.sim.players[e.id]) return false;
                                const ePos = this.sim.players[e.id];
                                // Kaleye yakın ve pas alabilecek pozisyondaki hücumcular
                                const isNearGoal = isHome ? ePos.x < 40 : ePos.x > 60;
                                const isForward = this.playerRoles[e.id] === Position.FWD || this.playerRoles[e.id] === Position.MID;
                                return isNearGoal && isForward && e.id !== ballCarrierId;
                            });
                            
                            // En yakın tehlikeli hücumcunun pas yolunu kapat
                            if (dangerousAttackers.length > 0) {
                                let closestThreat: Player | null = null;
                                let minThreatDist = 999;
                                
                                dangerousAttackers.forEach(threat => {
                                    const threatPos = this.sim.players[threat.id];
                                    const distToThreat = dist(simP.x, simP.y, threatPos.x, threatPos.y);
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
                                    const isCoverInMyZone = Math.abs(coverX - idealX) < 15 && Math.abs(coverY - idealY) < 20;
                                    if (isCoverInMyZone) {
                                        targetX = lerp(targetX, coverX, 0.4);
                                        targetY = lerp(targetY, coverY, 0.4);
                                        
                                        // "Sezgili" yeteneği: Pas yolu okuma bonusu
                                        if (p.playStyles?.includes("Sezgili") || p.playStyles?.includes("Sezgili+")) {
                                            targetX = lerp(targetX, coverX, 0.2); // Daha agresif kapatma
                                            targetY = lerp(targetY, coverY, 0.2);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Pressing Logic - GELİŞTİRİLMİŞ
                    let shouldPress = false;
                    
                    // === YENİ: FORVET TAKİBİ ===
                    // Eğer bir forvet bana doğru geliyorsa, ona KAPAN!
                    let closestThreatToMe: Player | null = null;
                    let minThreatToMeDist = 999;
                    
                    if (role === Position.DEF && ballCarrierId) {
                        const ballCarrier = this.getPlayer(ballCarrierId);
                        if (ballCarrier && ballCarrier.teamId !== p.teamId) {
                            const carrierPos = this.sim.players[ballCarrierId];
                            if (carrierPos) {
                                // Forvet bana ne kadar yakın?
                                const distToCarrier = dist(simP.x, simP.y, carrierPos.x, carrierPos.y);
                                
                                // Forvet benim bölgeme mi giriyor?
                                const isCarrierInMyZone = Math.abs(carrierPos.y - simP.y) < 20;
                                
                                // Forvetin hızı ve yönü
                                const carrierVx = carrierPos.vx || 0;
                                const carrierVy = carrierPos.vy || 0;
                                const carrierSpeed = Math.sqrt(carrierVx * carrierVx + carrierVy * carrierVy);
                                
                                // Forvet kaleye mi koşuyor?
                                const isRunningToGoal = isHome ? carrierVx < -0.3 : carrierVx > 0.3;
                                
                                if (distToCarrier < 25 && isCarrierInMyZone) {
                                    closestThreatToMe = ballCarrier;
                                    minThreatToMeDist = distToCarrier;
                                    
                                    // === AKILLI KAPANMA ===
                                    // Forvetin GİDECEĞİ yere git, şu anki yerine değil!
                                    const interceptTime = Math.max(5, distToCarrier / 2);
                                    const futureCarrierX = carrierPos.x + carrierVx * interceptTime;
                                    const futureCarrierY = carrierPos.y + carrierVy * interceptTime;
                                    
                                    // Kendimi kale ile forvetin gideceği yer arasına konumlandır
                                    targetX = lerp(myGoalX, futureCarrierX, 0.85); // Daha çok kale tarafında kal
                                    targetY = lerp(simP.y, futureCarrierY, 0.6);
                                    
                                    // Hızlı kapat!
                                    if (distToCarrier < 15 && isRunningToGoal) {
                                        // Çok yakın ve tehlikeli - direkt tackle mesafesine gir
                                        targetX = futureCarrierX + (isHome ? -2 : 2);
                                        targetY = futureCarrierY;
                                        speedMod = MAX_PLAYER_SPEED;
                                        simP.state = 'SPRINT';
                                        shouldPress = true;
                                    } else if (distToCarrier < 20) {
                                        // Yakın - kontrollü kapat
                                        speedMod = MAX_PLAYER_SPEED * 0.9;
                                        simP.state = 'RUN';
                                    }
                                }
                            }
                        }
                    }
                    
                    // Mevcut pressing mantığı (forvet takibi yoksa)
                    if (!closestThreatToMe && this.isClosestTeammateToBall(p)) {
                        const pressDist = isDangerZone ? 25 : 18;
                        if (distToBall < pressDist) shouldPress = true;
                    }

                    if (shouldPress) {
                        this.playerStates[p.id].isPressing = true;
                        
                        // Forvet takibi varsa ona git, yoksa topa git
                        if (!closestThreatToMe) {
                            const interceptX = ballX + this.sim.ball.vx * 3;
                            const interceptY = ballY + this.sim.ball.vy * 3;
                            targetX = interceptX;
                            targetY = interceptY;
                        }
                        speedMod = MAX_PLAYER_SPEED;
                        simP.state = 'SPRINT';

                        if (distToBall < TACKLE_RANGE_BASE && ballCarrierId) {
                            this.actionTackle(p, this.getPlayer(ballCarrierId)!);
                        }
                    } else if (!closestThreatToMe) {
                        // Forvet takibi yoksa ve pressing de yoksa - normal savunma
                        this.playerStates[p.id].isPressing = false;

                        // Jockey position - face the ball when close
                        if (distToBall < 15) {
                            simP.facing = Math.atan2(ballY - simP.y, ballX - simP.x);
                        }

                        // Stay on defensive line
                        targetX = isHome ? Math.max(idealX, defLineX) : Math.min(idealX, defLineX);
                        targetY = idealY;
                        speedMod = MAX_PLAYER_SPEED * 0.65;
                        simP.state = 'RUN';
                    }
                }
            }
        }

        targetY = clamp(targetY, 2, 98);
        targetX = clamp(targetX, 0, 100);

        this.applySteeringBehavior(p, targetX, targetY, speedMod);
    }

    private isPartnerPressing(p: Player): boolean {
        const myTeamPlayers = p.teamId === this.homeTeam.id ? this.homePlayers : this.awayPlayers;
        return myTeamPlayers.some(tm =>
            tm.id !== p.id &&
            this.playerRoles[tm.id] === Position.DEF &&
            this.playerStates[tm.id]?.isPressing
        );
    }

    private isClosestTeammateToBall(p: Player): boolean {
        const myTeamPlayers = p.teamId === this.homeTeam.id ? this.homePlayers : this.awayPlayers;
        if (!this.sim.players[p.id]) return false;

        const myDist = dist(this.sim.players[p.id].x, this.sim.players[p.id].y, this.sim.ball.x, this.sim.ball.y);
        const myGoalX = p.teamId === this.homeTeam.id ? 0 : 100;
        const distToGoal = Math.abs(this.sim.ball.x - myGoalX);

        let closerCount = 0;
        for (const tm of myTeamPlayers) {
            if (tm.id === p.id) continue;
            if (!this.sim.players[tm.id]) continue;

            const tmX = this.sim.players[tm.id].x;
            const ballX = this.sim.ball.x;
            const isTmBeaten = p.teamId === this.homeTeam.id ? (tmX > ballX + 2) : (tmX < ballX - 2);

            if (isTmBeaten) continue;

            let tmEffectiveDist = dist(tmX, this.sim.players[tm.id].y, ballX, this.sim.ball.y);
            if (this.playerStates[tm.id]?.isPressing) {
                tmEffectiveDist *= 0.7;
            }

            if (tmEffectiveDist < myDist) {
                closerCount++;
            }
        }

        if (closerCount === 0) return true;
        if (distToGoal < 35 && closerCount < 2) return true;

        return false;
    }

    private applySteeringBehavior(p: Player, tx: number, ty: number, maxSpeed: number) {
        const simP = this.sim.players[p.id];
        const state = this.playerStates[p.id];

        const dx = tx - simP.x;
        const dy = ty - simP.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);

        let desiredVx = 0, desiredVy = 0;
        if (distToTarget > 0.5) {
            const speed = (distToTarget < 5) ? maxSpeed * (distToTarget / 5) : maxSpeed;
            desiredVx = (dx / distToTarget) * speed;
            desiredVy = (dy / distToTarget) * speed;
        }

        const separateRadius = 2.0;
        let sepVx = 0, sepVy = 0;
        this.allPlayers.forEach(other => {
            if (other.id !== p.id && this.sim.players[other.id]) {
                const otherPos = this.sim.players[other.id];
                const d = dist(simP.x, simP.y, otherPos.x, otherPos.y);
                if (d < separateRadius && d > 0) {
                    const pushStr = (separateRadius - d) / d;
                    sepVx += (simP.x - otherPos.x) * pushStr * 0.5;
                    sepVy += (simP.y - otherPos.y) * pushStr * 0.5;
                }
            }
        });

        const finalVx = desiredVx + sepVx;
        const finalVy = desiredVy + sepVy;

        const agility = (p.attributes.dribbling + (p.attributes.speed * 0.5)) / 150;
        const inertia = PLAYER_ACCELERATION * agility;

        simP.vx = lerp(simP.vx, finalVx, inertia);
        simP.vy = lerp(simP.vy, finalVy, inertia);

        const currentSpeed = Math.sqrt(simP.vx * simP.vx + simP.vy * simP.vy);

        // --- STAMINA IMPACT ON SPEED ---
        // Relaxed curve: Speed drops significantly only below 40%
        let staminaFactor = 1.0;
        if (state.currentStamina < 40) {
            staminaFactor = 0.6 + (state.currentStamina / 40) * 0.4;
        }
        if (state.currentStamina < 20) staminaFactor = 0.4; // Crawl

        let speedPenalty = 1.0;
        if (p.id === this.sim.ball.ownerId) {
            const driSkill = p.attributes.dribbling || 50;
            speedPenalty = 0.80 + (driSkill / 100) * 0.15;
        }

        // MEANINGFUL SPEED FORMULA - Stats should matter!
        // Formula: 0.75 + speed/250
        let speedBonus = 0.75 + (p.attributes.speed / 250);
        
        // === YETENEK ETKİLERİ: HIZ ===
        // "Seri" yeteneği: Sprint hızı %8 bonus
        if (p.playStyles?.includes("Seri") || p.playStyles?.includes("Seri+")) {
            speedBonus *= 1.08;
        }
        // "Çabuk Adım" yeteneği: İvmelenme bonusu (inertia'da uygulanır, burada küçük hız bonusu)
        if (p.playStyles?.includes("Çabuk Adım") || p.playStyles?.includes("Çabuk Adım+")) {
            speedBonus *= 1.04;
        }
        
        // Cap at 1.20x to prevent light-speed bug (raised from 1.15 for abilities)
        speedBonus = Math.min(speedBonus, 1.20);
        const physicalLimit = Math.min(maxSpeed, MAX_PLAYER_SPEED) * speedBonus * staminaFactor * speedPenalty;

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

        simP.x = clamp(simP.x + simP.vx, 0, 100);
        simP.y = clamp(simP.y + simP.vy, 0, 100);

        // --- FACING LOGIC ---
        // If moving fast, face movement direction.
        // If slow/idle, FACE THE BALL to look at play.
        let targetAngle = simP.facing;

        if (currentSpeed > 0.3) {
            targetAngle = Math.atan2(simP.vy, simP.vx);
        } else {
            // Look at ball
            targetAngle = Math.atan2(this.sim.ball.y - simP.y, this.sim.ball.x - simP.x);
        }

        let angleDiff = targetAngle - simP.facing;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        simP.facing += angleDiff * PLAYER_TURN_SPEED;

        // --- STAMINA DEPLETION LOGIC ---
        const isSprinting = currentSpeed > MAX_PLAYER_SPEED * 0.75;
        const isRunning = currentSpeed > MAX_PLAYER_SPEED * 0.3;
        
        // === STAMINA ATTRIBUTE EFFECT ===
        // Higher stamina attribute = slower stamina drain
        // Scale: 50 stamina = 1.0x drain, 80 stamina = 0.7x drain, 99 stamina = 0.5x drain
        const staminaAttr = p.attributes?.stamina || 60;
        const attrDrainMod = Math.max(0.5, 1.3 - (staminaAttr / 100));
        
        // === YETENEK ETKİSİ: AMANSIZ ===
        // "Amansız" yeteneği: Stamina kaybı %30 daha az
        let staminaDrainMod = attrDrainMod;
        if (p.playStyles?.includes("Amansız") || p.playStyles?.includes("Amansız+")) {
            staminaDrainMod *= 0.7;
        }

        if (isSprinting) {
            // Sprint: Hızlı stamina kaybı - 90 dakikada sürekli sprint %55-65 kayıp
            state.currentStamina = Math.max(0, state.currentStamina - (0.10 * staminaDrainMod));
        } else if (isRunning) {
            // Koşu: Orta hızda stamina kaybı - 90 dakikada sürekli koşu %30-35 kayıp  
            state.currentStamina = Math.max(0, state.currentStamina - (0.035 * staminaDrainMod));
        } else {
            // Yürüyüş/Durma: YAVAŞ toparlanma 
            // Sarıdan (40%) yeşile (70%) dönmek ~5-6 dakika süreli
            // 30 puan fark, 0.008/tick * 60tick/dk * recoveryMod(0.5) = ~0.24/dk -> ~125dk (çok uzun)
            // Daha makul: 0.015 * 0.5 = 0.0075/tick -> ~30 puan için ~66dk beklemek lazım
            // Gerçekçi: toparlanma sadece hafif artış sağlar, tam toparlanma için oyuncu değişikliği lazım
            const recoveryMod = 0.4 + (staminaAttr / 400); // 0.4-0.65 arası
            state.currentStamina = Math.min(100, state.currentStamina + (0.008 * recoveryMod)); // ~2dk'da 1 puan
        }

        // SYNC TO PUBLIC STATE for UI
        simP.stamina = state.currentStamina;
    }

    private resolveCollisions() {
        const players = this.allPlayers;
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const p1 = this.sim.players[players[i].id];
                const p2 = this.sim.players[players[j].id];
                if (!p1 || !p2) continue;
                const dx = p1.x - p2.x; const dy = p1.y - p2.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                const minD = 1.0;

                if (d < minD && d > 0.01) {
                    const overlap = minD - d;
                    const nx = dx / d; const ny = dy / d;
                    p1.x += nx * overlap * 0.5; p1.y += ny * overlap * 0.5;
                    p2.x -= nx * overlap * 0.5; p2.y -= ny * overlap * 0.5;

                    const p1HasBall = (players[i].id === this.sim.ball.ownerId);
                    const p2HasBall = (players[j].id === this.sim.ball.ownerId);

                    if (p1HasBall) {
                        p1.vx *= 0.5; p1.vy *= 0.5;
                        if (this.playerStates[players[i].id]) this.playerStates[players[i].id].actionLock = 8;
                        this.lastTouchTeamId = players[j].teamId;
                    } else {
                        p1.vx *= 0.9; p1.vy *= 0.9;
                    }

                    if (p2HasBall) {
                        p2.vx *= 0.5; p2.vy *= 0.5;
                        if (this.playerStates[players[j].id]) this.playerStates[players[j].id].actionLock = 8;
                        this.lastTouchTeamId = players[i].teamId;
                    } else {
                        p2.vx *= 0.9; p2.vy *= 0.9;
                    }
                }
            }
        }
    }

    private checkGameEvents(): MatchEvent | null {
        const b = this.sim.ball;
        const outLeft = b.x < 0;
        const outRight = b.x > 100;

        if (outLeft || outRight) {
            if (b.y > GOAL_Y_TOP && b.y < GOAL_Y_BOTTOM && b.z < 2.44) {
                if (outLeft) {
                    const scorerId = this.lastShooterId;
                    const scorer = scorerId ? this.getPlayer(scorerId) : null;
                    this.lastShooterId = null;
                    this.resetPositions('KICKOFF', this.homeTeam.id);
                    return { minute: this.internalMinute, type: MatchEventType.GOAL, description: `GOL! ${scorer ? scorer.lastName : this.awayTeam.name}`, teamId: this.awayTeam.id, playerId: scorerId || undefined };
                }
                if (outRight) {
                    const scorerId = this.lastShooterId;
                    const scorer = scorerId ? this.getPlayer(scorerId) : null;
                    this.lastShooterId = null;
                    this.resetPositions('KICKOFF', this.awayTeam.id);
                    return { minute: this.internalMinute, type: MatchEventType.GOAL, description: `GOL! ${scorer ? scorer.lastName : this.homeTeam.name}`, teamId: this.homeTeam.id, playerId: scorerId || undefined };
                }
            }
            else {
                const isHomeGoalSide = outLeft;
                const lastTouchWasHome = this.lastTouchTeamId === this.homeTeam.id;

                if (isHomeGoalSide) {
                    if (lastTouchWasHome) {
                        const isTop = b.y < 50;
                        this.resetPositions(isTop ? 'CORNER_AWAY_TOP' : 'CORNER_AWAY_BOTTOM');
                        this.traceLog.push("KORNER (Deplasman)");
                    } else {
                        this.resetPositions('GOAL_KICK_HOME');
                        this.traceLog.push(`Aut Atışı (${this.homeTeam.name})`);
                    }
                } else {
                    if (!lastTouchWasHome && this.lastTouchTeamId) {
                        const isTop = b.y < 50;
                        this.resetPositions(isTop ? 'CORNER_HOME_TOP' : 'CORNER_HOME_BOTTOM');
                        this.traceLog.push("KORNER (Ev Sahibi)");
                    } else {
                        this.resetPositions('GOAL_KICK_AWAY');
                        this.traceLog.push(`Aut Atışı (${this.awayTeam.name})`);
                    }
                }
                return null;
            }
        }
        if (b.y < 0 || b.y > 100) { b.vy = -b.vy * 0.5; b.y = clamp(b.y, 0.5, 99.5); }
        return null;
    }

    private getActionText(teamId: string | null): string {
        if (!teamId) return "Sahipsiz Top";
        const teamName = teamId === this.homeTeam.id ? this.homeTeam.name : this.awayTeam.name;
        if (this.sim.ball.x > 35 && this.sim.ball.x < 65) return `${teamName} Oyun Kuruyor`;
        if (this.sim.ball.x < 30) return (teamId === this.homeTeam.id) ? `${teamName} Savunmadan Çıkıyor` : `${teamName} Baskıda`;
        if (this.sim.ball.x > 70) return (teamId === this.homeTeam.id) ? `${teamName} Gol Arıyor` : `${teamName} Savunmada`;
        return `${teamName} Topla Oynuyor`;
    }

    private actionPass(carrier: Player, target: Player, type: 'GROUND' | 'THROUGH' | 'AERIAL', targetOverrideX?: number, targetOverrideY?: number) {
        const cPos = this.sim.players[carrier.id];
        const tPos = this.sim.players[target.id];
        const state = this.playerStates[carrier.id];

        const pasStat = carrier.attributes.passing || 50;
        let tx = targetOverrideX !== undefined ? targetOverrideX : tPos.x;
        let ty = targetOverrideY !== undefined ? targetOverrideY : tPos.y;

        // Only add extra offset if no override provided (old logic fallback)
        if (targetOverrideX === undefined) {
            if (type === 'THROUGH') {
                // AI FIX: True Through Ball targeting - Lead the runner significantly
                tx += tPos.vx * 18;
                ty += tPos.vy * 18;
            } else {
                tx += tPos.vx * 4;
                ty += tPos.vy * 4;
            }
        }

        const dx = tx - cPos.x; const dy = ty - cPos.y;
        const angle = Math.atan2(dy, dx);
        const distToT = Math.sqrt(dx * dx + dy * dy);

        let errorMargin = (100 - pasStat) * 0.005;
        
        // === YETENEK ETKİSİ: KESKİN PAS ===
        // "Keskin Pas" yeteneği: Through ball isabeti %25 artar
        if (type === 'THROUGH' && (carrier.playStyles?.includes("Keskin Pas") || carrier.playStyles?.includes("Keskin Pas+"))) {
            errorMargin *= 0.75;
        }
        
        // === YETENEK ETKİSİ: UZUN TOPLA PAS ===
        // "Uzun Topla Pas" yeteneği: Havadan pas isabeti %30 artar
        if (type === 'AERIAL' && (carrier.playStyles?.includes("Uzun Topla Pas") || carrier.playStyles?.includes("Uzun Topla Pas+"))) {
            errorMargin *= 0.70;
        }
        
        // Fatigue Impact (hafifletildi: x3 -> x2)
        const staminaFactor = state.currentStamina / 100;
        if (staminaFactor < 0.5) errorMargin *= 2;

        const finalAngle = angle + (Math.random() * errorMargin - errorMargin / 2);

        // FIXED AERIAL PASS POWER - Was overshooting targets!
        let power: number;
        if (type === 'AERIAL') {
            // Softer power for lobs - ball should land AT target, not beyond
            power = Math.min(MAX_BALL_SPEED * 0.5, 1.0 + (distToT * 0.025)); // Reduced from 0.75/0.04
        } else {
            power = Math.min(MAX_BALL_SPEED * 0.75, 1.5 + (distToT * 0.04));
        }

        this.sim.ball.ownerId = null;
        this.sim.ball.x = cPos.x + Math.cos(finalAngle) * 1.5;
        this.sim.ball.y = cPos.y + Math.sin(finalAngle) * 1.5;
        this.sim.ball.vx = Math.cos(finalAngle) * power;
        this.sim.ball.vy = Math.sin(finalAngle) * power;

        if (type === 'AERIAL') {
            // Calculated Lob - reduced height for more accurate landing
            const lobHeight = Math.min(2.0, 0.6 + (distToT * 0.025)); // Was 2.5/0.8/0.035
            this.sim.ball.vz = lobHeight;
            this.sim.ball.curve = 0;
            this.traceLog.push(`${carrier.lastName} havadan pas attı!`);
        } else {
            this.sim.ball.vz = 0;
            this.sim.ball.curve = 0;
        }

        this.playerStates[carrier.id].possessionCooldown = 12;
        // SPEED GLITCH FIX: Passer Lockout
        // Prevent passer from immediately chasing their own ball
        this.playerStates[carrier.id].actionLock = 20;

        this.sim.players[carrier.id].state = 'KICK';

        this.lastTouchTeamId = carrier.teamId;

        const typeText = type === 'THROUGH' ? "Ara pası" : (type === 'AERIAL' ? "Havadan pas" : "Pas");
        this.traceLog.push(`${carrier.lastName} ${typeText} denedi.`);
    }

    private actionShoot(p: Player, isHome: boolean) {
        const pos = this.sim.players[p.id];
        const goalX = isHome ? 100 : 0;
        const goalY = 50;
        const fin = p.attributes.finishing || 50;
        const pwr = p.attributes.strength || 70;
        const state = this.playerStates[p.id];

        const distToGoal = dist(pos.x, pos.y, goalX, 50);
        const xGValue = Math.max(0.01, (0.4 - (distToGoal / 100)));

        // Stat Update: Shots
        if (isHome) {
            this.match.stats.homeShots++;
            this.match.stats.homeXG += xGValue;
        } else {
            this.match.stats.awayShots++;
            this.match.stats.awayXG += xGValue;
        }

        const enemyPlayers = isHome ? this.awayPlayers : this.homePlayers;
        const gk = enemyPlayers.find(ep => this.playerRoles[ep.id] === Position.GK);
        let targetY = goalY;

        const confidence = (fin - 50) / 50;
        const cornerBias = Math.max(0.5, confidence);

        if (gk && this.sim.players[gk.id]) {
            const gkY = this.sim.players[gk.id].y;
            if (gkY > 50) targetY = lerp(50, GOAL_Y_TOP + 1, cornerBias);
            else targetY = lerp(50, GOAL_Y_BOTTOM - 1, cornerBias);
        } else {
            targetY = 50;
        }

        const dy = targetY - pos.y;
        const dx = goalX - pos.x;
        const angle = Math.atan2(dy, dx);

        let accuracyPenalty = 0;
        const currentSpeed = Math.sqrt(this.sim.players[p.id].vx ** 2 + this.sim.players[p.id].vy ** 2);

        if (currentSpeed > MAX_PLAYER_SPEED * 0.85) accuracyPenalty = 0.20;
        // Fatigue Impact on shooting accuracy (hafifletildi)
        if (state.currentStamina < 50) accuracyPenalty += 0.15; // Eskiden: <60 = 0.3
        if (state.currentStamina < 25) accuracyPenalty += 0.25; // Eskiden: <30 = 0.5

        let spread = ((100 - fin) * 0.005) + accuracyPenalty;
        let shotSpeed = 2.8 + (pwr / 70);
        
        // === ŞUT YETENEKLERİ ===
        // "Plase Şut" yeteneği: İsabet %25 artar, güç %10 azalır (yerleştirme öncelikli)
        const hasPlacedShot = p.playStyles?.includes("Plase Şut") || p.playStyles?.includes("Plase Şut+");
        if (hasPlacedShot) {
            spread *= 0.75;
            shotSpeed *= 0.92;
        }
        
        // "Kuvvetli Şut" yeteneği: Şut gücü %20 artar, isabet %10 azalır
        const hasPowerShot = p.playStyles?.includes("Kuvvetli Şut") || p.playStyles?.includes("Kuvvetli Şut+");
        if (hasPowerShot) {
            shotSpeed *= 1.20;
            spread *= 1.10;
        }
        
        // "Uzaktan Şut" / "Alçak Sert Şut" yeteneği: Uzak mesafeden isabet bonusu
        const hasLongShot = p.playStyles?.includes("Uzaktan Şut") || p.playStyles?.includes("Alçak Sert Şut");
        if (hasLongShot && distToGoal > 20) {
            spread *= 0.80;
        }
        
        // "Akrobatik" yeteneği: Zor açılardan şut isabeti artar
        const hasAcrobatic = p.playStyles?.includes("Akrobatik") || p.playStyles?.includes("Akrobatik+");
        const shotAngleToGoal = Math.abs(Math.atan2(50 - pos.y, goalX - pos.x));
        if (hasAcrobatic && shotAngleToGoal > 0.8) {
            spread *= 0.70; // Zor açılarda %30 daha isabetli
        }

        const shotAngle = angle + (Math.random() * spread - spread / 2);

        // Target Check
        const finalYAtGoal = pos.y + (goalX - pos.x) * Math.tan(shotAngle);
        const isOnTarget = finalYAtGoal > GOAL_Y_TOP && finalYAtGoal < GOAL_Y_BOTTOM;
        if (isOnTarget) {
            if (isHome) this.match.stats.homeOnTarget++;
            else this.match.stats.awayOnTarget++;
        }

        const enemies = (isHome ? this.awayPlayers : this.homePlayers).filter(e => e.lineup === 'STARTING');
        for (const e of enemies) {
            const ePos = this.sim.players[e.id];
            if (!ePos) continue;
            const d = dist(pos.x, pos.y, ePos.x, ePos.y);
            if (d < 3) {
                const angleToE = Math.atan2(ePos.y - pos.y, ePos.x - pos.x);
                if (Math.abs(angleToE - shotAngle) < 0.5) {
                    if (Math.random() > 0.4) {
                        this.traceLog.push(`${e.lastName} şutu blokladı!`);
                        this.sim.ball.ownerId = null;
                        this.sim.ball.vx = (Math.random() - 0.5) * 2;
                        this.sim.ball.vy = (Math.random() - 0.5) * 2;
                        this.playerStates[p.id].possessionCooldown = 20;
                        this.lastTouchTeamId = e.teamId;
                        return;
                    }
                }
            }
        }

        this.sim.ball.ownerId = null;
        this.sim.ball.vx = Math.cos(shotAngle) * shotSpeed;
        this.sim.ball.vy = Math.sin(shotAngle) * shotSpeed;
        this.sim.ball.vz = 0.2 + (Math.random() * 0.8);

        if (p.playStyles.includes("Plase Şut") || Math.random() > 0.7) {
            const yDiff = pos.y - 50;
            this.sim.ball.curve = yDiff > 0 ? -0.8 : 0.8;
        } else { this.sim.ball.curve = 0; }

        this.playerStates[p.id].possessionCooldown = 15;
        this.sim.players[p.id].state = 'KICK';
        this.lastTouchTeamId = p.teamId;
        this.lastShooterId = p.id;
        this.traceLog.push(`${p.lastName} şut çekti!`);
    }

    private actionTackle(defender: Player, attacker: Player) {
        if (!attacker) return;
        const def = defender.attributes.tackling || 50;
        const dri = attacker.attributes.dribbling || 50;

        const defState = this.playerStates[defender.id];
        const attState = this.playerStates[attacker.id];
        const tactic = defender.teamId === this.homeTeam.id ? this.homeTeam.tactic : this.awayTeam.tactic;

        let effectiveDef = def;
        // Fatigue Impact (hafifletildi: 0.6 -> 0.75)
        if (defState.currentStamina < 50) effectiveDef *= 0.75; // Moderate penalty for tired defenders
        
        // === SAVUNMA YETENEKLERİ ===
        // "Top Kesici" yeteneği: Tackle başarısı %20 artar
        if (defender.playStyles?.includes("Top Kesici") || defender.playStyles?.includes("Top Kesici+")) {
            effectiveDef *= 1.20;
        }
        // "Kayarak Müdahale" yeteneği: Tackle başarısı %15 artar
        if (defender.playStyles?.includes("Kayarak Müdahale") || defender.playStyles?.includes("Kayarak Müdahale+")) {
            effectiveDef *= 1.15;
        }
        // "Güçlü" yeteneği: Fiziksel düellolarda %15 bonus
        if (defender.playStyles?.includes("Güçlü") || defender.playStyles?.includes("Güçlü+")) {
            effectiveDef *= 1.15;
        }
        // "Engel" yeteneği: Blok şansı artırır
        if (defender.playStyles?.includes("Engel") || defender.playStyles?.includes("Engel+")) {
            effectiveDef *= 1.10;
        }

        let effectiveDri = dri;
        if (attState.currentStamina < 50) effectiveDri *= 0.7;
        
        // === HÜCUM YETENEKLERİ ===
        // "Ezber Bozan" yeteneği: Çalım başarısı %25 artar
        if (attacker.playStyles?.includes("Ezber Bozan") || attacker.playStyles?.includes("Ezber Bozan+")) {
            effectiveDri *= 1.25;
        }
        // "Teknik" yeteneği: Çalım başarısı %10 artar
        if (attacker.playStyles?.includes("Teknik") || attacker.playStyles?.includes("Teknik+")) {
            effectiveDri *= 1.10;
        }
        // "Baskıya Dayanıklı" yeteneği: Baskı altında dribbling kaybetmez
        if (attacker.playStyles?.includes("Baskıya Dayanıklı") || attacker.playStyles?.includes("Baskıya Dayanıklı+")) {
            effectiveDri *= 1.12;
        }

        // --- Tactic Impact: Aggression ---
        let riskFactor = 1.0;
        if (tactic.aggression === 'Aggressive') {
            effectiveDef *= 1.25;
            riskFactor = 1.8; // TWEAK: Increased risk when aggressive (was 1.4)
        } else if (tactic.aggression === 'Safe') {
            effectiveDef *= 0.85;
            riskFactor = 0.6; // Stays on feet
        }

        // BALANCED DUEL: Both get fair random multipliers
        const rollD = effectiveDef * (Math.random() + 0.5);  // 0.5 - 1.5 range
        const rollA = effectiveDri * (Math.random() + 0.3);  // 0.3 - 1.3 range (buffed from 0-1)

        if (rollD > rollA) {
            if (Math.random() < 0.4) {
                this.sim.ball.ownerId = null;
                this.sim.ball.vx = (Math.random() - 0.5) * 2;
                this.sim.ball.vy = (Math.random() - 0.5) * 2;
                this.playerStates[attacker.id].possessionCooldown = 20;
                this.playerStates[defender.id].possessionCooldown = 10;
                this.traceLog.push(`${defender.lastName} müdahale etti, top boşta!`);
                this.lastTouchTeamId = defender.teamId;
            } else {
                this.sim.ball.ownerId = defender.id;
                this.playerStates[attacker.id].possessionCooldown = 30;
                this.playerStates[attacker.id].actionLock = 25;
                this.sim.players[defender.id].state = 'TACKLE';
                this.traceLog.push(`${defender.lastName} topu kaptı!`);
                this.lastTouchTeamId = defender.teamId;
            }
        } else {
            this.playerStates[defender.id].actionLock = 40 * riskFactor;
            this.sim.players[defender.id].vx *= (0.1 / riskFactor);
            this.sim.players[defender.id].vy *= (0.1 / riskFactor);
            this.traceLog.push(`${attacker.lastName} rakibini geçti!`);
        }
    }
}
