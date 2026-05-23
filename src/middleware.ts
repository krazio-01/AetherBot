import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password']);

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname, searchParams } = request.nextUrl;

    if (pathname === '/reset-password' && !searchParams.has('token'))
        return NextResponse.redirect(new URL('/', request.url));

    const isPublicPath = PUBLIC_PATHS.has(pathname);
    const token = await getToken({ req: request });

    if (token) {
        if (isPublicPath) return NextResponse.redirect(new URL('/chat', request.url));
    } else {
        if (!isPublicPath) return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/chat',
        '/chat/:chatId*',
        '/login',
        '/register',
        '/verify-email',
        '/forgot-password',
        '/reset-password',
    ],
};
