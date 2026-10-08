import { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Empty, Result, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { getAdminCommissionPolicies, type AdminSessionResponse, type CommissionPolicyResponse } from '../api'
import { canReadCommissionPoliciesInAdmin } from '../admin/roleCapabilities'
import { formatDateTime } from '../shared/dateTime'
import { enabledLevels } from './commissionPolicyModel'

const { Text, Title } = Typography

const columns: ProColumns<CommissionPolicyResponse>[] = [
  { title: '规则版本', dataIndex: 'policyCode', width: 190 },
  { title: '适用范围', key: 'scope', width: 180, render: (_, policy) => `${policy.platformCode} / ${policy.countryCode}` },
  { title: '固定层级', key: 'levels', width: 170, render: () => '两层（第 3 层关闭）' },
  { title: '比例 / 冻结记录', key: 'rates', width: 300, render: (_, policy) => enabledLevels(policy) },
  { title: '生效期', key: 'period', width: 270, render: (_, policy) => `${formatDateTime(policy.effectiveFrom)} ${policy.effectiveTo ? `至 ${formatDateTime(policy.effectiveTo)}` : '起长期有效'}` },
  { title: '历史状态', key: 'status', width: 140, render: (_, policy) => <Tag color={policy.status === 'ACTIVE' ? 'green' : policy.status === 'DRAFT' ? 'orange' : 'default'}>{policy.status === 'DRAFT' ? '历史待审记录' : policy.status === 'ACTIVE' ? '历史已启用记录' : '历史已停用记录'}</Tag> },
]

export default function CommissionPolicyPage({ session }: { session: AdminSessionResponse }) {
  const permitted = canReadCommissionPoliciesInAdmin(session.role)
  const [policies, setPolicies] = useState<CommissionPolicyResponse[] | null>(null)
  const [loading, setLoading] = useState(permitted)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!permitted) return
    let active = true
    void getAdminCommissionPolicies(session.sessionToken)
      .then((data) => { if (active) setPolicies(data) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '加载邀请裂变分成规则失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [permitted, refresh, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看邀请裂变分成规则" />

  function refreshPolicies() {
    setPolicies(null)
    setError('')
    setLoading(true)
    setRefresh((value) => value + 1)
  }

  return <>
    <Title level={3}>邀请裂变分成规则台账</Title>
    <Text type="secondary">当前固定口径与历史快照仅供核对。规则和收益计算仍以现有服务端为准，此页不提供新增、调整或启停操作。</Text>
    <div className="new-console-directory-actions">
      <Button onClick={refreshPolicies} loading={loading}>刷新台账</Button>
      <Button href="/admin#admin-commission-policies">打开旧版页面</Button>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <Card title="当前固定口径" className="new-console-directory-summary">
      <Descriptions column={{ xs: 1, sm: 2 }} items={[
        { key: 'direct', label: '第 1 层 · 直接邀请', children: '10%' },
        { key: 'indirect', label: '第 2 层 · 间接邀请', children: '3%' },
        { key: 'further', label: '第 3 层及以上', children: '关闭' },
        { key: 'base', label: '核算基数', children: '来源公会公司业务收入' },
      ]} />
      <Text type="secondary">原始可结算收入先按收入发生时公会的公司分成比例换算，再按固定两层演算推荐候选。公会公司比例不等于邀请裂变比例。</Text>
    </Card>
    <ProTable<CommissionPolicyResponse>
      headerTitle="历史规则与候选快照"
      rowKey="id"
      columns={columns}
      dataSource={policies ?? []}
      loading={loading}
      search={false}
      options={false}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      locale={{ emptyText: <Empty description="尚无历史规则快照；当前固定口径由服务端执行。" /> }}
      scroll={{ x: 1250 }}
      cardBordered
    />
    <Text type="secondary">本页不包含导师分成或运营分红，也不会创建奖励、余额或付款。规则调整须经业务确认后走研发变更流程。</Text>
  </>
}
