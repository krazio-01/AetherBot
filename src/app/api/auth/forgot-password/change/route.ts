import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import bcrypt from 'bcrypt';
import User from '@/models/userModel';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

interface IResetPasswordBody {
    token?: string;
    newPassword?: string;
}

export const POST = apiHandler(async (request: NextRequest) => {
    await connectToDB();

    const body: IResetPasswordBody = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) throw new ErrorWrapper(400, 'Token and new password are required');

    const user = await User.findOne({
        forgotPasswordToken: token,
        forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) throw new ErrorWrapper(400, 'Invalid or expired link');

    // Hash new password and clean up tokens
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;

    await user.save();

    return ResponseWrapper.success(null, 200, 'Password reset successfully');
});
