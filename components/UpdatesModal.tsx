import React from 'react';
import { Translation } from '../types';
import { X, Heart, Mail } from 'lucide-react';

interface UpdatesModalProps {
    onClose: () => void;
    t: Translation;
}

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ onClose, t }) => {
    const getTranslation = (key: string): string => {
        return (t as any)[key] || key;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-purple-900 to-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Mail className="text-purple-400" size={24} />
                        {getTranslation('devLetterTitle')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <X className="text-slate-400" size={20} />
                    </button>
                </div>

                {/* Letter Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-4">
                        {/* Greeting */}
                        <p className="text-white font-semibold text-lg">
                            {getTranslation('devLetterGreeting')}
                        </p>

                        {/* Main Letter Text */}
                        <div className="text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-line">
                            <p>{getTranslation('devLetterParagraph1')}</p>
                            <p>{getTranslation('devLetterParagraph2')}</p>
                            <p>{getTranslation('devLetterParagraph3')}</p>
                            <p>{getTranslation('devLetterParagraph4')}</p>
                            <p>{getTranslation('devLetterParagraph5')}</p>
                            <p>{getTranslation('devLetterParagraph6')}</p>
                        </div>

                        {/* Signature */}
                        <div className="pt-4 border-t border-slate-700/50">
                            <p className="text-slate-400 text-sm italic">
                                {getTranslation('devLetterSignature')}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <Heart className="text-pink-500" size={16} />
                                <span className="text-white font-semibold">
                                    {getTranslation('devLetterAuthor')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Version Badge */}
                    <div className="mt-4 text-center">
                        <span className="bg-purple-600/30 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
                            v3.4 - {getTranslation('devLetterDate')}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 text-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all"
                    >
                        {getTranslation('devLetterContinue')}
                    </button>
                </div>
            </div>
        </div>
    );
};
