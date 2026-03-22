import mongoose, { Schema, Document, Model } from 'mongoose';

enum Role {
    USER = 'user',
    MODEL = 'model',
}

export interface IMessage extends Document {
    chatId: string;
    role: Role.USER | Role.MODEL;
    image?: string;
    parts: Array<{
        text: string;
    }>;
}

const messageSchema = new Schema<IMessage>({
    chatId: {
        type: String,
        required: [true, 'Please provide a chatId'],
    },
    role: {
        type: String,
        required: [true, 'Please provide a role'],
        enum: [Role.USER, Role.MODEL],
    },
    image: {
        type: String,
    },
    parts: [
        {
            _id: false,
            text: {
                type: String,
                required: true,
            },
        },
    ],
});

const Message: Model<IMessage> = mongoose.models.messages || mongoose.model('messages', messageSchema);

export default Message;
