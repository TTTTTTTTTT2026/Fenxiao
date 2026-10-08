import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import TeamDirectoryPage from './TeamDirectoryPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'tester', displayName: '测试管理员', role: 'operations',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

describe('team directory read-only page', () => {
  it('shows the existing global read boundary without assignment writes', () => {
    const markup = renderToStaticMarkup(<TeamDirectoryPage session={session} />)

    expect(markup).toContain('团队列表 · 只读')
    expect(markup).toContain('不按应用工作区筛选')
    expect(markup).toContain('/admin#admin-teams')
    expect(markup).not.toContain('确认许可')
    expect(markup).not.toContain('新增运营分红规则')
  })

  it('denies roles without team-management capability', () => {
    const markup = renderToStaticMarkup(<TeamDirectoryPage session={{ ...session, role: 'finance' }} />)

    expect(markup).toContain('当前账号无权查看团队列表')
    expect(markup).not.toContain('刷新列表')
  })
})
