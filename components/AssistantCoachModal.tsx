import React from 'react';
import { Team, Translation, TacticalMatchRecord } from '../types';
import { Brain, TrendingUp, Shield, Zap, Target, AlertTriangle, CheckCircle, HelpCircle, X, Footprints, Gauge, Timer, Users } from 'lucide-react';

interface AssistantCoachModalProps {
    userTeam: Team;
    opponent: Team;
    tacticalHistory: TacticalMatchRecord[];
    onClose: () => void;
    t: Translation;
}

// Türkçe taktik çevirileri
const TACTIC_TR: Record<string, string> = {
    'Balanced': 'Dengeli',
    'Possession': 'Topa Sahip Ol',
    'Counter': 'Kontra Atak',
    'HighPress': 'Yüksek Pres',
    'ParkTheBus': 'Kapalı Savunma',
    'Safe': 'Temkinli',
    'Normal': 'Normal',
    'Aggressive': 'Agresif',
    'Slow': 'Yavaş',
    'Fast': 'Hızlı'
};

// Formasyon karşılaştırma mantığı
const FORMATION_COUNTERS: Record<string, { formation: string; reason: string }> = {
    '4-4-2': { formation: '4-3-3', reason: 'Kanat baskısı ortayı zorlayacak' },
    '4-3-3': { formation: '4-5-1', reason: 'Sıkı orta saha kontrolü' },
    '3-5-2': { formation: '4-3-3', reason: 'Kanatlardan aşacaksın' },
    '5-4-1': { formation: '4-3-3', reason: 'Kanat oyuncuları savunmayı zorlayacak' },
    '4-5-1': { formation: '4-4-2', reason: 'İki forvet baskı kuracak' },
    '3-4-3': { formation: '5-3-2', reason: 'Ekstra defans desteği gerekli' },
    '4-2-3-1': { formation: '4-1-4-1', reason: '10 numarayı kapatacaksın' },
    '4-1-4-1': { formation: '4-3-3', reason: 'Orta sahada üstünlük' },
    '4-1-2-1-2 (Diamond)': { formation: '4-5-1', reason: 'Kanatları kullan, dar oynuyorlar' },
    '4-3-2-1 (Xmas Tree)': { formation: '4-4-2', reason: 'Geniş oyna, kenarları zorla' },
    '5-3-2': { formation: '4-3-3', reason: 'Kanatlardan aş' }
};

// Stil karşılaştırma mantığı
const STYLE_COUNTERS: Record<string, { style: string; aggression: string; tempo: string; reason: string }> = {
    'ParkTheBus': { style: 'Possession', aggression: 'Normal', tempo: 'Slow', reason: 'Sabırlı ol, boşluk bekle' },
    'HighPress': { style: 'Counter', aggression: 'Safe', tempo: 'Fast', reason: 'Uzun toplarda hızlı çık' },
    'Possession': { style: 'HighPress', aggression: 'Aggressive', tempo: 'Fast', reason: 'Top kaybında hemen basınç kur' },
    'Counter': { style: 'Possession', aggression: 'Normal', tempo: 'Slow', reason: 'Top sende kalsın, kontra verme' },
    'Balanced': { style: 'HighPress', aggression: 'Normal', tempo: 'Normal', reason: 'Kontrollü baskı etkili olacak' }
};

export const AssistantCoachModal: React.FC<AssistantCoachModalProps> = ({
    userTeam,
    opponent,
    tacticalHistory,
    onClose,
    t
}) => {
    const matchCount = tacticalHistory.length;

    // Deneyim seviyesi
    const getExperienceLevel = () => {
        if (matchCount < 5) return { level: 'rookie', icon: HelpCircle, color: 'slate' };
        if (matchCount < 15) return { level: 'experienced', icon: TrendingUp, color: 'blue' };
        if (matchCount < 30) return { level: 'expert', icon: Brain, color: 'purple' };
        return { level: 'master', icon: Target, color: 'amber' };
    };

    const experience = getExperienceLevel();

    // Rakibe karşı geçmiş maçlar
    const pastMatchesVsOpponent = tacticalHistory.filter(
        m => m.homeTeamId === opponent.id || m.awayTeamId === opponent.id
    );

    // Rakibin taktik stiline karşı istatistikler
    const opponentStyle = opponent.tactic.style || 'Balanced';
    const opponentFormation = opponent.tactic.formation;
    const opponentAggression = opponent.tactic.aggression || 'Normal';

    const matchesVsStyle = tacticalHistory.filter(m => {
        const oppTactic = m.isUserHome ? m.awayTactic : m.homeTactic;
        return oppTactic.style === opponentStyle;
    });

    const winsVsStyle = matchesVsStyle.filter(m => m.userWon).length;
    const winRateVsStyle = matchesVsStyle.length > 0
        ? Math.round((winsVsStyle / matchesVsStyle.length) * 100)
        : null;

    // Formasyon önerisi
    const getFormationAdvice = () => {
        const counter = FORMATION_COUNTERS[opponentFormation];
        if (counter) return counter;
        // Varsayılan
        return { formation: '4-4-2', reason: 'Dengeli yaklaşım en güvenlisi' };
    };

    // Stil önerisi
    const getStyleAdvice = () => {
        const counter = STYLE_COUNTERS[opponentStyle];
        if (counter) return counter;
        // Varsayılan
        return { style: 'Balanced', aggression: 'Normal', tempo: 'Normal', reason: 'Dengeli yaklaşım' };
    };

    const formationAdvice = getFormationAdvice();
    const styleAdvice = getStyleAdvice();

    // Çeviri anahtarları
    const experienceLabels: Record<string, string> = {
        rookie: t.coachRookie || 'Çaylak',
        experienced: t.coachExperienced || 'Deneyimli',
        expert: t.coachExpert || 'Uzman',
        master: t.coachMaster || 'Usta'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Brain className="text-white" size={28} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{t.assistantCoach || 'Yardımcı Antrenör'}</h2>
                            <div className={`text-xs flex items-center gap-1 text-white/80`}>
                                <experience.icon size={12} />
                                <span>{experienceLabels[experience.level]} ({matchCount} {t.matches || 'maç'})</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white p-2">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Rakip Analizi */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="text-red-400" size={18} />
                            <span className="font-bold text-white">{t.opponentAnalysis || 'Rakip Analizi'}: {opponent.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-slate-900/50 p-2 rounded">
                                <span className="text-slate-500 text-xs">Formasyon</span>
                                <div className="text-blue-400 font-mono font-bold">{opponentFormation}</div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded">
                                <span className="text-slate-500 text-xs">Oyun Stili</span>
                                <div className="text-purple-400 font-bold">{TACTIC_TR[opponentStyle] || opponentStyle}</div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded">
                                <span className="text-slate-500 text-xs">Agresiflik</span>
                                <div className="text-orange-400 font-bold">{TACTIC_TR[opponentAggression] || opponentAggression}</div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded">
                                <span className="text-slate-500 text-xs">Tempo</span>
                                <div className="text-cyan-400 font-bold">{TACTIC_TR[opponent.tactic.tempo || 'Normal']}</div>
                            </div>
                        </div>
                    </div>

                    {/* TAKTİK TAVSİYELERİ */}
                    {matchCount >= 3 ? (
                        <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="text-emerald-400" size={20} />
                                <span className="font-bold text-emerald-400 text-lg">🎯 Taktik Tavsiyelerim</span>
                            </div>

                            {/* Formasyon Önerisi */}
                            <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="text-blue-400" size={16} />
                                    <span className="text-slate-400 text-xs uppercase font-bold">Formasyon</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-blue-400">{formationAdvice.formation}</span>
                                    <span className="text-slate-500">oyna</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">💡 {formationAdvice.reason}</p>
                            </div>

                            {/* Stil Önerisi */}
                            <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Footprints className="text-purple-400" size={16} />
                                    <span className="text-slate-400 text-xs uppercase font-bold">Oyun Stili</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-purple-400">{TACTIC_TR[styleAdvice.style]}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">💡 {styleAdvice.reason}</p>
                            </div>

                            {/* Agresiflik & Tempo */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Gauge className="text-orange-400" size={14} />
                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Agresiflik</span>
                                    </div>
                                    <span className="text-lg font-bold text-orange-400">{TACTIC_TR[styleAdvice.aggression]}</span>
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Timer className="text-cyan-400" size={14} />
                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Tempo</span>
                                    </div>
                                    <span className="text-lg font-bold text-cyan-400">{TACTIC_TR[styleAdvice.tempo]}</span>
                                </div>
                            </div>

                            {/* Özet Kutusu */}
                            <div className="mt-4 p-3 bg-emerald-800/30 rounded-lg border border-emerald-500/20">
                                <p className="text-sm text-emerald-200 text-center">
                                    📋 <strong>{formationAdvice.formation}</strong> ile <strong>{TACTIC_TR[styleAdvice.style]}</strong> oyna,
                                    <strong> {TACTIC_TR[styleAdvice.aggression]}</strong> + <strong>{TACTIC_TR[styleAdvice.tempo]}</strong> tempoda
                                </p>
                            </div>

                            {/* İstatistik (yeterli veri varsa) */}
                            {matchesVsStyle.length >= 3 && winRateVsStyle !== null && (
                                <div className="mt-3 pt-3 border-t border-emerald-500/20">
                                    <p className="text-xs text-slate-400">
                                        📊 {TACTIC_TR[opponentStyle]} taktiğine karşı:
                                        <span className={`ml-1 font-bold ${winRateVsStyle >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            %{winRateVsStyle} kazanma
                                        </span>
                                        <span className="text-slate-500 ml-1">({matchesVsStyle.length} maç)</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-amber-900/30 rounded-xl p-3 border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{t.needMoreExperience || 'Deneyim Gerekli'}</span>
                            </div>
                            <p className="text-sm text-slate-300">
                                Detaylı tavsiye verebilmem için birkaç maç daha oynamamız gerekiyor. Şu an {matchCount} maç oynadık.
                            </p>

                            {/* Yine de temel öneri ver */}
                            <div className="mt-3 p-2 bg-slate-800/50 rounded">
                                <p className="text-xs text-slate-400">🎯 Genel öneri: <strong className="text-blue-400">{formationAdvice.formation}</strong> ile <strong className="text-purple-400">{TACTIC_TR[styleAdvice.style]}</strong> dene</p>
                            </div>
                        </div>
                    )}

                    {/* Geçmiş Karşılaşmalar */}
                    {pastMatchesVsOpponent.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="text-blue-400" size={18} />
                                <span className="font-bold text-white">{t.pastMatches || 'Geçmiş Karşılaşmalar'}</span>
                            </div>
                            <div className="space-y-1">
                                {pastMatchesVsOpponent.slice(-3).map((m, i) => {
                                    const userGoals = m.isUserHome ? m.homeGoals : m.awayGoals;
                                    const oppGoals = m.isUserHome ? m.awayGoals : m.homeGoals;
                                    return (
                                        <div key={i} className={`text-xs px-2 py-1 rounded ${m.userWon ? 'bg-emerald-900/30 text-emerald-400' : userGoals === oppGoals ? 'bg-slate-700 text-slate-400' : 'bg-red-900/30 text-red-400'}`}>
                                            {t.season || 'Sezon'} {m.season}, {t.week || 'Hafta'} {m.week}: {userGoals}-{oppGoals}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 sticky bottom-0 bg-slate-900/90 backdrop-blur-sm">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        {t.understood || 'Anladım, Hazırım!'}
                    </button>
                </div>
            </div>
        </div>
    );
};
