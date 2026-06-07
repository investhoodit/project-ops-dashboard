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
  // Browser-side Supabase Auth (Google sign-in) requires the public vars.
  get authConfigured() {
    return Boolean(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
    )
  },
  // Whether any web-search provider is configured for opportunity discovery.
  get search() {
    return Boolean(
      process.env.TAVILY_API_KEY || process.env.SERPAPI_API_KEY || process.env.BING_SEARCH_API_KEY,
    )
  },
  get searchProvider(): "tavily" | "serpapi" | "bing" | null {
    const explicit = (process.env.SEARCH_API_PROVIDER || "").toLowerCase()
    if (explicit === "tavily" && process.env.TAVILY_API_KEY) return "tavily"
    if (explicit === "serpapi" && process.env.SERPAPI_API_KEY) return "serpapi"
    if (explicit === "bing" && process.env.BING_SEARCH_API_KEY) return "bing"
    if (process.env.TAVILY_API_KEY) return "tavily"
    if (process.env.SERPAPI_API_KEY) return "serpapi"
    if (process.env.BING_SEARCH_API_KEY) return "bing"
    return null
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
    authConfigured: integrationStatus.authConfigured,
    search: integrationStatus.search,
  }
}

export type PublicIntegrationStatus = ReturnType<typeof getPublicIntegrationStatus>
