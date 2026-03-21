import { AdMob, BannerAdSize, BannerAdPosition, BannerAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// AdMob Configuration - PRODUCTION MODE
const ADMOB_CONFIG = {
    // Production Banner ID
    bannerId: 'ca-app-pub-1337451525993562/8773925168',
    isTesting: false // PRODUCTION MODE
};

class AdMobService {
    private _isInitialized = false;
    private _isBannerShowing = false;
    private _currentPosition: 'top' | 'bottom' | null = null;

    async initialize() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await AdMob.initialize({
                initializeForTesting: false, // PRODUCTION MODE
            });
            this._isInitialized = true;
        } catch (e) {
            console.error('AdMob init error:', e);
        }
    }

    async showBanner(position: 'top' | 'bottom' = 'top') {
        if (!this._isInitialized) await this.initialize();
        if (!Capacitor.isNativePlatform()) return;

        // Already showing at same position — skip
        if (this._isBannerShowing && this._currentPosition === position) return;

        // Remove existing banner before creating new one at different position
        if (this._isBannerShowing) {
            await this.removeBanner();
            // Give native layer time to destroy the old view
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        try {
            const options: BannerAdOptions = {
                adId: ADMOB_CONFIG.bannerId,
                adSize: BannerAdSize.BANNER,
                position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
                margin: 0,
                isTesting: ADMOB_CONFIG.isTesting
            };

            await AdMob.showBanner(options);
            this._isBannerShowing = true;
            this._currentPosition = position;
        } catch (e) {
            console.error('Show banner error:', e);
            this._isBannerShowing = false;
            this._currentPosition = null;
        }
    }

    async hideBanner() {
        if (!this._isBannerShowing) return;
        await this.removeBanner();
    }

    async removeBanner() {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await AdMob.removeBanner();
        } catch (e) {
            // Ignore — native view may already be gone
        } finally {
            this._isBannerShowing = false;
            this._currentPosition = null;
        }
    }

    isBannerVisible() {
        return this._isBannerShowing;
    }

    isNative() {
        return Capacitor.isNativePlatform();
    }
}

export const adMobService = new AdMobService();
