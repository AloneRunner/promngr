import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden rounded-lg";

    const variants = {
        primary: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:brightness-110",
        secondary: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400/30 hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] hover:brightness-110",
        danger: "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] border border-red-400/30 hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:brightness-110",
        ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/10",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 shadow-lg"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-2"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* Gloss Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    <span className="relative z-10 drop-shadow-sm">{children}</span>
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};
