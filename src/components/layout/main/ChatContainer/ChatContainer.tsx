'use client';
import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import useAppStore from '@/store/store';
import Message from '@/components/layout/main/message/Message';
import DefaultItems from '@/components/layout/main/defaultItems/DefaultItems';
import { Oval } from 'react-loader-spinner';
import './chatContainer.css';

interface IChatContainerProps {
    user: any;
    isPending?: boolean;
    chatId?: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
}

const LoadingState = () => (
    <div className="loader">
        <Oval visible={true} height="50" width="50" color="#7081fd" secondaryColor="#7081fd" />
    </div>
);

export default function ChatContainer({
    user,
    isPending = true,
    chatId,
    onLoadMore,
    hasMore,
    isLoadingMore,
}: IChatContainerProps) {
    const messages = useAppStore((state) => state.messages);
    const loading = useAppStore((state) => state.loading);
    const currentChatId = useAppStore((state) => state.currentChatId);
    const editMessage = useAppStore((state) => state.editMessage);
    const setMessages = useAppStore((state) => state.setMessages);
    const setCurrentChatId = useAppStore((state) => state.setCurrentChatId);
    const setInput = useAppStore((state) => state.setInput);

    const messageListContainerRef = useRef<HTMLDivElement>(null);
    const hasUserScrolledUp = useRef(false);
    const isAutoScrolling = useRef(false);
    const prePaginationScrollHeightRef = useRef<number>(0);

    const handleScroll = useCallback(() => {
        const container = messageListContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;

        hasUserScrolledUp.current = scrollHeight - scrollTop - clientHeight > 30;

        if (isAutoScrolling.current) return;

        if (scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
            prePaginationScrollHeightRef.current = scrollHeight;
            onLoadMore();
        }
    }, [hasMore, isLoadingMore, onLoadMore]);

    const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'auto') => {
        const container = messageListContainerRef.current;
        if (!container) return;

        isAutoScrolling.current = true;

        requestAnimationFrame(() => {
            if (behavior === 'smooth') container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            else container.scrollTop = container.scrollHeight;

            setTimeout(() => {
                isAutoScrolling.current = false;
            }, 50);
        });
    }, []);

    useLayoutEffect(() => {
        const container = messageListContainerRef.current;
        if (!container) return;

        if (prePaginationScrollHeightRef.current > 0) {
            if (hasUserScrolledUp.current) {
                const heightDifference = container.scrollHeight - prePaginationScrollHeightRef.current;
                container.scrollTop = heightDifference;
            }
            prePaginationScrollHeightRef.current = 0;
        } else {
            hasUserScrolledUp.current = false;
            scrollToBottom(messages.length > 0 ? 'smooth' : 'auto');
        }
    }, [messages.length, scrollToBottom]);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            setInput('');
            setCurrentChatId(null);
        }
    }, [chatId, setMessages, setInput, setCurrentChatId]);

    const handleStreamUpdate = useCallback(() => {
        if (!hasUserScrolledUp.current) scrollToBottom('auto');
    }, [scrollToBottom]);

    if (isPending) return <LoadingState />;

    if (messages.length === 0) {
        if (chatId) {
            if (currentChatId === null) return null;
            if (currentChatId !== chatId) return <LoadingState />;
        }

        return (
            <div className="chatbox-default fade-in-up">
                <div className="greeting">
                    <h2>Hey {user?.name || 'there'}</h2>
                </div>
                <DefaultItems />
            </div>
        );
    }

    return (
        <div className="result-box" ref={messageListContainerRef} onScroll={handleScroll}>
            {isLoadingMore && (
                <div className="pagination-loader">
                    <Oval visible={true} height="28" width="28" color="#7081fd" secondaryColor="#7081fd" />
                </div>
            )}

            <div className="boxi">
                {messages.map((message, index) => {
                    const isLastMessage = index === messages.length - 1;

                    return (
                        <Message
                            key={message.client_id}
                            user={user}
                            message={message}
                            loading={isLastMessage ? loading : false}
                            isLastMessage={isLastMessage}
                            onStreamUpdate={handleStreamUpdate}
                            editMessage={editMessage}
                        />
                    );
                })}
            </div>
        </div>
    );
}
