
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
const dist = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

// --- CONSTANTS ---
export const TICKS_PER_MINUTE = 17; // 2 seconds per minute at 1x speed (120ms per tick)

const MAX_PLAYER_SPEED = 1.7;
const MAX_BALL_SPEED = 4.8;
const BALL_FRICTION = 0.96;
const BALL_AIR_DRAG = 0.98;
const GRAVITY = 0.20;
const PLAYER_ACCELERATION = 0.15;
const PLAYER_TURN_SPEED = 0.25;

// AI Ranges
const SHOOT_RANGE = 30;
const PASS_RANGE_VISION = 50;
const TACKLE_RANGE_BASE = 2.5;
const PRESSING_RANGE = 20;

// Goal Dimensions (for AI aiming)
const GOAL_Y_TOP = 46.3;
const GOAL_Y_BOTTOM = 53.7;
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
    // Players below 70% start losing effectiveness. Below 40% it drops sharply.
    let fatigueMod = 1.0;
    if (currentCondition < 70) {
        fatigueMod = Math.max(0.4, currentCondition / 70);
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

    private sim: SimulationState;
    private traceLog: string[] = [];
    private playerRoles: Record<string, Position> = {};
    private baseOffsets: Record<string, { x: number, y: number }> = {};

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

    constructor(match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[]) {
        this.match = match;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homePlayers = homePlayers.filter(p => p.lineup === 'STARTING');
        this.awayPlayers = awayPlayers.filter(p => p.lineup === 'STARTING');

        this.internalMinute = match.currentMinute;

        this.initializeTactics(this.homePlayers, this.homeTeam.tactic);
        this.initializeTactics(this.awayPlayers, this.awayTeam.tactic);

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

        [...this.homePlayers, ...this.awayPlayers].forEach(p => {
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
        this.initializeTactics(list, newTactic);
    }

    public substitutePlayer(playerIn: Player, playerOutId: string) {
        const isHome = this.homeTeam.id === playerIn.teamId;
        const list = isHome ? this.homePlayers : this.awayPlayers;
        const idx = list.findIndex(p => p.id === playerOutId);

        if (idx !== -1) {
            const oldPos = this.sim.players[playerOutId];
            if (oldPos) delete this.sim.players[playerOutId];

            const base = this.baseOffsets[playerIn.id] || { x: 50, y: 50 };
            this.sim.players[playerIn.id] = oldPos ? { ...oldPos } : { x: base.x, y: base.y, facing: 0, vx: 0, vy: 0 };

            if (!playerIn.personality) {
                playerIn.personality = {
                    riskTaking: (playerIn.attributes.aggression / 100) * 0.6 + Math.random() * 0.4,
                    discipline: (playerIn.attributes.decisions / 100),
                    pressureHandling: (playerIn.attributes.composure / 100)
                };
            }

            this.playerStates[playerIn.id] = {
                currentStamina: playerIn.condition || 100,
                decisionTimer: 0, possessionCooldown: 0, actionLock: 0, targetX: base.x, targetY: base.y, momentum: 0, isPressing: false
            };

            list[idx] = playerIn;
            this.initializeTactics(list, isHome ? this.homeTeam.tactic : this.awayTeam.tactic);
            this.traceLog.push(`OYUNCU DEĞİŞİKLİĞİ: ${playerIn.lastName} oyunda.`);
        }
    }

    private resetPositions(mode: SetPieceMode, concedingTeamId?: string) {
        this.sim.ball = { x: 50, y: 50, z: 0, vx: 0, vy: 0, vz: 0, curve: 0, ownerId: null };
        this.currentLooseBallChaserId = null;
        this.lastTouchTeamId = null;

        [...this.homePlayers, ...this.awayPlayers].forEach(p => {
            const isHome = p.teamId === this.homeTeam.id;
            const base = this.baseOffsets[p.id];

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
            let kickoffTeamPlayers = Math.random() > 0.5 ? this.homePlayers : this.awayPlayers;
            if (concedingTeamId) {
                kickoffTeamPlayers = concedingTeamId === this.homeTeam.id ? this.homePlayers : this.awayPlayers;
            }

            const kickers = kickoffTeamPlayers.filter(p => this.playerRoles[p.id] === Position.FWD || this.playerRoles[p.id] === Position.MID).slice(0, 2);
            if (kickers.length < 2) kickers.push(kickoffTeamPlayers[0]);

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

            const enemyPlayers = isHomeKick ? this.awayPlayers : this.homePlayers;
            enemyPlayers.forEach(ep => {
                if (dist(50, 50, this.sim.players[ep.id].x, this.sim.players[ep.id].y) < 10) {
                    this.sim.players[ep.id].x = isHomeKick ? 62 : 38;
                }
            });

        } else if (mode.includes('GOAL_KICK')) {
            const isHome = mode === 'GOAL_KICK_HOME';
            const team = isHome ? this.homePlayers : this.awayPlayers;
            const gk = team.find(p => this.playerRoles[p.id] === Position.GK);
            if (gk) {
                this.sim.players[gk.id].x = isHome ? 5 : 95;
                this.sim.players[gk.id].y = 50;
                this.sim.ball.ownerId = gk.id;
                this.sim.ball.x = isHome ? 5 : 95;
            }
        } else if (mode.includes('CORNER')) {
            const isHome = mode.startsWith('CORNER_HOME');
            const isTop = mode.includes('TOP');
            const team = isHome ? this.homePlayers : this.awayPlayers;
            const taker = team.sort((a, b) => (b.attributes.passing + b.attributes.vision) - (a.attributes.passing + a.attributes.vision))[0];

            const cX = isHome ? 100 : 0;
            const cY = isTop ? 0 : 100;

            if (taker) {
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

        const allPlayers = [...this.homePlayers, ...this.awayPlayers];

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
            if (!this.sim.players[p.id] || !this.playerStates[p.id]) return;

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
                return;
            }

            if (hasBall) {
                this.updateBallCarrierAI(p, isHome, isHome ? awayDefLine : homeDefLine, isHome ? 100 : 0);
                this.sim.players[p.id].state = 'RUN';
                state.isPressing = false;
            } else {
                if (!ballOwner && p.id === this.currentLooseBallChaserId) {
                    const interceptX = this.sim.ball.x + (this.sim.ball.vx * 2);
                    const interceptY = this.sim.ball.y + (this.sim.ball.vy * 2);
                    this.applySteeringBehavior(p, interceptX, interceptY, MAX_PLAYER_SPEED * 1.15);
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

        // Export Stamina State for UI
        const simulationStateWithStamina = JSON.parse(JSON.stringify(this.sim));
        Object.keys(this.playerStates).forEach(id => {
            if (simulationStateWithStamina.players[id]) {
                simulationStateWithStamina.players[id].stamina = this.playerStates[id].currentStamina;
            }
        });

        return {
            minuteIncrement: this.tickCount === 0,
            event,
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
                b.z = 0; b.vz = -b.vz * 0.6;
                if (Math.abs(b.vz) < 0.5) b.vz = 0;
                b.vx *= 0.8; b.vy *= 0.8;
            }
        }

        if (b.z === 0 && Math.abs(b.vx) < 0.02 && Math.abs(b.vy) < 0.02) { b.vx = 0; b.vy = 0; }
        b.y = clamp(b.y, 0.5, 99.5);

        if (b.z < 15) {
            let closestP: Player | null = null;
            let minD = 2.0;
            [...this.homePlayers, ...this.awayPlayers].forEach(p => {
                if (!this.playerStates[p.id] || this.playerStates[p.id].possessionCooldown > 0 || !this.sim.players[p.id]) return;
                const d = dist(this.sim.players[p.id].x, this.sim.players[p.id].y, b.x, b.y);
                if (d < minD) { minD = d; closestP = p; }
            });

            if (closestP) {
                const p = closestP as Player;
                const ballSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                const technique = p.attributes.dribbling || 50;
                const difficulty = ballSpeed * 12;

                if (Math.random() * 110 + technique > difficulty) {
                    this.sim.ball.ownerId = p.id;
                    this.sim.ball.vx = 0; this.sim.ball.vy = 0; this.sim.ball.z = 0; this.sim.ball.curve = 0;
                    this.lastTouchTeamId = p.teamId;
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

        if (isBallLoose && distToBall < 25 && ((isHome && ballX < 30) || (!isHome && ballX > 70))) {
            const ballSpeed = Math.sqrt(this.sim.ball.vx ** 2 + this.sim.ball.vy ** 2);
            if (ballSpeed > 0.5 || distToBall < 10) {
                this.applySteeringBehavior(p, ballX + this.sim.ball.vx * 2, ballY + this.sim.ball.vy * 2, MAX_PLAYER_SPEED * 1.1);
                simP.state = 'SPRINT';
                return;
            }
        }

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
        if (state.currentStamina < 50) closeControl *= 1.6; // Fatigue hurts control more

        this.sim.ball.x = simP.x + (Math.cos(simP.facing) * closeControl);
        this.sim.ball.y = simP.y + (Math.sin(simP.facing) * closeControl);

        if (this.playerRoles[p.id] === Position.GK) {
            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            if (bestPass && bestPass.score > 15) {
                this.actionPass(p, bestPass.player, bestPass.isThroughBall);
            } else {
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

        const isCorner = (isHome ? simP.x > 95 : simP.x < 5) && (simP.y < 5 || simP.y > 95);
        if (isCorner) {
            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            if (bestPass) {
                this.actionPass(p, bestPass.player, false);
                this.traceLog.push(`${p.lastName} korneri kullandı.`);
                return;
            }
        }

        const obstacles = this.detectObstacles(p, simP.x, simP.y);
        const pressure = obstacles.length;
        let isHoldingUp = false;

        if (p.attributes.strength > 75 && pressure > 0 && state.currentStamina > 30) {
            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            if ((!bestPass || bestPass.score < 20) && state.decisionTimer < 15) {
                simP.vx *= 0.8;
                simP.vy *= 0.8;
                state.decisionTimer -= 0.5;
                isHoldingUp = true;
            }
        }

        let decisionSpeed = 8 - ((p.attributes.decisions || 50) / 25);
        if (state.currentStamina < 50) decisionSpeed *= 2.5; // Tired players decide slower

        state.decisionTimer++;

        if (state.decisionTimer > decisionSpeed) {
            state.decisionTimer = 0;

            const distToGoal = dist(simP.x, simP.y, goalX, 50);

            let shootScore = 0;
            let passScore = 0;
            let dribbleScore = 30;

            const shotOpenness = this.calculateShotOpening(simP.x, simP.y, goalX, isHome);

            if (distToGoal < SHOOT_RANGE) {
                shootScore = 100 - (distToGoal * 1.5);
                const angle = Math.abs(Math.atan2(50 - simP.y, goalX - simP.x));

                shootScore += (p.attributes.finishing * 0.5);

                if (distToGoal < 18) shootScore += 30;
                if (distToGoal < 10) shootScore += 50;
                if (angle < 0.6) shootScore += 30;

                const visionFactor = Math.max(0.5, p.attributes.vision / 100);
                if (shotOpenness > 0.6) shootScore += 200 * visionFactor;
                else if (shotOpenness > 0.3) shootScore += 100 * visionFactor;

                if (distToGoal < 7) shootScore += 600;

                // PlayStyle bonuses
                if (p.playStyles?.includes("Akrobat") && Math.abs(simP.y - 50) > 20) shootScore += 40;
                if (p.playStyles?.includes("Uzak Şut") && distToGoal > 20) shootScore += 60;

                if (p.personality?.riskTaking! > 0.6) shootScore += 20;
            }

            const bestPass = this.findBestPassOption(p, isHome, offsideLineX, goalX);
            if (bestPass) passScore = bestPass.score;

            if (pressure === 0) dribbleScore += 40;
            else dribbleScore -= (pressure * 10);

            if (pressure > 0 && p.attributes.composure < 70) {
                dribbleScore -= 20;
            }

            if (isHoldingUp) dribbleScore -= 50;
            if (p.playStyles.includes("Bencil")) {
                dribbleScore += 30;
                shootScore += 30;
            }

            // Stamina affects decisions - Tired players pass more (safely) or shoot desperately
            if (state.currentStamina < 40) {
                dribbleScore -= 40;
            }

            const getWeightedDecision = () => {
                const sVal = Math.max(0, shootScore);
                const pVal = Math.max(0, passScore);

                if (sVal > 500) return 'SHOOT';

                if (sVal > 150 && shotOpenness > 0.5) return 'SHOOT';

                if (pVal > 150 && pVal > sVal) return 'PASS';

                if (sVal > 120) return 'SHOOT';

                const total = sVal + pVal + Math.max(0, dribbleScore);
                if (total === 0) return 'DRIBBLE';

                const r = Math.random() * total;
                if (r < sVal) return 'SHOOT';
                if (r < sVal + pVal) return 'PASS';
                return 'DRIBBLE';
            };

            const decision = getWeightedDecision();

            if (decision === 'SHOOT') {
                this.actionShoot(p, isHome);
                return;
            } else if (decision === 'PASS') {
                if (bestPass) {
                    this.actionPass(p, bestPass.player, bestPass.isThroughBall);
                    return;
                }
            }
        }

        let targetX = goalX;
        let targetY = 50;
        const nearestEnemy = this.findNearestEnemyInCone(p, isHome);

        if (nearestEnemy) {
            const enemyY = this.sim.players[nearestEnemy.id].y;
            let deviation = (simP.y > enemyY) ? 12 : -12;
            if (simP.y < 5 && deviation < 0) deviation = 15;
            if (simP.y > 95 && deviation > 0) deviation = -15;
            targetY = simP.y + deviation;
            targetX = isHome ? simP.x + 10 : simP.x - 10;
        }

        this.applySteeringBehavior(p, targetX, targetY, MAX_PLAYER_SPEED * 0.9);
    }

    private findBestPassOption(p: Player, isHome: boolean, offsideLineX: number, goalX: number): { player: Player, score: number, isThroughBall: boolean } | null {
        let bestTarget: Player | null = null;
        let maxScore = -9999;
        let isThrough = false;

        const teammates = isHome ? this.homePlayers : this.awayPlayers;
        const simP = this.sim.players[p.id];
        const distToMyGoal = dist(simP.x, simP.y, goalX, 50);
        const tactic = isHome ? this.homeTeam.tactic : this.awayTeam.tactic;

        if (distToMyGoal < 7) return null;

        teammates.forEach(tm => {
            if (tm.id === p.id) return;
            if (!this.sim.players[tm.id]) return;
            const simTm = this.sim.players[tm.id];
            const stateTm = this.playerStates[tm.id];

            const d = dist(simP.x, simP.y, simTm.x, simTm.y);
            // PlayStyle: Long ball passers can see further
            const visionBonus = p.playStyles?.includes("Uzun Topla Pas") ? 20 : 0;
            if (d > PASS_RANGE_VISION + visionBonus) return;

            const distToGoal = dist(simTm.x, simTm.y, goalX, 50);
            let score = (120 - distToGoal);

            const forwardProgress = isHome ? (simTm.x - simP.x) : (simP.x - simTm.x);

            if (stateTm && stateTm.outgoingSignal && stateTm.outgoingSignal.type === 'CALL') {
                score += 90;
            }

            // --- Tactic Impact: Passing Style ---
            if (tactic.passingStyle === 'Short') {
                if (d < 15) score += 40; // Favor shorter passes
                else score -= (d - 15) * 2;
            } else if (tactic.passingStyle === 'Direct') {
                if (forwardProgress > 15) score += 50; // Favor long forward progress
            }

            if (forwardProgress > 0) score += (forwardProgress * 1.5);

            const buffer = isHome ? 1 : -1;
            const isOffside = isHome ? (simTm.x > offsideLineX + buffer) : (simTm.x < offsideLineX + buffer);
            if (isOffside) score -= 1000;

            const enemies = isHome ? this.awayPlayers : this.homePlayers;
            let interceptionRisk = 0;
            enemies.forEach(e => {
                if (!this.sim.players[e.id]) return;
                const simE = this.sim.players[e.id];
                const l2 = d * d;
                if (l2 == 0) return;
                let t = ((simE.x - simP.x) * (simTm.x - simP.x) + (simE.y - simP.y) * (simTm.y - simP.y)) / l2;
                t = Math.max(0, Math.min(1, t));
                const projX = simP.x + t * (simTm.x - simP.x);
                const projY = simP.y + t * (simTm.y - simP.y);
                const distToLine = dist(simE.x, simE.y, projX, projY);
                if (distToLine < 3) interceptionRisk += 30;
            });
            score -= interceptionRisk;

            let isThroughBall = false;
            if (forwardProgress > 10 && d > 15 && interceptionRisk < 20) {
                const vel = Math.sqrt((simTm.vx || 0) ** 2 + (simTm.vy || 0) ** 2);
                if (vel > 0.5) {
                    score += 20;
                    isThroughBall = true;
                }
            }

            const visionFactor = p.attributes.vision / 100;

            if (distToGoal < 20 && interceptionRisk < 10) {
                if (distToGoal < distToMyGoal - 5) {
                    score += 80 * visionFactor;
                }
            }

            if (p.attributes.vision > 80) score += 10;

            if (score > maxScore) {
                maxScore = score;
                bestTarget = tm;
                isThrough = isThroughBall;
            }
        });

        if (maxScore < 20) return null;

        return bestTarget ? { player: bestTarget, score: maxScore, isThroughBall: isThrough } : null;
    }

    private detectObstacles(p: Player, x: number, y: number): Player[] {
        const obstacles: Player[] = [];
        const searchDist = 6;
        [...this.homePlayers, ...this.awayPlayers].forEach(other => {
            if (other.id === p.id || other.teamId === p.teamId) return;
            const otherPos = this.sim.players[other.id];
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
        [...this.homePlayers, ...this.awayPlayers].forEach(other => {
            if (other.teamId === p.teamId) return;
            const otherPos = this.sim.players[other.id];
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

        if (role === Position.FWD) {
            const offsideBuffer = 1.0;
            const isOnside = isHome ? (simP.x < offsideLineX - offsideBuffer) : (simP.x > offsideLineX + offsideBuffer);

            if (!isOnside) {
                this.playerStates[p.id].isPressing = false;
                targetX = isHome ? offsideLineX - 2.5 : offsideLineX + 2.5;
                targetY = lerp(simP.y, 50, 0.1);
                speedMod = MAX_PLAYER_SPEED * 0.8;
                simP.state = 'RUN';
            } else {
                const base = this.baseOffsets[p.id];
                const baseY = isHome ? base.y : 100 - base.y;

                if (teamHasBall) {
                    const isAheadOfBall = isHome ? (simP.x > ballX) : (simP.x < ballX);
                    const shotOpenness = this.calculateShotOpening(simP.x, simP.y, goalX, isHome);

                    if (dist(simP.x, simP.y, goalX, 50) < 30 && shotOpenness > 0.5) {
                        this.emitTeamSignal(p, 'CALL');
                    }

                    const ballHolder = this.sim.ball.ownerId ? this.getPlayer(this.sim.ball.ownerId) : null;
                    let shouldBurst = false;

                    if (ballHolder && ballHolder.teamId === p.teamId) {
                        const holderState = this.playerStates[ballHolder.id];
                        if (this.playerStates[p.id].outgoingSignal?.type === 'CALL') {
                            shouldBurst = true;
                        }
                    }

                    if (shouldBurst) {
                        targetX = isHome ? offsideLineX + 15 : offsideLineX - 15;
                        targetY = lerp(simP.y, GOAL_Y_CENTER, 0.4);
                        speedMod = MAX_PLAYER_SPEED * 1.0;
                        simP.state = 'SPRINT';
                    } else if (isAheadOfBall && dist(simP.x, simP.y, ballX, ballY) < PASS_RANGE_VISION) {
                        targetX = isHome ? offsideLineX - offsideBuffer : offsideLineX + offsideBuffer;
                        targetY = lerp(simP.y, baseY, 0.1);
                        if (simP.y < 20) targetY += 5;
                        if (simP.y > 80) targetY -= 5;
                        speedMod = MAX_PLAYER_SPEED * 0.7;
                        simP.state = 'RUN';
                    } else {
                        targetX = isHome ? base.x : (100 - base.x);
                        targetY = isHome ? base.y : (100 - base.y);
                        const xShift = (ballX - 50) * 0.75;
                        targetX += xShift;
                        speedMod = MAX_PLAYER_SPEED * 0.6;
                        simP.state = 'RUN';
                    }
                } else {
                    this.playerStates[p.id].isPressing = false;
                    targetX = isHome ? offsideLineX - 1.5 : offsideLineX + 1.5;
                    targetY = lerp(simP.y, baseY, 0.05);
                    speedMod = MAX_PLAYER_SPEED * 0.5;
                    simP.state = 'IDLE';
                }
            }
        } else {
            const base = this.baseOffsets[p.id];
            targetX = isHome ? base.x : (100 - base.x);
            targetY = isHome ? base.y : (100 - base.y);

            const widthOffset = tactic.width === 'Wide' ? 1.2 : tactic.width === 'Narrow' ? 0.7 : 1.0;
            targetY = 50 + (targetY - 50) * widthOffset;

            if (teamHasBall) {
                this.playerStates[p.id].isPressing = false;
                const mentality = isHome ? this.homeMentality : this.awayMentality;
                let lineH = isHome ? Math.min(60, ballX - 20) : Math.max(40, ballX + 20);

                if (tactic.defensiveLine === 'High') {
                    lineH = isHome ? Math.min(75, ballX - 15) : Math.max(25, ballX + 15);
                } else if (tactic.defensiveLine === 'Deep') {
                    lineH = isHome ? Math.min(45, ballX - 25) : Math.max(55, ballX + 25);
                }

                if (mentality === TeamMentality.ALL_OUT_ATTACK) lineH = isHome ? 75 : 25;

                targetX = isHome ? Math.max(targetX, lineH) : Math.min(targetX, lineH);
                const xShift = (ballX - 50) * 0.75;
                targetX += xShift;
                speedMod = MAX_PLAYER_SPEED * 0.6;
                simP.state = 'RUN';
            } else {
                const ballCarrierId = this.sim.ball.ownerId;
                const distToBall = dist(simP.x, simP.y, ballX, ballY);
                const myGoalX = isHome ? 0 : 100;
                const distBallToGoal = Math.abs(ballX - myGoalX);
                const isDangerZone = distBallToGoal < 35;
                const decision = p.attributes.decisions || 60;
                const positioning = p.attributes.positioning || 60;

                const isWrongSide = isHome ? (simP.x > ballX + 1) : (simP.x < ballX - 1);

                let shouldPress = false;

                if (decision > 70 && this.isClosestTeammateToBall(p)) {
                    const isInPressRange = distToBall < (isDangerZone ? 25 : 15);
                    let isEmergency = false;
                    if (ballCarrierId && this.sim.players[ballCarrierId]) {
                        const carrier = this.sim.players[ballCarrierId];
                        const carrierVel = Math.sqrt((carrier.vx || 0) ** 2 + (carrier.vy || 0) ** 2);
                        if (carrierVel > 0.9 && Math.abs(carrier.y - 50) < 20) {
                            isEmergency = true;
                        }
                    }
                    if ((this.playerStates[p.id].isPressing && distToBall < 12) || (isInPressRange || isEmergency)) {
                        shouldPress = true;
                    }
                }

                if (shouldPress) {
                    this.playerStates[p.id].isPressing = true;

                    if (isWrongSide && distToBall > 2.0) {
                        // RECOVERY RUN
                        const recoveryX = isHome ? Math.max(0, ballX - 8) : Math.min(100, ballX + 8);
                        const recoveryY = lerp(simP.y, ballY, 0.5);
                        targetX = recoveryX;
                        targetY = recoveryY;
                        speedMod = MAX_PLAYER_SPEED * 1.15;
                        simP.state = 'SPRINT';
                    } else {
                        let interceptX = ballX, interceptY = ballY;
                        if (ballCarrierId && this.sim.players[ballCarrierId]) {
                            const bc = this.sim.players[ballCarrierId];
                            interceptX += bc.vx * 2.5; interceptY += bc.vy * 2.5;
                        } else {
                            interceptX += this.sim.ball.vx * 2; interceptY += this.sim.ball.vy * 2;
                        }
                        targetX = interceptX;
                        targetY = interceptY;
                        speedMod = MAX_PLAYER_SPEED;
                        simP.state = 'SPRINT';

                        let tackleRange = TACKLE_RANGE_BASE;
                        if (tactic.aggression === 'Aggressive') tackleRange *= 1.3;
                        else if (tactic.aggression === 'Safe') tackleRange *= 0.8;

                        if (distToBall < tackleRange && ballCarrierId) {
                            this.actionTackle(p, this.getPlayer(ballCarrierId)!);
                        }
                    }
                } else {
                    this.playerStates[p.id].isPressing = false;
                    const enemies = isHome ? this.awayPlayers : this.homePlayers;
                    let mostDangerousAttacker: { x: number, y: number } | null = null;
                    let maxThreat = -1;

                    enemies.forEach(e => {
                        if (this.playerRoles[e.id] !== Position.FWD) return;
                        const simE = this.sim.players[e.id];
                        if (!simE) return;

                        const distToMyGoal = Math.abs(simE.x - myGoalX);
                        const threat = (100 - distToMyGoal) + (Math.abs(simE.y - 50) < 30 ? 20 : 0);
                        if (threat > maxThreat) {
                            maxThreat = threat;
                            mostDangerousAttacker = simE;
                        }
                    });

                    const positioningFactor = Math.min(1.0, positioning / 90);
                    let ballTrackY = ballY;
                    let defensiveLine = isHome ? 18 : 82;

                    if (tactic.defensiveLine === 'High') {
                        defensiveLine = isHome ? 30 : 70;
                    } else if (tactic.defensiveLine === 'Deep') {
                        defensiveLine = isHome ? 10 : 90;
                    }

                    if (mostDangerousAttacker && positioning > 70) {
                        ballTrackY = lerp(ballY, mostDangerousAttacker.y, positioningFactor * 0.6);
                        defensiveLine = isHome ? Math.max(defensiveLine, mostDangerousAttacker.x + 5) : Math.min(defensiveLine, mostDangerousAttacker.x - 5);
                    }

                    // Wing defense: tuck in when ball is central and dangerous
                    const isBallCentral = Math.abs(ballY - 50) < 25;
                    const isWingDefender = Math.abs(targetY - 50) > 20;
                    if (isBallCentral && isWingDefender && isDangerZone) {
                        targetY = lerp(targetY, 50, 0.4); // Move towards center
                    }

                    targetY += (ballTrackY - 50) * 0.45;
                    targetX = isHome ? Math.max(targetX, defensiveLine) : Math.min(targetX, defensiveLine);

                    if (isWrongSide) {
                        targetX = isHome ? ballX - 5 : ballX + 5;
                        speedMod = MAX_PLAYER_SPEED * 0.9;
                    } else {
                        targetX += (ballX - 50) * 0.2;
                    }

                    simP.state = 'RUN';
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
        [...this.homePlayers, ...this.awayPlayers].forEach(other => {
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
        // Below 60 stamina, speed starts to drop linearly
        let staminaFactor = 1.0;
        if (state.currentStamina < 60) {
            staminaFactor = 0.6 + (state.currentStamina / 60) * 0.4;
        }
        if (state.currentStamina < 20) staminaFactor = 0.4; // Crawl

        let speedPenalty = 1.0;
        if (p.id === this.sim.ball.ownerId) {
            const driSkill = p.attributes.dribbling || 50;
            speedPenalty = 0.80 + (driSkill / 100) * 0.15;
        }

        const physicalLimit = maxSpeed * (p.attributes.speed / 100 + 0.4) * staminaFactor * speedPenalty;

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

        if (isSprinting) {
            state.currentStamina = Math.max(0, state.currentStamina - 0.15); // High drain
        } else if (isRunning) {
            state.currentStamina = Math.max(0, state.currentStamina - 0.04); // Moderate drain
        } else {
            // Very slow recovery if standing still
            state.currentStamina = Math.min(100, state.currentStamina + 0.05);
        }
    }

    private resolveCollisions() {
        const players = [...this.homePlayers, ...this.awayPlayers];
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
            if (b.y > 46.3 && b.y < 53.7 && b.z < 2.44) {
                if (outLeft) {
                    this.resetPositions('KICKOFF', this.homeTeam.id);
                    return { minute: this.internalMinute, type: MatchEventType.GOAL, description: `GOL! ${this.awayTeam.name}`, teamId: this.awayTeam.id };
                }
                if (outRight) {
                    this.resetPositions('KICKOFF', this.awayTeam.id);
                    return { minute: this.internalMinute, type: MatchEventType.GOAL, description: `GOL! ${this.homeTeam.name}`, teamId: this.homeTeam.id };
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
                    }
                } else {
                    if (!lastTouchWasHome && this.lastTouchTeamId) {
                        const isTop = b.y < 50;
                        this.resetPositions(isTop ? 'CORNER_HOME_TOP' : 'CORNER_HOME_BOTTOM');
                        this.traceLog.push("KORNER (Ev Sahibi)");
                    } else {
                        this.resetPositions('GOAL_KICK_AWAY');
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

    private actionPass(carrier: Player, target: Player, throughBall: boolean) {
        const cPos = this.sim.players[carrier.id];
        const tPos = this.sim.players[target.id];
        const state = this.playerStates[carrier.id];

        const pasStat = carrier.attributes.passing || 50;
        let tx = tPos.x; let ty = tPos.y;
        if (throughBall) { tx += tPos.vx * 12; ty += tPos.vy * 12; } else { tx += tPos.vx * 4; ty += tPos.vy * 4; }

        const dx = tx - cPos.x; const dy = ty - cPos.y;
        const angle = Math.atan2(dy, dx);
        const distToT = Math.sqrt(dx * dx + dy * dy);

        let errorMargin = (100 - pasStat) * 0.005;
        // Fatigue Impact
        const staminaFactor = state.currentStamina / 100;
        if (staminaFactor < 0.5) errorMargin *= 3;

        const finalAngle = angle + (Math.random() * errorMargin - errorMargin / 2);
        const power = Math.min(MAX_BALL_SPEED, 2.0 + (distToT * 0.05));

        this.sim.ball.ownerId = null;
        this.sim.ball.x = cPos.x + Math.cos(finalAngle) * 1.5;
        this.sim.ball.y = cPos.y + Math.sin(finalAngle) * 1.5;
        this.sim.ball.vx = Math.cos(finalAngle) * power;
        this.sim.ball.vy = Math.sin(finalAngle) * power;
        this.sim.ball.vz = 0; this.sim.ball.curve = 0;

        this.playerStates[carrier.id].possessionCooldown = 12;
        this.sim.players[carrier.id].state = 'KICK';

        this.lastTouchTeamId = carrier.teamId;

        const typeText = throughBall ? "Ara pası" : "Pas";
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
        // Fatigue Impact on shooting accuracy
        if (state.currentStamina < 60) accuracyPenalty += 0.3;
        if (state.currentStamina < 30) accuracyPenalty += 0.5;

        const spread = ((100 - fin) * 0.005) + accuracyPenalty;
        const shotAngle = angle + (Math.random() * spread - spread / 2);
        const shotSpeed = 2.8 + (pwr / 70);

        // Target Check
        const finalYAtGoal = pos.y + (goalX - pos.x) * Math.tan(shotAngle);
        const isOnTarget = finalYAtGoal > GOAL_Y_TOP && finalYAtGoal < GOAL_Y_BOTTOM;
        if (isOnTarget) {
            if (isHome) this.match.stats.homeOnTarget++;
            else this.match.stats.awayOnTarget++;
        }

        const enemies = isHome ? this.awayPlayers : this.homePlayers;
        for (const e of enemies) {
            const ePos = this.sim.players[e.id];
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
        // Fatigue Impact
        if (defState.currentStamina < 50) effectiveDef *= 0.6; // Heavy penalty for tired defenders

        let effectiveDri = dri;
        if (attState.currentStamina < 50) effectiveDri *= 0.7;

        // --- Tactic Impact: Aggression ---
        let riskFactor = 1.0;
        if (tactic.aggression === 'Aggressive') {
            effectiveDef *= 1.25;
            riskFactor = 1.4; // Easier to get beaten if fail
        } else if (tactic.aggression === 'Safe') {
            effectiveDef *= 0.85;
            riskFactor = 0.6; // Stays on feet
        }

        const rollD = effectiveDef * (Math.random() + 0.5);
        const rollA = effectiveDri * Math.random();

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
