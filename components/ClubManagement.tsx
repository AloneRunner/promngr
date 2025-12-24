
import React, { useState } from 'react';
import { Team, Translation, Player, TeamStaff } from '../types';
import { Building2, TrendingUp, TrendingDown, Users, Wallet, Briefcase, GraduationCap, Star, Tv, ShoppingBag, Hammer, ArrowRight, DoorOpen, UserCog, Stethoscope, Microscope, ClipboardList } from 'lucide-react';
import { TICKET_PRICE } from '../constants';
import { PlayerAvatar } from './PlayerAvatar';

interface ClubManagementProps {
  team: Team;
  players: Player[];
  t: Translation;
  onPromoteYouth: (player: Player) => void;
  onResign: () => void;
  onUpgradeStaff?: (role: keyof TeamStaff) => void; // New prop
}

export const ClubManagement: React.FC<ClubManagementProps> = ({ team, players, t, onPromoteYouth, onResign, onUpgradeStaff }) => {
  const [tab, setTab] = useState<'FINANCE' | 'FACILITIES' | 'ACADEMY' | 'STAFF'>('FINANCE');

  const totalWages = players.reduce((sum, p) => sum + p.wage, 0);
  const estimatedTicketIncome = team.facilities.stadiumCapacity * TICKET_PRICE * 0.8; 
  
  // Safe access for old save files and new financial object
  const youthCandidates = team.youthCandidates || [];
  const fin = team.financials || {
      lastWeekIncome: { tickets: 0, sponsor: 0, merchandise: 0, tvRights: 0, transfers: 0 },
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
        {/* Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
            <button 
                onClick={() => setTab('FINANCE')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${tab === 'FINANCE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <Wallet size={18} /> {t.finances}
            </button>
            <button 
                onClick={() => setTab('FACILITIES')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${tab === 'FACILITIES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <Building2 size={18} /> {t.facilities}
            </button>
            <button 
                onClick={() => setTab('ACADEMY')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${tab === 'ACADEMY' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <GraduationCap size={18} /> {t.youthAcademy}
            </button>
            <button 
                onClick={() => setTab('STAFF')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${tab === 'STAFF' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                <UserCog size={18} /> Staff
            </button>
            
            <button 
                onClick={onResign}
                className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all bg-red-900/50 text-red-300 hover:bg-red-800 hover:text-white ml-auto"
            >
                <DoorOpen size={18} /> {t.resign}
            </button>
        </div>

        {tab === 'FINANCE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... existing finance content ... */}
                {/* Main Budget Card */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Wallet className="text-emerald-500" /> {t.finances}
                    </h2>
                    
                    <div className="mb-8 text-center p-6 bg-slate-900/50 rounded-xl border border-slate-600">
                        <div className="text-slate-400 text-sm mb-1">{t.clubBudget}</div>
                        <div className="text-3xl md:text-4xl font-bold text-emerald-400 tracking-tight">€{(team.budget / 1000000).toFixed(2)}M</div>
                    </div>

                    <div className="space-y-6">
                         <div>
                             <h3 className="text-xs uppercase text-slate-500 font-bold mb-3">{t.projectedWeekly}</h3>
                             <div className="space-y-2 bg-slate-900/30 p-4 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-1"><TrendingDown size={14} className="text-red-400"/> {t.weeklyWage}</span>
                                    <span className="text-red-400 font-mono">-€{totalWages.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-1"><TrendingUp size={14} className="text-green-400"/> {t.estMatchIncome}</span>
                                    <span className="text-green-400 font-mono">+€{estimatedTicketIncome.toLocaleString()}</span>
                                </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-6">
                    {/* Last Week Report */}
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
                        <h2 className="text-lg font-bold text-white mb-4">{t.lastWeekReport}</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-emerald-900/10 p-4 rounded-lg border border-emerald-900/20">
                                <h4 className="text-emerald-500 font-bold text-xs uppercase mb-3">{t.income}</h4>
                                <FinanceRow icon={Briefcase} label="Sponsor" value={team.sponsor?.weeklyIncome || 0} type="income" />
                                <FinanceRow icon={ShoppingBag} label={t.merchandise} value={Math.floor(fin.lastWeekIncome.merchandise)} type="income" />
                                <FinanceRow icon={Tv} label={t.tvRights} value={fin.lastWeekIncome.tvRights} type="income" />
                                {fin.lastWeekIncome.transfers > 0 && <FinanceRow icon={Users} label={t.playerSales} value={fin.lastWeekIncome.transfers} type="income" />}
                            </div>

                            <div className="bg-red-900/10 p-4 rounded-lg border border-red-900/20">
                                <h4 className="text-red-500 font-bold text-xs uppercase mb-3">{t.expenses}</h4>
                                <FinanceRow icon={Users} label={t.wages} value={fin.lastWeekExpenses.wages} type="expense" />
                                <FinanceRow icon={Hammer} label={t.maintenance} value={fin.lastWeekExpenses.maintenance} type="expense" />
                                <FinanceRow icon={GraduationCap} label={t.academy} value={fin.lastWeekExpenses.academy} type="expense" />
                                {fin.lastWeekExpenses.transfers > 0 && <FinanceRow icon={Users} label={t.transfers} value={fin.lastWeekExpenses.transfers} type="expense" />}
                            </div>
                        </div>
                    </div>

                    {team.sponsor && (
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
                            <h2 className="text-lg font-bold text-white mb-4">{t.activeSponsor}</h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold text-white">{team.sponsor.name}</div>
                                    <div className="text-slate-500">{team.sponsor.description}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-slate-400">{t.winBonus}</div>
                                    <div className="text-emerald-400 font-bold font-mono">€{(team.sponsor.winBonus.toLocaleString())}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {tab === 'FACILITIES' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... existing facilities ... */}
                {/* Stadium Card */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Building2 className="text-blue-500" /> {t.stadium}
                    </h2>
                    <div className="relative h-32 bg-slate-900 rounded-lg mb-4 overflow-hidden border border-slate-600">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                        <div className="absolute bottom-2 left-4">
                            <div className="text-white font-bold text-lg">{team.city} Arena</div>
                            <div className="text-emerald-400 text-sm">{team.facilities.stadiumCapacity.toLocaleString()} Seats</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">{t.condition}</span>
                            <div className="w-24 bg-slate-700 rounded-full h-2 mt-1.5">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">{t.level}</span>
                            <span className="text-white font-bold">{team.facilities.stadiumLevel}/10</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                             <div className="flex justify-between items-center">
                                 <span className="text-xs text-slate-500">{t.maintenance}</span>
                                 <span className="text-red-400 font-mono text-sm">-€{Math.floor(fin.lastWeekExpenses.maintenance).toLocaleString()}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Infrastructure */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="text-yellow-500" /> {t.infrastructure}
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-white">{t.training}</span>
                                <span className="text-sm text-yellow-500 font-bold">Lvl {team.facilities.trainingLevel}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-yellow-500 h-2.5 rounded-full" style={{width: `${team.facilities.trainingLevel * 10}%`}}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{t.impactDev}</p>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-white">{t.academy}</span>
                                <span className="text-sm text-purple-500 font-bold">Lvl {team.facilities.academyLevel}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-purple-500 h-2.5 rounded-full" style={{width: `${team.facilities.academyLevel * 10}%`}}></div>
                            </div>
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-slate-500">{t.impactAcademy}</p>
                                <span className="text-red-400 text-xs font-mono">-€{Math.floor(fin.lastWeekExpenses.academy).toLocaleString()}/wk</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {tab === 'ACADEMY' && (
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
                             <Users className="mx-auto text-slate-600 mb-2" size={32}/>
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
                                                     {potentialGrade} <Star size={14} fill="currentColor" className="opacity-50"/>
                                                 </div>
                                             </div>
                                             <button 
                                                onClick={() => onPromoteYouth(player)}
                                                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-all shadow-lg shadow-purple-900/20"
                                             >
                                                 {t.promotePlayer} (-€{(player.value / 1000).toFixed(0)}k)
                                             </button>
                                         </div>
                                     </div>
                                 )
                             })}
                         </div>
                     )}
                </div>
            </div>
        )}

        {/* NEW STAFF TAB */}
        {tab === 'STAFF' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Head Coach */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ClipboardList size={100} /></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 text-white shadow-lg">
                            <ClipboardList size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Assistant Coach</h3>
                        <p className="text-sm text-slate-400 mb-4">Improves training efficiency and tactical familiarity.</p>
                        
                        <div className="flex items-center justify-between mb-4 bg-slate-900/50 p-3 rounded">
                            <span className="text-slate-400 text-xs uppercase font-bold">Level</span>
                            <span className="text-blue-400 font-bold text-xl">{staff.headCoachLevel}</span>
                        </div>

                        <button 
                            onClick={() => onUpgradeStaff && onUpgradeStaff('headCoachLevel')}
                            disabled={staff.headCoachLevel >= 10}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors"
                        >
                            {staff.headCoachLevel >= 10 ? 'MAX LEVEL' : `Upgrade (€${(staff.headCoachLevel * 500).toLocaleString()}k)`}
                        </button>
                    </div>
                </div>

                {/* Head Scout */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Microscope size={100} /></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 text-white shadow-lg">
                            <Microscope size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Chief Scout</h3>
                        <p className="text-sm text-slate-400 mb-4">Finds better youth prospects and reveals hidden stats.</p>
                        
                        <div className="flex items-center justify-between mb-4 bg-slate-900/50 p-3 rounded">
                            <span className="text-slate-400 text-xs uppercase font-bold">Level</span>
                            <span className="text-purple-400 font-bold text-xl">{staff.scoutLevel}</span>
                        </div>

                        <button 
                            onClick={() => onUpgradeStaff && onUpgradeStaff('scoutLevel')}
                            disabled={staff.scoutLevel >= 10}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors"
                        >
                            {staff.scoutLevel >= 10 ? 'MAX LEVEL' : `Upgrade (€${(staff.scoutLevel * 500).toLocaleString()}k)`}
                        </button>
                    </div>
                </div>

                {/* Head Physio */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Stethoscope size={100} /></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 text-white shadow-lg">
                            <Stethoscope size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Head Physio</h3>
                        <p className="text-sm text-slate-400 mb-4">Speeds up injury recovery and reduces fatigue accumulation.</p>
                        
                        <div className="flex items-center justify-between mb-4 bg-slate-900/50 p-3 rounded">
                            <span className="text-slate-400 text-xs uppercase font-bold">Level</span>
                            <span className="text-red-400 font-bold text-xl">{staff.physioLevel}</span>
                        </div>

                        <button 
                            onClick={() => onUpgradeStaff && onUpgradeStaff('physioLevel')}
                            disabled={staff.physioLevel >= 10}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded transition-colors"
                        >
                            {staff.physioLevel >= 10 ? 'MAX LEVEL' : `Upgrade (€${(staff.physioLevel * 500).toLocaleString()}k)`}
                        </button>
                    </div>
                </div>

            </div>
        )}
    </div>
  );
};
