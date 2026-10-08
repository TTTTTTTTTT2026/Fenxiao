import { describe, expect, it } from 'vitest'
import { formatConsumerUserGrade, formatCountryNameZh, phoneCountries } from './catalog'

describe('shared user catalog presentation', () => {
  it('keeps the existing country list and Chinese admin labels', () => {
    expect(phoneCountries.find((country) => country.countryCode === 'ID')?.callingCode).toBe('+62')
    expect(formatCountryNameZh(' id ')).toBe('印度尼西亚')
    expect(formatCountryNameZh('HK')).toBe('香港')
    expect(formatCountryNameZh('ZZ')).toBe('未识别国家')
  })

  it('keeps the existing user grade labels and default', () => {
    expect(formatConsumerUserGrade('NEW_STAR', 'zh')).toBe('新星')
    expect(formatConsumerUserGrade('NEW_STAR', 'id')).toBe('Bintang baru')
    expect(formatConsumerUserGrade('UNKNOWN', 'zh')).toBe('普通成员')
  })
})
