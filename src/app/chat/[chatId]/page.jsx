"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import useAppStore from "@/store/store";
import Message from "@/components/layout/main/message/Message";
import { Oval } from "react-loader-spinner";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const ChatPage = ({ params }) => {
    const messages = useAppStore((state) => state.messages);
    const setMessages = useAppStore((state) => state.setMessages);
    const loading = useAppStore((state) => state.loading);
    const setIsNewChat = useAppStore((state) => state.setIsNewChat);

    const [fetchLoading, setFetchLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const router = useRouter();

    const { data: session } = useSession();
    const user = session?.user;

    const fetchMessages = async () => {
        try {
            setMessages([]);
            setFetchLoading(true);
            setIsNewChat(false);

            const { data } = await axios.post("/api/message/fetchMessages", {
                chatId: params.chatId,
            });
            setMessages(data.messages);
        } catch (error) {
            if (
                error.response?.status === 404 &&
                error.response?.data?.flag === "Not Found"
            ) {
                router.push("/chat");
                toast.error(error.response?.data?.message);
            }
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        if (params.chatId) {
            fetchMessages();
        }
    }, [params.chatId]);

    useLayoutEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="chatbox-main">
            {fetchLoading ? (
                <div className="loader">
                    <Oval
                        visible={true}
                        height="50"
                        width="50"
                        color="#7081fd"
                        secondaryColor="#7081fd"
                        ariaLabel="oval-loading"
                    />
                </div>
            ) : (
                <div className="chatbox-wrapper">
                    <div className="result-box">
                        <div className="boxi">
                            {messages.map((message, index) => (
                                <Message
                                    key={index}
                                    user={user}
                                    message={message}
                                    loading={
                                        loading && index === messages.length - 1
                                    }
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
