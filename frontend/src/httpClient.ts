const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export class ApiRequestError extends Error {
  readonly requestId?: string

  constructor(message: string, requestId?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.requestId = requestId
  }
}

function extractErrorMessage(text: string, status: number): string {
  if (!text) return `request failed: ${status}`

  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string }
    if (parsed.message && parsed.message.trim()) return parsed.message
    if (parsed.error && parsed.error.trim()) return parsed.error
  } catch {
    // ignore non-json response
  }

  return text
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    let requestId: string | undefined
    try {
      const parsed = JSON.parse(text) as { requestId?: unknown }
      if (typeof parsed.requestId === 'string' && /^[0-9a-f-]{36}$/i.test(parsed.requestId)) {
        requestId = parsed.requestId
      }
    } catch {
      // Other endpoints may return a non-JSON error; keep the existing message behavior.
    }
    throw new ApiRequestError(extractErrorMessage(text, response.status), requestId)
  }

  if (response.status === 204) return undefined as T
  if (typeof response.text === 'function') {
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }
  return response.json() as Promise<T>
}
