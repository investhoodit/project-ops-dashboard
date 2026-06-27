export type ProjectStatus = "On Track" | "In Progress" | "At Risk" | "Delayed" | "Completed"
export type TaskStatus = "Not Started" | "In Progress" | "Waiting for Feedback" | "Blocked" | "Completed"
export type Priority = "High" | "Medium" | "Low"
export type UserRole = "Admin" | "Manager" | "Team Member" | "Viewer"

export interface Sbu {
  id: string
  name: string
  goal: string
  projects: string[]
}

export interface Project {
  id: string
  name: string
  sbu: string
  status: ProjectStatus
  priority: Priority
  owner: string
  progress: number
  revenueTarget: string
  currentRevenue: string
  targetDate: string
  nextAction: string
  risk: string
}

export interface Task {
  id: string
  title: string
  projectId: string
  owner: string
  dueDate: string
  status: TaskStatus
  priority: Priority
  progress: number
  notes: string
}

export interface WeeklyReviewItem {
  label: string
  done: boolean
}

export interface Kpi {
  label: string
  value: string | number
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: string
  notes: string
}

export interface DashboardData {
  sbus: Sbu[]
  projects: Project[]
  tasks: Task[]
  weeklyReview: WeeklyReviewItem[]
  kpis: Kpi[]
  events: CalendarEvent[]
}

export interface AppUser {
  name: string
  email: string
  role: UserRole
}

// ---------------------------------------------------------------------------
// Opportunities & Leads module
// ---------------------------------------------------------------------------

export type OpportunityStatus = "New" | "Reviewing" | "Applied" | "Not Relevant" | "Won" | "Lost" | "Archived"

export type OrganisationType = "Private Company" | "NPO" | "School" | "Creche" | "Farm" | "General"

export type OpportunityType =
  | "Government Tender"
  | "IT/Software Tender"
  | "Grant/Funding"
  | "SETA Opportunity"
  | "Internship/WBL"
  | "Incubation/Accelerator"
  | "CSI/Donor/Sponsorship"
  | "International Grant"
  | "Agri/Community"
  | "Other"

export interface OpportunityScores {
  relevance: number
  urgency: number
  fit: number
  recommendedAction: string
}

// Result of validating an opportunity's source/application link.
export type LinkStatus = "verified" | "broken" | "needs_review" | "unchecked"

export interface Opportunity {
  id: string
  title: string
  description: string
  source_name: string
  source_url: string
  opportunity_type: OpportunityType
  sbu_id: string
  organisation_type: OrganisationType
  estimated_value: string
  location: string
  closing_date: string
  eligibility: string
  contact_email: string
  contact_phone: string
  application_url: string
  status: OpportunityStatus
  priority: Priority
  assigned_to: string
  notes: string
  scores?: OpportunityScores
  // Link validation
  link_status: LinkStatus
  link_checked_at: string
  link_http_status: number | null
  is_official_source: boolean
  // Data quality (0-100). Low scores auto-route to "Needs Review".
  data_quality_score: number
  created_at: string
  updated_at: string
}
