import { NextRequest, NextResponse } from 'next/server';
import Message from '@/models/messageModel';
import connectToDB from '@/utils/dbConnect';

interface FetchMessagesBody {
    chatId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectToDB();

    try {
        const body: FetchMessagesBody = await request.json();
        const { chatId } = body;

        if (!chatId || typeof chatId !== 'string')
            return NextResponse.json({ message: 'Invalid or missing chatId format' }, { status: 400 });

        const messages = await Message.find({ chatId }).select('-_id -chatId -__v');

        if (!messages || messages.length === 0)
            return NextResponse.json({ message: `No chat exists for: ${chatId}`, flag: 'Not Found' }, { status: 404 });

        return NextResponse.json({ messages }, { status: 200 });
    } catch (error) {
        console.error('Fetch messages error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
