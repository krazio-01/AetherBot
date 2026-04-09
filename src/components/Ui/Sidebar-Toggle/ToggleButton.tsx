'use client';
import { TbLayoutSidebarLeftExpand, TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import useAppStore from '@/store/store';
import { usePathname } from 'next/navigation';
import './toggleButton.css';

const ToggleButton = () => {
    const setSidebarIsOpen = useAppStore((state) => state.setSidebarIsOpen);
    const sidebarIsOpen = useAppStore((state) => state.sidebarIsOpen);

    const pathname = usePathname();

    if (!pathname.includes('chat')) return null;

    return (
        <div>
            <button className="sidebar-toggle" onClick={() => setSidebarIsOpen()}>
                {sidebarIsOpen ? <TbLayoutSidebarLeftExpand /> : <TbLayoutSidebarLeftCollapse />}
            </button>
        </div>
    );
};

export default ToggleButton;
