"use client"

// ============================================================
// Login Page
// Email-based login with role display and quick login buttons.
// Calls server actions for auth — no client-side AuthContext.
// ============================================================

import React, { useState } from "react"
import { LogIn, AlertCircle } from "lucide-react"
import { ApcsLogo } from "@/components/apcs-logo"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { loginAction, quickLoginAction } from "@/lib/actions/auth"

// Quick login credentials for demo
const quickLogins = [
  { label: "Admin", sublabel: "Carlos Mendez", email: "carlos@portauthority.com", role: "admin" },
  { label: "Operator", sublabel: "Elena Rodriguez", email: "elena@portauthority.com", role: "operator" },
]

export function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)

    // If we reach here, login failed (success redirects server-side)
    setError(result.error || "Invalid credentials.")
    setLoading(false)
  }

  const handleQuickLogin = async (email: string) => {
    setError("")
    setLoading(true)

    const result = await quickLoginAction(email)

    // If we reach here, login failed (success redirects server-side)
    setError(result.error || "Invalid credentials.")
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and title */}
        <div className="text-center">
          <ApcsLogo width={67} className="mx-auto text-primary" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">APCS Booking</h1>
          <p className="mt-1 text-sm text-muted-foreground">Algerian Port Community System</p>
        </div>

        {/* Login form */}
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold text-card-foreground">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@portauthority.com"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="mt-1"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2 bg-primary text-primary-foreground" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick login buttons for demo */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
              Demo Quick Login
            </p>
            <div className="grid grid-cols-2 gap-3">
              {quickLogins.map((ql) => (
                <button
                  key={ql.email}
                  onClick={() => handleQuickLogin(ql.email)}
                  disabled={loading}
                  className={`rounded-lg border p-3 text-left transition-all hover:shadow-md disabled:opacity-50 ${
                    ql.role === "admin"
                      ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                      : "border-accent/30 bg-accent/5 hover:bg-accent/10"
                  }`}
                >
                  <p className={`text-sm font-bold ${ql.role === "admin" ? "text-primary" : "text-accent"}`}>
                    {ql.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ql.sublabel}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{ql.email}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          APCS Booking v2.1.0 - Algerian Port Community System
        </p>
      </div>
    </div>
  )
}
