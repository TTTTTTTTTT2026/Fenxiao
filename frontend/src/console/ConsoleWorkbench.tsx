import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Alert, Button, Card, Layout, Result } from 'antd'
import type { AdminSessionResponse } from '../admin/authApi'
import { availableConsoleRoutesForSession, selectedConsoleRoute, type ConsoleRoute } from './navigation'
import { buildConsoleMenuHierarchy } from './menuHierarchy'

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
  const routes = availableConsoleRoutesForSession(session)
  const menuGroups = buildConsoleMenuHierarchy(session)
  const candidate = selectedConsoleRoute(window.location.pathname, session.role)
  const selected = candidate && routes.some((route) => route.key === candidate.key) ? candidate : null
  const activeGroup = menuGroups.find((group) => group.entries.some((entry) => entry.href === selected?.path))
  const Page = selected ? pages[selected.key] : null

  return <Layout className="new-console-root">
    <Layout.Header className="new-console-header">
      <a className="new-console-brand" href="/console/overview" aria-label="BANDEIRA 管理后台首页">
        <img src="/bandeira-logo-v1.png" alt="" />
        <span>BANDEIRA <small>管理后台</small></span>
      </a>
      <nav className="new-console-top-nav" aria-label="后台一级菜单">
        {menuGroups.map((group) => <a key={group.key} href={group.href} className={activeGroup?.key === group.key ? 'is-active' : ''} aria-current={activeGroup?.key === group.key ? 'page' : undefined}>{group.label}</a>)}
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
          {activeGroup?.entries.map((entry) => <a key={entry.key} href={entry.href} className={selected?.path === entry.href ? 'is-active' : ''} aria-current={selected?.path === entry.href ? 'page' : undefined}>
            <span>{entry.label}</span>{entry.legacy ? <span className="new-console-legacy-badge">旧版</span> : null}
          </a>)}
        </nav>
        <p className="new-console-sidebar-note">尚未迁移的操作会在旧版后台打开。</p>
      </aside>
      <main className="new-console-content" id="main-content">
        <div className="new-console-account-name">当前管理员：{session.displayName || session.username}</div>
        {logoutError ? <Alert type="error" showIcon message={logoutError} className="new-console-alert" /> : null}
        {Page ? <Suspense fallback={<Card loading />}>
          <Page session={session} />
        </Suspense> : <Result status="403" title="当前账号无权访问此页面" extra={<Button href="/admin">返回旧版后台</Button>} />}
      </main>
    </div>
  </Layout>
}
