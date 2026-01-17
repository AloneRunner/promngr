import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';
import { adMobService } from '../services/adMobService';

interface LayoutProps {
    children: React.ReactNode;
    bgImage?: string; // Optional override
    bannerPosition?: 'top' | 'bottom' | 'none'; // For banner padding
}

// Banner height + status bar safe area
// Banner height + status bar safe area
const BANNER_PADDING = 90; // Reduced to 90px based on user feedback (was 120px)

export const Layout: React.FC<LayoutProps> = ({ children, bgImage, bannerPosition = 'top' }) => {
    // Default to the installed main background
    const bg = bgImage || '/assets/bg-main.png';

    // Only apply padding on native platforms when banner is visible
    const isNative = adMobService.isNative();
    const paddingTop = isNative && bannerPosition === 'top' ? BANNER_PADDING : 0;
    const paddingBottom = isNative && bannerPosition === 'bottom' ? BANNER_PADDING : 0;

    return (
        <div className="min-h-screen relative overflow-hidden overflow-x-hidden max-w-[100vw] font-body text-white">
            {/* Dynamic Background Layer */}
            <div
                className="screen-bg"
                style={{ backgroundImage: `url(${bg})` }}
            />

            {/* Content Layer */}
            <div
                className="relative z-10 flex flex-col h-[100dvh]"
                style={{ paddingTop, paddingBottom }}
            >
                <main className="flex-1 w-full h-full relative overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};


