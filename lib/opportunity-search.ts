import "server-only"
import { generateObject } from "ai"
import { z } from "zod"
import type { Opportunity, OpportunityType, OrganisationType } from "./types"
import { OPPORTUNITY_SOURCES } from "./opportunity-sources"
import { webSearch, type SearchResult } from "./search-provider"
import { ruleBasedScore, priorityFromScores } from "./opportunity-scoring"
import { integrationStatus } from "./integration-status"

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
    const { object } = await generateObject({
      model: "openai/gpt-5-mini",
      schema: aiEnrichmentSchema,
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
  opportunities: Opportunity[]
  usedAi: boolean
}

// Run the full discovery across curated sources. Returns scored opportunities.
export async function runOpportunitySearch(maxSources = 8, perSource = 3): Promise<DiscoveryResult> {
  if (!integrationStatus.search) {
    return { configured: false, found: 0, opportunities: [], usedAi: false }
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
  // Highest combined score first.
  enriched.sort((a, b) => {
    const sa = (a.scores?.relevance ?? 0) + (a.scores?.urgency ?? 0) + (a.scores?.fit ?? 0)
    const sb = (b.scores?.relevance ?? 0) + (b.scores?.urgency ?? 0) + (b.scores?.fit ?? 0)
    return sb - sa
  })

  return { configured: true, found: enriched.length, opportunities: enriched, usedAi: AI_AVAILABLE }
}
