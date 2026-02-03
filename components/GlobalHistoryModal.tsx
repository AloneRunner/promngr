import React, { useState } from 'react';
import { X, Trophy, Globe, Crown, Award, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { LeagueHistoryEntry, Team, Translation } from '../types';

interface GlobalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: LeagueHistoryEntry[];
    teams: Team[]; // Global team lookup
    t: Translation;
}

export const GlobalHistoryModal: React.FC<GlobalHistoryModalProps> = ({ isOpen, onClose, history, teams, t }) => {
    const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

    // Helper to safely get translation
    const getTr = (key: string) => {
        return (t as any)[key] || key;
    };

    if (!isOpen) return null;

    // Group history by season
    const historyBySeason = history.reduce((acc, entry) => {
        if (!acc[entry.season]) acc[entry.season] = [];
        acc[entry.season].push(entry);
        return acc;
    }, {} as Record<number, LeagueHistoryEntry[]>);

    // DEBUG: Log league count
    console.log('[GlobalHistory] Total history entries:', history.length);
    console.log('[GlobalHistory] Unique leagues:', [...new Set(history.map(h => h.leagueId))].length);
    console.log('[GlobalHistory] All leagueIds:', [...new Set(history.map(h => h.leagueId))]);

    const sortedSeasons = Object.keys(historyBySeason).map(Number).sort((a, b) => b - a);

    const getTeam = (id: string) => teams.find(t => t.id === id);

    const toggleSeason = (season: number) => {
        if (expandedSeason === season) setExpandedSeason(null);
        else setExpandedSeason(season);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <Globe className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{getTr('worldFootballHistory')}</h2>
                            <p className="text-xs text-slate-400">{getTr('globalArchive')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {sortedSeasons.length === 0 ? (
                        <div className="text-center py-20">
                            <HistoryIcon className="mx-auto h-16 w-16 text-slate-700 mb-4" />
                            <p className="text-slate-500 text-lg">{getTr('noHistory')}</p>
                            <p className="text-slate-600 text-sm">{getTr('completeSeason')}</p>
                        </div>
                    ) : (
                        sortedSeasons.map(season => (
                            <div key={season} className="border border-slate-700 rounded-xl bg-slate-800/50 overflow-hidden">
                                <button
                                    onClick={() => toggleSeason(season)}
                                    className="w-full p-4 flex items-center justify-between bg-slate-800 hover:bg-slate-700/80 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-black text-slate-500">{season}</div>
                                        <div className="text-left">
                                            <div className="text-xs text-slate-400 uppercase tracking-wider">{getTr('seasonSummary')}</div>
                                            <div className="text-sm text-slate-300 font-medium">
                                                {historyBySeason[season].filter(e => e.leagueId !== 'global').length} National Leagues
                                                {historyBySeason[season].find(e => e.leagueId === 'global') && ' + International Cups'}
                                            </div>
                                        </div>
                                    </div>
                                    {expandedSeason === season ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                                </button>

                                {expandedSeason === season && (
                                    <div className="p-4 space-y-4">
                                        {/* Intercontinental Section - Show First if Available */}
                                        {historyBySeason[season].find(e => e.leagueId === 'global') && (
                                            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-2 border-purple-500/50 rounded-xl p-4 mb-4">
                                                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                                                    <Globe size={20} className="text-purple-400" />
                                                    🌍 Intercontinental Cups
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {(() => {
                                                        const globalEntry = historyBySeason[season].find(e => e.leagueId === 'global');
                                                        return (
                                                            <>
                                                                {/* Elite Cup Winner */}
                                                                {globalEntry?.championsLeagueWinner && (
                                                                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                                                                        <div className="text-xs text-yellow-300 uppercase font-bold mb-2 flex items-center gap-1">
                                                                            <Trophy size={14} className="text-yellow-400" /> Elite Cup
                                                                        </div>
                                                                        <div className="text-white font-bold text-lg">{globalEntry.championsLeagueWinner}</div>
                                                                        <div className="text-yellow-200 text-xs mt-1">🏆 Champion</div>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Challenge Cup Winner */}
                                                                {globalEntry?.europaLeagueWinner && (
                                                                    <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                                                                        <div className="text-xs text-orange-300 uppercase font-bold mb-2 flex items-center gap-1">
                                                                            <Trophy size={14} className="text-orange-400" /> Challenge Cup
                                                                        </div>
                                                                        <div className="text-white font-bold text-lg">{globalEntry.europaLeagueWinner}</div>
                                                                        <div className="text-orange-200 text-xs mt-1">🟠 Champion</div>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Super Cup Winner */}
                                                                {globalEntry?.superCupWinner && (
                                                                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                                                                        <div className="text-xs text-purple-300 uppercase font-bold mb-2 flex items-center gap-1">
                                                                            <Trophy size={14} className="text-purple-400" /> Super Cup
                                                                        </div>
                                                                        <div className="text-white font-bold text-lg">{globalEntry.superCupWinner}</div>
                                                                        <div className="text-purple-200 text-xs mt-1">🌟 Champion</div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {/* League Championships Grid */}
                                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                                            {historyBySeason[season].filter(e => e.leagueId !== 'global').map((entry, idx) => {
                                                const champion = getTeam(entry.championId);
                                                return (
                                                <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
                                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
                                                        <span className="font-bold text-indigo-400 text-sm">{entry.leagueName}</span>
                                                    </div>

                                                    {/* Champion */}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs border border-white/10" style={{ backgroundColor: entry.championColor }}>
                                                            <Crown size={14} className="text-yellow-400" fill="currentColor" />
                                                        </div>
                                                        <div className="truncate">
                                                            <div className="text-[10px] text-slate-500 uppercase">{getTr('championLabel')}</div>
                                                            <div className="font-bold text-white text-sm truncate">{entry.championName}</div>
                                                        </div>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-500 flex items-center gap-1"><Award size={10} /> {getTr('runnerUpLabel')}</span>
                                                            <span className="text-slate-300 truncate max-w-[100px]">{entry.runnerUpName}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-500 flex items-center gap-1"><Target size={10} /> {getTr('topScorerLabel')}</span>
                                                            <span className="text-emerald-400 truncate max-w-[100px]">{entry.topScorer.split('(')[0]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

function HistoryIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    )
}
