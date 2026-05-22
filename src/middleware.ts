import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345';
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('bilasin_session')?.value;

    let isAuthed = false;
    if (token) {
      try {
        await jwtVerify(token, key);
        isAuthed = true;
      } catch (err) {
        // Token is invalid/expired
      }
    }

    // Route: /admin/login
    if (pathname === '/admin/login') {
      if (isAuthed) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Route: /admin/* (protected)
    if (!isAuthed) {
      // Redirect to login page and preserve the original URL in redirect search query if needed
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
