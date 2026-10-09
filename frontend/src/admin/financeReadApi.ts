import { request } from '../httpClient'

export type RewardListItem = {
  beneficiaryUserId: number
  sourceUserId: number
  rewardLevel: number
  rewardAmount: number
  rewardStatus: string
  calculatedAt: string
}

export type RewardListResponse = {
  items: RewardListItem[]
  total: number
  page: number
  size: number
}

export type AdminWithdrawRequestItem = {
  requestNo: string
  userId: number
  requestedDiamondAmount: number
  requestStatus: string
  requestWeek: string
  requestedAt: string
}

export type AdminWithdrawRequestListResponse = {
  items: AdminWithdrawRequestItem[]
  total: number
  page: number
  size: number
}

export function getAdminRewards(adminSessionToken: string, filters?: {
  beneficiaryUserId?: number
  status?: string
  product?: string
  startAt?: string
  endAt?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.beneficiaryUserId) params.set('beneficiaryUserId', String(filters.beneficiaryUserId))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.product) params.set('product', filters.product)
  if (filters?.startAt) params.set('startAt', filters.startAt)
  if (filters?.endAt) params.set('endAt', filters.endAt)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<RewardListResponse>(`/admin/distribution/rewards${query ? `?${query}` : ''}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function getAdminWithdrawRequests(adminSessionToken: string, filters?: {
  userId?: number
  status?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userId !== undefined) params.set('userId', String(filters.userId))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<AdminWithdrawRequestListResponse>(`/admin/distribution/withdraw-requests${query ? `?${query}` : ''}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}
