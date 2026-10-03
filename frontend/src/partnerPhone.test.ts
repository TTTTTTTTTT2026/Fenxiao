import { describe, expect, it } from 'vitest'
import { formatPartnerPhone, normalizePartnerLocalPhone, partnerPhoneCountries } from './partnerPhone'

describe('partner phone login', () => {
  it('offers the same five country and region calling codes as client login', () => {
    expect(partnerPhoneCountries.map(({ countryCode, callingCode }) => [countryCode, callingCode])).toEqual([
      ['CN', '+86'], ['ID', '+62'], ['MX', '+52'], ['BR', '+55'], ['HK', '+852'],
    ])
  })

  it('submits an international number from a selected calling code and local digits', () => {
    expect(formatPartnerPhone('+62', normalizePartnerLocalPhone('813 5923 2049', '+62'))).toBe('+6281359232049')
    expect(formatPartnerPhone('+852', normalizePartnerLocalPhone('5324 1808', '+852'))).toBe('+85253241808')
  })

  it('does not repeat the calling code when a full number is pasted', () => {
    expect(normalizePartnerLocalPhone('+62 813 5923 2049', '+62')).toBe('81359232049')
    expect(normalizePartnerLocalPhone('6281359232049', '+62')).toBe('6281359232049')
  })

  it('does not submit an empty phone number', () => {
    expect(formatPartnerPhone('+55', '')).toBe('')
  })
})
