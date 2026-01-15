/**
 * AdMob Service for Banner Ads
 * Handles banner advertisement display and management
 */

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobBannerSize } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// AdMob Configuration
const ADMOB_CONFIG = {
  appId: 'ca-app-pub-1337451525993562~6785044311',
  bannerAdUnitId: {
    production: 'ca-app-pub-1337451525993562/8773925168',
    test: 'ca-app-pub-3940256099942544/6300978111' // Google test banner ID
  }
};

class AdMobService {
  private isInitialized = false;
  private isBannerShowing = false;
  private currentPosition: 'top' | 'bottom' | null = null;
  private useTestAds = false; // Production mode by default
  private webPlatformLogged = false; // Prevent log spam on web

  /**
   * Initialize AdMob
   */
  async initialize() {
    if (this.isInitialized) return;

    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      if (!this.webPlatformLogged) {
        console.log('AdMob: Web platform detected, skipping initialization');
        this.webPlatformLogged = true;
      }
      return;
    }

    try {
      await AdMob.initialize({
        testingDevices: [], // Add device IDs for testing if needed
        initializeForTesting: this.useTestAds,
      });

      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('AdMob initialization failed:', error);
    }
  }

  /**
   * Show banner ad at specified position
   * @param position 'top' or 'bottom' (default: 'top')
   */
  async showBanner(position: 'top' | 'bottom' = 'top') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!Capacitor.isNativePlatform()) {
      // Silent return on web - already logged once
      return;
    }

    // If banner is already showing at the same position, skip
    if (this.isBannerShowing && this.currentPosition === position) {
      console.log('AdMob: Banner already showing at same position');
      return;
    }

    // If banner is showing at different position, remove first
    if (this.isBannerShowing && this.currentPosition !== position) {
      await this.removeBanner();
      // Small delay to ensure banner is fully removed
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      const adId = this.useTestAds
        ? ADMOB_CONFIG.bannerAdUnitId.test
        : ADMOB_CONFIG.bannerAdUnitId.production;

      const options: BannerAdOptions = {
        adId,
        adSize: BannerAdSize.BANNER, // 320x50
        position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: this.useTestAds,
      };

      await AdMob.showBanner(options);
      this.isBannerShowing = true;
      this.currentPosition = position;
      console.log(`AdMob: Banner shown at ${position}`);
    } catch (error) {
      console.error('AdMob: Failed to show banner:', error);
    }
  }

  /**
   * Hide banner ad
   */
  async hideBanner() {
    if (!this.isBannerShowing) return;

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.hideBanner();
      this.isBannerShowing = false;
      console.log('AdMob: Banner hidden');
    } catch (error) {
      console.error('AdMob: Failed to hide banner:', error);
    }
  }

  /**
   * Remove banner ad completely
   */
  async removeBanner() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.removeBanner();
      this.isBannerShowing = false;
      this.currentPosition = null;
      console.log('AdMob: Banner removed');
    } catch (error) {
      console.error('AdMob: Failed to remove banner:', error);
    }
  }

  /**
   * Resume banner (after app comes to foreground)
   */
  async resumeBanner() {
    if (!this.isBannerShowing) return;

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.resumeBanner();
      console.log('AdMob: Banner resumed');
    } catch (error) {
      console.error('AdMob: Failed to resume banner:', error);
    }
  }

  /**
   * Enable test mode (uses Google test ads)
   * Call this during development
   */
  enableTestMode() {
    this.useTestAds = true;
    console.log('AdMob: Test mode enabled');
  }

  /**
   * Disable test mode (uses real ads)
   * Call this for production
   */
  disableTestMode() {
    this.useTestAds = false;
    console.log('AdMob: Test mode disabled - using production ads');
  }

  /**
   * Check if banner is currently showing
   */
  isBannerVisible(): boolean {
    return this.isBannerShowing;
  }

  /**
   * Get current banner position
   */
  getBannerPosition(): 'top' | 'bottom' | null {
    return this.currentPosition;
  }

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }
}

// Singleton instance
export const adMobService = new AdMobService();

// Export types for use in components
export { BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

