import { CaretRight } from '@phosphor-icons/react'
import type { OverviewReportResponse } from '../api'
import { Metric, PanelSection } from './LegacyPresentation'

type Props = {
  roleLabel: string
  productLabel: string
  overview: OverviewReportResponse | null
  pendingWithdrawalCount: number | null
  pendingRiskCount: number | null
  canViewRewards: boolean
  canViewUsers: boolean
  canViewChannel: boolean
  loading: boolean
  canLoad: boolean
  onRefresh: () => void
  onLoadRiskEvents: () => void
}

export default function LegacyOverviewSection({
  roleLabel, productLabel, overview, pendingWithdrawalCount, pendingRiskCount,
  canViewRewards, canViewUsers, canViewChannel, loading, canLoad, onRefresh, onLoadRiskEvents,
}: Props) {
  return <PanelSection
    sectionId="admin-overview"
    eyebrow="Overview"
    title="今日工作台"
    description={`${roleLabel}视角 · 先处理阻塞，再查看业务趋势`}
    action={<button className="primary-btn" onClick={onRefresh} disabled={loading || !canLoad}>{loading ? '刷新中…' : '刷新工作台'}</button>}
  >
    <div className="admin-overview-grid">
      <section className="admin-overview-priority" aria-labelledby="admin-priority-title">
        <div className="admin-subsection-head"><div><h3 id="admin-priority-title">需要你处理</h3><p>按业务阻塞程度排序</p></div><span>今日</span></div>
        <div className="admin-task-board" aria-label="运营待办">
          {canViewRewards ? <a href="#admin-rewards"><span>待审核提现<small>进入财务队列</small></span><strong>{pendingWithdrawalCount ?? '—'}</strong><CaretRight size={16} /></a> : null}
          {canViewUsers ? <a href="#admin-risk-queue" onClick={() => { if (pendingRiskCount === null) onLoadRiskEvents() }}><span>待处理异常<small>核验绑定与风险</small></span><strong>{pendingRiskCount ?? overview?.riskEventCount ?? '—'}</strong><CaretRight size={16} /></a> : null}
          {canViewChannel ? <a href="#admin-channel-entries"><span>渠道入口<small>创建可追踪链接</small></span><strong>生成</strong><CaretRight size={16} /></a> : null}
          <a href="#admin-my-security"><span>工作台状态<small>{productLabel}</small></span><strong>{overview ? '已更新' : '待刷新'}</strong><CaretRight size={16} /></a>
        </div>
      </section>
      <section className="admin-overview-pulse" aria-labelledby="admin-pulse-title">
        <div className="admin-subsection-head"><div><h3 id="admin-pulse-title">关键指标</h3><p>当前产品累计数据</p></div></div>
        <div className="stats-grid">
          <Metric label="邀请人数" value={overview?.invitedUsers} hint="累计邀请" tone="neutral" />
          <Metric label="有效人数" value={overview?.effectiveUsers} hint="有效归因" tone="success" />
          <Metric label="累计奖励" value={overview?.rewardTotal} hint="奖励总额" tone="primary" />
          <Metric label="冻结奖励" value={overview?.frozenRewardTotal} hint="待复核" tone="warning" />
          <Metric label="可用奖励" value={overview?.availableRewardTotal} hint="可结算" tone="success" />
          <Metric label="待处理异常" value={overview?.riskEventCount} hint="需人工处理" tone="danger" />
        </div>
      </section>
    </div>
  </PanelSection>
}
