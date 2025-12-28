
import React, { useState } from 'react';
import { Translation } from '../types';
import { BookOpen, Activity, Zap, Brain, Target, Shield, Play, Users, DollarSign, Trophy, Gauge, Settings, Swords, ChevronDown, ChevronUp, Star, AlertTriangle, Info, Dumbbell } from 'lucide-react';

interface GameGuideProps {
    t: Translation;
}

// Collapsible Section Component
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="text-emerald-500">{icon}</div>
                    <h3 className="font-bold text-white text-left">{title}</h3>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </button>
            {isOpen && <div className="p-4 pt-0 border-t border-slate-700">{children}</div>}
        </div>
    );
};

// Info Box Component
const InfoBox: React.FC<{ type: 'tip' | 'warning' | 'info'; children: React.ReactNode }> = ({ type, children }) => {
    const styles = {
        tip: 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300',
        warning: 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300',
        info: 'bg-blue-900/30 border-blue-500/50 text-blue-300'
    };
    const icons = {
        tip: <Star size={16} />,
        warning: <AlertTriangle size={16} />,
        info: <Info size={16} />
    };
    return (
        <div className={`flex items-start gap-2 p-3 rounded border ${styles[type]} text-sm mt-3`}>
            <div className="shrink-0 mt-0.5">{icons[type]}</div>
            <div>{children}</div>
        </div>
    );
};

export const GameGuide: React.FC<GameGuideProps> = ({ t }) => {
    const [tab, setTab] = useState<'BASICS' | 'TACTICS' | 'MATCH' | 'ATTRIBUTES' | 'TRAINING' | 'TIPS'>('BASICS');

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900/50 to-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-emerald-500" /> Pocket FM Tam Rehber
                </h2>
                <p className="text-slate-400 text-sm mt-1">Oyunun tüm mekaniklerini, taktik sistemini ve kazanma stratejilerini öğren.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button onClick={() => setTab('BASICS')} className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'BASICS' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><BookOpen size={16} /> Temeller</button>
                <button onClick={() => setTab('TACTICS')} className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'TACTICS' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Settings size={16} /> Taktikler</button>
                <button onClick={() => setTab('MATCH')} className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'MATCH' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Play size={16} /> Maç Motoru</button>
                <button onClick={() => setTab('ATTRIBUTES')} className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'ATTRIBUTES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Activity size={16} /> Özellikler</button>
                <button onClick={() => setTab('TRAINING')} className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'TRAINING' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Dumbbell size={16} /> Antrenman</button>
                <button onClick={() => setTab('TIPS')} className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'TIPS' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Trophy size={16} /> İpuçları</button>
            </div>

            {/* Content */}
            <div className="space-y-4">

                {/* ==================== TEMELLER ==================== */}
                {tab === 'BASICS' && (
                    <div className="space-y-4">
                        <Section title="Oyuna Başlarken" icon={<Users size={20} />} defaultOpen={true}>
                            <div className="space-y-4 text-sm text-slate-300">
                                <p>Pocket FM'de bir futbol kulübünün teknik direktörüsün. Görevin takımı şampiyonluğa taşımak!</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white mb-1">📋 Kadro</h4>
                                        <p className="text-slate-400 text-xs">İlk 11, yedekler ve rezerv oyuncuları yönet. Sürükleyerek pozisyonları ayarla.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white mb-1">⚙️ Taktik</h4>
                                        <p className="text-slate-400 text-xs">Formasyon, tempo, genişlik, pas stili ve defans çizgisini ayarla.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white mb-1">🏋️ Antrenman</h4>
                                        <p className="text-slate-400 text-xs">Haftalık antrenman odağı ve yoğunluğu seç. Oyuncuların gelişmesi buna bağlı.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white mb-1">💰 Transfer</h4>
                                        <p className="text-slate-400 text-xs">Pazardan oyuncu al, istemediğin oyuncuları transfer listesine koy.</p>
                                    </div>
                                </div>

                                <InfoBox type="tip">
                                    <strong>İlk Adım:</strong> Maça başlamadan önce "Kadro" bölümünden "Auto" butonuna tıklayarak en iyi 11'i otomatik oluştur.
                                </InfoBox>
                            </div>
                        </Section>

                        <Section title="Ekonomi Yönetimi" icon={<DollarSign size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>Kulübün bütçesi sınırlıdır. Gelir ve giderlerini dengeli tutmalısın.</p>

                                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                    <h4 className="font-bold text-emerald-400 mb-2">💵 Gelir Kaynakları</h4>
                                    <ul className="space-y-1 text-slate-400 text-xs">
                                        <li>• <strong>Maç Günü:</strong> Stadyum kapasitesi × bilet fiyatı</li>
                                        <li>• <strong>Sponsor:</strong> Sezon başında seçtiğin sponsor haftalık gelir sağlar</li>
                                        <li>• <strong>Galibiyet Primi:</strong> Kazandığın maçlar için ekstra bonus</li>
                                        <li>• <strong>Oyuncu Satışı:</strong> Transfer listesindeki oyuncular için teklifler gelir</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                    <h4 className="font-bold text-red-400 mb-2">💸 Giderler</h4>
                                    <ul className="space-y-1 text-slate-400 text-xs">
                                        <li>• <strong>Maaşlar:</strong> Tüm oyuncuların haftalık maaşı otomatik kesilir</li>
                                        <li>• <strong>Bakım:</strong> Stadyum ve tesis bakım masrafları</li>
                                        <li>• <strong>Transfer:</strong> Oyuncu satın alma bedeli</li>
                                    </ul>
                                </div>

                                <InfoBox type="warning">
                                    <strong>Dikkat:</strong> Bütçe eksiye düşerse yönetim kurulu güveni azalır ve görevden alınabilirsin!
                                </InfoBox>
                            </div>
                        </Section>

                        <Section title="Oyuncu Durumları" icon={<Activity size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-slate-900 p-3 rounded border border-emerald-500/30">
                                        <h4 className="font-bold text-emerald-400 mb-1">💪 Kondisyon</h4>
                                        <p className="text-slate-400 text-xs">Oyuncunun fiziksel durumu. Maçlarda azalır, dinlenince artar. %40 altında ciddi performans düşüşü.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-yellow-500/30">
                                        <h4 className="font-bold text-yellow-400 mb-1">😊 Moral</h4>
                                        <p className="text-slate-400 text-xs">Oyuncunun mutluluğu. Oynamayan oyuncuların morali düşer. Galibiyetler morali artırır.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-blue-500/30">
                                        <h4 className="font-bold text-blue-400 mb-1">📈 Form</h4>
                                        <p className="text-slate-400 text-xs">Son maçlardaki performans. Gol atan, asist yapan oyuncuların formu artar.</p>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>
                )}

                {/* ==================== TAKTİKLER ==================== */}
                {tab === 'TACTICS' && (
                    <div className="space-y-4">
                        <Section title="Formasyon Seçimi" icon={<Shield size={20} />} defaultOpen={true}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>Formasyon, oyuncuların sahada nasıl dizileceğini belirler. Her formasyonun güçlü ve zayıf yönleri vardır.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white">4-3-3</h4>
                                        <p className="text-emerald-400 text-xs mb-1">Kanat Oyunu & Hücum</p>
                                        <p className="text-slate-400 text-xs">3 forvet ile geniş hücum. Kanat oyuncuları orta atabilir. Kontra ataklara açık.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white">4-2-3-1</h4>
                                        <p className="text-blue-400 text-xs mb-1">Dengeli & Esnek</p>
                                        <p className="text-slate-400 text-xs">2 defansif orta sahayla güvenli. 10 numara yaratıcı oyuncu için ideal.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white">4-4-2</h4>
                                        <p className="text-yellow-400 text-xs mb-1">Klasik & Basit</p>
                                        <p className="text-slate-400 text-xs">İkili forvet ile direkt oyun. Orta sahada kalabalık ama kanatlar zayıf.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white">5-3-2 / 5-4-1</h4>
                                        <p className="text-red-400 text-xs mb-1">Defansif & Kontra</p>
                                        <p className="text-slate-400 text-xs">3 stoper ile sağlam defans. Kontra atak için ideal ama hücumda zayıf.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white">4-1-2-1-2 (Diamond)</h4>
                                        <p className="text-purple-400 text-xs mb-1">Dar & Tiki-Taka</p>
                                        <p className="text-slate-400 text-xs">Merkez ağırlıklı, kısa pas oyunu için ideal. Kanatlarda boşluk bırakır.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-white">3-4-3</h4>
                                        <p className="text-orange-400 text-xs mb-1">Ultra Hücum</p>
                                        <p className="text-slate-400 text-xs">Yüksek riskli, yüksek ödüllü. Çok gol pozisyonu ama arkada çok açık.</p>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Taktik Ayarları" icon={<Settings size={20} />} defaultOpen={true}>
                            <div className="space-y-4 text-sm text-slate-300">

                                {/* TEMPO */}
                                <div className="bg-slate-900 p-4 rounded border border-slate-700">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">⏱️ Tempo</h4>
                                    <p className="text-slate-400 text-xs mb-3">Oyuncuların karar alma hızını belirler.</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-blue-400 font-bold text-sm">Yavaş</span>
                                            <span className="text-slate-500 text-xs">Kontrollü oyun, %40 yavaş karar. Tiki-taka için.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-white font-bold text-sm">Normal</span>
                                            <span className="text-slate-500 text-xs">Standart karar hızı.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-emerald-400 font-bold text-sm">Hızlı</span>
                                            <span className="text-slate-500 text-xs">Agresif oyun, %30 hızlı karar. Kontra için.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* GENİŞLİK */}
                                <div className="bg-slate-900 p-4 rounded border border-slate-700">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">↔️ Genişlik</h4>
                                    <p className="text-slate-400 text-xs mb-3">Oyuncuların saha genişliğinde nasıl yayılacağını belirler.</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-purple-400 font-bold text-sm">Dar</span>
                                            <span className="text-slate-500 text-xs">Merkez ağırlıklı. Kısa pas için ideal.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-white font-bold text-sm">Dengeli</span>
                                            <span className="text-slate-500 text-xs">Standart dağılım.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-emerald-400 font-bold text-sm">Geniş</span>
                                            <span className="text-slate-500 text-xs">Kanat oyunu. Orta atma bonusu (+500)!</span>
                                        </div>
                                    </div>
                                    <InfoBox type="tip">
                                        <strong>Orta Bonusu:</strong> "Geniş" genişlik seçildiğinde kanat oyuncularının orta atması çok daha etkili olur!
                                    </InfoBox>
                                </div>

                                {/* PAS STİLİ */}
                                <div className="bg-slate-900 p-4 rounded border border-slate-700">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">⚽ Pas Stili</h4>
                                    <p className="text-slate-400 text-xs mb-3">Oyuncuların tercih edeceği pas tipini belirler.</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-blue-400 font-bold text-sm">Kısa</span>
                                            <span className="text-slate-500 text-xs">15m altı paslara +30 bonus. Tiki-taka için.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-white font-bold text-sm">Karma</span>
                                            <span className="text-slate-500 text-xs">Duruma göre pas seçimi.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-orange-400 font-bold text-sm">Direkt</span>
                                            <span className="text-slate-500 text-xs">Havadan paslara +20 bonus. Kontra için.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* DEFANS HATTI */}
                                <div className="bg-slate-900 p-4 rounded border border-slate-700">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">🛡️ Defans Hattı</h4>
                                    <p className="text-slate-400 text-xs mb-3">Defans oyuncularının sahada ne kadar yukarıda duracağını belirler.</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-blue-400 font-bold text-sm">Derin</span>
                                            <span className="text-slate-500 text-xs">Kendi yarı sahamızda. Arkada boşluk yok.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-white font-bold text-sm">Normal</span>
                                            <span className="text-slate-500 text-xs">Orta sahada buluşma.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-red-400 font-bold text-sm">Önde</span>
                                            <span className="text-slate-500 text-xs">Yüksek pres. Ofsayt tuzağı. Arkada risk.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* AGRESİFLİK */}
                                <div className="bg-slate-900 p-4 rounded border border-slate-700">
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">⚔️ Agresiflik</h4>
                                    <p className="text-slate-400 text-xs mb-3">Müdahale şiddetini ve risk alma seviyesini belirler.</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-blue-400 font-bold text-sm">Güvenli</span>
                                            <span className="text-slate-500 text-xs">Müdahale ×0.85 ama geçilince az risk.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-white font-bold text-sm">Normal</span>
                                            <span className="text-slate-500 text-xs">Standart müdahale.</span>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <span className="block text-red-400 font-bold text-sm">Agresif</span>
                                            <span className="text-slate-500 text-xs">Müdahale ×1.25 AMA geçilince ×1.8 risk!</span>
                                        </div>
                                    </div>
                                    <InfoBox type="warning">
                                        <strong>Risk:</strong> Agresif müdahale oyuncuyu geçerlerse, defans uzun süre yerde kalır!
                                    </InfoBox>
                                </div>
                            </div>
                        </Section>

                        <Section title="Önerilen Taktik Kombinasyonları" icon={<Trophy size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="bg-emerald-900/30 p-3 rounded border border-emerald-500/30">
                                    <h4 className="font-bold text-emerald-400">🦅 Hücum Ağırlıklı (Eğlenceli)</h4>
                                    <p className="text-xs text-slate-400 mt-1">4-3-3 | Tempo: Hızlı | Genişlik: Geniş | Pas: Direkt | Defans: Önde</p>
                                </div>
                                <div className="bg-blue-900/30 p-3 rounded border border-blue-500/30">
                                    <h4 className="font-bold text-blue-400">🎯 Tiki-Taka (Kontrol)</h4>
                                    <p className="text-xs text-slate-400 mt-1">4-1-2-1-2 | Tempo: Yavaş | Genişlik: Dar | Pas: Kısa | Defans: Önde</p>
                                </div>
                                <div className="bg-red-900/30 p-3 rounded border border-red-500/30">
                                    <h4 className="font-bold text-red-400">⚡ Kontra Atak (Zayıf takım)</h4>
                                    <p className="text-xs text-slate-400 mt-1">5-4-1 | Tempo: Hızlı | Genişlik: Dengeli | Pas: Direkt | Defans: Derin</p>
                                </div>
                            </div>
                        </Section>
                    </div>
                )}

                {/* ==================== MAÇ MOTORU ==================== */}
                {tab === 'MATCH' && (
                    <div className="space-y-4">
                        <Section title="Hız Kontrolleri" icon={<Gauge size={20} />} defaultOpen={true}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>Maç esnasında oyunun akış hızını değiştirebilirsin:</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <span className="block text-blue-400 font-bold text-lg">0.5×</span>
                                        <span className="text-slate-500 text-xs">Ağır Çekim</span>
                                        <p className="text-slate-600 text-[10px] mt-1">Detaylı analiz için</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <span className="block text-white font-bold text-lg">1×</span>
                                        <span className="text-slate-500 text-xs">Normal</span>
                                        <p className="text-slate-600 text-[10px] mt-1">Standart izleme</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <span className="block text-emerald-400 font-bold text-lg">2×</span>
                                        <span className="text-slate-500 text-xs">Hızlı</span>
                                        <p className="text-slate-600 text-[10px] mt-1">Hızlı ilerleme</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <span className="block text-purple-400 font-bold text-lg">4×</span>
                                        <span className="text-slate-500 text-xs">Süper Hızlı</span>
                                        <p className="text-slate-600 text-[10px] mt-1">Maçı hızla bitir</p>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Yapay Zeka (AI) Nasıl Çalışır?" icon={<Brain size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>Oyuncu AI'ı her an şu 3 opsiyonu değerlendirir:</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-red-900/20 p-3 rounded border border-red-500/30">
                                        <h4 className="font-bold text-red-400 mb-1">🎯 Şut</h4>
                                        <p className="text-slate-400 text-xs">Kaleye mesafe, şut açıklığı, bitiricilik yeteneği ve forvet bonusu hesaplanır.</p>
                                    </div>
                                    <div className="bg-emerald-900/20 p-3 rounded border border-emerald-500/30">
                                        <h4 className="font-bold text-emerald-400 mb-1">⚽ Pas</h4>
                                        <p className="text-slate-400 text-xs">Takım arkadaşlarının durumu, koşu yapanlar, kesme riski ve vizyon yeteneği hesaplanır.</p>
                                    </div>
                                    <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                                        <h4 className="font-bold text-blue-400 mb-1">🏃 Çalım</h4>
                                        <p className="text-slate-400 text-xs">Önde boş alan, dribbling yeteneği ve baskı durumu hesaplanır.</p>
                                    </div>
                                </div>

                                <InfoBox type="info">
                                    <strong>Karar Sistemi:</strong> En yüksek skoru alan aksiyon seçilir. Forvetler şut çekmeye meyilli, oyun kurucular pas atmaya meyillidir.
                                </InfoBox>
                            </div>
                        </Section>

                        <Section title="Çalım vs Müdahale Dengesi" icon={<Swords size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>1v1 düellolarda:</p>
                                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <h4 className="font-bold text-red-400">Forvet (Çalım)</h4>
                                            <p className="text-xs text-slate-400 mt-1">Dribbling stat × (0.3 - 1.3)</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-400">Defans (Müdahale)</h4>
                                            <p className="text-xs text-slate-400 mt-1">Tackling stat × (0.5 - 1.5)</p>
                                        </div>
                                    </div>
                                    <p className="text-center text-slate-500 text-xs mt-3">Aynı stat değerinde defans hafif avantajlı (~%55-60)</p>
                                </div>

                                <InfoBox type="tip">
                                    <strong>Güçlü Forvetler:</strong> 80+ dribbling stat'ı olan forvetler defansları geçmekte çok başarılı!
                                </InfoBox>
                            </div>
                        </Section>

                        <Section title="Kaleci Mekaniği" icon={<Shield size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>Kaleci kurtarış şansı şu formülle hesaplanır:</p>
                                <div className="bg-slate-900 p-3 rounded border border-slate-700 font-mono text-xs">
                                    <p className="text-emerald-400">Kurtarış = (Kalecilik × 0.65) + Mesafe Bonusu - Şut Hızı Cezası</p>
                                </div>
                                <ul className="space-y-1 text-slate-400 text-xs">
                                    <li>• <strong className="text-white">Yakın şutlar ({"<"}6m):</strong> Kaleci erişim mesafesi azalır</li>
                                    <li>• <strong className="text-white">Hızlı şutlar:</strong> Reaksiyon süresi düşer</li>
                                    <li>• <strong className="text-white">Yorgun kaleci:</strong> Kondisyon %50 altında performans düşer</li>
                                </ul>
                            </div>
                        </Section>

                        <Section title="Oyuncu Değişikliği" icon={<Users size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>Maç içinde 5 oyuncu değişikliği hakkın var.</p>
                                <ul className="space-y-1 text-slate-400 text-xs">
                                    <li>• Yorgun oyuncuları değiştir (kondisyon %40 altında performans çok düşer)</li>
                                    <li>• Yedekler tam kondisyonla girer</li>
                                    <li>• Taktik ayarlarını maç içinde değiştirebilirsin</li>
                                </ul>
                            </div>
                        </Section>
                    </div>
                )}

                {/* ==================== ÖZELLİKLER ==================== */}
                {tab === 'ATTRIBUTES' && (
                    <div className="space-y-4">
                        <Section title="Fiziksel Özellikler" icon={<Zap size={20} />} defaultOpen={true}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-blue-400">Hız</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Oyuncunun maksimum koşu hızı. Formül: 0.75 + (Speed/250)</p>
                                            <p className="text-slate-500 text-[10px] mt-1">60 hız = 0.99x, 80 hız = 1.07x, 100 hız = 1.15x</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-emerald-400">Dayanıklılık</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Kondisyon tüketim hızını belirler. Yüksek = daha uzun koşar.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-orange-400">Güç</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Topu koruma ve "hold-up play" yeteneği. 65+ güç = baskı altında topu korur.</p>
                                            <p className="text-slate-500 text-[10px] mt-1">Hava toplarında da avantaj sağlar.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Teknik Özellikler" icon={<Target size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-red-400">Bitiricilik</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Şut isabeti VE şut çekme eğilimi. Yüksek = daha çok şut dener.</p>
                                            <p className="text-slate-500 text-[10px] mt-1">Şut skoru: (Finishing × 1.2) - 30</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-emerald-400">Pas</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Pas hata payını azaltır. Yüksek = isabetli paslar.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-purple-400">Çalım</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">1v1 düellolarda geçme yeteneği ve top kontrolü.</p>
                                            <p className="text-slate-500 text-[10px] mt-1">60+ dribbling = çalım skoru bonusu</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-blue-400">Müdahale</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Topu kapma yeteneği. Defansçılar için kritik önem.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-yellow-400">Kalecilik</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Kaleci için temel stat. Kurtarış şansını belirler.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Zihinsel Özellikler" icon={<Brain size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-purple-400">Vizyon</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Pas menzilini ve kalitesini artırır. Oyun kurucular için kritik.</p>
                                            <p className="text-slate-500 text-[10px] mt-1">Pas skoru: +(Vision-50) × 1.0</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-emerald-400">Pozisyon Alma</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Topsuz oyuncu hareketleri ve koşu zamanlaması.</p>
                                            <p className="text-slate-500 text-[10px] mt-1">Forvet koşu derinliği: 5 + (Positioning/100 × 5)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-yellow-400">Karar Alma</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">AI karar kalitesi. Düşük = bazen kötü kararlar alır.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-900 rounded border border-slate-700">
                                        <div className="w-24 shrink-0 font-bold text-blue-400">Soğukkanlılık</div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Baskı altında performans. Kaleci reflekslerini de etkiler.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Özel Yetenekler (PlayStyles)" icon={<Star size={20} />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { name: "Bencil", desc: "Pas -30, Şut +20, Çalım +20. Bireysel oyuncu." },
                                    { name: "Plase Şut", desc: "Şutlara kavis verir. Bloklanması zor." },
                                    { name: "Uzaktan Şut", desc: "25m altında +40 şut bonusu." },
                                    { name: "Uzun Topla Pas", desc: "Görüş menzili +25 birim." },
                                    { name: "Teknik", desc: "Top kontrolü artırır, kaybetme riski azalır." },
                                    { name: "Amansız", desc: "Kondisyon %20 daha hızlı yenilenir." },
                                    { name: "Seri", desc: "Maksimum hıza daha hızlı ulaşır." },
                                    { name: "Hava Hakimi", desc: "Kafa toplarında bonus." }
                                ].map((ps, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-800 rounded border border-slate-700">
                                        <div className="mt-0.5 bg-yellow-500/20 p-1.5 rounded text-yellow-400"><Zap size={12} /></div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{ps.name}</h4>
                                            <p className="text-xs text-slate-400">{ps.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                )}

                {/* ==================== ANTRENMAN ==================== */}
                {tab === 'TRAINING' && (
                    <div className="space-y-4">
                        <Section title="Antrenman Odağı" icon={<Target size={20} />} defaultOpen={true}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <p>Haftalık antrenman odağını seçerek oyuncuların hangi alanlarda gelişeceğini belirle.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-emerald-400">⚖️ Dengeli</h4>
                                        <p className="text-slate-400 text-xs">Tüm özellikleri eşit geliştirir. Güvenli seçim.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-red-400">⚔️ Hücum</h4>
                                        <p className="text-slate-400 text-xs">Bitiricilik, pas ve çalım odaklı.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-blue-400">🛡️ Savunma</h4>
                                        <p className="text-slate-400 text-xs">Müdahale ve pozisyon alma odaklı.</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <h4 className="font-bold text-orange-400">💪 Fiziksel</h4>
                                        <p className="text-slate-400 text-xs">Hız, güç ve dayanıklılık odaklı.</p>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Antrenman Yoğunluğu" icon={<Gauge size={20} />}>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-900 p-3 rounded border border-emerald-500/30 text-center">
                                        <h4 className="font-bold text-emerald-400">Hafif</h4>
                                        <p className="text-slate-400 text-xs mt-1">Az gelişme, çok yenilenme</p>
                                        <p className="text-slate-500 text-[10px]">Yoğun maç takviminde</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-yellow-500/30 text-center">
                                        <h4 className="font-bold text-yellow-400">Normal</h4>
                                        <p className="text-slate-400 text-xs mt-1">Dengeli gelişme</p>
                                        <p className="text-slate-500 text-[10px]">Standart seçim</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded border border-red-500/30 text-center">
                                        <h4 className="font-bold text-red-400">Ağır</h4>
                                        <p className="text-slate-400 text-xs mt-1">Çok gelişme, az yenilenme</p>
                                        <p className="text-slate-500 text-[10px]">Maçsız haftalarda</p>
                                    </div>
                                </div>

                                <InfoBox type="warning">
                                    <strong>Sakatlanma Riski:</strong> Ağır antrenman + düşük kondisyonlu oyuncu = sakatlanma riski artar!
                                </InfoBox>
                            </div>
                        </Section>
                    </div>
                )}

                {/* ==================== İPUÇLARI ==================== */}
                {tab === 'TIPS' && (
                    <div className="space-y-4">
                        <Section title="Şampiyon Olma Taktikleri" icon={<Trophy size={20} />} defaultOpen={true}>
                            <div className="space-y-3">
                                <div className="bg-emerald-900/20 p-4 rounded border-l-4 border-emerald-500">
                                    <strong className="text-white">✅ Kadro Rotasyonu Yap</strong>
                                    <p className="text-slate-400 text-sm mt-1">38 haftalık ligde aynı 11'i oynatma. Yedekleri zayıf rakiplere karşı kullan, as oyuncuları derbi maçlarına sakla.</p>
                                </div>
                                <div className="bg-blue-900/20 p-4 rounded border-l-4 border-blue-500">
                                    <strong className="text-white">📈 Genç Yetenekleri Geliştir</strong>
                                    <p className="text-slate-400 text-sm mt-1">18-21 yaş arası yüksek potansiyelli oyuncuları oynayarak geliştir. 2-3 sezonda değerleri 3-5 katına çıkar.</p>
                                </div>
                                <div className="bg-purple-900/20 p-4 rounded border-l-4 border-purple-500">
                                    <strong className="text-white">🎯 Rakibe Göre Taktik</strong>
                                    <p className="text-slate-400 text-sm mt-1">Güçlü rakip için "Defans Derin + Kontra", zayıf rakip için "Hücum Önde + Baskı" kullan.</p>
                                </div>
                                <div className="bg-yellow-900/20 p-4 rounded border-l-4 border-yellow-500">
                                    <strong className="text-white">💰 Bütçeyi Akıllı Kullan</strong>
                                    <p className="text-slate-400 text-sm mt-1">Yüksek maaşlı yaşlı yıldızlar yerine düşük maaşlı genç yeteneklere yatırım yap. Uzun vadede daha karlı.</p>
                                </div>
                            </div>
                        </Section>

                        <Section title="Maç İçi İpuçları" icon={<Play size={20} />}>
                            <div className="space-y-3">
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <strong className="text-emerald-400">⚡ Tempo Değiştir</strong>
                                    <p className="text-slate-400 text-xs mt-1">Öndeysen "Yavaş" tempo ile kontrol et. Gerideysen "Hızlı" tempo ile baskı kur.</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <strong className="text-blue-400">🔄 Erken Değişiklik</strong>
                                    <p className="text-slate-400 text-xs mt-1">Kondisyonu %50 altına düşen oyuncuyu hemen değiştir. Performansı dramatik düşer.</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <strong className="text-red-400">🎯 Kanat Kullan</strong>
                                    <p className="text-slate-400 text-xs mt-1">"Geniş" genişlik + "Direkt" pas = etkili kanat ortaları. Ceza sahasında forvetlerin olsun!</p>
                                </div>
                            </div>
                        </Section>

                        <Section title="Ekonomi İpuçları" icon={<DollarSign size={20} />}>
                            <div className="space-y-3">
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <strong className="text-emerald-400">📊 Sponsor Seçimi</strong>
                                    <p className="text-slate-400 text-xs mt-1">Haftalık geliri yüksek sponsoru seç. Galibiyet primi bonus, temel gelir daha önemli.</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <strong className="text-yellow-400">🏟️ Stadyum Geliştir</strong>
                                    <p className="text-slate-400 text-xs mt-1">Stadyum kapasitesi = maç günü geliri. Uzun vadede en iyi yatırım.</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <strong className="text-blue-400">⚽ Transfer Zamanlaması</strong>
                                    <p className="text-slate-400 text-xs mt-1">Oyuncu satarken yüksek formda sat (değer artar). Alırken düşük formda al (değer düşük).</p>
                                </div>
                            </div>
                        </Section>
                    </div>
                )}

            </div>
        </div>
    );
};
