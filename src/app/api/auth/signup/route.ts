import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/userModel';
import connectToDB from '@/utils/dbConnect';
import sendEmail from '@/utils/sendMail';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

interface ISignupBody {
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectToDB();

    try {
        const body: ISignupBody = await request.json();
        const { name, email, password, avatar } = body;

        // Validations
        if (!name || !email || !password)
            return NextResponse.json({ message: 'Please fill all fields' }, { status: 400 });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });

        const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                {
                    message: 'Password must be at least 8 characters long and include at least one special character',
                },
                { status: 400 },
            );
        }

        const userExists = await User.findOne({ email });
        if (userExists) return NextResponse.json({ message: 'This account is already registered' }, { status: 400 });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const hashedToken = uuidv4();

        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword,
            avatar: avatar,
            verifyToken: hashedToken,
            verifyTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
        });

        const user = await newUser.save();

        // Send verification email
        const to = user.email;
        const subject = 'Account Verification';

        const templatePath = path.resolve(process.cwd(), 'src/templates/verificationTemplate.html');

        const verifyTemplate = fs.readFileSync(templatePath, 'utf8');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const verificationContent = verifyTemplate
            .replace(/{{name}}/g, user.name)
            .replace(/{{FRONTEND_URL}}/g, frontendUrl)
            .replace(/{{verifyToken}}/g, user.verifyToken);

        await sendEmail(to, subject, '', verificationContent);

        return NextResponse.json(
            {
                message: 'Registration successful',
                user: user,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
