'use client';
import React, { useState, useRef, MouseEvent, useMemo, useCallback, memo } from 'react';
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
    clearActiveChatState: () => void;
}

const Chats = ({ chat, removeChat, isActive, clearActiveChatState }: IChatsProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const dotsRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();
    const { deleteRequest } = useRequest();

    const toggleMenu = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dotsRef.current) return;

        const rect = dotsRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom, left: rect.right });
        setIsMenuOpen((prev) => !prev);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        setIsModalOpen(false);

        const performDelete = async (): Promise<string> => {
            try {
                const res = await deleteRequest<void>(`/chats/${chat.referenceId}`);
                if (res.success) return res.message || 'Chat deleted successfully';
                throw new Error('Failed to delete chat');
            } catch (error: any) {
                throw typeof error === 'string' ? error : 'An unexpected error occurred';
            }
        };

        toast.promise(performDelete(), {
            loading: 'Deleting...',
            success: (message) => {
                removeChat(chat.referenceId);
                if (isActive) {
                    clearActiveChatState();
                    router.push('/chat');
                }
                return message;
            },
            error: (err) => err,
        });
    }, [chat.referenceId, deleteRequest, isActive, removeChat, router]);

    const menuItems: IMenuItem[] = useMemo(
        () => [
            {
                icon: <MdDelete />,
                content: <button type="button">Delete</button>,
                onClick: () => {
                    setIsMenuOpen(false);
                    setIsModalOpen(true);
                },
            },
            {
                icon: <FaRegShareFromSquare />,
                content: <button type="button">Share</button>,
            },
        ],
        [],
    );

    return (
        <li className={`history-item ${isMenuOpen ? 'menu-open' : ''}`}>
            <Link href={`/chat/${chat.referenceId}`} className={`history-link ${isActive ? 'active' : ''}`}>
                <div className="chat-title">
                    <MdChatBubbleOutline />
                    <span>{chat.title}</span>
                </div>

                <button
                    type="button"
                    id="three-dots"
                    onClick={toggleMenu}
                    ref={dotsRef}
                    aria-label="Chat options"
                    aria-expanded={isMenuOpen}
                >
                    <BsThreeDotsVertical />
                </button>
            </Link>

            {isMenuOpen && <Menu position={menuPosition} onClose={() => setIsMenuOpen(false)} items={menuItems} />}

            {isModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setIsModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 id="modal-title">Delete Chat?</h3>
                        <p>
                            Are you sure you want to delete <strong>&quot;{chat.title}&quot;</strong>? This action
                            cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="confirm-delete-btn" onClick={handleConfirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
};

export default memo(Chats);
