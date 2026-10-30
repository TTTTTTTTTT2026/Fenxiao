import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminEarningsReadAccess, saveAdminEarningsReadAccess } from './userDirectoryApi'

describe('admin earnings read access requests', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => [] })
  })
  it('reads real persisted permission using the admin session', async () => {
    await getAdminEarningsReadAccess('test-session', 1001)
    expect(fetchMock).toHaveBeenCalledWith('/admin/distribution/user-platform-profiles/1001/earnings-read-access', expect.objectContaining({ headers: expect.objectContaining({ 'X-Admin-Session': 'test-session' }) }))
  })
  it('grants only the selected application with a version and reason', async () => {
    await saveAdminEarningsReadAccess('test-session', 1001, { platformCode: 'TIMO', enabled: false, version: 0 }, 'internal inviter')
    expect(fetchMock).toHaveBeenCalledWith('/admin/distribution/user-platform-profiles/1001/earnings-read-access/TIMO', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ enabled: true, expectedVersion: 0, reason: 'internal inviter' }),
    }))
  })
  it('revokes without deleting bindings, changing balance or mixing another application', async () => {
    await saveAdminEarningsReadAccess('test-session', 1001, { platformCode: 'LINKY', enabled: true, version: 4 }, 'access ended')
    expect(fetchMock).toHaveBeenCalledWith('/admin/distribution/user-platform-profiles/1001/earnings-read-access/LINKY', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ enabled: false, expectedVersion: 4, reason: 'access ended' }),
    }))
  })
})
