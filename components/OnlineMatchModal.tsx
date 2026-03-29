import React, { useState, useEffect } from 'react';
import { Globe, X, Search, Trophy, Swords, TrendingUp, TrendingDown, Minus, AlertCircle, Wifi } from 'lucide-react';
import {
  getOrCreatePlayerId,
  registerPlayer,
  syncTeamSnapshot,
  findOpponent,
  submitMatchResult,
  getMyProfile,
  MPOpponent,
  MPPlayer,
} from '../src/services/multiplayerService';
import { Team, Player } from '../src/types';

interface Props {
  onClose: () => void;
  userTeam: Team;
  userPlayers: Player[];
  lang: string;
}

type Phase = 'idle' | 'syncing' | 'searching' | 'found' | 'playing' | 'result' | 'error';

function calcOvr(players: Player[]): number {
  const starters = players.filter(p => p.lineupStatus === 'STARTER').slice(0, 11);
  if (starters.length === 0) return 70;
  return Math.round(starters.reduce((s, p) => s + p.ovr, 0) / starters.length);
}

function simulateScore(homeOvr: number, awayOvr: number): [number, number] {
  const diff = homeOvr - awayOvr;
  const homeAdv = 0.5 + diff * 0.02; // home advantage
  let h = 0, a = 0;
  for (let i = 0; i < 5; i++) {
    if (Math.random() < Math.max(0.1, Math.min(0.9, homeAdv))) h++;
    else a++;
  }
  // realistic score (0-4 range)
  return [Math.min(h, 4), Math.min(a, 4)];
}

export default function OnlineMatchModal({ onClose, userTeam, userPlayers, lang }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [profile, setProfile] = useState<MPPlayer | null>(null);
  const [opponent, setOpponent] = useState<MPOpponent | null>(null);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [eloChange, setEloChange] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const myOvr = calcOvr(userPlayers);

  useEffect(() => {
    // Register / load profile on open
    (async () => {
      const playerId = getOrCreatePlayerId();
      await registerPlayer(userTeam.managerName || 'Manager', userTeam.name);
      const p = await getMyProfile();
      setProfile(p);
    })();
  }, []);

  async function handleFindMatch() {
    setPhase('syncing');
    setErrorMsg('');

    // Sync current squad snapshot
    const starters = userPlayers.filter(p => p.lineupStatus === 'STARTER').slice(0, 11);
    const squadSnapshot = starters.map(p => ({
      id: p.id, name: p.name, ovr: p.ovr, position: p.position,
    }));

    await syncTeamSnapshot(
      userTeam.formation || '4-3-3',
      {},
      squadSnapshot,
      myOvr
    );

    setPhase('searching');
    const opp = await findOpponent();

    if (!opp) {
      setPhase('error');
      setErrorMsg(lang === 'tr'
        ? 'Henüz yeterli oyuncu yok. Birkaç dakika sonra tekrar dene!'
        : 'Not enough players yet. Try again in a few minutes!');
      return;
    }

    setOpponent(opp);
    setPhase('found');
  }

  async function handleStartMatch() {
    if (!opponent) return;
    setPhase('playing');

    await new Promise(r => setTimeout(r, 1500)); // simulate match duration

    const oppOvr = opponent.avg_ovr || 70;
    const [h, a] = simulateScore(myOvr, oppOvr);
    setScore([h, a]);

    const result = await submitMatchResult(opponent.player_id, h, a);
    setEloChange(result?.homeEloChange ?? 0);

    // Refresh profile
    const updated = await getMyProfile();
    setProfile(updated);

    setPhase('result');
  }

  const eloColor = eloChange > 0 ? 'text-emerald-400' : eloChange < 0 ? 'text-red-400' : 'text-slate-400';
  const EloIcon = eloChange > 0 ? TrendingUp : eloChange < 0 ? TrendingDown : Minus;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-sm shadow-2xl shadow-purple-900/40">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            <span className="font-bold text-white">Online Maç</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded font-bold uppercase tracking-wider">BETA</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">

          {/* Beta warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{lang === 'tr'
              ? 'Bu özellik deneme aşamasındadır. Maç sonuçları ELO puanını etkiler.'
              : 'This feature is in beta. Match results affect your ELO rating.'}</span>
          </div>

          {/* My profile */}
          {profile && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-white/5">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Senin Takımın</div>
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
          {(phase === 'found' || phase === 'playing' || phase === 'result') && opponent && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-purple-500/20">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Rakip</div>
                <div className="font-bold text-white text-sm">{opponent.team_name}</div>
                <div className="text-[11px] text-slate-400">OVR {Math.round(opponent.avg_ovr)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-0.5">ELO</div>
                <div className="text-xl font-bold text-purple-300">{opponent.elo}</div>
                <div className="text-[11px] text-slate-500">{opponent.username}</div>
              </div>
            </div>
          )}

          {/* Result */}
          {phase === 'result' && (
            <div className="text-center p-4 bg-slate-800/40 rounded-xl border border-white/5">
              <div className="text-3xl font-black text-white mb-1">
                {score[0]} — {score[1]}
              </div>
              <div className="text-sm text-slate-400 mb-3">
                {score[0] > score[1] ? '🏆 Kazandın!' : score[0] < score[1] ? '😔 Kaybettin' : '🤝 Berabere'}
              </div>
              <div className={`flex items-center justify-center gap-1 text-sm font-bold ${eloColor}`}>
                <EloIcon size={16} />
                <span>{eloChange > 0 ? '+' : ''}{eloChange} ELO</span>
              </div>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 text-center">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {phase === 'idle' || phase === 'error' ? (
              <button
                onClick={handleFindMatch}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Search size={16} />
                {lang === 'tr' ? 'Rakip Bul' : 'Find Opponent'}
              </button>
            ) : phase === 'syncing' ? (
              <div className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm">
                <Wifi size={16} className="animate-pulse text-purple-400" />
                {lang === 'tr' ? 'Kadron senkronize ediliyor...' : 'Syncing your squad...'}
              </div>
            ) : phase === 'searching' ? (
              <div className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm">
                <Search size={16} className="animate-bounce text-purple-400" />
                {lang === 'tr' ? 'Rakip aranıyor...' : 'Searching for opponent...'}
              </div>
            ) : phase === 'found' ? (
              <button
                onClick={handleStartMatch}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Swords size={16} />
                {lang === 'tr' ? 'Maça Başla!' : 'Start Match!'}
              </button>
            ) : phase === 'playing' ? (
              <div className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm">
                <Swords size={16} className="animate-pulse text-emerald-400" />
                {lang === 'tr' ? 'Maç oynanıyor...' : 'Match in progress...'}
              </div>
            ) : phase === 'result' ? (
              <>
                <button
                  onClick={handleFindMatch}
                  className="w-full py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm active:scale-95"
                >
                  <Search size={14} />
                  {lang === 'tr' ? 'Tekrar Oyna' : 'Play Again'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all active:scale-95"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
