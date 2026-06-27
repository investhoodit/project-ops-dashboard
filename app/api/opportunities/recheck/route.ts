import { NextResponse } from "next/server"
import { getOpportunities, upsertOpportunity } from "@/lib/opportunity-data"
import { checkOpportunityLink } from "@/lib/link-validator"
import type { Opportunity, LinkStatus } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Apply a fresh link check to one opportunity and persist the result.
async function recheckOne(opp: Opportunity): Promise<Opportunity> {
  const check = await checkOpportunityLink(opp)
  const updated: Opportunity = {
    ...opp,
    link_status: check.status,
    link_checked_at: check.checkedAt,
    link_http_status: check.httpStatus,
    is_official_source: check.isOfficial,
    updated_at: new Date().toISOString(),
  }
  await upsertOpportunity(updated)
  return updated
}

// POST — re-check a single opportunity's link.
// Body: { id: string } OR { id, source_url, application_url } for ad-hoc checks.
export async function POST(request: Request) {
  let body: { id?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ ok: false, error: "id is required." }, { status: 400 })

  const { opportunities } = await getOpportunities()
  const opp = opportunities.find((o) => o.id === body.id)
  if (!opp) return NextResponse.json({ ok: false, error: "Opportunity not found." }, { status: 404 })

  const updated = await recheckOne(opp)
  return NextResponse.json({
    ok: true,
    id: updated.id,
    link_status: updated.link_status,
    link_http_status: updated.link_http_status,
    link_checked_at: updated.link_checked_at,
  })
}

// GET — bulk re-check (daily cron). Protected by CRON_SECRET when set.
// Re-checks links that are stale or previously non-verified to keep the
// pipeline trustworthy without hammering every URL each run.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const { opportunities, source } = await getOpportunities()
  if (source === "demo") {
    return NextResponse.json({ ok: true, persisted: false, checked: 0, message: "Demo mode — nothing to persist." })
  }

  const STALE_MS = 1000 * 60 * 60 * 24 // 24h
  const now = Date.now()
  const due = opportunities.filter((o) => {
    if (["Won", "Lost", "Archived", "Not Relevant"].includes(o.status)) return false
    if (o.link_status !== "verified") return true // always re-try non-verified
    const last = o.link_checked_at ? new Date(o.link_checked_at).getTime() : 0
    return now - last > STALE_MS
  })

  const counts: Record<LinkStatus, number> = { verified: 0, broken: 0, needs_review: 0, unchecked: 0 }
  // Limit per run to stay within the function timeout.
  const MAX = 40
  for (const opp of due.slice(0, MAX)) {
    const updated = await recheckOne(opp)
    counts[updated.link_status] += 1
  }

  return NextResponse.json({ ok: true, persisted: true, checked: Math.min(due.length, MAX), due: due.length, counts })
}
