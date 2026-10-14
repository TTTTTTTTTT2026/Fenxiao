import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LegacyPointCurrencySection, { PointCurrencyQuoteResult, PointCurrencySettingsTable } from './LegacyPointCurrencySection'
import type { PointCurrencyQuote, PointCurrencySetting } from './pointCurrencyApi'

const setting: PointCurrencySetting = { country: { countryCode: 'ID', countryName: '印度尼西亚', currencyCode: 'IDR', fractionDigits: 2 }, latestVersion: 0, current: null, scheduled: null }
const quote: PointCurrencyQuote = { referenceOnly: true, status: 'CONFIGURED', countryCode: 'ID', currencyCode: 'IDR', points: '100', currencyPerPoint: '150', amount: '15000.00', rateVersionId: 1, effectiveAt: '2026-10-14T12:00:00Z', evaluatedAt: '2026-10-14T13:00:00Z' }
describe('legacy point currency page', () => {
  it('renders a separate legacy section with reference boundaries and no fake data', () => {
    const html = renderToStaticMarkup(<LegacyPointCurrencySection sessionToken="test" />)
    expect(html).toContain('id="admin-point-currency-rates"')
    expect(html).toContain('积分货币汇率')
    expect(html).toContain('不修改积分，不开放提现')
    expect(html).toContain('按用户当前归属试算')
    expect(html).not.toContain('USD')
  })
  it('shows missing configuration explicitly, never a made-up zero or fallback dollar', () => {
    const html = renderToStaticMarkup(<PointCurrencySettingsTable settings={[setting]} onEdit={() => {}} onHistory={() => {}} />)
    expect(html).toContain('未配置')
    expect(html).toContain('IDR')
    expect(html).not.toContain('0.00')
  })
  it('uses the backend exact value and only the supplied current-country currency', () => {
    const html = renderToStaticMarkup(<PointCurrencyQuoteResult quote={quote} />)
    expect(html).toContain('15,000.00 IDR')
    expect(html).toContain('仅供参考')
    expect(html).not.toContain('USD')
    expect(renderToStaticMarkup(<PointCurrencyQuoteResult quote={{ ...quote, countryCode: 'BR', currencyCode: 'BRL', amount: '20.00' }} />)).toContain('20.00 BRL')
  })
  it('distinguishes no rate from zero points and rejects an unlabelled settlement response', () => {
    expect(renderToStaticMarkup(<PointCurrencyQuoteResult quote={{ ...quote, amount: null, status: 'NOT_CONFIGURED' }} />)).toContain('未配置汇率')
    expect(renderToStaticMarkup(<PointCurrencyQuoteResult quote={{ ...quote, amount: '0.00', points: '0' }} />)).toContain('0.00 IDR')
    expect(renderToStaticMarkup(<PointCurrencyQuoteResult quote={{ ...quote, referenceOnly: false }} />)).not.toContain('15,000')
  })
})
