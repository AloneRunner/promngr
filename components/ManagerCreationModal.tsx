import React, { useMemo, useState } from 'react';
import { X, UserCircle2, Flag, Sparkles } from 'lucide-react';
import { LEAGUE_PRESETS } from '../src/data/teams';
import { ManagerArchetype, ManagerCreationData } from '../types';

interface ManagerCreationModalProps {
    leagueName?: string;
    defaultNationality: string;
    startingReputation: number;
    onBack: () => void;
    onCreate: (data: ManagerCreationData) => void;
}

const ARCHETYPE_OPTIONS: Array<{
    value: ManagerArchetype;
    title: string;
    description: string;
}> = [
    {
        value: ManagerArchetype.TACTICIAN,
        title: 'Taktisyen',
        description: 'Mac plani, saha ici organizasyon ve yapisal disiplin odagi.'
    },
    {
        value: ManagerArchetype.MOTIVATOR,
        title: 'Motivator',
        description: 'Moral, baski maclari ve oyuncu yonetimi odagi.'
    },
    {
        value: ManagerArchetype.NEGOTIATOR,
        title: 'Pazarlikci',
        description: 'Transfer iknasi, maas gorusmeleri ve yonetimle butce pazarligi odagi.'
    },
    {
        value: ManagerArchetype.SCOUT,
        title: 'Scout',
        description: 'Oyuncu bilgi toplama, potansiyel okuma ve rapor kalitesi odagi.'
    },
];

export const ManagerCreationModal: React.FC<ManagerCreationModalProps> = ({
    leagueName,
    defaultNationality,
    startingReputation,
    onBack,
    onCreate,
}) => {
    const [firstName, setFirstName] = useState('Kaan');
    const [lastName, setLastName] = useState('Manager');
    const [nationality, setNationality] = useState(defaultNationality);
    const [archetype, setArchetype] = useState<ManagerArchetype>(ManagerArchetype.TACTICIAN);

    const nationalityOptions = useMemo(() => {
        const seen = new Set<string>();
        return LEAGUE_PRESETS
            .map((league) => ({ country: league.country, flag: league.flag || '🏳️' }))
            .filter((entry) => {
                if (seen.has(entry.country)) return false;
                seen.add(entry.country);
                return true;
            })
            .sort((a, b) => a.country.localeCompare(b.country));
    }, []);

    const isHomeNation = nationality === defaultNationality;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const safeFirstName = firstName.trim();
        const safeLastName = lastName.trim();
        if (!safeFirstName || !safeLastName) {
            alert('Lutfen ad ve soyad gir.');
            return;
        }

        onCreate({
            firstName: safeFirstName,
            lastName: safeLastName,
            nationality,
            archetype,
        });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="flex min-h-full items-center justify-center p-3 md:p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                    <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-bold mb-2">Manager Career</div>
                        <h2 className="text-xl md:text-2xl font-black text-white">Menajer Profili Olustur</h2>
                        <p className="text-sm text-slate-400 mt-1">Once menajerini yarat, sonra itibarina uygun kulubu sec.</p>
                    </div>
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="block">
                            <div className="text-sm text-slate-300 mb-2 font-medium flex items-center gap-2">
                                <UserCircle2 size={14} /> Ad
                            </div>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                maxLength={24}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        </label>
                        <label className="block">
                            <div className="text-sm text-slate-300 mb-2 font-medium">Soyad</div>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                maxLength={24}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <div className="text-sm text-slate-300 mb-2 font-medium flex items-center gap-2">
                            <Flag size={14} /> Uyruk
                        </div>
                        <select
                            value={nationality}
                            onChange={(e) => setNationality(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                        >
                            {nationalityOptions.map((option) => (
                                <option key={option.country} value={option.country}>
                                    {option.flag} {option.country}
                                </option>
                            ))}
                        </select>
                        <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${isHomeNation ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-800/70 text-slate-300'}`}>
                            {isHomeNation ? (
                                <span>Kendi ulkende basliyorsun: yonetim guveni +5, transfer iknasi +%5, scout bilgisi +%10.</span>
                            ) : (
                                <span>Yabanci ulkede basliyorsun: ekstra ulke bonusu yok, ama kariyer tavanin ayni.</span>
                            )}
                        </div>
                    </label>

                    <div>
                        <div className="text-sm text-slate-300 mb-3 font-medium flex items-center gap-2">
                            <Sparkles size={14} /> Baslangic Arketipi
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            {ARCHETYPE_OPTIONS.map((option) => {
                                const selected = archetype === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setArchetype(option.value)}
                                        className={`text-left rounded-2xl border p-4 transition-all ${selected ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}`}
                                    >
                                        <div className="font-bold text-white mb-1">{option.title}</div>
                                        <div className="text-sm text-slate-400 leading-relaxed">{option.description}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Baslangic Seviyesi</div>
                                <div className="text-white font-bold text-lg mt-1">Manager Rep {startingReputation}/100</div>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                {leagueName ? `${leagueName} icin kulup secimi sonraki adimda` : 'Kulup secimi sonraki adimda'}
                            </div>
                        </div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">Ilk Faz Notu</div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Tum yeni kariyerler ayni itibardan baslar. Boylece direkt en buyuk kulube atlama yerine kariyer basamagi korunur.
                            Sonraki ekranda sadece bu itibara uygun takimlar acik olacak.
                        </p>
                    </div>
                    </div>

                    <div className="sticky bottom-0 border-t border-slate-700 bg-slate-900/95 backdrop-blur px-4 md:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                            >
                                Lige Don
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-colors shadow-lg shadow-emerald-900/30"
                            >
                                Kariyeri Baslat
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
};
