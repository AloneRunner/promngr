
import React, { useState } from 'react';
import { Translation } from '../types';
import { BookOpen, Users, Trophy, DollarSign, Dumbbell, Building2, Target, ArrowRight, Star, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Zap, Shield, Heart, Brain, Crosshair } from 'lucide-react';

interface GameGuideProps {
    t: Translation;
}

interface GuideSection {
    id: string;
    title: string;
    icon: any;
    color: string;
    content: React.ReactNode;
}

export const GameGuide: React.FC<GameGuideProps> = ({ t }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>('basics');

    const sections: GuideSection[] = [
        {
            id: 'basics',
            title: '🎮 Oyun Temelleri',
            icon: BookOpen,
            color: 'emerald',
            content: (
                <div className="space-y-3">
                    <p>⚽ Bu oyunda bir futbol takımının teknik direktörüsün.</p>
                    <p>📅 Her hafta bir lig maçı oynanır. Sezon sonunda şampiyon belirlenir.</p>
                    <p>🏆 <strong>Hedefin:</strong> Şampiyonluk, Avrupa kupaları ve kulübü büyütmek.</p>
                    <p>💾 Oyun otomatik kaydedilir. "Kaydet ve Çık" ile güvenli çıkış yapabilirsin.</p>
                    <p>📊 <strong>Yönetim güveni</strong> düşerse kovulabilirsin!</p>
                    <div className="bg-slate-900/50 p-3 rounded mt-3">
                        <p className="text-yellow-400 font-bold mb-2">⚠️ Yönetim Güveni Etkileri:</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Galibiyet: +3 güven</li>
                            <li>• Beraberlik: +0 güven</li>
                            <li>• Mağlubiyet: -5 güven</li>
                            <li>• %30 altına düşerse: Kovulursun!</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'squad',
            title: '👥 Kadro Yönetimi',
            icon: Users,
            color: 'blue',
            content: (
                <div className="space-y-3">
                    <p>⭐ Oyuncuları <strong>İlk 11</strong>, <strong>Yedek</strong> veya <strong>Rezerv</strong> olarak ayarla.</p>
                    <p>🔄 Oyuncuyu tıkla ve başka biriyle değiştir.</p>
                    <p>📍 Diziliş seçerek farklı formasyonlar dene.</p>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">📊 OVR (Overall Rating) Nasıl Hesaplanır?</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• <strong>Pozisyon Uyumu:</strong> Doğru pozisyonda oynayan oyuncu daha yüksek OVR gösterir.</li>
                            <li>• <strong>Moral Etkisi:</strong> 50+ moral = bonus, 50- moral = ceza</li>
                            <li>• <strong>Kondisyon:</strong> 30% altı kondisyon = ciddi performans düşüşü</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">❌ Sözleşme Fesih</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• İstemediğin oyuncuyu serbest bırakabilirsin.</li>
                            <li>• <strong>Tazminat:</strong> Kalan yıl × Yıllık maaş × %50</li>
                            <li>• Oyuncu serbest oyuncu olur.</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'tactics',
            title: '🎯 Taktik Sistemi (Detaylı)',
            icon: Target,
            color: 'purple',
            content: (
                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-purple-400 font-bold mb-2">📐 Formasyonlar</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><strong>4-3-3:</strong> Dengeli, kanat ağırlıklı</div>
                            <div><strong>4-4-2:</strong> Klasik, güvenli</div>
                            <div><strong>4-2-3-1:</strong> Orta saha kontrolü</div>
                            <div><strong>3-5-2:</strong> Orta saha dominantı</div>
                            <div><strong>5-3-2:</strong> Savunmacı</div>
                            <div><strong>4-1-4-1:</strong> Su sızdırmaz savunma</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-orange-400 font-bold mb-2">⚡ Oyun Stili</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong className="text-blue-400">Possession:</strong> Top tutma, kısa pas, sabırlı atak. Güçlü orta saha gerektirir.</li>
                            <li><strong className="text-green-400">Counter:</strong> Savunup hızlı kontra. Hızlı forvetler ve orta sahalar gerektirir.</li>
                            <li><strong className="text-red-400">HighPress:</strong> Yüksek baskı, rakibi kendi yarısında boğ. Yüksek stamina gerektirir!</li>
                            <li><strong className="text-gray-400">ParkTheBus:</strong> 11 adam savunma, kontra bekle. Büyük takımlara karşı etkili.</li>
                            <li><strong className="text-yellow-400">Balanced:</strong> Her şeyden biraz. Güvenli seçim.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">👊 Agresiflik</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong className="text-green-400">Safe:</strong> Daha az faul, daha az sarı kart. Kontrollü oyun.</li>
                            <li><strong className="text-yellow-400">Normal:</strong> Dengeli yaklaşım.</li>
                            <li><strong className="text-red-400">Aggressive:</strong> Sert müdahaleler, daha fazla top kazanma ama kart riski yüksek!</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-cyan-400 font-bold mb-2">📏 Genişlik & Pas Stili</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong>Dar (Narrow):</strong> Ortadan oyna. İç oyuncular için ideal.</li>
                            <li><strong>Geniş (Wide):</strong> Kanatları kullan. Hızlı kanat oyuncuları gerektirir.</li>
                            <li><strong>Kısa Pas (Short):</strong> Kontrol, az risk, yavaş ilerleme.</li>
                            <li><strong>Direkt Pas (Direct):</strong> Hızlı ileri paslar, şans yaratır.</li>
                            <li><strong>Uzun Top (LongBall):</strong> Direk forvetlere, boylu forvet gerektirir.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-pink-400 font-bold mb-2">🛡️ Savunma Hattı</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong>Derin (Deep):</strong> Kendi yarında bekle. Kontra stili için uygun.</li>
                            <li><strong>Dengeli (Balanced):</strong> Ne çok önde ne çok geride.</li>
                            <li><strong>Yüksek (High):</strong> Rakibi kendi yarısına hapsET. Ofsayt tuzağı, riskli!</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'training',
            title: '🏋️ Antrenman Sistemi',
            icon: Dumbbell,
            color: 'orange',
            content: (
                <div className="space-y-3">
                    <p>📈 <strong>Sadece 28 yaş altı</strong> oyuncular gelişebilir!</p>
                    <p>⚠️ Gelişim <strong>şansa bağlıdır</strong> - her hafta garantili değil.</p>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-orange-400 font-bold mb-2">🎯 Antrenman Odakları</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong className="text-yellow-400">Dengeli:</strong> Tüm özellikler eşit şans.</li>
                            <li><strong className="text-red-400">Hücum:</strong> Bitiricilik, Şut, Dribling gelişir.</li>
                            <li><strong className="text-blue-400">Savunma:</strong> Müdahale, Pozisyon, Güç gelişir.</li>
                            <li><strong className="text-green-400">Fiziksel:</strong> Hız, Dayanıklılık, Güç gelişir.</li>
                            <li><strong className="text-purple-400">Teknik:</strong> Pas, Dribling, Vizyon gelişir.</li>
                            <li><strong className="text-emerald-400">Mevkiye Göre (YENİ!):</strong> Otomatik pozisyon bazlı:</li>
                        </ul>
                        <div className="mt-2 pl-4 text-xs text-slate-400">
                            <p>• <strong>Forvet:</strong> Bitiricilik, Dribling, Hız</p>
                            <p>• <strong>Orta Saha:</strong> Pas, Vizyon, Dayanıklılık</p>
                            <p>• <strong>Defans:</strong> Müdahale, Pozisyon, Güç</p>
                            <p>• <strong>Kaleci:</strong> Kalecilik, Soğukkanlılık, Güç</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-cyan-400 font-bold mb-2">💪 Antrenman Yoğunluğu</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong>Hafif:</strong> +15 kondisyon, yavaş gelişim</li>
                            <li><strong>Normal:</strong> +10 kondisyon, orta gelişim</li>
                            <li><strong>Ağır:</strong> +5 kondisyon, hızlı gelişim (sakatlık riski!)</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'facilities',
            title: '🏟️ Tesisler & Personel (Detaylı)',
            icon: Building2,
            color: 'cyan',
            content: (
                <div className="space-y-4">
                    <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">⚠️ Yükseltme Maliyetleri (ÇOK PAHALI!)</p>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-slate-400">
                                    <th className="text-left">Level</th>
                                    <th className="text-right">Stadyum</th>
                                    <th className="text-right">Antrenman</th>
                                    <th className="text-right">Akademi</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                <tr><td>1→2</td><td className="text-right">~€9.5M</td><td className="text-right">~€6.3M</td><td className="text-right">~€5M</td></tr>
                                <tr><td>5→6</td><td className="text-right">~€46M</td><td className="text-right">~€31M</td><td className="text-right">~€25M</td></tr>
                                <tr><td>9→10</td><td className="text-right text-red-400 font-bold">~€95M</td><td className="text-right text-red-400 font-bold">~€63M</td><td className="text-right text-red-400 font-bold">~€50M</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-blue-400 font-bold mb-2">🏟️ Stadyum</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Her level = +2,500 kapasite</li>
                            <li>• Daha fazla seyirci = daha fazla bilet geliri</li>
                            <li>• İtibar arttıkça doluluk oranı artar</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-green-400 font-bold mb-2">🏋️ Antrenman Merkezi</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Oyuncu gelişim hızı artar</li>
                            <li>• Daha yüksek potansiyele ulaşma şansı</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">⚽ Akademi vs Scout - FARK NE?</p>
                        <table className="w-full text-xs mt-2">
                            <thead>
                                <tr className="text-slate-400">
                                    <th className="text-left">Özellik</th>
                                    <th className="text-center">Scout</th>
                                    <th className="text-center">Akademi</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                <tr>
                                    <td>Genç Bulma Şansı</td>
                                    <td className="text-center text-emerald-400">+%1/level</td>
                                    <td className="text-center text-blue-400">+%0.5/level</td>
                                </tr>
                                <tr>
                                    <td>Potansiyel Bonus</td>
                                    <td className="text-center text-emerald-400">+2/level</td>
                                    <td className="text-center text-blue-400">+1/level</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-xs text-slate-400 mt-2">
                            📊 <strong>Formül:</strong> Genç şansı = %3 + (Scout×%1) + (Akademi×%0.5)
                        </p>
                        <p className="text-xs text-slate-400">
                            ⭐ <strong>Potansiyel:</strong> Base + (Scout×2) + (Akademi×1)
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">
                            💡 <strong>Tavsiye:</strong> Scout daha etkili, önce onu yükselt!
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'morale',
            title: '😊 Moral Sistemi',
            icon: Heart,
            color: 'pink',
            content: (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-pink-400 font-bold mb-2">📊 Haftalık Moral Değişimleri</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong className="text-emerald-400">İlk 11:</strong> +2 moral</li>
                            <li><strong className="text-yellow-400">Yedek:</strong> Değişmez</li>
                            <li><strong className="text-red-400">Rezerv (75+ OVR):</strong> -3 moral ❗</li>
                            <li><strong className="text-orange-400">Rezerv (65-75 OVR):</strong> -1 moral</li>
                            <li><strong className="text-slate-400">Rezerv (65- OVR):</strong> Değişmez</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-purple-400 font-bold mb-2">🗣️ Oyuncu Etkileşimleri</p>
                        <ul className="text-sm space-y-2 text-slate-300">
                            <li><strong className="text-green-400">Öv:</strong> Form 7+ veya moral 60- ise etkili. +5 ile +10 arası.</li>
                            <li><strong className="text-red-400">Eleştir:</strong> Riskli! Profesyonel oyuncular tepki vermez, diğerleri moral kaybedebilir.</li>
                            <li><strong className="text-blue-400">Motive Et:</strong> Düşük moralli oyuncular için. +3 ile +8 arası.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">⚡ Moral → Performans Etkisi</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong>100 moral:</strong> +%5 OVR bonus</li>
                            <li><strong>50 moral:</strong> Normal performans</li>
                            <li><strong>0 moral:</strong> -%10 OVR ceza!</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'transfers',
            title: '💰 Transfer Sistemi',
            icon: DollarSign,
            color: 'yellow',
            content: (
                <div className="space-y-3">
                    <p>🛒 <strong>Transfer Pazarı:</strong> Tüm liglerdeki oyuncuları gör ve teklif yap.</p>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">💵 Pazarlık Sistemi</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Transfer listesindeki oyuncular daha ucuza gelir.</li>
                            <li>• Transfer listesinde olmayan oyuncular için %20-50 fazla iste.</li>
                            <li>• "Israr Et" butonu riskli - görüşme kopabilir!</li>
                            <li>• Sabır göster, tekrar teklif yap.</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">🌟 Alt Yapı (Ucuz!)</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Genç oyuncular €50K değerinde gelir</li>
                            <li>• Maaş: Sadece €25K/yıl</li>
                            <li>• Potansiyel yüksekse büyük kar sağlar!</li>
                            <li>• Milliyet: Ligin ülkesine göre (%70 yerel)</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">📤 Oyuncu Satışı</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Transfer listesine koy → AI takımlar teklif yapar</li>
                            <li>• Mesajlardan teklifleri takip et</li>
                            <li>• Kabul/Red seçenekleri</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'finances',
            title: '💵 Finans Yönetimi',
            icon: Building2,
            color: 'green',
            content: (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-green-400 font-bold mb-2">📈 Gelir Kaynakları</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong>Bilet Geliri:</strong> Kapasite × Doluluk × Bilet Fiyatı</li>
                            <li><strong>Sponsor:</strong> Haftalık sabit + galibiyet primi</li>
                            <li><strong>Transfer:</strong> Oyuncu satışları</li>
                            <li><strong>Avrupa:</strong> Kupa maçları ek gelir sağlar</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">📉 Gider Kaynakları</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong>Maaşlar:</strong> Tüm oyuncuların haftalık maaşları</li>
                            <li><strong>Bakım:</strong> Stadyum + Tesisler</li>
                            <li><strong>Transferler:</strong> Oyuncu alımları</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-yellow-400 font-bold mb-2">🤝 Sponsor Türleri</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong className="text-green-400">Garantili:</strong> Yüksek sabit, düşük bonus. Güvenli.</li>
                            <li><strong className="text-yellow-400">Dengeli:</strong> Orta sabit, orta bonus.</li>
                            <li><strong className="text-red-400">Riskli:</strong> Düşük sabit, yüksek bonus. Çok kazanırsan karlı!</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'european',
            title: '🏆 Avrupa Kupaları',
            icon: Trophy,
            color: 'amber',
            content: (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-amber-400 font-bold mb-2">🎫 Katılım Şartları</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li><strong>Şampiyonlar Ligi:</strong> Lig 1. ve 2.si</li>
                            <li><strong>UEFA Avrupa Ligi:</strong> Lig 3. ve 4.sü</li>
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-blue-400 font-bold mb-2">📊 Turnuva Formatı</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Grup aşaması: 4 takımlı gruplar</li>
                            <li>• İlk 2 eleme turuna geçer</li>
                            <li>• Çeyrek final, yarı final, final</li>
                            <li>• Tek maç eleme sistemi</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'tips',
            title: '💡 Pro İpuçları',
            icon: Brain,
            color: 'violet',
            content: (
                <div className="space-y-3">
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded">
                        <p className="text-emerald-400 font-bold mb-2">✅ Yapılması Gerekenler</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Her pozisyonda en az 2 oyuncu bulundur.</li>
                            <li>• Genç oyunculara şans ver - gelişirler!</li>
                            <li>• Scout'u önce yükselt (daha etkili).</li>
                            <li>• Alt yapı gençlerini sat - çok karlı!</li>
                            <li>• Rakibe göre taktik değiştir.</li>
                            <li>• Yorgun oyuncuları dinlendir.</li>
                        </ul>
                    </div>

                    <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                        <p className="text-red-400 font-bold mb-2">❌ Kaçınılması Gerekenler</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• Yüksek OVR oyuncuları sürekli rezervde tutma.</li>
                            <li>• Bütçeni aşan transferler yapma.</li>
                            <li>• Tek formasyona bağlı kalma.</li>
                            <li>• Sakatlıkları görmezden gelme.</li>
                            <li>• Sözleşmelerin bitmesine izin verme.</li>
                        </ul>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
                        <p className="text-blue-400 font-bold mb-2">🎯 Taktik İpuçları</p>
                        <ul className="text-sm space-y-1 text-slate-300">
                            <li>• <strong>Güçlü rakip:</strong> ParkTheBus + Counter</li>
                            <li>• <strong>Zayıf rakip:</strong> HighPress + Possession</li>
                            <li>• <strong>Önde skorken:</strong> Safe agresiflik</li>
                            <li>• <strong>Gerideyken:</strong> Aggressive + Hızlı tempo</li>
                        </ul>
                    </div>
                </div>
            )
        }
    ];

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="text-emerald-500" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold text-white">{t.gameGuide || 'Oyun Rehberi'}</h2>
                        <p className="text-slate-400 text-sm">Oyunun tüm mekaniklerini detaylı öğren!</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {sections.map(section => (
                    <div
                        key={section.id}
                        className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
                    >
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <section.icon className={`text-${section.color}-400`} size={20} />
                                <span className="font-bold text-white">{section.title}</span>
                            </div>
                            {expandedSection === section.id ? (
                                <ChevronUp className="text-slate-400" size={20} />
                            ) : (
                                <ChevronDown className="text-slate-400" size={20} />
                            )}
                        </button>

                        {expandedSection === section.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-700 animate-fade-in text-slate-300 text-sm">
                                {section.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
