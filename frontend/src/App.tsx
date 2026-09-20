import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Bell,
  CaretRight,
  CheckCircle,
  Copy,
  Diamond,
  Eye,
  EyeSlash,
  IdentificationCard,
  LinkSimple,
  GearSix,
  House,
  Megaphone,
  ShareNetwork,
  ShieldCheck,
  SignIn,
  SignOut,
  LockSimple,
  Medal,
  Sparkle,
  Target,
  User,
  UserCircle,
  UserPlus,
  UsersThree,
  Wallet,
} from '@phosphor-icons/react'
import './App.css'
import {
  adjustAdminRelation,
  applyAdminRiskEventAction,
  applyAdminRiskEventBatchAction,
  applyAdminWithdrawBatchAction,
  approveWithdrawForPayment,
  changeExperimentStatus,
  changeAdminPassword,
  correctAdminOwnership,
  createAdminSeedInviter,
  createExperiment,
  createAdminSession,
  createAdminAccount,
  createProfile,
  createWithdrawRequest,
  getAdminAuditLogs,
  getAdminAccounts,
  getAdminDeviceSessions,
  getCurrentAdminSession,
  getMyAdminSecurityEvents,
  getAdminGuildConfigs,
  getAdminGuildWeeklyReport,
  getAdminLinkyReplayRecords,
  getAdminLinkyWebhookLogs,
  getAdminOverview,
  getAdminPhoneVerificationCodeAudit,
  getAdminPhoneVerificationCodes,
  getAdminPlatformIntegrations,
  createAdminPlatformGuildOperatingShareRate,
  getAdminPlatformGuildCompanyShareRules,
  activateAdminPlatformGuildCompanyShareRule,
  getAdminPlatformGuildDirectory,
  getAdminPlatformGuildDirectorySyncRuns,
  getAdminPlatformVerificationMocks,
  getAdminPlatformVerificationRuntime,
  getAdminSeedInviters,
  getAdminUserPlatformProfiles,
  getAdminOwnership,
  getAdminRelation,
  getAdminRewards,
  getAdminRiskEvents,
  getAdminWithdrawRequests,
  getExperimentDashboard,
  getDistributionHome,
  getDistributionRewards,
  getDistributionRewardSummary,
  getPlatformBinding,
  getVerifiedLinkyAccountBinding,
  getDistributionTeam,
  getDistributionTeamWeeklyIncome,
  getWithdrawHistory,
  issuePhoneCode,
  logoutAdminSession,
  logoutAllAdminSessions,
  logoutUserSession,
  phoneLogin,
  refreshAdminLinkyEligibility,
  refreshAdminLinkyEligibilityBatch,
  registerLinkyAccount,
  recordWithdrawPayment,
  revealAdminPhoneVerificationCode,
  reverseWithdrawPayment,
  resetAdminPassword,
  runAdminIncomeControlledChanges,
  runAdminIncomeControlledReconciliation,
  getAdminIncomeSyncStatus,
  refreshAdminIncomeShadowLedger,
  replayAdminIncomeShadowLedger,
  refreshAdminIncomeRewardCandidates,
  getAdminIncomeShadowLedgerSummary,
  getAdminIncomeDataQuality,
  getAdminIncomeDataQualityExceptions,
  reviewAdminIncomeDataQualityException,
  getAdminIncomeRewardCandidateItems,
  getAdminIncomeRewardCandidateSample,
  getAdminIncomeRewardCandidateSummary,
  getAdminCommissionPolicies,
  getAdminMentorIncentiveDashboard,
  getAdminMentorAssignedStudents,
  createAdminMentorIncentiveRules,
  getAdminOperatingDividendDashboard,
  getAdminTeamManagementDashboard,
  getAdminTeamMembers,
  saveAdminTeamOperatingProfitSharePermission,
  getAdminUserGradeDashboard,
  getAdminEffectiveUserQualifications,
  getAdminUserGradeLevelDashboard,
  getAdminTokenPointConversionDashboard,
  getAdminUserPointDashboard,
  refreshAdminUserPoints,
  createAdminOperatingDividendPolicies,
  activateAdminOperatingDividendPolicy,
  retireAdminOperatingDividendPolicy,
  createAdminUserGradeLevel,
  saveAdminTokenPointConversion,
  activateAdminUserGradeLevel,
  retireAdminUserGradeLevel,
  evaluateAdminUserGrade,
  refreshAdminEffectiveUserQualifications,
  excludeAdminEffectiveUserQualification,
  getAdminUserGradeAdvancementReviews,
  createAdminUserGradeAdvancementReview,
  recordAdminUserGradePlatinumEvidence,
  recordAdminUserGradeAdvancedEvidence,
  confirmAdminUserGradeAdvancementReview,
  qualifyAdminMentor,
  assignAdminMentor,
  unlockAdminAccount,
  revokeAdminDeviceSession,
  rejectAdminWithdrawRequest,
  saveAdminGuildConfig,
  saveAdminPlatformVerificationMock,
  submitPlatformBinding,
  updateAdminAccount,
  updateAdminLinkyInvitationGuild,
  enrollExperimentParticipant,
  type AdminWithdrawRequestListResponse,
  type BatchOperationResultResponse,
  type AdminAccountResponse,
  type AdminDeviceSessionResponse,
  type AdminSecurityEventResponse,
  type AuditLogListResponse,
  type DistributionHomeResponse,
  type ExperimentDashboardResponse,
  type GuildConfigRequest,
  type GuildConfigResponse,
  type GuildWeeklyReportResponse,
  type InviteBindingResponse,
  type LinkyEligibilityCheckResponse,
  type LinkyBatchRefreshResponse,
  type LinkyAccountBindingResponse,
  type LinkyReplayRecordListResponse,
  type LinkyWebhookLogListResponse,
  type McnIncomeControlledChangesResponse,
  type McnIncomeControlledReconciliationResponse,
  type McnIncomeSyncStatusResponse,
  type McnIncomeShadowLedgerSummaryResponse,
  type McnIncomeDataQualityResponse,
  type McnIncomeDataQualityExceptionResponse,
  type McnIncomeRewardCandidateItemResponse,
  type McnIncomeRewardCandidateSampleResponse,
  type McnIncomeRewardCandidateSummaryResponse,
  type CommissionPolicyResponse,
  type MentorIncentiveDashboardResponse,
  type MentorAssignedStudentResponse,
  type OperatingDividendDashboardResponse,
  type TeamManagementDashboardResponse,
  type TeamManagementItemResponse,
  type TeamManagementMemberResponse,
  type UserGradeDashboardResponse,
  type EffectiveUserQualificationResponse,
  type UserGradeLevelDashboardResponse,
  type UserGradeAdvancementReviewResponse,
  type TokenPointConversionDashboardResponse,
  type UserPointDashboardResponse,
  type OverviewReportResponse,
  type OwnershipDetailResponse,
  type PhoneVerificationCodeListResponse,
  type PlatformIntegrationResponse,
  type PlatformGuildCompanyShareRuleResponse,
  type PlatformGuildDirectoryItem,
  type PlatformGuildDirectorySyncRun,
  type PlatformBindingResponse,
  type PlatformVerificationMockResponse,
  type PlatformVerificationRuntimeResponse,
  type ProfileResponse,
  type RelationDetailResponse,
  type RewardListResponse,
  type RewardSummaryResponse,
  type RiskEventListResponse,
  type SeedInviterResponse,
  type SeedInviterListResponse,
  type UserPlatformProfileListResponse,
  type TeamListResponse,
  type TeamWeeklyIncomeResponse,
  type WithdrawHistoryListResponse,
  type WithdrawRequestResponse,
  verifyPlatformBinding,
} from './api'
import {
  buildLinkyReplaySummary,
  buildLinkyWebhookSummary,
  buildPagedResultLabel,
} from './linkyConsole'
import {
  buildLinkyRelatedContext,
  buildLinkyReplayDetailSections,
  buildLinkyWebhookDetailSections,
  buildLinkyWebhookHeadline,
} from './linkyDetails'
void buildLinkyReplaySummary
void buildLinkyWebhookSummary
import {
  buildAdminSectionLinks,
  buildEmptyStatePreset,
  buildLinkyDiagnosticSnapshot,
  deleteNamedFilterView,
  saveNamedFilterView,
  type NamedFilterView,
} from './opsConsole'
import { buildChannelEntryLinks } from './publicEntries'

type SessionState = {
  userId: number
  inviteCode: string
  countryCode: string
  languageCode: string
  accessToken: string
}

type AdminAuthState = {
  sessionToken: string
  expiresAt: string
  username: string
  displayName: string
  role: string
  mustChangePassword?: boolean
  rememberMe?: boolean
  passwordExpiresAt?: string | null
  platformScope?: string
  guildScope?: string
  regionScope?: string
}

type AdminProductKey = 'ALL' | 'LINKY' | 'TIMO'
type AdminSettingsView = 'experiment' | 'guilds' | 'platforms' | 'incomeControlled' | 'incomeShadow' | 'mockVerification' | 'advanced' | 'seedInviter' | 'phoneVerification'
type AdminAccountView = 'security' | 'staff' | 'audit'
type AdminSectionKey = 'overview' | 'channel' | 'bindings' | 'riskQueue' | 'users' | 'platformGuildDirectory' | 'rewards' | 'commissionPolicies' | 'mentorDirectory' | 'mentorIncentives' | 'teams' | 'operatingDividends' | 'userGrades' | 'userGradeList' | 'advancedGradeAcceptance' | 'userGradeFacts' | 'tokenPointConversions' | 'accounts' | 'accountManagement' | 'mySecurity' | 'securityRecords' | 'settings' | 'systemExperiment' | 'systemGuilds' | 'systemPlatforms' | 'systemIncomeControlled' | 'systemIncomeShadow' | 'systemMockVerification' | 'systemAdvanced' | 'systemSeedInviter' | 'systemPhoneVerification'
type RiskActionName = 'HANDLE' | 'IGNORE' | 'FREEZE_USER' | 'UNFREEZE_USER'
type WithdrawActionName = 'approve' | 'reject' | 'paid' | 'failed' | 'reverse'
type WithdrawQuery = { userId: string; status: string; page: string; size: string }
type RiskQuery = { userId: string; riskStatus: string; startAt: string; endAt: string; page: string; size: string }
type PendingBatchAction =
  | { kind: 'withdraw'; action: 'APPROVE' | 'REJECT'; targetIds: string[] }
  | { kind: 'risk'; action: 'HANDLE' | 'IGNORE'; targetIds: number[] }

const ADMIN_SECTION_HASHES: Record<AdminSectionKey, string> = {
  overview: '#admin-overview',
  channel: '#admin-channel-entries',
  bindings: '#admin-bindings',
  riskQueue: '#admin-risk-queue',
  users: '#admin-users',
  platformGuildDirectory: '#admin-platform-guild-directory',
  rewards: '#admin-rewards',
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
}

const USER_GRADE_CATALOG = [
  { grade: '普通成员', condition: '注册加入，无须购买课程。', responsibility: '了解基础邀请规则；可参与业务并获得符合规则的个人推荐奖励。', referral: '直邀 10% / 间邀 3%', team: '暂不发放' },
  { grade: '新星', condition: '累计直接推荐 3 名有效用户。', responsibility: '获得新星身份标识，可参加免费带人训练与集体复盘。', referral: '直邀 10% / 间邀 3%', team: '暂不发放' },
  { grade: '银牌', condition: '累计直接推荐 10 名有效用户。', responsibility: '保留新星权益；每月接受一次真实案例小组指导。', referral: '直邀 10% / 间邀 3%', team: '暂不发放' },
  { grade: '金牌', condition: '累计直接推荐 30 名有效用户。', responsibility: '自动建立团队、授予团长权限与培养资格；可培养 1–2 名成员。并不等同于经营分红资格。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
  { grade: '铂金', condition: '金牌基础上，实际培养 2 名银牌成员；两个小组各完成 30 天试运营验收。', responsibility: '承担实际培养、小组经营与验收责任，需经过运营复核。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
  { grade: '钻石', condition: '铂金基础上，实际培养 2 名金牌成员；相关团队连续 2 个完整自然月完成经营验收。', responsibility: '获得多团队经营视图并承担负责人培养支持，需经过运营复核。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
  { grade: '黑金', condition: '钻石基础上，实际培养 2 名钻石成员；负责业务连续 3 个完整自然月完成经营验收。', responsibility: '具备区域经营试点候选资格及更深度的公司协作责任，需经过运营复核。', referral: '直邀 10% / 间邀 3%', team: '暂不发放；团队经营奖励全局关闭' },
] as const

const SYSTEM_CONFIG_SECTION_VIEWS: Partial<Record<AdminSectionKey, AdminSettingsView>> = {
  systemExperiment: 'experiment',
  systemGuilds: 'guilds',
  systemPlatforms: 'platforms',
  systemIncomeControlled: 'incomeControlled',
  systemIncomeShadow: 'incomeShadow',
  systemMockVerification: 'mockVerification',
  systemAdvanced: 'advanced',
  systemSeedInviter: 'seedInviter',
  systemPhoneVerification: 'phoneVerification',
}

function getVisibleFinanceSections(role?: string): AdminSectionKey[] {
  const normalizedRole = role?.toLowerCase()
  if (normalizedRole === 'super_admin' || normalizedRole === 'admin' || !normalizedRole) return ['rewards', 'commissionPolicies', 'tokenPointConversions']
  if (normalizedRole === 'finance') return ['rewards', 'commissionPolicies']
  if (normalizedRole === 'operations') return ['tokenPointConversions']
  return []
}

const SYSTEM_MANAGEMENT_SECTION_VIEWS: Partial<Record<AdminSectionKey, AdminAccountView>> = {
  accountManagement: 'staff',
  mySecurity: 'security',
  securityRecords: 'audit',
}

function resolveAdminSectionFromHash(hash?: string): AdminSectionKey {
  const normalized = hash || '#admin-overview'
  if (normalized === '#admin-mentor-incentives') return 'mentorDirectory'
  if (normalized === '#admin-operating-dividends') return 'teams'
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

type PendingRiskAction = {
  riskEventId: number
  userId: number
  riskStatus: string
  action: RiskActionName
  note: string
}

type PendingWithdrawAction = {
  requestNo: string
  userId: number
  requestedDiamondAmount: number
  requestStatus: string
  action: WithdrawActionName
}

type PendingAdminAccountAction = {
  account: AdminAccountResponse
  action: 'save' | 'toggle' | 'reset' | 'unlock'
}

type PendingRelationChange = {
  userId: number
  previousInviterId: number | null
  nextInviterId: number | null
  previousLevel2InviterId: number | null
  previousLevel3InviterId: number | null
  note: string
}

type ConsoleAppProps = {
  initialViewMode?: 'user' | 'admin'
  initialAdminSession?: AdminAuthState | null
}

type SelectedLinkyDrawer =
  | { kind: 'webhook'; item: LinkyWebhookLogListResponse['items'][number] }
  | { kind: 'replay'; item: LinkyReplayRecordListResponse['items'][number] }

const STORAGE_KEY = 'fenxiao-web-session'
const PROFILE_CREATE_TOKEN_KEY = 'fenxiao-profile-create-token'
const EXTERNAL_LOCALE_KEY = 'fenxiao-external-locale'
const ADMIN_REWARD_QUERY_KEY = 'fenxiao-admin-reward-query'
const ADMIN_WITHDRAW_QUERY_KEY = 'fenxiao-admin-withdraw-query'
const RISK_QUERY_KEY = 'fenxiao-admin-risk-query'
const ADMIN_WITHDRAW_VIEWS_KEY = 'fenxiao-admin-withdraw-views'
const RISK_VIEWS_KEY = 'fenxiao-admin-risk-views'
const LINKY_WEBHOOK_QUERY_KEY = 'fenxiao-linky-webhook-query'
const LINKY_REPLAY_QUERY_KEY = 'fenxiao-linky-replay-query'
const ADMIN_PRODUCT_OPTIONS: Array<{ value: AdminProductKey; label: string }> = [
  { value: 'ALL', label: '全部产品' },
  { value: 'LINKY', label: 'Linky' },
  { value: 'TIMO', label: 'Timo（影子接入）' },
]
const ADMIN_ROLE_OPTIONS = [
  { value: 'super_admin', label: '最高管理员' }, { value: 'admin', label: '管理员' },
  { value: 'operations', label: '运营' }, { value: 'operator', label: '操作员' },
  { value: 'finance', label: '财务' }, { value: 'customer_support', label: '客服' },
  { value: 'mentor', label: '导师' }, { value: 'team_leader', label: '团队负责人' },
]

function loadExternalLocale(): 'zh' | 'en' | 'es' | 'id' | 'pt' {
  if (typeof window === 'undefined') return 'zh'
  const value = window.localStorage.getItem(EXTERNAL_LOCALE_KEY)
  if (value === 'zh' || value === 'en' || value === 'es' || value === 'id' || value === 'pt') return value
  return 'zh'
}

function loadJsonState<T>(key: string): T | null {
  const storage = typeof window !== 'undefined'
    ? window.localStorage
    : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null
  const raw = storage?.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function loadPlainState(key: string): string {
  const storage = typeof window !== 'undefined'
    ? window.localStorage
    : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null
  return storage?.getItem(key) || ''
}

function saveUserSession(profile: ProfileResponse) {
  const session: SessionState = {
    userId: profile.userId,
    inviteCode: profile.inviteCode,
    countryCode: profile.countryCode,
    languageCode: profile.languageCode,
    accessToken: profile.accessToken,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

function ConsoleApp({ initialViewMode = 'user', initialAdminSession = null }: ConsoleAppProps) {
  void initialViewMode
  const shouldRestoreAdminSession = !initialAdminSession && typeof window !== 'undefined'
    && (window.location.pathname === '/' || window.location.pathname.startsWith('/admin'))
  const [session, setSession] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [adminSession, setAdminSession] = useState<AdminAuthState | null>(initialAdminSession)
  const [adminSessionRestoring, setAdminSessionRestoring] = useState(shouldRestoreAdminSession)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminRememberMe, setAdminRememberMe] = useState(true)
  const [adminAccounts, setAdminAccounts] = useState<AdminAccountResponse[]>([])
  const [adminDevices, setAdminDevices] = useState<AdminDeviceSessionResponse[]>([])
  const [adminSecurityEvents, setAdminSecurityEvents] = useState<AdminSecurityEventResponse[]>([])
  const [adminTemporaryPassword, setAdminTemporaryPassword] = useState('')
  const [pendingAdminAccountAction, setPendingAdminAccountAction] = useState<PendingAdminAccountAction | null>(null)
  const [adminAccountForm, setAdminAccountForm] = useState({ username: '', displayName: '', role: 'operator', platformScope: '*', guildScope: '*', regionScope: '*' })
  const [adminPasswordForm, setAdminPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [adminProduct, setAdminProduct] = useState<AdminProductKey>('ALL')
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSectionKey>(() => resolveAdminSectionFromHash(typeof window !== 'undefined' ? window.location.hash : undefined))
  const [isUserGradeNavOpen, setIsUserGradeNavOpen] = useState(() => ['userGradeList', 'advancedGradeAcceptance', 'userGradeFacts'].includes(resolveAdminSectionFromHash(typeof window !== 'undefined' ? window.location.hash : undefined)))
  const [isUserManagementNavOpen, setIsUserManagementNavOpen] = useState(() => ['users', 'bindings', 'riskQueue'].includes(resolveAdminSectionFromHash(typeof window !== 'undefined' ? window.location.hash : undefined)))
  const [isFinanceManagementNavOpen, setIsFinanceManagementNavOpen] = useState(() => ['rewards', 'commissionPolicies', 'tokenPointConversions'].includes(resolveAdminSectionFromHash(typeof window !== 'undefined' ? window.location.hash : undefined)))
  const [isSystemConfigNavOpen, setIsSystemConfigNavOpen] = useState(() => ['settings', 'systemExperiment', 'systemGuilds', 'systemPlatforms', 'systemIncomeControlled', 'systemIncomeShadow', 'systemMockVerification', 'systemAdvanced', 'systemSeedInviter', 'systemPhoneVerification'].includes(resolveAdminSectionFromHash(typeof window !== 'undefined' ? window.location.hash : undefined)))
  const [isSystemManagementNavOpen, setIsSystemManagementNavOpen] = useState(() => ['accounts', 'accountManagement', 'mySecurity', 'securityRecords'].includes(resolveAdminSectionFromHash(typeof window !== 'undefined' ? window.location.hash : undefined)))
  const [showAdvancedOps, setShowAdvancedOps] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [adminOverview, setAdminOverview] = useState<OverviewReportResponse | null>(null)
  const [adminRewards, setAdminRewards] = useState<RewardListResponse | null>(null)
  const [adminWithdrawRequests, setAdminWithdrawRequests] = useState<AdminWithdrawRequestListResponse | null>(null)
  const [riskEvents, setRiskEvents] = useState<RiskEventListResponse | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogListResponse | null>(null)
  const [phoneVerificationCodes, setPhoneVerificationCodes] = useState<PhoneVerificationCodeListResponse | null>(null)
  const [phoneVerificationAuditLogs, setPhoneVerificationAuditLogs] = useState<AuditLogListResponse | null>(null)
  const [revealedPhoneVerificationCodes, setRevealedPhoneVerificationCodes] = useState<Record<number, string>>({})
  const [adminOwnership, setAdminOwnership] = useState<OwnershipDetailResponse | null>(null)
  const [adminRelation, setAdminRelation] = useState<RelationDetailResponse | null>(null)
  const [linkyWebhookLogs, setLinkyWebhookLogs] = useState<LinkyWebhookLogListResponse | null>(null)
  const [linkyReplayRecords, setLinkyReplayRecords] = useState<LinkyReplayRecordListResponse | null>(null)
  const [hasQueriedAdminRewards, setHasQueriedAdminRewards] = useState(false)
  const [hasQueriedRiskEvents, setHasQueriedRiskEvents] = useState(false)
  const [hasQueriedLinkyWebhookLogs, setHasQueriedLinkyWebhookLogs] = useState(false)
  const [hasQueriedLinkyReplayRecords, setHasQueriedLinkyReplayRecords] = useState(false)
  const [linkyWebhookLoading, setLinkyWebhookLoading] = useState(false)
  const [linkyReplayLoading, setLinkyReplayLoading] = useState(false)
  const [form, setForm] = useState({
    userId: session?.userId?.toString() ?? '',
    countryCode: session?.countryCode ?? 'ID',
    languageCode: session?.languageCode ?? 'id',
    inviteCode: '',
  })
  const [adminRewardQuery, setAdminRewardQuery] = useState(() => loadJsonState<{ beneficiaryUserId: string; status: string; startAt: string; endAt: string; page: string; size: string }>(ADMIN_REWARD_QUERY_KEY) || {
    beneficiaryUserId: '',
    status: '',
    startAt: '',
    endAt: '',
    page: '0',
    size: '10',
  })
  const [adminWithdrawQuery, setAdminWithdrawQuery] = useState(() => loadJsonState<WithdrawQuery>(ADMIN_WITHDRAW_QUERY_KEY) || {
    userId: '',
    status: 'PENDING_REVIEW',
    page: '0',
    size: '10',
  })
  const [adminWithdrawAction, setAdminWithdrawAction] = useState({
    remark: '',
    paymentChannel: 'MANUAL',
    paymentReference: '',
    evidenceUri: '',
    evidenceHash: '',
    failureReason: '',
    reversalReason: '',
    reversalCurrency: 'DIAMOND',
  })
  const [adminWithdrawActionLoadingNo, setAdminWithdrawActionLoadingNo] = useState<string | null>(null)
  const [adminWithdrawActionMessage, setAdminWithdrawActionMessage] = useState('')
  const [pendingWithdrawAction, setPendingWithdrawAction] = useState<PendingWithdrawAction | null>(null)
  const [adminFinanceView, setAdminFinanceView] = useState<'withdrawals' | 'rewards'>('withdrawals')
  const [selectedWithdrawRequestNo, setSelectedWithdrawRequestNo] = useState<string | null>(null)
  const [selectedWithdrawRequestNos, setSelectedWithdrawRequestNos] = useState<string[]>([])
  const [withdrawViews, setWithdrawViews] = useState(() => loadJsonState<NamedFilterView<WithdrawQuery>[]>(ADMIN_WITHDRAW_VIEWS_KEY) || [])
  const [withdrawViewName, setWithdrawViewName] = useState('')
  const [selectedWithdrawViewId, setSelectedWithdrawViewId] = useState('')
  const [platformIntegrations, setPlatformIntegrations] = useState<PlatformIntegrationResponse[] | null>(null)
  const [platformGuildShareDialogTarget, setPlatformGuildShareDialogTarget] = useState<{ platformCode: string; guildId: string; guildName: string } | null>(null)
  const [platformGuildShareRules, setPlatformGuildShareRules] = useState<PlatformGuildCompanyShareRuleResponse[]>([])
  const [platformGuildShareForm, setPlatformGuildShareForm] = useState({ rate: '', effectiveFrom: '' })
  const [platformVerificationRuntime, setPlatformVerificationRuntime] = useState<PlatformVerificationRuntimeResponse | null>(null)
  const [platformVerificationMocks, setPlatformVerificationMocks] = useState<PlatformVerificationMockResponse[] | null>(null)
  const [controlledIncomeForm, setControlledIncomeForm] = useState({ platformCode: 'LINKY', businessDate: '2026-09-11', pageSize: '200' })
  const [controlledIncomeResult, setControlledIncomeResult] = useState<McnIncomeControlledChangesResponse | null>(null)
  const [controlledIncomeReconciliation, setControlledIncomeReconciliation] = useState<McnIncomeControlledReconciliationResponse | null>(null)
  const [incomeSyncStatus, setIncomeSyncStatus] = useState<McnIncomeSyncStatusResponse | null>(null)
  const [controlledIncomeCursor, setControlledIncomeCursor] = useState<string | null>(null)
  const [controlledIncomeLastRequest, setControlledIncomeLastRequest] = useState<{ cursor: string | null; requestId: string } | null>(null)
  const [controlledIncomeLoading, setControlledIncomeLoading] = useState(false)
  const [incomeShadowForm, setIncomeShadowForm] = useState({ platformCode: 'TIMO', businessDate: '2026-09-11' })
  const [incomeShadowResult, setIncomeShadowResult] = useState<McnIncomeShadowLedgerSummaryResponse | null>(null)
  const [incomeDataQuality, setIncomeDataQuality] = useState<McnIncomeDataQualityResponse | null>(null)
  const [incomeDataQualityExceptions, setIncomeDataQualityExceptions] = useState<McnIncomeDataQualityExceptionResponse[]>([])
  const [incomeExceptionReviewTarget, setIncomeExceptionReviewTarget] = useState<McnIncomeDataQualityExceptionResponse | null>(null)
  const [incomeExceptionReviewForm, setIncomeExceptionReviewForm] = useState<{ reviewStatus: 'ACKNOWLEDGED' | 'IGNORED'; reviewNote: string }>({ reviewStatus: 'ACKNOWLEDGED', reviewNote: '' })
  const [isIncomeShadowReplayDialogOpen, setIsIncomeShadowReplayDialogOpen] = useState(false)
  const [incomeShadowReplayReason, setIncomeShadowReplayReason] = useState('')
  const [incomeRewardCandidateResult, setIncomeRewardCandidateResult] = useState<McnIncomeRewardCandidateSummaryResponse | null>(null)
  const [incomeRewardCandidateItems, setIncomeRewardCandidateItems] = useState<McnIncomeRewardCandidateItemResponse[]>([])
  const [incomeRewardCandidateSample, setIncomeRewardCandidateSample] = useState<McnIncomeRewardCandidateSampleResponse | null>(null)
  const [commissionPolicies, setCommissionPolicies] = useState<CommissionPolicyResponse[] | null>(null)
  const [mentorIncentiveDashboard, setMentorIncentiveDashboard] = useState<MentorIncentiveDashboardResponse | null>(null)
  const [isMentorRuleDialogOpen, setIsMentorRuleDialogOpen] = useState(false)
  const [isMentorRuleGuildPickerOpen, setIsMentorRuleGuildPickerOpen] = useState(false)
  const mentorRuleGuildPickerRef = useRef<HTMLDivElement>(null)
  const [isMentorQualificationDialogOpen, setIsMentorQualificationDialogOpen] = useState(false)
  const [mentorQualificationTarget, setMentorQualificationTarget] = useState<MentorIncentiveDashboardResponse['mentors'][number] | null>(null)
  const [mentorAssignmentTarget, setMentorAssignmentTarget] = useState<MentorIncentiveDashboardResponse['mentors'][number] | null>(null)
  const [mentorAssignedStudents, setMentorAssignedStudents] = useState<MentorAssignedStudentResponse[]>([])
  const [mentorAssignedStudentsLoading, setMentorAssignedStudentsLoading] = useState(false)
  const [mentorRuleForm, setMentorRuleForm] = useState({ milestoneCode: 'VALID_72H_START', platformCode: 'TIMO', countryCode: 'BR', guildIds: [] as string[], amountMinor: '', freezeDays: '7', effectiveFrom: '', effectiveTo: '' })
  const [mentorRuleGuildDirectory, setMentorRuleGuildDirectory] = useState<PlatformGuildDirectoryItem[] | null>(null)
  const [mentorRuleGuildDirectoryLoading, setMentorRuleGuildDirectoryLoading] = useState(false)
  const [mentorQualificationForm, setMentorQualificationForm] = useState({ userId: '', countryCode: 'BR', languageCode: 'pt-br', maxActiveStudents: '20' })
  const [mentorAssignmentForm, setMentorAssignmentForm] = useState({ studentUserId: '', mentorUserId: '', reason: '' })
  const [operatingDividendDashboard, setOperatingDividendDashboard] = useState<OperatingDividendDashboardResponse | null>(null)
  const [teamManagementDashboard, setTeamManagementDashboard] = useState<TeamManagementDashboardResponse | null>(null)
  const [teamMemberTarget, setTeamMemberTarget] = useState<TeamManagementItemResponse | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamManagementMemberResponse[]>([])
  const [teamOperatingProfitSharePermissionTarget, setTeamOperatingProfitSharePermissionTarget] = useState<{ team: TeamManagementItemResponse; enabled: boolean } | null>(null)
  const [teamMembersLoading, setTeamMembersLoading] = useState(false)
  const [userGradeDashboard, setUserGradeDashboard] = useState<UserGradeDashboardResponse | null>(null)
  const [effectiveUserPlatform, setEffectiveUserPlatform] = useState<'TIMO' | 'LINKY'>('TIMO')
  const [effectiveUserQualifications, setEffectiveUserQualifications] = useState<EffectiveUserQualificationResponse[]>([])
  const [effectiveUserCorrectionTarget, setEffectiveUserCorrectionTarget] = useState<EffectiveUserQualificationResponse | null>(null)
  const [effectiveUserCorrectionForm, setEffectiveUserCorrectionForm] = useState<{ correctionReason: 'FRAUD' | 'FAKE_INCOME' | 'FABRICATED_PERFORMANCE'; correctionNote: string }>({ correctionReason: 'FRAUD', correctionNote: '' })
  const [userGradeLevelDashboard, setUserGradeLevelDashboard] = useState<UserGradeLevelDashboardResponse | null>(null)
  const [userGradeAdvancementReviews, setUserGradeAdvancementReviews] = useState<UserGradeAdvancementReviewResponse[]>([])
  const [isUserGradeAdvancementDialogOpen, setIsUserGradeAdvancementDialogOpen] = useState(false)
  const [userGradeAdvancementForm, setUserGradeAdvancementForm] = useState({ userId: '', platformCode: 'TIMO', guildId: '', targetGradeCode: 'PLATINUM' })
  const [platinumEvidenceTarget, setPlatinumEvidenceTarget] = useState<UserGradeAdvancementReviewResponse | null>(null)
  const [platinumEvidenceForm, setPlatinumEvidenceForm] = useState({ traineeUserId: '', groupReference: '', observationStart: '', observationEnd: '', finalWeekEffectiveUserCount: '5', finalWeekMinIncomeDateCount: '3', evidenceNote: '' })
  const [isUserGradeLevelDialogOpen, setIsUserGradeLevelDialogOpen] = useState(false)
  const [userGradeLevelForm, setUserGradeLevelForm] = useState({ levelName: '', levelRank: '1', requiredPoints: '0', grantsTeamLeader: false, effectiveFrom: '', effectiveTo: '' })
  // Retained state is only needed to render historical records in old sessions;
  // this route is intentionally never exposed after the seven-grade cutover.
  const legacyPointGradeManagementVisible: boolean = false
  const [tokenPointConversionDashboard, setTokenPointConversionDashboard] = useState<TokenPointConversionDashboardResponse | null>(null)
  const [tokenPointConversionValues, setTokenPointConversionValues] = useState<Record<string, string>>({ TIMO: '', LINKY: '' })
  const [tokenPointConversionSaveTarget, setTokenPointConversionSaveTarget] = useState<{ platformCode: string; tokenUnit: string; pointsPerToken: string } | null>(null)
  const [userPointDashboard, setUserPointDashboard] = useState<UserPointDashboardResponse | null>(null)
  const [userPointPlatform, setUserPointPlatform] = useState<'TIMO' | 'LINKY'>('TIMO')
  const [userGradeEvaluationForm, setUserGradeEvaluationForm] = useState({ userId: '', platformCode: 'TIMO' })
  const [isOperatingDividendDialogOpen, setIsOperatingDividendDialogOpen] = useState(false)
  const [isOperatingDividendGuildPickerOpen, setIsOperatingDividendGuildPickerOpen] = useState(false)
  const operatingDividendGuildPickerRef = useRef<HTMLDivElement>(null)
  const [operatingDividendGuildDirectory, setOperatingDividendGuildDirectory] = useState<PlatformGuildDirectoryItem[] | null>(null)
  const [operatingDividendGuildDirectoryLoading, setOperatingDividendGuildDirectoryLoading] = useState(false)
  const [operatingDividendForm, setOperatingDividendForm] = useState({ platformCode: 'TIMO', countryCode: 'BR', guildIds: [] as string[], requiredValidStarts: '1', requiredWithdrawEligible: '0', requiredActive7d: '0', profitShareRate: '0.05', effectiveFrom: '', effectiveTo: '' })
  const [platformVerificationMockForm, setPlatformVerificationMockForm] = useState({
    platformCode: 'TIMO', platformUserId: '', globallySeenBeforeSubmission: false, joinedTargetGuild: true,
    officialGuildId: '22000448', officialJoinedAt: '', sourceReference: '', enabled: true,
  })
  const [experimentCode, setExperimentCode] = useState('BANDEIRA_V1_100')
  const [experimentDashboard, setExperimentDashboard] = useState<ExperimentDashboardResponse | null>(null)
  const [experimentForm, setExperimentForm] = useState({ name: 'BANDEIRA V1 100人实验', primaryMetricCode: 'FIRST_INCOME', enrollmentStartsAt: '', enrollmentEndsAt: '', observationEndsAt: '' })
  const [experimentParticipant, setExperimentParticipant] = useState({ userId: '', cohortCode: 'BR_LINKY', eligibilitySnapshot: '' })
  const [riskQuery, setRiskQuery] = useState(() => loadJsonState<RiskQuery>(RISK_QUERY_KEY) || {
    userId: '',
    riskStatus: 'PENDING',
    startAt: '',
    endAt: '',
    page: '0',
    size: '10',
  })
  const [linkyWebhookQuery, setLinkyWebhookQuery] = useState(() => loadJsonState<{ linkyOrderId: string; userId: string; requestStatus: string; page: string; size: string }>(LINKY_WEBHOOK_QUERY_KEY) || {
    linkyOrderId: '',
    userId: '',
    requestStatus: '',
    page: '0',
    size: '10',
  })
  const [linkyReplayQuery, setLinkyReplayQuery] = useState(() => loadJsonState<{ linkyOrderId: string; userId: string; page: string; size: string }>(LINKY_REPLAY_QUERY_KEY) || {
    linkyOrderId: '',
    userId: '',
    page: '0',
    size: '10',
  })
  const [auditQuery, setAuditQuery] = useState({
    moduleName: 'risk_event',
    page: '0',
    size: '5',
  })
  const [phoneVerificationQuery, setPhoneVerificationQuery] = useState({ phoneNumber: '', page: '0', size: '20' })
  const [seedInviterForm, setSeedInviterForm] = useState({ phoneNumber: '', countryCode: 'BR', languageCode: 'pt-br' })
  const [createdSeedInviter, setCreatedSeedInviter] = useState<SeedInviterResponse | null>(null)
  const [seedInviters, setSeedInviters] = useState<SeedInviterListResponse | null>(null)
  const [userPlatformProfiles, setUserPlatformProfiles] = useState<UserPlatformProfileListResponse | null>(null)
  const [userPlatformQuery, setUserPlatformQuery] = useState({ userId: '', page: '0', size: '20' })
  const [platformGuildDirectoryPlatform, setPlatformGuildDirectoryPlatform] = useState<'LINKY' | 'TIMO'>('LINKY')
  const [platformGuildDirectory, setPlatformGuildDirectory] = useState<PlatformGuildDirectoryItem[] | null>(null)
  const [platformGuildDirectorySyncRuns, setPlatformGuildDirectorySyncRuns] = useState<PlatformGuildDirectorySyncRun[] | null>(null)
  const [platformGuildDirectoryLoading, setPlatformGuildDirectoryLoading] = useState(false)
  const [linkyInvitationGuildOptions, setLinkyInvitationGuildOptions] = useState<PlatformGuildDirectoryItem[] | null>(null)
  const [linkyInvitationGuildOptionsLoading, setLinkyInvitationGuildOptionsLoading] = useState(false)
  const [linkyInvitationGuildOverride, setLinkyInvitationGuildOverride] = useState({ userId: '', guildId: '', guildName: '', guildInviteCode: '', reason: '' })
  const [isLinkyInvitationGuildDialogOpen, setIsLinkyInvitationGuildDialogOpen] = useState(false)
  const [riskActionDrafts, setRiskActionDrafts] = useState<Record<number, string>>({})
  const [selectedRiskEventIds, setSelectedRiskEventIds] = useState<number[]>([])
  const [riskViews, setRiskViews] = useState(() => loadJsonState<NamedFilterView<RiskQuery>[]>(RISK_VIEWS_KEY) || [])
  const [riskViewName, setRiskViewName] = useState('')
  const [selectedRiskViewId, setSelectedRiskViewId] = useState('')
  const [pendingRiskAction, setPendingRiskAction] = useState<PendingRiskAction | null>(null)
  const [pendingBatchAction, setPendingBatchAction] = useState<PendingBatchAction | null>(null)
  const [batchActionNote, setBatchActionNote] = useState('')
  const [batchActionLoading, setBatchActionLoading] = useState(false)
  const [batchActionResult, setBatchActionResult] = useState<BatchOperationResultResponse | null>(null)
  const [riskActionLoadingId, setRiskActionLoadingId] = useState<number | null>(null)
  const [selectedLinkyDrawer, setSelectedLinkyDrawer] = useState<SelectedLinkyDrawer | null>(null)
  const [ownershipQueryUserId, setOwnershipQueryUserId] = useState('')
  const [ownershipCorrectionProductCode, setOwnershipCorrectionProductCode] = useState('LINKY')
  const [ownershipCorrectionNote, setOwnershipCorrectionNote] = useState('')
  const [ownershipCorrectionLoading, setOwnershipCorrectionLoading] = useState(false)
  const [relationQueryUserId, setRelationQueryUserId] = useState('')
  const [linkyEligibilityAccount, setLinkyEligibilityAccount] = useState('')
  const [linkyEligibilityResult, setLinkyEligibilityResult] = useState<LinkyEligibilityCheckResponse | null>(null)
  const [linkyEligibilityLoading, setLinkyEligibilityLoading] = useState(false)
  const [linkyBatchRefreshResult, setLinkyBatchRefreshResult] = useState<LinkyBatchRefreshResponse | null>(null)
  const [linkyBatchRefreshLoading, setLinkyBatchRefreshLoading] = useState(false)
  const [guildWeeklyQuery, setGuildWeeklyQuery] = useState({ guildId: '', week: 'CURRENT' })
  const [guildWeeklyReport, setGuildWeeklyReport] = useState<GuildWeeklyReportResponse | null>(null)
  const [guildWeeklyLoading, setGuildWeeklyLoading] = useState(false)
  const [guildConfigs, setGuildConfigs] = useState<GuildConfigResponse[] | null>(null)
  const [guildConfigLoading, setGuildConfigLoading] = useState(false)
  const [guildConfigForm, setGuildConfigForm] = useState({
    productCode: 'LINKY',
    inviterUserId: '',
    guildId: '',
    guildName: '',
    guildInviteCode: '',
    enabled: true,
  })
  const [relationAdjustInviterId, setRelationAdjustInviterId] = useState('')
  const [relationAdjustNote, setRelationAdjustNote] = useState('')
  const [relationBeforeAdjust, setRelationBeforeAdjust] = useState<RelationDetailResponse | null>(null)
  const [pendingRelationChange, setPendingRelationChange] = useState<PendingRelationChange | null>(null)
  const [relationAdjustLoading, setRelationAdjustLoading] = useState(false)
  const [profileCreateToken, setProfileCreateToken] = useState(() => loadPlainState(PROFILE_CREATE_TOKEN_KEY))
  const [channelEntryForm, setChannelEntryForm] = useState({
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    country: form.countryCode || 'ID',
    language: form.languageCode || 'id',
    channel: 'whatsapp-main',
    inviteCode: form.inviteCode || session?.inviteCode || '',
  })

  const canLoadAdmin = useMemo(() => Boolean(adminSession), [adminSession])
  const canCreateProfile = useMemo(
    () => Boolean(profileCreateToken.trim() && form.userId.trim() && form.inviteCode.trim()),
    [profileCreateToken, form.userId, form.inviteCode],
  )
  const currentAdminProductLabel = ADMIN_PRODUCT_OPTIONS.find((item) => item.value === adminProduct)?.label ?? '全部产品'
  const canAuditPhoneVerification = adminSession?.role?.toLowerCase() === 'super_admin'
  const canManageSeedInviters = adminSession?.role?.toLowerCase() === 'super_admin'
  const canManagePlatformMocks = adminSession?.role?.toLowerCase() === 'super_admin'
  const canRunControlledIncome = ['super_admin', 'finance'].includes(adminSession?.role?.toLowerCase() ?? '')
  const canReadEffectiveUsers = ['super_admin', 'admin', 'operations', 'finance'].includes(adminSession?.role?.toLowerCase() ?? '')
  const canCorrectEffectiveUsers = adminSession?.role?.toLowerCase() === 'super_admin'
  const canManageMentorRules = ['super_admin', 'admin', 'finance'].includes(adminSession?.role?.toLowerCase() ?? '')
  const canManageMentorRelations = ['super_admin', 'admin', 'operations'].includes(adminSession?.role?.toLowerCase() ?? '')
  const canManageOperatingDividends = canRunControlledIncome
  const canManageTeams = ['super_admin', 'admin', 'operations'].includes(adminSession?.role?.toLowerCase() ?? '')
  const canManageLinkyInvitationGuild = ['super_admin', 'admin'].includes(adminSession?.role?.toLowerCase() ?? '')
  const linkyGuildOptions = useMemo(() => {
    return (linkyInvitationGuildOptions ?? [])
      .filter((item) => item.directoryStatus === 'NORMAL' && ['ACTIVE', 'ENABLED'].includes(item.guildStatus.toUpperCase()))
      .sort((left, right) => left.guildName.localeCompare(right.guildName))
  }, [linkyInvitationGuildOptions])
  const selectedLinkyInvitationGuildOption = linkyGuildOptions.find((item) => item.guildId === linkyInvitationGuildOverride.guildId) ?? null
  const mentorRuleGuildOptions = useMemo(() => (mentorRuleGuildDirectory ?? []).filter((item) => directoryCountryCode(item.country) === mentorRuleForm.countryCode && item.directoryStatus === 'NORMAL' && ['ACTIVE', 'ENABLED'].includes(item.guildStatus.toUpperCase())), [mentorRuleGuildDirectory, mentorRuleForm.countryCode])
  const operatingDividendGuildOptions = useMemo(() => (operatingDividendGuildDirectory ?? []).filter((item) => item.platformCode === operatingDividendForm.platformCode && directoryCountryCode(item.country) === operatingDividendForm.countryCode && item.directoryStatus === 'NORMAL' && ['ACTIVE', 'ENABLED'].includes(item.guildStatus.toUpperCase())), [operatingDividendGuildDirectory, operatingDividendForm.platformCode, operatingDividendForm.countryCode])
  const seedInviterCountry = phoneCountries.find((country) => country.countryCode === seedInviterForm.countryCode) ?? phoneCountries[0]
  const activeAdminProductCode = adminProduct === 'ALL' ? undefined : adminProduct
  const adminSectionLinks = useMemo(() => buildAdminSectionLinks(adminSession?.role), [adminSession?.role])
  const visibleFinanceSections = useMemo(() => getVisibleFinanceSections(adminSession?.role), [adminSession?.role])
  const canViewAdminSection = (section: AdminSectionKey) => adminSectionLinks.some((item) => item.href === ADMIN_SECTION_HASHES[section])
  const currentSettingsView = SYSTEM_CONFIG_SECTION_VIEWS[activeAdminSection] ?? (activeAdminSection === 'settings' ? 'experiment' : null)
  const isSystemConfigSection = activeAdminSection === 'settings' || currentSettingsView !== null
  const currentAccountView = SYSTEM_MANAGEMENT_SECTION_VIEWS[activeAdminSection] ?? (activeAdminSection === 'accounts' ? 'security' : null)
  const isSystemManagementSection = activeAdminSection === 'accounts' || currentAccountView !== null
  const isFinanceManagementSection = ['rewards', 'commissionPolicies', 'tokenPointConversions'].includes(activeAdminSection)
  const showingProductSpecificDiagnostics = adminProduct === 'LINKY'
  const channelEntryLinks = useMemo(
    () => buildChannelEntryLinks(channelEntryForm.origin, {
      product: adminProduct,
      country: channelEntryForm.country,
      language: channelEntryForm.language,
      channel: channelEntryForm.channel,
      inviteCode: channelEntryForm.inviteCode,
    }),
    [adminProduct, channelEntryForm],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const syncSection = () => setActiveAdminSection(resolveAdminSectionFromHash(window.location.hash))
    syncSection()
    window.addEventListener('hashchange', syncSection)
    return () => window.removeEventListener('hashchange', syncSection)
  }, [])

  useEffect(() => {
    const isVisibleUserGradeChild = ['userGradeList', 'advancedGradeAcceptance', 'userGradeFacts'].includes(activeAdminSection) && adminSectionLinks.some((item) => item.href === ADMIN_SECTION_HASHES.userGradeList)
    const isVisibleUserManagementChild = ['users', 'bindings', 'riskQueue'].includes(activeAdminSection) && adminSectionLinks.some((item) => item.href === ADMIN_SECTION_HASHES.users)
    const isVisibleFinanceManagementChild = visibleFinanceSections.includes(activeAdminSection)
    const isVisibleSystemConfigChild = currentSettingsView !== null && adminSectionLinks.some((item) => item.href === ADMIN_SECTION_HASHES.settings)
    const isVisibleSystemManagementChild = currentAccountView !== null && adminSectionLinks.some((item) => item.href === ADMIN_SECTION_HASHES.accounts)
    if (!adminSession || isVisibleUserGradeChild || isVisibleUserManagementChild || isVisibleFinanceManagementChild || isVisibleSystemConfigChild || isVisibleSystemManagementChild || adminSectionLinks.some((item) => item.href === ADMIN_SECTION_HASHES[activeAdminSection])) return
    window.location.hash = ADMIN_SECTION_HASHES.overview
  }, [activeAdminSection, adminSectionLinks, adminSession, currentAccountView, currentSettingsView, visibleFinanceSections])

  useEffect(() => {
    if (!error && !successMessage) return undefined
    const timeout = window.setTimeout(() => {
      setError('')
      setSuccessMessage('')
    }, error ? 8000 : 6000)
    return () => window.clearTimeout(timeout)
  }, [error, successMessage])

  useEffect(() => {
    if (!isMentorRuleGuildPickerOpen) return undefined
    const closeWhenClickingOutside = (event: MouseEvent) => {
      if (!mentorRuleGuildPickerRef.current?.contains(event.target as Node)) setIsMentorRuleGuildPickerOpen(false)
    }
    document.addEventListener('mousedown', closeWhenClickingOutside)
    return () => document.removeEventListener('mousedown', closeWhenClickingOutside)
  }, [isMentorRuleGuildPickerOpen])

  useEffect(() => {
    if (!isOperatingDividendGuildPickerOpen) return undefined
    const closeWhenClickingOutside = (event: MouseEvent) => {
      if (!operatingDividendGuildPickerRef.current?.contains(event.target as Node)) setIsOperatingDividendGuildPickerOpen(false)
    }
    document.addEventListener('mousedown', closeWhenClickingOutside)
    return () => document.removeEventListener('mousedown', closeWhenClickingOutside)
  }, [isOperatingDividendGuildPickerOpen])

  useEffect(() => {
    if (!shouldRestoreAdminSession) return
    let cancelled = false
    void getCurrentAdminSession()
      .then((restored) => { if (!cancelled) setAdminSession(restored) })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setAdminSessionRestoring(false) })
    return () => { cancelled = true }
  }, [shouldRestoreAdminSession])

  useEffect(() => {
    localStorage.setItem(ADMIN_REWARD_QUERY_KEY, JSON.stringify(adminRewardQuery))
  }, [adminRewardQuery])

  useEffect(() => {
    localStorage.setItem(ADMIN_WITHDRAW_QUERY_KEY, JSON.stringify(adminWithdrawQuery))
  }, [adminWithdrawQuery])

  useEffect(() => {
    localStorage.setItem(RISK_QUERY_KEY, JSON.stringify(riskQuery))
  }, [riskQuery])

  useEffect(() => {
    localStorage.setItem(ADMIN_WITHDRAW_VIEWS_KEY, JSON.stringify(withdrawViews))
  }, [withdrawViews])

  useEffect(() => {
    localStorage.setItem(RISK_VIEWS_KEY, JSON.stringify(riskViews))
  }, [riskViews])

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined'
      || new URLSearchParams(window.location.search).get('adminData') !== 'stress') return
    let cancelled = false
    void import('./adminStressFixtures').then(({ buildAdminStressRiskEvents, buildAdminStressWithdrawRequests }) => {
      if (cancelled) return
      setAdminWithdrawRequests(buildAdminStressWithdrawRequests())
      setRiskEvents(buildAdminStressRiskEvents())
      setHasQueriedRiskEvents(true)
      setSelectedWithdrawRequestNo((current) => current || buildAdminStressWithdrawRequests().items[0]?.requestNo || null)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    localStorage.setItem(LINKY_WEBHOOK_QUERY_KEY, JSON.stringify(linkyWebhookQuery))
  }, [linkyWebhookQuery])

  useEffect(() => {
    localStorage.setItem(LINKY_REPLAY_QUERY_KEY, JSON.stringify(linkyReplayQuery))
  }, [linkyReplayQuery])

  useEffect(() => {
    // Product switching intentionally clears product-scoped admin caches in one render cycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminOverview(null)
    setAdminRewards(null)
    setAdminWithdrawRequests(null)
    setRiskEvents(null)
    setAdminOwnership(null)
    setAdminRelation(null)
    setLinkyEligibilityResult(null)
    setLinkyBatchRefreshResult(null)
    setLinkyWebhookLogs(null)
    setLinkyReplayRecords(null)
    setHasQueriedAdminRewards(false)
    setHasQueriedRiskEvents(false)
    setHasQueriedLinkyWebhookLogs(false)
    setHasQueriedLinkyReplayRecords(false)
  }, [adminProduct])

  async function loadAdminRewards(query = adminRewardQuery) {
    if (!adminSession) return
    setLoading(true)
    setError('')
    try {
      const result = await getAdminRewards(adminSession.sessionToken, {
        beneficiaryUserId: query.beneficiaryUserId ? Number(query.beneficiaryUserId) : undefined,
        status: query.status || undefined,
        product: activeAdminProductCode,
        startAt: query.startAt || undefined,
        endAt: query.endAt || undefined,
        page: Number(query.page || 0),
        size: Number(query.size || 10),
      })
      setAdminRewards(result)
      setHasQueriedAdminRewards(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载奖励列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadAdminWithdrawRequests(query = adminWithdrawQuery) {
    if (!adminSession) return
    setLoading(true)
    setError('')
    try {
      const result = await getAdminWithdrawRequests(adminSession.sessionToken, {
        userId: query.userId ? Number(query.userId) : undefined,
        status: query.status || undefined,
        page: Number(query.page || 0),
        size: Number(query.size || 10),
      })
      setAdminWithdrawRequests(result)
      setSelectedWithdrawRequestNos([])
      setSelectedWithdrawRequestNo((current) => result.items.some((item) => item.requestNo === current) ? current : result.items[0]?.requestNo ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载提现申请失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdminWithdrawAction(requestNo: string, action: WithdrawActionName) {
    if (!adminSession) return
    setAdminWithdrawActionLoadingNo(requestNo)
    setError('')
    setAdminWithdrawActionMessage('')
    try {
      if (action === 'approve') {
        await approveWithdrawForPayment(adminSession.sessionToken, requestNo, adminWithdrawAction.remark.trim() || '财务审核通过，等待打款')
      } else if (action === 'reject') {
        await rejectAdminWithdrawRequest(adminSession.sessionToken, requestNo, { remark: adminWithdrawAction.remark.trim() || '财务拒绝提现申请' })
      } else if (action === 'paid') {
        await recordWithdrawPayment(adminSession.sessionToken, requestNo, {
          paymentChannel: adminWithdrawAction.paymentChannel.trim(), paymentReference: adminWithdrawAction.paymentReference.trim(),
          evidenceUri: adminWithdrawAction.evidenceUri.trim(), evidenceHash: adminWithdrawAction.evidenceHash.trim(),
        }, true)
      } else if (action === 'failed') {
        await recordWithdrawPayment(adminSession.sessionToken, requestNo, {
          paymentChannel: adminWithdrawAction.paymentChannel.trim(), paymentReference: adminWithdrawAction.paymentReference.trim(),
          evidenceUri: adminWithdrawAction.evidenceUri.trim(), evidenceHash: adminWithdrawAction.evidenceHash.trim(),
          failureReason: adminWithdrawAction.failureReason.trim() || '打款失败，等待重试',
        }, false)
      } else {
        await reverseWithdrawPayment(adminSession.sessionToken, requestNo, {
          reason: adminWithdrawAction.reversalReason.trim(),
          currencyCode: adminWithdrawAction.reversalCurrency.trim().toUpperCase(),
        })
      }
      const labels = { approve: '已进入待打款', reject: '已拒绝', paid: '已确认打款', failed: '已记录打款失败', reverse: '已创建冲正账目' }
      setAdminWithdrawActionMessage(`${labels[action]} ${requestNo}`)
      setPendingWithdrawAction(null)
      setAdminWithdrawAction({ remark: '', paymentChannel: 'MANUAL', paymentReference: '', evidenceUri: '', evidenceHash: '', failureReason: '', reversalReason: '', reversalCurrency: 'DIAMOND' })
      await loadAdminWithdrawRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理提现申请失败')
    } finally {
      setAdminWithdrawActionLoadingNo(null)
    }
  }

  function openWithdrawActionConfirm(item: AdminWithdrawRequestListResponse['items'][number], action: WithdrawActionName) {
    setPendingWithdrawAction({
      requestNo: item.requestNo,
      userId: item.userId,
      requestedDiamondAmount: item.requestedDiamondAmount,
      requestStatus: item.requestStatus,
      action,
    })
  }

  function selectWithdrawRequest(requestNo: string) {
    if (requestNo === selectedWithdrawRequestNo) return
    setSelectedWithdrawRequestNo(requestNo)
    setAdminWithdrawActionMessage('')
    setAdminWithdrawAction({ remark: '', paymentChannel: 'MANUAL', paymentReference: '', evidenceUri: '', evidenceHash: '', failureReason: '', reversalReason: '', reversalCurrency: 'DIAMOND' })
  }

  async function handleWithdrawPageChange(nextPage: number) {
    if (nextPage < 0) return
    const nextQuery = { ...adminWithdrawQuery, page: String(nextPage) }
    setAdminWithdrawQuery(nextQuery)
    await loadAdminWithdrawRequests(nextQuery)
  }

  function resetWithdrawFilters() {
    setAdminWithdrawQuery({ userId: '', status: 'PENDING_REVIEW', page: '0', size: '10' })
    setAdminWithdrawRequests(null)
    setSelectedWithdrawRequestNo(null)
    setSelectedWithdrawRequestNos([])
    setAdminWithdrawActionMessage('')
  }

  function renderAdminWithdrawActions(item: AdminWithdrawRequestListResponse['items'][number]) {
    const busy = !canLoadAdmin || adminWithdrawActionLoadingNo === item.requestNo
    if (item.requestStatus === 'PENDING_REVIEW') return (
      <div className="table-toolbar compact-toolbar">
        <button className="primary-btn small-btn" onClick={() => openWithdrawActionConfirm(item, 'approve')} disabled={busy}>{busy ? '处理中…' : '通过审核'}</button>
        <button className="ghost-btn small-btn" onClick={() => openWithdrawActionConfirm(item, 'reject')} disabled={busy || !adminWithdrawAction.remark.trim()}>拒绝</button>
      </div>
    )
    if (item.requestStatus === 'PAYMENT_PENDING' || item.requestStatus === 'PAYMENT_FAILED') return (
      <div className="table-toolbar compact-toolbar">
        <button className="primary-btn small-btn" onClick={() => openWithdrawActionConfirm(item, 'paid')} disabled={busy || !adminWithdrawAction.paymentChannel.trim() || !adminWithdrawAction.paymentReference.trim()}>{busy ? '处理中…' : '确认已打款'}</button>
        {item.requestStatus === 'PAYMENT_PENDING' ? <button className="ghost-btn small-btn" onClick={() => openWithdrawActionConfirm(item, 'failed')} disabled={busy || !adminWithdrawAction.paymentChannel.trim() || !adminWithdrawAction.failureReason.trim()}>标记失败</button> : null}
      </div>
    )
    if (item.requestStatus === 'PAID_OUT') return (
      <button className="ghost-btn small-btn" onClick={() => openWithdrawActionConfirm(item, 'reverse')} disabled={busy || !adminWithdrawAction.reversalReason.trim() || !adminWithdrawAction.reversalCurrency.trim()}>发起冲正</button>
    )
    return <span className="subtext">已终结</span>
  }

  function saveWithdrawView() {
    try {
      const next = saveNamedFilterView(withdrawViews, withdrawViewName, { ...adminWithdrawQuery, page: '0' })
      setWithdrawViews(next)
      setSelectedWithdrawViewId(next[0].id)
      setWithdrawViewName('')
      setSuccessMessage(`已保存个人筛选视图“${next[0].name}”`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存筛选视图失败')
    }
  }

  function applyWithdrawView(viewId: string) {
    setSelectedWithdrawViewId(viewId)
    const view = withdrawViews.find((item) => item.id === viewId)
    if (!view) return
    setAdminWithdrawQuery({ ...view.query, page: '0' })
    setAdminWithdrawRequests(null)
    setSelectedWithdrawRequestNo(null)
    setSelectedWithdrawRequestNos([])
  }

  function removeWithdrawView() {
    if (!selectedWithdrawViewId) return
    setWithdrawViews(deleteNamedFilterView(withdrawViews, selectedWithdrawViewId))
    setSelectedWithdrawViewId('')
  }

  function saveRiskView() {
    try {
      const next = saveNamedFilterView(riskViews, riskViewName, { ...riskQuery, page: '0' })
      setRiskViews(next)
      setSelectedRiskViewId(next[0].id)
      setRiskViewName('')
      setSuccessMessage(`已保存个人筛选视图“${next[0].name}”`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存筛选视图失败')
    }
  }

  function applyRiskView(viewId: string) {
    setSelectedRiskViewId(viewId)
    const view = riskViews.find((item) => item.id === viewId)
    if (!view) return
    setRiskQuery({ ...view.query, page: '0' })
    setRiskEvents(null)
    setHasQueriedRiskEvents(false)
    setSelectedRiskEventIds([])
  }

  function removeRiskView() {
    if (!selectedRiskViewId) return
    setRiskViews(deleteNamedFilterView(riskViews, selectedRiskViewId))
    setSelectedRiskViewId('')
  }

  async function handleBatchAction() {
    if (!adminSession || !pendingBatchAction) return
    if ((pendingBatchAction.action === 'REJECT' || pendingBatchAction.action === 'IGNORE') && !batchActionNote.trim()) {
      setError('批量拒绝或忽略必须填写统一原因。')
      return
    }
    setBatchActionLoading(true)
    setError('')
    try {
      const result = pendingBatchAction.kind === 'withdraw'
        ? await applyAdminWithdrawBatchAction(adminSession.sessionToken, {
            requestNos: pendingBatchAction.targetIds,
            action: pendingBatchAction.action,
            remark: batchActionNote.trim() || undefined,
          })
        : await applyAdminRiskEventBatchAction(adminSession.sessionToken, {
            riskEventIds: pendingBatchAction.targetIds,
            action: pendingBatchAction.action,
            note: batchActionNote.trim() || undefined,
          })
      setBatchActionResult(result)
      setSuccessMessage(`批量操作完成：成功 ${result.successCount} 条，失败 ${result.failureCount} 条。`)
      if (pendingBatchAction.kind === 'withdraw') {
        setSelectedWithdrawRequestNos([])
        await loadAdminWithdrawRequests()
      } else {
        setSelectedRiskEventIds([])
        await loadRiskEvents(riskQuery)
      }
      setPendingBatchAction(null)
      setBatchActionNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量操作失败')
    } finally {
      setBatchActionLoading(false)
    }
  }

  async function handleLoadExperiment() {
    if (!adminSession || !experimentCode.trim()) return
    setLoading(true); setError('')
    try { setExperimentDashboard(await getExperimentDashboard(adminSession.sessionToken, experimentCode.trim())) }
    catch (err) { setError(err instanceof Error ? err.message : '加载实验看板失败') }
    finally { setLoading(false) }
  }

  async function handleCreateExperiment() {
    if (!adminSession) return
    setLoading(true); setError('')
    try {
      await createExperiment(adminSession.sessionToken, {
        experimentCode: experimentCode.trim(), experimentName: experimentForm.name.trim(), plannedSampleSize: 100,
        primaryMetricCode: experimentForm.primaryMetricCode.trim(), enrollmentStartsAt: experimentForm.enrollmentStartsAt,
        enrollmentEndsAt: experimentForm.enrollmentEndsAt, observationEndsAt: experimentForm.observationEndsAt,
      })
      setSuccessMessage('100 人实验已创建为草稿，确认后再开启招募。')
      await handleLoadExperiment()
    } catch (err) { setError(err instanceof Error ? err.message : '创建实验失败') }
    finally { setLoading(false) }
  }

  async function handleExperimentStatus(status: string) {
    if (!adminSession) return
    setLoading(true); setError('')
    try { await changeExperimentStatus(adminSession.sessionToken, experimentCode.trim(), status, '后台人工确认'); await handleLoadExperiment() }
    catch (err) { setError(err instanceof Error ? err.message : '更新实验状态失败') }
    finally { setLoading(false) }
  }

  async function handleEnrollParticipant() {
    if (!adminSession || !experimentParticipant.userId) return
    setLoading(true); setError('')
    try {
      await enrollExperimentParticipant(adminSession.sessionToken, experimentCode.trim(), {
        userId: Number(experimentParticipant.userId), cohortCode: experimentParticipant.cohortCode.trim(), eligibilitySnapshot: experimentParticipant.eligibilitySnapshot.trim(),
      })
      setExperimentParticipant({ ...experimentParticipant, userId: '', eligibilitySnapshot: '' }); await handleLoadExperiment()
    } catch (err) { setError(err instanceof Error ? err.message : '加入实验队列失败') }
    finally { setLoading(false) }
  }

  async function loadRiskEvents(query = riskQuery) {
    if (!adminSession) return
    setLoading(true)
    setError('')
    try {
      const result = await getAdminRiskEvents(adminSession.sessionToken, {
        userId: query.userId ? Number(query.userId) : undefined,
        riskStatus: query.riskStatus || undefined,
        product: activeAdminProductCode,
        startAt: query.startAt || undefined,
        endAt: query.endAt || undefined,
        page: Number(query.page || 0),
        size: Number(query.size || 10),
      })
      setRiskEvents(result)
      setSelectedRiskEventIds([])
      setHasQueriedRiskEvents(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载风险事件失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadAuditLogs(query = auditQuery) {
    if (!adminSession) return
    try {
      const result = await getAdminAuditLogs(adminSession.sessionToken, {
        moduleName: query.moduleName || undefined,
        page: Number(query.page || 0),
        size: Number(query.size || 5),
      })
      setAuditLogs(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载处理记录失败')
    }
  }

  async function loadPhoneVerificationCodes(query = phoneVerificationQuery) {
    if (!adminSession || !canAuditPhoneVerification) return
    setLoading(true)
    setError('')
    try {
      const result = await getAdminPhoneVerificationCodes(adminSession.sessionToken, {
        phoneNumber: query.phoneNumber.trim() || undefined,
        page: Number(query.page || 0),
        size: Number(query.size || 20),
      })
      setPhoneVerificationCodes(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载验证码记录失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevealPhoneVerificationCode(id: number) {
    if (!adminSession || !canAuditPhoneVerification) return
    setLoading(true)
    setError('')
    try {
      const revealed = await revealAdminPhoneVerificationCode(adminSession.sessionToken, id)
      const audit = await getAdminPhoneVerificationCodeAudit(adminSession.sessionToken, id)
      setRevealedPhoneVerificationCodes((current) => ({ ...current, [id]: revealed.verificationCode }))
      setPhoneVerificationAuditLogs(audit)
      setSuccessMessage('验证码已显示；本次查看已写入审计记录。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '显示验证码失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSeedInviter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminSession || !canManageSeedInviters) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const created = await createAdminSeedInviter(adminSession.sessionToken, {
        phoneNumber: formatPhoneNumber(seedInviterCountry.callingCode, seedInviterForm.phoneNumber),
        countryCode: seedInviterForm.countryCode.trim().toUpperCase(),
        languageCode: seedInviterForm.languageCode.trim().toLowerCase(),
      })
      setCreatedSeedInviter(created)
      await loadSeedInviters()
      setSuccessMessage('种子邀请人已创建。请复制邀请码，用它完成首批用户注册。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建种子邀请人失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadSeedInviters() {
    if (!adminSession || !canManageSeedInviters) return
    setLoading(true)
    setError('')
    try {
      const result = await getAdminSeedInviters(adminSession.sessionToken, { page: 0, size: 50 })
      setSeedInviters(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载种子邀请人失败')
    } finally {
      setLoading(false)
    }
  }

  const loadUserPlatformProfiles = useCallback(async (query = userPlatformQuery) => {
    if (!adminSession) return
    setLoading(true)
    setError('')
    try {
      const result = await getAdminUserPlatformProfiles(adminSession.sessionToken, {
        userId: query.userId.trim() ? Number(query.userId) : undefined,
        page: Number(query.page || 0),
        size: Number(query.size || 20),
      })
      setUserPlatformProfiles(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户平台归属失败')
    } finally {
      setLoading(false)
    }
  }, [adminSession, userPlatformQuery])

  useEffect(() => {
    if (activeAdminSection !== 'users' || !adminSession) return
    const timer = window.setTimeout(() => { void loadUserPlatformProfiles() }, 0)
    return () => window.clearTimeout(timer)
  }, [activeAdminSection, adminSession, loadUserPlatformProfiles])

  async function loadPlatformGuildDirectory(platform = platformGuildDirectoryPlatform) {
    if (!adminSession) return
    setPlatformGuildDirectoryLoading(true)
    setError('')
    try {
      const [directory, syncRuns] = await Promise.all([
        getAdminPlatformGuildDirectory(adminSession.sessionToken, platform),
        getAdminPlatformGuildDirectorySyncRuns(adminSession.sessionToken, platform),
      ])
      setPlatformGuildDirectory(directory)
      setPlatformGuildDirectorySyncRuns(syncRuns)
    } catch (err) {
      setPlatformGuildDirectory(null)
      setPlatformGuildDirectorySyncRuns(null)
      setError(err instanceof Error ? err.message : '加载平台公会目录失败')
    } finally {
      setPlatformGuildDirectoryLoading(false)
    }
  }

  function switchPlatformGuildDirectory(platform: 'LINKY' | 'TIMO') {
    setPlatformGuildDirectoryPlatform(platform)
    void loadPlatformGuildDirectory(platform)
  }

  async function saveLinkyInvitationGuildOverride() {
    if (!adminSession || !canManageLinkyInvitationGuild || !linkyInvitationGuildOverride.userId.trim()) return
    if (!selectedLinkyInvitationGuildOption || !linkyInvitationGuildOverride.reason.trim()) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      await updateAdminLinkyInvitationGuild(adminSession.sessionToken, Number(linkyInvitationGuildOverride.userId), {
        guildId: selectedLinkyInvitationGuildOption.guildId,
        guildName: selectedLinkyInvitationGuildOption.guildName,
        reason: linkyInvitationGuildOverride.reason.trim(),
      })
      await loadUserPlatformProfiles()
      setSuccessMessage('Linky 邀请链归属已调整；只影响该用户后续邀请的新下级，不会修改既有绑定、邀请或奖励。')
      setLinkyInvitationGuildOverride({ userId: '', guildId: '', guildName: '', guildInviteCode: '', reason: '' })
      setIsLinkyInvitationGuildDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '调整 Linky 邀请链归属失败')
    } finally {
      setLoading(false)
    }
  }

  function openLinkyInvitationGuildOverride(item: UserPlatformProfileListResponse['items'][number]) {
    setLinkyInvitationGuildOverride({
      userId: String(item.userId),
      guildId: item.invitationGuild?.guildId ?? '',
      guildName: item.invitationGuild?.guildName ?? '',
      guildInviteCode: item.invitationGuild?.guildInviteCode ?? '',
      reason: '',
    })
    setIsLinkyInvitationGuildDialogOpen(true)
    void loadLinkyInvitationGuildOptions()
  }

  function closeLinkyInvitationGuildDialog() {
    setIsLinkyInvitationGuildDialogOpen(false)
    setLinkyInvitationGuildOverride({ userId: '', guildId: '', guildName: '', guildInviteCode: '', reason: '' })
  }

  async function loadLinkyInvitationGuildOptions() {
    if (!adminSession) return
    setLinkyInvitationGuildOptionsLoading(true)
    try {
      setLinkyInvitationGuildOptions(await getAdminPlatformGuildDirectory(adminSession.sessionToken, 'LINKY'))
    } catch (err) {
      setLinkyInvitationGuildOptions(null)
      setError(err instanceof Error ? err.message : '加载 MCN Linky 公会目录失败')
    } finally {
      setLinkyInvitationGuildOptionsLoading(false)
    }
  }

  async function loadLinkyWebhookLogs(query = linkyWebhookQuery) {
    if (!adminSession) return
    setLinkyWebhookLoading(true)
    setError('')
    try {
      const result = await getAdminLinkyWebhookLogs(adminSession.sessionToken, {
        linkyOrderId: query.linkyOrderId.trim() || undefined,
        userId: query.userId ? Number(query.userId) : undefined,
        requestStatus: query.requestStatus || undefined,
        product: activeAdminProductCode,
        page: Number(query.page || 0),
        size: Number(query.size || 10),
      })
      setLinkyWebhookLogs(result)
      setHasQueriedLinkyWebhookLogs(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载 Linky webhook 日志失败')
    } finally {
      setLinkyWebhookLoading(false)
    }
  }

  async function loadLinkyReplayRecords(query = linkyReplayQuery) {
    if (!adminSession) return
    setLinkyReplayLoading(true)
    setError('')
    try {
      const result = await getAdminLinkyReplayRecords(adminSession.sessionToken, {
        linkyOrderId: query.linkyOrderId.trim() || undefined,
        userId: query.userId ? Number(query.userId) : undefined,
        product: activeAdminProductCode,
        page: Number(query.page || 0),
        size: Number(query.size || 10),
      })
      setLinkyReplayRecords(result)
      setHasQueriedLinkyReplayRecords(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载 Linky replay 记录失败')
    } finally {
      setLinkyReplayLoading(false)
    }
  }

  function handleLoadLinkyWebhookLogs() {
    const nextQuery = { ...linkyWebhookQuery, page: '0' }
    setLinkyWebhookQuery(nextQuery)
    void loadLinkyWebhookLogs(nextQuery)
  }

  function handleLoadLinkyReplayRecords() {
    const nextQuery = { ...linkyReplayQuery, page: '0' }
    setLinkyReplayQuery(nextQuery)
    void loadLinkyReplayRecords(nextQuery)
  }

  function handleLinkyWebhookPageChange(nextPage: number) {
    const safePage = Math.max(0, nextPage)
    const nextQuery = { ...linkyWebhookQuery, page: String(safePage) }
    setLinkyWebhookQuery(nextQuery)
    void loadLinkyWebhookLogs(nextQuery)
  }

  function handleLinkyReplayPageChange(nextPage: number) {
    const safePage = Math.max(0, nextPage)
    const nextQuery = { ...linkyReplayQuery, page: String(safePage) }
    setLinkyReplayQuery(nextQuery)
    void loadLinkyReplayRecords(nextQuery)
  }

  async function handleCreateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const profile = await createProfile(profileCreateToken, {
        userId: Number(form.userId),
        countryCode: form.countryCode.trim().toUpperCase(),
        languageCode: form.languageCode.trim(),
        inviteCode: form.inviteCode.trim(),
      })
      const nextSession = saveUserSession(profile)
      setSession(nextSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建分销档案失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdminLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const nextSession = await createAdminSession({ username: adminUsername.trim(), password: adminPassword, rememberMe: adminRememberMe })
      setAdminSession(nextSession)
      if (typeof window !== 'undefined' && window.location.pathname === '/' && window.history?.replaceState) {
        window.history.replaceState(null, '', `/admin${window.location.hash || ''}`)
      }
      setAdminPassword('')
      if (nextSession.mustChangePassword) return
      const [overviewResult, auditResult] = await Promise.all([
        getAdminOverview(nextSession.sessionToken, activeAdminProductCode),
        getAdminAuditLogs(nextSession.sessionToken, {
          moduleName: auditQuery.moduleName,
          page: Number(auditQuery.page || 0),
          size: Number(auditQuery.size || 5),
        }),
      ])
      setAdminOverview(overviewResult)
      setAuditLogs(auditResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : '后台登录失败')
    } finally {
      setLoading(false)
    }
  }

  function clearAdminState() {
    setAdminSession(null)
    setAdminOverview(null)
    setAdminRewards(null)
    setAdminWithdrawRequests(null)
    setRiskEvents(null)
    setAuditLogs(null)
    setAdminRelation(null)
    setLinkyEligibilityResult(null)
    setLinkyWebhookLogs(null)
    setLinkyReplayRecords(null)
    setHasQueriedAdminRewards(false)
    setHasQueriedRiskEvents(false)
    setHasQueriedLinkyWebhookLogs(false)
    setHasQueriedLinkyReplayRecords(false)
    setPendingRiskAction(null)
    setPendingWithdrawAction(null)
    setPendingAdminAccountAction(null)
    setSelectedLinkyDrawer(null)
    setPendingRelationChange(null)
    setRiskActionDrafts({})
    setSuccessMessage('')
  }

  async function handleAdminLogout() {
    try { await logoutAdminSession() } finally { clearAdminState() }
  }

  async function handleChangeAdminPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) { setError('两次输入的新密码不一致'); return }
    try {
      await changeAdminPassword({ currentPassword: adminPasswordForm.currentPassword, newPassword: adminPasswordForm.newPassword })
      clearAdminState(); setAdminPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { setError(err instanceof Error ? err.message : '修改密码失败') }
  }

  async function handleLoadAdminIdentityCenter() {
    setLoading(true); setError('')
    try {
      const [devices, events] = await Promise.all([getAdminDeviceSessions(), getMyAdminSecurityEvents()])
      setAdminDevices(devices); setAdminSecurityEvents(events)
      if (adminSession?.role.toLowerCase() === 'super_admin') setAdminAccounts(await getAdminAccounts())
    } catch (err) { setError(err instanceof Error ? err.message : '加载系统管理数据失败') }
    finally { setLoading(false) }
  }

  async function handleCreateAdminAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setAdminTemporaryPassword('')
    try {
      const created = await createAdminAccount(adminAccountForm); setAdminTemporaryPassword(created.temporaryPassword)
      setAdminAccountForm({ username: '', displayName: '', role: 'operator', platformScope: '*', guildScope: '*', regionScope: '*' })
      setAdminAccounts(await getAdminAccounts())
    } catch (err) { setError(err instanceof Error ? err.message : '创建员工账号失败') }
    finally { setLoading(false) }
  }

  async function handleToggleAdminAccount(account: AdminAccountResponse) {
    setLoading(true); setError('')
    try { await updateAdminAccount(account.id, { displayName: account.displayName, role: account.role, enabled: !account.enabled, platformScope: account.platformScope, guildScope: account.guildScope, regionScope: account.regionScope }); setAdminAccounts(await getAdminAccounts()); setPendingAdminAccountAction(null); setSuccessMessage(`员工账号已${account.enabled ? '停用' : '恢复'}`) }
    catch (err) { setError(err instanceof Error ? err.message : '更新员工账号失败') } finally { setLoading(false) }
  }

  async function handleSaveAdminAccount(account: AdminAccountResponse) {
    setLoading(true); setError('')
    try { await updateAdminAccount(account.id, { displayName: account.displayName, role: account.role, enabled: account.enabled, platformScope: account.platformScope, guildScope: account.guildScope, regionScope: account.regionScope }); setAdminAccounts(await getAdminAccounts()); setPendingAdminAccountAction(null); setSuccessMessage('员工账号已更新') }
    catch (err) { setError(err instanceof Error ? err.message : '更新员工账号失败') } finally { setLoading(false) }
  }

  async function handleResetAdminPassword(id: number) {
    setLoading(true); setError(''); setAdminTemporaryPassword('')
    try { const result = await resetAdminPassword(id); setAdminTemporaryPassword(result.temporaryPassword); setAdminAccounts(await getAdminAccounts()); setPendingAdminAccountAction(null); setSuccessMessage('员工密码已重置，旧会话已失效') }
    catch (err) { setError(err instanceof Error ? err.message : '重置密码失败') } finally { setLoading(false) }
  }

  async function handleUnlockAdminAccount(id: number) {
    setLoading(true); setError('')
    try { await unlockAdminAccount(id); setAdminAccounts(await getAdminAccounts()); setPendingAdminAccountAction(null); setSuccessMessage('员工账号已解锁') }
    catch (err) { setError(err instanceof Error ? err.message : '解锁账号失败') } finally { setLoading(false) }
  }

  async function handleLogoutAllAdminDevices() { try { await logoutAllAdminSessions() } finally { clearAdminState() } }
  async function handleRevokeAdminDevice(id: number) { await revokeAdminDeviceSession(id); if (adminDevices.find((item) => item.id === id)?.current) clearAdminState(); else setAdminDevices(await getAdminDeviceSessions()) }
  async function handleCopyFingerprint(fingerprint: string) {
    try {
      await navigator.clipboard.writeText(fingerprint)
      setSuccessMessage('Linky replay 指纹已复制到剪贴板。')
    } catch {
      setError('复制 Linky replay 指纹失败，请手动复制。')
    }
  }

  async function handleCopyInviteCode(inviteCode: string) {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setSuccessMessage('邀请码已复制到剪贴板，可直接发给 Linky 用户去绑定页登记。')
    } catch {
      setError('复制邀请码失败，请手动复制。')
    }
  }

  function openExternalLandingPage(url: string) {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  async function copyPublicEntryLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setSuccessMessage(`已复制链接：${url}`)
      setError('')
    } catch {
      setError('复制链接失败，请手动复制。')
    }
  }

  async function handleLoadAdminOverview() {
    if (!adminSession) return
    setLoading(true)
    setError('')
    try {
      const [overview, pendingWithdrawals, pendingRisks] = await Promise.all([
        getAdminOverview(adminSession.sessionToken, activeAdminProductCode),
        canViewAdminSection('rewards')
          ? getAdminWithdrawRequests(adminSession.sessionToken, { status: 'PENDING_REVIEW', page: 0, size: 1 })
          : Promise.resolve(null),
        canViewAdminSection('bindings')
          ? getAdminRiskEvents(adminSession.sessionToken, { riskStatus: 'PENDING', product: activeAdminProductCode, page: 0, size: 1 })
          : Promise.resolve(null),
      ])
      setAdminOverview(overview)
      if (pendingWithdrawals) setAdminWithdrawRequests(pendingWithdrawals)
      if (pendingRisks) setRiskEvents(pendingRisks)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载运营概览失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadAdminRewards() {
    await loadAdminRewards(adminRewardQuery)
  }

  async function handleLoadRiskEvents() {
    await loadRiskEvents(riskQuery)
  }

  async function handleAdminRewardPageChange(nextPage: number) {
    if (nextPage < 0) return
    const nextQuery = { ...adminRewardQuery, page: String(nextPage) }
    setAdminRewardQuery(nextQuery)
    await loadAdminRewards(nextQuery)
  }

  async function handleRiskPageChange(nextPage: number) {
    if (nextPage < 0) return
    const nextQuery = { ...riskQuery, page: String(nextPage) }
    setRiskQuery(nextQuery)
    await loadRiskEvents(nextQuery)
  }

  async function handleRiskAction(actionRequest: PendingRiskAction) {
    if (!adminSession) return
    const { riskEventId, action, note } = actionRequest
    setRiskActionLoadingId(riskEventId)
    setError('')
    setSuccessMessage('')
    try {
      const updatedItem = await applyAdminRiskEventAction(adminSession.sessionToken, riskEventId, {
        action,
        note: note.trim() || undefined,
      })
      setRiskEvents((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === updatedItem.id ? updatedItem : item),
      } : current)
      if (adminRewards) {
        await loadAdminRewards(adminRewardQuery)
      }
      if (adminRelation && relationQueryUserId && Number(relationQueryUserId) === updatedItem.userId) {
        await handleLoadRelation()
      }
      await loadAuditLogs(auditQuery)
      setRiskActionDrafts((current) => {
        const next = { ...current }
        delete next[riskEventId]
        return next
      })
      setPendingRiskAction(null)
      setSuccessMessage(`风险事件 #${riskEventId} 已执行 ${riskActionLabel(action)}，审计和相关数据已同步刷新。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理风险事件失败')
    } finally {
      setRiskActionLoadingId(null)
    }
  }

  async function handleLoadRelation() {
    if (!adminSession || !relationQueryUserId) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const relation = await getAdminRelation(adminSession.sessionToken, Number(relationQueryUserId), activeAdminProductCode)
      setAdminRelation(relation)
      setRelationBeforeAdjust(relation)
      setRelationAdjustInviterId(relation.level1InviterId ? String(relation.level1InviterId) : '')
      setRelationAdjustNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载关系链失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefreshLinkyEligibility() {
    if (!adminSession || !linkyEligibilityAccount.trim()) return
    setLinkyEligibilityLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await refreshAdminLinkyEligibility(adminSession.sessionToken, linkyEligibilityAccount.trim())
      setLinkyEligibilityResult(result)
      setSuccessMessage(`Linky 账号 ${result.linkyAccount} 的资格结果已刷新：${formatEligibilitySummary(result)}`)
    } catch (err) {
      setLinkyEligibilityResult(null)
      setError(err instanceof Error ? err.message : '刷新 Linky 资格失败')
    } finally {
      setLinkyEligibilityLoading(false)
    }
  }

  async function handleRefreshAllLinkyEligibility() {
    if (!adminSession) return
    setLinkyBatchRefreshLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await refreshAdminLinkyEligibilityBatch(adminSession.sessionToken)
      setLinkyBatchRefreshResult(result)
      setSuccessMessage(`已完成全部 Linky 资格批量刷新：成功 ${result.successCount} 条，失败 ${result.failureCount} 条。`)
    } catch (err) {
      setLinkyBatchRefreshResult(null)
      setError(err instanceof Error ? err.message : '批量刷新 Linky 资格失败')
    } finally {
      setLinkyBatchRefreshLoading(false)
    }
  }

  async function handleLoadGuildWeeklyReport() {
    if (!adminSession || !guildWeeklyQuery.guildId.trim()) return
    setGuildWeeklyLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await getAdminGuildWeeklyReport(adminSession.sessionToken, guildWeeklyQuery.guildId.trim(), {
        product: activeAdminProductCode || 'LINKY',
        week: guildWeeklyQuery.week || 'CURRENT',
      })
      setGuildWeeklyReport(result)
      setSuccessMessage(`公会 ${result.guildId} 周报已更新：注册 ${result.registeredUsers} 人，收入 ${result.incomeAmount}，分佣 ${result.rewardAmount}。`)
    } catch (err) {
      setGuildWeeklyReport(null)
      setError(err instanceof Error ? err.message : '加载公会周报失败')
    } finally {
      setGuildWeeklyLoading(false)
    }
  }

  async function handleLoadGuildConfigs() {
    if (!adminSession) return
    setGuildConfigLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await getAdminGuildConfigs(adminSession.sessionToken)
      setGuildConfigs(result)
      setSuccessMessage(`已加载 ${result.length} 条公会配置。`)
    } catch (err) {
      setGuildConfigs(null)
      setError(err instanceof Error ? err.message : '加载公会配置失败')
    } finally {
      setGuildConfigLoading(false)
    }
  }

  async function loadPlatformIntegrations() {
    if (!adminSession) return
    setLoading(true)
    setError('')
    try {
      const values = await getAdminPlatformIntegrations(adminSession.sessionToken)
      setPlatformIntegrations(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载平台接入配置失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadPlatformVerificationRuntime(loadMocks = false) {
    if (!adminSession) return
    setLoading(true)
    setError('')
    try {
      const runtime = await getAdminPlatformVerificationRuntime(adminSession.sessionToken)
      setPlatformVerificationRuntime(runtime)
      if (loadMocks && runtime.mockManagementEnabled && canManagePlatformMocks) {
        setPlatformVerificationMocks(await getAdminPlatformVerificationMocks(adminSession.sessionToken))
      } else if (!runtime.mockManagementEnabled) {
        setPlatformVerificationMocks(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载平台核验通道失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRunControlledIncome(cursor: string | null, requestId?: string) {
    if (!adminSession || !canRunControlledIncome) return
    const businessDate = controlledIncomeForm.businessDate.trim()
    const pageSize = Number(controlledIncomeForm.pageSize)
    if (!businessDate || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 500) {
      setError('请填写有效的业务日期和 1 至 500 的页大小。')
      return
    }
    setControlledIncomeLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await runAdminIncomeControlledChanges(adminSession.sessionToken, {
        platformCode: controlledIncomeForm.platformCode,
        cursor,
        businessDateFrom: businessDate,
        businessDateTo: businessDate,
        pageSize,
        requestId,
      })
      setControlledIncomeResult(result)
      setControlledIncomeCursor(result.hasMore ? result.nextCursor : null)
      setControlledIncomeLastRequest({ cursor, requestId: result.requestId })
      setControlledIncomeReconciliation(null)
      setSuccessMessage(`${result.sourceStatus}：已完成一页受控只读读取，接收 ${result.factCount} 条事实。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '收入事实受控读取失败')
    } finally {
      setControlledIncomeLoading(false)
    }
  }

  async function handleReconcileControlledIncome() {
    if (!adminSession || !canRunControlledIncome || !controlledIncomeResult || controlledIncomeResult.hasMore) return
    const businessDate = controlledIncomeForm.businessDate.trim()
    setControlledIncomeLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const result = await runAdminIncomeControlledReconciliation(adminSession.sessionToken, {
        platformCode: controlledIncomeForm.platformCode,
        businessDateFrom: businessDate,
        businessDateTo: businessDate,
        guildIds: [],
      })
      setControlledIncomeReconciliation(result)
      setSuccessMessage(`${result.sourceStatus}：受控对账已完成，结果 ${result.comparisonStatus}。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '收入事实受控对账失败')
    } finally {
      setControlledIncomeLoading(false)
    }
  }

  async function handleRefreshIncomeShadowLedger() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const result = await refreshAdminIncomeShadowLedger(adminSession.sessionToken, incomeShadowForm)
      setIncomeShadowResult(result); setIncomeDataQuality(null); setIncomeDataQualityExceptions([]); setIncomeRewardCandidateResult(null); setIncomeRewardCandidateItems([])
      setSuccessMessage('影子账本已按最新修订刷新；未产生任何奖励、钱包或提现结果。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新影子账本失败')
    } finally { setLoading(false) }
  }

  async function handleLoadIncomeShadowLedger() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError('')
    try { setIncomeShadowResult(await getAdminIncomeShadowLedgerSummary(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取影子账本摘要失败') }
    finally { setLoading(false) }
  }

  async function handleLoadIncomeDataQuality() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const [summary, quality, exceptions] = await Promise.all([
        getAdminIncomeShadowLedgerSummary(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate),
        getAdminIncomeDataQuality(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate),
        getAdminIncomeDataQualityExceptions(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate),
      ])
      setIncomeShadowResult(summary); setIncomeDataQuality(quality); setIncomeDataQualityExceptions(exceptions)
      setSuccessMessage('已读取数据质量结果；该操作不会变更任何收入、奖励或钱包数据。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取收入数据质量失败')
    } finally { setLoading(false) }
  }

  async function handleLoadIncomeSyncStatus() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const result = await getAdminIncomeSyncStatus(adminSession.sessionToken)
      setIncomeSyncStatus(result)
      setSuccessMessage('已读取持续同步状态；该操作不会开启消费、请求 MCN 或变更任何收入数据。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取收入同步状态失败')
    } finally { setLoading(false) }
  }

  function openIncomeExceptionReview(item: McnIncomeDataQualityExceptionResponse) {
    setIncomeExceptionReviewTarget(item)
    setIncomeExceptionReviewForm({ reviewStatus: item.reviewStatus === 'IGNORED' ? 'IGNORED' : 'ACKNOWLEDGED', reviewNote: item.reviewNote ?? '' })
  }

  async function handleReviewIncomeException() {
    if (!adminSession || !incomeExceptionReviewTarget || !incomeExceptionReviewForm.reviewNote.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const updated = await reviewAdminIncomeDataQualityException(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate, {
        sourceEventReference: incomeExceptionReviewTarget.sourceEventReference, sourceRevision: incomeExceptionReviewTarget.sourceRevision,
        reviewStatus: incomeExceptionReviewForm.reviewStatus, reviewNote: incomeExceptionReviewForm.reviewNote.trim(),
      })
      setIncomeDataQualityExceptions((items) => items.map((item) => item.sourceEventReference === updated.sourceEventReference && item.sourceRevision === updated.sourceRevision ? updated : item))
      setIncomeExceptionReviewTarget(null); setSuccessMessage('异常处理结论已保存并写入运营审计；不会修改 MCN 原始事实或产生奖励。')
    } catch (err) { setError(err instanceof Error ? err.message : '保存收入异常复核失败') }
    finally { setLoading(false) }
  }

  async function handleReplayIncomeShadowLedger() {
    if (!adminSession || !incomeShadowReplayReason.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const result = await replayAdminIncomeShadowLedger(adminSession.sessionToken, { ...incomeShadowForm, reason: incomeShadowReplayReason.trim() })
      const [quality, exceptions] = await Promise.all([
        getAdminIncomeDataQuality(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate),
        getAdminIncomeDataQualityExceptions(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate),
      ])
      setIncomeShadowResult(result); setIncomeDataQuality(quality); setIncomeDataQualityExceptions(exceptions)
      setIncomeRewardCandidateResult(null); setIncomeRewardCandidateItems([]); setIsIncomeShadowReplayDialogOpen(false); setIncomeShadowReplayReason('')
      setSuccessMessage('已按已保留的最新 MCN 证据重新投影，并记录人工重放原因；未调用 MCN、未发奖。')
    } catch (err) { setError(err instanceof Error ? err.message : '重新投影收入影子账本失败') }
    finally { setLoading(false) }
  }

  async function handleRefreshIncomeRewardCandidates() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const result = await refreshAdminIncomeRewardCandidates(adminSession.sessionToken, incomeShadowForm)
      const items = await getAdminIncomeRewardCandidateItems(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate)
      setIncomeRewardCandidateResult(result); setIncomeRewardCandidateItems(items)
      setIncomeRewardCandidateSample(null)
      setSuccessMessage('已完成不可支付的奖励候选演算；没有创建奖励、钱包或提现记录。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '演算奖励候选失败')
    } finally { setLoading(false) }
  }

  async function handleLoadIncomeRewardCandidates() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError('')
    try {
      const [summary, items] = await Promise.all([
        getAdminIncomeRewardCandidateSummary(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate),
        getAdminIncomeRewardCandidateItems(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate),
      ])
      setIncomeRewardCandidateResult(summary); setIncomeRewardCandidateItems(items)
      setIncomeRewardCandidateSample(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取奖励候选失败')
    } finally { setLoading(false) }
  }

  async function handleLoadIncomeRewardCandidateSample() {
    if (!adminSession || !incomeRewardCandidateResult?.latestRunId || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const sample = await getAdminIncomeRewardCandidateSample(adminSession.sessionToken, incomeRewardCandidateResult.latestRunId, 10)
      setIncomeRewardCandidateSample(sample)
      setSuccessMessage('已从本次候选快照抽取固定核验样本；该操作不会重新演算或改动任何业务数据。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取候选核验样本失败')
    } finally { setLoading(false) }
  }

  async function loadCommissionPolicies() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError('')
    try { setCommissionPolicies(await getAdminCommissionPolicies(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取邀请裂变分成规则失败') }
    finally { setLoading(false) }
  }

  async function loadMentorIncentiveDashboard() {
    if (!adminSession) return
    setLoading(true); setError('')
    try { setMentorIncentiveDashboard(await getAdminMentorIncentiveDashboard(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取导师分成影子账本失败') }
    finally { setLoading(false) }
  }

  async function openPlatformGuildShareDialog(platformCode: string, guildId: string, guildName: string) {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      setPlatformGuildShareRules(await getAdminPlatformGuildCompanyShareRules(adminSession.sessionToken, platformCode, guildId))
      setPlatformGuildShareForm({ rate: '', effectiveFrom: '' })
      setPlatformGuildShareDialogTarget({ platformCode, guildId, guildName })
    } catch (err) { setError(err instanceof Error ? err.message : '读取公会公司分成比例历史失败') } finally { setLoading(false) }
  }

  async function savePlatformGuildOperatingShareRate() {
    if (!adminSession || !canRunControlledIncome || !platformGuildShareDialogTarget) return
    const rate = Number(platformGuildShareForm.rate)
    if (!platformGuildShareForm.rate || !Number.isFinite(rate) || rate < 0 || rate > 1) { setError('公司分成比例请填写 0 到 1 之间的小数，例如 0.20 表示 20%。'); return }
    if (!platformGuildShareForm.effectiveFrom) { setError('请填写生效时间。'); return }
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await createAdminPlatformGuildOperatingShareRate(adminSession.sessionToken, platformGuildShareDialogTarget.platformCode, platformGuildShareDialogTarget.guildId, rate, platformGuildShareForm.effectiveFrom)
      setPlatformGuildShareRules(await getAdminPlatformGuildCompanyShareRules(adminSession.sessionToken, platformGuildShareDialogTarget.platformCode, platformGuildShareDialogTarget.guildId))
      setPlatformGuildShareForm({ rate: '', effectiveFrom: '' })
      setSuccessMessage('已建立公司分成比例草稿；审批启用前不会改变任何候选计算基数。')
    } catch (err) { setError(err instanceof Error ? err.message : '建立公会公司分成比例草稿失败') } finally { setLoading(false) }
  }

  async function activatePlatformGuildOperatingShareRate(rule: PlatformGuildCompanyShareRuleResponse) {
    if (!adminSession || !platformGuildShareDialogTarget) return
    const approvalNote = window.prompt(`审批启用公司分成比例 V${rule.shareVersion} 的说明：`, '业务规则已复核')
    if (!approvalNote?.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await activateAdminPlatformGuildCompanyShareRule(adminSession.sessionToken, rule.id, approvalNote.trim())
      setPlatformGuildShareRules(await getAdminPlatformGuildCompanyShareRules(adminSession.sessionToken, platformGuildShareDialogTarget.platformCode, platformGuildShareDialogTarget.guildId))
      await loadPlatformIntegrations()
      setSuccessMessage(`已审批启用公司分成比例 V${rule.shareVersion}；候选演算仅会读取收入发生时有效的已启用版本。`)
    } catch (err) { setError(err instanceof Error ? err.message : '审批公司分成比例失败') } finally { setLoading(false) }
  }

  async function loadOperatingDividendDashboard() {
    if (!adminSession || !canManageOperatingDividends) return
    setLoading(true); setError('')
    try { setOperatingDividendDashboard(await getAdminOperatingDividendDashboard(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取运营分红影子台失败') }
    finally { setLoading(false) }
  }

  async function loadTeamManagementDashboard() {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError('')
    try { setTeamManagementDashboard(await getAdminTeamManagementDashboard(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取团队列表失败') }
    finally { setLoading(false) }
  }

  async function openTeamMembers(team: TeamManagementItemResponse) {
    if (!adminSession) return
    setTeamMemberTarget(team); setTeamMembers([]); setTeamMembersLoading(true); setError('')
    try { setTeamMembers(await getAdminTeamMembers(adminSession.sessionToken, team.teamId)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取团队成员失败') }
    finally { setTeamMembersLoading(false) }
  }

  async function confirmTeamOperatingProfitSharePermission() {
    if (!adminSession || !canManageTeams || !teamOperatingProfitSharePermissionTarget) return
    const { team, enabled } = teamOperatingProfitSharePermissionTarget
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await saveAdminTeamOperatingProfitSharePermission(adminSession.sessionToken, team.teamId, enabled)
      setTeamOperatingProfitSharePermissionTarget(null)
      setSuccessMessage(enabled ? `已允许团队“${team.teamName}”参与后续团队经营利润分成演算。` : `已取消团队“${team.teamName}”的团队经营利润分成许可。`)
      await loadTeamManagementDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : '保存团队经营利润分成许可失败') } finally { setLoading(false) }
  }

  async function loadUserGradeDashboard() {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError('')
    try { setUserGradeDashboard(await getAdminUserGradeDashboard(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '加载用户等级失败') }
    finally { setLoading(false) }
  }

  async function loadEffectiveUserQualifications(platform = effectiveUserPlatform) {
    if (!adminSession || !canReadEffectiveUsers) return
    setLoading(true); setError('')
    try { setEffectiveUserQualifications(await getAdminEffectiveUserQualifications(adminSession.sessionToken, platform, 50)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取有效用户资格事实失败') }
    finally { setLoading(false) }
  }

  async function refreshEffectiveUserQualifications() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const result = await refreshAdminEffectiveUserQualifications(adminSession.sessionToken, effectiveUserPlatform)
      setSuccessMessage(`已按已定稿收入事实刷新 ${result.platformCode} 的 ${result.refreshedCount} 条有效用户资格；不会产生奖励、余额或付款。`)
      await loadEffectiveUserQualifications()
      await loadUserGradeDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : '刷新有效用户资格失败') } finally { setLoading(false) }
  }

  function openEffectiveUserCorrectionDialog(fact: EffectiveUserQualificationResponse) {
    setEffectiveUserCorrectionForm({ correctionReason: 'FRAUD', correctionNote: '' })
    setEffectiveUserCorrectionTarget(fact)
  }

  async function confirmEffectiveUserCorrection() {
    if (!adminSession || !canCorrectEffectiveUsers || !effectiveUserCorrectionTarget || !effectiveUserCorrectionForm.correctionNote.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const corrected = await excludeAdminEffectiveUserQualification(adminSession.sessionToken, {
        userId: effectiveUserCorrectionTarget.userId,
        platformCode: effectiveUserCorrectionTarget.platformCode,
        correctionReason: effectiveUserCorrectionForm.correctionReason,
        correctionNote: effectiveUserCorrectionForm.correctionNote.trim(),
      })
      setEffectiveUserCorrectionTarget(null)
      setSuccessMessage(`已将用户 ${corrected.userId} 的 ${corrected.platformCode} 有效用户资格标记为人工排除，并将上级等级评估转入人工复核。`)
      await loadEffectiveUserQualifications()
      await loadUserGradeDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : '保存有效用户资格纠偏失败') } finally { setLoading(false) }
  }

  async function loadUserGradeLevelDashboard() {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError('')
    try { setUserGradeLevelDashboard(await getAdminUserGradeLevelDashboard(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取积分等级配置失败') }
    finally { setLoading(false) }
  }

  async function loadUserPointDashboard(platformCode = userPointPlatform) {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError('')
    try { setUserPointDashboard(await getAdminUserPointDashboard(adminSession.sessionToken, platformCode)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取用户积分事实失败') }
    finally { setLoading(false) }
  }

  async function refreshUserPointFacts() {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const result = await refreshAdminUserPoints(adminSession.sessionToken, userPointPlatform)
      await loadUserPointDashboard(userPointPlatform)
      setSuccessMessage(`已按本地已定稿收入刷新 ${result.platformCode} 的直接邀请积分事实，共处理 ${result.refreshedCount} 条收入事实。`)
    } catch (err) { setError(err instanceof Error ? err.message : '刷新用户积分事实失败') } finally { setLoading(false) }
  }

  async function loadUserGradeAdvancementReviews() {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError('')
    try { setUserGradeAdvancementReviews(await getAdminUserGradeAdvancementReviews(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取高级等级验收记录失败') }
    finally { setLoading(false) }
  }

  function openUserGradeAdvancementDialog() {
    setUserGradeAdvancementForm({ userId: '', platformCode: 'TIMO', guildId: '', targetGradeCode: 'PLATINUM' })
    setIsUserGradeAdvancementDialogOpen(true)
  }

  async function saveUserGradeAdvancementReview() {
    if (!adminSession || !canManageTeams || !Number(userGradeAdvancementForm.userId) || !userGradeAdvancementForm.guildId.trim()) { setError('请填写用户 ID 和权威公会 ID。'); return }
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await createAdminUserGradeAdvancementReview(adminSession.sessionToken, { userId: Number(userGradeAdvancementForm.userId), platformCode: userGradeAdvancementForm.platformCode, guildId: userGradeAdvancementForm.guildId.trim(), targetGradeCode: userGradeAdvancementForm.targetGradeCode })
      setIsUserGradeAdvancementDialogOpen(false); setSuccessMessage('已建立高级等级培养与经营验收记录；不会自动授予负责人、创建团队或开启分成。'); await loadUserGradeAdvancementReviews()
    } catch (err) { setError(err instanceof Error ? err.message : '建立高级等级验收记录失败') } finally { setLoading(false) }
  }

  function openPlatinumEvidenceDialog(review: UserGradeAdvancementReviewResponse) {
    setPlatinumEvidenceTarget(review)
    setPlatinumEvidenceForm({ traineeUserId: '', groupReference: '', observationStart: '', observationEnd: '', finalWeekEffectiveUserCount: '5', finalWeekMinIncomeDateCount: '3', evidenceNote: '' })
  }

  async function savePlatinumEvidence() {
    if (!adminSession || !platinumEvidenceTarget || !Number(platinumEvidenceForm.traineeUserId) || !platinumEvidenceForm.groupReference.trim() || !platinumEvidenceForm.observationStart || !platinumEvidenceForm.observationEnd || !platinumEvidenceForm.evidenceNote.trim()) { setError('请完整填写两名银牌成员各自的小组经营证据。'); return }
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const saved = await recordAdminUserGradePlatinumEvidence(adminSession.sessionToken, platinumEvidenceTarget.id, { traineeUserId: Number(platinumEvidenceForm.traineeUserId), groupReference: platinumEvidenceForm.groupReference.trim(), observationStart: platinumEvidenceForm.observationStart, observationEnd: platinumEvidenceForm.observationEnd, finalWeekEffectiveUserCount: Number(platinumEvidenceForm.finalWeekEffectiveUserCount), finalWeekMinIncomeDateCount: Number(platinumEvidenceForm.finalWeekMinIncomeDateCount), evidenceNote: platinumEvidenceForm.evidenceNote.trim() })
      setPlatinumEvidenceTarget(null); setSuccessMessage(`已保存铂金培养证据（当前 ${saved.platinumEvidence.length}/2）。不会自动升级、建队或开启团队分成。`); await loadUserGradeAdvancementReviews()
    } catch (err) { setError(err instanceof Error ? err.message : '保存铂金培养证据失败') } finally { setLoading(false) }
  }

  function openAdvancedEvidenceDialog(review: UserGradeAdvancementReviewResponse) {
    setPlatinumEvidenceTarget(review)
    setPlatinumEvidenceForm({ traineeUserId: '', groupReference: '', observationStart: '', observationEnd: '', finalWeekEffectiveUserCount: '5', finalWeekMinIncomeDateCount: '3', evidenceNote: '' })
  }

  async function saveAdvancedEvidence() {
    if (!adminSession || !platinumEvidenceTarget || !Number(platinumEvidenceForm.traineeUserId) || !platinumEvidenceForm.groupReference.trim() || !platinumEvidenceForm.observationStart || !platinumEvidenceForm.observationEnd || !platinumEvidenceForm.evidenceNote.trim()) { setError('请完整填写两名培养成员各自的经营范围和完整自然月证据。'); return }
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const saved = await recordAdminUserGradeAdvancedEvidence(adminSession.sessionToken, platinumEvidenceTarget.id, { traineeUserId: Number(platinumEvidenceForm.traineeUserId), scopeReference: platinumEvidenceForm.groupReference.trim(), observationStart: platinumEvidenceForm.observationStart, observationEnd: platinumEvidenceForm.observationEnd, evidenceNote: platinumEvidenceForm.evidenceNote.trim() })
      setPlatinumEvidenceTarget(null); setSuccessMessage(`已保存${saved.targetGradeCode === 'DIAMOND' ? '钻石' : '黑金'}培养证据（当前 ${saved.advancedEvidence.length}/2）。系统已校验前序等级、成员不重复和完整自然月。`); await loadUserGradeAdvancementReviews()
    } catch (err) { setError(err instanceof Error ? err.message : '保存高级等级培养证据失败') } finally { setLoading(false) }
  }

  async function confirmUserGradeAdvancementReview(review: UserGradeAdvancementReviewResponse, step: 'training-confirmation' | 'operating-confirmation' | 'responsibility-confirmation' | 'leadership-appointment') {
    if (!adminSession || !canManageTeams) return
    const labels = { 'training-confirmation': '培养确认', 'operating-confirmation': '经营验收', 'responsibility-confirmation': '经营职责确认', 'leadership-appointment': '负责人任命' }
    const note = window.prompt(`填写${labels[step]}的依据：`)
    if (!note?.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await confirmAdminUserGradeAdvancementReview(adminSession.sessionToken, review.id, step, note.trim())
      setSuccessMessage(`已记录用户 ${review.userId} 的${labels[step]}；不会自动变更负责人或团队分成。`); await loadUserGradeAdvancementReviews()
    } catch (err) { setError(err instanceof Error ? err.message : '保存高级等级验收失败') } finally { setLoading(false) }
  }

  function openUserGradeLevelDialog() {
    setUserGradeLevelForm({ levelName: '', levelRank: '1', requiredPoints: '0', grantsTeamLeader: false, effectiveFrom: '', effectiveTo: '' })
    setIsUserGradeLevelDialogOpen(true)
  }

  async function saveUserGradeLevel() {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await createAdminUserGradeLevel(adminSession.sessionToken, { levelName: userGradeLevelForm.levelName.trim(), levelRank: Number(userGradeLevelForm.levelRank), requiredPoints: Number(userGradeLevelForm.requiredPoints), grantsTeamLeader: userGradeLevelForm.grantsTeamLeader, effectiveFrom: userGradeLevelForm.effectiveFrom, effectiveTo: userGradeLevelForm.effectiveTo || null })
      setIsUserGradeLevelDialogOpen(false); setSuccessMessage('已建立积分等级草稿，待审批启用。'); await loadUserGradeLevelDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : '建立积分等级失败') } finally { setLoading(false) }
  }

  async function activateUserGradeLevel(id: number, name: string) {
    if (!adminSession || !canManageTeams) return
    const approvalNote = window.prompt(`审批启用积分等级“${name}”的说明：`, '等级与负责人资格已复核')
    if (!approvalNote?.trim()) return
    setLoading(true); setError('')
    try { await activateAdminUserGradeLevel(adminSession.sessionToken, id, approvalNote.trim()); setSuccessMessage(`已启用积分等级“${name}”。`); await loadUserGradeLevelDashboard() } catch (err) { setError(err instanceof Error ? err.message : '启用积分等级失败') } finally { setLoading(false) }
  }

  async function retireUserGradeLevel(id: number, name: string) {
    if (!adminSession || !canManageTeams || !window.confirm(`停止积分等级“${name}”？既有用户等级、团队负责人和团队关系不会被系统自动撤销。`)) return
    setLoading(true); setError('')
    try { await retireAdminUserGradeLevel(adminSession.sessionToken, id); setSuccessMessage(`已停止积分等级“${name}”。`); await loadUserGradeLevelDashboard() } catch (err) { setError(err instanceof Error ? err.message : '停止积分等级失败') } finally { setLoading(false) }
  }

  async function loadTokenPointConversionDashboard() {
    if (!adminSession || !canManageTeams) return
    setLoading(true); setError('')
    try {
      const dashboard = await getAdminTokenPointConversionDashboard(adminSession.sessionToken)
      setTokenPointConversionDashboard(dashboard)
      setTokenPointConversionValues(Object.fromEntries(dashboard.conversions.map((conversion) => [conversion.platformCode, conversion.pointsPerToken == null ? '' : String(conversion.pointsPerToken)])))
    }
    catch (err) { setError(err instanceof Error ? err.message : '读取代币积分换算配置失败') }
    finally { setLoading(false) }
  }

  function requestSaveTokenPointConversion(platformCode: string, tokenUnit: string) {
    const pointsPerToken = tokenPointConversionValues[platformCode]?.trim() ?? ''
    if (!pointsPerToken || !Number.isFinite(Number(pointsPerToken)) || Number(pointsPerToken) < 0) { setError('请填写不小于 0 的积分换算比例。'); return }
    setError(''); setTokenPointConversionSaveTarget({ platformCode, tokenUnit, pointsPerToken })
  }

  async function confirmSaveTokenPointConversion() {
    if (!adminSession || !canManageTeams || !tokenPointConversionSaveTarget) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await saveAdminTokenPointConversion(adminSession.sessionToken, tokenPointConversionSaveTarget.platformCode, { platformCode: tokenPointConversionSaveTarget.platformCode, pointsPerToken: Number(tokenPointConversionSaveTarget.pointsPerToken) })
      setTokenPointConversionSaveTarget(null); setSuccessMessage(`已保存 ${tokenPointConversionSaveTarget.platformCode} 的长期代币积分换算。`); await loadTokenPointConversionDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : '保存代币积分换算失败') } finally { setLoading(false) }
  }

  async function evaluateUserGrade() {
    if (!adminSession || !canManageTeams || !Number(userGradeEvaluationForm.userId)) { setError('请输入需要复核的用户 ID。'); return }
    setLoading(true); setError('')
    try { const result = await evaluateAdminUserGrade(adminSession.sessionToken, Number(userGradeEvaluationForm.userId), userGradeEvaluationForm.platformCode); setSuccessMessage(result.length ? `已完成用户等级复核：${result.map((item) => `${item.gradeCode} ${item.status}`).join('；')}` : '该用户当前没有匹配的已启用等级规则。'); await loadUserGradeDashboard() } catch (err) { setError(err instanceof Error ? err.message : '用户等级复核失败') } finally { setLoading(false) }
  }

  async function loadOperatingDividendGuildDirectory(platform = operatingDividendForm.platformCode) {
    if (!adminSession) return
    setOperatingDividendGuildDirectory(null)
    setOperatingDividendGuildDirectoryLoading(true)
    setError('')
    try { setOperatingDividendGuildDirectory(await getAdminPlatformGuildDirectory(adminSession.sessionToken, platform as 'LINKY' | 'TIMO')) }
    catch (err) { setOperatingDividendGuildDirectory(null); setError(err instanceof Error ? err.message : '加载权威公会目录失败') }
    finally { setOperatingDividendGuildDirectoryLoading(false) }
  }

  function openOperatingDividendDialog() {
    setOperatingDividendForm({ platformCode: 'TIMO', countryCode: 'BR', guildIds: [], requiredValidStarts: '1', requiredWithdrawEligible: '0', requiredActive7d: '0', profitShareRate: '0.05', effectiveFrom: '', effectiveTo: '' })
    setIsOperatingDividendGuildPickerOpen(false)
    setIsOperatingDividendDialogOpen(true)
    void loadOperatingDividendGuildDirectory('TIMO')
  }

  async function saveOperatingDividendPolicy() {
    if (!adminSession || !canManageOperatingDividends) return
    if (!operatingDividendForm.effectiveFrom || !operatingDividendForm.requiredValidStarts || !operatingDividendForm.profitShareRate) { setError('请填写生效时间、有效启动门槛和分红比例。'); return }
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const created = await createAdminOperatingDividendPolicies(adminSession.sessionToken, {
        platformCode: operatingDividendForm.platformCode,
        countryCode: operatingDividendForm.countryCode,
        guildIds: operatingDividendForm.guildIds,
        requiredValidStarts: Number(operatingDividendForm.requiredValidStarts),
        requiredWithdrawEligible: Number(operatingDividendForm.requiredWithdrawEligible),
        requiredActive7d: Number(operatingDividendForm.requiredActive7d),
        profitShareRate: Number(operatingDividendForm.profitShareRate),
        effectiveFrom: new Date(operatingDividendForm.effectiveFrom).toISOString().slice(0, 19),
        effectiveTo: operatingDividendForm.effectiveTo ? new Date(operatingDividendForm.effectiveTo).toISOString().slice(0, 19) : null,
      })
      setIsOperatingDividendDialogOpen(false)
      setIsOperatingDividendGuildPickerOpen(false)
      setSuccessMessage(`已建立 ${created.length} 条运营分红影子规则草稿，待审批启用；不会产生奖励、余额或付款。`)
      await loadOperatingDividendDashboard()
    } catch (err) { setError(formatOperatingDividendError(err instanceof Error ? err.message : '建立运营分红规则失败')) }
    finally { setLoading(false) }
  }

  async function handleActivateOperatingDividendPolicy(id: number, code: string) {
    if (!adminSession || !canManageOperatingDividends) return
    const approvalNote = window.prompt(`确认启用 ${code}？仅进入运营分红影子演算，请填写审批说明：`, '业务与财务复核通过')
    if (!approvalNote?.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try { await activateAdminOperatingDividendPolicy(adminSession.sessionToken, id, approvalNote.trim()); setSuccessMessage(`已启用运营分红影子规则 ${code}；不会发奖。`); await loadOperatingDividendDashboard() }
    catch (err) { setError(formatOperatingDividendError(err instanceof Error ? err.message : '启用运营分红规则失败')) }
    finally { setLoading(false) }
  }

  async function handleRetireOperatingDividendPolicy(id: number, code: string) {
    if (!adminSession || !canManageOperatingDividends || !window.confirm(`停止 ${code}？不会改动任何历史运营分红影子账本。`)) return
    setLoading(true); setError(''); setSuccessMessage('')
    try { await retireAdminOperatingDividendPolicy(adminSession.sessionToken, id); setSuccessMessage(`已停止运营分红影子规则 ${code}。`); await loadOperatingDividendDashboard() }
    catch (err) { setError(err instanceof Error ? err.message : '停止运营分红规则失败') }
    finally { setLoading(false) }
  }

  async function loadMentorAssignedStudents(mentorUserId: number) {
    if (!adminSession) return
    setMentorAssignedStudentsLoading(true)
    try { setMentorAssignedStudents(await getAdminMentorAssignedStudents(adminSession.sessionToken, mentorUserId)) }
    catch (err) { setMentorAssignedStudents([]); setError(err instanceof Error ? err.message : '读取导师当前学员失败') }
    finally { setMentorAssignedStudentsLoading(false) }
  }

  function openMentorAssignmentDialog(mentor: MentorIncentiveDashboardResponse['mentors'][number]) {
    setMentorAssignmentForm({ studentUserId: '', mentorUserId: String(mentor.userId), reason: '' })
    setMentorAssignedStudents([])
    setMentorAssignmentTarget(mentor)
    void loadMentorAssignedStudents(mentor.userId)
  }

  function openMentorQualificationDialog(mentor?: MentorIncentiveDashboardResponse['mentors'][number]) {
    const countryCode = mentor?.countryCode ?? 'BR'
    setMentorQualificationTarget(mentor ?? null)
    setMentorQualificationForm({
      userId: mentor ? String(mentor.userId) : '',
      countryCode,
      languageCode: mentorQualificationLanguage(countryCode).code,
      maxActiveStudents: mentor ? String(mentor.maxActiveStudents) : '20',
    })
    setIsMentorQualificationDialogOpen(true)
  }

  async function loadMentorRuleGuildDirectory(platform = mentorRuleForm.platformCode) {
    if (!adminSession) return
    setMentorRuleGuildDirectoryLoading(true)
    setError('')
    try { setMentorRuleGuildDirectory(await getAdminPlatformGuildDirectory(adminSession.sessionToken, platform as 'LINKY' | 'TIMO')) }
    catch (err) { setMentorRuleGuildDirectory(null); setError(err instanceof Error ? err.message : '加载权威公会目录失败') }
    finally { setMentorRuleGuildDirectoryLoading(false) }
  }

  async function saveMentorIncentiveRule() {
    if (!adminSession || !canManageMentorRules) return
    if (!mentorRuleForm.amountMinor || !mentorRuleForm.effectiveFrom) { setError('请填写固定奖励额度和生效时间。'); return }
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      const created = await createAdminMentorIncentiveRules(adminSession.sessionToken, {
        milestoneCode: mentorRuleForm.milestoneCode, platformCode: mentorRuleForm.platformCode, countryCode: mentorRuleForm.countryCode,
        guildIds: mentorRuleForm.guildIds, amountMinor: Number(mentorRuleForm.amountMinor), currencyCode: 'DIAMOND',
        freezeDays: Number(mentorRuleForm.freezeDays), effectiveFrom: new Date(mentorRuleForm.effectiveFrom).toISOString().slice(0, 19),
        effectiveTo: mentorRuleForm.effectiveTo ? new Date(mentorRuleForm.effectiveTo).toISOString().slice(0, 19) : null,
      })
      setIsMentorRuleDialogOpen(false); setIsMentorRuleGuildPickerOpen(false); setSuccessMessage(`已建立 ${created.length} 条待审导师分成规则；仅可用于影子账本核验，不会创建奖励、余额或付款。`); await loadMentorIncentiveDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : '建立导师分成规则失败') }
    finally { setLoading(false) }
  }

  async function handleQualifyMentor(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); if (!adminSession || !canManageMentorRelations) return
    const qualificationTarget = mentorQualificationTarget
    setLoading(true); setError(''); setSuccessMessage('')
    try { const result = await qualifyAdminMentor(adminSession.sessionToken, Number(mentorQualificationForm.userId), { countryCode: mentorQualificationForm.countryCode, languageCode: mentorQualificationForm.languageCode, maxActiveStudents: Number(mentorQualificationForm.maxActiveStudents) }); setIsMentorQualificationDialogOpen(false); setMentorQualificationTarget(null); setSuccessMessage(qualificationTarget ? `导师 ${result.userId} 的资格已更新，最多可带 ${result.maxActiveStudents} 名学员。` : `用户 ${result.userId} 已具备导师资格，最多可带 ${result.maxActiveStudents} 名学员。`); await loadMentorIncentiveDashboard() }
    catch (err) { setError(err instanceof Error ? err.message : '设置导师资格失败') }
    finally { setLoading(false) }
  }

  async function handleAssignMentor(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); if (!adminSession || !canManageMentorRelations || !mentorAssignmentTarget) return
    setLoading(true); setError(''); setSuccessMessage('')
    try { const result = await assignAdminMentor(adminSession.sessionToken, Number(mentorAssignmentForm.studentUserId), { mentorUserId: mentorAssignmentTarget.userId, reason: mentorAssignmentForm.reason }); setMentorAssignmentForm({ studentUserId: '', mentorUserId: String(mentorAssignmentTarget.userId), reason: '' }); setSuccessMessage(`已将学员 ${result.userId} 归属给导师 ${result.mentorUserId}，关系版本 ${result.version} 已留痕。`); await Promise.all([loadMentorIncentiveDashboard(), loadMentorAssignedStudents(mentorAssignmentTarget.userId)]) }
    catch (err) { setError(err instanceof Error ? err.message : '分配导师失败') }
    finally { setLoading(false) }
  }

  async function handleSavePlatformVerificationMock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminSession || !canManagePlatformMocks || !platformVerificationRuntime?.mockManagementEnabled) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const saved = await saveAdminPlatformVerificationMock(adminSession.sessionToken, {
        platformCode: platformVerificationMockForm.platformCode.trim().toUpperCase(),
        platformUserId: platformVerificationMockForm.platformUserId.trim(),
        globallySeenBeforeSubmission: platformVerificationMockForm.globallySeenBeforeSubmission,
        joinedTargetGuild: platformVerificationMockForm.joinedTargetGuild,
        officialGuildId: platformVerificationMockForm.officialGuildId.trim(),
        officialJoinedAt: new Date(platformVerificationMockForm.officialJoinedAt).toISOString(),
        sourceReference: platformVerificationMockForm.sourceReference.trim() || undefined,
        enabled: platformVerificationMockForm.enabled,
      })
      setPlatformVerificationMocks((current) => {
        const existing = current || []
        return [...existing.filter((item) => item.id !== saved.id), saved]
          .sort((left, right) => `${left.platformCode}:${left.platformUserId}`.localeCompare(`${right.platformCode}:${right.platformUserId}`))
      })
      setSuccessMessage(`本地 Mock 核验记录已保存：${saved.platformCode} / ${saved.platformUserId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存本地 Mock 核验记录失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveGuildConfig() {
    if (!adminSession || !guildConfigForm.productCode.trim() || !guildConfigForm.guildId.trim() || !guildConfigForm.guildInviteCode.trim()) return
    setGuildConfigLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const payload: GuildConfigRequest = {
        productCode: guildConfigForm.productCode.trim(),
        inviterUserId: guildConfigForm.inviterUserId.trim() ? Number(guildConfigForm.inviterUserId) : null,
        guildId: guildConfigForm.guildId.trim(),
        guildName: guildConfigForm.guildName.trim(),
        guildInviteCode: guildConfigForm.guildInviteCode.trim(),
        enabled: guildConfigForm.enabled,
      }
      const saved = await saveAdminGuildConfig(adminSession.sessionToken, payload)
      setGuildConfigs((current) => {
        const list = current || []
        const withoutSameScope = list.filter((item) => !(item.productCode === saved.productCode && item.inviterUserId === saved.inviterUserId))
        return [saved, ...withoutSameScope]
      })
      setSuccessMessage(`公会配置已保存：${saved.productCode} / ${saved.inviterUserId ?? '默认公会'} → ${saved.guildInviteCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存公会配置失败')
    } finally {
      setGuildConfigLoading(false)
    }
  }

  async function handleLoadOwnership() {
    if (!adminSession || !ownershipQueryUserId) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const queriedUserId = Number(ownershipQueryUserId)
      const ownership = await getAdminOwnership(adminSession.sessionToken, queriedUserId)
      setAdminOwnership(ownership)
      setRelationQueryUserId(String(queriedUserId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载产品归属失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadJointWorkbench() {
    if (!adminSession || !ownershipQueryUserId.trim()) return
    const queriedUserId = Number(ownershipQueryUserId)
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const jointAuditQuery = { ...auditQuery, moduleName: '', page: '0' }
      const [ownership, relation, audit] = await Promise.all([
        getAdminOwnership(adminSession.sessionToken, queriedUserId),
        getAdminRelation(adminSession.sessionToken, queriedUserId, activeAdminProductCode),
        getAdminAuditLogs(adminSession.sessionToken, {
          moduleName: jointAuditQuery.moduleName || undefined,
          page: Number(jointAuditQuery.page || 0),
          size: Number(jointAuditQuery.size || 5),
        }),
      ])
      setAdminOwnership(ownership)
      setAdminRelation(relation)
      setRelationBeforeAdjust(relation)
      setRelationAdjustInviterId(relation.level1InviterId ? String(relation.level1InviterId) : '')
      setRelationAdjustNote('')
      setRelationQueryUserId(String(queriedUserId))
      setAuditQuery(jointAuditQuery)
      setAuditLogs(audit)
      setShowAdvancedOps(true)
      setSuccessMessage('ownership、绑定关系和联合审计已经一次性同步完成。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '一键联合查询失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSyncOwnershipRelation() {
    const targetUserId = adminOwnership?.userId ?? (ownershipQueryUserId.trim() ? Number(ownershipQueryUserId) : null)
    if (!adminSession || !targetUserId) return
    setRelationQueryUserId(String(targetUserId))
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const relation = await getAdminRelation(adminSession.sessionToken, targetUserId, activeAdminProductCode)
      setAdminRelation(relation)
      setRelationBeforeAdjust(relation)
      setRelationAdjustInviterId(relation.level1InviterId ? String(relation.level1InviterId) : '')
      setRelationAdjustNote('')
      setSuccessMessage('当前用户的产品归属和绑定关系已经同步到联合处置视图。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步绑定关系失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleCorrectOwnership() {
    if (!adminSession || !adminOwnership || !ownershipCorrectionProductCode.trim()) return
    setOwnershipCorrectionLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const updated = await correctAdminOwnership(adminSession.sessionToken, adminOwnership.userId, {
        productCode: ownershipCorrectionProductCode.trim().toUpperCase(),
        note: ownershipCorrectionNote.trim() || undefined,
      })
      setAdminOwnership(updated)
      const ownershipAuditQuery = { ...auditQuery, moduleName: 'ownership', page: '0' }
      setAuditQuery(ownershipAuditQuery)
      setShowAdvancedOps(true)
      await loadAuditLogs(ownershipAuditQuery)
      setSuccessMessage('产品归属已完成人工修正，当前归属和 ownership 审计都已同步刷新。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '人工修正产品归属失败')
    } finally {
      setOwnershipCorrectionLoading(false)
    }
  }

  function handleLoadOwnershipAudit() {
    if (!adminSession) return
    const ownershipAuditQuery = { ...auditQuery, moduleName: 'ownership', page: '0' }
    setAuditQuery(ownershipAuditQuery)
    setShowAdvancedOps(true)
    void loadAuditLogs(ownershipAuditQuery)
  }

  function handleLoadJointAudit() {
    if (!adminSession) return
    const jointAuditQuery = { ...auditQuery, moduleName: '', page: '0' }
    setAuditQuery(jointAuditQuery)
    setShowAdvancedOps(true)
    void loadAuditLogs(jointAuditQuery)
  }

  async function handleAdjustRelation() {
    if (!adminSession || !adminRelation) return
    setRelationAdjustLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const updated = await adjustAdminRelation(adminSession.sessionToken, adminRelation.userId, {
        level1InviterId: relationAdjustInviterId.trim() ? Number(relationAdjustInviterId) : undefined,
        note: relationAdjustNote.trim() || undefined,
      }, activeAdminProductCode)
      setRelationBeforeAdjust(adminRelation)
      setAdminRelation(updated)
      setRelationAdjustInviterId(updated.level1InviterId ? String(updated.level1InviterId) : '')
      const relationAuditQuery = { ...auditQuery, moduleName: 'relation', page: '0' }
      setAuditQuery(relationAuditQuery)
      await loadAuditLogs(relationAuditQuery)
      setPendingRelationChange(null)
      setSuccessMessage('关系链已完成人工修正，before / after 已更新，relation 审计也已同步刷新。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '人工修正关系链失败')
    } finally {
      setRelationAdjustLoading(false)
    }
  }

  function handleProfileCreateTokenSave() {
    localStorage.setItem(PROFILE_CREATE_TOKEN_KEY, profileCreateToken)
  }

  function updateRiskActionDraft(riskEventId: number, note: string) {
    setRiskActionDrafts((current) => ({
      ...current,
      [riskEventId]: note,
    }))
  }

  function openRiskActionConfirm(item: RiskEventListResponse['items'][number], action: RiskActionName) {
    setPendingRiskAction({
      riskEventId: item.id,
      userId: item.userId,
      riskStatus: item.riskStatus,
      action,
      note: riskActionDrafts[item.id] || '',
    })
  }

  function openRelationAdjustConfirm() {
    if (!adminRelation) return
    setPendingRelationChange({
      userId: adminRelation.userId,
      previousInviterId: adminRelation.level1InviterId,
      nextInviterId: relationAdjustInviterId.trim() ? Number(relationAdjustInviterId) : null,
      previousLevel2InviterId: adminRelation.level2InviterId,
      previousLevel3InviterId: adminRelation.level3InviterId,
      note: relationAdjustNote.trim(),
    })
  }

  const processedLinkyRequestCount = linkyWebhookLogs?.items?.filter((item) => item.requestStatus === 'PROCESSED').length ?? 0
  const replayedLinkyRequestCount = linkyReplayRecords?.items?.filter((item) => item.hitCount > 1).length
    ?? linkyWebhookLogs?.items?.filter((item) => item.replayRecordStatus === 'REPLAYED').length
    ?? 0

  const rewardPageLabel = adminRewards
    ? `本次命中 ${adminRewards.total} 条，当前第 ${adminRewards.page + 1} 页，每页 ${adminRewards.size} 条。`
    : '先执行一次奖励查询'
  const riskPageLabel = riskEvents
    ? `本次命中 ${riskEvents.total} 条，当前第 ${riskEvents.page + 1} 页，每页 ${riskEvents.size} 条。`
    : '先执行一次风险事件查询'
  const withdrawPageLabel = adminWithdrawRequests
    ? `共 ${adminWithdrawRequests.total} 笔 · 第 ${adminWithdrawRequests.page + 1} 页 · 每页 ${adminWithdrawRequests.size} 笔`
    : '按条件查询提现申请'
  const rewardEmptyState = buildEmptyStatePreset('reward', hasQueriedAdminRewards)
  const riskEmptyState = buildEmptyStatePreset('risk', hasQueriedRiskEvents)
  const linkyWebhookEmptyState = buildEmptyStatePreset('linky-webhook', hasQueriedLinkyWebhookLogs)
  const linkyReplayEmptyState = buildEmptyStatePreset('linky-replay', hasQueriedLinkyReplayRecords)
  const linkyDiagnosticSnapshot = buildLinkyDiagnosticSnapshot({
    hasQueried: hasQueriedLinkyWebhookLogs || hasQueriedLinkyReplayRecords,
    processedCount: processedLinkyRequestCount,
    failedCount: linkyWebhookLogs?.items?.filter((item) => item.requestStatus === 'FAILED').length ?? 0,
    rejectedCount: linkyWebhookLogs?.items?.filter((item) => item.requestStatus === 'REJECTED').length ?? 0,
    replayedCount: replayedLinkyRequestCount,
  })
  const linkyWebhookPageLabel = buildPagedResultLabel(linkyWebhookLogs ? {
    page: linkyWebhookLogs.page,
    size: linkyWebhookLogs.size,
    total: linkyWebhookLogs.total,
    subject: 'Webhook 日志',
  } : null)
  const linkyReplayPageLabel = buildPagedResultLabel(linkyReplayRecords ? {
    page: linkyReplayRecords.page,
    size: linkyReplayRecords.size,
    total: linkyReplayRecords.total,
    subject: 'Replay 记录',
  } : null)
  const hasRewardPrevPage = Number(adminRewardQuery.page) > 0
  const hasRewardNextPage = adminRewards ? (adminRewards.page + 1) * adminRewards.size < adminRewards.total : false
  const hasRiskPrevPage = Number(riskQuery.page) > 0
  const hasRiskNextPage = riskEvents ? (riskEvents.page + 1) * riskEvents.size < riskEvents.total : false
  const hasWithdrawPrevPage = Number(adminWithdrawQuery.page) > 0
  const hasWithdrawNextPage = adminWithdrawRequests ? (adminWithdrawRequests.page + 1) * adminWithdrawRequests.size < adminWithdrawRequests.total : false
  const hasLinkyWebhookPrevPage = Number(linkyWebhookQuery.page) > 0
  const hasLinkyWebhookNextPage = linkyWebhookLogs ? (linkyWebhookLogs.page + 1) * linkyWebhookLogs.size < linkyWebhookLogs.total : false
  const hasLinkyReplayPrevPage = Number(linkyReplayQuery.page) > 0
  const hasLinkyReplayNextPage = linkyReplayRecords ? (linkyReplayRecords.page + 1) * linkyReplayRecords.size < linkyReplayRecords.total : false
  const selectedWithdrawRequest = adminWithdrawRequests?.items.find((item) => item.requestNo === selectedWithdrawRequestNo) ?? null
  const selectedWithdrawIsReview = selectedWithdrawRequest?.requestStatus === 'PENDING_REVIEW'
  const selectedWithdrawIsPayment = selectedWithdrawRequest?.requestStatus === 'PAYMENT_PENDING' || selectedWithdrawRequest?.requestStatus === 'PAYMENT_FAILED'
  const selectedWithdrawIsPaid = selectedWithdrawRequest?.requestStatus === 'PAID_OUT'
  const relationPreview = adminRelation
    ? buildRelationPreview(adminRelation, relationAdjustInviterId)
    : null
  const activeOwnershipItem = adminOwnership?.items.find((item) => item.ownershipStatus === 'ACTIVE')
  const isJointWorkbenchReady = Boolean(adminOwnership || adminRelation)
  const jointAuditFocus = auditQuery.moduleName || '全部'
  const selectedLinkyTitle = selectedLinkyDrawer?.kind === 'webhook'
    ? buildLinkyWebhookHeadline(selectedLinkyDrawer.item)
    : selectedLinkyDrawer?.item.linkyOrderId
      || `Replay #${selectedLinkyDrawer?.item.id ?? ''}`
  const selectedLinkySections = selectedLinkyDrawer?.kind === 'webhook'
    ? buildLinkyWebhookDetailSections(selectedLinkyDrawer.item)
    : selectedLinkyDrawer?.kind === 'replay'
      ? buildLinkyReplayDetailSections(selectedLinkyDrawer.item)
      : []
  const selectedLinkyRelated = selectedLinkyDrawer
    ? buildLinkyRelatedContext({
        selected: selectedLinkyDrawer,
        webhookItems: linkyWebhookLogs?.items ?? [],
        replayItems: linkyReplayRecords?.items ?? [],
      })
    : null

  void [
    showAdvancedOps,
    auditLogs,
    linkyWebhookLoading,
    linkyReplayLoading,
    setOwnershipQueryUserId,
    setOwnershipCorrectionProductCode,
    setOwnershipCorrectionNote,
    ownershipCorrectionLoading,
    showingProductSpecificDiagnostics,
    handleLoadLinkyWebhookLogs,
    handleLoadLinkyReplayRecords,
    handleLinkyWebhookPageChange,
    handleLinkyReplayPageChange,
    handleCopyFingerprint,
    handleLoadRiskEvents,
    handleRiskPageChange,
    handleLoadOwnership,
    handleLoadJointWorkbench,
    handleSyncOwnershipRelation,
    handleCorrectOwnership,
    handleLoadOwnershipAudit,
    handleLoadJointAudit,
    updateRiskActionDraft,
    openRiskActionConfirm,
    riskPageLabel,
    riskEmptyState,
    linkyWebhookEmptyState,
    linkyReplayEmptyState,
    linkyDiagnosticSnapshot,
    linkyWebhookPageLabel,
    linkyReplayPageLabel,
    hasRiskPrevPage,
    hasRiskNextPage,
    hasLinkyWebhookPrevPage,
    hasLinkyWebhookNextPage,
    hasLinkyReplayPrevPage,
    hasLinkyReplayNextPage,
    activeOwnershipItem,
    isJointWorkbenchReady,
    jointAuditFocus,
    canHandleRisk,
    canIgnoreRisk,
    canFreezeRisk,
    canUnfreezeRisk,
  ]

  if (adminSessionRestoring) {
    return (
      <div className="admin-login-page">
        <section className="admin-login-shell">
          <div className="admin-login-form-panel admin-session-restoring" role="status" aria-live="polite">
            <div className="admin-login-form-head"><h1>正在恢复登录状态</h1></div>
            <p className="inline-hint">正在确认本机登录信息，请稍候。</p>
          </div>
        </section>
      </div>
    )
  }

  if (!adminSession) {
    return (
      <div className="admin-login-page">
        <section className="admin-login-shell">
          <div className="admin-login-form-panel">
            <div className="admin-login-form-head">
              <h1>分销运营后台</h1>
            </div>

            {error ? (
              <section className="alert-banner error admin-login-alert">
                <strong>登录失败</strong>
                <span>{error}</span>
              </section>
            ) : null}

            <form className="admin-login-form" onSubmit={handleAdminLogin}>
              <label>
                后台账号
                <input value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="请输入后台账号" autoComplete="username" autoFocus />
              </label>
              <label>
                登录密码
                <input className="admin-password-input" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="请输入登录密码" autoComplete="current-password" />
              </label>
              <label className="admin-remember-row">
                <input type="checkbox" checked={adminRememberMe} onChange={(e) => setAdminRememberMe(e.target.checked)} />
                <span>在本机保持登录；连续 7 天未使用后自动退出</span>
              </label>
              <button className="primary-btn admin-login-submit" type="submit" disabled={loading || !adminUsername.trim() || !adminPassword.trim()}>进入后台</button>
            </form>
          </div>
        </section>
      </div>
    )
  }

  if (adminSession.mustChangePassword) {
    return (
      <div className="admin-login-page">
        <section className="admin-login-shell"><div className="admin-login-form-panel">
          <div className="admin-login-form-head"><h1>首次登录，请修改密码</h1></div>
          {error ? <section className="alert-banner error admin-login-alert"><strong>修改失败</strong><span>{error}</span></section> : null}
          <form className="admin-login-form" onSubmit={handleChangeAdminPassword} autoComplete="off">
            <label>临时密码<input type="password" name="temporary-admin-password" autoComplete="new-password" value={adminPasswordForm.currentPassword} onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: e.target.value })} /></label>
            <label>新密码<input type="password" autoComplete="new-password" value={adminPasswordForm.newPassword} onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })} /></label>
            <label>确认新密码<input type="password" autoComplete="new-password" value={adminPasswordForm.confirmPassword} onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })} /></label>
            <p className="inline-hint">请手动输入临时密码；新密码至少 8 位，且须同时包含英文字符和数字。</p>
            <button className="primary-btn admin-login-submit" type="submit">修改密码并重新登录</button>
            <button className="ghost-btn" type="button" onClick={() => { void handleAdminLogout() }}>返回账号密码登录</button>
          </form>
        </div></section>
      </div>
    )
  }

  return (
    <div className="page-shell admin-console-page admin-console-v3">
      <header className="admin-topbar">
        <div className="admin-page-heading">
          <p className="eyebrow">运营后台</p>
          <h1>{['userGradeList', 'advancedGradeAcceptance', 'userGradeFacts'].includes(activeAdminSection) ? '用户等级' : ['users', 'bindings', 'riskQueue'].includes(activeAdminSection) ? '用户管理' : isFinanceManagementSection ? '财务管理' : isSystemConfigSection ? '配置中心' : isSystemManagementSection ? '系统管理' : adminSectionLinks.find((item) => item.href === ADMIN_SECTION_HASHES[activeAdminSection])?.label}</h1>
        </div>
        <div className="hero-actions">
          <label className="hero-select-field">
            当前产品
            <select value={adminProduct} onChange={(e) => setAdminProduct(e.target.value as AdminProductKey)}>
              {ADMIN_PRODUCT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <div className="admin-account-chip">
            <UserCircle size={28} weight="duotone" />
            <span><strong>{adminSession.displayName}</strong><small>{formatAdminRole(adminSession.role)}</small></span>
          </div>
          <button className="ghost-btn" onClick={handleAdminLogout}>退出</button>
        </div>
      </header>

      {error ? (
        <section className="alert-banner error" role="alert">
          <strong>操作失败</strong>
          <span>{error}</span>
        </section>
      ) : successMessage ? (
        <section className="alert-banner info" role="status" aria-live="polite">
          <strong>已更新</strong>
          <span>{successMessage}</span>
        </section>
      ) : null}

      <aside className="admin-sidebar">
        <div className="admin-nav-strip" id="admin-modules" aria-label="后台模块导航">
          {adminSectionLinks.map((item) => item.href === ADMIN_SECTION_HASHES.users ? (
            <div className="admin-nav-group" key={item.label}>
              <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${['users', 'bindings', 'riskQueue'].includes(activeAdminSection) ? 'is-active' : ''}`} aria-expanded={isUserManagementNavOpen} onClick={() => setIsUserManagementNavOpen((open) => !open)}>
                <AdminNavIcon label={item.label} />
                <span>{item.label}</span><span className="admin-nav-group-caret">{isUserManagementNavOpen ? '⌄' : '›'}</span>
              </button>
              {isUserManagementNavOpen ? <div className="admin-nav-submenu" aria-label="用户管理子菜单">
                <a className={`admin-nav-subitem ${activeAdminSection === 'users' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.users} onClick={() => void loadUserPlatformProfiles()}>用户列表</a>
                <a className={`admin-nav-subitem ${activeAdminSection === 'bindings' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.bindings}>绑定管理</a>
                <a className={`admin-nav-subitem ${activeAdminSection === 'riskQueue' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.riskQueue} onClick={() => { if (!riskEvents) void handleLoadRiskEvents() }}>风险队列{riskEvents?.total ? ` · ${riskEvents.total}` : ''}</a>
              </div> : null}
            </div>
          ) : item.href === ADMIN_SECTION_HASHES.userGradeList ? (
            <div className="admin-nav-group" key={item.label}>
              <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${['userGradeList', 'advancedGradeAcceptance', 'userGradeFacts'].includes(activeAdminSection) ? 'is-active' : ''}`} aria-expanded={isUserGradeNavOpen} onClick={() => setIsUserGradeNavOpen((open) => !open)}>
                <AdminNavIcon label={item.label} />
                <span>{item.label}</span><span className="admin-nav-group-caret">{isUserGradeNavOpen ? '⌄' : '›'}</span>
              </button>
              {isUserGradeNavOpen ? <div className="admin-nav-submenu" aria-label="用户等级子菜单">
                <a className={`admin-nav-subitem ${activeAdminSection === 'userGradeList' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.userGradeList} onClick={() => { if (!userGradeDashboard) void loadUserGradeDashboard() }}>用户等级列表</a>
                <a className={`admin-nav-subitem ${activeAdminSection === 'advancedGradeAcceptance' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.advancedGradeAcceptance} onClick={() => { if (!userGradeAdvancementReviews.length) void loadUserGradeAdvancementReviews() }}>高阶经营验收</a>
                <a className={`admin-nav-subitem ${activeAdminSection === 'userGradeFacts' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.userGradeFacts} onClick={() => { if (!userGradeDashboard) void loadUserGradeDashboard(); if (!userPointDashboard) void loadUserPointDashboard(); if (canReadEffectiveUsers) void loadEffectiveUserQualifications() }}>资格事实与复核</a>
              </div> : null}
            </div>
          ) : item.href === ADMIN_SECTION_HASHES.rewards ? (
            <div className="admin-nav-group" key={item.label}>
              <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${isFinanceManagementSection ? 'is-active' : ''}`} aria-expanded={isFinanceManagementNavOpen} onClick={() => setIsFinanceManagementNavOpen((open) => !open)}>
                <AdminNavIcon label={item.label} />
                <span>{item.label}</span><span className="admin-nav-group-caret">{isFinanceManagementNavOpen ? '⌄' : '›'}</span>
              </button>
              {isFinanceManagementNavOpen ? <div className="admin-nav-submenu" aria-label="财务管理子菜单">
                {visibleFinanceSections.includes('rewards') ? <a className={`admin-nav-subitem ${activeAdminSection === 'rewards' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.rewards}>收益提现</a> : null}
                {visibleFinanceSections.includes('commissionPolicies') ? <a className={`admin-nav-subitem ${activeAdminSection === 'commissionPolicies' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.commissionPolicies} onClick={() => { if (!commissionPolicies) void loadCommissionPolicies() }}>邀请裂变分成</a> : null}
                {visibleFinanceSections.includes('tokenPointConversions') ? <a className={`admin-nav-subitem ${activeAdminSection === 'tokenPointConversions' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.tokenPointConversions} onClick={() => { if (!tokenPointConversionDashboard) void loadTokenPointConversionDashboard() }}>代币积分兑换</a> : null}
              </div> : null}
            </div>
          ) : item.href === ADMIN_SECTION_HASHES.accounts ? (
            <div className="admin-nav-group" key={item.label}>
              <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${isSystemManagementSection ? 'is-active' : ''}`} aria-expanded={isSystemManagementNavOpen} onClick={() => setIsSystemManagementNavOpen((open) => !open)}>
                <AdminNavIcon label={item.label} />
                <span>{item.label}</span><span className="admin-nav-group-caret">{isSystemManagementNavOpen ? '⌄' : '›'}</span>
              </button>
              {isSystemManagementNavOpen ? <div className="admin-nav-submenu" aria-label="系统管理子菜单">
                {adminSession.role.toLowerCase() === 'super_admin' ? <a className={`admin-nav-subitem ${activeAdminSection === 'accountManagement' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.accountManagement} onClick={() => void handleLoadAdminIdentityCenter()}>账号管理</a> : null}
                <a className={`admin-nav-subitem ${activeAdminSection === 'mySecurity' || activeAdminSection === 'accounts' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.mySecurity} onClick={() => void handleLoadAdminIdentityCenter()}>我的安全</a>
                <a className={`admin-nav-subitem ${activeAdminSection === 'securityRecords' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.securityRecords} onClick={() => void handleLoadAdminIdentityCenter()}>安全记录</a>
              </div> : null}
            </div>
          ) : item.href === ADMIN_SECTION_HASHES.settings ? (
            <div className="admin-nav-group" key={item.label}>
              <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${isSystemConfigSection ? 'is-active' : ''}`} aria-expanded={isSystemConfigNavOpen} onClick={() => setIsSystemConfigNavOpen((open) => !open)}>
                <AdminNavIcon label={item.label} />
                <span>{item.label}</span><span className="admin-nav-group-caret">{isSystemConfigNavOpen ? '⌄' : '›'}</span>
              </button>
              {isSystemConfigNavOpen ? <div className="admin-nav-submenu" aria-label="配置中心子菜单">
                <a className={`admin-nav-subitem ${activeAdminSection === 'systemExperiment' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemExperiment}>100 人实验</a>
                <a className={`admin-nav-subitem ${activeAdminSection === 'systemGuilds' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemGuilds}>公会配置</a>
                <a className={`admin-nav-subitem ${activeAdminSection === 'systemPlatforms' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemPlatforms} onClick={() => { if (!platformIntegrations) void loadPlatformIntegrations(); if (!platformVerificationRuntime) void loadPlatformVerificationRuntime() }}>平台接入</a>
                {canRunControlledIncome ? <><a className={`admin-nav-subitem ${activeAdminSection === 'systemIncomeControlled' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemIncomeControlled}>收入受控联调</a><a className={`admin-nav-subitem ${activeAdminSection === 'systemIncomeShadow' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemIncomeShadow}>收入影子账本</a></> : null}
                {canManagePlatformMocks ? <a className={`admin-nav-subitem ${activeAdminSection === 'systemMockVerification' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemMockVerification} onClick={() => void loadPlatformVerificationRuntime(true)}>本地 Mock 核验</a> : null}
                <a className={`admin-nav-subitem ${activeAdminSection === 'systemAdvanced' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemAdvanced}>高级接入</a>
                {canManageSeedInviters ? <a className={`admin-nav-subitem ${activeAdminSection === 'systemSeedInviter' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemSeedInviter} onClick={() => { if (!seedInviters) void loadSeedInviters() }}>种子邀请人</a> : null}
                {canAuditPhoneVerification ? <a className={`admin-nav-subitem ${activeAdminSection === 'systemPhoneVerification' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemPhoneVerification}>验证码审查</a> : null}
              </div> : null}
            </div>
          ) : (
            <a key={item.label} className={`admin-nav-chip ${item.href === ADMIN_SECTION_HASHES[activeAdminSection] ? 'is-active' : ''}`} href={item.href} aria-current={item.href === ADMIN_SECTION_HASHES[activeAdminSection] ? 'page' : undefined} onClick={() => {
              if (item.href === ADMIN_SECTION_HASHES.platformGuildDirectory && !platformGuildDirectory) void loadPlatformGuildDirectory()
              if (item.href === ADMIN_SECTION_HASHES.commissionPolicies && !commissionPolicies) void loadCommissionPolicies()
              if (item.href === ADMIN_SECTION_HASHES.mentorDirectory && !mentorIncentiveDashboard) void loadMentorIncentiveDashboard()
              if (item.href === ADMIN_SECTION_HASHES.teams && !teamManagementDashboard) void loadTeamManagementDashboard()
              if (item.href === ADMIN_SECTION_HASHES.tokenPointConversions && !tokenPointConversionDashboard) void loadTokenPointConversionDashboard()
            }}>
              <AdminNavIcon label={item.label} />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
        <div className="admin-environment"><span />{window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '本地环境' : '生产环境'}</div>
      </aside>

      <div className="console-layout admin-layout admin-workspace-shell">
        <main className="console-main">
          {isSystemManagementSection ? (
            <div className="stack-gap" id="admin-accounts">
              <PanelSection eyebrow="System management" title={currentAccountView === 'staff' ? '账号管理' : currentAccountView === 'audit' ? '安全记录' : '我的安全'} description={currentAccountView === 'staff' ? '管理运营后台账号、角色与数据范围。' : currentAccountView === 'audit' ? '查看当前账号的安全事件记录。' : '管理当前账号的密码和登录设备。'} action={<button className="primary-btn" onClick={() => void handleLoadAdminIdentityCenter()} disabled={loading}>刷新页面数据</button>}>
                {currentAccountView === 'security' ? <div className="admin-account-section">
                <div className="content-grid two-columns entity-grid">
                  <InfoCard title="修改我的密码" tone="neutral">
                    <InfoRow label="密码到期时间" value={adminSession.passwordExpiresAt ? formatDateTime(adminSession.passwordExpiresAt) : '未设置'} />
                    <form className="grid-form compact-form" onSubmit={handleChangeAdminPassword}>
                      <label>当前密码<input type="password" autoComplete="current-password" value={adminPasswordForm.currentPassword} onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: e.target.value })} /></label>
                      <label>新密码<input type="password" autoComplete="new-password" value={adminPasswordForm.newPassword} onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })} /></label>
                      <label>确认新密码<input type="password" autoComplete="new-password" value={adminPasswordForm.confirmPassword} onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })} /></label>
                      <p className="inline-hint">新密码至少 8 位，且须同时包含英文字符和数字。</p>
                      <button className="primary-btn small-btn" type="submit">修改并退出全部设备</button>
                    </form>
                  </InfoCard>
                </div>
                <InfoCard title="本机与其他登录设备" tone="neutral">
                  <div className="table-toolbar"><button className="ghost-btn small-btn" onClick={() => void handleLogoutAllAdminDevices()}>退出全部设备</button></div>
                  <DataTable headers={['设备', '最近使用', '到期时间', '网络地址', '状态', '操作']} rows={adminDevices.map((item) => [item.userAgent || '未知设备', formatDateTime(item.lastSeenAt), formatDateTime(item.expiresAt), item.ipAddress || '-', item.current ? '本机' : item.rememberMe ? '保持登录' : '普通会话', <button className="ghost-btn small-btn" onClick={() => void handleRevokeAdminDevice(item.id)}>退出</button>])} emptyText="刷新后查看当前登录设备" />
                </InfoCard>
                </div> : null}
                {currentAccountView === 'staff' && adminSession.role.toLowerCase() === 'super_admin' ? (
                  <div className="admin-account-section">
                    <InfoCard title="新增员工账号" tone="success">
                      <form className="grid-form compact-form exception-filter-grid" onSubmit={handleCreateAdminAccount}>
                        <label>登录账号<input required value={adminAccountForm.username} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, username: e.target.value })} /></label>
                        <label>员工姓名<input required value={adminAccountForm.displayName} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, displayName: e.target.value })} /></label>
                        <label>角色<select value={adminAccountForm.role} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, role: e.target.value })}>{ADMIN_ROLE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                        <label>平台范围<input value={adminAccountForm.platformScope} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, platformScope: e.target.value })} placeholder="* / TIMO,LINKY" /></label>
                        <label>公会范围<input value={adminAccountForm.guildScope} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, guildScope: e.target.value })} placeholder="* / guild ids" /></label>
                        <label>地区范围<input value={adminAccountForm.regionScope} onChange={(e) => setAdminAccountForm({ ...adminAccountForm, regionScope: e.target.value })} placeholder="* / BR,MX,ID" /></label>
                        <button className="primary-btn small-btn" type="submit">创建员工账号</button>
                      </form>
                      {adminTemporaryPassword ? <div className="alert-banner info top-gap"><strong>一次性临时密码</strong><code>{adminTemporaryPassword}</code><button className="ghost-btn small-btn" onClick={() => navigator.clipboard.writeText(adminTemporaryPassword)}>复制</button></div> : null}
                    </InfoCard>
                    <InfoCard title="员工账号" tone="neutral">
                      <DataTable headers={['账号/姓名', '角色', '平台/公会/地区', '安全状态', '最近登录', '操作']} rows={adminAccounts.map((account, index) => [
                        <div className="stack-gap small"><strong>{account.username}</strong><input value={account.displayName} onChange={(e) => setAdminAccounts((items) => items.map((item, i) => i === index ? { ...item, displayName: e.target.value } : item))} /></div>,
                        <select value={account.role} onChange={(e) => setAdminAccounts((items) => items.map((item, i) => i === index ? { ...item, role: e.target.value } : item))}>{ADMIN_ROLE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>,
                        <div className="stack-gap small"><input value={account.platformScope} onChange={(e) => setAdminAccounts((items) => items.map((item, i) => i === index ? { ...item, platformScope: e.target.value } : item))} /><input value={account.guildScope} onChange={(e) => setAdminAccounts((items) => items.map((item, i) => i === index ? { ...item, guildScope: e.target.value } : item))} /><input value={account.regionScope} onChange={(e) => setAdminAccounts((items) => items.map((item, i) => i === index ? { ...item, regionScope: e.target.value } : item))} /></div>,
                        <span>{account.enabled ? '已启用' : '已停用'} · {account.lockedUntil ? `锁定至 ${formatDateTime(account.lockedUntil)}` : '未锁定'} · {account.activeSessions} 台设备</span>,
                        formatDateTime(account.lastLoginAt || undefined),
                        <div className="action-row"><button className="ghost-btn small-btn" onClick={() => setPendingAdminAccountAction({ account, action: 'save' })}>保存</button><button className="ghost-btn small-btn" onClick={() => setPendingAdminAccountAction({ account, action: 'toggle' })}>{account.enabled ? '停用' : '恢复'}</button>{account.lockedUntil ? <button className="ghost-btn small-btn" onClick={() => setPendingAdminAccountAction({ account, action: 'unlock' })}>解锁</button> : null}<button className="ghost-btn small-btn" onClick={() => setPendingAdminAccountAction({ account, action: 'reset' })}>重置密码</button></div>,
                      ])} emptyText="点击“刷新页面数据”加载员工账号" />
                    </InfoCard>
                  </div>
                ) : null}
                {currentAccountView === 'audit' ? <div className="admin-account-section"><InfoCard title="最近安全事件" tone="neutral"><DataTable headers={['时间', '事件', '结果', '网络地址', '说明']} rows={adminSecurityEvents.map((item) => [formatDateTime(item.occurredAt), item.eventType, item.success ? '成功' : '失败', item.ipAddress || '-', item.detail || '-'])} emptyText="刷新后查看最近安全事件" /></InfoCard></div> : null}
              </PanelSection>
            </div>
          ) : null}
          {isSystemConfigSection && currentSettingsView === 'platforms' ? (
            <PanelSection
              sectionId="admin-platform-integrations"
              eyebrow="Platform integration"
              title="平台接入配置"
              description="平台账号主标识、公会范围和收益处理模式。Timo 当前仅允许保存事实与影子计算，不会触发真实发奖。"
              action={<button className="primary-btn" onClick={() => void loadPlatformIntegrations()} disabled={loading}>{loading ? '刷新中…' : '刷新配置'}</button>}
            >
              <div className="stack-gap">
                {platformVerificationRuntime ? <InfoCard title={`核验通道 · ${platformVerificationRuntime.source}`} tone={platformVerificationRuntime.source === 'MOCK' ? 'success' : 'neutral'}>
                  <div className="relation-grid">
                    <RelationItem label="有效数据源" value={platformVerificationRuntime.source} />
                    <RelationItem label="Mock 管理" value={platformVerificationRuntime.mockManagementEnabled ? '可用（仅本地 / 测试）' : '不可用'} />
                  </div>
                  <InlineHint text={platformVerificationRuntime.explanation} />
                </InfoCard> : null}
                {(platformIntegrations ?? []).map((platform) => (
                  <InfoCard key={platform.platformCode} title={`${platform.displayName} · ${platform.enabled ? '已启用' : '已停用'}`} tone={platform.platformCode === 'TIMO' ? 'success' : 'neutral'}>
                    <div className="relation-grid">
                      <RelationItem label="平台代码" value={platform.platformCode} />
                      <RelationItem label="账号主标识" value={platform.primaryAccountIdentifier} />
                      <RelationItem label="MCN 接入状态" value={platform.mcnIntegrationStatus} />
                      <RelationItem label="收益接入模式" value={platform.revenueIngestionMode} />
                      <RelationItem label="奖励模式" value={platform.rewardMode} />
                    </div>
                    <InlineHint text={platform.accountIdentifierNote} />
                    <DataTable
                      headers={['国家', '官方公会 ID', '公会名称', 'MCN 目录状态', '当前公司比例', '操作']}
                      rows={platform.targetGuilds.map((guild) => {
                        const editable = guild.authoritative && guild.directoryStatus === 'NORMAL' && ['ACTIVE', 'ENABLED'].includes(guild.guildStatus.toUpperCase())
                        return [guild.countryCode, guild.officialGuildId, guild.guildName, `${guild.directoryStatus} / ${guild.guildStatus}`, guild.operatingShareRate == null ? '未配置' : `${(guild.operatingShareRate * 100).toFixed(2)}%`, editable ? <button key={`${platform.platformCode}:${guild.officialGuildId}-edit`} className="ghost-btn small-btn" disabled={loading || !canRunControlledIncome} onClick={() => void openPlatformGuildShareDialog(platform.platformCode, guild.officialGuildId, guild.guildName)}>编辑分成</button> : '仅可配置 MCN 正常且启用的公会']
                      })}
                      emptyText="MCN 权威公会目录暂无数据；请检查公会目录同步状态。"
                    />
                    <InlineHint text="此处显示 MCN 权威公会目录。公司分成比例按版本、审批与生效时间管理；收入候选只会读取收入发生时已启用的比例快照。它不改变 MCN 原始收入，也不会产生发奖。" />
                  </InfoCard>
                ))}
                {!platformIntegrations ? <EmptyState title="平台配置待加载" description="进入本页会自动加载；也可以点击刷新配置。" /> : null}
                {platformIntegrations?.length === 0 ? <EmptyState title="尚未初始化平台配置" description="本地环境请重启后端完成初始配置；生产环境请检查数据库迁移是否完成。" /> : null}
              </div>
            </PanelSection>
          ) : null}

          {isSystemConfigSection && canRunControlledIncome && currentSettingsView === 'incomeControlled' ? (
            <PanelSection
              sectionId="admin-income-controlled-readonly"
              eyebrow="MCN production · controlled read-only"
              title="收入事实受控联调"
              description="只读取并留存 MCN 收入事实的原始账本证据；不会开启持续消费、奖励计算、钱包入账、提现或付款。界面不会显示平台账号、事实明细、游标或密钥。"
            >
              <div className="stack-gap">
                <InfoCard title="执行门禁" tone="neutral">
                  <InlineHint text="仅在 MCN 已确认的窗口内操作。完成 Linky 分页、重读和对账后，请关闭服务器上的受控只读开关；正式收入消费开关必须保持关闭。" />
                </InfoCard>
                <InfoCard title="持续同步与恢复状态" tone={incomeSyncStatus?.continuousPullEnabled ? 'success' : 'neutral'}>
                  <InlineHint text="持续同步关闭时，系统不会自动请求 MCN；此处只展示已保存的断点、最近一次拉取和失败重试信息，不会显示游标、平台账号、收入事实或密钥。" />
                  <div className="action-row top-gap"><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeSyncStatus()} disabled={loading}>读取同步状态</button></div>
                  {incomeSyncStatus ? <div className="stack-gap top-gap">
                    <InlineHint text={incomeSyncStatus.continuousPullEnabled ? `持续同步已开启：每平台每轮最多读取 ${incomeSyncStatus.maxPagesPerRun} 页；奖励、钱包和付款仍不受此状态影响。` : '持续同步当前关闭：受控只读、影子账本和候选演算仍须按各自门禁执行。'} />
                    <div className="relation-grid">{incomeSyncStatus.platforms.map((item) => <RelationItem key={item.platformCode} label={`${item.platformCode === 'TIMO' ? 'Timo' : 'Linky'} 最近状态`} value={`${item.checkpointStatus}${item.latestRunStatus ? ` / ${item.latestRunStatus}` : ''}`} />)}</div>
                    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>平台</th><th>最近成功</th><th>最近快照 / 水位</th><th>接收 / 新增 / 去重</th><th>未匹配</th><th>下次尝试</th><th>失败 / 重试</th></tr></thead><tbody>{incomeSyncStatus.platforms.map((item) => <tr key={item.platformCode}><td>{item.platformCode === 'TIMO' ? 'Timo' : 'Linky'}</td><td>{item.lastSuccessAt ? formatDateTime(item.lastSuccessAt) : '-'}</td><td>{item.lastSnapshotAt ? `${formatDateTime(item.lastSnapshotAt)} / ${item.lastWatermarkCompleteness || '-'}` : item.lastWatermarkCompleteness || '-'}</td><td>{item.latestRunStatus ? `${item.latestReceivedCount} / ${item.latestNewCount} / ${item.latestDuplicateCount}` : '-'}</td><td>{item.latestRunStatus ? item.latestUnmatchedCount : '-'}</td><td>{item.nextAttemptAt ? formatDateTime(item.nextAttemptAt) : '-'}</td><td>{item.lastErrorCode || (item.retryAfterSeconds ? `${item.retryAfterSeconds} 秒后重试` : '-')}</td></tr>)}</tbody></table></div>
                  </div> : null}
                </InfoCard>
                <InfoCard title="本次读取范围" tone="neutral">
                  <div className="grid-form compact-form exception-filter-grid">
                    <label>平台<select value={controlledIncomeForm.platformCode} onChange={(event) => { setControlledIncomeForm({ ...controlledIncomeForm, platformCode: event.target.value }); setControlledIncomeResult(null); setControlledIncomeReconciliation(null); setControlledIncomeCursor(null); setControlledIncomeLastRequest(null) }}><option value="LINKY">Linky</option><option value="TIMO">Timo</option></select></label>
                    <label>业务日期<input type="date" value={controlledIncomeForm.businessDate} onChange={(event) => { setControlledIncomeForm({ ...controlledIncomeForm, businessDate: event.target.value }); setControlledIncomeResult(null); setControlledIncomeReconciliation(null); setControlledIncomeCursor(null); setControlledIncomeLastRequest(null) }} /></label>
                    <label>单页数量<input type="number" min="1" max="500" value={controlledIncomeForm.pageSize} onChange={(event) => setControlledIncomeForm({ ...controlledIncomeForm, pageSize: event.target.value })} /></label>
                  </div>
                  <div className="action-row top-gap">
                    <button className="primary-btn small-btn" onClick={() => void handleRunControlledIncome(null)} disabled={controlledIncomeLoading || Boolean(controlledIncomeResult)}>读取首页</button>
                    <button className="ghost-btn small-btn" onClick={() => void handleRunControlledIncome(controlledIncomeLastRequest?.cursor ?? null, controlledIncomeLastRequest?.requestId)} disabled={controlledIncomeLoading || !controlledIncomeLastRequest}>重读本页</button>
                    <button className="ghost-btn small-btn" onClick={() => void handleRunControlledIncome(controlledIncomeCursor)} disabled={controlledIncomeLoading || !controlledIncomeResult?.hasMore || !controlledIncomeCursor}>读取下一页</button>
                    <button className="ghost-btn small-btn" onClick={() => void handleReconcileControlledIncome()} disabled={controlledIncomeLoading || !controlledIncomeResult || controlledIncomeResult.hasMore}>完成分页后对账</button>
                  </div>
                </InfoCard>
                {controlledIncomeResult ? <InfoCard title="最近一次受控读取结果" tone={controlledIncomeResult.sourceStatus === 'READY' ? 'success' : 'neutral'}>
                  <div className="relation-grid">
                    <RelationItem label="来源状态" value={controlledIncomeResult.sourceStatus} />
                    <RelationItem label="HTTP 状态" value={controlledIncomeResult.httpStatus} />
                    <RelationItem label="接收 / 新增 / 去重" value={`${controlledIncomeResult.factCount} / ${controlledIncomeResult.newFactCount} / ${controlledIncomeResult.duplicateFactCount}`} />
                    <RelationItem label="未匹配数量" value={controlledIncomeResult.unmatchedFactCount} />
                    <RelationItem label="是否还有下一页" value={controlledIncomeResult.hasMore ? '是' : '否'} />
                    <RelationItem label="请求关联号" value={controlledIncomeResult.requestId} />
                  </div>
                  {controlledIncomeResult.retryAfterSeconds ? <InlineHint text={`MCN 当前未就绪，请在 ${controlledIncomeResult.retryAfterSeconds} 秒后重试；这不表示零收入。`} /> : null}
                </InfoCard> : null}
                {controlledIncomeReconciliation ? <InfoCard title="受控对账结果" tone={controlledIncomeReconciliation.comparisonStatus === 'MATCHED' ? 'success' : 'neutral'}>
                  <div className="relation-grid">
                    <RelationItem label="来源状态" value={controlledIncomeReconciliation.sourceStatus} />
                    <RelationItem label="对账结果" value={controlledIncomeReconciliation.comparisonStatus} />
                    <RelationItem label="MCN / 本地聚合组" value={`${controlledIncomeReconciliation.mcnGroupCount} / ${controlledIncomeReconciliation.banDeiraGroupCount}`} />
                    <RelationItem label="差异组数量" value={controlledIncomeReconciliation.mismatchGroupCount} />
                    <RelationItem label="请求关联号" value={controlledIncomeReconciliation.requestId} />
                  </div>
                </InfoCard> : null}
              </div>
            </PanelSection>
          ) : null}

          {isSystemConfigSection && canRunControlledIncome && currentSettingsView === 'incomeShadow' ? (
            <PanelSection sectionId="admin-income-shadow-ledger" eyebrow="MCN evidence · no financial effect" title="收入影子账本" description="把已保留的 MCN 原始收入事实按最新修订整理为可核对记录。这里只检查数据归属与定稿状态，绝不计算或发放奖励。">
              <div className="stack-gap">
                <InfoCard title="核对范围" tone="neutral">
                  <div className="grid-form compact-form exception-filter-grid">
                    <label>平台<select value={incomeShadowForm.platformCode} onChange={(event) => { setIncomeShadowForm({ ...incomeShadowForm, platformCode: event.target.value }); setIncomeShadowResult(null); setIncomeDataQuality(null); setIncomeDataQualityExceptions([]); setIncomeRewardCandidateResult(null); setIncomeRewardCandidateItems([]) }}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
                    <label>业务日期<input type="date" value={incomeShadowForm.businessDate} onChange={(event) => { setIncomeShadowForm({ ...incomeShadowForm, businessDate: event.target.value }); setIncomeShadowResult(null); setIncomeDataQuality(null); setIncomeDataQualityExceptions([]); setIncomeRewardCandidateResult(null); setIncomeRewardCandidateItems([]) }} /></label>
                  </div>
                  <div className="action-row top-gap"><button className="primary-btn small-btn" onClick={() => void handleRefreshIncomeShadowLedger()} disabled={loading}>按最新修订刷新</button><button className="ghost-btn small-btn" onClick={() => setIsIncomeShadowReplayDialogOpen(true)} disabled={loading || !incomeShadowResult}>人工重新投影</button><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeShadowLedger()} disabled={loading}>读取已有结果</button><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeDataQuality()} disabled={loading}>查看数据质量</button></div>
                </InfoCard>
                {incomeShadowResult ? <InfoCard title="影子账本核对结果" tone="success"><div className="relation-grid">
                  <RelationItem label="来源事实 / 最新事实" value={`${incomeShadowResult.sourceFactCount} / ${incomeShadowResult.latestFactCount}`} />
                  <RelationItem label="已绑定且已定稿" value={incomeShadowResult.boundFinalCount} />
                  <RelationItem label="未匹配平台账号" value={incomeShadowResult.unmatchedCount} />
                  <RelationItem label="等待定稿" value={incomeShadowResult.awaitingFinalityCount} />
                  <RelationItem label="已撤销或作废" value={incomeShadowResult.voidedCount} />
                </div><InlineHint text="“已绑定且已定稿”仅表示可进入后续规则核对，不代表已经产生任何奖励或可提现余额。" /></InfoCard> : <EmptyState title="尚未生成影子账本" description="选择已完成受控对账的业务日后刷新。" />}
                {incomeDataQuality ? <InfoCard title="数据质量与待处理项" tone={incomeDataQuality.projectionStatus === 'COMPLETE' ? 'success' : 'neutral'}><div className="relation-grid">
                  <RelationItem label="投影完整性" value={`${incomeDataQuality.projectionStatus} · ${incomeDataQuality.projectedFactCount} / ${incomeDataQuality.latestFactCount}`} />
                  <RelationItem label="已归属覆盖率" value={`${incomeDataQuality.boundFinalCount} / ${incomeDataQuality.latestFactCount}（${incomeDataQuality.latestFactCount === 0 ? '0' : ((incomeDataQuality.boundFinalCount / incomeDataQuality.latestFactCount) * 100).toFixed(2)}%）`} />
                  <RelationItem label="未归属 / 等待定稿" value={`${incomeDataQuality.unmatchedCount} / ${incomeDataQuality.awaitingFinalityCount}`} />
                  <RelationItem label="作废事实" value={incomeDataQuality.voidedCount} />
                </div><InlineHint text="COMPLETE 表示最新 MCN 事实均已写入本地影子投影；未归属和等待定稿必须在进入任何后续账本规则前处理或确认。" />
                  {incomeDataQualityExceptions.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>事实参考号</th><th>状态</th><th>公会</th><th>结算状态</th><th>复核状态</th><th>最新修订</th><th>操作</th></tr></thead><tbody>{incomeDataQualityExceptions.map((item) => <tr key={`${item.sourceEventReference}:${item.sourceRevision}`}><td>{item.sourceEventReference}</td><td>{item.status === 'UNMATCHED' ? '未归属' : '等待定稿'}</td><td>{item.guildId || '-'}</td><td>{item.settlementStatus}</td><td>{item.reviewStatus === 'ACKNOWLEDGED' ? '已知悉' : item.reviewStatus === 'IGNORED' ? '已忽略' : '待复核'}{item.reviewNote ? <small className="table-subtext">{item.reviewNote}</small> : null}</td><td>{item.sourceRevision}</td><td><button className="ghost-btn small-btn" onClick={() => openIncomeExceptionReview(item)} disabled={loading}>复核</button></td></tr>)}</tbody></table></div> : <InlineHint text="当前没有未归属或等待定稿的收入事实。" />}
                </InfoCard> : null}
                <InfoCard title="奖励候选影子演算" tone="neutral">
                  <InlineHint text="仅对已定稿、已归属且在收入发生时已完成绑定核验的事实，按收入发生时有效的来源公会公司分成比例，将原始收入换算为公司业务收入后演算固定两层邀请候选（直邀 10%、间邀 3%）。不会生成奖励或余额。" />
                  <div className="action-row top-gap"><button className="primary-btn small-btn" onClick={() => void handleRefreshIncomeRewardCandidates()} disabled={loading || !incomeShadowResult}>按当前证据演算候选</button><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeRewardCandidates()} disabled={loading}>读取已有候选</button></div>
                </InfoCard>
                {incomeRewardCandidateResult ? <InfoCard title="奖励候选演算结果" tone="neutral"><div className="relation-grid">
                  <RelationItem label="来源事实 / 可进入规则核对" value={`${incomeRewardCandidateResult.sourceFactCount} / ${incomeRewardCandidateResult.sourceReadyCount}`} />
                  <RelationItem label="候选奖励条数" value={incomeRewardCandidateResult.candidateCount} />
                  <RelationItem label="规则阻断条数" value={incomeRewardCandidateResult.blockedCount} />
                  <RelationItem label="候选金额" value={`${incomeRewardCandidateResult.candidateAmount} ${incomeRewardCandidateResult.amountUnit || ''}`.trim()} />
                </div><InlineHint text="候选金额只用于业务与财务核对；它不是奖励、余额、可提现金额或付款指令。导师奖励属于独立的生命周期里程碑影子账本，不在此处合算。" />
                  <div className="action-row top-gap"><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeRewardCandidateSample()} disabled={loading || !incomeRewardCandidateResult.latestRunId}>抽取 10 条核验样本</button></div>
                  {incomeRewardCandidateItems.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>事实参考号</th><th>邀请层级</th><th>来源用户 / 公会</th><th>候选受益人</th><th>原始收入</th><th>公司比例</th><th>公司业务收入</th><th>候选金额</th><th>规则快照</th><th>依据</th></tr></thead><tbody>{incomeRewardCandidateItems.map((item) => <tr key={`${item.sourceEventReference}:${item.rewardLevel}`}><td>{item.sourceEventReference}</td><td>{item.rewardLevel === 1 ? '直邀 · 10%' : item.rewardLevel === 2 ? '间邀 · 3%' : '-'}</td><td>{item.sourceUserId || '-'}<small className="table-subtext">{item.sourceGuildId || '未取得公会'}</small></td><td>{item.recipientUserId || '-'}</td><td>{`${item.baseAmount} ${item.amountUnit}`}</td><td>{item.companyShareRate === null ? '-' : `${(item.companyShareRate * 100).toFixed(2)}%`}</td><td>{item.companyIncomeBaseAmount === null ? '-' : `${item.companyIncomeBaseAmount} ${item.amountUnit}`}</td><td>{item.candidateAmount === null ? '-' : `${item.candidateAmount} ${item.amountUnit}`}</td><td>{item.policyCode ? `${item.policyCode}${item.ruleRate === null ? '' : ` · ${(item.ruleRate * 100).toFixed(2)}%`}${item.invitationVersion === null ? '' : ` · 邀请版本 ${item.invitationVersion}`}` : item.calculationVersion}</td><td>{item.reason}</td></tr>)}</tbody></table></div> : <InlineHint text="尚无可展示的分佣候选；可能尚未演算、收入未归属，或来源用户在收入发生时未完成平台绑定。" />}
                  {incomeRewardCandidateSample ? <div className="top-gap"><InlineHint text={`本次快照 ${incomeRewardCandidateSample.runId}：可核验 ${incomeRewardCandidateSample.availableCount} 条，其中候选 ${incomeRewardCandidateSample.candidateAvailableCount} 条、阻断 ${incomeRewardCandidateSample.blockedAvailableCount} 条。样本按固定哈希抽取，重复读取结果一致。`} />
                    {incomeRewardCandidateSample.items.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>样本事实参考号</th><th>邀请层级</th><th>原始收入</th><th>公司比例 / 基数</th><th>候选金额</th><th>规则快照</th><th>依据</th></tr></thead><tbody>{incomeRewardCandidateSample.items.map((item) => <tr key={`${incomeRewardCandidateSample.runId}:${item.sourceEventReference}:${item.rewardLevel}`}><td>{item.sourceEventReference}</td><td>{item.rewardLevel === 0 ? '来源门禁' : item.rewardLevel === 1 ? '直邀 · 10%' : '间邀 · 3%'}</td><td>{`${item.baseAmount} ${item.amountUnit}`}</td><td>{item.companyShareRate === null || item.companyIncomeBaseAmount === null ? '-' : `${(item.companyShareRate * 100).toFixed(2)}% / ${item.companyIncomeBaseAmount} ${item.amountUnit}`}</td><td>{item.candidateAmount === null ? '-' : `${item.candidateAmount} ${item.amountUnit}`}</td><td>{item.policyCode || item.calculationVersion}</td><td>{item.reason}</td></tr>)}</tbody></table></div> : <InlineHint text="本次运行没有可供抽样的候选或阻断项。" />}</div> : null}
                </InfoCard> : null}
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'commissionPolicies' && canRunControlledIncome ? (
            <PanelSection sectionId="admin-commission-policies" eyebrow="Invitation commission · fixed policy ledger" title="邀请裂变分成规则台账" description="此处展示固定的邀请裂变口径及其历史快照，不提供运营人员新增、修改比例或调整层级。它不包含导师分成或运营分红，也不会创建奖励、余额或付款。" action={<button className="ghost-btn" onClick={() => void loadCommissionPolicies()} disabled={loading}>刷新台账</button>}>
              <div className="stack-gap">
                <InfoCard title="当前固定口径" tone="neutral">
                  <div className="relation-grid">
                    <RelationItem label="第 1 层 · 直接邀请" value="10%" />
                    <RelationItem label="第 2 层 · 间接邀请" value="3%" />
                    <RelationItem label="第 3 层及以上" value="关闭" />
                    <RelationItem label="核算基数" value="来源公会公司业务收入" />
                  </div>
                  <InlineHint text="来源用户的原始可结算收入，先按其收入发生时所属公会的公司分成比例换算为公司业务收入，再按固定两层演算个人推荐候选。用户等级当前均展示直邀 10% / 间邀 3%；未来如按等级差异化，须通过研发变更同时更新等级权益展示、计算规则和审计快照。" />
                  <InlineHint text="公会公司分成比例在“平台公会目录”维护；该比例属于公司业务收入的换算前提，不是邀请裂变比例。" />
                </InfoCard>
                <InfoCard title="历史规则与候选快照" tone="neutral">
                  {(commissionPolicies ?? []).length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>规则版本</th><th>适用范围</th><th>固定层级</th><th>比例 / 冻结记录</th><th>生效期</th><th>历史状态</th></tr></thead><tbody>{(commissionPolicies ?? []).map((policy) => <tr key={policy.id}><td>{policy.policyCode}</td><td>{policy.platformCode} / {policy.countryCode}</td><td>两层（第 3 层关闭）</td><td>{policy.levels.filter((level) => level.enabled).map((level) => `L${level.rewardLevel} ${level.rewardRate} / ${level.freezeDays}天`).join('；') || '-'}</td><td>{formatDateTime(policy.effectiveFrom)} {policy.effectiveTo ? `至 ${formatDateTime(policy.effectiveTo)}` : '起长期有效'}</td><td>{policy.status === 'DRAFT' ? '历史待审记录' : policy.status === 'ACTIVE' ? '历史已启用记录' : '历史已停用记录'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未记录历史规则快照" description="当前固定口径由系统底层执行；后续如通过研发变更调整，将在此保留新的历史快照。" />}
                  <InlineHint text="此页只读，用于核对收入发生时采用的固定邀请口径与历史版本。规则新增、比例调整或层级变动须经业务确认后走研发变更流程；不会在运营后台直接操作。" />
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'mentorDirectory' ? (
            <PanelSection sectionId="admin-mentors" eyebrow="Mentor directory · relationship management" title="导师列表" description="在此维护导师资格和导师可携带的学员。导师关系独立于邀请关系，所有变更均保留版本记录；本页不配置分成规则，也不会产生奖励或付款。" action={<button className="ghost-btn" onClick={() => void loadMentorIncentiveDashboard()} disabled={loading}>刷新列表</button>}>
              <div className="stack-gap">
                <InfoCard title="导师与学员概览" tone="neutral">
                  {mentorIncentiveDashboard ? <div className="relation-grid"><RelationItem label="具备资格的导师" value={mentorIncentiveDashboard.qualifiedMentorCount} /><RelationItem label="当前已归属学员" value={mentorIncentiveDashboard.assignedStudentCount} /></div> : <EmptyState title="尚未读取导师列表" description="点击“刷新列表”读取导师资格与当前学员数量。" />}
                  <InlineHint text="“编辑学员”只会新增或切换该导师的学员归属版本，不会改写历史导师关系。" />
                </InfoCard>
                {canManageMentorRelations ? <InfoCard title="导师资格" tone="neutral"><p>建立导师资格后，才可以为该导师配置可携带的学员。已建立的资格可在列表中修改归属国家和带教上限。</p><button className="primary-btn top-gap" onClick={() => openMentorQualificationDialog()} disabled={loading}>新建导师资格</button></InfoCard> : null}
                <InfoCard title="导师列表" tone="neutral">
                  {mentorIncentiveDashboard?.mentors.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>导师信息</th><th>归属国家 / 语言</th><th>资格状态</th><th>学员数量</th><th>带教上限</th><th>操作</th></tr></thead><tbody>{mentorIncentiveDashboard.mentors.map((mentor) => <tr key={mentor.userId}><td>用户 {mentor.userId}{mentor.phoneNumber ? ` · ${mentor.phoneNumber}` : ''}</td><td>{mentor.countryCode} / {mentor.languageCode}</td><td>{mentor.qualificationStatus === 'QUALIFIED' ? '已具备资格' : mentor.qualificationStatus}</td><td>{mentor.assignedStudentCount}</td><td>{mentor.maxActiveStudents}</td><td>{canManageMentorRelations ? <div className="action-row"><button className="ghost-btn small-btn" onClick={() => openMentorQualificationDialog(mentor)} disabled={loading}>编辑资格</button><button className="primary-btn small-btn" onClick={() => openMentorAssignmentDialog(mentor)} disabled={loading}>编辑学员</button></div> : '-'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未建立导师资格" description="先通过“新建导师资格”添加一位导师。" />}
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'mentorIncentives' ? (
            <PanelSection sectionId="admin-mentor-incentives" eyebrow="Mentor cash incentive · business decision pending" title="导师现金激励（暂未开放）" description="导师资格和学员归属继续在“导师列表”维护。导师现金激励的资格、教学结果、公式和预算尚未独立确认，因此不允许新建或启用规则。" action={<button className="ghost-btn" onClick={() => void loadMentorIncentiveDashboard()} disabled={loading}>刷新历史</button>}>
              <div className="stack-gap">
                <InfoCard title="当前影子核验概览" tone="neutral">
                  {mentorIncentiveDashboard ? <div className="relation-grid"><RelationItem label="已关闭导师现金规则" value={mentorIncentiveDashboard.rules.length} /><RelationItem label="历史影子记录" value={mentorIncentiveDashboard.shadowEntryCount} /></div> : <EmptyState title="尚未读取导师历史" description="点击“刷新历史”读取已留存的规则和影子账本。" />}
                  <InlineHint text="历史记录仅供审计。当前不创建候选、奖励、余额、提现或付款；后续必须先独立确认导师资格、教学结果、公式和预算。" />
                </InfoCard>
                <InfoCard title="历史导师规则" tone="neutral">{mentorIncentiveDashboard?.rules.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>规则版本</th><th>里程碑</th><th>适用范围</th><th>固定额度 / 冻结</th><th>状态</th></tr></thead><tbody>{mentorIncentiveDashboard.rules.map((rule) => <tr key={rule.id}><td>{rule.ruleCode} · V{rule.ruleVersion}</td><td>{mentorMilestoneLabel(rule.milestoneCode)}</td><td>{rule.platformCode} / {rule.countryCode}{rule.guildId ? ` / ${rule.guildId}` : ' / 全部公会'}</td><td>{rule.amountMinor} {rule.currencyCode} / {rule.freezeDays} 天</td><td>已关闭（{rule.status}）</td></tr>)}</tbody></table></div> : <EmptyState title="尚无导师现金规则" description="导师现金激励尚未定义，当前不应建立规则。" />}</InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'teams' && canManageTeams ? (
            <PanelSection sectionId="admin-teams" eyebrow="Team governance · appointment control" title="团队列表" description="金牌达标会自动建立团队并写入负责人资格记录；高级等级须完成培养、经营、职责确认后再正式任命。运营不可绕过该流程授予负责人，也不能修改历史归属。" action={<button className="ghost-btn" onClick={() => void loadTeamManagementDashboard()} disabled={loading}>刷新数据</button>}>
              <div className="stack-gap">
                <InfoCard title="团队治理概览" tone="neutral">
                  {teamManagementDashboard ? <div className="relation-grid"><RelationItem label="已确认负责人团队" value={teamManagementDashboard.leaderTeamCount} /><RelationItem label="有效团队" value={teamManagementDashboard.activeTeamCount} /><RelationItem label="已许可经营分成" value={teamManagementDashboard.operatingProfitShareEnabledTeamCount} /><RelationItem label="当前成员归属" value={teamManagementDashboard.activeMemberRelationCount} /></div> : <EmptyState title="尚未读取团队数据" description="点击“刷新数据”读取当前团队及成员归属。" />}
                  <InlineHint text="成员归属采用可叠加的历史关系：用户成为新团队负责人后，可保留在上级团队的成员记录。负责人资格、建队和任命状态独立留存；团队经营利润分成全局关闭，当前不能逐团队开启，不会产生奖励、余额、提现或付款。" />
                </InfoCard>
                <InfoCard title="团队经营与成员" tone="neutral">
                  {teamManagementDashboard?.teams.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>团队</th><th>负责人</th><th>负责人状态</th><th>团队经营奖励</th><th>上级团队</th><th>当前成员</th><th>最近经营事实</th><th>建立时间</th><th>操作</th></tr></thead><tbody>{teamManagementDashboard.teams.map((team) => <tr key={team.teamId}><td>{team.teamName}<small className="table-subtle">{team.teamCode} / {team.countryCode}</small></td><td>{team.leaderUserId ? `用户 ${team.leaderUserId}${team.leaderPhoneNumber ? ` · ${team.leaderPhoneNumber}` : ''}` : '待自动产生'}</td><td>{team.leaderAppointmentStatus === 'CONFIRMED' ? '已正式任命' : team.leaderAppointmentStatus === 'AUTO_CONFIRMED' ? '金牌自动确认' : team.leaderAppointmentStatus === 'LEGACY_UNVERIFIED' ? '历史待核验' : '不适用'}<small className="table-subtle">资格：{team.leaderQualificationStatus} / 建队：{team.teamEstablishmentStatus}</small></td><td>全局关闭<small className="table-subtle">独立方案确认前不可启用</small></td><td>{team.parentTeamCode || '—'}</td><td>{team.activeMemberCount}</td><td>{team.latestOperatingProfitMinor === null ? '尚无经营事实' : `${team.latestPlatformCode} · ${team.latestOperatingProfitMinor} ${team.latestCurrencyCode}（截至 ${team.latestPeriodEnd}）`}</td><td>{formatDateTime(team.createdAt)}</td><td><button className="ghost-btn small-btn" onClick={() => void openTeamMembers(team)} disabled={loading}>查看成员</button></td></tr>)}</tbody></table></div> : <EmptyState title="尚无团队记录" description="用户达到金牌等级后，系统会自动建立团队并保留负责人资格记录；不会模拟创建团队。" />}
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'operatingDividends' && canManageOperatingDividends ? (
            <PanelSection sectionId="admin-operating-dividends" eyebrow="Operating dividend · shadow only" title="运营分红" description="运营分红以独立的团队经营利润事实为基数，满足团队资格门槛后按比例写入影子账本。它不包含邀请裂变分成或导师固定奖励，不会产生奖励、余额、提现或付款。" action={<button className="ghost-btn" onClick={() => void loadOperatingDividendDashboard()} disabled={loading}>刷新数据</button>}>
              <div className="stack-gap">
                <InfoCard title="影子运营概览" tone="neutral">
                  {operatingDividendDashboard ? <div className="relation-grid"><RelationItem label="已启用规则" value={operatingDividendDashboard.activePolicyCount} /><RelationItem label="已达标团队长" value={operatingDividendDashboard.qualificationCount} /><RelationItem label="团队利润事实" value={operatingDividendDashboard.profitFactCount} /><RelationItem label="影子分红记录" value={operatingDividendDashboard.shadowEntryCount} /></div> : <EmptyState title="尚未读取运营分红数据" description="点击“刷新数据”读取规则、团队经营利润事实和影子分红记录。" />}
                  <InlineHint text="当前只接通影子规则与证据承载。团队经营利润事实尚未接入真实消费开关，后续以生产权威事实到达后的结果为准。" />
                </InfoCard>
                <InfoCard title="运营分红规则" tone="neutral">
                  <p>规则以“草稿 → 审批启用 → 停止使用”管理。范围可限定到 MCN 权威公会；同一平台、国家和公会范围的启用规则不能重叠。</p>
                  <button className="primary-btn top-gap" onClick={() => openOperatingDividendDialog()} disabled={loading}>新增运营分红规则</button>
                </InfoCard>
                <InfoCard title="已保存的运营分红规则" tone="neutral">
                  {operatingDividendDashboard?.policies.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>规则版本</th><th>适用范围</th><th>资格门槛</th><th>经营利润分红</th><th>生效期</th><th>状态</th><th>操作</th></tr></thead><tbody>{operatingDividendDashboard.policies.map((policy) => <tr key={policy.id}><td>{policy.policyCode} · V{policy.policyVersion}</td><td>{policy.platformCode} / {policy.countryCode}{policy.guildId ? ` / ${policy.guildId}` : ' / 全部公会'}</td><td>有效启动 ≥ {policy.requiredValidStarts}；可提现 ≥ {policy.requiredWithdrawEligible}；连续 7 天 ≥ {policy.requiredActive7d}</td><td>{(policy.profitShareRate * 100).toFixed(2)}%</td><td>{formatDateTime(policy.effectiveFrom)} {policy.effectiveTo ? `至 ${formatDateTime(policy.effectiveTo)}` : '起长期有效'}</td><td>{policy.status === 'DRAFT' ? '待审' : policy.status === 'ACTIVE' ? '已启用' : '已停用'}</td><td>{policy.status === 'DRAFT' ? <button className="primary-btn small-btn" onClick={() => void handleActivateOperatingDividendPolicy(policy.id, policy.policyCode)} disabled={loading}>审批并启用</button> : policy.status === 'ACTIVE' ? <button className="ghost-btn small-btn" onClick={() => void handleRetireOperatingDividendPolicy(policy.id, policy.policyCode)} disabled={loading}>停止使用</button> : '-'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未配置运营分红规则" description="先建立一条待审规则；在权威团队经营利润事实接入前，规则不会生成任何真实款项。" />}
                </InfoCard>
                <InfoCard title="最近团队经营利润事实" tone="neutral">
                  {operatingDividendDashboard?.recentProfitFacts.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>团队</th><th>平台</th><th>周期</th><th>经营利润</th><th>来源</th><th>接收时间</th></tr></thead><tbody>{operatingDividendDashboard.recentProfitFacts.map((fact) => <tr key={fact.id}><td>{fact.teamId}</td><td>{fact.platformCode}</td><td>{fact.periodStart} 至 {fact.periodEnd}</td><td>{fact.operatingProfitMinor} {fact.currencyCode}</td><td>{fact.sourceSystem}</td><td>{formatDateTime(fact.receivedAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="尚无团队经营利润事实" description="当前未开放真实利润事实消费。待权威数据源接通后，本处会展示可追溯的事实记录。" />}
                </InfoCard>
                <InfoCard title="最近运营分红影子记录" tone="neutral">
                  {operatingDividendDashboard?.recentShadowEntries.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>团队长 / 团队</th><th>平台</th><th>规则</th><th>比例</th><th>影子金额</th><th>状态</th><th>触发时间</th></tr></thead><tbody>{operatingDividendDashboard.recentShadowEntries.map((entry) => <tr key={entry.id}><td>{entry.leaderUserId} / {entry.teamId}</td><td>{entry.platformCode}</td><td>{entry.policyId}</td><td>{(entry.shareRate * 100).toFixed(2)}%</td><td>{entry.shareAmountMinor} {entry.currencyCode}</td><td>{entry.ledgerStatus}</td><td>{formatDateTime(entry.triggeredAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="尚无运营分红影子记录" description="团队资格、规则和经营利润事实同时满足后，系统才会写入不可支付的影子记录。" />}
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'tokenPointConversions' && canManageTeams ? (
            <PanelSection sectionId="admin-token-point-conversions" eyebrow="Points conversion · permanent configuration" title="代币积分换算" description="按应用维护长期有效的平台原始收入代币兑换积分比例。积分只会来自直接邀请下级的已绑定、已定稿 MCN 收入事实；此页仅配置换算，不会立即记分。" action={<button className="ghost-btn" onClick={() => void loadTokenPointConversionDashboard()} disabled={loading}>刷新数据</button>}>
              <div className="stack-gap">
                <InfoCard title="换算配置概览" tone="neutral">
                  {tokenPointConversionDashboard ? <div className="relation-grid"><RelationItem label="已配置单位" value={`${tokenPointConversionDashboard.configuredConversionCount} / 2`} /><RelationItem label="Timo 原始单位" value="TIMO_DIAMOND" /><RelationItem label="Linky 原始单位" value="LINKY_DIAMOND" /></div> : <EmptyState title="尚未读取换算配置" description="点击“刷新数据”读取 Timo 与 Linky 的配置。" />}
                  <InlineHint text="例如填写 0.2，表示该应用每 1 平台代币可兑换 0.2 积分。不同应用必须分别设置，不能把其原始代币直接相加。" />
                </InfoCard>
                <InfoCard title="原始代币单位与积分换算" tone="neutral">
                  {tokenPointConversionDashboard ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>应用</th><th>原始收入代币单位</th><th>每 1 代币兑换积分</th><th>配置状态</th><th>操作</th></tr></thead><tbody>{tokenPointConversionDashboard.conversions.map((conversion) => <tr key={conversion.platformCode}><td>{conversion.platformCode}</td><td>{conversion.tokenUnit}</td><td><input aria-label={`${conversion.platformCode} 每 1 代币兑换积分`} required min="0" step="0.000001" inputMode="decimal" value={tokenPointConversionValues[conversion.platformCode] ?? ''} onChange={(event) => setTokenPointConversionValues({ ...tokenPointConversionValues, [conversion.platformCode]: event.target.value })} placeholder="例如：0.2" /></td><td>{conversion.configured ? '已配置（长期有效）' : '尚未配置'}</td><td><button className="primary-btn small-btn" onClick={() => requestSaveTokenPointConversion(conversion.platformCode, conversion.tokenUnit)} disabled={loading}>保存</button></td></tr>)}</tbody></table></div> : <EmptyState title="尚未读取换算配置" description="点击“刷新数据”读取 Timo 与 Linky 的原始代币单位。" />}
                  <InlineHint text="无需设置起始或结束时间。保存前会再次展示本次换算比例供确认；保存后成为该应用唯一的长期配置，并保留操作审计。" />
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {legacyPointGradeManagementVisible && activeAdminSection === 'userGrades' && canManageTeams && window.location.hash === '#legacy-user-grade-levels' ? (
            <PanelSection sectionId="admin-user-grades" eyebrow="User grade · points ready" title="用户等级管理" description="用户等级由积分评估；积分只会基于后续明确接通的直邀事实来源累计。达到唯一的团队负责人等级门槛时，系统将自动授予负责人身份并创建团队。" action={<button className="ghost-btn" onClick={() => void loadUserGradeLevelDashboard()} disabled={loading}>刷新数据</button>}>
              <div className="stack-gap">
                <InfoCard title="积分等级概览" tone="neutral">
                  {userGradeLevelDashboard ? <div className="relation-grid"><RelationItem label="已启用等级" value={userGradeLevelDashboard.activeLevelCount} /><RelationItem label="团队负责人门槛" value={userGradeLevelDashboard.activeTeamLeaderLevel ? `等级 ${userGradeLevelDashboard.activeTeamLeaderLevel.levelRank} · ${userGradeLevelDashboard.activeTeamLeaderLevel.levelName}` : '尚未设置'} /></div> : <EmptyState title="尚未读取积分等级配置" description="点击“刷新数据”读取等级与审批状态。" />}
                  <InlineHint text="积分获取方式尚待业务确认。当前页面只配置等级门槛和负责人资格，不会给用户加分、升级、创建团队或产生分红、奖励、余额、提现和付款。" />
                </InfoCard>
                <InfoCard title="等级配置" tone="neutral"><p>等级可按业务自定义。一个生效时段内只能有一个等级授予团队负责人资格；达到该门槛及以上等级的用户，后续会由系统自动创建其团队。</p><button className="primary-btn top-gap" onClick={openUserGradeLevelDialog} disabled={loading}>新增积分等级</button></InfoCard>
                <InfoCard title="已保存的积分等级" tone="neutral">
                  {userGradeLevelDashboard?.levels.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>等级</th><th>积分门槛</th><th>团队负责人资格</th><th>生效期</th><th>状态</th><th>操作</th></tr></thead><tbody>{userGradeLevelDashboard.levels.map((level) => <tr key={level.id}><td>{level.levelName}<small className="table-subtle">第 {level.levelRank} 级 · {level.levelCode} · V{level.levelVersion}</small></td><td>≥ {level.requiredPoints}</td><td>{level.grantsTeamLeader ? '是（唯一门槛）' : '否'}</td><td>{formatDateTime(level.effectiveFrom)} {level.effectiveTo ? `至 ${formatDateTime(level.effectiveTo)}` : '起长期有效'}</td><td>{level.status === 'DRAFT' ? '待审' : level.status === 'ACTIVE' ? '已启用' : '已停用'}</td><td>{level.status === 'DRAFT' ? <button className="primary-btn small-btn" onClick={() => void activateUserGradeLevel(level.id, level.levelName)} disabled={loading}>审批并启用</button> : level.status === 'ACTIVE' ? <button className="ghost-btn small-btn" onClick={() => void retireUserGradeLevel(level.id, level.levelName)} disabled={loading}>停止使用</button> : '—'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未配置积分等级" description="请先建立等级草稿，再审批启用。积分来源接通前，启用规则不会改变任何用户身份或团队关系。" />}
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {['userGradeList', 'advancedGradeAcceptance', 'userGradeFacts'].includes(activeAdminSection) && canManageTeams ? (
            <PanelSection sectionId="admin-user-grades" eyebrow="User grade · direct effective users" title={activeAdminSection === 'userGradeList' ? '用户等级列表' : activeAdminSection === 'advancedGradeAcceptance' ? '高阶经营验收' : '等级资格事实与复核'} description={activeAdminSection === 'userGradeList' ? '此处展示已确认的七级用户等级制度与当前规则范围。等级定义由研发配置维护，运营后台仅供查阅，不提供编辑或新增入口。' : activeAdminSection === 'advancedGradeAcceptance' ? '铂金、钻石、黑金通过培养、经营与职责验收后才可进入负责人确认流程，不产生奖励或团队经营分成。' : '查看和复核有效用户、等级评估以及直属邀请积分事实。所有计算只基于本地已定稿收入事实。'} action={<button className="ghost-btn" onClick={() => { void loadUserGradeDashboard(); if (activeAdminSection === 'advancedGradeAcceptance') void loadUserGradeAdvancementReviews(); if (activeAdminSection === 'userGradeFacts') { void loadUserPointDashboard(); if (canReadEffectiveUsers) void loadEffectiveUserQualifications() } }} disabled={loading}>刷新数据</button>}>
              <div className="stack-gap">
                {activeAdminSection === 'userGradeList' ? <>
                  <InfoCard title="既定用户等级" tone="neutral">
                    <InlineHint text="当前各等级的个人推荐分成统一为直邀 10%、间邀 3%；等级列表是运营查看该权益的入口。第一阶段不发放团队经营奖励；成为金牌或完成更高等级验收均不会改变该关闭状态。未来如按等级差异化调整，将通过研发变更同步更新等级权益展示与计算规则。" />
                    <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>等级</th><th>升级条件</th><th>升级后的权益与责任</th><th>个人推荐分成</th><th>第一阶段团队奖励</th></tr></thead><tbody>{USER_GRADE_CATALOG.map((item) => <tr key={item.grade}><td><strong>{item.grade}</strong></td><td>{item.condition}</td><td>{item.responsibility}</td><td>{item.referral}</td><td>{item.team}</td></tr>)}</tbody></table></div>
                  </InfoCard>
                  <InfoCard title="已保存的等级规则范围" tone="neutral">
                    <InlineHint text="这里仅展示历史规则版本和当前适用范围，用于审计。新增、修改、审批启用或停用等级规则均不在运营后台操作；如需调整，请按研发变更流程更新配置并发布。" />
                    {userGradeDashboard?.rules.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>规则版本</th><th>等级</th><th>适用范围</th><th>有效直邀门槛</th><th>状态</th></tr></thead><tbody>{userGradeDashboard.rules.map((rule) => <tr key={rule.id}><td>{rule.ruleCode} · V{rule.ruleVersion}</td><td>{rule.gradeCode}</td><td>{rule.platformCode} / {rule.countryCode}{rule.guildId ? ` / ${rule.guildId}` : ' / 全部公会'}</td><td>数量 ≥ {rule.requiredDirectInviteCount}</td><td>{rule.status === 'DRAFT' ? '待审（历史记录）' : rule.status === 'ACTIVE' ? '已启用' : '已停用'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未读取等级规则范围" description="点击“刷新数据”读取现有规则快照。" />}
                  </InfoCard>
                </> : null}
                {activeAdminSection === 'userGradeFacts' ? <InfoCard title="等级规则概览" tone="neutral">
                  {userGradeDashboard ? <div className="relation-grid"><RelationItem label="已启用等级规则" value={userGradeDashboard.activeRuleCount} /><RelationItem label="已合格团队长" value={userGradeDashboard.qualifiedTeamLeaderCount} /></div> : <EmptyState title="尚未读取用户等级数据" description="点击“刷新数据”读取规则与最近评估结果。" />}
                  <InlineHint text="MCN 只提供收入事实；邀请关系、有效用户资格和等级由分销平台计算及审计。本页不创建奖励、余额、提现或付款。累计达标人数与当前活跃有效人数分开展示：当前活跃指最近 7 个完整自然日（不含当天）至少 3 个不同日期有本人真实、可结算聊天业务收入。" />
                </InfoCard> : null}
                {activeAdminSection === 'userGradeFacts' ? <InfoCard title="直接邀请积分事实" tone="neutral">
                  <div className="action-row">
                    <label>来源平台<select value={userPointPlatform} onChange={(event) => { const platform = event.target.value as 'TIMO' | 'LINKY'; setUserPointPlatform(platform); setUserPointDashboard(null); void loadUserPointDashboard(platform) }}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
                    <button className="ghost-btn" onClick={() => void loadUserPointDashboard()} disabled={loading}>读取积分事实</button>
                    <button className="primary-btn" onClick={() => void refreshUserPointFacts()} disabled={loading}>按本地定稿收入刷新</button>
                  </div>
                  {userPointDashboard ? <>
                    <div className="relation-grid top-gap"><RelationItem label="已累计积分事实" value={userPointDashboard.accruedFactCount} /><RelationItem label="暂无法记分" value={userPointDashboard.blockedFactCount} /><RelationItem label="证据已撤销" value={userPointDashboard.revokedFactCount} /><RelationItem label="本平台累计积分" value={userPointDashboard.accruedPointTotal.toFixed(6)} /></div>
                    <InlineHint text="只取下级用户在收入发生时的直接邀请关系及本地 BOUND_FINAL 收入；积分基数是平台原始可结算代币金额。换算比例和邀请关系均保存快照，换算变更不会倒算历史积分。当前七级等级仍以已确认的有效直邀人数与高级经营验收为唯一升级口径，本积分事实不自动升级或任命团队负责人。" />
                    {userPointDashboard.topBalances.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>邀请人用户</th><th>累计积分（跨平台）</th><th>有效积分事实</th><th>最近下级收入</th></tr></thead><tbody>{userPointDashboard.topBalances.map((balance) => <tr key={balance.userId}><td>{balance.userId}</td><td>{balance.totalPoints.toFixed(6)}</td><td>{balance.accruedFactCount}</td><td>{formatDateTime(balance.latestIncomeAt ?? undefined)}</td></tr>)}</tbody></table></div> : <EmptyState title="尚无可累计积分" description="需先为该平台保存代币积分换算，并存在已绑定、已定稿且具有直接邀请人的收入事实。" />}
                    {userPointDashboard.recentFacts.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>收入事实</th><th>下级 / 邀请人</th><th>原始收入</th><th>换算比例</th><th>积分</th><th>状态</th><th>依据</th></tr></thead><tbody>{userPointDashboard.recentFacts.map((fact) => <tr key={`${fact.platformCode}-${fact.sourceEventId}`}><td>{fact.sourceEventId}<small className="table-subtle">{formatDateTime(fact.occurredAt)}</small></td><td>{fact.sourceUserId ?? '—'} / {fact.beneficiaryUserId ?? '—'}</td><td>{fact.sourceAmount} {fact.tokenUnit}</td><td>{fact.pointsPerToken ?? '—'}</td><td>{fact.pointAmount ?? '—'}</td><td>{fact.factStatus}</td><td>{fact.decisionReason}</td></tr>)}</tbody></table></div> : null}
                  </> : <EmptyState title="尚未读取积分事实" description="选择平台后读取，或按本地已定稿收入刷新。该操作不会请求 MCN。" />}
                </InfoCard> : null}
                {activeAdminSection === 'advancedGradeAcceptance' ? <InfoCard title="铂金、钻石、黑金：培养与经营验收" tone="neutral">
                  <p>高级等级不由直邀人数规则自动晋级。铂金须先录入两名银牌成员各自的小组、连续 30 天观察和最后 7 天指标；钻石、黑金须录入两名不同培养对象、不同范围和连续完整自然月。经营质量 KPI 尚待业务确认，仍由运营复核。三项均确认后仅进入“待负责人确认”，不会自动创建团队、任命负责人或开启团队经营分成。</p>
                  <button className="primary-btn top-gap" onClick={openUserGradeAdvancementDialog} disabled={loading}>建立高级等级验收记录</button>
                  {userGradeAdvancementReviews.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>用户 / 目标等级</th><th>平台 / 公会</th><th>培养资格</th><th>经营验收</th><th>经营职责</th><th>状态</th><th>操作</th></tr></thead><tbody>{userGradeAdvancementReviews.map((review) => {
                    const isPlatinum = review.targetGradeCode === 'PLATINUM'
                    const evidence = isPlatinum ? review.platinumEvidence : review.advancedEvidence
                    const traineeGrade = isPlatinum ? '银牌' : review.targetGradeCode === 'DIAMOND' ? '金牌' : '钻石'
                    const scopeLabel = isPlatinum ? '小组' : review.targetGradeCode === 'DIAMOND' ? '团队' : '经营范围'
                    return <tr key={review.id}><td>用户 {review.userId} / {review.targetGradeCode}</td><td>{review.platformCode} / {review.guildId}</td><td><span>{review.trainingStatus === 'CONFIRMED' ? '已确认' : `待确认（证据 ${evidence.length}/2）`}<small className="table-subtle">{isPlatinum ? review.platinumEvidence.map((item) => `${traineeGrade}用户 ${item.traineeUserId} · ${item.groupReference} · ${item.evidenceStatus}`).join('\n') : review.advancedEvidence.map((item) => `${traineeGrade}用户 ${item.traineeUserId} · ${item.scopeReference} · ${item.evidenceStatus}`).join('\n') || `需两名${traineeGrade}成员及不同${scopeLabel}证据`}</small></span></td><td>{review.operatingValidationStatus === 'CONFIRMED' ? '已确认' : '待确认'}</td><td>{review.responsibilityStatus === 'CONFIRMED' ? '已确认' : '待确认'}</td><td>{review.reviewStatus === 'LEADER_CONFIRMED' ? '负责人已确认' : review.reviewStatus === 'READY_FOR_LEADER_CONFIRMATION' ? '待负责人确认' : '验收中'}</td><td><div className="action-row">{review.trainingStatus !== 'CONFIRMED' ? <button className="ghost-btn small-btn" onClick={() => isPlatinum ? openPlatinumEvidenceDialog(review) : openAdvancedEvidenceDialog(review)} disabled={loading}>录入培养证据</button> : null}{review.trainingStatus !== 'CONFIRMED' ? <button className="ghost-btn small-btn" onClick={() => void confirmUserGradeAdvancementReview(review, 'training-confirmation')} disabled={loading}>确认培养</button> : null}{review.operatingValidationStatus !== 'CONFIRMED' ? <button className="ghost-btn small-btn" onClick={() => void confirmUserGradeAdvancementReview(review, 'operating-confirmation')} disabled={loading}>确认经营</button> : null}{review.responsibilityStatus !== 'CONFIRMED' ? <button className="ghost-btn small-btn" onClick={() => void confirmUserGradeAdvancementReview(review, 'responsibility-confirmation')} disabled={loading}>确认职责</button> : null}{review.reviewStatus === 'READY_FOR_LEADER_CONFIRMATION' ? <button className="primary-btn small-btn" onClick={() => void confirmUserGradeAdvancementReview(review, 'leadership-appointment')} disabled={loading}>确认负责人</button> : null}{review.reviewStatus === 'LEADER_CONFIRMED' ? '—' : null}</div></td></tr>
                  })}</tbody></table></div> : <EmptyState title="尚无高级等级验收记录" description="培养与经营验收会自动校验已确认的等级、成员、范围和观察期；经营 KPI 结论仍由运营复核。" />}
                </InfoCard> : null}
                {activeAdminSection === 'userGradeFacts' ? <InfoCard title="人工复核用户等级" tone="neutral"><div className="action-row"><input aria-label="用户 ID" type="number" min="1" value={userGradeEvaluationForm.userId} onChange={(event) => setUserGradeEvaluationForm({ ...userGradeEvaluationForm, userId: event.target.value })} placeholder="用户 ID" /><select value={userGradeEvaluationForm.platformCode} onChange={(event) => setUserGradeEvaluationForm({ ...userGradeEvaluationForm, platformCode: event.target.value })}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select><button className="ghost-btn" onClick={() => void evaluateUserGrade()} disabled={loading}>立即复核</button></div><InlineHint text="系统每小时也会自动重算已有直接邀请关系的已核验用户。人工复核仅刷新本地资格证据，不会请求 MCN。" /></InfoCard> : null}
                {activeAdminSection === 'userGradeFacts' ? <InfoCard title="最近等级评估" tone="neutral">{userGradeDashboard?.recentEvaluations.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>用户</th><th>平台 / 公会</th><th>等级</th><th>累计达标有效直邀</th><th>当前活跃有效直邀</th><th>结果</th><th>评估时间</th></tr></thead><tbody>{userGradeDashboard.recentEvaluations.map((item, index) => <tr key={`${item.userId}-${item.platformCode}-${item.guildId}-${item.gradeCode}-${index}`}><td>{item.userId}</td><td>{item.platformCode} / {item.guildId}</td><td>{item.gradeCode}</td><td>{item.directInviteCount}</td><td>{item.currentActiveEffectiveInviteCount}</td><td>{item.status === 'QUALIFIED' ? '已合格' : item.status === 'REQUIRES_MANUAL_REVIEW' ? '待人工复核' : '进行中'}</td><td>{formatDateTime(item.evaluatedAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="暂无等级评估记录" description="启用规则后，由定时任务或人工复核生成记录。" />}</InfoCard> : null}
                {activeAdminSection === 'userGradeFacts' && canReadEffectiveUsers ? <InfoCard title="有效用户资格事实与纠偏" tone="neutral">
                  <div className="action-row"><select value={effectiveUserPlatform} onChange={(event) => { const platform = event.target.value as 'TIMO' | 'LINKY'; setEffectiveUserPlatform(platform); void loadEffectiveUserQualifications(platform) }}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select><button className="ghost-btn" onClick={() => void loadEffectiveUserQualifications()} disabled={loading}>读取资格事实</button>{canRunControlledIncome ? <button className="primary-btn" onClick={() => void refreshEffectiveUserQualifications()} disabled={loading}>按定稿收入刷新</button> : null}</div>
                  <InlineHint text="有效用户资格是“最近 7 个完整自然日内至少 3 个不同日期产生本人真实、可结算聊天业务收入”的本地事实；当天不计入窗口。刷新只重算本地事实；不请求 MCN，不产生奖励、余额、提现或付款。" />
                  {effectiveUserQualifications.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>用户</th><th>永久资格</th><th>当前活跃</th><th>达标收入日期</th><th>达标窗口</th><th>证据快照</th><th>人工纠偏</th></tr></thead><tbody>{effectiveUserQualifications.map((fact) => <tr key={`${fact.platformCode}-${fact.userId}`}><td>用户 {fact.userId}<small className="table-subtle">{fact.platformCode}</small></td><td>{fact.qualificationStatus === 'QUALIFIED' ? '已合格' : fact.qualificationStatus === 'MANUALLY_EXCLUDED' ? '人工排除' : fact.qualificationStatus === 'EVIDENCE_REVOKED' ? '证据已撤销' : '未合格'}{fact.manualCorrectionReason ? <small className="table-subtle">原因：{fact.manualCorrectionReason}</small> : null}</td><td>{fact.currentActivityStatus === 'ACTIVE' ? '近 7 个完整自然日活跃' : '当前不活跃'}<small className="table-subtle">{fact.currentActivityWindowStart ?? '—'} 至 {fact.currentActivityWindowEnd ?? '—'}</small></td><td>{fact.qualifyingIncomeDateCount} 天<small className="table-subtle">{fact.qualifyingIncomeDates || '—'}</small></td><td>{fact.qualificationWindowStart ?? '—'} 至 {fact.qualificationWindowEnd ?? '—'}</td><td><small>{fact.sourceEvidenceSnapshot || '—'}</small></td><td>{canCorrectEffectiveUsers && fact.qualificationStatus !== 'MANUALLY_EXCLUDED' ? <button className="ghost-btn small-btn" onClick={() => openEffectiveUserCorrectionDialog(fact)} disabled={loading}>证据纠偏</button> : fact.manualCorrectionNote || '—'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未读取资格事实" description="选择平台后点击“读取资格事实”。永久资格来自任一满足规则的完整自然日窗口；当前活跃单独按最近 7 个完整自然日展示。" />}
                  <InlineHint text={canCorrectEffectiveUsers ? '人工纠偏仅限确认的刷号、虚假收入或伪造业绩；正常停业、收入减少或观察期结束均不得使用。纠偏后上级的已合格等级转为“待人工复核”，不会自动降级。' : '资格事实可供查看。证据纠偏仅限超级管理员操作，并需要填写具体证据说明。'} />
                </InfoCard> : null}
              </div>
            </PanelSection>
          ) : null}

          {isSystemConfigSection && canManagePlatformMocks && currentSettingsView === 'mockVerification' ? (
            <PanelSection
              sectionId="admin-platform-verification-mock"
              eyebrow="Local acceptance only"
              title="本地 Mock 核验数据"
              description="为 Linky / Timo 建立可重复使用的模拟核验结果。此数据只在本地或测试环境可用，绝不会请求 MCN 或形成真实发奖。"
              action={<button className="primary-btn" onClick={() => void loadPlatformVerificationRuntime(true)} disabled={loading}>{loading ? '刷新中…' : '刷新记录'}</button>}
            >
              <div className="stack-gap">
                {platformVerificationRuntime ? <InfoCard title={`当前通道：${platformVerificationRuntime.source}`} tone={platformVerificationRuntime.mockManagementEnabled ? 'success' : 'neutral'}>
                  <InlineHint text={platformVerificationRuntime.explanation} />
                </InfoCard> : <EmptyState title="核验通道待加载" description="进入本页会读取当前环境的核验通道状态。" />}
                {platformVerificationRuntime?.mockManagementEnabled ? <>
                  <InfoCard title="新增或更新模拟账号核验" tone="neutral">
                    <form className="grid-form compact-form exception-filter-grid" onSubmit={handleSavePlatformVerificationMock}>
                      <label>平台<select value={platformVerificationMockForm.platformCode} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, platformCode: event.target.value })}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
                      <label>平台主账号<input required inputMode="numeric" pattern="[0-9]{5,32}" value={platformVerificationMockForm.platformUserId} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, platformUserId: event.target.value.replace(/\D/g, '') })} placeholder="Timo timo_id / Linky sid" /></label>
                      <label>官方公会 ID<input required value={platformVerificationMockForm.officialGuildId} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, officialGuildId: event.target.value })} placeholder="例如 22000448" /></label>
                      <label>入会时间<input required type="datetime-local" value={platformVerificationMockForm.officialJoinedAt} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, officialJoinedAt: event.target.value })} /></label>
                      <label>追踪备注<input value={platformVerificationMockForm.sourceReference} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, sourceReference: event.target.value })} placeholder="例如 UAT-TIMO-001" /></label>
                      <label className="checkbox-label"><input type="checkbox" checked={platformVerificationMockForm.joinedTargetGuild} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, joinedTargetGuild: event.target.checked })} /> 属于目标公会</label>
                      <label className="checkbox-label"><input type="checkbox" checked={platformVerificationMockForm.globallySeenBeforeSubmission} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, globallySeenBeforeSubmission: event.target.checked })} /> 模拟为预先已存在账号</label>
                      <label className="checkbox-label"><input type="checkbox" checked={platformVerificationMockForm.enabled} onChange={(event) => setPlatformVerificationMockForm({ ...platformVerificationMockForm, enabled: event.target.checked })} /> 启用此模拟记录</label>
                      <button className="primary-btn" type="submit" disabled={loading || !platformVerificationMockForm.platformUserId || !platformVerificationMockForm.officialGuildId || !platformVerificationMockForm.officialJoinedAt}>保存 Mock 核验记录</button>
                    </form>
                  </InfoCard>
                  <InfoCard title="已配置的模拟核验记录" tone="neutral">
                    <DataTable
                      headers={['平台', '平台主账号', '目标公会', '入会时间', '模拟结果', '状态', '追踪备注']}
                      rows={(platformVerificationMocks ?? []).map((item) => [
                        item.platformCode, item.platformUserId, item.officialGuildId, formatDateTime(item.officialJoinedAt),
                        item.globallySeenBeforeSubmission ? '预先存在（将拒绝）' : (item.joinedTargetGuild ? '通过' : '不在目标公会（将拒绝）'),
                        item.enabled ? '启用' : '停用', item.sourceReference || '—',
                      ])}
                      emptyText="暂无模拟记录。先创建一个 Timo 或 Linky 平台主账号的核验结果。"
                    />
                  </InfoCard>
                </> : null}
              </div>
            </PanelSection>
          ) : null}

          {isSystemConfigSection && currentSettingsView === 'advanced' ? (
            <div>
              <PanelSection
                sectionId="admin-onboarding"
                eyebrow="Onboarding"
                title="分销接入"
                description=""
                action={<button className="primary-btn" onClick={handleProfileCreateTokenSave}>保存接入令牌</button>}
              >
                <div className="stack-gap">
                  <div className="grid-form compact-form single-line wide-line">
                    <label>
                      Profile Create Token
                      <input value={profileCreateToken} onChange={(e) => setProfileCreateToken(e.target.value)} placeholder="请输入创建分销档案的接入令牌" />
                    </label>
                  </div>
                  <form className="grid-form" onSubmit={handleCreateProfile}>
                    <label>
                      用户 ID
                      <input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="例如 5001" />
                    </label>
                    <label>
                      国家码
                      <input value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} placeholder="ID" />
                    </label>
                    <label>
                      语言码
                      <input value={form.languageCode} onChange={(e) => setForm({ ...form, languageCode: e.target.value })} placeholder="id" />
                    </label>
                    <label>
                      邀请码（必填，首批运营请填写初始邀请码）
                      <input required value={form.inviteCode} onChange={(e) => setForm({ ...form, inviteCode: e.target.value })} placeholder="ABCD1234" />
                    </label>
                    <button className="primary-btn" type="submit" disabled={loading || !canCreateProfile}>创建 / 接入</button>
                  </form>
                  {session ? (
                    <InfoCard title="当前用户会话" tone="success">
                      <InfoRow label="用户 ID" value={session.userId} />
                      <InfoRow label="邀请码" value={session.inviteCode} />
                      <InfoRow label="国家 / 语言" value={`${session.countryCode} / ${session.languageCode}`} />
                      <div className="action-row top-gap">
                        <button className="ghost-btn small-btn" type="button" onClick={() => handleCopyInviteCode(session.inviteCode)}>复制邀请码</button>
                      </div>
                    </InfoCard>
                  ) : (
                    <EmptyState title="当前用户会话待接入" description="完成一次接入后，这里会显示当前用户身份、邀请码和令牌信息。" />
                  )}
                </div>
              </PanelSection>
            </div>
          ) : null}

          {isSystemConfigSection && canManageSeedInviters && currentSettingsView === 'seedInviter' ? (
            <PanelSection
              sectionId="admin-seed-inviter"
              eyebrow="Controlled onboarding"
              title="种子邀请人"
              description="创建首批根节点用户并自动生成邀请码。该号码可通过验证码登录；后续新用户必须使用其邀请码注册。"
            >
              <div className="stack-gap">
                <InfoCard title="创建首个邀请根节点" tone="success">
                  <form className="grid-form compact-form exception-filter-grid" onSubmit={handleCreateSeedInviter}>
                    <label>
                      手机号 / WhatsApp
                      <div className="consumer-phone-input">
                        <select value={seedInviterCountry.countryCode} onChange={(event) => setSeedInviterForm({ ...seedInviterForm, countryCode: event.target.value })} aria-label="运营国家和区号">
                          {phoneCountries.filter((country) => ['BR', 'ID', 'MX', 'CO'].includes(country.countryCode)).map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names.zh} {country.callingCode}</option>)}
                        </select>
                        <input required value={seedInviterForm.phoneNumber} onChange={(event) => setSeedInviterForm({ ...seedInviterForm, phoneNumber: normalizeLocalPhoneNumber(event.target.value, seedInviterCountry.callingCode) })} placeholder="输入本地号码" inputMode="tel" autoComplete="tel-national" />
                      </div>
                      <small className="consumer-phone-input-hint">选择国家后，只需输入本地号码；系统会自动补全国际区号。</small>
                    </label>
                    <label>
                      默认语言
                      <select value={seedInviterForm.languageCode} onChange={(event) => setSeedInviterForm({ ...seedInviterForm, languageCode: event.target.value })}>
                        <option value="pt-br">Português</option><option value="id">Bahasa Indonesia</option><option value="es">Español</option><option value="en">English</option><option value="zh">中文</option>
                      </select>
                    </label>
                    <button className="primary-btn" type="submit" disabled={loading}>创建种子邀请人</button>
                  </form>
                </InfoCard>
                <InlineHint text="仅最高管理员可创建；号码不可重复，创建过程会记录管理员、网络地址、时间和脱敏号码。不要在这里创建测试奖励或开启奖励引擎。" />
                {createdSeedInviter ? (
                  <InfoCard title="已创建的种子邀请人" tone="success">
                    <div className="relation-grid">
                      <div className="relation-item"><span>用户 ID</span><strong>{createdSeedInviter.userId}</strong></div>
                      <div className="relation-item"><span>手机号</span><strong>{createdSeedInviter.phoneNumber}</strong></div>
                      <div className="relation-item"><span>国家 / 语言</span><strong>{createdSeedInviter.countryCode} / {createdSeedInviter.languageCode}</strong></div>
                      <div className="relation-item"><span>邀请码</span><strong>{createdSeedInviter.inviteCode}</strong></div>
                    </div>
                    <div className="action-row top-gap"><button className="ghost-btn small-btn" type="button" onClick={() => void handleCopyInviteCode(createdSeedInviter.inviteCode)}>复制邀请码</button></div>
                  </InfoCard>
                ) : null}
                <InfoCard title="种子邀请人列表" tone="neutral">
                  <div className="action-row">
                    <InlineHint text="仅展示由运营后台创建并留有审计记录的种子邀请人。" />
                    <button className="ghost-btn small-btn" type="button" onClick={() => void loadSeedInviters()} disabled={loading}>{loading ? '刷新中…' : '刷新列表'}</button>
                  </div>
                  <DataTable
                    headers={['用户 ID', '手机号', '国家 / 默认语言', '邀请码', '直接邀请', '账户状态', '创建信息']}
                    rows={(seedInviters?.items ?? []).map((item) => [
                      item.userId,
                      item.phoneNumber,
                      `${item.countryCode} / ${item.languageCode}`,
                      item.inviteCode,
                      `${item.directInviteeCount} 人${item.effectiveUser ? ' · 已有效' : ''}`,
                      `${item.accountStatus} / ${item.userStatus}`,
                      `${formatDateTime(item.createdAt)} · ${item.createdByRole} #${item.createdBy}`,
                    ])}
                    emptyText="暂无种子邀请人。创建后会自动出现在这里，也可以点击刷新列表查询历史记录。"
                  />
                  {seedInviters ? <InlineHint text={`共 ${seedInviters.total} 位种子邀请人；当前展示最近 ${seedInviters.items.length} 位。`} /> : null}
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'users' ? (
            <PanelSection
              sectionId="admin-users"
              eyebrow="User directory"
              title="用户信息与平台归属"
              description="集中查询用户资料、邀请码关系、平台绑定事实与 Linky 邀请链归属。人工调整仅改变该用户未来下级的 Linky 目标公会。"
              action={<button className="primary-btn" onClick={() => void loadUserPlatformProfiles()} disabled={loading}>{loading ? '加载中…' : '刷新用户'}</button>}
            >
              <div className="stack-gap">
                <InfoCard title="查询用户信息" tone="neutral">
                  <div className="grid-form compact-form exception-filter-grid">
                    <label>用户 ID（留空查看列表）<input inputMode="numeric" value={userPlatformQuery.userId} onChange={(event) => setUserPlatformQuery({ ...userPlatformQuery, userId: event.target.value.replace(/\D/g, ''), page: '0' })} placeholder="例如 1001" /></label>
                    <label>每页数量<select value={userPlatformQuery.size} onChange={(event) => setUserPlatformQuery({ ...userPlatformQuery, size: event.target.value, page: '0' })}><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></label>
                  </div>
                  <InlineHint text="实际 Linky / Timo 公会是平台核验事实；“邀请链归属”才是该用户邀请新下级时使用的 Linky 目标公会。" />
                </InfoCard>
                <InfoCard title="用户与平台核验信息" tone="neutral">
                  <DataTable
                    headers={['用户 / 邀请码', '手机号', '直接邀请人', 'Linky 实际绑定', 'Timo 实际绑定', 'Linky 邀请链归属', '操作']}
                    rows={(userPlatformProfiles?.items ?? []).map((item) => [
                      <div className="stack-gap small"><strong>#{item.userId}</strong><span>{item.inviteCode} · {item.countryCode}</span></div>,
                      item.phoneNumber || '-',
                      item.directInviterUserId == null ? '根节点' : `#${item.directInviterUserId}`,
                      item.linky ? <div className="stack-gap small"><strong>{item.linky.accountId}</strong><span>{item.linky.status} · {item.linky.guildName || item.linky.guildId || '未返回公会'}{item.linky.expectedGuildSource ? ` · 目标来源 ${item.linky.expectedGuildSource}` : ''}</span></div> : '-',
                      item.timo ? <div className="stack-gap small"><strong>{item.timo.accountId}</strong><span>{item.timo.status} · {item.timo.guildId || '未返回公会'}</span></div> : '-',
                      item.invitationGuild ? <div className="stack-gap small"><strong>{item.invitationGuild.guildName} · {item.invitationGuild.guildId}</strong><span>{item.invitationGuild.source}{item.invitationGuild.inheritedFromUserId ? ` · 继承自 #${item.invitationGuild.inheritedFromUserId}` : ''}</span></div> : '-',
                      canManageLinkyInvitationGuild ? <button className="ghost-btn small-btn" onClick={() => openLinkyInvitationGuildOverride(item)}>调整归属</button> : '只读',
                    ])}
                    emptyText="输入用户 ID 后查询，或直接查询查看近期用户。"
                  />
                  {userPlatformProfiles ? <InlineHint text={`共 ${userPlatformProfiles.total} 位用户；当前第 ${userPlatformProfiles.page + 1} 页。`} /> : null}
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'platformGuildDirectory' ? (
            <PanelSection
              sectionId="admin-platform-guild-directory"
              eyebrow="MCN authoritative directory"
              title="平台公会目录"
              description="只读查看 MCN 同步的 Linky 与 Timo 公会事实、异常状态及同步批次。BANDEIRA 不在此编辑权威公会资料。"
              action={<button className="primary-btn" onClick={() => void loadPlatformGuildDirectory()} disabled={platformGuildDirectoryLoading}>{platformGuildDirectoryLoading ? '刷新中…' : '刷新目录'}</button>}
            >
              <div className="stack-gap">
                <div className="admin-view-tabs" role="tablist" aria-label="平台公会目录平台选择">
                  {(['LINKY', 'TIMO'] as const).map((platform) => <button key={platform} className={platformGuildDirectoryPlatform === platform ? 'is-active' : ''} onClick={() => switchPlatformGuildDirectory(platform)} role="tab" aria-selected={platformGuildDirectoryPlatform === platform}>{platform}</button>)}
                </div>
                <InfoCard title={`${platformGuildDirectoryPlatform} 目录状态`} tone="neutral">
                  {platformGuildDirectory ? <div className="relation-grid">
                    <RelationItem label="已同步公会" value={`${platformGuildDirectory.length} 个`} />
                    <RelationItem label="正常" value={`${platformGuildDirectory.filter((item) => item.directoryStatus === 'NORMAL').length} 个`} />
                    <RelationItem label="MCN 已缺失" value={`${platformGuildDirectory.filter((item) => item.directoryStatus === 'MISSING_ON_MCN').length} 个`} />
                    <RelationItem label="最后同步" value={formatDateTime(platformGuildDirectorySyncRuns?.[0]?.completedAt || platformGuildDirectory?.[0]?.lastSeenAt)} />
                  </div> : <EmptyState title="尚未加载公会目录" description="点击“刷新目录”读取当前已同步的 MCN 权威目录。" actionLabel="目录只读，不可在此编辑" />}
                </InfoCard>
                <InfoCard title="MCN 同步公会" tone="neutral">
                  <DataTable
                    headers={['公会 ID / 名称', '国家', '平台状态', '目录状态', 'MCN 更新时间', '最后同步']}
                    rows={(platformGuildDirectory ?? []).map((item) => [
                      <div className="stack-gap small"><strong>{item.guildName}</strong><span>{item.guildId}</span></div>,
                      item.country || '-',
                      renderStatusBadge(item.guildStatus),
                      renderStatusBadge(item.directoryStatus),
                      formatDateTime(item.mcnRecordUpdatedAt || item.officialUpdatedAt || undefined),
                      formatDateTime(item.lastSeenAt),
                    ])}
                    emptyText={platformGuildDirectoryLoading ? '正在读取 MCN 同步目录…' : '当前平台还没有同步的公会。请检查最近同步批次。'}
                  />
                </InfoCard>
                <InfoCard title="最近同步批次" tone="neutral">
                  <DataTable
                    headers={['平台', '结果', '接收 / 写入 / 缺失', '开始时间', '完成时间', '异常']}
                    rows={(platformGuildDirectorySyncRuns ?? []).map((item) => [
                      item.platformCode,
                      renderStatusBadge(item.syncStatus),
                      `${item.receivedCount} / ${item.upsertedCount} / ${item.missingCount}`,
                      formatDateTime(item.startedAt),
                      formatDateTime(item.completedAt || undefined),
                      item.errorCode ? `${item.errorCode}${item.errorMessage ? ` · ${item.errorMessage}` : ''}` : '-',
                    ])}
                    emptyText={platformGuildDirectoryLoading ? '正在读取同步批次…' : '暂无同步批次；请确认 MCN 目录同步开关已启用。'}
                  />
                  <InlineHint text="若出现“MCN 已缺失”或失败批次，请先核对 MCN 目录事实；系统不会自动删除本地历史记录。" />
                </InfoCard>
              </div>
            </PanelSection>
          ) : null}

          {isSystemConfigSection && canAuditPhoneVerification && currentSettingsView === 'phoneVerification' ? (
            <PanelSection
              sectionId="admin-phone-verification"
              eyebrow="Restricted Access"
              title="验证码发送记录"
              description="仅最高管理员可查询与显示验证码。每次查询和显示都会进入后台审计记录。"
              action={<button className="primary-btn" onClick={() => void loadPhoneVerificationCodes()} disabled={loading}>查询记录</button>}
            >
              <div className="stack-gap">
                <div className="grid-form compact-form">
                  <label>
                    手机号筛选
                    <input value={phoneVerificationQuery.phoneNumber} onChange={(event) => setPhoneVerificationQuery({ ...phoneVerificationQuery, phoneNumber: event.target.value, page: '0' })} placeholder="输入完整或部分手机号" />
                  </label>
                  <label>
                    每页数量
                    <select value={phoneVerificationQuery.size} onChange={(event) => setPhoneVerificationQuery({ ...phoneVerificationQuery, size: event.target.value, page: '0' })}>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </label>
                </div>
                <InlineHint text="“显示验证码”属于敏感操作，系统会记录操作账号、角色、网络地址和时间。" />
                <DataTable
                  headers={['手机号', '用途', '状态', '验证码', '尝试次数', '发出时间', '失效时间', '操作']}
                  rows={(phoneVerificationCodes?.items ?? []).map((item) => [
                    item.phoneNumber,
                    item.purpose,
                    item.status,
                    revealedPhoneVerificationCodes[item.id] ?? '已隐藏',
                    item.attempts,
                    formatDateTime(item.issuedAt),
                    formatDateTime(item.expiresAt),
                    <button className="ghost-btn small-btn" onClick={() => void handleRevealPhoneVerificationCode(item.id)} disabled={loading}>{revealedPhoneVerificationCodes[item.id] ? '已显示' : '显示验证码'}</button>,
                  ])}
                  emptyText="点击查询记录，查看已发出的验证码及其使用状态。"
                />
                {phoneVerificationCodes ? <InlineHint text={`共 ${phoneVerificationCodes.total} 条记录；当前第 ${phoneVerificationCodes.page + 1} 页。`} /> : null}
                {phoneVerificationAuditLogs ? (
                  <InfoCard title="最近验证码查看审计" tone="neutral">
                    <DataTable headers={['时间', '操作', '角色', '操作人', '网络地址']} rows={phoneVerificationAuditLogs.items.map((item) => [formatDateTime(item.operatedAt), item.actionName, item.operatorRole, item.operatorId, item.requestIp || '-'])} emptyText="显示验证码后，这里会显示对应的审计记录。" />
                  </InfoCard>
                ) : null}
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'overview' ? (
              <PanelSection
                sectionId="admin-overview"
                eyebrow="Overview"
                title="今日工作台"
                description={`${formatAdminRole(adminSession.role)}视角 · 先处理阻塞，再查看业务趋势`}
                action={<button className="primary-btn" onClick={handleLoadAdminOverview} disabled={loading || !canLoadAdmin}>{loading ? '刷新中…' : '刷新工作台'}</button>}
              >
                <div className="admin-overview-grid">
                  <section className="admin-overview-priority" aria-labelledby="admin-priority-title">
                    <div className="admin-subsection-head"><div><h3 id="admin-priority-title">需要你处理</h3><p>按业务阻塞程度排序</p></div><span>今日</span></div>
                    <div className="admin-task-board" aria-label="运营待办">
                      {canViewAdminSection('rewards') ? <a href="#admin-rewards"><span>待审核提现<small>进入财务队列</small></span><strong>{adminWithdrawRequests?.total ?? '—'}</strong><CaretRight size={16} /></a> : null}
                      {canViewAdminSection('users') ? <a href="#admin-risk-queue" onClick={() => { if (!riskEvents) void handleLoadRiskEvents() }}><span>待处理异常<small>核验绑定与风险</small></span><strong>{riskEvents?.total ?? adminOverview?.riskEventCount ?? '—'}</strong><CaretRight size={16} /></a> : null}
                      {canViewAdminSection('channel') ? <a href="#admin-channel-entries"><span>渠道入口<small>创建可追踪链接</small></span><strong>生成</strong><CaretRight size={16} /></a> : null}
                      <a href="#admin-my-security"><span>工作台状态<small>{currentAdminProductLabel}</small></span><strong>{adminOverview ? '已更新' : '待刷新'}</strong><CaretRight size={16} /></a>
                    </div>
                  </section>
                  <section className="admin-overview-pulse" aria-labelledby="admin-pulse-title">
                    <div className="admin-subsection-head"><div><h3 id="admin-pulse-title">关键指标</h3><p>当前产品累计数据</p></div></div>
                    <div className="stats-grid">
                      <Metric label="邀请人数" value={adminOverview?.invitedUsers} hint="累计邀请" tone="neutral" />
                      <Metric label="有效人数" value={adminOverview?.effectiveUsers} hint="有效归因" tone="success" />
                      <Metric label="累计奖励" value={adminOverview?.rewardTotal} hint="奖励总额" tone="primary" />
                      <Metric label="冻结奖励" value={adminOverview?.frozenRewardTotal} hint="待复核" tone="warning" />
                      <Metric label="可用奖励" value={adminOverview?.availableRewardTotal} hint="可结算" tone="success" />
                      <Metric label="待处理异常" value={adminOverview?.riskEventCount} hint="需人工处理" tone="danger" />
                    </div>
                  </section>
                </div>
              </PanelSection>
          ) : null}

          {activeAdminSection === 'channel' ? (
              <PanelSection
                sectionId="admin-invite-ops"
                eyebrow="Channel Entry"
                title="渠道入口管理"
                description=""
              >
                <InfoCard title="入口生成条件" tone="neutral">
                  <div className="grid-form compact-form exception-filter-grid">
                    <label>
                      入口域名
                      <input value={channelEntryForm.origin} onChange={(e) => setChannelEntryForm({ ...channelEntryForm, origin: e.target.value })} placeholder="https://your-domain.com" />
                    </label>
                    <label>
                      国家
                      <input value={channelEntryForm.country} onChange={(e) => setChannelEntryForm({ ...channelEntryForm, country: e.target.value })} placeholder="ID / MX / BR" />
                    </label>
                    <label>
                      语言
                      <input value={channelEntryForm.language} onChange={(e) => setChannelEntryForm({ ...channelEntryForm, language: e.target.value })} placeholder="id / es / pt" />
                    </label>
                    <label>
                      渠道标识
                      <input value={channelEntryForm.channel} onChange={(e) => setChannelEntryForm({ ...channelEntryForm, channel: e.target.value })} placeholder="whatsapp-main / meta-id-01" />
                    </label>
                    <label>
                      邀请码
                      <input value={channelEntryForm.inviteCode} onChange={(e) => setChannelEntryForm({ ...channelEntryForm, inviteCode: e.target.value })} placeholder="ABCD1234" />
                    </label>
                  </div>
                  <InlineHint text="自动生成三条渠道链接。" />
                </InfoCard>
                <InfoCard title="追踪参数" tone="success">
                  <div className="relation-grid top-gap">
                    <div className="relation-item"><span>产品</span><strong>{currentAdminProductLabel}</strong></div>
                    <div className="relation-item"><span>国家 / 语言</span><strong>{channelEntryForm.country || '-'} / {channelEntryForm.language || '-'}</strong></div>
                    <div className="relation-item"><span>渠道</span><strong>{channelEntryForm.channel || '-'}</strong></div>
                    <div className="relation-item"><span>邀请码</span><strong>{channelEntryForm.inviteCode || '-'}</strong></div>
                  </div>
                  {channelEntryLinks.map((item) => (
                    <div key={item.key} className="public-entry-item">
                      <InfoRow label={item.label} value={item.url} code />
                      <div className="action-row top-gap public-entry-actions">
                        <button className="ghost-btn small-btn" type="button" onClick={() => openExternalLandingPage(item.url)}>打开页面</button>
                        <button className="ghost-btn small-btn" type="button" onClick={() => copyPublicEntryLink(item.url)}>复制渠道链接</button>
                      </div>
                    </div>
                  ))}
                </InfoCard>
              </PanelSection>
          ) : null}

          {activeAdminSection === 'rewards' ? (
              <div className="admin-finance-workbench">
                <div className="admin-view-tabs" role="tablist" aria-label="收益与提现分类">
                  <button className={adminFinanceView === 'withdrawals' ? 'is-active' : ''} onClick={() => setAdminFinanceView('withdrawals')} role="tab" aria-selected={adminFinanceView === 'withdrawals'}>提现审核</button>
                  <button className={adminFinanceView === 'rewards' ? 'is-active' : ''} onClick={() => setAdminFinanceView('rewards')} role="tab" aria-selected={adminFinanceView === 'rewards'}>奖励流水</button>
                </div>
                {adminFinanceView === 'rewards' ? (
                <PanelSection
                  sectionId="admin-rewards"
                  eyebrow="Rewards"
                  title="收益记录管理"
                  description=""
                  action={<button className="primary-btn" onClick={handleLoadAdminRewards} disabled={loading || !canLoadAdmin}>查询收益记录</button>}
                >
                  <InfoCard title="筛选条件" tone="neutral">
                    <div className="query-shell soft-query-shell compact-query-shell">
                      <div className="grid-form compact-form exception-filter-grid">
                        <label>
                          受益用户 ID
                          <input value={adminRewardQuery.beneficiaryUserId} onChange={(e) => setAdminRewardQuery({ ...adminRewardQuery, beneficiaryUserId: e.target.value })} placeholder="例如 11001" />
                        </label>
                        <label>
                          状态
                          <select value={adminRewardQuery.status} onChange={(e) => setAdminRewardQuery({ ...adminRewardQuery, status: e.target.value })}>
                            <option value="">全部</option>
                            <option value="FROZEN">冻结中</option>
                            <option value="AVAILABLE">可用</option>
                            <option value="RISK_HOLD">风险冻结</option>
                          </select>
                        </label>
                      </div>
                      <InlineHint text={rewardPageLabel} />
                      <div className="table-toolbar compact-toolbar">
                        <button className="ghost-btn small-btn" onClick={() => handleAdminRewardPageChange(Number(adminRewardQuery.page) - 1)} disabled={loading || !hasRewardPrevPage}>上一页</button>
                        <button className="ghost-btn small-btn" onClick={() => handleAdminRewardPageChange(Number(adminRewardQuery.page) + 1)} disabled={loading || !hasRewardNextPage}>下一页</button>
                      </div>
                    </div>
                  </InfoCard>

                  {adminRewards?.items?.length ? (
                    <DataTable
                      headers={['受益用户', '来源用户', '层级', '奖励金额', '状态', '计算时间']}
                      rows={adminRewards.items.map((item) => [
                        item.beneficiaryUserId,
                        item.sourceUserId,
                        item.rewardLevel,
                        item.rewardAmount,
                        renderStatusBadge(item.rewardStatus),
                        formatDateTime(item.calculatedAt),
                      ])}
                      emptyText="暂无后台奖励数据"
                    />
                  ) : (
                    <EmptyState title="暂无后台奖励数据" description="先按受益用户或状态查一页。" actionLabel={rewardEmptyState.actionLabel} />
                  )}
                </PanelSection>
                ) : null}
                {adminFinanceView === 'withdrawals' ? (
                <PanelSection
                  sectionId="admin-withdraw-requests"
                  eyebrow="Withdraw"
                  title="提现申请管理"
                  description="先筛选队列，再在右侧核对详情并完成留痕操作。"
                >
                  <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); void loadAdminWithdrawRequests() }} aria-label="提现队列筛选">
                    <label>用户 ID<input value={adminWithdrawQuery.userId} onChange={(e) => setAdminWithdrawQuery({ ...adminWithdrawQuery, userId: e.target.value, page: '0' })} placeholder="输入用户 ID…" inputMode="numeric" /></label>
                    <label>状态<select value={adminWithdrawQuery.status} onChange={(e) => setAdminWithdrawQuery({ ...adminWithdrawQuery, status: e.target.value, page: '0' })}>
                      <option value="">全部</option><option value="PENDING_REVIEW">待审核</option><option value="PAYMENT_PENDING">待打款</option><option value="PAYMENT_FAILED">打款失败</option><option value="PAID_OUT">已打款</option><option value="REJECTED">已拒绝</option><option value="REVERSED">已冲正</option>
                    </select></label>
                    <div className="admin-filter-actions"><button className="primary-btn small-btn" type="submit" disabled={loading || !canLoadAdmin}>{loading ? '查询中…' : '查询'}</button><button className="ghost-btn small-btn" type="button" onClick={resetWithdrawFilters} disabled={loading}>重置</button></div>
                  </form>
                  <div className="admin-saved-views" aria-label="提现个人筛选视图">
                    <select value={selectedWithdrawViewId} onChange={(event) => applyWithdrawView(event.target.value)} aria-label="选择提现筛选视图"><option value="">个人筛选视图</option>{withdrawViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}</select>
                    <input value={withdrawViewName} onChange={(event) => setWithdrawViewName(event.target.value)} placeholder="给当前筛选命名…" aria-label="提现筛选视图名称" />
                    <button className="ghost-btn small-btn" type="button" onClick={saveWithdrawView} disabled={!withdrawViewName.trim()}>保存视图</button>
                    <button className="ghost-btn small-btn" type="button" onClick={removeWithdrawView} disabled={!selectedWithdrawViewId}>删除</button>
                  </div>
                  <div className="admin-split-workbench" aria-busy={loading}>
                    <div className="admin-queue-pane">
                      {selectedWithdrawRequestNos.length ? <div className="admin-batch-bar" role="region" aria-label="提现批量操作"><strong>已选 {selectedWithdrawRequestNos.length} 笔待审核</strong><div><button className="primary-btn small-btn" type="button" onClick={() => { setBatchActionResult(null); setPendingBatchAction({ kind: 'withdraw', action: 'APPROVE', targetIds: selectedWithdrawRequestNos }) }}>批量通过</button><button className="ghost-btn small-btn" type="button" onClick={() => { setBatchActionResult(null); setPendingBatchAction({ kind: 'withdraw', action: 'REJECT', targetIds: selectedWithdrawRequestNos }) }}>批量拒绝</button><button className="ghost-btn small-btn" type="button" onClick={() => setSelectedWithdrawRequestNos([])}>清空</button></div></div> : null}
                      {batchActionResult ? <BatchResultSummary result={batchActionResult} /> : null}
                      {adminWithdrawRequests?.items?.length ? <DataTable
                        headers={[<input type="checkbox" aria-label="选择本页全部待审核申请" checked={adminWithdrawRequests.items.some((item) => item.requestStatus === 'PENDING_REVIEW') && adminWithdrawRequests.items.filter((item) => item.requestStatus === 'PENDING_REVIEW').every((item) => selectedWithdrawRequestNos.includes(item.requestNo))} onChange={(event) => setSelectedWithdrawRequestNos(event.target.checked ? adminWithdrawRequests.items.filter((item) => item.requestStatus === 'PENDING_REVIEW').map((item) => item.requestNo) : [])} />, '申请单号', '用户 ID', '申请钻石', '状态', '申请时间']}
                        rows={adminWithdrawRequests.items.map((item) => [
                          <input type="checkbox" aria-label={`选择提现申请 ${item.requestNo}`} disabled={item.requestStatus !== 'PENDING_REVIEW'} checked={selectedWithdrawRequestNos.includes(item.requestNo)} onChange={(event) => setSelectedWithdrawRequestNos((current) => event.target.checked ? [...current, item.requestNo] : current.filter((requestNo) => requestNo !== item.requestNo))} />,
                          <button className={`admin-table-link ${selectedWithdrawRequestNo === item.requestNo ? 'is-active' : ''}`} onClick={() => selectWithdrawRequest(item.requestNo)} aria-pressed={selectedWithdrawRequestNo === item.requestNo}>{item.requestNo}</button>,
                          item.userId, item.requestedDiamondAmount, renderStatusBadge(item.requestStatus), formatDateTime(item.requestedAt),
                        ])}
                        rowClassNames={adminWithdrawRequests.items.map((item) => selectedWithdrawRequestNo === item.requestNo ? 'is-selected' : '')}
                        emptyText="暂无提现申请"
                      /> : <EmptyState title="暂无提现申请" description="按用户或状态查询后，申请会显示在处理队列。" actionLabel="建议先查看待审核" />}
                      <div className="admin-pagination"><span className="admin-page-note" role="status">{withdrawPageLabel}</span><div><button className="ghost-btn small-btn" type="button" onClick={() => void handleWithdrawPageChange(Number(adminWithdrawQuery.page) - 1)} disabled={loading || !hasWithdrawPrevPage}>上一页</button><button className="ghost-btn small-btn" type="button" onClick={() => void handleWithdrawPageChange(Number(adminWithdrawQuery.page) + 1)} disabled={loading || !hasWithdrawNextPage}>下一页</button></div></div>
                    </div>
                    <aside className={`admin-detail-pane ${selectedWithdrawRequest ? 'is-open' : ''}`} aria-label="提现申请详情">
                      {selectedWithdrawRequest ? <>
                        <button className="admin-mobile-detail-close" type="button" onClick={() => setSelectedWithdrawRequestNo(null)} aria-label="关闭申请详情">关闭</button>
                        <div className="admin-detail-heading"><div><span>申请单</span><h3>{selectedWithdrawRequest.requestNo}</h3></div>{renderStatusBadge(selectedWithdrawRequest.requestStatus)}</div>
                        <div className="admin-detail-facts"><InfoRow label="用户 ID" value={selectedWithdrawRequest.userId} /><InfoRow label="申请钻石" value={selectedWithdrawRequest.requestedDiamondAmount} /><InfoRow label="申请周" value={selectedWithdrawRequest.requestWeek} /><InfoRow label="申请时间" value={formatDateTime(selectedWithdrawRequest.requestedAt)} /></div>
                        {selectedWithdrawIsReview ? <div className="admin-action-form"><label>审批备注<input value={adminWithdrawAction.remark} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, remark: e.target.value })} placeholder="通过说明；拒绝时必须填写原因…" /></label></div> : null}
                        {selectedWithdrawIsPayment ? <div className="admin-action-form">
                          <label>打款渠道<input value={adminWithdrawAction.paymentChannel} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, paymentChannel: e.target.value })} placeholder="MANUAL / PIX" /></label>
                          <label>支付凭证号<input value={adminWithdrawAction.paymentReference} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, paymentReference: e.target.value })} placeholder="确认打款时必须填写流水号…" /></label>
                          <label>打款失败原因<input value={adminWithdrawAction.failureReason} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, failureReason: e.target.value })} placeholder="标记失败时必须填写原因…" /></label>
                          <details><summary>补充审计凭证</summary><div className="stack-gap small top-gap"><label>凭证地址<input value={adminWithdrawAction.evidenceUri} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, evidenceUri: e.target.value })} placeholder="受控存储中的凭证地址…" /></label><label>凭证摘要<input value={adminWithdrawAction.evidenceHash} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, evidenceHash: e.target.value })} placeholder="SHA-256" spellCheck={false} /></label></div></details>
                        </div> : null}
                        {selectedWithdrawIsPaid ? <div className="admin-action-form"><label>冲正原因<input value={adminWithdrawAction.reversalReason} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, reversalReason: e.target.value })} placeholder="必须说明冲正依据…" /></label><label>账本币种<input value={adminWithdrawAction.reversalCurrency} onChange={(e) => setAdminWithdrawAction({ ...adminWithdrawAction, reversalCurrency: e.target.value.toUpperCase() })} placeholder="DIAMOND" /></label></div> : null}
                        <InlineHint text={selectedWithdrawIsReview ? '拒绝必须填写原因；提交前会再次确认。' : selectedWithdrawIsPayment ? '确认打款必须填写渠道与流水号；失败必须填写原因。' : selectedWithdrawIsPaid ? '已打款记录不可删除；纠错必须创建冲正账目并保留完整历史。' : '该申请已进入终态，仅保留审计查看。'} />
                        {adminWithdrawActionMessage ? <InlineHint text={adminWithdrawActionMessage} /> : null}
                        <div className="admin-detail-actions">{renderAdminWithdrawActions(selectedWithdrawRequest)}</div>
                      </> : <EmptyState title="选择一笔申请" description="从左侧队列选择申请后，在这里完成审核和打款留痕。" />}
                    </aside>
                  </div>
                </PanelSection>
                ) : null}
              </div>
          ) : null}

          {activeAdminSection === 'bindings' || activeAdminSection === 'riskQueue' || isSystemConfigSection ? (
              <div className="admin-workbench-container" hidden={isSystemConfigSection && currentSettingsView !== 'experiment' && currentSettingsView !== 'guilds'}>
                <PanelSection
                  sectionId="admin-bindings"
                  eyebrow="Bindings"
                  title={isSystemConfigSection ? '配置中心' : activeAdminSection === 'riskQueue' ? '风险队列' : '绑定管理'}
                  description=""
                  action={activeAdminSection === 'bindings' ? <button className="primary-btn" onClick={handleLoadRelation} disabled={loading || !canLoadAdmin || !relationQueryUserId}>查询用户关系</button> : undefined}
                >
                  {activeAdminSection === 'bindings' ? (
                  <div className="admin-binding-user-workbench">
                  <InfoCard title="查询入口" tone="neutral">
                    <div className="grid-form compact-form single-line">
                      <label>
                        用户 ID
                        <input value={relationQueryUserId} onChange={(e) => setRelationQueryUserId(e.target.value)} placeholder="例如 10003" />
                      </label>
                    </div>
                    <InlineHint text="查询当前关系。" />
                  </InfoCard>
                  <InfoCard title="Linky 资格核验" tone="neutral">
                    <div className="grid-form compact-form single-line">
                      <label>
                        Linky 账号
                        <input value={linkyEligibilityAccount} onChange={(e) => setLinkyEligibilityAccount(e.target.value)} placeholder="例如 12345678" />
                      </label>
                    </div>
                    <InlineHint text="校验公会归属。" />
                    <div className="table-toolbar top-gap">
                      <button className="primary-btn small-btn" onClick={handleRefreshLinkyEligibility} disabled={linkyEligibilityLoading || !canLoadAdmin || !linkyEligibilityAccount.trim()}>
                        {linkyEligibilityLoading ? '刷新中…' : '刷新资格结果'}
                      </button>
                      <button className="ghost-btn small-btn" onClick={handleRefreshAllLinkyEligibility} disabled={linkyBatchRefreshLoading || !canLoadAdmin}>
                        {linkyBatchRefreshLoading ? '批量刷新中…' : '批量刷新全部 Linky 资格'}
                      </button>
                    </div>
                    <InlineHint text="批量刷新资格。" />
                    {linkyBatchRefreshResult ? (
                      <div className="relation-grid top-gap">
                        <RelationItem label="成功数量" value={linkyBatchRefreshResult.successCount} />
                        <RelationItem label="失败数量" value={linkyBatchRefreshResult.failureCount} />
                      </div>
                    ) : (
                      <div className="relation-grid top-gap">
                        <RelationItem label="成功数量" value="-" />
                        <RelationItem label="失败数量" value="-" />
                      </div>
                    )}
                    {linkyEligibilityResult ? (
                      <div className="relation-grid top-gap">
                        <RelationItem label="Linky 账号" value={linkyEligibilityResult.linkyAccount} />
                        <RelationItem label="公会判定" value={renderEligibilityStatusBadge(linkyEligibilityResult.guildCheckStatus)} />
                        <RelationItem label="注册资格" value={renderEligibilityStatusBadge(linkyEligibilityResult.registrationEligibility)} />
                        <RelationItem label="公会 ID" value={linkyEligibilityResult.guildId ?? '-'} />
                        <RelationItem label="公会名称" value={linkyEligibilityResult.guildName ?? '-'} />
                        <RelationItem label="检查时间" value={linkyEligibilityResult.checkedAt ? formatDateTime(linkyEligibilityResult.checkedAt) : '-'} />
                        <RelationItem label="结果说明" value={linkyEligibilityResult.remark ?? '-'} />
                      </div>
                    ) : (
                      <EmptyState title="还没有资格结果" description="输入 Linky 账号后刷新，这里会显示当前公会归属和注册资格。" actionLabel="推荐先刷一条真实账号" />
                    )}
                  </InfoCard>
                  </div>
                  ) : null}
                  {activeAdminSection === 'riskQueue' ? (
                  <div className="admin-risk-workbench">
                    <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); void handleLoadRiskEvents() }} aria-label="风险队列筛选">
                      <label>用户 ID<input value={riskQuery.userId} onChange={(e) => setRiskQuery({ ...riskQuery, userId: e.target.value, page: '0' })} placeholder="输入用户 ID…" inputMode="numeric" /></label>
                      <label>状态<select value={riskQuery.riskStatus} onChange={(e) => setRiskQuery({ ...riskQuery, riskStatus: e.target.value, page: '0' })}><option value="PENDING">待处理</option><option value="HANDLED">已处理</option><option value="IGNORED">已忽略</option><option value="">全部</option></select></label>
                      <div className="admin-filter-actions"><button className="primary-btn small-btn" type="submit" disabled={loading || !canLoadAdmin}>{loading ? '查询中…' : '查询'}</button><button className="ghost-btn small-btn" type="button" onClick={() => { setRiskQuery({ userId: '', riskStatus: 'PENDING', startAt: '', endAt: '', page: '0', size: '10' }); setRiskEvents(null); setHasQueriedRiskEvents(false) }} disabled={loading}>重置</button></div>
                    </form>
                    <div className="admin-saved-views" aria-label="风险个人筛选视图"><select value={selectedRiskViewId} onChange={(event) => applyRiskView(event.target.value)} aria-label="选择风险筛选视图"><option value="">个人筛选视图</option>{riskViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}</select><input value={riskViewName} onChange={(event) => setRiskViewName(event.target.value)} placeholder="给当前筛选命名…" aria-label="风险筛选视图名称" /><button className="ghost-btn small-btn" type="button" onClick={saveRiskView} disabled={!riskViewName.trim()}>保存视图</button><button className="ghost-btn small-btn" type="button" onClick={removeRiskView} disabled={!selectedRiskViewId}>删除</button></div>
                    {selectedRiskEventIds.length ? <div className="admin-batch-bar" role="region" aria-label="风险批量操作"><strong>已选 {selectedRiskEventIds.length} 条待处理风险</strong><div><button className="primary-btn small-btn" type="button" onClick={() => { setBatchActionResult(null); setPendingBatchAction({ kind: 'risk', action: 'HANDLE', targetIds: selectedRiskEventIds }) }}>批量处理</button><button className="ghost-btn small-btn" type="button" onClick={() => { setBatchActionResult(null); setPendingBatchAction({ kind: 'risk', action: 'IGNORE', targetIds: selectedRiskEventIds }) }}>批量忽略</button><button className="ghost-btn small-btn" type="button" onClick={() => setSelectedRiskEventIds([])}>清空</button></div></div> : null}
                    {batchActionResult ? <BatchResultSummary result={batchActionResult} /> : null}
                    {riskEvents?.items?.length ? <DataTable headers={[<input type="checkbox" aria-label="选择本页全部待处理风险" checked={riskEvents.items.some((item) => item.riskStatus === 'PENDING') && riskEvents.items.filter((item) => item.riskStatus === 'PENDING').every((item) => selectedRiskEventIds.includes(item.id))} onChange={(event) => setSelectedRiskEventIds(event.target.checked ? riskEvents.items.filter((item) => item.riskStatus === 'PENDING').map((item) => item.id) : [])} />, '事件', '用户', '风险', '状态', '发现时间', '处理']} rows={riskEvents.items.map((item) => [
                      <input type="checkbox" aria-label={`选择风险事件 ${item.id}`} disabled={item.riskStatus !== 'PENDING'} checked={selectedRiskEventIds.includes(item.id)} onChange={(event) => setSelectedRiskEventIds((current) => event.target.checked ? [...current, item.id] : current.filter((riskEventId) => riskEventId !== item.id))} />,
                      `#${item.id}`, `#${item.userId}`, <div><strong>{item.riskType}</strong><small className="admin-cell-note">等级 {item.riskLevel}</small></div>, renderStatusBadge(item.riskStatus), formatDateTime(item.detectedAt),
                      <div className="admin-row-actions"><input value={riskActionDrafts[item.id] || ''} onChange={(e) => updateRiskActionDraft(item.id, e.target.value)} placeholder="处理备注…" aria-label={`风险事件 ${item.id} 处理备注`} />{item.riskStatus === 'PENDING' ? <><button className="primary-btn small-btn" onClick={() => openRiskActionConfirm(item, 'HANDLE')} disabled={riskActionLoadingId === item.id}>处理</button><button className="ghost-btn small-btn" onClick={() => openRiskActionConfirm(item, 'IGNORE')} disabled={riskActionLoadingId === item.id || !(riskActionDrafts[item.id] || '').trim()}>忽略</button><button className="ghost-btn small-btn" onClick={() => openRiskActionConfirm(item, 'FREEZE_USER')} disabled={riskActionLoadingId === item.id || !(riskActionDrafts[item.id] || '').trim()}>冻结用户</button></> : item.riskStatus === 'HANDLED' ? <button className="ghost-btn small-btn" onClick={() => openRiskActionConfirm(item, 'UNFREEZE_USER')} disabled={riskActionLoadingId === item.id}>解冻用户</button> : null}</div>,
                    ])} emptyText="当前筛选下没有风险事件" /> : <EmptyState title="暂无待处理风险" description="当前筛选下没有需要人工处置的事件。" actionLabel="可切换状态查看历史" />}
                    <InlineHint text="忽略或冻结用户属于高影响操作，必须先填写处理备注并二次确认。" />
                    <div className="table-toolbar"><button className="ghost-btn small-btn" onClick={() => handleRiskPageChange(Number(riskQuery.page) - 1)} disabled={!hasRiskPrevPage}>上一页</button><span className="admin-page-note">{riskPageLabel}</span><button className="ghost-btn small-btn" onClick={() => handleRiskPageChange(Number(riskQuery.page) + 1)} disabled={!hasRiskNextPage}>下一页</button></div>
                  </div>
                  ) : null}

                  {isSystemConfigSection ? (
                    <>
                  <div hidden={currentSettingsView !== 'experiment'}>
                  <InfoCard title="100 人验证实验" tone="neutral">
                    <div className="grid-form compact-form exception-filter-grid">
                      <label>实验代码<input value={experimentCode} onChange={(e) => setExperimentCode(e.target.value)} placeholder="BANDEIRA_V1_100" /></label>
                      <label>实验名称<input value={experimentForm.name} onChange={(e) => setExperimentForm({ ...experimentForm, name: e.target.value })} /></label>
                      <label>主指标<input value={experimentForm.primaryMetricCode} onChange={(e) => setExperimentForm({ ...experimentForm, primaryMetricCode: e.target.value })} placeholder="FIRST_INCOME" /></label>
                      <label>招募开始<input type="datetime-local" value={experimentForm.enrollmentStartsAt} onChange={(e) => setExperimentForm({ ...experimentForm, enrollmentStartsAt: e.target.value })} /></label>
                      <label>招募结束<input type="datetime-local" value={experimentForm.enrollmentEndsAt} onChange={(e) => setExperimentForm({ ...experimentForm, enrollmentEndsAt: e.target.value })} /></label>
                      <label>观察结束<input type="datetime-local" value={experimentForm.observationEndsAt} onChange={(e) => setExperimentForm({ ...experimentForm, observationEndsAt: e.target.value })} /></label>
                    </div>
                    <InlineHint text="样本上限固定为 100；退出用户仍计入固定分母，生产不自动生成测试用户或指标。" />
                    <div className="table-toolbar top-gap">
                      <button className="ghost-btn small-btn" onClick={() => void handleLoadExperiment()} disabled={loading || !experimentCode.trim()}>加载看板</button>
                      <button className="primary-btn small-btn" onClick={() => void handleCreateExperiment()} disabled={loading || !experimentForm.enrollmentStartsAt || !experimentForm.enrollmentEndsAt || !experimentForm.observationEndsAt}>创建草稿</button>
                      <button className="ghost-btn small-btn" onClick={() => void handleExperimentStatus('ENROLLING')} disabled={loading || experimentDashboard?.status !== 'DRAFT'}>开启招募</button>
                      <button className="ghost-btn small-btn" onClick={() => void handleExperimentStatus('RUNNING')} disabled={loading || experimentDashboard?.status !== 'ENROLLING'}>开始观察</button>
                      <button className="ghost-btn small-btn" onClick={() => void handleExperimentStatus('COMPLETED')} disabled={loading || experimentDashboard?.status !== 'RUNNING'}>完成实验</button>
                    </div>
                    {experimentDashboard ? <div className="relation-grid top-gap">
                      <RelationItem label="状态" value={renderStatusBadge(experimentDashboard.status)} />
                      <RelationItem label="固定分母" value={`${experimentDashboard.fixedDenominator} / ${experimentDashboard.plannedSampleSize}`} />
                      <RelationItem label="观察中" value={experimentDashboard.active} />
                      <RelationItem label="已完成" value={experimentDashboard.completed} />
                      <RelationItem label="退出（仍计分母）" value={experimentDashboard.withdrawn} />
                      <RelationItem label={experimentDashboard.primaryMetricCode} value={`${experimentDashboard.convertedCount} 人 / ${experimentDashboard.metricTotal}`} />
                    </div> : null}
                    <div className="grid-form compact-form exception-filter-grid top-gap">
                      <label>用户 ID<input value={experimentParticipant.userId} onChange={(e) => setExperimentParticipant({ ...experimentParticipant, userId: e.target.value })} /></label>
                      <label>队列分组<input value={experimentParticipant.cohortCode} onChange={(e) => setExperimentParticipant({ ...experimentParticipant, cohortCode: e.target.value })} /></label>
                      <label>资格快照<input value={experimentParticipant.eligibilitySnapshot} onChange={(e) => setExperimentParticipant({ ...experimentParticipant, eligibilitySnapshot: e.target.value })} placeholder='{"phoneVerified":true}' /></label>
                    </div>
                    <button className="primary-btn small-btn top-gap" onClick={() => void handleEnrollParticipant()} disabled={loading || experimentDashboard?.status !== 'ENROLLING' || !experimentParticipant.userId || !experimentParticipant.eligibilitySnapshot.trim()}>加入实验队列</button>
                  </InfoCard>
                  </div>
                  <div hidden={currentSettingsView !== 'guilds'}>
                  <InfoCard title="公会周报" tone="success">
                    <div className="grid-form compact-form exception-filter-grid">
                      <label>
                        公会 ID
                        <input value={guildWeeklyQuery.guildId} onChange={(e) => setGuildWeeklyQuery({ ...guildWeeklyQuery, guildId: e.target.value })} placeholder="例如 GUILD-A" />
                      </label>
                      <label>
                        周期
                        <select value={guildWeeklyQuery.week} onChange={(e) => setGuildWeeklyQuery({ ...guildWeeklyQuery, week: e.target.value })}>
                          <option value="CURRENT">本周</option>
                          <option value="PREVIOUS">上周</option>
                        </select>
                      </label>
                    </div>
                    <InlineHint text="按公会聚合。" />
                    <div className="table-toolbar top-gap">
                      <button className="primary-btn small-btn" onClick={handleLoadGuildWeeklyReport} disabled={guildWeeklyLoading || !canLoadAdmin || !guildWeeklyQuery.guildId.trim()}>
                        {guildWeeklyLoading ? '查询中…' : '查询公会周报'}
                      </button>
                    </div>
                    {guildWeeklyReport ? (
                      <div className="relation-grid top-gap">
                        <RelationItem label="产品" value={guildWeeklyReport.productCode} />
                        <RelationItem label="公会 ID" value={guildWeeklyReport.guildId} />
                        <RelationItem label="周期" value={guildWeeklyReport.week} />
                        <RelationItem label="注册用户" value={guildWeeklyReport.registeredUsers} />
                        <RelationItem label="收入金额" value={guildWeeklyReport.incomeAmount} />
                        <RelationItem label="贡献分佣" value={guildWeeklyReport.rewardAmount} />
                      </div>
                    ) : (
                      <EmptyState title="还没有公会周报" description="输入公会 ID 后查询，这里会显示真实聚合后的注册、收入和分佣数据。" />
                    )}
                  </InfoCard>
                  <InfoCard title="公会配置管理" tone="neutral">
                    <div className="grid-form compact-form exception-filter-grid">
                      <label>
                        产品
                        <input value={guildConfigForm.productCode} onChange={(e) => setGuildConfigForm({ ...guildConfigForm, productCode: e.target.value })} placeholder="LINKY" />
                      </label>
                      <label>
                        上级用户 ID（为空则为默认公会）
                        <input value={guildConfigForm.inviterUserId} onChange={(e) => setGuildConfigForm({ ...guildConfigForm, inviterUserId: e.target.value })} placeholder="例如 1001" />
                      </label>
                      <label>
                        Linky 公会 ID
                        <input value={guildConfigForm.guildId} onChange={(e) => setGuildConfigForm({ ...guildConfigForm, guildId: e.target.value })} placeholder="例如 LINKY_GUILD_A" />
                      </label>
                      <label>
                        公会名称
                        <input value={guildConfigForm.guildName} onChange={(e) => setGuildConfigForm({ ...guildConfigForm, guildName: e.target.value })} placeholder="例如 Linky A Guild" />
                      </label>
                      <label>
                        公会邀请码
                        <input value={guildConfigForm.guildInviteCode} onChange={(e) => setGuildConfigForm({ ...guildConfigForm, guildInviteCode: e.target.value })} placeholder="例如 JOIN-A" />
                      </label>
                      <label>
                        启用状态
                        <select value={guildConfigForm.enabled ? 'ENABLED' : 'DISABLED'} onChange={(e) => setGuildConfigForm({ ...guildConfigForm, enabled: e.target.value === 'ENABLED' })}>
                          <option value="ENABLED">启用</option>
                          <option value="DISABLED">停用</option>
                        </select>
                      </label>
                    </div>
                    <InlineHint text="维护公会映射。" />
                    <div className="table-toolbar top-gap">
                      <button className="ghost-btn small-btn" onClick={handleLoadGuildConfigs} disabled={guildConfigLoading || !canLoadAdmin}>
                        {guildConfigLoading ? '查询中…' : '查询公会配置'}
                      </button>
                      <button className="primary-btn small-btn" onClick={handleSaveGuildConfig} disabled={guildConfigLoading || !canLoadAdmin || !guildConfigForm.productCode.trim() || !guildConfigForm.guildId.trim() || !guildConfigForm.guildInviteCode.trim()}>
                        {guildConfigLoading ? '保存中…' : '保存公会配置'}
                      </button>
                    </div>
                    {guildConfigs?.length ? (
                      <DataTable
                        headers={['产品', '上级用户', 'Linky 公会 ID', '公会名称', '公会邀请码', '启用状态']}
                        rows={guildConfigs.map((item) => [
                          item.productCode,
                          item.inviterUserId ?? '默认公会',
                          item.guildId,
                          item.guildName,
                          item.guildInviteCode,
                          item.enabled ? '启用' : '停用',
                        ])}
                        emptyText="暂无公会配置"
                      />
                    ) : (
                      <EmptyState title="暂无公会配置" description="点击查询公会配置加载现有映射；保存后会显示上级分销人对应的 Linky 公会邀请码。" />
                    )}
                  </InfoCard>
                  </div>
                    </>
                  ) : null}

                  {activeAdminSection === 'bindings' ? (
                  adminRelation ? (
                    <div className="stack-gap relation-workbench">
                      <div className="relation-grid">
                        <RelationItem label="用户ID" value={adminRelation.userId} />
                        <RelationItem label="一级上级" value={adminRelation.level1InviterId} />
                        <RelationItem label="二级上级" value={adminRelation.level2InviterId} />
                        <RelationItem label="三级上级" value={adminRelation.level3InviterId} />
                        <RelationItem label="绑定来源" value={adminRelation.bindSource} />
                        <RelationItem label="锁定状态" value={renderStatusBadge(adminRelation.lockStatus)} />
                        <RelationItem label="绑定时间" value={formatDateTime(adminRelation.bindTime)} />
                        <RelationItem label="锁定时间" value={adminRelation.lockTime ? formatDateTime(adminRelation.lockTime) : '-'} />
                        <RelationItem label="国家" value={adminRelation.countryCode} />
                        <RelationItem label="跨国家" value={adminRelation.crossCountry ? '是' : '否'} />
                      </div>

                      <div className="content-grid two-columns nested-grid admin-workspace-grid workspace-grid">
                        <InfoCard title="当前关系" tone="neutral">
                          <InfoRow label="当前一级上级" value={adminRelation.level1InviterId ?? '-'} />
                          <InfoRow label="当前二级上级" value={adminRelation.level2InviterId ?? '-'} />
                          <InfoRow label="当前三级上级" value={adminRelation.level3InviterId ?? '-'} />
                          <InfoRow label="当前来源" value={adminRelation.bindSource} />
                        </InfoCard>
                        <InfoCard title="修正预览" tone="success">
                          <InfoRow label="修正后一级上级" value={relationPreview?.nextLevel1InviterId ?? '-'} />
                          <InfoRow label="修正后来源" value={relationPreview?.nextBindSource ?? 'MANUAL'} />
                          <InfoRow label="变更说明" value={relationPreview?.summary ?? '保持当前关系'} />
                        </InfoCard>
                      </div>

                      <InfoCard title="人工修正" tone="neutral">
                        <div className="grid-form compact-form">
                          <label>
                            人工修正后的一级上级用户 ID
                            <input value={relationAdjustInviterId} onChange={(e) => setRelationAdjustInviterId(e.target.value)} placeholder="留空后保存 = 设为根关系" />
                          </label>
                          <label>
                            修正备注
                            <input value={relationAdjustNote} onChange={(e) => setRelationAdjustNote(e.target.value)} placeholder="例如：人工修正绑定关系" />
                          </label>
                        </div>
                        <InlineHint text={adminRelation.lockStatus === 'LOCKED' ? '当前关系已锁定，请先解锁后再人工修正。' : '确认预览无误后再提交人工修正。'} />
                        <div className="table-toolbar">
                          <button className="primary-btn small-btn" onClick={openRelationAdjustConfirm} disabled={relationAdjustLoading || !canLoadAdmin || adminRelation.lockStatus === 'LOCKED'}>预览后确认修正</button>
                          <button className="ghost-btn small-btn" onClick={() => setRelationAdjustInviterId('')} disabled={relationAdjustLoading}>设为根关系</button>
                        </div>
                      </InfoCard>
                    </div>
                  ) : (
                    <EmptyState title="暂无关系链结果" description="输入用户 ID 后查询，这里会显示当前关系和修正预览。" />
                  )
                  ) : null}
                </PanelSection>
              </div>
          ) : null}
        </main>

      </div>

      {selectedLinkyDrawer ? (

        <DrawerDialog
          title={selectedLinkyTitle}
          subtitle={selectedLinkyDrawer.kind === 'webhook' ? 'Linky webhook 详情' : 'Linky replay 详情'}
          onClose={() => setSelectedLinkyDrawer(null)}
        >
          {selectedLinkySections.map((section) => (
            <DetailSection key={section.title} title={section.title} rows={section.rows} />
          ))}
          {selectedLinkyRelated ? (
            <RelatedLinkySection
              relatedWebhooks={selectedLinkyRelated.relatedWebhooks}
              relatedReplays={selectedLinkyRelated.relatedReplays}
              fingerprintHint={selectedLinkyRelated.fingerprintHint}
            />
          ) : null}
        </DrawerDialog>
      ) : null}

      {isMentorQualificationDialogOpen ? (
        <ConfirmDialog
          title={mentorQualificationTarget ? `编辑导师资格 · 用户 ${mentorQualificationTarget.userId}` : '新建导师资格'}
          tone="primary"
          confirmText={mentorQualificationTarget ? '保存资格修改' : '保存导师资格'}
          loading={loading}
          confirmDisabled={!mentorQualificationForm.userId || !mentorQualificationForm.languageCode || !mentorQualificationForm.maxActiveStudents}
          onCancel={() => { setIsMentorQualificationDialogOpen(false); setMentorQualificationTarget(null) }}
          onConfirm={() => void handleQualifyMentor()}
        >
          <form className="grid-form compact-form exception-filter-grid" onSubmit={(event) => { event.preventDefault(); void handleQualifyMentor() }}>
            <label>用户 ID<input required disabled={Boolean(mentorQualificationTarget)} inputMode="numeric" value={mentorQualificationForm.userId} onChange={(event) => setMentorQualificationForm({ ...mentorQualificationForm, userId: event.target.value.replace(/\D/g, '') })} /></label>
            <label>归属国家<select value={mentorQualificationForm.countryCode} onChange={(event) => { const countryCode = event.target.value; setMentorQualificationForm({ ...mentorQualificationForm, countryCode, languageCode: mentorQualificationLanguage(countryCode).code }) }}>{phoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names.zh}（{country.countryCode}）</option>)}</select></label>
            <label>归属语言（自动）<input disabled value={`${mentorQualificationLanguage(mentorQualificationForm.countryCode).label}（${mentorQualificationForm.languageCode}）`} /></label>
            <label>最大带教人数<input required min="1" inputMode="numeric" value={mentorQualificationForm.maxActiveStudents} onChange={(event) => setMentorQualificationForm({ ...mentorQualificationForm, maxActiveStudents: event.target.value.replace(/\D/g, '') })} /></label>
          </form>
          <InlineHint text={mentorQualificationTarget ? '仅更新该导师的资格范围和带教上限；导师用户 ID 不可变更，不会调整已有学员归属，也不会产生任何分成或付款。' : '保存后仅建立导师资格与带教上限；不会自动分配学员，也不会产生任何分成或付款。'} />
        </ConfirmDialog>
      ) : null}

      {mentorAssignmentTarget ? (
        <ConfirmDialog
          title={`编辑学员 · 导师 ${mentorAssignmentTarget.userId}`}
          tone="primary"
          confirmText="保存学员归属"
          loading={loading}
          confirmDisabled={!mentorAssignmentForm.studentUserId || !mentorAssignmentForm.reason.trim()}
          onCancel={() => { setMentorAssignmentTarget(null); setMentorAssignmentForm({ studentUserId: '', mentorUserId: '', reason: '' }); setMentorAssignedStudents([]) }}
          onConfirm={() => void handleAssignMentor()}
        >
          <form className="grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void handleAssignMentor() }}>
            <label>导师信息<input disabled value={`用户 ${mentorAssignmentTarget.userId} · 当前 ${mentorAssignmentTarget.assignedStudentCount}/${mentorAssignmentTarget.maxActiveStudents} 名学员`} /></label>
            <label>新增或调整的学员用户 ID<input required inputMode="numeric" value={mentorAssignmentForm.studentUserId} onChange={(event) => setMentorAssignmentForm({ ...mentorAssignmentForm, studentUserId: event.target.value.replace(/\D/g, '') })} /></label>
            <label className="full-span">归属原因<textarea required maxLength={255} value={mentorAssignmentForm.reason} onChange={(event) => setMentorAssignmentForm({ ...mentorAssignmentForm, reason: event.target.value })} placeholder="例如：语言与国家匹配，运营审核通过" /></label>
          </form>
          <div className="mentor-current-students"><strong>当前归属学员（{mentorAssignedStudentsLoading ? '读取中…' : mentorAssignedStudents.length}）</strong>{mentorAssignedStudentsLoading ? <p>正在读取当前学员…</p> : mentorAssignedStudents.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>学员</th><th>国家 / 语言</th><th>归属生效</th><th>归属原因</th></tr></thead><tbody>{mentorAssignedStudents.map((student) => <tr key={student.userId}><td>用户 {student.userId}{student.phoneNumber ? ` · ${student.phoneNumber}` : ''}</td><td>{student.countryCode} / {student.languageCode}</td><td>{formatDateTime(student.assignedAt)}</td><td>{student.assignmentReason}</td></tr>)}</tbody></table></div> : <p>当前没有已归属学员。</p>}</div>
          <InlineHint text="保存后会为该学员创建新的导师归属版本；系统将校验导师带教上限，不会改写既有历史关系。" />
        </ConfirmDialog>
      ) : null}

      {teamMemberTarget ? (
        <ConfirmDialog
          title={`团队成员 · ${teamMemberTarget.teamName}`}
          tone="primary"
          confirmText="关闭"
          loading={false}
          onCancel={() => { setTeamMemberTarget(null); setTeamMembers([]) }}
          onConfirm={() => { setTeamMemberTarget(null); setTeamMembers([]) }}
        >
          <p>团队编码：{teamMemberTarget.teamCode}；当前成员 {teamMemberTarget.activeMemberCount} 人。</p>
          {teamMembersLoading ? <p>正在读取团队成员…</p> : teamMembers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>成员</th><th>国家</th><th>关系</th><th>归属来源</th><th>生效时间</th></tr></thead><tbody>{teamMembers.map((member) => <tr key={`${member.userId}-${member.memberRole}-${member.effectiveFrom}`}><td>用户 {member.userId}{member.phoneNumber ? ` · ${member.phoneNumber}` : ''}</td><td>{member.countryCode}</td><td>{member.memberRole === 'LEADER' ? '负责人' : '成员'}</td><td>{member.sourceType}</td><td>{formatDateTime(member.effectiveFrom)}</td></tr>)}</tbody></table></div> : <p>当前没有有效成员归属。</p>}
          <InlineHint text="此列表仅展示当前有效归属。后续用户等级自动产生负责人时，会新增团队与成员关系，不会删除既有上级团队归属。" />
        </ConfirmDialog>
      ) : null}

      {teamOperatingProfitSharePermissionTarget ? (
        <ConfirmDialog
          title="确认团队经营利润分成许可"
          tone={teamOperatingProfitSharePermissionTarget.enabled ? 'primary' : 'warning'}
          confirmText={teamOperatingProfitSharePermissionTarget.enabled ? '确认许可' : '确认取消许可'}
          loading={loading}
          onCancel={() => setTeamOperatingProfitSharePermissionTarget(null)}
          onConfirm={() => void confirmTeamOperatingProfitSharePermission()}
        >
          <p>团队：<strong>{teamOperatingProfitSharePermissionTarget.team.teamName}</strong>；负责人：用户 {teamOperatingProfitSharePermissionTarget.team.leaderUserId}。</p>
          <p>{teamOperatingProfitSharePermissionTarget.enabled ? '确认后，该团队才可在同时满足团队利润事实、既有资格与分红规则时，进入后续团队经营利润分成演算。' : '确认后，该团队不再进入后续团队经营利润分成演算；既有团队、成员关系及历史影子记录不会被删除。'}</p>
          <InlineHint text="团长身份仍由等级规则自动产生，运营在此只能控制团队经营利润分成许可，不能手工授予或撤销团长身份。此操作不产生真实奖励、余额、提现或付款。" />
        </ConfirmDialog>
      ) : null}

      {platformGuildShareDialogTarget ? (
        <ConfirmDialog
          title={`编辑公司分成 · ${platformGuildShareDialogTarget.guildName}`}
          tone="primary"
          confirmText="建立待审版本"
          loading={loading}
          confirmDisabled={!platformGuildShareForm.rate || !platformGuildShareForm.effectiveFrom}
          onCancel={() => { setPlatformGuildShareDialogTarget(null); setPlatformGuildShareRules([]) }}
          onConfirm={() => void savePlatformGuildOperatingShareRate()}
        >
          <p>平台：{platformGuildShareDialogTarget.platformCode}；权威公会：{platformGuildShareDialogTarget.guildId}。新数值先保存为待审版本，审批前不参与任何公司业务收入或邀请候选计算。</p>
          <form className="grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void savePlatformGuildOperatingShareRate() }}>
            <label>公司分成比例<input required type="number" min="0" max="1" step="0.000001" inputMode="decimal" value={platformGuildShareForm.rate} onChange={(event) => setPlatformGuildShareForm({ ...platformGuildShareForm, rate: event.target.value })} placeholder="例如 0.25 表示 25%" /></label>
            <label>生效时间<input required type="datetime-local" value={platformGuildShareForm.effectiveFrom} onChange={(event) => setPlatformGuildShareForm({ ...platformGuildShareForm, effectiveFrom: event.target.value })} /></label>
          </form>
          <div className="stack-gap small"><strong>版本历史</strong>{platformGuildShareRules.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>版本</th><th>比例</th><th>生效区间</th><th>状态</th><th>审批</th></tr></thead><tbody>{platformGuildShareRules.map((rule) => <tr key={rule.id}><td>V{rule.shareVersion}</td><td>{(rule.shareRate * 100).toFixed(2)}%</td><td>{formatDateTime(rule.effectiveFrom)} {rule.effectiveTo ? `至 ${formatDateTime(rule.effectiveTo)}` : '起长期有效'}</td><td>{rule.status === 'DRAFT' ? '待审' : rule.status === 'ACTIVE' ? '已启用' : rule.status}</td><td>{rule.status === 'DRAFT' ? <button type="button" className="primary-btn small-btn" disabled={loading} onClick={() => void activatePlatformGuildOperatingShareRate(rule)}>审批并启用</button> : rule.approvedAt ? `${formatDateTime(rule.approvedAt)}${rule.approvalNote ? ` · ${rule.approvalNote}` : ''}` : '—'}</td></tr>)}</tbody></table></div> : <p>尚无历史版本。</p>}</div>
          <InlineHint text="审批后，系统会封存本版本及其生效区间；已产生的 MCN 收入事实仍按发生时的比例快照计算，不会被后续修改重写。" />
        </ConfirmDialog>
      ) : null}

      {isUserGradeLevelDialogOpen ? (
        <ConfirmDialog
          title="新增积分等级"
          tone="primary"
          confirmText="建立待审等级"
          loading={loading}
          confirmDisabled={!userGradeLevelForm.levelName.trim() || !userGradeLevelForm.levelRank || !userGradeLevelForm.requiredPoints || !userGradeLevelForm.effectiveFrom}
          onCancel={() => setIsUserGradeLevelDialogOpen(false)}
          onConfirm={() => void saveUserGradeLevel()}
        >
          <form className="grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void saveUserGradeLevel() }}>
            <label>等级名称<input required maxLength={64} value={userGradeLevelForm.levelName} onChange={(event) => setUserGradeLevelForm({ ...userGradeLevelForm, levelName: event.target.value })} placeholder="例如：黄金合伙人" /></label>
            <label>等级级别<input required min="1" inputMode="numeric" value={userGradeLevelForm.levelRank} onChange={(event) => setUserGradeLevelForm({ ...userGradeLevelForm, levelRank: event.target.value.replace(/\D/g, '') })} placeholder="例如：5" /></label>
            <label>积分门槛<input required min="0" step="0.000001" inputMode="decimal" value={userGradeLevelForm.requiredPoints} onChange={(event) => setUserGradeLevelForm({ ...userGradeLevelForm, requiredPoints: event.target.value })} placeholder="例如：1000" /></label>
            <label className="checkbox-label"><input type="checkbox" checked={userGradeLevelForm.grantsTeamLeader} onChange={(event) => setUserGradeLevelForm({ ...userGradeLevelForm, grantsTeamLeader: event.target.checked })} />达到本等级可成为团队负责人</label>
            <label>生效时间<input required type="datetime-local" value={userGradeLevelForm.effectiveFrom} onChange={(event) => setUserGradeLevelForm({ ...userGradeLevelForm, effectiveFrom: event.target.value })} /></label>
            <label>失效时间（可选）<input type="datetime-local" value={userGradeLevelForm.effectiveTo} onChange={(event) => setUserGradeLevelForm({ ...userGradeLevelForm, effectiveTo: event.target.value })} /></label>
          </form>
          <InlineHint text="等级仅保存为待审配置。每个生效时段只能有一个“可成为团队负责人”的等级门槛；在积分来源明确并接通之前，不会自动给用户升级或创建团队。" />
        </ConfirmDialog>
      ) : null}

      {isUserGradeAdvancementDialogOpen ? (
        <ConfirmDialog
          title="建立高级等级培养与经营验收记录"
          tone="primary"
          confirmText="建立验收记录"
          loading={loading}
          confirmDisabled={!userGradeAdvancementForm.userId || !userGradeAdvancementForm.guildId.trim()}
          onCancel={() => setIsUserGradeAdvancementDialogOpen(false)}
          onConfirm={() => void saveUserGradeAdvancementReview()}
        >
          <form className="grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void saveUserGradeAdvancementReview() }}>
            <label>用户 ID<input required min="1" inputMode="numeric" value={userGradeAdvancementForm.userId} onChange={(event) => setUserGradeAdvancementForm({ ...userGradeAdvancementForm, userId: event.target.value.replace(/\D/g, '') })} placeholder="例如：10001" /></label>
            <label>目标等级<select value={userGradeAdvancementForm.targetGradeCode} onChange={(event) => setUserGradeAdvancementForm({ ...userGradeAdvancementForm, targetGradeCode: event.target.value })}><option value="PLATINUM">铂金</option><option value="DIAMOND">钻石</option><option value="BLACK_GOLD">黑金</option></select></label>
            <label>平台<select value={userGradeAdvancementForm.platformCode} onChange={(event) => setUserGradeAdvancementForm({ ...userGradeAdvancementForm, platformCode: event.target.value })}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
            <label>权威公会 ID<input required value={userGradeAdvancementForm.guildId} onChange={(event) => setUserGradeAdvancementForm({ ...userGradeAdvancementForm, guildId: event.target.value })} placeholder="例如：22000448" /></label>
          </form>
          <InlineHint text="建立后依次补充培养、经营和职责三项确认。该记录只是等级与团队负责人流程的证据，不会自动授予负责人身份、创建团队或开启团队经营分成。" />
        </ConfirmDialog>
      ) : null}

      {platinumEvidenceTarget ? (
        <ConfirmDialog
          title={`录入${platinumEvidenceTarget.targetGradeCode === 'PLATINUM' ? '铂金' : platinumEvidenceTarget.targetGradeCode === 'DIAMOND' ? '钻石' : '黑金'}培养与经营证据 · 用户 ${platinumEvidenceTarget.userId}`}
          tone="primary"
          confirmText="保存证据"
          loading={loading}
          confirmDisabled={!platinumEvidenceForm.traineeUserId || !platinumEvidenceForm.groupReference.trim() || !platinumEvidenceForm.observationStart || !platinumEvidenceForm.observationEnd || !platinumEvidenceForm.evidenceNote.trim()}
          onCancel={() => setPlatinumEvidenceTarget(null)}
          onConfirm={() => void (platinumEvidenceTarget.targetGradeCode === 'PLATINUM' ? savePlatinumEvidence() : saveAdvancedEvidence())}
        >
          <form className="grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void (platinumEvidenceTarget.targetGradeCode === 'PLATINUM' ? savePlatinumEvidence() : saveAdvancedEvidence()) }}>
            <label>{platinumEvidenceTarget.targetGradeCode === 'PLATINUM' ? '银牌' : platinumEvidenceTarget.targetGradeCode === 'DIAMOND' ? '金牌' : '钻石'}成员用户 ID<input required min="1" inputMode="numeric" value={platinumEvidenceForm.traineeUserId} onChange={(event) => setPlatinumEvidenceForm({ ...platinumEvidenceForm, traineeUserId: event.target.value.replace(/\D/g, '') })} placeholder={`必须为同平台、同公会已达标${platinumEvidenceTarget.targetGradeCode === 'PLATINUM' ? '银牌' : platinumEvidenceTarget.targetGradeCode === 'DIAMOND' ? '金牌' : '钻石'}`} /></label>
            <label>成员负责{platinumEvidenceTarget.targetGradeCode === 'DIAMOND' ? '团队' : platinumEvidenceTarget.targetGradeCode === 'BLACK_GOLD' ? '经营范围' : '小组'}标识<input required maxLength={128} value={platinumEvidenceForm.groupReference} onChange={(event) => setPlatinumEvidenceForm({ ...platinumEvidenceForm, groupReference: event.target.value })} placeholder="两个成员不得填写同一标识" /></label>
            <label>观察开始日期<input required type="date" value={platinumEvidenceForm.observationStart} onChange={(event) => setPlatinumEvidenceForm({ ...platinumEvidenceForm, observationStart: event.target.value })} /></label>
            <label>观察结束日期<input required type="date" value={platinumEvidenceForm.observationEnd} onChange={(event) => setPlatinumEvidenceForm({ ...platinumEvidenceForm, observationEnd: event.target.value })} /></label>
            {platinumEvidenceTarget.targetGradeCode === 'PLATINUM' ? <><label>最后 7 天有效用户数<input required min="5" type="number" value={platinumEvidenceForm.finalWeekEffectiveUserCount} onChange={(event) => setPlatinumEvidenceForm({ ...platinumEvidenceForm, finalWeekEffectiveUserCount: event.target.value })} /></label><label>最后 7 天每位成员最少收入日期数<input required min="3" max="7" type="number" value={platinumEvidenceForm.finalWeekMinIncomeDateCount} onChange={(event) => setPlatinumEvidenceForm({ ...platinumEvidenceForm, finalWeekMinIncomeDateCount: event.target.value })} /></label></> : null}
            <label className="full-width">验收依据<textarea required maxLength={1000} value={platinumEvidenceForm.evidenceNote} onChange={(event) => setPlatinumEvidenceForm({ ...platinumEvidenceForm, evidenceNote: event.target.value })} placeholder="记录培养事实、经营验收材料与复核结论" /></label>
          </form>
          <InlineHint text={platinumEvidenceTarget.targetGradeCode === 'PLATINUM' ? '系统会校验：铂金本人已达标金牌；每条记录对应不同银牌成员与不同小组；观察期至少 30 天；最后 7 天至少 5 名有效用户且每位至少 3 个收入日期。保存两条后才能确认培养。不会自动升级、建队或开启团队经营分成。' : platinumEvidenceTarget.targetGradeCode === 'DIAMOND' ? '系统会校验：本人已有已确认铂金记录；两名不同金牌成员、不同团队范围，以及各自至少连续 2 个完整自然月。经营 KPI 结论仍需运营复核。' : '系统会校验：本人已有已确认钻石记录；两名不同钻石成员、不同经营范围，以及各自至少连续 3 个完整自然月。经营 KPI 结论仍需运营复核。'} />
        </ConfirmDialog>
      ) : null}

      {effectiveUserCorrectionTarget ? (
        <ConfirmDialog
          title="人工纠偏有效用户资格"
          tone="warning"
          confirmText="确认排除资格"
          loading={loading}
          confirmDisabled={!effectiveUserCorrectionForm.correctionNote.trim()}
          onCancel={() => setEffectiveUserCorrectionTarget(null)}
          onConfirm={() => void confirmEffectiveUserCorrection()}
        >
          <p>用户：<strong>{effectiveUserCorrectionTarget.userId}</strong>；平台：<strong>{effectiveUserCorrectionTarget.platformCode}</strong>；当前资格：<strong>{effectiveUserCorrectionTarget.qualificationStatus}</strong>。</p>
          <p>本操作仅允许超级管理员在确认刷号、虚假收入或伪造业绩后执行。正常停业、收入下降和观察期结束不能作为理由。</p>
          <label>纠偏原因<select value={effectiveUserCorrectionForm.correctionReason} onChange={(event) => setEffectiveUserCorrectionForm({ ...effectiveUserCorrectionForm, correctionReason: event.target.value as 'FRAUD' | 'FAKE_INCOME' | 'FABRICATED_PERFORMANCE' })}><option value="FRAUD">刷号 / 异常作弊</option><option value="FAKE_INCOME">虚假收入</option><option value="FABRICATED_PERFORMANCE">伪造业绩</option></select></label>
          <label className="top-gap">证据说明<textarea required maxLength={255} value={effectiveUserCorrectionForm.correctionNote} onChange={(event) => setEffectiveUserCorrectionForm({ ...effectiveUserCorrectionForm, correctionNote: event.target.value })} placeholder="填写已核验的证据编号、核验结论和处理依据" /></label>
          <InlineHint text="确认后仅将这条有效用户资格标记为人工排除，并把直接上级的相关等级评估转为人工复核；不会删除 MCN 原始收入，不会自动降级，也不会产生奖励、余额、提现或付款。" />
        </ConfirmDialog>
      ) : null}

      {tokenPointConversionSaveTarget ? (
        <ConfirmDialog
          title="确认保存代币积分换算"
          tone="primary"
          confirmText="确认保存"
          loading={loading}
          onCancel={() => setTokenPointConversionSaveTarget(null)}
          onConfirm={() => void confirmSaveTokenPointConversion()}
        >
          <p>将 {tokenPointConversionSaveTarget.platformCode} 的原始收入单位 <strong>{tokenPointConversionSaveTarget.tokenUnit}</strong> 设置为：每 1 代币兑换 <strong>{tokenPointConversionSaveTarget.pointsPerToken}</strong> 积分。</p>
          <InlineHint text="这是长期配置，不设置起始或结束时间。确认保存只更新换算配置及操作审计；不会追溯记分、升级用户、创建团队或产生奖励、余额、提现和付款。" />
        </ConfirmDialog>
      ) : null}

      {isMentorRuleDialogOpen ? (
        <ConfirmDialog
          title="新增待审导师分成规则"
          tone="primary"
          confirmText="建立待审导师规则"
          loading={loading}
          confirmDisabled={!mentorRuleForm.amountMinor || !mentorRuleForm.effectiveFrom}
          onCancel={() => { setIsMentorRuleDialogOpen(false); setIsMentorRuleGuildPickerOpen(false) }}
          onConfirm={() => void saveMentorIncentiveRule()}
        >
          <form className="grid-form compact-form exception-filter-grid" onSubmit={(event) => { event.preventDefault(); void saveMentorIncentiveRule() }}>
            <label>触发里程碑<select value={mentorRuleForm.milestoneCode} onChange={(event) => setMentorRuleForm({ ...mentorRuleForm, milestoneCode: event.target.value })}><option value="VALID_72H_START">72 小时有效启动</option><option value="FIRST_INCOME">首次收入</option><option value="FIRST_WITHDRAW_ELIGIBLE">首次达到可提现门槛</option><option value="ACTIVE_7D">连续活跃 7 天</option><option value="ACTIVE_30D">连续活跃 30 天</option></select></label>
            <label>平台<select value={mentorRuleForm.platformCode} onChange={(event) => { const platformCode = event.target.value; setIsMentorRuleGuildPickerOpen(false); setMentorRuleForm({ ...mentorRuleForm, platformCode, guildIds: [] }); void loadMentorRuleGuildDirectory(platformCode) }}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
            <label>归属国家<select value={mentorRuleForm.countryCode} onChange={(event) => { setIsMentorRuleGuildPickerOpen(false); setMentorRuleForm({ ...mentorRuleForm, countryCode: event.target.value, guildIds: [] }) }}>{phoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names.zh}（{country.countryCode}）</option>)}</select></label>
            <div className="full-span mentor-guild-picker-field"><span>限定公会（可选，多选）</span><div className="mentor-guild-picker" ref={mentorRuleGuildPickerRef}><button type="button" className="mentor-guild-picker-trigger" disabled={mentorRuleGuildDirectoryLoading || !mentorRuleGuildOptions.length} onClick={() => setIsMentorRuleGuildPickerOpen(!isMentorRuleGuildPickerOpen)} aria-expanded={isMentorRuleGuildPickerOpen}>{mentorRuleGuildDirectoryLoading ? '正在读取权威公会目录…' : mentorRuleForm.guildIds.length ? `已选择 ${mentorRuleForm.guildIds.length} 个公会` : mentorRuleGuildOptions.length ? '点击选择限定公会' : '暂无可选公会'}<span aria-hidden="true">⌄</span></button>{isMentorRuleGuildPickerOpen && mentorRuleGuildOptions.length ? <div className="mentor-guild-picker-menu" role="group" aria-label="限定公会多选"><div className="mentor-guild-picker-actions"><button type="button" onClick={() => setMentorRuleForm({ ...mentorRuleForm, guildIds: mentorRuleGuildOptions.map((guild) => guild.guildId) })}>全选</button><button type="button" onClick={() => setMentorRuleForm({ ...mentorRuleForm, guildIds: [] })}>清空</button></div>{mentorRuleGuildOptions.map((guild) => <label key={guild.guildId} className="mentor-guild-picker-option"><input type="checkbox" checked={mentorRuleForm.guildIds.includes(guild.guildId)} onChange={() => setMentorRuleForm({ ...mentorRuleForm, guildIds: mentorRuleForm.guildIds.includes(guild.guildId) ? mentorRuleForm.guildIds.filter((guildId) => guildId !== guild.guildId) : [...mentorRuleForm.guildIds, guild.guildId] })} /><span>{guild.guildName}（{guild.guildId}）</span></label>)}</div> : null}</div><small>{mentorRuleGuildDirectoryLoading ? '正在读取 MCN 权威公会目录…' : mentorRuleGuildOptions.length ? '点击展开后可勾选多个公会；保存时会按所选公会分别建立待审规则。未选择表示适用于该平台与国家的全部公会。' : '当前平台和国家没有可用的 MCN 权威公会；请先确认公会目录已同步。'}</small></div>
            <label>固定奖励额度<input required inputMode="numeric" value={mentorRuleForm.amountMinor} onChange={(event) => setMentorRuleForm({ ...mentorRuleForm, amountMinor: event.target.value.replace(/\D/g, '') })} placeholder="例如 200" /></label>
            <label>货币单位<input disabled value="DIAMOND" aria-label="导师分成固定货币单位 DIAMOND" /></label>
            <label>冻结天数<input required inputMode="numeric" value={mentorRuleForm.freezeDays} onChange={(event) => setMentorRuleForm({ ...mentorRuleForm, freezeDays: event.target.value.replace(/\D/g, '') })} /></label>
            <label>生效时间<input required type="datetime-local" value={mentorRuleForm.effectiveFrom} onChange={(event) => setMentorRuleForm({ ...mentorRuleForm, effectiveFrom: event.target.value })} /></label>
            <label>失效时间（可选）<input type="datetime-local" value={mentorRuleForm.effectiveTo} onChange={(event) => setMentorRuleForm({ ...mentorRuleForm, effectiveTo: event.target.value })} /></label>
          </form>
          <InlineHint text="导师规则采用固定额度，单位固定为 DIAMOND，不按学员收入比例抽成。保存后是待审草稿；审批启用前不会写入影子账本，更不会产生真实奖励。" />
        </ConfirmDialog>
      ) : null}

      {isOperatingDividendDialogOpen ? (
        <ConfirmDialog
          title="新增待审运营分红规则"
          tone="primary"
          confirmText="建立待审运营分红规则"
          loading={loading}
          confirmDisabled={!operatingDividendForm.effectiveFrom || !operatingDividendForm.requiredValidStarts || !operatingDividendForm.profitShareRate}
          onCancel={() => { setIsOperatingDividendDialogOpen(false); setIsOperatingDividendGuildPickerOpen(false) }}
          onConfirm={() => void saveOperatingDividendPolicy()}
        >
          <form className="grid-form compact-form exception-filter-grid" onSubmit={(event) => { event.preventDefault(); void saveOperatingDividendPolicy() }}>
            <label>平台<select value={operatingDividendForm.platformCode} onChange={(event) => { const platformCode = event.target.value; setIsOperatingDividendGuildPickerOpen(false); setOperatingDividendForm({ ...operatingDividendForm, platformCode, guildIds: [] }); void loadOperatingDividendGuildDirectory(platformCode) }}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
            <label>归属国家<select value={operatingDividendForm.countryCode} onChange={(event) => { setIsOperatingDividendGuildPickerOpen(false); setOperatingDividendForm({ ...operatingDividendForm, countryCode: event.target.value, guildIds: [] }) }}>{phoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names.zh}（{country.countryCode}）</option>)}</select></label>
            <div className="full-span mentor-guild-picker-field"><span>限定公会（可选，多选）</span><div className="mentor-guild-picker" ref={operatingDividendGuildPickerRef}><button type="button" className="mentor-guild-picker-trigger" disabled={operatingDividendGuildDirectoryLoading || !operatingDividendGuildOptions.length} onClick={() => setIsOperatingDividendGuildPickerOpen(!isOperatingDividendGuildPickerOpen)} aria-expanded={isOperatingDividendGuildPickerOpen}>{operatingDividendGuildDirectoryLoading ? '正在读取权威公会目录…' : operatingDividendForm.guildIds.length ? `已选择 ${operatingDividendForm.guildIds.length} 个公会` : operatingDividendGuildOptions.length ? '点击选择限定公会' : '暂无可选公会'}<span aria-hidden="true">⌄</span></button>{isOperatingDividendGuildPickerOpen && operatingDividendGuildOptions.length ? <div className="mentor-guild-picker-menu" role="group" aria-label="运营分红限定公会多选"><div className="mentor-guild-picker-actions"><button type="button" onClick={() => setOperatingDividendForm({ ...operatingDividendForm, guildIds: operatingDividendGuildOptions.map((guild) => guild.guildId) })}>全选</button><button type="button" onClick={() => setOperatingDividendForm({ ...operatingDividendForm, guildIds: [] })}>清空</button></div>{operatingDividendGuildOptions.map((guild) => <label key={guild.guildId} className="mentor-guild-picker-option"><input type="checkbox" checked={operatingDividendForm.guildIds.includes(guild.guildId)} onChange={() => setOperatingDividendForm({ ...operatingDividendForm, guildIds: operatingDividendForm.guildIds.includes(guild.guildId) ? operatingDividendForm.guildIds.filter((guildId) => guildId !== guild.guildId) : [...operatingDividendForm.guildIds, guild.guildId] })} /><span>{guild.guildName}（{guild.guildId}）</span></label>)}</div> : null}</div><small>{operatingDividendGuildDirectoryLoading ? '正在读取 MCN 权威公会目录…' : operatingDividendGuildOptions.length ? '点击展开后可勾选多个公会；保存时会按所选公会分别建立待审规则。未选择表示适用于该平台与国家的全部公会。' : '当前平台和国家没有可用的 MCN 权威公会；请先确认公会目录已同步。'}</small></div>
            <label>有效启动门槛<input required min="1" inputMode="numeric" value={operatingDividendForm.requiredValidStarts} onChange={(event) => setOperatingDividendForm({ ...operatingDividendForm, requiredValidStarts: event.target.value.replace(/\D/g, '') })} /></label>
            <label>达到可提现门槛<input required min="0" inputMode="numeric" value={operatingDividendForm.requiredWithdrawEligible} onChange={(event) => setOperatingDividendForm({ ...operatingDividendForm, requiredWithdrawEligible: event.target.value.replace(/\D/g, '') })} /></label>
            <label>连续活跃 7 天门槛<input required min="0" inputMode="numeric" value={operatingDividendForm.requiredActive7d} onChange={(event) => setOperatingDividendForm({ ...operatingDividendForm, requiredActive7d: event.target.value.replace(/\D/g, '') })} /></label>
            <label>经营利润分红比例<input required min="0" max="0.3" step="0.001" inputMode="decimal" value={operatingDividendForm.profitShareRate} onChange={(event) => setOperatingDividendForm({ ...operatingDividendForm, profitShareRate: event.target.value })} /><small>填小数：0.05 表示 5%，最高 0.30。</small></label>
            <label>生效时间<input required type="datetime-local" value={operatingDividendForm.effectiveFrom} onChange={(event) => setOperatingDividendForm({ ...operatingDividendForm, effectiveFrom: event.target.value })} /></label>
            <label>失效时间（可选）<input type="datetime-local" value={operatingDividendForm.effectiveTo} onChange={(event) => setOperatingDividendForm({ ...operatingDividendForm, effectiveTo: event.target.value })} /></label>
          </form>
          <InlineHint text="运营分红计算基数固定为独立的团队经营利润事实。保存后仅为待审影子规则；不读取或改写收入事实，更不会产生奖励、余额、提现或付款。" />
        </ConfirmDialog>
      ) : null}

      {isIncomeShadowReplayDialogOpen ? (
        <ConfirmDialog
          title="人工重新投影收入影子账本"
          tone="warning"
          confirmText="记录原因并重新投影"
          loading={loading}
          confirmDisabled={!incomeShadowReplayReason.trim()}
          onCancel={() => { setIsIncomeShadowReplayDialogOpen(false); setIncomeShadowReplayReason('') }}
          onConfirm={() => void handleReplayIncomeShadowLedger()}
        >
          <p>仅使用本系统已保留的最新 MCN 原始收入事实，重新构建所选平台与业务日的影子投影。不会请求 MCN，不会修改原始事实，也不会创建奖励、余额或付款。</p>
          <label className="top-gap">重放原因<textarea value={incomeShadowReplayReason} maxLength={255} onChange={(event) => setIncomeShadowReplayReason(event.target.value)} placeholder="例如：已完成平台账号绑定补录，重新核对当日归属" /></label>
        </ConfirmDialog>
      ) : null}

      {incomeExceptionReviewTarget ? (
        <ConfirmDialog
          title="复核收入事实异常"
          tone="warning"
          confirmText="保存复核结论"
          loading={loading}
          confirmDisabled={!incomeExceptionReviewForm.reviewNote.trim()}
          onCancel={() => setIncomeExceptionReviewTarget(null)}
          onConfirm={() => void handleReviewIncomeException()}
        >
          <p>事实：{incomeExceptionReviewTarget.sourceEventReference}</p>
          <p>当前问题：{incomeExceptionReviewTarget.status === 'UNMATCHED' ? '未归属平台账号' : '等待 MCN 结算定稿'}。该结论仅适用于当前修订版本；MCN 有新修订时必须重新复核。</p>
          <label>处理结论<select value={incomeExceptionReviewForm.reviewStatus} onChange={(event) => setIncomeExceptionReviewForm({ ...incomeExceptionReviewForm, reviewStatus: event.target.value as 'ACKNOWLEDGED' | 'IGNORED' })}><option value="ACKNOWLEDGED">已知悉，待后续处理</option><option value="IGNORED">确认不纳入本次处理</option></select></label>
          <label className="top-gap">复核备注<textarea value={incomeExceptionReviewForm.reviewNote} maxLength={255} onChange={(event) => setIncomeExceptionReviewForm({ ...incomeExceptionReviewForm, reviewNote: event.target.value })} placeholder="说明已核对的依据、后续负责人或不纳入原因" /></label>
          <InlineHint text="保存复核结论不会改变 MCN 原始事实、绑定状态、影子候选或任何财务数据。" />
        </ConfirmDialog>
      ) : null}

      {isLinkyInvitationGuildDialogOpen ? (
        <ConfirmDialog
          title={`人工调整 Linky 邀请链归属 · 用户 #${linkyInvitationGuildOverride.userId}`}
          tone="success"
          confirmText="保存人工归属"
          loading={loading}
          confirmDisabled={linkyInvitationGuildOptionsLoading || !selectedLinkyInvitationGuildOption || !linkyInvitationGuildOverride.reason.trim()}
          onCancel={closeLinkyInvitationGuildDialog}
          onConfirm={() => void saveLinkyInvitationGuildOverride()}
        >
          <InfoRow label="目标用户" value={`#${linkyInvitationGuildOverride.userId}`} />
          <label className="dialog-field">
            目标 Linky 公会 ID
            <select
              value={linkyInvitationGuildOverride.guildId}
              disabled={linkyInvitationGuildOptionsLoading}
              onChange={(event) => {
                const selected = linkyGuildOptions.find((item) => item.guildId === event.target.value)
                setLinkyInvitationGuildOverride((current) => ({
                  ...current,
                  guildId: selected?.guildId ?? '',
                  guildName: selected?.guildName ?? '',
                  guildInviteCode: '',
                }))
              }}
            >
              <option value="">{linkyInvitationGuildOptionsLoading ? '正在加载可选公会…' : '请选择目标公会'}</option>
              {linkyGuildOptions.map((item) => <option key={item.guildId} value={item.guildId}>{item.guildName} · {item.guildId}</option>)}
            </select>
          </label>
          {selectedLinkyInvitationGuildOption ? <>
            <InfoRow label="公会名称" value={selectedLinkyInvitationGuildOption.guildName} />
            <InfoRow label="国家 / 平台状态" value={`${selectedLinkyInvitationGuildOption.country || '未标注'} / ${selectedLinkyInvitationGuildOption.guildStatus}`} />
            <InfoRow label="目录状态" value={renderStatusBadge(selectedLinkyInvitationGuildOption.directoryStatus)} />
          </> : !linkyInvitationGuildOptionsLoading ? <InlineHint text="没有可选的正常 Linky 公会。请先在“平台公会目录”确认 MCN 同步已成功，并确认公会处于启用状态。" /> : null}
          <label className="dialog-field">调整原因<input required value={linkyInvitationGuildOverride.reason} onChange={(event) => setLinkyInvitationGuildOverride((current) => ({ ...current, reason: event.target.value }))} placeholder="例如邀请人已更换公会" /></label>
          <InlineHint text="保存后会写入操作人、原因、时间和修改前后内容的审计记录；不会覆盖用户已核验到的实际 Linky 公会事实。" />
        </ConfirmDialog>
      ) : null}

      {pendingAdminAccountAction ? (
        <ConfirmDialog
          title={`确认${adminAccountActionLabel(pendingAdminAccountAction)}?`}
          tone={pendingAdminAccountAction.action === 'save' ? 'primary' : pendingAdminAccountAction.action === 'unlock' || (!pendingAdminAccountAction.account.enabled && pendingAdminAccountAction.action === 'toggle') ? 'success' : 'warning'}
          confirmText={`确认${adminAccountActionLabel(pendingAdminAccountAction)}`}
          onCancel={() => setPendingAdminAccountAction(null)}
          onConfirm={() => {
            const { account, action } = pendingAdminAccountAction
            if (action === 'save') void handleSaveAdminAccount(account)
            else if (action === 'toggle') void handleToggleAdminAccount(account)
            else if (action === 'reset') void handleResetAdminPassword(account.id)
            else void handleUnlockAdminAccount(account.id)
          }}
          loading={loading}
        >
          <InfoRow label="员工账号" value={`${pendingAdminAccountAction.account.username} / ${pendingAdminAccountAction.account.displayName}`} />
          <InfoRow label="角色" value={formatAdminRole(pendingAdminAccountAction.account.role)} />
          <InfoRow label="数据范围" value={`${pendingAdminAccountAction.account.platformScope} / ${pendingAdminAccountAction.account.guildScope} / ${pendingAdminAccountAction.account.regionScope}`} />
          {pendingAdminAccountAction.action === 'reset' ? <InlineHint text="重置后旧会话立即失效，临时密码只显示一次。" /> : null}
          {pendingAdminAccountAction.action === 'toggle' && pendingAdminAccountAction.account.enabled ? <InlineHint text="停用后该员工不能继续登录，现有会话也会失效。" /> : null}
        </ConfirmDialog>
      ) : null}

      {pendingWithdrawAction ? (
        <ConfirmDialog
          title={`确认${withdrawActionLabel(pendingWithdrawAction.action)}?`}
          tone={pendingWithdrawAction.action === 'reject' || pendingWithdrawAction.action === 'failed' || pendingWithdrawAction.action === 'reverse' ? 'warning' : 'primary'}
          confirmText={`确认${withdrawActionLabel(pendingWithdrawAction.action)}`}
          onCancel={() => setPendingWithdrawAction(null)}
          onConfirm={() => void handleAdminWithdrawAction(pendingWithdrawAction.requestNo, pendingWithdrawAction.action)}
          loading={adminWithdrawActionLoadingNo === pendingWithdrawAction.requestNo}
        >
          <InfoRow label="申请单" value={pendingWithdrawAction.requestNo} />
          <InfoRow label="用户" value={`#${pendingWithdrawAction.userId}`} />
          <InfoRow label="申请钻石" value={pendingWithdrawAction.requestedDiamondAmount} />
          <InfoRow label="当前状态" value={renderStatusBadge(pendingWithdrawAction.requestStatus)} />
          {pendingWithdrawAction.action === 'reject' ? <InfoRow label="拒绝原因" value={adminWithdrawAction.remark} /> : null}
          {pendingWithdrawAction.action === 'paid' ? <><InfoRow label="打款渠道" value={adminWithdrawAction.paymentChannel} /><InfoRow label="支付流水号" value={adminWithdrawAction.paymentReference} /></> : null}
          {pendingWithdrawAction.action === 'failed' ? <InfoRow label="失败原因" value={adminWithdrawAction.failureReason} /> : null}
          {pendingWithdrawAction.action === 'reverse' ? <><InfoRow label="冲正原因" value={adminWithdrawAction.reversalReason} /><InfoRow label="账本币种" value={adminWithdrawAction.reversalCurrency} /><InlineHint text="确认后将新增不可变冲正账目；原支付与审批历史不会被删除。" /></> : null}
        </ConfirmDialog>
      ) : null}

      {pendingBatchAction ? (
        <ConfirmDialog
          title={`确认批量${pendingBatchAction.kind === 'withdraw' ? pendingBatchAction.action === 'APPROVE' ? '通过提现' : '拒绝提现' : pendingBatchAction.action === 'HANDLE' ? '处理风险' : '忽略风险'}?`}
          tone={pendingBatchAction.action === 'REJECT' || pendingBatchAction.action === 'IGNORE' ? 'warning' : 'primary'}
          confirmText={`确认处理 ${pendingBatchAction.targetIds.length} 条`}
          onCancel={() => { setPendingBatchAction(null); setBatchActionNote('') }}
          onConfirm={() => void handleBatchAction()}
          loading={batchActionLoading}
        >
          <InfoRow label="选中数量" value={pendingBatchAction.targetIds.length} />
          <InfoRow label="处理范围" value={pendingBatchAction.targetIds.slice(0, 5).join('、') + (pendingBatchAction.targetIds.length > 5 ? ` 等 ${pendingBatchAction.targetIds.length} 条` : '')} />
          <label className="dialog-field">统一备注<input value={batchActionNote} onChange={(event) => setBatchActionNote(event.target.value)} placeholder={pendingBatchAction.action === 'REJECT' || pendingBatchAction.action === 'IGNORE' ? '此操作必须填写原因…' : '可填写本批次处理依据…'} /></label>
          <InlineHint text="系统会逐项执行并返回成功/失败明细；单条失败不会掩盖其他条目的真实结果。" />
        </ConfirmDialog>
      ) : null}

      {pendingRiskAction ? (
        <ConfirmDialog
          title={`确认${riskActionLabel(pendingRiskAction.action)}?`}
          tone={pendingRiskAction.action === 'FREEZE_USER' ? 'warning' : pendingRiskAction.action === 'UNFREEZE_USER' ? 'success' : 'neutral'}
          confirmText={`确认${riskActionLabel(pendingRiskAction.action)}`}
          onCancel={() => setPendingRiskAction(null)}
          onConfirm={() => handleRiskAction(pendingRiskAction)}
          loading={riskActionLoadingId === pendingRiskAction.riskEventId}
        >
          <InfoRow label="风险事件" value={`#${pendingRiskAction.riskEventId}`} />
          <InfoRow label="目标用户" value={`#${pendingRiskAction.userId}`} />
          <InfoRow label="当前状态" value={pendingRiskAction.riskStatus} />
          <InfoRow label="本次备注" value={pendingRiskAction.note || '未填写，将按系统默认备注处理'} />
        </ConfirmDialog>
      ) : null}

      {pendingRelationChange ? (
        <ConfirmDialog
          title="确认提交关系人工修正?"
          tone="primary"
          confirmText="确认提交"
          onCancel={() => setPendingRelationChange(null)}
          onConfirm={handleAdjustRelation}
          loading={relationAdjustLoading}
        >
          <InfoRow label="目标用户" value={`#${pendingRelationChange.userId}`} />
          <InfoRow label="当前一级上级" value={relationBeforeAdjust?.level1InviterId ?? pendingRelationChange.previousInviterId ?? '-'} />
          <InfoRow label="修正后一级上级" value={pendingRelationChange.nextInviterId ?? '-'} />
          <InfoRow label="原二级 / 三级" value={`${relationBeforeAdjust?.level2InviterId ?? pendingRelationChange.previousLevel2InviterId ?? '-'} / ${relationBeforeAdjust?.level3InviterId ?? pendingRelationChange.previousLevel3InviterId ?? '-'}`} />
          <InfoRow label="备注" value={pendingRelationChange.note || '未填写备注'} />
        </ConfirmDialog>
      ) : null}
    </div>
  )
}

function PanelSection({ eyebrow, title, description, action, children, sectionId }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; sectionId?: string }) {
  return (
    <section className="panel-card" id={sectionId}>
      <div className="panel-head">
        <div>
          <p className="panel-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {description ? <p className="panel-desc">{description}</p> : null}
        </div>
        {action ? <div className="panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

function AdminNavIcon({ label }: { label: string }) {
  const props = { size: 18, weight: 'duotone' as const }
  if (label === '分销概览') return <House {...props} />
  if (label === '渠道入口') return <Megaphone {...props} />
  if (label === '绑定关系') return <LinkSimple {...props} />
  if (label === '用户管理') return <IdentificationCard {...props} />
  if (label === '财务管理') return <Wallet {...props} />
  if (label === '系统管理') return <UsersThree {...props} />
  return <GearSix {...props} />
}

function DiagnosticBanner({ eyebrow, title, description, tone }: { eyebrow: string; title: string; description: string; tone: 'success' | 'warning' | 'danger' }) {
  return (
    <div className={`diagnostic-banner tone-${tone}`}>
      <p className="panel-eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function Metric({ label, value, hint, tone }: { label: string; value?: number; hint: string; tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
      <p>{hint}</p>
    </div>
  )
}

function RelationItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="relation-item">
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  )
}

function InfoCard({ title, tone, children }: { title: string; tone: 'success' | 'neutral'; children: React.ReactNode }) {
  return (
    <div className={`info-card ${tone}`}>
      <h3>{title}</h3>
      <div className="stack-gap small">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, code = false }: { label: string; value: React.ReactNode; code?: boolean }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      {code ? <code>{value}</code> : <strong>{value}</strong>}
    </div>
  )
}

function EmptyState({ title, description, actionLabel }: { title: string; description: string; actionLabel?: string }) {
  const stateLabel = title.includes('登录')
    ? '待登录'
    : title.includes('接入')
      ? '待接入'
      : title.includes('设置')
        ? '未设置'
        : '待同步'

  return (
    <div className="empty-card">
      <span className="empty-state-label">{stateLabel}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel ? <span className="empty-action">{actionLabel}</span> : null}
    </div>
  )
}

function RoadmapList({ items }: { items: Array<{ title: string; desc: string }> }) {
  return (
    <div className="roadmap-list">
      {items.map((item) => (
        <div className="roadmap-item" key={item.title}>
          <strong>{item.title}</strong>
          <p>{item.desc}</p>
        </div>
      ))}
    </div>
  )
}
void DiagnosticBanner
void RoadmapList

function ToastStack({ items, tone = 'neutral' }: { items: string[]; tone?: 'neutral' | 'success' | 'warning' }) {
  return (
    <div className={`toast-stack tone-${tone}`} role="status" aria-live="polite">
      {items.map((item) => (
        <div className="toast-note" key={item}>{item}</div>
      ))}
    </div>
  )
}

function InlineHint({ text }: { text: string }) {
  return <ToastStack items={[text]} />
}

function ConfirmDialog({
  title,
  tone,
  confirmText,
  loading,
  confirmDisabled,
  children,
  onCancel,
  onConfirm,
}: {
  title: string
  tone: 'primary' | 'warning' | 'success' | 'neutral'
  confirmText: string
  loading?: boolean
  confirmDisabled?: boolean
  children: React.ReactNode
  onCancel: () => void
  onConfirm: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCancelRef = useRef(onCancel)
  const loadingRef = useRef(loading)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loadingRef.current) onCancelRef.current()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  return (
    <div className="dialog-backdrop" role="presentation">
      <div ref={dialogRef} className={`dialog-card tone-${tone}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <div>
            <p className="panel-eyebrow">确认操作</p>
            <h3>{title}</h3>
          </div>
          <button className="ghost-btn small-btn" onClick={onCancel} disabled={loading}>关闭</button>
        </div>
        <div className="stack-gap small">{children}</div>
        <div className="dialog-actions">
          <button className="ghost-btn" onClick={onCancel} disabled={loading}>取消</button>
          <button className="primary-btn" onClick={onConfirm} disabled={loading || confirmDisabled}>{loading ? '处理中...' : confirmText}</button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const badgeMap: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'primary' | 'neutral' }> = {
    AVAILABLE: { label: '已可用', tone: 'success' },
    PENDING_REVIEW: { label: '待审核', tone: 'primary' },
    PAYMENT_PENDING: { label: '待打款', tone: 'warning' },
    PAYMENT_FAILED: { label: '打款失败', tone: 'danger' },
    PAID_OUT: { label: '已打款', tone: 'success' },
    REVERSED: { label: '已冲正', tone: 'neutral' },
    HANDLED: { label: '已处理', tone: 'success' },
    PROCESSED: { label: '已处理', tone: 'success' },
    SUCCESS: { label: '成功', tone: 'success' },
    NORMAL: { label: '正常', tone: 'success' },
    ACTIVE: { label: '启用', tone: 'success' },
    DISABLED: { label: '停用', tone: 'neutral' },
    MISSING_ON_MCN: { label: 'MCN 已缺失', tone: 'danger' },
    IGNORED: { label: '已忽略', tone: 'neutral' },
    PENDING: { label: '待处理', tone: 'primary' },
    LOCKED: { label: '已锁定', tone: 'warning' },
    RISK_HOLD: { label: '风控冻结', tone: 'warning' },
    FROZEN: { label: '已冻结', tone: 'warning' },
    FAILED: { label: '异常', tone: 'danger' },
    REJECTED: { label: '已拒绝', tone: 'danger' },
    UNLOCKED: { label: '未锁定', tone: 'success' },
  }
  const normalized = badgeMap[status] || { label: status, tone: 'primary' as const }
  return <span className={`badge badge-${normalized.tone}`}>{normalized.label}</span>
}

function renderEligibilityStatusBadge(status: string) {
  const badgeMap: Record<string, { label: string; tone: 'primary' | 'neutral' | 'success' }> = {
    MATCHED_OURS: { label: '我方公会', tone: 'success' },
    JOINED_OTHER_GUILD: { label: '已加入别家公会', tone: 'primary' },
    NOT_JOINED: { label: '未在我方公会命中', tone: 'neutral' },
    ELIGIBLE: { label: '允许注册', tone: 'success' },
    NOT_ELIGIBLE: { label: '不可注册', tone: 'primary' },
  }
  const normalized = badgeMap[status] || { label: status, tone: 'primary' as const }
  return <span className={`badge badge-${normalized.tone}`}>{normalized.label}</span>
}

function formatEligibilitySummary(result: LinkyEligibilityCheckResponse) {
  const guildSummary = result.guildName ? `，公会：${result.guildName}` : ''
  switch (result.guildCheckStatus) {
    case 'MATCHED_OURS':
      return `命中我方公会，可注册${guildSummary}`
    case 'JOINED_OTHER_GUILD':
      return `已加入别家公会，不可注册${guildSummary}`
    case 'NOT_JOINED':
      return `当前公会后台未命中该账号，外部归属仍待确认，先不允许注册`
    default:
      return `${result.guildCheckStatus}${guildSummary}`
  }
}

function renderStatusBadge(status: string) {
  return <StatusBadge status={status} />
}

function riskActionLabel(action: RiskActionName) {
  switch (action) {
    case 'HANDLE':
      return '处理'
    case 'IGNORE':
      return '忽略'
    case 'FREEZE_USER':
      return '冻结用户'
    case 'UNFREEZE_USER':
      return '解冻用户'
  }
}

function withdrawActionLabel(action: WithdrawActionName) {
  if (action === 'approve') return '通过审核'
  if (action === 'reject') return '拒绝申请'
  if (action === 'paid') return '记录已打款'
  if (action === 'reverse') return '发起账本冲正'
  return '记录打款失败'
}

function adminAccountActionLabel(input: PendingAdminAccountAction) {
  if (input.action === 'save') return '保存权限变更'
  if (input.action === 'reset') return '重置员工密码'
  if (input.action === 'unlock') return '解锁员工账号'
  return input.account.enabled ? '停用员工账号' : '恢复员工账号'
}

function buildRelationPreview(relation: RelationDetailResponse, nextInviterIdRaw: string) {
  const nextLevel1InviterId = nextInviterIdRaw.trim() ? Number(nextInviterIdRaw) : null
  const changed = nextLevel1InviterId !== relation.level1InviterId
  return {
    nextLevel1InviterId,
    nextBindSource: changed ? 'MANUAL' : relation.bindSource,
    summary: changed
      ? nextLevel1InviterId === null
        ? '将把当前用户改成根关系，并清空上级链路。'
        : `将把一级上级从 #${relation.level1InviterId ?? '-'} 调整为 #${nextLevel1InviterId}。`
      : '一级上级未变化，可继续补备注后提交。',
  }
}

function canHandleRisk(status: string) {
  return status === 'PENDING'
}

function canIgnoreRisk(status: string) {
  return status === 'PENDING'
}

function canFreezeRisk(status: string) {
  return status === 'PENDING'
}

function canUnfreezeRisk(status: string) {
  return status === 'HANDLED'
}

function DataTable({ headers, rows, emptyText, rowClassNames }: { headers: React.ReactNode[]; rows?: Array<Array<React.ReactNode>>; emptyText: string; rowClassNames?: string[] }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => <th key={index}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`} className={rowClassNames?.[index] || undefined}>
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={headers.length}>{emptyText}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function BatchResultSummary({ result }: { result: BatchOperationResultResponse }) {
  const failures = result.items.filter((item) => !item.success)
  return (
    <div className={`admin-batch-result ${failures.length ? 'has-failures' : ''}`} role="status">
      <strong>批量回执：成功 {result.successCount} 条，失败 {result.failureCount} 条</strong>
      {failures.length ? <details><summary>查看失败明细</summary><ul>{failures.map((item) => <li key={item.targetId}><code>{item.targetId}</code><span>{item.message || '操作失败'}</span></li>)}</ul></details> : <span>全部条目已完成。</span>}
    </div>
  )
}

function FingerprintCell({ fingerprint, onCopy }: { fingerprint: string; onCopy: (fingerprint: string) => void | Promise<void> }) {
  return (
    <div className="fingerprint-cell">
      <code className="truncated-code" title={fingerprint}>{fingerprint}</code>
      <button className="ghost-btn small-btn fingerprint-copy-btn" onClick={() => void onCopy(fingerprint)} type="button">复制</button>
    </div>
  )
}
void FingerprintCell

function DrawerDialog({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="panel-eyebrow">{subtitle}</p>
            <h3>{title}</h3>
          </div>
          <button className="ghost-btn small-btn" type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  )
}

function DetailSection({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="detail-section">
      <h4>{title}</h4>
      <div className="detail-grid">
        {rows.map(([label, value]) => (
          <div className="detail-item" key={`${title}-${label}`}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function RelatedLinkySection({ relatedWebhooks, relatedReplays, fingerprintHint }: { relatedWebhooks: string[]; relatedReplays: string[]; fingerprintHint: string }) {
  return (
    <section className="detail-section">
      <h4>关联请求视图</h4>
      <div className="stack-gap small">
        <div>
          <p className="detail-subtitle">同订单 webhook</p>
          {relatedWebhooks.length ? (
            <ul className="detail-list">
              {relatedWebhooks.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p className="inline-hint">当前列表范围内没有更多同订单 webhook。</p>
          )}
        </div>
        <div>
          <p className="detail-subtitle">关联 replay 记录</p>
          {relatedReplays.length ? (
            <ul className="detail-list">
              {relatedReplays.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p className="inline-hint">当前列表范围内没有更多 replay 记录。</p>
          )}
          <p className="inline-hint">{fingerprintHint}</p>
        </div>
      </div>
    </section>
  )
}

function formatOperatingDividendError(message: string) {
  if (message.includes('already overlaps this scope')) return '当前规则与一条已启用的运营分红规则范围和生效期重叠。请停止旧规则，或调整新规则的生效时间、平台、国家或公会范围后再试。'
  if (message.includes('authoritative platform guild')) return '限定公会必须是当前平台和国家下已同步、可用的 MCN 权威公会。'
  return message
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

function mentorMilestoneLabel(code: string) {
  const labels: Record<string, string> = {
    VALID_72H_START: '72 小时有效启动',
    FIRST_INCOME: '首次收入',
    FIRST_WITHDRAW_ELIGIBLE: '首次达到可提现门槛',
    ACTIVE_7D: '连续活跃 7 天',
    ACTIVE_30D: '连续活跃 30 天',
  }
  return labels[code] || code
}

function formatAdminRole(role: string) {
  const labels: Record<string, string> = {
    super_admin: '最高管理员', admin: '管理员', operator: '操作员', operations: '运营',
    finance: '财务', customer_support: '客服', mentor: '导师', team_leader: '团队负责人', viewer: '只读',
  }
  return labels[role.toLowerCase()] ?? role
}

const linkyGuildMismatchCopy: Record<ConsumerLocale, string> = {
  zh: '当前账号与被邀请人不属于同一个公会，绑定失败',
  en: 'This account and the inviting user are not in the same guild. Binding failed.',
  es: 'Esta cuenta y la persona que invitó no pertenecen al mismo gremio. La vinculación falló.',
  id: 'Akun ini dan pengundang tidak berada di guild yang sama. Pengikatan gagal.',
  pt: 'Esta conta e quem fez o convite não pertencem à mesma guilda. A vinculação falhou.',
}

// eslint-disable-next-line react-refresh/only-export-components
export function isLinkyGuildMismatch(message: string) {
  return /Linky account is not in (?:the )?expected guild|Please join expected Linky guild|Linky account joined another guild/i.test(message)
}

// eslint-disable-next-line react-refresh/only-export-components
export function localizeLinkyBindingError(message: string, locale: ConsumerLocale) {
  return isLinkyGuildMismatch(message) ? linkyGuildMismatchCopy[locale] : message
}

function BindLandingPage() {
  const copyByLocale = {
    zh: {
      languageLabel: '语言',
      productLabel: '产品',
      productHelper: '暂时仅开放 Linky',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: '先绑定邀请码，锁定后续奖励归属',
      heroSubtitle: '填写邀请码、WhatsApp 和 8 位账号，先把关系登记进去。',
      chips: ['居家灵活用工', '金币奖励链路', '手机即可开始'],
      floating: ['🏠 居家', '📱 手机', '🪙 金币'],
      stats: ['先绑定', '再推广', '后归因'],
      formTitle: '现在提交，锁定你的奖励线',
      formSubtitle: '只做一个动作：先把关系登记进去。',
      inviteCode: '邀请码',
      inviteCodePlaceholder: '例如 ABCD1234',
      whatsappNumber: 'WhatsApp 号码',
      whatsappPlaceholder: '例如 +6281234567890',
      linkyAccount: 'App 账户（8位数字）',
      linkyPlaceholder: '例如 12345678',
      submit: '立即开始锁定奖励关系',
      submitting: '提交中...',
      failure: '登记失败',
      success: '登记成功',
      successText: '关系已写入系统，后续归因按当前邀请码记录。',
      factsTitle: '基本原理',
      fact1: '一个 Linky 账号只能归属一个邀请码。',
      fact2: 'WhatsApp 号码唯一，重复登记会被拒绝。',
      fact3: '填错后不能自己改绑，只能后台修正。',
      stepsTitle: '怎么做',
      step1: '拿到邀请码',
      step2: '填 WhatsApp',
      step3: '填 8 位账号并提交',
      foot1: '邀请码固定',
      foot2: '立即生效',
      foot3: '后续按此归因',
      resultTitle: '当前结果',
      resultWritten: '这次绑定已经写入系统',
      inviterUserId: '邀请人用户 ID',
      status: '状态',
      navBind: '绑定页',
      navInvite: '邀请好友',
      navEarnings: '我的收益',
    },
    en: {
      languageLabel: 'Language',
      productLabel: 'Product',
      productHelper: 'Linky only for now',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Use your phone from home. Bind the invite code first and lock your reward line.',
      heroSubtitle: 'Simple rule: register invite code + WhatsApp + 8-digit account first, then future attribution and rewards follow this line.',
      chips: ['Remote flexible work', 'Coin reward flow', 'Phone-first start'],
      floating: ['🏠 Home', '📱 Phone', '🪙 Coins'],
      stats: ['Bind first', 'Promote next', 'Reward later'],
      formTitle: 'Submit now and lock your reward line',
      formSubtitle: 'One action only: register the relationship first.',
      inviteCode: 'Invite code',
      inviteCodePlaceholder: 'e.g. ABCD1234',
      whatsappNumber: 'WhatsApp number',
      whatsappPlaceholder: 'e.g. +6281234567890',
      linkyAccount: 'App account (8 digits)',
      linkyPlaceholder: 'e.g. 12345678',
      submit: 'Lock my reward relationship now',
      submitting: 'Submitting...',
      failure: 'Failed',
      success: 'Success',
      successText: 'The relationship is saved. Future attribution follows this invite code.',
      factsTitle: 'How it works',
      fact1: 'One Linky account can belong to one invite code only.',
      fact2: 'WhatsApp number must be unique.',
      fact3: 'Wrong submissions can only be fixed by support.',
      stepsTitle: 'Steps',
      step1: 'Get the invite code',
      step2: 'Enter WhatsApp',
      step3: 'Enter 8-digit account and submit',
      foot1: 'Fixed invite code',
      foot2: 'Live immediately',
      foot3: 'Future rewards follow this record',
      resultTitle: 'Current result',
      resultWritten: 'This binding has been saved',
      inviterUserId: 'Inviter user ID',
      status: 'Status',
      navBind: 'Binding page',
      navInvite: 'Generate my invite code',
      navEarnings: 'View my team earnings',
    },
    es: {
      languageLabel: 'Idioma',
      productLabel: 'Producto',
      productHelper: 'Solo Linky por ahora',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Trabaja desde casa con tu móvil. Vincula primero el código y bloquea tu línea de recompensa.',
      heroSubtitle: 'Regla simple: primero registra código + WhatsApp + cuenta de 8 dígitos, luego la atribución y las recompensas seguirán esta línea.',
      chips: ['Trabajo remoto flexible', 'Flujo de monedas', 'Empieza con tu móvil'],
      floating: ['🏠 Casa', '📱 Móvil', '🪙 Monedas'],
      stats: ['Vincula primero', 'Promociona después', 'Recompensa luego'],
      formTitle: 'Envía ahora y bloquea tu línea de recompensa',
      formSubtitle: 'Solo una acción: registra primero la relación.',
      inviteCode: 'Código de invitación',
      inviteCodePlaceholder: 'ej. ABCD1234',
      whatsappNumber: 'Número de WhatsApp',
      whatsappPlaceholder: 'ej. +6281234567890',
      linkyAccount: 'Cuenta de la app (8 dígitos)',
      linkyPlaceholder: 'ej. 12345678',
      submit: 'Bloquear mi recompensa ahora',
      submitting: 'Enviando...',
      failure: 'Error',
      success: 'Éxito',
      successText: 'La relación fue guardada. La atribución futura seguirá este código.',
      factsTitle: 'Cómo funciona',
      fact1: 'Una cuenta Linky solo puede pertenecer a un código.',
      fact2: 'El número de WhatsApp debe ser único.',
      fact3: 'Los errores solo pueden corregirse manualmente.',
      stepsTitle: 'Pasos',
      step1: 'Consigue el código',
      step2: 'Ingresa WhatsApp',
      step3: 'Ingresa la cuenta de 8 dígitos y envía',
      foot1: 'Código fijo',
      foot2: 'Activo al instante',
      foot3: 'Recompensas futuras siguen este registro',
      resultTitle: 'Resultado actual',
      resultWritten: 'Este vínculo ya fue guardado',
      inviterUserId: 'ID del invitador',
      status: 'Estado',
      navBind: 'Página de vínculo',
      navInvite: 'Generar mi código',
      navEarnings: 'Ver ganancias de mi equipo',
    },
    id: {
      languageLabel: 'Bahasa',
      productLabel: 'Produk',
      productHelper: 'Untuk sementara hanya Linky',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Kerja fleksibel dari rumah pakai HP. Ikat kode undangan dulu, lalu kunci jalur reward kamu.',
      heroSubtitle: 'Aturannya sederhana: daftarkan kode undangan + WhatsApp + akun 8 digit dulu, lalu atribusi dan reward berikutnya akan mengikuti jalur ini.',
      chips: ['Kerja fleksibel dari rumah', 'Alur reward koin', 'Mulai lewat HP'],
      floating: ['🏠 Rumah', '📱 HP', '🪙 Koin'],
      stats: ['Bind dulu', 'Promosi berikutnya', 'Reward belakangan'],
      formTitle: 'Kirim sekarang dan kunci jalur reward kamu',
      formSubtitle: 'Cuma satu langkah: daftar relasinya dulu.',
      inviteCode: 'Kode undangan',
      inviteCodePlaceholder: 'contoh ABCD1234',
      whatsappNumber: 'Nomor WhatsApp',
      whatsappPlaceholder: 'contoh +6281234567890',
      linkyAccount: 'Akun app (8 digit)',
      linkyPlaceholder: 'contoh 12345678',
      submit: 'Kunci relasi reward saya sekarang',
      submitting: 'Mengirim...',
      failure: 'Gagal',
      success: 'Berhasil',
      successText: 'Relasi sudah disimpan. Atribusi berikutnya mengikuti kode ini.',
      factsTitle: 'Cara kerja',
      fact1: 'Satu akun Linky hanya bisa dimiliki satu kode undangan.',
      fact2: 'Nomor WhatsApp harus unik.',
      fact3: 'Jika salah isi, hanya bisa diperbaiki manual.',
      stepsTitle: 'Langkah',
      step1: 'Ambil kode undangan',
      step2: 'Isi WhatsApp',
      step3: 'Isi akun 8 digit lalu kirim',
      foot1: 'Kode tetap',
      foot2: 'Langsung aktif',
      foot3: 'Reward berikutnya ikut catatan ini',
      resultTitle: 'Hasil saat ini',
      resultWritten: 'Binding ini sudah tersimpan',
      inviterUserId: 'ID pengundang',
      status: 'Status',
      navBind: 'Halaman bind',
      navInvite: 'Buat kode undangan saya',
      navEarnings: 'Lihat penghasilan tim saya',
    },
    pt: {
      languageLabel: 'Idioma',
      productLabel: 'Produto',
      productHelper: 'Apenas Linky por enquanto',
      kicker: 'FLEXIBLE REMOTE REWARD PROGRAM',
      heroTitle: 'Trabalhe de casa com o celular. Vincule o código primeiro e bloqueie sua linha de recompensa.',
      heroSubtitle: 'Regra simples: registre primeiro código + WhatsApp + conta de 8 dígitos, depois a atribuição e as recompensas seguirão esta linha.',
      chips: ['Trabalho remoto flexível', 'Fluxo de moedas', 'Comece pelo celular'],
      floating: ['🏠 Casa', '📱 Celular', '🪙 Moedas'],
      stats: ['Vincule primeiro', 'Promova depois', 'Reward depois'],
      formTitle: 'Envie agora e bloqueie sua linha de recompensa',
      formSubtitle: 'Uma ação só: registre a relação primeiro.',
      inviteCode: 'Código de convite',
      inviteCodePlaceholder: 'ex. ABCD1234',
      whatsappNumber: 'Número do WhatsApp',
      whatsappPlaceholder: 'ex. +6281234567890',
      linkyAccount: 'Conta do app (8 dígitos)',
      linkyPlaceholder: 'ex. 12345678',
      submit: 'Bloquear minha recompensa agora',
      submitting: 'Enviando...',
      failure: 'Falha',
      success: 'Sucesso',
      successText: 'A relação foi salva. A atribuição futura seguirá este código.',
      factsTitle: 'Como funciona',
      fact1: 'Uma conta Linky só pode pertencer a um código.',
      fact2: 'O número de WhatsApp deve ser único.',
      fact3: 'Erros só podem ser corrigidos manualmente.',
      stepsTitle: 'Passos',
      step1: 'Pegue o código',
      step2: 'Digite o WhatsApp',
      step3: 'Digite a conta de 8 dígitos e envie',
      foot1: 'Código fixo',
      foot2: 'Ativo na hora',
      foot3: 'Próximas recompensas seguem este registro',
      resultTitle: 'Resultado atual',
      resultWritten: 'Este vínculo já foi salvo',
      inviterUserId: 'ID do convidador',
      status: 'Status',
      navBind: 'Página de vínculo',
      navInvite: 'Gerar meu código',
      navEarnings: 'Ver ganhos da minha equipe',
    },
  } as const

  const [session] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<keyof typeof copyByLocale>(() => loadExternalLocale())
  const product = 'linky'
  const [linkyAccount, setLinkyAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<InviteBindingResponse | null>(null)

  const copy = copyByLocale[locale]
  const accountCopy = consumerAccountCopy[locale]
  const guildMismatch = error ? isLinkyGuildMismatch(error) : false
  const localizedBindingError = error ? localizeLinkyBindingError(error, locale) : ''
  const canSubmit = Boolean(session && linkyAccount.length === 8)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
    }
  }, [locale])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const response = await registerLinkyAccount(session.userId, session.accessToken, {
        productCode: product,
        linkyAccount,
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failure)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell consumer-form-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <select className="consumer-language" aria-label={copy.languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as keyof typeof copyByLocale)}>
              <option value="zh">中文</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="id">ID</option>
              <option value="pt">PT</option>
            </select>
            {session ? <ConsumerAccountLink locale={locale} /> : null}
          </div>
        </header>

        <section className="consumer-commercial-hero consumer-bind-hero">
          <span className="consumer-visually-hidden">{accountCopy.bindingTitle}</span>
          <div className="consumer-commercial-kicker"><Diamond weight="fill" aria-hidden="true" /> BANDEIRA REWARDS</div>
          <h1>{accountCopy.bindingTitle}</h1>
          <p>{copy.productLabel} · Linky · {accountCopy.bindingSubtitle}</p>
          <div className="consumer-commercial-proof">
            <span><ShieldCheck weight="fill" aria-hidden="true" />归属锁定</span>
            <span><LinkSimple weight="bold" aria-hidden="true" />记录可追踪</span>
          </div>
        </section>

        {error ? (
          <section className="consumer-banner is-error" role="alert">
            <strong>{guildMismatch ? localizedBindingError : copy.failure}</strong>
            {!guildMismatch ? <span>{localizedBindingError}</span> : null}
          </section>
        ) : result ? (
          <section className="consumer-banner is-success" role="status"><strong>{copy.success}</strong><span>{accountCopy.bindingSuccess}</span></section>
        ) : null}

        {session ? (
          <form className="consumer-form-card" onSubmit={handleSubmit}>
            <div className="consumer-form-card-heading"><div><h2>{accountCopy.bindingTitle}</h2><p>{accountCopy.inviteRelationship}</p></div><LinkSimple size={28} weight="duotone" /></div>
            <label className="consumer-field">
              <span>{accountCopy.linkyAccount}</span>
              <input value={linkyAccount} onChange={(event) => setLinkyAccount(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder={accountCopy.linkyPlaceholder} inputMode="numeric" autoFocus />
            </label>
            <input type="hidden" value={product} readOnly />
            <button className="consumer-form-submit" type="submit" disabled={loading || !canSubmit}>
              {loading ? accountCopy.binding : accountCopy.bind}<ArrowRight weight="bold" aria-hidden="true" />
            </button>
            <p className="consumer-form-note"><ShieldCheck weight="fill" aria-hidden="true" />{accountCopy.bindingSubtitle}</p>
          </form>
        ) : (
          <section className="consumer-auth-gate">
            <div className="consumer-auth-icon"><LockSimple weight="duotone" aria-hidden="true" /></div>
            <h2>{accountCopy.signInTitle}</h2><p>{accountCopy.signInHint}</p>
            <a className="consumer-primary-link" href="/invite#phone-login">{accountCopy.signIn}<ArrowRight weight="bold" aria-hidden="true" /></a>
          </section>
        )}

        {result ? (
          <section className="consumer-result-card">
            <div><CheckCircle weight="fill" aria-hidden="true" /><strong>{copy.resultWritten}</strong></div>
            <dl>
              <div><dt>{accountCopy.linkyAccount}</dt><dd>{result.linkyAccount}</dd></div>
              <div><dt>{copy.status}</dt><dd>{accountCopy.active}</dd></div>
            </dl>
            <a href="/account">{accountCopy.accountShortcut}<ArrowRight weight="bold" aria-hidden="true" /></a>
          </section>
        ) : null}

        {session ? <ConsumerBottomNavigation locale={locale} active="account" /> : null}
      </main>
    </div>
  )
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null) return '--'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatBusinessRewardLevel(rewardLevel?: number | null, locale: string = 'zh') {
  if (locale === 'zh') {
    const labels: Record<number, string> = {
      1: '直接邀请奖励',
      2: '历史二级佣金（只读）',
      3: '历史三级佣金（只读）',
    }
    return labels[rewardLevel ?? 0] ?? `历史层级 ${rewardLevel ?? '-'} 佣金（只读）`
  }
  const labels: Record<number, string> = {
    1: 'Direct invite reward',
    2: 'Legacy level 2 commission (read-only)',
    3: 'Legacy level 3 commission (read-only)',
  }
  return labels[rewardLevel ?? 0] ?? `Legacy level ${rewardLevel ?? '-'} commission (read-only)`
}

const externalPageCopyByLocale = {
  zh: {
    navBind: '绑定页',
    navInvite: '邀请好友',
    navEarnings: '我的收益',
    languageLabel: '语言',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: '邀请好友',
    inviteSubtitle: '登录后复制邀请码或分享注册链接。',
    productLabel: '产品',
    whatsappLabel: 'WhatsApp 号码',
    appAccountLabel: 'app 账户（8位数字）',
    generateButton: '立即生成邀请码',
    generating: '生成中...',
    myInviteCode: '我的邀请码',
    copyInviteCode: '一键复制邀请码',
    issueSuccess: '邀请码已生成。',
    issueFailure: '生成邀请码失败',
    copySuccess: '邀请码已复制。',
    copyFailure: '复制邀请码失败，请手动复制。',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: '我的收益',
    earningsSubtitle: '查看可用、冻结和累计奖励。',
    boardTitle: '你的收益会在这里持续更新',
    boardSubtitle: '从邀请码、绑定到奖励到账，这一页会持续帮你看清进度。',
    boardBadgeCode: '邀请码固定不变',
    boardBadgeBind: '绑定后自动累计',
    boardBadgeStatus: '到账状态一目了然',
    noSession: '还没有用户会话，请先去“生成我的邀请码”页面生成邀请码。',
    noSessionTitle: '登录后查看你的邀请码',
    noSessionHint: '使用手机号登录后即可邀请好友和查看收益。',
    noSessionPrimary: '手机号登录',
    noSessionSecondary: '去绑定关系',
    inviteeIncome: '被邀请人的收益',
    inviteeIncomeBadge: '已确认',
    myCommission: '你的提成',
    myCommissionBadge: '累计提成',
    availableReward: '可用奖励',
    availableRewardBadge: '可立即查看',
    frozenReward: '冻结奖励',
    riskHoldReward: '风险冻结',
    inviteeIncomeHint: '来自你的下线成员累计确认收益。',
    myCommissionHint: '按奖励记录汇总出来的你的分销提成。',
    availableRewardHint: '当前已经进入可结算状态的奖励。',
    earningsOverview: '我的收益概览',
    overviewCardTitle: '当前邀请码与收益总览',
    overviewBadge: '邀请码 / 团队 / 奖励',
    progressTitle: '当前邀请进度',
    progressCardTitle: '绑定完成后人数和收益会持续更新',
    progressBadge: '进度追踪',
    progressHint: '邀请码固定不变；完成绑定后，邀请人数、有效人数和收益会逐步更新。',
    settlementTitle: '奖励到账说明',
    settlementCardTitle: '冻结中 → 可结算 → 风险冻结',
    settlementBadge: '到账路径',
    settlementHint: '奖励会先进入冻结，满足结算条件后转为可用；如触发风控，会暂时进入风险冻结。',
    nextStepsTitle: '接下来你可以继续做',
    nextInvite: '继续去生成邀请码',
    nextBind: '继续去绑定关系',
    inviteCode: '邀请码',
    invitedUsers: '邀请人数',
    effectiveUsers: '有效人数',
    totalReward: '累计奖励',
    rewardRecords: '收益记录',
    rewardActivityTitle: '最近奖励动态',
    rewardActivityHint: '每一笔奖励都会显示状态和时间，方便你确认什么时候到账。',
    rewardStatusGuideTitle: '状态说明',
    rewardStatusGuideFrozen: '冻结中：奖励正在等待结算',
    rewardStatusGuideAvailable: '可结算：奖励已经可以使用',
    rewardStatusGuideRiskHold: '风险冻结：奖励暂时进入风控复核',
    loading: '加载中...',
    noRewards: '暂时还没有收益记录。',
    emptyRewardsTitle: '还没有收益记录',
    emptyRewardsHint: '先去生成邀请码并完成绑定，后续有收益会自动显示在这里。',
    emptyRewardsAction: '去生成我的邀请码',
    rewardLine: '被邀请人收益层级',
    commissionTail: '你的提成',
    rewardStatusFrozen: '冻结中',
    rewardStatusAvailable: '可结算',
    rewardStatusRiskHold: '风险冻结',
    rewardStatusDefault: '处理中',
  },
  en: {
    navBind: 'Binding page',
    navInvite: 'Generate my invite code',
    navEarnings: 'View my team earnings',
    languageLabel: 'Language',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Generate my invite code',
    inviteSubtitle: 'Sign in to copy your invite code or share a registration link.',
    productLabel: 'Product',
    whatsappLabel: 'WhatsApp number',
    appAccountLabel: 'App account (8 digits)',
    generateButton: 'Generate invite code',
    generating: 'Generating...',
    myInviteCode: 'My invite code',
    copyInviteCode: 'Copy invite code',
    issueSuccess: 'Invite code generated.',
    issueFailure: 'Failed to generate invite code',
    copySuccess: 'Invite code copied.',
    copyFailure: 'Failed to copy invite code.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'View my team earnings',
    earningsSubtitle: 'See two parts: invitee earnings + your commission.',
    boardTitle: 'Your earnings will keep updating here',
    boardSubtitle: 'From invite code to binding to reward settlement, this page helps you track the whole progress clearly.',
    boardBadgeCode: 'Invite code stays the same',
    boardBadgeBind: 'Accumulates after binding',
    boardBadgeStatus: 'Settlement status at a glance',
    noSession: 'No user session yet. Generate your invite code first.',
    noSessionTitle: 'Generate your invite code first',
    noSessionHint: 'No invites yet, and that is okay. Generate your invite code first, then complete the binding step. Earnings will start to accumulate here automatically.',
    noSessionPrimary: 'Generate my invite code',
    noSessionSecondary: 'Go to binding page',
    inviteeIncome: 'Invitee earnings',
    inviteeIncomeBadge: 'Confirmed',
    myCommission: 'Your commission',
    myCommissionBadge: 'Total commission',
    availableReward: 'Available reward',
    availableRewardBadge: 'Ready to view',
    frozenReward: 'Frozen reward',
    riskHoldReward: 'Risk hold',
    inviteeIncomeHint: 'Confirmed earnings from your downstream members.',
    myCommissionHint: 'Your commission aggregated from reward records.',
    availableRewardHint: 'Rewards already available for settlement.',
    earningsOverview: 'My earnings overview',
    overviewCardTitle: 'Current invite code and reward snapshot',
    overviewBadge: 'Invite code / Team / Rewards',
    progressTitle: 'Current invite progress',
    progressCardTitle: 'After binding, users and rewards will keep updating here',
    progressBadge: 'Progress tracking',
    progressHint: 'Your invite code stays the same. After binding is completed, invited users, effective users, and rewards will update here step by step.',
    settlementTitle: 'How reward settlement works',
    settlementCardTitle: 'Frozen → Available → Risk hold',
    settlementBadge: 'Settlement path',
    settlementHint: 'Rewards usually enter frozen status first, become available after settlement conditions are met, and may move into risk hold if a risk review is triggered.',
    nextStepsTitle: 'What you can do next',
    nextInvite: 'Generate another invite code',
    nextBind: 'Go to binding page',
    inviteCode: 'Invite code',
    invitedUsers: 'Invited users',
    effectiveUsers: 'Effective users',
    totalReward: 'Total reward',
    rewardRecords: 'Reward records',
    rewardActivityTitle: 'Recent reward activity',
    rewardActivityHint: 'Each reward shows its status and time so you can see when it becomes available.',
    rewardStatusGuideTitle: 'Status guide',
    rewardStatusGuideFrozen: 'Frozen: reward is waiting for settlement',
    rewardStatusGuideAvailable: 'Available: reward is ready to use',
    rewardStatusGuideRiskHold: 'Risk hold: reward is under risk review for now',
    loading: 'Loading...',
    noRewards: 'No reward records yet.',
    emptyRewardsTitle: 'No reward records yet',
    emptyRewardsHint: 'Generate an invite code and complete the binding flow first. Once earnings are created, they will show up here automatically.',
    emptyRewardsAction: 'Generate my invite code',
    rewardLine: 'Invitee reward level',
    commissionTail: 'your commission',
    rewardStatusFrozen: 'Frozen',
    rewardStatusAvailable: 'Available',
    rewardStatusRiskHold: 'Risk hold',
    rewardStatusDefault: 'Processing',
  },
  es: {
    navBind: 'Página de vínculo',
    navInvite: 'Generar mi código',
    navEarnings: 'Ver ganancias de mi equipo',
    languageLabel: 'Idioma',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Generar mi código',
    inviteSubtitle: 'Inicia sesión para copiar tu código o compartir un enlace de registro.',
    productLabel: 'Producto',
    whatsappLabel: 'Número de WhatsApp',
    appAccountLabel: 'Cuenta app (8 dígitos)',
    generateButton: 'Generar código',
    generating: 'Generando...',
    myInviteCode: 'Mi código',
    copyInviteCode: 'Copiar código',
    issueSuccess: 'Código generado.',
    issueFailure: 'Error al generar el código',
    copySuccess: 'Código copiado.',
    copyFailure: 'Error al copiar el código.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'Ver ganancias de mi equipo',
    earningsSubtitle: 'Mira dos partes: ganancias del invitado + tu comisión.',
    boardTitle: 'Tus ganancias se actualizarán aquí continuamente',
    boardSubtitle: 'Desde el código de invitación hasta el vínculo y la liquidación, esta página te ayuda a seguir todo el progreso con claridad.',
    boardBadgeCode: 'El código no cambia',
    boardBadgeBind: 'Se acumula después del vínculo',
    boardBadgeStatus: 'Estado visible de un vistazo',
    noSession: 'Todavía no hay sesión. Genera tu código primero.',
    noSessionTitle: 'Primero genera tu código',
    noSessionHint: 'Si todavía no empezaste a invitar, no pasa nada. Genera tu código primero y luego completa el vínculo. Las ganancias se acumularán aquí automáticamente.',
    noSessionPrimary: 'Generar mi código',
    noSessionSecondary: 'Ir a la página de vínculo',
    inviteeIncome: 'Ganancias del invitado',
    inviteeIncomeBadge: 'Confirmadas',
    myCommission: 'Tu comisión',
    myCommissionBadge: 'Comisión acumulada',
    availableReward: 'Recompensa disponible',
    availableRewardBadge: 'Lista para ver',
    frozenReward: 'Recompensa congelada',
    riskHoldReward: 'Retención por riesgo',
    inviteeIncomeHint: 'Ganancias confirmadas de tus miembros referidos.',
    myCommissionHint: 'Tu comisión agregada desde los registros.',
    availableRewardHint: 'Recompensas ya disponibles para liquidación.',
    earningsOverview: 'Resumen de mis ganancias',
    overviewCardTitle: 'Código actual y resumen de ganancias',
    overviewBadge: 'Código / Equipo / Recompensas',
    progressTitle: 'Progreso actual de invitación',
    progressCardTitle: 'Después del vínculo, usuarios y recompensas seguirán actualizándose aquí',
    progressBadge: 'Seguimiento',
    progressHint: 'Tu código no cambia. Después del vínculo, invitados, usuarios efectivos y recompensas se actualizarán aquí paso a paso.',
    settlementTitle: 'Cómo se acredita la recompensa',
    settlementCardTitle: 'Congelada → Disponible → Retención por riesgo',
    settlementBadge: 'Ruta de acreditación',
    settlementHint: 'La recompensa primero pasa por congelación, luego se vuelve disponible al cumplir las condiciones y puede entrar en retención por riesgo si se activa una revisión.',
    nextStepsTitle: 'Qué puedes hacer ahora',
    nextInvite: 'Seguir para generar mi código',
    nextBind: 'Seguir para vincular relación',
    inviteCode: 'Código',
    invitedUsers: 'Invitados',
    effectiveUsers: 'Usuarios efectivos',
    totalReward: 'Recompensa total',
    rewardRecords: 'Registros de recompensa',
    rewardActivityTitle: 'Actividad reciente de recompensas',
    rewardActivityHint: 'Cada recompensa muestra su estado y hora para que puedas confirmar cuándo se acredita.',
    rewardStatusGuideTitle: 'Guía de estados',
    rewardStatusGuideFrozen: 'Congelada: la recompensa está esperando liquidación',
    rewardStatusGuideAvailable: 'Disponible: la recompensa ya se puede usar',
    rewardStatusGuideRiskHold: 'Retención por riesgo: la recompensa está en revisión temporal',
    loading: 'Cargando...',
    noRewards: 'Todavía no hay registros.',
    emptyRewardsTitle: 'Todavía no hay registros',
    emptyRewardsHint: 'Primero genera tu código y completa el vínculo. Cuando aparezcan ganancias, se verán aquí automáticamente.',
    emptyRewardsAction: 'Generar mi código',
    rewardLine: 'Nivel de recompensa del invitado',
    commissionTail: 'tu comisión',
    rewardStatusFrozen: 'Congelada',
    rewardStatusAvailable: 'Disponible',
    rewardStatusRiskHold: 'Retención por riesgo',
    rewardStatusDefault: 'En proceso',
  },
  id: {
    navBind: 'Halaman bind',
    navInvite: 'Buat kode undangan saya',
    navEarnings: 'Lihat penghasilan tim saya',
    languageLabel: 'Bahasa',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Buat kode undangan saya',
    inviteSubtitle: 'Masuk untuk menyalin kode undangan atau membagikan tautan pendaftaran.',
    productLabel: 'Produk',
    whatsappLabel: 'Nomor WhatsApp',
    appAccountLabel: 'Akun app (8 digit)',
    generateButton: 'Buat kode undangan',
    generating: 'Membuat...',
    myInviteCode: 'Kode undangan saya',
    copyInviteCode: 'Salin kode undangan',
    issueSuccess: 'Kode undangan berhasil dibuat.',
    issueFailure: 'Gagal membuat kode undangan',
    copySuccess: 'Kode undangan disalin.',
    copyFailure: 'Gagal menyalin kode undangan.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'Lihat penghasilan tim saya',
    earningsSubtitle: 'Lihat dua bagian: penghasilan bawahan + komisi kamu.',
    boardTitle: 'Penghasilan kamu akan terus diperbarui di sini',
    boardSubtitle: 'Dari kode undangan, bind, sampai reward masuk, halaman ini membantu kamu melihat progresnya dengan jelas.',
    boardBadgeCode: 'Kode undangan tetap sama',
    boardBadgeBind: 'Otomatis akumulasi setelah bind',
    boardBadgeStatus: 'Status reward langsung kelihatan',
    noSession: 'Belum ada sesi pengguna. Buat kode undangan dulu.',
    noSessionTitle: 'Buat kode undangan dulu',
    noSessionHint: 'Kalau belum mulai mengundang juga tidak masalah. Buat kode undangan dulu, lalu selesaikan bind. Penghasilan akan otomatis terkumpul di sini.',
    noSessionPrimary: 'Buat kode undangan saya',
    noSessionSecondary: 'Ke halaman bind',
    inviteeIncome: 'Penghasilan bawahan',
    inviteeIncomeBadge: 'Terkonfirmasi',
    myCommission: 'Komisi kamu',
    myCommissionBadge: 'Komisi terkumpul',
    availableReward: 'Reward tersedia',
    availableRewardBadge: 'Siap dilihat',
    frozenReward: 'Reward dibekukan',
    riskHoldReward: 'Tertahan risiko',
    inviteeIncomeHint: 'Akumulasi penghasilan terkonfirmasi dari tim kamu.',
    myCommissionHint: 'Komisi kamu yang dihitung dari catatan reward.',
    availableRewardHint: 'Reward yang sudah bisa diproses.',
    earningsOverview: 'Ringkasan penghasilan saya',
    overviewCardTitle: 'Kode undangan saat ini dan ringkasan reward',
    overviewBadge: 'Kode / Tim / Reward',
    progressTitle: 'Progres undangan saat ini',
    progressCardTitle: 'Setelah bind selesai, pengguna dan reward akan terus diperbarui di sini',
    progressBadge: 'Lacak progres',
    progressHint: 'Kode undangan kamu tetap sama. Setelah bind selesai, jumlah undangan, pengguna efektif, dan reward akan diperbarui bertahap di sini.',
    settlementTitle: 'Cara reward masuk',
    settlementCardTitle: 'Dibekukan → Tersedia → Tertahan risiko',
    settlementBadge: 'Alur reward',
    settlementHint: 'Reward biasanya masuk ke status beku dulu, lalu menjadi tersedia setelah syarat terpenuhi, dan bisa masuk ke penahanan risiko bila ada review risiko.',
    nextStepsTitle: 'Langkah berikutnya',
    nextInvite: 'Lanjut buat kode undangan',
    nextBind: 'Lanjut ke halaman bind',
    inviteCode: 'Kode undangan',
    invitedUsers: 'Jumlah undangan',
    effectiveUsers: 'Pengguna efektif',
    totalReward: 'Total reward',
    rewardRecords: 'Catatan reward',
    rewardActivityTitle: 'Aktivitas reward terbaru',
    rewardActivityHint: 'Setiap reward menampilkan status dan waktunya supaya kamu tahu kapan reward masuk.',
    rewardStatusGuideTitle: 'Penjelasan status',
    rewardStatusGuideFrozen: 'Dibekukan: reward masih menunggu settlement',
    rewardStatusGuideAvailable: 'Tersedia: reward sudah bisa dipakai',
    rewardStatusGuideRiskHold: 'Tertahan risiko: reward sedang masuk review risiko',
    loading: 'Memuat...',
    noRewards: 'Belum ada catatan reward.',
    emptyRewardsTitle: 'Belum ada catatan reward',
    emptyRewardsHint: 'Buat kode undangan dan selesaikan bind dulu. Setelah ada penghasilan, catatannya akan otomatis muncul di sini.',
    emptyRewardsAction: 'Buat kode undangan saya',
    rewardLine: 'Level reward bawahan',
    commissionTail: 'komisi kamu',
    rewardStatusFrozen: 'Dibekukan',
    rewardStatusAvailable: 'Tersedia',
    rewardStatusRiskHold: 'Tertahan risiko',
    rewardStatusDefault: 'Diproses',
  },
  pt: {
    navBind: 'Página de vínculo',
    navInvite: 'Gerar meu código',
    navEarnings: 'Ver ganhos da minha equipe',
    languageLabel: 'Idioma',
    inviteKicker: 'INVITE CODE ENTRY',
    inviteTitle: 'Gerar meu código',
    inviteSubtitle: 'Entre para copiar seu código ou compartilhar um link de cadastro.',
    productLabel: 'Produto',
    whatsappLabel: 'Número do WhatsApp',
    appAccountLabel: 'Conta do app (8 dígitos)',
    generateButton: 'Gerar código de convite',
    generating: 'Gerando...',
    myInviteCode: 'Meu código',
    copyInviteCode: 'Copiar código',
    issueSuccess: 'Código gerado.',
    issueFailure: 'Falha ao gerar o código',
    copySuccess: 'Código copiado.',
    copyFailure: 'Falha ao copiar o código.',
    earningsKicker: 'EARNINGS ENTRY',
    earningsTitle: 'Ver ganhos da minha equipe',
    earningsSubtitle: 'Veja duas partes: ganhos do convidado + sua comissão.',
    boardTitle: 'Seus ganhos vão continuar sendo atualizados aqui',
    boardSubtitle: 'Do código de convite ao vínculo e à liquidação, esta página ajuda você a acompanhar todo o progresso com clareza.',
    boardBadgeCode: 'O código não muda',
    boardBadgeBind: 'Acumula depois do vínculo',
    boardBadgeStatus: 'Status visível de imediato',
    noSession: 'Ainda não há sessão. Gere seu código primeiro.',
    noSessionTitle: 'Gere seu código primeiro',
    noSessionHint: 'Se você ainda não começou a convidar, tudo bem. Gere seu código primeiro e depois conclua o vínculo. Os ganhos vão começar a aparecer aqui automaticamente.',
    noSessionPrimary: 'Gerar meu código',
    noSessionSecondary: 'Ir para a página de vínculo',
    inviteeIncome: 'Ganhos dos convidados',
    inviteeIncomeBadge: 'Confirmados',
    myCommission: 'Sua comissão',
    myCommissionBadge: 'Comissão acumulada',
    availableReward: 'Recompensa disponível',
    availableRewardBadge: 'Pronta para ver',
    frozenReward: 'Recompensa congelada',
    riskHoldReward: 'Bloqueio de risco',
    inviteeIncomeHint: 'Ganhos confirmados dos membros da sua equipe.',
    myCommissionHint: 'Sua comissão somada a partir dos registros.',
    availableRewardHint: 'Recompensas já disponíveis para liquidação.',
    earningsOverview: 'Resumo dos meus ganhos',
    overviewCardTitle: 'Código atual e visão geral das recompensas',
    overviewBadge: 'Código / Equipe / Recompensas',
    progressTitle: 'Progresso atual dos convites',
    progressCardTitle: 'Depois do vínculo, usuários e recompensas continuarão sendo atualizados aqui',
    progressBadge: 'Acompanhar progresso',
    progressHint: 'Seu código de convite não muda. Depois do vínculo, convidados, usuários efetivos e recompensas serão atualizados aqui aos poucos.',
    settlementTitle: 'Como a recompensa entra',
    settlementCardTitle: 'Congelada → Disponível → Bloqueio de risco',
    settlementBadge: 'Caminho da recompensa',
    settlementHint: 'A recompensa normalmente entra primeiro como congelada, vira disponível após cumprir as condições e pode ir para bloqueio de risco se houver revisão.',
    nextStepsTitle: 'Próximos passos',
    nextInvite: 'Continuar para gerar meu código',
    nextBind: 'Continuar para vincular relação',
    inviteCode: 'Código de convite',
    invitedUsers: 'Convidados',
    effectiveUsers: 'Usuários efetivos',
    totalReward: 'Recompensa total',
    rewardRecords: 'Registros de recompensa',
    rewardActivityTitle: 'Atividade recente de recompensas',
    rewardActivityHint: 'Cada recompensa mostra o status e o horário para você acompanhar quando ela entra.',
    rewardStatusGuideTitle: 'Guia de status',
    rewardStatusGuideFrozen: 'Congelada: a recompensa está aguardando liquidação',
    rewardStatusGuideAvailable: 'Disponível: a recompensa já pode ser usada',
    rewardStatusGuideRiskHold: 'Bloqueio de risco: a recompensa está em revisão temporária',
    loading: 'Carregando...',
    noRewards: 'Ainda não há registros.',
    emptyRewardsTitle: 'Ainda não há registros',
    emptyRewardsHint: 'Gere seu código e conclua o vínculo primeiro. Quando houver ganhos, eles aparecerão aqui automaticamente.',
    emptyRewardsAction: 'Gerar meu código',
    rewardLine: 'Nível de recompensa do convidado',
    commissionTail: 'sua comissão',
    rewardStatusFrozen: 'Congelada',
    rewardStatusAvailable: 'Disponível',
    rewardStatusRiskHold: 'Bloqueio de risco',
    rewardStatusDefault: 'Em processamento',
  },
} as const

const timoBindingCopy: Record<ConsumerLocale, {
  title: string; subtitle: string; summary: string; open: string; account: string; hint: string; placeholder: string
  submit: string; verifying: string; verifyAgain: string; verified: string; submitted: string; pending: string; rejected: string
  signInTitle: string; signInHint: string; signIn: string; failure: string
}> = {
  zh: { title: '绑定 Timo 账号', subtitle: '填写官方 Timo ID，核验归属后进入影子奖励计算。', summary: '使用官方 12 位 Timo ID 完成归属核验。', open: '绑定 Timo 账号', account: 'Timo ID（12 位数字）', hint: '请填写官方定义的 12 位、首位非 0 的数字 Timo ID；不能使用昵称、WhatsApp 或邀请码。', placeholder: '例如 123456789012', submit: '提交并核验 Timo ID', verifying: '核验中…', verifyAgain: '重新核验', verified: 'Timo 账号已完成核验。', submitted: 'Timo ID 已提交，等待核验。', pending: '账号已提交；当前核验尚未完成，请稍后重试。', rejected: '核验未通过', signInTitle: '登录后绑定 Timo 账号', signInHint: '请先使用手机号登录，再绑定官方 Timo ID。', signIn: '去手机号登录', failure: 'Timo 绑定失败' },
  en: { title: 'Bind Timo account', subtitle: 'Enter the official Timo ID and verify account ownership before shadow reward calculation.', summary: 'Use the official 12-digit Timo ID for ownership verification.', open: 'Bind Timo account', account: 'Timo ID (12 digits)', hint: 'Enter the official 12-digit numeric Timo ID that does not start with 0. Do not use a nickname, WhatsApp number, or invite code.', placeholder: 'e.g. 123456789012', submit: 'Submit and verify Timo ID', verifying: 'Verifying…', verifyAgain: 'Verify again', verified: 'Your Timo account has been verified.', submitted: 'Your Timo ID was submitted and is awaiting verification.', pending: 'The ID was submitted; verification has not completed yet. Try again later.', rejected: 'Verification was not approved', signInTitle: 'Sign in to bind Timo', signInHint: 'Sign in with your phone before binding the official Timo ID.', signIn: 'Sign in with phone', failure: 'Timo binding failed' },
  es: { title: 'Vincular cuenta Timo', subtitle: 'Ingresa el ID oficial de Timo y verifica la titularidad antes del cálculo de recompensas en sombra.', summary: 'Usa el ID oficial de Timo de 12 dígitos para verificar la titularidad.', open: 'Vincular cuenta Timo', account: 'ID de Timo (12 dígitos)', hint: 'Ingresa el ID oficial numérico de Timo de 12 dígitos que no empieza en 0. No uses apodo, WhatsApp ni código de invitación.', placeholder: 'ej. 123456789012', submit: 'Enviar y verificar ID de Timo', verifying: 'Verificando…', verifyAgain: 'Verificar de nuevo', verified: 'Tu cuenta Timo fue verificada.', submitted: 'Tu ID de Timo fue enviado y espera verificación.', pending: 'El ID fue enviado; la verificación aún no termina. Inténtalo después.', rejected: 'La verificación no fue aprobada', signInTitle: 'Inicia sesión para vincular Timo', signInHint: 'Inicia sesión con tu teléfono antes de vincular el ID oficial de Timo.', signIn: 'Iniciar sesión', failure: 'Error al vincular Timo' },
  id: { title: 'Hubungkan akun Timo', subtitle: 'Masukkan ID Timo resmi dan verifikasi kepemilikan sebelum perhitungan reward bayangan.', summary: 'Gunakan ID Timo resmi 12 digit untuk verifikasi kepemilikan.', open: 'Hubungkan akun Timo', account: 'ID Timo (12 digit)', hint: 'Masukkan ID Timo resmi 12 digit yang tidak diawali 0. Jangan gunakan nama panggilan, WhatsApp, atau kode undangan.', placeholder: 'contoh 123456789012', submit: 'Kirim dan verifikasi ID Timo', verifying: 'Memverifikasi…', verifyAgain: 'Verifikasi lagi', verified: 'Akun Timo kamu sudah diverifikasi.', submitted: 'ID Timo kamu sudah dikirim dan menunggu verifikasi.', pending: 'ID sudah dikirim; verifikasi belum selesai. Coba lagi nanti.', rejected: 'Verifikasi tidak disetujui', signInTitle: 'Masuk untuk menghubungkan Timo', signInHint: 'Masuk dengan ponsel sebelum menghubungkan ID Timo resmi.', signIn: 'Masuk dengan ponsel', failure: 'Gagal menghubungkan Timo' },
  pt: { title: 'Vincular conta Timo', subtitle: 'Informe o ID oficial do Timo e valide a titularidade antes do cálculo de recompensas em modo sombra.', summary: 'Use o ID oficial do Timo com 12 dígitos para validar a titularidade.', open: 'Vincular conta Timo', account: 'ID Timo (12 dígitos)', hint: 'Informe o ID numérico oficial do Timo com 12 dígitos e sem começar por 0. Não use apelido, WhatsApp ou código de convite.', placeholder: 'ex. 123456789012', submit: 'Enviar e validar ID Timo', verifying: 'Validando…', verifyAgain: 'Validar novamente', verified: 'Sua conta Timo foi validada.', submitted: 'Seu ID Timo foi enviado e aguarda validação.', pending: 'O ID foi enviado; a validação ainda não terminou. Tente mais tarde.', rejected: 'A validação não foi aprovada', signInTitle: 'Entre para vincular o Timo', signInHint: 'Entre com o telefone antes de vincular o ID oficial do Timo.', signIn: 'Entrar com telefone', failure: 'Falha ao vincular Timo' },
}

const platformBindingProofCopy: Record<ConsumerLocale, { ownership: string; traceable: string }> = {
  zh: { ownership: '归属核验', traceable: '记录可追踪' },
  en: { ownership: 'Ownership verification', traceable: 'Traceable record' },
  es: { ownership: 'Verificación de titularidad', traceable: 'Registro rastreable' },
  id: { ownership: 'Verifikasi kepemilikan', traceable: 'Catatan dapat dilacak' },
  pt: { ownership: 'Verificação de titularidade', traceable: 'Registro rastreável' },
}

const invitePageCopyByLocale = {
  zh: {
    shareTitle: 'BANDEIRA 邀请',
    shareText: (inviteCode: string) => `使用邀请码 ${inviteCode} 注册并加入 BANDEIRA 奖励计划`,
    shareCopied: '邀请链接已复制。',
    shareFailure: '分享失败，请稍后重试。',
    phoneCodeHint: (verificationCode: string | undefined, ttlMinutes: number) => verificationCode
      ? `测试验证码 ${verificationCode}，${ttlMinutes} 分钟内有效。`
      : `验证码已发送，${ttlMinutes} 分钟内有效。`,
    phoneCodeSent: '验证码已发送。',
    phoneCodeFailure: '获取验证码失败',
    loginFailure: '手机号登录失败',
    errorTitle: '操作失败',
    inviteBenefit: '专属邀请权益',
    myInviteCode: '我的邀请码',
    inviteProgressHint: '好友完成绑定后，邀请进度会自动更新。',
    shareInviteLink: '分享邀请链接',
    loginTitle: '手机号登录',
    loginHint: '使用验证码登录；首次使用时需填写邀请码。',
    phoneLabel: '手机号 / WhatsApp',
    countryCallingCodeLabel: '国家 / 区号',
    phonePlaceholder: '输入本地号码',
    phoneInputHint: '选择国家后，只需输入本地号码。',
    verificationCodeLabel: '验证码',
    verificationCodePlaceholder: '6 位验证码',
    requestVerificationCode: '获取验证码',
    resendCountdown: (seconds: number) => `${seconds} 秒后重新获取`,
    inviteCodeRequiredLabel: '邀请码（首次注册必填）',
    inviteCodePlaceholder: '新用户请输入有效邀请码',
    signInWithPhone: '手机号登录',
    currentAccount: '当前账户',
    userAccount: (userId: number, countryCode: string) => `用户 ${userId} · ${countryCode}`,
    goToBinding: '去绑定',
    navigationLabel: '主要导航',
  },
  en: {
    shareTitle: 'BANDEIRA invitation',
    shareText: (inviteCode: string) => `Use invite code ${inviteCode} to register for the BANDEIRA rewards program`,
    shareCopied: 'Invite link copied.',
    shareFailure: 'Sharing failed. Please try again.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Verification code sent. It is valid for ${ttlMinutes} minutes.`,
    phoneCodeSent: 'Verification code sent.',
    phoneCodeFailure: 'Could not send verification code',
    loginFailure: 'Phone sign-in failed',
    errorTitle: 'Something went wrong',
    inviteBenefit: 'Your invitation benefits',
    myInviteCode: 'My invite code',
    inviteProgressHint: 'Your invitation progress updates automatically after a friend completes binding.',
    shareInviteLink: 'Share invite link',
    loginTitle: 'Sign in with phone',
    loginHint: 'Use a verification code to sign in. An invite code is required on first use.',
    phoneLabel: 'Phone / WhatsApp',
    countryCallingCodeLabel: 'Country / calling code',
    phonePlaceholder: 'Enter local number',
    phoneInputHint: 'Choose a country, then enter your local number only.',
    verificationCodeLabel: 'Verification code',
    verificationCodePlaceholder: '6-digit code',
    requestVerificationCode: 'Get code',
    resendCountdown: (seconds: number) => `Try again in ${seconds}s`,
    inviteCodeRequiredLabel: 'Invite code (required for first registration)',
    inviteCodePlaceholder: 'Enter a valid invite code',
    signInWithPhone: 'Sign in with phone',
    currentAccount: 'Current account',
    userAccount: (userId: number, countryCode: string) => `User ${userId} · ${countryCode}`,
    goToBinding: 'Go to binding',
    navigationLabel: 'Main navigation',
  },
  es: {
    shareTitle: 'Invitación BANDEIRA',
    shareText: (inviteCode: string) => `Usa el código ${inviteCode} para registrarte en el programa de recompensas BANDEIRA`,
    shareCopied: 'Enlace de invitación copiado.',
    shareFailure: 'No se pudo compartir. Inténtalo de nuevo.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Código enviado. Válido durante ${ttlMinutes} minutos.`,
    phoneCodeSent: 'Código enviado.',
    phoneCodeFailure: 'No se pudo enviar el código',
    loginFailure: 'Error al iniciar sesión con teléfono',
    errorTitle: 'Ocurrió un error',
    inviteBenefit: 'Tus beneficios de invitación',
    myInviteCode: 'Mi código de invitación',
    inviteProgressHint: 'Tu progreso se actualizará al completar un amigo el vínculo.',
    shareInviteLink: 'Compartir enlace',
    loginTitle: 'Inicia sesión con teléfono',
    loginHint: 'Usa un código de verificación. En el primer acceso se requiere un código de invitación.',
    phoneLabel: 'Teléfono / WhatsApp',
    countryCallingCodeLabel: 'País / prefijo',
    phonePlaceholder: 'Ingresa el número local',
    phoneInputHint: 'Elige un país e ingresa solo tu número local.',
    verificationCodeLabel: 'Código de verificación',
    verificationCodePlaceholder: 'Código de 6 dígitos',
    requestVerificationCode: 'Obtener código',
    resendCountdown: (seconds: number) => `Reintentar en ${seconds}s`,
    inviteCodeRequiredLabel: 'Código de invitación (obligatorio al registrarte)',
    inviteCodePlaceholder: 'Ingresa un código válido',
    signInWithPhone: 'Iniciar sesión',
    currentAccount: 'Cuenta actual',
    userAccount: (userId: number, countryCode: string) => `Usuario ${userId} · ${countryCode}`,
    goToBinding: 'Ir al vínculo',
    navigationLabel: 'Navegación principal',
  },
  id: {
    shareTitle: 'Undangan BANDEIRA',
    shareText: (inviteCode: string) => `Gunakan kode undangan ${inviteCode} untuk mendaftar ke program reward BANDEIRA`,
    shareCopied: 'Tautan undangan disalin.',
    shareFailure: 'Gagal membagikan. Coba lagi nanti.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Kode verifikasi terkirim dan berlaku ${ttlMinutes} menit.`,
    phoneCodeSent: 'Kode verifikasi terkirim.',
    phoneCodeFailure: 'Gagal mengirim kode verifikasi',
    loginFailure: 'Gagal masuk dengan nomor telepon',
    errorTitle: 'Terjadi kesalahan',
    inviteBenefit: 'Keuntungan undanganmu',
    myInviteCode: 'Kode undangan saya',
    inviteProgressHint: 'Progres undangan akan diperbarui setelah teman menyelesaikan bind.',
    shareInviteLink: 'Bagikan tautan undangan',
    loginTitle: 'Masuk dengan telepon',
    loginHint: 'Masuk dengan kode verifikasi. Kode undangan diperlukan saat pertama kali menggunakan aplikasi.',
    phoneLabel: 'Telepon / WhatsApp',
    countryCallingCodeLabel: 'Negara / kode panggilan',
    phonePlaceholder: 'Masukkan nomor lokal',
    phoneInputHint: 'Pilih negara, lalu masukkan nomor lokal saja.',
    verificationCodeLabel: 'Kode verifikasi',
    verificationCodePlaceholder: 'Kode 6 digit',
    requestVerificationCode: 'Dapatkan kode',
    resendCountdown: (seconds: number) => `Coba lagi dalam ${seconds} dtk`,
    inviteCodeRequiredLabel: 'Kode undangan (wajib saat pendaftaran pertama)',
    inviteCodePlaceholder: 'Masukkan kode undangan yang valid',
    signInWithPhone: 'Masuk dengan telepon',
    currentAccount: 'Akun saat ini',
    userAccount: (userId: number, countryCode: string) => `Pengguna ${userId} · ${countryCode}`,
    goToBinding: 'Ke halaman bind',
    navigationLabel: 'Navigasi utama',
  },
  pt: {
    shareTitle: 'Convite BANDEIRA',
    shareText: (inviteCode: string) => `Use o código ${inviteCode} para se cadastrar no programa de recompensas BANDEIRA`,
    shareCopied: 'Link de convite copiado.',
    shareFailure: 'Não foi possível compartilhar. Tente novamente.',
    phoneCodeHint: (_verificationCode: string | undefined, ttlMinutes: number) => `Código enviado. Ele é válido por ${ttlMinutes} minutos.`,
    phoneCodeSent: 'Código enviado.',
    phoneCodeFailure: 'Não foi possível enviar o código',
    loginFailure: 'Falha no login por telefone',
    errorTitle: 'Algo deu errado',
    inviteBenefit: 'Seus benefícios de convite',
    myInviteCode: 'Meu código de convite',
    inviteProgressHint: 'O progresso será atualizado quando um amigo concluir o vínculo.',
    shareInviteLink: 'Compartilhar link',
    loginTitle: 'Entrar com telefone',
    loginHint: 'Use um código de verificação. Um código de convite é necessário no primeiro acesso.',
    phoneLabel: 'Telefone / WhatsApp',
    countryCallingCodeLabel: 'País / código de discagem',
    phonePlaceholder: 'Digite o número local',
    phoneInputHint: 'Escolha o país e informe somente seu número local.',
    verificationCodeLabel: 'Código de verificação',
    verificationCodePlaceholder: 'Código de 6 dígitos',
    requestVerificationCode: 'Receber código',
    resendCountdown: (seconds: number) => `Tentar novamente em ${seconds}s`,
    inviteCodeRequiredLabel: 'Código de convite (obrigatório no primeiro cadastro)',
    inviteCodePlaceholder: 'Digite um código válido',
    signInWithPhone: 'Entrar com telefone',
    currentAccount: 'Conta atual',
    userAccount: (userId: number, countryCode: string) => `Usuário ${userId} · ${countryCode}`,
    goToBinding: 'Ir para vínculo',
    navigationLabel: 'Navegação principal',
  },
} as const

const phoneCountries = [
  { countryCode: 'BR', callingCode: '+55', names: { zh: '巴西', en: 'Brazil', es: 'Brasil', id: 'Brasil', pt: 'Brasil' } },
  { countryCode: 'ID', callingCode: '+62', names: { zh: '印度尼西亚', en: 'Indonesia', es: 'Indonesia', id: 'Indonesia', pt: 'Indonésia' } },
  { countryCode: 'CN', callingCode: '+86', names: { zh: '中国', en: 'China', es: 'China', id: 'Tiongkok', pt: 'China' } },
  { countryCode: 'US', callingCode: '+1', names: { zh: '美国', en: 'United States', es: 'Estados Unidos', id: 'Amerika Serikat', pt: 'Estados Unidos' } },
  { countryCode: 'CA', callingCode: '+1', names: { zh: '加拿大', en: 'Canada', es: 'Canadá', id: 'Kanada', pt: 'Canadá' } },
  { countryCode: 'MX', callingCode: '+52', names: { zh: '墨西哥', en: 'Mexico', es: 'México', id: 'Meksiko', pt: 'México' } },
  { countryCode: 'CO', callingCode: '+57', names: { zh: '哥伦比亚', en: 'Colombia', es: 'Colombia', id: 'Kolombia', pt: 'Colômbia' } },
  { countryCode: 'AR', callingCode: '+54', names: { zh: '阿根廷', en: 'Argentina', es: 'Argentina', id: 'Argentina', pt: 'Argentina' } },
  { countryCode: 'CL', callingCode: '+56', names: { zh: '智利', en: 'Chile', es: 'Chile', id: 'Cile', pt: 'Chile' } },
  { countryCode: 'PE', callingCode: '+51', names: { zh: '秘鲁', en: 'Peru', es: 'Perú', id: 'Peru', pt: 'Peru' } },
  { countryCode: 'PH', callingCode: '+63', names: { zh: '菲律宾', en: 'Philippines', es: 'Filipinas', id: 'Filipina', pt: 'Filipinas' } },
  { countryCode: 'TH', callingCode: '+66', names: { zh: '泰国', en: 'Thailand', es: 'Tailandia', id: 'Thailand', pt: 'Tailândia' } },
  { countryCode: 'VN', callingCode: '+84', names: { zh: '越南', en: 'Vietnam', es: 'Vietnam', id: 'Vietnam', pt: 'Vietnã' } },
  { countryCode: 'MY', callingCode: '+60', names: { zh: '马来西亚', en: 'Malaysia', es: 'Malasia', id: 'Malaysia', pt: 'Malásia' } },
] as const

const mentorQualificationLanguages: Record<string, { code: string; label: string }> = {
  BR: { code: 'pt-br', label: '葡萄牙语' },
  ID: { code: 'id', label: '印尼语' },
  CN: { code: 'zh', label: '中文' },
  US: { code: 'en', label: '英语' },
  CA: { code: 'en', label: '英语' },
  MX: { code: 'es', label: '西班牙语' },
  CO: { code: 'es', label: '西班牙语' },
  AR: { code: 'es', label: '西班牙语' },
  CL: { code: 'es', label: '西班牙语' },
  PE: { code: 'es', label: '西班牙语' },
  PH: { code: 'en', label: '英语' },
  TH: { code: 'th', label: '泰语' },
  VN: { code: 'vi', label: '越南语' },
  MY: { code: 'ms', label: '马来语' },
}

function mentorQualificationLanguage(countryCode: string) {
  return mentorQualificationLanguages[countryCode] ?? { code: 'en', label: '英语' }
}

function directoryCountryCode(country: string | null | undefined) {
  const normalized = country?.trim().toUpperCase() ?? ''
  return ({ BRAZIL: 'BR', INDONESIA: 'ID', MEXICO: 'MX' } as Record<string, string>)[normalized] ?? normalized
}

function normalizeLocalPhoneNumber(value: string, callingCode: string) {
  const normalized = value.replace(/\D/g, '')
  const dialDigits = callingCode.slice(1)
  return normalized.startsWith(dialDigits) ? normalized.slice(dialDigits.length) : normalized
}

type ConsumerLocale = 'zh' | 'en' | 'es' | 'id' | 'pt'
type ConsumerNavigationKey = 'earnings' | 'invite' | 'account'

const consumerUserGradeLabel: Record<ConsumerLocale, string> = {
  zh: '用户等级', en: 'Member level', es: 'Nivel de miembro', id: 'Level pengguna', pt: 'Nível do usuário',
}

const consumerUserGradeNames: Record<ConsumerLocale, Record<string, string>> = {
  zh: { NORMAL_MEMBER: '普通成员', NEW_STAR: '新星', SILVER: '银牌', GOLD: '金牌', PLATINUM: '铂金', DIAMOND: '钻石', BLACK_GOLD: '黑金' },
  en: { NORMAL_MEMBER: 'Member', NEW_STAR: 'Rising Star', SILVER: 'Silver', GOLD: 'Gold', PLATINUM: 'Platinum', DIAMOND: 'Diamond', BLACK_GOLD: 'Black Gold' },
  es: { NORMAL_MEMBER: 'Miembro', NEW_STAR: 'Nueva estrella', SILVER: 'Plata', GOLD: 'Oro', PLATINUM: 'Platino', DIAMOND: 'Diamante', BLACK_GOLD: 'Oro negro' },
  id: { NORMAL_MEMBER: 'Anggota', NEW_STAR: 'Bintang baru', SILVER: 'Perak', GOLD: 'Emas', PLATINUM: 'Platinum', DIAMOND: 'Berlian', BLACK_GOLD: 'Emas hitam' },
  pt: { NORMAL_MEMBER: 'Membro', NEW_STAR: 'Nova estrela', SILVER: 'Prata', GOLD: 'Ouro', PLATINUM: 'Platina', DIAMOND: 'Diamante', BLACK_GOLD: 'Ouro negro' },
}

function formatConsumerUserGrade(gradeCode: string | null | undefined, locale: ConsumerLocale) {
  return consumerUserGradeNames[locale][gradeCode ?? 'NORMAL_MEMBER'] ?? consumerUserGradeNames[locale].NORMAL_MEMBER
}

const consumerNavigationCopy: Record<ConsumerLocale, Record<ConsumerNavigationKey, string>> = {
  zh: { earnings: '收益', invite: '邀请', account: '我的' },
  en: { earnings: 'Earnings', invite: 'Invite', account: 'Account' },
  es: { earnings: 'Ganancias', invite: 'Invitar', account: 'Cuenta' },
  id: { earnings: 'Penghasilan', invite: 'Undang', account: 'Akun' },
  pt: { earnings: 'Ganhos', invite: 'Convidar', account: 'Conta' },
}

const consumerAccountCopy = {
  zh: {
    title: '我的账户', subtitle: '管理你的身份资料与平台账号。', accountInfo: '账户信息', accountId: '用户编号', country: '归属国家 / 地区', language: '默认语言', platform: '绑定平台账号', linkyTitle: '绑定 Linky 账号', linkyHint: '绑定后，平台数据才能归入当前账户并进入奖励计算。', bindLinky: '绑定 Linky 账号', bindingTitle: '绑定 Linky 账号', bindingSubtitle: '你的注册手机号和邀请关系已自动带入，无需重复填写。', linkyAccount: 'Linky 账号（8 位数字）', linkyPlaceholder: '例如 12345678', bind: '提交 Linky 账号', binding: '提交中…', bindingSuccess: 'Linky 账号已绑定到当前账户。', bindingFailure: '绑定失败', signInTitle: '登录后管理平台账号', signInHint: '请先使用手机号登录，再绑定 Linky 账号。', signIn: '去手机号登录', active: '已提交', bound: '已绑定', navigationLabel: '主要导航', accountShortcut: '我的账户', inviteRelationship: '邀请关系已在首次注册时确认。', security: '账户安全', signOutHint: '退出当前设备的登录状态。', signOut: '退出登录', signingOut: '退出中…',
  },
  en: {
    title: 'My account', subtitle: 'Manage your identity details and platform account.', accountInfo: 'Account information', accountId: 'User ID', country: 'Country / region', language: 'Default language', platform: 'Bind platform accounts', linkyTitle: 'Bind Linky account', linkyHint: 'Bind it so platform activity belongs to this account and can be used for reward calculation.', bindLinky: 'Bind Linky account', bindingTitle: 'Bind Linky account', bindingSubtitle: 'Your registered phone and invitation relationship are already linked. You do not need to enter them again.', linkyAccount: 'Linky account (8 digits)', linkyPlaceholder: 'e.g. 12345678', bind: 'Submit Linky account', binding: 'Submitting…', bindingSuccess: 'Your Linky account is now bound to this account.', bindingFailure: 'Binding failed', signInTitle: 'Sign in to manage your platform account', signInHint: 'Use phone sign-in before binding a Linky account.', signIn: 'Sign in with phone', active: 'Submitted', bound: 'Bound', navigationLabel: 'Main navigation', accountShortcut: 'My account', inviteRelationship: 'Your invitation relationship was confirmed at first registration.', security: 'Account security', signOutHint: 'Sign out from this device.', signOut: 'Sign out', signingOut: 'Signing out…',
  },
  es: {
    title: 'Mi cuenta', subtitle: 'Administra tu identidad y tu cuenta de plataforma.', accountInfo: 'Información de cuenta', accountId: 'ID de usuario', country: 'País / región', language: 'Idioma predeterminado', platform: 'Vincular cuentas de plataforma', linkyTitle: 'Vincular cuenta Linky', linkyHint: 'Vincúlala para que la actividad de la plataforma pertenezca a esta cuenta y entre al cálculo de recompensas.', bindLinky: 'Vincular cuenta Linky', bindingTitle: 'Vincular cuenta Linky', bindingSubtitle: 'Tu teléfono registrado y relación de invitación ya están vinculados. No necesitas ingresarlos otra vez.', linkyAccount: 'Cuenta Linky (8 dígitos)', linkyPlaceholder: 'ej. 12345678', bind: 'Enviar cuenta Linky', binding: 'Enviando…', bindingSuccess: 'Tu cuenta Linky quedó vinculada a esta cuenta.', bindingFailure: 'Error al vincular', signInTitle: 'Inicia sesión para administrar tu cuenta', signInHint: 'Inicia sesión con teléfono antes de vincular una cuenta Linky.', signIn: 'Iniciar sesión', active: 'Enviada', bound: 'Vinculada', navigationLabel: 'Navegación principal', accountShortcut: 'Mi cuenta', inviteRelationship: 'Tu relación de invitación se confirmó al registrarte por primera vez.', security: 'Seguridad de la cuenta', signOutHint: 'Cierra sesión en este dispositivo.', signOut: 'Cerrar sesión', signingOut: 'Cerrando sesión…',
  },
  id: {
    title: 'Akun saya', subtitle: 'Kelola identitas dan akun platform kamu.', accountInfo: 'Informasi akun', accountId: 'ID pengguna', country: 'Negara / wilayah', language: 'Bahasa default', platform: 'Hubungkan akun platform', linkyTitle: 'Hubungkan akun Linky', linkyHint: 'Hubungkan agar aktivitas platform masuk ke akun ini dan dapat dihitung sebagai reward.', bindLinky: 'Hubungkan akun Linky', bindingTitle: 'Hubungkan akun Linky', bindingSubtitle: 'Nomor ponsel terdaftar dan relasi undanganmu sudah tertaut. Kamu tidak perlu mengisinya lagi.', linkyAccount: 'Akun Linky (8 digit)', linkyPlaceholder: 'contoh 12345678', bind: 'Kirim akun Linky', binding: 'Mengirim…', bindingSuccess: 'Akun Linky sudah terhubung ke akun ini.', bindingFailure: 'Gagal menghubungkan', signInTitle: 'Masuk untuk mengelola akun platform', signInHint: 'Masuk dengan nomor telepon sebelum menghubungkan akun Linky.', signIn: 'Masuk dengan telepon', active: 'Terkirim', bound: 'Terhubung', navigationLabel: 'Navigasi utama', accountShortcut: 'Akun saya', inviteRelationship: 'Relasi undanganmu sudah dikonfirmasi saat pendaftaran pertama.', security: 'Keamanan akun', signOutHint: 'Keluar dari perangkat ini.', signOut: 'Keluar', signingOut: 'Keluar…',
  },
  pt: {
    title: 'Minha conta', subtitle: 'Gerencie seus dados de identidade e sua conta da plataforma.', accountInfo: 'Informações da conta', accountId: 'ID do usuário', country: 'País / região', language: 'Idioma padrão', platform: 'Vincular contas da plataforma', linkyTitle: 'Vincular conta Linky', linkyHint: 'Vincule-a para que a atividade da plataforma pertença a esta conta e entre no cálculo das recompensas.', bindLinky: 'Vincular conta Linky', bindingTitle: 'Vincular conta Linky', bindingSubtitle: 'Seu telefone cadastrado e sua relação de convite já estão vinculados. Você não precisa informá-los novamente.', linkyAccount: 'Conta Linky (8 dígitos)', linkyPlaceholder: 'ex. 12345678', bind: 'Enviar conta Linky', binding: 'Enviando…', bindingSuccess: 'Sua conta Linky foi vinculada a esta conta.', bindingFailure: 'Falha no vínculo', signInTitle: 'Entre para gerenciar sua conta da plataforma', signInHint: 'Entre com telefone antes de vincular uma conta Linky.', signIn: 'Entrar com telefone', active: 'Enviada', bound: 'Vinculada', navigationLabel: 'Navegação principal', accountShortcut: 'Minha conta', inviteRelationship: 'Sua relação de convite foi confirmada no primeiro cadastro.', security: 'Segurança da conta', signOutHint: 'Sair deste dispositivo.', signOut: 'Sair', signingOut: 'Saindo…',
  },
} as const

function ConsumerAccountLink({ locale }: { locale: ConsumerLocale }) {
  return <a className="consumer-account-link" href="/account"><UserCircle weight="regular" aria-hidden="true" /><span>{consumerAccountCopy[locale].accountShortcut}</span><CaretRight weight="bold" aria-hidden="true" /></a>
}

function ConsumerBottomNavigation({ locale, active }: { locale: ConsumerLocale; active: ConsumerNavigationKey }) {
  const labels = consumerNavigationCopy[locale]
  return (
    <nav className="consumer-bottom-nav" aria-label={consumerAccountCopy[locale].navigationLabel}>
      <a className={active === 'earnings' ? 'is-active' : undefined} href="/earnings" aria-current={active === 'earnings' ? 'page' : undefined}><Wallet weight={active === 'earnings' ? 'fill' : 'regular'} aria-hidden="true" /><span>{labels.earnings}</span></a>
      <a className={active === 'invite' ? 'is-active' : undefined} href="/invite" aria-current={active === 'invite' ? 'page' : undefined}><UserPlus weight={active === 'invite' ? 'fill' : 'regular'} aria-hidden="true" /><span>{labels.invite}</span></a>
      <a className={active === 'account' ? 'is-active' : undefined} href="/account" aria-current={active === 'account' ? 'page' : undefined}><User weight={active === 'account' ? 'fill' : 'regular'} aria-hidden="true" /><span>{labels.account}</span></a>
    </nav>
  )
}

function formatPhoneNumber(callingCode: string, localNumber: string) {
  const digits = localNumber.replace(/\D/g, '')
  return digits ? `${callingCode}${digits}` : ''
}

const inviteErrorCopyByLocale = {
  zh: {
    invalidPhone: '请输入有效的手机号码。',
    codeAlreadySent: '验证码已发送，请在 60 秒后重新获取。',
    codeRequestLimited: '请求过于频繁，请稍后再试。',
    codeNotFound: '未找到验证码，请先获取验证码。',
    codeExpired: '验证码已过期，请重新获取。',
    codeAttemptsExceeded: '验证码尝试次数已达上限，请重新获取。',
    codeInvalid: '验证码不正确，请重新输入。',
    inviteCodeRequired: '首次注册需要有效的邀请码。',
    inviteCodeNotFound: '邀请码无效，请检查后重试。',
    phoneCountryMismatch: '所选国家与手机号码区号不一致。',
    sendFailed: '暂时无法发送验证码，请稍后再试。',
    signInFailed: '暂时无法登录，请稍后再试。',
  },
  en: {
    invalidPhone: 'Enter a valid phone number.',
    codeAlreadySent: 'A verification code was already sent. Try again in 60 seconds.',
    codeRequestLimited: 'Too many requests. Please try again later.',
    codeNotFound: 'No verification code was found. Request a new code first.',
    codeExpired: 'This verification code has expired. Request a new one.',
    codeAttemptsExceeded: 'Too many verification attempts. Request a new code.',
    codeInvalid: 'The verification code is incorrect. Try again.',
    inviteCodeRequired: 'A valid invite code is required for first registration.',
    inviteCodeNotFound: 'This invite code is invalid. Check it and try again.',
    phoneCountryMismatch: 'The selected country does not match the phone calling code.',
    sendFailed: 'We could not send a verification code. Please try again later.',
    signInFailed: 'We could not sign you in. Please try again later.',
  },
  es: {
    invalidPhone: 'Ingresa un número de teléfono válido.',
    codeAlreadySent: 'Ya se envió un código. Inténtalo de nuevo en 60 segundos.',
    codeRequestLimited: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    codeNotFound: 'No encontramos un código. Solicita uno nuevo primero.',
    codeExpired: 'El código venció. Solicita uno nuevo.',
    codeAttemptsExceeded: 'Se alcanzó el límite de intentos. Solicita un código nuevo.',
    codeInvalid: 'El código no es correcto. Inténtalo de nuevo.',
    inviteCodeRequired: 'Se requiere un código válido para el primer registro.',
    inviteCodeNotFound: 'El código de invitación no es válido. Revísalo e inténtalo de nuevo.',
    phoneCountryMismatch: 'El país seleccionado no coincide con el prefijo telefónico.',
    sendFailed: 'No pudimos enviar el código. Inténtalo de nuevo más tarde.',
    signInFailed: 'No pudimos iniciar sesión. Inténtalo de nuevo más tarde.',
  },
  id: {
    invalidPhone: 'Masukkan nomor telepon yang valid.',
    codeAlreadySent: 'Kode verifikasi sudah dikirim. Coba lagi dalam 60 detik.',
    codeRequestLimited: 'Terlalu banyak permintaan. Coba lagi nanti.',
    codeNotFound: 'Kode verifikasi tidak ditemukan. Minta kode baru terlebih dahulu.',
    codeExpired: 'Kode verifikasi sudah kedaluwarsa. Minta kode baru.',
    codeAttemptsExceeded: 'Batas percobaan verifikasi sudah tercapai. Minta kode baru.',
    codeInvalid: 'Kode verifikasi tidak benar. Coba lagi.',
    inviteCodeRequired: 'Kode undangan yang valid diperlukan untuk pendaftaran pertama.',
    inviteCodeNotFound: 'Kode undangan tidak valid. Periksa lalu coba lagi.',
    phoneCountryMismatch: 'Negara yang dipilih tidak sesuai dengan kode panggilan nomor telepon.',
    sendFailed: 'Kode verifikasi belum dapat dikirim. Coba lagi nanti.',
    signInFailed: 'Belum dapat masuk. Coba lagi nanti.',
  },
  pt: {
    invalidPhone: 'Digite um número de telefone válido.',
    codeAlreadySent: 'Um código já foi enviado. Tente novamente em 60 segundos.',
    codeRequestLimited: 'Muitas solicitações. Tente novamente mais tarde.',
    codeNotFound: 'Não encontramos um código. Solicite um novo primeiro.',
    codeExpired: 'O código expirou. Solicite um novo.',
    codeAttemptsExceeded: 'O limite de tentativas foi atingido. Solicite um novo código.',
    codeInvalid: 'O código não está correto. Tente novamente.',
    inviteCodeRequired: 'Um código de convite válido é necessário no primeiro cadastro.',
    inviteCodeNotFound: 'O código de convite não é válido. Confira e tente novamente.',
    phoneCountryMismatch: 'O país selecionado não corresponde ao código de discagem do telefone.',
    sendFailed: 'Não foi possível enviar o código. Tente novamente mais tarde.',
    signInFailed: 'Não foi possível fazer login. Tente novamente mais tarde.',
  },
} as const

// eslint-disable-next-line react-refresh/only-export-components
export function localizeInviteOperationError(error: unknown, locale: keyof typeof inviteErrorCopyByLocale, operation: 'send' | 'signIn') {
  const rawMessage = error instanceof Error ? error.message.toLowerCase() : ''
  const copy = inviteErrorCopyByLocale[locale]
  if (rawMessage.includes('phone number is invalid')) return copy.invalidPhone
  if (rawMessage.includes('phone verification code already sent')) return copy.codeAlreadySent
  if (rawMessage.includes('too many request')) return copy.codeRequestLimited
  if (rawMessage.includes('verification code not found')) return copy.codeNotFound
  if (rawMessage.includes('verification code expired')) return copy.codeExpired
  if (rawMessage.includes('verification attempts exceeded')) return copy.codeAttemptsExceeded
  if (rawMessage.includes('verification code invalid')) return copy.codeInvalid
  if (rawMessage.includes('valid invite code is required')) return copy.inviteCodeRequired
  if (rawMessage.includes('invite code not found')) return copy.inviteCodeNotFound
  if (rawMessage.includes('registration requires a +')) return copy.phoneCountryMismatch
  return operation === 'send' ? copy.sendFailed : copy.signInFailed
}

function InviteCodePage() {
  const [session, setSession] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<keyof typeof externalPageCopyByLocale>(() => loadExternalLocale())
  const incomingInviteCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('inviteCode')?.trim().toUpperCase() ?? '' : ''
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: '',
    verificationCode: '',
    inviteCode: incomingInviteCode || session?.inviteCode || '',
    countryCode: session?.countryCode ?? 'BR',
    languageCode: session?.languageCode ?? 'pt-br',
  })
  const [phoneCodeHint, setPhoneCodeHint] = useState('')
  const [phoneCodeCooldownSeconds, setPhoneCodeCooldownSeconds] = useState(0)
  const [phoneAuthLoading, setPhoneAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const copy = externalPageCopyByLocale[locale]
  const inviteCopy = invitePageCopyByLocale[locale]
  const selectedPhoneCountry = phoneCountries.find((country) => country.countryCode === phoneForm.countryCode) ?? phoneCountries[0]
  const phoneNumberForSubmission = formatPhoneNumber(selectedPhoneCountry.callingCode, phoneForm.phoneNumber)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
    }
  }, [locale])

  useEffect(() => {
    if (phoneCodeCooldownSeconds <= 0) return undefined
    const timer = window.setTimeout(() => setPhoneCodeCooldownSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [phoneCodeCooldownSeconds])

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => setSuccess(''), 4000)
    return () => window.clearTimeout(timer)
  }, [success])

  async function handleCopyInviteCode() {
    const inviteCode = session?.inviteCode
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setSuccess(copy.copySuccess)
      setError('')
    } catch {
      setError(copy.copyFailure)
    }
  }

  async function handleShareInviteCode() {
    if (!session?.inviteCode) return
    const shareUrl = `${window.location.origin}/invite?inviteCode=${encodeURIComponent(session.inviteCode)}`
    try {
      if (navigator.share) {
        await navigator.share({ title: inviteCopy.shareTitle, text: inviteCopy.shareText(session.inviteCode), url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setSuccess(inviteCopy.shareCopied)
      }
      setError('')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(inviteCopy.shareFailure)
    }
  }

  async function handleIssuePhoneCode() {
    setPhoneAuthLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await issuePhoneCode(phoneNumberForSubmission)
      setPhoneCodeHint(inviteCopy.phoneCodeHint(response.verificationCode, response.ttlMinutes))
      setPhoneCodeCooldownSeconds(response.resendCooldownSeconds ?? 60)
      setSuccess(inviteCopy.phoneCodeSent)
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('phone verification code already sent')) {
        setPhoneCodeCooldownSeconds(60)
      }
      setError(localizeInviteOperationError(err, locale, 'send'))
    } finally {
      setPhoneAuthLoading(false)
    }
  }

  async function handlePhoneLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPhoneAuthLoading(true)
    setError('')
    setSuccess('')
    try {
      const profile = await phoneLogin({
        phoneNumber: phoneNumberForSubmission,
        verificationCode: phoneForm.verificationCode,
        inviteCode: phoneForm.inviteCode || undefined,
        countryCode: phoneForm.countryCode || undefined,
        languageCode: phoneForm.languageCode || undefined,
      })
      const nextSession = saveUserSession(profile)
      setSession(nextSession)
      setPhoneForm({ ...phoneForm, inviteCode: profile.inviteCode, countryCode: profile.countryCode, languageCode: profile.languageCode })
    } catch (err) {
      setError(localizeInviteOperationError(err, locale, 'signIn'))
    } finally {
      setPhoneAuthLoading(false)
    }
  }

  return (
    <div className="consumer-app-page">
      <main className={`consumer-shell consumer-form-shell${session ? '' : ' consumer-login-shell'}`}>
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <label className="consumer-language-select">
              <select aria-label={copy.languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as keyof typeof externalPageCopyByLocale)}>
                <option value="zh">中文</option><option value="en">English</option><option value="es">Español</option><option value="id">Bahasa Indonesia</option><option value="pt">Português</option>
              </select>
            </label>
            {session ? <ConsumerAccountLink locale={locale} /> : null}
          </div>
        </header>

        {session ? <section className="consumer-commercial-heading">
          <p><Diamond weight="fill" aria-hidden="true" /> BANDEIRA REWARDS</p>
          <h1>{copy.inviteTitle}</h1>
          <span>{copy.inviteSubtitle}</span>
        </section> : null}

        {error ? <div className="consumer-banner is-error"><strong>{inviteCopy.errorTitle}</strong><span>{error}</span></div> : null}
        {success ? <div className="consumer-banner is-success"><CheckCircle size={20} weight="fill" /><span>{success}</span></div> : null}

        {session ? (
          <section className="consumer-invite-card">
            <div className="consumer-invite-card-top"><span>{inviteCopy.inviteBenefit}</span><Diamond weight="fill" aria-hidden="true" /></div>
            <p>{inviteCopy.myInviteCode}</p>
            <strong>{session.inviteCode}</strong>
            <span className="consumer-invite-caption">{inviteCopy.inviteProgressHint}</span>
            <div className="consumer-invite-actions">
              <button type="button" onClick={handleCopyInviteCode}><Copy size={21} />{copy.copyInviteCode}</button>
              <button type="button" onClick={handleShareInviteCode}><ShareNetwork size={21} />{inviteCopy.shareInviteLink}</button>
            </div>
          </section>
        ) : (
          <form id="phone-login" className="consumer-form-card" onSubmit={handlePhoneLogin}>
            <div className="consumer-form-card-heading"><div><h2>{inviteCopy.loginTitle}</h2><p>{inviteCopy.loginHint}</p></div><ShieldCheck size={28} weight="duotone" /></div>
            <label className="consumer-field">
              <span>{inviteCopy.phoneLabel}</span>
              <div className="consumer-phone-input">
                <select
                  aria-label={inviteCopy.countryCallingCodeLabel}
                  value={selectedPhoneCountry.countryCode}
                  onChange={(event) => setPhoneForm({ ...phoneForm, countryCode: event.target.value })}
                >
                  {phoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names[locale]} {country.callingCode}</option>)}
                </select>
                <input
                  value={phoneForm.phoneNumber}
                  onChange={(event) => setPhoneForm({ ...phoneForm, phoneNumber: normalizeLocalPhoneNumber(event.target.value, selectedPhoneCountry.callingCode) })}
                  placeholder={inviteCopy.phonePlaceholder}
                  inputMode="tel"
                  autoComplete="tel-national"
                />
              </div>
              <small className="consumer-phone-input-hint">{inviteCopy.phoneInputHint}</small>
            </label>
            <label className="consumer-field"><span>{inviteCopy.verificationCodeLabel}</span><div className="consumer-code-row"><input value={phoneForm.verificationCode} onChange={(e) => setPhoneForm({ ...phoneForm, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder={inviteCopy.verificationCodePlaceholder} inputMode="numeric" autoComplete="one-time-code" /><button type="button" onClick={handleIssuePhoneCode} disabled={phoneAuthLoading || !phoneNumberForSubmission || phoneCodeCooldownSeconds > 0}>{phoneCodeCooldownSeconds > 0 ? inviteCopy.resendCountdown(phoneCodeCooldownSeconds) : inviteCopy.requestVerificationCode}</button></div></label>
            <label className="consumer-field"><span>{inviteCopy.inviteCodeRequiredLabel}</span><input value={phoneForm.inviteCode} onChange={(e) => setPhoneForm({ ...phoneForm, inviteCode: e.target.value.trim().toUpperCase() })} placeholder={inviteCopy.inviteCodePlaceholder} /></label>
            {phoneCodeHint ? <p className="consumer-form-note">{phoneCodeHint}</p> : null}
            <button className="consumer-form-submit" type="submit" disabled={phoneAuthLoading || !phoneNumberForSubmission || phoneForm.verificationCode.length < 6}><SignIn size={21} />{inviteCopy.signInWithPhone}</button>
          </form>
        )}

        {session ? <ConsumerBottomNavigation locale={locale} active="invite" /> : null}
      </main>
    </div>
  )
}

function AccountPage() {
  const [session, setSession] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<ConsumerLocale>(() => loadExternalLocale())
  const [signingOut, setSigningOut] = useState(false)
  const [linkyBinding, setLinkyBinding] = useState<LinkyAccountBindingResponse | null>(null)
  const [timoBinding, setTimoBinding] = useState<PlatformBindingResponse | null>(null)
  const [userGradeCode, setUserGradeCode] = useState('NORMAL_MEMBER')
  const copy = consumerAccountCopy[locale]
  const timoCopy = timoBindingCopy[locale]

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
  }, [locale])

  useEffect(() => {
    if (!session) return
    let active = true
    void getVerifiedLinkyAccountBinding(session.userId, session.accessToken)
      .then((value) => { if (active) setLinkyBinding(value) })
      .catch(() => { if (active) setLinkyBinding(null) })
    void getPlatformBinding(session.userId, session.accessToken, 'TIMO')
      .then((value) => { if (active) setTimoBinding(value) })
      .catch(() => { if (active) setTimoBinding(null) })
    void getDistributionHome(session.userId, session.accessToken)
      .then((value) => { if (active) setUserGradeCode(value.userGradeCode) })
      .catch(() => { if (active) setUserGradeCode('NORMAL_MEMBER') })
    return () => { active = false }
  }, [session])

  async function handleSignOut() {
    if (!session || signingOut) return
    setSigningOut(true)
    try {
      await logoutUserSession(session.accessToken)
    } catch {
      // Local session removal still protects this device if a network interruption prevents server revocation.
    } finally {
      window.localStorage.removeItem(STORAGE_KEY)
      setSession(null)
      window.location.assign('/invite#phone-login')
    }
  }

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell consumer-form-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <label className="consumer-language-select"><select aria-label={externalPageCopyByLocale[locale].languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as ConsumerLocale)}><option value="zh">中文</option><option value="en">English</option><option value="es">Español</option><option value="id">Bahasa Indonesia</option><option value="pt">Português</option></select></label>
          </div>
        </header>

        {session ? (
          <>
            <section className="consumer-commercial-heading"><p><Diamond weight="fill" aria-hidden="true" /> BANDEIRA REWARDS</p><h1>{copy.title}</h1><span>{copy.subtitle}</span></section>
            <section className="consumer-account-overview">
              <div className="consumer-account-overview-icon"><IdentificationCard weight="duotone" aria-hidden="true" /></div>
              <div className="consumer-account-details"><span>{copy.accountInfo}</span><strong>{copy.accountId} · {session.userId}</strong></div>
              <div className="consumer-user-grade-card"><span>{consumerUserGradeLabel[locale]}</span><strong>{formatConsumerUserGrade(userGradeCode, locale)}</strong></div>
            </section>
            <section className="consumer-settings-card">
              <h2>{copy.accountInfo}</h2>
              <dl><div><dt>{copy.country}</dt><dd>{session.countryCode}</dd></div><div><dt>{copy.language}</dt><dd>{session.languageCode}</dd></div></dl>
            </section>
            <section className="consumer-settings-card consumer-platform-card">
              <div className="consumer-platform-card-head"><span className="consumer-platform-icon"><LinkSimple weight="bold" aria-hidden="true" /></span><div><h2>{copy.platform}</h2></div></div>
              <div className="consumer-platform-account-list">
                <div className="consumer-platform-account-row"><div><strong>{copy.linkyTitle}</strong></div>{linkyBinding?.status === 'VERIFIED' ? <div className="consumer-platform-account-bound" aria-label={`${copy.bound}: ${linkyBinding.linkyAccount}`}><CheckCircle weight="fill" aria-hidden="true" /><span>{copy.bound}</span><strong>{linkyBinding.linkyAccount}</strong></div> : <a className="consumer-secondary-link" href="/account/linky">{copy.bindLinky}<ArrowRight weight="bold" aria-hidden="true" /></a>}</div>
                <div className="consumer-platform-account-row"><div><strong>{timoCopy.open}</strong></div>{timoBinding?.status === 'VERIFIED' ? <div className="consumer-platform-account-bound" aria-label={`${copy.bound}: ${timoBinding.platformUserId}`}><CheckCircle weight="fill" aria-hidden="true" /><span>{copy.bound}</span><strong>{timoBinding.platformUserId}</strong></div> : <a className="consumer-secondary-link" href="/account/timo">{timoCopy.open}<ArrowRight weight="bold" aria-hidden="true" /></a>}</div>
              </div>
            </section>
            <section className="consumer-settings-card consumer-security-card">
              <div className="consumer-security-copy"><span className="consumer-security-icon"><ShieldCheck weight="duotone" aria-hidden="true" /></span><div><h2>{copy.security}</h2><p>{copy.signOutHint}</p></div></div>
              <button className="consumer-sign-out-button" type="button" onClick={() => void handleSignOut()} disabled={signingOut}><SignOut weight="bold" aria-hidden="true" />{signingOut ? copy.signingOut : copy.signOut}</button>
            </section>
          </>
        ) : (
          <section className="consumer-auth-gate"><div className="consumer-auth-icon"><LockSimple weight="duotone" aria-hidden="true" /></div><h1>{copy.signInTitle}</h1><p>{copy.signInHint}</p><a className="consumer-primary-link" href="/invite#phone-login">{copy.signIn}<ArrowRight weight="bold" aria-hidden="true" /></a></section>
        )}
        {session ? <ConsumerBottomNavigation locale={locale} active="account" /> : null}
      </main>
    </div>
  )
}

function TimoBindingPage() {
  const [session] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<ConsumerLocale>(() => loadExternalLocale())
  const [timoId, setTimoId] = useState('')
  const [binding, setBinding] = useState<PlatformBindingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const copy = timoBindingCopy[locale]
  const proofCopy = platformBindingProofCopy[locale]

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
  }, [locale])

  useEffect(() => {
    if (!session) return
    let active = true
    void getPlatformBinding(session.userId, session.accessToken, 'TIMO')
      .then((value) => { if (active) { setBinding(value); setTimoId(value.platformUserId) } })
      .catch((err) => {
        const message = err instanceof Error ? err.message.toLowerCase() : ''
        if (active && !message.includes('platform binding not found')) setError(err instanceof Error ? err.message : copy.failure)
      })
    return () => { active = false }
  }, [session, copy.failure])

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => setSuccess(''), 5000)
    return () => window.clearTimeout(timer)
  }, [success])

  async function verifyCurrentBinding(current: PlatformBindingResponse) {
    if (!session) return
    try {
      const verified = await verifyPlatformBinding(session.userId, session.accessToken, 'TIMO')
      setBinding(verified)
      if (verified.status === 'VERIFIED') setSuccess(copy.verified)
      else if (verified.status === 'REJECTED') setError(`${copy.rejected}${verified.rejectionReason ? `：${verified.rejectionReason}` : ''}`)
      else setSuccess(copy.pending)
    } catch (err) {
      setBinding(current)
      const message = err instanceof Error ? err.message.toLowerCase() : ''
      if (message.includes('no enabled local mock verification record')) setSuccess(copy.pending)
      else if (message.includes('mcn verification client is not configured')) setSuccess(copy.pending)
      else setError(err instanceof Error ? err.message : copy.failure)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !/^[1-9][0-9]{11}$/.test(timoId)) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const submitted = await submitPlatformBinding(session.userId, session.accessToken, { platformCode: 'TIMO', platformUserId: timoId })
      setBinding(submitted)
      setSuccess(copy.submitted)
      await verifyCurrentBinding(submitted)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failure)
    } finally {
      setLoading(false)
    }
  }

  async function handleRetryVerification() {
    if (!binding || !session) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await verifyCurrentBinding(binding)
    } finally {
      setLoading(false)
    }
  }

  const isVerified = binding?.status === 'VERIFIED'
  const isRejected = binding?.status === 'REJECTED'

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell consumer-form-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            <select className="consumer-language" aria-label={externalPageCopyByLocale[locale].languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as ConsumerLocale)}><option value="zh">中文</option><option value="en">EN</option><option value="es">ES</option><option value="id">ID</option><option value="pt">PT</option></select>
            {session ? <ConsumerAccountLink locale={locale} /> : null}
          </div>
        </header>

        {session ? <>
          <section className="consumer-commercial-hero consumer-bind-hero">
            <span className="consumer-visually-hidden">{copy.title}</span>
            <div className="consumer-commercial-kicker"><Diamond weight="fill" aria-hidden="true" /> BANDEIRA REWARDS</div>
            <h1>{copy.title}</h1>
            <p>Timo · {copy.subtitle}</p>
            <div className="consumer-commercial-proof">
              <span><ShieldCheck weight="fill" aria-hidden="true" />{proofCopy.ownership}</span>
              <span><LinkSimple weight="bold" aria-hidden="true" />{proofCopy.traceable}</span>
            </div>
          </section>
          {error ? <div className="consumer-banner is-error" role="alert">{error}</div> : null}
          {!error && success ? <div className="consumer-banner is-success" role="status"><CheckCircle size={20} weight="fill" />{success}</div> : null}
          <section className="consumer-form-card">
            <div className="consumer-form-card-heading"><div><h2>{copy.account}</h2><p>{copy.hint}</p></div><IdentificationCard size={28} weight="duotone" /></div>
            {isVerified ? <div className="consumer-form-note"><CheckCircle size={20} weight="fill" />{copy.verified}<br />Timo ID · {binding?.platformUserId}</div> : !binding ? (
              <form onSubmit={handleSubmit}>
                <label className="consumer-field"><span>{copy.account}</span><input required value={timoId} onChange={(event) => setTimoId(event.target.value.replace(/\D/g, '').slice(0, 12))} placeholder={copy.placeholder} inputMode="numeric" autoComplete="off" pattern="[1-9][0-9]{11}" maxLength={12} /><small>{copy.hint}</small></label>
                <button className="consumer-form-submit" type="submit" disabled={loading || !/^[1-9][0-9]{11}$/.test(timoId)}>{loading ? copy.verifying : copy.submit}</button>
              </form>
            ) : null}
            {binding && !isVerified ? <div className="consumer-form-note"><strong>{isRejected ? copy.rejected : copy.submitted}</strong><span>Timo ID · {binding.platformUserId}</span>{binding.rejectionReason ? <span>{binding.rejectionReason}</span> : null}<button className="consumer-secondary-link" type="button" onClick={() => void handleRetryVerification()} disabled={loading}>{loading ? copy.verifying : copy.verifyAgain}</button></div> : null}
          </section>
        </> : <section className="consumer-auth-gate"><div className="consumer-auth-icon"><LockSimple weight="duotone" aria-hidden="true" /></div><h1>{copy.signInTitle}</h1><p>{copy.signInHint}</p><a className="consumer-primary-link" href="/invite#phone-login">{copy.signIn}<ArrowRight weight="bold" aria-hidden="true" /></a></section>}
        {session ? <ConsumerBottomNavigation locale={locale} active="account" /> : null}
      </main>
    </div>
  )
}

function EarningsPage() {
  const [session, setSession] = useState<SessionState | null>(() => loadJsonState<SessionState>(STORAGE_KEY))
  const [locale, setLocale] = useState<keyof typeof externalPageCopyByLocale>(() => loadExternalLocale())
  const [home, setHome] = useState<DistributionHomeResponse | null>(null)
  const [team, setTeam] = useState<TeamListResponse | null>(null)
  const [teamWeeklyIncome, setTeamWeeklyIncome] = useState<TeamWeeklyIncomeResponse | null>(null)
  const [rewards, setRewards] = useState<RewardListResponse | null>(null)
  const [rewardSummary, setRewardSummary] = useState<RewardSummaryResponse | null>(null)
  const [withdrawRequest, setWithdrawRequest] = useState<WithdrawRequestResponse | null>(null)
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawHistoryListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showBalance, setShowBalance] = useState(true)
  const [teamDetailsOpen, setTeamDetailsOpen] = useState(false)
  const [rewardDetailsOpen, setRewardDetailsOpen] = useState(false)
  const copy = externalPageCopyByLocale[locale]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXTERNAL_LOCALE_KEY, locale)
    }
  }, [locale])

  useEffect(() => {
    async function loadData() {
      if (!session) return
      setLoading(true)
      setError('')
      try {
        const [homeData, teamData, teamWeeklyIncomeData, rewardData, rewardSummaryData, withdrawHistoryData] = await Promise.all([
          getDistributionHome(session.userId, session.accessToken),
          getDistributionTeam(session.userId, session.accessToken),
          getDistributionTeamWeeklyIncome(session.userId, session.accessToken),
          getDistributionRewards(session.userId, session.accessToken),
          getDistributionRewardSummary(session.userId, session.accessToken),
          getWithdrawHistory(session.userId, session.accessToken, { page: 0, size: 10 }),
        ])
        setHome(homeData)
        setTeam(teamData)
        setTeamWeeklyIncome(teamWeeklyIncomeData)
        setRewards(rewardData)
        setRewardSummary(rewardSummaryData)
        setWithdrawHistory(withdrawHistoryData)
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载收益失败'
        if (/access denied|unauthorized|session/i.test(message)) {
          window.localStorage.removeItem(STORAGE_KEY)
          setSession(null)
          setError('登录状态已过期，请重新登录。')
        } else {
          setError(message)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [session])

  async function handleCreateWithdrawRequest() {
    if (!session) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const request = await createWithdrawRequest(session.userId, session.accessToken)
      setWithdrawRequest(request)
      setSuccessMessage(`提现申请已提交，申请单号 ${request.requestNo}，本次申请钻石 ${request.requestedDiamondAmount}。`)
      const [homeData, rewardData, withdrawHistoryData] = await Promise.all([
        getDistributionHome(session.userId, session.accessToken),
        getDistributionRewards(session.userId, session.accessToken),
        getWithdrawHistory(session.userId, session.accessToken, { page: 0, size: 10 }),
      ])
      setHome(homeData)
      setRewards(rewardData)
      setWithdrawHistory(withdrawHistoryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发起提现申请失败')
    } finally {
      setLoading(false)
    }
  }

  function getRewardStatusLabel(status?: string) {
    if (status === 'FROZEN') return copy.rewardStatusFrozen
    if (status === 'AVAILABLE') return copy.rewardStatusAvailable
    if (status === 'RISK_HOLD') return copy.rewardStatusRiskHold
    return copy.rewardStatusDefault
  }

  const inviteeIncome = team?.items.reduce((sum, item) => sum + item.confirmedIncomeTotal, 0) ?? 0
  const myCommission = rewards?.items.reduce((sum, item) => sum + item.rewardAmount, 0) ?? 0
  const rewardItems = rewards?.items ?? []
  const rewardTierSummary = rewardSummary?.tiers ?? []
  const tierSummaryByLevel = new Map(rewardTierSummary.map((tier) => [tier.rewardLevel, tier]))

  function getRewardActivityTitle(level?: number | null) {
    if (locale !== 'zh') return formatBusinessRewardLevel(level, locale)
    if (level === 1) return '直接邀请奖励'
    if (level === 2) return '历史二级佣金（只读）'
    if (level === 3) return '历史三级佣金（只读）'
    return '历史层级佣金（只读）'
  }

  function formatRewardDate(value?: string) {
    if (!value) return '--'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : locale, {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const availableReward = home?.availableReward ?? 0
  const totalReward = home?.totalReward ?? myCommission
  const frozenReward = home?.frozenReward ?? 0
  const effectiveUsersThisView = home?.effectiveUsers ?? 0
  const growthTarget = 10
  const growthProgress = Math.min(100, Math.round((effectiveUsersThisView / growthTarget) * 100))
  const growthRemaining = Math.max(0, growthTarget - effectiveUsersThisView)

  return (
    <div className="consumer-app-page">
      <main className="consumer-shell">
        <header className="consumer-topbar">
          <a className="consumer-brand" href="/earnings"><img className="consumer-brand-logo" src="/bandeira-logo-v1.png" alt="" />BANDEIRA</a>
          <div className="consumer-topbar-actions">
            {!session ? (
              <select className="consumer-language" aria-label={copy.languageLabel} value={locale} onChange={(event) => setLocale(event.target.value as keyof typeof externalPageCopyByLocale)}>
                <option value="zh">中文</option>
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="id">ID</option>
                <option value="pt">PT</option>
              </select>
            ) : null}
            {session ? <ConsumerAccountLink locale={locale} /> : <a className="consumer-account-link" href="/invite#phone-login"><UserCircle weight="regular" aria-hidden="true" /><span>登录</span><CaretRight weight="bold" aria-hidden="true" /></a>}
          </div>
        </header>

        {error ? <div className="consumer-banner is-error" role="alert">{error}</div> : null}
        {!error && successMessage ? <div className="consumer-banner is-success" role="status">{successMessage}</div> : null}

        {!session ? (
          <section className="consumer-auth-gate">
            <div className="consumer-auth-icon"><Wallet weight="duotone" aria-hidden="true" /></div>
            <p className="consumer-eyebrow">{copy.earningsOverview}</p>
            <h1>{copy.noSessionTitle}</h1>
            <p>{copy.noSessionHint}</p>
            <a className="consumer-primary-link" href="/invite#phone-login">
              {copy.noSessionPrimary}<ArrowRight weight="bold" aria-hidden="true" />
            </a>
          </section>
        ) : (
          <>
            <div className="consumer-home-greeting">
              <h1 className="consumer-visually-hidden">{copy.earningsTitle}</h1>
              <span className="consumer-home-avatar"><User weight="fill" aria-hidden="true" /></span>
              <div>
                <strong>{locale === 'zh' ? '早上好，伙伴！' : copy.earningsTitle}</strong>
                <span>{locale === 'zh' ? '每一次有效邀请，都在积累你的奖励。' : copy.earningsSubtitle}</span>
              </div>
              <a className="consumer-notification-link" href="#all-rewards" aria-label="查看奖励记录"><Bell weight="regular" aria-hidden="true" /><i /></a>
            </div>

            <section className="consumer-balance-card" aria-label={copy.availableReward}>
              <div className="consumer-balance-top">
                <div className="consumer-balance-label">
                  <span>{copy.availableReward}</span>
                  <button type="button" className="consumer-icon-button" onClick={() => setShowBalance((value) => !value)} aria-label={showBalance ? '隐藏余额' : '显示余额'}>
                    {showBalance ? <Eye weight="regular" aria-hidden="true" /> : <EyeSlash weight="regular" aria-hidden="true" />}
                  </button>
                </div>
                <button className="consumer-hero-withdraw" type="button" onClick={handleCreateWithdrawRequest} disabled={loading || availableReward <= 0}>
                  {loading ? '处理中…' : '申请提现'}<CaretRight weight="bold" aria-hidden="true" />
                </button>
              </div>
              <div className="consumer-balance-value">
                <Diamond weight="fill" aria-hidden="true" />
                <strong>{showBalance ? formatMoney(availableReward) : '••••••'}</strong>
              </div>
              <div className="consumer-balance-metrics">
                <div>
                  <span>{copy.frozenReward}</span>
                  <strong>{showBalance ? formatMoney(frozenReward) : '••••'}</strong>
                </div>
                <div>
                  <span>{copy.totalReward}</span>
                  <strong>{showBalance ? formatMoney(totalReward) : '••••'}</strong>
                </div>
                <div>
                  <span>{copy.inviteeIncome}</span>
                  <strong>{showBalance ? formatMoney(inviteeIncome) : '••••'}</strong>
                </div>
                <div>
                  <span>{copy.effectiveUsers}</span>
                  <strong>{effectiveUsersThisView}</strong>
                </div>
              </div>
            </section>

            <button className="consumer-growth-card" type="button" onClick={() => setTeamDetailsOpen(true)}>
              <span className="consumer-growth-medal"><Medal weight="duotone" aria-hidden="true" /></span>
              <span className="consumer-growth-copy">
                <span><strong>新星邀请人</strong><b>{effectiveUsersThisView}<small>/{growthTarget}</small></b></span>
                <i><em style={{ width: `${growthProgress}%` }} /></i>
                <small>{growthRemaining > 0 ? <>再邀请 <strong>{growthRemaining}</strong> 位有效用户，即可完成本阶段目标</> : '本阶段目标已完成，继续保持增长'}</small>
              </span>
              <CaretRight weight="bold" aria-hidden="true" />
            </button>

            <button className="consumer-team-summary" type="button" onClick={() => setTeamDetailsOpen(true)}>
              <span className="consumer-card-title"><UsersThree weight="fill" aria-hidden="true" />邀请概览（本周）</span>
              <CaretRight weight="bold" aria-hidden="true" />
              <span className="consumer-team-summary-grid">
                <span><small>已邀请用户</small><strong>{home?.directInvitedUsers ?? 0}</strong></span>
                <span><small>下线确认收益</small><strong>{formatMoney(inviteeIncome)}</strong></span>
                <span><small>我的累计奖励</small><strong>{formatMoney(totalReward)}</strong></span>
              </span>
            </button>

            <section className="consumer-task-section">
              <div className="consumer-section-head consumer-task-head">
                <h2><Target weight="fill" aria-hidden="true" />今天怎么推进收益</h2>
                <span>4 个关键动作</span>
              </div>

              <div className="consumer-task-list">
                <a href="/invite"><span className="is-orange"><UserPlus weight="fill" /></span><div><strong>邀请新用户</strong><small>当前已邀请 {home?.directInvitedUsers ?? 0} 人</small></div><b>去邀请</b></a>
                <a href="/account"><span className="is-pink"><LinkSimple weight="bold" /></span><div><strong>完成平台绑定</strong><small>登记并验证 Timo / Linky ID</small></div><b>去绑定</b></a>
                <button type="button" onClick={() => setTeamDetailsOpen(true)}><span className="is-green"><UsersThree weight="fill" /></span><div><strong>跟进有效用户</strong><small>本期有效用户 {effectiveUsersThisView} 人</small></div><b>查看团队</b></button>
                <button type="button" onClick={() => setRewardDetailsOpen(true)}><span className="is-purple"><Sparkle weight="fill" /></span><div><strong>查看奖励记录</strong><small>当前共 {rewardItems.length} 笔奖励</small></div><b>查看记录</b></button>
              </div>
            </section>

            <section className="consumer-activity-section">
              <div className="consumer-section-head">
                <h2>{copy.rewardActivityTitle}</h2>
                <button type="button" onClick={() => setRewardDetailsOpen(true)}>{locale === 'zh' ? '全部记录' : copy.rewardRecords}<CaretRight weight="bold" aria-hidden="true" /></button>
              </div>

              {loading ? (
                <div className="consumer-loading-list" aria-label={copy.loading}>
                  <span /><span /><span />
                </div>
              ) : rewardItems.length ? (
                <div className="consumer-activity-list">
                  {rewardItems.slice(0, 3).map((item, index) => {
                    const isAvailable = item.rewardStatus === 'AVAILABLE'
                    return (
                      <article className="consumer-activity-row" key={`${item.sourceUserId}-${item.calculatedAt}-${index}`}>
                        <span className={`consumer-activity-icon ${isAvailable ? 'is-available' : 'is-frozen'}`}>
                          {isAvailable ? <CheckCircle weight="fill" aria-hidden="true" /> : <LockSimple weight="fill" aria-hidden="true" />}
                        </span>
                        <div className="consumer-activity-copy">
                          <strong>{getRewardActivityTitle(item.rewardLevel)}</strong>
                          <span>{locale === 'zh' ? '来自用户' : copy.inviteeIncome} #{item.sourceUserId}</span>
                        </div>
                        <div className={`consumer-activity-amount ${isAvailable ? 'is-available' : 'is-frozen'}`}>
                          <strong>+ {formatMoney(item.rewardAmount)}</strong>
                          <span>{getRewardStatusLabel(item.rewardStatus)} · {formatRewardDate(item.calculatedAt)}</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="consumer-empty-state">
                  <UserPlus weight="duotone" aria-hidden="true" />
                  <div><strong>{copy.emptyRewardsTitle}</strong><p>{copy.emptyRewardsHint}</p></div>
                  <a href="/invite">{copy.emptyRewardsAction}</a>
                </div>
              )}
            </section>

            <section className="consumer-details" id="team-details">
              <details open={teamDetailsOpen} onToggle={(event) => setTeamDetailsOpen(event.currentTarget.open)}>
                <summary><span>团队概览</span><strong>{home?.totalTeamUsers ?? 0} 人</strong></summary>
                <div className="consumer-detail-grid">
                  <div><span>一级用户</span><strong>{home?.directInvitedUsers ?? 0}</strong></div>
                  <div><span>二级用户</span><strong>{home?.secondLevelInvitedUsers ?? 0}</strong></div>
                  <div><span>三级用户</span><strong>{home?.thirdLevelInvitedUsers ?? 0}</strong></div>
                  <div><span>团队本周收入</span><strong>{formatMoney(teamWeeklyIncome?.currentWeekTeamIncome)}</strong></div>
                </div>
              </details>
              <details id="all-rewards" open={rewardDetailsOpen} onToggle={(event) => setRewardDetailsOpen(event.currentTarget.open)}>
                <summary><span>奖励明细</span><strong>{rewardItems.length} 笔</strong></summary>
                <div className="consumer-detail-grid">
                  {[1, 2, 3].map((level) => {
                    const tier = tierSummaryByLevel.get(level)
                    return <div key={level}><span>{tier?.businessLevelLabel || formatBusinessRewardLevel(level, locale)}</span><strong>{formatMoney(tier?.rewardAmount)}</strong></div>
                  })}
                  <div><span>{copy.inviteeIncome}</span><strong>{formatMoney(inviteeIncome)}</strong></div>
                </div>
              </details>
              <details>
                <summary><span>提现记录</span><strong>{withdrawHistory?.total ?? 0} 条</strong></summary>
                {withdrawRequest ? <p className="consumer-detail-note">最近申请 {withdrawRequest.requestNo} · {withdrawRequest.requestedDiamondAmount} 钻石</p> : null}
                {withdrawHistory?.items?.length ? (
                  <div className="consumer-withdraw-list">
                    {withdrawHistory.items.slice(0, 5).map((item) => (
                      <div key={item.requestNo}><span>{item.requestNo}<small>{formatRewardDate(item.requestedAt)}</small></span><strong>{item.requestedDiamondAmount} · {item.requestStatus}</strong></div>
                    ))}
                  </div>
                ) : <p className="consumer-detail-note">还没有提现记录。</p>}
              </details>
            </section>
          </>
        )}

        {session ? <ConsumerBottomNavigation locale={locale} active="earnings" /> : null}
      </main>
    </div>
  )
}

function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  if (pathname.startsWith('/account/timo')) return <TimoBindingPage />
  if (pathname.startsWith('/account/linky') || pathname.startsWith('/bind')) return <BindLandingPage />
  if (pathname.startsWith('/account')) return <AccountPage />
  if (pathname.startsWith('/invite')) return <InviteCodePage />
  if (pathname.startsWith('/earnings')) return <EarningsPage />
  const designPreview = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('adminPreview') === '1'
  return <ConsoleApp initialAdminSession={designPreview ? {
    sessionToken: 'local-design-preview',
    expiresAt: '2099-12-31T23:59:59Z',
    username: 'design-preview',
    displayName: 'BANDEIRA Admin',
    role: 'super_admin',
    platformScope: '*',
    guildScope: '*',
    regionScope: 'BR',
  } : null} />
}

export { ConsoleApp }
export default App
