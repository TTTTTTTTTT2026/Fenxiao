import type { ConsumerLocale } from './catalog'
import { EXTERNAL_LOCALE_KEY } from './legacySession'

export type ClientCountryCode = 'CN' | 'ID' | 'MX' | 'BR' | 'HK'
export const CLIENT_COUNTRY_KEY = 'fenxiao-client-country'

const languageCountry: Record<ConsumerLocale, ClientCountryCode> = {
  zh: 'HK', en: 'HK', es: 'MX', id: 'ID', pt: 'BR',
}

export function suggestedClientCountry(locale: ConsumerLocale, browserLanguages: readonly string[] = []): ClientCountryCode {
  for (const language of browserLanguages) {
    const region = language.trim().toUpperCase().split(/[-_]/)[1]
    if (region === 'CN' || region === 'ID' || region === 'MX' || region === 'BR' || region === 'HK') return region
  }
  return languageCountry[locale]
}

export function initialClientCountry(locale: ConsumerLocale, sessionCountry?: string | null): ClientCountryCode {
  const manual = typeof window === 'undefined' ? null : window.localStorage.getItem(CLIENT_COUNTRY_KEY)
  if (manual === 'CN' || manual === 'ID' || manual === 'MX' || manual === 'BR' || manual === 'HK') return manual
  if (sessionCountry === 'CN' || sessionCountry === 'ID' || sessionCountry === 'MX' || sessionCountry === 'BR' || sessionCountry === 'HK') return sessionCountry
  if (typeof window !== 'undefined' && window.localStorage.getItem(EXTERNAL_LOCALE_KEY)) return suggestedClientCountry(locale)
  const languages = typeof window === 'undefined' ? [] : window.navigator?.languages?.length ? window.navigator.languages : [window.navigator?.language || '']
  return suggestedClientCountry(locale, languages)
}

export function languageForLocale(locale: ConsumerLocale): string {
  return { zh: 'zh-hk', en: 'en', es: 'es-mx', id: 'id', pt: 'pt-br' }[locale]
}
