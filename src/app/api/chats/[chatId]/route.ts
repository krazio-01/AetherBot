import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { deleteUserChat } from '@/services/server/chatService';

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { chatId: string } }) => {
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) throw new ErrorWrapper(401, 'Unauthorized');

    const { chatId } = params;
    if (!chatId) throw new ErrorWrapper(400, 'Chat ID is required');

    await connectToDB();

    try {
        await deleteUserChat(chatId, userId);
        return ResponseWrapper.success(200, 'Chat deleted successfully');
    } catch (error: any) {
        throw new ErrorWrapper(error.message === 'Chat not found' ? 404 : 500, error.message);
    }
});
