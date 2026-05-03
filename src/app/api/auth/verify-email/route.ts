import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { verifyUserEmail } from '@/services/server/authService';

export const POST = apiHandler(async (request: NextRequest) => {
    const body: { token?: string } = await request.json();
    const { token } = body;

    if (!token) throw new ErrorWrapper(400, 'Token is required');

    await verifyUserEmail(token);

    return ResponseWrapper.success(200, 'Email verified successfully');
});
