"use server"

// ============================================================
// Data Server Actions (BFF Layer)
// All data fetching and mutations go through here.
// In production, each function would call the external API.
// Client components NEVER call the external API directly.
// ============================================================

import { getSession } from "@/lib/session"
import {
  mockBookings,
  mockTerminals,
  mockNotifications,
  mockAuditLogs,
  mockUsers,
  mockCarriers,
  mockTimeSlots,
  bookingTrend,
  terminalUsage,
  peakHoursData,
  operatorPerformance,
} from "@/lib/mock-data"
import type { Booking, BookingStatus, Terminal, Notification, AuditLog, User, Carrier, TimeSlot } from "@/lib/types"

// --- Session helper ---

async function requireSession() {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")
  return session
}

async function requireAdmin() {
  const session = await requireSession()
  if (session.role !== "admin") throw new Error("Forbidden: Admin access required")
  return session
}

// ============================================================
// BOOKINGS
// ============================================================

export async function getBookings(): Promise<Booking[]> {
  const session = await requireSession()

  // TODO: Implement backend integration / review API response
  // Example: const res = await fetch("https://api.example.com/bookings", {
  //   headers: { Authorization: `Bearer ${session.token}` }
  // })

  if (session.role === "admin") {
    return mockBookings
  }
  // Operators see only their assigned terminals
  return mockBookings.filter((b) => session.assignedTerminals.includes(b.terminalId))
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<{ success: boolean; error?: string }> {
  await requireSession()

  // TODO: Implement backend integration / review API response
  // Example: await fetch(`https://api.example.com/bookings/${bookingId}/status`, {
  //   method: "PATCH",
  //   body: JSON.stringify({ status: newStatus }),
  // })

  // Mock: In a real app this would persist to the database
  return { success: true }
}

// ============================================================
// TERMINALS
// ============================================================

export async function getTerminals(): Promise<Terminal[]> {
  const session = await requireSession()

  // TODO: Implement backend integration / review API response
  // Example: const res = await fetch("https://api.example.com/terminals")

  if (session.role === "admin") {
    return mockTerminals
  }
  return mockTerminals.filter((t) => session.assignedTerminals.includes(t.id))
}

export async function getAllTerminals(): Promise<Terminal[]> {
  await requireSession()
  // Returns all terminals (e.g., for dropdowns), regardless of assignment
  return mockTerminals
}

export async function createTerminal(data: {
  name: string
  code: string
  totalSlots: number
  operatingHours: string
  priorityGates: number
  status: "active" | "inactive" | "maintenance"
}): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  // Example: await fetch("https://api.example.com/terminals", {
  //   method: "POST",
  //   body: JSON.stringify(data),
  // })

  return { success: true }
}

export async function updateTerminal(
  terminalId: string,
  data: Partial<Terminal>
): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

// ============================================================
// TIME SLOTS
// ============================================================

export async function getTimeSlots(terminalId: string): Promise<TimeSlot[]> {
  await requireSession()

  // TODO: Implement backend integration / review API response
  return mockTimeSlots.filter((s) => s.terminalId === terminalId)
}

export async function updateSlotCapacity(
  slotId: string,
  capacity: number
): Promise<{ success: boolean }> {
  await requireSession()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(): Promise<Notification[]> {
  await requireSession()

  // TODO: Implement backend integration / review API response
  return mockNotifications
}

// ============================================================
// USERS (Admin only)
// ============================================================

export async function getUsers(): Promise<User[]> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return mockUsers
}

export async function createUser(data: {
  name: string
  email: string
  assignedTerminals: string[]
}): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

export async function updateUser(
  userId: string,
  data: { name: string; email: string; assignedTerminals: string[] }
): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

// ============================================================
// CARRIERS (Admin only)
// ============================================================

export async function getCarriers(): Promise<Carrier[]> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return mockCarriers
}

export async function createCarrier(data: {
  name: string
  code: string
  contactEmail: string
  contactPhone: string
  country: string
  status: "active" | "inactive"
}): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

export async function updateCarrier(
  carrierId: string,
  data: Partial<Carrier>
): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

export async function deleteCarrier(carrierId: string): Promise<{ success: boolean }> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return { success: true }
}

// ============================================================
// AUDIT LOGS (Admin only)
// ============================================================

export async function getAuditLogs(): Promise<AuditLog[]> {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return mockAuditLogs
}

// ============================================================
// ANALYTICS (Admin only)
// ============================================================

export async function getAnalyticsData() {
  await requireAdmin()

  // TODO: Implement backend integration / review API response
  return {
    bookingTrend,
    terminalUsage,
    peakHoursData,
    operatorPerformance,
  }
}

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardData() {
  const session = await requireSession()

  // TODO: Implement backend integration / review API response
  const bookings =
    session.role === "admin"
      ? mockBookings
      : mockBookings.filter((b) => session.assignedTerminals.includes(b.terminalId))

  return {
    bookings,
    terminals: mockTerminals,
    notifications: mockNotifications,
    bookingTrend,
  }
}

// ============================================================
// SEARCH
// ============================================================

export async function searchAll(query: string) {
  const session = await requireSession()

  // TODO: Implement backend integration / review API response
  if (query.length < 2) return []

  const q = query.toLowerCase()
  const results: Array<{
    id: string
    title: string
    subtitle: string
    category: "booking" | "terminal" | "carrier" | "user"
    page: string
  }> = []

  // Search bookings
  for (const b of mockBookings) {
    if (
      b.bookingNumber.toLowerCase().includes(q) ||
      b.carrier.toLowerCase().includes(q) ||
      b.truckPlate.toLowerCase().includes(q) ||
      b.terminalName.toLowerCase().includes(q)
    ) {
      results.push({
        id: b.id,
        title: b.bookingNumber,
        subtitle: `${b.carrier} - ${b.terminalName} - ${b.status}`,
        category: "booking",
        page: "/bookings",
      })
    }
    if (results.length >= 20) break
  }

  // Search terminals
  for (const t of mockTerminals) {
    if (t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)) {
      results.push({
        id: t.id,
        title: t.name,
        subtitle: `Code: ${t.code} - ${t.congestion} congestion - ${t.usedSlots}/${t.totalSlots} slots`,
        category: "terminal",
        page: "/terminals",
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
      results.push({
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
      if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        results.push({
          id: u.id,
          title: u.name,
          subtitle: `${u.email} - ${u.role}`,
          category: "user",
          page: "/admin/users",
        })
      }
    }
  }

  return results.slice(0, 12)
}
