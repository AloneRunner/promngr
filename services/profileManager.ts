import { GameProfile, ProfileManagerState, GameState } from '../types';
import { getItem, setItem, removeItem } from './db';

const PROFILES_KEY = 'pro_manager_profiles_v1';
const PROFILE_DATA_PREFIX = 'pro_manager_profile_data_';

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

/**
 * Load all profiles metadata
 */
export async function loadAllProfiles(): Promise<GameProfile[]> {
    try {
        const data = await getItem<ProfileManagerState>(PROFILES_KEY);
        if (data) {
            return data.profiles || [];
        }
    } catch (e) {
        console.error('Failed to load profiles:', e);
    }
    return [];
}

/**
 * Save profiles metadata
 */
async function saveProfilesList(profiles: GameProfile[]): Promise<void> {
    try {
        const activeId = await getActiveProfileId(); // Get current active id
        const state: ProfileManagerState = {
            profiles,
            activeProfileId: activeId
        };
        await setItem(PROFILES_KEY, state);
    } catch (e) {
        console.error('Failed to save profiles list:', e);
    }
}

/**
 * Create a new profile
 */
export async function createProfile(name: string): Promise<GameProfile> {
    const profile: GameProfile = {
        id: uuid(),
        name: name.trim() || 'Yeni Kariyer',
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        gameState: null
    };

    const profiles = await loadAllProfiles();
    profiles.push(profile);
    await saveProfilesList(profiles);

    return profile;
}

/**
 * Load a specific profile's game data
 */
export async function loadProfileData(profileId: string): Promise<GameState | null> {
    try {
        const key = PROFILE_DATA_PREFIX + profileId;
        const data = await getItem<GameState>(key);
        if (data) {
            return data;
        }
    } catch (e) {
        console.error(`Failed to load profile data for ${profileId}:`, e);
    }
    return null;
}

/**
 * Save a profile's game data
 */
export async function saveProfileData(profileId: string, gameState: GameState): Promise<void> {
    try {
        const key = PROFILE_DATA_PREFIX + profileId;
        await setItem(key, gameState);

        // Update thumbnail data
        const profiles = await loadAllProfiles();
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex !== -1) {
            const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);

            if (userTeam) {
                // Calculate league position
                const sortedTeams = [...gameState.teams].sort((a, b) => {
                    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                    const bGD = b.stats.gf - b.stats.ga;
                    const aGD = a.stats.gf - a.stats.ga;
                    if (bGD !== aGD) return bGD - aGD;
                    return b.stats.gf - a.stats.gf;
                });
                const position = sortedTeams.findIndex(t => t.id === userTeam.id) + 1;

                profiles[profileIndex].thumbnailData = {
                    teamName: userTeam.name,
                    leagueName: gameState.leagueId,
                    currentWeek: gameState.currentWeek,
                    currentSeason: gameState.currentSeason,
                    teamColor: userTeam.primaryColor,
                    budget: userTeam.budget,
                    leaguePosition: position
                };
                profiles[profileIndex].lastPlayedAt = Date.now();
                // Avoid saving full gamestate in metadata
                // profiles[profileIndex].gameState = gameState; 
            }

            await saveProfilesList(profiles);
        }
    } catch (e) {
        console.error(`Failed to save profile data for ${profileId}:`, e);
        // Alert excluded to prevent spam, UI should handle errors
    }
}

/**
 * Delete a profile and its data
 */
export async function deleteProfile(profileId: string): Promise<void> {
    try {
        // Remove game data
        const dataKey = PROFILE_DATA_PREFIX + profileId;
        await removeItem(dataKey);

        // Remove from profiles list
        const profiles = await loadAllProfiles();
        const filtered = profiles.filter(p => p.id !== profileId);
        await saveProfilesList(filtered);

        // Clear active if it was the active profile
        const activeId = await getActiveProfileId();
        if (activeId === profileId) {
            await setActiveProfile(null);
        }
    } catch (e) {
        console.error(`Failed to delete profile ${profileId}:`, e);
    }
}

/**
 * Reset a profile (keep profile but clear game data)
 */
export async function resetProfile(profileId: string): Promise<void> {
    try {
        // Remove game data
        const dataKey = PROFILE_DATA_PREFIX + profileId;
        await removeItem(dataKey);

        // Update profile metadata
        const profiles = await loadAllProfiles();
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex !== -1) {
            profiles[profileIndex].gameState = null;
            profiles[profileIndex].thumbnailData = undefined;
            profiles[profileIndex].lastPlayedAt = Date.now();
            await saveProfilesList(profiles);
        }
    } catch (e) {
        console.error(`Failed to reset profile ${profileId}:`, e);
    }
}

/**
 * Update profile metadata (name, etc)
 */
export async function updateProfileMetadata(profileId: string, updates: Partial<Pick<GameProfile, 'name'>>): Promise<void> {
    try {
        const profiles = await loadAllProfiles();
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex !== -1) {
            if (updates.name) {
                profiles[profileIndex].name = updates.name.trim();
            }
            await saveProfilesList(profiles);
        }
    } catch (e) {
        console.error(`Failed to update profile ${profileId}:`, e);
    }
}

/**
 * Set the active profile ID
 */
export async function setActiveProfile(profileId: string | null): Promise<void> {
    try {
        const data = await getItem<ProfileManagerState>(PROFILES_KEY);
        let state: ProfileManagerState = { profiles: [], activeProfileId: null };

        if (data) {
            state = data;
        }

        state.activeProfileId = profileId;
        await setItem(PROFILES_KEY, state);
    } catch (e) {
        console.error('Failed to set active profile:', e);
    }
}

/**
 * Get the active profile ID
 */
export async function getActiveProfileId(): Promise<string | null> {
    try {
        const data = await getItem<ProfileManagerState>(PROFILES_KEY);
        if (data) {
            return data.activeProfileId || null;
        }
    } catch (e) {
        console.error('Failed to get active profile:', e);
    }
    return null;
}

/**
 * Migrate old save format to new profile system
 * (Kept for compatibility, checks localStorage for legacy key, migrates to DB)
 */
export async function migrateOldSave(): Promise<string | null> {
    try {
        const OLD_SAVE_KEY = 'pro_manager_save_v11_features';
        const oldSave = localStorage.getItem(OLD_SAVE_KEY);

        if (oldSave) {
            console.log('Migrating old save to profile system...');
            let gameState: GameState;
            try {
                gameState = JSON.parse(oldSave);
            } catch {
                return null;
            }

            // Create a profile for the old save
            const profile = await createProfile('Kariyerim (Migrated)');
            await saveProfileData(profile.id, gameState);
            await setActiveProfile(profile.id);

            // Remove old save from localStorage
            localStorage.removeItem(OLD_SAVE_KEY);

            console.log('Migration complete!');
            return profile.id;
        }
    } catch (e) {
        console.error('Failed to migrate old save:', e);
    }
    return null;
}
