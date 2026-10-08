import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdminSession, getAdminCommissionPolicies, getAdminInvitationAccount, getAdminOverview, getAdminPlatformGuildDirectory, getAdminPlatformGuildDirectorySyncRuns, getAdminUserGradeDashboard, getAdminUserPlatformProfiles, getCurrentAdminSession, logoutAdminSession } from '../api'

describe('new console reuses the legacy admin API contract', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the same cookie-backed login, restore and logout endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ sessionToken: 'session-token', role: 'admin' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createAdminSession({ username: 'admin', password: 'example', rememberMe: true })
    await getCurrentAdminSession()
    await logoutAdminSession()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/admin/auth/session', '/admin/auth/session', '/admin/auth/session/logout',
    ])
    expect(fetchMock.mock.calls.map(([, init]) => init.credentials)).toEqual(['include', 'include', 'include'])
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: 'POST', body: JSON.stringify({ username: 'admin', password: 'example', rememberMe: true }),
    }))
  })

  it('reads the existing user directory with admin authorization and server paging', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ items: [], total: 0, page: 1, size: 50 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminUserPlatformProfiles('session-token', { userId: 1001, page: 1, size: 50 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/distribution/user-platform-profiles?userId=1001&page=1&size=50',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      }),
    )
  })

  it('reads both existing MCN guild directory endpoints under the selected platform scope', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '[]' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminPlatformGuildDirectory('session-token', 'TIMO')
    await getAdminPlatformGuildDirectorySyncRuns('session-token', 'TIMO')

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/admin/distribution/platform-guild-directory?platform=TIMO',
      '/admin/distribution/platform-guild-directory/sync-runs?platform=TIMO',
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({
        credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      }))
    }
  })

  it('reads the existing overview report scoped to a single permitted product', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ invitedUsers: 0 }) })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminOverview('session-token', 'LINKY')

    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/distribution/reports/overview?product=LINKY',
      expect.objectContaining({
        credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      }),
    )
  })

  it('reads the existing team-manage-gated grade dashboard without new write endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ rules: [], activeRuleCount: 0, qualifiedTeamLeaderCount: 0, recentEvaluations: [] }) })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminUserGradeDashboard('session-token')

    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/incentives/user-grade-dashboard',
      expect.objectContaining({
        credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      }),
    )
  })

  it('reads the existing finance-gated commission policy ledger', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '[]' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminCommissionPolicies('session-token')

    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/commission-policies',
      expect.objectContaining({
        credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      }),
    )
  })

  it('reads the existing audited finance account endpoint with server paging', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ userId: 1001, items: [], totalRecords: 0, page: 1, size: 20 }) })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminInvitationAccount('session-token', 1001, 1, 20)

    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/invitation-accounts/1001?page=1&size=20',
      expect.objectContaining({
        credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      }),
    )
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined()
  })
})
