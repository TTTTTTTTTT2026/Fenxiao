import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import LegacyUserDirectorySection, { type UserPlatformQuery } from './LegacyUserDirectorySection'
import type { UserDirectoryOptions, UserPlatformProfileListResponse } from './userDirectoryApi'

const query: UserPlatformQuery = {
  userId: '', operatorAdminId: '', valueCode: '', countryCode: '', localPhone: '',
  linkyGuildId: '', timoGuildId: '', page: '0', size: '20',
}
const options: UserDirectoryOptions = {
  operators: [{ id: 3, displayName: '运营甲', username: 'staff-a', enabled: true }],
  countries: ['BR'], linkyGuilds: [{ guildId: 'G100', guildName: 'Linky 公会' }],
  timoGuilds: [{ guildId: 'T200', guildName: null }],
}
const profiles: UserPlatformProfileListResponse = {
  total: 21, page: 0, size: 20,
  items: [{
    userId: 1001, nickname: '测试昵称', inviteCode: 'ABC123', countryCode: 'BR',
    phoneNumber: '+559999999999', registeredAt: '2026-10-08T10:00:00+08:00',
    directInviterUserId: 1000, directInviterNickname: '上级昵称', userGradeCode: 'ORDINARY',
    passwordLoginEnabled: true, operatorAdminId: 3, operatorName: '运营甲', valueCode: 'HIGH_VALUE',
    linky: { accountId: '12345678', status: 'VERIFIED', guildId: 'G100', guildName: 'Linky 公会', verifiedAt: null, source: 'PLATFORM', expectedGuildSource: 'MCN' },
    timo: null,
    invitationGuild: { guildId: 'G100', guildName: '目标公会', guildInviteCode: null, source: 'DIRECT', inheritedFromUserId: null, effectiveAt: '2026-10-08T10:00:00+08:00', changeReason: null },
  }],
}
const callbacks = {
  onQueryChange: vi.fn(), onSearch: vi.fn(), onPageChange: vi.fn(), onPageSizeChange: vi.fn(),
  onCopyInviteCode: vi.fn(), onAdjustCountry: vi.fn(), onAdjustLinkyInvitationGuild: vi.fn(),
  onPasswordLogin: vi.fn(), onEditOperations: vi.fn(),
}

function findElement(node: unknown, matches: (element: ReactElement<Record<string, unknown>>) => boolean): ReactElement<Record<string, unknown>> | undefined {
  if (Array.isArray(node)) {
    for (const item of node) { const found = findElement(item, matches); if (found) return found }
  } else if (isValidElement<Record<string, unknown>>(node)) {
    if (matches(node)) return node
    for (const value of Object.values(node.props)) {
      if (typeof value === 'function') continue
      const found = findElement(value, matches)
      if (found) return found
    }
  }
  return undefined
}

describe('legacy user directory filters and operations', () => {
  it('shows both new dimensions, all requested filters and bottom pagination without refresh', () => {
    const markup = renderToStaticMarkup(<LegacyUserDirectorySection
      query={query} options={options} profiles={profiles} loading={false}
      canManageCountry canManageLinkyInvitationGuild canManagePasswordLogin canManageOperations {...callbacks}
    />)
    for (const text of ['用户 ID', '对接运营', '用户价值', '归属国家', '手机号（本地号码）',
      'Linky 公会', 'Timo 公会', '搜索', '设置对接运营', '设置用户价值', '上一页', '下一页', '每页数量',
      '测试昵称', '运营甲', '高价值用户', 'Linky 公会', '目标公会']) expect(markup).toContain(text)
    expect(markup).not.toContain('刷新用户')
    expect(markup.indexOf('每页数量')).toBeGreaterThan(markup.indexOf('用户与平台核验信息'))
  })

  it('keeps write actions unavailable to read-only roles', () => {
    const markup = renderToStaticMarkup(<LegacyUserDirectorySection
      query={query} options={options} profiles={profiles} loading={false}
      canManageCountry={false} canManageLinkyInvitationGuild={false} canManagePasswordLogin={false}
      canManageOperations={false} {...callbacks}
    />)
    expect(markup).toContain('<td>只读</td>')
    expect(markup).not.toContain('设置对接运营')
    expect(markup).not.toContain('设置用户价值')
  })

  it('does not query on input change; search, edit and pagination use explicit callbacks', () => {
    const tree = LegacyUserDirectorySection({
      query, options, profiles, loading: false, canManageCountry: true,
      canManageLinkyInvitationGuild: true, canManagePasswordLogin: true,
      canManageOperations: true, ...callbacks,
    })
    const filter = findElement(tree, (element) => element.type === 'input' && element.props.inputMode === 'numeric')
    const form = findElement(tree, (element) => element.type === 'form')
    const edit = findElement(tree, (element) => element.type === 'button' && element.props.children === '设置对接运营')
    const next = findElement(tree, (element) => element.type === 'button' && element.props.children === '下一页')
    expect(filter && form && edit && next).toBeDefined()
    ;(filter!.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: '1a002' } })
    expect(callbacks.onQueryChange).toHaveBeenCalledWith({ ...query, userId: '1002' })
    expect(callbacks.onSearch).not.toHaveBeenCalled()
    ;(form!.props.onSubmit as (event: { preventDefault: () => void }) => void)({ preventDefault: vi.fn() })
    ;(edit!.props.onClick as () => void)()
    ;(next!.props.onClick as () => void)()
    expect(callbacks.onSearch).toHaveBeenCalledTimes(1)
    expect(callbacks.onEditOperations).toHaveBeenCalledWith(profiles.items[0], 'operator')
    expect(callbacks.onPageChange).toHaveBeenCalledWith(1)
  })
})
