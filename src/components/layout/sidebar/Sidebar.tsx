'use client';
import { useState, useEffect, useRef, MouseEvent, useCallback, useMemo } from 'react';
import Link from 'next/link';
import useAppStore from '@/store/store';
import Chats from '@/components/layout/sidebar/chats/Chats';
import ToggleButton from '@/components/Ui/Sidebar-Toggle/ToggleButton';
import ThemeToggle from '@/components/Ui/ThemeToggle/ThemeToggle';
import Menu from '@/components/menu/Menu';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { MdDarkMode } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import { IoSettingsOutline, IoChatbubblesOutline } from 'react-icons/io5';
import { IMenuItem } from '@/types';
import { useRequest } from '@/hooks/useRequest';
import { IChatResponse } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import './sidebar.css';

const Sidebar = () => {
    const chats = useAppStore((state) => state.chats);
    const setChats = useAppStore((state) => state.setChats);
    const currentChatId = useAppStore((state) => state.currentChatId);
    const setCurrentChatId = useAppStore((state) => state.setCurrentChatId);
    const removeChat = useAppStore((state) => state.removeChat);
    const sidebarIsOpen = useAppStore((state) => state.sidebarIsOpen);
    const setMessages = useAppStore((state) => state.setMessages);
    const setInput = useAppStore((state) => state.setInput);

    const { isGuest, isLoading } = useAuth();

    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [chatsLoading, setChatsLoading] = useState<boolean>(true);

    const { getRequest } = useRequest();

    const settingsRef = useRef<HTMLButtonElement>(null);
    const initialFetchDone = useRef<boolean>(false);

    const clearActiveChatState = useCallback(() => {
        setMessages([]);
        setCurrentChatId(null);
    }, [setMessages, setCurrentChatId]);

    const toggleMenu = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
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
        },
        [sidebarIsOpen],
    );

    useEffect(() => {
        if (isLoading) return;

        if (isGuest) {
            if (chatsLoading) setChatsLoading(false);
            if (chats.length > 0) setChats([]);
            return;
        }

        const isInitialLoad = !initialFetchDone.current;
        const isMissingNewChat = currentChatId && !chats.some((chat) => chat.referenceId === currentChatId);

        if (!isInitialLoad && !isMissingNewChat) return;

        const fetchChats = async () => {
            try {
                if (isInitialLoad) setChatsLoading(true);

                const res = await getRequest<IChatResponse>('/chats');

                if (res.success && res.data?.chats) setChats(res.data.chats);
            } catch (error: any) {
                toast.error(typeof error === 'string' ? error : 'Failed to fetch chats');
            } finally {
                setChatsLoading(false);
                initialFetchDone.current = true;
            }
        };

        fetchChats();
    }, [currentChatId, chats, isLoading, isGuest, getRequest, chatsLoading, setChats]);

    const handleNewChatClick = useCallback(() => {
        setMessages([]);
        setInput('');
        setCurrentChatId(null);
    }, [setMessages, setInput, setCurrentChatId]);

    const menuItems: IMenuItem[] = useMemo(
        () => [
            {
                icon: <MdDarkMode />,
                content: <ThemeToggle variant="switch" />,
            },
        ],
        [],
    );

    return (
        <div className={`sidebar ${sidebarIsOpen ? 'active' : ''}`}>
            <div className="sidebar-header">
                <ToggleButton />

                <Link href="/chat" onClick={handleNewChatClick} className="newchat">
                    <FaPlus />
                    <span>New chat</span>
                </Link>
            </div>

            <div className="sidebar-content">
                {isGuest ? (
                    <div className="guest-prompt-container">
                        <div className="guest-prompt-card">
                            <p className="prompt-title">Sign in to start saving your chats</p>
                            <p className="prompt-subtitle">
                                Once you&apos;re signed in, you can access your recent chats here.
                            </p>
                            <Link href={'/login'} className="sidebar-signin-btn">
                                Sign in
                            </Link>
                        </div>
                    </div>
                ) : !chatsLoading ? (
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
                                            isActive={currentChatId === chat.referenceId}
                                            clearActiveChatState={clearActiveChatState}
                                        />
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="empty-history">
                            <IoChatbubblesOutline className="empty-icon" />
                            <span className="empty-title">No recent chats</span>
                        </div>
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
