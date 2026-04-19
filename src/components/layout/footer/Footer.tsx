'use client';
import React, { ChangeEvent, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Oval } from 'react-loader-spinner';
import { LuImagePlus, LuPaperclip, LuPlus } from 'react-icons/lu';
import { IoMdSend } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { useFileUpload, IUploadState } from '@/hooks/useFileUpload';
import { useChatSubmit } from '@/hooks/useChatInput';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { MediaType } from '@/types/chat';
import PdfBadge from '@/components/Ui/PdfBadge/PdfBadge';
import './footer.css';

const FileAttachmentPreview = ({ uploadState, onCancel }: { uploadState: IUploadState; onCancel: () => void }) => {
    const { attachment, loading } = uploadState;
    if (!attachment && !loading) return null;

    const statusClass = loading ? 'loading' : '';

    return (
        <div className="prompt-attachment-preview">
            <button
                type="button"
                onClick={onCancel}
                className={`prompt-cancel-btn ${statusClass}`}
                aria-label="Cancel upload"
            >
                <RxCross2 />
            </button>

            {attachment?.type === MediaType.IMAGE && attachment.url && (
                <Image
                    src={attachment.url}
                    className={`prompt-img ${statusClass}`}
                    alt="User prompt attachment"
                    width={75}
                    height={75}
                />
            )}

            {attachment?.type === MediaType.PDF && (
                <PdfBadge
                    name={attachment.name}
                    className={uploadState.loading ? 'loading' : ''}
                />
            )}

            {loading && (
                <div className="image-loader">
                    <Oval color="#7081fd" secondaryColor="#7081fd" height="28" width="28" strokeWidth={3} />
                </div>
            )}
        </div>
    );
};

const Footer = () => {
    const { isAuthenticated } = useAuth();
    const params = useParams();
    const chatId = params?.chatId as string | undefined;

    const { uploadState, handleFileChange, handleCancelFile, resetUploadState } = useFileUpload(isAuthenticated);
    const { textareaRef, adjustTextareaHeight, handleSubmit, handleKeyDown, input, setInput, loading } = useChatSubmit(
        chatId,
        isAuthenticated,
        uploadState,
        resetUploadState,
    );

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(menuRef, () => setIsMenuOpen(false));

    const UPLOAD_OPTIONS = [
        { id: 'image-upload', label: 'Upload Image', icon: <LuImagePlus />, accept: 'image/*', name: MediaType.IMAGE },
        { id: 'pdf-upload', label: 'Upload PDF', icon: <LuPaperclip />, accept: 'application/pdf', name: MediaType.PDF },
    ];

    const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e);
        setIsMenuOpen(false);
    };

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        adjustTextareaHeight();
    };

    const isSubmitDisabled = loading || !input.trim() || uploadState.loading;

    return (
        <div className="input-box">
            <form className="footer-input-form" onSubmit={handleSubmit}>
                <FileAttachmentPreview uploadState={uploadState} onCancel={handleCancelFile} />

                <div className="form-wrapper">
                    <div className="footer-actions-wrapper" ref={menuRef}>
                        <button
                            type="button"
                            className={`toggle-menu-btn ${isMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle attachment menu"
                            disabled={uploadState.loading}
                        >
                            <LuPlus />
                        </button>

                        {isMenuOpen && (
                            <div className="action-popout">
                                {UPLOAD_OPTIONS.map((option) => (
                                    <label key={option.id} htmlFor={option.id} className="action-list-item">
                                        {option.icon}
                                        <span>{option.label}</span>
                                        <input
                                            type="file"
                                            id={option.id}
                                            name={option.name}
                                            className="hidden-input"
                                            accept={option.accept}
                                            onChange={onFileSelect}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="prompt">
                        <textarea
                            ref={textareaRef}
                            placeholder="Ask me anything"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            rows={1}
                            aria-label="Chat input"
                        />
                    </div>

                    <div className="footer-input-actions">
                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className={`send-btn ${isSubmitDisabled ? 'disabled' : ''}`}
                            aria-label="Send message"
                        >
                            <IoMdSend />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Footer;
