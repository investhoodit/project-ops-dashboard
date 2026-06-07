import "server-only"

// Shared email + WhatsApp senders used by both task reminders and opportunity
// alerts. Each returns a result object and never throws.

export interface SendResult {
  sent: boolean
  reason?: string
}

export async function sendEmail(subject: string, text: string, html: string): Promise<SendResult> {
  const to = process.env.NOTIFICATION_EMAIL_TO
  const from = process.env.NOTIFICATION_EMAIL_FROM || "dashboard@investhoodit.com"
  if (!to) return { sent: false, reason: "NOTIFICATION_EMAIL_TO not set" }

  try {
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
  } catch (e) {
    return { sent: false, reason: `Email send failed: ${String(e)}` }
  }

  return { sent: false, reason: "No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY)" }
}

export async function sendWhatsApp(text: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  const to = process.env.WHATSAPP_NOTIFICATION_TO
  if (!sid || !token || !from || !to) {
    return { sent: false, reason: "Twilio WhatsApp env vars not fully set" }
  }
  try {
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
  } catch (e) {
    return { sent: false, reason: `WhatsApp send failed: ${String(e)}` }
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}
