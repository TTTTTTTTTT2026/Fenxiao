import { describe, expect, it } from 'vitest'
import { formatDateTime } from './dateTime'

describe('shared date display', () => {
  it('keeps the legacy empty and invalid-value behavior', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime('')).toBe('-')
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
  })
})
