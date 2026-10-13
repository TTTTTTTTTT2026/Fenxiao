import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ConsumerPhoneCountrySelect from './ConsumerPhoneCountrySelect'
import { consumerPhoneFormCopy, phoneCodeActionText } from './consumerPhoneFormCopy'
import { partnerPhoneCountries } from './partnerPhone'
import { formatPhoneNumber, normalizeLocalPhoneNumber } from './shared/legacyFormatting'

describe('compact consumer phone controls', () => {
  it.each(['zh', 'en', 'es', 'id', 'pt'] as const)('preserves named country options and a short visible prefix in %s', locale => {
    const html = renderToStaticMarkup(<ConsumerPhoneCountrySelect countries={partnerPhoneCountries} value="BR" locale={locale} label="Country" onChange={() => {}} />)
    expect(html).toContain(`aria-label="Country: ${partnerPhoneCountries[3].names[locale]} +55"`)
    expect(html).toContain('aria-hidden="true">+55')
    expect(html).toContain(`>${partnerPhoneCountries[1].names[locale]} +62</option>`)
    expect(html).toContain('value="BR" selected=""')
    expect(phoneCodeActionText(locale, 30, false, true)).toBe('30s')
    expect(phoneCodeActionText(locale, 0, true, false)).toBe(consumerPhoneFormCopy[locale].sending)
    expect(phoneCodeActionText(locale, 0, false, false)).toBe(consumerPhoneFormCopy[locale].send)
    expect(phoneCodeActionText(locale, 0, false, true)).toBe(consumerPhoneFormCopy[locale].resend)
    expect(consumerPhoneFormCopy[locale].inviteHint.length).toBeGreaterThan(0)
  })
  it('keeps the full Hong Kong prefix and existing phone normalization', () => {
    const html = renderToStaticMarkup(<ConsumerPhoneCountrySelect countries={partnerPhoneCountries} value="HK" locale="pt" label="País" onChange={() => {}} />)
    expect(html).toContain('Hong Kong +852')
    expect(html).toContain('aria-hidden="true">+852')
    expect(formatPhoneNumber('+55', normalizeLocalPhoneNumber('00000000000', '+55'))).toBe('+5500000000000')
  })
  it('uses concise Portuguese actions and lets the countdown end at zero', () => {
    expect(phoneCodeActionText('pt', 1, false, true)).toBe('1s')
    expect(phoneCodeActionText('pt', 0, false, true)).toBe('Reenviar')
    expect(consumerPhoneFormCopy.pt.submit).toBe('Entrar')
  })
})
