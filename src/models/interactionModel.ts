import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInteraction extends Document {
    chatId: string;
    userMessage: {
        text: string;
        image?: string;
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
            image: { type: String },
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
