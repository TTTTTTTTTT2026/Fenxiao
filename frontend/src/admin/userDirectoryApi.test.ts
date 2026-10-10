import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminUserPlatformProfiles as legacyGetProfiles } from '../api'
import { getAdminUserPlatformProfiles, getAdminUserDirectoryOptions, updateAdminUserNickname, updateAdminUserOperator, updateAdminUserValue } from './userDirectoryApi'

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

  it('serializes combined search filters and privileged updates on the shared API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' })
    vi.stubGlobal('fetch', fetchMock)
    await getAdminUserPlatformProfiles('session-token', {
      userId: 42, unassigned: true, valueCode: 'GENERAL', countryCode: 'ID', localPhone: '81234567890',
      linkyGuildId: 'L1', timoGuildId: 'T2', page: 0, size: 50,
    })
    await getAdminUserDirectoryOptions('session-token')
    await updateAdminUserOperator('session-token', 42, null, '人员转交')
    await updateAdminUserValue('session-token', 42, 'HIGH_VALUE', '人工评估')
    await updateAdminUserNickname('session-token', 42, '新昵称')
    expect(fetchMock.mock.calls[0][0]).toContain('localPhone=81234567890')
    expect(fetchMock.mock.calls[0][0]).toContain('unassigned=true')
    expect(fetchMock.mock.calls[0][0]).not.toContain('operatorAdminId=')
    expect(fetchMock.mock.calls[1][0]).toBe('/admin/distribution/user-platform-profiles/options')
    expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining({ method: 'POST', body: JSON.stringify({ operatorAdminId: null, reason: '人员转交' }) }))
    expect(fetchMock.mock.calls[3][1]).toEqual(expect.objectContaining({ method: 'POST', body: JSON.stringify({ valueCode: 'HIGH_VALUE', reason: '人工评估' }) }))
    expect(fetchMock.mock.calls[4][0]).toBe('/admin/distribution/user-platform-profiles/42/nickname')
    expect(fetchMock.mock.calls[4][1]).toEqual(expect.objectContaining({ method: 'POST', body: JSON.stringify({ nickname: '新昵称' }), headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }) }))
  })
})
