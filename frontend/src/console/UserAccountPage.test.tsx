import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../api'
import UserAccountPage from './UserAccountPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'finance', displayName: '财务', role: 'finance',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

describe('new finance user account page', () => {
  it('does not query an account until an exact user ID is submitted', () => {
    const markup = renderToStaticMarkup(<UserAccountPage session={session} />)
    expect(markup).toContain('用户账户')
    expect(markup).toContain('输入用户 ID 后查看账户与流水')
    expect(markup).toContain('/admin#admin-user-accounts')
    expect(markup).not.toContain('提现申请管理')
    expect(markup).not.toContain('审核打款')
  })

  it('denies an administrator without server FINANCE permission', () => {
    const markup = renderToStaticMarkup(<UserAccountPage session={{ ...session, role: 'admin' }} />)
    expect(markup).toContain('当前账号无权查看用户账户')
    expect(markup).not.toContain('查询账户')
  })
})
