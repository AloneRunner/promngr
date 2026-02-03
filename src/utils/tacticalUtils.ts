import { GameState, Team, Player, TeamTactic } from '../types';

export const TACTICAL_PRESETS: Record<string, Partial<TeamTactic>> = {
    'Gegenpress': { style: 'HighPress', aggression: 'Aggressive', tempo: 'Fast', defensiveLine: 'High' },
    'ParkTheBus': { style: 'ParkTheBus', aggression: 'Safe', tempo: 'Slow', defensiveLine: 'Deep' },
    'TikiTaka': { style: 'Possession', aggression: 'Normal', tempo: 'Normal', passingStyle: 'Short' }
};

export const runTacticalAnalysis = async (
    gameState: GameState,
    simulateFn: (m: any, h: Team, a: Team, hp: Player[], ap: Player[]) => any
) => {
    console.log("Running tactical analysis...");
    if (gameState.teams.length < 2) return;

    const teamA = gameState.teams[0];
    const teamB = gameState.teams[1];
    const pA = gameState.players.filter(p => p.teamId === teamA.id);
    const pB = gameState.players.filter(p => p.teamId === teamB.id);

    // 100 maç simüle et
    let winsA = 0, winsB = 0, draws = 0;
    for (let i = 0; i < 100; i++) {
        const match = { id: 'sim', homeTeamId: teamA.id, awayTeamId: teamB.id, homeScore: 0, awayScore: 0, events: [], stats: {}, isPlayed: false };
        const res = simulateFn(match, teamA, teamB, pA, pB);
        if (res.homeScore > res.awayScore) winsA++;
        else if (res.awayScore > res.homeScore) winsB++;
        else draws++;
    }
    console.log(`Results: ${teamA.name} ${winsA} - ${draws} - ${winsB} ${teamB.name}`);
};
