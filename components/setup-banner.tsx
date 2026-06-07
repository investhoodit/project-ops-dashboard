"use client"

import { useDashboard } from "@/lib/dashboard-context"

export function SetupBanner() {
  const { integrations, source } = useDashboard()

  const missing: string[] = []
  if (!integrations.supabase) missing.push("Supabase (shared data)")
  if (!integrations.email) missing.push("Email (Resend)")
  if (!integrations.whatsapp) missing.push("WhatsApp (Twilio)")
  if (!integrations.openai) missing.push("OpenAI (advanced AI)")

  if (missing.length === 0) return null

  return (
    <div className="setup-banner">
      <div>
        <strong>Running in {source === "supabase" ? "live" : "demo"} mode.</strong>{" "}
        <span>The app works fully without keys. To unlock shared data and live notifications, add: </span>
        <small>{missing.join(", ")}.</small>
      </div>
      <small style={{ marginLeft: "auto" }}>See SETUP.md for setup steps.</small>
    </div>
  )
}
