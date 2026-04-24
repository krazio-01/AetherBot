'use client';
import React, { ChangeEvent, useState, useRef, ClipboardEvent, useCallback, memo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Oval } from 'react-loader-spinner';
import { LuImagePlus, LuPaperclip, LuPlus, LuSquare } from 'react-icons/lu';
import { IoMdSend } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload, IUploadState } from '@/hooks/useFileUpload';
import { useChatSubmit } from '@/hooks/useChatInput';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { MediaType } from '@/types/chat';
import PdfBadge from '@/components/Ui/PdfBadge/PdfBadge';
import './footer.css';

const UPLOAD_OPTIONS = [
    { id: 'image-upload', label: 'Upload Image', icon: <LuImagePlus />, accept: 'image/*', name: MediaType.IMAGE },
    { id: 'pdf-upload', label: 'Upload PDF', icon: <LuPaperclip />, accept: 'application/pdf', name: MediaType.PDF },
];

interface IFileAttachmentPreviewProps {
    uploadState: IUploadState;
    onCancel: () => void;
}

const FileAttachmentPreview = memo(({ uploadState, onCancel }: IFileAttachmentPreviewProps) => {
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
                <PdfBadge name={attachment.name} className={loading ? 'loading' : ''} />
            )}

            {loading && (
                <div className="image-loader">
                    <Oval color="#7081fd" secondaryColor="#7081fd" height="28" width="28" strokeWidth={3} />
                </div>
            )}
        </div>
    );
});

FileAttachmentPreview.displayName = 'FileAttachmentPreview';

const Footer = () => {
    const { isAuthenticated } = useAuth();
    const params = useParams();
    const chatId = params?.chatId as string | undefined;

    const { uploadState, handleFileChange, handleCancelFile, resetUploadState, processFile } =
        useFileUpload(isAuthenticated);

    const {
        textareaRef,
        adjustTextareaHeight,
        handleSubmit,
        handleKeyDown,
        input,
        setInput,
        loading,
        stopGeneration,
        isGenerating,
    } = useChatSubmit(chatId, isAuthenticated, uploadState, resetUploadState);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(menuRef, () => setIsMenuOpen(false));

    const onFileSelect = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            handleFileChange(e);
            setIsMenuOpen(false);
        },
        [handleFileChange],
    );

    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            setInput(e.target.value);
            adjustTextareaHeight();
        },
        [setInput, adjustTextareaHeight],
    );

    const handlePaste = useCallback(
        (e: ClipboardEvent<HTMLTextAreaElement>) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();
                    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
                        e.preventDefault();
                        processFile(file);
                        break;
                    }
                }
            }
        },
        [processFile],
    );

    return (
        <div className="input-box">
            <form className="footer-input-form" onSubmit={handleSubmit}>
                <FileAttachmentPreview uploadState={uploadState} onCancel={handleCancelFile} />

                <div className="form-wrapper">
                    <div className="footer-actions-wrapper" ref={menuRef}>
                        <button
                            type="button"
                            className={`toggle-menu-btn ${isMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen((prev) => !prev)}
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
                            onPaste={handlePaste}
                            disabled={loading}
                            rows={1}
                            aria-label="Chat input"
                        />
                    </div>

                    <div className="footer-input-actions">
                        {isGenerating ? (
                            <button
                                type="button"
                                onClick={stopGeneration}
                                className="send-btn"
                                aria-label="Stop generation"
                                title="Stop generation"
                            >
                                <LuSquare />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={!input.trim() || uploadState.loading}
                                className="send-btn"
                                aria-label="Send message"
                            >
                                <IoMdSend />
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Footer;
