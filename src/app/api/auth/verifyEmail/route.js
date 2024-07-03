import { NextResponse } from "next/server";
import connectToDB from "@/utils/dbConnect";
import User from "@/models/userModel";

export async function POST(request) {
    await connectToDB();

    try {
        const { token } = await request.json();

        const user = await User.findOne({
            verifyToken: token,
            verifyTokenExpiry: { $gt: Date.now() },
        });

        if (!user)
            return NextResponse.json(
                { message: "Invalid token" },
                { status: 400 }
            );

        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;

        await user.save();

        return NextResponse.json(
            { message: "Email verified successfully" },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
