import { performance } from 'perf_hooks';
import {
    generateWorld,
    simulateLeagueRound,
    simulateAIGlobalCupMatches,
    advanceGlobalCupStage,
    processWeeklyEvents,
    generateGlobalCup,
    checkAndScheduleSuperCup
} from '../services/engine';
import { EN_TRANSLATIONS } from '../locales/en';

const t = EN_TRANSLATIONS as any;

const SEASONS = 1;
const START_LEAGUE = 'tr';

const logMem = (label: string) => {
    const mem = process.memoryUsage();
    const toMB = (v: number) => (v / 1024 / 1024).toFixed(1);
    console.log(`[MEM] ${label} RSS ${toMB(mem.rss)}MB | Heap ${toMB(mem.heapUsed)}MB / ${toMB(mem.heapTotal)}MB`);
};

const getLastWeek = (state: any) => {
    const matchWeeks = state.matches.map((m: any) => m.week || 0);
    const scWeek = state.superCup?.match?.week || 0;
    const last = Math.max(38, scWeek, ...matchWeeks);
    return last;
};

const run = () => {
    console.log(`Benchmark: ${SEASONS} season(s), league=${START_LEAGUE}`);

    let state = generateWorld(START_LEAGUE);

    // Seed cups for the season
    state.europeanCup = generateGlobalCup(state, 0);
    state.europaLeague = generateGlobalCup(state, 1);

    logMem('Start');

    const t0 = performance.now();
    let totalWeeks = 0;

    for (let season = 0; season < SEASONS; season++) {
        const lastWeek = getLastWeek(state);
        for (let week = 1; week <= lastWeek; week++) {
            state.currentWeek = week;

            // League matches
            state = simulateLeagueRound(state, week);

            // Cup matches (AI)
            if (state.europeanCup && state.europeanCup.isActive) {
                const { updatedCup, updatedTeams } = simulateAIGlobalCupMatches(
                    state.europeanCup,
                    state.teams,
                    state.players,
                    state.userTeamId,
                    state.currentWeek,
                    1.0
                );
                state = { ...state, europeanCup: updatedCup, teams: updatedTeams };
            }
            if (state.europaLeague && state.europaLeague.isActive) {
                const { updatedCup, updatedTeams } = simulateAIGlobalCupMatches(
                    state.europaLeague,
                    state.teams,
                    state.players,
                    state.userTeamId,
                    state.currentWeek,
                    0.5
                );
                state = { ...state, europaLeague: updatedCup, teams: updatedTeams };
            }

            // Advance cup stages
            if (state.europeanCup) {
                state.europeanCup = advanceGlobalCupStage(state.europeanCup);
            }
            if (state.europaLeague) {
                state.europaLeague = advanceGlobalCupStage(state.europaLeague);
            }

            // Schedule Super Cup if ready
            state = checkAndScheduleSuperCup(state);

            // Weekly events (transfers, reports, etc.)
            const weekly = processWeeklyEvents(state, t);
            state = {
                ...state,
                teams: weekly.updatedTeams,
                players: weekly.updatedPlayers,
                transferMarket: weekly.updatedMarket,
                pendingOffers: [...(state.pendingOffers || []), ...(weekly.newPendingOffers || [])],
                messages: [...(state.messages || []), ...weekly.offers],
            };

            totalWeeks++;
        }
    }

    const t1 = performance.now();
    const ms = t1 - t0;
    console.log(`Total weeks simulated: ${totalWeeks}`);
    console.log(`Total time: ${ms.toFixed(0)} ms`);
    console.log(`Avg per week: ${(ms / totalWeeks).toFixed(2)} ms`);

    logMem('End');
};

run();
