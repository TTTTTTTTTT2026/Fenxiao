import type { MentorIncentiveDashboardResponse } from './mentorReadApi'
import { EmptyState, InfoCard, InlineHint, PanelSection, RelationItem } from './LegacyPresentation'

type Mentor = MentorIncentiveDashboardResponse['mentors'][number]

type Props = {
  dashboard: MentorIncentiveDashboardResponse | null
  loading: boolean
  canManageMentorRelations: boolean
  onRefresh: () => void
  onNewQualification: () => void
  onEditQualification: (mentor: Mentor) => void
  onEditStudents: (mentor: Mentor) => void
}

export default function LegacyMentorDirectorySection({ dashboard, loading, canManageMentorRelations, onRefresh, onNewQualification, onEditQualification, onEditStudents }: Props) {
  return <PanelSection sectionId="admin-mentors" eyebrow="Mentor directory · relationship management" title="导师列表" description="在此维护导师资格和导师可携带的学员。导师关系独立于邀请关系，所有变更均保留版本记录；本页不配置分成规则，也不会产生奖励或付款。" action={<button className="ghost-btn" onClick={onRefresh} disabled={loading}>刷新列表</button>}>
    <div className="stack-gap">
      <InfoCard title="导师与学员概览" tone="neutral">
        {dashboard ? <div className="relation-grid"><RelationItem label="具备资格的导师" value={dashboard.qualifiedMentorCount} /><RelationItem label="当前已归属学员" value={dashboard.assignedStudentCount} /></div> : <EmptyState title="尚未读取导师列表" description="点击“刷新列表”读取导师资格与当前学员数量。" />}
        <InlineHint text="“编辑学员”只会新增或切换该导师的学员归属版本，不会改写历史导师关系。" />
      </InfoCard>
      {canManageMentorRelations ? <InfoCard title="导师资格" tone="neutral"><p>建立导师资格后，才可以为该导师配置可携带的学员。已建立的资格可在列表中修改归属国家和带教上限。</p><button className="primary-btn top-gap" onClick={onNewQualification} disabled={loading}>新建导师资格</button></InfoCard> : null}
      <InfoCard title="导师列表" tone="neutral">
        {dashboard?.mentors.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>导师信息</th><th>归属国家 / 语言</th><th>资格状态</th><th>学员数量</th><th>带教上限</th><th>操作</th></tr></thead><tbody>{dashboard.mentors.map((mentor) => <tr key={mentor.userId}><td>用户 {mentor.userId}{mentor.phoneNumber ? ` · ${mentor.phoneNumber}` : ''}</td><td>{mentor.countryCode} / {mentor.languageCode}</td><td>{mentor.qualificationStatus === 'QUALIFIED' ? '已具备资格' : mentor.qualificationStatus}</td><td>{mentor.assignedStudentCount}</td><td>{mentor.maxActiveStudents}</td><td>{canManageMentorRelations ? <div className="action-row"><button className="ghost-btn small-btn" onClick={() => onEditQualification(mentor)} disabled={loading}>编辑资格</button><button className="primary-btn small-btn" onClick={() => onEditStudents(mentor)} disabled={loading}>编辑学员</button></div> : '-'}</td></tr>)}</tbody></table></div> : <EmptyState title="尚未建立导师资格" description="先通过“新建导师资格”添加一位导师。" />}
      </InfoCard>
    </div>
  </PanelSection>
}
