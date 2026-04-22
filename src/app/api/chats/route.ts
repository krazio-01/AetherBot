import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import { authOptions } from '../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { createChatInteraction, getUserChats } from '@/services/chatService';
import { IChatResponse, MediaType } from '@/types/chat';
import { buildInteractionStream } from '@/utils/streamUtils';

export const GET = apiHandler(async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) throw new ErrorWrapper(401, 'Unauthorized');

    await connectToDB();

    const chats = await getUserChats(session.user._id);
    return ResponseWrapper.successWithData<IChatResponse>({ chats }, 200);
});

export const POST = apiHandler(async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) throw new ErrorWrapper(401, 'Unauthorized');

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string | null;

    if (!prompt) throw new ErrorWrapper(400, 'Prompt is required');

    await connectToDB();

    const attachment = formData.get('fileUrl')
        ? {
            url: formData.get('fileUrl') as string,
            type: formData.get('fileType') as MediaType,
            name: (formData.get('fileName') as string) || 'File',
        }
        : undefined;

    try {
        const { stream, referenceId, interactionId } = await createChatInteraction({
            userId: session.user._id,
            prompt,
            attachment,
            rawFile: formData.get('file') as File | null,
            referenceId: formData.get('referenceId') as string | null,
            historyRaw: formData.get('history') as string | null,
        });

        const webStream = buildInteractionStream(stream, request.signal, interactionId?.toString());

        return ResponseWrapper.stream(webStream, { 'x-reference-id': referenceId });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        const statusCode = errorMessage === 'Chat session not found' ? 404 : 500;
        throw new ErrorWrapper(statusCode, errorMessage);
    }
});
