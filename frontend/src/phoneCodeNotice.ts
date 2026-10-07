type ConsumerLocale = 'zh' | 'en' | 'es' | 'id' | 'pt'

const internalCopy: Record<ConsumerLocale, { hint: (ttlMinutes: number) => string; success: string }> = {
  zh: {
    hint: (ttlMinutes) => `验证码已生成，请联系运营人员获取；${ttlMinutes} 分钟内有效。`,
    success: '验证码已生成，请联系运营人员获取。',
  },
  en: {
    hint: (ttlMinutes) => `A code is ready for internal review. Contact support to obtain it within ${ttlMinutes} minutes.`,
    success: 'A code is ready for internal review. Contact support to obtain it.',
  },
  es: {
    hint: (ttlMinutes) => `El código se generó para revisión interna. Contacta al equipo de soporte para obtenerlo antes de ${ttlMinutes} minutos.`,
    success: 'El código se generó para revisión interna. Contacta al equipo de soporte para obtenerlo.',
  },
  id: {
    hint: (ttlMinutes) => `Kode siap untuk pemeriksaan internal. Hubungi tim dukungan untuk mendapatkannya dalam ${ttlMinutes} menit.`,
    success: 'Kode siap untuk pemeriksaan internal. Hubungi tim dukungan untuk mendapatkannya.',
  },
  pt: {
    hint: (ttlMinutes) => `O código foi gerado para consulta interna. Entre em contato com o suporte para obtê-lo em até ${ttlMinutes} minutos.`,
    success: 'O código foi gerado para consulta interna. Entre em contato com o suporte para obtê-lo.',
  },
}

export function internalPhoneCodeNotice(locale: ConsumerLocale, ttlMinutes: number) {
  const copy = internalCopy[locale]
  return { hint: copy.hint(ttlMinutes), success: copy.success }
}
