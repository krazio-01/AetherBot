'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import useAppStore from '@/store/store';
import Message from '@/components/layout/main/message/Message';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useRequest } from '@/hooks/useRequest';
import { IFetchMessagesResponse } from '@/types/chat';

interface IChatPageProps {
    params: {
        chatId: string;
    };
}

const ChatPage = ({ params: { chatId } }: IChatPageProps) => {
    const messages = useAppStore((state) => state.messages);
    const setMessages = useAppStore((state) => state.setMessages);
    const loading = useAppStore((state) => state.loading);
    const setIsNewChat = useAppStore((state) => state.setIsNewChat);

    const { getRequest, isPending, cancel } = useRequest();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isScrolledUp = useRef(false);
    const prevMessageCount = useRef(0);

    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (!chatId) return;

        if (chatId.startsWith('guest_')) {
            if (messages.length === 0) {
                toast.info('Guest chat session expired.');
                router.push('/chat');
                return;
            }
            setIsNewChat(false);
            return;
        }

        const fetchMessages = async () => {
            try {
                setMessages([]);
                setIsNewChat(false);
                cancel();

                const res = await getRequest<IFetchMessagesResponse>(`/interactions?chatId=${chatId}`);

                if (res.success && res.data) {
                    const messagesWithIds = res.data.messages.map((msg) => ({
                        ...msg,
                        client_id: crypto.randomUUID(),
                    }));
                    setMessages(messagesWithIds);
                }
            } catch (error) {
                if (axios.isCancel(error) || error?.name === 'AbortError') return;

                router.push('/chat');
                toast.error(typeof error === 'string' ? error : 'Chat not found');
            }
        };

        fetchMessages();

        return () => cancel();
    }, [chatId, setMessages, setIsNewChat, cancel, getRequest, router]);

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
            messagesEndRef.current?.scrollIntoView({
                behavior: isNewMessage ? 'smooth' : 'auto',
            });
            isScrolledUp.current = false;
        }
    }, [messages]);

    return (
        <div className="chatbox-main">
            {isPending ? (
                <div className="loader">
                    <Oval
                        visible={true}
                        height="50"
                        width="50"
                        color="#7081fd"
                        secondaryColor="#7081fd"
                        ariaLabel="oval-loading"
                    />
                </div>
            ) : (
                <div className="chatbox-wrapper">
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
                </div>
            )}
        </div>
    );
};

export default ChatPage;
