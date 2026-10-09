import type { ReactNode } from 'react'
import type { RewardListResponse } from './financeReadApi'
import { formatDateTime } from '../shared/dateTime'
import { DataTable, EmptyState, InfoCard, InlineHint, PanelSection } from './LegacyPresentation'

export type LegacyRewardQuery = {
  beneficiaryUserId: string
  status: string
  startAt: string
  endAt: string
  page: string
  size: string
}

type Props = {
  query: LegacyRewardQuery
  rewards: RewardListResponse | null
  loading: boolean
  canLoadAdmin: boolean
  pageLabel: string
  hasPreviousPage: boolean
  hasNextPage: boolean
  emptyState: { actionLabel?: string }
  renderStatus: (status: string) => ReactNode
  onQueryChange: (query: LegacyRewardQuery) => void
  onLoad: () => void
  onPageChange: (page: number) => void
}

export default function LegacyRewardLedgerSection({ query, rewards, loading, canLoadAdmin, pageLabel, hasPreviousPage, hasNextPage, emptyState, renderStatus, onQueryChange, onLoad, onPageChange }: Props) {
  return <PanelSection
    sectionId="admin-rewards"
    eyebrow="Rewards"
    title="收益记录管理"
    description=""
    action={<button className="primary-btn" onClick={onLoad} disabled={loading || !canLoadAdmin}>查询收益记录</button>}
  >
    <InfoCard title="筛选条件" tone="neutral">
      <div className="query-shell soft-query-shell compact-query-shell">
        <div className="grid-form compact-form exception-filter-grid">
          <label>
            受益用户 ID
            <input value={query.beneficiaryUserId} onChange={(e) => onQueryChange({ ...query, beneficiaryUserId: e.target.value })} placeholder="例如 11001" />
          </label>
          <label>
            状态
            <select value={query.status} onChange={(e) => onQueryChange({ ...query, status: e.target.value })}>
              <option value="">全部</option>
              <option value="FROZEN">冻结中</option>
              <option value="AVAILABLE">可用</option>
              <option value="RISK_HOLD">风险冻结</option>
            </select>
          </label>
        </div>
        <InlineHint text={pageLabel} />
        <div className="table-toolbar compact-toolbar">
          <button className="ghost-btn small-btn" onClick={() => onPageChange(Number(query.page) - 1)} disabled={loading || !hasPreviousPage}>上一页</button>
          <button className="ghost-btn small-btn" onClick={() => onPageChange(Number(query.page) + 1)} disabled={loading || !hasNextPage}>下一页</button>
        </div>
      </div>
    </InfoCard>

    {rewards?.items?.length ? (
      <DataTable
        headers={['受益用户', '来源用户', '层级', '奖励金额', '状态', '计算时间']}
        rows={rewards.items.map((item) => [
          item.beneficiaryUserId,
          item.sourceUserId,
          item.rewardLevel,
          item.rewardAmount,
          renderStatus(item.rewardStatus),
          formatDateTime(item.calculatedAt),
        ])}
        emptyText="暂无后台奖励数据"
      />
    ) : (
      <EmptyState title="暂无后台奖励数据" description="先按受益用户或状态查一页。" actionLabel={emptyState.actionLabel} />
    )}
  </PanelSection>
}
