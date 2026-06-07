import "server-only"
import { seedData } from "./seed-data"
import type { DashboardData } from "./types"
import { integrationStatus } from "./integration-status"

// Server-side data adapter.
// When Supabase env vars are present it reads from the Supabase REST API.
// Otherwise (or on any failure) it returns the local demo data so the app
// always renders and deploys successfully without environment variables.

const TABLES = ["sbus", "projects", "tasks", "weekly_review", "kpis", "events"] as const

// Normalize SUPABASE_URL so it works whether the user provides the bare project
// URL (https://xxxx.supabase.co) or the full REST URL (.../rest/v1[/]).
// We strip any trailing slash and a trailing "/rest/v1" segment, then re-append
// "/rest/v1" ourselves to build a valid endpoint.
function restBase(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
}

async function fetchTable<T>(table: string): Promise<T[] | null> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const res = await fetch(`${restBase(url)}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      // Always fetch fresh data for an operations dashboard.
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as T[]
  } catch {
    return null
  }
}

export async function getDashboardData(): Promise<{ data: DashboardData; source: "supabase" | "demo" }> {
  if (!integrationStatus.supabase) {
    return { data: seedData, source: "demo" }
  }

  try {
    const [sbus, projects, tasks, weeklyReview, kpis, events] = await Promise.all([
      fetchTable<DashboardData["sbus"][number]>("sbus"),
      fetchTable<DashboardData["projects"][number]>("projects"),
      fetchTable<DashboardData["tasks"][number]>("tasks"),
      fetchTable<DashboardData["weeklyReview"][number]>("weekly_review"),
      fetchTable<DashboardData["kpis"][number]>("kpis"),
      fetchTable<DashboardData["events"][number]>("events"),
    ])

    // If the core tables are missing/empty, fall back to demo data so the
    // dashboard never renders blank.
    if (!projects || projects.length === 0) {
      return { data: seedData, source: "demo" }
    }

    return {
      data: {
        sbus: sbus?.length ? sbus : seedData.sbus,
        projects,
        tasks: tasks ?? [],
        weeklyReview: weeklyReview?.length ? weeklyReview : seedData.weeklyReview,
        kpis: kpis?.length ? kpis : seedData.kpis,
        events: events ?? [],
      },
      source: "supabase",
    }
  } catch {
    return { data: seedData, source: "demo" }
  }
}

export { TABLES }
