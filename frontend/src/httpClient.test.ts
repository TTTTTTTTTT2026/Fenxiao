import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError, request } from './httpClient'

describe('shared HTTP client boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps credentials, JSON content type and custom admin headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{"total":2}' })
    vi.stubGlobal('fetch', fetchMock)

    await expect(request<{ total: number }>('/admin/example', { headers: { 'X-Admin-Session': 'session' } })).resolves.toEqual({ total: 2 })
    expect(fetchMock).toHaveBeenCalledWith('/admin/example', expect.objectContaining({
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Session': 'session' },
    }))
  })

  it('keeps 204 and empty body responses as undefined', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 204 }).mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' }))
    await expect(request<void>('/admin/empty')).resolves.toBeUndefined()
    await expect(request<void>('/admin/empty-body')).resolves.toBeUndefined()
  })

  it('preserves the request reference and the old error message fallback', async () => {
    const requestId = '123e4567-e89b-42d3-a456-426614174000'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 403, text: async () => JSON.stringify({ message: 'denied', requestId }) }).mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' }))
    await expect(request('/admin/denied')).rejects.toMatchObject({ name: 'ApiRequestError', message: 'denied', requestId } satisfies Partial<ApiRequestError>)
    await expect(request('/admin/failed')).rejects.toMatchObject({ name: 'ApiRequestError', message: 'request failed: 500' })
  })
})
