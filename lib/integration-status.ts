// Server-side only. Detects which integrations are configured via env vars.
// Never import this into client components — it must not leak values to the browser.

export const integrationStatus = {
  get supabase() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  },
  get resend() {
    return Boolean(process.env.RESEND_API_KEY)
  },
  get sendgrid() {
    return Boolean(process.env.SENDGRID_API_KEY)
  },
  get email() {
    return Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY)
  },
  get twilioWhatsapp() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_FROM &&
        process.env.WHATSAPP_NOTIFICATION_TO,
    )
  },
  get openai() {
    return Boolean(process.env.OPENAI_API_KEY)
  },
  get cron() {
    return Boolean(process.env.CRON_SECRET)
  },
}

// A serialisable, value-free snapshot safe to send to the client.
export function getPublicIntegrationStatus() {
  return {
    supabase: integrationStatus.supabase,
    email: integrationStatus.email,
    whatsapp: integrationStatus.twilioWhatsapp,
    openai: integrationStatus.openai,
    cron: integrationStatus.cron,
  }
}

export type PublicIntegrationStatus = ReturnType<typeof getPublicIntegrationStatus>
