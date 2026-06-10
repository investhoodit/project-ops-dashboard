import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { analyzeQuestion } from "@/lib/assistant-analysis"
import { classifyQuestion, type AssistantMode, type AssistantSource } from "@/lib/assistant-router"
import { OFFICIAL_SOURCE_DOMAINS } from "@/lib/official-sources"
import type { DashboardData } from "@/lib/types"

export const dynamic = "force-dynamic"

// Web search needs the OpenAI Responses API specifically (OPENAI_API_KEY).
const OPENAI_KEY = process.env.OPENAI_API_KEY
const GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY
// Any model access (OpenAI direct or Vercel AI Gateway) enables phrased answers.
const AI_AVAILABLE = Boolean(OPENAI_KEY || GATEWAY_KEY)
// Live web search is only available through the OpenAI Responses API.
const WEB_AVAILABLE = Boolean(OPENAI_KEY)

const ORG_CONTEXT =
  "You are the portfolio assistant for Investhood IT — a South African group spanning IT/software, " +
  "early childhood education, youth skills development (NPO), and agro-tech/community ventures. " +
  "You help the team with business, funding, tenders, SETA, NPO, IT, education, agriculture and strategy questions. " +
  "Be concise, practical and accurate. Use South African context (Rands, SETAs, B-BBEE, CSD, eTenders) where relevant."

function modelString() {
  // Prefer OpenAI directly when its key is present; otherwise use the gateway.
  return OPENAI_KEY ? "gpt-5.5" : "openai/gpt-5.5"
}

// Answer a general-knowledge / strategy question with the model only.
async function answerGeneral(question: string): Promise<string> {
  const { text } = await generateText({
    model: modelString() as never,
    system:
      ORG_CONTEXT +
      " This question is general knowledge — answer from your own expertise. " +
      "If something depends on current dates, deadlines or live figures, say it should be verified against the official source.",
    prompt: question,
  })
  return text
}

// Answer using the OpenAI Responses API with the built-in web_search tool, and
// return clickable citations.
async function answerWithWeb(question: string): Promise<{ answer: string; sources: AssistantSource[] }> {
  const openai = createOpenAI({ apiKey: OPENAI_KEY })
  const priority = OFFICIAL_SOURCE_DOMAINS.join(", ")
  const { text, sources } = await generateText({
    model: openai.responses("gpt-5.5"),
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
    model: modelString() as never,
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
    return NextResponse.json({ answer: grounded, mode: "local" as AssistantMode })
  }

  const route = classifyQuestion(question, safeData, WEB_AVAILABLE)

  try {
    if (route === "web") {
      const { answer, sources } = await answerWithWeb(question)
      return NextResponse.json({ answer: answer || grounded, mode: "web" as AssistantMode, sources })
    }
    if (route === "general") {
      const answer = await answerGeneral(question)
      return NextResponse.json({ answer, mode: "general" as AssistantMode })
    }
    // dashboard
    const answer = await answerDashboard(question, grounded, safeData)
    return NextResponse.json({ answer, mode: "dashboard" as AssistantMode })
  } catch {
    // Any failure (missing/invalid key, rate limit, network) → graceful fallback.
    return NextResponse.json({ answer: grounded, mode: "local" as AssistantMode })
  }
}
