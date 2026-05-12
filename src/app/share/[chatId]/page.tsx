'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { useRequest } from '@/hooks/useRequest';
import LottieAnimation from '@/components/Ui/LottieAnimation/LottieAnimation';
import { IFetchMessagesResponse } from '@/types/chat';
import { IMessage } from '@/types';
import Message from '@/components/layout/main/message/Message';
import ThemeToggle from '@/components/Ui/ThemeToggle/ThemeToggle';
import { IoCalendarOutline, IoLinkOutline } from 'react-icons/io5';
import '../share.css';

interface ISharedChatPageProps {
    params: { chatId: string };
}

interface IChatState {
    messages: IMessage[];
    title: string;
    date: string;
}

export default function SharedChatPage({ params: { chatId } }: ISharedChatPageProps) {
    const [chat, setChat] = useState<IChatState>({ messages: [], title: 'Shared Conversation', date: '' });
    const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    const { getRequest, cancel } = useRequest();

    const fetchAllMessages = useCallback(async () => {
        try {
            const res = await getRequest<IFetchMessagesResponse & { chatTitle?: string; createdAt?: string }>(
                `/interactions?chatId=${chatId}&isShared=true`,
            );

            if (res.success && res.data) {
                const newMessages = res.data.messages.map((msg) => ({
                    ...msg,
                    client_id: msg.client_id || crypto.randomUUID(),
                }));

                const formattedDate = res.data.createdAt
                    ? new Date(res.data.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    })
                    : 'Unknown Date';

                setChat({
                    messages: newMessages,
                    title: res.data.chatTitle || 'Shared Conversation',
                    date: formattedDate,
                });
                setStatus('idle');
            }
        } catch (err: any) {
            if (axios.isCancel(err) || err.name === 'AbortError') return;

            setStatus('error');
            setErrorMsg(typeof err === 'string' ? err : 'Chat not found or unauthorized');
            toast.error('Failed to load shared conversation.');
        }
    }, [chatId, getRequest]);

    useEffect(() => {
        if (chatId) fetchAllMessages();
        return () => cancel();
    }, [chatId, fetchAllMessages, cancel]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    if (status === 'loading') {
        return (
            <div className="share-fullscreen-state">
                <Oval visible={true} height="50" width="50" color="var(--blue)" secondaryColor="var(--border-glass)" />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="share-fullscreen-state error-state">
                <div className="error-visual">
                    <LottieAnimation path="/animations/noChatFound.lottie" maxWidth="100%" />
                </div>
                <h2>We couldn&apos;t load this chat</h2>
                <p>{errorMsg}</p>
                <Link href="/" className="fallback-home-btn">
                    Return home
                </Link>
            </div>
        );
    }

    return (
        <div className="share-layout">
            <header className="share-navbar">
                <a href="/" className="brand-logo">
                    AetherBot
                </a>
                <div className="navbar-actions">
                    <ThemeToggle alwaysShow={true} />
                </div>
            </header>

            <main className="share-main">
                <div className="share-content-wrapper">
                    <div className="share-hero">
                        <h1 className="hero-title">{chat.title}</h1>

                        <div className="hero-meta-row">
                            {chat.date && (
                                <div className="meta-item">
                                    <IoCalendarOutline />
                                    <span>{chat.date}</span>
                                </div>
                            )}

                            <span className="meta-dot">•</span>

                            <button className="meta-copy-btn" onClick={copyToClipboard}>
                                <IoLinkOutline />
                                <span>Copy Link</span>
                            </button>
                        </div>
                    </div>

                    <div className="share-feed">
                        {chat.messages.map((msg, index) => (
                            <Message
                                key={msg.client_id || index}
                                message={msg}
                                isLastMessage={index === chat.messages.length - 1}
                                loading={false}
                                onStreamUpdate={() => { }}
                                editMessage={() => { }}
                            />
                        ))}

                        <div className="share-footer">
                            <span className="footer-divider-text">End of conversation</span>
                            <Link href="/chat" className="create-chat-cta">
                                Start a new chat
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
