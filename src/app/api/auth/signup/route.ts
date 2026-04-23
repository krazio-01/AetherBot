import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { registerUser, ISignupPayload } from '@/services/authService';

export const POST = apiHandler(async (request: NextRequest) => {
    const body: ISignupPayload = await request.json();
    const { name, email, password, avatar } = body;

    if (!name || !email || !password) throw new ErrorWrapper(400, 'Please fill all fields');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new ErrorWrapper(400, 'Invalid email format');

    const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new ErrorWrapper(
            400,
            'Password must be at least 8 characters long and include at least one special character',
        );
    }

    await registerUser({ name, email, password, avatar });

    return ResponseWrapper.success(201, 'Registration successful');
});
