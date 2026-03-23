
import React, { useState, useRef, useEffect } from 'react';
import { Player, PlayerAttributes, Team, Position, TacticType, Translation, TeamTactic, LineupStatus, AssistantAdvice } from '../types';
import { Shield, ArrowRightLeft, Gauge, Wand2, ArrowRight, AlertTriangle, ShieldAlert, MessageSquare, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { getFormationStructure, getRoleFromX, calculateEffectiveRating, getBaseFormationOffset, getRatingImpacts, RatingImpact } from '../services/MatchEngine';
import { autoPickLineup as smartAutoPick, analyzeClubHealth, analyzeMatchSituation, getEngineChoice } from '../services/engine';
import { TACTICAL_PRESETS, applyPreset, validateTactic, PresetKey, detectPreset } from '../services/tactics';
// AssistantReport removed - replaced by inline opponent tactical panel
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

type EngineChoice = 'classic' | 'ikinc' | 'ucuncu';
type EngineSupportLevel = 'native' | 'adapted' | 'translated' | 'basic';
type EngineSupportField = 'formation' | 'customPositions' | 'playerInstructions' | 'attackApproach' | 'finalThird' | 'attackPlan' | 'width' | 'defenseApproach' | 'aggression' | 'marking';

type EngineSupportInfo = {
    label: string;
    summary: string;
    badgeClass: string;
};

const getEnginePresentation = (engine: EngineChoice, t: Translation) => {
    if (engine === 'ucuncu') {
        return {
            label: t.engineUcuncu || 'Pro Motor',
            shortLabel: 'PRO',
            summary: t.engineProTacticSummary || 'Attack plan, press and defense behaviors are processed with a deeper and more direct layer in this engine.',
            panelClass: 'border-cyan-700/40 bg-cyan-950/25',
            chipClass: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200',
        };
    }
    if (engine === 'ikinc') {
        return {
            label: t.engineIkinc || 'Arcade Motor',
            shortLabel: 'ARCADE',
            summary: t.engineArcadeTacticSummary || 'Core tactic fields work; some high-level selections are adapted to the arcade behavior profile.',
            panelClass: 'border-amber-700/40 bg-amber-950/20',
            chipClass: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
        };
    }
    return {
        label: t.engineClassic || 'Klasik Motor',
        shortLabel: 'STD',
        summary: t.engineClassicTacticSummary || 'Core tactic fields work directly; advanced attack plan selections are translated into supported behaviors.',
        panelClass: 'border-blue-700/40 bg-blue-950/20',
        chipClass: 'border-blue-500/40 bg-blue-500/15 text-blue-200',
    };
};

const getSupportInfo = (engine: EngineChoice, field: EngineSupportField, t: Translation): EngineSupportInfo => {
    const level: EngineSupportLevel = (() => {
        if (field === 'attackPlan') return engine === 'ucuncu' ? 'native' : 'adapted';
        if (field === 'attackApproach' || field === 'defenseApproach') return 'translated';
        if (field === 'marking') return 'native';
        return 'native';
    })();

    if (level === 'native') {
        return {
            label: t.engineNativeLabel || 'Native',
            summary: field === 'attackPlan'
                ? (t.engineNativeSummaryAttack || 'Selection feeds directly into the live plan logic in this engine.')
                : field === 'playerInstructions'
                    ? (t.engineNativeSummaryPlayer || 'Selections in this field are read directly by the engine and affect player behavior.')
                    : (t.engineNativeSummaryDefault || 'This field works natively in the selected engine.'),
            badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
        };
    }

    if (level === 'adapted') {
        return {
            label: t.engineAdaptedLabel || 'Adapted',
            summary: t.engineAdaptedSummary || "This selection doesn't produce a direct plan object; the engine translates it into supported instructions and behaviors.",
            badgeClass: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
        };
    }

    if (level === 'translated') {
        return {
            label: t.engineTranslatedLabel || 'Translated',
            summary: t.engineTranslatedSummary || 'This screen selection is applied by being translated into style, pass, tempo, press, or line settings.',
            badgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-200',
        };
    }

    return {
        label: t.engineBasicLabel || 'Basic',
        summary: t.engineBasicSummary || 'Works, but not as deep as in the Pro engine; produces a more basic behavior difference.',
        badgeClass: 'border-violet-500/40 bg-violet-500/15 text-violet-200',
    };
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
            className={`fm-card relative mb-2 p-0.5 transition-all duration-300 ${isSelected ? 'scale-[1.01] z-10 border-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : ''
                }`}
        >
            {/* OVR based Glow Effect (Subtle background gradient) */}
            {effectiveRating >= 85 && <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-emerald-500/20 to-transparent pointer-events-none"></div>}
            {effectiveRating >= 75 && effectiveRating < 85 && <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-blue-500/20 to-transparent pointer-events-none"></div>}

            <div className={`relative flex items-center p-2.5 gap-3 rounded-xl`}>

                {/* Ranking / Role Badge (Premium Style) */}
                <div className="flex flex-col items-center justify-center shrink-0">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black shadow-lg shadow-black/40 border-b-2 ${player.position === 'GK' ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-yellow-800' :
                        player.position === 'DEF' ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-800' :
                            player.position === 'MID' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-800' :
                                'bg-gradient-to-br from-red-500 to-red-700 text-white border-red-800'
                        }`}>
                        {player.position}
                    </div>
                    {player.jerseyNumber && (
                        <div className="mt-1 flex items-center gap-0.5 opacity-70">
                            <span className="text-[10px] font-mono font-bold text-white">#{player.jerseyNumber}</span>
                        </div>
                    )}
                </div>

                {/* Player Name & Traits */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold truncate ${effectiveRating >= 85 ? 'text-glow-emerald text-white text-base' : 'text-slate-100 text-sm'}`}>
                            {player.firstName} <span className="uppercase">{player.lastName}</span>
                        </span>

                        {/* Badges */}
                        {player.weeksInjured > 0 && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[9px] font-bold rounded shadow-md animate-pulse flex items-center gap-1">
                                🏥 {player.weeksInjured}h
                            </span>
                        )}
                        {player.matchSuspension > 0 && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-red-600 to-red-800 text-white text-[9px] font-bold rounded shadow-md flex items-center gap-1">
                                🟥 {player.matchSuspension}m
                            </span>
                        )}
                        {player.stats?.yellowCards >= 4 && player.matchSuspension === 0 && (
                            <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-[9px] font-bold rounded shadow-md flex items-center gap-1" title={t.yellowCardWarning || 'Yellow card warning!'}>
                                🟨 {player.stats.yellowCards}
                            </span>
                        )}
                        {(player.contractYears ?? 99) <= 1 && (
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded shadow-md flex items-center gap-1 ${player.contractYears <= 0 ? 'bg-red-700 text-white animate-pulse' : 'bg-amber-500 text-black'}`} title={t.contractExpiring || 'Contract expiring!'}>
                                📋 {player.contractYears <= 0 ? (t.contractExpired || 'Exp') : `${player.contractYears}y`}
                            </span>
                        )}
                        {player.form >= 8 && (
                            <span className="text-[10px] animate-bounce" title={t.inForm || 'In form! Great recent performances.'}>🔥</span>
                        )}
                        {/* Playstyles as small floating badges */}
                        {player.playStyles && player.playStyles.slice(0, 2).map((style, idx) => (
                            <span key={idx} className="px-1.5 border border-indigo-400/30 bg-indigo-900/40 text-indigo-300 text-[8px] rounded-full uppercase tracking-wider">
                                {style.split(' ')[0]} {/* Shortened style name */}
                            </span>
                        ))}
                    </div>

                    {/* Out of Position Warning */}
                    {assignedRole && assignedRole !== normalizePos(player) && (
                        <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-0.5 bg-amber-900/30 px-1.5 py-0.5 rounded w-max">
                            <AlertTriangle size={10} /> OOP: {assignedRole} Penalty
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

                {/* Mobile/Compact Status Bars */}
                <div className="flex flex-col justify-center gap-1.5 w-20 sm:w-24 group/status relative">
                    <div className="flex items-center gap-1.5 bg-slate-900/50 px-1.5 py-1 rounded">
                        <span className="text-[8px] font-black uppercase text-slate-400 w-4">{t.con}</span>
                        <div className="h-1.5 flex-1 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-500 ${player.condition > 80 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : player.condition > 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${player.condition}%` }}></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900/50 px-1.5 py-1 rounded">
                        <span className="text-[8px] font-black uppercase text-slate-400 w-4">{t.mor}</span>
                        <div className="h-1.5 flex-1 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-500 ${player.morale > 80 ? 'bg-emerald-400' : player.morale > 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${player.morale}%` }}></div>
                        </div>
                    </div>
                    {/* Morale Reason Tooltip */}
                    <div className="absolute bottom-full left-0 mb-1 p-2 bg-slate-900 border border-slate-600 rounded shadow-xl opacity-0 group-hover/status:opacity-100 transition-opacity pointer-events-none z-50 w-56 text-[10px]">
                        <div className="font-bold text-white mb-1">Moral: {player.morale}%</div>
                        <div className="space-y-0.5 text-slate-400">
                            {player.playedThisWeek && <div className="text-emerald-400">✅ {t.playedThisWeek || 'Played this week'} (+2)</div>}
                            {!player.playedThisWeek && player.lineup === 'STARTING' && <div className="text-emerald-400">✓ {t.playingInStartingXI || t.playingXIBonus || 'Playing in Starting XI (+2/week)'}</div>}
                            {!player.playedThisWeek && player.lineup === 'BENCH' && <div className="text-blue-400">🪑 {t.benchStable || 'On bench (stable - ready to play)'}</div>}
                            {player.lineup === 'RESERVE' && player.overall > 75 && <div className="text-red-400">⛔ {t.reserveStarPenalty || 'Reserve, star player (-3/week)'}</div>}
                            {player.lineup === 'RESERVE' && player.overall > 65 && player.overall <= 75 && <div className="text-yellow-400">⚠ {t.reserveMediumPenalty || 'Reserve (-1/week)'}</div>}
                            {player.lineup === 'RESERVE' && player.overall <= 65 && <div className="text-slate-500">📋 {t.reserveStable || 'Reserve (stable)'}</div>}
                            {player.weeksInjured > 0 && <div className="text-orange-400">🏥 {t.injured || 'Injured'} ({player.weeksInjured} {t.weeks || 'weeks'})</div>}
                            {player.matchSuspension > 0 && <div className="text-red-400">🟥 {t.suspended || 'Suspended'} ({player.matchSuspension} {t.matches || 'matches'})</div>}
                            {player.form > 7 && <div className="text-emerald-400">🔥 {t.goodForm || 'Good form'} ({player.form}/10)</div>}
                            {player.form < 5 && <div className="text-red-400">📉 {t.badFormAlert || 'Bad form'} ({player.form}/10)</div>}
                            {player.morale < 40 && <div className="text-amber-400 mt-1">💬 {t.tryMotivating || 'Try motivating!'}</div>}
                        </div>

                        {/* Moral History - Son değişiklikler */}
                        {player.moraleHistory && player.moraleHistory.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700">
                                <div className="text-[9px] text-slate-500 mb-1">{t.lastMoraleChanges || 'Last Morale Changes'}:</div>
                                {player.moraleHistory.slice(-3).reverse().map((h, i) => (
                                    <div key={i} className={`text-[9px] ${h.change > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                        {t.week || 'Week'} {h.week}: {h.change > 0 ? '+' : ''}{h.change} ({h.reason})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions & Big OVR Rating */}
                <div className="flex items-center gap-2 pl-3 border-l border-white/10 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onInteractStart(player); }} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/50 rounded-lg text-slate-400 hover:text-indigo-300 transition-colors">
                        <MessageSquare size={14} />
                    </button>

                    {/* Premium OVR Box */}
                    <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl shadow-lg border-2 ${effectiveRating >= 90 ? 'bg-gradient-to-b from-yellow-300 to-yellow-600 border-yellow-300 shadow-yellow-500/30' :
                        effectiveRating >= 80 ? 'bg-gradient-to-b from-slate-200 to-slate-400 border-slate-200 shadow-white/20' :
                            effectiveRating >= 70 ? 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-700 shadow-orange-900/40' :
                                'bg-slate-800 border-slate-700'
                        }`} title={`Base: ${player.overall} | Live: ${effectiveRating}`}>
                        <span className={`font-black text-xl leading-none ${effectiveRating >= 70 ? 'text-slate-900 text-glow-white' : 'text-slate-300'}`}>
                            {effectiveRating}
                        </span>
                        {player.overall !== effectiveRating && (
                            <div className="group/ovr relative flex flex-col items-center">
                                <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${effectiveRating < player.overall ? 'text-red-900/80 animate-pulse' : 'text-emerald-900'}`}>
                                    {effectiveRating < player.overall ? (t.drop || 'DROP') : (t.buff || 'BUFF')}
                                </span>

                                {/* Rating Impact Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl opacity-0 group-hover/ovr:opacity-100 transition-opacity pointer-events-none z-[60] text-[10px]">
                                    <div className="font-bold text-white mb-1 border-b border-slate-700 pb-1">{t.ratingFactors || 'Reyting Faktörleri'}</div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>{t.baseOverall || 'Base Overall'}</span>
                                            <span className="font-mono">{player.overall}</span>
                                        </div>
                                        {getRatingImpacts(player, roleToUse, player.condition).map((impact, idx) => {
                                            const labelMap = {
                                                POSITION: t.ratingImpactPosition || 'Out of Position',
                                                MORALE: t.ratingImpactMorale || 'Low Morale',
                                                CONDITION: t.ratingImpactCondition || 'Low Condition',
                                                FIT: t.ratingImpactStable || 'Optimal State'
                                            };
                                            return (
                                                <div key={idx} className={`flex justify-between items-center ${impact.value > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    <span>{labelMap[impact.reason]}</span>
                                                    <span className="font-mono font-bold">{impact.value > 0 ? '+' : ''}{impact.value}</span>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-1 mt-1 border-t border-slate-700 flex justify-between items-center font-bold text-white">
                                            <span>{t.currentOverall || 'Current'}</span>
                                            <span className="text-emerald-400">{effectiveRating}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {onMove && (
                        <div className="flex flex-col gap-1 ml-1">
                            {!isFirst ?
                                <button onClick={(e) => { e.stopPropagation(); onMove(player.id, 'UP'); }} className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-emerald-500/20 rounded text-slate-400 hover:text-emerald-400 border border-white/5">
                                    <ChevronUp size={14} />
                                </button>
                                : <div className="w-6 h-6"></div>}

                            {!isLast ?
                                <button onClick={(e) => { e.stopPropagation(); onMove(player.id, 'DOWN'); }} className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-emerald-500/20 rounded text-slate-400 hover:text-emerald-400 border border-white/5">
                                    <ChevronDown size={14} />
                                </button>
                                : <div className="w-6 h-6"></div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TeamManagementProps {
    team: Team;
    players: Player[];
    opponent?: Team; // NEW: Opponent team for tactical analysis
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
    team, players, opponent, onUpdateTactic, onPlayerClick, onUpdateLineup, onSwapPlayers, onMovePlayer, onAutoFix, onPlayerMoraleChange, matchStatus, t
}) => {
    const selectedEngine = getEngineChoice() as EngineChoice;
    const enginePresentation = getEnginePresentation(selectedEngine, t);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [tacticTab, setTacticTab] = useState<'PRESETS' | 'FORMATION' | 'IN_POSSESSION' | 'OUT_POSSESSION'>('FORMATION');
    // showAssistant removed - using inline panel instead
    const [advice, setAdvice] = useState<AssistantAdvice[]>([]);
    const [interactingPlayer, setInteractingPlayer] = useState<Player | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [instructionTarget, setInstructionTarget] = useState<{ playerId: string, lineupIndex: number, role: string } | null>(null);
    const dragStartPos = useRef<{ x: number, y: number, id: string } | null>(null);
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

    // Feedback state for interactions
    const [feedbackMessage, setFeedbackMessage] = useState<{ text: string, type: 'success' | 'info' } | null>(null);

    // Clear feedback after 3 seconds
    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => setFeedbackMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);

    const handleInteract = (type: 'PRAISE' | 'CRITICIZE' | 'MOTIVATE', intensity: 'LOW' | 'HIGH') => {
        if (!interactingPlayer) return;
        const result = handlePlayerInteraction(interactingPlayer, type, intensity);

        // === BUG FIX: Actually apply the morale change! ===
        if (onPlayerMoraleChange && result.moraleChange !== 0) {
            const reasonMap = {
                PRAISE: intensity === 'HIGH' ? (t.praiseIntense || 'Intense Praise') : (t.praise || 'Praise'),
                CRITICIZE: intensity === 'HIGH' ? (t.criticizeHard || 'Harsh Criticism') : (t.criticize || 'Criticism'),
                MOTIVATE: t.motivateSpeech || 'Motivational Talk'
            };
            onPlayerMoraleChange(interactingPlayer.id, result.moraleChange, reasonMap[type]);
        }

        // Show feedback instead of alert
        setFeedbackMessage({
            text: `${result.message} (${result.moraleChange > 0 ? '+' : ''}${result.moraleChange} Morale)`,
            type: result.moraleChange >= 0 ? 'success' : 'info'
        });

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
        let clientX, clientY;
        if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
        else { clientX = e.clientX; clientY = e.clientY; }
        dragStartPos.current = { x: clientX, y: clientY, id: playerId };
        setDraggingId(playerId);
        if (selectedPlayerId) setSelectedPlayerId(null);
    };

    const handlePitchMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragStartPos.current || !pitchRef.current) return;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            if (e.cancelable) e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Only update position if moved more than 5px (prevents drift on clicks)
        const dx = clientX - dragStartPos.current.x;
        const dy = clientY - dragStartPos.current.y;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

        const currentId = dragStartPos.current.id;
        const rect = pitchRef.current.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const clampedX = Math.max(2, Math.min(98, x));
        const clampedY = Math.max(2, Math.min(98, y));
        const newPositions = { ...(team.tactic.customPositions || {}), [currentId]: { x: clampedX, y: clampedY } };
        handleTacticChange('customPositions', newPositions);
    };

    const handlePitchMouseUp = (e?: React.MouseEvent | React.TouchEvent) => {
        // Use ref (not state) so we always get the current playerId regardless of React render timing
        const savedDrag = dragStartPos.current;
        if (savedDrag && e) {
            let clientX, clientY;
            if ('changedTouches' in e) { clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
            else if ('clientX' in e) { clientX = e.clientX; clientY = e.clientY; }
            else { clientX = savedDrag.x; clientY = savedDrag.y; }
            const dx = clientX - savedDrag.x;
            const dy = clientY - savedDrag.y;
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
                // This was a click, not a drag — open instruction popup
                const vis = visuals.find(v => v.p.id === savedDrag.id);
                if (vis && vis.presetRole !== Position.GK) {
                    // Use activeRole (custom position) if player was dragged to a different zone
                    let role = vis.presetRole;
                    if (team.tactic.customPositions && team.tactic.customPositions[savedDrag.id]) {
                        const customX = team.tactic.customPositions[savedDrag.id].x;
                        const derived = getRoleFromX(customX);
                        if (derived !== Position.GK) role = derived;
                    }
                    setInstructionTarget({ playerId: savedDrag.id, lineupIndex: vis.p.lineupIndex ?? 0, role });
                }
            }
        }
        dragStartPos.current = null;
        setDraggingId(null);
    };

    type PlayerInstructionOption = {
        id: string;
        label: string;
        desc: string;
        icon: string;
        duty: string;
        phase: string;
        shortLabel?: string;
    };

    type RoleFitWeights = Partial<Record<keyof PlayerAttributes, number>>;
    type RolePresentation = {
        roleName: string;
        roleFamily: string;
        summary: string;
        fitWeights: RoleFitWeights;
    };

    const ATTRIBUTE_LABELS: Partial<Record<keyof PlayerAttributes, string>> = {
        finishing: t.attrFinishing || 'Finishing',
        passing: t.attrPassing || 'Passing',
        tackling: t.attrTackling || 'Tackling',
        dribbling: t.attrDribbling || 'Dribbling',
        speed: t.attrSpeed || 'Speed',
        stamina: t.attrStamina || 'Stamina',
        positioning: t.attrPositioning || 'Positioning',
        aggression: t.attrAggression || 'Aggression',
        composure: t.attrComposure || 'Composure',
        vision: t.attrVision || 'Vision',
        decisions: t.attrDecisions || 'Decisions',
    };

    // Instruction definitions per position
    const PLAYER_INSTRUCTIONS: Record<string, PlayerInstructionOption[]> = {
        [Position.DEF]: [
            { id: 'Default', label: t.instrDefault || 'Varsayılan', desc: t.instrDefDefaultDesc || 'Dengeli savunma, gerektiğinde ileri çıkar', icon: '⚽', duty: 'Support', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'SUP' },
            { id: 'StayBack', label: t.instrStayBack || 'Geride Kal', desc: t.instrStayBackDesc || 'Hücuma katılmaz, her zaman geride kalır', icon: '🛡️', duty: 'Defend', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'DEF' },
            { id: 'HoldPosition', label: t.instrHoldPosition || 'Pozisyonu Koru', desc: t.instrHoldPositionDesc || 'Sahadaki atanan pozisyonu kesin olarak koru.', icon: '📍', duty: 'Anchor', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'ANC' },
            { id: 'JoinAttack', label: t.instrJoinAttack || 'Hücuma Katıl', desc: t.instrJoinAttackDesc || 'Kanat bek gibi ileri çıkar, orta yapar', icon: '⚔️', duty: 'Attack', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'ATK' },
        ],
        [Position.MID]: [
            { id: 'Default', label: t.instrDefault || 'Varsayılan', desc: t.instrMidDefaultDesc || 'Dengeli oyna, defansa ve hücuma yardım eder', icon: '⚽', duty: 'Support', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'SUP' },
            { id: 'DefendMore', label: t.instrDefendMore || 'Defansa Yardım', desc: t.instrDefendMoreDesc || 'Daha çok geri gelir, rakip hücumunu keser', icon: '🔒', duty: 'Defend', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'DEF' },
            { id: 'HoldPosition', label: t.instrHoldPosition || 'Kademe Tut', desc: t.instrHoldPositionDesc || 'Pozisyonundan fazla ayrılmaz, dengeyi korur', icon: '⚡', duty: 'Hold', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'HLD' },
            { id: 'AttackMore', label: t.instrAttackMore || 'Hücuma Destek', desc: t.instrAttackMoreDesc || 'İleri çıkar, şut ve pas önceliği artar', icon: '🎯', duty: 'Runner', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'RUN' },
            { id: 'RoamFromPosition', label: t.instrRoam || 'Serbest Dolaş', desc: t.instrRoamDesc || 'Oyuna etki etmek ve boş alan bulmak için pozisyonundan ayrıl.', icon: '🧭', duty: 'Free', phase: t.instrExtraChoice || 'Extra Role', shortLabel: 'FREE' },
            { id: 'PressHigher', label: t.instrPressHigher || 'Yüksek Pres', desc: t.instrPressHigherDesc || 'Topu geri kazanmak için rakibe sahada daha önde pres yap.', icon: '📣', duty: 'Press', phase: t.instrExtraChoice || 'Extra Role', shortLabel: 'PRESS' },
            { id: 'ShootOnSight', label: t.instrShootSight || t.instrShootOnSight || 'Gördüğün Yerde Vur!', desc: t.instrShootSightDesc || t.instrShootOnSightDesc || 'Şut mesafesine girince hemen vurur', icon: '💥', duty: 'Shooter', phase: t.instrExtraChoice || 'Extra Role', shortLabel: 'SHOT' },
        ],
        [Position.FWD]: [
            { id: 'Default', label: t.instrDefault || 'Varsayılan', desc: t.instrFwdDefaultDesc || 'Forvet oynar, gol arar, kontra koşar', icon: '⚽', duty: 'Support', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'SUP' },
            { id: 'DropDeep', label: t.instrDropDeep || 'Geri Çekil', desc: t.instrDropDeepDesc || 'Orta sahaya inerek top ister, playmaker gibi', icon: '↩️', duty: 'Link', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'LINK' },
            { id: 'DefendMore', label: t.instrDefendMore || 'Daha Fazla Defans', desc: t.instrDefendMoreDesc || 'Savunma görevlerine öncelik ver ve sık sık geri dön.', icon: '🔒', duty: 'Press', phase: t.instrMainDuty || 'Main Duty', shortLabel: 'PRESS' },
            { id: 'ShootOnSight', label: t.instrShootSight || t.instrShootOnSight || 'Gördüğün Yerde Vur!', desc: t.instrShootSightDesc || t.instrShootOnSightDesc || 'Şut mesafesine girince hemen vurur', icon: '💥', duty: 'Poach', phase: t.instrExtraChoice || 'Extra Role', shortLabel: 'POACH' },
            { id: 'PressHigher', label: t.instrPressHigher || 'Yüksek Pres', desc: t.instrPressHigherDesc || 'Rakip savunmasına baskı yapar, top kaybettirmez', icon: '📣', duty: 'Press', phase: t.instrExtraChoice || 'Extra Role', shortLabel: 'PRESS' },
            { id: 'RoamFromPosition', label: t.instrRoam || 'Serbest Dolaş', desc: t.instrRoamDesc || 'Oyuna etki etmek ve boş alan bulmak için pozisyonundan ayrıl.', icon: '🧭', duty: 'Free', phase: t.instrExtraChoice || 'Extra Role', shortLabel: 'FREE' },
        ],
    };

    const getInstructionOption = (role: string, instructionId: string) => {
        const roleOptions = PLAYER_INSTRUCTIONS[role] || [];
        return roleOptions.find(option => option.id === instructionId)
            || Object.values(PLAYER_INSTRUCTIONS).flat().find(option => option.id === instructionId)
            || null;
    };

    const getInstructionSections = (role: string) => {
        const options = PLAYER_INSTRUCTIONS[role] || [];
        const grouped = new Map<string, PlayerInstructionOption[]>();
        options.forEach(option => {
            const bucket = grouped.get(option.phase) || [];
            bucket.push(option);
            grouped.set(option.phase, bucket);
        });
        return Array.from(grouped.entries()).map(([title, items]) => ({ title, items }));
    };

    const getRolePresentation = (player: Player | undefined, option: PlayerInstructionOption): RolePresentation => {
        const lineRole = player ? normalizePos(player) : Position.MID;

        const generic: RolePresentation = {
            roleName: option.label,
            roleFamily: option.duty,
            summary: option.desc,
            fitWeights: {},
        };

        switch (lineRole) {
            case Position.DEF:
                switch (option.id) {
                    case 'Default': return { roleName: t.roleDefBalanced || 'Balanced Defender', roleFamily: t.roleFamilyBalanced || 'Balanced', summary: t.roleDefBalancedSummary || 'Holds position, supports when needed.', fitWeights: { tackling: 3, positioning: 3, speed: 2, stamina: 1 } };
                    case 'StayBack': return { roleName: t.roleDefStayBack || 'Stay Back', roleFamily: t.roleFamilySecurity || 'Security', summary: t.roleDefStayBackSummary || 'Rarely pushes up, keeps the backline solid.', fitWeights: { positioning: 3, tackling: 3, strength: 2, decisions: 1 } };
                    case 'HoldPosition': return { roleName: t.roleDefHold || 'Hold Position', roleFamily: t.roleFamilyDiscipline || 'Discipline', summary: t.roleDefHoldSummary || 'Offers a passing angle without breaking the defensive line.', fitWeights: { positioning: 3, passing: 2, composure: 2, decisions: 2 } };
                    case 'JoinAttack': return { roleName: t.roleDefJoinAttack || 'Join Attack', roleFamily: t.roleFamilyAttack || 'Attack', summary: t.roleDefJoinAttackSummary || 'Carries the ball forward and adds an overlap when space opens.', fitWeights: { speed: 3, stamina: 3, passing: 2, dribbling: 1 } };
                    default: return generic;
                }
            case Position.MID:
                switch (option.id) {
                    case 'Default': return { roleName: t.roleMidBalanced || 'Balanced Midfielder', roleFamily: t.roleFamilyBalanced || 'Balanced', summary: t.roleMidBalancedSummary || 'Helps in both directions, doesn\'t overforce the game.', fitWeights: { passing: 2, stamina: 2, decisions: 2, positioning: 2 } };
                    case 'DefendMore': return { roleName: t.roleMidDefend || 'Ball Winner', roleFamily: t.roleFamilyDefense || 'Defense', summary: t.roleMidDefendSummary || 'Chases duels in midfield, increases recovery work.', fitWeights: { tackling: 3, aggression: 2, stamina: 3, positioning: 1 } };
                    case 'HoldPosition': return { roleName: t.roleMidHold || 'Hold Position', roleFamily: t.roleFamilyDiscipline || 'Discipline', summary: t.roleMidHoldSummary || 'Protects the team\'s shape, rarely strays.', fitWeights: { positioning: 3, passing: 2, decisions: 2, composure: 1 } };
                    case 'AttackMore': return { roleName: t.roleMidAttack || 'Get Forward', roleFamily: t.roleFamilyAttack || 'Attack', summary: t.roleMidAttackSummary || 'Makes forward runs when space appears and links up in the box.', fitWeights: { stamina: 3, speed: 2, passing: 2, finishing: 1 } };
                    case 'RoamFromPosition': return { roleName: t.roleMidRoam || 'Roam Free', roleFamily: t.roleFamilyFree || 'Free', summary: t.roleMidRoamSummary || 'Moves more freely to find the ball and affect the game.', fitWeights: { vision: 3, passing: 3, dribbling: 2, decisions: 2 } };
                    case 'PressHigher': return { roleName: t.roleMidPress || 'Press High', roleFamily: t.roleFamilyPress || 'Press', summary: t.roleMidPressSummary || 'Starts the press higher up on ball loss.', fitWeights: { stamina: 3, aggression: 2, speed: 2, tackling: 2 } };
                    case 'ShootOnSight': return { roleName: t.roleMidShoot || 'Shoot on Sight', roleFamily: t.roleFamilyFinisher || 'Finisher', summary: t.roleMidShootSummary || 'Tries long-shot opportunities more quickly.', fitWeights: { finishing: 3, decisions: 2, composure: 2, positioning: 1 } };
                    default: return generic;
                }
            case Position.FWD:
                switch (option.id) {
                    case 'Default': return { roleName: t.roleFwdBalanced || 'Balanced Forward', roleFamily: t.roleFamilyBalanced || 'Balanced', summary: t.roleFwdBalancedSummary || 'Looks for goals but stays connected to the game.', fitWeights: { finishing: 3, speed: 2, positioning: 2, composure: 2 } };
                    case 'DropDeep': return { roleName: t.roleFwdDropDeep || 'Drop Deep', roleFamily: t.roleFamilyLink || 'Link', summary: t.roleFwdDropDeepSummary || 'Drops to collect the ball and creates space for runs behind.', fitWeights: { passing: 3, vision: 2, composure: 2, finishing: 2 } };
                    case 'DefendMore': return { roleName: t.roleFwdDefend || 'Pressing Forward', roleFamily: t.roleFamilyDefense || 'Defense', summary: t.roleFwdDefendSummary || 'Starts the press high and increases defensive work.', fitWeights: { stamina: 3, aggression: 2, speed: 2, decisions: 1 } };
                    case 'ShootOnSight': return { roleName: t.roleFwdShoot || 'Poacher', roleFamily: t.roleFamilyGoal || 'Goal', summary: t.roleFwdShootSummary || 'Looks to shoot without waiting for a pass when the chance comes.', fitWeights: { finishing: 3, positioning: 3, composure: 2, speed: 1 } };
                    case 'PressHigher': return { roleName: t.roleFwdPress || 'Press High', roleFamily: t.roleFamilyPress || 'Press', summary: t.roleFwdPressSummary || 'Makes it uncomfortable for the opponent\'s defence to play out.', fitWeights: { stamina: 3, aggression: 2, speed: 2, decisions: 1 } };
                    case 'RoamFromPosition': return { roleName: t.roleFwdRoam || 'Free Forward', roleFamily: t.roleFamilyFree || 'Free', summary: t.roleFwdRoamSummary || 'Rotates to find space and touches the ball more.', fitWeights: { finishing: 2, passing: 2, dribbling: 2, composure: 2, vision: 1 } };
                    default: return generic;
                }
            default:
                return generic;
        }
    };

    const scoreRoleFit = (player: Player, weights: RoleFitWeights) => {
        const entries = Object.entries(weights) as [keyof PlayerAttributes, number][];
        if (entries.length === 0) return Math.round(player.overall || 0);
        const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
        const weightedScore = entries.reduce((sum, [key, weight]) => sum + player.attributes[key] * weight, 0) / Math.max(1, totalWeight);
        return Math.round(weightedScore);
    };

    const describeRoleFit = (player: Player, weights: RoleFitWeights) => {
        const entries = Object.entries(weights) as [keyof PlayerAttributes, number][];
        if (entries.length === 0) return `${t.overall || 'OVR'} ${player.overall}`;
        return entries
            .sort((a, b) => (player.attributes[b[0]] * b[1]) - (player.attributes[a[0]] * a[1]))
            .slice(0, 3)
            .map(([key]) => `${ATTRIBUTE_LABELS[key] || key} ${player.attributes[key]}`)
            .join(' • ');
    };

    const getRoleRecommendations = (player: Player) => {
        const options = PLAYER_INSTRUCTIONS[normalizePos(player)] || [];
        return options
            .map(option => {
                const presentation = getRolePresentation(player, option);
                return {
                    option,
                    presentation,
                    fit: scoreRoleFit(player, presentation.fitWeights),
                    reason: describeRoleFit(player, presentation.fitWeights),
                };
            })
            .sort((a, b) => {
                if (b.fit !== a.fit) return b.fit - a.fit;
                if (a.option.id === 'Default') return 1;
                if (b.option.id === 'Default') return -1;
                return a.presentation.roleName.localeCompare(b.presentation.roleName);
            })
            .slice(0, 3);
    };

    const getSlotInstruction = (lineupIndex: number): string => {
        return team.tactic.slotInstructions?.[lineupIndex] || 'Default';
    };

    const setSlotInstruction = (lineupIndex: number, instruction: string) => {
        const current = { ...(team.tactic.slotInstructions || {}) };
        if (instruction === 'Default') {
            delete current[lineupIndex];
        } else {
            current[lineupIndex] = instruction;
        }
        handleTacticChange('slotInstructions', current);
        setInstructionTarget(null);
    };

    const getInstructionIcon = (lineupIndex: number): string | null => {
        const instr = getSlotInstruction(lineupIndex);
        if (instr === 'Default') return null;
        for (const role of Object.values(PLAYER_INSTRUCTIONS)) {
            const found = role.find(r => r.id === instr);
            if (found) return found.icon;
        }
        return null;
    };

    type AttackApproach = 'PATIENT' | 'BALANCED' | 'VERTICAL' | 'FLUID';
    type FinalThirdMode = 'PATIENT' | 'BALANCED' | 'EARLY_SHOT';
    type DefenseApproach = 'LOW_BLOCK' | 'MID_BLOCK' | 'FRONT_FOOT' | 'HUNT';
    type AttackPlanMode = NonNullable<TeamTactic['attackPlan']>;

    const ATTACK_APPROACH_INSTRUCTION_IDS = ['RoamFromPosition'];
    const FINAL_THIRD_INSTRUCTION_IDS = ['WorkBallIntoBox', 'ShootOnSight'];

    const inferAttackApproach = (tactic: TeamTactic): AttackApproach => {
        const instructions = tactic.instructions || [];
        if (instructions.includes('RoamFromPosition')) return 'FLUID';
        if (tactic.style === 'Counter' || tactic.passingStyle === 'Direct' || tactic.passingStyle === 'LongBall') return 'VERTICAL';
        if (tactic.style === 'Possession' || tactic.passingStyle === 'Short' || tactic.tempo === 'Slow') return 'PATIENT';
        return 'BALANCED';
    };

    const inferFinalThirdMode = (tactic: TeamTactic): FinalThirdMode => {
        const instructions = tactic.instructions || [];
        if (instructions.includes('ShootOnSight')) return 'EARLY_SHOT';
        if (instructions.includes('WorkBallIntoBox')) return 'PATIENT';
        return 'BALANCED';
    };

    const composeInstructions = (
        baseInstructions: string[] | undefined,
        attackMode: AttackApproach,
        finalThirdMode: FinalThirdMode,
    ) => {
        const kept = (baseInstructions || []).filter(i => !ATTACK_APPROACH_INSTRUCTION_IDS.includes(i) && !FINAL_THIRD_INSTRUCTION_IDS.includes(i));
        if (attackMode === 'FLUID') kept.push('RoamFromPosition');
        if (finalThirdMode === 'PATIENT') kept.push('WorkBallIntoBox');
        if (finalThirdMode === 'EARLY_SHOT') kept.push('ShootOnSight');
        return kept;
    };

    const applyAttackApproachToTactic = (
        tactic: TeamTactic,
        mode: AttackApproach,
        finalThirdMode: FinalThirdMode = inferFinalThirdMode(tactic),
    ) => {
        const nextTactic = { ...tactic };

        if (mode === 'PATIENT') {
            nextTactic.style = 'Possession';
            nextTactic.mentality = 'Balanced';
            nextTactic.passingStyle = 'Short';
            nextTactic.tempo = 'Slow';
        } else if (mode === 'BALANCED') {
            nextTactic.style = 'Balanced';
            nextTactic.mentality = 'Balanced';
            nextTactic.passingStyle = 'Mixed';
            nextTactic.tempo = 'Normal';
        } else if (mode === 'VERTICAL') {
            nextTactic.style = 'Counter';
            nextTactic.mentality = 'Attacking';
            nextTactic.passingStyle = 'Direct';
            nextTactic.tempo = 'Fast';
        } else {
            nextTactic.style = 'Attacking';
            nextTactic.mentality = 'Attacking';
            nextTactic.passingStyle = 'Mixed';
            nextTactic.tempo = 'Normal';
        }

        nextTactic.instructions = composeInstructions(nextTactic.instructions, mode, finalThirdMode);
        return nextTactic;
    };

    const applyDefenseApproachToTactic = (tactic: TeamTactic, mode: DefenseApproach) => {
        if (mode === 'LOW_BLOCK') {
            return {
                ...tactic,
                pressingIntensity: 'StandOff' as const,
                defensiveLine: 'Deep',
            };
        }

        if (mode === 'FRONT_FOOT') {
            return {
                ...tactic,
                pressingIntensity: 'HighPress' as const,
                defensiveLine: 'Balanced',
            };
        }

        if (mode === 'HUNT') {
            return {
                ...tactic,
                pressingIntensity: 'Gegenpress' as const,
                defensiveLine: 'High',
            };
        }

        return {
            ...tactic,
            pressingIntensity: 'Balanced' as const,
            defensiveLine: 'Balanced',
        };
    };

    const setAttackInstructions = (primary: FinalThirdMode) => {
        handleTacticChange('instructions', composeInstructions(team.tactic.instructions, currentAttackApproach, primary));
    };

    const applyAttackApproach = (mode: AttackApproach) => {
        onUpdateTactic(applyAttackApproachToTactic(team.tactic, mode, currentFinalThird));
    };

    const inferDefenseApproach = (tactic: TeamTactic): DefenseApproach => {
        const press = tactic.pressingIntensity || 'Balanced';
        const line = tactic.defensiveLine || 'Balanced';

        if (press === 'Gegenpress' || (press === 'HighPress' && line === 'High')) return 'HUNT';
        if (press === 'HighPress') return 'FRONT_FOOT';
        if (press === 'StandOff' || line === 'Deep') return 'LOW_BLOCK';
        return 'MID_BLOCK';
    };

    const applyDefenseApproach = (mode: DefenseApproach) => {
        onUpdateTactic(applyDefenseApproachToTactic(team.tactic, mode));
    };

    const currentAttackApproach = inferAttackApproach(team.tactic);
    const currentFinalThird = inferFinalThirdMode(team.tactic);
    const currentDefenseApproach = inferDefenseApproach(team.tactic);
    const currentAttackPlan: AttackPlanMode = team.tactic.attackPlan || 'AUTO';
    const formationSupport = getSupportInfo(selectedEngine, 'formation', t);
    const customPositionsSupport = getSupportInfo(selectedEngine, 'customPositions', t);
    const playerInstructionsSupport = getSupportInfo(selectedEngine, 'playerInstructions', t);
    const attackApproachSupport = getSupportInfo(selectedEngine, 'attackApproach', t);
    const finalThirdSupport = getSupportInfo(selectedEngine, 'finalThird', t);
    const attackPlanSupport = getSupportInfo(selectedEngine, 'attackPlan', t);
    const widthSupport = getSupportInfo(selectedEngine, 'width', t);
    const defenseApproachSupport = getSupportInfo(selectedEngine, 'defenseApproach', t);
    const aggressionSupport = getSupportInfo(selectedEngine, 'aggression', t);
    const markingSupport = getSupportInfo(selectedEngine, 'marking', t);

    const getWidthLabel = (value?: TeamTactic['width']) => {
        if (value === 'Narrow') return t.tacticNarrow;
        if (value === 'Wide') return t.tacticWide;
        return t.tacticBalanced || 'Dengeli';
    };

    const getAttackApproachLabel = (mode: AttackApproach) => {
        if (mode === 'PATIENT') return t.attackApproachPatientLabel || 'Sabirli';
        if (mode === 'VERTICAL') return t.attackApproachVerticalLabel || 'Dikine';
        if (mode === 'FLUID') return t.attackApproachFluidLabel || 'Akiskan';
        return t.styleBalanced || 'Dengeli';
    };

    const getFinalThirdLabel = (mode: FinalThirdMode) => {
        if (mode === 'PATIENT') return t.instrWorkBall || 'Paslasarak Gir';
        if (mode === 'EARLY_SHOT') return t.instrShootSight || 'Gordugun Yerden Vur';
        return t.styleBalanced || 'Dengeli';
    };

    const getDefenseApproachLabel = (mode: DefenseApproach) => {
        if (mode === 'LOW_BLOCK') return t.defenseApproachLowBlockLabel || 'Alcak Blok';
        if (mode === 'FRONT_FOOT') return t.defenseApproachFrontFootLabel || 'Onde Karsila';
        if (mode === 'HUNT') return t.defenseApproachHuntLabel || 'Avci Pres';
        return t.defenseApproachMidBlockLabel || 'Orta Blok';
    };

    const getAttackPlanLabel = (mode: AttackPlanMode) => {
        if (mode === 'WIDE_CROSS') return t.attackPlanWideCross || 'Kanat Ortasi';
        if (mode === 'CUTBACK') return t.attackPlanCutback || 'Geri Cikar';
        if (mode === 'THIRD_MAN') return t.attackPlanThirdMan || 'Ucuncu Adam';
        if (mode === 'DIRECT_CHANNEL') return t.attackPlanDirectChannel || 'Kanal Kosusu';
        return t.attackPlanAuto || 'Otomatik';
    };

    const getAttackPlanInsight = (mode: AttackPlanMode) => {
        const base = mode === 'WIDE_CROSS'
            ? (t.attackPlanWideCrossDesc || 'Kanatta sabitlenir, ceza sahasina kosu ve orta arar.')
            : mode === 'CUTBACK'
                ? (t.attackPlanCutbackDesc || 'Cizgiye inip yerden merkeze cevirir, ikinci kosuyu arar.')
                : mode === 'THIRD_MAN'
                    ? (t.attackPlanThirdManDesc || 'Iki pasla ucuncu oyuncuyu bos cebe sokmaya calisir.')
                    : mode === 'DIRECT_CHANNEL'
                        ? (t.attackPlanDirectChannelDesc || 'Savunma arkasi kanal kosusunu erken arar.')
                        : (t.attackPlanAutoDesc || 'Topun yeri ve oyuncu dizilimine gore plan secer.');

        if (selectedEngine !== 'ucuncu') {
            const adapterNote = mode === 'WIDE_CROSS'
                ? (t.attackPlanAdapterWideCross || 'In this engine, converted mainly to early cross behaviour.')
                : mode === 'CUTBACK'
                    ? (t.attackPlanAdapterCutback || 'In this engine, converted to patient entry into the box.')
                    : mode === 'THIRD_MAN'
                        ? (t.attackPlanAdapterThirdMan || 'In this engine, approximated via WorkBallIntoBox and RoamFromPosition.')
                        : mode === 'DIRECT_CHANNEL'
                            ? (t.attackPlanAdapterDirect || 'In this engine, converted to direct passing and forward run tendencies.')
                            : (t.attackPlanAdapterAuto || 'In this engine, the closest available base behaviour is applied based on the situation.');
            return `${base} ${adapterNote}`;
        }

        return base;
    };

    const setAttackPlanMode = (mode: AttackPlanMode) => {
        handleTacticChange('attackPlan', mode);
    };

    const attackPlanOptions: Array<{ value: AttackPlanMode; label: string; desc: string }> = [
        { value: 'AUTO', label: getAttackPlanLabel('AUTO'), desc: getAttackPlanInsight('AUTO') },
        { value: 'WIDE_CROSS', label: getAttackPlanLabel('WIDE_CROSS'), desc: getAttackPlanInsight('WIDE_CROSS') },
        { value: 'CUTBACK', label: getAttackPlanLabel('CUTBACK'), desc: getAttackPlanInsight('CUTBACK') },
        { value: 'THIRD_MAN', label: getAttackPlanLabel('THIRD_MAN'), desc: getAttackPlanInsight('THIRD_MAN') },
        { value: 'DIRECT_CHANNEL', label: getAttackPlanLabel('DIRECT_CHANNEL'), desc: getAttackPlanInsight('DIRECT_CHANNEL') },
    ];

    const getAggressionLabel = (value?: TeamTactic['aggression']) => {
        if (value === 'Safe') return t.safe;
        if (value === 'Aggressive') return t.aggressive;
        if (value === 'Reckless') return t.reckless;
        return t.normal || 'Normal';
    };

    const getMarkingLabel = (value?: TeamTactic['marking']) => value === 'Man' ? (t.markingMan || 'Adam Adama') : (t.markingZonal || 'Alan Savunmasi');

    type RecommendedPlan = {
        attack: AttackApproach;
        finalThird: FinalThirdMode;
        width: TeamTactic['width'];
        defense: DefenseApproach;
    };

    const averageScore = (group: Player[], extractor: (player: Player) => number) => {
        if (group.length === 0) return 50;
        return group.reduce((sum, player) => sum + extractor(player), 0) / group.length;
    };

    const availablePlayers = players.filter(player => player.weeksInjured <= 0 && player.matchSuspension <= 0);
    const availableDefs = availablePlayers.filter(player => normalizePos(player) === Position.DEF);
    const availableMids = availablePlayers.filter(player => normalizePos(player) === Position.MID);
    const availableFwds = availablePlayers.filter(player => normalizePos(player) === Position.FWD);
    const availableOutfield = availablePlayers.filter(player => normalizePos(player) !== Position.GK);

    const squadProfile = {
        speed: averageScore([...availableMids, ...availableFwds], player => (player.attributes.speed + player.attributes.dribbling) / 2),
        control: averageScore([...availableDefs, ...availableMids], player => (player.attributes.passing + player.attributes.vision + player.attributes.composure + player.attributes.decisions) / 4),
        aerial: averageScore([...availableDefs, ...availableFwds], player => (player.attributes.strength + player.attributes.positioning + player.attributes.finishing) / 3),
        press: averageScore(availableOutfield, player => (player.attributes.stamina + player.attributes.tackling + player.attributes.aggression) / 3),
        solidity: averageScore([...availableDefs, ...availableMids], player => (player.attributes.tackling + player.attributes.positioning + player.attributes.strength) / 3),
        creativity: averageScore([...availableMids, ...availableFwds], player => (player.attributes.passing + player.attributes.vision + player.attributes.dribbling) / 3),
        width: averageScore([...availableDefs, ...availableMids, ...availableFwds], player => (player.attributes.speed + player.attributes.stamina + player.attributes.dribbling) / 3),
        strikerDepth: availableFwds.length,
        midfieldDepth: availableMids.length,
        defenseDepth: availableDefs.length,
    };

    const getProfileLabel = (key: 'speed' | 'control' | 'aerial' | 'press' | 'solidity' | 'creativity') => {
        const map = {
            speed: t.dynamicStrengthSpeed || 'hizli gecis',
            control: t.dynamicStrengthControl || 'pas ve kontrol',
            aerial: t.dynamicStrengthAerial || 'hava ve fizik',
            press: t.dynamicStrengthPress || 'pres enerjisi',
            solidity: t.dynamicStrengthSolidity || 'savunma guvenligi',
            creativity: t.dynamicStrengthCreativity || 'yaratici merkez',
        };
        return map[key];
    };

    const strengths: Array<['speed' | 'control' | 'aerial' | 'press' | 'solidity' | 'creativity', number]> = [
        ['speed', squadProfile.speed],
        ['control', squadProfile.control],
        ['aerial', squadProfile.aerial],
        ['press', squadProfile.press],
        ['solidity', squadProfile.solidity],
        ['creativity', squadProfile.creativity],
    ];

    const rankedStrengths = strengths
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([key]) => getProfileLabel(key));

    const tacticalRisks: string[] = [];
    if (['4-4-2', '3-5-2', '5-3-2', '4-1-2-1-2'].includes(team.tactic.formation) && squadProfile.strikerDepth < 2) {
        tacticalRisks.push(t.dynamicRiskStrikerDepth || 'Bu dizilis icin yeterli ikinci forvet derinligi yok.');
    }
    if (['3-5-2', '3-4-3'].includes(team.tactic.formation) && squadProfile.solidity < 68) {
        tacticalRisks.push(t.dynamicRiskBackThree || 'Uc stoperli yapi icin savunma guvenligi sinirda kalabilir.');
    }
    if ((currentDefenseApproach === 'HUNT' || currentDefenseApproach === 'FRONT_FOOT') && squadProfile.press < 68) {
        tacticalRisks.push(t.dynamicRiskPress || 'Bu kadro cok agresif presi 90 dakikaya yaymakta zorlanabilir.');
    }
    if (['4-3-3', '3-4-3', '5-4-1', '5-3-2'].includes(team.tactic.formation) && squadProfile.width < 68) {
        tacticalRisks.push(t.dynamicRiskWidth || 'Dogal genislik ve cizgi kosusu tehdidi sinirli olabilir.');
    }

    const buildPlan = (attack: AttackApproach, finalThird: FinalThirdMode, width: TeamTactic['width'], defense: DefenseApproach): RecommendedPlan => ({
        attack,
        finalThird,
        width,
        defense,
    });

    const getBaseFormationNote = (formation: TacticType) => {
        const notes: Record<TacticType, string> = {
            [TacticType.T_442]: t.dynamicFormationNote442 || 'Iki forvetli klasik yapi; gecis ve ceza sahasi varligi ile guclenir.',
            [TacticType.T_433]: t.dynamicFormationNote433 || 'Kanat genisligi ve uc onlu hareketiyle rakibi yatay acmaya uygundur.',
            [TacticType.T_352]: t.dynamicFormationNote352 || 'Merkez ustunlugu kurar; kanat yukunu orta saha kosulari ve bekler tasir.',
            [TacticType.T_541]: t.dynamicFormationNote541 || 'Derin savunma ve tek cikis forvetiyle skor koruma ile kontra oyunu sever.',
            [TacticType.T_451]: t.dynamicFormationNote451 || 'Orta sahayi kalabalik tutar, sabirli ve kompakt oyun icin guvenli bir iskelet sunar.',
            [TacticType.T_4231]: t.dynamicFormationNote4231 || '10 numara ve cift pivot dengesini en rahat kuran sistemlerden biridir.',
            [TacticType.T_343]: t.dynamicFormationNote343 || 'Uc forvetli baski ve genis kanat tehdidi icin agresif bir secenektir.',
            [TacticType.T_4141]: t.dynamicFormationNote4141 || 'Tek cipa ile merkezi kilitler, ondeki dortluya ikinci dalga kosulari verir.',
            [TacticType.T_532]: t.dynamicFormationNote532 || 'Uc stoper guvenligi ile iki forvet cikisini birlestirir; gecis oyunu dogal oturur.',
            [TacticType.T_41212]: t.dynamicFormationNote41212 || 'Dar elmas merkezde kombinasyon kurar; beklerin verdigi genislik cok degerlidir.',
            [TacticType.T_4321]: t.dynamicFormationNote4321 || 'Yarim alan oyunculari ve tek santrfor uzerinden ic koridor oyunu kurar.',
        };
        return notes[formation];
    };

    const getRecommendedSquadPlan = (formation: TacticType): RecommendedPlan => {
        const hasTechnicalCore = squadProfile.control >= 74 && squadProfile.creativity >= 72;
        const hasTransitionThreat = squadProfile.speed >= 72 && squadProfile.strikerDepth >= 2;
        const hasAerialPresence = squadProfile.aerial >= 73 && squadProfile.strikerDepth >= 2;
        const hasPressProfile = squadProfile.press >= 72 && squadProfile.solidity >= 70;

        switch (formation) {
            case TacticType.T_442:
                if (hasTransitionThreat) return buildPlan('VERTICAL', 'BALANCED', 'Wide', 'FRONT_FOOT');
                if (hasTechnicalCore) return buildPlan('BALANCED', 'PATIENT', 'Balanced', 'MID_BLOCK');
                if (hasAerialPresence) return buildPlan('VERTICAL', 'BALANCED', 'Balanced', 'MID_BLOCK');
                return buildPlan('BALANCED', 'BALANCED', 'Balanced', 'MID_BLOCK');
            case TacticType.T_541:
                if (squadProfile.speed >= 72) return buildPlan('VERTICAL', 'BALANCED', 'Balanced', 'LOW_BLOCK');
                if (hasTechnicalCore) return buildPlan('PATIENT', 'PATIENT', 'Narrow', 'MID_BLOCK');
                return buildPlan('BALANCED', 'PATIENT', 'Narrow', 'LOW_BLOCK');
            case TacticType.T_451:
                if (hasTechnicalCore) return buildPlan('PATIENT', 'PATIENT', 'Balanced', 'MID_BLOCK');
                if (hasPressProfile) return buildPlan('BALANCED', 'BALANCED', 'Narrow', 'FRONT_FOOT');
                return buildPlan('BALANCED', 'BALANCED', 'Balanced', 'MID_BLOCK');
            case TacticType.T_343:
                if (squadProfile.speed >= 72 && squadProfile.strikerDepth >= 3) return buildPlan('VERTICAL', 'BALANCED', 'Wide', 'FRONT_FOOT');
                if (hasTechnicalCore) return buildPlan('FLUID', 'PATIENT', 'Wide', 'FRONT_FOOT');
                return buildPlan('BALANCED', 'BALANCED', 'Wide', 'FRONT_FOOT');
            case TacticType.T_4141:
                if (hasTechnicalCore) return buildPlan('PATIENT', 'PATIENT', 'Balanced', 'MID_BLOCK');
                if (hasPressProfile) return buildPlan('BALANCED', 'BALANCED', 'Balanced', 'FRONT_FOOT');
                return buildPlan('BALANCED', 'BALANCED', 'Narrow', 'MID_BLOCK');
            case TacticType.T_532:
                if (hasTransitionThreat) return buildPlan('VERTICAL', 'BALANCED', 'Wide', 'MID_BLOCK');
                if (hasAerialPresence) return buildPlan('VERTICAL', 'PATIENT', 'Balanced', 'MID_BLOCK');
                return buildPlan('BALANCED', 'BALANCED', 'Balanced', 'MID_BLOCK');
            case TacticType.T_41212:
                if (hasTechnicalCore) return buildPlan('PATIENT', 'PATIENT', 'Narrow', 'FRONT_FOOT');
                if (hasTransitionThreat) return buildPlan('VERTICAL', 'BALANCED', 'Narrow', 'MID_BLOCK');
                return buildPlan('BALANCED', 'BALANCED', 'Narrow', 'MID_BLOCK');
            case TacticType.T_4321:
                if (hasTechnicalCore) return buildPlan('PATIENT', 'PATIENT', 'Narrow', 'MID_BLOCK');
                if (squadProfile.speed >= 72) return buildPlan('VERTICAL', 'BALANCED', 'Balanced', 'FRONT_FOOT');
                return buildPlan('BALANCED', 'BALANCED', 'Narrow', 'MID_BLOCK');
            case TacticType.T_433:
                if (squadProfile.speed >= 72 && squadProfile.width >= 70) return buildPlan('VERTICAL', 'BALANCED', 'Wide', 'FRONT_FOOT');
                if (hasTechnicalCore) return buildPlan('PATIENT', 'PATIENT', 'Wide', 'MID_BLOCK');
                return buildPlan('BALANCED', 'BALANCED', 'Wide', 'MID_BLOCK');
            case TacticType.T_4231:
                if (hasTechnicalCore) return buildPlan('BALANCED', 'PATIENT', 'Balanced', 'MID_BLOCK');
                if (squadProfile.speed >= 72) return buildPlan('VERTICAL', 'BALANCED', 'Wide', 'FRONT_FOOT');
                return buildPlan('BALANCED', 'BALANCED', 'Balanced', 'MID_BLOCK');
            case TacticType.T_352:
                if (hasTransitionThreat) return buildPlan('VERTICAL', 'BALANCED', 'Wide', 'FRONT_FOOT');
                if (hasTechnicalCore) return buildPlan('BALANCED', 'PATIENT', 'Balanced', 'MID_BLOCK');
                return buildPlan('BALANCED', 'BALANCED', 'Balanced', 'MID_BLOCK');
            default:
                return buildPlan('BALANCED', 'BALANCED', 'Balanced', 'MID_BLOCK');
        }
    };

    const adjustPlanForOpponent = (basePlan: RecommendedPlan) => {
        if (!opponent || !opponentSummary) {
            return {
                plan: basePlan,
                note: t.dynamicOpponentNone || 'Rakip secili degil; bu oneriler yalnizca kendi kadro profilinden cikarildi.',
            };
        }

        const adjusted = { ...basePlan };
        let note = t.dynamicOpponentBalanced || 'Rakip net bir asirilik gostermiyor; kendi guc profiline yaslanabilirsin.';

        if (opponentSummary.defenseApproach === 'LOW_BLOCK') {
            adjusted.width = 'Wide';
            adjusted.finalThird = 'PATIENT';
            if (adjusted.attack === 'VERTICAL') adjusted.attack = 'BALANCED';
            note = t.dynamicOpponentLowBlock || 'Derin blok rakibe karsi sabir ve genislik daha cok is yapar; zorlama sut yerine bos adami ara.';
        } else if (opponentSummary.defenseApproach === 'HUNT' || opponent.tactic.pressingIntensity === 'HighPress' || opponent.tactic.pressingIntensity === 'Gegenpress') {
            adjusted.attack = 'VERTICAL';
            adjusted.finalThird = 'BALANCED';
            if (adjusted.defense === 'LOW_BLOCK') adjusted.defense = 'MID_BLOCK';
            note = t.dynamicOpponentHighPress || 'Yuksek prese karsi ilk baskiyi tek pasla veya daha dikine cikislarla kirman gerekir.';
        } else if ([TacticType.T_343, TacticType.T_352, TacticType.T_532].includes(opponent.tactic.formation as TacticType)) {
            adjusted.width = 'Wide';
            note = t.dynamicOpponentBackThree || 'Uc stoperli rakibe karsi kanatlari ve bek arkasi alanlari zorlamak daha dogrudur.';
        } else if (opponent.tactic.width === 'Wide' || opponentSummary.attackApproach === 'FLUID') {
            adjusted.width = 'Narrow';
            adjusted.defense = adjusted.defense === 'HUNT' ? 'FRONT_FOOT' : 'MID_BLOCK';
            note = t.dynamicOpponentWide || 'Genis veya akiskan rakibe karsi merkezi koru; kendi blok boyunu gereksiz yere acma.';
        } else if (opponentSummary.finalThird === 'EARLY_SHOT') {
            adjusted.defense = adjusted.defense === 'HUNT' ? 'FRONT_FOOT' : 'MID_BLOCK';
            note = t.dynamicOpponentEarlyShot || 'Erken vuran rakibe karsi ceza yayi onunu kapatip ikinci topu toplamak daha onemli hale gelir.';
        }

        return { plan: adjusted, note };
    };

    const formatPlan = (plan: RecommendedPlan) => [
        getAttackApproachLabel(plan.attack),
        getFinalThirdLabel(plan.finalThird),
        getWidthLabel(plan.width),
        getDefenseApproachLabel(plan.defense),
    ].join(' + ');

    const attackApproachOptions: { value: AttackApproach; label: string; desc: string }[] = [
        { value: 'PATIENT', label: getAttackApproachLabel('PATIENT'), desc: t.attackApproachPatientDesc || 'Kisa pas, sakin kurulum' },
        { value: 'BALANCED', label: getAttackApproachLabel('BALANCED'), desc: t.attackApproachBalancedDesc || 'Ne pasi ne sutu zorlar' },
        { value: 'VERTICAL', label: getAttackApproachLabel('VERTICAL'), desc: t.attackApproachVerticalDesc || 'Hizli ve direkt cikar' },
        { value: 'FLUID', label: getAttackApproachLabel('FLUID'), desc: t.attackApproachFluidDesc || 'Yer degistirir, hareketli hucum' }
    ];

    const finalThirdOptions: { value: FinalThirdMode; label: string; desc: string }[] = [
        { value: 'PATIENT', label: getFinalThirdLabel('PATIENT'), desc: t.finalThirdPatientDesc || 'Dis sut azalt, net bosluk ara' },
        { value: 'BALANCED', label: getFinalThirdLabel('BALANCED'), desc: t.finalThirdBalancedDesc || 'Oyuncu firsata gore karar versin' },
        { value: 'EARLY_SHOT', label: getFinalThirdLabel('EARLY_SHOT'), desc: t.finalThirdEarlyShotDesc || 'Erken bitir, kaleyi daha cok yokla' }
    ];

    const defenseApproachOptions: { value: DefenseApproach; label: string; desc: string }[] = [
        { value: 'LOW_BLOCK', label: getDefenseApproachLabel('LOW_BLOCK'), desc: t.defenseApproachLowBlockDesc || 'Geri cekil, ceza sahasini kapat' },
        { value: 'MID_BLOCK', label: getDefenseApproachLabel('MID_BLOCK'), desc: t.defenseApproachMidBlockDesc || 'Hatlar kompakt kalsin' },
        { value: 'FRONT_FOOT', label: getDefenseApproachLabel('FRONT_FOOT'), desc: t.defenseApproachFrontFootDesc || 'Topa cikar, rakibi bozar' },
        { value: 'HUNT', label: getDefenseApproachLabel('HUNT'), desc: t.defenseApproachHuntDesc || 'Aninda baski ve yuksek hat' }
    ];

    const getAttackApproachInsight = (mode: AttackApproach) => {
        if (mode === 'PATIENT') {
            return {
                motor: selectedEngine === 'ucuncu'
                    ? (t.insightAttackPatientPro || 'The Pro engine integrates this with the plan layer: short pass + low tempo + possession logic.')
                    : (t.insightAttackPatientOther || 'This engine translates this into short pass + low tempo + possession settings.'),
                preview: t.insightAttackPatientPreview || 'Expect closer passing options, fewer forced shots, and a calmer buildup on the pitch.'
            };
        }
        if (mode === 'VERTICAL') {
            return {
                motor: selectedEngine === 'ucuncu'
                    ? (t.insightAttackVerticalPro || 'The Pro engine combines this with direct pass + high tempo + channel runs and transition threat.')
                    : (t.insightAttackVerticalOther || 'This engine translates this into direct pass + high tempo + counter intent.'),
                preview: t.insightAttackVerticalPreview || 'Expect earlier vertical passes, runs in behind, and fast transitions on the pitch.'
            };
        }
        if (mode === 'FLUID') {
            return {
                motor: selectedEngine === 'ucuncu'
                    ? (t.insightAttackFluidPro || 'The Pro engine processes this with freer movement + more attacking risk + plan support runs.')
                    : (t.insightAttackFluidOther || 'This engine translates this into freer movement + higher attacking risk profile.'),
                preview: t.insightAttackFluidPreview || 'Expect positional rotations, surprise runs, and freer decisions on the pitch.'
            };
        }
        return {
            motor: selectedEngine === 'ucuncu'
                ? (t.insightAttackBalancedPro || 'The Pro engine applies this with balanced pass + normal tempo + plan selection as needed.')
                : (t.insightAttackBalancedOther || 'This engine translates this into mixed pass + normal tempo + balanced risk profile.'),
            preview: t.insightAttackBalancedPreview || 'Expect more balanced decisions between pass, shot and dribble based on player quality.'
        };
    };

    const getFinalThirdInsight = (mode: FinalThirdMode) => {
        if (mode === 'PATIENT') return t.insightFinalThirdPatient || 'Reduces low-quality shots from outside the box; looks for the free man and the killer pass more.';
        if (mode === 'EARLY_SHOT') return t.insightFinalThirdEarlyShot || 'Tests the keeper sooner; with good shooters, attempts from 24-32m increase.';
        return t.insightFinalThirdBalanced || "Leaves the final decision more to the player's angle, space and ability combination.";
    };

    const getWidthInsight = (value?: TeamTactic['width']) => {
        if (value === 'Wide') return t.insightWidthWide || 'Wide players stretch further to the touchline; byline runs, crosses, and wide dribbles increase.';
        if (value === 'Narrow') return t.insightWidthNarrow || 'Central connections, short passes and inner corridor use increase; play becomes tighter but more compact.';
        return t.insightWidthAuto || 'Neither too wide nor needlessly crowded centrally; this is the safest middle ground.';
    };

    const getDefenseApproachInsight = (mode: DefenseApproach) => {
        if (mode === 'LOW_BLOCK') return t.insightDefenseLowBlock || 'The team sits deep, fewer players press, and they focus on blocking the area in front of the box.';
        if (mode === 'FRONT_FOOT') return t.insightDefenseFrontFoot || "Meets the opponent higher, defends further up than mid-block, but doesn't gamble fully.";
        if (mode === 'HUNT') return t.insightDefenseHunt || 'The most aggressive option: more pressers, higher line, and immediate pressure on ball loss.';
        return t.insightDefenseMidBlock || "Lines stay compact; the team neither fully retreats nor gets caught needlessly high.";
    };

    const getAggressionInsight = (value?: TeamTactic['aggression']) => {
        if (value === 'Safe') return t.insightAggressionSafe || 'Softer in duels; fouls and cards decrease but clean ball recoveries also drop.';
        if (value === 'Aggressive') return t.insightAggressionAggressive || 'Goes in harder for the ball; ball recoveries increase in physical teams but so can fouls.';
        if (value === 'Reckless') return t.insightAggressionReckless || 'Last resort; tackle hardness is at its highest but card and foul risk grows significantly.';
        return t.insightAggressionAuto || 'Neither too soft nor needlessly hard; the most balanced tackle profile.';
    };

    const getMarkingInsight = (value?: TeamTactic['marking']) => {
        if (value === 'Man') {
            return selectedEngine === 'ucuncu'
                ? (t.insightMarkingManPro || 'Defender sticks to the nearby threat; one-on-one contact increases but shape can break more easily.')
                : (t.insightMarkingManOther || 'Defender shadows the nearby threat more closely; works but not as deep or contextual as in the Pro engine.');
        }
        return selectedEngine === 'ucuncu'
            ? (t.insightMarkingZonalPro || 'Players guard the zone, not the man; line stays compact and the sense of blocking pass corridors increases.')
            : (t.insightMarkingZonalOther || 'Players guard the zone more; this selection produces a more basic shape-protection effect in Classic and Arcade engines.');
    };

    const comboWarnings: string[] = [];
    if (currentAttackApproach === 'PATIENT' && currentFinalThird === 'EARLY_SHOT') {
        comboWarnings.push(t.comboWarnPatientEarlyShot || 'Patient buildup clashes with Early Shot: one wants to wait, the other wants to shoot on sight.');
    }
    if (currentAttackApproach === 'FLUID' && team.tactic.marking === 'Man' && team.tactic.aggression === 'Reckless') {
        comboWarnings.push(t.comboWarnFluidManReckless || 'Fluid + Man Marking + Reckless breaks shape and significantly raises card risk.');
    }
    if (currentDefenseApproach === 'LOW_BLOCK' && team.tactic.width === 'Wide') {
        comboWarnings.push(t.comboWarnLowBlockWide || 'Low Block + Wide width can open defensive shape horizontally too much; collecting second balls becomes harder.');
    }

    const describeTactic = (tactic: TeamTactic) => {
        const preset = detectPreset(tactic);
        return {
            preset: preset === 'Custom' ? null : preset,
            attackApproach: inferAttackApproach(tactic),
            finalThird: inferFinalThirdMode(tactic),
            defenseApproach: inferDefenseApproach(tactic),
        };
    };

    const struct = getFormationStructure(team.tactic.formation);
    const visuals: { p: Player, presetRole: Position, idx: number, total: number }[] = [];
    const opponentSummary = opponent ? describeTactic(opponent.tactic) : null;
    const recommendedSquadPlan = getRecommendedSquadPlan(team.tactic.formation);
    const opponentAdjustedPlan = adjustPlanForOpponent(recommendedSquadPlan);
    const hasOpponentPlanShift = formatPlan(recommendedSquadPlan) !== formatPlan(opponentAdjustedPlan.plan);

    // Tactic board must follow exact lineup slots (lineupIndex 0..10)
    // so what user sees here matches live match board one-to-one.
    const pitchOrderedStarters = [...starters].sort((a, b) => (a.lineupIndex || 0) - (b.lineupIndex || 0));

    let playerCursor = 0;
    if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.GK, idx: 0, total: 1 });
    for (let i = 0; i < struct.DEF; i++) if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.DEF, idx: i, total: struct.DEF });
    for (let i = 0; i < struct.MID; i++) if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.MID, idx: i, total: struct.MID });
    for (let i = 0; i < struct.FWD; i++) if (playerCursor < pitchOrderedStarters.length) visuals.push({ p: pitchOrderedStarters[playerCursor++], presetRole: Position.FWD, idx: i, total: struct.FWD });

    const assignedRoleMap: Record<string, Position> = {};
    const hasIssues = advice.some(a => a.type === 'CRITICAL' || a.type === 'WARNING');
    const currentPressingLabel = team.tactic.pressingIntensity === 'StandOff'
        ? t.pressStandOff
        : team.tactic.pressingIntensity === 'HighPress'
            ? t.pressHigh
            : team.tactic.pressingIntensity === 'Gegenpress'
                ? t.pressGegen
                : t.pressBalanced || 'Dengeli';
    const currentDefensiveLineLabel = team.tactic.defensiveLine === 'Deep'
        ? t.tacticDeep
        : team.tactic.defensiveLine === 'High'
            ? t.tacticHigh
            : t.tacticBalanced || 'Dengeli';
    const currentMentalityLabel = team.tactic.mentality || t.styleBalanced || 'Dengeli';
    const activeDutySummary = pitchOrderedStarters
        .map(player => {
            const instructionId = getSlotInstruction(player.lineupIndex || 0);
            if (instructionId === 'Default') return null;
            const instructionMeta = getInstructionOption(normalizePos(player), instructionId);
            if (!instructionMeta) return null;
            const rolePresentation = getRolePresentation(player, instructionMeta);
            return {
                player,
                instructionId,
                label: rolePresentation.roleName,
                icon: instructionMeta.icon,
                duty: instructionMeta.duty,
                shortLabel: instructionMeta.shortLabel || instructionMeta.duty,
                engineLabel: instructionMeta.label,
            };
        })
        .filter((entry): entry is { player: Player; instructionId: string; label: string; icon: string; duty: string; shortLabel: string; engineLabel: string } => !!entry);
    const tacticalNotebookCards = [
        {
            key: 'with-ball',
            eyebrow: t.attack || 'Hucum',
            title: `${getAttackApproachLabel(currentAttackApproach)} / ${getFinalThirdLabel(currentFinalThird)}`,
            accent: 'text-emerald-300',
            border: 'border-emerald-700/40',
            body: `${getAttackPlanLabel(currentAttackPlan)} • ${getWidthLabel(team.tactic.width)} ${t.width || 'genislik'}`,
            foot: getAttackApproachInsight(currentAttackApproach).preview,
        },
        {
            key: 'without-ball',
            eyebrow: t.defense || 'Savunma',
            title: `${getDefenseApproachLabel(currentDefenseApproach)} / ${currentPressingLabel}`,
            accent: 'text-red-300',
            border: 'border-red-700/40',
            body: `${getMarkingLabel(team.tactic.marking)} • ${currentDefensiveLineLabel} ${t.defensiveLine || 'hat'}`,
            foot: getDefenseApproachInsight(currentDefenseApproach),
        },
        {
            key: 'transition',
            eyebrow: t.engineMappingTitle || 'Oyun modeli',
            title: `${currentMentalityLabel} / ${team.tactic.tempo || 'Normal'} ${t.tempo || 'tempo'}`,
            accent: 'text-cyan-300',
            border: 'border-cyan-700/40',
            body: `${getAggressionLabel(team.tactic.aggression)} mudahale • ${team.tactic.formation}`,
            foot: activeDutySummary.length > 0
                ? (t.instrActiveCountMsg || '{count} players with individual duties.').replace('{count}', String(activeDutySummary.length))
                : (t.instrAllDefault || 'All players are on default duties.'),
        },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-10" onMouseUp={handlePitchMouseUp} onTouchEnd={handlePitchMouseUp}>

            {/* AssistantReport removed - replaced by inline opponent tactical panel */}
            {interactingPlayer && <PlayerInteractionModal player={interactingPlayer} onClose={() => setInteractingPlayer(null)} onInteract={handleInteract} t={t} />}

            {/* OPPONENT TACTIC PANEL - Only show during match */}
            {opponent && matchStatus && (
                <div className="lg:col-span-3 bg-gradient-to-r from-red-900/30 to-slate-800/50 rounded-xl p-2 border border-red-700/30 mb-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="text-red-400" size={14} />
                        <span className="font-bold text-red-400 text-xs">{t.opponentAnalysis || 'Rakip Analizi'}: {opponent.name}</span>
                    </div>

                    {/* Opponent Tactic Grid - Horizontal Scroll on Mobile */}
                    <div className="overflow-x-auto pb-1 -mx-1 px-1">
                        <div className="flex gap-1.5 min-w-max">
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[60px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.formation || 'Diziliş'}</div>
                                <div className="text-blue-400 font-mono font-bold text-xs">{opponent.tactic?.formation || '4-4-2'}</div>
                            </div>
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[60px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.preset || 'Preset'}</div>
                                <div className="text-purple-400 font-bold text-[10px]">
                                    {opponentSummary?.preset || t.custom || 'Custom'}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[60px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.attack || 'Attack'}</div>
                                <div className="text-cyan-400 font-bold text-[10px]">{getAttackApproachLabel(opponentSummary?.attackApproach || 'BALANCED')}</div>
                            </div>
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[68px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.finalThirdLabel || 'Final Third'}</div>
                                <div className="text-yellow-400 font-bold text-[10px]">{getFinalThirdLabel(opponentSummary?.finalThird || 'BALANCED')}</div>
                            </div>
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[60px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.width || 'Genişlik'}</div>
                                <div className="text-emerald-400 font-bold text-[10px]">
                                    {getWidthLabel(opponent.tactic?.width)}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[60px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.aggression || 'Agresif'}</div>
                                <div className="text-orange-400 font-bold text-[10px]">
                                    {getAggressionLabel(opponent.tactic?.aggression)}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[68px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.defense || 'Defense'}</div>
                                <div className="text-red-400 font-bold text-[10px]">
                                    {getDefenseApproachLabel(opponentSummary?.defenseApproach || 'MID_BLOCK')}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 px-2 py-1.5 rounded text-center min-w-[60px]">
                                <div className="text-[8px] text-slate-500 uppercase">{t.marking || 'Marking'}</div>
                                <div className="text-blue-300 font-bold text-[10px]">{getMarkingLabel(opponent.tactic?.marking)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Counter Tactic Suggestion */}
                    {(() => {
                        const oppStyle = opponent.tactic?.style || 'Balanced';
                        const oppPressing = opponent.tactic?.pressingIntensity || 'Balanced';
                        const oppApproach = opponentSummary?.attackApproach || 'BALANCED';
                        const oppFinalThird = opponentSummary?.finalThird || 'BALANCED';
                        let suggestion = '';
                        let suggestionIcon = '💡';

                        if (oppPressing === 'Gegenpress' || oppPressing === 'HighPress') {
                            suggestion = t.counterHighPress || 'Tehlike: Şok pres altındayız. Topu ayakta çok tutma (Tempo = Hızlı). Defans arkasındaki boşluklara "Uzun/Direkt Pas" ile sız!';
                            suggestionIcon = '🚀';
                        } else if (oppApproach === 'PATIENT' || oppStyle === 'Possession') {
                            suggestion = t.counterPossession || 'Rakip topu vermiyor. Gegenpress ile boğ ya da tam tersi Derin Defans ("Geride Karşıla") ile sahanı kapat ve Kontraya çık.';
                            suggestionIcon = '⚡';
                        } else if (oppApproach === 'VERTICAL' || oppStyle === 'Counter' || oppStyle === 'FluidCounter') {
                            suggestion = t.counterCounter || 'Kontra arıyorlar. Savunma hattını çok öne ("High") çıkarma. "Temkinli" veya "Normal" agresiflikte kalarak kanatlara dikkat et.';
                            suggestionIcon = '🎯';
                        } else if (oppStyle === 'Defensive' || oppStyle === 'ParkTheBus' || oppStyle === 'Catenaccio') {
                            suggestion = t.counterDefensive || 'Otobüs çekiyorlar. Kesinlikle "Geniş" oyna, stoperleri iki yana aç. "Tempo" düşür, bıkmadan "Paslaşarak Gir" aramalıyız.';
                            suggestionIcon = '🔓';
                        } else if (oppApproach === 'FLUID' || oppStyle === 'Attacking' || oppStyle === 'TotalFootball') {
                            suggestion = t.counterAttacking || 'Aşırı hücuma kalkıyorlar. Savunma arkasında dev boşluklar var. "Kontra" veya "Kanat Oyunu" ile arkaya uzun at, deparlı forvetler lazım! ';
                            suggestionIcon = '🔥';
                        } else if (oppFinalThird === 'EARLY_SHOT') {
                            suggestion = t.counterEarlyShot || 'Kaleyi gorur gormez yokluyorlar. Ceza yayini kapat, sut koridorunu daralt ve ikinci toplari topla.';
                            suggestionIcon = '🧱';
                        } else {
                            suggestion = t.counterBalanced || 'Taktikleri dengeli. Orta sahadaki ikili mücadeleleri kazanan fişi çeker. Takımın yıldızlarına dayalı standart oyununu oyna.';
                            suggestionIcon = '⚖️';
                        }

                        return (
                            <div className="bg-emerald-900/30 border border-emerald-600/30 rounded px-2 py-1.5 flex items-start gap-2 mt-2">
                                <span className="text-sm shrink-0">{suggestionIcon}</span>
                                <div>
                                    <div className="text-[9px] text-emerald-500 font-bold uppercase">{t.counterTactic || 'Counter Taktik'}</div>
                                    <div className="text-emerald-200 text-[10px]">{suggestion}</div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-800 rounded-lg p-3 shadow-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2"><Shield size={16} className="text-emerald-500" /> {t.tactics}</h2>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={handleAutoPick}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-all"
                            >
                                <Wand2 size={10} /> {t.auto}
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-slate-900 rounded p-1 mb-2">
                        <button onClick={() => setTacticTab('PRESETS')} className={`flex-1 text-[10px] py-1.5 rounded font-bold transition-all ${tacticTab === 'PRESETS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>{t.presetTitle || 'Presets'}</button>
                        <button onClick={() => setTacticTab('FORMATION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold transition-all ${tacticTab === 'FORMATION' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>{t.base}</button>
                        <button onClick={() => setTacticTab('IN_POSSESSION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold transition-all ${tacticTab === 'IN_POSSESSION' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>{t.attack}</button>
                        <button onClick={() => setTacticTab('OUT_POSSESSION')} className={`flex-1 text-[10px] py-1.5 rounded font-bold transition-all ${tacticTab === 'OUT_POSSESSION' ? 'bg-red-900 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>{t.defense}</button>
                    </div>

                    <div className="space-y-2 min-h-[80px]">
                        {tacticTab === 'PRESETS' && (
                            <div className="space-y-2 h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                <div className="text-[10px] text-slate-400 mb-2 italic">
                                    {t.presetDesc}
                                </div>
                                {Object.entries(TACTICAL_PRESETS).map(([key, preset]) => {
                                    // Translate using keys if available
                                    const nameKey = `preset${key}` as keyof Translation;
                                    const descKey = `desc${key}` as keyof Translation;
                                    const displayName = (t[nameKey] as string) || preset.name;
                                    const displayDesc = (t[descKey] as string) || preset.description;
                                    const previewTactic = { ...team.tactic, ...preset.tactic } as TeamTactic;
                                    const previewSummary = describeTactic(previewTactic);
                                    const previewAttackPlan = previewTactic.attackPlan || 'AUTO';
                                    const isActivePreset = detectPreset(team.tactic) === key;

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                const newTactic = applyPreset(team.tactic, key as PresetKey);
                                                // Update the entire tactic object in one go
                                                onUpdateTactic(newTactic);
                                            }}
                                            className={`w-full p-2 rounded border transition-all text-left group relative overflow-hidden ${isActivePreset
                                                ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-900/40'
                                                : 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-750'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="text-[11px] font-bold text-indigo-300 group-hover:text-indigo-200">{displayName}</span>
                                                <span className={`text-[9px] px-1 rounded ${isActivePreset ? 'bg-indigo-500/20 text-indigo-200' : 'bg-slate-900 text-slate-400'}`}>{isActivePreset ? 'AKTIF' : t.applyPreset}</span>
                                            </div>
                                            <p className="text-[9px] text-slate-400 mt-1 leading-tight group-hover:text-slate-300">
                                                {displayDesc}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[8px] text-slate-300">{getAttackApproachLabel(previewSummary.attackApproach)}</span>
                                                <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[8px] text-slate-300">{getDefenseApproachLabel(previewSummary.defenseApproach)}</span>
                                                <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[8px] text-slate-300">{getAttackPlanLabel(previewAttackPlan)}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {tacticTab === 'FORMATION' && (
                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.formation}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${formationSupport.badgeClass}`}>{formationSupport.label}</span>
                                    </div>
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

                                <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-2.5 space-y-2">
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{t.tacticCoreTitle || 'Takim Omurgasi'}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{t.tacticCoreDesc || 'Dizilisi degistir, geri kalan planin nasil bir futbol cikardigini asagida tek bakista gor.'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-2">
                                            <div className="text-[8px] uppercase text-slate-500">Preset</div>
                                            <div className="text-[11px] font-bold text-indigo-300 mt-0.5">{describeTactic(team.tactic).preset || t.customPlan || 'Ozel Plan'}</div>
                                        </div>
                                        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-2">
                                            <div className="text-[8px] uppercase text-slate-500">{t.attack || 'Hucum'}</div>
                                            <div className="text-[11px] font-bold text-emerald-300 mt-0.5">{getAttackApproachLabel(currentAttackApproach)}</div>
                                            <div className="text-[9px] text-slate-400">{getAttackPlanLabel(currentAttackPlan)}</div>
                                        </div>
                                        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-2">
                                            <div className="text-[8px] uppercase text-slate-500">{t.defense || 'Savunma'}</div>
                                            <div className="text-[11px] font-bold text-red-300 mt-0.5">{getDefenseApproachLabel(currentDefenseApproach)}</div>
                                            <div className="text-[9px] text-slate-400">{getMarkingLabel(team.tactic.marking)}</div>
                                        </div>
                                        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-2">
                                            <div className="text-[8px] uppercase text-slate-500">{t.tackleRiskTitle || 'Mudahale'}</div>
                                            <div className="text-[11px] font-bold text-orange-300 mt-0.5">{getAggressionLabel(team.tactic.aggression)}</div>
                                            <div className="text-[9px] text-slate-400">{getWidthLabel(team.tactic.width)} {t.width || 'Genislik'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg px-2.5 py-2 text-[10px] text-blue-100">
                                    {t.tacticCoreHint || 'Bu sekme artik ayar yigini degil: once omurgayi kur, sonra Hucum ve Savunma sekmelerinde davranisi ince ayarla.'}
                                </div>

                                <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400">{t.dragDropPositions || 'Drag & Drop Positions'}</span>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${customPositionsSupport.badgeClass}`}>{customPositionsSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400">{customPositionsSupport.summary}</div>
                                </div>

                                <div className="bg-indigo-900/25 border border-indigo-700/30 rounded-lg px-2.5 py-2 text-[10px] text-indigo-100 space-y-2">
                                    <div className="text-[9px] uppercase tracking-wider text-indigo-300 font-bold">{t.dynamicFormationAdviceTitle || 'Dinamik dizilis onerisi'}</div>
                                    <div>
                                        <span className="text-indigo-300/80">{t.dynamicFormationShapeTitle || 'Sekil notu'}:</span> {getBaseFormationNote(team.tactic.formation)}
                                    </div>
                                    <div>
                                        <span className="text-indigo-300/80">{t.dynamicFormationBestFitTitle || 'Kadroya en uygun plan'}:</span> {formatPlan(recommendedSquadPlan)}
                                    </div>
                                    <div>
                                        <span className="text-indigo-300/80">{t.dynamicFormationStrengthsTitle || 'Takim gucleri'}:</span> {rankedStrengths.join(' • ') || (t.dynamicStrengthBalanced || 'dengeli kadro')}
                                    </div>
                                    <div>
                                        <span className="text-indigo-300/80">{t.dynamicFormationRiskTitle || 'Dikkat'}:</span> {tacticalRisks[0] || t.dynamicRiskNone || 'Bu dizilis icin belirgin bir yapisal alarm gorunmuyor.'}
                                    </div>
                                    <div className="border-t border-indigo-700/30 pt-2 space-y-1">
                                        <div>
                                            <span className="text-indigo-300/80">{t.dynamicFormationOpponentTitle || 'Rakibe gore mac plani'}:</span> {hasOpponentPlanShift ? formatPlan(opponentAdjustedPlan.plan) : formatPlan(recommendedSquadPlan)}
                                        </div>
                                        <div className="text-indigo-200/85">{opponentAdjustedPlan.note}</div>
                                    </div>
                                </div>

                                {comboWarnings.length > 0 && (
                                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-2.5 py-2 text-[10px] text-amber-100 space-y-1.5">
                                        <div className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">Uyum uyarisi</div>
                                        {comboWarnings.map((warning, index) => (
                                            <div key={`combo-warning-${index}`}>{warning}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tacticTab === 'IN_POSSESSION' && (
                            <div className="space-y-2">
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.guideAttackApproachTitle || 'Hucum Yaklasimi'}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${attackApproachSupport.badgeClass}`}>{attackApproachSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{attackApproachSupport.summary}</div>
                                    <div className="grid grid-cols-2 gap-1 mt-0.5">
                                        {attackApproachOptions.map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => applyAttackApproach(s.value as AttackApproach)}
                                                className={`px-2 py-1.5 text-left text-[9px] font-bold rounded border transition-all ${currentAttackApproach === s.value
                                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                                                    }`}
                                            >
                                                <div>{s.label}</div>
                                                <div className="text-[8px] text-slate-200/80">{s.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.guideFinalThirdTitle || 'Son Ucuncu Bolge'}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${finalThirdSupport.badgeClass}`}>{finalThirdSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{finalThirdSupport.summary}</div>
                                    <div className="grid grid-cols-3 gap-1 mt-0.5">
                                        {finalThirdOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => setAttackInstructions(option.value as FinalThirdMode)}
                                                className={`rounded border px-2 py-1.5 text-left transition-all ${currentFinalThird === option.value ? 'border-yellow-500 bg-yellow-700/70 text-white' : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-700'}`}
                                            >
                                                <div className="text-[10px] font-bold">{option.label}</div>
                                                <div className="text-[9px] text-slate-300/80">{option.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.attackPlanTitle || 'Hucum Plani'}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${attackPlanSupport.badgeClass}`}>{attackPlanSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{attackPlanSupport.summary}</div>
                                    <div className="grid grid-cols-2 gap-1 mt-0.5">
                                        {attackPlanOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => setAttackPlanMode(option.value)}
                                                className={`rounded border px-2 py-1.5 text-left transition-all ${currentAttackPlan === option.value ? 'border-cyan-500 bg-cyan-700/70 text-white' : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-700'}`}
                                            >
                                                <div className="text-[10px] font-bold">{option.label}</div>
                                                <div className="text-[9px] text-slate-300/80">{option.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.width}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${widthSupport.badgeClass}`}>{widthSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{widthSupport.summary}</div>
                                    <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                        <button onClick={() => handleTacticChange('width', 'Narrow')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${(team.tactic.width || 'Balanced') === 'Narrow' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticNarrow}</button>
                                        <button onClick={() => handleTacticChange('width', 'Balanced')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${(team.tactic.width || 'Balanced') === 'Balanced' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticBalanced || 'Bal'}</button>
                                        <button onClick={() => handleTacticChange('width', 'Wide')} className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.width === 'Wide' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.tacticWide}</button>
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 space-y-2">
                                    <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">Bu secince sahada ne gorursun</div>
                                    <div>
                                        <span className="text-slate-400">{getAttackApproachLabel(currentAttackApproach)}:</span> {getAttackApproachInsight(currentAttackApproach).preview}
                                    </div>
                                    <div>
                                        <span className="text-slate-400">{getFinalThirdLabel(currentFinalThird)}:</span> {getFinalThirdInsight(currentFinalThird)}
                                    </div>
                                    <div>
                                        <span className="text-slate-400">{getAttackPlanLabel(currentAttackPlan)}:</span> {getAttackPlanInsight(currentAttackPlan)}
                                    </div>
                                    <div>
                                        <span className="text-slate-400">{getWidthLabel(team.tactic.width)}:</span> {getWidthInsight(team.tactic.width)}
                                    </div>
                                </div>

                                <div className="bg-cyan-950/35 border border-cyan-700/25 rounded-lg px-2.5 py-2 text-[10px] text-cyan-100 space-y-1.5">
                                    <div className="text-[9px] uppercase tracking-wider text-cyan-300 font-bold">Motor eslemesi</div>
                                    <div>{getAttackApproachInsight(currentAttackApproach).motor}</div>
                                    <div>{getAttackPlanLabel(currentAttackPlan)}: {getAttackPlanInsight(currentAttackPlan)}</div>
                                    <div className="text-cyan-200/85">Bunlar artik ekranda ayri ayri secilen ayarlar degil; sen yuksek seviye plan secersin, motor altta bunu uygun pas-tempo-risk profiline cevirir.</div>
                                </div>

                                {comboWarnings.length > 0 && (
                                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-2.5 py-2 text-[10px] text-amber-100 space-y-1.5">
                                        <div className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">Uyum uyarisi</div>
                                        {comboWarnings.map((warning, index) => (
                                            <div key={`attack-warning-${index}`}>{warning}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tacticTab === 'OUT_POSSESSION' && (
                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.defensePlanTitle || 'Savunma Plani'}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${defenseApproachSupport.badgeClass}`}>{defenseApproachSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{defenseApproachSupport.summary}</div>
                                    <div className="grid grid-cols-2 gap-1 mt-1">
                                        {defenseApproachOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => applyDefenseApproach(option.value as DefenseApproach)}
                                                className={`px-2 py-1.5 text-left rounded border transition-all ${currentDefenseApproach === option.value
                                                    ? 'border-red-500 bg-red-700/70 text-white'
                                                    : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <div className="text-[10px] font-bold">{option.label}</div>
                                                <div className="text-[9px] text-slate-300/80">{option.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.aggression}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${aggressionSupport.badgeClass}`}>{aggressionSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{aggressionSupport.summary}</div>
                                    <div className="flex bg-slate-700 rounded p-0.5 mt-0.5">
                                        {[
                                            { value: 'Safe', label: t.safe, activeClass: 'bg-blue-600 text-white' },
                                            { value: 'Normal', label: t.normal, activeClass: 'bg-slate-500 text-white' },
                                            { value: 'Aggressive', label: t.aggressive, activeClass: 'bg-orange-600 text-white' },
                                            { value: 'Reckless', label: t.reckless, activeClass: 'bg-red-700 text-white animate-pulse' }
                                        ].map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleTacticChange('aggression', option.value)}
                                                className={`flex-1 text-[9px] py-1 rounded font-bold transition-colors ${team.tactic.aggression === option.value ? option.activeClass : 'text-slate-400 hover:text-white'}`}
                                                title={option.value === 'Reckless' ? 'Risk: Yuksek kart!' : undefined}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[9px] uppercase text-slate-500 font-bold">{t.marking || 'Markaj'}</label>
                                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${markingSupport.badgeClass}`}>{markingSupport.label}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{markingSupport.summary}</div>
                                    <div className="grid grid-cols-2 gap-1 mt-0.5">
                                        <button
                                            onClick={() => handleTacticChange('marking', 'Zonal')}
                                            className={`rounded border px-2 py-1.5 text-left transition-all ${team.tactic.marking !== 'Man' ? 'border-blue-500 bg-blue-700/60 text-white' : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500'}`}
                                        >
                                            <div className="text-[10px] font-bold">{t.markingZonal || 'Alan Savunmasi'}</div>
                                            <div className="text-[9px] text-slate-300/80">{t.markingZonalDesc || 'Sekli korur, yerlesimi dagitmaz'}</div>
                                        </button>
                                        <button
                                            onClick={() => handleTacticChange('marking', 'Man')}
                                            className={`rounded border px-2 py-1.5 text-left transition-all ${team.tactic.marking === 'Man' ? 'border-blue-500 bg-blue-700/60 text-white' : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500'}`}
                                        >
                                            <div className="text-[10px] font-bold">{t.markingMan || 'Adam Adama'}</div>
                                            <div className="text-[9px] text-slate-300/80">{t.markingManDesc || 'Temasli oynar, bire biri zorlar'}</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-2 text-[10px] text-slate-300">
                                    <span className="text-slate-500 uppercase text-[8px] tracking-wider">{t.engineMappingTitle || 'Motor karsiligi'}</span>
                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                        <span>{t.pressingIntensity || 'Pres'}: <span className="text-red-300">{team.tactic.pressingIntensity === 'StandOff' ? t.pressStandOff : team.tactic.pressingIntensity === 'HighPress' ? t.pressHigh : team.tactic.pressingIntensity === 'Gegenpress' ? t.pressGegen : t.pressBalanced || 'Dengeli'}</span></span>
                                        <span>{t.defensiveLine || 'Hat'}: <span className="text-blue-300">{team.tactic.defensiveLine === 'Deep' ? t.tacticDeep : team.tactic.defensiveLine === 'High' ? t.tacticHigh : t.tacticBalanced || 'Dengeli'}</span></span>
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 space-y-2">
                                    <div className="text-[9px] uppercase tracking-wider text-red-300 font-bold">Bu secince savunmada ne gorursun</div>
                                    <div>
                                        <span className="text-slate-400">{getDefenseApproachLabel(currentDefenseApproach)}:</span> {getDefenseApproachInsight(currentDefenseApproach)}
                                    </div>
                                    <div>
                                        <span className="text-slate-400">{getAggressionLabel(team.tactic.aggression)}:</span> {getAggressionInsight(team.tactic.aggression)}
                                    </div>
                                    <div>
                                        <span className="text-slate-400">{getMarkingLabel(team.tactic.marking)}:</span> {getMarkingInsight(team.tactic.marking)}
                                    </div>
                                </div>

                                {comboWarnings.length > 0 && (
                                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-2.5 py-2 text-[10px] text-amber-100 space-y-1.5">
                                        <div className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">Uyum uyarisi</div>
                                        {comboWarnings.map((warning, index) => (
                                            <div key={`defense-warning-${index}`}>{warning}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mb-3 mt-3 rounded-xl border border-slate-700 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_32%),rgba(15,23,42,0.92)] p-3 shadow-inner">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-bold">{t.tacticCoreTitle || 'Taktik not defteri'}</div>
                                <div className="text-[13px] font-semibold text-white mt-1">{describeTactic(team.tactic).preset || t.customPlan || 'Ozel Plan'}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{t.tacticCoreHint || 'Once oyun kimligini kur, sonra sekmelerde detay davranisi ince ayarla.'}</div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">{t.formation || 'Dizilis'}</div>
                                <div className="text-[13px] font-mono text-emerald-300">{team.tactic.formation}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            {tacticalNotebookCards.map(card => (
                                <div key={card.key} className={`rounded-xl border ${card.border} bg-slate-950/45 p-2.5`}>
                                    <div className="text-[8px] uppercase tracking-[0.22em] text-slate-500 font-bold">{card.eyebrow}</div>
                                    <div className={`text-[11px] font-bold mt-1 ${card.accent}`}>{card.title}</div>
                                    <div className="text-[10px] text-slate-300 mt-1">{card.body}</div>
                                    <div className="text-[9px] text-slate-400 mt-2 leading-relaxed">{card.foot}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/45 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-[8px] uppercase tracking-[0.22em] text-slate-500 font-bold">{t.instrTitle || 'Oyuncu gorevleri'}</div>
                                <div className="text-[9px] text-slate-400">{activeDutySummary.length}/11 {t.active || 'active'}</div>
                            </div>
                            {activeDutySummary.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {activeDutySummary.map(entry => (
                                        <div key={`${entry.player.id}-${entry.instructionId}`} className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-1 text-[10px] text-slate-200">
                                            <span className="mr-1">{entry.icon}</span>
                                            <span className="font-semibold text-white">{entry.player.lastName}</span>
                                            <span className="mx-1 text-slate-500">•</span>
                                            <span>{entry.label}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-[10px] text-slate-400">Tum oyuncular su an varsayilan gorevlerle oynuyor. Fark yaratmak istedigin rolde bireysel talimat ver.</div>
                            )}
                        </div>

                    </div>

                    <div className={`mb-3 rounded-xl border p-3 ${enginePresentation.panelClass}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-bold">{t.engineAwarenessLabel || 'Engine Awareness'}</div>
                                <div className="text-[13px] font-semibold text-white mt-1">{enginePresentation.label}</div>
                                <div className="text-[10px] text-slate-300 mt-1">{enginePresentation.summary}</div>
                            </div>
                            <div className={`rounded-full border px-2 py-1 text-[9px] font-bold ${enginePresentation.chipClass}`}>
                                {enginePresentation.shortLabel}
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-700/70 bg-slate-950/45 p-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[10px] font-semibold text-white">{t.attackPlanTitle || 'Attack Plan'}</div>
                                    <div className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${attackPlanSupport.badgeClass}`}>{attackPlanSupport.label}</div>
                                </div>
                                <div className="mt-1 text-[9px] text-slate-400">{attackPlanSupport.summary}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700/70 bg-slate-950/45 p-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[10px] font-semibold text-white">{t.marking || 'Marking'}</div>
                                    <div className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${markingSupport.badgeClass}`}>{markingSupport.label}</div>
                                </div>
                                <div className="mt-1 text-[9px] text-slate-400">{markingSupport.summary}</div>
                            </div>
                            <div className="rounded-lg border border-slate-700/70 bg-slate-950/45 p-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[10px] font-semibold text-white">{t.playerInstructionsTitle || 'Player Instructions'}</div>
                                    <div className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${playerInstructionsSupport.badgeClass}`}>{playerInstructionsSupport.label}</div>
                                </div>
                                <div className="mt-1 text-[9px] text-slate-400">{playerInstructionsSupport.summary}</div>
                            </div>
                        </div>
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
                            // getBaseFormationOffset artık motor koordinatları (105x68) döndürüyor
                            // UI için 0-100 yüzde sistemine çevirmeliyiz
                            const coords = getBaseFormationOffset(team.tactic.formation, presetRole, idx, total);
                            left = (coords.x / 105) * 100; // Motor X -> UI %
                            top = (coords.y / 68) * 100;   // Motor Y -> UI %
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

                        // Forma numarası fallback: lineup slot temelli olmalı
                        const jerseyNumber = p.jerseyNumber || ((p.lineupIndex || 0) + 1);

                        const instrIcon = getInstructionIcon(p.lineupIndex || 0);

                        return (
                            <div
                                key={p.id}
                                onMouseDown={(e) => handleDragStart(e, p.id)}
                                onMouseUp={(e) => handlePitchMouseUp(e)}
                                onTouchStart={(e) => handleDragStart(e, p.id)}
                                onTouchEnd={(e) => handlePitchMouseUp(e)}
                                className={`absolute w-8 h-8 rounded-full border-2 ${borderClass} shadow-xl flex items-center justify-center text-[10px] font-bold text-white z-10 transition-transform touch-none ${isDragging ? 'scale-125 cursor-grabbing z-50' : 'hover:scale-110 cursor-grab'} ${bgClass}`}
                                style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)', transition: isDragging ? 'none' : 'all 0.2s ease-out' }}
                                title={`${p.firstName} ${p.lastName} (${p.position}) - ${jerseyNumber} | OVR: ${effectiveRating}`}
                            >
                                {jerseyNumber}
                                {instrIcon && (
                                    <span className="absolute -top-2 -right-2 text-[10px] bg-slate-900/90 rounded-full w-4 h-4 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                        {instrIcon}
                                    </span>
                                )}
                            </div>
                        )
                    })}

                    <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded z-20 font-bold ${starters.length === 11 ? 'bg-black/50 text-emerald-400' : 'bg-red-900/80 text-white'}`}>
                        {starters.length}/11
                    </div>
                </div>

                {/* PLAYER INSTRUCTION POPUP */}
                {instructionTarget && (() => {
                    const sections = getInstructionSections(instructionTarget.role);
                    const currentInstr = getSlotInstruction(instructionTarget.lineupIndex);
                    const targetPlayer = players.find(pl => pl.id === instructionTarget.playerId);
                    const recommendations = targetPlayer ? getRoleRecommendations(targetPlayer) : [];
                    const recommendationText = recommendations.map(rec => rec.presentation.roleName).join(' • ');
                    return (
                        <>
                        <div className="fixed inset-0 z-10" onClick={() => setInstructionTarget(null)} />
                        <div className="relative z-20 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-xl p-3 shadow-2xl animate-fade-in">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                    📋 {t.instrTitle || 'Talimat'}: {targetPlayer ? `${targetPlayer.firstName} ${targetPlayer.lastName}` : ''}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${instructionTarget.role === 'DEF' ? 'bg-blue-600' : instructionTarget.role === 'MID' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>{instructionTarget.role}</span>
                                </span>
                                <button onClick={() => setInstructionTarget(null)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
                            </div>
                            <div className="mb-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1.5 text-[10px] text-slate-300">
                                {t.instrRoleNamesNote || 'Role names are kept simple for readability. The engine still uses the same individual instruction underneath.'}
                            </div>
                            {recommendations.length > 0 && (
                                <div className="mb-3 rounded-lg border border-emerald-700/25 bg-emerald-950/15 px-2 py-1.5 text-[10px] text-emerald-100">
                                    <span className="text-[9px] uppercase tracking-[0.18em] text-emerald-300 font-bold">{t.instrRecommendedTitle || 'Recommended Roles'}</span>
                                    <div className="mt-1">{recommendationText}</div>
                                    <div className="mt-1 text-[8px] text-emerald-100/70">{t.instrSelectNote || 'Make your selection from the full list below. The top row is just for guidance.'}</div>
                                </div>
                            )}
                            <div className="space-y-2">
                                {sections.map(section => (
                                    <div key={section.title} className="space-y-1">
                                        <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold px-1">{section.title}</div>
                                        {section.items.map(opt => {
                                            const presentation = getRolePresentation(targetPlayer, opt);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setSlotInstruction(instructionTarget.lineupIndex, opt.id)}
                                                    className={`w-full text-left p-2 rounded-lg border transition-all ${currentInstr === opt.id
                                                        ? 'bg-emerald-600/30 border-emerald-500/50 shadow-md'
                                                        : 'bg-slate-700/50 border-slate-600/30 hover:bg-slate-600/50 hover:border-slate-500/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{opt.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div className={`text-[11px] font-bold ${currentInstr === opt.id ? 'text-emerald-300' : 'text-white'}`}>
                                                                    {currentInstr === opt.id && '✅ '}{presentation.roleName}
                                                                </div>
                                                                <span className="rounded-full border border-slate-600 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.16em] text-slate-300">{presentation.roleFamily}</span>
                                                                <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[8px] text-slate-400">{opt.label}</span>
                                                            </div>
                                                            <div className="text-[9px] text-slate-300 leading-tight mt-0.5">{presentation.summary}</div>
                                                            {targetPlayer && (
                                                                <div className="text-[8px] text-slate-500 leading-tight mt-1">{opt.desc} • {describeRoleFit(targetPlayer, presentation.fitWeights)}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                        </>
                    );
                })()}

                <div className="bg-slate-800 p-2 rounded text-[10px] text-slate-400 border border-slate-700 flex justify-between">
                    <span className="flex items-center gap-1">📋 {t.instrTitle || 'Talimat'}</span>
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
                        {starters.map((p, index) => (
                            <PlayerRow
                                key={p.id}
                                player={p}
                                selectedPlayerId={selectedPlayerId}
                                onSelect={handlePlayerSelect}
                                onInteractStart={setInteractingPlayer}
                                onMove={onMovePlayer}
                                isFirst={index === 0}
                                isLast={index === starters.length - 1}
                                assignedRole={assignedRoleMap[p.id]}
                                t={t}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sky-500 font-bold mb-2 uppercase text-sm tracking-widest">
                        {t.bench || 'Bench'}
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
                        {bench.map(p => (
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
