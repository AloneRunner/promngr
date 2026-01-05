
import React from 'react';
import { Team, Translation, TrainingFocus, TrainingIntensity } from '../types';
import { Target, Shield, Zap, Activity, Brain, BarChart2 } from 'lucide-react';

interface TrainingCenterProps {
    team: Team;
    onSetFocus: (focus: TrainingFocus) => void;
    onSetIntensity: (intensity: TrainingIntensity) => void;
    t: Translation;
}

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ team, onSetFocus, onSetIntensity, t }) => {

    const options: { id: TrainingFocus, icon: any, label: string, desc: string, color: string }[] = [
        { id: 'BALANCED', icon: Activity, label: t.training === 'Training' ? 'Balanced' : 'Dengeli', desc: t.training === 'Training' ? 'Maintain overall fitness and sharpness.' : 'Genel kondisyon ve formu korur.', color: 'text-white' },
        { id: 'ATTACK', icon: Target, label: t.training === 'Training' ? 'Attacking' : 'Hücum', desc: t.training === 'Training' ? 'Boosts Finishing, Passing. Lowers Defense.' : 'Bitiricilik ve Pası geliştirir.', color: 'text-red-400' },
        { id: 'DEFENSE', icon: Shield, label: t.training === 'Training' ? 'Defending' : 'Savunma', desc: t.training === 'Training' ? 'Boosts Tackling, Positioning. Lowers Attack.' : 'Top Kapma ve Pozisyon Almayı geliştirir.', color: 'text-blue-400' },
        { id: 'PHYSICAL', icon: Zap, label: t.training === 'Training' ? 'Physical' : 'Fiziksel', desc: t.training === 'Training' ? 'Boosts Speed, Strength. High Fatigue risk.' : 'Hız ve Güç artar. Yorgunluk riski.', color: 'text-yellow-400' },
        { id: 'TECHNICAL', icon: Brain, label: t.training === 'Training' ? 'Technical' : 'Teknik', desc: t.training === 'Training' ? 'Boosts Dribbling, Vision, Control.' : 'Top Sürme ve Vizyonu geliştirir.', color: 'text-purple-400' },
    ];

    const intensities: { id: TrainingIntensity, label: string, recovery: string, growth: string, color: string }[] = [
        { id: 'LIGHT', label: t.intensityLight, recovery: 'High (+40%)', growth: 'Low (5%)', color: 'bg-green-600' },
        { id: 'NORMAL', label: t.intensityNormal, recovery: 'Normal (+25%)', growth: 'Normal (20%)', color: 'bg-blue-600' },
        { id: 'HEAVY', label: t.intensityHeavy, recovery: 'Low (+10%)', growth: 'High (40%)', color: 'bg-red-600' },
    ];

    const currentIntensity = team.trainingIntensity || 'NORMAL';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">

            {/* LEFT COLUMN: FOCUS */}
            <div className="bg-slate-800 p-3 md:p-6 rounded-lg border border-slate-700 shadow-xl">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 flex items-center gap-2">
                    <Activity className="text-emerald-500" size={20} /> {t.trainingCenter}
                </h2>

                <div className="space-y-2">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => onSetFocus(opt.id)}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-lg border transition-all text-left ${team.trainingFocus === opt.id
                                    ? 'bg-emerald-900/40 border-emerald-500'
                                    : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700'
                                }`}
                        >
                            <div className={`p-2 rounded-full bg-slate-800 ${opt.color} shrink-0`}>
                                <opt.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm ${team.trainingFocus === opt.id ? 'text-white' : 'text-slate-300'}`}>{opt.label}</h3>
                                <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                            </div>
                            {team.trainingFocus === opt.id && (
                                <div className="text-emerald-500 text-[10px] font-bold uppercase shrink-0">ACTIVE</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: INTENSITY & STATS */}
            <div className="space-y-6">

                {/* Intensity Selector */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="text-orange-500" /> {t.trainingIntensity}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                        {t.training === 'Training' ? 'Balance recovery and growth. Heavier training improves players faster but reduces fitness recovery.' : 'Dinlenme ve gelişimi dengeleyin. Ağır antrenman oyuncuları hızla geliştirir ancak dinlenmeyi azaltır.'}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                        {intensities.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSetIntensity(item.id)}
                                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${currentIntensity === item.id
                                        ? 'bg-slate-700 border-white text-white shadow-lg scale-105'
                                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <div className={`w-full h-1 rounded-full ${item.color} mb-1`}></div>
                                <span className="font-bold text-sm">{item.label}</span>
                                <div className="flex flex-col text-[10px] text-center mt-1 w-full">
                                    <div className="flex justify-between w-full px-1">
                                        <span>{t.rec}:</span>
                                        <span className={item.id === 'LIGHT' ? 'text-green-400' : item.id === 'HEAVY' ? 'text-red-400' : 'text-blue-400'}>{item.recovery.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex justify-between w-full px-1">
                                        <span>{t.grw}:</span>
                                        <span className={item.id === 'HEAVY' ? 'text-green-400' : item.id === 'LIGHT' ? 'text-red-400' : 'text-blue-400'}>{item.growth.split(' ')[0]}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">{t.efficiency}</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-emerald-400">{team.facilities.trainingLevel * 10}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${team.facilities.trainingLevel * 10}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-400">
                        {t.training === 'Training' ? 'Upgrade your Training Facilities in the Club menu to improve weekly player growth rates.' : 'Haftalık oyuncu gelişimini artırmak için Kulüp menüsünden Antrenman Tesislerini yükseltin.'}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-lg border border-indigo-500/30 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-2">{t.coachNote}</h3>
                    <p className="text-sm text-indigo-200 italic">
                        "{t.training === 'Training' ?
                            `Setting the focus to ${team.trainingFocus} will help shape the team's identity. Use Light intensity after tough matches to recover condition.` :
                            `Odağı ${team.trainingFocus} olarak ayarlamak takımın kimliğini şekillendirecektir. Zorlu maçlardan sonra kondisyonu toparlamak için Hafif yoğunluğu kullanın.`}"
                    </p>
                </div>
            </div>

        </div>
    );
};
