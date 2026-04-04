'use client';
import React, { useState, useRef, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Menu from '@/components/menu/Menu';
import { MdChatBubbleOutline, MdDelete } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { toast } from 'sonner';
import { IChat, IMenuItem } from '@/types';
import { useRequest } from '@/hooks/useRequest';
import './chats.css';

interface IChatsProps {
    chat: IChat;
    removeChat: (id: string) => void;
    isActive: boolean;
}

const Chats = ({ chat, removeChat, isActive }: IChatsProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const dotsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { deleteRequest } = useRequest();

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
            const res = await deleteRequest<void>(`/chats/${chat.referenceId}`);

            if (res.success) return res.message || 'Chat deleted successfully';

            throw new Error('Failed to delete chat');
        } catch (error: any) {
            throw typeof error === 'string' ? error : 'An unexpected error occurred';
        }
    };

    const handleDelete = () => {
        setIsMenuOpen(false);

        toast.promise(
            deleteChat().then((message) => {
                removeChat(chat.referenceId);
                if (isActive) router.push('/chat');
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
            <Link href={`/chat/${chat.referenceId}`} className={`history-link ${isActive ? 'active' : ''}`}>
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
