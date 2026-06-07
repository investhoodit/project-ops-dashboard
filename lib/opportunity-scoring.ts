import type { Opportunity, OpportunityScores, OpportunityType, OrganisationType, Priority } from "./types"

// Keyword sets that signal relevance to each SBU / focus area.
const RELEVANCE_KEYWORDS = [
  "education",
  "early childhood",
  "creche",
  "crèche",
  "school",
  "learner",
  "training",
  "skills",
  "youth",
  "software",
  "web",
  "app",
  "cloud",
  "cybersecurity",
  "cyber security",
  "ict",
  "it ",
  "digital",
  "data",
  "ai",
  "artificial intelligence",
  "technology",
  "innovation",
  "seta",
  "internship",
  "learnership",
  "incubation",
  "accelerator",
  "grant",
  "funding",
  "bursary",
  "agriculture",
  "agri",
  "farm",
  "food security",
  "camp",
  "community",
  "npo",
  "non-profit",
  "stem",
  "robotics",
  "coding",
]

const HIGH_VALUE_TYPES: OpportunityType[] = ["Government Tender", "IT/Software Tender", "Grant/Funding", "International Grant"]

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

function parseValue(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[, ]/g, "").toLowerCase()
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/)
  if (!match) return 0
  let n = Number.parseFloat(match[1])
  if (match[2] === "m" || match[2] === "million") n *= 1_000_000
  if (match[2] === "k" || match[2] === "thousand") n *= 1_000
  return n
}

// Deterministic, offline scoring used when no AI key is configured, and as the
// grounded baseline when one is.
export function ruleBasedScore(opp: Partial<Opportunity>): OpportunityScores {
  const haystack = `${opp.title ?? ""} ${opp.description ?? ""} ${opp.eligibility ?? ""}`.toLowerCase()

  // Relevance: keyword density against the focus areas.
  const hits = RELEVANCE_KEYWORDS.filter((k) => haystack.includes(k)).length
  let relevance = clamp(35 + hits * 9)
  if (opp.sbu_id && opp.sbu_id !== "general") relevance = clamp(relevance + 8)

  // Urgency: based on closing date proximity.
  const days = daysUntil(opp.closing_date ?? "")
  let urgency: number
  if (days === null) urgency = 40
  else if (days < 0) urgency = 5
  else if (days <= 3) urgency = 98
  else if (days <= 7) urgency = 88
  else if (days <= 14) urgency = 72
  else if (days <= 30) urgency = 55
  else urgency = 35

  // Fit: organisation type alignment + value + type.
  let fit = 50
  const orgFit: Record<OrganisationType, number> = {
    "Private Company": 14,
    NPO: 14,
    School: 10,
    Creche: 10,
    Farm: 8,
    General: 0,
  }
  fit += orgFit[(opp.organisation_type as OrganisationType) ?? "General"] ?? 0
  if (opp.opportunity_type && HIGH_VALUE_TYPES.includes(opp.opportunity_type)) fit += 12
  const value = parseValue(opp.estimated_value ?? "")
  if (value >= 1_000_000) fit += 16
  else if (value >= 250_000) fit += 10
  else if (value >= 50_000) fit += 5
  fit = clamp(fit)

  const recommendedAction = recommendAction(relevance, urgency, fit, days)

  return { relevance, urgency, fit, recommendedAction }
}

function recommendAction(relevance: number, urgency: number, fit: number, days: number | null): string {
  const overall = (relevance + urgency + fit) / 3
  if (days !== null && days < 0) return "Closed — archive unless an extension applies."
  if (overall >= 75 && urgency >= 70) return "Prioritise now: assign an owner and start the application this week."
  if (overall >= 65) return "Strong match: review eligibility and prepare required documents."
  if (relevance >= 60 && fit < 50) return "Relevant but check fit: confirm eligibility before investing time."
  if (urgency >= 80) return "Closing soon: make a quick go/no-go decision."
  if (overall < 40) return "Low priority: monitor or mark as not relevant."
  return "Review and decide whether to pursue."
}

// Derive a suggested priority from scores.
export function priorityFromScores(scores: OpportunityScores): Priority {
  const overall = (scores.relevance + scores.urgency + scores.fit) / 3
  if (overall >= 70 || scores.urgency >= 90) return "High"
  if (overall >= 50) return "Medium"
  return "Low"
}
