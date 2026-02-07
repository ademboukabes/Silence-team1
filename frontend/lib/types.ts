// ============================================================
// Core Types for Maritime Logistics Portal
// ============================================================

/** User roles for RBAC */
export type UserRole = "operator" | "admin"

/** Booking status flow */
export type BookingStatus = "Pending" | "Confirmed" | "Rejected" | "Consumed"

/** Congestion level for terminals */
export type CongestionLevel = "low" | "medium" | "high" | "critical"

// --- User ---
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  assignedTerminals: string[] // terminal IDs
  avatar?: string
  createdAt: string
  lastLogin: string
}

// --- Booking ---
export interface Booking {
  id: string
  bookingNumber: string
  carrier: string
  terminalId: string
  terminalName: string
  status: BookingStatus
  timeSlot: string // ISO date-time string
  truckPlate: string
  containerType: string
  createdAt: string
  updatedAt: string
  operatorId?: string
  notes?: string
}

// --- Terminal ---
export interface Terminal {
  id: string
  name: string
  code: string
  totalSlots: number
  usedSlots: number
  operatingHours: string // e.g. "06:00 - 22:00"
  congestion: CongestionLevel
  priorityGates: number
  latitude: number
  longitude: number
  assignedOperators: string[]
  status: "active" | "inactive" | "maintenance"
}

// --- Notification ---
export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  read: boolean
  createdAt: string
  relatedBookingId?: string
  relatedTerminalId?: string
}

// --- Audit Log ---
export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  target: string
  details: string
  timestamp: string
}

// --- Carrier ---
export interface Carrier {
  id: string
  name: string
  code: string
  contactEmail: string
  contactPhone: string
  country: string
  activeBookings: number
  status: "active" | "inactive"
  createdAt: string
}

// --- Time Slot ---
export interface TimeSlot {
  id: string
  terminalId: string
  startTime: string // e.g. "06:00"
  endTime: string // e.g. "07:00"
  capacity: number
  usedCapacity: number
  dayOfWeek: number // 0=Sun, 1=Mon, ... 6=Sat
}

// --- AI Chat Message ---
export interface AIChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// --- Analytics data points ---
export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface TerminalUsageData {
  terminalName: string
  bookings: number
  utilization: number
}
