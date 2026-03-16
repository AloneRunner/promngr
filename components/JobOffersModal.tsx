import React from 'react';
import { JobOffer, Translation } from '../types';
import { X, Briefcase, MapPin, Trophy, DollarSign, CheckCircle, Target, Flame, Shield } from 'lucide-react';

interface JobOffersModalProps {
    offers: JobOffer[];
    currentTeamId: string;
    currentSalary?: number;
    onAccept: (offer: JobOffer) => void;
    onClose: () => void;
    t: Translation;
}

export const JobOffersModal: React.FC<JobOffersModalProps> = ({
    offers,
    currentTeamId,
    currentSalary = 0,
    onAccept,
    onClose,
    t
}) => {
    const formatSalaryDelta = (salary: number) => {
        if (!currentSalary) return null;
        const delta = salary - currentSalary;
        if (delta === 0) return 'Aynı maaş';
        const prefix = delta > 0 ? '+' : '';
        return `${prefix}€${delta.toLocaleString()}/wk`;
    };

    const getPressureStyle = (pressure: JobOffer['pressure']) => {
        switch (pressure) {
            case 'EXTREME':
                return 'bg-red-500/15 text-red-300 border-red-500/30';
            case 'HIGH':
                return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
            case 'MEDIUM':
                return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
            default:
                return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
        }
    };

    const getPressureLabel = (pressure: JobOffer['pressure']) => {
        switch (pressure) {
            case 'EXTREME': return 'Aşırı Baskı';
            case 'HIGH': return 'Yüksek Baskı';
            case 'MEDIUM': return 'Orta Baskı';
            default: return 'Düşük Baskı';
        }
    };

    const getSalaryLevelStyle = (salaryLevel: JobOffer['salaryLevel']) => {
        switch (salaryLevel) {
            case 'ELITE':
                return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
            case 'STRONG':
                return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
            case 'FAIR':
                return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
            default:
                return 'bg-stone-500/15 text-stone-300 border-stone-500/30';
        }
    };

    const getSalaryLevelLabel = (salaryLevel: JobOffer['salaryLevel']) => {
        switch (salaryLevel) {
            case 'ELITE': return 'Elit Maaş';
            case 'STRONG': return 'Güçlü Maaş';
            case 'FAIR': return 'Adil Maaş';
            default: return 'Mütevazı Maaş';
        }
    };

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-3 md:p-4 animate-fade-in">
            <div className="min-h-full flex items-start md:items-center justify-center">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden max-h-[calc(100vh-1.5rem)] md:max-h-[calc(100vh-3rem)] flex flex-col my-3 md:my-6">
                {/* Header */}
                <div className="shrink-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-slate-700 flex justify-between items-center gap-3">
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
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {offers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Henüz iş teklifi yok</p>
                            <p className="text-xs mt-2">{t.offersEndSeason || 'Offers will arrive at the end of the season based on your performance'}</p>
                        </div>
                    ) : (
                        offers.map((offer, idx) => (
                            <div
                                key={offer.id}
                                className={`bg-slate-800/50 rounded-xl p-4 border transition-all hover:border-purple-500/50 ${idx === 0 ? 'border-yellow-500/30 ring-1 ring-yellow-500/20' : 'border-slate-700'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
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
                                            <span className="text-slate-500 text-xs">/{t.weekPeriod || 'wk'}</span>
                                            {formatSalaryDelta(offer.salary) && (
                                                <span className={`text-xs font-semibold ${offer.salary >= currentSalary ? 'text-emerald-300' : 'text-red-300'}`}>
                                                    {formatSalaryDelta(offer.salary)}
                                                </span>
                                            )}
                                        </div>

                                            <div className="mt-4 grid gap-2">
                                                <div className="flex items-start gap-2 text-sm text-slate-300">
                                                    <Target size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                                                    <span>{offer.objective}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getPressureStyle(offer.pressure)}`}>
                                                        <Flame size={12} />
                                                        {getPressureLabel(offer.pressure)}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getSalaryLevelStyle(offer.salaryLevel)}`}>
                                                        <Shield size={12} />
                                                        {getSalaryLevelLabel(offer.salaryLevel)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900/50 px-2.5 py-1 text-xs font-semibold text-slate-300">
                                                        Gereken Rep {offer.requiredRating}
                                                    </span>
                                                </div>
                                            </div>
                                    </div>

                                    {/* Accept Button */}
                                    <button
                                        onClick={() => onAccept(offer)}
                                        className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
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
                <div className="shrink-0 p-4 bg-slate-900/50 border-t border-slate-700 text-center pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                    <p className="text-slate-500 text-xs">
                        💡 Teklifi kabul ettiğinizde yeni takımınıza geçiş yaparsınız
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
};
