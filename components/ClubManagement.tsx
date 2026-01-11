
import React, { useState } from 'react';
import { Team, Translation, Player, TeamStaff } from '../types';
import { Building2, TrendingUp, TrendingDown, Users, Wallet, Briefcase, GraduationCap, Star, Tv, ShoppingBag, Hammer, ArrowRight, DoorOpen, UserCog, Stethoscope, Microscope, ClipboardList, Activity, Eye } from 'lucide-react';
import { TICKET_PRICE } from '../constants';
import { PlayerAvatar } from './PlayerAvatar';

interface ClubManagementProps {
    team: Team;
    players: Player[];
    t: Translation;
    onPromoteYouth: (player: Player) => void;
    onResign: () => void;
    onUpgradeStaff?: (role: keyof TeamStaff) => void;
    onUpgradeFacility?: (type: 'stadium' | 'training' | 'academy') => void;
    onPlayerClick?: (player: Player) => void;
}

export const ClubManagement: React.FC<ClubManagementProps> = ({ team, players, t, onPromoteYouth, onResign, onUpgradeStaff, onUpgradeFacility, onPlayerClick }) => {
    const [tab, setTab] = useState<'FINANCE' | 'FACILITIES' | 'ACADEMY' | 'STAFF'>('FINANCE');

    const totalWages = players.reduce((sum, p) => sum + p.wage, 0);
    const estimatedTicketIncome = team.facilities.stadiumCapacity * TICKET_PRICE * 0.8;

    // Safe access for old save files and new financial object
    const youthCandidates = team.youthCandidates || [];
    const fin = team.financials || {
        lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0, winBonus: 0 },
        lastWeekExpenses: { wages: 0, maintenance: 0, academy: 0, transfers: 0 }
    };

    // Safe access for new staff object
    const staff = team.staff || { headCoachLevel: 1, scoutLevel: 1, physioLevel: 1 };

    const getPotentialGrade = (pot: number) => {
        if (pot >= 90) return 'S';
        if (pot >= 80) return 'A';
        if (pot >= 70) return 'B';
        if (pot >= 60) return 'C';
        return 'D';
    };

    const getGradeColor = (grade: string) => {
        if (grade === 'S') return 'text-purple-400 font-bold';
        if (grade === 'A') return 'text-emerald-400 font-bold';
        if (grade === 'B') return 'text-blue-400';
        if (grade === 'C') return 'text-yellow-400';
        return 'text-slate-500';
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
                    <UserCog size={18} className={tab === 'STAFF' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''} /> Staff
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
                                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Kulüp Bütçesi</div>
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
                                    <FinanceRow icon={Briefcase} label="Sponsor" value={team.sponsor?.weeklyIncome || 0} type="income" />
                                    {(fin.lastWeekIncome.winBonus || 0) > 0 && (
                                        <FinanceRow icon={Star} label={t.winBonus || "Galibiyet Primi"} value={fin.lastWeekIncome.winBonus} type="income" />
                                    )}
                                    <FinanceRow icon={ShoppingBag} label={t.merchandise} value={Math.floor(fin.lastWeekIncome.merchandise)} type="income" />
                                    <FinanceRow icon={Tv} label={t.tvRights} value={fin.lastWeekIncome.tvRights} type="income" />
                                    {fin.lastWeekIncome.transfers > 0 && <FinanceRow icon={Users} label={t.playerSales} value={fin.lastWeekIncome.transfers} type="income" />}
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
                                </div>
                            </div>
                        </div>

                        {/* NET BALANCE SUMMARY */}
                        <div className="bg-slate-800/50 p-3 border-t border-white/10">
                            {(() => {
                                const totalIncome = (team.sponsor?.weeklyIncome || 0) +
                                    (fin.lastWeekIncome.winBonus || 0) +
                                    fin.lastWeekIncome.merchandise +
                                    fin.lastWeekIncome.tvRights +
                                    fin.lastWeekIncome.transfers;
                                const totalExpense = fin.lastWeekExpenses.wages +
                                    fin.lastWeekExpenses.maintenance +
                                    fin.lastWeekExpenses.academy +
                                    fin.lastWeekExpenses.transfers;
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
                                <span className="text-lg font-black text-white">{team.facilities.stadiumLevel}<span className="text-slate-600 text-sm">/25</span></span>
                            </div>
                        </div>

                        <div className="relative h-16 md:h-20 bg-slate-900 rounded-lg mb-2 overflow-hidden border border-slate-600">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                            <div className="absolute bottom-1 left-2">
                                <div className="text-white font-bold text-sm">{team.city} Arena</div>
                                <div className="text-emerald-400 text-[10px] font-mono">{(5000 + (team.facilities.stadiumLevel - 1) * 6000).toLocaleString()} Koltuk</div>
                            </div>
                        </div>

                        {/* Upgrade Info */}
                        {team.facilities.stadiumLevel < 25 && (
                            <div className="bg-slate-900/50 rounded p-2 mb-2 text-[10px]">
                                <div className="flex justify-between text-slate-400 mb-1">
                                    <span>Mevcut:</span>
                                    <span className="text-white">{(5000 + (team.facilities.stadiumLevel - 1) * 6000).toLocaleString()} koltuk</span>
                                </div>
                                <div className="flex justify-between text-blue-400">
                                    <span>→ Yeni:</span>
                                    <span className="font-bold">{(5000 + team.facilities.stadiumLevel * 6000).toLocaleString()} koltuk (+6,000)</span>
                                </div>
                                <div className="flex justify-between text-slate-500 mt-1 border-t border-slate-700/50 pt-1">
                                    <span>Bakım artışı:</span>
                                    <span className="text-red-400">+€{Math.floor((Math.pow(team.facilities.stadiumLevel + 1, 1.8) - Math.pow(team.facilities.stadiumLevel, 1.8)) * 4000).toLocaleString()}/hafta</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-2">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Progress</span>
                                <span>{(team.facilities.stadiumLevel / 25 * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(team.facilities.stadiumLevel / 25) * 100}%` }}></div>
                            </div>
                        </div>

                        <button
                            onClick={() => onUpgradeFacility && onUpgradeFacility('stadium')}
                            disabled={team.facilities.stadiumLevel >= 25 || team.budget < 5000000}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-1"
                        >
                            <Hammer size={14} /> {team.facilities.stadiumLevel >= 25 ? 'MAX' : 'Yükselt (€5.0M)'}
                        </button>
                    </div>

                    {/* Training Centre - IMPROVED with upgrade info */}
                    <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700 shadow-xl">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="text-emerald-500" size={18} /> Antrenman Tesisi
                            </h2>
                            <div className="text-right">
                                <span className="block text-[9px] uppercase text-slate-500 font-bold">LEVEL</span>
                                <span className="text-lg font-black text-white">{team.facilities.trainingLevel}<span className="text-slate-600 text-sm">/25</span></span>
                            </div>
                        </div>

                        <div className="relative h-16 md:h-20 bg-slate-900 rounded-lg mb-2 overflow-hidden border border-slate-600">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                            <div className="absolute bottom-1 left-2">
                                <div className="text-white font-bold text-sm">Performans Merkezi</div>
                                <div className="text-emerald-400 text-[10px] font-mono">+{(team.facilities.trainingLevel * 1).toFixed(0)}% Oyuncu Gelişimi</div>
                            </div>
                        </div>

                        {/* Upgrade Info */}
                        {team.facilities.trainingLevel < 25 && (
                            <div className="bg-slate-900/50 rounded p-2 mb-2 text-[10px]">
                                <div className="flex justify-between text-slate-400 mb-1">
                                    <span>Mevcut bonus:</span>
                                    <span className="text-white">+{team.facilities.trainingLevel}% gelişim hızı</span>
                                </div>
                                <div className="flex justify-between text-emerald-400">
                                    <span>→ Yeni:</span>
                                    <span className="font-bold">+{team.facilities.trainingLevel + 1}% gelişim hızı</span>
                                </div>
                                <div className="flex justify-between text-slate-500 mt-1 border-t border-slate-700/50 pt-1">
                                    <span>Bakım artışı:</span>
                                    <span className="text-red-400">+€{Math.floor((Math.pow(team.facilities.trainingLevel + 1, 1.8) - Math.pow(team.facilities.trainingLevel, 1.8)) * 3500).toLocaleString()}/hafta</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-2">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Kalite</span>
                                <span>{(team.facilities.trainingLevel / 25 * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(team.facilities.trainingLevel / 25) * 100}%` }}></div>
                            </div>
                        </div>

                        <button
                            onClick={() => onUpgradeFacility && onUpgradeFacility('training')}
                            disabled={team.facilities.trainingLevel >= 25 || team.budget < 3000000}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-1"
                        >
                            <Hammer size={14} /> {team.facilities.trainingLevel >= 25 ? 'MAX' : 'Yükselt (€3.0M)'}
                        </button>
                    </div>

                    {/* Youth Academy - IMPROVED with upgrade info */}
                    <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 shadow-xl md:col-span-2">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <GraduationCap className="text-yellow-500" /> Altyapı Akademisi
                            </h2>
                            <div className="text-right">
                                <span className="block text-[10px] uppercase text-slate-500 font-bold">Akademi Seviyesi</span>
                                <span className="text-xl md:text-2xl font-black text-white">{team.facilities.academyLevel}<span className="text-slate-600 text-lg">/25</span></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="relative h-full min-h-[120px] md:min-h-[140px] bg-slate-900 rounded-lg overflow-hidden border border-slate-600 group">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-110"></div>
                                <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                                    <div className="text-white font-bold text-base md:text-lg">Yeni Nesil Akademi</div>
                                    <div className="text-yellow-400 text-xs md:text-sm font-mono">+{team.facilities.academyLevel * 2}% daha kaliteli gençler</div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center space-y-3">
                                {/* Upgrade Info */}
                                {team.facilities.academyLevel < 25 && (
                                    <div className="bg-slate-900/50 rounded p-2 text-[10px]">
                                        <div className="flex justify-between text-slate-400 mb-1">
                                            <span>Mevcut:</span>
                                            <span className="text-white">+{team.facilities.academyLevel * 2}% genç kalitesi</span>
                                        </div>
                                        <div className="flex justify-between text-yellow-400">
                                            <span>→ Yeni:</span>
                                            <span className="font-bold">+{(team.facilities.academyLevel + 1) * 2}% genç kalitesi</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 mt-1 border-t border-slate-700/50 pt-1">
                                            <span>Bakım artışı:</span>
                                            <span className="text-red-400">+€{Math.floor((Math.pow(team.facilities.academyLevel + 1, 1.8) - Math.pow(team.facilities.academyLevel, 1.8)) * 2500).toLocaleString()}/hafta</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between text-[10px] md:text-xs text-slate-400 mb-1">
                                        <span>Keşif Ağı</span>
                                        <span>{(team.facilities.academyLevel / 25 * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-900 rounded-full h-1.5 md:h-2 overflow-hidden">
                                        <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${(team.facilities.academyLevel / 25) * 100}%` }}></div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onUpgradeFacility && onUpgradeFacility('academy')}
                                    disabled={team.facilities.academyLevel >= 25 || team.budget < 2500000}
                                    className="w-full py-2 md:py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Hammer size={16} /> {team.facilities.academyLevel >= 25 ? 'MAX SEVİYE' : 'Yükselt (€2.5M)'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
                                <h3 className="text-lg font-bold text-white">Yardımcı Antrenör</h3>
                                <p className="text-xs text-slate-400 mb-3">Antrenman verimliliğini ve taktik uyumu artırır.</p>

                                <div className="bg-slate-900/50 p-3 rounded mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-xs uppercase font-bold">Seviye</span>
                                        <span className="text-blue-400 font-bold text-xl">{staff.headCoachLevel}<span className="text-slate-600 text-sm">/10</span></span>
                                    </div>
                                    {staff.headCoachLevel < 10 && (
                                        <div className="text-[10px] space-y-1 border-t border-slate-700/50 pt-2">
                                            <div className="flex justify-between text-slate-400">
                                                <span>Mevcut:</span>
                                                <span className="text-white">+{(staff.headCoachLevel * 1.5).toFixed(1)}% antrenman verimliliği</span>
                                            </div>
                                            <div className="flex justify-between text-blue-400">
                                                <span>→ Yeni:</span>
                                                <span className="font-bold">+{((staff.headCoachLevel + 1) * 1.5).toFixed(1)}% antrenman verimliliği</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onUpgradeStaff && onUpgradeStaff('headCoachLevel')}
                                    disabled={staff.headCoachLevel >= 10}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors text-sm"
                                >
                                    {staff.headCoachLevel >= 10 ? 'MAX SEVİYE' : `Yükselt (€${(staff.headCoachLevel * 100).toLocaleString()}K)`}
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
                                <h3 className="text-lg font-bold text-white">Baş Scout</h3>
                                <p className="text-xs text-slate-400 mb-3">Daha iyi genç yetenekler bulur, gizli özellikleri ortaya çıkarır.</p>

                                <div className="bg-slate-900/50 p-3 rounded mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-xs uppercase font-bold">Seviye</span>
                                        <span className="text-purple-400 font-bold text-xl">{staff.scoutLevel}<span className="text-slate-600 text-sm">/10</span></span>
                                    </div>
                                    {staff.scoutLevel < 10 && (
                                        <div className="text-[10px] space-y-1 border-t border-slate-700/50 pt-2">
                                            <div className="flex justify-between text-slate-400">
                                                <span>Mevcut:</span>
                                                <span className="text-white">+{staff.scoutLevel}% genç keşif şansı</span>
                                            </div>
                                            <div className="flex justify-between text-purple-400">
                                                <span>→ Yeni:</span>
                                                <span className="font-bold">+{staff.scoutLevel + 1}% genç keşif şansı</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onUpgradeStaff && onUpgradeStaff('scoutLevel')}
                                    disabled={staff.scoutLevel >= 10}
                                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors text-sm"
                                >
                                    {staff.scoutLevel >= 10 ? 'MAX SEVİYE' : `Yükselt (€${(staff.scoutLevel * 100).toLocaleString()}K)`}
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
                                <h3 className="text-lg font-bold text-white">Baş Fizyoterapist</h3>
                                <p className="text-xs text-slate-400 mb-3">Sakatlık iyileşmesini hızlandırır, yorgunluk birikimini azaltır.</p>

                                <div className="bg-slate-900/50 p-3 rounded mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-xs uppercase font-bold">Seviye</span>
                                        <span className="text-red-400 font-bold text-xl">{staff.physioLevel}<span className="text-slate-600 text-sm">/10</span></span>
                                    </div>
                                    {staff.physioLevel < 10 && (
                                        <div className="text-[10px] space-y-1 border-t border-slate-700/50 pt-2">
                                            <div className="flex justify-between text-slate-400">
                                                <span>Mevcut:</span>
                                                <span className="text-white">+{staff.physioLevel * 3} kondisyon/hafta</span>
                                            </div>
                                            <div className="flex justify-between text-red-400">
                                                <span>→ Yeni:</span>
                                                <span className="font-bold">+{(staff.physioLevel + 1) * 3} kondisyon/hafta</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onUpgradeStaff && onUpgradeStaff('physioLevel')}
                                    disabled={staff.physioLevel >= 10}
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors text-sm"
                                >
                                    {staff.physioLevel >= 10 ? 'MAX SEVİYE' : `Yükselt (€${(staff.physioLevel * 100).toLocaleString()}K)`}
                                </button>
                            </div>
                        </div>

                    </div>
                )
            }
        </div >
    );
};
