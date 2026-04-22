import Chat from '@/models/chatModel';
import Interaction from '@/models/interactionModel';
import { multiTurnConversationStream, generateTextFromFileAndPromptStream } from '@/utils/GeminiUtils';
import { fileService } from '@/services/fileService';
import { v4 as uuidv4 } from 'uuid';
import { Content } from '@google/genai';
import { ChatRole, MediaType } from '@/types/chat';
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

const getChatHistoryAndDoc = async (
    userId: string | undefined,
    referenceId: string | null | undefined,
    historyRaw: string | null | undefined,
) => {
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

    return { chatDoc, geminiHistory };
};

export async function createChatInteraction(params: IProcessChatParams) {
    const { userId, prompt, attachment, rawFile, referenceId, historyRaw } = params;

    let { chatDoc, geminiHistory } = await getChatHistoryAndDoc(userId, referenceId, historyRaw);

    const stream = rawFile
        ? await generateTextFromFileAndPromptStream(prompt, rawFile, geminiHistory)
        : await multiTurnConversationStream(prompt, geminiHistory);

    if (!userId) {
        return {
            stream,
            referenceId: referenceId?.startsWith('guest_') ? referenceId : `guest_${uuidv4()}`,
        };
    }

    const MAX_TITLE_LENGTH = 40;
    const chatTitle = prompt.length > MAX_TITLE_LENGTH ? `${prompt.substring(0, MAX_TITLE_LENGTH).trim()}...` : prompt;

    if (!chatDoc) chatDoc = new Chat({ userId, referenceId: uuidv4(), title: chatTitle });
    else chatDoc.updatedAt = new Date();

    const conversationTurn = new Interaction({
        chatId: chatDoc.referenceId,
        userMessage: { text: prompt, attachment },
        modelMessage: { text: ' ' },
    });

    await Promise.all([conversationTurn.save(), chatDoc.save()]);

    return {
        stream,
        referenceId: chatDoc.referenceId,
        interactionId: conversationTurn._id,
    };
}

export async function finalizeInteraction(interactionId: string, modelText: string) {
    if (!interactionId) return;
    await Interaction.findByIdAndUpdate(interactionId, {
        $set: { 'modelMessage.text': modelText },
    });
}

export async function getUserChats(userId: string): Promise<IChat[]> {
    const chats = await Chat.find({ userId })
        .select('-createdAt -userId -__v -updatedAt')
        .sort({ updatedAt: -1 })
        .lean();

    return chats.map(
        ({ _id, ...rest }): IChat => ({
            ...rest,
            _id: _id.toString(),
        }),
    );
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
