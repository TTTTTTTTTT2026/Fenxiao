import { useRef, useState } from 'react'
import { Alert, Card, Descriptions, Empty, Input, Result, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { getAdminInvitationAccount, type AdminSessionResponse, type InvitationRewardAccountResponse } from '../api'
import { canReadFinanceInAdmin } from '../admin/roleCapabilities'
import { formatDateTime } from '../shared/dateTime'
import { formatMoney } from '../shared/legacyFormatting'
import { parseAccountUserId } from './userAccountModel'

const { Text, Title } = Typography
type AccountFlow = InvitationRewardAccountResponse['items'][number]

const columns: ProColumns<AccountFlow>[] = [
  { title: '记录时间（本机时区）', dataIndex: 'recordedAt', width: 190, renderText: (value: string) => formatDateTime(value) },
  { title: '类型 / 原因', key: 'type', width: 230, render: (_, item) => <><Text strong>{item.type}</Text><br /><Text type="secondary">{item.reason}</Text></> },
  { title: '平台 / 层级', key: 'platform', width: 130, render: (_, item) => `${item.platformCode} / ${item.rewardLevel}` },
  { title: '来源用户', dataIndex: 'sourceUserId', width: 110 },
  { title: '原始钻石', dataIndex: 'rawDiamonds', width: 110 },
  { title: '公司比例', dataIndex: 'companyShareRate', width: 110, renderText: (value: number) => `${(value * 100).toFixed(2)}%` },
  { title: '公司收入', dataIndex: 'companyIncomeDiamonds', width: 110 },
  { title: '邀请比例', dataIndex: 'invitationRate', width: 110, renderText: (value: number) => `${(value * 100).toFixed(2)}%` },
  { title: '邀请奖励钻石', dataIndex: 'rewardDiamonds', width: 130 },
  { title: '换算率', dataIndex: 'pointsPerDiamond', width: 100 },
  { title: '冻结变动', dataIndex: 'frozenDelta', width: 110 },
  { title: '已解冻变动', dataIndex: 'availableDelta', width: 120 },
  { title: '收入事实编号', dataIndex: 'sourceEventId', width: 180 },
]

export default function UserAccountPage({ session }: { session: AdminSessionResponse }) {
  const permitted = canReadFinanceInAdmin(session.role)
  const [userIdInput, setUserIdInput] = useState('')
  const [account, setAccount] = useState<InvitationRewardAccountResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestSequence = useRef(0)

  async function queryAccount(rawUserId: string, page: number) {
    if (!permitted) return
    const userId = parseAccountUserId(rawUserId)
    if (userId === null) {
      setAccount(null)
      setError('请输入有效的正整数用户 ID')
      return
    }
    const sequence = ++requestSequence.current
    setLoading(true)
    setError('')
    try {
      const result = await getAdminInvitationAccount(session.sessionToken, userId, page, 20)
      if (sequence === requestSequence.current) setAccount(result)
    } catch (reason) {
      if (sequence === requestSequence.current) {
        setAccount(null)
        setError(reason instanceof Error ? reason.message : '用户账户加载失败')
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }

  if (!permitted) return <Result status="403" title="当前账号无权查看用户账户" />

  return <>
    <Title level={3}>用户账户</Title>
    <Text type="secondary">按准确用户 ID 查询邀请奖励积分与流水；只读查询沿用现有后台接口并留存审计，不提供提现或付款操作。</Text>
    <div className="new-console-directory-actions">
      <Input.Search
        aria-label="用户 ID"
        inputMode="numeric"
        value={userIdInput}
        onChange={(event) => { requestSequence.current += 1; setUserIdInput(event.target.value); setAccount(null); setError(''); setLoading(false) }}
        onSearch={(value) => { void queryAccount(value, 0) }}
        enterButton="查询账户"
        placeholder="输入用户 ID 后查询"
        loading={loading}
        style={{ maxWidth: 380 }}
      />
      <a href="/admin#admin-user-accounts">打开旧版页面</a>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    {account ? <>
      <Card title={`用户 #${account.userId} · 邀请奖励账户`} className="new-console-directory-summary">
        <Descriptions column={{ xs: 1, sm: 2 }} items={[
          { key: 'frozen', label: '冻结中', children: `${formatMoney(account.frozenPoints)} 积分` },
          { key: 'available', label: '已解冻积分', children: `${formatMoney(account.availablePoints)} 积分` },
          { key: 'total', label: '账户净额', children: `${formatMoney(account.totalPoints)} 积分` },
          { key: 'income', label: '累计邀请奖励收入', children: `${formatMoney(account.cumulativeIncomePoints)} 积分` },
        ]} />
        <Text type="secondary">已解冻不代表当前可以提现。流水包含邀请奖励入账、MCN 修订冲正与到期解冻；Linky/Timo 原始钻石分开留痕。</Text>
      </Card>
      <ProTable<AccountFlow>
        headerTitle="账户流水"
        rowKey="id"
        columns={columns}
        dataSource={account.items}
        loading={loading}
        search={false}
        options={false}
        pagination={{ current: account.page + 1, pageSize: account.size, total: account.totalRecords, showSizeChanger: false, onChange: (page) => { void queryAccount(userIdInput, page - 1) } }}
        locale={{ emptyText: <Empty description="当前账户暂无流水" /> }}
        scroll={{ x: 1700 }}
        cardBordered
      />
    </> : <Card><Empty description="输入用户 ID 后查看账户与流水" /></Card>}
  </>
}
