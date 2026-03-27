'use client';
import React, { useState, useRef, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import useAppStore from '@/store/store';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';
import { Oval } from 'react-loader-spinner';
import { LuImagePlus } from 'react-icons/lu';
import { IoMdSend } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { IMessage } from '@/types';
import './footer.css';

interface IUploadState {
    imageLoading: boolean;
    file: File | null;
    isImage: string | null;
    imageUrl: string;
    abortController: AbortController | null;
}

const Footer = () => {
    const input = useAppStore((state) => state.input);
    const setInput = useAppStore((state) => state.setInput);
    const loading = useAppStore((state) => state.loading);
    const setLoading = useAppStore((state) => state.setLoading);
    const setIsNewChat = useAppStore((state) => state.setIsNewChat);
    const messages = useAppStore((state) => state.messages);
    const updateMessages = useAppStore((state) => state.updateMessages);

    const [uploadState, setUploadState] = useState<IUploadState>({
        imageLoading: false,
        file: null,
        isImage: null,
        imageUrl: '',
        abortController: null,
    });

    const params = useParams();
    const chatId = params?.chatId as string | undefined;
    const router = useRouter();

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const createChatMessage = (
        role: 'user' | 'model',
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

        const imageUrl = URL.createObjectURL(file);
        setUploadState((prevState) => ({
            ...prevState,
            isImage: imageUrl,
            file: file,
        }));

        try {
            setUploadState((prevState) => ({
                ...prevState,
                imageLoading: true,
            }));

            const formData = new FormData();
            formData.append('file', file);

            const { data } = await axios.post('/api/upload/imgUpload', formData);
            setUploadState((prevState) => ({
                ...prevState,
                imageUrl: data.imgUrl,
            }));
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || 'Image upload failed');
            }
        } finally {
            if (e.target) e.target.value = '';
            setUploadState((prevState) => ({
                ...prevState,
                imageLoading: false,
            }));
        }
    };

    const handleCancelImage = async () => {
        if (uploadState.abortController) {
            uploadState.abortController.abort();

            try {
                await axios.delete('/api/upload/deleteImage', {
                    params: { imgUrl: uploadState.imageUrl },
                });
            } catch (error) {
                console.error('Failed to delete image on server', error);
            }
        }

        setUploadState({
            imageLoading: false,
            file: null,
            isImage: null,
            imageUrl: '',
            abortController: null,
        });
    };

    const updateChat = async (currentChatId: string | undefined, newMessage: IMessage) => {
        updateMessages(newMessage);

        try {
            setLoading(true);
            setInput('');
            setUploadState((prevState) => ({
                ...prevState,
                isImage: null,
            }));

            if (textareaRef.current) textareaRef.current.style.height = 'auto';

            const history = messages.map(({ image, isError, ...msg }: IMessage) => msg);

            const formData = new FormData();
            if (uploadState.file) formData.append('file', uploadState.file);


            formData.append('referenceId', currentChatId || '');
            formData.append('prompt', input);
            formData.append('history', JSON.stringify(history));
            formData.append('imageUrl', uploadState.imageUrl || '');

            const { data } = await axios.post('/api/chat/createChat', formData);
            const modelMessage = createChatMessage('model', data.modelMessage);
            updateMessages(modelMessage);

            setLoading(false);
            setUploadState((prevState) => ({
                ...prevState,
                file: null,
                imageUrl: '',
            }));
            return data.referenceId;
        } catch (error) {
            setLoading(false);
            const errorMessage =
                error instanceof AxiosError ? error.response?.data?.message : 'An unexpected error occurred.';

            const modelMessage = createChatMessage('model', errorMessage, '', true);
            updateMessages(modelMessage);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();

        if (!input.trim()) return;

        const newMessage = createChatMessage('user', input, uploadState.imageUrl);

        if (!chatId) {
            toast.promise(
                updateChat(chatId, newMessage).then((referenceId) => {
                    setIsNewChat(true);
                    if (referenceId !== undefined) {
                        router.push(`/chat/${referenceId}`);
                    }
                }),
                {
                    loading: 'Generating response...',
                    success: 'Conversation initialized!',
                    error: 'Error initializing conversation',
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
                    {uploadState.isImage && (
                        <div>
                            <div className="promptImg-container">
                                <button
                                    type="button"
                                    onClick={handleCancelImage}
                                    className={`prompt-cancel-btn ${uploadState.imageLoading ? 'loading' : ''}`}
                                >
                                    <RxCross2 />
                                </button>
                                <Image
                                    src={uploadState.isImage}
                                    className={`prompt-img ${uploadState.imageLoading ? 'loading' : ''}`}
                                    alt="prompt-image"
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
                            if (textareaRef.current) {
                                textareaRef.current.style.height = 'auto';
                                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        rows={1}
                    />
                </div>

                <div className="footer-input-actions">
                    <label htmlFor="image" className="image-label">
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
                    >
                        <IoMdSend />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Footer;
