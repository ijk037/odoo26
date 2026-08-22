import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Auth-only pages — skip auth check but still refresh session
const AUTH_ROUTES = [
  '/admin/login',
  '/manager/login',
  '/employee/login',
  '/employee/signup',
  '/setup',
  '/api/auth',
]

// Protected route prefixes that require a valid session
const PROTECTED_PREFIXES = ['/admin', '/manager', '/employee']

export async function proxy(request: NextRequest) {
  // Start with a plain "next" response — we will mutate this to carry refreshed cookies
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // CRITICAL: cookies set here must land on supabaseResponse so the
        // refreshed session is forwarded to the browser AND to Server Components.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚠️ ALWAYS call getUser() — this is what refreshes the session token.
  // Never skip it, even for auth/public routes.
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  console.log("[PROXY] pathname:", pathname);
  console.log("[PROXY] authenticated:", !!user);

  // --- API routes and static assets: always pass through ---
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return supabaseResponse
  }

  // --- Auth pages: if user is already logged in, redirect to their dashboard ---
  const isAuthPage = AUTH_ROUTES.some(r => pathname.startsWith(r))
  if (isAuthPage) {
    if (user) {
      // Fetch role to redirect to correct portal
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin')    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (profile?.role === 'manager')  return NextResponse.redirect(new URL('/manager/dashboard', request.url))
      if (profile?.role === 'employee') return NextResponse.redirect(new URL('/employee/dashboard', request.url))
    }
    return supabaseResponse
  }

  // --- Protected pages: redirect to login if no session ---
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    let loginUrl = '/employee/login'
    if (pathname.startsWith('/admin'))   loginUrl = '/admin/login'
    if (pathname.startsWith('/manager')) loginUrl = '/manager/login'
    return NextResponse.redirect(new URL(loginUrl, request.url))
  }

  // --- Everything else: pass through with refreshed cookies ---
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
