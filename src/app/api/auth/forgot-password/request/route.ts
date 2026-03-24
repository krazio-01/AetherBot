import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';
import { v4 as uuidv4 } from 'uuid';
import sendEmail from '@/utils/sendMail';
import path from 'path';
import fs from 'fs';

interface IForgotPasswordBody {
    email?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectToDB();

    try {
        const body: IForgotPasswordBody = await request.json();
        const { email } = body;

        if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 });

        const user = await User.findOne({ email });
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const resetToken = uuidv4();

        user.forgotPasswordToken = resetToken;
        user.forgotPasswordTokenExpiry = new Date(Date.now() + 3600000);

        await user.save({ validateBeforeSave: false });

        const to = user.email;
        const subject = 'Change password for AetherBot';

        const templatePath = path.resolve(process.cwd(), 'src/templates/forgot-password.html');

        const passwordResetTemplate = fs.readFileSync(templatePath, 'utf8');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const passwordResetContent = passwordResetTemplate
            .replace(/{{FRONTEND_URL}}/g, frontendUrl)
            .replace(/{{forgotPasswordToken}}/g, resetToken);

        await sendEmail(to, subject, '', passwordResetContent);

        return NextResponse.json({ message: `An email has been sent to ${to}` }, { status: 200 });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
