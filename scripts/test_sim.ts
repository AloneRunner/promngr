import { createEngineInstance } from '../services/engines/index.ts';
import { Position, TacticType } from '../src/types.ts';

console.log('test_sim: Testing CLASSIC engine with 4-4-2 Attacking');

function makePlayer(id: number, teamId: string, role: Position) {
    return {
        id: `p${teamId}${id}`,
        firstName: `Player${id}`,
        lastName: `T${teamId}`,
        age: 25,
        nationality: 'TR',
        position: role,
        attributes: {
            finishing: 60, passing: 65, tackling: 55, dribbling: 65, goalkeeping: 10,
            speed: 65, stamina: 80, strength: 60, positioning: 60, aggression: 55,
            composure: 60, vision: 60, leadership: 50, decisions: 60
        },
        hiddenAttributes: { consistency: 70, importantMatches: 70, injuryProneness: 5 },
        stats: {}, overall: 65, potential: 70, value: 100000, wage: 1000, salary: 1000,
        contractYears: 2, morale: 70, condition: 100, form: 70, teamId: teamId,
        isTransferListed: false, weeksInjured: 0, matchSuspension: 0, lineup: 'STARTING', lineupIndex: id,
        jerseyNumber: id, playStyles: []
    } as any;
}

function makeTeam(id: string, name: string, formation: any, style: string) {
    return {
        id,
        name,
        city: 'City',
        primaryColor: '#000', secondaryColor: '#fff', reputation: 50, budget: 1000000,
        boardConfidence: 50, leagueId: 'L1', wages: 100000,
        facilities: { stadiumCapacity: 10000, stadiumLevel: 1, trainingLevel: 1, academyLevel: 1 },
        staff: { headCoachLevel: 1, scoutLevel: 1, physioLevel: 1 },
        objectives: [], tactic: { formation, style, aggression: 'Normal', tempo: 'Normal', width: 'Normal', defensiveLine: 'Normal', passingStyle: 'Balanced' },
        coachArchetype: 'TACTICIAN', trainingFocus: 'BALANCED', trainingIntensity: 'NORMAL', youthCandidates: [], recentForm: [], stats: {}
    } as any;
}

(async () => {
    const match = { id: 'm1', week: 1, homeTeamId: 'h1', awayTeamId: 'a1', homeScore: 0, awayScore: 0, events: [], isPlayed: false, date: Date.now(), currentMinute: 0, weather: 'Clear', timeOfDay: 'Day', stats: {} } as any;

    // 4-4-2 Attacking vs Balanced
    const home = makeTeam('h1', 'Home FC', TacticType.T_442, 'Attacking');
    const away = makeTeam('a1', 'Away FC', TacticType.T_442, 'Balanced');

    const homePlayers = [] as any[];
    const awayPlayers = [] as any[];

    // 4-4-2: GK=1, DEF=2-5, MID=6-9, FWD=10-11
    for (let i = 1; i <= 11; i++) {
        const role = i === 1 ? Position.GK : (i <= 5 ? Position.DEF : (i <= 9 ? Position.MID : Position.FWD));
        homePlayers.push(makePlayer(i, 'h1', role));
        awayPlayers.push(makePlayer(i, 'a1', role));
    }

    const engine = createEngineInstance('classic', match, home, away, homePlayers, awayPlayers, 'h1');

    console.log('Pitch: 105x68, stripes=12 (each ~8.75m)');
    console.log('Base MID pos for 4-4-2: xPos(50) = 52.5m (PITCH_CENTER_X)');
    console.log('');

    // Log MID positions at various intervals
    const STRIPE_SIZE = 105 / 12;

    function logMidPositions(label: string) {
        const ballX = engine.sim.ball.x;
        const ballOwner = engine.sim.ball.ownerId || 'none';
        const ownerTeam = ballOwner !== 'none' ? (ballOwner.includes('h1') ? 'HOME' : 'AWAY') : 'NONE';

        console.log(`\n--- ${label} | Ball: x=${ballX.toFixed(1)} owner=${ownerTeam} ---`);

        // Home MIDs (p h1 6-9)
        for (let i = 6; i <= 9; i++) {
            const id = `ph1${i}`;
            const s = engine.sim.players[id];
            if (s) {
                const baseX = engine.baseOffsets[id]?.x || 52.5;
                const advance = s.x - baseX;
                const stripes = advance / STRIPE_SIZE;
                const role = engine.playerRoles[id];
                console.log(`  HOME MID${i-5}: x=${s.x.toFixed(1)} (base=${baseX.toFixed(1)}, advance=${advance.toFixed(1)}m = ${stripes.toFixed(1)} stripes) y=${s.y.toFixed(1)} role=${role}`);
            }
        }

        // Away MIDs for comparison
        for (let i = 6; i <= 9; i++) {
            const id = `pa1${i}`;
            const s = engine.sim.players[id];
            if (s) {
                const baseX = engine.baseOffsets[id]?.x || 52.5;
                const advance = baseX - s.x; // away team advances toward x=0
                const stripes = advance / STRIPE_SIZE;
                console.log(`  AWAY MID${i-5}: x=${s.x.toFixed(1)} (base=${baseX.toFixed(1)}, advance=${advance.toFixed(1)}m = ${stripes.toFixed(1)} stripes) y=${s.y.toFixed(1)}`);
            }
        }
    }

    // Run 300 ticks (5 minutes) and log every 30 ticks (30 seconds)
    console.log('Running 300 ticks (5 game minutes)...');

    for (let t = 0; t < 300; t++) {
        engine.step();
        if (t % 30 === 0) {
            logMidPositions(`Tick ${t} (min ${(t/60).toFixed(1)})`);
        }
    }

    logMidPositions('FINAL (min 5.0)');

    // Summary statistics
    console.log('\n=== SUMMARY ===');
    let homeMaxAdvance = 0;
    let homeMinAdvance = 999;
    for (let i = 6; i <= 9; i++) {
        const id = `ph1${i}`;
        const s = engine.sim.players[id];
        if (s) {
            const baseX = engine.baseOffsets[id]?.x || 52.5;
            const advance = s.x - baseX;
            homeMaxAdvance = Math.max(homeMaxAdvance, advance);
            homeMinAdvance = Math.min(homeMinAdvance, advance);
        }
    }
    console.log(`Home MID advance range: ${homeMinAdvance.toFixed(1)}m to ${homeMaxAdvance.toFixed(1)}m`);
    console.log(`In stripes: ${(homeMinAdvance/STRIPE_SIZE).toFixed(1)} to ${(homeMaxAdvance/STRIPE_SIZE).toFixed(1)} stripes`);

    console.log('\nDone.');
})();
