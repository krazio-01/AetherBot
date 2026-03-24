import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import bcrypt from 'bcrypt';
import User from '@/models/userModel';

interface IChangePasswordBody {
    token?: string;
    newPassword?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectToDB();

    try {
        const body: IChangePasswordBody = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword)
            return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });

        const user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordTokenExpiry: { $gt: Date.now() },
        });

        if (!user) return NextResponse.json({ message: 'Invalid or expired link' }, { status: 400 });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;

        await user.save();

        return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
