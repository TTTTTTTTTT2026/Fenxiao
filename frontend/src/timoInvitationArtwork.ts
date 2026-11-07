import type { ConsumerLocale } from './shared/catalog'

export const timoArtworkLocales: Record<ConsumerLocale, string> = {
  zh: '中文', id: 'Bahasa Indonesia', en: 'English', es: 'Español', pt: 'Português (Brasil)',
}

const apiBase = import.meta.env.VITE_API_BASE_URL || ''

export function timoInvitationArtworkUrl(locale: ConsumerLocale) {
  return `${apiBase}/api/distribution/content/timo-invitation/${locale}`
}

export async function replaceTimoInvitationArtwork(locale: ConsumerLocale, image: File, token: string) {
  const form = new FormData()
  form.append('image', image)
  const response = await fetch(`${apiBase}/admin/content/timo-invitation/${locale}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Admin-Session': token },
    body: form,
  })
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? '当前会话没有管理此图片的权限。'
    : response.status === 400 || response.status === 413 ? '请选择有效的 PNG 或 JPEG，文件不超过 1 MiB，单边不超过 2400 像素。'
      : '图片保存失败，请稍后重试。')
}
