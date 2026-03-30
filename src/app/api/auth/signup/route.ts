import { NextRequest } from 'next/server';
import User from '@/models/userModel';
import connectToDB from '@/utils/dbConnect';
import sendEmail from '@/utils/sendMail';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

interface ISignupBody {
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
}

export const POST = apiHandler(async (request: NextRequest) => {
    await connectToDB();

    const body: ISignupBody = await request.json();
    const { name, email, password, avatar } = body;

    if (!name || !email || !password) throw new ErrorWrapper(400, 'Please fill all fields');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new ErrorWrapper(400, 'Invalid email format');

    const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password))
        throw new ErrorWrapper(
            400,
            'Password must be at least 8 characters long and include at least one special character',
        );

    const userExists = await User.findOne({ email });
    if (userExists) throw new ErrorWrapper(400, 'This account is already registered');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedToken = uuidv4();

    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        avatar,
        verifyToken: hashedToken,
        verifyTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
    });

    const user = await newUser.save();

    const templatePath = path.resolve(process.cwd(), 'src/templates/verificationTemplate.html');
    const verifyTemplate = fs.readFileSync(templatePath, 'utf8');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const verificationContent = verifyTemplate
        .replace(/{{name}}/g, user.name)
        .replace(/{{FRONTEND_URL}}/g, frontendUrl)
        .replace(/{{verifyToken}}/g, user.verifyToken);

    await sendEmail(user.email, 'Account Verification', '', verificationContent);

    return ResponseWrapper.successWithData({ user }, 201, 'Registration successful');
});
