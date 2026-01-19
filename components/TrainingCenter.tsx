
import React, { useState } from 'react';
import { Team, Translation, TrainingFocus, TrainingIntensity, Player, Position } from '../types';
import { Target, Shield, Zap, Activity, Brain, BarChart2, Swords, Trophy, Users, ChevronRight, ChevronLeft, X, Shuffle } from 'lucide-react';

interface TrainingCenterProps {
    team: Team;
    players: Player[];
    onSetFocus: (focus: TrainingFocus) => void;
    onSetIntensity: (intensity: TrainingIntensity) => void;
    onTrainingMatch?: (result: { teamAGoals: number; teamBGoals: number; mvp: Player }) => void;
    t: Translation;
}

interface TrainingMatchResult {
    teamA: Player[];
    teamB: Player[];
    teamAGoals: number;
    teamBGoals: number;
    mvp: Player;
    events: string[];
    scorers: { name: string; team: 'A' | 'B'; minute: number }[];
}

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ team, players, onSetFocus, onSetIntensity, onTrainingMatch, t }) => {
    const [trainingMatchResult, setTrainingMatchResult] = useState<TrainingMatchResult | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // Team Builder State
    const [showTeamBuilder, setShowTeamBuilder] = useState(false);
    const [teamA, setTeamA] = useState<Player[]>([]);
    const [teamB, setTeamB] = useState<Player[]>([]);

    // Get available players
    const availablePlayers = players.filter(p => !p.injury && p.condition > 30);
    const unassignedPlayers = availablePlayers.filter(p =>
        !teamA.find(t => t.id === p.id) && !teamB.find(t => t.id === p.id)
    );

    const addToTeamA = (player: Player) => {
        if (teamA.length < 11) {
            setTeamA([...teamA, player]);
        }
    };

    const addToTeamB = (player: Player) => {
        if (teamB.length < 11) {
            setTeamB([...teamB, player]);
        }
    };

    const removeFromTeamA = (playerId: string) => {
        setTeamA(teamA.filter(p => p.id !== playerId));
    };

    const removeFromTeamB = (playerId: string) => {
        setTeamB(teamB.filter(p => p.id !== playerId));
    };

    const autoFillTeams = () => {
        const sorted = [...availablePlayers].sort((a, b) => b.overall - a.overall);
        const newTeamA: Player[] = [];
        const newTeamB: Player[] = [];

        sorted.forEach((player, index) => {
            if (newTeamA.length < 11 && newTeamB.length < 11) {
                if (index % 2 === 0) {
                    newTeamA.push(player);
                } else {
                    newTeamB.push(player);
                }
            } else if (newTeamA.length < 11) {
                newTeamA.push(player);
            } else if (newTeamB.length < 11) {
                newTeamB.push(player);
            }
        });

        setTeamA(newTeamA);
        setTeamB(newTeamB);
    };

    const clearTeams = () => {
        setTeamA([]);
        setTeamB([]);
    };

    const startTrainingMatch = () => {
        if (teamA.length < 7 || teamB.length < 7) {
            alert(t.minPlayersWarning);
            return;
        }

        setIsSimulating(true);

        // Calculate team strengths
        const teamAStrength = teamA.reduce((sum, p) => sum + p.overall, 0) / teamA.length;
        const teamBStrength = teamB.reduce((sum, p) => sum + p.overall, 0) / teamB.length;

        // Simulate goals based on strength
        const events: string[] = [];
        const scorers: { name: string; team: 'A' | 'B'; minute: number }[] = [];
        let teamAGoals = 0;
        let teamBGoals = 0;

        // Simulate 90 minutes with random events
        for (let minute = 1; minute <= 90; minute += Math.floor(Math.random() * 10) + 5) {
            const rand = Math.random() * 100;
            const teamAChance = 50 + (teamAStrength - teamBStrength);

            if (rand < 20) { // Goal event
                const scoringTeam = Math.random() * 100 < teamAChance ? 'A' : 'B';
                const squad = scoringTeam === 'A' ? teamA : teamB;
                const goalscorer = squad[Math.floor(Math.random() * squad.length)];

                if (scoringTeam === 'A') {
                    teamAGoals++;
                } else {
                    teamBGoals++;
                }

                events.push(`${minute}' ⚽ ${goalscorer.name} (${scoringTeam === 'A' ? t.orange : t.blue})`);
                scorers.push({ name: goalscorer.name, team: scoringTeam, minute });
            }
        }

        // Determine MVP (random from winning team, or highest rated if draw)
        let mvpPool = teamAGoals > teamBGoals ? teamA : teamBGoals > teamAGoals ? teamB : [...teamA, ...teamB];
        const mvp = mvpPool[Math.floor(Math.random() * Math.min(3, mvpPool.length))];

        setTimeout(() => {
            const result: TrainingMatchResult = {
                teamA: [...teamA],
                teamB: [...teamB],
                teamAGoals,
                teamBGoals,
                mvp,
                events,
                scorers
            };
            setTrainingMatchResult(result);
            setIsSimulating(false);
            setShowTeamBuilder(false);

            if (onTrainingMatch) {
                onTrainingMatch({ teamAGoals, teamBGoals, mvp });
            }
        }, 2000);
    };

    const getPositionColor = (pos: Position | string) => {
        if (pos === Position.GK || pos === 'GK' || pos === 'KL') return 'bg-yellow-600';
        if (pos === Position.DEF || ['STP', 'SĞB', 'SLB', 'DEF', 'CB', 'LB', 'RB'].includes(pos as string)) return 'bg-blue-600';
        if (pos === Position.MID || ['MDO', 'MO', 'MOO', 'MID', 'CM', 'CDM', 'CAM'].includes(pos as string)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const options: { id: TrainingFocus, icon: any, label: string, desc: string, color: string }[] = [
        { id: 'BALANCED', icon: Activity, label: t.trainingBalanced || 'Balanced', desc: t.trainingBalancedDesc || 'Maintain overall fitness and sharpness.', color: 'text-white' },
        { id: 'ATTACK', icon: Target, label: t.trainingAttack || 'Attacking', desc: t.trainingAttackDesc || 'Boosts Finishing, Passing. Lowers Defense.', color: 'text-red-400' },
        { id: 'DEFENSE', icon: Shield, label: t.trainingDefense || 'Defending', desc: t.trainingDefenseDesc || 'Boosts Tackling, Positioning. Lowers Attack.', color: 'text-blue-400' },
        { id: 'PHYSICAL', icon: Zap, label: t.trainingPhysical || 'Physical', desc: t.trainingPhysicalDesc || 'Boosts Speed, Strength. High Fatigue risk.', color: 'text-yellow-400' },
        { id: 'TECHNICAL', icon: Brain, label: t.trainingTechnical || 'Technical', desc: t.trainingTechnicalDesc || 'Boosts Dribbling, Vision, Control.', color: 'text-purple-400' },
        { id: 'POSITION_BASED', icon: Users, label: t.trainingPositionBased || 'Position Based', desc: t.trainingPositionBasedDesc || 'Each player trains based on their position.', color: 'text-emerald-400' },
    ];

    const intensities: { id: TrainingIntensity, label: string, recovery: string, growth: string, color: string }[] = [
        { id: 'LIGHT', label: t.intensityLight, recovery: 'High (+40%)', growth: 'Low (5%)', color: 'bg-green-600' },
        { id: 'NORMAL', label: t.intensityNormal, recovery: 'Normal (+25%)', growth: 'Normal (20%)', color: 'bg-blue-600' },
        { id: 'HEAVY', label: t.intensityHeavy, recovery: 'Low (+10%)', growth: 'High (40%)', color: 'bg-red-600' },
    ];

    const currentIntensity = team.trainingIntensity || 'NORMAL';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">

            {/* LEFT COLUMN: FOCUS */}
            <div className="bg-slate-800 p-3 md:p-6 rounded-lg border border-slate-700 shadow-xl">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 flex items-center gap-2">
                    <Activity className="text-emerald-500" size={20} /> {t.trainingCenter}
                </h2>

                <div className="space-y-2">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => onSetFocus(opt.id)}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-lg border transition-all text-left ${team.trainingFocus === opt.id
                                ? 'bg-emerald-900/40 border-emerald-500'
                                : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700'
                                }`}
                        >
                            <div className={`p-2 rounded-full bg-slate-800 ${opt.color} shrink-0`}>
                                <opt.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm ${team.trainingFocus === opt.id ? 'text-white' : 'text-slate-300'}`}>{opt.label}</h3>
                                <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                            </div>
                            {team.trainingFocus === opt.id && (
                                <div className="text-emerald-500 text-[10px] font-bold uppercase shrink-0">ACTIVE</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: INTENSITY & STATS */}
            <div className="space-y-6">

                {/* Intensity Selector */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="text-orange-500" /> {t.trainingIntensity}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                        {t.trainingTip || 'Balance recovery and growth. Heavier training improves players faster but reduces fitness recovery.'}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                        {intensities.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSetIntensity(item.id)}
                                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${currentIntensity === item.id
                                    ? 'bg-slate-700 border-white text-white shadow-lg scale-105'
                                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`w-full h-1 rounded-full ${item.color} mb-1`}></div>
                                <span className="font-bold text-sm">{item.label}</span>
                                <div className="flex flex-col text-[10px] text-center mt-1 w-full">
                                    <div className="flex justify-between w-full px-1">
                                        <span>{t.rec}:</span>
                                        <span className={item.id === 'LIGHT' ? 'text-green-400' : item.id === 'HEAVY' ? 'text-red-400' : 'text-blue-400'}>{item.recovery.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex justify-between w-full px-1">
                                        <span>{t.grw}:</span>
                                        <span className={item.id === 'HEAVY' ? 'text-green-400' : item.id === 'LIGHT' ? 'text-red-400' : 'text-blue-400'}>{item.growth.split(' ')[0]}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">{t.efficiency}</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-emerald-400">{Math.round(team.facilities.trainingLevel * 4)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${team.facilities.trainingLevel * 4}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-400">
                        {t.upgradeTrainingTip || 'Upgrade your Training Facilities in the Club menu to improve weekly player growth rates.'}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-lg border border-indigo-500/30 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-2">{t.coachNote}</h3>
                    <p className="text-sm text-indigo-200 italic">
                        "{t.coachNoteText?.replace('{focus}', team.trainingFocus) || `Setting the focus to ${team.trainingFocus} will help shape the team's identity. Use Light intensity after tough matches to recover condition.`}"
                    </p>
                </div>

                {/* Training Match Section */}
                <div className="bg-gradient-to-br from-amber-900/50 to-slate-900 p-6 rounded-lg border border-amber-500/30 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Swords className="text-amber-400" /> {t.trainingMatch}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                        {t.trainingMatchDesc}
                    </p>

                    {!trainingMatchResult ? (
                        <button
                            onClick={() => setShowTeamBuilder(true)}
                            disabled={availablePlayers.length < 14}
                            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Users size={18} />
                            {availablePlayers.length < 14
                                ? (t.needMorePlayers.replace('{count}', String(14 - availablePlayers.length)))
                                : (t.setupMatch)}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            {/* Score Display */}
                            <div className="bg-slate-800 rounded-lg p-4">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-amber-400 mb-1 font-bold">🟠 {t.orange}</div>
                                        <div className="text-4xl font-bold text-amber-400">{trainingMatchResult.teamAGoals}</div>
                                    </div>
                                    <div className="text-2xl text-slate-500">-</div>
                                    <div className="text-center">
                                        <div className="text-xs text-blue-400 mb-1 font-bold">🔵 {t.blue}</div>
                                        <div className="text-4xl font-bold text-blue-400">{trainingMatchResult.teamBGoals}</div>
                                    </div>
                                </div>
                            </div>

                            {/* MVP */}
                            <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-lg p-3 flex items-center gap-3">
                                <Trophy className="text-yellow-400" size={24} />
                                <div>
                                    <div className="text-xs text-yellow-400">{t.motm}</div>
                                    <div className="font-bold text-white">{trainingMatchResult.mvp.name} ({trainingMatchResult.mvp.overall})</div>
                                </div>
                            </div>

                            {/* Scorers */}
                            {trainingMatchResult.scorers.length > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                    <div className="text-xs text-slate-400 mb-2 font-bold">⚽ {t.goals}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {trainingMatchResult.scorers.map((s, i) => (
                                            <span key={i} className={`text-xs px-2 py-1 rounded ${s.team === 'A' ? 'bg-amber-900/50 text-amber-300' : 'bg-blue-900/50 text-blue-300'}`}>
                                                {s.minute}' {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Teams List - Full */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-amber-900/20 rounded p-2 border border-amber-500/20">
                                    <div className="font-bold text-amber-400 mb-2 text-center">🟠 {t.orangeTeam}</div>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {trainingMatchResult.teamA.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-700/50">
                                                <span className="truncate">{p.lastName}</span>
                                                <span className="text-amber-400 font-mono">{p.overall}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-amber-500/30 text-center">
                                        <span className="text-slate-500">{t.avg}: </span>
                                        <span className="text-amber-400 font-bold">
                                            {Math.round(trainingMatchResult.teamA.reduce((s, p) => s + p.overall, 0) / trainingMatchResult.teamA.length)}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-blue-900/20 rounded p-2 border border-blue-500/20">
                                    <div className="font-bold text-blue-400 mb-2 text-center">🔵 {t.blueTeam}</div>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {trainingMatchResult.teamB.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-700/50">
                                                <span className="truncate">{p.lastName}</span>
                                                <span className="text-blue-400 font-mono">{p.overall}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-blue-500/30 text-center">
                                        <span className="text-slate-500">{t.avg}: </span>
                                        <span className="text-blue-400 font-bold">
                                            {Math.round(trainingMatchResult.teamB.reduce((s, p) => s + p.overall, 0) / trainingMatchResult.teamB.length)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => { setTrainingMatchResult(null); setTeamA([]); setTeamB([]); }}
                                className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
                            >
                                {t.newMatch}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Builder Modal */}
            {showTeamBuilder && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Swords className="text-amber-400" /> {t.trainingMatchSetup}
                            </h2>
                            <button onClick={() => setShowTeamBuilder(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-4 gap-4">
                            {/* Team A */}
                            <div className="flex-1 bg-amber-900/20 rounded-lg border border-amber-500/30 p-3 flex flex-col">
                                <div className="font-bold text-amber-400 mb-2 text-center flex items-center justify-center gap-2">
                                    🟠 {t.orangeTeam} ({teamA.length}/11)
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1 min-h-[150px]">
                                    {teamA.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded px-2 py-1.5 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white ${getPositionColor(p.position)}`}>
                                                    {typeof p.position === 'string' ? p.position.substring(0, 2) : p.position}
                                                </span>
                                                <span className="text-white">{p.lastName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-amber-400 font-mono text-sm">{p.overall}</span>
                                                <button onClick={() => removeFromTeamA(p.id)} className="text-red-400 hover:text-red-300">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {teamA.length === 0 && (
                                        <div className="text-slate-500 text-center py-4 text-sm">{t.selectPlayer}</div>
                                    )}
                                </div>
                                {teamA.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-amber-500/30 text-center text-sm">
                                        {t.avg}: <span className="text-amber-400 font-bold">{Math.round(teamA.reduce((s, p) => s + p.overall, 0) / teamA.length)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Player Pool */}
                            <div className="flex-1 bg-slate-800 rounded-lg border border-slate-600 p-3 flex flex-col">
                                <div className="font-bold text-slate-300 mb-2 text-center">
                                    {t.playerPool} ({unassignedPlayers.length})
                                </div>
                                <div className="flex gap-2 mb-2">
                                    <button onClick={autoFillTeams} className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded flex items-center justify-center gap-1">
                                        <Shuffle size={14} /> {t.autoPick}
                                    </button>
                                    <button onClick={clearTeams} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded">
                                        {t.clear}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1 min-h-[150px]">
                                    {unassignedPlayers.sort((a, b) => b.overall - a.overall).map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-slate-900/50 rounded px-2 py-1.5 text-sm group">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white ${getPositionColor(p.position)}`}>
                                                    {typeof p.position === 'string' ? p.position.substring(0, 2) : p.position}
                                                </span>
                                                <span className="text-slate-300">{p.lastName}</span>
                                                <span className="text-slate-500 font-mono text-xs">{p.overall}</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => addToTeamA(p)}
                                                    disabled={teamA.length >= 11}
                                                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white text-xs rounded"
                                                >
                                                    🟠
                                                </button>
                                                <button
                                                    onClick={() => addToTeamB(p)}
                                                    disabled={teamB.length >= 11}
                                                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-xs rounded"
                                                >
                                                    🔵
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team B */}
                            <div className="flex-1 bg-blue-900/20 rounded-lg border border-blue-500/30 p-3 flex flex-col">
                                <div className="font-bold text-blue-400 mb-2 text-center flex items-center justify-center gap-2">
                                    🔵 {t.blueTeam} ({teamB.length}/11)
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1 min-h-[150px]">
                                    {teamB.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded px-2 py-1.5 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white ${getPositionColor(p.position)}`}>
                                                    {typeof p.position === 'string' ? p.position.substring(0, 2) : p.position}
                                                </span>
                                                <span className="text-white">{p.lastName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-400 font-mono text-sm">{p.overall}</span>
                                                <button onClick={() => removeFromTeamB(p.id)} className="text-red-400 hover:text-red-300">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {teamB.length === 0 && (
                                        <div className="text-slate-500 text-center py-4 text-sm">{t.selectPlayer}</div>
                                    )}
                                </div>
                                {teamB.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-blue-500/30 text-center text-sm">
                                        {t.avg}: <span className="text-blue-400 font-bold">{Math.round(teamB.reduce((s, p) => s + p.overall, 0) / teamB.length)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
                            <div className="text-sm text-slate-400">
                                {t.minPlayersWarning}
                            </div>
                            <button
                                onClick={startTrainingMatch}
                                disabled={teamA.length < 7 || teamB.length < 7 || isSimulating}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                            >
                                {isSimulating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t.playing}
                                    </>
                                ) : (
                                    <>
                                        <Swords size={18} /> {t.startMatch}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
