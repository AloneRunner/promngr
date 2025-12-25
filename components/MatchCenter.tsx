
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

// 2.5D Coordinate Transformation
const toScreen = (xPct: number, yPct: number, z: number = 0): { x: number, y: number, groundY: number, scale: number } => {
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
    onTick, onFinish, onInstantFinish, onSubstitute, onUpdateTactic, onAutoFix, userTeamId, t, onPlayerClick
}) => {
    const [speed, setSpeed] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<'PITCH' | 'FEED' | 'STATS'>('PITCH');
    const [showTacticsModal, setShowTacticsModal] = useState(false);
    const [goalFlash, setGoalFlash] = useState<'HOME' | 'AWAY' | null>(null); // NEW: Goal celebration flash
    const lastGoalCount = useRef({ home: 0, away: 0 }); // Track goal count to detect new goals

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Logic Loop & Render Loop Refs
    const logicTimerRef = useRef<number | null>(null);
    const renderReqRef = useRef<number | null>(null);

    // State Interpolation Refs
    const lastTickState = useRef<any>(null);
    const nextTickState = useRef<any>(null);
    const lastTickTime = useRef<number>(0);

    // Ball trail history for visual effect
    const ballTrail = useRef<Array<{ x: number, y: number, z: number, age: number }>>([]);

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
    }, [match.liveData, match.currentMinute, match.homeScore, match.awayScore]); // Update when data changes

    // 3. Logic Loop (Triggers the onTick)
    useEffect(() => {
        if (match.isPlayed) {
            setSpeed(0);
            return;
        }

        if (logicTimerRef.current) clearInterval(logicTimerRef.current);

        if (speed > 0) {
            // Speed logic: 
            // 1x = 120ms (Normal)
            // 2x = 60ms (Fast)
            // 0.5x = 240ms (Slow)
            // 4x = 30ms (Super Fast)
            let ms = 120;
            if (speed === 2) ms = 60;
            else if (speed === 0.5) ms = 240;
            else if (speed === 4) ms = 30;

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
                z: nextP.z || 0,
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

            drawPlayer(ctx, item.x, item.y, item.z || 0, item.facing, primary, secondary, num, hasBall, item.player.lastName, item.stamina, item.state);
        });

        // Draw Ball with Trail Effect
        const prevBall = prevState.ball;
        const nextBall = nextState.ball;
        if (prevBall && nextBall) {
            const ballX = lerp(prevBall.x, nextBall.x, alpha);
            const ballY = lerp(prevBall.y, nextBall.y, alpha);
            const ballZ = lerp(prevBall.z || 0, nextBall.z || 0, alpha);

            // Update ball trail (only when ball is moving fast)
            const ballSpeed = Math.sqrt(
                Math.pow(nextBall.vx || 0, 2) + Math.pow(nextBall.vy || 0, 2)
            );

            if (ballSpeed > 1.5 && nextBall.ownerId === null) {
                // Add to trail
                ballTrail.current.push({ x: ballX, y: ballY, z: ballZ, age: 0 });
                // Keep only last 8 positions
                if (ballTrail.current.length > 8) ballTrail.current.shift();
            } else {
                // Clear trail when ball is slow or possessed
                ballTrail.current = [];
            }

            // Draw trail (fading dots)
            ballTrail.current.forEach((point, idx) => {
                point.age++;
                const fade = 1 - (idx / ballTrail.current.length);
                const pos = toScreen(point.x, point.y, point.z);
                const trailRadius = 3 * fade * pos.scale;

                ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * fade})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, trailRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            drawBall(ctx, ballX, ballY, ballZ);
        }

        // ========== GOAL FLASH EFFECT ==========
        if (goalFlash) {
            // Use 2.5D coordinates for goal position
            const goalPos = toScreen(goalFlash === 'AWAY' ? 0 : 100, 50);
            const goalX = goalPos.x;
            const goalY = goalPos.y;

            // Pulsing glow effect
            const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;

            // Radial gradient glow from goal
            const gradient = ctx.createRadialGradient(goalX, goalY, 10, goalX, goalY, 150);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${0.8 * pulse})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.6 * pulse})`);
            gradient.addColorStop(0.7, `rgba(255, 215, 0, ${0.3 * pulse})`);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Add sparkle particles effect
            for (let i = 0; i < 12; i++) {
                const angle = (Date.now() / 500 + i * 0.5) % (Math.PI * 2);
                const radius = 40 + Math.sin(Date.now() / 200 + i) * 20;
                const sparkleX = goalX + Math.cos(angle) * radius;
                const sparkleY = goalY + Math.sin(angle) * radius * 0.6;

                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * pulse})`;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const drawPitch = (ctx: CanvasRenderingContext2D) => {
        // Background
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Get corner positions for the trapezoid pitch
        const topLeft = toScreen(0, 0);
        const topRight = toScreen(100, 0);
        const bottomLeft = toScreen(0, 100);
        const bottomRight = toScreen(100, 100);

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

            const tl = toScreen(x1, 0);
            const tr = toScreen(x2, 0);
            const bl = toScreen(x1, 100);
            const br = toScreen(x2, 100);

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

        // Halfway line (vertical in game coords = horizontal visually)
        const halfTop = toScreen(50, 0);
        const halfBottom = toScreen(50, 100);
        ctx.beginPath();
        ctx.moveTo(halfTop.x, halfTop.y);
        ctx.lineTo(halfBottom.x, halfBottom.y);
        ctx.stroke();

        // Center circle (ellipse due to perspective)
        const center = toScreen(50, 50);
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
            const boxTL = toScreen(xBase, 21);
            const boxTR = toScreen(xPenalty, 21);
            const boxBL = toScreen(xBase, 79);
            const boxBR = toScreen(xPenalty, 79);

            ctx.beginPath();
            ctx.moveTo(boxTL.x, boxTL.y);
            ctx.lineTo(boxTR.x, boxTR.y);
            ctx.lineTo(boxBR.x, boxBR.y);
            ctx.lineTo(boxBL.x, boxBL.y);
            ctx.stroke();

            // Small box
            const smallTL = toScreen(xBase, 37);
            const smallTR = toScreen(xSmall, 37);
            const smallBL = toScreen(xBase, 63);
            const smallBR = toScreen(xSmall, 63);

            ctx.beginPath();
            ctx.moveTo(smallTL.x, smallTL.y);
            ctx.lineTo(smallTR.x, smallTR.y);
            ctx.lineTo(smallBR.x, smallBR.y);
            ctx.lineTo(smallBL.x, smallBL.y);
            ctx.stroke();

            // Penalty spot
            const spot = toScreen(xSpot, 50);
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, 3, 0, Math.PI * 2);
            ctx.fill();
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
            const frontTop = toScreen(isLeft ? 0 : 100, yTop);
            const frontBottom = toScreen(isLeft ? 0 : 100, yBottom);

            // Goal posts (back)
            const backTop = toScreen(xBack, yTop);
            const backBottom = toScreen(xBack, yBottom);

            // Draw net (back panel)
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;

            // Horizontal net lines
            for (let y = yTop; y <= yBottom; y += 2) {
                const left = toScreen(xBack, y);
                const right = toScreen(isLeft ? 0 : 100, y);
                ctx.beginPath();
                ctx.moveTo(left.x, left.y - goalHeight);
                ctx.lineTo(right.x, right.y - goalHeight);
                ctx.stroke();
            }

            // Vertical net lines
            for (let i = 0; i <= 4; i++) {
                const x = isLeft ? xBack + (i * 1.5) : xBack - (i * 1.5);
                const top = toScreen(x, yTop);
                const bottom = toScreen(x, yBottom);
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
        hasBall: boolean, name: string, stamina: number, state: string
    ) => {
        // 2.5D Coordinate transformation
        const pos = toScreen(xPct, yPct);
        const cx = pos.x;
        const groundY = pos.y; // Shadow always here
        const scale = pos.scale;
        const baseRadius = 12;
        let radius = baseRadius * scale;
        const playerHeight = 8 * scale; // 3D height effect

        // Calculate Body Y based on Jump Height (Z)
        // Z usually goes 0 to 2-3 meters. We scale it up for pixels.
        const jumpOffset = z * 10 * scale;
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
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 2;
        ctx.fillText(num.toString(), cx, bodyY + 1);
        ctx.shadowBlur = 0;

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
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
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
        // 2.5D Coordinate transformation
        const pos = toScreen(xPct, yPct, z);
        const groundPos = toScreen(xPct, yPct, 0);
        const scale = pos.scale;
        const baseRadius = 5;
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
                            onAutoFix={onAutoFix}
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
                        {/* Floating Scoreboard HUD (Top Center) */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 scale-90">
                                <span className="text-white font-mono font-black text-lg">{match.homeScore}</span>
                                <span className="text-emerald-400 font-mono font-bold text-xs bg-black/40 px-1.5 rounded-lg">{match.currentMinute}'</span>
                                <span className="text-white font-mono font-black text-lg">{match.awayScore}</span>
                            </div>
                        </div>

                        {/* Top Left: Play Controls (Moved from Bottom) */}
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
                            <button onClick={() => { setSpeed(0); setShowTacticsModal(true); }} className="w-8 h-8 rounded-full bg-purple-600/80 border border-purple-400/30 flex items-center justify-center text-white">
                                <Settings size={14} />
                            </button>
                            <button onClick={() => onFinish(match.id)} className="w-8 h-8 flex items-center justify-center bg-red-900/50 text-white rounded-full border border-red-500/30">
                                <X size={16} />
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

                    <button onClick={() => setSpeed(0.5)} className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold ${speed === 0.5 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>0.5x</button>
                    <button onClick={() => setSpeed(1)} className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold ${speed === 1 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>1x</button>
                    <button onClick={() => setSpeed(2)} className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold ${speed === 2 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>2x</button>
                    <button onClick={() => setSpeed(4)} className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold ${speed === 4 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>4x</button>
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
