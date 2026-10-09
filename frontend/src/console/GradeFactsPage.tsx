import { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Empty, Result, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  getAdminEffectiveUserQualifications,
  getAdminUserGradeDashboard,
  getAdminUserPointDashboard,
  type EffectiveUserQualificationResponse,
  type UserGradeDashboardResponse,
  type UserPointBalanceResponse,
  type UserPointDashboardResponse,
  type UserPointFactResponse,
  type UserGradeEvaluationResponse,
} from '../api'
import type { AdminSessionResponse } from '../admin/authApi'
import { formatDateTime } from '../shared/dateTime'
import { canReadUnrestrictedAdminData, type ConsolePlatform } from './navigation'

const { Text, Title } = Typography

const evaluationColumns: ColumnsType<UserGradeEvaluationResponse> = [
  { title: '用户', dataIndex: 'userId', width: 95 },
  { title: '平台 / 公会', key: 'scope', width: 180, render: (_, item) => `${item.platformCode} / ${item.guildId}` },
  { title: '等级', dataIndex: 'gradeCode', width: 115 },
  { title: '累计达标有效直邀', dataIndex: 'directInviteCount', width: 160 },
  { title: '当前活跃有效直邀', dataIndex: 'currentActiveEffectiveInviteCount', width: 160 },
  { title: '结果', key: 'status', width: 130, render: (_, item) => item.status === 'QUALIFIED' ? '已合格' : item.status === 'REQUIRES_MANUAL_REVIEW' ? '待人工复核' : '进行中' },
  { title: '评估时间', key: 'evaluatedAt', width: 180, render: (_, item) => formatDateTime(item.evaluatedAt) },
]

const qualificationColumns: ColumnsType<EffectiveUserQualificationResponse> = [
  { title: '用户', dataIndex: 'userId', width: 95 },
  { title: '永久资格', key: 'status', width: 180, render: (_, item) => <Space direction="vertical" size={0}><span>{item.qualificationStatus === 'QUALIFIED' ? '已合格' : item.qualificationStatus === 'MANUALLY_EXCLUDED' ? '人工排除' : item.qualificationStatus === 'EVIDENCE_REVOKED' ? '证据已撤销' : '未合格'}</span>{item.manualCorrectionReason ? <Text type="secondary">原因：{item.manualCorrectionReason}</Text> : null}</Space> },
  { title: '当前活跃', key: 'activity', width: 225, render: (_, item) => <Space direction="vertical" size={0}><span>{item.currentActivityStatus === 'ACTIVE' ? '近 7 个完整自然日活跃' : '当前不活跃'}</span><Text type="secondary">{item.currentActivityWindowStart ?? '—'} 至 {item.currentActivityWindowEnd ?? '—'}</Text></Space> },
  { title: '达标收入日期', key: 'dates', width: 230, render: (_, item) => <Space direction="vertical" size={0}><span>{item.qualifyingIncomeDateCount} 天</span><Text type="secondary">{item.qualifyingIncomeDates || '—'}</Text></Space> },
  { title: '达标窗口', key: 'window', width: 220, render: (_, item) => `${item.qualificationWindowStart ?? '—'} 至 ${item.qualificationWindowEnd ?? '—'}` },
  { title: '证据快照', dataIndex: 'sourceEvidenceSnapshot', width: 260, render: (value: string | null) => value || '—' },
]

const balanceColumns: ColumnsType<UserPointBalanceResponse> = [
  { title: '邀请人用户', dataIndex: 'userId', width: 130 },
  { title: '累计积分（跨平台）', key: 'total', width: 180, render: (_, item) => item.totalPoints.toFixed(6) },
  { title: '有效积分事实', dataIndex: 'accruedFactCount', width: 150 },
  { title: '最近下级收入', key: 'latest', width: 190, render: (_, item) => formatDateTime(item.latestIncomeAt ?? undefined) },
]

const pointFactColumns: ColumnsType<UserPointFactResponse> = [
  { title: '收入事实', key: 'source', width: 230, render: (_, item) => <Space direction="vertical" size={0}><span>{item.sourceEventId}</span><Text type="secondary">{formatDateTime(item.occurredAt)}</Text></Space> },
  { title: '下级 / 邀请人', key: 'users', width: 150, render: (_, item) => `${item.sourceUserId ?? '—'} / ${item.beneficiaryUserId ?? '—'}` },
  { title: '原始收入', key: 'amount', width: 150, render: (_, item) => `${item.sourceAmount} ${item.tokenUnit}` },
  { title: '换算比例', dataIndex: 'pointsPerToken', width: 125, render: (value: number | null) => value ?? '—' },
  { title: '积分', dataIndex: 'pointAmount', width: 125, render: (value: number | null) => value ?? '—' },
  { title: '状态', dataIndex: 'factStatus', width: 135 },
  { title: '依据', dataIndex: 'decisionReason', width: 230 },
]

const paging = { pageSize: 20, showSizeChanger: false }

export function GradeFactsSnapshot({ grade, points, qualifications, platform }: {
  grade: UserGradeDashboardResponse | null
  points: UserPointDashboardResponse | null
  qualifications: EffectiveUserQualificationResponse[] | null
  platform: ConsolePlatform
}) {
  return <>
    <Card title="等级规则概览（全局）" className="new-console-directory-summary">
      <Descriptions column={{ xs: 1, sm: 2 }} items={[
        { key: 'activeRules', label: '已启用等级规则', children: grade?.activeRuleCount ?? '—' },
        { key: 'leaders', label: '已合格团队长', children: grade?.qualifiedTeamLeaderCount ?? '—' },
      ]} />
      <Text type="secondary">MCN 仅提供收入事实；邀请关系、有效用户资格和等级由分销平台计算及审计。当前活跃以最近 7 个完整自然日（不含当天）为窗口。</Text>
    </Card>
    <Card title={`${platform} 最近等级评估`} className="new-console-directory-summary">
      <Table rowKey={(item) => `${item.userId}-${item.platformCode}-${item.guildId}-${item.gradeCode}-${item.ruleId}-${item.evaluatedAt}`} columns={evaluationColumns} dataSource={grade?.recentEvaluations.filter((item) => item.platformCode.toUpperCase() === platform) ?? []} pagination={paging} scroll={{ x: 1050 }} locale={{ emptyText: <Empty description="暂无等级评估记录" /> }} />
    </Card>
    <Card title={`${platform} 有效用户资格事实`} className="new-console-directory-summary">
      <Text type="secondary">永久资格与当前活跃分别展示；本页只读取服务端事实，不提供刷新资格或人工纠偏。</Text>
      <Table rowKey={(item) => `${item.platformCode}-${item.userId}`} columns={qualificationColumns} dataSource={qualifications ?? []} pagination={paging} scroll={{ x: 1210 }} locale={{ emptyText: <Empty description="暂无有效用户资格事实" /> }} />
    </Card>
    <Card title={`${platform} 历史直接邀请积分事实`} className="new-console-directory-summary">
      <Descriptions column={{ xs: 1, sm: 2 }} items={[
        { key: 'accrued', label: '已累计积分事实', children: points?.accruedFactCount ?? '—' },
        { key: 'blocked', label: '暂无法记分', children: points?.blockedFactCount ?? '—' },
        { key: 'revoked', label: '证据已撤销', children: points?.revokedFactCount ?? '—' },
        { key: 'total', label: '本平台累计积分', children: points ? points.accruedPointTotal.toFixed(6) : '—' },
      ]} />
      <Text type="secondary">这里是已停用旧口径的历史事实；正式邀请奖励积分以财务管理中的用户账户为准。</Text>
      <Table rowKey="userId" columns={balanceColumns} dataSource={points?.topBalances ?? []} pagination={paging} scroll={{ x: 650 }} locale={{ emptyText: <Empty description="尚无可累计积分" /> }} />
      <Table rowKey={(item) => `${item.platformCode}-${item.sourceEventId}`} columns={pointFactColumns} dataSource={points?.recentFacts ?? []} pagination={paging} scroll={{ x: 1140 }} locale={{ emptyText: <Empty description="暂无历史积分事实" /> }} />
    </Card>
  </>
}

export default function GradeFactsPage({ session }: { session: AdminSessionResponse }) {
  // These existing GETs include global user-level facts and do not apply session data scopes.
  const permitted = canReadUnrestrictedAdminData(session)
  const [platform, setPlatform] = useState<ConsolePlatform>('TIMO')
  const [grade, setGrade] = useState<UserGradeDashboardResponse | null>(null)
  const [points, setPoints] = useState<UserPointDashboardResponse | null>(null)
  const [qualifications, setQualifications] = useState<EffectiveUserQualificationResponse[] | null>(null)
  const [loadingGrade, setLoadingGrade] = useState(permitted)
  const [loadingPlatform, setLoadingPlatform] = useState(permitted)
  const [gradeError, setGradeError] = useState('')
  const [platformError, setPlatformError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!permitted) return
    let active = true
    void getAdminUserGradeDashboard(session.sessionToken)
      .then((data) => { if (active) { setGrade(data); setGradeError('') } })
      .catch((reason: unknown) => { if (active) { setGrade(null); setGradeError(reason instanceof Error ? reason.message : '等级概览加载失败') } })
      .finally(() => { if (active) setLoadingGrade(false) })
    return () => { active = false }
  }, [permitted, refresh, session.sessionToken])

  useEffect(() => {
    if (!permitted) return
    let active = true
    void Promise.all([
      getAdminUserPointDashboard(session.sessionToken, platform),
      getAdminEffectiveUserQualifications(session.sessionToken, platform, 50),
    ]).then(([pointData, qualificationData]) => { if (active) { setPoints(pointData); setQualifications(qualificationData); setPlatformError('') } })
      .catch((reason: unknown) => { if (active) { setPoints(null); setQualifications(null); setPlatformError(reason instanceof Error ? reason.message : '资格事实加载失败') } })
      .finally(() => { if (active) setLoadingPlatform(false) })
    return () => { active = false }
  }, [permitted, platform, refresh, session.sessionToken])

  if (!permitted) return <Result status="403" title="当前账号无权查看全局等级资格事实" />

  function reload() {
    setGrade(null)
    setPoints(null)
    setQualifications(null)
    setGradeError('')
    setPlatformError('')
    setLoadingGrade(true)
    setLoadingPlatform(true)
    setRefresh((value) => value + 1)
  }

  return <>
    <Title level={3}>等级资格事实 · 只读</Title>
    <Text type="secondary">沿用旧版全局等级、有效用户和历史积分事实接口。因服务端尚未按管理员数据范围过滤，本页只向全范围最高管理员开放；评估、资格刷新和人工纠偏仍在旧版后台。</Text>
    <div className="new-console-directory-actions"><Space wrap>
      <Select aria-label="资格事实来源平台" value={platform} options={[{ value: 'TIMO', label: 'Timo' }, { value: 'LINKY', label: 'Linky' }]} onChange={(value: ConsolePlatform) => { setPlatform(value); setPoints(null); setQualifications(null); setPlatformError(''); setLoadingPlatform(true) }} style={{ minWidth: 135 }} />
      <Button onClick={reload} loading={loadingGrade || loadingPlatform}>刷新数据</Button>
      <Button href="/admin#admin-user-grade-facts">打开旧版等级资格事实</Button>
    </Space></div>
    {gradeError ? <Alert type="error" showIcon message={gradeError} className="new-console-alert" /> : null}
    {platformError ? <Alert type="error" showIcon message={platformError} className="new-console-alert" /> : null}
    {(loadingGrade || loadingPlatform) && !grade && !points ? <Card loading aria-label="正在加载等级资格事实" /> : null}
    <GradeFactsSnapshot grade={grade} points={points} qualifications={qualifications} platform={platform} />
    <Tag>仅展示事实，不执行重新评估或纠偏</Tag>
  </>
}
