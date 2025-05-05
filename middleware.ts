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
  // Create a new response that we'll manipulate
  const res = NextResponse.next()
  
  try {
    // For API routes, make sure we preserve the cookies and headers
    const isApiRoute = req.nextUrl.pathname.startsWith('/api/')
    
    // Create a Supabase client specifically for this middleware
    const supabase = createMiddlewareClient({ req, res })
    
    // Always try to refresh the session to keep it valid
    await supabase.auth.getSession()
    
    // For debugging, you can log API route requests
    if (isApiRoute) {
      console.log(`[Middleware] API request to ${req.nextUrl.pathname}`)
    }
    
    // Auth routes - exact matches only
    const authRoutes = ["/login", "/signup"]
    const isAuthRoute = authRoutes.some(
      (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
    )
    
    // Get latest session state
    const { data: { session } } = await supabase.auth.getSession()
    
    // Redirect to home if accessing auth route with session
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  } catch (error) {
    // If there's an error in the middleware, log and continue
    console.error("Middleware error:", error)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|images|robots.txt|sitemap.xml).*)',
  ],
}

