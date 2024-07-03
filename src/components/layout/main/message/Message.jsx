import React, { memo, useCallback } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import clipboardCopy from "clipboard-copy";
import { ThreeDots } from "react-loader-spinner";
import { toast } from "sonner";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { FaRegCopy } from "react-icons/fa6";
import { MdErrorOutline } from "react-icons/md";
import LogoImage from "../../../../../public/images/logo.png";
import FallbackImg from "../../../../../public/images/default.webp";
import "./message.css";

const Message = ({ user, message, loading }) => {
    const handleCopyClick = useCallback((content) => {
        clipboardCopy(content);
        toast("Code copied to clipboard!");
    }, []);

    if (loading) return <LoadingComponent user={user} message={message} />;

    return (
        <div className={`message-${message.role}`}>
            <Image
                src={
                    message.role === "user"
                        ? user?.avatar || FallbackImg
                        : LogoImage
                }
                alt={message.role}
                width={message.role === "user" ? 30 : 45}
                height={message.role === "user" ? 30 : 45}
            />
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
                        {message?.image && (
                            <img src={message.image} alt="image" />
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
            </div>
        </div>
    );
};

const MarkDownBlock = memo(function MarkdownComponent({ part, handleCopyClick, role }) {
    return role === "model" ? (
        <Markdown
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const content = String(children).replace(/\n$/, "");

                    return !inline && match ? (
                        <div className="code-block">
                            <div className="code-block-header">
                                <div>
                                    <span>{match[1]}</span>
                                </div>
                                <button
                                    className="copy-button"
                                    onClick={() => handleCopyClick(content)}
                                >
                                    <FaRegCopy />
                                </button>
                            </div>
                            <SyntaxHighlighter
                                style={atomOneDark}
                                language={match[1]}
                                PreTag="div"
                                showLineNumbers
                                lineNumberStyle={{
                                    minWidth: "2rem",
                                    paddingRight: "1rem",
                                    userSelect: "none",
                                }}
                                customStyle={{ padding: "1rem" }}
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
            }}
        >
            {part.text}
        </Markdown>
    ) : (
        <div>
            <p>{part.text}</p>
        </div>
    );
});

const LoadingComponent = ({ user, message }) => (
    <>
        <div className="message-user">
            <Image
                src={user?.avatar || FallbackImg}
                alt="User Avatar"
                width={30}
                height={30}
            />
            <div className="message-content">
                {message?.image && (
                    <img src={message.image} alt="Loading image" />
                )}
                {message.parts.map((part, index) => (
                    <p key={index}>{part.text}</p>
                ))}
            </div>
        </div>

        <div className="message-model">
            <Image src={LogoImage} alt="Logo" width={45} height={45} />
            <div className="response-loading">
                <ThreeDots
                    visible={true}
                    height="36"
                    width="36"
                    color="var(--blue)"
                    radius="9"
                />
            </div>
        </div>
    </>
);

export default memo(Message);
