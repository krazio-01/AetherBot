import Image from 'next/image';
import Link from 'next/link';
import ToggleButton from '@/components/Ui/Sidebar-Toggle/ToggleButton';
import ThemeToggle from '@/components/Ui/ThemeToggle/ThemeToggle';
import Logo from '../../../../public/images/logo.png';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import TryButton from '@/components/Ui/TryBtn/TryButton';
import './header.css';
import ProfileDropdown from '@/components/Profile/Profile';

const Header = async () => {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    return (
        <nav className="chatbox-header">
            <div className='left-section'>
                <div className="nav-sidebar-toggler">
                    <ToggleButton />
                </div>

                <div className="logo">
                    <Link href={user ? '/chat' : '/'}>
                        <Image src={Logo} alt="logo" width={45} height={45} />
                        <span>AetherBot</span>
                    </Link>
                </div>
            </div>

            <div className='right-section'>
                <ThemeToggle />

                {!user && <TryButton />}

                {user ? (
                    <ProfileDropdown user={user} />
                ) : (
                    <div className="auth-actions">
                        <Link href="/login" className="sign-in-btn">
                            Sign in
                        </Link>
                    </div>
                )}
            </div>

        </nav>
    );
};

export default Header;
