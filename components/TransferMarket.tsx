
import React, { useState } from 'react';
import { Player, Team, Translation, Position } from '../types';
import { ShoppingCart, Filter, DollarSign } from 'lucide-react';

interface TransferMarketProps {
  marketPlayers: Player[];
  userTeam: Team;
  onBuyPlayer: (player: Player) => void;
  onPlayerClick: (player: Player) => void;
  t: Translation;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({ 
  marketPlayers, 
  userTeam, 
  onBuyPlayer, 
  onPlayerClick, 
  t 
}) => {
  const [filterPos, setFilterPos] = useState<string>('ALL');

  const filteredPlayers = marketPlayers.filter(p => 
    filterPos === 'ALL' || p.position === filterPos
  ).sort((a,b) => b.overall - a.overall);

  const canAfford = (value: number) => userTeam.budget >= value;

  const getOverallColor = (ovr: number) => {
    if (ovr >= 85) return 'text-emerald-400';
    if (ovr >= 75) return 'text-blue-400';
    if (ovr >= 65) return 'text-yellow-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Budget */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl gap-4">
         <div>
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 <ShoppingCart className="text-emerald-500" /> {t.market}
             </h2>
             <p className="text-slate-400 text-sm">{t.scoutTalent}</p>
         </div>
         <div className="bg-slate-900 px-6 py-3 rounded-lg border border-slate-600 flex items-center gap-3">
             <span className="text-slate-400 text-sm">{t.clubBudget}</span>
             <span className="text-2xl font-bold text-emerald-400">€{(userTeam.budget / 1000000).toFixed(2)}M</span>
         </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', ...Object.values(Position)].map(pos => (
            <button
                key={pos}
                onClick={() => setFilterPos(pos)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filterPos === pos ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                {pos}
            </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                <tr>
                    <th className="p-4">{t.pos}</th>
                    <th className="p-4">Name</th>
                    <th className="p-4 text-center">{t.age}</th>
                    <th className="p-4 text-center">OVR</th>
                    <th className="p-4 text-right">{t.value}</th>
                    <th className="p-4 text-center">{t.action}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
                {filteredPlayers.map(player => (
                    <tr key={player.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="p-4">
                            <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded">{player.position}</span>
                        </td>
                        <td className="p-4 cursor-pointer" onClick={() => onPlayerClick(player)}>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{player.firstName} {player.lastName}</div>
                            <div className="text-xs text-slate-500">{player.nationality}</div>
                        </td>
                        <td className="p-4 text-center text-slate-300">{player.age}</td>
                        <td className={`p-4 text-center font-bold ${getOverallColor(player.overall)}`}>{player.overall}</td>
                        <td className="p-4 text-right font-mono text-slate-300">€{(player.value / 1000000).toFixed(1)}M</td>
                        <td className="p-4 text-center">
                            <button
                                onClick={() => onBuyPlayer(player)}
                                disabled={!canAfford(player.value)}
                                className={`text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 mx-auto transition-all ${canAfford(player.value) ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                            >
                                <DollarSign size={14} /> {t.buy}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};
