"use client"

// ============================================================
// Authenticated Shell (Client Component)
// Wraps sidebar + header + main area for authenticated routes.
// Receives session from the server layout — no client-side auth.
// ============================================================

import type { SessionData } from "@/lib/session"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AIPopupButton } from "@/components/ai-popup"

export function AuthenticatedShell({
  session,
  children,
}: {
  session: SessionData
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar session={session} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader session={session} />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
          {children}
        </main>
        <footer className="flex items-center justify-between border-t border-border bg-card px-6 py-2">
          <p className="text-xs text-muted-foreground">APCS Booking v2.1.0</p>
          <p className="text-xs text-muted-foreground">Algerian Port Community System</p>
        </footer>
      </div>
      <AIPopupButton session={session} />
    </div>
  )
}
