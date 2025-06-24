// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const placeholderPublishable = 'pk_test_12345678901234567890';
const placeholderSecret = 'sk_test_dummy';
const clerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== placeholderPublishable &&
  process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY !== placeholderSecret;

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',
  '/events/(.*)',
]);

// Ensure this is the correct URL PATH for your admin page
const ADMIN_DASHBOARD_PATH = '/admin';

const clerkMw = clerkMiddleware(async (auth, req: NextRequest) => {
  // MUST AWAIT here because TypeScript says auth() returns a Promise
  const authResult = await auth();
  const { userId } = authResult; // Destructure from the awaited result

  // Scenario 1: User is logged IN and trying to access the HOMEPAGE ('/')
  if (userId && req.nextUrl.pathname === '/') {
    const adminDashboardUrl = new URL(ADMIN_DASHBOARD_PATH, req.url);
    console.log(`[Middleware] Logged-in user (${userId}) on '/', redirecting to ${adminDashboardUrl.toString()}`);
    return NextResponse.redirect(adminDashboardUrl);
  }

  // Scenario 2: For any other route that is NOT public, protect it.
  if (!isPublicRoute(req)) {
    console.log(`[Middleware] Protecting non-public route: ${req.nextUrl.pathname}`);
    // auth.protect() is also an async operation as per Clerk docs and our prior understanding
    const protectionResponse = await auth.protect();
    if (protectionResponse instanceof Response) {
        return protectionResponse;
    }
  }
}, { debug: process.env.NODE_ENV === 'development' });

const noopMiddleware = () => NextResponse.next();

export default clerkConfigured ? clerkMw : noopMiddleware;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|images/|static/).*)', // Add known static folders
    '/(api|trpc)(.*)', // Keep this if your API routes need middleware
  ],
};
