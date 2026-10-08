import { useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, Result, Segmented, Space, Statistic, Table, Tag, Typography } from 'antd'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import {
  getAdminPlatformGuildDirectory,
  getAdminPlatformGuildDirectorySyncRuns,
  type PlatformGuildDirectoryItem,
  type PlatformGuildDirectorySyncRun,
} from '../api'
import type { AdminSessionResponse } from '../admin/authApi'
import { formatDateTime } from '../shared/dateTime'
import { statusPresentation } from '../shared/statusPresentation'
import { allowedConsolePlatforms, type ConsolePlatform } from './navigation'
import { onlyConsolePlatform } from './scopeData'

const { Text, Title } = Typography

const tagColors = { success: 'green', warning: 'orange', danger: 'red', primary: 'blue', neutral: 'default' } as const

function StatusTag({ status }: { status: string }) {
  const shown = statusPresentation(status)
  return <Tag color={tagColors[shown.tone]}>{shown.label}</Tag>
}

const directoryColumns: ProColumns<PlatformGuildDirectoryItem>[] = [
  { title: '公会 ID / 名称', key: 'guild', width: 230, render: (_, item) => <Space direction="vertical" size={0}><Text strong>{item.guildName}</Text><Text type="secondary">{item.guildId}</Text></Space> },
  { title: '国家', dataIndex: 'country', width: 100, renderText: (value: string | null) => value || '-' },
  { title: '平台状态', dataIndex: 'guildStatus', width: 110, render: (_, item) => <StatusTag status={item.guildStatus} /> },
  { title: '当前公司分成比例', dataIndex: 'operatingShareRate', width: 145, render: (_, item) => item.operatingShareRate == null ? '未配置' : `${(item.operatingShareRate * 100).toFixed(2)}%` },
  { title: '目录状态', dataIndex: 'directoryStatus', width: 130, render: (_, item) => <StatusTag status={item.directoryStatus} /> },
  { title: 'MCN 更新时间', key: 'mcnUpdated', width: 180, render: (_, item) => formatDateTime(item.mcnRecordUpdatedAt || item.officialUpdatedAt) },
  { title: '最后同步', dataIndex: 'lastSeenAt', width: 180, renderText: (value: string) => formatDateTime(value) },
]

const syncColumns = [
  { title: '平台', dataIndex: 'platformCode', key: 'platformCode' },
  { title: '结果', dataIndex: 'syncStatus', key: 'syncStatus', render: (value: string) => <StatusTag status={value} /> },
  { title: '接收 / 写入 / 缺失', key: 'counts', render: (_: unknown, item: PlatformGuildDirectorySyncRun) => `${item.receivedCount} / ${item.upsertedCount} / ${item.missingCount}` },
  { title: '开始时间', dataIndex: 'startedAt', key: 'startedAt', render: (value: string) => formatDateTime(value) },
  { title: '完成时间', dataIndex: 'completedAt', key: 'completedAt', render: (value: string | null) => formatDateTime(value) },
  { title: '异常', key: 'error', render: (_: unknown, item: PlatformGuildDirectorySyncRun) => item.errorCode ? `${item.errorCode}${item.errorMessage ? ` · ${item.errorMessage}` : ''}` : '-' },
]

export default function GuildDirectoryPage({ session }: { session: AdminSessionResponse }) {
  const platforms = allowedConsolePlatforms(session.platformScope)
  const [platform, setPlatform] = useState<ConsolePlatform>(() => platforms[0] ?? 'LINKY')
  const [directory, setDirectory] = useState<PlatformGuildDirectoryItem[] | null>(null)
  const [runs, setRuns] = useState<PlatformGuildDirectorySyncRun[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!allowedConsolePlatforms(session.platformScope).includes(platform)) return
    let active = true
    void Promise.all([
      getAdminPlatformGuildDirectory(session.sessionToken, platform),
      getAdminPlatformGuildDirectorySyncRuns(session.sessionToken, platform),
    ]).then(([items, syncRuns]) => {
      if (!active) return
      setDirectory(onlyConsolePlatform(items, platform))
      setRuns(onlyConsolePlatform(syncRuns, platform))
    }).catch((reason: unknown) => {
      if (!active) return
      setError(reason instanceof Error ? reason.message : '加载平台公会目录失败')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [platform, refresh, session.platformScope, session.sessionToken])

  function changePlatform(next: ConsolePlatform) {
    setDirectory(null)
    setRuns(null)
    setError('')
    setLoading(true)
    setPlatform(next)
  }

  function refreshDirectory() {
    setDirectory(null)
    setRuns(null)
    setError('')
    setLoading(true)
    setRefresh((value) => value + 1)
  }

  if (!platforms.includes(platform)) return <Result status="403" title="当前账号没有此平台的目录访问范围" />

  const normalCount = directory?.filter((item) => item.directoryStatus === 'NORMAL').length ?? 0
  const missingCount = directory?.filter((item) => item.directoryStatus === 'MISSING_ON_MCN').length ?? 0
  const lastSync = runs?.[0]?.completedAt || directory?.[0]?.lastSeenAt

  return <>
    <Title level={3}>平台公会目录</Title>
    <Text type="secondary">只读查看 MCN 同步的公会事实、异常状态及同步批次；此处不编辑权威公会资料。</Text>
    <div className="new-console-directory-actions">
      <Segmented<ConsolePlatform> value={platform} options={platforms} onChange={changePlatform} aria-label="平台公会目录平台选择" />
      <Button onClick={refreshDirectory} loading={loading}>刷新目录</Button>
    </div>
    {error ? <Alert type="error" showIcon message={error} className="new-console-alert" /> : null}
    <Card title={`${platform} 目录状态`} loading={loading && !directory} className="new-console-directory-summary">
      <div className="new-console-directory-stats">
        <Statistic title="已同步公会" value={directory?.length ?? 0} suffix="个" />
        <Statistic title="正常" value={normalCount} suffix="个" />
        <Statistic title="MCN 已缺失" value={missingCount} suffix="个" />
        <div><Text type="secondary">最后同步</Text><div>{formatDateTime(lastSync)}</div></div>
      </div>
    </Card>
    <ProTable<PlatformGuildDirectoryItem>
      headerTitle="MCN 同步公会"
      rowKey={(item) => `${item.platformCode}-${item.guildId}`}
      columns={directoryColumns}
      dataSource={directory ?? []}
      loading={loading}
      search={false}
      options={false}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      locale={{ emptyText: <Empty description="当前平台还没有同步的公会，请检查最近同步批次。" /> }}
      scroll={{ x: 1075 }}
      cardBordered
    />
    <Text type="secondary">公司分成比例仅显示当前已审批且在生效期内的版本；未配置的公会不会在此页编辑。</Text>
    <Card title="最近同步批次" className="new-console-sync-card">
      <Table<PlatformGuildDirectorySyncRun>
        rowKey="runId"
        columns={syncColumns}
        dataSource={runs ?? []}
        loading={loading}
        scroll={{ x: 1050 }}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: '暂无同步批次；请确认 MCN 目录同步开关已启用。' }}
      />
      <Text type="secondary">出现“MCN 已缺失”或失败批次时，请先核对 MCN 目录事实；系统不会自动删除本地历史记录。</Text>
    </Card>
  </>
}
