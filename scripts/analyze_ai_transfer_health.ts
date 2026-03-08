import {
    advanceGlobalCupStage,
    checkAndScheduleSuperCup,
    generateGlobalCup,
    generateWorld,
    processSeasonEnd,
    processWeeklyEvents,
    simulateAIGlobalCupMatches,
    simulateLeagueRound,
} from '../services/engine';
import { EN_TRANSLATIONS } from '../locales/en';

const t = EN_TRANSLATIONS as any;

const getLastWeek = (state: any) => {
    const matchWeeks = state.matches.map((match: any) => match.week || 0);
    const superCupWeek = state.superCup?.match?.week || 0;
    return Math.max(38, superCupWeek, ...matchWeeks);
};

const run = () => {
    let state = generateWorld('tr');
    state.europeanCup = generateGlobalCup(state, 0);
    state.europaLeague = generateGlobalCup(state, 1);

    for (let season = 1; season <= 4; season++) {
        const lastWeek = getLastWeek(state);

        for (let week = 1; week <= lastWeek; week++) {
            state.currentWeek = week;
            state = simulateLeagueRound(state, week);

            if (state.europeanCup && state.europeanCup.isActive) {
                const { updatedCup, updatedTeams } = simulateAIGlobalCupMatches(
                    state.europeanCup,
                    state.teams,
                    state.players,
                    state.userTeamId,
                    state.currentWeek,
                    1.0,
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
                    0.5,
                );
                state = { ...state, europaLeague: updatedCup, teams: updatedTeams };
            }

            if (state.europeanCup) {
                state.europeanCup = advanceGlobalCupStage(state.europeanCup);
            }
            if (state.europaLeague) {
                state.europaLeague = advanceGlobalCupStage(state.europaLeague);
            }

            state = checkAndScheduleSuperCup(state);

            const weekly = processWeeklyEvents(state, t, 'NORMAL');
            state = {
                ...state,
                teams: weekly.updatedTeams,
                players: weekly.updatedPlayers,
                transferMarket: weekly.updatedMarket,
                pendingOffers: [...(state.pendingOffers || []), ...(weekly.newPendingOffers || [])],
                messages: [...(state.messages || []), ...weekly.offers],
            };
        }

        state = processSeasonEnd(state, t);
        state.currentSeason += 1;
        state.currentWeek = 1;
        state.europeanCup = generateGlobalCup(state, 0);
        state.europaLeague = generateGlobalCup(state, 1);
    }

    const aiTeams = state.teams.filter((team: any) => team.id !== state.userTeamId);
    const players = state.players;
    const richestTeams = [...aiTeams].sort((a: any, b: any) => b.budget - a.budget).slice(0, 12);
    const listedOrExpiring = players.filter(
        (player: any) =>
            player.teamId !== state.userTeamId &&
            (player.isTransferListed || (player.contractYears ?? 99) <= 1 || player.teamId === 'FREE_AGENT'),
    );
    const strongMarket = listedOrExpiring.filter((player: any) => player.overall >= 75);
    const allStrongNonUser = players.filter((player: any) => player.teamId !== state.userTeamId && player.overall >= 75);

    const avg = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

    console.log(
        JSON.stringify(
            {
                season: state.currentSeason,
                avgTop12Budget: avg(richestTeams.map((team: any) => team.budget)),
                richestTeams: richestTeams.map((team: any) => ({
                    name: team.name,
                    budget: Math.round(team.budget),
                    reputation: team.reputation,
                })),
                marketPool: {
                    listedOrExpiringCount: listedOrExpiring.length,
                    strongMarketCount: strongMarket.length,
                    allStrongNonUserCount: allStrongNonUser.length,
                    avgStrongMarketValue: avg(strongMarket.map((player: any) => player.value)),
                    avgAllStrongValue: avg(allStrongNonUser.map((player: any) => player.value)),
                },
            },
            null,
            2,
        ),
    );
};

run();