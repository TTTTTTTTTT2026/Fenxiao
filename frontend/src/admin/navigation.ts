export type AdminSettingsView = 'experiment' | 'guilds' | 'platforms' | 'incomeControlled' | 'incomeShadow' | 'mockVerification' | 'advanced' | 'seedInviter' | 'phoneVerification' | 'smsWhitelist'
export type AdminAccountView = 'security' | 'staff' | 'audit'
export type AdminSectionKey = 'overview' | 'channel' | 'bindings' | 'riskQueue' | 'users' | 'highValueDay' | 'highValueWeek' | 'highValueMonth' | 'platformGuildDirectory' | 'rewards' | 'userAccounts' | 'commissionPolicies' | 'mentorDirectory' | 'mentorIncentives' | 'teams' | 'operatingDividends' | 'userGrades' | 'userGradeList' | 'advancedGradeAcceptance' | 'userGradeFacts' | 'tokenPointConversions' | 'accounts' | 'accountManagement' | 'mySecurity' | 'securityRecords' | 'settings' | 'systemExperiment' | 'systemGuilds' | 'systemPlatforms' | 'systemIncomeControlled' | 'systemIncomeShadow' | 'systemMockVerification' | 'systemAdvanced' | 'systemSeedInviter' | 'systemPhoneVerification' | 'systemSmsWhitelist'

export const ADMIN_SECTION_HASHES: Record<AdminSectionKey, string> = {
  overview: '#admin-overview',
  channel: '#admin-channel-entries',
  bindings: '#admin-bindings',
  riskQueue: '#admin-risk-queue',
  users: '#admin-users',
  highValueDay: '#admin-high-value-day',
  highValueWeek: '#admin-high-value-week',
  highValueMonth: '#admin-high-value-month',
  platformGuildDirectory: '#admin-platform-guild-directory',
  rewards: '#admin-rewards',
  userAccounts: '#admin-user-accounts',
  commissionPolicies: '#admin-commission-policies',
  mentorDirectory: '#admin-mentors',
  mentorIncentives: '#admin-mentor-incentives',
  teams: '#admin-teams',
  operatingDividends: '#admin-operating-dividends',
  userGrades: '#admin-user-grades',
  userGradeList: '#admin-user-grade-list',
  advancedGradeAcceptance: '#admin-advanced-grade-acceptance',
  userGradeFacts: '#admin-user-grade-facts',
  tokenPointConversions: '#admin-token-point-conversions',
  accounts: '#admin-accounts',
  accountManagement: '#admin-account-management',
  mySecurity: '#admin-my-security',
  securityRecords: '#admin-security-records',
  settings: '#admin-settings',
  systemExperiment: '#admin-system-experiment',
  systemGuilds: '#admin-system-guilds',
  systemPlatforms: '#admin-system-platforms',
  systemIncomeControlled: '#admin-system-income-controlled',
  systemIncomeShadow: '#admin-system-income-shadow',
  systemMockVerification: '#admin-system-mock-verification',
  systemAdvanced: '#admin-system-advanced',
  systemSeedInviter: '#admin-system-seed-inviter',
  systemPhoneVerification: '#admin-system-phone-verification',
  systemSmsWhitelist: '#admin-system-sms-whitelist',
}

export const SYSTEM_CONFIG_SECTION_VIEWS: Partial<Record<AdminSectionKey, AdminSettingsView>> = {
  systemExperiment: 'experiment',
  systemGuilds: 'guilds',
  systemPlatforms: 'platforms',
  systemIncomeControlled: 'incomeControlled',
  systemIncomeShadow: 'incomeShadow',
  systemMockVerification: 'mockVerification',
  systemAdvanced: 'advanced',
  systemSeedInviter: 'seedInviter',
  systemPhoneVerification: 'phoneVerification',
  systemSmsWhitelist: 'smsWhitelist',
}

export const SYSTEM_MANAGEMENT_SECTION_VIEWS: Partial<Record<AdminSectionKey, AdminAccountView>> = {
  accountManagement: 'staff',
  mySecurity: 'security',
  securityRecords: 'audit',
}

export function getVisibleFinanceSections(role?: string): AdminSectionKey[] {
  const normalizedRole = role?.toLowerCase()
  if (normalizedRole === 'super_admin' || normalizedRole === 'admin' || !normalizedRole) return ['rewards', 'userAccounts', 'commissionPolicies', 'tokenPointConversions']
  if (normalizedRole === 'finance') return ['rewards', 'userAccounts', 'commissionPolicies']
  if (normalizedRole === 'operations') return ['tokenPointConversions']
  return []
}

export function resolveAdminSectionFromHash(hash?: string): AdminSectionKey {
  const normalized = hash || '#admin-overview'
  if (normalized === '#admin-mentor-incentives') return 'mentorDirectory'
  if (normalized === '#admin-operating-dividends') return 'teams'
  if (normalized === '#admin-system-mock-verification') return 'systemPlatforms'
  if (normalized === '#admin-user-grades') return 'userGradeList'
  const match = (Object.entries(ADMIN_SECTION_HASHES) as Array<[AdminSectionKey, string]>).find(([, value]) => value === normalized)
  if (match) return match[0]
  if (normalized === '#admin-invite-ops') return 'channel'
  if (normalized === '#admin-withdraw-requests') return 'rewards'
  if (normalized === '#admin-user-facts' || normalized === '#admin-user-platform-profiles') return 'users'
  if (normalized === '#admin-risks') return 'riskQueue'
  if (normalized === '#admin-onboarding') return 'settings'
  return 'overview'
}
