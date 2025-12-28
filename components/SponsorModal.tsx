
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    {offers.map((offer) => (
                        <div
                            key={offer.id}
                            onClick={() => setSelectedId(offer.id)}
                            className={`cursor-pointer rounded-xl p-4 md:p-6 border-2 transition-all relative overflow-hidden group ${selectedId === offer.id
                                    ? 'bg-emerald-900/20 border-emerald-500 scale-100 md:scale-105 shadow-xl shadow-emerald-900/20'
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                }`}
                        >
                            {selectedId === offer.id && (
                                <div className="absolute top-2 right-2 text-emerald-500">
                                    <CheckCircle2 />
                                </div>
                            )}

                            <div className="mb-2 md:mb-4">
                                <h3 className="text-base md:text-xl font-bold text-white">{offer.name}</h3>
                                <p className="text-xs md:text-sm text-slate-500">{offer.description}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-900/50 p-3 rounded">
                                    <div className="text-xs text-slate-500 uppercase">{t.weeklyIncome}</div>
                                    <div className="text-lg font-mono text-emerald-400 font-bold">€{(offer.weeklyIncome / 1000).toFixed(0)}k</div>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded">
                                    <div className="text-xs text-slate-500 uppercase">{t.winBonus}</div>
                                    <div className="text-lg font-mono text-blue-400 font-bold">€{(offer.winBonus / 1000).toFixed(0)}k</div>
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
