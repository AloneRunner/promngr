
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
    TransferOffer
} from '../types';
import { NAMES_DB, LEAGUE_PRESETS, REAL_PLAYERS, TICKET_PRICE, TEAM_TACTICAL_PROFILES } from '../constants';
import { MatchEngine, TICKS_PER_MINUTE, calculateEffectiveRating } from './MatchEngine';

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

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

const generatePlayer = (teamId: string, position: Position, nationality: string, ageRange: [number, number], potentialRange: [number, number], realData?: any): Player => {
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

    const calculatedOverall = calculateEffectiveRating(tempPlayerForCalc, position);

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
        stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 },
        overall: calculatedOverall,
        potential,
        value: calculatedOverall * 150000 * (1 + (potential - calculatedOverall) / 20),
        wage: calculatedOverall * 750,
        salary: (calculatedOverall * 150000 * (1 + (potential - calculatedOverall) / 20)) * 0.15, // Approx 15% of value
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
    currentStarters?: Player[]
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

        // Position match bonus - if playing in natural position, give bonus
        if (forRole && p.position === forRole) {
            score += 5;
        } else if (forRole && p.position !== forRole) {
            // Out of position penalty
            score -= 10;
            // GK playing field or Field playing GK is terrible
            if (p.position === Position.GK || forRole === Position.GK) {
                score -= 100;
            }
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

    console.log('[AutoPick Debug]', {
        formation,
        structure,
        slotRequirements,
        slotCount: slotRequirements.length
    });

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
    return [
        { id: uuid(), name: "FlyEmirates", description: "Global Airline", weeklyIncome: 500000, winBonus: 200000, duration: 1 },
        { id: uuid(), name: "QatarAirways", description: "Premium Airline", weeklyIncome: 450000, winBonus: 250000, duration: 1 },
        { id: uuid(), name: "Spotify", description: "Music Streaming", weeklyIncome: 400000, winBonus: 100000, duration: 1 },
        { id: uuid(), name: "TeamViewer", description: "Tech Solutions", weeklyIncome: 300000, winBonus: 50000, duration: 1 },
        { id: uuid(), name: "RedBull", description: "Energy Drink", weeklyIncome: 350000, winBonus: 150000, duration: 1 },
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
    const lowCond = starters.filter(p => p.condition < 50);
    if (lowCond.length > 0) advice.push({ type: 'WARNING', message: `${lowCond.length} player(s) have critically low stamina.` });
    return advice;
};

export const generateSeasonSchedule = (teams: Team[]): Match[] => {
    const matches: Match[] = [];
    const teamIds = teams.map(t => t.id);
    if (teamIds.length % 2 !== 0) teamIds.push('BYE');
    const numTeams = teamIds.length;
    const numRounds = numTeams - 1;
    const half = numTeams / 2;
    const teamList = [...teamIds];

    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < half; i++) {
            const home = teamList[i];
            const away = teamList[numTeams - 1 - i];
            if (home !== 'BYE' && away !== 'BYE') {
                const actualHome = (round % 2 === 0) ? home : away;
                const actualAway = (round % 2 === 0) ? away : home;
                matches.push({
                    id: uuid(), week: round + 1, homeTeamId: actualHome, awayTeamId: actualAway,
                    homeScore: 0, awayScore: 0, events: [], isPlayed: false,
                    date: Date.now() + ((round + 1) * 7 * 24 * 60 * 60 * 1000), attendance: 0,
                    currentMinute: 0, weather: 'Sunny', timeOfDay: 'Day',
                    stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 }
                });
                matches.push({
                    id: uuid(), week: round + 1 + numRounds, homeTeamId: actualAway, awayTeamId: actualHome,
                    homeScore: 0, awayScore: 0, events: [], isPlayed: false,
                    date: Date.now() + ((round + 1 + numRounds) * 7 * 24 * 60 * 60 * 1000), attendance: 0,
                    currentMinute: 0, weather: 'Sunny', timeOfDay: 'Night',
                    stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 }
                });
            }
        }
        const last = teamList.pop();
        if (last) teamList.splice(1, 0, last);
    }
    return matches.sort((a, b) => a.week - b.week);
};

export const generateWorld = (leagueId: string): GameState => {
    const preset = LEAGUE_PRESETS.find(l => l.id === leagueId) || LEAGUE_PRESETS[0];
    const teams: Team[] = [];
    const players: Player[] = [];

    (preset.realTeams || []).forEach(rt => {
        const teamId = uuid();
        const teamPlayers: Player[] = [];
        const realStars = REAL_PLAYERS.filter(p => (p.takim === rt.name) || ((p as any).team === rt.name));
        const uniqueStars = Array.from(new Set(realStars.map(s => JSON.stringify(s)))).map((s: string) => JSON.parse(s));

        uniqueStars.forEach(star => {
            let pos = Position.MID;
            if (star.mevki) pos = mapTurkishPosition(star.mevki);
            else if (star.position) pos = star.position;
            const p = generatePlayer(teamId, pos, star.uyruk || star.nationality, [star.yas || star.age, star.yas || star.age], [star.reyting || star.ovr, star.reyting || star.ovr], star);
            teamPlayers.push(p); players.push(p);
        });

        // Determine specific tactic from profile or dynamic best-fit
        let specificTactic: TeamTactic;
        if (TEAM_TACTICAL_PROFILES[rt.name]) {
            specificTactic = JSON.parse(JSON.stringify(TEAM_TACTICAL_PROFILES[rt.name]));
        } else {
            // Default generic tactic if no profile found
            specificTactic = { formation: TacticType.T_442, style: 'Possession', aggression: 'Normal', tempo: 'Normal', width: 'Balanced', defensiveLine: 'Balanced', passingStyle: 'Mixed', marking: 'Zonal' };
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
                const p = generatePlayer(teamId, pos as Position, nat, [18, 34], [baseOvr, baseOvr + 8]);
                teamPlayers.push(p); players.push(p);
            }
        }

        const coachType = getRandomItem(Object.values(CoachArchetype));
        const baseStaffLevel = Math.max(1, Math.floor(rt.reputation / 1500));

        const team: Team = {
            id: teamId, name: rt.name, city: rt.city, primaryColor: rt.primaryColor, secondaryColor: rt.secondaryColor,
            reputation: rt.reputation, budget: rt.budget,
            leagueId: leagueId,
            facilities: { stadiumCapacity: Math.floor(rt.reputation * 50), stadiumLevel: Math.floor(rt.reputation / 100), trainingLevel: Math.floor(rt.reputation / 150), academyLevel: Math.floor(rt.reputation / 150) },
            staff: { headCoachLevel: baseStaffLevel, physioLevel: baseStaffLevel, scoutLevel: baseStaffLevel },
            objectives: generateObjectives(rt.reputation),
            tactic: specificTactic,
            coachArchetype: coachType as CoachArchetype, trainingFocus: 'BALANCED', trainingIntensity: 'NORMAL',
            youthCandidates: [],
            recentForm: [],
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
            wages: 0
        };

        // Facility Balancing based on Reputation
        // Rep > 85: Level 7-9 (Top Tier)
        // Rep 75-85: Level 5-7 (High Tier)
        // Rep < 75: Level 2-4 (Mid Tier)
        const tier = team.reputation > 85 ? 3 : team.reputation > 75 ? 2 : 1;
        const baseLevel = tier === 3 ? 7 : tier === 2 ? 5 : 2;

        team.facilities = {
            stadiumCapacity: team.facilities.stadiumCapacity,
            stadiumLevel: Math.min(10, baseLevel + getRandomInt(0, 2)),
            trainingLevel: Math.min(10, baseLevel + getRandomInt(0, 2)),
            academyLevel: Math.min(10, baseLevel + getRandomInt(0, 2))
        };

        // Auto pick lineup adhering to the specific formation
        const { formation } = autoPickLineup(teamPlayers, specificTactic.formation, coachType as CoachArchetype);
        team.tactic.formation = formation;
        teams.push(team);
    });

    for (let i = 0; i < 20; i++) {
        const p = generatePlayer('FREE_AGENT', getRandomItem(Object.values(Position)), 'World', [18, 35], [60, 85]);
        players.push(p);
    }

    return {
        currentWeek: 1, currentSeason: 2024, userTeamId: teams[0].id, leagueId, teams, players, matches: generateSeasonSchedule(teams),
        isSimulating: false, messages: [{ id: uuid(), week: 1, type: MessageType.BOARD, subject: 'Welcome', body: 'The board expects strong results.', isRead: false, date: new Date().toISOString() }],
        transferMarket: players.filter(p => p.teamId === 'FREE_AGENT'), history: [], pendingOffers: []
    };
};

let activeEngine: MatchEngine | null = null;

export const initializeMatch = (match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[], userTeamId?: string) => {
    activeEngine = new MatchEngine(match, homeTeam, awayTeam, homePlayers, awayPlayers, userTeamId);
    return activeEngine.step().liveData.simulation;
}

export const simulateTick = (match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[], userTeamId?: string) => {
    if (!activeEngine || (activeEngine as any).match.id !== match.id) {
        activeEngine = new MatchEngine(match, homeTeam, awayTeam, homePlayers, awayPlayers, userTeamId);
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
        stats: result.stats
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

export const simulateFullMatch = (match: Match, homeTeam: Team, awayTeam: Team, homePlayers: Player[], awayPlayers: Player[]): Match => {
    const tacticsRockPaperScissors: Record<string, string> = {
        'Possession': 'HighPress',
        'Counter': 'Possession',
        'LongBall': 'HighPress',
        'HighPress': 'Counter'
    };
    let homeAdvantage = 1.15;
    if (tacticsRockPaperScissors[homeTeam.tactic.style] === awayTeam.tactic.style) homeAdvantage += 0.15;
    if (tacticsRockPaperScissors[awayTeam.tactic.style] === homeTeam.tactic.style) homeAdvantage -= 0.15;

    const getPower = (players: Player[], pos: string): number =>
        players.filter(p => p.lineup === 'STARTING' && mapTurkishPosition(p.position) === pos)
            .reduce((sum, p) => sum + calculateEffectiveRating(p, mapTurkishPosition(p.position)), 0);

    const hAtt = getPower(homePlayers, Position.FWD) + getPower(homePlayers, Position.MID) * 0.6;
    const hDef = getPower(homePlayers, Position.DEF) + getPower(homePlayers, Position.GK) + getPower(homePlayers, Position.MID) * 0.4;
    const aAtt = getPower(awayPlayers, Position.FWD) + getPower(awayPlayers, Position.MID) * 0.6;
    const aDef = getPower(awayPlayers, Position.DEF) + getPower(awayPlayers, Position.GK) + getPower(awayPlayers, Position.MID) * 0.4;

    // PRESERVE existing score and events if match already started
    const startMinute = match.currentMinute || 0;
    const existingEvents = [...(match.events || [])];

    // Only reset if match hasn't started yet
    if (startMinute === 0) {
        match.homeScore = 0;
        match.awayScore = 0;
        match.events = [];
    } else {
        // Keep existing events, we'll add new ones
        match.events = existingEvents;
    }

    const pickScorer = (players: Player[]): Player | undefined => {
        const candidates = players.filter(p => p.lineup === 'STARTING' || p.lineup === 'BENCH'); // Simplification: anyone could score
        if (candidates.length === 0) return undefined;
        // Weight by position: FWD > MID > DEF > GK
        const weighted = [];
        for (const p of candidates) {
            let weight = 1;
            if (p.position === Position.FWD) weight = 6;
            else if (p.position === Position.MID) weight = 3;
            else if (p.position === Position.DEF) weight = 1;

            // Boost by finishing
            weight += (p.attributes.finishing || 50) / 20;

            for (let i = 0; i < weight; i++) weighted.push(p);
        }
        return weighted[Math.floor(Math.random() * weighted.length)];
    };

    // Simulate from current minute to 90
    for (let min = Math.floor(startMinute / 10) * 10; min < 90; min += 10) {
        // Skip simulation for already-played time periods
        if (min < startMinute) continue;

        const momentum = (Math.random() * 0.4) + 0.8;
        const hChance = (hAtt * homeAdvantage * momentum) / (aDef * 1.0);
        const aChance = (aAtt * momentum) / (hDef * homeAdvantage);
        const roll = Math.random();
        const baseGoalProb = 0.12;
        if (roll < baseGoalProb * (hChance / 1.5)) {
            match.homeScore++;
            // Pick random scorer
            const scorer = pickScorer(homePlayers);
            match.events.push({ minute: min + getRandomInt(1, 9), type: MatchEventType.GOAL, teamId: homeTeam.id, playerId: scorer?.id, description: `Gol! (${scorer ? scorer.lastName : homeTeam.name})` });
        } else if (roll > 1 - (baseGoalProb * (aChance / 1.5))) {
            match.awayScore++;
            // Pick random scorer
            const scorer = pickScorer(awayPlayers);
            match.events.push({ minute: min + getRandomInt(1, 9), type: MatchEventType.GOAL, teamId: awayTeam.id, playerId: scorer?.id, description: `Gol! (${scorer ? scorer.lastName : awayTeam.name})` });
        }
    }
    match.isPlayed = true;
    match.events.push({ minute: 90, type: MatchEventType.FULL_TIME, description: 'Full Time' });
    return match;
}

export const simulateLeagueRound = (gameState: GameState, currentWeek: number): GameState => {
    const matchesToSimulate = gameState.matches.filter(m => m.week === currentWeek && !m.isPlayed && m.homeTeamId !== gameState.userTeamId && m.awayTeamId !== gameState.userTeamId);
    matchesToSimulate.forEach(m => {
        const home = gameState.teams.find(t => t.id === m.homeTeamId);
        const away = gameState.teams.find(t => t.id === m.awayTeamId);
        if (home && away) {
            const homePlayers = gameState.players.filter(p => p.teamId === home.id);
            const awayPlayers = gameState.players.filter(p => p.teamId === away.id);

            // AI teams auto-pick their best available lineup before each match
            autoPickLineup(homePlayers, home.tactic.formation);
            autoPickLineup(awayPlayers, away.tactic.formation);

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

            // Update Player Stats (Goals)
            m.events.forEach(e => {
                if (e.type === MatchEventType.GOAL && e.playerId) {
                    const scorer = gameState.players.find(p => p.id === e.playerId);
                    if (scorer) {
                        if (!scorer.stats) scorer.stats = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 };
                        scorer.stats.goals++;
                    }
                }
            });
        }
    });
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
    const physioBonus = (userTeam?.staff?.physioLevel || 1) * 3;
    let recoveryBase = 30 + physioBonus;
    if (intensity === 'LIGHT') recoveryBase = 45 + physioBonus;
    if (intensity === 'HEAVY') recoveryBase = 15 + physioBonus;

    const newMessages: Message[] = [];
    const report: string[] = [];

    // Localized training intensity name
    const intensityLabel = intensity === 'LIGHT' ? t.intensityLight : intensity === 'HEAVY' ? t.intensityHeavy : t.intensityNormal;
    report.push(t.trainingIntensityReport.replace('{intensity}', intensityLabel).replace('{recovery}', recoveryBase.toString()));

    let updatedPlayers = gameState.players.map(p => {
        const isUserPlayer = p.teamId === gameState.userTeamId;
        let rec = isUserPlayer ? recoveryBase : 35;
        let newMorale = p.morale;

        if (isUserPlayer) {
            if (p.lineup === 'STARTING') {
                newMorale = Math.min(100, newMorale + 2);
            } else if (p.lineup === 'BENCH') {
                newMorale = Math.max(0, newMorale - 1);
            } else {
                if (p.overall > 75) {
                    newMorale = Math.max(0, newMorale - 3);
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
                }
            }
        }

        // STAFF EFFECT: headCoachLevel improves player development
        let newOverall = p.overall;
        if (isUserPlayer && p.age < 28 && p.overall < p.potential) {
            const headCoachLevel = userTeam?.staff?.headCoachLevel || 1;
            const developmentChance = 0.05 + (headCoachLevel * 0.01); // 5% base + 1% per coach level
            if (Math.random() < developmentChance) {
                newOverall = Math.min(p.potential, p.overall + 1);
                if (newOverall > p.overall) {
                    report.push(`⬆️ ${p.firstName} ${p.lastName} +1 OVR (${p.overall} → ${newOverall})`);
                }
            }
        }

        return {
            ...p,
            overall: newOverall,
            value: newOverall * 300000 * (1 + (p.potential - newOverall) / 20), // Update value
            condition: Math.min(100, p.condition + rec),
            weeksInjured: Math.max(0, p.weeksInjured - 1),
            morale: newMorale
        }
    });

    // Finance logic from previous version incorporated for localization
    if (userTeam) {
        const teamPlayers = updatedPlayers.filter(p => p.teamId === userTeam.id);
        const totalSalaries = teamPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
        const weeklyWages = totalSalaries / 52;

        userTeam.wages = Math.round(weeklyWages); // Update team stat

        // BALANCED: Reduced facility and staff costs (was 25K and 15K per level)
        const maintenance = (userTeam.facilities.stadiumLevel + userTeam.facilities.trainingLevel + userTeam.facilities.academyLevel) * 5000;
        const staffCosts = (userTeam.staff.headCoachLevel + userTeam.staff.scoutLevel + userTeam.staff.physioLevel) * 3000;

        const isHomeWeek = gameState.matches.some(m => m.week === gameState.currentWeek && m.homeTeamId === userTeam.id);
        const ticketIncome = isHomeWeek ? (userTeam.facilities.stadiumCapacity * TICKET_PRICE * (0.6 + Math.random() * 0.4)) : 0;
        // BALANCED: Increased base income sources
        const merchandise = (userTeam.reputation * 10) + (teamPlayers.filter(p => p.overall > 85).length * 25000);
        const tvRights = 400000 + (userTeam.reputation * 10); // Base + reputation bonus
        const sponsorIncome = userTeam.sponsor ? userTeam.sponsor.weeklyIncome : 150000;

        const weeklyIncome = ticketIncome + merchandise + tvRights + sponsorIncome;
        const weeklyExpenses = weeklyWages + maintenance + staffCosts;

        userTeam.budget += (weeklyIncome - weeklyExpenses);

        userTeam.financials = {
            lastWeekIncome: { tickets: ticketIncome, sponsor: sponsorIncome, merchandise, tvRights, transfers: 0 },
            lastWeekExpenses: { wages: weeklyWages, maintenance, academy: maintenance / 3, transfers: 0 } // simple split
        };

        const balance = weeklyIncome - weeklyExpenses;
        newMessages.push({
            id: uuid(),
            week: gameState.currentWeek,
            type: MessageType.INFO,
            subject: t.financeReport,
            body: `${balance >= 0 ? t.financeReportProfit.replace('{amount}', balance.toLocaleString()) : t.financeReportLoss.replace('{amount}', Math.abs(balance).toLocaleString())} ${t.currentBalance.replace('{amount}', userTeam.budget.toLocaleString())}`,
            isRead: false,
            date: new Date().toISOString()
        });
    }

    // STAFF EFFECT: scoutLevel affects youth candidate generation
    let updatedTeams = gameState.teams;
    if (userTeam) {
        const scoutLevel = userTeam.staff?.scoutLevel || 1;
        const academyLevel = userTeam.facilities?.academyLevel || 1;
        const youthChance = 0.03 + (scoutLevel * 0.01) + (academyLevel * 0.005); // Base 3% + 1% per scout level + 0.5% per academy level

        if (Math.random() < youthChance && (userTeam.youthCandidates?.length || 0) < 5) {
            // Generate a youth player with potential based on scoutLevel
            const positions: Position[] = [Position.GK, Position.DEF, Position.DEF, Position.MID, Position.MID, Position.FWD];
            const pos = positions[Math.floor(Math.random() * positions.length)];
            const baseOverall = 45 + Math.floor(Math.random() * 15); // 45-60
            const potentialBonus = Math.floor(scoutLevel * 2 + academyLevel); // Higher scout = higher potential
            const potential = Math.min(99, baseOverall + 20 + Math.floor(Math.random() * 15) + potentialBonus);


            const youthPlayer = generatePlayer(userTeam.id, pos, 'Turkey', [16, 17], [potential, potential]);
            youthPlayer.salary = youthPlayer.value * 0.15; // Approx 15% of value as yearly salary
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
                subject: '🌟 Youth Prospect Found!',
                body: `Your scouts have discovered ${youthPlayer.firstName} ${youthPlayer.lastName} (${pos}, ${youthPlayer.age}). Overall: ${baseOverall}, Potential: ${potential}`,
                isRead: false,
                date: new Date().toISOString()
            });
        }
    }

    // ========== AI TEAM DEVELOPMENT SYSTEM ==========
    // AI teams passively upgrade facilities, develop players, and produce youth
    updatedTeams = updatedTeams.map(team => {
        if (team.id === gameState.userTeamId) return team; // Skip user team

        // AI Facility Upgrades (small chance each week based on budget and reputation)
        const upgradeChance = 0.02 + (team.reputation / 10000); // 2% base + reputation bonus

        if (Math.random() < upgradeChance && team.budget > 5000000) {
            const facilityTypes = ['stadium', 'training', 'academy'];
            const targetFacility = facilityTypes[Math.floor(Math.random() * facilityTypes.length)];

            let cost = 0;
            const newFacilities = { ...team.facilities };

            if (targetFacility === 'stadium' && newFacilities.stadiumLevel < 10) {
                cost = 3000000;
                if (team.budget > cost) {
                    newFacilities.stadiumLevel += 1;
                    newFacilities.stadiumCapacity += 2000;
                }
            } else if (targetFacility === 'training' && newFacilities.trainingLevel < 10) {
                cost = 2000000;
                if (team.budget > cost) {
                    newFacilities.trainingLevel += 1;
                }
            } else if (targetFacility === 'academy' && newFacilities.academyLevel < 10) {
                cost = 1500000;
                if (team.budget > cost) {
                    newFacilities.academyLevel += 1;
                }
            }

            if (cost > 0 && team.budget > cost) {
                return { ...team, facilities: newFacilities, budget: team.budget - cost };
            }
        }

        return team;
    });

    // AI Player Development (young players improve based on team training level)
    updatedPlayers = updatedPlayers.map(player => {
        if (player.teamId === gameState.userTeamId) return player; // Skip user players

        const playerTeam = updatedTeams.find(t => t.id === player.teamId);
        if (!playerTeam) return player;

        // Young players develop based on team's training level
        if (player.age < 26 && player.overall < player.potential) {
            const trainingLevel = playerTeam.facilities?.trainingLevel || 1;
            const developmentChance = 0.03 + (trainingLevel * 0.008); // 3% base + 0.8% per level

            if (Math.random() < developmentChance) {
                const newOverall = Math.min(player.potential, player.overall + 1);
                return {
                    ...player,
                    overall: newOverall,
                    value: newOverall * 300000 * (1 + (player.potential - newOverall) / 20)
                };
            }
        }

        // Older players may decline
        if (player.age > 32 && Math.random() < 0.03) {
            const newOverall = Math.max(50, player.overall - 1);
            return {
                ...player,
                overall: newOverall,
                value: newOverall * 200000
            };
        }

        return player;
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

                const youthPlayer = generatePlayer(team.id, pos, 'Europe', [17, 19], [potential, potential]);
                youthPlayer.overall = baseOverall;
                youthPlayer.lineup = 'RESERVE';
                youthPlayer.lineupIndex = 99;
                youthPlayer.salary = youthPlayer.value * 0.15; // Approx 15% of value as yearly salary

                updatedPlayers.push(youthPlayer);
            }
        }

        // Deduct wages for AI Teams too (simplified economy)
        if (team.id !== gameState.userTeamId) {
            const teamPlayers = updatedPlayers.filter(p => p.teamId === team.id);
            const weeklyWages = teamPlayers.reduce((sum, p) => sum + (p.salary || 0), 0) / 52;
            team.wages = Math.round(weeklyWages);
            team.budget -= weeklyWages;
        }

        return team;
    });

    // AI Transfer Offers for User's Listed Players
    const newOffers: TransferOffer[] = [];
    const userListedPlayers = updatedPlayers.filter(p => p.teamId === gameState.userTeamId && p.isTransferListed);

    userListedPlayers.forEach(player => {
        // Each listed player has a chance to receive an offer
        if (Math.random() < 0.4) { // 40% chance per week
            // Find AI teams with enough budget
            const interestedTeams = gameState.teams.filter(team =>
                team.id !== gameState.userTeamId &&
                team.budget > player.value * 0.7 &&
                Math.random() < 0.3 // Only 30% of eligible teams will bid
            );

            if (interestedTeams.length > 0) {
                const buyingTeam = interestedTeams[Math.floor(Math.random() * interestedTeams.length)];
                const offerMultiplier = 0.7 + Math.random() * 0.5; // 70% to 120% of value
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
                    subject: `💰 Transfer Offer: ${player.lastName}`,
                    body: `${buyingTeam.name} has offered €${(offerAmount / 1000000).toFixed(1)}M for ${player.firstName} ${player.lastName}.`,
                    isRead: false,
                    date: new Date().toISOString(),
                    data: { offerId: offer.id }
                });
            }
        }
    });

    // AI-to-AI Transfers (Background)
    // Small chance each week for AI teams to trade
    if (Math.random() < 0.15) { // 15% chance per week
        const aiTeams = gameState.teams.filter(t => t.id !== gameState.userTeamId);
        const sellingTeam = aiTeams[Math.floor(Math.random() * aiTeams.length)];
        const sellingPlayers = updatedPlayers.filter(p =>
            p.teamId === sellingTeam.id &&
            p.overall < 75 && // Only sell lower-rated players
            Math.random() < 0.3
        );

        if (sellingPlayers.length > 0) {
            const playerToSell = sellingPlayers[Math.floor(Math.random() * sellingPlayers.length)];
            const potentialBuyers = aiTeams.filter(t =>
                t.id !== sellingTeam.id &&
                t.budget > playerToSell.value * 0.8
            );

            if (potentialBuyers.length > 0) {
                const buyingTeam = potentialBuyers[Math.floor(Math.random() * potentialBuyers.length)];
                const transferFee = Math.floor(playerToSell.value * (0.8 + Math.random() * 0.3));

                // Execute transfer
                playerToSell.teamId = buyingTeam.id;
                playerToSell.lineup = 'RESERVE';
                playerToSell.lineupIndex = 99;

                // Update team budgets
                updatedTeams = updatedTeams.map(t => {
                    if (t.id === sellingTeam.id) return { ...t, budget: t.budget + transferFee };
                    if (t.id === buyingTeam.id) return { ...t, budget: t.budget - transferFee };
                    return t;
                });

                // News about AI transfer
                newMessages.push({
                    id: uuid(),
                    week: gameState.currentWeek,
                    type: MessageType.INFO,
                    subject: '📰 Transfer News',
                    body: `${buyingTeam.name} has signed ${playerToSell.firstName} ${playerToSell.lastName} from ${sellingTeam.name} for €${(transferFee / 1000000).toFixed(1)}M.`,
                    isRead: false,
                    date: new Date().toISOString()
                });
            }
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

export const processSeasonEnd = (gameState: GameState) => {
    // 1. Calculate Standings & Awards
    const sensitiveSortedTeams = [...gameState.teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });

    const winner = sensitiveSortedTeams[0];
    const runnerUp = sensitiveSortedTeams[1];

    // Find Top Scorer & Assister
    let topScorer = { name: 'N/A', count: 0 };
    let topAssister = { name: 'N/A', count: 0 };

    gameState.players.forEach(p => {
        if (p.stats && p.stats.goals > topScorer.count) topScorer = { name: `${p.firstName} ${p.lastName}`, count: p.stats.goals };
        if (p.stats && p.stats.assists > topAssister.count) topAssister = { name: `${p.firstName} ${p.lastName}`, count: p.stats.assists };
    });

    const historyEntry: LeagueHistoryEntry = {
        season: gameState.currentSeason,
        championId: winner.id,
        championName: winner.name,
        championColor: winner.primaryColor,
        runnerUpName: runnerUp ? runnerUp.name : 'N/A',
        topScorer: `${topScorer.name} (${topScorer.count})`,
        topAssister: `${topAssister.name} (${topAssister.count})`
    };

    // 2. Economy: Prize Money Distribution
    const prizeDistribution = [50000000, 25000000, 15000000, 10000000]; // Top 4 Prizes

    let updatedTeams = sensitiveSortedTeams.map((t, index) => {
        let prize = 1000000; // Base participation prize
        if (index < 4) prize = prizeDistribution[index];
        else if (index < 6) prize = 5000000; // Europa League spots

        return {
            ...t,
            budget: t.budget + prize,
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }, // Reset Stats
            recentForm: []
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

        if (contractYears <= 0) {
            if (p.teamId === gameState.userTeamId) {
                // User's players become free agents if not renewed
                teamId = 'FREE_AGENT';
            } else {
                // AI Logic: Renew key players, release others
                if (overall > 72) {
                    contractYears = getRandomInt(1, 3); // Auto renew
                } else {
                    teamId = 'FREE_AGENT';
                }
            }
        }

        // Value update based on new overall/age
        const newValue = overall * 250000 * (1 - (age - 25) * 0.05);

        return {
            ...p,
            age,
            overall,
            potential: Math.max(overall, potential), // Potential shouldn't drop below current? Or maybe it should. Keep it simple.
            value: Math.max(100000, newValue),
            contractYears,
            teamId,
            stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 }, // Reset season stats
            weeksInjured: 0,
            matchSuspension: 0,
            condition: 100,
            morale: 75 // Reset morale
        };
    });

    // Handle Retirements & Regens
    const finalPlayers: Player[] = [];

    updatedPlayers.forEach(p => {
        let shouldRetire = false;
        // Retirement check only for non-free-agents to simulate career end, free agents might just disappear
        if (p.age >= 39) shouldRetire = true;
        else if (p.age >= 34 && Math.random() < 0.25) shouldRetire = true;

        if (shouldRetire) {
            retiredPlayerNames.push(`${p.firstName} ${p.lastName}`);

            // Create Regen
            // Regen stays in the same team to maintain squad balance
            if (p.teamId !== 'FREE_AGENT') {
                const regen = generatePlayer(
                    p.teamId,
                    p.position,
                    p.nationality,
                    [16, 19], // Age range
                    [Math.max(70, p.potential - 5), Math.min(99, p.potential + 5)] // Potential range
                );
                // Adjust regen starting overall
                regen.overall = getRandomInt(55, 70);
                regen.value = regen.overall * 150000;

                promotedPlayerNames.push(`${regen.firstName} ${regen.lastName} (Regen)`);
                finalPlayers.push(regen);
            }
        } else {
            // Keep player
            finalPlayers.push(p);
        }
    });

    // 4. Update Game State
    const newState = {
        ...gameState,
        currentSeason: gameState.currentSeason + 1,
        currentWeek: 1,
        history: [...gameState.history, historyEntry],
        teams: updatedTeams,
        players: finalPlayers,
        matches: generateSeasonSchedule(updatedTeams),
        europeanCup: undefined, // Reset cups
        // Reset messages? Maybe keep them but clean up old ones? Let's keep for history.
        messages: [{
            id: uuid(),
            week: 1,
            type: MessageType.BOARD,
            subject: `Season ${gameState.currentSeason + 1} Begins!`,
            body: `Welcome to the new season. The board expects another strong performance. Prize money of €${(historyEntry.championId === gameState.userTeamId ? 50 : 1).toFixed(0)}M has been added to the budget.`,
            isRead: false,
            date: new Date().toISOString()
        }, ...gameState.messages]
    };

    return { newState, retired: retiredPlayerNames, promoted: promotedPlayerNames };
}

// ========== LIG KUPASI SYSTEM (Domestic Cup) ==========
import { EuropeanCup, EuropeanCupMatch } from '../types';

export const generateLeagueCup = (gameState: GameState): EuropeanCup => {
    // Use top 16 teams by reputation for knockout cup
    const sortedTeams = [...gameState.teams].sort((a, b) => b.reputation - a.reputation);
    const qualifiedTeamIds = sortedTeams.slice(0, Math.min(16, sortedTeams.length)).map(t => t.id);

    // Shuffle for randomized draw
    const shuffled = [...qualifiedTeamIds].sort(() => Math.random() - 0.5);

    // Determine round based on team count
    const teamCount = shuffled.length;
    let round: 'ROUND_16' | 'QUARTER' | 'SEMI' | 'FINAL' = 'QUARTER';
    if (teamCount >= 16) round = 'ROUND_16';
    else if (teamCount >= 8) round = 'QUARTER';
    else if (teamCount >= 4) round = 'SEMI';
    else round = 'FINAL';

    // Generate first round matches
    const firstRoundMatches: EuropeanCupMatch[] = [];
    const matchCount = Math.floor(teamCount / 2);

    for (let i = 0; i < matchCount; i++) {
        firstRoundMatches.push({
            id: uuid(),
            round: round,
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
        matches: firstRoundMatches,
        currentRound: round
    };
};

// Backwards compatible alias for old saves/code
export const generateEuropeanCup = generateLeagueCup;

// ========== CHAMPIONS LEAGUE (INTERNATIONAL) ==========
export const generateChampionsLeague = (gameState: GameState): EuropeanCup => {
    // 1. Get user league's top 4 teams
    const localTeams = [...gameState.teams]
        .sort((a, b) => b.stats.points - a.stats.points)
        .slice(0, 4);

    // 2. Generate foreign powerhouse teams from other leagues
    // We'll create temporary "Team" objects for them
    const foreignTeams: Team[] = [];

    // Hardcoded list of top European clubs to simulate
    const europeanGiants = [
        { name: 'Real Madrid', primaryColor: '#FFFFFF', secondaryColor: '#000000', reputation: 95 },
        { name: 'Man City', primaryColor: '#6CABDD', secondaryColor: '#FFFFFF', reputation: 94 },
        { name: 'Bayern', primaryColor: '#DC052D', secondaryColor: '#FFFFFF', reputation: 92 },
        { name: 'Liverpool', primaryColor: '#C8102E', secondaryColor: '#00B2A9', reputation: 90 },
        { name: 'PSG', primaryColor: '#004170', secondaryColor: '#DA291C', reputation: 89 },
        { name: 'Inter', primaryColor: '#010E80', secondaryColor: '#000000', reputation: 88 },
        { name: 'Arsenal', primaryColor: '#EF0107', secondaryColor: '#063672', reputation: 88 },
        { name: 'Barcelona', primaryColor: '#A50044', secondaryColor: '#004D98', reputation: 89 },
        { name: 'Atlético', primaryColor: '#CB3524', secondaryColor: '#272E61', reputation: 86 },
        { name: 'Leverkusen', primaryColor: '#E32221', secondaryColor: '#000000', reputation: 85 },
        { name: 'Milan', primaryColor: '#FB090B', secondaryColor: '#000000', reputation: 84 },
        { name: 'Juventus', primaryColor: '#000000', secondaryColor: '#FFFFFF', reputation: 84 }
    ];

    // Select 12 unique foreign teams
    const selectedGiants = [...europeanGiants]
        .filter(g => !gameState.teams.some(t => t.name.includes(g.name))) // Avoid duplicates if league is loaded
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);

    selectedGiants.forEach(giant => {
        // Create a dummy team object
        const dummyTeam: Team = {
            id: uuid(),
            name: giant.name,
            city: 'Europe',
            primaryColor: giant.primaryColor,
            secondaryColor: giant.secondaryColor,
            reputation: giant.reputation,
            leagueId: 'FOREIGN',
            budget: 100000000,
            wages: 2000000,
            facilities: { stadiumCapacity: 60000, stadiumLevel: 8, trainingLevel: 8, academyLevel: 8 },
            staff: { headCoachLevel: 8, scoutLevel: 8, physioLevel: 8 },
            objectives: [],
            tactic: {
                formation: TacticType.T_433, style: 'Possession', aggression: 'High', tempo: 'Fast', width: 'Wide',
                defensiveLine: 'High', passingStyle: 'Short', marking: 'Zonal'
            },
            coachArchetype: CoachArchetype.TACTICIAN,
            trainingFocus: 'BALANCED',
            trainingIntensity: 'NORMAL',
            youthCandidates: [],
            recentForm: [],
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
        };
        foreignTeams.push(dummyTeam);
    });

    // If we don't have enough foreign teams (e.g. user is playing PL), fill with more local
    while (foreignTeams.length < 12) {
        const nextBestLocal = [...gameState.teams]
            .sort((a, b) => b.stats.points - a.stats.points)
            .slice(localTeams.length + foreignTeams.length, localTeams.length + foreignTeams.length + 1)[0];
        if (nextBestLocal) foreignTeams.push(nextBestLocal);
        else break;
    }

    const allTeams = [...localTeams, ...foreignTeams];
    const qualifiedTeamIds = allTeams.map(t => t.id);

    // Shuffle
    const shuffled = [...qualifiedTeamIds].sort(() => Math.random() - 0.5);

    // Generate Round 16 matches (16 teams total)
    const matches: EuropeanCupMatch[] = [];
    for (let i = 0; i < 8; i++) {
        matches.push({
            id: uuid(),
            round: 'ROUND_16',
            homeTeamId: shuffled[i * 2],
            awayTeamId: shuffled[i * 2 + 1],
            homeScore: 0,
            awayScore: 0,
            isPlayed: false
        });
    }

    // WE MUST return a merged state essentially, but since we can't modify main team array 
    // to include these fake teams permanently, we will handle them in simulation only?
    // OR we temporarily add them to gameState.teams? 
    // BETTER: The UI uses `gameState.teams`. So we SHOULD add them to gameState.teams but marking them as 'FOREIGN'.
    // However, `generateChampionsLeague` only returns the cup object. 
    // The CALLER needs to add these teams to state.

    return {
        season: gameState.currentSeason,
        isActive: true,
        qualifiedTeamIds,
        matches,
        currentRound: 'ROUND_16',
        winnerId: undefined,
        _generatedForeignTeams: foreignTeams
    };
};
export const simulateEuropeanCupMatch = (
    cup: EuropeanCup,
    matchId: string,
    homeTeam: Team,
    awayTeam: Team,
    homePlayers: Player[],
    awayPlayers: Player[]
): EuropeanCup => {
    const match = cup.matches.find(m => m.id === matchId);
    if (!match || match.isPlayed) return cup;

    // Simple simulation based on team strength
    const homeStrength = homePlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(homePlayers.length, 1);
    const awayStrength = awayPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(awayPlayers.length, 1);

    const homeAdvantage = 3;
    const totalStrength = homeStrength + homeAdvantage + awayStrength;

    const homeWinChance = (homeStrength + homeAdvantage) / totalStrength;

    let homeScore = 0;
    let awayScore = 0;

    // Generate goals based on strength
    const totalGoals = Math.floor(Math.random() * 5) + 1; // 1-5 goals per match
    for (let i = 0; i < totalGoals; i++) {
        if (Math.random() < homeWinChance) {
            homeScore++;
        } else {
            awayScore++;
        }
    }

    // Handle draws with extra time simulation
    if (homeScore === awayScore) {
        if (Math.random() < homeWinChance) {
            homeScore++;
        } else {
            awayScore++;
        }
    }

    const winnerId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;

    // Update the match
    const updatedMatches = cup.matches.map(m =>
        m.id === matchId
            ? { ...m, homeScore, awayScore, isPlayed: true, winnerId }
            : m
    );

    // Check if round is complete
    const currentRoundMatches = updatedMatches.filter(m => m.round === cup.currentRound);
    const allPlayed = currentRoundMatches.every(m => m.isPlayed);

    let newRound = cup.currentRound;
    let newWinnerId = cup.winnerId;

    if (allPlayed) {
        const winners = currentRoundMatches.map(m => m.winnerId!);

        if (cup.currentRound === 'QUARTER') {
            // Generate Semi Finals
            const semis: EuropeanCupMatch[] = [
                { id: uuid(), round: 'SEMI', homeTeamId: winners[0], awayTeamId: winners[1], homeScore: 0, awayScore: 0, isPlayed: false },
                { id: uuid(), round: 'SEMI', homeTeamId: winners[2], awayTeamId: winners[3], homeScore: 0, awayScore: 0, isPlayed: false }
            ];
            updatedMatches.push(...semis);
            newRound = 'SEMI';
        } else if (cup.currentRound === 'SEMI') {
            // Generate Final
            const final: EuropeanCupMatch = {
                id: uuid(), round: 'FINAL', homeTeamId: winners[0], awayTeamId: winners[1], homeScore: 0, awayScore: 0, isPlayed: false
            };
            updatedMatches.push(final);
            newRound = 'FINAL';
        } else if (cup.currentRound === 'FINAL') {
            newRound = 'COMPLETE';
            newWinnerId = winners[0];
        }
    }

    return {
        ...cup,
        matches: updatedMatches,
        currentRound: newRound,
        winnerId: newWinnerId
    };
};

export const simulateAIEuropeanCupMatches = (cup: EuropeanCup, teams: Team[], players: Player[], userTeamId: string): EuropeanCup => {
    // Simulate all AI vs AI matches in current round
    let updatedCup = { ...cup };

    const currentRoundMatches = cup.matches.filter(m =>
        m.round === cup.currentRound &&
        !m.isPlayed &&
        m.homeTeamId !== userTeamId &&
        m.awayTeamId !== userTeamId
    );

    currentRoundMatches.forEach(match => {
        const homeTeam = teams.find(t => t.id === match.homeTeamId);
        const awayTeam = teams.find(t => t.id === match.awayTeamId);
        if (!homeTeam || !awayTeam) return;

        const homePlayers = players.filter(p => p.teamId === match.homeTeamId);
        const awayPlayers = players.filter(p => p.teamId === match.awayTeamId);

        updatedCup = simulateEuropeanCupMatch(updatedCup, match.id, homeTeam, awayTeam, homePlayers, awayPlayers);
    });

    return updatedCup;
};

