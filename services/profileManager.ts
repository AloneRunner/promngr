import { GameProfile, ProfileManagerState, GameState } from '../types';

const PROFILES_KEY = 'pro_manager_profiles_v1';
const PROFILE_DATA_PREFIX = 'pro_manager_profile_data_';
const OLD_SAVE_KEY = 'pro_manager_save_v11_features';

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

/**
 * Load all profiles metadata
 */
export function loadAllProfiles(): GameProfile[] {
    try {
        const data = localStorage.getItem(PROFILES_KEY);
        if (data) {
            const parsed: ProfileManagerState = JSON.parse(data);
            return parsed.profiles || [];
        }
    } catch (e) {
        console.error('Failed to load profiles:', e);
    }
    return [];
}

/**
 * Save profiles metadata
 */
function saveProfilesList(profiles: GameProfile[]): void {
    try {
        const state: ProfileManagerState = {
            profiles,
            activeProfileId: getActiveProfileId()
        };
        localStorage.setItem(PROFILES_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save profiles list:', e);
        alert('Profiller kaydedilemedi. LocalStorage kotası dolmuş olabilir.');
    }
}

/**
 * Create a new profile
 */
export function createProfile(name: string): GameProfile {
    const profile: GameProfile = {
        id: uuid(),
        name: name.trim() || 'Yeni Kariyer',
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        gameState: null
    };

    const profiles = loadAllProfiles();
    profiles.push(profile);
    saveProfilesList(profiles);

    return profile;
}

/**
 * Load a specific profile's game data
 */
export function loadProfileData(profileId: string): GameState | null {
    try {
        const key = PROFILE_DATA_PREFIX + profileId;
        const data = localStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error(`Failed to load profile data for ${profileId}:`, e);
    }
    return null;
}

/**
 * Save a profile's game data
 */
export function saveProfileData(profileId: string, gameState: GameState): void {
    try {
        const key = PROFILE_DATA_PREFIX + profileId;
        localStorage.setItem(key, JSON.stringify(gameState));

        // Update thumbnail data
        const profiles = loadAllProfiles();
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
                profiles[profileIndex].gameState = gameState;
            }

            saveProfilesList(profiles);
        }
    } catch (e) {
        console.error(`Failed to save profile data for ${profileId}:`, e);
        alert('Oyun kaydedilemedi. LocalStorage kotası dolmuş olabilir.');
    }
}

/**
 * Delete a profile and its data
 */
export function deleteProfile(profileId: string): void {
    try {
        // Remove game data
        const dataKey = PROFILE_DATA_PREFIX + profileId;
        localStorage.removeItem(dataKey);

        // Remove from profiles list
        const profiles = loadAllProfiles();
        const filtered = profiles.filter(p => p.id !== profileId);
        saveProfilesList(filtered);

        // Clear active if it was the active profile
        if (getActiveProfileId() === profileId) {
            setActiveProfile(null);
        }
    } catch (e) {
        console.error(`Failed to delete profile ${profileId}:`, e);
    }
}

/**
 * Reset a profile (keep profile but clear game data)
 */
export function resetProfile(profileId: string): void {
    try {
        // Remove game data
        const dataKey = PROFILE_DATA_PREFIX + profileId;
        localStorage.removeItem(dataKey);

        // Update profile metadata
        const profiles = loadAllProfiles();
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex !== -1) {
            profiles[profileIndex].gameState = null;
            profiles[profileIndex].thumbnailData = undefined;
            profiles[profileIndex].lastPlayedAt = Date.now();
            saveProfilesList(profiles);
        }
    } catch (e) {
        console.error(`Failed to reset profile ${profileId}:`, e);
    }
}

/**
 * Update profile metadata (name, etc)
 */
export function updateProfileMetadata(profileId: string, updates: Partial<Pick<GameProfile, 'name'>>): void {
    try {
        const profiles = loadAllProfiles();
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex !== -1) {
            if (updates.name) {
                profiles[profileIndex].name = updates.name.trim();
            }
            saveProfilesList(profiles);
        }
    } catch (e) {
        console.error(`Failed to update profile ${profileId}:`, e);
    }
}

/**
 * Set the active profile ID
 */
export function setActiveProfile(profileId: string | null): void {
    try {
        const data = localStorage.getItem(PROFILES_KEY);
        let state: ProfileManagerState = { profiles: [], activeProfileId: null };

        if (data) {
            state = JSON.parse(data);
        }

        state.activeProfileId = profileId;
        localStorage.setItem(PROFILES_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to set active profile:', e);
    }
}

/**
 * Get the active profile ID
 */
export function getActiveProfileId(): string | null {
    try {
        const data = localStorage.getItem(PROFILES_KEY);
        if (data) {
            const state: ProfileManagerState = JSON.parse(data);
            return state.activeProfileId || null;
        }
    } catch (e) {
        console.error('Failed to get active profile:', e);
    }
    return null;
}

/**
 * Migrate old save format to new profile system
 */
export function migrateOldSave(): string | null {
    try {
        const oldSave = localStorage.getItem(OLD_SAVE_KEY);
        if (oldSave) {
            console.log('Migrating old save to profile system...');
            const gameState: GameState = JSON.parse(oldSave);

            // Create a profile for the old save
            const profile = createProfile('Kariyerim');
            saveProfileData(profile.id, gameState);
            setActiveProfile(profile.id);

            // Remove old save
            localStorage.removeItem(OLD_SAVE_KEY);

            console.log('Migration complete!');
            return profile.id;
        }
    } catch (e) {
        console.error('Failed to migrate old save:', e);
    }
    return null;
}
