import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { EffectiveUserQualificationResponse, UserGradeDashboardResponse, UserPointDashboardResponse } from '../api'
import type { AdminSessionResponse } from '../admin/authApi'
import GradeFactsPage, { GradeFactsSnapshot } from './GradeFactsPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'tester', displayName: '测试管理员', role: 'super_admin',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}
const grade: UserGradeDashboardResponse = {
  activeRuleCount: 2, qualifiedTeamLeaderCount: 3, rules: [],
  recentEvaluations: [{
    userId: 17, platformCode: 'TIMO', guildId: 'guild-7', gradeCode: 'SILVER', ruleId: 1,
    status: 'QUALIFIED', directInviteCount: 5, currentActiveEffectiveInviteCount: 4,
    directIncome: 0, qualifiedAt: null, evaluatedAt: '2026-10-09T01:00:00Z',
  }],
}
const points: UserPointDashboardResponse = {
  platformCode: 'TIMO', accruedFactCount: 9, blockedFactCount: 1, revokedFactCount: 2,
  accruedPointTotal: 12.5,
  topBalances: [{ userId: 17, totalPoints: 12.5, accruedFactCount: 9, latestIncomeAt: null, evaluatedAt: '2026-10-09T01:00:00Z' }],
  recentFacts: [{
    platformCode: 'TIMO', sourceEventId: 'event-9', sourceUserId: 18, beneficiaryUserId: 17,
    invitationVersionNo: 1, conversionId: 2, tokenUnit: 'TOKEN', sourceAmount: 40,
    pointsPerToken: 0.5, pointAmount: 20, occurredAt: '2026-10-09T01:00:00Z',
    factStatus: 'ACCRUED', decisionReason: '历史事实', projectedAt: '2026-10-09T02:00:00Z',
  }],
}
const qualification: EffectiveUserQualificationResponse = {
  userId: 18, platformCode: 'TIMO', qualificationStatus: 'QUALIFIED', firstIncomeAt: null,
  observationEndsAt: null, qualifyingIncomeDateCount: 3, qualifyingIncomeDates: '2026-10-01,2026-10-02,2026-10-03',
  latestIncomeAt: null, sourceEvidenceSnapshot: '测试证据', qualifiedAt: null, evidenceRevokedAt: null,
  manualCorrectionReason: null, manualCorrectionNote: null, correctedBy: null, correctedAt: null,
  evaluatedAt: '2026-10-09T01:00:00Z', qualificationWindowStart: '2026-10-01', qualificationWindowEnd: '2026-10-07',
  currentActivityStatus: 'ACTIVE', currentActivityWindowStart: '2026-10-01', currentActivityWindowEnd: '2026-10-07',
}

describe('grade facts read-only migration', () => {
  it('requires an unrestricted highest-administrator session', () => {
    const allowed = renderToStaticMarkup(<GradeFactsPage session={session} />)
    expect(allowed).toContain('等级资格事实 · 只读')
    expect(allowed).toContain('/admin#admin-user-grade-facts')
    expect(allowed).not.toContain('人工纠偏</button>')
    expect(renderToStaticMarkup(<GradeFactsPage session={{ ...session, role: 'operations' }} />)).toContain('当前账号无权查看全局等级资格事实')
    expect(renderToStaticMarkup(<GradeFactsPage session={{ ...session, platformScope: 'TIMO' }} />)).toContain('当前账号无权查看全局等级资格事实')
  })

  it('shows existing grade, qualification and historical point facts without writes', () => {
    const markup = renderToStaticMarkup(<GradeFactsSnapshot grade={grade} points={points} qualifications={[qualification]} platform="TIMO" />)
    expect(markup).toContain('已启用等级规则')
    expect(markup).toContain('最近等级评估')
    expect(markup).toContain('guild-7')
    expect(markup).toContain('当前活跃有效直邀')
    expect(markup).toContain('测试证据')
    expect(markup).toContain('12.500000')
    expect(markup).toContain('event-9')
    expect(markup).toContain('已停用旧口径')
    expect(markup).not.toContain('按定稿收入刷新')
    expect(markup).not.toContain('立即复核')
  })
})
