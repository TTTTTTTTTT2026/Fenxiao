import { afterEach, describe, expect, it, vi } from 'vitest'
import * as legacyApi from '../api'
import * as financeWriteApi from './financeWriteApi'

describe('admin finance write API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps every legacy export on the same implementation', () => {
    expect(legacyApi.approveAdminWithdrawRequest).toBe(financeWriteApi.approveAdminWithdrawRequest)
    expect(legacyApi.rejectAdminWithdrawRequest).toBe(financeWriteApi.rejectAdminWithdrawRequest)
    expect(legacyApi.applyAdminWithdrawBatchAction).toBe(financeWriteApi.applyAdminWithdrawBatchAction)
    expect(legacyApi.approveWithdrawForPayment).toBe(financeWriteApi.approveWithdrawForPayment)
    expect(legacyApi.recordWithdrawPayment).toBe(financeWriteApi.recordWithdrawPayment)
    expect(legacyApi.reverseWithdrawPayment).toBe(financeWriteApi.reverseWithdrawPayment)
  })

  it('preserves guarded write paths, session, request body and URL encoding', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' })
    vi.stubGlobal('fetch', fetchMock)

    await financeWriteApi.approveAdminWithdrawRequest('session', 'req/1', { remark: 'reviewed' })
    await financeWriteApi.rejectAdminWithdrawRequest('session', 'req/2', { remark: 'rejected' })
    await financeWriteApi.applyAdminWithdrawBatchAction('session', { requestNos: ['req/3'], action: 'REJECT', remark: 'reviewed' })
    await financeWriteApi.approveWithdrawForPayment('session', 'req/4', 'reviewed')
    await financeWriteApi.recordWithdrawPayment('session', 'req/5', { paymentChannel: 'MANUAL', paymentReference: 'ref' }, true)
    await financeWriteApi.recordWithdrawPayment('session', 'req/6', { paymentChannel: 'MANUAL', failureReason: 'failed' }, false)
    await financeWriteApi.reverseWithdrawPayment('session', 'req/7', { reason: 'correction', currencyCode: 'DIAMOND' })

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, JSON.parse(init.body as string)])).toEqual([
      ['/admin/distribution/withdraw-requests/req%2F1/approve', 'POST', { remark: 'reviewed' }],
      ['/admin/distribution/withdraw-requests/req%2F2/reject', 'POST', { remark: 'rejected' }],
      ['/admin/distribution/withdraw-requests/batch-actions', 'POST', { requestNos: ['req/3'], action: 'REJECT', remark: 'reviewed' }],
      ['/admin/distribution/withdrawal-workflow/req%2F4/approve-for-payment', 'POST', { remark: 'reviewed' }],
      ['/admin/distribution/withdrawal-workflow/req%2F5/payment-success', 'POST', { paymentChannel: 'MANUAL', paymentReference: 'ref' }],
      ['/admin/distribution/withdrawal-workflow/req%2F6/payment-failure', 'POST', { paymentChannel: 'MANUAL', failureReason: 'failed' }],
      ['/admin/distribution/withdrawal-workflow/req%2F7/reverse', 'POST', { reason: 'correction', currencyCode: 'DIAMOND' }],
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session' }) }))
    }
  })
})
