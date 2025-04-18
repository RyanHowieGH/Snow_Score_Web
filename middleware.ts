// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)', // Allow webhook endpoint
]);


export default clerkMiddleware((auth, req) => {
    // By default, clerkMiddleware protects all routes NOT matched by isPublicRoute
    // So, we often don't need the explicit isProtectedRoute check here unless
    // we have specific logic for *only* those routes beyond just protection.

    // If you WANT explicit protection (maybe slightly clearer):
    // if (!isPublicRoute(req)) {
    //     console.log(`Middleware: Protecting non-public route: ${req.nextUrl.pathname}`);
    //     auth.protect();
    // }

    // Example: Role-based redirect *after* successful authentication
    // const { userId, sessionClaims } = auth;
    // if (userId && req.nextUrl.pathname === '/some-page' && sessionClaims?.metadata?.role !== 'requiredRole') {
    //     return Response.redirect(new URL('/unauthorized', req.url));
    // }

}, { debug: process.env.NODE_ENV === 'development' });

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};