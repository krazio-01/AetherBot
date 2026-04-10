'use client';
import React, { ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Oval } from 'react-loader-spinner';
import { LuImagePlus } from 'react-icons/lu';
import { IoMdSend } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { useImageUpload, IUploadState } from '@/hooks/useImageUpload';
import { useChatSubmit } from '@/hooks/useChatInput';
import './footer.css';

const ImageAttachmentPreview = ({ uploadState, onCancel }: { uploadState: IUploadState; onCancel: () => void }) => {
    if (!uploadState.previewUrl) return null;

    return (
        <div>
            <div className="promptImg-container">
                <button
                    type="button"
                    onClick={onCancel}
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
    );
};

const Footer = () => {
    const { status } = useSession();
    const params = useParams();
    const chatId = params?.chatId as string | undefined;

    const { uploadState, handleImageChange, handleCancelImage, resetUploadState } = useImageUpload(
        status === 'unauthenticated',
    );
    const { textareaRef, adjustTextareaHeight, handleSubmit, handleKeyDown, input, setInput, loading } = useChatSubmit(
        chatId,
        uploadState,
        resetUploadState,
    );

    const isSubmitDisabled = loading || !input.trim() || uploadState.imageLoading;

    return (
        <div className="input-box">
            <form className="footer-input-form" onSubmit={handleSubmit}>
                <div className="prompt">
                    <ImageAttachmentPreview uploadState={uploadState} onCancel={handleCancelImage} />

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
                        disabled={isSubmitDisabled}
                        className={`send-btn ${isSubmitDisabled ? 'disabled' : ''}`}
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
