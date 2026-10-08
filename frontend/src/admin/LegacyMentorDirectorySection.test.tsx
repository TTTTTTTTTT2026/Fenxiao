import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { MentorIncentiveDashboardResponse } from './mentorReadApi'
import LegacyMentorDirectorySection from './LegacyMentorDirectorySection'

const dashboard: MentorIncentiveDashboardResponse = {
  qualifiedMentorCount: 1, assignedStudentCount: 2, shadowEntryCount: 0,
  mentors: [{ userId: 17, phoneNumber: null, countryCode: 'ID', languageCode: 'id', qualificationStatus: 'QUALIFIED', maxActiveStudents: 10, assignedStudentCount: 2 }],
  rules: [], recentShadowEntries: [],
}

describe('legacy mentor directory presentation boundary', () => {
  const handlers = {
    onRefresh: vi.fn(), onNewQualification: vi.fn(), onEditQualification: vi.fn(), onEditStudents: vi.fn(),
  }

  it('keeps the old section anchor, mentor fields and guarded actions', () => {
    const markup = renderToStaticMarkup(<LegacyMentorDirectorySection dashboard={dashboard} loading={false} canManageMentorRelations {...handlers} />)

    expect(markup).toContain('id="admin-mentors"')
    expect(markup).toContain('具备资格的导师')
    expect(markup).toContain('用户 17')
    expect(markup).toContain('ID / id')
    expect(markup).toContain('已具备资格')
    expect(markup).toContain('新建导师资格')
    expect(markup).toContain('编辑资格')
    expect(markup).toContain('编辑学员')
  })

  it('hides writes for read-only roles without removing the directory', () => {
    const markup = renderToStaticMarkup(<LegacyMentorDirectorySection dashboard={dashboard} loading={false} canManageMentorRelations={false} {...handlers} />)

    expect(markup).toContain('导师列表')
    expect(markup).not.toContain('新建导师资格')
    expect(markup).not.toContain('编辑资格')
    expect(markup).not.toContain('编辑学员</button>')
  })
})
