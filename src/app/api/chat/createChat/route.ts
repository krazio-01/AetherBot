import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import { multiTurnConversation, generateTextFromImageAndPrompt } from '@/utils/GeminiUtils';
import Chat from '@/models/chatModel';
import Message from '@/models/messageModel';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import { Content } from '@google/generative-ai';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

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

    let history: Content[] = [];
    if (historyRaw) {
        try {
            history = JSON.parse(historyRaw);
        } catch (e) {
            console.warn('Failed to parse chat history');
        }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    let geminiResponse: string;
    if (!image || !imageUrl) geminiResponse = await multiTurnConversation(prompt, history);
    else geminiResponse = await generateTextFromImageAndPrompt(prompt, image);

    let chatDoc;
    if (!referenceId) {
        chatDoc = new Chat({
            userId,
            referenceId: uuidv4(),
            title: prompt,
        });
    } else {
        chatDoc = await Chat.findOne({ referenceId });
        if (!chatDoc) throw new ErrorWrapper(404, 'Chat session not found');
    }

    const userMessage = new Message({
        chatId: chatDoc.referenceId,
        role: 'user',
        parts: [{ text: prompt }],
        image: imageUrl || undefined,
    });

    const modelMessage = new Message({
        chatId: chatDoc.referenceId,
        role: 'model',
        parts: [{ text: geminiResponse }],
    });

    await userMessage.save();
    await modelMessage.save();
    await chatDoc.save();

    return ResponseWrapper.successWithData({ modelMessage: geminiResponse, referenceId: chatDoc.referenceId }, 200);
});
