import Chat from '@/models/chatModel';
import Interaction from '@/models/interactionModel';
import { multiTurnConversation, generateTextFromFileAndPrompt } from '@/utils/GeminiUtils';
import { fileService } from '@/services/fileService';
import { v4 as uuidv4 } from 'uuid';
import { Content } from '@google/genai';
import { ChatRole, ICreateChatResponse, MediaType } from '@/types/chat';
import { IChat } from '@/types';

interface IProcessChatParams {
    userId?: string;
    prompt: string;
    attachment?: {
        url: string;
        type: MediaType;
        name: string;
    };
    rawFile?: File | null;
    referenceId?: string | null;
    historyRaw?: string | null;
}

export async function createChatInteraction(params: IProcessChatParams): Promise<ICreateChatResponse> {
    const { userId, prompt, attachment, rawFile, referenceId, historyRaw } = params;
    let geminiHistory: Content[] = [];
    let chatDoc: any = null;

    if (!userId || referenceId?.startsWith('guest_')) {
        if (historyRaw) {
            try {
                geminiHistory = JSON.parse(historyRaw);
            } catch (e) {
                console.warn('Failed to parse guest chat history');
            }
        }
    } else if (referenceId) {
        const [fetchedChat, pastTurns] = await Promise.all([
            Chat.findOne({ referenceId }),
            Interaction.find({ chatId: referenceId }).sort({ createdAt: 1 }).lean(),
        ]);

        if (!fetchedChat) throw new Error('Chat session not found');

        chatDoc = fetchedChat;
        geminiHistory = pastTurns.flatMap((turn: any) => [
            { role: ChatRole.USER, parts: [{ text: turn.userMessage.text }] },
            { role: ChatRole.MODEL, parts: [{ text: turn.modelMessage.text }] },
        ]);
    }

    let geminiResponse: string;

    if (rawFile) geminiResponse = await generateTextFromFileAndPrompt(prompt, rawFile);
    else geminiResponse = await multiTurnConversation(prompt, geminiHistory);

    if (!userId) {
        const currentGuestId = referenceId?.startsWith('guest_') ? referenceId : `guest_${uuidv4()}`;
        return {
            modelMessage: geminiResponse,
            referenceId: currentGuestId,
        };
    }

    if (!chatDoc) chatDoc = new Chat({ userId, referenceId: uuidv4(), title: prompt });

    const conversationTurn = new Interaction({
        chatId: chatDoc.referenceId,
        userMessage: { text: prompt, attachment },
        modelMessage: { text: geminiResponse },
    });

    await Promise.all([conversationTurn.save(), chatDoc.save()]);

    return {
        modelMessage: geminiResponse,
        referenceId: chatDoc.referenceId,
    };
}

export async function getUserChats(userId: string): Promise<IChat[]> {
    const chats = await Chat.find({ userId }).select('-createdAt -userId -__v').sort({ createdAt: -1 }).lean();

    return chats.map((chat: any) => ({
        ...chat,
        _id: chat._id.toString(),
    }));
}

export async function deleteUserChat(chatId: string, userId: string): Promise<void> {
    const chat = await Chat.findOne({ referenceId: chatId, userId: userId });

    if (!chat) throw new Error('Chat not found');

    const interactionsWithFiles = await Interaction.find({
        chatId: chatId,
        'userMessage.attachment.url': { $exists: true },
    }).lean();

    const fileUrls = interactionsWithFiles.map((interaction: any) => interaction.userMessage.attachment.url);

    const deleteFilePromises = fileUrls.map((url: string) => {
        return fileService.deleteFileByUrl(url).catch((err) => {
            console.error(`Failed to delete file ${url} from Cloudinary:`, err);
        });
    });

    await Promise.all([
        ...deleteFilePromises,
        Chat.deleteOne({ referenceId: chatId }),
        Interaction.deleteMany({ chatId: chatId }),
    ]);
}
