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
}

export type UserPlatformProfileListResponse = {
  items: UserPlatformProfileItem[]
  total: number
  page: number
  size: number
}

export function getAdminUserPlatformProfiles(adminSessionToken: string, filters?: { userId?: number; page?: number; size?: number }) {
  const params = new URLSearchParams()
  if (filters?.userId !== undefined) params.set('userId', String(filters.userId))
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<UserPlatformProfileListResponse>(`/admin/distribution/user-platform-profiles${query ? `?${query}` : ''}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}
