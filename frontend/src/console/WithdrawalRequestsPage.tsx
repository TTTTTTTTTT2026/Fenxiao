import { useEffect, useState } from 'react'
import { Alert, Button, Input, Result, Select, Space, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import type { AdminSessionResponse } from '../admin/authApi'
import { getAdminWithdrawRequests, type AdminWithdrawRequestItem, type AdminWithdrawRequestListResponse } from '../admin/financeReadApi'
import { formatDateTime } from '../shared/dateTime'
import { statusPresentation } from '../shared/statusPresentation'
import { canReadUnrestrictedAdminData } from './navigation'
import { parseAccountUserId } from './userAccountModel'

const statuses = ['PENDING_REVIEW', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAID_OUT', 'REJECTED', 'REVERSED']
const columns: ProColumns<AdminWithdrawRequestItem>[] = [
  { title: '申请单号', dataIndex: 'requestNo', width: 220 },
  { title: '用户 ID', dataIndex: 'userId', width: 120 },
  { title: '申请钻石', dataIndex: 'requestedDiamondAmount', width: 130 },
  { title: '状态', dataIndex: 'requestStatus', width: 130, render: (_, item) => {
    const status = statusPresentation(item.requestStatus)
    return <Tag color={status.tone === 'success' ? 'green' : status.tone === 'danger' ? 'red' : status.tone === 'warning' ? 'orange' : 'default'}>{status.label}</Tag>
  } },
  { title: '申请周', dataIndex: 'requestWeek', width: 150 },
  { title: '申请时间', dataIndex: 'requestedAt', width: 190, render: (_, item) => formatDateTime(item.requestedAt) },
]

type Filters = { userId?: number; status: string; page: number; size: number }

// The wrapper unmounts the query whenever session scope or identity changes.
export default function WithdrawalRequestsPage({ session }: { session: AdminSessionResponse }) {
  if (!canReadUnrestrictedAdminData(session)) return <Result status="403" title="当前账号无权查看全局提现申请" />
  return <WithdrawalQuery key={session.sessionToken} session={session} />
}

function WithdrawalQuery({ session }: { session: AdminSessionResponse }) {
  const [filters, setFilters] = useState<Filters>({ status: 'PENDING_REVIEW', page: 0, size: 20 })
  const [userIdDraft, setUserIdDraft] = useState('')
  const [result, setResult] = useState<AdminWithdrawRequestListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    void getAdminWithdrawRequests(session.sessionToken, { ...filters, status: filters.status || undefined })
      .then((data) => { if (active) { setResult(data); setError('') } })
      .catch((reason: unknown) => { if (active) { setResult(null); setError(reason instanceof Error ? reason.message : '提现申请加载失败') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, refresh, session.sessionToken])

  function changeFilters(next: Partial<Filters>) {
    setError('')
    setValidationError('')
    setResult(null)
    setLoading(true)
    setFilters((current) => ({ ...current, ...next }))
  }

  function applyUserId() {
    const value = userIdDraft.trim()
    const id = value ? parseAccountUserId(value) : undefined
    if (value && id === null) {
      setValidationError('请输入有效的正整数用户 ID')
      return
    }
    changeFilters({ userId: id ?? undefined, page: 0 })
  }

  return <>
    <Typography.Title level={3}>提现申请 · 只读</Typography.Title>
    <Typography.Text type="secondary">全局提现申请，仅向拥有全局范围的最高管理员开放。金额单位为钻石，申请周沿用原记录。</Typography.Text>
    <div className="new-console-directory-actions"><Space wrap>
      <Input aria-label="提现用户 ID" placeholder="用户 ID" inputMode="numeric" value={userIdDraft} onChange={(event) => setUserIdDraft(event.target.value)} onPressEnter={applyUserId} style={{ width: 170 }} />
      <Select aria-label="提现申请状态" value={filters.status} options={[{ value: '', label: '全部状态' }, ...statuses.map((value) => ({ value, label: statusPresentation(value).label }))]} onChange={(status: string) => changeFilters({ status, page: 0 })} style={{ minWidth: 140 }} />
      <Button onClick={applyUserId}>查询</Button>
      <Button onClick={() => { setUserIdDraft(''); changeFilters({ userId: undefined, status: 'PENDING_REVIEW', page: 0, size: 20 }) }}>重置</Button>
      <Button onClick={() => { setError(''); setResult(null); setLoading(true); setRefresh((value) => value + 1) }} loading={loading}>刷新</Button>
      <Button href="/admin#admin-rewards">打开旧版财务页面</Button>
    </Space></div>
    {validationError || error ? <Alert type="error" showIcon message={validationError || error} className="new-console-alert" /> : null}
    <ProTable<AdminWithdrawRequestItem>
      headerTitle="提现申请记录"
      rowKey="requestNo"
      columns={columns}
      dataSource={result?.items ?? []}
      loading={loading}
      locale={{ emptyText: '暂无提现申请' }}
      search={false}
      options={false}
      pagination={{ current: (result?.page ?? filters.page) + 1, pageSize: result?.size ?? filters.size, total: result?.total ?? 0, showSizeChanger: true, onChange: (page, size) => changeFilters({ page: size === filters.size ? page - 1 : 0, size }) }}
      scroll={{ x: 940 }}
      cardBordered
    />
  </>
}
