
import React, { useState } from 'react';
import { EuropeanCup, EuropeanCupMatch, Team, Translation, GlobalCupGroup } from '../types';
import { Trophy, Star, Crown, ChevronRight, Grid, LayoutTemplate } from 'lucide-react';
import { getLeagueFlag } from '../src/data/leagueFlags';

interface EuropeanCupViewProps {
    cup: EuropeanCup;
    teams: Team[];
    userTeamId: string;
    t: Translation;
    onPlayMatch: (match: EuropeanCupMatch) => void;
    onClose: () => void;
    cupName?: string; // Optional override for display title and theme detection
}

export const EuropeanCupView: React.FC<EuropeanCupViewProps> = ({
    cup,
    teams,
    userTeamId,
    t,
    onPlayMatch,
    onClose,
    cupName
}) => {
    const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('groups'); // Default to groups to show content immediately
    const getTeam = (id: string) => teams.find(t => t.id === id);

    // Safety check for knockout matches
    const knockoutMatches = cup.knockoutMatches || [];
    const groups = cup.groups || [];

    const round16 = knockoutMatches.filter(m => m.round === 'ROUND_16');
    const quarterFinals = knockoutMatches.filter(m => m.round === 'QUARTER');
    const semiFinals = knockoutMatches.filter(m => m.round === 'SEMI');
    const final = knockoutMatches.find(m => m.round === 'FINAL');

    const winner = cup.winnerId ? getTeam(cup.winnerId) : null;

    const renderMatch = (match: EuropeanCupMatch, showPlay: boolean = false) => {
        const home = getTeam(match.homeTeamId);
        const away = getTeam(match.awayTeamId);
        if (!home || !away) return null;

        const isUserMatch = match.homeTeamId === userTeamId || match.awayTeamId === userTeamId;
        const canPlay = !match.isPlayed && isUserMatch && showPlay;

        return (
            <div
                key={match.id}
                className={`bg-slate-800/50 rounded-lg border p-3 ${isUserMatch ? activeBorder : 'border-slate-700'}`}
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
                        <span className="text-base shrink-0" title={home.leagueId}>{getLeagueFlag(home.leagueId)}</span>
                        <span className={`text-sm font-bold truncate ${match.winnerId === home.id ? activeText : 'text-white'}`}>
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
                        <span className={`text-sm font-bold truncate text-right ${match.winnerId === away.id ? activeText : 'text-white'}`}>
                            {away.name.length > 8 ? away.name.substring(0, 8) + '.' : away.name}
                        </span>
                        <span className="text-base shrink-0" title={away.leagueId}>{getLeagueFlag(away.leagueId)}</span>
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
                        onClick={() => onPlayMatch(match)}
                        className={`w-full mt-2 py-2 bg-gradient-to-r ${buttonGradient} text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-1`}
                    >
                        <Trophy size={14} /> Maçı Oyna
                    </button>
                )}
            </div>
        );
    };

    const renderGroup = (group: GlobalCupGroup) => (
        <div key={group.id} className="bg-slate-800/30 rounded-xl border border-slate-700 p-4">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Grid size={16} className={iconColor} />
                {group.name}
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                            <th className="p-2">Takım</th>
                            <th className="p-2 text-center">O</th>
                            <th className="p-2 text-center">P</th>
                        </tr>
                    </thead>
                    <tbody>
                        {group.standings.sort((a, b) => b.points - a.points || b.gf - b.ga - (a.gf - a.ga)).map((standing, i) => {
                            const team = getTeam(standing.teamId);
                            if (!team) return null;
                            return (
                                <tr key={standing.teamId} className={`border-b border-slate-800 ${i < 2 ? 'bg-white/5' : ''}`}>
                                    <td className="p-2 font-medium text-white">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs ${i < 2 ? 'text-green-400' : 'text-slate-500'}`}>{i + 1}.</span>
                                            <span className="text-base" title={team.leagueId}>{getLeagueFlag(team.leagueId)}</span>
                                            <span>{team.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 text-center text-slate-300">{standing.played}</td>
                                    <td className="p-2 text-center font-bold text-white">{standing.points}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Reset tab when cup changes (Fixes "Previous Screen Data" bug) (Actually React key remounts usually fix this, but safety first)
    // useEffect(() => setActiveTab('bracket'), [cup]); // Needs useEffect import

    // Determine Cup Type
    // If it has 8 groups of 4, it's likely CL/EL.
    // Differentiate by checking if we passed a prop or check internal structure.
    // Hack: We can check if the parent component passed the name, or infer from context.
    // For now, let's assume if it has 32 teams and is not named 'Europa', it's CL.
    // Better: Allow 'title' prop or check cup property if available.

    // Use passed cupName if available, else fallback to naive check
    const normalizedName = (cupName || '').toLowerCase();
    const isEliteCup = cupName
        ? (normalizedName.includes('elite') || normalizedName.includes('elit') || normalizedName.includes('champion')) && !normalizedName.includes('challenge') && !normalizedName.includes('meydan')
        : ((cup as any).name !== 'Europa League');

    const title = cupName || (isEliteCup ? (t.internationalEliteCup || 'International Elite Cup') : (t.internationalChallengeCup || 'International Challenge Cup'));

    // Theme setup
    const themeColor = isEliteCup ? 'purple' : 'orange';
    const bgGradient = isEliteCup ? 'from-purple-900/20 via-slate-900 to-purple-900/20' : 'from-orange-900/20 via-slate-900 to-orange-900/20';
    const textGradient = isEliteCup ? 'from-purple-400 to-indigo-200' : 'from-orange-400 to-amber-200';
    const iconColor = isEliteCup ? 'text-purple-400' : 'text-orange-400';
    const borderColor = isEliteCup ? 'border-purple-500/30' : 'border-orange-500/30';
    const buttonGradient = isEliteCup ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-orange-600 text-white shadow-lg shadow-orange-900/50';
    const activeBorder = isEliteCup ? 'border-purple-500/50' : 'border-orange-500/50';
    const activeText = isEliteCup ? 'text-purple-400' : 'text-orange-400';

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className={`bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border ${borderColor} shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col`}>

                {/* Header */}
                <div className={`p-6 text-center border-b ${borderColor} bg-gradient-to-r ${bgGradient} shrink-0`}>
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Trophy className={iconColor} size={24} />
                        <h1 className={`text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${textGradient}`}>
                            {title}
                        </h1>
                        <Trophy className={iconColor} size={24} />
                    </div>
                    <p className="text-purple-500/70 text-sm">Sezon {cup.season} • {t.internationalTournament || 'International Tournament'}</p>

                    {/* Tabs */}
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'groups' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            Grup Aşaması
                        </button>
                        <button
                            onClick={() => setActiveTab('bracket')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'bracket' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            Eleme Aşaması
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-6 overflow-y-auto grow">
                    {/* Winner Banner */}
                    {winner && cup.currentStage === 'COMPLETE' && (
                        <div className="p-4 bg-gradient-to-r from-emerald-600/20 via-emerald-500/30 to-emerald-600/20 border-b border-emerald-500/30 mb-6 rounded-xl">
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

                    {activeTab === 'groups' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {groups.length > 0 ? groups.map(g => renderGroup(g)) : (
                                <div className="col-span-full text-center py-10 text-slate-500 italic">Gruplar henüz oluşturulmadı.</div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Round of 16 */}
                            {round16.length > 0 && (
                                <div>
                                    <h3 className={`text-xs uppercase text-purple-500 font-bold mb-3 flex items-center gap-2`}>
                                        <ChevronRight size={14} /> Son 16
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {round16.map(m => renderMatch(m, cup.currentStage === 'ROUND_16'))}
                                    </div>
                                </div>
                            )}

                            {/* Quarter Finals */}
                            {quarterFinals.length > 0 && (
                                <div>
                                    <h3 className={`text-xs uppercase text-purple-500 font-bold mb-3 flex items-center gap-2`}>
                                        <ChevronRight size={14} /> Çeyrek Final
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {quarterFinals.map(m => renderMatch(m, cup.currentStage === 'QUARTER'))}
                                    </div>
                                </div>
                            )}

                            {/* Semi Finals */}
                            {semiFinals.length > 0 && (
                                <div>
                                    <h3 className={`text-xs uppercase text-purple-500 font-bold mb-3 flex items-center gap-2`}>
                                        <ChevronRight size={14} /> Yarı Final
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {semiFinals.map(m => renderMatch(m, cup.currentStage === 'SEMI'))}
                                    </div>
                                </div>
                            )}

                            {/* Final */}
                            {final && (
                                <div>
                                    <h3 className={`text-xs uppercase text-purple-500 font-bold mb-3 flex items-center gap-2`}>
                                        <Trophy size={14} /> Final
                                    </h3>
                                    <div className="max-w-md mx-auto">
                                        {renderMatch(final, cup.currentStage === 'FINAL')}
                                    </div>
                                </div>
                            )}

                            {/* Empty Bracket State */}
                            {knockoutMatches.length === 0 && (
                                <div className="text-center py-10 text-slate-500 italic">
                                    <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                                    Knockout aşaması henüz başlamadı. Grupların tamamlanmasını bekleyin.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="p-4 border-t border-slate-800 shrink-0">
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
