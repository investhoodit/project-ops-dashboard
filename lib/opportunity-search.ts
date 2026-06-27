import "server-only"
import { generateText, Output } from "ai"
import { z } from "zod"
import type { Opportunity, OpportunityType, OrganisationType } from "./types"
import { OPPORTUNITY_SOURCES } from "./opportunity-sources"
import { webSearch, type SearchResult } from "./search-provider"
import { ruleBasedScore, priorityFromScores } from "./opportunity-scoring"
import { integrationStatus } from "./integration-status"
import { checkOpportunityLink } from "./link-validator"
import { isOfficialSource } from "./official-sources"
import { dataQualityScore, needsReview, inferFields } from "./data-quality"

const AI_AVAILABLE = Boolean(process.env.OPENAI_API_KEY)

function slugId(url: string) {
  return "opp-" + Buffer.from(url).toString("base64url").slice(0, 28)
}

function categoryToSbu(category: OpportunityType): string {
  switch (category) {
    case "IT/Software Tender":
    case "Incubation/Accelerator":
      return "technology"
    case "SETA Opportunity":
    case "Internship/WBL":
    case "CSI/Donor/Sponsorship":
      return "npo"
    case "Agri/Community":
      return "agro"
    default:
      return "general"
  }
}

function categoryToOrg(category: OpportunityType): OrganisationType {
  if (category === "IT/Software Tender" || category === "Government Tender") return "Private Company"
  if (category === "Agri/Community") return "Farm"
  return "NPO"
}

// Convert a raw search hit into a scored Opportunity using rule-based logic.
function resultToOpportunity(r: SearchResult, category: OpportunityType, sourceName: string): Opportunity {
  const base: Opportunity = {
    id: slugId(r.url),
    title: r.title.slice(0, 240),
    description: r.snippet,
    source_name: sourceName || r.source,
    source_url: r.url,
    opportunity_type: category,
    sbu_id: categoryToSbu(category),
    organisation_type: categoryToOrg(category),
    estimated_value: "",
    location: "South Africa",
    closing_date: "",
    eligibility: "",
    contact_email: "",
    contact_phone: "",
    application_url: r.url,
    status: "New",
    priority: "Medium",
    assigned_to: "",
    notes: "Auto-discovered via opportunity search.",
    link_status: "unchecked",
    link_checked_at: "",
    link_http_status: null,
    is_official_source: isOfficialSource(r.url),
    data_quality_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const scores = ruleBasedScore(base)
  base.scores = scores
  base.priority = priorityFromScores(scores)
  return base
}

const aiEnrichmentSchema = z.object({
  opportunities: z.array(
    z.object({
      url: z.string(),
      estimated_value: z.string().describe("Monetary value if mentioned, else empty string"),
      closing_date: z.string().describe("ISO date YYYY-MM-DD if a deadline is mentioned, else empty string"),
      eligibility: z.string().describe("Brief eligibility summary, else empty string"),
      relevance: z.number().min(0).max(100),
      urgency: z.number().min(0).max(100),
      fit: z.number().min(0).max(100),
      recommendedAction: z.string(),
    }),
  ),
})

// Optionally enrich/score with AI when a key is configured. Falls back silently.
async function aiEnrich(opps: Opportunity[]): Promise<Opportunity[]> {
  if (!AI_AVAILABLE || opps.length === 0) return opps
  try {
    const { experimental_output: object } = await generateText({
      model: "openai/gpt-5-mini",
      experimental_output: Output.object({ schema: aiEnrichmentSchema }),
      prompt:
        "You are an opportunity analyst for Investhood IT (private tech company) and its NPO, school, creche and farm ventures across " +
        "Education, Technology/Software, Youth Skills/NPO, and Agro-Tech/Community. " +
        "For each opportunity below, infer estimated value, closing date, eligibility, and score relevance/urgency/fit (0-100) " +
        "with a one-line recommended action. Only use information present in the title/snippet; leave fields empty if unknown.\n\n" +
        opps
          .map((o, i) => `${i + 1}. URL: ${o.source_url}\nTitle: ${o.title}\nSnippet: ${o.description}`)
          .join("\n\n"),
    })
    const byUrl = new Map(object.opportunities.map((e) => [e.url, e]))
    return opps.map((o) => {
      const e = byUrl.get(o.source_url)
      if (!e) return o
      const scores = {
        relevance: e.relevance,
        urgency: e.urgency,
        fit: e.fit,
        recommendedAction: e.recommendedAction,
      }
      return {
        ...o,
        estimated_value: e.estimated_value || o.estimated_value,
        closing_date: e.closing_date || o.closing_date,
        eligibility: e.eligibility || o.eligibility,
        scores,
        priority: priorityFromScores(scores),
      }
    })
  } catch {
    return opps
  }
}

export interface DiscoveryResult {
  configured: boolean
  found: number
  rejected: number
  opportunities: Opportunity[]
  usedAi: boolean
}

// Validate links and compute data quality. Drops opportunities whose links are
// broken; flags low-quality or access-restricted ones as "Needs Review".
async function validateAndScore(opps: Opportunity[]): Promise<{ kept: Opportunity[]; rejected: number }> {
  const kept: Opportunity[] = []
  let rejected = 0
  // Validate with limited concurrency to avoid hammering hosts.
  const BATCH = 5
  for (let i = 0; i < opps.length; i += BATCH) {
    const batch = opps.slice(i, i + BATCH)
    const checks = await Promise.all(batch.map((o) => checkOpportunityLink(o)))
    batch.forEach((o, idx) => {
      const check = checks[idx]
      if (check.status === "broken") {
        rejected += 1
        return // reject broken links entirely
      }
      const enriched = inferFields(o)
      const quality = dataQualityScore(enriched)
      enriched.link_status = check.status
      enriched.link_checked_at = check.checkedAt
      enriched.link_http_status = check.httpStatus
      enriched.is_official_source = check.isOfficial
      enriched.data_quality_score = quality
      // Route incomplete or access-restricted records to human review.
      if (check.status === "needs_review" || needsReview(enriched)) {
        enriched.status = "Reviewing"
      }
      kept.push(enriched)
    })
  }
  return { kept, rejected }
}

// Run the full discovery across curated sources. Returns scored opportunities.
export async function runOpportunitySearch(maxSources = 8, perSource = 3): Promise<DiscoveryResult> {
  if (!integrationStatus.search) {
    return { configured: false, found: 0, rejected: 0, opportunities: [], usedAi: false }
  }

  const sources = OPPORTUNITY_SOURCES.slice(0, maxSources)
  const collected: Opportunity[] = []
  const seen = new Set<string>()

  for (const src of sources) {
    const results = await webSearch(src.query, perSource)
    for (const r of results) {
      if (!r.url || seen.has(r.url)) continue
      seen.add(r.url)
      collected.push(resultToOpportunity(r, src.category, src.name))
    }
  }

  const enriched = await aiEnrich(collected)
  // Validate links (dropping broken ones) and compute data-quality scores.
  const { kept, rejected } = await validateAndScore(enriched)

  // Highest combined score first.
  kept.sort((a, b) => {
    const sa = (a.scores?.relevance ?? 0) + (a.scores?.urgency ?? 0) + (a.scores?.fit ?? 0)
    const sb = (b.scores?.relevance ?? 0) + (b.scores?.urgency ?? 0) + (b.scores?.fit ?? 0)
    return sb - sa
  })

  return { configured: true, found: kept.length, rejected, opportunities: kept, usedAi: AI_AVAILABLE }
}
