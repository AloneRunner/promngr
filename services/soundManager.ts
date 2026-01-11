// Sound Manager for Match Audio Effects
// Provides ambient match sounds and event-based audio feedback

type SoundType =
    | 'whistle_start'
    | 'whistle_end'
    | 'goal'
    | 'cheer'
    | 'yellow_card'
    | 'red_card'
    | 'substitution'
    | 'penalty'
    | 'corner'
    | 'ambience';

interface SoundManager {
    play: (sound: SoundType) => void;
    startAmbience: () => void;
    stopAll: () => void;
    pause: () => void;
    resume: () => void;
}

// Stub implementation - sounds can be added later
// This prevents crashes while allowing the app to run
const createSoundManager = (): SoundManager => {
    let isPlaying = false;
    let ambienceInterval: number | null = null;

    return {
        play: (sound: SoundType) => {
            // Stub: Can be implemented with Howler.js or Web Audio API
            // console.log(`[Sound] Playing: ${sound}`);
        },

        startAmbience: () => {
            if (isPlaying) return;
            isPlaying = true;
            // console.log('[Sound] Ambience started');
        },

        stopAll: () => {
            isPlaying = false;
            if (ambienceInterval) {
                clearInterval(ambienceInterval);
                ambienceInterval = null;
            }
            // console.log('[Sound] All sounds stopped');
        },

        pause: () => {
            // console.log('[Sound] Paused');
        },

        resume: () => {
            // console.log('[Sound] Resumed');
        }
    };
};

export const soundManager = createSoundManager();
