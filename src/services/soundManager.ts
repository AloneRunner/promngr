type SoundType = 'whistle_start' | 'whistle_end' | 'goal' | 'cheer' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'corner' | 'ambience';

class SoundManager {
    private sounds: Record<string, HTMLAudioElement> = {};
    private isMuted = false;
    private ambienceAudio: HTMLAudioElement | null = null;

    constructor() {
        // Sesleri burada preload edebilirsin (dosyaların /assets/sounds/ altında olmalı)
        // this.load('goal', '/assets/sounds/goal.mp3');
    }

    load(key: SoundType, path: string) {
        this.sounds[key] = new Audio(path);
    }

    play(sound: SoundType) {
        if (this.isMuted || !this.sounds[sound]) return;

        // Sesi baştan çal
        this.sounds[sound].currentTime = 0;
        this.sounds[sound].play().catch(e => console.log("Audio play failed", e));
    }

    startAmbience() {
        if (this.isMuted) return;
        // Ambiyans sesi eklendiğinde aç
        // if (!this.ambienceAudio) this.ambienceAudio = new Audio('/assets/sounds/stadium.mp3');
        // this.ambienceAudio.loop = true;
        // this.ambienceAudio.play();
    }

    stopAll() {
        if (this.ambienceAudio) {
            this.ambienceAudio.pause();
            this.ambienceAudio.currentTime = 0;
        }
    }

    pause() {
        if (this.ambienceAudio) this.ambienceAudio.pause();
    }

    resume() {
        if (!this.isMuted && this.ambienceAudio) this.ambienceAudio.play();
    }
}

export const soundManager = new SoundManager();
