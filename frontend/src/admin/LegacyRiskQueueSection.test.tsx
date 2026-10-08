import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { RiskEventListResponse } from '../api'
import LegacyRiskQueueSection, { type RiskQuery } from './LegacyRiskQueueSection'

const query: RiskQuery = { userId: '', riskStatus: 'PENDING', startAt: '', endAt: '', page: '0', size: '10' }
const events: RiskEventListResponse = {
  page: 0, size: 10, total: 2,
  items: [
    { id: 7, userId: 101, riskType: 'ABNORMAL_INVITE', riskLevel: 2, riskStatus: 'PENDING', detailJson: '{}', detectedAt: '2026-10-08T10:00:00+08:00', handledBy: null, handledAt: null, resultNote: null },
    { id: 8, userId: 102, riskType: 'DUPLICATE_BINDING', riskLevel: 1, riskStatus: 'HANDLED', detailJson: '{}', detectedAt: '2026-10-08T11:00:00+08:00', handledBy: 1, handledAt: '2026-10-08T11:30:00+08:00', resultNote: '已处理' },
  ],
}

function props() {
  return {
    query, events, views: [{ id: 'view-1', name: '我的待办', query, createdAt: '2026-10-08T10:00:00+08:00' }], selectedViewId: 'view-1', viewName: '我的待办',
    selectedEventIds: [7], actionDrafts: { 7: '复核后处理' }, actionLoadingId: null, batchResult: null,
    loading: false, canLoadAdmin: true, pageLabel: '共 2 条；当前第 1 页', hasPrevPage: false, hasNextPage: false,
    renderStatus: (status: string) => <span>{status}</span>,
    onQueryChange: vi.fn(), onQuery: vi.fn(), onReset: vi.fn(), onApplyView: vi.fn(), onViewNameChange: vi.fn(),
    onSaveView: vi.fn(), onRemoveView: vi.fn(), onSelectEventIds: vi.fn(), onBatchAction: vi.fn(),
    onDraftChange: vi.fn(), onAction: vi.fn(), onPageChange: vi.fn(),
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

describe('legacy risk queue split', () => {
  it('keeps filters, saved views, event fields, action labels and second-confirmation hint', () => {
    const markup = renderToStaticMarkup(<LegacyRiskQueueSection {...props()} />)
    expect(markup).toContain('风险队列筛选')
    expect(markup).toContain('我的待办')
    expect(markup).toContain('ABNORMAL_INVITE')
    expect(markup).toContain('DUPLICATE_BINDING')
    expect(markup).toContain('批量处理')
    expect(markup).toContain('冻结用户')
    expect(markup).toContain('解冻用户')
    expect(markup).toContain('必须先填写处理备注并二次确认')
    expect(markup).toContain('共 2 条；当前第 1 页')
  })

  it('keeps empty and loading states without exposing event actions', () => {
    const markup = renderToStaticMarkup(<LegacyRiskQueueSection {...props()} events={null} selectedEventIds={[]} loading />)
    expect(markup).toContain('查询中…')
    expect(markup).toContain('暂无待处理风险')
    expect(markup).not.toContain('>冻结用户</button>')
    expect(markup).not.toContain('批量处理')
  })

  it('routes filters, selection and sensitive actions to the existing parent callbacks', () => {
    const callbacks = props()
    const tree = LegacyRiskQueueSection(callbacks)
    const userFilter = findElement(tree, (element) => element.type === 'input' && element.props.inputMode === 'numeric')
    const reset = findElement(tree, (element) => element.type === 'button' && element.props.children === '重置')
    const batch = findElement(tree, (element) => element.type === 'button' && element.props.children === '批量忽略')
    const rowCheckbox = findElement(tree, (element) => element.type === 'input' && element.props['aria-label'] === '选择风险事件 7')
    const freeze = findElement(tree, (element) => element.type === 'button' && element.props.children === '冻结用户')
    expect(userFilter && reset && batch && rowCheckbox && freeze).toBeTruthy()
    ;(userFilter!.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: '101' } })
    ;(reset!.props.onClick as () => void)()
    ;(batch!.props.onClick as () => void)()
    ;(rowCheckbox!.props.onChange as (event: { target: { checked: boolean } }) => void)({ target: { checked: false } })
    ;(freeze!.props.onClick as () => void)()
    expect(callbacks.onQueryChange).toHaveBeenCalledWith({ ...query, userId: '101' })
    expect(callbacks.onReset).toHaveBeenCalledTimes(1)
    expect(callbacks.onBatchAction).toHaveBeenCalledWith('IGNORE', [7])
    expect(callbacks.onSelectEventIds).toHaveBeenCalledOnce()
    expect(callbacks.onSelectEventIds.mock.calls[0][0]([7, 9])).toEqual([9])
    expect(callbacks.onAction).toHaveBeenCalledWith(events.items[0], 'FREEZE_USER')
  })

  it('keeps ignore and freeze unavailable until a handling note exists', () => {
    const tree = LegacyRiskQueueSection({ ...props(), actionDrafts: {} })
    const ignore = findElement(tree, (element) => element.type === 'button' && element.props.children === '忽略')
    const freeze = findElement(tree, (element) => element.type === 'button' && element.props.children === '冻结用户')
    expect(ignore?.props.disabled).toBe(true)
    expect(freeze?.props.disabled).toBe(true)
  })
})
