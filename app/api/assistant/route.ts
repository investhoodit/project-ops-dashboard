import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { analyzeQuestion } from "@/lib/assistant-analysis"
import { classifyQuestion, type AssistantMode, type AssistantSource } from "@/lib/assistant-router"
import { OFFICIAL_SOURCE_DOMAINS } from "@/lib/official-sources"
import { searchKnowledgeBase } from "@/lib/knowledge-base-data"
import type { DashboardData } from "@/lib/types"

export const dynamic = "force-dynamic"

// Provider priority (server-only — keys are NEVER sent to the client):
// 1. OPENAI_API_KEY  -> call OpenAI directly (no Vercel AI Gateway, no gateway billing).
// 2. AI_GATEWAY_API_KEY -> only used as a fallback when OPENAI_API_KEY is absent.
const OPENAI_KEY = process.env.OPENAI_API_KEY
const GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY
// Any model access (OpenAI direct OR Vercel AI Gateway) enables phrased answers.
const AI_AVAILABLE = Boolean(OPENAI_KEY || GATEWAY_KEY)
// Live web search is only available through the OpenAI Responses API (direct key).
const WEB_AVAILABLE = Boolean(OPENAI_KEY)

// The active model provider, with OpenAI strictly prioritised over the gateway.
type Provider = "openai" | "gateway" | "local"
const ACTIVE_PROVIDER: Exclude<Provider, "local"> | null = OPENAI_KEY
  ? "openai"
  : GATEWAY_KEY
    ? "gateway"
    : null

// Low-cost OpenAI model for normal dashboard/general questions (and web search,
// which the Responses API supports on this model).
const LOW_COST_MODEL = "gpt-4o-mini"

const ORG_CONTEXT =
  "You are the portfolio assistant for Investhood IT — a South African group spanning IT/software, " +
  "early childhood education, youth skills development (NPO), and agro-tech/community ventures. " +
  "You help the team with business, funding, tenders, SETA, NPO, IT, education, agriculture and strategy questions. " +
  "Be concise, practical and accurate. Use South African context (Rands, SETAs, B-BBEE, CSD, eTenders) where relevant."

// A reusable OpenAI provider bound to the explicit key (when present).
const openaiProvider = OPENAI_KEY ? createOpenAI({ apiKey: OPENAI_KEY }) : null

// Resolve the chat model. When OPENAI_API_KEY is set we hit OpenAI directly
// (avoiding the AI Gateway billing requirement entirely); only when it is
// missing do we fall back to a bare gateway string routed through the Vercel
// AI Gateway.
function chatModel() {
  return openaiProvider ? openaiProvider(LOW_COST_MODEL) : (`openai/${LOW_COST_MODEL}` as never)
}

// Build an organisation-knowledge block from the knowledge base, if any entries
// match. Used to ground general/strategy answers in Investhood-specific facts.
async function knowledgeContext(question: string): Promise<string> {
  try {
    const entries = await searchKnowledgeBase(question, 4)
    if (entries.length === 0) return ""
    const block = entries
      .map((e) => `- [${e.category}] ${e.title}: ${e.content}`)
      .join("\n")
    return `\n\nOrganisation knowledge base (use where relevant, prefer over assumptions):\n${block}`
  } catch {
    return ""
  }
}

// Answer a general-knowledge / strategy question, grounded with KB context.
async function answerGeneral(question: string): Promise<string> {
  const kb = await knowledgeContext(question)
  const { text } = await generateText({
    model: chatModel(),
    system:
      ORG_CONTEXT +
      " This question is general knowledge or strategy — answer from your own expertise" +
      (kb ? " and the organisation knowledge base provided." : ".") +
      " If something depends on current dates, deadlines or live figures, say it should be verified against the official source.",
    prompt: question + kb,
  })
  return text
}

// Answer using the OpenAI Responses API with the built-in web_search tool, and
// return clickable citations.
async function answerWithWeb(question: string): Promise<{ answer: string; sources: AssistantSource[] }> {
  const openai = openaiProvider ?? createOpenAI({ apiKey: OPENAI_KEY })
  const priority = OFFICIAL_SOURCE_DOMAINS.join(", ")
  const { text, sources } = await generateText({
    model: openai.responses(LOW_COST_MODEL),
    tools: { web_search: openai.tools.webSearch({}) },
    toolChoice: "auto",
    system:
      ORG_CONTEXT +
      " Use web search to find current, accurate information. " +
      `Prefer official South African sources where relevant (e.g. ${priority}). ` +
      "Cite the pages you used. Summarise clearly and note any closing dates or eligibility you find.",
    prompt: question,
  })
  const seen = new Set<string>()
  const cites: AssistantSource[] = []
  for (const s of sources ?? []) {
    if (s.sourceType !== "url" || !s.url || seen.has(s.url)) continue
    seen.add(s.url)
    cites.push({ title: s.title || new URL(s.url).host.replace(/^www\./, ""), url: s.url })
  }
  return { answer: text, sources: cites }
}

// Phrase a dashboard answer with the model, grounded strictly in computed facts.
async function answerDashboard(question: string, grounded: string, data: DashboardData): Promise<string> {
  const { text } = await generateText({
    model: chatModel(),
    system:
      ORG_CONTEXT +
      " Answer ONLY using the provided dashboard facts. Do not invent numbers. " +
      "If the facts do not cover the question, say so briefly.",
    prompt: `User question: ${question}\n\nDashboard facts:\n${grounded}\n\nFull data (JSON):\n${JSON.stringify(
      data,
    ).slice(0, 6000)}`,
  })
  return text || grounded
}

export async function POST(request: Request) {
  let question = ""
  let data: DashboardData | null = null
  try {
    const body = await request.json()
    question = String(body.question ?? "")
    data = body.data ?? null
  } catch {
    return NextResponse.json({ answer: "Invalid request.", mode: "local" }, { status: 400 })
  }

  if (!question.trim()) {
    return NextResponse.json({
      answer:
        "Ask me about your dashboard (SBUs, projects, risks, tasks, KPIs, revenue) or a general business, funding, tender, SETA or strategy question.",
      mode: "local" as AssistantMode,
    })
  }

  const safeData: DashboardData =
    data ?? { sbus: [], projects: [], tasks: [], weeklyReview: [], kpis: [], events: [] }
  const grounded = analyzeQuestion(question, safeData)

  // No model access at all → grounded local analysis only.
  if (!AI_AVAILABLE) {
    return NextResponse.json({
      answer: grounded,
      mode: "local" as AssistantMode,
      provider: "local" as Provider,
    })
  }

  const route = classifyQuestion(question, safeData, WEB_AVAILABLE)

  try {
    if (route === "web") {
      const { answer, sources } = await answerWithWeb(question)
      // Web search always runs on the direct OpenAI provider.
      return NextResponse.json({
        answer: answer || grounded,
        mode: "web" as AssistantMode,
        provider: "openai" as Provider,
        sources,
      })
    }
    if (route === "general") {
      const answer = await answerGeneral(question)
      return NextResponse.json({
        answer,
        mode: "general" as AssistantMode,
        provider: ACTIVE_PROVIDER as Provider,
      })
    }
    // dashboard
    const answer = await answerDashboard(question, grounded, safeData)
    return NextResponse.json({
      answer,
      mode: "dashboard" as AssistantMode,
      provider: ACTIVE_PROVIDER as Provider,
    })
  } catch (err) {
    // Any failure (missing/invalid key, rate limit, network) → graceful fallback
    // to grounded local analysis, but surface WHY so the user can fix setup.
    const message = err instanceof Error ? err.message : String(err)
    const usingOpenAI = ACTIVE_PROVIDER === "openai"
    let notice = usingOpenAI
      ? "OpenAI is temporarily unavailable, so this answer uses on-device analysis of your dashboard data."
      : "AI mode is temporarily unavailable, so this answer uses on-device analysis of your dashboard data."
    if (/quota|rate limit|429|insufficient_quota|exceeded/i.test(message)) {
      notice = usingOpenAI
        ? "Your OpenAI account is out of quota or billing is not active. Add credits/billing at platform.openai.com. Showing on-device analysis for now."
        : "The AI provider is rate-limited or out of quota right now. Showing on-device analysis instead."
    } else if (/api key|unauthor|401|invalid_api_key|invalid|missing/i.test(message)) {
      notice = usingOpenAI
        ? "Your OPENAI_API_KEY looks missing or invalid. Check it in project settings. Showing on-device analysis for now."
        : "The AI key looks missing or invalid. Set OPENAI_API_KEY (preferred). Showing on-device analysis for now."
    } else if (/credit card|billing|payment|unlock your free credits/i.test(message)) {
      // Only reachable when no OPENAI_API_KEY is set and the gateway is in use.
      notice =
        "AI answers are routed through the Vercel AI Gateway, which needs a credit card on file. " +
        "Set an OPENAI_API_KEY to call OpenAI directly instead. Showing on-device analysis for now."
    }
    return NextResponse.json({
      answer: grounded,
      mode: "local" as AssistantMode,
      provider: "local" as Provider,
      notice,
    })
  }
}
