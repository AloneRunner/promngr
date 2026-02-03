import { Preferences } from '@capacitor/preferences';
import { GameProfile, GameState } from '../types';
import { uuid } from '../utils/playerUtils';

const PROFILES_KEY = 'pro_manager_profiles_v1';
const PROFILE_DATA_PREFIX = 'pro_manager_save_';
const ACTIVE_PROFILE_KEY = 'pro_manager_active_profile';

export const loadAllProfiles = async (): Promise<GameProfile[]> => {
    const { value } = await Preferences.get({ key: PROFILES_KEY });
    return value ? JSON.parse(value) : [];
};

export const createProfile = async (name: string): Promise<GameProfile> => {
    const profiles = await loadAllProfiles();
    const newProfile: GameProfile = {
        id: uuid(),
        name,
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        gameState: null
    };
    profiles.push(newProfile);
    await Preferences.set({ key: PROFILES_KEY, value: JSON.stringify(profiles) });
    return newProfile;
};

export const loadProfileData = async (profileId: string): Promise<GameState | null> => {
    const { value } = await Preferences.get({ key: PROFILE_DATA_PREFIX + profileId });
    return value ? JSON.parse(value) : null;
};

export const saveProfileData = async (profileId: string, data: GameState): Promise<void> => {
    await Preferences.set({ key: PROFILE_DATA_PREFIX + profileId, value: JSON.stringify(data) });

    // Metadata güncelle
    const profiles = await loadAllProfiles();
    const index = profiles.findIndex(p => p.id === profileId);
    if (index !== -1) {
        profiles[index].lastPlayedAt = Date.now();
        // Takım bilgisi vb. eklenebilir
        await Preferences.set({ key: PROFILES_KEY, value: JSON.stringify(profiles) });
    }
};

export const setActiveProfile = async (profileId: string | null) => {
    if (profileId) await Preferences.set({ key: ACTIVE_PROFILE_KEY, value: profileId });
    else await Preferences.remove({ key: ACTIVE_PROFILE_KEY });
};

export const getActiveProfileId = async (): Promise<string | null> => {
    const { value } = await Preferences.get({ key: ACTIVE_PROFILE_KEY });
    return value;
};

export const deleteProfile = async (profileId: string) => {
    let profiles = await loadAllProfiles();
    profiles = profiles.filter(p => p.id !== profileId);
    await Preferences.set({ key: PROFILES_KEY, value: JSON.stringify(profiles) });
    await Preferences.remove({ key: PROFILE_DATA_PREFIX + profileId });
};

export const resetProfile = async (profileId: string) => {
    await Preferences.remove({ key: PROFILE_DATA_PREFIX + profileId });
};

export const updateProfileMetadata = async (profileId: string, updates: any) => {
    const profiles = await loadAllProfiles();
    const index = profiles.findIndex(p => p.id === profileId);
    if (index !== -1) {
        profiles[index] = { ...profiles[index], ...updates };
        await Preferences.set({ key: PROFILES_KEY, value: JSON.stringify(profiles) });
    }
};

export const migrateOldSave = async () => {
    // Gerekirse eski localStorage verilerini buraya taşıma kodu ekle
    return null;
};
