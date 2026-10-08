import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { RiskEventListResponse } from './riskApi'
import type { NamedFilterView } from '../opsConsole'
import { formatDateTime } from '../shared/dateTime'
import { DataTable, EmptyState, InlineHint } from './LegacyPresentation'

export type RiskQuery = { userId: string; riskStatus: string; startAt: string; endAt: string; page: string; size: string }
export type RiskActionName = 'HANDLE' | 'IGNORE' | 'FREEZE_USER' | 'UNFREEZE_USER'

type Props = {
  query: RiskQuery
  events: RiskEventListResponse | null
  views: NamedFilterView<RiskQuery>[]
  selectedViewId: string
  viewName: string
  selectedEventIds: number[]
  actionDrafts: Record<number, string>
  actionLoadingId: number | null
  batchResult: ReactNode
  loading: boolean
  canLoadAdmin: boolean
  pageLabel: string
  hasPrevPage: boolean
  hasNextPage: boolean
  renderStatus: (status: string) => ReactNode
  onQueryChange: (query: RiskQuery) => void
  onQuery: () => void
  onReset: () => void
  onApplyView: (viewId: string) => void
  onViewNameChange: (name: string) => void
  onSaveView: () => void
  onRemoveView: () => void
  onSelectEventIds: Dispatch<SetStateAction<number[]>>
  onBatchAction: (action: 'HANDLE' | 'IGNORE', ids: number[]) => void
  onDraftChange: (id: number, note: string) => void
  onAction: (item: RiskEventListResponse['items'][number], action: RiskActionName) => void
  onPageChange: (page: number) => void
}

export default function LegacyRiskQueueSection({ query, events, views, selectedViewId, viewName, selectedEventIds, actionDrafts, actionLoadingId, batchResult, loading, canLoadAdmin, pageLabel, hasPrevPage, hasNextPage, renderStatus, onQueryChange, onQuery, onReset, onApplyView, onViewNameChange, onSaveView, onRemoveView, onSelectEventIds, onBatchAction, onDraftChange, onAction, onPageChange }: Props) {
  const pendingIds = events?.items.filter((item) => item.riskStatus === 'PENDING').map((item) => item.id) ?? []
  return <div className="admin-risk-workbench">
    <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); onQuery() }} aria-label="风险队列筛选">
      <label>用户 ID<input value={query.userId} onChange={(event) => onQueryChange({ ...query, userId: event.target.value, page: '0' })} placeholder="输入用户 ID…" inputMode="numeric" /></label>
      <label>状态<select value={query.riskStatus} onChange={(event) => onQueryChange({ ...query, riskStatus: event.target.value, page: '0' })}><option value="PENDING">待处理</option><option value="HANDLED">已处理</option><option value="IGNORED">已忽略</option><option value="">全部</option></select></label>
      <div className="admin-filter-actions"><button className="primary-btn small-btn" type="submit" disabled={loading || !canLoadAdmin}>{loading ? '查询中…' : '查询'}</button><button className="ghost-btn small-btn" type="button" onClick={onReset} disabled={loading}>重置</button></div>
    </form>
    <div className="admin-saved-views" aria-label="风险个人筛选视图"><select value={selectedViewId} onChange={(event) => onApplyView(event.target.value)} aria-label="选择风险筛选视图"><option value="">个人筛选视图</option>{views.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}</select><input value={viewName} onChange={(event) => onViewNameChange(event.target.value)} placeholder="给当前筛选命名…" aria-label="风险筛选视图名称" /><button className="ghost-btn small-btn" type="button" onClick={onSaveView} disabled={!viewName.trim()}>保存视图</button><button className="ghost-btn small-btn" type="button" onClick={onRemoveView} disabled={!selectedViewId}>删除</button></div>
    {selectedEventIds.length ? <div className="admin-batch-bar" role="region" aria-label="风险批量操作"><strong>已选 {selectedEventIds.length} 条待处理风险</strong><div><button className="primary-btn small-btn" type="button" onClick={() => onBatchAction('HANDLE', selectedEventIds)}>批量处理</button><button className="ghost-btn small-btn" type="button" onClick={() => onBatchAction('IGNORE', selectedEventIds)}>批量忽略</button><button className="ghost-btn small-btn" type="button" onClick={() => onSelectEventIds([])}>清空</button></div></div> : null}
    {batchResult}
    {events?.items?.length ? <DataTable headers={[<input type="checkbox" aria-label="选择本页全部待处理风险" checked={pendingIds.length > 0 && pendingIds.every((id) => selectedEventIds.includes(id))} onChange={(event) => onSelectEventIds(event.target.checked ? pendingIds : [])} />, '事件', '用户', '风险', '状态', '发现时间', '处理']} rows={events.items.map((item) => [
      <input type="checkbox" aria-label={`选择风险事件 ${item.id}`} disabled={item.riskStatus !== 'PENDING'} checked={selectedEventIds.includes(item.id)} onChange={(event) => onSelectEventIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />,
      `#${item.id}`, `#${item.userId}`, <div><strong>{item.riskType}</strong><small className="admin-cell-note">等级 {item.riskLevel}</small></div>, renderStatus(item.riskStatus), formatDateTime(item.detectedAt),
      <div className="admin-row-actions"><input value={actionDrafts[item.id] || ''} onChange={(event) => onDraftChange(item.id, event.target.value)} placeholder="处理备注…" aria-label={`风险事件 ${item.id} 处理备注`} />{item.riskStatus === 'PENDING' ? <><button className="primary-btn small-btn" onClick={() => onAction(item, 'HANDLE')} disabled={actionLoadingId === item.id}>处理</button><button className="ghost-btn small-btn" onClick={() => onAction(item, 'IGNORE')} disabled={actionLoadingId === item.id || !(actionDrafts[item.id] || '').trim()}>忽略</button><button className="ghost-btn small-btn" onClick={() => onAction(item, 'FREEZE_USER')} disabled={actionLoadingId === item.id || !(actionDrafts[item.id] || '').trim()}>冻结用户</button></> : item.riskStatus === 'HANDLED' ? <button className="ghost-btn small-btn" onClick={() => onAction(item, 'UNFREEZE_USER')} disabled={actionLoadingId === item.id}>解冻用户</button> : null}</div>,
    ])} emptyText="当前筛选下没有风险事件" /> : <EmptyState title="暂无待处理风险" description="当前筛选下没有需要人工处置的事件。" actionLabel="可切换状态查看历史" />}
    <InlineHint text="忽略或冻结用户属于高影响操作，必须先填写处理备注并二次确认。" />
    <div className="table-toolbar"><button className="ghost-btn small-btn" onClick={() => onPageChange(Number(query.page) - 1)} disabled={!hasPrevPage}>上一页</button><span className="admin-page-note">{pageLabel}</span><button className="ghost-btn small-btn" onClick={() => onPageChange(Number(query.page) + 1)} disabled={!hasNextPage}>下一页</button></div>
  </div>
}
