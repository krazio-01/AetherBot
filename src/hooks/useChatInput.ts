import { useRef, KeyboardEvent, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useAppStore from '@/store/store';
import { ChatRole, MediaType } from '@/types/chat';
import { IMessage } from '@/types';
import { IUploadState } from './useFileUpload';

export const createChatMessage = (
    role: ChatRole,
    text: string,
    attachment?: { url: string; type: MediaType; name: string },
    isError: boolean = false,
    clientId?: string,
    isStreaming: boolean = false,
): IMessage => ({
    client_id: clientId || crypto.randomUUID(),
    role,
    parts: [{ text }],
    attachment,
    isError,
    isStreaming,
});

const buildFormData = (
    currentChatId: string | undefined,
    input: string,
    isAuthenticated: boolean,
    messages: IMessage[],
    uploadState: IUploadState,
): FormData => {
    const formData = new FormData();
    formData.append('referenceId', currentChatId || '');
    formData.append('prompt', input);

    if (!isAuthenticated) {
        const history = messages.map(({ attachment, isError, ...msg }) => msg);
        formData.append('history', JSON.stringify(history));
    }

    if (uploadState.attachment) {
        const { file, url, type, name } = uploadState.attachment;
        formData.append('file', file);

        if (url.startsWith('http')) {
            formData.append('fileUrl', url);
            formData.append('fileType', type);
            formData.append('fileName', name);
        }
    }
    return formData;
};

const updateModelMessageInStore = (modelMessageId: string, uiText: string) => {
    useAppStore.setState((state) => {
        const updatedMessages = [...state.messages];
        const lastIndex = updatedMessages.length - 1;
        const lastMsg = updatedMessages[lastIndex];

        const index = updatedMessages.findIndex((msg) => msg.client_id === modelMessageId);

        if (index !== -1) {
            updatedMessages[index] = { ...updatedMessages[index], parts: [{ text: uiText }] };
            return { messages: updatedMessages };
        }

        if (lastMsg?.role === ChatRole.MODEL) {
            updatedMessages[lastIndex] = {
                ...lastMsg,
                parts: [{ text: uiText }],
                client_id: modelMessageId,
            };
            return { messages: updatedMessages };
        }

        return state;
    });
};

const processStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, modelMessageId: string) => {
    const decoder = new TextDecoder('utf-8');
    let networkText = '';
    let uiText = '';
    let isStreamDone = false;

    const readNetwork = async () => {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    isStreamDone = true;
                    break;
                }
                networkText += decoder.decode(value, { stream: true });
            }
        } catch (error) {
            isStreamDone = true;
            console.error('Stream read error:', error);
        }
    };

    readNetwork();

    return new Promise<string>((resolve) => {
        let lastDrawTime = performance.now();
        let lastReactUpdateTime = 0;
        let fractionalChars = 0;
        let animationFrameId: number;

        const BASE_SPEED = 250;

        const updateUI = (currentTime: number) => {
            const deltaTime = currentTime - lastDrawTime;
            lastDrawTime = currentTime;

            if (uiText.length < networkText.length) {
                const remainingChars = networkText.length - uiText.length;

                const speedMultiplier = Math.max(1, remainingChars / 40);
                const currentSpeed = BASE_SPEED * speedMultiplier;

                fractionalChars += (currentSpeed * deltaTime) / 1000;
                const charsToAdd = Math.floor(fractionalChars);

                if (charsToAdd > 0) {
                    const actualCharsToAdd = Math.min(charsToAdd, remainingChars);

                    uiText += networkText.substring(uiText.length, uiText.length + actualCharsToAdd);
                    fractionalChars -= actualCharsToAdd;

                    if (currentTime - lastReactUpdateTime > 35 || uiText.length === networkText.length) {
                        updateModelMessageInStore(modelMessageId, uiText);
                        lastReactUpdateTime = currentTime;
                    }
                }
            }

            if (!isStreamDone || uiText.length < networkText.length) {
                animationFrameId = requestAnimationFrame(updateUI);
            } else {
                updateModelMessageInStore(modelMessageId, uiText);
                resolve(networkText);
            }
        };

        animationFrameId = requestAnimationFrame(updateUI);
    });
};

export const useTextareaAutoResize = () => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustTextareaHeight = (reset: boolean = false) => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        if (!reset) {
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    return { textareaRef, adjustTextareaHeight };
};

export const useChatSubmit = (
    chatId: string | undefined,
    isAuthenticated: boolean,
    uploadState: IUploadState,
    resetUploadState: () => void,
) => {
    const router = useRouter();
    const { textareaRef, adjustTextareaHeight } = useTextareaAutoResize();
    const { input, setInput, loading, setLoading, setIsNewChat, messages, updateMessages } = useAppStore();

    const updateChat = async (currentChatId: string | undefined, newMessage: IMessage) => {
        const previousMessages = [...messages];
        updateMessages(newMessage);

        const modelMessageId = crypto.randomUUID();
        let finalStreamedText = '';

        let toastId: string | number | undefined;

        try {
            setLoading(true);
            setInput('');
            resetUploadState();
            adjustTextareaHeight(true);

            if (!currentChatId) toastId = toast.loading('Initializing chat...');

            const formData = buildFormData(currentChatId, input, isAuthenticated, messages, uploadState);

            const response = await fetch('/api/chats', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Server responded with ${response.status}`);
            }
            if (!response.body) throw new Error('ReadableStream not supported in this browser.');

            const headerReferenceId = response.headers.get('x-reference-id');

            if (!currentChatId && headerReferenceId) {
                setIsNewChat(true);
                router.push(`/chat/${headerReferenceId}`);
                if (toastId) toast.success('Conversation initialized!', { id: toastId });
            }

            updateMessages(createChatMessage(ChatRole.MODEL, '', undefined, false, modelMessageId, true));
            setLoading(false);

            const reader = response.body.getReader();
            finalStreamedText = await processStream(reader, modelMessageId);

            useAppStore.setState((state) => ({
                messages: state.messages.map((msg) =>
                    msg.client_id === modelMessageId ? { ...msg, isStreaming: false } : msg,
                ),
            }));

            return headerReferenceId || currentChatId;
        } catch (error: any) {
            console.error('Stream error:', error);
            const errorMessage = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';

            if (!currentChatId && toastId) toast.error(errorMessage, { id: toastId });

            if (currentChatId) {
                useAppStore.setState((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.client_id === modelMessageId
                            ? {
                                ...msg,
                                isError: true,
                                parts: [{ text: finalStreamedText + '\n\n[Error: Connection interrupted]' }],
                                isStreaming: false,
                            }
                            : msg,
                    ),
                }));
            } else {
                useAppStore.setState({ messages: previousMessages });
            }
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e?: SyntheticEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
        if (e) e.preventDefault();
        if (!input.trim() || uploadState.loading || loading) return;

        const newMessage = createChatMessage(ChatRole.USER, input, uploadState.attachment || undefined);

        // 5. Remove toast.promise, just await the function normally
        await updateChat(chatId, newMessage);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return {
        textareaRef,
        adjustTextareaHeight,
        handleSubmit,
        handleKeyDown,
        input,
        setInput,
        loading,
    };
};
