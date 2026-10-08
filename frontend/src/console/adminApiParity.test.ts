import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdminSession, getAdminUserPlatformProfiles, getCurrentAdminSession, logoutAdminSession } from '../api'

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
})
