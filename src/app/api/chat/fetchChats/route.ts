import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import Chat from '@/models/chatModel';

export async function GET(request: NextRequest): Promise<NextResponse> {
    await connectToDB();

    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const chats = await Chat.find({ userId }).select('-createdAt -userId -__v').sort({ createdAt: -1 });

        return NextResponse.json({ chats }, { status: 200 });
    } catch (error) {
        console.error('Fetch chats error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
