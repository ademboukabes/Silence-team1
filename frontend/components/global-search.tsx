"use client"

// ============================================================
// Global Search Component
// Searches across bookings, terminals, carriers, and users.
// Uses useRouter().push() for real App Router navigation.
// Session data passed as prop — no useAuth.
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Ship, Container, Users, FileText, Anchor } from "lucide-react"
// TODO: Implement backend integration / review API response
import { mockBookings, mockTerminals, mockCarriers, mockUsers } from "@/lib/mock-data"
import type { SessionData } from "@/lib/session"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  id: string
  title: string
  subtitle: string
  category: "booking" | "terminal" | "carrier" | "user"
  page: string // route path to navigate to
}

interface GlobalSearchProps {
  session: SessionData
}

export function GlobalSearch({ session }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const categoryConfig = {
    booking: { icon: FileText, label: "Booking", color: "bg-primary text-primary-foreground" },
    terminal: { icon: Container, label: "Terminal", color: "bg-accent text-accent-foreground" },
    carrier: { icon: Ship, label: "Carrier", color: "bg-warning text-warning-foreground" },
    user: { icon: Users, label: "User", color: "bg-success text-success-foreground" },
  }

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([])
        return
      }

      const q = searchQuery.toLowerCase()
      const found: SearchResult[] = []

      // Search bookings
      for (const b of mockBookings) {
        if (
          b.bookingNumber.toLowerCase().includes(q) ||
          b.carrier.toLowerCase().includes(q) ||
          b.truckPlate.toLowerCase().includes(q) ||
          b.terminalName.toLowerCase().includes(q)
        ) {
          found.push({
            id: b.id,
            title: b.bookingNumber,
            subtitle: `${b.carrier} - ${b.terminalName} - ${b.status}`,
            category: "booking",
            page: "/bookings",
          })
        }
        if (found.length >= 20) break
      }

      // Search terminals
      for (const t of mockTerminals) {
        if (
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q)
        ) {
          found.push({
            id: t.id,
            title: t.name,
            subtitle: `Code: ${t.code} - ${t.congestion} congestion - ${t.usedSlots}/${t.totalSlots} slots`,
            category: "terminal",
            page: "/terminal-map",
          })
        }
      }

      // Search carriers
      for (const c of mockCarriers) {
        if (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
        ) {
          found.push({
            id: c.id,
            title: c.name,
            subtitle: `Code: ${c.code} - ${c.country} - ${c.activeBookings} active bookings`,
            category: "carrier",
            page: session.role === "admin" ? "/admin/users" : "/bookings",
          })
        }
      }

      // Search users (admin only)
      if (session.role === "admin") {
        for (const u of mockUsers) {
          if (u.role === "admin") continue
          if (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
          ) {
            found.push({
              id: u.id,
              title: u.name,
              subtitle: `${u.email} - ${u.role}`,
              category: "user",
              page: "/admin/users",
            })
          }
        }
      }

      setResults(found.slice(0, 12))
      setSelectedIndex(0)
    },
    [session.role],
  )

  useEffect(() => {
    performSearch(query)
  }, [query, performSearch])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.page)
    setQuery("")
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Group results by category
  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.category]) acc[r.category] = []
      acc[r.category].push(r)
      return acc
    },
    {} as Record<string, SearchResult[]>,
  )

  let globalIdx = -1

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (query.length >= 2) setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search bookings, terminals, carriers..."
        className="h-9 w-72 rounded-lg border border-input bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Global search"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("")
            setIsOpen(false)
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-96 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(grouped).map(([category, items]) => {
              const config = categoryConfig[category as keyof typeof categoryConfig]
              const Icon = config.icon
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {config.label}s
                    </span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {items.length}
                    </Badge>
                  </div>
                  {items.map((result) => {
                    globalIdx++
                    const idx = globalIdx
                    return (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors ${
                          selectedIndex === idx ? "bg-accent/10" : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-sm font-medium text-card-foreground">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                {"↑↓"}
              </kbd>
              <span className="text-[10px] text-muted-foreground">navigate</span>
              <kbd className="ml-1 rounded border border-border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                {"↵"}
              </kbd>
              <span className="text-[10px] text-muted-foreground">select</span>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-96 rounded-lg border border-border bg-card p-6 text-center shadow-lg">
          <Anchor className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium text-card-foreground">No results found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {"Try searching for a booking number, terminal name, or carrier"}
          </p>
        </div>
      )}
    </div>
  )
}
