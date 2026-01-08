
import React, { useState } from 'react';
import { Sponsor, Translation } from '../types';
import { Briefcase, CheckCircle2, DollarSign } from 'lucide-react';
import { generateSponsors } from '../services/engine';

interface SponsorModalProps {
    onSelect: (sponsor: Sponsor) => void;
    t: Translation;
}

export const SponsorModal: React.FC<SponsorModalProps> = ({ onSelect, t }) => {
    const [offers] = useState<Sponsor[]>(generateSponsors());
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl max-w-sm sm:max-w-lg md:max-w-4xl w-full p-4 sm:p-6 md:p-8 shadow-2xl relative flex flex-col my-4 md:my-0">

                <div className="text-center mb-4 md:mb-6">
                    <div className="text-emerald-500 font-bold tracking-widest text-xs uppercase mb-1">OFFICIAL PARTNERS</div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{t.sponsorTitle}</h2>
                    <p className="text-slate-400 text-sm md:text-base">{t.sponsorSelect}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 md:gap-4 mb-4 md:mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {offers.map((offer) => (
                        <div
                            key={offer.id}
                            onClick={() => setSelectedId(offer.id)}
                            className={`cursor-pointer rounded-xl p-4 border transition-all relative group ${selectedId === offer.id
                                ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-base font-bold truncate transition-colors ${selectedId === offer.id ? 'text-emerald-400' : 'text-white'}`}>{offer.name}</h3>
                                    <p className="text-xs text-slate-400 truncate">{offer.description}</p>
                                </div>
                                <div className="flex gap-4 items-center ml-3">
                                    <div className="text-right">
                                        <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Weekly</div>
                                        <div className="text-sm font-mono text-emerald-400 font-bold">€{(offer.weeklyIncome / 1000).toFixed(0)}k</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Bonus</div>
                                        <div className="text-sm font-mono text-blue-400 font-bold">€{(offer.winBonus / 1000).toFixed(0)}k</div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${selectedId === offer.id ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-600 bg-slate-800'}`}>
                                        {selectedId === offer.id && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    disabled={!selectedId}
                    onClick={() => {
                        const sponsor = offers.find(o => o.id === selectedId);
                        if (sponsor) onSelect(sponsor);
                    }}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${selectedId
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                        : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                >
                    {t.signContract}
                </button>

            </div>
        </div>
    );
};
