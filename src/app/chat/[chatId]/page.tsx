'use client';
import { useEffect, useRef } from 'react';
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

    const chatStateRef = useRef({ currentChatId, msgCount: messages.length });
    chatStateRef.current = { currentChatId, msgCount: messages.length };

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

        if (chatStateRef.current.currentChatId === chatId && chatStateRef.current.msgCount > 0) return;

        const fetchMessages = async () => {
            try {
                cancel();
                setMessages([]);

                const res = await getRequest<IFetchMessagesResponse>(`/interactions?chatId=${chatId}`);

                if (res.success && res.data) {
                    const messagesWithIds = res.data.messages.map((msg) => ({
                        ...msg,
                        client_id: crypto.randomUUID(),
                    }));
                    setMessages(messagesWithIds);
                    setCurrentChatId(chatId);
                }
            } catch (error) {
                if (axios.isCancel(error) || error?.name === 'AbortError') return;
                router.push('/chat');
                toast.error(typeof error === 'string' ? error : 'Chat not found');
            }
        };

        fetchMessages();
        return () => cancel();
    }, [chatId, setMessages, setCurrentChatId, cancel, getRequest, router]);

    return (
        <div className="chatbox-main">
            <div className="chatbox-wrapper">
                <ChatContainer user={user} isPending={isPending} chatId={chatId} />
            </div>
        </div>
    );
};

export default ChatPage;
