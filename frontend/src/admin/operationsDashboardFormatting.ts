import type { OperationsDashboardReport } from './operationsDashboardApi'
export function dashboardRate(numerator:number,denominator:number){return denominator===0?'—':`${(numerator/denominator*100).toFixed(1)}%`}
export function trendDayDescription(day: OperationsDashboardReport['trend'][number], platform: string) {
 return `${day.date}：新增注册 ${day.registered}；${platform} 首次核验成功 ${day.firstVerified ?? '暂不可确认'}`
}
