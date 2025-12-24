
import React from 'react';
import { Player, Translation } from '../types';
import { X, Clock, FileText, BarChart2, Eye, History, DollarSign, Ban, Star } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  onRenew?: (player: Player) => void;
  onToggleTransferList?: (player: Player) => void; // New Prop
  t: Translation;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, onRenew, onToggleTransferList, t }) => {
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
  const hidden = player.hiddenAttributes || { consistency: 10, importantMatches: 10, injuryProneness: 10 };

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-4 md:my-0 max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-slate-950 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 border-b border-slate-800 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X size={24} />
          </button>
          
          <div className="flex-shrink-0">
              <PlayerAvatar visual={player.visual} size="lg" />
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-white">{player.firstName} {player.lastName}</h2>
              <div className={`text-xl font-bold px-3 py-1 rounded bg-slate-800 ${getAttrColor(player.overall)}`}>
                {player.overall}
              </div>
            </div>
            <div className="flex gap-2 md:gap-4 text-xs md:text-sm text-slate-400 mt-1 flex-wrap">
              <span>{player.position}</span>
              <span>•</span>
              <span>{player.age} {t.age}</span>
              <span>•</span>
              <span>{player.nationality}</span>
            </div>
             <div className="flex gap-4 text-xs mt-2">
                 <div className="text-emerald-400 font-mono">€{(player.value / 1000000).toFixed(1)}M {t.value}</div>
                 <div className="text-slate-300 font-mono">€{(player.wage / 1000).toFixed(1)}K {t.weeklyWage}</div>
            </div>
            
            {/* Stats Row */}
            <div className="flex gap-4 mt-4 bg-slate-900 rounded p-2 border border-slate-800">
                <div className="text-center px-2">
                     <div className="text-[10px] uppercase text-slate-500">{t.apps}</div>
                     <div className="font-bold text-white">{player.stats?.appearances || 0}</div>
                </div>
                <div className="text-center px-2 border-l border-slate-800">
                     <div className="text-[10px] uppercase text-slate-500">{t.goals}</div>
                     <div className="font-bold text-emerald-400">{player.stats?.goals || 0}</div>
                </div>
                <div className="text-center px-2 border-l border-slate-800">
                     <div className="text-[10px] uppercase text-slate-500">{t.assists}</div>
                     <div className="font-bold text-blue-400">{player.stats?.assists || 0}</div>
                </div>
                <div className="text-center px-2 border-l border-slate-800">
                     <div className="text-[10px] uppercase text-slate-500">Cards</div>
                     <div className="font-bold text-yellow-500">{player.stats?.yellowCards || 0}</div>
                </div>
            </div>

            {/* Contract & Transfer Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800">
                    <Clock size={14} /> {t.contract}: <span className={player.contractYears <= 1 ? 'text-red-500 font-bold' : 'text-white'}>{player.contractYears} {t.yearsLeft}</span>
                </div>
                {player.teamId !== 'FREE_AGENT' && onRenew && (
                    <button 
                        onClick={() => onRenew(player)}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1.5 rounded flex items-center gap-1 transition-colors"
                    >
                        <FileText size={12} /> {t.renewContract}
                    </button>
                )}
                {player.teamId !== 'FREE_AGENT' && onToggleTransferList && (
                    <button 
                        onClick={() => onToggleTransferList(player)}
                        className={`text-xs px-2 py-1.5 rounded flex items-center gap-1 transition-colors ${player.isTransferListed ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                    >
                        {player.isTransferListed ? <Ban size={12} /> : <DollarSign size={12} />} 
                        {player.isTransferListed ? t.removeFromList : t.transferList}
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-slate-900 to-slate-800 flex-1">
            
            {/* Playstyles Section (NEW) */}
            {player.playStyles && player.playStyles.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
                        <Star size={14} className="text-yellow-400" /> Playstyles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {player.playStyles.map((style, idx) => (
                            <span key={idx} className="text-xs bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 text-yellow-200 border border-yellow-500/30 px-3 py-1 rounded-full shadow-sm">
                                {style}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* SCOUT REPORT (Deep Mind Feature) */}
            <div className="mb-6 bg-slate-950/50 p-4 rounded-lg border border-slate-700">
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Eye size={16} className="text-purple-400" /> {t.scoutSummary}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                     <div>
                         <span className="block text-slate-500 mb-1">Consistency</span>
                         <span className={hidden.consistency > 14 ? 'text-green-400' : hidden.consistency < 8 ? 'text-red-400' : 'text-yellow-400'}>
                             {hidden.consistency > 14 ? 'Very Consistent' : hidden.consistency < 8 ? 'Inconsistent' : 'Average'}
                         </span>
                     </div>
                     <div>
                         <span className="block text-slate-500 mb-1">Big Matches</span>
                         <span className={hidden.importantMatches > 14 ? 'text-green-400' : hidden.importantMatches < 8 ? 'text-red-400' : 'text-yellow-400'}>
                             {hidden.importantMatches > 14 ? 'Loves Big Games' : hidden.importantMatches < 8 ? 'Nervous' : 'Stable'}
                         </span>
                     </div>
                     <div>
                         <span className="block text-slate-500 mb-1">Injury Risk</span>
                         <span className={hidden.injuryProneness > 14 ? 'text-red-400' : hidden.injuryProneness < 8 ? 'text-green-400' : 'text-yellow-400'}>
                             {hidden.injuryProneness > 14 ? 'Injury Prone' : hidden.injuryProneness < 8 ? 'Resilient' : 'Normal'}
                         </span>
                     </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
               {t.attributes}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-emerald-500 font-bold mb-3 uppercase text-xs tracking-wider">{t.technical}</h4>
                    <AttrRow label="Finishing" value={player.attributes.finishing} />
                    <AttrRow label="Passing" value={player.attributes.passing} />
                    <AttrRow label="Dribbling" value={player.attributes.dribbling} />
                    <AttrRow label="Tackling" value={player.attributes.tackling} />
                    <AttrRow label="Goalkeeping" value={player.attributes.goalkeeping} />
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-blue-500 font-bold mb-3 uppercase text-xs tracking-wider">{t.physical}</h4>
                    <AttrRow label="Speed" value={player.attributes.speed} />
                    <AttrRow label="Stamina" value={player.attributes.stamina} />
                    <AttrRow label="Strength" value={player.attributes.strength} />
                    <AttrRow label="Condition" value={player.condition} />
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-yellow-500 font-bold mb-3 uppercase text-xs tracking-wider">{t.mental}</h4>
                    <AttrRow label="Decisions" value={player.attributes.decisions || 50} />
                    <AttrRow label="Positioning" value={player.attributes.positioning} />
                    <AttrRow label="Vision" value={player.attributes.vision} />
                    <AttrRow label="Composure" value={player.attributes.composure} />
                    <AttrRow label="Leadership" value={player.attributes.leadership} />
                    <AttrRow label="Aggression" value={player.attributes.aggression} />
                </div>
            </div>
            
            {/* CAREER HISTORY SECTION */}
            {player.careerHistory && player.careerHistory.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                    <History size={18} /> Career History
                    </h3>
                    <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
                        <table className="w-full text-xs text-left text-slate-300">
                            <thead className="bg-slate-950 uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-3">Season</th>
                                    <th className="p-3">Team</th>
                                    <th className="p-3 text-center">Apps</th>
                                    <th className="p-3 text-center">Gls</th>
                                    <th className="p-3 text-center">Ast</th>
                                    <th className="p-3 text-center">Yel</th>
                                    <th className="p-3 text-center">Red</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {player.careerHistory.map((season, i) => (
                                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3 font-mono">{season.season}</td>
                                        <td className="p-3 font-bold text-white">{season.teamName}</td>
                                        <td className="p-3 text-center">{season.stats.appearances}</td>
                                        <td className="p-3 text-center text-emerald-400 font-bold">{season.stats.goals}</td>
                                        <td className="p-3 text-center text-blue-400 font-bold">{season.stats.assists}</td>
                                        <td className="p-3 text-center text-yellow-500">{season.stats.yellowCards}</td>
                                        <td className="p-3 text-center text-red-500">{season.stats.redCards}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Status Check */}
            {(player.weeksInjured > 0 || player.matchSuspension > 0) && (
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                     {player.weeksInjured > 0 && (
                         <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-2 rounded flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                             {t.injured} ({player.weeksInjured} {t.week})
                         </div>
                     )}
                     {player.matchSuspension > 0 && (
                         <div className="bg-yellow-900/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 rounded flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                             {t.suspended} ({player.matchSuspension} match)
                         </div>
                     )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
