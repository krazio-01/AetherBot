import { create } from 'zustand';
import { IChat, IMessage } from '@/types';

interface IAppState {
    input: string;
    setInput: (input: string) => void;

    chats: IChat[];
    removeChat: (chatId: string) => void;
    setChats: (chats: IChat[]) => void;

    currentChatId: string | null;
    setCurrentChatId: (id: string | null) => void;

    messages: IMessage[];
    updateMessages: (newMessage: IMessage) => void;
    setMessages: (messages: IMessage[]) => void;
    editMessage: (id: string, updatedData: Partial<IMessage>) => void;

    loading: boolean;
    setLoading: (loading: boolean) => void;

    sidebarIsOpen: boolean;
    setSidebarIsOpen: () => void;
}

const useAppStore = create<IAppState>((set) => ({
    input: '',
    setInput: (input) => set({ input }),

    chats: [],
    removeChat: (chatId) => {
        set((state) => ({
            chats: state.chats.filter((chat) => chat.referenceId !== chatId),
        }));
    },
    setChats: (chats) => set({ chats }),

    currentChatId: null,
    setCurrentChatId: (id) => set({ currentChatId: id }),

    messages: [],
    updateMessages: (newMessage) => set((state) => ({ messages: [...state.messages, newMessage] })),
    setMessages: (messages) => set({ messages }),
    editMessage: (id, updatedData) =>
        set((state) => ({
            messages: state.messages.map((msg) => (msg.client_id === id ? { ...msg, ...updatedData } : msg)),
        })),

    loading: false,
    setLoading: (loading) => set({ loading }),

    sidebarIsOpen: false,
    setSidebarIsOpen: () => set((state) => ({ sidebarIsOpen: !state.sidebarIsOpen })),
}));

export default useAppStore;
