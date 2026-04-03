import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import { authOptions } from '../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { createChatInteraction, getUserChats } from '@/services/chatService';
import { IChatResponse, ICreateChatResponse } from '@/types/chat';

export const GET = apiHandler(async (request: NextRequest) => {
    const [session, _] = await Promise.all([getServerSession(authOptions), connectToDB()]);
    const userId = session?.user?._id;

    if (!userId) throw new ErrorWrapper(401, 'Unauthorized');

    const chats = await getUserChats(userId);
    return ResponseWrapper.successWithData<IChatResponse>({ chats }, 200);
});

export const POST = apiHandler(async (request: NextRequest) => {
    const [session, formData, _] = await Promise.all([
        getServerSession(authOptions),
        request.formData(),
        connectToDB(),
    ]);

    const prompt = formData.get('prompt') as string | null;
    if (!prompt) throw new ErrorWrapper(400, 'Prompt is required');

    try {
        const result = await createChatInteraction({
            userId: session?.user?._id,
            prompt,
            image: formData.get('file') as File | null,
            imageUrl: formData.get('imageUrl') as string | null,
            referenceId: formData.get('referenceId') as string | null,
            historyRaw: formData.get('history') as string | null,
        });

        return ResponseWrapper.successWithData<ICreateChatResponse>(result, 200);
    } catch (error: any) {
        throw new ErrorWrapper(error.message === 'Chat session not found' ? 404 : 500, error.message);
    }
});
