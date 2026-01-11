
import React, { useState } from 'react';
import { Player, Translation } from '../types';
import { MessageSquare, ThumbsUp, ThumbsDown, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"><X size={20} /></button>

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center gap-4 border-b border-slate-800">
                    <PlayerAvatar visual={player.visual} size="md" />
                    <div>
                        <h2 className="text-xl font-bold text-white">{player.firstName} {player.lastName}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span className={`font-bold ${player.morale > 75 ? 'text-emerald-400' : player.morale < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                                Morale: {player.morale}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {step === 'SELECT' ? (
                        <div className="space-y-3">
                            <p className="text-slate-400 text-sm mb-4">Choose a topic to discuss with the player.</p>

                            <button onClick={() => handleSelect('PRAISE')} className="w-full bg-slate-800 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500 p-4 rounded-lg flex items-center gap-4 transition-all group">
                                <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><ThumbsUp size={20} /></div>
                                <div className="text-left">
                                    <div className="font-bold text-white">Praise Performance</div>
                                    <div className="text-xs text-slate-500">Boost morale if playing well.</div>
                                </div>
                            </button>

                            <button onClick={() => handleSelect('CRITICIZE')} className="w-full bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500 p-4 rounded-lg flex items-center gap-4 transition-all group">
                                <div className="bg-red-500/20 p-2 rounded-full text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors"><ThumbsDown size={20} /></div>
                                <div className="text-left">
                                    <div className="font-bold text-white">Criticize Form</div>
                                    <div className="text-xs text-slate-500">Demand better results. Risky.</div>
                                </div>
                            </button>

                            <button onClick={() => handleSelect('MOTIVATE')} className="w-full bg-slate-800 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500 p-4 rounded-lg flex items-center gap-4 transition-all group">
                                <div className="bg-blue-500/20 p-2 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors"><TrendingUp size={20} /></div>
                                <div className="text-left">
                                    <div className="font-bold text-white">Encourage</div>
                                    <div className="text-xs text-slate-500">Help with confidence issues.</div>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setStep('SELECT')} className="text-xs text-slate-500 hover:text-white mb-4">&larr; Back</button>
                            <h3 className="text-lg font-bold text-white mb-4">
                                {selectedType === 'PRAISE' && "Praise Player"}
                                {selectedType === 'CRITICIZE' && "Criticize Player"}
                                {selectedType === 'MOTIVATE' && "Motivate Player"}
                            </h3>

                            <div className="space-y-3">
                                <button onClick={() => execute('LOW')} className="w-full p-3 rounded bg-slate-700 hover:bg-slate-600 text-left text-sm text-slate-200 border border-slate-600">
                                    {selectedType === 'PRAISE' && "Good job recently, keep it up."}
                                    {selectedType === 'CRITICIZE' && "You need to step up your game."}
                                    {selectedType === 'MOTIVATE' && "I believe in your ability."}
                                    <span className="block text-[10px] text-slate-500 mt-1 uppercase tracking-wide">Calm Tone</span>
                                </button>

                                <button onClick={() => execute('HIGH')} className="w-full p-3 rounded bg-slate-700 hover:bg-slate-600 text-left text-sm text-slate-200 border border-slate-600">
                                    {selectedType === 'PRAISE' && "You are absolutely world class!"}
                                    {selectedType === 'CRITICIZE' && "This performance is unacceptable!"}
                                    {selectedType === 'MOTIVATE' && "You are the key to our success!"}
                                    <span className="block text-[10px] text-slate-500 mt-1 uppercase tracking-wide">Passionate Tone</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
