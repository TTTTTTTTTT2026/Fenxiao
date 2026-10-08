import { useState } from 'react'
import { Alert, Empty, Space, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { getAdminUserPlatformProfiles, type UserPlatformProfileItem } from '../admin/userDirectoryApi'
import type { AdminSessionResponse } from '../admin/authApi'
import { formatConsumerUserGrade, formatCountryNameZh } from '../shared/catalog'
import { formatDateTime } from '../shared/dateTime'
import { userListFilters } from './userListModel'

const { Text, Title } = Typography

const columns: ProColumns<UserPlatformProfileItem>[] = [
  { title: '用户 ID', dataIndex: 'userId', hideInTable: true, fieldProps: { inputMode: 'numeric', placeholder: '留空查看最近注册用户' } },
  { title: '用户', key: 'user', width: 135, search: false, render: (_, item) => <Space direction="vertical" size={0}><Text strong>#{item.userId}</Text><Text type="secondary">{item.nickname || '未设置昵称'}</Text></Space> },
  { title: '邀请码', dataIndex: 'inviteCode', width: 130, search: false, renderText: (value: string) => value || '-' },
  { title: '归属国家', dataIndex: 'countryCode', width: 105, search: false, renderText: (value: string) => formatCountryNameZh(value) },
  { title: '用户等级', dataIndex: 'userGradeCode', width: 110, search: false, renderText: (value: string) => formatConsumerUserGrade(value, 'zh') },
  { title: '手机号', dataIndex: 'phoneNumber', width: 160, search: false, renderText: (value: string | null) => value || '-' },
  { title: '密码登录', dataIndex: 'passwordLoginEnabled', width: 100, search: false, render: (_, item) => item.passwordLoginEnabled ? <Tag color="green">已开通</Tag> : <Tag>未开通</Tag> },
  { title: '注册时间', dataIndex: 'registeredAt', width: 180, search: false, renderText: (value: string) => formatDateTime(value) },
  { title: '直接邀请人', key: 'inviter', width: 135, search: false, render: (_, item) => item.directInviterUserId == null ? '根节点' : <Space direction="vertical" size={0}><Text strong>#{item.directInviterUserId}</Text><Text type="secondary">{item.directInviterNickname || '未设置昵称'}</Text></Space> },
  { title: 'Linky 实际绑定', key: 'linky', width: 205, search: false, render: (_, item) => item.linky ? <Space direction="vertical" size={0}><Text strong>{item.linky.accountId}</Text><Text type="secondary">{item.linky.status} · {item.linky.guildName || item.linky.guildId || '未返回公会'}{item.linky.expectedGuildSource ? ` · 目标来源 ${item.linky.expectedGuildSource}` : ''}</Text></Space> : '-' },
  { title: 'Timo 实际绑定', key: 'timo', width: 205, search: false, render: (_, item) => item.timo ? <Space direction="vertical" size={0}><Text strong>{item.timo.accountId}</Text><Text type="secondary">{item.timo.status} · {item.timo.guildId || '未返回公会'}</Text></Space> : '-' },
  { title: 'Linky 邀请链归属', key: 'invitationGuild', width: 240, search: false, render: (_, item) => item.invitationGuild ? <Space direction="vertical" size={0}><Text strong>{item.invitationGuild.guildName} · {item.invitationGuild.guildId}</Text><Text type="secondary">{item.invitationGuild.source}{item.invitationGuild.inheritedFromUserId ? ` · 继承自 #${item.invitationGuild.inheritedFromUserId}` : ''}</Text></Space> : '-' },
]

export default function UserDirectoryPage({ session }: { session: AdminSessionResponse }) {
  const [queryError, setQueryError] = useState('')

  return <>
    <Title level={3}>用户列表</Title>
    <Text type="secondary">按注册时间从近到远显示；仅查看现有后台接口的数据，用户调整操作暂在旧版后台完成。</Text>
    {queryError ? <Alert type="error" showIcon message={queryError} className="new-console-alert" /> : null}
    <ProTable<UserPlatformProfileItem>
      rowKey="userId"
      columns={columns}
      request={async (params) => {
        setQueryError('')
        try {
          const filters = userListFilters({ userId: params.userId, current: params.current, pageSize: params.pageSize })
          const result = await getAdminUserPlatformProfiles(session.sessionToken, filters)
          return { data: result.items, total: result.total, success: true }
        } catch (error) {
          setQueryError(error instanceof Error ? error.message : '用户列表加载失败')
          return { data: [], total: 0, success: false }
        }
      }}
      search={{ labelWidth: 'auto' }}
      pagination={{ defaultPageSize: 20, pageSizeOptions: ['20', '50', '100'], showSizeChanger: true }}
      options={{ density: true, reload: true, setting: false }}
      locale={{ emptyText: <Empty description="暂无符合条件的用户" /> }}
      scroll={{ x: 1800 }}
      cardBordered
    />
  </>
}
