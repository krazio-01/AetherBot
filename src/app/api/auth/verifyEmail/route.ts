import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

export const POST = apiHandler(async (request: NextRequest) => {
    await connectToDB();

    const body: { token?: string } = await request.json();
    const { token } = body;

    if (!token) throw new ErrorWrapper(400, 'Token is required');

    const user = await User.findOne({
        verifyToken: token,
        verifyTokenExpiry: { $gt: Date.now() },
    });

    if (!user) throw new ErrorWrapper(400, 'Invalid or expired token');

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;

    await user.save();

    return ResponseWrapper.success(200, 'Email verified successfully');
});
