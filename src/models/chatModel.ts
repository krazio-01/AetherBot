import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChat extends Document {
    userId: string;
    referenceId: string;
    title: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
    {
        userId: {
            type: String,
            required: true,
        },
        referenceId: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
        },
        isPublic: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    },
);

const Chat: Model<IChat> = mongoose.models.chats || mongoose.model('chats', chatSchema);

export default Chat;
