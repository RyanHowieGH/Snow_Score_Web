// middleware.ts (or src/middleware.ts)
import { clerkMiddleware, createRouteMatcher, ClerkMiddlewareAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server'; // Import NextRequest type

// Define routes that should be publicly accessible
const isPublicRoute = createRouteMatcher([
  '/', // Landing page
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Add other public pages
]);

// Define routes that should *always* be protected
const isProtectedRoute = createRouteMatcher([
    '/admin(.*)', // Protect everything under /admin
    // Add other protected routes
]);

// --- Use the 'auth' object passed as the first argument ---
export default clerkMiddleware((auth: ClerkMiddlewareAuth, req: NextRequest) => {
  // Add explicit types for clarity

  // Protect routes based on the matcher
  if (isProtectedRoute(req)) {
      console.log(`Middleware: Protecting route: ${req.nextUrl.pathname}`);
      // --- Call protect() directly on the 'auth' argument ---
      auth.protect();
      // --- END CORRECTION ---
  }

  // Optional: Example of accessing userId within middleware (after protection/check)
  // if (!isPublicRoute(req)) {
  //     const { userId, sessionClaims } = auth; // Access properties directly
  //     console.log(`Middleware: Authenticated User ID: ${userId}, Path: ${req.nextUrl.pathname}`);
  //     // Example role redirect (ensure sessionClaims includes your custom role)
  //     // if (userId && sessionClaims?.metadata?.role === 'volunteer' && req.nextUrl.pathname.startsWith('/admin/users')) {
  //     //     return Response.redirect(new URL('/unauthorized', req.url));
  //     // }
  // }


}, { debug: process.env.NODE_ENV === 'development' });


export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};