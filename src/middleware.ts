import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  // If the user is trying to access an /admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Let verifyAuth do the cookie checking and HMAC validation
    // Note: Edge runtime doesn't support 'bcryptjs' or 'pg', but our verifyAuth 
    // only uses crypto.subtle and cookies, so it is edge compatible!
    const userId = await verifyAuth();
    
    if (!userId) {
      // Redirect to login if unauthenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If trying to access login while already logged in
  if (request.nextUrl.pathname === '/login') {
    const userId = await verifyAuth();
    if (userId) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
