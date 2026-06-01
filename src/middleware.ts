import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password']);
const PROTECTED_PATHS = new Set<string>();

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname, searchParams } = request.nextUrl;

    const isExcludedPath =
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next/') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml';

    if (isExcludedPath) return NextResponse.next();

    if (pathname === '/reset-password' && !searchParams.has('token'))
        return NextResponse.redirect(new URL('/', request.url));

    const isPublicPath = PUBLIC_PATHS.has(pathname);
    const isProtectedPath = PROTECTED_PATHS.has(pathname);

    const token = await getToken({ req: request });

    if (token && isPublicPath) return NextResponse.redirect(new URL('/chat', request.url));

    if (!token && isProtectedPath) return NextResponse.redirect(new URL('/login', request.url));

    return NextResponse.next();
}

export const config = {
    matcher: ['/:path*'],
};
