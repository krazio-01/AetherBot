import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';

export async function POST(request: NextRequest): Promise<NextResponse> {
    await connectToDB();

    try {
        const body: { token?: string } = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ message: 'Token is required' }, { status: 400 });
        }

        const user = await User.findOne({
            verifyToken: token,
            verifyTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
        }

        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;

        await user.save();

        return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
    } catch (err) {
        console.error('Email verification error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
