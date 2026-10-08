import { lazy, Suspense, useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, ConfigProvider, Form, Input, Result, Typography } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import {
  createAdminSession,
  getCurrentAdminSession,
  logoutAdminSession,
  type AdminSessionResponse,
} from '../api'
import { availableConsoleRoutes } from './navigation'
import './console.css'

const { Text, Title } = Typography
const ConsoleWorkbench = lazy(() => import('./ConsoleWorkbench'))

type LoginForm = { username: string; password: string; rememberMe: boolean }

function ConsoleApp() {
  const [session, setSession] = useState<AdminSessionResponse | null>(null)
  const [restoring, setRestoring] = useState(true)
  const [busy, setBusy] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let cancelled = false
    void getCurrentAdminSession()
      .then((restored) => { if (!cancelled) setSession(restored) })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setRestoring(false) })
    return () => { cancelled = true }
  }, [])

  async function login(values: LoginForm) {
    setBusy(true)
    setAuthError('')
    try {
      setSession(await createAdminSession({ username: values.username.trim(), password: values.password, rememberMe: values.rememberMe }))
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '登录失败')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    try {
      await logoutAdminSession()
      setSession(null)
      setAuthError('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '退出失败')
    } finally {
      setBusy(false)
    }
  }

  if (restoring) return <div className="new-console-auth"><Card loading aria-label="正在恢复登录状态" /></div>

  if (!session) return <ConfigProvider locale={zhCN}><div className="new-console-auth"><Card className="new-console-login-card">
    <Title level={2}>BANDEIRA 管理后台</Title>
    <Text type="secondary">新版工作台 · 使用现有管理员账号登录</Text>
    {authError ? <Alert type="error" showIcon message={authError} className="new-console-alert" /> : null}
    <Form<LoginForm> layout="vertical" initialValues={{ rememberMe: true }} onFinish={(values) => void login(values)} className="new-console-login-form">
      <Form.Item name="username" label="后台账号" rules={[{ required: true, message: '请输入后台账号' }]}><Input autoComplete="username" /></Form.Item>
      <Form.Item name="password" label="登录密码" rules={[{ required: true, message: '请输入登录密码' }]}><Input.Password autoComplete="current-password" /></Form.Item>
      <Form.Item name="rememberMe" valuePropName="checked"><Checkbox>在本机保持登录</Checkbox></Form.Item>
      <Button type="primary" htmlType="submit" loading={busy} block>登录</Button>
    </Form>
    <a href="/admin">返回旧版后台</a>
  </Card></div></ConfigProvider>

  if (session.mustChangePassword) return <ConfigProvider locale={zhCN}><div className="new-console-auth"><Result status="warning" title="请先修改管理员密码" subTitle="当前账号需要先在旧版后台完成密码更新，再返回新版工作台。" extra={<Button type="primary" href="/admin">前往旧版后台</Button>} /></div></ConfigProvider>

  if (!availableConsoleRoutes(session.role).length) return <ConfigProvider locale={zhCN}><div className="new-console-auth"><Result status="403" title="当前账号暂无可用的新版页面" extra={<Button href="/admin">返回旧版后台</Button>} /></div></ConfigProvider>

  return <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#ed5a24', borderRadius: 10 } }}>
    <Suspense fallback={<div className="new-console-auth"><Card loading /></div>}>
      <ConsoleWorkbench session={session} busy={busy} logoutError={authError} onLogout={() => void logout()} />
    </Suspense>
  </ConfigProvider>
}

export default ConsoleApp
