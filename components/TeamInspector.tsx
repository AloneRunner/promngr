import React from 'react';
import { Team, Player, Translation, Position } from '../types';
import { X, Shield, Users } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface TeamInspectorProps {
  team: Team;
  players: Player[];
  onClose: () => void;
  t: Translation;
}

const getOverallColor = (ovr: number) => {
  if (ovr >= 85) return 'text-emerald-400';
  if (ovr >= 75) return 'text-blue-400';
  if (ovr >= 65) return 'text-yellow-400';
  return 'text-slate-400';
};

const PlayerRow: React.FC<{ player: Player }> = ({ player }) => (
  <div className="flex items-center justify-between p-2 rounded border border-slate-700 bg-slate-800/50 mb-1">
      <div className="flex items-center gap-3">
           <div className="w-8 text-center text-xs font-bold text-slate-500 bg-slate-900 rounded py-1">{player.position}</div>
           <PlayerAvatar visual={player.visual} size="sm" />
           <div>
              <div className="font-bold text-sm text-slate-300">
                  {player.firstName.substring(0,1)}. {player.lastName}
              </div>
              <div className="text-[10px] text-slate-500">{player.nationality}</div>
           </div>
      </div>
      <div className={`font-bold ${getOverallColor(player.overall)}`}>{player.overall}</div>
  </div>
);

export const TeamInspector: React.FC<TeamInspectorProps> = ({ team, players, onClose, t }) => {
  const starters = players.filter(p => p.lineup === 'STARTING').sort((a,b) => {
      const posOrder = { [Position.GK]: 0, [Position.DEF]: 1, [Position.MID]: 2, [Position.FWD]: 3 };
      return posOrder[a.position] - posOrder[b.position];
  });
  const bench = players.filter(p => p.lineup === 'BENCH').sort((a,b) => b.overall - a.overall);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-slate-800 shadow-lg" style={{backgroundColor: team.primaryColor, color: '#fff'}}>
                        {team.name.substring(0, 1)}
                     </div>
                     <div>
                         <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                         <div className="text-slate-400 text-sm">{team.city} • Rep: {team.reputation}</div>
                     </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Tactic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-emerald-500"/> Tactical Setup</h3>
                             <div className="space-y-3">
                                 <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                     <span className="text-slate-400 text-sm">Formation</span>
                                     <span className="text-white font-bold">{team.tactic.formation}</span>
                                 </div>
                                 <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                     <span className="text-slate-400 text-sm">Style</span>
                                     <span className="text-white font-bold">{team.tactic.style}</span>
                                 </div>
                                 <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                     <span className="text-slate-400 text-sm">Aggression</span>
                                     <span className="text-white font-bold">{team.tactic.aggression}</span>
                                 </div>
                                 <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                     <span className="text-slate-400 text-sm">Tempo</span>
                                     <span className="text-white font-bold">{team.tactic.tempo}</span>
                                 </div>
                             </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500"/> Team Stats</h3>
                             <div className="grid grid-cols-2 gap-4 text-center">
                                  <div>
                                      <div className="text-xs text-slate-500 uppercase">Played</div>
                                      <div className="text-xl font-bold text-white">{team.stats.played}</div>
                                  </div>
                                  <div>
                                      <div className="text-xs text-slate-500 uppercase">Points</div>
                                      <div className="text-xl font-bold text-emerald-400">{team.stats.points}</div>
                                  </div>
                                  <div>
                                      <div className="text-xs text-slate-500 uppercase">GF</div>
                                      <div className="text-xl font-bold text-green-400">{team.stats.gf}</div>
                                  </div>
                                  <div>
                                      <div className="text-xs text-slate-500 uppercase">GA</div>
                                      <div className="text-xl font-bold text-red-400">{team.stats.ga}</div>
                                  </div>
                             </div>
                        </div>
                    </div>

                    {/* Squad List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h3 className="text-emerald-500 font-bold mb-2 uppercase text-xs tracking-widest">Starting XI</h3>
                            <div className="bg-slate-900/30 p-2 rounded border border-emerald-900/20">
                                {starters.map(p => <PlayerRow key={p.id} player={p} />)}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-slate-500 font-bold mb-2 uppercase text-xs tracking-widest">Bench</h3>
                            <div className="bg-slate-900/30 p-2 rounded border border-slate-800">
                                {bench.map(p => <PlayerRow key={p.id} player={p} />)}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
  );
};