/**
 * Sound Manager for Match Center
 * Handles background ambience and event-based sounds
 * Syncs with match speed and state
 */

export type SoundType = 
  | 'crowd_ambience' // Sürekli tribün sesi (loop)
  | 'whistle_start'  // Maç başlangıcı
  | 'whistle_end'    // Maç sonu
  | 'goal'           // Gol sesi
  | 'yellow_card'    // Sarı kart
  | 'red_card'       // Kırmızı kart
  | 'substitution'   // Oyuncu değişikliği
  | 'penalty'        // Penaltı düdüğü
  | 'corner'         // Korner sesi
  | 'cheer'          // Kısa alkış/tezahürat
  | 'ui_click'       // UI buton sesi
  | 'notification';  // Bildirim sesi

interface SoundConfig {
  volume: number;
  loop: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private config: Map<SoundType, SoundConfig> = new Map();
  private isPaused: boolean = false;
  private masterVolume: number = 0.7;
  
  // Current playing states
  private ambienceAudio: HTMLAudioElement | null = null;
  private eventAudios: Set<HTMLAudioElement> = new Set();

  constructor() {
    this.initializeSounds();
  }

  /**
   * Initialize sound configurations
   */
  private initializeSounds() {
    // Arka plan tribün sesi - sürekli loop
    this.config.set('crowd_ambience', { 
      volume: 0.3, 
      loop: true,
      fadeInDuration: 1000,
      fadeOutDuration: 500
    });

    // Event-based sesler
    const eventVolume = 0.6;
    this.config.set('goal', { volume: 0.8, loop: false });
    this.config.set('whistle_start', { volume: eventVolume, loop: false });
    this.config.set('whistle_end', { volume: eventVolume, loop: false });
    this.config.set('yellow_card', { volume: 0.4, loop: false });
    this.config.set('red_card', { volume: 0.5, loop: false });
    this.config.set('substitution', { volume: 0.3, loop: false });
    this.config.set('penalty', { volume: eventVolume, loop: false });
    this.config.set('corner', { volume: 0.4, loop: false });
    this.config.set('cheer', { volume: 0.5, loop: false });
    
    // UI Sesleri
    this.config.set('ui_click', { volume: 0.2, loop: false });
    this.config.set('notification', { volume: 0.4, loop: false });
  }

  /**
   * Load and cache audio file
   */
  private loadSound(type: SoundType): HTMLAudioElement {
    if (this.sounds.has(type)) {
      return this.sounds.get(type)!;
    }

    const audio = new Audio(`/sounds/${type}.mp3`);
    const cfg = this.config.get(type);
    
    if (cfg) {
      audio.volume = cfg.volume * this.masterVolume;
      audio.loop = cfg.loop;
    }

    this.sounds.set(type, audio);
    return audio;
  }

  /**
   * Play a sound effect
   * @param type - Sound type to play
   * @param forcePlay - Play even if paused (for UI sounds)
   */
  play(type: SoundType, forcePlay: boolean = false) {
    // UI sesleri her zaman çalabilir
    const isUISound = type === 'ui_click' || type === 'notification';
    
    if (this.isPaused && !forcePlay && !isUISound) {
      return; // Match paused, don't play match sounds
    }

    try {
      const audio = this.loadSound(type);
      const cfg = this.config.get(type);

      // Eğer loop değilse (event sesi), yeni instance oluştur
      if (!cfg?.loop) {
        const eventAudio = audio.cloneNode(true) as HTMLAudioElement;
        eventAudio.volume = (cfg?.volume || 0.5) * this.masterVolume;
        
        eventAudio.play().catch(err => {
          console.warn(`Failed to play ${type}:`, err);
        });

        // Cleanup after playing
        eventAudio.addEventListener('ended', () => {
          this.eventAudios.delete(eventAudio);
        });

        this.eventAudios.add(eventAudio);
      } else {
        // Loop sesi (ambience)
        audio.play().catch(err => {
          console.warn(`Failed to play ${type}:`, err);
        });
      }
    } catch (error) {
      console.error(`Error playing sound ${type}:`, error);
    }
  }

  /**
   * Start background crowd ambience
   */
  startAmbience() {
    if (this.ambienceAudio) return; // Already playing

    try {
      const audio = this.loadSound('crowd_ambience');
      const cfg = this.config.get('crowd_ambience');
      
      audio.volume = 0; // Start silent for fade-in
      audio.play().catch(err => {
        console.warn('Failed to start ambience:', err);
      });

      // Fade in
      const fadeInDuration = cfg?.fadeInDuration || 1000;
      const targetVolume = (cfg?.volume || 0.3) * this.masterVolume;
      this.fadeVolume(audio, 0, targetVolume, fadeInDuration);

      this.ambienceAudio = audio;
    } catch (error) {
      console.error('Error starting ambience:', error);
    }
  }

  /**
   * Stop background crowd ambience
   */
  stopAmbience() {
    if (!this.ambienceAudio) return;

    const cfg = this.config.get('crowd_ambience');
    const fadeOutDuration = cfg?.fadeOutDuration || 500;

    this.fadeVolume(this.ambienceAudio, this.ambienceAudio.volume, 0, fadeOutDuration, () => {
      if (this.ambienceAudio) {
        this.ambienceAudio.pause();
        this.ambienceAudio = null;
      }
    });
  }

  /**
   * Pause all sounds (speed = 0)
   */
  pause() {
    this.isPaused = true;
    
    // Pause ambience
    if (this.ambienceAudio) {
      this.ambienceAudio.pause();
    }

    // Pause all event sounds
    this.eventAudios.forEach(audio => {
      audio.pause();
    });
  }

  /**
   * Resume all sounds (speed > 0)
   */
  resume() {
    this.isPaused = false;

    // Resume ambience
    if (this.ambienceAudio) {
      this.ambienceAudio.play().catch(err => {
        console.warn('Failed to resume ambience:', err);
      });
    }

    // Note: Event sounds are one-time, don't resume them
  }

  /**
   * Stop all sounds (match end or exit)
   */
  stopAll() {
    this.stopAmbience();
    
    this.eventAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.eventAudios.clear();
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update all active sounds
    if (this.ambienceAudio) {
      const cfg = this.config.get('crowd_ambience');
      this.ambienceAudio.volume = (cfg?.volume || 0.3) * this.masterVolume;
    }

    this.eventAudios.forEach(audio => {
      // Can't easily update event audio volumes since we don't track their types
      // This is fine for one-time sounds
    });
  }

  /**
   * Fade audio volume
   */
  private fadeVolume(
    audio: HTMLAudioElement,
    startVolume: number,
    endVolume: number,
    duration: number,
    onComplete?: () => void
  ) {
    const startTime = Date.now();
    const volumeDiff = endVolume - startVolume;

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      audio.volume = startVolume + (volumeDiff * progress);

      if (progress < 1) {
        requestAnimationFrame(fade);
      } else if (onComplete) {
        onComplete();
      }
    };

    fade();
  }

  /**
   * Preload all sounds for better performance
   */
  async preloadAll(): Promise<void> {
    const soundTypes: SoundType[] = [
      'crowd_ambience',
      'whistle_start',
      'whistle_end',
      'goal',
      'yellow_card',
      'red_card',
      'substitution',
      'penalty',
      'corner',
      'cheer',
      'ui_click',
      'notification'
    ];

    const loadPromises = soundTypes.map(type => {
      return new Promise<void>((resolve) => {
        try {
          const audio = this.loadSound(type);
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.load();
        } catch {
          resolve(); // Skip if file doesn't exist yet
        }
      });
    });

    await Promise.all(loadPromises);
  }
}

// Singleton instance
export const soundManager = new SoundManager();
