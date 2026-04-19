import { useRef, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useAppStore from '@/store/store';
import { useRequest } from '@/hooks/useRequest';
import { ChatRole, ICreateChatResponse, MediaType } from '@/types/chat';
import { IMessage } from '@/types';
import { IUploadState } from './useFileUpload';

export const useChatSubmit = (
    chatId: string | undefined,
    isAuthenticated: boolean,
    uploadState: IUploadState,
    resetUploadState: () => void,
) => {
    const router = useRouter();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { postRequest } = useRequest();

    const { input, setInput, loading, setLoading, setIsNewChat, messages, chats, setChats, updateMessages } =
        useAppStore();

    const adjustTextareaHeight = (reset: boolean = false) => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        if (!reset) textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    };

    const createChatMessage = (
        role: ChatRole,
        text: string,
        attachment?: { url: string; type: MediaType; name: string },
        isError: boolean = false,
    ): IMessage => ({
        client_id: crypto.randomUUID(),
        role,
        parts: [{ text }],
        attachment,
        isError,
    });

    const updateChat = async (currentChatId: string | undefined, newMessage: IMessage) => {
        const previousMessages = [...messages];
        updateMessages(newMessage);

        try {
            setLoading(true);
            setInput('');
            resetUploadState();
            adjustTextareaHeight(true);

            const formData = new FormData();
            formData.append('referenceId', currentChatId || '');
            formData.append('prompt', input);

            if (!isAuthenticated) {
                const history = messages.map(({ attachment, isError, ...msg }: IMessage) => msg);
                formData.append('history', JSON.stringify(history));
            }

            if (uploadState.attachment) {
                formData.append('file', uploadState.attachment.file);

                if (uploadState.attachment.url.startsWith('http')) {
                    formData.append('fileUrl', uploadState.attachment.url);
                    formData.append('fileType', uploadState.attachment.type);
                    formData.append('fileName', uploadState.attachment.name);
                }
            }

            const res = await postRequest<ICreateChatResponse, FormData>('/chats', formData);

            if (res.success && res.data) {
                updateMessages(createChatMessage(ChatRole.MODEL, res.data.modelMessage));

                const updatedChats = [...chats];
                const index = updatedChats.findIndex((c) => c.referenceId === res.data!.referenceId);

                if (index > 0) {
                    const [movedChat] = updatedChats.splice(index, 1);
                    updatedChats.unshift(movedChat);
                    setChats(updatedChats);
                }

                return res.data.referenceId;
            }
        } catch (error: any) {
            const errorMessage = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';
            if (currentChatId) {
                updateMessages(createChatMessage(ChatRole.MODEL, errorMessage, undefined, true));
            } else {
                useAppStore.setState({ messages: previousMessages });
            }
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e?: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
        if (e) e.preventDefault();

        if (!input.trim() || uploadState.loading || loading) return;

        const newMessage = createChatMessage(ChatRole.USER, input, uploadState.attachment || undefined);

        if (!chatId) {
            toast.promise(
                updateChat(chatId, newMessage).then((referenceId) => {
                    if (referenceId) {
                        setIsNewChat(true);
                        router.push(`/chat/${referenceId}`);
                    }
                }),
                {
                    loading: 'Generating response...',
                    success: 'Conversation initialized!',
                    error: (err) => err.message,
                },
            );
        } else {
            await updateChat(chatId, newMessage);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return { textareaRef, adjustTextareaHeight, handleSubmit, handleKeyDown, input, setInput, loading };
};
