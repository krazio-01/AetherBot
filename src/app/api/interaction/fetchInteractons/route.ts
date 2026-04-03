import { NextRequest } from 'next/server';
import Interaction from '@/models/interactionModel';
import connectToDB from '@/utils/dbConnect';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import { ChatRole, IFetchMessagesResponse } from '@/types/chat';

interface IFetchMessagesBody {
    chatId?: string;
}

export const POST = apiHandler(async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session) throw new ErrorWrapper(401, 'Guests do not have a chat history.');

    await connectToDB();

    const body: IFetchMessagesBody = await request.json();
    const { chatId } = body;

    if (!chatId || typeof chatId !== 'string') throw new ErrorWrapper(400, 'Invalid or missing chatId format');

    const interactions = await Interaction.find({ chatId }).sort({ createdAt: 1 });

    if (!interactions || interactions.length === 0) throw new ErrorWrapper(404, `No chat exists for: ${chatId}`);

    const formattedInteractions = interactions.flatMap((interaction) => {
        const userMsg: any = {
            role: ChatRole.USER,
            parts: [{ text: interaction.userMessage.text }],
        };

        if (interaction.userMessage.image) userMsg.image = interaction.userMessage.image;

        const modelMsg = {
            role: ChatRole.MODEL,
            parts: [{ text: interaction.modelMessage.text }],
        };

        return [userMsg, modelMsg];
    });

    return ResponseWrapper.successWithData<IFetchMessagesResponse>({ messages: formattedInteractions });
});
