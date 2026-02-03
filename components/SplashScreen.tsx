import React, { useEffect, useState } from 'react';
import { Trophy, Activity, Globe } from 'lucide-react';

interface SplashScreenProps {
    onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [opacity, setOpacity] = useState(1);
    const [scale, setScale] = useState(0.8);

    useEffect(() => {
        // Animate in
        const animFrame = requestAnimationFrame(() => setScale(1));

        // Wait then fade out
        const timer = setTimeout(() => {
            setOpacity(0);
        }, 2200);

        const completeTimer = setTimeout(() => {
            onComplete();
        }, 2800);

        return () => {
            cancelAnimationFrame(animFrame);
            clearTimeout(timer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'opacity 0.6s ease-out',
            opacity: opacity
        }}>
            <div style={{
                transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: `scale(${scale})`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <div style={{
                        position: 'absolute',
                        inset: -20,
                        background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(0,0,0,0) 70%)',
                        animation: 'pulse 2s infinite'
                    }} />
                    <Trophy size={80} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.5))' }} />
                </div>

                <h1 style={{
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '0.5rem',
                    textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    letterSpacing: '-1px',
                    textAlign: 'center'
                }}>
                    POCKET FOOTBALL
                    <br />
                    <span style={{ color: '#3b82f6' }}>MANAGER</span>
                </h1>

                <p style={{
                    color: '#94a3b8',
                    letterSpacing: '3px',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase'
                }}>
                    Build Your Legacy
                </p>

                <div style={{
                    marginTop: '3rem',
                    display: 'flex',
                    gap: '1rem',
                    opacity: 0.7
                }}>
                    <Activity className="animate-bounce" size={20} color="#3b82f6" />
                    <Globe className="animate-pulse" size={20} color="#10b981" />
                </div>
            </div>
        </div>
    );
};
