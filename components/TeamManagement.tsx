
import React, { useState, useRef, useEffect } from 'react';
import { Player, Team, Position, TacticType, Translation, TeamTactic, LineupStatus, AssistantAdvice } from '../types';
import { Shield, ArrowRightLeft, Gauge, Wand2, ArrowRight, AlertTriangle, ShieldAlert, MessageSquare, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { getFormationStructure, getRoleFromX, calculateEffectiveRating, getBaseFormationOffset } from '../services/MatchEngine';
import { autoPickLineup as smartAutoPick, analyzeClubHealth, analyzeMatchSituation } from '../services/engine';
import { TACTICAL_PRESETS, applyPreset, validateTactic, PresetKey } from '../services/tactics';
import { AssistantReport } from './AssistantReport';
import { PlayerInteractionModal } from './PlayerInteractionModal';
import { handlePlayerInteraction } from '../services/engine';

const getOverallColor = (ovr: number) => {
    if (ovr >= 85) return 'text-emerald-400';
    if (ovr >= 75) return 'text-blue-400';
    if (ovr >= 65) return 'text-yellow-400';
    return 'text-slate-400';
};

const normalizePos = (p: Player): Position => {
    const raw = p.position as string;
    if (raw === 'KL' || raw === 'GK') return Position.GK;
    if (['STP', 'SĞB', 'SLB', 'DEF', 'CB', 'LB', 'RB', 'SW', 'LWB', 'RWB'].includes(raw)) return Position.DEF;
    if (['MDO', 'MO', 'MOO', 'MID', 'CDM', 'CM', 'CAM', 'LM', 'RM'].includes(raw)) return Position.MID;
    return Position.FWD;
};

interface PlayerRowProps {
    player: Player;
    selectedPlayerId: string | null;
    onSelect: (player: Player) => void;
    onInteractStart: (player: Player) => void;
    onMove?: (playerId: string, direction: 'UP' | 'DOWN') => void;
    isFirst?: boolean;
    isLast?: boolean;
    assignedRole?: Position;
    key?: React.Key;
    t: Translation;
}


const getAttributeClass = (val: number) => {
    if (val >= 90) return 'attr-box attr-elite'; // 90-99
    if (val >= 80) return 'attr-box attr-high';  // 80-89
    if (val >= 70) return 'attr-box attr-med';   // 70-79
    return 'attr-box attr-low';                  // < 70
};

const PlayerRow = ({ player, selectedPlayerId, onSelect, onInteractStart, onMove, isFirst, isLast, assignedRole, t }: PlayerRowProps) => {
    // Safety check for player data
    if (!player || !player.attributes) return null;

    const isSelected = selectedPlayerId === player.id;
    // === OVR CONSISTENCY FIX ===
    // Always calculate effective rating with condition - even for bench/reserve players
    // This ensures consistent OVR display across all lists (no more "94 on bench, 90 in starting 11")
    const roleToUse = assignedRole || normalizePos(player);
    const effectiveRating = calculateEffectiveRating(player, roleToUse, player.condition);

    return (
        <div
            onClick={() => onSelect(player)}
            className={`grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_2fr_repeat(5,1fr)_auto] gap-2 items-center p-2 border-b border-white/5 text-sm cursor-pointer transition-colors ${isSelected ? 'bg-emerald-900/40' : 'hover:bg-white/5'}`}
        >
            {/* Pos & Name */}
            <div className="flex items-center gap-2">
                <span className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${player.position === 'GK' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50' :
                    player.position === 'DEF' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' :
                        player.position === 'MID' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/50' :
                            'bg-red-600/20 text-red-400 border border-red-600/50'
                    }`}>{player.position}</span>
                {player.jerseyNumber && (
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-600">
                        {player.jerseyNumber}
                    </span>
                )}
            </div>

            <div className="min-w-0">
                <div className="font-bold text-white truncate text-xs md:text-sm flex items-center gap-1">
                    {player.firstName} {player.lastName}
                    {/* 🏥 INJURY INDICATOR - HIGHLY VISIBLE */}
                    {player.weeksInjured > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-white text-[8px] font-bold rounded animate-pulse flex items-center gap-1">
                            🏥 {player.weeksInjured}h
                        </span>
                    )}
                    {/* 🟥 SUSPENSION INDICATOR */}
                    {player.matchSuspension > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded flex items-center gap-1">
                            🟥 {player.matchSuspension}m
                        </span>
                    )}
                    {/* ⚠️ CONTRACT EXPIRY WARNING */}
                    {player.contractYears <= 1 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-amber-600 text-white text-[8px] font-bold rounded flex items-center gap-1" title={`Kontrat: ${player.contractYears} yıl kaldı`}>
                            📝 {player.contractYears}y
                        </span>
                    )}
                </div>
                {assignedRole && assignedRole !== normalizePos(player) && (
                    <div className="text-[9px] text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={8} /> OOP: {assignedRole}
                    </div>
                )}
            </div>

            {/* Hidden on Mobile - Attributes (Different for GK vs Outfield) */}
            {(player.position as string) === 'GK' || (player.position as string) === 'KL' ? (
                <>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.goalkeeping)}>GK {player.attributes.goalkeeping}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.composure)}>REF {player.attributes.composure}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.positioning)}>POS {player.attributes.positioning}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.strength)}>STR {player.attributes.strength}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.passing)}>KCK {player.attributes.passing}</span></div>
                </>
            ) : (
                <>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.speed)}>{player.attributes.speed}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.finishing)}>{player.attributes.finishing}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.passing)}>{player.attributes.passing}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.dribbling)}>{player.attributes.dribbling}</span></div>
                    <div className="hidden md:flex items-center justify-center"><span className={getAttributeClass(player.attributes.tackling)}>{player.attributes.tackling}</span></div>
                </>
            )}

            {/* Status Bars (Mobile friendly) */}
            <div className="flex flex-col gap-1 w-16 md:w-24 group/status relative">
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500 w-3">{t.con}</span>
                    <div className="h-1.5 flex-1 bg-slate-800 rounded-sm overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${player.condition}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500 w-3">{t.mor}</span>
                    <div className="h-1.5 flex-1 bg-slate-800 rounded-sm overflow-hidden">
                        <div className={`h-full ${player.morale > 80 ? 'bg-emerald-400' : player.morale > 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${player.morale}%` }}></div>
                    </div>
                </div>
                {/* Morale Reason Tooltip */}
                <div className="absolute bottom-full left-0 mb-1 p-2 bg-slate-900 border border-slate-600 rounded shadow-xl opacity-0 group-hover/status:opacity-100 transition-opacity pointer-events-none z-50 w-56 text-[10px]">
                    <div className="font-bold text-white mb-1">Moral: {player.morale}%</div>
                    <div className="space-y-0.5 text-slate-400">
                        {player.playedThisWeek && <div className="text-emerald-400">✅ Bu hafta maçta oynadı (+2)</div>}
                        {!player.playedThisWeek && player.lineup === 'STARTING' && <div className="text-emerald-400">✓ {t.playingXIBonus || 'Playing in Starting XI (+2/week)'}</div>}
                        {!player.playedThisWeek && player.lineup === 'BENCH' && <div className="text-blue-400">🪑 {t.benchStable || 'On bench (stable - ready to play)'}</div>}
                        {player.lineup === 'RESERVE' && player.overall > 75 && <div className="text-red-400">⛔ {t.reserveStarPenalty || 'Reserve, star player (-3/week)'}</div>}
                        {player.lineup === 'RESERVE' && player.overall > 65 && player.overall <= 75 && <div className="text-yellow-400">⚠ {t.reserveMediumPenalty || 'Reserve (-1/week)'}</div>}
                        {player.lineup === 'RESERVE' && player.overall <= 65 && <div className="text-slate-500">📋 {t.reserveStable || 'Reserve (stable)'}</div>}
                        {player.weeksInjured > 0 && <div className="text-orange-400">🏥 Sakat ({player.weeksInjured} hafta)</div>}
                        {player.matchSuspension > 0 && <div className="text-red-400">🟥 Cezalı ({player.matchSuspension} maç)</div>}
                        {player.form > 7 && <div className="text-emerald-400">🔥 İyi form ({player.form}/10)</div>}
                        {player.form < 5 && <div className="text-red-400">📉 Kötü form ({player.form}/10)</div>}
                        {player.morale < 40 && <div className="text-amber-400 mt-1">💬 Motive etmeyi dene!</div>}
                    </div>

                    {/* Moral History - Son değişiklikler */}
                    {player.moraleHistory && player.moraleHistory.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <div className="text-[9px] text-slate-500 mb-1">{t.lastMoraleChanges || 'Last Morale Changes'}:</div>
                            {player.moraleHistory.slice(-3).reverse().map((h, i) => (
                                <div key={i} className={`text-[9px] ${h.change > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                    Hafta {h.week}: {h.change > 0 ? '+' : ''}{h.change} ({h.reason})
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions & Rating */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <button onClick={(e) => { e.stopPropagation(); onInteractStart(player); }} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                    <MessageSquare size={14} />
                </button>
                <div className={`font-black text-sm w-7 text-center rounded bg-slate-900 border border-white/10 ${effectiveRating >= 90 ? 'text-emerald-400' : effectiveRating >= 80 ? 'text-green-400' : 'text-slate-300'}`}>
                    {effectiveRating}
                </div>
                {onMove && (
                    <div className="flex flex-col gap-0.5">
                        {!isFirst && <button onClick={(e) => { e.stopPropagation(); onMove(player.id, 'UP'); }} className="text-slate-500 hover:text-emerald-400"><ChevronUp size={10} /></button>}
                        {!isLast && <button onClick={(e) => { e.stopPropagation(); onMove(player.id, 'DOWN'); }} className="text-slate-500 hover:text-emerald-400"><ChevronDown size={10} /></button>}
                    </div>
                )}
            </div>
        </div>
    );
}

interface TeamManagementProps {
    team: Team;
    players: Player[];
    onUpdateTactic: (tactic: TeamTactic) => void;
    onPlayerClick: (player: Player) => void;
    onUpdateLineup: (playerId: string, status: LineupStatus, lineupIndex?: number) => void;
    onSwapPlayers: (player1Id: string, player2Id: string) => void;
    onMovePlayer?: (playerId: string, direction: 'UP' | 'DOWN') => void;
    onAutoFix?: () => void;
    onPlayerMoraleChange?: (playerId: string, moraleChange: number, reason: string) => void;
    matchStatus?: { minute: number; score: { home: number; away: number }; isHome: boolean };
    t: Translation;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
    team, players, onUpdateTactic, onPlayerClick, onUpdateLineup, onSwapPlayers, onMovePlayer, onAutoFix, onPlayerMoraleChange, matchStatus, t
}) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [tacticTab, setTacticTab] = useState<'FORMATION' | 'IN_POSSESSION' | 'OUT_POSSESSION'>('FORMATION');
    const [showAssistant, setShowAssistant] = useState(false);
    const [advice, setAdvice] = useState<AssistantAdvice[]>([]);
    const [interactingPlayer, setInteractingPlayer] = useState<Player | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const pitchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let newAdvice: AssistantAdvice[] = [];

        // 1. Static Club Health
        const healthAdvice = analyzeClubHealth(team, players);
        newAdvice = [...newAdvice, ...healthAdvice];

        // 2. Tactic Validation
        const tacticWarnings = validateTactic(team.tactic);
        newAdvice = [...newAdvice, ...tacticWarnings];

        // 3. In-Match Situational Advice
        if (matchStatus) {
            const situationAdvice = analyzeMatchSituation(matchStatus, team.tactic);
            newAdvice = [...situationAdvice, ...newAdvice]; // Put critical situational advice first? Or keep mixed?
        }

        setAdvice(newAdvice);
    }, [team, players, matchStatus]);

    const starters = players.filter(p => p.lineup === 'STARTING').sort((a, b) => (a.lineupIndex || 0) - (b.lineupIndex || 0));
    const bench = players.filter(p => p.lineup === 'BENCH').sort((a, b) => (a.lineupIndex || 0) - (b.lineupIndex || 0));
    const reserves = players.filter(p => p.lineup === 'RESERVE').sort((a, b) => (a.lineupIndex || 0) - (b.lineupIndex || 0));

    const handleTacticChange = (key: keyof TeamTactic, value: any) => {
        onUpdateTactic({ ...team.tactic, [key]: value });
    };

    const handlePlayerSelect = (player: Player) => {
        if (selectedPlayerId === null) {
            setSelectedPlayerId(player.id);
        } else {
            if (selectedPlayerId === player.id) {
                setSelectedPlayerId(null);
                onPlayerClick(player);
            } else {
                onSwapPlayers(selectedPlayerId, player.id);
                setSelectedPlayerId(null);
            }
        }
    };

    const handleInteract = (type: 'PRAISE' | 'CRITICIZE' | 'MOTIVATE', intensity: 'LOW' | 'HIGH') => {
        if (!interactingPlayer) return;
        const result = handlePlayerInteraction(interactingPlayer, type, intensity);

        // === BUG FIX: Actually apply the morale change! ===
        if (onPlayerMoraleChange && result.moraleChange !== 0) {
            const reasonMap = {
                PRAISE: intensity === 'HIGH' ? 'Yoğun övgü' : 'Övgü',
                CRITICIZE: intensity === 'HIGH' ? 'Sert eleştiri' : 'Eleştiri',
                MOTIVATE: 'Motivasyon konuşması'
            };
            onPlayerMoraleChange(interactingPlayer.id, result.moraleChange, reasonMap[type]);
        }

        alert(`${result.message}\n(Morale change: ${result.moraleChange > 0 ? '+' : ''}${result.moraleChange})`);
        setInteractingPlayer(null);
    };

    const handleAutoPick = () => {
        if (onAutoFix) {
            onAutoFix();
        }
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, playerId: string) => {
        // TouchAction: none is set on the player dots via CSS class 'touch-none'
        // This allows the browser to know this element shouldn't trigger scroll
        setDraggingId(playerId);
        if (selectedPlayerId) setSelectedPlayerId(null);
    };

    const handlePitchMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!draggingId || !pitchRef.current) return;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            // Prevent scroll if we are actively dragging
            if (e.cancelable) e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = pitchRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.max(2, Math.min(98, x));
        const clampedY = Math.max(2, Math.min(98, y));
        const newPositions = { ...(team.tactic.customPositions || {}), [draggingId]: { x: clampedX, y: clampedY } };
        handleTacticChange('customPositions', newPositions);
    };

    const handlePitchMouseUp = () => { setDraggingId(null); };

    const struct = getFormationStructure(team.tactic.formation);
    const visuals: { p: Player, presetRole: Position, idx: number, total: number }[] = [];

    const pitchOrderedStarters = [...starters].sort((a, b) => {
        const posOrder = { [Position.GK]: 0, [Position.DEF]: 1, [Position.MID]: 2, [Position.FWD]: 3 };
        const orderA = posOrder[normalizePos(a)];
        const orderB = posOrder[normalizePos(b)];
        if (orderA !== orderB) return orderA - orderB;
        return b.overall - a.overall;
    });

    let playerCursor = 0;
    if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.GK, idx: 0, total: 1 });
    for (let i = 0; i < struct.DEF; i++) if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.DEF, idx: i, total: struct.DEF });
    for (let i = 0; i < struct.MID; i++) if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.MID, idx: i, total: struct.MID });
    for (let i = 0; i < struct.FWD; i++) if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.FWD, idx: i, total: struct.FWD });

    const assignedRoleMap: Record<string, Position> = {};
    const hasIssues = advice.some(a => a.type === 'CRITICAL' || a.type === 'WARNING');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-10" onMouseUp={handlePitchMouseUp} onTouchEnd={handlePitchMouseUp}>

            {showAssistant && <AssistantReport advice={advice} onAutoFix={handleAutoPick} onClose={() => setShowAssistant(false)} t={t} />}
            {interactingPlayer && <PlayerInteractionModal player={interactingPlayer} onClose={() => setInteractingPlayer(null)} onInteract={handleInteract} t={t} />}

            <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-800 rounded-lg p-3 shadow-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2"><Shield size={16} className="text-emerald-500" /> {t.tactics}</h2>
                        <div className="flex gap-1 items-center">
                            {/* Preset Selector */}
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const newTactic = applyPreset(team.tactic, e.target.value as PresetKey);
                                        onUpdateTactic(newTactic);
                                    }
                                }}
                                className="bg-slate-700 text-white text-[10px] font-bold px-1 py-1 rounded border border-slate-600 outline-none cursor-pointer hover:bg-slate-600 transition-colors w-20 truncate"
                                defaultValue=""
                            >
                                <option value="" disabled>Preset</option>
                                {Object.keys(TACTICAL_PRESETS).map(k => (
                                    <option key={k} value={k}>{TACTICAL_PRESETS[k as PresetKey].name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowAssistant(true)}
                                className={`relative bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-all ${hasIssues ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
                            >
                                <ShieldAlert size={10} /> {t.assistantManager}
                                {hasIssues && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                            </button>
                            <button
                                onClick={handleAutoPick}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-all"
                            >
                                <Wand2 size={10} /> {t.auto}
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-slate-900 rounded p-1 mb-2">
                        <button onClick={() => setTacticTab('FORMATION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${tacticTab === 'FORMATION' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>{t.base}</button>
                        <button onClick={() => setTacticTab('IN_POSSESSION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${tacticTab === 'IN_POSSESSION' ? 'bg-emerald-700 text-white' : 'text-slate-500'}`}>{t.attack}</button>
                        <button onClick={() => setTacticTab('OUT_POSSESSION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${tacticTab === 'OUT_POSSESSION' ? 'bg-red-900 text-white' : 'text-slate-500'}`}>{t.defense}</button>
                    </div>

                    <div className="space-y-2 min-h-[80px]">
                        {tacticTab === 'FORMATION' && (
                            <>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.formation}</label>
                                    <div className="grid grid-cols-3 gap-1 mt-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                        {Object.values(TacticType).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => handleTacticChange('formation', f)}
                                                className={`px-2 py-1.5 text-[10px] font-bold rounded border transition-all ${team.tactic.formation === f
                                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                                                    }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.aggression}</label>
                                    <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">

                                        <button
                                            key="Safe"
                                            onClick={() => handleTacticChange('aggression', 'Safe')}
                                            className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.aggression === 'Safe' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t.safe}
                                        </button>
                                        <button
                                            key="Normal"
                                            onClick={() => handleTacticChange('aggression', 'Normal')}
                                            className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.aggression === 'Normal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t.normal}
                                        </button>
                                        <button
                                            key="Aggressive"
                                            onClick={() => handleTacticChange('aggression', 'Aggressive')}
                                            className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.aggression === 'Aggressive' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t.aggressive}
                                        </button>

                                    </div>
                                </div>
                            </>
                        )}

                        {tacticTab === 'IN_POSSESSION' && (
                            <div className="space-y-2">
                                {/* Style - Main playing style */}
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.styleLabel || 'Style'}</label>
                                    <div className="grid grid-cols-3 gap-1 mt-0.5">
                                        {[
                                            { value: 'Balanced', label: t.styleBalanced || 'Balanced' },
                                            // { value: 'Possession', label: t.stylePossession || 'Possession' },
                                            { value: 'Counter', label: t.styleCounter || 'Counter' },
                                            { value: 'HighPress', label: t.styleHighPress || 'High Press' },
                                            { value: 'ParkTheBus', label: t.styleParkTheBus || 'Park Bus' }
                                        ].map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => handleTacticChange('style', s.value)}
                                                className={`px-1 py-1 text-[9px] font-bold rounded border transition-all ${(team.tactic.style || 'Balanced') === s.value
                                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.width}</label>
                                        <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                            <button onClick={() => handleTacticChange('width', 'Narrow')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${(team.tactic.width || 'Balanced') === 'Narrow' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticNarrow}</button>
                                            <button onClick={() => handleTacticChange('width', 'Balanced')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${(team.tactic.width || 'Balanced') === 'Balanced' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticBalanced || 'Bal'}</button>
                                            <button onClick={() => handleTacticChange('width', 'Wide')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.width === 'Wide' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticWide}</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.passingStyle}</label>
                                        <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                            {/* <button onClick={() => handleTacticChange('passingStyle', 'Short')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.passingStyle === 'Short' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticShort}</button> */}
                                            <button onClick={() => handleTacticChange('passingStyle', 'Mixed')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${(team.tactic.passingStyle || 'Mixed') === 'Mixed' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticBalanced || 'Mix'}</button>
                                            <button onClick={() => handleTacticChange('passingStyle', 'Direct')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.passingStyle === 'Direct' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticDirect}</button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.tempo || 'Tempo'}</label>
                                    <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                        <button onClick={() => handleTacticChange('tempo', 'Slow')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.tempo === 'Slow' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tempoSlow || 'Slow'}</button>
                                        <button onClick={() => handleTacticChange('tempo', 'Normal')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.tempo === 'Normal' || !team.tactic.tempo ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticBalanced || 'Normal'}</button>
                                        <button onClick={() => handleTacticChange('tempo', 'Fast')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.tempo === 'Fast' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tempoFast || 'Fast'}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tacticTab === 'OUT_POSSESSION' && (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.defensiveLine}</label>
                                    <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                        <button onClick={() => handleTacticChange('defensiveLine', 'Deep')} className={`flex-1 text-[9px] py-1 rounded font-bold ${team.tactic.defensiveLine === 'Deep' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>{t.tacticDeep}</button>
                                        <button onClick={() => handleTacticChange('defensiveLine', 'Balanced')} className={`flex-1 text-[9px] py-1 rounded font-bold ${team.tactic.defensiveLine === 'Balanced' || !team.tactic.defensiveLine ? 'bg-red-600 text-white' : 'text-slate-400'}`}>{t.tacticBalanced || 'Normal'}</button>
                                        <button onClick={() => handleTacticChange('defensiveLine', 'High')} className={`flex-1 text-[9px] py-1 rounded font-bold ${team.tactic.defensiveLine === 'High' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>{t.tacticHigh}</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    ref={pitchRef}
                    onMouseMove={handlePitchMouseMove}
                    onTouchMove={handlePitchMouseMove}
                    onMouseLeave={handlePitchMouseUp}
                    className="bg-emerald-900/30 border-2 border-slate-600 rounded-lg h-[300px] md:h-[400px] relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] shadow-inner cursor-crosshair select-none touch-pan-y"
                >
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute top-0 left-1/2 h-full w-[1px] bg-white/10 -translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-0 w-10 h-32 border-r border-y border-white/10 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute top-1/2 right-0 w-10 h-32 border-l border-y border-white/10 -translate-y-1/2 pointer-events-none"></div>

                    {visuals.map((item) => {
                        const { p, presetRole, idx, total } = item;
                        let top, left;
                        let activeRole = presetRole;

                        if (team.tactic.customPositions && team.tactic.customPositions[p.id]) {
                            left = team.tactic.customPositions[p.id].x;
                            top = team.tactic.customPositions[p.id].y;
                            activeRole = getRoleFromX(left);
                        } else {
                            const coords = getBaseFormationOffset(team.tactic.formation, presetRole, idx, total);
                            left = coords.x;
                            top = coords.y;
                        }

                        assignedRoleMap[p.id] = activeRole;

                        let bgClass = 'bg-slate-500';
                        if (activeRole === Position.GK) bgClass = 'bg-yellow-600';
                        else if (activeRole === Position.DEF) bgClass = 'bg-blue-600';
                        else if (activeRole === Position.MID) bgClass = 'bg-emerald-600';
                        else if (activeRole === Position.FWD) bgClass = 'bg-red-600';

                        // Calculate rating with current live condition
                        const effectiveRating = calculateEffectiveRating(p, activeRole, p.condition);

                        // Base rating for comparison (100% condition)
                        const baseRating = calculateEffectiveRating(p, activeRole, 100);

                        let isSevereError = false;
                        if (effectiveRating < baseRating * 0.8) isSevereError = true;

                        const borderClass = isSevereError ? 'border-red-500 border-2 animate-pulse bg-red-900 text-red-200' : 'border-slate-900';
                        const isDragging = draggingId === p.id;

                        // Forma numarası - visuals dizisindeki global index'e göre ata
                        const globalIndex = visuals.indexOf(item);
                        const jerseyNumber = p.jerseyNumber || (activeRole === Position.GK ? 1 : globalIndex + 1);

                        return (
                            <div
                                key={p.id}
                                onMouseDown={(e) => handleDragStart(e, p.id)}
                                onTouchStart={(e) => handleDragStart(e, p.id)}
                                className={`absolute w-8 h-8 rounded-full border-2 ${borderClass} shadow-xl flex items-center justify-center text-[10px] font-bold text-white z-10 transition-transform touch-none ${isDragging ? 'scale-125 cursor-grabbing z-50' : 'hover:scale-110 cursor-grab'} ${bgClass}`}
                                style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)', transition: isDragging ? 'none' : 'all 0.2s ease-out' }}
                                title={`${p.firstName} ${p.lastName} (${p.position}) - ${jerseyNumber} | OVR: ${effectiveRating}`}
                            >
                                {jerseyNumber}
                            </div>
                        )
                    })}

                    <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded z-20 font-bold ${starters.length === 11 ? 'bg-black/50 text-emerald-400' : 'bg-red-900/80 text-white'}`}>
                        {starters.length}/11
                    </div>
                </div>

                <div className="bg-slate-800 p-2 rounded text-[10px] text-slate-400 border border-slate-700 flex justify-between">
                    <span className="flex items-center gap-1"><ArrowRightLeft size={10} /> {t.clickSwap}</span>
                    <span className="flex items-center gap-1 text-emerald-400"><ArrowRight size={10} /> {t.dragAdjust}</span>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-4 h-auto overflow-y-visible">
                <div>
                    <h3 className="text-emerald-500 font-bold mb-2 uppercase text-sm tracking-widest flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {t.startingXI} <span className="text-white">({starters.length}/11)</span>
                        </div>
                        <button
                            onClick={handleAutoPick}
                            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${starters.length < 11
                                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse'
                                : 'bg-emerald-900/40 hover:bg-emerald-800 text-emerald-400 border-emerald-700'
                                }`}
                        >
                            {starters.length < 11 ? <Wand2 size={12} /> : <CheckCircle2 size={12} />}
                            <span className="hidden xs:inline">{t.completeSquad}</span>
                        </button>
                    </h3>
                    <div className="fm-panel rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_2fr_repeat(5,1fr)_auto] gap-2 p-2 bg-slate-900 border-b border-white/10 text-[9px] uppercase font-bold text-slate-500">
                            <div className="w-6">Pos</div>
                            <div>Name</div>
                            <div className="hidden md:flex justify-center">Spd</div>
                            <div className="hidden md:flex justify-center">Sht</div>
                            <div className="hidden md:flex justify-center">Pas</div>
                            <div className="hidden md:flex justify-center">Dri</div>
                            <div className="hidden md:flex justify-center">Def</div>
                            <div className="w-16 md:w-24">Status</div>
                            <div className="pl-2 w-16 text-center">OVR</div>
                        </div>
                        {starters.map((p, idx) => (
                            <PlayerRow
                                key={p.id}
                                player={p}
                                selectedPlayerId={selectedPlayerId}
                                onSelect={handlePlayerSelect}
                                onInteractStart={setInteractingPlayer}
                                onMove={onMovePlayer}
                                isFirst={idx === 0}
                                isLast={idx === starters.length - 1}
                                assignedRole={assignedRoleMap[p.id]}
                                t={t}
                            />
                        ))}
                        {starters.length === 0 && <div className="text-slate-600 text-center py-4 text-sm">Select players to start</div>}
                    </div>
                </div>

                <div>
                    <h3 className="text-blue-500 font-bold mb-2 uppercase text-sm tracking-widest flex justify-between">
                        {t.bench} <span className="text-white">{bench.length}/9</span>
                    </h3>
                    <div className="bg-slate-900/50 p-2 rounded border border-blue-900/30">
                        {bench.map((p, idx) => (
                            <PlayerRow
                                key={p.id}
                                player={p}
                                selectedPlayerId={selectedPlayerId}
                                onSelect={handlePlayerSelect}
                                onInteractStart={setInteractingPlayer}
                                onMove={onMovePlayer}
                                isFirst={idx === 0}
                                isLast={idx === bench.length - 1}
                                t={t}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-slate-500 font-bold mb-2 uppercase text-sm tracking-widest">
                        {t.reserves}
                    </h3>
                    <div className="fm-panel rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_2fr_repeat(5,1fr)_auto] gap-2 p-2 bg-slate-900 border-b border-white/10 text-[9px] uppercase font-bold text-slate-500">
                            <div className="w-6">Pos</div>
                            <div>Name</div>
                            <div className="hidden md:flex justify-center">Spd</div>
                            <div className="hidden md:flex justify-center">Sht</div>
                            <div className="hidden md:flex justify-center">Pas</div>
                            <div className="hidden md:flex justify-center">Dri</div>
                            <div className="hidden md:flex justify-center">Def</div>
                            <div className="w-16 md:w-24">Status</div>
                            <div className="pl-2 w-16 text-center">OVR</div>
                        </div>
                        {reserves.map(p => (
                            <PlayerRow
                                key={p.id}
                                player={p}
                                selectedPlayerId={selectedPlayerId}
                                onSelect={handlePlayerSelect}
                                onInteractStart={setInteractingPlayer}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
