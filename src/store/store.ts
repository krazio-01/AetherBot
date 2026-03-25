import { create } from 'zustand';
import { IChat, IMessage } from '@/types';

interface IAppState {
    input: string;
    setInput: (input: string) => void;

    isNewChat: boolean;
    setIsNewChat: (isNewChat: boolean) => void;

    chats: IChat[];
    removeChat: (chatId: string) => void;
    setChats: (chats: IChat[]) => void;

    messages: IMessage[];
    updateMessages: (newMessage: IMessage) => void;
    setMessages: (messages: IMessage[]) => void;

    loading: boolean;
    setLoading: (loading: boolean) => void;

    sidebarIsOpen: boolean;
    setSidebarIsOpen: () => void;
}

const useAppStore = create<IAppState>((set) => ({
    input: '',
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
    updateMessages: (newMessage) => set((state) => ({ messages: [...state.messages, newMessage] })),
    setMessages: (messages) => set({ messages }),

    loading: false,
    setLoading: (loading) => set({ loading }),

    sidebarIsOpen: false,
    setSidebarIsOpen: () => set((state) => ({ sidebarIsOpen: !state.sidebarIsOpen })),
}));

export default useAppStore;
