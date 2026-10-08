import { useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, Result, Skeleton, Table, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { getAdminUserGradeDashboard, type AdminSessionResponse, type UserGradeDashboardResponse, type UserGradeRuleResponse } from '../api'
import { canManageTeamsInAdmin } from '../admin/roleCapabilities'
import { USER_GRADE_CATALOG } from '../admin/userGradeCatalog'

const { Text, Title } = Typography

const catalogColumns = [
  { title: '等级', dataIndex: 'grade', key: 'grade', width: 100 },
  { title: '升级条件', dataIndex: 'condition', key: 'condition', width: 230 },
  { title: '升级后的权益与责任', dataIndex: 'responsibility', key: 'responsibility', width: 380 },
  { title: '个人推荐分成', dataIndex: 'referral', key: 'referral', width: 160 },
  { title: '第一阶段团队奖励', dataIndex: 'team', key: 'team', width: 240 },
]

const ruleColumns: ProColumns<UserGradeRuleResponse>[] = [
  { title: '规则版本', key: 'version', width: 170, render: (_, rule) => `${rule.ruleCode} · V${rule.ruleVersion}` },
  { title: '等级', dataIndex: 'gradeCode', width: 120 },
  { title: '适用范围', key: 'scope', width: 240, render: (_, rule) => `${rule.platformCode} / ${rule.countryCode}${rule.guildId ? ` / ${rule.guildId}` : ' / 全部公会'}` },
  { title: '有效直邀门槛', dataIndex: 'requiredDirectInviteCount', width: 140, render: (_, rule) => `数量 ≥ ${rule.requiredDirectInviteCount}` },
  { title: '状态', dataIndex: 'status', width: 120, render: (_, rule) => <Tag color={rule.status === 'ACTIVE' ? 'green' : rule.status === 'DRAFT' ? 'orange' : 'default'}>{rule.status === 'DRAFT' ? '待审（历史记录）' : rule.status === 'ACTIVE' ? '已启用' : '已停用'}</Tag> },
]

export default function UserGradeRulesPage({ session }: { session: AdminSessionResponse }) {
  const permitted = canManageTeamsInAdmin(session.role)
  const [dashboard, setDashboard] = useState<UserGradeDashboardResponse | null>(null)
  const [loading, setLoading] = useState(permitted)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!canManageTeamsInAdmin(session.role)) return
    let active = true
    void getAdminUserGradeDashboard(session.sessionToken)
      .then((data) => { if (active) setDashboard(data) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '加载用户等级失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh, session.role, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看用户等级规则" />

  function refreshRules() {
    setDashboard(null)
    setError('')
    setLoading(true)
    setRefresh((value) => value + 1)
  }

  return <>
    <Title level={3}>用户等级列表</Title>
    <Text type="secondary">既定七级制度与已保存的规则范围，仅供查看。等级计算与资格认定仍以服务端为准。</Text>
    <div className="new-console-directory-actions">
      <Button onClick={refreshRules} loading={loading}>刷新数据</Button>
      <Button href="/admin#admin-user-grade-list">打开旧版页面</Button>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <Card title="既定用户等级" className="new-console-directory-summary">
      <Text type="secondary">个人推荐分成统一为直邀 10%、间邀 3%；第一阶段不发放团队经营奖励。规则调整仍走研发变更流程。</Text>
      <Table rowKey="grade" columns={catalogColumns} dataSource={[...USER_GRADE_CATALOG]} pagination={false} scroll={{ x: 1110 }} className="new-console-grade-catalog" />
    </Card>
    {loading && !dashboard ? <Card><Skeleton active /></Card> : <ProTable<UserGradeRuleResponse>
      headerTitle="已保存的等级规则范围"
      rowKey="id"
      columns={ruleColumns}
      dataSource={dashboard?.rules ?? []}
      loading={loading}
      search={false}
      options={false}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      locale={{ emptyText: <Empty description="尚未读取等级规则范围；请刷新数据查看现有快照。" /> }}
      scroll={{ x: 790 }}
      cardBordered
    />}
    <Text type="secondary">此页不提供新增、审批、启用或停用；历史版本只供审计查看。</Text>
  </>
}
