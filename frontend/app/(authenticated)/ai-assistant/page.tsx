// ============================================================
// AI Assistant Route - /ai-assistant
// ============================================================

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { AIAssistantPage } from "@/components/pages/ai-assistant-page"

export default async function AIAssistantRoute() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <AIAssistantPage session={session} />
}
