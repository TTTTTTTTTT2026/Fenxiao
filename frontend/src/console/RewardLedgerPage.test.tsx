import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import RewardLedgerPage from './RewardLedgerPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'finance', displayName: '财务', role: 'finance',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: 'LINKY', guildScope: '*', regionScope: '*',
}

describe('new reward ledger page', () => {
  it('limits product choices to the session scope and has no finance writes', () => {
    const markup = renderToStaticMarkup(<RewardLedgerPage session={session} />)
    expect(markup).toContain('奖励记录 · 只读')
    expect(markup).toContain('LINKY')
    expect(markup).not.toContain('TIMO')
    expect(markup).toContain('/admin#admin-rewards')
    expect(markup).not.toContain('确认打款')
  })

  it('denies roles without the existing finance menu', () => {
    const markup = renderToStaticMarkup(<RewardLedgerPage session={{ ...session, role: 'operator' }} />)
    expect(markup).toContain('当前账号无权查看奖励记录')
    expect(markup).not.toContain('奖励流水')
  })
})
