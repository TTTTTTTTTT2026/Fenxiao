import { request } from '../httpClient'

export type UserPlatformProfileBinding = {
  accountId: string
  status: string
  guildId: string | null
  guildName: string | null
  verifiedAt: string | null
  source: string
  expectedGuildSource: string | null
}

export type UserPlatformProfileInvitationGuild = {
  guildId: string
  guildName: string
  guildInviteCode: string | null
  source: string
  inheritedFromUserId: number | null
  effectiveAt: string
  changeReason: string | null
}

export type UserPlatformProfileItem = {
  userId: number
  nickname: string | null
  inviteCode: string
  countryCode: string
  phoneNumber: string | null
  registeredAt: string
  directInviterUserId: number | null
  directInviterNickname: string | null
  userGradeCode: string
  passwordLoginEnabled: boolean
  linky: UserPlatformProfileBinding | null
  timo: UserPlatformProfileBinding | null
  invitationGuild: UserPlatformProfileInvitationGuild | null
  operatorAdminId?: number | null
  operatorName?: string | null
  valueCode?: 'GENERAL' | 'HIGH_VALUE'
}

export type UserPlatformProfileListResponse = {
  items: UserPlatformProfileItem[]
  total: number
  page: number
  size: number
}

export type UserDirectoryFilters = {
  userId?: number
  operatorAdminId?: number
  unassigned?: boolean
  valueCode?: 'GENERAL' | 'HIGH_VALUE'
  countryCode?: string
  localPhone?: string
  linkyGuildId?: string
  timoGuildId?: string
  page?: number
  size?: number
}

export type UserDirectoryOptions = {
  operators: { id: number; displayName: string; username: string; enabled: boolean }[]
  countries: string[]
  linkyGuilds: { guildId: string; guildName: string | null }[]
  timoGuilds: { guildId: string; guildName: string | null }[]
}

export function getAdminUserPlatformProfiles(adminSessionToken: string, filters?: UserDirectoryFilters) {
  const params = new URLSearchParams()
  if (filters) Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== false) params.set(key, String(value))
  })
  const query = params.toString()
  return request<UserPlatformProfileListResponse>(`/admin/distribution/user-platform-profiles${query ? `?${query}` : ''}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function getAdminUserDirectoryOptions(adminSessionToken: string) {
  return request<UserDirectoryOptions>('/admin/distribution/user-platform-profiles/options', {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function updateAdminUserOperator(adminSessionToken: string, userId: number, operatorAdminId: number | null, reason: string) {
  return request(`/admin/distribution/user-platform-profiles/${userId}/operator`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify({ operatorAdminId, reason }),
  })
}

export function updateAdminUserValue(adminSessionToken: string, userId: number, valueCode: 'GENERAL' | 'HIGH_VALUE', reason: string) {
  return request(`/admin/distribution/user-platform-profiles/${userId}/value`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify({ valueCode, reason }),
  })
}
