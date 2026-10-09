import { buildAdminSectionLinks } from '../opsConsole'
import { AdminNavIcon } from './LegacyPresentation'
import { ADMIN_SECTION_HASHES, type AdminSectionKey } from './navigation'

export type LegacyNavGroup = 'users' | 'grades' | 'finance' | 'management' | 'config'

type Props = {
  links: ReturnType<typeof buildAdminSectionLinks>
  activeSection: AdminSectionKey
  visibleFinanceSections: AdminSectionKey[]
  role: string
  openGroups: Record<LegacyNavGroup, boolean>
  riskEventTotal: number
  canRunControlledIncome: boolean
  canManageSeedInviters: boolean
  canAuditPhoneVerification: boolean
  isFinanceManagementSection: boolean
  isSystemManagementSection: boolean
  isSystemConfigSection: boolean
  hostname: string
  onToggleGroup: (group: LegacyNavGroup) => void
  onNavigate: (section: AdminSectionKey) => void
}

export default function LegacyAdminNavigation({ links, activeSection, visibleFinanceSections, role, openGroups, riskEventTotal, canRunControlledIncome, canManageSeedInviters, canAuditPhoneVerification, isFinanceManagementSection, isSystemManagementSection, isSystemConfigSection, hostname, onToggleGroup, onNavigate }: Props) {
  return <aside className="admin-sidebar">
    <div className="admin-nav-strip" id="admin-modules" aria-label="后台模块导航">
      {links.map((item) => item.href === ADMIN_SECTION_HASHES.users ? (
        <div className="admin-nav-group" key={item.label}>
          <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${['users', 'bindings', 'riskQueue', 'highValueDay', 'highValueWeek', 'highValueMonth'].includes(activeSection) ? 'is-active' : ''}`} aria-expanded={openGroups.users} onClick={() => onToggleGroup('users')}>
            <AdminNavIcon label={item.label} />
            <span>{item.label}</span><span className="admin-nav-group-caret">{openGroups.users ? '⌄' : '›'}</span>
          </button>
          {openGroups.users ? <div className="admin-nav-submenu" aria-label="用户管理子菜单">
            <a className={`admin-nav-subitem ${activeSection === 'users' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.users} onClick={() => onNavigate('users')}>用户列表</a>
            {import.meta.env.DEV ? <>
              <a className={`admin-nav-subitem ${activeSection === 'highValueDay' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.highValueDay}>高价值用户排行 · 日</a>
              <a className={`admin-nav-subitem ${activeSection === 'highValueWeek' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.highValueWeek}>高价值用户排行 · 周</a>
              <a className={`admin-nav-subitem ${activeSection === 'highValueMonth' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.highValueMonth}>高价值用户排行 · 月</a>
            </> : null}
            <a className={`admin-nav-subitem ${activeSection === 'bindings' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.bindings}>绑定管理</a>
            <a className={`admin-nav-subitem ${activeSection === 'riskQueue' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.riskQueue} onClick={() => onNavigate('riskQueue')}>风险队列{riskEventTotal ? ` · ${riskEventTotal}` : ''}</a>
          </div> : null}
        </div>
      ) : item.href === ADMIN_SECTION_HASHES.userGradeList ? (
        <div className="admin-nav-group" key={item.label}>
          <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${['userGradeList', 'advancedGradeAcceptance', 'userGradeFacts'].includes(activeSection) ? 'is-active' : ''}`} aria-expanded={openGroups.grades} onClick={() => onToggleGroup('grades')}>
            <AdminNavIcon label={item.label} />
            <span>{item.label}</span><span className="admin-nav-group-caret">{openGroups.grades ? '⌄' : '›'}</span>
          </button>
          {openGroups.grades ? <div className="admin-nav-submenu" aria-label="用户等级子菜单">
            <a className={`admin-nav-subitem ${activeSection === 'userGradeList' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.userGradeList} onClick={() => onNavigate('userGradeList')}>用户等级列表</a>
            <a className={`admin-nav-subitem ${activeSection === 'advancedGradeAcceptance' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.advancedGradeAcceptance} onClick={() => onNavigate('advancedGradeAcceptance')}>高阶经营验收</a>
            <a className={`admin-nav-subitem ${activeSection === 'userGradeFacts' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.userGradeFacts} onClick={() => onNavigate('userGradeFacts')}>资格事实与复核</a>
          </div> : null}
        </div>
      ) : item.href === ADMIN_SECTION_HASHES.rewards ? (
        <div className="admin-nav-group" key={item.label}>
          <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${isFinanceManagementSection ? 'is-active' : ''}`} aria-expanded={openGroups.finance} onClick={() => onToggleGroup('finance')}>
            <AdminNavIcon label={item.label} />
            <span>{item.label}</span><span className="admin-nav-group-caret">{openGroups.finance ? '⌄' : '›'}</span>
          </button>
          {openGroups.finance ? <div className="admin-nav-submenu" aria-label="财务管理子菜单">
            {visibleFinanceSections.includes('rewards') ? <a className={`admin-nav-subitem ${activeSection === 'rewards' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.rewards}>收益提现</a> : null}
            {visibleFinanceSections.includes('userAccounts') ? <a className={`admin-nav-subitem ${activeSection === 'userAccounts' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.userAccounts}>用户账户</a> : null}
            {visibleFinanceSections.includes('commissionPolicies') ? <a className={`admin-nav-subitem ${activeSection === 'commissionPolicies' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.commissionPolicies} onClick={() => onNavigate('commissionPolicies')}>邀请裂变分成</a> : null}
            {visibleFinanceSections.includes('tokenPointConversions') ? <a className={`admin-nav-subitem ${activeSection === 'tokenPointConversions' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.tokenPointConversions} onClick={() => onNavigate('tokenPointConversions')}>代币积分兑换</a> : null}
          </div> : null}
        </div>
      ) : item.href === ADMIN_SECTION_HASHES.accounts ? (
        <div className="admin-nav-group" key={item.label}>
          <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${isSystemManagementSection ? 'is-active' : ''}`} aria-expanded={openGroups.management} onClick={() => onToggleGroup('management')}>
            <AdminNavIcon label={item.label} />
            <span>{item.label}</span><span className="admin-nav-group-caret">{openGroups.management ? '⌄' : '›'}</span>
          </button>
          {openGroups.management ? <div className="admin-nav-submenu" aria-label="系统管理子菜单">
            {role.toLowerCase() === 'super_admin' ? <a className={`admin-nav-subitem ${activeSection === 'accountManagement' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.accountManagement} onClick={() => onNavigate('accountManagement')}>账号管理</a> : null}
            <a className={`admin-nav-subitem ${activeSection === 'mySecurity' || activeSection === 'accounts' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.mySecurity} onClick={() => onNavigate('mySecurity')}>我的安全</a>
            <a className={`admin-nav-subitem ${activeSection === 'securityRecords' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.securityRecords} onClick={() => onNavigate('securityRecords')}>安全记录</a>
          </div> : null}
        </div>
      ) : item.href === ADMIN_SECTION_HASHES.settings ? (
        <div className="admin-nav-group" key={item.label}>
          <button type="button" className={`admin-nav-chip admin-nav-group-trigger ${isSystemConfigSection ? 'is-active' : ''}`} aria-expanded={openGroups.config} onClick={() => onToggleGroup('config')}>
            <AdminNavIcon label={item.label} />
            <span>{item.label}</span><span className="admin-nav-group-caret">{openGroups.config ? '⌄' : '›'}</span>
          </button>
          {openGroups.config ? <div className="admin-nav-submenu" aria-label="配置中心子菜单">
            <a className={`admin-nav-subitem ${activeSection === 'systemExperiment' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemExperiment}>100 人实验</a>
            <a className={`admin-nav-subitem ${activeSection === 'systemGuilds' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemGuilds}>公会配置</a>
            <a className={`admin-nav-subitem ${activeSection === 'systemPlatforms' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemPlatforms} onClick={() => onNavigate('systemPlatforms')}>平台接入</a>
            {canRunControlledIncome ? <><a className={`admin-nav-subitem ${activeSection === 'systemIncomeControlled' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemIncomeControlled}>收入受控联调</a><a className={`admin-nav-subitem ${activeSection === 'systemIncomeShadow' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemIncomeShadow}>收入测算与核对</a></> : null}
            <a className={`admin-nav-subitem ${activeSection === 'systemAdvanced' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemAdvanced}>高级接入</a>
            {canManageSeedInviters ? <a className={`admin-nav-subitem ${activeSection === 'systemSeedInviter' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemSeedInviter} onClick={() => onNavigate('systemSeedInviter')}>种子邀请人</a> : null}
            {canAuditPhoneVerification ? <a className={`admin-nav-subitem ${activeSection === 'systemPhoneVerification' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemPhoneVerification}>验证码审查</a> : null}
            {canAuditPhoneVerification ? <a className={`admin-nav-subitem ${activeSection === 'systemSmsWhitelist' ? 'is-active' : ''}`} href={ADMIN_SECTION_HASHES.systemSmsWhitelist}>白名单</a> : null}
          </div> : null}
        </div>
      ) : (
        <a key={item.label} className={`admin-nav-chip ${item.href === ADMIN_SECTION_HASHES[activeSection] ? 'is-active' : ''}`} href={item.href} aria-current={item.href === ADMIN_SECTION_HASHES[activeSection] ? 'page' : undefined} onClick={() => {
          const section = (Object.keys(ADMIN_SECTION_HASHES) as AdminSectionKey[]).find((key) => ADMIN_SECTION_HASHES[key] === item.href)
          if (section) onNavigate(section)
        }}>
          <AdminNavIcon label={item.label} />
          <span>{item.label}</span>
        </a>
      ))}
    </div>
    <div className="admin-environment"><span />{hostname === 'localhost' || hostname === '127.0.0.1' ? '本地环境' : '生产环境'}</div>
  </aside>
}
