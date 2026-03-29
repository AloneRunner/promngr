import React, { useState, useEffect } from 'react';
import { Globe, X, Search, AlertCircle, Wifi } from 'lucide-react';
import {
  registerPlayer, syncTeamSnapshot, findOpponent, getMyProfile,
  MPOpponent, MPPlayer,
} from '../src/services/multiplayerService';
import { Team, Player } from '../src/types';

interface Props {
  onClose: () => void;
  onStartMatch: (opponent: MPOpponent) => void;
  userTeam: Team;
  userPlayers: Player[];
  managerName?: string;
  managerNationality?: string;
  t: any;
}

type Phase = 'idle' | 'syncing' | 'searching' | 'found' | 'error';

export default function OnlineMatchModal({ onClose, onStartMatch, userTeam, userPlayers, managerName, managerNationality, t }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [profile, setProfile] = useState<MPPlayer | null>(null);
  const [opponent, setOpponent] = useState<MPOpponent | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const starters = userPlayers.filter(p => p.lineup === 'STARTING').slice(0, 11);
  const bench = userPlayers.filter(p => p.lineup === 'BENCH').slice(0, 7);
  const myOvr = Math.round(starters.reduce((s, p) => s + p.overall, 0) / Math.max(1, starters.length)) || 70;

  useEffect(() => {
    registerPlayer(managerName || 'Manager', userTeam.name, managerNationality);
    getMyProfile().then(setProfile);
  }, []);

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
        })),
        ...bench.map(p => ({
          id: p.id, name: `${p.firstName} ${p.lastName}`.trim(),
          ovr: p.overall, position: p.position,
          lineup: 'BENCH', lineupIndex: p.lineupIndex ?? 99,
          playStyles: p.playStyles ?? [],
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-sm shadow-2xl shadow-purple-900/40">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            <span className="font-bold text-white">{t.onlineMatch || 'Online Match'}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded font-bold uppercase tracking-wider">{t.onlineMatchBeta || 'BETA'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">

          {phase === 'idle' && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{t.onlineBetaWarning || 'Beta phase — ELO ratings will be reset periodically.'}</span>
            </div>
          )}

          {/* My profile */}
          {profile && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-white/5">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{t.onlineYourTeam || 'Your Team'}</div>
                <div className="font-bold text-white text-sm">{userTeam.name}</div>
                <div className="text-[11px] text-slate-400">OVR {myOvr}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-0.5">ELO</div>
                <div className="text-xl font-bold text-purple-300">{profile.elo}</div>
                <div className="text-[10px] text-slate-500">{profile.wins}G {profile.draws}B {profile.losses}M</div>
              </div>
            </div>
          )}

          {/* Opponent found */}
          {phase === 'found' && opponent && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-purple-500/20">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{t.onlineOpponentFound || 'Opponent Found!'}</div>
                <div className="font-bold text-white text-sm">{opponent.team_name}</div>
                <div className="text-[11px] text-slate-400">OVR {Math.round(opponent.avg_ovr)} • {opponent.username}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-0.5">ELO</div>
                <div className="text-xl font-bold text-purple-300">{opponent.elo}</div>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 text-center">
              {errorMsg}
            </div>
          )}

          {/* Buttons */}
          {(phase === 'idle' || phase === 'error') && (
            <button onClick={handleFindMatch}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              <Search size={16} />
              {t.onlineFindOpponent || 'Find Opponent'}
            </button>
          )}

          {(phase === 'syncing' || phase === 'searching') && (
            <div className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm">
              {phase === 'syncing'
                ? <><Wifi size={16} className="animate-pulse text-purple-400" /> {t.onlineSyncing || 'Syncing squad...'}</>
                : <><Search size={16} className="animate-bounce text-purple-400" /> {t.onlineSearching || 'Searching...'}</>
              }
            </div>
          )}

          {phase === 'found' && opponent && (
            <button onClick={() => { onClose(); onStartMatch(opponent); }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              ⚽ {t.onlineStartMatch || 'Start Match!'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
