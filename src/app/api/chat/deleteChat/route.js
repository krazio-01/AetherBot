import { NextResponse } from "next/server";
import connectToDB from "@/utils/dbConnect";
import Chat from "@/models/chatModel";
import Message from "@/models/messageModel";
import cloudinary from "@/utils/cloudinaryConfig";

export async function DELETE(request) {
    await connectToDB();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    try {
        const chat = await Chat.findOne({ referenceId: chatId });
        if (!chat) {
            return NextResponse.json(
                { message: "Chat not found" },
                { status: 404 }
            );
        }

        const messagesWithImages = await Message.find({
            chatId: chatId,
            image: { $exists: true, $ne: null },
        });
        const imageUrls = messagesWithImages.map((message) => message.image);

        await Promise.all(
            imageUrls.map(async (imageUrl) => {
                const Id = imageUrl.split("/").pop().split(".")[0];
                const publicId = `AetherBot/${Id}`;
                await cloudinary.uploader.destroy(publicId);
            })
        );

        await Chat.deleteOne({ referenceId: chatId });
        await Message.deleteMany({ chatId: chatId });

        return NextResponse.json(
            { message: "Chat deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}