// ============================================================
// Next.js Middleware — Auth session refresh + route protection
//
// Runs on every request BEFORE the page renders. Responsibilities:
//  1. Refresh the Supabase session cookie so it never expires mid-visit.
//  2. Redirect unauthenticated users from protected routes to /auth/login.
//  3. Redirect authenticated users away from auth pages.
// ============================================================
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Routes that require an active session
const PROTECTED_ROUTES = ['/', '/neighborhood', '/messages', '/services', '/profile'];
// Routes only for unauthenticated users
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          // Write cookies on both the request (for downstream) and response
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  // Supabase token refresh happens inside getUser().
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If Supabase isn't configured (demo mode), skip auth redirects entirely
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co';

  if (!isDemoMode) {
    const isProtected = PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
    const isAuthPage  = AUTH_ROUTES.includes(pathname);

    if (!user && isProtected) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user && isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
