import { useEffect, useState } from 'react'
import { Alert, Button, Result, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import type { AdminSessionResponse } from '../admin/authApi'
import { getMyAdminSecurityEvents, type AdminSecurityEventResponse } from '../admin/accountSecurityApi'
import { formatDateTime } from '../shared/dateTime'
import { availableConsoleRoutes } from './navigation'

const { Text, Title } = Typography

const columns: ProColumns<AdminSecurityEventResponse>[] = [
  { title: '时间', dataIndex: 'occurredAt', width: 190, render: (_, item) => formatDateTime(item.occurredAt) },
  { title: '事件', dataIndex: 'eventType', width: 220 },
  { title: '结果', dataIndex: 'success', width: 100, render: (_, item) => <Tag color={item.success ? 'green' : 'red'}>{item.success ? '成功' : '失败'}</Tag> },
  { title: '网络地址', dataIndex: 'ipAddress', width: 160, render: (_, item) => item.ipAddress || '—' },
  { title: '说明', dataIndex: 'detail', render: (_, item) => item.detail || '—' },
]

export default function SecurityRecordsPage({ session }: { session: AdminSessionResponse }) {
  const permitted = availableConsoleRoutes(session.role).some((route) => route.key === 'securityRecords')
  const [events, setEvents] = useState<AdminSecurityEventResponse[]>([])
  const [loading, setLoading] = useState(permitted)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!permitted) return
    let active = true
    void getMyAdminSecurityEvents()
      .then((items) => { if (active) { setEvents(items); setError('') } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '安全记录加载失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [permitted, refresh])

  if (!permitted) return <Result status="403" title="当前账号无权查看安全记录" />

  return <>
    <Title level={3}>安全记录</Title>
    <Text type="secondary">仅显示当前管理员账号的最近安全事件，使用旧版后台相同的只读接口；不提供账号管理或权限修改。</Text>
    <div className="new-console-directory-actions">
      <Button onClick={() => { setLoading(true); setRefresh((value) => value + 1) }} loading={loading}>刷新</Button>
      <Button href="/admin#admin-security-records">打开旧版页面</Button>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <ProTable<AdminSecurityEventResponse>
      headerTitle="最近安全事件"
      rowKey="id"
      columns={columns}
      dataSource={events}
      loading={loading}
      search={false}
      options={false}
      pagination={false}
      scroll={{ x: 800 }}
      cardBordered
    />
  </>
}
