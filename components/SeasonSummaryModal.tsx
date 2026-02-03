import React from 'react';
import { GameState, Team, Translation } from '../types';
import { Trophy, ArrowRight, Shield, Award } from 'lucide-react';
import { getTeamLogo } from '../logoMapping';

interface SeasonSummaryModalProps {
    isOpen: boolean;
    gameState: GameState;
    t: Translation;
    onStartNewSeason: () => void;
}

export const SeasonSummaryModal: React.FC<SeasonSummaryModalProps> = ({ isOpen, gameState, t, onStartNewSeason }) => {
    if (!isOpen || !gameState) return null;

    // Calculate Season Stats
    const sortedTeams = [...gameState.teams]
        .filter(t => t.leagueId === gameState.leagueId)
        .sort((a, b) => b.stats.points - a.stats.points || (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga));

    const champion = sortedTeams[0];
    const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
    if (!userTeam) return null;

    const userRank = sortedTeams.findIndex(t => t.id === userTeam.id) + 1;
    const isChampion = userTeam.id === champion.id;

    // Find Cup Winners
    const clWinnerId = gameState.europeanCup?.winnerId;
    const clWinner = clWinnerId ? gameState.teams.find(t => t.id === clWinnerId) : null;

    // Check if user's league has relegation
    const relegatedTeams = sortedTeams.slice(-3); // Bottom 3

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-center border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-white px-4 py-2 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {t.seasonComplete || 'SEASON COMPLETE'}
                        </h2>
                        <div className="text-slate-400 font-mono mt-2">SEASON {gameState.currentSeason} Summary</div>
                    </div>
                </div>

                <div className="p-8 space-y-6">

                    {/* Champion Section */}
                    {champion && (
                        <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <img
                                        src={getTeamLogo(champion.name)}
                                        alt={champion.name}
                                        className="w-16 h-16 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    {/* Fallback handled by parent or CSS usually, or just show trophy */}
                                </div>
                                <div>
                                    <div className="text-xs uppercase text-emerald-500 font-bold tracking-wider mb-1">League Champion</div>
                                    <div className="text-2xl font-bold text-white">{champion.name}</div>
                                    <div className="text-slate-400 text-sm">{champion.stats.points} pts</div>
                                </div>
                            </div>
                            <Trophy size={48} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                        </div>
                    )}

                    {/* User Performance */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Your Details</h4>
                            <div className="text-xl font-bold text-white">{userTeam.name}</div>
                            <div className="text-sm text-slate-500">{userTeam.managerName}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Final Rank</h4>
                            <div className={`text-3xl font-black ${isChampion ? 'text-emerald-400' : 'text-white'}`}>
                                #{userRank}
                            </div>
                        </div>
                    </div>

                    {/* Global Cups */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clWinner && (
                            <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30 flex items-center gap-3">
                                <Award className="text-purple-400" />
                                <div>
                                    <div className="text-[10px] text-purple-300 uppercase font-bold">Global Elite Cup Winner</div>
                                    <div className="text-white font-bold">{clWinner.name}</div>
                                </div>
                            </div>
                        )}
                        {/* Can verify Europa winner if available */}
                    </div>

                    {/* Relegation Zone (Visual only) */}
                    <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20">
                        <h4 className="text-red-400 text-xs uppercase font-bold mb-3 flex items-center gap-2">
                            <Shield size={12} /> Relegation Zone
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {relegatedTeams.map(t => (
                                <span key={t.id} className="bg-red-900/30 text-red-200 px-3 py-1 rounded-lg text-xs border border-red-500/20">
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onStartNewSeason}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <span>{t.startNewSeason || 'Start New Season'}</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                </div>
            </div>
        </div>
    );
};
