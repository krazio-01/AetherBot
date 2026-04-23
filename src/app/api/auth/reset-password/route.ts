import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { executePasswordReset } from '@/services/authService';

interface IResetPasswordBody {
    token?: string;
    newPassword?: string;
}

export const PUT = apiHandler(async (request: NextRequest) => {
    const body: IResetPasswordBody = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) throw new ErrorWrapper(400, 'Token and new password are required');

    const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new ErrorWrapper(
            400,
            'Password must be at least 8 characters long and include at least one special character',
        );
    }

    await executePasswordReset(token, newPassword);

    return ResponseWrapper.success(200, 'Password reset successfully');
});
