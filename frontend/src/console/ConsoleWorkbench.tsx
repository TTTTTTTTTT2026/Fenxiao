import { lazy, startTransition, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent, type MouseEvent } from 'react'
import { Alert, Button, Card, Layout, Result } from 'antd'
import type { AdminSessionResponse } from '../admin/authApi'
import { availableConsoleRoutesForSession, selectedConsoleRoute, type ConsoleRoute } from './navigation'
import { buildConsoleMenuHierarchy } from './menuHierarchy'
import { shouldNavigateWithinConsole } from './clientNavigation'
import ConsolePageBoundary from './ConsolePageBoundary'

const UserDirectoryPage = lazy(() => import('./UserDirectoryPage'))
const GuildDirectoryPage = lazy(() => import('./GuildDirectoryPage'))
const OverviewPage = lazy(() => import('./OverviewPage'))
const UserGradeRulesPage = lazy(() => import('./UserGradeRulesPage'))
const GradeFactsPage = lazy(() => import('./GradeFactsPage'))
const MentorDirectoryPage = lazy(() => import('./MentorDirectoryPage'))
const TeamDirectoryPage = lazy(() => import('./TeamDirectoryPage'))
const ChannelEntriesPage = lazy(() => import('./ChannelEntriesPage'))
const CommissionPolicyPage = lazy(() => import('./CommissionPolicyPage'))
const UserAccountPage = lazy(() => import('./UserAccountPage'))
const RiskQueuePage = lazy(() => import('./RiskQueuePage'))
const MySecurityPage = lazy(() => import('./MySecurityPage'))
const SecurityRecordsPage = lazy(() => import('./SecurityRecordsPage'))
const RewardLedgerPage = lazy(() => import('./RewardLedgerPage'))
const WithdrawalRequestsPage = lazy(() => import('./WithdrawalRequestsPage'))
const BindingRelationPage = lazy(() => import('./BindingRelationPage'))
const PlatformIntegrationPage = lazy(() => import('./PlatformIntegrationPage'))

const pages: Record<ConsoleRoute, LazyExoticComponent<ComponentType<{ session: AdminSessionResponse }>>> = {
  users: UserDirectoryPage,
  guilds: GuildDirectoryPage,
  overview: OverviewPage,
  grades: UserGradeRulesPage,
  gradeFacts: GradeFactsPage,
  mentors: MentorDirectoryPage,
  teams: TeamDirectoryPage,
  channel: ChannelEntriesPage,
  commission: CommissionPolicyPage,
  risk: RiskQueuePage,
  bindingRelation: BindingRelationPage,
  userAccounts: UserAccountPage,
  rewardLedger: RewardLedgerPage,
  withdrawals: WithdrawalRequestsPage,
  mySecurity: MySecurityPage,
  securityRecords: SecurityRecordsPage,
  platformIntegrations: PlatformIntegrationPage,
}

type ConsoleWorkbenchProps = {
  session: AdminSessionResponse
  busy: boolean
  logoutError: string
  onLogout: () => void
}

export default function ConsoleWorkbench({ session, busy, logoutError, onLogout }: ConsoleWorkbenchProps) {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const syncBrowserHistory = () => startTransition(() => setPathname(window.location.pathname))
    window.addEventListener('popstate', syncBrowserHistory)
    return () => window.removeEventListener('popstate', syncBrowserHistory)
  }, [])

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!shouldNavigateWithinConsole(event, href)) return
    event.preventDefault()
    if (window.location.pathname === href) return
    window.history.pushState(null, '', href)
    startTransition(() => setPathname(href))
    window.scrollTo(0, 0)
  }

  const routes = availableConsoleRoutesForSession(session)
  const menuGroups = buildConsoleMenuHierarchy(session)
  const candidate = selectedConsoleRoute(pathname, session.role)
  const selected = candidate && routes.some((route) => route.key === candidate.key) ? candidate : null
  const activeGroup = menuGroups.find((group) => group.entries.some((entry) => entry.href === selected?.path) || group.href === pathname)
  const legacyOnlyGroup = !selected && activeGroup?.href === pathname && pathname.startsWith('/console/section/')
  const Page = selected ? pages[selected.key] : null

  return <Layout className="new-console-root">
    <Layout.Header className="new-console-header">
      <a className="new-console-brand" href="/console/overview" onClick={(event) => navigate(event, '/console/overview')} aria-label="BANDEIRA 管理后台首页">
        <img src="/bandeira-logo-v1.png" alt="" />
        <span>BANDEIRA <small>管理后台</small></span>
      </a>
      <nav className="new-console-top-nav" aria-label="后台一级菜单">
        {menuGroups.map((group) => <a key={group.key} href={group.href} onClick={(event) => navigate(event, group.href)} className={activeGroup?.key === group.key ? 'is-active' : ''} aria-current={activeGroup?.key === group.key ? 'page' : undefined}>{group.label}</a>)}
      </nav>
      <div className="new-console-header-actions">
        <span className="new-console-header-user">{session.displayName || session.username}</span>
        <Button href="/admin" size="small">旧版后台</Button>
        <Button onClick={onLogout} loading={busy} size="small">退出</Button>
      </div>
    </Layout.Header>
    <div className="new-console-frame">
      <aside className="new-console-sidebar" aria-label="后台二级菜单">
        <div className="new-console-sidebar-heading">{activeGroup?.label ?? '工作台导航'}</div>
        <nav className="new-console-sub-nav">
          {activeGroup?.entries.map((entry) => <a key={entry.href} href={entry.href} onClick={(event) => navigate(event, entry.href)} className={selected?.path === entry.href ? 'is-active' : ''} aria-current={selected?.path === entry.href ? 'page' : undefined}>
            <span>{entry.label}</span>{entry.legacy ? <span className="new-console-legacy-badge">旧版</span> : null}
          </a>)}
        </nav>
        <p className="new-console-sidebar-note">尚未迁移的操作会在旧版后台打开。</p>
      </aside>
      <main className="new-console-content" id="main-content">
        <div className="new-console-account-name">当前管理员：{session.displayName || session.username}</div>
        {logoutError ? <Alert type="error" showIcon message={logoutError} className="new-console-alert" /> : null}
        {Page ? <ConsolePageBoundary key={pathname}><Suspense fallback={<Card loading />}>
          <Page session={session} />
        </Suspense></ConsolePageBoundary> : legacyOnlyGroup ? <Result status="info" title={`${activeGroup.label}尚在旧版后台`} subTitle="请从左侧二级菜单选择需要办理的功能；新版不会复制旧版写入逻辑。" /> : <Result status="403" title="当前账号无权访问此页面" extra={<Button href="/admin">返回旧版后台</Button>} />}
      </main>
    </div>
  </Layout>
}
