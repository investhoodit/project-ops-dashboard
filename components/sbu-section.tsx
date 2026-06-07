"use client"

import { useDashboard } from "@/lib/dashboard-context"
import { LinkedBlock } from "./drill-down"

export function SbuSection() {
  const { data } = useDashboard()
  return (
    <LinkedBlock detail="sbus" className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Strategic Business Units
          </p>
          <h2>Portfolio Overview</h2>
        </div>
      </div>
      <div className="sbu-grid">
        {data.sbus.map((sbu) => (
          <article className="sbu-card" key={sbu.id}>
            <h3>{sbu.name}</h3>
            <p>
              <strong>Goal:</strong> {sbu.goal}
            </p>
            <ul>
              {sbu.projects.map((project) => (
                <li key={project}>{project}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </LinkedBlock>
  )
}
