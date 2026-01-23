import React, { useState } from 'react';
import { Translation } from '../types';
import { X, Sparkles, ChevronDown, ChevronUp, Heart, Shield, Trophy, Zap, Globe, TrendingDown, CalendarCheck } from 'lucide-react';

interface UpdatesModalProps {
    onClose: () => void;
    t: Translation;
}

interface UpdateItem {
    icon: React.ReactNode;
    titleKey: string;
    descKey: string;
}

interface VersionUpdate {
    version: string;
    date: string;
    titleKey: string;
    items: UpdateItem[];
}

// Version history - newest first
const VERSION_HISTORY: VersionUpdate[] = [
    {
        version: 'Dev Log',
        date: new Date().toISOString().split('T')[0],
        titleKey: 'devLogTitle',
        items: [
            { icon: <Heart className="text-pink-400" size={16} />, titleKey: 'updateApologyTitle', descKey: 'updateApologyDesc' },
            { icon: <Zap className="text-yellow-400" size={16} />, titleKey: 'updateCurrentWorkTitle', descKey: 'updateCurrentWorkDesc' },
            { icon: <Shield className="text-emerald-400" size={16} />, titleKey: 'updateSimulationTitle', descKey: 'updateSimulationDesc' },
            { icon: <Globe className="text-blue-400" size={16} />, titleKey: 'updateFuturePlansTitle', descKey: 'updateFuturePlansDesc' },
            { icon: <Sparkles className="text-purple-400" size={16} />, titleKey: 'updateReportTitle', descKey: 'updateReportDesc' },
        ]
    }
];

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ onClose, t }) => {
    const [expandedVersion, setExpandedVersion] = useState<string>('Dev Log');

    const getTranslation = (key: string): string => {
        return (t as any)[key] || key;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-purple-900 to-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-purple-400" size={24} />
                        {getTranslation('updatesTitle')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <X className="text-slate-400" size={20} />
                    </button>
                </div>

                {/* Version List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {VERSION_HISTORY.map((version) => (
                        <div
                            key={version.version}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
                        >
                            {/* Version Header */}
                            <button
                                onClick={() => setExpandedVersion(expandedVersion === version.version ? '' : version.version)}
                                className="w-full p-3 flex justify-between items-center hover:bg-slate-700/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                                        v{version.version}
                                    </span>
                                    <span className="text-white font-bold">{getTranslation(version.titleKey)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{version.date}</span>
                                    {expandedVersion === version.version ? (
                                        <ChevronUp className="text-slate-400" size={18} />
                                    ) : (
                                        <ChevronDown className="text-slate-400" size={18} />
                                    )}
                                </div>
                            </button>

                            {/* Version Details */}
                            {expandedVersion === version.version && (
                                <div className="p-3 pt-0 space-y-2 animate-fade-in">
                                    {version.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                {item.icon}
                                                <span className="text-white font-semibold text-sm">
                                                    {getTranslation(item.titleKey)}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-xs pl-6">
                                                {getTranslation(item.descKey)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 text-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all"
                    >
                        {getTranslation('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
