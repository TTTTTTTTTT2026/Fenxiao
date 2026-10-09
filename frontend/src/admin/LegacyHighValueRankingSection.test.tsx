import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LegacyHighValueRankingSection from './LegacyHighValueRankingSection'
import { utcPeriodRange } from './highValueRankingModel'

describe('high-value ranking local prototype', () => {
  it.each(['day', 'week', 'month'] as const)('renders the %s page with its distinct period picker and a clear demo warning', (period) => {
    const markup = renderToStaticMarkup(<LegacyHighValueRankingSection period={period} />)
    expect(markup).toContain('高价值用户排行')
    expect(markup).toContain('全部为演示数据')
    expect(markup).toContain('未连接真实收益')
    expect(markup).toContain(`type="${period === 'day' ? 'date' : period}"`)
    for (const label of ['应用', '公会', '对接运营', '国家／地区（必选）', '自身收入', '直接下级收入', '间接下级收入', '下级累计收入', '新增直属下级']) expect(markup).toContain(label)
    expect(markup.indexOf('DEMO-1003')).toBeLessThan(markup.indexOf('DEMO-1001'))
    expect(markup).toContain('统计周期末的用户价值标签')
    expect(markup).toContain('UTC')
  })

  it('uses UTC calendar boundaries for days, ISO weeks and months', () => {
    expect(utcPeriodRange('day', '2026-10-07')).toEqual({ start: '2026-10-07T00:00:00.000Z', end: '2026-10-07T23:59:59.999Z' })
    expect(utcPeriodRange('week', '2026-W41')).toEqual({ start: '2026-10-05T00:00:00.000Z', end: '2026-10-11T23:59:59.999Z' })
    expect(utcPeriodRange('month', '2026-02')).toEqual({ start: '2026-02-01T00:00:00.000Z', end: '2026-02-28T23:59:59.999Z' })
    expect(utcPeriodRange('week', '2026-W54')).toBeNull()
    expect(utcPeriodRange('day', '2026-02-31')).toBeNull()
  })
})
