import React, { useState, useEffect } from 'react';
import { X, Trophy, TrendingUp, TrendingDown, Minus, RefreshCw, Globe, Medal } from 'lucide-react';
import { getLeaderboard, getMyProfile, MPPlayer, getOrCreatePlayerId } from '../src/services/multiplayerService';

interface Props {
  onClose: () => void;
  t: any;
}

// ─── Liga sistemi (ileride genişler) ────────────────────────────────────────

interface League {
  name: string;
  minElo: number;
  maxElo: number;
  color: string;
  icon: string;
  gradient: string;
  border: string;
}

const LEAGUES: League[] = [
  { name: 'Elmas', minElo: 1400, maxElo: 9999, icon: '💎', color: 'text-cyan-300',    gradient: 'from-cyan-900/40 to-slate-900',    border: 'border-cyan-500/40' },
  { name: 'Altın',  minElo: 1200, maxElo: 1399, icon: '🥇', color: 'text-yellow-300', gradient: 'from-yellow-900/40 to-slate-900',   border: 'border-yellow-500/40' },
  { name: 'Gümüş', minElo: 1050, maxElo: 1199, icon: '🥈', color: 'text-slate-300',   gradient: 'from-slate-700/40 to-slate-900',   border: 'border-slate-400/40' },
  { name: 'Bronz',  minElo: 0,    maxElo: 1049, icon: '🥉', color: 'text-orange-300', gradient: 'from-orange-900/30 to-slate-900',   border: 'border-orange-600/40' },
];

function getLeague(elo: number): League {
  return LEAGUES.find(l => elo >= l.minElo && elo <= l.maxElo) ?? LEAGUES[LEAGUES.length - 1];
}

function getRankIcon(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

function winRate(p: MPPlayer): number {
  const total = p.wins + p.draws + p.losses;
  if (!total) return 0;
  return Math.round((p.wins / total) * 100);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnlineLeaderboard({ onClose, t }: Props) {
  const [players, setPlayers] = useState<MPPlayer[]>([]);
  const [myProfile, setMyProfile] = useState<MPPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState<string>('all');
  const myId = getOrCreatePlayerId();

  async function load() {
    setLoading(true);
    const [lb, me] = await Promise.all([getLeaderboard(), getMyProfile()]);
    setPlayers(lb);
    setMyProfile(me);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = activeLeague === 'all'
    ? players
    : players.filter(p => getLeague(p.elo).name === activeLeague);

  const myRank = players.findIndex(p => p.player_id === myId) + 1;
  const myLeague = myProfile ? getLeague(myProfile.elo) : null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-slate-900 border border-purple-500/20 rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            <span className="font-bold text-white">{t.onlineRankings || 'Online Rankings'}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded font-bold uppercase tracking-wider">BETA</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading}
              className="text-slate-400 hover:text-white transition-colors p-1">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* My profile banner */}
        {myProfile && myLeague && (
          <div className={`mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r ${myLeague.gradient} border ${myLeague.border} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{myLeague.icon}</span>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t.onlineMyRank || 'Your Rank'}</div>
                <div className="font-bold text-white text-sm">{myProfile.team_name}</div>
                <div className={`text-xs font-bold ${myLeague.color}`}>{myLeague.name} Ligi • {myRank > 0 ? `#${myRank}` : 'Sırasız'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-purple-400 uppercase tracking-wider">ELO</div>
              <div className="text-2xl font-black text-purple-300">{myProfile.elo}</div>
              <div className="text-[10px] text-slate-500">{myProfile.wins}G {myProfile.draws}B {myProfile.losses}M • %{winRate(myProfile)}</div>
            </div>
          </div>
        )}

        {/* League filter tabs */}
        <div className="flex gap-1.5 px-4 mt-3 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveLeague('all')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeLeague === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >{t.onlineAllLeagues || 'All'}</button>
          {LEAGUES.map(l => (
            <button key={l.name}
              onClick={() => setActiveLeague(l.name)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeLeague === l.name ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >{l.icon} {l.name}</button>
          ))}
        </div>

        {/* League badge range info */}
        {activeLeague !== 'all' && (
          <div className="px-4 mt-2 shrink-0">
            {(() => {
              const l = LEAGUES.find(x => x.name === activeLeague)!;
              return (
                <div className={`text-[10px] text-center ${l.color} bg-slate-800/50 rounded-lg py-1.5 border ${l.border}`}>
                  {l.icon} {l.name}: {l.minElo === 0 ? '0' : l.minElo} — {l.maxElo === 9999 ? '∞' : l.maxElo} ELO
                </div>
              );
            })()}
          </div>
        )}

        {/* Player list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 mt-3 flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin text-purple-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              {activeLeague === 'all' ? (t.onlineNoMatches || 'No rankings yet.') : (t.onlineNoLeaguePlayers || 'No players in this league.')}
            </div>
          ) : (
            filtered.map((p, i) => {
              const globalRank = players.findIndex(x => x.player_id === p.player_id) + 1;
              const league = getLeague(p.elo);
              const isMe = p.player_id === myId;
              const total = p.wins + p.draws + p.losses;

              return (
                <div key={p.player_id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isMe
                      ? `bg-gradient-to-r ${league.gradient} ${league.border} ring-1 ring-purple-500/40`
                      : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-7 text-center shrink-0">
                    <span className={`text-sm font-black ${globalRank <= 3 ? 'text-lg' : 'text-slate-400'}`}>
                      {getRankIcon(globalRank)}
                    </span>
                  </div>

                  {/* League icon */}
                  <span className="text-lg shrink-0">{league.icon}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-slate-200'}`}>
                        {p.team_name}
                      </span>
                      {isMe && <span className="text-[9px] px-1 py-0.5 bg-purple-600/60 text-purple-300 rounded font-bold">SEN</span>}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {total > 0
                        ? `${p.wins}G ${p.draws}B ${p.losses}M • %${winRate(p)} kazanma`
                        : 'Henüz maç yok'}
                    </div>
                  </div>

                  {/* ELO */}
                  <div className="text-right shrink-0">
                    <div className={`text-base font-black ${league.color}`}>{p.elo}</div>
                    <div className="text-[10px] text-slate-500">ELO</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* League info footer */}
        <div className="px-4 pb-4 shrink-0">
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {LEAGUES.map(l => (
              <div key={l.name} className={`p-2 rounded-lg bg-slate-800/50 border ${l.border} text-center`}>
                <div className="text-base">{l.icon}</div>
                <div className={`text-[9px] font-bold ${l.color}`}>{l.name}</div>
                <div className="text-[9px] text-slate-500">
                  {l.minElo === 0 ? '<1050' : l.maxElo === 9999 ? '1400+' : `${l.minElo}+`}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
