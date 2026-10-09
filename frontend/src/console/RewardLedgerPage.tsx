import { useEffect, useState } from 'react'
import { Alert, Button, Input, Result, Select, Space, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import type { AdminSessionResponse } from '../admin/authApi'
import { getAdminRewards, type RewardListItem, type RewardListResponse } from '../admin/financeReadApi'
import { formatDateTime } from '../shared/dateTime'
import { statusPresentation } from '../shared/statusPresentation'
import { allowedConsolePlatforms, availableConsoleRoutes, type ConsolePlatform } from './navigation'
import { parseAccountUserId } from './userAccountModel'

const { Text, Title } = Typography

const columns: ProColumns<RewardListItem>[] = [
  { title: '受益用户', dataIndex: 'beneficiaryUserId', width: 130, render: (_, item) => `#${item.beneficiaryUserId}` },
  { title: '来源用户', dataIndex: 'sourceUserId', width: 130, render: (_, item) => `#${item.sourceUserId}` },
  { title: '层级', dataIndex: 'rewardLevel', width: 90 },
  { title: '奖励金额', dataIndex: 'rewardAmount', width: 130 },
  { title: '状态', dataIndex: 'rewardStatus', width: 130, render: (_, item) => {
    const status = statusPresentation(item.rewardStatus)
    return <Tag color={status.tone === 'success' ? 'green' : status.tone === 'danger' ? 'red' : status.tone === 'warning' ? 'orange' : 'default'}>{status.label}</Tag>
  } },
  { title: '计算时间', dataIndex: 'calculatedAt', width: 190, render: (_, item) => formatDateTime(item.calculatedAt) },
]

type Filters = { platform: ConsolePlatform; beneficiaryUserId?: number; status: string; page: number; size: number }

export default function RewardLedgerPage({ session }: { session: AdminSessionResponse }) {
  const permitted = availableConsoleRoutes(session.role).some((route) => route.key === 'rewardLedger')
  const platforms = allowedConsolePlatforms(session.platformScope)
  const [filters, setFilters] = useState<Filters | null>(() => permitted && platforms[0] ? { platform: platforms[0], status: '', page: 0, size: 20 } : null)
  const [userIdDraft, setUserIdDraft] = useState('')
  const [result, setResult] = useState<RewardListResponse | null>(null)
  const [loading, setLoading] = useState(Boolean(filters))
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!filters) return
    let active = true
    void getAdminRewards(session.sessionToken, {
      product: filters.platform,
      beneficiaryUserId: filters.beneficiaryUserId,
      status: filters.status || undefined,
      page: filters.page,
      size: filters.size,
    }).then((data) => { if (active) { setResult(data); setError('') } })
      .catch((reason: unknown) => { if (active) { setResult(null); setError(reason instanceof Error ? reason.message : '奖励记录加载失败') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, refresh, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看奖励记录" />
  if (!filters) return <Result status="403" title="当前账号没有可查看的产品范围" />

  function changeFilters(next: Partial<Filters>) {
    setError('')
    setResult(null)
    setLoading(true)
    setFilters((current) => current ? { ...current, ...next } : current)
  }

  function applyUserId() {
    const value = userIdDraft.trim()
    const id = value ? parseAccountUserId(value) : undefined
    if (value && id === null) {
      setError('请输入有效的正整数用户 ID')
      return
    }
    changeFilters({ beneficiaryUserId: id ?? undefined, page: 0 })
  }

  return <>
    <Title level={3}>奖励记录 · 只读</Title>
    <Text type="secondary">仅查询当前获授权产品的奖励流水，沿用旧版后台接口和服务端分页。本页不提供提现审核、打款或风险处置。</Text>
    <div className="new-console-directory-actions">
      <Space wrap>
        <Select aria-label="奖励记录产品选择" value={filters.platform} options={platforms.map((platform) => ({ value: platform, label: platform }))} onChange={(platform: ConsolePlatform) => changeFilters({ platform, page: 0 })} style={{ minWidth: 130 }} />
        <Input aria-label="受益用户 ID" placeholder="受益用户 ID" inputMode="numeric" value={userIdDraft} onChange={(event) => setUserIdDraft(event.target.value)} onPressEnter={applyUserId} style={{ width: 170 }} />
        <Select aria-label="奖励记录状态" value={filters.status} options={[{ value: '', label: '全部状态' }, { value: 'FROZEN', label: '冻结中' }, { value: 'AVAILABLE', label: '可用' }, { value: 'RISK_HOLD', label: '风险冻结' }]} onChange={(status: string) => changeFilters({ status, page: 0 })} style={{ minWidth: 140 }} />
        <Button onClick={applyUserId}>查询</Button>
        <Button onClick={() => { setError(''); setResult(null); setLoading(true); setRefresh((value) => value + 1) }} loading={loading}>刷新</Button>
        <Button href="/admin#admin-rewards">打开旧版财务页面</Button>
      </Space>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <ProTable<RewardListItem>
      headerTitle="奖励流水"
      rowKey={(item) => `${item.beneficiaryUserId}-${item.sourceUserId}-${item.rewardLevel}-${item.calculatedAt}`}
      columns={columns}
      dataSource={result?.items ?? []}
      loading={loading}
      search={false}
      options={false}
      pagination={{ current: (result?.page ?? filters.page) + 1, pageSize: result?.size ?? filters.size, total: result?.total ?? 0, showSizeChanger: true, onChange: (page, size) => changeFilters({ page: page - 1, size }) }}
      scroll={{ x: 850 }}
      cardBordered
    />
  </>
}
