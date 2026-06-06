"use client"

import { useDashboard } from "@/lib/dashboard-context"
import { BarChart, PieChart } from "./primitive-charts"
import { LinkedBlock } from "./drill-down"
import { palette, countBy, avgProgress, parseMoney } from "@/lib/helpers"

export function ChartsSection() {
  const { data } = useDashboard()

  const projectProgress = data.projects.map((project, index) => ({
    label: project.name,
    value: Number(project.progress) || 0,
    color: palette[index % palette.length],
  }))

  const sbuProgress = data.sbus.map((sbu, index) => {
    const projects = data.projects.filter((p) => p.sbu === sbu.id)
    return {
      label: sbu.name,
      value: avgProgress(projects.map((p) => Number(p.progress) || 0)),
      color: palette[index % palette.length],
    }
  })

  const kpiValue = (label: string) => Number(data.kpis.find((k) => k.label === label)?.value || 0)
  const cash = parseMoney(data.kpis.find((k) => k.label === "Cash Collected")?.value)
  const revenueIndicators = [
    { label: "Cash Collected", value: cash, displayValue: `R${cash.toLocaleString()}`, color: "#059669" },
    { label: "Leads Captured", value: kpiValue("Leads Captured"), color: "#1769e0" },
    { label: "Follow-ups Done", value: kpiValue("Follow-ups Done"), color: "#7b2cbf" },
    { label: "Sponsor Follow-ups", value: kpiValue("Sponsor Follow-ups"), color: "#f97316" },
    { label: "Demos Booked", value: kpiValue("Demos Booked"), color: "#0284c7" },
    {
      label: "Projects above 75%",
      value: data.projects.filter((p) => Number(p.progress) >= 75).length,
      color: "#dc2626",
    },
  ]

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Graphical View
          </p>
          <h2>Progress & Performance Indicators</h2>
        </div>
        <p className="panel-note">Click any chart block to view the detailed records behind that indicator.</p>
      </div>
      <div className="charts-grid">
        <LinkedBlock detail="project-progress" className="chart-card wide">
          <div className="chart-header">
            <h3>Project Progress by Priority Project</h3>
            <span>Progress %</span>
          </div>
          <div className="chart-host">
            <BarChart data={projectProgress} max={100} suffix="%" title="Project progress by project" />
          </div>
        </LinkedBlock>

        <LinkedBlock detail="project-status" className="chart-card">
          <div className="chart-header">
            <h3>Project Status Mix</h3>
            <span>Health</span>
          </div>
          <div className="chart-host pie-host">
            <PieChart counts={countBy(data.projects, "status")} title="Project status mix" />
          </div>
        </LinkedBlock>

        <LinkedBlock detail="task-status" className="chart-card">
          <div className="chart-header">
            <h3>Task Status Mix</h3>
            <span>Execution</span>
          </div>
          <div className="chart-host pie-host">
            <PieChart counts={countBy(data.tasks, "status")} title="Task status mix" />
          </div>
        </LinkedBlock>

        <LinkedBlock detail="sbu-progress" className="chart-card wide">
          <div className="chart-header">
            <h3>SBU Average Progress</h3>
            <span>Portfolio</span>
          </div>
          <div className="chart-host">
            <BarChart data={sbuProgress} max={100} suffix="%" title="SBU average progress" />
          </div>
        </LinkedBlock>

        <LinkedBlock detail="revenue-kpis" className="chart-card wide">
          <div className="chart-header">
            <h3>Revenue / KPI Indicators</h3>
            <span>Management view</span>
          </div>
          <div className="chart-host">
            <BarChart data={revenueIndicators} title="Revenue and KPI indicators" left={190} />
          </div>
        </LinkedBlock>
      </div>
    </section>
  )
}
