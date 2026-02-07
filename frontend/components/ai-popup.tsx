"use client"

// ============================================================
// Floating AI Assistant Popup Button
// Opens the AI chat in a popover/modal overlay.
// Session data passed as prop — no useAuth.
// ============================================================

import { useState } from "react"
import { Bot, X } from "lucide-react"
import { AIChatInterface } from "@/components/pages/ai-assistant-page"
import type { SessionData } from "@/lib/session"

export function AIPopupButton({ session }: { session: SessionData }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Popup overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          {/* Chat panel */}
          <div className="relative z-10 flex h-[560px] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Popup header */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                  <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <p className="text-sm font-semibold text-card-foreground">APCS AI Assistant</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Close AI Assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat body */}
            <div className="flex-1 overflow-hidden">
              <AIChatInterface compact session={session} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
