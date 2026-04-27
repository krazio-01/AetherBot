import { useRef, useState, useEffect, useCallback, KeyboardEvent, SyntheticEvent } from 'react';
import { toast } from 'sonner';
import useAppStore from '@/store/store';
import { ChatRole, MediaType } from '@/types/chat';
import { IMessage } from '@/types';
import { IUploadState } from './useFileUpload';

const TYPING_BASE_SPEED = 250;
const TYPING_BACKLOG_DIVISOR = 44;

const createChatMessage = (
    role: ChatRole,
    text: string,
    attachment?: { url: string; type: MediaType; name: string },
    isError = false,
    clientId?: string,
    isStreaming = false,
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
        const history = messages.map(({ role, parts }) => ({ role, parts }));
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

const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (text: string) => void,
    signal: AbortSignal,
) => {
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    try {
        while (true) {
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            const { done, value } = await reader.read();
            if (done) {
                const tail = decoder.decode();
                if (tail) {
                    fullText += tail;
                    onChunk(fullText);
                }
                break;
            }
            fullText += decoder.decode(value, { stream: true });
            onChunk(fullText);
        }
    } finally {
        try {
            reader.releaseLock();
        } catch { }
    }
    return fullText;
};

const sortChatToTop = (currentChatId: string | undefined) => {
    if (!currentChatId) return;
    const state = useAppStore.getState();
    const idx = state.chats.findIndex((c) => c.referenceId === currentChatId);
    if (idx > 0) {
        const next = [...state.chats];
        const [chat] = next.splice(idx, 1);
        next.unshift(chat);
        state.setChats(next);
    }
};

const useTextareaAutoResize = () => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const adjustTextareaHeight = useCallback((reset = false) => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        if (!reset) el.style.height = `${el.scrollHeight}px`;
    }, []);
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
    const updateMessages = useAppStore((state) => state.updateMessages);
    const editMessage = useAppStore((state) => state.editMessage);

    const { textareaRef, adjustTextareaHeight } = useTextareaAutoResize();
    const [isGenerating, setIsGenerating] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const networkTextRef = useRef('');
    const uiTextRef = useRef('');
    const animationFrameRef = useRef<number | null>(null);
    const streamDoneRef = useRef(false);
    const uploadStateRef = useRef(uploadState);
    const resetUploadStateRef = useRef(resetUploadState);
    const chatIdRef = useRef(chatId);

    useEffect(() => {
        uploadStateRef.current = uploadState;
    }, [uploadState]);

    useEffect(() => {
        resetUploadStateRef.current = resetUploadState;
    }, [resetUploadState]);

    useEffect(() => {
        chatIdRef.current = chatId;
    }, [chatId]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
            abortControllerRef.current?.abort();
        };
    }, []);

    const startTypingAnimation = useCallback(
        (modelMessageId: string) => {
            let lastDrawTime = performance.now();
            let fractionalChars = 0;

            const tick = (now: number) => {
                const networkText = networkTextRef.current;
                let uiText = uiTextRef.current;
                const dt = now - lastDrawTime;
                lastDrawTime = now;

                if (uiText.length < networkText.length) {
                    const remaining = networkText.length - uiText.length;
                    const speedMul = Math.max(1, remaining / TYPING_BACKLOG_DIVISOR);
                    fractionalChars += (TYPING_BASE_SPEED * speedMul * dt) / 1000;
                    const charsToAdd = Math.min(Math.floor(fractionalChars), remaining);

                    if (charsToAdd > 0) {
                        uiText = networkText.slice(0, uiText.length + charsToAdd);
                        fractionalChars -= charsToAdd;
                        uiTextRef.current = uiText;
                        editMessage(modelMessageId, {
                            parts: [{ text: uiText }],
                            isStreaming: true,
                        });
                    }
                } else if (streamDoneRef.current) {
                    editMessage(modelMessageId, {
                        parts: [{ text: uiText }],
                        isStreaming: false,
                    });
                    animationFrameRef.current = null;
                    return;
                }

                animationFrameRef.current = requestAnimationFrame(tick);
            };

            animationFrameRef.current = requestAnimationFrame(tick);
        },
        [editMessage],
    );

    const stopGeneration = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    const updateChat = useCallback(
        async (currentChatId: string | undefined, newMessage: IMessage, currentInput: string) => {
            updateMessages(newMessage);
            sortChatToTop(currentChatId);

            const modelMessageId = crypto.randomUUID();
            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            networkTextRef.current = '';
            uiTextRef.current = '';
            streamDoneRef.current = false;

            try {
                setIsGenerating(true);
                setLoading(true);
                setInput('');
                resetUploadStateRef.current();
                adjustTextareaHeight(true);

                const currentMessages = useAppStore.getState().messages;
                const formData = buildFormData(
                    currentChatId,
                    currentInput,
                    isAuthenticated,
                    currentMessages,
                    uploadStateRef.current,
                );

                const response = await fetch('/api/chats', { method: 'POST', body: formData, signal });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || `Server responded with ${response.status}`);
                }
                if (!response.body) throw new Error('ReadableStream not supported in this browser.');

                const headerReferenceId = response.headers.get('x-reference-id');
                if (!currentChatId && headerReferenceId)
                    window.history.replaceState(null, '', `/chat/${headerReferenceId}`);

                setCurrentChatId(headerReferenceId || currentChatId);

                updateMessages(createChatMessage(ChatRole.MODEL, '', undefined, false, modelMessageId, true));
                setLoading(false);

                startTypingAnimation(modelMessageId);

                const reader = response.body.getReader();
                await processStream(
                    reader,
                    (txt) => {
                        networkTextRef.current = txt;
                    },
                    signal,
                );

                streamDoneRef.current = true;

                return headerReferenceId || currentChatId;
            } catch (error: any) {
                console.error('Stream error:', error);

                if (animationFrameRef.current !== null) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }

                if (error?.name === 'AbortError') {
                    editMessage(modelMessageId, {
                        parts: [{ text: uiTextRef.current }],
                        isStreaming: false,
                    });
                    return currentChatId;
                }

                const errorMessage =
                    typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';

                const hasModelMessage = useAppStore.getState().messages.some((m) => m.client_id === modelMessageId);

                if (hasModelMessage) {
                    editMessage(modelMessageId, {
                        isError: true,
                        parts: [{ text: `${uiTextRef.current}\n\n[Error: ${errorMessage}]` }],
                        isStreaming: false,
                    });
                } else {
                    updateMessages(
                        createChatMessage(
                            ChatRole.MODEL,
                            errorMessage,
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
        },
        [
            isAuthenticated,
            adjustTextareaHeight,
            setInput,
            setLoading,
            setCurrentChatId,
            updateMessages,
            editMessage,
            startTypingAnimation,
        ],
    );

    const handleSubmit = useCallback(
        async (e?: SyntheticEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
            e?.preventDefault();
            const { input: currentInput, loading: currentLoading } = useAppStore.getState();
            if (!currentInput.trim() || uploadStateRef.current.loading || currentLoading) return;

            const newMessage = createChatMessage(
                ChatRole.USER,
                currentInput,
                uploadStateRef.current.attachment || undefined,
            );
            await updateChat(chatIdRef.current, newMessage, currentInput);
        },
        [updateChat],
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit],
    );

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
