// ============================================================
// Server-Side Session Management
// Uses signed, HTTP-only cookies to store session data.
// Compatible with Edge Runtime (middleware) via Web Crypto API.
// ============================================================

import { cookies } from "next/headers"
import type { User, UserRole } from "./types"

const SESSION_COOKIE_NAME = "apcs_session"
const SECRET = process.env.SESSION_SECRET || "apcs-default-secret-change-in-production"

// --- Signing utilities (Web Crypto compatible for Edge) ---

async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `${payload}.${sigHex}`
}

async function verify(signedValue: string): Promise<string | null> {
  const lastDot = signedValue.lastIndexOf(".")
  if (lastDot === -1) return null
  const payload = signedValue.slice(0, lastDot)
  const expected = await sign(payload)
  if (expected === signedValue) return payload
  return null
}

// --- Session data shape ---

export interface SessionData {
  userId: string
  name: string
  email: string
  role: UserRole
  assignedTerminals: string[]
}

// --- Create session (used after login) ---

export async function createSession(user: User): Promise<void> {
  const data: SessionData = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedTerminals: user.assignedTerminals,
  }

  const payload = Buffer.from(JSON.stringify(data)).toString("base64url")
  const signedValue = await sign(payload)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

// --- Get session (for server components & server actions) ---

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)
  if (!cookie?.value) return null

  const payload = await verify(cookie.value)
  if (!payload) return null

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))
    return data as SessionData
  } catch {
    return null
  }
}

// --- Destroy session (logout) ---

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// --- Helper: verify from raw cookie value (for middleware, no cookies() access) ---

export async function verifySessionValue(cookieValue: string): Promise<SessionData | null> {
  const payload = await verify(cookieValue)
  if (!payload) return null

  try {
    // In Edge Runtime, Buffer may not be available, use atob-based decode
    const decoded = decodeBase64Url(payload)
    return JSON.parse(decoded) as SessionData
  } catch {
    return null
  }
}

function decodeBase64Url(str: string): string {
  // Replace URL-safe chars with standard base64
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  return atob(padded)
}
