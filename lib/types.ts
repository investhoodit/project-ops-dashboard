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
