import { Copy } from '@phosphor-icons/react'
import type { UserPlatformProfileItem, UserPlatformProfileListResponse } from '../api'
import { formatConsumerUserGrade, formatCountryNameZh } from '../shared/catalog'
import { formatDateTime } from '../shared/dateTime'
import { DataTable, InfoCard, InlineHint, PanelSection } from './LegacyPresentation'

export type UserPlatformQuery = { userId: string; page: string; size: string }

type Props = {
  query: UserPlatformQuery
  onQueryChange: (query: UserPlatformQuery) => void
  profiles: UserPlatformProfileListResponse | null
  loading: boolean
  canManageCountry: boolean
  canManageLinkyInvitationGuild: boolean
  canManagePasswordLogin: boolean
  onRefresh: () => void
  onCopyInviteCode: (inviteCode: string) => void
  onAdjustCountry: (item: UserPlatformProfileItem) => void
  onAdjustLinkyInvitationGuild: (item: UserPlatformProfileItem) => void
  onPasswordLogin: (item: UserPlatformProfileItem, mode: 'set' | 'disable') => void
}

export default function LegacyUserDirectorySection({
  query, onQueryChange, profiles, loading, canManageCountry, canManageLinkyInvitationGuild,
  canManagePasswordLogin, onRefresh, onCopyInviteCode, onAdjustCountry, onAdjustLinkyInvitationGuild, onPasswordLogin,
}: Props) {
  return <PanelSection
    sectionId="admin-users"
    eyebrow="User directory"
    title="用户信息与平台归属"
    description="按注册时间从近到远展示用户，并集中查询邀请码关系、平台绑定事实与 Linky 邀请链归属。用户归属国家与 Linky 邀请链归属是两项独立设置。"
    action={<button className="primary-btn" onClick={onRefresh} disabled={loading}>{loading ? '加载中…' : '刷新用户'}</button>}
  >
    <div className="stack-gap">
      <InfoCard title="查询用户信息" tone="neutral">
        <div className="grid-form compact-form exception-filter-grid">
          <label>用户 ID（留空查看列表）<input inputMode="numeric" value={query.userId} onChange={(event) => onQueryChange({ ...query, userId: event.target.value.replace(/\D/g, ''), page: '0' })} placeholder="例如 1001" /></label>
          <label>每页数量<select value={query.size} onChange={(event) => onQueryChange({ ...query, size: event.target.value, page: '0' })}><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></label>
        </div>
        <InlineHint text="实际 Linky / Timo 公会是平台核验事实；调整用户归属国家不会更改平台公会。Linky 邀请链归属决定该用户邀请新下级时使用的目标公会。" />
      </InfoCard>
      <InfoCard title="用户与平台核验信息" tone="neutral">
        <DataTable
          headers={['用户', '邀请码', '归属国家', '用户等级', '手机号', '密码登录', '注册时间', '直接邀请人', 'Linky 实际绑定', 'Timo 实际绑定', 'Linky 邀请链归属', '操作']}
          rows={(profiles?.items ?? []).map((item) => [
            <div className="stack-gap small"><strong>#{item.userId}</strong>{item.nickname ? <span>{item.nickname}</span> : null}</div>,
            item.inviteCode ? <div className="invite-code-cell"><span>{item.inviteCode}</span><button className="ghost-btn small-btn invite-code-copy-btn" type="button" onClick={() => onCopyInviteCode(item.inviteCode)} aria-label={`复制邀请码 ${item.inviteCode}`} title="复制邀请码"><Copy size={15} weight="bold" aria-hidden="true" /></button></div> : '-',
            formatCountryNameZh(item.countryCode),
            formatConsumerUserGrade(item.userGradeCode, 'zh'),
            item.phoneNumber || '-',
            item.passwordLoginEnabled ? '已开通' : '未开通',
            formatDateTime(item.registeredAt),
            item.directInviterUserId == null ? '根节点' : <div className="stack-gap small"><strong>#{item.directInviterUserId}</strong>{item.directInviterNickname ? <span>{item.directInviterNickname}</span> : null}</div>,
            item.linky ? <div className="stack-gap small"><strong>{item.linky.accountId}</strong><span>{item.linky.status} · {item.linky.guildName || item.linky.guildId || '未返回公会'}{item.linky.expectedGuildSource ? ` · 目标来源 ${item.linky.expectedGuildSource}` : ''}</span></div> : '-',
            item.timo ? <div className="stack-gap small"><strong>{item.timo.accountId}</strong><span>{item.timo.status} · {item.timo.guildId || '未返回公会'}</span></div> : '-',
            item.invitationGuild ? <div className="stack-gap small"><strong>{item.invitationGuild.guildName} · {item.invitationGuild.guildId}</strong><span>{item.invitationGuild.source}{item.invitationGuild.inheritedFromUserId ? ` · 继承自 #${item.invitationGuild.inheritedFromUserId}` : ''}</span></div> : '-',
            canManageCountry || canManageLinkyInvitationGuild || canManagePasswordLogin ? <div className="action-row">{canManageCountry ? <button className="ghost-btn small-btn" onClick={() => onAdjustCountry(item)}>调整国家</button> : null}{canManageLinkyInvitationGuild ? <button className="ghost-btn small-btn" onClick={() => onAdjustLinkyInvitationGuild(item)}>调整 Linky 归属</button> : null}{canManagePasswordLogin && item.phoneNumber ? <button className="ghost-btn small-btn" onClick={() => onPasswordLogin(item, 'set')}>{item.passwordLoginEnabled ? '重设登录密码' : '开通密码登录'}</button> : null}{canManagePasswordLogin && item.passwordLoginEnabled ? <button className="ghost-btn small-btn" onClick={() => onPasswordLogin(item, 'disable')}>关闭密码登录</button> : null}</div> : '只读',
          ])}
          emptyText="输入用户 ID 后查询，或直接查询查看近期用户。"
        />
        {profiles ? <InlineHint text={`共 ${profiles.total} 位用户；当前第 ${profiles.page + 1} 页。`} /> : null}
      </InfoCard>
    </div>
  </PanelSection>
}
