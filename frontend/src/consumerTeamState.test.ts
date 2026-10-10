import { describe, expect, it } from 'vitest'
import { effectiveTeamCount } from './consumerTeamState'

describe('effective team loading', () => {
  it('distinguishes a genuine empty result from a failed or unfinished request', () => {
    expect(effectiveTeamCount({ total: 0 }, false)).toBe(0)
    expect(effectiveTeamCount(null, false)).toBeNull()
    expect(effectiveTeamCount(null, true)).toBeNull()
  })
})
