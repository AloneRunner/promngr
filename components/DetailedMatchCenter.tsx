import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Match, Team, Player, MatchEventType, TeamTactic, Translation } from '../types';
import { Play, Pause, X, Volume2, VolumeX, Settings, Palette, Camera, List, BarChart2, MonitorPlay } from 'lucide-react';
import { simulateTick, getLivePlayerStamina, getSubstitutedOutPlayerIds, getSubsMade, getMaxSubs } from '../services/engine';
import { calculateEffectiveRating } from '../services/MatchEngine';
import { soundManager } from '../services/soundManager';
import { TeamManagement } from './TeamManagement';
import { TeamLogo } from './TeamLogo';

interface DetailedMatchCenterProps {
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    homePlayers: Player[];
    awayPlayers: Player[];
    onSync: (matchId: string, result: any) => void;
    onFinish: (matchId: string) => void;
    onInstantFinish: (matchId: string) => void;
    onSubstitute: (playerInId: string, playerOutId: string) => void;
    onUpdateTactic: (tactic: TeamTactic, context?: { minute: number; score: { home: number; away: number } }, targetTeamId?: string) => void;
    onAutoFix: () => void;
    userTeamId: string;
    t: Translation;
    debugLogs: string[];
    onPlayerClick: (player: Player) => void;
    goalReplay?: boolean;
}

type LiveAttackPlan = {
    pattern: 'WIDE_CROSS' | 'CUTBACK' | 'THIRD_MAN' | 'DIRECT_CHANNEL';
    lane: 'LEFT' | 'RIGHT' | 'CENTER';
} | null;

type LiveDefensePlan = {
    pattern: 'COUNTER_PRESS' | 'FORCE_WIDE' | 'PROTECT_CENTER' | 'LOW_BLOCK';
    lane: 'LEFT' | 'RIGHT' | 'CENTER';
} | null;

const getAttackPlanBadgeLabel = (plan: LiveAttackPlan) => {
    if (!plan) return 'Plan yok';
    const patternLabel =
        plan.pattern === 'WIDE_CROSS'
            ? 'Kanat Ortasi'
            : plan.pattern === 'CUTBACK'
                ? 'Geri Cikar'
                : plan.pattern === 'THIRD_MAN'
                    ? 'Ucuncu Adam'
                    : 'Kanal Kosusu';
    const laneLabel = plan.lane === 'LEFT' ? 'Sol' : plan.lane === 'RIGHT' ? 'Sag' : 'Merkez';
    return `${patternLabel} • ${laneLabel}`;
};

const getDefensePlanBadgeLabel = (plan: LiveDefensePlan) => {
    if (!plan) return 'Plan yok';
    const patternLabel =
        plan.pattern === 'COUNTER_PRESS'
            ? 'Gecis Presi'
            : plan.pattern === 'FORCE_WIDE'
                ? 'Kanada Yonlendir'
                : plan.pattern === 'PROTECT_CENTER'
                    ? 'Merkezi Kapat'
                    : 'Alcak Blok';
    const laneLabel = plan.lane === 'LEFT' ? 'Sol' : plan.lane === 'RIGHT' ? 'Sag' : 'Merkez';
    return `${patternLabel} • ${laneLabel}`;
};

const getAttackPlanFallbackLabel = (team: Team) => {
    const attackPlan = team.tactic.attackPlan;
    const instructions = team.tactic.instructions || [];

    if (attackPlan === 'WIDE_CROSS' || instructions.includes('HitEarlyCrosses')) return 'Kanat Ortasi • Taktik';
    if (attackPlan === 'CUTBACK') return 'Geri Cikar • Taktik';
    if (attackPlan === 'THIRD_MAN') return 'Ucuncu Adam • Taktik';
    if (attackPlan === 'DIRECT_CHANNEL' || team.tactic.passingStyle === 'Direct') return 'Kanal Kosusu • Taktik';
    return 'Plan yok';
};

const getDefensePlanFallbackLabel = (team: Team) => {
    const pressing = team.tactic.pressingIntensity;
    const style = team.tactic.style;
    const line = (team.tactic.defensiveLine || '').toLowerCase();
    const width = (team.tactic.width || '').toLowerCase();

    if (pressing === 'Gegenpress' || pressing === 'HighPress') return 'Gecis Presi • Taktik';
    if (style === 'ParkTheBus' || style === 'Defensive' || pressing === 'StandOff' || line.includes('deep') || line.includes('low')) return 'Alcak Blok • Taktik';
    if (width.includes('narrow')) return 'Merkezi Kapat • Taktik';
    if (width.includes('wide')) return 'Kanada Yonlendir • Taktik';
    return 'Dengeli Savunma';
};

const getDefaultKitColors = (isControlledTeam: boolean) => ({
    primary: isControlledTeam ? '#3b82f6' : '#ef4444',
    secondary: '#ffffff'
});

const getCompactTeamName = (team: Team) => team.shortName || team.name.split(' ').slice(0, 2).join(' ');

const getEventAccentClass = (eventType: MatchEventType) => {
    switch (eventType) {
        case MatchEventType.GOAL:
            return 'text-emerald-300 border-emerald-400/35 bg-emerald-500/12';
        case MatchEventType.CARD_RED:
            return 'text-red-300 border-red-400/35 bg-red-500/12';
        case MatchEventType.CARD_YELLOW:
            return 'text-amber-200 border-amber-300/35 bg-amber-500/12';
        case MatchEventType.SUB:
            return 'text-sky-200 border-sky-300/35 bg-sky-500/12';
        case MatchEventType.CORNER:
        case MatchEventType.FREE_KICK:
        case MatchEventType.GOAL_KICK:
        case MatchEventType.OFFSIDE:
            return 'text-fuchsia-200 border-fuchsia-300/35 bg-fuchsia-500/12';
        default:
            return 'text-slate-200 border-white/10 bg-white/5';
    }
};

const getCompactEventLabel = (event: Match | null | undefined, latestEvent?: Match['events'][number] | null) => {
    if (!latestEvent) return null;
    return `${latestEvent.minute}' ${latestEvent.description}`;
};

type WakeLockSentinelLike = {
    released?: boolean;
    release: () => Promise<void>;
    addEventListener?: (type: 'release', listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
    wakeLock?: {
        request: (type: 'screen') => Promise<WakeLockSentinelLike>;
    };
};

// Canvas resolution for sprite rendering
const CANVAS_W = 1280;
const CANVAS_H = 640;
const PITCH_MARGIN = 40;

// 2.5D Perspective settings
const PERSPECTIVE_RATIO = 0.6;
const PERSPECTIVE_SCALE = 0.30;

// Pitch colors
const PITCH_COLOR_1 = '#1a472a';
const PITCH_COLOR_2 = '#235c36';
const LINE_COLOR = 'rgba(255, 255, 255, 0.85)';

// Motor pitch dimensions
const ENGINE_PITCH_LENGTH = 105;
const ENGINE_PITCH_WIDTH = 68;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const shortestAngleDelta = (from: number, to: number) => {
    let delta = (to - from + Math.PI) % (Math.PI * 2);
    if (delta < 0) delta += Math.PI * 2;
    return delta - Math.PI;
};

const normalizeCoords = (x: number, y: number): { x: number, y: number } => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return { x: 50, y: 50 };
    }
    return {
        x: (x / ENGINE_PITCH_LENGTH) * 100,
        y: (y / ENGINE_PITCH_WIDTH) * 100
    };
};

// Calculate 3D to 2D screen coordinates with perspective
const toScreenDeep = (xPct: number, yPct: number, z: number = 0) => {
    const fieldW = CANVAS_W - (PITCH_MARGIN * 2);
    const fieldH = (CANVAS_H - (PITCH_MARGIN * 2)) * PERSPECTIVE_RATIO;

    // 0 is top (far), 1 is bottom (near)
    const yNorm = yPct / 100;

    // Perspective narrows the top of the field
    const perspFactor = 1 - (1 - yNorm) * PERSPECTIVE_SCALE;
    const centerX = CANVAS_W / 2;
    const rawX = PITCH_MARGIN + (xPct / 100) * fieldW;

    // Apply perspective to X
    const screenX = centerX + (rawX - centerX) * perspFactor;

    // Apply perspective to Y
    const screenYRaw = PITCH_MARGIN + yNorm * fieldH;
    const verticalCenterOffset = (CANVAS_H - (fieldH + PITCH_MARGIN * 2)) / 2;
    const finalScreenY = screenYRaw + verticalCenterOffset + (PITCH_MARGIN / 2);

    // Z translation (upwards on screen is -Y)
    const zPixelScale = 12; // pixels per 1 unit of z
    const depthScale = 0.7 + yNorm * 0.3; // things in back are smaller

    return {
        x: screenX,
        y: finalScreenY - (z * zPixelScale * depthScale),
        groundY: finalScreenY,
        scale: depthScale
    };
};

// Draw full 3D pitch with lines and goals
const drawPitch3D = (ctx: CanvasRenderingContext2D) => {
    // Deep background
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const tl = toScreenDeep(0, 0);
    const tr = toScreenDeep(100, 0);
    const br = toScreenDeep(100, 100);
    const bl = toScreenDeep(0, 100);

    // ————— STADIUM STANDS —————
    const standColors = [
        '#c0392b','#e74c3c','#2980b9','#3498db',
        '#f1c40f','#ecf0f1','#95a5a6','#27ae60','#8e44ad','#d35400'
    ];
    const drawCrowdFill = (corners: {x:number,y:number}[], seedBase: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[3].x, corners[3].y);
        ctx.clip();
        const minX = Math.min(...corners.map(c=>c.x));
        const maxX = Math.max(...corners.map(c=>c.x));
        const minY = Math.min(...corners.map(c=>c.y));
        const maxY = Math.max(...corners.map(c=>c.y));
        for (let gy = minY + 4; gy < maxY - 2; gy += 9) {
            for (let gx = minX + 4; gx < maxX - 2; gx += 9) {
                const ci = Math.floor(Math.abs(Math.sin(seedBase + gy * 0.13 + gx * 0.09) * standColors.length)) % standColors.length;
                ctx.fillStyle = standColors[ci] + 'bb';
                ctx.fillRect(gx - 2.5, gy - 3.5, 5, 7);
            }
        }
        ctx.restore();
    };

    // Far stand (above top edge of pitch)
    const farOverhang = 28;
    const farH = 62;
    const fsL = { x: tl.x - farOverhang, y: tl.y };
    const fsR = { x: tr.x + farOverhang, y: tr.y };
    const fsLTop = { x: tl.x - farOverhang - 8, y: tl.y - farH };
    const fsRTop = { x: tr.x + farOverhang + 8, y: tr.y - farH };
    const farG = ctx.createLinearGradient(0, fsLTop.y, 0, fsL.y);
    farG.addColorStop(0, '#07101c');
    farG.addColorStop(1, '#142030');
    ctx.fillStyle = farG;
    ctx.beginPath();
    ctx.moveTo(fsLTop.x, fsLTop.y); ctx.lineTo(fsRTop.x, fsRTop.y);
    ctx.lineTo(fsR.x, fsR.y); ctx.lineTo(fsL.x, fsL.y);
    ctx.fill();
    drawCrowdFill([fsLTop, fsRTop, fsR, fsL], 1);
    // Tier separator lines
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.8;
    for (let r = 1; r <= 5; r++) {
        const t = r / 6;
        ctx.beginPath();
        ctx.moveTo(lerp(fsL.x, fsLTop.x, t), lerp(fsL.y, fsLTop.y, t));
        ctx.lineTo(lerp(fsR.x, fsRTop.x, t), lerp(fsR.y, fsRTop.y, t));
        ctx.stroke();
    }
    // Roof edge
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fsLTop.x, fsLTop.y); ctx.lineTo(fsRTop.x, fsRTop.y);
    ctx.stroke();

    // Left stand (left gutter area)
    const leftG = ctx.createLinearGradient(0, 0, tl.x, 0);
    leftG.addColorStop(0, '#07101c');
    leftG.addColorStop(1, '#142030');
    ctx.fillStyle = leftG;
    ctx.beginPath();
    ctx.moveTo(0, tl.y); ctx.lineTo(tl.x, tl.y);
    ctx.lineTo(bl.x, bl.y); ctx.lineTo(0, bl.y);
    ctx.fill();
    drawCrowdFill([{x:0,y:tl.y},{x:tl.x,y:tl.y},{x:bl.x,y:bl.y},{x:0,y:bl.y}], 100);
    // Column lines
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    for (let c = 1; c <= 4; c++) {
        const t = c / 5;
        ctx.beginPath();
        ctx.moveTo(lerp(0, tl.x, t), tl.y);
        ctx.lineTo(lerp(0, bl.x, t), bl.y);
        ctx.stroke();
    }

    // Right stand (right gutter area)
    const rightG = ctx.createLinearGradient(tr.x, 0, CANVAS_W, 0);
    rightG.addColorStop(0, '#142030');
    rightG.addColorStop(1, '#07101c');
    ctx.fillStyle = rightG;
    ctx.beginPath();
    ctx.moveTo(tr.x, tr.y); ctx.lineTo(CANVAS_W, tr.y);
    ctx.lineTo(CANVAS_W, br.y); ctx.lineTo(br.x, br.y);
    ctx.fill();
    drawCrowdFill([{x:tr.x,y:tr.y},{x:CANVAS_W,y:tr.y},{x:CANVAS_W,y:br.y},{x:br.x,y:br.y}], 200);
    // Column lines
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    for (let c = 1; c <= 4; c++) {
        const t = c / 5;
        ctx.beginPath();
        ctx.moveTo(lerp(tr.x, CANVAS_W, t), tr.y);
        ctx.lineTo(lerp(br.x, CANVAS_W, t), br.y);
        ctx.stroke();
    }

    // Near stand (below bottom edge, closest to viewer — appears largest)
    const nearH = 48;
    const nsLBot = { x: 0, y: Math.min(bl.y + nearH, CANVAS_H) };
    const nsRBot = { x: CANVAS_W, y: Math.min(br.y + nearH, CANVAS_H) };
    const nearG = ctx.createLinearGradient(0, bl.y, 0, nsLBot.y);
    nearG.addColorStop(0, '#142030');
    nearG.addColorStop(1, '#07101c');
    ctx.fillStyle = nearG;
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y);
    ctx.lineTo(nsRBot.x, nsRBot.y); ctx.lineTo(nsLBot.x, nsLBot.y);
    ctx.fill();
    drawCrowdFill([{x:bl.x,y:bl.y},{x:br.x,y:br.y},{x:nsRBot.x,y:nsRBot.y},{x:nsLBot.x,y:nsLBot.y}], 300);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    for (let r = 1; r <= 3; r++) {
        const t = r / 4;
        ctx.beginPath();
        ctx.moveTo(lerp(bl.x, nsLBot.x, t), lerp(bl.y, nsLBot.y, t));
        ctx.lineTo(lerp(br.x, nsRBot.x, t), lerp(br.y, nsRBot.y, t));
        ctx.stroke();
    }
    // ————— END STADIUM STANDS —————

    ctx.save();

    // Grass base (Pitch boundary)
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.clip(); // Clip everything else to stay inside grass or just fill 

    // Draw striped grass
    const stripeCount = 14;
    for (let i = 0; i < stripeCount; i++) {
        const pct1 = (i / stripeCount) * 100;
        const pct2 = ((i + 1) / stripeCount) * 100;

        const sTop1 = toScreenDeep(pct1, 0);
        const sTop2 = toScreenDeep(pct2, 0);
        const sBot1 = toScreenDeep(pct1, 100);
        const sBot2 = toScreenDeep(pct2, 100);

        ctx.fillStyle = i % 2 === 0 ? PITCH_COLOR_1 : PITCH_COLOR_2;
        ctx.beginPath();
        ctx.moveTo(sTop1.x, sTop1.y);
        ctx.lineTo(sTop2.x, sTop2.y);
        ctx.lineTo(sBot2.x, sBot2.y);
        ctx.lineTo(sBot1.x, sBot1.y);
        ctx.fill();
    }

    ctx.restore();

    // Lines
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2.5;

    // Outer Bound
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();

    // Center line
    const midTop = toScreenDeep(50, 0);
    const midBot = toScreenDeep(50, 100);
    ctx.beginPath();
    ctx.moveTo(midTop.x, midTop.y);
    ctx.lineTo(midBot.x, midBot.y);
    ctx.stroke();

    // Center circle (ellipse in perspective)
    const centerSpot = toScreenDeep(50, 50);
    ctx.beginPath();
    ctx.ellipse(centerSpot.x, centerSpot.y, 60, 60 * PERSPECTIVE_RATIO * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = LINE_COLOR;
    ctx.beginPath();
    ctx.arc(centerSpot.x, centerSpot.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Penalty areas
    const drawBox = (isLeft: boolean) => {
        const xEdge = isLeft ? 0 : 100;
        const xBox = isLeft ? 16.5 : 83.5;
        const topY = 21;
        const botY = 79;

        const bTL = toScreenDeep(xEdge, topY);
        const bTR = toScreenDeep(xBox, topY);
        const bBR = toScreenDeep(xBox, botY);
        const bBL = toScreenDeep(xEdge, botY);

        ctx.beginPath();
        ctx.moveTo(bTL.x, bTL.y);
        ctx.lineTo(bTR.x, bTR.y);
        ctx.lineTo(bBR.x, bBR.y);
        ctx.lineTo(bBL.x, bBL.y);
        ctx.stroke();

        // Penalty spot
        const pSpotX = isLeft ? 11 : 89;
        const pSpot = toScreenDeep(pSpotX, 50);
        ctx.beginPath();
        ctx.arc(pSpot.x, pSpot.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // D-Arc (Simplified as ellipse arc)
        const dRadX = 50;
        const dRadY = 50 * PERSPECTIVE_RATIO * 0.35;
        const dAngle = 0.9;
        ctx.beginPath();
        ctx.ellipse(pSpot.x, pSpot.y, dRadX, dRadY, 0,
            isLeft ? -dAngle : Math.PI - dAngle,
            isLeft ? dAngle : Math.PI + dAngle
        );
        ctx.stroke();
    };

    drawBox(true);
    drawBox(false);

    // 3D GOALS
    const drawGoal = (isLeft: boolean) => {
        const xLine = isLeft ? 0 : 100;
        const xBack = isLeft ? -4 : 104;
        const yTop = 44;
        const yBot = 56;
        const zH = 2.44; // Standard goal height in meters

        const postA = toScreenDeep(xLine, yTop, 0);
        const postB = toScreenDeep(xLine, yBot, 0);
        const postATop = toScreenDeep(xLine, yTop, zH);
        const postBTop = toScreenDeep(xLine, yBot, zH);

        const backA = toScreenDeep(xBack, yTop, 0);
        const backB = toScreenDeep(xBack, yBot, 0);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Post A
        ctx.beginPath(); ctx.moveTo(postA.x, postA.y); ctx.lineTo(postATop.x, postATop.y); ctx.stroke();
        // Post B
        ctx.beginPath(); ctx.moveTo(postB.x, postB.y); ctx.lineTo(postBTop.x, postBTop.y); ctx.stroke();
        // Crossbar
        ctx.beginPath(); ctx.moveTo(postATop.x, postATop.y); ctx.lineTo(postBTop.x, postBTop.y); ctx.stroke();

        // Nets
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;

        // Side A net
        ctx.beginPath(); ctx.moveTo(postATop.x, postATop.y); ctx.lineTo(backA.x, backA.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(postA.x, postA.y); ctx.lineTo(backA.x, backA.y); ctx.stroke();

        // Side B net
        ctx.beginPath(); ctx.moveTo(postBTop.x, postBTop.y); ctx.lineTo(backB.x, backB.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(postB.x, postB.y); ctx.lineTo(backB.x, backB.y); ctx.stroke();

        // Back Net Ground
        ctx.beginPath(); ctx.moveTo(backA.x, backA.y); ctx.lineTo(backB.x, backB.y); ctx.stroke();

        // Back Net sloped roof
        for (let i = 1; i < 6; i++) {
            const stepY = yTop + ((yBot - yTop) * (i / 6));
            const nTopX = toScreenDeep(xLine, stepY, zH);
            const nBotX = toScreenDeep(xBack, stepY, 0);

            ctx.beginPath();
            ctx.moveTo(nTopX.x, nTopX.y);
            ctx.lineTo(nBotX.x, nBotX.y);
            ctx.stroke();
        }

        // Net Horizontal Weave
        for (let i = 1; i < 4; i++) {
            const prog = i / 4;
            const hTop = toScreenDeep(
                xLine + (xBack - xLine) * prog,
                yTop,
                zH * (1 - prog)
            );
            const hBot = toScreenDeep(
                xLine + (xBack - xLine) * prog,
                yBot,
                zH * (1 - prog)
            );
            ctx.beginPath();
            ctx.moveTo(hTop.x, hTop.y);
            ctx.lineTo(hBot.x, hBot.y);
            ctx.stroke();
        }
    };

    drawGoal(true);
    drawGoal(false);
};

// Fast Color Darken Math
const shadeColor = (col: string, amt: number) => {
    let usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, "0");
};

const drawBall3D = (ctx: CanvasRenderingContext2D, xPct: number, yPct: number, z: number, trail: Array<{x:number, y:number, z:number}> = []) => {
    if (!Number.isFinite(xPct) || !Number.isFinite(yPct) || !Number.isFinite(z)) return;

    const pos = toScreenDeep(xPct, yPct, z);
    const ground = toScreenDeep(xPct, yPct, 0);
    if (![pos.x, pos.y, ground.x, ground.y, pos.scale].every(Number.isFinite)) return;
    const scale = pos.scale;

    // Top boyutunu biraz daha büyüttük (2.8, oyuncuyla daha iyi uyum sağlıyor ve net seçiliyor)
    const radius = 2.8 * scale; 

    ctx.save();

    // Şut ve hızlı paslarda line yerine yumuşak parçacık kuyruğu (kare artefactı azaltır)
    if (trail && trail.length > 1) {
        for (let i = 0; i < trail.length; i++) {
            const t = (i + 1) / trail.length;
            if (!Number.isFinite(trail[i].x) || !Number.isFinite(trail[i].y) || !Number.isFinite(trail[i].z)) continue;
            const tp = toScreenDeep(trail[i].x, trail[i].y, Math.max(0, trail[i].z));
            if (![tp.x, tp.y, tp.scale].every(Number.isFinite)) continue;
            const alpha = 0.08 + t * 0.18;
            const r = radius * (0.35 + t * 0.55);

            ctx.fillStyle = `rgba(186,230,253,${alpha})`;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Shadow on ground
    const shadowAlpha = Math.max(0.1, 0.5 - (z / 5));
    const shadowScale = Math.max(0.5, 1 - (z / 8));
    ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(ground.x, ground.y, radius * 1.2 * shadowScale, radius * 0.6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Ball gradient
    const grad = ctx.createRadialGradient(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.1, pos.x, pos.y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.6, '#cbd5e1');
    grad.addColorStop(1, '#475569');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
};

const DetailedMatchCenter: React.FC<DetailedMatchCenterProps> = ({
    match, homeTeam, awayTeam, homePlayers, awayPlayers, onSync, onFinish, onInstantFinish,
    onSubstitute, onUpdateTactic, onAutoFix, userTeamId, t, debugLogs, onPlayerClick,
    goalReplay = true
}) => {
    const [speed, setSpeed] = useState(1.0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showTacticsModal, setShowTacticsModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [managedSide, setManagedSide] = useState<'HOME' | 'AWAY'>('HOME');
    const managedSideRef = useRef<'HOME' | 'AWAY'>('HOME');
    const [useDefaultColors, setUseDefaultColors] = useState(false);
    const [showNames, setShowNames] = useState(true);
    const [isGoalReplayEnabled, setIsGoalReplayEnabled] = useState(goalReplay);
    const [cameraTracking, setCameraTracking] = useState(false); // Kamera takibi isteğe bağlı
    const [activeTab, setActiveTab] = useState<'PITCH' | 'FEED' | 'STATS'>('PITCH');
    const [isLandscape, setIsLandscape] = useState(false);
    const [isSmallLandscape, setIsSmallLandscape] = useState(false);
    const [goalFlash, setGoalFlash] = useState<'HOME' | 'AWAY' | null>(null);
    const [goalBanner, setGoalBanner] = useState<{ text: string; side: 'HOME' | 'AWAY' } | null>(null);
    const goalBannerTimerRef = useRef<number | null>(null);
    // === GOL TEKRARI ===
    const REPLAY_BUFFER_SIZE = 180; // ~6 saniye @ 20fps (180 * 50ms)
    const replayBufferRef = useRef<any[]>([]); // ring buffer — her tick beslenir
    const replaySnapshotRef = useRef<any[]>([]); // gol anında dondurulan kopya
    const [isReplaying, setIsReplaying] = useState(false);
    const isReplayingRef = useRef(false);
    const replayFrameRef = useRef(0);
    const replayZoomRef = useRef(1.0);
    const replayZoomCenterRef = useRef({ x: 50, y: 50 }); // pitch % coords
    const replayTimerRef = useRef<number | null>(null);
    const [showHalfTime, setShowHalfTime] = useState(false);
    const [setPieceCue, setSetPieceCue] = useState<{ label: string; accent: string } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const liveAttackPlans = (match.liveData?.simulation as any)?.attackPlans;
    const liveDefensePlans = (match.liveData?.simulation as any)?.defensePlans;
    const homeAttackPlan = (liveAttackPlans?.home || null) as LiveAttackPlan;
    const awayAttackPlan = (liveAttackPlans?.away || null) as LiveAttackPlan;
    const homeDefensePlan = (liveDefensePlans?.home || null) as LiveDefensePlan;
    const awayDefensePlan = (liveDefensePlans?.away || null) as LiveDefensePlan;
    const homeAttackPlanLabel = homeAttackPlan ? getAttackPlanBadgeLabel(homeAttackPlan) : getAttackPlanFallbackLabel(homeTeam);
    const awayAttackPlanLabel = awayAttackPlan ? getAttackPlanBadgeLabel(awayAttackPlan) : getAttackPlanFallbackLabel(awayTeam);
    const homeDefensePlanLabel = homeDefensePlan ? getDefensePlanBadgeLabel(homeDefensePlan) : getDefensePlanFallbackLabel(homeTeam);
    const awayDefensePlanLabel = awayDefensePlan ? getDefensePlanBadgeLabel(awayDefensePlan) : getDefensePlanFallbackLabel(awayTeam);
    const statusText = match.liveData?.lastActionText || 'Waiting...';
    const livePassDebug = (match.liveData?.simulation as any)?.passDebug || null;
    const debugBannerShown = useRef(false);

    const matchRef = useRef(match);
    const homeTeamRef = useRef(homeTeam);
    const awayTeamRef = useRef(awayTeam);
    const homePlayersRef = useRef(homePlayers);
    const awayPlayersRef = useRef(awayPlayers);
    const useDefaultColorsRef = useRef(false);
    const showNamesRef = useRef(true);
    const cameraTrackingRef = useRef(false);
    const lastGoalCount = useRef({ home: 0, away: 0 });
    const halfTimeShown = useRef(false);

    const lastTickState = useRef<any>(null);
    const nextTickState = useRef<any>(null);
    const lastTickTime = useRef<number>(0);

    const logicTimerRef = useRef<number | null>(null);
    const renderReqRef = useRef<number | null>(null);
    const autoResumeTimerRef = useRef<number | null>(null);
    const speedRef = useRef(1.0);
    const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

    const playerNumbers = useRef<Record<string, number>>({});

    useEffect(() => {
        const debugHelper = {
            getSnapshot: () => ({
                minute: match.currentMinute,
                score: { home: match.homeScore, away: match.awayScore },
                statusText,
                attackPlans: {
                    home: homeAttackPlan,
                    away: awayAttackPlan,
                },
                passDebug: livePassDebug,
            }),
            printPassReport: () => {
                if (!livePassDebug) {
                    console.info('PFM: No active pass debug snapshot yet.');
                    return null;
                }
                console.groupCollapsed(`PFM Pass Report ${livePassDebug.minute}' ${livePassDebug.passerName} -> ${livePassDebug.receiverName}`);
                console.table({
                    outcome: livePassDebug.outcome,
                    reason: livePassDebug.outcomeReason,
                    type: livePassDebug.type,
                    plan: livePassDebug.planPattern,
                    passer: livePassDebug.passerName,
                    intendedReceiver: livePassDebug.receiverName,
                    actualReceiver: livePassDebug.actualReceiverName || '-',
                    targetX: Number(livePassDebug.targetX).toFixed(2),
                    targetY: Number(livePassDebug.targetY).toFixed(2),
                    receiveX: livePassDebug.receiveX !== undefined ? Number(livePassDebug.receiveX).toFixed(2) : '-',
                    receiveY: livePassDebug.receiveY !== undefined ? Number(livePassDebug.receiveY).toFixed(2) : '-',
                    distanceFromTarget: livePassDebug.distanceFromTarget !== undefined ? Number(livePassDebug.distanceFromTarget).toFixed(2) : '-',
                    travelTicks: livePassDebug.travelTicks,
                });
                console.groupEnd();
                return livePassDebug;
            },
            printMatchState: () => {
                const snapshot = {
                    minute: match.currentMinute,
                    score: `${match.homeScore}-${match.awayScore}`,
                    statusText,
                    homeAttackPlan: homeAttackPlanLabel,
                    awayAttackPlan: awayAttackPlanLabel,
                };
                console.table(snapshot);
                return snapshot;
            }
        };

        (window as any).__PFM_DEBUG = debugHelper;
        if (!debugBannerShown.current) {
            debugBannerShown.current = true;
            console.info('PFM DEBUG READY: __PFM_DEBUG.getSnapshot() | __PFM_DEBUG.printPassReport() | __PFM_DEBUG.printMatchState()');
        }

        return () => {
            if ((window as any).__PFM_DEBUG === debugHelper) {
                delete (window as any).__PFM_DEBUG;
            }
        };
    }, [match.currentMinute, match.homeScore, match.awayScore, statusText, homeAttackPlan, awayAttackPlan, livePassDebug]);
    
    // --- Render Pools & Trails (Garbage Collection Kasmasını Engeller) ---
    const entitiesPool = useRef<Array<{type: string, ySort: number, renderFn: () => void}>>([]);
    const playerInfosPool = useRef<Array<any>>([]);
    const jostleMapPool = useRef<Record<string, {x: number, y: number}>>({});
    const ballTrailPool = useRef<Array<{x: number, y: number, z: number}>>([]);
    const gkCatchPulseRef = useRef<Record<string, number>>({});
    const playerMotionCache = useRef<Record<string, {
        x: number;
        y: number;
        z: number;
        facing: number;
        velocity: number;
        stride: number;
        state: string;
        actionBlend: number;
    }>>({});
    
    // --- Camera Tracking State ---
    const cameraPos = useRef<{xPct: number, yPct: number}>({ xPct: 50, yPct: 50 });

    // Sync state to refs for render loop
    useEffect(() => { useDefaultColorsRef.current = useDefaultColors; }, [useDefaultColors]);
    useEffect(() => { showNamesRef.current = showNames; }, [showNames]);
    useEffect(() => { cameraTrackingRef.current = cameraTracking; }, [cameraTracking]);
    useEffect(() => { speedRef.current = speed; }, [speed]);


    // Update refs
    useEffect(() => {
        matchRef.current = match;
        homeTeamRef.current = homeTeam;
        awayTeamRef.current = awayTeam;
        homePlayersRef.current = homePlayers;
        awayPlayersRef.current = awayPlayers;
        const side = userTeamId === awayTeam.id ? 'AWAY' : 'HOME';
        setManagedSide(side);
        managedSideRef.current = side;
    }, [match, homeTeam, awayTeam, homePlayers, awayPlayers, userTeamId]);

    useEffect(() => {
        const checkLandscape = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const landscape = width > height;
            setIsLandscape(landscape);
            setIsSmallLandscape(landscape && height < 500);
        };

        checkLandscape();
        window.addEventListener('resize', checkLandscape);
        return () => window.removeEventListener('resize', checkLandscape);
    }, []);

    // Reset per-match UI/animation state so previous matches do not leak into the next one.
    useEffect(() => {
        lastGoalCount.current = { home: match.homeScore, away: match.awayScore };
        halfTimeShown.current = false;
        setGoalFlash(null);
        setShowHalfTime(false);
        setSetPieceCue(null);
        ballTrailPool.current.length = 0;
        playerMotionCache.current = {};
        gkCatchPulseRef.current = {};
        cameraPos.current = { xPct: 50, yPct: 50 };
        if (autoResumeTimerRef.current) {
            window.clearTimeout(autoResumeTimerRef.current);
            autoResumeTimerRef.current = null;
        }

        if (match.liveData?.simulation) {
            lastTickState.current = match.liveData.simulation;
            nextTickState.current = match.liveData.simulation;
            lastTickTime.current = performance.now();
        } else {
            lastTickState.current = null;
            nextTickState.current = null;
        }
    }, [match.id]);

    // Initialize jersey numbers
    useEffect(() => {
        [...homePlayers, ...awayPlayers].forEach(p => {
            if (p.jerseyNumber) {
                playerNumbers.current[p.id] = p.jerseyNumber;
            } else if (p.lineupIndex !== undefined && p.lineupIndex >= 0 && p.lineupIndex < 99) {
                playerNumbers.current[p.id] = p.lineupIndex + 1;
            } else if (p.position === 'GK') {
                playerNumbers.current[p.id] = 1;
            }
        });
    }, [homePlayers, awayPlayers]);

    // Initialize state
    useEffect(() => {
        if (match.liveData?.simulation) {
            lastTickState.current = match.liveData.simulation;
            nextTickState.current = match.liveData.simulation;
            lastTickTime.current = performance.now();
        }
        soundManager.startAmbience();
        return () => {
            if (logicTimerRef.current) clearInterval(logicTimerRef.current);
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current);
            if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
            if (wakeLockRef.current && !wakeLockRef.current.released) {
                wakeLockRef.current.release().catch(() => undefined);
                wakeLockRef.current = null;
            }
            soundManager.stopAll();
        };
    }, []);

    const requestWakeLock = useCallback(async () => {
        const nav = navigator as NavigatorWithWakeLock;
        if (!nav.wakeLock || wakeLockRef.current) return;

        try {
            const sentinel = await nav.wakeLock.request('screen');
            wakeLockRef.current = sentinel;
            sentinel.addEventListener?.('release', () => {
                if (wakeLockRef.current === sentinel) {
                    wakeLockRef.current = null;
                }
            });
        } catch {
            wakeLockRef.current = null;
        }
    }, []);

    useEffect(() => {
        const releaseWakeLock = async () => {
            if (wakeLockRef.current && !wakeLockRef.current.released) {
                await wakeLockRef.current.release().catch(() => undefined);
            }
            wakeLockRef.current = null;
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !matchRef.current.isPlayed) {
                requestWakeLock();
            }
        };

        if (!match.isPlayed) {
            requestWakeLock();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        } else {
            releaseWakeLock();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [match.isPlayed, requestWakeLock]);

    const substitutedOutIds = getSubstitutedOutPlayerIds();

    const triggerSetPiecePause = useCallback((eventType: MatchEventType) => {
        if (matchRef.current.isPlayed || showHalfTime || showTacticsModal || showExitModal) return;

        const config = eventType === MatchEventType.FREE_KICK
            ? { label: t.freeKick || 'FREE KICK', accent: 'from-amber-500/90 to-orange-500/90', duration: 720 }
            : eventType === MatchEventType.GOAL_KICK
                ? { label: t.goalKick || 'GOAL KICK', accent: 'from-emerald-500/90 to-teal-500/90', duration: 520 }
            : eventType === MatchEventType.CORNER
                ? { label: t.corner || 'CORNER', accent: 'from-sky-500/90 to-cyan-500/90', duration: 520 }
                : eventType === MatchEventType.OFFSIDE
                    ? { label: t.offside || 'OFFSIDE', accent: 'from-fuchsia-500/90 to-rose-500/90', duration: 520 }
                : { label: t.penalty || 'PENALTY', accent: 'from-rose-500/90 to-red-500/90', duration: 820 };

        setSetPieceCue({ label: config.label, accent: config.accent });

        if (autoResumeTimerRef.current) {
            window.clearTimeout(autoResumeTimerRef.current);
            autoResumeTimerRef.current = null;
        }

        const resumeSpeed = speedRef.current > 0 ? speedRef.current : 1;
        setSpeed(0);

        autoResumeTimerRef.current = window.setTimeout(() => {
            setSetPieceCue(null);
            if (!matchRef.current.isPlayed && !showHalfTime && !showTacticsModal && !showExitModal) {
                setSpeed(resumeSpeed);
            }
            autoResumeTimerRef.current = null;
        }, config.duration);
    }, [showExitModal, showHalfTime, showTacticsModal, t]);

    // Sync engine state
    useEffect(() => {

            const substitutedOutIds = getSubstitutedOutPlayerIds();
        if (match.liveData?.simulation) {
            lastTickState.current = nextTickState.current || match.liveData.simulation;
            nextTickState.current = match.liveData.simulation;
            lastTickTime.current = performance.now();
        }

        // Goal flash detection
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

        // Half-time modal
        if (match.currentMinute >= 45 && match.currentMinute < 46 && !halfTimeShown.current && !match.isPlayed) {
            halfTimeShown.current = true;
            setShowHalfTime(true);
            setSpeed(0);
        }
    }, [match.liveData?.simulation, match.homeScore, match.awayScore, match.currentMinute, match.isPlayed]);

    // Logic loop
    useEffect(() => {
        if (match.isPlayed) {
            setSpeed(0);
            soundManager.stopAll();
            soundManager.play('whistle_end');
            return;
        }

        if (logicTimerRef.current) window.clearInterval(logicTimerRef.current);

        if (soundEnabled) {
            soundManager.resume();
        } else {
            soundManager.pause();
        }

        if (speed > 0) {
            const ms = speed === 2 ? 25 : speed === 0.5 ? 100 : speed === 4 ? 12 : 50;
            logicTimerRef.current = window.setInterval(() => {
                if (isReplayingRef.current) return; // replay sırasında simülasyonu durdur
                const result = simulateTick(matchRef.current, homeTeamRef.current, awayTeamRef.current, homePlayersRef.current, awayPlayersRef.current, userTeamId);
                if (result.simulation) {
                    lastTickState.current = nextTickState.current || result.simulation;
                    nextTickState.current = result.simulation;
                    lastTickTime.current = performance.now();
                    // Simülasyon objesi mutable olduğu için derin kopya alıyoruz, 
                    // aksi halde buffer'daki tüm objeler aynı referansta kalır ve "donmuş ekran" sorunu olur
                    try {
                        const simDeepClone = JSON.parse(JSON.stringify(result.simulation));
                        replayBufferRef.current.push(simDeepClone);
                    } catch(e) { /* fallback */ }
                    
                    if (replayBufferRef.current.length > REPLAY_BUFFER_SIZE) replayBufferRef.current.shift();
                }

                // Play event sounds
                if (result.event) {
                    switch (result.event.type) {
                        case MatchEventType.GOAL: {
                            soundManager.play('goal');
                            soundManager.play('cheer');
                            const goalSide = result.event.teamId === homeTeam.id ? 'HOME' : 'AWAY';
                            const bannerText = result.event.description || '';
                            if (goalBannerTimerRef.current) window.clearTimeout(goalBannerTimerRef.current);
                            setGoalBanner({ text: bannerText, side: goalSide });
                            goalBannerTimerRef.current = window.setTimeout(() => setGoalBanner(null), 3500);
                            // Gol tekrarı — 1.5s sonra başlat (banner görünsün)
                            if (isGoalReplayEnabled) {
                                // Son iki tick'te muhtemelen top merkeze dönmüş olabilir (engine reset). 
                                // Olayın çok gerisinden başlamaması için son ~2.7 saniyelik/55 tick'lik kısmı alıyoruz (55 * 110ms = ~6 saniye replay)
                                const startIndex = Math.max(0, replayBufferRef.current.length - 55);
                                const endIndex = Math.max(1, replayBufferRef.current.length - 2);
                                const cleanSnapshot = startIndex < endIndex ? replayBufferRef.current.slice(startIndex, endIndex) : replayBufferRef.current;
                                const scoringTeamIsHome = result.event.teamId === homeTeamRef.current.id;
                                const goalX = scoringTeamIsHome ? 97 : 3;
                                const goalY = 50;
                                window.setTimeout(() => startReplayRef.current(cleanSnapshot, goalX, goalY), 0);
                            }
                            break;
                        }
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
                            triggerSetPiecePause(result.event.type);
                            break;
                        case MatchEventType.CORNER:
                            soundManager.play('corner');
                            triggerSetPiecePause(result.event.type);
                            break;
                        case MatchEventType.FREE_KICK:
                        case MatchEventType.GOAL_KICK:
                        case MatchEventType.OFFSIDE:
                            triggerSetPiecePause(result.event.type);
                            break;
                    }
                }

                const shouldSync = result.minuteIncrement || (result.event && [
                    MatchEventType.GOAL,
                    MatchEventType.CARD_YELLOW,
                    MatchEventType.CARD_RED,
                    MatchEventType.PENALTY,
                    MatchEventType.CORNER,
                    MatchEventType.FREE_KICK,
                    MatchEventType.GOAL_KICK,
                    MatchEventType.THROW_IN,
                    MatchEventType.OFFSIDE,
                    MatchEventType.FOUL,
                    MatchEventType.KICKOFF,
                ].includes(result.event.type));
                if (shouldSync) onSync(matchRef.current.id, result);

                // Safety stop if isPlayed set by engine mid-interval
                if (matchRef.current.isPlayed) {
                    if (logicTimerRef.current) window.clearInterval(logicTimerRef.current);
                    logicTimerRef.current = null;
                    setSpeed(0);
                    soundManager.stopAll();
                }
            }, ms);
        }
    }, [speed, match.isPlayed, soundEnabled, userTeamId, onSync, triggerSetPiecePause, isReplaying]);

    // Draw Sprite/Pixel Player (Dynamic Actions & Animations!)
    const drawSpritePlayer = (
        ctx: CanvasRenderingContext2D,
        xPct: number, yPct: number, z: number, facing: number,
        primary: string, secondary: string, num: number,
        hasBall: boolean, name: string, state: string, stamina: number,
        velocity: number,    // ...~1 normalised movement speed this tick
        stridePhase: number, // distance-driven gait phase (foot planting)
        actionBlend: number, // short transition hold for kick/tackle/dive
        phaseOffset: number, // per-player unique walk phase (0..2π)
        jostleX: number,     // screen-space push from nearby players
        jostleY: number,
        now: number,         // performance.now() / 1000 (seconds)
        position: string,    // player position e.g. 'GK', 'DEF', 'MID', 'FWD'
        gkThreat: boolean,
        ballDist: number,
        catchPulse: number,
        skillMove?: string,
        beatenEffect?: string,
        shotType?: string
    ) => {
        const basePos  = toScreenDeep(xPct, yPct, z);
        const groundPos = toScreenDeep(xPct, yPct, 0);
        // Telefonlarda daha akıcı görünmesi ve futbol sahasına olan gerçekçi oran (kaleler 2.44m, oyuncu 1.80m) için ölçekleme.
        // Daha önce kaleden uzundular (0.65). 0.45 ile orantıları harika olacak.
        const scale = basePos.scale * 0.43;

        // Apply jostle as pixel offset
        const pos = { x: basePos.x + jostleX, y: basePos.y + jostleY, scale };

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const isFacingRight = Math.cos(facing) >= 0;
        const facingDir     = isFacingRight ? 1 : -1;
        const forwardX = Math.cos(facing);
        const forwardY = Math.sin(facing);
        const frontness = 1 - Math.abs(forwardX); // 1: camera-facing, 0: profile
        const bodyWidthScale = 0.72 + frontness * 0.28;
        const shoulderSpread = 6 * scale * bodyWidthScale;

        // Walk cycle speed & Idle State - Footsteps scaling (Kaymayı önleme)
        // Adım atma (walkFreq) modelini hız ile tam senkronize ettik. 
        // 1 adımda çok yol alma sorunu, frekansı artırarak çözülür. Yüksek hızda bacaklar daha hızlı hareket etmeli.
        const isRunState = state === 'RUN' || state === 'SPRINT';
        const isKickLike = state === 'KICK' || state === 'SHOT';
        const isThrowIn = state === 'THROW_IN';
        const isIdle = velocity < 0.22 && !isRunState && !isKickLike;
        const walkCycle = stridePhase;
        const swing     = isIdle ? 0 : Math.sin(walkCycle);
        
        // Hızlı koşarken adımların daha geniş açılması hissiyatı
        const swingAmt  = Math.min(1.45, velocity * 2.25);

        const skinColor  = '#fcd34d';
        // GK wears a distinct yellow/lime jersey; outfield uses team primary
        const isGK = position === 'GK';
        const shirtColor = isGK ? '#d4e600' : primary;
        // Shorts: darkened version of primary (avoids white shorts problem)
        const shortColor = isGK ? '#1e293b' : shadeColor(primary, -65);

        // Ruh/Nefes Alma (Idle Breathing State): Oyuncular dururken nefes alsın.
        const breathe = isIdle ? Math.sin(now * 3.5 + phaseOffset) * 0.7 * scale : 0;

        // Base animation values
        let bodyOffsetY   = isIdle ? breathe : Math.abs(swing) * -1.8 * scale * Math.min(1, velocity * 2); // bounce
        let bodyLean      = isIdle ? 0 : Math.min(0.35, velocity * 0.28) * facingDir; // lean forward when running
        let leftLegAngle  = swing * swingAmt;
        let rightLegAngle = -swing * swingAmt;
        const outfieldArmScale = isGK ? 1 : 0.68;
        let leftArmAngle  = -swing * swingAmt * 1.25 * outfieldArmScale;
        let rightArmAngle = swing * swingAmt * 1.25 * outfieldArmScale;
        let headBob       = isIdle ? breathe * 0.4 : Math.abs(Math.sin(walkCycle * 2)) * -1.5 * scale * Math.min(1, velocity * 2);
        let isSliding     = false;
        let isDiving      = false;

        // Arm drive: kosu hizina gore omuz rotasyonu ve kol pompasi artar.
        const runIntent = isIdle ? 0 : Math.min(1.2, velocity * 1.35);
        const torsoTwist = isIdle
            ? Math.sin(now * 2.2 + phaseOffset) * 0.04
            : swing * 0.14 * runIntent;

        const jostleMag = Math.min(1, Math.sqrt(jostleX * jostleX + jostleY * jostleY) / 3.2);
        const contactArmSpread = jostleMag * (isGK ? 0.12 : 0.06);

        leftArmAngle += torsoTwist - facingDir * 0.12 * runIntent - contactArmSpread;
        rightArmAngle -= torsoTwist + facingDir * 0.12 * runIntent + contactArmSpread;

        if (state === 'SPRINT') {
            const sprintArmMul = isGK ? 1.15 : 0.95;
            leftArmAngle *= sprintArmMul;
            rightArmAngle *= sprintArmMul;
        } else if (state === 'RUN') {
            const runArmMul = isGK ? 1.1 : 0.9;
            leftArmAngle *= runArmMul;
            rightArmAngle *= runArmMul;
        }

        const kickBlend = isKickLike ? Math.min(1, 0.35 + actionBlend * 1.15) : 0;
        const canHoldKickPose = isKickLike || (actionBlend > 0.12 && (hasBall || ballDist < 4.5));

        // --- ARCADE SPECIAL MOVES (Görsel Animasyonlar) ---
        // Röveşata (Bicycle Kick): Top çok yüksekteyse (z > 1.0) ve şut çekiyorsa.
        const isBicycleKick = isKickLike && z > 1.0;
        // Vole (Volley): Top yarı havadaysa (0.4 < z <= 1.0) ve şut çekiyorsa.
        const isVolley = isKickLike && z > 0.4 && z <= 1.0;

        // Özel animasyon uygulanıyorsa vücut genel lean/offset'ini ez.
        let arcadeRotation = 0;
        let arcadeOffsetY = 0;
        const activeSkillMove = hasBall ? skillMove : undefined;
        const activeBeatenEffect = !hasBall ? beatenEffect : undefined;

        if (isBicycleKick) {
            // Röveşata: Havalan, vücut geriye (veya öne) dönsün, bacaklar havalansın
            arcadeOffsetY = -25 * scale; // Havaya zıpla
            arcadeRotation = facingDir * -1.8; // Geriye tam takla / yatma
            bodyLean = 0; // Normal lean'i iptal et
            leftLegAngle = facingDir * -0.5; // Sol bacak destek (havada)
            rightLegAngle = facingDir * 1.5;  // Sağ bacak vuruş bacağı (yukarı kalkık)
            headBob = -8 * scale;
            leftArmAngle = facingDir * 2.5; // Kollar denge için arkaya
            rightArmAngle = facingDir * 2.5;
            
            // Röveşata tozu/efekti
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#e879f9'; // Morumsu özel efekt
            ctx.beginPath();
            ctx.ellipse(groundPos.x + jostleX, pos.y - 15 * scale, 25 * scale, 8 * scale, facingDir * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (isVolley) {
            // Vole: Hafif zıpla, yana yat (Matrix gibi yatay vole hissiyatı)
            arcadeOffsetY = -15 * scale; // Hafif zıplama
            arcadeRotation = facingDir * 1.2; // Yana / Geriye yatış
            bodyLean = 0;
            leftLegAngle = facingDir * 0.2;
            rightLegAngle = facingDir * -1.4; // Vole ayağı sertçe arkaya/yana açılır
            leftArmAngle = facingDir * -1.2;
            rightArmAngle = facingDir * 1.5;
            headBob = -4 * scale;
        }

        if (activeSkillMove === 'STEP_OVER') {
            const feint = Math.sin(now * 16 + phaseOffset);
            bodyOffsetY -= 1.2 * scale;
            bodyLean = facingDir * 0.1 * feint;
            leftLegAngle = 1.25 * feint;
            rightLegAngle = -0.9 * feint;
            leftArmAngle += facingDir * 0.45;
            rightArmAngle -= facingDir * 0.45;
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.arc(groundPos.x + jostleX, groundPos.y - 1.5 * scale, 8 * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (activeSkillMove === 'BODY_FEINT') {
            const feint = Math.sin(now * 18 + phaseOffset);
            arcadeOffsetY -= 1 * scale;
            bodyLean = facingDir * 0.22 * feint;
            leftArmAngle += facingDir * 0.35;
            rightArmAngle -= facingDir * 0.35;
            headBob -= 1.2 * scale;
        } else if (activeSkillMove === 'BURST') {
            bodyLean = facingDir * 0.28;
            bodyOffsetY -= 1.6 * scale;
            leftArmAngle *= 1.15;
            rightArmAngle *= 1.15;
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.ellipse(groundPos.x + jostleX - facingDir * 9 * scale, groundPos.y + jostleY, 16 * scale, 5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (activeSkillMove === 'ROULETTE') {
            const spin = now * 14 + phaseOffset;
            arcadeRotation = Math.sin(spin) * 0.45;
            bodyOffsetY -= 1.4 * scale;
            leftLegAngle = Math.sin(spin) * 1.1;
            rightLegAngle = Math.cos(spin) * 1.1;
            leftArmAngle += Math.cos(spin) * 0.35;
            rightArmAngle -= Math.cos(spin) * 0.35;
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.arc(groundPos.x + jostleX, groundPos.y + jostleY, 10 * scale, spin, spin + Math.PI * 1.5);
            ctx.stroke();
            ctx.restore();
        } else if (activeSkillMove === 'CUT_INSIDE') {
            const cut = Math.sin(now * 12 + phaseOffset);
            bodyLean = facingDir * (0.32 + cut * 0.08);
            bodyOffsetY -= 1.1 * scale;
            leftLegAngle = facingDir > 0 ? 0.45 + cut * 0.35 : -0.8 + cut * 0.25;
            rightLegAngle = facingDir > 0 ? -1.05 - cut * 0.2 : 0.35 - cut * 0.35;
            leftArmAngle += facingDir * 0.25;
            rightArmAngle -= facingDir * 0.45;
        } else if (activeSkillMove === 'ELASTICO') {
            const lash = Math.sin(now * 19 + phaseOffset);
            bodyLean = facingDir * (0.18 + lash * 0.12);
            bodyOffsetY -= 1.35 * scale;
            leftLegAngle = 1.4 * lash;
            rightLegAngle = -1.1 * lash;
            leftArmAngle += facingDir * 0.55;
            rightArmAngle -= facingDir * 0.35;
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(groundPos.x + jostleX - facingDir * 8 * scale, groundPos.y + jostleY + 2 * scale);
            ctx.quadraticCurveTo(groundPos.x + jostleX, groundPos.y + jostleY - 8 * scale, groundPos.x + jostleX + facingDir * 8 * scale, groundPos.y + jostleY + 2 * scale);
            ctx.stroke();
            ctx.restore();
        } else if (activeSkillMove === 'RAINBOW') {
            const flick = Math.sin(now * 17 + phaseOffset);
            arcadeOffsetY -= 2.2 * scale;
            bodyLean = facingDir * 0.08;
            leftLegAngle = facingDir * (0.35 + flick * 0.55);
            rightLegAngle = facingDir * (-1.35 - flick * 0.2);
            leftArmAngle += facingDir * 0.22;
            rightArmAngle -= facingDir * 0.55;
            headBob -= 1.8 * scale;
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.arc(groundPos.x + jostleX, groundPos.y + jostleY - 8 * scale, 9 * scale, Math.PI * 0.15, Math.PI * 0.9);
            ctx.stroke();
            ctx.restore();
        }

        if (activeBeatenEffect === 'STUMBLE') {
            const wobble = Math.sin(now * 14 + phaseOffset);
            bodyOffsetY += 1.8 * scale;
            bodyLean = -facingDir * 0.24 + wobble * 0.04;
            leftLegAngle = 0.9 + wobble * 0.3;
            rightLegAngle = -0.45;
            leftArmAngle = -facingDir * 0.9;
            rightArmAngle = facingDir * 0.35;
        } else if (activeBeatenEffect === 'SPIN_OUT') {
            const spinOut = now * 16 + phaseOffset;
            arcadeRotation = Math.sin(spinOut) * 0.38;
            bodyOffsetY += 1.2 * scale;
            leftLegAngle = Math.sin(spinOut) * 0.8;
            rightLegAngle = Math.cos(spinOut) * 0.8;
        } else if (activeBeatenEffect === 'WRONG_FOOTED') {
            bodyLean = -facingDir * 0.35;
            bodyOffsetY += 1 * scale;
            leftLegAngle = -0.8;
            rightLegAngle = 0.35;
            leftArmAngle = -facingDir * 0.4;
            rightArmAngle = -facingDir * 0.9;
        } else if (activeBeatenEffect === 'HEAD_TURN') {
            bodyOffsetY += 0.6 * scale;
            bodyLean = -facingDir * 0.18;
            headBob += 1.8 * scale;
            leftArmAngle = -facingDir * 0.25;
            rightArmAngle = facingDir * 0.8;
        }

        // --- KALECİ (GK) POSTÜRÜ ---
        // Kaleci boşta dururken dizlerini büküp ellerini yana açıp tetikte bekler (kaleci hissiyatı).
        if (isGK && isIdle && state !== 'DIVE_SAVE') {
            bodyOffsetY += 2.5 * scale; // Çömelme
            leftArmAngle = -0.55;       // Kollar dışarı açık (hazır kıta)
            rightArmAngle = 0.55;
            leftLegAngle = -0.2;        // Bacaklar hafif ayrık
            rightLegAngle = 0.2;
            bodyLean = facingDir * 0.05;
        }

        // Kalecinin yana kayarak aci kapatma davranisini daha dogal goster.
        const isGkLateralShuffle =
            isGK &&
            !isIdle &&
            !isDiving &&
            !isSliding &&
            !hasBall &&
            (state === 'RUN' || state === 'SPRINT');

        if (isGkLateralShuffle) {
            const shuffleSwing = Math.sin(walkCycle * 0.8) * 0.12;
            bodyOffsetY += 1.2 * scale;
            bodyLean = facingDir * 0.03;
            leftArmAngle = -0.35 + shuffleSwing;
            rightArmAngle = 0.35 - shuffleSwing;
            leftLegAngle = swing * 0.55;
            rightLegAngle = -swing * 0.55;
        }

        const shouldGkAnticipate =
            isGK &&
            !hasBall &&
            !isDiving &&
            !isSliding &&
            state !== 'DIVE_SAVE' &&
            gkThreat &&
            ballDist < 30;

        if (shouldGkAnticipate) {
            const prepPulse = Math.sin(now * 9 + phaseOffset) * 0.5;
            bodyOffsetY += 3.2 * scale + prepPulse * scale;
            bodyLean = facingDir * 0.04;
            leftArmAngle = -0.7;
            rightArmAngle = 0.7;
            if (isIdle) {
                leftLegAngle = -0.25;
                rightLegAngle = 0.25;
            }
        }

        const gkCatchPulse = isGK ? Math.max(0, catchPulse) : 0;

        // --- Special state overrides ---
        if (state === 'TACKLE') {
            isSliding     = true;
            bodyOffsetY   = 7 * scale;
            bodyLean      = facingDir * 0.5;
            leftLegAngle  = facingDir * 1.0;
            rightLegAngle = facingDir * 0.5;
            leftArmAngle  = -facingDir * 0.7;
            rightArmAngle = -facingDir * 0.4;
            headBob       = 0;
            // sliding dust
            ctx.fillStyle = 'rgba(200,180,130,0.28)';
            ctx.beginPath();
            ctx.ellipse(groundPos.x + jostleX - facingDir * 13 * scale, groundPos.y + jostleY, 20 * scale, 7 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (state === 'DIVE_SAVE') {
            isDiving      = true;
            bodyLean      = facingDir * 1.3;    // nearly horizontal
            bodyOffsetY   = -18 * scale;        // high in the air
            leftArmAngle  =  facingDir * 2.35;  // arms stretched harder for save reach
            rightArmAngle =  facingDir * 1.95;
            leftLegAngle  = -facingDir * 1.0;   // legs fully kicked back
            rightLegAngle = -facingDir * 0.6;
            headBob       = -4 * scale;
            // bright dive trail
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.ellipse(groundPos.x + jostleX + facingDir * 22 * scale, pos.y - 10 * scale, 28 * scale, 10 * scale, facingDir * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(groundPos.x + jostleX + facingDir * 10 * scale, pos.y - 6 * scale, 18 * scale, 7 * scale, facingDir * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
        } else if (state === 'JUMP' && z > 0.5) {
            bodyOffsetY   = -5 * scale;
            headBob       = -3 * scale;
            leftLegAngle  = -0.4;
            rightLegAngle =  0.4;
            leftArmAngle  = -0.9;
            rightArmAngle =  0.9;
        } else if (isThrowIn) {
            bodyOffsetY += 0.8 * scale;
            bodyLean = 0;
            leftArmAngle = -1.85;
            rightArmAngle = 1.85;
            leftLegAngle = -0.12;
            rightLegAngle = 0.18;
            headBob = -0.6 * scale;
        } else if (canHoldKickPose) {
            if (!isBicycleKick && !isVolley) {
                // Normal Vurus animasyonu: tek ayak acilir, digeri destekte kalir.
                const kb = Math.min(1, Math.max(0.22, kickBlend));
                bodyLean      = facingDir * lerp(0.14, 0.3, kb);
                bodyOffsetY   = lerp(-0.5, -2.2, kb) * scale;
                leftLegAngle  = lerp(leftLegAngle, 1.5 * facingDir, kb);
                rightLegAngle = lerp(rightLegAngle, -0.75 * facingDir, kb);
                leftArmAngle  = lerp(leftArmAngle, -1.0 * facingDir, kb);
                rightArmAngle = lerp(rightArmAngle, 0.8 * facingDir, kb);
                headBob       = lerp(headBob, -1.4 * scale, kb);
            }
        }

        // Glove snap: Kaleci topu tuttugu anda kollari hizla kapanip topu kilitler.
        if (isGK && hasBall && gkCatchPulse > 0.02 && !isDiving) {
            const snap = Math.min(1, gkCatchPulse);
            const squeeze = 0.35 + Math.sin(now * 34 + phaseOffset) * 0.08;
            const lock = snap * squeeze;

            bodyOffsetY += (1.8 + lock * 1.2) * scale;
            bodyLean = lerp(bodyLean, facingDir * 0.02, lock);
            leftArmAngle = lerp(leftArmAngle, -0.35 * facingDir, lock);
            rightArmAngle = lerp(rightArmAngle, 0.35 * facingDir, lock);
            headBob = lerp(headBob, -0.35 * scale, lock);
            leftLegAngle = lerp(leftLegAngle, -0.2, lock * 0.6);
            rightLegAngle = lerp(rightLegAngle, 0.2, lock * 0.6);
        }

        // Dribbling kick: when hasBall and moving, front foot snaps forward
        let dribbleKick = 0;
        if (hasBall && velocity > 0.15 && !isSliding && !isDiving && !isThrowIn) {
            const kickPhase = (now * 7 + phaseOffset) % (Math.PI * 2);
            if (kickPhase < 0.9) {
                dribbleKick = Math.sin((kickPhase / 0.9) * Math.PI) * 0.55;
                leftLegAngle = Math.max(leftLegAngle, dribbleKick);
            }
        }

        // --- Shadow ---
        const shadowAlpha = Math.max(0.12, 0.4 - z * 0.12);
        const shadowScale = Math.max(0.5, 1 - z * 0.15);
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(
            groundPos.x + jostleX, groundPos.y + jostleY,
            (isSliding ? 18 : 9) * scale * shadowScale,
            (isSliding ? 6  : 4) * scale * shadowScale,
            isSliding ? facingDir * 0.3 : 0, 0, Math.PI * 2
        );
        ctx.fill();

        const bodyX  = pos.x;
        const bodyY  = pos.y + bodyOffsetY + arcadeOffsetY;
        const plantWeight = isIdle ? 0 : Math.max(0, 1 - Math.abs(Math.cos(walkCycle)));
        const footPlantX =
            isIdle
                ? 0
                : -facingDir * Math.sin(walkCycle) * plantWeight * Math.min(1.15, velocity) * 2.3 * scale;
        const plantedBodyX = bodyX + footPlantX;
        const hipY   = bodyY - 10 * scale;
        const pivotY = bodyY - 18 * scale; // lean pivot (torso centre)

        // Apply Arcade Rotation / lean
        if (arcadeRotation !== 0) {
            ctx.translate(plantedBodyX, pivotY);
            ctx.rotate(arcadeRotation);
            ctx.translate(-plantedBodyX, -pivotY);
        } else if (bodyLean !== 0) {
            ctx.translate(plantedBodyX, pivotY);
            ctx.rotate(bodyLean);
            ctx.translate(-plantedBodyX, -pivotY);
        }

        // ── 2-segment leg helper ──────────────────────────────────────
        const drawLeg = (originX: number, angle: number, kick: boolean) => {
            const thighLen = 9 * scale;
            const shinLen  = 8 * scale;

            // thigh
            const kneeX = originX + Math.sin(angle) * thighLen * facingDir;
            const kneeY = hipY + Math.cos(angle) * thighLen;

            // shin bends naturally (less angled than thigh)
            const shinBend = kick ? 0.48 : Math.abs(angle) * 0.3;
            const shinAngle = angle * 0.5 + shinBend * (angle >= 0 ? 1 : -1);
            const footX = kneeX + Math.sin(shinAngle) * shinLen * facingDir;
            const footY = kneeY + Math.cos(shinAngle) * shinLen;

            // thigh (shorts colour)
            ctx.strokeStyle = shortColor;
            ctx.lineWidth   = Math.max(2.5, 5 * scale);
            ctx.beginPath();
            ctx.moveTo(originX, hipY);
            ctx.lineTo(kneeX, kneeY);
            ctx.stroke();

            // shin (skin)
            ctx.strokeStyle = skinColor;
            ctx.lineWidth   = Math.max(2, 4 * scale);
            ctx.beginPath();
            ctx.moveTo(kneeX, kneeY);
            ctx.lineTo(footX, footY);
            ctx.stroke();

            // boot
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(footX, footY, 4.8 * scale, 2.2 * scale, Math.atan2(footY - kneeY, footX - kneeX), 0, Math.PI * 2);
            ctx.fill();
        };

        drawLeg(plantedBodyX - 2 * scale, leftLegAngle,  dribbleKick > 0.1);
        drawLeg(plantedBodyX + 2 * scale, rightLegAngle, false);

        // ── Shorts ────────────────────────────────────────────────────
        ctx.fillStyle = shortColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(plantedBodyX - 5.5 * scale * bodyWidthScale, hipY - 5 * scale, 11 * scale * bodyWidthScale, 5 * scale, 1.5 * scale);
        else ctx.rect(plantedBodyX - 5.5 * scale * bodyWidthScale, hipY - 5 * scale, 11 * scale * bodyWidthScale, 5 * scale);
        ctx.fill();

        // ── Shirt ─────────────────────────────────────────────────────
        ctx.fillStyle = shirtColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(plantedBodyX - 6 * scale * bodyWidthScale, hipY - 20 * scale, 12 * scale * bodyWidthScale, 12 * scale, 2 * scale);
        else ctx.rect(plantedBodyX - 6 * scale * bodyWidthScale, hipY - 20 * scale, 12 * scale * bodyWidthScale, 12 * scale);
        ctx.fill();
        // subtle centre stripe
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(plantedBodyX - 1.5 * scale * bodyWidthScale, hipY - 19 * scale, 3 * scale * bodyWidthScale, 10 * scale);

        // ── 2-segment arm helper ──────────────────────────────────────
        const drawArm = (fromX: number, angle: number) => {
            const gkReachMul = isGK && isDiving ? 1.35 : isGK ? 1.08 : 1.0;
            const upperLen = 9 * scale * gkReachMul;
            const foreLen  = 8 * scale * gkReachMul;

            const sidePhase = fromX < plantedBodyX ? 0 : Math.PI;
            const shoulderLift = isIdle
                ? breathe * 0.25
                : Math.sin(walkCycle + sidePhase) * 0.9 * scale * runIntent;
            const shoulderY = hipY - 15 * scale + shoulderLift;

            const elbowX = fromX + Math.sin(angle) * upperLen * facingDir;
            const elbowY = shoulderY + Math.cos(angle) * upperLen * 0.72;

            const bendBase = isIdle
                ? 0.32
                : 0.45 + Math.min(0.28, Math.abs(swing) * 0.2 + velocity * 0.16);
            const bendDir = angle >= 0 ? 1 : -1;
            const handAngle = angle * 0.62 + bendBase * bendDir;
            const handX = elbowX + Math.sin(handAngle) * foreLen * facingDir;
            const handY = elbowY + Math.cos(handAngle) * foreLen * 0.78;

            // upper arm = shirt colour
            ctx.strokeStyle = shirtColor;
            ctx.lineWidth   = Math.max(2, 4 * scale);
            ctx.beginPath();
            ctx.moveTo(fromX, shoulderY);
            ctx.lineTo(elbowX, elbowY);
            ctx.stroke();

            // forearm = skin
            ctx.strokeStyle = skinColor;
            ctx.lineWidth   = Math.max(1.5, 3 * scale);
            ctx.beginPath();
            ctx.moveTo(elbowX, elbowY);
            ctx.lineTo(handX, handY);
            ctx.stroke();

            // El noktasi: kolun segmentli oldugu daha net gorunsun.
            const handColor = isGK ? '#f8fafc' : skinColor;
            ctx.fillStyle = handColor;
            ctx.beginPath();
            if (isGK) {
                const gloveSnapScale = 1 + (hasBall ? gkCatchPulse * 0.28 : 0);
                ctx.ellipse(
                    handX,
                    handY,
                    Math.max(1.4, 2.5 * scale) * gloveSnapScale,
                    Math.max(1.1, 1.9 * scale) * (1 + gkCatchPulse * 0.12),
                    Math.atan2(handY - elbowY, handX - elbowX),
                    0,
                    Math.PI * 2,
                );
            } else {
                ctx.arc(handX, handY, Math.max(1.2, 1.8 * scale), 0, Math.PI * 2);
            }
            ctx.fill();
        };

        // Arms start from left/right shoulders (NOT the same point!)
        drawArm(plantedBodyX - shoulderSpread, leftArmAngle);
        drawArm(plantedBodyX + shoulderSpread, rightArmAngle);

        // ── Head ─────────────────────────────────────────────────────
        const headY = hipY - 27 * scale + headBob;
        // neck
        ctx.strokeStyle = skinColor;
        ctx.lineWidth   = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(plantedBodyX, hipY - 20 * scale);
        ctx.lineTo(plantedBodyX, headY + 5 * scale);
        ctx.stroke();
        // head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(plantedBodyX, headY, 6 * scale * bodyWidthScale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        // hair
        ctx.fillStyle = '#2d1b00';
        ctx.beginPath();
        ctx.ellipse(plantedBodyX, headY - scale, 6 * scale * bodyWidthScale, 6 * scale, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Direction-aware face hints: profilede tek goz, onde iki goz.
        if (frontness > 0.35) {
            ctx.fillStyle = '#0f172a';
            const eyeDx = 2.2 * scale * bodyWidthScale;
            ctx.beginPath();
            ctx.arc(plantedBodyX - eyeDx, headY - 0.6 * scale, 0.9 * scale, 0, Math.PI * 2);
            ctx.arc(plantedBodyX + eyeDx, headY - 0.6 * scale, 0.9 * scale, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(plantedBodyX + facingDir * 2.4 * scale, headY - 0.6 * scale, 0.95 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // Undo lean / Arcade Rotation
        if (arcadeRotation !== 0) {
            ctx.translate(plantedBodyX, pivotY);
            ctx.rotate(-arcadeRotation);
            ctx.translate(-plantedBodyX, -pivotY);
        } else if (bodyLean !== 0) {
            ctx.translate(plantedBodyX, pivotY);
            ctx.rotate(-bodyLean);
            ctx.translate(-plantedBodyX, -pivotY);
        }

        // ── UI: name tag ──────────────────────────────────────────────
        if (showNamesRef.current) {
            const nameText = `#${num} ${name.substring(0, 8)}`;
            // Scale düştüğü için font boyutu oranlarını yükseltiyoruz (Görünür kalması için)
            const fontSize = Math.round(Math.max(7, 12 * scale));
            ctx.font = `bold ${fontSize}px Arial`;
            const tw = ctx.measureText(nameText).width;
            const nameTagY = pos.y - 55 * scale;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(pos.x - tw / 2 - 3, nameTagY - fontSize, tw + 6, fontSize + 2, 3);
            else ctx.rect(pos.x - tw / 2 - 3, nameTagY - fontSize, tw + 6, fontSize + 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(nameText, pos.x, nameTagY);
        }

        // ── UI: stamina bar ───────────────────────────────────────────
        if (stamina < 95) {
            const bw = 22 * scale, bh = 3.5 * scale;
            const by = groundPos.y + jostleY + 10 * scale;
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(pos.x - bw / 2, by, bw, bh);
            ctx.fillStyle = stamina > 60 ? '#22c55e' : stamina > 25 ? '#eab308' : '#ef4444';
            ctx.fillRect(pos.x - bw / 2, by, bw * (stamina / 100), bh);
        }

        // ── UI: ball possession ring ──────────────────────────────────
        if (hasBall) {
            ctx.strokeStyle = 'rgba(251,191,36,0.85)';
            ctx.lineWidth = (3.5 + gkCatchPulse * 1.8) * scale;
            ctx.setLineDash([4 * scale, 4 * scale]);
            ctx.beginPath();
            ctx.ellipse(groundPos.x + jostleX, groundPos.y + jostleY, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // GK Catch Pulse: Kalecinin topu yeni tuttugu ani kisa bir parlama ile vurgula.
        if (gkCatchPulse > 0.02) {
            const glowA = 0.16 + gkCatchPulse * 0.34;
            const glowR = (10 + gkCatchPulse * 11) * scale;

            ctx.save();
            ctx.globalAlpha = glowA;
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            ctx.ellipse(plantedBodyX + facingDir * 2.2 * scale, hipY - 13 * scale, glowR, glowR * 0.68, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.2 + gkCatchPulse * 0.45;
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = (1.5 + gkCatchPulse * 2.2) * scale;
            ctx.beginPath();
            ctx.arc(plantedBodyX + facingDir * 2.2 * scale, hipY - 13 * scale, (4.2 + gkCatchPulse * 5.5) * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // ── UI: special labels ────────────────────────────────────────
        const drawLabel = (text: string, color: string) => {
            const lfs = Math.round(14 * scale);
            ctx.font = `bold ${lfs}px Arial`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 4 * scale;
            ctx.strokeText(text, pos.x, pos.y - 65 * scale);
            ctx.fillStyle = color;
            ctx.fillText(text, pos.x, pos.y - 65 * scale);
        };

        if (state === 'TACKLE') {
            drawLabel('TACKLE!', '#ef4444');
        } else if (state === 'DIVE_SAVE') {
            drawLabel('SAVE!', '#22c55e');
        } else if (shotType === 'BICYCLE' || (z > 1.2 && isKickLike)) {
            drawLabel('RÖVEŞATA!', '#a855f7');
        } else if (shotType === 'VOLLEY' && isKickLike) {
            drawLabel('VOLE!', '#f97316');
        } else if (shotType === 'SCREAMER' && isKickLike) {
            drawLabel('SCREAMER!', '#ef4444');
        } else if (activeSkillMove === 'STEP_OVER') {
            drawLabel('SKILL!', '#facc15');
        } else if (activeSkillMove === 'BODY_FEINT') {
            drawLabel('FEINT!', '#38bdf8');
        } else if (activeSkillMove === 'BURST') {
            drawLabel('BURST!', '#fb7185');
        } else if (activeSkillMove === 'ROULETTE') {
            drawLabel('ROULETTE!', '#c084fc');
        } else if (activeSkillMove === 'CUT_INSIDE') {
            drawLabel('CUT!', '#f97316');
        } else if (activeSkillMove === 'ELASTICO') {
            drawLabel('ELASTICO!', '#34d399');
        } else if (activeSkillMove === 'RAINBOW') {
            drawLabel('RAINBOW!', '#f59e0b');
        }

        ctx.restore();
    };

    // === GOL TEKRARI — REPLAY BAŞLATICI ===
    const startReplayRef = useRef<(snapshot: any[], ballX: number, ballY: number) => void>(() => {});

    const startReplay = useCallback((snapshot: any[], ballX: number, ballY: number) => {
        if (!isGoalReplayEnabled || snapshot.length < 10) return;
        if (logicTimerRef.current) { window.clearInterval(logicTimerRef.current); logicTimerRef.current = null; }
        if (replayTimerRef.current) { window.clearInterval(replayTimerRef.current); replayTimerRef.current = null; }
        replaySnapshotRef.current = snapshot;
        replayFrameRef.current = 0;
        replayZoomCenterRef.current = { x: ballX, y: ballY };
        replayZoomRef.current = 1.0;
        isReplayingRef.current = true;
        setIsReplaying(true);
        // Her 150ms'de bir frame ilerle → ~0.33x yavaş çekim
        replayTimerRef.current = window.setInterval(() => {
            const snap = replaySnapshotRef.current;
            const idx = replayFrameRef.current;
            if (idx >= snap.length - 1) {
                window.clearInterval(replayTimerRef.current!);
                replayTimerRef.current = null;
                isReplayingRef.current = false;
                setIsReplaying(false);
                return;
            }
            replayFrameRef.current = idx + 1;
            lastTickState.current = snap[Math.max(0, idx)];
            nextTickState.current = snap[idx + 1];
            lastTickTime.current = performance.now();
            
            // Kullanıcı isteği: Kameranın olay yerine 'birden' gelmesi ve yavaş yavaş yakınlaşmak yerine direk izletmesi.
            replayZoomRef.current = 1.9;
        }, 110);
    }, [isGoalReplayEnabled]);
    // Her render'da ref'i güncelle — useEffect kapanımları eski versiyonu yakalamaz
    startReplayRef.current = startReplay;

    // Render loop
    const render = useCallback(() => {
        if (!canvasRef.current || !lastTickState.current || !nextTickState.current) {
            renderReqRef.current = requestAnimationFrame(render);
            return;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) {
            renderReqRef.current = requestAnimationFrame(render);
            return;
        }

        const prevState = lastTickState.current;
        const nextState = nextTickState.current;
        const motionCache = playerMotionCache.current;
        const gkCatchPulse = gkCatchPulseRef.current;

        Object.keys(gkCatchPulse).forEach((id) => {
            gkCatchPulse[id] *= 0.84;
            if (gkCatchPulse[id] < 0.02) delete gkCatchPulse[id];
        });

        const nowMs = performance.now();
        const tickDuration = speed === 2 ? 60 : speed === 0.5 ? 240 : speed === 4 ? 30 : 120;
        const elapsed = nowMs - lastTickTime.current;
        const alpha = Math.min(1, Math.max(0, elapsed / tickDuration));
        const now = nowMs / 1000; // seconds — used for animation

        // --- CAMERA TRACKING (FM Style Dynamic Panning) ---
        // Kamerayı topun olduğu yere doğru yumuşakça(Linterp) kaydırıyoruz.
        const prevBallC = prevState.ball;
        const nextBallC = nextState.ball;
        let targetCamX = 50; 
        let targetCamY = 50;

        if (prevBallC && nextBallC) {
            const pb = normalizeCoords(prevBallC.x, prevBallC.y);
            const nb = normalizeCoords(nextBallC.x, nextBallC.y);
            targetCamX = lerp(pb.x, nb.x, alpha);
            targetCamY = lerp(pb.y, nb.y, alpha);
        }

        // --- REPLAY KAMERA GEÇERSİZ KILMA ---
        if (isReplayingRef.current) {
            // Replay oynarken doğrudan gol ağzına (veya hedeflenen merkeze) odaklan
            const rCenter = replayZoomCenterRef.current;
            // Aksiyona tam kilitlenmek yerine kaleye yakın bölgeye bak, top yaklaşıyorsa top+kale
            // Yumuşak geçiş için sadece hedeflenen pozisyonu değiştiriyoruz
            const diffX = rCenter.x - targetCamX;
            // Eğer top kaleye çok uzaksa (replay başı), kamerayı top ile kale arasında tutuyoruz
            // Top kaleye yaklaştıkça kaleye tam kitleniyor
            const weight = Math.min(1.0, Math.max(0, 1.0 - (Math.abs(diffX) / 40)));
            targetCamX = lerp(targetCamX, rCenter.x, weight * 0.8 + 0.2);
            targetCamY = lerp(targetCamY, rCenter.y, weight * 0.8 + 0.2);
        }

        // Kamerayi topun etrafinda tutarken cizgilere fazla yaslanmasini engelle.
        // Boylece saha disi daha az gorunur ve takip daha dengeli hissedilir.
        targetCamX = clamp(targetCamX, 22, 78);
        targetCamY = clamp(targetCamY, 18, 82);

        // Kamera hedefe anında gitmez, süzülerek (ease) takip eder
        cameraPos.current.xPct = lerp(cameraPos.current.xPct, targetCamX, 0.08);
        cameraPos.current.yPct = lerp(cameraPos.current.yPct, targetCamY, 0.08);

        // Kameranın piksel ofsetlerini hesapla: (Kamera merkeze 50,50'ye göre ne kadar sapmış)
        const centerScreen = toScreenDeep(50, 50, 0);
        const camFocusScreen = toScreenDeep(cameraPos.current.xPct, cameraPos.current.yPct, 0);
        
        let camOffsetX = centerScreen.x - camFocusScreen.x;
        let camOffsetY = centerScreen.y - camFocusScreen.y;

        ctx.save();
        // === KAMERA RENDER & ZOOMLAR ===
        let appliedZoom = 1.0;
        
        // Replay modunda ana zoom ve tracking'i birleştiriyoruz
        if (isReplayingRef.current) {
            appliedZoom = Math.max(1.0, replayZoomRef.current);
            // Gol tekrarında daha sinematik olması için temel tracking zoomunu da ekleyebiliriz
            if (cameraTrackingRef.current) {
                appliedZoom *= 1.3; // Replay modunda biraz ekstra zoom
            }
        } else if (cameraTrackingRef.current) {
            appliedZoom = 1.58;
        }

        if (appliedZoom > 1.0) {
            const maxOffsetX = (CANVAS_W * appliedZoom - CANVAS_W) / 2;
            const maxOffsetY = (CANVAS_H * appliedZoom - CANVAS_H) / 2;
            // Güvenlik sınırları
            const safeOffsetX = Math.max(0, maxOffsetX - 92);
            const safeOffsetY = Math.max(0, maxOffsetY - 56);
            
            camOffsetX = Math.max(-safeOffsetX, Math.min(safeOffsetX, camOffsetX * appliedZoom));
            camOffsetY = Math.max(-safeOffsetY, Math.min(safeOffsetY, camOffsetY * appliedZoom));

            ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
            ctx.scale(appliedZoom, appliedZoom);
            ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
            
            ctx.translate(Math.round(camOffsetX / appliedZoom), Math.round(camOffsetY / appliedZoom));
        }

        // 1. Draw Field Environment
        drawPitch3D(ctx);

        // 2. Map and Sort entities for Depth (Y-sorting)
        const simPlayerIds = Object.keys(nextState.players || {});
        const allPlayers = homePlayersRef.current.concat(awayPlayersRef.current).filter(p => simPlayerIds.includes(p.id));
        const activePlayerIds = new Set(allPlayers.map(p => p.id));

        const prevOwnerId = prevState.ball?.ownerId || null;
        const nextOwnerId = nextState.ball?.ownerId || null;
        if (nextOwnerId && nextOwnerId !== prevOwnerId) {
            const newOwner = allPlayers.find((p) => p.id === nextOwnerId);
            if (newOwner?.position === 'GK') {
                gkCatchPulse[nextOwnerId] = 1;
            }
        }

        Object.keys(motionCache).forEach((id) => {
            if (!activePlayerIds.has(id)) delete motionCache[id];
        });

        // Bellek Havuzlarını (Pools) sıfırla - Yeni dizi/obje üretimi GC Spikes yaratmaz!
        entitiesPool.current.length = 0;
        playerInfosPool.current.length = 0;
        const entities = entitiesPool.current;
        const playerInfos = playerInfosPool.current;
        const jostleMap = jostleMapPool.current;

        // --- First pass: collect player render data ---
        allPlayers.forEach(p => {
            const prevP = prevState.players[p.id];
            const nextP = nextState.players[p.id];
            if (!prevP || !nextP) return;

            const prevNorm = normalizeCoords(prevP.x, prevP.y);
            const nextNorm = normalizeCoords(nextP.x, nextP.y);

            const xVal = lerp(prevNorm.x, nextNorm.x, alpha);
            const yVal = lerp(prevNorm.y, nextNorm.y, alpha);
            const zVal = nextP.z || 0;

            const dx = nextNorm.x - prevNorm.x;
            const dy = nextNorm.y - prevNorm.y;
            // velocity: scaled so walking ~0.3, sprinting ~0.8-1.0
            const rawVelocity = Math.min(1.2, Math.sqrt(dx * dx + dy * dy) * 22);
            const movementState = nextP.state || 'IDLE';
            const stateVelocityFloor =
                movementState === 'SPRINT'
                    ? 0.92
                    : movementState === 'RUN'
                        ? 0.62
                        : movementState === 'KICK' || movementState === 'SHOT'
                            ? 0.48
                            : 0;
            const velocity = Math.max(rawVelocity, stateVelocityFloor);

            const isHome = p.teamId === homeTeamRef.current.id;
            let targetFacing = isHome ? 0 : Math.PI;
            if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
                targetFacing = Math.atan2(dy, dx);
            } else if (nextState.ball) {
                const bNorm = normalizeCoords(nextState.ball.x, nextState.ball.y);
                targetFacing = Math.atan2(bNorm.y - nextNorm.y, bNorm.x - nextNorm.x);
            }

            // Stable per-player phase from id hash
            let phaseOffset = 0;
            for (let i = 0; i < p.id.length; i++) {
                phaseOffset = (phaseOffset * 31 + p.id.charCodeAt(i)) & 0xffff;
            }
            phaseOffset = (phaseOffset / 0xffff) * Math.PI * 2;

            const cached = motionCache[p.id] || {
                x: xVal,
                y: yVal,
                z: zVal,
                facing: targetFacing,
                velocity,
                stride: phaseOffset,
                state: movementState,
                actionBlend: 0,
            };

            const facingSmooth = cached.facing + shortestAngleDelta(cached.facing, targetFacing) * 0.28;
            const velocitySmooth = lerp(cached.velocity, velocity, 0.4);
            const moveBlend = nextP.state === 'SPRINT' ? 0.38 : nextP.state === 'RUN' ? 0.3 : 0.24;
            const xSmooth = lerp(cached.x, xVal, moveBlend);
            const ySmooth = lerp(cached.y, yVal, moveBlend);
            const zSmooth = lerp(cached.z, zVal, 0.45);
            const travelDist = Math.sqrt(Math.pow(xSmooth - cached.x, 2) + Math.pow(ySmooth - cached.y, 2));
            const strideBoost = nextP.state === 'SPRINT' ? 1.15 : nextP.state === 'RUN' ? 0.95 : 0.72;
            const rawAdvance = travelDist * strideBoost;
            const phaseAdvance = Math.min(0.42, Math.max(0.015, rawAdvance));
            const stridePhase = (cached.stride + phaseAdvance) % (Math.PI * 2);
            const impactfulState =
                movementState === 'KICK' ||
                movementState === 'SHOT' ||
                movementState === 'TACKLE' ||
                movementState === 'DIVE_SAVE' ||
                movementState === 'JUMP';
            const transitioned = cached.state !== movementState;
            let actionBlend = cached.actionBlend * 0.82;
            if (transitioned && impactfulState) actionBlend = 1;
            else if (movementState === 'KICK' || movementState === 'SHOT') actionBlend = Math.max(actionBlend, 0.7);
            if (!impactfulState && nextState.ball?.ownerId !== p.id) {
                actionBlend *= 0.45;
            }

            motionCache[p.id] = {
                x: xSmooth,
                y: ySmooth,
                z: zSmooth,
                facing: facingSmooth,
                velocity: velocitySmooth,
                stride: stridePhase,
                state: movementState,
                actionBlend,
            };

            const b = nextState.ball;
            let ballDist = 999;
            let gkThreat = false;
            if (b) {
                const bNorm = normalizeCoords(b.x, b.y);
                ballDist = Math.sqrt(Math.pow(bNorm.x - xSmooth, 2) + Math.pow(bNorm.y - ySmooth, 2));
                const isHomePlayer = p.teamId === homeTeamRef.current.id;
                const ballMovingToGoal = isHomePlayer ? (b.vx || 0) < -0.08 : (b.vx || 0) > 0.08;
                const centralLane = Math.abs(bNorm.y - ySmooth) < 24;
                gkThreat = ballMovingToGoal && centralLane;
            }

            playerInfos.push({
                id: p.id, xVal: xSmooth, yVal: ySmooth, zVal: zSmooth,
                facing: facingSmooth, velocity: velocitySmooth, stridePhase, actionBlend, phaseOffset,
                teamId: p.teamId,
                primary: isHome ? homeTeamRef.current.primaryColor : awayTeamRef.current.primaryColor,
                secondary: isHome ? homeTeamRef.current.secondaryColor : awayTeamRef.current.secondaryColor,
                num: playerNumbers.current[p.id] || 0,
                hasBall: nextState.ball?.ownerId === p.id,
                name: p.lastName, state: nextP.state || 'IDLE', stamina: nextP.stamina || 100,
                position: p.position || 'MID',
                gkThreat,
                ballDist,
                catchPulse: gkCatchPulse[p.id] || 0,
                skillMove: nextP.skillMove,
                beatenEffect: nextP.beatenEffect,
                shotType: (nextP as any).shotType as string | undefined,
            });
        });

        // --- Second pass: compute proximity jostle offsets ---
        playerInfos.forEach(pi => { jostleMap[pi.id] = { x: 0, y: 0 }; });

        for (let i = 0; i < playerInfos.length; i++) {
            for (let j = i + 1; j < playerInfos.length; j++) {
                const a = playerInfos[i], b = playerInfos[j];
                const dx = a.xVal - b.xVal;
                const dy = a.yVal - b.yVal;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const JOSTLE_DIST = 4.5; // pitch-% units
                if (dist < JOSTLE_DIST && dist > 0.05) {
                    const strength = (1 - dist / JOSTLE_DIST) * 2.5;
                    const nx = dx / dist, ny = dy / dist;
                    const wobble = Math.sin(now * 9 + a.phaseOffset) * 0.35;
                    jostleMap[a.id].x += nx * (strength + wobble);
                    jostleMap[a.id].y += ny * strength * 0.5;
                    jostleMap[b.id].x -= nx * (strength + wobble);
                    jostleMap[b.id].y -= ny * strength * 0.5;
                }
            }
        }

        // --- Build player entities ---
        playerInfos.forEach(pi => {
            const j = jostleMap[pi.id] || { x: 0, y: 0 };
            // Default colors override: user team = blue, opponent = red
            let primary = pi.primary;
            let secondary = pi.secondary;
            if (useDefaultColorsRef.current) {
                const controlledTeamId = managedSideRef.current === 'HOME' ? homeTeamRef.current.id : awayTeamRef.current.id;
                const kit = getDefaultKitColors(pi.teamId === controlledTeamId);
                primary = kit.primary;
                secondary = kit.secondary;
            }
            entities.push({
                type: 'PLAYER',
                ySort: pi.yVal,
                renderFn: () => drawSpritePlayer(
                    ctx, pi.xVal, pi.yVal, pi.zVal, pi.facing,
                    primary, secondary, pi.num,
                    pi.hasBall, pi.name, pi.state, pi.stamina,
                    pi.velocity, pi.stridePhase, pi.actionBlend, pi.phaseOffset, j.x, j.y, now, pi.position,
                    pi.gkThreat, pi.ballDist, pi.catchPulse, pi.skillMove, pi.beatenEffect, pi.shotType
                )
            });
        });

        // Prepare Ball and Trail Dynamics
        const prevBall = prevState.ball;
        const nextBall = nextState.ball;
        if (prevBall && nextBall) {
            const prevBNrm = normalizeCoords(prevBall.x, prevBall.y);
            const nxtBNrm = normalizeCoords(nextBall.x, nextBall.y);

        const bX = lerp(prevBNrm.x, nxtBNrm.x, alpha);
        const bY = lerp(prevBNrm.y, nxtBNrm.y, alpha);
        let bZ = lerp(prevBall.z || 0, nextBall.z || 0, alpha);
        if (![bX, bY, bZ].every(Number.isFinite)) {
            bZ = 0;
        }
        
        // Zıplayan topun fizik kurallarına(Yerden sekme hissi) uyması için z de ufak bir eğri eklemek iyi olabilir 
        // Ancak ana sorun subpixel rendering, x ve y de ondalıklı kaldı.
        let finalBX = bX;
        let finalBY = bY;
        
        // Gol Ağları Fiziği (Topun ağları delmesini önle)
        if (bY > 44.0 && bY < 56.0) { // Kale genişliği içinde
            finalBX = clamp(bX, -3.8, 103.8); // Ağın arkası (-4 ve 104)
            if (bX < 0 || bX > 100) {
               // Kale içi yan ağlara (şut direk dibine gitmişse) çarpıp durmasını sağla
               finalBY = clamp(bY, 44.5, 55.5);
            }
        }

        const RenderBX = Math.round(finalBX * 100) / 100;
        const RenderBY = Math.round(finalBY * 100) / 100;

        // Kuyruk / İvme Hesaplaması (Motion Blur için)
        const speedMagnitude = Math.sqrt(Math.pow(nxtBNrm.x - prevBNrm.x, 2) + Math.pow(nxtBNrm.y - prevBNrm.y, 2));
        if (speed > 0 && speedMagnitude > 0.05 && [RenderBX, RenderBY, bZ].every(Number.isFinite)) {
            ballTrailPool.current.push({ x: RenderBX, y: RenderBY, z: bZ });
            if (ballTrailPool.current.length > 7) ballTrailPool.current.shift();
        } else if (ballTrailPool.current.length > 0) {
            if (Math.random() > 0.5) ballTrailPool.current.shift();
        }

        if ([RenderBX, RenderBY, bZ].every(Number.isFinite)) {
            entities.push({
                type: 'BALL',
                ySort: RenderBY,
                renderFn: () => drawBall3D(ctx, RenderBX, RenderBY, bZ, ballTrailPool.current)
            });
        }
        }

        // Sort by depth (Y coordinate ascending = back to front)
        entities.sort((a, b) => a.ySort - b.ySort);

        // Draw entities back to front
        entities.forEach(ent => ent.renderFn());

        ctx.restore(); // Kamera Translate & Zoom efektini bitir.
        
        // Score Overlay top
        // Rendered via HTML overlay now


        renderReqRef.current = requestAnimationFrame(render);
    }, [speed]);

    useEffect(() => {
        render();
        return () => {
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current);
        };
    }, [render]);

    // OVR breakdown helper
    const renderOVR = (players: Player[], align: 'left' | 'right') => {
        const starters = players.filter(p => p.lineup === 'STARTING');
        const defs = starters.filter(p => p.position === 'DEF');
        const mids = starters.filter(p => p.position === 'MID');
        const fwds = starters.filter(p => p.position === 'FWD');
        const avg = (arr: typeof starters) => arr.length > 0 ? Math.round(arr.reduce((s, p) => s + p.overall, 0) / arr.length) : 0;
        const liveAvg = (arr: typeof starters) => arr.length > 0 ? Math.round(arr.reduce((s, p) => {
            const stam = getLivePlayerStamina(p.id) ?? 100;
            return s + calculateEffectiveRating(p, p.position as any, stam);
        }, 0) / arr.length) : 0;
        return (
            <div className={`flex items-center gap-1 text-[8px] font-mono flex-wrap ${align === 'right' ? 'justify-end' : ''}`}>
                <span className="text-sky-400">D:{avg(defs)}<span className="text-sky-600/70">({liveAvg(defs)})</span></span>
                <span className="text-emerald-400">M:{avg(mids)}<span className="text-emerald-600/70">({liveAvg(mids)})</span></span>
                <span className="text-orange-400">F:{avg(fwds)}<span className="text-orange-600/70">({liveAvg(fwds)})</span></span>
                <span className="text-white font-bold">⌀{avg(starters)}</span>
            </div>
        );
    };

    const getSquadAverages = (players: Player[]) => {
        const starters = players.filter(p => p.lineup === 'STARTING');
        const avg = starters.length > 0 ? Math.round(starters.reduce((sum, player) => sum + player.overall, 0) / starters.length) : 0;
        const liveAvg = starters.length > 0 ? Math.round(starters.reduce((sum, player) => {
            const stamina = getLivePlayerStamina(player.id) ?? 100;
            return sum + calculateEffectiveRating(player, player.position as any, stamina);
        }, 0) / starters.length) : 0;
        return { avg, liveAvg };
    };

    const getDetailedUnitAverages = (players: Player[]) => {
        const starters = players.filter(p => p.lineup === 'STARTING');
        const defs = starters.filter(p => p.position === 'DEF');
        const mids = starters.filter(p => p.position === 'MID');
        const fwds = starters.filter(p => p.position === 'FWD');
        const calc = (group: Player[]) => {
            const avg = group.length > 0 ? Math.round(group.reduce((sum, player) => sum + player.overall, 0) / group.length) : 0;
            const liveAvg = group.length > 0 ? Math.round(group.reduce((sum, player) => {
                const stamina = getLivePlayerStamina(player.id) ?? 100;
                return sum + calculateEffectiveRating(player, player.position as any, stamina);
            }, 0) / group.length) : 0;
            return { avg, liveAvg };
        };

        return {
            defs: calc(defs),
            mids: calc(mids),
            fwds: calc(fwds),
            all: calc(starters),
        };
    };

    const keyEvents = useMemo(
        () => (match.events || []).filter(event =>
            event.type !== MatchEventType.INFO &&
            event.type !== MatchEventType.KICKOFF &&
            event.type !== MatchEventType.GOAL &&
            (event.type as string) !== 'THROW_IN'
        ).slice(-4).reverse(),
        [match.events]
    );

    const quickStats = useMemo(() => ([
        {
            label: t.possession || 'Topa sahip',
            value: `${match.stats?.homePossession ?? 50}% - ${match.stats?.awayPossession ?? 50}%`
        },
        {
            label: t.shots || 'Şut',
            value: `${match.stats?.homeShots ?? 0} - ${match.stats?.awayShots ?? 0}`
        },
        {
            label: t.onTarget || 'İsabetli',
            value: `${match.stats?.homeOnTarget ?? 0} - ${match.stats?.awayOnTarget ?? 0}`
        },
        {
            label: 'xG',
            value: `${(match.stats?.homeXG ?? 0).toFixed(1)} - ${(match.stats?.awayXG ?? 0).toFixed(1)}`
        }
    ]), [match.stats, t.onTarget, t.possession, t.shots]);

    const eventStats = useMemo(() => {
        const events = match.events || [];
        return {
            homeFouls: events.filter(e => e.type === MatchEventType.FOUL && e.teamId === homeTeam.id).length,
            awayFouls: events.filter(e => e.type === MatchEventType.FOUL && e.teamId === awayTeam.id).length,
            homeYellow: events.filter(e => e.type === MatchEventType.CARD_YELLOW && e.teamId === homeTeam.id).length,
            awayYellow: events.filter(e => e.type === MatchEventType.CARD_YELLOW && e.teamId === awayTeam.id).length,
            homeRed: events.filter(e => e.type === MatchEventType.CARD_RED && e.teamId === homeTeam.id).length,
            awayRed: events.filter(e => e.type === MatchEventType.CARD_RED && e.teamId === awayTeam.id).length,
            homeCorners: events.filter(e => e.type === MatchEventType.CORNER && e.teamId === homeTeam.id).length,
            awayCorners: events.filter(e => e.type === MatchEventType.CORNER && e.teamId === awayTeam.id).length,
        };
    }, [match.events, homeTeam.id, awayTeam.id]);

    const latestEvent = keyEvents[0] || null;
    const compactLatestEvent = getCompactEventLabel(match, latestEvent);
    const homeSquadAverages = getSquadAverages(homePlayersRef.current);
    const awaySquadAverages = getSquadAverages(awayPlayersRef.current);
    const homeDetailedOvr = getDetailedUnitAverages(homePlayersRef.current);
    const awayDetailedOvr = getDetailedUnitAverages(awayPlayersRef.current);

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-black to-slate-950 flex flex-col overflow-hidden">


            {setPieceCue && (
                <div className="pointer-events-none fixed inset-0 z-[108] flex items-start justify-center pt-16 md:pt-20">
                    <div className={`px-5 py-2 rounded-full bg-gradient-to-r ${setPieceCue.accent} text-white text-sm md:text-lg font-black tracking-[0.25em] shadow-[0_0_24px_rgba(15,23,42,0.45)] border border-white/20 animate-pulse`}>
                        {setPieceCue.label}
                    </div>
                </div>
            )}

            <div className={`bg-slate-900/70 backdrop-blur-xl border-b border-white/10 items-center justify-between px-2 md:px-6 py-1.5 md:py-2 gap-2 shrink-0 z-20 shadow-2xl ${isSmallLandscape ? 'hidden' : 'flex'}`}>
                {(() => {
                    const homeGoals = (match.events || []).filter(e => e.type === MatchEventType.GOAL && e.teamId === homeTeam.id);
                    const awayGoals = (match.events || []).filter(e => e.type === MatchEventType.GOAL && e.teamId === awayTeam.id);
                    return (
                        <>
                            <div className="flex items-center gap-2 md:gap-3 min-w-0 w-[32%]">
                                <TeamLogo team={homeTeam} className="w-7 h-7 md:w-10 md:h-10 rounded-lg border border-slate-600/50 bg-slate-800/50 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs md:text-base font-black text-white uppercase truncate">{getCompactTeamName(homeTeam)}</div>
                                    {isLandscape && <div className="mt-0.5">{renderOVR(homePlayersRef.current, 'left')}</div>}
                                    {homeGoals.length > 0 && (
                                        <div className="text-[8px] text-emerald-300 truncate mt-0.5">
                                            {homeGoals.map((g, i) => {
                                                const name = g.description?.match(/\(([^)]+)\)/)?.[1] ?? '';
                                                return <span key={i} className="mr-1">⚽ {name} {g.minute}'</span>;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center min-w-0 flex-1">
                                <div className="flex items-center gap-2 md:gap-6 rounded-xl border border-white/10 bg-black/30 px-3 md:px-6 py-1 md:py-2 shadow-xl">
                                    <span className={`text-2xl md:text-5xl font-mono font-black ${goalBanner?.side === 'HOME' ? 'text-emerald-300 scale-110' : 'text-white'} transition-all`}>{match.homeScore}</span>
                                    <div className="flex flex-col items-center leading-none">
                                        <span className="text-[8px] text-red-500 font-black tracking-wide">LIVE</span>
                                        <span className="text-slate-500 text-base font-black">:</span>
                                    </div>
                                    <span className={`text-2xl md:text-5xl font-mono font-black ${goalBanner?.side === 'AWAY' ? 'text-blue-300 scale-110' : 'text-white'} transition-all`}>{match.awayScore}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 font-black">{match.currentMinute}'</span>
                                    <span>{match.stats?.homePossession ?? 50}%</span>
                                    <span className="text-slate-600">pos</span>
                                    <span>{match.stats?.homeShots ?? 0}-{match.stats?.awayShots ?? 0}</span>
                                    <span className="text-slate-600">şut</span>
                                    <span>{match.stats?.awayPossession ?? 50}%</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 md:gap-3 min-w-0 w-[32%]">
                                <div className="min-w-0 flex-1 text-right">
                                    <div className="text-xs md:text-base font-black text-white uppercase truncate">{getCompactTeamName(awayTeam)}</div>
                                    {isLandscape && <div className="mt-0.5">{renderOVR(awayPlayersRef.current, 'right')}</div>}
                                    {awayGoals.length > 0 && (
                                        <div className="text-[8px] text-blue-300 truncate mt-0.5 text-right">
                                            {awayGoals.map((g, i) => {
                                                const name = g.description?.match(/\(([^)]+)\)/)?.[1] ?? '';
                                                return <span key={i} className="ml-1">⚽ {name} {g.minute}'</span>;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <TeamLogo team={awayTeam} className="w-7 h-7 md:w-10 md:h-10 rounded-lg border border-slate-600/50 bg-slate-800/50 shrink-0" />
                            </div>
                        </>
                    );
                })()}
            </div>

            {isSmallLandscape && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-8 pointer-events-none">
                    <div className="flex items-center gap-1 text-[8px] font-mono bg-slate-900/70 backdrop-blur px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="text-sky-400">D:{homeDetailedOvr.defs.avg}<span className="text-sky-600">({homeDetailedOvr.defs.liveAvg})</span></span>
                        <span className="text-emerald-400">M:{homeDetailedOvr.mids.avg}<span className="text-emerald-600">({homeDetailedOvr.mids.liveAvg})</span></span>
                        <span className="text-orange-400">F:{homeDetailedOvr.fwds.avg}<span className="text-orange-600">({homeDetailedOvr.fwds.liveAvg})</span></span>
                        <span className="text-white font-bold">⌀{homeDetailedOvr.all.avg}<span className="text-slate-400">({homeDetailedOvr.all.liveAvg})</span></span>
                    </div>
                    <span className="text-[8px] text-slate-600 font-mono">vs</span>
                    <div className="flex items-center gap-1 text-[8px] font-mono bg-slate-900/70 backdrop-blur px-1.5 py-0.5 rounded-full border border-blue-500/30">
                        <span className="text-sky-400">D:{awayDetailedOvr.defs.avg}<span className="text-sky-600">({awayDetailedOvr.defs.liveAvg})</span></span>
                        <span className="text-emerald-400">M:{awayDetailedOvr.mids.avg}<span className="text-emerald-600">({awayDetailedOvr.mids.liveAvg})</span></span>
                        <span className="text-orange-400">F:{awayDetailedOvr.fwds.avg}<span className="text-orange-600">({awayDetailedOvr.fwds.liveAvg})</span></span>
                        <span className="text-white font-bold">⌀{awayDetailedOvr.all.avg}<span className="text-slate-400">({awayDetailedOvr.all.liveAvg})</span></span>
                    </div>
                </div>
            )}

            {/* GOAL BANNER — under header, above tabs */}
            {goalBanner && !isSmallLandscape && (() => {
                const name = goalBanner.text?.match(/\(([^)]+)\)/)?.[1] ?? goalBanner.text;
                return (
                    <div className={`shrink-0 z-20 flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-black tracking-widest uppercase ${goalBanner.side === 'HOME' ? 'bg-emerald-900/90 text-emerald-200 border-b border-emerald-500/40' : 'bg-blue-900/90 text-blue-200 border-b border-blue-500/40'}`}>
                        <span>⚽</span>
                        <span>{name}</span>
                        <span className="text-[10px] opacity-60 font-normal lowercase">golü attı</span>
                    </div>
                );
            })()}

            <div className={`lg:hidden bg-slate-900 border-b border-slate-800 h-10 shrink-0 ${isSmallLandscape ? 'hidden' : 'flex'}`}>
                <button onClick={() => setActiveTab('PITCH')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'PITCH' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><MonitorPlay size={14} /> Pitch</button>
                <button onClick={() => setActiveTab('FEED')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'FEED' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><List size={14} /> Feed</button>
                <button onClick={() => setActiveTab('STATS')} className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${activeTab === 'STATS' ? 'text-emerald-400 bg-slate-800' : 'text-slate-500'}`}><BarChart2 size={14} /> Stats</button>
            </div>

            <div className="flex-1 flex overflow-hidden bg-black relative">
                <div className={`w-full lg:w-72 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex-col z-10 shrink-0 shadow-2xl ${isSmallLandscape ? 'hidden' : (activeTab === 'FEED' ? 'flex' : 'hidden lg:flex')}`}>
                    <div className="p-4 border-b border-white/10 font-black text-slate-300 uppercase text-xs tracking-widest hidden lg:flex items-center gap-2">
                        <List size={14} className="text-emerald-500" /> Match Feed
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {[...match.events].reverse().map((event, index) => (
                            <div key={`${event.minute}-${event.type}-${index}`} className={`rounded-xl border-l-4 p-3 text-sm shadow-sm ${
                                event.type === MatchEventType.GOAL ? 'bg-emerald-900/25 border-emerald-400' :
                                event.type === MatchEventType.CARD_RED ? 'bg-red-900/25 border-red-500' :
                                event.type === MatchEventType.CARD_YELLOW ? 'bg-yellow-900/20 border-yellow-500' :
                                event.type === MatchEventType.PENALTY ? 'bg-purple-900/25 border-purple-500' :
                                'bg-slate-800/40 border-slate-600'
                            }`}>
                                <span className={`mr-2 font-black ${event.type === MatchEventType.GOAL ? 'text-emerald-400' : 'text-slate-400'}`}>{event.type === MatchEventType.GOAL && <span className="mr-1">⚽</span>}{event.minute}'</span>
                                <span className={event.type === MatchEventType.GOAL ? 'text-white font-bold' : 'text-slate-300'}>{event.description}</span>
                            </div>
                        ))}
                        {match.events.length === 0 && <div className="text-slate-600 text-center text-xs italic mt-10">Match Starting...</div>}
                    </div>
                </div>

                <div className={`flex-1 bg-black ${isSmallLandscape ? 'relative flex items-center justify-center p-0' : (!isLandscape ? 'flex flex-col items-stretch' : 'relative flex items-center justify-center p-2 md:p-4')} ${isSmallLandscape ? 'flex' : (activeTab === 'PITCH' ? 'flex' : 'hidden lg:flex')}`}>

                    {/* LANDSCAPE: absolute status badge */}
                    {isLandscape && !isSmallLandscape && (
                        <div className="absolute top-3 md:top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                            <div className="bg-black/70 backdrop-blur-md text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-slate-600 shadow-2xl flex items-center gap-2 md:gap-3">
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                <span className="font-bold uppercase tracking-wide text-[10px] md:text-sm whitespace-nowrap">{statusText}</span>
                            </div>
                            {compactLatestEvent && (
                                <div className="mt-2 flex justify-center lg:hidden">
                                    <div className={`max-w-[82vw] rounded-full border px-3 py-1.5 text-[10px] font-bold leading-tight shadow-xl ${getEventAccentClass(latestEvent!.type)}`}>
                                        <span className="block truncate">{compactLatestEvent}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* LANDSCAPE: absolute controls */}
                    {isLandscape && !isSmallLandscape && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center gap-1 px-2 py-1.5">
                            <div className="flex items-center gap-1">
                                <button onClick={() => setSpeed(speed === 0 ? 1 : 0)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${speed === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    {speed === 0 ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
                                </button>
                                {([0.5, 1, 2, 4] as const).map(s => (
                                    <button key={s} onClick={() => setSpeed(s)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all active:scale-95 ${speed === s ? (s === 4 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-800 text-slate-400'}`}>
                                        {s === 0.5 ? '.5' : `${s}x`}
                                    </button>
                                ))}
                                <div className="w-px h-5 bg-white/10 mx-0.5" />
                                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                                </button>
                                <button onClick={() => setUseDefaultColors(!useDefaultColors)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${useDefaultColors ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    <Palette size={13} />
                                </button>
                                <button onClick={() => setShowNames(!showNames)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 text-[9px] font-black ${showNames ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    ID
                                </button>
                                <button onClick={() => setCameraTracking(!cameraTracking)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${cameraTracking ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    <Camera size={13} />
                                </button>
                                <button onClick={() => setIsGoalReplayEnabled(!isGoalReplayEnabled)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${isGoalReplayEnabled ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    <MonitorPlay size={13} />
                                </button>
                                <button onClick={() => { setSpeed(0); setShowTacticsModal(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600 text-white transition-all active:scale-95">
                                    <Settings size={13} />
                                </button>
                                <button onClick={() => { setSpeed(0); setShowExitModal(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700 text-slate-300 transition-all active:scale-95">
                                    <X size={13} />
                                </button>
                            </div>
                        </div>
                    )}

                    {isSmallLandscape && (
                        <div className="absolute inset-0 z-40 pointer-events-none">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                {goalBanner ? (
                                    /* GOAL BANNER — landscape mobile overlay */
                                    <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 text-xs font-black tracking-widest uppercase shadow-2xl animate-bounce ${goalBanner.side === 'HOME' ? 'bg-emerald-900/95 text-emerald-200 border-emerald-500/60' : 'bg-blue-900/95 text-blue-200 border-blue-500/60'}`}>
                                        <span>⚽</span>
                                        <span>GOL!</span>
                                        <span className="opacity-80">{goalBanner.text?.match(/\(([^)]+)\)/)?.[1] ?? goalBanner.text}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 scale-90">
                                            <span className="text-white font-mono font-black text-lg">{match.homeScore}</span>
                                            <span className="text-emerald-400 font-mono font-bold text-xs bg-black/40 px-1.5 rounded-lg">{match.currentMinute}'</span>
                                            <span className="text-white font-mono font-black text-lg">{match.awayScore}</span>
                                        </div>
                                        <div className="mt-1 bg-black/45 backdrop-blur px-2 py-1 rounded-full border border-slate-700/80 flex items-center gap-2 text-[8px] text-slate-200">
                                            <span>{match.stats?.homePossession ?? 50}%</span>
                                            <span className="text-slate-500">pos</span>
                                            <span>{match.stats?.homeShots ?? 0}-{match.stats?.awayShots ?? 0}</span>
                                            <span className="text-slate-500">shots</span>
                                            <span>{match.stats?.awayPossession ?? 50}%</span>
                                        </div>
                                        {compactLatestEvent && (
                                            <div className={`mt-1 max-w-[52vw] rounded-full border px-2 py-1 text-[8px] font-bold leading-tight shadow-xl ${getEventAccentClass(latestEvent!.type)}`}>
                                                <span className="block truncate">{compactLatestEvent}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="absolute top-2 left-2 flex gap-2 pointer-events-auto scale-90 origin-top-left">
                                <button onClick={() => setSpeed(speed === 0 ? 1 : 0)} className="w-8 h-8 rounded-full bg-black/60 border border-slate-700 flex items-center justify-center text-white">
                                    {speed === 0 ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                                </button>
                                <button onClick={() => setSpeed(speed === 4 ? 1 : speed * 2)} className={`w-8 h-8 rounded-full bg-black/60 border border-slate-700 flex items-center justify-center font-bold text-[10px] ${speed > 1 ? 'text-emerald-400' : 'text-white'}`}>
                                    {speed}x
                                </button>
                            </div>

                            <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto scale-90 origin-top-right">
                                <button onClick={() => setUseDefaultColors(!useDefaultColors)} className={`w-8 h-8 rounded-full border flex items-center justify-center text-white ${useDefaultColors ? 'bg-emerald-600/80 border-emerald-400/30' : 'bg-slate-700/80 border-slate-500/30'}`}>
                                    <Palette size={14} />
                                </button>
                                <button onClick={() => setShowNames(!showNames)} className={`w-8 h-8 rounded-full border flex items-center justify-center text-white text-[9px] font-black ${showNames ? 'bg-amber-600/80 border-amber-400/30' : 'bg-slate-700/80 border-slate-500/30'}`}>
                                    ID
                                </button>
                                <button onClick={() => setCameraTracking(!cameraTracking)} className={`w-8 h-8 rounded-full border flex items-center justify-center text-white ${cameraTracking ? 'bg-indigo-600/80 border-indigo-400/30' : 'bg-slate-700/80 border-slate-500/30'}`}>
                                    <Camera size={14} />
                                </button>
                                <button onClick={() => setIsGoalReplayEnabled(!isGoalReplayEnabled)} className={`w-8 h-8 rounded-full border flex items-center justify-center text-white ${isGoalReplayEnabled ? 'bg-fuchsia-600/80 border-fuchsia-400/30' : 'bg-slate-700/80 border-slate-500/30'}`}>
                                    <MonitorPlay size={14} />
                                </button>
                                <button onClick={() => { setSpeed(0); setShowTacticsModal(true); }} className="w-8 h-8 rounded-full bg-purple-600/80 border border-purple-400/30 flex items-center justify-center text-white">
                                    <Settings size={14} />
                                </button>
                                <button onClick={() => { setSpeed(0); setShowExitModal(true); }} className="w-8 h-8 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center text-white">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 flex flex-col items-center justify-center gap-0.5 bg-gradient-to-r from-slate-900/90 to-transparent z-20 py-2">
                                <TeamLogo team={homeTeam} className="w-9 h-9 rounded-lg border border-slate-600 bg-slate-800/80" />
                                <div className="text-white font-black text-lg leading-tight">{match.homeScore}</div>
                                <div className="text-[6px] text-emerald-200 text-center px-1 leading-tight">{homeAttackPlanLabel}</div>
                                <div className="text-[7px] text-emerald-400 font-bold">{match.stats?.homePossession ?? 50}%</div>
                                <div className="text-[7px] text-slate-500">xG {(match.stats?.homeXG ?? 0).toFixed(1)}</div>
                                <div className="text-[6px] text-amber-200 text-center px-1 leading-tight">{homeDefensePlanLabel}</div>
                            </div>

                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-14 flex flex-col items-center justify-center gap-0.5 bg-gradient-to-l from-slate-900/90 to-transparent z-20 py-2">
                                <TeamLogo team={awayTeam} className="w-9 h-9 rounded-lg border border-slate-600 bg-slate-800/80" />
                                <div className="text-white font-black text-lg leading-tight">{match.awayScore}</div>
                                <div className="text-[6px] text-blue-200 text-center px-1 leading-tight">{awayAttackPlanLabel}</div>
                                <div className="text-[7px] text-emerald-400 font-bold">{match.stats?.awayPossession ?? 50}%</div>
                                <div className="text-[7px] text-slate-500">xG {(match.stats?.awayXG ?? 0).toFixed(1)}</div>
                                <div className="text-[6px] text-amber-200 text-center px-1 leading-tight">{awayDefensePlanLabel}</div>
                            </div>

                            {/* Bottom compact stats strip */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-slate-700/60 text-[8px] text-slate-300 whitespace-nowrap">
                                {/* Fouls */}
                                <span className="text-orange-300 font-bold">{eventStats.homeFouls}</span>
                                <span className="text-slate-500 text-[7px]">faul</span>
                                <span className="text-orange-300 font-bold">{eventStats.awayFouls}</span>
                                {/* Corners */}
                                {(eventStats.homeCorners > 0 || eventStats.awayCorners > 0) && (
                                    <>
                                        <span className="text-slate-600 mx-1">|</span>
                                        <span className="text-sky-300 font-bold">{eventStats.homeCorners}</span>
                                        <span className="text-slate-500 text-[7px]">köşe</span>
                                        <span className="text-sky-300 font-bold">{eventStats.awayCorners}</span>
                                    </>
                                )}
                                {/* Cards */}
                                {(eventStats.homeYellow > 0 || eventStats.awayYellow > 0 || eventStats.homeRed > 0 || eventStats.awayRed > 0) && (
                                    <>
                                        <span className="text-slate-600 mx-1">|</span>
                                        <span className="text-yellow-400 font-bold">{eventStats.homeYellow + eventStats.awayYellow}🟨</span>
                                        {(eventStats.homeRed + eventStats.awayRed) > 0 && <span className="text-red-400 font-bold">{eventStats.homeRed + eventStats.awayRed}🟥</span>}
                                    </>
                                )}
                                {/* Attendance */}
                                {match.attendance > 0 && (
                                    <>
                                        <span className="text-slate-600 mx-1">|</span>
                                        <span className="text-slate-400">👥 {(match.attendance / 1000).toFixed(0)}K</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PORTRAIT: canvas top + info below | LANDSCAPE: standard canvas wrapper */}
                    {!isLandscape && !isSmallLandscape ? (
                        <>
                            {/* Canvas at top, full width */}
                            <div className="w-full shrink-0 relative">
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_W}
                                    height={CANVAS_H}
                                    className="w-full object-contain border-b-2 border-slate-800 bg-slate-900"
                                    style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
                                />
                                {isReplaying && (
                                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-black/70 text-yellow-400 font-black text-xs px-3 py-1 rounded-full border border-yellow-500/50 tracking-widest animate-pulse">
                                                ▶ TEKRAR
                                            </div>
                                            <button
                                                className="pointer-events-auto bg-black/70 text-white text-xs px-3 py-1 rounded-full border border-white/20 active:scale-95"
                                                onClick={() => { isReplayingRef.current = false; setIsReplaying(false); if (replayTimerRef.current) { window.clearInterval(replayTimerRef.current); replayTimerRef.current = null; } }}
                                            >
                                                Atla ✕
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Info area in the black space below */}
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-2 overflow-hidden">
                                {/* Status pill */}
                                <div className="bg-black/80 text-white px-4 py-1.5 rounded-full border border-slate-600 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                    <span className="font-bold uppercase tracking-wide text-[10px] whitespace-nowrap">{statusText}</span>
                                </div>
                                {/* Stats row */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="font-bold text-white">{match.stats?.homePossession ?? 50}%</span>
                                    <span>pos</span>
                                    <span className="font-bold text-white">{match.stats?.homeShots ?? 0}-{match.stats?.awayShots ?? 0}</span>
                                    <span>şut</span>
                                    <span className="font-bold text-white">{match.stats?.awayPossession ?? 50}%</span>
                                    {(eventStats.homeYellow + eventStats.awayYellow + eventStats.homeRed + eventStats.awayRed) > 0 && (
                                        <>
                                            <span className="text-slate-600">|</span>
                                            <span className="text-yellow-400">{eventStats.homeYellow + eventStats.awayYellow}🟨</span>
                                            {(eventStats.homeRed + eventStats.awayRed) > 0 && <span className="text-red-400">{eventStats.homeRed + eventStats.awayRed}🟥</span>}
                                        </>
                                    )}
                                </div>
                                {/* OVR breakdown row */}
                                <div className="flex items-center gap-2 text-[9px] font-mono">
                                    <div className="flex items-center gap-1 bg-slate-900/70 px-2 py-1 rounded-full border border-emerald-500/20">
                                        <span className="text-sky-400">D:{homeDetailedOvr.defs.avg}<span className="text-sky-700">({homeDetailedOvr.defs.liveAvg})</span></span>
                                        <span className="text-emerald-400">M:{homeDetailedOvr.mids.avg}<span className="text-emerald-700">({homeDetailedOvr.mids.liveAvg})</span></span>
                                        <span className="text-orange-400">F:{homeDetailedOvr.fwds.avg}<span className="text-orange-700">({homeDetailedOvr.fwds.liveAvg})</span></span>
                                        <span className="text-white font-bold">⌀{homeDetailedOvr.all.avg}</span>
                                    </div>
                                    <span className="text-slate-600">vs</span>
                                    <div className="flex items-center gap-1 bg-slate-900/70 px-2 py-1 rounded-full border border-blue-500/20">
                                        <span className="text-sky-400">D:{awayDetailedOvr.defs.avg}<span className="text-sky-700">({awayDetailedOvr.defs.liveAvg})</span></span>
                                        <span className="text-emerald-400">M:{awayDetailedOvr.mids.avg}<span className="text-emerald-700">({awayDetailedOvr.mids.liveAvg})</span></span>
                                        <span className="text-orange-400">F:{awayDetailedOvr.fwds.avg}<span className="text-orange-700">({awayDetailedOvr.fwds.liveAvg})</span></span>
                                        <span className="text-white font-bold">⌀{awayDetailedOvr.all.avg}</span>
                                    </div>
                                </div>
                                {/* Latest event */}
                                {compactLatestEvent && (
                                    <div className={`max-w-[90vw] rounded-full border px-3 py-1 text-[10px] font-bold leading-tight shadow-xl ${getEventAccentClass(latestEvent!.type)}`}>
                                        <span className="block truncate">{compactLatestEvent}</span>
                                    </div>
                                )}
                                {/* Controls */}
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                    <button onClick={() => setSpeed(speed === 0 ? 1 : 0)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${speed === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                        {speed === 0 ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
                                    </button>
                                    {([0.5, 1, 2, 4] as const).map(s => (
                                        <button key={s} onClick={() => setSpeed(s)}
                                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all active:scale-95 ${speed === s ? (s === 4 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-800 text-slate-400'}`}>
                                            {s === 0.5 ? '.5' : `${s}x`}
                                        </button>
                                    ))}
                                    <div className="w-px h-5 bg-white/10" />
                                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                                    </button>
                                    <button onClick={() => setUseDefaultColors(!useDefaultColors)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${useDefaultColors ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        <Palette size={13} />
                                    </button>
                                    <button onClick={() => setShowNames(!showNames)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 text-[9px] font-black ${showNames ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        ID
                                    </button>
                                    <button onClick={() => setCameraTracking(!cameraTracking)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${cameraTracking ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        <Camera size={13} />
                                    </button>
                                    <button onClick={() => setIsGoalReplayEnabled(!isGoalReplayEnabled)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${isGoalReplayEnabled ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        <MonitorPlay size={13} />
                                    </button>
                                    <button onClick={() => { setSpeed(0); setShowTacticsModal(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600 text-white transition-all active:scale-95">
                                        <Settings size={13} />
                                    </button>
                                    <button onClick={() => { setSpeed(0); setShowExitModal(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700 text-slate-300 transition-all active:scale-95">
                                        <X size={13} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_W}
                                height={CANVAS_H}
                                className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg border-2 md:border-4 border-slate-800 bg-slate-900 ${isSmallLandscape ? 'rounded-none border-0' : ''}`}
                                style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, touchAction: 'none' }}
                            />
                            {isReplaying && (
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-black/70 text-yellow-400 font-black text-xs px-3 py-1 rounded-full border border-yellow-500/50 tracking-widest animate-pulse">
                                            ▶ TEKRAR
                                        </div>
                                        <button
                                            className="pointer-events-auto bg-black/70 text-white text-xs px-3 py-1 rounded-full border border-white/20 active:scale-95"
                                            onClick={() => { isReplayingRef.current = false; setIsReplaying(false); if (replayTimerRef.current) { window.clearInterval(replayTimerRef.current); replayTimerRef.current = null; } }}
                                        >
                                            Atla ✕
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={`w-full lg:w-72 bg-slate-900 border-l border-slate-800 flex-col z-10 shrink-0 ${isSmallLandscape ? 'hidden' : (activeTab === 'STATS' ? 'flex' : 'hidden lg:flex')}`}>
                    <div className="p-3 bg-slate-950 border-b border-slate-800 font-bold text-slate-400 uppercase text-xs tracking-wider hidden lg:flex items-center gap-2">
                        <BarChart2 size={14} /> {t.liveStats || 'Live Stats'}
                    </div>
                    <div className="p-4 md:p-6 space-y-6">
                        <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase font-bold">{t.possession || 'Possession'}</div>
                            <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
                                <div className="bg-emerald-600" style={{ width: `${match.stats?.homePossession ?? 50}%` }}></div>
                                <div className="bg-blue-600" style={{ width: `${match.stats?.awayPossession ?? 50}%` }}></div>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-white mt-1">
                                <span>{match.stats?.homePossession ?? 50}%</span>
                                <span>{match.stats?.awayPossession ?? 50}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="text-xl font-bold text-white">{match.stats?.homeShots ?? 0}</div>
                            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center">{t.shots || 'Shots'}</div>
                            <div className="text-xl font-bold text-white">{match.stats?.awayShots ?? 0}</div>

                            <div className="text-lg font-bold text-emerald-400">{match.stats?.homeOnTarget ?? 0}</div>
                            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center">{t.onTarget || 'Target'}</div>
                            <div className="text-lg font-bold text-blue-400">{match.stats?.awayOnTarget ?? 0}</div>

                            <div className="text-base font-bold text-slate-300">{(match.stats?.homeXG ?? 0).toFixed(2)}</div>
                            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center">xG</div>
                            <div className="text-base font-bold text-slate-300">{(match.stats?.awayXG ?? 0).toFixed(2)}</div>

                            {eventStats.homeCorners > 0 || eventStats.awayCorners > 0 ? (
                                <>
                                    <div className="text-base font-bold text-slate-300">{eventStats.homeCorners}</div>
                                    <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center">Korneler</div>
                                    <div className="text-base font-bold text-slate-300">{eventStats.awayCorners}</div>
                                </>
                            ) : null}

                            <div className="text-base font-bold text-orange-300">{eventStats.homeFouls}</div>
                            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center">Fauller</div>
                            <div className="text-base font-bold text-orange-300">{eventStats.awayFouls}</div>

                            {(eventStats.homeYellow > 0 || eventStats.awayYellow > 0 || eventStats.homeRed > 0 || eventStats.awayRed > 0) && (
                                <>
                                    <div className="text-base font-bold text-yellow-300 flex items-center justify-end gap-0.5">
                                        {eventStats.homeYellow > 0 && <span>🟨{eventStats.homeYellow}</span>}
                                        {eventStats.homeRed > 0 && <span>🟥{eventStats.homeRed}</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center">Kartlar</div>
                                    <div className="text-base font-bold text-yellow-300 flex items-center justify-start gap-0.5">
                                        {eventStats.awayYellow > 0 && <span>🟨{eventStats.awayYellow}</span>}
                                        {eventStats.awayRed > 0 && <span>🟥{eventStats.awayRed}</span>}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-black">Home Plan</div>
                                <div className="text-sm font-bold text-white mt-1">{homeAttackPlanLabel}</div>
                                <div className="text-xs text-amber-200 mt-1">{homeDefensePlanLabel}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-black">Away Plan</div>
                                <div className="text-sm font-bold text-white mt-1">{awayAttackPlanLabel}</div>
                                <div className="text-xs text-amber-200 mt-1">{awayDefensePlanLabel}</div>
                            </div>
                            {latestEvent && (
                                <div className={`rounded-xl border px-3 py-2 ${getEventAccentClass(latestEvent.type)}`}>
                                    <div className="text-[10px] font-black">{latestEvent.minute}'</div>
                                    <div className="text-sm leading-tight mt-1">{latestEvent.description}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}

            {showTacticsModal && (() => {
                const managedTeam = managedSide === 'HOME' ? homeTeam : awayTeam;
                const subsMade = getSubsMade(managedTeam.id);
                const maxSubs = getMaxSubs();
                const subsLeft = maxSubs - subsMade;
                return (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 md:p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${subsLeft <= 0 ? 'bg-red-900/60 text-red-300 border border-red-700' : subsLeft <= 2 ? 'bg-amber-900/60 text-amber-300 border border-amber-700' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                            <span>🔄</span>
                            <span>Değişiklik: {subsMade}/{maxSubs}</span>
                            {subsLeft <= 0 && <span className="text-xs font-normal">(doldu)</span>}
                            {subsLeft > 0 && <span className="text-xs font-normal opacity-60">({subsLeft} kaldı)</span>}
                        </div>
                        <button
                            onClick={() => { setShowTacticsModal(false); setSpeed(1); }}
                            className="p-2 bg-zinc-800 hover:bg-red-600 rounded-lg text-white transition-colors"
                            title="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                        <div className="w-full h-full max-w-5xl overflow-y-auto">
                            <TeamManagement
                                team={managedSide === 'HOME' ? homeTeam : awayTeam}
                                players={(managedSide === 'HOME' ? homePlayers : awayPlayers).map(p => {
                                    if (substitutedOutIds.has(p.id)) {
                                        return p;
                                    }
                                    const liveStamina = getLivePlayerStamina(p.id);
                                    if (liveStamina !== undefined) {
                                        return { ...p, condition: Math.floor(liveStamina) };
                                    }
                                    return p;
                                })}
                                opponent={managedSide === 'HOME' ? awayTeam : homeTeam}
                                onUpdateTactic={(tactic) => onUpdateTactic(tactic, undefined, managedSide === 'HOME' ? homeTeam.id : awayTeam.id)}
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
                        </div>
                    </div>
                </div>
                );
            })()}

            {showHalfTime && (() => {
                const homeGoals = match.events.filter(e => e.type === MatchEventType.GOAL && e.teamId === homeTeam.id);
                const awayGoals = match.events.filter(e => e.type === MatchEventType.GOAL && e.teamId === awayTeam.id);
                const statRow = (homeVal: string | number, label: string, awayVal: string | number, highlight?: boolean) => (
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-8 text-right font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{homeVal}</span>
                        <span className="flex-1 text-center text-slate-500 text-[10px] uppercase tracking-wide">{label}</span>
                        <span className={`w-8 font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{awayVal}</span>
                    </div>
                );
                return (
                    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-2">
                        <div className="bg-slate-900/95 border border-amber-500/20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

                            {/* Header */}
                            <div className="flex items-center justify-center gap-3 py-2 px-4 border-b border-slate-800">
                                <span className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">Devre Arası</span>
                                <span className="text-slate-600 font-mono text-sm">45'</span>
                            </div>

                            {/* Main content — landscape: side by side, portrait: stacked */}
                            <div className="flex flex-col landscape:flex-row landscape:divide-x landscape:divide-slate-800">

                                {/* Score + Scorers */}
                                <div className="flex flex-col items-center justify-center px-4 py-3 landscape:py-4 landscape:flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="text-right flex-1 min-w-0">
                                            <div className="text-2xl landscape:text-3xl font-black text-white">{match.homeScore}</div>
                                            <div className="text-[9px] text-slate-400 uppercase truncate">{homeTeam.shortName || homeTeam.name}</div>
                                        </div>
                                        <div className="text-slate-600 text-xl font-black shrink-0">-</div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="text-2xl landscape:text-3xl font-black text-white">{match.awayScore}</div>
                                            <div className="text-[9px] text-slate-400 uppercase truncate">{awayTeam.shortName || awayTeam.name}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="px-4 py-3 landscape:flex-1 space-y-1.5 border-t landscape:border-t-0 border-slate-800">
                                    <div className="text-[9px] text-slate-600 uppercase font-bold text-center mb-1">İlk Yarı</div>
                                    {statRow(`${match.stats?.homePossession ?? 50}%`, 'Top', `${match.stats?.awayPossession ?? 50}%`)}
                                    {statRow(match.stats?.homeShots ?? 0, 'Şut', match.stats?.awayShots ?? 0)}
                                    {statRow(match.stats?.homeOnTarget ?? 0, 'İsabetli', match.stats?.awayOnTarget ?? 0, true)}
                                    {statRow(`${(match.stats?.homeXG ?? 0).toFixed(1)}`, 'xG', `${(match.stats?.awayXG ?? 0).toFixed(1)}`)}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2 p-3 border-t border-slate-800">
                                <button
                                    onClick={() => { setShowHalfTime(false); setShowTacticsModal(true); }}
                                    className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs transition-colors"
                                >
                                    ⚙️ Taktik
                                </button>
                                <button
                                    onClick={() => {
                                        setShowHalfTime(false);
                                        onSync(match.id, { minuteIncrement: true, event: null, additionalEvents: [], trace: [], liveData: match.liveData, stats: match.stats });
                                        setSpeed(1);
                                    }}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
                                >
                                    ▶ 2. Yarı
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showExitModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 max-w-sm w-full shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-2">{t.quitMatch || 'Exit Match?'}</h3>
                        <p className="text-zinc-400 text-sm mb-6">
                            {t.matchContinues?.replace('{minute}', match.currentMinute.toString()) || `The match will be auto-simulated for the remaining time.`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowExitModal(false); setSpeed(1); }}
                                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                {t.cancel || 'Cancel'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowExitModal(false);
                                    soundManager.stopAll();
                                    onInstantFinish(match.id);
                                    setTimeout(() => onFinish(match.id), 100);
                                }}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
                            >
                                {t.simulateAndQuit || 'Simulate & Exit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL TIME MODAL — shown when match.isPlayed becomes true */}
            {match.isPlayed && (() => {
                const homeGoals = (match.events || []).filter(e => e.type === MatchEventType.GOAL && e.teamId === homeTeam.id);
                const awayGoals = (match.events || []).filter(e => e.type === MatchEventType.GOAL && e.teamId === awayTeam.id);
                const isHomeWin = match.homeScore > match.awayScore;
                const isAwayWin = match.awayScore > match.homeScore;
                return (
                    <div className="absolute inset-0 z-[100] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-2">
                        <div className="bg-slate-900/95 border border-emerald-500/20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

                            {/* Header */}
                            <div className="flex items-center justify-center gap-3 py-2 px-4 border-b border-slate-800">
                                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">Full Time</span>
                                <span className="text-slate-600 font-mono text-sm">90'</span>
                            </div>

                            {/* Main content */}
                            <div className="flex flex-col landscape:flex-row landscape:divide-x landscape:divide-slate-800">

                                {/* Score + Scorers */}
                                <div className="flex items-center justify-center gap-4 px-4 py-4 landscape:flex-1">
                                    <div className="text-right flex-1 min-w-0">
                                        <div className={`text-3xl landscape:text-4xl font-black leading-none ${isHomeWin ? 'text-emerald-400' : 'text-white'}`}
                                            style={{ textShadow: isHomeWin ? `0 0 16px ${homeTeam.primaryColor}` : undefined }}>
                                            {match.homeScore}
                                        </div>
                                        <div className="text-[9px] text-slate-400 uppercase truncate">{homeTeam.shortName || homeTeam.name}</div>
                                    </div>
                                    <div className="text-slate-600 text-xl font-black shrink-0">-</div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className={`text-3xl landscape:text-4xl font-black leading-none ${isAwayWin ? 'text-blue-400' : 'text-white'}`}
                                            style={{ textShadow: isAwayWin ? `0 0 16px ${awayTeam.primaryColor}` : undefined }}>
                                            {match.awayScore}
                                        </div>
                                        <div className="text-[9px] text-slate-400 uppercase truncate">{awayTeam.shortName || awayTeam.name}</div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="px-4 py-3 landscape:flex-1 border-t landscape:border-t-0 border-slate-800 space-y-1.5">
                                    <div className="text-[9px] text-slate-600 uppercase font-bold text-center mb-1">İstatistikler</div>
                                    {[
                                        [`${match.stats?.homePossession ?? 50}%`, 'Top', `${match.stats?.awayPossession ?? 50}%`],
                                        [match.stats?.homeShots ?? 0, 'Şut', match.stats?.awayShots ?? 0],
                                        [match.stats?.homeOnTarget ?? 0, 'İsabetli', match.stats?.awayOnTarget ?? 0],
                                        [`${(match.stats?.homeXG ?? 0).toFixed(1)}`, 'xG', `${(match.stats?.awayXG ?? 0).toFixed(1)}`],
                                    ].map(([h, label, a], i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className="w-8 text-right font-bold text-white">{h}</span>
                                            <span className="flex-1 text-center text-slate-500 text-[10px] uppercase tracking-wide">{label}</span>
                                            <span className="w-8 font-bold text-white">{a}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Continue button */}
                            <div className="p-3 border-t border-slate-800">
                                <button
                                    onClick={() => onFinish(match.id)}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm transition-all uppercase tracking-widest"
                                >
                                    Devam →
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default DetailedMatchCenter;
