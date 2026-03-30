'use client';
import { useState, useEffect, useRef, MouseEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useAppStore from '@/store/store';
import axios, { AxiosError } from 'axios';
import { useTheme } from 'next-themes';
import Chats from '@/components/layout/sidebar/chats/Chats';
import ToggleButton from '@/components/Ui/Sidebar-Toggle/ToggleButton';
import Menu from '@/components/menu/Menu';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { MdDarkMode } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import { IoSettingsOutline } from 'react-icons/io5';
import { IChat, IMenuItem, IResponseWrapper } from '@/types';
import './sidebar.css';

const Sidebar = () => {
    const chats = useAppStore((state) => state.chats);
    const setChats = useAppStore((state) => state.setChats);
    const isNewChat = useAppStore((state) => state.isNewChat);
    const removeChat = useAppStore((state) => state.removeChat);
    const sidebarIsOpen = useAppStore((state) => state.sidebarIsOpen);

    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [chatsLoading, setChatsLoading] = useState<boolean>(true);

    const { theme, setTheme } = useTheme();

    const settingsRef = useRef<HTMLButtonElement>(null);
    const params = useParams();

    const toggleMenu = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!settingsRef.current) return;

        const rect = settingsRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const menuHeight = 42;
        let left = rect.right - 100;

        if (!sidebarIsOpen) {
            const menuWidth = 180;
            left = rect.left - menuWidth;
            if (left < 0) left = 10;
        }

        const top = rect.bottom + menuHeight > viewportHeight ? rect.top - menuHeight : rect.bottom;

        setMenuPosition({ top, left });
        setIsMenuOpen((prev) => !prev);
    };

    useEffect(() => {
        const fetchChats = async () => {
            try {
                setChatsLoading(true);

                const { data } = await axios.get<IResponseWrapper<{ chats: IChat[] }>>('/api/chat/fetchChats');

                if (data.data?.chats) setChats(data.data.chats);
            } catch (error) {
                if (error instanceof AxiosError) {
                    const errorData = error.response?.data as IResponseWrapper;
                    toast.error(errorData?.message || 'Failed to fetch chats');
                } else {
                    toast.error('An unexpected error occurred');
                }
            } finally {
                setChatsLoading(false);
            }
        };

        fetchChats();
    }, [isNewChat, setChats]);

    const menuItems: IMenuItem[] = [
        {
            icon: <MdDarkMode />,
            content: (
                <div>
                    <span>Dark Mode</span>
                    <input
                        type="checkbox"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTheme(e.target.checked ? 'dark' : 'light')}
                        checked={theme === 'dark'}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className={`sidebar ${sidebarIsOpen ? 'active' : ''}`}>
            <div className="sidebar-header">
                <ToggleButton />

                <Link href="/chat" className="newchat">
                    <FaPlus />
                    <span>New chat</span>
                </Link>
            </div>

            <div className="sidebar-content">
                {!chatsLoading ? (
                    chats.length > 0 ? (
                        <>
                            <span>Chats</span>
                            <div className="history">
                                <ul>
                                    {chats.map((chat) => (
                                        <Chats
                                            key={chat?.referenceId}
                                            chat={chat}
                                            removeChat={removeChat}
                                            isActive={params?.chatId === chat.referenceId}
                                        />
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <span className="no-chats">No chats</span>
                    )
                ) : (
                    <div className="chats-loader">
                        <Oval
                            visible={true}
                            height="36"
                            width="36"
                            color="#7081fd"
                            secondaryColor="#7081fd"
                            ariaLabel="oval-loading"
                        />
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <button onClick={toggleMenu} ref={settingsRef}>
                    <IoSettingsOutline />
                    <span>Settings</span>
                </button>

                {isMenuOpen && <Menu position={menuPosition} onClose={() => setIsMenuOpen(false)} items={menuItems} />}
            </div>
        </div>
    );
};

export default Sidebar;
