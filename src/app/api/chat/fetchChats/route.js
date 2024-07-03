import { NextResponse } from "next/server";
import connectToDB from "@/utils/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import Chat from "@/models/chatModel";

export async function GET() {
    await connectToDB();

    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    try {
        const chats = await Chat.find({ userId })
            .select("-createdAt -userId -__v")
            .sort({ createdAt: -1 });
        return NextResponse.json({ chats }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
