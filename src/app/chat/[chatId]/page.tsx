'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import useAppStore from '@/store/store';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useRequest } from '@/hooks/useRequest';
import { IFetchMessagesResponse } from '@/types/chat';
import ChatContainer from '@/components/layout/main/ChatContainer/ChatContainer';

interface IChatPageProps {
    params: { chatId: string };
}

const ChatPage = ({ params: { chatId } }: IChatPageProps) => {
    const messages = useAppStore((state) => state.messages);
    const setMessages = useAppStore((state) => state.setMessages);
    const currentChatId = useAppStore((state) => state.currentChatId);
    const setCurrentChatId = useAppStore((state) => state.setCurrentChatId);

    const { getRequest, isPending, cancel } = useRequest();
    const router = useRouter();
    const { user } = useAuth();

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const chatStateRef = useRef({ currentChatId, msgCount: messages.length });
    chatStateRef.current = { currentChatId, msgCount: messages.length };

    const fetchMessages = useCallback(async (pageNum: number, isLoadMore = false) => {
        try {
            if (!isLoadMore) {
                cancel();
                setMessages([]);
            } else {
                setIsLoadingMore(true);
            }

            const res = await getRequest<IFetchMessagesResponse & { hasMore: boolean }>(
                `/interactions?chatId=${chatId}&page=${pageNum}&limit=5`
            );

            if (res.success && res.data) {
                const messagesWithIds = res.data.messages.map((msg) => ({
                    ...msg,
                    client_id: crypto.randomUUID(),
                }));

                if (isLoadMore) {
                    useAppStore.setState((state) => ({ messages: [...messagesWithIds, ...state.messages] }));
                } else {
                    setMessages(messagesWithIds);
                    setCurrentChatId(chatId);
                }
                setHasMore(res.data.hasMore ?? false);
            }
        } catch (error) {
            if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) return;
            if (!isLoadMore) {
                router.push('/chat');
                const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Chat not found';
                toast.error(errorMessage);
            }
        } finally {
            if (isLoadMore) setIsLoadingMore(false);
        }
    }, [chatId, cancel, getRequest, setMessages, setCurrentChatId, router]);

    useEffect(() => {
        if (!chatId) return;

        if (chatId.startsWith('guest_')) {
            if (chatStateRef.current.msgCount === 0) {
                toast.info('Guest chat session expired.');
                router.push('/chat');
                return;
            }
            return;
        }

        if (chatStateRef.current.currentChatId !== chatId || chatStateRef.current.msgCount === 0) {
            setPage(0);
            setHasMore(true);
            fetchMessages(0);
        }

        return () => cancel();
    }, [chatId, fetchMessages, cancel, router]);

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchMessages(nextPage, true);
    };

    return (
        <div className="chatbox-main">
            <div className="chatbox-wrapper">
                <ChatContainer
                    user={user}
                    isPending={isPending && !isLoadingMore}
                    chatId={chatId}
                    onLoadMore={handleLoadMore}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                />
            </div>
        </div>
    );
};

export default ChatPage;
