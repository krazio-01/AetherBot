import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import Chat from '@/models/chatModel';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

export const GET = apiHandler(async (request: NextRequest) => {
    await connectToDB();

    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) throw new ErrorWrapper(401, 'Unauthorized');

    const chats = await Chat.find({ userId }).select('-createdAt -userId -__v').sort({ createdAt: -1 });

    return ResponseWrapper.successWithData({ chats }, 200);
});
