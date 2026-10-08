import { describe, expect, it } from 'vitest'
import { canViewUserList, userListFilters } from './userListModel'

describe('new console user list', () => {
  it('uses the existing admin menu permission model', () => {
    expect(canViewUserList('super_admin')).toBe(true)
    expect(canViewUserList('admin')).toBe(true)
    expect(canViewUserList('operator')).toBe(true)
    expect(canViewUserList('operations')).toBe(true)
    expect(canViewUserList('finance')).toBe(false)
    expect(canViewUserList('customer_support')).toBe(true)
    expect(canViewUserList('mentor')).toBe(true)
    expect(canViewUserList('unknown_role')).toBe(false)
  })

  it('preserves the zero-based backend pagination and approved page sizes', () => {
    expect(userListFilters({ userId: ' 1001 ', current: 2, pageSize: 50 }))
      .toEqual({ userId: 1001, page: 1, size: 50 })
    expect(userListFilters({ current: 1, pageSize: 20 }))
      .toEqual({ userId: undefined, page: 0, size: 20 })
    expect(userListFilters({ current: 0, pageSize: 900 }))
      .toEqual({ userId: undefined, page: 0, size: 20 })
  })

  it('rejects invalid user IDs instead of requesting a different user', () => {
    expect(() => userListFilters({ userId: '1x' })).toThrow('用户 ID 只能输入数字')
    expect(() => userListFilters({ userId: '999999999999999999999' })).toThrow('用户 ID 超出有效范围')
  })
})
