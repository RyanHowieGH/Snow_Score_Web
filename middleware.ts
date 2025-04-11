// middleware.ts (Revised for Stytch Cookies)
import { NextResponse, type NextRequest } from 'next/server';

const STYTCH_SESSION_COOKIE = 'stytch_session'; // Opaque token cookie name
const STYTCH_JWT_COOKIE = 'stytch_session_jwt'; // JWT cookie name

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get(STYTCH_SESSION_COOKIE)?.value;
    const jwtCookie = request.cookies.get(STYTCH_JWT_COOKIE)?.value;
    const userIsPotentiallyAuthenticated = !!sessionCookie || !!jwtCookie;
    const pathname = request.nextUrl.pathname;

    // If user is not potentially authenticated and trying to access protected routes
    if (!userIsPotentiallyAuthenticated && pathname.startsWith('/admin')) {
        // ... redirect to login ...
         console.log("Middleware: No Stytch session cookie, redirecting to login from", pathname);
         const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url);
    }

    // If user IS potentially authenticated and trying to access login page
    if (userIsPotentiallyAuthenticated && pathname === '/login') {
        // ... redirect to admin ...
         console.log("Middleware: Stytch session cookie exists, redirecting from login to /admin");
         return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = { /* ... matcher ... */ };