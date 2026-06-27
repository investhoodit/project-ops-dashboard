import "server-only"
import { isOfficialSource } from "./official-sources"
import type { LinkStatus } from "./types"

export interface LinkCheck {
  status: LinkStatus
  httpStatus: number | null
  isOfficial: boolean
  checkedAt: string
}

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

// Validate a single URL by issuing a lightweight request. We try HEAD first,
// then fall back to a ranged GET (some servers reject HEAD). Network errors,
// timeouts and 4xx/5xx all resolve to a non-verified status rather than throwing.
export async function checkLink(url: string, timeoutMs = 7000): Promise<LinkCheck> {
  const checkedAt = new Date().toISOString()
  const isOfficial = isOfficialSource(url)

  if (!url || !isValidHttpUrl(url)) {
    return { status: "broken", httpStatus: null, isOfficial, checkedAt }
  }

  async function attempt(method: "HEAD" | "GET"): Promise<number | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: {
          // Identify politely and accept anything.
          "User-Agent": "InvesthoodDashboard-LinkChecker/1.0",
          Accept: "*/*",
          ...(method === "GET" ? { Range: "bytes=0-2048" } : {}),
        },
        cache: "no-store",
      })
      return res.status
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  let httpStatus = await attempt("HEAD")
  // Many servers don't support HEAD (405) or return ambiguous codes — retry GET.
  if (httpStatus === null || httpStatus === 405 || httpStatus === 403 || httpStatus >= 500) {
    const getStatus = await attempt("GET")
    if (getStatus !== null) httpStatus = getStatus
  }

  let status: LinkStatus
  if (httpStatus === null) {
    status = "broken" // network failure / timeout / DNS
  } else if (httpStatus >= 200 && httpStatus < 400) {
    status = "verified"
  } else if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429) {
    // Reachable but access-restricted — keep, but flag for a human.
    status = "needs_review"
  } else {
    status = "broken" // 404, 410, other 4xx, persistent 5xx
  }

  return { status, httpStatus, isOfficial, checkedAt }
}

// Validate the best available link for an opportunity (application URL first,
// then the source URL). Returns a single consolidated LinkCheck.
export async function checkOpportunityLink(opp: { application_url?: string; source_url?: string }): Promise<LinkCheck> {
  const primary = opp.application_url?.trim() || opp.source_url?.trim() || ""
  const result = await checkLink(primary)
  // If the primary failed but a different secondary exists, try it.
  if (result.status === "broken") {
    const secondary = opp.source_url?.trim() && opp.source_url !== primary ? opp.source_url.trim() : ""
    if (secondary) {
      const alt = await checkLink(secondary)
      if (alt.status !== "broken") return alt
    }
  }
  return result
}
