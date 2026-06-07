"use client"

import { useDashboard } from "@/lib/dashboard-context"
import { useDrillDown } from "./drill-down"
import { avgProgress } from "@/lib/helpers"
import type { DetailType } from "./detail-dialog"

export function SummaryCards() {
  const { data } = useDashboard()
  const openDetail = useDrillDown()

  const totalProjects = data.projects.length
  const completedTasks = data.tasks.filter((t) => t.status === "Completed").length
  const atRisk = data.projects.filter((p) => ["At Risk", "Delayed"].includes(p.status)).length
  const avg = avgProgress(data.projects.map((p) => Number(p.progress) || 0))

  const cards: { label: string; value: string | number; detail: DetailType }[] = [
    { label: "Projects", value: totalProjects, detail: "Projects" },
    { label: "Tasks", value: data.tasks.length, detail: "Tasks" },
    { label: "Completed Tasks", value: completedTasks, detail: "Completed Tasks" },
    { label: "Average Progress", value: `${avg}%`, detail: "Average Progress" },
    { label: "At Risk / Delayed", value: atRisk, detail: "At Risk / Delayed" },
    { label: "High Priority Tasks", value: data.tasks.filter((t) => t.priority === "High").length, detail: "High Priority Tasks" },
    { label: "Sponsors Follow-ups", value: data.kpis.find((k) => k.label === "Sponsor Follow-ups")?.value ?? 0, detail: "Sponsors Follow-ups" },
    { label: "Cash Collected", value: data.kpis.find((k) => k.label === "Cash Collected")?.value ?? "R0", detail: "Cash Collected" },
  ]

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article
          key={card.label}
          className="card summary-card linked-block"
          role="button"
          tabIndex={0}
          onClick={() => openDetail(card.detail)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              openDetail(card.detail)
            }
          }}
        >
          <h3>{card.label}</h3>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  )
}
