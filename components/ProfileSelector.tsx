import React, { useState } from 'react';
import { GameProfile } from '../types';
import { Plus, Trophy, Calendar, DollarSign, Medal, Trash2, RotateCcw, Edit2, AlertCircle } from 'lucide-react';
import { LEAGUE_PRESETS } from '../constants';

interface ProfileSelectorProps {
    profiles: GameProfile[];
    onSelectProfile: (profileId: string) => void;
    onCreateProfile: (name: string) => void;
    onDeleteProfile: (profileId: string) => void;
    onResetProfile: (profileId: string) => void;
    onRenameProfile: (profileId: string, newName: string) => void;
    lang: 'tr' | 'en';
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
    profiles,
    onSelectProfile,
    onCreateProfile,
    onDeleteProfile,
    onResetProfile,
    onRenameProfile,
    lang
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const t = {
        tr: {
            title: 'Profil Seçin',
            subtitle: 'Devam etmek için bir profil seçin veya yeni profil oluşturun',
            newProfile: 'Yeni Profil',
            play: 'Oyna',
            delete: 'Sil',
            reset: 'Sıfırla',
            rename: 'Yeniden Adlandır',
            week: 'Hafta',
            season: 'Sezon',
            position: 'Sıra',
            noProfiles: 'Henüz profil yok',
            createFirst: 'Başlamak için ilk profilinizi oluşturun',
            deleteConfirm: 'Bu profil kalıcı olarak silinecek. Emin misiniz?',
            resetConfirm: 'Bu profil baştan başlatılacak. Tüm ilerleme kaybolacak. Emin misiniz?',
            notStarted: 'Oyun başlatılmamış',
            startNew: 'Yeni Oyun Başlat',
            createProfile: 'Profil Oluştur',
            profileName: 'Profil Adı',
            cancel: 'İptal',
            save: 'Kaydet',
            namePlaceholder: 'Örn: Barcelona Kariyerim'
        },
        en: {
            title: 'Select Profile',
            subtitle: 'Choose a profile to continue or create a new one',
            newProfile: 'New Profile',
            play: 'Play',
            delete: 'Delete',
            reset: 'Reset',
            rename: 'Rename',
            week: 'Week',
            season: 'Season',
            position: 'Position',
            noProfiles: 'No profiles yet',
            createFirst: 'Create your first profile to get started',
            deleteConfirm: 'This profile will be permanently deleted. Are you sure?',
            resetConfirm: 'This profile will be reset. All progress will be lost. Are you sure?',
            notStarted: 'Game not started',
            startNew: 'Start New Game',
            createProfile: 'Create Profile',
            profileName: 'Profile Name',
            cancel: 'Cancel',
            save: 'Save',
            namePlaceholder: 'e.g. My Barcelona Career'
        }
    }[lang];

    const handleCreate = () => {
        const trimmed = newProfileName.trim();
        if (!trimmed) return;
        onCreateProfile(trimmed);
        setNewProfileName('');
        setShowCreateModal(false);
    };

    const handleDelete = (profileId: string) => {
        if (confirm(t.deleteConfirm)) {
            onDeleteProfile(profileId);
        }
    };

    const handleReset = (profileId: string) => {
        if (confirm(t.resetConfirm)) {
            onResetProfile(profileId);
        }
    };

    const handleRename = (profileId: string) => {
        const trimmed = editingName.trim();
        if (!trimmed) return;
        onRenameProfile(profileId, trimmed);
        setEditingProfileId(null);
        setEditingName('');
    };

    const getLeagueName = (leagueId: string): string => {
        const league = LEAGUE_PRESETS.find(l => l.id === leagueId);
        return league ? league.name : leagueId;
    };

    const getPositionIcon = (position: number) => {
        if (position === 1) return '🥇';
        if (position === 2) return '🥈';
        if (position === 3) return '🥉';
        return `${position}.`;
    };

    const formatDate = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return lang === 'tr' ? 'Şimdi' : 'Now';
        if (minutes < 60) return lang === 'tr' ? `${minutes}dk önce` : `${minutes}m ago`;
        if (hours < 24) return lang === 'tr' ? `${hours}sa önce` : `${hours}h ago`;
        if (days < 7) return lang === 'tr' ? `${days}g önce` : `${days}d ago`;
        return new Date(timestamp).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US');
    };

    const sortedProfiles = [...profiles].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 md:p-8">
            {/* Header */}
            <div className="text-center mb-6 md:mb-8 animate-fade-in">
                <div className="text-emerald-500 font-bold text-3xl md:text-5xl tracking-tighter mb-2 md:mb-4">
                    POCKET<span className="text-white">FM</span>
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{t.title}</h1>
                <p className="text-slate-400 text-sm md:text-lg">{t.subtitle}</p>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full mb-8">
                {sortedProfiles.map((profile) => (
                    <div
                        key={profile.id}
                        className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden hover:border-emerald-500 transition-all duration-300 hover:scale-105 shadow-xl group"
                    >
                        {/* Profile Header */}
                        <div
                            className="h-24 relative flex items-center justify-center"
                            style={{
                                background: profile.thumbnailData?.teamColor
                                    ? `linear-gradient(135deg, ${profile.thumbnailData.teamColor}dd, ${profile.thumbnailData.teamColor}44)`
                                    : 'linear-gradient(135deg, #1e293b, #0f172a)'
                            }}
                        >
                            <Trophy className="text-white/30" size={48} />
                        </div>

                        {/* Profile Content */}
                        <div className="p-6 space-y-4">
                            {/* Name */}
                            {editingProfileId === profile.id ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleRename(profile.id)}
                                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleRename(profile.id)}
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                    >
                                        {t.save}
                                    </button>
                                    <button
                                        onClick={() => setEditingProfileId(null)}
                                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                        {t.cancel}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white truncate">{profile.name}</h3>
                                    <button
                                        onClick={() => {
                                            setEditingProfileId(profile.id);
                                            setEditingName(profile.name);
                                        }}
                                        className="text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Profile Info */}
                            {profile.thumbnailData ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Trophy size={16} className="text-emerald-500" />
                                        <span className="font-semibold">{profile.thumbnailData.teamName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Medal size={16} />
                                        <span>{getLeagueName(profile.thumbnailData.leagueName)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} />
                                            <span>{t.season} {profile.thumbnailData.currentSeason}, {t.week} {profile.thumbnailData.currentWeek}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <DollarSign size={16} />
                                            <span>€{(profile.thumbnailData.budget / 1000000).toFixed(1)}M</span>
                                        </div>
                                        <div className="text-emerald-400 font-bold">
                                            {getPositionIcon(profile.thumbnailData.leaguePosition)} {t.position}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                                        {formatDate(profile.lastPlayedAt)}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
                                    <AlertCircle size={20} />
                                    <span>{t.notStarted}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-slate-800">
                                <button
                                    onClick={() => onSelectProfile(profile.id)}
                                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    {profile.thumbnailData ? t.play : t.startNew}
                                </button>
                                <button
                                    onClick={() => handleReset(profile.id)}
                                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    title={t.reset}
                                >
                                    <RotateCcw size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(profile.id)}
                                    className="px-4 py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
                                    title={t.delete}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-slate-900/30 backdrop-blur border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 md:p-12 transition-all duration-300 hover:scale-105 shadow-xl flex flex-col items-center justify-center gap-4 min-h-[250px] md:min-h-[400px] group"
                >
                    <div className="w-20 h-20 rounded-full bg-slate-800 group-hover:bg-emerald-600 flex items-center justify-center transition-all duration-300">
                        <Plus size={40} className="text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2">{t.newProfile}</h3>
                        <p className="text-slate-400">{profiles.length === 0 ? t.createFirst : ''}</p>
                    </div>
                </button>
            </div>

            {/* Create Profile Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white">{t.createProfile}</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewProfileName('');
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {t.profileName}
                                </label>
                                <input
                                    type="text"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                                    placeholder={t.namePlaceholder}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    autoFocus
                                    maxLength={50}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewProfileName('');
                                    }}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newProfileName.trim()}
                                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                                >
                                    {t.createProfile}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
