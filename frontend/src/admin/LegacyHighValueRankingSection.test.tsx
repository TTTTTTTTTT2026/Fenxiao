import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import LegacyHighValueRankingSection from './LegacyHighValueRankingSection'
import { utcPeriodRange } from './highValueRankingModel'

describe('high-value ranking real-data screen', () => {
  it.each(['day', 'week', 'month'] as const)('renders the %s period with no synthetic rows', (period) => {
    const markup = renderToStaticMarkup(<LegacyHighValueRankingSection sessionToken="test-session" initialPeriod={period} />)
    expect(markup).toContain('高价值用户排行')
    expect(markup).toContain('id="admin-high-value-ranking"')
    expect(markup).toContain('请选择一个应用')
    expect(markup).toContain('国家／地区（必选）')
    expect(markup).toContain('排行依据')
    expect(markup).toContain(`type="${period === 'day' ? 'date' : period}"`)
    expect(markup).toContain('自身收入（分佣积分）')
    expect(markup).toContain('直接下级收入（裸钻）')
    expect(markup).toContain('新增裂变人数')
    expect(markup).not.toContain('DEMO-')
    expect(markup).not.toContain('演示数据')
  })

  it('uses UTC day, ISO week and month boundaries', () => {
    expect(utcPeriodRange('day', '2026-10-07')).toEqual({ start: '2026-10-07T00:00:00.000Z', end: '2026-10-07T23:59:59.999Z' })
    expect(utcPeriodRange('week', '2026-W41')).toEqual({ start: '2026-10-05T00:00:00.000Z', end: '2026-10-11T23:59:59.999Z' })
    expect(utcPeriodRange('month', '2026-02')).toEqual({ start: '2026-02-01T00:00:00.000Z', end: '2026-02-28T23:59:59.999Z' })
    expect(utcPeriodRange('week', '2026-W54')).toBeNull()
    expect(utcPeriodRange('day', '2026-02-31')).toBeNull()
  })

  it('defaults monthly selection to the previous UTC month on the 31st', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-31T23:50:00.000Z'))
      const markup = renderToStaticMarkup(<LegacyHighValueRankingSection sessionToken="test-session" initialPeriod="month" />)
      expect(markup).toContain('type="month" value="2026-09"')
    } finally {
      vi.useRealTimers()
    }
  })
})
