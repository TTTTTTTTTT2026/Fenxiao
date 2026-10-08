import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminPlatformIntegrations as legacyIntegrations, getAdminPlatformVerificationRuntime as legacyRuntime } from '../api'
import { getAdminPlatformIntegrations, getAdminPlatformVerificationRuntime } from './platformReadApi'

describe('admin platform read API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the legacy exports bound to the same implementation', () => {
    expect(legacyIntegrations).toBe(getAdminPlatformIntegrations)
    expect(legacyRuntime).toBe(getAdminPlatformVerificationRuntime)
  })

  it('preserves the original global GET paths and session headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '[]' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminPlatformIntegrations('session')
    await getAdminPlatformVerificationRuntime('session')

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['/admin/platform-integrations', undefined],
      ['/admin/platform-verification', undefined],
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session' }) }))
    }
  })
})
