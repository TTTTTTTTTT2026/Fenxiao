import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../api'
import OverviewPage from './OverviewPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'tester', displayName: '测试管理员', role: 'operator',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: 'LINKY', guildScope: '*', regionScope: '*',
}

describe('new console overview page', () => {
  it('starts with only the administrator permitted product and keeps old actions in the old console', () => {
    const markup = renderToStaticMarkup(<OverviewPage session={session} />)

    expect(markup).toContain('分销概览产品选择')
    expect(markup).toContain('LINKY')
    expect(markup).not.toContain('TIMO')
    expect(markup).toContain('只读展示当前产品的累计指标')
    expect(markup).toContain('/admin#admin-overview')
  })

  it('denies a session with no supported product in its existing platform scope', () => {
    const markup = renderToStaticMarkup(<OverviewPage session={{ ...session, platformScope: 'OTHER' }} />)

    expect(markup).toContain('当前账号没有可查看的产品范围')
    expect(markup).not.toContain('刷新概览')
  })
})
