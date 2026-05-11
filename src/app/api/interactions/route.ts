import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { authOptions } from '../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import { interactionService } from '@/services/server/interactionService';
import { IFetchMessagesResponse } from '@/types/chat';

export const GET = apiHandler(async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const chatId = searchParams.get('chatId');
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!chatId) throw new ErrorWrapper(400, 'Chat ID is required');

    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    const { formattedMessages, hasMore } = await interactionService.getInteractionsByChatId(
        chatId,
        userId,
        page,
        limit
    );

    return ResponseWrapper.successWithData<IFetchMessagesResponse & { hasMore: boolean }>({
        messages: formattedMessages,
        hasMore,
    });
});
