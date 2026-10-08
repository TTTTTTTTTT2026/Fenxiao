import { useEffect, useState } from 'react'
import { Alert, Button, Input, Result, Select, Space, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { getAdminRiskEvents, type AdminSessionResponse, type RiskEventListItem, type RiskEventListResponse } from '../api'
import { formatDateTime } from '../shared/dateTime'
import { statusPresentation } from '../shared/statusPresentation'
import { allowedConsolePlatforms, availableConsoleRoutes, type ConsolePlatform } from './navigation'

const { Text, Title } = Typography

const columns: ProColumns<RiskEventListItem>[] = [
  { title: '事件 ID', dataIndex: 'id', width: 110, render: (_, item) => `#${item.id}` },
  { title: '用户 ID', dataIndex: 'userId', width: 120, render: (_, item) => `#${item.userId}` },
  { title: '风险类型', dataIndex: 'riskType', width: 200 },
  { title: '等级', dataIndex: 'riskLevel', width: 100 },
  { title: '状态', dataIndex: 'riskStatus', width: 130, render: (_, item) => {
    const status = statusPresentation(item.riskStatus)
    return <Tag color={status.tone === 'success' ? 'green' : status.tone === 'danger' ? 'red' : status.tone === 'warning' ? 'orange' : 'default'}>{status.label}</Tag>
  } },
  { title: '发现时间', dataIndex: 'detectedAt', width: 180, render: (_, item) => formatDateTime(item.detectedAt) },
  { title: '处理时间', dataIndex: 'handledAt', width: 180, render: (_, item) => item.handledAt ? formatDateTime(item.handledAt) : '—' },
]

type Filters = { platform: ConsolePlatform; userId: number | undefined; riskStatus: string; page: number; size: number }

export default function RiskQueuePage({ session }: { session: AdminSessionResponse }) {
  const permitted = availableConsoleRoutes(session.role).some((route) => route.key === 'risk')
  const platforms = allowedConsolePlatforms(session.platformScope)
  const [filters, setFilters] = useState<Filters | null>(() => permitted && platforms[0] ? { platform: platforms[0], userId: undefined, riskStatus: 'PENDING', page: 0, size: 10 } : null)
  const [userIdDraft, setUserIdDraft] = useState('')
  const [result, setResult] = useState<RiskEventListResponse | null>(null)
  const [loading, setLoading] = useState(permitted && Boolean(platforms[0]))
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!filters) return
    let active = true
    void getAdminRiskEvents(session.sessionToken, {
      product: filters.platform,
      userId: filters.userId,
      riskStatus: filters.riskStatus || undefined,
      page: filters.page,
      size: filters.size,
    }).then((data) => { if (active) setResult(data) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '加载风险队列失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, refresh, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看风险队列" />
  if (!filters) return <Result status="403" title="当前账号没有可查看的产品范围" />

  function applyUserId() {
    const value = userIdDraft.trim()
    if (value && (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      setError('请输入有效的正整数用户 ID')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    setFilters((current) => current ? { ...current, userId: value ? Number(value) : undefined, page: 0 } : current)
  }

  function changeFilters(next: Partial<Filters>) {
    setError('')
    setLoading(true)
    setResult(null)
    setFilters((current) => current ? { ...current, ...next } : current)
  }

  return <>
    <Title level={3}>风险队列 · 只读</Title>
    <Text type="secondary">按当前产品范围查看风险事件。本页不提供处理、忽略、冻结或解冻操作；这些操作仍在旧版后台执行并由原服务端权限与审计保护。</Text>
    <div className="new-console-directory-actions">
      <Space wrap>
        <Select aria-label="风险队列产品选择" value={filters.platform} options={platforms.map((platform) => ({ value: platform, label: platform }))} onChange={(platform: ConsolePlatform) => changeFilters({ platform, page: 0 })} style={{ minWidth: 130 }} />
        <Input aria-label="风险队列用户 ID" placeholder="用户 ID" value={userIdDraft} onChange={(event) => setUserIdDraft(event.target.value)} onPressEnter={applyUserId} style={{ width: 160 }} />
        <Select aria-label="风险队列状态选择" value={filters.riskStatus} options={[{ value: 'PENDING', label: '待处理' }, { value: 'HANDLED', label: '已处理' }, { value: 'IGNORED', label: '已忽略' }, { value: '', label: '全部' }]} onChange={(riskStatus: string) => changeFilters({ riskStatus, page: 0 })} style={{ minWidth: 130 }} />
        <Button onClick={applyUserId}>查询</Button>
        <Button onClick={() => { setError(''); setLoading(true); setResult(null); setRefresh((value) => value + 1) }} loading={loading}>刷新</Button>
        <Button href="/admin#admin-risk-queue">打开旧版页面</Button>
      </Space>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <ProTable<RiskEventListItem>
      headerTitle="风险事件"
      rowKey="id"
      columns={columns}
      dataSource={result?.items ?? []}
      loading={loading}
      search={false}
      options={false}
      pagination={{ current: (result?.page ?? filters.page) + 1, pageSize: result?.size ?? filters.size, total: result?.total ?? 0, showSizeChanger: true, onChange: (page, size) => changeFilters({ page: page - 1, size }) }}
      scroll={{ x: 1050 }}
      cardBordered
    />
  </>
}
