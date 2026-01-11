

import React, { useState } from 'react';
import { Team, Player, Translation, LeagueHistoryEntry } from '../types';
import { Trophy, Target, Award, Crown, History, Eye } from 'lucide-react';

interface LeagueTableProps {
    teams: Team[];
    allTeams?: Team[]; // For global lookup
    players?: Player[];
    t: Translation;
    history?: LeagueHistoryEntry[];
    onInspectTeam: (teamId: string) => void;
    currentLeagueId: string;
    onSelectLeague: (leagueId: string) => void;
}

export const LeagueTable: React.FC<LeagueTableProps> = ({ teams, allTeams, players, t, history = [], onInspectTeam, currentLeagueId, onSelectLeague }) => {
    const [tab, setTab] = useState<'TABLE' | 'GOALS' | 'ASSISTS' | 'TOP_RATED' | 'RATING' | 'HISTORY'>('TABLE');
    const lookupTeams = allTeams || teams;

    // Filter players by current league teams for Top Scorers lists
    const leagueTeamIds = new Set(teams.map(t => t.id));
    const leaguePlayers = players ? players.filter(p => leagueTeamIds.has(p.teamId)) : [];

    // Sort by points, then GD, then GF
    const sortedTeams = [...teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        const gdA = a.stats.gf - a.stats.ga;
        const gdB = b.stats.gf - b.stats.ga;
        if (gdB !== gdA) return gdB - gdA;
        return b.stats.gf - a.stats.gf;
    });

    // Top Scorers logic (League specific)
    const topScorers = [...leaguePlayers]
        .filter(p => p.stats.goals > 0)
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 10);

    // Top Assists logic (League specific)
    const topAssists = [...leaguePlayers]
        .filter(p => p.stats.assists > 0)
        .sort((a, b) => b.stats.assists - a.stats.assists)
        .slice(0, 10);

    // Best Performers this Season (League specific)
    const seasonPerformers = [...leaguePlayers]
        .filter(p => (p.stats.goals > 0 || p.stats.assists > 0 || p.stats.appearances > 0))
        .map(p => ({
            ...p,
            seasonScore: (p.stats.goals * 3) + (p.stats.assists * 2) + (p.stats.appearances * 0.5)
        }))
        .sort((a, b) => b.seasonScore - a.seasonScore)
        .slice(0, 15);

    // ... young talents similarly ...
    // Top Rated Players (Average Rating)
    const topRatedPlayers = [...leaguePlayers]
        .filter(p => (p.stats.appearances || 0) >= 3 || (teams[0].stats.played < 3 && (p.stats.appearances || 0) > 0)) // Min 3 apps unless early season
        .sort((a, b) => (b.stats.averageRating || 0) - (a.stats.averageRating || 0))
        .slice(0, 15);

    const getTeam = (teamId: string) => lookupTeams.find(t => t.id === teamId);

    const getRowClass = (index: number, total: number) => {
        if (index === 0) return 'bg-yellow-900/10 border-l-4 border-l-yellow-500';
        if (index < 4) return 'bg-emerald-900/10 border-l-4 border-l-emerald-500';
        if (index >= total - 3) return 'bg-red-900/10 border-l-4 border-l-red-500';
        return 'border-b border-slate-700';
    };

    const getFormColor = (result: string) => {
        if (result === 'W') return 'bg-emerald-500 text-white';
        if (result === 'D') return 'bg-slate-500 text-white';
        if (result === 'L') return 'bg-red-500 text-white';
        return 'bg-slate-700 text-slate-400';
    }

    const leagues = [
        { id: 'tr', name: '🇹🇷 Süper Lig' },
        { id: 'en', name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League' },
        { id: 'es', name: '🇪🇸 La Liga' },
        { id: 'it', name: '🇮🇹 Serie A' },
        { id: 'fr', name: '🇫🇷 Ligue 1' },
        { id: 'de', name: '🇩🇪 Bundesliga' },
    ];

    return (
        <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700 animate-fade-in min-h-[500px]">

            {/* League Selector Header */}
            <div className="bg-slate-950 p-3 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    <span className="font-bold text-lg text-white">{leagues.find(l => l.id === currentLeagueId)?.name || 'League Table'}</span>
                </div>
                <select
                    value={currentLeagueId}
                    onChange={(e) => onSelectLeague(e.target.value)}
                    className="bg-slate-800 text-white text-sm border border-slate-600 rounded px-2 py-1 outline-none focus:border-emerald-500"
                >
                    {leagues.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            {/* Header Tabs */}

            <div className="bg-slate-900 p-2 flex justify-between items-center border-b border-slate-700 sticky top-0 z-10 overflow-x-auto no-scrollbar">
                <div className="flex gap-1">
                    <button
                        onClick={() => setTab('TABLE')}
                        className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2 transition-all whitespace-nowrap ${tab === 'TABLE' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Trophy size={14} /> <span className="hidden sm:inline">{t.leagueTable}</span><span className="sm:hidden">Tablo</span>
                    </button>
                    <button
                        onClick={() => setTab('GOALS')}
                        className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2 transition-all whitespace-nowrap ${tab === 'GOALS' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Target size={14} /> <span className="hidden sm:inline">{t.topScorers}</span><span className="sm:hidden">Gol</span>
                    </button>
                    <button
                        onClick={() => setTab('ASSISTS')}
                        className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2 transition-all whitespace-nowrap ${tab === 'ASSISTS' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Award size={14} /> <span className="hidden sm:inline">{t.topAssists}</span><span className="sm:hidden">Asist</span>
                    </button>
                    <button
                        onClick={() => setTab('TOP_RATED')}
                        className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2 transition-all whitespace-nowrap ${tab === 'TOP_RATED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Crown size={14} /> <span className="hidden sm:inline">En İyiler</span><span className="sm:hidden">⭐</span>
                    </button>
                    <button
                        onClick={() => setTab('RATING')}
                        className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2 transition-all whitespace-nowrap ${tab === 'RATING' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        ⭐ <span className="hidden sm:inline">Rating</span><span className="sm:hidden">Puan</span>
                    </button>
                    <button
                        onClick={() => setTab('HISTORY')}
                        className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2 transition-all whitespace-nowrap ${tab === 'HISTORY' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <History size={14} /> <span className="hidden sm:inline">History</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {tab === 'TABLE' && (
                    <table className="w-full text-xs md:text-sm text-left text-slate-300">
                        <thead className="text-[10px] md:text-xs text-slate-400 uppercase bg-slate-900/50">
                            <tr>
                                <th className="px-3 py-2 md:px-6 md:py-3 whitespace-nowrap">{t.pos}</th>
                                <th className="px-3 py-2 md:px-6 md:py-3 w-full">{t.team}</th>
                                <th className="px-2 py-2 md:px-6 md:py-3 text-center">{t.p}</th>
                                <th className="px-2 py-2 md:px-6 md:py-3 text-center">{t.w}</th>
                                <th className="px-2 py-2 md:px-6 md:py-3 text-center">{t.d}</th>
                                <th className="px-2 py-2 md:px-6 md:py-3 text-center">{t.l}</th>
                                <th className="px-2 py-2 md:px-6 md:py-3 text-center font-bold text-slate-300">{t.gd}</th>
                                <th className="px-6 py-3 text-center hidden md:table-cell">Form</th>
                                <th className="px-3 py-2 md:px-6 md:py-3 text-center font-bold text-white bg-slate-700/30">{t.pts}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeams.map((team, index) => (
                                <tr
                                    key={team.id}
                                    onClick={() => onInspectTeam(team.id)}
                                    className={`hover:bg-slate-700/50 transition-colors cursor-pointer group ${getRowClass(index, sortedTeams.length)}`}
                                >
                                    <td className="px-3 py-3 md:px-6 md:py-4 font-medium">{index + 1}</td>
                                    <td className="px-3 py-3 md:px-6 md:py-4 font-semibold text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.primaryColor }}></div>
                                            <span className="truncate max-w-[120px] md:max-w-none">{team.name}</span>
                                            <Eye className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hidden md:inline" size={14} />
                                        </div>
                                    </td>
                                    <td className="px-2 py-3 md:px-6 md:py-4 text-center text-slate-400">{team.stats.played}</td>
                                    <td className="px-2 py-3 md:px-6 md:py-4 text-center">{team.stats.won}</td>
                                    <td className="px-2 py-3 md:px-6 md:py-4 text-center">{team.stats.drawn}</td>
                                    <td className="px-2 py-3 md:px-6 md:py-4 text-center">{team.stats.lost}</td>
                                    <td className="px-2 py-3 md:px-6 md:py-4 text-center font-bold">{team.stats.gf - team.stats.ga}</td>
                                    <td className="px-6 py-4 text-center hidden md:table-cell">
                                        <div className="flex justify-center gap-1">
                                            {(team.recentForm || []).map((res, i) => (
                                                <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getFormColor(res)}`}>
                                                    {res}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 md:px-6 md:py-4 text-center font-bold text-emerald-400 text-sm md:text-lg bg-emerald-900/10">{team.stats.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {(tab === 'GOALS' || tab === 'ASSISTS') && (
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3">{t.pos}</th>
                                <th className="px-6 py-3">Player</th>
                                <th className="px-6 py-3">{t.team}</th>
                                <th className="px-6 py-3 text-center">{tab === 'GOALS' ? t.goals : t.assists}</th>
                                <th className="px-6 py-3 text-center">{t.apps}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(tab === 'GOALS' ? topScorers : topAssists).map((player, index) => {
                                const team = getTeam(player.teamId);
                                return (
                                    <tr key={player.id} className="hover:bg-slate-700/50 transition-colors border-b border-slate-700">
                                        <td className="px-6 py-4 font-medium text-slate-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {player.firstName} {player.lastName}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            {team && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.primaryColor }}></div>}
                                            {team?.name || 'Free Agent'}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-emerald-400 text-lg">
                                            {tab === 'GOALS' ? player.stats.goals : player.stats.assists}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500">
                                            {player.stats.appearances}
                                        </td>
                                    </tr>
                                );
                            })}
                            {((tab === 'GOALS' && topScorers.length === 0) || (tab === 'ASSISTS' && topAssists.length === 0)) && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">No stats recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Top Rated Players Tab */}
                {tab === 'TOP_RATED' && (
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Oyuncu</th>
                                <th className="px-4 py-3">{t.team}</th>
                                <th className="px-4 py-3 text-center">{t.pos}</th>
                                <th className="px-4 py-3 text-center">⚽</th>
                                <th className="px-4 py-3 text-center">🅰️</th>
                                <th className="px-4 py-3 text-center hidden md:table-cell">Maç</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {seasonPerformers.map((player, index) => {
                                const team = getTeam(player.teamId);
                                return (
                                    <tr key={player.id} className="hover:bg-slate-700/30">
                                        <td className="px-4 py-3 font-bold text-slate-500">{index + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-white">{player.firstName} {player.lastName}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team?.primaryColor }}></div>
                                                <span className="text-slate-400 truncate max-w-[100px]">{team?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded">{player.position}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-400">{player.stats.goals}</td>
                                        <td className="px-4 py-3 text-center font-bold text-blue-400">{player.stats.assists}</td>
                                        <td className="px-4 py-3 text-center text-slate-400 hidden md:table-cell">{player.stats.appearances}</td>
                                    </tr>
                                );
                            })}
                            {seasonPerformers.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Henüz istatistik yok.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Rating Tab */}
                {tab === 'RATING' && (
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Oyuncu</th>
                                <th className="px-4 py-3">{t.team}</th>
                                <th className="px-4 py-3 text-center">{t.pos}</th>
                                <th className="px-4 py-3 text-center">Rating</th>
                                <th className="px-4 py-3 text-center">⚽</th>
                                <th className="px-4 py-3 text-center">🅰️</th>
                                <th className="px-4 py-3 text-center hidden md:table-cell">Maç</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {topRatedPlayers.map((player, index) => {
                                const team = getTeam(player.teamId);
                                return (
                                    <tr key={player.id} className="hover:bg-slate-700/30">
                                        <td className="px-4 py-3 font-bold text-slate-500">{index + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-white">{player.firstName} {player.lastName}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team?.primaryColor }}></div>
                                                <span className="text-slate-400 truncate max-w-[100px]">{team?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded">{player.position}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold px-2 py-1 rounded ${(player.stats.averageRating || 0) >= 7.5 ? 'bg-emerald-500 text-white' :
                                                (player.stats.averageRating || 0) >= 7.0 ? 'bg-blue-500 text-white' :
                                                    'text-slate-300'
                                                }`}>
                                                {player.stats.averageRating?.toFixed(1) || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-400">{player.stats.goals}</td>
                                        <td className="px-4 py-3 text-center font-bold text-blue-400">{player.stats.assists}</td>
                                        <td className="px-4 py-3 text-center text-slate-400 hidden md:table-cell">{player.stats.appearances}</td>
                                    </tr>
                                );
                            })}
                            {topRatedPlayers.length === 0 && (
                                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Henüz yeterli maç oynanmadı.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {tab === 'HISTORY' && (
                    <div className="p-4 space-y-6">
                        {/* User Team Achievements Section */}
                        {(() => {
                            // Calculate user achievements from history
                            const userTeam = teams.find(t => t.id === (teams[0] as any)?.id); // Will get from props
                            const userChampionships = history.filter(h => lookupTeams.find(t => t.id === h.championId)?.id === teams.find(t => t.stats)?.id).length;
                            const userSecondPlaces = history.filter(h => {
                                const sorted = [...lookupTeams].sort((a, b) => b.stats.points - a.stats.points);
                                return sorted[1]?.id === teams.find(t => t.stats)?.id;
                            }).length;

                            // Count how many times user's players were top scorer/assister
                            const userTopScorerSeasons = history.filter(h => {
                                const playerName = h.topScorer.split(' (')[0];
                                return leaguePlayers.some(p => `${p.firstName} ${p.lastName}` === playerName);
                            }).length;

                            return (
                                <div className="bg-gradient-to-br from-yellow-900/20 to-slate-800 border border-yellow-600/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Trophy className="text-yellow-500" size={24} />
                                        <span className="text-lg font-bold text-white">Kupa Dolabı</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-yellow-500/20">
                                            <div className="text-3xl font-black text-yellow-400">{userChampionships}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">Şampiyonluk</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-500/20">
                                            <div className="text-3xl font-black text-slate-300">{userSecondPlaces}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">İkincilik</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-emerald-500/20">
                                            <div className="text-3xl font-black text-emerald-400">{userTopScorerSeasons}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">Gol Kralı</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-blue-500/20">
                                            <div className="text-3xl font-black text-blue-400">{history.length}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">Sezon</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Season History */}
                        <div>
                            <div className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <History size={16} /> Sezon Geçmişi
                            </div>

                            {(() => {
                                // Filter history by current league
                                const leagueHistory = history.filter(h => h.leagueId === currentLeagueId || !h.leagueId);

                                if (leagueHistory.length === 0) {
                                    return (
                                        <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-lg">
                                            <History className="mx-auto mb-2 text-slate-600" size={32} />
                                            Henüz geçmiş yok. Bir sezon tamamlayın!
                                        </div>
                                    );
                                }

                                // Get unique seasons sorted desc
                                const uniqueSeasons = [...new Set(leagueHistory.map(h => h.season))].sort((a, b) => b - a);

                                return (
                                    <div className="space-y-3">
                                        {uniqueSeasons.map(season => {
                                            const entry = leagueHistory.find(h => h.season === season)!;
                                            const isUserChampion = lookupTeams.find(t => t.id === entry.championId)?.name === teams[0]?.name;

                                            return (
                                                <div key={entry.season}
                                                    className={`rounded-xl p-4 border transition-all ${isUserChampion
                                                        ? 'bg-gradient-to-r from-yellow-900/30 to-slate-800 border-yellow-500/50 shadow-lg shadow-yellow-900/20'
                                                        : 'bg-slate-800/50 border-slate-700'
                                                        }`}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                        {/* Season & Champion */}
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="text-center">
                                                                <div className="text-2xl font-black text-slate-500">{entry.season}</div>
                                                                <div className="text-[9px] text-slate-600 uppercase">Sezon</div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 ${isUserChampion ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'border-yellow-500/50'
                                                                        }`}
                                                                    style={{ backgroundColor: entry.championColor }}
                                                                >
                                                                    <Crown size={18} fill="currentColor" className="text-yellow-200" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] text-slate-500 uppercase">Şampiyon</div>
                                                                    <div className={`font-bold ${isUserChampion ? 'text-yellow-400' : 'text-white'}`}>
                                                                        {entry.championName}
                                                                        {isUserChampion && <span className="ml-2 text-xs">🏆</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Stats Grid */}
                                                        <div className="grid grid-cols-3 gap-3 text-xs md:gap-6">
                                                            <div className="text-center md:text-left">
                                                                <div className="text-slate-500 text-[10px] uppercase">2. Sıra</div>
                                                                <div className="font-semibold text-slate-300 truncate max-w-[80px]">{entry.runnerUpName}</div>
                                                            </div>
                                                            <div className="text-center md:text-left">
                                                                <div className="text-slate-500 text-[10px] uppercase flex items-center gap-1 justify-center md:justify-start">
                                                                    <Target size={10} /> Gol Kralı
                                                                </div>
                                                                <div className="font-semibold text-emerald-400 truncate max-w-[80px]">{entry.topScorer}</div>
                                                            </div>
                                                            <div className="text-center md:text-left">
                                                                <div className="text-slate-500 text-[10px] uppercase flex items-center gap-1 justify-center md:justify-start">
                                                                    <Award size={10} /> Asist Kralı
                                                                </div>
                                                                <div className="font-semibold text-blue-400 truncate max-w-[80px]">{entry.topAssister}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};