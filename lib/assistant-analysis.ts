import type { DashboardData } from "./types"

// Deterministic, offline analysis of the dashboard data.
// Used as the assistant's answer when no AI provider is configured,
// and as grounding context when one is.
export function analyzeQuestion(question: string, data: DashboardData): string {
  const q = question.toLowerCase()
  const projects = data.projects ?? []
  const tasks = data.tasks ?? []
  const kpis = data.kpis ?? []
  const sbus = data.sbus ?? []

  const sbuName = (id: string) => sbus.find((s) => s.id === id)?.name ?? id
  const atRisk = projects.filter((p) => p.status === "At Risk" || p.status === "Delayed")
  const onTrack = projects.filter((p) => p.status === "On Track")

  if (/(at risk|risk|delayed|behind|red)/.test(q)) {
    if (atRisk.length === 0) return "No projects are currently flagged as At Risk or Delayed. The portfolio is healthy."
    return (
      `${atRisk.length} project(s) need attention:\n` +
      atRisk
        .map(
          (p) =>
            `- ${p.name} (${sbuName(p.sbu)}) - ${p.status}, ${p.progress}% complete. Owner: ${p.owner}. Risk: ${p.risk}`,
        )
        .join("\n")
    )
  }

  if (/(revenue|target|money|income|earn)/.test(q)) {
    return (
      "Revenue by project (target vs current):\n" +
      projects.map((p) => `- ${p.name}: target ${p.revenueTarget}, current ${p.currentRevenue}`).join("\n")
    )
  }

  if (/(overdue|due|deadline|late)/.test(q)) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdue = tasks.filter((t) => t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < today)
    if (overdue.length === 0) return "There are no overdue tasks right now."
    return (
      `${overdue.length} task(s) are overdue:\n` +
      overdue.map((t) => `- ${t.title} (owner: ${t.owner || "Unassigned"}, due ${t.dueDate})`).join("\n")
    )
  }

  if (/(kpi|metric|performance|indicator)/.test(q)) {
    if (kpis.length === 0) return "No KPIs are defined yet."
    return "Current KPIs:\n" + kpis.map((k) => `- ${k.label}: ${k.value}`).join("\n")
  }

  if (/(task|to-?do|action)/.test(q)) {
    const open = tasks.filter((t) => t.status !== "Completed")
    return `There are ${open.length} open task(s) out of ${tasks.length} total. ${
      open.length ? "Top items: " + open.slice(0, 3).map((t) => t.title).join("; ") + "." : ""
    }`
  }

  // Look for a specific SBU or project mention.
  const sbuMatch = sbus.find((s) => q.includes(s.name.toLowerCase()))
  if (sbuMatch) {
    const sbuProjects = projects.filter((p) => p.sbu === sbuMatch.id)
    return `${sbuMatch.name} (${sbuMatch.goal}): ${sbuProjects.length} project(s). ${sbuProjects
      .map((p) => `${p.name} (${p.status}, ${p.progress}%)`)
      .join("; ")}.`
  }
  const projMatch = projects.find((p) => q.includes(p.name.toLowerCase()))
  if (projMatch) {
    return `${projMatch.name} (${sbuName(projMatch.sbu)}) is ${projMatch.status} at ${projMatch.progress}% complete. Owner: ${projMatch.owner}. Revenue target ${projMatch.revenueTarget}, current ${projMatch.currentRevenue}. Next action: ${projMatch.nextAction}.`
  }

  // Default portfolio overview.
  return (
    `Portfolio overview: ${projects.length} projects across ${sbus.length} SBUs. ` +
    `${onTrack.length} on track, ${atRisk.length} at risk/delayed. ` +
    `${tasks.filter((t) => t.status !== "Completed").length} open tasks. ` +
    `Ask about a specific SBU, project, risk, revenue, KPI or due tasks for more detail.`
  )
}
