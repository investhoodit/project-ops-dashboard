// Official / priority source domains for South African tenders, SETAs, grants
// and funding. Used to (a) bias the web-search assistant toward authoritative
// pages, (b) raise source confidence and scoring for verified official links,
// and (c) power the "Official sources only" opportunity filter.

export const OFFICIAL_SOURCE_DOMAINS = [
  "etenders.gov.za",
  "csd.gov.za",
  "mict.org.za",
  "serviceseta.org.za",
  "servicesseta.org.za",
  "etdpseta.org.za",
  "agriseta.co.za",
  "fpmpeta.org.za",
  "fpmseta.org.za",
  "dsbd.gov.za",
  "nyda.gov.za",
  "tia.org.za",
  "theinnovationhub.com",
  "tshwane.gov.za",
  "gauteng.gov.za",
]

// Broader trust tier: any government / public-sector domain in South Africa.
function isGovDomain(host: string): boolean {
  return host.endsWith(".gov.za") || host.endsWith(".org.za") || host.endsWith(".ac.za")
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "").toLowerCase()
  } catch {
    return ""
  }
}

// Is this URL on the curated official allowlist?
export function isOfficialSource(url: string): boolean {
  const host = hostOf(url)
  if (!host) return false
  return OFFICIAL_SOURCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

export type SourceConfidence = "High" | "Medium" | "Low"

// Confidence in a source based on its domain. Official allowlist = High,
// other government/public domains = Medium, everything else = Low.
export function sourceConfidence(url: string): SourceConfidence {
  if (isOfficialSource(url)) return "High"
  const host = hostOf(url)
  if (host && isGovDomain(host)) return "Medium"
  return "Low"
}
