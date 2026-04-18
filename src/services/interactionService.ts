import Interaction from '@/models/interactionModel';
import connectToDB from '@/utils/dbConnect';
import { ErrorWrapper } from '@/lib/ResponseWrapper';
import { ChatRole } from '@/types/chat';

export const interactionService = {
    async getInteractionsByChatId(chatId: string) {
        if (!chatId || typeof chatId !== 'string') throw new ErrorWrapper(400, 'Invalid or missing chatId parameter');

        await connectToDB();

        const interactions = await Interaction.find({ chatId }).sort({ createdAt: 1 }).lean();

        if (!interactions || interactions.length === 0) throw new ErrorWrapper(404, `No chat exists for: ${chatId}`);

        const formattedMessages = interactions.flatMap((interaction) => {
            const userMsg: any = {
                role: ChatRole.USER,
                parts: [{ text: interaction.userMessage.text }],
            };

            if (interaction.userMessage.attachment) userMsg.attachment = interaction.userMessage.attachment;

            const modelMsg = {
                role: ChatRole.MODEL,
                parts: [{ text: interaction.modelMessage.text }],
            };

            return [userMsg, modelMsg];
        });

        return formattedMessages;
    },
};
