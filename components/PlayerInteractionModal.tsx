
import React, { useState } from 'react';
import { Player, Translation, Position } from '../types';
import { MessageSquare, ThumbsUp, ThumbsDown, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { createPortal } from 'react-dom';
import { getRatingImpacts } from '../services/MatchEngine';

const normalizePos = (p: Player): Position => {
    const raw = p.position as string;
    if (raw === 'KL' || raw === 'GK') return Position.GK;
    if (['STP', 'SĞB', 'SLB', 'DEF', 'CB', 'LB', 'RB', 'SW', 'LWB', 'RWB'].includes(raw)) return Position.DEF;
    if (['MDO', 'MO', 'MOO', 'MID', 'CDM', 'CM', 'CAM', 'LM', 'RM'].includes(raw)) return Position.MID;
    return Position.FWD;
};

interface PlayerInteractionModalProps {
    player: Player;
    onClose: () => void;
    onInteract: (type: 'PRAISE' | 'CRITICIZE' | 'MOTIVATE', intensity: 'LOW' | 'HIGH') => void;
    t: Translation;
}

export const PlayerInteractionModal: React.FC<PlayerInteractionModalProps> = ({ player, onClose, onInteract, t }) => {
    const [step, setStep] = useState<'SELECT' | 'CONFIRM'>('SELECT');
    const [selectedType, setSelectedType] = useState<'PRAISE' | 'CRITICIZE' | 'MOTIVATE' | null>(null);

    const handleSelect = (type: 'PRAISE' | 'CRITICIZE' | 'MOTIVATE') => {
        setSelectedType(type);
        setStep('CONFIRM');
    };

    const execute = (intensity: 'LOW' | 'HIGH') => {
        if (selectedType) {
            onInteract(selectedType, intensity);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"><X size={20} /></button>

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center gap-4 border-b border-slate-800">
                    <PlayerAvatar visual={player.visual} size="md" />
                    <div>
                        <h2 className="text-xl font-bold text-white">{player.firstName} {player.lastName}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span className={`font-bold ${player.morale > 75 ? 'text-emerald-400' : player.morale < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {t.modalMorale || 'Morale'}: {player.morale}%
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className={`font-bold ${player.condition > 80 ? 'text-emerald-400' : player.condition < 60 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {t.modalCondition || 'Condition'}: {player.condition}%
                            </span>
                        </div>
                        {/* Rating Impacts Summary */}
                        <div className="flex flex-wrap gap-1 mt-1">
                            {getRatingImpacts(player, normalizePos(player), player.condition).map((impact, idx) => (
                                <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${impact.value > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                    {impact.value > 0 ? '+' : ''}{impact.value} {
                                        impact.reason === 'POSITION' ? t.ratingImpactPosition :
                                            impact.reason === 'MORALE' ? t.ratingImpactMorale :
                                                impact.reason === 'CONDITION' ? t.ratingImpactCondition :
                                                    t.ratingImpactStable
                                    }
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {step === 'SELECT' ? (
                        <div className="space-y-4">
                            {/* NEW: Player Dialogue Bubble */}
                            <div className="bg-slate-800/80 rounded-lg p-4 mb-4 border border-slate-700 relative">
                                {/* Small triangle for speech bubble effect pointing to avatar */}
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-800/80 border-t border-l border-slate-700 transform rotate-45"></div>
                                <p className="text-sm text-slate-200 italic">
                                    "{(() => {
                                        const impacts = getRatingImpacts(player, normalizePos(player), player.condition);
                                        const hasPositionIssue = impacts.some(i => i.reason === 'POSITION');

                                        if (hasPositionIssue) return t.playerDialoguePositionIssue || "I'm not comfortable in this role, boss. I can't give my best here.";
                                        if (player.morale < 40) return t.playerDialogueMoraleLow || "To be honest, I'm not very happy with how things are going. I need a boost.";
                                        if (player.condition < 60) return t.playerDialogueConditionLow || "I'm feeling quite fatigued, boss. I might need a rest soon.";
                                        if (player.form >= 8) return t.playerDialogueFormHigh || "I'm feeling great, boss! Everything is going my way on the pitch.";
                                        if (player.form <= 4) return t.playerDialogueFormLow || "I know I've been struggling lately. I'm trying to find my rhythm.";
                                        return t.playerDialogueNeutral || "Ready for the next match, boss. What's on your mind?";
                                    })()}"
                                </p>
                            </div>

                            <p className="text-slate-400 text-sm mb-2">{t.chooseTopic || 'Choose a topic to discuss:'}</p>

                            <button onClick={() => handleSelect('PRAISE')} className="w-full bg-slate-800 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500 p-4 rounded-lg flex items-center gap-4 transition-all group">
                                <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><ThumbsUp size={20} /></div>
                                <div className="text-left">
                                    <div className="font-bold text-white">{t.praisePerformance}</div>
                                    <div className="text-xs text-slate-500">{t.praiseDesc}</div>
                                </div>
                            </button>

                            <button onClick={() => handleSelect('CRITICIZE')} className="w-full bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500 p-4 rounded-lg flex items-center gap-4 transition-all group">
                                <div className="bg-red-500/20 p-2 rounded-full text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors"><ThumbsDown size={20} /></div>
                                <div className="text-left">
                                    <div className="font-bold text-white">{t.criticizeForm}</div>
                                    <div className="text-xs text-slate-500">{t.criticizeDesc}</div>
                                </div>
                            </button>

                            <button onClick={() => handleSelect('MOTIVATE')} className="w-full bg-slate-800 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500 p-4 rounded-lg flex items-center gap-4 transition-all group">
                                <div className="bg-blue-500/20 p-2 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors"><TrendingUp size={20} /></div>
                                <div className="text-left">
                                    <div className="font-bold text-white">{t.encourage}</div>
                                    <div className="text-xs text-slate-500">{t.encourageDesc}</div>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setStep('SELECT')} className="text-xs text-slate-500 hover:text-white mb-4">&larr; {t.back || 'Back'}</button>
                            <h3 className="text-lg font-bold text-white mb-4">
                                {selectedType === 'PRAISE' && (t.praisePlayerTitle || "Praise Player")}
                                {selectedType === 'CRITICIZE' && (t.criticizePlayerTitle || "Criticize Player")}
                                {selectedType === 'MOTIVATE' && (t.motivatePlayerTitle || "Motivate Player")}
                            </h3>

                            <div className="space-y-3">
                                <button onClick={() => execute('LOW')} className="w-full p-3 rounded bg-slate-700 hover:bg-slate-600 text-left text-sm text-slate-200 border border-slate-600">
                                    {selectedType === 'PRAISE' && (t.praisePlayer || 'Praise Player')}
                                    {selectedType === 'CRITICIZE' && (t.criticizePlayer || 'Criticize Player')}
                                    {selectedType === 'MOTIVATE' && (t.motivatePlayer || 'Motivate Player')}
                                    <span className="block text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{t.calmTone || 'Calm (Low Intensity)'}</span>
                                </button>

                                <button onClick={() => execute('HIGH')} className="w-full p-3 rounded bg-slate-700 hover:bg-slate-600 text-left text-sm text-slate-200 border border-slate-600">
                                    {selectedType === 'PRAISE' && (t.praisePlayer || 'Praise Player') + "!!!"}
                                    {selectedType === 'CRITICIZE' && (t.criticizePlayer || 'Criticize Player') + "!!!"}
                                    {selectedType === 'MOTIVATE' && (t.motivatePlayer || 'Motivate Player') + "!!!"}
                                    <span className="block text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{t.passionateTone || 'Passionate (High Intensity)'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
