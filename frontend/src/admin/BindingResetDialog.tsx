import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import ConfirmDialog from './LegacyConfirmDialog'
import { getBindingResetPreview, resetPlatformBinding, type BindingResetPlatform, type BindingResetPreview } from './userDirectoryApi'
import './BindingResetDialog.css'

const appNames = { TIMO: 'Timo', LINKY: 'Linky' }
const bindingStatuses: Record<string, string> = {
  UNBOUND: '未绑定',
  SUBMITTED: '已提交',
  VERIFYING: '核验中',
  PENDING: '核验中',
  REJECTED: '核验未通过',
  NOT_JOINED: '核验未通过',
  JOINED_OTHER_GUILD: '已加入其他公会',
  REFRESH_FAILED: '核验状态待确认',
  VERIFIED: '已核验',
  MATCHED_OURS: '已核验',
}

export default function BindingResetDialog({ token, userId, onClose, onSaved, useConsoleModal = false }: {
  token: string
  userId: number
  onClose: () => void
  onSaved: (app: string) => void
  useConsoleModal?: boolean
}) {
  const [platform, setPlatform] = useState<BindingResetPlatform | ''>('')
  const [preview, setPreview] = useState<BindingResetPreview | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [reload, setReload] = useState(0)
  const app = platform ? appNames[platform] : ''
  const ready = Boolean(preview?.revision && !preview.blockedReason && reason.trim() && !error)

  useEffect(() => {
    if (!platform) return
    let active = true
    getBindingResetPreview(token, userId, platform)
      .then(result => { if (active) setPreview(result) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : '无法读取绑定状态') })
    return () => { active = false }
  }, [platform, token, userId, reload])

  async function save() {
    if (!platform || !preview?.revision || !ready || saving) return
    setSaving(true)
    try {
      await resetPlatformBinding(token, userId, platform, preview.revision, reason.trim())
      onSaved(app)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请重新读取绑定状态')
    } finally {
      setSaving(false)
    }
  }

  const title = `重置绑定 · #${userId}`
  const confirmText = app ? `确认重置 ${app}` : '确认重置'
  const cancel = () => { if (!saving) onClose() }
  const content = <div className="binding-reset-fields">
    <p>重置后，用户可重新提交所选应用的 ID。另一应用、历史记录和收益保留。</p>
    <label>应用<select value={platform} disabled={saving} onChange={event => {
      setPlatform(event.target.value as BindingResetPlatform | '')
      setPreview(null)
      setError('')
      setReason('')
    }}>
      <option value="">请选择应用</option>
      <option value="TIMO">Timo</option>
      <option value="LINKY">Linky</option>
    </select></label>
    {platform && !preview && !error ? <p role="status">正在读取绑定状态…</p> : null}
    {preview ? <p role="status">{app} · {bindingStatuses[preview.status] || '状态待确认'}{preview.maskedAccount ? ` · ${preview.maskedAccount}` : ''}</p> : null}
    {preview?.blockedReason ? <p role="status">{preview.blockedReason}</p> : null}
    {preview?.revision && !preview.blockedReason ? <label>重置原因<input value={reason} maxLength={255} disabled={saving}
      onChange={event => setReason(event.target.value)} placeholder="例如：用户提交了错误的应用 ID" /></label> : null}
    {error ? <div role="alert"><p>{error}</p><button type="button" className="ghost-btn" disabled={saving} onClick={() => {
      setPreview(null)
      setError('')
      setReload(value => value + 1)
    }}>重新读取</button></div> : null}
  </div>
  if (useConsoleModal) {
    return <Modal open title={title} okText={confirmText} cancelText="取消"
      okButtonProps={{ danger: true, disabled: !ready }} confirmLoading={saving} cancelButtonProps={{ disabled: saving }}
      onOk={() => void save()} onCancel={cancel}>{content}</Modal>
  }
  return <ConfirmDialog title={title} tone="warning" confirmText={confirmText} loading={saving}
    confirmDisabled={!ready} onConfirm={() => void save()} onCancel={cancel}>{content}</ConfirmDialog>
}
