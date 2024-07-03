"use client";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAppStore from "@/store/store";
import { toast } from "sonner";
import axios from "axios";
import { Oval } from "react-loader-spinner";
import { LuImagePlus } from "react-icons/lu";
import { IoMdSend } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import "./footer.css";

const Footer = () => {
    const input = useAppStore((state) => state.input);
    const setInput = useAppStore((state) => state.setInput);
    const loading = useAppStore((state) => state.loading);
    const setLoading = useAppStore((state) => state.setLoading);
    const setIsNewChat = useAppStore((state) => state.setIsNewChat);
    const messages = useAppStore((state) => state.messages);
    const updateMessages = useAppStore((state) => state.updateMessages);

    const [uploadState, setUploadState] = useState({
        imageLoading: false,
        file: null,
        isImage: null,
        imageUrl: "",
    });

    const { chatId } = useParams();
    const router = useRouter();

    const textareaRef = useRef(null);

    const createChatMessage = (role, text, imageUrl = "", isError = false) => ({
        role,
        parts: [{ text }],
        image: imageUrl,
        isError,
    });

    const handleImageChange = async (e) => {
        const File = e.target.files[0];

        if (!File) return;

        const imageUrl = URL.createObjectURL(File);
        setUploadState((prevState) => ({
            ...prevState,
            isImage: imageUrl,
            file: File,
        }));

        try {
            setUploadState((prevState) => ({
                ...prevState,
                imageLoading: true,
            }));

            const formData = new FormData();
            formData.append("file", File);

            const { data } = await axios.post(
                "/api/upload/imgUpload",
                formData
            );
            setUploadState((prevState) => ({
                ...prevState,
                imageUrl: data.imgUrl,
            }));
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            e.target.value = "";
            setUploadState((prevState) => ({
                ...prevState,
                imageLoading: false,
            }));
        }
    };

    const handleCancelImage = async () => {
        if (uploadState.uploadAbortController) {
            uploadState.uploadAbortController.abort();

            await axios.delete("/api/upload/deleteImage", {
                params: { imgUrl: uploadState.imageUrl },
            });
        }
        // Reset upload state
        setUploadState({
            imageLoading: false,
            file: null,
            isImage: null,
            imageUrl: "",
            abortController: null,
        });
    };

    const updateChat = async (chatId, newMessage) => {
        updateMessages(newMessage);

        try {
            setLoading(true);
            setInput("");
            setUploadState((prevState) => ({
                ...prevState,
                isImage: null,
            }));
            textareaRef.current.style.height = "auto";

            const history = messages.map(({ image, isError, ...msg }) => msg);

            const formData = new FormData();
            formData.append("file", uploadState.file);
            formData.append("referenceId", chatId || "");
            formData.append("prompt", input);
            formData.append("history", JSON.stringify(history));
            formData.append("imageUrl", uploadState.imageUrl || "");

            const { data } = await axios.post("/api/chat/createChat", formData);
            const modelMessage = createChatMessage("model", data.modelMessage);
            updateMessages(modelMessage);

            setLoading(false);
            setUploadState((prevState) => ({
                ...prevState,
                file: null,
                imageUrl: "",
            }));
            return data.referenceId;
        } catch (error) {
            setLoading(false);
            const modelMessage = createChatMessage(
                "model",
                error.response?.data?.message,
                null,
                true
            );
            updateMessages(modelMessage);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.trim()) return;

        const newMessage = createChatMessage(
            "user",
            input,
            uploadState.imageUrl
        );

        if (!chatId) {
            toast.promise(
                updateChat(chatId, newMessage).then((referenceId) => {
                    setIsNewChat(true);
                    if (referenceId !== undefined)
                        router.push(`/chat/${referenceId}`);
                }),
                {
                    loading: "Generating response...",
                    success: "Conversation initialized!",
                    error: "Error initializing conversation",
                }
            );
        } else {
            await updateChat(chatId, newMessage);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!uploadState.imageLoading) handleSubmit(e);
        }
    };

    return (
        <div className="input-box">
            <form className="footer-input-form" onSubmit={handleSubmit}>
                <div className="prompt">
                    {uploadState.isImage && (
                        <div>
                            <div className="promptImg-container">
                                <button
                                    onClick={handleCancelImage}
                                    className={`prompt-cancel-btn ${
                                        uploadState.imageLoading && "loading"
                                    }`}
                                >
                                    <RxCross2 />
                                </button>
                                <Image
                                    src={uploadState.isImage}
                                    className={`prompt-img ${
                                        uploadState.imageLoading && "loading"
                                    }`}
                                    alt="prompt-image"
                                    width={75}
                                    height={75}
                                />
                                {uploadState.imageLoading && (
                                    <div className="image-loader">
                                        <Oval
                                            color="#7081fd"
                                            secondaryColor="#7081fd"
                                            height="32"
                                            width="32"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        placeholder="Ask me anything"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            textareaRef.current.style.height = "auto";
                            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        rows="1"
                    />
                </div>

                <div className="footer-input-actions">
                    <label htmlFor="image" className="image-label">
                        <LuImagePlus />
                    </label>
                    <input
                        type="file"
                        style={{ display: "none" }}
                        name="image"
                        id="image"
                        onChange={handleImageChange}
                    />
                    <button
                        type="submit"
                        disabled={
                            loading || !input.trim() || uploadState.imageLoading
                        }
                        className={`send-btn ${
                            loading || !input.trim() || uploadState.imageLoading
                                ? "disabled"
                                : ""
                        }`}
                    >
                        <IoMdSend />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Footer;
