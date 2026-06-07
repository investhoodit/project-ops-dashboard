"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { todayKey } from "@/lib/helpers"
import type { Opportunity, Task } from "@/lib/types"

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr).getTime()
  if (Number.isNaN(d)) return null
  return Math.ceil((d - Date.now()) / 86400000)
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "high" : value >= 50 ? "mid" : "low"
  return (
    <span className={`opp-score opp-score-${tone}`} title={`${label}: ${value}`}>
      {label[0]}
      {value}
    </span>
  )
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

interface Props {
  opportunities: Opportunity[]
  onEdit: (opp: Opportunity) => void
  onChanged: () => void
  canEdit: boolean
}

export function OpportunityTable({ opportunities, onEdit, onChanged, canEdit }: Props) {
  const { data, saveTask } = useDashboard()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [converted, setConverted] = useState<Record<string, boolean>>({})

  function convertToTask(opp: Opportunity) {
    const project = data.projects[0]
    const task: Task = {
      id: newId(),
      title: `Apply: ${opp.title}`,
      projectId: project?.id ?? "",
      owner: opp.assigned_to || "Unassigned",
      dueDate: opp.closing_date || todayKey(),
      status: "Not Started",
      priority: opp.priority,
      progress: 0,
      notes: `Auto-created from opportunity.\nSource: ${opp.source_name}\n${opp.application_url || opp.source_url}\n\n${opp.description}`,
    }
    saveTask(task)
    setConverted((prev) => ({ ...prev, [opp.id]: true }))
  }

  async function setStatus(opp: Opportunity, status: Opportunity["status"]) {
    await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...opp, status }),
    })
    onChanged()
  }

  return (
    <div className="opp-table-wrap">
      <table className="opp-table">
        <thead>
          <tr>
            <th>Opportunity</th>
            <th>Type</th>
            <th>Closing</th>
            <th>Scores</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => {
            const d = daysUntil(opp.closing_date)
            const closingTone = d != null && d >= 0 && d <= 7 ? "warn" : d != null && d < 0 ? "past" : ""
            const isOpen = expanded === opp.id
            return (
              <>
                <tr key={opp.id} className={`opp-row priority-${opp.priority.toLowerCase()}`}>
                  <td>
                    <button
                      type="button"
                      className="opp-title-btn"
                      onClick={() => setExpanded(isOpen ? null : opp.id)}
                      aria-expanded={isOpen}
                    >
                      <strong>{opp.title}</strong>
                      <small>{opp.source_name}</small>
                    </button>
                  </td>
                  <td>
                    <span className="opp-type">{opp.opportunity_type}</span>
                  </td>
                  <td>
                    <span className={`opp-closing ${closingTone}`}>
                      {opp.closing_date || "—"}
                      {d != null && d >= 0 && <em>{d}d left</em>}
                      {d != null && d < 0 && <em>closed</em>}
                    </span>
                  </td>
                  <td>
                    {opp.scores ? (
                      <div className="opp-score-row">
                        <ScoreChip label="Relevance" value={opp.scores.relevance} />
                        <ScoreChip label="Urgency" value={opp.scores.urgency} />
                        <ScoreChip label="Fit" value={opp.scores.fit} />
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`opp-status status-${opp.status.toLowerCase().replaceAll(" ", "-")}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="opp-actions-cell">
                    <button type="button" onClick={() => setExpanded(isOpen ? null : opp.id)}>
                      {isOpen ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="opp-detail-row">
                    <td colSpan={6}>
                      <div className="opp-detail">
                        <div className="opp-detail-grid">
                          <p>{opp.description || "No description provided."}</p>
                          <dl>
                            {opp.estimated_value && (
                              <div>
                                <dt>Estimated value</dt>
                                <dd>{opp.estimated_value}</dd>
                              </div>
                            )}
                            {opp.location && (
                              <div>
                                <dt>Location</dt>
                                <dd>{opp.location}</dd>
                              </div>
                            )}
                            {opp.eligibility && (
                              <div>
                                <dt>Eligibility</dt>
                                <dd>{opp.eligibility}</dd>
                              </div>
                            )}
                            {opp.assigned_to && (
                              <div>
                                <dt>Assigned to</dt>
                                <dd>{opp.assigned_to}</dd>
                              </div>
                            )}
                            {(opp.contact_email || opp.contact_phone) && (
                              <div>
                                <dt>Contact</dt>
                                <dd>
                                  {opp.contact_email} {opp.contact_phone}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                        {opp.scores?.recommendedAction && (
                          <p className="opp-recommend">
                            <strong>Recommended action:</strong> {opp.scores.recommendedAction}
                          </p>
                        )}
                        <div className="opp-detail-actions">
                          {(opp.application_url || opp.source_url) && (
                            <a
                              className="btn secondary"
                              href={opp.application_url || opp.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open source
                            </a>
                          )}
                          <button type="button" className="btn secondary" onClick={() => onEdit(opp)} disabled={!canEdit}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => convertToTask(opp)}
                            disabled={!canEdit || converted[opp.id]}
                          >
                            {converted[opp.id] ? "Task created" : "Convert to task"}
                          </button>
                          {opp.status !== "Applied" && (
                            <button type="button" className="btn secondary" onClick={() => setStatus(opp, "Applied")} disabled={!canEdit}>
                              Mark applied
                            </button>
                          )}
                          {opp.status !== "Not Relevant" && (
                            <button
                              type="button"
                              className="btn ghost"
                              onClick={() => setStatus(opp, "Not Relevant")}
                              disabled={!canEdit}
                            >
                              Not relevant
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
