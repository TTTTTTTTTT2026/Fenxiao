import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse, CommissionPolicyResponse } from '../api'
import LegacyCommissionPolicySection from '../admin/LegacyCommissionPolicySection'
import CommissionPolicyPage from './CommissionPolicyPage'
import { enabledLevels } from './commissionPolicyModel'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'finance', displayName: '财务', role: 'finance',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

const policy: CommissionPolicyResponse = {
  id: 1, policyCode: 'HISTORY-1', commissionType: 'INVITATION', platformCode: 'LINKY', countryCode: 'BR',
  maxRewardLevel: 2, status: 'ACTIVE', effectiveFrom: '2026-10-01T00:00:00Z', effectiveTo: null,
  createdBy: 1, approvedBy: 2, approvedAt: '2026-10-01T00:00:00Z', approvalNote: null,
  levels: [
    { rewardLevel: 1, enabled: true, rewardRate: 0.1, freezeDays: 7 },
    { rewardLevel: 2, enabled: true, rewardRate: 0.03, freezeDays: 7 },
    { rewardLevel: 3, enabled: false, rewardRate: null, freezeDays: null },
  ],
}

describe('commission policy read-only migration', () => {
  it('keeps the legacy section and historical fields without write controls', () => {
    const markup = renderToStaticMarkup(<LegacyCommissionPolicySection policies={[policy]} loading={false} onRefresh={() => {}} />)
    expect(markup).toContain('admin-commission-policies')
    expect(markup).toContain('HISTORY-1')
    expect(markup).toContain('LINKY / BR')
    expect(markup).toContain('刷新台账')
    expect(markup).not.toContain('审批并启用')
  })

  it('renders the new finance page with the fixed two-level policy and no write action', () => {
    const markup = renderToStaticMarkup(<CommissionPolicyPage session={session} />)
    expect(markup).toContain('邀请裂变分成规则台账')
    expect(markup).toContain('直接邀请')
    expect(markup).toContain('10%')
    expect(markup).toContain('/admin#admin-commission-policies')
    expect(markup).not.toContain('新增规则')
    expect(enabledLevels(policy)).toBe('L1 10.00% / 冻结 7 天；L2 3.00% / 冻结 7 天')
  })

  it('denies a role without the server FINANCE permission', () => {
    const markup = renderToStaticMarkup(<CommissionPolicyPage session={{ ...session, role: 'admin' }} />)
    expect(markup).toContain('当前账号无权查看邀请裂变分成规则')
    expect(markup).not.toContain('刷新台账')
  })
})
