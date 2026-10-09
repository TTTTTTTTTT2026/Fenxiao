import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import { availableConsoleRoutesForSession, selectedConsoleRoute } from './navigation'
import { buildConsoleMenuHierarchy } from './menuHierarchy'
import WithdrawalRequestsPage from './WithdrawalRequestsPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '', username: 'tester', displayName: '测试管理员', role: 'super_admin',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

describe('withdrawal requests read-only migration', () => {
  it('provides a global read-only page and preserves the legacy action entry', () => {
    const markup = renderToStaticMarkup(<WithdrawalRequestsPage session={session} />)
    expect(markup).toContain('提现申请 · 只读')
    expect(markup).toContain('全局提现申请')
    expect(markup).toContain('申请钻石')
    expect(markup).toContain('申请周')
    expect(markup).toContain('/admin#admin-rewards')
    for (const action of ['确认打款', '批准提现', '批量审核', '导出']) expect(markup).not.toContain(action)
  })

  it.each([
    { role: 'finance' }, { role: 'admin' }, { role: 'operations' }, { role: 'operator' },
    { platformScope: 'LINKY' }, { guildScope: 'guild-test' }, { regionScope: 'BR' },
    { platformScope: '' }, { guildScope: '' }, { regionScope: '' },
  ])('denies the route, menu and query component for restricted sessions: %j', (restriction) => {
    const restricted = { ...session, ...restriction }
    expect(availableConsoleRoutesForSession(restricted).some((route) => route.key === 'withdrawals')).toBe(false)
    expect(buildConsoleMenuHierarchy(restricted).flatMap((group) => group.entries).some((entry) => entry.key === 'withdrawals')).toBe(false)
    const markup = renderToStaticMarkup(<WithdrawalRequestsPage session={restricted} />)
    expect(markup).toContain('当前账号无权查看全局提现申请')
    expect(markup).not.toContain('提现申请记录')
    expect(markup).not.toContain('提现用户 ID')
  })

  it('adds the new route once under finance without changing its default destination', () => {
    expect(selectedConsoleRoute('/console/withdrawals', 'super_admin')?.key).toBe('withdrawals')
    expect(selectedConsoleRoute('/console/withdrawals', 'finance')).toBeNull()
    const finance = buildConsoleMenuHierarchy(session).find((group) => group.key === 'finance')!
    expect(finance.href).toBe('/console/reward-ledger')
    expect(finance.entries.filter((entry) => entry.key === 'withdrawals')).toEqual([
      { key: 'withdrawals', label: '提现申请 · 只读', href: '/console/withdrawals', legacy: false },
    ])
    expect(finance.entries.some((entry) => entry.legacy && entry.href === '/admin#admin-rewards')).toBe(true)
  })
})
