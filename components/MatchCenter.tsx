
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Match, Team, Player, MatchEventType, TeamTactic, Translation, LineupStatus } from '../types';
import { Play, Pause, FastForward, SkipForward, X, List, BarChart2, Video, MonitorPlay, Users, Settings, LogOut } from 'lucide-react';
import { TeamManagement } from './TeamManagement';

interface MatchCenterProps {
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    homePlayers: Player[];
    awayPlayers: Player[];
    onTick: (matchId: string) => void;
    onFinish: (matchId: string) => void;
    onInstantFinish: (matchId: string) => void;
    onSubstitute: (playerInId: string, playerOutId: string) => void;
    onUpdateTactic: (tactic: TeamTactic) => void;
    userTeamId: string;
    t: Translation;
    debugLogs: string[];
    onPlayerClick: (player: Player) => void;
}

// Fixed Internal Resolution for crisp rendering (scaled down by CSS)
const CANVAS_W = 1280;
const CANVAS_H = 800;
const PITCH_MARGIN = 60;

// Colors
const PITCH_COLOR_1 = '#1a472a'; // Deep Green
const PITCH_COLOR_2 = '#235c36'; // Lighter Green
const LINE_COLOR = 'rgba(255, 255, 255, 0.8)';

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
    onTick, onFinish, onInstantFinish, onSubstitute, onUpdateTactic, userTeamId, t, onPlayerClick
}) => {
    const [speed, setSpeed] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<'PITCH' | 'FEED' | 'STATS'>('PITCH');
    const [showTacticsModal, setShowTacticsModal] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Logic Loop & Render Loop Refs
    const logicTimerRef = useRef<number | null>(null);
    const renderReqRef = useRef<number | null>(null);

    // State Interpolation Refs
    const lastTickState = useRef<any>(null);
    const nextTickState = useRef<any>(null);
    const lastTickTime = useRef<number>(0);

    // Cache for jersey numbers
    const playerNumbers = useRef<Record<string, number>>({});

    // 1. Initialize & Cleanup
    useEffect(() => {
        // Assign Jersey Numbers
        let hC = 2, aC = 2;
        [...homePlayers, ...awayPlayers].forEach(p => {
            if (p.position === 'GK') playerNumbers.current[p.id] = 1;
            else playerNumbers.current[p.id] = p.teamId === homeTeam.id ? hC++ : aC++;
        });

        // Initialize State
        if (match.liveData?.simulation) {
            const initialState = JSON.parse(JSON.stringify(match.liveData.simulation));
            lastTickState.current = initialState;
            nextTickState.current = initialState;
            lastTickTime.current = performance.now();
        }

        return () => {
            if (logicTimerRef.current) clearInterval(logicTimerRef.current);
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current);
        };
    }, []);

    // 2. Handle Match Data Updates (The "Tick" Receiver)
    useEffect(() => {
        if (match.liveData?.simulation) {
            // Push current "next" to "last"
            lastTickState.current = nextTickState.current
                ? JSON.parse(JSON.stringify(nextTickState.current))
                : match.liveData.simulation;

            // Set new "next"
            nextTickState.current = JSON.parse(JSON.stringify(match.liveData.simulation));
            lastTickTime.current = performance.now();
        }
    }, [match.liveData, match.currentMinute]); // Update when data changes

    // 3. Logic Loop (Triggers the onTick)
    useEffect(() => {
        if (match.isPlayed) {
            setSpeed(0);
            return;
        }

        if (logicTimerRef.current) clearInterval(logicTimerRef.current);

        if (speed > 0) {
            const ms = speed === 2 ? 60 : 120; // 60ms for 2x, 120ms for 1x (SLOWED DOWN)
            logicTimerRef.current = window.setInterval(() => {
                onTick(match.id);
            }, ms);
        }
    }, [speed, match.isPlayed, match.id]);

    // 4. Render Loop (Visuals)
    const render = useCallback(() => {
        if (!canvasRef.current || !lastTickState.current || !nextTickState.current) {
            renderReqRef.current = requestAnimationFrame(render);
            return;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const now = performance.now();
        const tickDuration = speed === 2 ? 60 : 120; // Slowed down
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

        // Draw Pitch
        drawPitch(ctx);

        // Filter Players on Pitch
        const homeStarters = homePlayers.filter(p => p.lineup === 'STARTING');
        const awayStarters = awayPlayers.filter(p => p.lineup === 'STARTING');
        const allPlayers = [...homeStarters, ...awayStarters];

        // Prepare Render Queue (Sort by Y for simple depth)
        const renderQueue = allPlayers.map(p => {
            const prevP = prevState.players[p.id];
            const nextP = nextState.players[p.id];
            if (!prevP || !nextP) return null;

            return {
                player: p,
                x: lerp(prevP.x, nextP.x, alpha),
                y: lerp(prevP.y, nextP.y, alpha),
                facing: lerpAngle(prevP.facing || 0, nextP.facing || 0, alpha),
                stamina: nextP.stamina || 100,
                state: nextP.state || 'IDLE'
            };
        }).filter(item => item !== null).sort((a, b) => a!.y - b!.y);

        // Draw Players
        renderQueue.forEach(item => {
            if (!item) return;
            const isHome = item.player.teamId === homeTeam.id;
            const primary = isHome ? homeTeam.primaryColor : awayTeam.primaryColor;
            const secondary = isHome ? homeTeam.secondaryColor : awayTeam.secondaryColor;
            const num = playerNumbers.current[item.player.id] || 0;
            const hasBall = nextState.ball.ownerId === item.player.id;

            drawPlayer(ctx, item.x, item.y, item.facing, primary, secondary, num, hasBall, item.player.lastName, item.stamina, item.state);
        });

        // Draw Ball
        const prevBall = prevState.ball;
        const nextBall = nextState.ball;
        if (prevBall && nextBall) {
            const ballX = lerp(prevBall.x, nextBall.x, alpha);
            const ballY = lerp(prevBall.y, nextBall.y, alpha);
            const ballZ = lerp(prevBall.z || 0, nextBall.z || 0, alpha);
            drawBall(ctx, ballX, ballY, ballZ);
        }
    };

    const drawPitch = (ctx: CanvasRenderingContext2D) => {
        // Background
        ctx.fillStyle = '#111827'; // Dark Slate BG
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        const w = CANVAS_W - (PITCH_MARGIN * 2);
        const h = CANVAS_H - (PITCH_MARGIN * 2);
        const x = PITCH_MARGIN;
        const y = PITCH_MARGIN;

        // 1. Draw Grass (Clipped Area)
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip(); // Clip grass to strict pitch dimensions

        const segments = 15;
        const segW = w / segments;
        for (let i = 0; i < segments; i++) {
            ctx.fillStyle = i % 2 === 0 ? PITCH_COLOR_1 : PITCH_COLOR_2;
            ctx.fillRect(x + (i * segW), y, segW + 1, h); // +1 to prevent gaps
        }
        ctx.restore(); // Restore context to remove clip for subsequent drawings

        // 2. Draw Lines & Goals (Not Clipped, allowing goals to stick out)
        ctx.save();
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 3;

        // Outer Boundary
        ctx.strokeRect(x, y, w, h);

        // Halfway Line
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.stroke();

        // Center Circle
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 70, 0, Math.PI * 2);
        ctx.stroke();

        // Center Spot
        ctx.fillStyle = LINE_COLOR;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Penalty Areas
        const drawPenaltyBox = (isLeft: boolean) => {
            const boxH = 400;
            const boxW = 160;
            const boxY = y + (h - boxH) / 2;
            const boxX = isLeft ? x : x + w - boxW;

            const smallBoxH = 180;
            const smallBoxW = 55;
            const smallBoxY = y + (h - smallBoxH) / 2;
            const smallBoxX = isLeft ? x : x + w - smallBoxW;

            const spotX = isLeft ? x + 110 : x + w - 110;

            // Box
            ctx.strokeRect(boxX, boxY, boxW, boxH);
            // 6-yard box
            ctx.strokeRect(smallBoxX, smallBoxY, smallBoxW, smallBoxH);

            // Penalty Spot
            ctx.beginPath();
            ctx.arc(spotX, y + h / 2, 3, 0, Math.PI * 2);
            ctx.fill();

            // D-Arc
            ctx.beginPath();
            ctx.arc(spotX, y + h / 2, 70, isLeft ? -0.9 : Math.PI - 0.9, isLeft ? 0.9 : Math.PI + 0.9);
            ctx.stroke();
        };

        drawPenaltyBox(true);
        drawPenaltyBox(false);

        // Corner Arcs
        const cornerR = 20;
        ctx.beginPath(); ctx.arc(x, y, cornerR, 0, Math.PI / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + w, y, cornerR, Math.PI / 2, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + w, y + h, cornerR, Math.PI, Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y + h, cornerR, Math.PI * 1.5, 0); ctx.stroke();

        // --- REALISTIC GOALS (NETS & POSTS) ---
        const drawGoal = (isLeft: boolean) => {
            const goalH = 80; // Scaled relative to canvas
            const goalD = 30; // Depth of goal
            const goalY = y + (h - goalH) / 2;
            const postX = isLeft ? x : x + w;
            const netX = isLeft ? x - goalD : x + w + goalD;

            // Net Pattern (Grid)
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; // More visible net
            ctx.lineWidth = 1;

            // Horizontal Net Lines
            for (let i = 0; i <= goalH; i += 8) {
                ctx.moveTo(postX, goalY + i);
                ctx.lineTo(netX, goalY + i);
            }
            // Vertical Net Lines
            for (let i = 0; i <= goalD; i += 5) {
                const lx = isLeft ? x - i : x + w + i;
                ctx.moveTo(lx, goalY);
                ctx.lineTo(lx, goalY + goalH);
            }
            // Back of Net
            ctx.moveTo(netX, goalY);
            ctx.lineTo(netX, goalY + goalH);
            ctx.stroke();

            // Posts (Thick White Lines)
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';

            // Side Posts
            ctx.beginPath();
            ctx.moveTo(postX, goalY);
            ctx.lineTo(netX, goalY); // Top side bar
            ctx.moveTo(postX, goalY + goalH);
            ctx.lineTo(netX, goalY + goalH); // Bottom side bar
            ctx.stroke();

            // Crossbar (The vertical line on 2D top-down view representing the goal mouth)
            ctx.beginPath();
            ctx.moveTo(postX, goalY - 2);
            ctx.lineTo(postX, goalY + goalH + 2);
            ctx.stroke();
        };

        drawGoal(true);
        drawGoal(false);

        ctx.restore();
    };

    const drawPlayer = (
        ctx: CanvasRenderingContext2D,
        xPct: number, yPct: number, facing: number,
        primary: string, secondary: string, num: number,
        hasBall: boolean, name: string, stamina: number, state: string
    ) => {
        // Convert Pct to Pixels
        const fieldW = CANVAS_W - (PITCH_MARGIN * 2);
        const fieldH = CANVAS_H - (PITCH_MARGIN * 2);
        const cx = PITCH_MARGIN + (xPct / 100) * fieldW;
        const cy = PITCH_MARGIN + (yPct / 100) * fieldH;
        const radius = 13; // SCALED DOWN: Was 16

        ctx.save();
        ctx.translate(cx, cy);

        // Sprint Effect
        if (state === 'SPRINT') {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Vision Cone (Facing)
        ctx.save();
        ctx.rotate(facing);
        const coneGrad = ctx.createLinearGradient(0, 0, 50, 0); // Reduced length
        coneGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
        coneGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 50, -0.5, 0.5); // Reduced width
        ctx.fill();
        ctx.restore();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(2, 4, radius, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jersey (Circle)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = primary;
        ctx.fill();
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 2.5; // Thinner border
        ctx.stroke();

        // Number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif'; // Smaller font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 2;
        ctx.fillText(num.toString(), 0, 1);
        ctx.shadowBlur = 0;

        // Stamina Ring
        const staminaColor = stamina > 50 ? '#22c55e' : stamina > 25 ? '#eab308' : '#ef4444';
        ctx.strokeStyle = staminaColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 3, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (stamina / 100)));
        ctx.stroke();

        // Name Label
        if (hasBall || state !== 'IDLE') {
            ctx.font = 'bold 10px sans-serif'; // Smaller name
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(name, 0, -radius - 10);
        }

        ctx.restore();
    };

    const drawBall = (ctx: CanvasRenderingContext2D, xPct: number, yPct: number, z: number) => {
        const fieldW = CANVAS_W - (PITCH_MARGIN * 2);
        const fieldH = CANVAS_H - (PITCH_MARGIN * 2);
        const groundX = PITCH_MARGIN + (xPct / 100) * fieldW;
        const groundY = PITCH_MARGIN + (yPct / 100) * fieldH;
        const radius = 5; // SCALED DOWN: Was 7

        // 3D Projection: Z moves ball UP on Y axis
        const visualY = groundY - (z * 6);

        // Shadow (gets smaller and lighter as ball goes higher)
        const shadowScale = Math.max(0.4, 1 - (z / 15));
        const shadowAlpha = Math.max(0.1, 0.5 - (z / 20));

        ctx.save();

        // Draw Shadow at Ground Position
        ctx.translate(groundX, groundY);
        ctx.scale(1, 0.6); // Flatten
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5 * shadowScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw Ball at Air Position
        ctx.save();
        ctx.translate(groundX, visualY);

        const grad = ctx.createRadialGradient(-1.5, -1.5, 1.5, 0, 0, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#94a3b8');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    };

    const myTeam = userTeamId === homeTeam.id ? homeTeam : awayTeam;
    const myPlayers = userTeamId === homeTeam.id ? homePlayers : awayPlayers;
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
                            onUpdateTactic={onUpdateTactic}
                            onPlayerClick={onPlayerClick}
                            onUpdateLineup={(id, status) => { }}
                            onSwapPlayers={onSubstitute}
                            t={t}
                        />
                        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-200 text-xs md:text-sm flex items-center gap-2">
                            <Users size={16} /> Note: Changes apply instantly. Stamina affects player ratings live.
                        </div>
                    </div>
                </div>
            )}

            {/* TOP BAR: SCOREBOARD (Hidden on small landscape) */}
            <div className="h-16 md:h-24 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 relative z-20 shrink-0 shadow-2xl landscape:max-h-[50px] landscape:md:max-h-none portrait:flex landscape:hidden landscape:md:flex">
                {/* Home Team */}
                <div className="flex items-center gap-2 md:gap-4 w-1/3">
                    <div className="text-lg md:text-4xl font-black text-slate-800 bg-white w-10 h-10 md:w-16 md:h-16 rounded flex items-center justify-center border-2 md:border-4 border-slate-300" style={{ color: homeTeam.primaryColor, borderColor: homeTeam.secondaryColor }}>
                        {homeTeam.name.substring(0, 1)}
                    </div>
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
                    <div className="mt-1 bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded text-[10px] md:text-sm font-mono border border-emerald-500/30">
                        {match.currentMinute}'
                    </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-2 md:gap-4 w-1/3 justify-end text-right">
                    <div className="hidden xs:block">
                        <h1 className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter truncate max-w-[80px] md:max-w-full">{awayTeam.name}</h1>
                    </div>
                    <div className="text-lg md:text-4xl font-black text-slate-800 bg-white w-10 h-10 md:w-16 md:h-16 rounded flex items-center justify-center border-2 md:border-4 border-slate-300" style={{ color: awayTeam.primaryColor, borderColor: awayTeam.secondaryColor }}>
                        {awayTeam.name.substring(0, 1)}
                    </div>
                </div>
            </div>

            {/* MOBILE TABS (Hidden on small landscape) */}
            <div className="lg:hidden flex bg-slate-900 border-b border-slate-800 h-10 shrink-0 portrait:flex landscape:hidden landscape:md:flex">
                <button onClick={() => setActiveTab('PITCH')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'PITCH' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><MonitorPlay size={14} /> Pitch</button>
                <button onClick={() => setActiveTab('FEED')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'FEED' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><List size={14} /> Feed</button>
                <button onClick={() => setActiveTab('STATS')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'STATS' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><BarChart2 size={14} /> Stats</button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden bg-black relative">

                {/* 1. MATCH FEED SIDEBAR (Hidden on landscape) */}
                <div className={`w-full lg:w-72 bg-slate-900 border-r border-slate-800 flex-col z-10 shrink-0 ${activeTab === 'FEED' ? 'flex' : 'hidden lg:flex'} landscape:hidden landscape:md:flex`}>
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

                {/* 2. PITCH VIEW (Full screen in landscape) */}
                <div className={`flex-1 relative flex items-center justify-center bg-slate-950 p-2 md:p-4 landscape:p-0 ${activeTab === 'PITCH' ? 'flex' : 'hidden lg:flex'}`}>

                    {/* ACTION HUD (Landscape only) */}
                    <div className="hidden landscape:block landscape:md:hidden absolute inset-0 z-40 pointer-events-none">
                        {/* Floating Scoreboard HUD */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <div className="bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-slate-700 flex items-center gap-3">
                                <span className="text-white font-mono font-black text-xl">{match.homeScore}</span>
                                <span className="text-emerald-400 font-mono font-bold text-sm bg-black/40 px-2 rounded-lg">{match.currentMinute}'</span>
                                <span className="text-white font-mono font-black text-xl">{match.awayScore}</span>
                            </div>
                            <div className="mt-1 bg-black/30 backdrop-blur-sm px-3 py-0.5 rounded-full border border-slate-800">
                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{statusText}</span>
                            </div>
                        </div>

                        {/* Corner Actions HUD */}
                        <div className="absolute top-2 right-2 pointer-events-auto">
                            <button onClick={() => onFinish(match.id)} className="p-2 bg-red-900/50 text-white rounded-full border border-red-500/30">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="absolute bottom-2 left-2 flex gap-2 pointer-events-auto">
                            <button onClick={() => setSpeed(speed === 0 ? 1 : 0)} className="w-8 h-8 rounded-full bg-black/60 border border-slate-700 flex items-center justify-center text-white">
                                {speed === 0 ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                            </button>
                            <button onClick={() => setSpeed(speed === 2 ? 1 : 2)} className={`w-8 h-8 rounded-full bg-black/60 border border-slate-700 flex items-center justify-center font-bold text-[10px] ${speed === 2 ? 'text-emerald-400' : 'text-white'}`}>
                                {speed === 2 ? '2x' : '1x'}
                            </button>
                        </div>

                        <div className="absolute bottom-2 right-2 pointer-events-auto">
                            <button onClick={() => { setSpeed(0); setShowTacticsModal(true); }} className="w-8 h-8 rounded-full bg-purple-600/80 border border-purple-400/30 flex items-center justify-center text-white">
                                <Settings size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Action Toast (Standard Mode) */}
                    <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none portrait:block landscape:hidden landscape:md:block">
                        <div className="bg-black/70 backdrop-blur-md text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-slate-600 shadow-2xl flex items-center gap-2 md:gap-3">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-ping"></div>
                            <span className="font-bold uppercase tracking-wide text-[10px] md:text-sm whitespace-nowrap">{statusText}</span>
                        </div>
                    </div>

                    {/* Canvas Container with Fixed Aspect Ratio */}
                    <div
                        ref={containerRef}
                        className="relative w-full h-full flex items-center justify-center overflow-hidden"
                    >
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_W}
                            height={CANVAS_H}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border-2 md:border-4 border-slate-800 bg-slate-900 landscape:rounded-none landscape:border-0"
                            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
                        />
                    </div>
                </div>

                {/* 3. STATS SIDEBAR (Hidden on landscape) */}
                <div className={`w-full lg:w-72 bg-slate-900 border-l border-slate-800 flex-col z-10 shrink-0 ${activeTab === 'STATS' ? 'flex' : 'hidden lg:flex'} landscape:hidden landscape:md:flex`}>
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

            </div>

            {/* FOOTER CONTROLS (Hidden on small landscape) */}
            <div className="h-16 md:h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-2 md:px-6 shrink-0 z-30 portrait:flex landscape:hidden landscape:md:flex">
                <button
                    onClick={() => onFinish(match.id)}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded bg-slate-800 hover:bg-red-900/80 text-slate-400 hover:text-white transition-colors border border-slate-700"
                >
                    <LogOut size={16} /> <span className="font-bold text-[10px] md:text-sm">EXIT</span>
                </button>

                <div className="flex items-center gap-2 md:gap-4 bg-black/40 p-1.5 md:p-2 rounded-full border border-slate-700 scale-90 md:scale-100">
                    <button onClick={() => setSpeed(speed === 0 ? 1 : 0)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${speed === 0 ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-700 text-slate-300'}`}>
                        {speed === 0 ? <Play size={16} fill="currentColor" className="ml-0.5 md:ml-1" /> : <Pause size={16} fill="currentColor" />}
                    </button>

                    <div className="h-4 md:h-6 w-[1px] bg-slate-700"></div>

                    <button onClick={() => setSpeed(1)} className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold ${speed === 1 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>1x</button>
                    <button onClick={() => setSpeed(2)} className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold ${speed === 2 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>2x</button>
                </div>

                <div className="flex gap-1 md:gap-3">
                    <button
                        onClick={() => { setSpeed(0); setShowTacticsModal(true); }}
                        className="flex items-center gap-1 md:gap-2 px-2 md:px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg transition-all scale-90 md:scale-100"
                    >
                        <Settings size={16} /> <span className="hidden xs:inline text-[10px] md:text-sm">MGMT</span>
                    </button>

                    <button
                        onClick={() => onInstantFinish(match.id)}
                        className="hidden sm:flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold border border-slate-700 transition-colors"
                    >
                        <SkipForward size={16} /> <span className="text-[10px] md:text-sm">SKIP</span>
                    </button>
                </div>
            </div>

        </div>
    );
};
