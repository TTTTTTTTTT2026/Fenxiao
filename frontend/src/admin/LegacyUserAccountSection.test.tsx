import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { InvitationRewardAccountResponse } from '../api'
import LegacyUserAccountSection from './LegacyUserAccountSection'

const account: InvitationRewardAccountResponse = {
  userId: 1001, unit: 'POINT', frozenPoints: 10, availablePoints: 20, totalPoints: 30,
  cumulativeIncomePoints: 40, directIncomePoints: 25, indirectIncomePoints: 15,
  withdrawalEnabled: false, totalRecords: 21, page: 0, size: 20,
  items: [{
    id: 1, type: 'INVITATION', frozenDelta: 10, availableDelta: 0, reason: '测试收入',
    recordedAt: '2026-10-08T10:00:00Z', platformCode: 'LINKY', sourceEventId: 'TEST-EVENT',
    rewardLevel: 1, sourceUserId: 1002, rawDiamonds: 100, companyShareRate: 0.5,
    companyIncomeDiamonds: 50, invitationRate: 0.1, rewardDiamonds: 5,
    pointsPerDiamond: 2, conversionId: 1,
  }],
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

describe('legacy finance user account section split', () => {
  it('keeps the original fields, empty state and read-only flow table', () => {
    const props = { userId: '1001', account, loading: false, onUserIdChange: vi.fn(), onQuery: vi.fn() }
    const markup = renderToStaticMarkup(<LegacyUserAccountSection {...props} />)
    const empty = renderToStaticMarkup(<LegacyUserAccountSection {...props} account={null} />)

    expect(markup).toContain('id="admin-user-accounts"')
    expect(markup).toContain('账户净额')
    expect(markup).toContain('TEST-EVENT')
    expect(markup).toContain('LINKY / 1')
    expect(markup).toContain('测试收入')
    expect(markup).toContain('共 21 条')
    expect(empty).toContain('尚未查询用户账户')
    expect(markup).not.toContain('审核打款')
  })

  it('keeps the search and paging callbacks delegated to the old parent', () => {
    const onUserIdChange = vi.fn()
    const onQuery = vi.fn()
    const tree = LegacyUserAccountSection({ userId: '1001', account, loading: false, onUserIdChange, onQuery })
    const form = findElement(tree, (element) => element.type === 'form')
    const input = findElement(tree, (element) => element.type === 'input')
    const next = findElement(tree, (element) => element.type === 'button' && element.props.children === '下一页')

    const preventDefault = vi.fn()
    ;(form?.props.onSubmit as (event: { preventDefault: () => void }) => void)({ preventDefault })
    ;(input?.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: '1003' } })
    ;(next?.props.onClick as () => void)()

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(onQuery).toHaveBeenNthCalledWith(1, 0)
    expect(onUserIdChange).toHaveBeenCalledWith('1003')
    expect(onQuery).toHaveBeenNthCalledWith(2, 1)
  })
})
