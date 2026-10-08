import type { PlatformIntegrationResponse, PlatformVerificationRuntimeResponse } from './platformReadApi'
import { DataTable, EmptyState, InfoCard, InlineHint, PanelSection, RelationItem } from './LegacyPresentation'

type Props = {
  integrations: PlatformIntegrationResponse[] | null
  runtime: PlatformVerificationRuntimeResponse | null
  loading: boolean
  canRunControlledIncome: boolean
  onRefresh: () => void
  onEditShare: (platformCode: string, guildId: string, guildName: string) => void
}

export function LegacyPlatformIntegrationSection({ integrations, runtime, loading, canRunControlledIncome, onRefresh, onEditShare }: Props) {
  return <PanelSection
    sectionId="admin-platform-integrations"
    eyebrow="Platform integration"
    title="平台接入配置"
    description="平台账号主标识、公会范围和收益处理模式。Timo 当前仅允许保存收入事实并进行测算核对，不会触发真实发奖。"
    action={<button className="primary-btn" onClick={onRefresh} disabled={loading}>{loading ? '刷新中…' : '刷新配置'}</button>}
  >
    <div className="stack-gap">
      {runtime ? <InfoCard title={`核验通道 · ${runtime.source}`} tone={runtime.source === 'MOCK' ? 'success' : 'neutral'}>
        <div className="relation-grid">
          <RelationItem label="有效数据源" value={runtime.source} />
          <RelationItem label="Mock 管理" value={runtime.mockManagementEnabled ? '可用（仅本地 / 测试）' : '不可用'} />
        </div>
        <InlineHint text={runtime.explanation} />
      </InfoCard> : null}
      {(integrations ?? []).map((platform) => (
        <InfoCard key={platform.platformCode} title={`${platform.displayName} · ${platform.enabled ? '已启用' : '已停用'}`} tone={platform.platformCode === 'TIMO' ? 'success' : 'neutral'}>
          <div className="relation-grid">
            <RelationItem label="平台代码" value={platform.platformCode} />
            <RelationItem label="账号主标识" value={platform.primaryAccountIdentifier} />
            <RelationItem label="MCN 接入状态" value={platform.mcnIntegrationStatus} />
            <RelationItem label="收益接入模式" value={platform.revenueIngestionMode} />
            <RelationItem label="奖励模式" value={platform.rewardMode} />
          </div>
          <InlineHint text={platform.accountIdentifierNote} />
          <DataTable
            headers={['国家', '官方公会 ID', '公会名称', 'MCN 目录状态', '当前公司比例', '操作']}
            rows={platform.targetGuilds.map((guild) => {
              const editable = guild.authoritative && guild.directoryStatus === 'NORMAL' && ['ACTIVE', 'ENABLED'].includes(guild.guildStatus.toUpperCase())
              const activeShare = guild.operatingShareRate == null ? null : `${(guild.operatingShareRate * 100).toFixed(2)}%`
              const pendingShare = guild.pendingOperatingShareRate == null ? null : `${(guild.pendingOperatingShareRate * 100).toFixed(2)}%`
              const shareLabel = pendingShare
                ? `${activeShare ? `当前 ${activeShare} · ` : ''}待审批 V${guild.pendingShareVersion}：${pendingShare}`
                : activeShare ?? '未配置'
              return [guild.countryCode, guild.officialGuildId, guild.guildName, `${guild.directoryStatus} / ${guild.guildStatus}`, shareLabel, editable ? <button key={`${platform.platformCode}:${guild.officialGuildId}-edit`} className="ghost-btn small-btn" disabled={loading || !canRunControlledIncome} onClick={() => onEditShare(platform.platformCode, guild.officialGuildId, guild.guildName)}>编辑分成</button> : '仅可配置 MCN 正常且启用的公会']
            })}
            emptyText="MCN 权威公会目录暂无数据；请检查公会目录同步状态。"
          />
          <InlineHint text="此处显示 MCN 权威公会目录。公司分成比例按版本、审批与生效时间管理；收入候选只会读取收入发生时已启用的比例快照。它不改变 MCN 原始收入，也不会产生发奖。" />
        </InfoCard>
      ))}
      {!integrations ? <EmptyState title="平台配置待加载" description="进入本页会自动加载；也可以点击刷新配置。" /> : null}
      {integrations?.length === 0 ? <EmptyState title="尚未初始化平台配置" description="本地环境请重启后端完成初始配置；生产环境请检查数据库迁移是否完成。" /> : null}
    </div>
  </PanelSection>
}
