export type PartnerLanguage = 'zh' | 'en' | 'id' | 'pt' | 'es'

export const partnerPhoneCountries = [
  { countryCode: 'CN', callingCode: '+86', names: { zh: '中国', en: 'China', id: 'Tiongkok', pt: 'China', es: 'China' } },
  { countryCode: 'ID', callingCode: '+62', names: { zh: '印度尼西亚', en: 'Indonesia', id: 'Indonesia', pt: 'Indonésia', es: 'Indonesia' } },
  { countryCode: 'MX', callingCode: '+52', names: { zh: '墨西哥', en: 'Mexico', id: 'Meksiko', pt: 'México', es: 'México' } },
  { countryCode: 'BR', callingCode: '+55', names: { zh: '巴西', en: 'Brazil', id: 'Brasil', pt: 'Brasil', es: 'Brasil' } },
  { countryCode: 'HK', callingCode: '+852', names: { zh: '香港', en: 'Hong Kong', id: 'Hong Kong', pt: 'Hong Kong', es: 'Hong Kong' } },
] as const

export function normalizePartnerLocalPhone(value: string, callingCode: string) {
  const digits = value.replace(/\D/g, '')
  const prefix = callingCode.slice(1)
  return value.trim().startsWith('+') && digits.startsWith(prefix) ? digits.slice(prefix.length) : digits
}

export function formatPartnerPhone(callingCode: string, localPhone: string) {
  const digits = localPhone.replace(/\D/g, '')
  return digits ? `${callingCode}${digits}` : ''
}
