import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminTeamManagementDashboard as legacyDashboard, getAdminTeamMembers as legacyMembers } from '../api'
import { getAdminTeamManagementDashboard, getAdminTeamMembers } from './teamReadApi'

describe('admin team read API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('preserves the old exports on one shared implementation', () => {
    expect(legacyDashboard).toBe(getAdminTeamManagementDashboard)
    expect(legacyMembers).toBe(getAdminTeamMembers)
  })

  it('uses the original read paths and admin session without product pretense', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminTeamManagementDashboard('session')
    await getAdminTeamMembers('session', 17)

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['/admin/incentives/team-management-dashboard', undefined],
      ['/admin/incentives/teams/17/members', undefined],
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session' }) }))
    }
  })
})
