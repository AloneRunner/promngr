
import React from 'react';
import { Player, Translation, Position } from '../types';
import { X, Clock, FileText, BarChart2, Eye, History, DollarSign, Ban, Star, Hexagon, LayoutGrid } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { RadarChart } from './RadarChart';
import { calculateEffectiveRating } from '../services/MatchEngine';

interface PlayerModalProps {
    player: Player | null;
    onClose: () => void;
    onRenew?: (player: Player) => void;
    onToggleTransferList?: (player: Player) => void;
    onTerminateContract?: (player: Player) => void; // New: Release player
    t: Translation;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, onRenew, onToggleTransferList, onTerminateContract, t }) => {
    const [viewMode, setViewMode] = React.useState<'GRID' | 'GRAPH'>('GRAPH');
    if (!player) return null;

    const getAttrColor = (val: number) => {
        if (val >= 80) return 'text-emerald-400 font-bold';
        if (val >= 60) return 'text-green-300';
        if (val >= 40) return 'text-yellow-200';
        return 'text-slate-400';
    };

    const AttrRow = ({ label, value }: { label: string, value: number }) => (
        <div className="flex justify-between items-center text-sm py-1 border-b border-slate-700/50">
            <span className="text-slate-400">{label}</span>
            <span className={getAttrColor(value)}>{value}</span>
        </div>
    );

    const renewalCost = Math.floor(player.value * 0.1);
    const terminationCost = Math.floor(player.salary * player.contractYears * 0.5); // 50% of remaining contract
    const hidden = player.hiddenAttributes || { consistency: 10, importantMatches: 10, injuryProneness: 10 };

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-4 md:my-0 max-h-[90vh]">
                {/* Header - Compacted */}
                <div className="relative bg-slate-950 p-4 flex flex-col items-start gap-3 border-b border-slate-800 shrink-0">
                    <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-900/50 p-1 rounded-full">
                        <X size={20} />
                    </button>

                    <div className="flex w-full gap-4">
                        <div className="flex-shrink-0">
                            <PlayerAvatar visual={player.visual} size="md" />
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white truncate">{player.firstName} {player.lastName}</h2>
                                {player.jerseyNumber && (
                                    <div className="text-sm font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-white">
                                        #{player.jerseyNumber}
                                    </div>
                                )}
                                {(() => {
                                    const posMap: Record<string, Position> = { 'GK': Position.GK, 'DEF': Position.DEF, 'MID': Position.MID, 'FWD': Position.FWD };
                                    const pos = posMap[player.position] || Position.MID;
                                    const effectiveOvr = calculateEffectiveRating(player, pos, player.condition);
                                    return effectiveOvr !== player.overall ? (
                                        <div className="flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700" title={`Baz: ${player.overall} | Anlık: ${effectiveOvr}`}>
                                            <span className="text-slate-500 line-through text-xs">{player.overall}</span>
                                            <span className="text-slate-600">→</span>
                                            <span className={effectiveOvr >= 80 ? 'text-emerald-400' : effectiveOvr >= 70 ? 'text-green-300' : 'text-orange-400'}>{effectiveOvr}</span>
                                        </div>
                                    ) : (
                                        <div className={`text-sm font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 ${getAttrColor(player.overall)}`}>
                                            {player.overall}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="font-bold text-slate-300">{player.position}</span>
                                <span>•</span>
                                <span>{player.age} {t.age}</span>
                                <span>•</span>
                                <span>{player.nationality}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs mt-1.5 font-mono">
                                <span className="text-emerald-400">€{(player.value / 1000000).toFixed(1)}M</span>
                                <span className="text-slate-500">|</span>
                                <span className="text-slate-300">€{(player.wage / 1000).toFixed(1)}K/wk</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Compact Row */}
                    <div className="grid grid-cols-4 gap-2 w-full bg-slate-900/30 rounded border border-slate-800/50 p-2">
                        <div className="text-center">
                            <div className="text-[9px] uppercase text-slate-500">{t.apps}</div>
                            <div className="font-bold text-xs text-white">{player.stats?.appearances || 0}</div>
                        </div>
                        <div className="text-center border-l border-slate-800/50">
                            <div className="text-[9px] uppercase text-slate-500">{t.goals}</div>
                            <div className="font-bold text-xs text-emerald-400">{player.stats?.goals || 0}</div>
                        </div>
                        <div className="text-center border-l border-slate-800/50">
                            <div className="text-[9px] uppercase text-slate-500">{t.assists}</div>
                            <div className="font-bold text-xs text-blue-400">{player.stats?.assists || 0}</div>
                        </div>
                        <div className="text-center border-l border-slate-800/50">
                            <div className="text-[9px] uppercase text-slate-500">{t.cards}</div>
                            <div className="font-bold text-xs text-yellow-500">{player.stats?.yellowCards || 0}</div>
                        </div>
                    </div>

                    {/* Actions Row - Single Line */}
                    <div className="flex w-full items-center gap-2 mt-1">
                        <div className="flex-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/80 h-8 rounded border border-slate-800">
                            <Clock size={12} /> <span className={player.contractYears <= 1 ? 'text-red-400 font-bold' : 'text-slate-300'}>{player.contractYears} {t.yearsLeft}</span>
                        </div>
                        {player.teamId !== 'FREE_AGENT' && onRenew && (
                            <button
                                onClick={() => onRenew(player)}
                                className="flex-1 h-8 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 rounded flex items-center justify-center gap-1 transition-colors text-[10px] font-bold"
                            >
                                <FileText size={12} /> {t.renewContract}
                            </button>
                        )}
                        {player.teamId !== 'FREE_AGENT' && onToggleTransferList && (
                            <button
                                onClick={() => onToggleTransferList(player)}
                                className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${player.isTransferListed ? 'bg-red-900/20 border-red-500/50 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                title={player.isTransferListed ? t.removeFromList : t.transferList}
                            >
                                {player.isTransferListed ? <Ban size={14} /> : <DollarSign size={14} />}
                            </button>
                        )}
                        {player.teamId !== 'FREE_AGENT' && onTerminateContract && (
                            <button
                                onClick={() => onTerminateContract(player)}
                                className="w-8 h-8 flex items-center justify-center rounded border bg-red-900/30 border-red-600/50 text-red-400 hover:bg-red-900/50 transition-colors"
                                title={t.terminateContract || 'Terminate Contract'}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-slate-900 to-slate-800 flex-1">

                    {/* Playstyles Section (NEW) - Compact */}
                    {player.playStyles && player.playStyles.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 border-b border-slate-700 pb-1">
                                <Star size={12} className="text-yellow-400" /> {t.playstyles || 'Playstyles'}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {player.playStyles.map((style, idx) => (
                                    <span key={idx} className="text-[10px] bg-yellow-900/10 text-yellow-200 border border-yellow-500/20 px-2 py-0.5 rounded shadow-sm">
                                        {style}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SCOUT REPORT (Deep Mind Feature) - Compacted & Localized */}
                    <div className="mb-4 bg-slate-900/40 p-2.5 rounded border border-slate-800">
                        <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                            <Eye size={12} className="text-purple-400" /> {t.scoutSummary}
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div className="bg-slate-950/30 p-1.5 rounded">
                                <span className="block text-slate-500 mb-0.5">{t.consistency}</span>
                                <span className={`font-medium ${hidden.consistency > 14 ? 'text-emerald-400' : hidden.consistency < 8 ? 'text-red-400' : 'text-slate-200'}`}>
                                    {hidden.consistency > 14 ? t.veryConsistent : hidden.consistency < 8 ? t.inconsistent : t.average}
                                </span>
                            </div>
                            <div className="bg-slate-950/30 p-1.5 rounded">
                                <span className="block text-slate-500 mb-0.5">{t.bigMatches}</span>
                                <span className={`font-medium ${hidden.importantMatches > 14 ? 'text-emerald-400' : hidden.importantMatches < 8 ? 'text-red-400' : 'text-slate-200'}`}>
                                    {hidden.importantMatches > 14 ? t.lovesBigGames : hidden.importantMatches < 8 ? t.nervous : t.stable}
                                </span>
                            </div>
                            <div className="bg-slate-950/30 p-1.5 rounded">
                                <span className="block text-slate-500 mb-0.5">{t.injuryRisk}</span>
                                <span className={`font-medium ${hidden.injuryProneness > 14 ? 'text-red-400' : hidden.injuryProneness < 8 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {hidden.injuryProneness > 14 ? t.injuryProne : hidden.injuryProneness < 8 ? t.resilient : t.normal}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-3 border-l-2 border-emerald-500 pl-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {t.attributes}
                        </h3>
                        <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
                            <button
                                onClick={() => setViewMode('GRAPH')}
                                className={`p-1 rounded transition-all ${viewMode === 'GRAPH' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Radar Graph"
                            >
                                <Hexagon size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`p-1 rounded transition-all ${viewMode === 'GRID' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Data Grid"
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'GRAPH' ? (
                        <div className="flex flex-col items-center justify-center py-2 animate-fade-in relative min-h-[260px]">
                            <div className="w-full max-w-[320px] mx-auto">
                                <RadarChart
                                    stats={[
                                        { label: t.attrPace || 'Pace', value: player.attributes.speed, fullMark: 100 },
                                        { label: t.attrShoot || 'Shoot', value: player.attributes.finishing, fullMark: 100 },
                                        { label: t.attrPass || 'Pass', value: player.attributes.passing, fullMark: 100 },
                                        { label: t.attrDribble || 'Drib', value: player.attributes.dribbling, fullMark: 100 },
                                        { label: t.attrDefense || 'Def', value: player.attributes.tackling, fullMark: 100 },
                                        { label: t.attrPhys || 'Phys', value: player.attributes.strength, fullMark: 100 },
                                    ]}
                                    color={player.overall >= 80 ? '#34d399' : player.overall >= 70 ? '#60a5fa' : '#facc15'}
                                    size={200}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                            <div className="bg-slate-900/40 p-3 rounded border border-white/5">
                                <h4 className="text-emerald-500 font-bold mb-2 uppercase text-[10px] tracking-wider">{t.technical}</h4>
                                <AttrRow label="Finishing" value={player.attributes.finishing} />
                                <AttrRow label="Passing" value={player.attributes.passing} />
                                <AttrRow label="Dribbling" value={player.attributes.dribbling} />
                                <AttrRow label="Tackling" value={player.attributes.tackling} />
                                <AttrRow label="Goalkeeping" value={player.attributes.goalkeeping} />
                            </div>

                            <div className="bg-slate-900/40 p-3 rounded border border-white/5">
                                <h4 className="text-blue-500 font-bold mb-2 uppercase text-[10px] tracking-wider">{t.physical}</h4>
                                <AttrRow label="Speed" value={player.attributes.speed} />
                                <AttrRow label="Stamina" value={player.attributes.stamina} />
                                <AttrRow label="Strength" value={player.attributes.strength} />
                                <AttrRow label="Condition" value={player.condition} />
                            </div>

                            <div className="bg-slate-900/40 p-3 rounded border border-white/5">
                                <h4 className="text-yellow-500 font-bold mb-2 uppercase text-[10px] tracking-wider">{t.mental}</h4>
                                <AttrRow label="Decisions" value={player.attributes.decisions || 50} />
                                <AttrRow label="Positioning" value={player.attributes.positioning} />
                                <AttrRow label="Vision" value={player.attributes.vision} />
                                <AttrRow label="Composure" value={player.attributes.composure} />
                                <AttrRow label="Leadership" value={player.attributes.leadership} />
                                <AttrRow label="Aggression" value={player.attributes.aggression} />
                            </div>
                        </div>
                    )}

                    {/* CAREER HISTORY SECTION */}
                    {player.careerHistory && player.careerHistory.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-l-2 border-blue-500 pl-2">
                                <History size={14} /> Career History
                            </h3>
                            <div className="bg-slate-900/40 rounded overflow-hidden border border-slate-700">
                                <table className="w-full text-[10px] text-left text-slate-300">
                                    <thead className="bg-slate-950 uppercase text-slate-500 font-bold">
                                        <tr>
                                            <th className="p-2">Season</th>
                                            <th className="p-2">Team</th>
                                            <th className="p-2 text-center">{t.apps}</th>
                                            <th className="p-2 text-center">Gls</th>
                                            <th className="p-2 text-center">Ast</th>
                                            <th className="p-2 text-center">Yel</th>
                                            <th className="p-2 text-center">Red</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {player.careerHistory.map((season, i) => (
                                            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="p-2 font-mono">{season.season}</td>
                                                <td className="p-2 font-bold text-white">{season.teamName}</td>
                                                <td className="p-2 text-center">{season.stats.appearances}</td>
                                                <td className="p-2 text-center text-emerald-400 font-bold">{season.stats.goals}</td>
                                                <td className="p-2 text-center text-blue-400 font-bold">{season.stats.assists}</td>
                                                <td className="p-2 text-center text-yellow-500">{season.stats.yellowCards}</td>
                                                <td className="p-2 text-center text-red-500">{season.stats.redCards}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Status Check - Compact */}
                    {(player.weeksInjured > 0 || player.matchSuspension > 0) && (
                        <div className="mt-4 flex flex-col gap-2">
                            {player.weeksInjured > 0 && (
                                <div className="bg-red-900/10 border border-red-500/30 text-red-300 px-3 py-1.5 rounded flex items-center gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                    {t.injured} ({player.weeksInjured} {t.week})
                                </div>
                            )}
                            {player.matchSuspension > 0 && (
                                <div className="bg-yellow-900/10 border border-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded flex items-center gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                    {t.suspended} ({player.matchSuspension} match)
                                </div>
                            )}
                        </div>
                    )}      </div>
            </div>
        </div>
    );
};
