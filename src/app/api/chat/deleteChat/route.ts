import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import Chat from '@/models/chatModel';
import Message from '@/models/messageModel';
import cloudinary from '@/utils/cloudinaryConfig';

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    await connectToDB();

    const { searchParams } = request.nextUrl;
    const chatId = searchParams.get('chatId');

    if (!chatId) return NextResponse.json({ message: 'Chat ID is required' }, { status: 400 });

    try {
        const chat = await Chat.findOne({ referenceId: chatId });
        if (!chat) {
            return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
        }

        const messagesWithImages = await Message.find({
            chatId: chatId,
            image: { $exists: true, $ne: null },
        });

        const imageUrls: string[] = messagesWithImages.map((message) => message.image as string);

        await Promise.all(
            imageUrls.map(async (imageUrl) => {
                const id = imageUrl.split('/').pop()?.split('.')[0];
                if (id) {
                    const publicId = `AetherBot/${id}`;
                    await cloudinary.uploader.destroy(publicId);
                }
            }),
        );

        await Chat.deleteOne({ referenceId: chatId });
        await Message.deleteMany({ chatId: chatId });

        return NextResponse.json({ message: 'Chat deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Delete chat error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
