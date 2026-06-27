import type { DashboardData } from "./types"

// The four answer modes surfaced to the UI as indicators.
export type AssistantMode = "dashboard" | "general" | "web" | "local"

export interface AssistantSource {
  title: string
  url: string
}

export interface AssistantReply {
  answer: string
  mode: AssistantMode
  sources?: AssistantSource[]
}

// Signals that a question needs current / external information and should use
// web search (when available) rather than the model's training data alone.
const WEB_SIGNALS = [
  "latest",
  "current",
  "currently",
  "recent",
  "recently",
  "today",
  "this week",
  "this month",
  "this year",
  "right now",
  "news",
  "newest",
  "open now",
  "now open",
  "closing soon",
  "deadline",
  "due date",
  "when does",
  "when is",
  "how much is",
  "price of",
  "2024",
  "2025",
  "2026",
  "2027",
  "live",
  "available now",
  "upcoming",
  "new tender",
  "new tenders",
  "new grant",
  "new grants",
  "new funding",
  "active tender",
  "find tenders",
  "find grants",
  "find funding",
  "search for",
  "look up",
  "browse",
]

// Topic words that map to the organisation's focus areas — general business
// questions the assistant should answer even when the dashboard has no data.
const GENERAL_TOPIC_SIGNALS = [
  "seta",
  "tender",
  "grant",
  "funding",
  "bursary",
  "npo",
  "non-profit",
  "nonprofit",
  "education",
  "agriculture",
  "agri",
  "farming",
  "strategy",
  "business plan",
  "proposal",
  "compliance",
  "bee",
  "b-bbee",
  "tax",
  "registration",
  "policy",
  "market",
  "competitor",
  "pricing",
  "incubation",
  "accelerator",
  "learnership",
  "internship",
  "skills development",
  "how do i",
  "how to",
  "what is",
  "explain",
  "best practice",
  "advice",
  "recommend",
]

// Builds the set of dashboard entity names (SBUs, projects) so we can detect
// when a question is really about the user's own portfolio data.
function dashboardTerms(data: DashboardData): string[] {
  const terms: string[] = [
    "sbu",
    "sbus",
    "project",
    "projects",
    "task",
    "tasks",
    "kpi",
    "kpis",
    "risk",
    "at risk",
    "revenue",
    "overdue",
    "deadline",
    "portfolio",
    "progress",
    "owner",
    "milestone",
    "weekly review",
    "business unit",
  ]
  for (const s of data.sbus ?? []) terms.push(s.name.toLowerCase())
  for (const p of data.projects ?? []) terms.push(p.name.toLowerCase())
  return terms
}

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

// Decide which route a question should take. `webEnabled` reflects whether the
// OpenAI Responses web_search capability is configured (OPENAI_API_KEY set).
export function classifyQuestion(
  question: string,
  data: DashboardData,
  webEnabled: boolean,
): AssistantMode {
  const q = question.toLowerCase()
  const isDashboard = matchesAny(q, dashboardTerms(data))
  const wantsWeb = matchesAny(q, WEB_SIGNALS)

  // A question that references the user's own data wins, unless it explicitly
  // asks for current/external info AND web search is available.
  if (isDashboard && !(wantsWeb && webEnabled)) return "dashboard"
  if (wantsWeb && webEnabled) return "web"
  if (isDashboard) return "dashboard"

  // Anything else is general knowledge (funding, SETA, strategy, IT, etc.).
  if (matchesAny(q, GENERAL_TOPIC_SIGNALS) || q.length > 0) return "general"
  return "general"
}
