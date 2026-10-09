import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import LegacyHighValueRankingSection from './LegacyHighValueRankingSection'
import { utcPeriodRange } from './highValueRankingModel'

describe('high-value ranking local prototype', () => {
  it.each(['day', 'week', 'month'] as const)('renders the %s period within one page, with a single-application gate and demo warning', (period) => {
    const markup = renderToStaticMarkup(<LegacyHighValueRankingSection initialPeriod={period} />)
    expect(markup).toContain('高价值用户排行')
    expect(markup).toContain('id="admin-high-value-ranking"')
    expect(markup).toContain('aria-label="高价值用户排行周期"')
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain('全部为演示数据')
    expect(markup).toContain('未连接真实收益')
    expect(markup).toContain(`type="${period === 'day' ? 'date' : period}"`)
    for (const label of ['应用（必选）', '请选择一个应用', '公会', '对接运营', '国家／地区（必选）', '排行依据', '自身收入（分佣积分）', '直接下级收入（裸钻）', '新增裂变人数']) expect(markup).toContain(label)
    expect(markup).not.toContain('DEMO-1003')
    expect(markup).not.toContain('下级累计收入')
    expect(markup).not.toContain('间接下级收入')
    expect(markup).toContain('统计周期末的用户价值标签')
    expect(markup).toContain('UTC')
  })

  it('sorts the same application-only demo rows by each selected ranking metric', () => {
    const self = renderToStaticMarkup(<LegacyHighValueRankingSection initialPlatform="LINKY" initialMetric="selfCommission" />)
    const direct = renderToStaticMarkup(<LegacyHighValueRankingSection initialPlatform="LINKY" initialMetric="directRawDiamonds" />)
    const invites = renderToStaticMarkup(<LegacyHighValueRankingSection initialPlatform="LINKY" initialMetric="newInvitees" />)
    expect(self.indexOf('DEMO-1003')).toBeLessThan(self.indexOf('DEMO-1001'))
    expect(direct.indexOf('DEMO-1001')).toBeLessThan(direct.indexOf('DEMO-1003'))
    expect(invites.indexOf('DEMO-1002')).toBeLessThan(invites.indexOf('DEMO-1001'))
    expect(self).toContain('MCN 已确认裸钻')
    expect(self).toContain('分佣积分')
  })

  it('uses UTC calendar boundaries for days, ISO weeks and months', () => {
    expect(utcPeriodRange('day', '2026-10-07')).toEqual({ start: '2026-10-07T00:00:00.000Z', end: '2026-10-07T23:59:59.999Z' })
    expect(utcPeriodRange('week', '2026-W41')).toEqual({ start: '2026-10-05T00:00:00.000Z', end: '2026-10-11T23:59:59.999Z' })
    expect(utcPeriodRange('month', '2026-02')).toEqual({ start: '2026-02-01T00:00:00.000Z', end: '2026-02-28T23:59:59.999Z' })
    expect(utcPeriodRange('week', '2026-W54')).toBeNull()
    expect(utcPeriodRange('day', '2026-02-31')).toBeNull()
  })

  it('defaults the monthly review to the previous UTC month even on the 31st', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-31T23:50:00.000Z'))
      const markup = renderToStaticMarkup(<LegacyHighValueRankingSection initialPeriod="month" />)
      expect(markup).toContain('type="month" value="2026-09"')
    } finally {
      vi.useRealTimers()
    }
  })
})
