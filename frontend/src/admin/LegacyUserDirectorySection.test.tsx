import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { UserPlatformProfileListResponse } from './userDirectoryApi'
import LegacyUserDirectorySection from './LegacyUserDirectorySection'

const profiles: UserPlatformProfileListResponse = {
  total: 1, page: 0, size: 20,
  items: [{
    userId: 1001, nickname: '测试昵称', inviteCode: 'ABC123', countryCode: 'BR',
    phoneNumber: '+559999999999', registeredAt: '2026-10-08T10:00:00+08:00',
    directInviterUserId: 1000, directInviterNickname: '上级昵称', userGradeCode: 'ORDINARY',
    passwordLoginEnabled: true,
    linky: { accountId: '12345678', status: 'VERIFIED', guildId: 'G100', guildName: 'Linky 公会', verifiedAt: null, source: 'PLATFORM', expectedGuildSource: 'MCN' },
    timo: null,
    invitationGuild: { guildId: 'G100', guildName: '目标公会', guildInviteCode: null, source: 'DIRECT', inheritedFromUserId: null, effectiveAt: '2026-10-08T10:00:00+08:00', changeReason: null },
  }],
}

const callbacks = {
  onQueryChange: vi.fn(), onRefresh: vi.fn(), onCopyInviteCode: vi.fn(),
  onAdjustCountry: vi.fn(), onAdjustLinkyInvitationGuild: vi.fn(), onPasswordLogin: vi.fn(),
}

function findElement(node: unknown, matches: (element: ReactElement<Record<string, unknown>>) => boolean): ReactElement<Record<string, unknown>> | undefined {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findElement(item, matches)
      if (found) return found
    }
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

describe('legacy user directory page split', () => {
  it('keeps the old fields, filter defaults, pagination label and privileged controls', () => {
    const markup = renderToStaticMarkup(<LegacyUserDirectorySection
      query={{ userId: '', page: '0', size: '20' }} profiles={profiles} loading={false}
      canManageCountry canManageLinkyInvitationGuild canManagePasswordLogin {...callbacks}
    />)

    expect(markup).toContain('id="admin-users"')
    expect(markup).toContain('按注册时间从近到远展示用户')
    expect(markup).toContain('测试昵称')
    expect(markup).toContain('上级昵称')
    expect(markup).toContain('Linky 公会')
    expect(markup).toContain('目标公会')
    expect(markup).toContain('复制邀请码 ABC123')
    expect(markup).toContain('调整国家')
    expect(markup).toContain('调整 Linky 归属')
    expect(markup).toContain('重设登录密码')
    expect(markup).toContain('关闭密码登录')
    expect(markup).toContain('共 1 位用户；当前第 1 页')
  })

  it('keeps all mutating controls hidden for read-only roles and empty data', () => {
    const readOnly = renderToStaticMarkup(<LegacyUserDirectorySection
      query={{ userId: '1001', page: '0', size: '50' }} profiles={profiles} loading={false}
      canManageCountry={false} canManageLinkyInvitationGuild={false} canManagePasswordLogin={false} {...callbacks}
    />)
    const empty = renderToStaticMarkup(<LegacyUserDirectorySection
      query={{ userId: '', page: '0', size: '20' }} profiles={null} loading
      canManageCountry={false} canManageLinkyInvitationGuild={false} canManagePasswordLogin={false} {...callbacks}
    />)

    expect(readOnly).toContain('<td>只读</td>')
    expect(readOnly).not.toContain('调整国家')
    expect(readOnly).not.toContain('调整 Linky 归属')
    expect(readOnly).not.toContain('重设登录密码')
    expect(readOnly).not.toContain('关闭密码登录')
    expect(empty).toContain('输入用户 ID 后查询，或直接查询查看近期用户。')
    expect(empty).toContain('加载中…')
  })

  it('keeps filter reset and sensitive action callbacks wired to the selected user', () => {
    const actionCallbacks = {
      onQueryChange: vi.fn(), onRefresh: vi.fn(), onCopyInviteCode: vi.fn(),
      onAdjustCountry: vi.fn(), onAdjustLinkyInvitationGuild: vi.fn(), onPasswordLogin: vi.fn(),
    }
    const tree = LegacyUserDirectorySection({
      query: { userId: '', page: '3', size: '20' }, profiles, loading: false,
      canManageCountry: true, canManageLinkyInvitationGuild: true, canManagePasswordLogin: true,
      ...actionCallbacks,
    })
    const filter = findElement(tree, (element) => element.type === 'input' && element.props.inputMode === 'numeric')
    const country = findElement(tree, (element) => element.type === 'button' && element.props.children === '调整国家')
    const password = findElement(tree, (element) => element.type === 'button' && element.props.children === '重设登录密码')

    expect(filter).toBeDefined()
    expect(country).toBeDefined()
    expect(password).toBeDefined()
    ;(filter!.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: '1a002' } })
    ;(country!.props.onClick as () => void)()
    ;(password!.props.onClick as () => void)()

    expect(actionCallbacks.onQueryChange).toHaveBeenCalledWith({ userId: '1002', page: '0', size: '20' })
    expect(actionCallbacks.onAdjustCountry).toHaveBeenCalledWith(profiles.items[0])
    expect(actionCallbacks.onPasswordLogin).toHaveBeenCalledWith(profiles.items[0], 'set')
  })
})
