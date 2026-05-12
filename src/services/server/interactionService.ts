import Interaction from '@/models/interactionModel';
import Chat from '@/models/chatModel';
import connectToDB from '@/utils/dbConnect';
import { ErrorWrapper } from '@/lib/ResponseWrapper';
import { ChatRole, IFetchMessagesResponse } from '@/types/chat';
import { IMessage } from '@/types';

export const interactionService = {
    async getInteractionsByChatId(
        chatId: string | null,
        userId: string | undefined,
        page: number = 0,
        limit: number = 15,
        isShared: boolean = false,
    ) {
        if (!chatId || typeof chatId !== 'string') throw new ErrorWrapper(400, 'Invalid or missing chatId parameter');

        await connectToDB();

        const chat = await Chat.findOne({ referenceId: chatId });
        if (!chat) throw new ErrorWrapper(404, 'Chat not found');

        const isOwner = userId === chat.userId;
        if (!chat.isPublic && !isOwner)
            throw new ErrorWrapper(401, 'This conversation is either private, has been deleted, or the link is invalid.');

        const skip = isShared ? 0 : page * limit;
        limit = isShared ? 0 : limit;
        const interactions = await Interaction.find({ chatId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

        if ((!interactions || interactions.length === 0) && page === 1)
            throw new ErrorWrapper(404, `No chat exists for: ${chatId}`);

        const chronologicalInteractions = interactions.reverse();

        const formattedMessages = chronologicalInteractions.flatMap((interaction) => {
            const userMsg: IMessage = {
                role: ChatRole.USER,
                parts: [{ text: interaction.userMessage.text }],
            };

            if (interaction.userMessage.attachment) userMsg.attachment = interaction.userMessage.attachment;

            const modelMsg: IMessage = {
                role: ChatRole.MODEL,
                parts: [{ text: interaction.modelMessage.text }],
            };

            return [userMsg, modelMsg];
        });

        const totalCount = await Interaction.countDocuments({ chatId });
        const hasMore = totalCount > skip + interactions.length;

        const response: IFetchMessagesResponse = {
            messages: formattedMessages,
            hasMore,
        };

        if (isShared) {
            response.chatTitle = chat.title;
            response.createdAt = chat.createdAt;
        }

        return response;
    },
};
