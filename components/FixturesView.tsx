import React, { useState, useMemo } from 'react';
import { Match, Team, MatchEventType, Translation, Player } from '../types';
import { LEAGUE_PRESETS } from '../constants';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface FixturesViewProps {
    matches: Match[];
    teams: Team[];
    players: Player[];
    currentWeek: number;
    t: Translation;
    userTeamId: string;
    userLeagueId: string;
    availableLeagues: { id: string; name: string }[];
}

export const FixturesView: React.FC<FixturesViewProps> = ({ matches, teams, players, currentWeek, t, userTeamId, userLeagueId, availableLeagues }) => {
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);
    const [selectedLeagueId, setSelectedLeagueId] = useState(userLeagueId);

    const leagueMatches = useMemo(() => {
        return matches.filter(m => {
            const homeTeam = teams.find(t => t.id === m.homeTeamId);
            return homeTeam?.leagueId === selectedLeagueId;
        });
    }, [matches, teams, selectedLeagueId]);

    const totalWeeks = leagueMatches.length > 0 ? Math.max(...leagueMatches.map(m => m.week)) : 1;
    const weekMatches = leagueMatches.filter(m => m.week === selectedWeek);

    const getTeam = (id: string) => teams.find(t => t.id === id);
    const getPlayerName = (id: string) => {
        const p = players.find(player => player.id === id);
        return p ? `${p.firstName.charAt(0)}. ${p.lastName}` : 'Unknown';
    };
    const getScorers = (match: any, teamId: string) => {
        return (match.events || [])
            .filter((e: any) => e.type === MatchEventType.GOAL && e.teamId === teamId)
            .map((e: any) => ({
                player: e.playerId ? getPlayerName(e.playerId) : 'Unknown',
                minute: e.minute
            }));
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-fade-in max-w-4xl mx-auto">
            {/* League Selector */}
            <div className="bg-slate-950 p-4 border-b border-slate-700">
                <select
                    value={selectedLeagueId}
                    onChange={(e) => {
                        setSelectedLeagueId(e.target.value);
                        setSelectedWeek(1);
                    }}
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none font-bold"
                >
                    {(() => {
                        const REGION_NAMES: Record<string, string> = {
                            'GROUP_A': 'Europe (Elite)',
                            'GROUP_B': 'Europe (Challenger)',
                            'GROUP_C': 'Americas (North)',
                            'GROUP_D': 'Americas (South)',
                            'GROUP_E': 'Asia & Oceania',
                            'GROUP_F': 'Africa',
                            'GROUP_G': 'Rest of World',
                            'GROUP_H': 'Special Leagues'
                        };
                        const leaguesByRegion = availableLeagues.reduce((acc, league) => {
                            const preset = LEAGUE_PRESETS.find(p => p.id === league.id);
                            const region = preset?.region || 'GROUP_G';
                            if (!acc[region]) acc[region] = [];
                            acc[region].push(league);
                            return acc;
                        }, {} as Record<string, typeof availableLeagues>);
                        const sortedRegions = Object.keys(leaguesByRegion).sort();
                        return sortedRegions.map(region => (
                            <optgroup key={region} label={REGION_NAMES[region] || region}>
                                {leaguesByRegion[region].map(league => (
                                    <option key={league.id} value={league.id}>
                                        {league.name} {league.id === userLeagueId ? '(Your League)' : ''}
                                    </option>
                                ))}
                            </optgroup>
                        ));
                    })()}
                </select>
            </div>

            {/* Week Navigation */}
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-4 md:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                <button
                    onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
                    disabled={selectedWeek === 1}
                    className="p-2 bg-slate-800 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="text-center">
                    <h2 className="text-lg md:text-2xl font-bold text-white flex items-center justify-center gap-2">
                        <Calendar className="text-emerald-500" size={20} />
                        {t.week} {selectedWeek}
                    </h2>
                    <div className="text-slate-400 text-xs md:text-sm mt-1 font-medium">
                        {weekMatches.length} {t.matches || 'Matches'}
                    </div>
                </div>

                <button
                    onClick={() => setSelectedWeek(prev => Math.min(totalWeeks, prev + 1))}
                    disabled={selectedWeek === totalWeeks}
                    className="p-2 bg-slate-800 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Match List */}
            <div className="divide-y divide-slate-800/50">
                {weekMatches.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 italic">No matches scheduled.</div>
                ) : (
                    weekMatches.map(match => {
                        const homeTeam = getTeam(match.homeTeamId);
                        const awayTeam = getTeam(match.awayTeamId);
                        if (!homeTeam || !awayTeam) return null;

                        const isUserMatch = match.homeTeamId === userTeamId || match.awayTeamId === userTeamId;
                        const homeScorers = match.isPlayed ? getScorers(match, homeTeam.id) : [];
                        const awayScorers = match.isPlayed ? getScorers(match, awayTeam.id) : [];

                        return (
                            <div key={match.id} className={`p-3 md:p-6 transition-colors hover:bg-slate-800/30 ${isUserMatch ? 'bg-emerald-900/10 border-l-4 border-l-emerald-500' : ''}`}>
                                <div className="flex items-center justify-between gap-2">
                                    {/* Status */}
                                    <div className="w-12 md:w-16 text-center shrink-0">
                                        {match.isPlayed ? (
                                            <span className="bg-slate-700 text-slate-300 text-[10px] md:text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">FT</span>
                                        ) : (
                                            <span className="text-slate-500 text-[10px] md:text-xs font-bold flex items-center justify-center gap-1">
                                                <Clock size={12} />
                                            </span>
                                        )}
                                    </div>

                                    {/* HOME Team */}
                                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                                        <span className={`font-bold text-xs md:text-base truncate ${isUserMatch && match.homeTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>
                                            {homeTeam.name}
                                        </span>
                                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-slate-600" style={{ backgroundColor: homeTeam.primaryColor, color: '#fff' }}>
                                            {homeTeam.name.charAt(0)}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="px-3 md:px-4 py-1 bg-slate-950 rounded-lg border border-slate-800 min-w-[50px] md:min-w-[70px] text-center shrink-0">
                                        {match.isPlayed ? (
                                            <div className="text-lg md:text-2xl font-black text-white tracking-wider font-mono">{match.homeScore}-{match.awayScore}</div>
                                        ) : (
                                            <div className="text-base md:text-xl font-bold text-slate-600 font-mono">VS</div>
                                        )}
                                    </div>

                                    {/* AWAY Team */}
                                    <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-slate-600" style={{ backgroundColor: awayTeam.primaryColor, color: '#fff' }}>
                                            {awayTeam.name.charAt(0)}
                                        </div>
                                        <span className={`font-bold text-xs md:text-base truncate ${isUserMatch && match.awayTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>
                                            {awayTeam.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
