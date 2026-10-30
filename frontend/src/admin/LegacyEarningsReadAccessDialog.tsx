import { useEffect, useState } from 'react'
import { getAdminEarningsReadAccess, saveAdminEarningsReadAccess, type EarningsReadAccessState } from './userDirectoryApi'
import ConfirmDialog from './LegacyConfirmDialog'

export default function LegacyEarningsReadAccessDialog({ token, userId, onClose, onSaved }: {
  token: string; userId: number; onClose: () => void; onSaved: () => void
}) {
  const [states, setStates] = useState<EarningsReadAccessState[] | null>(null)
  const [platform, setPlatform] = useState<'TIMO' | 'LINKY'>('TIMO')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [reading, setReading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    getAdminEarningsReadAccess(token, userId).then(value => { if (active) setStates(value) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : '读取失败') })
      .finally(() => { if (active) setReading(false) })
    return () => { active = false }
  }, [token, userId, revision])
  const selected = states?.find(item => item.platformCode === platform)
  async function save() {
    if (!selected || saving || reading || !reason.trim() || error) return
    setSaving(true)
    try {
      setStates(await saveAdminEarningsReadAccess(token, userId, selected, reason.trim()))
      onSaved()
      onClose()
    } catch (err) { setError(err instanceof Error ? err.message : '保存失败，请重新读取') }
    finally { setSaving(false) }
  }
  return <ConfirmDialog title={`收益查看权限 · #${userId}`} tone="warning"
    confirmText={selected?.enabled ? '撤销该应用权限' : '授予该应用权限'} loading={saving}
    confirmDisabled={reading || !selected || !reason.trim() || !!error}
    onConfirm={() => void save()} onCancel={() => { if (!saving) onClose() }}>
    <p>仅允许未绑定用户查看自己的指定应用收益、流水及下级分佣明细。不改变绑定、等级、分佣规则或提现权限。</p>
    <label>应用<select value={platform} disabled={saving || reading} onChange={event => setPlatform(event.target.value as 'TIMO' | 'LINKY')}>
      <option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
    {reading ? <p role="status">读取中…</p> : selected ? <p role="status">{platform === 'TIMO' ? 'Timo' : 'Linky'}：{selected.enabled ? '已授权未绑定收益查看' : '未授权，仍按绑定规则访问'} · 版本 {selected.version}</p> : null}
    <label>操作原因<input value={reason} maxLength={255} disabled={saving} onChange={event => setReason(event.target.value)} placeholder="请填写授权或撤销原因" /></label>
    {error ? <div role="alert"><p>{error}</p><button className="ghost-btn" disabled={saving} onClick={() => {
      setError(''); setStates(null); setReading(true); setRevision(value => value + 1)
    }}>重新读取</button></div> : null}
  </ConfirmDialog>
}
