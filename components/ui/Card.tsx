import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'neon';
    title?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'glass',
    title,
    action
}) => {
    const baseStyles = "relative overflow-hidden transition-all duration-300";

    const variants = {
        default: "bg-slate-800 border border-slate-700 rounded-lg",
        glass: "glass-panel p-0", // p-0 allows custom padding
        neon: "glass-panel border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`}>
            {/* Header if title exists */}
            {(title || action) && (
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                    {title && <h3 className="text-lg font-display font-bold text-white tracking-wide drop-shadow-md">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}

            <div className={title ? 'p-4' : ''}>
                {children}
            </div>
        </div>
    );
};
