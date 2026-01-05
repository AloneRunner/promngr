
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredPlayers = marketPlayers.filter(p =>
    filterPos === 'ALL' || p.position === filterPos
  ).sort((a, b) => b.overall - a.overall);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const displayedPlayers = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterPos]);

  const canAfford = (value: number) => userTeam.budget >= value;

  const isBuyable = (player: Player) => {
    return player.teamId === 'FREE_AGENT' || player.isTransferListed;
  };

  const isOwned = (player: Player) => player.teamId === userTeam.id;

  const getOverallColor = (ovr: number) => {
    if (ovr >= 85) return 'text-emerald-400';
    if (ovr >= 75) return 'text-blue-400';
    if (ovr >= 65) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const getAttributeClass = (val: number) => {
    if (val >= 90) return 'attr-box attr-elite';
    if (val >= 80) return 'attr-box attr-high';
    if (val >= 70) return 'attr-box attr-med';
    return 'attr-box attr-low';
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Header & Budget - FM Style */}
      <div className="fm-panel rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600/20 p-2 rounded-lg border border-emerald-500/30">
            <ShoppingCart className="text-emerald-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{t.market}</h2>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Transfer Window Open</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">{t.clubBudget}</div>
          <div className="text-xl font-mono text-emerald-400 font-bold tracking-tight">€{(userTeam.budget / 1000000).toFixed(2)}M</div>
          <div className="text-[9px] text-slate-600 font-mono mt-1 text-right">DB: {marketPlayers.length} Players</div>
        </div>
      </div>

      {/* Filters - FM Style Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar px-1">
        {['ALL', ...Object.values(Position)].map(pos => (
          <button
            key={pos}
            onClick={() => setFilterPos(pos)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap border ${filterPos === pos
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'}`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* List - FM Spreadsheet Style */}
      <div className="fm-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="fm-table w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-white/10">
                <th className="p-3 sticky left-0 bg-slate-900 z-10">Player Info</th>
                <th className="p-3 text-center hidden md:table-cell">Age</th>
                <th className="p-3 text-center">OVR</th>
                <th className="p-3 text-center hidden sm:table-cell">SPD</th>
                <th className="p-3 text-center hidden sm:table-cell">SHT</th>
                <th className="p-3 text-center hidden sm:table-cell">PAS</th>
                <th className="p-3 text-center hidden sm:table-cell">DRI</th>
                <th className="p-3 text-center hidden sm:table-cell">DEF</th>
                <th className="p-3 text-right">{t.value}</th>
                <th className="p-3 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedPlayers.map((player, idx) => (
                <tr key={player.id} className={`transition-colors hover:bg-white/5 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-transparent'}`}>
                  <td className="p-2 sticky left-0 z-10 bg-inherit cursor-pointer" onClick={() => onPlayerClick(player)}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded text-[10px] font-bold shadow-md ${player.position === 'GK' ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30' :
                        player.position === 'DEF' ? 'bg-blue-600/20 text-blue-500 border border-blue-600/30' :
                          player.position === 'MID' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-600/30' :
                            'bg-red-600/20 text-red-500 border border-red-600/30'}`}>
                        {player.position}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs md:text-sm">{player.firstName} {player.lastName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span className={`fi fi-${player.nationality === 'Turkey' ? 'tr' : player.nationality.toLowerCase().slice(0, 2)}`}></span>
                          {/* We don't have team info here directly easily, skipping for perf */}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-center text-slate-400 hidden md:table-cell">{player.age}</td>
                  <td className={`p-2 text-center font-bold ${getOverallColor(player.overall)}`}>{player.overall}</td>
                  {/* Attributes */}
                  <td className="p-2 text-center hidden sm:table-cell"><span className={getAttributeClass(player.attributes.speed)}>{player.attributes.speed}</span></td>
                  <td className="p-2 text-center hidden sm:table-cell"><span className={getAttributeClass(player.attributes.finishing)}>{player.attributes.finishing}</span></td>
                  <td className="p-2 text-center hidden sm:table-cell"><span className={getAttributeClass(player.attributes.passing)}>{player.attributes.passing}</span></td>
                  <td className="p-2 text-center hidden sm:table-cell"><span className={getAttributeClass(player.attributes.dribbling)}>{player.attributes.dribbling}</span></td>
                  <td className="p-2 text-center hidden sm:table-cell"><span className={getAttributeClass(player.attributes.tackling)}>{player.attributes.tackling}</span></td>
                  <td className="p-2 text-right font-mono text-emerald-400 font-bold">€{(player.value / 1000000).toFixed(1)}M</td>
                  <td className="p-2 text-center">
                    {isOwned(player) ? (
                      <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded font-bold">OWNED</span>
                    ) : (
                      <button
                        onClick={() => onBuyPlayer(player)}
                        disabled={!canAfford(player.value)}
                        className={`p-1.5 rounded transition-transform active:scale-95 shadow-lg ${isBuyable(player)
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 text-white"
                            : "bg-slate-700 hover:bg-slate-600 shadow-slate-900/20 text-slate-300 border border-slate-600"
                          }`}
                        title={isBuyable(player) ? t.buy : "Make Offer (Unlisted)"}
                      >
                        <DollarSign size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPlayers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No players found in this category.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition font-bold text-xs"
          >
            ← {t.previous || 'Prev'}
          </button>
          <span className="text-slate-400 text-xs font-mono font-bold">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition font-bold text-xs"
          >
            {t.next || 'Next'} →
          </button>
        </div>
      </div>
    </div>
  );
};
