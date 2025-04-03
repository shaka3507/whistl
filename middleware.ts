import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Track recent authentication failures
const authFailures = {
  count: 0,
  lastFailure: 0,
  backoffTime: 5000 // 5 seconds initial backoff
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check for cached auth status first - extend cache to 10 minutes
  const hasCachedSession = req.cookies.get('sb-auth-status')?.value
  const cachedValue = hasCachedSession === 'authenticated' ? true : hasCachedSession === 'unauthenticated' ? false : null
  
  // Only check with Supabase if we don't have a cached value
  let session = null
  
  // Skip auth check if we recently hit a rate limit
  const now = Date.now()
  const timeSinceLastFailure = now - authFailures.lastFailure
  
  // If this is a redirect loop, detected by checking for redirectedFrom query param
  const url = new URL(req.url)
  const redirectedFrom = url.searchParams.get('redirectedFrom')
  if (redirectedFrom) {
    // Clear the redirectedFrom param to prevent infinite loops
    url.searchParams.delete('redirectedFrom')
    return NextResponse.redirect(url)
  }
  
  if (cachedValue === null && (authFailures.count === 0 || timeSinceLastFailure > authFailures.backoffTime)) {
    try {
      const { data } = await supabase.auth.getUser()
      session = data.user ? { user: data.user } : null
      
      // Reset failures on success
      if (authFailures.count > 0) {
        authFailures.count = 0
        authFailures.backoffTime = 5000
      }
      
      // Cache the result in a cookie for 10 minutes
      res.cookies.set('sb-auth-status', session ? 'authenticated' : 'unauthenticated', {
        maxAge: 600, // 10 minutes in seconds
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
    } catch (error) {
      console.error('Auth check error:', error)
      // Track the failure for exponential backoff
      authFailures.count++
      authFailures.lastFailure = now
      authFailures.backoffTime = Math.min(authFailures.backoffTime * 2, 60000) // Max 1 minute backoff
      
      // If we hit rate limit, default to allowing the request and letting the client handle auth
      return res
    }
  } else if (cachedValue !== null) {
    // Use cached value
    session = cachedValue ? { user: {} } : null
  }

  // Protected routes - make this more specific to only include routes that need protection
  const protectedRoutes = ["/admin", "/profile"]
  const isProtectedRoute = protectedRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`),
  )

  // If no session and trying to access protected route
  if (cachedValue === false && isProtectedRoute) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/channels/:path*", "/admin/:path*", "/profile/:path*", "/channels", "/admin", "/profile"],
}

