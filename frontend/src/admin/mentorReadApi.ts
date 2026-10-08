import { request } from '../httpClient'

export type MentorIncentiveRuleResponse = {
  id: number; ruleCode: string; ruleVersion: number; milestoneCode: string
  platformCode: string; countryCode: string; guildId: string | null
  amountMinor: number; currencyCode: string; freezeDays: number
  effectiveFrom: string; effectiveTo: string | null; status: 'DRAFT' | 'ACTIVE' | 'RETIRED' | string
  createdBy: number | null; approvedBy: number | null; approvedAt: string | null; approvalNote: string | null
}
export type MentorShadowLedgerItemResponse = {
  id: number; recipientUserId: number; sourceUserId: number; platformCode: string; milestoneCode: string
  ruleCode: string; ruleVersion: number; amountMinor: number; currencyCode: string; ledgerStatus: string; triggeredAt: string
}
export type MentorIncentiveDashboardResponse = {
  qualifiedMentorCount: number; assignedStudentCount: number; shadowEntryCount: number
  mentors: Array<{ userId: number; phoneNumber: string | null; countryCode: string; languageCode: string; qualificationStatus: string; maxActiveStudents: number; assignedStudentCount: number }>
  rules: MentorIncentiveRuleResponse[]; recentShadowEntries: MentorShadowLedgerItemResponse[]
}
export type MentorAssignedStudentResponse = {
  userId: number; phoneNumber: string | null; countryCode: string; languageCode: string
  assignedAt: string; assignmentReason: string
}

export function getAdminMentorIncentiveDashboard(adminSessionToken: string) {
  return request<MentorIncentiveDashboardResponse>('/admin/incentives/mentor-dashboard', { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminMentorAssignedStudents(adminSessionToken: string, mentorUserId: number) {
  return request<MentorAssignedStudentResponse[]>(`/admin/incentives/mentors/${mentorUserId}/students`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
