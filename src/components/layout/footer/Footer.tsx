'use client';
import React, { useState, useRef, useEffect, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import useAppStore from '@/store/store';
import { toast } from 'sonner';
import { Oval } from 'react-loader-spinner';
import { LuImagePlus } from 'react-icons/lu';
import { IoMdSend } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { IMessage } from '@/types';
import { useRequest } from '@/hooks/useRequest';
import { ChatRole, ICreateChatResponse, IUploadImageResponse } from '@/types/chat';
import { useSession } from 'next-auth/react';
import './footer.css';

interface IUploadState {
    imageLoading: boolean;
    file: File | null;
    previewUrl: string | null;
    imageUrl: string;
}

const Footer = () => {
    const { status } = useSession();
    const isGuest = status === 'unauthenticated';

    const input = useAppStore((state) => state.input);
    const setInput = useAppStore((state) => state.setInput);
    const loading = useAppStore((state) => state.loading);
    const setLoading = useAppStore((state) => state.setLoading);
    const setIsNewChat = useAppStore((state) => state.setIsNewChat);
    const messages = useAppStore((state) => state.messages);
    const updateMessages = useAppStore((state) => state.updateMessages);

    const { postRequest: uploadImgReq, deleteRequest: deleteImgReq, cancel: cancelUpload } = useRequest();
    const { postRequest: chatReq } = useRequest();

    const [uploadState, setUploadState] = useState<IUploadState>({
        imageLoading: false,
        file: null,
        previewUrl: null,
        imageUrl: '',
    });

    const params = useParams();
    const chatId = params?.chatId as string | undefined;
    const router = useRouter();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        return () => {
            if (uploadState.previewUrl) URL.revokeObjectURL(uploadState.previewUrl);
        };
    }, [uploadState.previewUrl]);

    const adjustTextareaHeight = (reset: boolean = false) => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        if (!reset) {
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
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

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (uploadState.previewUrl) URL.revokeObjectURL(uploadState.previewUrl);

        const localImageUrl = URL.createObjectURL(file);

        setUploadState((prev) => ({
            ...prev,
            previewUrl: localImageUrl,
            file: file,
            imageLoading: !isGuest,
        }));

        if (isGuest) {
            e.target.value = '';
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await uploadImgReq<IUploadImageResponse, FormData>('/images', formData);

            if (res.success && res.data) {
                setUploadState((prev) => ({
                    ...prev,
                    imageUrl: res.data!.imgUrl,
                }));
            }
        } catch (error: unknown) {
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('canceled'))) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : 'Image upload failed';
            toast.error(typeof error === 'string' ? error : errorMessage);
        } finally {
            e.target.value = '';
            setUploadState((prev) => ({ ...prev, imageLoading: false }));
        }
    };

    const handleCancelImage = () => {
        cancelUpload();
        const urlToDelete = uploadState.imageUrl;

        if (uploadState.previewUrl) URL.revokeObjectURL(uploadState.previewUrl);

        setUploadState({
            imageLoading: false,
            file: null,
            previewUrl: null,
            imageUrl: '',
        });

        if (urlToDelete) {
            deleteImgReq<void>('/images', {
                params: { imgUrl: urlToDelete },
            }).catch((error) => {
                console.error('Failed to delete image on server', error);
            });
        }
    };

    const updateChat = async (currentChatId: string | undefined, newMessage: IMessage) => {
        updateMessages(newMessage);

        try {
            setLoading(true);
            setInput('');
            setUploadState((prev) => ({ ...prev, previewUrl: null }));
            adjustTextareaHeight(true);

            const history = messages.map(({ image, isError, ...msg }: IMessage) => msg);
            const formData = new FormData();

            if (uploadState.file) formData.append('file', uploadState.file);
            formData.append('referenceId', currentChatId || '');
            formData.append('prompt', input);
            formData.append('history', JSON.stringify(history));
            formData.append('imageUrl', uploadState.imageUrl || '');

            const res = await chatReq<ICreateChatResponse, FormData>('/chats', formData);

            if (res.success && res.data) {
                const modelMessage = createChatMessage(ChatRole.MODEL, res.data.modelMessage);
                updateMessages(modelMessage);

                setUploadState((prev) => ({
                    ...prev,
                    file: null,
                    imageUrl: '',
                }));

                return res.data.referenceId;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            const modelMessage = createChatMessage(ChatRole.MODEL, errorMessage, '', true);
            updateMessages(modelMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

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
            if (!uploadState.imageLoading) handleSubmit(e);
        }
    };

    return (
        <div className="input-box">
            <form className="footer-input-form" onSubmit={handleSubmit}>
                <div className="prompt">
                    {uploadState.previewUrl && (
                        <div>
                            <div className="promptImg-container">
                                <button
                                    type="button"
                                    onClick={handleCancelImage}
                                    className={`prompt-cancel-btn ${uploadState.imageLoading ? 'loading' : ''}`}
                                    aria-label="Cancel image upload"
                                >
                                    <RxCross2 />
                                </button>
                                <Image
                                    src={uploadState.previewUrl}
                                    className={`prompt-img ${uploadState.imageLoading ? 'loading' : ''}`}
                                    alt="User prompt attachment"
                                    width={75}
                                    height={75}
                                />
                                {uploadState.imageLoading && (
                                    <div className="image-loader">
                                        <Oval color="#7081fd" secondaryColor="#7081fd" height="32" width="32" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        placeholder="Ask me anything"
                        value={input}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                            setInput(e.target.value);
                            adjustTextareaHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        rows={1}
                        aria-label="Chat input"
                    />
                </div>

                <div className="footer-input-actions">
                    <label htmlFor="image" className="image-label" aria-label="Upload image">
                        <LuImagePlus />
                    </label>
                    <input
                        type="file"
                        style={{ display: 'none' }}
                        name="image"
                        id="image"
                        onChange={handleImageChange}
                        accept="image/*"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim() || uploadState.imageLoading}
                        className={`send-btn ${loading || !input.trim() || uploadState.imageLoading ? 'disabled' : ''}`}
                        aria-label="Send message"
                    >
                        <IoMdSend />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Footer;
