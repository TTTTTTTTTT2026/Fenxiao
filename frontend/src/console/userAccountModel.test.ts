import { describe, expect, it } from 'vitest'
import { parseAccountUserId } from './userAccountModel'

describe('finance user account query', () => {
  it('accepts only a safe positive integer user ID', () => {
    expect(parseAccountUserId(' 1001 ')).toBe(1001)
    for (const invalid of ['', '0', '-1', '+1', '1.2', '1e3', '12abc', '9007199254740992']) {
      expect(parseAccountUserId(invalid)).toBeNull()
    }
  })
})
