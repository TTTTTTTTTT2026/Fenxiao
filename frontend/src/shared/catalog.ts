export type ConsumerLocale = 'zh' | 'en' | 'es' | 'id' | 'pt'

export const phoneCountries = [
  { countryCode: 'BR', callingCode: '+55', names: { zh: '巴西', en: 'Brazil', es: 'Brasil', id: 'Brasil', pt: 'Brasil' } },
  { countryCode: 'ID', callingCode: '+62', names: { zh: '印度尼西亚', en: 'Indonesia', es: 'Indonesia', id: 'Indonesia', pt: 'Indonésia' } },
  { countryCode: 'CN', callingCode: '+86', names: { zh: '中国', en: 'China', es: 'China', id: 'Tiongkok', pt: 'China' } },
  { countryCode: 'HK', callingCode: '+852', names: { zh: '香港', en: 'Hong Kong', es: 'Hong Kong', id: 'Hong Kong', pt: 'Hong Kong' } },
  { countryCode: 'US', callingCode: '+1', names: { zh: '美国', en: 'United States', es: 'Estados Unidos', id: 'Amerika Serikat', pt: 'Estados Unidos' } },
  { countryCode: 'CA', callingCode: '+1', names: { zh: '加拿大', en: 'Canada', es: 'Canadá', id: 'Kanada', pt: 'Canadá' } },
  { countryCode: 'MX', callingCode: '+52', names: { zh: '墨西哥', en: 'Mexico', es: 'México', id: 'Meksiko', pt: 'México' } },
  { countryCode: 'CO', callingCode: '+57', names: { zh: '哥伦比亚', en: 'Colombia', es: 'Colombia', id: 'Kolombia', pt: 'Colômbia' } },
  { countryCode: 'AR', callingCode: '+54', names: { zh: '阿根廷', en: 'Argentina', es: 'Argentina', id: 'Argentina', pt: 'Argentina' } },
  { countryCode: 'CL', callingCode: '+56', names: { zh: '智利', en: 'Chile', es: 'Chile', id: 'Cile', pt: 'Chile' } },
  { countryCode: 'PE', callingCode: '+51', names: { zh: '秘鲁', en: 'Peru', es: 'Perú', id: 'Peru', pt: 'Peru' } },
  { countryCode: 'PH', callingCode: '+63', names: { zh: '菲律宾', en: 'Philippines', es: 'Filipinas', id: 'Filipina', pt: 'Filipinas' } },
  { countryCode: 'TH', callingCode: '+66', names: { zh: '泰国', en: 'Thailand', es: 'Tailandia', id: 'Thailand', pt: 'Tailândia' } },
  { countryCode: 'VN', callingCode: '+84', names: { zh: '越南', en: 'Vietnam', es: 'Vietnam', id: 'Vietnam', pt: 'Vietnã' } },
  { countryCode: 'MY', callingCode: '+60', names: { zh: '马来西亚', en: 'Malaysia', es: 'Malasia', id: 'Malaysia', pt: 'Malásia' } },
] as const

export function formatCountryNameZh(countryCode: string | null | undefined) {
  return phoneCountries.find((country) => country.countryCode === countryCode?.trim().toUpperCase())?.names.zh ?? '未识别国家'
}

const consumerUserGradeNames: Record<ConsumerLocale, Record<string, string>> = {
  zh: { NORMAL_MEMBER: '普通成员', NEW_STAR: '新星', SILVER: '银牌', GOLD: '金牌', PLATINUM: '铂金', DIAMOND: '钻石', BLACK_GOLD: '黑金' },
  en: { NORMAL_MEMBER: 'Member', NEW_STAR: 'Rising Star', SILVER: 'Silver', GOLD: 'Gold', PLATINUM: 'Platinum', DIAMOND: 'Diamond', BLACK_GOLD: 'Black Gold' },
  es: { NORMAL_MEMBER: 'Miembro', NEW_STAR: 'Nueva estrella', SILVER: 'Plata', GOLD: 'Oro', PLATINUM: 'Platino', DIAMOND: 'Diamante', BLACK_GOLD: 'Oro negro' },
  id: { NORMAL_MEMBER: 'Anggota', NEW_STAR: 'Bintang baru', SILVER: 'Perak', GOLD: 'Emas', PLATINUM: 'Platinum', DIAMOND: 'Berlian', BLACK_GOLD: 'Emas hitam' },
  pt: { NORMAL_MEMBER: 'Membro', NEW_STAR: 'Nova estrela', SILVER: 'Prata', GOLD: 'Ouro', PLATINUM: 'Platina', DIAMOND: 'Diamante', BLACK_GOLD: 'Ouro negro' },
}

export function formatConsumerUserGrade(gradeCode: string | null | undefined, locale: ConsumerLocale) {
  return consumerUserGradeNames[locale][gradeCode ?? 'NORMAL_MEMBER'] ?? consumerUserGradeNames[locale].NORMAL_MEMBER
}
