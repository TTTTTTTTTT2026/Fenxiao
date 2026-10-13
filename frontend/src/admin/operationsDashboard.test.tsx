import { afterEach,describe,expect,it,vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { canUseOperationsDashboard,legacyDashboardLanding } from './operationsDashboardAccess'
import { DashboardBody } from './LegacyOperationsDashboard'
import { dashboardRate, trendDayDescription } from './operationsDashboardFormatting'
import { getOperationsDashboard,getOperationsDashboardUsers } from './operationsDashboardApi'
import DashboardAutoRefresh from './DashboardAutoRefresh'
import OperationsTrendChart from './OperationsTrendChart'
import type { OperationsDashboardReport } from './operationsDashboardApi'
const fixture:OperationsDashboardReport={platformCode:'TIMO',countryCode:'ALL',generatedAt:'2026-10-12T09:00:00Z',refreshSeconds:60,summary:{registered:2,invited:2,cohortVerified:1,yesterdaySameTime:1,pending:3,overdue:4,rejected:5,waiting:2,unassigned:1},firstVerified:3,missingVerificationHistoryUsers:0,trend:[{date:'2026-10-12',registered:2,firstVerified:3}],period:'today',periodStart:'2026-10-12T00:00:00',periodEnd:'2026-10-12T09:00:00',ranks:[{inviterId:123,nickname:null,registered:2,verified:1,phoneNumber:null,countryCode:null,operatorName:null}],countries:['ID','BR']}
afterEach(()=>vi.unstubAllGlobals())
describe('legacy operations dashboard',()=>{
 it('defaults only legacy eligible sessions and preserves deep links',()=>{expect(legacyDashboardLanding('',true)).toBe('operationsDashboard');expect(legacyDashboardLanding('',false)).toBe('overview');expect(legacyDashboardLanding('#admin-users',true)).toBe('users');expect(legacyDashboardLanding('#admin-overview',true)).toBe('overview')})
 it('mirrors restricted-scope and role gates without expanding permissions',()=>{expect(canUseOperationsDashboard({role:'super_admin',platformScope:'*',guildScope:'*',regionScope:'*'})).toBe(true);expect(canUseOperationsDashboard({role:'operations',platformScope:'TIMO'})).toBe(false);expect(canUseOperationsDashboard({role:'admin',guildScope:'g1'})).toBe(false);expect(canUseOperationsDashboard({role:'admin',regionScope:'ID'})).toBe(false);expect(canUseOperationsDashboard({role:'mentor'})).toBe(false);expect(canUseOperationsDashboard(null)).toBe(false)})
 it('renders correct cohort denominator instead of first-success / registrations',()=>{const html=renderToStaticMarkup(<DashboardBody report={fixture} onDetail={()=>{}} onTrendPeriod={()=>{}} onPeriod={()=>{}} trendPeriod="7"/>);expect(html).toContain('50.0%');expect(html).not.toContain('150.0%');expect(html).toContain('邀请 Top 10');expect(html).toContain('同一用户可能进入多个待办');expect(html).not.toContain('虚拟数据')})
 it('never renders false zero from missing history or zero denominator',()=>{const html=renderToStaticMarkup(<DashboardBody report={{...fixture,firstVerified:null,missingVerificationHistoryUsers:1,trend:[{date:'2026-10-12',registered:2,firstVerified:null}]}} onDetail={()=>{}} onTrendPeriod={()=>{}} onPeriod={()=>{}} trendPeriod="7"/>);expect(html).toContain('暂不可确认');expect(html).toContain('disabled');expect(dashboardRate(0,0)).toBe('—')})
 it('uses authenticated read-only APIs with exact application/country/paging and abort support',async()=>{const fetch=vi.fn().mockResolvedValue({ok:true,status:200,text:async()=>JSON.stringify(fixture)});vi.stubGlobal('fetch',fetch);const abort=new AbortController();const query={platformCode:'TIMO' as const,countryCode:'ID',trendDays:7 as const,period:'today' as const};await getOperationsDashboard('test-session',query,abort.signal);expect(fetch.mock.calls[0][0]).toBe('/admin/distribution/operations-dashboard?platformCode=TIMO&countryCode=ID&trendDays=7&period=today');expect(fetch.mock.calls[0][1]).toMatchObject({credentials:'include',headers:{'X-Admin-Session':'test-session'},signal:abort.signal});await getOperationsDashboardUsers('test-session',query,{kind:'INVITER',title:'',inviterId:123},1);expect(fetch.mock.calls[1][0]).toContain('kind=INVITER&page=1&size=20&inviterId=123');expect(fetch.mock.calls.every(call=>!call[1].method||call[1].method==='GET')).toBe(true)})
 it('renders all shortcuts with an accessible selected range and keeps today cards unchanged',()=>{
  for(const trendPeriod of ['today','yesterday','3'] as const){
   const html=renderToStaticMarkup(<DashboardBody report={fixture} onDetail={()=>{}} onTrendPeriod={()=>{}} onPeriod={()=>{}} trendPeriod={trendPeriod}/>);
   expect(html).toContain('aria-label="趋势统计周期"');expect(html).toContain('今日');expect(html).toContain('昨日');expect(html).toContain('最近3日');expect(html).toContain('aria-pressed="true"');expect(html).toContain('今日新增注册');expect(html).toContain('50.0%');
  }
 })
 it('sends trend shortcuts independently from the ranking period and keeps the three-day detail range',async()=>{
  const fetch=vi.fn().mockResolvedValue({ok:true,status:200,text:async()=>JSON.stringify(fixture)});vi.stubGlobal('fetch',fetch);
  for(const trendPeriod of ['today','yesterday','3'] as const){
   await getOperationsDashboard('test-session',{platformCode:'LINKY',countryCode:'BR',trendDays:7,trendPeriod,period:'3'});
   const search=new URL(String(fetch.mock.calls.at(-1)?.[0]),'http://localhost').searchParams;
   expect(search.get('trendPeriod')).toBe(trendPeriod);expect(search.get('period')).toBe('3');expect(search.get('platformCode')).toBe('LINKY');expect(search.get('countryCode')).toBe('BR');
  }
  await getOperationsDashboardUsers('test-session',{platformCode:'TIMO',countryCode:'ID',trendDays:7,period:'3'},{kind:'INVITER',title:'',inviterId:123},0);
  expect(String(fetch.mock.calls.at(-1)?.[0])).toContain('period=3&kind=INVITER');
 })
 it('renders a labelled switch in both states rather than a wrapping checkbox',()=>{
  for(const checked of [true,false]){
   const html=renderToStaticMarkup(<DashboardAutoRefresh checked={checked} onChange={()=>{}}/>);
   expect(html).toContain('role="switch"');expect(html).toContain(`aria-checked="${checked}"`);expect(html).toContain('60秒自动刷新');expect(html).not.toContain('type="checkbox"');
  }
 })
 it('uses current distributor metadata and keeps invitation numbers and detail action',()=>{
  const report={...fixture,ranks:[{...fixture.ranks[0],nickname:'合成分销用户',phoneNumber:'+5500000000000',countryCode:'BR',operatorName:'合成运营'}]};
  const html=renderToStaticMarkup(<DashboardBody report={report} onDetail={()=>{}} onTrendPeriod={()=>{}} onPeriod={()=>{}} trendPeriod="7"/>);
  expect(html).toContain('<th>分销用户</th>');expect(html).not.toContain('<th>邀请人</th>');expect(html).toContain('+5500000000000');expect(html).toContain('巴西');expect(html).toContain('合成运营');expect(html).toContain('对接运营（当前）');expect(html).toContain('查看分销用户123的直属邀请');expect(html).toContain('50.0%');
  const missing=renderToStaticMarkup(<DashboardBody report={fixture} onDetail={()=>{}} onTrendPeriod={()=>{}} onPeriod={()=>{}} trendPeriod="7"/>);
  expect(missing).toContain('手机号 -');expect(missing).not.toContain('undefined');
 })
 it('provides focusable date hit areas for hover, zero data and unknown verification',()=>{
  const days=[{date:'2026-10-12',registered:0,firstVerified:null},{date:'2026-10-13',registered:2,firstVerified:1}];
  const html=renderToStaticMarkup(<OperationsTrendChart days={days} platform="Linky" label="最近3日"/>);
  expect(html).toContain('tabindex="0"');expect(html).toContain('opsdash-chart-highlight');expect(html).toContain('2026-10-12：新增注册 0；Linky 首次核验成功 暂不可确认');expect(html).not.toContain('role="tooltip"');
  expect(trendDayDescription(days[0],'Timo')).toContain('暂不可确认');expect(trendDayDescription({...days[0],firstVerified:0},'Timo')).toContain('首次核验成功 0');
 })
})
