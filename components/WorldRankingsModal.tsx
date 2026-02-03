import React, { useState, useMemo } from 'react';
import { Trophy, Search, X, Globe, Users, Map } from 'lucide-react';
import { Team, Player } from '../types';
import { LEAGUE_PRESETS } from '../constants';
import { getLeagueReputation, getLeagueCoefficients } from '../services/engine';

interface WorldRankingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    teams: Team[];
    players: Player[];
}

export const WorldRankingsModal: React.FC<WorldRankingsModalProps> = ({ isOpen, onClose, teams, players }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'clubs' | 'players' | 'leagues'>('clubs');

    // Sort teams by reputation (descending)
    const rankedTeams = useMemo(() => {
        let sorted = [...teams].sort((a, b) => b.reputation - a.reputation);
        if (searchTerm && activeTab === 'clubs') {
            sorted = sorted.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return sorted.map((team, index) => ({ ...team, rank: index + 1 }));
    }, [teams, searchTerm, activeTab]);

    // Sort players by Overall (descending)
    const rankedPlayers = useMemo(() => {
        let sorted = [...players].sort((a, b) => b.overall - a.overall);
        if (searchTerm && activeTab === 'players') {
            sorted = sorted.filter(p =>
                p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.lastName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return sorted.slice(0, 100); // Top 100
    }, [players, searchTerm, activeTab]);

    // Sort Leagues by Reputation (Average of top 5 teams or all teams)
    const rankedLeagues = useMemo(() => {
        const leagues = LEAGUE_PRESETS.map(preset => {
            const leagueTeams = teams.filter(t => t.leagueId === preset.id);
            // const totalRep = leagueTeams.reduce((sum, t) => sum + t.reputation, 0);
            // const avgRep = leagueTeams.length > 0 ? totalRep / leagueTeams.length : 0;
            // Cap display reputation at 100 (actually unlimited in engine, but 100 for UI stars)
            const reputation = getLeagueReputation(preset.id);
            const totalValue = leagueTeams.reduce((sum, t) => sum + t.budget * 4, 0); // Approx value from budget

            // Generate star rating (1-5) based on reputation (approx 50-100 scale)
            // 50 = 1 star, 60 = 2 stars, 70 = 3 stars, 80 = 4 stars, 90+ = 5 stars
            const stars = Math.min(5, Math.max(1, (reputation - 40) / 10));

            return {
                id: preset.id,
                name: preset.name,
                country: preset.country,
                reputation,
                coefficients: getLeagueCoefficients(preset.id),
                totalValue,
                stars,
                teamsCount: leagueTeams.length
            };
        });

        let sorted = leagues.sort((a, b) => b.reputation - a.reputation);

        if (searchTerm && activeTab === 'leagues') {
            sorted = sorted.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.country.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return sorted.map((l, index) => ({ ...l, rank: index + 1 }));
    }, [teams, searchTerm, activeTab]);

    if (!isOpen) return null;

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-slate-200';
        if (rank === 3) return 'text-amber-600';
        return 'text-slate-500';
    };

    const getOverallColor = (ovr: number) => {
        if (ovr >= 90) return 'text-emerald-400 font-bold';
        if (ovr >= 85) return 'text-blue-400 font-bold';
        if (ovr >= 80) return 'text-green-300';
        return 'text-slate-300';
    };

    const getTeamName = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Free Agent';
    };

    const renderStars = (count: number) => {
        return (
            <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                    <Trophy key={i} size={12} className={i < Math.round(count) ? "fill-current" : "text-slate-700"} />
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4 text-white">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header - Compact */}
                <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                            <Globe className="text-emerald-400" size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white">World Rankings</h2>
                            <p className="text-slate-400 text-[10px] sm:text-xs">Global Statistics & Records</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs & Search - Compact */}
                <div className="p-2 sm:p-3 border-b border-slate-800 bg-slate-800/30 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-center shrink-0">
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 overflow-x-auto max-w-full">
                        <button
                            onClick={() => setActiveTab('clubs')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === 'clubs' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Trophy size={14} /> Clubs
                        </button>
                        <button
                            onClick={() => setActiveTab('players')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === 'players' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users size={14} /> Players
                        </button>
                        <button
                            onClick={() => setActiveTab('leagues')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === 'leagues' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Map size={14} /> Leagues
                        </button>
                    </div>

                    <div className="relative w-full sm:w-48">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder={activeTab === 'clubs' ? "Search..." : activeTab === 'players' ? "Search..." : "Search..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {activeTab === 'clubs' && (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10 shadow-lg">
                                <tr>
                                    <th className="p-4 text-center w-16">Rank</th>
                                    <th className="p-4">Team</th>
                                    <th className="p-4 text-right">Reputation</th>
                                    <th className="p-4 text-right hidden sm:table-cell">Squad Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {rankedTeams.map((team) => (
                                    <tr key={team.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className={`p-4 text-center font-bold text-lg ${getRankColor(team.rank)}`}>
                                            #{team.rank}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-inner" style={{ backgroundColor: team.primaryColor }}>
                                                    {team.name.substring(0, 1)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{team.name}</div>
                                                    <div className="text-xs text-slate-500 uppercase tracking-wider">{team.leagueId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                                            {team.reputation}
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-300 hidden sm:table-cell">
                                            €{((team.budget || 0) * 4 / 1000000).toFixed(1)}M
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'players' && (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10 shadow-lg">
                                <tr>
                                    <th className="p-4 text-center w-16">Rank</th>
                                    <th className="p-4">Player</th>
                                    <th className="p-4 hidden sm:table-cell">Team</th>
                                    <th className="p-4 text-center">Pos</th>
                                    <th className="p-4 text-center">OVR</th>
                                    <th className="p-4 text-center hidden sm:table-cell">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {rankedPlayers.map((player, index) => (
                                    <tr key={player.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className={`p-4 text-center font-bold text-lg ${getRankColor(index + 1)}`}>
                                            #{index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {player.firstName} {player.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500">{player.nationality}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell text-sm text-slate-300">
                                            {getTeamName(player.teamId)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-slate-800 border border-slate-700 text-[10px] px-2 py-1 rounded text-slate-300">
                                                {player.position}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-center font-mono text-lg ${getOverallColor(player.overall)}`}>
                                            {player.overall}
                                        </td>
                                        <td className="p-4 text-center text-slate-500 font-mono hidden sm:table-cell">
                                            {player.age}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'leagues' && (
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead className="bg-slate-950 text-slate-400 text-[10px] sm:text-xs uppercase font-bold sticky top-0 z-10 shadow-lg">
                                <tr>
                                    <th className="p-2 sm:p-3 text-center w-10 sm:w-14">Rank</th>
                                    <th className="p-2 sm:p-3">League</th>
                                    <th className="p-1 sm:p-2 text-center text-slate-500 font-mono">Y1</th>
                                    <th className="p-1 sm:p-2 text-center text-slate-500 font-mono">Y2</th>
                                    <th className="p-1 sm:p-2 text-center text-slate-500 font-mono">Y3</th>
                                    <th className="p-1 sm:p-2 text-center text-slate-500 font-mono">Y4</th>
                                    <th className="p-1 sm:p-2 text-center text-slate-500 font-mono">Y5</th>
                                    <th className="p-2 sm:p-3 text-right text-emerald-400">Total</th>
                                    <th className="p-2 sm:p-3 text-right hidden lg:table-cell">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {rankedLeagues.map((league) => (
                                    <tr key={league.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className={`p-2 sm:p-3 text-center font-bold text-sm sm:text-base ${getRankColor(league.rank)}`}>
                                            #{league.rank}
                                        </td>
                                        <td className="p-2 sm:p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md flex items-center justify-center font-bold bg-slate-800 text-slate-300 border border-slate-700 text-[10px] sm:text-xs">
                                                    {league.country.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-purple-400 transition-colors text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{league.name}</div>
                                                    <div className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">{league.country}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* 5-Year Coefficients - Now visible on all screens */}
                                        {league.coefficients.map((score, idx) => (
                                            <td key={idx} className="p-1 sm:p-2 text-center font-mono text-slate-400 text-[10px] sm:text-xs">
                                                {score.toFixed(1)}
                                            </td>
                                        ))}

                                        <td className="p-2 sm:p-3 text-right font-mono text-emerald-400 font-bold text-sm sm:text-base">
                                            {league.reputation.toFixed(1)}
                                        </td>
                                        <td className="p-2 sm:p-3 text-right font-mono text-slate-300 text-xs hidden lg:table-cell">
                                            €{(league.totalValue / 1000000).toFixed(0)}M
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div >
    );
};
