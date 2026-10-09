import { describe, expect, it } from 'vitest'
import { shouldNavigateWithinConsole } from './clientNavigation'

const ordinaryClick = {
  button: 0,
  defaultPrevented: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  currentTarget: { target: '', hasAttribute: () => false },
}

describe('new console client navigation', () => {
  it('handles normal clicks on new console pages and category placeholders without a page reload', () => {
    expect(shouldNavigateWithinConsole(ordinaryClick, '/console/overview')).toBe(true)
    expect(shouldNavigateWithinConsole(ordinaryClick, '/console/section/finance')).toBe(true)
    expect(shouldNavigateWithinConsole(ordinaryClick, '/console')).toBe(true)
  })

  it('leaves legacy and unrelated links as normal browser navigation', () => {
    expect(shouldNavigateWithinConsole(ordinaryClick, '/admin#admin-users')).toBe(false)
    expect(shouldNavigateWithinConsole(ordinaryClick, '/invite')).toBe(false)
    expect(shouldNavigateWithinConsole(ordinaryClick, '/console-extra')).toBe(false)
  })

  it('preserves modified clicks, new tabs, downloads and already handled events', () => {
    for (const key of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const) {
      expect(shouldNavigateWithinConsole({ ...ordinaryClick, [key]: true }, '/console/users')).toBe(false)
    }
    expect(shouldNavigateWithinConsole({ ...ordinaryClick, button: 1 }, '/console/users')).toBe(false)
    expect(shouldNavigateWithinConsole({ ...ordinaryClick, defaultPrevented: true }, '/console/users')).toBe(false)
    expect(shouldNavigateWithinConsole({ ...ordinaryClick, currentTarget: { ...ordinaryClick.currentTarget, target: '_blank' } }, '/console/users')).toBe(false)
    expect(shouldNavigateWithinConsole({ ...ordinaryClick, currentTarget: { ...ordinaryClick.currentTarget, hasAttribute: () => true } }, '/console/users')).toBe(false)
  })
})
