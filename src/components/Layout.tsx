import React, { useState, useEffect } from 'react';
import { adMobService } from '../services/adMobService';

interface LayoutProps {
    children: React.ReactNode;
    bannerPosition?: 'top' | 'bottom';
}

export const Layout: React.FC<LayoutProps> = ({ children, bannerPosition = 'top' }) => {
    const [isBannerVisible, setIsBannerVisible] = useState(false);

    useEffect(() => {
        // Reklam durumunu periyodik kontrol et (veya event listener ekle)
        const checkBanner = () => {
            setIsBannerVisible(adMobService.isBannerVisible());
        };

        const interval = setInterval(checkBanner, 1000);
        checkBanner();

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full relative bg-slate-950 flex flex-col">
            {/* Üst Reklam Boşluğu - Sadece reklam görünürse açılır */}
            {isBannerVisible && bannerPosition === 'top' && (
                <div className="w-full h-[50px] bg-black/50 shrink-0 transition-all duration-300" />
            )}

            <div className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar safe-area-bottom">
                {children}
            </div>

            {/* Alt Reklam Boşluğu - Sadece reklam görünürse açılır */}
            {isBannerVisible && bannerPosition === 'bottom' && (
                <div className="w-full h-[50px] bg-black/50 shrink-0 transition-all duration-300" />
            )}
        </div>
    );
};
