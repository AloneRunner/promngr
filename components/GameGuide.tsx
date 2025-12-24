
import React, { useState } from 'react';
import { Translation } from '../types';
import { BookOpen, Activity, Zap, Brain, Target, Shield, MousePointer2 } from 'lucide-react';

interface GameGuideProps {
  t: Translation;
}

export const GameGuide: React.FC<GameGuideProps> = ({ t }) => {
  const [tab, setTab] = useState<'ATTRIBUTES' | 'RATINGS' | 'PLAYSTYLES' | 'GK'>('ATTRIBUTES');

  return (
    <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="text-emerald-500" /> {t.gameGuide}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Simülasyon motorunun nasıl çalıştığını ve takımınızı nasıl kurmanız gerektiğini öğrenin.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setTab('ATTRIBUTES')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'ATTRIBUTES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Özellikler & Etkileri</button>
            <button onClick={() => setTab('RATINGS')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'RATINGS' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>70 vs 90 Farkı</button>
            <button onClick={() => setTab('PLAYSTYLES')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'PLAYSTYLES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Oyun Tarzları</button>
            <button onClick={() => setTab('GK')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === 'GK' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Kaleciler</button>
        </div>

        {/* Content */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
            
            {tab === 'ATTRIBUTES' && (
                <div className="space-y-8">
                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2"><Zap size={20}/> Fiziksel Özellikler</h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li><strong className="text-white">Hız (Speed):</strong> Oyuncunun ulaşabileceği maksimum hızı belirler. Oyun motorunda hız artışı lineer değil, üsseldir.</li>
                            <li><strong className="text-white">Dayanıklılık (Stamina):</strong> Oyuncunun "Depar" (Sprint) atabileceği süreyi belirler. Kondisyon %60'ın altına düşerse oyuncu yavaşlar, %40'ın altında pas/şut hatası yapar.</li>
                            <li><strong className="text-white">Güç (Strength):</strong> İkili mücadelelerde ve top saklamada kullanılır. Şutun sertliğini etkiler.</li>
                        </ul>
                    </div>

                    <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-500/30">
                        <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2"><Target size={20}/> Teknik Özellikler</h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li><strong className="text-white">Bitiricilik (Finishing):</strong> Şut çekerken hedeflediği noktadan ne kadar sapacağını belirler. Düşük bitiricilik, topun kaleyi tutmama ihtimalini artırır.</li>
                            <li><strong className="text-white">Pas (Passing):</strong> Pasın hedef oyuncunun ayağına mı yoksa uzağına mı gideceğini belirler. Yüksek pas özelliği, topun "adrese teslim" gitmesini sağlar.</li>
                            <li><strong className="text-white">Top Sürme (Dribbling):</strong> Topun oyuncunun ayağından ne kadar açılacağını belirler. Yüksek dribbling, topun ayağa yapışmasını sağlar.</li>
                        </ul>
                    </div>

                    <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                        <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2"><Brain size={20}/> Zihinsel Özellikler</h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li><strong className="text-white">Karar Alma (Decisions):</strong> En kritik özelliktir. Oyuncunun ne kadar sürede aksiyon alacağını belirler. Yüksek karar alma, hızlı düşünmeyi sağlar.</li>
                            <li><strong className="text-white">Vizyon (Vision):</strong> Pas atacağı arkadaşını ne kadar uzaktan görebileceğini belirler. Düşük vizyon sadece yanındakine pas atarken, yüksek vizyon 50 metre ötedeki koşuyu görür.</li>
                            <li><strong className="text-white">Soğukkanlılık (Composure):</strong> Baskı altındayken (etrafında rakip varken) hata yapma oranını düşürür.</li>
                        </ul>
                    </div>
                </div>
            )}

            {tab === 'RATINGS' && (
                <div className="space-y-6">
                    <p className="text-slate-400 text-sm mb-4">
                        Bu fark, oyunda "İyi Oyuncu" ile "Dünya Yıldızı" arasındaki uçurumdur. Matematiksel olarak sahaya şöyle yansır:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <h3 className="text-white font-bold mb-2 border-b border-slate-600 pb-2">Pas (Passing)</h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="text-yellow-400 font-bold mb-1">70 Reyting</div>
                                    <p className="text-slate-400">30 metrelik bir pasta, top hedeften 2-3 metre sapabilir. Arkadaşı topu yakalamak için koşmak zorunda kalır.</p>
                                </div>
                                <div>
                                    <div className="text-emerald-400 font-bold mb-1">90 Reyting</div>
                                    <p className="text-slate-400">Sapma payı sadece 0.5 metredir. Top "adrese teslim" gider, alan oyuncu hız kesmeden atağa devam eder.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <h3 className="text-white font-bold mb-2 border-b border-slate-600 pb-2">Hız (Speed)</h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="text-yellow-400 font-bold mb-1">70 Reyting</div>
                                    <p className="text-slate-400">Ortalama bir bek tarafından yakalanabilir.</p>
                                </div>
                                <div>
                                    <div className="text-emerald-400 font-bold mb-1">90 Reyting</div>
                                    <p className="text-slate-400">Savunma arkasına atılan bir topta, stoperden 2 metre geride başlasa bile 3 saniye içinde onun önüne geçer. Etki %30 daha fazladır.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <h3 className="text-white font-bold mb-2 border-b border-slate-600 pb-2">Şut (Finishing)</h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="text-yellow-400 font-bold mb-1">70 Reyting</div>
                                    <p className="text-slate-400">Ceza sahası dışından köşeye vurmak istediğinde, topun kaleyi tutmama ihtimali %40'tır.</p>
                                </div>
                                <div>
                                    <div className="text-emerald-400 font-bold mb-1">90 Reyting</div>
                                    <p className="text-slate-400">Aynı şutta kaleyi tutmama ihtimali %10'dur. Top köşelere (90'a) çok daha isabetli gider.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'PLAYSTYLES' && (
                <div>
                    <p className="text-slate-400 text-sm mb-6">
                        Oyun Tarzları (Playstyles), standart istatistiklerin üzerine eklenen "Perk" (Özel Yetenek) sistemidir.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { name: "Bencil (Selfish)", desc: "Pas vermek yerine zor pozisyonda kaleye vurmayı veya çalım atmayı dener. Şut ve dribbling bonusu alır." },
                            { name: "Plase Şut (Finesse Shot)", desc: "Şut çekildiğinde topa kavis (curve) verir. Kalecilerin bu şutları çıkarması çok daha zordur." },
                            { name: "Uzun Topla Pas (Long Ball Pass)", desc: "40+ metredeki hedeflere ekstra isabet sağlar. Oyunu ters kanada açmada ustadır." },
                            { name: "Teknik (Technical)", desc: "Top sürerken topun ayaktan açılma mesafesini %20 azaltır. Dar alanda topu kaptırmaz." },
                            { name: "Amansız (Relentless)", desc: "Devre arasında ve maç içinde kondisyonu diğerlerinden %20 daha hızlı yenilenir. Maç sonuna kadar diri kalır." },
                            { name: "Seri (Rapid)", desc: "Depar atarken maksimum hızına çok daha kısa sürede ulaşır (Hızlanma bonusu)." },
                            { name: "Hava Hakimi (Aerial)", desc: "Kafa toplarında zıplama ve isabet bonusu alır." },
                            { name: "Top Kesici (Interceptor)", desc: "Pas arası yapma ihtimali ve reaksiyon süresi artar." }
                        ].map((ps, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-800 rounded border border-slate-700">
                                <div className="mt-1 bg-yellow-500/20 p-1.5 rounded text-yellow-400"><Zap size={14}/></div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{ps.name}</h4>
                                    <p className="text-xs text-slate-400">{ps.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'GK' && (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-yellow-500">
                        <h3 className="text-xl font-bold text-white mb-2">Kaleci Mantığı: "Görünmez İp"</h3>
                        <p className="text-sm text-slate-300">
                            Kodda, top ile kale merkezini birbirine bağlayan hayali bir çizgi (vektör) çizilir.
                            Kaleci bu çizgi üzerinde, kaleden biraz önde (açıyı daraltmak için) durmaya çalışır.
                            <br/><br/>
                            <strong>90 Pozisyonlu Kaleci:</strong> Sanki topa iple bağlıymış gibi hareket eder. Şut çekildiği an, matematiksel olarak kalesini en çok kapatan noktadadır.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><Shield size={16}/> Reyting Farkı</h4>
                            <ul className="space-y-3 text-sm text-slate-300">
                                <li className="bg-slate-800 p-3 rounded">
                                    <div className="font-bold text-white mb-1">70'lik Kaleci</div>
                                    Zor şutları bazen sektirir (Rebound), dönen top gol olur. Birebirde çabuk yere yatar. Maçı kazandırmaz.
                                </li>
                                <li className="bg-slate-800 p-3 rounded">
                                    <div className="font-bold text-white mb-1">90'lık Kaleci</div>
                                    "İmkansız" denilen köşeye giden topları çıkarır. Sert şutları sektirmez, bloke eder. Birebirde forvetin "Soğukkanlılık" özelliğini düşürür.
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2"><MousePointer2 size={16}/> Özel Kaleci Yetenekleri</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li>
                                    <strong className="text-white">Libero Kaleci:</strong> Defans arkasına atılan toplarda kalesini terk edip topu süpürür (Neuer/Ederson stili).
                                </li>
                                <li>
                                    <strong className="text-white">Uzağa Fırlatma:</strong> Eliyle orta sahayı geçen paslar atarak kontra atağı başlatır.
                                </li>
                                <li>
                                    <strong className="text-white">Ayak Hakimiyeti:</strong> Geri pas aldığında paniklemez, oyunu kurar.
                                </li>
                                <li>
                                    <strong className="text-white">Ortaya Çıkan:</strong> Yan toplarda çizgisinde beklemez, kalabalığın içine dalarak topu yumruklar.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};
