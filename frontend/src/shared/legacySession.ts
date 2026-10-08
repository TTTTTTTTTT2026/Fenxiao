import type { ProfileResponse } from '../api'

export type SessionState = {
  userId: number
  inviteCode: string
  countryCode: string
  languageCode: string
  accessToken: string
}

export const STORAGE_KEY = 'fenxiao-web-session'
export const EXTERNAL_LOCALE_KEY = 'fenxiao-external-locale'

export function loadExternalLocale(): 'zh' | 'en' | 'es' | 'id' | 'pt' {
  if (typeof window === 'undefined') return 'zh'
  const value = window.localStorage.getItem(EXTERNAL_LOCALE_KEY)?.trim().toLowerCase().split(/[-_]/)[0]
  if (value === 'zh' || value === 'en' || value === 'es' || value === 'id' || value === 'pt') return value
  return 'zh'
}

export function loadJsonState<T>(key: string): T | null {
  const storage = typeof window !== 'undefined'
    ? window.localStorage
    : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null
  const raw = storage?.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveUserSession(profile: ProfileResponse): SessionState {
  const session: SessionState = {
    userId: profile.userId,
    inviteCode: profile.inviteCode,
    countryCode: profile.countryCode,
    languageCode: profile.languageCode,
    accessToken: profile.accessToken,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}
