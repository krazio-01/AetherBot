'use client';
import { useAuth } from '@/hooks/useAuth';
import { MdLogout } from 'react-icons/md';

const LogoutBtn = () => {
    const { signOut } = useAuth();

    return (
        <div>
            <button onClick={() => signOut()}>
                <MdLogout />
                <span>Logout</span>
            </button>
        </div>
    );
};

export default LogoutBtn;
