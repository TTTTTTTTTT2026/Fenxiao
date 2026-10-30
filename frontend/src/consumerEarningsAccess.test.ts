import { describe, expect, it } from 'vitest'
import { canReadAppEarnings, resolveConsumerAccountWorkspace } from './consumerWorkspaceView'
import { consumerEarningsAccessCopy } from './consumerEarningsAccessCopy'
import type { ConsumerWorkspaceResponse } from './api'

describe('earnings read access is not a verified binding', () => {
  const apps: ConsumerWorkspaceResponse['apps'] = [
    { code: 'TIMO', verified: false, verifiedAt: null, earningsAccessGranted: true, earningsReadable: true },
    { code: 'LINKY', verified: false, verifiedAt: null, earningsAccessGranted: false, earningsReadable: false },
  ]
  it('enables switching and keeps both honest binding entrances for an unbound recipient', () => {
    expect(resolveConsumerAccountWorkspace({ selected: 'TIMO', preferred: null, apps })).toEqual({
      selected: 'TIMO', visibleBindings: ['LINKY', 'TIMO'], canSwitch: true,
    })
    expect(canReadAppEarnings(apps[0])).toBe(true)
    expect(canReadAppEarnings(apps[1])).toBe(false)
    expect(apps.every(app => !app.verified)).toBe(true)
  })
  it('removes access on revocation, including when a stale preference is returned', () => {
    const revoked = apps.map(app => ({ ...app, earningsAccessGranted: false, earningsReadable: false }))
    expect(resolveConsumerAccountWorkspace({ selected: 'TIMO', preferred: 'TIMO', apps: revoked })).toEqual({
      selected: null, visibleBindings: ['LINKY', 'TIMO'], canSwitch: false,
    })
  })
  it('does not infer permission from an internal-looking user or invent verified state', () => {
    expect(canReadAppEarnings({ code: 'TIMO', verified: false, verifiedAt: null })).toBe(false)
    expect(canReadAppEarnings({ code: 'LINKY', verified: true, verifiedAt: null })).toBe(true)
  })
  it.each(['zh', 'en', 'es', 'id', 'pt'] as const)('provides an explicit unbound notice in %s', locale => {
    expect(consumerEarningsAccessCopy[locale].length).toBeGreaterThan(15)
  })
})
