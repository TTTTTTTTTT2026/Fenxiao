import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminUserPlatformProfiles as legacyGetProfiles } from '../api'
import { getAdminUserPlatformProfiles } from './userDirectoryApi'

describe('admin user directory API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the old API export bound to the shared read-only implementation', () => {
    expect(legacyGetProfiles).toBe(getAdminUserPlatformProfiles)
  })

  it('preserves authorization, filter order and server paging on the existing endpoint', async () => {
    const response = { items: [], total: 0, page: 2, size: 20 }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify(response) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getAdminUserPlatformProfiles('session-token', { userId: 1001, page: 2, size: 20 })).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/distribution/user-platform-profiles?userId=1001&page=2&size=20',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      }),
    )
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined()
  })

  it('does not add query parameters when filters are absent and retains explicit zero values', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{"items":[],"total":0,"page":0,"size":0}' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminUserPlatformProfiles('session-token')
    await getAdminUserPlatformProfiles('session-token', { userId: 0, page: 0, size: 0 })

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/admin/distribution/user-platform-profiles',
      '/admin/distribution/user-platform-profiles?userId=0&page=0&size=0',
    ])
  })
})
