import type { PlatformIntegrationResponse } from '../api'
import { phoneCountries } from '../shared/catalog'
import { DataTable } from './LegacyPresentation'

export default function LegacyPlatformGuildTable({ platform, loading, canEditShare, canEditCountries, onEditShare, onEditCountries }: {
  platform: PlatformIntegrationResponse; loading: boolean; canEditShare: boolean; canEditCountries: boolean
  onEditShare: (guildId: string, guildName: string) => void; onEditCountries: (guildId: string) => void
}) {
  return <DataTable headers={['公会所属国家（MCN）', '官方公会 ID', '公会名称', '可接纳用户国家', 'MCN 目录状态', '当前公司比例', '操作']}
    rows={platform.targetGuilds.map(guild => {
      const editable = guild.authoritative && guild.directoryStatus === 'NORMAL' && ['ACTIVE', 'ENABLED'].includes(guild.guildStatus.toUpperCase())
      const activeShare = guild.operatingShareRate == null ? null : `${(guild.operatingShareRate * 100).toFixed(2)}%`
      const pendingShare = guild.pendingOperatingShareRate == null ? null : `${(guild.pendingOperatingShareRate * 100).toFixed(2)}%`
      const shareLabel = pendingShare ? `${activeShare ? `当前 ${activeShare} · ` : ''}待审批 V${guild.pendingShareVersion}：${pendingShare}` : activeShare ?? '未配置'
      const acceptedCountries = guild.acceptedCountryCodes == null ? '-' : guild.acceptedCountryCodes.length
        ? guild.acceptedCountryCodes.map(code => phoneCountries.find(country => country.countryCode === code)?.names.zh ?? code).join('、') : '不接纳新绑定'
      const mcnCountry = !guild.authoritative ? '待MCN同步' : guild.countryCode === 'UNKNOWN' ? 'MCN未提供' : guild.countryCode
      return [mcnCountry, guild.officialGuildId, guild.guildName, acceptedCountries, `${guild.directoryStatus} / ${guild.guildStatus}`, shareLabel,
        editable ? <div className="dialog-actions" key={`${platform.platformCode}:${guild.officialGuildId}-actions`}>
          <button className="ghost-btn small-btn" disabled={loading || !canEditShare} onClick={() => onEditShare(guild.officialGuildId, guild.guildName)}>编辑分成</button>
          {platform.platformCode === 'TIMO' && canEditCountries ? <button className="ghost-btn small-btn" disabled={loading}
            onClick={() => onEditCountries(guild.officialGuildId)}>配置接纳国家</button> : null}
        </div> : '仅可配置 MCN 正常且启用的公会']
    })} emptyText="MCN 权威公会目录暂无数据；请检查公会目录同步状态。" />
}
