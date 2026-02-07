// ============================================================
// Dashboard Route - /dashboard
// Server component that passes session to the dashboard page
// ============================================================

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { DashboardPage } from "@/components/pages/dashboard-page"

export default async function DashboardRoute() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <DashboardPage session={session} />
}
