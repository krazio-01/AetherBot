import { NextResponse } from "next/server";
import connectToDB from "@/utils/dbConnect";
import bcrypt from "bcrypt";
import User from "@/models/userModel";

export async function POST(request) {
    await connectToDB();

    try {
        const { token, newPassword } = await request.json();

        const user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordTokenExpiry: { $gt: Date.now() },
        });

        if (!user)
            return NextResponse.json(
                { message: "Invalid Link" },
                { status: 400 }
            );

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;

        await user.save();

        return NextResponse.json(
            { message: "Password reset scucessfully" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
