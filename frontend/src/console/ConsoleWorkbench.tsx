import { lazy, Suspense } from 'react'
import { Alert, Button, Card, Result } from 'antd'
import { ProLayout } from '@ant-design/pro-components'
import type { AdminSessionResponse } from '../admin/authApi'
import { availableConsoleRoutes, selectedConsoleRoute } from './navigation'

const UserDirectoryPage = lazy(() => import('./UserDirectoryPage'))
const GuildDirectoryPage = lazy(() => import('./GuildDirectoryPage'))
const OverviewPage = lazy(() => import('./OverviewPage'))
const UserGradeRulesPage = lazy(() => import('./UserGradeRulesPage'))
const ChannelEntriesPage = lazy(() => import('./ChannelEntriesPage'))
const CommissionPolicyPage = lazy(() => import('./CommissionPolicyPage'))

type ConsoleWorkbenchProps = {
  session: AdminSessionResponse
  busy: boolean
  logoutError: string
  onLogout: () => void
}

export default function ConsoleWorkbench({ session, busy, logoutError, onLogout }: ConsoleWorkbenchProps) {
  const routes = availableConsoleRoutes(session.role)
  const selected = selectedConsoleRoute(window.location.pathname, session.role)

  return <div className="new-console-root">
    <ProLayout
      title="BANDEIRA 管理后台"
      logo="/bandeira-logo-v1.png"
      route={{ path: '/console', routes: routes.map((item) => ({ path: item.path, name: item.label })) }}
      location={{ pathname: selected?.path ?? window.location.pathname }}
      menuItemRender={(item, dom) => <a href={item.path}>{dom}</a>}
      actionsRender={() => [<Button key="legacy" href="/admin">旧版后台</Button>, <Button key="logout" onClick={onLogout} loading={busy}>退出登录</Button>]}
    >
      <div className="new-console-content">
        <div className="new-console-account-name">当前管理员：{session.displayName || session.username}</div>
        {logoutError ? <Alert type="error" showIcon message={logoutError} className="new-console-alert" /> : null}
        {selected ? <Suspense fallback={<Card loading />}>
          {selected.key === 'users' ? <UserDirectoryPage session={session} /> : selected.key === 'guilds' ? <GuildDirectoryPage session={session} /> : selected.key === 'overview' ? <OverviewPage session={session} /> : selected.key === 'grades' ? <UserGradeRulesPage session={session} /> : selected.key === 'channel' ? <ChannelEntriesPage session={session} /> : <CommissionPolicyPage session={session} />}
        </Suspense> : <Result status="403" title="当前账号无权访问此页面" extra={<Button href="/admin">返回旧版后台</Button>} />}
      </div>
    </ProLayout>
  </div>
}
