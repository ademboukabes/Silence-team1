"use client"

// ============================================================
// Top Header Bar
// Shows page title, search, notifications, and user controls.
// Uses usePathname() for the current page title.
// Session data is passed from the server layout — no useAuth.
// ============================================================

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Bell, LogOut, ChevronDown } from "lucide-react"
import type { SessionData } from "@/lib/session"
import { logoutAction } from "@/lib/actions/auth"
// TODO: Implement backend integration / review API response
import { mockNotifications } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "@/components/global-search"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Page title mapping by pathname
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/bookings": "Booking Management",
  "/terminal-map": "Terminal Overview",
  "/ai-assistant": "AI Assistant",
  "/admin/users": "User Management",
  "/terminals": "Terminal Configuration",
  "/admin/analytics": "Analytics & Reports",
  "/admin/audit": "Audit Logs",
}

interface AppHeaderProps {
  session: SessionData
}

export function AppHeader({ session }: AppHeaderProps) {
  const pathname = usePathname()
  const unreadCount = mockNotifications.filter((n) => !n.read).length
  const [showNotifications, setShowNotifications] = useState(false)

  const pageTitle = pageTitles[pathname] || "Dashboard"

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: Page title */}
      <div>
        <h2 className="text-lg font-semibold text-card-foreground">
          {pageTitle}
        </h2>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Right: Search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <GlobalSearch session={session} />

        {/* Notifications dropdown */}
        <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
            <DropdownMenuSeparator />
            {mockNotifications.slice(0, 5).map((notif) => (
              <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3">
                <div className="flex w-full items-center gap-2">
                  <Badge
                    variant={
                      notif.type === "error"
                        ? "destructive"
                        : notif.type === "warning"
                          ? "secondary"
                          : "default"
                    }
                    className={`text-[10px] ${
                      notif.type === "warning"
                        ? "bg-warning text-warning-foreground"
                        : notif.type === "success"
                          ? "bg-success text-success-foreground"
                          : ""
                    }`}
                  >
                    {notif.type}
                  </Badge>
                  {!notif.read && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{notif.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {session.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-foreground">{session.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{session.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => logoutAction()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
