import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { InvitationRewardAccountResponse } from '../api'
import { adjustAdminInvitationAccount, getAdminAdjustmentPreview } from '../api'
import { formatDateTime } from '../shared/dateTime'
import { formatMoney } from '../shared/legacyFormatting'
import { EmptyState, InlineHint, PanelSection } from './LegacyPresentation'

type Props = {
  userId: string
  account: InvitationRewardAccountResponse | null
  loading: boolean
  onUserIdChange: (value: string) => void
  onQuery: (page: number) => void
  sessionToken?: string
}

export default function LegacyUserAccountSection({ userId, account, loading, onUserIdChange, onQuery, sessionToken }: Props) {
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
      {sessionToken ? <ManualAdjustment key={account.userId} account={account} userId={userId} sessionToken={sessionToken} loading={loading} onQuery={onQuery} /> : null}
      <InlineHint text="已解冻不代表当前可以提现。流水包括人工调整、邀请奖励入账、MCN 修订冲正与到期解冻；人工调整不计入分佣收入。" />
      <div className="admin-table-wrap top-gap"><table className="admin-table"><thead><tr><th>时间 UTC</th><th>类型 / 原因</th><th>平台 / 层级</th><th>来源用户</th><th>原始钻石</th><th>公司比例</th><th>公司收入</th><th>邀请比例</th><th>邀请奖励钻石</th><th>换算率</th><th>冻结变动</th><th>已解冻变动</th><th>来源编号</th></tr></thead><tbody>{account.items.map((flow) => <tr key={flow.id}><td>{formatDateTime(flow.recordedAt)}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '人工积分调整' : flow.type}<small className="table-subtle">{flow.reason}</small></td><td>{flow.platformCode}{flow.type === 'MANUAL_ADJUSTMENT' ? '' : ` / ${flow.rewardLevel}`}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '—' : flow.sourceUserId}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '—' : flow.rawDiamonds}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '—' : `${(flow.companyShareRate * 100).toFixed(2)}%`}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '—' : flow.companyIncomeDiamonds}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '—' : `${(flow.invitationRate * 100).toFixed(2)}%`}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '—' : flow.rewardDiamonds}</td><td>{flow.type === 'MANUAL_ADJUSTMENT' ? '—' : flow.pointsPerDiamond}</td><td>{flow.frozenDelta}</td><td>{flow.availableDelta}</td><td>{flow.sourceEventId}</td></tr>)}</tbody></table></div>
      <div className="table-toolbar compact-toolbar"><span>共 {account.totalRecords} 条</span><button className="ghost-btn small-btn" onClick={() => onQuery(account.page - 1)} disabled={loading || account.page === 0}>上一页</button><button className="ghost-btn small-btn" onClick={() => onQuery(account.page + 1)} disabled={loading || (account.page + 1) * account.size >= account.totalRecords}>下一页</button></div>
    </> : <EmptyState title="尚未查询用户账户" description="输入用户 ID 后再加载账户与流水。" />}
  </PanelSection>
}

function ManualAdjustment({account,userId,sessionToken,loading,onQuery}:{account:InvitationRewardAccountResponse;userId:string;sessionToken:string;loading:boolean;onQuery:(page:number)=>void}) {
  const [platform,setPlatform]=useState('')
  const [delta,setDelta]=useState('')
  const [reason,setReason]=useState('')
  const [adjusting,setAdjusting]=useState(false)
  const [message,setMessage]=useState('')
  const [preview,setPreview]=useState<{platformCode:string;availablePoints:number}|null>(null)
  useEffect(()=>{
    let active=true
    if (platform) void getAdminAdjustmentPreview(sessionToken,account.userId,platform).then(value=>{if(active)setPreview(value)}).catch(()=>{if(active)setMessage('无法读取该应用余额或没有操作权限。')})
    return ()=>{active=false}
  },[platform,sessionToken,account.userId,account.availablePoints])
  const requestId=useRef<string | null>(null)
  const resetId=()=>{requestId.current=null;setMessage('')}
  async function adjust() {
    if (!account || !sessionToken || account.userId!==Number(userId) || !platform || preview?.platformCode!==platform || !/^-?\d+(?:\.\d{1,6})?$/.test(delta) || Number(delta)===0 || !reason.trim()) {
      setMessage('请选择应用、填写非零积分数量和调整原因。'); return
    }
    if (!window.confirm(`确认调整用户 ${account.userId} 的 ${platform} 可用积分 ${delta}？可用余额允许为负。`)) return
    requestId.current ||= crypto.randomUUID()
    setAdjusting(true);setMessage('')
    try {
      await adjustAdminInvitationAccount(sessionToken,account.userId,{requestId:requestId.current,platformCode:platform,deltaPoints:delta,reason:reason.trim()})
      requestId.current=null;setDelta('');setReason('');setPreview(null);setMessage('调整已提交。');onQuery(0)
    } catch (err) { setMessage(err instanceof Error?err.message:'调整失败，请重试。') }
    finally { setAdjusting(false) }
  }
  return <div className="admin-filter-bar top-gap">
        <label>调整应用<select value={platform} onChange={e=>{setPreview(null);setPlatform(e.target.value);resetId()}}><option value="">请选择</option><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
        <label>调整积分（负数为扣减）<input value={delta} onChange={e=>{setDelta(e.target.value);resetId()}} placeholder="例如 100 或 -100" /></label>
        <label>调整原因<input maxLength={128} value={reason} onChange={e=>{setReason(e.target.value);resetId()}} /></label>
        {preview?.platformCode===platform ? <span>当前应用可用：{formatMoney(preview.availablePoints)} 积分</span> : null}
        <button className="primary-btn small-btn" type="button" disabled={adjusting||loading||!preview||preview.platformCode!==platform} onClick={()=>void adjust()}>{adjusting?'处理中':'调整积分'}</button>
        {message ? <span role="status">{message}</span> : null}
      </div>
}
