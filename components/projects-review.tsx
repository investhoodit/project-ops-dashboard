"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { LinkedBlock } from "./drill-down"
import { statusClass, sbuById } from "@/lib/helpers"

export function ProjectsAndReview() {
  const { data, canEdit, toggleReview } = useDashboard()
  const [filter, setFilter] = useState("all")

  const projects = filter === "all" ? data.projects : data.projects.filter((p) => p.sbu === filter)

  return (
    <section className="dashboard-layout">
      <LinkedBlock detail="projects" className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>
              Projects
            </p>
            <h2>Status Dashboard</h2>
          </div>
          <select
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter projects by SBU"
            style={{ maxWidth: 260 }}
          >
            <option value="all">All SBUs</option>
            {data.sbus.map((sbu) => (
              <option key={sbu.id} value={sbu.id}>
                {sbu.name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>SBU</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Owner</th>
                <th>Revenue Target</th>
                <th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <br />
                    <small>Due: {project.targetDate}</small>
                  </td>
                  <td>{sbuById(data, project.sbu)?.name ?? project.sbu}</td>
                  <td>
                    <span className={`status ${statusClass(project.status)}`}>{project.status}</span>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <span style={{ width: `${project.progress}%` }} />
                    </div>
                    <small>{project.progress}%</small>
                  </td>
                  <td>{project.owner}</td>
                  <td>
                    <strong>{project.revenueTarget}</strong>
                    <br />
                    <small>Current: {project.currentRevenue}</small>
                  </td>
                  <td>{project.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LinkedBlock>

      <LinkedBlock detail="weekly-review" className="panel">
        <div className="panel-header compact">
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>
              CEO View
            </p>
            <h2>Weekly Review</h2>
          </div>
        </div>
        <div className="checklist">
          {data.weeklyReview.map((item, index) => (
            <label className="check-item" key={item.label}>
              <input
                type="checkbox"
                checked={item.done}
                disabled={!canEdit}
                onChange={(e) => toggleReview(index, e.target.checked)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </LinkedBlock>
    </section>
  )
}
