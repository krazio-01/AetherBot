import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import Chat from '@/models/chatModel';
import Interaction from '@/models/interactionModel';
import cloudinary from '@/utils/cloudinaryConfig';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

export const DELETE = apiHandler(async (request: NextRequest) => {
    await connectToDB();

    const { searchParams } = request.nextUrl;
    const chatId = searchParams.get('chatId');

    if (!chatId) throw new ErrorWrapper(400, 'Chat ID is required');

    const chat = await Chat.findOne({ referenceId: chatId });
    if (!chat) throw new ErrorWrapper(404, 'Chat not found');

    const interactionsWithImages = await Interaction.find({
        chatId: chatId,
        image: { $exists: true, $ne: null },
    });

    const imageUrls: string[] = interactionsWithImages.map((interaction) => interaction.userMessage.image);

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
    await Interaction.deleteMany({ chatId: chatId });

    return ResponseWrapper.success(200, 'Chat deleted successfully');
});
