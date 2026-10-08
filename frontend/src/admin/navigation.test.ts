import { describe, expect, it } from 'vitest'
import { ADMIN_SECTION_HASHES, getVisibleFinanceSections, resolveAdminSectionFromHash } from './navigation'

describe('legacy admin navigation contract', () => {
  it('keeps every canonical hash round-trippable', () => {
    for (const [section, hash] of Object.entries(ADMIN_SECTION_HASHES)) {
      // Four old canonical hashes already redirect to their current navigation sections.
      if (['mentorIncentives', 'operatingDividends', 'systemMockVerification', 'userGrades'].includes(section)) continue
      expect(resolveAdminSectionFromHash(hash)).toBe(section)
    }
  })

  it('preserves historical hash redirects', () => {
    expect(resolveAdminSectionFromHash('#admin-user-platform-profiles')).toBe('users')
    expect(resolveAdminSectionFromHash('#admin-withdraw-requests')).toBe('rewards')
    expect(resolveAdminSectionFromHash('#admin-risks')).toBe('riskQueue')
    expect(resolveAdminSectionFromHash('#unknown')).toBe('overview')
  })

  it('preserves finance navigation visibility', () => {
    expect(getVisibleFinanceSections('finance')).toEqual(['rewards', 'userAccounts', 'commissionPolicies'])
    expect(getVisibleFinanceSections('operations')).toEqual(['tokenPointConversions'])
    expect(getVisibleFinanceSections('operator')).toEqual([])
  })
})
