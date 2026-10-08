import { useEffect, useState } from 'react'
import { Alert, Button, Result, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import type { AdminSessionResponse } from '../admin/authApi'
import { getAdminDeviceSessions, type AdminDeviceSessionResponse } from '../admin/accountSecurityApi'
import { formatDateTime } from '../shared/dateTime'
import { availableConsoleRoutes } from './navigation'

const { Text, Title } = Typography

const columns: ProColumns<AdminDeviceSessionResponse>[] = [
  { title: '设备会话', dataIndex: 'id', width: 120, render: (_, item) => <>{`#${item.id}`} {item.current ? <Tag color="green">当前设备</Tag> : null}</> },
  { title: '登录方式', dataIndex: 'rememberMe', width: 120, render: (_, item) => item.rememberMe ? '保持登录' : '普通会话' },
  { title: '登录时间', dataIndex: 'issuedAt', width: 190, render: (_, item) => formatDateTime(item.issuedAt) },
  { title: '最后活动', dataIndex: 'lastSeenAt', width: 190, render: (_, item) => formatDateTime(item.lastSeenAt) },
  { title: '有效期至', dataIndex: 'expiresAt', width: 190, render: (_, item) => formatDateTime(item.expiresAt) },
  { title: '网络地址', dataIndex: 'ipAddress', width: 150, render: (_, item) => item.ipAddress || '—' },
  { title: '设备信息', dataIndex: 'userAgent', ellipsis: true, render: (_, item) => item.userAgent || '—' },
]

export default function MySecurityPage({ session }: { session: AdminSessionResponse }) {
  const permitted = availableConsoleRoutes(session.role).some((route) => route.key === 'mySecurity')
  const [devices, setDevices] = useState<AdminDeviceSessionResponse[]>([])
  const [loading, setLoading] = useState(permitted)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!permitted) return
    let active = true
    void getAdminDeviceSessions()
      .then((items) => { if (active) { setDevices(items); setError('') } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '设备会话加载失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [permitted, refresh])

  if (!permitted) return <Result status="403" title="当前账号无权查看安全信息" />

  return <>
    <Title level={3}>我的安全</Title>
    <Text type="secondary">仅查看当前管理员账号的设备会话。修改密码、撤销设备与退出全部设备仍在旧版后台进行，继续受原服务端权限与审计保护。</Text>
    <div className="new-console-directory-actions">
      <Button onClick={() => { setLoading(true); setRefresh((value) => value + 1) }} loading={loading}>刷新</Button>
      <Button href="/admin#admin-my-security">打开旧版安全设置</Button>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <ProTable<AdminDeviceSessionResponse>
      headerTitle="我的设备会话"
      rowKey="id"
      columns={columns}
      dataSource={devices}
      loading={loading}
      search={false}
      options={false}
      pagination={false}
      scroll={{ x: 1100 }}
      cardBordered
    />
  </>
}
