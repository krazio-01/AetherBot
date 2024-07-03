import { NextResponse } from "next/server";
import User from "@/models/userModel";
import connectToDB from "@/utils/dbConnect.js";
import sendEmail from "@/utils/sendMail";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

export async function POST(request) {
    // connect to the database
    await connectToDB();

    try {
        const { name, email, password, avatar } = await request.json();

        // validations
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Please fill all fields" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            );
        }

        const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                {
                    message:
                        "Password must be at least 8 characters long and include at least one special character",
                },
                { status: 400 }
            );
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json(
                { message: "This account already registered" },
                { status: 400 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // generate unique verifyation token
        const hashedToken = uuidv4();

        // Create new user
        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword,
            avatar: avatar,
            verifyToken: hashedToken,
            verifyTokenExpiry: Date.now() + 3600000, // 1 hour from now
        });

        const user = await newUser.save();

        // Send verification email
        const to = user.email;
        let subject = null,
            html = null;

        const templatePath = path.resolve(
            process.cwd(),
            "src/templates/verificationTemplate.html"
        );

        const verifyTemplate = fs.readFileSync(templatePath, "utf8");

        const verificationContent = verifyTemplate
            .replace(/{{name}}/g, user.name)
            .replace(/{{FRONTEND_URL}}/g, process.env.FRONTEND_URL)
            .replace(/{{verifyToken}}/g, user.verifyToken);

        // send verification mail to the user
        subject = "Account Verification";
        html = verificationContent;
        await sendEmail(to, subject, null, html);

        return NextResponse.json(
            {
                message: "Registration successful",
                user: user,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
