
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Team, Player, MatchEventType, TeamTactic, MessageType, LineupStatus, TrainingFocus, TrainingIntensity, Sponsor, Message, Match, AssistantAdvice, TeamStaff, Position, GameProfile, EuropeanCup, MatchEvent, EuropeanCupMatch } from './types';
import { generateWorld, simulateTick, processWeeklyEvents, simulateFullMatch, processSeasonEnd, initializeMatch, performSubstitution, updateMatchTactic, simulateLeagueRound, analyzeClubHealth, autoPickLineup, syncEngineLineups, getLivePlayerStamina, generateEuropeanCup, simulateEuropeanCupMatch, simulateAIEuropeanCupMatches, generateNextRound } from './services/engine';
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
import { TransferNegotiationModal } from './components/TransferNegotiationModal';
import { TRANSLATIONS, LEAGUE_PRESETS } from './constants';
import { LayoutDashboard, Users, Trophy, SkipForward, Briefcase, CheckCircle2, Building2, ShoppingCart, Mail, RefreshCw, Globe, Activity, DollarSign, Zap, X, Target, BookOpen, UserCircle, Calendar, LogOut, Menu } from 'lucide-react';
import { adMobService } from './services/adMobService';

const TOTAL_WEEKS_PER_SEASON = 38;
const uuid = () => Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
    // ... (State declarations unchanged) ...
    // To minimize context, skipping to handlePlayEuropeanCupMatch modification
    // But this tool call replaces a block. I should target the top imports first.
    // Wait, the instruction says "Add missing imports". I must include the whole top block or just target lines 1-5.
    // I'll target lines 1-30 to cover imports.
    // And then a separate call for the function?
    // No, I can do it in two chunks if I use multi_replace.
    // But tool is replace_file_content (single).
    // I'll use multi_replace_file_content.

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
    const [viewLeagueId, setViewLeagueId] = useState<string>('tr'); // Default to TR, will sync with valid ID
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [offerToProcess, setOfferToProcess] = useState<Message | null>(null);
    const [assistantAdvice, setAssistantAdvice] = useState<AssistantAdvice[] | null>(null);

    const [showDerbySelect, setShowDerbySelect] = useState(false);
    const [derbyHomeId, setDerbyHomeId] = useState<string | null>(null);
    const [derbyAwayId, setDerbyAwayId] = useState<string | null>(null);
    const [showOpponentPreview, setShowOpponentPreview] = useState(false);
    const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
    const [showEuropeanCup, setShowEuropeanCup] = useState(false);
    const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);

    const t = TRANSLATIONS[lang];

    // 📱 Initialize AdMob on mount
    useEffect(() => {
        const initAds = async () => {
            // Enable test mode during development
            // Comment out this line for production build
            // adMobService.enableTestMode();
            
            await adMobService.initialize();
        };
        initAds();
    }, []);

    // 📱 Control banner visibility based on view
    useEffect(() => {
        const handleBannerVisibility = async () => {
            // Hide banner during match, show on other views
            if (view === 'match') {
                await adMobService.hideBanner();
            } else if (gameState && !showProfileSelector && !showLeagueSelect && !showTeamSelect) {
                // Show banner on main game screens
                await adMobService.showBanner();
            }
        };
        handleBannerVisibility();
    }, [view, gameState, showProfileSelector, showLeagueSelect, showTeamSelect]);

    // Initialize profiles on mount
    useEffect(() => {
        const init = async () => {
            // Try to migrate old save
            const migratedProfileId = await migrateOldSave();

            // Load all profiles
            const loadedProfiles = await loadAllProfiles();
            setProfiles(loadedProfiles);

            if (migratedProfileId) {
                // Load migrated profile
                await setActiveProfileId(migratedProfileId);
                await setActiveProfile(migratedProfileId);
                const profileData = await loadProfileData(migratedProfileId);
                if (profileData) {
                    setGameState(profileData);
                }
            } else if (loadedProfiles.length > 0) {
                // Load last active profile or first profile
                const lastActiveId = await getActiveProfileId();
                const profileToLoad = lastActiveId && loadedProfiles.find(p => p.id === lastActiveId)
                    ? lastActiveId
                    : loadedProfiles[0].id;

                await setActiveProfileId(profileToLoad);
                await setActiveProfile(profileToLoad);
                const profileData = await loadProfileData(profileToLoad);
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
        };
        init();
    }, []);

    // Save game state to active profile whenever it changes
    useEffect(() => {
        const save = async () => {
            if (gameState && activeProfileId) {
                await saveProfileData(activeProfileId, gameState);
            }
        };
        save();
    }, [gameState, activeProfileId]);

    const handleStartGame = (leagueId: string) => {
        setShowLeagueSelect(false);
        setTimeout(() => {
            const world = generateWorld(leagueId);
            setGameState(world);
            setViewLeagueId(leagueId);
            setShowTeamSelect(true);
        }, 500);
    };

    const handleSelectTeam = (teamId: string) => {
        if (!gameState) return;
        const selectedTeam = gameState.teams.find(t => t.id === teamId);

        let newState = { ...gameState, userTeamId: teamId };

        // Async Generate European Competitions
        import('./services/engine').then(({ generateChampionsLeague, generateEuropaLeague }) => {
            // 1. Generate Champions League
            const clStart = generateChampionsLeague({ ...newState, userTeamId: teamId });

            // 2. Generate Europa League (Pass CL state so EL knows who is already taken)
            // Store CL in temp state to be read by EL generator if needed, or EL generator filters itself
            const elStart = generateEuropaLeague({ ...newState, userTeamId: teamId, europeanCup: clStart });

            // Check where the user ended up
            const inCL = clStart.qualifiedTeamIds.includes(teamId);
            const inEL = elStart.qualifiedTeamIds.includes(teamId);

            const newMessages = [...newState.messages];

            if (inCL) {
                newMessages.push({
                    id: uuid(), week: newState.currentWeek, type: MessageType.BOARD,
                    subject: '🏆 Şampiyonlar Ligi Daveti!',
                    body: `${selectedTeam?.name} olarak Şampiyonlar Ligi'ne katılmaya hak kazandınız!`,
                    isRead: false, date: new Date().toISOString()
                });
            } else if (inEL) {
                newMessages.push({
                    id: uuid(), week: newState.currentWeek, type: MessageType.BOARD,
                    subject: '🟠 UEFA Avrupa Ligi Daveti!',
                    body: `${selectedTeam?.name} olarak UEFA Avrupa Ligi'ne katılmaya hak kazandınız!`,
                    isRead: false, date: new Date().toISOString()
                });
            }

            newState = {
                ...newState,
                europeanCup: clStart,
                europaLeague: elStart, // NEW
                messages: newMessages
            };

            setGameState(newState);
        });

        setShowTeamSelect(false);
        setShowWelcome(true);
    };

    // Profile Management Handlers
    const handleCreateProfile = async (name: string) => {
        const newProfile = await createProfile(name);
        setProfiles(await loadAllProfiles());
        await setActiveProfileId(newProfile.id);
        await setActiveProfile(newProfile.id);
        setGameState(null);
        setShowProfileSelector(false);
        setShowLeagueSelect(true);
    };

    const handleSelectProfile = async (profileId: string) => {
        await setActiveProfileId(profileId);
        await setActiveProfile(profileId);
        const profileData = await loadProfileData(profileId);
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

    const handleDeleteProfile = async (profileId: string) => {
        await deleteProfile(profileId);
        setProfiles(await loadAllProfiles());
        if (activeProfileId === profileId) {
            setGameState(null);
            await setActiveProfileId(null);
            setShowProfileSelector(true);
        }
    };

    const handleResetProfile = async (profileId: string) => {
        await resetProfile(profileId);
        setProfiles(await loadAllProfiles());
        if (activeProfileId === profileId) {
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
        // Ownership Check
        if (player.teamId !== gameState.userTeamId) return;

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

        // Security Check: Cannot renew other teams' players
        if (player.teamId !== userTeam.id) {
            // alert(t.cannotRenewOtherTeam); 
            return;
        }

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

        if (currentLevel >= 25) {
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

        // Mark accepted offer as ACCEPTED and all other offers for same player as REJECTED
        const updatedOffers = gameState.pendingOffers?.map(o => {
            if (o.id === offerId) {
                return { ...o, status: 'ACCEPTED' as const };
            }
            // Reject all other pending offers for the same player
            if (o.playerId === offer.playerId && o.status === 'PENDING') {
                return { ...o, status: 'REJECTED' as const };
            }
            return o;
        }) || [];

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
            // Calculate total weeks dynamically from match schedule
            const maxWeek = Math.max(...gameState.matches.filter(m => !m.isFriendly).map(m => m.week));
            if (gameState.currentWeek > maxWeek) {
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
        let homeTeam = gameState.teams.find(t => t.id === match.homeTeamId);
        let awayTeam = gameState.teams.find(t => t.id === match.awayTeamId);

        // Fallback for user team check since match.homeTeamId might not be in gameState.teams? 
        // No, all teams should be in gameState.teams.

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

                // Determine where the match belongs
                let newMatches = [...prev.matches];
                let newEuropeanCup = prev.europeanCup ? { ...prev.europeanCup } : undefined;
                let newEuropaLeague = prev.europaLeague ? { ...prev.europaLeague } : undefined;

                // Helper to update match in list
                const updateMatchInList = (list: Match[]): boolean => {
                    const idx = list.findIndex(m => m.id === match.id);
                    if (idx !== -1) {
                        list[idx] = {
                            ...list[idx],
                            events: list[idx].events || match.events || [],
                            stats: list[idx].stats || match.stats || { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
                            liveData: {
                                ballHolderId: null,
                                pitchZone: 50,
                                lastActionText: 'Kickoff',
                                simulation: initialSimulation
                            } as any // force type
                        };
                        return true;
                    }
                    return false;
                };

                if (updateMatchInList(newMatches)) {
                    return { ...prev, matches: newMatches };
                } else if (newEuropeanCup && updateMatchInList(newEuropeanCup.matches)) {
                    return { ...prev, europeanCup: newEuropeanCup };
                } else if (newEuropaLeague && updateMatchInList(newEuropaLeague.matches)) {
                    return { ...prev, europaLeague: newEuropaLeague };
                }

                return prev;
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

        // AUTO-SIMULATE REMAINDER OF GLOBAL SEASON
        // Ensure other leagues (like La Liga with 38 weeks) finish even if user (Super Lig 34 weeks) finishes early.
        let tempState = { ...gameState };
        const allMatches = tempState.matches;
        const lastWeek = Math.max(...allMatches.map(m => m.week));

        if (tempState.currentWeek <= lastWeek) {
            let simulated = false;
            for (let w = tempState.currentWeek; w <= lastWeek; w++) {
                // Check if there are unplayed matches for this week
                const unplayed = tempState.matches.some(m => m.week === w && !m.isPlayed);
                if (unplayed) {
                    tempState = simulateLeagueRound(tempState, w);
                    simulated = true;
                }
            }
            if (simulated) {
                setGameState(tempState);
            }
        }

        // Use tempState for summary
        // Calculate winner for the User's League
        const sortedTeams = [...tempState.teams].sort((a, b) => b.stats.points - a.stats.points);
        const userLeagueTeams = sortedTeams.filter(t => t.leagueId === tempState.leagueId);
        const winner = userLeagueTeams.length > 0 ? userLeagueTeams[0] : sortedTeams[0];

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
        setNegotiatingPlayer(player);
    };

    const handleTransferComplete = (player: Player, finalPrice: number) => {
        if (!gameState) return;
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (!userTeam) return;

        // Double check funds
        if (userTeam.budget < finalPrice) {
            alert(t.notEnoughFunds);
            return;
        }

        // Find the seller team to update their budget
        const sellerTeamId = player.teamId;

        // Update existing player's team instead of creating duplicate
        const updatedPlayers = gameState.players.map(p => {
            if (p.id === player.id) {
                return {
                    ...p,
                    teamId: userTeam.id,
                    isTransferListed: false,
                    lineup: 'RESERVE' as const,
                    lineupIndex: 99,
                    contractYears: 3
                };
            }
            return p;
        });
        const updatedMarket = gameState.transferMarket.filter(p => p.id !== player.id);
        // Update budgets: subtract from buyer, add to seller
        const updatedTeams = gameState.teams.map(t => {
            if (t.id === userTeam.id) return { ...t, budget: t.budget - finalPrice };
            if (t.id === sellerTeamId && sellerTeamId !== 'FREE_AGENT') return { ...t, budget: t.budget + finalPrice };
            return t;
        });

        setGameState(prev => prev ? { ...prev, players: updatedPlayers, transferMarket: updatedMarket, teams: updatedTeams } : null);
        setNegotiatingPlayer(null); // Close modal
        alert(`${t.successfullySigned} ${player.lastName} for €${(finalPrice / 1000000).toFixed(2)}M!`);
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

    const handlePlayEuropeanCupMatch = (cupMatch: EuropeanCupMatch) => {
        if (!gameState) return;

        // USER MATCH: Play!
        // Convert to Pending Match
        const match: Match = {
            ...cupMatch,
            week: gameState.currentWeek, // Assign current week
            isFriendly: false,
            date: Date.now(),
            attendance: 50000,
            currentMinute: 0,
            weather: 'Night',
            timeOfDay: 'Night',
            stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
            events: []
        };

        setPendingMatch(match);
        setShowEuropeanCup(false);
        setShowOpponentPreview(true);
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
            // FIX: Ensure we resolve the active match correctly for Cup games
            let currentMatch: Match | undefined = gameState.matches.find(m => m.id === activeMatchId);
            if (!currentMatch && gameState.europeanCup) currentMatch = gameState.europeanCup.matches.find(m => m.id === activeMatchId);
            if (!currentMatch && gameState.europaLeague) currentMatch = gameState.europaLeague.matches.find(m => m.id === activeMatchId);

            const homeP = updatedPlayers.filter(p => p.teamId === (currentMatch?.homeTeamId || ''));
            const awayP = updatedPlayers.filter(p => p.teamId === (currentMatch?.awayTeamId || ''));
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

        // FIX: Sync engine lineups to prevent ghost player bug
        let currentMatch: Match | undefined = gameState.matches.find(m => m.id === activeMatchId);
        if (!currentMatch && gameState.europeanCup) currentMatch = gameState.europeanCup.matches.find(m => m.id === activeMatchId);
        if (!currentMatch && gameState.europaLeague) currentMatch = gameState.europaLeague.matches.find(m => m.id === activeMatchId);

        // ADD SUB EVENT DIRECTLY TO MATCH for immediate notification
        // This ensures toast shows even when match is paused
        if (currentMatch) {
            const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
            const subEvent: MatchEvent = {
                minute: currentMatch.currentMinute,
                type: MatchEventType.SUB,
                description: `🔄 ${playerOut.lastName} ⬇️ ${playerIn.lastName} ⬆️`,
                teamId: userTeam?.id || '',
                playerId: playerIn.id
            };
            
            // Update match with new event
            const updateMatchEvents = (matches: Match[]): Match[] => {
                return matches.map(m => {
                    if (m.id === currentMatch!.id) {
                        return { ...m, events: [...m.events, subEvent] };
                    }
                    return m;
                });
            };

            setGameState(prev => {
                if (!prev) return null;
                let newState = { ...prev, players: updatedPlayers };
                
                // Update in league matches
                newState.matches = updateMatchEvents(newState.matches);
                
                // Update in European Cup matches if applicable
                if (newState.europeanCup) {
                    newState.europeanCup = {
                        ...newState.europeanCup,
                        matches: updateMatchEvents(newState.europeanCup.matches) as any
                    };
                }
                if (newState.europaLeague) {
                    newState.europaLeague = {
                        ...newState.europaLeague,
                        matches: updateMatchEvents(newState.europaLeague.matches) as any
                    };
                }
                
                return newState;
            });
        } else {
            setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
        }

        // FIX: Only call performSubstitution - it handles all engine state updates
        // syncEngineLineups was causing race conditions and overwriting performSubstitution's work
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
            // Adil simülasyon - sadece takım gücüne göre (torpil yok!)
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
                // Update players immutably
                const updatedPlayers = prevState.players.map(p => {
                    const playedHome = homePlayers.find(hp => hp.id === p.id);
                    const playedAway = awayPlayers.find(ap => ap.id === p.id);
                    const played = playedHome || playedAway;

                    const goalsScored = scorerIds.filter(id => id === p.id).length;

                    if (played || goalsScored > 0) {
                        const oldStats = p.stats || { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, averageRating: 0 };
                        const oldApps = oldStats.appearances || 0;
                        const newApps = played ? oldApps + 1 : oldApps;

                        let newAverageRating = oldStats.averageRating || 0;
                        let newForm = p.form;

                        if (played) {
                            // Calculate Rating
                            let rating = 6.0 + (p.overall / 40) + (Math.random() * 1.5 - 0.5);

                            // Result Bonus
                            if ((playedHome && hScore > aScore) || (playedAway && aScore > hScore)) rating += 0.5;
                            else if (hScore === aScore) rating += 0.1;
                            else rating -= 0.3; // Loss penalty

                            // Clean Sheet Bonus (GK & DEF)
                            const keptCleanSheet = (playedHome && aScore === 0) || (playedAway && hScore === 0);
                            if (keptCleanSheet && (p.position === 'GK' || p.position === 'DEF')) {
                                rating += 0.8;
                            }

                            // GK Saves Bonus
                            if (p.position === 'GK') {
                                const saves = playedHome ? (simulated.stats.homeSaves || 0) : (simulated.stats.awaySaves || 0);
                                rating += (saves * 0.2);
                            }

                            // Goal Bonus
                            rating += (goalsScored * 1.0);

                            // Cap
                            rating = Math.max(3.0, Math.min(10.0, rating));

                            // Average Update
                            if (newApps > 0) {
                                newAverageRating = parseFloat((((oldStats.averageRating || 6.0) * oldApps + rating) / newApps).toFixed(2));
                            }

                            // Form Update
                            newForm = Math.min(10, Math.max(1, p.form + (rating > 7.0 ? 1 : rating < 5.5 ? -1 : 0)));
                        } else if (goalsScored > 0) {
                            // Scored but wasn't in "played" list? Rare/Bug but handle stats update
                            // Don't update apps/rating if not "played" (e.g. maybe sub logic fail), just goals
                        }

                        return {
                            ...p,
                            stats: {
                                ...oldStats,
                                goals: oldStats.goals + goalsScored,
                                appearances: newApps,
                                averageRating: newAverageRating
                            },
                            form: newForm
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
        // Handle additional events (substitutions, etc.)
        if (stepResult.additionalEvents && stepResult.additionalEvents.length > 0) {
            stepResult.additionalEvents.forEach((ev: MatchEvent) => {
                ev.minute = currentMatch.currentMinute;
                finalEvents.push(ev);
            });
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
                                    ...(p.stats || { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, averageRating: 0 }),
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

    const handleQuickSim = () => {
        if (!gameState) return;

        // Same logic as Dashboard's "Next Match" card
        // Cup matches have specific scheduled weeks
        const CUP_SCHEDULE: { [key: string]: number } = { 'ROUND_16': 7, 'QUARTER': 14, 'SEMI': 21, 'FINAL': 28 };

        const getCupMatch = (cup?: EuropeanCup) => {
            if (!cup || !cup.isActive || cup.currentRound === 'COMPLETE') return undefined;
            const scheduledWeek = CUP_SCHEDULE[cup.currentRound];
            if (gameState.currentWeek !== scheduledWeek) return undefined;

            return cup.matches.find(m =>
                !m.isPlayed && m.round === cup.currentRound &&
                (m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId)
            );
        };

        const clMatch = getCupMatch(gameState.europeanCup);
        const elMatch = getCupMatch(gameState.europaLeague);
        const leagueMatch = gameState.matches.find(m => m.week === gameState.currentWeek && (m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId) && !m.isPlayed);

        // Priority: CL > EL > League (matches dashboard)
        const nextMatch = clMatch || elMatch || leagueMatch;

        if (nextMatch) {
            // Identify User and AI teams
            const isUserHome = nextMatch.homeTeamId === gameState.userTeamId;
            const userTeamId = isUserHome ? nextMatch.homeTeamId : nextMatch.awayTeamId;
            const aiTeamId = isUserHome ? nextMatch.awayTeamId : nextMatch.homeTeamId;

            // 1. Validate USER Squad
            const userStarters = gameState.players.filter(p => p.teamId === userTeamId && p.lineup === 'STARTING');
            if (userStarters.length < 11) {
                alert(t.completeSquad || 'Please complete your starting XI.');
                return;
            }

            // 2. Ensure AI Squad is ready (Auto-Pick)
            const aiTeam = gameState.teams.find(t => t.id === aiTeamId);
            const aiPlayers = gameState.players.filter(p => p.teamId === aiTeamId);
            if (aiTeam && aiPlayers.length > 0) {
                // We need to update state with the auto-picked lineup for the AI team
                // But autoPickLineup returns { formation } and modifies player objects in place (if reference is kept)
                // The logic in simulateLeagueRound modifies them in place? 
                // logic in engine.ts: autoPickLineup(homePlayers, ...) -> homePlayers are from filter() which is a shallow copy array of refs?
                // Wait, gameState.players checks. 
                // In engine.ts autoPickLineup, it modifies the player objects passed to it.
                // Since these are objects from the gameState array (refs), it essentially mutates them?
                // If React state is immutable, we shouldn't mutate.
                // But let's look at how autoPickLineup works. It sets p.lineup = 'STARTING'.

                // To be safe and React-compliant, we should create a new players array with the updates.
                // However, for Quick Sim, we can just do what we do.

                // Actually, let's look at how we can do this properly without deep cloning everything if possible.
                // Or just call autoPickLineup on them.
                // We are about to call `executeMatchUpdate` which reads from `gameState`.
                // We should ideally update the gameState with the AI lineup first.

                // But `executeMatchUpdate` takes `prevState`.
                // We can produce a temporary state with the AI lineup set, then pass THAT to executeMatchUpdate?
                // Yes.

                /* 
                   FIX: We need to properly import autoPickLineup from engine.ts (it is imported as smartAutoPick in imports??)
                   Line 7: import { autoPickLineup as smartAutoPick, ... } from '../services/engine';
                   So we should use smartAutoPick.
                */

                autoPickLineup(aiPlayers, aiTeam.tactic.formation, aiTeam.coachArchetype);
            }

            // 1. Simulate the User's Match
            // Determine if this is a Cup match or League match
            const isCupMatch = !!(clMatch || elMatch);

            if (isCupMatch) {
                // For Cup matches, we need different handling
                // Cup matches don't go through executeMatchUpdate - they use simulateEuropeanCupMatch
                const cupMatch = clMatch || elMatch;
                if (!cupMatch) return;

                const homeTeam = gameState.teams.find(t => t.id === cupMatch.homeTeamId);
                const awayTeam = gameState.teams.find(t => t.id === cupMatch.awayTeamId);
                if (!homeTeam || !awayTeam) return;

                const homePlayers = gameState.players.filter(p => p.teamId === homeTeam.id);
                const awayPlayers = gameState.players.filter(p => p.teamId === awayTeam.id);

                // Auto-pick lineups
                autoPickLineup(homePlayers, homeTeam.tactic.formation);
                autoPickLineup(awayPlayers, awayTeam.tactic.formation);

                // Simulate the Cup match - returns updated EuropeanCup object
                let updatedState = { ...gameState };

                if (clMatch && gameState.europeanCup) {
                    const updatedCup = simulateEuropeanCupMatch(gameState.europeanCup, cupMatch.id, homeTeam, awayTeam, homePlayers, awayPlayers);
                    updatedState.europeanCup = updatedCup;

                    // Find the played match to show result
                    const playedCupMatch = updatedCup.matches.find(m => m.id === cupMatch.id);
                    if (playedCupMatch) {
                        alert(`${t.quickSimResult}: ${homeTeam.name} ${playedCupMatch.homeScore} - ${playedCupMatch.awayScore} ${awayTeam.name}`);
                    }
                }
                if (elMatch && gameState.europaLeague) {
                    const updatedCup = simulateEuropeanCupMatch(gameState.europaLeague, cupMatch.id, homeTeam, awayTeam, homePlayers, awayPlayers);
                    updatedState.europaLeague = updatedCup;

                    // Find the played match to show result
                    const playedCupMatch = updatedCup.matches.find(m => m.id === cupMatch.id);
                    if (playedCupMatch) {
                        alert(`${t.quickSimResult}: ${homeTeam.name} ${playedCupMatch.homeScore} - ${playedCupMatch.awayScore} ${awayTeam.name}`);
                    }
                }

                // Also simulate league round for this week
                updatedState = simulateLeagueRound(updatedState, updatedState.currentWeek);

                // Simulate AI European Cup Matches (other Cup games this week)
                if (updatedState.europeanCup && updatedState.europeanCup.isActive) {
                    const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                        updatedState.europeanCup,
                        updatedState.teams,
                        updatedState.players,
                        updatedState.userTeamId,
                        updatedState.currentWeek
                    );
                    updatedState = { ...updatedState, europeanCup: updatedCup, teams: updatedTeams };
                }
                if (updatedState.europaLeague && updatedState.europaLeague.isActive) {
                    const { updatedCup: updatedEL, updatedTeams: updatedTeamsEL } = simulateAIEuropeanCupMatches(
                        updatedState.europaLeague,
                        updatedState.teams,
                        updatedState.players,
                        updatedState.userTeamId,
                        updatedState.currentWeek
                    );
                    updatedState = { ...updatedState, europaLeague: updatedEL, teams: updatedTeamsEL };
                }

                // Process weekly events
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
            } else {
                // League match handling (original logic)
                let newState = executeMatchUpdate(gameState, nextMatch.id, true);

                const playedMatch = newState.matches.find(m => m.id === nextMatch.id);
                if (playedMatch && playedMatch.isPlayed) {
                    const homeTeam = newState.teams.find(t => t.id === playedMatch.homeTeamId);
                    const awayTeam = newState.teams.find(t => t.id === playedMatch.awayTeamId);

                    // Show result briefly
                    alert(`${t.quickSimResult}: ${homeTeam?.name} ${playedMatch.homeScore} - ${playedMatch.awayScore} ${awayTeam?.name}`);

                    // 2. Simulate other matches for this week (League Logic)
                    let updatedState = simulateLeagueRound(newState, newState.currentWeek);

                    // 3. Simulate AI European Cup Matches
                    if (updatedState.europeanCup && updatedState.europeanCup.isActive) {
                        const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                            updatedState.europeanCup,
                            updatedState.teams,
                            updatedState.players,
                            updatedState.userTeamId,
                            updatedState.currentWeek
                        );
                        updatedState = { ...updatedState, europeanCup: updatedCup, teams: updatedTeams };
                    }
                    if (updatedState.europaLeague && updatedState.europaLeague.isActive) {
                        const { updatedCup: updatedEL, updatedTeams: updatedTeamsEL } = simulateAIEuropeanCupMatches(
                            updatedState.europaLeague,
                            updatedState.teams,
                            updatedState.players,
                            updatedState.userTeamId,
                            updatedState.currentWeek
                        );
                        updatedState = { ...updatedState, europaLeague: updatedEL, teams: updatedTeamsEL };
                    }

                    // 4. Process weekly events (Training, News, etc.)
                    const { updatedTeams, updatedPlayers, updatedMarket, report, offers, newPendingOffers } = processWeeklyEvents(updatedState, t);

                    // 5. Update Game State & Advance Week
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
                }
            }
        } else {
            // No match available - check if season should end
            // Calculate maxWeek based on USER'S LEAGUE only (not all leagues)
            const userLeagueTeamIds = new Set(gameState.teams.filter(t => t.leagueId === gameState.leagueId).map(t => t.id));
            const userLeagueMatches = gameState.matches.filter(m => !m.isFriendly && (userLeagueTeamIds.has(m.homeTeamId) || userLeagueTeamIds.has(m.awayTeamId)));
            const maxWeek = userLeagueMatches.length > 0 ? Math.max(...userLeagueMatches.map(m => m.week)) : 34;

            if (gameState.currentWeek > maxWeek) {
                prepareSeasonEnd();
            } else {
                alert(t.noMatchToday);
            }
        }
    };

    const handleMatchSync = useCallback((matchId: string, result: any) => {
        setGameState(prevState => {
            if (!prevState) return null;

            // Determine where the match is
            let matchType: 'LEAGUE' | 'CL' | 'EL' = 'LEAGUE';
            let matchIndex = prevState.matches.findIndex(m => m.id === matchId);

            if (matchIndex === -1) {
                if (prevState.europeanCup) {
                    matchIndex = prevState.europeanCup.matches.findIndex(m => m.id === matchId);
                    if (matchIndex !== -1) matchType = 'CL';
                }
            }
            if (matchIndex === -1) {
                if (prevState.europaLeague) {
                    matchIndex = prevState.europaLeague.matches.findIndex(m => m.id === matchId);
                    if (matchIndex !== -1) matchType = 'EL';
                }
            }

            if (matchIndex === -1) return prevState;

            // Get match
            const currentMatch = matchType === 'LEAGUE'
                ? { ...prevState.matches[matchIndex] }
                : (matchType === 'CL' ? { ...prevState.europeanCup!.matches[matchIndex] } : { ...prevState.europaLeague!.matches[matchIndex] });

            // Sync Logic (Common)
            if (result.minuteIncrement) currentMatch.currentMinute = (currentMatch.currentMinute || 0) + 1;
            if (result.stats) currentMatch.stats = result.stats;
            if (result.simulation) {
                currentMatch.liveData = {
                    ballHolderId: result.ballHolderId, pitchZone: result.pitchZone, lastActionText: result.actionText, simulation: result.simulation
                };
            }
            if (result.event) {
                result.event.minute = currentMatch.currentMinute;
                currentMatch.events = [...currentMatch.events, result.event];
                if (result.event.type === MatchEventType.GOAL) {
                    if (result.event.teamId === currentMatch.homeTeamId) currentMatch.homeScore++;
                    else currentMatch.awayScore++;
                }
            }
            // Handle additional events (substitutions, etc.)
            if (result.additionalEvents && result.additionalEvents.length > 0) {
                result.additionalEvents.forEach((ev: MatchEvent) => {
                    ev.minute = currentMatch.currentMinute;
                    currentMatch.events = [...currentMatch.events, ev];
                });
            }

            let matchJustFinished = false;
            if (currentMatch.currentMinute >= 90 && !currentMatch.isPlayed) {
                if (!currentMatch.events.find((e: MatchEvent) => e.type === MatchEventType.FULL_TIME)) {
                    currentMatch.events.push({ minute: 90, type: MatchEventType.FULL_TIME, description: 'Full Time' });
                }
                currentMatch.isPlayed = true;
                matchJustFinished = true;

                // Note: We don't update team league stats here for Cup types. 
                // Only League matches update league stats.
                // But we DO update player stats for everyone.
            }

            // --- Update Player Stats (Goals) Locally to avoid state drift ---
            const updatedPlayers = [...prevState.players];
            if (result.event && result.event.type === MatchEventType.GOAL && result.event.playerId) {
                const pIndex = updatedPlayers.findIndex(p => p.id === result.event.playerId);
                if (pIndex !== -1) {
                    updatedPlayers[pIndex] = {
                        ...updatedPlayers[pIndex],
                        stats: { ...updatedPlayers[pIndex].stats, goals: (updatedPlayers[pIndex].stats?.goals || 0) + 1 }
                    };
                }
            }

            // --- Update Match Ratings & Appearances (When match finishes) ---
            if (matchJustFinished) {
                const homeWinner = currentMatch.homeScore > currentMatch.awayScore;
                const awayWinner = currentMatch.awayScore > currentMatch.homeScore;
                const isDraw = currentMatch.homeScore === currentMatch.awayScore;

                updatedPlayers.forEach((p, idx) => {
                    if ((p.teamId === currentMatch.homeTeamId || p.teamId === currentMatch.awayTeamId) && (p.lineup === 'STARTING' || p.lineup === 'BENCH')) {
                        
                        // *** CONDITION UPDATE FROM LIVE STAMINA ***
                        // Get live stamina from engine and save it as player's condition
                        const liveStamina = getLivePlayerStamina(p.id);
                        if (liveStamina !== undefined) {
                            updatedPlayers[idx] = {
                                ...updatedPlayers[idx],
                                condition: Math.round(liveStamina)
                            };
                        }
                        
                        // Assuming STARTING XI played the match.
                        if (p.lineup === 'STARTING') {
                            const oldApps = p.stats.appearances || 0;
                            const newApps = oldApps + 1;

                            // Calculate Rating (6.0 - 10.0)
                            let rating = 6.0 + (p.overall / 40) + (Math.random() * 1.5 - 0.5);

                            // Result Bonus
                            if ((p.teamId === currentMatch.homeTeamId && homeWinner) || (p.teamId === currentMatch.awayTeamId && awayWinner)) {
                                rating += 0.5;
                            } else if (isDraw) {
                                rating += 0.1;
                            } else {
                                rating -= 0.3; // Loss penalty
                            }

                            // Clean Sheet Bonus (GK & DEF)
                            const keptCleanSheet = (p.teamId === currentMatch.homeTeamId && currentMatch.awayScore === 0) ||
                                (p.teamId === currentMatch.awayTeamId && currentMatch.homeScore === 0);

                            if (keptCleanSheet && (p.position === 'GK' || p.position === 'DEF')) {
                                rating += 0.8;
                            }

                            // GK Saves Bonus
                            if (p.position === 'GK') {
                                const saves = p.teamId === currentMatch.homeTeamId ? (currentMatch.stats.homeSaves || 0) : (currentMatch.stats.awaySaves || 0);
                                rating += (saves * 0.2); // +1.0 for 5 saves
                            }

                            // Goal Bonus
                            const goals = currentMatch.events.filter((e: MatchEvent) => e.type === MatchEventType.GOAL && e.playerId === p.id).length;
                            rating += (goals * 1.0);

                            // Cap Rating
                            rating = Math.max(3.0, Math.min(10.0, rating));

                            // Update Average
                            const oldAvg = p.stats.averageRating || 6.0;
                            const newAvg = ((oldAvg * oldApps) + rating) / newApps;

                            updatedPlayers[idx] = {
                                ...p,
                                stats: {
                                    ...p.stats,
                                    appearances: newApps,
                                    averageRating: parseFloat(newAvg.toFixed(2))
                                },
                                // Update Form based on rating
                                form: Math.min(10, Math.max(1, p.form + (rating > 7.0 ? 1 : rating < 5.5 ? -1 : 0)))
                            };
                        }
                    }
                });
            }


            // Return updated state
            if (matchType === 'LEAGUE') {
                const newMatches = [...prevState.matches];
                newMatches[matchIndex] = currentMatch;

                // Update Team Stats for League only
                // CRITICAL FIX: Only update stats if match was NOT played before but is played now
                // This prevents double-counting when multiple syncs happen after match end
                const wasPlayed = prevState.matches[matchIndex].isPlayed;

                if (currentMatch.isPlayed && !currentMatch.isFriendly && !wasPlayed) {
                    const hScore = currentMatch.homeScore; const aScore = currentMatch.awayScore;
                    const ptsHome = hScore > aScore ? 3 : hScore === aScore ? 1 : 0;
                    const ptsAway = aScore > hScore ? 3 : hScore === aScore ? 1 : 0;

                    // Helper to update specific team in list
                    const updateTeamStats = (teams: any[], id: string, pts: number, gf: number, ga: number, res: 'W' | 'D' | 'L') => {
                        return teams.map(t => t.id === id ? {
                            ...t,
                            stats: { ...t.stats, played: t.stats.played + 1, points: t.stats.points + pts, gf: t.stats.gf + gf, ga: t.stats.ga + ga, won: t.stats.won + (pts === 3 ? 1 : 0), drawn: t.stats.drawn + (pts === 1 ? 1 : 0), lost: t.stats.lost + (pts === 0 ? 1 : 0) },
                            recentForm: [...t.recentForm, res].slice(-5)
                        } : t);
                    };

                    const newTeams = updateTeamStats(
                        updateTeamStats(prevState.teams, currentMatch.homeTeamId, ptsHome, hScore, aScore, hScore > aScore ? 'W' : hScore === aScore ? 'D' : 'L'),
                        currentMatch.awayTeamId, ptsAway, aScore, hScore, aScore > hScore ? 'W' : aScore === hScore ? 'D' : 'L'
                    );

                    return { ...prevState, matches: newMatches, players: updatedPlayers, teams: newTeams };
                }

                return { ...prevState, matches: newMatches, players: updatedPlayers };
            } else {
                // CUP Matches
                const updateCup = (cup: EuropeanCup) => {
                    const newMatches = [...cup.matches];
                    newMatches[matchIndex] = currentMatch;
                    return { ...cup, matches: newMatches };
                };

                if (matchType === 'CL') return { ...prevState, europeanCup: updateCup(prevState.europeanCup!), players: updatedPlayers };
                return { ...prevState, europaLeague: updateCup(prevState.europaLeague!), players: updatedPlayers };
            }
        });
    }, []);

    const handleInstantFinish = useCallback((matchId: string) => {
        setGameState(prevState => prevState ? executeMatchUpdate(prevState, matchId, true) : null);
    }, [t]);

    const handleMatchFinish = () => {
        if (!gameState) {
            setView('dashboard');
            return;
        }

        let currentState = gameState;

        // 1. Identify and Process the Active Match
        if (activeMatchId) {
            const match = currentState.matches.find(m => m.id === activeMatchId);

            // Check Cups if not found in League
            const clMatch = !match ? currentState.europeanCup?.matches.find(m => m.id === activeMatchId) : null;
            const elMatch = !match && !clMatch ? currentState.europaLeague?.matches.find(m => m.id === activeMatchId) : null;

            const activeCupMatch = clMatch || elMatch;

            // --- CUP MATCH HANDLING ---
            if (activeCupMatch) {
                // If exiting early, simulate to end
                if (!activeCupMatch.isPlayed) {
                    // We need a specialized simulator for Cup matches here if we want instant result?
                    // Or just rely on previous logic? The previous logic called executeMatchUpdate which worked on ID.
                    // But executeMatchUpdate searches in gameState.matches! It might fail for Cup matches if not updated.
                    // Let's assume for now user played it or we handle it via executeMatchUpdate if we patch it.
                    // Actually, handleInstantFinish calls executeMatchUpdate.
                    // Let's patch executeMatchUpdate to support Cups first?
                    // For now, let's assume it was played fully or handleMatchFinish is called after full time.
                }

                // If it's a CUP match, we only update the Cup state and run AI Cup Games.
                // We DO NOT advance the week or simulate the league yet.

                // Simulate other AI European matches for this week
                let updatedState = { ...currentState };

                if (updatedState.europeanCup && updatedState.europeanCup.isActive) {
                    const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                        updatedState.europeanCup, updatedState.teams, updatedState.players, updatedState.userTeamId, updatedState.currentWeek
                    );
                    updatedState.europeanCup = updatedCup;
                    updatedState.teams = updatedTeams;
                }

                if (updatedState.europaLeague && updatedState.europaLeague.isActive) {
                    const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                        updatedState.europaLeague, updatedState.teams, updatedState.players, updatedState.userTeamId, updatedState.currentWeek
                    );
                    updatedState.europaLeague = updatedCup;
                    updatedState.teams = updatedTeams;
                }

                setGameState(updatedState);
                setView('dashboard');
                setActiveMatchId(null);
                setPendingMatch(null);
                return; // EXIT EARLY
            }

            // --- LEAGUE/FRIENDLY MATCH HANDLING ---
            if (match) {
                // If exiting early, simulate the rest
                if (!match.isPlayed) {
                    currentState = executeMatchUpdate(currentState, activeMatchId, true);
                }

                // Friendly: Just save and exit
                if (match.isFriendly) {
                    setGameState(currentState);
                    setView('dashboard');
                    setActiveMatchId(null);
                    return;
                }
            }
        }

        // 3. Normal League Match Flow (Only reaches here if it was a League match)
        // Simulate other matches for this week
        let updatedState = simulateLeagueRound(currentState, currentState.currentWeek);

        // Also Simulate AI European Cup Matches (in case user didn't have a match but AI does)
        if (updatedState.europeanCup && updatedState.europeanCup.isActive) {
            const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                updatedState.europeanCup,
                updatedState.teams,
                updatedState.players,
                updatedState.userTeamId,
                updatedState.currentWeek
            );
            updatedState = { ...updatedState, europeanCup: updatedCup, teams: updatedTeams };
        }

        // Simulate AI Europa League Matches (UEFA)
        if (updatedState.europaLeague && updatedState.europaLeague.isActive) {
            const { updatedCup: updatedEL, updatedTeams: updatedTeamsEL } = simulateAIEuropeanCupMatches(
                updatedState.europaLeague, // Reuse logic, fits perfectly
                updatedState.teams,
                updatedState.players,
                updatedState.userTeamId,
                updatedState.currentWeek
            );
            updatedState = { ...updatedState, europaLeague: updatedEL, teams: updatedTeamsEL };
        }

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
        // Filter teams by the selected league (gameState.leagueId)
        // Since we now generate ALL teams, we only want to show teams from the chosen league for selection
        const leagueTeams = gameState.teams.filter(t => t.leagueId === gameState.leagueId);
        const sortedTeams = [...leagueTeams].sort((a, b) => b.reputation - a.reputation);
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
    const activeMatch = activeMatchId ? (gameState.matches.find(m => m.id === activeMatchId) || gameState.europeanCup?.matches.find(m => m.id === activeMatchId) || gameState.europaLeague?.matches.find(m => m.id === activeMatchId)) : null;
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

            {/* Season Summary Modal */}
            {showSeasonSummary && seasonSummaryData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl p-6 md:p-8 max-w-md w-full border border-yellow-500/30 shadow-2xl text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-yellow-400 mb-2">{t.seasonComplete || 'Season Complete!'}</h2>
                        <p className="text-slate-400 mb-6">{t.seasonOver || 'The season has ended.'}</p>

                        <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
                            <div className="text-sm text-slate-400 mb-1">{t.leagueChampion || 'League Champion'}</div>
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: seasonSummaryData.winner.primaryColor, color: '#fff' }}>
                                    {seasonSummaryData.winner.name.charAt(0)}
                                </div>
                                <span className="text-xl font-bold text-white">{seasonSummaryData.winner.name}</span>
                            </div>
                            <div className="text-sm text-emerald-400 mt-2">{seasonSummaryData.winner.stats.points} {t.points || 'Points'}</div>
                        </div>

                        <button
                            onClick={handleStartNewSeason}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg shadow-lg"
                        >
                            {t.startNewSeason || 'Start New Season'} →
                        </button>
                    </div>
                </div>
            )}

            {negotiatingPlayer && <TransferNegotiationModal player={negotiatingPlayer} userTeam={userTeam} onClose={() => setNegotiatingPlayer(null)} onComplete={handleTransferComplete} t={t} />}
            <PlayerModal
                player={selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
                onRenew={selectedPlayer?.teamId === userTeam.id ? handleContractRenewal : undefined}
                onToggleTransferList={selectedPlayer?.teamId === userTeam.id ? handleToggleTransferList : undefined}
                t={t}
            />
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

            {/* Mobile Bottom Navigation - Glassmorphism (5 Items) */}
            {view !== 'match' && (
                <div className="md:hidden fixed bottom-0 left-0 w-full z-50 safe-area-bottom">
                    {/* AdMob Control Bar (Just above navigation) */}
                    {adMobService.isNative() && (
                        <div className="mx-2 mb-1 px-2 py-1.5 rounded-lg bg-blue-900/40 border border-blue-500/30 flex items-center justify-between">
                            <span className="text-[10px] text-blue-400 font-bold">{lang === 'tr' ? '📺 Test Reklamı' : '📺 Test Ad'}</span>
                            <button 
                                onClick={() => {
                                    if (adMobService.isBannerVisible()) {
                                        adMobService.hideBanner();
                                    } else {
                                        adMobService.showBanner();
                                    }
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    
                    <div className="mx-2 mb-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[rgba(15,23,42,0.95)] backdrop-blur-xl flex justify-between items-stretch px-1">
                        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center justify-center py-3 flex-1 min-w-[56px] transition-all active:scale-95 ${view === 'dashboard' ? 'text-emerald-400 relative' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'dashboard' && <div className="absolute top-0 inset-x-4 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-b-full"></div>}
                            <LayoutDashboard size={20} className={view === 'dashboard' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} />
                            <span className="text-[9px] mt-1 font-bold tracking-tight">{t.dashboard}</span>
                        </button>

                        <button onClick={() => setView('squad')} className={`flex flex-col items-center justify-center py-3 flex-1 min-w-[56px] transition-all active:scale-95 ${view === 'squad' ? 'text-emerald-400 relative' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'squad' && <div className="absolute top-0 inset-x-4 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-b-full"></div>}
                            <Users size={20} className={view === 'squad' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} />
                            <span className="text-[9px] mt-1 font-bold tracking-tight">{t.squad}</span>
                        </button>

                        <button onClick={() => setView('news')} className={`flex flex-col items-center justify-center py-3 flex-1 min-w-[56px] transition-all active:scale-95 ${view === 'news' ? 'text-emerald-400 relative' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'news' && <div className="absolute top-0 inset-x-4 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-b-full"></div>}
                            <div className="relative">
                                <Mail size={20} className={view === 'news' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} />
                                {unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-900 shadow-md"></span>}
                            </div>
                            <span className="text-[9px] mt-1 font-bold tracking-tight">{t.news}</span>
                        </button>

                        <button onClick={() => setView('transfers')} className={`flex flex-col items-center justify-center py-3 flex-1 min-w-[56px] transition-all active:scale-95 ${view === 'transfers' ? 'text-emerald-400 relative' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'transfers' && <div className="absolute top-0 inset-x-4 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-b-full"></div>}
                            <ShoppingCart size={20} className={view === 'transfers' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} />
                            <span className="text-[9px] mt-1 font-bold tracking-tight">{t.market}</span>
                        </button>

                        <button onClick={() => setView(view === 'menu' ? 'dashboard' : 'menu')} className={`flex flex-col items-center justify-center py-3 flex-1 min-w-[56px] transition-all active:scale-95 ${view === 'menu' ? 'text-emerald-400 relative' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'menu' && <div className="absolute top-0 inset-x-4 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-b-full"></div>}
                            <Menu size={20} className={view === 'menu' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} />
                            <span className="text-[9px] mt-1 font-bold tracking-tight">{t.menu || 'Menu'}</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="md:ml-64 p-4 md:p-8 pb-32 md:pb-8 relative z-10 w-full max-w-full overflow-hidden">
                {view === 'match' && activeMatch ? (
                    <MatchCenter
                        match={activeMatch} homeTeam={activeHome} awayTeam={activeAway}
                        homePlayers={gameState.players.filter(p => p.teamId === activeHome.id)}
                        awayPlayers={gameState.players.filter(p => p.teamId === activeAway.id)}
                        onSync={handleMatchSync} onFinish={handleMatchFinish} onInstantFinish={handleInstantFinish}
                        onSubstitute={handleSubstitution} onUpdateTactic={handleUpdateTactic} onAutoFix={handleAutoFix}
                        userTeamId={userTeam.id} t={t} debugLogs={debugLog} onPlayerClick={setSelectedPlayer}
                    />
                ) : view === 'match' && !activeMatch ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center max-w-sm">
                            <SkipForward size={48} className="text-slate-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">{t.noMatchToday || 'Bugün maç yok'}</h2>
                            <p className="text-slate-400 text-sm mb-6">{t.noMatchDesc || 'Panelden haftayı ilerletin veya fikstüre bakın.'}</p>
                            <button
                                onClick={() => setView('dashboard')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                            >
                                ← {t.backToDashboard || 'Panele Dön'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in w-full">
                        {/* Mobile Menu View */}
                        {view === 'menu' && (
                            <div className="flex flex-col gap-4 animate-fade-in pb-20">
                                <h1 className="text-2xl font-bold text-white mb-2 ml-1">{t.menu || 'Menu'}</h1>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setView('match')} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
                                            <SkipForward className="text-emerald-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.matchDay}</span>
                                    </button>
                                    <button onClick={() => setView('fixtures')} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                            <Calendar className="text-blue-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.fixtures}</span>
                                    </button>
                                    <button onClick={() => setView('training')} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                                            <Activity className="text-orange-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.training}</span>
                                    </button>
                                    <button onClick={() => setView('club')} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                                            <Building2 className="text-purple-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.club}</span>
                                    </button>
                                    <button onClick={() => setView('league')} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center border border-amber-500/30">
                                            <Trophy className="text-amber-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.standings}</span>
                                    </button>
                                    <button onClick={() => setView('rankings')} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center border border-cyan-500/30">
                                            <Globe className="text-cyan-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.worldRankings}</span>
                                    </button>
                                    <button onClick={() => setView('guide')} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-teal-600/20 flex items-center justify-center border border-teal-500/30">
                                            <BookOpen className="text-teal-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.gameGuide}</span>
                                    </button>
                                    <button onClick={openDerbySelector} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center border border-yellow-500/30">
                                            <Zap className="text-yellow-400" size={24} />
                                        </div>
                                        <span className="font-bold text-slate-200">{t.playFriendly}</span>
                                    </button>
                                    <button onClick={handleBackToProfiles} className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors bg-slate-900 border-slate-700">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                            <LogOut className="text-slate-400" size={20} />
                                        </div>
                                        <div className="text-center">
                                            <span className="font-bold text-slate-200 block text-xs">{t.backToProfiles}</span>
                                            <span className="text-[9px] text-slate-500">{t.saveAndExit}</span>
                                        </div>
                                    </button>

                                    <div className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square bg-slate-900 border-slate-700">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-xs font-bold text-slate-400">
                                            {lang.toUpperCase()}
                                        </div>
                                        <div className="flex gap-1 w-full">
                                            <button onClick={() => setLang('tr')} className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors border ${lang === 'tr' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>TR</button>
                                            <button onClick={() => setLang('en')} className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors border ${lang === 'en' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>EN</button>
                                        </div>
                                    </div>

                                    {/* AdMob Control (Test/Beta) */}
                                    <button 
                                        onClick={() => {
                                            if (adMobService.isBannerVisible()) {
                                                adMobService.hideBanner();
                                            } else {
                                                adMobService.showBanner();
                                            }
                                        }}
                                        className="fm-card p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                            <DollarSign className="text-blue-400" size={20} />
                                        </div>
                                        <div className="text-center">
                                            <span className="font-bold text-slate-200 block text-xs">{lang === 'tr' ? 'Reklamlar' : 'Ads'}</span>
                                            <span className="text-[9px] text-slate-500">{lang === 'tr' ? 'Aç/Kapat' : 'On/Off'}</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                        {view === 'dashboard' && (
                            <div className="flex flex-col gap-4 animate-fade-in pb-20">
                                {/* Top Row: Manager Profile & Quick Stats */}
                                <div className="fm-panel rounded-xl p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold border border-white/10 shadow-lg relative overflow-hidden" style={{ backgroundColor: userTeam.primaryColor, color: '#fff' }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                            {userTeam.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider mb-0.5">{t.managerWelcome?.split(',')[1]?.trim().split(' ')[1] || 'Manager'}</div>
                                            <h2 className="text-xl font-bold text-white leading-tight">{userTeam.name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">{t.reputation}: {userTeam.reputation}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">{t.clubBudget}</div>
                                        <div className="text-xl font-mono text-emerald-400 font-bold">€{(userTeam.budget / 1000000).toFixed(1)}M</div>
                                    </div>
                                </div>

                                {/* Inbox & Status Widget */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setView('news')} className="fm-card p-3 flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors active:scale-95 group">
                                        <div className="relative">
                                            <Mail size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                            {unreadMessages > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                            </span>}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-bold text-white">{unreadMessages}</div>
                                            <div className="text-[9px] uppercase text-slate-500 font-bold">Unread</div>
                                        </div>
                                    </button>

                                    <div className="fm-card p-3 flex flex-col items-center justify-center gap-2">
                                        <Trophy size={20} className="text-yellow-500" />
                                        <div className="text-center">
                                            <div className="text-sm font-bold text-white">3rd</div>
                                            <div className="text-[9px] uppercase text-slate-500 font-bold">{t.rank}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Next Match Card - Detailed */}
                                <div className="fm-panel rounded-xl overflow-hidden">
                                    <div className="bg-slate-900/50 p-2 border-b border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {t.nextMatch}</span>
                                        <span className="text-[10px] font-mono text-slate-500">WEEK {gameState.currentWeek}</span>
                                    </div>
                                    <div className="p-4 flex flex-col gap-4">
                                        {/* Next Match Logic with Cup Priority */}
                                        {(() => {
                                            // Helper to find priority match
                                            const getCupMatch = (cup: EuropeanCup | undefined) => {
                                                if (!cup || !cup.isActive) return null;
                                                // Cup matches schedule check is implicit in their existence in the 'matches' array for the current round?
                                                // No, matches are pre-generated. We check if there's an unplayed match for us in the current round.
                                                // AND strict check for schedule week to match Engine logic.
                                                const SCHEDULE: { [key: string]: number } = { 'ROUND_16': 7, 'QUARTER': 14, 'SEMI': 21, 'FINAL': 28 };
                                                const scheduledWeek = SCHEDULE[cup.currentRound];
                                                if (gameState.currentWeek !== scheduledWeek) return null;

                                                return cup.matches.find(m =>
                                                    !m.isPlayed && m.round === cup.currentRound &&
                                                    (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id)
                                                );
                                            };

                                            const nextCL = getCupMatch(gameState.europeanCup);
                                            const nextEL = getCupMatch(gameState.europaLeague);
                                            const nextLeague = gameState.matches.find(m => m.week === gameState.currentWeek && (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id));

                                            // Priority: CL > EL > League
                                            const nextMatch = nextCL || nextEL || nextLeague;

                                            if (!nextMatch) return (
                                                <div className="text-center text-slate-400 py-4">
                                                    {t.noMatchToday}
                                                </div>
                                            );

                                            const isCup = !!(nextCL || nextEL);
                                            const isCL = !!nextCL;
                                            const opponentId = nextMatch.homeTeamId === userTeam.id ? nextMatch.awayTeamId : nextMatch.homeTeamId;
                                            const opponent = gameState.teams.find(tm => tm.id === opponentId);

                                            return (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold text-white border ${isCup
                                                            ? (isCL ? 'bg-purple-900 border-purple-500' : 'bg-emerald-900 border-emerald-500')
                                                            : 'bg-slate-800 border-slate-700'}`}>
                                                            {isCup ? <Trophy size={18} /> : 'VS'}
                                                        </div>
                                                        <div>
                                                            <div className={`text-[10px] font-bold uppercase ${isCup
                                                                ? (isCL ? 'text-purple-400' : 'text-emerald-400')
                                                                : 'text-emerald-500'}`}>
                                                                {isCup ? (isCL ? 'CHAMPIONS LEAGUE' : 'EUROPA LEAGUE') : t.nextMatch}
                                                            </div>
                                                            <div className="text-lg font-bold text-white">
                                                                {opponent?.name || 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (isCup) {
                                                                handlePlayEuropeanCupMatch(nextMatch as EuropeanCupMatch);
                                                            } else {
                                                                startNextMatch();
                                                            }
                                                        }}
                                                        className={`px-4 py-3 rounded-lg shadow-lg transition-all active:scale-95 flex items-center gap-2 font-bold text-white
                                                            ${isCup
                                                                ? (isCL
                                                                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40'
                                                                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40')
                                                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'}`}
                                                    >
                                                        <SkipForward size={20} className="fill-current" />
                                                        <span className="hidden md:inline">{t.playNextMatch || 'Play Match'}</span>
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        {/* Quick Actions Bar */}
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button onClick={handleQuickSim} className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 py-2 rounded text-xs font-bold transition-colors">
                                                {t.simulateMatch}
                                            </button>
                                            <button onClick={() => setView('squad')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-2 rounded text-xs font-bold transition-colors">
                                                {t.tactics}
                                            </button>
                                            <button onClick={openDerbySelector} className="col-span-2 bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                                <Zap size={12} /> {t.playFriendly}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Board Confidence & Objectives */}
                                <div className="fm-panel rounded-xl p-4">
                                    <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-3 flex items-center gap-1.5"><Briefcase size={12} /> {t.boardConfidence}</h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                                            <div className="bg-emerald-500 h-full rounded-full w-[85%] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-400">85%</span>
                                    </div>

                                    <div className="space-y-2">
                                        {(userTeam.objectives || []).slice(0, 2).map(obj => (
                                            <div key={obj.id} className="flex items-center justify-between text-xs bg-slate-900/30 p-2 rounded border border-white/5">
                                                <span className="text-slate-300 truncate max-w-[70%]">{obj.description}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${obj.status === 'COMPLETED' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>{obj.status}</span>
                                            </div>
                                        ))}
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
                        {view === 'training' && <TrainingCenter team={userTeam} players={userPlayers} onSetFocus={handleSetTrainingFocus} onSetIntensity={handleSetTrainingIntensity} t={t} />}
                        {view === 'transfers' && <TransferMarket marketPlayers={gameState.players} userTeam={userTeam} onBuyPlayer={handleBuyPlayer} onPlayerClick={setSelectedPlayer} t={t} />}
                        {view === 'club' && (
                            <ClubManagement
                                team={userTeam}
                                players={userPlayers}
                                t={t}
                                onPromoteYouth={handlePromoteYouth}
                                onResign={handleResign}
                                onUpgradeStaff={handleUpgradeStaff}
                                onUpgradeFacility={handleUpgradeFacility}
                                onPlayerClick={setSelectedPlayer}
                            />
                        )}
                        {view === 'league' && (
                            <LeagueTable
                                teams={gameState.teams.filter(t => t.leagueId === viewLeagueId)}
                                allTeams={gameState.teams}
                                players={gameState.players}
                                history={gameState.history}
                                t={t}
                                onInspectTeam={setInspectedTeamId}
                                currentLeagueId={viewLeagueId}
                                onSelectLeague={setViewLeagueId}
                            />
                        )}
                        {view === 'fixtures' && <FixturesView matches={gameState.matches.map(m => ({ ...m, events: m.events || [] }))} teams={gameState.teams} players={gameState.players} currentWeek={gameState.currentWeek} t={t} userTeamId={userTeam.id} europeanCup={gameState.europeanCup} europaLeague={gameState.europaLeague} onPlayCupMatch={handlePlayEuropeanCupMatch} />}
                        {view === 'rankings' && <WorldRankings players={gameState.players} teams={gameState.teams} t={t} onPlayerClick={setSelectedPlayer} />}
                        {view === 'guide' && <GameGuide t={t} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
