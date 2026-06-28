"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { useDashboard } from "@/lib/dashboard-context"
import { todayKey } from "@/lib/helpers"
import { useSpeechSynthesis } from "./use-speech-synthesis"
import type { Opportunity } from "@/lib/types"

interface OppApiResponse {
  opportunities: Opportunity[]
}
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<OppApiResponse>)

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const t = new Date(dateStr).getTime()
  if (Number.isNaN(t)) return null
  return Math.ceil((t - Date.now()) / 86400000)
}

interface BriefingLine {
  label: string
  count: number
  detail: string
}

export function DailyBriefingCard() {
  const { data } = useDashboard()
  const { supported, speaking, speak, stop } = useSpeechSynthesis()
  // Opportunities live behind a separate endpoint; null while loading.
  const { data: oppData } = useSWR<OppApiResponse>("/api/opportunities", fetcher, {
    revalidateOnFocus: false,
  })

  const { lines, spoken } = useMemo(() => {
    const today = todayKey()
    const opportunities = oppData?.opportunities ?? []

    const dueToday = data.tasks.filter((t) => t.dueDate === today && t.status !== "Completed")
    const overdue = data.tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "Completed")
    const highPriority = data.tasks.filter((t) => t.priority === "High" && t.status !== "Completed")
    const appointments = data.events.filter((e) => e.date === today)
    const closingSoon = opportunities.filter((o) => {
      const d = daysUntil(o.closing_date)
      return d != null && d >= 0 && d <= 7
    })
    const highRisk = data.projects.filter((p) => p.status === "At Risk" || p.status === "Delayed")

    const briefingLines: BriefingLine[] = [
      {
        label: "Tasks due today",
        count: dueToday.length,
        detail: dueToday.map((t) => t.title).join(", ") || "Nothing due today.",
      },
      {
        label: "Overdue tasks",
        count: overdue.length,
        detail: overdue.map((t) => t.title).join(", ") || "No overdue tasks.",
      },
      {
        label: "High-priority tasks",
        count: highPriority.length,
        detail: highPriority.map((t) => t.title).join(", ") || "No high-priority tasks.",
      },
      {
        label: "Appointments today",
        count: appointments.length,
        detail: appointments.map((e) => e.title).join(", ") || "No appointments today.",
      },
      {
        label: "Opportunities closing within 7 days",
        count: closingSoon.length,
        detail: closingSoon.map((o) => o.title).join(", ") || "None closing this week.",
      },
      {
        label: "High-risk projects",
        count: highRisk.length,
        detail: highRisk.map((p) => `${p.name} (${p.status})`).join(", ") || "No projects flagged at risk.",
      },
    ]

    const spokenText = [
      `Good day. Here is your Investhood IT portfolio briefing for ${today}.`,
      `You have ${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due today${
        dueToday.length ? ": " + dueToday.map((t) => t.title).join(", ") : ""
      }.`,
      `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}${
        overdue.length ? ": " + overdue.map((t) => t.title).join(", ") : ""
      }.`,
      `${highPriority.length} high-priority task${highPriority.length === 1 ? "" : "s"}.`,
      `${appointments.length} appointment${appointments.length === 1 ? "" : "s"} today${
        appointments.length ? ": " + appointments.map((e) => e.title).join(", ") : ""
      }.`,
      `${closingSoon.length} opportunit${closingSoon.length === 1 ? "y" : "ies"} closing within seven days${
        closingSoon.length ? ": " + closingSoon.map((o) => o.title).join(", ") : ""
      }.`,
      `${highRisk.length} high-risk project${highRisk.length === 1 ? "" : "s"}${
        highRisk.length ? ": " + highRisk.map((p) => p.name).join(", ") : ""
      }.`,
    ].join(" ")

    return { lines: briefingLines, spoken: spokenText }
  }, [data, oppData])

  return (
    <section className="panel briefing-card" aria-label="Daily briefing">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Start Here
          </p>
          <h2>Daily Briefing</h2>
        </div>
        {supported &&
          (speaking ? (
            <button className="btn secondary" type="button" onClick={stop}>
              Stop Speaking
            </button>
          ) : (
            <button className="btn" type="button" onClick={() => speak(spoken)}>
              Read Briefing Aloud
            </button>
          ))}
      </div>

      <div className="briefing-grid">
        {lines.map((line) => (
          <article className="briefing-item" key={line.label}>
            <div className="briefing-item-top">
              <span className="briefing-count">{line.count}</span>
              <strong>{line.label}</strong>
            </div>
            <p>{line.detail}</p>
          </article>
        ))}
      </div>

      {!supported && (
        <p className="briefing-note">Read-aloud is not supported on this browser, but your briefing is shown above.</p>
      )}
    </section>
  )
}
