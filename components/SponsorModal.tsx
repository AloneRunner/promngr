
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
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm sm:max-w-lg md:max-w-4xl w-full p-4 sm:p-6 md:p-8 shadow-2xl relative flex flex-col my-4 md:my-0">

                <div className="text-center mb-4 md:mb-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{t.sponsorTitle}</h2>
                    <p className="text-slate-400 text-sm md:text-base">{t.sponsorSelect}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 md:gap-4 mb-4 md:mb-8 max-h-[60vh] overflow-y-auto">
                    {offers.map((offer) => (
                        <div
                            key={offer.id}
                            onClick={() => setSelectedId(offer.id)}
                            className={`cursor-pointer rounded-lg p-3 border-2 transition-all relative ${selectedId === offer.id
                                ? 'bg-emerald-900/20 border-emerald-500'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white truncate">{offer.name}</h3>
                                    <p className="text-[10px] text-slate-500 truncate">{offer.description}</p>
                                </div>
                                <div className="flex gap-3 items-center ml-3">
                                    <div className="text-right">
                                        <div className="text-[9px] text-slate-500 uppercase">Haftalık</div>
                                        <div className="text-sm font-mono text-emerald-400 font-bold">€{(offer.weeklyIncome / 1000).toFixed(0)}k</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-slate-500 uppercase">Galibiyet</div>
                                        <div className="text-sm font-mono text-blue-400 font-bold">€{(offer.winBonus / 1000).toFixed(0)}k</div>
                                    </div>
                                    {selectedId === offer.id && (
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                    )}
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
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${selectedId
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {t.signContract}
                </button>

            </div>
        </div>
    );
};
