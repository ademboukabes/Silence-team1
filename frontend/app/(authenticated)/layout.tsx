// ============================================================
// Authenticated Layout
// Reads session server-side and provides sidebar + header shell.
// Middleware already guards these routes, so session is guaranteed.
// ============================================================

import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthenticatedShell } from "@/components/authenticated-shell"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <AuthenticatedShell session={session}>
      {children}
    </AuthenticatedShell>
  )
}
