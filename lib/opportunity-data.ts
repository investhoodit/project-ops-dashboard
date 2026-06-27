import "server-only"
import type { Opportunity } from "./types"
import { demoOpportunities } from "./opportunity-seed"
import { ruleBasedScore } from "./opportunity-scoring"

// Normalize SUPABASE_URL (may include trailing slash and/or /rest/v1 suffix).
function restBase(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
}

function creds() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { base: restBase(url), key }
}

// DB columns store scores as flat numeric fields; the app uses a nested object.
interface OppRow {
  id: string
  title: string
  description: string
  source_name: string
  source_url: string
  opportunity_type: string
  sbu_id: string
  organisation_type: string
  estimated_value: string
  location: string
  closing_date: string | null
  eligibility: string
  contact_email: string
  contact_phone: string
  application_url: string
  status: string
  priority: string
  assigned_to: string
  notes: string
  relevance_score: number | null
  urgency_score: number | null
  fit_score: number | null
  recommended_action: string | null
  link_status: string | null
  link_checked_at: string | null
  link_http_status: number | null
  is_official_source: boolean | null
  data_quality_score: number | null
  created_at: string
  updated_at: string
}

function rowToOpportunity(r: OppRow): Opportunity {
  return {
    id: r.id,
    title: r.title ?? "",
    description: r.description ?? "",
    source_name: r.source_name ?? "",
    source_url: r.source_url ?? "",
    opportunity_type: (r.opportunity_type as Opportunity["opportunity_type"]) ?? "Other",
    sbu_id: r.sbu_id ?? "general",
    organisation_type: (r.organisation_type as Opportunity["organisation_type"]) ?? "General",
    estimated_value: r.estimated_value ?? "",
    location: r.location ?? "",
    closing_date: r.closing_date ?? "",
    eligibility: r.eligibility ?? "",
    contact_email: r.contact_email ?? "",
    contact_phone: r.contact_phone ?? "",
    application_url: r.application_url ?? "",
    status: (r.status as Opportunity["status"]) ?? "New",
    priority: (r.priority as Opportunity["priority"]) ?? "Medium",
    assigned_to: r.assigned_to ?? "",
    notes: r.notes ?? "",
    scores:
      r.relevance_score != null
        ? {
            relevance: r.relevance_score ?? 0,
            urgency: r.urgency_score ?? 0,
            fit: r.fit_score ?? 0,
            recommendedAction: r.recommended_action ?? "",
          }
        : ruleBasedScore(r as unknown as Partial<Opportunity>),
    link_status: (r.link_status as Opportunity["link_status"]) ?? "unchecked",
    link_checked_at: r.link_checked_at ?? "",
    link_http_status: r.link_http_status ?? null,
    is_official_source: r.is_official_source ?? false,
    data_quality_score: r.data_quality_score ?? 0,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: r.updated_at ?? new Date().toISOString(),
  }
}

function opportunityToRow(o: Opportunity): Record<string, unknown> {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    source_name: o.source_name,
    source_url: o.source_url,
    opportunity_type: o.opportunity_type,
    sbu_id: o.sbu_id,
    organisation_type: o.organisation_type,
    estimated_value: o.estimated_value,
    location: o.location,
    closing_date: o.closing_date || null,
    eligibility: o.eligibility,
    contact_email: o.contact_email,
    contact_phone: o.contact_phone,
    application_url: o.application_url,
    status: o.status,
    priority: o.priority,
    assigned_to: o.assigned_to,
    notes: o.notes,
    relevance_score: o.scores?.relevance ?? null,
    urgency_score: o.scores?.urgency ?? null,
    fit_score: o.scores?.fit ?? null,
    recommended_action: o.scores?.recommendedAction ?? null,
    link_status: o.link_status ?? "unchecked",
    link_checked_at: o.link_checked_at || null,
    link_http_status: o.link_http_status ?? null,
    is_official_source: o.is_official_source ?? false,
    data_quality_score: o.data_quality_score ?? 0,
    updated_at: new Date().toISOString(),
  }
}

export interface OpportunitiesResult {
  opportunities: Opportunity[]
  source: "supabase" | "demo"
}

// Read all opportunities. Falls back to demo data when Supabase is not
// configured or the table is missing/unreadable.
export async function getOpportunities(): Promise<OpportunitiesResult> {
  const c = creds()
  if (!c) return { opportunities: demoOpportunities, source: "demo" }
  try {
    const res = await fetch(`${c.base}/rest/v1/opportunities?select=*&order=updated_at.desc`, {
      headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
      cache: "no-store",
    })
    if (!res.ok) return { opportunities: demoOpportunities, source: "demo" }
    const rows = (await res.json()) as OppRow[]
    if (!Array.isArray(rows)) return { opportunities: demoOpportunities, source: "demo" }
    return { opportunities: rows.map(rowToOpportunity), source: "supabase" }
  } catch {
    return { opportunities: demoOpportunities, source: "demo" }
  }
}

// Upsert an opportunity. Returns true on success. No-op (returns false) in demo mode.
export async function upsertOpportunity(opp: Opportunity): Promise<boolean> {
  const c = creds()
  if (!c) return false
  try {
    const res = await fetch(`${c.base}/rest/v1/opportunities?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(opportunityToRow(opp)),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

// Insert opportunities discovered by a search run, skipping duplicates by source_url.
export async function insertDiscovered(opps: Opportunity[]): Promise<number> {
  const c = creds()
  if (!c || opps.length === 0) return 0
  try {
    const res = await fetch(`${c.base}/rest/v1/opportunities?on_conflict=source_url`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify(opps.map(opportunityToRow)),
      cache: "no-store",
    })
    if (!res.ok) return 0
    const inserted = (await res.json()) as unknown[]
    return Array.isArray(inserted) ? inserted.length : 0
  } catch {
    return 0
  }
}

// Record a search run for the audit log (best-effort).
export async function recordSearchRun(payload: {
  triggered_by: string
  status: string
  found: number
  inserted: number
  notes?: string
}): Promise<void> {
  const c = creds()
  if (!c) return
  try {
    await fetch(`${c.base}/rest/v1/opportunity_search_runs`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        triggered_by: payload.triggered_by,
        status: payload.status,
        found: payload.found,
        inserted: payload.inserted,
        notes: payload.notes ?? "",
        ran_at: new Date().toISOString(),
      }),
      cache: "no-store",
    })
  } catch {
    /* best-effort logging */
  }
}
