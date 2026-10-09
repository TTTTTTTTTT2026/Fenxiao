import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import LegacyRewardLedgerSection, { type LegacyRewardQuery } from './LegacyRewardLedgerSection'
import type { RewardListResponse } from './financeReadApi'
import { formatDateTime } from '../shared/dateTime'

const query: LegacyRewardQuery = { beneficiaryUserId: '11001', status: 'AVAILABLE', startAt: '2026-10-01', endAt: '2026-10-09', page: '2', size: '10' }
const rewards: RewardListResponse = {
  items: [{ beneficiaryUserId: 11001, sourceUserId: 11002, rewardLevel: 1, rewardAmount: 12.5, rewardStatus: 'AVAILABLE', calculatedAt: '2026-10-09T01:00:00Z' }],
  page: 2, size: 10, total: 31,
}
function props() {
  return { query, rewards, loading: false, canLoadAdmin: true, pageLabel: '本次命中 31 条，当前第 3 页，每页 10 条。', hasPreviousPage: true, hasNextPage: true,
    emptyState: { actionLabel: '请先查询' }, renderStatus: (status: string) => <span className="original-status">{status}</span>,
    onQueryChange: vi.fn(), onLoad: vi.fn(), onPageChange: vi.fn(),
  }
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

describe('legacy reward ledger presentation boundary', () => {
  it('preserves the anchor, filter classes, raw amount and parent status renderer', () => {
    const markup = renderToStaticMarkup(<LegacyRewardLedgerSection {...props()} />)
    for (const text of ['id="admin-rewards"', '收益记录管理', 'soft-query-shell compact-query-shell', 'exception-filter-grid', '11001', '11002', '12.5', 'original-status', formatDateTime(rewards.items[0].calculatedAt), '本次命中 31 条']) expect(markup).toContain(text)
    expect(markup).not.toContain('确认打款')
  })

  it.each([null, { ...rewards, items: [], total: 0 }])('keeps the existing empty state for %j', (result) => {
    const markup = renderToStaticMarkup(<LegacyRewardLedgerSection {...props()} rewards={result} />)
    expect(markup).toContain('暂无后台奖励数据')
    expect(markup).toContain('先按受益用户或状态查一页。')
    expect(markup).toContain('请先查询')
    expect(markup).not.toContain('<table>')
  })

  it('keeps date/page/size values when editing user and status filters without fetching', () => {
    const callbacks = props()
    const tree = LegacyRewardLedgerSection(callbacks)
    const input = findElement(tree, (e) => e.type === 'input')!
    const select = findElement(tree, (e) => e.type === 'select')!
    ;(input.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: '12001' } })
    expect(callbacks.onQueryChange).toHaveBeenLastCalledWith({ ...query, beneficiaryUserId: '12001' })
    ;(select.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: 'FROZEN' } })
    expect(callbacks.onQueryChange).toHaveBeenLastCalledWith({ ...query, status: 'FROZEN' })
    expect(callbacks.onLoad).not.toHaveBeenCalled()
    expect(callbacks.onPageChange).not.toHaveBeenCalled()
  })

  it('delegates query and zero-based previous/next pages to the original handlers', () => {
    const callbacks = props()
    const tree = LegacyRewardLedgerSection(callbacks)
    const queryButton = findElement(tree, (e) => e.type === 'button' && e.props.children === '查询收益记录')!
    expect(queryButton.props.onClick).toBe(callbacks.onLoad)
    ;(queryButton.props.onClick as () => void)()
    for (const label of ['上一页', '下一页']) {
      const button = findElement(tree, (e) => e.type === 'button' && e.props.children === label)!
      ;(button.props.onClick as () => void)()
    }
    expect(callbacks.onLoad).toHaveBeenCalledOnce()
    expect(callbacks.onPageChange.mock.calls).toEqual([[1], [3]])
  })

  it.each([
    { loading: true, canLoadAdmin: true, hasPreviousPage: true, hasNextPage: true },
    { loading: false, canLoadAdmin: false, hasPreviousPage: false, hasNextPage: false },
  ])('preserves query/loading and pagination disabled gates: %j', (gates) => {
    const tree = LegacyRewardLedgerSection({ ...props(), ...gates })
    for (const label of ['查询收益记录', '上一页', '下一页']) {
      expect(findElement(tree, (e) => e.type === 'button' && e.props.children === label)?.props.disabled).toBe(true)
    }
  })
})
