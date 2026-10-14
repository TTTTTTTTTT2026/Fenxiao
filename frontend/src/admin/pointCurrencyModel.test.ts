import { describe, expect, it, vi } from 'vitest'
import { formatPointCurrencyAmount, localPointCurrencyEffectiveAt, pointCurrencySavePayload, validPointCurrencyDecimal } from './pointCurrencyModel'

describe('point currency reference boundaries', () => {
  it('validates exact decimal fields without accepting exponents or currency strings', () => {
    expect(validPointCurrencyDecimal('0.00000001', 8, true)).toBe(true)
    expect(validPointCurrencyDecimal('0', 8, true)).toBe(false)
    expect(validPointCurrencyDecimal('0', 6, false)).toBe(true)
    for (const value of ['-1', '1e2', '1,2', 'NaN', 'Infinity', '1000000000000', '1.000000001']) expect(validPointCurrencyDecimal(value, 8, true)).toBe(false)
  })
  it('formats large exact monetary amounts without float rounding', () => {
    expect(formatPointCurrencyAmount('999999999999999999999999.01')).toBe('999,999,999,999,999,999,999,999.01')
    expect(formatPointCurrencyAmount('12.00')).toBe('12.00')
    expect(formatPointCurrencyAmount('invalid')).toBe('—')
  })
  it('uses explicit future instants or immediate blank input', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-14T12:00:00Z'))
      expect(localPointCurrencyEffectiveAt('')).toBeNull()
      expect(() => localPointCurrencyEffectiveAt('invalid')).toThrow()
      expect(() => localPointCurrencyEffectiveAt('2026-01-01T00:00')).toThrow()
      expect(new Date(localPointCurrencyEffectiveAt('2026-10-15T12:00')!).getTime()).toBeGreaterThan(Date.now())
    } finally { vi.useRealTimers() }
  })
  it('submits the actual native date-picker value rather than an older React state', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-14T12:00:00Z'))
      const form = new FormData()
      form.set('enabled', 'enabled'); form.set('rate', '170'); form.set('effectiveAt', '2026-10-15T16:00')
      const payload = pointCurrencySavePayload(form, 2)
      expect(payload.effectiveAt).toBe(new Date('2026-10-15T16:00').toISOString())
      expect(payload).toMatchObject({ enabled: true, currencyPerPoint: '170', expectedVersion: 2 })
      form.set('effectiveAt', ''); expect(pointCurrencySavePayload(form, 2).effectiveAt).toBeNull()
      form.set('enabled', 'disabled'); form.set('rate', ''); expect(pointCurrencySavePayload(form, 2).currencyPerPoint).toBeNull()
    } finally { vi.useRealTimers() }
  })
})
