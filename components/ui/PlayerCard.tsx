import React from 'react';
import { Player } from '../../types';

interface PlayerCardProps {
    player: Player;
    onClick?: () => void;
    showDetails?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, showDetails = true }) => {
    // Determine Card Tier
    const isElite = player.overall >= 85;
    const isGold = player.overall >= 75 && player.overall < 85;
    const isSilver = player.overall >= 65 && player.overall < 75;

    // Frame Selection
    let frameImage: string | null = null; // Default to no frame for now
    let nameColor = 'text-gray-200';
    let ratingColor = 'text-white';
    let glowColor = 'rgba(255, 255, 255, 0.2)';

    if (isElite) {
        // frameImage = '/assets/card-frame-gold.png'; // Frames skipped by user request
        nameColor = 'text-yellow-200 text-glow-gold';
        ratingColor = 'text-yellow-100';
        glowColor = 'rgba(255, 215, 0, 0.4)';
    } else if (isGold) {
        // frameImage = '/assets/card-frame-gold.png';
        nameColor = 'text-yellow-100';
        glowColor = 'rgba(255, 215, 0, 0.2)';
    } else if (isSilver) {
        // frameImage = '/assets/card-frame-silver.png';
        nameColor = 'text-cyan-100 text-glow-cyan';
        glowColor = 'rgba(0, 240, 255, 0.3)';
    }

    // Calculate stats for card
    const pac = Math.round((player.attributes.speed + player.attributes.acceleration) / 2);
    const sho = Math.round((player.attributes.finishing + player.attributes.shotPower) / 2);
    const pas = Math.round((player.attributes.passing + player.attributes.vision) / 2);
    const dri = Math.round((player.attributes.dribbling + player.attributes.technique) / 2);
    const def = Math.round((player.attributes.tackling + player.attributes.positioning) / 2);
    const phy = Math.round((player.attributes.strength + player.attributes.stamina) / 2);

    return (
        <div
            onClick={onClick}
            className="relative w-full aspect-[2/3] group cursor-pointer transition-transform hover:scale-105 hover:z-10"
        >
            {/* Glow Effect */}
            <div
                className="absolute inset-2 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: glowColor }}
            />

            {/* Main Container - Scaled slightly to fit within frame if needed */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">

                {/* Card Background (Inside Frame) */}
                <div className="absolute inset-[8%] bg-gradient-to-b from-gray-800 to-black rounded-lg opacity-90 z-0"></div>

                {/* Player Image Placeholder */}
                <div className="absolute top-[15%] w-[70%] aspect-square bg-gradient-to-t from-gray-900 to-transparent rounded-full overflow-hidden z-10 opacity-80">
                    {/* If we had player images, they would go here. For now, a silhouette or initials */}
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold opacity-30">
                        {player.firstName[0]}{player.lastName[0]}
                    </div>
                </div>

                {/* Top Info */}
                <div className="absolute top-[12%] left-[12%] z-20 flex flex-col items-center">
                    <span className={`text-2xl font-black font-display ${ratingColor} drop-shadow-md`}>{player.overall}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">{player.position}</span>
                </div>

                {/* Name */}
                <div className="absolute top-[55%] w-[80%] text-center z-20">
                    <h3 className={`font-display font-bold text-sm md:text-base leading-tight truncate ${nameColor}`}>
                        {player.lastName.toUpperCase()}
                    </h3>
                </div>

                {/* Stats Grid */}
                <div className="absolute bottom-[18%] w-[70%] grid grid-cols-2 gap-x-2 gap-y-0.5 text-[0.6rem] md:text-[0.65rem] font-bold opacity-90 z-20">
                    <div className="flex justify-between"><span>PAC</span> <span>{pac}</span></div>
                    <div className="flex justify-between"><span>DRI</span> <span>{dri}</span></div>
                    <div className="flex justify-between"><span>SHO</span> <span>{sho}</span></div>
                    <div className="flex justify-between"><span>DEF</span> <span>{def}</span></div>
                    <div className="flex justify-between"><span>PAS</span> <span>{pas}</span></div>
                    <div className="flex justify-between"><span>PHY</span> <span>{phy}</span></div>
                </div>

            </div>

            {/* Frame Overlay - THIS IS THE KEY ASSET */}
            {/* Frame Overlay - Only render if we have assets */}
            {frameImage && (
                <img
                    src={frameImage}
                    alt="frame"
                    className="absolute inset-0 w-full h-full pointer-events-none z-30 object-contain drop-shadow-xl"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
                />
            )}

            {/* Condition Indicator (Small dot) */}
            <div className={`absolute bottom-4 right-4 w-3 h-3 rounded-full border border-black z-40 ${player.condition > 80 ? 'bg-green-500' : player.condition > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />

        </div>
    );
};
