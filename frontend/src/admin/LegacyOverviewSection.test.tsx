import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import LegacyOverviewSection from './LegacyOverviewSection'

const callbacks = { onRefresh: vi.fn(), onLoadRiskEvents: vi.fn() }
const overview = {
  invitedUsers: 12, effectiveUsers: 8, rewardTotal: 100,
  frozenRewardTotal: 20, availableRewardTotal: 80, riskEventCount: 3,
}

describe('legacy overview page split', () => {
  it('keeps the existing section anchor, metrics, task links and role visibility', () => {
    const markup = renderToStaticMarkup(<LegacyOverviewSection
      roleLabel="运营" productLabel="Linky" overview={overview}
      pendingWithdrawalCount={2} pendingRiskCount={1}
      canViewRewards canViewUsers canViewChannel loading={false} canLoad
      {...callbacks}
    />)

    expect(markup).toContain('id="admin-overview"')
    expect(markup).toContain('运营视角 · 先处理阻塞')
    expect(markup).toContain('href="#admin-rewards"')
    expect(markup).toContain('href="#admin-risk-queue"')
    expect(markup).toContain('href="#admin-channel-entries"')
    expect(markup).toContain('当前产品累计数据')
    expect(markup).toContain('邀请人数</span><strong>12</strong>')
    expect(markup).toContain('可用奖励</span><strong>80</strong>')
    expect(markup).toContain('工作台状态<small>Linky</small>')
  })

  it('keeps unavailable tasks hidden and the initial/loading states', () => {
    const initial = renderToStaticMarkup(<LegacyOverviewSection
      roleLabel="客服" productLabel="全部产品" overview={null}
      pendingWithdrawalCount={null} pendingRiskCount={null}
      canViewRewards={false} canViewUsers canViewChannel={false} loading={false} canLoad
      {...callbacks}
    />)
    const loading = renderToStaticMarkup(<LegacyOverviewSection
      roleLabel="客服" productLabel="全部产品" overview={null}
      pendingWithdrawalCount={null} pendingRiskCount={null}
      canViewRewards={false} canViewUsers canViewChannel={false} loading canLoad
      {...callbacks}
    />)

    expect(initial).not.toContain('href="#admin-rewards"')
    expect(initial).not.toContain('href="#admin-channel-entries"')
    expect(initial).toContain('待刷新')
    expect(initial).toContain('刷新工作台')
    expect(loading).toContain('刷新中…')
    expect(loading).toContain('disabled=""')
  })
})
