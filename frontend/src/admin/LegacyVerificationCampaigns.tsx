import { useEffect, useState } from 'react'
import { getVerificationCampaignAwards, getVerificationCampaigns, setVerificationCampaignEnabled, updateVerificationCampaignPoints, type VerificationAward, type VerificationCampaign } from '../api'
import { PanelSection } from './LegacyPresentation'
import { formatMoney } from '../shared/legacyFormatting'

export default function LegacyVerificationCampaigns({sessionToken}:{sessionToken:string}) {
  const [campaigns,setCampaigns]=useState<VerificationCampaign[]|null>(null)
  const [awards,setAwards]=useState<VerificationAward[]|null>(null)
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[version,setVersion]=useState(0)
  useEffect(()=>{let active=true;Promise.all([getVerificationCampaigns(sessionToken),getVerificationCampaignAwards(sessionToken)]).then(([c,a])=>{if(active){setCampaigns(c);setAwards(a);setError('')}}).catch(()=>{if(active)setError('加载活动失败，请检查权限或稍后重试。')});return()=>{active=false}},[sessionToken,version])
  async function toggle(c:VerificationCampaign){if(!window.confirm(`${c.enabled?'关闭':'开启'}「${c.name}」？${c.enabled?'已产生的奖励仍会处理。':'开启后，新通过核验的直属邀请将按此活动发奖；历史记录不会补发。'}`))return;setBusy(true);try{await setVerificationCampaignEnabled(sessionToken,c.id,!c.enabled);setVersion(v=>v+1)}catch(e){setError(e instanceof Error?e.message:'操作失败')}finally{setBusy(false)}}
  async function editPoints(c:VerificationCampaign){const value=window.prompt('请输入奖励积分（最多六位小数）',String(c.rewardPoints));if(value===null)return;if(!/^\d{1,12}(?:\.\d{1,6})?$/.test(value)||!/[1-9]/.test(value)){setError('奖励积分必须是正数，最多六位小数。');return}setBusy(true);try{await updateVerificationCampaignPoints(sessionToken,c.id,value);setVersion(v=>v+1)}catch(e){setError(e instanceof Error?e.message:'修改失败')}finally{setBusy(false)}}
  return <PanelSection sectionId="admin-verification-campaigns" eyebrow="Campaigns" title="活动任务管理" description="邀请人直接邀请的用户首次通过所选应用核验后，向邀请人发放积分；奖励按现有规则冻结。">
    <p>Timo 和 Linky 各有一项邀请核验奖励。请先设置奖励积分，再开启对应活动；活动开启前已通过核验的用户不自动补发，核验撤销不自动扣回。修改金额仅影响修改后的核验。</p>
    {error?<p role="alert">{error}</p>:null}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>活动名称</th><th>应用</th><th>每人奖励积分</th><th>状态</th><th>操作</th></tr></thead><tbody>{campaigns?.map(c=><tr key={c.id}><td>{c.platformCode === 'TIMO' ? 'Timo 邀请核验奖励' : 'Linky 邀请核验奖励'}</td><td>{c.platformCode}</td><td>{formatMoney(c.rewardPoints)}</td><td>{c.enabled?'已开启':'已关闭'}</td><td><button type="button" className="ghost-btn small-btn" disabled={busy} onClick={()=>void editPoints(c)}>修改积分</button><button type="button" className="ghost-btn small-btn" disabled={busy} onClick={()=>void toggle(c)}>{c.enabled?'关闭':'开启'}</button></td></tr>)}</tbody></table></div>{campaigns?.length===0?<p>暂无活动</p>:null}
    <h3>最近发放记录</h3><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>活动</th><th>邀请人 ID</th><th>被邀请人 ID</th><th>应用</th><th>积分</th><th>核验时间 UTC</th><th>状态</th></tr></thead><tbody>{awards?.map(a=><tr key={a.id}><td>{campaigns?.find(c=>c.id===a.campaignId)?.name||a.campaignId}</td><td>{a.inviterUserId}</td><td>{a.invitedUserId}</td><td>{a.platformCode}</td><td>{formatMoney(a.rewardPoints)}</td><td>{new Date(a.verifiedAt).toISOString().replace('T',' ').slice(0,19)}</td><td>{!a.awardedAt?'待处理':!a.releasedAt?'冻结中':'已解冻'}</td></tr>)}</tbody></table></div>{awards?.length===0?<p>暂无发放记录</p>:null}
  </PanelSection>
}
