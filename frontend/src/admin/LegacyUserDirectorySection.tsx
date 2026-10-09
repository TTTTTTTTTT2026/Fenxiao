import { Copy } from '@phosphor-icons/react'
import type { UserDirectoryOptions, UserPlatformProfileItem, UserPlatformProfileListResponse } from './userDirectoryApi'
import { formatConsumerUserGrade, formatCountryNameZh } from '../shared/catalog'
import { formatDateTime } from '../shared/dateTime'
import { DataTable, InfoCard, InlineHint, PanelSection } from './LegacyPresentation'

export type UserPlatformQuery = {
  userId: string; operatorAdminId: string; valueCode: string; countryCode: string
  localPhone: string; linkyGuildId: string; timoGuildId: string; page: string; size: string
}

type Props = {
  query: UserPlatformQuery
  options: UserDirectoryOptions | null
  onQueryChange: (query: UserPlatformQuery) => void
  onSearch: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  profiles: UserPlatformProfileListResponse | null
  loading: boolean
  canManageCountry: boolean
  canManageLinkyInvitationGuild: boolean
  canManagePasswordLogin: boolean
  canManageOperations: boolean
  onCopyInviteCode: (inviteCode: string) => void
  onAdjustCountry: (item: UserPlatformProfileItem) => void
  onAdjustLinkyInvitationGuild: (item: UserPlatformProfileItem) => void
  onPasswordLogin: (item: UserPlatformProfileItem, mode: 'set' | 'disable') => void
  onEditOperations: (item: UserPlatformProfileItem, field: 'operator' | 'value') => void
}

export default function LegacyUserDirectorySection({
  query, options, onQueryChange, onSearch, onPageChange, onPageSizeChange, profiles, loading,
  canManageCountry, canManageLinkyInvitationGuild, canManagePasswordLogin, canManageOperations,
  onCopyInviteCode, onAdjustCountry, onAdjustLinkyInvitationGuild, onPasswordLogin, onEditOperations,
}: Props) {
  const page = profiles?.page ?? 0
  const size = profiles?.size ?? Number(query.size || 20)
  const totalPages = profiles ? Math.ceil(profiles.total / size) : 0
  return <PanelSection sectionId="admin-users" eyebrow="User directory" title="用户信息与平台归属"
    description="按注册时间从近到远展示用户。对接运营是全局唯一当前负责人；用户价值默认一般用户，修改均保留历史。">
    <div className="stack-gap">
      <InfoCard title="查询用户信息" tone="neutral">
        <form onSubmit={(event) => { event.preventDefault(); onSearch() }}>
          <div className="grid-form compact-form exception-filter-grid">
            <label>用户 ID<input inputMode="numeric" value={query.userId} onChange={(event) => onQueryChange({ ...query, userId: event.target.value.replace(/\D/g, '') })} placeholder="例如 1001" /></label>
            <label>对接运营<select value={query.operatorAdminId} onChange={(event) => onQueryChange({ ...query, operatorAdminId: event.target.value })}>
              <option value="">全部</option><option value="UNASSIGNED">未分配</option>
              {(options?.operators ?? []).map((operator) => <option key={operator.id} value={operator.id}>{operator.displayName}（{operator.username}）{operator.enabled ? '' : ' · 已停用'}</option>)}
            </select></label>
            <label>用户价值<select value={query.valueCode} onChange={(event) => onQueryChange({ ...query, valueCode: event.target.value })}>
              <option value="">全部</option><option value="GENERAL">一般用户</option><option value="HIGH_VALUE">高价值用户</option>
            </select></label>
            <label>归属国家<select value={query.countryCode} onChange={(event) => onQueryChange({ ...query, countryCode: event.target.value })}>
              <option value="">全部</option>{(options?.countries ?? []).map((country) => <option key={country} value={country}>{formatCountryNameZh(country)}（{country}）</option>)}
            </select></label>
            <label>手机号（本地号码）<input inputMode="numeric" pattern="[0-9]{7,15}" value={query.localPhone} onChange={(event) => onQueryChange({ ...query, localPhone: event.target.value.replace(/\D/g, '') })} placeholder="无需国家区号" /></label>
            <label>Linky 公会<select value={query.linkyGuildId} onChange={(event) => onQueryChange({ ...query, linkyGuildId: event.target.value })}>
              <option value="">全部</option>{(options?.linkyGuilds ?? []).map((guild) => <option key={guild.guildId} value={guild.guildId}>{guild.guildName || guild.guildId}（{guild.guildId}）</option>)}
            </select></label>
            <label>Timo 公会<select value={query.timoGuildId} onChange={(event) => onQueryChange({ ...query, timoGuildId: event.target.value })}>
              <option value="">全部</option>{(options?.timoGuilds ?? []).map((guild) => <option key={guild.guildId} value={guild.guildId}>{guild.guildName || guild.guildId}</option>)}
            </select></label>
          </div>
          <div className="action-row"><button className="primary-btn" type="submit" disabled={loading}>{loading ? '搜索中…' : '搜索'}</button></div>
        </form>
        <InlineHint text="多个条件同时生效；手机号只输入完整本地号码。公会筛选依据实际平台绑定，不依据 Linky 邀请链归属。" />
      </InfoCard>
      <InfoCard title="用户与平台核验信息" tone="neutral">
        <DataTable headers={['用户', '对接运营', '用户价值', '邀请码', '归属国家', '用户等级', '手机号', '密码登录', '注册时间', '直接邀请人', 'Linky 实际绑定', 'Timo 实际绑定', 'Linky 邀请链归属', '操作']}
          rows={(profiles?.items ?? []).map((item) => [
            <div className="stack-gap small"><strong>#{item.userId}</strong>{item.nickname ? <span>{item.nickname}</span> : null}</div>,
            item.operatorAdminId == null ? '未分配' : `${item.operatorName || '运营账号'} #${item.operatorAdminId}`,
            item.valueCode === 'HIGH_VALUE' ? '高价值用户' : '一般用户',
            item.inviteCode ? <div className="invite-code-cell"><span>{item.inviteCode}</span><button className="ghost-btn small-btn invite-code-copy-btn" type="button" onClick={() => onCopyInviteCode(item.inviteCode)} aria-label={`复制邀请码 ${item.inviteCode}`} title="复制邀请码"><Copy size={15} weight="bold" aria-hidden="true" /></button></div> : '-',
            formatCountryNameZh(item.countryCode), formatConsumerUserGrade(item.userGradeCode, 'zh'),
            item.phoneNumber || '-', item.passwordLoginEnabled ? '已开通' : '未开通',
            formatDateTime(item.registeredAt),
            item.directInviterUserId == null ? '根节点' : <div className="stack-gap small"><strong>#{item.directInviterUserId}</strong>{item.directInviterNickname ? <span>{item.directInviterNickname}</span> : null}</div>,
            item.linky ? <div className="stack-gap small"><strong>{item.linky.accountId}</strong><span>{item.linky.status} · {item.linky.guildName || item.linky.guildId || '未返回公会'}{item.linky.expectedGuildSource ? ` · 目标来源 ${item.linky.expectedGuildSource}` : ''}</span></div> : '-',
            item.timo ? <div className="stack-gap small"><strong>{item.timo.accountId}</strong><span>{item.timo.status} · {item.timo.guildId || '未返回公会'}</span></div> : '-',
            item.invitationGuild ? <div className="stack-gap small"><strong>{item.invitationGuild.guildName} · {item.invitationGuild.guildId}</strong><span>{item.invitationGuild.source}{item.invitationGuild.inheritedFromUserId ? ` · 继承自 #${item.invitationGuild.inheritedFromUserId}` : ''}</span></div> : '-',
            canManageCountry || canManageLinkyInvitationGuild || canManagePasswordLogin || canManageOperations ? <div className="action-row">
              {canManageOperations ? <button className="ghost-btn small-btn" onClick={() => onEditOperations(item, 'operator')}>设置对接运营</button> : null}
              {canManageOperations ? <button className="ghost-btn small-btn" onClick={() => onEditOperations(item, 'value')}>设置用户价值</button> : null}
              {canManageCountry ? <button className="ghost-btn small-btn" onClick={() => onAdjustCountry(item)}>调整国家</button> : null}
              {canManageLinkyInvitationGuild ? <button className="ghost-btn small-btn" onClick={() => onAdjustLinkyInvitationGuild(item)}>调整 Linky 归属</button> : null}
              {canManagePasswordLogin && item.phoneNumber ? <button className="ghost-btn small-btn" onClick={() => onPasswordLogin(item, 'set')}>{item.passwordLoginEnabled ? '重设登录密码' : '开通密码登录'}</button> : null}
              {canManagePasswordLogin && item.passwordLoginEnabled ? <button className="ghost-btn small-btn" onClick={() => onPasswordLogin(item, 'disable')}>关闭密码登录</button> : null}
            </div> : '只读',
          ])} emptyText="没有符合条件的用户。" />
        <div className="action-row admin-user-directory-pagination">
          <span role="status">共 {profiles?.total ?? 0} 位用户 · 第 {page + 1} / {Math.max(1, totalPages)} 页</span>
          <button type="button" className="ghost-btn small-btn" disabled={loading || page === 0} onClick={() => onPageChange(page - 1)}>上一页</button>
          <button type="button" className="ghost-btn small-btn" disabled={loading || page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>下一页</button>
          <label>每页数量 <select value={query.size} onChange={(event) => onPageSizeChange(Number(event.target.value))}><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></label>
        </div>
      </InfoCard>
    </div>
  </PanelSection>
}
