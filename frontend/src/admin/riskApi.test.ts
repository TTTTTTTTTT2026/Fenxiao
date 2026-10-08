import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyAdminRiskEventAction as legacyRiskAction,
  applyAdminRiskEventBatchAction as legacyBatchAction,
  getAdminRiskEvents as legacyRiskEvents,
} from '../api'
import { applyAdminRiskEventAction, applyAdminRiskEventBatchAction, getAdminRiskEvents } from './riskApi'

describe('admin risk API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the compatibility exports bound to the same implementation', () => {
    expect(legacyRiskEvents).toBe(getAdminRiskEvents)
    expect(legacyRiskAction).toBe(applyAdminRiskEventAction)
    expect(legacyBatchAction).toBe(applyAdminRiskEventBatchAction)
  })

  it('preserves all risk query filters, paging and the admin session header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '{"items":[],"total":0,"page":2,"size":20}' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminRiskEvents('session-token', {
      userId: 17, riskStatus: 'PENDING', product: 'TIMO', startAt: '2026-10-01', endAt: '2026-10-08', page: 2, size: 20,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/admin/distribution/risk-events?userId=17&riskStatus=PENDING&product=TIMO&startAt=2026-10-01&endAt=2026-10-08&page=2&size=20',
      expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }) }),
    )
  })

  it('keeps single and batch risk actions on their existing audited endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '{}' })
    vi.stubGlobal('fetch', fetchMock)

    await applyAdminRiskEventAction('session-token', 19, { action: 'FREEZE_USER', note: '核实后处理' })
    await applyAdminRiskEventBatchAction('session-token', { riskEventIds: [19, 20], action: 'HANDLE', note: '人工复核' })

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/admin/distribution/risk-events/19/actions', expect.objectContaining({
      method: 'POST', credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      body: JSON.stringify({ action: 'FREEZE_USER', note: '核实后处理' }),
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/admin/distribution/risk-events/batch-actions', expect.objectContaining({
      method: 'POST', credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session-token' }),
      body: JSON.stringify({ riskEventIds: [19, 20], action: 'HANDLE', note: '人工复核' }),
    }))
  })
})
