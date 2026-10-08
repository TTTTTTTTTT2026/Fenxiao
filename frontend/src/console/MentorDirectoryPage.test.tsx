import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import MentorDirectoryPage from './MentorDirectoryPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'tester', displayName: '测试管理员', role: 'finance',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

describe('mentor directory read-only page', () => {
  it('shows the existing global read boundary without qualification writes', () => {
    const markup = renderToStaticMarkup(<MentorDirectoryPage session={session} />)

    expect(markup).toContain('导师列表 · 只读')
    expect(markup).toContain('不按应用工作区筛选')
    expect(markup).toContain('/admin#admin-mentors')
    expect(markup).not.toContain('新建导师资格')
    expect(markup).not.toContain('编辑学员')
  })

  it('denies roles without the mentor-read capability', () => {
    const markup = renderToStaticMarkup(<MentorDirectoryPage session={{ ...session, role: 'operator' }} />)

    expect(markup).toContain('当前账号无权查看导师列表')
    expect(markup).not.toContain('刷新列表')
  })
})
