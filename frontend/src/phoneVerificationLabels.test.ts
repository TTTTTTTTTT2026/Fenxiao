import { describe, expect, it } from 'vitest'
import { formatPhoneVerificationPurpose, formatPhoneVerificationStatus } from './phoneVerificationLabels'

describe('phone verification audit labels', () => {
  it('shows the login and registration purpose in Chinese', () => {
    expect(formatPhoneVerificationPurpose('LOGIN')).toBe('登录/注册')
  })

  it('shows each verification code status in Chinese', () => {
    expect(formatPhoneVerificationStatus('ACTIVE')).toBe('有效中')
    expect(formatPhoneVerificationStatus('CONSUMED')).toBe('已使用')
    expect(formatPhoneVerificationStatus('EXPIRED')).toBe('已过期')
  })

  it('retains unknown codes for operations troubleshooting', () => {
    expect(formatPhoneVerificationPurpose('RESET_PASSWORD')).toBe('其他用途（RESET_PASSWORD）')
    expect(formatPhoneVerificationStatus('REVOKED')).toBe('未知状态（REVOKED）')
    expect(formatPhoneVerificationPurpose('')).toBe('未记录')
    expect(formatPhoneVerificationStatus('')).toBe('未记录')
  })
})
