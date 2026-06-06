"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { DetailDialog, type DetailType } from "./detail-dialog"

const DrillDownContext = createContext<(detail: DetailType) => void>(() => {})

export function useDrillDown() {
  return useContext(DrillDownContext)
}

export function DrillDownProvider({ children }: { children: ReactNode }) {
  const [detail, setDetail] = useState<DetailType | null>(null)
  return (
    <DrillDownContext.Provider value={setDetail}>
      {children}
      <DetailDialog detail={detail} onClose={() => setDetail(null)} />
    </DrillDownContext.Provider>
  )
}

/** A clickable panel/card that opens a drill-down detail view. */
export function LinkedBlock({
  detail,
  className,
  children,
}: {
  detail: DetailType
  className?: string
  children: ReactNode
}) {
  const openDetail = useDrillDown()
  return (
    <div
      className={`linked-block ${className ?? ""}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("button, a, input, select, textarea, label")) return
        openDetail(detail)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          const target = e.target as HTMLElement
          if (target.closest("button, a, input, select, textarea, label")) return
          e.preventDefault()
          openDetail(detail)
        }
      }}
    >
      {children}
    </div>
  )
}
