'use client';
import { useState, useRef } from 'react';
import LogoutBtn from '@/components/Ui/LogoutBtn/LogoutBtn';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import UserAvatar from '../Ui/UserAvatar/UserAvatar';
import './profile.css';

const ProfileDropdown = ({ user }: { user: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className={`profile ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button className="profile-summary" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} type="button">
                <div className="profile-avatar">
                    <UserAvatar avatar={user?.avatar} size={34} />
                </div>
            </button>

            <div className="profile-menu">
                <div className="profile-info">
                    <UserAvatar avatar={user?.avatar} size={34} />
                    <div>
                        <p>{user?.name || 'User'}</p>
                        <p>{user?.email || ''}</p>
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
