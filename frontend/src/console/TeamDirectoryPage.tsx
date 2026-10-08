import { useEffect, useState } from 'react'
import { Alert, Button, Card, Drawer, Empty, Result, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AdminSessionResponse } from '../admin/authApi'
import { getAdminTeamManagementDashboard, getAdminTeamMembers, type TeamManagementDashboardResponse, type TeamManagementItemResponse, type TeamManagementMemberResponse } from '../admin/teamReadApi'
import { formatDateTime } from '../shared/dateTime'
import { availableConsoleRoutes } from './navigation'

const { Text, Title } = Typography

const memberColumns: ColumnsType<TeamManagementMemberResponse> = [
  { title: '成员', key: 'user', render: (_, item) => <>#{item.userId}{item.phoneNumber ? <Text type="secondary"> · {item.phoneNumber}</Text> : null}</> },
  { title: '国家', dataIndex: 'countryCode' },
  { title: '关系', dataIndex: 'memberRole', render: (value: string) => value === 'LEADER' ? '负责人' : '成员' },
  { title: '归属来源', dataIndex: 'sourceType' },
  { title: '生效时间', dataIndex: 'effectiveFrom', render: (value: string) => formatDateTime(value) },
]

export default function TeamDirectoryPage({ session }: { session: AdminSessionResponse }) {
  const permitted = availableConsoleRoutes(session.role).some((route) => route.key === 'teams')
  const [dashboard, setDashboard] = useState<TeamManagementDashboardResponse | null>(null)
  const [loading, setLoading] = useState(permitted)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [selectedTeam, setSelectedTeam] = useState<TeamManagementItemResponse | null>(null)
  const [members, setMembers] = useState<TeamManagementMemberResponse[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')

  useEffect(() => {
    if (!permitted) return
    let active = true
    void getAdminTeamManagementDashboard(session.sessionToken)
      .then((data) => { if (active) { setDashboard(data); setError('') } })
      .catch((reason: unknown) => { if (active) { setDashboard(null); setError(reason instanceof Error ? reason.message : '团队列表加载失败') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [permitted, refresh, session.sessionToken])

  useEffect(() => {
    if (!permitted || !selectedTeam) return
    let active = true
    void getAdminTeamMembers(session.sessionToken, selectedTeam.teamId)
      .then((data) => { if (active) { setMembers(data); setMembersError('') } })
      .catch((reason: unknown) => { if (active) { setMembers([]); setMembersError(reason instanceof Error ? reason.message : '团队成员加载失败') } })
      .finally(() => { if (active) setMembersLoading(false) })
    return () => { active = false }
  }, [permitted, selectedTeam, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看团队列表" />

  const columns: ColumnsType<TeamManagementItemResponse> = [
    { title: '团队', key: 'team', render: (_, item) => <>{item.teamName}<Text type="secondary"> · {item.teamCode} / {item.countryCode}</Text></> },
    { title: '负责人', key: 'leader', render: (_, item) => item.leaderUserId ? `#${item.leaderUserId}` : '待自动产生' },
    { title: '任命状态', dataIndex: 'leaderAppointmentStatus', render: (value: string) => <Tag>{value === 'CONFIRMED' ? '已正式任命' : value === 'AUTO_CONFIRMED' ? '金牌自动确认' : value === 'LEGACY_UNVERIFIED' ? '历史待核验' : '不适用'}</Tag> },
    { title: '上级团队', dataIndex: 'parentTeamCode', render: (value: string | null) => value || '—' },
    { title: '当前成员', dataIndex: 'activeMemberCount' },
    { title: '建立时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
    { title: '操作', key: 'action', render: (_, item) => <Button type="link" onClick={() => { setMembers([]); setMembersError(''); setMembersLoading(true); setSelectedTeam(item) }}>查看成员</Button> },
  ]

  return <>
    <Title level={3}>团队列表 · 只读</Title>
    <Text type="secondary">沿用原团队全局查询口径与服务端权限，不按应用工作区筛选。本页不提供团队资格、经营分成许可或归属写入。</Text>
    <div className="new-console-directory-actions"><Space wrap><Button onClick={() => { setLoading(true); setRefresh((value) => value + 1) }} loading={loading}>刷新列表</Button><Button href="/admin#admin-teams">打开旧版团队管理</Button></Space></div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <Card><Space size="large" wrap><Statistic title="有效团队" value={dashboard?.activeTeamCount ?? '—'} /><Statistic title="已确认负责人团队" value={dashboard?.leaderTeamCount ?? '—'} /><Statistic title="当前成员归属" value={dashboard?.activeMemberRelationCount ?? '—'} /></Space></Card>
    <Card title="团队与成员" className="new-console-alert"><Table<TeamManagementItemResponse> rowKey="teamId" columns={columns} dataSource={dashboard?.teams ?? []} loading={loading} pagination={{ pageSize: 20, showSizeChanger: false }} scroll={{ x: 900 }} locale={{ emptyText: <Empty description="尚无团队记录" /> }} /></Card>
    <Drawer title={selectedTeam ? `团队 ${selectedTeam.teamName} · 当前成员` : '当前成员'} open={Boolean(selectedTeam)} onClose={() => { setSelectedTeam(null); setMembers([]); setMembersError(''); setMembersLoading(false) }} width="min(800px, 100vw)">
      {membersError ? <Alert type="error" showIcon message={membersError} /> : null}
      <Table<TeamManagementMemberResponse> rowKey={(item) => `${item.userId}-${item.memberRole}-${item.effectiveFrom}`} columns={memberColumns} dataSource={members} loading={membersLoading} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 720 }} locale={{ emptyText: <Empty description="当前没有有效成员归属" /> }} />
    </Drawer>
  </>
}
