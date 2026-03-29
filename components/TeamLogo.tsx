import React from 'react';
import { Team } from '../types';
import { getTeamLogo, hasTeamLogo } from '../logoMapping';
// @ts-ignore
import { ensureContrast } from '../src/utils/colorUtils';

interface TeamLogoProps {
    team?: Team;
    teamName?: string;
    className?: string; // e.g. "w-10 h-10"
    size?: number; // Optional explicit size in pixels
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
    team,
    teamName,
    className = "w-10 h-10",
    size
}) => {
    const displayName = team?.name || teamName || 'Unknown';
    // logoKey is the original name used for logo lookup — it survives renames
    const lookupName = (team as any)?.logoKey || displayName;
    const hasCustomLogo = hasTeamLogo(lookupName);

    // Style for explicit size if provided
    const style = size ? { width: size, height: size } : {};

    // 1. Render Logo ONLY if a real custom logo exists (not default fallback)
    if (hasCustomLogo) {
        return (
            <div
                className={`relative flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg bg-white/5 ${className}`}
                style={style}
            >
                <img
                    src={getTeamLogo(lookupName)}
                    alt={displayName}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                        // Logo yüklenemezse initials'a düş
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
            </div>
        );
    }

    // 2. Render Initials Box if no logo
    const primaryColor = team?.primaryColor || '#64748b';
    const secondaryColor = team?.secondaryColor || '#ffffff';

    const initial = displayName.charAt(0).toUpperCase();
    const textColor = ensureContrast(primaryColor, secondaryColor);

    return (
        <div
            className={`flex-shrink-0 flex items-center justify-center font-bold relative overflow-hidden shadow-lg border border-white/10 ${className}`}
            style={{
                backgroundColor: primaryColor,
                color: textColor,
                borderRadius: '20%',
                ...style
            }}
            title={displayName}
        >
            {/* Inner "shine" gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/20 pointer-events-none"></div>

            {/* The Initial */}
            <span style={{ fontSize: '60%', lineHeight: 1 }} className="relative z-10 drop-shadow-md">
                {initial}
            </span>
        </div>
    );
};
