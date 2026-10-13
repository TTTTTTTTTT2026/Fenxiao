import { useId, useState } from 'react'
import type { OperationsDashboardReport } from './operationsDashboardApi'
import { trendDayDescription } from './operationsDashboardFormatting'

type TrendDay = OperationsDashboardReport['trend'][number]

/** One shared tooltip per day, including zero-height bars; no new chart dependency. */
export default function OperationsTrendChart({ days, platform, label }: {
  days: TrendDay[]
  platform: string
  label: string
}) {
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const tooltipId = useId()
  const activeIndex = days.findIndex(day => day.date === activeDate)
  const active = activeIndex < 0 ? undefined : days[activeIndex]
  const count = Math.max(1, days.length)
  const maximum = Math.max(10, ...days.flatMap(day => [day.registered, day.firstVerified ?? 0]))
  const anchor = (40 + (activeIndex + .5) * 930 / count) / 10

  return (
    <div className="opsdash-chart-wrap" onPointerLeave={() => setActiveDate(null)}>
      <svg className="opsdash-chart" viewBox="0 0 1000 165" role="group" aria-label={`${label}新增趋势`} preserveAspectRatio="none">
        {[0, .5, 1].map(value => (
          <g key={value} aria-hidden="true">
            <line x1="32" x2="985" y1={132 - value * 105} y2={132 - value * 105} stroke="#e7e5e4" />
            <text x="25" y={136 - value * 105} textAnchor="end" fill="#a8a29e" fontSize="11">{Math.round(maximum * value)}</text>
          </g>
        ))}
        {days.map((day, index) => {
          const step = 930 / count
          const width = Math.min(28, step * .3)
          const x = 40 + index * step + (step - 2 * width - 3) / 2
          const selected = activeDate === day.date
          return (
            <g key={day.date} className="opsdash-chart-day" tabIndex={0} role="button"
              aria-label={trendDayDescription(day, platform)} aria-pressed={selected}
              aria-describedby={selected ? tooltipId : undefined}
              onPointerEnter={() => setActiveDate(day.date)} onFocus={() => setActiveDate(day.date)}
              onBlur={() => setActiveDate(null)} onClick={() => setActiveDate(day.date)}
              onKeyDown={event => {
                if (event.key === 'Escape') setActiveDate(null)
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setActiveDate(day.date)
                }
              }}>
              <rect className="opsdash-chart-highlight" x={40 + index * step} y="18" width={step} height="119" fill={selected ? '#fff1e9' : 'transparent'} />
              <rect x={x} y={132 - day.registered / maximum * 105} width={width} height={day.registered / maximum * 105} fill="#e95f2f" rx="2" />
              {day.firstVerified != null && <rect x={x + width + 3} y={132 - day.firstVerified / maximum * 105} width={width} height={day.firstVerified / maximum * 105} fill="#4caaa1" rx="2" />}
              {(count <= 7 || index % 5 === 0 || index === count - 1) && <text x={x + width} y="153" textAnchor="middle" fill="#78716c" fontSize="11">{day.date.slice(5)}</text>}
            </g>
          )
        })}
      </svg>
      {active && <div id={tooltipId} role="tooltip" className="opsdash-chart-tooltip" style={{ left: `clamp(108px, ${anchor}%, calc(100% - 108px))` }}>
        <strong>{active.date}（UTC）</strong>
        <span>新增注册 <b>{active.registered}</b></span>
        <span>{platform}首次核验成功 <b>{active.firstVerified ?? '暂不可确认'}</b></span>
      </div>}
    </div>
  )
}
