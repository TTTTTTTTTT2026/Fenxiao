import {
UserCircle
} from '@phosphor-icons/react'
import { useCallback,useEffect,useMemo,useRef,useState,type FormEvent } from 'react'
import {
activateAdminOperatingDividendPolicy,
activateAdminUserGradeLevel,
addAdminSmsDailyWhitelistNumber,
applyAdminWithdrawBatchAction,
approveWithdrawForPayment,
assignAdminMentor,
changeExperimentStatus,
confirmAdminUserGradeAdvancementUpgrade,
createAdminMentorIncentiveRules,
createAdminOperatingDividendPolicies,
createAdminPlatformGuildOperatingShareRate,
createAdminSeedInviter,
createAdminUserGradeAdvancementReview,
createAdminUserGradeLevel,
createExperiment,
createProfile,
disableAdminUserPasswordLogin,
enrollExperimentParticipant,
evaluateAdminUserGrade,
excludeAdminEffectiveUserQualification,
failAdminUserGradeAdvancementReview,
getAdminAuditLogs,
getAdminCommissionPolicies,
getAdminEffectiveUserQualifications,
getAdminGuildConfigs,
getAdminGuildWeeklyReport,
getAdminIncomeDataQuality,
getAdminIncomeDataQualityExceptions,
getAdminIncomeRewardCandidateItems,
getAdminIncomeRewardCandidateSample,
getAdminIncomeRewardCandidateSummary,
getAdminIncomeShadowLedgerSummary,
getAdminIncomeSyncStatus,
getAdminInvitationAccount,
getAdminLinkyReplayRecords,
getAdminLinkyWebhookLogs,
getAdminMentorAssignedStudents,
getAdminMentorIncentiveDashboard,
getAdminOperatingDividendDashboard,
getAdminOverview,
getAdminPhoneVerificationCodeAudit,
getAdminPhoneVerificationCodes,
getAdminPlatformGuildCompanyShareRules,
getAdminPlatformGuildDirectory,
getAdminPlatformGuildDirectorySyncRuns,
getAdminPlatformIntegrations,
getAdminPlatformVerificationMocks,
getAdminPlatformVerificationRuntime,
getAdminSeedInviters,
getAdminSmsDailyWhitelist,
getAdminSmsDeliveryStatus,
getAdminTeamManagementDashboard,
getAdminTeamMembers,
getAdminTokenPointConversionDashboard,
getAdminUserGradeAdvancementReviews,
getAdminUserGradeDashboard,
getAdminUserGradeLevelDashboard,
getAdminUserPointDashboard,
getExperimentDashboard,
qualifyAdminMentor,
recordWithdrawPayment,
refreshAdminEffectiveUserQualifications,
refreshAdminIncomeRewardCandidates,
refreshAdminIncomeShadowLedger,
refreshAdminLinkyEligibility,
refreshAdminLinkyEligibilityBatch,
refreshAdminUserPoints,
rejectAdminWithdrawRequest,
removeAdminSmsDailyWhitelistNumber,
replayAdminIncomeShadowLedger,
retireAdminOperatingDividendPolicy,
retireAdminUserGradeLevel,
revealAdminPhoneVerificationCode,
reverseWithdrawPayment,
reviewAdminIncomeDataQualityException,
runAdminIncomeControlledChanges,
runAdminIncomeControlledReconciliation,
saveAdminGuildConfig,
saveAdminPlatformVerificationMock,
saveAdminTeamOperatingProfitSharePermission,
saveAdminTokenPointConversion,
setAdminUserPasswordLogin,
updateAdminLinkyInvitationGuild,
updateAdminSmsDeliveryStatus,
updateAdminUserCountry,
type AuditLogListResponse,
type BatchOperationResultResponse,
type CommissionPolicyResponse,
type EffectiveUserQualificationResponse,
type ExperimentDashboardResponse,
type GuildConfigRequest,
type GuildConfigResponse,
type GuildWeeklyReportResponse,
type InvitationRewardAccountResponse,
type LinkyBatchRefreshResponse,
type LinkyEligibilityCheckResponse,
type LinkyReplayRecordListResponse,
type LinkyWebhookLogListResponse,
type McnIncomeControlledChangesResponse,
type McnIncomeControlledReconciliationResponse,
type McnIncomeDataQualityExceptionResponse,
type McnIncomeDataQualityResponse,
type McnIncomeRewardCandidateItemResponse,
type McnIncomeRewardCandidateSampleResponse,
type McnIncomeRewardCandidateSummaryResponse,
type McnIncomeShadowLedgerSummaryResponse,
type McnIncomeSyncStatusResponse,
type MentorAssignedStudentResponse,
type MentorIncentiveDashboardResponse,
type OperatingDividendDashboardResponse,
type OverviewReportResponse,
type PhoneVerificationCodeListResponse,
type PlatformGuildCompanyShareRuleResponse,
type PlatformGuildDirectoryItem,
type PlatformGuildDirectorySyncRun,
type PlatformIntegrationResponse,
type PlatformVerificationMockResponse,
type PlatformVerificationRuntimeResponse,
type SeedInviterListResponse,
type SeedInviterResponse,
type SmsDailyWhitelistPage,
type SmsDeliveryStatus,
type TeamManagementDashboardResponse,
type TeamManagementItemResponse,
type TeamManagementMemberResponse,
type TokenPointConversionDashboardResponse,
type UserGradeAdvancementReviewResponse,
type UserGradeDashboardResponse,
type UserGradeLevelDashboardResponse,
type UserPointDashboardResponse
} from '../api'
import { adjustAdminRelation, correctAdminOwnership, getAdminOwnership, getAdminRelation, type OwnershipDetailResponse, type RelationDetailResponse } from './bindingApi'
import { getAdminRewards, getAdminWithdrawRequests, type AdminWithdrawRequestListResponse, type RewardListResponse } from './financeReadApi'
import {
  createAdminAccount,
  getAdminAccounts,
  getAdminDeviceSessions,
  getMyAdminSecurityEvents,
  resetAdminPassword,
  revokeAdminDeviceSession,
  unlockAdminAccount,
  updateAdminAccount,
  type AdminAccountResponse,
  type AdminDeviceSessionResponse,
  type AdminSecurityEventResponse,
} from './accountSecurityApi'
import { applyAdminRiskEventAction, applyAdminRiskEventBatchAction, getAdminRiskEvents, type RiskEventListResponse } from './riskApi'
import { getAdminUserPlatformProfiles, type UserPlatformProfileListResponse } from './userDirectoryApi'
import { changeAdminPassword, createAdminSession, getCurrentAdminSession, logoutAdminSession, logoutAllAdminSessions } from './authApi'
import {
buildLinkyReplaySummary,
buildLinkyWebhookSummary,
buildPagedResultLabel,
} from '../linkyConsole'
import {
buildLinkyRelatedContext,
buildLinkyReplayDetailSections,
buildLinkyWebhookDetailSections,
buildLinkyWebhookHeadline,
} from '../linkyDetails'
import {
buildAdminSectionLinks,
buildEmptyStatePreset,
buildLinkyDiagnosticSnapshot,
deleteNamedFilterView,
saveNamedFilterView,
type NamedFilterView,
} from '../opsConsole'
import { formatPhoneVerificationPurpose,formatPhoneVerificationStatus } from '../phoneVerificationLabels'
import { CONSUMER_ORIGIN,buildChannelEntryLinks,consumerEntryOrigin } from '../publicEntries'
import { formatCountryNameZh,phoneCountries } from '../shared/catalog'
import { formatDateTime } from '../shared/dateTime'
import { formatPhoneNumber,normalizeLocalPhoneNumber } from '../shared/legacyFormatting'
import { loadJsonState,saveUserSession,STORAGE_KEY,type SessionState } from '../shared/legacySession'
import LegacyChannelEntriesSection from './LegacyChannelEntriesSection'
import LegacyAdminNavigation, { type LegacyNavGroup } from './LegacyAdminNavigation'
import LegacyCommissionPolicySection from './LegacyCommissionPolicySection'
import LegacyGuildDirectorySection from './LegacyGuildDirectorySection'
import LegacyOverviewSection from './LegacyOverviewSection'
import LegacyRiskQueueSection, { type RiskActionName, type RiskQuery } from './LegacyRiskQueueSection'
import LegacyUserAccountSection from './LegacyUserAccountSection'
import { DataTable,EmptyState,InfoCard,InfoRow,InlineHint,PanelSection,RelationItem,StatusBadge } from './LegacyPresentation'
import LegacyUserDirectorySection from './LegacyUserDirectorySection'
import {
ADMIN_SECTION_HASHES,
SYSTEM_CONFIG_SECTION_VIEWS,
SYSTEM_MANAGEMENT_SECTION_VIEWS,
getVisibleFinanceSections,
resolveAdminSectionFromHash,
type AdminSectionKey,
} from './navigation'
import { canManageTeamsInAdmin } from './roleCapabilities'
import { USER_GRADE_CATALOG } from './userGradeCatalog'
import './LegacyAdminV3.css'
void buildLinkyReplaySummary
void buildLinkyWebhookSummary

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
type WithdrawActionName = 'approve' | 'reject' | 'paid' | 'failed' | 'reverse'
type WithdrawQuery = { userId: string; status: string; page: string; size: string }
type PendingBatchAction =
  | { kind: 'withdraw'; action: 'APPROVE' | 'REJECT'; targetIds: string[] }
  | { kind: 'risk'; action: 'HANDLE' | 'IGNORE'; targetIds: number[] }

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

const PROFILE_CREATE_TOKEN_KEY = 'fenxiao-profile-create-token'
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
  { value: 'TIMO', label: 'Timo（数据接入）' },
]
const ADMIN_ROLE_OPTIONS = [
  { value: 'super_admin', label: '最高管理员' }, { value: 'admin', label: '管理员' },
  { value: 'operations', label: '运营' }, { value: 'operator', label: '操作员' },
  { value: 'finance', label: '财务' }, { value: 'customer_support', label: '客服' },
  { value: 'mentor', label: '导师' }, { value: 'team_leader', label: '团队负责人' },
]

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

function loadPlainState(key: string): string {
  const storage = typeof window !== 'undefined'
    ? window.localStorage
    : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null
  return storage?.getItem(key) || ''
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
  const [isSystemConfigNavOpen, setIsSystemConfigNavOpen] = useState(() => ['settings', 'systemExperiment', 'systemGuilds', 'systemPlatforms', 'systemIncomeControlled', 'systemIncomeShadow', 'systemMockVerification', 'systemAdvanced', 'systemSeedInviter', 'systemPhoneVerification', 'systemSmsWhitelist'].includes(resolveAdminSectionFromHash(typeof window !== 'undefined' ? window.location.hash : undefined)))
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
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<SmsDeliveryStatus | null>(null)
  const [smsDailyWhitelist, setSmsDailyWhitelist] = useState<SmsDailyWhitelistPage | null>(null)
  const [smsDailyWhitelistPhone, setSmsDailyWhitelistPhone] = useState('')
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
  const [accountSearchUserId, setAccountSearchUserId] = useState('')
  const [adminInvitationAccount, setAdminInvitationAccount] = useState<InvitationRewardAccountResponse | null>(null)
  const [selectedWithdrawRequestNo, setSelectedWithdrawRequestNo] = useState<string | null>(null)
  const [selectedWithdrawRequestNos, setSelectedWithdrawRequestNos] = useState<string[]>([])
  const [withdrawViews, setWithdrawViews] = useState(() => loadJsonState<NamedFilterView<WithdrawQuery>[]>(ADMIN_WITHDRAW_VIEWS_KEY) || [])
  const [withdrawViewName, setWithdrawViewName] = useState('')
  const [selectedWithdrawViewId, setSelectedWithdrawViewId] = useState('')
  const [platformIntegrations, setPlatformIntegrations] = useState<PlatformIntegrationResponse[] | null>(null)
  const [platformGuildShareDialogTarget, setPlatformGuildShareDialogTarget] = useState<{ platformCode: string; guildId: string; guildName: string } | null>(null)
  const [platformGuildShareRules, setPlatformGuildShareRules] = useState<PlatformGuildCompanyShareRuleResponse[]>([])
  const [platformGuildShareForm, setPlatformGuildShareForm] = useState({ rate: '' })
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
  const [platinumObservationProgressTarget, setPlatinumObservationProgressTarget] = useState<UserGradeAdvancementReviewResponse | null>(null)
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
  const [userCountryDraft, setUserCountryDraft] = useState<{ userId: number; currentCountryCode: string; targetCountryCode: string } | null>(null)
  const [userPasswordDraft, setUserPasswordDraft] = useState<{ userId: number; nickname: string | null; phoneNumber: string; mode: 'set' | 'disable'; alreadyEnabled: boolean; password: string; confirmPassword: string } | null>(null)
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
    origin: typeof window !== 'undefined' ? consumerEntryOrigin(window.location.origin) : CONSUMER_ORIGIN,
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
  const canManageTeams = canManageTeamsInAdmin(adminSession?.role)
  const canManageLinkyInvitationGuild = ['super_admin', 'admin'].includes(adminSession?.role?.toLowerCase() ?? '')
  const canManageUserCountry = ['super_admin', 'admin', 'operations'].includes(adminSession?.role?.toLowerCase() ?? '')
  const canManageUserPasswordLogin = adminSession?.role?.toLowerCase() === 'super_admin'
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
  const isFinanceManagementSection = ['rewards', 'userAccounts', 'commissionPolicies', 'tokenPointConversions'].includes(activeAdminSection)
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
    if (currentSettingsView !== 'phoneVerification' || !adminSession || !canAuditPhoneVerification) return
    void loadPhoneVerificationCodes()
    void loadSmsDeliveryStatus()
    // The list is deliberately refreshed whenever this sensitive review tab is entered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSettingsView, adminSession?.sessionToken, canAuditPhoneVerification])

  useEffect(() => {
    if (currentSettingsView !== 'smsWhitelist' || !adminSession || !canAuditPhoneVerification) return
    void loadSmsDailyWhitelist(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSettingsView, adminSession?.sessionToken, canAuditPhoneVerification])

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
    void import('../adminStressFixtures').then(({ buildAdminStressRiskEvents, buildAdminStressWithdrawRequests }) => {
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

  async function loadAdminInvitationAccount(page = 0) {
    if (!adminSession) return
    const userId = Number(accountSearchUserId.trim())
    if (!Number.isSafeInteger(userId) || userId <= 0) { setError('请输入有效的用户 ID'); return }
    setLoading(true)
    setError('')
    try {
      setAdminInvitationAccount(await getAdminInvitationAccount(adminSession.sessionToken, userId, page, 20))
    } catch (err) {
      setAdminInvitationAccount(null)
      setError(err instanceof Error ? err.message : '查询用户账户失败')
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

  async function loadSmsDeliveryStatus() {
    if (!adminSession || !canAuditPhoneVerification) return
    try {
      setSmsDeliveryStatus(await getAdminSmsDeliveryStatus(adminSession.sessionToken))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载短信接口状态失败')
    }
  }

  async function loadSmsDailyWhitelist(page = 0) {
    if (!adminSession || !canAuditPhoneVerification) return
    setLoading(true)
    setError('')
    try {
      setSmsDailyWhitelist(await getAdminSmsDailyWhitelist(adminSession.sessionToken, page))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载短信白名单失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSmsDailyWhitelistNumber() {
    if (!adminSession || !canAuditPhoneVerification) return
    setLoading(true)
    setError('')
    try {
      await addAdminSmsDailyWhitelistNumber(adminSession.sessionToken, smsDailyWhitelistPhone.trim())
      setSmsDailyWhitelistPhone('')
      setSuccessMessage('号码已加入短信白名单；仅豁免每日发送次数上限。')
      await loadSmsDailyWhitelist(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加短信白名单失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveSmsDailyWhitelistNumber(id: number, phoneNumber: string) {
    if (!adminSession || !canAuditPhoneVerification || !window.confirm(`确认将 ${phoneNumber} 移出短信白名单？移除后立即恢复每日发送次数限制。`)) return
    setLoading(true)
    setError('')
    try {
      await removeAdminSmsDailyWhitelistNumber(adminSession.sessionToken, id)
      setSuccessMessage('号码已移出短信白名单。')
      await loadSmsDailyWhitelist(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除短信白名单失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSmsDeliverySwitch() {
    if (!adminSession || !canAuditPhoneVerification || !smsDeliveryStatus) return
    const nextEnabled = !smsDeliveryStatus.enabled
    if (nextEnabled && !window.confirm('确认开启创蓝短信？开启后所有符合格式的手机号码都可申请验证码并触发付费短信。当前仍有同一号码的发送频率限制；请确认已准备好监控短信费用。')) return
    setLoading(true)
    setError('')
    try {
      const next = await updateAdminSmsDeliveryStatus(adminSession.sessionToken, nextEnabled)
      setSmsDeliveryStatus(next)
      setSuccessMessage(next.active ? '创蓝短信已开启，符合格式的号码可以申请验证码。' : '创蓝短信已关闭，验证码仍可在受限后台审查。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换短信接口失败')
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoneVerificationPageChange(nextPage: number) {
    if (nextPage < 0) return
    const nextQuery = { ...phoneVerificationQuery, page: String(nextPage) }
    setPhoneVerificationQuery(nextQuery)
    await loadPhoneVerificationCodes(nextQuery)
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

  async function saveUserCountry() {
    if (!adminSession || !canManageUserCountry || !userCountryDraft || !userCountryDraft.targetCountryCode
      || userCountryDraft.targetCountryCode === userCountryDraft.currentCountryCode) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      await updateAdminUserCountry(adminSession.sessionToken, userCountryDraft.userId, userCountryDraft.targetCountryCode)
      await loadUserPlatformProfiles()
      setUserCountryDraft(null)
      setSuccessMessage(`用户 #${userCountryDraft.userId} 的归属国家已调整为${formatCountryNameZh(userCountryDraft.targetCountryCode)}。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '调整用户归属国家失败')
    } finally {
      setLoading(false)
    }
  }

  function openUserCountryDialog(item: UserPlatformProfileListResponse['items'][number]) {
    setUserCountryDraft({
      userId: item.userId,
      currentCountryCode: item.countryCode,
      targetCountryCode: phoneCountries.some((country) => country.countryCode === item.countryCode) ? item.countryCode : '',
    })
  }

  function openUserPasswordDialog(item: UserPlatformProfileListResponse['items'][number], mode: 'set' | 'disable') {
    if (!item.phoneNumber) return
    setUserPasswordDraft({ userId: item.userId, nickname: item.nickname, phoneNumber: item.phoneNumber,
      mode, alreadyEnabled: item.passwordLoginEnabled, password: '', confirmPassword: '' })
  }

  async function saveUserPasswordLogin() {
    if (!adminSession || !canManageUserPasswordLogin || !userPasswordDraft) return
    const draft = userPasswordDraft
    if (draft.mode === 'set' && (draft.password.length < 8 || draft.password !== draft.confirmPassword)) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      if (draft.mode === 'disable') {
        await disableAdminUserPasswordLogin(adminSession.sessionToken, draft.userId)
      } else {
        await setAdminUserPasswordLogin(adminSession.sessionToken, draft.userId, draft.password)
      }
      setUserPasswordDraft(null)
      await loadUserPlatformProfiles()
      setSuccessMessage(`用户 #${draft.userId} 的密码登录已${draft.mode === 'disable' ? '关闭' : draft.alreadyEnabled ? '重设' : '开通'}。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存密码登录设置失败')
    } finally {
      setLoading(false)
    }
  }

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
      setSuccessMessage('收入测算记录已按最新修订刷新；未产生任何奖励、钱包或提现结果。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新收入测算记录失败')
    } finally { setLoading(false) }
  }

  async function handleLoadIncomeShadowLedger() {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError('')
    try { setIncomeShadowResult(await getAdminIncomeShadowLedgerSummary(adminSession.sessionToken, incomeShadowForm.platformCode, incomeShadowForm.businessDate)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取收入测算摘要失败') }
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
      setSuccessMessage('已按已保留的最新 MCN 证据重新整理测算记录，并记录人工复核原因；未调用 MCN、未发奖。')
    } catch (err) { setError(err instanceof Error ? err.message : '重新整理收入测算记录失败') }
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
    catch (err) { setError(err instanceof Error ? err.message : '读取导师关系与历史记录失败') }
    finally { setLoading(false) }
  }

  async function openPlatformGuildShareDialog(platformCode: string, guildId: string, guildName: string) {
    if (!adminSession || !canRunControlledIncome) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      setPlatformGuildShareRules(await getAdminPlatformGuildCompanyShareRules(adminSession.sessionToken, platformCode, guildId))
      setPlatformGuildShareForm({ rate: '' })
      setPlatformGuildShareDialogTarget({ platformCode, guildId, guildName })
    } catch (err) { setError(err instanceof Error ? err.message : '读取公会公司分成比例历史失败') } finally { setLoading(false) }
  }

  async function savePlatformGuildOperatingShareRate() {
    if (!adminSession || !canRunControlledIncome || !platformGuildShareDialogTarget) return
    const ratePercent = Number(platformGuildShareForm.rate)
    if (!platformGuildShareForm.rate || !Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) { setError('公司分成比例请填写 0 到 100 之间的百分数，例如 25 表示 25%。'); return }
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await createAdminPlatformGuildOperatingShareRate(adminSession.sessionToken, platformGuildShareDialogTarget.platformCode, platformGuildShareDialogTarget.guildId, ratePercent / 100)
      setPlatformGuildShareRules(await getAdminPlatformGuildCompanyShareRules(adminSession.sessionToken, platformGuildShareDialogTarget.platformCode, platformGuildShareDialogTarget.guildId))
      setPlatformIntegrations(await getAdminPlatformIntegrations(adminSession.sessionToken))
      setPlatformGuildShareForm({ rate: '' })
      setSuccessMessage('公司分成比例已保存并立即生效；历史收入事实快照不变。')
    } catch (err) { setError(err instanceof Error ? err.message : '建立公会公司分成比例草稿失败') } finally { setLoading(false) }
  }

  async function loadOperatingDividendDashboard() {
    if (!adminSession || !canManageOperatingDividends) return
    setLoading(true); setError('')
    try { setOperatingDividendDashboard(await getAdminOperatingDividendDashboard(adminSession.sessionToken)) }
    catch (err) { setError(err instanceof Error ? err.message : '读取团队经营历史记录失败') }
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
      setIsUserGradeAdvancementDialogOpen(false); setSuccessMessage('已建立铂金 30 天观察记录，系统将自动计算直属银牌成员及其下属的达标情况。'); await loadUserGradeAdvancementReviews()
    } catch (err) { setError(err instanceof Error ? err.message : '建立高级等级验收记录失败') } finally { setLoading(false) }
  }

  async function confirmPlatinumUpgrade(review: UserGradeAdvancementReviewResponse) {
    if (!adminSession || !canManageTeams) return
    const note = window.prompt('填写确认升级为铂金的依据：')
    if (!note?.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await confirmAdminUserGradeAdvancementUpgrade(adminSession.sessionToken, review.id, note.trim())
      setSuccessMessage(`用户 ${review.userId} 已确认升级为铂金；不会改变团队经营分成开关。`); await loadUserGradeAdvancementReviews()
    } catch (err) { setError(err instanceof Error ? err.message : '保存高级等级验收失败') } finally { setLoading(false) }
  }

  async function failPlatinumObservation(review: UserGradeAdvancementReviewResponse) {
    if (!adminSession || !canManageTeams) return
    const note = window.prompt('填写本轮观察未通过的原因：')
    if (!note?.trim()) return
    setLoading(true); setError(''); setSuccessMessage('')
    try {
      await failAdminUserGradeAdvancementReview(adminSession.sessionToken, review.id, note.trim())
      setSuccessMessage(`已将用户 ${review.userId} 的本轮铂金观察标记为未通过。`); await loadUserGradeAdvancementReviews()
    } catch (err) { setError(err instanceof Error ? err.message : '标记观察未通过失败') } finally { setLoading(false) }
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
  const hasPhoneVerificationPrevPage = (phoneVerificationCodes?.page ?? Number(phoneVerificationQuery.page)) > 0
  const hasPhoneVerificationNextPage = phoneVerificationCodes ? (phoneVerificationCodes.page + 1) * phoneVerificationCodes.size < phoneVerificationCodes.total : false
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

  function handleLegacyNavOpen(section: AdminSectionKey) {
    if (section === 'users') void loadUserPlatformProfiles()
    if (section === 'riskQueue' && !riskEvents) void handleLoadRiskEvents()
    if (section === 'userGradeList' && !userGradeDashboard) void loadUserGradeDashboard()
    if (section === 'advancedGradeAcceptance' && !userGradeAdvancementReviews.length) void loadUserGradeAdvancementReviews()
    if (section === 'userGradeFacts') {
      if (!userGradeDashboard) void loadUserGradeDashboard()
      if (!userPointDashboard) void loadUserPointDashboard()
      if (canReadEffectiveUsers) void loadEffectiveUserQualifications()
    }
    if (section === 'commissionPolicies' && !commissionPolicies) void loadCommissionPolicies()
    if (section === 'tokenPointConversions' && !tokenPointConversionDashboard) void loadTokenPointConversionDashboard()
    if (section === 'accountManagement' || section === 'mySecurity' || section === 'securityRecords') void handleLoadAdminIdentityCenter()
    if (section === 'systemPlatforms') {
      if (!platformIntegrations) void loadPlatformIntegrations()
      if (!platformVerificationRuntime) void loadPlatformVerificationRuntime()
    }
    if (section === 'systemSeedInviter' && !seedInviters) void loadSeedInviters()
    if (section === 'platformGuildDirectory' && !platformGuildDirectory) void loadPlatformGuildDirectory()
    if (section === 'mentorDirectory' && !mentorIncentiveDashboard) void loadMentorIncentiveDashboard()
    if (section === 'teams' && !teamManagementDashboard) void loadTeamManagementDashboard()
  }

  function toggleLegacyNavGroup(group: LegacyNavGroup) {
    if (group === 'users') setIsUserManagementNavOpen((open) => !open)
    if (group === 'grades') setIsUserGradeNavOpen((open) => !open)
    if (group === 'finance') setIsFinanceManagementNavOpen((open) => !open)
    if (group === 'management') setIsSystemManagementNavOpen((open) => !open)
    if (group === 'config') setIsSystemConfigNavOpen((open) => !open)
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

      <LegacyAdminNavigation
        links={adminSectionLinks}
        activeSection={activeAdminSection}
        visibleFinanceSections={visibleFinanceSections}
        role={adminSession.role}
        openGroups={{ users: isUserManagementNavOpen, grades: isUserGradeNavOpen, finance: isFinanceManagementNavOpen, management: isSystemManagementNavOpen, config: isSystemConfigNavOpen }}
        riskEventTotal={riskEvents?.total ?? 0}
        canRunControlledIncome={canRunControlledIncome}
        canManageSeedInviters={canManageSeedInviters}
        canAuditPhoneVerification={canAuditPhoneVerification}
        isFinanceManagementSection={isFinanceManagementSection}
        isSystemManagementSection={isSystemManagementSection}
        isSystemConfigSection={isSystemConfigSection}
        hostname={window.location.hostname}
        onToggleGroup={toggleLegacyNavGroup}
        onNavigate={handleLegacyNavOpen}
      />

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
              description="平台账号主标识、公会范围和收益处理模式。Timo 当前仅允许保存收入事实并进行测算核对，不会触发真实发奖。"
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
                        const activeShare = guild.operatingShareRate == null ? null : `${(guild.operatingShareRate * 100).toFixed(2)}%`
                        const pendingShare = guild.pendingOperatingShareRate == null ? null : `${(guild.pendingOperatingShareRate * 100).toFixed(2)}%`
                        const shareLabel = pendingShare
                          ? `${activeShare ? `当前 ${activeShare} · ` : ''}待审批 V${guild.pendingShareVersion}：${pendingShare}`
                          : activeShare ?? '未配置'
                        return [guild.countryCode, guild.officialGuildId, guild.guildName, `${guild.directoryStatus} / ${guild.guildStatus}`, shareLabel, editable ? <button key={`${platform.platformCode}:${guild.officialGuildId}-edit`} className="ghost-btn small-btn" disabled={loading || !canRunControlledIncome} onClick={() => void openPlatformGuildShareDialog(platform.platformCode, guild.officialGuildId, guild.guildName)}>编辑分成</button> : '仅可配置 MCN 正常且启用的公会']
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
                  <InlineHint text="仅在 MCN 已确认的窗口内操作。完成已核验账号的分页、重读和对账后，请关闭服务器上的受控只读开关；正式收入同步应独立确认后开启。" />
                </InfoCard>
                <InfoCard title="持续同步与恢复状态" tone={incomeSyncStatus?.continuousPullEnabled ? 'success' : 'neutral'}>
                  <InlineHint text="持续同步关闭时，系统不会自动请求 MCN；此处展示平台最近一次收入同步摘要，不显示平台账号、收入明细或密钥。V2 按每个已核验账号独立保存同步进度。" />
                  <div className="action-row top-gap"><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeSyncStatus()} disabled={loading}>读取同步状态</button></div>
                  {incomeSyncStatus ? <div className="stack-gap top-gap">
                  <InlineHint text={incomeSyncStatus.continuousPullEnabled ? `收入同步已开启：北京时间每日 17:15 从已核验账号读取，每平台每轮最多 ${incomeSyncStatus.maxPagesPerRun} 页；奖励、钱包和付款仍保持关闭。` : '收入同步当前关闭；受控读取需单独开启。'} />
                    <div className="relation-grid">{incomeSyncStatus.platforms.map((item) => <RelationItem key={item.platformCode} label={`${item.platformCode === 'TIMO' ? 'Timo' : 'Linky'} 最近状态`} value={`${item.checkpointStatus}${item.latestRunStatus ? ` / ${item.latestRunStatus}` : ''}`} />)}</div>
                    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>平台</th><th>已核验 / 已读取账号</th><th>补取中 / 失败账号</th><th>最近成功</th><th>最近快照 / 水位</th><th>接收 / 新增 / 去重</th><th>未匹配</th><th>下次尝试</th><th>失败 / 重试</th></tr></thead><tbody>{incomeSyncStatus.platforms.map((item) => <tr key={item.platformCode}><td>{item.platformCode === 'TIMO' ? 'Timo' : 'Linky'}</td><td>{item.verifiedAccountCount} / {item.readAccountCount}</td><td>{item.recoveringAccountCount} / {item.failedAccountCount}</td><td>{item.lastSuccessAt ? formatDateTime(item.lastSuccessAt) : '-'}</td><td>{item.lastSnapshotAt ? `${formatDateTime(item.lastSnapshotAt)} / ${item.lastWatermarkCompleteness || '-'}` : item.lastWatermarkCompleteness || '-'}</td><td>{item.latestRunStatus ? `${item.latestReceivedCount} / ${item.latestNewCount} / ${item.latestDuplicateCount}` : '-'}</td><td>{item.latestRunStatus ? item.latestUnmatchedCount : '-'}</td><td>{item.nextAttemptAt ? formatDateTime(item.nextAttemptAt) : '-'}</td><td>{item.lastErrorCode || (item.retryAfterSeconds ? `${item.retryAfterSeconds} 秒后重试` : '-')}</td></tr>)}</tbody></table></div>
                  </div> : null}
                </InfoCard>
                <InfoCard title="账号收入补取与恢复" tone="neutral">
                  <InlineHint text="V2 按已核验账号独立记录收入同步进度。读取位置过期时，系统会按 MCN 可提供的历史日期分段补取并逐段对账；对账未通过不会恢复该账号的日常同步，也不会产生奖励、余额、提现或付款。" />
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
            <PanelSection sectionId="admin-income-shadow-ledger" eyebrow="MCN evidence · no financial effect" title="收入测算与核对" description="把已保留的 MCN 原始收入事实按最新修订整理为可核对记录。这里只检查数据归属与定稿状态，绝不计算或发放奖励。">
              <div className="stack-gap">
                <InfoCard title="核对范围" tone="neutral">
                  <div className="grid-form compact-form exception-filter-grid">
                    <label>平台<select value={incomeShadowForm.platformCode} onChange={(event) => { setIncomeShadowForm({ ...incomeShadowForm, platformCode: event.target.value }); setIncomeShadowResult(null); setIncomeDataQuality(null); setIncomeDataQualityExceptions([]); setIncomeRewardCandidateResult(null); setIncomeRewardCandidateItems([]) }}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
                    <label>业务日期<input type="date" value={incomeShadowForm.businessDate} onChange={(event) => { setIncomeShadowForm({ ...incomeShadowForm, businessDate: event.target.value }); setIncomeShadowResult(null); setIncomeDataQuality(null); setIncomeDataQualityExceptions([]); setIncomeRewardCandidateResult(null); setIncomeRewardCandidateItems([]) }} /></label>
                  </div>
                  <div className="action-row top-gap"><button className="primary-btn small-btn" onClick={() => void handleRefreshIncomeShadowLedger()} disabled={loading}>按最新修订刷新</button><button className="ghost-btn small-btn" onClick={() => setIsIncomeShadowReplayDialogOpen(true)} disabled={loading || !incomeShadowResult}>人工重新整理</button><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeShadowLedger()} disabled={loading}>读取已有结果</button><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeDataQuality()} disabled={loading}>查看数据质量</button></div>
                </InfoCard>
                {incomeShadowResult ? <InfoCard title="收入事实核对结果" tone="success"><div className="relation-grid">
                  <RelationItem label="来源事实 / 最新事实" value={`${incomeShadowResult.sourceFactCount} / ${incomeShadowResult.latestFactCount}`} />
                  <RelationItem label="已绑定且已定稿" value={incomeShadowResult.boundFinalCount} />
                  <RelationItem label="未匹配平台账号" value={incomeShadowResult.unmatchedCount} />
                  <RelationItem label="等待定稿" value={incomeShadowResult.awaitingFinalityCount} />
                  <RelationItem label="已撤销或作废" value={incomeShadowResult.voidedCount} />
                </div><InlineHint text="“已绑定且已定稿”仅表示可进入后续规则核对，不代表已经产生任何奖励或可提现余额。" /></InfoCard> : <EmptyState title="尚未生成收入测算记录" description="选择已完成受控对账的业务日后刷新。" />}
                {incomeDataQuality ? <InfoCard title="数据质量与待处理项" tone={incomeDataQuality.projectionStatus === 'COMPLETE' ? 'success' : 'neutral'}><div className="relation-grid">
                  <RelationItem label="投影完整性" value={`${incomeDataQuality.projectionStatus} · ${incomeDataQuality.projectedFactCount} / ${incomeDataQuality.latestFactCount}`} />
                  <RelationItem label="已归属覆盖率" value={`${incomeDataQuality.boundFinalCount} / ${incomeDataQuality.latestFactCount}（${incomeDataQuality.latestFactCount === 0 ? '0' : ((incomeDataQuality.boundFinalCount / incomeDataQuality.latestFactCount) * 100).toFixed(2)}%）`} />
                  <RelationItem label="未归属 / 等待定稿" value={`${incomeDataQuality.unmatchedCount} / ${incomeDataQuality.awaitingFinalityCount}`} />
                  <RelationItem label="作废事实" value={incomeDataQuality.voidedCount} />
                </div><InlineHint text="COMPLETE 表示最新 MCN 事实均已写入本地测算记录；未归属和等待定稿必须在进入任何后续规则前处理或确认。" />
                  {incomeDataQualityExceptions.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>事实参考号</th><th>状态</th><th>公会</th><th>结算状态</th><th>复核状态</th><th>最新修订</th><th>操作</th></tr></thead><tbody>{incomeDataQualityExceptions.map((item) => <tr key={`${item.sourceEventReference}:${item.sourceRevision}`}><td>{item.sourceEventReference}</td><td>{item.status === 'UNMATCHED' ? '未归属' : '等待定稿'}</td><td>{item.guildId || '-'}</td><td>{item.settlementStatus}</td><td>{item.reviewStatus === 'ACKNOWLEDGED' ? '已知悉' : item.reviewStatus === 'IGNORED' ? '已忽略' : '待复核'}{item.reviewNote ? <small className="table-subtext">{item.reviewNote}</small> : null}</td><td>{item.sourceRevision}</td><td><button className="ghost-btn small-btn" onClick={() => openIncomeExceptionReview(item)} disabled={loading}>复核</button></td></tr>)}</tbody></table></div> : <InlineHint text="当前没有未归属或等待定稿的收入事实。" />}
                </InfoCard> : null}
                <InfoCard title="邀请奖励候选测算" tone="neutral">
                  <InlineHint text="仅对已定稿、已归属且在收入发生时已完成绑定核验的事实，按收入发生时有效的来源公会公司分成比例，将原始收入换算为公司业务收入后演算固定两层邀请候选（直邀 10%、间邀 3%）。不会生成奖励或余额。" />
                  <InlineHint text="团队奖励 2%预留当前未启用：本阶段不计算、不记录，也不进入团队利润；待团队奖励方案单独确认后再启用。" />
                  <div className="action-row top-gap"><button className="primary-btn small-btn" onClick={() => void handleRefreshIncomeRewardCandidates()} disabled={loading || !incomeShadowResult}>按当前证据演算候选</button><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeRewardCandidates()} disabled={loading}>读取已有候选</button></div>
                </InfoCard>
                {incomeRewardCandidateResult ? <InfoCard title="奖励候选演算结果" tone="neutral"><div className="relation-grid">
                  <RelationItem label="来源事实 / 可进入规则核对" value={`${incomeRewardCandidateResult.sourceFactCount} / ${incomeRewardCandidateResult.sourceReadyCount}`} />
                  <RelationItem label="候选奖励条数" value={incomeRewardCandidateResult.candidateCount} />
                  <RelationItem label="规则阻断条数" value={incomeRewardCandidateResult.blockedCount} />
                  <RelationItem label="候选金额" value={`${incomeRewardCandidateResult.candidateAmount} ${incomeRewardCandidateResult.amountUnit || ''}`.trim()} />
                </div><InlineHint text="候选金额只用于业务与财务核对；它不是奖励、余额、可提现金额或付款指令。导师奖励当前关闭，不在此处计算。" />
                  <div className="action-row top-gap"><button className="ghost-btn small-btn" onClick={() => void handleLoadIncomeRewardCandidateSample()} disabled={loading || !incomeRewardCandidateResult.latestRunId}>抽取 10 条核验样本</button></div>
                  {incomeRewardCandidateItems.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>事实参考号</th><th>邀请层级</th><th>来源用户 / 公会</th><th>候选受益人</th><th>原始收入</th><th>公司比例</th><th>公司业务收入</th><th>候选金额</th><th>规则快照</th><th>依据</th></tr></thead><tbody>{incomeRewardCandidateItems.map((item) => <tr key={`${item.sourceEventReference}:${item.rewardLevel}`}><td>{item.sourceEventReference}</td><td>{item.rewardLevel === 1 ? '直邀 · 10%' : item.rewardLevel === 2 ? '间邀 · 3%' : '-'}</td><td>{item.sourceUserId || '-'}<small className="table-subtext">{item.sourceGuildId || '未取得公会'}</small></td><td>{item.recipientUserId || '-'}</td><td>{`${item.baseAmount} ${item.amountUnit}`}</td><td>{item.companyShareRate === null ? '-' : `${(item.companyShareRate * 100).toFixed(2)}%`}</td><td>{item.companyIncomeBaseAmount === null ? '-' : `${item.companyIncomeBaseAmount} ${item.amountUnit}`}</td><td>{item.candidateAmount === null ? '-' : `${item.candidateAmount} ${item.amountUnit}`}</td><td>{item.policyCode ? `${item.policyCode}${item.ruleRate === null ? '' : ` · ${(item.ruleRate * 100).toFixed(2)}%`}${item.invitationVersion === null ? '' : ` · 邀请版本 ${item.invitationVersion}`}` : item.calculationVersion}</td><td>{item.reason}</td></tr>)}</tbody></table></div> : <InlineHint text="尚无可展示的分佣候选；可能尚未演算、收入未归属，或来源用户在收入发生时未完成平台绑定。" />}
                  {incomeRewardCandidateSample ? <div className="top-gap"><InlineHint text={`本次快照 ${incomeRewardCandidateSample.runId}：可核验 ${incomeRewardCandidateSample.availableCount} 条，其中候选 ${incomeRewardCandidateSample.candidateAvailableCount} 条、阻断 ${incomeRewardCandidateSample.blockedAvailableCount} 条。样本按固定哈希抽取，重复读取结果一致。`} />
                    {incomeRewardCandidateSample.items.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>样本事实参考号</th><th>邀请层级</th><th>原始收入</th><th>公司比例 / 基数</th><th>候选金额</th><th>规则快照</th><th>依据</th></tr></thead><tbody>{incomeRewardCandidateSample.items.map((item) => <tr key={`${incomeRewardCandidateSample.runId}:${item.sourceEventReference}:${item.rewardLevel}`}><td>{item.sourceEventReference}</td><td>{item.rewardLevel === 0 ? '来源门禁' : item.rewardLevel === 1 ? '直邀 · 10%' : '间邀 · 3%'}</td><td>{`${item.baseAmount} ${item.amountUnit}`}</td><td>{item.companyShareRate === null || item.companyIncomeBaseAmount === null ? '-' : `${(item.companyShareRate * 100).toFixed(2)}% / ${item.companyIncomeBaseAmount} ${item.amountUnit}`}</td><td>{item.candidateAmount === null ? '-' : `${item.candidateAmount} ${item.amountUnit}`}</td><td>{item.policyCode || item.calculationVersion}</td><td>{item.reason}</td></tr>)}</tbody></table></div> : <InlineHint text="本次运行没有可供抽样的候选或阻断项。" />}</div> : null}
                </InfoCard> : null}
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'commissionPolicies' && canRunControlledIncome ? (
            <LegacyCommissionPolicySection policies={commissionPolicies} loading={loading} onRefresh={() => void loadCommissionPolicies()} />
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
                  {tokenPointConversionDashboard ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>应用</th><th>原始收入代币单位</th><th>每 1 代币兑换积分</th><th>配置状态</th><th>操作</th></tr></thead><tbody>{tokenPointConversionDashboard.conversions.map((conversion) => <tr key={conversion.platformCode}><td>{conversion.platformCode}</td><td>{conversion.tokenUnit}</td><td><input aria-label={`${conversion.platformCode} 每 1 代币兑换积分`} required min="0.000001" step="0.000001" inputMode="decimal" value={tokenPointConversionValues[conversion.platformCode] ?? ''} onChange={(event) => setTokenPointConversionValues({ ...tokenPointConversionValues, [conversion.platformCode]: event.target.value })} placeholder="例如：0.2" /></td><td>{conversion.configured ? '已配置（长期有效）' : '尚未配置'}</td><td><button className="primary-btn small-btn" onClick={() => requestSaveTokenPointConversion(conversion.platformCode, conversion.tokenUnit)} disabled={loading}>保存</button></td></tr>)}</tbody></table></div> : <EmptyState title="尚未读取换算配置" description="点击“刷新数据”读取 Timo 与 Linky 的原始代币单位。" />}
                  <InlineHint text="系统先计算公司业务收入与直邀／间邀奖励，再按来源平台的换算比例将邀请奖励钻石折算为钱包积分。每次保存生成新版本；已入账事实不重算，未入账的有效事实将按新比例补入。" />
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
            <PanelSection sectionId="admin-user-grades" eyebrow="User grade · direct effective users" title={activeAdminSection === 'userGradeList' ? '用户等级列表' : activeAdminSection === 'advancedGradeAcceptance' ? '高阶经营验收' : '等级资格事实与复核'} description={activeAdminSection === 'userGradeList' ? '此处展示已确认的七级用户等级制度与当前规则范围。等级定义由研发配置维护，运营后台仅供查阅，不提供编辑或新增入口。' : activeAdminSection === 'advancedGradeAcceptance' ? '当前仅开放铂金 30 天观察：系统按邀请关系与本地定稿收入自动计算，运营只确认升级或未通过。' : '查看和复核有效用户、等级评估以及直属邀请积分事实。所有计算只基于本地已定稿收入事实。'} action={<button className="ghost-btn" onClick={() => { void loadUserGradeDashboard(); if (activeAdminSection === 'advancedGradeAcceptance') void loadUserGradeAdvancementReviews(); if (activeAdminSection === 'userGradeFacts') { void loadUserPointDashboard(); if (canReadEffectiveUsers) void loadEffectiveUserQualifications() } }} disabled={loading}>刷新数据</button>}>
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
                    <button className="primary-btn" onClick={() => void refreshUserPointFacts()} disabled>旧口径已停用</button>
                  </div>
                  {userPointDashboard ? <>
                    <div className="relation-grid top-gap"><RelationItem label="已累计积分事实" value={userPointDashboard.accruedFactCount} /><RelationItem label="暂无法记分" value={userPointDashboard.blockedFactCount} /><RelationItem label="证据已撤销" value={userPointDashboard.revokedFactCount} /><RelationItem label="本平台累计积分" value={userPointDashboard.accruedPointTotal.toFixed(6)} /></div>
                    <InlineHint text="此处仅供查阅历史直邀积分事实，原始收入直接换算的旧口径已停用，不会进入新用户账户。正式邀请奖励积分请在财务管理 → 用户账户查询。等级仍按有效直邀人数和高级经营验收判断。" />
                    {userPointDashboard.topBalances.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>邀请人用户</th><th>累计积分（跨平台）</th><th>有效积分事实</th><th>最近下级收入</th></tr></thead><tbody>{userPointDashboard.topBalances.map((balance) => <tr key={balance.userId}><td>{balance.userId}</td><td>{balance.totalPoints.toFixed(6)}</td><td>{balance.accruedFactCount}</td><td>{formatDateTime(balance.latestIncomeAt ?? undefined)}</td></tr>)}</tbody></table></div> : <EmptyState title="尚无可累计积分" description="需先为该平台保存代币积分换算，并存在已绑定、已定稿且具有直接邀请人的收入事实。" />}
                    {userPointDashboard.recentFacts.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>收入事实</th><th>下级 / 邀请人</th><th>原始收入</th><th>换算比例</th><th>积分</th><th>状态</th><th>依据</th></tr></thead><tbody>{userPointDashboard.recentFacts.map((fact) => <tr key={`${fact.platformCode}-${fact.sourceEventId}`}><td>{fact.sourceEventId}<small className="table-subtle">{formatDateTime(fact.occurredAt)}</small></td><td>{fact.sourceUserId ?? '—'} / {fact.beneficiaryUserId ?? '—'}</td><td>{fact.sourceAmount} {fact.tokenUnit}</td><td>{fact.pointsPerToken ?? '—'}</td><td>{fact.pointAmount ?? '—'}</td><td>{fact.factStatus}</td><td>{fact.decisionReason}</td></tr>)}</tbody></table></div> : null}
                  </> : <EmptyState title="尚未读取历史积分事实" description="此处只读历史数据；新邀请奖励积分以用户账户为准。" />}
                </InfoCard> : null}
                {activeAdminSection === 'advancedGradeAcceptance' ? <InfoCard title="铂金：30 天培养与经营验收" tone="neutral">
                  <p>当前仅开放铂金验收。建立记录后，系统自动观察 30 天：候选人至少培养两名直属银牌成员；每名银牌成员的直属下线，在观察期最后 7 天内至少有 5 人分别在 3 个不同日期产生本人真实、可结算的聊天业务收入，即视为该银牌成员通过。系统不创建“经营小组”或额外虚拟关系。钻石、黑金待业务进入对应阶段后再启用。</p>
                  <button className="primary-btn top-gap" onClick={openUserGradeAdvancementDialog} disabled={loading}>建立高级等级验收记录</button>
                  {userGradeAdvancementReviews.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>用户</th><th>目标等级</th><th>考核开始日期</th><th>考核结束日期</th><th>升级进度</th><th>状态</th><th>高级操作</th></tr></thead><tbody>{userGradeAdvancementReviews.map((review) => {
                    const status = review.reviewStatus === 'IN_PROGRESS' ? '进行中' : review.reviewStatus === 'EXPIRED' ? '已过期' : review.reviewStatus === 'PASSED' ? (review.promotionConfirmedAt ? '已通过（已升级）' : '已通过') : '未通过'
                    return <tr key={review.id}><td>用户 {review.userId}<small className="table-subtle">{review.platformCode} / 公会 {review.guildId}</small></td><td>铂金</td><td>{review.observationStart}</td><td>{review.observationEnd}</td><td><button className="ghost-btn small-btn" onClick={() => setPlatinumObservationProgressTarget(review)} disabled={loading}>已达成 {review.passedSilverMemberCount} / ≥{review.requiredSilverMemberCount}</button></td><td>{status}</td><td><div className="action-row">{review.reviewStatus === 'PASSED' && !review.promotionConfirmedAt ? <button className="primary-btn small-btn" onClick={() => void confirmPlatinumUpgrade(review)} disabled={loading}>确认可升级</button> : null}{['IN_PROGRESS', 'EXPIRED'].includes(review.reviewStatus) ? <button className="ghost-btn small-btn" onClick={() => void failPlatinumObservation(review)} disabled={loading}>未通过</button> : null}{review.promotionConfirmedAt || review.reviewStatus === 'FAILED' ? '—' : null}</div></td></tr>
                  })}</tbody></table></div> : <EmptyState title="尚无铂金经营验收记录" description="建立记录后，系统立即开始 30 天观察，并按直邀关系和本地定稿收入自动计算。" />}
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

          {activeAdminSection === 'users' ? <LegacyUserDirectorySection
            query={userPlatformQuery}
            onQueryChange={setUserPlatformQuery}
            profiles={userPlatformProfiles}
            loading={loading}
            canManageCountry={canManageUserCountry}
            canManageLinkyInvitationGuild={canManageLinkyInvitationGuild}
            canManagePasswordLogin={canManageUserPasswordLogin}
            onRefresh={() => { void loadUserPlatformProfiles() }}
            onCopyInviteCode={(inviteCode) => { void handleCopyInviteCode(inviteCode) }}
            onAdjustCountry={openUserCountryDialog}
            onAdjustLinkyInvitationGuild={openLinkyInvitationGuildOverride}
            onPasswordLogin={openUserPasswordDialog}
          /> : null}

          {activeAdminSection === 'platformGuildDirectory' ? (
            <LegacyGuildDirectorySection
              platform={platformGuildDirectoryPlatform}
              directory={platformGuildDirectory}
              syncRuns={platformGuildDirectorySyncRuns}
              loading={platformGuildDirectoryLoading}
              onRefresh={() => void loadPlatformGuildDirectory()}
              onSelectPlatform={switchPlatformGuildDirectory}
            />
          ) : null}

          {isSystemConfigSection && canAuditPhoneVerification && currentSettingsView === 'smsWhitelist' ? (
            <PanelSection
              sectionId="admin-sms-daily-whitelist"
              eyebrow="SMS Daily Limit"
              title="白名单"
              description="仅最高管理员可维护。名单中的完整国际手机号不受每 UTC 日 5 次验证码申请上限限制；60 秒重发间隔、验证码有效期及短信通道开关均不变。"
              action={<button className="primary-btn" type="button" onClick={() => void loadSmsDailyWhitelist(smsDailyWhitelist?.page ?? 0)} disabled={loading}>{loading ? '刷新中…' : '刷新名单'}</button>}
            >
              <div className="stack-gap">
                <form className="grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void handleAddSmsDailyWhitelistNumber() }}>
                  <label>
                    添加手机号
                    <input type="tel" required value={smsDailyWhitelistPhone} onChange={(event) => setSmsDailyWhitelistPhone(event.target.value)} placeholder="例如 +852 9000 0001" autoComplete="off" />
                  </label>
                  <div className="action-row"><button className="primary-btn" type="submit" disabled={loading || !smsDailyWhitelistPhone.trim()}>加入白名单</button></div>
                </form>
                <InlineHint text="请填写包含国家／地区区号的完整手机号。添加或移除会留存后台操作日志；白名单不会让已关闭的创蓝短信通道自动开启。" />
                <DataTable
                  headers={['手机号', '添加时间', '操作人 ID', '操作']}
                  rows={(smsDailyWhitelist?.items ?? []).map((item) => [
                    item.phoneNumber,
                    formatUtcDateTime(item.createdAt),
                    item.createdBy,
                    <button type="button" className="ghost-btn small-btn" disabled={loading} onClick={() => void handleRemoveSmsDailyWhitelistNumber(item.id, item.phoneNumber)}>移除</button>,
                  ])}
                  emptyText={loading ? '正在加载短信白名单…' : '暂无白名单号码。'}
                />
                {smsDailyWhitelist ? <div className="admin-pagination">
                  <span className="admin-page-note" role="status">共 {smsDailyWhitelist.total} 个号码 · 当前第 {smsDailyWhitelist.page + 1} 页</span>
                  <div>
                    <button className="ghost-btn small-btn" type="button" disabled={loading || smsDailyWhitelist.page === 0} onClick={() => void loadSmsDailyWhitelist(smsDailyWhitelist.page - 1)}>上一页</button>
                    <button className="ghost-btn small-btn" type="button" disabled={loading || (smsDailyWhitelist.page + 1) * smsDailyWhitelist.size >= smsDailyWhitelist.total} onClick={() => void loadSmsDailyWhitelist(smsDailyWhitelist.page + 1)}>下一页</button>
                  </div>
                </div> : null}
              </div>
            </PanelSection>
          ) : null}

          {isSystemConfigSection && canAuditPhoneVerification && currentSettingsView === 'phoneVerification' ? (
            <PanelSection
              sectionId="admin-phone-verification"
              eyebrow="Restricted Access"
              title="验证码发送记录"
              description="进入页面会自动加载最近记录，包括短信通道提交失败的验证码。失败记录的验证码仍可由最高管理员审查，用于有效期内的人工协助登录；查询和显示均留有审计记录。"
              action={<button className="primary-btn" onClick={() => void loadPhoneVerificationCodes()} disabled={loading}>{loading ? '刷新中…' : '刷新记录'}</button>}
            >
              <div className="stack-gap">
                <InfoCard title="创蓝短信接口开关" tone={smsDeliveryStatus?.active ? 'success' : 'neutral'}>
                  <div className="relation-grid">
                    <RelationItem label="当前状态" value={smsDeliveryStatus?.active ? '已开启 · 创蓝发送' : '已关闭 · 不调用创蓝'} />
                    <RelationItem label="服务器配置" value={smsDeliveryStatus?.ready ? '已就绪' : '未配置或未启用'} />
                    <RelationItem label="最近调整" value={smsDeliveryStatus?.updatedBy ? `${formatUtcDateTime(smsDeliveryStatus.updatedAt ?? undefined)} · 管理员 ${smsDeliveryStatus.updatedBy}` : '尚无人工调整'} />
                  </div>
                  <InlineHint text="默认关闭；关闭时继续通过后台审查验证码。服务器配置创蓝凭据后可开启，开启后不再限制测试手机号名单；同一号码仍受发送频率限制，开关变更留存操作日志。" />
                  <div className="action-row top-gap">
                    <button type="button" className={smsDeliveryStatus?.active ? 'ghost-btn small-btn' : 'primary-btn'} onClick={() => void handleSmsDeliverySwitch()} disabled={loading || !smsDeliveryStatus || (!smsDeliveryStatus.ready && !smsDeliveryStatus.enabled)}>{smsDeliveryStatus?.enabled ? '关闭创蓝短信' : '开启创蓝短信'}</button>
                    <button type="button" className="ghost-btn small-btn" onClick={() => void loadSmsDeliveryStatus()} disabled={loading}>刷新开关状态</button>
                  </div>
                </InfoCard>
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
                  headers={['手机号', '用途', '验证码状态', '短信通道', '提交结果', '验证码', '尝试次数', '申请时间', '失效时间', '操作']}
                  rows={(phoneVerificationCodes?.items ?? []).map((item) => [
                    item.phoneNumber,
                    formatPhoneVerificationPurpose(item.purpose),
                    formatPhoneVerificationStatus(item.status),
                    item.deliveryChannel === 'CHUANGLAN' ? '创蓝' : item.deliveryChannel === 'INTERNAL' ? '内部审查' : '历史未记录',
                    item.deliveryStatus === 'FAILED' ? `提交失败${item.deliveryErrorCode ? ` · ${item.deliveryErrorCode}` : ''}` : item.deliveryStatus === 'ACCEPTED' ? (item.deliveryChannel === 'INTERNAL' ? '内部记录' : '通道已受理（非送达确认）') : item.deliveryStatus === 'PENDING' ? '提交中' : '历史未记录',
                    revealedPhoneVerificationCodes[item.id] ?? '已隐藏',
                    item.attempts,
                    formatDateTime(item.issuedAt),
                    formatDateTime(item.expiresAt),
                    <button className="ghost-btn small-btn" onClick={() => void handleRevealPhoneVerificationCode(item.id)} disabled={loading}>{revealedPhoneVerificationCodes[item.id] ? '已显示' : '显示验证码'}</button>,
                  ])}
                  emptyText={loading ? '正在加载验证码记录…' : '当前筛选条件下没有验证码记录。'}
                />
                {phoneVerificationCodes ? (
                  <div className="admin-pagination">
                    <span className="admin-page-note" role="status">共 {phoneVerificationCodes.total} 条记录 · 当前第 {phoneVerificationCodes.page + 1} 页 · 每页 {phoneVerificationCodes.size} 条</span>
                    <div>
                      <button className="ghost-btn small-btn" type="button" onClick={() => void handlePhoneVerificationPageChange(phoneVerificationCodes.page - 1)} disabled={loading || !hasPhoneVerificationPrevPage}>上一页</button>
                      <button className="ghost-btn small-btn" type="button" onClick={() => void handlePhoneVerificationPageChange(phoneVerificationCodes.page + 1)} disabled={loading || !hasPhoneVerificationNextPage}>下一页</button>
                    </div>
                  </div>
                ) : null}
                {phoneVerificationAuditLogs ? (
                  <InfoCard title="最近验证码查看审计" tone="neutral">
                    <DataTable headers={['时间', '操作', '角色', '操作人', '网络地址']} rows={phoneVerificationAuditLogs.items.map((item) => [formatDateTime(item.operatedAt), item.actionName, item.operatorRole, item.operatorId, item.requestIp || '-'])} emptyText="显示验证码后，这里会显示对应的审计记录。" />
                  </InfoCard>
                ) : null}
              </div>
            </PanelSection>
          ) : null}

          {activeAdminSection === 'overview' ? <LegacyOverviewSection
            roleLabel={formatAdminRole(adminSession.role)}
            productLabel={currentAdminProductLabel}
            overview={adminOverview}
            pendingWithdrawalCount={adminWithdrawRequests?.total ?? null}
            pendingRiskCount={riskEvents?.total ?? null}
            canViewRewards={canViewAdminSection('rewards')}
            canViewUsers={canViewAdminSection('users')}
            canViewChannel={canViewAdminSection('channel')}
            loading={loading}
            canLoad={canLoadAdmin}
            onRefresh={handleLoadAdminOverview}
            onLoadRiskEvents={() => { void handleLoadRiskEvents() }}
          /> : null}

          {activeAdminSection === 'channel' ? <LegacyChannelEntriesSection
            form={channelEntryForm}
            productLabel={currentAdminProductLabel}
            links={channelEntryLinks}
            onFormChange={setChannelEntryForm}
            onOpen={openExternalLandingPage}
            onCopy={(url) => { void copyPublicEntryLink(url) }}
          /> : null}

          {activeAdminSection === 'userAccounts' ? <LegacyUserAccountSection
            userId={accountSearchUserId}
            account={adminInvitationAccount}
            loading={loading}
            onUserIdChange={(value) => { setAccountSearchUserId(value); setAdminInvitationAccount(null) }}
            onQuery={(page) => { void loadAdminInvitationAccount(page) }}
          /> : null}

          {activeAdminSection === 'rewards' ? (
              <div className="admin-finance-workbench">
                <div className="admin-view-tabs" role="tablist" aria-label="收益与提现分类">
                  <button className={adminFinanceView === 'withdrawals' ? 'is-active' : ''} onClick={() => setAdminFinanceView('withdrawals')} role="tab" aria-selected={adminFinanceView === 'withdrawals'}>提现审核</button>
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
                  <LegacyRiskQueueSection
                    query={riskQuery} events={riskEvents} views={riskViews} selectedViewId={selectedRiskViewId}
                    viewName={riskViewName} selectedEventIds={selectedRiskEventIds} actionDrafts={riskActionDrafts}
                    actionLoadingId={riskActionLoadingId} batchResult={batchActionResult ? <BatchResultSummary result={batchActionResult} /> : null}
                    loading={loading} canLoadAdmin={canLoadAdmin} pageLabel={riskPageLabel}
                    hasPrevPage={hasRiskPrevPage} hasNextPage={hasRiskNextPage} renderStatus={renderStatusBadge}
                    onQueryChange={setRiskQuery} onQuery={() => { void handleLoadRiskEvents() }}
                    onReset={() => { setRiskQuery({ userId: '', riskStatus: 'PENDING', startAt: '', endAt: '', page: '0', size: '10' }); setRiskEvents(null); setHasQueriedRiskEvents(false) }}
                    onApplyView={applyRiskView} onViewNameChange={setRiskViewName} onSaveView={saveRiskView} onRemoveView={removeRiskView}
                    onSelectEventIds={setSelectedRiskEventIds}
                    onBatchAction={(action, targetIds) => { setBatchActionResult(null); setPendingBatchAction({ kind: 'risk', action, targetIds }) }}
                    onDraftChange={updateRiskActionDraft} onAction={openRiskActionConfirm} onPageChange={handleRiskPageChange}
                  />
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
          confirmText="保存并立即生效"
          loading={loading}
          confirmDisabled={!platformGuildShareForm.rate}
          onCancel={() => { setPlatformGuildShareDialogTarget(null); setPlatformGuildShareRules([]) }}
          onConfirm={() => void savePlatformGuildOperatingShareRate()}
        >
          <p>平台：{platformGuildShareDialogTarget.platformCode}；权威公会：{platformGuildShareDialogTarget.guildId}。保存后立即用于后续收入事实和邀请分成计算，并记录操作人及前后版本。</p>
          <form className="grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void savePlatformGuildOperatingShareRate() }}>
            <label>公司分成比例（%）<input required type="number" min="0" max="100" step="0.01" inputMode="decimal" value={platformGuildShareForm.rate} onChange={(event) => setPlatformGuildShareForm({ ...platformGuildShareForm, rate: event.target.value })} placeholder="例如 25 表示 25%" /></label>
          </form>
          <div className="stack-gap small"><strong>版本历史</strong>{platformGuildShareRules.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>版本</th><th>比例</th><th>生效区间</th><th>状态</th><th>操作记录</th></tr></thead><tbody>{platformGuildShareRules.map((rule) => <tr key={rule.id}><td>V{rule.shareVersion}</td><td>{(rule.shareRate * 100).toFixed(2)}%</td><td>{formatUtcDateTime(rule.effectiveFrom)} {rule.effectiveTo ? `至 ${formatUtcDateTime(rule.effectiveTo)}` : '起长期有效'}</td><td>{rule.status === 'ACTIVE' ? '已生效' : rule.status === 'CANCELLED' ? '已取消' : '旧待审版本（不生效）'}</td><td>{rule.approvedAt ? `${formatUtcDateTime(rule.approvedAt)}${rule.approvalNote ? ` · ${rule.approvalNote}` : ''}` : rule.status === 'ACTIVE' ? '保存即生效' : '—'}</td></tr>)}</tbody></table></div> : <p>尚无历史版本。</p>}</div>
          <InlineHint text="每次保存都会立即启用新版本，并留下操作日志；此前产生的收入事实仍按发生时的比例快照计算，不会被后续修改重写。未生效的旧计划会保留记录并取消。" />
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
            <label>目标等级<select disabled value="PLATINUM" aria-label="当前唯一可选目标等级"><option value="PLATINUM">铂金</option></select></label>
            <label>平台<select value={userGradeAdvancementForm.platformCode} onChange={(event) => setUserGradeAdvancementForm({ ...userGradeAdvancementForm, platformCode: event.target.value })}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
            <label>权威公会 ID<input required value={userGradeAdvancementForm.guildId} onChange={(event) => setUserGradeAdvancementForm({ ...userGradeAdvancementForm, guildId: event.target.value })} placeholder="例如：22000448" /></label>
          </form>
          <InlineHint text="仅已达标金牌用户可建立记录。保存后立即开始 30 天观察，系统自动计算至少两名直属银牌成员的下属达标情况；不需要录入经营小组或手工培养证据。" />
        </ConfirmDialog>
      ) : null}

      {platinumObservationProgressTarget ? (
        <ConfirmDialog title={`铂金升级进度 · 用户 ${platinumObservationProgressTarget.userId}`} tone="primary" confirmText="关闭" loading={false} onCancel={() => setPlatinumObservationProgressTarget(null)} onConfirm={() => setPlatinumObservationProgressTarget(null)}>
          <div className="relation-grid"><RelationItem label="观察周期" value={`${platinumObservationProgressTarget.observationStart} 至 ${platinumObservationProgressTarget.observationEnd}`} /><RelationItem label="已达标银牌成员" value={`${platinumObservationProgressTarget.passedSilverMemberCount} / 至少 ${platinumObservationProgressTarget.requiredSilverMemberCount}`} /></div>
          {platinumObservationProgressTarget.progress.length ? <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>银牌成员</th><th>计算窗口</th><th>直属下线达标人数</th><th>结果</th></tr></thead><tbody>{platinumObservationProgressTarget.progress.map((item) => <tr key={item.silverUserId}><td>用户 {item.silverUserId}</td><td>{item.windowStart} 至 {item.windowEnd}</td><td>{item.effectiveDirectInviteeCount} / 5</td><td>{item.passed ? '已达标' : '进行中 / 未达标'}</td></tr>)}</tbody></table></div> : <EmptyState title="暂未识别直属银牌成员" description="系统仅计算候选人的直属银牌成员及其直属下线；不会创建或维护额外经营小组。" />}
          <InlineHint text="每个被计入的直属下线都必须在该 7 天窗口内至少 3 个不同日期产生本人真实、可结算的聊天业务收入。" />
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
          <InlineHint text="运营分红当前关闭；不读取或改写收入事实，更不会产生奖励、余额、提现或付款。" />
        </ConfirmDialog>
      ) : null}

      {isIncomeShadowReplayDialogOpen ? (
        <ConfirmDialog
          title="人工重新整理收入测算记录"
          tone="warning"
          confirmText="记录原因并重新整理"
          loading={loading}
          confirmDisabled={!incomeShadowReplayReason.trim()}
          onCancel={() => { setIsIncomeShadowReplayDialogOpen(false); setIncomeShadowReplayReason('') }}
          onConfirm={() => void handleReplayIncomeShadowLedger()}
        >
          <p>仅使用本系统已保留的最新 MCN 原始收入事实，重新整理所选平台与业务日的测算记录。不会请求 MCN，不会修改原始事实，也不会创建奖励、余额或付款。</p>
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
          <InlineHint text="保存复核结论不会改变 MCN 原始事实、绑定状态、候选测算或任何财务数据。" />
        </ConfirmDialog>
      ) : null}

      {userCountryDraft ? (
        <ConfirmDialog
          title={`调整用户归属国家 · 用户 #${userCountryDraft.userId}`}
          tone="success"
          confirmText="保存国家"
          loading={loading}
          confirmDisabled={!userCountryDraft.targetCountryCode || userCountryDraft.targetCountryCode === userCountryDraft.currentCountryCode}
          onCancel={() => setUserCountryDraft(null)}
          onConfirm={() => void saveUserCountry()}
        >
          <InfoRow label="当前归属国家" value={formatCountryNameZh(userCountryDraft.currentCountryCode)} />
          <label className="dialog-field">目标国家
            <select value={userCountryDraft.targetCountryCode} onChange={(event) => setUserCountryDraft({ ...userCountryDraft, targetCountryCode: event.target.value })}>
              <option value="">请选择目标国家</option>
              {phoneCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.names.zh}</option>)}
            </select>
          </label>
          <InlineHint text="仅调整用户当前归属国家和邀请关系中的国家标记，供后续业务规则使用；不会改动手机号、界面语言、邀请码、平台公会或既有收入与奖励记录。用户重新登录后，客户端才会显示新的国家。操作会留下修改前后和操作人的审计记录。" />
        </ConfirmDialog>
      ) : null}

      {userPasswordDraft ? (
        <ConfirmDialog
          title={`${userPasswordDraft.mode === 'disable' ? '关闭密码登录' : userPasswordDraft.alreadyEnabled ? '重设登录密码' : '开通密码登录'} · 用户 #${userPasswordDraft.userId}`}
          tone={userPasswordDraft.mode === 'disable' ? 'warning' : 'success'}
          confirmText={userPasswordDraft.mode === 'disable' ? '确认关闭' : userPasswordDraft.alreadyEnabled ? '保存新密码' : '保存并开通'}
          loading={loading}
          confirmDisabled={userPasswordDraft.mode === 'set' && (userPasswordDraft.password.length < 8 || userPasswordDraft.password !== userPasswordDraft.confirmPassword)}
          onCancel={() => setUserPasswordDraft(null)}
          onConfirm={() => void saveUserPasswordLogin()}
        >
          <InfoRow label="用户" value={`#${userPasswordDraft.userId}${userPasswordDraft.nickname ? ` · ${userPasswordDraft.nickname}` : ''}`} />
          <InfoRow label="已绑定手机" value={userPasswordDraft.phoneNumber} />
          {userPasswordDraft.mode === 'set' ? <>
            <label className="dialog-field">登录密码<input type="password" autoComplete="new-password" value={userPasswordDraft.password} onChange={(event) => setUserPasswordDraft({ ...userPasswordDraft, password: event.target.value })} /></label>
            <label className="dialog-field">确认密码<input type="password" autoComplete="new-password" value={userPasswordDraft.confirmPassword} onChange={(event) => setUserPasswordDraft({ ...userPasswordDraft, confirmPassword: event.target.value })} /></label>
            <InlineHint text="仅限已有用户。密码需 8–128 位且同时包含英文字母和数字；不会在列表或审计日志中显示。重设后该用户现有登录会话会退出。" />
          </> : <InlineHint text="关闭后该手机号不能再通过密码登录，该用户现有登录会话也会退出；手机号验证码登录仍可使用。" />}
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

function DiagnosticBanner({ eyebrow, title, description, tone }: { eyebrow: string; title: string; description: string; tone: 'success' | 'warning' | 'danger' }) {
  return (
    <div className={`diagnostic-banner tone-${tone}`}>
      <p className="panel-eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{description}</p>
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

function formatUtcDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`)
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


export { ConsoleApp }
