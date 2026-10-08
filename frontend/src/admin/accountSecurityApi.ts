import { request } from '../httpClient'

export type AdminAccountResponse = {
  id: number; username: string; displayName: string; role: string; enabled: boolean
  platformScope: string; guildScope: string; regionScope: string; mustChangePassword: boolean
  lastLoginAt: string | null; passwordChangedAt: string | null; passwordExpiresAt: string | null; lockedUntil: string | null; activeSessions: number
}

export type AdminAccountCreatedResponse = { account: AdminAccountResponse; temporaryPassword: string }
export type AdminDeviceSessionResponse = { id: number; current: boolean; rememberMe: boolean; issuedAt: string; lastSeenAt: string; expiresAt: string; ipAddress: string | null; userAgent: string | null }
export type AdminSecurityEventResponse = { id: number; accountId: number | null; username: string | null; eventType: string; success: boolean; ipAddress: string | null; userAgent: string | null; detail: string | null; occurredAt: string }

export function getAdminAccounts() { return request<AdminAccountResponse[]>('/admin/accounts') }
export function createAdminAccount(payload: { username: string; displayName: string; role: string; platformScope?: string; guildScope?: string; regionScope?: string }) { return request<AdminAccountCreatedResponse>('/admin/accounts', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateAdminAccount(id: number, payload: { displayName: string; role: string; enabled: boolean; platformScope?: string; guildScope?: string; regionScope?: string }) { return request<AdminAccountResponse>(`/admin/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function resetAdminPassword(id: number) { return request<AdminAccountCreatedResponse>(`/admin/accounts/${id}/reset-password`, { method: 'POST' }) }
export function unlockAdminAccount(id: number) { return request<AdminAccountResponse>(`/admin/accounts/${id}/unlock`, { method: 'POST' }) }
export function getAdminDeviceSessions() { return request<AdminDeviceSessionResponse[]>('/admin/accounts/me/sessions') }
export function revokeAdminDeviceSession(id: number) { return request<{ revoked: boolean }>(`/admin/accounts/me/sessions/${id}`, { method: 'DELETE' }) }
export function getMyAdminSecurityEvents() { return request<AdminSecurityEventResponse[]>('/admin/accounts/me/security-events') }
