import type { ConsumerLocale } from './catalog'

export function formatMoney(value?: number | null, locale?: ConsumerLocale) {
  if (value === undefined || value === null) return '--'
  const numberLocale = locale ? { zh: 'zh-CN', en: 'en-US', es: 'es-ES', id: 'id-ID', pt: 'pt-BR' }[locale] : 'en-US'
  return new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function normalizeLocalPhoneNumber(value: string, callingCode: string) {
  const normalized = value.replace(/\D/g, '')
  const dialDigits = callingCode.slice(1)
  return normalized.startsWith(dialDigits) ? normalized.slice(dialDigits.length) : normalized
}

export function formatPhoneNumber(callingCode: string, localNumber: string) {
  const digits = localNumber.replace(/\D/g, '')
  return digits ? `${callingCode}${digits}` : ''
}
