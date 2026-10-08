import { isValidElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { buildAdminSectionLinks } from '../opsConsole'
import LegacyAdminNavigation from './LegacyAdminNavigation'
import { getVisibleFinanceSections } from './navigation'

function findLink(node: ReactNode, href: string): { onClick?: () => void } | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findLink(child, href)
      if (found) return found
    }
    return null
  }
  if (!isValidElement<{ children?: ReactNode; href?: string; onClick?: () => void }>(node)) return null
  if (node.props.href === href) return node.props
  return findLink(node.props.children, href)
}

function navigation(role = 'super_admin', onNavigate = vi.fn()) {
  return LegacyAdminNavigation({
    links: buildAdminSectionLinks(role), activeSection: 'users', visibleFinanceSections: getVisibleFinanceSections(role), role,
    openGroups: { users: true, grades: true, finance: true, management: true, config: true },
    riskEventTotal: 2, canRunControlledIncome: role === 'super_admin' || role === 'finance',
    canManageSeedInviters: role === 'super_admin', canAuditPhoneVerification: role === 'super_admin',
    isFinanceManagementSection: false, isSystemManagementSection: false, isSystemConfigSection: false,
    hostname: '127.0.0.1', onToggleGroup: () => {}, onNavigate,
  })
}

describe('legacy admin navigation boundary', () => {
  it('preserves the grouped menu labels, links, risk count and environment text', () => {
    const markup = renderToStaticMarkup(navigation())
    expect(markup).toContain('aria-label="用户管理子菜单"')
    expect(markup).toContain('href="#admin-risk-queue"')
    expect(markup).toContain('风险队列 · 2')
    expect(markup).toContain('href="#admin-commission-policies"')
    expect(markup).toContain('本地环境')
  })

  it('keeps finance-only and highest-admin links inside their existing groups', () => {
    const finance = renderToStaticMarkup(navigation('finance'))
    const operator = renderToStaticMarkup(navigation('operator'))
    expect(finance).toContain('href="#admin-commission-policies"')
    expect(finance).not.toContain('验证码审查')
    expect(operator).not.toContain('邀请裂变分成')
    expect(operator).not.toContain('账号管理')
  })

  it('forwards navigation intent so existing parent loaders remain in control', () => {
    const onNavigate = vi.fn()
    const tree = navigation('super_admin', onNavigate)
    findLink(tree, '#admin-users')?.onClick?.()
    findLink(tree, '#admin-risk-queue')?.onClick?.()
    findLink(tree, '#admin-commission-policies')?.onClick?.()
    expect(onNavigate.mock.calls.map(([section]) => section)).toEqual(['users', 'riskQueue', 'commissionPolicies'])
  })
})
