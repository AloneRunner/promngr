
import React, { useState } from 'react';
import { Player, Team, Translation } from '../types';
import { Globe, Search, Info } from 'lucide-react';

interface WorldRankingsProps {
  players: Player[];
  teams: Team[];
  t: Translation;
  onPlayerClick: (player: Player) => void;
}

export const WorldRankings: React.FC<WorldRankingsProps> = ({ players, teams, t, onPlayerClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sort by Overall Descending
  const sortedPlayers = [...players]
    .filter(p => 
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 100); // Top 100

  const getTeamName = (teamId: string) => {
      const team = teams.find(t => t.id === teamId);
      return team ? team.name : 'Free Agent';
  };

  const getTeamColor = (teamId: string) => {
      const team = teams.find(t => t.id === teamId);
      return team ? team.primaryColor : '#64748b';
  };

  const getOverallColor = (ovr: number) => {
    if (ovr >= 90) return 'text-emerald-400 font-bold';
    if (ovr >= 85) return 'text-blue-400 font-bold';
    if (ovr >= 80) return 'text-green-300';
    return 'text-slate-300';
  };

  const getTotalStats = (p: Player) => {
      return (
          p.attributes.speed + 
          p.attributes.finishing + 
          p.attributes.passing + 
          p.attributes.dribbling + 
          p.attributes.tackling + 
          p.attributes.strength
      );
  };

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <Globe className="text-emerald-500" /> {t.worldRankings}
                 </h2>
                 <p className="text-slate-400 text-sm">{t.globalDb}</p>
             </div>
             
             <div className="relative">
                 <input 
                    type="text" 
                    placeholder={t.searchPlayer}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:border-emerald-500 w-64"
                 />
                 <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
             </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded flex items-center gap-2 text-xs text-blue-200">
            <Info size={14} />
            <span>{t.ovrInfo}</span>
        </div>

        {/* Database Table */}
        <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse text-sm">
                     <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                         <tr>
                             <th className="p-3 text-center">{t.rank}</th>
                             <th className="p-3">Player</th>
                             <th className="p-3">{t.nat}</th>
                             <th className="p-3">{t.team}</th>
                             <th className="p-3 text-center">{t.pos}</th>
                             <th className="p-3 text-center text-white border-r border-slate-700">OVR</th>
                             <th className="p-3 text-center text-orange-400 font-bold border-r border-slate-700" title="Total Stats">TS</th>
                             <th className="p-3 text-center bg-slate-900/50">PAC</th>
                             <th className="p-3 text-center bg-slate-900/50">SHO</th>
                             <th className="p-3 text-center bg-slate-900/50">PAS</th>
                             <th className="p-3 text-center bg-slate-900/50">DRI</th>
                             <th className="p-3 text-center bg-slate-900/50">DEF</th>
                             <th className="p-3 text-center bg-slate-900/50">PHY</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700/50">
                         {sortedPlayers.map((player, index) => (
                             <tr key={player.id} className="hover:bg-slate-700/50 transition-colors group cursor-pointer" onClick={() => onPlayerClick(player)}>
                                 <td className="p-3 text-center font-mono text-slate-500">{index + 1}</td>
                                 <td className="p-3 font-bold text-white group-hover:text-emerald-400">{player.firstName} {player.lastName}</td>
                                 <td className="p-3 text-slate-400 text-xs">{player.nationality.substring(0,3).toUpperCase()}</td>
                                 <td className="p-3">
                                     <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 rounded-full" style={{backgroundColor: getTeamColor(player.teamId)}}></div>
                                         <span className="text-xs text-slate-300">{getTeamName(player.teamId)}</span>
                                     </div>
                                 </td>
                                 <td className="p-3 text-center">
                                     <span className="bg-slate-700 text-[10px] px-1.5 py-0.5 rounded text-white">{player.position}</span>
                                 </td>
                                 <td className={`p-3 text-center text-base border-r border-slate-700 ${getOverallColor(player.overall)}`}>{player.overall}</td>
                                 <td className="p-3 text-center font-mono text-orange-300 border-r border-slate-700">{getTotalStats(player)}</td>
                                 
                                 {/* Stats Columns */}
                                 <td className={`p-3 text-center font-mono ${player.attributes.speed > 85 ? 'text-green-400 font-bold' : 'text-slate-400'}`}>{player.attributes.speed}</td>
                                 <td className={`p-3 text-center font-mono ${player.attributes.finishing > 85 ? 'text-green-400 font-bold' : 'text-slate-400'}`}>{player.attributes.finishing}</td>
                                 <td className={`p-3 text-center font-mono ${player.attributes.passing > 85 ? 'text-green-400 font-bold' : 'text-slate-400'}`}>{player.attributes.passing}</td>
                                 <td className={`p-3 text-center font-mono ${player.attributes.dribbling > 85 ? 'text-green-400 font-bold' : 'text-slate-400'}`}>{player.attributes.dribbling}</td>
                                 <td className={`p-3 text-center font-mono ${player.attributes.tackling > 85 ? 'text-green-400 font-bold' : 'text-slate-400'}`}>{player.attributes.tackling}</td>
                                 <td className={`p-3 text-center font-mono ${player.attributes.strength > 85 ? 'text-green-400 font-bold' : 'text-slate-400'}`}>{player.attributes.strength}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    </div>
  );
};
