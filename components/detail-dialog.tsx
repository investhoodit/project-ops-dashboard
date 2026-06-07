"use client"

import { useEffect } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { statusClass, sbuById, projectById, avgProgress, todayKey } from "@/lib/helpers"
import type { DashboardData, Project, Task } from "@/lib/types"

export type DetailType =
  | "project-progress"
  | "project-status"
  | "task-status"
  | "sbu-progress"
  | "revenue-kpis"
  | "sbus"
  | "projects"
  | "tasks"
  | "kpis"
  | "risks"
  | "weekly-review"
  | "Projects"
  | "Tasks"
  | "Completed Tasks"
  | "Average Progress"
  | "At Risk / Delayed"
  | "High Priority Tasks"
  | "Sponsors Follow-ups"
  | "Cash Collected"
  | "overdue"

const PROJECT_HEADERS = [
  "Project",
  "SBU",
  "Status",
  "Progress",
  "Owner",
  "Revenue Target",
  "Current Revenue",
  "Next Action",
  "Risk",
]
const TASK_HEADERS = ["Task", "Project", "Owner", "Due Date", "Status", "Priority", "Progress", "Notes"]

function ProjectTable({ data, projects }: { data: DashboardData; projects: Project[] }) {
  if (!projects.length) return <div className="empty-state">No detailed records available for this indicator yet.</div>
  return (
    <div className="detail-table-wrap">
      <table className="detail-table">
        <thead>
          <tr>
            {PROJECT_HEADERS.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.name}</strong>
              </td>
              <td>{sbuById(data, p.sbu)?.name ?? p.sbu}</td>
              <td>
                <span className={`status ${statusClass(p.status)}`}>{p.status}</span>
              </td>
              <td>{p.progress}%</td>
              <td>{p.owner}</td>
              <td>{p.revenueTarget}</td>
              <td>{p.currentRevenue}</td>
              <td>{p.nextAction}</td>
              <td>{p.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TaskTable({ data, tasks }: { data: DashboardData; tasks: Task[] }) {
  if (!tasks.length) return <div className="empty-state">No detailed records available for this indicator yet.</div>
  return (
    <div className="detail-table-wrap">
      <table className="detail-table">
        <thead>
          <tr>
            {TASK_HEADERS.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>
                <strong>{t.title}</strong>
              </td>
              <td>{projectById(data, t.projectId)?.name ?? t.projectId}</td>
              <td>{t.owner}</td>
              <td>{t.dueDate}</td>
              <td>
                <span className={`status ${statusClass(t.status)}`}>{t.status}</span>
              </td>
              <td>{t.priority}</td>
              <td>{t.progress}%</td>
              <td>{t.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Cards({ children }: { children: React.ReactNode[] }) {
  if (!children.length) return <div className="empty-state">No records available.</div>
  return <div className="detail-grid">{children}</div>
}

function buildDetail(detailType: DetailType, data: DashboardData): { heading: string; body: React.ReactNode } {
  const today = todayKey()
  const overdue = data.tasks.filter((t) => t.dueDate < today && t.status !== "Completed")

  switch (detailType) {
    case "project-progress":
    case "project-status":
    case "Average Progress":
    case "projects":
    case "Projects":
      return { heading: "Project Details", body: <ProjectTable data={data} projects={data.projects} /> }
    case "task-status":
    case "tasks":
    case "Tasks":
      return { heading: "Task Details", body: <TaskTable data={data} tasks={data.tasks} /> }
    case "Completed Tasks":
      return {
        heading: "Completed Tasks",
        body: <TaskTable data={data} tasks={data.tasks.filter((t) => t.status === "Completed")} />,
      }
    case "At Risk / Delayed":
      return {
        heading: "At Risk / Delayed Projects",
        body: <ProjectTable data={data} projects={data.projects.filter((p) => ["At Risk", "Delayed"].includes(p.status))} />,
      }
    case "High Priority Tasks":
      return {
        heading: "High Priority Tasks",
        body: <TaskTable data={data} tasks={data.tasks.filter((t) => t.priority === "High")} />,
      }
    case "overdue":
      return { heading: "Overdue Tasks", body: <TaskTable data={data} tasks={overdue} /> }
    case "risks":
      return {
        heading: "Risk Register",
        body: (
          <ProjectTable
            data={data}
            projects={data.projects.filter((p) => p.risk || ["At Risk", "Delayed"].includes(p.status))}
          />
        ),
      }
    case "sbu-progress":
    case "sbus":
      return {
        heading: "Strategic Business Unit Details",
        body: (
          <Cards>
            {data.sbus.map((sbu) => {
              const projects = data.projects.filter((p) => p.sbu === sbu.id)
              const avg = avgProgress(projects.map((p) => Number(p.progress) || 0))
              return (
                <article className="detail-card" key={sbu.id}>
                  <h3>{sbu.name}</h3>
                  <p>
                    <strong>Average progress:</strong> {avg}%
                  </p>
                  <p>
                    <strong>Goal:</strong> {sbu.goal}
                  </p>
                  <p>
                    <strong>Projects:</strong>{" "}
                    {projects.map((p) => p.name).join(", ") || sbu.projects.join(", ") || "None captured"}
                  </p>
                </article>
              )
            })}
          </Cards>
        ),
      }
    case "revenue-kpis":
      return {
        heading: "Revenue & KPI Details",
        body: (
          <Cards>
            {[
              ...data.kpis.map((kpi) => (
                <article className="detail-card" key={`kpi-${kpi.label}`}>
                  <h3>{kpi.label}</h3>
                  <p>
                    <strong>Current value:</strong> {kpi.value}
                  </p>
                </article>
              )),
              ...data.projects.map((p) => (
                <article className="detail-card" key={`rev-${p.id}`}>
                  <h3>{p.name}</h3>
                  <p>
                    <strong>Revenue target:</strong> {p.revenueTarget}
                  </p>
                  <p>
                    <strong>Current revenue:</strong> {p.currentRevenue}
                  </p>
                  <p>
                    <strong>Status:</strong> {p.status}
                  </p>
                </article>
              )),
            ]}
          </Cards>
        ),
      }
    case "kpis":
      return {
        heading: "Daily KPI Details",
        body: (
          <Cards>
            {data.kpis.map((kpi) => (
              <article className="detail-card" key={kpi.label}>
                <h3>{kpi.label}</h3>
                <p>
                  <strong>Current value:</strong> {kpi.value}
                </p>
              </article>
            ))}
          </Cards>
        ),
      }
    case "Sponsors Follow-ups":
      return {
        heading: "Sponsor Follow-up KPI",
        body: (
          <Cards>
            {data.kpis
              .filter((k) => k.label === "Sponsor Follow-ups")
              .map((kpi) => (
                <article className="detail-card" key={kpi.label}>
                  <h3>{kpi.label}</h3>
                  <p>
                    <strong>Current value:</strong> {kpi.value}
                  </p>
                  <p>Use this to track sponsor engagement activity.</p>
                </article>
              ))}
          </Cards>
        ),
      }
    case "Cash Collected":
      return {
        heading: "Cash Collection KPI",
        body: (
          <Cards>
            {data.kpis
              .filter((k) => k.label === "Cash Collected")
              .map((kpi) => (
                <article className="detail-card" key={kpi.label}>
                  <h3>{kpi.label}</h3>
                  <p>
                    <strong>Current value:</strong> {kpi.value}
                  </p>
                  <p>Use this to track daily or weekly cash received.</p>
                </article>
              ))}
          </Cards>
        ),
      }
    case "weekly-review":
      return {
        heading: "Weekly CEO Review Checklist",
        body: (
          <Cards>
            {data.weeklyReview.map((item) => (
              <article className="detail-card" key={item.label}>
                <h3>{item.label}</h3>
                <p>
                  <strong>Status:</strong> {item.done ? "Done" : "Pending"}
                </p>
              </article>
            ))}
          </Cards>
        ),
      }
    default:
      return { heading: "Details", body: <div className="empty-state">No drill-down view configured for this item yet.</div> }
  }
}

export function DetailDialog({ detail, onClose }: { detail: DetailType | null; onClose: () => void }) {
  const { data } = useDashboard()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (detail) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [detail, onClose])

  if (!detail) return null
  const { heading, body } = buildDetail(detail, data)

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 23, .55)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="detail-dialog-content"
        style={{ borderRadius: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-dialog-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>
              Drill-down view
            </p>
            <h2>{heading}</h2>
          </div>
          <button className="btn secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="detail-content">{body}</div>
      </div>
    </div>
  )
}
