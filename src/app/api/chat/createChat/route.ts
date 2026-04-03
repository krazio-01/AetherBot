import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import { multiTurnConversation, generateTextFromImageAndPrompt } from '@/utils/GeminiUtils';
import Chat from '@/models/chatModel';
import Interaction from '@/models/interactionModel';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import { Content } from '@google/generative-ai';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { ChatRole, ICreateChatResponse } from '@/types/chat';

interface IChatFormData {
    file?: File;
    prompt?: string;
    history?: string;
    imageUrl?: string;
    referenceId?: string;
}

export const POST = apiHandler(async (request: NextRequest) => {
    await connectToDB();

    const formData = await request.formData();
    const payload = Object.fromEntries(formData.entries()) as unknown as IChatFormData;
    const { file: image, prompt, history: historyRaw, imageUrl, referenceId } = payload;

    if (!prompt) throw new ErrorWrapper(400, 'Prompt is required');

    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    let geminiHistory: Content[] = [];

    if (referenceId?.startsWith('guest_') || !userId) {
        if (historyRaw) {
            try {
                geminiHistory = JSON.parse(historyRaw);
            } catch (e) {
                console.warn('Failed to parse guest chat history');
            }
        }
    } else if (referenceId && userId) {
        let chatDoc = await Chat.findOne({ referenceId });
        if (!chatDoc) throw new ErrorWrapper(404, 'Chat session not found');

        const pastTurns = await Interaction.find({ chatId: referenceId }).sort({ createdAt: 1 });

        geminiHistory = pastTurns.flatMap((turn) => [
            { role: ChatRole.USER, parts: [{ text: turn.userMessage.text }] },
            { role: ChatRole.MODEL, parts: [{ text: turn.modelMessage.text }] },
        ]);
    }

    let geminiResponse: string;
    if (!image || !imageUrl) geminiResponse = await multiTurnConversation(prompt, geminiHistory);
    else geminiResponse = await generateTextFromImageAndPrompt(prompt, image);

    if (!userId) {
        const currentGuestId = referenceId?.startsWith('guest_') ? referenceId : `guest_${uuidv4()}`;
        const responsePayload: ICreateChatResponse = {
            modelMessage: geminiResponse,
            referenceId: currentGuestId,
        };
        return ResponseWrapper.successWithData(responsePayload, 200);
    }

    let chatDoc;
    if (!referenceId) chatDoc = new Chat({ userId, referenceId: uuidv4(), title: prompt });
    else chatDoc = await Chat.findOne({ referenceId });

    const conversationTurn = new Interaction({
        chatId: chatDoc!.referenceId,
        userMessage: { text: prompt, image: imageUrl || undefined },
        modelMessage: { text: geminiResponse },
    });

    await conversationTurn.save();
    await chatDoc!.save();

    const responsePayload: ICreateChatResponse = {
        modelMessage: geminiResponse,
        referenceId: chatDoc!.referenceId,
    };

    return ResponseWrapper.successWithData(responsePayload, 200);
});
