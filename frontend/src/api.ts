export type CreateProfileRequest = {
  userId: number
  countryCode: string
  languageCode: string
  inviteCode?: string
}

export type ProfileResponse = {
  userId: number
  inviteCode: string
  countryCode: string
  languageCode: string
  accessToken: string
}

export type RegisterLinkyAccountRequest = {
  productCode: string
  linkyAccount: string
}

export type IssueInviteCodeRequest = {
  productCode: string
  whatsappNumber: string
  appAccount: string
}

export type InviteBindingResponse = {
  id: number
  productCode: string
  inviterUserId: number
  inviteCode: string
  whatsappNumber: string
  linkyAccount: string
  bindStatus: string
  submittedAt: string
}

export type LinkyAccountBindingResponse = {
  userId: number
  linkyAccount: string
  status: 'VERIFIED' | string
  verifiedAt: string | null
}

export type IssueInviteCodeResponse = {
  userId: number
  productCode: string
  whatsappNumber: string
  appAccount: string
  inviteCode: string
  countryCode: string
  languageCode: string
  accessToken: string
  issuedAt: string
}

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

export type AdminAccountResponse = {
  id: number; username: string; displayName: string; role: string; enabled: boolean
  platformScope: string; guildScope: string; regionScope: string; mustChangePassword: boolean
  lastLoginAt: string | null; passwordChangedAt: string | null; passwordExpiresAt: string | null; lockedUntil: string | null; activeSessions: number
}
export type AdminAccountCreatedResponse = { account: AdminAccountResponse; temporaryPassword: string }
export type McnIncomeControlledChangesResponse = {
  runId: string
  requestId: string
  httpStatus: number
  latencyMillis: number
  sourceStatus: string
  deliveryHash: string | null
  factCount: number
  newFactCount: number
  duplicateFactCount: number
  unmatchedFactCount: number
  hasMore: boolean
  nextCursor: string | null
  nextCursorHash: string | null
  cursorPersisted: boolean
  retryAfterSeconds: number | null
}
export type McnIncomeControlledReconciliationResponse = {
  runId: string
  requestId: string
  sourceStatus: string
  comparisonStatus: string
  mcnGroupCount: number
  banDeiraGroupCount: number
  mismatchGroupCount: number
  retryAfterSeconds: number | null
}
export type McnIncomeSyncStatusResponse = {
  continuousPullEnabled: boolean
  maxPagesPerRun: number
  platforms: Array<{
    platformCode: string
    checkpointStatus: string
    lastSuccessAt: string | null
    lastSnapshotAt: string | null
    lastWatermarkCompleteness: string | null
    nextAttemptAt: string | null
    lastErrorCode: string | null
    latestRunStatus: string | null
    latestRunAt: string | null
    latestReceivedCount: number
    latestNewCount: number
    latestDuplicateCount: number
    latestUnmatchedCount: number
    retryAfterSeconds: number | null
  }>
}
export type McnIncomeShadowLedgerSummaryResponse = {
  platformCode: string; businessDate: string; sourceFactCount: number; latestFactCount: number
  boundFinalCount: number; unmatchedCount: number; awaitingFinalityCount: number; voidedCount: number; latestRunId: string | null
}
export type McnIncomeDataQualityResponse = {
  platformCode: string; businessDate: string; latestFactCount: number; projectedFactCount: number
  boundFinalCount: number; unmatchedCount: number; awaitingFinalityCount: number; voidedCount: number
  bindingCoveragePercent: number; projectionStatus: 'NOT_REFRESHED' | 'COMPLETE' | 'INCOMPLETE' | string; latestRunId: string | null
}
export type McnIncomeDataQualityExceptionResponse = {
  sourceEventReference: string; businessDate: string; guildId: string | null; status: string; settlementStatus: string
  eventType: string; sourceRevision: string; sourceUpdatedAt: string; reviewStatus: 'PENDING' | 'ACKNOWLEDGED' | 'IGNORED' | string
  reviewNote: string | null; reviewedBy: number | null; reviewedAt: string | null
}
export type McnIncomeRewardCandidateSummaryResponse = {
  platformCode: string; businessDate: string; sourceFactCount: number; sourceReadyCount: number
  candidateCount: number; blockedCount: number; candidateAmount: number; amountUnit: string | null; latestRunId: string | null
}
export type McnIncomeRewardCandidateItemResponse = {
  sourceEventReference: string; businessDate: string; sourceUserId: number | null; recipientUserId: number | null
  rewardLevel: number; status: string; reason: string; baseAmount: number; candidateAmount: number | null; amountUnit: string
  invitationVersion: number | null; policyCode: string | null; ruleRate: number | null; calculationVersion: string
  sourceGuildId: string | null; companyShareRate: number | null; companyIncomeBaseAmount: number | null
}
export type McnIncomeRewardCandidateSampleResponse = {
  runId: string; platformCode: string; businessDate: string; requestedSize: number; availableCount: number
  candidateAvailableCount: number; blockedAvailableCount: number; items: McnIncomeRewardCandidateItemResponse[]
}
export type CommissionPolicyResponse = {
  id: number; policyCode: string; commissionType: 'INVITATION' | string; platformCode: string; countryCode: string
  maxRewardLevel: number; status: 'DRAFT' | 'ACTIVE' | 'RETIRED' | string; effectiveFrom: string; effectiveTo: string | null
  createdBy: number; approvedBy: number | null; approvedAt: string | null; approvalNote: string | null
  levels: Array<{ rewardLevel: number; enabled: boolean; rewardRate: number | null; freezeDays: number | null }>
}
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
export type OperatingDividendPolicyResponse = {
  id: number; policyCode: string; policyVersion: number; platformCode: string; countryCode: string; guildId: string | null
  requiredValidStarts: number; requiredWithdrawEligible: number; requiredActive7d: number; profitShareRate: number
  effectiveFrom: string; effectiveTo: string | null; status: 'DRAFT' | 'ACTIVE' | 'RETIRED' | string
  createdBy: number | null; approvedBy: number | null; approvedAt: string | null; approvalNote: string | null
}
export type OperatingDividendDashboardResponse = {
  activePolicyCount: number; qualificationCount: number; profitFactCount: number; shadowEntryCount: number
  policies: OperatingDividendPolicyResponse[]
  recentProfitFacts: Array<{ id: number; teamId: number; platformCode: string; periodStart: string; periodEnd: string; operatingProfitMinor: number; currencyCode: string; sourceSystem: string; sourceEventId: string; receivedAt: string }>
  recentShadowEntries: Array<{ id: number; teamId: number; leaderUserId: number; platformCode: string; policyId: number; shareRate: number; shareAmountMinor: number; currencyCode: string; ledgerStatus: string; triggeredAt: string }>
}
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
export type UserGradeRuleResponse = {
  id: number; ruleCode: string; ruleVersion: number; gradeCode: 'PROMOTER' | 'TEAM_LEADER' | string
  platformCode: string; countryCode: string; guildId: string | null; requiredDirectInviteCount: number; requiredDirectIncome: number
  effectiveFrom: string; effectiveTo: string | null; status: 'DRAFT' | 'ACTIVE' | 'RETIRED' | string
  createdBy: number | null; approvedBy: number | null; approvedAt: string | null; approvalNote: string | null
}
export type UserGradeEvaluationResponse = { userId: number; platformCode: string; guildId: string; gradeCode: string; ruleId: number; status: string; directInviteCount: number; currentActiveEffectiveInviteCount: number; directIncome: number; qualifiedAt: string | null; evaluatedAt: string }
export type UserGradeDashboardResponse = { activeRuleCount: number; qualifiedTeamLeaderCount: number; rules: UserGradeRuleResponse[]; recentEvaluations: UserGradeEvaluationResponse[] }
export type EffectiveUserQualificationResponse = {
  userId: number; platformCode: string; qualificationStatus: string
  firstIncomeAt: string | null; observationEndsAt: string | null; qualifyingIncomeDateCount: number; qualifyingIncomeDates: string
  latestIncomeAt: string | null; sourceEvidenceSnapshot: string | null; qualifiedAt: string | null; evidenceRevokedAt: string | null
  manualCorrectionReason: string | null; manualCorrectionNote: string | null; correctedBy: number | null; correctedAt: string | null; evaluatedAt: string
  qualificationWindowStart: string | null; qualificationWindowEnd: string | null
  currentActivityStatus: 'ACTIVE' | 'NOT_ACTIVE' | string
  currentActivityWindowStart: string | null; currentActivityWindowEnd: string | null
}
export type UserGradeLevelResponse = {
  id: number; levelCode: string; levelVersion: number; levelName: string; levelRank: number; requiredPoints: number
  grantsTeamLeader: boolean; effectiveFrom: string; effectiveTo: string | null; status: 'DRAFT' | 'ACTIVE' | 'RETIRED' | string
  createdBy: number | null; approvedBy: number | null; approvedAt: string | null; approvalNote: string | null
}
export type UserGradeLevelDashboardResponse = { activeLevelCount: number; activeTeamLeaderLevel: UserGradeLevelResponse | null; levels: UserGradeLevelResponse[] }
export type UserGradeAdvancementReviewResponse = {
  id: number; userId: number; platformCode: string; guildId: string; targetGradeCode: 'PLATINUM' | 'DIAMOND' | 'BLACK_GOLD' | string
  observationStart: string; observationEnd: string; eligibleSilverMemberCount: number; passedSilverMemberCount: number; requiredSilverMemberCount: number
  reviewStatus: 'IN_PROGRESS' | 'EXPIRED' | 'PASSED' | 'FAILED' | string; promotionConfirmedBy: number | null; promotionConfirmedAt: string | null
  promotionNote: string | null; failureNote: string | null; createdBy: number | null; createdAt: string; updatedAt: string
  progress: UserGradePlatinumObservationProgressResponse[]
}
export type UserGradePlatinumObservationProgressResponse = { silverUserId: number; windowStart: string; windowEnd: string; effectiveDirectInviteeCount: number; passed: boolean }
export type TokenPointConversionResponse = {
  id: number | null; platformCode: 'TIMO' | 'LINKY' | string; tokenUnit: string; pointsPerToken: number | null
  configured: boolean; updatedAt: string | null
}
export type TokenPointConversionDashboardResponse = { configuredConversionCount: number; conversions: TokenPointConversionResponse[] }
export type UserPointFactResponse = {
  platformCode: string; sourceEventId: string; sourceUserId: number | null; beneficiaryUserId: number | null
  invitationVersionNo: number | null; conversionId: number | null; tokenUnit: string; sourceAmount: number
  pointsPerToken: number | null; pointAmount: number | null; occurredAt: string; factStatus: string; decisionReason: string; projectedAt: string
}
export type UserPointBalanceResponse = { userId: number; totalPoints: number; accruedFactCount: number; latestIncomeAt: string | null; evaluatedAt: string }
export type UserPointDashboardResponse = {
  platformCode: string; accruedFactCount: number; blockedFactCount: number; revokedFactCount: number; accruedPointTotal: number
  topBalances: UserPointBalanceResponse[]; recentFacts: UserPointFactResponse[]
}
export type PlatformIntegrationResponse = {
  platformCode: string
  displayName: string
  primaryAccountIdentifier: string
  accountIdentifierNote: string
  mcnIntegrationStatus: string
  revenueIngestionMode: string
  rewardMode: string
  enabled: boolean
  targetGuilds: Array<{ countryCode: string; officialGuildId: string; officialGuildSid: string | null; guildName: string; enabled: boolean; authoritative: boolean; directoryStatus: string; guildStatus: string; operatingShareRate: number | null }>
}
export type PlatformGuildCompanyShareRuleResponse = {
  id: number; platformCode: string; guildId: string; shareVersion: number; shareRate: number
  effectiveFrom: string; effectiveTo: string | null; status: 'DRAFT' | 'ACTIVE' | string
  createdBy: number | null; approvedBy: number | null; approvedAt: string | null; approvalNote: string | null
}

export type PlatformGuildDirectoryItem = {
  platformCode: 'LINKY' | 'TIMO' | string
  guildId: string
  guildName: string
  guildStatus: string
  country: string | null
  directoryStatus: string
  mcnRecordUpdatedAt: string | null
  officialUpdatedAt: string | null
  lastSeenAt: string
  sourceVersion: string | null
  joinInstruction: string | null
  missingSince: string | null
  operatingShareRate: number | null
}

export type PlatformGuildDirectorySyncRun = {
  runId: string
  platformCode: 'LINKY' | 'TIMO' | string
  syncStatus: string
  snapshotComplete: boolean
  receivedCount: number
  upsertedCount: number
  missingCount: number
  sourceVersion: string | null
  startedAt: string
  completedAt: string | null
  errorCode: string | null
  errorMessage: string | null
}

export type PlatformBindingResponse = {
  id: number
  userId: number
  platformCode: string
  platformUserId: string
  status: 'SUBMITTED' | 'VERIFYING' | 'VERIFIED' | 'REJECTED' | 'UNBOUND' | string
  submittedAt: string
  officialGuildId: string | null
  officialJoinedAt: string | null
  rejectionCode: string | null
  rejectionReason: string | null
  version: number
}
export type PlatformVerificationRuntimeResponse = {
  source: 'MOCK' | 'MCN' | 'DISABLED' | string
  mockManagementEnabled: boolean
  explanation: string
}
export type PlatformVerificationMockResponse = {
  id: number
  platformCode: string
  platformUserId: string
  globallySeenBeforeSubmission: boolean
  joinedTargetGuild: boolean
  officialGuildId: string
  officialJoinedAt: string
  sourceReference: string | null
  enabled: boolean
}
export type AdminDeviceSessionResponse = { id: number; current: boolean; rememberMe: boolean; issuedAt: string; lastSeenAt: string; expiresAt: string; ipAddress: string | null; userAgent: string | null }
export type AdminSecurityEventResponse = { id: number; accountId: number | null; username: string | null; eventType: string; success: boolean; ipAddress: string | null; userAgent: string | null; detail: string | null; occurredAt: string }
export type DistributionHomeResponse = {
  userId: number
  inviteCode: string
  inviterUserId: number | null
  invitedUsers: number
  effectiveUsers: number
  totalReward: number
  frozenReward: number
  availableReward: number
  riskHoldReward: number
  directInvitedUsers: number
  secondLevelInvitedUsers: number
  thirdLevelInvitedUsers: number
  totalTeamUsers: number
  directEffectiveUsers: number
  secondLevelEffectiveUsers: number
  thirdLevelEffectiveUsers: number
  totalEffectiveUsers: number
  userGradeCode: string
}

export type TeamMemberItem = {
  userId: number
  inviteCode: string
  countryCode: string
  effectiveUser: boolean
  confirmedIncomeTotal: number
  lockStatus: string
  bindTime: string
}

export type TeamListResponse = {
  items: TeamMemberItem[]
  total: number
}

export type TeamWeeklyIncomeItem = {
  userId: number
  inviteCode: string
  effectiveUser: boolean
  currentWeekIncome: number
  previousWeekIncome: number
}

export type TeamWeeklyIncomeResponse = {
  userId: number
  currentWeek: string
  previousWeek: string
  currentWeekTeamIncome: number
  previousWeekTeamIncome: number
  items: TeamWeeklyIncomeItem[]
}

export type RewardListItem = {
  beneficiaryUserId: number
  sourceUserId: number
  rewardLevel: number
  rewardAmount: number
  rewardStatus: string
  calculatedAt: string
}

export type RewardListResponse = {
  items: RewardListItem[]
  total: number
  page: number
  size: number
}

export type RewardTierSummaryItem = {
  rewardLevel: number
  businessLevelLabel: string
  rewardCount: number
  rewardAmount: number
}

export type RewardSummaryResponse = {
  userId: number
  tiers: RewardTierSummaryItem[]
}

export type PhoneCodeResponse = {
  phoneNumber: string
  verificationCode?: string
  ttlMinutes: number
  resendCooldownSeconds?: number
}

export type PhoneVerificationCodeListItem = {
  id: number
  phoneNumber: string
  purpose: string
  status: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | string
  attempts: number
  consumed: boolean
  issuedAt: string
  expiresAt: string
  updatedAt: string
}

export type PhoneVerificationCodeListResponse = {
  items: PhoneVerificationCodeListItem[]
  total: number
  page: number
  size: number
}

export type PhoneVerificationCodeRevealResponse = {
  id: number
  verificationCode: string
  status: string
  expiresAt: string
}

export type SeedInviterResponse = {
  userId: number
  phoneNumber: string
  countryCode: string
  languageCode: string
  inviteCode: string
}

export type SeedInviterListItem = SeedInviterResponse & {
  accountStatus: string
  userStatus: string
  effectiveUser: boolean
  directInviteeCount: number
  createdAt: string
  createdBy: number
  createdByRole: string
}

export type SeedInviterListResponse = {
  items: SeedInviterListItem[]
  total: number
  page: number
  size: number
}

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
  inviteCode: string
  countryCode: string
  phoneNumber: string | null
  registeredAt: string
  directInviterUserId: number | null
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

export type PhoneLoginRequest = {
  phoneNumber: string
  verificationCode: string
  inviteCode?: string
  countryCode?: string
  languageCode?: string
}

export type RiskEventListItem = {
  id: number
  userId: number
  riskType: string
  riskLevel: number
  riskStatus: string
  detailJson: string
  detectedAt: string
  handledBy: number | null
  handledAt: string | null
  resultNote: string | null
}

export type RiskEventListResponse = {
  items: RiskEventListItem[]
  total: number
  page: number
  size: number
}

export type AuditLogListItem = {
  id: number
  moduleName: string
  targetType: string
  targetId: number
  actionName: string
  operatorRole: string
  operatorId: number
  requestIp: string | null
  remark: string | null
  operatedAt: string
}

export type AuditLogListResponse = {
  items: AuditLogListItem[]
  total: number
  page: number
  size: number
}

export type OverviewReportResponse = {
  invitedUsers: number
  effectiveUsers: number
  rewardTotal: number
  frozenRewardTotal: number
  availableRewardTotal: number
  riskEventCount: number
}

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

export type LinkyEligibilityCheckResponse = {
  linkyAccount: string
  guildId: string | null
  guildName: string | null
  guildCheckStatus: string
  registrationEligibility: string
  checkedAt: string | null
  remark: string | null
}

export type LinkyWebhookLogListItem = {
  id: number
  linkyOrderId: string | null
  sourceEventId: string | null
  userId: number | null
  incomeAmount: number | null
  currencyCode: string | null
  paidAt: string | null
  requestReceivedAt: string | null
  internalTokenStatus: string
  signatureStatus: string
  replayStatus: string
  replayRecordStatus: string
  replayHitCount: number | null
  requestStatus: string
  failureReason: string | null
}

export type LinkyWebhookLogListResponse = {
  items: LinkyWebhookLogListItem[]
  total: number
  page: number
  size: number
}

export type LinkyReplayRecordListItem = {
  id: number
  requestFingerprint: string
  linkyOrderId: string | null
  sourceEventId: string | null
  userId: number | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  hitCount: number
  latestRequestStatus: string
  latestFailureReason: string | null
}

export type LinkyReplayRecordListResponse = {
  items: LinkyReplayRecordListItem[]
  total: number
  page: number
  size: number
}

export type WithdrawRequestResponse = {
  requestNo: string
  userId: number
  requestedDiamondAmount: number
  requestStatus: string
  requestWeek: string
  requestedAt: string
}

export type AdminWithdrawRequestItem = {
  requestNo: string
  userId: number
  requestedDiamondAmount: number
  requestStatus: string
  requestWeek: string
  requestedAt: string
}

export type WithdrawHistoryListResponse = {
  items: WithdrawRequestResponse[]
  total: number
  page: number
  size: number
}

export type AdminWithdrawRequestListResponse = {
  items: AdminWithdrawRequestItem[]
  total: number
  page: number
  size: number
}

export type BatchOperationItem = {
  targetId: string
  success: boolean
  status: string
  message: string | null
}

export type BatchOperationResultResponse = {
  successCount: number
  failureCount: number
  items: BatchOperationItem[]
}

export type ExperimentDashboardResponse = {
  experimentCode: string
  status: string
  plannedSampleSize: number
  fixedDenominator: number
  active: number
  completed: number
  withdrawn: number
  primaryMetricCode: string
  convertedCount: number
  metricTotal: number
  observationEndsAt: string
}

export type GuildWeeklyReportResponse = {
  productCode: string
  guildId: string
  week: string
  registeredUsers: number
  incomeAmount: number
  rewardAmount: number
}

export type GuildConfigResponse = {
  id: number
  productCode: string
  inviterUserId: number | null
  guildId: string
  guildName: string
  guildInviteCode: string
  enabled: boolean
}

export type GuildConfigRequest = {
  productCode: string
  inviterUserId?: number | null
  guildId: string
  guildName: string
  guildInviteCode: string
  enabled?: boolean
}

export type LinkyBatchRefreshResponse = {
  successCount: number
  failureCount: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function extractErrorMessage(text: string, status: number): string {
  if (!text) {
    return `request failed: ${status}`
  }

  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string }
    if (parsed.message && parsed.message.trim()) return parsed.message
    if (parsed.error && parsed.error.trim()) return parsed.error
  } catch {
    // ignore non-json response
  }

  return text
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(extractErrorMessage(text, response.status))
  }

  if (response.status === 204) return undefined as T
  if (typeof response.text === 'function') {
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }
  return response.json() as Promise<T>
}

export function createProfile(profileCreateToken: string, payload: CreateProfileRequest) {
  return request<ProfileResponse>('/api/distribution/profiles', {
    method: 'POST',
    headers: {
      'X-Profile-Create-Token': profileCreateToken,
    },
    body: JSON.stringify(payload),
  })
}

export function registerLinkyAccount(userId: number, accessToken: string, payload: RegisterLinkyAccountRequest) {
  return request<InviteBindingResponse>(`/api/distribution/bindings/users/${userId}`, {
    method: 'POST',
    headers: {
      'X-Distribution-Token': accessToken,
    },
    body: JSON.stringify(payload),
  })
}

export function getVerifiedLinkyAccountBinding(userId: number, accessToken: string) {
  return request<LinkyAccountBindingResponse>(`/api/distribution/bindings/users/${userId}/linky`, {
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function submitPlatformBinding(userId: number, accessToken: string, payload: { platformCode: string; platformUserId: string }) {
  return request<PlatformBindingResponse>(`/api/distribution/platform-bindings/${userId}`, {
    method: 'POST',
    headers: { 'X-Distribution-Token': accessToken },
    body: JSON.stringify(payload),
  })
}

export function getPlatformBinding(userId: number, accessToken: string, platformCode: string) {
  return request<PlatformBindingResponse>(`/api/distribution/platform-bindings/${userId}/${encodeURIComponent(platformCode)}`, {
    headers: { 'X-Distribution-Token': accessToken },
  })
}

export function verifyPlatformBinding(userId: number, accessToken: string, platformCode: string) {
  return request<PlatformBindingResponse>(`/api/distribution/platform-bindings/${userId}/${encodeURIComponent(platformCode)}/verify`, {
    method: 'POST',
    headers: { 'X-Distribution-Token': accessToken },
  })
}

export function issueInviteCode(payload: IssueInviteCodeRequest) {
  return request<IssueInviteCodeResponse>('/api/distribution/invite-codes/issue', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function issuePhoneCode(phoneNumber: string) {
  return request<PhoneCodeResponse>('/api/distribution/auth/phone-codes', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  })
}

export function phoneLogin(payload: PhoneLoginRequest) {
  return request<ProfileResponse>('/api/distribution/auth/phone-login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logoutUserSession(accessToken: string) {
  return request<void>('/api/distribution/auth/session/logout', {
    method: 'POST',
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
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
export function runAdminIncomeControlledChanges(adminSessionToken: string, payload: { platformCode: string; cursor?: string | null; businessDateFrom: string; businessDateTo: string; pageSize: number; requestId?: string }) {
  return request<McnIncomeControlledChangesResponse>('/admin/income-facts/controlled-read-only/changes', {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}
export function runAdminIncomeControlledReconciliation(adminSessionToken: string, payload: { platformCode: string; businessDateFrom: string; businessDateTo: string; guildIds: string[] }) {
  return request<McnIncomeControlledReconciliationResponse>('/admin/income-facts/controlled-read-only/reconciliation', {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}
export function getAdminIncomeSyncStatus(adminSessionToken: string) {
  return request<McnIncomeSyncStatusResponse>('/admin/income-facts/sync-status', {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}
export function refreshAdminIncomeShadowLedger(adminSessionToken: string, payload: { platformCode: string; businessDate: string }) {
  return request<McnIncomeShadowLedgerSummaryResponse>('/admin/income-facts/shadow-ledger/refresh', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function replayAdminIncomeShadowLedger(adminSessionToken: string, payload: { platformCode: string; businessDate: string; reason: string }) {
  return request<McnIncomeShadowLedgerSummaryResponse>('/admin/income-facts/shadow-ledger/replay', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function getAdminIncomeShadowLedgerSummary(adminSessionToken: string, platformCode: string, businessDate: string) {
  return request<McnIncomeShadowLedgerSummaryResponse>(`/admin/income-facts/shadow-ledger/summary?platformCode=${encodeURIComponent(platformCode)}&businessDate=${encodeURIComponent(businessDate)}`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminIncomeDataQuality(adminSessionToken: string, platformCode: string, businessDate: string) {
  return request<McnIncomeDataQualityResponse>(`/admin/income-facts/shadow-ledger/quality?platformCode=${encodeURIComponent(platformCode)}&businessDate=${encodeURIComponent(businessDate)}`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminIncomeDataQualityExceptions(adminSessionToken: string, platformCode: string, businessDate: string) {
  return request<McnIncomeDataQualityExceptionResponse[]>(`/admin/income-facts/shadow-ledger/exceptions?platformCode=${encodeURIComponent(platformCode)}&businessDate=${encodeURIComponent(businessDate)}&limit=50`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function reviewAdminIncomeDataQualityException(adminSessionToken: string, platformCode: string, businessDate: string, payload: { sourceEventReference: string; sourceRevision: string; reviewStatus: 'ACKNOWLEDGED' | 'IGNORED'; reviewNote: string }) {
  return request<McnIncomeDataQualityExceptionResponse>(`/admin/income-facts/shadow-ledger/exceptions/review?platformCode=${encodeURIComponent(platformCode)}&businessDate=${encodeURIComponent(businessDate)}`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function refreshAdminIncomeRewardCandidates(adminSessionToken: string, payload: { platformCode: string; businessDate: string }) {
  return request<McnIncomeRewardCandidateSummaryResponse>('/admin/income-facts/reward-candidates/refresh', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function getAdminIncomeRewardCandidateSummary(adminSessionToken: string, platformCode: string, businessDate: string) {
  return request<McnIncomeRewardCandidateSummaryResponse>(`/admin/income-facts/reward-candidates/summary?platformCode=${encodeURIComponent(platformCode)}&businessDate=${encodeURIComponent(businessDate)}`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminIncomeRewardCandidateItems(adminSessionToken: string, platformCode: string, businessDate: string) {
  return request<McnIncomeRewardCandidateItemResponse[]>(`/admin/income-facts/reward-candidates/items?platformCode=${encodeURIComponent(platformCode)}&businessDate=${encodeURIComponent(businessDate)}&limit=50`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminIncomeRewardCandidateSample(adminSessionToken: string, runId: string, limit = 10) {
  return request<McnIncomeRewardCandidateSampleResponse>(`/admin/income-facts/reward-candidates/sample?runId=${encodeURIComponent(runId)}&limit=${limit}`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminCommissionPolicies(adminSessionToken: string) {
  return request<CommissionPolicyResponse[]>('/admin/commission-policies', { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function createAdminCommissionPolicy(adminSessionToken: string, payload: { platformCode: string; countryCode: string; maxRewardLevel: number; effectiveFrom: string; effectiveTo: string | null; levels: Array<{ rewardLevel: number; enabled: boolean; rewardRate: number | null; freezeDays: number | null }> }) {
  return request<CommissionPolicyResponse>('/admin/commission-policies', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function activateAdminCommissionPolicy(adminSessionToken: string, id: number, approvalNote: string) {
  return request<CommissionPolicyResponse>(`/admin/commission-policies/${id}/activate`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ approvalNote }) })
}
export function retireAdminCommissionPolicy(adminSessionToken: string, id: number) {
  return request<CommissionPolicyResponse>(`/admin/commission-policies/${id}/retire`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminMentorIncentiveDashboard(adminSessionToken: string) {
  return request<MentorIncentiveDashboardResponse>('/admin/incentives/mentor-dashboard', { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminMentorAssignedStudents(adminSessionToken: string, mentorUserId: number) {
  return request<MentorAssignedStudentResponse[]>(`/admin/incentives/mentors/${mentorUserId}/students`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function createAdminMentorIncentiveRule(adminSessionToken: string, payload: { milestoneCode: string; platformCode: string; countryCode: string; guildId: string | null; amountMinor: number; currencyCode: string; freezeDays: number; effectiveFrom: string; effectiveTo: string | null }) {
  return request<MentorIncentiveRuleResponse>('/admin/incentives/mentor-rules', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function createAdminMentorIncentiveRules(adminSessionToken: string, payload: { milestoneCode: string; platformCode: string; countryCode: string; guildIds: string[]; amountMinor: number; currencyCode: string; freezeDays: number; effectiveFrom: string; effectiveTo: string | null }) {
  return request<MentorIncentiveRuleResponse[]>('/admin/incentives/mentor-rules/batch', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function activateAdminMentorIncentiveRule(adminSessionToken: string, id: number, approvalNote: string) {
  return request<MentorIncentiveRuleResponse>(`/admin/incentives/mentor-rules/${id}/activate`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ approvalNote }) })
}
export function retireAdminMentorIncentiveRule(adminSessionToken: string, id: number) {
  return request<MentorIncentiveRuleResponse>(`/admin/incentives/mentor-rules/${id}/retire`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken } })
}
export function qualifyAdminMentor(adminSessionToken: string, userId: number, payload: { countryCode: string; languageCode: string; maxActiveStudents: number }) {
  return request<{ userId: number; status: string; maxActiveStudents: number }>(`/admin/identity/mentors/${userId}/qualification`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function assignAdminMentor(adminSessionToken: string, studentUserId: number, payload: { mentorUserId: number; reason: string }) {
  return request<{ userId: number; mentorUserId: number; status: string; version: number }>(`/admin/identity/users/${studentUserId}/mentor`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function getAdminOperatingDividendDashboard(adminSessionToken: string) {
  return request<OperatingDividendDashboardResponse>('/admin/incentives/operating-dividend-dashboard', { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminTeamManagementDashboard(adminSessionToken: string) {
  return request<TeamManagementDashboardResponse>('/admin/incentives/team-management-dashboard', { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminTeamMembers(adminSessionToken: string, teamId: number) {
  return request<TeamManagementMemberResponse[]>(`/admin/incentives/teams/${teamId}/members`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function saveAdminTeamOperatingProfitSharePermission(adminSessionToken: string, teamId: number, enabled: boolean) {
  return request<TeamManagementItemResponse>(`/admin/incentives/teams/${teamId}/operating-profit-share-permission`, { method: 'PUT', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ enabled }) })
}
export function createAdminOperatingDividendPolicy(adminSessionToken: string, payload: { platformCode: string; countryCode: string; guildId: string | null; requiredValidStarts: number; requiredWithdrawEligible: number; requiredActive7d: number; profitShareRate: number; effectiveFrom: string; effectiveTo: string | null }) {
  return request<OperatingDividendPolicyResponse>('/admin/incentives/operating-dividend-policies', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function createAdminOperatingDividendPolicies(adminSessionToken: string, payload: { platformCode: string; countryCode: string; guildIds: string[]; requiredValidStarts: number; requiredWithdrawEligible: number; requiredActive7d: number; profitShareRate: number; effectiveFrom: string; effectiveTo: string | null }) {
  return request<OperatingDividendPolicyResponse[]>('/admin/incentives/operating-dividend-policies/batch', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) })
}
export function activateAdminOperatingDividendPolicy(adminSessionToken: string, id: number, approvalNote: string) {
  return request<OperatingDividendPolicyResponse>(`/admin/incentives/operating-dividend-policies/${id}/activate`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ approvalNote }) })
}
export function retireAdminOperatingDividendPolicy(adminSessionToken: string, id: number) {
  return request<OperatingDividendPolicyResponse>(`/admin/incentives/operating-dividend-policies/${id}/retire`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken } })
}
export function getAdminUserGradeDashboard(adminSessionToken: string) { return request<UserGradeDashboardResponse>('/admin/incentives/user-grade-dashboard', { headers: { 'X-Admin-Session': adminSessionToken } }) }
export function getAdminUserGradeLevelDashboard(adminSessionToken: string) { return request<UserGradeLevelDashboardResponse>('/admin/incentives/user-grade-levels/dashboard', { headers: { 'X-Admin-Session': adminSessionToken } }) }
export function createAdminUserGradeLevel(adminSessionToken: string, payload: { levelName: string; levelRank: number; requiredPoints: number; grantsTeamLeader: boolean; effectiveFrom: string; effectiveTo: string | null }) { return request<UserGradeLevelResponse>('/admin/incentives/user-grade-levels', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) }) }
export function activateAdminUserGradeLevel(adminSessionToken: string, id: number, approvalNote: string) { return request<UserGradeLevelResponse>(`/admin/incentives/user-grade-levels/${id}/activate`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ approvalNote }) }) }
export function retireAdminUserGradeLevel(adminSessionToken: string, id: number) { return request<UserGradeLevelResponse>(`/admin/incentives/user-grade-levels/${id}/retire`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken } }) }
export function getAdminTokenPointConversionDashboard(adminSessionToken: string) { return request<TokenPointConversionDashboardResponse>('/admin/incentives/token-point-conversions/dashboard', { headers: { 'X-Admin-Session': adminSessionToken } }) }
export function saveAdminTokenPointConversion(adminSessionToken: string, platformCode: string, payload: { platformCode: string; pointsPerToken: number }) { return request<TokenPointConversionResponse>(`/admin/incentives/token-point-conversions/${platformCode}`, { method: 'PUT', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) }) }
export function getAdminUserPointDashboard(adminSessionToken: string, platformCode: string, limit = 20) { return request<UserPointDashboardResponse>(`/admin/incentives/user-points/dashboard?platformCode=${encodeURIComponent(platformCode)}&limit=${limit}`, { headers: { 'X-Admin-Session': adminSessionToken } }) }
export function refreshAdminUserPoints(adminSessionToken: string, platformCode: string) { return request<{ platformCode: string; refreshedCount: number }>(`/admin/incentives/user-points/refresh?platformCode=${encodeURIComponent(platformCode)}`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken } }) }
export function createAdminUserGradeRule(adminSessionToken: string, payload: { gradeCode: string; platformCode: string; countryCode: string; guildId: string | null; requiredDirectInviteCount: number; requiredDirectIncome: number; effectiveFrom: string; effectiveTo: string | null }) { return request<UserGradeRuleResponse>('/admin/incentives/user-grade-rules', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) }) }
export function activateAdminUserGradeRule(adminSessionToken: string, id: number, approvalNote: string) { return request<UserGradeRuleResponse>(`/admin/incentives/user-grade-rules/${id}/activate`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ approvalNote }) }) }
export function retireAdminUserGradeRule(adminSessionToken: string, id: number) { return request<UserGradeRuleResponse>(`/admin/incentives/user-grade-rules/${id}/retire`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken } }) }
export function evaluateAdminUserGrade(adminSessionToken: string, userId: number, platformCode: string) { return request<UserGradeEvaluationResponse[]>('/admin/incentives/user-grades/evaluate', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ userId, platformCode }) }) }
export function getAdminEffectiveUserQualifications(adminSessionToken: string, platformCode: string, limit = 50) { return request<EffectiveUserQualificationResponse[]>(`/admin/incentives/effective-users?platformCode=${encodeURIComponent(platformCode)}&limit=${limit}`, { headers: { 'X-Admin-Session': adminSessionToken } }) }
export function refreshAdminEffectiveUserQualifications(adminSessionToken: string, platformCode: string) { return request<{ platformCode: string; refreshedCount: number }>(`/admin/incentives/effective-users/refresh?platformCode=${encodeURIComponent(platformCode)}`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken } }) }
export function excludeAdminEffectiveUserQualification(adminSessionToken: string, payload: { userId: number; platformCode: string; correctionReason: 'FRAUD' | 'FAKE_INCOME' | 'FABRICATED_PERFORMANCE'; correctionNote: string }) { return request<EffectiveUserQualificationResponse>('/admin/incentives/effective-users/manual-exclusions', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) }) }
export function getAdminUserGradeAdvancementReviews(adminSessionToken: string) { return request<UserGradeAdvancementReviewResponse[]>('/admin/incentives/user-grade-advancement-reviews', { headers: { 'X-Admin-Session': adminSessionToken } }) }
export function createAdminUserGradeAdvancementReview(adminSessionToken: string, payload: { userId: number; platformCode: string; guildId: string; targetGradeCode: string }) { return request<UserGradeAdvancementReviewResponse>('/admin/incentives/user-grade-advancement-reviews', { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload) }) }
export function confirmAdminUserGradeAdvancementUpgrade(adminSessionToken: string, id: number, note: string) { return request<UserGradeAdvancementReviewResponse>(`/admin/incentives/user-grade-advancement-reviews/${id}/confirm-upgrade`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ note }) }) }
export function failAdminUserGradeAdvancementReview(adminSessionToken: string, id: number, note: string) { return request<UserGradeAdvancementReviewResponse>(`/admin/incentives/user-grade-advancement-reviews/${id}/fail`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ note }) }) }
export function getAdminAccounts() { return request<AdminAccountResponse[]>('/admin/accounts') }
export function createAdminAccount(payload: { username: string; displayName: string; role: string; platformScope?: string; guildScope?: string; regionScope?: string }) { return request<AdminAccountCreatedResponse>('/admin/accounts', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateAdminAccount(id: number, payload: { displayName: string; role: string; enabled: boolean; platformScope?: string; guildScope?: string; regionScope?: string }) { return request<AdminAccountResponse>(`/admin/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function resetAdminPassword(id: number) { return request<AdminAccountCreatedResponse>(`/admin/accounts/${id}/reset-password`, { method: 'POST' }) }
export function unlockAdminAccount(id: number) { return request<AdminAccountResponse>(`/admin/accounts/${id}/unlock`, { method: 'POST' }) }
export function getAdminDeviceSessions() { return request<AdminDeviceSessionResponse[]>('/admin/accounts/me/sessions') }
export function revokeAdminDeviceSession(id: number) { return request<{ revoked: boolean }>(`/admin/accounts/me/sessions/${id}`, { method: 'DELETE' }) }
export function getMyAdminSecurityEvents() { return request<AdminSecurityEventResponse[]>('/admin/accounts/me/security-events') }

export function getDistributionHome(userId: number, accessToken: string) {
  return request<DistributionHomeResponse>(`/api/distribution/home/${userId}`, {
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function getDistributionTeam(userId: number, accessToken: string) {
  return request<TeamListResponse>(`/api/distribution/team/${userId}`, {
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function getDistributionTeamWeeklyIncome(userId: number, accessToken: string) {
  return request<TeamWeeklyIncomeResponse>(`/api/distribution/team/${userId}/weekly-income`, {
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function getDistributionRewards(userId: number, accessToken: string) {
  return request<RewardListResponse>(`/api/distribution/rewards/${userId}`, {
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function getDistributionRewardSummary(userId: number, accessToken: string) {
  return request<RewardSummaryResponse>(`/api/distribution/rewards/${userId}/summary`, {
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function createWithdrawRequest(userId: number, accessToken: string) {
  return request<WithdrawRequestResponse>(`/api/distribution/withdraw-requests/${userId}`, {
    method: 'POST',
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function getWithdrawHistory(userId: number, accessToken: string, filters?: {
  status?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<WithdrawHistoryListResponse>(`/api/distribution/withdraw-requests/${userId}${query ? `?${query}` : ''}`, {
    headers: {
      'X-Distribution-Token': accessToken,
    },
  })
}

export function getAdminOverview(adminSessionToken: string, product?: string) {
  const params = new URLSearchParams()
  if (product) params.set('product', product)
  const query = params.toString()
  return request<OverviewReportResponse>(`/admin/distribution/reports/overview${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function getAdminRewards(adminSessionToken: string, filters?: {
  beneficiaryUserId?: number
  status?: string
  product?: string
  startAt?: string
  endAt?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.beneficiaryUserId) params.set('beneficiaryUserId', String(filters.beneficiaryUserId))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.product) params.set('product', filters.product)
  if (filters?.startAt) params.set('startAt', filters.startAt)
  if (filters?.endAt) params.set('endAt', filters.endAt)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<RewardListResponse>(`/admin/distribution/rewards${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function getAdminRiskEvents(adminSessionToken: string, filters?: {
  userId?: number
  riskStatus?: string
  product?: string
  startAt?: string
  endAt?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userId) params.set('userId', String(filters.userId))
  if (filters?.riskStatus) params.set('riskStatus', filters.riskStatus)
  if (filters?.product) params.set('product', filters.product)
  if (filters?.startAt) params.set('startAt', filters.startAt)
  if (filters?.endAt) params.set('endAt', filters.endAt)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<RiskEventListResponse>(`/admin/distribution/risk-events${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function getAdminRelation(adminSessionToken: string, userId: number, product?: string) {
  const params = new URLSearchParams()
  if (product) params.set('product', product)
  const query = params.toString()
  return request<RelationDetailResponse>(`/admin/distribution/relation/${userId}${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
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
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
    body: JSON.stringify(payload),
  })
}

export function getAdminOwnership(adminSessionToken: string, userId: number) {
  return request<OwnershipDetailResponse>(`/admin/distribution/ownership/${userId}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function correctAdminOwnership(adminSessionToken: string, userId: number, payload: {
  productCode: string
  note?: string
}) {
  return request<OwnershipDetailResponse>(`/admin/distribution/ownership/${userId}/corrections`, {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
    body: JSON.stringify(payload),
  })
}

export function applyAdminRiskEventAction(adminSessionToken: string, riskEventId: number, payload: {
  action: 'HANDLE' | 'IGNORE' | 'FREEZE_USER' | 'UNFREEZE_USER'
  note?: string
}) {
  return request<RiskEventListItem>(`/admin/distribution/risk-events/${riskEventId}/actions`, {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
    body: JSON.stringify(payload),
  })
}

export function applyAdminRiskEventBatchAction(adminSessionToken: string, payload: {
  riskEventIds: number[]
  action: 'HANDLE' | 'IGNORE'
  note?: string
}) {
  return request<BatchOperationResultResponse>('/admin/distribution/risk-events/batch-actions', {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function getAdminAuditLogs(adminSessionToken: string, filters?: {
  moduleName?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.moduleName) params.set('moduleName', filters.moduleName)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<AuditLogListResponse>(`/admin/distribution/audit-logs${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function getAdminPhoneVerificationCodes(adminSessionToken: string, filters?: {
  phoneNumber?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.phoneNumber) params.set('phoneNumber', filters.phoneNumber)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<PhoneVerificationCodeListResponse>(`/admin/distribution/phone-verification-codes${query ? `?${query}` : ''}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function revealAdminPhoneVerificationCode(adminSessionToken: string, id: number) {
  return request<PhoneVerificationCodeRevealResponse>(`/admin/distribution/phone-verification-codes/${id}/reveal`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function createAdminSeedInviter(adminSessionToken: string, payload: {
  phoneNumber: string
  countryCode: string
  languageCode: string
}) {
  return request<SeedInviterResponse>('/admin/distribution/seed-inviters', {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function getAdminSeedInviters(adminSessionToken: string, filters?: { page?: number; size?: number }) {
  const params = new URLSearchParams()
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<SeedInviterListResponse>(`/admin/distribution/seed-inviters${query ? `?${query}` : ''}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
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

export function updateAdminLinkyInvitationGuild(adminSessionToken: string, userId: number, payload: {
  guildId: string
  guildName: string
  guildInviteCode?: string
  reason: string
}) {
  return request<UserPlatformProfileInvitationGuild>(`/admin/distribution/user-platform-profiles/${userId}/linky-invitation-guild`, {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function getAdminPlatformIntegrations(adminSessionToken: string) {
  return request<PlatformIntegrationResponse[]>('/admin/platform-integrations', {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function createAdminPlatformGuildOperatingShareRate(adminSessionToken: string, platformCode: string, guildId: string, operatingShareRate: number, effectiveFrom: string) {
  return request<PlatformGuildCompanyShareRuleResponse>(`/admin/platform-integrations/${encodeURIComponent(platformCode)}/guilds/${encodeURIComponent(guildId)}/operating-share-rate`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ operatingShareRate, effectiveFrom }),
  })
}
export function getAdminPlatformGuildCompanyShareRules(adminSessionToken: string, platformCode: string, guildId: string) {
  return request<PlatformGuildCompanyShareRuleResponse[]>(`/admin/platform-integrations/${encodeURIComponent(platformCode)}/guilds/${encodeURIComponent(guildId)}/operating-share-rules`, { headers: { 'X-Admin-Session': adminSessionToken } })
}
export function activateAdminPlatformGuildCompanyShareRule(adminSessionToken: string, id: number, approvalNote: string) {
  return request<PlatformGuildCompanyShareRuleResponse>(`/admin/platform-integrations/operating-share-rules/${id}/activate`, { method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ approvalNote }) })
}

export function getAdminPlatformGuildDirectory(adminSessionToken: string, platform: 'LINKY' | 'TIMO') {
  return request<PlatformGuildDirectoryItem[]>(`/admin/distribution/platform-guild-directory?platform=${platform}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function getAdminPlatformGuildDirectorySyncRuns(adminSessionToken: string, platform: 'LINKY' | 'TIMO') {
  return request<PlatformGuildDirectorySyncRun[]>(`/admin/distribution/platform-guild-directory/sync-runs?platform=${platform}`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function getAdminPlatformVerificationRuntime(adminSessionToken: string) {
  return request<PlatformVerificationRuntimeResponse>('/admin/platform-verification', {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function getAdminPlatformVerificationMocks(adminSessionToken: string) {
  return request<PlatformVerificationMockResponse[]>('/admin/platform-verification/mock-records', {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function saveAdminPlatformVerificationMock(adminSessionToken: string, payload: {
  platformCode: string
  platformUserId: string
  globallySeenBeforeSubmission: boolean
  joinedTargetGuild: boolean
  officialGuildId: string
  officialJoinedAt: string
  sourceReference?: string
  enabled: boolean
}) {
  return request<PlatformVerificationMockResponse>('/admin/platform-verification/mock-records', {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function getAdminPhoneVerificationCodeAudit(adminSessionToken: string, id: number) {
  return request<AuditLogListResponse>(`/admin/distribution/phone-verification-codes/${id}/audit`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function refreshAdminLinkyEligibility(adminSessionToken: string, linkyAccount: string) {
  return request<LinkyEligibilityCheckResponse>(`/admin/distribution/linky-eligibility-checks/${encodeURIComponent(linkyAccount)}/refresh`, {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function refreshAdminLinkyEligibilityBatch(adminSessionToken: string) {
  return request<LinkyBatchRefreshResponse>('/admin/distribution/linky-eligibility-checks/batch-refresh', {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function getAdminWithdrawRequests(adminSessionToken: string, filters?: {
  userId?: number
  status?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userId !== undefined) params.set('userId', String(filters.userId))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<AdminWithdrawRequestListResponse>(`/admin/distribution/withdraw-requests${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export type WithdrawAdminActionPayload = {
  operatorId?: number
  operatorRole?: string
  remark?: string
}

export function approveAdminWithdrawRequest(adminSessionToken: string, requestNo: string, payload: WithdrawAdminActionPayload) {
  return request<AdminWithdrawRequestItem>(`/admin/distribution/withdraw-requests/${encodeURIComponent(requestNo)}/approve`, {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
    body: JSON.stringify(payload),
  })
}

export function rejectAdminWithdrawRequest(adminSessionToken: string, requestNo: string, payload: WithdrawAdminActionPayload) {
  return request<AdminWithdrawRequestItem>(`/admin/distribution/withdraw-requests/${encodeURIComponent(requestNo)}/reject`, {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
    body: JSON.stringify(payload),
  })
}

export function applyAdminWithdrawBatchAction(adminSessionToken: string, payload: {
  requestNos: string[]
  action: 'APPROVE' | 'REJECT'
  remark?: string
}) {
  return request<BatchOperationResultResponse>('/admin/distribution/withdraw-requests/batch-actions', {
    method: 'POST',
    headers: { 'X-Admin-Session': adminSessionToken },
    body: JSON.stringify(payload),
  })
}

export function approveWithdrawForPayment(adminSessionToken: string, requestNo: string, remark: string) {
  return request<{ requestNo: string; status: string; amount: number }>(`/admin/distribution/withdrawal-workflow/${encodeURIComponent(requestNo)}/approve-for-payment`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ remark }),
  })
}

export function recordWithdrawPayment(adminSessionToken: string, requestNo: string, payload: { paymentChannel: string; paymentReference?: string; evidenceUri?: string; evidenceHash?: string; failureReason?: string }, success: boolean) {
  return request<{ requestNo: string; status: string; amount: number }>(`/admin/distribution/withdrawal-workflow/${encodeURIComponent(requestNo)}/${success ? 'payment-success' : 'payment-failure'}`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}

export function reverseWithdrawPayment(adminSessionToken: string, requestNo: string, payload: { reason: string; currencyCode: string }) {
  return request<{ requestNo: string; status: string; amount: number }>(`/admin/distribution/withdrawal-workflow/${encodeURIComponent(requestNo)}/reverse`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}

export function getExperimentDashboard(adminSessionToken: string, experimentCode: string) {
  return request<ExperimentDashboardResponse>(`/admin/experiments/${encodeURIComponent(experimentCode)}/dashboard`, {
    headers: { 'X-Admin-Session': adminSessionToken },
  })
}

export function createExperiment(adminSessionToken: string, payload: { experimentCode: string; experimentName: string; plannedSampleSize: number; primaryMetricCode: string; enrollmentStartsAt: string; enrollmentEndsAt: string; observationEndsAt: string }) {
  return request<{ experimentId: number }>('/admin/experiments', {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}

export function changeExperimentStatus(adminSessionToken: string, experimentCode: string, status: string, reason: string) {
  return request<{ experimentCode: string; status: string }>(`/admin/experiments/${encodeURIComponent(experimentCode)}/status`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify({ status, reason }),
  })
}

export function enrollExperimentParticipant(adminSessionToken: string, experimentCode: string, payload: { userId: number; cohortCode: string; eligibilitySnapshot: string }) {
  return request<{ participantId: number; enrollmentNo: number; denominator: number; capacity: number }>(`/admin/experiments/${encodeURIComponent(experimentCode)}/participants`, {
    method: 'POST', headers: { 'X-Admin-Session': adminSessionToken }, body: JSON.stringify(payload),
  })
}

export function getAdminGuildWeeklyReport(adminSessionToken: string, guildId: string, filters?: {
  product?: string
  week?: string
}) {
  const params = new URLSearchParams()
  if (filters?.product) params.set('product', filters.product)
  if (filters?.week) params.set('week', filters.week)
  const query = params.toString()
  return request<GuildWeeklyReportResponse>(`/admin/distribution/guild-configs/${encodeURIComponent(guildId)}/weekly-report${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function getAdminGuildConfigs(adminSessionToken: string) {
  return request<GuildConfigResponse[]>('/admin/distribution/guild-configs', {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function saveAdminGuildConfig(adminSessionToken: string, payload: GuildConfigRequest) {
  return request<GuildConfigResponse>('/admin/distribution/guild-configs', {
    method: 'POST',
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
    body: JSON.stringify(payload),
  })
}

export function getAdminLinkyWebhookLogs(adminSessionToken: string, filters?: {
  linkyOrderId?: string
  userId?: number
  requestStatus?: string
  product?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.linkyOrderId) params.set('linkyOrderId', filters.linkyOrderId)
  if (filters?.userId !== undefined) params.set('userId', String(filters.userId))
  if (filters?.requestStatus) params.set('requestStatus', filters.requestStatus)
  if (filters?.product) params.set('product', filters.product)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<LinkyWebhookLogListResponse>(`/admin/distribution/linky-webhook-logs${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}

export function getAdminLinkyReplayRecords(adminSessionToken: string, filters?: {
  linkyOrderId?: string
  userId?: number
  product?: string
  page?: number
  size?: number
}) {
  const params = new URLSearchParams()
  if (filters?.linkyOrderId) params.set('linkyOrderId', filters.linkyOrderId)
  if (filters?.userId !== undefined) params.set('userId', String(filters.userId))
  if (filters?.product) params.set('product', filters.product)
  if (filters?.page !== undefined) params.set('page', String(filters.page))
  if (filters?.size !== undefined) params.set('size', String(filters.size))
  const query = params.toString()
  return request<LinkyReplayRecordListResponse>(`/admin/distribution/linky-replay-records${query ? `?${query}` : ''}`, {
    headers: {
      'X-Admin-Session': adminSessionToken,
    },
  })
}
