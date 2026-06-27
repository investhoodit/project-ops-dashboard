import type { Opportunity } from "./types"
import { ruleBasedScore } from "./opportunity-scoring"
import { dataQualityScore } from "./data-quality"
import { isOfficialSource } from "./official-sources"

// Demo opportunities shown when Supabase is not configured or the table is empty.
// These illustrate the kinds of opportunities the module tracks across SBUs.
type RawOpportunity = Omit<
  Opportunity,
  "scores" | "link_status" | "link_checked_at" | "link_http_status" | "is_official_source" | "data_quality_score"
>

const RAW: RawOpportunity[] = [
  {
    id: "opp-demo-1",
    title: "MICT SETA Discretionary Grant — Learnerships 2026/27",
    description:
      "Discretionary grant funding window for accredited IT and digital skills learnerships, internships and workplace-based learning. Suitable for Investhood Skills Hub to host youth learners.",
    source_name: "MICT SETA",
    source_url: "https://www.mict.org.za",
    opportunity_type: "SETA Opportunity",
    sbu_id: "npo",
    organisation_type: "NPO",
    estimated_value: "R1,200,000",
    location: "National (South Africa)",
    closing_date: futureDate(9),
    eligibility: "Accredited skills development providers and NPOs hosting MICT-aligned learnerships.",
    contact_email: "grants@mict.org.za",
    contact_phone: "011 207 2600",
    application_url: "https://www.mict.org.za/discretionary-grants",
    status: "New",
    priority: "High",
    assigned_to: "",
    notes: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: "opp-demo-2",
    title: "City of Tshwane — School Management & LMS Software Tender",
    description:
      "Open tender for the supply, implementation and support of a learner management and school administration system. Strong fit for Investhood IT (Signa LMS) as a private supplier.",
    source_name: "City of Tshwane",
    source_url: "https://www.tshwane.gov.za",
    opportunity_type: "IT/Software Tender",
    sbu_id: "technology",
    organisation_type: "Private Company",
    estimated_value: "R2,500,000",
    location: "Tshwane, Gauteng",
    closing_date: futureDate(4),
    eligibility: "Registered companies on the Central Supplier Database with relevant software references.",
    contact_email: "scm@tshwane.gov.za",
    contact_phone: "012 358 9999",
    application_url: "https://www.tshwane.gov.za/tenders",
    status: "Reviewing",
    priority: "High",
    assigned_to: "Technical Lead",
    notes: "Confirm CSD registration and prepare LMS reference pack.",
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: "opp-demo-3",
    title: "Mastercard Foundation — Young Africa Works Education Grant",
    description:
      "International funding for youth education, digital skills and entrepreneurship programmes. Aligned with Investhood Skills Hub and SOS coding/robotics camps.",
    source_name: "Mastercard Foundation",
    source_url: "https://mastercardfdn.org",
    opportunity_type: "International Grant",
    sbu_id: "npo",
    organisation_type: "NPO",
    estimated_value: "USD 250,000",
    location: "Africa",
    closing_date: futureDate(26),
    eligibility: "Registered NPOs delivering youth skills and education at scale.",
    contact_email: "info@mastercardfdn.org",
    contact_phone: "",
    application_url: "https://mastercardfdn.org/all/partner-with-us",
    status: "New",
    priority: "Medium",
    assigned_to: "",
    notes: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: "opp-demo-4",
    title: "AgriSETA Discretionary Grant — Rural Skills & Farm Training",
    description:
      "Funding for agricultural skills development and rural training. Suitable for Dhlamini Farm camps and agri-tourism youth programmes.",
    source_name: "AgriSETA",
    source_url: "https://www.agriseta.co.za",
    opportunity_type: "SETA Opportunity",
    sbu_id: "agro",
    organisation_type: "Farm",
    estimated_value: "R600,000",
    location: "National (South Africa)",
    closing_date: futureDate(18),
    eligibility: "Agricultural training providers and community development organisations.",
    contact_email: "dg@agriseta.co.za",
    contact_phone: "012 301 5600",
    application_url: "https://www.agriseta.co.za/discretionary-grants",
    status: "New",
    priority: "Medium",
    assigned_to: "",
    notes: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: "opp-demo-5",
    title: "The Innovation Hub — EdTech Incubation Programme",
    description:
      "Incubation and acceleration support for technology startups, including EdTech. Good fit for SmartRise EdTech and the Investhood LMS product line.",
    source_name: "The Innovation Hub",
    source_url: "https://www.theinnovationhub.com",
    opportunity_type: "Incubation/Accelerator",
    sbu_id: "technology",
    organisation_type: "Private Company",
    estimated_value: "Non-cash (incubation support)",
    location: "Pretoria, Gauteng",
    closing_date: futureDate(40),
    eligibility: "Early-stage technology ventures registered in South Africa.",
    contact_email: "info@theinnovationhub.com",
    contact_phone: "012 844 0000",
    application_url: "https://www.theinnovationhub.com/programmes",
    status: "New",
    priority: "Low",
    assigned_to: "",
    notes: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  },
]

function nowIso() {
  return new Date().toISOString()
}

function futureDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const demoOpportunities: Opportunity[] = RAW.map((o) => ({
  ...o,
  scores: ruleBasedScore(o),
  // Demo records use real official domains, so treat links as verified.
  link_status: "verified" as const,
  link_checked_at: nowIso(),
  link_http_status: 200,
  is_official_source: isOfficialSource(o.application_url || o.source_url),
  data_quality_score: dataQualityScore(o),
}))
