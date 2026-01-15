import React from 'react';
import { JobOffer, Translation } from '../types';
import { X, Briefcase, MapPin, Trophy, DollarSign, CheckCircle } from 'lucide-react';

interface JobOffersModalProps {
    offers: JobOffer[];
    currentTeamId: string;
    onAccept: (offer: JobOffer) => void;
    onClose: () => void;
    t: Translation;
}

export const JobOffersModal: React.FC<JobOffersModalProps> = ({
    offers,
    currentTeamId,
    onAccept,
    onClose,
    t
}) => {
    const getReputationColor = (rep: number) => {
        if (rep >= 9000) return 'text-yellow-400';
        if (rep >= 8000) return 'text-emerald-400';
        if (rep >= 7000) return 'text-blue-400';
        return 'text-slate-400';
    };

    const getReputationLabel = (rep: number) => {
        if (rep >= 9500) return 'Elit';
        if (rep >= 9000) return 'Dünya Devi';
        if (rep >= 8500) return 'Avrupa Devi';
        if (rep >= 8000) return 'Güçlü';
        if (rep >= 7000) return 'Orta';
        return 'Gelişen';
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                            <Briefcase className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">İş Teklifleri</h2>
                            <p className="text-slate-400 text-sm">{offers.length} teklif mevcut</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Offers List */}
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    {offers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Henüz iş teklifi yok</p>
                            <p className="text-xs mt-2">Sezon sonunda performansına göre teklifler gelecek</p>
                        </div>
                    ) : (
                        offers.map((offer, idx) => (
                            <div
                                key={offer.id}
                                className={`bg-slate-800/50 rounded-xl p-4 border transition-all hover:border-purple-500/50 ${idx === 0 ? 'border-yellow-500/30 ring-1 ring-yellow-500/20' : 'border-slate-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    {/* Team Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {idx === 0 && (
                                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full">
                                                    EN İYİ TEKLİF
                                                </span>
                                            )}
                                            <span className="text-slate-500 text-xs">#{idx + 1}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1">{offer.teamName}</h3>

                                        <div className="flex flex-wrap gap-3 text-sm">
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <MapPin size={12} /> {offer.leagueName}
                                            </span>
                                            <span className={`flex items-center gap-1 ${getReputationColor(offer.reputation)}`}>
                                                <Trophy size={12} /> {offer.reputation.toLocaleString()} ({getReputationLabel(offer.reputation)})
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <DollarSign size={14} className="text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">€{offer.salary.toLocaleString()}</span>
                                            <span className="text-slate-500 text-xs">/hafta</span>
                                        </div>
                                    </div>

                                    {/* Accept Button */}
                                    <button
                                        onClick={() => onAccept(offer)}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        Kabul Et
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-900/50 border-t border-slate-700 text-center">
                    <p className="text-slate-500 text-xs">
                        💡 Teklifi kabul ettiğinizde yeni takımınıza geçiş yaparsınız
                    </p>
                </div>
            </div>
        </div>
    );
};
