import React, { useState, useEffect } from 'react';
import { Globe, X, Search, AlertCircle, Wifi, Shield, Swords, Users } from 'lucide-react';
import {
  registerPlayer, syncTeamSnapshot, findOpponent, getMyProfile,
  MPOpponent, MPPlayer,
} from '../src/services/multiplayerService';
import { Team, Player } from '../src/types';

interface Props {
  onClose: () => void;
  onStartMatch: (opponent: MPOpponent, matchType?: 'ranked' | 'direct') => void;
  userTeam: Team;
  userPlayers: Player[];
  managerName?: string;
  managerNationality?: string;
  t: any;
  directOpponent?: MPOpponent | null;
}

type Phase = 'idle' | 'syncing' | 'searching' | 'found' | 'error';

const POS_ORDER = ['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','CF','ST'];

function posColor(pos: string) {
  if (pos === 'GK') return 'bg-yellow-600/30 text-yellow-400 border-yellow-500/30';
  if (['CB','LB','RB','CDM'].includes(pos)) return 'bg-blue-600/30 text-blue-400 border-blue-500/30';
  if (['CM','CAM','DM'].includes(pos)) return 'bg-green-600/30 text-green-400 border-green-500/30';
  return 'bg-red-600/30 text-red-400 border-red-500/30';
}

function ovrColor(ovr: number) {
  if (ovr >= 88) return 'text-yellow-400';
  if (ovr >= 80) return 'text-emerald-400';
  if (ovr >= 72) return 'text-white';
  return 'text-slate-400';
}

// Key stats to show per position
function keyStats(pos: string, attrs: any): { label: string; val: number }[] {
  if (!attrs) return [];
  if (pos === 'GK') return [
    { label: 'KAL', val: attrs.goalkeeping },
    { label: 'HIZ', val: attrs.speed },
    { label: 'GÜÇ', val: attrs.strength },
  ];
  if (['CB','CDM'].includes(pos)) return [
    { label: 'MUD', val: attrs.tackling },
    { label: 'GÜÇ', val: attrs.strength },
    { label: 'HIZ', val: attrs.speed },
  ];
  if (['LB','RB'].includes(pos)) return [
    { label: 'HIZ', val: attrs.speed },
    { label: 'MUD', val: attrs.tackling },
    { label: 'PAS', val: attrs.passing },
  ];
  if (['CM','CAM','DM'].includes(pos)) return [
    { label: 'PAS', val: attrs.passing },
    { label: 'VZY', val: attrs.vision },
    { label: 'DRB', val: attrs.dribbling },
  ];
  // FWD / wingers
  return [
    { label: 'FNŞ', val: attrs.finishing },
    { label: 'HIZ', val: attrs.speed },
    { label: 'DRB', val: attrs.dribbling },
  ];
}

function StatBar({ val }: { val: number }) {
  const pct = Math.min(100, Math.max(0, val));
  const color = pct >= 85 ? 'bg-yellow-400' : pct >= 75 ? 'bg-emerald-400' : pct >= 65 ? 'bg-blue-400' : 'bg-slate-500';
  return (
    <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TacticPill({ label, value, color = 'slate' }: { label: string; value: string; color?: string }) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-600/20 border-purple-500/30 text-purple-300',
    blue:   'bg-blue-600/20 border-blue-500/30 text-blue-300',
    amber:  'bg-amber-600/20 border-amber-500/30 text-amber-300',
    red:    'bg-red-600/20 border-red-500/30 text-red-300',
    green:  'bg-green-600/20 border-green-500/30 text-green-300',
    slate:  'bg-slate-700/50 border-white/10 text-slate-300',
  };
  return (
    <div className={`flex flex-col items-center px-2 py-1.5 rounded-lg border ${colorMap[color] || colorMap.slate}`}>
      <span className="text-[9px] uppercase tracking-wider opacity-60 mb-0.5">{label}</span>
      <span className="text-[10px] font-bold leading-none">{value || '—'}</span>
    </div>
  );
}

function OpponentSquadPreview({ opponent, t }: { opponent: MPOpponent; t: any }) {
  const [tab, setTab] = useState<'tactics' | 'squad'>('tactics');
  const squad: any[] = Array.isArray(opponent.squad) ? opponent.squad : [];
  const tactics: any = opponent.tactics || {};
  const starters = squad.filter((p: any) => p.lineup !== 'BENCH').slice(0, 11);
  const bench    = squad.filter((p: any) => p.lineup === 'BENCH').slice(0, 7);

  const sortedStarters = [...starters].sort((a, b) =>
    (POS_ORDER.indexOf(a.position) + 99) - (POS_ORDER.indexOf(b.position) + 99)
  );

  return (
    <div className="bg-slate-800/60 rounded-xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div>
          <div className="text-[9px] text-purple-400 uppercase tracking-wider mb-0.5">{t.onlineOpponentFound || 'Opponent Found!'}</div>
          <div className="font-bold text-white text-sm leading-tight">{opponent.team_name}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            OVR <span className="text-white font-semibold">{Math.round(opponent.avg_ovr)}</span>
            <span className="mx-1.5 opacity-30">•</span>
            <span className="text-purple-300 font-semibold">{opponent.formation || '4-3-3'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-purple-400 uppercase tracking-wider mb-0.5">ELO</div>
          <div className="text-2xl font-black text-purple-300 leading-none">{opponent.elo}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-white/5">
        <button
          onClick={() => setTab('tactics')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition-colors ${tab === 'tactics' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Swords size={11} /> Taktik
        </button>
        <button
          onClick={() => setTab('squad')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition-colors ${tab === 'squad' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Users size={11} /> Kadro ({starters.length})
        </button>
      </div>

      {/* Tactics tab */}
      {tab === 'tactics' && (
        <div className="p-3 flex flex-col gap-2">
          {/* Main style row */}
          <div className="grid grid-cols-3 gap-1.5">
            <TacticPill label="Stil" value={tactics.style || '—'} color="purple" />
            <TacticPill label="Formasyon" value={opponent.formation || '4-3-3'} color="blue" />
            <TacticPill label="Mentality" value={tactics.mentality || '—'} color="amber" />
          </div>
          {/* Detail row */}
          <div className="grid grid-cols-3 gap-1.5">
            <TacticPill label="Agresiflik" value={tactics.aggression || '—'} color={tactics.aggression === 'Yüksek' ? 'red' : tactics.aggression === 'Düşük' ? 'green' : 'slate'} />
            <TacticPill label="Tempo" value={tactics.tempo || '—'} color="slate" />
            <TacticPill label="Genişlik" value={tactics.width || '—'} color="slate" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <TacticPill label="Def. Hattı" value={tactics.defensiveLine || '—'} color="slate" />
            <TacticPill label="Pressing" value={tactics.pressingIntensity || '—'} color={tactics.pressingIntensity === 'Yüksek' ? 'red' : 'slate'} />
            <TacticPill label="Pas Stili" value={tactics.passingStyle || '—'} color="slate" />
          </div>
          {tactics.marking && (
            <div className="grid grid-cols-2 gap-1.5">
              <TacticPill label="Marking" value={tactics.marking} color="slate" />
              {tactics.attackPlan && <TacticPill label="Atak Planı" value={tactics.attackPlan} color="green" />}
            </div>
          )}
        </div>
      )}

      {/* Squad tab */}
      {tab === 'squad' && (
        <div className="max-h-64 overflow-y-auto">
          {/* Starters */}
          <div className="px-3 pt-2 pb-1">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">İlk 11</div>
            <div className="flex flex-col gap-0.5">
              {sortedStarters.map((p: any, i: number) => {
                const attrs = p.attributes;
                const stats = keyStats(p.position, attrs);
                return (
                  <div key={i} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 w-9 text-center ${posColor(p.position)}`}>
                      {p.position || 'CM'}
                    </span>
                    <span className="flex-1 text-[11px] text-slate-200 truncate">{p.name || 'Player'}</span>
                    {/* Key stats */}
                    {stats.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {stats.map((s, si) => (
                          <div key={si} className="flex flex-col items-center gap-0.5">
                            <span className="text-[8px] text-slate-500 leading-none">{s.label}</span>
                            <span className="text-[10px] font-bold leading-none" style={{
                              color: s.val >= 85 ? '#facc15' : s.val >= 75 ? '#34d399' : s.val >= 65 ? '#cbd5e1' : '#64748b'
                            }}>{s.val || '?'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className={`text-[11px] font-black shrink-0 ml-1 ${ovrColor(p.ovr)}`}>{p.ovr || '?'}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Bench */}
          {bench.length > 0 && (
            <div className="px-3 pt-1 pb-3">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Yedekler</div>
              <div className="flex flex-col gap-0.5">
                {bench.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 w-9 text-center opacity-70 ${posColor(p.position)}`}>
                      {p.position || 'CM'}
                    </span>
                    <span className="flex-1 text-[10px] text-slate-400 truncate">{p.name || 'Player'}</span>
                    <span className={`text-[10px] font-bold shrink-0 opacity-70 ${ovrColor(p.ovr)}`}>{p.ovr || '?'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OnlineMatchModal({ onClose, onStartMatch, userTeam, userPlayers, managerName, managerNationality, t, directOpponent }: Props) {
  const [phase, setPhase] = useState<Phase>(directOpponent ? 'found' : 'idle');
  const [profile, setProfile] = useState<MPPlayer | null>(null);
  const [opponent, setOpponent] = useState<MPOpponent | null>(directOpponent || null);
  const [errorMsg, setErrorMsg] = useState('');

  const starters = userPlayers.filter(p => p.lineup === 'STARTING').slice(0, 11);
  const bench = userPlayers.filter(p => p.lineup === 'BENCH').slice(0, 7);
  const myOvr = Math.round(starters.reduce((s, p) => s + p.overall, 0) / Math.max(1, starters.length)) || 70;

  useEffect(() => {
    registerPlayer(managerName || 'Manager', userTeam.name, managerNationality);
    getMyProfile().then(setProfile);
  }, []);

  // Direct opponent passed from leaderboard
  useEffect(() => {
    if (directOpponent) {
      setOpponent(directOpponent);
      setPhase('found');
    }
  }, [directOpponent]);

  async function handleFindMatch() {
    setPhase('syncing');
    setErrorMsg('');
    const tactic: any = userTeam.tactic || {};
    await syncTeamSnapshot(
      (tactic.formation as string) || '4-3-3',
      {
        style: tactic.style, aggression: tactic.aggression, tempo: tactic.tempo,
        width: tactic.width, defensiveLine: tactic.defensiveLine, passingStyle: tactic.passingStyle,
        marking: tactic.marking, mentality: tactic.mentality, pressingIntensity: tactic.pressingIntensity,
        attackPlan: tactic.attackPlan,
      },
      [
        ...starters.map(p => ({
          id: p.id, name: `${p.firstName} ${p.lastName}`.trim(),
          ovr: p.overall, position: p.position,
          lineup: 'STARTING', lineupIndex: p.lineupIndex ?? 0,
          playStyles: p.playStyles ?? [],
          attributes: p.attributes ?? null,
        })),
        ...bench.map(p => ({
          id: p.id, name: `${p.firstName} ${p.lastName}`.trim(),
          ovr: p.overall, position: p.position,
          lineup: 'BENCH', lineupIndex: p.lineupIndex ?? 99,
          playStyles: p.playStyles ?? [],
          attributes: p.attributes ?? null,
        })),
      ],
      myOvr
    );
    setPhase('searching');
    const opp = await findOpponent();
    if (!opp) {
      setPhase('error');
      setErrorMsg(t.onlineNoOpponent || 'No opponents found yet!');
      return;
    }
    setOpponent(opp);
    setPhase('found');
  }

  const matchType = directOpponent ? 'direct' : 'ranked';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-sm shadow-2xl shadow-purple-900/40 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            <span className="font-bold text-white">{t.onlineMatch || 'Online Match'}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded font-bold uppercase tracking-wider">{t.onlineMatchBeta || 'BETA'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto">

          {phase === 'idle' && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{t.onlineBetaWarning || 'Beta phase — ELO ratings will be reset periodically.'}</span>
            </div>
          )}

          {/* My profile */}
          {profile && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-white/5 shrink-0">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{t.onlineYourTeam || 'Your Team'}</div>
                <div className="font-bold text-white text-sm">{userTeam.name}</div>
                <div className="text-[11px] text-slate-400">OVR {myOvr}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-0.5">ELO</div>
                <div className="text-xl font-bold text-purple-300">{profile.elo}</div>
                <div className="text-[10px] text-slate-500">{profile.wins}{t.onlineWinShort||'W'} {profile.draws}{t.onlineDrawShort||'D'} {profile.losses}{t.onlineLossShort||'L'}</div>
              </div>
            </div>
          )}

          {/* Opponent found — with squad preview */}
          {phase === 'found' && opponent && (
            <OpponentSquadPreview opponent={opponent} t={t} />
          )}

          {phase === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 text-center">
              {errorMsg}
            </div>
          )}

          {/* Buttons */}
          {(phase === 'idle' || phase === 'error') && (
            <button onClick={handleFindMatch}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0">
              <Search size={16} />
              {t.onlineFindOpponent || 'Find Opponent'}
            </button>
          )}

          {(phase === 'syncing' || phase === 'searching') && (
            <div className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm shrink-0">
              {phase === 'syncing'
                ? <><Wifi size={16} className="animate-pulse text-purple-400" /> {t.onlineSyncing || 'Syncing squad...'}</>
                : <><Search size={16} className="animate-bounce text-purple-400" /> {t.onlineSearching || 'Searching...'}</>
              }
            </div>
          )}

          {phase === 'found' && opponent && (
            <button onClick={() => { onClose(); onStartMatch(opponent, matchType); }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0">
              ⚽ {t.onlineStartMatch || 'Start Match!'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
