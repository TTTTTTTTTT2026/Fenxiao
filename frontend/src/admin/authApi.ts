import { request } from '../httpClient'

export type AdminSessionResponse = {
  sessionToken: string
  expiresAt: string
  username: string
  displayName: string
  role: 'super_admin' | 'admin' | 'operator' | string
  mustChangePassword: boolean
  rememberMe: boolean
  passwordExpiresAt: string | null
  platformScope: string
  guildScope: string
  regionScope: string
}

export function createAdminSession(payload: { username: string; password: string; rememberMe?: boolean }) {
  return request<AdminSessionResponse>('/admin/auth/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentAdminSession() { return request<AdminSessionResponse>('/admin/auth/session') }
export function logoutAdminSession() { return request<void>('/admin/auth/session/logout', { method: 'POST' }) }
export function logoutAllAdminSessions() { return request<void>('/admin/auth/session/logout-all', { method: 'POST' }) }
export function changeAdminPassword(payload: { currentPassword: string; newPassword: string }) { return request<void>('/admin/auth/password', { method: 'POST', body: JSON.stringify(payload) }) }
