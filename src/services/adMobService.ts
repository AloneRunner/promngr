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

    async initialize() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
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

        try {
            if (this._isBannerShowing) await this.hideBanner();

            const options: BannerAdOptions = {
                adId: ADMOB_CONFIG.bannerId,
                adSize: BannerAdSize.BANNER,
                position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
                margin: 0,
                isTesting: ADMOB_CONFIG.isTesting
            };

            await AdMob.showBanner(options);
            this._isBannerShowing = true;
        } catch (e) {
            console.error('Show banner error:', e);
            this._isBannerShowing = false;
        }
    }

    async hideBanner() {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await AdMob.hideBanner();
            await AdMob.removeBanner();
            this._isBannerShowing = false;
        } catch (e) { }
    }

    isBannerVisible() {
        return this._isBannerShowing;
    }
}

export const adMobService = new AdMobService();
