import { NextRequest } from 'next/server';
import Message from '@/models/messageModel';
import connectToDB from '@/utils/dbConnect';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';

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

    const messages = await Message.find({ chatId }).select('-_id -chatId -__v');

    if (!messages || messages.length === 0) throw new ErrorWrapper(404, `No chat exists for: ${chatId}`);

    return ResponseWrapper.successWithData({ messages });
});
