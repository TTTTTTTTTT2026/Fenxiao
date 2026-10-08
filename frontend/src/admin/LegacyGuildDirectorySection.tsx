import type { PlatformGuildDirectoryItem, PlatformGuildDirectorySyncRun } from '../api'
import { formatDateTime } from '../shared/dateTime'
import { DataTable, EmptyState, InfoCard, InlineHint, PanelSection, RelationItem, StatusBadge } from './LegacyPresentation'

type Platform = 'LINKY' | 'TIMO'

type Props = {
  platform: Platform
  directory: PlatformGuildDirectoryItem[] | null
  syncRuns: PlatformGuildDirectorySyncRun[] | null
  loading: boolean
  onRefresh: () => void
  onSelectPlatform: (platform: Platform) => void
}

export default function LegacyGuildDirectorySection({ platform, directory, syncRuns, loading, onRefresh, onSelectPlatform }: Props) {
  return <PanelSection
    sectionId="admin-platform-guild-directory"
    eyebrow="MCN authoritative directory"
    title="平台公会目录"
    description="只读查看 MCN 同步的 Linky 与 Timo 公会事实、异常状态及同步批次。BANDEIRA 不在此编辑权威公会资料。"
    action={<button className="primary-btn" onClick={onRefresh} disabled={loading}>{loading ? '刷新中…' : '刷新目录'}</button>}
  >
    <div className="stack-gap">
      <div className="admin-view-tabs" role="tablist" aria-label="平台公会目录平台选择">
        {(['LINKY', 'TIMO'] as const).map((item) => <button key={item} className={platform === item ? 'is-active' : ''} onClick={() => onSelectPlatform(item)} role="tab" aria-selected={platform === item}>{item}</button>)}
      </div>
      <InfoCard title={`${platform} 目录状态`} tone="neutral">
        {directory ? <div className="relation-grid">
          <RelationItem label="已同步公会" value={`${directory.length} 个`} />
          <RelationItem label="正常" value={`${directory.filter((item) => item.directoryStatus === 'NORMAL').length} 个`} />
          <RelationItem label="MCN 已缺失" value={`${directory.filter((item) => item.directoryStatus === 'MISSING_ON_MCN').length} 个`} />
          <RelationItem label="最后同步" value={formatDateTime(syncRuns?.[0]?.completedAt || directory?.[0]?.lastSeenAt)} />
        </div> : <EmptyState title="尚未加载公会目录" description="点击“刷新目录”读取当前已同步的 MCN 权威目录。" actionLabel="目录只读，不可在此编辑" />}
      </InfoCard>
      <InfoCard title="MCN 同步公会" tone="neutral">
        <DataTable
          headers={['公会 ID / 名称', '国家', '平台状态', '当前公司分成比例', '目录状态', 'MCN 更新时间', '最后同步']}
          rows={(directory ?? []).map((item) => [
            <div className="stack-gap small"><strong>{item.guildName}</strong><span>{item.guildId}</span></div>,
            item.country || '-',
            <StatusBadge status={item.guildStatus} />,
            item.operatingShareRate == null ? '未配置' : `${(item.operatingShareRate * 100).toFixed(2)}%`,
            <StatusBadge status={item.directoryStatus} />,
            formatDateTime(item.mcnRecordUpdatedAt || item.officialUpdatedAt || undefined),
            formatDateTime(item.lastSeenAt),
          ])}
          emptyText={loading ? '正在读取 MCN 同步目录…' : '当前平台还没有同步的公会。请检查最近同步批次。'}
        />
        <InlineHint text="当前公司分成比例只读展示当前已审批且在生效期内的版本；未配置的公会显示“未配置”，不会在此页提供编辑。" />
      </InfoCard>
      <InfoCard title="最近同步批次" tone="neutral">
        <DataTable
          headers={['平台', '结果', '接收 / 写入 / 缺失', '开始时间', '完成时间', '异常']}
          rows={(syncRuns ?? []).map((item) => [
            item.platformCode,
            <StatusBadge status={item.syncStatus} />,
            `${item.receivedCount} / ${item.upsertedCount} / ${item.missingCount}`,
            formatDateTime(item.startedAt),
            formatDateTime(item.completedAt || undefined),
            item.errorCode ? `${item.errorCode}${item.errorMessage ? ` · ${item.errorMessage}` : ''}` : '-',
          ])}
          emptyText={loading ? '正在读取同步批次…' : '暂无同步批次；请确认 MCN 目录同步开关已启用。'}
        />
        <InlineHint text="若出现“MCN 已缺失”或失败批次，请先核对 MCN 目录事实；系统不会自动删除本地历史记录。" />
      </InfoCard>
    </div>
  </PanelSection>
}
