import React from 'react';

interface AvatarProps {
    name: string;
    picture?: string | null;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-lg',
};

const Avatar: React.FC<AvatarProps> = ({ name, picture, size = 'md' }) => {
    if (picture) {
        return (
            <img
                src={picture}
                alt={name}
                referrerPolicy="no-referrer"
                className={`${sizeClasses[size]} rounded-full object-cover shrink-0 border border-gray-100`}
            />
        );
    }

    return (
        <div
            className={`${sizeClasses[size]} rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 border border-brand-100`}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
};

export default Avatar;
