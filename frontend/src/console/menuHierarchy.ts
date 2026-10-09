import type { AdminSessionResponse } from '../admin/authApi'
import { ADMIN_SECTION_HASHES, getVisibleFinanceSections, type AdminSectionKey } from '../admin/navigation'
import { buildAdminSectionLinks } from '../opsConsole'
import { availableConsoleRoutesForSession, type ConsoleRoute } from './navigation'

export type ConsoleMenuEntry = {
  key: string
  label: string
  href: string
  legacy: boolean
}

export type ConsoleMenuGroup = {
  key: string
  label: string
  href: string
  entries: ConsoleMenuEntry[]
}

type MenuChild = { route: ConsoleRoute; label: string } | { legacySection: AdminSectionKey; label: string; visible?: (session: AdminSessionResponse) => boolean }
type MenuGroupDefinition = { key: string; legacySection: AdminSectionKey; children: MenuChild[] }

const highestAdmin = (session: AdminSessionResponse) => session.role.toLowerCase() === 'super_admin'
const controlledIncome = (session: AdminSessionResponse) => ['super_admin', 'finance'].includes(session.role.toLowerCase())
const financeSection = (section: AdminSectionKey) => (session: AdminSessionResponse) => getVisibleFinanceSections(session.role).includes(section)

// Keep the old first-level order and second-level names. A legacy link stays visible
// when its action-heavy page has not migrated, so read-only pages never imply parity.
const groups: MenuGroupDefinition[] = [
  { key: 'overview', legacySection: 'overview', children: [{ route: 'overview', label: '分销概览' }] },
  { key: 'channel', legacySection: 'channel', children: [{ route: 'channel', label: '渠道入口' }] },
  { key: 'users', legacySection: 'users', children: [
    { route: 'users', label: '用户列表' },
    { route: 'bindingRelation', label: '绑定管理' },
    { route: 'risk', label: '风险队列' },
    { legacySection: 'users', label: '用户列表 · 旧版操作' },
    { legacySection: 'bindings', label: '绑定管理 · 旧版操作' },
    { legacySection: 'riskQueue', label: '风险队列 · 旧版操作' },
  ] },
  { key: 'guilds', legacySection: 'platformGuildDirectory', children: [
    { route: 'guilds', label: '平台公会目录' },
    { legacySection: 'platformGuildDirectory', label: '公会目录 · 旧版操作' },
  ] },
  { key: 'finance', legacySection: 'rewards', children: [
    { legacySection: 'rewards', label: '收益提现', visible: financeSection('rewards') },
    { route: 'rewardLedger', label: '奖励记录 · 只读' },
    { route: 'userAccounts', label: '用户账户 · 只读' },
    { legacySection: 'userAccounts', label: '用户账户 · 旧版操作', visible: financeSection('userAccounts') },
    { route: 'commission', label: '邀请裂变分成 · 只读' },
    { legacySection: 'commissionPolicies', label: '邀请裂变分成 · 旧版操作', visible: financeSection('commissionPolicies') },
    { legacySection: 'tokenPointConversions', label: '代币积分兑换', visible: financeSection('tokenPointConversions') },
  ] },
  { key: 'mentors', legacySection: 'mentorDirectory', children: [
    { route: 'mentors', label: '导师列表 · 只读' },
    { legacySection: 'mentorDirectory', label: '导师列表 · 旧版操作' },
  ] },
  { key: 'teams', legacySection: 'teams', children: [
    { route: 'teams', label: '团队列表 · 只读' },
    { legacySection: 'teams', label: '团队列表 · 旧版操作' },
  ] },
  { key: 'grades', legacySection: 'userGradeList', children: [
    { route: 'grades', label: '用户等级列表 · 只读' },
    { route: 'gradeFacts', label: '等级资格事实 · 只读' },
    { legacySection: 'userGradeList', label: '用户等级列表 · 旧版操作' },
    { legacySection: 'advancedGradeAcceptance', label: '高阶经营验收' },
    { legacySection: 'userGradeFacts', label: '资格事实与复核' },
  ] },
  { key: 'management', legacySection: 'accounts', children: [
    { legacySection: 'accountManagement', label: '账号管理', visible: highestAdmin },
    { route: 'mySecurity', label: '我的安全 · 只读' },
    { route: 'securityRecords', label: '安全记录 · 只读' },
    { legacySection: 'mySecurity', label: '我的安全 · 旧版操作' },
    { legacySection: 'securityRecords', label: '安全记录 · 旧版操作' },
  ] },
  { key: 'config', legacySection: 'settings', children: [
    { legacySection: 'systemExperiment', label: '100 人实验' },
    { legacySection: 'systemGuilds', label: '公会配置' },
    { route: 'platformIntegrations', label: '平台接入 · 只读' },
    { legacySection: 'systemPlatforms', label: '平台接入 · 旧版操作' },
    { legacySection: 'systemIncomeControlled', label: '收入受控联调', visible: controlledIncome },
    { legacySection: 'systemIncomeShadow', label: '收入测算与核对', visible: controlledIncome },
    { legacySection: 'systemAdvanced', label: '高级接入' },
    { legacySection: 'systemSeedInviter', label: '种子邀请人', visible: highestAdmin },
    { legacySection: 'systemPhoneVerification', label: '验证码审查', visible: highestAdmin },
    { legacySection: 'systemSmsWhitelist', label: '白名单', visible: highestAdmin },
  ] },
]

export function buildConsoleMenuHierarchy(session: AdminSessionResponse): ConsoleMenuGroup[] {
  const legacyGroups = new Map(buildAdminSectionLinks(session.role).map((link) => [link.href, link.label]))
  const routes = new Map(availableConsoleRoutesForSession(session).map((route) => [route.key, route.path]))

  return groups.flatMap((group) => {
    const label = legacyGroups.get(ADMIN_SECTION_HASHES[group.legacySection])
    if (!label) return []
    const entries = group.children.flatMap((child): ConsoleMenuEntry[] => {
      if ('route' in child) {
        const path = routes.get(child.route)
        return path ? [{ key: child.route, label: child.label, href: path, legacy: false }] : []
      }
      if (child.visible && !child.visible(session)) return []
      return [{ key: child.legacySection, label: child.label, href: `/admin${ADMIN_SECTION_HASHES[child.legacySection]}`, legacy: true }]
    })
    if (!entries.length) return []
    return [{ key: group.key, label, href: entries.find((entry) => !entry.legacy)?.href ?? entries[0].href, entries }]
  })
}
