import type { ReactNode } from 'react'
import { GearSix, House, IdentificationCard, LinkSimple, Megaphone, UsersThree, Wallet } from '@phosphor-icons/react'
import { statusPresentation } from '../shared/statusPresentation'

export function PanelSection({ eyebrow, title, description, action, children, sectionId }: { eyebrow: string; title: string; description?: string; action?: ReactNode; children: ReactNode; sectionId?: string }) {
  return (
    <section className="panel-card" id={sectionId}>
      <div className="panel-head">
        <div>
          <p className="panel-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {description ? <p className="panel-desc">{description}</p> : null}
        </div>
        {action ? <div className="panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function AdminNavIcon({ label }: { label: string }) {
  const props = { size: 18, weight: 'duotone' as const }
  if (label === '分销概览') return <House {...props} />
  if (label === '渠道入口') return <Megaphone {...props} />
  if (label === '绑定关系') return <LinkSimple {...props} />
  if (label === '用户管理') return <IdentificationCard {...props} />
  if (label === '财务管理') return <Wallet {...props} />
  if (label === '系统管理') return <UsersThree {...props} />
  return <GearSix {...props} />
}

export function Metric({ label, value, hint, tone }: { label: string; value?: number; hint: string; tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
      <p>{hint}</p>
    </div>
  )
}

export function RelationItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="relation-item">
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  )
}

export function InfoCard({ title, tone, children }: { title: string; tone: 'success' | 'neutral'; children: ReactNode }) {
  return (
    <div className={`info-card ${tone}`}>
      <h3>{title}</h3>
      <div className="stack-gap small">{children}</div>
    </div>
  )
}

export function InfoRow({ label, value, code = false }: { label: string; value: ReactNode; code?: boolean }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      {code ? <code>{value}</code> : <strong>{value}</strong>}
    </div>
  )
}

export function EmptyState({ title, description, actionLabel }: { title: string; description: string; actionLabel?: string }) {
  const stateLabel = title.includes('登录')
    ? '待登录'
    : title.includes('接入')
      ? '待接入'
      : title.includes('设置')
        ? '未设置'
        : '待同步'

  return (
    <div className="empty-card">
      <span className="empty-state-label">{stateLabel}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel ? <span className="empty-action">{actionLabel}</span> : null}
    </div>
  )
}

export function ToastStack({ items, tone = 'neutral' }: { items: string[]; tone?: 'neutral' | 'success' | 'warning' }) {
  return (
    <div className={`toast-stack tone-${tone}`} role="status" aria-live="polite">
      {items.map((item) => (
        <div className="toast-note" key={item}>{item}</div>
      ))}
    </div>
  )
}

export function InlineHint({ text }: { text: string }) {
  return <ToastStack items={[text]} />
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = statusPresentation(status)
  return <span className={`badge badge-${normalized.tone}`}>{normalized.label}</span>
}

export function DataTable({ headers, rows, emptyText, rowClassNames }: { headers: ReactNode[]; rows?: Array<Array<ReactNode>>; emptyText: string; rowClassNames?: string[] }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => <th key={index}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`} className={rowClassNames?.[index] || undefined}>
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={headers.length}>{emptyText}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
