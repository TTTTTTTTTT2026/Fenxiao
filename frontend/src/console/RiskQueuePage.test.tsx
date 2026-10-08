import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../api'
import RiskQueuePage from './RiskQueuePage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'tester', displayName: '测试管理员', role: 'operator',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: 'LINKY', guildScope: '*', regionScope: '*',
}

describe('new console read-only risk queue', () => {
  it('shows only permitted products, server-backed filters and a link to old actions', () => {
    const markup = renderToStaticMarkup(<RiskQueuePage session={session} />)
    expect(markup).toContain('风险队列 · 只读')
    expect(markup).toContain('风险队列产品选择')
    expect(markup).toContain('LINKY')
    expect(markup).not.toContain('TIMO')
    expect(markup).toContain('待处理')
    expect(markup).toContain('/admin#admin-risk-queue')
    expect(markup).not.toContain('>冻结用户</button>')
    expect(markup).not.toContain('>批量忽略</button>')
  })

  it('does not query or render a product outside the session scope', () => {
    const markup = renderToStaticMarkup(<RiskQueuePage session={{ ...session, platformScope: 'OTHER' }} />)
    expect(markup).toContain('当前账号没有可查看的产品范围')
    expect(markup).not.toContain('风险事件')
  })

  it('denies a role without the existing user-management menu entry', () => {
    const markup = renderToStaticMarkup(<RiskQueuePage session={{ ...session, role: 'finance' }} />)
    expect(markup).toContain('当前账号无权查看风险队列')
    expect(markup).not.toContain('风险队列产品选择')
  })
})
