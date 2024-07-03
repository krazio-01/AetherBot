import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.models.chats || mongoose.model("chats", chatSchema);

export default Chat;