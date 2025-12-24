
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Team, Player, MatchEventType, TeamTactic, MessageType, LineupStatus, TrainingFocus, TrainingIntensity, Sponsor, Message, Match, AssistantAdvice, TeamStaff, Position } from './types';
import { generateWorld, simulateTick, processWeeklyEvents, simulateFullMatch, processSeasonEnd, initializeMatch, performSubstitution, updateMatchTactic, simulateLeagueRound, analyzeClubHealth, autoPickLineup } from './services/engine';
import { TeamManagement } from './components/TeamManagement';
import { LeagueTable } from './components/LeagueTable';
import { MatchCenter } from './components/MatchCenter';
import { ClubManagement } from './components/ClubManagement';
import { TransferMarket } from './components/TransferMarket';
import { PlayerModal } from './components/PlayerModal';
import { NewsCenter } from './components/NewsCenter';
import { TrainingCenter } from './components/TrainingCenter';
import { SponsorModal } from './components/SponsorModal';
import { TeamInspector } from './components/TeamInspector'; 
import { WorldRankings } from './components/WorldRankings';
import { AssistantReport } from './components/AssistantReport';
import { GameGuide } from './components/GameGuide';
import { TRANSLATIONS, LEAGUE_PRESETS } from './constants';
import { LayoutDashboard, Users, Trophy, SkipForward, Briefcase, CheckCircle2, Building2, ShoppingCart, Mail, RefreshCw, Globe, Activity, DollarSign, Zap, X, Target, BookOpen } from 'lucide-react';

const SAVE_KEY = 'pro_manager_save_v11_features'; 
const TOTAL_WEEKS_PER_SEASON = 38; 
const uuid = () => Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [view, setView] = useState<'dashboard' | 'squad' | 'league' | 'match' | 'club' | 'transfers' | 'news' | 'training' | 'rankings' | 'guide'>('dashboard');
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [lang, setLang] = useState<'tr' | 'en'>('tr'); 
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLeagueSelect, setShowLeagueSelect] = useState(false);
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [showSeasonSummary, setShowSeasonSummary] = useState(false);
  const [seasonSummaryData, setSeasonSummaryData] = useState<{winner: Team, retired: string[], promoted: string[]} | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [inspectedTeamId, setInspectedTeamId] = useState<string | null>(null); 
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [offerToProcess, setOfferToProcess] = useState<Message | null>(null); 
  const [assistantAdvice, setAssistantAdvice] = useState<AssistantAdvice[] | null>(null);
  
  const [showDerbySelect, setShowDerbySelect] = useState(false);
  const [derbyHomeId, setDerbyHomeId] = useState<string | null>(null);
  const [derbyAwayId, setDerbyAwayId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        if (parsed.players && parsed.players.length > 0 && !parsed.players[0].stats) {
            parsed.players = parsed.players.map((p: any) => ({
                ...p,
                stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 }
            }));
        }
        setGameState(parsed);
      } catch (e) {
        console.error("Failed to load save", e);
        setShowLeagueSelect(true);
      }
    } else {
       setShowLeagueSelect(true);
    }
  }, []);

  useEffect(() => {
    if (gameState) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  const handleStartGame = (leagueId: string) => {
      setShowLeagueSelect(false);
      setTimeout(() => {
          const world = generateWorld(leagueId);
          setGameState(world);
          setShowTeamSelect(true); 
      }, 500);
  };

  const handleSelectTeam = (teamId: string) => {
      setGameState(prev => prev ? { ...prev, userTeamId: teamId } : null);
      setShowTeamSelect(false);
      setShowWelcome(true);
  };

  const handleResetGame = () => {
     if (confirm(t.resignConfirm)) { 
         localStorage.removeItem(SAVE_KEY);
         setGameState(null);
         setShowLeagueSelect(true);
     }
  };

  const handleResign = () => {
      if (confirm(t.resignConfirm)) {
          setShowTeamSelect(true);
          setView('dashboard');
      }
  };

  const openDerbySelector = () => {
      if(!gameState) return;
      const sorted = [...gameState.teams].sort((a,b) => b.reputation - a.reputation);
      setDerbyHomeId(sorted[0].id);
      setDerbyAwayId(sorted[1].id);
      setShowDerbySelect(true);
  }

  const handleQuickDerbyStart = () => {
      if (!gameState || !derbyHomeId || !derbyAwayId) return;
      if (derbyHomeId === derbyAwayId) {
          alert("Please select different teams.");
          return;
      }

      const homeTeam = gameState.teams.find(team => team.id === derbyHomeId);
      const awayTeam = gameState.teams.find(team => team.id === derbyAwayId);
      
      if (!homeTeam || !awayTeam) return;

      const friendlyMatch: Match = {
          id: uuid(),
          week: 0,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore: 0,
          awayScore: 0,
          events: [],
          isPlayed: false,
          isFriendly: true,
          date: Date.now(),
          attendance: homeTeam.facilities.stadiumCapacity,
          currentMinute: 0,
          weather: 'Sunny',
          timeOfDay: 'Night',
          stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 }
      };

      setGameState(prev => prev ? { ...prev, matches: [...prev.matches, friendlyMatch] } : null);
      
      const homePlayers = gameState.players.filter(p => p.teamId === homeTeam.id);
      const awayPlayers = gameState.players.filter(p => p.teamId === awayTeam.id);
      const initialSim = initializeMatch(friendlyMatch, homeTeam, awayTeam, homePlayers, awayPlayers);

      setGameState(prev => {
          if (!prev) return null;
          const matches = prev.matches.map(m => m.id === friendlyMatch.id ? {
              ...m,
              liveData: { ballHolderId: null, pitchZone: 50, lastActionText: 'Friendly Kickoff', simulation: initialSim }
          } : m);
          return { ...prev, matches };
      });

      setActiveMatchId(friendlyMatch.id);
      setShowDerbySelect(false);
      setView('match');
      setDebugLog([]);
  };

  const handleUpdateTactic = (tactic: TeamTactic) => {
    if (!gameState) return;
    const updatedTeams = gameState.teams.map(t => 
      t.id === gameState.userTeamId ? { ...t, tactic } : t
    );
    setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);

    if (activeMatchId && gameState.userTeamId) {
        updateMatchTactic(activeMatchId, gameState.userTeamId, tactic);
    }
  };

  const handleUpdateLineup = (playerId: string, status: LineupStatus) => {
      if (!gameState) return;
      const updatedPlayers = gameState.players.map(p => 
          p.id === playerId ? { ...p, lineup: status } : p
      );
      setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
  };

  const handleSwapPlayers = (p1Id: string, p2Id: string) => {
      if (!gameState) return;
      const p1 = gameState.players.find(p => p.id === p1Id);
      const p2 = gameState.players.find(p => p.id === p2Id);
      if (!p1 || !p2) return;

      const updatedPlayers = gameState.players.map(p => {
          if (p.id === p1Id) return { ...p, lineup: p2.lineup, lineupIndex: p2.lineupIndex || 0 };
          if (p.id === p2Id) return { ...p, lineup: p1.lineup, lineupIndex: p1.lineupIndex || 0 };
          return p;
      });
      setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
  };

  const handleMovePlayer = (playerId: string, direction: 'UP' | 'DOWN') => {
      if (!gameState) return;
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return;

      const group = gameState.players
          .filter(p => p.teamId === gameState.userTeamId && p.lineup === player.lineup)
          .sort((a, b) => (a.lineupIndex || 0) - (b.lineupIndex || 0));

      const currentIndex = group.findIndex(p => p.id === playerId);
      const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex >= 0 && targetIndex < group.length) {
          const targetPlayer = group[targetIndex];
          const updatedPlayers = gameState.players.map(p => {
              if (p.id === player.id) return { ...p, lineupIndex: targetPlayer.lineupIndex };
              if (p.id === targetPlayer.id) return { ...p, lineupIndex: player.lineupIndex };
              return p;
          });
          setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
      }
  };

  const handleSetTrainingFocus = (focus: TrainingFocus) => {
      if (!gameState) return;
      const updatedTeams = gameState.teams.map(t => 
          t.id === gameState.userTeamId ? { ...t, trainingFocus: focus } : t
      );
      setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);
  };

  const handleSetTrainingIntensity = (intensity: TrainingIntensity) => {
      if (!gameState) return;
      const updatedTeams = gameState.teams.map(t => 
          t.id === gameState.userTeamId ? { ...t, trainingIntensity: intensity } : t
      );
      setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);
  };

  const handleSelectSponsor = (sponsor: Sponsor) => {
      if (!gameState) return;
      const updatedTeams = gameState.teams.map(t => 
          t.id === gameState.userTeamId ? { ...t, sponsor } : t
      );
      setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);
  };

  const handleMarkAsRead = (id: string) => {
    if (!gameState) return;
    const message = gameState.messages.find(m => m.id === id);
    if (message && message.type === MessageType.TRANSFER_OFFER && !message.isRead) {
        setOfferToProcess(message);
    } else {
        const updatedMessages = gameState.messages.map(m => m.id === id ? { ...m, isRead: true } : m);
        setGameState(prev => prev ? { ...prev, messages: updatedMessages } : null);
    }
  };

  const handleToggleTransferList = (player: Player) => {
      if (!gameState) return;
      const updatedPlayers = gameState.players.map(p => 
          p.id === player.id ? { ...p, isTransferListed: !p.isTransferListed } : p
      );
      setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
      if (selectedPlayer && selectedPlayer.id === player.id) {
          setSelectedPlayer(prev => prev ? { ...prev, isTransferListed: !prev.isTransferListed } : null);
      }
  };

  const handleAcceptOffer = () => {
      if (!gameState || !offerToProcess || !offerToProcess.data) return;
      const { playerId, amount } = offerToProcess.data;
      const player = gameState.players.find(p => p.id === playerId);
      const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);

      if (player && userTeam) {
          const updatedPlayers = gameState.players.filter(p => p.id !== playerId);
          const updatedTeams = gameState.teams.map(t => {
              if (t.id === userTeam.id) {
                  return { ...t, budget: t.budget + amount }
              }
              return t;
          });
          const updatedMessages = gameState.messages.map(m => m.id === offerToProcess.id ? { ...m, isRead: true, body: m.body + " [ACCEPTED]" } : m);
          setGameState(prev => prev ? { ...prev, players: updatedPlayers, teams: updatedTeams, messages: updatedMessages } : null);
          alert(`${t.offerAccepted} ${player.lastName} ${t.soldFor} €${(amount/1000000).toFixed(2)}M`);
      }
      setOfferToProcess(null);
      setSelectedPlayer(null); 
  };

  const handleRejectOffer = () => {
      if (!gameState || !offerToProcess) return;
      const updatedMessages = gameState.messages.map(m => m.id === offerToProcess.id ? { ...m, isRead: true, body: m.body + " [REJECTED]" } : m);
      setGameState(prev => prev ? { ...prev, messages: updatedMessages } : null);
      setOfferToProcess(null);
  };

  const handleContractRenewal = (player: Player) => {
      if (!gameState) return;
      const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
      if (!userTeam) return;
      const renewalCost = Math.floor(player.value * 0.1);
      if (userTeam.budget < renewalCost) {
          alert(t.notEnoughFunds);
          return;
      }
      if (confirm(`${t.renewContract} for ${player.lastName}? Cost: €${(renewalCost/1000).toFixed(0)}k`)) {
          const updatedPlayers = gameState.players.map(p => 
             p.id === player.id ? { ...p, contractYears: p.contractYears + 2, morale: Math.min(100, p.morale + 10) } : p
          );
          const updatedTeams = gameState.teams.map(t => 
             t.id === userTeam.id ? { ...t, budget: t.budget - renewalCost } : t
          );
          setGameState(prev => prev ? { ...prev, players: updatedPlayers, teams: updatedTeams } : null);
          alert(t.contractExtended);
          setSelectedPlayer(prev => prev ? { ...prev, contractYears: prev.contractYears + 2 } : null);
      }
  };

  const handleAutoFix = () => {
      if (!gameState) return;
      const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
      const userPlayers = gameState.players.filter(p => p.teamId === gameState.userTeamId);
      if(!userTeam) return;

      const playersCopy = JSON.parse(JSON.stringify(userPlayers));
      autoPickLineup(playersCopy, userTeam.tactic.formation);
      
      const updatedPlayers = gameState.players.map(p => {
          const fixedP = playersCopy.find((cp: Player) => cp.id === p.id);
          return fixedP ? { ...p, lineup: fixedP.lineup, lineupIndex: fixedP.lineupIndex } : p;
      });

      const updatedTeams = gameState.teams.map(t => t.id === userTeam.id ? { ...t, tactic: { ...t.tactic, customPositions: {} } } : t);

      setGameState(prev => prev ? { ...prev, players: updatedPlayers, teams: updatedTeams } : null);
      setAssistantAdvice(null);
  };

  const handleUpgradeStaff = (role: keyof TeamStaff) => {
      if (!gameState) return;
      const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
      if(!userTeam) return;

      const currentLevel = userTeam.staff ? userTeam.staff[role] : 1;
      const cost = currentLevel * 500000;

      if(userTeam.budget < cost) {
          alert(t.notEnoughFunds);
          return;
      }

      if(confirm(`Upgrade ${role} to level ${currentLevel + 1}? Cost: €${(cost/1000).toLocaleString()}k`)) {
          const updatedTeams = gameState.teams.map(t => {
              if(t.id === userTeam.id) {
                  return {
                      ...t,
                      budget: t.budget - cost,
                      staff: { ...t.staff, [role]: currentLevel + 1 }
                  };
              }
              return t;
          });
          setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);
      }
  };

  const startNextMatch = () => {
    if (!gameState) return;
    const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId)!;
    const userPlayers = gameState.players.filter(p => p.teamId === userTeam.id);
    
    const advice = analyzeClubHealth(userTeam, userPlayers);
    const criticalIssues = advice.filter(a => a.type === 'CRITICAL');

    if (criticalIssues.length > 0) {
        setAssistantAdvice(advice);
        return; 
    }

    const match = gameState.matches.find(m => 
        m.week === gameState.currentWeek && 
        !m.isPlayed && 
        (m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId)
    );
    
    if (match) {
      const homeTeam = gameState.teams.find(t => t.id === match.homeTeamId);
      const awayTeam = gameState.teams.find(t => t.id === match.awayTeamId);
      
      if (!homeTeam || !awayTeam) return;

      setActiveMatchId(match.id);
      setView('match');
      setDebugLog([]); 
      
      const homePlayers = gameState.players.filter(p => p.teamId === homeTeam.id);
      const awayPlayers = gameState.players.filter(p => p.teamId === awayTeam.id);
      
      try {
          const initialSimulation = initializeMatch(match, homeTeam, awayTeam, homePlayers, awayPlayers);
      
          setGameState(prev => {
              if(!prev) return null;
              const matches = prev.matches.map(m => m.id === match.id ? { 
                  ...m, 
                  liveData: { 
                      ballHolderId: null, 
                      pitchZone: 50, 
                      lastActionText: 'Kickoff', 
                      simulation: initialSimulation 
                  } 
              } : m);
              return { ...prev, matches };
          });
      } catch (e) {
          console.error(e);
          alert("Match initialization error.");
          setView('dashboard');
          setActiveMatchId(null);
      }
    } else {
      if (gameState.currentWeek > TOTAL_WEEKS_PER_SEASON) {
          prepareSeasonEnd();
      } else {
          alert(t.noMatches);
          handleMatchFinish();
      }
    }
  };

  const prepareSeasonEnd = () => {
      if (!gameState) return;
      const sortedTeams = [...gameState.teams].sort((a, b) => b.stats.points - a.stats.points);
      const winner = sortedTeams[0];
      setSeasonSummaryData({
          winner,
          retired: [],
          promoted: []
      });
      setShowSeasonSummary(true);
  };

  const handleStartNewSeason = () => {
      if (!gameState) return;
      const { newState } = processSeasonEnd(gameState);
      setGameState(newState);
      alert(`${t.startNewSeason}: ${gameState.currentSeason + 1}`);
      setShowSeasonSummary(false);
      setView('dashboard');
  };

  const handleBuyPlayer = (player: Player) => {
      if (!gameState) return;
      const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
      if (!userTeam) return;
      if (userTeam.budget < player.value) {
          alert(t.notEnoughFunds);
          return;
      }
      const updatedPlayers = gameState.players.concat([{
          ...player,
          teamId: userTeam.id,
          isTransferListed: false,
          lineup: 'RESERVE', 
          lineupIndex: 99,
          contractYears: 3 
      }]); 
      const updatedMarket = gameState.transferMarket.filter(p => p.id !== player.id);
      const updatedTeams = gameState.teams.map(t => t.id === userTeam.id ? { ...t, budget: t.budget - player.value } : t);
      setGameState(prev => prev ? { ...prev, players: updatedPlayers, transferMarket: updatedMarket, teams: updatedTeams } : null);
      alert(`${t.successfullySigned} ${player.lastName}!`);
  };

  const handlePromoteYouth = (player: Player) => {
      if (!gameState) return;
      const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
      if (!userTeam) return;
      const signingFee = Math.floor(player.value * 0.5); 
      if (userTeam.budget < signingFee) {
          alert(t.notEnoughFunds);
          return;
      }
      const updatedPlayers = gameState.players.concat([{
          ...player,
          teamId: userTeam.id,
          lineup: 'RESERVE',
          lineupIndex: 99,
          contractYears: 5, 
          isTransferListed: false
      }]);
      const updatedTeams = gameState.teams.map(t => t.id === userTeam.id ? { ...t, budget: t.budget - signingFee, youthCandidates: t.youthCandidates.filter(yp => yp.id !== player.id) } : t);
      setGameState(prev => prev ? { ...prev, players: updatedPlayers, teams: updatedTeams } : null);
      alert(`${t.promotedToSenior} ${player.lastName}`);
  };

  const handleSubstitution = (playerIdIn: string, playerIdOut: string) => {
      if (!gameState) return;
      const playerIn = gameState.players.find(p => p.id === playerIdIn);
      const playerOut = gameState.players.find(p => p.id === playerIdOut);
      if (!playerIn || !playerOut) return;

      const updatedPlayers = gameState.players.map(p => {
          if (p.id === playerIdIn) return { ...p, lineup: 'STARTING' as LineupStatus, lineupIndex: playerOut.lineupIndex || 0 };
          if (p.id === playerIdOut) return { ...p, lineup: 'BENCH' as LineupStatus, lineupIndex: playerIn.lineupIndex || 0 };
          return p;
      });
      setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
      if (activeMatchId) performSubstitution(activeMatchId, { ...playerIn, lineup: 'STARTING' }, playerOut.id);
  };

  const executeMatchUpdate = (prevState: GameState, matchId: string, simulateToEnd: boolean = false): GameState => {
      const matchIndex = prevState.matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return prevState;
      const match = prevState.matches[matchIndex];
      if (match.isPlayed) return prevState;
      const homeTeam = prevState.teams.find(t => t.id === match.homeTeamId);
      const awayTeam = prevState.teams.find(t => t.id === match.awayTeamId);
      if (!homeTeam || !awayTeam) return prevState;
      const homePlayers = prevState.players.filter(p => p.teamId === homeTeam.id);
      const awayPlayers = prevState.players.filter(p => p.teamId === awayTeam.id);

      let currentMatch = { ...match };
      let finalEvents = [...currentMatch.events];

      if (simulateToEnd) {
         const simulated = simulateFullMatch(currentMatch, homeTeam, awayTeam, homePlayers, awayPlayers);
         simulated.isPlayed = true;
         simulated.currentMinute = 90;
         
         if(simulated.isPlayed && !match.isFriendly) {
              const hScore = simulated.homeScore;
              const aScore = simulated.awayScore;
              let ptsHome = hScore > aScore ? 3 : hScore === aScore ? 1 : 0;
              let ptsAway = aScore > hScore ? 3 : hScore === aScore ? 1 : 0;
              homeTeam.stats.played++;
              homeTeam.stats.won += ptsHome === 3 ? 1 : 0;
              homeTeam.stats.drawn += ptsHome === 1 ? 1 : 0;
              homeTeam.stats.lost += ptsHome === 0 ? 1 : 0;
              homeTeam.stats.gf += hScore;
              homeTeam.stats.ga += aScore;
              homeTeam.stats.points += ptsHome;
              homeTeam.recentForm = [...(homeTeam.recentForm || []), hScore > aScore ? 'W' : hScore === aScore ? 'D' : 'L'].slice(-5);
              awayTeam.stats.played++;
              awayTeam.stats.won += ptsAway === 3 ? 1 : 0;
              awayTeam.stats.drawn += ptsAway === 1 ? 1 : 0;
              awayTeam.stats.lost += ptsAway === 0 ? 1 : 0;
              awayTeam.stats.gf += aScore;
              awayTeam.stats.ga += hScore;
              awayTeam.stats.points += ptsAway;
              awayTeam.recentForm = [...(awayTeam.recentForm || []), aScore > hScore ? 'W' : aScore === hScore ? 'D' : 'L'].slice(-5);
         }
         let newMatches = [...prevState.matches];
         newMatches[matchIndex] = simulated;
         return { ...prevState, matches: newMatches };
      }

      const stepResult = simulateTick(currentMatch, homeTeam, awayTeam, homePlayers, awayPlayers);
      if (stepResult.minuteIncrement) currentMatch.currentMinute = (currentMatch.currentMinute || 0) + 1;
      
      // Update stats from simulation
      currentMatch.stats = stepResult.stats;
      
      currentMatch.liveData = stepResult.simulation ? { ballHolderId: stepResult.ballHolderId, pitchZone: stepResult.pitchZone, lastActionText: stepResult.actionText, simulation: stepResult.simulation } : currentMatch.liveData;
      
      if (stepResult.trace.length > 0) setDebugLog(prev => [...prev, ...stepResult.trace].slice(-50));
      if (stepResult.event) {
          stepResult.event.minute = currentMatch.currentMinute; 
          finalEvents.push(stepResult.event);
          if (stepResult.event.type === MatchEventType.GOAL) {
             if (stepResult.event.teamId === homeTeam.id) currentMatch.homeScore++;
             else currentMatch.awayScore++;
          }
      }
      currentMatch.events = finalEvents;
      if (currentMatch.currentMinute >= 90) {
           currentMatch.currentMinute = 90;
           if (!currentMatch.events.find(e => e.type === MatchEventType.FULL_TIME)) currentMatch.events.push({ minute: 90, type: MatchEventType.FULL_TIME, description: t.fullTime });
           currentMatch.isPlayed = true;
           if (!match.isFriendly) {
               const hScore = currentMatch.homeScore;
               const aScore = currentMatch.awayScore;
               let ptsHome = hScore > aScore ? 3 : hScore === aScore ? 1 : 0;
               let ptsAway = aScore > hScore ? 3 : hScore === aScore ? 1 : 0;
               homeTeam.stats.played++;
               homeTeam.stats.won += ptsHome === 3 ? 1 : 0;
               homeTeam.stats.drawn += ptsHome === 1 ? 1 : 0;
               homeTeam.stats.lost += ptsHome === 0 ? 1 : 0;
               homeTeam.stats.gf += hScore;
               homeTeam.stats.ga += aScore;
               homeTeam.stats.points += ptsHome;
               homeTeam.recentForm = [...(homeTeam.recentForm || []), hScore > aScore ? 'W' : hScore === aScore ? 'D' : 'L'].slice(-5);
               awayTeam.stats.played++;
               awayTeam.stats.won += ptsAway === 3 ? 1 : 0;
               awayTeam.stats.drawn += ptsAway === 1 ? 1 : 0;
               awayTeam.stats.lost += ptsAway === 0 ? 1 : 0;
               awayTeam.stats.gf += aScore;
               awayTeam.stats.ga += hScore;
               awayTeam.stats.points += ptsAway;
               awayTeam.recentForm = [...(awayTeam.recentForm || []), aScore > hScore ? 'W' : aScore === hScore ? 'D' : 'L'].slice(-5);
           }
      }
      let newMatches = [...prevState.matches];
      newMatches[matchIndex] = currentMatch;
      return { ...prevState, matches: newMatches };
  };

  const processMatchTick = useCallback((matchId: string) => {
      setGameState(prevState => prevState ? executeMatchUpdate(prevState, matchId, false) : null);
  }, [t]);

  const handleInstantFinish = useCallback((matchId: string) => {
      setGameState(prevState => prevState ? executeMatchUpdate(prevState, matchId, true) : null);
  }, [t]);

  const handleMatchFinish = () => {
      if(!gameState) {
          setView('dashboard');
          return;
      }
      const updatedState = simulateLeagueRound(gameState, gameState.currentWeek);
      // Pass 't' for localized news/reports
      const { updatedTeams, updatedPlayers, updatedMarket, report, offers } = processWeeklyEvents(updatedState, t);
      setGameState({
          ...updatedState,
          teams: updatedTeams,
          players: updatedPlayers,
          transferMarket: updatedMarket,
          currentWeek: updatedState.currentWeek + 1,
          messages: [
              ...updatedState.messages, 
              ...report.map(r => ({ id: uuid(), week: updatedState.currentWeek, type: MessageType.TRAINING, subject: t.trainingReport, body: r, isRead: false, date: new Date().toISOString() })),
              ...offers
          ]
      });
      setView('dashboard');
      setActiveMatchId(null);
  };

  if (showLeagueSelect) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white animate-fade-in">
              <div className="text-center mb-8">
                  <div className="text-emerald-500 font-bold text-4xl tracking-tighter mb-2">PRO<span className="text-white">MNGR</span></div>
                  <h1 className="text-2xl font-bold">{t.selectLeague}</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
                  {LEAGUE_PRESETS.map(league => (
                      <button key={league.id} onClick={() => handleStartGame(league.id)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-xl p-6 transition-all group flex flex-col items-center gap-4 shadow-xl">
                          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                              <Globe className="text-slate-400" size={32} />
                          </div>
                          <div className="text-center">
                              <h3 className="text-xl font-bold text-white mb-1">{t[`league${league.country}` as keyof typeof t] || league.name}</h3>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  if (showTeamSelect && gameState) {
      const sortedTeams = [...gameState.teams].sort((a,b) => b.reputation - a.reputation);
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-white animate-fade-in">
              <div className="text-center mb-8 mt-10">
                  <h1 className="text-3xl font-bold mb-2">{t.selectTeam}</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl w-full">
                  {sortedTeams.map(team => (
                      <button key={team.id} onClick={() => handleSelectTeam(team.id)} className="bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 rounded-xl overflow-hidden group transition-all hover:scale-105 shadow-lg relative flex flex-col">
                          <div className="h-24 relative flex items-center justify-center overflow-hidden" style={{backgroundColor: team.primaryColor}}>
                              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-bold z-10" style={{color: team.primaryColor}}>
                                  {team.name.substring(0, 1)}
                              </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col w-full">
                              <h3 className="text-lg font-bold text-white mb-1 truncate text-center">{team.name}</h3>
                              <div className="mt-auto space-y-2">
                                  <div className="flex justify-between text-xs border-b border-slate-700 pb-2">
                                      <span className="text-slate-500">{t.reputation}</span>
                                      <span className="font-bold text-white">{team.reputation}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                      <span className="text-slate-500">Budget</span>
                                      <span className="font-bold text-emerald-400">€{(team.budget / 1000000).toFixed(1)}M</span>
                                  </div>
                              </div>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  if (!gameState) return null;
  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId)!;
  const userPlayers = gameState.players.filter(p => p.teamId === userTeam.id);
  const unreadMessages = gameState.messages.filter(m => !m.isRead).length;
  const activeMatch = activeMatchId ? gameState.matches.find(m => m.id === activeMatchId) : null;
  const activeHome = activeMatch ? (gameState.teams.find(t => t.id === activeMatch.homeTeamId) || userTeam) : userTeam;
  const activeAway = activeMatch ? (gameState.teams.find(t => t.id === activeMatch.awayTeamId) || userTeam) : userTeam;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-10">
      {!userTeam.sponsor && <SponsorModal onSelect={handleSelectSponsor} t={t} />}
      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onRenew={handleContractRenewal} onToggleTransferList={handleToggleTransferList} t={t} />
      {inspectedTeamId && <TeamInspector team={gameState.teams.find(t => t.id === inspectedTeamId)!} players={gameState.players.filter(p => p.teamId === inspectedTeamId)} onClose={() => setInspectedTeamId(null)} t={t} />}
      {assistantAdvice && <AssistantReport advice={assistantAdvice} onAutoFix={handleAutoFix} onClose={() => setAssistantAdvice(null)} t={t} />}

      {offerToProcess && offerToProcess.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-slate-900 border border-emerald-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><DollarSign className="text-emerald-400" /> {t.offerReceived}</h2>
                  <p className="text-slate-300 mb-6">{offerToProcess.body}</p>
                  <div className="flex gap-4">
                      <button onClick={handleAcceptOffer} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg">{t.acceptOffer}</button>
                      <button onClick={handleRejectOffer} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">{t.rejectOffer}</button>
                  </div>
             </div>
        </div>
      )}

      {showDerbySelect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-slate-900 border border-yellow-500/50 rounded-xl max-w-lg w-full p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="text-yellow-400" /> {t.playFriendly}</h2>
                      <button onClick={() => setShowDerbySelect(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="block text-xs uppercase text-slate-500 font-bold mb-2">{t.team} 1</label>
                          <select className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 text-sm" value={derbyHomeId || ''} onChange={(e) => setDerbyHomeId(e.target.value)}>
                              {gameState.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs uppercase text-slate-500 font-bold mb-2">{t.team} 2</label>
                          <select className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 text-sm" value={derbyAwayId || ''} onChange={(e) => setDerbyAwayId(e.target.value)}>
                              {gameState.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                          </select>
                      </div>
                  </div>
                  <button onClick={handleQuickDerbyStart} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg">{t.startMatch}</button>
              </div>
          </div>
      )}

      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold" style={{backgroundColor: userTeam.primaryColor, color: '#fff'}}>
                        {userTeam.name.substring(0, 1)}
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.welcomeTitle}</h2>
                <h3 className="text-xl font-bold text-emerald-400 mb-6">{userTeam.name}</h3>
                <button onClick={() => setShowWelcome(false)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                    <Briefcase size={20} /> {t.signContract}
                </button>
            </div>
        </div>
      )}

      <div className="fixed left-0 top-0 h-full w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
         <div className="p-6 border-b border-slate-800 hidden md:block">
             <div className="text-emerald-500 font-bold text-2xl tracking-tighter">PRO<span className="text-white">MNGR</span></div>
         </div>
         <nav className="flex-1 p-2 md:p-4 space-y-2 overflow-y-auto">
             <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20}/> <span className="hidden md:inline">{t.dashboard}</span></button>
             <button onClick={() => setView('news')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg relative ${view === 'news' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Mail size={20}/> <span className="hidden md:inline">{t.news}</span>{unreadMessages > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>}</button>
             <button onClick={() => setView('squad')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'squad' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={20}/> <span className="hidden md:inline">{t.squad}</span></button>
             <button onClick={() => setView('training')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'training' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Activity size={20}/> <span className="hidden md:inline">{t.training}</span></button>
             <button onClick={() => setView('transfers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'transfers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><ShoppingCart size={20}/> <span className="hidden md:inline">{t.market}</span></button>
             <button onClick={() => setView('club')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'club' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Building2 size={20}/> <span className="hidden md:inline">{t.club}</span></button>
             <button onClick={() => setView('league')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'league' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Trophy size={20}/> <span className="hidden md:inline">{t.standings}</span></button>
             <button onClick={() => setView('rankings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'rankings' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Globe size={20}/> <span className="hidden md:inline">{t.worldRankings}</span></button>
             <button onClick={() => setView('guide')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'guide' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><BookOpen size={20}/> <span className="hidden md:inline">{t.gameGuide}</span></button>
             <button onClick={() => setView('match')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'match' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><SkipForward size={20}/> <span className="hidden md:inline">{t.matchDay}</span></button>
             <button onClick={openDerbySelector} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mt-4 text-yellow-400 hover:bg-slate-800 border border-yellow-500/30"><Zap size={20}/> <span className="hidden md:inline">{t.playFriendly}</span></button>
         </nav>
         <div className="p-4 border-t border-slate-800 flex justify-center gap-2">
             <button onClick={() => setLang('tr')} className={`text-xs px-2 py-1 rounded ${lang === 'tr' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>TR</button>
             <button onClick={() => setLang('en')} className={`text-xs px-2 py-1 rounded ${lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>EN</button>
             <button onClick={handleResetGame} className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-200 hover:bg-red-900"><RefreshCw size={12} /></button>
         </div>
      </div>

      <div className="ml-20 md:ml-64 p-4 md:p-8">
         {view === 'match' && activeMatch ? (
             <MatchCenter 
                match={activeMatch} homeTeam={activeHome} awayTeam={activeAway} 
                homePlayers={gameState.players.filter(p => p.teamId === activeHome.id)} 
                awayPlayers={gameState.players.filter(p => p.teamId === activeAway.id)} 
                onTick={processMatchTick} onFinish={handleMatchFinish} onInstantFinish={handleInstantFinish} 
                onSubstitute={handleSubstitution} onUpdateTactic={handleUpdateTactic} 
                userTeamId={userTeam.id} t={t} debugLogs={debugLog} onPlayerClick={setSelectedPlayer}
             />
         ) : (
             <div className="animate-fade-in">
                 {view === 'dashboard' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                            <h2 className="text-2xl font-bold text-white mb-4">{t.managerWelcome.replace('{name}', userTeam.name)}</h2>
                            <p className="text-slate-400 mb-6">{t.dashboardDesc}</p>
                            <div className="flex gap-4">
                                <button onClick={startNextMatch} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><SkipForward /> {t.playNextMatch}</button>
                                <button onClick={openDerbySelector} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Zap /> {t.quickDerby}</button>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Briefcase size={18} className="text-blue-500"/> {t.boardConfidence}</h2>
                                <div className="flex items-center gap-4 mb-4">
                                    <CheckCircle2 className="text-emerald-500" />
                                    <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-[85%]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 border-t border-slate-700 pt-4">
                                <h3 className="text-xs uppercase text-slate-500 font-bold mb-3 flex items-center gap-1"><Target size={12}/> Season Objectives</h3>
                                <div className="space-y-2">
                                    {(userTeam.objectives || []).map(obj => (
                                        <div key={obj.id} className="flex items-center justify-between text-sm bg-slate-900/50 p-2 rounded">
                                            <span className="text-slate-300">{obj.description}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${obj.status === 'COMPLETED' ? 'bg-green-900 text-green-400' : 'bg-slate-800 text-slate-500'}`}>{obj.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                     </div>
                 )}
                 {view === 'news' && <NewsCenter messages={gameState.messages} onMarkAsRead={handleMarkAsRead} t={t} />}
                 {view === 'squad' && <TeamManagement team={userTeam} players={userPlayers} onUpdateTactic={handleUpdateTactic} onPlayerClick={setSelectedPlayer} onUpdateLineup={handleUpdateLineup} onSwapPlayers={handleSwapPlayers} onMovePlayer={handleMovePlayer} t={t} />}
                 {view === 'training' && <TrainingCenter team={userTeam} onSetFocus={handleSetTrainingFocus} onSetIntensity={handleSetTrainingIntensity} t={t} />}
                 {view === 'transfers' && <TransferMarket marketPlayers={gameState.transferMarket} userTeam={userTeam} onBuyPlayer={handleBuyPlayer} onPlayerClick={setSelectedPlayer} t={t} />}
                 {view === 'club' && <ClubManagement team={userTeam} players={userPlayers} t={t} onPromoteYouth={handlePromoteYouth} onResign={handleResign} onUpgradeStaff={handleUpgradeStaff} />}
                 {view === 'league' && <LeagueTable teams={gameState.teams} players={gameState.players} history={gameState.history} t={t} onInspectTeam={setInspectedTeamId} />}
                 {view === 'rankings' && <WorldRankings players={gameState.players} teams={gameState.teams} t={t} onPlayerClick={setSelectedPlayer} />}
                 {view === 'guide' && <GameGuide t={t} />}
             </div>
         )}
      </div>
    </div>
  );
};

export default App;
