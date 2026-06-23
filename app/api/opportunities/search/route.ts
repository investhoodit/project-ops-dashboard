import { NextResponse } from "next/server"
import { runOpportunitySearch } from "@/lib/opportunity-search"
import { insertDiscovered, recordSearchRun } from "@/lib/opportunity-data"
import { notifyHighPriorityOpportunities } from "@/lib/opportunity-notify"
import { integrationStatus } from "@/lib/integration-status"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Runs an opportunity search. Used by the "Run Search Now" button (POST) and
// by the daily cron (GET with Bearer CRON_SECRET).
async function handle(triggeredBy: string) {
  if (!integrationStatus.search) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        "Opportunity search is not configured yet. Add a search provider API key (TAVILY_API_KEY, SERPAPI_API_KEY or BING_SEARCH_API_KEY) to enable automated searches.",
    })
  }

  const result = await runOpportunitySearch()
  const inserted = await insertDiscovered(result.opportunities)
  await recordSearchRun({
    triggered_by: triggeredBy,
    status: "success",
    found: result.found,
    inserted,
    notes: result.rejected > 0 ? `${result.rejected} rejected (broken links)` : "",
  })

  // Notify on high-priority finds (best-effort; no-op if channels unconfigured).
  const highPriority = result.opportunities.filter((o) => o.priority === "High")
  let notified = false
  if (highPriority.length > 0) {
    notified = await notifyHighPriorityOpportunities(highPriority)
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    found: result.found,
    rejected: result.rejected,
    inserted,
    usedAi: result.usedAi,
    highPriority: highPriority.length,
    notified,
    opportunities: result.opportunities.slice(0, 50),
  })
}

export async function POST() {
  return handle("manual")
}

export async function GET(request: Request) {
  // Cron protection.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }
  return handle("cron")
}
