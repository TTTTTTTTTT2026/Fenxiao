import { afterEach, describe, expect, it, vi } from 'vitest'
import { CLIENT_COUNTRY_KEY, initialClientCountry, languageForLocale, suggestedClientCountry } from './consumerEntryPreferences'

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
})
