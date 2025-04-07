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

  // Get and refresh the session if needed
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  // Protected routes - exact matches only
  const protectedRoutes = ["/admin", "/channels", "/profile"]
  // const isProtectedRoute = protectedRoutes.some(
  //   (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
  // )

  // Auth routes - exact matches only
  const authRoutes = ["/login", "/signup"]
  const isAuthRoute = authRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
  )

  // If there's an error getting the session, allow the request to proceed
  // This prevents redirect loops when there are auth issues
  if (sessionError) {
    console.error("Session error:", sessionError)
    return res
  }

  // Redirect to login if accessing protected route without session
  // if (isProtectedRoute && !session) {
  //   const redirectUrl = new URL("/login", req.url)
  //   redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
  //   return NextResponse.redirect(redirectUrl)
  // }

  // Redirect to home if accessing auth route with session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

