// ============================================================
// Terminal Configuration Route - /terminals
// ============================================================

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { TerminalConfigPage } from "@/components/pages/terminal-config-page"

export default async function TerminalsRoute() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <TerminalConfigPage session={session} />
}
