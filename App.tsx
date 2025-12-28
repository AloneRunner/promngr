
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Team, Player, MatchEventType, TeamTactic, MessageType, LineupStatus, TrainingFocus, TrainingIntensity, Sponsor, Message, Match, AssistantAdvice, TeamStaff, Position, GameProfile, EuropeanCup } from './types';
import { generateWorld, simulateTick, processWeeklyEvents, simulateFullMatch, processSeasonEnd, initializeMatch, performSubstitution, updateMatchTactic, simulateLeagueRound, analyzeClubHealth, autoPickLineup, syncEngineLineups, getLivePlayerStamina, generateEuropeanCup, simulateEuropeanCupMatch, simulateAIEuropeanCupMatches } from './services/engine';
import { loadAllProfiles, createProfile, loadProfileData, saveProfileData, deleteProfile, resetProfile, updateProfileMetadata, setActiveProfile, getActiveProfileId, migrateOldSave } from './services/profileManager';
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
import { FixturesView } from './components/FixturesView';
import { OpponentPreview } from './components/OpponentPreview';
import { EuropeanCupView } from './components/EuropeanCupView';
import { ProfileSelector } from './components/ProfileSelector';
import { TRANSLATIONS, LEAGUE_PRESETS } from './constants';
import { LayoutDashboard, Users, Trophy, SkipForward, Briefcase, CheckCircle2, Building2, ShoppingCart, Mail, RefreshCw, Globe, Activity, DollarSign, Zap, X, Target, BookOpen, UserCircle, Calendar, LogOut } from 'lucide-react';

const TOTAL_WEEKS_PER_SEASON = 38;
const uuid = () => Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
    // Profile Management State
    const [profiles, setProfiles] = useState<GameProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [showProfileSelector, setShowProfileSelector] = useState(false);

    // Game State
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [view, setView] = useState<'dashboard' | 'squad' | 'league' | 'match' | 'club' | 'transfers' | 'news' | 'training' | 'rankings' | 'guide' | 'fixtures'>('dashboard');
    const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
    const [lang, setLang] = useState<'tr' | 'en'>('tr');
    const [showWelcome, setShowWelcome] = useState(false);
    const [showLeagueSelect, setShowLeagueSelect] = useState(false);
    const [showTeamSelect, setShowTeamSelect] = useState(false);
    const [showSeasonSummary, setShowSeasonSummary] = useState(false);
    const [seasonSummaryData, setSeasonSummaryData] = useState<{ winner: Team, retired: string[], promoted: string[] } | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [inspectedTeamId, setInspectedTeamId] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [offerToProcess, setOfferToProcess] = useState<Message | null>(null);
    const [assistantAdvice, setAssistantAdvice] = useState<AssistantAdvice[] | null>(null);

    const [showDerbySelect, setShowDerbySelect] = useState(false);
    const [derbyHomeId, setDerbyHomeId] = useState<string | null>(null);
    const [derbyAwayId, setDerbyAwayId] = useState<string | null>(null);
    const [showOpponentPreview, setShowOpponentPreview] = useState(false);
    const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
    const [showEuropeanCup, setShowEuropeanCup] = useState(false);

    const t = TRANSLATIONS[lang];

    // Initialize profiles on mount
    useEffect(() => {
        // Try to migrate old save
        const migratedProfileId = migrateOldSave();

        // Load all profiles
        const loadedProfiles = loadAllProfiles();
        setProfiles(loadedProfiles);

        if (migratedProfileId) {
            // Load migrated profile
            setActiveProfileId(migratedProfileId);
            setActiveProfile(migratedProfileId);
            const profileData = loadProfileData(migratedProfileId);
            if (profileData) {
                setGameState(profileData);
            }
        } else if (loadedProfiles.length > 0) {
            // Load last active profile or first profile
            const lastActiveId = getActiveProfileId();
            const profileToLoad = lastActiveId && loadedProfiles.find(p => p.id === lastActiveId)
                ? lastActiveId
                : loadedProfiles[0].id;

            setActiveProfileId(profileToLoad);
            setActiveProfile(profileToLoad);
            const profileData = loadProfileData(profileToLoad);
            if (profileData) {
                setGameState(profileData);
            } else {
                // Profile exists but has no game data yet
                setShowLeagueSelect(true);
            }
        } else {
            // No profiles exist, show profile selector
            setShowProfileSelector(true);
        }
    }, []);

    // Save game state to active profile whenever it changes
    useEffect(() => {
        if (gameState && activeProfileId) {
            saveProfileData(activeProfileId, gameState);
        }
    }, [gameState, activeProfileId]);

    const handleStartGame = (leagueId: string) => {
        setShowLeagueSelect(false);
        setTimeout(() => {
            const world = generateWorld(leagueId);
            setGameState(world);
            setShowTeamSelect(true);
        }, 500);
    };

    const handleSelectTeam = (teamId: string) => {
        if (!gameState) return;
        const selectedTeam = gameState.teams.find(t => t.id === teamId);

        let newState = { ...gameState, userTeamId: teamId };

        // Auto-generate Champions League for big teams (reputation >= 85)
        if (selectedTeam && selectedTeam.reputation >= 85) {
            import('./services/engine').then(({ generateChampionsLeague }) => {
                const cup = generateChampionsLeague({ ...newState, userTeamId: teamId });

                // Merge foreign teams into global state so they can be viewed/played against
                const foreignTeams = cup._generatedForeignTeams || [];
                const mergedTeams = [...newState.teams, ...foreignTeams];

                newState = {
                    ...newState,
                    teams: mergedTeams,
                    europeanCup: cup,
                    messages: [...newState.messages, {
                        id: Math.random().toString(36).substring(2, 15),
                        week: newState.currentWeek,
                        type: MessageType.BOARD,
                        subject: '🏆 Şampiyonlar Ligi Daveti!',
                        body: `${selectedTeam.name} olarak Şampiyonlar Ligi'ne katılmaya hak kazandınız! Avrupa'nın devleriyle mücadele edeceksiniz.`,
                        isRead: false,
                        date: new Date().toISOString()
                    }]
                };
                setGameState(newState);
            });
            // Early return to wait for async import resolution
            setShowTeamSelect(false);
            setShowWelcome(true);
            return;
        } else if (selectedTeam && selectedTeam.reputation >= 70) {
            // Domestic Cup for mid-tier teams
            const cup = generateEuropeanCup({ ...newState, userTeamId: teamId });
            newState = {
                ...newState,
                europeanCup: cup,
                messages: [...newState.messages, {
                    id: Math.random().toString(36).substring(2, 15),
                    week: newState.currentWeek,
                    type: MessageType.BOARD,
                    subject: '🏆 Lig Kupası Daveti!',
                    body: `${selectedTeam.name} olarak Lig Kupası'na katılmaya hak kazandınız!`,
                    isRead: false,
                    date: new Date().toISOString()
                }]
            };
        }

        setGameState(newState);
        setShowTeamSelect(false);
        setShowWelcome(true);
    };

    // Profile Management Handlers
    const handleCreateProfile = (name: string) => {
        const newProfile = createProfile(name);
        setProfiles(loadAllProfiles());
        setActiveProfileId(newProfile.id);
        setActiveProfile(newProfile.id);
        setGameState(null);
        setShowProfileSelector(false);
        setShowLeagueSelect(true);
    };

    const handleSelectProfile = (profileId: string) => {
        setActiveProfileId(profileId);
        setActiveProfile(profileId);
        const profileData = loadProfileData(profileId);
        if (profileData) {
            setGameState(profileData);
            setShowProfileSelector(false);
        } else {
            // Profile has no game data, start new game
            setGameState(null);
            setShowProfileSelector(false);
            setShowLeagueSelect(true);
        }
    };

    const handleDeleteProfile = (profileId: string) => {
        deleteProfile(profileId);
        const updatedProfiles = loadAllProfiles();
        setProfiles(updatedProfiles);

        // If deleted active profile, reset everything
        if (profileId === activeProfileId) {
            setActiveProfileId(null);
            setGameState(null);
            if (updatedProfiles.length === 0) {
                setShowProfileSelector(true);
            }
        }
    };

    const handleResetProfile = (profileId: string) => {
        resetProfile(profileId);
        setProfiles(loadAllProfiles());

        // If reset active profile, reload it
        if (profileId === activeProfileId) {
            setGameState(null);
            setShowLeagueSelect(true);
        }
    };

    const handleRenameProfile = (profileId: string, newName: string) => {
        updateProfileMetadata(profileId, { name: newName });
        setProfiles(loadAllProfiles());
    };

    const handleBackToProfiles = () => {
        if (confirm(lang === 'tr' ? 'İlerleme kaydedilecek. Profil seçiciye dönmek istediğinizden emin misiniz?' : 'Progress will be saved. Are you sure you want to return to profile selector?')) {
            setShowProfileSelector(true);
            setShowLeagueSelect(false);
            setShowTeamSelect(false);
            setShowWelcome(false);
            setView('dashboard');
        }
    };

    const handleResign = () => {
        if (confirm(t.resignConfirm)) {
            setShowTeamSelect(true);
            setView('dashboard');
        }
    };

    const openDerbySelector = () => {
        if (!gameState) return;
        const sorted = [...gameState.teams].sort((a, b) => b.reputation - a.reputation);
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
        const initialSim = initializeMatch(friendlyMatch, homeTeam, awayTeam, homePlayers, awayPlayers, gameState.userTeamId);

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

    const handleUpdateLineup = (playerId: string, status: LineupStatus, lineupIndex?: number) => {
        if (!gameState) return;
        const updatedPlayers = gameState.players.map(p => {
            if (p.id === playerId) {
                const updated = { ...p, lineup: status };
                if (lineupIndex !== undefined) {
                    updated.lineupIndex = lineupIndex;
                }
                return updated;
            }
            return p;
        });
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

    const handleContractRenewal = (player: Player) => {
        if (!gameState) return;
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (!userTeam) return;
        const renewalCost = Math.floor(player.value * 0.1);
        if (userTeam.budget < renewalCost) {
            alert(t.notEnoughFunds);
            return;
        }
        if (confirm(`${t.renewContract} for ${player.lastName}? Cost: €${(renewalCost / 1000).toFixed(0)}k`)) {
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
        if (!userTeam) return;

        const playersCopy = JSON.parse(JSON.stringify(userPlayers));

        // Inject LIVE STAMINA from engine if available
        if (activeMatchId && view === 'match') {
            playersCopy.forEach((p: Player) => {
                const liveStamina = getLivePlayerStamina(p.id);
                if (liveStamina !== undefined) {
                    p.condition = liveStamina;
                }
            });
        }

        autoPickLineup(playersCopy, userTeam.tactic.formation);

        const updatedPlayers = gameState.players.map(p => {
            const fixedP = playersCopy.find((cp: Player) => cp.id === p.id);
            return fixedP ? { ...p, lineup: fixedP.lineup, lineupIndex: fixedP.lineupIndex } : p;
        });

        const updatedTeams = gameState.teams.map(t => t.id === userTeam.id ? { ...t, tactic: { ...t.tactic, customPositions: {} } } : t);

        setGameState(prev => prev ? { ...prev, players: updatedPlayers, teams: updatedTeams } : null);
        setAssistantAdvice(null);

        if (activeMatchId && view === 'match' && gameState) {
            const match = gameState.matches.find(m => m.id === activeMatchId);
            if (match) {
                const homeP = updatedPlayers.filter(p => p.teamId === match.homeTeamId);
                const awayP = updatedPlayers.filter(p => p.teamId === match.awayTeamId);
                syncEngineLineups(homeP, awayP);
            }
        }
    };

    const handleUpgradeStaff = (role: keyof TeamStaff) => {
        if (!gameState) return;
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (!userTeam) return;

        const currentLevel = userTeam.staff ? userTeam.staff[role] : 1;
        const cost = currentLevel * 100000; // BALANCED: Was 500K, now 100K per level

        if (userTeam.budget < cost) {
            alert(t.notEnoughFunds);
            return;
        }

        if (confirm(`Upgrade ${role} to level ${currentLevel + 1}? Cost: €${(cost / 1000).toLocaleString()}k`)) {
            const updatedTeams = gameState.teams.map(t => {
                if (t.id === userTeam.id) {
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

    const handleUpgradeFacility = (type: 'stadium' | 'training' | 'academy') => {
        if (!gameState) return;
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (!userTeam) return;

        let cost = 0;
        let description = '';

        if (type === 'stadium') {
            cost = 5000000;
            description = 'Stadium';
        } else if (type === 'training') {
            cost = 3000000;
            description = 'Training Ground';
        } else if (type === 'academy') {
            cost = 2500000;
            description = 'Youth Academy';
        }

        if (userTeam.budget < cost) {
            alert(t.notEnoughFunds);
            return;
        }

        const currentLevel = type === 'stadium' ? userTeam.facilities.stadiumLevel :
            type === 'training' ? userTeam.facilities.trainingLevel :
                userTeam.facilities.academyLevel;

        if (currentLevel >= 10) {
            alert('Maximum level reached!');
            return;
        }

        if (confirm(`Upgrade ${description} to level ${currentLevel + 1}? Cost: €${(cost / 1000000).toFixed(1)}M`)) {
            const updatedTeams = gameState.teams.map(team => {
                if (team.id === userTeam.id) {
                    const newFacilities = { ...team.facilities };
                    if (type === 'stadium') {
                        newFacilities.stadiumLevel += 1;
                        newFacilities.stadiumCapacity += 2500;
                    } else if (type === 'training') {
                        newFacilities.trainingLevel += 1;
                    } else if (type === 'academy') {
                        newFacilities.academyLevel += 1;
                    }
                    return { ...team, budget: team.budget - cost, facilities: newFacilities };
                }
                return team;
            });
            setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);
        }
    };

    const handleAcceptOffer = (offerId: string) => {
        if (!gameState) return;
        const offer = gameState.pendingOffers?.find(o => o.id === offerId);
        if (!offer || offer.status !== 'PENDING') return;

        const player = gameState.players.find(p => p.id === offer.playerId);
        if (!player) return;

        const buyingTeam = gameState.teams.find(t => t.id === offer.toTeamId);
        if (!buyingTeam) return;

        // Execute transfer
        const updatedPlayers = gameState.players.map(p => {
            if (p.id === offer.playerId) {
                return { ...p, teamId: offer.toTeamId, isTransferListed: false, lineup: 'RESERVE' as const, lineupIndex: 99 };
            }
            return p;
        });

        const updatedTeams = gameState.teams.map(t => {
            if (t.id === gameState.userTeamId) return { ...t, budget: t.budget + offer.offerAmount };
            if (t.id === offer.toTeamId) return { ...t, budget: t.budget - offer.offerAmount };
            return t;
        });

        const updatedOffers = gameState.pendingOffers?.map(o =>
            o.id === offerId ? { ...o, status: 'ACCEPTED' as const } : o
        ) || [];

        // Add confirmation message
        const newMessage = {
            id: uuid(),
            week: gameState.currentWeek,
            type: MessageType.INFO,
            subject: '✅ Transfer Completed',
            body: `${player.firstName} ${player.lastName} has been sold to ${buyingTeam.name} for €${(offer.offerAmount / 1000000).toFixed(1)}M.`,
            isRead: false,
            date: new Date().toISOString()
        };

        setGameState({
            ...gameState,
            players: updatedPlayers,
            teams: updatedTeams,
            pendingOffers: updatedOffers,
            messages: [...gameState.messages, newMessage]
        });
    };

    const handleRejectOffer = (offerId: string) => {
        if (!gameState) return;
        const offer = gameState.pendingOffers?.find(o => o.id === offerId);
        if (!offer) return;

        const updatedOffers = gameState.pendingOffers?.map(o =>
            o.id === offerId ? { ...o, status: 'REJECTED' as const } : o
        ) || [];

        setGameState({
            ...gameState,
            pendingOffers: updatedOffers
        });
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

            // Show opponent preview instead of immediately starting
            setPendingMatch(match);
            setShowOpponentPreview(true);
        } else {
            if (gameState.currentWeek > TOTAL_WEEKS_PER_SEASON) {
                prepareSeasonEnd();
            } else {
                alert(t.noMatches);
                handleMatchFinish();
            }
        }
    };

    const confirmStartMatch = () => {
        if (!gameState || !pendingMatch) return;

        const match = pendingMatch;
        const homeTeam = gameState.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = gameState.teams.find(t => t.id === match.awayTeamId);

        if (!homeTeam || !awayTeam) return;

        setShowOpponentPreview(false);
        setPendingMatch(null);
        setActiveMatchId(match.id);
        setView('match');
        setDebugLog([]);

        const homePlayers = gameState.players.filter(p => p.teamId === homeTeam.id);
        const awayPlayers = gameState.players.filter(p => p.teamId === awayTeam.id);

        try {
            const initialSimulation = initializeMatch(match, homeTeam, awayTeam, homePlayers, awayPlayers, gameState.userTeamId);

            setGameState(prev => {
                if (!prev) return null;
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

    const handlePlayEuropeanCupMatch = (matchId: string) => {
        if (!gameState || !gameState.europeanCup) return;

        const match = gameState.europeanCup.matches.find(m => m.id === matchId);
        if (!match) return;

        const homeTeam = gameState.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = gameState.teams.find(t => t.id === match.awayTeamId);
        if (!homeTeam || !awayTeam) return;

        const homePlayers = gameState.players.filter(p => p.teamId === match.homeTeamId);
        const awayPlayers = gameState.players.filter(p => p.teamId === match.awayTeamId);

        // Simulate the match
        let updatedCup = simulateEuropeanCupMatch(gameState.europeanCup, matchId, homeTeam, awayTeam, homePlayers, awayPlayers);

        // Also simulate any remaining AI vs AI matches in the round
        updatedCup = simulateAIEuropeanCupMatches(updatedCup, gameState.teams, gameState.players, gameState.userTeamId);

        // Check if tournament complete
        if (updatedCup.currentRound === 'COMPLETE' && updatedCup.winnerId) {
            const winner = gameState.teams.find(t => t.id === updatedCup.winnerId);
            const isUserWinner = updatedCup.winnerId === gameState.userTeamId;

            // Prize money
            const prizeMoney = isUserWinner ? 10000000 : 3000000; // €10M for winner, €3M for participant

            const updatedTeams = gameState.teams.map(t =>
                t.id === gameState.userTeamId ? { ...t, budget: t.budget + prizeMoney } : t
            );

            setGameState({
                ...gameState,
                europeanCup: updatedCup,
                teams: updatedTeams,
                messages: [...gameState.messages, {
                    id: Math.random().toString(36).substring(2, 15),
                    week: gameState.currentWeek,
                    type: MessageType.BOARD,
                    subject: isUserWinner ? '🏆 Şampiyonlar Ligi Şampiyonu!' : '🏆 Şampiyonlar Ligi Sona Erdi',
                    body: isUserWinner
                        ? `Tebrikler! Şampiyonlar Ligi'ni kazandınız! €10M ödül bütçenize eklendi.`
                        : `${winner?.name || 'Bilinmeyen'} Şampiyonlar Ligi'ni kazandı. Katılım ödülü: €3M`,
                    isRead: false,
                    date: new Date().toISOString()
                }]
            });
        } else {
            setGameState({ ...gameState, europeanCup: updatedCup });
        }
    };

    const handleStartEuropeanCup = () => {
        if (!gameState) return;
        const cup = generateEuropeanCup(gameState);

        // Check if user qualified
        const userQualified = cup.qualifiedTeamIds.includes(gameState.userTeamId);

        setGameState({
            ...gameState,
            europeanCup: cup,
            messages: [...gameState.messages, {
                id: Math.random().toString(36).substring(2, 15),
                week: gameState.currentWeek,
                type: MessageType.BOARD,
                subject: '🌟 Şampiyonlar Ligi Kura Çekimi!',
                body: userQualified
                    ? 'Takımınız Şampiyonlar Ligi\'ne katılmaya hak kazandı! Çeyrek final eşleşmeleri belirlendi.'
                    : 'Şampiyonlar Ligi başladı. Maalesef takımınız bu sezon katılmaya hak kazanamadı.',
                isRead: false,
                date: new Date().toISOString()
            }]
        });

        setShowEuropeanCup(true);
    };

    const handleSubstitution = (p1Id: string, p2Id: string) => {
        if (!gameState) return;
        const p1 = gameState.players.find(p => p.id === p1Id);
        const p2 = gameState.players.find(p => p.id === p2Id);
        if (!p1 || !p2) return;

        // CASE 1: SWAP POSITIONS (Both Starting)
        if (p1.lineup === 'STARTING' && p2.lineup === 'STARTING') {
            const updatedPlayers = gameState.players.map(p => {
                if (p.id === p1Id) return { ...p, lineupIndex: p2.lineupIndex || 0 };
                if (p.id === p2Id) return { ...p, lineupIndex: p1.lineupIndex || 0 };
                return p;
            });
            setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);

            // Sync engine immediately
            const homeP = updatedPlayers.filter(p => p.teamId === (activeMatch?.homeTeamId || ''));
            const awayP = updatedPlayers.filter(p => p.teamId === (activeMatch?.awayTeamId || ''));
            if (homeP.length > 0 && awayP.length > 0) {
                syncEngineLineups(homeP, awayP);
            }
            return;
        }

        // CASE 2: REORDER BENCH (Both Bench)
        if (p1.lineup !== 'STARTING' && p2.lineup !== 'STARTING') {
            const updatedPlayers = gameState.players.map(p => {
                if (p.id === p1Id) return { ...p, lineupIndex: p2.lineupIndex || 0 };
                if (p.id === p2Id) return { ...p, lineupIndex: p1.lineupIndex || 0 };
                return p;
            });
            setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
            return;
        }

        // CASE 3: SUBSTITUTION (One Starter, One Bench)
        const playerIn = p1.lineup !== 'STARTING' ? p1 : p2;
        const playerOut = p1.lineup === 'STARTING' ? p1 : p2;

        const updatedPlayers = gameState.players.map(p => {
            if (p.id === playerIn.id) return { ...p, lineup: 'STARTING' as LineupStatus, lineupIndex: playerOut.lineupIndex || 0 };
            if (p.id === playerOut.id) return { ...p, lineup: 'BENCH' as LineupStatus, lineupIndex: playerIn.lineupIndex || 0 };
            return p;
        });

        setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);

        // FIX: Sync engine lineups to prevent ghost player bug
        const homeP = updatedPlayers.filter(p => p.teamId === (activeMatch?.homeTeamId || ''));
        const awayP = updatedPlayers.filter(p => p.teamId === (activeMatch?.awayTeamId || ''));
        if (homeP.length > 0 && awayP.length > 0) {
            syncEngineLineups(homeP, awayP);
        }

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

            if (!match.isFriendly) {
                const hScore = simulated.homeScore;
                const aScore = simulated.awayScore;
                let ptsHome = hScore > aScore ? 3 : hScore === aScore ? 1 : 0;
                let ptsAway = aScore > hScore ? 3 : hScore === aScore ? 1 : 0;

                // Collect scorer IDs from simulated match events
                const scorerIds: string[] = [];
                simulated.events.forEach(e => {
                    if (e.type === MatchEventType.GOAL && e.playerId) {
                        scorerIds.push(e.playerId);
                    }
                });

                // Update players immutably
                const updatedPlayers = prevState.players.map(p => {
                    const goalsScored = scorerIds.filter(id => id === p.id).length;
                    if (goalsScored > 0) {
                        return {
                            ...p,
                            stats: {
                                ...(p.stats || { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 }),
                                goals: (p.stats?.goals || 0) + goalsScored
                            }
                        };
                    }
                    return p;
                });

                // Update teams immutably
                const updatedTeams = prevState.teams.map(team => {
                    if (team.id === homeTeam.id) {
                        return {
                            ...team,
                            stats: {
                                ...team.stats,
                                played: team.stats.played + 1,
                                won: team.stats.won + (ptsHome === 3 ? 1 : 0),
                                drawn: team.stats.drawn + (ptsHome === 1 ? 1 : 0),
                                lost: team.stats.lost + (ptsHome === 0 ? 1 : 0),
                                gf: team.stats.gf + hScore,
                                ga: team.stats.ga + aScore,
                                points: team.stats.points + ptsHome
                            },
                            recentForm: [...(team.recentForm || []), hScore > aScore ? 'W' : hScore === aScore ? 'D' : 'L'].slice(-5) as ('W' | 'D' | 'L')[]
                        };
                    }
                    if (team.id === awayTeam.id) {
                        return {
                            ...team,
                            stats: {
                                ...team.stats,
                                played: team.stats.played + 1,
                                won: team.stats.won + (ptsAway === 3 ? 1 : 0),
                                drawn: team.stats.drawn + (ptsAway === 1 ? 1 : 0),
                                lost: team.stats.lost + (ptsAway === 0 ? 1 : 0),
                                gf: team.stats.gf + aScore,
                                ga: team.stats.ga + hScore,
                                points: team.stats.points + ptsAway
                            },
                            recentForm: [...(team.recentForm || []), aScore > hScore ? 'W' : aScore === hScore ? 'D' : 'L'].slice(-5) as ('W' | 'D' | 'L')[]
                        };
                    }
                    return team;
                });

                let newMatches = [...prevState.matches];
                newMatches[matchIndex] = simulated;
                return { ...prevState, matches: newMatches, teams: updatedTeams, players: updatedPlayers };
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

        // Process match completion when minute reaches 90
        if (currentMatch.currentMinute >= 90) {
            currentMatch.currentMinute = 90;
            if (!currentMatch.events.find(e => e.type === MatchEventType.FULL_TIME)) currentMatch.events.push({ minute: 90, type: MatchEventType.FULL_TIME, description: t.fullTime });

            // CRITICAL FIX: Only update stats if match wasn't already marked as played
            if (!currentMatch.isPlayed) {
                currentMatch.isPlayed = true;

                if (!match.isFriendly) {
                    const hScore = currentMatch.homeScore;
                    const aScore = currentMatch.awayScore;
                    let ptsHome = hScore > aScore ? 3 : hScore === aScore ? 1 : 0;
                    let ptsAway = aScore > hScore ? 3 : hScore === aScore ? 1 : 0;

                    // Player Stats from Live Match - collect scorer IDs
                    const scorerIds: string[] = [];
                    currentMatch.events.forEach(e => {
                        if (e.type === MatchEventType.GOAL && e.playerId) {
                            scorerIds.push(e.playerId);
                        }
                    });

                    // Update players immutably
                    const updatedPlayers = prevState.players.map(p => {
                        const goalsScored = scorerIds.filter(id => id === p.id).length;
                        if (goalsScored > 0) {
                            return {
                                ...p,
                                stats: {
                                    ...(p.stats || { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0 }),
                                    goals: (p.stats?.goals || 0) + goalsScored
                                }
                            };
                        }
                        return p;
                    });

                    // Update teams immutably
                    const updatedTeams = prevState.teams.map(team => {
                        if (team.id === homeTeam.id) {
                            return {
                                ...team,
                                stats: {
                                    ...team.stats,
                                    played: team.stats.played + 1,
                                    won: team.stats.won + (ptsHome === 3 ? 1 : 0),
                                    drawn: team.stats.drawn + (ptsHome === 1 ? 1 : 0),
                                    lost: team.stats.lost + (ptsHome === 0 ? 1 : 0),
                                    gf: team.stats.gf + hScore,
                                    ga: team.stats.ga + aScore,
                                    points: team.stats.points + ptsHome
                                },
                                recentForm: [...(team.recentForm || []), hScore > aScore ? 'W' : hScore === aScore ? 'D' : 'L'].slice(-5) as ('W' | 'D' | 'L')[]
                            };
                        }
                        if (team.id === awayTeam.id) {
                            return {
                                ...team,
                                stats: {
                                    ...team.stats,
                                    played: team.stats.played + 1,
                                    won: team.stats.won + (ptsAway === 3 ? 1 : 0),
                                    drawn: team.stats.drawn + (ptsAway === 1 ? 1 : 0),
                                    lost: team.stats.lost + (ptsAway === 0 ? 1 : 0),
                                    gf: team.stats.gf + aScore,
                                    ga: team.stats.ga + hScore,
                                    points: team.stats.points + ptsAway
                                },
                                recentForm: [...(team.recentForm || []), aScore > hScore ? 'W' : aScore === hScore ? 'D' : 'L'].slice(-5) as ('W' | 'D' | 'L')[]
                            };
                        }
                        return team;
                    });

                    let newMatches = [...prevState.matches];
                    newMatches[matchIndex] = currentMatch;
                    return { ...prevState, matches: newMatches, players: updatedPlayers, teams: updatedTeams };
                }
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
        if (!gameState) {
            setView('dashboard');
            return;
        }

        let currentState = gameState;

        // 1. Ensure the active match is marked as PLAYED (Simulate to end if exited early)
        if (activeMatchId) {
            const match = currentState.matches.find(m => m.id === activeMatchId);
            if (match) {
                // If exiting early, simulate the rest of the match so it counts!
                if (!match.isPlayed) {
                    currentState = executeMatchUpdate(currentState, activeMatchId, true);
                }

                // 2. If it was a Friendly Match, DO NOT advance the week or simulate league
                // Just save the result (which is in currentState now) and exit
                if (match.isFriendly) {
                    setGameState(currentState);
                    setView('dashboard');
                    setActiveMatchId(null);
                    return;
                }
            }
        }

        // 3. Normal League Match Flow
        // Simulate other matches for this week
        const updatedState = simulateLeagueRound(currentState, currentState.currentWeek);

        // Process weekly events (Training, News, etc.)
        // Pass 't' for localized news/reports
        const { updatedTeams, updatedPlayers, updatedMarket, report, offers, newPendingOffers } = processWeeklyEvents(updatedState, t);

        setGameState({
            ...updatedState,
            teams: updatedTeams,
            players: updatedPlayers,
            transferMarket: updatedMarket,
            currentWeek: updatedState.currentWeek + 1,
            pendingOffers: [...(updatedState.pendingOffers || []), ...(newPendingOffers || [])],
            messages: [
                ...updatedState.messages,
                ...report.map(r => ({ id: uuid(), week: updatedState.currentWeek, type: MessageType.TRAINING, subject: t.trainingReport, body: r, isRead: false, date: new Date().toISOString() })),
                ...offers
            ]
        });
        setView('dashboard');
        setActiveMatchId(null);
    };

    // Show Profile Selector if requested
    if (showProfileSelector) {
        return (
            <ProfileSelector
                profiles={profiles}
                onSelectProfile={handleSelectProfile}
                onCreateProfile={handleCreateProfile}
                onDeleteProfile={handleDeleteProfile}
                onResetProfile={handleResetProfile}
                onRenameProfile={handleRenameProfile}
                lang={lang}
            />
        );
    }

    if (showLeagueSelect) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 text-white animate-fade-in">
                <div className="text-center mb-4 md:mb-8">
                    <div className="text-emerald-500 font-bold text-2xl md:text-4xl tracking-tighter mb-1 md:mb-2">POCKET<span className="text-white">FM</span></div>
                    <h1 className="text-lg md:text-2xl font-bold">{t.selectLeague}</h1>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 max-w-4xl w-full">
                    {LEAGUE_PRESETS.map(league => (
                        <button key={league.id} onClick={() => handleStartGame(league.id)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-xl p-3 md:p-6 transition-all group flex flex-col items-center gap-2 md:gap-4 shadow-xl">
                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-slate-900 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <Globe className="text-slate-400" size={20} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm md:text-xl font-bold text-white leading-tight">{t[`league${league.country}` as keyof typeof t] || league.name}</h3>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (showTeamSelect && gameState) {
        const sortedTeams = [...gameState.teams].sort((a, b) => b.reputation - a.reputation);
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center p-3 md:p-6 text-white animate-fade-in">
                <div className="text-center mb-4 md:mb-8 mt-4 md:mt-10">
                    <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{t.selectTeam}</h1>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 max-w-7xl w-full">
                    {sortedTeams.map(team => (
                        <button key={team.id} onClick={() => handleSelectTeam(team.id)} className="bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 rounded-xl overflow-hidden group transition-all hover:scale-105 shadow-lg relative flex flex-col">
                            <div className="h-14 md:h-24 relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: team.primaryColor }}>
                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center text-lg md:text-2xl font-bold z-10" style={{ color: team.primaryColor }}>
                                    {team.name.substring(0, 1)}
                                </div>
                            </div>
                            <div className="p-2 md:p-4 flex-1 flex flex-col w-full">
                                <h3 className="text-xs md:text-lg font-bold text-white mb-1 truncate text-center">{team.name}</h3>
                                <div className="mt-auto space-y-1 md:space-y-2">
                                    <div className="flex justify-between text-[10px] md:text-xs border-b border-slate-700 pb-1 md:pb-2">
                                        <span className="text-slate-500">{t.reputation}</span>
                                        <span className="font-bold text-white">{team.reputation}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] md:text-xs">
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
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-10 relative overflow-x-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', // Texture
                backgroundSize: 'auto'
            }}></div>

            {/* Ambient Gradient Background based on team color */}
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" style={{
                background: `radial-gradient(circle at 50% 10%, ${userTeam.primaryColor} 0%, transparent 70%)`
            }}></div>

            {!userTeam.sponsor && <SponsorModal onSelect={handleSelectSponsor} t={t} />}
            <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onRenew={handleContractRenewal} onToggleTransferList={handleToggleTransferList} t={t} />
            {inspectedTeamId && <TeamInspector team={gameState.teams.find(t => t.id === inspectedTeamId)!} players={gameState.players.filter(p => p.teamId === inspectedTeamId)} onClose={() => setInspectedTeamId(null)} t={t} />}
            {assistantAdvice && <AssistantReport advice={assistantAdvice} onAutoFix={handleAutoFix} onClose={() => setAssistantAdvice(null)} t={t} />}

            {offerToProcess && offerToProcess.data && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-emerald-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl relative z-50">
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
                    <div className="bg-slate-900 border border-yellow-500/50 rounded-xl max-w-lg w-full p-6 shadow-2xl relative z-50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="text-yellow-400" /> {t.playFriendly}</h2>
                            <button onClick={() => setShowDerbySelect(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
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
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center relative z-50">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold" style={{ backgroundColor: userTeam.primaryColor, color: '#fff' }}>
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

            {/* Opponent Preview Modal */}
            {showOpponentPreview && pendingMatch && (() => {
                const opponentId = pendingMatch.homeTeamId === userTeam.id ? pendingMatch.awayTeamId : pendingMatch.homeTeamId;
                const opponent = gameState.teams.find(t => t.id === opponentId);
                const opponentPlayers = gameState.players.filter(p => p.teamId === opponentId);

                if (!opponent) return null;

                return (
                    <OpponentPreview
                        opponent={opponent}
                        opponentPlayers={opponentPlayers}
                        userTeam={userTeam}
                        t={t}
                        onClose={() => {
                            setShowOpponentPreview(false);
                            setPendingMatch(null);
                        }}
                        onStartMatch={confirmStartMatch}
                    />
                );
            })()}

            {/* European Cup Modal */}
            {showEuropeanCup && gameState.europeanCup && (
                <EuropeanCupView
                    cup={gameState.europeanCup}
                    teams={gameState.teams}
                    userTeamId={userTeam.id}
                    t={t}
                    onPlayMatch={handlePlayEuropeanCupMatch}
                    onClose={() => setShowEuropeanCup(false)}
                />
            )}

            {/* Desktop Sidebar (Left) - Hidden on Mobile */}
            <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex-col z-40 shadow-2xl">
                <div className="p-6 border-b border-slate-800 hidden md:block">
                    <div className="text-emerald-500 font-bold text-2xl tracking-tighter">POCKET<span className="text-white">FM</span></div>
                    {activeProfileId && profiles.find(p => p.id === activeProfileId) && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                            <UserCircle size={14} />
                            <span className="truncate">{profiles.find(p => p.id === activeProfileId)?.name}</span>
                        </div>
                    )}
                </div>
                <nav className="flex-1 p-2 md:p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={20} /> <span className="hidden md:inline">{t.dashboard}</span></button>
                    <button onClick={() => setView('news')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg relative transition-all ${view === 'news' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Mail size={20} /> <span className="hidden md:inline">{t.news}</span>{unreadMessages > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-slate-900"></span>}</button>
                    <button onClick={() => setView('squad')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'squad' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Users size={20} /> <span className="hidden md:inline">{t.squad}</span></button>
                    <button onClick={() => setView('training')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'training' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Activity size={20} /> <span className="hidden md:inline">{t.training}</span></button>
                    <button onClick={() => setView('transfers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'transfers' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><ShoppingCart size={20} /> <span className="hidden md:inline">{t.market}</span></button>
                    <button onClick={() => setView('club')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'club' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Building2 size={20} /> <span className="hidden md:inline">{t.club}</span></button>
                    <button onClick={() => setView('league')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'league' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Trophy size={20} /> <span className="hidden md:inline">{t.standings}</span></button>
                    <button onClick={() => setView('rankings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'rankings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Globe size={20} /> <span className="hidden md:inline">{t.worldRankings}</span></button>
                    <button onClick={() => setView('guide')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'guide' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BookOpen size={20} /> <span className="hidden md:inline">{t.gameGuide}</span></button>
                    <button onClick={() => setView('match')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'match' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><SkipForward size={20} /> <span className="hidden md:inline">{t.matchDay}</span></button>
                    <button onClick={() => setView('fixtures')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'fixtures' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Calendar size={20} /> <span className="hidden md:inline">{t.fixtures}</span></button>
                    <button onClick={openDerbySelector} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mt-4 text-yellow-400 hover:bg-slate-800 border border-yellow-500/30 font-bold transition-all hover:border-yellow-500"><Zap size={20} /> <span className="hidden md:inline">{t.playFriendly}</span></button>
                </nav>
                <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900">
                    <button
                        onClick={handleBackToProfiles}
                        className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                        <UserCircle size={14} />
                        {lang === 'tr' ? 'Profillere Dön' : 'Back to Profiles'}
                    </button>
                    <div className="flex justify-center gap-2">
                        <button onClick={() => setLang('tr')} className={`text-xs px-2 py-1 rounded transition-colors ${lang === 'tr' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>TR</button>
                        <button onClick={() => setLang('en')} className={`text-xs px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>EN</button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation - Improved */}
            {view !== 'match' && (
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex justify-between items-center px-2 py-1 z-50 overflow-x-auto scrollbar-hide shadow-[0_-5px_20px_rgba(0,0,0,0.5)] safe-area-bottom">
                    <button onClick={() => setView('dashboard')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'dashboard' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <LayoutDashboard size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-bold">{t.dashboard}</span>
                    </button>
                    <button onClick={() => setView('news')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 relative transition-all active:scale-95 ${view === 'news' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <div className="relative">
                            <Mail size={24} strokeWidth={view === 'news' ? 2.5 : 2} />
                            {unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900"></span>}
                        </div>
                        <span className="text-[9px] mt-1 font-bold">{t.news}</span>
                    </button>
                    <button onClick={() => setView('squad')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'squad' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <Users size={24} strokeWidth={view === 'squad' ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-bold">{t.squad}</span>
                    </button>
                    <button onClick={() => setView('match')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'match' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <div className="bg-emerald-600 rounded-full p-2 -mt-6 shadow-lg shadow-emerald-500/30 border-4 border-slate-900">
                            <SkipForward size={20} className="text-white fill-white" />
                        </div>
                        <span className="text-[9px] mt-1 font-bold text-emerald-500">{t.matchDay}</span>
                    </button>
                    <button onClick={() => setView('fixtures')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'fixtures' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <Calendar size={24} strokeWidth={view === 'fixtures' ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-bold">{t.fixtures}</span>
                    </button>
                    <button onClick={() => setView('transfers')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'transfers' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <ShoppingCart size={24} strokeWidth={view === 'transfers' ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-bold">{t.market}</span>
                    </button>
                    <button onClick={() => setView('club')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'club' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <Building2 size={24} strokeWidth={view === 'club' ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-bold">{t.club}</span>
                    </button>
                    <button onClick={() => setView('training')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'training' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <Activity size={24} strokeWidth={view === 'training' ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-bold">{t.training}</span>
                    </button>
                    <button onClick={() => setView('league')} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] shrink-0 transition-all active:scale-95 ${view === 'league' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        <Trophy size={24} strokeWidth={view === 'league' ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-bold">{t.standings}</span>
                    </button>
                </div>
            )}

            <div className="md:ml-64 p-4 md:p-8 pb-32 md:pb-8 relative z-10 w-full max-w-full overflow-hidden">
                {view === 'match' && activeMatch ? (
                    <MatchCenter
                        match={activeMatch} homeTeam={activeHome} awayTeam={activeAway}
                        homePlayers={gameState.players.filter(p => p.teamId === activeHome.id)}
                        awayPlayers={gameState.players.filter(p => p.teamId === activeAway.id)}
                        onTick={processMatchTick} onFinish={handleMatchFinish} onInstantFinish={handleInstantFinish}
                        onSubstitute={handleSubstitution} onUpdateTactic={handleUpdateTactic} onAutoFix={handleAutoFix}
                        userTeamId={userTeam.id} t={t} debugLogs={debugLog} onPlayerClick={setSelectedPlayer}
                    />
                ) : (
                    <div className="animate-fade-in w-full">
                        {view === 'dashboard' && (
                            <div className="flex flex-col gap-6">
                                {/* Hero Section */}
                                <div className="rounded-2xl overflow-hidden shadow-2xl relative border border-slate-700 group">
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-700" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80")', opacity: 0.3 }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
                                    <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold border-4 border-white/10 shadow-xl" style={{ backgroundColor: userTeam.primaryColor, color: '#fff' }}>
                                            {userTeam.name.substring(0, 1)}
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2 uppercase italic">{userTeam.name}</h2>
                                            <p className="text-slate-300 text-lg">{t.managerWelcome.replace('{name}', '')}</p>
                                            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                                                <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                                                    <span className="text-xs uppercase text-slate-400 font-bold block">Reputation</span>
                                                    <span className="text-xl font-bold text-white">{userTeam.reputation}</span>
                                                </div>
                                                <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                                                    <span className="text-xs uppercase text-slate-400 font-bold block">Budget</span>
                                                    <span className="text-xl font-bold text-emerald-400">€{(userTeam.budget / 1000000).toFixed(1)}M</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col gap-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2"><SkipForward className="text-emerald-500" /> {t.nextMatch}</h3>
                                        <p className="text-slate-400 text-sm">{t.dashboardDesc}</p>
                                        <div className="flex gap-3 mt-auto">
                                            <button onClick={startNextMatch} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50 transition-all hover:scale-105 active:scale-95"><SkipForward /> {t.playNextMatch}</button>
                                            <button onClick={openDerbySelector} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/50 transition-all hover:scale-105 active:scale-95"><Zap /> {t.quickDerby}</button>
                                        </div>
                                        {/* Mobile Profile Exit Button */}
                                        <button
                                            onClick={handleBackToProfiles}
                                            className="md:hidden w-full mt-3 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-600"
                                        >
                                            <LogOut size={18} /> {lang === 'tr' ? 'Profillere Dön' : 'Exit to Profiles'}
                                        </button>

                                        {/* Lig Kupası Button (only shows if cup exists) */}
                                        {gameState.europeanCup && (
                                            <button
                                                onClick={() => setShowEuropeanCup(true)}
                                                className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                                            >
                                                <Trophy size={18} /> Lig Kupası {gameState.europeanCup.currentRound !== 'COMPLETE' ? '⚽' : '🏆'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Briefcase size={18} className="text-blue-500" /> {t.boardConfidence}</h2>
                                            <div className="flex items-center gap-4 mb-4">
                                                <CheckCircle2 className="text-emerald-500" size={28} />
                                                <div className="w-full bg-slate-900 h-6 rounded-full overflow-hidden border border-slate-700 p-0.5">
                                                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full w-[85%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 border-t border-slate-700 pt-4">
                                            <h3 className="text-xs uppercase text-slate-500 font-bold mb-3 flex items-center gap-1"><Target size={12} /> Season Objectives</h3>
                                            <div className="space-y-2">
                                                {(userTeam.objectives || []).map(obj => (
                                                    <div key={obj.id} className="flex items-center justify-between text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                                        <span className="text-slate-300 font-medium">{obj.description}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${obj.status === 'COMPLETED' ? 'bg-green-900 text-green-400 border border-green-700' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>{obj.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {view === 'news' && (
                            <NewsCenter
                                messages={gameState.messages}
                                pendingOffers={gameState.pendingOffers}
                                onMarkAsRead={handleMarkAsRead}
                                onAcceptOffer={handleAcceptOffer}
                                onRejectOffer={handleRejectOffer}
                                t={t}
                            />
                        )}
                        {view === 'squad' && <TeamManagement team={userTeam} players={userPlayers} onUpdateTactic={handleUpdateTactic} onPlayerClick={setSelectedPlayer} onUpdateLineup={handleUpdateLineup} onSwapPlayers={handleSwapPlayers} onMovePlayer={handleMovePlayer} onAutoFix={handleAutoFix} t={t} />}
                        {view === 'training' && <TrainingCenter team={userTeam} onSetFocus={handleSetTrainingFocus} onSetIntensity={handleSetTrainingIntensity} t={t} />}
                        {view === 'transfers' && <TransferMarket marketPlayers={gameState.transferMarket} userTeam={userTeam} onBuyPlayer={handleBuyPlayer} onPlayerClick={setSelectedPlayer} t={t} />}
                        {view === 'club' && (
                            <ClubManagement
                                team={userTeam}
                                players={userPlayers}
                                t={t}
                                onPromoteYouth={handlePromoteYouth}
                                onResign={handleResign}
                                onUpgradeStaff={handleUpgradeStaff}
                                onUpgradeFacility={handleUpgradeFacility}
                            />
                        )}
                        {view === 'league' && <LeagueTable teams={gameState.teams.filter(t => t.leagueId === gameState.leagueId)} players={gameState.players} history={gameState.history} t={t} onInspectTeam={setInspectedTeamId} />}
                        {view === 'rankings' && <WorldRankings players={gameState.players} teams={gameState.teams} t={t} onPlayerClick={setSelectedPlayer} />}
                        {view === 'fixtures' && <FixturesView matches={gameState.matches} teams={gameState.teams} players={gameState.players} currentWeek={gameState.currentWeek} t={t} userTeamId={userTeam.id} />}
                        {view === 'guide' && <GameGuide t={t} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
