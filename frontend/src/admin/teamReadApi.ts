import { request } from '../httpClient'

export type TeamManagementDashboardResponse = {
  activeTeamCount: number; leaderTeamCount: number; operatingProfitShareEnabledTeamCount: number; activeMemberRelationCount: number
  teams: TeamManagementItemResponse[]
}
export type TeamManagementItemResponse = {
  teamId: number; teamCode: string; teamName: string; countryCode: string
  leaderUserId: number | null; leaderPhoneNumber: string | null
  leaderQualificationStatus: string; teamEstablishmentStatus: string; leaderAppointmentStatus: string
  leadershipSource: string | null; leaderAppointedAt: string | null
  operatingProfitShareEnabled: boolean
  parentTeamId: number | null; parentTeamCode: string | null; activeMemberCount: number
  latestPlatformCode: string | null; latestPeriodEnd: string | null
  latestOperatingProfitMinor: number | null; latestCurrencyCode: string | null; createdAt: string
}
export type TeamManagementMemberResponse = {
  userId: number; phoneNumber: string | null; countryCode: string; memberRole: string; sourceType: string; effectiveFrom: string
}

export function getAdminTeamManagementDashboard(adminSessionToken: string) {
  return request<TeamManagementDashboardResponse>('/admin/incentives/team-management-dashboard', { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminTeamMembers(adminSessionToken: string, teamId: number) {
  return request<TeamManagementMemberResponse[]>(`/admin/incentives/teams/${teamId}/members`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
