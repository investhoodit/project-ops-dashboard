"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { LinkedBlock } from "./drill-down"
import { projectById, todayKey } from "@/lib/helpers"
import type { Task, TaskStatus, Priority } from "@/lib/types"

const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Waiting for Feedback", "Blocked", "Completed"]
const PRIORITIES: Priority[] = ["High", "Medium", "Low"]

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function TaskTracker() {
  const { data, canEdit, saveTask, completeTask } = useDashboard()
  const [editing, setEditing] = useState<Task | null>(null)
  const [open, setOpen] = useState(false)

  function startNew() {
    setEditing(null)
    setOpen(true)
  }
  function startEdit(task: Task) {
    setEditing(task)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const task: Task = {
      id: editing?.id || newId(),
      title: String(fd.get("title")),
      projectId: String(fd.get("projectId")),
      owner: String(fd.get("owner")),
      dueDate: String(fd.get("dueDate")),
      status: fd.get("status") as TaskStatus,
      priority: fd.get("priority") as Priority,
      progress: Number(fd.get("progress") || 0),
      notes: String(fd.get("notes") || ""),
    }
    saveTask(task)
    setOpen(false)
  }

  return (
    <LinkedBlock detail="tasks" className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Execution
          </p>
          <h2>Task Tracker</h2>
        </div>
        <button className="btn" type="button" onClick={startNew} disabled={!canEdit}>
          Add Task
        </button>
      </div>
      <div className="task-board">
        {STATUSES.map((status) => {
          const tasks = data.tasks.filter((t) => t.status === status)
          return (
            <section className="task-column" key={status}>
              <h3>
                {status} ({tasks.length})
              </h3>
              {tasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <h4>{task.title}</h4>
                  <div className="task-meta">
                    <span>
                      <strong>Project:</strong> {projectById(data, task.projectId)?.name ?? task.projectId}
                    </span>
                    <span>
                      <strong>Owner:</strong> {task.owner}
                    </span>
                    <span>
                      <strong>Due:</strong> {task.dueDate}
                    </span>
                    <span>
                      <strong>Priority:</strong> {task.priority}
                    </span>
                    <span>
                      <strong>Progress:</strong> {task.progress}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${task.progress}%` }} />
                  </div>
                  <div className="task-actions">
                    <button type="button" onClick={() => startEdit(task)} disabled={!canEdit}>
                      Edit
                    </button>
                    <button type="button" onClick={() => completeTask(task.id)} disabled={!canEdit}>
                      Complete
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )
        })}
      </div>

      {open && (
        <div
          role="presentation"
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,.55)", display: "grid", placeItems: "center", zIndex: 60, padding: 16 }}
        >
          <form
            method="dialog"
            className="dialog-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={{ background: "var(--card)", borderRadius: 22, width: "min(720px, 92vw)", maxHeight: "90vh", overflow: "auto" }}
          >
            <h2>Add / Update Task</h2>
            <label>
              Task title
              <input name="title" required defaultValue={editing?.title ?? ""} />
            </label>
            <label>
              Project
              <select name="projectId" required defaultValue={editing?.projectId ?? data.projects[0]?.id}>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Owner
              <input name="owner" required defaultValue={editing?.owner ?? ""} />
            </label>
            <label>
              Due date
              <input name="dueDate" type="date" required defaultValue={editing?.dueDate ?? todayKey()} />
            </label>
            <label>
              Status
              <select name="status" defaultValue={editing?.status ?? "Not Started"}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select name="priority" defaultValue={editing?.priority ?? "Medium"}>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Progress %
              <input name="progress" type="number" min={0} max={100} defaultValue={editing?.progress ?? 0} />
            </label>
            <label>
              Notes
              <textarea name="notes" rows={3} defaultValue={editing?.notes ?? ""} />
            </label>
            <div className="dialog-actions">
              <button value="cancel" className="btn secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn" type="submit">
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}
    </LinkedBlock>
  )
}
