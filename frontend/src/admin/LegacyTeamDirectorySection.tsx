import type { TeamManagementDashboardResponse, TeamManagementItemResponse } from './teamReadApi'
import { formatDateTime } from '../shared/dateTime'
import { EmptyState, InfoCard, InlineHint, PanelSection, RelationItem } from './LegacyPresentation'

type Props = {
  dashboard: TeamManagementDashboardResponse | null
  loading: boolean
  onRefresh: () => void
  onViewMembers: (team: TeamManagementItemResponse) => void
}

export default function LegacyTeamDirectorySection({ dashboard, loading, onRefresh, onViewMembers }: Props) {
  return <PanelSection sectionId="admin-teams" eyebrow="Team governance · appointment control" title="团队列表" description="金牌达标会自动建立团队并写入负责人资格记录；高级等级须完成培养、经营、职责确认后再正式任命。运营不可绕过该流程授予负责人，也不能修改历史归属。" action={<button className="ghost-btn" onClick={onRefresh} disabled={loading}>刷新数据</button>}>
    <div className="stack-gap">
      <InfoCard title="团队治理概览" tone="neutral">
        {dashboard ? <div className="relation-grid"><RelationItem label="已确认负责人团队" value={dashboard.leaderTeamCount} /><RelationItem label="有效团队" value={dashboard.activeTeamCount} /><RelationItem label="已许可经营分成" value={dashboard.operatingProfitShareEnabledTeamCount} /><RelationItem label="当前成员归属" value={dashboard.activeMemberRelationCount} /></div> : <EmptyState title="尚未读取团队数据" description="点击“刷新数据”读取当前团队及成员归属。" />}
        <InlineHint text="成员归属采用可叠加的历史关系：用户成为新团队负责人后，可保留在上级团队的成员记录。负责人资格、建队和任命状态独立留存；团队经营利润分成全局关闭，当前不能逐团队开启，不会产生奖励、余额、提现或付款。" />
      </InfoCard>
      <InfoCard title="团队经营与成员" tone="neutral">
        {dashboard?.teams.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>团队</th><th>负责人</th><th>负责人状态</th><th>团队经营奖励</th><th>上级团队</th><th>当前成员</th><th>最近经营事实</th><th>建立时间</th><th>操作</th></tr></thead><tbody>{dashboard.teams.map((team) => <tr key={team.teamId}><td>{team.teamName}<small className="table-subtle">{team.teamCode} / {team.countryCode}</small></td><td>{team.leaderUserId ? `用户 ${team.leaderUserId}${team.leaderPhoneNumber ? ` · ${team.leaderPhoneNumber}` : ''}` : '待自动产生'}</td><td>{team.leaderAppointmentStatus === 'CONFIRMED' ? '已正式任命' : team.leaderAppointmentStatus === 'AUTO_CONFIRMED' ? '金牌自动确认' : team.leaderAppointmentStatus === 'LEGACY_UNVERIFIED' ? '历史待核验' : '不适用'}<small className="table-subtle">资格：{team.leaderQualificationStatus} / 建队：{team.teamEstablishmentStatus}</small></td><td>全局关闭<small className="table-subtle">独立方案确认前不可启用</small></td><td>{team.parentTeamCode || '—'}</td><td>{team.activeMemberCount}</td><td>{team.latestOperatingProfitMinor === null ? '尚无经营事实' : `${team.latestPlatformCode} · ${team.latestOperatingProfitMinor} ${team.latestCurrencyCode}（截至 ${team.latestPeriodEnd}）`}</td><td>{formatDateTime(team.createdAt)}</td><td><button className="ghost-btn small-btn" onClick={() => onViewMembers(team)} disabled={loading}>查看成员</button></td></tr>)}</tbody></table></div> : <EmptyState title="尚无团队记录" description="用户达到金牌等级后，系统会自动建立团队并保留负责人资格记录；不会模拟创建团队。" />}
      </InfoCard>
    </div>
  </PanelSection>
}
