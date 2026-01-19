
import React, { useState } from 'react';
import { Team, Player, Translation, Position, TacticalMatchRecord } from '../types';
import { Shield, Target, TrendingUp, TrendingDown, Minus, Users, Zap, AlertTriangle, Brain } from 'lucide-react';
import { AssistantCoachModal } from './AssistantCoachModal';
import { getTeamLogo } from '../logoMapping';
import { adMobService } from '../services/adMobService';

interface OpponentPreviewProps {
    opponent: Team;
    opponentPlayers: Player[];
    userTeam: Team;
    t: Translation;
    tacticalHistory: TacticalMatchRecord[];
    onClose: () => void;
    onStartMatch: () => void;
}

export const OpponentPreview: React.FC<OpponentPreviewProps> = ({
    opponent,
    opponentPlayers,
    userTeam,
    t,
    tacticalHistory,
    onClose,
    onStartMatch
}) => {
    const [showCoach, setShowCoach] = useState(false);
    // Get top 3 players by overall
    const topPlayers = [...opponentPlayers]
        .filter(p => p.lineup === 'STARTING')
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 3);

    // Calculate team strength
    const avgOverall = opponentPlayers.length > 0
        ? Math.round(opponentPlayers.reduce((sum, p) => sum + p.overall, 0) / opponentPlayers.length)
        : 70;

    const userAvgOverall = 75; // Simplified

    // Difficulty rating
    const getDifficulty = () => {
        const diff = avgOverall - userAvgOverall;
        if (diff > 5) return { level: 'HARD', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle };
        if (diff < -5) return { level: 'EASY', color: 'text-green-400', bg: 'bg-green-500/20', icon: TrendingDown };
        return { level: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Minus };
    };

    const difficulty = getDifficulty();

    // Recent form
    const recentForm = opponent.recentForm || [];
    const formColors: Record<string, string> = {
        'W': 'bg-emerald-500',
        'D': 'bg-slate-500',
        'L': 'bg-red-500'
    };

    // Formation
    const formation = opponent.tactic?.formation || '4-4-2';

    // Position counts
    const positionCounts = {
        GK: opponentPlayers.filter(p => p.position === Position.GK && p.lineup === 'STARTING').length,
        DEF: opponentPlayers.filter(p => p.position === Position.DEF && p.lineup === 'STARTING').length,
        MID: opponentPlayers.filter(p => p.position === Position.MID && p.lineup === 'STARTING').length,
        FWD: opponentPlayers.filter(p => p.position === Position.FWD && p.lineup === 'STARTING').length,
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            style={{
                paddingTop: adMobService.isNative() ? '100px' : '1rem',
                paddingBottom: adMobService.isNative() ? '100px' : '1rem'
            }}
        >
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">

                {/* Header */}
                <div
                    className="p-6 text-center border-b border-white/10 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${opponent.primaryColor}40, transparent)` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
                    <div className="relative">
                        <div
                            className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-2xl mb-4 backdrop-blur"
                            style={{ backgroundColor: opponent.primaryColor }}
                        >
                            <img
                                src={getTeamLogo(opponent.name)}
                                alt={opponent.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).outerHTML = `<span class="text-4xl font-bold" style="color: #fff">${opponent.name.charAt(0)}</span>`; }}
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{opponent.name}</h2>
                        <p className="text-slate-400 text-sm mt-1">{opponent.city}</p>
                    </div>
                </div>

                {/* Difficulty Badge */}
                <div className="px-6 py-4 border-b border-white/10">
                    <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${difficulty.bg} backdrop-blur border border-white/5`}>
                        <difficulty.icon size={20} className={`${difficulty.color} drop-shadow-[0_0_8px_currentColor]`} />
                        <span className={`font-bold text-lg ${difficulty.color}`}>
                            {difficulty.level === 'EASY' ? (t.easyOpponent || 'Easy Opponent') : difficulty.level === 'MEDIUM' ? (t.balancedMatch || 'Balanced Match') : (t.hardOpponent || 'Hard Opponent')}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/10">
                    <div className="text-center bg-slate-800/50 backdrop-blur rounded-xl p-3">
                        <div className="text-2xl font-bold text-white drop-shadow-lg">{avgOverall}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.squadStrength || 'Squad Strength'}</div>
                    </div>
                    <div className="text-center bg-slate-800/50 backdrop-blur rounded-xl p-3">
                        <div className="text-2xl font-bold text-white drop-shadow-lg">{formation}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.formation || 'Formation'}</div>
                    </div>
                    <div className="text-center bg-slate-800/50 backdrop-blur rounded-xl p-3">
                        <div className="text-2xl font-bold text-white drop-shadow-lg">{opponent.reputation}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.prestige || 'Prestige'}</div>
                    </div>
                </div>

                {/* Recent Form */}
                <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-[10px] uppercase text-slate-400 font-bold mb-3 flex items-center gap-2 tracking-wider">
                        <TrendingUp size={14} className="text-cyan-400" /> {t.last5Matches || 'Last 5 Matches'}
                    </h3>
                    <div className="flex justify-center gap-3">
                        {recentForm.length > 0 ? (
                            recentForm.slice(-5).map((result, i) => (
                                <div
                                    key={i}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg ${formColors[result] || 'bg-slate-600'}`}
                                >
                                    {result}
                                </div>
                            ))
                        ) : (
                            <span className="text-slate-500 text-sm">{t.noMatchesYet || 'No matches yet'}</span>
                        )}
                    </div>
                </div>

                {/* Key Players */}
                <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-[10px] uppercase text-slate-400 font-bold mb-3 flex items-center gap-2 tracking-wider">
                        <Zap size={14} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> {t.keyPlayers || 'Key Players'}
                    </h3>
                    <div className="space-y-2">
                        {topPlayers.map(player => (
                            <div key={player.id} className="flex items-center gap-3 bg-gradient-to-r from-slate-800/60 to-slate-800/30 backdrop-blur p-3 rounded-xl border border-white/5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-white shadow-lg border border-white/10">
                                    {player.overall}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-white text-sm">{player.firstName.charAt(0)}. {player.lastName}</div>
                                    <div className="text-xs text-slate-400">{player.position}</div>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${player.overall >= 85 ? 'bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 text-emerald-400 border border-emerald-700/50' :
                                    player.overall >= 75 ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/30 text-blue-400 border border-blue-700/50' :
                                        'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                                    }`}>
                                    ⭐ Star
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lineup Summary */}
                <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-[10px] uppercase text-slate-400 font-bold mb-3 flex items-center gap-2 tracking-wider">
                        <Users size={14} className="text-purple-400" /> {t.squadDistribution || 'Squad Distribution'}
                    </h3>
                    <div className="flex justify-around">
                        {Object.entries(positionCounts).map(([pos, count]) => (
                            <div key={pos} className="text-center bg-slate-800/40 backdrop-blur rounded-xl px-4 py-2">
                                <div className="text-lg font-bold text-white">{count}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{pos}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Assistant Coach Modal */}
                {showCoach && (
                    <AssistantCoachModal
                        userTeam={userTeam}
                        opponent={opponent}
                        tacticalHistory={tacticalHistory}
                        onClose={() => setShowCoach(false)}
                        t={t}
                    />
                )}

                {/* Actions */}
                <div className="p-6 space-y-3">
                    {/* Assistant Coach Button */}
                    <button
                        onClick={() => setShowCoach(true)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all border border-purple-500/30 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                        <Brain size={20} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        {t.assistantCoach || 'Yardımcı Antrenör'}
                    </button>

                    <button
                        onClick={onStartMatch}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Target size={20} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        {t.startMatchBtn || 'Start Match!'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-slate-300 font-bold rounded-xl hover:from-slate-700 hover:to-slate-600 transition-all border border-white/10 active:scale-95"
                    >
                        {t.goBack || 'Go Back'}
                    </button>
                </div>
            </div>
        </div>
    );
};
