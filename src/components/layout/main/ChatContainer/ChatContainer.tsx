'use client';
import { useEffect, useRef } from 'react';
import useAppStore from '@/store/store';
import Message from '@/components/layout/main/message/Message';
import DefaultItems from '@/components/layout/main/defaultItems/DefaultItems';
import { Oval } from 'react-loader-spinner';
import './chatContainer.css';

interface ChatContainerProps {
    user: any;
    isPending?: boolean;
    chatId?: string;
}

const LoadingState = () => (
    <div className="loader">
        <Oval visible={true} height="50" width="50" color="#7081fd" secondaryColor="#7081fd" />
    </div>
);

export default function ChatContainer({ user, isPending = true, chatId }: ChatContainerProps) {
    const messages = useAppStore((state) => state.messages);
    const loading = useAppStore((state) => state.loading);
    const currentChatId = useAppStore((state) => state.currentChatId);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isScrolledUp = useRef(false);
    const prevMessageCount = useRef(0);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        isScrolledUp.current = distanceToBottom > 50;
    };

    useEffect(() => {
        const isNewMessage = messages.length > prevMessageCount.current;
        prevMessageCount.current = messages.length;

        if (isNewMessage || !isScrolledUp.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: isNewMessage ? 'smooth' : 'auto' });
            isScrolledUp.current = false;
        }
    }, [messages]);

    if (isPending) {
        return <LoadingState />;
    }

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
                {messages.map((message, index) => (
                    <Message
                        key={message.client_id}
                        user={user}
                        message={message}
                        loading={loading && index === messages.length - 1}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
