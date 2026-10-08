import { useEffect, useState } from 'react'
import { Alert, Button, Card, Result, Segmented, Skeleton, Statistic, Typography } from 'antd'
import { getAdminOverview, type AdminSessionResponse, type OverviewReportResponse } from '../api'
import { allowedConsolePlatforms, type ConsolePlatform } from './navigation'

const { Text, Title } = Typography

export default function OverviewPage({ session }: { session: AdminSessionResponse }) {
  const platforms = allowedConsolePlatforms(session.platformScope)
  const [platform, setPlatform] = useState<ConsolePlatform>(() => platforms[0] ?? 'LINKY')
  const [overview, setOverview] = useState<OverviewReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!allowedConsolePlatforms(session.platformScope).includes(platform)) return
    let active = true
    void getAdminOverview(session.sessionToken, platform)
      .then((report) => { if (active) setOverview(report) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '加载分销概览失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [platform, refresh, session.platformScope, session.sessionToken])

  if (!platforms.includes(platform)) return <Result status="403" title="当前账号没有可查看的产品范围" />

  function changePlatform(next: ConsolePlatform) {
    setOverview(null)
    setError('')
    setLoading(true)
    setPlatform(next)
  }

  function refreshOverview() {
    setOverview(null)
    setError('')
    setLoading(true)
    setRefresh((value) => value + 1)
  }

  return <>
    <Title level={3}>分销概览</Title>
    <Text type="secondary">只读展示当前产品的累计指标。待办与处理操作仍在旧版后台，不在此页写入数据。</Text>
    <div className="new-console-directory-actions">
      <Segmented<ConsolePlatform> value={platform} options={platforms} onChange={changePlatform} aria-label="分销概览产品选择" />
      <Button onClick={refreshOverview} loading={loading}>刷新概览</Button>
      <Button href="/admin#admin-overview">打开旧版工作台</Button>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <Card title={`${platform} 关键指标`}>
      {loading && !overview ? <Skeleton active aria-label="正在加载分销概览" /> : overview ? <div className="new-console-overview-stats">
        <Statistic title="邀请人数" value={overview.invitedUsers} />
        <Statistic title="有效人数" value={overview.effectiveUsers} />
        <Statistic title="累计奖励" value={overview.rewardTotal} />
        <Statistic title="冻结奖励" value={overview.frozenRewardTotal} />
        <Statistic title="可用奖励" value={overview.availableRewardTotal} />
        <Statistic title="待处理异常" value={overview.riskEventCount} />
      </div> : <Text type="secondary">暂无概览数据。请刷新重试。</Text>}
    </Card>
  </>
}
