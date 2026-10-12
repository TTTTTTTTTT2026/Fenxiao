import { useEffect, useRef, useState } from 'react'
import { PanelSection } from './LegacyPresentation'
import { getOperationsDashboard, getOperationsDashboardUsers } from './operationsDashboardApi'
import type { DashboardDetail, DashboardPeriod, DashboardPlatform, DashboardQuery, DashboardUsers, OperationsDashboardReport } from './operationsDashboardApi'
import './LegacyOperationsDashboard.css'
import { dashboardRate } from './operationsDashboardFormatting'

const COUNTRIES:Record<string,string>={ALL:'全部国家',ID:'印度尼西亚',BR:'巴西',HK:'中国香港',CN:'中国大陆',US:'美国',MX:'墨西哥'}
const PERIODS:Array<{value:DashboardPeriod;label:string}>=[{value:'today',label:'今日'},{value:'yesterday',label:'昨日'},{value:'7',label:'近7天'},{value:'30',label:'近30天'}]
function utc(at:string){return at.replace('T',' ').replace(/(?:\.\d+)?Z$/,'').slice(0,19)+' UTC'}
function stateLabel(state:string){return ({UNBOUND:'未绑定',VERIFIED:'核验成功',VERIFYING:'核验中',REJECTED:'核验失败',UNKNOWN:'状态待确认'} as Record<string,string>)[state]||'状态待确认'}

export default function LegacyOperationsDashboard({sessionToken,product,onProductChange}:{sessionToken:string;product?:string;onProductChange:(product:DashboardPlatform)=>void}){
 const [country,setCountry]=useState('ALL');const [days,setDays]=useState<7|30>(7);const [period,setPeriod]=useState<DashboardPeriod>('today');
 const platform:DashboardPlatform=product==='LINKY'?'LINKY':'TIMO';
 const query:DashboardQuery={platformCode:platform,countryCode:country,trendDays:days,period};
 return <DashboardContent key={`${sessionToken}:${platform}:${country}:${days}:${period}`} sessionToken={sessionToken} query={query} onCountry={setCountry} onDays={setDays} onPeriod={setPeriod} onProductChange={onProductChange}/>
}
function DashboardContent({sessionToken,query,onCountry,onDays,onPeriod,onProductChange}:{sessionToken:string;query:DashboardQuery;onCountry:(country:string)=>void;onDays:(days:7|30)=>void;onPeriod:(period:DashboardPeriod)=>void;onProductChange:(product:DashboardPlatform)=>void}){
 const [result,setResult]=useState<{data:OperationsDashboardReport|null;error:string}>({data:null,error:''});
 const [revision,setRevision]=useState(0);const [auto,setAuto]=useState(true);const [detail,setDetail]=useState<DashboardDetail|null>(null);
 const {platformCode,countryCode,trendDays,period}=query;
 useEffect(()=>{const abort=new AbortController();void getOperationsDashboard(sessionToken,{platformCode,countryCode,trendDays,period},abort.signal).then(data=>{if(!abort.signal.aborted)setResult({data,error:''})}).catch(()=>{if(!abort.signal.aborted)setResult({data:null,error:'运营数据暂时无法加载，请刷新重试。'})});return()=>abort.abort()},[sessionToken,platformCode,countryCode,trendDays,period,revision]);
 useEffect(()=>{if(!auto)return;const timer=window.setInterval(()=>{if(document.visibilityState==='visible')setRevision(n=>n+1)},60000);return()=>window.clearInterval(timer)},[auto]);
 function refresh(){setResult({data:null,error:''});setRevision(n=>n+1)}
 const report=result.data;
 const countries=[...new Set(['ALL','ID','BR','HK',countryCode,...(report?.countries||[])])];
 return <PanelSection sectionId="admin-operations-dashboard" eyebrow="Operations dashboard" title="运营数据看板" description="UTC每日拉新、绑定与邀请进展；点击数字查看同口径用户。" action={<div className="opsdash-tools"><label className="checkbox-label"><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/>60秒自动刷新</label><button className="primary-btn" type="button" onClick={refresh}>刷新看板</button></div>}>
  <div className="opsdash">
   <div className="opsdash-filters"><label>归属国家<select aria-label="看板归属国家" value={countryCode} onChange={e=>onCountry(e.target.value)}>{countries.map(code=><option key={code} value={code}>{COUNTRIES[code]||code}</option>)}</select></label><label>绑定应用<select aria-label="看板绑定应用" value={platformCode} onChange={e=>onProductChange(e.target.value as DashboardPlatform)}><option value="TIMO">Timo</option><option value="LINKY">Linky</option></select></label><span>注册为全局口径；应用仅筛选核验和绑定。统计时区 UTC+0。</span></div>
   <div className="opsdash-meta">{report?`数据更新时间：${utc(report.generatedAt)}（最长60秒缓存）`:result.error?'数据未加载':'正在读取运营数据…'}</div>
   {result.error?<div className="opsdash-error" role="alert">{result.error} 未把异常显示为0。<button className="ghost-btn" onClick={refresh}>重新加载</button></div>:!report?<div className="opsdash-empty" role="status">正在加载看板…</div>:<DashboardBody report={report} onDetail={setDetail} onDays={onDays} onPeriod={onPeriod} trendDays={trendDays}/>}
   {detail&&<DashboardUserDialog key={`${detail.kind}:${detail.inviterId||''}:${detail.date||''}`} sessionToken={sessionToken} query={query} detail={detail} onClose={()=>setDetail(null)}/>}
  </div>
 </PanelSection>
}

export function DashboardBody({report,onDetail,onDays,onPeriod,trendDays}:{report:OperationsDashboardReport;onDetail:(detail:DashboardDetail)=>void;onDays:(days:7|30)=>void;onPeriod:(period:DashboardPeriod)=>void;trendDays:7|30}){
 const m=report.summary;const platform=report.platformCode==='TIMO'?'Timo':'Linky';
 const comparison=m.yesterdaySameTime?`${((m.registered-m.yesterdaySameTime)/m.yesterdaySameTime*100).toFixed(1)}%`:'—';
 const max=Math.max(10,...report.trend.flatMap(d=>[d.registered,d.firstVerified||0]));
 const queues=[{kind:'OVERDUE',title:'注册超24小时，未完成任意应用绑定',n:m.overdue,hint:'全局 · 优先联系邀请人'},{kind:'REJECTED',title:'核验失败或异常，需要协助',n:m.rejected,hint:platform+' · 运营协助排查'},{kind:'WAITING',title:'核验等待超24小时',n:m.waiting,hint:platform+' · 当前进入核验中以来'},{kind:'UNASSIGNED',title:'尚未分配对接运营',n:m.unassigned,hint:'当前归属 · 避免无人负责'}] as const;
 return <>
  {report.missingVerificationHistoryUsers>0&&<div className="opsdash-warning" role="status">{report.missingVerificationHistoryUsers} 位已绑定用户缺少可确定首次成功时间的历史记录，首次核验数字和趋势暂不可确认；不猜测日期或显示假的0。当前绑定状态仍可查看。</div>}
  <div className="opsdash-metrics">
   <Metric title="今日新增注册" value={String(m.registered)} hint={`${m.invited}位通过邀请注册；较昨日同时段 ${comparison}`} onClick={()=>onDetail({kind:'REGISTERED',title:'今日新增注册用户'})}/>
   <Metric title={`今日首次核验成功 · ${platform}`} value={report.firstVerified==null?'—':String(report.firstVerified)} hint="可能包含此前注册、今日首次核验成功的用户" disabled={report.firstVerified==null} onClick={()=>onDetail({kind:'FIRST_VERIFIED',title:'今日首次核验成功'})}/>
   <Metric title="今日注册用户绑定完成率" value={dashboardRate(m.cohortVerified,m.registered)} hint={`${m.cohortVerified} / ${m.registered} 位今日新人已核验 ${platform}`} onClick={()=>onDetail({kind:'COHORT',title:'今日新人绑定进展'})}/>
   <Metric title="当前核验中" value={String(m.pending)} hint={`当前存量，其中超24小时 ${m.waiting}位`} onClick={()=>onDetail({kind:'PENDING',title:'当前核验中用户'})}/>
  </div>
  <section className="opsdash-card"><header><div><h3>每日新增趋势</h3><p>注册与首次核验为不同事件口径，不直接相除；今日为截至更新时间的部分数据。</p></div><div className="opsdash-tabs">{([7,30] as const).map(d=><button key={d} className={d===trendDays?'is-active':''} onClick={()=>onDays(d)}>近{d}天</button>)}</div></header>
   <div className="opsdash-card-body"><div className="opsdash-legend"><span>■ 新增注册</span><span>■ {platform}首次核验成功{report.firstVerified==null?'（暂不可确认）':''}</span></div>
    <svg className="opsdash-chart" viewBox="0 0 1000 165" role="img" aria-label={`近${trendDays}天每日新增趋势`} preserveAspectRatio="none">
     {[0,.5,1].map(v=><g key={v}><line x1="32" x2="985" y1={132-v*105} y2={132-v*105} stroke="#e7e5e4"/><text x="25" y={136-v*105} textAnchor="end" fill="#a8a29e" fontSize="11">{Math.round(max*v)}</text></g>)}
     {report.trend.map((d,i)=>{const x=40+i*(930/trendDays),w=Math.min(28,930/trendDays*.3);return <g key={d.date}><rect x={x} y={132-d.registered/max*105} width={w} height={d.registered/max*105} fill="#e95f2f" rx="2"/>{d.firstVerified!=null&&<rect x={x+w+3} y={132-d.firstVerified/max*105} width={w} height={d.firstVerified/max*105} fill="#4caaa1" rx="2"/>}{(trendDays===7||i%5===0||i===trendDays-1)&&<text x={x+w} y="153" textAnchor="middle" fill="#78716c" fontSize="11">{d.date.slice(5)}</text>}<title>{`${d.date}：注册${d.registered}；首次核验${d.firstVerified??'暂不可确认'}`}</title></g>})}
    </svg><details><summary>查看每日数字</summary><div className="opsdash-days">{report.trend.map(d=><button key={d.date} onClick={()=>onDetail({kind:'REGISTERED',title:`${d.date} 新增注册`,date:d.date})}>{d.date} · {d.registered}注册 / {d.firstVerified??'—'}首次核验</button>)}</div></details>
   </div>
  </section>
  <div className="opsdash-lower">
   <section className="opsdash-card"><header><div><h3>邀请 Top 10</h3><p>按期间新增直属邀请注册人数排序；不含间接下级。</p></div><div className="opsdash-tabs">{PERIODS.map(p=><button key={p.value} className={report.period===p.value?'is-active':''} onClick={()=>onPeriod(p.value)}>{p.label}</button>)}</div></header><div className="opsdash-card-body"><p className="opsdash-note">{utc(report.periodStart)} 至 {utc(report.periodEnd)}（不含终点）· 被邀请人国家：{COUNTRIES[report.countryCode]||report.countryCode}</p>
    <div className="opsdash-table"><table><thead><tr><th>排名</th><th>邀请人</th><th>新增邀请注册</th><th>已绑定 {platform}</th><th>绑定完成率</th></tr></thead><tbody>{report.ranks.map((r,i)=><tr key={r.inviterId}><td>{i+1}</td><td>{r.nickname||'—'}<small>ID {r.inviterId}</small></td><td><button className="opsdash-number" aria-label={`查看邀请人${r.inviterId}的用户`} onClick={()=>onDetail({kind:'INVITER',title:`${r.nickname||r.inviterId} 的直属邀请用户`,inviterId:r.inviterId})}>{r.registered}</button></td><td>{r.verified}</td><td>{dashboardRate(r.verified,r.registered)}</td></tr>)}</tbody></table></div>
    {!report.ranks.length&&<div className="opsdash-empty">暂无邀请注册记录</div>}<p className="opsdash-note">按注册时邀请记录归因；已绑定统计同批用户截至更新时间的状态。今日新人尚有转化时间，不直接作为绩效评分。</p></div></section>
   <section className="opsdash-card"><header><div><h3>需要跟进</h3><p>当前存量 · 点击查看名单</p></div></header><div className="opsdash-card-body">{queues.map(q=><button key={q.kind} className="opsdash-follow" onClick={()=>onDetail({kind:q.kind,title:q.title})}><span>{q.title}<small>{q.hint}</small></span><strong>{q.n}</strong><span>›</span></button>)}<p className="opsdash-note">同一用户可能进入多个待办，人数不能相加；当前负责人不代表历史绩效归属。</p></div></section>
  </div>
 </>
}
function Metric({title,value,hint,onClick,disabled=false}:{title:string;value:string;hint:string;onClick:()=>void;disabled?:boolean}){return <button className="opsdash-metric" disabled={disabled} onClick={onClick}><span>{title}</span><strong>{value}</strong><small>{hint}</small></button>}

function DashboardUserDialog({sessionToken,query,detail,onClose}:{sessionToken:string;query:DashboardQuery;detail:DashboardDetail;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);const [page,setPage]=useState(0);const [result,setResult]=useState<{page:number;data:DashboardUsers|null;error:string}|null>(null);
 const {platformCode,countryCode,period}=query;const {kind,inviterId,date}=detail;
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close()},[]);
 useEffect(()=>{const abort=new AbortController();void getOperationsDashboardUsers(sessionToken,{platformCode,countryCode,period,trendDays:7},{kind,title:'',inviterId,date},page,abort.signal).then(data=>{if(!abort.signal.aborted)setResult({page,data,error:''})}).catch(()=>{if(!abort.signal.aborted)setResult({page,data:null,error:'用户名单暂时无法加载，请重新打开。'})});return()=>abort.abort()},[sessionToken,platformCode,countryCode,period,kind,inviterId,date,page]);
 const data=result?.page===page?result.data:null;const error=result?.page===page?result.error:'';
 return <dialog ref={dialog} className="opsdash-dialog" aria-labelledby="opsdash-dialog-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="opsdash-dialog-inner"><header><h3 id="opsdash-dialog-title">{detail.title}</h3><button className="ghost-btn" onClick={onClose}>关闭名单</button></header><p className="opsdash-note">名单实时读取，人数可能与最近一次看板快照略有差异。只读，不发起核验或消息。</p>
  {error?<p role="alert">{error}</p>:!data?<p role="status">正在加载用户名单…</p>:<><div className="opsdash-table"><table><thead><tr><th>用户昵称 / ID</th><th>归属国家</th><th>注册时间（UTC）</th><th>{platformCode}绑定状态</th><th>对接运营（当前）</th><th>注册邀请人ID</th></tr></thead><tbody>{data.items.map(u=><tr key={u.userId}><td>{u.nickname||'—'}<small>ID {u.userId}</small></td><td>{COUNTRIES[u.countryCode]||u.countryCode}</td><td>{utc(u.registeredAt)}</td><td>{stateLabel(u.bindingStatus)}</td><td>{u.operatorName||'未分配'}</td><td>{u.registrationInviterId??'—'}</td></tr>)}</tbody></table></div>{!data.items.length&&<div className="opsdash-empty">暂无用户</div>}<div className="opsdash-pagination"><span>共{data.total}位 · 第{page+1}页 · 每页20位</span><button className="ghost-btn" disabled={page===0} onClick={()=>setPage(n=>n-1)}>上一页</button><button className="ghost-btn" disabled={(page+1)*20>=data.total} onClick={()=>setPage(n=>n+1)}>下一页</button></div></>}
 </div></dialog>
}
