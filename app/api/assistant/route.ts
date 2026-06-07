import { NextResponse } from "next/server"
import { generateText } from "ai"
import { analyzeQuestion } from "@/lib/assistant-analysis"
import type { DashboardData } from "@/lib/types"

export const dynamic = "force-dynamic"

const AI_AVAILABLE = Boolean(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY)

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

  if (!question.trim() || !data) {
    return NextResponse.json({
      answer: "Please ask a question about an SBU, project, task, risk, KPI or revenue item.",
      mode: "local",
    })
  }

  // Always compute the grounded local answer first.
  const grounded = analyzeQuestion(question, data)

  if (!AI_AVAILABLE) {
    return NextResponse.json({ answer: grounded, mode: "local" })
  }

  // When a key is configured, use the model to phrase a concise answer,
  // grounded strictly in the dashboard facts we computed.
  try {
    const { text } = await generateText({
      model: "openai/gpt-5.5",
      system:
        "You are the portfolio assistant for the Investhood IT Project & Operations Dashboard. " +
        "Answer ONLY using the provided dashboard facts. Be concise and practical. " +
        "If the facts do not cover the question, say so briefly. Do not invent numbers.",
      prompt: `User question: ${question}\n\nDashboard facts:\n${grounded}\n\nFull data (JSON):\n${JSON.stringify(
        data,
      ).slice(0, 6000)}`,
    })
    return NextResponse.json({ answer: text || grounded, mode: "ai" })
  } catch {
    // Any failure (missing/invalid key, rate limit, network) → graceful fallback.
    return NextResponse.json({ answer: grounded, mode: "local" })
  }
}
