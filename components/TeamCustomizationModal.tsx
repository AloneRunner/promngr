import React, { useState } from 'react';
import { X, Search, Check, Palette, Type, Shield } from 'lucide-react';
import { Team } from '../types';
import { getAllTeamLogos, getTeamLogo } from '../logoMapping';
import { TeamLogo } from './TeamLogo';

interface TeamCustomizationModalProps {
    team: Team;
    onClose: () => void;
    onSave: (newName: string, newPrimaryColor: string, newSecondaryColor: string, newLogoKey?: string) => void;
    translations: any;
}

export const TeamCustomizationModal: React.FC<TeamCustomizationModalProps> = ({
    team,
    onClose,
    onSave,
    translations: t
}) => {
    const [name, setName] = useState(team.name);
    const [primaryColor, setPrimaryColor] = useState(team.primaryColor || '#1e293b');
    const [secondaryColor, setSecondaryColor] = useState(team.secondaryColor || '#ffffff');
    const [selectedLogoKey, setSelectedLogoKey] = useState<string | undefined>((team as any).logoKey);
    const [searchTerm, setSearchTerm] = useState('');

    const availableLogos = getAllTeamLogos();
    const filteredLogos = availableLogos.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim(), primaryColor, secondaryColor, selectedLogoKey);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.customizeTeam || 'Takımı Özelleştir'}</h2>
                            <p className="text-xs text-slate-400">{team.name} • Düzenle</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Preview Section */}
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-800/30 rounded-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <TeamLogo 
                                team={{ ...team, name, primaryColor, secondaryColor, logoKey: selectedLogoKey } as any} 
                                className="w-24 h-24 mb-4 shadow-2xl scale-110"
                            />
                            <h3 className="text-2xl font-bold text-white tracking-tight">{name || 'Takım İsmi'}</h3>
                            <div className="flex gap-2 mt-2">
                                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: primaryColor }}></div>
                                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: secondaryColor }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Name & Colors Column */}
                        <div className="space-y-6">
                            <section>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    <Type size={14} className="text-emerald-500" />
                                    {t.teamName || 'Takım İsmi'}
                                </label>
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                                    placeholder="Takım İsmi..."
                                />
                            </section>

                            <section>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    <Palette size={14} className="text-emerald-500" />
                                    {t.colors || 'Renkler'}
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{t.primary || 'Ana Renk'}</div>
                                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-white/5">
                                            <input 
                                                type="color" 
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                                            />
                                            <span className="text-xs font-mono text-slate-300 uppercase">{primaryColor}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{t.secondary || 'İkincill'}</div>
                                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-white/5">
                                            <input 
                                                type="color" 
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                                            />
                                            <span className="text-xs font-mono text-slate-300 uppercase">{secondaryColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Logo Picker Column */}
                        <div className="flex flex-col h-full">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                <Shield size={14} className="text-emerald-500" />
                                {t.selectLogo || 'Logo Seç'}
                            </label>
                            
                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Logo ara..."
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                />
                            </div>

                            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-white/5 p-3 overflow-y-auto max-h-[250px] custom-scrollbar">
                                <div className="grid grid-cols-4 gap-2">
                                    {/* Default / No Logo option */}
                                    <button 
                                        onClick={() => setSelectedLogoKey(undefined)}
                                        className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all p-1 ${!selectedLogoKey ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent bg-slate-700/50 hover:bg-slate-700'}`}
                                    >
                                        <div className="text-[10px] font-bold text-slate-400">ABC</div>
                                        <div className="text-[8px] text-slate-500 mt-1 uppercase leading-tight">İsimli Logo</div>
                                        {!selectedLogoKey && (
                                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 shadow-lg">
                                                <Check size={10} className="text-white" />
                                            </div>
                                        )}
                                    </button>

                                    {filteredLogos.map((logo) => (
                                        <button 
                                            key={logo.name}
                                            onClick={() => setSelectedLogoKey(logo.name)}
                                            className={`relative aspect-square rounded-xl border-2 flex items-center justify-center transition-all overflow-hidden p-1 ${selectedLogoKey === logo.name ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent bg-slate-700/50 hover:bg-slate-700'}`}
                                            title={logo.name}
                                        >
                                            <img src={logo.path} alt={logo.name} className="w-full h-full object-contain" />
                                            {selectedLogoKey === logo.name && (
                                                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 shadow-lg">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-slate-800/30 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-white/5"
                    >
                        {t.cancel || 'İptal'}
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-[2] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        {t.saveChanges || 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};
