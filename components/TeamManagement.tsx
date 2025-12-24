
import React, { useState, useRef, useEffect } from 'react';
import { Player, Team, Position, TacticType, Translation, TeamTactic, LineupStatus, AssistantAdvice } from '../types';
import { Shield, ArrowRightLeft, Gauge, Wand2, ArrowRight, AlertTriangle, ShieldAlert, MessageSquare, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { getFormationStructure, getRoleFromX, calculateEffectiveRating, getBaseFormationOffset } from '../services/MatchEngine';
import { autoPickLineup as smartAutoPick, analyzeClubHealth } from '../services/engine';
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
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, selectedPlayerId, onSelect, onInteractStart, onMove, isFirst, isLast, assignedRole }) => {

    let warning = null;
    // Calculate live effective rating considering current condition (stamina)
    let effectiveRating = calculateEffectiveRating(player, assignedRole || normalizePos(player), player.condition);

    if (assignedRole) {
        // Base rating for comparison (100% condition)
        const baseRating = calculateEffectiveRating(player, assignedRole, 100);

        if (effectiveRating < baseRating * 0.8) warning = 'red';
        else if (effectiveRating < baseRating) warning = 'yellow';
    } else {
        // For players without assigned role (bench/reserves), compare to their normal overall
        if (effectiveRating < player.overall * 0.8) warning = 'red';
        else if (effectiveRating < player.overall) warning = 'yellow';
    }

    return (
        <div
            className={`flex items-center justify-between p-3 rounded cursor-pointer border mb-1 transition-all active:scale-[0.98] ${selectedPlayerId === player.id
                ? 'bg-emerald-900/50 border-emerald-500'
                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700'
                }`}
        >
            <div className="flex items-center gap-3 flex-1" onClick={() => onSelect(player)}>
                <div className="w-8 text-center text-xs font-bold text-slate-500 bg-slate-900 rounded py-1">{player.position}</div>
                <PlayerAvatar visual={player.visual} size="sm" />
                <div>
                    <div className={`font-bold text-sm ${selectedPlayerId === player.id ? 'text-white' : 'text-slate-300'} flex items-center gap-1`}>
                        {player.firstName.substring(0, 1)}. {player.lastName}
                        {player.weeksInjured > 0 && <span className="text-red-500 ml-1">(!)</span>}
                        {player.matchSuspension > 0 && <span className="text-yellow-500 ml-1">(!)</span>}
                        {warning === 'red' && <AlertTriangle size={12} className="text-red-500" />}
                        {warning === 'yellow' && <AlertTriangle size={12} className="text-yellow-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 flex gap-2">
                        <span className={player.condition < 60 ? 'text-red-400 font-bold' : ''}>Cond: {player.condition}%</span>
                        <span className={player.morale < 50 ? 'text-red-400 font-bold' : ''}>Mor: {player.morale}%</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {onMove && (
                    <div className="flex flex-col gap-0.5">
                        <button
                            disabled={isFirst}
                            onClick={(e) => { e.stopPropagation(); onMove(player.id, 'UP'); }}
                            className={`p-1.5 rounded ${isFirst ? 'text-slate-700' : 'text-slate-500 hover:text-white hover:bg-slate-600'}`}
                        >
                            <ChevronUp size={16} />
                        </button>
                        <button
                            disabled={isLast}
                            onClick={(e) => { e.stopPropagation(); onMove(player.id, 'DOWN'); }}
                            className={`p-1.5 rounded ${isLast ? 'text-slate-700' : 'text-slate-500 hover:text-white hover:bg-slate-600'}`}
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onInteractStart(player); }}
                    className="text-slate-500 hover:text-white transition-colors p-2"
                    title="Talk to Player"
                >
                    <MessageSquare size={18} />
                </button>
                <div className={`font-bold w-6 text-right ${assignedRole ? getOverallColor(effectiveRating) : getOverallColor(player.overall)}`}>
                    {effectiveRating}
                </div>
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
    t: Translation;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
    team, players, onUpdateTactic, onPlayerClick, onUpdateLineup, onSwapPlayers, onMovePlayer, onAutoFix, t
}) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [tacticTab, setTacticTab] = useState<'FORMATION' | 'IN_POSSESSION' | 'OUT_POSSESSION'>('FORMATION');
    const [showAssistant, setShowAssistant] = useState(false);
    const [advice, setAdvice] = useState<AssistantAdvice[]>([]);
    const [interactingPlayer, setInteractingPlayer] = useState<Player | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const pitchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setAdvice(analyzeClubHealth(team, players));
    }, [team, players]);

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
                        <div className="flex gap-1">
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
                                <Wand2 size={10} /> Auto
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-slate-900 rounded p-1 mb-2">
                        <button onClick={() => setTacticTab('FORMATION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${tacticTab === 'FORMATION' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Base</button>
                        <button onClick={() => setTacticTab('IN_POSSESSION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${tacticTab === 'IN_POSSESSION' ? 'bg-emerald-700 text-white' : 'text-slate-500'}`}>Attack</button>
                        <button onClick={() => setTacticTab('OUT_POSSESSION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${tacticTab === 'OUT_POSSESSION' ? 'bg-red-900 text-white' : 'text-slate-500'}`}>Defense</button>
                    </div>

                    <div className="space-y-2 min-h-[80px]">
                        {tacticTab === 'FORMATION' && (
                            <>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">Formation</label>
                                    <select
                                        value={team.tactic.formation}
                                        onChange={(e) => handleTacticChange('formation', e.target.value as TacticType)}
                                        className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:outline-none mt-0.5 text-xs"
                                    >
                                        {Object.values(TacticType).map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">Aggression</label>
                                    <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                        {['Safe', 'Normal', 'Aggressive'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => handleTacticChange('aggression', opt)}
                                                className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.aggression === opt ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {tacticTab === 'IN_POSSESSION' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.width}</label>
                                    <select value={team.tactic.width || 'Balanced'} onChange={(e) => handleTacticChange('width', e.target.value)} className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 text-[10px] mt-0.5">
                                        <option value="Narrow">{t.tacticNarrow}</option>
                                        <option value="Balanced">Balanced</option>
                                        <option value="Wide">{t.tacticWide}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.passingStyle}</label>
                                    <select value={team.tactic.passingStyle || 'Mixed'} onChange={(e) => handleTacticChange('passingStyle', e.target.value)} className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 text-[10px] mt-0.5">
                                        <option value="Short">{t.tacticShort}</option>
                                        <option value="Mixed">Mixed</option>
                                        <option value="Direct">{t.tacticDirect}</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {tacticTab === 'OUT_POSSESSION' && (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-500 font-bold">{t.defensiveLine}</label>
                                    <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                        <button onClick={() => handleTacticChange('defensiveLine', 'Deep')} className={`flex-1 text-[9px] py-1 rounded font-bold ${team.tactic.defensiveLine === 'Deep' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>{t.tacticDeep}</button>
                                        <button onClick={() => handleTacticChange('defensiveLine', 'Balanced')} className={`flex-1 text-[9px] py-1 rounded font-bold ${team.tactic.defensiveLine === 'Balanced' || !team.tactic.defensiveLine ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Normal</button>
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

                        return (
                            <div
                                key={p.id}
                                onMouseDown={(e) => handleDragStart(e, p.id)}
                                onTouchStart={(e) => handleDragStart(e, p.id)}
                                className={`absolute w-8 h-8 rounded-full border-2 ${borderClass} shadow-xl flex items-center justify-center text-[10px] font-bold text-white z-10 transition-transform touch-none ${isDragging ? 'scale-125 cursor-grabbing z-50' : 'hover:scale-110 cursor-grab'} ${bgClass}`}
                                style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)', transition: isDragging ? 'none' : 'all 0.2s ease-out' }}
                                title={`${p.firstName} ${p.lastName} (${p.position}) - Playing as ${activeRole}`}
                            >
                                {effectiveRating}
                            </div>
                        )
                    })}

                    <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded z-20 font-bold ${starters.length === 11 ? 'bg-black/50 text-emerald-400' : 'bg-red-900/80 text-white'}`}>
                        {starters.length}/11
                    </div>
                </div>

                <div className="bg-slate-800 p-2 rounded text-[10px] text-slate-400 border border-slate-700 flex justify-between">
                    <span className="flex items-center gap-1"><ArrowRightLeft size={10} /> Click swap.</span>
                    <span className="flex items-center gap-1 text-emerald-400"><ArrowRight size={10} /> Drag adjust.</span>
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
                    <div className="bg-slate-900/50 p-2 rounded border border-emerald-900/30">
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
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-slate-500 font-bold mb-2 uppercase text-sm tracking-widest">
                        {t.reserves}
                    </h3>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                        {reserves.map(p => (
                            <PlayerRow
                                key={p.id}
                                player={p}
                                selectedPlayerId={selectedPlayerId}
                                onSelect={handlePlayerSelect}
                                onInteractStart={setInteractingPlayer}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
