import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import { availableConsoleRoutesForSession } from './navigation'
import { buildConsoleMenuHierarchy } from './menuHierarchy'

const fullSession: AdminSessionResponse = {
  sessionToken: 'test', expiresAt: '', username: 'tester', displayName: 'Tester', role: 'super_admin',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

describe('T-shaped console navigation', () => {
  it('keeps the legacy first-level order and exposes all available new pages exactly once', () => {
    const menu = buildConsoleMenuHierarchy(fullSession)
    expect(menu.map((group) => group.label)).toEqual([
      '分销概览', '渠道入口', '用户管理', '平台公会目录', '财务管理',
      '导师列表', '团队列表', '用户等级', '系统管理', '配置中心',
    ])
    const newPaths = menu.flatMap((group) => group.entries.filter((entry) => !entry.legacy).map((entry) => entry.href))
    expect(new Set(newPaths)).toEqual(new Set(availableConsoleRoutesForSession(fullSession).map((route) => route.path)))
    expect(new Set(newPaths).size).toBe(newPaths.length)
    expect(menu.find((group) => group.key === 'users')?.entries.map((entry) => entry.label).slice(0, 3)).toEqual(['用户列表', '绑定管理', '风险队列'])
    expect(menu.find((group) => group.key === 'finance')?.href).toBe('/console/reward-ledger')
  })

  it('preserves legacy submenu entry points for functions not migrated to the new console', () => {
    const menu = buildConsoleMenuHierarchy(fullSession)
    const grades = menu.find((group) => group.key === 'grades')?.entries ?? []
    expect(grades).toContainEqual({ key: 'advancedGradeAcceptance', label: '高阶经营验收', href: '/admin#admin-advanced-grade-acceptance', legacy: true })
    const config = menu.find((group) => group.key === 'config')?.entries ?? []
    expect(config.map((entry) => entry.label)).toContain('验证码审查')
    expect(config.map((entry) => entry.label)).toContain('白名单')
    expect(config.find((entry) => entry.key === 'platformIntegrations')?.href).toBe('/console/platform-integrations')
    expect(config.find((entry) => entry.key === 'systemPlatforms')?.href).toBe('/admin#admin-system-platforms')
  })

  it('honors existing role and full-scope visibility before building either level', () => {
    const operator = buildConsoleMenuHierarchy({ ...fullSession, role: 'operator' })
    expect(operator.map((group) => group.key)).toEqual(['overview', 'channel', 'users', 'guilds', 'management'])
    expect(operator.flatMap((group) => group.entries).some((entry) => entry.key === 'platformIntegrations')).toBe(false)
    const scoped = buildConsoleMenuHierarchy({ ...fullSession, guildScope: 'guild-17' })
    expect(scoped.flatMap((group) => group.entries).some((entry) => entry.key === 'platformIntegrations' || entry.key === 'gradeFacts')).toBe(false)
    expect(scoped.find((group) => group.key === 'config')?.entries.some((entry) => entry.key === 'systemPlatforms')).toBe(true)
  })
})
