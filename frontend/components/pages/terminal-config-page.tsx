"use client"

import React from "react"

// ============================================================
// Terminal Configuration Page
// Admin: full CRUD + time slot management
// Operator: read-only view of assigned terminals, can adjust
//           slot capacity within admin-set limits
// ============================================================

import { useState, useMemo } from "react"
import { Plus, Edit, Settings, Power, Wrench, Clock, ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// TODO: Implement backend integration / review API response
// Example mock API endpoint: https://mockapi.example.com/terminals/config
import { mockTerminals, mockTimeSlots } from "@/lib/mock-data"
import type { SessionData } from "@/lib/session"
import type { Terminal, TimeSlot } from "@/lib/types"

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"]

export function TerminalConfigPage({ session }: { session: SessionData }) {
  const isAdmin = session.role === "admin"

  const [terminals, setTerminals] = useState<Terminal[]>(mockTerminals)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(mockTimeSlots)
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [slotCapacity, setSlotCapacity] = useState(0)

  // Form state for terminal create/edit
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formSlots, setFormSlots] = useState(50)
  const [formHours, setFormHours] = useState("06:00 - 22:00")
  const [formGates, setFormGates] = useState(1)
  const [formStatus, setFormStatus] = useState<"active" | "inactive" | "maintenance">("active")

  // Filter terminals for operators
  const visibleTerminals = useMemo(() => {
    if (isAdmin) return terminals
    return terminals.filter((t) => session.assignedTerminals.includes(t.id))
  }, [terminals, isAdmin, session])

  const openEdit = (terminal: Terminal) => {
    if (!isAdmin) return
    setFormName(terminal.name)
    setFormCode(terminal.code)
    setFormSlots(terminal.totalSlots)
    setFormHours(terminal.operatingHours)
    setFormGates(terminal.priorityGates)
    setFormStatus(terminal.status)
    setEditingTerminal(terminal)
  }

  const openCreate = () => {
    setFormName("")
    setFormCode("")
    setFormSlots(50)
    setFormHours("06:00 - 22:00")
    setFormGates(1)
    setFormStatus("active")
    setShowCreate(true)
  }

  const handleSave = () => {
    if (editingTerminal) {
      setTerminals((prev) =>
        prev.map((t) =>
          t.id === editingTerminal.id
            ? { ...t, name: formName, code: formCode, totalSlots: formSlots, operatingHours: formHours, priorityGates: formGates, status: formStatus }
            : t
        )
      )
      setEditingTerminal(null)
    } else {
      const newTerminal: Terminal = {
        id: `t${Date.now()}`,
        name: formName,
        code: formCode,
        totalSlots: formSlots,
        usedSlots: 0,
        operatingHours: formHours,
        congestion: "low",
        priorityGates: formGates,
        latitude: 36.84 + Math.random() * 0.02,
        longitude: -76.3 + Math.random() * 0.02,
        assignedOperators: [],
        status: formStatus,
      }
      setTerminals((prev) => [...prev, newTerminal])
      setShowCreate(false)
    }
  }

  // Time slot editing
  const openSlotEdit = (slot: TimeSlot) => {
    setSlotCapacity(slot.capacity)
    setEditingSlot(slot)
  }

  const handleSlotSave = () => {
    if (!editingSlot) return
    const terminal = terminals.find((t) => t.id === editingSlot.terminalId)
    const maxCapacity = terminal ? Math.floor(terminal.totalSlots / 6) : slotCapacity

    // Operators can only adjust within admin-set limits
    const finalCapacity = isAdmin ? slotCapacity : Math.min(slotCapacity, maxCapacity)

    setTimeSlots((prev) =>
      prev.map((s) => (s.id === editingSlot.id ? { ...s, capacity: finalCapacity } : s))
    )
    setEditingSlot(null)
  }

  // Get slots for the selected terminal
  const selectedTerminal = terminals.find((t) => t.id === selectedTerminalId)
  const terminalSlots = useMemo(() => {
    if (!selectedTerminalId) return []
    return timeSlots.filter((s) => s.terminalId === selectedTerminalId)
  }, [timeSlots, selectedTerminalId])

  // Group slots by day for timetable grid
  const slotsByDay = useMemo(() => {
    const grouped: Record<number, TimeSlot[]> = {}
    for (const slot of terminalSlots) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = []
      grouped[slot.dayOfWeek].push(slot)
    }
    // Sort each day's slots by start time
    for (const day of Object.keys(grouped)) {
      grouped[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return grouped
  }, [terminalSlots])

  // Get unique time labels
  const timeLabels = useMemo(() => {
    const labels = new Set<string>()
    for (const slot of terminalSlots) {
      labels.add(slot.startTime)
    }
    return Array.from(labels).sort()
  }, [terminalSlots])

  const statusIcons: Record<string, React.ReactNode> = {
    active: <Power className="h-3.5 w-3.5" />,
    inactive: <Power className="h-3.5 w-3.5" />,
    maintenance: <Wrench className="h-3.5 w-3.5" />,
  }

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success border-success/30",
    inactive: "bg-muted text-muted-foreground border-border",
    maintenance: "bg-warning/10 text-warning border-warning/30",
  }

  // ---- TIMETABLE VIEW ----
  if (selectedTerminalId && selectedTerminal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={() => setSelectedTerminalId(null)}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{selectedTerminal.name}</h3>
            <p className="text-xs text-muted-foreground">
              Time Slot Timetable - {selectedTerminal.operatingHours} - {isAdmin ? "Full Edit" : "Adjust within limits"}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2.5 text-left font-semibold text-muted-foreground">
                      <Clock className="inline-block h-3.5 w-3.5 mr-1" />
                      Time
                    </th>
                    {DAY_NAMES.map((day, i) => (
                      <th key={day} className="px-3 py-2.5 text-center font-semibold text-muted-foreground min-w-[100px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeLabels.map((time) => (
                    <tr key={time} className="border-b border-border hover:bg-muted/20">
                      <td className="sticky left-0 z-10 bg-card px-3 py-2 font-mono font-medium text-foreground">
                        {time}
                      </td>
                      {[1, 2, 3, 4, 5].map((dayOfWeek) => {
                        const slot = slotsByDay[dayOfWeek]?.find((s) => s.startTime === time)
                        if (!slot) {
                          return (
                            <td key={dayOfWeek} className="px-2 py-1.5 text-center text-muted-foreground">
                              -
                            </td>
                          )
                        }
                        const utilPct = slot.capacity > 0 ? Math.round((slot.usedCapacity / slot.capacity) * 100) : 0
                        const colorClass =
                          utilPct > 80
                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                            : utilPct > 50
                              ? "bg-warning/10 border-warning/30 text-warning"
                              : "bg-success/10 border-success/30 text-success"

                        return (
                          <td key={dayOfWeek} className="px-1.5 py-1.5">
                            <button
                              onClick={() => openSlotEdit(slot)}
                              className={`w-full rounded-lg border p-2 text-center transition-colors hover:shadow-sm ${colorClass}`}
                            >
                              <p className="text-xs font-bold">{slot.usedCapacity}/{slot.capacity}</p>
                              <p className="text-[10px] opacity-70">{utilPct}%</p>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">Slot Utilization:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-success/30" />
            <span className="text-xs text-muted-foreground">{"< 50%"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-warning/30" />
            <span className="text-xs text-muted-foreground">50-80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-destructive/30" />
            <span className="text-xs text-muted-foreground">{"> 80%"}</span>
          </div>
          <span className="text-xs text-muted-foreground">Click a slot to adjust capacity</span>
        </div>

        {/* Slot Edit Dialog */}
        <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {isAdmin ? "Edit Time Slot" : "Adjust Slot Capacity"}
              </DialogTitle>
            </DialogHeader>
            {editingSlot && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-mono text-sm font-semibold text-foreground">{editingSlot.startTime} - {editingSlot.endTime}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Day</p>
                    <p className="text-sm font-semibold text-foreground">{DAY_NAMES[editingSlot.dayOfWeek - 1]}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Current Usage</p>
                    <p className="text-sm font-semibold text-foreground">{editingSlot.usedCapacity} used</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? "Max Terminal Cap" : "Admin Limit"}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedTerminal ? Math.floor(selectedTerminal.totalSlots / 6) : "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Slot Capacity: {slotCapacity}</Label>
                  <Slider
                    value={[slotCapacity]}
                    onValueChange={(v) => setSlotCapacity(v[0])}
                    min={editingSlot.usedCapacity}
                    max={isAdmin ? (selectedTerminal?.totalSlots || 200) : Math.floor((selectedTerminal?.totalSlots || 50) / 6)}
                    step={1}
                    className="mt-2"
                  />
                  {!isAdmin && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      You can adjust up to {Math.floor((selectedTerminal?.totalSlots || 50) / 6)} (admin-set limit)
                    </p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSlot(null)}>Cancel</Button>
              <Button onClick={handleSlotSave} className="bg-primary text-primary-foreground">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ---- TERMINAL CARDS VIEW ----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {visibleTerminals.length} terminal{visibleTerminals.length !== 1 ? "s" : ""} {isAdmin ? "configured" : "assigned to you"}
        </p>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Terminal
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTerminals.map((terminal) => {
          const utilization = Math.round((terminal.usedSlots / terminal.totalSlots) * 100)
          return (
            <Card key={terminal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base text-card-foreground">{terminal.name}</CardTitle>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{terminal.code}</p>
                  </div>
                  <Badge variant="outline" className={`gap-1 ${statusColors[terminal.status]}`}>
                    {statusIcons[terminal.status]}
                    {terminal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground">Total Slots</p>
                    <p className="text-lg font-bold text-card-foreground">{terminal.totalSlots}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground">Utilization</p>
                    <p className={`text-lg font-bold ${utilization > 80 ? "text-destructive" : utilization > 60 ? "text-warning" : "text-success"}`}>
                      {utilization}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground">Operating Hours</p>
                    <p className="text-sm font-medium text-card-foreground">{terminal.operatingHours}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground">Priority Gates</p>
                    <p className="text-lg font-bold text-card-foreground">{terminal.priorityGates}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Capacity</span>
                    <span>{terminal.usedSlots}/{terminal.totalSlots}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${utilization > 80 ? "bg-destructive" : utilization > 60 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => openEdit(terminal)}>
                      <Edit className="h-4 w-4" />
                      Configure
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    onClick={() => setSelectedTerminalId(terminal.id)}
                  >
                    <Clock className="h-4 w-4" />
                    Time Slots
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create/Edit Dialog (Admin only) */}
      <Dialog open={showCreate || !!editingTerminal} onOpenChange={() => { setShowCreate(false); setEditingTerminal(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingTerminal ? "Configure Terminal" : "Add New Terminal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Terminal Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="North Terminal" className="mt-1" />
              </div>
              <div>
                <Label className="text-foreground">Code</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="NTH" className="mt-1" maxLength={4} />
              </div>
            </div>
            <div>
              <Label className="text-foreground">Total Slots: {formSlots}</Label>
              <Slider value={[formSlots]} onValueChange={(v) => setFormSlots(v[0])} min={10} max={200} step={5} className="mt-2" />
            </div>
            <div>
              <Label className="text-foreground">Operating Hours</Label>
              <Input value={formHours} onChange={(e) => setFormHours(e.target.value)} placeholder="06:00 - 22:00" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Priority Gates</Label>
                <Input type="number" value={formGates} onChange={(e) => setFormGates(Number(e.target.value))} min={0} max={10} className="mt-1" />
              </div>
              <div>
                <Label className="text-foreground">Status</Label>
                <Select value={formStatus} onValueChange={(v: "active" | "inactive" | "maintenance") => setFormStatus(v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingTerminal(null) }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName || !formCode} className="bg-primary text-primary-foreground">
              {editingTerminal ? "Save Changes" : "Create Terminal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
