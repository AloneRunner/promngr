import React, { useState, useEffect, useRef } from 'react';
import { Globe, X, Search, TrendingUp, TrendingDown, Minus, AlertCircle, Wifi, Swords } from 'lucide-react';
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
import { MatchEngine } from '../services/ucuncumotor';
import {
  Team, Player, Match, MatchEvent, MatchEventType,
  Position, LineupStatus, CoachArchetype, TacticType, TeamTactic
} from '../src/types';

interface Props {
  onClose: () => void;
  userTeam: Team;
  userPlayers: Player[];
  lang: string;
}

type Phase = 'idle' | 'syncing' | 'searching' | 'found' | 'playing' | 'result' | 'error';

interface LiveEvent {
  minute: number;
  text: string;
  type: MatchEventType;
  teamId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcOvr(players: Player[]): number {
  const starters = players.filter(p => p.lineup === 'STARTING').slice(0, 11);
  if (!starters.length) return Math.round(players.slice(0, 11).reduce((s, p) => s + p.overall, 0) / Math.max(1, players.slice(0, 11).length)) || 70;
  return Math.round(starters.reduce((s, p) => s + p.overall, 0) / starters.length);
}

function mapPosition(pos: string): Position {
  if (pos === 'GK') return Position.GK;
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DEF'].includes(pos)) return Position.DEF;
  if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'MID'].includes(pos)) return Position.MID;
  return Position.FWD;
}

function buildBotPlayer(id: string, teamId: string, ovr: number, position: string, index: number, name: string): Player {
  const pos = mapPosition(position);
  const isGK = pos === Position.GK;
  const isDEF = pos === Position.DEF;
  const isMID = pos === Position.MID;
  const base = ovr;
  return {
    id, firstName: name, lastName: '', age: 26, nationality: 'XX', position: pos,
    attributes: {
      finishing:    isGK ? 5   : isDEF ? 30         : isMID ? 50        : base + 3,
      passing:      isGK ? 40  : isDEF ? base - 5   : isMID ? base      : base - 2,
      tackling:     isGK ? 20  : isDEF ? base + 5   : isMID ? base - 5  : 40,
      dribbling:    isGK ? 10  : isDEF ? base - 10  : isMID ? base      : base + 2,
      goalkeeping:  isGK ? base + 5 : 5,
      speed:        base - 3,
      stamina:      base - 2,
      strength:     base - 4,
      positioning:  isDEF || isGK ? base + 3 : base - 2,
      aggression:   base - 8,
      composure:    base - 5,
      vision:       isMID ? base + 3 : base - 5,
      leadership:   base - 10,
      decisions:    base - 5,
    },
    hiddenAttributes: { consistency: 70, importantMatches: 65, injuryProneness: 15 },
    stats: {},
    overall: ovr,
    potential: ovr + 2,
    value: 1000000,
    wage: 10000, salary: 10000,
    contractYears: 2,
    morale: 75, condition: 92, form: 7,
    teamId,
    isTransferListed: false, weeksInjured: 0, matchSuspension: 0,
    lineup: 'STARTING' as LineupStatus,
    lineupIndex: index,
    playStyles: [],
    leagueId: 'online',
  } as unknown as Player;
}

function buildBotTeam(id: string, name: string): Team {
  const tactic: TeamTactic = {
    formation: TacticType.T_433,
    style: 'Possession', aggression: 'Normal', tempo: 'Normal',
    width: 'Normal', defensiveLine: 'Medium', passingStyle: 'Mixed',
    marking: 'Zonal', mentality: 'Balanced', pressingIntensity: 'Balanced',
    attackPlan: 'WIDE_CROSS',
  };
  return {
    id, name, city: name,
    primaryColor: '#1a1a2e', secondaryColor: '#e94560',
    reputation: 70, budget: 10000000, boardConfidence: 70,
    leagueId: 'online', wages: 500000,
    facilities: { stadiumCapacity: 15000, stadiumLevel: 2, trainingLevel: 2, academyLevel: 2 },
    staff: { headCoachLevel: 3, scoutLevel: 2, physioLevel: 2 },
    objectives: [], tactic,
    coachArchetype: CoachArchetype.TACTICIAN,
    trainingFocus: 'BALANCED', trainingIntensity: 'NORMAL',
    youthCandidates: [], recentForm: [],
    stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  } as unknown as Team;
}

function buildMatch(homeId: string, awayId: string): Match {
  return {
    id: `online-${Date.now()}`,
    week: 1, homeTeamId: homeId, awayTeamId: awayId,
    homeScore: 0, awayScore: 0, events: [],
    isPlayed: false, date: Date.now(), attendance: 20000,
    currentMinute: 0, weather: 'Clear', timeOfDay: 'Day',
    stats: {
      homePossession: 50, awayPossession: 50,
      homeShots: 0, awayShots: 0,
      homeOnTarget: 0, awayOnTarget: 0,
      homeXG: 0, awayXG: 0,
      homeSaves: 0, awaySaves: 0,
    },
  } as unknown as Match;
}

function runSimulation(
  homeTeam: Team, awayTeam: Team,
  homePlayers: Player[], awayPlayers: Player[],
  userTeamId: string
): { match: Match; events: MatchEvent[] } {
  const match = buildMatch(homeTeam.id, awayTeam.id);
  const engine = new MatchEngine(match, homeTeam, awayTeam, homePlayers, awayPlayers, userTeamId);
  // 90 min × 60 ticks = 5400 steps
  for (let i = 0; i < 5400; i++) {
    engine.step();
  }
  return { match: engine.match, events: engine.match.events || [] };
}

function eventEmoji(type: MatchEventType): string {
  switch (type) {
    case MatchEventType.GOAL:        return '⚽';
    case MatchEventType.CARD_YELLOW: return '🟨';
    case MatchEventType.CARD_RED:    return '🟥';
    case MatchEventType.INJURY:      return '🚑';
    case MatchEventType.HALF_TIME:   return '🔔';
    case MatchEventType.FULL_TIME:   return '🏁';
    case MatchEventType.PENALTY:     return '🎯';
    default:                          return '▸';
  }
}

const IMPORTANT = new Set([
  MatchEventType.GOAL, MatchEventType.CARD_YELLOW, MatchEventType.CARD_RED,
  MatchEventType.INJURY, MatchEventType.HALF_TIME, MatchEventType.FULL_TIME,
  MatchEventType.PENALTY,
]);

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnlineMatchModal({ onClose, userTeam, userPlayers, lang }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [profile, setProfile] = useState<MPPlayer | null>(null);
  const [opponent, setOpponent] = useState<MPOpponent | null>(null);
  const [liveScore, setLiveScore] = useState([0, 0]);
  const [liveMinute, setLiveMinute] = useState(0);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [finalScore, setFinalScore] = useState([0, 0]);
  const [eloChange, setEloChange] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const eventsRef = useRef<LiveEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myOvr = calcOvr(userPlayers);

  useEffect(() => {
    registerPlayer('Manager', userTeam.name);
    getMyProfile().then(setProfile);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function handleFindMatch() {
    setPhase('syncing');
    setErrorMsg('');
    const starters = userPlayers.filter(p => p.lineup === 'STARTING').slice(0, 11);
    await syncTeamSnapshot(
      (userTeam.tactic?.formation as string) || '4-3-3', {},
      starters.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`.trim(), ovr: p.overall, position: p.position })),
      myOvr
    );
    setPhase('searching');
    const opp = await findOpponent();
    if (!opp) {
      setPhase('error');
      setErrorMsg(lang === 'tr' ? 'Henüz yeterli oyuncu yok. Birkaç dakika sonra tekrar dene!' : 'No opponents found yet!');
      return;
    }
    setOpponent(opp);
    setPhase('found');
  }

  function handleStartMatch() {
    if (!opponent) return;
    setPhase('playing');
    setLiveScore([0, 0]);
    setLiveMinute(0);
    setLiveEvents([]);

    // Build squads
    const starters = userPlayers
      .filter(p => p.lineup === 'STARTING')
      .slice(0, 11);

    const oppSquad: Player[] = ((opponent.squad as any[]) || []).map((s, i) =>
      buildBotPlayer(`opp-${i}`, 'opp', s.ovr || 70, s.position || 'MID', i, s.name || `P${i + 1}`)
    );

    if (oppSquad.length < 11) {
      // fill missing with generic players
      const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
      while (oppSquad.length < 11) {
        const i = oppSquad.length;
        oppSquad.push(buildBotPlayer(`opp-${i}`, 'opp', opponent.avg_ovr || 70, positions[i] || 'MID', i, `P${i + 1}`));
      }
    }

    const homeTeamObj = buildBotTeam(userTeam.id, userTeam.name);
    const awayTeamObj = buildBotTeam('opp', opponent.team_name);

    // Assign starters to home team players (carry actual attributes)
    const homePlayers = starters.map((p, i) => ({ ...p, teamId: userTeam.id, lineup: 'STARTING' as LineupStatus, lineupIndex: i }));

    // Run full simulation
    let simResult: ReturnType<typeof runSimulation>;
    try {
      simResult = runSimulation(homeTeamObj, awayTeamObj, homePlayers, oppSquad, userTeam.id);
    } catch (e) {
      console.error('Sim error', e);
      // fallback: just random score
      simResult = {
        match: { ...buildMatch(userTeam.id, 'opp'), homeScore: Math.floor(Math.random() * 4), awayScore: Math.floor(Math.random() * 4) } as any,
        events: [],
      };
    }

    const importantEvents: LiveEvent[] = simResult.events
      .filter(e => IMPORTANT.has(e.type))
      .map(e => ({
        minute: e.minute,
        text: e.description || e.type,
        type: e.type,
        teamId: e.teamId || '',
      }));

    eventsRef.current = importantEvents;
    const finalH = simResult.match.homeScore;
    const finalA = simResult.match.awayScore;
    setFinalScore([finalH, finalA]);

    // Replay: 150ms per minute = ~13.5s total
    let currentMin = 0;
    let displayH = 0;
    let displayA = 0;
    timerRef.current = setInterval(() => {
      currentMin++;
      setLiveMinute(currentMin);

      const newEvents = eventsRef.current.filter(e => e.minute === currentMin);
      if (newEvents.length > 0) {
        for (const ev of newEvents) {
          if (ev.type === MatchEventType.GOAL) {
            if (ev.teamId === userTeam.id) displayH++;
            else displayA++;
          }
        }
        setLiveScore([displayH, displayA]);
        setLiveEvents(prev => [...prev.slice(-6), ...newEvents]);
      }

      if (currentMin >= 90) {
        clearInterval(timerRef.current!);
        setLiveScore([finalH, finalA]);
        finishMatch(finalH, finalA, opponent);
      }
    }, 150);
  }

  async function finishMatch(h: number, a: number, opp: MPOpponent) {
    const result = await submitMatchResult(opp.player_id, h, a);
    setEloChange(result?.homeEloChange ?? 0);
    const updated = await getMyProfile();
    setProfile(updated);
    setPhase('result');
  }

  const eloColor = eloChange > 0 ? 'text-emerald-400' : eloChange < 0 ? 'text-red-400' : 'text-slate-400';
  const EloIcon = eloChange > 0 ? TrendingUp : eloChange < 0 ? TrendingDown : Minus;
  const isPlaying = phase === 'playing';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-sm shadow-2xl shadow-purple-900/40 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            <span className="font-bold text-white">Online Maç</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded font-bold uppercase tracking-wider">BETA</span>
          </div>
          {!isPlaying && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">

          {/* Beta warning (hide while playing) */}
          {phase === 'idle' && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{lang === 'tr' ? 'Deneme aşaması. Maç sonuçları ELO puanını etkiler.' : 'Beta feature. Match results affect your ELO rating.'}</span>
            </div>
          )}

          {/* My profile */}
          {profile && !isPlaying && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-white/5">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{lang === 'tr' ? 'Senin Takımın' : 'Your Team'}</div>
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

          {/* Opponent info */}
          {opponent && !isPlaying && phase !== 'result' && (
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-purple-500/20">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{lang === 'tr' ? 'Rakip' : 'Opponent'}</div>
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

          {/* ── LIVE MATCH ── */}
          {isPlaying && opponent && (
            <div className="flex flex-col gap-3">
              {/* Scoreboard */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-purple-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    {liveMinute < 45 ? `${liveMinute}'` : liveMinute < 90 ? `${liveMinute}'` : `90'`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full animate-pulse font-bold">CANLI</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-center">
                    <div className="text-xs text-slate-400 truncate mb-1">{userTeam.name}</div>
                    <div className="text-4xl font-black text-white">{liveScore[0]}</div>
                  </div>
                  <div className="text-2xl text-slate-500 font-bold">—</div>
                  <div className="flex-1 text-center">
                    <div className="text-xs text-slate-400 truncate mb-1">{opponent.team_name}</div>
                    <div className="text-4xl font-black text-white">{liveScore[1]}</div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, (liveMinute / 90) * 100)}%` }}
                />
              </div>

              {/* Events feed */}
              <div className="bg-slate-800/50 rounded-xl border border-white/5 p-3 min-h-[120px]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Maç Olayları</div>
                {liveEvents.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">Maç başlıyor...</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {[...liveEvents].reverse().map((ev, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-xs ${i === 0 ? 'text-white' : 'text-slate-400'}`}
                      >
                        <span className="text-[10px] font-mono text-slate-500 w-6 shrink-0">{ev.minute}'</span>
                        <span>{eventEmoji(ev.type)}</span>
                        <span className="truncate">{ev.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {phase === 'result' && opponent && (
            <div className="flex flex-col gap-3">
              <div className="text-center p-5 bg-slate-800/40 rounded-xl border border-white/5">
                <div className="text-xs text-slate-400 mb-1">{userTeam.name} — {opponent.team_name}</div>
                <div className="text-4xl font-black text-white mb-2">
                  {finalScore[0]} — {finalScore[1]}
                </div>
                <div className="text-base font-bold mb-3">
                  {finalScore[0] > finalScore[1] ? '🏆 Kazandın!' : finalScore[0] < finalScore[1] ? '😔 Kaybettin' : '🤝 Berabere'}
                </div>
                <div className={`flex items-center justify-center gap-1 text-sm font-bold ${eloColor}`}>
                  <EloIcon size={16} />
                  <span>{eloChange > 0 ? '+' : ''}{eloChange} ELO</span>
                  {profile && <span className="text-slate-400 ml-1 font-normal">→ {profile.elo}</span>}
                </div>
              </div>

              {/* Replay events summary */}
              {liveEvents.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl border border-white/5 p-3">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Önemli Anlar</div>
                  <div className="flex flex-col gap-1.5">
                    {liveEvents.filter(e => e.type === MatchEventType.GOAL || e.type === MatchEventType.CARD_RED).map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="text-[10px] font-mono text-slate-500 w-6 shrink-0">{ev.minute}'</span>
                        <span>{eventEmoji(ev.type)}</span>
                        <span className="truncate">{ev.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 text-center">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          {phase === 'idle' && (
            <button onClick={handleFindMatch}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              <Search size={16} />
              {lang === 'tr' ? 'Rakip Bul' : 'Find Opponent'}
            </button>
          )}

          {(phase === 'syncing' || phase === 'searching') && (
            <div className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm">
              {phase === 'syncing'
                ? <><Wifi size={16} className="animate-pulse text-purple-400" /> {lang === 'tr' ? 'Kadron senkronize ediliyor...' : 'Syncing squad...'}</>
                : <><Search size={16} className="animate-bounce text-purple-400" /> {lang === 'tr' ? 'Rakip aranıyor...' : 'Searching...'}</>
              }
            </div>
          )}

          {phase === 'found' && (
            <button onClick={handleStartMatch}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              <Swords size={16} />
              {lang === 'tr' ? 'Maça Başla!' : 'Start Match!'}
            </button>
          )}

          {phase === 'error' && (
            <button onClick={handleFindMatch}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              <Search size={16} /> {lang === 'tr' ? 'Tekrar Dene' : 'Try Again'}
            </button>
          )}

          {phase === 'result' && (
            <div className="flex flex-col gap-2">
              <button onClick={handleFindMatch}
                className="w-full py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-300 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95">
                <Search size={14} /> {lang === 'tr' ? 'Tekrar Oyna' : 'Play Again'}
              </button>
              <button onClick={onClose}
                className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all active:scale-95">
                {lang === 'tr' ? 'Kapat' : 'Close'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
