import { MediaType } from '@/types/chat';
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInteraction extends Document {
    chatId: string;
    userMessage: {
        text: string;
        attachment?: {
            url: string;
            type: string;
            name: string;
        };
    };
    modelMessage: {
        text: string;
    };
}

const interactionSchema = new Schema<IInteraction>(
    {
        chatId: {
            type: String,
            required: [true, 'Please provide a chatId'],
            index: true,
        },
        userMessage: {
            text: { type: String, required: true },
            attachment: {
                url: { type: String },
                type: { type: String, enum: [MediaType.IMAGE, MediaType.PDF] },
                name: { type: String },
            },
        },
        modelMessage: {
            text: { type: String, required: true },
        },
    },
    { timestamps: true },
);

const Interaction: Model<IInteraction> =
    mongoose.models.interactions || mongoose.model('interactions', interactionSchema);

export default Interaction;
