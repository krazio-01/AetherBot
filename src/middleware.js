import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set([
    "/",
    "/login",
    "/register",
    "/verifyEmail",
    "/forgot-password",
    "/forgot-password/request",
]);
const PROTECTED_PATHS = new Set(["/chat"]);

export async function middleware(request) {
    const token = await getToken({ req: request });
    const { pathname, searchParams } = request.nextUrl;
    const tokenParams = searchParams.get("token");

    const isPublicPath = PUBLIC_PATHS.has(pathname);
    const isProtectedPath = [...PROTECTED_PATHS].some((protectedPath) =>
        pathname.startsWith(protectedPath)
    );

    if (pathname.startsWith("/forgot-password/change") && !tokenParams)
        return NextResponse.redirect(new URL("/", request.url));

    if (token) {
        if (isPublicPath || pathname.startsWith("/forgot-password/change"))
            return NextResponse.redirect(new URL("/chat", request.url));
    } else {
        if (isProtectedPath)
            return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}