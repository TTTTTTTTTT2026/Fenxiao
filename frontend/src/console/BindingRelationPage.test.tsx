import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import BindingRelationPage from './BindingRelationPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'operator', displayName: '运营', role: 'operator',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: 'TIMO', guildScope: '*', regionScope: '*',
}

describe('new binding relation page', () => {
  it('requires an exact user ID and exposes only the scoped product', () => {
    const markup = renderToStaticMarkup(<BindingRelationPage session={session} />)
    expect(markup).toContain('邀请关系查询 · 只读')
    expect(markup).toContain('TIMO')
    expect(markup).not.toContain('LINKY')
    expect(markup).toContain('输入用户 ID 后查看当前产品的邀请关系')
    expect(markup).toContain('/admin#admin-bindings')
  })

  it('denies roles outside the old user-management menu', () => {
    const markup = renderToStaticMarkup(<BindingRelationPage session={{ ...session, role: 'finance' }} />)
    expect(markup).toContain('当前账号无权查看邀请关系')
    expect(markup).not.toContain('查询关系')
  })
})
