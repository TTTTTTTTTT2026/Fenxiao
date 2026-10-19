import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsumerDemoLeaderboardView } from './ConsumerDemoLeaderboard'
import { requireDemoSnapshot, type DemoSnapshot } from './consumerDemoLeaderboardApi'
import { isInternalLeaderboardPreview } from './consumerDemoLeaderboardPreview'

function snapshot(): DemoSnapshot {
  return {mode:'DEMO',currency:'USD',asOfDate:'2026-10-18',publishedAt:'2026-10-19T00:10:00Z',nextUpdateAt:'2026-10-20T00:10:00Z',stale:false,
    boards: (['DAY','WEEK','MONTH'] as const).map(period => ({period,startDate:'2026-10-18',endDate:'2026-10-18',items:Array.from({length:10},(_,i)=>({
      rank:i+1,personaId:`demo-${i}`,maskedNickname:'A***u',countryCode:i%2?'BR':'ID',avatarAssetId:'nature-001',amountUsd:`${40-i}.00`,invitationCount:3,
    }))}))}
}
describe('public demo leaderboard', () => {
  it('uses the explicit internal audience while every other build keeps public disclosure', () => {
    expect(isInternalLeaderboardPreview('internal-review')).toBe(true)
    for (const audience of [undefined, '', 'public', 'true', 'internal', 'INTERNAL-REVIEW']) {
      expect(isInternalLeaderboardPreview(audience)).toBe(false)
    }
  })
  it.each(['zh','en','es','id','pt'] as const)('hides disclosure copy only in the internal review view in %s', locale => {
    const html = renderToStaticMarkup(<ConsumerDemoLeaderboardView locale={locale} data={snapshot()} period="DAY" loading={false} failed={false} onPeriod={()=>{}} onRetry={()=>{}} internalPreview />)
    expect(html).not.toContain('demo-board-label')
    expect(html).not.toContain('demo-board-note')
    expect(html.match(/scope="row"/g)).toHaveLength(10)
    expect(html.match(/role="tab"/g)).toHaveLength(3)
    expect(html).toContain('2026-10-18')
    expect(requireDemoSnapshot(snapshot()).mode).toBe('DEMO')
  })
  it.each(['zh','en','es','id','pt'] as const)('keeps demo label, accessible tabs, 10 rows and USD caveat in %s', locale => {
    const html = renderToStaticMarkup(<ConsumerDemoLeaderboardView locale={locale} data={snapshot()} period="DAY" loading={false} failed={false} onPeriod={()=>{}} onRetry={()=>{}} />)
    expect(html).toContain('demo-board-label')
    expect(html).toContain('demo-board-note')
    expect(html.match(/scope="row"/g)).toHaveLength(10)
    expect(html.match(/role="tab"/g)).toHaveLength(3)
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('USD')
    expect(html).toContain('/demo-leaderboard/flags/br.svg')
    expect(html).toContain('/demo-leaderboard/avatars/nature-001-128.webp')
    expect(html).not.toContain('/users/')
  })
  it('shows no invented rows during loading or errors and gives retry', () => {
    const base = {locale:'zh' as const,data:null,period:'DAY' as const,onPeriod:()=>{},onRetry:()=>{}}
    const loading = renderToStaticMarkup(<ConsumerDemoLeaderboardView {...base} loading failed={false} />)
    const error = renderToStaticMarkup(<ConsumerDemoLeaderboardView {...base} loading={false} failed />)
    expect(loading).toContain('role="status"')
    expect(loading).not.toContain('<tbody>')
    expect(error).toContain('重试')
    expect(error).not.toContain('<tbody>')
    expect(error).toContain('示例榜单 · 非真实收益')
  })
  it('shows stale notice and dates instead of implying data is current', () => {
    const html = renderToStaticMarkup(<ConsumerDemoLeaderboardView locale="zh" data={{...snapshot(),stale:true}} period="MONTH" loading={false} failed={false} onPeriod={()=>{}} onRetry={()=>{}} />)
    expect(html).toContain('上一版示例')
    expect(html).toContain('2026-10-18')
    expect(html).toContain('aria-labelledby="demo-tab-MONTH"')
  })
  it('accepts only the demo schema, not real account data or malformed/unsorted lists', () => {
    expect(requireDemoSnapshot(snapshot()).mode).toBe('DEMO')
    for (const mutate of [
      (value:DemoSnapshot)=>{ value.mode='REAL' as 'DEMO' },
      (value:DemoSnapshot)=>{ value.currency='BRL' as 'USD' },
      (value:DemoSnapshot)=>{ value.boards.pop() },
      (value:DemoSnapshot)=>{ value.boards[0].items.pop() },
      (value:DemoSnapshot)=>{ value.boards[0].items[0].avatarAssetId='../../private' },
      (value:DemoSnapshot)=>{ value.boards[0].items[0].amountUsd='NaN' },
      (value:DemoSnapshot)=>{ value.boards[0].items[0].invitationCount=10000 },
      (value:DemoSnapshot)=>{ value.boards[0].items[0].amountUsd='0.00' },
    ]) { const value=snapshot();mutate(value);expect(()=>requireDemoSnapshot(value)).toThrow() }
  })
  it('accepts the ten new pinned avatar IDs and renders their local derivatives', () => {
    const value=snapshot()
    for (const board of value.boards) board.items.forEach((entry,index) => {
      entry.avatarAssetId=`${index%2 ? 'br' : 'id'}-${String(Math.floor(index/2)+1).padStart(3,'0')}`
    })
    expect(requireDemoSnapshot(value)).toBe(value)
    const html=renderToStaticMarkup(<ConsumerDemoLeaderboardView locale="zh" data={value} period="DAY" loading={false} failed={false} onPeriod={()=>{}} onRetry={()=>{}} internalPreview />)
    expect(new Set(value.boards[0].items.map(entry=>entry.avatarAssetId)).size).toBe(10)
    expect(html).toContain('/demo-leaderboard/avatars/id-001-128.webp')
    expect(html).toContain('/demo-leaderboard/avatars/br-005-256.webp 2x')
    expect(html).not.toContain('nature-001')
  })
})
