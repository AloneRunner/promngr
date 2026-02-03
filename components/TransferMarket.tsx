
import React, { useState } from 'react';
import { Player, Team, Translation, Position } from '../types';
import { ShoppingCart, Filter, DollarSign, Heart, Search, ChevronDown, ChevronUp } from 'lucide-react';


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
  const [listFilter, setListFilter] = useState<'ALL' | 'LISTED' | 'UNLISTED' | 'FREE'>('ALL');
  const [showInterestedOnly, setShowInterestedOnly] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [minAttributes, setMinAttributes] = useState({
    speed: 0, finishing: 0, passing: 0, dribbling: 0, tackling: 0
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredPlayers = React.useMemo(() => {
    return marketPlayers.filter(p => {
      const posMatch = filterPos === 'ALL' || p.position === filterPos;

      // Status Filter
      const listMatch = listFilter === 'ALL' ||
        (listFilter === 'LISTED' && p.isTransferListed && p.teamId !== 'FREE_AGENT') ||
        (listFilter === 'UNLISTED' && !p.isTransferListed && p.teamId !== 'FREE_AGENT') ||
        (listFilter === 'FREE' && p.teamId === 'FREE_AGENT');

      // Interest Filter (Approximate: Reputation vs Overall)
      const normalizedRep = userTeam.reputation / 100;
      const interestMatch = !showInterestedOnly || p.teamId === 'FREE_AGENT' || p.overall <= (normalizedRep + 5);

      // Attribute Filter
      const attrMatch =
        p.attributes.speed >= minAttributes.speed &&
        p.attributes.finishing >= minAttributes.finishing &&
        p.attributes.passing >= minAttributes.passing &&
        p.attributes.dribbling >= minAttributes.dribbling &&
        p.attributes.tackling >= minAttributes.tackling;

      return posMatch && listMatch && interestMatch && attrMatch;
    }).sort((a, b) => b.overall - a.overall);
  }, [marketPlayers, filterPos, listFilter, showInterestedOnly, minAttributes, userTeam.reputation]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const displayedPlayers = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterPos, listFilter]);

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
    <div className="space-y-4 animate-fade-in pb-20 max-w-full overflow-hidden">
      {/* Header & Budget - Premium Glassmorphism */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/20 p-3 rounded-xl border border-emerald-500/30 shadow-lg">
            <ShoppingCart className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-lg">{t.market}</h2>
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Transfer Window Open</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">{t.clubBudget}</div>
          <div className="text-xl font-mono text-emerald-400 font-bold tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">€{(userTeam.budget / 1000000).toFixed(2)}M</div>
          <div className="text-[9px] text-slate-500 font-mono mt-1 text-right">DB: {marketPlayers.length} Players</div>
        </div>
      </div>

      {/* Filters - Premium Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 px-1">
        {/* Position Filters */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {['ALL', ...Object.values(Position)].map(pos => (
            <button
              key={pos}
              onClick={() => setFilterPos(pos)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border active:scale-95 ${filterPos === pos
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-400/50 shadow-lg shadow-emerald-900/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-700/80 hover:text-slate-200 hover:border-slate-600'}`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* List Status Filters */}
        <div className="flex gap-1 ml-auto">
          {[
            { key: 'ALL', label: t.filterAll || 'All', color: 'slate' },
            { key: 'LISTED', label: `✅ ${t.filterListed || 'Listed'}`, color: 'emerald' },
            { key: 'UNLISTED', label: `🔒 ${t.filterUnlisted || 'Not Listed'}`, color: 'red' },
            { key: 'FREE', label: `🆓 ${t.filterFree || 'Free'}`, color: 'blue' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setListFilter(item.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border active:scale-95 ${listFilter === item.key
                ? item.color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-400/50'
                  : item.color === 'red' ? 'bg-red-600 text-white border-red-400/50'
                    : item.color === 'blue' ? 'bg-blue-600 text-white border-blue-400/50'
                      : 'bg-slate-600 text-white border-slate-400/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-700/80'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters & Interest Toggle */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Interest Toggle */}
          <button
            onClick={() => setShowInterestedOnly(!showInterestedOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all border ${showInterestedOnly
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
          >
            <Heart size={14} className={showInterestedOnly ? 'fill-white' : ''} />
            {t.interestedOnly || 'Interested Players Only'}
          </button>

          {/* Advanced Search Toggle */}
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all border ${showAdvancedSearch
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
          >
            <Search size={14} />
            {t.advancedSearch || 'Has Attribute...'}
            {showAdvancedSearch ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Collapsible Attribute Sliders */}
        {showAdvancedSearch && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/5 animate-fade-in">
            {Object.entries({
              speed: 'SPD', finishing: 'SHT', passing: 'PAS', dribbling: 'DRI', tackling: 'DEF'
            }).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                  <span>Min {label}</span>
                  <span className="text-blue-400">{(minAttributes as any)[key]}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="99"
                  value={(minAttributes as any)[key]}
                  onChange={(e) => setMinAttributes(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            ))}
            <div className="flex items-end">
              <button
                onClick={() => setMinAttributes({ speed: 0, finishing: 0, passing: 0, dribbling: 0, tackling: 0 })}
                className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded border border-slate-600 transition-colors"
              >
                Reset Attributes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List - Premium Table */}
      <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10">
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
                <th className="p-3 text-right hidden md:table-cell">Maaş</th>
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
                  <td className="p-2 text-right font-mono text-red-400 text-xs hidden md:table-cell">€{Math.floor(player.wage).toLocaleString()}/h</td>
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
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-900/50 backdrop-blur">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-slate-700 hover:to-slate-600 transition font-bold text-xs border border-white/10 active:scale-95"
          >
            ← {t.previous || 'Prev'}
          </button>
          <span className="text-slate-400 text-xs font-mono font-bold bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-slate-700 hover:to-slate-600 transition font-bold text-xs border border-white/10 active:scale-95"
          >
            {t.next || 'Next'} →
          </button>
        </div>
      </div>
    </div>
  );
};
