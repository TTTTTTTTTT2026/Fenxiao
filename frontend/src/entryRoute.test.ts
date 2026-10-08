import { describe, expect, it } from 'vitest'
import { isNewAdminConsoleRoute } from './entryRoute'

describe('new management console entry', () => {
  it('accepts only the dedicated path on the management host', () => {
    expect(isNewAdminConsoleRoute('/console', 'bandeira.fandodo.online')).toBe(true)
    expect(isNewAdminConsoleRoute('/console/users', 'bandeira.fandodo.online')).toBe(true)
    expect(isNewAdminConsoleRoute('/console', '127.0.0.1')).toBe(true)
    expect(isNewAdminConsoleRoute('/admin', 'bandeira.fandodo.online')).toBe(false)
    expect(isNewAdminConsoleRoute('/admin/auth/session', 'bandeira.fandodo.online')).toBe(false)
    expect(isNewAdminConsoleRoute('/console-other', 'bandeira.fandodo.online')).toBe(false)
  })

  it('does not expose the console on consumer or partner hosts', () => {
    expect(isNewAdminConsoleRoute('/console', 'app.bandeira.fandodo.online')).toBe(false)
    expect(isNewAdminConsoleRoute('/console/users', 'partner.bandeira.fandodo.online')).toBe(false)
  })
})
