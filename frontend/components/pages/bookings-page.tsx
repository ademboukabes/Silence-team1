"use client"

// ============================================================
// Bookings Management Page
// Full table with search, filter, column sorting, status editing,
// and QR generation. Operators can approve/reject; Admins view all.
// ============================================================

import { useState, useMemo, useCallback } from "react"
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  QrCode,
  Eye,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SessionData } from "@/lib/session"
// TODO: Implement backend integration / review API response
// Example mock API endpoint: https://mockapi.example.com/bookings
import { mockBookings, mockTerminals } from "@/lib/mock-data"
import type { Booking, BookingStatus } from "@/lib/types"

const PAGE_SIZE = 10

const statusColors: Record<BookingStatus, string> = {
  Pending: "bg-warning/10 text-warning border-warning/30",
  Confirmed: "bg-success/10 text-success border-success/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
  Consumed: "bg-primary/10 text-primary border-primary/30",
}

type SortField = "bookingNumber" | "carrier" | "terminalName" | "timeSlot" | "truckPlate" | "containerType" | "status"
type SortDirection = "asc" | "desc"

interface SortConfig {
  field: SortField
  direction: SortDirection
}

const columns: { key: SortField; label: string }[] = [
  { key: "bookingNumber", label: "Booking #" },
  { key: "carrier", label: "Carrier" },
  { key: "terminalName", label: "Terminal" },
  { key: "timeSlot", label: "Time Slot" },
  { key: "truckPlate", label: "Truck" },
  { key: "containerType", label: "Container" },
  { key: "status", label: "Status" },
]

export function BookingsPage({ session }: { session: SessionData }) {
  const isAdmin = session.role === "admin"

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [terminalFilter, setTerminalFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [bookings, setBookings] = useState<Booking[]>(mockBookings)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showQR, setShowQR] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)

  // Toggle sort on a column
  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => {
      if (prev?.field === field) {
        if (prev.direction === "asc") return { field, direction: "desc" }
        // If already desc, remove sort
        return null
      }
      return { field, direction: "asc" }
    })
    setCurrentPage(1)
  }, [])

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let result = bookings

    // Operators see only their assigned terminals
    if (!isAdmin) {
      result = result.filter((b) => session.assignedTerminals.includes(b.terminalId))
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.carrier.toLowerCase().includes(q) ||
          b.terminalName.toLowerCase().includes(q) ||
          b.truckPlate.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter)
    }

    // Terminal filter
    if (terminalFilter !== "all") {
      result = result.filter((b) => b.terminalId === terminalFilter)
    }

    // Sort
    if (sortConfig) {
      const { field, direction } = sortConfig
      result = [...result].sort((a, b) => {
        let aVal = a[field]
        let bVal = b[field]
        // timeSlot is a date string, compare as dates
        if (field === "timeSlot") {
          const aTime = new Date(aVal).getTime()
          const bTime = new Date(bVal).getTime()
          return direction === "asc" ? aTime - bTime : bTime - aTime
        }
        // String comparison
        aVal = String(aVal).toLowerCase()
        bVal = String(bVal).toLowerCase()
        if (aVal < bVal) return direction === "asc" ? -1 : 1
        if (aVal > bVal) return direction === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [bookings, searchQuery, statusFilter, terminalFilter, isAdmin, session, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE)
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus, updatedAt: new Date().toISOString() } : b
      )
    )
  }

  const getSortIcon = (field: SortField) => {
    if (sortConfig?.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    if (sortConfig.direction === "asc") return <ArrowUp className="h-3 w-3" />
    return <ArrowDown className="h-3 w-3" />
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by booking #, carrier, terminal, plate..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Consumed">Consumed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={terminalFilter}
              onValueChange={(v) => {
                setTerminalFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Terminal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terminals</SelectItem>
                {mockTerminals.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              {filteredBookings.length} results
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1.5 font-semibold text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {col.label}
                        {getSortIcon(col.key)}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                      {booking.bookingNumber}
                    </td>
                    <td className="px-4 py-3 text-foreground">{booking.carrier}</td>
                    <td className="px-4 py-3 text-foreground">{booking.terminalName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(booking.timeSlot).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(booking.timeSlot).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{booking.truckPlate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{booking.containerType}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="sr-only">View details</span>
                        </Button>

                        {booking.status === "Pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-success hover:bg-success/10 hover:text-success"
                              onClick={() => handleStatusChange(booking.id, "Confirmed")}
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleStatusChange(booking.id, "Rejected")}
                            >
                              <X className="h-3.5 w-3.5" />
                              <span className="sr-only">Reject</span>
                            </Button>
                          </>
                        )}

                        {booking.status === "Confirmed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowQR(booking.bookingNumber)}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span className="sr-only">Generate QR</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedBookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No bookings found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Booking Number" value={selectedBooking.bookingNumber} />
                <DetailField label="Status" value={selectedBooking.status} />
                <DetailField label="Carrier" value={selectedBooking.carrier} />
                <DetailField label="Terminal" value={selectedBooking.terminalName} />
                <DetailField
                  label="Time Slot"
                  value={new Date(selectedBooking.timeSlot).toLocaleString()}
                />
                <DetailField label="Truck Plate" value={selectedBooking.truckPlate} />
                <DetailField label="Container Type" value={selectedBooking.containerType} />
                <DetailField
                  label="Created"
                  value={new Date(selectedBooking.createdAt).toLocaleDateString()}
                />
              </div>
              {selectedBooking.notes && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm text-foreground">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Booking QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-border bg-card">
              <div className="text-center">
                <QrCode className="mx-auto h-16 w-16 text-primary" />
                <p className="mt-2 font-mono text-xs font-bold text-foreground">{showQR}</p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Scan this QR code at the terminal gate for quick check-in.
            </p>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  )
}
