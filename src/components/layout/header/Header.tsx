import Image from 'next/image';
import Link from 'next/link';
import LogoutBtn from '@/components/Ui/LogoutBtn/LogoutBtn';
import ToggleButton from '@/components/Ui/Sidebar-Toggle/ToggleButton';
import Logo from '../../../../public/images/logo.png';
import DefaultAvatar from '../../../../public/images/default1.webp';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import TryButton from '@/components/Ui/TryBtn/TryButton';
import './header.css';

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
                {!user && <TryButton />}

                {user ? (
                    <details className="profile">
                        <summary className="profile-summary">
                            <div className="profile-avatar">
                                <Image src={user.avatar || DefaultAvatar} alt="profile image" width={34} height={34} />
                            </div>
                        </summary>
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
                    </details>
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
