import React, { useState, useEffect } from 'react';
import { GameState, Team, Player, Match, TeamTactic } from '../types';
import { simulateFullMatch } from '../services/engine';
import { Play, RotateCcw, BarChart3, Shield, Swords, Info, X } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface TacticalAnalysisProps {
    gameState: GameState;
    onClose: () => void;
    currentLang: string;
}

export const TacticalAnalysis: React.FC<TacticalAnalysisProps> = ({ gameState, onClose, currentLang }) => {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    // State for team selection
    const [teamAId, setTeamAId] = useState<string>(gameState.teams[0]?.id || '');
    const [teamBId, setTeamBId] = useState<string>(gameState.teams[1]?.id || '');

    // State for tactics
    const [tacticA, setTacticA] = useState<TeamTactic>(gameState.teams[0]?.tactic);
    const [tacticB, setTacticB] = useState<TeamTactic>(gameState.teams[1]?.tactic);

    // State for simulation
    const [simCount, setSimCount] = useState<number>(50);
    const [isSimulating, setIsSimulating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<{
        winsA: number;
        winsB: number;
        draws: number;
        goalsA: number;
        goalsB: number;
        avgPossessionA: number;
        avgShotsA: number;
        avgShotsB: number;
    } | null>(null);

    // Sync tactics when teams change
    useEffect(() => {
        const team = gameState.teams.find(t => t.id === teamAId);
        if (team) setTacticA(JSON.parse(JSON.stringify(team.tactic)));
    }, [teamAId, gameState.teams]);

    useEffect(() => {
        const team = gameState.teams.find(t => t.id === teamBId);
        if (team) setTacticB(JSON.parse(JSON.stringify(team.tactic)));
    }, [teamBId, gameState.teams]);

    const runSimulation = async () => {
        setIsSimulating(true);
        setResults(null);
        setProgress(0);

        // Allow UI to update before heavy processing
        setTimeout(() => {
            const teamAOrigin = gameState.teams.find(t => t.id === teamAId);
            const teamBOrigin = gameState.teams.find(t => t.id === teamBId);

            if (!teamAOrigin || !teamBOrigin) return;

            // Clone teams to not affect main game state
            const teamA = JSON.parse(JSON.stringify(teamAOrigin));
            const teamB = JSON.parse(JSON.stringify(teamBOrigin));

            // Apply selected tactics
            teamA.tactic = tacticA;
            teamB.tactic = tacticB;

            // Clone players
            const playersA = gameState.players.filter(p => p.teamId === teamA.id).map(p => ({ ...p }));
            let playersB = gameState.players.filter(p => p.teamId === teamB.id).map(p => ({ ...p }));

            // If same team, we need to clone players with new IDs for Team B to avoid collision
            if (teamA.id === teamB.id) {
                teamB.id = teamB.id + '_clone';
                teamB.name = teamB.name + ' (B)';
                playersB = playersB.map(p => ({ ...p, id: p.id + '_B', teamId: teamB.id }));
            }

            let winsA = 0, winsB = 0, draws = 0;
            let totalGoalsA = 0, totalGoalsB = 0;
            let totalPossessionA = 0;
            let totalShotsA = 0, totalShotsB = 0;

            const batchSize = 10;
            let completed = 0;

            const processBatch = () => {
                const limit = Math.min(completed + batchSize, simCount);
                for (let i = completed; i < limit; i++) {
                    const match: any = {
                        id: 'sim_' + i,
                        homeTeamId: teamA.id,
                        awayTeamId: teamB.id,
                        homeScore: 0,
                        awayScore: 0,
                        events: [],
                        stats: { homePossession: 50, homeShots: 0, awayShots: 0 },
                        isPlayed: false,
                        currentMinute: 0
                    };

                    // Reset form/morale for fair testing
                    teamA.recentForm = [];
                    teamB.recentForm = [];

                    const result = simulateFullMatch(match, teamA, teamB, playersA, playersB);

                    totalGoalsA += result.homeScore;
                    totalGoalsB += result.awayScore;

                    if (result.homeScore > result.awayScore) winsA++;
                    else if (result.awayScore > result.homeScore) winsB++;
                    else draws++;

                    totalPossessionA += result.stats.homePossession || 50;
                    totalShotsA += result.stats.homeShots || 0;
                    totalShotsB += result.stats.awayShots || 0;
                }

                completed = limit;
                setProgress(Math.floor((completed / simCount) * 100));

                if (completed < simCount) {
                    setTimeout(processBatch, 0); // Scheduling next batch
                } else {
                    // Done
                    setResults({
                        winsA, winsB, draws,
                        goalsA: totalGoalsA, goalsB: totalGoalsB,
                        avgPossessionA: totalPossessionA / simCount,
                        avgShotsA: totalShotsA / simCount,
                        avgShotsB: totalShotsB / simCount
                    });
                    setIsSimulating(false);
                }
            };

            processBatch();
        }, 100);
    };

    const formations = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-1-4-1', '4-5-1', '3-4-3', '4-1-2-1-2', '4-3-2-1'];
    const mentalities = ['Defensive', 'Balanced', 'Attacking', 'Possession', 'HighPress', 'Counter', 'ParkTheBus', 'Gegenpress'];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Swords className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Tactical Analysis Lab</h2>
                            <p className="text-slate-400 text-sm">Simulate matches to test tactical effectiveness</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* TEAM A SETUP */}
                    <div className="space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <h3 className="font-bold text-blue-100">HOME TEAM</h3>
                        </div>

                        <select
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                            value={teamAId}
                            onChange={(e) => setTeamAId(e.target.value)}
                        >
                            {gameState.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Formation</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mt-1"
                                    value={tacticA?.formation}
                                    onChange={(e) => setTacticA({ ...tacticA, formation: e.target.value })}
                                >
                                    {formations.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Style</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mt-1"
                                    value={tacticA?.style}
                                    onChange={(e) => setTacticA({ ...tacticA, style: e.target.value })}
                                >
                                    {mentalities.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Tempo</label>
                                <div className="flex gap-2 mt-1">
                                    {['Slow', 'Normal', 'Fast'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setTacticA({ ...tacticA, tempo: mode as any })}
                                            className={`flex-1 py-1 text-xs rounded ${tacticA?.tempo === mode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CENTER CONTROLS */}
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="text-center space-y-2">
                            <label className="text-slate-400 text-sm font-medium">Simulation Count</label>
                            <div className="flex items-center justify-center gap-2">
                                {[10, 50, 100, 200].map(count => (
                                    <button
                                        key={count}
                                        onClick={() => setSimCount(count)}
                                        className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${simCount === count ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={runSimulation}
                            disabled={isSimulating}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                                ${isSimulating ? 'bg-slate-700 cursor-not-allowed text-slate-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/20'}
                            `}
                        >
                            {isSimulating ? (
                                <>
                                    <RotateCcw className="w-6 h-6 animate-spin" />
                                    Simulating... {progress}%
                                </>
                            ) : (
                                <>
                                    <Play className="w-6 h-6 fill-current" />
                                    START SIMULATION
                                </>
                            )}
                        </button>

                        <div className="text-xs text-slate-500 text-center max-w-[200px]">
                            <Info className="w-4 h-4 inline-block mr-1 mb-0.5" />
                            Simulations run in background. Results may vary slightly due to RNG.
                        </div>
                    </div>

                    {/* TEAM B SETUP */}
                    <div className="space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-red-400" />
                            <h3 className="font-bold text-red-100">AWAY TEAM</h3>
                        </div>

                        <select
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                            value={teamBId}
                            onChange={(e) => setTeamBId(e.target.value)}
                        >
                            {gameState.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Formation</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mt-1"
                                    value={tacticB?.formation}
                                    onChange={(e) => setTacticB({ ...tacticB, formation: e.target.value })}
                                >
                                    {formations.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Style</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mt-1"
                                    value={tacticB?.style}
                                    onChange={(e) => setTacticB({ ...tacticB, style: e.target.value })}
                                >
                                    {mentalities.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Tempo</label>
                                <div className="flex gap-2 mt-1">
                                    {['Slow', 'Normal', 'Fast'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setTacticB({ ...tacticB, tempo: mode as any })}
                                            className={`flex-1 py-1 text-xs rounded ${tacticB?.tempo === mode ? 'bg-red-600/80 text-white' : 'bg-slate-700 text-slate-400'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESULTS SECTION */}
                {results && (
                    <div className="p-6 bg-slate-950/50 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-center text-xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                            <BarChart3 className="w-6 h-6 text-emerald-400" />
                            Simulation Results ({simCount} Matches)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Win Rate Stats */}
                            <div className="flex items-end justify-between px-8 relative h-32">
                                {/* HOME BAR */}
                                <div className="group relative flex flex-col items-center w-24">
                                    <div className="text-2xl font-bold text-blue-400 mb-2">
                                        {((results.winsA / simCount) * 100).toFixed(1)}%
                                    </div>
                                    <div
                                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000"
                                        style={{ height: `${(results.winsA / simCount) * 120}px` }}
                                    ></div>
                                    <div className="mt-2 font-bold text-blue-200">HOME</div>
                                </div>

                                {/* DRAW BAR */}
                                <div className="group relative flex flex-col items-center w-16 opacity-70">
                                    <div className="text-lg font-bold text-slate-400 mb-1">
                                        {((results.draws / simCount) * 100).toFixed(1)}%
                                    </div>
                                    <div
                                        className="w-full bg-slate-600 rounded-t-lg transition-all duration-1000"
                                        style={{ height: `${(results.draws / simCount) * 120}px` }}
                                    ></div>
                                    <div className="mt-2 text-xs font-bold text-slate-400">DRAW</div>
                                </div>

                                {/* AWAY BAR */}
                                <div className="group relative flex flex-col items-center w-24">
                                    <div className="text-2xl font-bold text-red-400 mb-2">
                                        {((results.winsB / simCount) * 100).toFixed(1)}%
                                    </div>
                                    <div
                                        className="w-full bg-red-500 rounded-t-lg transition-all duration-1000"
                                        style={{ height: `${(results.winsB / simCount) * 120}px` }}
                                    ></div>
                                    <div className="mt-2 font-bold text-red-200">AWAY</div>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div className="col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-xs uppercase font-bold">Goals per Match</div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-2xl font-bold text-blue-400">{(results.goalsA / simCount).toFixed(2)}</span>
                                            <span className="text-slate-600 text-sm">vs</span>
                                            <span className="text-2xl font-bold text-red-400">{(results.goalsB / simCount).toFixed(2)}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${(results.goalsA / (results.goalsA + results.goalsB || 1)) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-red-500"
                                                style={{ width: `${(results.goalsB / (results.goalsA + results.goalsB || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-xs uppercase font-bold">Possession Share</div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-2xl font-bold text-blue-400">{results.avgPossessionA.toFixed(1)}%</span>
                                            <span className="text-slate-600 text-sm">vs</span>
                                            <span className="text-2xl font-bold text-red-400">{(100 - results.avgPossessionA).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${results.avgPossessionA}%` }}
                                            />
                                            <div
                                                className="h-full bg-red-500"
                                                style={{ width: `${100 - results.avgPossessionA}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-xs uppercase font-bold">Shots per Match</div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-2xl font-bold text-blue-400">{results.avgShotsA.toFixed(1)}</span>
                                            <span className="text-slate-600 text-sm">vs</span>
                                            <span className="text-2xl font-bold text-red-400">{results.avgShotsB.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${(results.avgShotsA / (results.avgShotsA + results.avgShotsB || 1)) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-red-500"
                                                style={{ width: `${(results.avgShotsB / (results.avgShotsA + results.avgShotsB || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-slate-500 text-xs font-bold uppercase mb-1">ANALYSIS</div>
                                            <div className="text-emerald-400 font-bold">
                                                {results.winsA > results.winsB + (simCount * 0.1)
                                                    ? `${gameState.teams.find(t => t.id === teamAId)?.name} Dominating`
                                                    : results.winsB > results.winsA + (simCount * 0.1)
                                                        ? `${gameState.teams.find(t => t.id === teamBId)?.name} Dominating`
                                                        : "Balanced Matchup"
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
