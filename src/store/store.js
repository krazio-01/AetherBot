import { create } from "zustand";

// Create Zustand store
const useAppStore = create((set) => ({
    input: "",
    setInput: (input) => set({ input }),

    isNewChat: false,
    setIsNewChat: (isNewChat) => set({ isNewChat }),

    chats: [],
    removeChat: (chatId) => {
        set((state) => ({
            chats: state.chats.filter((chat) => chat.referenceId !== chatId),
        }));
    },
    setChats: (chats) => set({ chats }),

    messages: [],
    updateMessages: (newMessage) =>
        set((state) => ({ messages: [...state.messages, newMessage] })),
    setMessages: (messages) => set({ messages }),

    loading: false,
    setLoading: (loading) => set({ loading }),

    sidebarIsOpen: false,
    setSidebarIsOpen: () =>
        set((state) => ({ sidebarIsOpen: !state.sidebarIsOpen })),
}));

export default useAppStore;
