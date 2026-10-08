import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  changeAdminPassword as legacyChangePassword,
  createAdminSession as legacyCreateSession,
  getCurrentAdminSession as legacyCurrentSession,
  logoutAdminSession as legacyLogout,
  logoutAllAdminSessions as legacyLogoutAll,
} from '../api'
import { changeAdminPassword, createAdminSession, getCurrentAdminSession, logoutAdminSession, logoutAllAdminSessions } from './authApi'

describe('admin session API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the old API exports bound to the shared implementation', () => {
    expect(legacyCreateSession).toBe(createAdminSession)
    expect(legacyCurrentSession).toBe(getCurrentAdminSession)
    expect(legacyLogout).toBe(logoutAdminSession)
    expect(legacyLogoutAll).toBe(logoutAllAdminSessions)
    expect(legacyChangePassword).toBe(changeAdminPassword)
  })

  it('preserves cookie-backed login and session restoration on the existing endpoint', async () => {
    const session = { sessionToken: 'session-token', username: 'admin', role: 'super_admin' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify(session) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(createAdminSession({ username: 'admin', password: 'example', rememberMe: true })).resolves.toEqual(session)
    await expect(getCurrentAdminSession()).resolves.toEqual(session)

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/admin/auth/session', expect.objectContaining({
      method: 'POST', credentials: 'include', body: JSON.stringify({ username: 'admin', password: 'example', rememberMe: true }),
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/admin/auth/session', expect.objectContaining({ credentials: 'include' }))
    expect(fetchMock.mock.calls[1][1].method).toBeUndefined()
  })

  it('preserves logout and password-change paths and request bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)

    await logoutAdminSession()
    await logoutAllAdminSessions()
    await changeAdminPassword({ currentPassword: 'old-example', newPassword: 'new-example' })

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/admin/auth/session/logout', '/admin/auth/session/logout-all', '/admin/auth/password',
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({ method: 'POST', credentials: 'include' }))
    }
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ currentPassword: 'old-example', newPassword: 'new-example' }))
  })
})
