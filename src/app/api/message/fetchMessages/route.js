import { NextResponse } from "next/server";
import Message from "@/models/messageModel";
import connectToDB from "@/utils/dbConnect";

export async function POST(request) {
    await connectToDB();

    const { chatId } = await request.json();

    if (typeof chatId !== "string") {
        return NextResponse.json(
            { message: "Invalid chatId format" },
            { status: 400 }
        );
    }

    try {
        const messages = await Message.find({ chatId }).select(
            "-_id -chatId -__v"
        );

        if ((!messages || messages.length === 0) && chatId) {
            return NextResponse.json(
                { message: `No chat exists for: ${chatId}`, flag: "Not Found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ messages }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.Message }, { status: 500 });
    }
}
