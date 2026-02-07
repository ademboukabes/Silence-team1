// ============================================================
// Mock Data for Maritime Logistics Portal
// All data simulates what a real backend API would provide
// ============================================================

import type {
  User,
  Booking,
  Terminal,
  Notification,
  AuditLog,
  TimeSeriesPoint,
  TerminalUsageData,
  Carrier,
  TimeSlot,
} from "./types"

// --- Users ---
export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Carlos Mendez",
    email: "carlos@portauthority.com",
    role: "admin",
    assignedTerminals: ["t1", "t2", "t3", "t4", "t5"],
    createdAt: "2024-01-15T08:00:00Z",
    lastLogin: "2026-02-07T09:30:00Z",
  },
  {
    id: "u2",
    name: "Elena Rodriguez",
    email: "elena@portauthority.com",
    role: "operator",
    assignedTerminals: ["t1", "t2"],
    createdAt: "2024-03-20T10:00:00Z",
    lastLogin: "2026-02-07T08:15:00Z",
  },
  {
    id: "u3",
    name: "James Thompson",
    email: "james@portauthority.com",
    role: "operator",
    assignedTerminals: ["t3", "t4"],
    createdAt: "2024-06-10T14:00:00Z",
    lastLogin: "2026-02-06T17:45:00Z",
  },
  {
    id: "u4",
    name: "Sofia Chen",
    email: "sofia@portauthority.com",
    role: "operator",
    assignedTerminals: ["t5"],
    createdAt: "2025-01-05T09:00:00Z",
    lastLogin: "2026-02-07T07:00:00Z",
  },
  {
    id: "u5",
    name: "Ahmed Hassan",
    email: "ahmed@portauthority.com",
    role: "admin",
    assignedTerminals: ["t1", "t2", "t3", "t4", "t5"],
    createdAt: "2024-02-01T08:00:00Z",
    lastLogin: "2026-02-07T10:00:00Z",
  },
]

// --- Terminals ---
export const mockTerminals: Terminal[] = [
  {
    id: "t1",
    name: "North Container Terminal",
    code: "NCT",
    totalSlots: 120,
    usedSlots: 98,
    operatingHours: "06:00 - 22:00",
    congestion: "high",
    priorityGates: 3,
    latitude: 36.845,
    longitude: -76.295,
    assignedOperators: ["u2"],
    status: "active",
  },
  {
    id: "t2",
    name: "South Bulk Terminal",
    code: "SBT",
    totalSlots: 80,
    usedSlots: 45,
    operatingHours: "06:00 - 20:00",
    congestion: "medium",
    priorityGates: 2,
    latitude: 36.84,
    longitude: -76.29,
    assignedOperators: ["u2"],
    status: "active",
  },
  {
    id: "t3",
    name: "East Ro-Ro Terminal",
    code: "ERT",
    totalSlots: 60,
    usedSlots: 15,
    operatingHours: "07:00 - 19:00",
    congestion: "low",
    priorityGates: 1,
    latitude: 36.85,
    longitude: -76.285,
    assignedOperators: ["u3"],
    status: "active",
  },
  {
    id: "t4",
    name: "West Liquid Terminal",
    code: "WLT",
    totalSlots: 40,
    usedSlots: 38,
    operatingHours: "00:00 - 23:59",
    congestion: "critical",
    priorityGates: 2,
    latitude: 36.835,
    longitude: -76.3,
    assignedOperators: ["u3"],
    status: "active",
  },
  {
    id: "t5",
    name: "Central Passenger Terminal",
    code: "CPT",
    totalSlots: 50,
    usedSlots: 20,
    operatingHours: "08:00 - 18:00",
    congestion: "low",
    priorityGates: 1,
    latitude: 36.843,
    longitude: -76.292,
    assignedOperators: ["u4"],
    status: "maintenance",
  },
]

// --- Bookings ---
const carriers = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "Evergreen", "COSCO", "ONE", "Yang Ming"]
const containerTypes = ["20ft Standard", "40ft Standard", "40ft High Cube", "20ft Reefer", "40ft Reefer"]
const statuses: Array<"Pending" | "Confirmed" | "Rejected" | "Consumed"> = ["Pending", "Confirmed", "Rejected", "Consumed"]

export const mockBookings: Booking[] = Array.from({ length: 50 }, (_, i) => {
  const terminalIdx = i % 5
  const terminal = mockTerminals[terminalIdx]
  const statusIdx = i < 12 ? 0 : i < 30 ? 1 : i < 38 ? 3 : 2
  const day = String((i % 28) + 1).padStart(2, "0")
  const hour = String(6 + (i % 14)).padStart(2, "0")

  return {
    id: `b${i + 1}`,
    bookingNumber: `BK-2026-${String(i + 1).padStart(4, "0")}`,
    carrier: carriers[i % carriers.length],
    terminalId: terminal.id,
    terminalName: terminal.name,
    status: statuses[statusIdx],
    timeSlot: `2026-02-${day}T${hour}:00:00Z`,
    truckPlate: `TR-${String(1000 + i)}`,
    containerType: containerTypes[i % containerTypes.length],
    createdAt: `2026-01-${day}T10:00:00Z`,
    updatedAt: `2026-02-${day}T${hour}:00:00Z`,
    operatorId: terminal.assignedOperators[0],
    notes: i % 5 === 0 ? "Priority shipment - handle with care" : undefined,
  }
})

// --- Notifications ---
export const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "Overbooking Alert",
    message: "West Liquid Terminal is at 95% capacity. Consider redistributing slots.",
    type: "error",
    read: false,
    createdAt: "2026-02-07T09:00:00Z",
    relatedTerminalId: "t4",
  },
  {
    id: "n2",
    title: "Booking Confirmed",
    message: "Booking BK-2026-0015 has been confirmed for North Container Terminal.",
    type: "success",
    read: false,
    createdAt: "2026-02-07T08:45:00Z",
    relatedBookingId: "b15",
  },
  {
    id: "n3",
    title: "Maintenance Scheduled",
    message: "Central Passenger Terminal will undergo maintenance from Feb 10-12.",
    type: "warning",
    read: true,
    createdAt: "2026-02-06T14:00:00Z",
    relatedTerminalId: "t5",
  },
  {
    id: "n4",
    title: "High Congestion",
    message: "North Container Terminal congestion level is HIGH. Current utilization: 82%.",
    type: "warning",
    read: false,
    createdAt: "2026-02-07T07:30:00Z",
    relatedTerminalId: "t1",
  },
  {
    id: "n5",
    title: "New Booking Request",
    message: "Maersk has submitted a new booking request for South Bulk Terminal.",
    type: "info",
    read: true,
    createdAt: "2026-02-07T06:00:00Z",
    relatedBookingId: "b1",
  },
  {
    id: "n6",
    title: "Truck Delay Detected",
    message: "Truck TR-1023 is 45 minutes late for slot at North Container Terminal.",
    type: "warning",
    read: false,
    createdAt: "2026-02-07T10:15:00Z",
    relatedTerminalId: "t1",
  },
]

// --- Audit Logs ---
export const mockAuditLogs: AuditLog[] = [
  {
    id: "al1",
    userId: "u1",
    userName: "Carlos Mendez",
    action: "CREATE_USER",
    target: "User: Sofia Chen",
    details: "Created operator account with terminal CPT access",
    timestamp: "2025-01-05T09:00:00Z",
  },
  {
    id: "al2",
    userId: "u2",
    userName: "Elena Rodriguez",
    action: "APPROVE_BOOKING",
    target: "Booking: BK-2026-0015",
    details: "Approved booking for Maersk at NCT, slot 14:00",
    timestamp: "2026-02-07T08:45:00Z",
  },
  {
    id: "al3",
    userId: "u1",
    userName: "Carlos Mendez",
    action: "UPDATE_TERMINAL",
    target: "Terminal: West Liquid Terminal",
    details: "Updated operating hours to 24/7",
    timestamp: "2026-02-06T16:30:00Z",
  },
  {
    id: "al4",
    userId: "u3",
    userName: "James Thompson",
    action: "REJECT_BOOKING",
    target: "Booking: BK-2026-0032",
    details: "Rejected due to capacity constraints at WLT",
    timestamp: "2026-02-06T11:20:00Z",
  },
  {
    id: "al5",
    userId: "u1",
    userName: "Carlos Mendez",
    action: "SYSTEM_CONFIG",
    target: "Global Settings",
    details: "Updated max booking window from 7 to 14 days",
    timestamp: "2026-02-05T09:00:00Z",
  },
  {
    id: "al6",
    userId: "u2",
    userName: "Elena Rodriguez",
    action: "SLOT_ADJUSTMENT",
    target: "Terminal: North Container Terminal",
    details: "Increased available slots by 10 for Feb 8",
    timestamp: "2026-02-07T07:00:00Z",
  },
  {
    id: "al7",
    userId: "u5",
    userName: "Ahmed Hassan",
    action: "RESET_PASSWORD",
    target: "User: James Thompson",
    details: "Password reset performed by admin",
    timestamp: "2026-02-04T14:00:00Z",
  },
  {
    id: "al8",
    userId: "u4",
    userName: "Sofia Chen",
    action: "GENERATE_QR",
    target: "Booking: BK-2026-0020",
    details: "Generated QR code for confirmed booking at CPT",
    timestamp: "2026-02-07T09:30:00Z",
  },
]

// --- Analytics Time Series ---
export const bookingTrend: TimeSeriesPoint[] = [
  { date: "Jan 27", value: 42 },
  { date: "Jan 28", value: 38 },
  { date: "Jan 29", value: 55 },
  { date: "Jan 30", value: 47 },
  { date: "Jan 31", value: 62 },
  { date: "Feb 01", value: 58 },
  { date: "Feb 02", value: 35 },
  { date: "Feb 03", value: 70 },
  { date: "Feb 04", value: 65 },
  { date: "Feb 05", value: 72 },
  { date: "Feb 06", value: 68 },
  { date: "Feb 07", value: 54 },
]

export const terminalUsage: TerminalUsageData[] = [
  { terminalName: "NCT", bookings: 245, utilization: 82 },
  { terminalName: "SBT", bookings: 180, utilization: 56 },
  { terminalName: "ERT", bookings: 95, utilization: 25 },
  { terminalName: "WLT", bookings: 210, utilization: 95 },
  { terminalName: "CPT", bookings: 120, utilization: 40 },
]

// --- Peak Hours Data ---
export const peakHoursData = [
  { hour: "06:00", bookings: 12 },
  { hour: "07:00", bookings: 25 },
  { hour: "08:00", bookings: 42 },
  { hour: "09:00", bookings: 55 },
  { hour: "10:00", bookings: 48 },
  { hour: "11:00", bookings: 38 },
  { hour: "12:00", bookings: 22 },
  { hour: "13:00", bookings: 30 },
  { hour: "14:00", bookings: 45 },
  { hour: "15:00", bookings: 52 },
  { hour: "16:00", bookings: 40 },
  { hour: "17:00", bookings: 28 },
  { hour: "18:00", bookings: 15 },
]

// --- Operator Performance ---
export const operatorPerformance = [
  { name: "Elena Rodriguez", approved: 85, rejected: 12, avgResponseTime: "12 min" },
  { name: "James Thompson", approved: 72, rejected: 18, avgResponseTime: "18 min" },
  { name: "Sofia Chen", approved: 45, rejected: 5, avgResponseTime: "8 min" },
]

// --- Carriers ---
export const mockCarriers: Carrier[] = [
  { id: "c1", name: "Maersk", code: "MAEU", contactEmail: "ops@maersk.com", contactPhone: "+45 3363 3363", country: "Denmark", activeBookings: 12, status: "active", createdAt: "2024-01-10T08:00:00Z" },
  { id: "c2", name: "MSC", code: "MSCU", contactEmail: "booking@msc.com", contactPhone: "+41 22 703 88 88", country: "Switzerland", activeBookings: 8, status: "active", createdAt: "2024-01-15T08:00:00Z" },
  { id: "c3", name: "CMA CGM", code: "CMDU", contactEmail: "contact@cma-cgm.com", contactPhone: "+33 4 88 91 90 00", country: "France", activeBookings: 6, status: "active", createdAt: "2024-02-01T08:00:00Z" },
  { id: "c4", name: "Hapag-Lloyd", code: "HLCU", contactEmail: "info@hapag-lloyd.com", contactPhone: "+49 40 3001 0", country: "Germany", activeBookings: 5, status: "active", createdAt: "2024-02-20T08:00:00Z" },
  { id: "c5", name: "Evergreen", code: "EGLV", contactEmail: "ops@evergreen-line.com", contactPhone: "+886 2 2505 7766", country: "Taiwan", activeBookings: 4, status: "active", createdAt: "2024-03-05T08:00:00Z" },
  { id: "c6", name: "COSCO", code: "COSU", contactEmail: "service@cosco.com", contactPhone: "+86 21 6596 6105", country: "China", activeBookings: 7, status: "active", createdAt: "2024-03-15T08:00:00Z" },
  { id: "c7", name: "ONE", code: "ONEY", contactEmail: "cs@one-line.com", contactPhone: "+65 6220 9885", country: "Japan", activeBookings: 3, status: "active", createdAt: "2024-04-01T08:00:00Z" },
  { id: "c8", name: "Yang Ming", code: "YMLU", contactEmail: "info@yangming.com", contactPhone: "+886 2 2455 9988", country: "Taiwan", activeBookings: 2, status: "inactive", createdAt: "2024-05-10T08:00:00Z" },
]

// --- Time Slots ---
// Generate slots for each terminal for Mon-Fri (1-5)
const slotHours = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"]

export const mockTimeSlots: TimeSlot[] = mockTerminals.flatMap((terminal) => {
  // Determine operating hours range for each terminal
  const [startH] = terminal.operatingHours.split(" - ").map((h) => Number.parseInt(h.split(":")[0]))
  const [, endStr] = terminal.operatingHours.split(" - ")
  const endH = Number.parseInt(endStr.split(":")[0])

  return Array.from({ length: 5 }, (_, dayIdx) => {
    const dayOfWeek = dayIdx + 1 // Mon-Fri
    return slotHours
      .filter((h) => {
        const hour = Number.parseInt(h.split(":")[0])
        return hour >= startH && hour < (endH === 0 ? 24 : endH)
      })
      .map((startTime, slotIdx) => {
        const nextHour = String(Number.parseInt(startTime.split(":")[0]) + 1).padStart(2, "0") + ":00"
        const baseCapacity = Math.floor(terminal.totalSlots / 12)
        const used = Math.floor(Math.random() * baseCapacity)
        return {
          id: `ts-${terminal.id}-d${dayOfWeek}-s${slotIdx}`,
          terminalId: terminal.id,
          startTime,
          endTime: nextHour,
          capacity: baseCapacity,
          usedCapacity: used,
          dayOfWeek,
        }
      })
  }).flat()
})
