"use client"

import { useDashboard } from "@/lib/dashboard-context"
import { LinkedBlock, useDrillDown } from "./drill-down"

export function KpiAndRisks() {
  const { data } = useDashboard()
  const openDetail = useDrillDown()

  return (
    <section className="dashboard-layout">
      <LinkedBlock detail="kpis" className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>
              Daily Operations
            </p>
            <h2>KPI Dashboard</h2>
          </div>
        </div>
        <div className="kpi-grid">
          {data.kpis.map((kpi) => (
            <article
              className="kpi-card"
              key={kpi.label}
              role="button"
              tabIndex={0}
              onClick={() => openDetail("kpis")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  openDetail("kpis")
                }
              }}
            >
              <small>{kpi.label}</small>
              <strong>{kpi.value}</strong>
            </article>
          ))}
        </div>
      </LinkedBlock>

      <LinkedBlock detail="risks" className="panel">
        <div className="panel-header compact">
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>
              Risk Control
            </p>
            <h2>Top Risks</h2>
          </div>
        </div>
        <div className="risk-list">
          {data.projects
            .filter((p) => p.risk)
            .map((p) => (
              <article className="risk" key={p.id}>
                <strong>{p.name}</strong>
                {p.risk}
              </article>
            ))}
        </div>
      </LinkedBlock>
    </section>
  )
}
