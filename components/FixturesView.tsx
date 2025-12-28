
import React, { useState } from 'react';
import { Match, Team, MatchEventType, Translation, Player } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface FixturesViewProps {
    matches: Match[];
    teams: Team[];
    players: Player[];
    currentWeek: number;
    t: Translation;
    userTeamId: string;
}

export const FixturesView: React.FC<FixturesViewProps> = ({ matches, teams, players, currentWeek, t, userTeamId }) => {
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);
    const totalWeeks = Math.max(...matches.map(m => m.week));

    const weekMatches = matches.filter(m => m.week === selectedWeek);

    const getTeam = (id: string) => teams.find(t => t.id === id);

    const getPlayerName = (id: string) => {
        const p = players.find(player => player.id === id);
        return p ? `${p.firstName.charAt(0)}. ${p.lastName}` : 'Unknown';
    };

    const getScorers = (match: Match, teamId: string) => {
        return match.events
            .filter(e => e.type === MatchEventType.GOAL && e.teamId === teamId)
            .map(e => ({
                player: e.playerId ? getPlayerName(e.playerId) : 'Unknown',
                minute: e.minute
            }));
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-fade-in max-w-4xl mx-auto">
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
                                {/* Mobile Layout */}
                                <div className="md:hidden">
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Home */}
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2"
                                                style={{
                                                    backgroundColor: homeTeam.primaryColor,
                                                    color: '#fff',
                                                    borderColor: isUserMatch && match.homeTeamId === userTeamId ? '#10b981' : 'transparent'
                                                }}
                                            >
                                                {homeTeam.name.charAt(0)}
                                            </div>
                                            <span className={`text-sm font-bold truncate ${isUserMatch && match.homeTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>
                                                {homeTeam.name.length > 10 ? homeTeam.name.substring(0, 10) + '.' : homeTeam.name}
                                            </span>
                                        </div>

                                        {/* Score */}
                                        <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                                            {match.isPlayed ? (
                                                <span className="text-lg font-black text-white font-mono">
                                                    {match.homeScore}-{match.awayScore}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-bold text-slate-600 font-mono">VS</span>
                                            )}
                                        </div>

                                        {/* Away */}
                                        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                                            <span className={`text-sm font-bold truncate text-right ${isUserMatch && match.awayTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>
                                                {awayTeam.name.length > 10 ? awayTeam.name.substring(0, 10) + '.' : awayTeam.name}
                                            </span>
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2"
                                                style={{
                                                    backgroundColor: awayTeam.primaryColor,
                                                    color: '#fff',
                                                    borderColor: isUserMatch && match.awayTeamId === userTeamId ? '#10b981' : 'transparent'
                                                }}
                                            >
                                                {awayTeam.name.charAt(0)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Scorers */}
                                    {match.isPlayed && (homeScorers.length > 0 || awayScorers.length > 0) && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="text-left space-y-0.5">
                                                {homeScorers.slice(0, 2).map((s, idx) => (
                                                    <div key={idx} className="text-slate-400 truncate">⚽ {s.player} <span className="text-emerald-500">{s.minute}'</span></div>
                                                ))}
                                                {homeScorers.length > 2 && <div className="text-slate-500">+{homeScorers.length - 2} more</div>}
                                            </div>
                                            <div className="text-right space-y-0.5">
                                                {awayScorers.slice(0, 2).map((s, idx) => (
                                                    <div key={idx} className="text-slate-400 truncate"><span className="text-emerald-500">{s.minute}'</span> {s.player} ⚽</div>
                                                ))}
                                                {awayScorers.length > 2 && <div className="text-slate-500">+{awayScorers.length - 2} more</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:flex items-center gap-8">
                                    {/* Date/Status */}
                                    <div className="w-24 text-right shrink-0">
                                        {match.isPlayed ? (
                                            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">FT</span>
                                        ) : (
                                            <span className="text-slate-500 flex items-center justify-end gap-1 text-sm font-bold">
                                                <Clock size={14} />
                                                {selectedWeek === currentWeek ? 'Today' : 'Upcoming'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Teams & Score */}
                                    <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                                        {/* Home Team */}
                                        <div className="flex items-center justify-end gap-3 text-right">
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-xl ${isUserMatch && match.homeTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>
                                                    {homeTeam.name}
                                                </span>
                                                {match.isPlayed && homeScorers.length > 0 && (
                                                    <div className="flex flex-col items-end text-xs text-slate-400 mt-1 space-y-0.5">
                                                        {homeScorers.map((s, idx) => (
                                                            <span key={idx}>{s.player} {s.minute}'</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 border-2 border-slate-700 shadow-lg" style={{ backgroundColor: homeTeam.primaryColor, color: '#fff', borderColor: isUserMatch && match.homeTeamId === userTeamId ? '#10b981' : undefined }}>
                                                {homeTeam.name.charAt(0)}
                                            </div>
                                        </div>

                                        {/* Score / VS */}
                                        <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 min-w-[80px] text-center shadow-inner">
                                            {match.isPlayed ? (
                                                <div className="text-3xl font-black text-white tracking-widest font-mono">
                                                    {match.homeScore}-{match.awayScore}
                                                </div>
                                            ) : (
                                                <div className="text-2xl font-bold text-slate-600 font-mono">VS</div>
                                            )}
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center justify-start gap-3 text-left">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 border-2 border-slate-700 shadow-lg" style={{ backgroundColor: awayTeam.primaryColor, color: '#fff', borderColor: isUserMatch && match.awayTeamId === userTeamId ? '#10b981' : undefined }}>
                                                {awayTeam.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-xl ${isUserMatch && match.awayTeamId === userTeamId ? 'text-emerald-400' : 'text-white'}`}>
                                                    {awayTeam.name}
                                                </span>
                                                {match.isPlayed && awayScorers.length > 0 && (
                                                    <div className="flex flex-col items-start text-xs text-slate-400 mt-1 space-y-0.5">
                                                        {awayScorers.map((s, idx) => (
                                                            <span key={idx}>{s.player} {s.minute}'</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
