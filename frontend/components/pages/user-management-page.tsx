"use client"

// ============================================================
// User Management Page (Admin Only)
// Tab 1: Operators (admin accounts hidden)
// Tab 2: Carriers (separate entity with CRUD)
// ============================================================

import { useState, useMemo } from "react"
import {
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  Ship,
  Eye,
  Globe,
  Phone,
  Mail,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// TODO: Implement backend integration / review API response
// Example mock API endpoint: https://mockapi.example.com/users
import { mockUsers, mockTerminals, mockCarriers } from "@/lib/mock-data"
import type { User, Carrier } from "@/lib/types"

type TabId = "operators" | "carriers"

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>("operators")

  // ---------- Operator State ----------
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formTerminals, setFormTerminals] = useState<string[]>([])

  // ---------- Carrier State ----------
  const [carriers, setCarriers] = useState<Carrier[]>(mockCarriers)
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  const [showCreateCarrier, setShowCreateCarrier] = useState(false)
  const [viewingCarrier, setViewingCarrier] = useState<Carrier | null>(null)
  const [showDeleteCarrierConfirm, setShowDeleteCarrierConfirm] = useState<string | null>(null)
  const [carrierName, setCarrierName] = useState("")
  const [carrierCode, setCarrierCode] = useState("")
  const [carrierEmail, setCarrierEmail] = useState("")
  const [carrierPhone, setCarrierPhone] = useState("")
  const [carrierCountry, setCarrierCountry] = useState("")
  const [carrierStatus, setCarrierStatus] = useState<"active" | "inactive">("active")

  // Only show non-admin users (hide admin accounts)
  const operatorUsers = useMemo(() => users.filter((u) => u.role !== "admin"), [users])

  // ---- Operator Handlers ----
  const openCreateUser = () => {
    setFormName("")
    setFormEmail("")
    setFormTerminals([])
    setShowCreateUser(true)
  }

  const openEditUser = (user: User) => {
    setFormName(user.name)
    setFormEmail(user.email)
    setFormTerminals(user.assignedTerminals)
    setEditingUser(user)
  }

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: formName, email: formEmail, assignedTerminals: formTerminals }
            : u
        )
      )
      setEditingUser(null)
    } else {
      const newUser: User = {
        id: `u${Date.now()}`,
        name: formName,
        email: formEmail,
        role: "operator",
        assignedTerminals: formTerminals,
        createdAt: new Date().toISOString(),
        lastLogin: "Never",
      }
      setUsers((prev) => [...prev, newUser])
      setShowCreateUser(false)
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setShowDeleteUserConfirm(null)
  }

  // ---- Carrier Handlers ----
  const openCreateCarrier = () => {
    setCarrierName("")
    setCarrierCode("")
    setCarrierEmail("")
    setCarrierPhone("")
    setCarrierCountry("")
    setCarrierStatus("active")
    setShowCreateCarrier(true)
  }

  const openEditCarrier = (carrier: Carrier) => {
    setCarrierName(carrier.name)
    setCarrierCode(carrier.code)
    setCarrierEmail(carrier.contactEmail)
    setCarrierPhone(carrier.contactPhone)
    setCarrierCountry(carrier.country)
    setCarrierStatus(carrier.status)
    setEditingCarrier(carrier)
  }

  const handleSaveCarrier = () => {
    if (editingCarrier) {
      setCarriers((prev) =>
        prev.map((c) =>
          c.id === editingCarrier.id
            ? { ...c, name: carrierName, code: carrierCode, contactEmail: carrierEmail, contactPhone: carrierPhone, country: carrierCountry, status: carrierStatus }
            : c
        )
      )
      setEditingCarrier(null)
    } else {
      const newCarrier: Carrier = {
        id: `c${Date.now()}`,
        name: carrierName,
        code: carrierCode,
        contactEmail: carrierEmail,
        contactPhone: carrierPhone,
        country: carrierCountry,
        activeBookings: 0,
        status: carrierStatus,
        createdAt: new Date().toISOString(),
      }
      setCarriers((prev) => [...prev, newCarrier])
      setShowCreateCarrier(false)
    }
  }

  const handleDeleteCarrier = (carrierId: string) => {
    setCarriers((prev) => prev.filter((c) => c.id !== carrierId))
    setShowDeleteCarrierConfirm(null)
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "operators", label: "Operators", count: operatorUsers.length },
    { id: "carriers", label: "Carriers", count: carriers.length },
  ]

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center gap-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <Badge variant="secondary" className="ml-2 text-[10px]">{tab.count}</Badge>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* ====== OPERATORS TAB ====== */}
      {activeTab === "operators" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {operatorUsers.length} operator accounts (admin accounts hidden)
            </p>
            <Button onClick={openCreateUser} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Operator
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Operator</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Terminals</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Last Login</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operatorUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="font-medium text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.assignedTerminals.map((tId) => {
                              const terminal = mockTerminals.find((t) => t.id === tId)
                              return terminal ? (
                                <Badge key={tId} variant="secondary" className="text-[10px]">{terminal.code}</Badge>
                              ) : null
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.lastLogin === "Never" ? "Never" : new Date(user.lastLogin).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditUser(user)}>
                              <Edit className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit operator</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-warning hover:text-warning">
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="sr-only">Reset password</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setShowDeleteUserConfirm(user.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete operator</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Operator Create/Edit Dialog */}
          <Dialog open={showCreateUser || !!editingUser} onOpenChange={() => { setShowCreateUser(false); setEditingUser(null) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingUser ? "Edit Operator" : "Create New Operator"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-foreground">Full Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" className="mt-1" />
                </div>
                <div>
                  <Label className="text-foreground">Email</Label>
                  <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@portauthority.com" type="email" className="mt-1" />
                </div>
                <div>
                  <Label className="text-foreground">Assigned Terminals</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mockTerminals.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          setFormTerminals((prev) =>
                            prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          formTerminals.includes(t.id)
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t.code} - {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowCreateUser(false); setEditingUser(null) }}>Cancel</Button>
                <Button onClick={handleSaveUser} disabled={!formName || !formEmail} className="bg-primary text-primary-foreground">
                  {editingUser ? "Save Changes" : "Create Operator"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete User Confirm */}
          <Dialog open={!!showDeleteUserConfirm} onOpenChange={() => setShowDeleteUserConfirm(null)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle className="text-foreground">Confirm Deletion</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Are you sure you want to delete this operator? This action cannot be undone.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteUserConfirm(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => showDeleteUserConfirm && handleDeleteUser(showDeleteUserConfirm)}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* ====== CARRIERS TAB ====== */}
      {activeTab === "carriers" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{carriers.length} carriers registered</p>
            <Button onClick={openCreateCarrier} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Carrier
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Carrier</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Country</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Bookings</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carriers.map((carrier) => (
                      <tr key={carrier.id} className="border-b border-border transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              <Ship className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-foreground">{carrier.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{carrier.code}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            <span>{carrier.country}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{carrier.contactEmail}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{carrier.activeBookings}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              carrier.status === "active"
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-border bg-muted text-muted-foreground"
                            }
                          >
                            {carrier.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewingCarrier(carrier)}>
                              <Eye className="h-3.5 w-3.5" />
                              <span className="sr-only">View carrier</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCarrier(carrier)}>
                              <Edit className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit carrier</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setShowDeleteCarrierConfirm(carrier.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete carrier</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Carrier View Dialog */}
          <Dialog open={!!viewingCarrier} onOpenChange={() => setViewingCarrier(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Carrier Details</DialogTitle>
              </DialogHeader>
              {viewingCarrier && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Ship className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{viewingCarrier.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{viewingCarrier.code}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`ml-auto ${
                        viewingCarrier.status === "active"
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {viewingCarrier.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" /> Country
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{viewingCarrier.country}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Active Bookings</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{viewingCarrier.activeBookings}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{viewingCarrier.contactEmail}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> Phone
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{viewingCarrier.contactPhone}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered: {new Date(viewingCarrier.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Carrier Create/Edit Dialog */}
          <Dialog open={showCreateCarrier || !!editingCarrier} onOpenChange={() => { setShowCreateCarrier(false); setEditingCarrier(null) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingCarrier ? "Edit Carrier" : "Add New Carrier"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Carrier Name</Label>
                    <Input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="Maersk" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground">Code</Label>
                    <Input value={carrierCode} onChange={(e) => setCarrierCode(e.target.value)} placeholder="MAEU" className="mt-1" maxLength={4} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Contact Email</Label>
                  <Input value={carrierEmail} onChange={(e) => setCarrierEmail(e.target.value)} placeholder="ops@carrier.com" type="email" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Phone</Label>
                    <Input value={carrierPhone} onChange={(e) => setCarrierPhone(e.target.value)} placeholder="+1 234 567 890" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground">Country</Label>
                    <Input value={carrierCountry} onChange={(e) => setCarrierCountry(e.target.value)} placeholder="Denmark" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Status</Label>
                  <Select value={carrierStatus} onValueChange={(v: "active" | "inactive") => setCarrierStatus(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowCreateCarrier(false); setEditingCarrier(null) }}>Cancel</Button>
                <Button onClick={handleSaveCarrier} disabled={!carrierName || !carrierCode} className="bg-primary text-primary-foreground">
                  {editingCarrier ? "Save Changes" : "Create Carrier"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Carrier Confirm */}
          <Dialog open={!!showDeleteCarrierConfirm} onOpenChange={() => setShowDeleteCarrierConfirm(null)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle className="text-foreground">Confirm Deletion</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Are you sure you want to delete this carrier? This action cannot be undone.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteCarrierConfirm(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => showDeleteCarrierConfirm && handleDeleteCarrier(showDeleteCarrierConfirm)}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
