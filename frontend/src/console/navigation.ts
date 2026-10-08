import type { AdminSessionResponse } from '../admin/authApi'
import { buildAdminSectionLinks } from '../opsConsole'
import { getVisibleFinanceSections } from '../admin/navigation'
import { canManageTeamsInAdmin, canReadFinanceInAdmin } from '../admin/roleCapabilities'

export type ConsoleRoute = 'users' | 'guilds' | 'overview' | 'grades' | 'mentors' | 'teams' | 'channel' | 'commission' | 'risk' | 'bindingRelation' | 'userAccounts' | 'rewardLedger' | 'mySecurity' | 'securityRecords'
export type ConsolePlatform = 'LINKY' | 'TIMO'

const routeDefinitions: Array<{ key: ConsoleRoute; path: string; label: string; legacyHref: string }> = [
  { key: 'users', path: '/console/users', label: '用户列表', legacyHref: '#admin-users' },
  { key: 'guilds', path: '/console/guilds', label: '平台公会目录', legacyHref: '#admin-platform-guild-directory' },
  { key: 'overview', path: '/console/overview', label: '分销概览', legacyHref: '#admin-overview' },
  { key: 'grades', path: '/console/grades', label: '用户等级列表', legacyHref: '#admin-user-grade-list' },
  { key: 'mentors', path: '/console/mentors', label: '导师列表', legacyHref: '#admin-mentors' },
  { key: 'teams', path: '/console/teams', label: '团队列表', legacyHref: '#admin-teams' },
  { key: 'channel', path: '/console/channel', label: '渠道入口', legacyHref: '#admin-channel-entries' },
  { key: 'commission', path: '/console/commission', label: '邀请裂变分成', legacyHref: '#admin-commission-policies' },
  { key: 'risk', path: '/console/risk', label: '风险队列（只读）', legacyHref: '#admin-users' },
  { key: 'bindingRelation', path: '/console/bindings', label: '邀请关系查询', legacyHref: '#admin-users' },
  { key: 'userAccounts', path: '/console/user-accounts', label: '用户账户', legacyHref: '#admin-user-accounts' },
  { key: 'rewardLedger', path: '/console/reward-ledger', label: '奖励记录', legacyHref: '#admin-rewards' },
  { key: 'mySecurity', path: '/console/my-security', label: '我的安全', legacyHref: '#admin-accounts' },
  { key: 'securityRecords', path: '/console/security-records', label: '安全记录', legacyHref: '#admin-accounts' },
]

export function availableConsoleRoutes(role: string) {
  const legacyLinks = new Set(buildAdminSectionLinks(role).map((item) => item.href))
  return routeDefinitions.filter((item) => (item.key === 'commission' ? getVisibleFinanceSections(role).includes('commissionPolicies') : item.key === 'userAccounts' ? getVisibleFinanceSections(role).includes('userAccounts') : item.key === 'rewardLedger' ? getVisibleFinanceSections(role).includes('rewards') : legacyLinks.has(item.legacyHref))
    && (!['grades', 'teams'].includes(item.key) || canManageTeamsInAdmin(role))
    && (!['commission', 'userAccounts'].includes(item.key) || canReadFinanceInAdmin(role)))
}

export function selectedConsoleRoute(pathname: string, role: string) {
  const available = availableConsoleRoutes(role)
  const path = pathname === '/console' || pathname === '/console/' ? available[0]?.path : pathname
  return available.find((item) => item.path === path) ?? null
}

export function allowedConsolePlatforms(scope: AdminSessionResponse['platformScope']): ConsolePlatform[] {
  if (!scope?.trim() || scope.trim() === '*') return ['LINKY', 'TIMO']
  const allowed = new Set(scope.split(',').map((item) => item.trim().toUpperCase()))
  return (['LINKY', 'TIMO'] as const).filter((platform) => allowed.has(platform))
}
