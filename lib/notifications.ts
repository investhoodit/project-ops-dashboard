import "server-only"
import { getDashboardData } from "./data"
import type { Task } from "./types"

export interface DueDigest {
  overdue: Task[]
  dueToday: Task[]
  dueSoon: Task[]
  total: number
}

function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

// Build a digest of tasks that are overdue, due today, or due within `soonDays`.
export async function buildDueDigest(soonDays = 3): Promise<DueDigest> {
  const { data } = await getDashboardData()
  const today = startOfDay(new Date())
  const soonLimit = new Date(today)
  soonLimit.setDate(soonLimit.getDate() + soonDays)

  const overdue: Task[] = []
  const dueToday: Task[] = []
  const dueSoon: Task[] = []

  for (const task of data.tasks) {
    if (task.status === "Completed" || !task.dueDate) continue
    const due = startOfDay(new Date(task.dueDate))
    if (Number.isNaN(due.getTime())) continue
    if (due < today) overdue.push(task)
    else if (due.getTime() === today.getTime()) dueToday.push(task)
    else if (due <= soonLimit) dueSoon.push(task)
  }

  return { overdue, dueToday, dueSoon, total: overdue.length + dueToday.length + dueSoon.length }
}

export function digestToText(digest: DueDigest): string {
  const lines: string[] = ["Project & Operations Dashboard - Task Reminders", ""]
  const section = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return
    lines.push(`${title} (${tasks.length}):`)
    for (const t of tasks) {
      lines.push(`  - ${t.title} [${t.owner ?? "Unassigned"}] due ${t.dueDate}`)
    }
    lines.push("")
  }
  section("Overdue", digest.overdue)
  section("Due Today", digest.dueToday)
  section("Due Soon", digest.dueSoon)
  if (digest.total === 0) lines.push("No tasks are due. Great work staying on track!")
  return lines.join("\n")
}

export function digestToHtml(digest: DueDigest): string {
  const block = (title: string, color: string, tasks: Task[]) => {
    if (tasks.length === 0) return ""
    const rows = tasks
      .map(
        (t) =>
          `<li style="margin-bottom:6px"><strong>${escapeHtml(t.title)}</strong> &mdash; ${escapeHtml(
            t.owner ?? "Unassigned",
          )} &middot; due ${escapeHtml(t.dueDate ?? "")}</li>`,
      )
      .join("")
    return `<h3 style="color:${color};margin:18px 0 8px">${title} (${tasks.length})</h3><ul style="padding-left:18px;margin:0">${rows}</ul>`
  }
  return `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:560px">
    <h2 style="margin:0 0 4px">Task Reminders</h2>
    <p style="color:#64748b;margin:0 0 12px">Investhood IT Project &amp; Operations Dashboard</p>
    ${block("Overdue", "#dc2626", digest.overdue)}
    ${block("Due Today", "#d97706", digest.dueToday)}
    ${block("Due Soon", "#1769e0", digest.dueSoon)}
    ${digest.total === 0 ? '<p style="color:#16a34a">No tasks are due. Great work staying on track!</p>' : ""}
  </div>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}
