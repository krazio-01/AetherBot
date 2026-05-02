import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import Markdown, { Components } from 'react-markdown';
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
import remarkGfm from 'remark-gfm';
import DataVisualizer from '@/components/InteractiveWidgets/DataVisualizer';
import InteractiveCodeBlock from '@/components/InteractiveWidgets/InteractiveCodeBlock';
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
    message: IMessage;
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

const MARKDOWN_PLUGINS = [remarkGfm];

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

const ChartBlockWrapper = memo(
    ({ content, handleCopyClick, isStreaming }: { content: string; handleCopyClick: (content: string) => void, isStreaming: boolean }) => {
        const chartConfig = useMemo(() => {
            const trimmedContent = content.trim();

            if (!trimmedContent.startsWith('[') || !trimmedContent.endsWith(']')) return null;

            try {
                const parsedContent = JSON.parse(trimmedContent);

                if (Array.isArray(parsedContent) && parsedContent.length > 0 && typeof parsedContent[0] === 'object') {
                    const keys = Object.keys(parsedContent[0]);
                    if (keys.length > 0) {
                        const xAxisKey = keys[0];
                        const dataKeys = keys.slice(1);
                        const normalizedData = parsedContent.map((item: any) => ({
                            ...item,
                            name: String(item[xAxisKey]),
                        }));

                        return { data: normalizedData, dataKeys };
                    }
                }
            } catch (e) {
                return null;
            }
            return null;
        }, [content]);

        if (!chartConfig)
            return <InteractiveCodeBlock content={content} language="json" handleCopyClick={handleCopyClick} isStreaming={isStreaming} />;

        return <DataVisualizer data={chartConfig.data} dataKeys={chartConfig.dataKeys} />;
    },
);

ChartBlockWrapper.displayName = 'ChartBlockWrapper';

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
                                        /* eslint-disable-next-line @next/next/no-img-element */
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
                                    message={message}
                                />
                            ))}
                        </>
                    )}

                    {message.role === ChatRole.MODEL && !loading && !message.isStreaming && !message.isError && (
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

export const getMarkdownComponents = (
    handleCopyClick: (content: string) => void,
    isStreaming: boolean,
): Components => ({
    code({ node, inline, className, children, ...props }: any) {
        if (inline)
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );

        const match = /language-([\w-]+)/.exec(className || '');
        const language = match ? match[1] : '';
        const content = String(children).replace(/\n$/, '');

        switch (language) {
            case 'error':
                return (
                    <div className="response-error" style={{ marginTop: '0.5rem' }}>
                        <MdErrorOutline />
                        <span style={{ fontFamily: 'system-ui' }}>{content}</span>
                    </div>
                );

            case 'aether-chart':
                return <ChartBlockWrapper content={content} handleCopyClick={handleCopyClick} isStreaming={isStreaming} />;

            case '':
                return (
                    <code className={className} {...props}>
                        {content}
                    </code>
                );

            default:
                return (
                    <InteractiveCodeBlock
                        content={content}
                        language={language}
                        handleCopyClick={handleCopyClick}
                        isStreaming={isStreaming}
                    />
                );
        }
    },
});

const MarkDownBlock = memo(function MarkdownComponent({ part, handleCopyClick, role, message }: IMarkDownBlockProps) {
    const markdownComponents = useMemo(
        () => getMarkdownComponents(handleCopyClick, message.isStreaming),
        [handleCopyClick, message.isStreaming],
    );

    return role === ChatRole.MODEL ? (
        <Markdown remarkPlugins={MARKDOWN_PLUGINS} components={markdownComponents}>
            {part.text}
        </Markdown>
    ) : (
        <CollapsibleText text={part.text} />
    );
});

export default memo(Message);
