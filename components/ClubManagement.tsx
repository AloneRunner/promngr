
import React, { useState } from 'react';
import { Team, Translation, Player, TeamStaff } from '../types';
import { Building2, TrendingUp, TrendingDown, Users, Wallet, Briefcase, GraduationCap, Star, Tv, ShoppingBag, Hammer, ArrowRight, DoorOpen, UserCog, Stethoscope, Microscope, ClipboardList, Activity, Eye, Ticket, Home, Dumbbell, Shield, Banknote } from 'lucide-react';
import { TICKET_PRICE, LEAGUE_TICKET_PRICES } from '../constants';
import { PlayerAvatar } from './PlayerAvatar';

import { LEAGUE_PRESETS } from '../src/data/teams';
import { getLeagueMultiplier, BASE_LEAGUE_REPUTATION } from '../services/engine';

const LEAGUE_NAMES = LEAGUE_PRESETS.reduce((acc: Record<string, string>, league) => {
    acc[league.id] = league.name;
    return acc;
}, {});

interface ClubManagementProps {
    team: Team;
    players: Player[];
    t: Translation;
    onPromoteYouth: (player: Player) => void;
    onResign: () => void;
    onUpgradeStaff?: (role: keyof TeamStaff) => void;
    onUpgradeFacility?: (type: 'stadium' | 'training' | 'academy') => void;
    onDowngradeFacility?: (type: 'stadium' | 'training' | 'academy') => void;
    onPlayerClick?: (player: Player) => void;
}

// Helper Functions (Restored)
const getPotentialGrade = (potential: number) => {
    if (potential >= 90) return 'A+';
    if (potential >= 85) return 'A';
    if (potential >= 80) return 'B';
    if (potential >= 75) return 'C';
    if (potential >= 70) return 'D';
    return 'F';
};

const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    return 'text-red-400';
};

const FinanceRow = ({ icon: Icon, label, value, type }: { icon: any, label: string, value: number, type: 'income' | 'expense' }) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-700/50 last:border-0">
        <span className="text-slate-400 flex items-center gap-2">
            <Icon size={14} className={type === 'income' ? 'text-emerald-500' : 'text-red-500'} /> {label}
        </span>
        <span className={`font-mono ${type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
            {type === 'income' ? '+' : '-'}€{value.toLocaleString()}
        </span>
    </div>
);

export const ClubManagement: React.FC<ClubManagementProps> = ({ team, players, t, onPromoteYouth, onResign, onUpgradeStaff, onUpgradeFacility, onDowngradeFacility, onPlayerClick }) => {
    const [tab, setTab] = useState<'FINANCE' | 'FACILITIES' | 'ACADEMY' | 'STAFF'>('FINANCE');

    const totalWages = players.reduce((sum, p) => sum + p.wage, 0);
    const staff = team.staff || { headCoachLevel: 1, scoutLevel: 1, physioLevel: 1 };

    // DYNAMIC TICKET PRICE: Based on Reputation AND League Standing
    // Formula: Price scales with reputation (div 100). 
    // Example: 2000 Rep -> €20. 5000 Rep -> €50. 8000 Rep -> €80.
    const leagueMinPrice = LEAGUE_TICKET_PRICES[team.leagueId] || LEAGUE_TICKET_PRICES['default'];
    const reputationPrice = Math.floor(team.reputation / 100);

    // NEW: League Reputation Factor from Engine
    // If league reputation grows, base price baseline grows (e.g. Kenya becoming Premier League level)
    const leagueBaseRep = BASE_LEAGUE_REPUTATION[team.leagueId] || 40; // Default 40
    // If League Rep is high (e.g. 80+), minimum price should be higher (e.g. €40)
    const dynamicLeagueMin = Math.floor(leagueBaseRep / 2);

    const ticketPrice = Math.max(leagueMinPrice, reputationPrice, dynamicLeagueMin);

    // Coordinate Multiplier for Maintenance Calculation (NOW USING ENGINE LOGIC)
    const coeffMultiplier = getLeagueMultiplier(team.leagueId);

    // 0.8 is average occupancy, 1.3 is home bonus
    const estimatedTicketIncome = Math.floor(team.facilities.stadiumCapacity * ticketPrice * 0.8 * 1.3);

    // Safe access for old save files and new financial object
    const youthCandidates = team.youthCandidates || [];
    const fin = team.financials || {
        lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0, ffpSolidarity: 0 },
        lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0, ffpTax: 0 }
    };

    // Maintenance Discount Logic (Matches Engine)
    const maintenanceDiscount = ['tr', 'fr'].includes(team.leagueId) ? 0.7 : 1.0;

    // Helper for projected maintenance (Matches Engine: Level^1.3 * Base * Discount * LeagueMult)
    const getProjectedMaintenance = (type: 'stadium' | 'training' | 'academy', level: number) => {
        const base = type === 'stadium' ? 2000 : type === 'training' ? 1500 : 1200;
        // EXACT ENGINE FORMULA:
        return Math.floor(Math.pow(level, 1.3) * base * maintenanceDiscount * coeffMultiplier);
    };

    return (
        <div className="animate-fade-in relative">
            {/* Navigation - Premium Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                <button
                    onClick={() => setTab('FINANCE')}
                    className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 border ${tab === 'FINANCE'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-400/50 shadow-lg shadow-emerald-900/50'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-700/80 hover:text-slate-200'}`}
                >
                    <Wallet size={18} className={tab === 'FINANCE' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} /> {t.finances}
                </button>
                <button
                    onClick={() => setTab('FACILITIES')}
                    className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 border ${tab === 'FACILITIES'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400/50 shadow-lg shadow-blue-900/50'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-700/80 hover:text-slate-200'}`}
                >
                    <Building2 size={18} className={tab === 'FACILITIES' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} /> {t.facilities}
                </button>
                <button
                    onClick={() => setTab('ACADEMY')}
                    className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 border ${tab === 'ACADEMY'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400/50 shadow-lg shadow-purple-900/50'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-700/80 hover:text-slate-200'}`}
                >
                    <GraduationCap size={18} className={tab === 'ACADEMY' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''} /> {t.youthAcademy}
                </button>
                <button
                    onClick={() => setTab('STAFF')}
                    className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 border ${tab === 'STAFF'
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400/50 shadow-lg shadow-cyan-900/50'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-700/80 hover:text-slate-200'}`}
                >
                    <UserCog size={18} className={tab === 'STAFF' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''} /> {t.staff}
                </button>

                <button
                    onClick={onResign}
                    className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 bg-gradient-to-r from-red-900/50 to-red-800/30 text-red-300 hover:from-red-800/60 hover:to-red-700/40 hover:text-white ml-auto border border-red-700/50"
                >
                    <DoorOpen size={18} /> {t.resign}
                </button>
            </div>

            {tab === 'FINANCE' && (
                <div className="flex flex-col gap-4 animate-fade-in pb-10">
                    {/* Main Budget Panel */}
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between gap-4 border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/20 p-3 rounded-xl border border-emerald-500/30 shadow-lg">
                                <Wallet className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={26} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-lg">{t.finances}</h2>
                                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">{t.clubBudget || "Club Budget"}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-mono text-emerald-400 font-bold tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">€{(team.budget / 1000000).toFixed(2)}M</div>
                        </div>
                    </div>

                    {/* Projections */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-red-900/30 to-slate-900/80 backdrop-blur p-4 rounded-2xl flex flex-col justify-between border border-red-500/20 shadow-lg">
                            <div className="text-[10px] uppercase text-red-400/70 font-bold mb-1 tracking-wider">{t.weeklyWage}</div>
                            <div className="flex items-end justify-between">
                                <span className="text-lg font-mono text-red-400 font-bold drop-shadow-[0_0_6px_rgba(248,113,113,0.4)]">-€{totalWages.toLocaleString()}</span>
                                <TrendingDown size={18} className="text-red-400 mb-1 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/80 backdrop-blur p-4 rounded-2xl flex flex-col justify-between border border-emerald-500/20 shadow-lg">
                            <div className="text-[10px] uppercase text-emerald-400/70 font-bold mb-1 tracking-wider">{t.estMatchIncome}</div>
                            <div className="flex items-end justify-between">
                                <span className="text-lg font-mono text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]">+€{estimatedTicketIncome.toLocaleString()}</span>
                                <TrendingUp size={18} className="text-emerald-400 mb-1 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                    </div>

                    {/* Weekly Report Table - IMPROVED */}
                    <div className="fm-panel rounded-xl overflow-hidden">
                        <div className="bg-slate-900/50 p-2 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.lastWeekReport}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                            {/* Income Column */}
                            <div className="p-3">
                                <h4 className="text-[10px] uppercase text-emerald-500 font-bold mb-2 flex items-center gap-1"><TrendingUp size={10} /> {t.income}</h4>
                                <div className="space-y-1">
                                    <FinanceRow icon={Ticket} label={t.ticketSales || "Ticket Sales"} value={fin.lastWeekIncome.tickets} type="income" />
                                    <FinanceRow icon={Briefcase} label="Sponsor" value={team.sponsor?.weeklyIncome || 0} type="income" />
                                    {(fin.lastWeekIncome.winBonus || 0) > 0 && (
                                        <FinanceRow icon={Star} label={t.winBonus || "Win Bonus"} value={fin.lastWeekIncome.winBonus} type="income" />
                                    )}
                                    <FinanceRow icon={ShoppingBag} label={t.merchandise} value={Math.floor(fin.lastWeekIncome.merchandise)} type="income" />
                                    <FinanceRow icon={Tv} label={t.tvRights} value={fin.lastWeekIncome.tvRights} type="income" />
                                    {fin.lastWeekIncome.transfers > 0 && <FinanceRow icon={Users} label={t.playerSales} value={fin.lastWeekIncome.transfers} type="income" />}
                                    {(fin.lastWeekIncome.ffpSolidarity || 0) > 0 && (
                                        <FinanceRow icon={Banknote} label={t.ffpSolidarityFund || "FFP Solidarity"} value={fin.lastWeekIncome.ffpSolidarity} type="income" />
                                    )}
                                </div>
                            </div>

                            {/* Expense Column */}
                            <div className="p-3">
                                <h4 className="text-[10px] uppercase text-red-500 font-bold mb-2 flex items-center gap-1"><TrendingDown size={10} /> {t.expenses}</h4>
                                <div className="space-y-1">
                                    <FinanceRow icon={Users} label={t.wages} value={fin.lastWeekExpenses.wages} type="expense" />
                                    <FinanceRow icon={Hammer} label={t.maintenance} value={fin.lastWeekExpenses.maintenance} type="expense" />
                                    <FinanceRow icon={GraduationCap} label={t.academy} value={fin.lastWeekExpenses.academy} type="expense" />
                                    {fin.lastWeekExpenses.transfers > 0 && <FinanceRow icon={Users} label={t.transfers} value={fin.lastWeekExpenses.transfers} type="expense" />}
                                    {(fin.lastWeekExpenses.ffpTax || 0) > 0 && (
                                        <FinanceRow icon={Shield} label={t.ffpLuxuryTax || "FFP Luxury Tax"} value={fin.lastWeekExpenses.ffpTax} type="expense" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* NET BALANCE SUMMARY */}
                        <div className="bg-slate-800/50 p-3 border-t border-white/10">
                            {(() => {
                                const totalIncome = fin.lastWeekIncome.tickets +
                                    (team.sponsor?.weeklyIncome || 0) +
                                    (fin.lastWeekIncome.winBonus || 0) +
                                    fin.lastWeekIncome.merchandise +
                                    fin.lastWeekIncome.tvRights +
                                    fin.lastWeekIncome.transfers +
                                    (fin.lastWeekIncome.ffpSolidarity || 0);
                                const totalExpense = fin.lastWeekExpenses.wages +
                                    fin.lastWeekExpenses.maintenance +
                                    fin.lastWeekExpenses.academy +
                                    fin.lastWeekExpenses.transfers +
                                    (fin.lastWeekExpenses.ffpTax || 0);
                                const netBalance = totalIncome - totalExpense;
                                const isPositive = netBalance >= 0;

                                return (
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-slate-400">
                                            <span className="text-emerald-400">+€{totalIncome.toLocaleString()}</span>
                                            <span className="mx-2">-</span>
                                            <span className="text-red-400">€{totalExpense.toLocaleString()}</span>
                                        </div>
                                        <div className={`text-lg font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isPositive ? '=' : ''} €{netBalance.toLocaleString()}
                                            <span className="text-[10px] text-slate-500 ml-1">/hafta</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {team.sponsor && (
                        <div className="fm-panel rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">{t.activeSponsor}</div>
                                <div className="text-lg font-bold text-white leading-tight">{team.sponsor.name}</div>
                                <div className="text-xs text-slate-400">{team.sponsor.description}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">{t.winBonus}</div>
                                <div className="text-lg font-mono text-emerald-400 font-bold">€{team.sponsor.winBonus.toLocaleString()}</div>
                            </div>
                        </div>
                    )}

                    {/* 🎫 DETAILED TICKET BREAKDOWN */}
                    <div className="fm-panel rounded-xl overflow-hidden">
                        <div className="bg-emerald-900/30 p-3 border-b border-emerald-500/20">
                            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                <Ticket size={16} /> {t.gateReceiptsDetail}
                            </h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                    <div className="text-[10px] uppercase text-slate-500 mb-1">{t.stadiumCapacity}</div>
                                    <div className="text-lg font-mono text-white font-bold">{team.facilities.stadiumCapacity.toLocaleString()}</div>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                    <div className="text-[10px] uppercase text-slate-500 mb-1">{t.ticketPrice}</div>
                                    <div className="text-lg font-mono text-emerald-400 font-bold">€{ticketPrice}</div>
                                </div>
                            </div>
                            {fin.lastWeekIncome.tickets > 0 && (
                                <div className="bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-[10px] uppercase text-emerald-400/70">{t.lastMatchAttendance}</div>
                                        <div className="text-[10px] uppercase text-emerald-400/70">{t.income}</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-bold text-white">
                                            {Math.floor(fin.lastWeekIncome.tickets / ticketPrice).toLocaleString()} {t.ticketsSold || 'bilet'} x €{ticketPrice}
                                        </div>
                                        <div className="text-xl font-mono text-emerald-400 font-bold">
                                            = €{fin.lastWeekIncome.tickets.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400 border-t border-emerald-500/10 pt-1">
                                        {t.occupancy}: %{Math.floor((fin.lastWeekIncome.tickets / ticketPrice) / team.facilities.stadiumCapacity * 100)} {t.occupancyLabel || 'Doluluk'}
                                    </div>
                                </div>
                            )}

                            {/* Season Transfer Balance */}
                            {((fin.seasonTotals?.transferIncomeThisSeason || 0) > 0 || (fin.seasonTotals?.transferExpensesThisSeason || 0) > 0) && (
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                    <div className="text-[10px] uppercase text-slate-500 mb-2">{t.seasonTransferBalance || 'Season Transfer Balance'}</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">
                                            <span className="text-emerald-400">+€{(fin.seasonTotals?.transferIncomeThisSeason || 0).toLocaleString()}</span>
                                            <span className="mx-2">|</span>
                                            <span className="text-red-400">-€{(fin.seasonTotals?.transferExpensesThisSeason || 0).toLocaleString()}</span>
                                        </span>
                                        <span className={`text-sm font-mono font-bold ${(fin.seasonTotals?.transferIncomeThisSeason || 0) - (fin.seasonTotals?.transferExpensesThisSeason || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            €{((fin.seasonTotals?.transferIncomeThisSeason || 0) - (fin.seasonTotals?.transferExpensesThisSeason || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🛠️ MAINTENANCE BREAKDOWN */}
                    <div className="fm-panel rounded-xl overflow-hidden">
                        <div className="bg-red-900/30 p-3 border-b border-red-500/20">
                            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                                <Hammer size={16} /> {t.maintenanceDetail}
                            </h3>
                        </div>
                        <div className="p-4">
                            {(() => {
                                // Calculate maintenance costs per facility (same formula as engine.ts)
                                const leagueMult = getLeagueMultiplier(team.leagueId);
                                const maintenanceDiscount = ['tr', 'fr'].includes(team.leagueId) ? 0.7 : 1.0;

                                const stadiumMaint = Math.pow(team.facilities.stadiumLevel, 1.3) * 2000 * maintenanceDiscount;
                                const trainingMaint = Math.pow(team.facilities.trainingLevel, 1.3) * 1500 * maintenanceDiscount;
                                const academyMaint = Math.pow(team.facilities.academyLevel, 1.3) * 1200 * maintenanceDiscount;

                                // Apply the same multiplier as engine.ts
                                const totalMaint = Math.floor((stadiumMaint + trainingMaint + academyMaint) * (0.8 + (leagueMult * 0.2)));

                                // Initial display values (mock breakdown for display, ensuring total matches)
                                const displayStadium = Math.floor(stadiumMaint * (0.8 + (leagueMult * 0.2)));
                                const displayTraining = Math.floor(trainingMaint * (0.8 + (leagueMult * 0.2)));
                                const displayAcademy = Math.floor(academyMaint * (0.8 + (leagueMult * 0.2)));

                                return (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                            <span className="text-slate-400 flex items-center gap-2">
                                                <Home size={14} className="text-blue-400" /> Stadyum (Lv.{team.facilities.stadiumLevel})
                                            </span>
                                            <span className="font-mono text-red-400">-€{displayStadium.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                            <span className="text-slate-400 flex items-center gap-2">
                                                <Dumbbell size={14} className="text-emerald-400" /> Antrenman (Lv.{team.facilities.trainingLevel})
                                            </span>
                                            <span className="font-mono text-red-400">-€{displayTraining.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                            <span className="text-slate-400 flex items-center gap-2">
                                                <GraduationCap size={14} className="text-purple-400" /> Akademi (Lv.{team.facilities.academyLevel})
                                            </span>
                                            <span className="font-mono text-red-400">-€{displayAcademy.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 font-bold">
                                            <span className="text-white">{t.totalMaintenance}</span>
                                            <span className="font-mono text-red-400">-€{totalMaint.toLocaleString()}/hafta</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* 💰 TOP WAGE EARNERS */}
                    <div className="fm-panel rounded-xl overflow-hidden">
                        <div className="bg-yellow-900/30 p-3 border-b border-yellow-500/20">
                            <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                                <Users size={16} /> {t.highestEarners}
                            </h3>
                        </div>
                        <div className="p-4">
                            <div className="space-y-2">
                                {[...players].sort((a, b) => b.wage - a.wage).slice(0, 5).map((player, idx) => (
                                    <div key={player.id}
                                        onClick={() => onPlayerClick && onPlayerClick(player)}
                                        className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-800/50 cursor-pointer rounded px-2 -mx-2 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <div className="text-white font-medium text-sm">{player.firstName} {player.lastName}</div>
                                                <div className="text-[10px] text-slate-500">{player.position} • {player.overall} OVR</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono text-red-400 font-bold">-€{player.wage.toLocaleString()}</span>
                                            <div className="text-[10px] text-slate-500">/hafta</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">{t.totalWages} ({players.length} {t.people || 'players'})</span>
                                <span className="font-mono text-red-400 font-bold">-€{totalWages.toLocaleString()}/hafta</span>
                            </div>
                        </div>
                    </div>

                    {/* 📈 REPUTATION & CONFIDENCE HISTORY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Reputation History */}
                        <div className="fm-panel rounded-xl overflow-hidden">
                            <div className="bg-purple-900/30 p-3 border-b border-purple-500/20">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                                        📈 {t.reputationHistory}
                                    </h3>
                                    <span className="text-lg font-mono text-white font-bold">{team.reputation.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-3 max-h-48 overflow-y-auto">
                                {(team.reputationHistory || []).length === 0 ? (
                                    <div className="text-slate-500 text-xs text-center py-4">{t.noChangesYet}</div>
                                ) : (
                                    <div className="space-y-1">
                                        {[...(team.reputationHistory || [])].reverse().slice(0, 10).map((h, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-700/30 text-xs">
                                                <div className="text-slate-400">
                                                    <span className="text-slate-500">{t.weekShort}{h.week}</span> {h.reason}
                                                </div>
                                                <span className={`font-mono font-bold ${h.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {h.change > 0 ? '+' : ''}{h.change}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Confidence History */}
                        <div className="fm-panel rounded-xl overflow-hidden">
                            <div className="bg-cyan-900/30 p-3 border-b border-cyan-500/20">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                                        🎯 {t.confidenceHistory}
                                    </h3>
                                    <span className="text-lg font-mono text-white font-bold">{team.boardConfidence || 70}%</span>
                                </div>
                            </div>
                            <div className="p-3 max-h-48 overflow-y-auto">
                                {(team.confidenceHistory || []).length === 0 ? (
                                    <div className="text-slate-500 text-xs text-center py-4">{t.noChangesYet}</div>
                                ) : (
                                    <div className="space-y-1">
                                        {[...(team.confidenceHistory || [])].reverse().slice(0, 10).map((h, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-700/30 text-xs">
                                                <div className="text-slate-400">
                                                    <span className="text-slate-500">{t.weekShort}{h.week}</span> {h.reason}
                                                </div>
                                                <span className={`font-mono font-bold ${h.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {h.change > 0 ? '+' : ''}{h.change}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 📊 MUHASEBE DEFTERİ - Financial History */}
                    {fin.history && fin.history.length > 0 && (
                        <div className="fm-panel rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-3 border-b border-blue-500/20">
                                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                                    <ClipboardList size={16} /> {t.financialHistory || "Muhasebe Defteri"}
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-1">{t.lastWeeksRecords || "Son haftalardaki mali işlemler"}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-900/50 border-b border-slate-700">
                                        <tr>
                                            <th className="p-2 text-left text-slate-400 font-bold">Hafta</th>
                                            <th className="p-2 text-right text-emerald-400 font-bold">Gelir</th>
                                            <th className="p-2 text-right text-red-400 font-bold">Gider</th>
                                            <th className="p-2 text-right text-blue-400 font-bold">Net</th>
                                            <th className="p-2 text-right text-slate-400 font-bold">Bütçe</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...fin.history].reverse().map((record: any, idx: number) => (
                                            <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                <td className="p-2 text-slate-300">
                                                    <div className="font-bold">H{record.week}</div>
                                                    <div className="text-[10px] text-slate-500">S{record.season}</div>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <div className="font-mono text-emerald-400 font-bold">+€{(record.income.total / 1000000).toFixed(2)}M</div>
                                                    <div className="text-[9px] text-slate-500 space-y-0.5 mt-1">
                                                        {record.income.tickets > 0 && <div>🎫 €{(record.income.tickets / 1000).toFixed(0)}K</div>}
                                                        {record.income.tvRights > 0 && <div>📺 €{(record.income.tvRights / 1000).toFixed(0)}K</div>}
                                                        {record.income.sponsor > 0 && <div>💼 €{(record.income.sponsor / 1000).toFixed(0)}K</div>}
                                                        {(record.income.seasonEnd || 0) > 0 && <div className="text-yellow-400">🏆 €{(record.income.seasonEnd / 1000000).toFixed(1)}M</div>}
                                                        {(record.income.cupPrize || 0) > 0 && <div className="text-purple-400">🏅 €{(record.income.cupPrize / 1000000).toFixed(1)}M</div>}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <div className="font-mono text-red-400 font-bold">-€{(record.expenses.total / 1000000).toFixed(2)}M</div>
                                                    <div className="text-[9px] text-slate-500 space-y-0.5 mt-1">
                                                        {record.expenses.wages > 0 && <div>👥 €{(record.expenses.wages / 1000).toFixed(0)}K</div>}
                                                        {record.expenses.maintenance > 0 && <div>🔧 €{(record.expenses.maintenance / 1000).toFixed(0)}K</div>}
                                                        {(record.expenses.facilityUpgrade || 0) > 0 && <div className="text-orange-400">🏗️ €{(record.expenses.facilityUpgrade / 1000000).toFixed(1)}M</div>}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <div className={`font-mono font-bold ${record.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {record.balance >= 0 ? '+' : ''}€{(record.balance / 1000000).toFixed(2)}M
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <div className="font-mono text-slate-300">€{(record.budgetAfter / 1000000).toFixed(2)}M</div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {record.budgetAfter > record.budgetBefore ? '📈' : '📉'}
                                                        {((record.budgetAfter - record.budgetBefore) / 1000000).toFixed(2)}M
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {tab === 'FACILITIES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {/* Stadium Card - IMPROVED with upgrade info */}
                    <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700 shadow-xl">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                <Building2 className="text-blue-500" size={18} /> {t.stadium}
                            </h2>
                            <div className="text-right">
                                <span className="block text-[9px] uppercase text-slate-500 font-bold">LEVEL</span>
                                <span className="text-lg font-black text-white">{team.facilities.stadiumLevel}<span className="text-slate-600 text-sm">/15</span></span>
                            </div>
                        </div>

                        <div className="relative h-16 md:h-20 bg-slate-900 rounded-lg mb-2 overflow-hidden border border-slate-600">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                            <div className="absolute bottom-1 left-2">
                                <div className="text-white font-bold text-sm">{team.city} Arena</div>
                                <div className="text-emerald-400 text-[10px] font-mono">{team.facilities.stadiumCapacity.toLocaleString()} Koltuk</div>
                            </div>
                            {/* Construction Overlay */}
                            {team.facilities.stadiumConstructionWeeks && team.facilities.stadiumConstructionWeeks > 0 ? (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 backdrop-blur-sm">
                                    <div className="text-yellow-400 font-bold text-xs flex items-center gap-1 animate-pulse">
                                        <Hammer size={12} /> İNŞAAT SÜRÜYOR
                                    </div>
                                    <div className="text-white text-[10px] mt-1">
                                        Bitiş: {team.facilities.stadiumConstructionWeeks} hafta
                                    </div>
                                    <div className="w-full max-w-[120px] bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                        <div className="bg-yellow-500 h-full animate-pulse-slow w-full"></div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Upgrade Info */}
                        {team.facilities.stadiumLevel < 25 && (
                            <div className="bg-slate-900/50 rounded p-2 mb-2 text-[10px]">
                                <div className="flex justify-between text-slate-400 mb-1">
                                    <span>{t.currentLabel || 'Current'}:</span>
                                    <span className="text-white">{team.facilities.stadiumCapacity.toLocaleString()} {t.seatsLabel || 'seats'}</span>
                                </div>
                                {!team.facilities.stadiumConstructionWeeks ? (
                                    <>
                                        <div className="flex justify-between text-blue-400">
                                            <span>→ {t.newLabel || 'New'}:</span>
                                            <span className="font-bold">{(team.facilities.stadiumCapacity + 6000).toLocaleString()} {t.seatsLabel || 'seats'} (+6,000)</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 mt-1 border-t border-slate-700/50 pt-1">
                                            <span>{t.maintIncreaseLabel || 'Maintenance increase'}:</span>
                                            <span className="text-red-400">+€{(getProjectedMaintenance('stadium', team.facilities.stadiumLevel + 1) - getProjectedMaintenance('stadium', team.facilities.stadiumLevel)).toLocaleString()}/hafta</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-yellow-500 text-center py-1">⚠️ Construction in progress</div>
                                )}
                            </div>
                        )}

                        <div className="mb-2">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Level Progress</span>
                                <span>{(team.facilities.stadiumLevel / 25 * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(team.facilities.stadiumLevel / 25) * 100}%` }}></div>
                            </div>
                        </div>

                        <button
                            onClick={() => onUpgradeFacility && onUpgradeFacility('stadium')}
                            disabled={team.facilities.stadiumLevel >= 25 || (team.facilities.stadiumConstructionWeeks || 0) > 0 || (() => {
                                const nextLevel = team.facilities.stadiumLevel + 1;
                                const baseCost = 200000;
                                const levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
                                const cost = Math.floor(baseCost * levelMultiplier * (1 + nextLevel * 0.05));
                                return team.budget < cost;
                            })()}
                            className={`w-full py-2 font-bold text-sm rounded-lg flex items-center justify-center gap-1 transition-all
                                ${team.facilities.stadiumConstructionWeeks && team.facilities.stadiumConstructionWeeks > 0
                                    ? 'bg-yellow-600/20 text-yellow-500 cursor-not-allowed border border-yellow-600/50'
                                    : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white'}`}
                        >
                            {team.facilities.stadiumConstructionWeeks && team.facilities.stadiumConstructionWeeks > 0 ? (
                                <><Hammer size={14} className="animate-spin-slow" /> İnşaat Sürüyor ({team.facilities.stadiumConstructionWeeks}h)</>
                            ) : team.facilities.stadiumLevel >= 25 ? 'MAX LEVEL' : (() => {
                                const nextLevel = team.facilities.stadiumLevel + 1;
                                const baseCost = 200000;
                                const levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
                                const cost = Math.floor(baseCost * levelMultiplier * (1 + nextLevel * 0.05));
                                return `${t.upgradeBtn || 'Upgrade'} (€${(cost / 1000000).toFixed(2)}M)`;
                            })()}
                        </button>

                        {/* Downgrade Button (New) */}
                        {team.facilities.stadiumLevel > 1 && (
                            <button
                                onClick={() => onDowngradeFacility && confirm(t.downgradeConfirm || "Are you sure? This will reduce capacity and maintenance.") && onDowngradeFacility('stadium')}
                                className="w-full mt-2 py-1 bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs border border-slate-600 hover:border-red-500/30 rounded flex items-center justify-center gap-1 transition-colors"
                            >
                                <TrendingDown size={12} /> {t.downgrade || 'Downgrade'} (-€50k)
                            </button>
                        )}
                    </div>

                    {/* Training Centre - IMPROVED with upgrade info */}
                    <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700 shadow-xl">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="text-emerald-500" size={18} /> {t.trainingFacility || 'Training Facility'}
                            </h2>
                            <div className="text-right">
                                <span className="block text-[9px] uppercase text-slate-500 font-bold">LEVEL</span>
                                <span className="text-lg font-black text-white">{team.facilities.trainingLevel}<span className="text-slate-600 text-sm">/25</span></span>
                            </div>
                        </div>

                        <div className="relative h-16 md:h-20 bg-slate-900 rounded-lg mb-2 overflow-hidden border border-slate-600">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                            <div className="absolute bottom-1 left-2">
                                <div className="text-white font-bold text-sm">{t.performanceCenter || 'Performance Center'}</div>
                                <div className="text-emerald-400 text-[10px] font-mono">+{(team.facilities.trainingLevel * 1).toFixed(0)}% {t.playerDevelopment || 'Player Development'}</div>
                            </div>
                            {/* Construction Overlay */}
                            {team.facilities.trainingConstructionWeeks && team.facilities.trainingConstructionWeeks > 0 ? (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 backdrop-blur-sm">
                                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-1 animate-pulse">
                                        <Hammer size={12} /> İNŞAAT SÜRÜYOR
                                    </div>
                                    <div className="text-white text-[10px] mt-1">
                                        Bitiş: {team.facilities.trainingConstructionWeeks} hafta
                                    </div>
                                    <div className="w-full max-w-[120px] bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                        <div className="bg-emerald-500 h-full animate-pulse-slow w-full"></div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Upgrade Info */}
                        {team.facilities.trainingLevel < 25 && (
                            <div className="bg-slate-900/50 rounded p-2 mb-2 text-[10px]">
                                <div className="flex justify-between text-slate-400 mb-1">
                                    <span>{t.currentLabel || 'Current'} bonus:</span>
                                    <span className="text-white">+{team.facilities.trainingLevel}% {t.developmentSpeed || 'development speed'}</span>
                                </div>
                                <div className="flex justify-between text-emerald-400">
                                    <span>→ {t.newLabel || 'New'}:</span>
                                    <span className="font-bold">+{team.facilities.trainingLevel + 1}% {t.developmentSpeed || 'development speed'}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 mt-1 border-t border-slate-700/50 pt-1">
                                    <span>{t.maintIncreaseLabel || 'Maintenance increase'}:</span>
                                    <span className="text-red-400">+€{(getProjectedMaintenance('training', team.facilities.trainingLevel + 1) - getProjectedMaintenance('training', team.facilities.trainingLevel)).toLocaleString()}/hafta</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-2">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>{t.qualityLabel || 'Quality'}</span>
                                <span>{(team.facilities.trainingLevel / 25 * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(team.facilities.trainingLevel / 25) * 100}%` }}></div>
                            </div>
                        </div>

                        <button
                            onClick={() => onUpgradeFacility && onUpgradeFacility('training')}
                            disabled={team.facilities.trainingLevel >= 25 || (team.facilities.trainingConstructionWeeks || 0) > 0 || (() => {
                                const nextLevel = team.facilities.trainingLevel + 1;
                                const levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
                                return team.budget < Math.floor(300000 * levelMultiplier * (1 + nextLevel * 0.05));
                            })()}
                            className={`w-full py-2 font-bold text-sm rounded-lg flex items-center justify-center gap-1 transition-all
                                ${team.facilities.trainingConstructionWeeks && team.facilities.trainingConstructionWeeks > 0
                                    ? 'bg-emerald-900/40 text-emerald-500 cursor-not-allowed border border-emerald-600/50'
                                    : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white'}`}
                        >
                            {team.facilities.trainingConstructionWeeks && team.facilities.trainingConstructionWeeks > 0 ? (
                                <><Hammer size={14} className="animate-spin-slow" /> İnşaat Sürüyor ({team.facilities.trainingConstructionWeeks}h)</>
                            ) : team.facilities.trainingLevel >= 25 ? 'MAX' : (() => {
                                const nextLevel = team.facilities.trainingLevel + 1;
                                const levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
                                const cost = Math.floor(300000 * levelMultiplier * (1 + nextLevel * 0.05));
                                return `${t.upgradeBtn || 'Upgrade'} (€${(cost / 1000000).toFixed(2)}M)`;
                            })()}
                        </button>

                        {/* Downgrade Button (New) */}
                        {team.facilities.trainingLevel > 1 && (
                            <button
                                onClick={() => onDowngradeFacility && confirm(t.downgradeConfirm || "Are you sure? This will reduce training quality and maintenance.") && onDowngradeFacility('training')}
                                className="w-full mt-2 py-1 bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs border border-slate-600 hover:border-red-500/30 rounded flex items-center justify-center gap-1 transition-colors"
                            >
                                <TrendingDown size={12} /> {t.downgrade || 'Downgrade'} (-€50k)
                            </button>
                        )}
                    </div>

                    {/* Youth Academy - IMPROVED with upgrade info */}
                    <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 shadow-xl md:col-span-2">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <GraduationCap className="text-yellow-500" /> {t.youthAcademyFacility || 'Youth Academy'}
                            </h2>
                            <div className="text-right">
                                <span className="block text-[10px] uppercase text-slate-500 font-bold">{t.levelLabel || 'Level'}</span>
                                <span className="text-xl md:text-2xl font-black text-white">{team.facilities.academyLevel}<span className="text-slate-600 text-lg">/25</span></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="relative h-full min-h-[120px] md:min-h-[140px] bg-slate-900 rounded-lg overflow-hidden border border-slate-600 group">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-110"></div>
                                <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                                    <div className="text-white font-bold text-base md:text-lg">{t.nextGenAcademy || 'Next Gen Academy'}</div>
                                    <div className="text-yellow-400 text-xs md:text-sm font-mono">+{team.facilities.academyLevel * 2}% {t.betterYouthLabel || 'better youth'}</div>
                                </div>
                                {/* Construction Overlay */}
                                {team.facilities.academyConstructionWeeks && team.facilities.academyConstructionWeeks > 0 ? (
                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 backdrop-blur-sm z-10">
                                        <div className="text-purple-400 font-bold text-xs flex items-center gap-1 animate-pulse">
                                            <Hammer size={12} /> İNŞAAT SÜRÜYOR
                                        </div>
                                        <div className="text-white text-[10px] mt-1">
                                            Bitiş: {team.facilities.academyConstructionWeeks} hafta
                                        </div>
                                        <div className="w-full max-w-[120px] bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div className="bg-purple-500 h-full animate-pulse-slow w-full"></div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex flex-col justify-center space-y-3">
                                {/* Upgrade Info */}
                                {team.facilities.academyLevel < 25 && (
                                    <div className="bg-slate-900/50 rounded p-2 text-[10px]">
                                        <div className="flex justify-between text-slate-400 mb-1">
                                            <span>{t.currentLabel || 'Current'}:</span>
                                            <span className="text-white">+{team.facilities.academyLevel * 2}% {t.youthQualityLabel || 'youth quality'}</span>
                                        </div>
                                        <div className="flex justify-between text-yellow-400">
                                            <span>→ {t.newLabel || 'New'}:</span>
                                            <span className="font-bold">+{(team.facilities.academyLevel + 1) * 2}% {t.youthQualityLabel || 'youth quality'}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 mt-1 border-t border-slate-700/50 pt-1">
                                            <span>{t.maintIncreaseLabel || 'Maintenance increase'}:</span>
                                            <span className="text-red-400">+€{(getProjectedMaintenance('academy', team.facilities.academyLevel + 1) - getProjectedMaintenance('academy', team.facilities.academyLevel)).toLocaleString()}/hafta</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between text-[10px] md:text-xs text-slate-400 mb-1">
                                        <span>{t.scoutNetworkLabel || 'Scout Network'}</span>
                                        <span>{(team.facilities.academyLevel / 25 * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-900 rounded-full h-1.5 md:h-2 overflow-hidden">
                                        <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${(team.facilities.academyLevel / 25) * 100}%` }}></div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onUpgradeFacility && onUpgradeFacility('academy')}
                                    disabled={team.facilities.academyLevel >= 25 || (team.facilities.academyConstructionWeeks || 0) > 0 || (() => {
                                        const nextLevel = team.facilities.academyLevel + 1;
                                        const levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
                                        return team.budget < Math.floor(250000 * levelMultiplier * (1 + nextLevel * 0.05));
                                    })()}
                                    className={`w-full py-2 md:py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm
                                        ${team.facilities.academyConstructionWeeks && team.facilities.academyConstructionWeeks > 0
                                            ? 'bg-purple-900/40 text-purple-500 cursor-not-allowed border border-purple-600/50'
                                            : 'bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white'}`}
                                >
                                    {team.facilities.academyConstructionWeeks && team.facilities.academyConstructionWeeks > 0 ? (
                                        <><Hammer size={16} className="animate-spin-slow" /> İnşaat Sürüyor ({team.facilities.academyConstructionWeeks}h)</>
                                    ) : team.facilities.academyLevel >= 25 ? 'MAX SEVİYE' : (() => {
                                        const nextLevel = team.facilities.academyLevel + 1;
                                        const levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
                                        const cost = Math.floor(250000 * levelMultiplier * (1 + nextLevel * 0.05));
                                        return `${t.upgradeBtn || 'Upgrade'} (€${(cost / 1000000).toFixed(2)}M)`;
                                    })()}
                                </button>
                            </div>
                        </div>
                    </div>
                </div >
            )}

            {
                tab === 'ACADEMY' && (
                    <div className="space-y-6">
                        {/* ... existing academy ... */}
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <GraduationCap className="text-purple-500" /> {t.youthAcademy}
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-1">{t.scoutReport}</p>
                                    <p className="text-purple-400/80 text-xs mt-2 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/20">
                                        🌍 Scoutlar dünya genelinden genç yetenekler bulur. Bu oyuncular başka kulüplerin altyapısından gelir.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">{t.level}</div>
                                    <div className="text-xl font-bold text-purple-400">{team.facilities.academyLevel}</div>
                                </div>
                            </div>

                            {youthCandidates.length === 0 ? (
                                <div className="text-center py-10 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
                                    <Users className="mx-auto text-slate-600 mb-2" size={32} />
                                    <p className="text-slate-500">{t.academyEmpty}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {youthCandidates.map(player => {
                                        const potentialGrade = getPotentialGrade(player.potential);
                                        return (
                                            <div key={player.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center group hover:border-purple-500 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <PlayerAvatar visual={player.visual} size="md" />
                                                    <div>
                                                        <div className="font-bold text-white">{player.firstName} {player.lastName}</div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <span className="bg-slate-800 px-1 rounded">{player.position}</span>
                                                            <span>{player.age} {t.age}</span>
                                                            <span>• {player.nationality}</span>
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-1 text-xs">
                                                            <span className="text-slate-500">{t.current}:</span>
                                                            <span className="text-slate-300 font-bold">{player.overall}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-slate-500 uppercase">{t.potential}</div>
                                                        <div className={`text-2xl ${getGradeColor(potentialGrade)} flex items-center justify-end gap-1`}>
                                                            {potentialGrade} <Star size={14} fill="currentColor" className="opacity-50" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {onPlayerClick && (
                                                            <button
                                                                onClick={() => onPlayerClick(player)}
                                                                className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-2 py-1.5 rounded transition-all flex items-center gap-1"
                                                                title="Detayları Gör"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => onPromoteYouth(player)}
                                                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-all shadow-lg shadow-purple-900/20"
                                                        >
                                                            {t.promotePlayer} (-€{(player.value / 1000).toFixed(0)}k)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* STAFF TAB - IMPROVED with upgrade benefits */}
            {
                tab === 'STAFF' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Assistant Coach */}
                        <div className="bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-700 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><ClipboardList size={80} /></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-3 text-white shadow-lg">
                                    <ClipboardList size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t.assistantCoachTitle || 'Assistant Coach'}</h3>
                                <p className="text-xs text-slate-400 mb-3">{t.assistantCoachDesc || 'Increases training efficiency and tactical harmony.'}</p>

                                <div className="bg-slate-900/50 p-3 rounded mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-xs uppercase font-bold">{t.levelLabel || 'Level'}</span>
                                        <span className="text-blue-400 font-bold text-xl">{staff.headCoachLevel}<span className="text-slate-600 text-sm">/10</span></span>
                                    </div>
                                    {staff.headCoachLevel < 10 && (
                                        <div className="text-[10px] space-y-1 border-t border-slate-700/50 pt-2">
                                            <div className="flex justify-between text-slate-400">
                                                <span>{t.currentLabel || 'Current'}:</span>
                                                <span className="text-white">+{(staff.headCoachLevel * 1.5).toFixed(1)}% {t.trainingEfficiency || 'training efficiency'}</span>
                                            </div>
                                            <div className="flex justify-between text-blue-400">
                                                <span>→ {t.newLabel || 'New'}:</span>
                                                <span className="font-bold">+{((staff.headCoachLevel + 1) * 1.5).toFixed(1)}% {t.trainingEfficiency || 'training efficiency'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onUpgradeStaff && onUpgradeStaff('headCoachLevel')}
                                    disabled={staff.headCoachLevel >= 10}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors text-sm"
                                >
                                    {staff.headCoachLevel >= 10 ? 'MAX' : `${t.upgradeBtn || 'Upgrade'} (€${(Math.floor(100000 * Math.pow(1.5, staff.headCoachLevel)) / 1000).toLocaleString()}K)`}
                                </button>
                            </div>
                        </div>

                        {/* Head Scout */}
                        <div className="bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-700 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Microscope size={80} /></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mb-3 text-white shadow-lg">
                                    <Microscope size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t.headScoutTitle || 'Head Scout'}</h3>
                                <p className="text-xs text-slate-400 mb-3">{t.headScoutDesc || 'Finds better youth talents, reveals hidden attributes.'}</p>

                                <div className="bg-slate-900/50 p-3 rounded mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-xs uppercase font-bold">{t.levelLabel || 'Level'}</span>
                                        <span className="text-purple-400 font-bold text-xl">{staff.scoutLevel}<span className="text-slate-600 text-sm">/10</span></span>
                                    </div>
                                    {staff.scoutLevel < 10 && (
                                        <div className="text-[10px] space-y-1 border-t border-slate-700/50 pt-2">
                                            <div className="flex justify-between text-slate-400">
                                                <span>{t.currentLabel || 'Current'}:</span>
                                                <span className="text-white">+{staff.scoutLevel}% {t.youthDiscoveryChance || 'youth discovery chance'}</span>
                                            </div>
                                            <div className="flex justify-between text-purple-400">
                                                <span>→ {t.newLabel || 'New'}:</span>
                                                <span className="font-bold">+{staff.scoutLevel + 1}% {t.youthDiscoveryChance || 'youth discovery chance'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onUpgradeStaff && onUpgradeStaff('scoutLevel')}
                                    disabled={staff.scoutLevel >= 10}
                                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors text-sm"
                                >
                                    {staff.scoutLevel >= 10 ? 'MAX' : `${t.upgradeBtn || 'Upgrade'} (€${(Math.floor(100000 * Math.pow(2, staff.scoutLevel)) / 1000).toLocaleString()}K)`}
                                </button>
                            </div>
                        </div>

                        {/* Head Physio */}
                        <div className="bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-700 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Stethoscope size={80} /></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center mb-3 text-white shadow-lg">
                                    <Stethoscope size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t.headPhysioTitle || 'Head Physio'}</h3>
                                <p className="text-xs text-slate-400 mb-3">{t.headPhysioDesc || 'Speeds up injury recovery, reduces fatigue accumulation.'}</p>

                                <div className="bg-slate-900/50 p-3 rounded mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-xs uppercase font-bold">{t.levelLabel || 'Level'}</span>
                                        <span className="text-red-400 font-bold text-xl">{staff.physioLevel}<span className="text-slate-600 text-sm">/10</span></span>
                                    </div>
                                    {staff.physioLevel < 10 && (
                                        <div className="text-[10px] space-y-1 border-t border-slate-700/50 pt-2">
                                            <div className="flex justify-between text-slate-400">
                                                <span>{t.currentLabel || 'Current'}:</span>
                                                <span className="text-white">+{staff.physioLevel * 3} {t.conditionPerWeek || 'condition/week'}</span>
                                            </div>
                                            <div className="flex justify-between text-red-400">
                                                <span>→ {t.newLabel || 'New'}:</span>
                                                <span className="font-bold">+{(staff.physioLevel + 1) * 3} {t.conditionPerWeek || 'condition/week'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onUpgradeStaff && onUpgradeStaff('physioLevel')}
                                    disabled={staff.physioLevel >= 10}
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors text-sm"
                                >
                                    {staff.physioLevel >= 10 ? 'MAX' : `${t.upgradeBtn || 'Upgrade'} (€${(Math.floor(100000 * Math.pow(2, staff.physioLevel)) / 1000).toLocaleString()}K)`}
                                </button>
                            </div>
                        </div>

                    </div>
                )
            }
        </div >
    );
};
