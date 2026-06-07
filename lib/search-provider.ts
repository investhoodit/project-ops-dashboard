import "server-only"
import { integrationStatus } from "./integration-status"

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

// Unified web search across the supported providers. Never exposes keys to the
// client — this module is server-only. Returns [] on any error so callers can
// degrade gracefully.
export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  const provider = integrationStatus.searchProvider
  if (!provider) return []

  try {
    if (provider === "tavily") return await tavilySearch(query, limit)
    if (provider === "serpapi") return await serpapiSearch(query, limit)
    if (provider === "bing") return await bingSearch(query, limit)
  } catch {
    return []
  }
  return []
}

async function tavilySearch(query: string, limit: number): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: limit,
      search_depth: "basic",
    }),
    cache: "no-store",
  })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: { title: string; url: string; content: string }[] }
  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content?.slice(0, 400) ?? "",
    source: hostOf(r.url),
  }))
}

async function serpapiSearch(query: string, limit: number): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    api_key: process.env.SERPAPI_API_KEY as string,
    num: String(limit),
    engine: "google",
  })
  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, { cache: "no-store" })
  if (!res.ok) return []
  const data = (await res.json()) as { organic_results?: { title: string; link: string; snippet: string }[] }
  return (data.organic_results ?? []).slice(0, limit).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet ?? "",
    source: hostOf(r.link),
  }))
}

async function bingSearch(query: string, limit: number): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, count: String(limit) })
  const res = await fetch(`https://api.bing.microsoft.com/v7.0/search?${params.toString()}`, {
    headers: { "Ocp-Apim-Subscription-Key": process.env.BING_SEARCH_API_KEY as string },
    cache: "no-store",
  })
  if (!res.ok) return []
  const data = (await res.json()) as { webPages?: { value?: { name: string; url: string; snippet: string }[] } }
  return (data.webPages?.value ?? []).slice(0, limit).map((r) => ({
    title: r.name,
    url: r.url,
    snippet: r.snippet ?? "",
    source: hostOf(r.url),
  }))
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return ""
  }
}
