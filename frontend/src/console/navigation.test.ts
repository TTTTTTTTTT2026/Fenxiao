import { describe, expect, it } from 'vitest'
import { allowedConsolePlatforms, availableConsoleRoutes, selectedConsoleRoute } from './navigation'

describe('new console permissions and routes', () => {
  it('uses the existing role menu visibility, without adding a new role policy', () => {
    expect(availableConsoleRoutes('admin').map((item) => item.key)).toEqual(['users', 'guilds', 'overview', 'grades', 'channel', 'risk', 'bindingRelation', 'rewardLedger', 'mySecurity', 'securityRecords'])
    expect(availableConsoleRoutes('operations').map((item) => item.key)).toEqual(['users', 'guilds', 'overview', 'grades', 'channel', 'risk', 'bindingRelation', 'mySecurity', 'securityRecords'])
    expect(availableConsoleRoutes('operator').map((item) => item.key)).toEqual(['users', 'guilds', 'overview', 'channel', 'risk', 'bindingRelation', 'mySecurity', 'securityRecords'])
    expect(availableConsoleRoutes('customer_support').map((item) => item.key)).toEqual(['users', 'overview', 'risk', 'bindingRelation', 'mySecurity', 'securityRecords'])
    expect(availableConsoleRoutes('finance').map((item) => item.key)).toEqual(['overview', 'commission', 'userAccounts', 'rewardLedger', 'mySecurity', 'securityRecords'])
    expect(availableConsoleRoutes('super_admin').map((item) => item.key)).toContain('commission')
    expect(availableConsoleRoutes('super_admin').map((item) => item.key)).toContain('userAccounts')
    expect(availableConsoleRoutes('admin').map((item) => item.key)).not.toContain('commission')
    expect(availableConsoleRoutes('admin').map((item) => item.key)).not.toContain('userAccounts')
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
    expect(selectedConsoleRoute('/console/commission', 'finance')?.key).toBe('commission')
    expect(selectedConsoleRoute('/console/commission', 'admin')).toBeNull()
    expect(selectedConsoleRoute('/console/user-accounts', 'finance')?.key).toBe('userAccounts')
    expect(selectedConsoleRoute('/console/user-accounts', 'admin')).toBeNull()
    expect(selectedConsoleRoute('/console/user-accounts', 'operator')).toBeNull()
    expect(selectedConsoleRoute('/console/risk', 'operator')?.key).toBe('risk')
    expect(selectedConsoleRoute('/console/risk', 'finance')).toBeNull()
    expect(selectedConsoleRoute('/console/my-security', 'finance')?.key).toBe('mySecurity')
    expect(selectedConsoleRoute('/console/security-records', 'customer_support')?.key).toBe('securityRecords')
    expect(selectedConsoleRoute('/console/reward-ledger', 'finance')?.key).toBe('rewardLedger')
    expect(selectedConsoleRoute('/console/reward-ledger', 'operations')).toBeNull()
    expect(selectedConsoleRoute('/console/bindings', 'operator')?.key).toBe('bindingRelation')
    expect(selectedConsoleRoute('/console/bindings', 'finance')).toBeNull()
    expect(selectedConsoleRoute('/console/unknown', 'admin')).toBeNull()
  })

  it('shows only platforms in the existing admin session data scope', () => {
    expect(allowedConsolePlatforms('*')).toEqual(['LINKY', 'TIMO'])
    expect(allowedConsolePlatforms('linky, other')).toEqual(['LINKY'])
    expect(allowedConsolePlatforms(' TIMO ')).toEqual(['TIMO'])
    expect(allowedConsolePlatforms('OTHER')).toEqual([])
  })
})
