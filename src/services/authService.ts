import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import sendEmail from '@/utils/sendMail';
import { ErrorWrapper } from '@/lib/ResponseWrapper';

export interface ISignupPayload {
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
}

export const registerUser = async (data: ISignupPayload) => {
    await connectToDB();

    const userExists = await User.findOne({ email: data.email });
    if (userExists) throw new ErrorWrapper(400, 'This account is already registered');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password!, salt);
    const hashedToken = uuidv4();

    const newUser = new User({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        avatar: data.avatar,
        verifyToken: hashedToken,
        verifyTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
    });

    const user = await newUser.save();

    // 4. Send Email
    const templatePath = path.resolve(process.cwd(), 'src/templates/verificationTemplate.html');
    const verifyTemplate = fs.readFileSync(templatePath, 'utf8');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const verificationContent = verifyTemplate
        .replace(/{{name}}/g, user.name)
        .replace(/{{FRONTEND_URL}}/g, frontendUrl)
        .replace(/{{verifyToken}}/g, user.verifyToken);

    await sendEmail(user.email, 'Account Verification', '', verificationContent);
};

export const verifyUserEmail = async (token: string) => {
    await connectToDB();

    const user = await User.findOne({
        verifyToken: token,
        verifyTokenExpiry: { $gt: Date.now() },
    });

    if (!user) throw new ErrorWrapper(400, 'Invalid or expired token');

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;

    await user.save();
};

export const initiatePasswordReset = async (email: string) => {
    await connectToDB();

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

    return user.email;
};

export const executePasswordReset = async (token: string, newPassword: string) => {
    await connectToDB();

    const user = await User.findOne({
        forgotPasswordToken: token,
        forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) throw new ErrorWrapper(400, 'Invalid or expired link');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;

    await user.save();
};
