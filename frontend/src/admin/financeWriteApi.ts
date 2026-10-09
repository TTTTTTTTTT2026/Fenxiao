import { request } from '../httpClient'
import type { BatchOperationResultResponse } from './batchOperation'
import type { AdminWithdrawRequestItem } from './financeReadApi'

export type WithdrawAdminActionPayload = {
  operatorId?: number
  operatorRole?: string
  remark?: string
}

export function approveAdminWithdrawRequest(adminSessionToken: string, requestNo: string, payload: WithdrawAdminActionPayload) {
  return request<AdminWithdrawRequestItem>(`/admin/distribution/withdraw-requests/${encodeURIComponent(requestNo)}/approve`, {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function rejectAdminWithdrawRequest(adminSessionToken: string, requestNo: string, payload: WithdrawAdminActionPayload) {
  return request<AdminWithdrawRequestItem>(`/admin/distribution/withdraw-requests/${encodeURIComponent(requestNo)}/reject`, {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function applyAdminWithdrawBatchAction(adminSessionToken: string, payload: {
  requestNos: string[]
  action: 'APPROVE' | 'REJECT'
  remark?: string
}) {
  return request<BatchOperationResultResponse>('/admin/distribution/withdraw-requests/batch-actions', {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function approveWithdrawForPayment(adminSessionToken: string, requestNo: string, remark: string) {
  return request<{ requestNo: string; status: string; amount: number }>(`/admin/distribution/withdrawal-workflow/${encodeURIComponent(requestNo)}/approve-for-payment`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ remark }),
  })
}

export function recordWithdrawPayment(adminSessionToken: string, requestNo: string, payload: { paymentChannel: string; paymentReference?: string; evidenceUri?: string; evidenceHash?: string; failureReason?: string }, success: boolean) {
  return request<{ requestNo: string; status: string; amount: number }>(`/admin/distribution/withdrawal-workflow/${encodeURIComponent(requestNo)}/${success ? 'payment-success' : 'payment-failure'}`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}

export function reverseWithdrawPayment(adminSessionToken: string, requestNo: string, payload: { reason: string; currencyCode: string }) {
  return request<{ requestNo: string; status: string; amount: number }>(`/admin/distribution/withdrawal-workflow/${encodeURIComponent(requestNo)}/reverse`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}
