
import React from 'react';
import { EuropeanCup, Team, Translation } from '../types';
import { Trophy, Star, Crown, ChevronRight } from 'lucide-react';

interface EuropeanCupViewProps {
    cup: EuropeanCup;
    teams: Team[];
    userTeamId: string;
    t: Translation;
    onPlayMatch: (matchId: string) => void;
    onClose: () => void;
}

export const EuropeanCupView: React.FC<EuropeanCupViewProps> = ({
    cup,
    teams,
    userTeamId,
    t,
    onPlayMatch,
    onClose
}) => {
    const getTeam = (id: string) => teams.find(t => t.id === id);

    const round16 = cup.matches.filter(m => m.round === 'ROUND_16');
    const quarterFinals = cup.matches.filter(m => m.round === 'QUARTER');
    const semiFinals = cup.matches.filter(m => m.round === 'SEMI');
    const final = cup.matches.find(m => m.round === 'FINAL');

    const winner = cup.winnerId ? getTeam(cup.winnerId) : null;

    const getRoundName = (round: string) => {
        switch (round) {
            case 'ROUND_16': return 'Son 16';
            case 'QUARTER': return 'Çeyrek Final';
            case 'SEMI': return 'Yarı Final';
            case 'FINAL': return 'Final';
            default: return round;
        }
    };

    const renderMatch = (match: typeof cup.matches[0], showPlay: boolean = false) => {
        const home = getTeam(match.homeTeamId);
        const away = getTeam(match.awayTeamId);
        if (!home || !away) return null;

        const isUserMatch = match.homeTeamId === userTeamId || match.awayTeamId === userTeamId;
        const canPlay = !match.isPlayed && isUserMatch && showPlay;

        return (
            <div
                key={match.id}
                className={`bg-slate-800/50 rounded-lg border p-3 ${isUserMatch ? (isChampionsLeague ? 'border-purple-500/50' : 'border-emerald-500/50') : 'border-slate-700'}`}
            >
                <div className="flex items-center justify-between gap-2">
                    {/* Home */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: home.primaryColor, color: '#fff' }}
                        >
                            {home.name.charAt(0)}
                        </div>
                        <span className={`text-sm font-bold truncate ${match.winnerId === home.id ? (isChampionsLeague ? 'text-purple-400' : 'text-emerald-400') : 'text-white'}`}>
                            {home.name.length > 8 ? home.name.substring(0, 8) + '.' : home.name}
                        </span>
                    </div>

                    {/* Score */}
                    <div className="px-3 py-1 bg-slate-950 rounded border border-slate-700 shrink-0">
                        {match.isPlayed ? (
                            <span className="text-lg font-black text-white font-mono">
                                {match.homeScore}-{match.awayScore}
                            </span>
                        ) : (
                            <span className="text-sm font-bold text-slate-500">VS</span>
                        )}
                    </div>

                    {/* Away */}
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                        <span className={`text-sm font-bold truncate text-right ${match.winnerId === away.id ? (isChampionsLeague ? 'text-purple-400' : 'text-emerald-400') : 'text-white'}`}>
                            {away.name.length > 8 ? away.name.substring(0, 8) + '.' : away.name}
                        </span>
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: away.primaryColor, color: '#fff' }}
                        >
                            {away.name.charAt(0)}
                        </div>
                    </div>
                </div>

                {canPlay && (
                    <button
                        onClick={() => onPlayMatch(match.id)}
                        className={`w-full mt-2 py-2 bg-gradient-to-r ${isChampionsLeague ? 'from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400' : 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'} text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-1`}
                    >
                        <Trophy size={14} /> Maçı Oyna
                    </button>
                )}
            </div>
        );
    };

    const isChampionsLeague = !!cup._generatedForeignTeams;
    const title = isChampionsLeague ? 'ŞAMPİYONLAR LİGİ' : 'LİG KUPASI';
    const themeColor = isChampionsLeague ? 'purple' : 'emerald';

    // Determine gradient classes dynamically
    const bgGradient = isChampionsLeague
        ? 'from-purple-900/20 via-slate-900 to-purple-900/20'
        : 'from-emerald-900/20 via-slate-900 to-emerald-900/20';

    const textGradient = isChampionsLeague
        ? 'from-purple-400 to-indigo-200'
        : 'from-emerald-400 to-emerald-200';

    const iconColor = isChampionsLeague ? 'text-purple-400' : 'text-emerald-400';
    const borderColor = isChampionsLeague ? 'border-purple-500/30' : 'border-emerald-500/30';

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className={`bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border ${borderColor} shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>

                {/* Header */}
                <div className={`p-6 text-center border-b ${borderColor} bg-gradient-to-r ${bgGradient}`}>
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Trophy className={iconColor} size={24} />
                        <h1 className={`text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${textGradient}`}>
                            {title}
                        </h1>
                        <Trophy className={iconColor} size={24} />
                    </div>
                    <p className={`${isChampionsLeague ? 'text-purple-500/70' : 'text-emerald-500/70'} text-sm`}>Sezon {cup.season} • Knockout Turnuvası</p>
                </div>

                {/* Winner Banner */}
                {winner && cup.currentRound === 'COMPLETE' && (
                    <div className="p-4 bg-gradient-to-r from-emerald-600/20 via-emerald-500/30 to-emerald-600/20 border-b border-emerald-500/30">
                        <div className="flex items-center justify-center gap-3">
                            <Crown className="text-emerald-400" size={28} />
                            <div className="text-center">
                                <div className="text-xs uppercase text-emerald-500 font-bold tracking-widest">Kupa Şampiyonu</div>
                                <div className="text-xl font-black text-white">{winner.name}</div>
                            </div>
                            <Crown className="text-emerald-400" size={28} />
                        </div>
                    </div>
                )}

                {/* Bracket */}
                <div className="p-4 md:p-6 space-y-6">
                    {/* Round of 16 */}
                    {round16.length > 0 && (
                        <div>
                            <h3 className={`text-xs uppercase ${isChampionsLeague ? 'text-purple-500' : 'text-emerald-500'} font-bold mb-3 flex items-center gap-2`}>
                                <ChevronRight size={14} /> Son 16
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {round16.map(m => renderMatch(m, cup.currentRound === 'ROUND_16'))}
                            </div>
                        </div>
                    )}

                    {/* Quarter Finals */}
                    {quarterFinals.length > 0 && (
                        <div>
                            <h3 className={`text-xs uppercase ${isChampionsLeague ? 'text-purple-500' : 'text-emerald-500'} font-bold mb-3 flex items-center gap-2`}>
                                <ChevronRight size={14} /> Çeyrek Final
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {quarterFinals.map(m => renderMatch(m, cup.currentRound === 'QUARTER'))}
                            </div>
                        </div>
                    )}

                    {/* Semi Finals */}
                    {semiFinals.length > 0 && (
                        <div>
                            <h3 className={`text-xs uppercase ${isChampionsLeague ? 'text-purple-500' : 'text-emerald-500'} font-bold mb-3 flex items-center gap-2`}>
                                <ChevronRight size={14} /> Yarı Final
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {semiFinals.map(m => renderMatch(m, cup.currentRound === 'SEMI'))}
                            </div>
                        </div>
                    )}

                    {/* Final */}
                    {final && (
                        <div>
                            <h3 className={`text-xs uppercase ${isChampionsLeague ? 'text-purple-500' : 'text-emerald-500'} font-bold mb-3 flex items-center gap-2`}>
                                <Trophy size={14} /> Final
                            </h3>
                            <div className="max-w-md mx-auto">
                                {renderMatch(final, cup.currentRound === 'FINAL')}
                            </div>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};
