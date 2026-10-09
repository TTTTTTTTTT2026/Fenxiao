import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { TeamManagementDashboardResponse } from './teamReadApi'
import LegacyTeamDirectorySection from './LegacyTeamDirectorySection'

const dashboard: TeamManagementDashboardResponse = {
  activeTeamCount: 1, leaderTeamCount: 1, operatingProfitShareEnabledTeamCount: 0, activeMemberRelationCount: 2,
  teams: [{
    teamId: 17, teamCode: 'TEAM-17', teamName: '测试团队', countryCode: 'ID', leaderUserId: 19, leaderPhoneNumber: null,
    leaderQualificationStatus: 'QUALIFIED', teamEstablishmentStatus: 'ACTIVE', leaderAppointmentStatus: 'AUTO_CONFIRMED',
    leadershipSource: null, leaderAppointedAt: null, operatingProfitShareEnabled: false,
    parentTeamId: null, parentTeamCode: null, activeMemberCount: 2,
    latestPlatformCode: null, latestPeriodEnd: null, latestOperatingProfitMinor: null, latestCurrencyCode: null, createdAt: '2026-10-01T00:00:00Z',
  }],
}

describe('legacy team directory presentation boundary', () => {
  it('keeps the anchor, governance fields and member action', () => {
    const markup = renderToStaticMarkup(<LegacyTeamDirectorySection dashboard={dashboard} loading={false} onRefresh={vi.fn()} onViewMembers={vi.fn()} />)

    expect(markup).toContain('id="admin-teams"')
    expect(markup).toContain('已确认负责人团队')
    expect(markup).toContain('测试团队')
    expect(markup).toContain('TEAM-17 / ID')
    expect(markup).toContain('金牌自动确认')
    expect(markup).toContain('查看成员')
    expect(markup).not.toContain('确认许可')
  })

  it('preserves the empty state before loading', () => {
    const markup = renderToStaticMarkup(<LegacyTeamDirectorySection dashboard={null} loading={false} onRefresh={vi.fn()} onViewMembers={vi.fn()} />)

    expect(markup).toContain('尚未读取团队数据')
    expect(markup).toContain('尚无团队记录')
  })
})
