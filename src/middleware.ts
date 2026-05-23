import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super-secret-jwt-key-change-in-production-12345')) {
  console.warn(
    '🚨 [SECURITY WARNING]: JWT_SECRET is either missing or using the default fallback key in production! ' +
    'Please set a strong cryptographically secure JWT_SECRET environment variable in your Google Cloud Run settings to protect admin sessions.'
  );
}

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
