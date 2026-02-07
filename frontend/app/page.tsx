// ============================================================
// Root Page - Redirects to /dashboard
// Authentication is handled by middleware
// ============================================================

import { redirect } from "next/navigation"

export default function Page() {
  redirect("/dashboard")
}
