import { NextResponse } from "next/server"
import { getOpportunities, upsertOpportunity } from "@/lib/opportunity-data"
import { ruleBasedScore, priorityFromScores } from "@/lib/opportunity-scoring"
import { getPublicIntegrationStatus } from "@/lib/integration-status"
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
    created_at: body.created_at ?? now,
    updated_at: now,
  }

  // (Re)compute rule-based scores unless explicit scores were provided.
  const scores = body.scores ?? ruleBasedScore(opp)
  opp.scores = scores
  if (!body.priority) opp.priority = priorityFromScores(scores)

  const saved = await upsertOpportunity(opp)
  return NextResponse.json({ ok: true, opportunity: opp, persisted: saved })
}
