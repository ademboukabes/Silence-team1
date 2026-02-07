"use client"

// ============================================================
// Main Sidebar Navigation
// Uses Next.js Link + usePathname for real App Router navigation.
// Session data is passed from the server layout — no useAuth.
// ============================================================

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,
  Map,
  Users,
  Settings,
  BarChart3,
  Shield,
  Container,
} from "lucide-react"
import { ApcsLogo } from "@/components/apcs-logo"
import type { SessionData } from "@/lib/session"

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/dashboard" },
  { label: "Bookings", icon: <CalendarCheck className="h-5 w-5" />, href: "/bookings" },
  { label: "Terminal Map", icon: <Map className="h-5 w-5" />, href: "/terminal-map" },
  { label: "Terminal Config", icon: <Container className="h-5 w-5" />, href: "/terminals" },
  { label: "User Management", icon: <Users className="h-5 w-5" />, href: "/admin/users", adminOnly: true },
  { label: "Analytics", icon: <BarChart3 className="h-5 w-5" />, href: "/admin/analytics", adminOnly: true },
  { label: "Audit Logs", icon: <Shield className="h-5 w-5" />, href: "/admin/audit", adminOnly: true },
]

interface AppSidebarProps {
  session: SessionData
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = session.role === "admin"

  // Filter items based on role
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  // Group items into shared and admin sections
  const sharedItems = visibleItems.filter((item) => !item.adminOnly)
  const adminItems = visibleItems.filter((item) => item.adminOnly)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <aside className="flex h-full w-64 flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-6 py-5">
        <ApcsLogo width={37} className="text-[hsl(var(--sidebar-primary))]" />
        <div>
          <h1 className="text-sm font-bold tracking-wide text-[hsl(var(--sidebar-accent-foreground))]">
            APCS Booking
          </h1>
          <p className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-60">Port Community System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Shared section */}
        <div className="mb-2">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider opacity-50">
            Operations
          </p>
          {sharedItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
              }`}
            >
              <span className={isActive(item.href) ? "text-[hsl(var(--sidebar-primary))]" : "opacity-70"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Admin section */}
        {adminItems.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider opacity-50">
              Administration
            </p>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                }`}
              >
                <span className={isActive(item.href) ? "text-[hsl(var(--sidebar-primary))]" : "opacity-70"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User info footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary))] text-xs font-bold text-[hsl(var(--sidebar-primary-foreground))]">
            {session.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[hsl(var(--sidebar-accent-foreground))]">
              {session.name}
            </p>
            <p className="truncate text-xs capitalize opacity-60">{session.role}</p>
          </div>
          <Settings className="h-4 w-4 cursor-pointer opacity-50 transition-opacity hover:opacity-100" />
        </div>
      </div>
    </aside>
  )
}
