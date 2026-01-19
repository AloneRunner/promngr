import React from 'react';
import { GameState, Team } from '../types';
import { getTeamLogo } from '../logoMapping';

interface ManagerProfileProps {
    gameState: GameState;
    userTeam: Team;
    t: any;
    onBack: () => void;
}

// Format money (e.g., €1,250,000 -> €1.25M)
const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `€${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}K`;
    return `€${amount}`;
};

// Cup prize info
const CUP_PRIZES = {
    championsLeague: {
        name: 'Şampiyonlar Ligi',
        rounds: [
            { round: 'Son 16 → Çeyrek Final', prize: 5000000 },
            { round: 'Çeyrek Final → Yarı Final', prize: 7500000 },
            { round: 'Yarı Final → Final', prize: 12500000 },
            { round: 'Şampiyonluk', prize: 25000000 }
        ],
        total: 50000000
    },
    uefaCup: {
        name: 'UEFA Cup',
        rounds: [
            { round: 'Son 16 → Çeyrek Final', prize: 2500000 },
            { round: 'Çeyrek Final → Yarı Final', prize: 3750000 },
            { round: 'Yarı Final → Final', prize: 6250000 },
            { round: 'Şampiyonluk', prize: 12500000 }
        ],
        total: 25000000
    },
    superCup: {
        name: 'Süper Kupa',
        rounds: [{ round: 'Şampiyonluk', prize: 25000000 }],
        total: 25000000
    }
};

export const ManagerProfile: React.FC<ManagerProfileProps> = ({ gameState, userTeam, t, onBack }) => {
    const rating = gameState.managerRating || 50;
    const salary = gameState.managerSalary || 50000;
    const trophies = gameState.managerTrophies || {
        leagueTitles: 0, championsLeagueTitles: 0, uefaCupTitles: 0, superCupTitles: 0
    };
    const careerHistory = gameState.managerCareerHistory || [];

    // Calculate total trophies
    const totalTrophies = trophies.leagueTitles + trophies.championsLeagueTitles +
        trophies.uefaCupTitles + trophies.superCupTitles;

    // Rating color
    const getRatingColor = (r: number) => {
        if (r >= 80) return 'text-green-400';
        if (r >= 60) return 'text-yellow-400';
        if (r >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 
                             rounded-lg text-white transition-colors"
                >
                    <span>←</span>
                    <span>{t.back || 'Geri'}</span>
                </button>
                <h1 className="text-2xl font-bold text-white">👔 {t.managerProfileTitle || 'Manager Profile'}</h1>
                <div className="w-20"></div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Profile Card */}
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-2xl p-6 
                              border border-slate-600/30 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 
                                      rounded-full flex items-center justify-center text-4xl">
                            👔
                        </div>

                        <div className="flex-1">
                            <div className="text-gray-400 text-sm">{t.currentTeamLabel || 'Current Team'}</div>
                            <div className="flex items-center gap-3 mt-1">
                                <img
                                    src={getTeamLogo(userTeam.id)}
                                    alt={userTeam.name}
                                    className="w-8 h-8 object-contain"
                                />
                                <span className="text-xl font-bold text-white">{userTeam.name}</span>
                            </div>

                            <div className="flex gap-8 mt-4">
                                <div>
                                    <div className="text-gray-400 text-sm">{t.rating}</div>
                                    <div className={`text-2xl font-bold ${getRatingColor(rating)}`}>
                                        ⭐ {rating}/100
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-sm">{t.weeklySalaryLabel || 'Weekly Salary'}</div>
                                    <div className="text-2xl font-bold text-green-400">
                                        {formatMoney(salary)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-sm">{t.seasonLabel || 'Season'}</div>
                                    <div className="text-2xl font-bold text-white">
                                        {gameState.currentSeason}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trophy Cabinet */}
                <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-600/30">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        🏆 {t.trophyCabinetTitle || 'Trophy Cabinet'}
                        <span className="text-sm text-gray-400 ml-2">({totalTrophies} {t.trophyCount || 'trophies'})</span>
                    </h2>

                    <div className="grid grid-cols-4 gap-4">
                        {/* League Title */}
                        <div className="bg-gradient-to-b from-amber-900/40 to-amber-950/40 rounded-xl p-4 
                                      text-center border border-amber-600/30">
                            <div className="text-4xl mb-2">🏆</div>
                            <div className="text-amber-400 font-bold text-2xl">{trophies.leagueTitles}</div>
                            <div className="text-gray-400 text-sm">{t.leagueTitleLabel || 'League Title'}</div>
                        </div>

                        {/* Champions League */}
                        <div className="bg-gradient-to-b from-blue-900/40 to-blue-950/40 rounded-xl p-4 
                                      text-center border border-blue-600/30">
                            <div className="text-4xl mb-2">🏆</div>
                            <div className="text-blue-400 font-bold text-2xl">{trophies.championsLeagueTitles}</div>
                            <div className="text-gray-400 text-sm">{t.championsLeagueLabel || 'Champions League'}</div>
                        </div>

                        {/* UEFA Cup */}
                        <div className="bg-gradient-to-b from-orange-900/40 to-orange-950/40 rounded-xl p-4 
                                      text-center border border-orange-600/30">
                            <div className="text-4xl mb-2">🥈</div>
                            <div className="text-orange-400 font-bold text-2xl">{trophies.uefaCupTitles}</div>
                            <div className="text-gray-400 text-sm">UEFA Cup</div>
                        </div>

                        {/* Super Cup */}
                        <div className="bg-gradient-to-b from-purple-900/40 to-purple-950/40 rounded-xl p-4 
                                      text-center border border-purple-600/30">
                            <div className="text-4xl mb-2">⭐</div>
                            <div className="text-purple-400 font-bold text-2xl">{trophies.superCupTitles}</div>
                            <div className="text-gray-400 text-sm">{t.superCupLabel || 'Super Cup'}</div>
                        </div>
                    </div>
                </div>

                {/* Career History */}
                <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-600/30">
                    <h2 className="text-xl font-bold text-white mb-4">📊 {t.careerHistoryTitle || 'Career History'}</h2>

                    {careerHistory.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            {t.noCareerHistoryYet || 'No career history yet. Complete your first season!'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-400 border-b border-slate-600">
                                        <th className="pb-3">Sezon</th>
                                        <th className="pb-3">{t.team || 'Team'}</th>
                                        <th className="pb-3 text-center">{t.positionLabel || 'Position'}</th>
                                        <th className="pb-3 text-center">{t.rating}</th>
                                        <th className="pb-3 text-center">{t.trophiesLabel || 'Trophies'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {careerHistory.slice().reverse().map((entry, idx) => (
                                        <tr key={idx} className="border-b border-slate-700/50">
                                            <td className="py-3 text-white font-medium">{entry.season}</td>
                                            <td className="py-3 text-white">{entry.teamName}</td>
                                            <td className="py-3 text-center">
                                                <span className={`px-2 py-1 rounded ${entry.position === 1 ? 'bg-amber-500/20 text-amber-400' :
                                                    entry.position <= 4 ? 'bg-green-500/20 text-green-400' :
                                                        'bg-slate-600/50 text-gray-300'
                                                    }`}>
                                                    #{entry.position}
                                                </span>
                                            </td>
                                            <td className={`py-3 text-center font-bold ${getRatingColor(entry.rating)}`}>
                                                {entry.rating}
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {entry.leagueChampion && <span title="Lig Şampiyonu">🏆</span>}
                                                    {entry.championsLeagueWinner && <span title="CL Şampiyonu">🌟</span>}
                                                    {entry.uefaCupWinner && <span title="UEFA Cup Şampiyonu">🥈</span>}
                                                    {entry.superCupWinner && <span title="Süper Kupa">⭐</span>}
                                                    {!entry.leagueChampion && !entry.championsLeagueWinner &&
                                                        !entry.uefaCupWinner && !entry.superCupWinner && (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Cup Prize Info */}
                <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-600/30">
                    <h2 className="text-xl font-bold text-white mb-4">💰 {t.cupPrizeInfoTitle || 'Cup Prize Info'}</h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(CUP_PRIZES).map(([key, cup]) => (
                            <div key={key} className="bg-slate-700/50 rounded-xl p-4">
                                <h3 className="font-bold text-white mb-3">{cup.name}</h3>
                                <div className="space-y-2">
                                    {cup.rounds.map((r, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-400">{r.round}</span>
                                            <span className="text-green-400">{formatMoney(r.prize)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-600 pt-2 mt-2 flex justify-between font-bold">
                                        <span className="text-white">{t.totalLabel || 'Total'}</span>
                                        <span className="text-green-400">{formatMoney(cup.total)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
