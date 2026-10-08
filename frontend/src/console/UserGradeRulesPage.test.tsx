import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../api'
import { USER_GRADE_CATALOG } from '../admin/userGradeCatalog'
import UserGradeRulesPage from './UserGradeRulesPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'tester', displayName: '测试管理员', role: 'operations',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

describe('new console user grade rules page', () => {
  it('reuses the same seven-grade catalog as the legacy page, with no write controls', () => {
    const markup = renderToStaticMarkup(<UserGradeRulesPage session={session} />)

    expect(USER_GRADE_CATALOG).toHaveLength(7)
    for (const grade of USER_GRADE_CATALOG) expect(markup).toContain(grade.grade)
    expect(markup).toContain('个人推荐分成统一为直邀 10%、间邀 3%')
    expect(markup).toContain('/admin#admin-user-grade-list')
    expect(markup).not.toContain('审批并启用')
    expect(markup).not.toContain('新增积分等级')
  })

  it('does not render the catalog for a role outside the existing team-manage gate', () => {
    const markup = renderToStaticMarkup(<UserGradeRulesPage session={{ ...session, role: 'finance' }} />)

    expect(markup).toContain('当前账号无权查看用户等级规则')
    expect(markup).not.toContain('刷新数据')
  })
})
