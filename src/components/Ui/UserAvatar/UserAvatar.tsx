import React, { memo } from 'react';
import Image from 'next/image';
import { LuUser } from 'react-icons/lu';
import './userAvatar.css';

interface IUserAvatarProps {
    avatar?: string | null;
    size?: number;
    alt?: string;
}

const UserAvatar = ({ avatar, size = 30, alt = 'User Avatar' }: IUserAvatarProps) => {
    if (avatar) {
        return (
            <Image
                src={avatar}
                alt={alt}
                width={size}
                height={size}
                className="avatar-img"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className="avatar-fallback"
            style={{
                width: size,
                height: size,
                fontSize: `${size * 0.45}px`,
            }}
        >
            <LuUser />
        </div>
    );
};

export default memo(UserAvatar);
