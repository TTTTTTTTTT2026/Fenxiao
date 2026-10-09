import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminMentorAssignedStudents as legacyStudents, getAdminMentorIncentiveDashboard as legacyDashboard } from '../api'
import { getAdminMentorAssignedStudents, getAdminMentorIncentiveDashboard } from './mentorReadApi'

describe('admin mentor read API boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('preserves the legacy exports on one shared implementation', () => {
    expect(legacyDashboard).toBe(getAdminMentorIncentiveDashboard)
    expect(legacyStudents).toBe(getAdminMentorAssignedStudents)
  })

  it('uses the existing unscoped dashboard and selected mentor student paths', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' })
    vi.stubGlobal('fetch', fetchMock)

    await getAdminMentorIncentiveDashboard('session')
    await getAdminMentorAssignedStudents('session', 17)

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['/admin/incentives/mentor-dashboard', undefined],
      ['/admin/incentives/mentors/17/students', undefined],
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual(expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-Admin-Session': 'session' }) }))
    }
  })
})
