'use client';
import { useEffect, useRef, useCallback } from 'react';
import useAppStore from '@/store/store';
import Message from '@/components/layout/main/message/Message';
import DefaultItems from '@/components/layout/main/defaultItems/DefaultItems';
import { Oval } from 'react-loader-spinner';
import './chatContainer.css';

interface IChatContainerProps {
    user: any;
    isPending?: boolean;
    chatId?: string;
}

const LoadingState = () => (
    <div className="loader">
        <Oval visible={true} height="50" width="50" color="#7081fd" secondaryColor="#7081fd" />
    </div>
);

export default function ChatContainer({ user, isPending = true, chatId }: IChatContainerProps) {
    const messages = useAppStore((state) => state.messages);
    const loading = useAppStore((state) => state.loading);
    const currentChatId = useAppStore((state) => state.currentChatId);
    const editMessage = useAppStore((state) => state.editMessage);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isScrolledUp = useRef(false);
    const isAutoScrolling = useRef(false);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container || isAutoScrolling.current) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        isScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100;
    };

    const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'auto') => {
        const container = scrollContainerRef.current;
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

    useEffect(() => {
        if (!isScrolledUp.current) scrollToBottom(messages.length > 0 ? 'smooth' : 'auto');
    }, [messages.length, scrollToBottom]);

    const handleStreamUpdate = useCallback(() => {
        if (!isScrolledUp.current) scrollToBottom('auto');
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
        <div className="result-box" ref={scrollContainerRef} onScroll={handleScroll}>
            <div className="boxi">
                {messages.map((message, index) => {
                    const isLastMessage = index === messages.length - 1;

                    return <Message
                        key={message.client_id}
                        user={user}
                        message={message}
                        loading={loading}
                        isLastMessage={isLastMessage}
                        onStreamUpdate={handleStreamUpdate}
                        editMessage={editMessage}
                    />
                })}
            </div>
        </div>
    );
}
