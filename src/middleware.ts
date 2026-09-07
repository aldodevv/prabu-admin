import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Safely read and decode a cookie value.
 * Cookies are set with encodeURIComponent in cookieUtils.ts,
 * so we need to decode them here.
 */
function getDecodedCookie(request: NextRequest, name: string): string | undefined {
  const raw = request.cookies.get(name)?.value;
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    // If decoding fails, try the raw value (backward compatibility)
    return raw;
  }
}

export function middleware(request: NextRequest) {
  const token = getDecodedCookie(request, 'prabu_admin_token');
  const branchID = getDecodedCookie(request, 'prabu_admin_branch_id');
  const { pathname } = request.nextUrl;

  // Protected paths
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/branch-select') ||
    pathname === '/';

  // Auth paths
  const isAuthPath = pathname.startsWith('/login');

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isProtectedPath && token) {
    // If not selected a branch and trying to access dashboard, redirect to branch select
    if (pathname.startsWith('/dashboard') && !branchID) {
      return NextResponse.redirect(new URL('/branch-select', request.url));
    }
  }

  if (isAuthPath && token) {
    if (branchID) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/branch-select', request.url));
  }

  // Redirect root / to /dashboard
  if (pathname === '/' && token) {
    if (branchID) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/branch-select', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/branch-select', '/login', '/'],
};
export default middleware;

