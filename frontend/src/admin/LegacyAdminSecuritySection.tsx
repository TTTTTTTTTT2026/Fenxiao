import type { FormEvent } from 'react'
import type { AdminDeviceSessionResponse, AdminSecurityEventResponse } from './accountSecurityApi'
import { formatDateTime } from '../shared/dateTime'
import { DataTable, InfoCard, InfoRow } from './LegacyPresentation'

type PasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string }

type MySecurityProps = {
  passwordExpiresAt?: string | null
  passwordForm: PasswordForm
  devices: AdminDeviceSessionResponse[]
  onPasswordFormChange: (form: PasswordForm) => void
  onChangePassword: (event: FormEvent<HTMLFormElement>) => void
  onLogoutAllDevices: () => void
  onRevokeDevice: (id: number) => void
}

export function LegacyAdminMySecuritySection({ passwordExpiresAt, passwordForm, devices, onPasswordFormChange, onChangePassword, onLogoutAllDevices, onRevokeDevice }: MySecurityProps) {
  return <div className="admin-account-section">
    <div className="content-grid two-columns entity-grid">
      <InfoCard title="修改我的密码" tone="neutral">
        <InfoRow label="密码到期时间" value={passwordExpiresAt ? formatDateTime(passwordExpiresAt) : '未设置'} />
        <form className="grid-form compact-form" onSubmit={onChangePassword}>
          <label>当前密码<input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => onPasswordFormChange({ ...passwordForm, currentPassword: event.target.value })} /></label>
          <label>新密码<input type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => onPasswordFormChange({ ...passwordForm, newPassword: event.target.value })} /></label>
          <label>确认新密码<input type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => onPasswordFormChange({ ...passwordForm, confirmPassword: event.target.value })} /></label>
          <p className="inline-hint">新密码至少 8 位，且须同时包含英文字符和数字。</p>
          <button className="primary-btn small-btn" type="submit">修改并退出全部设备</button>
        </form>
      </InfoCard>
    </div>
    <InfoCard title="本机与其他登录设备" tone="neutral">
      <div className="table-toolbar"><button className="ghost-btn small-btn" onClick={onLogoutAllDevices}>退出全部设备</button></div>
      <DataTable headers={['设备', '最近使用', '到期时间', '网络地址', '状态', '操作']} rows={devices.map((item) => [item.userAgent || '未知设备', formatDateTime(item.lastSeenAt), formatDateTime(item.expiresAt), item.ipAddress || '-', item.current ? '本机' : item.rememberMe ? '保持登录' : '普通会话', <button className="ghost-btn small-btn" onClick={() => onRevokeDevice(item.id)}>退出</button>])} emptyText="刷新后查看当前登录设备" />
    </InfoCard>
  </div>
}

export function LegacyAdminSecurityAuditSection({ events }: { events: AdminSecurityEventResponse[] }) {
  return <div className="admin-account-section"><InfoCard title="最近安全事件" tone="neutral"><DataTable headers={['时间', '事件', '结果', '网络地址', '说明']} rows={events.map((item) => [formatDateTime(item.occurredAt), item.eventType, item.success ? '成功' : '失败', item.ipAddress || '-', item.detail || '-'])} emptyText="刷新后查看最近安全事件" /></InfoCard></div>
}
