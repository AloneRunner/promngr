import React, { useState } from 'react';
import { Sponsor, Translation } from '../types';
import { Briefcase, Check, TrendingUp, Trophy, Shield, Flame, Zap, Crown, Medal, Award } from 'lucide-react';

interface SponsorModalProps {
    onSelect: (sponsor: Sponsor) => void;
    t: Translation;
}

type SponsorTier = 'GUARANTEED' | 'BALANCED' | 'RISKY';

interface SponsorWithTier extends Sponsor {
    tier: SponsorTier;
    riskLevel: number; // 1-5
}

// Gerçekçi sponsorluk değerleri
// GARANTİLİ: ~3M EUR/yıl garantili (iyi haftalık, düşük prim)
// DENGELİ: ~4-5M EUR/yıl potansiyel (orta haftalık, orta prim)
// RİSKLİ: ~7-8M EUR/yıl potansiyel (düşük haftalık, yüksek galibiyet + şampiyonluk primleri)
const generateSponsors = (): SponsorWithTier[] => {
    return [
        // === GARANTİLİ SPONSORLAR (~3M EUR/yıl güvence) ===
        {
            id: 'sponsor_safe_1',
            name: 'SafeBank Financial',
            description: '🏦 Banka sponsoru - Stabil ve garantili gelir',
            weeklyIncome: 55000,    // 55K * 52 hafta = ~2.86M EUR/yıl HAFTALİK
            winBonus: 5000,         // Düşük prim (sembolik)
            duration: 1,
            bonus1st: 100000,       // Küçük şampiyonluk primi
            bonus2nd: 50000,
            bonus3rd: 25000,
            tier: 'GUARANTEED',
            riskLevel: 1
        },
        {
            id: 'sponsor_safe_2',
            name: 'TelekomPlus',
            description: '📱 Telekomünikasyon - Güvenilir anlaşma',
            weeklyIncome: 60000,    // ~3.12M EUR/yıl
            winBonus: 3000,         // Çok düşük prim
            duration: 1,
            bonus1st: 75000,
            bonus2nd: 40000,
            bonus3rd: 20000,
            tier: 'GUARANTEED',
            riskLevel: 1
        },

        // === DENGELİ SPONSORLAR (~4-5M EUR/yıl potansiyel) ===
        {
            id: 'sponsor_balanced_1',
            name: 'GoldStar Energy',
            description: '⚡ Enerji içeceği - Dengeli risk/kazanç',
            weeklyIncome: 40000,    // ~2.08M EUR/yıl baz
            winBonus: 20000,        // Her galibiyet +20K
            duration: 1,
            bonus1st: 500000,       // Şampiyon = +500K
            bonus2nd: 250000,       // 2. = +250K
            bonus3rd: 125000,       // 3. = +125K
            tier: 'BALANCED',
            riskLevel: 3
        },
        {
            id: 'sponsor_balanced_2',
            name: 'SportMax Gear',
            description: '👟 Spor ekipmanları - Performansa dayalı',
            weeklyIncome: 35000,    // ~1.82M EUR/yıl baz
            winBonus: 25000,        // Her galibiyet +25K
            duration: 1,
            bonus1st: 600000,
            bonus2nd: 300000,
            bonus3rd: 150000,
            tier: 'BALANCED',
            riskLevel: 3
        },

        // === RİSKLİ SPONSORLAR (~7-8M EUR/yıl POTANSİYEL) ===
        {
            id: 'sponsor_risky_1',
            name: 'CryptoVentures',
            description: '🎰 Kripto girişim - Şampiyonluk hedefle!',
            weeklyIncome: 15000,    // ~780K EUR/yıl baz (çok düşük!)
            winBonus: 60000,        // Her galibiyet = 60K 
            duration: 1,
            bonus1st: 3000000,      // ŞAMPİYON = 3M EUR!!!
            bonus2nd: 1500000,      // 2. = 1.5M EUR
            bonus3rd: 750000,       // 3. = 750K EUR
            tier: 'RISKY',
            riskLevel: 5
        },
        {
            id: 'sponsor_risky_2',
            name: 'BetKing Gaming',
            description: '🎲 Bahis şirketi - Kazanırsan büyük kazan!',
            weeklyIncome: 10000,    // ~520K EUR/yıl baz (en düşük)
            winBonus: 75000,        // Her galibiyet = 75K
            duration: 1,
            bonus1st: 3500000,      // ŞAMPİYON = 3.5M EUR!!!
            bonus2nd: 1750000,      // 2. = 1.75M EUR
            bonus3rd: 875000,       // 3. = 875K EUR
            tier: 'RISKY',
            riskLevel: 5
        },
        {
            id: 'sponsor_risky_3',
            name: 'StartupX Tech',
            description: '🚀 Tech startup - Başarı primi odaklı',
            weeklyIncome: 20000,    // ~1.04M EUR/yıl baz
            winBonus: 50000,        // Her galibiyet = 50K
            duration: 1,
            bonus1st: 2500000,      // ŞAMPİYON = 2.5M EUR
            bonus2nd: 1250000,      // 2. = 1.25M EUR
            bonus3rd: 600000,       // 3. = 600K EUR
            tier: 'RISKY',
            riskLevel: 4
        }
    ];
};

const getTierColor = (tier: SponsorTier) => {
    switch (tier) {
        case 'GUARANTEED': return 'text-emerald-400 bg-emerald-900/30 border-emerald-600';
        case 'BALANCED': return 'text-blue-400 bg-blue-900/30 border-blue-600';
        case 'RISKY': return 'text-orange-400 bg-orange-900/30 border-orange-600';
    }
};

const getTierIcon = (tier: SponsorTier) => {
    switch (tier) {
        case 'GUARANTEED': return <Shield className="text-emerald-400" size={16} />;
        case 'BALANCED': return <Zap className="text-blue-400" size={16} />;
        case 'RISKY': return <Flame className="text-orange-400" size={16} />;
    }
};

const getTierLabel = (tier: SponsorTier) => {
    switch (tier) {
        case 'GUARANTEED': return 'GARANTİLİ';
        case 'BALANCED': return 'DENGELİ';
        case 'RISKY': return 'RİSKLİ';
    }
};

// Yıllık potansiyel gelir hesapla (Lig sezonu 34 hafta, ortalama 17 galibiyet şampiyon için)
const calculateYearlyPotential = (sponsor: SponsorWithTier, winsPerSeason: number = 17, placement: 1 | 2 | 3 | 4 = 4) => {
    const weeklyTotal = sponsor.weeklyIncome * 52;
    const winBonusTotal = sponsor.winBonus * winsPerSeason;
    let placementBonus = 0;
    if (placement === 1) placementBonus = sponsor.bonus1st || 0;
    else if (placement === 2) placementBonus = sponsor.bonus2nd || 0;
    else if (placement === 3) placementBonus = sponsor.bonus3rd || 0;
    return weeklyTotal + winBonusTotal + placementBonus;
};

export const SponsorModal: React.FC<SponsorModalProps> = ({ onSelect, t }) => {
    const [selectedSponsor, setSelectedSponsor] = useState<SponsorWithTier | null>(null);
    const [filterTier, setFilterTier] = useState<SponsorTier | 'ALL'>('ALL');
    const sponsors = generateSponsors();

    const filteredSponsors = filterTier === 'ALL'
        ? sponsors
        : sponsors.filter(s => s.tier === filterTier);

    const handleConfirm = () => {
        if (selectedSponsor) {
            onSelect(selectedSponsor);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 pb-20">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl mb-16">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-emerald-900 to-slate-900 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Briefcase className="text-emerald-400" size={24} />
                        {t.sponsorTitle || 'Sponsor Seçimi'}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {t.sponsorSelect || 'Sezonluk ana sponsorunu seç.'}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 p-3 bg-slate-800/50 border-b border-slate-700">
                    {(['ALL', 'GUARANTEED', 'BALANCED', 'RISKY'] as const).map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setFilterTier(tier)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${filterTier === tier
                                ? tier === 'ALL' ? 'bg-slate-600 text-white' : getTierColor(tier as SponsorTier)
                                : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            {tier === 'ALL' ? 'Tümü' : getTierLabel(tier)}
                        </button>
                    ))}
                </div>

                {/* Sponsor List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredSponsors.map((sponsor) => {
                        // Farklı senaryolar için hesapla
                        const yearlyMin = sponsor.weeklyIncome * 52; // 0 galibiyet, son sıra
                        const yearlyMid = calculateYearlyPotential(sponsor, 12, 4); // Orta sıra (12 galibiyet)
                        const yearlyChamp = calculateYearlyPotential(sponsor, 17, 1); // Şampiyon (17 galibiyet)

                        return (
                            <div
                                key={sponsor.id}
                                onClick={() => setSelectedSponsor(sponsor)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedSponsor?.id === sponsor.id
                                    ? 'bg-emerald-900/40 border-emerald-500 shadow-lg shadow-emerald-900/30 scale-[1.01]'
                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {getTierIcon(sponsor.tier)}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getTierColor(sponsor.tier)}`}>
                                                {getTierLabel(sponsor.tier)}
                                            </span>
                                            <h3 className="font-bold text-white text-lg">{sponsor.name}</h3>
                                            {selectedSponsor?.id === sponsor.id && (
                                                <Check className="text-emerald-400" size={18} />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400">{sponsor.description}</p>
                                    </div>

                                    {/* Risk Indicator */}
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className={`w-2 h-4 rounded-sm ${i <= sponsor.riskLevel
                                                    ? sponsor.riskLevel >= 4 ? 'bg-orange-500' : sponsor.riskLevel >= 3 ? 'bg-blue-500' : 'bg-emerald-500'
                                                    : 'bg-slate-700'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Gelir Bilgileri */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                    <div className="bg-slate-900/50 px-3 py-2 rounded">
                                        <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                                            <TrendingUp size={10} /> Haftalık
                                        </div>
                                        <div className="font-bold text-emerald-400">€{sponsor.weeklyIncome.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-slate-900/50 px-3 py-2 rounded">
                                        <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                                            <Trophy size={10} /> Galibiyet
                                        </div>
                                        <div className="font-bold text-yellow-400">€{sponsor.winBonus.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-slate-900/50 px-3 py-2 rounded">
                                        <div className="text-[10px] text-slate-500 uppercase">Min/Yıl</div>
                                        <div className="font-mono text-sm text-slate-400">€{(yearlyMin / 1000000).toFixed(1)}M</div>
                                    </div>
                                    <div className="bg-slate-900/50 px-3 py-2 rounded">
                                        <div className="text-[10px] text-slate-500 uppercase">Şampiyon/Yıl</div>
                                        <div className="font-mono text-sm text-amber-400">€{(yearlyChamp / 1000000).toFixed(1)}M</div>
                                    </div>
                                </div>

                                {/* Şampiyonluk Primleri */}
                                {(sponsor.bonus1st || sponsor.bonus2nd || sponsor.bonus3rd) && (
                                    <div className="bg-slate-900/70 rounded p-2">
                                        <div className="text-[10px] text-slate-500 uppercase mb-2 flex items-center gap-1">
                                            <Crown size={10} className="text-yellow-400" /> Sezon Sonu Primleri
                                        </div>
                                        <div className="flex gap-3 flex-wrap">
                                            {sponsor.bonus1st && (
                                                <div className="flex items-center gap-1 bg-yellow-900/30 px-2 py-1 rounded border border-yellow-700/50">
                                                    <Crown size={12} className="text-yellow-400" />
                                                    <span className="text-xs text-yellow-400 font-bold">1.</span>
                                                    <span className="text-xs text-white font-mono">€{(sponsor.bonus1st / 1000000).toFixed(1)}M</span>
                                                </div>
                                            )}
                                            {sponsor.bonus2nd && (
                                                <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded border border-slate-600/50">
                                                    <Medal size={12} className="text-slate-300" />
                                                    <span className="text-xs text-slate-300 font-bold">2.</span>
                                                    <span className="text-xs text-white font-mono">€{(sponsor.bonus2nd / 1000000).toFixed(1)}M</span>
                                                </div>
                                            )}
                                            {sponsor.bonus3rd && (
                                                <div className="flex items-center gap-1 bg-amber-900/30 px-2 py-1 rounded border border-amber-700/50">
                                                    <Award size={12} className="text-amber-600" />
                                                    <span className="text-xs text-amber-600 font-bold">3.</span>
                                                    <span className="text-xs text-white font-mono">€{(sponsor.bonus3rd / 1000000).toFixed(1)}M</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {sponsor.tier === 'RISKY' && (
                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-orange-400 bg-orange-900/20 px-2 py-1 rounded">
                                        <Flame size={12} />
                                        ⚠️ Dikkat: Kötü sezonda gelir çok düşük! Ama şampiyon olursan büyük ödül!
                                    </div>
                                )}

                                {sponsor.tier === 'GUARANTEED' && (
                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">
                                        <Shield size={12} />
                                        ✓ Güvenli: Sonuç ne olursa olsun sabit yüksek gelir
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
                    <div className="text-sm">
                        {selectedSponsor ? (
                            <span className="text-white">
                                <span className="text-slate-400">Seçilen:</span> {selectedSponsor.name}
                                <span className="text-emerald-400 ml-2">
                                    (€{(calculateYearlyPotential(selectedSponsor, 12, 4) / 1000000).toFixed(1)}M orta sıra /
                                    <span className="text-amber-400"> €{(calculateYearlyPotential(selectedSponsor, 17, 1) / 1000000).toFixed(1)}M şampiyon</span>)
                                </span>
                            </span>
                        ) : (
                            <span className="text-slate-400">Bir sponsor seçin</span>
                        )}
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedSponsor}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center gap-2"
                    >
                        <Check size={18} />
                        Anlaşmayı Onayla
                    </button>
                </div>
            </div>
        </div>
    );
};
