import React, { useState } from 'react';
import { GameProfile } from '../types';
import { X } from 'lucide-react';

interface CreateProfileModalProps {
    onClose: () => void;
    onCreate: (name: string) => void;
    lang: 'tr' | 'en';
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({ onClose, onCreate, lang }) => {
    const [profileName, setProfileName] = useState('');

    const t = {
        tr: {
            createProfile: 'Yeni Profil Oluştur',
            profileName: 'Profil Adı',
            namePlaceholder: 'Örn: Barcelona Kariyerim',
            create: 'Oluştur',
            cancel: 'İptal',
            nameRequired: 'Lütfen bir profil adı girin'
        },
        en: {
            createProfile: 'Create New Profile',
            profileName: 'Profile Name',
            namePlaceholder: 'e.g. My Barcelona Career',
            create: 'Create',
            cancel: 'Cancel',
            nameRequired: 'Please enter a profile name'
        }
    }[lang];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = profileName.trim();
        if (!trimmed) {
            alert(t.nameRequired);
            return;
        }
        onCreate(trimmed);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-2xl font-bold text-white">{t.createProfile}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t.profileName}
                        </label>
                        <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder={t.namePlaceholder}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            autoFocus
                            maxLength={50}
                        />
                        <div className="mt-1 text-xs text-slate-500 text-right">
                            {profileName.length}/50
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                        >
                            {t.create}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
