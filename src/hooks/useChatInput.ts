import { useRef, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useAppStore from '@/store/store';
import { useRequest } from '@/hooks/useRequest';
import { ChatRole, ICreateChatResponse } from '@/types/chat';
import { IMessage } from '@/types';
import { IUploadState } from './useImageUpload';

export const useChatSubmit = (chatId: string | undefined, uploadState: IUploadState, resetUploadState: () => void) => {
    const router = useRouter();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { postRequest } = useRequest();

    const { input, setInput, loading, setLoading, setIsNewChat, messages, updateMessages } = useAppStore();

    const adjustTextareaHeight = (reset: boolean = false) => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        if (!reset) textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    };

    const createChatMessage = (
        role: ChatRole,
        text: string,
        imageUrl: string = '',
        isError: boolean = false,
    ): IMessage => ({
        role,
        parts: [{ text }],
        image: imageUrl,
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

            const history = messages.map(({ image, isError, ...msg }: IMessage) => msg);
            const formData = new FormData();

            if (uploadState.file) formData.append('file', uploadState.file);
            formData.append('referenceId', currentChatId || '');
            formData.append('prompt', input);
            formData.append('history', JSON.stringify(history));
            formData.append('imageUrl', uploadState.imageUrl || '');

            const res = await postRequest<ICreateChatResponse, FormData>('/chats', formData);

            if (res.success && res.data) {
                updateMessages(createChatMessage(ChatRole.MODEL, res.data.modelMessage));
                return res.data.referenceId;
            }
        } catch (error: any) {
            const errorMessage = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';
            if (currentChatId) {
                updateMessages(createChatMessage(ChatRole.MODEL, errorMessage, '', true));
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
        if (!input.trim() || uploadState.imageLoading || loading) return;

        const imageToDisplay = uploadState.imageUrl || uploadState.previewUrl || '';
        const newMessage = createChatMessage(ChatRole.USER, input, imageToDisplay);

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
