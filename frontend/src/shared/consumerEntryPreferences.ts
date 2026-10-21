import { phoneCountries, type ConsumerLocale } from './catalog'
import { EXTERNAL_LOCALE_KEY } from './legacySession'

export const CLIENT_COUNTRY_CODES = ['CN', 'ID', 'MX', 'CO', 'CL', 'VE', 'BR', 'HK'] as const
export type ClientCountryCode = (typeof CLIENT_COUNTRY_CODES)[number]
export const clientPhoneCountries = CLIENT_COUNTRY_CODES.map(code =>
  phoneCountries.find((country): country is (typeof phoneCountries)[number] & { countryCode: ClientCountryCode } => country.countryCode === code)!)
export const CLIENT_COUNTRY_KEY = 'fenxiao-client-country'

function isClientCountryCode(value: string | null | undefined): value is ClientCountryCode {
  return CLIENT_COUNTRY_CODES.some(code => code === value)
}

const languageCountry: Record<ConsumerLocale, ClientCountryCode> = {
  zh: 'HK', en: 'HK', es: 'MX', id: 'ID', pt: 'BR',
}

export function suggestedClientCountry(locale: ConsumerLocale, browserLanguages: readonly string[] = []): ClientCountryCode {
  for (const language of browserLanguages) {
    const region = language.trim().toUpperCase().split(/[-_]/)[1]
    if (isClientCountryCode(region)) return region
  }
  return languageCountry[locale]
}

export function initialClientCountry(locale: ConsumerLocale, sessionCountry?: string | null): ClientCountryCode {
  const manual = typeof window === 'undefined' ? null : window.localStorage.getItem(CLIENT_COUNTRY_KEY)
  if (isClientCountryCode(manual)) return manual
  if (isClientCountryCode(sessionCountry)) return sessionCountry
  if (typeof window !== 'undefined' && window.localStorage.getItem(EXTERNAL_LOCALE_KEY)) return suggestedClientCountry(locale)
  const languages = typeof window === 'undefined' ? [] : window.navigator?.languages?.length ? window.navigator.languages : [window.navigator?.language || '']
  return suggestedClientCountry(locale, languages)
}

export function languageForLocale(locale: ConsumerLocale): string {
  return { zh: 'zh-hk', en: 'en', es: 'es-mx', id: 'id', pt: 'pt-br' }[locale]
}
