import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { initiatePasswordReset } from '@/services/server/authService';

interface IForgotPasswordBody {
    email?: string;
}

export const POST = apiHandler(async (request: NextRequest) => {
    const body: IForgotPasswordBody = await request.json();
    const { email } = body;

    if (!email) throw new ErrorWrapper(400, 'Email is required');

    await initiatePasswordReset(email);

    return ResponseWrapper.success(200, 'If this email is registered, a reset link has been sent.');
});
