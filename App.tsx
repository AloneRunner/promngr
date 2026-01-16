
import React, { useState, useEffect, useCallback } from 'react';
import { getLeagueLogo, getTeamLogo } from './logoMapping';
import { GameState, Team, Player, MatchEventType, TeamTactic, MessageType, LineupStatus, TrainingFocus, TrainingIntensity, Sponsor, Message, Match, AssistantAdvice, TeamStaff, Position, GameProfile, EuropeanCup, MatchEvent, EuropeanCupMatch } from './types';
import { generateWorld, simulateTick, processWeeklyEvents, simulateFullMatch, processSeasonEnd, initializeMatch, performSubstitution, updateMatchTactic, simulateLeagueRound, analyzeClubHealth, autoPickLineup, syncEngineLineups, getLivePlayerStamina, getSubstitutedOutPlayerIds, generateEuropeanCup, simulateEuropeanCupMatch, simulateAIEuropeanCupMatches, generateNextRound } from './services/engine';
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
import { JobOffersModal } from './components/JobOffersModal';
import { Layout } from './components/Layout';
import { TRANSLATIONS, LEAGUE_PRESETS } from './constants';
import { LayoutDashboard, Users, Trophy, SkipForward, Briefcase, CheckCircle2, Building2, ShoppingCart, Mail, RefreshCw, Globe, Activity, DollarSign, Zap, X, Target, BookOpen, UserCircle, Calendar, LogOut, Menu } from 'lucide-react';
import { adMobService } from './services/adMobService';

const TOTAL_WEEKS_PER_SEASON = 38;
const uuid = () => Math.random().toString(36).substring(2, 15);

// Yeni oyuncuya takımda benzersiz forma numarası ata
const assignJerseyNumber = (player: Player, teamPlayers: Player[]): number => {
    // Takımdaki mevcut numaraları topla
    const usedNumbers = new Set(teamPlayers.filter(p => p.id !== player.id && p.jerseyNumber).map(p => p.jerseyNumber!));

    // E�Yer oyuncunun numarası varsa ve kullanılmıyorsa, onu kullan
    if (player.jerseyNumber && !usedNumbers.has(player.jerseyNumber)) {
        return player.jerseyNumber;
    }

    // Kaleci için önce 1'i dene
    if (player.position === 'GK' && !usedNumbers.has(1)) {
        return 1;
    }

    // Forvet için popüler numaraları dene (9, 10, 11, 7)
    if (player.position === 'FWD') {
        for (const num of [9, 10, 11, 7]) {
            if (!usedNumbers.has(num)) return num;
        }
    }

    // Ortasaha için popüler numaraları dene (8, 10, 6, 7)
    if (player.position === 'MID') {
        for (const num of [8, 10, 6, 7]) {
            if (!usedNumbers.has(num)) return num;
        }
    }

    // Defans için popüler numaraları dene (4, 5, 2, 3)
    if (player.position === 'DEF') {
        for (const num of [4, 5, 2, 3]) {
            if (!usedNumbers.has(num)) return num;
        }
    }

    // Bo�Y olan ilk numarayı bul (2-99 arası)
    for (let i = 2; i <= 99; i++) {
        if (!usedNumbers.has(i)) return i;
    }

    return 99; // Fallback
};

// Mevcut kayıtlar için forma numarası migration'ı
const migrateJerseyNumbers = (gameState: GameState): GameState => {
    // Numarası olmayan oyuncu var mı kontrol et
    const needsMigration = gameState.players.some(p => !p.jerseyNumber && p.teamId !== 'FREE_AGENT');
    if (!needsMigration) return gameState;

    // Her takım için numaraları ata
    const teamIds = [...new Set(gameState.players.map(p => p.teamId).filter(id => id !== 'FREE_AGENT'))];

    const updatedPlayers = [...gameState.players];

    teamIds.forEach(teamId => {
        const teamPlayers = updatedPlayers.filter(p => p.teamId === teamId);
        const usedNumbers = new Set<number>();

        // Pozisyonlara göre sırala
        const sorted = [...teamPlayers].sort((a, b) => {
            const posOrder: Record<string, number> = { 'GK': 0, 'DEF': 1, 'MID': 2, 'FWD': 3 };
            const orderDiff = (posOrder[a.position] || 4) - (posOrder[b.position] || 4);
            if (orderDiff !== 0) return orderDiff;
            return b.overall - a.overall;
        });

        // Popüler numaralar
        const preferredNumbers: Record<string, number[]> = {
            'GK': [1, 12, 13, 25],
            'DEF': [2, 3, 4, 5, 6, 15, 23, 24],
            'MID': [6, 7, 8, 10, 14, 16, 17, 18, 20, 22],
            'FWD': [7, 9, 10, 11, 19, 21]
        };

        sorted.forEach(player => {
            // Zaten numarası varsa kullan
            if (player.jerseyNumber) {
                usedNumbers.add(player.jerseyNumber);
                return;
            }

            // Tercih edilen numaralardan dene
            const preferred = preferredNumbers[player.position] || [];
            let assigned = false;

            for (const num of preferred) {
                if (!usedNumbers.has(num)) {
                    player.jerseyNumber = num;
                    usedNumbers.add(num);
                    assigned = true;
                    break;
                }
            }

            // Bo�Y numara bul
            if (!assigned) {
                for (let num = 2; num <= 99; num++) {
                    if (!usedNumbers.has(num)) {
                        player.jerseyNumber = num;
                        usedNumbers.add(num);
                        break;
                    }
                }
            }
        });
    });

    // Free agent'lara da rastgele numara ver
    updatedPlayers.forEach(p => {
        if (p.teamId === 'FREE_AGENT' && !p.jerseyNumber) {
            p.jerseyNumber = Math.floor(Math.random() * 49) + 2; // 2-50 arası
        }
    });

    return { ...gameState, players: updatedPlayers };
};

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
    const [isResignMode, setIsResignMode] = useState(false); // Resign mode: don't reset world, just switch team
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
    const [showJobOffers, setShowJobOffers] = useState(false);

    const t = TRANSLATIONS[lang];

    // gY"� Initialize AdMob on mount
    // gY"� Initialize AdMob on mount
    useEffect(() => {
        const initAds = async () => {
            // Enable test mode during development
            // Comment out this line for production build
            // adMobService.enableTestMode();

            await adMobService.initialize();
        };
        initAds();
    }, []);

    // gY"� Control banner visibility and position based on view
    useEffect(() => {
        const handleBannerVisibility = async () => {
            if (gameState && !showProfileSelector && !showLeagueSelect && !showTeamSelect) {
                // Show banner - service handles position changes internally
                if (view === 'match') {
                    // Match screen: Banner at BOTTOM (for landscape mode)
                    await adMobService.showBanner('bottom');
                } else {
                    // All other screens: Banner at TOP
                    await adMobService.showBanner('top');
                }
            } else {
                await adMobService.hideBanner();
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
                    // Forma numaralarını migrate et
                    setGameState(migrateJerseyNumbers(profileData));
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
                    // Forma numaralarını migrate et
                    setGameState(migrateJerseyNumbers(profileData));
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

        // RESIGN MODE: Don't create new world, just show team selection for current world
        if (isResignMode && gameState) {
            // Filter teams to the selected league from existing world
            setViewLeagueId(leagueId);
            setTimeout(() => {
                setShowTeamSelect(true);
            }, 300);
            return;
        }

        // NORMAL MODE: Create new world
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

        // RESIGN MODE: Just switch userTeamId, don't regenerate European competitions
        if (isResignMode) {
            // CRITICAL: Clear old team's messages and pending offers to prevent exploit!
            setGameState(prev => prev ? {
                ...prev,
                userTeamId: teamId,
                messages: [], // Clear all messages from old team
                pendingOffers: [] // Clear pending transfer offers
            } : null);
            setShowTeamSelect(false);
            setIsResignMode(false); // Reset resign mode
            // Show welcome message for new team
            setShowWelcome(true);
            return;
        }

        let newState = { ...gameState, userTeamId: teamId };

        // Async Generate European Competitions (only for NEW games)
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
                    subject: 'gY�? Şampiyonlar Ligi Daveti!',
                    body: `${selectedTeam?.name} olarak Şampiyonlar Ligi'ne katılmaya hak kazandınız!`,
                    isRead: false, date: new Date().toISOString()
                });
            } else if (inEL) {
                newMessages.push({
                    id: uuid(), week: newState.currentWeek, type: MessageType.BOARD,
                    subject: 'gYY� UEFA Avrupa Ligi Daveti!',
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
            // Forma numaralarını migrate et
            setGameState(migrateJerseyNumbers(profileData));
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
        if (confirm(lang === 'tr' ? 'İlerleme kaydedilecek. Profil seçiciye dönmek istedi�Yinizden emin misiniz?' : 'Progress will be saved. Are you sure you want to return to profile selector?')) {
            setShowProfileSelector(true);
            setShowLeagueSelect(false);
            setShowTeamSelect(false);
            setShowWelcome(false);
            setView('dashboard');
        }
    };

    const handleAcceptJobOffer = (offer: import('./types').JobOffer) => {
        if (!gameState) return;

        // Switch to the new team, clear messages and pending offers
        setGameState(prev => prev ? {
            ...prev,
            userTeamId: offer.teamId,
            messages: [{
                id: uuid(),
                week: prev.currentWeek,
                type: MessageType.BOARD,
                subject: `gY�? ${offer.teamName}'a Ho�Y Geldiniz!`,
                body: `${offer.teamName} takımının yeni teknik direktörü olarak göreve ba�Yladınız. Haftalık maa�Yınız: �,�${offer.salary.toLocaleString()}`,
                isRead: false,
                date: new Date().toISOString()
            }],
            pendingOffers: [],
            jobOffers: [] // Clear job offers after accepting
        } : null);

        setShowJobOffers(false);
        setShowWelcome(true);
    };

    const handleResign = () => {
        if (confirm(t.resignConfirm)) {
            // RESIGN MODE: Enable resign mode, show league selection without resetting world
            setIsResignMode(true);
            setShowLeagueSelect(true);
            setShowTeamSelect(false);
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

    const handleDeleteMessage = (id: string) => {
        if (!gameState) return;
        const updatedMessages = gameState.messages.filter(m => m.id !== id);
        setGameState(prev => prev ? { ...prev, messages: updatedMessages } : null);
    };

    const handleDeleteAllRead = () => {
        if (!gameState) return;
        const updatedMessages = gameState.messages.filter(m => !m.isRead);
        setGameState(prev => prev ? { ...prev, messages: updatedMessages } : null);
    };

    const handleDeleteAll = () => {
        if (!gameState) return;
        setGameState(prev => prev ? { ...prev, messages: [] } : null);
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
        if (confirm(`${t.renewContract} for ${player.lastName}? Cost: �,�${(renewalCost / 1000).toFixed(0)}k`)) {
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

    // === BUG FIX: Handler to actually update player morale after interactions ===
    const handlePlayerMoraleChange = (playerId: string, moraleChange: number, reason: string) => {
        if (!gameState) return;

        const updatedPlayers = gameState.players.map(p => {
            if (p.id === playerId) {
                const newMorale = Math.max(0, Math.min(100, p.morale + moraleChange));

                // Add to morale history
                const history = p.moraleHistory || [];
                history.push({
                    week: gameState.currentWeek,
                    change: moraleChange,
                    reason: reason
                });

                return {
                    ...p,
                    morale: newMorale,
                    moraleHistory: history.slice(-10) // Keep last 10 entries
                };
            }
            return p;
        });

        setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
    };

    // === CONTRACT TERMINATION: Release unwanted players ===
    const handleTerminateContract = (player: Player) => {
        if (!gameState) return;
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (!userTeam) return;

        // Calculate severance: 50% of remaining contract value
        const severancePay = Math.floor(player.salary * player.contractYears * 0.5);

        if (userTeam.budget < severancePay) {
            alert(t.notEnoughFunds);
            return;
        }

        const confirmMsg = t.terminateConfirm
            ? t.terminateConfirm.replace('{name}', player.lastName).replace('{cost}', (severancePay / 1000).toFixed(0))
            : `Release ${player.lastName}? Severance pay: €${(severancePay / 1000).toFixed(0)}K`;

        if (confirm(confirmMsg)) {
            // Update team budget
            const updatedTeams = gameState.teams.map(t =>
                t.id === userTeam.id ? { ...t, budget: t.budget - severancePay } : t
            );

            // Make player a free agent
            const updatedPlayers = gameState.players.map(p =>
                p.id === player.id ? { ...p, teamId: 'FREE_AGENT', lineup: 'RESERVE' as const, lineupIndex: 99 } : p
            );

            setGameState(prev => prev ? { ...prev, teams: updatedTeams, players: updatedPlayers } : null);
            setSelectedPlayer(null);

            alert(t.playerReleased || `${player.lastName} has been released.`);
        }
    };

    const handleAutoFix = () => {
        if (!gameState) return;
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        const userPlayers = gameState.players.filter(p => p.teamId === gameState.userTeamId);
        if (!userTeam) return;

        const playersCopy = JSON.parse(JSON.stringify(userPlayers));

        // CRITICAL FIX: Get players who were substituted OUT during this match
        // These players CANNOT return to the pitch (football rule!)
        const substitutedOutIds = activeMatchId && view === 'match'
            ? getSubstitutedOutPlayerIds()
            : new Set<string>();

        // CRITICAL FIX: Get players who received RED CARDS during this match
        // These players are SENT OFF and cannot play (lineup count stays at 10!)
        let redCardedIds = new Set<string>();
        if (activeMatchId && view === 'match') {
            // Find the active match to get events
            let activeMatch = gameState.matches.find(m => m.id === activeMatchId);
            if (!activeMatch && gameState.europeanCup) {
                activeMatch = gameState.europeanCup.matches.find(m => m.id === activeMatchId);
            }
            if (!activeMatch && gameState.europaLeague) {
                activeMatch = gameState.europaLeague.matches.find(m => m.id === activeMatchId);
            }
            if (activeMatch) {
                activeMatch.events.forEach(ev => {
                    if (ev.type === MatchEventType.CARD_RED && ev.playerId) {
                        redCardedIds.add(ev.playerId);
                    }
                });
            }
        }

        // Inject LIVE STAMINA from engine if available
        if (activeMatchId && view === 'match') {
            playersCopy.forEach((p: Player) => {
                const liveStamina = getLivePlayerStamina(p.id);
                if (liveStamina !== undefined) {
                    p.condition = liveStamina;
                }
                // Mark substituted out OR red-carded players as "injured" for lineup purposes
                // This prevents autoPickLineup from selecting them
                if (substitutedOutIds.has(p.id) || redCardedIds.has(p.id)) {
                    p.weeksInjured = 99; // Temporary flag to exclude from selection
                }
            });
        }

        autoPickLineup(playersCopy, userTeam.tactic.formation);

        // Restore the temporary injury flag and apply lineup changes
        const updatedPlayers = gameState.players.map(p => {
            const fixedP = playersCopy.find((cp: Player) => cp.id === p.id);
            if (!fixedP) return p;

            // If player was substituted out, keep their current BENCH status
            if (substitutedOutIds.has(p.id)) {
                return { ...p, lineup: 'BENCH' as const, lineupIndex: 99 };
            }

            return { ...p, lineup: fixedP.lineup, lineupIndex: fixedP.lineupIndex };
        });

        const updatedTeams = gameState.teams.map(t => t.id === userTeam.id ? { ...t, tactic: { ...t.tactic, customPositions: {} } } : t);

        setGameState(prev => prev ? { ...prev, players: updatedPlayers, teams: updatedTeams } : null);
        setAssistantAdvice(null);

        if (activeMatchId && view === 'match' && gameState) {
            // Find match in league OR European cups
            let match: Match | undefined = gameState.matches.find(m => m.id === activeMatchId);
            if (!match && gameState.europeanCup) {
                match = gameState.europeanCup.matches.find(m => m.id === activeMatchId) as any;
            }
            if (!match && gameState.europaLeague) {
                match = gameState.europaLeague.matches.find(m => m.id === activeMatchId) as any;
            }

            if (match) {
                const homeP = updatedPlayers.filter(p => p.teamId === match!.homeTeamId);
                const awayP = updatedPlayers.filter(p => p.teamId === match!.awayTeamId);

                // Only sync if we have valid players for both teams
                if (homeP.length > 0 && awayP.length > 0) {
                    syncEngineLineups(homeP, awayP);
                }
            }
        }
    };

    const handleUpgradeStaff = (role: keyof TeamStaff) => {
        if (!gameState) return;
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (!userTeam) return;

        const currentLevel = userTeam.staff ? userTeam.staff[role] : 1;
        // EXPENSIVE UPGRADES: Exponential scaling - 2x more expensive
        const cost = Math.floor(100000 * Math.pow(2, currentLevel)); // Lv1→2: €200K, Lv5→6: €6.4M, Lv9→10: €102M

        if (userTeam.budget < cost) {
            alert(t.notEnoughFunds);
            return;
        }

        if (confirm(`Upgrade ${role} to level ${currentLevel + 1}? Cost: �,�${(cost / 1000).toLocaleString()}k`)) {
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

        const currentLevel = type === 'stadium' ? userTeam.facilities.stadiumLevel :
            type === 'training' ? userTeam.facilities.trainingLevel :
                userTeam.facilities.academyLevel;

        if (currentLevel >= 25) {
            alert('Maximum level reached!');
            return;
        }

        // EXPENSIVE UPGRADES: 2x more expensive than before
        // Early levels affordable, late levels VERY expensive
        const nextLevel = currentLevel + 1;
        let baseCost = 0;
        let description = '';

        if (type === 'stadium') {
            baseCost = 3000000; // €3M base (was 1.5M)
            description = 'Stadium';
        } else if (type === 'training') {
            baseCost = 2000000; // €2M base (was 1M)
            description = 'Training Ground';
        } else if (type === 'academy') {
            baseCost = 1600000; // €1.6M base (was 800K)
            description = 'Youth Academy';
        }

        // Lv9→10: Stadium ~€95M, Training ~€63M, Academy ~€50M
        const cost = Math.floor(baseCost * Math.pow(nextLevel, 1.5));

        if (userTeam.budget < cost) {
            alert(t.notEnoughFunds);
            return;
        }

        if (confirm(`Upgrade ${description} to level ${nextLevel}? Cost: �,�${(cost / 1000000).toFixed(2)}M`)) {
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

        // ========== MINIMUM SQUAD SIZE CHECK ==========
        // Cannot sell if team will have less than 14 players
        const MIN_SQUAD_SIZE = 14;
        const currentSquadSize = gameState.players.filter(p => p.teamId === gameState.userTeamId).length;
        if (currentSquadSize <= MIN_SQUAD_SIZE) {
            alert(t.cannotSellMinSquad || `Kadro minimum ${MIN_SQUAD_SIZE} oyuncuya dü�Ytü. Daha fazla satı�Y yapamazsınız!`);
            return;
        }

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
            subject: '�o. Transfer Completed',
            body: `${player.firstName} ${player.lastName} has been sold to ${buyingTeam.name} for �,�${(offer.offerAmount / 1000000).toFixed(1)}M.`,
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

        // Get current team players to check jersey numbers
        const currentTeamPlayers = gameState.players.filter(p => p.teamId === userTeam.id);
        const newJerseyNumber = assignJerseyNumber(player, currentTeamPlayers);

        // Update existing player's team instead of creating duplicate
        const updatedPlayers = gameState.players.map(p => {
            if (p.id === player.id) {
                return {
                    ...p,
                    teamId: userTeam.id,
                    isTransferListed: false,
                    lineup: 'RESERVE' as const,
                    lineupIndex: 99,
                    contractYears: 3,
                    jerseyNumber: newJerseyNumber
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
        alert(`${t.successfullySigned} ${player.lastName} for �,�${(finalPrice / 1000000).toFixed(2)}M!`);
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
        // Get current team players to check jersey numbers
        const currentTeamPlayers = gameState.players.filter(p => p.teamId === userTeam.id);
        const newJerseyNumber = assignJerseyNumber(player, currentTeamPlayers);

        const updatedPlayers = gameState.players.concat([{
            ...player,
            teamId: userTeam.id,
            lineup: 'RESERVE',
            lineupIndex: 99,
            contractYears: 5,
            isTransferListed: false,
            jerseyNumber: newJerseyNumber
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
                subject: 'gYOY Şampiyonlar Ligi Kura �?ekimi!',
                body: userQualified
                    ? 'Takımınız Şampiyonlar Ligi\'ne katılmaya hak kazandı! �?eyrek final e�Yle�Ymeleri belirlendi.'
                    : 'Şampiyonlar Ligi ba�Yladı. Maalesef takımınız bu sezon katılmaya hak kazanamadı.',
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
                description: `gY"" ${playerOut.lastName} �?️ ${playerIn.lastName} �?️`,
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
        let matchIndex = prevState.matches.findIndex(m => m.id === matchId);
        let isCupMatch = false;
        let cupType: 'europeanCup' | 'europaLeague' | null = null;

        // Search in Cups if not in League
        if (matchIndex === -1) {
            if (prevState.europeanCup) {
                matchIndex = prevState.europeanCup.matches.findIndex(m => m.id === matchId);
                if (matchIndex !== -1) {
                    isCupMatch = true;
                    cupType = 'europeanCup';
                }
            }
            if (matchIndex === -1 && prevState.europaLeague) {
                matchIndex = prevState.europaLeague.matches.findIndex(m => m.id === matchId);
                if (matchIndex !== -1) {
                    isCupMatch = true;
                    cupType = 'europaLeague';
                }
            }
        }

        if (matchIndex === -1) return prevState;

        const matchStr = isCupMatch && cupType
            ? prevState[cupType]!.matches[matchIndex]
            : prevState.matches[matchIndex];

        // Type assertion: EuropeanCupMatch is compatible with Match for simulation purposes
        const match = { ...matchStr, week: matchStr.week ?? 0, liveData: (matchStr as any).liveData } as Match;

        if (match.isPlayed) return prevState;

        // Find teams (European teams might need to be found in Cup struct or general teams list)
        // Note: European teams are usually added to gameState.teams during generation
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
                    // *** WIN BONUS PAYMENT ***
                    const userTeamId = prevState.userTeamId;
                    const isUserHome = currentMatch.homeTeamId === userTeamId;
                    const isUserAway = currentMatch.awayTeamId === userTeamId;
                    const userWon = (isUserHome && hScore > aScore) || (isUserAway && aScore > hScore);

                    let teamsWithBonus = updatedTeams;
                    if (userWon) {
                        teamsWithBonus = updatedTeams.map(t => {
                            if (t.id === userTeamId && t.sponsor?.winBonus) {
                                const bonus = t.sponsor.winBonus;
                                return {
                                    ...t,
                                    budget: t.budget + bonus,
                                    financials: {
                                        ...t.financials,
                                        lastWeekIncome: {
                                            ...(t.financials?.lastWeekIncome || { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }),
                                            winBonus: (t.financials?.lastWeekIncome?.winBonus || 0) + bonus
                                        }
                                    }
                                };
                            }
                            return t;
                        });
                    }

                    // *** BOARD CONFIDENCE UPDATE ***
                    const userTeam = teamsWithBonus.find(t => t.id === userTeamId);
                    const opponentId = isUserHome ? currentMatch.awayTeamId : currentMatch.homeTeamId;
                    const opponent = teamsWithBonus.find(t => t.id === opponentId);

                    if (userTeam && opponent) {
                        const userScore = isUserHome ? hScore : aScore;
                        const oppScore = isUserHome ? aScore : hScore;
                        const won = userScore > oppScore;
                        const drew = userScore === oppScore;

                        const repDiff = opponent.reputation - userTeam.reputation;

                        // ========== REPUTATION CHANGE ==========
                        let reputationChange = 0;
                        if (won) {
                            reputationChange = repDiff > 500 ? Math.floor(repDiff / 50) + 10 : repDiff > 0 ? 6 + Math.floor(repDiff / 100) : 3;
                        } else if (drew) {
                            reputationChange = repDiff > 500 ? 5 : repDiff < -500 ? -5 : 0;
                        } else {
                            reputationChange = repDiff < -500 ? -Math.floor(Math.abs(repDiff) / 75) - 8 : repDiff < 0 ? -5 : -2;
                        }
                        const newReputation = Math.max(1000, Math.min(10000, userTeam.reputation + reputationChange));

                        // ========== CONFIDENCE CHANGE ==========
                        let confidenceChange = 0;
                        if (won) {
                            confidenceChange = repDiff > 500 ? 6 : repDiff > 0 ? 4 : 2;
                            if (userScore - oppScore >= 3) confidenceChange += 2;
                        } else if (drew) {
                            confidenceChange = repDiff > 500 ? 1 : repDiff < -500 ? -2 : -1;
                        } else {
                            confidenceChange = repDiff < -500 ? -8 : repDiff < 0 ? -5 : -3;
                            if (oppScore - userScore >= 3) confidenceChange -= 2;
                        }

                        const recentLosses = (userTeam.recentForm || []).slice(-3).filter(r => r === 'L').length;
                        if (recentLosses >= 3) confidenceChange -= 3;

                        const newConfidence = Math.max(0, Math.min(100, (userTeam.boardConfidence || 70) + confidenceChange));

                        // ========== RECORD HISTORY ==========
                        const resultText = won ? 'G' : drew ? 'B' : 'M';
                        const score = `${userScore}-${oppScore}`;

                        const repHistory = [...(userTeam.reputationHistory || [])];
                        if (reputationChange !== 0) {
                            repHistory.push({
                                week: prevState.currentWeek,
                                change: reputationChange,
                                reason: `${opponent.name} (${resultText}) ${score}`,
                                newValue: newReputation
                            });
                        }

                        const confHistory = [...(userTeam.confidenceHistory || [])];
                        if (confidenceChange !== 0) {
                            confHistory.push({
                                week: prevState.currentWeek,
                                change: confidenceChange,
                                reason: `${opponent.name} (${resultText}) ${score}`,
                                newValue: newConfidence
                            });
                        }

                        teamsWithBonus = teamsWithBonus.map(t => {
                            if (t.id === userTeamId) {
                                return {
                                    ...t,
                                    reputation: newReputation,
                                    boardConfidence: newConfidence,
                                    reputationHistory: repHistory.slice(-20),
                                    confidenceHistory: confHistory.slice(-20)
                                };
                            }
                            return t;
                        });
                    }

                    let newMatches = [...prevState.matches];
                    newMatches[matchIndex] = currentMatch;
                    return { ...prevState, matches: newMatches, players: updatedPlayers, teams: teamsWithBonus };
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
                // Process weekly events
                const weeklyEventsResults = processWeeklyEvents(updatedState, t);
                let { updatedTeams, updatedPlayers, updatedMarket, report, offers, newPendingOffers } = weeklyEventsResults;

                // ========== HISTORY RECORDING FOR CUP MATCH (QUICK SIM) ==========
                if (cupMatch) {
                    const userTeam = updatedTeams.find(tm => tm.id === updatedState.userTeamId);
                    // Find correct opponent ID
                    const opponentId = cupMatch.homeTeamId === updatedState.userTeamId ? cupMatch.awayTeamId : cupMatch.homeTeamId;
                    const opponent = updatedTeams.find(tm => tm.id === opponentId);

                    // Get played match result from updated state
                    let playedCupMatch: EuropeanCupMatch | undefined;
                    if (clMatch && updatedState.europeanCup) playedCupMatch = updatedState.europeanCup.matches.find(m => m.id === cupMatch.id);
                    else if (elMatch && updatedState.europaLeague) playedCupMatch = updatedState.europaLeague.matches.find(m => m.id === cupMatch.id);

                    if (userTeam && opponent && playedCupMatch && playedCupMatch.isPlayed) {
                        const isUserHome = playedCupMatch.homeTeamId === userTeam.id;
                        const userScore = isUserHome ? playedCupMatch.homeScore : playedCupMatch.awayScore;
                        const oppScore = isUserHome ? playedCupMatch.awayScore : playedCupMatch.homeScore;

                        const won = userScore > oppScore;
                        const drew = userScore === oppScore;
                        const repDiff = opponent.reputation - userTeam.reputation;

                        const cupName = clMatch ? '🏆 CL' : '🏆 UEL';
                        const resultText = won ? 'G' : drew ? 'B' : 'M';
                        const scoreStr = `${userScore}-${oppScore}`;

                        let repChange = 0;
                        let confChange = 0;

                        if (won) {
                            repChange = repDiff > 500 ? 15 : repDiff > 0 ? 10 : 6;
                            confChange = repDiff > 500 ? 6 : repDiff > 0 ? 4 : 3;
                        } else if (drew) { // Should not happen in cups usually due to penalties, but just in case
                            repChange = repDiff > 500 ? 5 : repDiff < -500 ? -5 : 0;
                            confChange = repDiff > 500 ? 1 : repDiff < -500 ? -2 : -1;
                        } else {
                            repChange = repDiff < -500 ? -12 : repDiff < 0 ? -6 : -3;
                            confChange = repDiff < -500 ? -6 : repDiff < 0 ? -4 : -2;
                        }

                        const newRep = Math.max(1000, Math.min(10000, userTeam.reputation + repChange));
                        const newConf = Math.max(0, Math.min(100, (userTeam.boardConfidence || 70) + confChange));

                        const repHistory = [...(userTeam.reputationHistory || [])];
                        repHistory.push({ week: updatedState.currentWeek, change: repChange, reason: `${cupName}: ${opponent.name} (${resultText}) ${scoreStr}`, newValue: newRep });

                        const confHistory = [...(userTeam.confidenceHistory || [])];
                        confHistory.push({ week: updatedState.currentWeek, change: confChange, reason: `${cupName}: ${opponent.name} (${resultText}) ${scoreStr}`, newValue: newConf });

                        updatedTeams = updatedTeams.map(tm =>
                            tm.id === userTeam.id
                                ? { ...tm, reputation: newRep, boardConfidence: newConf, reputationHistory: repHistory.slice(-20), confidenceHistory: confHistory.slice(-20) }
                                : tm
                        );
                    }
                }

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
                    // 4. Process weekly events (Training, News, etc.)
                    const weeklyEventsResults = processWeeklyEvents(updatedState, t);
                    let { updatedTeams, updatedPlayers, updatedMarket, report, offers, newPendingOffers } = weeklyEventsResults;

                    // ========== HISTORY RECORDING FOR LEAGUE MATCH (QUICK SIM) ==========
                    if (playedMatch) {
                        const userTeamId = updatedState.userTeamId;
                        const isUserHome = playedMatch.homeTeamId === userTeamId;
                        const opponentId = isUserHome ? playedMatch.awayTeamId : playedMatch.homeTeamId;
                        const userTeam = updatedTeams.find(tm => tm.id === userTeamId);
                        const opponent = updatedTeams.find(tm => tm.id === opponentId);

                        if (userTeam && opponent) {
                            const userScore = isUserHome ? playedMatch.homeScore : playedMatch.awayScore;
                            const oppScore = isUserHome ? playedMatch.awayScore : playedMatch.homeScore;
                            const won = userScore > oppScore;
                            const drew = userScore === oppScore;
                            const repDiff = opponent.reputation - userTeam.reputation;

                            let repChange = 0;
                            if (won) {
                                repChange = repDiff > 500 ? Math.floor(repDiff / 50) + 10 : repDiff > 0 ? 6 + Math.floor(repDiff / 100) : 3;
                            } else if (drew) {
                                repChange = repDiff > 500 ? 5 : repDiff < -500 ? -5 : 0;
                            } else {
                                repChange = repDiff < -500 ? -Math.floor(Math.abs(repDiff) / 75) - 8 : repDiff < 0 ? -5 : -2;
                            }
                            const newRep = Math.max(1000, Math.min(10000, userTeam.reputation + repChange));

                            let confChange = 0;
                            if (won) {
                                confChange = repDiff > 500 ? 6 : repDiff > 0 ? 4 : 2;
                                if (userScore - oppScore >= 3) confChange += 2;
                            } else if (drew) {
                                confChange = repDiff > 500 ? 1 : repDiff < -500 ? -2 : -1;
                            } else {
                                confChange = repDiff < -500 ? -8 : repDiff < 0 ? -5 : -3;
                                if (oppScore - userScore >= 3) confChange -= 2;
                            }
                            const recentLosses = (userTeam.recentForm || []).slice(-3).filter(r => r === 'L').length;
                            if (recentLosses >= 3) confChange -= 3;
                            const newConf = Math.max(0, Math.min(100, (userTeam.boardConfidence || 70) + confChange));

                            const resultText = won ? 'G' : drew ? 'B' : 'M';
                            const scoreStr = `${userScore}-${oppScore}`;

                            const repHistory = [...(userTeam.reputationHistory || [])];
                            if (repChange !== 0) {
                                repHistory.push({ week: updatedState.currentWeek, change: repChange, reason: `${opponent.name} (${resultText}) ${scoreStr}`, newValue: newRep });
                            }

                            const confHistory = [...(userTeam.confidenceHistory || [])];
                            if (confChange !== 0) {
                                confHistory.push({ week: updatedState.currentWeek, change: confChange, reason: `${opponent.name} (${resultText}) ${scoreStr}`, newValue: newConf });
                            }

                            updatedTeams = updatedTeams.map(tm =>
                                tm.id === userTeamId
                                    ? { ...tm, reputation: newRep, boardConfidence: newConf, reputationHistory: repHistory.slice(-20), confidenceHistory: confHistory.slice(-20) }
                                    : tm
                            );
                        }
                    }

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

                    // *** WIN BONUS PAYMENT ***
                    // Check if user won and pay sponsor win bonus
                    const userTeamId = prevState.userTeamId;
                    const isUserHome = currentMatch.homeTeamId === userTeamId;
                    const isUserAway = currentMatch.awayTeamId === userTeamId;
                    const userWon = (isUserHome && hScore > aScore) || (isUserAway && aScore > hScore);

                    let teamsWithBonus = newTeams;
                    if (userWon) {
                        teamsWithBonus = newTeams.map(t => {
                            if (t.id === userTeamId && t.sponsor?.winBonus) {
                                const bonus = t.sponsor.winBonus;
                                return {
                                    ...t,
                                    budget: t.budget + bonus,
                                    financials: {
                                        ...t.financials,
                                        lastWeekIncome: {
                                            ...(t.financials?.lastWeekIncome || { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 }),
                                            winBonus: (t.financials?.lastWeekIncome?.winBonus || 0) + bonus
                                        }
                                    }
                                };
                            }
                            return t;
                        });
                    }

                    // *** BOARD CONFIDENCE UPDATE ***
                    // Update board confidence for user team based on match result
                    const userTeam = teamsWithBonus.find(t => t.id === userTeamId);
                    const opponentId = isUserHome ? currentMatch.awayTeamId : currentMatch.homeTeamId;
                    const opponent = teamsWithBonus.find(t => t.id === opponentId);

                    if (userTeam && opponent) {
                        const userScore = isUserHome ? hScore : aScore;
                        const oppScore = isUserHome ? aScore : hScore;
                        const won = userScore > oppScore;
                        const drew = userScore === oppScore;

                        const repDiff = opponent.reputation - userTeam.reputation;
                        let confidenceChange = 0;

                        if (won) {
                            confidenceChange = repDiff > 500 ? 6 : repDiff > 0 ? 4 : 2;
                            if (userScore - oppScore >= 3) confidenceChange += 2;
                        } else if (drew) {
                            confidenceChange = repDiff > 500 ? 1 : repDiff < -500 ? -2 : -1;
                        } else {
                            confidenceChange = repDiff < -500 ? -8 : repDiff < 0 ? -5 : -3;
                            if (oppScore - userScore >= 3) confidenceChange -= 2;
                        }

                        // Check consecutive losses for extra penalty
                        const recentLosses = (userTeam.recentForm || []).slice(-3).filter(r => r === 'L').length;
                        if (recentLosses >= 3) confidenceChange -= 3;

                        teamsWithBonus = teamsWithBonus.map(t => {
                            if (t.id === userTeamId) {
                                return {
                                    ...t,
                                    boardConfidence: Math.max(0, Math.min(100, (t.boardConfidence || 70) + confidenceChange))
                                };
                            }
                            return t;
                        });
                    }

                    return { ...prevState, matches: newMatches, players: updatedPlayers, teams: teamsWithBonus };
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

        // 1. Identify Match
        const match = currentState.matches.find(m => m.id === activeMatchId);

        // Check Cups if not found in League
        const clMatch = !match ? currentState.europeanCup?.matches.find(m => m.id === activeMatchId) : null;
        const elMatch = !match && !clMatch ? currentState.europaLeague?.matches.find(m => m.id === activeMatchId) : null;
        const activeCupMatch = clMatch || elMatch;

        // --- CUP MATCH HANDLING ---
        if (activeCupMatch) {
            const cupType = clMatch ? 'europeanCup' : 'europaLeague';

            // Get the latest cup match state from engine if possible
            const cupMatchInState = currentState[cupType]?.matches.find(m => m.id === activeMatchId);
            let updatedCupMatch = cupMatchInState || activeCupMatch;

            // Mark as played if not already
            if (!updatedCupMatch.isPlayed) {
                updatedCupMatch = { ...updatedCupMatch, isPlayed: true };
            }

            // ========== CUP DRAW FIX: PENALTY SHOOTOUT ==========
            // Cup matches require a winner - simulate penalties if draw
            if (updatedCupMatch.homeScore === updatedCupMatch.awayScore) {
                const homeTeam = currentState.teams.find(t => t.id === updatedCupMatch.homeTeamId);
                const awayTeam = currentState.teams.find(t => t.id === updatedCupMatch.awayTeamId);

                if (homeTeam && awayTeam) {
                    // Simulate penalties
                    let homePenalties = 0;
                    let awayPenalties = 0;

                    const homePlayers = currentState.players.filter(p => p.teamId === homeTeam.id);
                    const awayPlayers = currentState.players.filter(p => p.teamId === awayTeam.id);
                    const homeStrength = homePlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(homePlayers.length, 1);
                    const awayStrength = awayPlayers.reduce((sum, p) => sum + p.overall, 0) / Math.max(awayPlayers.length, 1);

                    for (let i = 0; i < 5; i++) {
                        if (Math.random() < 0.70 + (homeStrength - 70) / 200) homePenalties++;
                        if (Math.random() < 0.70 + (awayStrength - 70) / 200) awayPenalties++;
                    }

                    while (homePenalties === awayPenalties) {
                        if (Math.random() < 0.75) homePenalties++;
                        if (Math.random() < 0.75) awayPenalties++;
                    }

                    const winnerId = homePenalties > awayPenalties ? homeTeam.id : awayTeam.id;
                    const winnerName = homePenalties > awayPenalties ? homeTeam.name : awayTeam.name;
                    updatedCupMatch = { ...updatedCupMatch, winnerId };

                    currentState = {
                        ...currentState,
                        messages: [...currentState.messages, {
                            id: uuid(),
                            week: currentState.currentWeek,
                            type: MessageType.INFO,
                            subject: ` Penaltı Atışları!`,
                            body: `${homeTeam.name} ${updatedCupMatch.homeScore}-${updatedCupMatch.awayScore} ${awayTeam.name} (Penaltılar: ${homePenalties}-${awayPenalties}) - ${winnerName} turu geçti!`,
                            isRead: false,
                            date: new Date().toISOString()
                        }]
                    };
                }
            } else {
                // Non-draw: winner is the one with more goals
                updatedCupMatch = {
                    ...updatedCupMatch,
                    winnerId: updatedCupMatch.homeScore > updatedCupMatch.awayScore
                        ? updatedCupMatch.homeTeamId
                        : updatedCupMatch.awayTeamId
                };
            }

            // Update cup match in state
            if (currentState[cupType]) {
                const updatedCup = {
                    ...currentState[cupType],
                    matches: currentState[cupType].matches.map(m =>
                        m.id === activeMatchId ? updatedCupMatch : m
                    )
                };

                currentState = {
                    ...currentState,
                    [cupType]: updatedCup
                };
            }

            // Simulate other AI European matches
            let updatedState = { ...currentState };
            if (updatedState.europeanCup && updatedState.europeanCup.isActive) {
                const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                    updatedState.europeanCup, updatedState.teams, updatedState.players, updatedState.userTeamId, updatedState.currentWeek
                );
                updatedState = { ...updatedState, europeanCup: updatedCup, teams: updatedTeams };
            }
            if (updatedState.europaLeague && updatedState.europaLeague.isActive) {
                const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                    updatedState.europaLeague, updatedState.teams, updatedState.players, updatedState.userTeamId, updatedState.currentWeek
                );
                updatedState = { ...updatedState, europaLeague: updatedCup, teams: updatedTeams };
            }

            // ========== CUP HISTORY RECORDING ==========
            const userTeam = updatedState.teams.find(t => t.id === updatedState.userTeamId);
            const opponentId = updatedCupMatch.homeTeamId === updatedState.userTeamId
                ? updatedCupMatch.awayTeamId
                : updatedCupMatch.homeTeamId;
            const opponent = updatedState.teams.find(t => t.id === opponentId);

            if (userTeam && opponent) {
                const userIsHome = updatedCupMatch.homeTeamId === updatedState.userTeamId;
                const userScore = userIsHome ? updatedCupMatch.homeScore : updatedCupMatch.awayScore;
                const oppScore = userIsHome ? updatedCupMatch.awayScore : updatedCupMatch.homeScore;
                const won = userScore > oppScore || updatedCupMatch.winnerId === updatedState.userTeamId;

                const repDiff = opponent.reputation - userTeam.reputation;

                let repChange = 0;
                let confChange = 0;

                if (won) {
                    repChange = repDiff > 500 ? 15 : repDiff > 0 ? 10 : 6;
                    confChange = repDiff > 500 ? 6 : repDiff > 0 ? 4 : 3;
                } else {
                    repChange = repDiff < -500 ? -12 : repDiff < 0 ? -6 : -3;
                    confChange = repDiff < -500 ? -6 : repDiff < 0 ? -4 : -2;
                }

                const newRep = Math.max(1000, Math.min(10000, userTeam.reputation + repChange));
                const newConf = Math.max(0, Math.min(100, (userTeam.boardConfidence || 70) + confChange));

                const cupName = cupType === 'europeanCup' ? ' CL' : ' UEL';
                const resultText = won ? 'G' : 'M';
                const score = `${userScore}-${oppScore}`;

                const repHistory = [...(userTeam.reputationHistory || [])];
                repHistory.push({ week: updatedState.currentWeek, change: repChange, reason: `${cupName}: ${opponent.name} (${resultText}) ${score}`, newValue: newRep });

                const confHistory = [...(userTeam.confidenceHistory || [])];
                confHistory.push({ week: updatedState.currentWeek, change: confChange, reason: `${cupName}: ${opponent.name} (${resultText}) ${score}`, newValue: newConf });

                updatedState.teams = updatedState.teams.map(t =>
                    t.id === userTeam.id
                        ? { ...t, reputation: newRep, boardConfidence: newConf, reputationHistory: repHistory.slice(-20), confidenceHistory: confHistory.slice(-20) }
                        : t
                );
            }

            setGameState(updatedState);
            setView('dashboard');
            setActiveMatchId(null);
            setPendingMatch(null);
            return; // EXIT EARLY
        }

        // --- LEAGUE/FRIENDLY MATCH HANDLING ---
        if (match) {
            if (match.isFriendly) {
                if (!match.isPlayed) {
                    currentState = executeMatchUpdate(currentState, activeMatchId, true);
                }
                setGameState(currentState);
                setView('dashboard');
                setActiveMatchId(null);
                setPendingMatch(null);
                return;
            }

            if (!match.isPlayed) {
                currentState = executeMatchUpdate(currentState, activeMatchId, true);
            }
        }

        // 3. Normal League Week Simulation & Weekly Events
        let updatedState = simulateLeagueRound(currentState, currentState.currentWeek);

        if (updatedState.europeanCup && updatedState.europeanCup.isActive) {
            const { updatedCup, updatedTeams } = simulateAIEuropeanCupMatches(
                updatedState.europeanCup, updatedState.teams, updatedState.players, updatedState.userTeamId, updatedState.currentWeek
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

        const { updatedTeams, updatedPlayers, updatedMarket, report, offers, newPendingOffers } = processWeeklyEvents(updatedState, t);

        // ========== FINAL HISTORY RECORDING FOR USER LEAGUE MATCH ==========
        let teamsWithHistory = updatedTeams;

        const playedUserMatch = updatedState.matches.find(m =>
            m.id === activeMatchId && m.isPlayed
        );

        if (playedUserMatch && !playedUserMatch.isFriendly) {
            const userTeamId = updatedState.userTeamId;
            const isUserHome = playedUserMatch.homeTeamId === userTeamId;
            const opponentId = isUserHome ? playedUserMatch.awayTeamId : playedUserMatch.homeTeamId;
            const userTeam = teamsWithHistory.find(t => t.id === userTeamId);
            const opponent = teamsWithHistory.find(t => t.id === opponentId);

            if (userTeam && opponent) {
                const userScore = isUserHome ? playedUserMatch.homeScore : playedUserMatch.awayScore;
                const oppScore = isUserHome ? playedUserMatch.awayScore : playedUserMatch.homeScore;
                const won = userScore > oppScore;
                const drew = userScore === oppScore;
                const repDiff = opponent.reputation - userTeam.reputation;

                let repChange = 0;
                if (won) {
                    repChange = repDiff > 500 ? Math.floor(repDiff / 50) + 10 : repDiff > 0 ? 6 + Math.floor(repDiff / 100) : 3;
                } else if (drew) {
                    repChange = repDiff > 500 ? 5 : repDiff < -500 ? -5 : 0;
                } else {
                    repChange = repDiff < -500 ? -Math.floor(Math.abs(repDiff) / 75) - 8 : repDiff < 0 ? -5 : -2;
                }
                const newRep = Math.max(1000, Math.min(10000, userTeam.reputation + repChange));

                let confChange = 0;
                if (won) {
                    confChange = repDiff > 500 ? 6 : repDiff > 0 ? 4 : 2;
                    if (userScore - oppScore >= 3) confChange += 2;
                } else if (drew) {
                    confChange = repDiff > 500 ? 1 : repDiff < -500 ? -2 : -1;
                } else {
                    confChange = repDiff < -500 ? -8 : repDiff < 0 ? -5 : -3;
                    if (oppScore - userScore >= 3) confChange -= 2;
                }
                const recentLosses = (userTeam.recentForm || []).slice(-3).filter(r => r === 'L').length;
                if (recentLosses >= 3) confChange -= 3;
                const newConf = Math.max(0, Math.min(100, (userTeam.boardConfidence || 70) + confChange));

                const resultText = won ? 'G' : drew ? 'B' : 'M';
                const score = `${userScore}-${oppScore}`;

                const repHistory = [...(userTeam.reputationHistory || [])];
                const confHistory = [...(userTeam.confidenceHistory || [])];

                if (repChange !== 0) {
                    repHistory.push({ week: updatedState.currentWeek, change: repChange, reason: `${opponent.name} (${resultText}) ${score}`, newValue: newRep });
                }
                if (confChange !== 0) {
                    confHistory.push({ week: updatedState.currentWeek, change: confChange, reason: `${opponent.name} (${resultText}) ${score}`, newValue: newConf });
                }

                teamsWithHistory = teamsWithHistory.map(t =>
                    t.id === userTeamId
                        ? { ...t, reputation: newRep, boardConfidence: newConf, reputationHistory: repHistory.slice(-20), confidenceHistory: confHistory.slice(-20) }
                        : t
                );
            }
        }

        setGameState({
            ...updatedState,
            teams: teamsWithHistory,
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
        setPendingMatch(null);
    };

    // Show Profile Selector if requested
    if (showProfileSelector) {
        return (
            <Layout>
                <div className="w-full h-full overflow-y-auto no-scrollbar">
                    <ProfileSelector
                        profiles={profiles}
                        onSelectProfile={handleSelectProfile}
                        onCreateProfile={handleCreateProfile}
                        onDeleteProfile={handleDeleteProfile}
                        onResetProfile={handleResetProfile}
                        onRenameProfile={handleRenameProfile}
                        lang={lang}
                    />
                </div>
            </Layout>
        );
    }

    if (showLeagueSelect) {
        return (
            <Layout>
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 text-white animate-fade-in overflow-y-auto">
                    <div className="text-center mb-4 md:mb-8">
                        <div className="text-emerald-500 font-bold text-2xl md:text-4xl tracking-tighter mb-1 md:mb-2">POCKET<span className="text-white">FM</span></div>
                        <h1 className="text-lg md:text-2xl font-bold">{t.selectLeague}</h1>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full">
                        {LEAGUE_PRESETS.map(league => (
                            <button key={league.id} onClick={() => handleStartGame(league.id)} className="bg-slate-900/70 backdrop-blur-xl hover:bg-slate-800/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 md:p-6 transition-all group flex flex-col items-center gap-3 md:gap-4 shadow-2xl active:scale-95 hover:shadow-emerald-500/10">
                                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform border border-white/5">
                                    <img src={getLeagueLogo(league.id)} alt={league.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-base md:text-xl font-bold text-white leading-tight">{t[`league${league.country}` as keyof typeof t] || league.name}</h3>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    if (showTeamSelect && gameState) {
        // Filter teams by the selected league (viewLeagueId - set by handleStartGame)
        // In RESIGN mode, viewLeagueId is set to the newly selected league
        const leagueTeams = gameState.teams.filter(t => t.leagueId === viewLeagueId);
        const sortedTeams = [...leagueTeams].sort((a, b) => b.reputation - a.reputation);
        return (

            <Layout>
                <div className="w-full h-full flex flex-col items-center p-3 md:p-6 text-white animate-fade-in overflow-y-auto">
                    <div className="text-center mb-4 md:mb-8 mt-4 md:mt-10">
                        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{t.selectTeam}</h1>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 max-w-7xl w-full pb-8">
                        {sortedTeams.map(team => (
                            <button key={team.id} onClick={() => handleSelectTeam(team.id)} className="bg-slate-900/70 backdrop-blur-xl border hover:border-emerald-500/50 border-white/10 rounded-2xl overflow-hidden group transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-emerald-500/10 relative flex flex-col">
                                <div className="h-28 md:h-36 relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: team.primaryColor }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10"></div>
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-slate-900/90 backdrop-blur flex items-center justify-center z-10 shadow-2xl border border-white/10">
                                        <img src={getTeamLogo(team.name)} alt={team.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).outerHTML = `<span class="text-2xl md:text-3xl font-bold" style="color: ${team.primaryColor}">${team.name.substring(0, 1)}</span>`; }} />
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 flex-1 flex flex-col w-full bg-gradient-to-t from-slate-900 to-slate-900/80">
                                    <h3 className="text-sm md:text-base font-bold text-white mb-2 truncate text-center">{team.name}</h3>
                                    <div className="mt-auto space-y-1.5 md:space-y-2">
                                        <div className="flex justify-between text-[10px] md:text-xs border-b border-white/10 pb-1 md:pb-2">
                                            <span className="text-slate-400">{t.reputation}</span>
                                            <span className="font-bold text-white">{team.reputation}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] md:text-xs">
                                            <span className="text-slate-400">Budget</span>
                                            <span className="font-bold text-emerald-400">�,�{(team.budget / 1000000).toFixed(1)}M</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Layout>
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
        <Layout bannerPosition={view === 'match' ? 'bottom' : 'top'}>
            {!userTeam.sponsor && <SponsorModal onSelect={handleSelectSponsor} t={t} />}

            {/* Season Summary Modal */}
            {showSeasonSummary && seasonSummaryData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl p-6 md:p-8 max-w-md w-full border border-yellow-500/30 shadow-2xl text-center">
                        <div className="text-6xl mb-4">gY�?</div>
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
                            {t.startNewSeason || 'Start New Season'} �?'
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
                onTerminateContract={selectedPlayer?.teamId === userTeam.id ? handleTerminateContract : undefined}
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
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center relative z-50">
                        <div className="flex justify-center mb-6">
                            <div className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl border-2 border-white/20" style={{ backgroundColor: userTeam.primaryColor }}>
                                <img src={getTeamLogo(userTeam.name)} alt={userTeam.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).outerHTML = `<span class="text-5xl font-bold" style="color: #fff">${userTeam.name.substring(0, 1)}</span>`; }} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t.welcomeTitle}</h2>
                        <h3 className="text-xl font-bold text-emerald-400 mb-6">{userTeam.name}</h3>
                        <button onClick={() => setShowWelcome(false)} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
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

            {/* Job Offers Modal */}
            {showJobOffers && gameState && (
                <JobOffersModal
                    offers={gameState.jobOffers || []}
                    currentTeamId={gameState.userTeamId}
                    onAccept={handleAcceptJobOffer}
                    onClose={() => setShowJobOffers(false)}
                    t={t}
                />
            )}

            {/* Desktop Sidebar (Left) - Hidden on Mobile, Tablet, AND during Match */}
            {view !== 'match' && (
                <div className="hidden xl:flex fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex-col z-40 shadow-2xl">
                    <div className="p-6 border-b border-slate-800 hidden xl:block">
                        <div className="text-emerald-500 font-bold text-2xl tracking-tighter">POCKET<span className="text-white">FM</span></div>
                        {activeProfileId && profiles.find(p => p.id === activeProfileId) && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                <UserCircle size={14} />
                                <span className="truncate">{profiles.find(p => p.id === activeProfileId)?.name}</span>
                            </div>
                        )}
                    </div>
                    <nav className="flex-1 p-2 xl:p-4 space-y-2 overflow-y-auto custom-scrollbar">
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

                        {/* Job Offers Button - Only show if there are offers */}
                        {(gameState?.jobOffers?.length || 0) > 0 && (
                            <button
                                onClick={() => setShowJobOffers(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mt-2 text-purple-400 hover:bg-purple-900/30 border border-purple-500/30 font-bold transition-all hover:border-purple-500 relative"
                            >
                                <Briefcase size={20} />
                                <span className="hidden md:inline">İş Teklifleri</span>
                                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                                    {gameState?.jobOffers?.length || 0}
                                </span>
                            </button>
                        )}
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
                            <button onClick={() => setLang('es')} className={`text-xs px-2 py-1 rounded transition-colors ${lang === 'es' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>ES</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation - Glassmorphism (5 Items) */}
            {view !== 'match' && (
                <div className="xl:hidden fixed bottom-0 left-0 w-full z-50 safe-area-bottom pb-1">
                    {/* Premium Glass Background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/98 to-slate-900/95 backdrop-blur-xl border-t border-white/10"></div>

                    <div className="relative z-10 flex justify-between items-stretch px-2 pt-2">
                        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-[56px] transition-all active:scale-95 rounded-xl ${view === 'dashboard' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'dashboard' && <div className="absolute top-0 w-10 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.8)] rounded-b-full"></div>}
                            <LayoutDashboard size={24} className={view === 'dashboard' ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]' : ''} />
                            <span className="text-[10px] mt-1.5 font-bold tracking-tight">{t.dashboard}</span>
                        </button>

                        <button onClick={() => setView('squad')} className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-[56px] transition-all active:scale-95 rounded-xl ${view === 'squad' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'squad' && <div className="absolute top-0 w-10 h-1 bg-gradient-to-r from-blue-400 to-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.8)] rounded-b-full"></div>}
                            <Users size={24} className={view === 'squad' ? 'drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]' : ''} />
                            <span className="text-[10px] mt-1.5 font-bold tracking-tight">{t.squad}</span>
                        </button>

                        <button onClick={() => setView('news')} className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-[56px] transition-all active:scale-95 rounded-xl ${view === 'news' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'news' && <div className="absolute top-0 w-10 h-1 bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-[0_0_16px_rgba(34,211,238,0.8)] rounded-b-full"></div>}
                            <div className="relative">
                                <Mail size={24} className={view === 'news' ? 'drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]' : ''} />
                                {unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>}
                            </div>
                            <span className="text-[10px] mt-1.5 font-bold tracking-tight">{t.news}</span>
                        </button>

                        <button onClick={() => setView('transfers')} className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-[56px] transition-all active:scale-95 rounded-xl ${view === 'transfers' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'transfers' && <div className="absolute top-0 w-10 h-1 bg-gradient-to-r from-purple-400 to-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.8)] rounded-b-full"></div>}
                            <ShoppingCart size={24} className={view === 'transfers' ? 'drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]' : ''} />
                            <span className="text-[10px] mt-1.5 font-bold tracking-tight">{t.market}</span>
                        </button>

                        <button onClick={() => setView(view === 'menu' ? 'dashboard' : 'menu')} className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-[56px] transition-all active:scale-95 rounded-xl ${view === 'menu' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'}`}>
                            {view === 'menu' && <div className="absolute top-0 w-10 h-1 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,0.8)] rounded-b-full"></div>}
                            <Menu size={24} className={view === 'menu' ? 'drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]' : ''} />
                            <span className="text-[10px] mt-1.5 font-bold tracking-tight">{t.menu || 'Menu'}</span>
                        </button>
                    </div>
                </div>
            )}

            <div className={`relative z-10 w-full h-full overflow-y-auto no-scrollbar overscroll-none p-4 xl:p-8 pb-48 xl:pb-8 xl:pt-4 ${view !== 'match' ? 'xl:ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto min-h-full">
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
                                <h2 className="text-xl font-bold text-white mb-2">{t.noMatchToday}</h2>
                                <p className="text-slate-400">{t.noMatchInfo}</p>
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                                >
                                    {t.returnToDashboard}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in w-full">
                            {/* Mobile Menu View */}
                            {view === 'menu' && (
                                <div className="flex flex-col gap-4 animate-fade-in pb-20">
                                    <h1 className="text-2xl font-bold text-white mb-2 ml-1">{t.menu || 'Menu'}</h1>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        <button onClick={() => setView('match')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-match.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Match" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-emerald-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.matchDay}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('squad')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-squad-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Squad" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-blue-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.squad}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('training')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-training-neon.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Training" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-orange-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.training}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('club')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-shield-neon.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Club" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-purple-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.club}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('transfers')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-transfer-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Transfers" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-cyan-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.market}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('fixtures')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-fixtures-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Fixtures" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-teal-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.fixtures}</div>
                                            </div>
                                        </button >

                                        <button onClick={() => setView('league')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-league.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="League" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-amber-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.standings}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('rankings')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-rank.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Rankings" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-pink-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.worldRankings}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('news')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-news-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="News" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-red-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.news}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('guide')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-guide-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Guide" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-teal-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.gameGuide}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setLang(prev => prev === 'tr' ? 'en' : prev === 'en' ? 'es' : 'tr')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-language-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Language" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-indigo-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{lang === 'tr' ? 'TÜRKÇE' : lang === 'en' ? 'ENGLISH' : 'ESPAÑOL'}</div>
                                            </div>
                                        </button>

                                        <button onClick={openDerbySelector} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-friendly-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Friendly" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-yellow-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.playFriendly}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => adMobService.isBannerVisible() ? adMobService.hideBanner() : adMobService.showBanner()} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-ads-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Ads" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-emerald-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">ADS ON/OFF</div>
                                            </div>
                                        </button>

                                        {/* İş Teklifleri - Only show if offers exist */}
                                        {(gameState?.jobOffers?.length || 0) > 0 && (
                                            <button onClick={() => setShowJobOffers(true)} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform border-2 border-purple-500/50">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-slate-900/90"></div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                                <div className="relative z-10 mt-auto mb-3 text-center">
                                                    <div className="text-purple-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">İş Teklifleri</div>
                                                    <span className="absolute -top-8 right-2 w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                                                        {gameState?.jobOffers?.length || 0}
                                                    </span>
                                                </div>
                                            </button>
                                        )}

                                        <button onClick={handleBackToProfiles} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-exit-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Exit" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-rose-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.saveAndExit}</div>
                                            </div>
                                        </button>


                                    </div >
                                </div >
                            )}
                            {
                                view === 'dashboard' && (
                                    <div className="flex flex-col gap-4 animate-fade-in pb-20">
                                        {/* Top Row: Manager Profile & Quick Stats */}
                                        <div className="fm-panel rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-xl" style={{ backgroundColor: userTeam.primaryColor }}>
                                                    <img src={getTeamLogo(userTeam.name)} alt={userTeam.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).outerHTML = `<span class="text-2xl font-bold" style="color: #fff">${userTeam.name.substring(0, 1)}</span>`; }} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider mb-0.5">TEKNİK</div>
                                                    <h2 className="text-xl font-bold text-white leading-tight">{userTeam.name}</h2>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">{t.reputation}: {userTeam.reputation}</span>
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
                                            <button onClick={() => setView('news')} className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/10 hover:border-cyan-500/30 transition-all active:scale-95 overflow-hidden shadow-lg">
                                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="relative">
                                                    <Mail size={24} className="text-cyan-400 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                                    {unreadMessages > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                                                    </span>}
                                                </div>
                                                <div className="text-center relative z-10">
                                                    <div className="text-lg font-bold text-white">{unreadMessages}</div>
                                                    <div className="text-[10px] uppercase text-cyan-400/70 font-bold tracking-wider">UNREAD</div>
                                                </div>
                                            </button>

                                            {/* League Position Card - DYNAMIC */}
                                            {(() => {
                                                // Calculate last season position from history
                                                const lastHistory = gameState.history[gameState.history.length - 1];
                                                const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
                                                let lastPosition = '-';

                                                if (lastHistory && userTeam) {
                                                    // Check if user was champion
                                                    if (lastHistory.championId === userTeam.id) {
                                                        lastPosition = '1st';
                                                    } else {
                                                        // Check runner-up
                                                        if (lastHistory.runnerUpName === userTeam.name) {
                                                            lastPosition = '2nd';
                                                        } else {
                                                            // We don't have exact position in history, show current standing
                                                            const leagueTeams = gameState.teams.filter(t => t.leagueId === userTeam.leagueId);
                                                            const sorted = [...leagueTeams].sort((a, b) => {
                                                                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                                                                return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
                                                            });
                                                            const pos = sorted.findIndex(t => t.id === userTeam.id) + 1;
                                                            const suffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th';
                                                            lastPosition = `${pos}${suffix}`;
                                                        }
                                                    }
                                                } else if (userTeam) {
                                                    // No history yet, show current position
                                                    const leagueTeams = gameState.teams.filter(t => t.leagueId === userTeam.leagueId);
                                                    const sorted = [...leagueTeams].sort((a, b) => {
                                                        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                                                        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
                                                    });
                                                    const pos = sorted.findIndex(t => t.id === userTeam.id) + 1;
                                                    const suffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th';
                                                    lastPosition = `${pos}${suffix}`;
                                                }

                                                return (
                                                    <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/10 hover:border-yellow-500/30 transition-all overflow-hidden shadow-lg">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <Trophy size={24} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                                        <div className="text-center relative z-10">
                                                            <div className="text-lg font-bold text-white">{lastPosition}</div>
                                                            <div className="text-[10px] uppercase text-yellow-400/70 font-bold tracking-wider">{t.rank}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Next Match Card - Detailed */}
                                        <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                                            <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900/50 p-3 border-b border-white/5 flex justify-between items-center">
                                                <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-2 tracking-wider"><Calendar size={14} className="drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" /> {t.nextMatch}</span>
                                                <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">WEEK {gameState.currentWeek}</span>
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
                                                                <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center border shadow-lg ${isCup
                                                                    ? (isCL ? 'bg-purple-900 border-purple-500' : 'bg-emerald-900 border-emerald-500')
                                                                    : 'bg-slate-800 border-slate-700'}`}>
                                                                    {opponent ? (
                                                                        <img src={getTeamLogo(opponent.name)} alt={opponent.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).outerHTML = `<span class="text-lg font-bold" style="color: #fff">${opponent.name.substring(0, 1)}</span>`; }} />
                                                                    ) : (
                                                                        isCup ? <Trophy size={18} /> : 'VS'
                                                                    )}
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
                                                                <SkipForward size={20} className="mr-2" />
                                                                <span className="hidden md:inline">{t.playNextMatch}</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Quick Actions Bar */}
                                                <div className="grid grid-cols-2 gap-3 mt-2">
                                                    <button onClick={handleQuickSim} className="group relative bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 hover:from-emerald-800/50 hover:to-emerald-700/30 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-400 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 overflow-hidden shadow-lg shadow-emerald-900/20">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="relative z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">{t.simulateMatch}</span>
                                                    </button>
                                                    <button onClick={() => setView('squad')} className="group relative bg-gradient-to-r from-slate-800/80 to-slate-700/40 hover:from-slate-700/80 hover:to-slate-600/50 border border-slate-600/50 hover:border-slate-500/60 text-slate-200 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 overflow-hidden shadow-lg">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="relative z-10">{t.tactics}</span>
                                                    </button>
                                                    <button onClick={openDerbySelector} className="group col-span-2 relative bg-gradient-to-r from-yellow-900/30 to-amber-800/20 hover:from-yellow-800/40 hover:to-amber-700/30 border border-yellow-500/30 hover:border-yellow-400/50 text-yellow-400 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 overflow-hidden shadow-lg shadow-yellow-900/10">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <Zap size={16} className="relative z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> <span className="relative z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">{t.playFriendly}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Board Confidence & Objectives */}
                                        <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl">
                                            <h3 className="text-[11px] uppercase text-slate-400 font-bold mb-4 flex items-center gap-2 tracking-wider"><Briefcase size={14} className="text-purple-400 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" /> {t.boardConfidence}</h3>
                                            <div className="flex items-center gap-4 mb-5">
                                                <div className="flex-1 bg-slate-900/80 h-3 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full relative transition-all duration-500 ${(userTeam.boardConfidence || 70) >= 60
                                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                                            : (userTeam.boardConfidence || 70) >= 30
                                                                ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-[0_0_12px_rgba(234,179,8,0.6)]'
                                                                : 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse'
                                                            }`}
                                                        style={{ width: `${userTeam.boardConfidence || 70}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-bold drop-shadow-[0_0_8px] ${(userTeam.boardConfidence || 70) >= 60
                                                    ? 'text-emerald-400'
                                                    : (userTeam.boardConfidence || 70) >= 30
                                                        ? 'text-yellow-400'
                                                        : 'text-red-400 animate-pulse'
                                                    }`}>{userTeam.boardConfidence || 70}%</span>
                                            </div>

                                            <div className="space-y-2">
                                                {(userTeam.objectives || []).slice(0, 2).map(obj => (
                                                    <div key={obj.id} className="flex items-center justify-between text-sm bg-slate-900/50 backdrop-blur p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                        <span className="text-slate-300 truncate max-w-[70%]">{obj.description}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${obj.status === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 text-emerald-400 border border-emerald-700/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'bg-gradient-to-r from-slate-800/80 to-slate-700/40 text-slate-400 border border-slate-600/50'}`}>{obj.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            {
                                view === 'news' && (
                                    <NewsCenter
                                        messages={gameState.messages}
                                        pendingOffers={gameState.pendingOffers}
                                        onMarkAsRead={handleMarkAsRead}
                                        onDeleteMessage={handleDeleteMessage}
                                        onDeleteAllRead={handleDeleteAllRead}
                                        onDeleteAll={handleDeleteAll}
                                        onAcceptOffer={handleAcceptOffer}
                                        onRejectOffer={handleRejectOffer}
                                        onViewPlayer={(playerId) => {
                                            const player = gameState.players.find(p => p.id === playerId);
                                            if (player) setSelectedPlayer(player);
                                        }}
                                        t={t}
                                    />
                                )
                            }
                            {view === 'squad' && <TeamManagement team={userTeam} players={userPlayers} onUpdateTactic={handleUpdateTactic} onPlayerClick={setSelectedPlayer} onUpdateLineup={handleUpdateLineup} onSwapPlayers={handleSwapPlayers} onMovePlayer={handleMovePlayer} onAutoFix={handleAutoFix} onPlayerMoraleChange={handlePlayerMoraleChange} t={t} />}
                            {view === 'training' && <TrainingCenter team={userTeam} players={userPlayers} onSetFocus={handleSetTrainingFocus} onSetIntensity={handleSetTrainingIntensity} t={t} />}
                            {view === 'transfers' && <TransferMarket marketPlayers={gameState.players} userTeam={userTeam} onBuyPlayer={handleBuyPlayer} onPlayerClick={setSelectedPlayer} t={t} />}
                            {
                                view === 'club' && (
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
                                )
                            }
                            {
                                view === 'league' && (
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
                                )
                            }
                            {view === 'fixtures' && <FixturesView matches={gameState.matches.map(m => ({ ...m, events: m.events || [] }))} teams={gameState.teams} players={gameState.players} currentWeek={gameState.currentWeek} t={t} userTeamId={userTeam.id} europeanCup={gameState.europeanCup} europaLeague={gameState.europaLeague} onPlayCupMatch={handlePlayEuropeanCupMatch} />}
                            {view === 'rankings' && <WorldRankings players={gameState.players} teams={gameState.teams} t={t} onPlayerClick={setSelectedPlayer} />}
                            {view === 'guide' && <GameGuide t={t} />}
                        </div >
                    )}
                </div >
            </div >
        </Layout >
    );
};

export default App;
