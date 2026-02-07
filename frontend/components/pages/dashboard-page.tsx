"use client"

// ============================================================
// Dashboard Page
// Real-time summary of bookings, terminal status, slot utilization
// Interactive charts and status cards
// ============================================================

import { CalendarCheck, Container, TrendingUp, AlertTriangle, Clock, Truck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// TODO: Implement backend integration / review API response
// Example mock API endpoint: https://mockapi.example.com/dashboard
import { mockBookings, mockTerminals, mockNotifications, bookingTrend } from "@/lib/mock-data"
import type { SessionData } from "@/lib/session"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

// --- Stats Cards ---
function StatsCards({ session }: { session: SessionData }) {
  const isAdmin = session.role === "admin"

  // Filter bookings for operators to their assigned terminals
  const relevantBookings = isAdmin
    ? mockBookings
    : mockBookings.filter((b) => session.assignedTerminals.includes(b.terminalId))

  const pending = relevantBookings.filter((b) => b.status === "Pending").length
  const confirmed = relevantBookings.filter((b) => b.status === "Confirmed").length
  const totalSlots = mockTerminals.reduce((sum, t) => sum + t.totalSlots, 0)
  const usedSlots = mockTerminals.reduce((sum, t) => sum + t.usedSlots, 0)
  const utilization = Math.round((usedSlots / totalSlots) * 100)
  const alerts = mockNotifications.filter((n) => !n.read && (n.type === "error" || n.type === "warning")).length

  const stats = [
    {
      label: "Total Bookings",
      value: relevantBookings.length,
      icon: <CalendarCheck className="h-5 w-5" />,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Pending Approval",
      value: pending,
      icon: <Clock className="h-5 w-5" />,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Confirmed",
      value: confirmed,
      icon: <Truck className="h-5 w-5" />,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Slot Utilization",
      value: `${utilization}%`,
      icon: <Container className="h-5 w-5" />,
      color: utilization > 80 ? "text-destructive" : "text-accent",
      bgColor: utilization > 80 ? "bg-destructive/10" : "bg-accent/10",
    },
    {
      label: "Active Alerts",
      value: alerts,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: alerts > 0 ? "text-destructive" : "text-success",
      bgColor: alerts > 0 ? "bg-destructive/10" : "bg-success/10",
    },
    {
      label: "Active Terminals",
      value: mockTerminals.filter((t) => t.status === "active").length,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Booking Trend Chart ---
function BookingTrendChart() {
  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-card-foreground">Booking Trend (Last 12 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bookingTrend}>
              <defs>
                <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(181, 56%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(181, 56%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 32%, 91%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(181, 56%, 40%)"
                strokeWidth={2}
                fill="url(#bookingGradient)"
                name="Bookings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Terminal Status Chart ---
function TerminalStatusChart() {
  const data = mockTerminals.map((t) => ({
    name: t.code,
    utilization: Math.round((t.usedSlots / t.totalSlots) * 100),
    available: t.totalSlots - t.usedSlots,
    used: t.usedSlots,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-card-foreground">Terminal Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 32%, 91%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="used" fill="hsl(213, 94%, 20%)" name="Used Slots" radius={[4, 4, 0, 0]} />
              <Bar dataKey="available" fill="hsl(181, 56%, 40%)" name="Available" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Booking Status Pie ---
function BookingStatusPie() {
  const statusCounts = [
    { name: "Pending", value: mockBookings.filter((b) => b.status === "Pending").length, color: "hsl(38, 92%, 50%)" },
    { name: "Confirmed", value: mockBookings.filter((b) => b.status === "Confirmed").length, color: "hsl(142, 71%, 45%)" },
    { name: "Rejected", value: mockBookings.filter((b) => b.status === "Rejected").length, color: "hsl(0, 72%, 51%)" },
    { name: "Consumed", value: mockBookings.filter((b) => b.status === "Consumed").length, color: "hsl(213, 94%, 20%)" },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-card-foreground">Booking Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusCounts}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {statusCounts.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 32%, 91%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {statusCounts.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-muted-foreground">
                {s.name} ({s.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Recent Notifications ---
function RecentNotifications() {
  const recent = mockNotifications.slice(0, 4)

  const typeColor: Record<string, string> = {
    error: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    info: "bg-accent/10 text-accent",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-card-foreground">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.map((notif) => (
          <div key={notif.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className={`mt-0.5 rounded-full p-1.5 ${typeColor[notif.type]}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-card-foreground">{notif.title}</p>
                {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// --- Terminal Quick Status ---
function TerminalQuickStatus() {
  const congestionColors: Record<string, string> = {
    low: "bg-success text-success-foreground",
    medium: "bg-warning text-warning-foreground",
    high: "bg-destructive/80 text-destructive-foreground",
    critical: "bg-destructive text-destructive-foreground",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-card-foreground">Terminal Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockTerminals.map((terminal) => {
          const pct = Math.round((terminal.usedSlots / terminal.totalSlots) * 100)
          return (
            <div key={terminal.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{terminal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {terminal.usedSlots}/{terminal.totalSlots} slots
                  </p>
                </div>
                <Badge className={congestionColors[terminal.congestion]}>
                  {terminal.congestion}
                </Badge>
              </div>
              {/* Utilization bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct > 80 ? "bg-destructive" : pct > 60 ? "bg-warning" : "bg-success"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// --- Main Dashboard Page ---
export function DashboardPage({ session }: { session: SessionData }) {
  return (
    <div className="space-y-6">
      <StatsCards session={session} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <BookingTrendChart />
        <TerminalStatusChart />
        <BookingStatusPie />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentNotifications />
        <TerminalQuickStatus />
      </div>
    </div>
  )
}
