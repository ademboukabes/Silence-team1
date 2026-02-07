// ============================================================
// Bookings Route - /bookings
// ============================================================

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { BookingsPage } from "@/components/pages/bookings-page"

export default async function BookingsRoute() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <BookingsPage session={session} />
}
