'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import useAppStore from '@/store/store';
import Message from '@/components/layout/main/message/Message';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRequest } from '@/hooks/useRequest';
import { IFetchMessagesRequest, IFetchMessagesResponse } from '@/types/chat';

interface IChatPageProps {
    params: {
        chatId: string;
    };
}

const ChatPage = ({ params }: IChatPageProps) => {
    const messages = useAppStore((state) => state.messages);
    const setMessages = useAppStore((state) => state.setMessages);
    const loading = useAppStore((state) => state.loading);
    const setIsNewChat = useAppStore((state) => state.setIsNewChat);

    const { postRequest, isPending, cancel } = useRequest();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { data: session } = useSession();
    const user = session?.user;

    const fetchMessages = async () => {
        try {
            setMessages([]);
            setIsNewChat(false);
            cancel();

            const res = await postRequest<IFetchMessagesResponse, IFetchMessagesRequest>('/interaction/fetchInteractons', {
                chatId: params.chatId,
            });

            if (res.success && res.data) setMessages(res.data.messages);
        } catch (error) {
            if (axios.isCancel(error) || error?.name === 'AbortError') return;

            router.push('/chat');
            toast.error(typeof error === 'string' ? error : 'Chat not found');
        }
    };

    useEffect(() => {
        if (!params.chatId) return;

        if (params.chatId.startsWith('guest_')) {
            setIsNewChat(false);
            return;
        }

        fetchMessages();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.chatId]);

    useLayoutEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
                    <div className="result-box">
                        <div className="boxi">
                            {messages.map((message, index) => (
                                <Message
                                    key={index}
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
