import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminSessionResponse } from '../admin/authApi'
import type { PlatformIntegrationResponse } from '../admin/platformReadApi'
import PlatformIntegrationPage, { PlatformIntegrationSnapshot } from './PlatformIntegrationPage'

const session: AdminSessionResponse = {
  sessionToken: 'test-session', expiresAt: '2026-10-09T00:00:00Z',
  username: 'tester', displayName: '测试管理员', role: 'super_admin',
  mustChangePassword: false, rememberMe: false, passwordExpiresAt: null,
  platformScope: '*', guildScope: '*', regionScope: '*',
}

const integration: PlatformIntegrationResponse = {
  platformCode: 'TIMO', displayName: 'Timo', primaryAccountIdentifier: '12 位 ID', accountIdentifierNote: '官方账号',
  mcnIntegrationStatus: 'ACTIVE', revenueIngestionMode: 'FACT_ONLY', rewardMode: 'SHADOW', enabled: true,
  targetGuilds: [{
    countryCode: 'ID', officialGuildId: 'guild-17', officialGuildSid: null, guildName: '测试公会',
    enabled: true, authoritative: true, directoryStatus: 'NORMAL', guildStatus: 'ACTIVE',
    operatingShareRate: 0.25, pendingOperatingShareRate: 0.3, pendingShareVersion: 2,
  }],
}

describe('platform integration read-only page', () => {
  it('shows global scope and old-page fallback only to the highest administrator', () => {
    const markup = renderToStaticMarkup(<PlatformIntegrationPage session={session} />)
    expect(markup).toContain('平台接入配置 · 只读')
    expect(markup).toContain('仅向拥有全局范围的最高管理员开放')
    expect(markup).toContain('/admin#admin-system-platforms')
    expect(markup).not.toContain('编辑分成')
  })

  it('denies scoped administrators before making any read request', () => {
    const markup = renderToStaticMarkup(<PlatformIntegrationPage session={{ ...session, role: 'admin', platformScope: 'TIMO' }} />)
    expect(markup).toContain('当前账号无权查看全局平台接入配置')
    expect(markup).not.toContain('刷新配置')
    expect(renderToStaticMarkup(<PlatformIntegrationPage session={{ ...session, guildScope: 'guild-17' }} />)).toContain('当前账号无权查看全局平台接入配置')
  })

  it('retains key config and guild fields without write controls', () => {
    const markup = renderToStaticMarkup(<PlatformIntegrationSnapshot platform={integration} />)
    expect(markup).toContain('Timo')
    expect(markup).toContain('12 位 ID')
    expect(markup).toContain('FACT_ONLY')
    expect(markup).toContain('测试公会')
    expect(markup).toContain('25.00%')
    expect(markup).toContain('待审批 V2：30.00%')
    expect(markup).not.toContain('编辑分成')
  })
})
