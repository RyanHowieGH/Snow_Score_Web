// middleware.ts (Revised - Lightweight)
import { NextResponse, type NextRequest } from 'next/server';

// Define the expected session cookie name (must match lucia config)
const SESSION_COOKIE_NAME = "auth_session";

export async function middleware(request: NextRequest) {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    const userIsPotentiallyAuthenticated = !!sessionId; // Simple check for cookie presence
    const pathname = request.nextUrl.pathname;

    // If user is not potentially authenticated and trying to access protected routes
    if (!userIsPotentiallyAuthenticated && pathname.startsWith('/admin')) {
        console.log("Middleware: No session cookie, redirecting to login from", pathname);
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If user IS potentially authenticated and trying to access login page
    if (userIsPotentiallyAuthenticated && pathname === '/login') {
        console.log("Middleware: Session cookie exists, redirecting from login to /admin");
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Allow the request to proceed
    return NextResponse.next();
}

// Config remains the same
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}