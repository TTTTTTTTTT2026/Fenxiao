import { afterEach, describe, expect, it, vi } from 'vitest'
import * as legacyApi from '../api'
import * as accountApi from './accountSecurityApi'

describe('admin account and security API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the legacy exports bound to the one shared implementation', () => {
    for (const name of [
      'getAdminAccounts', 'createAdminAccount', 'updateAdminAccount', 'resetAdminPassword',
      'unlockAdminAccount', 'getAdminDeviceSessions', 'revokeAdminDeviceSession',
      'getMyAdminSecurityEvents',
    ] as const) {
      expect(legacyApi[name]).toBe(accountApi[name])
    }
  })

  it('preserves the read-only session and security event paths with cookies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '[]' })
    vi.stubGlobal('fetch', fetchMock)

    await accountApi.getAdminAccounts()
    await accountApi.getAdminDeviceSessions()
    await accountApi.getMyAdminSecurityEvents()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/admin/accounts', '/admin/accounts/me/sessions', '/admin/accounts/me/security-events',
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({ credentials: 'include' }))
      expect(init.method).toBeUndefined()
    }
  })

  it('preserves account mutation methods and payloads without a second client', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' })
    vi.stubGlobal('fetch', fetchMock)
    const createPayload = { username: 'operator', displayName: 'Operator', role: 'operator', platformScope: 'LINKY' }
    const updatePayload = { displayName: 'Operator 2', role: 'operator', enabled: true, regionScope: 'ID' }

    await accountApi.createAdminAccount(createPayload)
    await accountApi.updateAdminAccount(7, updatePayload)
    await accountApi.resetAdminPassword(7)
    await accountApi.unlockAdminAccount(7)
    await accountApi.revokeAdminDeviceSession(12)

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['/admin/accounts', 'POST'], ['/admin/accounts/7', 'PATCH'],
      ['/admin/accounts/7/reset-password', 'POST'], ['/admin/accounts/7/unlock', 'POST'],
      ['/admin/accounts/me/sessions/12', 'DELETE'],
    ])
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(createPayload))
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify(updatePayload))
    for (const [, init] of fetchMock.mock.calls) expect(init.credentials).toBe('include')
  })
})
