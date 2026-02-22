import { createEngineInstance } from '../services/engines/index.js';
import { Position, TacticType } from '../src/types.js';
function makePlayer(id, teamId, role) {
    return {
        id: `p${teamId}${id}`,
        firstName: `Player${id}`,
        lastName: `T${teamId}`,
        age: 25,
        nationality: 'TR',
        position: role,
        attributes: {
            finishing: 60, passing: 65, tackling: 55, dribbling: 65, goalkeeping: 10,
            speed: 60, stamina: 80, strength: 60, positioning: 60, aggression: 55,
            composure: 60, vision: 60, leadership: 50, decisions: 60
        },
        hiddenAttributes: { consistency: 70, importantMatches: 70, injuryProneness: 5 },
        stats: {}, overall: 65, potential: 70, value: 100000, wage: 1000, salary: 1000,
        contractYears: 2, morale: 70, condition: 100, form: 70, teamId: teamId,
        isTransferListed: false, weeksInjured: 0, matchSuspension: 0, lineup: 'STARTING', lineupIndex: id,
        jerseyNumber: id, playStyles: []
    };
}
function makeTeam(id, name) {
    return {
        id,
        name,
        city: 'City',
        primaryColor: '#000', secondaryColor: '#fff', reputation: 50, budget: 1000000,
        boardConfidence: 50, leagueId: 'L1', wages: 100000,
        facilities: { stadiumCapacity: 10000, stadiumLevel: 1, trainingLevel: 1, academyLevel: 1 },
        staff: { headCoachLevel: 1, scoutLevel: 1, physioLevel: 1 },
        objectives: [], tactic: { formation: TacticType.T_433, style: 'Balanced', aggression: 'Normal', tempo: 'Normal', width: 'Normal', defensiveLine: 'Normal', passingStyle: 'Balanced' },
        coachArchetype: 'TACTICIAN', trainingFocus: 'BALANCED', trainingIntensity: 'NORMAL', youthCandidates: [], recentForm: [], stats: {}
    };
}
(async () => {
    const match = { id: 'm1', week: 1, homeTeamId: 'h1', awayTeamId: 'a1', homeScore: 0, awayScore: 0, events: [], isPlayed: false, date: Date.now(), currentMinute: 0, weather: 'Clear', timeOfDay: 'Day', stats: {} };
    const home = makeTeam('h1', 'Home');
    const away = makeTeam('a1', 'Away');
    const homePlayers = [];
    const awayPlayers = [];
    for (let i = 1; i <= 11; i++) {
        const role = i === 1 ? Position.GK : (i <= 5 ? Position.DEF : (i <= 8 ? Position.MID : Position.FWD));
        homePlayers.push(makePlayer(i, 'h1', role));
        awayPlayers.push(makePlayer(i, 'a1', role));
    }
    const engine = createEngineInstance('ikinc', match, home, away, homePlayers, awayPlayers, 'h1');
    console.log('Starting quick sim (60 ticks)...');
    for (let t = 0; t < 60; t++) {
        engine.step();
        if (t % 10 === 0) {
            const sample = Object.keys(engine.sim.players).slice(0, 6).map((id) => {
                const s = engine.sim.players[id];
                return `${id}(${s.x.toFixed(1)},${s.y.toFixed(1)})`;
            }).join(' | ');
            console.log(`Tick ${t}: ${sample}`);
        }
    }
    // After run: dump some stats
    console.log('\n--- Final sample positions ---');
    Object.keys(engine.sim.players).slice(0, 12).forEach((id) => {
        const s = engine.sim.players[id];
        console.log(`${id}: x=${s.x.toFixed(1)}, y=${s.y.toFixed(1)}, state=${s.state || 'N/A'}`);
    });
    // Dump a few playerStates regarding signals
    console.log('\n--- Player signals ---');
    const ps = engine.playerStates;
    Object.keys(ps).slice(0, 12).forEach((id) => {
        const st = ps[id];
        console.log(`${id}: incoming=${st.incomingSignal ? st.incomingSignal.type : '-'} lastSignalTick=${st.lastIncomingSignalTick || '-'} supportRunUntil=${st.supportRunUntil || '-'}`);
    });
    console.log('\nTrace log snapshot (last 30 lines):');
    const tl = engine.traceLog || [];
    tl.slice(-30).forEach((l) => console.log(l));
    console.log('Done.');
})();
