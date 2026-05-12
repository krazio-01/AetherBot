'use client';
import React, { useCallback, memo, useEffect, useState } from 'react';
import { RxCross2 } from 'react-icons/rx';
import { LuCopy } from 'react-icons/lu';
import { FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { useRequest } from '@/hooks/useRequest';
import './shareModal.css';

interface IShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatId: string;
    shareUrl: string;
    chatTitle: string;
}

const ShareModal = ({ isOpen, onClose, chatId, shareUrl, chatTitle }: IShareModalProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { postRequest } = useRequest();

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(`Check out this conversation I had with AetherBot: ${chatTitle}`);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const generateLink = async () => {
            setIsGenerating(true);
            try {
                await postRequest(`/chats/${chatId}/share`);
            } catch (error: any) {
                if (isMounted) toast.error('Failed to generate share link.');
            } finally {
                if (isMounted) setIsGenerating(false);
            }
        };

        generateLink();

        return () => {
            isMounted = false;
        };
    }, [isOpen, chatId, postRequest]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy link.');
        }
    }, [shareUrl]);

    if (!isOpen) return null;

    const SOCIAL_LINKS = [
        {
            id: 'twitter',
            name: 'Post to X',
            icon: <FaXTwitter color="var(--text-clr)" />,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        },
        {
            id: 'linkedin',
            name: 'Share on LinkedIn',
            icon: <FaLinkedin color="#0A66C2" />,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        },
    ];

    return (
        <div className="modal-overlay share-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <div className="header-text">
                        <h2>Share Chat</h2>
                        <p>Create a public link to share this conversation.</p>
                    </div>
                    <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
                        <RxCross2 />
                    </button>
                </div>

                {isGenerating ? (
                    <div className="share-loading-state">
                        <Oval visible={true} height="40" width="40" color="var(--blue)" secondaryColor="var(--border-glass)" />
                        <p>Getting your link ready...</p>
                    </div>
                ) : (
                    <div className="fade-in share-body">
                        <div className="link-section">
                            <div className="input-group">
                                <input type="text" readOnly value={shareUrl} className="share-url-input" />
                                <button type="button" className="copy-link-btn" onClick={handleCopy}>
                                    <LuCopy />
                                    <span>Copy</span>
                                </button>
                            </div>
                        </div>

                        <div className="social-grid">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.id}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-card"
                                >
                                    <span className="social-icon">{social.icon}</span>
                                    <span className="social-name">{social.name}</span>
                                </a>
                            ))}
                        </div>

                        <div className="info-card">
                            <IoInformationCircleOutline />
                            <p>
                                Anyone with the link can view this chat. Share responsibly. If sharing with third-party platforms, their respective privacy policies apply.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(ShareModal);
