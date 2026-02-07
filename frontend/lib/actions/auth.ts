"use server"

// ============================================================
// Authentication Server Actions
// Handles login/logout via server-side session management.
// In production, these would call an external API for validation.
// ============================================================

import { redirect } from "next/navigation"
import { createSession, destroySession } from "@/lib/session"
import { mockUsers } from "@/lib/mock-data"

export interface LoginResult {
  success: boolean
  error?: string
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required." }
  }

  // TODO: Implement backend integration / review API response
  // Example external API endpoint: https://api.example.com/auth/login
  // In production: const response = await fetch("https://api.example.com/auth/login", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ email, password }),
  // })

  // Mock: find user by email
  const user = mockUsers.find((u) => u.email === email)
  if (!user) {
    return { success: false, error: "Invalid credentials. Use one of the demo accounts." }
  }

  await createSession(user)
  redirect("/dashboard")
}

export async function quickLoginAction(email: string): Promise<LoginResult> {
  if (!email) {
    return { success: false, error: "Email is required." }
  }

  // TODO: Implement backend integration / review API response
  // This is a demo-only action for quick login
  const user = mockUsers.find((u) => u.email === email)
  if (!user) {
    return { success: false, error: "Invalid credentials." }
  }

  await createSession(user)
  redirect("/dashboard")
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect("/login")
}
