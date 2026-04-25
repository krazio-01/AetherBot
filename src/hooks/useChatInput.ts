import { useRef, KeyboardEvent, SyntheticEvent, useState } from 'react';
import { toast } from 'sonner';
import useAppStore from '@/store/store';
import { ChatRole, MediaType } from '@/types/chat';
import { IMessage } from '@/types';
import { IUploadState } from './useFileUpload';

const createChatMessage = (
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

const processStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, onChunk: (text: string) => void) => {
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            onChunk(fullText);
        }
    } catch (error) {
        console.error('Stream read error:', error);
        throw error;
    }

    return fullText;
};

const sortChatList = (currentChatId: string) => {
    if (currentChatId) {
        const state = useAppStore.getState();
        const chatIndex = state.chats.findIndex((c) => c.referenceId === currentChatId);

        if (chatIndex > 0) {
            const updatedChats = [...state.chats];
            const [chatToMove] = updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(chatToMove);
            state.setChats(updatedChats);
        }
    }
}

const useTextareaAutoResize = () => {
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
    const input = useAppStore((state) => state.input);
    const setInput = useAppStore((state) => state.setInput);
    const loading = useAppStore((state) => state.loading);
    const setLoading = useAppStore((state) => state.setLoading);
    const setCurrentChatId = useAppStore((state) => state.setCurrentChatId);
    const messages = useAppStore((state) => state.messages);
    const updateMessages = useAppStore((state) => state.updateMessages);
    const editMessage = useAppStore((state) => state.editMessage);

    const { textareaRef, adjustTextareaHeight } = useTextareaAutoResize();

    const [isGenerating, setIsGenerating] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const networkTextRef = useRef('');
    const uiTextRef = useRef('');
    const animationFrameRef = useRef(null);

    const startTypingAnimation = (modelMessageId: string) => {
        let lastDrawTime = performance.now();
        let fractionalChars = 0;
        const BASE_SPEED = 250;

        const updateUI = (currentTime: number) => {
            const networkText = networkTextRef.current;
            let uiText = uiTextRef.current;

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

                    uiTextRef.current = uiText;
                    editMessage(modelMessageId, {
                        parts: [{ text: uiText }],
                        isStreaming: true,
                    });
                }
            }

            animationFrameRef.current = requestAnimationFrame(updateUI);
        };

        animationFrameRef.current = requestAnimationFrame(updateUI);
    };

    const updateChat = async (currentChatId: string | undefined, newMessage: IMessage) => {
        updateMessages(newMessage);

        sortChatList(currentChatId);

        const modelMessageId = crypto.randomUUID();
        abortControllerRef.current = new AbortController();
        let toastId: string | number | undefined;

        try {
            setIsGenerating(true);
            setLoading(true);
            setInput('');
            resetUploadState();
            adjustTextareaHeight(true);

            const formData = buildFormData(currentChatId, input, isAuthenticated, messages, uploadState);

            const response = await fetch('/api/chats', {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current?.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Server responded with ${response.status}`);
            }
            if (!response.body) throw new Error('ReadableStream not supported in this browser.');

            const headerReferenceId = response.headers.get('x-reference-id');

            if (!currentChatId && headerReferenceId) window.history.replaceState(null, '', `/chat/${headerReferenceId}`);

            setCurrentChatId(headerReferenceId || currentChatId);

            updateMessages(createChatMessage(ChatRole.MODEL, '', undefined, false, modelMessageId, true));
            setLoading(false);

            networkTextRef.current = '';
            uiTextRef.current = '';

            startTypingAnimation(modelMessageId);

            const reader = response.body.getReader();
            const finalStreamedText = await processStream(reader, (newNetworkText) => {
                networkTextRef.current = newNetworkText;
            });

            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            editMessage(modelMessageId, {
                parts: [{ text: finalStreamedText }],
                isStreaming: false,
            });

            return headerReferenceId || currentChatId;
        } catch (error: any) {
            console.error('Stream error:', error);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

            if (error.name === 'AbortError') {
                editMessage(modelMessageId, {
                    parts: [{ text: uiTextRef.current }],
                    isStreaming: false,
                });
                return currentChatId;
            }

            const errorMessage = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';

            if (toastId) toast.error(errorMessage, { id: toastId });
            else toast.error(errorMessage);

            const hasModelMessage = useAppStore.getState().messages.some((msg) => msg.client_id === modelMessageId);

            if (hasModelMessage) {
                editMessage(modelMessageId, {
                    isError: true,
                    parts: [{ text: uiTextRef.current + `\n\n[Error: ${errorMessage}]` }],
                    isStreaming: false,
                });
            } else {
                updateMessages(
                    createChatMessage(
                        ChatRole.MODEL,
                        `System Error: ${errorMessage}. Please try again.`,
                        undefined,
                        true,
                        modelMessageId,
                        false,
                    ),
                );
            }

            return currentChatId;
        } finally {
            setLoading(false);
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const handleSubmit = async (e?: SyntheticEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
        if (e) e.preventDefault();
        if (!input.trim() || uploadState.loading || loading) return;

        const newMessage = createChatMessage(ChatRole.USER, input, uploadState.attachment || undefined);
        await updateChat(chatId, newMessage);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
    };

    return {
        textareaRef,
        adjustTextareaHeight,
        handleSubmit,
        handleKeyDown,
        stopGeneration,
        input,
        setInput,
        loading,
        isGenerating,
    };
};
