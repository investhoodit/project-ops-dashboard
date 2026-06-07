import type { OpportunityType } from "./types"

// Curated sources to monitor for opportunities. Used to seed opportunity_sources
// and to build targeted search queries for the configured search provider.
export interface OpportunitySource {
  id: string
  name: string
  url: string
  category: OpportunityType
  query: string
}

export const OPPORTUNITY_SOURCES: OpportunitySource[] = [
  {
    id: "etenders",
    name: "eTenders South Africa",
    url: "https://www.etenders.gov.za",
    category: "Government Tender",
    query: "IT software web app cloud support cybersecurity tenders site:etenders.gov.za",
  },
  {
    id: "csd",
    name: "Central Supplier Database",
    url: "https://secure.csd.gov.za",
    category: "Government Tender",
    query: "Central Supplier Database supplier notices guidance South Africa",
  },
  {
    id: "mict-seta",
    name: "MICT SETA",
    url: "https://www.mict.org.za",
    category: "SETA Opportunity",
    query: "MICT SETA discretionary grant learnership internship funding",
  },
  {
    id: "services-seta",
    name: "Services SETA",
    url: "https://www.servicesseta.org.za",
    category: "SETA Opportunity",
    query: "Services SETA discretionary grant skills funding learnership",
  },
  {
    id: "etdp-seta",
    name: "ETDP SETA",
    url: "https://www.etdpseta.org.za",
    category: "SETA Opportunity",
    query: "ETDP SETA education training grant funding learnership",
  },
  {
    id: "agriseta",
    name: "AgriSETA",
    url: "https://www.agriseta.co.za",
    category: "SETA Opportunity",
    query: "AgriSETA discretionary grant agriculture skills funding",
  },
  {
    id: "fpm-seta",
    name: "FP&M SETA",
    url: "https://www.fpmseta.org.za",
    category: "SETA Opportunity",
    query: "FP&M SETA discretionary grant funding learnership",
  },
  {
    id: "nyda",
    name: "National Youth Development Agency",
    url: "https://www.nyda.gov.za",
    category: "CSI/Donor/Sponsorship",
    query: "NYDA youth grant funding programme application",
  },
  {
    id: "dsbd",
    name: "Department of Small Business Development",
    url: "https://www.dsbd.gov.za",
    category: "Grant/Funding",
    query: "Department of Small Business Development grant funding SMME",
  },
  {
    id: "tia",
    name: "Technology Innovation Agency",
    url: "https://www.tia.org.za",
    category: "Incubation/Accelerator",
    query: "Technology Innovation Agency funding innovation grant",
  },
  {
    id: "innovation-hub",
    name: "The Innovation Hub",
    url: "https://www.theinnovationhub.com",
    category: "Incubation/Accelerator",
    query: "The Innovation Hub incubation accelerator programme application",
  },
  {
    id: "csir",
    name: "CSIR",
    url: "https://www.csir.co.za",
    category: "Government Tender",
    query: "CSIR opportunities tenders technology funding",
  },
  {
    id: "gauteng-tenders",
    name: "Gauteng Provincial Government",
    url: "https://www.gauteng.gov.za",
    category: "Government Tender",
    query: "Gauteng provincial government IT tenders opportunities",
  },
  {
    id: "tshwane",
    name: "City of Tshwane",
    url: "https://www.tshwane.gov.za",
    category: "Government Tender",
    query: "City of Tshwane tender opportunities IT services",
  },
  {
    id: "undp",
    name: "UNDP",
    url: "https://procurement-notices.undp.org",
    category: "International Grant",
    query: "UNDP procurement notices grants South Africa technology education",
  },
  {
    id: "unicef",
    name: "UNICEF",
    url: "https://www.unicef.org",
    category: "International Grant",
    query: "UNICEF innovation fund grant education youth technology",
  },
  {
    id: "unesco",
    name: "UNESCO",
    url: "https://www.unesco.org",
    category: "International Grant",
    query: "UNESCO grant education technology youth call for proposals",
  },
  {
    id: "google-org",
    name: "Google.org",
    url: "https://www.google.org",
    category: "International Grant",
    query: "Google.org grant funding education AI nonprofit Africa",
  },
  {
    id: "microsoft-philanthropies",
    name: "Microsoft Philanthropies",
    url: "https://www.microsoft.com/philanthropies",
    category: "International Grant",
    query: "Microsoft Philanthropies grant digital skills nonprofit Africa",
  },
  {
    id: "aws",
    name: "AWS",
    url: "https://aws.amazon.com/government-education/nonprofits",
    category: "International Grant",
    query: "AWS nonprofit credits grant cloud education program",
  },
  {
    id: "meta",
    name: "Meta",
    url: "https://www.facebook.com/business/grants",
    category: "International Grant",
    query: "Meta grants nonprofit digital skills program Africa",
  },
  {
    id: "mastercard-foundation",
    name: "Mastercard Foundation",
    url: "https://mastercardfdn.org",
    category: "International Grant",
    query: "Mastercard Foundation grant youth education skills Africa application",
  },
]

// SBU labels referenced by the opportunities module.
export const SBU_OPTIONS = [
  { id: "education", label: "Education & Child Development" },
  { id: "technology", label: "Technology & Software" },
  { id: "npo", label: "Youth Skills & NPO" },
  { id: "agro", label: "Agro-Tech, Camps & Community" },
  { id: "general", label: "General / Cross-cutting" },
]

export const OPPORTUNITY_TYPES: OpportunityType[] = [
  "Government Tender",
  "IT/Software Tender",
  "Grant/Funding",
  "SETA Opportunity",
  "Internship/WBL",
  "Incubation/Accelerator",
  "CSI/Donor/Sponsorship",
  "International Grant",
  "Agri/Community",
  "Other",
]

export const ORGANISATION_TYPES = ["Private Company", "NPO", "School", "Creche", "Farm", "General"] as const

export const OPPORTUNITY_STATUSES = [
  "New",
  "Reviewing",
  "Applied",
  "Not Relevant",
  "Won",
  "Lost",
  "Archived",
] as const
