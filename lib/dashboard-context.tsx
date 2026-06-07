"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { DashboardData, Task, CalendarEvent, AppUser } from "./types"
import type { PublicIntegrationStatus } from "./integration-status"

const STORAGE_KEY = "investhood_project_ops_dashboard_v2"
const THEME_KEY = "investhood_dashboard_theme"
const USER_KEY = "investhood_dashboard_user"

interface DashboardContextValue {
  data: DashboardData
  source: "supabase" | "demo"
  integrations: PublicIntegrationStatus
  user: AppUser | null
  theme: "light" | "dark"
  canEdit: boolean
  setUser: (user: AppUser | null) => void
  toggleTheme: () => void
  saveTask: (task: Task) => void
  completeTask: (taskId: string) => void
  toggleReview: (index: number, done: boolean) => void
  addEvent: (event: CalendarEvent) => void
  deleteEvent: (eventId: string) => void
  resetData: () => void
  importData: (data: DashboardData) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

interface ProviderProps {
  children: ReactNode
  initialData: DashboardData
  source: "supabase" | "demo"
  integrations: PublicIntegrationStatus
}

export function DashboardProvider({ children, initialData, source, integrations }: ProviderProps) {
  const [data, setData] = useState<DashboardData>(initialData)
  const [user, setUserState] = useState<AppUser | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [hydrated, setHydrated] = useState(false)

  // Hydrate local edits, theme and user from localStorage in demo mode.
  useEffect(() => {
    if (source === "demo") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as DashboardData
          setData({ ...initialData, ...parsed })
        }
      } catch {
        /* ignore parse errors, keep server data */
      }
    }
    const savedTheme = (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light"
    setTheme(savedTheme)
    try {
      const savedUser = localStorage.getItem(USER_KEY)
      if (savedUser) setUserState(JSON.parse(savedUser))
    } catch {
      /* ignore */
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply theme class to <body>.
  useEffect(() => {
    document.body.classList.toggle("dark-mode", theme === "dark")
  }, [theme])

  const persist = useCallback(
    (next: DashboardData) => {
      setData(next)
      if (source === "demo") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          /* storage may be unavailable */
        }
      }
    },
    [source],
  )

  const setUser = useCallback((next: AppUser | null) => {
    setUserState(next)
    try {
      if (next) localStorage.setItem(USER_KEY, JSON.stringify(next))
      else localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const saveTask = useCallback(
    (task: Task) => {
      setData((prev) => {
        const exists = prev.tasks.some((t) => t.id === task.id)
        const tasks = exists ? prev.tasks.map((t) => (t.id === task.id ? task : t)) : [...prev.tasks, task]
        const next = { ...prev, tasks }
        if (source === "demo") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* ignore */
          }
        }
        return next
      })
    },
    [source],
  )

  const completeTask = useCallback(
    (taskId: string) => {
      setData((prev) => {
        const tasks = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: "Completed" as const, progress: 100 } : t,
        )
        const next = { ...prev, tasks }
        if (source === "demo") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* ignore */
          }
        }
        return next
      })
    },
    [source],
  )

  const toggleReview = useCallback(
    (index: number, done: boolean) => {
      setData((prev) => {
        const weeklyReview = prev.weeklyReview.map((item, i) => (i === index ? { ...item, done } : item))
        const next = { ...prev, weeklyReview }
        if (source === "demo") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* ignore */
          }
        }
        return next
      })
    },
    [source],
  )

  const addEvent = useCallback(
    (event: CalendarEvent) => {
      setData((prev) => {
        const next = { ...prev, events: [...prev.events, event] }
        if (source === "demo") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* ignore */
          }
        }
        return next
      })
    },
    [source],
  )

  const deleteEvent = useCallback(
    (eventId: string) => {
      setData((prev) => {
        const next = { ...prev, events: prev.events.filter((e) => e.id !== eventId) }
        if (source === "demo") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* ignore */
          }
        }
        return next
      })
    },
    [source],
  )

  const resetData = useCallback(() => {
    setData(initialData)
    if (source === "demo") {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  const importData = useCallback(
    (imported: DashboardData) => {
      persist(imported)
    },
    [persist],
  )

  // Role-based edit permission. Viewers cannot edit. Demo mode (no user) can edit.
  const canEdit = !user || user.role === "Admin" || user.role === "Manager" || user.role === "Team Member"

  const value: DashboardContextValue = {
    data,
    source,
    integrations,
    user,
    theme,
    canEdit,
    setUser,
    toggleTheme,
    saveTask,
    completeTask,
    toggleReview,
    addEvent,
    deleteEvent,
    resetData,
    importData,
  }

  return (
    <DashboardContext.Provider value={value}>
      <div suppressHydrationWarning>{hydrated ? children : children}</div>
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
