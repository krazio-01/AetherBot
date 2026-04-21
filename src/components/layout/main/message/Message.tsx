import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import Markdown, { Components } from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import clipboardCopy from 'clipboard-copy';
import { ThreeDots } from 'react-loader-spinner';
import { toast } from 'sonner';
import { LuCopy, LuDownload } from 'react-icons/lu';
import { MdErrorOutline } from 'react-icons/md';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import LogoImage from '../../../../../public/images/logo.png';
import { ISessionUser, IMessage } from '@/types';
import { ChatRole, MediaType } from '@/types/chat';
import PlayAudioButton from './PlayAudioButton';
import UserAvatar from '@/components/Ui/UserAvatar/UserAvatar';
import PdfBadge from '@/components/Ui/PdfBadge/PdfBadge';
import './message.css';

interface IMessageProps {
    user?: ISessionUser | null;
    message: IMessage;
    loading?: boolean;
}

interface IMarkDownBlockProps {
    part: { text: string };
    handleCopyClick: (content: string) => void;
    role: ChatRole;
}

const cleanTextForSpeech = (text: string): string => {
    let clean = text;
    clean = clean.replace(/```[\s\S]*?```/g, '. ');
    clean = clean.replace(/`([^`]+)`/g, '$1');
    clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    clean = clean.replace(/https?:\/\/[^\s]+/g, 'this link');
    clean = clean.replace(/(\d+)-(\d+)/g, '$1 to $2');
    clean = clean.replace(/%/g, ' percent');
    clean = clean.replace(/°C/g, ' degrees Celsius');
    clean = clean.replace(/°F/g, ' degrees Fahrenheit');
    clean = clean.replace(/&/g, ' and ');
    clean = clean.replace(/\+/g, ' plus ');
    clean = clean.replace(/=/g, ' equals ');
    clean = clean.replace(/[*_~#|>]/g, '');
    clean = clean.replace(/[()]/g, ', ');
    clean = clean.replace(/[{}[\]]/g, '');
    clean = clean.replace(/,\s*,/g, ',');
    clean = clean.replace(/,\s*\./g, '.');
    clean = clean.replace(/\s{2,}/g, ' ');
    return clean.trim();
};

const CollapsibleText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsible, setIsCollapsible] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            const height = contentRef.current.scrollHeight;
            setContentHeight(height);
            if (height > 160) setIsCollapsible(true);
        }
    }, [text]);

    return (
        <div className="collapsible-container">
            <div
                className={`collapsible-text ${isCollapsible && !isExpanded ? 'collapsed' : 'expanded'}`}
                style={{ maxHeight: isExpanded ? `${contentHeight + 20}px` : undefined }}
            >
                <div className="collapsible-inner" ref={contentRef}>
                    <p>{text}</p>
                </div>
            </div>

            {isCollapsible && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="collapsible-btn">
                    {isExpanded ? (
                        <>
                            <IoIosArrowUp />
                            Show less
                        </>
                    ) : (
                        <>
                            <IoIosArrowDown />
                            Show more
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

const Message = ({ user, message, loading }: IMessageProps) => {
    const fullText = useMemo(() => {
        return message?.parts?.map((p) => p.text).join('\n') || '';
    }, [message?.parts]);

    const handleCopyClick = useCallback((content: string) => {
        clipboardCopy(content);
        toast('Code copied to clipboard!');
    }, []);

    const handleCopyFullMessage = useCallback(() => {
        clipboardCopy(fullText);
        toast('Response copied to clipboard!');
    }, [fullText]);

    const handleDownload = useCallback(() => {
        const blob = new Blob([fullText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aetherbot-response.md';
        a.click();
        URL.revokeObjectURL(url);
    }, [fullText]);

    return (
        <>
            <div className={`message-${message.role}`}>
                {message.role === ChatRole.USER ? (
                    <UserAvatar avatar={user?.avatar} size={30} />
                ) : (
                    <Image
                        src={LogoImage as StaticImageData}
                        alt="Model Avatar"
                        width={45}
                        height={45}
                        className="avatar-img"
                    />
                )}

                <div className="message-content">
                    {message?.isError ? (
                        message.parts.map((part, index) => (
                            <div className="response-error" key={index}>
                                <MdErrorOutline />
                                <span>{part.text}</span>
                            </div>
                        ))
                    ) : (
                        <>
                            {message?.attachment && (
                                <div className="message-attachment-container">
                                    {message.attachment.type === MediaType.IMAGE ? (
                                        <img
                                            src={message.attachment.url}
                                            alt={message.attachment.name || 'Uploaded image'}
                                            className="chat-attached-image"
                                        />
                                    ) : (
                                        <PdfBadge name={message.attachment.name} />
                                    )}
                                </div>
                            )}

                            {message.parts.map((part, index) => (
                                <MarkDownBlock
                                    key={index}
                                    part={part}
                                    handleCopyClick={handleCopyClick}
                                    role={message.role}
                                />
                            ))}
                        </>
                    )}

                    {message.role === ChatRole.MODEL && !loading && (
                        <div className="message-actions">
                            <button onClick={handleCopyFullMessage} title="Copy response">
                                <LuCopy />
                            </button>
                            <PlayAudioButton text={cleanTextForSpeech(fullText)} />
                            <button onClick={handleDownload} title="Download response">
                                <LuDownload />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading && message.role === ChatRole.USER && (
                <div className="message-model">
                    <Image
                        src={LogoImage as StaticImageData}
                        alt="Model Avatar"
                        width={45}
                        height={45}
                        className="avatar-img"
                    />
                    <div className="response-loading">
                        <ThreeDots visible={true} height="36" width="36" color="var(--blue)" radius="9" />
                    </div>
                </div>
            )}
        </>
    );
};

const getMarkdownComponents = (handleCopyClick: (content: string) => void): Components => ({
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const content = String(children).replace(/\n$/, '');

        return !inline && match ? (
            <div className="code-block">
                <div className="code-block-header">
                    <div>
                        <span>{match[1]}</span>
                    </div>
                    <button className="copy-button" onClick={() => handleCopyClick(content)}>
                        <LuCopy />
                    </button>
                </div>
                <SyntaxHighlighter
                    style={atomOneDark}
                    language={match[1]}
                    PreTag="div"
                    showLineNumbers
                    lineNumberStyle={{
                        minWidth: '2rem',
                        paddingRight: '1rem',
                        userSelect: 'none',
                    }}
                    customStyle={{ padding: '1rem' }}
                    {...props}
                >
                    {content}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className={className} {...props}>
                {children}
            </code>
        );
    },
});

const MarkDownBlock = memo(function MarkdownComponent({ part, handleCopyClick, role }: IMarkDownBlockProps) {
    const markdownComponents = useMemo(() => getMarkdownComponents(handleCopyClick), [handleCopyClick]);

    return role === ChatRole.MODEL ? (
        <Markdown components={markdownComponents}>{part.text}</Markdown>
    ) : (
        <CollapsibleText text={part.text} />
    );
});

export default memo(Message);
