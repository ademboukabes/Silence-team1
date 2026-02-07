"use client"

// ============================================================
// Terminal Overview Map Page
// Visual layout of terminals with real-time slot occupancy
// Interactive and color-coded by congestion level
// ============================================================

import { useState } from "react"
import { MapPin, Clock, AlertTriangle, Container, Gauge } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// TODO: Implement backend integration / review API response
// Example mock API endpoint: https://mockapi.example.com/terminals
import { mockTerminals } from "@/lib/mock-data"
import type { Terminal, CongestionLevel } from "@/lib/types"

const congestionStyles: Record<CongestionLevel, { bg: string; border: string; text: string; label: string }> = {
  low: { bg: "bg-success/10", border: "border-success/40", text: "text-success", label: "Low" },
  medium: { bg: "bg-warning/10", border: "border-warning/40", text: "text-warning", label: "Medium" },
  high: { bg: "bg-destructive/20", border: "border-destructive/40", text: "text-destructive", label: "High" },
  critical: { bg: "bg-destructive/30", border: "border-destructive", text: "text-destructive", label: "Critical" },
}

const statusBadge: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-border",
  maintenance: "bg-warning/10 text-warning border-warning/30",
}

function TerminalCard({ terminal, isSelected, onClick }: { terminal: Terminal; isSelected: boolean; onClick: () => void }) {
  const utilization = Math.round((terminal.usedSlots / terminal.totalSlots) * 100)
  const style = congestionStyles[terminal.congestion]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all ${
        isSelected ? "ring-2 ring-accent" : ""
      }`}
    >
      <Card className={`${style.bg} border ${style.border} transition-shadow hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg}`}>
                <Container className={`h-4 w-4 ${style.text}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{terminal.code}</p>
                <p className="text-xs text-muted-foreground">{terminal.name}</p>
              </div>
            </div>
            <Badge variant="outline" className={statusBadge[terminal.status]}>
              {terminal.status}
            </Badge>
          </div>

          <div className="mt-3 space-y-2">
            {/* Utilization bar */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Occupancy</span>
                <span className={`font-semibold ${style.text}`}>{utilization}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-card">
                <div
                  className={`h-full rounded-full transition-all ${
                    utilization > 80 ? "bg-destructive" : utilization > 60 ? "bg-warning" : "bg-success"
                  }`}
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{terminal.usedSlots}/{terminal.totalSlots} slots</span>
              <span>{terminal.priorityGates} priority gates</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

function TerminalDetail({ terminal }: { terminal: Terminal }) {
  const utilization = Math.round((terminal.usedSlots / terminal.totalSlots) * 100)
  const style = congestionStyles[terminal.congestion]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">{terminal.name}</CardTitle>
          <Badge variant="outline" className={statusBadge[terminal.status]}>
            {terminal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Congestion indicator */}
        <div className={`rounded-lg ${style.bg} p-4`}>
          <div className="flex items-center gap-2">
            <Gauge className={`h-5 w-5 ${style.text}`} />
            <div>
              <p className={`text-sm font-bold ${style.text}`}>Congestion: {style.label}</p>
              <p className="text-xs text-muted-foreground">
                {terminal.usedSlots} of {terminal.totalSlots} slots occupied
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={utilization} className="h-3" />
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Operating Hours</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-card-foreground">{terminal.operatingHours}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Location</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-card-foreground">
              {terminal.latitude.toFixed(3)}, {terminal.longitude.toFixed(3)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Priority Gates</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-card-foreground">
              {terminal.priorityGates} gate(s)
            </p>
          </div>
        </div>

        {/* Live activity simulation */}
        <div>
          <p className="mb-2 text-sm font-semibold text-card-foreground">Live Activity</p>
          <div className="space-y-2">
            {[
              { time: "2 min ago", event: "Truck TR-1045 checked in at Gate 2", type: "success" },
              { time: "8 min ago", event: "Slot #47 released - container loaded", type: "info" },
              { time: "15 min ago", event: "New booking assigned: BK-2026-0048", type: "info" },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                <span
                  className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                    activity.type === "success" ? "bg-success" : "bg-accent"
                  }`}
                />
                <div>
                  <p className="text-xs text-card-foreground">{activity.event}</p>
                  <p className="text-[10px] text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TerminalMapPage() {
  const [selectedId, setSelectedId] = useState<string>(mockTerminals[0].id)
  const selectedTerminal = mockTerminals.find((t) => t.id === selectedId) || mockTerminals[0]

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-3">
          <span className="text-sm font-medium text-card-foreground">Congestion Level:</span>
          {(Object.entries(congestionStyles) as [CongestionLevel, typeof congestionStyles[CongestionLevel]][]).map(
            ([key, style]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-full ${style.text === "text-success" ? "bg-success" : style.text === "text-warning" ? "bg-warning" : "bg-destructive"}`} />
                <span className="text-xs text-muted-foreground">{style.label}</span>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Terminal grid */}
        <div className="space-y-3 lg:col-span-1">
          <p className="text-sm font-semibold text-foreground">All Terminals</p>
          {mockTerminals.map((terminal) => (
            <TerminalCard
              key={terminal.id}
              terminal={terminal}
              isSelected={terminal.id === selectedId}
              onClick={() => setSelectedId(terminal.id)}
            />
          ))}
        </div>

        {/* Selected terminal detail */}
        <div className="lg:col-span-2">
          <TerminalDetail terminal={selectedTerminal} />
        </div>
      </div>
    </div>
  )
}
