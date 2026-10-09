import { request } from '../httpClient'

export type RelationDetailResponse = {
  userId: number
  level1InviterId: number | null
  level2InviterId: number | null
  level3InviterId: number | null
  bindSource: string
  lockStatus: string
  bindTime: string
  lockTime: string | null
  countryCode: string
  crossCountry: boolean
}

export type OwnershipItemResponse = {
  id: number
  productCode: string
  ownershipStatus: string
  ownershipSource: string
  sourceRecordType: string
  sourceRecordId: number | null
  effectiveAt: string
}

export type OwnershipDetailResponse = {
  userId: number
  items: OwnershipItemResponse[]
}

export function getAdminRelation(adminSessionToken: string, userId: number, product?: string) {
  const params = new URLSearchParams()
  if (product) params.set('product', product)
  const query = params.toString()
  return request<RelationDetailResponse>(`/admin/distribution/relation/${userId}${query ? `?${query}` : ''}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function adjustAdminRelation(adminSessionToken: string, userId: number, payload: {
  level1InviterId?: number
  note?: string
}, product?: string) {
  const params = new URLSearchParams()
  if (product) params.set('product', product)
  const query = params.toString()
  return request<RelationDetailResponse>(`/admin/distribution/relation/${userId}/adjustments${query ? `?${query}` : ''}`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}

export function getAdminOwnership(adminSessionToken: string, userId: number) {
  return request<OwnershipDetailResponse>(`/admin/distribution/ownership/${userId}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function correctAdminOwnership(adminSessionToken: string, userId: number, payload: {
  productCode: string
  note?: string
}) {
  return request<OwnershipDetailResponse>(`/admin/distribution/ownership/${userId}/corrections`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}
