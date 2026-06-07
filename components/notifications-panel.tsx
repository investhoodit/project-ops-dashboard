"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { todayKey, buildNotificationMessage } from "@/lib/helpers"

export function NotificationsPanel() {
  const { data, integrations } = useDashboard()
  const [message, setMessage] = useState<{ kind: string; text: string } | null>(null)
  const [sending, setSending] = useState<"email" | "whatsapp" | null>(null)

  const today = todayKey()
  const dueTasks = data.tasks
    .filter((t) => t.dueDate === today && t.status !== "Completed")
    .map((t) => ({ ...t, project: data.projects.find((p) => p.id === t.projectId) }))

  const text = buildNotificationMessage(dueTasks)
  const subject = `Investhood IT Portfolio Tasks Due Today - ${today}`

  async function send(channel: "email" | "whatsapp") {
    setSending(channel)
    setMessage(null)
    try {
      const endpoint = channel === "email" ? "/api/notify-due-tasks" : "/api/notify-whatsapp"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: dueTasks, message: text, subject }),
      })
      const json = await res.json()
      setMessage({
        kind: res.ok && json.sent ? "success" : json.configured === false ? "warn" : "info",
        text: json.message || "Request completed.",
      })
    } catch {
      setMessage({ kind: "error", text: "Could not reach the notification service." })
    } finally {
      setSending(null)
    }
  }

  return (
    <section className="panel notification-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Notifications
          </p>
          <h2>Tasks Due Today</h2>
        </div>
        <p className="panel-note">
          Send email and WhatsApp reminders when those services are configured. Without keys, the dashboard prepares a
          manual message instead.
        </p>
      </div>

      <div className="notification-list">
        {dueTasks.length ? (
          dueTasks.map((task) => (
            <div className="notification-item" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <small>
                  {task.project?.name || task.projectId} | {task.owner} | {task.priority} priority | {task.status}
                </small>
              </div>
              <span className="status in-progress">Due Today</span>
            </div>
          ))
        ) : (
          <div className="empty-state">No open tasks are due today.</div>
        )}
      </div>

      <div className="notification-actions">
        <button className="btn" type="button" onClick={() => send("email")} disabled={sending !== null}>
          {sending === "email" ? "Sending..." : integrations.email ? "Send Email Notification" : "Prepare Email Notification"}
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={() => send("whatsapp")}
          disabled={sending !== null}
        >
          {sending === "whatsapp"
            ? "Sending..."
            : integrations.whatsapp
              ? "Send WhatsApp Reminder"
              : "Prepare WhatsApp Reminder"}
        </button>
        <a
          className="btn ghost"
          style={{ color: "var(--navy)", border: "1px solid var(--line)", background: "var(--soft)" }}
          href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}
        >
          Open in Email App
        </a>
      </div>

      {message && <div className={`status-message ${message.kind}`}>{message.text}</div>}
    </section>
  )
}
