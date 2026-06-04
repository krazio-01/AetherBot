import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '@/utils/sendMail';
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
        verifyTokenExpiry: new Date(Date.now() + 86400000), // 24 hours
    });

    const user = await newUser.save();

    // 4. Send Email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await sendEmail(user.email, 'Account Verification', 'verify-account.html', {
        name: data.name || 'User',
        verifyLink: `${frontendUrl}/verify-email?token=${hashedToken}`,
    });
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
    if (!user) return;

    const PASSWORD_RESET_TTL = 900000; // 15 min
    const PASSWORD_RESET_COOLDOWN = 60000; // 1 min

    if (user.forgotPasswordTokenExpiry && user.forgotPasswordTokenExpiry.getTime() > Date.now()) {
        const timeRemaining = user.forgotPasswordTokenExpiry.getTime() - Date.now();
        const timePassed = PASSWORD_RESET_TTL - timeRemaining;

        if (timePassed < PASSWORD_RESET_COOLDOWN) {
            const waitTime = Math.ceil((PASSWORD_RESET_COOLDOWN - timePassed) / 1000);
            throw new ErrorWrapper(429, `Please wait ${waitTime} seconds before requesting another link.`);
        }
    }

    const resetToken = uuidv4();

    user.forgotPasswordToken = resetToken;
    user.forgotPasswordTokenExpiry = new Date(Date.now() + PASSWORD_RESET_TTL);

    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await sendEmail(user.email, 'Change password for AetherBot', 'reset-password.html', {
        name: user.name || 'User',
        resetLink: `${frontendUrl}/reset-password?token=${resetToken}`,
    });
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
