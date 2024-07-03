import { NextResponse } from "next/server";
import connectToDB from "@/utils/dbConnect";
import {
    multiTurnConversation,
    generateTextFromImageAndPrompt,
} from "@/utils/GeminiUtils";
import Chat from "@/models/chatModel";
import Message from "@/models/messageModel";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";

export async function POST(request) {
    await connectToDB();

    try {
        const formData = await request.formData();
        const image = formData.get("file");
        const prompt = formData.get("prompt");
        const history = JSON.parse(formData.get("history"));
        const imageUrl = formData.get("imageUrl");
        const referenceId = formData.get("referenceId");

        const session = await getServerSession(authOptions);
        const userId = session?.user?._id;

        // Generate response from the model
        let geminiResponse;
        if (!image || !imageUrl)
            geminiResponse = await multiTurnConversation(prompt, history);
        else
            geminiResponse = await generateTextFromImageAndPrompt(
                prompt,
                image
            );

        // Find or create chat document
        let chatDoc;
        if (!referenceId) {
            chatDoc = new Chat({
                userId,
                referenceId: uuidv4(),
                title: prompt,
            });
        } else {
            chatDoc = await Chat.findOne({ referenceId });
        }

        // Create user and model messages
        const userMessage = new Message({
            chatId: chatDoc.referenceId,
            role: "user",
            parts: [{ text: prompt }],
            image: imageUrl || undefined,
        });

        const modelMessage = new Message({
            chatId: chatDoc.referenceId,
            role: "model",
            parts: [{ text: geminiResponse }],
        });

        // Save the chat document and both messages
        await userMessage.save();
        await modelMessage.save();

        // Save the chat document after messages are saved
        await chatDoc.save();
        return NextResponse.json(
            { modelMessage: geminiResponse, referenceId: chatDoc.referenceId },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
