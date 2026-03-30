import { NextRequest } from 'next/server';
import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';
import { v4 as uuidv4 } from 'uuid';
import sendEmail from '@/utils/sendMail';
import path from 'path';
import fs from 'fs';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

interface IForgotPasswordBody {
    email?: string;
}

export const POST = apiHandler(async (request: NextRequest) => {
    await connectToDB();

    const body: IForgotPasswordBody = await request.json();
    const { email } = body;

    if (!email) throw new ErrorWrapper(400, 'Email is required');

    const user = await User.findOne({ email });
    if (!user) throw new ErrorWrapper(404, 'User not found');

    const resetToken = uuidv4();

    user.forgotPasswordToken = resetToken;
    user.forgotPasswordTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await user.save({ validateBeforeSave: false });

    const templatePath = path.resolve(process.cwd(), 'src/templates/forgot-password.html');
    const passwordResetTemplate = fs.readFileSync(templatePath, 'utf8');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const passwordResetContent = passwordResetTemplate
        .replace(/{{FRONTEND_URL}}/g, frontendUrl)
        .replace(/{{forgotPasswordToken}}/g, resetToken);

    await sendEmail(user.email, 'Change password for AetherBot', '', passwordResetContent);

    return ResponseWrapper.success(200, `An email has been sent to ${user.email}`);
});
