import { afterEach, describe, expect, it, vi } from 'vitest'
import { getHighValueRanking } from './highValueRankingApi'

afterEach(() => vi.unstubAllGlobals())

describe('high-value ranking request', () => {
  it('sends a single application, period, country and admin session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ items: [] }) })
    vi.stubGlobal('fetch', fetchMock)
    await getHighValueRanking('session-token', {
      platformCode: 'TIMO', guildId: 'guild-1', countryCode: 'ID', period: 'week', periodValue: '2026-W40',
      operatorAdminId: 7, rankingMetric: 'DIRECT_RAW_DIAMONDS', page: 0, size: 20,
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/admin/distribution/high-value-ranking?')
    expect(url).toContain('platformCode=TIMO')
    expect(url).toContain('countryCode=ID')
    expect(url).toContain('rankingMetric=DIRECT_RAW_DIAMONDS')
    expect(init.headers['X-Admin-Session']).toBe('session-token')
  })
})
