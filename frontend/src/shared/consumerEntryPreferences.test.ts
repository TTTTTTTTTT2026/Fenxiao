import { afterEach, describe, expect, it, vi } from 'vitest'
import { CLIENT_COUNTRY_KEY, clientPhoneCountries, initialClientCountry, languageForLocale, suggestedClientCountry } from './consumerEntryPreferences'

afterEach(() => vi.unstubAllGlobals())

describe('consumer entry country suggestion', () => {
  it('prefers an allowed browser region, then locale, with Hong Kong as the neutral fallback', () => {
    expect(suggestedClientCountry('zh', ['zh-CN'])).toBe('CN')
    expect(suggestedClientCountry('en', ['en-US'])).toBe('HK')
    expect(suggestedClientCountry('id', [])).toBe('ID')
    expect(suggestedClientCountry('pt', [])).toBe('BR')
  })

  it('never replaces a manually selected country with browser or session inference', () => {
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => key === CLIENT_COUNTRY_KEY ? 'MX' : null }, navigator: { languages: ['id-ID'] } })
    expect(initialClientCountry('id', 'BR')).toBe('MX')
    expect(languageForLocale('es')).toBe('es-mx')
  })

  it('only opens the eight agreed regions, including their correct calling codes', () => {
    expect(clientPhoneCountries.map(({ countryCode, callingCode }) => [countryCode, callingCode])).toEqual([
      ['CN', '+86'], ['ID', '+62'], ['MX', '+52'], ['CO', '+57'], ['CL', '+56'], ['VE', '+58'], ['BR', '+55'], ['HK', '+852'],
    ])
  })

  it.each(['CO', 'CL', 'VE'] as const)('recognizes browser, saved choice and session country for %s', code => {
    expect(suggestedClientCountry('es', [`es-${code}`])).toBe(code)
    expect(suggestedClientCountry('es', [`es_${code}`])).toBe(code)
    vi.stubGlobal('window', { localStorage: { getItem: () => null }, navigator: { languages: [`es-${code}`] } })
    expect(initialClientCountry('es')).toBe(code)
    expect(initialClientCountry('es', code)).toBe(code)
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => key === CLIENT_COUNTRY_KEY ? code : null }, navigator: { languages: ['pt-BR'] } })
    expect(initialClientCountry('pt', 'BR')).toBe(code)
  })

  it('keeps neutral Spanish fallback and ignores unsupported saved countries', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => 'ZZ' }, navigator: { languages: ['es-AR'] } })
    expect(initialClientCountry('es', 'VE')).toBe('VE')
    expect(initialClientCountry('es')).toBe('MX')
    expect(suggestedClientCountry('es', ['es-419'])).toBe('MX')
  })
})
