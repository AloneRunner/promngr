
import React from 'react';
import { AssistantAdvice, Translation } from '../types';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert, Wand2, X } from 'lucide-react';

interface AssistantReportProps {
  advice: AssistantAdvice[];
  onAutoFix: () => void;
  onClose: () => void;
  t: Translation;
}

export const AssistantReport: React.FC<AssistantReportProps> = ({ advice, onAutoFix, onClose, t }) => {
  const critical = advice.filter(a => a.type === 'CRITICAL');
  const warnings = advice.filter(a => a.type === 'WARNING');
  const info = advice.filter(a => a.type === 'INFO');

  const hasCritical = critical.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-sm p-4 pt-16 animate-fade-in overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert size={20} className={hasCritical ? 'text-red-500' : 'text-emerald-500'} /> 
                    {t.assistantManager}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                
                {advice.length === 0 && (
                    <div className="text-center py-8">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-white font-bold">{t.clubHealth}: 100%</p>
                        <p className="text-slate-400 text-sm">{t.squadReady}</p>
                    </div>
                )}

                {critical.length > 0 && (
                    <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4">
                        <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2 text-sm uppercase"><AlertTriangle size={14}/> {t.criticalIssues}</h3>
                        <ul className="space-y-2">
                            {critical.map((item, i) => (
                                <li key={i} className="text-sm text-red-200 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    {item.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {warnings.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-4">
                        <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2 text-sm uppercase"><AlertTriangle size={14}/> {t.warnings}</h3>
                        <ul className="space-y-2">
                            {warnings.map((item, i) => (
                                <li key={i} className="text-sm text-yellow-200 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-yellow-500 rounded-full flex-shrink-0"></span>
                                    {item.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {info.length > 0 && (
                    <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4">
                        <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2 text-sm uppercase"><Info size={14}/> {t.suggestions}</h3>
                        <ul className="space-y-2">
                            {info.map((item, i) => (
                                <li key={i} className="text-sm text-blue-200 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    {item.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-4">
                <button 
                    onClick={() => {
                        onAutoFix();
                        onClose();
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Wand2 size={18} /> {t.autoFix}
                </button>
                <button 
                    onClick={onClose}
                    className="px-6 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg font-bold"
                >
                    {t.close}
                </button>
            </div>
        </div>
    </div>
  );
};
