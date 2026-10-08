import { request } from '../httpClient'
import type { BatchOperationResultResponse } from './batchOperation'

export type RiskEventListItem = {
  id: number
  userId: number
  riskType: string
  riskLevel: number
  riskStatus: string
  detailJson: string
  detectedAt: string
  handledBy: number | null
  handledAt: string | null
  resultNote: string | null
}

export type RiskEventListResponse = {
  items: RiskEventListItem[]
  total: number
  page: number
  size: number
}

export function getAdminRiskEvents(adminSessionToken: string, filters?: {
  userId?: number
  riskStatus?: string
  product?: string
  startAt?: string
  endAt?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userId) params.set('userId', String(filters.userId))
  if (filters?.riskStatus) params.set('riskStatus', filters.riskStatus)
  if (filters?.product) params.set('product', filters.product)
  if (filters?.startAt) params.set('startAt', filters.startAt)
  if (filters?.endAt) params.set('endAt', filters.endAt)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<RiskEventListResponse>(`/admin/distribution/risk-events${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function applyAdminRiskEventAction(adminSessionToken: string, riskEventId: number, payload: {
  action: 'HANDLE' | 'IGNORE' | 'FREEZE_USER' | 'UNFREEZE_USER'
  note?: string
}) {
  return request<RiskEventListItem>(`/admin/distribution/risk-events/${riskEventId}/actions`, {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
    body: JSON.stringify(payload),
  })
}

export function applyAdminRiskEventBatchAction(adminSessionToken: string, payload: {
  riskEventIds: number[]
  action: 'HANDLE' | 'IGNORE'
  note?: string
}) {
  return request<BatchOperationResultResponse>('/admin/distribution/risk-events/batch-actions', {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}
