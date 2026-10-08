import type { AdminSessionResponse } from '../api'
import { buildAdminSectionLinks } from '../opsConsole'
import { getVisibleFinanceSections } from '../admin/navigation'
import { canManageTeamsInAdmin, canReadFinanceInAdmin } from '../admin/roleCapabilities'

export type ConsoleRoute = 'users' | 'guilds' | 'overview' | 'grades' | 'channel' | 'commission' | 'userAccounts'
export type ConsolePlatform = 'LINKY' | 'TIMO'

const routeDefinitions: Array<{ key: ConsoleRoute; path: string; label: string; legacyHref: string }> = [
  { key: 'users', path: '/console/users', label: '用户列表', legacyHref: '#admin-users' },
  { key: 'guilds', path: '/console/guilds', label: '平台公会目录', legacyHref: '#admin-platform-guild-directory' },
  { key: 'overview', path: '/console/overview', label: '分销概览', legacyHref: '#admin-overview' },
  { key: 'grades', path: '/console/grades', label: '用户等级列表', legacyHref: '#admin-user-grade-list' },
  { key: 'channel', path: '/console/channel', label: '渠道入口', legacyHref: '#admin-channel-entries' },
  { key: 'commission', path: '/console/commission', label: '邀请裂变分成', legacyHref: '#admin-commission-policies' },
  { key: 'userAccounts', path: '/console/user-accounts', label: '用户账户', legacyHref: '#admin-user-accounts' },
]

export function availableConsoleRoutes(role: string) {
  const legacyLinks = new Set(buildAdminSectionLinks(role).map((item) => item.href))
  return routeDefinitions.filter((item) => (item.key === 'commission' ? getVisibleFinanceSections(role).includes('commissionPolicies') : item.key === 'userAccounts' ? getVisibleFinanceSections(role).includes('userAccounts') : legacyLinks.has(item.legacyHref))
    && (item.key !== 'grades' || canManageTeamsInAdmin(role))
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
