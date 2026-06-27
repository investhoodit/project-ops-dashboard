import { NextResponse } from "next/server"
import { getOpportunities, upsertOpportunity } from "@/lib/opportunity-data"
import { ruleBasedScore, priorityFromScores } from "@/lib/opportunity-scoring"
import { getPublicIntegrationStatus } from "@/lib/integration-status"
import { checkOpportunityLink } from "@/lib/link-validator"
import { dataQualityScore, needsReview } from "@/lib/data-quality"
import { isOfficialSource } from "@/lib/official-sources"
import type { Opportunity } from "@/lib/types"

export const dynamic = "force-dynamic"

// GET — list all opportunities (live from Supabase or demo fallback).
export async function GET() {
  const { opportunities, source } = await getOpportunities()
  const integrations = getPublicIntegrationStatus()
  return NextResponse.json({ opportunities, source, integrations })
}

// POST — create or update an opportunity (manual capture / edit / convert).
export async function POST(request: Request) {
  let body: Partial<Opportunity>
  try {
    body = (await request.json()) as Partial<Opportunity>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 })
  }

  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ ok: false, error: "Title is required." }, { status: 400 })
  }

  const now = new Date().toISOString()
  const id = body.id || `opp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

  const opp: Opportunity = {
    id,
    title: body.title.trim(),
    description: body.description ?? "",
    source_name: body.source_name ?? "Manual entry",
    source_url: body.source_url ?? "",
    opportunity_type: body.opportunity_type ?? "Other",
    sbu_id: body.sbu_id ?? "general",
    organisation_type: body.organisation_type ?? "General",
    estimated_value: body.estimated_value ?? "",
    location: body.location ?? "",
    closing_date: body.closing_date ?? "",
    eligibility: body.eligibility ?? "",
    contact_email: body.contact_email ?? "",
    contact_phone: body.contact_phone ?? "",
    application_url: body.application_url ?? "",
    status: body.status ?? "New",
    priority: body.priority ?? "Medium",
    assigned_to: body.assigned_to ?? "",
    notes: body.notes ?? "",
    link_status: body.link_status ?? "unchecked",
    link_checked_at: body.link_checked_at ?? "",
    link_http_status: body.link_http_status ?? null,
    is_official_source: isOfficialSource(body.application_url || body.source_url || ""),
    data_quality_score: 0,
    created_at: body.created_at ?? now,
    updated_at: now,
  }

  // (Re)compute rule-based scores unless explicit scores were provided.
  const scores = body.scores ?? ruleBasedScore(opp)
  opp.scores = scores
  if (!body.priority) opp.priority = priorityFromScores(scores)

  // Validate the link on save (best-effort) so manual entries are checked too.
  // Skip auto-validation when the caller explicitly reports the link broken —
  // that is a human override we must not silently undo.
  const humanReportedBroken = body.link_status === "broken"
  if (!humanReportedBroken && (opp.source_url || opp.application_url)) {
    const check = await checkOpportunityLink(opp)
    opp.link_status = check.status
    opp.link_checked_at = check.checkedAt
    opp.link_http_status = check.httpStatus
    opp.is_official_source = check.isOfficial
  }

  // Compute data quality and auto-route incomplete records to review (unless the
  // user explicitly set a status other than the default "New").
  opp.data_quality_score = dataQualityScore(opp)
  if (!body.status && needsReview(opp)) opp.status = "Reviewing"

  const saved = await upsertOpportunity(opp)
  return NextResponse.json({ ok: true, opportunity: opp, persisted: saved })
}
