import { request } from '../httpClient'
export type DashboardPlatform = 'TIMO' | 'LINKY'
export type DashboardPeriod = 'today' | 'yesterday' | '7' | '30'
export type DashboardQuery = { platformCode: DashboardPlatform; countryCode: string; trendDays: 7 | 30; period: DashboardPeriod }
export type DashboardKind = 'REGISTERED'|'FIRST_VERIFIED'|'COHORT'|'PENDING'|'OVERDUE'|'REJECTED'|'WAITING'|'UNASSIGNED'|'INVITER'
export type DashboardDetail = {kind:DashboardKind;title:string;inviterId?:number;date?:string}
export type OperationsDashboardReport = {
 platformCode:DashboardPlatform;countryCode:string;generatedAt:string;refreshSeconds:number;
 summary:{registered:number;invited:number;cohortVerified:number;yesterdaySameTime:number;pending:number;overdue:number;rejected:number;waiting:number;unassigned:number};
 firstVerified:number|null;missingVerificationHistoryUsers:number;
 trend:Array<{date:string;registered:number;firstVerified:number|null}>;
 period:DashboardPeriod;periodStart:string;periodEnd:string;
 ranks:Array<{inviterId:number;nickname:string|null;registered:number;verified:number}>;countries:string[];
}
export type DashboardUsers={items:Array<{userId:number;nickname:string|null;countryCode:string;registeredAt:string;bindingStatus:string;operatorName:string|null;registrationInviterId:number|null}>;total:number;page:number;size:number;generatedAt:string}
export function getOperationsDashboard(sessionToken:string,query:DashboardQuery,signal?:AbortSignal){
 const search=new URLSearchParams({platformCode:query.platformCode,countryCode:query.countryCode,trendDays:String(query.trendDays),period:query.period});
 return request<OperationsDashboardReport>(`/admin/distribution/operations-dashboard?${search}`,{headers:{'X-Admin-Session':sessionToken},signal})
}
export function getOperationsDashboardUsers(sessionToken:string,query:DashboardQuery,detail:DashboardDetail,page:number,signal?:AbortSignal){
 const search=new URLSearchParams({platformCode:query.platformCode,countryCode:query.countryCode,period:query.period,kind:detail.kind,page:String(page),size:'20'});
 if(detail.inviterId!==undefined)search.set('inviterId',String(detail.inviterId));if(detail.date)search.set('date',detail.date);
 return request<DashboardUsers>(`/admin/distribution/operations-dashboard/users?${search}`,{headers:{'X-Admin-Session':sessionToken},signal})
}
