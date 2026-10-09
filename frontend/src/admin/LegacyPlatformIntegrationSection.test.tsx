import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './LegacyPresentation'
import type { PlatformIntegrationResponse, PlatformVerificationRuntimeResponse } from './platformReadApi'
import { LegacyPlatformIntegrationSection } from './LegacyPlatformIntegrationSection'

const integration: PlatformIntegrationResponse = {
  platformCode: 'TIMO', displayName: 'Timo', enabled: true,
  primaryAccountIdentifier: 'Timo ID', accountIdentifierNote: '官方账号 ID',
  mcnIntegrationStatus: 'CONNECTED', revenueIngestionMode: 'FACT_ONLY', rewardMode: 'SHADOW',
  targetGuilds: [{
    countryCode: 'ID', officialGuildId: 'guild-7', officialGuildSid: null, guildName: '示例公会',
    enabled: true, authoritative: true, directoryStatus: 'NORMAL', guildStatus: 'ACTIVE',
    operatingShareRate: 0.2, pendingOperatingShareRate: 0.25, pendingShareVersion: 3,
  }],
}
const runtime: PlatformVerificationRuntimeResponse = { source: 'MOCK', mockManagementEnabled: true, explanation: '仅测试环境' }

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

describe('legacy platform integration presentation boundary', () => {
  const callbacks = { onRefresh: vi.fn(), onEditShare: vi.fn() }

  it('preserves runtime, guild share and empty-state presentation', () => {
    const markup = renderToStaticMarkup(<LegacyPlatformIntegrationSection integrations={[integration]} runtime={runtime} loading={false} canRunControlledIncome {...callbacks} />)
    expect(markup).toContain('admin-platform-integrations')
    expect(markup).toContain('核验通道 · MOCK')
    expect(markup).toContain('Timo · 已启用')
    expect(markup).toContain('当前 20.00% · 待审批 V3：25.00%')
    expect(markup).toContain('编辑分成')
    expect(renderToStaticMarkup(<LegacyPlatformIntegrationSection integrations={null} runtime={null} loading={false} canRunControlledIncome={false} {...callbacks} />)).toContain('平台配置待加载')
    expect(renderToStaticMarkup(<LegacyPlatformIntegrationSection integrations={[]} runtime={null} loading={false} canRunControlledIncome={false} {...callbacks} />)).toContain('尚未初始化平台配置')
  })

  it('delegates refresh and edit, while preserving original controlled-income gate', () => {
    const onRefresh = vi.fn()
    const onEditShare = vi.fn()
    const tree = LegacyPlatformIntegrationSection({ integrations: [integration], runtime, loading: false, canRunControlledIncome: true, onRefresh, onEditShare })
    const refresh = findElement(tree, (element) => element.type === 'button' && element.props.children === '刷新配置')
    const table = findElement(tree, (element) => element.type === DataTable)
    const rows = table?.props.rows as unknown[][]
    const edit = rows[0][5] as ReactElement<{ disabled: boolean; onClick: () => void }>
    expect(refresh?.props.onClick).toBe(onRefresh)
    ;(refresh?.props.onClick as () => void)()
    expect(edit.props.disabled).toBe(false)
    edit.props.onClick()
    expect(onRefresh).toHaveBeenCalledOnce()
    expect(onEditShare).toHaveBeenCalledWith('TIMO', 'guild-7', '示例公会')

    const gatedTree = LegacyPlatformIntegrationSection({ integrations: [integration], runtime, loading: true, canRunControlledIncome: false, onRefresh, onEditShare })
    const gatedTable = findElement(gatedTree, (element) => element.type === DataTable)
    expect((gatedTable?.props.rows as unknown[][])[0][5]).toMatchObject({ props: { disabled: true } })
  })
})
