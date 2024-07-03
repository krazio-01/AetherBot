"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import Menu from "@/components/menu/Menu";
import { MdChatBubbleOutline, MdDelete } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { toast } from "sonner";
import "./chats.css";

const Chats = ({ chat, removeChat, params }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const dotsRef = useRef(null);
    const router = useRouter();

    const toggleMenu = (e) => {
        e.preventDefault();
        const rect = dotsRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom, left: rect.right });
        setIsMenuOpen((prev) => !prev);
    };

    const deleteChat = async () => {
        try {
            const { data } = await axios.delete("/api/chat/deleteChat", {
                params: {
                    chatId: chat.referenceId,
                },
            });

            removeChat(chat.referenceId);
            return data.message;
        } catch (error) {
            throw error.response.data.message;
        }
    };

    const handleDelete = (e) => {
        e.preventDefault();

        setIsMenuOpen(false);

        toast.promise(
            deleteChat().then((message) => {
                router.push("/chat");
                return message;
            }),
            {
                loading: "Deleting...",
                success: (message) => message,
                error: (message) => message,
            }
        );
    };

    const menuItems = [
        {
            icon: <MdDelete />,
            content: <button>Delete</button>,
            onClick: handleDelete,
        },
        {
            icon: <FaRegShareFromSquare />,
            content: <button>Share</button>,
        },
    ];

    return (
        <li className={`history-item ${isMenuOpen ? "menu-open" : ""}`}>
            <Link
                href={`/chat/${chat.referenceId}`}
                className={`history-link ${
                    params.chatId === chat.referenceId ? "active" : ""
                }`}
            >
                <div className="chat-title">
                    <MdChatBubbleOutline />
                    <span>{chat.title}</span>
                </div>
                <div id="three-dots" onClick={toggleMenu} ref={dotsRef}>
                    <BsThreeDotsVertical />
                </div>
            </Link>
            {isMenuOpen && (
                <Menu
                    position={menuPosition}
                    onClose={() => setIsMenuOpen(false)}
                    items={menuItems}
                />
            )}
        </li>
    );
};

export default Chats;
