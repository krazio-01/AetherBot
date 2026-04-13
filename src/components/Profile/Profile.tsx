'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import LogoutBtn from '@/components/Ui/LogoutBtn/LogoutBtn';
import DefaultAvatar from '../../../public/images/default1.webp';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import './profile.css';

const ProfileDropdown = ({ user }: { user: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className={`profile ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button className="profile-summary" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} type="button">
                <div className="profile-avatar">
                    <Image src={user.avatar || DefaultAvatar} alt="profile image" width={34} height={34} />
                </div>
            </button>

            <div className="profile-menu">
                <div className="profile-info">
                    <Image src={user.avatar || DefaultAvatar} alt="profile info image" width={34} height={34} />
                    <div>
                        <p>{user.name || 'User'}</p>
                        <p>{user.email || ''}</p>
                    </div>
                </div>
                <div className="profile-actions">
                    <LogoutBtn />
                </div>
            </div>
        </div>
    );
};

export default ProfileDropdown;
