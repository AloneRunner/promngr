import React, { useState, useMemo } from 'react';
import { Match, Team, MatchEventType, Translation, Player, EuropeanCup } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface FixturesViewProps {
    matches: Match[];
    teams: Team[];
    players: Player[];
    currentWeek: number;
    t: Translation;
    userTeamId: string;
    userLeagueId: string;
    availableLeagues: { id: string; name: string }[]; // NEW: List of all leagues
    europeanCup?: EuropeanCup;
    europaLeague?: EuropeanCup;
    onPlayCupMatch?: (matchId: string) => void;
}

export const FixturesView: React.FC<FixturesViewProps> = ({ matches, teams, players, currentWeek, t, userTeamId, userLeagueId, availableLeagues, europeanCup, europaLeague, onPlayCupMatch }) => {
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);
    const [tab, setTab] = useState<'LEAGUE' | 'CUP' | 'EUROPA'>('LEAGUE');
    const [selectedLeagueId, setSelectedLeagueId] = useState(userLeagueId); // NEW: League selector state

    // Filter matches by selected league
    const leagueMatches = useMemo(() => {
        return matches.filter(m => {
            const homeTeam = teams.find(t => t.id === m.homeTeamId);
            return homeTeam?.leagueId === selectedLeagueId;
        });
    }, [matches, teams, selectedLeagueId]);

    const totalWeeks = leagueMatches.length > 0 ? Math.max(...leagueMatches.map(m => m.week)) : 1;
    const weekMatches = leagueMatches.filter(m => m.week === selectedWeek);

    // ... helper functions ...
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
            {/* Tabs */}
            <div className="flex border-b border-slate-700 bg-slate-950">
                <button
                    onClick={() => setTab('LEAGUE')}
                    className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm transition-colors ${tab === 'LEAGUE' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {t.fixtures || 'League Fixtures'}
                </button>
                {europeanCup && europeanCup.isActive && (
                    <button
                        onClick={() => setTab('CUP')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm transition-colors ${tab === 'CUP' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        🏆 Elite Cup
                    </button>
                )}
                {europaLeague && europaLeague.isActive && (
                    <button
                        onClick={() => setTab('EUROPA')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm transition-colors ${tab === 'EUROPA' ? 'bg-slate-800 text-white border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        🟠 Challenge Cup
                    </button>
                )}
            </div>
            {/* ... Rest of code ... */}


            {tab === 'LEAGUE' && (
                <>
                    {/* League Selector */}
                    <div className="bg-slate-950 p-4 border-b border-slate-700">
                        <select
                            value={selectedLeagueId}
                            onChange={(e) => {
                                setSelectedLeagueId(e.target.value);
                                setSelectedWeek(1); // Reset to week 1 when changing league
                            }}
                            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none font-bold"
                        >
                            {availableLeagues.map(league => (
                                <option key={league.id} value={league.id}>
                                    {league.name} {league.id === userLeagueId ? '(Your League)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Header with Week Navigation */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 md:p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10">
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

                    {/* Matches List */}
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
                                        {/* Matches Content (Reused/Refactored from existing) */}
                                        <div className="flex items-center gap-4 md:gap-8">
                                            {/* Date/Status */}
                                            <div className="w-16 md:w-24 text-right shrink-0">
                                                {match.isPlayed ? (
                                                    <span className="bg-slate-700 text-slate-300 text-[10px] md:text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">FT</span>
                                                ) : (
                                                    <span className="text-slate-500 flex items-center justify-end gap-1 text-xs md:text-sm font-bold">
                                                        <Clock size={14} /> Today
                                                    </span>
                                                )}
                                            </div>

                                            {/* Teams & Score */}
                                            <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-2 md:gap-4">
                                                <div className="flex items-center justify-end gap-3 text-right">
                                                    <span className={`font-bold text-sm md:text-xl ${isUserMatch && match.homeTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>{homeTeam.name}</span>
                                                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-lg font-bold shrink-0 border-2 border-slate-700 shadow-lg" style={{ backgroundColor: homeTeam.primaryColor, color: '#fff' }}>{homeTeam.name.charAt(0)}</div>
                                                </div>

                                                <div className="px-2 md:px-4 py-1 md:py-2 bg-slate-950 rounded-lg border border-slate-800 min-w-[60px] md:min-w-[80px] text-center shadow-inner">
                                                    {match.isPlayed ? (
                                                        <div className="text-xl md:text-3xl font-black text-white tracking-widest font-mono">{match.homeScore}-{match.awayScore}</div>
                                                    ) : (
                                                        <div className="text-lg md:text-2xl font-bold text-slate-600 font-mono">VS</div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-start gap-3 text-left">
                                                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-lg font-bold shrink-0 border-2 border-slate-700 shadow-lg" style={{ backgroundColor: awayTeam.primaryColor, color: '#fff' }}>{awayTeam.name.charAt(0)}</div>
                                                    <span className={`font-bold text-sm md:text-xl ${isUserMatch && match.awayTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>{awayTeam.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {tab === 'CUP' && europeanCup && (
                <div className="bg-slate-900/50">
                    <div className="p-4 bg-blue-900/20 text-center border-b border-blue-500/30">
                        <h3 className="text-blue-400 font-bold uppercase tracking-widest text-sm">
                            Elite Cup
                            <span className="block text-[10px] text-slate-400 mt-1 opacity-70">
                                Current Stage: {europeanCup.currentRound}
                            </span>
                        </h3>
                    </div>

                    {['ROUND_16', 'QUARTER', 'SEMI', 'FINAL'].map(round => {
                        const roundMatches = europeanCup.matches.filter(m => m.round === round);
                        if (roundMatches.length === 0) return null;

                        return (
                            <div key={round} className="border-b border-slate-800/50">
                                <div className="px-4 py-2 bg-slate-950/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {round === 'ROUND_16' && 'Round of 16'}
                                    {round === 'QUARTER' && 'Quarter Finals'}
                                    {round === 'SEMI' && 'Semi Finals'}
                                    {round === 'FINAL' && 'Final'}
                                </div>
                                <div className="divide-y divide-slate-800/50">
                                    {roundMatches.map(match => {
                                        const homeTeam = getTeam(match.homeTeamId);
                                        const awayTeam = getTeam(match.awayTeamId);
                                        if (!homeTeam || !awayTeam) return null;

                                        const isUserMatch = match.homeTeamId === userTeamId || match.awayTeamId === userTeamId;

                                        return (
                                            <div key={match.id} className={`p-4 transition-colors hover:bg-slate-800/30 ${isUserMatch ? 'bg-blue-900/10 border-l-4 border-l-blue-500' : ''}`}>
                                                <div className="flex items-center gap-4 md:gap-8">
                                                    <div className="w-16 md:w-24 text-right shrink-0">
                                                        {match.isPlayed ? (
                                                            <span className="bg-slate-700 text-slate-300 text-[10px] md:text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">FT</span>
                                                        ) : (
                                                            isUserMatch ? (
                                                                <button onClick={() => onPlayCupMatch && onPlayCupMatch(match.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-xs px-3 py-1.5 rounded font-bold uppercase tracking-wider shadow-lg animate-pulse">
                                                                    PLAY
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-500 text-[10px] uppercase font-bold">Pending</span>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-2 md:gap-4">
                                                        <div className="flex items-center justify-end gap-3 text-right">
                                                            <span className={`font-bold text-sm md:text-lg ${isUserMatch ? 'text-blue-300' : 'text-slate-300'}`}>{homeTeam.name}</span>
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-700" style={{ backgroundColor: homeTeam.primaryColor, color: '#fff' }}>{homeTeam.name.charAt(0)}</div>
                                                        </div>
                                                        <div className="px-2 py-1 bg-slate-950 rounded border border-slate-800 min-w-[50px] text-center">
                                                            {match.isPlayed ? (
                                                                <span className="text-lg font-mono font-bold text-white">{match.homeScore}-{match.awayScore}</span>
                                                            ) : (
                                                                <span className="text-sm font-mono text-slate-600">VS</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-start gap-3 text-left">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-700" style={{ backgroundColor: awayTeam.primaryColor, color: '#fff' }}>{awayTeam.name.charAt(0)}</div>
                                                            <span className={`font-bold text-sm md:text-lg ${isUserMatch ? 'text-blue-300' : 'text-slate-300'}`}>{awayTeam.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {tab === 'EUROPA' && europaLeague && (
                <div className="bg-slate-900/50">
                    <div className="p-4 bg-orange-900/20 text-center border-b border-orange-500/30">
                        <h3 className="text-orange-400 font-bold uppercase tracking-widest text-sm">
                            Challenge Cup
                            <span className="block text-[10px] text-slate-400 mt-1 opacity-70">
                                Current Stage: {europaLeague.currentRound}
                            </span>
                        </h3>
                    </div>

                    {['ROUND_16', 'QUARTER', 'SEMI', 'FINAL'].map(round => {
                        const roundMatches = europaLeague.matches.filter(m => m.round === round);
                        if (roundMatches.length === 0) return null;

                        return (
                            <div key={round} className="border-b border-slate-800/50">
                                <div className="px-4 py-2 bg-slate-950/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {round === 'ROUND_16' && 'Round of 16'}
                                    {round === 'QUARTER' && 'Quarter Finals'}
                                    {round === 'SEMI' && 'Semi Finals'}
                                    {round === 'FINAL' && 'Final'}
                                </div>
                                <div className="divide-y divide-slate-800/50">
                                    {roundMatches.map(match => {
                                        const homeTeam = getTeam(match.homeTeamId);
                                        const awayTeam = getTeam(match.awayTeamId);
                                        if (!homeTeam || !awayTeam) return null;

                                        const isUserMatch = match.homeTeamId === userTeamId || match.awayTeamId === userTeamId;

                                        return (
                                            <div key={match.id} className={`p-4 transition-colors hover:bg-slate-800/30 ${isUserMatch ? 'bg-orange-900/10 border-l-4 border-l-orange-500' : ''}`}>
                                                <div className="flex items-center gap-4 md:gap-8">
                                                    <div className="w-16 md:w-24 text-right shrink-0">
                                                        {match.isPlayed ? (
                                                            <span className="bg-slate-700 text-slate-300 text-[10px] md:text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">FT</span>
                                                        ) : (
                                                            isUserMatch ? (
                                                                <button onClick={() => onPlayCupMatch && onPlayCupMatch(match.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-xs px-3 py-1.5 rounded font-bold uppercase tracking-wider shadow-lg animate-pulse">
                                                                    PLAY
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-500 text-[10px] uppercase font-bold">Pending</span>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-2 md:gap-4">
                                                        <div className="flex items-center justify-end gap-3 text-right">
                                                            <span className={`font-bold text-sm md:text-lg ${isUserMatch ? 'text-orange-300' : 'text-slate-300'}`}>{homeTeam.name}</span>
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-700" style={{ backgroundColor: homeTeam.primaryColor, color: '#fff' }}>{homeTeam.name.charAt(0)}</div>
                                                        </div>
                                                        <div className="px-2 py-1 bg-slate-950 rounded border border-slate-800 min-w-[50px] text-center">
                                                            {match.isPlayed ? (
                                                                <span className="text-lg font-mono font-bold text-white">{match.homeScore}-{match.awayScore}</span>
                                                            ) : (
                                                                <span className="text-sm font-mono text-slate-600">VS</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-start gap-3 text-left">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-700" style={{ backgroundColor: awayTeam.primaryColor, color: '#fff' }}>{awayTeam.name.charAt(0)}</div>
                                                            <span className={`font-bold text-sm md:text-lg ${isUserMatch ? 'text-orange-300' : 'text-slate-300'}`}>{awayTeam.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
