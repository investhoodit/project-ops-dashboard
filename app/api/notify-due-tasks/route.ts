import { NextResponse } from "next/server"
import { integrationStatus } from "@/lib/integration-status"
import { buildDueDigest, digestToText, digestToHtml } from "@/lib/notifications"

export const dynamic = "force-dynamic"

async function sendEmail(subject: string, text: string, html: string) {
  const to = process.env.NOTIFICATION_EMAIL_TO
  const from = process.env.NOTIFICATION_EMAIL_FROM || "dashboard@investhoodit.com"
  if (!to) return { sent: false, reason: "NOTIFICATION_EMAIL_TO not set" }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject, text, html }),
    })
    return { sent: res.ok, reason: res.ok ? undefined : `Resend error ${res.status}` }
  }

  if (process.env.SENDGRID_API_KEY) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: to.split(",").map((addr) => ({ to: [{ email: addr.trim() }] })),
        from: { email: from },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    })
    return { sent: res.ok, reason: res.ok ? undefined : `SendGrid error ${res.status}` }
  }

  return { sent: false, reason: "No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY)" }
}

async function sendWhatsApp(text: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  const to = process.env.WHATSAPP_NOTIFICATION_TO
  if (!sid || !token || !from || !to) {
    return { sent: false, reason: "Twilio WhatsApp env vars not fully set" }
  }
  const body = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    Body: text.slice(0, 1500),
  })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  return { sent: res.ok, reason: res.ok ? undefined : `Twilio error ${res.status}` }
}

export async function POST() {
  const digest = await buildDueDigest()
  const text = digestToText(digest)
  const html = digestToHtml(digest)
  const subject = `Task Reminders: ${digest.overdue.length} overdue, ${digest.dueToday.length} due today`

  const [email, whatsapp] = await Promise.all([
    integrationStatus.email ? sendEmail(subject, text, html) : Promise.resolve({ sent: false, reason: "Email not configured" }),
    integrationStatus.twilioWhatsapp ? sendWhatsApp(text) : Promise.resolve({ sent: false, reason: "WhatsApp not configured" }),
  ])

  return NextResponse.json({
    ok: true,
    digest: {
      overdue: digest.overdue.length,
      dueToday: digest.dueToday.length,
      dueSoon: digest.dueSoon.length,
    },
    channels: { email, whatsapp },
    preview: text,
  })
}

// Allow GET for easy manual testing in the browser.
export async function GET() {
  const digest = await buildDueDigest()
  return NextResponse.json({
    ok: true,
    configured: {
      email: integrationStatus.email,
      whatsapp: integrationStatus.twilioWhatsapp,
    },
    digest: {
      overdue: digest.overdue.length,
      dueToday: digest.dueToday.length,
      dueSoon: digest.dueSoon.length,
    },
    preview: digestToText(digest),
  })
}
