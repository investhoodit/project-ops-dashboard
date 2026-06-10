"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"

type Mode = "dashboard" | "general" | "web" | "local"

interface Source {
  title: string
  url: string
}

const MODE_LABEL: Record<Mode, string> = {
  dashboard: "Dashboard Context",
  general: "AI General Knowledge",
  web: "Web Search Used",
  local: "Local Fallback",
}

export function AiAgent() {
  const { data, integrations } = useDashboard()
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState(
    "Ask about your dashboard (SBUs, projects, risks, tasks, KPIs, revenue) or a general business, funding, tender, SETA or strategy question.",
  )
  const [mode, setMode] = useState<Mode | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) {
      setAnswer("Please type a question.")
      return
    }
    setLoading(true)
    setAnswer("Thinking...")
    setMode(null)
    setSources([])
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, data }),
      })
      const json = await res.json()
      setAnswer(json.answer || "No answer returned.")
      setMode((json.mode as Mode) || null)
      setSources(Array.isArray(json.sources) ? json.sources : [])
    } catch {
      setAnswer("Could not reach the assistant service. Please try again.")
      setMode("local")
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
          <small>Dashboard data, business strategy, funding &amp; live web search</small>
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
          placeholder="Ask: Which projects are at risk? Or: Latest MICT SETA grants?"
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </form>
      <div className="ai-response">{answer}</div>
      {mode && !loading && (
        <span className={`ai-mode-chip ai-mode-${mode}`} aria-label={`Answer source: ${MODE_LABEL[mode]}`}>
          {MODE_LABEL[mode]}
        </span>
      )}
      {sources.length > 0 && !loading && (
        <div className="ai-sources">
          <strong>Sources</strong>
          {sources.map((s) => (
            <a key={s.url} className="ai-source-link" href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
          ))}
        </div>
      )}
    </aside>
  )
}
