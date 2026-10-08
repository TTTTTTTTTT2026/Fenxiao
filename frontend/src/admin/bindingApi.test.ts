import { afterEach, describe, expect, it, vi } from 'vitest'
import * as legacyApi from '../api'
import * as bindingApi from './bindingApi'

describe('admin binding API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('preserves the old exports as aliases to one shared implementation', () => {
    expect(legacyApi.getAdminRelation).toBe(bindingApi.getAdminRelation)
    expect(legacyApi.adjustAdminRelation).toBe(bindingApi.adjustAdminRelation)
    expect(legacyApi.getAdminOwnership).toBe(bindingApi.getAdminOwnership)
    expect(legacyApi.correctAdminOwnership).toBe(bindingApi.correctAdminOwnership)
  })

  it('keeps relation lookups scoped by product and mutations on the same paths', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' })
    vi.stubGlobal('fetch', fetchMock)

    await bindingApi.getAdminRelation('session', 17, 'LINKY')
    await bindingApi.adjustAdminRelation('session', 17, { level1InviterId: 12, note: 'verified' }, 'LINKY')
    await bindingApi.getAdminOwnership('session', 17)
    await bindingApi.correctAdminOwnership('session', 17, { productCode: 'LINKY', note: 'verified' })

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['/admin/distribution/relation/17?product=LINKY', undefined],
      ['/admin/distribution/relation/17/adjustments?product=LINKY', 'POST'],
      ['/admin/distribution/ownership/17', undefined],
      ['/admin/distribution/ownership/17/corrections', 'POST'],
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session' }) }))
    }
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ level1InviterId: 12, note: 'verified' }))
    expect(fetchMock.mock.calls[3][1].body).toBe(JSON.stringify({ productCode: 'LINKY', note: 'verified' }))
  })
})
