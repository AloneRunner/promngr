import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

interface LayoutProps {
    children: React.ReactNode;
    bgImage?: string; // Optional override
}

export const Layout: React.FC<LayoutProps> = ({ children, bgImage }) => {
    // Default to the installed main background
    const bg = bgImage || '/assets/bg-main.png';

    return (
        <div className="min-h-screen relative overflow-hidden font-body text-white">
            {/* Dynamic Background Layer */}
            <div
                className="screen-bg"
                style={{ backgroundImage: `url(${bg})` }}
            />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-[100dvh]">
                {/* Top Bar (Mobile Friendly) */}
                {/* Note: The actual navigation logic remains in App.tsx for now, 
            this layout just provides the structure. We might pass nav as children or props later. 
            For now, we'll wrap the whole app content. */}

                <main className="flex-1 w-full h-full relative">
                    {children}
                </main>
            </div>
        </div>
    );
};
