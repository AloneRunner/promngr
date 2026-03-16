import { Capacitor, registerPlugin } from '@capacitor/core';

interface PlayGamesPlugin {
  signIn(): Promise<{ authenticated: boolean }>;
  isAuthenticated(): Promise<{ authenticated: boolean }>;
  unlockAchievement(options: { achievementId: string }): Promise<{ unlocked: boolean }>;
  showAchievements(): Promise<void>;
}

const PlayGames = registerPlugin<PlayGamesPlugin>('PlayGames');

class PlayGamesService {
  async signIn(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const result = await PlayGames.signIn();
      return !!result.authenticated;
    } catch (error) {
      console.error('Play Games sign-in error:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const result = await PlayGames.isAuthenticated();
      return !!result.authenticated;
    } catch (error) {
      console.error('Play Games auth check error:', error);
      return false;
    }
  }

  async unlockAchievement(achievementId: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !achievementId) return false;

    try {
      const result = await PlayGames.unlockAchievement({ achievementId });
      return !!result.unlocked;
    } catch (error) {
      console.error('Play Games unlock error:', error);
      return false;
    }
  }

  async showAchievements(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      await PlayGames.showAchievements();
      return true;
    } catch (error) {
      console.error('Play Games show achievements error:', error);
      return false;
    }
  }
}

export const playGamesService = new PlayGamesService();