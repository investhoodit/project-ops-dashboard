"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { saPublicHolidays } from "@/lib/seed-data"
import { todayKey } from "@/lib/helpers"
import type { CalendarEvent } from "@/lib/types"

interface DisplayEvent {
  id: string
  date: string
  title: string
  type: string
  className: "task" | "holiday" | "user"
  notes: string
  editable: boolean
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `user-${crypto.randomUUID()}`
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function CalendarSection() {
  const { data, canEdit, addEvent, deleteEvent } = useDashboard()
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [dialogDate, setDialogDate] = useState<string | null>(null)

  const today = todayKey()

  const taskEvents: DisplayEvent[] = data.tasks
    .filter((t) => t.dueDate)
    .map((task) => {
      const project = data.projects.find((p) => p.id === task.projectId)
      return {
        id: `task-${task.id}`,
        date: task.dueDate,
        title: task.title,
        type: "Task",
        className: "task" as const,
        notes: `${project?.name || "Project"} | ${task.status} | ${task.owner}`,
        editable: false,
      }
    })

  const holidayEvents: DisplayEvent[] = saPublicHolidays.map((h) => ({
    id: `holiday-${h.date}`,
    date: h.date,
    title: h.title,
    type: "SA Holiday",
    className: "holiday" as const,
    notes: "South African public holiday",
    editable: false,
  }))

  const userEvents: DisplayEvent[] = data.events.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    type: e.type,
    className: "user" as const,
    notes: e.notes,
    editable: true,
  }))

  const events = [...taskEvents, ...holidayEvents, ...userEvents]

  const monthName = monthDate.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    const dateKey = formatDate(day)
    const dayEvents = events.filter((e) => e.date === dateKey)
    const outside = day.getMonth() !== monthDate.getMonth()
    return { day, dateKey, dayEvents, outside, isToday: dateKey === today }
  })

  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10)

  function shiftMonth(delta: number) {
    setMonthDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  function handleAddEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const event: CalendarEvent = {
      id: newId(),
      title: String(fd.get("title")),
      date: String(fd.get("date")),
      type: String(fd.get("type")),
      notes: String(fd.get("notes") || ""),
    }
    addEvent(event)
    setDialogDate(null)
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Calendar
          </p>
          <h2>Tasks, Events & South African Holidays</h2>
        </div>
        <div className="calendar-actions">
          <button className="btn secondary" type="button" onClick={() => shiftMonth(-1)}>
            ← Previous
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              const d = new Date()
              d.setDate(1)
              setMonthDate(d)
            }}
            style={{ color: "var(--navy)", border: "1px solid var(--line)", background: "var(--soft)" }}
          >
            Today
          </button>
          <button className="btn secondary" type="button" onClick={() => shiftMonth(1)}>
            Next →
          </button>
          <button className="btn" type="button" onClick={() => setDialogDate(todayKey())} disabled={!canEdit}>
            Add Event
          </button>
        </div>
      </div>

      <div className="calendar-header-line">
        <h3>{monthName}</h3>
        <p>Shows dashboard task due dates, editable user events and upcoming South African public holidays.</p>
      </div>

      <div className="calendar-grid">
        {weekdays.map((w) => (
          <div className="calendar-weekday" key={w}>
            {w}
          </div>
        ))}
        {days.map(({ day, dateKey, dayEvents, outside, isToday }) => (
          <div
            key={dateKey}
            className={`calendar-day${outside ? " outside" : ""}${isToday ? " today" : ""}`}
            onClick={() => canEdit && setDialogDate(dateKey)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && canEdit) {
                e.preventDefault()
                setDialogDate(dateKey)
              }
            }}
          >
            <div className="day-number">
              <span>{day.getDate()}</span>
              <span>{dayEvents.length || ""}</span>
            </div>
            {dayEvents.slice(0, 4).map((event) => (
              <div className={`calendar-event ${event.className}`} title={event.notes} key={event.id}>
                {event.title}
              </div>
            ))}
            {dayEvents.length > 4 && <div className="calendar-event user">+{dayEvents.length - 4} more</div>}
          </div>
        ))}
      </div>

      <div className="calendar-agenda">
        {upcoming.length ? (
          upcoming.map((event) => (
            <div className="agenda-item" key={event.id}>
              <div>
                <strong>
                  {event.date} - {event.title}
                </strong>
                <br />
                <small>
                  {event.type}
                  {event.notes ? ` | ${event.notes}` : ""}
                </small>
              </div>
              {event.editable && canEdit && (
                <button type="button" onClick={() => deleteEvent(event.id)}>
                  Delete
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="agenda-item">
            <strong>No upcoming events yet.</strong>
          </div>
        )}
      </div>

      {dialogDate && (
        <div
          role="presentation"
          onClick={() => setDialogDate(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,.55)", display: "grid", placeItems: "center", zIndex: 60, padding: 16 }}
        >
          <form
            className="dialog-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddEvent}
            style={{ background: "var(--card)", borderRadius: 22, width: "min(720px, 92vw)" }}
          >
            <h2>Add Calendar Event</h2>
            <label>
              Event title
              <input name="title" required />
            </label>
            <label>
              Date
              <input name="date" type="date" required defaultValue={dialogDate} />
            </label>
            <label>
              Type
              <select name="type">
                <option>Meeting</option>
                <option>Marketing</option>
                <option>Funding</option>
                <option>Camp</option>
                <option>Compliance</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Notes
              <textarea name="notes" rows={3} />
            </label>
            <div className="dialog-actions">
              <button className="btn secondary" type="button" onClick={() => setDialogDate(null)}>
                Cancel
              </button>
              <button className="btn" type="submit">
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
