"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"

export function AiAgent() {
  const { data, integrations } = useDashboard()
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState(
    "I can answer using the current dashboard data. Ask about SBUs, projects, risks, tasks, KPIs or revenue.",
  )
  const [mode, setMode] = useState<"ai" | "local" | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) {
      setAnswer("Please type a question about an SBU, project, task, risk, KPI or revenue item.")
      return
    }
    setLoading(true)
    setAnswer("Thinking...")
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, data }),
      })
      const json = await res.json()
      setAnswer(json.answer || "No answer returned.")
      setMode(json.mode || null)
    } catch {
      setAnswer("Could not reach the assistant service. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="ai-agent" aria-label="AI portfolio assistant">
      <div className="ai-agent-header">
        <span className="ai-avatar">AI</span>
        <div>
          <strong>Portfolio AI Agent</strong>
          <small>Ask about SBUs, projects, risks or tasks</small>
        </div>
        <span className="ai-badge" style={{ marginLeft: "auto" }}>
          {integrations.openai ? "AI Mode" : "Local Mode"}
        </span>
      </div>
      <form className="ai-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask: Which projects are at risk?"
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </form>
      <div className="ai-response">
        {answer}
        {mode === "local" && integrations.openai === false ? "" : ""}
      </div>
    </aside>
  )
}
