import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET when set.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const origin = request.nextUrl.origin
  try {
    const res = await fetch(`${origin}/api/notify-due-tasks`, { method: "POST" })
    const result = await res.json()
    return NextResponse.json({ ok: true, triggered: true, result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
