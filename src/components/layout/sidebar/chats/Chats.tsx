'use client';
import React, { useState, useRef, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import Menu from '@/components/menu/Menu';
import { MdChatBubbleOutline, MdDelete } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { toast } from 'sonner';
import { IChat, IMenuItem } from '@/types';
import './chats.css';

interface ChatsProps {
    chat: IChat;
    removeChat: (id: string) => void;
    isActive: boolean;
}

const Chats = ({ chat, removeChat, isActive }: ChatsProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const dotsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const toggleMenu = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dotsRef.current) return;

        const rect = dotsRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom, left: rect.right });
        setIsMenuOpen((prev) => !prev);
    };

    const deleteChat = async (): Promise<string> => {
        try {
            const { data } = await axios.delete('/api/chat/deleteChat', {
                params: {
                    chatId: chat.referenceId,
                },
            });

            removeChat(chat.referenceId);
            return data.message;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw error.response?.data?.message || 'Failed to delete chat';
            }
            throw 'An unexpected error occurred';
        }
    };

    const handleDelete = () => {
        setIsMenuOpen(false);

        toast.promise(
            deleteChat().then((message) => {
                router.push('/chat');
                return message;
            }),
            {
                loading: 'Deleting...',
                success: (message) => message,
                error: (message) => message,
            },
        );
    };

    const menuItems: IMenuItem[] = [
        {
            icon: <MdDelete />,
            content: <button>Delete</button>,
            onClick: handleDelete,
        },
        {
            icon: <FaRegShareFromSquare />,
            content: <button>Share</button>,
        },
    ];

    return (
        <li className={`history-item ${isMenuOpen ? 'menu-open' : ''}`}>
            <Link
                href={`/chat/${chat.referenceId}`}
                className={`history-link ${isActive ? 'active' : ''}`}
            >
                <div className="chat-title">
                    <MdChatBubbleOutline />
                    <span>{chat.title}</span>
                </div>
                <div id="three-dots" onClick={toggleMenu} ref={dotsRef}>
                    <BsThreeDotsVertical />
                </div>
            </Link>
            {isMenuOpen && <Menu position={menuPosition} onClose={() => setIsMenuOpen(false)} items={menuItems} />}
        </li>
    );
};

export default Chats;
