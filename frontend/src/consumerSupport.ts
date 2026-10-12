export function validSupportUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined
  } catch { return undefined }
}

export function timoSupportUrl(countryCode: string | undefined): string | undefined {
  const value = countryCode === 'ID' ? import.meta.env.VITE_TIMO_SUPPORT_URL_ID
    : countryCode === 'BR' ? import.meta.env.VITE_TIMO_SUPPORT_URL_BR : undefined
  return validSupportUrl(value)
}
