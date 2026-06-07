"use client"

import { palette } from "@/lib/helpers"

interface BarDatum {
  label: string
  value: number
  color?: string
  displayValue?: string
}

interface BarChartProps {
  data: BarDatum[]
  max?: number
  suffix?: string
  title?: string
  left?: number
  rowHeight?: number
}

function truncate(value: string, max = 28) {
  return value.length > max ? `${value.slice(0, max - 1)}\u2026` : value
}

export function BarChart({ data, max = 0, suffix, title, left = 210, rowHeight = 46 }: BarChartProps) {
  if (!data.length) {
    return <div className="empty-chart">No data available yet.</div>
  }
  const width = 760
  const height = Math.max(260, data.length * rowHeight + 56)
  const right = 76
  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), max, 1)
  const chartWidth = width - left - right

  return (
    <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title || "Bar chart"}>
      {data.map((item, index) => {
        const y = 32 + index * rowHeight
        const barWidth = Math.max(4, (Number(item.value) / maxValue) * chartWidth)
        const color = item.color || palette[index % palette.length]
        const valueLabel = suffix ? `${item.value}${suffix}` : item.displayValue ?? String(item.value)
        return (
          <g key={`${item.label}-${index}`}>
            <text x={12} y={y + 19} className="chart-label">
              {truncate(item.label)}
            </text>
            <line x1={left} y1={y + 14} x2={width - right} y2={y + 14} className="chart-axis" />
            <rect x={left} y={y} width={barWidth} height={28} fill={color} className="chart-bar" rx={9} ry={9} />
            <text x={Math.min(width - right + 8, left + barWidth + 10)} y={y + 19} className="chart-value">
              {valueLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

interface PieChartProps {
  counts: Record<string, number>
  title?: string
}

export function PieChart({ counts, title }: PieChartProps) {
  const entries = Object.entries(counts).filter(([, value]) => value > 0)
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  if (!entries.length || total === 0) {
    return <div className="empty-chart">No data available yet.</div>
  }

  let startAngle = 0
  const slices = entries.map(([label, value], index) => {
    const angle = (value / total) * 360
    const path = describeArc(150, 150, 118, startAngle, startAngle + angle)
    startAngle += angle
    return <path key={label} d={path} fill={palette[index % palette.length]} />
  })

  return (
    <div>
      <svg className="chart-svg" viewBox="0 0 300 300" role="img" aria-label={title || "Pie chart"}>
        {slices}
        <circle cx={150} cy={150} r={66} fill="var(--card)" />
        <text x={150} y={144} textAnchor="middle" className="chart-value" style={{ fontSize: 28 }}>
          {total}
        </text>
        <text x={150} y={168} textAnchor="middle" className="chart-label">
          Total
        </text>
      </svg>
      <div className="chart-legend">
        {entries.map(([label, value], index) => {
          const pct = Math.round((value / total) * 100)
          return (
            <span className="legend-item" key={label}>
              <span className="legend-dot" style={{ background: palette[index % palette.length] }} />
              {label}: {value} ({pct}%)
            </span>
          )
        })}
      </div>
    </div>
  )
}
