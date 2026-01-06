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
  private useTestAds = false; // Production mode by default

  /**
   * Initialize AdMob
   */
  async initialize() {
    if (this.isInitialized) return;

    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Web platform detected, skipping initialization');
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
   * Show banner ad at bottom of screen
   */
  async showBanner() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Web platform, banner not shown');
      return;
    }

    if (this.isBannerShowing) {
      console.log('AdMob: Banner already showing');
      return;
    }

    try {
      const adId = this.useTestAds 
        ? ADMOB_CONFIG.bannerAdUnitId.test 
        : ADMOB_CONFIG.bannerAdUnitId.production;

      const options: BannerAdOptions = {
        adId,
        adSize: BannerAdSize.BANNER, // 320x50
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 10, // 10px yukarı
        isTesting: this.useTestAds,
      };

      await AdMob.showBanner(options);
      this.isBannerShowing = true;
      console.log('AdMob: Banner shown successfully');
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
