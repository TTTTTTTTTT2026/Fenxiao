import { useEffect, useRef, type ReactNode } from 'react'

export default function ConfirmDialog({ title, tone, confirmText, loading, confirmDisabled, children, onCancel, onConfirm, className = '' }: {
  title: string; tone: 'primary' | 'warning' | 'success' | 'neutral'; confirmText: string
  loading?: boolean; confirmDisabled?: boolean; children: ReactNode; onCancel: () => void; onConfirm: () => void
  className?: string
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCancelRef = useRef(onCancel)
  const loadingRef = useRef(loading)
  useEffect(() => { onCancelRef.current = onCancel }, [onCancel])
  useEffect(() => { loadingRef.current = loading }, [loading])
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loadingRef.current) onCancelRef.current()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'))
      if (!focusable.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])
  return <div className="dialog-backdrop" role="presentation">
    <div ref={dialogRef} className={`dialog-card tone-${tone}${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog-head"><div><p className="panel-eyebrow">确认操作</p><h3>{title}</h3></div>
        <button className="ghost-btn small-btn" onClick={onCancel} disabled={loading}>关闭</button></div>
      <div className="stack-gap small">{children}</div>
      <div className="dialog-actions"><button className="ghost-btn" onClick={onCancel} disabled={loading}>取消</button>
        <button className="primary-btn" onClick={onConfirm} disabled={loading || confirmDisabled}>{loading ? '处理中...' : confirmText}</button></div>
    </div>
  </div>
}
