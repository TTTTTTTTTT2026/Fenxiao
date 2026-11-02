import { useEffect, useRef, useState, type FormEvent } from 'react'
import { adjustAdminInvitationAccount, getAdminAdjustmentPreview, getManualAdjustmentRecords, getManualAdjustmentUser, type ManualAdjustmentRecord } from '../api'
import { formatMoney } from '../shared/legacyFormatting'
import { PanelSection } from './LegacyPresentation'
import './LegacyAccountMaintenance.css'

type UserInfo = {userId:number;nickname:string|null;countryCode:string}
type Preview = {platformCode:string;availablePoints:number}

export default function LegacyAccountMaintenance({sessionToken}:{sessionToken:string}) {
  const [page,setPage]=useState(0)
  const [revision,setRevision]=useState(0)
  const [records,setRecords]=useState<{items:ManualAdjustmentRecord[];hasMore:boolean}|null>(null)
  const [error,setError]=useState('')
  const [open,setOpen]=useState(false)
  useEffect(()=>{let active=true;void getManualAdjustmentRecords(sessionToken,page).then(data=>{if(active){setRecords(data);setError('')}}).catch(()=>{if(active){setRecords(null);setError('维护记录加载失败，请重试。')}});return()=>{active=false}},[sessionToken,page,revision])
  return <PanelSection sectionId="admin-account-maintenance" eyebrow="Account maintenance" title="账目维护" description="查看人工积分调整记录，按用户和应用维护可用积分。">
    <div className="maintenance-toolbar"><button className="primary-btn small-btn" type="button" onClick={()=>setOpen(true)}>调账</button><button className="ghost-btn small-btn" type="button" onClick={()=>setRevision(n=>n+1)}>刷新记录</button></div>
    {error ? <p role="alert">{error}</p> : !records ? <p role="status">正在加载维护记录…</p> : <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>时间 UTC</th><th>用户 ID</th><th>昵称</th><th>国家</th><th>应用</th><th>方向</th><th>调整积分</th><th>调整前</th><th>调整后</th><th>原因</th><th>操作人</th></tr></thead><tbody>{records.items.map(item=><tr key={item.id}><td>{new Date(item.createdAt).toISOString().replace('T',' ').slice(0,19)}</td><td>{item.userId}</td><td>{item.nickname||'—'}</td><td>{item.countryCode||'—'}</td><td>{item.platformCode}</td><td>{item.deltaPoints>0?'增加':'减少'}</td><td>{formatMoney(Math.abs(item.deltaPoints))}</td><td>{formatMoney(item.beforeAvailable)}</td><td>{formatMoney(item.afterAvailable)}</td><td>{item.reason}</td><td>{item.actorName||'—'}</td></tr>)}</tbody></table></div>{records.items.length===0?<p>暂无维护记录</p>:null}<div className="table-toolbar compact-toolbar"><span>第 {page+1} 页</span><button className="ghost-btn small-btn" disabled={page===0} onClick={()=>setPage(p=>p-1)}>上一页</button><button className="ghost-btn small-btn" disabled={!records.hasMore} onClick={()=>setPage(p=>p+1)}>下一页</button></div></>}
    {open?<AdjustmentDialog token={sessionToken} onClose={()=>setOpen(false)} onSaved={()=>{setOpen(false);setPage(0);setRevision(n=>n+1)}}/>:null}
  </PanelSection>
}

function AdjustmentDialog({token,onClose,onSaved}:{token:string;onClose:()=>void;onSaved:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),requestId=useRef<string|null>(null)
  const [userId,setUserId]=useState(''),[user,setUser]=useState<UserInfo|null>(null),[userError,setUserError]=useState('')
  const [platform,setPlatform]=useState(''),[preview,setPreview]=useState<Preview|null>(null)
  const [direction,setDirection]=useState(''),[amount,setAmount]=useState(''),[reason,setReason]=useState('')
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
  useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close()},[])
  useEffect(()=>{
    const id=userId.trim();if(!/^\d+$/.test(id)||!Number.isSafeInteger(Number(id))||Number(id)<=0)return
    let active=true;const timer=window.setTimeout(()=>{void getManualAdjustmentUser(token,id).then(info=>{if(active){setUser(info);setUserError('')}}).catch(()=>{if(active){setUser(null);setUserError('用户不存在或无权查看。')}})},300)
    return()=>{active=false;window.clearTimeout(timer)}
  },[token,userId])
  useEffect(()=>{
    if(!user||String(user.userId)!==userId.trim()||!platform)return
    let active=true;void getAdminAdjustmentPreview(token,user.userId,platform).then(result=>{if(active)setPreview(result)}).catch(()=>{if(active){setPreview(null);setMessage('无法读取该应用余额或无操作权限。')}})
    return()=>{active=false}
  },[token,user,userId,platform])
  function changed(){requestId.current=null;setMessage('')}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(!user||String(user.userId)!==userId.trim()||!platform||preview?.platformCode!==platform||!direction||!/^\d{1,12}(?:\.\d{1,6})?$/.test(amount)||!/[1-9]/.test(amount)||!reason.trim()) {setMessage('请确认用户、应用、方向、积分数量和调整原因。');return}
    const delta=direction==='subtract'?`-${amount}`:amount
    if(!window.confirm(`确认${direction==='subtract'?'扣减':'增加'}用户 ${user.userId} 的 ${platform} 积分 ${amount}？扣减后余额可以为负。`))return
    requestId.current ||= crypto.randomUUID();setBusy(true);setMessage('')
    try{await adjustAdminInvitationAccount(token,user.userId,{requestId:requestId.current,platformCode:platform,deltaPoints:delta,reason:reason.trim()});onSaved()}catch(err){setMessage(err instanceof Error?err.message:'调整失败，请重试。')}finally{setBusy(false)}
  }
  return <dialog ref={dialog} className="maintenance-dialog" aria-labelledby="maintenance-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><form onSubmit={event=>void submit(event)}><h3 id="maintenance-title">账目维护</h3>
    <label>用户 ID<input inputMode="numeric" value={userId} onChange={e=>{setUserId(e.target.value);setUser(null);setPreview(null);setUserError('');changed()}} placeholder="输入用户 ID，自动查询" /></label>
    <div className="maintenance-user" role="status">{user&&String(user.userId)===userId.trim()?`用户：${user.nickname||'未设置昵称'} · ID ${user.userId} · 国家 ${user.countryCode}`:userError||'输入用户 ID 后自动加载用户信息'}</div>
    <label>归属应用<select value={platform} onChange={e=>{setPlatform(e.target.value);setPreview(null);changed()}}><option value="">请选择应用</option><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label>
    {preview?.platformCode===platform?<p>当前应用可用积分：{formatMoney(preview.availablePoints)}</p>:null}
    <label>调整方向<select value={direction} onChange={e=>{setDirection(e.target.value);changed()}}><option value="">请选择方向</option><option value="add">增加</option><option value="subtract">减少</option></select></label>
    <label>积分数量<input inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);changed()}} placeholder="请输入正数" /></label>
    <label>调整原因<input maxLength={128} value={reason} onChange={e=>{setReason(e.target.value);changed()}} placeholder="请填写原因" /></label>
    <p>调整立即生效；减少时余额可以为负数。</p>{message?<p role="alert">{message}</p>:null}
    <div className="maintenance-actions"><button className="ghost-btn" type="button" disabled={busy} onClick={onClose}>取消</button><button className="primary-btn" type="submit" disabled={busy||!user||preview?.platformCode!==platform||!direction||!/^\d{1,12}(?:\.\d{1,6})?$/.test(amount)||!/[1-9]/.test(amount)||!reason.trim()}>{busy?'处理中':'确认调账'}</button></div>
  </form></dialog>
}
