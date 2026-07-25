import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ADMIN_ONLY_API_PREFIXES, ADMIN_ONLY_PREFIXES, PROTECTED_PREFIXES } from '@/lib/rbac';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isProtectedPage = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdminPage = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdminApi = ADMIN_ONLY_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith('/api/') && !pathname.startsWith('/api/public') && !pathname.startsWith('/api/auth');

  if (isProtectedPage && !isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedPage && isAdminPage && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard?error=forbidden', req.nextUrl.origin));
  }

  if (isApi && !isLoggedIn) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  if (isApi && isAdminApi && role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'You do not have permission to perform this action' },
      { status: 403 }
    );
  }

  // Secure cookie / security headers on every response
  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
