import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import MySecurityPage from './MySecurityPage'
import SecurityRecordsPage from './SecurityRecordsPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'operator', displayName: '运营', role: 'operator',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

describe('new console self-security read-only pages', () => {
  it('shows own device sessions without revocation controls', () => {
    const markup = renderToStaticMarkup(<MySecurityPage session={session} />)
    expect(markup).toContain('我的设备会话')
    expect(markup).toContain('/admin#admin-my-security')
    expect(markup).not.toContain('撤销此设备')
  })

  it('shows own security events without account administration', () => {
    const markup = renderToStaticMarkup(<SecurityRecordsPage session={session} />)
    expect(markup).toContain('最近安全事件')
    expect(markup).toContain('/admin#admin-security-records')
    expect(markup).not.toContain('重置密码')
  })
})
