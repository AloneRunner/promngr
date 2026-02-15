
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getLeagueLogo, getTeamLogo } from './logoMapping';
import { DERBY_RIVALS } from './src/data/teams';
import { GameState, Team, Player, MatchEventType, TeamTactic, MessageType, LineupStatus, TrainingFocus, TrainingIntensity, Sponsor, Message, Match, AssistantAdvice, TeamStaff, Position, GameProfile, EuropeanCup, MatchEvent, EuropeanCupMatch, GlobalCupMatch } from './types';
import { generateWorld, simulateTick, processWeeklyEvents, simulateFullMatch, processSeasonEnd, initializeMatch, updateMatchTactic, simulateLeagueRound, analyzeClubHealth, autoPickLineup, syncEngineLineups, getLivePlayerStamina, getSubstitutedOutPlayerIds, generateEuropeanCup, generateGlobalCup, simulateGlobalCupMatch, simulateAIGlobalCupMatches, advanceGlobalCupStage, calculateCupRewards, calculateMatchAttendance, initializeEngine, getEngineState, checkAndScheduleSuperCup, getLastLeagueWeek } from './services/engine';
import { loadAllProfiles, createProfile, loadProfileData, saveProfileData, deleteProfile, resetProfile, updateProfileMetadata, setActiveProfile, getActiveProfileId, migrateOldSave } from './services/profileManager';
import { TeamManagement } from './components/TeamManagement';
import { LeagueTable } from './components/LeagueTable';
import { MatchCenter } from './components/MatchCenter';
import { ClubManagement } from './components/ClubManagement';
import { TransferMarket } from './components/TransferMarket';
import { PlayerModal } from './components/PlayerModal';
import { NewsCenter, MessageTab } from './components/NewsCenter';
import { TrainingCenter } from './components/TrainingCenter';
import { SponsorModal } from './components/SponsorModal';
import { TeamInspector } from './components/TeamInspector';
import { AssistantReport } from './components/AssistantReport';
import { GameGuide } from './components/GameGuide';
import { FixturesView } from './components/FixturesView';
import { OpponentPreview } from './components/OpponentPreview';
import { EuropeanCupView } from './components/EuropeanCupView';
import { ProfileSelector } from './components/ProfileSelector';
import { TransferNegotiationModal } from './components/TransferNegotiationModal';
import { JobOffersModal } from './components/JobOffersModal';
import { UpdatesModal } from './components/UpdatesModal';
import { ManagerProfile } from './components/ManagerProfile';
import { GlobalHistoryModal } from './components/GlobalHistoryModal';
import { SeasonSummaryModal } from './components/SeasonSummaryModal';
import { WorldRankingsModal } from './components/WorldRankingsModal';
import { Layout } from './src/components/Layout';
import { SplashScreen } from './components/SplashScreen';
import SimulationLoadingModal from './components/SimulationLoadingModal';
import SettingsModal from './components/SettingsModal';

import { TRANSLATIONS } from './src/data/translations';
import { LEAGUE_PRESETS } from './src/data/teams';
import { LayoutDashboard, Users, Trophy, SkipForward, Briefcase, CheckCircle2, Building2, ShoppingCart, Mail, RefreshCw, Globe, Activity, DollarSign, Zap, X, Target, BookOpen, UserCircle, Calendar, LogOut, Menu, Info, Clock } from 'lucide-react';
import { adMobService } from './src/services/adMobService';
import { assignJerseyNumber, migrateJerseyNumbers, uuid } from './src/utils/playerUtils';
import { AIService } from './services/AI';
import { runTacticalAnalysis } from './src/utils/tacticalUtils';
import { useMatchSimulation } from './src/hooks/useMatchSimulation';
import { useTransferMarket } from './src/hooks/useTransferMarket';

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
    const [showSplash, setShowSplash] = useState(true);
    const [profiles, setProfiles] = useState<GameProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [showProfileSelector, setShowProfileSelector] = useState(false);

    // Game State
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [view, setView] = useState<'dashboard' | 'squad' | 'league' | 'match' | 'club' | 'transfers' | 'news' | 'training' | 'rankings' | 'guide' | 'fixtures' | 'manager'>('dashboard');
    const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
    const [lang, setLang] = useState<'tr' | 'en' | 'es' | 'fr' | 'ru' | 'id'>('tr'); // Will sync to user's league language
    const [showWelcome, setShowWelcome] = useState(false);
    const [showLeagueSelect, setShowLeagueSelect] = useState(false);
    const [showTeamSelect, setShowTeamSelect] = useState(false);
    const [isResignMode, setIsResignMode] = useState(false); // Resign mode: don't reset world, just switch team
    const [showSeasonSummary, setShowSeasonSummary] = useState(false);
    const [seasonSummaryData, setSeasonSummaryData] = useState<{ winner: Team, retired: string[], promoted: string[] } | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [inspectedTeamId, setInspectedTeamId] = useState<string | null>(null);
    const [viewLeagueId, setViewLeagueId] = useState<string>('tr'); // Will sync to user's league on load
    const [viewLeagueRegion, setViewLeagueRegion] = useState<string>('ALL'); // NEW: Region Filter State
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [offerToProcess, setOfferToProcess] = useState<Message | null>(null);
    const [assistantAdvice, setAssistantAdvice] = useState<AssistantAdvice[] | null>(null);


    const [showDerbySelect, setShowDerbySelect] = useState(false);
    const [derbyHomeId, setDerbyHomeId] = useState<string | null>(null);
    const [derbyAwayId, setDerbyAwayId] = useState<string | null>(null);
    const [showOpponentPreview, setShowOpponentPreview] = useState(false);
    const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
    const [viewingCup, setViewingCup] = useState<{ cup: EuropeanCup, name: string } | null>(null);
    // negotiatedPlayer moved to hook
    const [showJobOffers, setShowJobOffers] = useState(false);
    const [showUpdates, setShowUpdates] = useState(false);
    const [showGlobalHistory, setShowGlobalHistory] = useState(false);
    const [showWorldRankings, setShowWorldRankings] = useState(false);
    const [newsFilter, setNewsFilter] = useState<MessageTab | undefined>(undefined);

    // Performance & Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [isWeekSimulating, setIsWeekSimulating] = useState(false);
    const [simulationProgress, setSimulationProgress] = useState(0);

    // FIX: Schedule Super Cup (Week 39) dynamically
    useEffect(() => {
        if (!gameState) return;
        const newState = checkAndScheduleSuperCup(gameState);
        if (newState !== gameState) {
            setGameState(newState);
        }
    }, [gameState?.currentWeek, gameState?.matches]);

    // Show developer letter on first launch of v3.4
    useEffect(() => {
        if (!showSplash) {
            const hasSeenV34Letter = localStorage.getItem('hasSeenV34Letter');
            if (!hasSeenV34Letter) {
                setShowUpdates(true);
                localStorage.setItem('hasSeenV34Letter', 'true');
            }
        }
    }, [showSplash]);

    const t = TRANSLATIONS[lang];

    // Moved hooks to top level to avoid conditional hook execution error
    const userTeamSafe = gameState?.teams.find(t => t.id === gameState.userTeamId);

    const activeMatch = useMemo(() => {
        if (!activeMatchId || !gameState) return null;

        // Priority 1: Check Super Cup
        if (gameState.superCup?.match?.id === activeMatchId) {
            return gameState.superCup.match as unknown as Match;
        }

        // Priority 2: League Match
        const leagueMatch = gameState.matches.find(m => m.id === activeMatchId);
        if (leagueMatch) return leagueMatch;

        // Priority 3: European Cup
        if (gameState.europeanCup) {
            const groupMatch = gameState.europeanCup.groups?.flatMap(g => g.matches).find(m => m.id === activeMatchId);
            if (groupMatch) return {
                events: [],
                stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
                ...groupMatch
            } as unknown as Match;

            const knockoutMatch = gameState.europeanCup.knockoutMatches?.find(m => m.id === activeMatchId);
            if (knockoutMatch) return {
                events: [],
                stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
                ...knockoutMatch
            } as unknown as Match;
        }

        // Priority 4: Europa League (Legacy)
        if (gameState.europaLeague) {
            const groupMatch = gameState.europaLeague.groups?.flatMap(g => g.matches).find(m => m.id === activeMatchId);
            if (groupMatch) return {
                events: [],
                stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
                ...groupMatch
            } as unknown as Match;

            const knockoutMatch = gameState.europaLeague.knockoutMatches?.find(m => m.id === activeMatchId);
            if (knockoutMatch) return {
                events: [],
                stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
                ...knockoutMatch
            } as unknown as Match;
        }

        return null;
    }, [activeMatchId, gameState]);

    const activeHome = useMemo(() => activeMatch ? (gameState?.teams.find(t => t.id === activeMatch.homeTeamId) || userTeamSafe) : userTeamSafe, [activeMatch, gameState, userTeamSafe]);
    const activeAway = useMemo(() => activeMatch ? (gameState?.teams.find(t => t.id === activeMatch.awayTeamId) || userTeamSafe) : userTeamSafe, [activeMatch, gameState, userTeamSafe]);


    const handlePlaySuperCup = useCallback(() => {
        if (!gameState || !gameState.superCup || !gameState.superCup.match || gameState.superCup.isComplete) return;

        const superCupMatch = gameState.superCup.match;
        if (gameState.currentWeek < (superCupMatch.week ?? Infinity)) {
            alert(t.superCupNotYet || '🏆 Super Cup is not scheduled for this week yet.');
            return;
        }
        const homeTeam = gameState.teams.find(t => t.id === superCupMatch.homeTeamId);
        const awayTeam = gameState.teams.find(t => t.id === superCupMatch.awayTeamId);

        if (!homeTeam || !awayTeam) return;

        // Convert to Pending Match
        const match: Match = {
            ...superCupMatch,
            week: gameState.currentWeek,
            isFriendly: false,
            date: Date.now(),
            attendance: Math.min(homeTeam.facilities?.stadiumCapacity || 50000, 80000),
            currentMinute: 0,
            weather: 'Clear',
            timeOfDay: 'Night',
            stats: { homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homeXG: 0, awayXG: 0 },
            events: []
        };

        setPendingMatch(match);
        setShowOpponentPreview(true);
    }, [gameState]);

    const hookUserTeam = gameState ? gameState.teams.find(tm => tm.id === gameState.userTeamId) || null : null;

    const simulation = useMatchSimulation({
        gameState,
        setGameState,
        activeMatchId,
        setActiveMatchId,
        userTeam: hookUserTeam,
        profiles,
        activeProfileId,
        saveProfileData,
        t,
        onForcePlaySuperCup: handlePlaySuperCup
    });

    const transferMarket = useTransferMarket({ gameState, setGameState, t });

    // Background Simulation Wrapper
    const handleQuickSimWithBackground = useCallback(() => {
        if (!gameState) return;

        // Check if background simulation is enabled
        const performanceSettings = gameState.performanceSettings || {
            showAnimations: true,
            detailedStats: true,
            backgroundSimulation: true,
            autoSave: 'WEEKLY' as const
        };

        if (performanceSettings.backgroundSimulation) {
            // Start loading UI
            setIsWeekSimulating(true);
            setSimulationProgress(0);

            // Simulate progress animation
            const progressInterval = setInterval(() => {
                setSimulationProgress(prev => {
                    if (prev >= 95) return prev;
                    return prev + Math.random() * 15;
                });
            }, 200);

            // Run simulation in next tick to allow UI update
            setTimeout(() => {
                simulation.handleQuickSim();

                // Complete progress
                clearInterval(progressInterval);
                setSimulationProgress(100);

                // Close loading after brief delay
                setTimeout(() => {
                    setIsWeekSimulating(false);
                    setSimulationProgress(0);
                }, 500);
            }, 100);
        } else {
            // Direct simulation (no loading screen)
            simulation.handleQuickSim();
        }
    }, [gameState, simulation]);

    // Dynamic season length calculation based on league format
    const totalWeeks = useMemo(() => {
        if (!gameState) return 38; // Default fallback
        const userLeagueMatches = gameState.matches.filter(m => {
            const homeTeam = gameState.teams.find(t => t.id === m.homeTeamId);
            return homeTeam?.leagueId === gameState.leagueId;
        });
        if (userLeagueMatches.length === 0) return 38;
        const leagueMax = Math.max(...userLeagueMatches.map(m => m.week));
        return Math.max(38, leagueMax); // Force global calendar (38 weeks)
    }, [gameState]);

    // 📱 Initialize AdMob on mount
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

    // BACKFILL MISSING CUPS (Fix for old saves or migration issues)
    useEffect(() => {
        if (gameState && gameState.europeanCup && !gameState.europaLeague) {
            console.log('[App] Backfilling missing Global Challenge Cup...');
            // Need to ensure we don't cause infinite loop if generation fails
            const newCup = generateGlobalCup(gameState, 1);
            if (newCup) {
                setGameState(prev => prev ? { ...prev, europaLeague: newCup } : null);
            }
        }
    }, [gameState]);

    // 📱 Control banner visibility and position based on view
    const isGameActive = !!gameState; // Stable boolean to prevent effect re-running on every state tick
    useEffect(() => {
        const handleBannerVisibility = async () => {
            if (isGameActive && !showProfileSelector && !showLeagueSelect && !showTeamSelect) {
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
    }, [view, isGameActive, showProfileSelector, showLeagueSelect, showTeamSelect]);

    // Sync viewLeagueId to user's league when gameState loads
    useEffect(() => {
        if (gameState && gameState.leagueId && viewLeagueId !== gameState.leagueId) {
            setViewLeagueId(gameState.leagueId);
        }
    }, [gameState?.leagueId]);

    // Sync language to device system language
    useEffect(() => {
        const setDeviceLanguage = async () => {
            try {
                // Get device language from Capacitor
                const { Device } = await import('@capacitor/device');
                const info = await Device.getLanguageCode();
                const deviceLang = info.value.toLowerCase().split('-')[0]; // e.g., "en-US" → "en"

                // Map device language to supported languages
                const langMap: Record<string, 'tr' | 'en' | 'es' | 'fr' | 'ru' | 'id'> = {
                    'tr': 'tr',
                    'es': 'es',
                    'en': 'en',
                    'fr': 'fr',
                    'ru': 'ru',
                    'id': 'id',
                };

                const newLang = langMap[deviceLang] || 'en'; // Default to English
                if (lang !== newLang) {
                    setLang(newLang);
                }
            } catch (error) {
                console.log('Could not detect device language, using default');
            }
        };

        setDeviceLanguage();
    }, []); // Run once on mount

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
                    const migratedState = migrateJerseyNumbers(profileData);
                    setGameState(migratedState);
                    initializeEngine(migratedState);
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
                    const migratedState = migrateJerseyNumbers(profileData);
                    setGameState(migratedState);
                    initializeEngine(migratedState);
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
    // OPTIMIZATION: Debounced save (1s) and skipped during active matches to prevent IO lag.
    useEffect(() => {
        if (!gameState || !activeProfileId || activeMatchId) return;

        const timeoutId = setTimeout(() => {
            const engineState = getEngineState();
            saveProfileData(activeProfileId, { ...gameState, ...engineState }).catch(console.error);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [gameState, activeProfileId, activeMatchId]);

    // Save on background/close to reduce progress loss
    useEffect(() => {
        if (!gameState || !activeProfileId) return;

        const handleBackgroundSave = () => {
            const engineState = getEngineState();
            saveProfileData(activeProfileId, { ...gameState, ...engineState }).catch(console.error);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleBackgroundSave();
            }
        };

        window.addEventListener('pagehide', handleBackgroundSave);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('pagehide', handleBackgroundSave);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
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
            const newTeam = gameState.teams.find(t => t.id === teamId);
            const newLeagueId = newTeam?.leagueId || 'tr';

            setGameState(prev => prev ? {
                ...prev,
                userTeamId: teamId,
                leagueId: newLeagueId, // BUGFIX: Update game's leagueId to new team's league
                messages: [], // Clear all messages from old team
                pendingOffers: [] // Clear pending transfer offers
            } : null);
            setShowTeamSelect(false);
            setIsResignMode(false); // Reset resign mode
            setViewLeagueId(newLeagueId); // BUGFIX: Sync fixtures view to new league
            // Show welcome message for new team
            setShowWelcome(true);
            return;
        }

        let newState = { ...gameState, userTeamId: teamId };

        // Async Generate European Competitions (only for NEW games)
        // Async Generate European Competitions (only for NEW games)
        import('./services/engine').then(({ generateGlobalCup }) => {
            // 1. Generate Global Cup (World Championship)
            const globalCup = generateGlobalCup({ ...newState, userTeamId: teamId });

            // Check if the user qualified
            // Global Cup uses 'qualifiedTeamIds'
            const inGlobalCup = globalCup.qualifiedTeamIds.includes(teamId);

            const newMessages = [...newState.messages];

            if (inGlobalCup) {
                newMessages.push({
                    id: uuid(), week: newState.currentWeek, type: MessageType.BOARD,
                    subject: `🌍 ${t.internationalEliteCup || 'International Elite Cup'} Daveti!`,
                    body: `${selectedTeam?.name} olarak ${t.internationalEliteCup || 'International Elite Cup'} organizasyonuna katılmaya hak kazandınız!`,
                    isRead: false, date: new Date().toISOString()
                });
            }

            newState = {
                ...newState,
                europeanCup: globalCup, // GlobalCup is stored in europeanCup field for now
                europaLeague: undefined, // Deprecated
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
        if (confirm(t.returnToProfileConfirm)) {
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
                subject: t.jobWelcomeSubject.replace('{team}', offer.teamName),
                body: t.jobWelcomeBody.replace('{team}', offer.teamName).replace('{salary}', offer.salary.toLocaleString()),
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



    // ========== TACTICAL ANALYSIS TOOL (DEBUG) ==========
    // Exposed to window for user to manually verify tactical impacts
    const runTacticalAnalysis = async () => {
        if (!gameState || !gameState.teams.length) return;

        // Clone teams to not affect game state
        const teamA = JSON.parse(JSON.stringify(gameState.teams[0])); // One team
        const teamB = JSON.parse(JSON.stringify(gameState.teams[1])); // Another team

        // Find players for these teams
        const playersA = gameState.players.filter(p => p.teamId === teamA.id);
        const playersB = gameState.players.filter(p => p.teamId === teamB.id);

        const simulateScenario = (scenarioName: string, setupFn: () => void) => {
            let winsA = 0, winsB = 0, draws = 0;
            let goalsA = 0, goalsB = 0;

            // Apply tactic changes
            setupFn();

            for (let i = 0; i < 200; i++) { // 200 matches per scenario
                const match: any = {
                    id: 'sim_' + i, homeTeamId: teamA.id, awayTeamId: teamB.id,
                    homeScore: 0, awayScore: 0, events: [], stats: {}, isPlayed: false,
                    currentMinute: 0 // Reset minute
                };

                // Reset stats/form/morale that might affect result
                teamA.recentForm = []; teamB.recentForm = [];

                // Simulate
                const result = simulateFullMatch(match, teamA, teamB, playersA, playersB);

                goalsA += result.homeScore;
                goalsB += result.awayScore;
                if (result.homeScore > result.awayScore) winsA++;
                else if (result.awayScore > result.homeScore) winsB++;
                else draws++;
            }
        };

        // 1. BASELINE
        simulateScenario("BASELINE (Both Balanced 4-3-3)", () => {
            teamA.tactic = { ...teamA.tactic, formation: '4-3-3', style: 'Balanced', mentality: 'Balanced', tempo: 'Normal', width: 'Balanced' };
            teamB.tactic = { ...teamB.tactic, formation: '4-3-3', style: 'Balanced', mentality: 'Balanced', tempo: 'Normal', width: 'Balanced' };
        });

        // 2. TEMPO
        simulateScenario("TEMPO: A=Fast, B=Slow", () => {
            teamA.tactic.tempo = 'Fast';
            teamB.tactic.tempo = 'Slow';
        });

        // 3. WIDTH
        simulateScenario("WIDTH: A=Wide, B=Narrow", () => {
            teamA.tactic.width = 'Wide';
            teamB.tactic.width = 'Narrow';
        });

        // 4. STYLE (Possession vs HighPress) - SHOULD HAVE EFFECT
        simulateScenario("STYLE: A=Possession, B=HighPress (Rock-Paper-Scissors Check)", () => {
            teamA.tactic.style = 'Possession';
            teamB.tactic.style = 'HighPress';
        });

        // 5. FORMATION
        simulateScenario("FORMATION: A=4-3-3, B=5-3-2", () => {
            teamA.tactic.formation = '4-3-3';
            teamB.tactic.formation = '5-3-2';
        });
    };

    // Always expose to window
    (window as any).runTacticalAnalysis = runTacticalAnalysis;



    const handleUpdateLineup = (playerId: string, status: LineupStatus, lineupIndex?: number) => {
        if (!gameState) return;

        // CHECK AVAILABILITY
        const player = gameState.players.find(p => p.id === playerId);
        if (player && (status === 'STARTING' || status === 'BENCH')) {
            if ((player.matchSuspension || 0) > 0) {
                alert(`${player.lastName} is suspended and cannot play.`);
                return;
            }
            if ((player.weeksInjured || 0) > 0) {
                alert(`${player.lastName} is injured and cannot play.`);
                return;
            }
        }

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

        // CHECK AVAILABILITY
        const isMatchSquad = (status: LineupStatus) => status === 'STARTING' || status === 'BENCH';
        const isUnavailable = (p: Player) => (p.matchSuspension || 0) > 0 || (p.weeksInjured || 0) > 0;

        // If p1 is unavailable and moving to a match squad position (p2's position)
        if (isUnavailable(p1) && isMatchSquad(p2.lineup)) {
            alert(`${p1.lastName} is unavailable (Suspended/Injured) and cannot be selected.`);
            return;
        }
        // If p2 is unavailable and moving to a match squad position (p1's position)
        if (isUnavailable(p2) && isMatchSquad(p1.lineup)) {
            alert(`${p2.lastName} is unavailable (Suspended/Injured) and cannot be selected.`);
            return;
        }

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
        // Also clear pendingOffers when all messages are deleted
        setGameState(prev => prev ? { ...prev, messages: [], pendingOffers: [] } : null);
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

        // Inject LIVE STAMINA from engine if available
        if (activeMatchId && view === 'match') {
            // Find the active match to get events (re-using logic or ensuring we have it)
            let activeMatch: Match | undefined = gameState.matches.find(m => m.id === activeMatchId);

            // Check Cups if not found in league
            if (!activeMatch && gameState.europeanCup) {
                activeMatch = gameState.europeanCup.knockoutMatches?.find((m: GlobalCupMatch) => m.id === activeMatchId) as unknown as Match;
                if (!activeMatch && gameState.europeanCup.groups) {
                    for (const group of gameState.europeanCup.groups) {
                        const m = group.matches.find(m => m.id === activeMatchId);
                        if (m) { activeMatch = m as unknown as Match; break; }
                    }
                }
            }

            if (activeMatch) {
                activeMatch.events.forEach(ev => {
                    if (ev.type === MatchEventType.CARD_RED && ev.playerId) {
                        redCardedIds.add(ev.playerId);
                    }
                });
            }

            playersCopy.forEach((p: Player) => {
                const liveStamina = getLivePlayerStamina(p.id);
                if (liveStamina !== undefined) {
                    p.condition = liveStamina;
                }
            });
        }

        // SAFE FILTERING: Instead of modifying weeksInjured, we simply filter the available pool
        const availablePlayers = playersCopy.filter((p: Player) => {
            // 1. Exclude Substitutes (Already played)
            if (substitutedOutIds.has(p.id)) return false;
            // 2. Exclude Red Carded (Sent off)
            if (redCardedIds.has(p.id)) return false;
            // 3. Exclude Injured in Match
            // Note: activeMatch logic repeated here for safety, or we assume engine handles basic injury status
            // ideally we check real-time injury status if needed, but standard 'isInjured' check in autoPickLineup handles base injuries.
            // For LIVE injuries, we should rely on the engine's state or the events we just parsed if we want to be 100% accurate.
            // But simpler is safer:
            return true;
        });


        const maxStarters = 11 - redCardedIds.size;

        // Pass the FILTERED list to autoPick
        // autoPickLineup will only pick from 'availablePlayers'
        // We need to map the results back to the FULL player list
        // Strategy: Run autoPick on the WHOLE list but with a "ignore" list? 
        // autoPickLineup doesn't support ignore list directly in its signature.
        // BETTER APPROACH: modify the 'weeksInjured' on the COPY only, which is discarded!
        // wait, 'playersCopy' IS a deep copy (JSON.parse/stringify). 
        // So modifying p.weeksInjured HERE is actually SAFE as long as we don't save 'playersCopy' back to state directly?
        // Ah, the original code WAS doing that but then mapping back:
        // const updatedPlayers = gameState.players.map...
        // The risk was if 'playersCopy' reference leaked or if we accidentally saved the modified properties.
        // The original code was: p.weeksInjured = 99; then autoPickLineup(playersCopy...);
        // Then it reconstructed state from gameState.players + playersCopy.lineup.
        // The RISK described was "permanent injury flags". 
        // If we modify 'playersCopy', and 'autoPickLineup' modifies it further, and then we use valid properties...
        // The issue is if we accidentally save 'weeksInjured' from the copy. 
        // The original code:
        /*
        const updatedPlayers = gameState.players.map(p => {
            const fixedP = playersCopy.find((cp: Player) => cp.id === p.id);
            ...
            return { ...p, lineup: fixedP.lineup, lineupIndex: fixedP.lineupIndex }; // ONLY copies lineup info
        });
        */
        // This looks safe strictly speaking IF 'weeksInjured' isn't copied. 
        // But to be 100% safe and explicit: let's use a specialized 'excludedIds' set if autoPick supports it, 
        // OR just ensure we don't rely on the copy for anything other than lineup positions.

        // Let's stick to the "Modify Copy" approach but add comments ensuring safety, 
        // OR better: Filter the list passed to autoPickLineup.

        // Converting RED CARDED / SUBBED OUT players to "Unavailable" in the copy is the most robust way to ensure autoPick ignores them.

        if (activeMatchId && view === 'match') {
            // Find active match for injuries
            let activeMatch: Match | undefined = gameState.matches.find(m => m.id === activeMatchId);
            if (!activeMatch && gameState.europeanCup) {
                activeMatch = gameState.europeanCup.knockoutMatches?.find((m: GlobalCupMatch) => m.id === activeMatchId) as unknown as Match;
                if (!activeMatch && gameState.europeanCup.groups) {
                    for (const group of gameState.europeanCup.groups) {
                        const m = group.matches.find(m => m.id === activeMatchId);
                        if (m) { activeMatch = m as unknown as Match; break; }
                    }
                }
            }

            playersCopy.forEach((p: Player) => {
                const isInjuredInMatch = activeMatch?.events.some(ev => ev.type === MatchEventType.INJURY && ev.playerId === p.id);

                if (substitutedOutIds.has(p.id) || redCardedIds.has(p.id) || isInjuredInMatch) {
                    // SAFE MODIFICATION: This is a COPY. We only use this to guide the auto-picker.
                    // We DO NOT save this 'weeksInjured' value back to the real state.
                    p.weeksInjured = 100; // Flag as unavailable for this specific calculation
                }
            });
        }

        autoPickLineup(playersCopy, userTeam.tactic.formation, undefined, undefined, undefined, maxStarters);

        const updatedPlayers = gameState.players.map(p => {
            const fixedP = playersCopy.find((cp: Player) => cp.id === p.id);
            if (!fixedP) return p;

            // PRESERVE REAL STATE: match the original player, only update LINEUP positions
            // If player was substituted out, force them to BENCH in the UI (visual only) or keep as is?
            // Actually, if they are subbed out, they should effectively be "Bench" or "Out" for the rest of the sim.

            if (substitutedOutIds.has(p.id)) {
                // Keep as BENCH/OUT of active play
                return { ...p, lineup: 'BENCH' as const, lineupIndex: 99 };
            }

            // ONLY copy lineup properties. NEVER copy weeksInjured from the temporary copy.
            return {
                ...p,
                lineup: fixedP.lineup,
                lineupIndex: fixedP.lineupIndex,
                // Explicitly preserve original injury status to be safe
                weeksInjured: p.weeksInjured
            };
        });

        const updatedTeams = gameState.teams.map(t => t.id === userTeam.id ? { ...t, tactic: { ...t.tactic, customPositions: {} } } : t);

        setGameState(prev => prev ? { ...prev, players: updatedPlayers, teams: updatedTeams } : null);
        setAssistantAdvice(null);

        if (activeMatchId && view === 'match' && gameState) {
            // Find match in league OR European cups
            // Find match in league OR European cups
            // FIX: Correctly finding match in Groups/Knockouts
            let match: Match | undefined = gameState.matches.find(m => m.id === activeMatchId);

            if (!match && gameState.europeanCup) {
                // Check Knockouts
                match = gameState.europeanCup.knockoutMatches?.find((m: GlobalCupMatch) => m.id === activeMatchId) as unknown as Match;
                // Check Groups
                if (!match && gameState.europeanCup.groups) {
                    for (const group of gameState.europeanCup.groups) {
                        const m = group.matches.find(m => m.id === activeMatchId);
                        if (m) {
                            match = m as unknown as Match;
                            break;
                        }
                    }
                }
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
        const cost = Math.floor(100000 * Math.pow(1.5, currentLevel)); // Lv1→2: €150K, Lv10: ~€5.7M (Reasonable)

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

        const currentLevel = type === 'stadium' ? userTeam.facilities.stadiumLevel :
            type === 'training' ? userTeam.facilities.trainingLevel :
                userTeam.facilities.academyLevel;

        if (currentLevel >= 25) {
            alert('Maximum level reached!');
            return;
        }

        // ========== BALANCED UPGRADE COSTS ==========
        let baseCost = 0;
        let nextLevel = 0;
        let description = '';

        if (type === 'stadium') {
            nextLevel = userTeam.facilities.stadiumLevel + 1;
            baseCost = 200000;  // €200K base
            description = 'Stadium Expansion';

            // Check if already under construction
            if (userTeam.facilities.stadiumConstructionWeeks && userTeam.facilities.stadiumConstructionWeeks > 0) {
                alert(`Stadium is currently under construction! (${userTeam.facilities.stadiumConstructionWeeks} weeks remaining)`);
                return;
            }
        } else if (type === 'training') {
            nextLevel = userTeam.facilities.trainingLevel + 1;
            baseCost = 300000; // €300K base
            description = 'Training Ground';

            if (userTeam.facilities.trainingConstructionWeeks && userTeam.facilities.trainingConstructionWeeks > 0) {
                alert(`Training Ground is currently under construction! (${userTeam.facilities.trainingConstructionWeeks} weeks remaining)`);
                return;
            }
        } else if (type === 'academy') {
            nextLevel = userTeam.facilities.academyLevel + 1;
            baseCost = 250000; // €250K base
            description = 'Youth Academy';

            if (userTeam.facilities.academyConstructionWeeks && userTeam.facilities.academyConstructionWeeks > 0) {
                alert(`Youth Academy is currently under construction! (${userTeam.facilities.academyConstructionWeeks} weeks remaining)`);
                return;
            }
        }

        // Linear progression with slight exponential at higher levels
        // Level 1→2: Stadium ~€600K, Level 10→11: ~€4M, Level 20→21: ~€12M, Level 24→25: ~€20M
        const levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
        const cost = Math.floor(baseCost * levelMultiplier * (1 + nextLevel * 0.05));

        if (userTeam.budget < cost) {
            alert(t.notEnoughFunds);
            return;
        }
        // Construction Time Logic
        let constructionWeeks = 0;
        let constructionMessage = '';

        // Logic for all facilities
        if (nextLevel <= 5) constructionWeeks = 5;       // ~1 month
        else if (nextLevel <= 15) constructionWeeks = 12; // ~3 months
        else constructionWeeks = 24;                     // ~6 months

        constructionMessage = `\n\n🚧 CONSTRUCTION REQUIRED 🚧\nDuration: ${constructionWeeks} Weeks\nFacility level will increase after construction is complete.`;

        if (confirm(`Upgrade ${description} to level ${nextLevel}? Cost: €${(cost / 1000000).toFixed(2)}M${constructionMessage}`)) {
            const updatedTeams = gameState.teams.map(team => {
                if (team.id === userTeam.id) {
                    const newFacilities = { ...team.facilities };
                    if (type === 'stadium') {
                        // START CONSTRUCTION: Do NOT increase level/capacity yet
                        newFacilities.stadiumConstructionWeeks = constructionWeeks;
                    } else if (type === 'training') {
                        // START CONSTRUCTION
                        newFacilities.trainingConstructionWeeks = constructionWeeks;
                    } else if (type === 'academy') {
                        // START CONSTRUCTION
                        newFacilities.academyConstructionWeeks = constructionWeeks;
                    }
                    return { ...team, budget: team.budget - cost, facilities: newFacilities };
                }
                return team;
            });
            setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);

            alert(`Construction started! Expected completion in ${constructionWeeks} weeks.`);
        }
    };

    const handleDowngradeFacility = (type: 'stadium' | 'training' | 'academy') => {
        if (!gameState) return;
        const currentTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (!currentTeam) return;

        // Demolition/Restructuring cost: €50,000 flat fee
        const cost = 50000;

        if (currentTeam.budget < cost) {
            alert(t.notEnoughFunds);
            return;
        }

        const updatedTeams = gameState.teams.map(t => {
            if (t.id === gameState.userTeamId) {
                const newFacilities = { ...t.facilities };

                if (type === 'stadium' && newFacilities.stadiumLevel > 1) {
                    newFacilities.stadiumLevel -= 1;
                    newFacilities.stadiumCapacity -= 2500; // Lose capacity
                } else if (type === 'training' && newFacilities.trainingLevel > 1) {
                    newFacilities.trainingLevel -= 1;
                } else if (type === 'academy' && newFacilities.academyLevel > 1) {
                    newFacilities.academyLevel -= 1;
                }

                return { ...t, facilities: newFacilities, budget: t.budget - cost };
            }
            return t;
        });

        setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);
    };

    // Offer logic migrated to useTransferMarket hook

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

        // === SUPER CUP PRIORITY CHECK ===
        const userInSuperCup = gameState.superCup?.match?.homeTeamId === gameState.userTeamId ||
            gameState.superCup?.match?.awayTeamId === gameState.userTeamId;

        const superCupWeek = gameState.superCup?.match?.week ?? Infinity;
        if (gameState.superCup && !gameState.superCup.isComplete && userInSuperCup && !gameState.superCup?.match?.isPlayed && gameState.currentWeek >= superCupWeek) {
            // Redirect to Super Cup match
            handlePlaySuperCup();
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
            const lastLeagueWeek = getLastLeagueWeek(gameState.matches);
            // Season ends at max(40, lastLeagueWeek + 1) - Super Cup is always week 39
            const seasonEndWeek = Math.max(40, lastLeagueWeek + 1);
            if (gameState.currentWeek >= seasonEndWeek) {
                // === FIX: Check if Super Cup needs to be played first ===
                const userInSuperCup = gameState.superCup?.match?.homeTeamId === gameState.userTeamId ||
                    gameState.superCup?.match?.awayTeamId === gameState.userTeamId;
                if (gameState.superCup && !gameState.superCup.isComplete && userInSuperCup) {
                    alert(t.superCupMustPlay || '🏆 You must play the Super Cup before the season ends!');
                    handlePlaySuperCup();
                    return;
                }
                prepareSeasonEnd();
            } else {
                alert(t.noMatches);
                handleMatchFinish();
            }
        }
    };

    const confirmStartMatch = useCallback(() => {
        if (!gameState || !pendingMatch) return;

        // === AI TACTICAL ADAPTATION ===
        // Analyze opponent before match starts
        const opponentId = pendingMatch.homeTeamId === gameState.userTeamId ? pendingMatch.awayTeamId : pendingMatch.homeTeamId;
        const opponent = gameState.teams.find(t => t.id === opponentId);
        const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);

        let updatedTeams = gameState.teams;

        if (opponent && userTeam) {
            // AI analyzes user team to pick best counter tactic
            const adaptedTactic = AIService.analyzeOpponent(opponent, userTeam.tactic, userTeam.reputation);


            // Apply new tactic to opponent
            updatedTeams = gameState.teams.map(t =>
                t.id === opponent.id ? { ...t, tactic: adaptedTactic } : t
            );

            // FIX: Also ensure USER team uses the SELECTED tactic from UI, not just database state
            // Although simulation uses 'userTeam.tactic', we want to be sure any UI overrides apply
            // (Assuming UI updates gameState.teams[user].tactic before this function is called)

            // Update state with new tactics immediately so simulation uses it
            setGameState(prev => prev ? { ...prev, teams: updatedTeams } : null);
        }

        // Proceed with match start using the potentially updated teams
        // Note: simulation.confirmStartMatch likely uses the *current* state ref, 
        // so we might need to ensure it picks up the latest teams or pass them explicitly.
        // For now, we update the state first.

        simulation.confirmStartMatch(pendingMatch.id);

        setShowOpponentPreview(false);
        setPendingMatch(null);
        setView('match');
        setDebugLog([]);
    }, [gameState, pendingMatch, simulation]);



    const prepareSeasonEnd = () => {
        if (!gameState) return;

        let tempState = { ...gameState };

        // === SUPER CUP AI SIMULATION (Dynamic) ===
        // If it exists, hasn't been played, and it's time
        const scWeek = tempState.superCup?.match?.week ?? Infinity;
        if (tempState.superCup && !tempState.superCup.match.isPlayed && tempState.currentWeek >= scWeek) {
            const scMatch = tempState.superCup.match;
            const userInvolved = scMatch.homeTeamId === tempState.userTeamId || scMatch.awayTeamId === tempState.userTeamId;

            // If AI vs AI, simulate it now ensuring we have a result for coefficients/history
            if (!userInvolved) {
                const home = tempState.teams.find(t => t.id === scMatch.homeTeamId)!;
                const away = tempState.teams.find(t => t.id === scMatch.awayTeamId)!;
                const homeP = tempState.players.filter(p => p.teamId === home.id);
                const awayP = tempState.players.filter(p => p.teamId === away.id);

                // Simulate
                const result = simulateFullMatch(scMatch as any, home, away, homeP, awayP);
                result.isPlayed = true;
                // week is already set in generateSuperCup

                // Update
                tempState = {
                    ...tempState,
                    superCup: { ...tempState.superCup, match: result }
                };
            }
        }

        // AUTO-SIMULATE REMAINDER OF GLOBAL SEASON
        // Ensure other leagues (like La Liga with 38 weeks) finish even if user (Super Lig 34 weeks) finishes early.
        const allMatches = tempState.matches;
        const lastLeagueWeek = getLastLeagueWeek(allMatches);
        const lastWeek = Math.max(lastLeagueWeek, (tempState.superCup?.match?.week ?? 0), ...allMatches.map(m => m.week));

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

    const handleStartNewSeason = async () => {
        if (!gameState) return;
        const { newState } = processSeasonEnd(gameState);

        // Generate European competitions for new season
        // Generate European competitions for new season
        // Generate European competitions for new season (Global Cup)
        const { generateEuropeanCup } = await import('./services/engine');

        const cl = generateEuropeanCup(newState, 0); // Tier 0 = Champions League
        const el = generateEuropeanCup(newState, 1); // Tier 1 = Europa League

        const finalState = {
            ...newState,
            europeanCup: cl,
            europaLeague: el,
            superCup: undefined
        };

        // Check if user qualified for cups
        const userInCL = cl.qualifiedTeamIds.includes(newState.userTeamId);

        let cupSubject = '';
        let cupMessage = '';
        if (userInCL) {
            cupSubject = `🏆 ${t.internationalEliteCup || 'International Elite Cup'} Daveti!`;
            cupMessage = `Tebrikler! ${newState.userTeamId ? newState.teams.find(t => t.id === newState.userTeamId)?.name : 'Takımınız'} olarak yeni sezonda ${t.internationalEliteCup || 'International Elite Cup'} organizasyonuna katılmaya hak kazandınız!`;
        }

        if (cupMessage) {
            finalState.messages = [{
                id: Math.random().toString(36).substring(2, 15),
                week: 1,
                type: 'board' as any,
                subject: cupSubject,
                body: cupMessage,
                isRead: false,
                date: new Date().toISOString()
            }, ...finalState.messages];
        }

        setGameState(finalState);
        alert(`${t.startNewSeason}: ${gameState.currentSeason + 1}`);
        setShowSeasonSummary(false);
        setView('dashboard');
    };


    // Transfer logic migrated to useTransferMarket hook

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
        setViewingCup(null);
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
                subject: t.clDrawSubject,
                body: userQualified
                    ? t.clDrawQualifiedBody
                    : t.clDrawNotQualifiedBody,
                isRead: false,
                date: new Date().toISOString()
            }]
        });

        setViewingCup({ cup, name: t.internationalEliteCup || 'International Elite Cup' });
    };






    const handleSubstitution = useCallback((p1Id: string, p2Id: string) => {
        if (!activeMatchId || !gameState) return;
        const p1 = gameState.players.find(p => p.id === p1Id);
        if (!p1) return;
        simulation.performSubstitution(activeMatchId, p1, p2Id);
    }, [activeMatchId, gameState, simulation]); const handleMatchFinish = useCallback(async () => {
        await simulation.handleMatchFinish();
        setView('dashboard');
    }, [simulation]);


    // Show Profile Selector if requested

    // Game Over Check
    if (gameState && gameState.isGameOver) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-700">
                    <div className="w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/50 animate-pulse">
                        <LogOut size={48} className="text-red-500" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2">{t.gameOver || 'GAME OVER'}</h1>
                    <p className="text-red-400 font-bold text-lg mb-6 uppercase tracking-widest">{gameState.gameOverReason === 'FIRED' ? (t.fired || 'YOU HAVE BEEN SACKED!') : gameState.gameOverReason}</p>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 mb-8 text-slate-300 text-sm leading-relaxed">
                        {t.firedMessage || 'The board has lost confidence in your ability to manage the club. Security will escort you out of the building immediately.'}
                    </div>

                    <button
                        onClick={() => {
                            setGameState(null);
                            setShowProfileSelector(true);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} />
                        {t.returnToMenu || 'Return to Menu'}
                    </button>
                </div>
            </div>
        );
    }

    if (showProfileSelector) {

        // ========== TACTICAL ANALYSIS TOOL (DEBUG) ==========
        // Expose to window for user to run
        // (window as any).runTacticalAnalysis = () => runTacticalAnalysis(gameState, simulateFullMatch);

        return (
            <Layout>
                {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
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
                {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
                <div className="w-full h-full flex flex-col items-center justify-start p-4 md:p-6 text-white animate-fade-in overflow-y-auto">
                    <div className="text-center mb-4 md:mb-8 mt-10">
                        <div className="text-emerald-500 font-bold text-2xl md:text-4xl tracking-tighter mb-1 md:mb-2">POCKET<span className="text-white">FM</span></div>
                        <h1 className="text-lg md:text-2xl font-bold">{t.selectLeague}</h1>
                    </div>

                    {/* Region Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6 w-full max-w-4xl px-2">
                        {['ALL', 'EUROPE', 'AMERICAS', 'AFRICA', 'ASIA'].map((region) => (
                            <button
                                key={region}
                                onClick={() => setViewLeagueRegion(region)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${viewLeagueRegion === region
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                {region === 'ALL' ? t.all || 'All' : region}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full pb-10">
                        {LEAGUE_PRESETS
                            .filter(league => {
                                if (viewLeagueRegion === 'ALL') return true;
                                const map: Record<string, string> = {
                                    'tr': 'EUROPE', 'en': 'EUROPE', 'es': 'EUROPE', 'it': 'EUROPE', 'fr': 'EUROPE', 'de': 'EUROPE',
                                    'pt': 'EUROPE', 'nl': 'EUROPE', 'be': 'EUROPE', 'ro': 'EUROPE', 'sco': 'EUROPE', 'at': 'EUROPE',
                                    'ch': 'EUROPE', 'gr': 'EUROPE', 'hr': 'EUROPE', 'rs': 'EUROPE', 'cz': 'EUROPE', 'pl': 'EUROPE', 'ru': 'EUROPE',
                                    'ng': 'AFRICA', 'dz': 'AFRICA', 'ma': 'AFRICA', 'eg': 'AFRICA', 'tn': 'AFRICA', 'za': 'AFRICA',
                                    'gh': 'AFRICA', 'sn': 'AFRICA', 'ci': 'AFRICA', 'ke': 'AFRICA',
                                    'br': 'AMERICAS', 'ar': 'AMERICAS', 'us': 'AMERICAS', 'na': 'AMERICAS', 'mx': 'AMERICAS',
                                    'cl': 'AMERICAS', 'co': 'AMERICAS', 'uy': 'AMERICAS', 'cr': 'AMERICAS', 'py': 'AMERICAS',
                                    'ec': 'AMERICAS', 'car': 'AMERICAS',
                                    'id': 'ASIA', 'sa': 'ASIA', 'jp': 'ASIA', 'kr': 'ASIA', 'in': 'ASIA', 'my': 'ASIA',
                                    'cn': 'ASIA', 'au': 'ASIA'
                                };
                                return map[league.id] === viewLeagueRegion;
                            })
                            .map(league => (
                                <button key={league.id} onClick={() => handleStartGame(league.id)} className="bg-slate-900/70 backdrop-blur-xl hover:bg-slate-800/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 md:p-6 transition-all group flex flex-col items-center gap-3 md:gap-4 shadow-2xl active:scale-95 hover:shadow-emerald-500/10">
                                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform border border-white/5">
                                        {(league.logo || getLeagueLogo(league.id)) ? (
                                            <img src={league.logo || getLeagueLogo(league.id)} alt={league.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 p-2">
                                                <span className="text-3xl font-black text-white/20 select-none">LG</span>
                                                <span className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider text-center drop-shadow-lg">
                                                    {league.id === 'en' ? 'ENG' :
                                                        league.id === 'es' ? 'ESP' :
                                                            league.id === 'de' ? 'GER' :
                                                                league.id === 'it' ? 'ITA' :
                                                                    league.id === 'fr' ? 'FRA' :
                                                                        league.id === 'tr' ? 'TUR' :
                                                                            league.country.substring(0, 3).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-base md:text-xl font-bold text-white leading-tight">{league.flag} {t[`league${league.country}` as keyof typeof t] || league.name}</h3>
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
                {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
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
                                        {getTeamLogo(team.name) ? (
                                            <img
                                                src={getTeamLogo(team.name)}
                                                alt={team.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement!.innerText = team.name.substring(0, 1);
                                                    (e.target as HTMLImageElement).parentElement!.className = "w-full h-full flex items-center justify-center text-4xl font-bold text-white";
                                                }}
                                            />
                                        ) : (
                                            <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                                                {team.name.substring(0, 1)}
                                            </span>
                                        )}
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
                                            <span className="text-slate-400">{t.clubBudget}</span>
                                            <span className="font-bold text-emerald-400">€{(team.budget / 1000000).toFixed(1)}M</span>
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


    // Guard: If logic fails to find teams (e.g. ghost match), ensure we don't pass null/undefined downstream
    if (activeMatchId && activeMatch && (!activeHome || !activeAway)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
                {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
                <div className="text-xl text-red-400 mb-4">Match Data Error</div>
                <p className="text-slate-400 mb-6">Could not load teams for match ID: {activeMatch.id}</p>
                <button onClick={() => setView('dashboard')} className="px-6 py-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <Layout bannerPosition={view === 'match' ? 'bottom' : 'top'}>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
            {!userTeam.sponsor && <SponsorModal onSelect={handleSelectSponsor} t={t} />}

            {/* Season Summary Modal */}
            {
                showSeasonSummary && seasonSummaryData && (
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
                                {t.startNewSeason || 'Start New Season'} ➡️
                            </button>
                        </div>
                    </div>
                )
            }

            {transferMarket.negotiatingPlayer && <TransferNegotiationModal player={transferMarket.negotiatingPlayer} userTeam={userTeam} onClose={() => transferMarket.setNegotiatingPlayer(null)} onComplete={transferMarket.handleTransferComplete} t={t} />}
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

            {
                offerToProcess && offerToProcess.data && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-slate-900 border border-emerald-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl relative z-50">
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><DollarSign className="text-emerald-400" /> {t.offerReceived}</h2>
                            <p className="text-slate-300 mb-6">{offerToProcess.body}</p>
                            <div className="flex gap-4">
                                <button onClick={() => offerToProcess.data?.offerId && transferMarket.handleAcceptOffer(offerToProcess.data.offerId as string)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg">{t.acceptOffer}</button>
                                <button onClick={() => offerToProcess.data?.offerId && transferMarket.handleRejectOffer(offerToProcess.data.offerId as string)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">{t.rejectOffer}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDerbySelect && (
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
                )
            }

            {
                showWelcome && userTeam && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center relative z-50">
                            <div className="flex justify-center mb-6">
                                <div className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl border-2 border-white/20" style={{ backgroundColor: userTeam.primaryColor || '#64748b' }}>
                                    <img
                                        src={getTeamLogo(userTeam.name || '')}
                                        alt={userTeam.name || 'Team'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const fallbackInitial = (userTeam?.name || 'T')[0];
                                            (e.target as HTMLImageElement).outerHTML = `<span class="text-5xl font-bold" style="color: #fff">${fallbackInitial}</span>`;
                                        }}
                                    />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">{t.welcomeTitle}</h2>
                            <h3 className="text-xl font-bold text-emerald-400 mb-6">{userTeam.name || 'Team'}</h3>
                            <button onClick={() => setShowWelcome(false)} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                <Briefcase size={20} /> {t.signContract}
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Opponent Preview Modal */}
            {
                showOpponentPreview && pendingMatch && (() => {
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
                })()
            }

            {/* European Cup Modal (Generic for both Elite and Challenge) */}
            {
                viewingCup && (
                    <EuropeanCupView
                        cup={viewingCup.cup}
                        teams={gameState.teams}
                        userTeamId={userTeam.id}
                        t={t}
                        onPlayMatch={handlePlayEuropeanCupMatch}
                        onClose={() => setViewingCup(null)}
                        cupName={viewingCup.name}
                    />
                )
            }

            {/* Job Offers Modal */}
            {
                showJobOffers && gameState && (
                    <JobOffersModal
                        offers={gameState.jobOffers || []}
                        currentTeamId={gameState.userTeamId}
                        onAccept={handleAcceptJobOffer}
                        onClose={() => setShowJobOffers(false)}
                        t={t}
                    />
                )
            }

            {/* Desktop Sidebar (Left) - Hidden on Mobile, Tablet, AND during Match */}
            {
                view !== 'match' && (
                    <div className="hidden 2xl:flex fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex-col z-40 shadow-2xl">
                        <div className="p-6 border-b border-slate-800 hidden 2xl:block">
                            <div className="text-emerald-500 font-bold text-2xl tracking-tighter">POCKET<span className="text-white">FM</span></div>
                            {activeProfileId && profiles.find(p => p.id === activeProfileId) && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                    <UserCircle size={14} />
                                    <span className="truncate">{profiles.find(p => p.id === activeProfileId)?.name}</span>
                                </div>
                            )}
                        </div>
                        <nav className="flex-1 p-2 2xl:p-4 space-y-2 overflow-y-auto custom-scrollbar">
                            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={20} /> <span className="hidden md:inline">{t.dashboard}</span></button>
                            <button onClick={() => setView('news')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg relative transition-all ${view === 'news' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Mail size={20} /> <span className="hidden md:inline">{t.news}</span>{unreadMessages > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-slate-900"></span>}</button>
                            <button onClick={() => setView('squad')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'squad' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Users size={20} /> <span className="hidden md:inline">{t.squad}</span></button>
                            <button onClick={() => setView('training')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'training' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Activity size={20} /> <span className="hidden md:inline">{t.training}</span></button>
                            <button onClick={() => setView('transfers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'transfers' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><ShoppingCart size={20} /> <span className="hidden md:inline">{t.market}</span></button>
                            <button onClick={() => setView('club')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'club' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Building2 size={20} /> <span className="hidden md:inline">{t.club}</span></button>
                            <button onClick={() => setView('league')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'league' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Trophy size={20} /> <span className="hidden md:inline">{t.standings}</span></button>
                            <button onClick={() => setShowWorldRankings(true)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-slate-800 hover:text-white`}><Globe size={20} /> <span className="hidden md:inline">{t.worldRankings}</span></button>
                            <button onClick={() => setShowGlobalHistory(true)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-slate-800 hover:text-white`}><BookOpen size={20} /> <span className="hidden md:inline">{t.history || 'Global History'}</span></button>
                            <button onClick={() => setView('guide')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'guide' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Info size={20} /> <span className="hidden md:inline">{t.gameGuide}</span></button>
                            <button onClick={() => setView('manager')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'manager' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><UserCircle size={20} /> <span className="hidden md:inline">Menajer</span></button>
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
                                onClick={() => setShowSettings(true)}
                                className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border border-blue-500/20 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {t.settings || 'Settings'}
                            </button>
                            <button
                                onClick={handleBackToProfiles}
                                className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                <UserCircle size={14} />
                                {t.backToProfiles || 'Back to Profiles'}
                            </button>
                            <div className="flex justify-center gap-2 flex-wrap">
                                <button onClick={() => setLang('tr')} className={`text-[10px] px-1.5 py-1 rounded transition-colors ${lang === 'tr' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>TR</button>
                                <button onClick={() => setLang('en')} className={`text-[10px] px-1.5 py-1 rounded transition-colors ${lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>EN</button>
                                <button onClick={() => setLang('es')} className={`text-[10px] px-1.5 py-1 rounded transition-colors ${lang === 'es' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>ES</button>
                                <button onClick={() => setLang('fr')} className={`text-[10px] px-1.5 py-1 rounded transition-colors ${lang === 'fr' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>FR</button>
                                <button onClick={() => setLang('ru')} className={`text-[10px] px-1.5 py-1 rounded transition-colors ${lang === 'ru' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>RU</button>
                                <button onClick={() => setLang('id')} className={`text-[10px] px-1.5 py-1 rounded transition-colors ${lang === 'id' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>ID</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Mobile Bottom Navigation - Glassmorphism (5 Items) */}
            {
                view !== 'match' && (
                    <div className="2xl:hidden fixed bottom-0 left-0 w-full z-50 safe-area-bottom pb-1">
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
                )
            }

            <div className={`relative z-10 w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar overscroll-none p-4 2xl:p-8 pb-48 2xl:pb-8 2xl:pt-4 ${view !== 'match' ? '2xl:ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto min-h-full">
                    {view === 'match' && activeMatch && activeHome && activeAway ? (
                        <MatchCenter
                            match={activeMatch} homeTeam={activeHome} awayTeam={activeAway}
                            homePlayers={gameState.players.filter(p => p.teamId === activeHome.id)}
                            awayPlayers={gameState.players.filter(p => p.teamId === activeAway.id)}
                            onSync={simulation.handleMatchSync} onFinish={handleMatchFinish} onInstantFinish={simulation.handleInstantFinish}
                            onSubstitute={handleSubstitution} onUpdateTactic={simulation.handleUpdateTactic} onAutoFix={handleAutoFix}
                            userTeamId={userTeam.id} t={t} debugLogs={debugLog} onPlayerClick={setSelectedPlayer}
                        />
                    ) : view === 'match' ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center max-w-sm">
                                <SkipForward size={48} className="text-red-500 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2">{t.matchLoadError || 'Match Load Error'}</h2>
                                <p className="text-slate-400 mb-6">{t.matchLoadErrorDesc || 'Could not load match data. Please return to dashboard.'}</p>
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                                >
                                    {t.returnToDashboard}
                                </button>
                            </div>
                        </div>
                    ) : (

                        <div className="animate-fade-in w-full">
                            {/* Navigation Safety: Ensure active match is cleared if user navigates away */}
                            {(() => {
                                if (view !== 'match' && activeMatchId) {
                                    // Use setTimeout to avoid state updates during render
                                    setTimeout(() => handleMatchFinish(), 0);
                                }
                                return null;
                            })()}

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

                                        <button onClick={() => setShowUpdates(true)} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-pink-600/80"></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 text-5xl mb-2">✨</div>
                                            <div className="relative z-10 text-center">
                                                <div className="text-purple-300 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.whatsNew || "What's New"}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setView('manager')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-indigo-900/80"></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 text-5xl mb-2">👔</div>
                                            <div className="relative z-10 text-center">
                                                <div className="text-purple-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">MENAJER</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setShowGlobalHistory(true)} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-blue-900/80"></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 text-5xl mb-2">🌍</div>
                                            <div className="relative z-10 text-center">
                                                <div className="text-indigo-300 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.history || 'HISTORY'}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setShowWorldRankings(true)} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <img src="/assets/icon-rank.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="World Rankings" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-pink-300 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.worldRankings || 'RANKINGS'}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setLang(prev => prev === 'tr' ? 'en' : prev === 'en' ? 'es' : prev === 'es' ? 'fr' : prev === 'fr' ? 'ru' : prev === 'ru' ? 'id' : 'tr')} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">

                                            <img src="/assets/icon-language-glass.jpg" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 group-active:scale-95 transition-all mix-blend-screen" alt="Language" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 mt-auto mb-3 text-center">
                                                <div className="text-indigo-400 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{lang === 'tr' ? 'TÜRKÇE' : lang === 'en' ? 'ENGLISH' : lang === 'es' ? 'ESPAÑOL' : lang === 'fr' ? 'FRANÇAIS' : lang === 'ru' ? 'РУССКИЙ' : 'INDONESIA'}</div>
                                            </div>
                                        </button>

                                        <button onClick={() => setShowSettings(true)} className="fm-card p-0 relative group overflow-hidden aspect-square flex flex-col items-center justify-center active:scale-95 transition-transform">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-cyan-900/80"></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-active:from-black/90"></div>
                                            <div className="relative z-10 text-5xl mb-2">⚙️</div>
                                            <div className="relative z-10 text-center">
                                                <div className="text-blue-300 font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wide">{t.settings || 'SETTINGS'}</div>
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
                                    <div className="flex flex-col gap-4 animate-fade-in pb-20 max-w-full overflow-hidden">
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

                                        {/* Inbox, Transfer Offers & League Position Widget */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* Inbox */}
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

                                            {/* Transfer Offers */}
                                            <button onClick={() => { setNewsFilter('TRANSFERS'); setView('news'); }} className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/10 hover:border-yellow-500/30 transition-all active:scale-95 overflow-hidden shadow-lg">
                                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="relative">
                                                    <DollarSign size={24} className="text-yellow-400 group-hover:text-yellow-300 transition-colors drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                                    {(gameState.pendingOffers?.filter(o => o.status === 'PENDING').length || 0) > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500 border border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></span>
                                                    </span>}
                                                </div>
                                                <div className="text-center relative z-10">
                                                    <div className="text-lg font-bold text-white">{gameState.pendingOffers?.filter(o => o.status === 'PENDING').length || 0}</div>
                                                    <div className="text-[10px] uppercase text-yellow-400/70 font-bold tracking-wider">TEKLİF</div>
                                                </div>
                                            </button>
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
                                                    <button
                                                        onClick={() => {
                                                            setViewLeagueId(userTeam.leagueId);
                                                            setView('league');
                                                        }}
                                                        className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/10 hover:border-yellow-500/30 transition-all overflow-hidden shadow-lg active:scale-95 cursor-pointer"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <Trophy size={24} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                                        <div className="text-center relative z-10">
                                                            <div className="text-lg font-bold text-white">{lastPosition}</div>
                                                            <div className="text-[10px] uppercase text-yellow-400/70 font-bold tracking-wider">{t.rank}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })()}
                                        </div>

                                        {/* Next Match Card - Detailed */}
                                        <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                                            <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900/50 p-3 border-b border-white/5 flex justify-between items-center">
                                                <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-2 tracking-wider"><Calendar size={14} className="drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" /> {t.nextMatch}</span>
                                                <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                                                    {gameState.currentWeek}/{Math.max(40, getLastLeagueWeek(gameState.matches) + 1)}
                                                </span>
                                            </div>
                                            <div className="p-4 flex flex-col gap-4">
                                                {/* Next Match Logic with Cup Priority */}
                                                {(() => {
                                                    // Helper to find priority match
                                                    const getCupMatch = (cup: EuropeanCup | undefined) => {
                                                        if (!cup || !cup.isActive || cup.currentStage === 'COMPLETE') return null;

                                                        // Global Cup Schedule (Matches previous definition)
                                                        const SCHEDULE: { [key: string]: number } = {
                                                            'GROUP': 4,
                                                            'ROUND_16': 24,
                                                            'QUARTER': 28,
                                                            'SEMI': 32,
                                                            'FINAL': 36
                                                        };
                                                        // Note: We check week on match level for groups primarily
                                                        // But simplified check:
                                                        // if (gameState.currentWeek !== SCHEDULE[cup.currentStage] && cup.currentStage !== 'GROUP') return null;

                                                        let candidateMatches: Match[] = [];
                                                        if (cup.currentStage === 'GROUP' && cup.groups) {
                                                            candidateMatches = cup.groups.flatMap(g => g.matches as unknown as Match[]);
                                                        } else if (cup.knockoutMatches) {
                                                            candidateMatches = cup.knockoutMatches as unknown as Match[];
                                                        }

                                                        return candidateMatches.find(m =>
                                                            m.week === gameState.currentWeek &&
                                                            !m.isPlayed &&
                                                            (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id)
                                                        );
                                                    };

                                                    // Check Super Cup (Priority #1)
                                                    const getSuperCupMatch = () => {
                                                        if (gameState.superCup && !gameState.superCup.isComplete && gameState.superCup.match) {
                                                            const m = gameState.superCup.match;
                                                            if (!m.isPlayed && m.week === gameState.currentWeek && (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id)) {
                                                                return m;
                                                            }
                                                        }
                                                        return null;
                                                    };

                                                    const nextSuperCup = getSuperCupMatch();
                                                    const nextCL = gameState.europeanCup ? getCupMatch(gameState.europeanCup) : null;
                                                    const nextEL = gameState.europaLeague ? getCupMatch(gameState.europaLeague) : null;
                                                    const nextLeague = gameState.matches.find(m => m.week === gameState.currentWeek && !m.isPlayed && (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id));

                                                    // Priority: Super Cup > Global Cup > League
                                                    const nextMatch = nextSuperCup || nextCL || nextEL || nextLeague;

                                                    if (!nextMatch) {
                                                        // Season is over only if:
                                                        // 1. Current week >= (lastLeagueWeek + 2), AND
                                                        // 2. Either Super Cup doesn't exist OR it exists and is complete
                                                        const hasPendingSuperCup = gameState.superCup && !gameState.superCup.isComplete && !gameState.superCup.match?.isPlayed;
                                                        const lastLeagueWeek = getLastLeagueWeek(gameState.matches);
                                                        // Season ends at max(40, lastLeagueWeek + 1) - Super Cup is always week 39
                                                        const seasonEndWeek = Math.max(40, lastLeagueWeek + 1);
                                                        const isSeasonOver = gameState.currentWeek >= seasonEndWeek && !hasPendingSuperCup;

                                                        if (isSeasonOver) {
                                                            return (
                                                                <div className="text-center py-4">
                                                                    <div className="text-emerald-400 mb-3 font-bold">{t.seasonComplete || 'Season Finished'}</div>
                                                                    <button
                                                                        onClick={() => setShowSeasonSummary(true)}
                                                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 mx-auto animate-pulse"
                                                                    >
                                                                        <Trophy size={16} />
                                                                        {t.endSeason || 'End Season'}
                                                                    </button>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="text-center py-4">
                                                                <div className="text-slate-400 mb-3">{t.noMatchToday}</div>
                                                                <button
                                                                    onClick={() => handleQuickSimWithBackground()}
                                                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold border border-slate-600 transition-colors shadow-lg flex items-center gap-2 mx-auto"
                                                                >
                                                                    <Clock size={16} />
                                                                    {t.simulateMatch || 'Advance Week'}
                                                                </button>
                                                            </div>
                                                        );
                                                    }

                                                    const isCup = !!(nextSuperCup || nextCL || nextEL);
                                                    const isSuperCup = !!nextSuperCup;
                                                    const isCL = !!nextCL;
                                                    const opponentId = nextMatch.homeTeamId === userTeam.id ? nextMatch.awayTeamId : nextMatch.homeTeamId;
                                                    const opponent = gameState.teams.find(tm => tm.id === opponentId);

                                                    return (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center border shadow-lg ${isCup
                                                                    ? (isSuperCup ? 'bg-amber-600 border-amber-400' : isCL ? 'bg-purple-900 border-purple-500' : 'bg-emerald-900 border-emerald-500')
                                                                    : 'bg-slate-800 border-slate-700'}`}>
                                                                    {opponent ? (
                                                                        <img
                                                                            src={getTeamLogo(opponent.name || '')}
                                                                            alt={opponent.name || 'Opponent'}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                const fallbackInitial = (opponent?.name || 'T')[0];
                                                                                (e.target as HTMLImageElement).outerHTML = `<span class="text-lg font-bold" style="color: #fff">${fallbackInitial}</span>`;
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        isCup ? <Trophy size={18} /> : 'VS'
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className={`text-[10px] font-bold uppercase ${isCup
                                                                        ? (isSuperCup ? 'text-amber-300' : isCL ? 'text-purple-400' : 'text-emerald-400')
                                                                        : 'text-emerald-500'}`}>
                                                                        {isSuperCup ? (t.internationalSuperCup || 'International Super Cup') : isCup ? (isCL ? (t.internationalEliteCup || 'International Elite Cup') : (t.internationalChallengeCup || 'International Challenge Cup')) : t.nextMatch}
                                                                    </div>
                                                                    <div className="text-lg font-bold text-white">
                                                                        {opponent?.name || 'Unknown'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (isSuperCup) {
                                                                        handlePlaySuperCup();
                                                                    } else if (isCup) {
                                                                        handlePlayEuropeanCupMatch(nextMatch as EuropeanCupMatch);
                                                                    } else {
                                                                        startNextMatch();
                                                                    }
                                                                }}
                                                                className={`px-4 py-3 rounded-lg shadow-lg transition-all active:scale-95 flex items-center gap-2 font-bold text-white
                                                            ${isCup
                                                                        ? (isSuperCup
                                                                            ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/40 text-black'
                                                                            : isCL
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
                                                    <button onClick={handleQuickSimWithBackground} className="group relative bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 hover:from-emerald-800/50 hover:to-emerald-700/30 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-400 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 overflow-hidden shadow-lg shadow-emerald-900/20">
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
                                        onAcceptOffer={transferMarket.handleAcceptOffer}
                                        onRejectOffer={transferMarket.handleRejectOffer}
                                        onViewPlayer={(playerId) => {
                                            const player = gameState.players.find(p => p.id === playerId);
                                            if (player) setSelectedPlayer(player);
                                        }}
                                        t={t}
                                        initialTab={newsFilter}
                                    />
                                )
                            }
                            {view === 'squad' && <TeamManagement team={userTeam} players={userPlayers} onUpdateTactic={simulation.handleUpdateTactic} onPlayerClick={setSelectedPlayer} onUpdateLineup={handleUpdateLineup} onSwapPlayers={handleSwapPlayers} onMovePlayer={handleMovePlayer} onAutoFix={handleAutoFix} onPlayerMoraleChange={handlePlayerMoraleChange} t={t} />}
                            {view === 'training' && <TrainingCenter team={userTeam} players={userPlayers} onSetFocus={handleSetTrainingFocus} onSetIntensity={handleSetTrainingIntensity} t={t} />}
                            {view === 'transfers' && <TransferMarket marketPlayers={gameState.players} userTeam={userTeam} onBuyPlayer={transferMarket.handleBuyPlayer} onPlayerClick={setSelectedPlayer} t={t} />}
                            {
                                view === 'club' && (
                                    <ClubManagement
                                        team={userTeam}
                                        players={userPlayers}
                                        t={t}
                                        onPromoteYouth={transferMarket.handlePromoteYouth}
                                        onResign={handleResign}
                                        onUpgradeStaff={handleUpgradeStaff}
                                        onUpgradeFacility={handleUpgradeFacility}
                                        onDowngradeFacility={handleDowngradeFacility}
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
                            {view === 'fixtures' && <FixturesView matches={gameState.matches.map(m => ({ ...m, events: m.events || [] }))} teams={gameState.teams} players={gameState.players} currentWeek={gameState.currentWeek} t={t} userTeamId={userTeam.id} userLeagueId={gameState.leagueId} availableLeagues={LEAGUE_PRESETS.map(l => ({ id: l.id, name: t[`league${l.country}` as keyof typeof t] as string || l.name }))} europeanCup={gameState.europeanCup} europaLeague={gameState.europaLeague} superCup={gameState.superCup} onPlayCupMatch={handlePlayEuropeanCupMatch} onPlaySuperCup={handlePlaySuperCup} onOpenCupDetails={() => gameState.europeanCup && setViewingCup({ cup: gameState.europeanCup, name: t.internationalEliteCup || 'International Elite Cup' })} onOpenEuropaDetails={() => gameState.europaLeague && setViewingCup({ cup: gameState.europaLeague, name: t.internationalChallengeCup || 'International Challenge Cup' })} />}
                            {view === 'guide' && <GameGuide t={t} />}
                            {view === 'manager' && <ManagerProfile gameState={gameState} userTeam={userTeam} t={t} onBack={() => setView('dashboard')} />}
                        </div >

                    )
                    }
                </div >
            </div >

            {/* Updates Modal */}
            {showUpdates && <UpdatesModal onClose={() => setShowUpdates(false)} t={t} />}

            {/* Global History Modal */}
            <GlobalHistoryModal
                isOpen={showGlobalHistory}
                onClose={() => setShowGlobalHistory(false)}
                history={gameState?.history || []}
                teams={gameState?.teams || []}
                t={t}
            />

            {/* World Rankings Modal */}
            <WorldRankingsModal
                isOpen={showWorldRankings}
                onClose={() => setShowWorldRankings(false)}
                teams={gameState?.teams || []}
                players={gameState?.players || []}
            />

            {/* Season Summary Modal */}
            {
                gameState && (
                    <SeasonSummaryModal
                        isOpen={showSeasonSummary}
                        gameState={gameState}
                        t={t}
                        onStartNewSeason={handleStartNewSeason}
                    />
                )
            }

            {/* Game Over Modal */}
            {
                gameState?.isGameOver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                        <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-orange-600"></div>
                            <div className="mb-6 flex justify-center">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 animate-pulse">
                                    <LogOut size={40} className="text-red-500" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">{t.gameOver || 'OYUN BİTTİ'}</h2>
                            <h3 className="text-xl font-bold text-red-400 mb-4">{t.firedTitle || 'Kovuldunuz!'}</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                {t.firedDesc || 'Yönetim size olan güvenini tamamen kaybetti. Eşyalarınızı toplayın.'}
                            </p>
                            <button
                                onClick={() => {
                                    setGameState(null);
                                    setShowProfileSelector(true);
                                }}
                                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <LogOut size={20} />
                                {t.mainMenu || 'Ana Menüye Dön'}
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Simulation Loading Modal */}
            <SimulationLoadingModal
                isOpen={isWeekSimulating}
                currentWeek={gameState?.currentWeek || 1}
                progress={simulationProgress}
                t={t}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                performanceSettings={gameState?.performanceSettings || {
                    showAnimations: true,
                    detailedStats: true,
                    backgroundSimulation: true,
                    autoSave: 'WEEKLY'
                }}
                onSettingsChange={(settings) => {
                    if (gameState) {
                        const newState = { ...gameState, performanceSettings: settings };
                        setGameState(newState);
                        if (activeProfileId) {
                            saveProfileData(activeProfileId, newState);
                        }
                    }
                }}
                currentLanguage={lang}
                onLanguageChange={(newLang) => setLang(newLang as any)}
                t={t}
            />
        </Layout >
    );
};

export default App;
