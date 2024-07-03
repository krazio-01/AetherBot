import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: [true, "Please provide a chatId"],
    },
    role: {
        type: String,
        required: [true, "Please provide a role"],
        enum: ["user", "model"],
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

const Message =
    mongoose.models.messages || mongoose.model("messages", messageSchema);

export default Message;
