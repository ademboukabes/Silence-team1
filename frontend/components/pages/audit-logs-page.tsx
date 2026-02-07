"use client"

// ============================================================
// Audit Logs Page (Admin Only)
// Full traceability of all actions, filterable for compliance
// ============================================================

import { useState, useMemo } from "react"
import { Search, Filter, Download, Shield, Clock } from "lucide-react"
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
// TODO: Implement backend integration / review API response
// Example mock API endpoint: https://mockapi.example.com/audit-logs
import { mockAuditLogs } from "@/lib/mock-data"

const actionColors: Record<string, string> = {
  CREATE_USER: "bg-success/10 text-success border-success/30",
  APPROVE_BOOKING: "bg-success/10 text-success border-success/30",
  REJECT_BOOKING: "bg-destructive/10 text-destructive border-destructive/30",
  UPDATE_TERMINAL: "bg-accent/10 text-accent border-accent/30",
  SYSTEM_CONFIG: "bg-primary/10 text-primary border-primary/30",
  SLOT_ADJUSTMENT: "bg-warning/10 text-warning border-warning/30",
  RESET_PASSWORD: "bg-warning/10 text-warning border-warning/30",
  GENERATE_QR: "bg-accent/10 text-accent border-accent/30",
}

export function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const uniqueActions = [...new Set(mockAuditLogs.map((l) => l.action))]

  const filteredLogs = useMemo(() => {
    let result = mockAuditLogs

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      )
    }

    if (actionFilter !== "all") {
      result = result.filter((l) => l.action === actionFilter)
    }

    return result
  }, [searchQuery, actionFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs by user, target, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <p className="text-sm text-muted-foreground">{filteredLogs.length} entries</p>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Target</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {new Date(log.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {" "}
                          {new Date(log.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {log.userName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-xs font-medium text-foreground">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${actionColors[log.action] || ""}`}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{log.target}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No audit logs matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
