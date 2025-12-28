
import React from 'react';
import { Team, Player, Translation, Position } from '../types';
import { Shield, Target, TrendingUp, TrendingDown, Minus, Users, Zap, AlertTriangle } from 'lucide-react';

interface OpponentPreviewProps {
    opponent: Team;
    opponentPlayers: Player[];
    userTeam: Team;
    t: Translation;
    onClose: () => void;
    onStartMatch: () => void;
}

export const OpponentPreview: React.FC<OpponentPreviewProps> = ({
    opponent,
    opponentPlayers,
    userTeam,
    t,
    onClose,
    onStartMatch
}) => {
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div
                    className="p-6 text-center border-b border-slate-800 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${opponent.primaryColor}40, transparent)` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
                    <div className="relative">
                        <div
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-xl mb-3"
                            style={{ backgroundColor: opponent.primaryColor, color: '#fff' }}
                        >
                            {opponent.name.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-bold text-white">{opponent.name}</h2>
                        <p className="text-slate-400 text-sm mt-1">{opponent.city}</p>
                    </div>
                </div>

                {/* Difficulty Badge */}
                <div className="px-6 py-4 border-b border-slate-800">
                    <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${difficulty.bg}`}>
                        <difficulty.icon size={20} className={difficulty.color} />
                        <span className={`font-bold text-lg ${difficulty.color}`}>
                            {difficulty.level === 'EASY' ? 'Kolay Rakip' : difficulty.level === 'MEDIUM' ? 'Dengeli Maç' : 'Zorlu Rakip'}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-800">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{avgOverall}</div>
                        <div className="text-xs text-slate-400 uppercase">Kadro Gücü</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{formation}</div>
                        <div className="text-xs text-slate-400 uppercase">Formasyon</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{opponent.reputation}</div>
                        <div className="text-xs text-slate-400 uppercase">Prestij</div>
                    </div>
                </div>

                {/* Recent Form */}
                <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-xs uppercase text-slate-500 font-bold mb-3 flex items-center gap-1">
                        <TrendingUp size={14} /> Son 5 Maç
                    </h3>
                    <div className="flex justify-center gap-2">
                        {recentForm.length > 0 ? (
                            recentForm.slice(-5).map((result, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${formColors[result] || 'bg-slate-600'}`}
                                >
                                    {result}
                                </div>
                            ))
                        ) : (
                            <span className="text-slate-500 text-sm">Henüz maç yok</span>
                        )}
                    </div>
                </div>

                {/* Key Players */}
                <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-xs uppercase text-slate-500 font-bold mb-3 flex items-center gap-1">
                        <Zap size={14} /> Dikkat Edilmesi Gerekenler
                    </h3>
                    <div className="space-y-2">
                        {topPlayers.map(player => (
                            <div key={player.id} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                                    {player.overall}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-white text-sm">{player.firstName} {player.lastName}</div>
                                    <div className="text-xs text-slate-400">{player.position}</div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold ${player.overall >= 85 ? 'bg-emerald-500/20 text-emerald-400' :
                                        player.overall >= 75 ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-slate-600 text-slate-300'
                                    }`}>
                                    ⭐ Star
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lineup Summary */}
                <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-xs uppercase text-slate-500 font-bold mb-3 flex items-center gap-1">
                        <Users size={14} /> Kadro Dağılımı
                    </h3>
                    <div className="flex justify-around">
                        {Object.entries(positionCounts).map(([pos, count]) => (
                            <div key={pos} className="text-center">
                                <div className="text-lg font-bold text-white">{count}</div>
                                <div className="text-xs text-slate-400">{pos}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                    <button
                        onClick={onStartMatch}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                    >
                        <Target size={20} />
                        Maça Başla!
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        </div>
    );
};
