
import React from 'react';
import { PlayerVisual } from '../types';

interface PlayerAvatarProps {
  visual: PlayerVisual;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ visual, size = 'md' }) => {
  // Simple CSS based avatar generation
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-slate-300 border-2 border-slate-700 shadow-md`}>
       {/* Skin */}
       <div className="absolute inset-0" style={{backgroundColor: visual.skinColor}}></div>
       
       {/* Clothes/Jersey Neck */}
       <div className="absolute bottom-0 w-full h-1/4 bg-red-800 rounded-t-[50%]"></div>

       {/* Hair */}
       {visual.hairStyle === 1 && <div className="absolute top-0 w-full h-1/3" style={{backgroundColor: visual.hairColor}}></div>}
       {visual.hairStyle === 2 && <div className="absolute top-0 w-full h-1/4 bg-black/80" style={{backgroundColor: visual.hairColor}}></div>} {/* Buzz */}
       {visual.hairStyle === 3 && <div className="absolute top-0 left-[-10%] w-[120%] h-1/2 rounded-b-full" style={{backgroundColor: visual.hairColor}}></div>} {/* Long */}
       {visual.hairStyle === 4 && <div className="absolute top-[-10%] w-full h-1/2 rounded-full" style={{backgroundColor: visual.hairColor}}></div>} {/* Afro */}
       {visual.hairStyle === 5 && <div className="absolute top-0 w-full h-1/3 bg-transparent"></div>} {/* Bald */}

       {/* Eyes (Simple dots) */}
       <div className="absolute top-[40%] left-[30%] w-[10%] h-[10%] bg-black rounded-full"></div>
       <div className="absolute top-[40%] right-[30%] w-[10%] h-[10%] bg-black rounded-full"></div>

       {/* Beard / Accessory */}
       {visual.accessory && (
           <div className="absolute bottom-[20%] left-[30%] w-[40%] h-[10%] bg-black/50 rounded-b-full"></div>
       )}
    </div>
  );
};
