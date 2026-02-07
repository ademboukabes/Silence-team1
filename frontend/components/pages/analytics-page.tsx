"use client"

// ============================================================
// Analytics & Reports Page (Admin Only)
// Metrics: peak hours, terminal usage, booking trends, operator performance
// Exportable PDF/CSV
// ============================================================

import { Download, TrendingUp, Clock, Users, Container } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// TODO: Implement backend integration / review API response
// Example mock API endpoint: https://mockapi.example.com/analytics
import {
  bookingTrend,
  terminalUsage,
  peakHoursData,
  operatorPerformance,
} from "@/lib/mock-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Export actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Data period: Jan 27 - Feb 7, 2026</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">566</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">12.6 min</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Container className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">59.6%</p>
                <p className="text-xs text-muted-foreground">Avg Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">3</p>
                <p className="text-xs text-muted-foreground">Active Operators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking Trend Line */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-card-foreground">Booking Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(213, 94%, 20%)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(213, 94%, 20%)" }}
                    name="Bookings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-card-foreground">Peak Hours Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(215, 16%, 47%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="bookings" fill="hsl(181, 56%, 40%)" name="Bookings" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Terminal Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-card-foreground">Terminal Utilization Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={terminalUsage}>
                  <PolarGrid stroke="hsl(214, 32%, 91%)" />
                  <PolarAngleAxis dataKey="terminalName" tick={{ fontSize: 11 }} stroke="hsl(215, 16%, 47%)" />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="hsl(215, 16%, 47%)" />
                  <Radar
                    name="Utilization %"
                    dataKey="utilization"
                    stroke="hsl(213, 94%, 20%)"
                    fill="hsl(213, 94%, 20%)"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operator Performance Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-card-foreground">Operator Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operatorPerformance.map((op, i) => (
                <div key={op.name} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{op.name}</p>
                        <p className="text-xs text-muted-foreground">Avg response: {op.avgResponseTime}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                        {op.approved} approved
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                        {op.rejected} rejected
                      </Badge>
                    </div>
                    {/* Approval rate bar */}
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{
                            width: `${Math.round((op.approved / (op.approved + op.rejected)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-card-foreground">
                      {Math.round((op.approved / (op.approved + op.rejected)) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
