import { describe, expect, it } from 'vitest'
import { allowedConsolePlatforms, availableConsoleRoutes, selectedConsoleRoute } from './navigation'

describe('new console permissions and routes', () => {
  it('uses the existing role menu visibility, without adding a new role policy', () => {
    expect(availableConsoleRoutes('admin').map((item) => item.key)).toEqual(['users', 'guilds', 'overview', 'grades', 'channel'])
    expect(availableConsoleRoutes('operations').map((item) => item.key)).toEqual(['users', 'guilds', 'overview', 'grades', 'channel'])
    expect(availableConsoleRoutes('operator').map((item) => item.key)).toEqual(['users', 'guilds', 'overview', 'channel'])
    expect(availableConsoleRoutes('customer_support').map((item) => item.key)).toEqual(['users', 'overview'])
    expect(availableConsoleRoutes('finance').map((item) => item.key)).toEqual(['overview'])
  })

  it('resolves the default route and denies paths absent from the role menu', () => {
    expect(selectedConsoleRoute('/console', 'operator')?.key).toBe('users')
    expect(selectedConsoleRoute('/console/guilds', 'operator')?.key).toBe('guilds')
    expect(selectedConsoleRoute('/console/guilds', 'customer_support')).toBeNull()
    expect(selectedConsoleRoute('/console/overview', 'finance')?.key).toBe('overview')
    expect(selectedConsoleRoute('/console/grades', 'operations')?.key).toBe('grades')
    expect(selectedConsoleRoute('/console/grades', 'finance')).toBeNull()
    expect(selectedConsoleRoute('/console/channel', 'operator')?.key).toBe('channel')
    expect(selectedConsoleRoute('/console/channel', 'finance')).toBeNull()
    expect(selectedConsoleRoute('/console/unknown', 'admin')).toBeNull()
  })

  it('shows only platforms in the existing admin session data scope', () => {
    expect(allowedConsolePlatforms('*')).toEqual(['LINKY', 'TIMO'])
    expect(allowedConsolePlatforms('linky, other')).toEqual(['LINKY'])
    expect(allowedConsolePlatforms(' TIMO ')).toEqual(['TIMO'])
    expect(allowedConsolePlatforms('OTHER')).toEqual([])
  })
})
