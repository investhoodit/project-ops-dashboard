import type { DashboardData } from "./types"

export const palette = [
  "#1769e0",
  "#7b2cbf",
  "#f97316",
  "#059669",
  "#dc2626",
  "#0f766e",
  "#9333ea",
  "#0284c7",
]

export function statusClass(status: string) {
  return status.toLowerCase().replaceAll(" ", "-")
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function parseMoney(value: string | number | undefined) {
  const text = String(value ?? "0").replace(/,/g, "")
  const match = text.match(/R\s*([0-9]+(?:\.[0-9]+)?)/i)
  return match ? Number(match[1]) : 0
}

export function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = (item[key] as string) || "Unknown"
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

export function projectById(data: DashboardData, id: string) {
  return data.projects.find((p) => p.id === id)
}

export function sbuById(data: DashboardData, id: string) {
  return data.sbus.find((s) => s.id === id)
}

export function avgProgress(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

export function buildNotificationMessage(
  tasks: { title: string; owner: string; priority: string; status: string; project?: { name: string } | undefined; projectId: string }[],
) {
  const today = todayKey()
  if (!tasks.length) return `Good morning, no Investhood IT Portfolio tasks are due today (${today}).`
  return [
    `Good morning, the following Investhood IT Portfolio tasks are due today (${today}):`,
    "",
    ...tasks.map(
      (task, index) =>
        `${index + 1}. ${task.title}\nProject: ${task.project?.name || task.projectId}\nOwner: ${task.owner}\nPriority: ${task.priority}\nStatus: ${task.status}`,
    ),
    "",
    "Please update the dashboard once completed.",
  ].join("\n")
}
