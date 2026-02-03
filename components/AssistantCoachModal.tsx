import React from 'react';
import { Team, Translation, TacticalMatchRecord } from '../types';
import { Brain, TrendingUp, Shield, AlertTriangle, CheckCircle, HelpCircle, X, Footprints, Users, BarChart3 } from 'lucide-react';
import { analyzeUserHistory } from '../services/tactics';

interface AssistantCoachModalProps {
    userTeam: Team;
    opponent: Team;
    tacticalHistory: TacticalMatchRecord[];
    onClose: () => void;
    t: Translation;
}

// Get tactic label based on translation
const getTacticLabel = (key: string, t: Translation): string => {
    const labels: Record<string, keyof Translation> = {
        'Balanced': 'tacticBalanced',
        'Possession': 'tacticPossession',
        'Counter': 'tacticCounter',
        'HighPress': 'tacticHighPress',
        'ParkTheBus': 'tacticParkTheBus',
        'Safe': 'safe',
        'Normal': 'normal',
        'Aggressive': 'aggressive',
        'Slow': 'slow',
        'Fast': 'fast'
    };
    const translationKey = labels[key];
    if (translationKey && t[translationKey]) return t[translationKey] as string;
    return key;
};

export const AssistantCoachModal: React.FC<AssistantCoachModalProps> = ({
    userTeam,
    opponent,
    tacticalHistory,
    onClose,
    t
}) => {
    const matchCount = tacticalHistory.length;

    // Experience level
    const getExperienceLevel = () => {
        if (matchCount < 5) return { level: 'rookie', icon: HelpCircle, color: 'slate' };
        if (matchCount < 15) return { level: 'experienced', icon: TrendingUp, color: 'blue' };
        if (matchCount < 30) return { level: 'expert', icon: Brain, color: 'purple' };
        return { level: 'master', icon: BarChart3, color: 'amber' };
    };

    const experience = getExperienceLevel();

    // Past matches against this specific opponent
    const pastMatchesVsOpponent = tacticalHistory.filter(
        m => m.homeTeamId === opponent.id || m.awayTeamId === opponent.id
    );

    // Get opponent's tactics
    const opponentStyle = opponent.tactic?.style || 'Balanced';
    const opponentFormation = opponent.tactic?.formation;
    const opponentAggression = opponent.tactic?.aggression || 'Normal';

    // === HISTORY-BASED ANALYSIS ===
    // Analyze user's past performance against THIS TYPE of opponent
    const analysisVsFormation = analyzeUserHistory(tacticalHistory, opponentFormation, undefined);
    const analysisVsStyle = analyzeUserHistory(tacticalHistory, undefined, opponentStyle);
    const overallAnalysis = analyzeUserHistory(tacticalHistory);

    // Get the best recommendation based on history
    const getBestFormation = () => {
        // Priority: matches vs this specific formation > overall best
        if (analysisVsFormation.bestFormation && analysisVsFormation.bestFormationMatches >= 3) {
            return {
                formation: analysisVsFormation.bestFormation,
                winRate: analysisVsFormation.bestFormationWinRate,
                matches: analysisVsFormation.bestFormationMatches,
                context: `${opponentFormation} karşısında`
            };
        }
        if (overallAnalysis.bestFormation) {
            return {
                formation: overallAnalysis.bestFormation,
                winRate: overallAnalysis.bestFormationWinRate,
                matches: overallAnalysis.bestFormationMatches,
                context: 'genel'
            };
        }
        return null;
    };

    const getBestStyle = () => {
        if (analysisVsStyle.bestStyle && analysisVsStyle.bestStyleMatches >= 3) {
            return {
                style: analysisVsStyle.bestStyle,
                winRate: analysisVsStyle.bestStyleWinRate,
                matches: analysisVsStyle.bestStyleMatches,
                context: `${getTacticLabel(opponentStyle, t)} karşısında`
            };
        }
        if (overallAnalysis.bestStyle) {
            return {
                style: overallAnalysis.bestStyle,
                winRate: overallAnalysis.bestStyleWinRate,
                matches: overallAnalysis.bestStyleMatches,
                context: 'genel'
            };
        }
        return null;
    };

    const bestFormation = getBestFormation();
    const bestStyle = getBestStyle();

    // Check if we have ANY usable data
    const hasEnoughData = matchCount >= 5;
    const hasFormationData = bestFormation !== null;
    const hasStyleData = bestStyle !== null;

    // Translation keys
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
                    {/* Opponent Analysis */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="text-red-400" size={18} />
                            <span className="font-bold text-white">{t.opponentAnalysis || 'Rakip Analizi'}: {opponent.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-slate-900/50 p-2 rounded">
                                <span className="text-slate-500 text-xs">{t.formation || 'Diziliş'}</span>
                                <div className="text-blue-400 font-mono font-bold">{opponentFormation}</div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded">
                                <span className="text-slate-500 text-xs">{t.playStyle || 'Oyun Stili'}</span>
                                <div className="text-purple-400 font-bold">{getTacticLabel(opponentStyle, t)}</div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded col-span-2">
                                <span className="text-slate-500 text-xs">{t.aggressiveness || 'Agresiflik'}</span>
                                <div className="text-orange-400 font-bold">{getTacticLabel(opponentAggression, t)}</div>
                            </div>
                        </div>
                    </div>

                    {/* TACTICAL ADVICE - Based on History */}
                    {hasEnoughData && (hasFormationData || hasStyleData) ? (
                        <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="text-emerald-400" size={20} />
                                <span className="font-bold text-emerald-400 text-lg">📊 {t.myTacticalAdvice || 'Geçmiş Verilerine Göre'}</span>
                            </div>

                            {/* Formation Advice */}
                            {hasFormationData && bestFormation && (
                                <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users className="text-blue-400" size={16} />
                                        <span className="text-slate-400 text-xs uppercase font-bold">{t.formation || 'Diziliş'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-blue-400">{bestFormation.formation}</span>
                                        <span className={`text-sm font-bold ${bestFormation.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            %{bestFormation.winRate} kazanç
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        📈 {bestFormation.context} ({bestFormation.matches} maç)
                                    </p>
                                </div>
                            )}

                            {/* Style Advice */}
                            {hasStyleData && bestStyle && (
                                <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Footprints className="text-purple-400" size={16} />
                                        <span className="text-slate-400 text-xs uppercase font-bold">{t.playStyle || 'Oyun Stili'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-purple-400">{getTacticLabel(bestStyle.style, t)}</span>
                                        <span className={`text-sm font-bold ${bestStyle.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            %{bestStyle.winRate} kazanç
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        � {bestStyle.context} ({bestStyle.matches} maç)
                                    </p>
                                </div>
                            )}

                            {/* Summary */}
                            {hasFormationData && hasStyleData && bestFormation && bestStyle && (
                                <div className="mt-4 p-3 bg-emerald-800/30 rounded-lg border border-emerald-500/20">
                                    <p className="text-sm text-emerald-200 text-center">
                                        ✅ <strong>{bestFormation.formation}</strong> + <strong>{getTacticLabel(bestStyle.style, t)}</strong> ile başarılısın!
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-amber-900/30 rounded-xl p-3 border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{t.needMoreExperience || 'Veri Yetersiz'}</span>
                            </div>
                            <p className="text-sm text-slate-300">
                                {matchCount < 5
                                    ? `Tavsiye verebilmem için en az 5 maç gerekli. Şu an ${matchCount} maç oynadık.`
                                    : `${opponentFormation} veya ${getTacticLabel(opponentStyle, t)} stiline karşı yeterli verin yok. Denemeni öneririm!`
                                }
                            </p>
                        </div>
                    )}

                    {/* Past Matches Against This Opponent */}
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
                        {t.understood || 'Anladım'}
                    </button>
                </div>
            </div>
        </div>
    );
};
