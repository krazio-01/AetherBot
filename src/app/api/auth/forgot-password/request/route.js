import { NextResponse } from "next/server";
import connectToDB from "@/utils/dbConnect";
import User from "@/models/userModel";
import { v4 as uuidv4 } from "uuid";
import sendEmail from "@/utils/sendMail";
import path from "path";
import fs from "fs";

export async function POST(request) {
    await connectToDB();

    try {
        const { email } = await request.json();

        if (!email)
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const resetToken = uuidv4();

        user.forgotPasswordToken = resetToken;
        user.forgotPasswordTokenExpiry = Date.now() + 3600000;

        await user.save({ validateBeforeSave: false });

        const to = user.email;
        let subject = null,
            html = null;

        const templatePath = path.resolve(
            process.cwd(),
            "src/templates/forgot-password.html"
        );

        const passwordResetTemplate = fs.readFileSync(templatePath, "utf8");

        const passwordResetContent = passwordResetTemplate
            .replace(/{{FRONTEND_URL}}/g, process.env.FRONTEND_URL)
            .replace(/{{forgotPasswordToken}}/g, resetToken);

        // send verification mail to the user
        subject = "Change password for AetherBot";
        html = passwordResetContent;
        await sendEmail(to, subject, null, html);

        return NextResponse.json(
            { message: `An email has been sent to ${to}` },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
