import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { GameState, Team, Player, Match } from '../types';
import { simulateFullMatch } from '../services/engine';
import { BarChart3, FlaskConical, Play, RefreshCw, X } from 'lucide-react';

interface TacticalAnalysisProps {
    gameState: GameState;
    onClose: () => void;
    currentLang: 'tr' | 'en' | 'es' | 'fr' | 'ru' | 'id';
}

export const TacticalAnalysis: React.FC<TacticalAnalysisProps> = ({ gameState, onClose, currentLang }) => {
    const t = TRANSLATIONS[currentLang];
    const [teamAId, setTeamAId] = useState<string>(gameState.userTeamId);
    const [teamBId, setTeamBId] = useState<string>(gameState.teams.find(t => t.id !== gameState.userTeamId)?.id || '');
    const [isSimulating, setIsSimulating] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const teamA = gameState.teams.find(t => t.id === teamAId);
    const teamB = gameState.teams.find(t => t.id === teamBId);

    const runAnalysis = async () => {
        if (!teamA || !teamB) return;
        setIsSimulating(true);
        setResults([]);

        // Small delay to allow UI to update
        setTimeout(() => {
            const playersA = gameState.players.filter(p => p.teamId === teamA.id);
            const playersB = gameState.players.filter(p => p.teamId === teamB.id);

            const scenarios = [
                { name: "BASELINE (Current Tactics)", setup: () => { } },
                {
                    name: "TEMPO: Fast vs Slow", setup: (tmA: Team, tmB: Team) => {
                        tmA.tactic.tempo = 'Fast';
                        tmB.tactic.tempo = 'Slow';
                    }
                },
                {
                    name: "STYLE: Possession vs Counter", setup: (tmA: Team, tmB: Team) => {
                        tmA.tactic.style = 'Possession';
                        tmB.tactic.style = 'Counter';
                        tmA.tactic.formation = '4-3-3'; // Ideal for Poss
                        tmB.tactic.formation = '5-3-2'; // Ideal for Counter
                    }
                },
                {
                    name: "JUGGERNAUT: High Press vs High Press", setup: (tmA: Team, tmB: Team) => {
                        tmA.tactic.style = 'HighPress';
                        tmB.tactic.style = 'HighPress';
                        tmA.tactic.aggression = 'Aggressive';
                        tmB.tactic.aggression = 'Aggressive';
                    }
                }
            ];

            const newResults = scenarios.map(scenario => {
                // Clone needed data
                const cloneA = JSON.parse(JSON.stringify(teamA));
                const cloneB = JSON.parse(JSON.stringify(teamB));

                // Apply scenario
                scenario.setup(cloneA, cloneB);

                let winsA = 0, winsB = 0, draws = 0;
                let goalsA = 0, goalsB = 0;

                // Run 50 simulations per scenario
                for (let i = 0; i < 50; i++) {
                    const match: any = {
                        id: 'sim_' + i, homeTeamId: cloneA.id, awayTeamId: cloneB.id,
                        homeScore: 0, awayScore: 0, events: [], stats: {}, isPlayed: false,
                        currentMinute: 0
                    };

                    const result = simulateFullMatch(match, cloneA, cloneB, playersA, playersB);
                    goalsA += result.homeScore;
                    goalsB += result.awayScore;

                    if (result.homeScore > result.awayScore) winsA++;
                    else if (result.awayScore > result.homeScore) winsB++;
                    else draws++;
                }

                return {
                    name: scenario.name,
                    winsA, winsB, draws,
                    avgGoalsA: (goalsA / 50).toFixed(1),
                    avgGoalsB: (goalsB / 50).toFixed(1)
                };
            });

            setResults(newResults);
            setIsSimulating(false);
        }, 100);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <FlaskConical className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Tactical Analysis Lab</h2>
                            <p className="text-slate-400 text-sm">Simulate 50 matches per scenario to test tactical matchups</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Team Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Home Team (Team A)</label>
                            <select
                                value={teamAId}
                                onChange={(e) => setTeamAId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {gameState.teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} (OvR: {Math.floor(t.reputation / 100)})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Away Team (Team B)</label>
                            <select
                                value={teamBId}
                                onChange={(e) => setTeamBId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {gameState.teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} (OvR: {Math.floor(t.reputation / 100)})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={runAnalysis}
                            disabled={isSimulating || !teamA || !teamB}
                            className={`
                                flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transform transition-all
                                ${isSimulating ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white'}
                            `}
                        >
                            {isSimulating ? (
                                <><RefreshCw className="w-5 h-5 animate-spin" /> Simulating 200 Matches...</>
                            ) : (
                                <><Play className="w-5 h-5 fill-current" /> Run Simulation</>
                            )}
                        </button>
                    </div>

                    {/* Results */}
                    {results.length > 0 && (
                        <div className="grid gap-4">
                            {results.map((res, idx) => (
                                <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-indigo-400">{res.name}</h3>
                                        <div className="text-slate-500 text-sm font-mono">50 Matches</div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Team A Bar */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-white">{teamA?.name}</span>
                                                <span className="text-emerald-400">{res.winsA} Wins ({((res.winsA / 50) * 100).toFixed(0)}%)</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(res.winsA / 50) * 100}%` }}></div>
                                            </div>
                                            <div className="text-[10px] text-slate-500">Avg Goals: {res.avgGoalsA}</div>
                                        </div>

                                        {/* Draws */}
                                        <div className="w-16 text-center space-y-1">
                                            <div className="text-xs font-bold text-slate-400">Draws</div>
                                            <div className="text-xl font-black text-white">{res.draws}</div>
                                            <div className="text-[10px] text-slate-600">{((res.draws / 50) * 100).toFixed(0)}%</div>
                                        </div>

                                        {/* Team B Bar */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-rose-400">{res.winsB} Wins ({((res.winsB / 50) * 100).toFixed(0)}%)</span>
                                                <span className="text-white">{teamB?.name}</span>
                                            </div>
                                            <div className="flex justify-end h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500" style={{ width: `${(res.winsB / 50) * 100}%` }}></div>
                                            </div>
                                            <div className="text-[10px] text-slate-500 text-right">Avg Goals: {res.avgGoalsB}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
