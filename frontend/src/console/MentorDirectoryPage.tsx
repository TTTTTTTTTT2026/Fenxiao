import { useEffect, useState } from 'react'
import { Alert, Button, Card, Drawer, Empty, Result, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AdminSessionResponse } from '../admin/authApi'
import { getAdminMentorAssignedStudents, getAdminMentorIncentiveDashboard, type MentorAssignedStudentResponse, type MentorIncentiveDashboardResponse } from '../admin/mentorReadApi'
import { formatDateTime } from '../shared/dateTime'
import { availableConsoleRoutes } from './navigation'

const { Text, Title } = Typography
type Mentor = MentorIncentiveDashboardResponse['mentors'][number]

const studentColumns: ColumnsType<MentorAssignedStudentResponse> = [
  { title: '学员', key: 'student', render: (_, item) => <>#{item.userId}{item.phoneNumber ? <Text type="secondary"> · {item.phoneNumber}</Text> : null}</> },
  { title: '国家／语言', key: 'locale', render: (_, item) => `${item.countryCode} / ${item.languageCode}` },
  { title: '生效时间', dataIndex: 'assignedAt', render: (value: string) => formatDateTime(value) },
  { title: '归属原因', dataIndex: 'assignmentReason' },
]

export default function MentorDirectoryPage({ session }: { session: AdminSessionResponse }) {
  const permitted = availableConsoleRoutes(session.role).some((route) => route.key === 'mentors')
  const [dashboard, setDashboard] = useState<MentorIncentiveDashboardResponse | null>(null)
  const [loading, setLoading] = useState(permitted)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null)
  const [students, setStudents] = useState<MentorAssignedStudentResponse[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')

  useEffect(() => {
    if (!permitted) return
    let active = true
    void getAdminMentorIncentiveDashboard(session.sessionToken)
      .then((data) => { if (active) { setDashboard(data); setError('') } })
      .catch((reason: unknown) => { if (active) { setDashboard(null); setError(reason instanceof Error ? reason.message : '导师列表加载失败') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [permitted, refresh, session.sessionToken])

  useEffect(() => {
    if (!permitted || selectedMentorId === null) return
    let active = true
    void getAdminMentorAssignedStudents(session.sessionToken, selectedMentorId)
      .then((data) => { if (active) { setStudents(data); setStudentsError('') } })
      .catch((reason: unknown) => { if (active) { setStudents([]); setStudentsError(reason instanceof Error ? reason.message : '学员列表加载失败') } })
      .finally(() => { if (active) setStudentsLoading(false) })
    return () => { active = false }
  }, [permitted, selectedMentorId, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看导师列表" />

  const columns: ColumnsType<Mentor> = [
    { title: '导师', key: 'user', render: (_, item) => <>#{item.userId}{item.phoneNumber ? <Text type="secondary"> · {item.phoneNumber}</Text> : null}</> },
    { title: '国家／语言', key: 'locale', render: (_, item) => `${item.countryCode} / ${item.languageCode}` },
    { title: '资格状态', dataIndex: 'qualificationStatus', render: (value: string) => <Tag color={value === 'QUALIFIED' ? 'green' : 'default'}>{value === 'QUALIFIED' ? '已具备资格' : value}</Tag> },
    { title: '学员数量', dataIndex: 'assignedStudentCount' },
    { title: '带教上限', dataIndex: 'maxActiveStudents' },
    { title: '操作', key: 'action', render: (_, item) => <Button type="link" onClick={() => { setStudents([]); setStudentsError(''); setStudentsLoading(true); setSelectedMentorId(item.userId) }}>查看学员</Button> },
  ]

  return <>
    <Title level={3}>导师列表 · 只读</Title>
    <Text type="secondary">沿用原导师全局查询口径与服务端权限，不按应用工作区筛选。本页不提供资格、学员归属或激励规则写入。</Text>
    <div className="new-console-directory-actions"><Space wrap><Button onClick={() => { setLoading(true); setRefresh((value) => value + 1) }} loading={loading}>刷新列表</Button><Button href="/admin#admin-mentors">打开旧版导师管理</Button></Space></div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <Card><Space size="large" wrap><Statistic title="具备资格的导师" value={dashboard?.qualifiedMentorCount ?? '—'} /><Statistic title="当前已归属学员" value={dashboard?.assignedStudentCount ?? '—'} /></Space></Card>
    <Card title="导师与当前带教数量" className="new-console-alert">
      <Table<Mentor> rowKey="userId" columns={columns} dataSource={dashboard?.mentors ?? []} loading={loading} pagination={{ pageSize: 20, showSizeChanger: false }} scroll={{ x: 780 }} locale={{ emptyText: <Empty description="尚无导师资格记录" /> }} />
    </Card>
    <Drawer title={selectedMentorId === null ? '当前学员' : `导师 #${selectedMentorId} · 当前学员`} open={selectedMentorId !== null} onClose={() => { setSelectedMentorId(null); setStudents([]); setStudentsError(''); setStudentsLoading(false) }} width="min(760px, 100vw)">
      {studentsError ? <Alert type="error" showIcon message={studentsError} /> : null}
      <Table<MentorAssignedStudentResponse> rowKey={(item) => `${item.userId}-${item.assignedAt}`} columns={studentColumns} dataSource={students} loading={studentsLoading} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 680 }} locale={{ emptyText: <Empty description="当前没有已归属学员" /> }} />
    </Drawer>
  </>
}
