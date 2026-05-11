import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import Chat from '@/models/chatModel';
import connectToDB from '@/utils/dbConnect';

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { chatId: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session) throw new ErrorWrapper(401, 'Unauthorized');

    await connectToDB();

    const chat = await Chat.findOne({ referenceId: params.chatId, userId: session.user._id });
    if (!chat) throw new ErrorWrapper(404, 'Chat not found or unauthorized');

    chat.isPublic = true;
    await chat.save();

    return ResponseWrapper.success(200, 'Chat is now public');
});
