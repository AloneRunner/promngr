import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Match, Team, Player, MatchEventType, TeamTactic, Translation, LineupStatus } from '../types';
import { Play, Pause, FastForward, SkipForward, X, List, BarChart2, Video, MonitorPlay, Users, Settings, LogOut, Layers, Palette } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { getTeamLogo } from '../logoMapping';
import { TeamManagement } from './TeamManagement';
import { simulateTick, getActiveEngine } from '../services/engine';
import { soundManager } from '../services/soundManager';

interface MatchCenterProps {
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    homePlayers: Player[];
    awayPlayers: Player[];
    onSync: (matchId: string, result: any) => void; // REPLACED: onTick -> onSync
    onFinish: (matchId: string) => void;
    onInstantFinish: (matchId: string) => void;
    onSubstitute: (playerInId: string, playerOutId: string) => void;
    onUpdateTactic: (tactic: TeamTactic, context?: { minute: number; score: { home: number; away: number } }, targetTeamId?: string) => void;
    onAutoFix: () => void;
    userTeamId: string;
    t: Translation;
    debugLogs: string[];
    onPlayerClick: (player: Player) => void;
}

// Fixed Internal Resolution
const CANVAS_W = 1280;
const CANVAS_H = 640; // 800 -> 640 for wider ratio
const PITCH_MARGIN = 40; // 80 -> 40 to maximize space

// 2.5D Perspective - Dengeli ayarlar
const PERSPECTIVE_RATIO = 0.6; // 0.55 -> 0.6 (Slightly taller pitch)
const PERSPECTIVE_SCALE = 0.30;

// Colors
const PITCH_COLOR_1 = '#1a472a'; // Deep Green
const PITCH_COLOR_2 = '#235c36'; // Lighter Green
const LINE_COLOR = 'rgba(255, 255, 255, 0.85)';

// Motor koordinat sistemi sabitleri (105x68 metre)
const ENGINE_PITCH_LENGTH = 105;
const ENGINE_PITCH_WIDTH = 68;

// Motor koordinatlarını UI koordinatlarına (0-100) normalize et
const normalizeCoords = (x: number, y: number): { x: number, y: number } => {
    return {
        x: (x / ENGINE_PITCH_LENGTH) * 100,
        y: (y / ENGINE_PITCH_WIDTH) * 100
    };
};

// 2.5D Coordinate Transformation
const toScreen = (xPct: number, yPct: number, z: number = 0, mode: '2D' | '2.5D' = '2.5D'): { x: number, y: number, groundY: number, scale: number } => {
    if (mode === '2D') {
        // Simple Top-Down Match Engine (Classic FM Style)
        const margin = 20;
        const w = CANVAS_W - (margin * 2);
        const h = CANVAS_H - (margin * 2);

        return {
            x: margin + (xPct / 100) * w,
            y: margin + (yPct / 100) * h,
            groundY: margin + (yPct / 100) * h,
            scale: 1 // No depth scaling in 2D
        };
    }

    const fieldW = CANVAS_W - (PITCH_MARGIN * 2);
    const fieldH = (CANVAS_H - (PITCH_MARGIN * 2)) * PERSPECTIVE_RATIO;

    // Perspective factor: top is narrower, bottom is wider
    const yNorm = yPct / 100; // 0 = top (far), 1 = bottom (near)
    const perspFactor = 1 - (1 - yNorm) * PERSPECTIVE_SCALE;

    // X: Scale from center based on Y position
    const centerX = CANVAS_W / 2;
    const rawX = PITCH_MARGIN + (xPct / 100) * fieldW;
    const screenX = centerX + (rawX - centerX) * perspFactor;

    // Y: Compressed with perspective
    const screenYRaw = PITCH_MARGIN + yNorm * fieldH;

    // Center Vertically:
    // fieldHeight on screen is fieldH. Total available height is CANVAS_H - 2*Margin.
    // Actually we just want to center the content block (fieldH) in the canvas.
    const contentHeight = fieldH;
    const verticalCenterOffset = (CANVAS_H - (contentHeight + PITCH_MARGIN * 2)) / 2;
    // We shift it down slightly less than full center to leave room for goal posts at top
    const finalScreenY = screenYRaw + verticalCenterOffset + (PITCH_MARGIN / 2);

    // Z: Height offset (goes up)
    const zOffset = z * 6;

    // Scale based on depth (further = smaller)
    const depthScale = 0.7 + yNorm * 0.3;

    return {
        x: screenX,
        y: finalScreenY - zOffset,
        groundY: finalScreenY,
        scale: depthScale
    };
};

// Helper: Linear Interpolation
const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
};

// Helper: Angle Interpolation
const lerpAngle = (start: number, end: number, t: number) => {
    const difference = Math.abs(end - start);
    if (difference > Math.PI) {
        if (end > start) {
            start += Math.PI * 2;
        } else {
            end += Math.PI * 2;
        }
    }
    return start * (1 - t) + end * t;
};

export const MatchCenter: React.FC<MatchCenterProps> = ({
    match, homeTeam, awayTeam, homePlayers, awayPlayers,
    onSync, onFinish, onInstantFinish, onSubstitute, onUpdateTactic, onAutoFix, userTeamId, t, onPlayerClick
}) => {
    const [speed, setSpeed] = useState<number>(1);
    const [viewMode, setViewMode] = useState<'2D' | '2.5D'>('2.5D'); // NEW: View Mode Toggle
    const [useDefaultColors, setUseDefaultColors] = useState(false); // NEW: Default Colors Toggle
    const [activeTab, setActiveTab] = useState<'PITCH' | 'FEED' | 'STATS'>('PITCH');
    const [showTacticsModal, setShowTacticsModal] = useState(false);
    const [goalFlash, setGoalFlash] = useState<'HOME' | 'AWAY' | null>(null); // NEW: Goal celebration flash
    const lastGoalCount = useRef({ home: 0, away: 0 }); // Track goal count to detect new goals

    // --- HELPER LOGGING ---
    useEffect(() => {
        // Log tactics when component mounts (match starts/resumes)
        const engine = getActiveEngine();
        if (engine && engine.logCurrentTactics) {
            engine.logCurrentTactics();
        }
    }, []);

    // Also log when speed changes (resume from pause)
    useEffect(() => {
        if (speed > 0) {
            const engine = getActiveEngine();
            if (engine && engine.logCurrentTactics) {
                engine.logCurrentTactics();
            }
        }
    }, [speed]);

    // NEW: Log Full Analysis at Minute 90
    const analysisLogged = useRef(false);
    useEffect(() => {
        if (match.currentMinute >= 90 && !analysisLogged.current) {
            analysisLogged.current = true;
            const engine = getActiveEngine();
            if (engine && engine.logMatchAnalysis) {
                engine.logMatchAnalysis();
            }
        }
    }, [match.currentMinute]);

    // NEW: Set Piece Indicator - Shows what's happening (FOUL, FREE_KICK, CORNER, etc.)
    const [setPieceIndicator, setSetPieceIndicator] = useState<{ type: string, message: string } | null>(null);

    // NEW: Toast Notification System
    const [toasts, setToasts] = useState<Array<{ id: string, type: 'SUB' | 'GOAL' | 'TACTIC' | 'CARD' | 'SET_PIECE', message: string, team: 'HOME' | 'AWAY', minute: number }>>([]);
    const lastEventCount = useRef(0);

    // NEW: Exit Confirmation Modal
    const [showExitModal, setShowExitModal] = useState(false);

    // NEW: Half-Time Modal
    const [showHalfTime, setShowHalfTime] = useState(false);
    const halfTimeShown = useRef(false);

    // NEW: Landscape Detection (for wide phones like Samsung A51)
    const [isLandscape, setIsLandscape] = useState(false);
    const [isSmallLandscape, setIsSmallLandscape] = useState(false); // Wide phone landscape (not tablet)

    // DEBUG: Managed Side (Home/Away)
    const [managedSide, setManagedSide] = useState<'HOME' | 'AWAY'>('HOME');

    // Sync managed side to user team initially
    useEffect(() => {
        setManagedSide(userTeamId === awayTeam.id ? 'AWAY' : 'HOME');
    }, [userTeamId, awayTeam.id]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Logic Loop & Render Loop Refs
    const logicTimerRef = useRef<number | null>(null);
    const renderReqRef = useRef<number | null>(null);

    // State Interpolation Refs
    const lastTickState = useRef<any>(null);
    const nextTickState = useRef<any>(null);
    const lastTickTime = useRef<number>(0);

    // Offscreen Canvas for Static Pitch (Mobile Optimization)
    const pitchCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Ball trail history for visual effect
    const ballTrail = useRef<Array<{ x: number, y: number, z: number, age: number }>>([]);

    // Cache for jersey numbers
    const playerNumbers = useRef<Record<string, number>>({});



    // === STALE CLOSURE FIX ===
    // Refs to store latest props for use in setInterval (prevents stale closure)
    const matchRef = useRef(match);
    const homeTeamRef = useRef(homeTeam);
    const awayTeamRef = useRef(awayTeam);
    const homePlayersRef = useRef(homePlayers);
    const awayPlayersRef = useRef(awayPlayers);

    // Keep refs updated with latest props
    useEffect(() => {
        matchRef.current = match;
        homeTeamRef.current = homeTeam;
        awayTeamRef.current = awayTeam;
        homePlayersRef.current = homePlayers;
        awayPlayersRef.current = awayPlayers;
    }, [match, homeTeam, awayTeam, homePlayers, awayPlayers]);

    // 0. Update Jersey Numbers on Player Change (Substitutions)
    useEffect(() => {
        let hC = 2, aC = 2;
        [...homePlayers, ...awayPlayers].forEach(p => {
            if (p.jerseyNumber) {
                playerNumbers.current[p.id] = p.jerseyNumber;
            } else if (p.position === 'GK') {
                playerNumbers.current[p.id] = 1;
            } else {
                playerNumbers.current[p.id] = p.teamId === homeTeam.id ? hC++ : aC++;
            }
        });
    }, [homePlayers, awayPlayers, homeTeam.id]);

    // 1. Initialize & Cleanup
    useEffect(() => {
        console.log('🏟️ MATCH CENTER MOUNTED', {
            matchId: match.id,
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            homePlayersCount: homePlayers.length,
            awayPlayersCount: awayPlayers.length
        });


        // Initialize State
        if (match.liveData?.simulation) {
            // OPTIMIZATION: Removed expensive deep clone
            // Since we treat simulation state as immutable snapshots from the engine,
            // we can just reference them or shallow copy if needed.
            const initialState = match.liveData.simulation;
            lastTickState.current = initialState;
            nextTickState.current = initialState;
            lastTickTime.current = performance.now();
        }

        // Create Offscreen Canvas
        if (!pitchCanvasRef.current) {
            const offscreen = document.createElement('canvas');
            offscreen.width = CANVAS_W;
            offscreen.height = CANVAS_H;
            pitchCanvasRef.current = offscreen;
        }

        // 🔊 Start ambience sound when match starts
        if (!match.isPlayed) {
            soundManager.startAmbience();
            soundManager.play('whistle_start');
        }

        return () => {
            if (logicTimerRef.current) clearInterval(logicTimerRef.current);
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current);

            // 🔊 Stop all sounds on unmount
            soundManager.stopAll();
        };
    }, []);

    // Re-draw static pitch when ViewMode changes
    useEffect(() => {
        if (pitchCanvasRef.current) {
            const ctx = pitchCanvasRef.current.getContext('2d');
            if (ctx) {
                drawPitch(ctx);
            }
        }
    }, [viewMode]);

    // LANDSCAPE DETECTION for wide phones
    useEffect(() => {
        const checkLandscape = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const landscape = w > h;
            const smallLandscape = landscape && h < 500; // Wide phone like Samsung A51 (412px height)
            setIsLandscape(landscape);
            setIsSmallLandscape(smallLandscape);
        };

        checkLandscape();
        window.addEventListener('resize', checkLandscape);
        return () => window.removeEventListener('resize', checkLandscape);
    }, []);

    // SCREEN WAKE LOCK
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                }
            } catch (err) {
                console.log('Wake Lock error:', err);
            }
        };

        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !wakeLock) {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (wakeLock) wakeLock.release();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // 2. Handle Match Data Updates (The "Tick" Receiver)
    useEffect(() => {
        if (match.liveData?.simulation) {
            // Push current "next" to "last"
            lastTickState.current = nextTickState.current
                ? nextTickState.current // Just move the reference
                : match.liveData.simulation;

            // Set new "next" directly from liveData
            // The simulation engine produces fresh objects, so this is safe.
            nextTickState.current = match.liveData.simulation;
            lastTickTime.current = performance.now();
        }

        // NEW: Detect goals for flash effect
        if (match.homeScore > lastGoalCount.current.home) {
            lastGoalCount.current.home = match.homeScore;
            setGoalFlash('HOME');
            setTimeout(() => setGoalFlash(null), 1500);
        }
        if (match.awayScore > lastGoalCount.current.away) {
            lastGoalCount.current.away = match.awayScore;
            setGoalFlash('AWAY');
            setTimeout(() => setGoalFlash(null), 1500);
        }

        // NEW: Toast notifications for new events
        if (match.events.length > lastEventCount.current) {
            const newEvents = match.events.slice(lastEventCount.current);
            const timestamp = Date.now(); // Get timestamp once for the batch
            newEvents.forEach((ev, idx) => {
                const isHome = ev.teamId === homeTeam.id;
                let toastType: 'SUB' | 'GOAL' | 'TACTIC' | 'CARD' | 'SET_PIECE' = 'GOAL';
                let showIndicator = false;
                let indicatorType = '';
                let indicatorMessage = '';

                if (ev.type === MatchEventType.GOAL) {
                    toastType = 'GOAL';
                } else if (ev.type === MatchEventType.SUB) {
                    toastType = 'SUB';
                } else if (ev.type === MatchEventType.CARD_YELLOW || ev.type === MatchEventType.CARD_RED) {
                    toastType = 'CARD';
                } else if (ev.type === MatchEventType.FOUL) {
                    toastType = 'SET_PIECE';
                    showIndicator = true;
                    indicatorType = 'FOUL';
                    indicatorMessage = 'FOUL';
                } else if (ev.type === MatchEventType.FREE_KICK) {
                    toastType = 'SET_PIECE';
                    showIndicator = true;
                    indicatorType = 'FREE_KICK';
                    indicatorMessage = 'FREE KICK';
                } else if (ev.type === MatchEventType.CORNER) {
                    toastType = 'SET_PIECE';
                    showIndicator = true;
                    indicatorType = 'CORNER';
                    indicatorMessage = 'CORNER';
                } else if (ev.type === MatchEventType.THROW_IN) {
                    // Don't show toast for throw-ins, just indicator briefly
                    showIndicator = true;
                    indicatorType = 'THROW_IN';
                    indicatorMessage = 'THROW IN';
                    // Show indicator briefly then clear
                    setSetPieceIndicator({ type: indicatorType, message: indicatorMessage });
                    setTimeout(() => setSetPieceIndicator(null), 1500);
                    return; // Skip toast for throw-ins
                } else if (ev.type === MatchEventType.KICKOFF) {
                    showIndicator = true;
                    indicatorType = 'KICKOFF';
                    indicatorMessage = 'KICK OFF';
                    setSetPieceIndicator({ type: indicatorType, message: indicatorMessage });
                    setTimeout(() => setSetPieceIndicator(null), 2000);
                    return; // Skip toast for kickoffs
                } else {
                    return; // Skip other events
                }

                // Show set piece indicator
                if (showIndicator) {
                    setSetPieceIndicator({ type: indicatorType, message: indicatorMessage });
                    // Clear after 2.5 seconds
                    setTimeout(() => setSetPieceIndicator(null), 2500);
                }

                const newToast = {
                    id: `${ev.minute}-${ev.type}-${timestamp}-${idx}`, // Added idx for uniqueness
                    type: toastType,
                    message: ev.description,
                    team: isHome ? 'HOME' as const : 'AWAY' as const,
                    minute: ev.minute
                };

                setToasts(prev => [...prev.slice(-4), newToast]); // Keep max 5 toasts

                // Auto-remove after 2.5 seconds (was 5s - too long)
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== newToast.id));
                }, 2500);
            });
            lastEventCount.current = match.events.length;
        }

        // NEW: Half-Time detection (show at 45')
        if (match.currentMinute >= 45 && match.currentMinute < 46 && !halfTimeShown.current && !match.isPlayed) {
            halfTimeShown.current = true;
            setShowHalfTime(true);
            setSpeed(0); // Pause during half-time
        }
    }, [match.liveData, match.currentMinute, match.homeScore, match.awayScore, match.events.length]); // Update when data changes

    // 3. Logic Loop (Decoupled from App.tsx)
    useEffect(() => {
        if (match.isPlayed) {
            setSpeed(0);
            soundManager.stopAll(); // 🔊 Stop sounds when match ends
            soundManager.play('whistle_end');
            return;
        }

        if (logicTimerRef.current) window.clearInterval(logicTimerRef.current);

        // 🔊 Control sounds based on speed
        if (speed === 0) {
            soundManager.pause(); // Pause all sounds
        } else {
            soundManager.resume(); // Resume all sounds
        }

        if (speed > 0) {
            // Speed logic: 
            // 1x = 50ms (Matches App.tsx tick rate)
            // Note: 1x was 120ms purely for visual pace, but engine tick rate matters.
            // We'll stick to 50ms base tick for consistent physics.
            let ms = 50;
            if (speed === 2) ms = 25;
            else if (speed === 0.5) ms = 100;
            else if (speed === 4) ms = 12;

            logicTimerRef.current = window.setInterval(() => {
                // RUN SIMULATION LOCALLY - Using refs to avoid stale closures
                const result = simulateTick(
                    matchRef.current,
                    homeTeamRef.current,
                    awayTeamRef.current,
                    homePlayersRef.current,
                    awayPlayersRef.current,
                    userTeamId
                );

                // Update Local Physics State (No React Render)
                if (result.simulation) {
                    // Push current "next" to "last"
                    lastTickState.current = nextTickState.current
                        ? nextTickState.current
                        : result.simulation;

                    nextTickState.current = result.simulation;
                    lastTickTime.current = performance.now();
                }

                // 🔊 Play event sounds
                if (result.event) {
                    switch (result.event.type) {
                        case MatchEventType.GOAL:
                            soundManager.play('goal');
                            soundManager.play('cheer');
                            break;
                        case MatchEventType.CARD_YELLOW:
                            soundManager.play('yellow_card');
                            break;
                        case MatchEventType.CARD_RED:
                            soundManager.play('red_card');
                            break;
                        case MatchEventType.SUB:
                            soundManager.play('substitution');
                            break;
                        case MatchEventType.PENALTY:
                            soundManager.play('penalty');
                            break;
                        case MatchEventType.CORNER:
                            soundManager.play('corner');
                            break;
                    }
                }

                // SYNC WITH APP ONLY ON CRITICAL EVENTS
                // 1. Minute changed
                // 2. Goal Scored (Event type GOAL)
                // 3. Match ended (90+ min)
                // 4. Set pieces (FOUL, FREE_KICK, CORNER, etc.) - for visual indicators
                const shouldSync = result.minuteIncrement ||
                    (result.event && [
                        MatchEventType.GOAL,
                        MatchEventType.FOUL,
                        MatchEventType.FREE_KICK,
                        MatchEventType.CORNER,
                        MatchEventType.THROW_IN,
                        MatchEventType.CARD_YELLOW,
                        MatchEventType.CARD_RED,
                        MatchEventType.KICKOFF
                    ].includes(result.event.type)) ||
                    (matchRef.current.currentMinute >= 90);

                if (shouldSync) {
                    onSync(matchRef.current.id, result);
                }

            }, ms);
        }
    }, [speed, match.isPlayed, match.id]);

    // 4. Render Loop (Visuals)
    const render = useCallback(() => {
        if (!canvasRef.current || !lastTickState.current || !nextTickState.current) {
            renderReqRef.current = requestAnimationFrame(render);
            return;
        }

        // Match Loop
        const loop = () => {
            if (speed === 0 || match.isPlayed) { // Stop if paused or finished
                logicTimerRef.current = requestAnimationFrame(loop);
                return;
            }

            const now = performance.now();
            const delta = now - lastTickTime.current;
            const interval = 1000 / (speed * 2); // Speed multiplier

            if (delta > interval) {
                lastTickTime.current = now - (delta % interval);

                // Run Simulation Step
                // Call onSync which wraps simulateTick from engine
                // But we can't call onSync directly here as it's a prop function (might trigger state update)
                // We should rely on props.onSync being stable or just call it.

                // Let's look at the original code implementation of the loop.
                // It was likely calling onSync.

                // For now, I will just add the check '|| match.isPlayed' to the existing check.
            }
            logicTimerRef.current = requestAnimationFrame(loop);
        };
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const now = performance.now();
        const tickDuration = speed === 2 ? 60 : speed === 0.5 ? 240 : speed === 4 ? 30 : 120;
        const elapsed = now - lastTickTime.current;
        // Clamp alpha between 0 and 1 to prevent overshooting
        const alpha = Math.min(1, Math.max(0, elapsed / tickDuration));

        // Draw Everything
        drawScene(ctx, lastTickState.current, nextTickState.current, alpha);

        renderReqRef.current = requestAnimationFrame(render);
    }, [speed, homeTeam, awayTeam, homePlayers, awayPlayers]);

    // Start/Stop Render Loop
    useEffect(() => {
        renderReqRef.current = requestAnimationFrame(render);
        return () => {
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current);
        };
    }, [render]);


    // --- DRAWING FUNCTIONS ---

    const drawScene = (ctx: CanvasRenderingContext2D, prevState: any, nextState: any, alpha: number) => {
        // Clear
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // Draw Cached Pitch (Fast Copy)
        if (pitchCanvasRef.current) {
            ctx.drawImage(pitchCanvasRef.current, 0, 0);
        } else {
            // Fallback (should not happen)
            drawPitch(ctx);
        }

        // FIX: Get players directly from simulation state, not stale cache!
        // The simulation knows exactly who's on the pitch after substitutions
        const simPlayerIds = Object.keys(nextState.players || {});
        const allPlayers = [...homePlayersRef.current, ...awayPlayersRef.current].filter(
            p => simPlayerIds.includes(p.id)
        );

        // Prepare Render Queue (Sort by Y for simple depth)
        const renderQueue = allPlayers.map(p => {
            const prevP = prevState.players[p.id];
            const nextP = nextState.players[p.id];
            if (!prevP || !nextP) return null;

            // Motor koordinatlarını UI koordinatlarına normalize et (105x68 → 0-100)
            const prevNorm = normalizeCoords(prevP.x, prevP.y);
            const nextNorm = normalizeCoords(nextP.x, nextP.y);

            return {
                player: p,
                x: lerp(prevNorm.x, nextNorm.x, alpha),
                y: lerp(prevNorm.y, nextNorm.y, alpha),
                z: nextP.z || 0,
                facing: lerpAngle(prevP.facing || 0, nextP.facing || 0, alpha),
                stamina: nextP.stamina || 100,
                state: nextP.state || 'IDLE',
                signal: nextP.outgoingSignal, // Catch signal here (passed from Sim State)
                shotType: (nextP as any).shotType,
                isCollided: (nextP as any).isCollided
            };
        }).filter(item => item !== null).sort((a, b) => a!.y - b!.y);

        // Draw Players
        renderQueue.forEach(item => {
            if (!item) return;
            const isHome = item.player.teamId === homeTeam.id;
            let primary = isHome ? homeTeam.primaryColor : awayTeam.primaryColor;
            let secondary = isHome ? homeTeam.secondaryColor : awayTeam.secondaryColor;

            // === DEFAULT COLORS OVERRIDE ===
            if (useDefaultColors) {
                const isMyTeam = item.player.teamId === userTeamId;
                primary = isMyTeam ? '#3b82f6' : '#ef4444'; // Blue (Me) vs Red (Opponent)
                secondary = '#ffffff';
            }

            const num = playerNumbers.current[item.player.id] || 0;
            const hasBall = nextState.ball.ownerId === item.player.id;

            drawPlayer(ctx, item.x, item.y, item.z || 0, item.facing, primary, secondary, num, hasBall, item.player.lastName, item.stamina, item.state, item.signal);

            // === VISUAL CUES ===
            if ((item as any).isCollided) {
                ctx.font = '24px Arial';
                ctx.fillStyle = '#ffcc00';
                ctx.textAlign = 'center';
                ctx.fillText('💥', item.x, item.y - 50);
            }
            if ((item as any).shotType) {
                let emoji = '';
                const type = (item as any).shotType;
                if (type === 'BICYCLE') emoji = '🚲';
                else if (type === 'VOLLEY') emoji = '🚀';
                else if (type === 'HEADER') emoji = '🤕';

                if (emoji) {
                    ctx.font = '28px Arial';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 4;
                    ctx.fillText(emoji, item.x, item.y - 60);
                    ctx.shadowBlur = 0;
                }
            }
        });

        // Draw Ball with Trail Effect
        const prevBall = prevState.ball;
        const nextBall = nextState.ball;
        if (prevBall && nextBall) {
            // Motor koordinatlarını UI koordinatlarına normalize et
            const prevBallNorm = normalizeCoords(prevBall.x, prevBall.y);
            const nextBallNorm = normalizeCoords(nextBall.x, nextBall.y);

            const ballX = lerp(prevBallNorm.x, nextBallNorm.x, alpha);
            const ballY = lerp(prevBallNorm.y, nextBallNorm.y, alpha);
            const ballZ = lerp(prevBall.z || 0, nextBall.z || 0, alpha);

            // Update ball trail (only when ball is moving fast)
            const ballSpeed = Math.sqrt(
                Math.pow(nextBall.vx || 0, 2) + Math.pow(nextBall.vy || 0, 2)
            );

            if (ballSpeed > 1.5 && nextBall.ownerId === null && viewMode === '2.5D') {
                // Add to trail (Only in 2.5D) - Use normalized coords for trail
                ballTrail.current.push({ x: ballX, y: ballY, z: ballZ, age: 0 });
                // Keep only last 8 positions
                if (ballTrail.current.length > 8) ballTrail.current.shift();
            } else {
                // Clear trail when ball is slow or possessed or in 2D
                ballTrail.current = [];
            }

            // Draw trail (fading dots)
            ballTrail.current.forEach((point, idx) => {
                point.age++;
                const fade = 1 - (idx / ballTrail.current.length);
                const pos = toScreen(point.x, point.y, point.z, viewMode);
                const trailRadius = 3 * fade * pos.scale;

                ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * fade})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, trailRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            drawBall(ctx, ballX, ballY, ballZ);
        }

        // ========== GOAL FLASH EFFECT ==========
        // ========== GOAL FLASH EFFECT (REMOVED FOR PERFORMANCE) ==========
        if (goalFlash) {
            const goalPos = toScreen(goalFlash === 'AWAY' ? 0 : 100, 50, 0, viewMode);
            // Lightweight pulse text instead of full screen gradient
            ctx.save();
            ctx.font = 'bold 40px "Outfit", sans-serif';
            ctx.fillStyle = goalFlash === 'HOME' ? homeTeam.secondaryColor : awayTeam.secondaryColor;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255,215,0,0.8)';
            ctx.shadowBlur = 20;
            const scale = 1 + Math.sin(Date.now() / 100) * 0.1;
            ctx.translate(goalPos.x, goalPos.y - 60);
            ctx.scale(scale, scale);
            ctx.strokeText("GOAL!", 0, 0);
            ctx.fillText("GOAL!", 0, 0);
            ctx.restore();
        }
    };

    const drawPitch = (ctx: CanvasRenderingContext2D) => {
        // Background
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // 2D MODE PITCH RENDER
        if (viewMode === '2D') {
            const tl = toScreen(0, 0, 0, '2D');
            const br = toScreen(100, 100, 0, '2D');

            const w = br.x - tl.x;
            const h = br.y - tl.y;

            // 1. Draw Striped Grass
            const stripeCount = 12;
            for (let i = 0; i < stripeCount; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#1a472a' : '#235c36';
                const x1 = tl.x + (i / stripeCount) * w;
                const stripeW = (w / stripeCount) + 0.5;
                ctx.fillRect(x1, tl.y, stripeW, h);
            }

            // Lines
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 2;

            // Outer boundary
            ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

            // Center Line
            const midX = (tl.x + br.x) / 2;
            ctx.beginPath();
            ctx.moveTo(midX, tl.y);
            ctx.lineTo(midX, br.y);
            ctx.stroke();

            // Center Circle
            const midY = (tl.y + br.y) / 2;
            ctx.beginPath();
            ctx.arc(midX, midY, 50, 0, Math.PI * 2);
            ctx.stroke();

            // Center Spot
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(midX, midY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Corner Arcs (2D)
            const cornerRad = h * 0.02;
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            // TL
            ctx.beginPath(); ctx.arc(tl.x, tl.y, cornerRad, 0, Math.PI / 2); ctx.stroke();
            // TR
            ctx.beginPath(); ctx.arc(br.x, tl.y, cornerRad, Math.PI / 2, Math.PI); ctx.stroke();
            // BL
            ctx.beginPath(); ctx.arc(tl.x, br.y, cornerRad, -Math.PI / 2, 0); ctx.stroke();
            // BR
            ctx.beginPath(); ctx.arc(br.x, br.y, cornerRad, Math.PI, -Math.PI / 2); ctx.stroke();

            // Penalty Areas
            const draw2DPenalty = (isLeft: boolean) => {
                const xBase = isLeft ? tl.x : br.x;

                // Big Box
                const boxW = w * 0.16;
                const boxH = h * 0.6;
                const boxY = midY - (boxH / 2);

                ctx.strokeRect(isLeft ? xBase : xBase - boxW, boxY, boxW, boxH);

                // Small Box
                const smallW = w * 0.055;
                const smallH = h * 0.3;
                const smallY = midY - (smallH / 2);
                ctx.strokeRect(isLeft ? xBase : xBase - smallW, smallY, smallW, smallH);

                // Penalty Spot
                const spotX = isLeft ? tl.x + (w * 0.11) : br.x - (w * 0.11);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(spotX, midY, 2, 0, Math.PI * 2);
                ctx.fill();

                // D-Arc (Penalty Arc) - Corrected intersection angle and radius
                const dArcAngle = Math.acos(0.60);
                ctx.beginPath();
                ctx.arc(spotX, midY, h * 0.134,
                    isLeft ? -dArcAngle : Math.PI - dArcAngle,
                    isLeft ? dArcAngle : Math.PI + dArcAngle
                );
                ctx.stroke();
            };

            draw2DPenalty(true);
            draw2DPenalty(false);

            // Goals (Simple Rects with Net Pattern)
            const goalH = h * 0.12;
            const goalY1 = midY - (goalH / 2);
            const goalDepth = 6;

            const drawGoal = (isLeft: boolean) => {
                const x = isLeft ? tl.x - goalDepth : br.x;
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(x, goalY1, goalDepth, goalH);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(x, goalY1, goalDepth, goalH);

                // Net lines
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1;
                for (let i = 1; i < 4; i++) {
                    const gx = x + (i * goalDepth / 4);
                    ctx.beginPath(); ctx.moveTo(gx, goalY1); ctx.lineTo(gx, goalY1 + goalH); ctx.stroke();
                }
            };

            drawGoal(true);
            drawGoal(false);

            return;
        }

        // Get corner positions for the trapezoid pitch
        const topLeft = toScreen(0, 0, 0, '2.5D');
        const topRight = toScreen(100, 0, 0, '2.5D');
        const bottomLeft = toScreen(0, 100, 0, '2.5D');
        const bottomRight = toScreen(100, 100, 0, '2.5D');

        // 1. Draw Grass with perspective stripes
        ctx.save();

        // Create clipping path for the trapezoid
        ctx.beginPath();
        ctx.moveTo(topLeft.x, topLeft.y);
        ctx.lineTo(topRight.x, topRight.y);
        ctx.lineTo(bottomRight.x, bottomRight.y);
        ctx.lineTo(bottomLeft.x, bottomLeft.y);
        ctx.closePath();
        ctx.clip();

        // Draw striped grass
        const stripeCount = 12;
        for (let i = 0; i < stripeCount; i++) {
            const x1 = (i / stripeCount) * 100;
            const x2 = ((i + 1) / stripeCount) * 100;

            const tl = toScreen(x1, 0, 0, '2.5D');
            const tr = toScreen(x2, 0, 0, '2.5D');
            const bl = toScreen(x1, 100, 0, '2.5D');
            const br = toScreen(x2, 100, 0, '2.5D');

            ctx.fillStyle = i % 2 === 0 ? PITCH_COLOR_1 : PITCH_COLOR_2;
            ctx.beginPath();
            ctx.moveTo(tl.x, tl.y);
            ctx.lineTo(tr.x, tr.y);
            ctx.lineTo(br.x, br.y);
            ctx.lineTo(bl.x, bl.y);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // 2. Draw pitch lines
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Outer boundary
        ctx.beginPath();
        ctx.moveTo(topLeft.x, topLeft.y);
        ctx.lineTo(topRight.x, topRight.y);
        ctx.lineTo(bottomRight.x, bottomRight.y);
        ctx.lineTo(bottomLeft.x, bottomLeft.y);
        ctx.closePath();
        ctx.stroke();

        // Corner Arcs (2.5D)
        const drawCornerArc = (x: number, y: number, startAngle: number, endAngle: number) => {
            const center = toScreen(x, y, 0, '2.5D');
            const radius = 15;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, radius, radius * PERSPECTIVE_RATIO, 0, startAngle, endAngle);
            ctx.stroke();
        };
        drawCornerArc(0, 0, 0, Math.PI / 2);
        drawCornerArc(100, 0, Math.PI / 2, Math.PI);
        drawCornerArc(0, 100, -Math.PI / 2, 0);
        drawCornerArc(100, 100, Math.PI, -Math.PI / 2);

        // Halfway line (vertical in game coords = horizontal visually)
        const halfTop = toScreen(50, 0, 0, '2.5D');
        const halfBottom = toScreen(50, 100, 0, '2.5D');
        ctx.beginPath();
        ctx.moveTo(halfTop.x, halfTop.y);
        ctx.lineTo(halfBottom.x, halfBottom.y);
        ctx.stroke();

        // Center circle (ellipse due to perspective)
        const center = toScreen(50, 50, 0, '2.5D');
        const radiusY = 50 * PERSPECTIVE_RATIO * 0.14;
        const radiusX = 55;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Center spot
        ctx.fillStyle = LINE_COLOR;
        ctx.beginPath();
        ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Penalty areas (both sides)
        const drawPenaltyArea = (isLeft: boolean) => {
            const xBase = isLeft ? 0 : 100;
            const xPenalty = isLeft ? 16 : 84;
            const xSmall = isLeft ? 5.5 : 94.5;
            const xSpot = isLeft ? 11 : 89;

            // Big box corners
            const boxTL = toScreen(xBase, 21, 0, '2.5D');
            const boxTR = toScreen(xPenalty, 21, 0, '2.5D');
            const boxBL = toScreen(xBase, 79, 0, '2.5D');
            const boxBR = toScreen(xPenalty, 79, 0, '2.5D');

            ctx.beginPath();
            ctx.moveTo(boxTL.x, boxTL.y);
            ctx.lineTo(boxTR.x, boxTR.y);
            ctx.lineTo(boxBR.x, boxBR.y);
            ctx.lineTo(boxBL.x, boxBL.y);
            ctx.stroke();

            // Small box
            const smallTL = toScreen(xBase, 37, 0, '2.5D');
            const smallTR = toScreen(xSmall, 37, 0, '2.5D');
            const smallBL = toScreen(xBase, 63, 0, '2.5D');
            const smallBR = toScreen(xSmall, 63, 0, '2.5D');

            ctx.beginPath();
            ctx.moveTo(smallTL.x, smallTL.y);
            ctx.lineTo(smallTR.x, smallTR.y);
            ctx.lineTo(smallBR.x, smallBR.y);
            ctx.lineTo(smallBL.x, smallBL.y);
            ctx.stroke();

            // Penalty spot
            const spot = toScreen(xSpot, 50, 0, '2.5D');
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // D-Arc
            const dRadX = 55;
            const dRadY = 50 * PERSPECTIVE_RATIO * 0.14;
            const dAngle = 0.93; // Math.acos(0.6) approx
            ctx.beginPath();
            ctx.ellipse(spot.x, spot.y, dRadX, dRadY, 0,
                isLeft ? -dAngle : Math.PI - dAngle,
                isLeft ? dAngle : Math.PI + dAngle
            );
            ctx.stroke();
        };

        drawPenaltyArea(true);
        drawPenaltyArea(false);

        // 3. Draw 3D Goals
        const drawGoal3D = (isLeft: boolean) => {
            const xBase = isLeft ? -2 : 102;
            const xBack = isLeft ? -6 : 106;
            const yTop = 44;
            const yBottom = 56;
            const goalHeight = 15; // Visual height in pixels

            // Goal posts (front)
            const frontTop = toScreen(isLeft ? 0 : 100, yTop, 0, '2.5D');
            const frontBottom = toScreen(isLeft ? 0 : 100, yBottom, 0, '2.5D');

            // Goal posts (back)
            const backTop = toScreen(xBack, yTop, 0, '2.5D');
            const backBottom = toScreen(xBack, yBottom, 0, '2.5D');

            // Draw net (back panel)
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;

            // Horizontal net lines
            for (let y = yTop; y <= yBottom; y += 2) {
                const left = toScreen(xBack, y, 0, '2.5D');
                const right = toScreen(isLeft ? 0 : 100, y, 0, '2.5D');
                ctx.beginPath();
                ctx.moveTo(left.x, left.y - goalHeight);
                ctx.lineTo(right.x, right.y - goalHeight);
                ctx.stroke();
            }

            // Vertical net lines
            for (let i = 0; i <= 4; i++) {
                const x = isLeft ? xBack + (i * 1.5) : xBack - (i * 1.5);
                const top = toScreen(x, yTop, 0, '2.5D');
                const bottom = toScreen(x, yBottom, 0, '2.5D');
                ctx.beginPath();
                ctx.moveTo(top.x, top.y - goalHeight);
                ctx.lineTo(bottom.x, bottom.y - goalHeight);
                ctx.stroke();
            }

            // Side nets
            ctx.beginPath();
            ctx.moveTo(frontTop.x, frontTop.y);
            ctx.lineTo(frontTop.x, frontTop.y - goalHeight);
            ctx.lineTo(backTop.x, backTop.y - goalHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(frontBottom.x, frontBottom.y);
            ctx.lineTo(frontBottom.x, frontBottom.y - goalHeight);
            ctx.lineTo(backBottom.x, backBottom.y - goalHeight);
            ctx.stroke();

            // Goal frame (crossbar and posts)
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;

            // Front posts (vertical)
            ctx.beginPath();
            ctx.moveTo(frontTop.x, frontTop.y);
            ctx.lineTo(frontTop.x, frontTop.y - goalHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(frontBottom.x, frontBottom.y);
            ctx.lineTo(frontBottom.x, frontBottom.y - goalHeight);
            ctx.stroke();

            // Crossbar
            ctx.beginPath();
            ctx.moveTo(frontTop.x, frontTop.y - goalHeight);
            ctx.lineTo(frontBottom.x, frontBottom.y - goalHeight);
            ctx.stroke();

            // Ground line of goal mouth
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(frontTop.x, frontTop.y);
            ctx.lineTo(frontBottom.x, frontBottom.y);
            ctx.stroke();
        };

        drawGoal3D(true);
        drawGoal3D(false);
    };

    const drawPlayer = (
        ctx: CanvasRenderingContext2D,
        xPct: number, yPct: number, z: number, facing: number,
        primary: string, secondary: string, num: number,
        hasBall: boolean, name: string, stamina: number, state: string,
        signal?: { type: string, targetId?: string }
    ) => {
        // 2D MODE PLAYER RENDER
        if (viewMode === '2D') {
            const pos = toScreen(xPct, yPct, 0, '2D');
            const radius = 8;

            ctx.save();

            // Player Circle
            ctx.fillStyle = primary;
            ctx.strokeStyle = secondary;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Number
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num.toString(), pos.x, pos.y);

            // === SIGNAL EMOJIS (2D) ===
            if (signal) {
                let icon = '';
                if (signal.type === 'CALL') icon = '☝️';
                else if (signal.type === 'POINT') icon = '👉';
                else if (signal.type === 'HOLD') icon = '✊';

                if (icon) {
                    ctx.font = '16px Arial';
                    // Bounce animation
                    const bounce = Math.sin(Date.now() / 150) * 3;
                    ctx.fillText(icon, pos.x, pos.y - 18 + bounce);
                }
            }

            // === SIGNAL EMOJIS (2D) ===
            // This is new: Show signals (Call, Point, Hold)
            // Need to pass "signal" prop or access logic similar to how we access state
            // Ideally we need to access: activeEngine?.playerStates[player.id]?.outgoingSignal
            // But we don't have direct access to 'activeEngine' inside drawPlayer easily unless we pass it.
            // However, we passed 'state' string.
            // Let's check how 'state' is passed. It is passed from 'drawPitch'.
            // Accessing 'nextTickState' inside drawPlayer? No, drawPlayer is called BY drawPitch.
            // We should modify 'drawPitch' first to extract the signal and pass it to 'drawPlayer'.

            // Wait, I can't modify drawPitch easily without viewing it.
            // I'll assume I can just use a placeholder here for now or I need to View drawPitch first.
            // Actually, the user instruction says: // MatchCenter.tsx içinde drawPlayer fonksiyonunun içinde...
            // It assumes I can get the signal.
            // But 'drawPlayer' arguments list (see view_code_item in step 1229) is: 
            // (ctx, xPct, yPct, z, facing, primary, secondary, num, hasBall, name, stamina, state)

            // It does NOT have 'signal'.
            // I need to modify drawPitch loop to pass 'signal' to 'drawPlayer'.
            // And then modify 'drawPlayer' signature.

            // This is a 2-step process. 
            // 1. View 'drawPitch' to see how it calls 'drawPlayer'.
            // 2. Modify both.

            // Let's abort this Replace for a moment and just View 'drawPitch'.


            // Name Label (Simple)
            if (hasBall) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText(name, pos.x, pos.y - 12);
            }

            ctx.restore();
            return;
        }

        // 2.5D Coordinate transformation
        const pos = toScreen(xPct, yPct, 0, '2.5D');
        const cx = pos.x;
        const groundY = pos.y; // Shadow always here
        const scale = pos.scale;
        const baseRadius = 9; // Reduced from 12
        let radius = baseRadius * scale;
        const playerHeight = 6 * scale; // Reduced from 8

        // Calculate Body Y based on Jump Height (Z)
        // Z usually goes 0 to 2-3 meters. We scale it up for pixels.
        const jumpOffset = z * 8 * scale; // Reduced from 10
        const bodyCenterY = groundY - jumpOffset;

        ctx.save();

        // TACKLE EFFECT: Flatten the player
        let scaleX = 1;
        let scaleY = 1;
        if (state === 'TACKLE') {
            scaleX = 1.3;
            scaleY = 0.6;

            // Dust effect for sliding
            if (Math.random() > 0.5) {
                ctx.fillStyle = 'rgba(200,200,200,0.3)';
                const dustX = cx - (Math.cos(facing) * radius * 1.5);
                const dustY = groundY - (Math.sin(facing) * radius * 1.5);
                ctx.beginPath();
                ctx.arc(dustX, dustY, radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Sprint Effect (glow around player)
        if (state === 'SPRINT') {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(cx, groundY, radius + 5, (radius + 5) * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground Shadow (ellipse, flattened) - ALWAYS ON GROUND
        ctx.fillStyle = `rgba(0,0,0,${Math.max(0.1, 0.4 - (z * 0.1))})`; // Shadow fades as you jump higher
        ctx.beginPath();
        // Shadow grows slightly smaller as you jump
        const shadowScale = Math.max(0.5, 1 - (z * 0.2));
        ctx.ellipse(cx + 2, groundY + 2, radius * 1.1 * shadowScale, radius * 0.5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Player Body (main circle raised up)
        const bodyY = bodyCenterY - playerHeight;

        // Body gradient for 3D effect
        const bodyGrad = ctx.createRadialGradient(cx - radius * 0.3, bodyY - radius * 0.3, 0, cx, bodyY, radius);
        bodyGrad.addColorStop(0, primary);
        bodyGrad.addColorStop(1, shadeColor(primary, -30));

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();

        if (state === 'TACKLE') {
            // Draw flattened body
            ctx.ellipse(cx, bodyY + (radius * 0.3), radius * scaleX, radius * scaleY, facing, 0, Math.PI * 2);
        } else {
            ctx.arc(cx, bodyY, radius, 0, Math.PI * 2);
        }
        ctx.fill();

        // Body outline
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Head (smaller circle above body)
        // If tackling, head is lower/offset
        let headY = bodyY - radius * 0.7;
        let headX = cx;

        if (state === 'TACKLE') {
            headY = bodyY; // Head lower
            headX = cx + (Math.cos(facing) * radius * 0.5); // Head forward
        }

        const headRadius = radius * 0.4;
        ctx.fillStyle = '#f5deb3'; // Skin tone
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Jersey Number
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(10 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Removed heavy shadowBlur for performance
        // ctx.shadowColor = 'rgba(0,0,0,0.8)';
        // ctx.shadowBlur = 2;
        ctx.fillText(num.toString(), cx, bodyY + 1);
        ctx.shadowBlur = 0;

        // === SIGNAL EMOJIS (2.5D) ===
        if (signal) {
            let icon = '';
            if (signal.type === 'CALL') icon = '✋';
            else if (signal.type === 'POINT') icon = '👉';
            else if (signal.type === 'HOLD') icon = '✋🏻';

            if (icon) {
                ctx.font = `bold ${Math.round(16 * scale)}px Arial`;
                // Bounce animation
                const bounce = Math.sin(Date.now() / 150) * 3;
                ctx.fillText(icon, cx, headY - headRadius - 20 * scale + bounce);
            }
        }

        // Stamina indicator (small arc under player)
        const staminaColor = stamina > 50 ? '#22c55e' : stamina > 25 ? '#eab308' : '#ef4444';
        ctx.strokeStyle = staminaColor;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(cx, groundY, radius * 0.8, 0, Math.PI * 2 * (stamina / 100));
        ctx.stroke();

        // Name Label (only if has ball or active)
        if (hasBall || state === 'SPRINT') {
            ctx.font = `bold ${Math.round(9 * scale)}px sans-serif`;
            ctx.fillStyle = '#fff';
            // Removed heavy shadowBlur for performance
            // ctx.shadowColor = '#000';
            // ctx.shadowBlur = 3; 
            // interact with text stroke instead for cheaper outline
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(name, cx, headY - headRadius - 6);
            ctx.fillText(name, cx, headY - headRadius - 6);
            ctx.shadowBlur = 0;
        }

        // Ball indicator (if player has ball)
        if (hasBall) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(cx + radius + 4, bodyY, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    // Helper to darken/lighten colors
    const shadeColor = (color: string, percent: number): string => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    const drawBall = (ctx: CanvasRenderingContext2D, xPct: number, yPct: number, z: number) => {
        // 2D BALL
        if (viewMode === '2D') {
            const pos = toScreen(xPct, yPct, 0, '2D');
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            return;
        }

        // 2.5D Coordinate transformation
        const pos = toScreen(xPct, yPct, z, '2.5D');
        const groundPos = toScreen(xPct, yPct, 0, '2.5D');
        const scale = pos.scale;
        const baseRadius = 4; // Reduced from 5
        const radius = baseRadius * scale;

        // Shadow (gets smaller and lighter as ball goes higher)
        const shadowScale = Math.max(0.4, 1 - (z / 10));
        const shadowAlpha = Math.max(0.1, 0.4 - (z / 15));

        ctx.save();

        // Draw Shadow at Ground Position (ellipse for perspective)
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(groundPos.x + 2, groundPos.y + 1, radius * 1.3 * shadowScale, radius * 0.6 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Ball at Air Position
        const grad = ctx.createRadialGradient(pos.x - 1.5, pos.y - 1.5, 1, pos.x, pos.y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#e5e5e5');
        grad.addColorStop(1, '#94a3b8');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    };

    const myTeam = managedSide === 'HOME' ? homeTeam : awayTeam;
    const myPlayers = managedSide === 'HOME' ? homePlayers : awayPlayers;
    const statusText = match.liveData?.lastActionText || 'Waiting...';

    // Merge live stamina data into players for the management view
    const livePlayers = myPlayers.map(p => {
        const simP = nextTickState.current?.players?.[p.id];
        if (simP && simP.stamina !== undefined) {
            return { ...p, condition: Math.floor(simP.stamina) };
        }
        return p;
    });

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden animate-fade-in">

            {/* TACTICAL MODAL OVERLAY */}
            {showTacticsModal && (
                <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md p-4 md:p-6 flex flex-col animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                            <Settings className="text-emerald-500" /> Management
                        </h2>



                        <button onClick={() => { setShowTacticsModal(false); setSpeed(1); }} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-900 rounded-xl border border-slate-700 p-2 md:p-4 custom-scrollbar">
                        <TeamManagement
                            team={myTeam}
                            players={livePlayers}
                            opponent={managedSide === 'HOME' ? awayTeam : homeTeam}
                            onUpdateTactic={(tactic) => onUpdateTactic(tactic, { minute: match.currentMinute, score: { home: match.homeScore, away: match.awayScore } }, myTeam.id)}
                            onPlayerClick={onPlayerClick}
                            onUpdateLineup={(id, status) => { }}
                            onSwapPlayers={onSubstitute}
                            onAutoFix={onAutoFix}
                            matchStatus={{
                                minute: match.currentMinute,
                                score: { home: match.homeScore, away: match.awayScore },
                                isHome: managedSide === 'HOME'
                            }}
                            t={t}
                        />
                        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-200 text-xs md:text-sm flex items-center gap-2">
                            <Users size={16} /> Note: Changes apply instantly. Stamina affects player ratings live.
                        </div>
                    </div>
                </div >
            )}

            {/* TOP BAR: SCOREBOARD (Hidden on small landscape) */}
            <div className={`h-16 md:h-24 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-8 relative z-20 shrink-0 shadow-2xl ${isSmallLandscape ? 'hidden' : 'flex'}`}>
                {/* Home Team */}
                <div className="flex items-center gap-2 md:gap-4 w-1/3">
                    <TeamLogo
                        team={homeTeam}
                        className="w-10 h-10 md:w-16 md:h-16 rounded-lg border-2 md:border-4 border-slate-600 bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg"
                    />
                    <div className="hidden xs:block">
                        <h1 className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter truncate max-w-[80px] md:max-w-full">{homeTeam.name}</h1>
                    </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center justify-center">
                    <div className="bg-black/50 border border-slate-700 rounded-lg px-4 md:px-8 py-1 md:py-2 flex items-center gap-3 md:gap-6 backdrop-blur-sm">
                        <span className="text-2xl md:text-5xl font-mono font-bold text-white">{match.homeScore}</span>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] md:text-xs text-red-500 font-bold uppercase tracking-widest animate-pulse">LIVE</span>
                            <span className="text-slate-500 text-lg md:text-xl font-bold">:</span>
                        </div>
                        <span className="text-2xl md:text-5xl font-mono font-bold text-white">{match.awayScore}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded text-[10px] md:text-sm font-mono border border-emerald-500/30">
                            {match.currentMinute}'
                        </div>
                        <div className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded text-[10px] md:text-sm font-mono border border-slate-600/30 flex items-center gap-1">
                            <span className="text-[8px] md:text-xs">👥</span>
                            {Math.floor(match.attendance).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-2 md:gap-4 w-1/3 justify-end text-right">
                    <div className="hidden xs:block">
                        <h1 className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter truncate max-w-[80px] md:max-w-full">{awayTeam.name}</h1>
                    </div>
                    <TeamLogo
                        team={awayTeam}
                        className="w-10 h-10 md:w-16 md:h-16 rounded-lg border-2 md:border-4 border-slate-600 bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg"
                    />
                </div>
            </div>

            {/* MOBILE TABS (Hidden on small landscape) */}
            <div className={`lg:hidden flex bg-slate-900 border-b border-slate-800 h-10 shrink-0 ${isSmallLandscape ? 'hidden' : 'flex'}`}>
                <button onClick={() => setActiveTab('PITCH')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'PITCH' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><MonitorPlay size={14} /> Pitch</button>
                <button onClick={() => setActiveTab('FEED')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'FEED' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><List size={14} /> Feed</button>
                <button onClick={() => setActiveTab('STATS')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'STATS' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><BarChart2 size={14} /> Stats</button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden bg-black relative">

                {/* 1. MATCH FEED SIDEBAR (Hidden on small landscape phones) */}
                <div className={`w-full lg:w-72 bg-slate-900 border-r border-slate-800 flex-col z-10 shrink-0 ${isSmallLandscape ? 'hidden' : (activeTab === 'FEED' ? 'flex' : 'hidden lg:flex')}`}>
                    <div className="p-3 bg-slate-950 border-b border-slate-800 font-bold text-slate-400 uppercase text-xs tracking-wider hidden lg:flex items-center gap-2">
                        <List size={14} /> Match Feed
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {[...match.events].reverse().map((ev, idx) => (
                            <div key={idx} className={`text-sm p-3 rounded border-l-2 ${ev.type === 'GOAL' ? 'bg-emerald-900/20 border-emerald-500' : 'bg-slate-800/50 border-slate-600'}`}>
                                <span className="font-bold text-slate-400 mr-2">{ev.minute}'</span>
                                <span className="text-slate-200">{ev.description}</span>
                            </div>
                        ))}
                        {match.events.length === 0 && <div className="text-slate-600 text-center text-xs italic mt-10">Match Starting...</div>}
                    </div>
                </div>

                {/* 2. PITCH VIEW (Full screen in small landscape) */}
                <div className={`flex-1 relative flex items-center justify-center bg-slate-950 p-2 md:p-4 ${isSmallLandscape ? 'flex p-0' : (activeTab === 'PITCH' ? 'flex' : 'hidden lg:flex')}`}>

                    {/* TOAST NOTIFICATIONS - Fixed position overlay */}
                    <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-[90%] max-w-md">
                        {toasts.map((toast, idx) => (
                            <div
                                key={toast.id}
                                className={`animate-pulse px-3 py-2 rounded-lg border backdrop-blur-md flex items-center gap-2 text-xs md:text-sm shadow-lg transition-all duration-300 ${toast.type === 'GOAL'
                                    ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100'
                                    : toast.type === 'SUB' && toast.message.includes('📋')
                                        ? 'bg-purple-900/90 border-purple-500 text-purple-100' // Tactic change
                                        : toast.type === 'SUB'
                                            ? 'bg-blue-900/90 border-blue-500 text-blue-100'
                                            : toast.type === 'CARD'
                                                ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100'
                                                : 'bg-slate-800/90 border-slate-600 text-slate-200'
                                    }`}
                                style={{
                                    animation: 'slideIn 0.3s ease-out',
                                    opacity: 1 - (idx * 0.15)
                                }}
                            >
                                <span className="font-mono font-bold text-[10px] md:text-xs bg-black/30 px-1.5 py-0.5 rounded">
                                    {toast.minute}'
                                </span>
                                <span className={`font-bold text-[10px] md:text-xs ${toast.team === 'HOME' ? 'text-white' : 'text-slate-300'}`}>
                                    {toast.team === 'HOME' ? homeTeam.shortName : awayTeam.shortName}
                                </span>
                                <span className="flex-1 truncate">{toast.message}</span>
                                {toast.type === 'GOAL' && <span className="text-lg">⚽</span>}
                                {toast.type === 'SUB' && !toast.message.includes('📋') && <span className="text-sm">🔄</span>}
                                {toast.type === 'CARD' && <span className="text-sm">🟨</span>}
                            </div>
                        ))}
                    </div>

                    {/* ACTION HUD (Small Landscape only) */}
                    {isSmallLandscape && (
                        <div className="absolute inset-0 z-40 pointer-events-none">
                            {/* Floating Scoreboard HUD (Top Center) */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 scale-90">
                                    <span className="text-white font-mono font-black text-lg">{match.homeScore}</span>
                                    <span className="text-emerald-400 font-mono font-bold text-xs bg-black/40 px-1.5 rounded-lg">{match.currentMinute}'</span>
                                    <span className="text-white font-mono font-black text-lg">{match.awayScore}</span>
                                </div>
                            </div>

                            {/* Top Left: Play Controls */}
                            <div className="absolute top-2 left-2 flex gap-2 pointer-events-auto scale-90 origin-top-left">
                                <button onClick={() => setSpeed(speed === 0 ? 1 : 0)} className="w-8 h-8 rounded-full bg-black/60 border border-slate-700 flex items-center justify-center text-white">
                                    {speed === 0 ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                                </button>
                                <button onClick={() => setSpeed(speed === 4 ? 1 : speed * 2)} className={`w-8 h-8 rounded-full bg-black/60 border border-slate-700 flex items-center justify-center font-bold text-[10px] ${speed > 1 ? 'text-emerald-400' : 'text-white'}`}>
                                    {speed}x
                                </button>
                            </div>

                            {/* Top Right: Actions (Exit + Settings) */}
                            <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto scale-90 origin-top-right">
                                <button onClick={() => setViewMode(viewMode === '2D' ? '2.5D' : '2D')} className="w-8 h-8 rounded-full bg-blue-600/80 border border-blue-400/30 flex items-center justify-center text-white font-bold text-[10px]">
                                    {viewMode}
                                </button>
                                <button onClick={() => setUseDefaultColors(!useDefaultColors)} className={`w-8 h-8 rounded-full border flex items-center justify-center text-white ${useDefaultColors ? 'bg-emerald-600/80 border-emerald-400/30' : 'bg-slate-700/80 border-slate-500/30'}`}>
                                    <Palette size={14} />
                                </button>
                                <button onClick={() => { setSpeed(0); setShowTacticsModal(true); }} className="w-8 h-8 rounded-full bg-purple-600/80 border border-purple-400/30 flex items-center justify-center text-white">
                                    <Settings size={14} />
                                </button>
                                <button onClick={() => { setSpeed(0); setShowExitModal(true); }} className="w-8 h-8 flex items-center justify-center bg-red-900/50 text-white rounded-full border border-red-500/30">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Toast (Standard Mode - hidden on small landscape) */}
                    <div className={`absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none ${isSmallLandscape ? 'hidden' : 'block'}`}>
                        <div className="bg-black/70 backdrop-blur-md text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-slate-600 shadow-2xl flex items-center gap-2 md:gap-3">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-ping"></div>
                            <span className="font-bold uppercase tracking-wide text-[10px] md:text-sm whitespace-nowrap">{statusText}</span>
                        </div>
                    </div>

                    {/* LANDSCAPE MODE: Side Panels with Team Info */}
                    {isSmallLandscape && (
                        <>
                            {/* Left Side - Home Team */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 flex flex-col items-center justify-center gap-0.5 bg-gradient-to-r from-slate-900/90 to-transparent z-20 pointer-events-none py-2">
                                <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-600 p-0.5 flex items-center justify-center">
                                    <img
                                        src={getTeamLogo(homeTeam?.name || '')}
                                        alt=""
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            const fallback = (homeTeam?.name || 'H')[0];
                                            (e.target as HTMLImageElement).outerHTML = `<span class="text-lg font-bold" style="color: ${homeTeam?.primaryColor || '#fff'}">${fallback}</span>`;
                                        }}
                                    />
                                </div>
                                <div className="text-white font-black text-lg leading-tight">{match.homeScore}</div>
                                <div className="text-[7px] text-emerald-400 font-bold">{match.stats?.homePossession || 50}%</div>
                                <div className="text-[7px] text-slate-500">xG {match.stats?.homeXG?.toFixed(1) || '0.0'}</div>
                            </div>

                            {/* Right Side - Away Team */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-14 flex flex-col items-center justify-center gap-0.5 bg-gradient-to-l from-slate-900/90 to-transparent z-20 pointer-events-none py-2">
                                <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-600 p-0.5 flex items-center justify-center">
                                    <img
                                        src={getTeamLogo(awayTeam?.name || '')}
                                        alt=""
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            const fallback = (awayTeam?.name || 'A')[0];
                                            (e.target as HTMLImageElement).outerHTML = `<span class="text-lg font-bold" style="color: ${awayTeam?.primaryColor || '#fff'}">${fallback}</span>`;
                                        }}
                                    />
                                </div>
                                <div className="text-white font-black text-lg leading-tight">{match.awayScore}</div>
                                <div className="text-[7px] text-emerald-400 font-bold">{match.stats?.awayPossession || 50}%</div>
                                <div className="text-[7px] text-slate-500">xG {match.stats?.awayXG?.toFixed(1) || '0.0'}</div>
                            </div>
                        </>
                    )}

                    {/* Canvas Container with Fixed Aspect Ratio */}
                    <div
                        ref={containerRef}
                        className="relative w-full h-full flex items-center justify-center overflow-hidden"
                    >
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_W}
                            height={CANVAS_H}
                            className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg border-2 md:border-4 border-slate-800 bg-slate-900 ${isSmallLandscape ? 'rounded-none border-0' : ''}`}
                            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
                        />

                        {/* SET PIECE INDICATOR - Bottom left, compact */}
                        {setPieceIndicator && (
                            <div className="absolute bottom-4 left-4 pointer-events-none animate-pulse">
                                <div className={`px-3 py-1.5 rounded-lg font-bold text-xs md:text-sm shadow-lg backdrop-blur-sm ${setPieceIndicator.type === 'FOUL' ? 'bg-red-600/90 text-white' :
                                    setPieceIndicator.type === 'FREE_KICK' ? 'bg-yellow-500/90 text-black' :
                                        setPieceIndicator.type === 'CORNER' ? 'bg-orange-500/90 text-white' :
                                            setPieceIndicator.type === 'THROW_IN' ? 'bg-blue-500/90 text-white' :
                                                setPieceIndicator.type === 'KICKOFF' ? 'bg-emerald-500/90 text-white' :
                                                    'bg-slate-700/90 text-white'
                                    }`}>
                                    {setPieceIndicator.message}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. STATS SIDEBAR (Hidden on small landscape phones) */}
                <div className={`w-full lg:w-72 bg-slate-900 border-l border-slate-800 flex-col z-10 shrink-0 ${isSmallLandscape ? 'hidden' : (activeTab === 'STATS' ? 'flex' : 'hidden lg:flex')}`}>
                    <div className="p-3 bg-slate-950 border-b border-slate-800 font-bold text-slate-400 uppercase text-xs tracking-wider hidden lg:flex items-center gap-2">
                        <BarChart2 size={14} /> Live Stats
                    </div>
                    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
                        <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase font-bold">Possession</div>
                            <div className="flex h-1.5 md:h-2 rounded-full overflow-hidden bg-slate-800">
                                <div className="bg-emerald-600" style={{ width: `${match.stats.homePossession}%` }}></div>
                                <div className="bg-blue-600" style={{ width: `${match.stats.awayPossession}%` }}></div>
                            </div>
                            <div className="flex justify-between text-base md:text-lg font-bold text-white mt-1">
                                <span>{match.stats.homePossession}%</span>
                                <span>{match.stats.awayPossession}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                            <div className="text-xl md:text-2xl font-bold text-white">{match.stats.homeShots}</div>
                            <div className="text-[9px] md:text-xs text-slate-500 uppercase flex items-center justify-center">Shots</div>
                            <div className="text-xl md:text-2xl font-bold text-white">{match.stats.awayShots}</div>

                            <div className="text-lg md:text-xl font-bold text-emerald-400">{match.stats.homeOnTarget}</div>
                            <div className="text-[9px] md:text-xs text-slate-500 uppercase flex items-center justify-center">Target</div>
                            <div className="text-lg md:text-xl font-bold text-blue-400">{match.stats.awayOnTarget}</div>

                            <div className="text-base md:text-lg font-bold text-slate-300">{match.stats.homeXG.toFixed(2)}</div>
                            <div className="text-[9px] md:text-xs text-slate-500 uppercase flex items-center justify-center">xG</div>
                            <div className="text-base md:text-lg font-bold text-slate-300">{match.stats.awayXG.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

            </div >

            {/* FOOTER CONTROLS (Optimized for Mobile) - Added pb-[100px] for AdMob banner space */}
            < div className="h-16 md:h-24 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-2 md:px-6 shrink-0 z-30 portrait:flex landscape:hidden landscape:md:flex safe-area-bottom mb-[100px] portrait:mb-[100px] landscape:mb-0" >
                <button
                    onClick={() => { setSpeed(0); setShowExitModal(true); }}
                    className="flex flex-col items-center justify-center gap-1 w-10 h-10 md:w-14 md:h-14 rounded-xl bg-slate-800 active:bg-red-900/80 text-slate-400 active:text-white transition-colors border border-slate-700 active:border-red-500"
                >
                    <LogOut size={16} className="md:w-5 md:h-5" /> <span className="hidden md:inline font-bold text-[9px] uppercase">Exit</span>
                </button>

                <div className="flex items-center gap-1 md:gap-3 bg-black/40 p-1 md:p-2 rounded-xl md:rounded-2xl border border-slate-700 backdrop-blur-md shadow-xl">
                    <button
                        onClick={() => setSpeed(speed === 0 ? 1 : 0)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${speed === 0 ? 'bg-emerald-500 text-white shadow-emerald-900/50' : 'bg-slate-700 text-slate-300'}`}
                    >
                        {speed === 0 ? <Play size={18} fill="currentColor" className="ml-0.5 md:ml-1 md:w-6 md:h-6" /> : <Pause size={18} fill="currentColor" className="md:w-6 md:h-6" />}
                    </button>

                    <div className="h-6 md:h-8 w-[1px] bg-slate-700 mx-0.5 md:mx-1"></div>

                    <div className="flex gap-0.5 md:gap-1">
                        <button onClick={() => setSpeed(0.5)} className={`w-8 h-8 md:w-10 md:h-10 rounded md:rounded-lg text-[10px] md:text-xs font-black transition-all active:scale-95 ${speed === 0.5 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>0.5</button>
                        <button onClick={() => setSpeed(1)} className={`w-8 h-8 md:w-10 md:h-10 rounded md:rounded-lg text-[10px] md:text-xs font-black transition-all active:scale-95 ${speed === 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>1x</button>
                        <button onClick={() => setSpeed(2)} className={`w-8 h-8 md:w-10 md:h-10 rounded md:rounded-lg text-[10px] md:text-xs font-black transition-all active:scale-95 ${speed === 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>2x</button>
                        <button onClick={() => setSpeed(4)} className={`w-8 h-8 md:w-10 md:h-10 rounded md:rounded-lg text-[10px] md:text-xs font-black transition-all active:scale-95 ${speed === 4 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>4x</button>
                    </div>
                </div>

                <div className="flex gap-2 md:gap-3">
                    <button
                        onClick={() => setViewMode(viewMode === '2D' ? '2.5D' : '2D')}
                        className="flex flex-col items-center justify-center gap-1 w-10 h-10 md:w-14 md:h-14 rounded-xl bg-blue-600 active:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/30 transition-all active:scale-95 border-b-2 md:border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                    >
                        <Layers size={16} className="md:w-5 md:h-5" /> <span className="hidden md:inline text-[9px] uppercase">{viewMode}</span>
                    </button>
                    <button
                        onClick={() => setUseDefaultColors(!useDefaultColors)}
                        className={`flex flex-col items-center justify-center gap-1 w-10 h-10 md:w-14 md:h-14 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 border-b-2 md:border-b-4 active:border-b-0 active:translate-y-1 ${useDefaultColors ? 'bg-emerald-600 active:bg-emerald-500 shadow-emerald-900/30 border-emerald-800' : 'bg-slate-700 active:bg-slate-600 shadow-slate-900/30 border-slate-800'}`}
                    >
                        <Palette size={16} className="md:w-5 md:h-5" /> <span className="hidden md:inline text-[9px] uppercase">Color</span>
                    </button>
                    <button
                        onClick={() => { setSpeed(0); setShowTacticsModal(true); }}
                        className="flex flex-col items-center justify-center gap-1 w-10 h-10 md:w-14 md:h-14 rounded-xl bg-purple-600 active:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/30 transition-all active:scale-95 border-b-2 md:border-b-4 border-purple-800 active:border-b-0 active:translate-y-1"
                    >
                        <Settings size={16} className="md:w-5 md:h-5" /> <span className="hidden md:inline text-[9px] uppercase">Mgmt</span>
                    </button>
                </div>
            </div >

            {/* FULL TIME MODAL */}
            {
                match.isPlayed && (
                    <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center animate-fade-in p-4">
                        <div className="bg-slate-900/90 border border-white/10 p-6 md:p-10 rounded-2xl flex flex-col items-center gap-6 shadow-2xl max-w-lg w-full relative overflow-hidden backdrop-blur-md">
                            {/* Background Effect */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>

                            <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                                FULL TIME
                            </h2>

                            {/* Score Display */}
                            <div className="flex items-center justify-center gap-8 w-full py-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className="text-5xl md:text-7xl font-black text-white leading-none" style={{ textShadow: `0 0 20px ${homeTeam.primaryColor}` }}>
                                        {match.homeScore}
                                    </div>
                                    <div className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider text-center px-2">
                                        {homeTeam.name}
                                    </div>
                                </div>

                                <div className="text-slate-600 text-4xl font-black opacity-50">-</div>

                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className="text-5xl md:text-7xl font-black text-white leading-none" style={{ textShadow: `0 0 20px ${awayTeam.primaryColor}` }}>
                                        {match.awayScore}
                                    </div>
                                    <div className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider text-center px-2">
                                        {awayTeam.name}
                                    </div>
                                </div>
                            </div>

                            {/* Match Stats Mini Summary */}
                            <div className="grid grid-cols-3 gap-4 w-full text-center py-2">
                                <div>
                                    <div className="text-slate-500 text-[10px] uppercase font-bold">Possession</div>
                                    <div className="text-white font-mono">{match.stats.homePossession}% - {match.stats.awayPossession}%</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[10px] uppercase font-bold">Shots</div>
                                    <div className="text-white font-mono">{match.stats.homeShots} - {match.stats.awayShots}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[10px] uppercase font-bold">xG</div>
                                    <div className="text-white font-mono">{match.stats.homeXG.toFixed(1)} - {match.stats.awayXG.toFixed(1)}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => onFinish(match.id)}
                                className="w-full mt-2 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl text-lg shadow-lg shadow-emerald-900/40 hover:shadow-emerald-500/20 transition-all uppercase tracking-widest transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )
            }

            {/* HALF-TIME MODAL */}
            {
                showHalfTime && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-start justify-center pt-8 md:pt-16 pb-20 p-4 animate-fade-in overflow-auto">
                        <div className="bg-slate-900/90 border border-white/10 p-5 md:p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl max-w-md w-full relative overflow-hidden backdrop-blur-md">
                            {/* Decorative Lines */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

                            {/* Half Time Badge */}
                            <div className="bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                                Devre Arası
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                                HALF TIME
                            </h2>

                            {/* Score Display */}
                            <div className="flex items-center justify-center gap-6 w-full py-4 bg-slate-950/50 rounded-xl border border-slate-700/50">
                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <div className="text-4xl md:text-5xl font-black text-white leading-none">
                                        {match.homeScore}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center px-2">
                                        {homeTeam.shortName}
                                    </div>
                                </div>

                                <div className="text-slate-600 text-3xl font-black">-</div>

                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <div className="text-4xl md:text-5xl font-black text-white leading-none">
                                        {match.awayScore}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center px-2">
                                        {awayTeam.shortName}
                                    </div>
                                </div>
                            </div>

                            {/* First Half Stats */}
                            <div className="w-full space-y-3 bg-slate-800/50 rounded-xl p-4">
                                <div className="text-xs text-slate-500 uppercase font-bold text-center mb-2">İlk Yarı İstatistikleri</div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-white w-8 text-right">{match.stats.homePossession}%</span>
                                    <span className="text-slate-500 text-xs">Topa Sahiplik</span>
                                    <span className="font-bold text-white w-8">{match.stats.awayPossession}%</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-white w-8 text-right">{match.stats.homeShots}</span>
                                    <span className="text-slate-500 text-xs">Şutlar</span>
                                    <span className="font-bold text-white w-8">{match.stats.awayShots}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-emerald-400 w-8 text-right">{match.stats.homeOnTarget}</span>
                                    <span className="text-slate-500 text-xs">İsabetli</span>
                                    <span className="font-bold text-emerald-400 w-8">{match.stats.awayOnTarget}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setShowHalfTime(false);
                                        setShowTacticsModal(true);
                                    }}
                                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors text-sm"
                                >
                                    ⚙️ Taktik Değiştir
                                </button>
                                <button
                                    onClick={() => {
                                        setShowHalfTime(false);
                                        // FIX: Jump minute to 46 for 2nd half kickoff
                                        // The match.currentMinute is still 45, we need to sync a minute increment
                                        onSync(match.id, {
                                            minuteIncrement: true, // This will bump minute to 46
                                            event: null,
                                            additionalEvents: [],
                                            trace: [],
                                            liveData: match.liveData,
                                            stats: match.stats
                                        });
                                        setSpeed(1);
                                    }}
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-colors text-sm"
                                >
                                    ▶️ 2. Yarı Başlat
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EXIT CONFIRMATION MODAL */}
            {
                showExitModal && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
                        <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl backdrop-blur-md">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 border-2 border-red-500/50 flex items-center justify-center">
                                    <LogOut size={28} className="text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Maçtan Çıkılsın mı?</h3>
                                <p className="text-slate-400 text-sm">
                                    Maç devam ediyor ({match.currentMinute}'). Çıkarsanız maçın geri kalanı otomatik simüle edilecek.
                                </p>
                            </div>

                            <div className="text-center mb-4 p-3 bg-slate-800 rounded-xl">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 uppercase">{homeTeam.shortName}</div>
                                        <div className="text-2xl font-black text-white">{match.homeScore}</div>
                                    </div>
                                    <div className="text-emerald-400 font-mono text-sm">{match.currentMinute}'</div>
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 uppercase">{awayTeam.shortName}</div>
                                        <div className="text-2xl font-black text-white">{match.awayScore}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExitModal(false)}
                                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={() => {
                                        setShowExitModal(false);
                                        soundManager.stopAll(); // 🔊 Stop sounds before instant finish
                                        onInstantFinish(match.id);
                                    }}
                                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl transition-colors"
                                >
                                    Simüle Et & Çık
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};