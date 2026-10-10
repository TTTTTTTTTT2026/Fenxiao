import { afterEach, describe, expect, it, vi } from 'vitest'
import { EXTERNAL_LOCALE_KEY, loadExternalLocale, loadJsonState, saveUserSession, STORAGE_KEY } from './legacySession'

afterEach(() => vi.unstubAllGlobals())

describe('legacy session shared by consumer and admin entries', () => {
  it('retains a valid browser session and ignores malformed stored JSON', () => {
    const values = new Map<string, string>([
      [STORAGE_KEY, JSON.stringify({ userId: 7, accessToken: 'example' })],
      ['malformed', '{'],
    ])
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => values.get(key) ?? null } })
    expect(loadJsonState<{ userId: number }>(STORAGE_KEY)?.userId).toBe(7)
    expect(loadJsonState('malformed')).toBeNull()
  })

  it('normalizes a saved external locale', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => 'pt-BR' } })
    expect(EXTERNAL_LOCALE_KEY).toBe('fenxiao-external-locale')
    expect(loadExternalLocale()).toBe('pt')
  })

  it('uses the browser language when there is no saved choice', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null }, navigator: { languages: ['id-ID', 'en-US'] } })
    expect(loadExternalLocale()).toBe('id')
  })

  it('saves the existing consumer session shape', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', { setItem: (key: string, value: string) => values.set(key, value) })
    const profile = { userId: 7, inviteCode: 'TEST', countryCode: 'BR', languageCode: 'pt', accessToken: 'example' }
    expect(saveUserSession(profile as Parameters<typeof saveUserSession>[0])).toEqual(profile)
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(profile)
  })
})
