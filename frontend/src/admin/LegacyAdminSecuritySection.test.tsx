import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { AdminDeviceSessionResponse, AdminSecurityEventResponse } from './accountSecurityApi'
import { LegacyAdminMySecuritySection, LegacyAdminSecurityAuditSection } from './LegacyAdminSecuritySection'

const device: AdminDeviceSessionResponse = {
  id: 7, current: true, rememberMe: false, issuedAt: '2026-10-08T08:00:00Z',
  lastSeenAt: '2026-10-08T09:00:00Z', expiresAt: '2026-10-09T09:00:00Z',
  ipAddress: '192.0.2.7', userAgent: 'Test browser',
}

function findElement(node: unknown, matches: (element: ReactElement<Record<string, unknown>>) => boolean): ReactElement<Record<string, unknown>> | undefined {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findElement(item, matches)
      if (found) return found
    }
  } else if (isValidElement<Record<string, unknown>>(node)) {
    if (matches(node)) return node
    for (const value of Object.values(node.props)) {
      if (typeof value === 'function') continue
      const found = findElement(value, matches)
      if (found) return found
    }
  }
  return undefined
}

describe('legacy admin security presentation boundary', () => {
  const passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }

  it('keeps the password, device and empty-state presentation', () => {
    const props = {
      passwordExpiresAt: null, passwordForm, devices: [device], onPasswordFormChange: vi.fn(),
      onChangePassword: vi.fn(), onLogoutAllDevices: vi.fn(), onRevokeDevice: vi.fn(),
    }
    const markup = renderToStaticMarkup(<LegacyAdminMySecuritySection {...props} />)
    const empty = renderToStaticMarkup(<LegacyAdminMySecuritySection {...props} devices={[]} />)

    expect(markup).toContain('修改我的密码')
    expect(markup).toContain('密码到期时间')
    expect(markup).toContain('Test browser')
    expect(markup).toContain('192.0.2.7')
    expect(markup).toContain('本机')
    expect(markup).toContain('退出全部设备')
    expect(empty).toContain('刷新后查看当前登录设备')
  })

  it('delegates password and session operations to the original parent', () => {
    const onPasswordFormChange = vi.fn()
    const onChangePassword = vi.fn()
    const onLogoutAllDevices = vi.fn()
    const onRevokeDevice = vi.fn()
    const tree = LegacyAdminMySecuritySection({ passwordForm, devices: [device], onPasswordFormChange, onChangePassword, onLogoutAllDevices, onRevokeDevice })
    const form = findElement(tree, (element) => element.type === 'form')
    const currentPassword = findElement(tree, (element) => element.type === 'input' && element.props.autoComplete === 'current-password')
    const logoutAll = findElement(tree, (element) => element.type === 'button' && element.props.children === '退出全部设备')
    const revoke = findElement(tree, (element) => element.type === 'button' && element.props.children === '退出')

    expect(form?.props.onSubmit).toBe(onChangePassword)
    ;(currentPassword?.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: 'typed' } })
    ;(logoutAll?.props.onClick as () => void)()
    ;(revoke?.props.onClick as () => void)()
    expect(onPasswordFormChange).toHaveBeenCalledWith({ ...passwordForm, currentPassword: 'typed' })
    expect(onLogoutAllDevices).toHaveBeenCalledOnce()
    expect(onRevokeDevice).toHaveBeenCalledWith(7)
  })

  it('keeps security event status and empty state', () => {
    const events: AdminSecurityEventResponse[] = [{
      id: 1, accountId: 2, username: 'staff', eventType: 'LOGIN', success: false,
      ipAddress: '192.0.2.8', userAgent: null, detail: '拒绝', occurredAt: '2026-10-08T10:00:00Z',
    }]
    const markup = renderToStaticMarkup(<LegacyAdminSecurityAuditSection events={events} />)
    const empty = renderToStaticMarkup(<LegacyAdminSecurityAuditSection events={[]} />)

    expect(markup).toContain('最近安全事件')
    expect(markup).toContain('LOGIN')
    expect(markup).toContain('失败')
    expect(markup).toContain('192.0.2.8')
    expect(markup).toContain('拒绝')
    expect(empty).toContain('刷新后查看最近安全事件')
  })
})
