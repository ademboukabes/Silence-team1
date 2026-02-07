"use client"

import React from "react"

// ============================================================
// AI Assistant Chat Page
// Chat interface with markdown rendering for responses
// ============================================================

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SessionData } from "@/lib/session"
import { MarkdownContent } from "@/components/markdown-renderer"
import type { AIChatMessage } from "@/lib/types"

// Simulated AI responses based on query keywords
function getAIResponse(query: string, isAdmin: boolean): string {
  const q = query.toLowerCase()

  if (q.includes("booking") && q.includes("status")) {
    return `Here's a summary of current booking statuses:\n\n- **Pending:** 12 bookings awaiting approval\n- **Confirmed:** 18 bookings ready for processing\n- **Consumed:** 8 bookings completed today\n- **Rejected:** 2 bookings rejected due to capacity\n\nWould you like details on any specific booking?`
  }

  if (q.includes("availability") || q.includes("slots")) {
    return `Current slot availability across terminals:\n\n| Terminal | Available | Total | Utilization |\n|----------|-----------|-------|-------------|\n| NCT | 22 | 120 | 82% |\n| SBT | 35 | 80 | 56% |\n| ERT | 45 | 60 | 25% |\n| WLT | 2 | 40 | 95% |\n| CPT | 30 | 50 | 40% |\n\n**Alert:** WLT is nearing full capacity. Consider redirecting bookings to ERT or CPT.`
  }

  if (q.includes("congestion") || q.includes("traffic")) {
    return `Current congestion analysis:\n\n- **Critical:** West Liquid Terminal (95% utilization)\n- **High:** North Container Terminal (82% utilization)\n- **Medium:** South Bulk Terminal (56% utilization)\n- **Low:** East Ro-Ro Terminal (25%), Central Passenger Terminal (40%)\n\nRecommendation: Route new container bookings to East Ro-Ro Terminal during peak hours (09:00-11:00).`
  }

  if (q.includes("peak") || q.includes("hours")) {
    return `Peak hour analysis for today:\n\n- **Morning Peak:** 08:00-10:00 (avg. 48 bookings/hour)\n- **Afternoon Peak:** 14:00-16:00 (avg. 45 bookings/hour)\n- **Off-Peak:** 12:00-13:00 (avg. 22 bookings/hour)\n\nSuggestion: Schedule maintenance activities during off-peak hours for minimal disruption.`
  }

  if (isAdmin && (q.includes("performance") || q.includes("operator"))) {
    return `Operator performance this month:\n\n1. **Elena Rodriguez** - 85 approvals, 12 rejections, avg response: 12 min\n2. **James Thompson** - 72 approvals, 18 rejections, avg response: 18 min\n3. **Sofia Chen** - 45 approvals, 5 rejections, avg response: 8 min\n\nSofia Chen has the fastest response time. James Thompson may need additional support.`
  }

  if (q.includes("forecast") || q.includes("predict")) {
    return `Based on historical patterns, here's the forecast for the next 7 days:\n\n- **Feb 8-9:** Expected 15% increase in container bookings (weekend catch-up)\n- **Feb 10-12:** Normal volume expected, CPT under maintenance\n- **Feb 13-14:** Predicted 20% surge due to Maersk vessel arrival\n\nRecommendation: Pre-allocate additional slots at NCT for Feb 13-14.`
  }

  return `I can help you with:\n\n- **Booking Status** - Check current booking statuses and details\n- **Slot Availability** - View available slots across all terminals\n- **Congestion Analysis** - Current congestion levels and recommendations\n- **Peak Hours** - Traffic patterns and optimal scheduling\n${isAdmin ? "- **Operator Performance** - Team metrics and response times\n- **Forecasting** - Booking volume predictions\n" : ""}\nPlease ask me a specific question about any of these topics.`
}

// Suggested quick prompts
const quickPrompts = [
  "What is the current booking status?",
  "Show slot availability",
  "Analyze congestion levels",
  "When are peak hours?",
]

const adminPrompts = ["Show operator performance", "Forecast next week"]

/** Shared chat interface used both in the full page and in the popup */
export function AIChatInterface({ compact = false, session }: { compact?: boolean; session: SessionData }) {
  const isAdmin = session.role === "admin"
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello ${session.name}! I'm your APCS Booking AI assistant. I can help you with booking queries, terminal availability, congestion analysis, and more.${isAdmin ? " As an admin, you also have access to operator performance metrics and forecasting." : ""}\n\nHow can I help you today?`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    const response = getAIResponse(text, isAdmin)
    const aiMsg: AIChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, aiMsg])
    setIsTyping(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const chatHeight = compact ? "h-[420px]" : "h-[calc(100vh-12rem)]"

  return (
    <div className={`flex ${chatHeight} gap-4`}>
      <Card className="flex flex-1 flex-col">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Bot className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm text-card-foreground">APCS AI</CardTitle>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Advanced Mode" : "Operator Mode"} - Maritime logistics assistant
              </p>
            </div>
            <Badge variant="outline" className="ml-auto border-success/30 bg-success/10 text-success">
              Online
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user" ? "bg-primary" : "bg-accent"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-accent-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-card-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownContent content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Bot className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts inline for compact */}
          {compact && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-4 pt-3">
              {quickPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isTyping}
                  className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about bookings, terminals, availability..."
                disabled={isTyping}
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button type="submit" disabled={!input.trim() || isTyping} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="h-4 w-4" />
                <span className={compact ? "sr-only" : ""}>Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Quick Prompts Sidebar - only for full page */}
      {!compact && (
        <div className="hidden w-64 space-y-4 lg:block">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-card-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Quick Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isTyping}
                  className="w-full rounded-lg border border-border p-2.5 text-left text-xs text-card-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
              {isAdmin &&
                adminPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isTyping}
                    className="w-full rounded-lg border border-accent/30 bg-accent/5 p-2.5 text-left text-xs text-card-foreground transition-colors hover:bg-accent/10 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="mr-1 border-accent/30 px-1 py-0 text-[8px] text-accent">
                        Admin
                      </Badge>
                      {prompt}
                    </span>
                  </button>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-card-foreground">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Ask about specific booking numbers for detailed info</li>
                <li>Query slot availability by terminal name</li>
                <li>Request congestion analysis for routing suggestions</li>
                {isAdmin && <li className="text-accent">Use admin queries for performance metrics and forecasting</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export function AIAssistantPage({ session }: { session: SessionData }) {
  return <AIChatInterface compact={false} session={session} />
}
