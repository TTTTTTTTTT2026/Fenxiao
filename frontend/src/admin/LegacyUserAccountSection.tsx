import type { FormEvent } from 'react'
import type { InvitationRewardAccountResponse } from '../api'
import { formatDateTime } from '../shared/dateTime'
import { formatMoney } from '../shared/legacyFormatting'
import { EmptyState, InlineHint, PanelSection } from './LegacyPresentation'

type Props = {
  userId: string
  account: InvitationRewardAccountResponse | null
  loading: boolean
  onUserIdChange: (value: string) => void
  onQuery: (page: number) => void
}

export default function LegacyUserAccountSection({ userId, account, loading, onUserIdChange, onQuery }: Props) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onQuery(0)
  }

  return <PanelSection sectionId="admin-user-accounts" eyebrow="Invitation income" title="用户账户" description="按准确用户 ID 查询邀请奖励积分；不展示平台账号，提现与付款均未开放。">
    <form className="admin-filter-bar" onSubmit={submit}>
      <label>用户 ID<input inputMode="numeric" value={userId} onChange={(event) => onUserIdChange(event.target.value)} placeholder="输入用户 ID 后查询" /></label>
      <button className="primary-btn small-btn" type="submit" disabled={loading}>查询账户</button>
    </form>
    {account ? <>
      <div className="relation-grid top-gap">
        <div className="relation-item"><span>冻结中</span><strong>{formatMoney(account.frozenPoints)} 积分</strong></div>
        <div className="relation-item"><span>已解冻积分</span><strong>{formatMoney(account.availablePoints)} 积分</strong></div>
        <div className="relation-item"><span>账户净额</span><strong>{formatMoney(account.totalPoints)} 积分</strong></div>
        <div className="relation-item"><span>累计邀请奖励收入</span><strong>{formatMoney(account.cumulativeIncomePoints)} 积分</strong></div>
      </div>
      <InlineHint text="已解冻不代表当前可以提现。流水包括邀请奖励入账、MCN 修订冲正与到期解冻；Timo／Linky 原始钻石分开留痕。" />
      <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>时间 UTC</th><th>类型 / 原因</th><th>平台 / 层级</th><th>来源用户</th><th>原始钻石</th><th>公司比例</th><th>公司收入</th><th>邀请比例</th><th>邀请奖励钻石</th><th>换算率</th><th>冻结变动</th><th>已解冻变动</th><th>收入事实编号</th></tr></thead><tbody>{account.items.map((flow) => <tr key={flow.id}><td>{formatDateTime(flow.recordedAt)}</td><td>{flow.type}<small className="table-subtle">{flow.reason}</small></td><td>{flow.platformCode} / {flow.rewardLevel}</td><td>{flow.sourceUserId}</td><td>{flow.rawDiamonds}</td><td>{(flow.companyShareRate * 100).toFixed(2)}%</td><td>{flow.companyIncomeDiamonds}</td><td>{(flow.invitationRate * 100).toFixed(2)}%</td><td>{flow.rewardDiamonds}</td><td>{flow.pointsPerDiamond}</td><td>{flow.frozenDelta}</td><td>{flow.availableDelta}</td><td>{flow.sourceEventId}</td></tr>)}</tbody></table></div>
      <div className="table-toolbar compact-toolbar"><span>共 {account.totalRecords} 条</span><button className="ghost-btn small-btn" onClick={() => onQuery(account.page - 1)} disabled={loading || account.page === 0}>上一页</button><button className="ghost-btn small-btn" onClick={() => onQuery(account.page + 1)} disabled={loading || (account.page + 1) * account.size >= account.totalRecords}>下一页</button></div>
    </> : <EmptyState title="尚未查询用户账户" description="输入用户 ID 后再加载账户与流水。" />}
  </PanelSection>
}
