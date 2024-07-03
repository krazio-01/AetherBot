import Image from "next/image";
import LogoutBtn from "@/components/Ui/LogoutBtn/LogoutBtn";
import ToggleButton from "@/components/Ui/Sidebar-Toggle/ToggleButton";
import Logo from "../../../../public/images/logo.png";
import DefaultAvatar from "../../../../public/images/default1.webp";
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from "next-auth";
import "./header.css";

const Header = async () => {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    return (
        <nav className="chatbox-header">
            <div className="nav-sidebar-toggler">
                <ToggleButton />
            </div>

            <div className="logo">
                <Image src={Logo} alt="logo" width={45} height={45} />
                <span>AetherBot</span>
            </div>

            <details className="profile">
                <summary className="profile-summary">
                    <div className="profile-avatar">
                        <Image
                            src={user?.avatar || DefaultAvatar}
                            alt="profile"
                            width={34}
                            height={34}
                        />
                    </div>
                </summary>
                <div className="profile-menu">
                    <div className="profile-info">
                        <Image
                            src={user?.avatar || DefaultAvatar}
                            alt="profile"
                            width={34}
                            height={34}
                        />
                        <div>
                            <p>{user?.name}</p>
                            <p>{user?.email}</p>
                        </div>
                    </div>
                    <div className="profile-actions">
                        <LogoutBtn />
                    </div>
                </div>
            </details>
        </nav>
    );
};

export default Header;