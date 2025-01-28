import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isLoggedIn = !!req.nextauth.token;
    const isAppRoute = req.nextUrl.pathname.startsWith('/app');

    // If trying to access /app routes without being logged in
    if (isAppRoute && !isLoggedIn) {
      return NextResponse.redirect(new URL('/signup', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/signup',
    }
  }
);

// Protect all routes under /app
export const config = {
  matcher: [
    '/app/:path*',
    '/role-selection',
    '/settings/:path*'
  ]
}; 