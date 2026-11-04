import { useEffect, useRef, useState, type FormEvent } from 'react'
import { setIndividualLinkyBindingTarget } from './userDirectoryApi'
import './LegacyAccountMaintenance.css'

export default function LinkyBindingTargetDialog({token,userId,onClose,onSaved}:{token:string;userId:number;onClose:()=>void;onSaved:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null)
  const [account,setAccount]=useState(''),[guild,setGuild]=useState(''),[invite,setInvite]=useState(''),[reason,setReason]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
  async function save(e:FormEvent){e.preventDefault();if(!/^\d{8}$/.test(account)||!/^\d{8}$/.test(guild)||!reason.trim())return
    if(!window.confirm(`确认仅为用户 ${userId} 设置 Linky 账号 ${account} 的本人绑定目标公会 ${guild}？`))return
    setBusy(true);setError('');try{await setIndividualLinkyBindingTarget(token,userId,{linkyAccount:account,guildId:guild,guildInviteCode:invite.trim(),reason:reason.trim()});onSaved()}catch(e){setError(e instanceof Error?e.message:'保存失败')}finally{setBusy(false)}
  }
  return <dialog ref={dialog} className="maintenance-dialog" aria-labelledby="linky-binding-target-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><form onSubmit={e=>void save(e)}>
    <h3 id="linky-binding-target-title">设置本人 Linky 绑定目标</h3><p>仅影响用户 #{userId} 的指定 Linky 账号，不更改其下级邀请路线；用户仍需通过 MCN 核验。</p>
    <label>Linky 账号（8 位数字）<input inputMode="numeric" value={account} onChange={e=>setAccount(e.target.value.replace(/\D/g,'').slice(0,8))} required /></label>
    <label>目标公会 ID（8 位数字）<input inputMode="numeric" value={guild} onChange={e=>setGuild(e.target.value.replace(/\D/g,'').slice(0,8))} required /></label>
    <label>公会邀请码（可选）<input maxLength={64} value={invite} onChange={e=>setInvite(e.target.value)} /></label>
    <label>设置原因<input maxLength={255} value={reason} onChange={e=>setReason(e.target.value)} required /></label>
    {error?<p role="alert">{error}</p>:null}<div className="maintenance-actions"><button className="ghost-btn" type="button" disabled={busy} onClick={onClose}>取消</button><button className="primary-btn" type="submit" disabled={busy||!/^\d{8}$/.test(account)||!/^\d{8}$/.test(guild)||!reason.trim()}>{busy?'保存中':'保存配置'}</button></div>
  </form></dialog>
}
