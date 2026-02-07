// ============================================================
// Middleware - Route Protection & Role-Based Access
// Runs on Edge; reads the signed session cookie to guard routes.
// ============================================================

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionValue, type SessionData } from "@/lib/session"

const SESSION_COOKIE_NAME = "apcs_session"

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"]

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If user is already logged in and tries to visit /login, redirect to dashboard
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (sessionCookie) {
      const session = await verifySessionValue(sessionCookie)
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
    return NextResponse.next()
  }

  // Check authentication for all other routes
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const session: SessionData | null = await verifySessionValue(sessionCookie)
  if (!session) {
    // Invalid session, clear cookie and redirect
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  // Check admin-only routes
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and API internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
