import "server-only"
import type { Opportunity } from "./types"
import { integrationStatus } from "./integration-status"
import { sendEmail, sendWhatsApp, escapeHtml } from "./notify-channels"

// Sends an alert summarising high-priority opportunities over the configured
// channels. Returns true if at least one channel sent successfully.
export async function notifyHighPriorityOpportunities(opps: Opportunity[]): Promise<boolean> {
  if (opps.length === 0) return false

  const subject = `Opportunity Alert: ${opps.length} high-priority ${opps.length === 1 ? "opportunity" : "opportunities"}`
  const text = opportunitiesToText(opps)
  const html = opportunitiesToHtml(opps)

  const [email, whatsapp] = await Promise.all([
    integrationStatus.email ? sendEmail(subject, text, html) : Promise.resolve({ sent: false }),
    integrationStatus.twilioWhatsapp ? sendWhatsApp(text) : Promise.resolve({ sent: false }),
  ])

  return Boolean(email.sent || whatsapp.sent)
}

function opportunitiesToText(opps: Opportunity[]): string {
  const lines = ["Investhood IT — High-Priority Opportunities", ""]
  for (const o of opps) {
    lines.push(`• ${o.title}`)
    lines.push(`  Source: ${o.source_name}${o.closing_date ? ` · Closes ${o.closing_date}` : ""}`)
    if (o.estimated_value) lines.push(`  Value: ${o.estimated_value}`)
    if (o.scores) lines.push(`  Action: ${o.scores.recommendedAction}`)
    if (o.application_url) lines.push(`  Apply: ${o.application_url}`)
    lines.push("")
  }
  return lines.join("\n")
}

function opportunitiesToHtml(opps: Opportunity[]): string {
  const items = opps
    .map(
      (o) => `<li style="margin-bottom:12px">
        <strong>${escapeHtml(o.title)}</strong><br/>
        <span style="color:#64748b">${escapeHtml(o.source_name)}${o.closing_date ? ` &middot; Closes ${escapeHtml(o.closing_date)}` : ""}</span>
        ${o.estimated_value ? `<br/>Value: ${escapeHtml(o.estimated_value)}` : ""}
        ${o.scores ? `<br/><em>${escapeHtml(o.scores.recommendedAction)}</em>` : ""}
        ${o.application_url ? `<br/><a href="${escapeHtml(o.application_url)}">View opportunity</a>` : ""}
      </li>`,
    )
    .join("")
  return `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:600px">
    <h2 style="margin:0 0 4px">High-Priority Opportunities</h2>
    <p style="color:#64748b;margin:0 0 12px">Investhood IT Portfolio — Opportunities &amp; Leads</p>
    <ul style="padding-left:18px;margin:0">${items}</ul>
  </div>`
}
