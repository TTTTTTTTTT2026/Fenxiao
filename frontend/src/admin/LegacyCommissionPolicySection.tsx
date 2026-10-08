import type { CommissionPolicyResponse } from '../api'
import { formatDateTime } from '../shared/dateTime'
import { EmptyState, InfoCard, InlineHint, PanelSection, RelationItem } from './LegacyPresentation'

type Props = {
  policies: CommissionPolicyResponse[] | null
  loading: boolean
  onRefresh: () => void
}

export default function LegacyCommissionPolicySection({ policies, loading, onRefresh }: Props) {
  return <PanelSection sectionId="admin-commission-policies" eyebrow="Invitation commission · fixed policy ledger" title="邀请裂变分成规则台账" description="此处展示固定的邀请裂变口径及其历史快照，不提供运营人员新增、修改比例或调整层级。它不包含导师分成或运营分红，也不会创建奖励、余额或付款。" action={<button className="ghost-btn" onClick={onRefresh} disabled={loading}>刷新台账</button>}>
    <div className="stack-gap">
      <InfoCard title="当前固定口径" tone="neutral">
        <div className="relation-grid">
          <RelationItem label="第 1 层 · 直接邀请" value="10%" />
          <RelationItem label="第 2 层 · 间接邀请" value="3%" />
          <RelationItem label="第 3 层及以上" value="关闭" />
          <RelationItem label="核算基数" value="来源公会公司业务收入" />
        </div>
        <InlineHint text="来源用户的原始可结算收入，先按其收入发生时所属公会的公司分成比例换算为公司业务收入，再按固定两层演算个人推荐候选。用户等级当前均展示直邀 10% / 间邀 3%；未来如按等级差异化，须通过研发变更同时更新等级权益展示、计算规则和审计快照。" />
        <InlineHint text="公会公司分成比例在“平台公会目录”维护；该比例属于公司业务收入的换算前提，不是邀请裂变比例。" />
      </InfoCard>
      <InfoCard title="历史规则与候选快照" tone="neutral">
        {(policies ?? []).length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>规则版本</th><th>适用范围</th><th>固定层级</th><th>比例 / 冻结记录</th><th>生效期</th><th>历史状态</th></tr></thead><tbody>{(policies ?? []).map((policy) => <tr key={policy.id}><td>{policy.policyCode}</td><td>{policy.platformCode} / {policy.countryCode}</td><td>两层（第 3 层关闭）</td><td>{policy.levels.filter((level) => level.enabled).map((level) => `L${level.rewardLevel} ${level.rewardRate} / ${level.freezeDays}天`).join('；') || '-'}</td><td>{formatDateTime(policy.effectiveFrom)} {policy.effectiveTo ? `至 ${formatDateTime(policy.effectiveTo)}` : '起长期有效'}</td><td>{policy.status === 'DRAFT' ? '历史待审记录' : policy.status === 'ACTIVE' ? '历史已启用记录' : '历史已停用记录'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未记录历史规则快照" description="当前固定口径由系统底层执行；后续如通过研发变更调整，将在此保留新的历史快照。" />}
        <InlineHint text="此页只读，用于核对收入发生时采用的固定邀请口径与历史版本。规则新增、比例调整或层级变动须经业务确认后走研发变更流程；不会在运营后台直接操作。" />
      </InfoCard>
    </div>
  </PanelSection>
}
