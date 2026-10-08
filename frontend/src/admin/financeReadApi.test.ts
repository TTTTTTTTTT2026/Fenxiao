import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminRewards as legacyRewards, getAdminWithdrawRequests as legacyWithdrawals } from '../api'
import { getAdminRewards, getAdminWithdrawRequests } from './financeReadApi'

describe('admin finance read API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the old exports on the shared client', () => {
    expect(legacyRewards).toBe(getAdminRewards)
    expect(legacyWithdrawals).toBe(getAdminWithdrawRequests)
  })

  it('preserves reward filters, scope and admin session header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{"items":[]}' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminRewards('session', { beneficiaryUserId: 17, status: 'AVAILABLE', product: 'LINKY', startAt: '2026-10-01T00:00:00', endAt: '2026-10-07T23:59:59', page: 2, size: 20 })

    expect(fetchMock).toHaveBeenCalledWith('/admin/distribution/rewards?beneficiaryUserId=17&status=AVAILABLE&product=LINKY&startAt=2026-10-01T00%3A00%3A00&endAt=2026-10-07T23%3A59%3A59&page=2&size=20', expect.objectContaining({
      credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session' }),
    }))
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined()
  })

  it('preserves withdrawal filters and the existing read-only path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{"items":[]}' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminWithdrawRequests('session', { userId: 17, status: 'PENDING_REVIEW', page: 1, size: 10 })

    expect(fetchMock).toHaveBeenCalledWith('/admin/distribution/withdraw-requests?userId=17&status=PENDING_REVIEW&page=1&size=10', expect.objectContaining({
      credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session' }),
    }))
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined()
  })
})
